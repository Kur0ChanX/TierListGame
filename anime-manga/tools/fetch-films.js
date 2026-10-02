#!/usr/bin/env node
// Film d'animazione di TUTTI gli studi (Pixar, Disney, DreamWorks, Illumination, Sony, Warner, Ghibli, Laika, Aardman, Blue Sky, Toei…).
// Fonti aperte: dataset non commerciali di IMDb (voto medio e numero di voti), Wikidata (studio, regia, paese, saga, titolo italiano, ID AniList/MAL)
// e Wikipedia (locandina della voce inglese). Uso:  node anime-manga/tools/fetch-films.js [--votes 3000]
// Scrive tools/.cache/films.json (ignorato da git); poi build-data.js lo unisce ai dati. Dietro un proxy: NODE_USE_ENV_PROXY=1.
// Le richieste restano in cache: rilanciarlo non rifà quelle già fatte.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), readline = require('readline'), crypto = require('crypto');
const CACHE = path.join(__dirname, '.cache'), IMDB = path.join(CACHE, 'imdb'), WD = path.join(CACHE, 'wd');
fs.mkdirSync(IMDB, {recursive: true}); fs.mkdirSync(WD, {recursive: true});
const MIN_VOTES = (() => { const i = process.argv.indexOf('--votes'); return i > 0 ? +process.argv[i + 1] : 3000; })();
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hash = s => crypto.createHash('md5').update(s).digest('hex').slice(0, 16);
const last = {};

