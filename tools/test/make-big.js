// Crea un catalogo FINTO di N giochi (copie dei 765 con id e nomi diversi) per provare il programma «in grande».
// Uso: node tools/test/make-big.js 20000 /cartella/uscita   → scrive giochi.js e giochi-dettagli-1..4.js (NON tocca quelli veri)
const fs = require('fs'), path = require('path');
const N = +process.argv[2] || 20000, OUT = process.argv[3]; if(!OUT) throw new Error('manca la cartella di uscita');
const D = require('../data-io').load();
const base = D.games, games = [], labels = {}, enrich = {}, dopa = {}, mk = {games: {}};
for(let i = 0; i < N; i++){
  const src = base[i % base.length], rep = Math.floor(i / base.length), id = i + 1;
  const g = Object.assign({}, src, {id, name: rep ? src.name + ' ' + ['II', 'Origins', 'Reborn', 'Zero', 'Legends', 'Chronicles', 'Remix', 'Next'][rep % 8] + (rep > 7 ? ' ' + rep : '') : src.name});
  games.push(g);
  if(D.labels[src.id]) labels[id] = D.labels[src.id];
  if(D.enrich[src.id]) enrich[id] = D.enrich[src.id];
  if(D.dopa && D.dopa[src.id]) dopa[id] = D.dopa[src.id];
  if(D.market && D.market.games && D.market.games[src.id]) mk.games[id] = D.market.games[src.id];
}
fs.mkdirSync(OUT, {recursive: true});
require('../data-io').save(Object.assign({}, D, {games, labels, enrich, dopa, market: Object.assign({}, D.market, mk)}), OUT);   // stesso formato v3 dei dati veri
console.log('fatto:', N, 'giochi in', OUT);
