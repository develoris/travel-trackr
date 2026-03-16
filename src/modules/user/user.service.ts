import { User } from "./user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type {
  CreateUserByAdminPayload,
  CreateUserPayload,
  DeleteUserByAdminPayload,
  DeleteUserByAdminResult,
  LoginBlockedResult,
  LoginPayload,
  LoginResult,
  RegisterUserPayload,
  SetUserBlockedByAdminPayload,
  SetUserBlockedByAdminResult,
  TokenPair,
  UpdateUserPasswordPayload,
  UpdateUserPasswordResult,
  UserDocument
} from "./user.types.js";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "dev-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret";
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

// I token non vengono salvati in chiaro: persistiamo solo l'hash.
const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRefreshExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  return expiresAt;
};

const buildTokenPayload = (user: UserDocument) => ({
  sub: String(user._id),
  role: user.role
});

interface AuthError extends Error {
  code: string;
}

const buildAuthError = (code: string): AuthError => {
  const error = new Error(code) as AuthError;
  error.code = code;
  return error;
};

// Genera access+refresh token e aggiorna lo stato auth utente (token rotation).
const issueTokensForUser = async (user: UserDocument): Promise<TokenPair> => {
  const payload = buildTokenPayload(user);
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: `${REFRESH_TOKEN_DAYS}d`
  });

  user.auth = {
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: getRefreshExpiryDate(),
    lastLoginAt: new Date()
  };
  await user.save();

  return { accessToken, refreshToken };
};

export const listUsers = () => User.find().sort({ createdAt: -1 });

export const getUserById = (id: string) => User.findById(id);

export const getUserByEmail = (email: string) =>
  User.findOne({ email: email.toLowerCase().trim() });

export const createUser = async (payload: Partial<CreateUserPayload>) => {
  const user = new User(payload);
  return user.save();
};

export const registerUser = async (_payload: RegisterUserPayload): Promise<null> => {
  // La registrazione self-service e disabilitata: gli utenti vengono creati da admin.
  return null;
};

export const loginUser = async ({
  email,
  password
}: LoginPayload): Promise<LoginResult | LoginBlockedResult | null> => {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.isBlocked) {
    return { user: null, tokens: null, reason: "USER_BLOCKED" };
  }

  const isPasswordValid = await user.verifyPassword(password);

  if (!isPasswordValid) {
    return null;
  }

  const tokens = await issueTokensForUser(user);
  return { user, tokens, reason: null };
};

export const refreshUserTokens = async (
  refreshToken: string
): Promise<TokenPair> => {
  let decoded: jwt.JwtPayload;

  try {
    // Verifica firma/scadenza del refresh token.
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
  } catch (_error) {
    throw buildAuthError("INVALID_REFRESH_TOKEN");
  }

  const user = await getUserById(decoded.sub as string);

  if (!user || !user.auth?.refreshTokenHash) {
    throw buildAuthError("INVALID_SESSION");
  }

  if (
    user.auth.refreshTokenExpiresAt &&
    user.auth.refreshTokenExpiresAt < new Date()
  ) {
    throw buildAuthError("EXPIRED_REFRESH_TOKEN");
  }

  if (user.auth.refreshTokenHash !== hashToken(refreshToken)) {
    throw buildAuthError("INVALID_REFRESH_TOKEN");
  }

  // Se tutto valido, ruota entrambi i token.
  return issueTokensForUser(user);
};

export const logoutUserSession = async (
  refreshToken: string
): Promise<{ revoked: boolean }> => {
  let decoded: jwt.JwtPayload;

  try {
    // In logout ignoriamo scadenza: vogliamo comunque provare a revocare la sessione.
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, {
      ignoreExpiration: true
    }) as jwt.JwtPayload;
  } catch (_error) {
    return { revoked: false };
  }

  const user = await getUserById(decoded.sub as string);

  if (!user || !user.auth?.refreshTokenHash) {
    return { revoked: false };
  }

  if (user.auth.refreshTokenHash !== hashToken(refreshToken)) {
    throw buildAuthError("INVALID_REFRESH_TOKEN");
  }

  user.auth.accessTokenHash = null;
  user.auth.refreshTokenHash = null;
  user.auth.refreshTokenExpiresAt = null;
  await user.save();

  return { revoked: true };
};

export const updateUserById = (id: string, payload: Record<string, unknown>) =>
  User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });

export const deleteUserById = (id: string) => User.findByIdAndDelete(id);

export const createUserByAdmin = async ({
  email,
  name,
  role = "user",
  temporaryPassword
}: CreateUserByAdminPayload) => {
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return null;
  }

  return createUser({
    email,
    name,
    role,
    passwordHash: temporaryPassword,
    mustChangePassword: true,
    temporaryPasswordIssuedAt: new Date()
  });
};

export const updateUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
  requireCurrent = true
}: UpdateUserPasswordPayload): Promise<UpdateUserPasswordResult> => {
  const user = await getUserById(userId);

  if (!user) {
    return { user: null, reason: "USER_NOT_FOUND" };
  }

  if (requireCurrent) {
    const isValidCurrent = await user.verifyPassword(currentPassword || "");

    if (!isValidCurrent) {
      return { user: null, reason: "INVALID_CURRENT_PASSWORD" };
    }
  }

  user.passwordHash = newPassword;
  user.mustChangePassword = false;
  user.temporaryPasswordIssuedAt = null;
  await user.save();

  return { user, reason: null };
};

export const setUserBlockedByAdmin = async ({
  userId,
  blocked,
  requesterId
}: SetUserBlockedByAdminPayload): Promise<SetUserBlockedByAdminResult> => {
  if (String(userId) === String(requesterId)) {
    return { user: null, reason: "SELF_ACTION_NOT_ALLOWED" };
  }

  const user = await getUserById(userId);

  if (!user) {
    return { user: null, reason: "USER_NOT_FOUND" };
  }

  user.isBlocked = Boolean(blocked);
  await user.save();

  return { user, reason: null };
};

export const deleteUserByAdmin = async ({
  userId,
  requesterId
}: DeleteUserByAdminPayload): Promise<DeleteUserByAdminResult> => {
  if (String(userId) === String(requesterId)) {
    return { deleted: null, reason: "SELF_ACTION_NOT_ALLOWED" };
  }

  const deleted = await deleteUserById(userId);

  if (!deleted) {
    return { deleted: null, reason: "USER_NOT_FOUND" };
  }

  return { deleted, reason: null };
};
