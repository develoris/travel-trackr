import { loginUser, registerUser } from "./user.service.js";
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

export const redirectToApp = (_req, res) => {
  return res.redirect("/users/app");
};

export const getAppHome = (req, res) => {
  return res.render("index", { user: req.session.webUser });
};

export const getAppLogin = (_req, res) => {
  return res.render("auth/login");
};

export const postAppLogin = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser({ email, password });

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
    role: result.user.role
  };

  return res.redirect("/users/app");
};

export const getAppRegister = (_req, res) => {
  return res.render("auth/register");
};

export const postAppRegister = async (req, res) => {
  const { email, password, name } = req.body;

  const user = await registerUser({ email, password, name });

  if (!user) {
    throw new AppError({
      code: "EMAIL_ALREADY_REGISTERED",
      status: 409,
      userMessage: "Email gia registrata. Prova ad accedere.",
      redirectTo: "/users/app/register"
    });
  }

  setFlash(req, "success", "Registrazione completata! Ora puoi accedere.");
  return res.redirect("/users/app/login");
};

export const postAppLogout = (req, res) => {
  // Logout web: invalidazione completa sessione server-side.
  req.session.destroy(() => res.redirect("/users/app/login"));
};
