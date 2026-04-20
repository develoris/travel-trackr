import { body, param, validationResult } from "express-validator";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../../core/errors/app-error.js";

export const createUserValidator: RequestHandler[] = [
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

export const signInValidator: RequestHandler[] = [
  body("email").isEmail().withMessage("email non valida"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password deve avere almeno 8 caratteri"),
  body("name").optional().isString().withMessage("name deve essere una stringa")
];

export const loginValidator: RequestHandler[] = [
  body("email").isEmail().withMessage("email non valida"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password deve avere almeno 8 caratteri")
];

export const appLoginValidator: RequestHandler[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email obbligatoria")
    .bail()
    .isEmail()
    .withMessage("Email non valida")
    .toLowerCase(),
  body("password")
    .isString()
    .withMessage("Password obbligatoria")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Password obbligatoria")
];

export const appRegisterValidator: RequestHandler[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email obbligatoria")
    .bail()
    .isEmail()
    .withMessage("Email non valida")
    .toLowerCase(),
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

export const appAdminCreateUserValidator: RequestHandler[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email obbligatoria")
    .bail()
    .isEmail()
    .withMessage("Email non valida")
    .toLowerCase(),
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .isString()
    .withMessage("Il nome deve essere una stringa"),
  body("role")
    .optional({ values: "falsy" })
    .isIn(["user", "admin"])
    .withMessage("Ruolo non valido"),
  body("temporaryPassword")
    .isString()
    .withMessage("Password temporanea obbligatoria")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La password temporanea deve avere almeno 8 caratteri")
];

export const appProfilePasswordValidator: RequestHandler[] = [
  body("currentPassword")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Password corrente non valida"),
  body("newPassword")
    .isString()
    .withMessage("Nuova password obbligatoria")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La nuova password deve avere almeno 8 caratteri"),
  body("confirmPassword")
    .isString()
    .withMessage("Conferma password obbligatoria")
    .bail()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Le password non coincidono")
];

export const appAdminUserActionValidator: RequestHandler[] = [
  param("id").isMongoId().withMessage("Utente non valido")
];

export const refreshSessionValidator: RequestHandler[] = [];

export const logoutValidator: RequestHandler[] = [];

export const updateUserValidator: RequestHandler[] = [
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

export const userIdValidator: RequestHandler[] = [
  param("id").isMongoId().withMessage("id non valida")
];

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

export const validateWebRequest =
  (redirectTo: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    return next(
      new AppError({
        code: "INVALID_FORM",
        status: 400,
        userMessage:
          errors.array()[0]?.msg || "Dati del form non validi.",
        developerMessage: "Web form validation failed",
        details: errors.array(),
        redirectTo
      })
    );
  };