async function download(url, file){
  if (fs.existsSync(file) && fs.statSync(file).size > 1e6) return;
  console.log('scarico', url);
  const res = await fetch(url, {headers: {'User-Agent': UA}});
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}
async function http(url, {method = 'GET', body, headers = {}, gap = 2500} = {}){
  const key = hash(method + url + (body || ''));
  const file = path.join(WD, key + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const host = new URL(url).host;
  for (let attempt = 1; attempt <= 8; attempt++){
    const wait = (last[host] || 0) + gap - Date.now(); if (wait > 0) await sleep(wait); last[host] = Date.now();
    let res;
    try{ res = await fetch(url, {method, body, headers: Object.assign({'User-Agent': UA, 'Api-User-Agent': UA}, headers)}); }
    catch(e){ console.log('  rete:', e.cause && e.cause.code || e.message); await sleep(3000 * attempt); continue; }
    if ([429, 502, 503, 504].includes(res.status)){ const s = Math.min(90, (+res.headers.get('retry-after') || 15 * attempt)); console.log(`  ${res.status} ${host}: aspetto ${s}s`); await sleep(s * 1000); continue; }
    const text = await res.text();
    if (!res.ok){ console.log('  HTTP', res.status, text.slice(0, 120).replace(/\s+/g, ' ')); return null; }
    let j; try{ j = JSON.parse(text); }catch(e){ j = null; }
    if (j){ fs.writeFileSync(file, JSON.stringify(j)); return j; }
    await sleep(2000);
  }
  return null;
}

// ------------------------------------------------ 1) IMDb: film d'animazione con abbastanza voti
async function imdbCandidates(){
  const cf = path.join(IMDB, `candidates-${MIN_VOTES}.json`);
  if (fs.existsSync(cf)) return JSON.parse(fs.readFileSync(cf, 'utf8'));
  await download('https://datasets.imdbws.com/title.ratings.tsv.gz', path.join(IMDB, 'title.ratings.tsv.gz'));
  await download('https://datasets.imdbws.com/title.basics.tsv.gz', path.join(IMDB, 'title.basics.tsv.gz'));
  const ratings = new Map();
  for await (const line of readline.createInterface({input: fs.createReadStream(path.join(IMDB, 'title.ratings.tsv.gz')).pipe(zlib.createGunzip())})){
    const [id, r, v] = line.split('\t'); if (id !== 'tconst' && +v >= MIN_VOTES) ratings.set(id, [+r, +v]);
  }
  const out = [];
  for await (const line of readline.createInterface({input: fs.createReadStream(path.join(IMDB, 'title.basics.tsv.gz')).pipe(zlib.createGunzip())})){
    const c = line.split('\t');
    if (!['movie', 'video', 'tvMovie'].includes(c[1]) || c[4] === '1' || !(c[8] || '').split(',').includes('Animation')) continue;
    const rt = ratings.get(c[0]); if (!rt) continue;
    const run = +c[7] || 0; if (run && run < 40) continue;
    out.push({imdb: c[0], type: c[1], title: c[2], orig: c[3], year: +c[5] || 0, run, genres: c[8], r: rt[0], v: rt[1]});
  }
  fs.writeFileSync(cf, JSON.stringify(out));
  return out;
}

// ------------------------------------------------ 2) Wikidata (via ID IMDb)
async function sparql(query){
  const j = await http('https://query.wikidata.org/sparql?format=json', {method: 'POST', body: 'query=' + encodeURIComponent(query), headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json'}, gap: 3000});
  return j ? j.results.bindings : [];
}
const val = b => b && b.value;
async function wikidata(films){
  const map = new Map(films.map(f => [f.imdb, {imdb: f.imdb, prods: new Set(), dists: new Set(), dirs: new Set(), countries: new Set(), series: new Set(), wdGenres: new Set()}]));
  for (let i = 0; i < films.length; i += 50){
    const ids = films.slice(i, i + 50).map(f => `"${f.imdb}"`).join(' ');
    process.stdout.write(`wikidata ${i}-${i + 50} … `);
    const q1 = `SELECT ?imdb ?item ?anim ?en ?it ?enw ?itw ?mal ?al ?date WHERE {
      VALUES ?imdb { ${ids} } ?item wdt:P345 ?imdb .
      OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en)="en") } OPTIONAL { ?item rdfs:label ?it FILTER(LANG(?it)="it") }
      OPTIONAL { ?a schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enw }
      OPTIONAL { ?b schema:about ?item; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?itw }
      OPTIONAL { ?item wdt:P4086 ?mal } OPTIONAL { ?item wdt:P8729 ?al } OPTIONAL { ?item wdt:P577 ?date }
      BIND(EXISTS { ?item wdt:P31/wdt:P279* wd:Q202866 } AS ?anim) }`;
    const r1 = await sparql(q1);
    for (const b of r1){
      const m = map.get(val(b.imdb)); if (!m) continue;
      m.item = m.item || val(b.item).split('/').pop();
      m.anim = m.anim || val(b.anim) === 'true';
      m.en = m.en || val(b.en); m.it = m.it || val(b.it); m.enw = m.enw || val(b.enw); m.itw = m.itw || val(b.itw);
      m.mal = m.mal || val(b.mal); m.al = m.al || val(b.al); m.date = m.date || val(b.date);
    }
    const q2 = `SELECT ?imdb ?prod ?dist ?dir ?country ?series WHERE {
      VALUES ?imdb { ${ids} } ?item wdt:P345 ?imdb .
      OPTIONAL { ?item wdt:P272 ?p . ?p rdfs:label ?prod FILTER(LANG(?prod)="en") }
      OPTIONAL { ?item wdt:P750 ?d . ?d rdfs:label ?dist FILTER(LANG(?dist)="en") }
      OPTIONAL { ?item wdt:P57 ?di . ?di rdfs:label ?dir FILTER(LANG(?dir)="en") }
      OPTIONAL { ?item wdt:P495 ?c . ?c rdfs:label ?country FILTER(LANG(?country)="en") }
      OPTIONAL { ?item wdt:P179 ?s . ?s rdfs:label ?series FILTER(LANG(?series)="en") } }`;
    const r2 = await sparql(q2);
    for (const b of r2){
      const m = map.get(val(b.imdb)); if (!m) continue;
      if (b.prod) m.prods.add(val(b.prod)); if (b.dist) m.dists.add(val(b.dist)); if (b.dir) m.dirs.add(val(b.dir)); if (b.country) m.countries.add(val(b.country)); if (b.series) m.series.add(val(b.series));
    }
    const q3 = `SELECT ?imdb ?genre WHERE { VALUES ?imdb { ${ids} } ?item wdt:P345 ?imdb . ?item wdt:P136 ?g . ?g rdfs:label ?genre FILTER(LANG(?genre)="en") }`;
    const r3 = await sparql(q3);
    for (const b of r3){ const m = map.get(val(b.imdb)); if (m && b.genre) m.wdGenres.add(val(b.genre)); }
    console.log(r1.length + '/' + r2.length + '/' + r3.length + ' righe');
  }
  for (const m of map.values()){ for (const k of ['prods', 'dists', 'dirs', 'countries', 'series', 'wdGenres']) m[k] = [...m[k]]; }
  return map;
}

// ------------------------------------------------ 3) Locandine: immagine principale della voce inglese di Wikipedia (a gruppi di 50)
async function posters(titles){
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50){
    const chunk = titles.slice(i, i + 50);
    process.stdout.write(`locandine ${i}-${i + chunk.length} … `);
    const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', titles: chunk.join('|'), prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '330', redirects: '1', format: 'json', formatversion: '2'});
    const j = await http(url, {gap: 4000});
    if (!j || !j.query){ console.log('nessuna risposta'); continue; }
    const norm = {}; (j.query.normalized || []).forEach(n => { norm[n.from] = n.to; });
    const redir = {}; (j.query.redirects || []).forEach(n => { redir[n.from] = n.to; });
    const pages = {}; (j.query.pages || []).forEach(p => { pages[p.title] = p; });
    let n = 0;
    for (const t of chunk){ const r = redir[norm[t] || t] || norm[t] || t; const p = pages[r]; if (p && p.thumbnail){ out.set(t, p.thumbnail.source); n++; } }
    console.log(n + '/' + chunk.length);
  }
  return out;
}

(async () => {
  const films = await imdbCandidates();
  console.log('candidati IMDb (film d\'animazione, ≥' + MIN_VOTES + ' voti):', films.length);
  const wd = await wikidata(films);
  const titles = [...new Set([...wd.values()].map(m => m.enw).filter(Boolean))];
  console.log('voci inglesi di Wikipedia:', titles.length);
  const ps = process.argv.includes('--no-posters') ? new Map() : await posters(titles);     // --no-posters: salta le locandine (Wikipedia limita le richieste); l'app le cerca da sola a runtime
  const out = films.map(f => { const m = wd.get(f.imdb) || {}; return Object.assign({}, f, {wd: m, poster: m.enw ? ps.get(m.enw) || null : null}); });
  fs.writeFileSync(path.join(CACHE, 'films.json'), JSON.stringify({fetched: new Date().toISOString().slice(0, 10), films: out}));
  console.log(`\nfilms.json: ${out.length} film, ${out.filter(f => f.wd.item).length} con Wikidata, ${out.filter(f => f.poster).length} con locandina, ${out.filter(f => f.wd.anim).length} riconosciuti come film d'animazione`);
})().catch(e => { console.error(e); process.exit(1); });
