# Tier List RPG & JRPG di Mario (Raccoon Tier)

App statica (si apre anche con doppio clic, file://), senza server né build. Utente italiano, non programmatore: rispondi in italiano, breve, senza gergo. Sito: https://kur0chanx.github.io/TierListGame/. Il Triple Triad è un progetto a parte: repository `kur0chanx/raccoon-triad` (qui resta solo il link nel menu ✨ e il reindirizzamento degli inviti `#tt=`).

**Prima di tutto (nuova sessione o nuovo account): leggi `docs/PASSAGGIO-CONSEGNE.md` (utente, flusso di lavoro, errori già fatti, cose da fare). Dettagli di ogni file, chiavi e funzioni: `docs/ARCHITETTURA.md` (non leggerlo tutto: Grep sulla voce che serve). Prove automatiche: `tools/test/`.**

## Risparmio di token (priorità)
- Una sessione per lavoro. Risposte corte, niente riassunti lunghi. Niente screenshot/prove che non servono.
- MAI leggere per intero `giochi.js`, `dati/testi-*.js`, `ost.js`, `discoveries.js`, `facts.js`, `radar.js`, `quality.js`, `backup-aurora/` (il Read è bloccato in `.claude/settings.json`). Per i dati: script Node con `tools/data-io.js` (`load()`/`save(D)`) o `jq` (vedi ARCHITETTURA, voce giochi.js). Prima di toccare i dati indica quali id/chiavi; non stampare oggetti interi.
- Codice: `node tools/mappa.js FILE [parola]` (funzioni con numero di riga) o Grep, poi Read solo di quell'intervallo (mai Read senza `limit` su file >300 righe).
- Dati (formato v3, dalla v209): `giochi.js` = INDICE «a tabella» (enc t1) e `dati/testi-K.js` = testi lunghi a pezzi da 250 giochi. Non fare mai il parse a mano di giochi.js: SOLO `tools/data-io.js` (`load()` dà il vecchio formato completo, `save(D)` riscrive indice + pezzi + tratti `mx`). Nell'app i testi di un gioco arrivano con `rtTexts.ensure(g)`; finché non ci sono `g.enrich._lite` è vero. Se cambi le parole-chiave dei tratti (`tratti.js`) rigenera con load()+save().
- Non riscrivere, semplificare o rimuovere funzioni esistenti se non richiesto.
- Modifiche di routine (testi, colori, dati): modello leggero. Logica nuova o bug: Sonnet.

## Regole fisse
- Numero dei giochi: SEMPRE quello reale (`GAMES.length`, comprende i giochi aggiunti dall'utente: 1369 al 1/10/2026), mai i 765 di base.
- Ad OGNI versione: `DATA_BUILD_VERSION` e `DATA_BUILD_DATE` in `app-ai.js`, `<meta name="build" content="vNN">` nell'HTML (devono coincidere), voce nel CHANGELOG di `app-utente.js` con data E ORARIO (`date:'AAAA-MM-GG', time:'HH:MM'`, ora italiana: `TZ=Europe/Rome date`). Poi `node tools/check-data.js` (deve dire «Nessun avviso») e `node tools/check-conflitti.js` («Nessun conflitto»).
- Ogni nuovo file JS: nell'HTML (ordine!), in `sw.js` (SHELL) e in `.github/workflows/pages.yml`. I nuovi moduli vanno in fondo, prima di `motion.js` (che resta l'ultimo).
- L'HTML inizia con `<!DOCTYPE html>`. Dati locali con `<script src>`, mai fetch (file:// li blocca).
- Chiavi/token dell'utente (Gemini `jrpg_gemini_key`, RAWG, OpenCritic, GitHub `jrpg_sync_token`) solo in localStorage: mai nel codice, nei commit o nei file. Richieste con chiave: SEMPRE `relays:false`.
- Chiamate a siti esterni: `SearchHub.json` (mai fetch diretto). Nuova fonte: inseriscila in `SearchHub.PRIORITY`.
- Aggiornamenti in background: MAI `render()`; usa `refreshGameRow(g)` / `renderWhenIdle({...})` / `applyPatch(g, p, true)` (quiet).
- `backup-aurora/`: NON modificarla.
- Testi dei giochi: niente frasi legate al tempo («uscito da poco»): scrivi l'anno.
- Temi grafici (`packs.js`, `packs.css`, `packs/*.css`, `fonts/`): un tema nuovo = voce in `PACKS` + `packs/ID.css` + anteprime (`node tools/build-pack-thumbs.js ID`); dettagli in ARCHITETTURA (v174). Sulle pagine con un tema usa le variabili `--pk-*`, non colori fissi.
- Tag: il primo è il genere principale; un tag «extra» (Puzzle, Platform, Picchiaduro, RTS…) sposta il gioco nella lista di quel genere.
- Voti: «verificati» (V) = Metacritic/OpenCritic/RAWG, con la fonte in `g.vs`; «stima» (S) NON verificati. Priorità fissa Metacritic → OpenCritic → RAWG (una fonte più debole non sostituisce mai una più forte, tranne se l'utente sceglie la fonte in «Fonti e lucchetti»); Metacritic si applica da solo fino a 15 punti di scarto, oltre chiede conferma. Se un sito blocca o la quota è finita si riprova il giorno dopo (`jrpg_vote_state`), se il gioco non c'è non si riprova. I giochi AGGIUNTI senza voto verificato hanno il rank ND (sotto tutti); la classifica di base non cambia.
- Dopo `git merge origin/main` con conflitti: `git checkout --ours -- "nome file"` un file alla volta (HTML tra virgolette), poi `node tools/check-data.js`.

## Pubblicazione
Commit → push sul branch di sessione → PR → squash merge → controllo del `<meta name="build">` online → `git checkout -B <branch> origin/main`.

## Salvataggi (regole permanenti dell'utente)
1. **Salvataggio automatico**: alla fine di ogni lavoro impegnativo o modifica importante al codice, esegui SEMPRE da solo: `git add . && git commit -m "salvataggio automatico" && git push origin HEAD` (il commit chiude con le righe di attribuzione richieste dalla sessione).
2. **Comando «Salva» / «Salva tutto»**: se l'utente scrive solo questo, esegui subito la stessa sequenza (add, commit, push).
