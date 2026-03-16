import type { Request, Response, NextFunction } from "express";
import { AppError } from "../core/errors/app-error.js";
import { isApiRequest, toAppError } from "../core/errors/error-utils.js";

// Catch-all per route non trovate: genera un AppError 404 standard
// e lo passa all'errorHandler tramite next().
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(
    new AppError({
      code: "NOT_FOUND",
      status: 404,
      userMessage: "Risorsa non trovata.",
      developerMessage: `Route ${req.method} ${req.originalUrl} not found`
    })
  );
};

// Error handler centrale di Express (firma a 4 parametri obbligatoria).
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const appError = toAppError(error);
  const status = appError.status || 500;
  const isTestEnv =
    process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);
  const shouldLogError = !isTestEnv || status >= 500;
  const requestId = req.requestId || "n/a";

  if (shouldLogError) {
    console.error(
      `[ERROR] requestId=${requestId} method=${req.method} url=${req.originalUrl} status=${status} code=${appError.code} message=${appError.developerMessage}`
    );
  }

  if (shouldLogError && appError.details) {
    console.error("[ERROR_DETAILS]", appError.details);
  }

  if (
    shouldLogError &&
    process.env.NODE_ENV !== "production" &&
    appError.stack
  ) {
    console.error(appError.stack);
  }

  // — Risposta per chiamate API REST: JSON strutturato.
  if (isApiRequest(req)) {
    res.status(status).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.userMessage,
        details: appError.details
      },
      requestId,
      debug:
        process.env.NODE_ENV !== "production"
          ? { message: appError.developerMessage }
          : undefined
    });
    return;
  }

  // — Risposta per l'app web.
  if (req.session) {
    req.session.flash = { error: appError.userMessage };
  }

  if (appError.redirectTo) {
    res.redirect(appError.redirectTo);
    return;
  }

  res.status(status).render("error", {
    title: "Errore",
    requestId,
    message: appError.userMessage,
    status
  });
};
