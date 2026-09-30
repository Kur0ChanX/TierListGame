# Tier List RPG & JRPG di Mario (Raccoon Tier)

App statica (si apre anche con doppio clic, file://), senza server né build. Utente italiano, non programmatore: rispondi in italiano, breve, senza gergo. Sito: https://kur0chanx.github.io/TierListGame/. Il Triple Triad è un progetto a parte: repository `kur0chanx/raccoon-triad` (qui resta solo il link nel menu ✨ e il reindirizzamento degli inviti `#tt=`).

**Dettagli di ogni file, chiavi e funzioni: `docs/ARCHITETTURA.md` (non leggerlo tutto: Grep sulla voce che serve).**

## Risparmio di token (priorità)
- Una sessione per lavoro. Risposte corte, niente riassunti lunghi. Niente screenshot/prove che non servono.
- MAI leggere per intero `giochi.js`, `giochi-dettagli-*.js`, `ost.js`, `discoveries.js`, `facts.js`, `radar.js`, `quality.js`, `backup-aurora/` (il Read è bloccato in `.claude/settings.json`). Per i dati: script Node con `tools/data-io.js` (`load()`/`save(D)`) o `jq` (vedi ARCHITETTURA, voce giochi.js). Prima di toccare i dati indica quali id/chiavi; non stampare oggetti interi.
- Codice: Grep la funzione in `app*.js`/`verify.js`, poi Read solo di quell'intervallo (mai Read senza `limit` su file >300 righe).
- Non riscrivere, semplificare o rimuovere funzioni esistenti se non richiesto.
- Modifiche di routine (testi, colori, dati): modello leggero. Logica nuova o bug: Sonnet.

## Regole fisse
- Ad OGNI versione: `DATA_BUILD_VERSION` e `DATA_BUILD_DATE` in `app-ai.js`, `<meta name="build" content="vNN">` nell'HTML (devono coincidere), voce nel CHANGELOG di `app-utente.js` con data E ORARIO (`date:'AAAA-MM-GG', time:'HH:MM'`, ora italiana: `TZ=Europe/Rome date`). Poi `node tools/check-data.js` (deve dire «Nessun avviso»).
- Ogni nuovo file JS: nell'HTML (ordine!), in `sw.js` (SHELL) e in `.github/workflows/pages.yml`. `app-ai.js` deve restare l'ultimo (avvio).
- L'HTML inizia con `<!DOCTYPE html>`. Dati locali con `<script src>`, mai fetch (file:// li blocca).
- Chiavi/token dell'utente (Gemini `jrpg_gemini_key`, RAWG, OpenCritic, GitHub `jrpg_sync_token`) solo in localStorage: mai nel codice, nei commit o nei file. Richieste con chiave: SEMPRE `relays:false`.
- Chiamate a siti esterni: `SearchHub.json` (mai fetch diretto). Nuova fonte: inseriscila in `SearchHub.PRIORITY`.
- Aggiornamenti in background: MAI `render()`; usa `refreshGameRow(g)` / `renderWhenIdle({...})` / `applyPatch(g, p, true)` (quiet).
- `backup-aurora/`: NON modificarla.
- Testi dei giochi: niente frasi legate al tempo («uscito da poco»): scrivi l'anno.
- Tag: il primo è il genere principale; un tag «extra» (Puzzle, Platform, Picchiaduro, RTS…) sposta il gioco nella lista di quel genere.
- Voti: «verificati» (V) = Metacritic/OpenCritic; «stima» (S) NON verificati. Update+ applica da solo il Metascore a una stima; un V si corregge solo con differenza >6 e conferma.
- Dopo `git merge origin/main` con conflitti: `git checkout --ours -- "nome file"` un file alla volta (HTML tra virgolette), poi `node tools/check-data.js`.

## Pubblicazione
Commit → push sul branch di sessione → PR → squash merge → controllo del `<meta name="build">` online → `git checkout -B <branch> origin/main`.
