export class AppError extends Error {
  constructor({
    code = "INTERNAL_ERROR",
    status = 500,
    userMessage = "Si e verificato un errore inatteso.",
    developerMessage,
    details,
    isOperational = true,
    redirectTo
  } = {}) {
    super(developerMessage || userMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.userMessage = userMessage;
    this.developerMessage = developerMessage || this.message;
    this.details = details;
    this.isOperational = isOperational;
    this.redirectTo = redirectTo;
  }
}
