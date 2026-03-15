import { AppError } from "../core/errors/app-error.js";
import { isApiRequest, toAppError } from "../core/errors/error-utils.js";

// Catch-all per route non trovate: genera un AppError 404 standard
// e lo passa all'errorHandler tramite next().
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

// Error handler centrale di Express (firma a 4 parametri obbligatoria).
// Riceve qualsiasi errore propagato via next(err) o throw in handler async.
export const errorHandler = (error, req, res, _next) => {
  // Normalizza sempre in AppError, anche se arriva un Error generico o un crash.
  const appError = toAppError(error);
  const status = appError.status || 500;
  const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);
  const shouldLogError = !isTestEnv || status >= 500;
  // requestId è iniettato dal middleware request-id.js: utile per trovare
  // la riga esatta nei log quando un utente segnala un problema.
  const requestId = req.requestId || "n/a";

  // Log compatto su una riga: facile da grep, evita dump annidati di oggetti Error.
  if (shouldLogError) {
    console.error(
      `[ERROR] requestId=${requestId} method=${req.method} url=${req.originalUrl} status=${status} code=${appError.code} message=${appError.developerMessage}`
    );
  }

  // Dettagli aggiuntivi (es. errori di validazione) in riga separata.
  if (shouldLogError && appError.details) {
    console.error("[ERROR_DETAILS]", appError.details);
  }

  // Stack trace solo in sviluppo: in produzione riduce il rumore nei log.
  if (shouldLogError && process.env.NODE_ENV !== "production" && appError.stack) {
    console.error(appError.stack);
  }

  // — Risposta per chiamate API REST: JSON strutturato.
  if (isApiRequest(req)) {
    return res.status(status).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.userMessage,
        details: appError.details
      },
      requestId,
      // Campo debug visibile solo in sviluppo: aiuta il frontend a capire l'errore.
      debug:
        process.env.NODE_ENV !== "production"
          ? { message: appError.developerMessage }
          : undefined
    });
  }

  // — Risposta per l'app web.

  // Salva il messaggio d'errore in sessione così il flash lo mostra dopo redirect.
  if (req.session) {
    req.session.flash = { error: appError.userMessage };
  }

  // Se l'errore indica una pagina di destinazione (es. "torna alla lista"),
  // reindirizza invece di renderizzare la pagina errore generica.
  if (appError.redirectTo) {
    return res.redirect(appError.redirectTo);
  }

  // Fallback: pagina errore generica con status e messaggio.
  return res.status(status).render("error", {
    title: "Errore",
    requestId,
    message: appError.userMessage,
    status
  });
};
