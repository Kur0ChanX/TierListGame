# Server online del Triple Triad

Un solo Cloudflare Worker con un Durable Object (database SQLite) tiene account, carte, amici, sfide e partite.
Le mosse le decide il server usando lo stesso motore delle regole dell'app (`triad-core.js`): nessuno può barare.

## Pubblicarlo (una volta sola, si fa anche da telefono)
1. Crea un account gratuito su https://dash.cloudflare.com e apri una volta «Workers e Pages» (così nasce il tuo indirizzo `*.workers.dev`).
2. Da https://dash.cloudflare.com/profile/api-tokens crea un token con il modello **Edit Cloudflare Workers**. Copia anche l'**Account ID** (nella pagina Workers e Pages, a destra).
3. Su GitHub, nel repository: Impostazioni → Segreti e variabili → Actions → nuovi segreti `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.
4. Actions → «Server Triple Triad (Cloudflare)» → Run workflow. Al termine scrive da solo l'indirizzo in `triad-config.js` e ripubblica il sito.

## Prove in locale
```
cd tools/triad-server && npx wrangler dev --port 8799 --local --var TURN_MS:2500 --var REG_MAX:100 --var SUPPLY_SCALE:0.3 --var START_COINS:5000
node tools/triad-server/test.js            # in un altro terminale (27 prove: account, amici, stanze, partite, furto delle carte, timer, Custodi, sicurezza)
node tools/test-triad-core.js              # 38 prove delle regole
```

## Numeri da sapere (piano gratuito)
- 100.000 richieste al giorno: per un gruppo di amici basta e avanza. I WebSocket in attesa non consumano tempo di calcolo (hibernation).
- Copie di ogni carta nel mondo: `SUPPLY` in `worker.js` (livello 10 = 3 copie, livello 9 = 4, …, livelli 1-4 illimitate). Dopo l'ultima copia le carte forti si possono solo rubare.
- Tempo per mossa: variabile `TURN_MS` (60 secondi). Dopo 3 turni saltati si perde a tavolino.
