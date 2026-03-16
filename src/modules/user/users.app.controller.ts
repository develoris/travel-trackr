import type { Request, Response, NextFunction } from "express";
import {
  createUserByAdmin,
  deleteUserByAdmin,
  listUsers,
  loginUser,
  setUserBlockedByAdmin,
  updateUserPassword
} from "./user.service.js";
import { AppError } from "../../core/errors/app-error.js";

// Flash one-shot: letto in render e rimosso alla richiesta successiva.
export const withFlash = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
};

const setFlash = (
  req: Request,
  type: string,
  message: string
): void => {
  req.session.flash = { [type]: message };
};

export const redirectIfAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Se gia autenticato via sessione web, evita di mostrare login/register.
  if (req.session.webUser) return res.redirect("/users/app");
  return next();
};

export const requireWebAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Guardia pagine private EJS.
  if (!req.session.webUser) return res.redirect("/users/app/login");
  return next();
};

export const requireAdminWeb = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.session.webUser || req.session.webUser.role !== "admin") {
    throw new AppError({
      code: "FORBIDDEN",
      status: 403,
      userMessage: "Area riservata agli amministratori.",
      redirectTo: "/users/app"
    });
  }

  return next();
};

export const requirePasswordUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Se la password e temporanea, l'utente puo navigare solo verso profilo/logout.
  if (!req.session.webUser?.mustChangePassword) {
    return next();
  }

  const allowedPaths = [
    "/users/app/profile",
    "/users/app/profile/password",
    "/users/app/logout"
  ];

  if (allowedPaths.includes(req.path)) {
    return next();
  }

  setFlash(req, "error", "Per continuare devi impostare una nuova password.");
  return res.redirect("/users/app/profile");
};

export const redirectToApp = (_req: Request, res: Response): void => {
  res.redirect("/users/app");
};

export const getAppHome = (req: Request, res: Response): void => {
  if (!req.session.webUser) {
    res.redirect("/users/app/login");
    return;
  }

  if (req.session.webUser.mustChangePassword) {
    res.redirect("/users/app/profile");
    return;
  }

  res.redirect("/users/app/travels");
};

export const getAppLogin = (_req: Request, res: Response): void => {
  res.render("auth/login", { user: null });
};

export const postAppLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const result = await loginUser({ email, password });

  if (result?.reason === "USER_BLOCKED") {
    throw new AppError({
      code: "USER_BLOCKED",
      status: 403,
      userMessage: "Utenza bloccata. Contatta un amministratore.",
      redirectTo: "/users/app/login"
    });
  }

  if (!result) {
    throw new AppError({
      code: "INVALID_CREDENTIALS",
      status: 401,
      userMessage: "Credenziali non valide.",
      redirectTo: "/users/app/login"
    });
  }

  // Sessione minima per UI: dati utili a navbar/permessi lato view.
  req.session.webUser = {
    _id: String(result.user._id),
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    mustChangePassword: Boolean(result.user.mustChangePassword)
  };

  if (req.session.webUser.mustChangePassword) {
    setFlash(req, "error", "Password temporanea rilevata: impostane una nuova.");
    res.redirect("/users/app/profile");
    return;
  }

  res.redirect("/users/app");
};

export const getAppRegister = (_req: Request, res: Response): void => {
  res.render("auth/register");
};

export const postAppRegister = (req: Request, res: Response): void => {
  // La creazione account e centralizzata lato admin.
  setFlash(req, "error", "Registrazione disabilitata. Contatta un amministratore.");
  res.redirect("/users/app/login");
};

export const postAppLogout = (req: Request, res: Response): void => {
  // Logout web: invalidazione completa sessione server-side.
  req.session.destroy(() => res.redirect("/users/app/login"));
};

export const getAppAdminUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const users = await listUsers();

  res.render("admin/users", {
    user: req.session.webUser,
    users
  });
};

