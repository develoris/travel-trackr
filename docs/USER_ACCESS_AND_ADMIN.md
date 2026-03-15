# User Access and Admin Operations

Questa guida descrive come funziona oggi la gestione utenti lato web e cosa deve sapere chi prende in mano il progetto.

## Obiettivo funzionale

- Gli utenti non si registrano da soli.
- Gli account vengono creati da admin con password temporanea.
- Al primo login l'utente deve cambiare password.
- L'admin puo bloccare/sbloccare/eliminare utenze.

## Ruoli

- user: usa area viaggi + profilo.
- admin: oltre alle funzioni user, ha area Gestione utenti.

## Flusso account (happy path)

1. Admin apre `/users/app/admin/users`.
2. Admin crea utente con password temporanea.
3. Il nuovo utente effettua login su `/users/app/login`.
4. Il sistema rileva `mustChangePassword=true` e forza redirect su `/users/app/profile`.
5. Dopo il cambio password iniziale, l'utente viene reindirizzato a `/users/app/travels`.

## Stati account e campi chiave

Nel modello utente:

- `mustChangePassword`: obbliga il cambio password al primo accesso.
- `temporaryPasswordIssuedAt`: timestamp di emissione password temporanea.
- `isBlocked`: se true, impedisce il login.

## Pagine web rilevanti

- `/users/app/login`: login web.
- `/users/app/profile`: pagina account con cambio password.
- `/users/app/admin/users`: tabella admin con azioni utenza.

## Azioni admin disponibili

In tabella Gestione utenti:

- Crea utenza.
- Blocca utenza.
- Sblocca utenza.
- Elimina utenza.

Vincoli di sicurezza:

- admin non puo bloccare il proprio account.
- admin non puo eliminare il proprio account.

## Errori attesi

- login con utenza bloccata: messaggio user-friendly, accesso negato.
- tentativo azione admin su se stesso: errore operativo con redirect alla tabella.
- utente non trovato: errore gestito con redirect e flash.

## Se devi estendere questa area

Checklist manutentore:

1. Aggiorna validator prima del controller.
2. Mantieni i controlli self-action (evita lockout admin accidentale).
3. Aggiorna la tabella admin con badge coerenti (stato account + cambio password).
4. Aggiorna questa guida con le nuove policy.

## File principali da conoscere

- `src/modules/user/user.model.js`
- `src/modules/user/user.service.js`
- `src/modules/user/users.app.controller.js`
- `src/modules/user/user.routes.js`
- `src/views/admin/users.ejs`
- `src/views/account/profile.ejs`
- `src/views/partials/navbar.ejs`
