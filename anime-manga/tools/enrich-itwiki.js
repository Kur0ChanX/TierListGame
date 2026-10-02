#!/usr/bin/env node
// Legge le voci di it.wikipedia dei titoli (già trovate da Wikidata: campo itw) e ne ricava, dal wikitext:
//   pu  = percorso dell'immagine dell'infobox (locandina/copertina) su upload.wikimedia.org, con {w} al posto della larghezza
//   ia  = disponibilità in Italia:  D doppiato · S sottotitoli · E edito (manga) · N inedito  (assente = non verificato)
//   ite = editore/emittente italiano dichiarato nell'infobox (es. «Star Comics», «Rai 2»)
// Uso:  node anime-manga/tools/enrich-itwiki.js         → scrive tools/content/it-wiki.json (unito da build-data.js)
// Richieste a gruppi di 20 voci con pausa; rilanciandolo si riparte dalla cache (tools/.cache/itwiki). Dietro proxy: NODE_USE_ENV_PROXY=1.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CACHE = path.join(__dirname, '.cache', 'itwiki'); fs.mkdirSync(CACHE, {recursive: true});
const OUT = path.join(__dirname, 'content', 'it-wiki.json');
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const raw = fs.readFileSync(path.join(__dirname, '..', 'dati.js'), 'utf8');
const D = JSON.parse(raw.replace(/^[\s\S]*?const AM_DATA = /, '').replace(/;\s*$/, ''));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = 0;
async function api(titles, extra){
  const params = Object.assign({action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: titles.join('|'), redirects: '1', format: 'json', formatversion: '2'}, extra || {});
  const key = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex').slice(0, 16), file = path.join(CACHE, key + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = 'https://it.wikipedia.org/w/api.php?' + new URLSearchParams(params);
  for (let attempt = 1; attempt <= 8; attempt++){
    const wait = last + 4000 - Date.now(); if (wait > 0) await sleep(wait); last = Date.now();
    let res; try{ res = await fetch(url, {headers: {'User-Agent': UA, 'Api-User-Agent': UA}}); }catch(e){ await sleep(3000 * attempt); continue; }
    if ([429, 502, 503, 504].includes(res.status)){ const s = Math.min(120, +res.headers.get('retry-after') || 20 * attempt); console.log(`  ${res.status}: aspetto ${s}s`); await sleep(s * 1000); continue; }
    if (!res.ok) return null;
    const j = await res.json(); fs.writeFileSync(file, JSON.stringify(j)); return j;
  }
  return null;
}
const PUBLISHERS = /star comics|planet manga|panini|j-?pop|edizioni bd|dynit|goen|magic press|kappa edizioni|play press|rw edizioni|coconino|shin vision|flashbook|ronin manga|hikari|manga yo|toshokan|bao publishing|jundo|granata press|edizioni star|d\/visual|magic bus|fanucci|renoir|tunué/i;
const clean = s => String(s || '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/<[^>]+>/g, '').replace(/\{\{[^}]*\}\}/g, '').replace(/'{2,}/g, '').replace(/\s+/g, ' ').trim();
function parse(kind, text){
  const out = {};
  const im = text.match(/\|\s*immagine\s*=\s*([^\n|}]+)/i);
  if (im){ let f = im[1].replace(/^\s*(file|immagine|image):/i, '').replace(/\[\[|\]\]/g, '').trim(); if (f && !/\.svg$/i.test(f) && !/^(nessuna|no|nd)$/i.test(f)) out.iwi = f; }
  const ed = text.match(/\|\s*editore\s*it\s*=\s*([^\n|]+)/i), rete = text.match(/\|\s*(rete|emittente)\s*it\s*=\s*([^\n|]+)/i), dist = text.match(/\|\s*distribuzione\s*it\s*=\s*([^\n|]+)/i);
  if (ed && clean(ed[1])) out.ite = clean(ed[1]).slice(0, 60);
  else if (rete && clean(rete[2])) out.ite = clean(rete[2]).slice(0, 60);
  else if (dist && clean(dist[1])) out.ite = clean(dist[1]).slice(0, 60);
  const secs = text.split(/\n(?==+[^=\n]+=+\s*\n)/);
  const italSec = secs.filter(s => /^==+\s*(edizione italiana|edizioni italiane|distribuzione|doppiaggio|adattamento italiano|in italia|pubblicazione in italia|trasmissione in italia)/i.test(s));
  const it = italSec.map(s => s.slice(0, 2500)).join('\n');
  if (/inedit[oa] in italia|non (è|e') (mai )?stat[oa] (pubblicat|trasmess|distribuit|edit)[a-z]* in italia|mai (giunt|arrivat)[oa] in italia/i.test(text)) out.ia = 'N';
  else if (kind === 'manga'){
    if (out.ite && PUBLISHERS.test(out.ite)) out.ia = 'E';
    else if (PUBLISHERS.test(it) && /italia|italian/i.test(it)) out.ia = 'E';
  } else {
    if (/doppiator[ei] italian[oi]|doppiaggio italiano|edizione italiana[^\n]{0,400}doppiagg|studio di doppiaggio/i.test(text) || /doppiagg/i.test(it)) out.ia = 'D';
    else if (/sottotitol[a-z]* in italiano|sottotitoli italiani/i.test(text + it)) out.ia = 'S';
    else if (out.ite) out.ia = 'D';
  }
  return out;
}
(async () => {
  const pages = new Map();                                    // titolo pagina → tipi
  D.items.forEach(i => { if (i.itw) { const k = i.l === 'film' || i.l === 'anime' ? 'anime' : 'manga'; if (!pages.has(i.itw)) pages.set(i.itw, k); } });
  const titles = [...pages.keys()];
  console.log('voci di it.wikipedia da leggere:', titles.length);
  const res = new Map();                                      // titolo → dati
  for (let i = 0; i < titles.length; i += 20){
    const chunk = titles.slice(i, i + 20);
    process.stdout.write(`voci ${i}-${i + chunk.length} … `);
    const j = await api(chunk);
    if (!j || !j.query){ console.log('nessuna risposta'); continue; }
    const norm = {}, redir = {}; (j.query.normalized || []).forEach(n => { norm[n.from] = n.to; }); (j.query.redirects || []).forEach(n => { redir[n.from] = n.to; });
    const byTitle = {}; (j.query.pages || []).forEach(p => { byTitle[p.title] = p; });
    let n = 0;
    for (const t of chunk){
      const p = byTitle[redir[norm[t] || t] || norm[t] || t]; if (!p || p.missing || !p.revisions) continue;
      res.set(t, parse(pages.get(t), p.revisions[0].slots.main.content)); n++;
    }
    console.log(n + '/' + chunk.length);
  }
  // ---- immagini: da nome file a indirizzo diretto (upload.wikimedia.org), a gruppi di 50 ----
  const files = [...new Set([...res.values()].map(r => r.iwi).filter(Boolean))];
  const thumb = new Map();
  for (let i = 0; i < files.length; i += 50){
    const chunk = files.slice(i, i + 50);
    process.stdout.write(`immagini ${i}-${i + chunk.length} … `);
    const j = await api(chunk.map(f => 'File:' + f), {prop: 'imageinfo', iiprop: 'url', iiurlwidth: '330', rvprop: undefined, rvslots: undefined});
    if (!j || !j.query){ console.log('nessuna risposta'); continue; }
    const norm = {}; (j.query.normalized || []).forEach(n => { norm[n.from] = n.to; });
    const by = {}; (j.query.pages || []).forEach(p => { by[p.title] = p; });
    let n = 0;
    for (const f of chunk){ const p = by[norm['File:' + f] || 'File:' + f]; const u = p && p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl; const m = u && u.match(/\/wikipedia\/(.+)$/); if (m){ thumb.set(f, m[1].replace(/\/\d+px-/, '/{w}px-')); n++; } }
    console.log(n + '/' + chunk.length);
  }
  const out = {}; let nia = 0, nimg = 0, nite = 0;
  for (const it of D.items){
    if (!it.itw) continue;
    const r = res.get(it.itw); if (!r) continue;
    const o = {itw: it.itw}; if (it.itn) o.itn = it.itn;
    if (r.ia){ o.ia = r.ia; nia++; } if (r.iwi && thumb.has(r.iwi)){ o.pu = thumb.get(r.iwi); nimg++; } if (r.ite){ o.ite = r.ite; nite++; }
    out[it.id] = o;
  }
  // il file dei contenuti scritti a mano resta a parte: questo è solo il risultato automatico
  fs.writeFileSync(OUT, JSON.stringify(out).replace(/\},"/g, '},\n"') + '\n');
  console.log(`\nscritto it-wiki.json: ${Object.keys(out).length} voci · disponibilità in Italia ${nia} · immagini ${nimg} · editori/emittenti ${nite}`);
})().catch(e => { console.error(e); process.exit(1); });
