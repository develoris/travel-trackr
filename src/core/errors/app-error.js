// Classe base per tutti gli errori applicativi gestiti.
//
// Distingue due categorie di errore:
//   - isOperational = true  → errore previsto e gestito (es. 404, validazione, accesso negato).
//                             Viene loggato con livello INFO e mostrato all'utente in modo pulito.
//   - isOperational = false → errore inatteso (bug, crash, DB down).
//                             Viene loggato con livello ERROR e mostra un messaggio generico.
//
// userMessage      → testo mostrato all'utente (italiano, non tecnico).
// developerMessage → testo nei log del server (dettaglio tecnico, solo dev/ops).
// code             → stringa costante usabile nei test e nel frontend (es. "TRIP_NOT_FOUND").
// redirectTo       → se valorizzato, l'error handler reindirizza qui invece di renderizzare la pagina errore.
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
    // Il messaggio nativo di Error (usato dallo stack trace) usa il testo tecnico se disponibile.
    super(developerMessage || userMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.userMessage = userMessage;
    this.developerMessage = developerMessage || this.message;
    // details può contenere array di errori di validazione o qualsiasi extra da loggare.
    this.details = details;
    this.isOperational = isOperational;
    this.redirectTo = redirectTo;
  }
}
