# Travel Module Guide

Questa guida descrive il modulo travel lato web (EJS) e lato API (JSON), con focus su modello dati, flussi e casi outdoor.

## 1. Panoramica

Il modulo travel gestisce:

1. Viaggi (trip): creazione, modifica, eliminazione, lista.
2. Attivita per giorno (stages): timeline per giorno e ordinamento per orario.
3. Spese per attivita (expenses): consuntivo economico.
4. Dati tecnici outdoor opzionali (technical): distanza, dislivello, tempo in movimento, difficolta, terreno, GPX.
5. Export PDF del viaggio per condivisione.

File principali:

- src/modules/travel/travel.model.js
- src/modules/travel/travel.service.js
- src/modules/travel/travel.controller.js
- src/modules/travel/travels.app.controller.js
- src/modules/travel/travel.routes.js
- src/modules/travel/travel.validator.js

## 2. Routing

Router montato sotto prefisso /users.

### 2.1 Web app (EJS)

- GET /users/app/travels
- GET /users/app/travels/new
- POST /users/app/travels
- GET /users/app/travels/:tripId
- GET /users/app/travels/:tripId/report.pdf
- POST /users/app/travels/:tripId/update
- POST /users/app/travels/:tripId/stages
- POST /users/app/travels/:tripId/stages/:stageId/update
- POST /users/app/travels/:tripId/stages/:stageId/delete
- POST /users/app/travels/:tripId/stages/:stageId/expenses
- POST /users/app/travels/:tripId/delete

Note:

- Le route web richiedono sessione req.session.webUser.
- Le validazioni web usano redirect + flash message in caso di errore.

### 2.2 API REST (JSON)

- GET /users/travels
- POST /users/travels
- GET /users/travels/:tripId
- PATCH /users/travels/:tripId
- DELETE /users/travels/:tripId
- POST /users/travels/:tripId/stages
- POST /users/travels/:tripId/stages/:stageId/expenses

Note:

- Le route API richiedono Bearer token (middleware authenticate).
- Le validazioni API ritornano payload JSON standard.

## 3. Modello dati

## 3.1 Trip

| Campo | Tipo | Obbligatorio | Default | Note |
| --- | --- | --- | --- | --- |
| owner | ObjectId | Si | - | Riferimento a User, indicizzato. |
| title | String | Si | - | Max 140, trim. |
| description | String | No | null | Max 2000, trim. |
| category | String enum | No | altro | escursione, trekking, visita, vacanza, roadtrip, altro. |
| status | String enum | No | planned | planned, ongoing, completed, cancelled. |
| startDate | Date | Si | - | Data inizio viaggio. |
| endDate | Date | No | startDate | Se assente viene impostata uguale a startDate nel pre-validate. |
| isMultiDay | Boolean | No | false | Ricalcolato in pre-validate: true se endDate > startDate. |
| locationSummary | String | No | null | Max 180, trim. |
| notes | String | No | null | Max 2000, trim. |
| stages | Array<Stage> | No | [] | Timeline attivita embedded. |
| createdAt | Date | Auto | auto | Timestamps Mongoose. |
| updatedAt | Date | Auto | auto | Timestamps Mongoose. |

Virtual stats (non salvati su DB, calcolati al volo):

| Campo virtuale | Tipo | Come viene calcolato |
| --- | --- | --- |
| daysCount | Number | Numero giorni distinti presenti nelle attivita (dayNumber esplicito o inferito da startAt). |
| activitiesCount | Number | Lunghezza array stages. |
| stagesCount | Number | Alias di activitiesCount. |
| expensesCount | Number | Conteggio totale spese su tutte le attivita. |
| totalSpent | Number | Somma importi spese, arrotondata a 2 decimali. |

## 3.2 Stage (attivita)

| Campo | Tipo | Obbligatorio | Default | Note |
| --- | --- | --- | --- | --- |
| _id | ObjectId | Auto | auto | Id subdocument attivita. |
| title | String | Si | - | Max 120, trim. |
| description | String | No | null | Max 1000, trim. |
| location | String | No | null | Max 120, trim. |
| dayNumber | Number | No | null | Giorno logico del viaggio (>= 1). |
| sequence | Number | No | 1 | Ordine nel giorno, ricalcolato dal service. |
| startAt | Date | No | null | Data/ora inizio attivita. |
| endAt | Date | No | null | Data/ora fine attivita. |
| activityType | String enum | No | altro | trek, visita, trasferimento, food, relax, outdoor, altro. |
| kind | String | No | null | Backward compatibility con dati vecchi/seed. |
| parentStageId | ObjectId | No | null | Collegamento opzionale ad altra attivita. |
| media | Array<String> | No | [] | URL/media max 500 char per item. |
| notes | String | No | null | Max 1000, trim. |
| technical | StageTechnical | No | {} | Blocco dati outdoor opzionale. |
| expenses | Array<Expense> | No | [] | Spese associate alla singola attivita. |
| createdAt | Date | Auto | auto | Timestamps Mongoose del subdocument. |
| updatedAt | Date | Auto | auto | Timestamps Mongoose del subdocument. |

Note operative:

- dayNumber puo arrivare dal form o essere inferito da startAt.
- sequence viene mantenuta coerente per giorno (ordinamento timeline).

## 3.3 Technical (outdoor opzionale)

