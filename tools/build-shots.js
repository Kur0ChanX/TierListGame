#!/usr/bin/env node
// Costruisce shots.js: gli screenshot ufficiali dello store Steam di ogni gioco del database che ha una pagina Steam (id preso da facts.js).
// Serve alla scheda «cinematografica»: prima la copertina ferma, poi qualche schermata di gioco. Gira dai SERVER (il browser non può leggere l'API di Steam).
// Uso:  node tools/build-shots.js [--limit N]   — 1 richiesta al secondo, circa 5 minuti. Non modifica nessun dato dei giochi.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const UA = {'User-Agent': 'TierListGame/1.0 (uso personale; +https://github.com/Kur0ChanX/TierListGame)', 'Accept': 'application/json'};
const arg = n=>{ const i = process.argv.indexOf('--' + n); return i > -1 ? +process.argv[i + 1] : null; };
const LIMIT = arg('limit') || 99999;
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const PRE = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
async function getJson(url, tries = 3){
  for(let a = 0; a < tries; a++){
    try{
      const r = await fetch(url, {headers: UA});
      if(r.status === 429 || r.status >= 500){ await sleep(5000 * (a + 1)); continue; }
      if(!r.ok) return null;
      return await r.json();
    }catch(e){ await sleep(2000 * (a + 1)); }
  }
  return null;
}
const readJs = (file, prefix)=>{ try{ return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(prefix, '').replace(/;\s*$/, '')); }catch(e){ return null; } };
const facts = readJs('facts.js', /^const GAME_FACTS = /);
const prev = readJs('shots.js', /^const GAME_SHOTS = /) || {games: {}};
if(!facts || !facts.games){ console.error('facts.js non leggibile'); process.exit(1); }
(async()=>{
  const out = {};
  const ids = Object.keys(facts.games).filter(id=> facts.games[id] && facts.games[id].s && facts.games[id].s.id).slice(0, LIMIT);
  let n = 0, ok = 0;
  for(const id of ids){
    const app = facts.games[id].s.id;
    const d = await getJson('https://store.steampowered.com/api/appdetails?appids=' + app + '&filters=screenshots');
    const x = d && d[app] && d[app].success ? d[app].data : null;
    const list = x && Array.isArray(x.screenshots) ? x.screenshots : [];
    // fino a 8 schermate, prese a intervalli lungo l'elenco così non sono tutte della stessa scena; adesso tengo il percorso dopo /apps/ (senza il parametro ?t=)
    const pick = [];
    const step = Math.max(1, Math.floor(list.length / 8));
    for(let i = 0; i < list.length && pick.length < 8; i += step){
      const u = String(list[i].path_thumbnail || '').replace(PRE, '').replace(/\?.*$/, '');
      if(u && u.indexOf('http') !== 0) pick.push(u);
    }
    if(pick.length){ out[id] = pick; ok++; } else if(prev.games[id]) out[id] = prev.games[id];     // se oggi non risponde tengo quelle di prima
    if(++n % 25 === 0){ console.log(n + '/' + ids.length, '· con schermate:', ok); }
    await sleep(1000);
  }
  fs.writeFileSync(path.join(ROOT, 'shots.js'), 'const GAME_SHOTS = ' + JSON.stringify({built: new Date().toISOString().slice(0, 10), base: PRE, games: out}) + ';\n');
  console.log('Fatto:', Object.keys(out).length, 'giochi con schermate su', ids.length);
})();
