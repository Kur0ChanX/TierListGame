// Prepara i dati nel FORMATO VECCHIO (un solo file con trame, etichette complete, enrich e dopa dentro GIOCHI_DATA)
// per la copia congelata backup-aurora, che non va modificata. Lo usa il workflow di pubblicazione.
// Uso: node tools/legacy-bundle.js percorso/uscita.js
const fs = require('fs');
const D = require('./data-io').load();
const out = process.argv[2]; if(!out) throw new Error('manca il file di uscita');
fs.writeFileSync(out, 'const GIOCHI_DATA = ' + JSON.stringify(D) + ';\n');
console.log('formato vecchio scritto in', out, '·', D.games.length, 'giochi');
