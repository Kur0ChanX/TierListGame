# Passaggio di consegne — Tier List RPG & JRPG di Mario («Raccoon Tier»)

Questo file serve a un'altra istanza di Claude Code (altro account) per continuare **esattamente** dove ci siamo fermati, come se la sessione fosse la stessa.
Leggi PRIMA questo file, poi `CLAUDE.md` (regole fisse) e, solo quando serve, `docs/ARCHITETTURA.md` (con Grep sulla voce, mai tutto).

Ultimo aggiornamento: v243 (2 ottobre 2026). Sito: https://kur0chanx.github.io/TierListGame/ · Repo: `kur0chanx/TierListGame`.

---------------------------------------------------------------------

## 0. Stato attuale (v248, 3/10/2026) — leggi prima questo
- v237–v243 fatti: «🧪 Prova tutto» nelle impostazioni; OpenCritic senza chiave (Wikidata + pagina pubblica via ponte); Frugu anti-spazzatura; `sospetti.js` (sospetti messi da parte + «🔍 Guarda meglio»); avvisi nuovi (scheda di vetro); voce con 4 motori (Gemini, Google Cloud, Google Traduttore, telefono) e lettore a catena; prompt delle trame ZERO spoiler + pulizia una tantum `jrpg_ovstory243`.
- v244–v248: **riscritte TUTTE le 765 trame dei giochi di base** (campo `story`, 79–115 parole, con accenti, senza spoiler: ambientazione, protagonisti, premessa e domande finali). Corretti anche errori delle trame vecchie (nomi sbagliati, anni, rivelazioni di fine gioco). Il punto 7.0 è chiuso. Se l'utente segnala uno spoiler o un errore su un gioco, correggi solo quel gioco (load()/save()).
- Da qui NON si leggono i gist dell'utente (API GitHub limitata al repo): i giochi aggiunti stanno solo sul suo telefono.
- Le voci Microsoft Edge NON si possono usare (bisognerebbe fingersi il browser Edge: bloccato).

## 1. Chi è l'utente e come parlargli
- **Mario**, italiano, **non programmatore**. Usa il telefono (Android, schermo 120 Hz) e il programma come app installata.
- Rispondi **sempre in italiano, breve, senza gergo**. Niente riassunti lunghi. Spiega i problemi con parole semplici («il telefono non può chiedere a Steam…»).
- È **esigente e diretto**: quando una cosa è sbagliata la segnala più volte, e si arrabbia se si ripete lo stesso errore o se si promette qualcosa che non si fa. Regole che ne derivano:
  - **MAI promettere controlli a orario** («ti scrivo i numeri alle 17») se non puoi davvero garantirli. Se serve guardare un log, fallo ora o dì che lo vedrai alla prossima richiesta.
  - Se un problema è segnalato una seconda volta, **non rifare lo stesso tentativo**: cerca la causa vera (lo abbiamo imparato con la locandina di Dragon Quest: 3 tentativi, la causa era che il telefono non può interrogare Steam).
  - Non dire «fatto» senza averlo provato (Playwright) e dillo onestamente quando una cosa non l'hai potuta provare sul suo telefono.
  - Vuole lavoro **accurato e professionale**, non sbrigativo. Se il lavoro è grande, dividilo in versioni (v203, v204…) e dillo.
- **Obiettivo di fondo del programma (il cuore):** *capire i gusti di Mario e trovargli giochi che gli piacciono*, imparando nel tempo «come un cervello in sviluppo». Ogni funzione nuova va pensata anche come **segnale di apprendimento** per il modello dei gusti.
- Gli piace: animazioni fluidissime stile iPhone (60/120 fps), grafica moderna e leggibile «a colpo d'occhio», icone piccole e belle, tutto raggruppato senza ripetizioni, scheda ordinata e personalizzabile. Non gli piace: roba che sembra «winmix anni della preistoria», pulsanti sparsi, testi minuscoli, cose che saltano o si bloccano.
- Ha 765 giochi di base + giochi «aggiunti» (catalogo su gist pubblico): in tutto 1369 al 1/10/2026. Quando parli di numeri usa SEMPRE il totale reale (`GAMES.length`), mai 765. Pensa a un futuro con ~10.000 giochi.

