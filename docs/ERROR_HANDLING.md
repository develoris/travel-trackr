# Error Handling Guide

Questa guida descrive il sistema di gestione errori centralizzato del progetto.

## Obiettivi

1. Risposte coerenti su tutte le API.
2. Messaggi user-friendly per EJS/frontend.
3. Informazioni utili al debug per sviluppatori.
4. Pattern riusabile in tutti i moduli futuri (travel, stage, expense, ecc.).

## Componenti

### 1) AppError

File: src/core/errors/app-error.js

Classe dominio per rappresentare errori operativi applicativi.

Campi principali:

- code: identificatore stabile macchina (es. INVALID_CREDENTIALS)
- status: HTTP status code
- userMessage: messaggio mostrabile all'utente
- developerMessage: messaggio tecnico per log/debug
- details: dettagli opzionali strutturati
- redirectTo: usato nel canale EJS per redirect con flash

### 2) Utility

File: src/core/errors/error-utils.js

- toAppError(error): normalizza qualsiasi errore in AppError
- asyncHandler(handler): wrapper per route async, evita try/catch ripetuti
- isApiRequest(req): distingue richieste API da richieste web EJS

### 3) Middleware globali

File: src/middlewares/request-id.js

- assegna requestId a ogni richiesta
- propaga x-request-id in response

File: src/middlewares/error-handler.js

- notFoundHandler: genera NOT_FOUND per route inesistenti
- errorHandler: punto unico di serializzazione errori

Comportamento:

1. Logga sempre lato server con requestId, route, code, details e stack.
2. API: risposta JSON standard.
3. EJS: flash error + redirect (se redirectTo), altrimenti render pagina error.

## Formato risposta API errore

Esempio:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credenziali non valide.",
    "details": null
  },
  "requestId": "7f2b5b91-9d1d-4f60-b9c6-ec4d2f6f91a8",
  "debug": {
    "message": "Login failed for foo@bar.com"
  }
}
```

Nota:

- debug viene incluso solo in ambiente non production.

## Pattern consigliato nei controller

### API controller

1. Lancia AppError quando il problema e previsto (es. utente non trovato).
2. Evita return res.status(...).json(...) duplicati per ogni caso errore.
3. Lascia al middleware globale la serializzazione finale.

### EJS controller

1. Per errori di input/flow, lancia AppError con redirectTo.
2. Per successi, usa flash success in sessione.
3. Mantieni i controller focalizzati su UX e redirect.

## Come aggiungere nuovi codici errore

Linee guida:

1. Usa code in MAIUSCOLO con underscore.
2. Mantieni code stabile nel tempo (contratto per frontend).
3. userMessage semplice e comprensibile.
4. developerMessage tecnico e orientato al debug.

Esempio:

- code: TRIP_NOT_FOUND
- status: 404
- userMessage: Viaggio non trovato.
- developerMessage: Trip 65f... not found for user 64a...

## Check-list per nuovi moduli

Quando crei un nuovo modulo:

1. Wrappa tutte le route async con asyncHandler.
2. Lancia AppError per errori operativi.
3. Non serializzare errori manualmente nei controller.
4. Usa requestId nei log di debugging.
5. Mantieni userMessage separato dal developerMessage.
