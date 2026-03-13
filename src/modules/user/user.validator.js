import { body, param, validationResult } from "express-validator";

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
