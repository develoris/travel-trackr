# Architecture Guide

Questa guida descrive come e organizzato il codice oggi e come fluisce una richiesta nel progetto.

## 1. Bootstrap e avvio

Il bootstrap e stato separato in moduli dedicati.

File principali:

1. src/index.js
2. src/app/bootstrap.js
3. src/app/create-app.js
4. src/app/register-shutdown.js

Responsabilita principali:

1. src/index.js: carica env e avvia bootstrap.
2. bootstrap.js: connessione DB, backup cron opzionale, start server.
3. create-app.js: costruisce app Express con middleware globali, sessione e router.
4. register-shutdown.js: gestione SIGINT/SIGTERM e chiusura pulita DB/server.

Modalita DB:

1. Standard: usa MONGODB_URI.

## 2. Moduli applicativi

Il progetto ha due moduli verticali principali:

1. Modulo user
2. Modulo travel

Entrambi sono montati sotto prefisso /users.

## 2.1 Modulo user

File principali:

1. src/modules/user/user.routes.js
2. src/modules/user/users.app.controller.js
3. src/modules/user/user.controller.js
4. src/modules/user/user.service.js
5. src/modules/user/user.model.js

Canali:

1. Web EJS (/users/app/*): login, profilo, admin utenti.
2. API JSON (/users/*): auth JWT, refresh token, CRUD utente.

Stato sessione web:

- req.session.webUser: utente loggato lato pagine EJS
- req.session.flash: messaggi one-shot (success/error)

Nota cookie refresh:

- Nome: tt.rt
- HttpOnly: true
- Path: /users/refresh

## 2.2 Modulo travel

File principali:

1. src/modules/travel/travel.routes.js
2. src/modules/travel/travels.app.controller.js
3. src/modules/travel/travel.controller.js
4. src/modules/travel/travel.service.js
5. src/modules/travel/travel.model.js
6. src/modules/travel/travel.validator.js

Canali:

1. Web EJS (/users/app/travels*): lista, dettaglio, modifica, attivita, spese, PDF.
2. API JSON (/users/travels*): CRUD viaggi, stage, spese.

Dati principali:

1. Trip: meta viaggio e timeline stages.
2. Stage: attivita per giorno con ordinamento e sequence.
3. Expense: spesa associata a stage.
4. Technical (opzionale): campi outdoor come distanza, dislivello, moving time, difficolta, terreno, GPX.

Per dettaglio esteso: docs/TRAVEL_MODULE.md.

## 3. Middleware condivisi

Cartella: src/middlewares

1. authenticate.js
	- valida Bearer access token
	- carica utente e verifica hash token persistito

2. authorize.js
	- controlla ruolo utente
	- uso tipico: authorize("admin")

3. request-id.js
	- assegna requestId univoco a ogni richiesta
	- usato nei log errori per tracciabilita

## 3.1 Error handling globale

File principali:

1. src/core/errors/app-error.js
2. src/core/errors/error-utils.js
3. src/middlewares/error-handler.js

Flusso:

1. Una route async lancia un errore oppure chiama next(error).
2. asyncHandler inoltra ogni errore a errorHandler.
3. errorHandler converte l'errore in AppError (se necessario).
4. Se la request e API -> ritorna payload JSON standard.
5. Se la request e EJS -> flash+redirect oppure pagina error.ejs.

Questo schema mantiene messaggi user-friendly verso il frontend e dettagli tecnici nei log.

## 4. Views EJS

Cartella: src/views

Aree principali:

1. auth/: login/register
2. account/: profilo e cambio password
3. admin/: gestione utenti
4. travels/: lista, nuovo, dettaglio, modal attivita
5. partials/: head, navbar, flash

Nota utile:

- res.locals.currentPath viene impostato globalmente in create-app.js per evidenziare voci attive in UI.

## 5. Flussi principali

### Flusso web login

1. GET /users/app/login.
2. POST /users/app/login.
3. Se ok -> salva req.session.webUser.
4. Redirect /users/app.

### Flusso travel web

1. GET /users/app/travels (lista paginata/filtri).
2. GET /users/app/travels/:tripId (dettaglio per giorno).
3. POST /users/app/travels/:tripId/stages (nuova attivita).
4. POST /users/app/travels/:tripId/stages/:stageId/expenses (spese).
5. GET /users/app/travels/:tripId/report.pdf (export report).

### Flusso API login + refresh

1. POST /users/login con email/password.
2. Ricevi accessToken nel body.
3. Refresh token viene salvato in cookie HttpOnly.
4. POST /users/refresh per ottenere nuovo accessToken.

## 6. Convenzioni correnti

1. Moduli verticali autosufficienti (route, controller, service, model, validator).
2. Distinzione netta tra controller web e controller API.
3. Logica business nel service.
4. Path funzionali sotto prefisso /users.
5. Error handling centralizzato con AppError.

## 7. Prossimi step suggeriti

1. Introdurre i18n per label/testi UI (dati utente invariati).
2. Aggiungere test automatici service e route per modulo travel.
3. Estendere API travel con update/delete stage su canale REST.
4. Migliorare osservabilita (log strutturati e metriche).