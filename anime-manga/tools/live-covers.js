#!/usr/bin/env node
// Locandine dei film e delle serie dal vivo (kind filmlive/serie) che non ce l'hanno: immagine della voce di Wikipedia italiana (itw),
// altrimenti inglese (enw). A gruppi di 50, senza chiavi. Salva in enrich.coverUrl (come i film d'animazione).
// Uso:  NODE_USE_ENV_PROXY=1 node anime-manga/tools/live-covers.js
'use strict';
const io = require('./data-io');
const UA = 'RaccoonTierAnimeManga/1.0 (https://github.com/Kur0ChanX/TierListGame; hobby project, low rate)';
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
async function images(lang, titles){
  const u = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({action: 'query', format: 'json', formatversion: '2', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '330', pilicense: 'any', redirects: '1', titles: titles.join('|')});
  for (let a = 1; a <= 5; a++){
    try{
      const r = await fetch(u, {headers: {'User-Agent': UA, 'Api-User-Agent': UA}});
      if (r.status === 429 || r.status >= 500){ await sleep(5000 * a); continue; }
      const j = await r.json(), q = j.query || {}, map = new Map();
      // i titoli possono essere normalizzati o reindirizzati: risalgo al titolo chiesto
      const back = new Map(); (q.normalized || []).forEach(n=> back.set(n.to, n.from)); (q.redirects || []).forEach(n=> back.set(n.to, back.get(n.from) || n.from));
      (q.pages || []).forEach(p=>{ if (p.thumbnail && p.thumbnail.source) map.set(back.get(p.title) || p.title, p.thumbnail.source); });
      return map;
    }catch(e){ await sleep(3000 * a); }
  }
  return new Map();
}
(async ()=>{
  const D = io.load();
  const todo = D.games.filter(g=> (g.kind === 'filmlive' || g.kind === 'serie') && !((D.enrich[g.id] || {}).coverUrl));
  let found = 0;
  for (const [lang, key] of [['it', 'itw'], ['en', 'enw']]){
    const list = todo.filter(g=> g[key] && !((D.enrich[g.id] || {}).coverUrl));
    for (let i = 0; i < list.length; i += 50){
      const chunk = list.slice(i, i + 50), m = await images(lang, chunk.map(g=> g[key]));
      chunk.forEach(g=>{ const u = m.get(g[key]); if (u){ D.enrich[g.id] = Object.assign({}, D.enrich[g.id] || {}, {coverUrl: u}); found++; } });
      process.stdout.write(`\r${lang}.wikipedia ${Math.min(i + 50, list.length)}/${list.length} · locandine trovate ${found}   `);
      await sleep(400);
    }
  }
  io.save(D);
  console.log(`\nlocandine: ${found} su ${todo.length}`);
})().catch(e=>{ console.error(e); process.exit(1); });
