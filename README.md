# Travel Trackr

Applicazione Node.js con interfaccia EJS e API JSON per gestione viaggi, utenti e amministrazione account.

## Stato attuale

- Modulo users completo (web + API) sotto prefisso `/users`
- Modulo travel completo (web + API) con timeline per giorno, spese e PDF report
- Login web con sessione server-side (`req.session.webUser`)
- Login API con JWT access token e refresh token in cookie HttpOnly
- Pagina iniziale web su `/users/app`

Per una spiegazione piu tecnica, leggi:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md)
- [docs/USER_ACCESS_AND_ADMIN.md](docs/USER_ACCESS_AND_ADMIN.md)
- [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md)
- [docs/TRAVEL_MODULE.md](docs/TRAVEL_MODULE.md)
- [docs/openapi/README.md](docs/openapi/README.md)

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

Per creare un admin di default in modo one-shot (solo se non esiste gia):

```bash
npm run seed:default-admin
```

Variabili opzionali per il comando one-shot:

- `DEFAULT_ADMIN_EMAIL` (default: `loris.beltramo@gmail.com`)
- `DEFAULT_ADMIN_PASSWORD` (**obbligatoria**, nessun default)
- `DEFAULT_ADMIN_NAME` (default: `Loris Beltramo`)

Server locale: http://localhost:3000

## Operativita rapida (nuovo manutentore)

Se stai prendendo in mano il progetto adesso:

