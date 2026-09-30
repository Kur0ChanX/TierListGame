#!/usr/bin/env node
// Arricchimento italiano da Wikidata + it.wikipedia (solo fonti aperte, nessuna chiave).
// Per ogni titolo cerca (tramite l'ID AniList salvato su Wikidata: P8729 anime, P8731 manga):
//   itn  = titolo italiano (etichetta Wikidata «it» o titolo della voce di it.wikipedia)
//   itw  = titolo della voce di it.wikipedia (serve come link «fonte» nella scheda)
//   ia   = disponibilità in Italia, ricavata dal testo della voce:  D doppiato · S sottotitoli · E edito (manga) · N inedito · (assente = non verificato)
// Uso:   node anime-manga/tools/enrich-it.js [--limit N]        (poi build-data.js unisce content/it-wiki.json)
// Le risposte restano in tools/.cache: rilanciandolo non rifà le richieste già fatte. Dietro proxy: NODE_USE_ENV_PROXY=1.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CACHE = path.join(__dirname, '.cache', 'wiki'); fs.mkdirSync(CACHE, {recursive: true});
const OUT = path.join(__dirname, 'content', 'it-wiki.json');
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? +process.argv[i + 1] : Infinity; })();
const raw = fs.readFileSync(path.join(__dirname, '..', 'dati.js'), 'utf8');
const DATA = JSON.parse(raw.replace(/^[\s\S]*?const AM_DATA = /, '').replace(/;\s*$/, ''));
const items = DATA.items.slice(0, LIMIT);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hash = s => crypto.createHash('md5').update(s).digest('hex').slice(0, 16);
const last = {};
async function http(url, {method = 'GET', body, headers = {}, key, minGap = 1100, host} = {}){
  const file = path.join(CACHE, hash(key || (method + url + (body || ''))) + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const h = host || new URL(url).host;
  for (let attempt = 1; attempt <= 6; attempt++){
    const wait = (last[h] || 0) + minGap - Date.now(); if (wait > 0) await sleep(wait); last[h] = Date.now();
    let res;
    try{ res = await fetch(url, {method, body, headers: Object.assign({'User-Agent': UA, 'Api-User-Agent': UA}, headers)}); }
    catch(e){ console.log('  rete:', e.cause && e.cause.code || e.message); await sleep(3000 * attempt); continue; }
    if (res.status === 429 || res.status === 503 || res.status === 504){ const s = (+res.headers.get('retry-after') || 20 * attempt); console.log(`  ${res.status}: aspetto ${s}s`); await sleep(s * 1000); continue; }
    const text = await res.text();
    if (!res.ok){ console.log('  HTTP', res.status, text.slice(0, 100).replace(/\s+/g, ' ')); if (res.status >= 500){ await sleep(4000 * attempt); continue; } return null; }
    let j; try{ j = JSON.parse(text); }catch(e){ j = null; }
    if (j){ fs.writeFileSync(file, JSON.stringify(j)); return j; }
    await sleep(2000);
  }
  return null;
}

// ------------------------------------------------ 1) Wikidata: ID AniList → etichetta italiana + voce it.wikipedia (anche della serie madre)
async function sparql(prop, ids){
  const q = `SELECT ?al ?it ?itw ?sIt ?sItw WHERE {
  VALUES ?al { ${ids.map(i => `"${i}"`).join(' ')} }
  ?item wdt:${prop} ?al .
  OPTIONAL { ?item rdfs:label ?it FILTER(LANG(?it) = "it") }
  OPTIONAL { ?p schema:about ?item; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?itw }
  OPTIONAL { ?item wdt:P179 ?series .
    OPTIONAL { ?series rdfs:label ?sIt FILTER(LANG(?sIt) = "it") }
    OPTIONAL { ?sp schema:about ?series; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?sItw } }
}`;
  const j = await http('https://query.wikidata.org/sparql?format=json', {method: 'POST', body: 'query=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json'}, minGap: 2500});
  return j ? j.results.bindings : [];
}

