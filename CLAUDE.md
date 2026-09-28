# Tier List RPG & JRPG di Mario

App statica, si apre anche con doppio clic (file://), senza server né build.

## Struttura
- `Tier List RPG & JRPG di Mario.html`: solo markup (~9 KB).
- `style.css`: tutto il CSS.
- `app.js`: tutta la logica (storie, pro/contro, dopamina, filtri, locandine, profili...).
- `giochi.js`: dati, `const GIOCHI_DATA = {games, sagaMap, enrich, dopa, labels, market};` (~1,9 MB).

## Regole per risparmiare token
- NON leggere mai `giochi.js` per intero e non usare Read senza `limit`: è enorme. Cerca con Grep (`-o`, `head_limit`) o interroga con uno script Node/jq.
- Il file è JSON puro dopo il prefisso `const GIOCHI_DATA = ` e con `;` finale: per analizzarlo, `sed '1s/^const GIOCHI_DATA = //; $s/;$//' giochi.js | jq ...`. Per modificare un gioco usa uno script che ricarica, cambia solo il gioco interessato (per `id`) e riscrive con `JSON.stringify` compatto (una riga, stesso formato).
- Prima di toccare i dati, indica quali chiavi/id servono; non stampare mai oggetti interi di massa.
- Per il codice: usa Grep per trovare la funzione in `app.js`, poi Read solo di quell'intervallo di righe.
- Non modificare, semplificare o rimuovere funzioni esistenti se non richiesto.
- Non usare `fetch`/XHR per i dati locali: file:// li blocca. I dati vanno caricati con `<script src>`.
- Per modifiche di routine (testi, colori, singoli dati) basta un modello leggero; per logica nuova o bug usare Sonnet.
