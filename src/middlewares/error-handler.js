import { AppError } from "../core/errors/app-error.js";
import { isApiRequest, toAppError } from "../core/errors/error-utils.js";

export const notFoundHandler = (req, _res, next) => {
  next(
    new AppError({
      code: "NOT_FOUND",
      status: 404,
      userMessage: "Risorsa non trovata.",
      developerMessage: `Route ${req.method} ${req.originalUrl} not found`
    })
  );
};

export const errorHandler = (error, req, res, _next) => {
  const appError = toAppError(error);
  const status = appError.status || 500;
  const requestId = req.requestId || "n/a";

  console.error("[ERROR]", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    code: appError.code,
    status,
    message: appError.developerMessage,
    details: appError.details,
    stack: appError.stack
  });

  if (isApiRequest(req)) {
    return res.status(status).json({
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
  }

  if (req.session) {
    req.session.flash = { error: appError.userMessage };
  }

  if (appError.redirectTo) {
    return res.redirect(appError.redirectTo);
  }

  return res.status(status).render("error", {
    title: "Errore",
    requestId,
    message: appError.userMessage,
    status
  });
};
