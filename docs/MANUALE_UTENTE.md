# Manuale Utente - Travel Trackr

Versione: 1.1
Target: utenti finali (non tecnici)

## 1. A cosa serve Travel Trackr

Travel Trackr e un diario operativo per organizzare viaggi, giornate e costi.

Con l'app puoi:

- creare viaggi e descriverli in modo chiaro
- suddividere il viaggio in giorni e attivita
- tenere traccia delle spese per singola attivita
- aggiungere dati tecnici outdoor (facoltativi)
- esportare un report PDF pronto da condividere

Questo manuale ti guida passo passo dall'accesso fino alla gestione completa di un viaggio.

## 2. Accesso all'app e account demo

URL locale (sviluppo):

- http://localhost:3000/users/app

Credenziali demo disponibili:

- Utente standard: demo.user@travel-trackr.local / Password123!
- Utente admin: demo.admin@travel-trackr.local / Password123!

Quando usi account demo, i dati possono essere rigenerati dal seed mock.

## 3. Login, logout e primo accesso

### 3.1 Login

1. Apri la pagina di login.
2. Inserisci email e password.
3. Clicca su "Accedi".

Se le credenziali sono corrette, arrivi alla dashboard viaggi.

### 3.2 Primo accesso con password temporanea

Se il tuo account e stato creato da admin, al primo login devi cambiare password.

1. Vai in Profilo.
2. Compila i campi password attuale e nuova password.
3. Salva.

Finche non aggiorni la password, alcune aree potrebbero essere limitate.

### 3.3 Logout

Per uscire dall'app usa il comando "Logout" nella barra di navigazione.

## 4. Schermata "I tuoi viaggi"

Nella pagina principale trovi l'elenco dei viaggi in formato card.

Ogni card mostra:

- titolo e localita principali
- categoria e stato
- periodo del viaggio
- numero di giorni
- numero di attivita
- totale spese

### 4.1 Filtri e ordinamento

Puoi filtrare per:

- Stato (Pianificato, In corso, Completato, Annullato)
- Categoria (Escursione, Trekking, Visita, Vacanza, Road trip, Altro)

Puoi ordinare per data:

- Piu recenti prima
- Piu vecchi prima

Puoi anche scegliere quanti elementi mostrare per pagina.

### 4.2 Paginazione

Se i viaggi sono molti, usa "Precedente" e "Successiva" in fondo alla pagina.

## 5. Creazione di un nuovo viaggio

Per creare un viaggio:

1. Clicca "Nuovo viaggio".
2. Compila i campi principali.
3. Salva con "Crea viaggio".

Campi consigliati:

- Titolo: nome breve e riconoscibile
- Categoria: tipo di viaggio
- Stato: fase corrente del viaggio
- Data inizio: obbligatoria
- Data fine: opzionale (se vuota, il viaggio risulta di un giorno)
- Localita principali: elenco breve luoghi
- Descrizione: obiettivo del viaggio
- Note: checklist o promemoria

Esempio:

- Titolo: Weekend Dolomiti
- Categoria: Trekking
- Stato: Pianificato
- Localita: Cortina, Tre Cime, Braies

## 6. Pagina dettaglio viaggio

Aprendo un viaggio vedi una pagina con:

- intestazione con titolo e pulsanti azione
- statistiche rapide (durata, giorni, attivita, spesa totale)
- descrizione generale
- sezione giorni e attivita

Azioni principali disponibili:

- Scarica PDF
- Modifica viaggio
- Elimina viaggio

## 7. Modifica e cancellazione viaggio

### 7.1 Modifica viaggio

1. Clicca "Modifica viaggio".
2. Aggiorna i campi desiderati.
3. Clicca "Salva modifiche".

### 7.2 Elimina viaggio

1. Clicca "Elimina".
2. Conferma nel popup.

Attenzione: l'eliminazione e definitiva (rimuove anche attivita e spese collegate).

## 8. Gestione giorni e attivita

La timeline e organizzata in accordion per giorno.

### 8.1 Aggiungere una nuova attivita

1. Clicca "+ Nuova attivita".
2. Scegli dove inserirla:
    - Giorno esistente
    - Nuovo giorno
3. Compila i campi base:
    - Titolo attivita (obbligatorio)
    - Tipo attivita
    - Orario inizio (opzionale)
    - Luogo
    - Descrizione
4. Salva con "Aggiungi attivita".

