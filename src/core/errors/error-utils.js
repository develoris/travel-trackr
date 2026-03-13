import { AppError } from "./app-error.js";

export const toAppError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    status: 500,
    userMessage: "Si e verificato un errore inatteso.",
    developerMessage: error?.message || "Unhandled exception",
    details: error?.details,
    isOperational: false
  });
};

export const isApiRequest = (req) => req.path.startsWith("/users") && !req.path.startsWith("/users/app");

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