export const postAppAdminCreateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, name, role, temporaryPassword } = req.body as {
    email: string;
    name?: string;
    role?: "user" | "admin";
    temporaryPassword: string;
  };

  const createdUser = await createUserByAdmin({
    email,
    name,
    role: role || "user",
    temporaryPassword
  });

  if (!createdUser) {
    throw new AppError({
      code: "EMAIL_ALREADY_REGISTERED",
      status: 409,
      userMessage: "Email gia registrata.",
      redirectTo: "/users/app/admin/users"
    });
  }

  setFlash(req, "success", "Utente creato con password temporanea.");
  res.redirect("/users/app/admin/users");
};

export const getAppProfile = (req: Request, res: Response): void => {
  res.render("account/profile", { user: req.session.webUser });
};

export const postAppProfilePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const isForcedChange = Boolean(req.session.webUser?.mustChangePassword);
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword: string;
  };

  const result = await updateUserPassword({
    userId: req.session.webUser!._id,
    currentPassword,
    newPassword,
    requireCurrent: !isForcedChange
  });

  if (!result.user && result.reason === "INVALID_CURRENT_PASSWORD") {
    throw new AppError({
      code: "INVALID_CURRENT_PASSWORD",
      status: 400,
      userMessage: "Password corrente non corretta.",
      redirectTo: "/users/app/profile"
    });
  }

  if (!result.user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      redirectTo: "/users/app/login"
    });
  }

  req.session.webUser!.mustChangePassword = false;
  setFlash(req, "success", "Password aggiornata correttamente.");

  if (isForcedChange) {
    res.redirect("/users/app/travels");
    return;
  }

  res.redirect("/users/app/profile");
};

export const postAppAdminBlockUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await setUserBlockedByAdmin({
    userId: String(req.params.id),
    blocked: true,
    requesterId: req.session.webUser!._id
  });

  if (result.reason === "SELF_ACTION_NOT_ALLOWED") {
    throw new AppError({
      code: "SELF_ACTION_NOT_ALLOWED",
      status: 400,
      userMessage: "Non puoi bloccare il tuo account.",
      redirectTo: "/users/app/admin/users"
    });
  }

  if (result.reason === "USER_NOT_FOUND") {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      redirectTo: "/users/app/admin/users"
    });
  }

  setFlash(req, "success", "Utente bloccato.");
  res.redirect("/users/app/admin/users");
};

export const postAppAdminUnblockUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await setUserBlockedByAdmin({
    userId: String(req.params.id),
    blocked: false,
    requesterId: req.session.webUser!._id
  });

  if (result.reason === "SELF_ACTION_NOT_ALLOWED") {
    throw new AppError({
      code: "SELF_ACTION_NOT_ALLOWED",
      status: 400,
      userMessage: "Non puoi sbloccare il tuo account da questa azione.",
      redirectTo: "/users/app/admin/users"
    });
  }

  if (result.reason === "USER_NOT_FOUND") {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      redirectTo: "/users/app/admin/users"
    });
  }

  setFlash(req, "success", "Utente sbloccato.");
  res.redirect("/users/app/admin/users");
};

export const postAppAdminDeleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await deleteUserByAdmin({
    userId: String(req.params.id),
    requesterId: req.session.webUser!._id
  });

  if (result.reason === "SELF_ACTION_NOT_ALLOWED") {
    throw new AppError({
      code: "SELF_ACTION_NOT_ALLOWED",
      status: 400,
      userMessage: "Non puoi eliminare il tuo account.",
      redirectTo: "/users/app/admin/users"
    });
  }

  if (result.reason === "USER_NOT_FOUND") {
    throw new AppError({
      code: "USER_NOT_FOUND",
      status: 404,
      userMessage: "Utente non trovato.",
      redirectTo: "/users/app/admin/users"
    });
  }

  setFlash(req, "success", "Utente eliminato.");
  res.redirect("/users/app/admin/users");
};
