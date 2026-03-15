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

Campi principali:

- owner
- title
- description
- category: escursione | trekking | visita | vacanza | roadtrip | altro
- status: planned | ongoing | completed | cancelled
- startDate
- endDate
- locationSummary
- notes
- stages[]

Virtual stats:

- daysCount
- activitiesCount
- expensesCount
- totalSpent

## 3.2 Stage (attivita)

Campi principali:

- title
- description
- location
- dayNumber
- sequence
- startAt
- endAt
- activityType: trek | visita | trasferimento | food | relax | outdoor | altro
- notes
- expenses[]
- technical (opzionale)

## 3.3 Technical (outdoor opzionale)

Campi disponibili:

- distanceKm (>= 0)
- elevationGainM (>= 0)
- movingTimeMin (>= 0)
- difficulty: facile | media | impegnativa | esperto
- terrain: asfalto | sterrato | sentiero | misto
- gpxUrl

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
- gestione spese per singola attivita
- inserimento dati technical nel form attivita

## 8. Seed mock

File: src/scripts/seed-mock-data.js

Il seed include vari scenari utili per QA:

- viaggi planned/ongoing/completed/cancelled
- viaggio senza attivita
- attivita con technical completo, parziale e assente
- casi trekking, road trip, city break, bikepack, ferrata

Il seed e idempotente per owner + title.

## 9. Estensioni consigliate

1. Multilingua label UI (i18n) con dizionari per lingua.
2. API update stage/delete stage anche su canale REST.
3. Test automatici service + validator del modulo travel.
4. Metriche aggregate outdoor per giorno/viaggio (km, dislivello, moving time).
