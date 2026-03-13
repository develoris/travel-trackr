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

Per testare l'app senza MongoDB esterno:

```bash
npm run start:mock
```

In modalita mock vengono creati automaticamente utenti demo (idempotenti):

- email: `demo.user@travel-trackr.local` - password: `Password123!`
- email: `demo.admin@travel-trackr.local` - password: `Password123!`

Per disattivare il seed automatico imposta `SEED_MOCK_DATA=false`.

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
| USE_IN_MEMORY_DB | Se true usa mongodb-memory-server | false |
| SEED_MOCK_DATA | Se true crea utenti demo in start:mock | true |

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
