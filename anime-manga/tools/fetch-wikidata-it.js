#!/usr/bin/env node
// Titoli italiani e voci di it.wikipedia per anime e manga, da Wikidata (ID MyAnimeList: P4086 anime, P4087 manga).
// Uso: node anime-manga/tools/fetch-wikidata-it.js   → tools/.cache/wd-it.json  (build-data.js lo usa per il titolo italiano)
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CACHE = path.join(__dirname, '.cache'), WD = path.join(CACHE, 'wd'); fs.mkdirSync(WD, {recursive: true});
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastCall = 0;
async function sparql(query){
  const key = crypto.createHash('md5').update(query).digest('hex').slice(0, 16), file = path.join(WD, 'it-' + key + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let attempt = 1; attempt <= 6; attempt++){
    const wait = lastCall + 3000 - Date.now(); if (wait > 0) await sleep(wait); lastCall = Date.now();
    let res;
    try{ res = await fetch('https://query.wikidata.org/sparql?format=json', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json', 'User-Agent': UA}, body: 'query=' + encodeURIComponent(query)}); }
    catch(e){ await sleep(3000 * attempt); continue; }
    if ([429, 502, 503, 504].includes(res.status)){ await sleep(Math.min(90, 15 * attempt) * 1000); continue; }
    const t = await res.text(); let j; try{ j = JSON.parse(t).results.bindings; }catch(e){ await sleep(2000); continue; }
    fs.writeFileSync(file, JSON.stringify(j)); return j;
  }
  return [];
}
(async () => {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'dati.js'), 'utf8');
  const D = JSON.parse(raw.replace(/^[\s\S]*?const AM_DATA = /, '').replace(/;\s*$/, ''));
  const out = {};
  for (const [prefix, prop] of [['a', 'P4086'], ['m', 'P4087']]){
    const list = D.items.filter(i => i.id[0] === prefix && i.mal && i.l !== 'film');
    for (let i = 0; i < list.length; i += 60){
      const chunk = list.slice(i, i + 60);
      process.stdout.write(`${prefix} ${i}-${i + chunk.length} … `);
      const q = `SELECT ?mal ?it ?itw ?sIt ?sItw WHERE {
        VALUES ?mal { ${chunk.map(x => `"${x.mal}"`).join(' ')} } ?item wdt:${prop} ?mal .
        OPTIONAL { ?item rdfs:label ?it FILTER(LANG(?it)="it") }
        OPTIONAL { ?p schema:about ?item; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?itw }
        OPTIONAL { ?item wdt:P179 ?s . OPTIONAL { ?s rdfs:label ?sIt FILTER(LANG(?sIt)="it") } OPTIONAL { ?sp schema:about ?s; schema:isPartOf <https://it.wikipedia.org/>; schema:name ?sItw } } }`;
      const rows = await sparql(q);
      for (const b of rows){
        const it = chunk.find(x => String(x.mal) === b.mal.value); if (!it) continue;
        const cur = out[it.id] || {};
        // le voci «episodi/stagione» non servono: preferisco la serie madre o l'etichetta senza «stagione»
        const label = (b.sIt && b.sIt.value) || (b.it && b.it.value) || cur.it;
        const page = (b.sItw && b.sItw.value) || (b.itw && b.itw.value) || cur.itw;
        out[it.id] = {it: label || null, itw: page || null};
      }
      console.log(rows.length + ' righe');
    }
  }
  fs.writeFileSync(path.join(CACHE, 'wd-it.json'), JSON.stringify(out));
  console.log('scritto wd-it.json:', Object.keys(out).length, 'voci,', Object.values(out).filter(v => v.it).length, 'con titolo italiano');
})().catch(e => { console.error(e); process.exit(1); });