| Campo | Tipo | Obbligatorio | Default | Vincoli |
| --- | --- | --- | --- | --- |
| distanceKm | Number | No | null | >= 0 |
| elevationGainM | Number | No | null | >= 0 |
| movingTimeMin | Number | No | null | >= 0 |
| difficulty | String enum | No | null | facile, media, impegnativa, esperto |
| terrain | String enum | No | null | asfalto, sterrato, sentiero, misto |
| gpxUrl | String | No | null | Max 500, trim |

## 3.4 Expense (spesa)

| Campo | Tipo | Obbligatorio | Default | Vincoli |
| --- | --- | --- | --- | --- |
| _id | ObjectId | Auto | auto | Id subdocument spesa |
| title | String | Si | - | Max 120, trim |
| amount | Number | Si | - | >= 0 |
| currency | String | No | EUR | Uppercase, lunghezza 3 |
| category | String enum | No | altro | trasporto, alloggio, cibo, attivita, attrezzatura, altro |
| paidAt | Date | No | now | Data pagamento |
| notes | String | No | null | Max 500, trim |
| createdAt | Date | Auto | auto | Timestamps Mongoose del subdocument |
| updatedAt | Date | Auto | auto | Timestamps Mongoose del subdocument |

Comportamento:

- Tutti i campi technical sono opzionali.
- Se non valorizzati, l'attivita resta valida e viene gestita come attivita standard.

## 4. Business logic

File: src/modules/travel/travel.service.js

Funzioni chiave:

1. Calcolo giorno attivita:
   - usa dayNumber esplicito, oppure inferenza da startDate/startAt.
2. Ordinamento timeline:
   - sequence ricalcolata per giorno in base all'orario startAt.
3. Modalita inserimento giorno in UI:
   - giorno esistente oppure nuovo giorno automatico.
4. Parsing technical:
   - accetta payload annidato technical[...] e normalizza numeri/stringhe.

### 4.1 Regole "nuovo giorno" (dayMode)

Quando aggiungi una attivita dalla UI, il service applica questo ordine:

1. Se arriva dayNumber (o existingDayNumber), usa quel giorno.
2. Se dayMode = new, calcola automaticamente il prossimo giorno disponibile:
   - `nextDay = max(dayNumber presenti) + 1`
3. Se non c'e un giorno esplicito ma c'e startAt, prova a inferire il giorno da startDate del viaggio.
4. Se e presente solo startTime (HH:mm), costruisce startAt combinando:
   - data = startDate + (dayNumber - 1)
   - ora = startTime

Perche questa logica:

- evita buchi/duplicazioni quando si crea un "nuovo giorno" dalla UI
- mantiene la timeline consistente anche con input parziali
- garantisce un ordinamento stabile nel giorno tramite ricalcolo sequence

## 5. PDF report

File: src/modules/travel/travels.app.controller.js

Il report PDF include:

- copertina con dati viaggio
- statistiche sintetiche
- riepilogo spese per categoria
- itinerario per giorno
- dettaglio attivita e spese
- sintesi tecnica per attivita (se presente)

Header anti-cache attivi per evitare download obsoleti in browser.

## 6. Validazione

File: src/modules/travel/travel.validator.js

Validazioni principali:

- id Mongo per tripId/stageId
- enum category/status/activityType/expense.category
- date ISO dove richieste
- controlli campi technical (float/int/enum/url)
- validazioni specifiche web (dayMode, existingDayNumber, newDayNumber, startTime)

## 7. UI EJS

View principali:

- src/views/travels/index.ejs
- src/views/travels/new.ejs
- src/views/travels/show.ejs
- src/views/travels/partials/new-activity-modal.ejs

Comportamenti UX:

- lista viaggi paginata e filtrabile
- dettaglio viaggio per giorni con accordion
- creazione/modifica attivita inline
- eliminazione attivita e viaggio con azioni dedicate lato UI
- gestione spese per singola attivita
- inserimento dati technical nel form attivita

## 8. Test automatici

Documentazione estesa: tests/README.md

La suite e separata per livello, in modo da avere feedback rapido sui pezzi piccoli e copertura realistica sui flussi completi.

Struttura:

- tests/unit: protegge logica isolata del modulo, per esempio virtual e helper del model.
- tests/integration: verifica service + model + Mongo in-memory.
- tests/e2e: verifica flussi reali HTTP/web tramite Express e sessione.

Copertura attuale rilevante per il modulo travel:

- calcolo virtual `stats` del trip;
- lookup di una stage embedded con `findStageById`;
- delete stage nel service con riallineamento di `sequence`;
- flusso web completo login -> crea viaggio -> aggiungi stage -> elimina stage.

Perche e importante:

- la delete stage non e solo rimozione dati, ma anche coerenza della timeline per giorno;
- i test unit proteggono la logica piu economica da eseguire;
- i test integration proteggono il comportamento con Mongoose;
- i test e2e proteggono il flusso davvero usato dall'utente finale.

## 9. Seed mock

File: src/scripts/seed-mock-data.js

Il seed include vari scenari utili per QA:

- viaggi planned/ongoing/completed/cancelled
- viaggio senza attivita
- attivita con technical completo, parziale e assente
- casi trekking, road trip, city break, bikepack, ferrata

Il seed e idempotente per owner + title.

## 10. Estensioni consigliate

1. Multilingua label UI (i18n) con dizionari per lingua.
2. API update stage/delete stage anche su canale REST.
3. Coverage aggiuntiva su validator travel e casi errore web/API.
4. Metriche aggregate outdoor per giorno/viaggio (km, dislivello, moving time).
