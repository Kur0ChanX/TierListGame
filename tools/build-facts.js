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
const LIGHT = process.argv.includes('--light');
const REVIEWS = process.argv.includes('--reviews');
const NEW_ONLY = process.argv.includes('--new');    // solo i giochi mai controllati (giro notturno: un gioco aggiunto oggi ha i dati domani)
const CAP = arg('cap') || (NEW_ONLY ? 400 : 2500); // massimo di giochi per giro: con 10.000 giochi il lavoro si divide su più giri   // solo il «termometro» delle recensioni Steam (ultimi 30 giorni contro sempre)       // solo prezzi (per l'aggiornamento notturno): 1 richiesta ogni 50 giochi
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
// termometro della community: % positive di sempre e delle recensioni degli ultimi 30 giorni (campione fino a 100)
async function reviewFacts(appid){
  const j = await getJson('https://store.steampowered.com/appreviews/' + appid + '?json=1&filter=recent&num_per_page=100&language=all&purchase_type=all&day_range=30');
  if(!j || !j.success || !j.query_summary) return null;
  const q = j.query_summary, now = Date.now() / 1000;
  const rec = (j.reviews || []).filter(r=> now - r.timestamp_created < 30 * 86400);
  const o = {};
  if(q.total_reviews) { o.ap = Math.round(100 * q.total_positive / q.total_reviews); o.an = q.total_reviews; }
  if(rec.length >= 5){ o.rp = Math.round(100 * rec.filter(r=> r.voted_up).length / rec.length); o.rn = rec.length; }
  return Object.keys(o).length ? o : null;
}
async function reviewsRun(){
  const games = Object.assign({}, prev.games || {}); let n = 0;
  for(const k of Object.keys(games)){
    const s = games[k].s; if(!s || !s.id) continue;
    try{ const r = await reviewFacts(s.id); if(r){ Object.assign(s, r); n++; } }catch(e){}
    await sleep(700);
  }
  fs.writeFileSync(path.join(ROOT, 'facts.js'), 'const GAME_FACTS = ' + JSON.stringify({built: prev.built || new Date().toISOString().slice(0, 10), games}) + ';\n');
  console.log('termometro aggiornato per', n, 'giochi');
}
// aggiornamento notturno leggero: riscarica SOLO i prezzi dei giochi che hanno già un id Steam in facts.js
async function lightRun(){
  const games = Object.assign({}, prev.games || {}), today = new Date().toISOString().slice(0, 10);
  const ids = Object.keys(games).filter(k=> games[k].s && games[k].s.id), byApp = {};
  ids.forEach(k=> { byApp[games[k].s.id] = (byApp[games[k].s.id] || []).concat(k); });
  const apps = Object.keys(byApp); let upd = 0;
  for(let i = 0; i < apps.length; i += 50){
    const batch = apps.slice(i, i + 50);
    const j = await getJson('https://store.steampowered.com/api/appdetails?appids=' + batch.join(',') + '&cc=it&filters=price_overview');
    if(j) batch.forEach(a=>{
      const d = j[a], po = d && d.success && d.data && d.data.price_overview; if(!po) return;
      byApp[a].forEach(k=>{ games[k].s.p = {f: po.final / 100, i: po.initial / 100, d: po.discount_percent}; games[k].t = today; upd++; });
    });
    await sleep(1500);
  }
  fs.writeFileSync(path.join(ROOT, 'facts.js'), 'const GAME_FACTS = ' + JSON.stringify({built: today, games, }) + ';\n');
  console.log('prezzi aggiornati:', upd, 'su', ids.length, 'giochi con Steam');
}
(async()=>{
  if(LIGHT){ await lightRun(); return; }
  if(REVIEWS){ await reviewsRun(); return; }
  const today = new Date().toISOString().slice(0, 10);
  // ultimo controllo di ogni gioco (anche quelli senza dati) in un file a parte, che l'app non scarica
  const CHK = path.join(ROOT, 'tools', 'facts-chk.json'); let chk = {}; try{ chk = JSON.parse(fs.readFileSync(CHK, 'utf8')); }catch(e){}
  const out = {built: today, games: Object.assign({}, prev.games || {})};
  const saveAll = ()=>{ fs.writeFileSync(path.join(ROOT, 'facts.js'), 'const GAME_FACTS = ' + JSON.stringify(out) + ';\n'); fs.writeFileSync(CHK, JSON.stringify(chk)); };
  const age = id=>{ const d = chk[id] || (out.games[id] && out.games[id].t); return d ? (Date.parse(today) - Date.parse(d)) / 864e5 : 1e9; };
  const all = (await require('./catalog').allGames(GAMES)).slice(OFFSET, OFFSET + LIMIT);
  // prima i mai controllati, poi i più vecchi; nel giro dei «nuovi» solo i mai controllati; con dati: ogni 7 giorni, senza dati: ogni 30
  const list = all.filter(g=> NEW_ONLY ? age(g.id) === 1e9 : age(g.id) >= (out.games[g.id] ? 7 : 30)).sort((a, b)=> age(b.id) - age(a.id)).slice(0, CAP);
  console.log('da controllare:', list.length, 'su', all.length, NEW_ONLY ? '(solo nuovi)' : '');
  let n = 0, withSteam = 0, withIt = 0, fails = 0;
  for(const g of list){
    n++;
    try{
      const f = {};
      const st = await steamFacts(g); if(st){ f.s = st; withSteam++; if(st.it === 'D' || st.it === 'S') withIt++; }
      if(st && st.id){ await sleep(500); try{ const rv = await reviewFacts(st.id); if(rv) Object.assign(st, rv); }catch(e){} }
      await sleep(700);
      const ch = await cheapFacts(g); if(ch) f.c = ch;
      if(f.s || f.c){ f.t = today; out.games[g.id] = f; }
      chk[g.id] = today;
    }catch(e){ console.error('errore', g.name, e.message); if(++fails > 30){ console.log('troppi errori: mi fermo'); break; } }
    if(n % 25 === 0){ console.log(n + '/' + list.length, '· con Steam:', withSteam, '· con italiano:', withIt); saveAll(); }
    await sleep(500);
  }
  saveAll();
  console.log('fatto:', Object.keys(out.games).length, 'giochi con dati · con Steam:', withSteam, '· con italiano ufficiale:', withIt);
})();
