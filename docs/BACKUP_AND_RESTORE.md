# Backup and Restore Operations

Questa guida copre il backup completo MongoDB introdotto nel progetto.

## Cosa fa il backup

- Esegue un dump logico completo del database.
- Salva ogni collection in un file JSON separato.
- Salva metadati (`metadata.json`) con timestamp e riepilogo documenti.

Output tipico:

- `backups/YYYYMMDD-HHMMSS/collection-a.json`
- `backups/YYYYMMDD-HHMMSS/collection-b.json`
- `backups/YYYYMMDD-HHMMSS/metadata.json`

## Script disponibili

One-shot:

- `npm run backup:db`

Cron worker standalone:

- `npm run backup:cron`

## Variabili ambiente

- `BACKUP_OUTPUT_DIR`: cartella base output (default `./backups`).
- `BACKUP_DB_NAME`: nome db da esportare.
- `DB_BACKUP_CRON`: espressione cron (default `0 3 * * *`).
- `DB_BACKUP_RUN_ON_STARTUP`: se true, fa backup all'avvio worker.
- `ENABLE_DB_BACKUP_CRON`: se true, avvia cron dentro il server web.

## Modalita consigliata produzione

Preferibile usare worker standalone con scheduler esterno:

1. Deploy applicazione web normale.
2. Deploy worker backup (`npm run backup:cron`) su processo separato.
3. Pianifica monitoraggio/log rotate e retention backup.

## Portabilita fuori progetto

Lo script e stato pensato per riuso esterno:

- funzione esportata: `runMongoBackup` in `src/scripts/backup-db.js`
- puo essere importata da script ad hoc in un altro repository

Esempio (pseudo-uso):

```js
import { runMongoBackup } from "./backup-db.js";

await runMongoBackup({
  uri: "mongodb://127.0.0.1:27017/travel-trackr",
  dbName: "travel-trackr",
  outputDir: "./backups"
});
```

## Restore

Attualmente non c'e uno script di restore automatico nel progetto.

Restore manuale possibile:

1. Leggere i file JSON per collection.
2. Reimportare in MongoDB con script dedicato (consigliato batch per collection).

## Limiti noti

- Essendo export JSON, alcuni tipi BSON avanzati possono richiedere attenzione in restore.
- Per restore 1:1 enterprise-grade valutare pipeline con `mongodump/mongorestore`.

## File principali

- `src/scripts/backup-db.js`
- `src/scripts/backup-cron.js`
- `src/index.js` (solo se si usa cron in-process)
- `.env.example`
