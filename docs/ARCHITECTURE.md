# Architecture Guide

Questa guida descrive come e organizzato il codice oggi e come fluisce una richiesta nel progetto.

## 1. Entry point

File: src/index.js

Responsabilita principali:

1. Carica env e inizializza Express.
2. Registra middleware globali (cors, cookieParser, json, urlencoded, session).
3. Configura EJS e cartella views.
4. Reindirizza GET / verso /users/app.
5. Monta il router users su /users.

Modalita DB:

1. Standard: usa MONGODB_URI.
2. Demo/mock: con USE_IN_MEMORY_DB=true avvia Mongo in-memory (mongodb-memory-server).

In pratica, tutto il traffico applicativo passa dal modulo users.

## 2. Modulo users

Il modulo users contiene due canali:

1. Canale web (EJS) in users.app.controller.js
2. Canale API (JSON) in user.controller.js

Il routing e centralizzato in user.routes.js.

### 2.1 user.routes.js

File: src/modules/user/user.routes.js

Contiene:

1. Route EJS sotto /users/app/*
2. Route API sotto /users/*
3. Validator express-validator applicati alle route API

### 2.2 users.app.controller.js

File: src/modules/user/users.app.controller.js

Gestisce UX server-rendered:

1. Login form e submit.
2. Register form e submit.
3. Home app protetta.
4. Logout web.
5. Flash messages via sessione.

Stato sessione web:

- req.session.webUser: utente loggato lato pagine EJS
- req.session.flash: messaggi one-shot (success/error)

### 2.3 user.controller.js

File: src/modules/user/user.controller.js

Gestisce endpoint API JSON.

Auth API:

1. POST /users/login -> ritorna accessToken nel body.
2. POST /users/refresh -> legge refresh token da cookie HttpOnly tt.rt.
3. POST /users/logout -> invalida sessione token e pulisce cookie.

Nota cookie refresh:

- Nome: tt.rt
- HttpOnly: true
- Path: /users/refresh

Questo significa che il browser invia il cookie solo quando chiami /users/refresh.

### 2.4 user.service.js

File: src/modules/user/user.service.js

Contiene la business logic:

1. CRUD user.
2. Registrazione e login.
3. Emissione e rotazione JWT.
4. Verifica refresh token e revoca.

Il controller API chiama il service e si occupa solo delle risposte HTTP.

### 2.5 user.model.js

File: src/modules/user/user.model.js

Definisce schema Mongoose User.

Dettagli importanti:

1. pre save per hash password (bcrypt).
2. verifyPassword come metodo istanza.
3. Campo auth per token hash e metadata login.
4. toJSON rimuove campi sensibili.

## 3. Middleware condivisi

Cartella: src/middlewares

1. authenticate.js
	- valida Bearer access token
	- carica utente e verifica hash token persistito

2. authorize.js
	- controlla ruolo utente
	- uso tipico: authorize("admin")

Questi middleware sono pronti per proteggere nuove route (es. travel).

## 3.1 Error handling globale

File principali:

1. src/core/errors/app-error.js
2. src/core/errors/error-utils.js
3. src/middlewares/error-handler.js
4. src/middlewares/request-id.js

Flusso:

1. Una route async lancia un errore oppure chiama next(error).
2. asyncHandler inoltra ogni errore a errorHandler.
3. errorHandler converte l'errore in AppError (se necessario).
4. Se la request e API -> ritorna payload JSON standard.
5. Se la request e EJS -> flash+redirect oppure pagina error.ejs.

Questo schema permette di mantenere messaggi user-friendly verso il frontend e dettagli utili al debug verso i log sviluppatore.

## 4. Views EJS

Cartella: src/views

1. index.ejs: home attuale (placeholder I miei viaggi).
2. auth/login.ejs e auth/register.ejs.
3. partials/head.ejs, navbar.ejs, flash.ejs.

## 5. Flussi principali

### Flusso web login

1. GET /users/app/login.
2. POST /users/app/login.
3. Se ok -> salva req.session.webUser.
4. Redirect /users/app.

### Flusso API login + refresh

1. POST /users/login con email/password.
2. Ricevi accessToken nel body.
3. Refresh token viene salvato in cookie HttpOnly.
4. POST /users/refresh per ottenere nuovo accessToken.

## 6. Convenzioni correnti

1. Modulo users autosufficiente (route, controller, service, model, validator).
2. Distinzione netta tra controller web e controller API.
3. Logica business nel service.
4. Path funzionali sotto prefisso /users.

## 7. Prossimi step suggeriti

1. Aggiungere modulo travel con stessa forma del modulo users.
2. Proteggere route sensibili con authenticate e authorize.
3. Introdurre test automatici per service e route.
4. Separare config auth in un file dedicato (constants/config).