1. Parti da [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
2. Leggi policy utenti in [docs/USER_ACCESS_AND_ADMIN.md](docs/USER_ACCESS_AND_ADMIN.md).
3. Verifica backup in [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md).
4. Controlla gestione errori in [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md).

## Variabili ambiente

| Variabile | Descrizione | Default |
|---|---|---|
| PORT | Porta server | 3000 |
| NODE_ENV | Ambiente runtime | development |
| MONGODB_URI | Connessione MongoDB | mongodb://127.0.0.1:27017/travel-trackr |
| SESSION_SECRET | Segreto session cookie | `dev-session-secret` (dev), **obbligatoria** in production |
| ACCESS_TOKEN_SECRET | Segreto firma access token | dev-access-secret |
| REFRESH_TOKEN_SECRET | Segreto firma refresh token | dev-refresh-secret |
| ACCESS_TOKEN_TTL | Durata access token | 15m |
| REFRESH_TOKEN_DAYS | Giorni validita refresh token | 30 |
| CORS_ORIGIN | Origin frontend consentita | `http://localhost:5173` (dev), **obbligatoria** in production |
| APP_BASE_PATH | Prefisso app dietro reverse proxy (es. `/travelTracker`) | vuoto |
| SESSION_COOKIE_SECURE | Override cookie secure (`true`/`false`) | auto in production, false in dev |
| DEFAULT_ADMIN_EMAIL | Email admin seed one-shot | loris.beltramo@gmail.com |
| DEFAULT_ADMIN_PASSWORD | Password admin seed one-shot | obbligatoria |
| DEFAULT_ADMIN_NAME | Nome admin seed one-shot | Loris Beltramo |
| ENABLE_DB_BACKUP_CRON | Se true attiva cron backup in-process | false |
| DB_BACKUP_CRON | Espressione cron backup | 0 3 * * * |
| DB_BACKUP_RUN_ON_STARTUP | Esegue backup subito all'avvio cron | false |
| DB_BACKUP_RETENTION_COUNT | Numero massimo cartelle backup da mantenere | 7 |
| BACKUP_OUTPUT_DIR | Cartella output backup | ./backups |
| BACKUP_DB_NAME | Nome db da esportare | travel-trackr |

## Backup database

Comandi principali:

- `npm run backup:db` -> backup one-shot.
- `npm run backup:cron` -> worker cron standalone.

Approfondimento: [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md).

## URL principali

## API Docs (Swagger)

La documentazione Swagger include solo API REST JSON (non endpoint EJS `/users/app/*`).

- UI: `/api-docs`
- OpenAPI YAML: `/api-docs/openapi.yaml`
- OpenAPI JSON: `/api-docs/openapi.json`

Spec su repository:

- YAML source of truth: [docs/openapi/travel-trackr.openapi.yaml](docs/openapi/travel-trackr.openapi.yaml)
- JSON generated artifact: [docs/openapi/travel-trackr.openapi.json](docs/openapi/travel-trackr.openapi.json)

Per rigenerare JSON da YAML:

```bash
npm run openapi:export-json
```

Autenticazione token in Swagger:

1. fai login su `POST /users/login`
2. copia `accessToken` dalla risposta
3. clicca Authorize in Swagger UI
4. incolla: `Bearer <token>`

### Web (EJS)

- GET /users/app
- GET /users/app/login
- POST /users/app/login
- GET /users/app/register
- POST /users/app/register
- GET /users/app/profile
- POST /users/app/profile/password
- GET /users/app/admin/users
- POST /users/app/admin/users
- POST /users/app/admin/users/:id/block
- POST /users/app/admin/users/:id/unblock
- POST /users/app/admin/users/:id/delete
- POST /users/app/logout
- GET /users/app/travels
- GET /users/app/travels/new
- POST /users/app/travels
- GET /users/app/travels/:tripId
- GET /users/app/travels/:tripId/report.pdf
- POST /users/app/travels/:tripId/update
- POST /users/app/travels/:tripId/stages
- POST /users/app/travels/:tripId/stages/:stageId/update
- POST /users/app/travels/:tripId/stages/:stageId/expenses
- POST /users/app/travels/:tripId/delete

### API users

- GET /users
- GET /users/:id
- POST /users (disabilitato per policy: admin-only)
- PATCH /users/:id
- DELETE /users/:id

### API auth

- POST /users/signin (disabilitato per policy: admin-only)
- POST /users/login
- POST /users/refresh
- POST /users/logout

## Policy utenti (importante)

- Registrazione self-service disabilitata.
- Gli utenti vengono creati da admin con password temporanea.
- Al primo login l'utente deve cambiare password.
- Admin puo bloccare/sbloccare/eliminare utenze.

Dettaglio completo: [docs/USER_ACCESS_AND_ADMIN.md](docs/USER_ACCESS_AND_ADMIN.md).

### API travels (JWT Bearer)

- GET /users/travels
- POST /users/travels
- GET /users/travels/:tripId
- PATCH /users/travels/:tripId
- DELETE /users/travels/:tripId
- POST /users/travels/:tripId/stages
- POST /users/travels/:tripId/stages/:stageId/expenses

Per dettagli del modulo travel (schema, technical outdoor, PDF e flussi):

- [docs/TRAVEL_MODULE.md](docs/TRAVEL_MODULE.md)

## Struttura progetto

```text
src/
    index.js
    app/
        bootstrap.js
        create-app.js
        register-shutdown.js
    middlewares/
        authenticate.js
        authorize.js
    modules/
        travel/
            index.js
            travel.model.js
            travel.service.js
            travel.controller.js
            travels.app.controller.js
            travel.routes.js
            travel.validator.js
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

## Release automation (major/minor/patch)

Il repository include una GitHub Action in [.github/workflows/release.yml](.github/workflows/release.yml) che gira su push in `main`.

Usa i Conventional Commits per calcolare automaticamente la versione SemVer:

- `fix: ...` -> patch
- `feat: ...` -> minor
- `feat!: ...` oppure body con `BREAKING CHANGE:` -> major

La action apre/aggiorna una Release PR con changelog e bump versione; quando la PR viene mergeata crea tag e release GitHub.

### Come scrivere i commit

Formato consigliato:

```text
tipo(scope opzionale): descrizione breve
```

Esempi pratici:

- Hai fixato un errore:

```bash
git commit -m "fix(users): corregge errore login"
```

- Hai aggiunto un endpoint:

```bash
git commit -m "feat(users): aggiunge endpoint /users/export"
```

- Hai fatto una modifica breaking:

```bash
git commit -m "feat!(users): cambia payload di /users/login"
```

Oppure con nota esplicita nel body:

```bash
git commit -m "feat(users): cambia payload login" -m "BREAKING CHANGE: la risposta non contiene piu i token nel body"
```

### Mappa rapida bump versione

- `fix` -> patch (`1.2.3` -> `1.2.4`)
- `feat` -> minor (`1.2.3` -> `1.3.0`)
- `feat!` / `BREAKING CHANGE` -> major (`1.2.3` -> `2.0.0`)

Nota: commit generici come `manage users` non permettono alla release automation di capire il tipo di bump.

### Token usato dalla action

La workflow usa `secrets.GITHUB_TOKEN` in [.github/workflows/release.yml](.github/workflows/release.yml).

- Questo token e generato automaticamente da GitHub ad ogni run.
- Nella maggior parte dei casi non devi creare nulla a mano.
- Il token e temporaneo (valido solo per quella esecuzione).

Quando creare un token manuale (PAT):

- se devi scrivere su un altro repository;
- se hai policy che bloccano il token automatico;
- se vuoi controllare scope e durata in modo esplicito.

Passi per creare un PAT (fine-grained):

1. GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens.
2. Clicca Generate new token.
3. Scegli il repository `travel-trackr`.
4. Dai permessi minimi: Contents (Read and write), Pull requests (Read and write).
5. Copia il token (si vede una sola volta).
6. Repository -> Settings -> Secrets and variables -> Actions -> New repository secret.
7. Salvalo ad esempio come `RELEASE_PLEASE_TOKEN`.

Se vuoi usare il token custom nella workflow, sostituisci il campo `token` con il secret custom in [.github/workflows/release.yml](.github/workflows/release.yml).

### Rollback versioni

Si: con release/tag GitHub hai uno storico versioni utile per rollback.

- Ogni release crea un tag (es. `v1.3.0`).
- Puoi tornare a una versione precedente facendo checkout del tag.
- Se devi correggere in produzione, tipicamente fai revert del commit/PR problematico e rilasci una nuova patch.

Esempi pratici:

- vedere i tag: `git tag --sort=-creatordate`
- provare una versione: `git checkout v1.2.4`
- creare branch da versione stabile: `git checkout -b hotfix/from-v1.2.4 v1.2.4`

Nota: GitHub salva cronologia git (commit/tag/release). I dati runtime (es. database) non vengono rollbackati automaticamente.
