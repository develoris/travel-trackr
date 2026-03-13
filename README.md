# Travel Trackr

Applicazione Node.js con interfaccia EJS e API JSON per gestire utenti (modulo travel in arrivo).

## Stato attuale

- Modulo users completo (web + API) sotto prefisso `/users`
- Login web con sessione server-side (`req.session.webUser`)
- Login API con JWT access token e refresh token in cookie HttpOnly
- Pagina iniziale web su `/users/app`

Per una spiegazione più tecnica, leggi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md).

## Stack

- Runtime: Node.js (ESM)
- Framework: Express 5
- Template engine: EJS + Bootstrap 5
- Database: MongoDB + Mongoose
- Auth: JWT + cookie refresh token + express-session
- Validation: express-validator
- Password hashing: bcryptjs

## Setup rapido

```bash
npm install
cp .env.example .env
node src/index.js
```

Server locale: http://localhost:3000

## Variabili ambiente

| Variabile | Descrizione | Default |
|---|---|---|
| PORT | Porta server | 3000 |
| NODE_ENV | Ambiente runtime | development |
| MONGODB_URI | Connessione MongoDB | mongodb://127.0.0.1:27017/travel-trackr |
| SESSION_SECRET | Segreto session cookie | dev-session-secret |
| ACCESS_TOKEN_SECRET | Segreto firma access token | dev-access-secret |
| REFRESH_TOKEN_SECRET | Segreto firma refresh token | dev-refresh-secret |
| ACCESS_TOKEN_TTL | Durata access token | 15m |
| REFRESH_TOKEN_DAYS | Giorni validita refresh token | 30 |
| CORS_ORIGIN | Origin frontend consentita | http://localhost:5173 |

## URL principali

### Web (EJS)

- GET /users/app
- GET /users/app/login
- POST /users/app/login
- GET /users/app/register
- POST /users/app/register
- POST /users/app/logout

### API users

- GET /users
- GET /users/:id
- POST /users
- PATCH /users/:id
- DELETE /users/:id

### API auth

- POST /users/signin
- POST /users/login
- POST /users/refresh
- POST /users/logout

## Struttura progetto

```text
src/
    index.js
    middlewares/
        authenticate.js
        authorize.js
    modules/
        travel/
        user/
            index.js
            user.model.js
            user.service.js
            user.controller.js
            users.app.controller.js
            user.routes.js
            user.validator.js
    views/
        index.ejs
        error.ejs
        auth/
            login.ejs
            register.ejs
        partials/
            head.ejs
            navbar.ejs
            flash.ejs
```

## Gestione errori centralizzata

Il progetto usa una gestione errori unica, valida per canale API e canale EJS:

1. I controller possono lanciare AppError con code, status, userMessage e developerMessage.
2. Le route async sono wrappate con asyncHandler per inoltrare automaticamente gli errori al middleware globale.
3. Il middleware errorHandler decide il formato finale:
4. API: JSON standard con error code, messaggio user-friendly e requestId.
5. EJS: flash error + redirect oppure pagina errore dedicata.

Dettagli e linee guida: [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md).

## Test rapido API

Usa [requests.http](requests.http) con estensione REST Client di VS Code.
