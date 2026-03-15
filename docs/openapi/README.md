# OpenAPI / Swagger Notes

Questa cartella contiene la documentazione API REST in formato OpenAPI.

## Obiettivi

- Documentare solo endpoint REST JSON.
- Escludere endpoint EJS `/users/app/*`.
- Evitare sovrapposizione tra business code e documentazione.

## Struttura

- `travel-trackr.openapi.yaml`: fonte primaria (source of truth).
- `travel-trackr.openapi.json`: artifact generato dalla YAML.

## Workflow consigliato

1. Modifica solo il file YAML.
2. Rigenera JSON con:

```bash
npm run openapi:export-json
```

3. Verifica in locale Swagger UI su `/api-docs`.

## Endpoint docs runtime

- `/api-docs` (Swagger UI)
- `/api-docs/openapi.yaml`
- `/api-docs/openapi.json`

## Token auth in Swagger

Usa schema Bearer JWT:

1. Esegui `POST /users/login`.
2. Copia `accessToken`.
3. Clicca `Authorize` in Swagger UI.
4. Inserisci `Bearer <accessToken>`.

## Manutenzione (handover)

Quando aggiungi/modifichi endpoint REST:

1. Aggiorna route/controller.
2. Aggiorna `travel-trackr.openapi.yaml`.
3. Rigenera JSON.
4. Aggiorna README se cambia il flusso auth o i path principali.

Per contesto funzionale del modulo travel (UI web, schema technical outdoor, PDF report):

- [docs/TRAVEL_MODULE.md](../TRAVEL_MODULE.md)
