#!/usr/bin/env node
// Costruisce facts.js: dati "di fatto" sui giochi del database, presi dai SERVER (Steam, CheapShark) dove il browser non ha blocchi CORS.
// Gira da solo ogni settimana su GitHub (workflow "Dati settimanali") ma si può lanciare anche a mano:  node tools/build-facts.js [--limit N] [--offset N]
// Per ogni gioco di base: lingue italiane ufficiali su Steam (testi/doppiaggio), prezzo in euro con sconto, anno di uscita, Metascore riportato da Steam e da CheapShark, % di recensioni positive.
// Non modifica mai i dati dei giochi: l'app usa facts.js solo per PROPORRE correzioni (che approvi tu) e per mostrare il prezzo.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const UA = {'User-Agent': 'TierListGame/1.0 (uso personale; +https://github.com/Kur0ChanX/TierListGame)', 'Accept': 'application/json'};
const arg = n=>{ const i = process.argv.indexOf('--' + n); return i > -1 ? +process.argv[i + 1] : null; };
const LIMIT = arg('limit') || 99999, OFFSET = arg('offset') || 0;
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[™®©]/g, '').replace(/[^a-z0-9]/g, '');
const baseName = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remastered|remake|complete|hd|edition|reborn|reloaded|the final cut|director'?s cut|enhanced).*$/i, '').trim();

async function getJson(url, tries = 3){
  for(let a = 0; a < tries; a++){
    try{
      const r = await fetch(url, {headers: UA});
      if(r.status === 429 || r.status >= 500){ await sleep(4000 * (a + 1)); continue; }
      if(!r.ok) return null;
      return await r.json();
    }catch(e){ await sleep(1500 * (a + 1)); }
  }
  return null;
}
const raw = fs.readFileSync(path.join(ROOT, 'giochi.js'), 'utf8').replace(/^const GIOCHI_DATA = /, '').replace(/;\s*$/, '');
const D = JSON.parse(raw), GAMES = D.games;
let prev = {games: {}};
try{ const t = fs.readFileSync(path.join(ROOT, 'facts.js'), 'utf8'); prev = JSON.parse(t.replace(/^const GAME_FACTS = /, '').replace(/;\s*$/, '')); }catch(e){}

async function steamFacts(g){
  const base = baseName(g.name), tgt = norm(base);
  const s = await getJson('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(base) + '&cc=IT&l=english');
  const items = ((s && s.items) || []).filter(x=> x.type === 'app');
  const hit = items.find(x=> norm(String(x.name).replace(/\s*\([^)]*\)/g, '')) === tgt) || items.find(x=> norm(x.name) === norm(g.name));
  if(!hit) return null;
  await sleep(900);
  const d = await getJson('https://store.steampowered.com/api/appdetails?appids=' + hit.id + '&cc=it&l=english&filters=basic,supported_languages,price_overview,release_date,metacritic,genres');
  const x = d && d[hit.id] && d[hit.id].success ? d[hit.id].data : null;
  const out = {id: hit.id};
  if(x){
    const lang = String(x.supported_languages || '');
    const it = /Italian(<strong>\*<\/strong>)?/i.exec(lang);
    if(lang) out.it = it ? (it[1] ? 'D' : 'S') : 'N';                     // D = testi+doppiaggio, S = solo testi, N = nessun italiano ufficiale su Steam
    if(x.price_overview) out.p = {f: x.price_overview.final / 100, i: x.price_overview.initial / 100, d: x.price_overview.discount_percent};
    else if(x.is_free) out.p = {f: 0, i: 0, d: 0};
    const y = x.release_date && String(x.release_date.date || '').match(/(19[7-9]\d|20[0-3]\d)/);
    if(y) out.y = +y[1];
    if(x.metacritic && x.metacritic.score) out.mc = x.metacritic.score;
    if(x.genres) out.g = x.genres.map(z=> z.description).slice(0, 5);
  } else if(hit.price) out.p = {f: hit.price.final / 100, i: hit.price.initial / 100, d: hit.price.discount_percent || 0};
  if(hit.metascore && !out.mc) out.mc = +hit.metascore || undefined;
  return out;
}
async function cheapFacts(g){
  const base = baseName(g.name), tgt = norm(base);
  const j = await getJson('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=10&title=' + encodeURIComponent(base));
  const hit = (Array.isArray(j) ? j : []).find(x=> norm(String(x.title).replace(/\s*\([^)]*\)/g, '')) === tgt);
  if(!hit) return null;
  const o = {};
  if(+hit.metacriticScore) o.mc = +hit.metacriticScore;
  if(+hit.steamRatingPercent) o.sp = +hit.steamRatingPercent;
  if(+hit.steamRatingCount) o.sc = +hit.steamRatingCount;
  if(hit.releaseDate) o.y = new Date(hit.releaseDate * 1000).getFullYear();
  return Object.keys(o).length ? o : null;
}
(async()=>{
  const out = {built: new Date().toISOString().slice(0, 10), games: Object.assign({}, prev.games || {})};
  const list = GAMES.slice(OFFSET, OFFSET + LIMIT);
  let n = 0, withSteam = 0, withIt = 0;
  for(const g of list){
    n++;
    try{
      const f = {};
      const st = await steamFacts(g); if(st){ f.s = st; withSteam++; if(st.it === 'D' || st.it === 'S') withIt++; }
      await sleep(700);
      const ch = await cheapFacts(g); if(ch) f.c = ch;
      if(f.s || f.c){ f.t = out.built; out.games[g.id] = f; }
      else if(out.games[g.id] && !out.games[g.id].t) delete out.games[g.id];
    }catch(e){ console.error('errore', g.name, e.message); }
    if(n % 25 === 0){ console.log(n + '/' + list.length, '· con Steam:', withSteam, '· con italiano:', withIt); fs.writeFileSync(path.join(ROOT, 'facts.js'), 'const GAME_FACTS = ' + JSON.stringify(out) + ';\n'); }
    await sleep(500);
  }
  fs.writeFileSync(path.join(ROOT, 'facts.js'), 'const GAME_FACTS = ' + JSON.stringify(out) + ';\n');
  console.log('fatto:', Object.keys(out.games).length, 'giochi con dati · con Steam:', withSteam, '· con italiano ufficiale:', withIt);
})();