## 2. Come si lavora (flusso fisso)
1. Lavora SEMPRE sul branch di sessione (nome nel prompt di sistema, ultima volta `ccr-d50b3788-p04gyp`). Non creare PR se non richiesto; **l'utente di solito lo chiede a ogni versione** («pubblica»): commit → push → PR → squash merge → controllo `<meta name="build">` online → `git checkout -B <branch> origin/main` e `git push -f`.
2. **Ad ogni versione** (regola in `CLAUDE.md`): `DATA_BUILD_VERSION` e `DATA_BUILD_DATE` in `app-ai.js`; `<meta name="build" content="vNN">` nell'HTML (devono coincidere); voce nel CHANGELOG di `app-utente.js` con `date:'AAAA-MM-GG', time:'HH:MM'` (ora italiana: `TZ=Europe/Rome date +%H:%M`); poi `node tools/check-data.js` → deve dire «Nessun avviso».
3. Nuovo file JS: aggiungilo nell'HTML (ordine!), in `sw.js` (elenco `SHELL`) e in `.github/workflows/pages.yml` (riga `cp`). I nuovi moduli vanno **in fondo, prima di `motion.js`** (che resta l'ultimo; ora contiene anche `window.__rtReady`).
4. GitHub: **non c'è `gh`**: si usano i tool MCP `mcp__github__*` (carica con ToolSearch: `select:mcp__github__create_pull_request,mcp__github__merge_pull_request`). Se il PR dà «merge conflicts»: quasi sempre sono `facts.js` e `tools/facts-chk.json` perché il workflow notturno li riscrive → `git merge origin/main`, poi `node tools/merge-facts.js`, `git add`, commit, push. Per gli altri file: `git checkout --ours -- "file"` uno alla volta (HTML tra virgolette), poi `check-data`.
5. Commit/PR: aggiungi le righe di attribuzione richieste dal prompt di sistema; **non scrivere identificativi di modello** nei file o nei messaggi pubblicati.
6. Dopo ogni merge verifica online: `curl -s https://kur0chanx.github.io/TierListGame/?x=$RANDOM | grep -o '<meta name="build"[^>]*>'` (GitHub Pages ci mette qualche minuto).
7. **Risparmio token** (vedi `CLAUDE.md`): per trovare una funzione usa `node tools/mappa.js FILE [parola]` (righe esatte), poi Read solo di quell'intervallo. MAI leggere per intero `giochi.js`, `giochi-dettagli-*.js`, `ost.js`, `discoveries.js`, `facts.js`, `radar.js`, `quality.js`, `backup-aurora/` (il Read è bloccato in `.claude/settings.json`). Per i dati usa `tools/data-io.js` (`load()`/`save(D)`), `jq`, o `vm.runInContext` per leggere `facts.js`/`shots.js` (vedi `tools/merge-facts.js`). Per il codice: Grep la funzione, poi Read di un intervallo.
8. `backup-aurora/`: **non modificarla**.
9. Segreti: chiavi dell'utente (Gemini `jrpg_gemini_key`, RAWG, OpenCritic, token GitHub `jrpg_sync_token`) **solo in localStorage**, mai nel codice/commit/file. Richieste con chiave: SEMPRE `relays:false`. Chiamate a siti esterni: sempre `SearchHub.json/text` (mai fetch diretto); nuova fonte → `SearchHub.PRIORITY`.
10. Aggiornamenti in background: MAI `render()`; usa `refreshGameRow(g)` / `renderWhenIdle({...})` / `applyPatch(g, p, true)`.
11. Testi dei giochi: niente frasi legate al tempo («uscito da poco»): scrivi l'anno.
12. Ambiente cloud: `NODE_USE_ENV_PROXY=1` per gli script di rete; **non usare `pkill -f build-facts`** dentro un comando che contiene quella stringa (uccide la propria shell); i test: `NODE_PATH=/opt/node22/lib/node_modules`, Chromium in `/opt/pw-browsers/chromium`.

## 3. Come provare le modifiche (Playwright)
Cartella `tools/test/` (vedi `LEGGIMI.md`). Schema: avvia Chromium headless con viewport 412×915 `isMobile`, blocca la rete (`ctx.route('**/*', r=> r.abort())` tranne `file:`/localhost), simula i siti con `route.fulfill`, apri `file:///.../Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html`, esegui `page.evaluate`. Per misurare la fluidità: `Emulation.setCPUThrottlingRate` ×4 + `PerformanceObserver({type:'longtask'})`. Per il service worker serve un server (`python3 -m http.server 8765`) e `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` per contare le richieste del SW. `navigator.webdriver` è vero in headless → l'intro viene saltata (voluto).
Prima di pubblicare riesegui almeno: `t199` (sintonia/locandina/carosello), `t205` (DNA/valutazioni/riordino), `tsw`, `tghost`, `tperf`.

