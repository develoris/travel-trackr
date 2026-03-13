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
export const withFlash = (req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
};

const setFlash = (req, type, message) => {
  req.session.flash = { [type]: message };
};

export const redirectIfAuthenticated = (req, res, next) => {
  // Se gia autenticato via sessione web, evita di mostrare login/register.
  if (req.session.webUser) return res.redirect("/users/app");
  return next();
};

export const requireWebAuth = (req, res, next) => {
  // Guardia pagine private EJS.
  if (!req.session.webUser) return res.redirect("/users/app/login");
  return next();
};

export const requireAdminWeb = (req, _res, next) => {
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

export const requirePasswordUpdate = (req, res, next) => {
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

export const redirectToApp = (_req, res) => {
  return res.redirect("/users/app");
};

export const getAppHome = (req, res) => {
  if (!req.session.webUser) {
    return res.redirect("/users/app/login");
  }

  if (req.session.webUser.mustChangePassword) {
    return res.redirect("/users/app/profile");
  }

  return res.redirect("/users/app/travels");
};

export const getAppLogin = (_req, res) => {
  return res.render("auth/login", {
    user: null
  });
};

export const postAppLogin = async (req, res) => {
  const { email, password } = req.body;

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
    return res.redirect("/users/app/profile");
  }

  return res.redirect("/users/app");
};

export const getAppRegister = (_req, res) => {
  return res.render("auth/register");
};

export const postAppRegister = async (req, res) => {
  // La creazione account e centralizzata lato admin.
  setFlash(req, "error", "Registrazione disabilitata. Contatta un amministratore.");
  return res.redirect("/users/app/login");
};

export const postAppLogout = (req, res) => {
  // Logout web: invalidazione completa sessione server-side.
  req.session.destroy(() => res.redirect("/users/app/login"));
};

export const getAppAdminUsers = async (req, res) => {
  const users = await listUsers();

  return res.render("admin/users", {
    user: req.session.webUser,
    users
  });
};

export const postAppAdminCreateUser = async (req, res) => {
  const { email, name, role, temporaryPassword } = req.body;

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
  return res.redirect("/users/app/admin/users");
};

export const getAppProfile = async (req, res) => {
  return res.render("account/profile", {
    user: req.session.webUser
  });
};

export const postAppProfilePassword = async (req, res) => {
  const isForcedChange = Boolean(req.session.webUser?.mustChangePassword);
  const { currentPassword, newPassword } = req.body;

  const result = await updateUserPassword({
    userId: req.session.webUser._id,
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

  req.session.webUser.mustChangePassword = false;
  setFlash(req, "success", "Password aggiornata correttamente.");

  if (isForcedChange) {
    return res.redirect("/users/app/travels");
  }

  return res.redirect("/users/app/profile");
};

export const postAppAdminBlockUser = async (req, res) => {
  const result = await setUserBlockedByAdmin({
    userId: req.params.id,
    blocked: true,
    requesterId: req.session.webUser._id
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
  return res.redirect("/users/app/admin/users");
};

export const postAppAdminUnblockUser = async (req, res) => {
  const result = await setUserBlockedByAdmin({
    userId: req.params.id,
    blocked: false,
    requesterId: req.session.webUser._id
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
  return res.redirect("/users/app/admin/users");
};

export const postAppAdminDeleteUser = async (req, res) => {
  const result = await deleteUserByAdmin({
    userId: req.params.id,
    requesterId: req.session.webUser._id
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
  return res.redirect("/users/app/admin/users");
};