Se l'orario non e indicato, l'attivita viene comunque salvata ma l'ordinamento puo risultare meno preciso.

### 8.2 Modificare una attivita esistente

1. Apri il giorno interessato.
2. Clicca "Modifica" sulla card attivita.
3. Aggiorna i campi.
4. Salva.

### 8.3 Consiglio pratico sull'ordine

Per una timeline pulita:

- inserisci sempre un orario inizio
- usa titoli brevi e chiari
- evita attivita duplicate nello stesso giorno

## 9. Dati tecnici outdoor (opzionali)

Per attivita come trekking, bikepack o uscite outdoor puoi aggiungere metriche tecniche.

Campi disponibili:

- Distanza (km)
- Dislivello positivo (m)
- Tempo in movimento (min)
- Difficolta (facile, media, impegnativa, esperto)
- Terreno (asfalto, sterrato, sentiero, misto)
- Link GPX

Note importanti:

- tutti i campi sono facoltativi
- puoi compilare solo quelli che hai
- i dati tecnici appaiono nella card attivita e nel PDF

## 10. Gestione spese

Ogni attivita ha una sezione "Spese" dedicata.

Per inserire una spesa:

1. Inserisci titolo (es. Pranzo rifugio).
2. Inserisci importo (es. 24.50).
3. Scegli categoria.
4. Clicca "Aggiungi spesa".

Categorie disponibili:

- Trasporto
- Alloggio
- Cibo
- Attivita
- Attrezzatura
- Altro

Le spese vengono sommate automaticamente nel totale viaggio.

## 11. Report PDF

Dal dettaglio viaggio clicca "Scarica PDF".

Il PDF include:

- dati generali del viaggio
- stato e categoria
- riepilogo spese per categoria
- giornate con attivita
- spese per attivita
- blocco tecnico outdoor (se presente)

Uso consigliato:

- condivisione con compagni di viaggio
- archivio a fine viaggio
- stampa per briefing o report personale

## 12. Profilo e password

Nella sezione Profilo puoi:

- vedere email e ruolo
- cambiare password

Best practice password:

- usa almeno 10 caratteri
- combina lettere maiuscole/minuscole, numeri e simboli
- evita password gia usate altrove

## 13. Funzioni admin (solo ruolo admin)

L'utente admin puo:

- creare nuovi utenti
- assegnare password temporanea
- bloccare/sbloccare utenze
- eliminare utenti

Flusso tipico admin:

1. crea account nuovo utente
2. comunica credenziali temporanee
3. utente effettua primo login e cambia password

## 14. Esempi operativi rapidi

### 14.1 Preparazione viaggio trekking

1. Crea viaggio con stato Pianificato.
2. Inserisci i giorni principali.
3. Aggiungi attivita trekking con distanza/dislivello.
4. Carica link GPX nelle attivita tecniche.
5. Esporta PDF per condividere il piano.

### 14.2 Consuntivo fine viaggio

1. Aggiorna stato su Completato.
2. Verifica che tutte le spese siano inserite.
3. Controlla il totale.
4. Scarica PDF finale come archivio.

## 15. Errori comuni e soluzioni

- Problema: login non riuscito
   Soluzione: verifica email/password, attenzione a spazi finali copiando/incollando.

- Problema: non vedi un viaggio appena creato
   Soluzione: resetta filtri (stato/categoria) e controlla paginazione.

- Problema: attivita nel giorno sbagliato
   Soluzione: apri "Modifica" attivita e correggi campo giorno.

- Problema: PDF sembra vecchio
   Soluzione: riscarica dal dettaglio viaggio (il file ha nome aggiornato a ogni export).

- Problema: errore generico in pagina
   Soluzione: riprova; se persiste segnala supporto con data/ora e azione eseguita.

## 16. FAQ

Posso usare l'app senza compilare i dati tecnici?

- Si, sono opzionali.

Posso creare un viaggio senza data fine?

- Si, e trattato come viaggio di un giorno.

Posso usare categorie personalizzate?

- Al momento no, sono predefinite.

Il testo nei campi descrizione/note viene tradotto automaticamente?

- No, il contenuto resta esattamente quello inserito dall'utente.

## 17. Glossario

- Viaggio: contenitore principale.
- Giorno: gruppo logico di attivita.
- Attivita: singola voce nel giorno (trek, visita, trasferimento, ecc.).
- Spesa: costo associato a una attivita.
- Dato tecnico: metrica outdoor opzionale.
- GPX: file/traccia GPS del percorso.
