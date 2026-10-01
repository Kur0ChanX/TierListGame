#!/usr/bin/env node
// Costruisce voti.js: Metascore UFFICIALE da metacritic.com (autosuggest del sito), con titolo, anno, generi e piattaforme ufficiali.
// Gira dai SERVER di GitHub (nessun blocco CORS, nessuna chiave, nessun limite giornaliero): l'app lo legge come fonte «Metacritic ufficiale».
// Cerca anche i giochi AGGIUNTI (catalogo pubblico). Salta i giochi controllati da meno di 30 giorni (--all per rifare tutto).
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-voti.js [--limit N] [--offset N] [--all]
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require('./data-io').load();
const arg = n=>{ const i = process.argv.indexOf('--' + n); return i > -1 ? +process.argv[i + 1] : null; };
const LIMIT = arg('limit') || 99999, CAP = arg('cap') || 3000, OFFSET = arg('offset') || 0, ALL = process.argv.includes('--all');
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const FILE = path.join(ROOT, 'voti.js');
let prev = {games: {}};
try{ prev = JSON.parse(fs.readFileSync(FILE, 'utf8').replace(/^const VOTI = /, '').replace(/;\s*$/, '')); }catch(e){}
const norm = n=> String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\bthe\b/g, ' ').replace(/\s+/g, ' ').trim();
const clean = n=> String(n).replace(/\s*\([^)]*\)/g, '').replace(/^Pokemon /i, 'Pokémon ').trim();
async function q(name){
  const u = 'https://backend.metacritic.com/finder/metacritic/autosuggest/' + encodeURIComponent(name) + '?apiKey=1MOZgmNFxvmljaQR1X9KAuUFFdE9ZK&mcoTypeId=13';
  for(let a = 0; a < 4; a++){
    try{ const r = await fetch(u, {headers: {'User-Agent': UA}}); const t = await r.text(); if(t.startsWith('{')) return ((JSON.parse(t).data || {}).items || []).filter(x=> x.type === 'game-title'); }catch(e){}
    await sleep(1500 * (a + 1));
  }
  return null;
}
const {customGames} = require('./catalog');
(async()=>{
  const games = Object.assign({}, prev.games || {});
  const custom = await customGames(); console.log('giochi aggiunti dal catalogo:', custom.length);
  const seen = new Set(), list = D.games.concat(custom).filter(g=> g && g.name && !seen.has(String(g.id)) && seen.add(String(g.id))).slice(OFFSET, OFFSET + LIMIT);
  const today = new Date().toISOString().slice(0, 10), fresh = d=> d && (Date.parse(today) - Date.parse(d)) < 30 * 864e5;
  const save = ()=> fs.writeFileSync(FILE, 'const VOTI = ' + JSON.stringify({built: today, games}) + ';\n');
  // prima i giochi mai controllati (i nuovi), poi i controlli più vecchi; al massimo CAP a notte (con 10.000 giochi si ripartisce su più notti)
  list.sort((a, b)=> ((games[a.id] || {}).d || '') < ((games[b.id] || {}).d || '') ? -1 : 1);
  let n = 0, hit = 0, fail = 0;
  for(const g of list){
    if(!ALL && games[g.id] && fresh(games[g.id].d)) continue;
    if(n >= CAP){ console.log('limite di', CAP, 'giochi per notte: il resto alla prossima'); break; }
    const nm = clean(g.name), t = norm(nm);
    let items = await q(nm);
    if(items === null){ if(++fail >= 8){ console.log('Metacritic non risponde: mi fermo'); break; } continue; }
    let best = items.find(x=> norm(x.title) === t);
    if(!best){ const short = nm.split(/:| - /)[0]; if(short && short !== nm){ const it2 = await q(short); best = (it2 || []).find(x=> norm(x.title) === t); } }
    const s = best && best.criticScoreSummary && best.criticScoreSummary.score;
    games[g.id] = best ? {t: best.title, u: best.slug, s: s || 0, y: best.premiereYear || 0, g: (best.genres || []).map(x=> x.name), p: (best.platforms || []).map(x=> x.name).slice(0, 8), d: today} : {d: today};
    if(best && s) hit++;
    if(++n % 40 === 0){ save(); console.log('controllati', n, '- con voto', hit); }
    await sleep(250);
  }
  save(); console.log('FATTO: controllati', n, '- con voto', hit, '- totale in archivio', Object.keys(games).length);
})();
