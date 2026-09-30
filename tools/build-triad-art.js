#!/usr/bin/env node
// Trova per ogni carta del Triple Triad (triad-cards.js) le immagini vere del gioco e le verifica: scrive triad-art.js.
// Fonti, dalla più affidabile: Steam (library 600x900 = copertina verticale), Wikipedia inglese (immagine principale dell'articolo = box art).
// Ogni URL viene controllato (risponde e sono immagini). Le carte senza nessuna immagine usano comunque l'«Emblema» disegnato dall'app.
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-triad-art.js [--only id1,id2] [--redo]   (riprende da dove era: tiene ciò che è già nel file)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CARDS = require(path.join(ROOT, 'triad-cards.js'));
const OUT = path.join(ROOT, 'triad-art.js');
const args = process.argv.slice(2);
const only = (args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean);
const redo = args.includes('--redo');
const UA = {'user-agent': 'RaccoonTier/1.0 (https://kur0chanx.github.io/TierListGame/; carte Triple Triad)'};
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const norm = s=> String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/\bthe\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
// nomi italiani/abbreviati -> nome inglese usato da Wikipedia e Steam
const ALIAS = {
  'pokemon rosso e blu': 'Pokémon Red and Blue', 'campo minato': 'Minesweeper', 'solitario': 'Klondike solitaire Windows', 'pac man': 'Pac-Man',
  'the legend of zelda ocarina of time': 'The Legend of Zelda: Ocarina of Time', 'gta v': 'Grand Theft Auto V'
};
async function j(u, tries){
  for(let i = 0; i < (tries || 3); i++){
    try{ const r = await fetch(u, {headers: UA}); if(r.status === 429){ await sleep(2500 * (i + 1)); continue; } if(!r.ok) return null; return await r.json(); }catch(e){ await sleep(800); }
  }
  return null;
}
async function imgOk(u){
  for(let i = 0; i < 2; i++){
    try{ const r = await fetch(u, {headers: {...UA, range: 'bytes=0-1023'}}); if(r.status === 429){ await sleep(2000); continue; } const ct = r.headers.get('content-type') || ''; return (r.status === 200 || r.status === 206) && /^image\//.test(ct); }catch(e){ await sleep(500); }
  }
  return false;
}
async function steamArt(name){
  const q = ALIAS[norm(name)] || name;
  const d = await j('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(q) + '&cc=us&l=en');
  const items = (d && d.items || []).filter(x=> x.type === 'app');
  const want = norm(q);
  const hit = items.find(x=> norm(x.name) === want) || items.find(x=> norm(x.name).replace(/ (remastered|definitive edition|game of the year edition|enhanced edition|complete edition|goty)$/, '') === want);
  if(!hit) return [];
  const base = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + hit.id + '/';
  const out = [];
  for(const f of ['library_600x900.jpg', 'header.jpg']){ if(await imgOk(base + f)) out.push(base + f); }
  return out;
}
async function wikiArt(name, year){
  const q = ALIAS[norm(name)] || name;
  const s = await j('https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=' + encodeURIComponent(q + ' ' + (year || '') + ' video game') + '&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=600&redirects=1');
  const pages = s && s.query && Object.values(s.query.pages) || [];
  pages.sort((a, b)=> (a.index || 0) - (b.index || 0));
  const want = norm(q);
  const ok = t=> { const n = norm(t.replace(/\((?:[^)]*video game|[^)]*game)\)/i, '')); return n === want || n.startsWith(want + ' ') || want.startsWith(n + ' '); };
  const cand = pages.filter(p=> p.thumbnail && ok(p.title));
  // preferisci l'articolo dell'anno giusto: «Doom (1993 video game)»
  cand.sort((a, b)=> (new RegExp(String(year)).test(b.title) ? 1 : 0) - (new RegExp(String(year)).test(a.title) ? 1 : 0));
  const out = [];
  for(const p of cand.slice(0, 2)){ if(await imgOk(p.thumbnail.source)) { out.push(p.thumbnail.source); break; } }
  return out;
}
(async()=>{
  let art = {};
  try{ const src = fs.readFileSync(OUT, 'utf8'); const m = src.match(/TRIAD_ART = (\{[\s\S]*?\});\n/); if(m) art = JSON.parse(m[1]); }catch(e){}
  const todo = CARDS.filter(c=> (only.length ? only.includes(c[0]) : (redo || !art[c[0]] || !art[c[0]].length)));
  console.log('da cercare:', todo.length, 'di', CARDS.length);
  let n = 0;
  const work = async c=>{
    const [id, name, year] = c;
    const found = [];
    try{ found.push(...await steamArt(name)); }catch(e){}
    try{ const w = await wikiArt(name, year); found.push(...w); }catch(e){}
    art[id] = found;
    n++; if(n % 20 === 0) console.log(n + '/' + todo.length);
  };
  const pool = 4; let i = 0;
  await Promise.all(Array.from({length: pool}, async ()=>{ while(i < todo.length){ const c = todo[i++]; await work(c); await sleep(150); } }));
  const ordered = {}; CARDS.forEach(c=> ordered[c[0]] = art[c[0]] || []);
  const body = `(function(root){\n  var TRIAD_ART = ${JSON.stringify(ordered)};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_ART; else root.TRIAD_ART = TRIAD_ART;\n})(typeof self !== 'undefined' ? self : this);\n`;
  fs.writeFileSync(OUT, '// Triple Triad: immagini verificate per carta (generato da tools/build-triad-art.js, non modificare a mano). id -> [url, url, ...] dalla migliore.\n' + body);
  const none = CARDS.filter(c=> !ordered[c[0]].length).map(c=> c[1]);
  const steam = CARDS.filter(c=> /steamstatic/.test((ordered[c[0]] || [])[0] || '')).length;
  console.log('con immagine:', CARDS.length - none.length, '/', CARDS.length, '· prima immagine da Steam:', steam);
  if(none.length) console.log('senza immagine (useranno l\'Emblema):', none.join(' | '));
})();
