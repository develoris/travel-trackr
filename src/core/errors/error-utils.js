import { AppError } from "./app-error.js";

// Normalizza qualsiasi errore in un AppError.
// Se arriva già un AppError lo restituisce invariato.
// Altrimenti avvolge l'eccezione generica in un AppError 500 non-operazionale,
// così l'error handler non deve mai gestire tipi di errore diversi.
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
    // isOperational: false segnala che non è un errore previsto → log più rumoroso.
    isOperational: false
  });
};

// Determina se la richiesta arriva dall'API REST (risposta JSON)
// oppure dall'app web (risposta HTML/redirect).
// Convenzione: /users/app/* → web app, /users/* senza /app → API.
export const isApiRequest = (req) => req.path.startsWith("/users") && !req.path.startsWith("/users/app");

// Wrapper per handler async: cattura le promise rejection e le passa a next()
// così Express le instrada all'error handler centrale.
// In Express 5 le rejection vengono già gestite automaticamente dal framework,
// ma il wrapper è utile per compatibilità e chiarezza esplicita.
export const asyncHandler = (handler) => (req, res, next) => {
  const execution = Promise.resolve().then(() => handler(req, res, next));

  if (typeof next === "function") {
    return execution.catch(next);
  }

  return execution;
};
