#!/usr/bin/env node
// Film e serie TV DAL VIVO (non d'animazione: quelli li fa fetch-films.js) per Raccoon Anime.
// Fonti aperte: dataset non commerciali di IMDb (titolo, anni, durata, generi, voto medio, numero di voti, episodi) e Wikidata
// (titolo italiano, regia o ideazione, rete/servizio, paese, voci di Wikipedia italiana e inglese).
// Uso:  NODE_USE_ENV_PROXY=1 node anime-manga/tools/fetch-live.js [--film 100000] [--serie 40000]
//   --film / --serie = voti IMDb minimi per entrare nella lista. La cache (AM_CACHE, di norma tools/.cache) NON va nel repository.
// Scrive AM_CACHE/live.json; poi add-live.js lo unisce ai dati (giochi.js + dati/testi-*.js).
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), readline = require('readline');
const CACHE = process.env.AM_CACHE || path.join(__dirname, '.cache'), IMDB = path.join(CACHE, 'imdb');
fs.mkdirSync(IMDB, {recursive: true});
const arg = (k, d)=>{ const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
const MIN_FILM = arg('--film', 100000), MIN_SERIE = arg('--serie', 40000);
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
// generi e tipi che NON sono «film o serie da classificare»
const SKIP_GENRES = new Set(['Animation', 'Adult', 'Reality-TV', 'Talk-Show', 'Game-Show', 'News', 'Short']);

async function download(name){
  const file = path.join(IMDB, name);
  if (fs.existsSync(file) && fs.statSync(file).size > 1e6) return file;
  console.log('scarico', name);
  const res = await fetch('https://datasets.imdbws.com/' + name, {headers: {'User-Agent': UA}});
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + name);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}
async function eachRow(file, fn){
  const rl = readline.createInterface({input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity});
  let head = null;
  for await (const line of rl){ const c = line.split('\t'); if (!head){ head = c; continue; } fn(c); }
}
const nn = v=> v === '\\N' ? null : v;

async function sparql(q){
  for (let a = 1; a <= 6; a++){
    try{
      const res = await fetch('https://query.wikidata.org/sparql', {method: 'POST', headers: {'User-Agent': UA, 'Accept': 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded'}, body: 'query=' + encodeURIComponent(q)});
      if (res.status === 429 || res.status >= 500){ console.log('  wikidata', res.status, '- aspetto'); await sleep(15000 * a); continue; }
      if (!res.ok){ console.log('  wikidata HTTP', res.status); return []; }
      return (await res.json()).results.bindings;
    }catch(e){ console.log('  wikidata rete:', e.message); await sleep(5000 * a); }
  }
  return [];
}

(async ()=>{
  const fr = await download('title.ratings.tsv.gz'), fb = await download('title.basics.tsv.gz'), fe = await download('title.episode.tsv.gz');
  // 1) voti
  const rat = new Map();
  await eachRow(fr, c=>{ const v = +c[2]; if (v >= Math.min(MIN_FILM, MIN_SERIE)) rat.set(c[0], {r: +c[1], v}); });
  console.log('titoli con abbastanza voti:', rat.size);
  // 2) titoli
  const pick = new Map();
  await eachRow(fb, c=>{
    const id = c[0], r = rat.get(id); if (!r) return;
    const type = c[1]; if (!['movie', 'tvSeries', 'tvMiniSeries'].includes(type) || c[4] === '1') return;
    const genres = (nn(c[8]) || '').split(',').filter(Boolean);
    if (genres.some(g=> SKIP_GENRES.has(g))) return;
    if (r.v < (type === 'movie' ? MIN_FILM : MIN_SERIE)) return;
    pick.set(id, {imdb: id, type, title: c[2], orig: c[3], y1: +nn(c[5]) || null, y2: +nn(c[6]) || null, run: +nn(c[7]) || null, genres, r: r.r, v: r.v});
  });
  console.log('film:', [...pick.values()].filter(x=> x.type === 'movie').length, '· serie:', [...pick.values()].filter(x=> x.type !== 'movie').length);
  // 3) episodi delle serie
  const eps = new Map();
  await eachRow(fe, c=>{ const p = pick.get(c[1]); if (p && p.type !== 'movie') eps.set(c[1], (eps.get(c[1]) || 0) + 1); });
  eps.forEach((n, id)=>{ pick.get(id).eps = n; });
  // 4) Wikidata a gruppi: titolo italiano e inglese, regia, ideazione, rete/servizio, paese, voci di Wikipedia
  const ids = [...pick.keys()];
  for (let i = 0; i < ids.length; i += 150){
    const chunk = ids.slice(i, i + 150);
    process.stdout.write(`\rWikidata ${Math.min(i + 150, ids.length)}/${ids.length}   `);
    const q = `SELECT ?imdb ?it ?en (GROUP_CONCAT(DISTINCT ?dirL; separator="|") AS ?dirs) (GROUP_CONCAT(DISTINCT ?creL; separator="|") AS ?cres) (GROUP_CONCAT(DISTINCT ?netL; separator="|") AS ?nets) (GROUP_CONCAT(DISTINCT ?cnL; separator="|") AS ?cns) ?itw ?enw WHERE {
      VALUES ?imdb { ${chunk.map(x=> '"' + x + '"').join(' ')} }
      ?item wdt:P345 ?imdb.
      OPTIONAL { ?item rdfs:label ?it FILTER(LANG(?it) = "it") }
      OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
      OPTIONAL { ?item wdt:P57 ?dir. ?dir rdfs:label ?dirL FILTER(LANG(?dirL) = "en") }
      OPTIONAL { ?item wdt:P170 ?cre. ?cre rdfs:label ?creL FILTER(LANG(?creL) = "en") }
      OPTIONAL { ?item wdt:P449 ?net. ?net rdfs:label ?netL FILTER(LANG(?netL) = "en") }
      OPTIONAL { ?item wdt:P495 ?cn. ?cn rdfs:label ?cnL FILTER(LANG(?cnL) = "it") }
      OPTIONAL { ?w schema:about ?item; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?itw }
      OPTIONAL { ?w2 schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enw }
    } GROUP BY ?imdb ?it ?en ?itw ?enw`;
    const rows = await sparql(q);
    rows.forEach(b=>{ const p = pick.get(b.imdb.value); if (!p || p.wd) return; const s = k=> b[k] ? b[k].value : '', l = k=> s(k) ? s(k).split('|').filter(Boolean) : [];
      p.wd = {it: s('it'), en: s('en'), dirs: l('dirs'), cres: l('cres'), nets: l('nets'), cns: l('cns'), itw: s('itw'), enw: s('enw')}; });
    await sleep(1500);
  }
  const out = [...pick.values()];
  fs.writeFileSync(path.join(CACHE, 'live.json'), JSON.stringify(out));
  console.log('\nscritto', path.join(CACHE, 'live.json'), out.length, 'titoli; con Wikidata:', out.filter(x=> x.wd).length);
})().catch(e=>{ console.error(e); process.exit(1); });