// ------------------------------------------------ 2) it.wikipedia: testo della voce → disponibilità in Italia
const PUBLISHERS = /star comics|planet manga|panini|j-?pop|edizioni bd|dynit|goen|magic press|kappa edizioni|play press|rw edizioni|coconino|shin vision|flashbook|ronin manga|hikari edizioni|jpop|manga yo|toshokan|bao publishing|jundo|edizioni star|granata press|fumetti|einaudi|mondadori|sergio bonelli/i;
function parseAvailability(kind, text){
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ');
  if (/(inedit[oa]|non (è|e') (mai )?stat[oa] (pubblicat|trasmess|distribuit|edit)[a-z]* in italia|non ha mai avuto un'edizione italiana)/i.test(t)) return 'N';
  const it = /(edizione italiana|in italia|italiano|italiana)/i.test(t);
  if (kind === 'manga'){
    // editore italiano citato nella sezione «Edizione italiana» o vicino a «in Italia»
    const m = t.match(/(edizione italiana|in italia|pubblicat[oa] (in italia )?(da|dalla|dalle))[^.]{0,220}/i);
    if (m && PUBLISHERS.test(m[0])) return 'E';
    if (/edizione italiana/i.test(t) && PUBLISHERS.test(t)) return 'E';
    return null;
  }
  if (!it) return null;
  const sec = t.match(/(edizione italiana|adattamento italiano|distribuzione in italia|in italia)[^]{0,900}/i);
  const s = sec ? sec[0] : t;
  if (/doppiagg|doppiat/i.test(s) && /(italia|italian)/i.test(s)) return 'D';
  if (/sottotitol/i.test(s)) return 'S';
  if (/(trasmess[oa]|andat[oa] in onda|distribuit[oa]|edit[oa]) (in italia|da|su)/i.test(s)) return 'D';
  return null;
}

(async () => {
  const groups = {anime: items.filter(i => i.id[0] === 'a'), manga: items.filter(i => i.id[0] === 'm')};
  const byAl = new Map();                                     // id AniList → {it, itw}
  for (const [kind, list] of Object.entries(groups)){
    const prop = kind === 'anime' ? 'P8729' : 'P8731';
    for (let i = 0; i < list.length; i += 60){
      const chunk = list.slice(i, i + 60);
      process.stdout.write(`wikidata ${kind} ${i}-${i + chunk.length} … `);
      const rows = await sparql(prop, chunk.map(x => x.al));
      for (const r of rows){
        const al = +r.al.value, cur = byAl.get(al) || {};
        // preferisco la serie madre (voce che descrive tutte le stagioni), poi la voce diretta
        const itw = (r.sItw && r.sItw.value) || (r.itw && r.itw.value) || cur.itw || null;
        const it = (r.sIt && r.sIt.value) || (r.it && r.it.value) || cur.it || null;
        byAl.set(al, {it, itw, direct: (r.itw && r.itw.value) || cur.direct || null});
      }
      console.log(rows.length + ' righe');
    }
  }
  console.log('titoli con voce it.wikipedia:', [...byAl.values()].filter(v => v.itw).length, 'su', items.length);

  // ---- voce di it.wikipedia: se Wikidata non l'ha data (o ha dato un elenco di episodi), la cerco con la ricerca di Wikipedia ----
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, ' ').trim();
  const BAD_TITLE = /^(episodi|personaggi|stagioni|lista|elenco|capitoli|volumi|colonna sonora|discografia|videogiochi|adattamenti)\b/i;
  const KIND_WORD = {anime: 'anime serie animata', film: 'film d\'animazione', manga: 'manga'};
  const KEYWORDS = {anime: /anime|serie (televisiva )?(animata|d'animazione)|animazione|giappon/i, film: /film|animazione|anime|giappon/i, manga: /manga|fumetto|giappon|coreano|manhwa|webtoon|cinese/i};
  let n = 0;
  for (const it of items){
    n++;
    const w = byAl.get(it.al) || {};
    if (w.itw && !BAD_TITLE.test(w.itw)) continue;
    const kw = it.l === 'film' ? 'film' : (it.id[0] === 'a' ? 'anime' : 'manga');
    const q = `${it.name} ${KIND_WORD[kw]}`;
    const url = 'https://it.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', generator: 'search', gsrsearch: q, gsrlimit: '4', gsrnamespace: '0', prop: 'extracts|pageprops', exintro: '1', explaintext: '1', exlimit: '4', exchars: '400', ppprop: 'disambiguation', format: 'json', formatversion: '2'});
    const j = await http(url, {key: 'search:' + q, minGap: 1400});
    const pgs = ((j && j.query && j.query.pages) || []).filter(p => !(p.pageprops && 'disambiguation' in p.pageprops) && !BAD_TITLE.test(p.title)).sort((x, y) => x.index - y.index);
    const names = [it.name, it.jp, w.it, ...(it.alt || []).slice(0, 4)].filter(Boolean).map(norm);
    let best = null;
    for (const p of pgs){
      const t = norm(p.title.replace(/\s*\([^)]*\)\s*$/, ''));
      const okTitle = names.some(nm => nm === t || (nm.length > 4 && (t.startsWith(nm + ' ') || nm.startsWith(t + ' ')) && Math.abs(nm.length - t.length) < 14));
      const okKind = KEYWORDS[kw].test(p.extract || '');
      if (okTitle && okKind){ best = p; break; }
    }
    if (best){ w.itw = best.title; byAl.set(it.al, w); }
    if (n % 25 === 0) console.log(`  ricerca voci ${n}/${items.length}`);
  }
  console.log('titoli con voce it.wikipedia dopo la ricerca:', [...byAl.values()].filter(v => v.itw && !BAD_TITLE.test(v.itw)).length);

  // ---- testo delle voci (una richiesta per voce) ----
  const pages = new Map();
  for (const it of items){ const w = byAl.get(it.al); if (w && w.itw && !BAD_TITLE.test(w.itw) && !pages.has(w.itw)) pages.set(w.itw, it.id[0] === 'a' ? 'anime' : 'manga'); }
  n = 0; const texts = new Map();
  for (const [title, kind] of pages){
    n++;
    const url = 'https://it.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', prop: 'extracts|pageprops', explaintext: '1', redirects: '1', titles: title, format: 'json', formatversion: '2', ppprop: 'disambiguation'});
    const j = await http(url, {key: 'wp:' + title, minGap: 1400});
    const p = j && j.query && j.query.pages && j.query.pages[0];
    if (p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops)) texts.set(title, {kind, text: p.extract || '', resolved: p.title});
    if (n % 25 === 0) console.log(`  voci lette ${n}/${pages.size}`);
  }

  // ---- risultato ----
  const out = {};
  let withIa = 0;
  for (const it of items){
    const w = byAl.get(it.al); if (!w) continue;
    const rec = {};
    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const title = (w.it || w.itw || '').replace(/\s*\((anime|manga|serie animata|serie televisiva( d'animazione)?|film( d'animazione)?|fumetto)[^)]*\)\s*$/i, '').trim();
    if (title && norm(title) !== norm(it.name) && norm(title) !== norm(it.jp)) rec.itn = title;
    if (w.itw && !BAD_TITLE.test(w.itw)){ rec.itw = w.itw; const t = texts.get(w.itw); if (t){ const ia = parseAvailability(it.id[0] === 'a' ? 'anime' : 'manga', t.text); if (ia){ rec.ia = ia; withIa++; } } }
    if (Object.keys(rec).length) out[it.id] = rec;
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 0).replace(/\},"/g, '},\n"') + '\n');
  console.log(`\nscritto ${path.relative(process.cwd(), OUT)}: ${Object.keys(out).length} voci, di cui ${withIa} con disponibilità in Italia`);
})().catch(e => { console.error(e); process.exit(1); });
