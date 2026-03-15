# Test Suite

Questa cartella isola tutti i test automatici del progetto.

L'obiettivo non e solo "avere test", ma proteggere i flussi piu delicati del modulo travel quando il codice cambia nel tempo. In pratica i test servono a:

- evitare regressioni quando si tocca service, model, route o validazioni;
- dare feedback rapido durante refactor e fix;
- documentare il comportamento atteso in modo eseguibile;
- rendere piu semplice il handover dopo mesi senza dover ricostruire tutto a mente.

Stack usato:

- `Jest` come test runner/assertion framework.
- `Supertest` per i test HTTP end-to-end su Express.
- `mongodb-memory-server` per eseguire test con MongoDB in memoria, senza usare il database reale.

## Perche i test sono separati per livello

Non tutti i test hanno lo stesso scopo.

- I test unitari servono a controllare logica piccola e isolata: sono i piu veloci e aiutano a capire subito dove si e rotto qualcosa.
- I test di integrazione servono a verificare che piu pezzi collaborino correttamente: per esempio service + model + database in-memory.
- I test end-to-end servono a verificare il flusso reale dal punto di vista dell'utente o del client HTTP: sono piu lenti ma coprono il valore business completo.

Questa separazione evita due errori comuni:

- usare solo E2E, che diventano lenti e fragili;
- usare solo unit test, che non bastano a garantire che il flusso vero funzioni davvero.

## Struttura

- `tests/unit`: test veloci su logica isolata (modelli, helper, funzioni pure).
	Attualmente qui verifichiamo il modello travel, per esempio stats aggregate e ricerca stage embedded.
- `tests/integration`: test di collaborazione tra service + database in-memory.
	Qui controlliamo che la logica di business lavori bene con Mongoose, senza passare ancora dal layer HTTP.
- `tests/e2e`: test di flusso completo HTTP (login, route, persistenza).
	Qui simuliamo richieste vere all'app Express, incluse sessione web, redirect e scrittura su DB.
- `tests/helpers`: utilita condivise per il setup del DB di test.

## Cosa coprono i test attuali

### Unit

File attuale: [tests/unit/travel.model.unit.test.js](tests/unit/travel.model.unit.test.js)

Copertura attuale:

- calcolo di `trip.stats` per giorni, attivita, numero spese e totale speso;
- metodo `findStageById`, utile per trovare una stage embedded senza query extra.

Perche serve:

- se si cambia il model o i virtual, questi test avvisano subito se si rompe il comportamento base;
- sono molto veloci, quindi sono ideali per proteggere la logica centrale piu semplice.

### Integration

File attuale: [tests/integration/travel.service.integration.test.js](tests/integration/travel.service.integration.test.js)

Copertura attuale:

- eliminazione di una stage dal viaggio;
- riallineamento della `sequence` nel giorno dopo la delete;
- gestione del caso in cui lo `stageId` non esista.

Perche serve:

- la delete stage non e solo una rimozione: deve anche mantenere coerente la timeline interna;
- questo tipo di test verifica la logica reale del service con Mongoose, ma senza il rumore del layer HTTP.

### E2E

File attuale: [tests/e2e/travel.web.delete-stage.e2e.test.js](tests/e2e/travel.web.delete-stage.e2e.test.js)

File aggiuntivo: [tests/e2e/travel.api.delete-stage.e2e.test.js](tests/e2e/travel.api.delete-stage.e2e.test.js)

File aggiuntivo: [tests/e2e/user.api.authorization.e2e.test.js](tests/e2e/user.api.authorization.e2e.test.js)

Copertura attuale:

- login web;
- creazione viaggio;
- aggiunta stage;
- delete stage tramite route web;
- verifica finale su database;
- login API e ottenimento Bearer token;
- delete stage tramite endpoint REST JSON;
- vincolo di ownership: un utente non puo eliminare stage di un altro owner.
- verifica autorizzazione su API utenti: anonimo bloccato, utente standard bloccato, admin ammesso.

Perche serve:

- conferma che il flusso usato davvero dall'utente continui a funzionare;
- copre sessione, route, middleware, controller, service e persistenza in un colpo solo;
- e il test piu vicino al comportamento reale dell'app;
- protegge gia il percorso server-only, cosi la futura rimozione di EJS non lascia scoperta la delete stage.

## Quando aggiungere un test unit, integration o e2e

Usa come regola pratica:

- aggiungi un `unit` se stai introducendo o modificando una regola locale, un helper, un virtual o una trasformazione dati;
- aggiungi un `integration` se stai toccando service, model o logica che dipende dal database;
- aggiungi un `e2e` se stai modificando un flusso critico per utente o API, specialmente login, create/update/delete, autorizzazioni, redirect o persistenza finale.

Esempi concreti per questo progetto:

- nuova regola su `stats` del viaggio: `unit`;
- cambio nella logica di sequenza delle stage: `integration`;
- nuova azione web o API che crea/aggiorna/elimina dati: almeno un `e2e` o un test HTTP equivalente.

## Comandi

- `npm test`: esegue tutta la suite.
- `npm run test:unit`: esegue solo i test unitari.
- `npm run test:integration`: esegue solo i test di integrazione.
- `npm run test:e2e`: esegue solo i test end-to-end.

## Note operative

- I test usano `mongodb-memory-server`, quindi non toccano il database reale.
- I test sono eseguiti in sequenza (`--runInBand`) per evitare conflitti su Mongoose/DB in-memory.
- I test E2E usano `Supertest` con `request.agent(...)` per mantenere la sessione web tra piu richieste.
- Nell'e2e lo store di sessione e in memoria, cosi i test non restano appesi a connessioni o timer di `connect-mongo`.

## Manutenzione

Quando aggiungi una feature o correggi un bug, la regola consigliata e:

1. scrivi o aggiorna il test che descrive il comportamento atteso;
2. implementa la modifica nel codice applicativo;
3. esegui almeno la suite piu vicina alla modifica (`unit`, `integration` o `e2e`);
4. prima di chiudere il lavoro, lancia `npm test`.

Se devi scegliere dove investire prima, privilegia i flussi che muovono dati utente o che hanno logica di ordinamento, aggregazione, delete e autorizzazione.
