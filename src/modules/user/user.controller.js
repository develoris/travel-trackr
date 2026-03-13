import {
  createUser,
  deleteUserById,
  getUserById,
  listUsers,
  loginUser,
  logoutUserSession,
  refreshUserTokens,
  registerUser,
  updateUserById
} from "./user.service.js";
import { AppError } from "../../core/errors/app-error.js";

export const getUsers = async (_req, res) => {
  const users = await listUsers();
  return res.json(users);
};

export const getUser = async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      developerMessage: `User ${req.params.id} not found`
    });
  }

  return res.json(user);
};

export const postUser = async (req, res) => {
  const user = await createUser(req.body);
  return res.status(201).json(user);
};

export const signIn = async (req, res) => {
  const { email, password, name } = req.body;
  const user = await registerUser({ email, password, name });

  if (!user) {
    throw new AppError({
      code: "EMAIL_ALREADY_REGISTERED",
      status: 409,
      userMessage: "Email gia registrata.",
      developerMessage: `Email ${email} already exists`
    });
  }

  return res.status(201).json({
    message: "Registrazione completata. Esegui il login per ottenere i token.",
    user
  });
};

const isProduction = process.env.NODE_ENV === "production";

const REFRESH_TOKEN_COOKIE = "tt.rt";

// Il refresh token e conservato in cookie HttpOnly, non nel body.
const setRefreshTokenCookie = (res, refreshToken) => {
  const maxAge = Number(process.env.REFRESH_TOKEN_DAYS || 30) * 24 * 60 * 60 * 1000;
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    // Scopo ristretto: il cookie viene inviato solo alla route di refresh.
    path: "/users/refresh",
    maxAge
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/users/refresh" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  if (!result) {
    throw new AppError({
      code: "INVALID_CREDENTIALS",
      status: 401,
      userMessage: "Credenziali non valide.",
      developerMessage: `Login failed for ${email}`
    });
  }

  const { user, tokens } = result;

  // refresh token in cookie, access token nel JSON di risposta.
  setRefreshTokenCookie(res, tokens.refreshToken);

  return res.status(200).json({ message: "Login effettuato", user, accessToken: tokens.accessToken });
};

export const refreshSession = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw new AppError({
      code: "MISSING_REFRESH_TOKEN",
      status: 401,
      userMessage: "Sessione scaduta, esegui di nuovo il login.",
      developerMessage: "Refresh cookie missing"
    });
  }

  try {
    // Se il refresh e valido, ruotiamo entrambi i token.
    const tokens = await refreshUserTokens(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken);
    return res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    // Mappatura codici dominio -> AppError centralizzato.
    if (error.code === "EXPIRED_REFRESH_TOKEN") {
      throw new AppError({
        code: "EXPIRED_REFRESH_TOKEN",
        status: 401,
        userMessage: "Refresh token scaduto.",
        developerMessage: "Refresh token expired"
      });
    }

    if (error.code === "INVALID_SESSION") {
      throw new AppError({
        code: "INVALID_SESSION",
        status: 401,
        userMessage: "Sessione non valida.",
        developerMessage: "Session invalid while refreshing token"
      });
    }

    throw new AppError({
      code: "INVALID_REFRESH_TOKEN",
      status: 401,
      userMessage: "Refresh token non valido.",
      developerMessage: "Invalid refresh token"
    });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return res.status(204).send();
  }

  try {
    await logoutUserSession(refreshToken);
  } catch (_error) {
    // Anche in caso di errore lato service, lato client forziamo la pulizia cookie.
  }

  clearRefreshTokenCookie(res);
  return res.status(204).send();
};

export const patchUser = async (req, res) => {
  const user = await updateUserById(req.params.id, req.body);

  if (!user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      developerMessage: `User ${req.params.id} not found for update`
    });
  }

  return res.json(user);
};

export const removeUser = async (req, res) => {
  const user = await deleteUserById(req.params.id);

  if (!user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      developerMessage: `User ${req.params.id} not found for delete`
    });
  }

  return res.status(204).send();
};
