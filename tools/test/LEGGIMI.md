# Prove automatiche (Playwright) — non fanno parte dell'app

Servono per verificare a mano le parti delicate. Sono script usa e getta, scritti durante le sessioni v199–v206.

Come lanciarle (dalla cartella del progetto):

    (python3 -m http.server 8765 >/dev/null 2>&1 &)          # serve solo a tsw/tnews/tstart
    export NODE_PATH=/opt/node22/lib/node_modules SP=/tmp
    node tools/test/t205.js

Chromium è già installato in /opt/pw-browsers/chromium (NON eseguire `playwright install`).
Rete: i test bloccano tutto tranne file:// e localhost (r.abort), così le risposte dei siti si simulano con `route.fulfill`.

| Script | Cosa prova |
|---|---|
| t199 | sintonia FF8 con 😍, locandina bloccata, carosello (sostituzione foto, blocco, anteprima a pressione lunga) |
| t205 | DNA senza salto di scroll, valutazioni a tasti + Fine, riordino scheda, riquadri storia/dopamina |
| tsw | service worker: n. richieste alla 1ª/2ª/3ª apertura e con GitHub che risponde 429 |
| tcov | locandina RAWG sbagliata → sostituita da quella di Steam |
| tnews | tocco su News prima che il programma sia pronto (viene rifatto) |
| ttabs | scheda in 3 parti + menu locandina |
| tghost | apertura «stile iPhone» (cartoncino) |
| tperf / tprof | tempi di apertura/chiusura scheda con CPU 4× più lenta; profilo delle funzioni |
| tstart | lunghi blocchi all'avvio |
| tdna3 | tratto nuovo creato dall'AI (Gemini simulato) e giochi trovati nel catalogo |
| tyt | foto del carosello infinite da YouTube (simulato) |
| tgl | «A colpo d'occhio» a riquadri |
