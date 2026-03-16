import type { HydratedDocument, Model } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUserAuth {
  accessTokenHash: string | null;
  refreshTokenHash: string | null;
  refreshTokenExpiresAt: Date | null;
  lastLoginAt: Date | null;
}

export interface IUser {
  email: string;
  passwordHash: string;
  role: UserRole;
  name?: string;
  mustChangePassword: boolean;
  temporaryPasswordIssuedAt: Date | null;
  isBlocked: boolean;
  auth: IUserAuth;
}

export interface IUserMethods {
  verifyPassword(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  name?: string;
}

export interface CreateUserPayload {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  mustChangePassword: boolean;
  temporaryPasswordIssuedAt: Date | null;
  isBlocked: boolean;
}

export interface CreateUserByAdminPayload {
  email: string;
  name?: string;
  role?: UserRole;
  temporaryPassword: string;
}

export interface UpdateUserPasswordPayload {
  userId: string;
  currentPassword?: string;
  newPassword: string;
  requireCurrent?: boolean;
}

export interface SetUserBlockedByAdminPayload {
  userId: string;
  blocked: boolean;
  requesterId: string;
}

export interface DeleteUserByAdminPayload {
  userId: string;
  requesterId: string;
}

export interface LoginResult {
  user: UserDocument;
  tokens: TokenPair;
  reason: null;
}

export interface LoginBlockedResult {
  user: null;
  tokens: null;
  reason: "USER_BLOCKED";
}

export type UpdateUserPasswordResult =
  | { user: UserDocument; reason: null }
  | { user: null; reason: "USER_NOT_FOUND" | "INVALID_CURRENT_PASSWORD" };

export type SetUserBlockedByAdminResult =
  | { user: UserDocument; reason: null }
  | { user: null; reason: "SELF_ACTION_NOT_ALLOWED" | "USER_NOT_FOUND" };

export type DeleteUserByAdminResult =
  | { deleted: UserDocument; reason: null }
  | { deleted: null; reason: "SELF_ACTION_NOT_ALLOWED" | "USER_NOT_FOUND" };

export interface WebSessionUser {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  mustChangePassword: boolean;
}
