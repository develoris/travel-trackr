import { body, param, validationResult } from "express-validator";
import { AppError } from "../../core/errors/app-error.js";

export const createUserValidator = [
  body("email").isEmail().withMessage("email non valida"),
  body("passwordHash")
    .isString()
    .isLength({ min: 8 })
    .withMessage("passwordHash deve avere almeno 8 caratteri"),
  body("name").optional().isString().withMessage("name deve essere una stringa"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("role deve essere user o admin")
];

export const signInValidator = [
  body("email").isEmail().withMessage("email non valida"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password deve avere almeno 8 caratteri"),
  body("name").optional().isString().withMessage("name deve essere una stringa")
];

export const loginValidator = [
  body("email").isEmail().withMessage("email non valida"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password deve avere almeno 8 caratteri")
];

export const appLoginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email obbligatoria")
    .bail()
    .isEmail()
    .withMessage("Email non valida")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password obbligatoria")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Password obbligatoria")
];

export const appRegisterValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email obbligatoria")
    .bail()
    .isEmail()
    .withMessage("Email non valida")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password obbligatoria")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La password deve avere almeno 8 caratteri"),
  body("confirmPassword")
    .isString()
    .withMessage("Conferma password obbligatoria")
    .bail()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Le password non coincidono"),
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .isString()
    .withMessage("Il nome deve essere una stringa")
];

export const refreshSessionValidator = [];

export const logoutValidator = [];

export const updateUserValidator = [
  param("id").isMongoId().withMessage("id non valida"),
  body("email").optional().isEmail().withMessage("email non valida"),
  body("passwordHash")
    .optional()
    .isString()
    .isLength({ min: 8 })
    .withMessage("passwordHash deve avere almeno 8 caratteri"),
  body("name").optional().isString().withMessage("name deve essere una stringa"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("role deve essere user o admin")
];

export const userIdValidator = [
  param("id").isMongoId().withMessage("id non valida")
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

export const validateWebRequest = (redirectTo) => (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new AppError({
      code: "INVALID_FORM",
      status: 400,
      userMessage: errors.array()[0]?.msg || "Dati del form non validi.",
      developerMessage: "Web form validation failed",
      details: errors.array(),
      redirectTo
    })
  );
};
