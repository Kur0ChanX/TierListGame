# Tier List RPG & JRPG di Mario

App statica, si apre anche con doppio clic (file://), senza server né build.

## Struttura
- `Tier List RPG & JRPG di Mario.html`: solo markup (~9 KB).
- `style.css`: tutto il CSS.
- `app.js`: tutta la logica (storie, pro/contro, dopamina, filtri, locandine, profili...).
- `gemini.js`: motore Gemini (riserva/alternativa a Claude) e impostazioni ⚙️ in "Chiedi a Claude". `askLLM()` è il punto unico per chiamare l'AI.
- `sync.js`: sincronizzazione automatica dei dati `jrpg_*` (localStorage) su un Gist privato via token GitHub (permesso `gist`). Caricato PRIMA di app.js.
- `theme.css`: tema grafico "Aurora glass" (solo override di style.css, caricato dopo). `fx.js`: piccoli effetti (barra voto, vibrazione, transizione tra schede).
- `genres.js`: verifica dei generi su Wikidata (nuovi giochi in automatico; controllo completo con conferma). `icons/logo.png`: logo Raccoon Tier.
- `giochi.js`: dati, `const GIOCHI_DATA = {games, sagaMap, enrich, dopa, labels, market};` (~1,9 MB).

## Regole per risparmiare token
- NON leggere mai `giochi.js` per intero e non usare Read senza `limit`: è enorme. Cerca con Grep (`-o`, `head_limit`) o interroga con uno script Node/jq.
- Il file è JSON puro dopo il prefisso `const GIOCHI_DATA = ` e con `;` finale: per analizzarlo, `sed '1s/^const GIOCHI_DATA = //; $s/;$//' giochi.js | jq ...`. Per modificare un gioco usa uno script che ricarica, cambia solo il gioco interessato (per `id`) e riscrive con `JSON.stringify` compatto (una riga, stesso formato).
- Prima di toccare i dati, indica quali chiavi/id servono; non stampare mai oggetti interi di massa.
- Per il codice: usa Grep per trovare la funzione in `app.js`, poi Read solo di quell'intervallo di righe.
- Non modificare, semplificare o rimuovere funzioni esistenti se non richiesto.
- Non usare `fetch`/XHR per i dati locali: file:// li blocca. I dati vanno caricati con `<script src>`.
- Per modifiche di routine (testi, colori, singoli dati) basta un modello leggero; per logica nuova o bug usare Sonnet.
- La chiave Gemini dell'utente sta solo in localStorage (`jrpg_gemini_key`): non scriverla mai nel codice, nei commit o nei file.
- Il token GitHub (`jrpg_sync_token`) sta solo in localStorage: mai nel codice, nei commit o nei file.
- Fuori da Claude `COVER_DB` è un archivio locale (`makeLocalDb` in app.js) con la stessa interfaccia del db di Claude.
- Ogni nuovo file JS va aggiunto a `.github/workflows/pages.yml` e alla pubblicazione dell'artifact.
- Classifiche per genere: `ACTIVE_LIST`, `MY_LISTS`, `inActiveList()` in app.js; `applyFilters()` parte sempre da `GAMES.filter(inActiveList)`. La lista `jrpg` è quella predefinita.
- App installabile: `manifest.webmanifest` (display fullscreen), `sw.js` (nessuna cache) e `icons/`; il workflow Pages li copia. Il pulsante ⛶ è in `fx.js`.
- Nei testi dei giochi (agingNote, pro/contro, ecc.) NON usare frasi legate al tempo ("uscito da poco", "recentissimo"): scrivi l'anno. Prima di pubblicare dati esegui `node tools/check-data.js`.
- Tag di un gioco: il primo è il genere principale; un tag "extra" (Puzzle, Platform, Picchiaduro, RTS…) toglie il gioco dalla lista JRPG / RPG e lo mette nella lista di quel genere.