## 4. Com'è fatta l'app (mappa veloce)
App **statica** (si apre anche con doppio clic, `file://`), niente server né build, `<script src>` classici, dati locali mai via fetch. Dettagli per file/chiavi/funzioni: `docs/ARCHITETTURA.md` (ultime sezioni: «v199–v203» e le voci v204/v205).
- **Dati base**: `giochi.js` + `giochi-dettagli-1..4.js` (765 giochi). **Dati notturni** (scritti dal workflow `.github/workflows/dati-settimanali.yml`, ogni notte `23 1 * * *` + lunedì completo; anche `workflow_dispatch`): `facts.js` (Steam: id, nome inglese `s.en`, prezzi, italiano), `voti.js` (Metacritic ufficiale + OpenCritic via Wikidata), `ost.js`, `shots.js`, `discoveries.js`, `radar.js`, `quality.js`. Catalogo dei giochi «aggiunti»: gist pubblico «RaccoonTier-catalogo» (`tools/catalog.js`, lettura anonima).
- **Fonti** (`sources.js` `SearchHub`): cache persistente IndexedDB, catena di relay + «ponte» personale (Cloudflare worker, `tools/cloudflare-worker.js` v2), `resolveGame/enName` (nome inglese + id Steam).
- **Voti** (`verify.js`): priorità fissa Metacritic → OpenCritic → RAWG; «V» = verificato, «S» = stima; Update+; «Fonti e lucchetti» per scegliere la fonte di ogni campo e bloccarla.
- **Gemini** (`gemini.js`): coda `gemPace`, gestione quote, blocchi fino alle 08:05 UTC.
- **Gusti**: `extras3.js` (`tasteModel`, `signals`, `MECH` ~43 tratti, `feats`), `gusto.js` (Sintonia % + 😍 top `jrpg_top`), `dna.js` (giochi simili con IDF, tratti DNA, parole libere con AI, tratti nuovi cercati nel catalogo), **`cervello.js`** (barra ⭐😍👍👎🚫💔🔁 + stati, valutazioni a 6 voci per 8 famiglie con tasti 1–10 e «Fine», importanza delle voci, fotografie giornaliere, pagina «Cosa ho imparato di te»).
- **Scheda del gioco**: `app-schede.js` (`openModal`, `labelHtml` «A colpo d'occhio» a riquadri, `highlightsHtml`), `ordine.js` (3 linguette Per te / Il gioco / Altro, riordino ↕️ `jrpg_card_order2`, menu ✨ a stanze), `media.js` (un pulsante «Locandina e foto»: cambia locandina, foto del carosello una per una con alternative infinite, blocchi 🔒 in `jrpg_media_lock`), `extras.js` (ricerca copertine; `recheckWeakCover`), `cinema.js` (carosello), `music.js` (player, Internet Archive + YouTube), `motion.js` (animazioni, apertura a cartoncino), `acquisto.js` (verdetto).
- **Avvio**: `intro.js` (schermata «Inizia a frugare»), `loader.js` (Frugu), `sw.js` (**cache a versioni**, v202), `fx.js` (guardia di versione).
- Chiavi localStorage importanti: `jrpg_favs`, `jrpg_status`, `jrpg_mytier`, `jrpg_myvote`, `jrpg_top`, `jrpg_react`, `jrpg_rate`, `jrpg_brain_hist`, `jrpg_dna_why`, `jrpg_dna_custom`, `jrpg_media_lock`, `jrpg_field_src/_game`, `jrpg_card_order2`, `jrpg_card_tab`, `rt_en_name`, `rt_srccache`. Tutte le `jrpg_*` si sincronizzano via gist (`sync.js`, eccetto `NOSYNC`).

## 5. Cose imparate (errori già fatti: non ripeterli)
- **GitHub Pages «Rate limit exceeded»**: il limite è per IP e su rete mobile l'IP è condiviso. Il service worker v2 rifaceva ~70 richieste a ogni apertura. Ora (v202) fa **1 richiesta per apertura** e usa la copia salvata se il sito risponde 429/5xx. Non rimettere mai un precaching di tutti i file all'installazione.
- **Il telefono NON può interrogare Steam** (`storesearch`/`appdetails` senza CORS): ogni dato Steam deve arrivare dal server (`facts.js`). Il nome inglese ufficiale (`s.en`) serve per cercare su RAWG/OpenCritic/Metacritic/Wikidata: i nomi italiani del catalogo («Echi di un'era perduta») danno giochi sbagliati.
- RAWG `find`: un titolo più corto NON equivale a uno più lungo («Dragon Quest» ≠ «Dragon Quest XI S…»).
- La locandina bloccata 🔒 va rispettata da **tutti** i percorsi (`saveAutoCover` controlla il lucchetto; `{force:true}` solo dai pannelli dell'utente).
- Spostare/ridisegnare i blocchi della scheda con `outerHTML` fa **saltare lo scroll** (successe con «Cosa ti ha preso»): aggiorna sul posto o ripristina `card.scrollTop`. L'osservatore di `ordine.js` riordina quando cambiano i figli di `#modalCard`.
- Apertura della scheda: il calcolo dei «giochi simili» bloccava l'animazione → ora è differito (`similarLazy`); i tratti dei giochi si precalcolano a riposo. L'animazione di apertura usa solo `transform/opacity` (cartoncino `.rt-ghost`).
- Intro: l'overlay restava 0,7 s ma intercettava i tocchi → News e icone in alto sembravano bloccate. Ora dopo 0,35 s non intercetta più e un guscio in `<body>` ricorda i tocchi fatti prima che il programma sia pronto (`__rtQ`/`__rtReady`).
- Gemini: i falsi «limite giornaliero» (v193) erano un bug di interpretazione delle quote.
- YAML dei workflow: nomi con `: ` vanno tra virgolette (`check-data` lo controlla).
- Un `git add -A` con la variabile `SP` non impostata nei test aveva creato una cartella `undefined/` con screenshot (rimossa): imposta sempre `SP`.
- Il workflow notturno riscrive `facts.js`, `voti.js` ecc.: unisci con `tools/merge-facts.js`.

- **BLOCCO DI 40 SECONDI (v203–v207, risolto in v208)**: il modello dei gusti (`tasteModel`) per sapere se era «ancora valido» ricalcolava `signals()` a ogni chiamata, e il cervello rileggeva (JSON.parse) i dati per OGNI gioco; il riquadro «Oggi» chiama `tasteScore` per centinaia di giochi → O(N²) con letture → 41 s di telefono bloccato (intro ferma, tocchi in alto morti, solo lo scorrimento funzionava). Regole: (1) `tasteModel` si invalida SOLO con il contatore `rtTasteVer()` (cresce quando si scrive una chiave di gusto, vedi `TASTE_RX` in extras3.js); (2) nei percorsi caldi leggi con `rtLSro(chiave)` (niente JSON.parse se il testo non cambia), mai `LS.get` per ogni gioco; (3) `feats()` e `rtSimNorm` hanno cache per gioco; (4) PROVA SEMPRE con `tools/test/theavy.js` e `theavy2.js` (profilo pesante + CPU 4×): nessun blocco > 1 s.
- I test «leggeri» (profilo vuoto) NON trovano questi problemi: l'utente ha 1.300 giochi e tanti dati. Usa i profili pesanti dei test.

## 5b. Struttura per 20.000+ giochi (v209) e prossimi passi
Misure con un catalogo finto di 20.000 giochi (`tools/test/make-big.js 20000 DIR` + `tools/test/tbig.js DIR 4`, CPU 4× più lenta):
prima della v209 48 MB di dati, 128 MB di memoria, lista in 1,5 s; dopo: indice 4,5 MB (178 KB con i 765 giochi veri), 33 MB di memoria, lista in 0,5 s, nessun blocco.
Fatto: indice «a tabella» + testi a pezzi da 250 giochi caricati quando servono + tratti precalcolati (identici: `tv3.js`).
Ancora da fare, in quest'ordine (ognuno con le sue prove):
1. ✅ (v211) **Giochi aggiunti, copertine, foto** in IndexedDB: `archivio.js` (prova `tools/test/tarch.js`).
2. ✅ (v211) **Colonne sonore e schermate** a pezzi `dati/notte-*.js` (`tools/shard-night.js`, prova `tools/test/tnight.js`). Restano interi `facts.js` e `voti.js` (servono a tutta la lista: nome inglese nella ricerca, voti verificati): a 20.000 giochi ~2–3 MB l'uno; prossimo passo = formato a tabella come giochi.js.
3. Lista: con molti giochi, la «Sintonia» per riga va calcolata solo per le righe visibili (oggi è veloce grazie alle cache, ma cresce con N).

## 6. Cronologia utile (v195 → v206)
v195 DNA del giocatore e giochi simili · v196 locandina/schermate con blocco, 5 canzoni · v197 griglia senza sfarfallio · v198 sintonia con somiglianza ai giochi amati, DNA a categorie, canzoni originali, lettore nuovo · v199 anti rate-limit (SW), 👑 top, locandina bloccata ovunque, carosello una foto alla volta, anteprima a pressione lunga · v200 scheda fluida, «A colpo d'occhio» a riquadri, tratti DNA nuovi cercati nel catalogo · v201 nome inglese da Steam per tutte le ricerche, carosello infinito, apertura stile iOS · v202 service worker a versioni, avvio con nuovi tentativi · v203 cervello dei gusti + barra icone + valutazioni · v204 scheda in 3 parti, un solo pulsante locandina · v205 locandine da Steam (id dal server), valutazioni a tasti + Fine, riordino ↕️, riquadri storia/dopamina, DNA senza salti · v206 intro/tocchi robusti, questo file · v207 «Cosa ti ha preso» rifatto con gioco veloce a carte e 💖 motivi principali, linguette più in alto con evidenziatore · v208 STABILITÀ: via il blocco di 40 s all'avvio e di 12 s con «Più adatti a te», reti di sicurezza (cartoncino, tocchi in attesa), schermo intero anche nell'app installata · v209 struttura per 20.000+ giochi (indice a tabella + testi a pezzi + tratti precalcolati), 😍 nella lista, «Ni» nel DNA, `tools/mappa.js`.

## 7. Cose ancora da fare (backlog, in ordine di valore)
0. ✅ (v244–v248, fatto) **Storie dei giochi (richiesta dell'utente, v243)**: ogni trama deve far venire voglia di iniziare il gioco, SENZA spoiler (niente colpi di scena, identità/parentele nascoste, morti, tradimenti, vero cattivo, finale: es. in FF X non dire che Sin è il padre di Tidus). Oggi 256 trame su 765 hanno meno di 60 parole (48 meno di 40): vanno portate a 80–120 parole. Controllare anche le altre per spoiler. Dati SOLO con `tools/data-io.js` (load/save), a blocchi, con l'anno al posto di frasi legate al tempo.
1. **Verificare sul telefono vero** (l'utente prova): fluidità a 120 Hz dell'apertura scheda, intro/News, locandina di Dragon Quest XI S, riordino ↕️, valutazioni.
2. «Cosa ti ha preso»: fatto in v207 (gioco veloce). Idea successiva: proporre il gioco veloce in automatico quando segni un gioco come Giocato o 😍.
3. **Unire gli osservatori della scheda** (13 moduli agganciano `openModal`, altri 10 `MutationObserver`): un'unica pipeline di montaggio; lavoro delicato, prima scrivere test.
4. Pulizia doppioni residui: radar vecchio vs Sintonia, `dna-box`, chiavi di stato; `docs/ARCHITETTURA.md` da compattare (il file è lungo).
5. Scalabilità a 10.000 giochi: il giro notturno ha tetti per notte (`--cap`); `facts-chk.json` tiene le date.
6. Idee dell'utente non ancora fatte: più tratti per categoria/sottocategoria (oggi ~43 + quelli creati dall'AI), ordine «Mia tier» più intelligente, temi grafici ulteriori.
7. Controllare il risultato dei giri notturni (OpenCritic e voti con nome inglese, `voti.js`): non è stato ancora verificato che il nome inglese abbia aumentato i voti trovati.

## 8. Cosa serve in un nuovo account
- Accesso al repo `kur0chanx/TierListGame` (GitHub app di Claude collegata) e ai tool MCP GitHub.
- Nessuna chiave nel repo: l'utente tiene le sue nel telefono. In sessione cloud i test usano chiavi finte (`localStorage.setItem('jrpg_gemini_key','FAKE')`) e Gemini simulato.
- Prima azione consigliata: `git pull`, leggere `CLAUDE.md`, questo file, poi `node tools/check-data.js` (deve dire «Nessun avviso») e lanciare `tools/test/t205.js`.
