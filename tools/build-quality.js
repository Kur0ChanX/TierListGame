#!/usr/bin/env node
// Controllo qualità notturno: gira ogni notte su GitHub e scrive quality.js, che l'app mostra in ✨ → Controllo dati → «Rapporto notturno».
// Segnala: nomi doppi, anni impossibili, giochi senza tag, frasi legate al tempo, copertine rotte (link che non rispondono),
// voti molto diversi dal Metascore riportato da Steam/CheapShark, lingua italiana diversa da quella ufficiale Steam. Non cambia nulla.
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-quality.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require('./data-io').load();
let F = {games: {}};
try{ F = JSON.parse(fs.readFileSync(path.join(ROOT, 'facts.js'), 'utf8').replace(/^const GAME_FACTS = /, '').replace(/;\s*$/, '')); }catch(e){}
const YEAR = new Date().getFullYear();
const TIME_RE = /uscito da poco|appena uscit|uscita recente|troppo (presto|recente)|di recente|recentissim|ancora presto|pochi mesi|non ancora (valutabil|giudicabil)/i;
const norm = n=> String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const issues = [];
const add = (id, name, kind, text)=> issues.push([id, name, kind, text]);
const seen = {};
for(const g of D.games){
  const k = norm(g.name); if(seen[k]) add(g.id, g.name, 'doppione', 'stesso nome del gioco id ' + seen[k]); else seen[k] = g.id;
  const ys = (String(g.year).match(/\d{4}/g) || []).map(Number);
  if(!ys.length) add(g.id, g.name, 'anno', 'anno mancante');
  else if(ys.some(y=> y < 1970 || y > YEAR + 3)) add(g.id, g.name, 'anno', 'anno impossibile: ' + g.year);
  if(!g.tags || !g.tags.length) add(g.id, g.name, 'tag', 'nessun genere');
  const e = D.enrich[g.id];
  if(e){ const txt = JSON.stringify(e); const m = txt.match(TIME_RE); if(m && ys.length && Math.max(...ys) <= YEAR - 1) add(g.id, g.name, 'testo', 'frase legata al tempo: «' + m[0] + '»'); }
  const f = F.games[g.id];
  if(f){
    const mc = (f.s && f.s.mc) || (f.c && f.c.mc);
    if(mc && Math.abs(mc - g.score) > 10) add(g.id, g.name, 'voto', 'voto ' + g.score + ' ma Metascore riportato ' + mc);
    const it = (D.labels[g.id] || {}).it;
    if(f.s && f.s.it === 'D' && it && it !== 'D') add(g.id, g.name, 'lingua', 'Steam: testi e doppiaggio in italiano, nel database: ' + it);
    if(f.s && f.s.it === 'S' && (it === 'N' || it === 'F')) add(g.id, g.name, 'lingua', 'Steam: testi in italiano, nel database: ' + it);
    if(f.s && f.s.rp != null && f.s.ap != null && f.s.ap - f.s.rp >= 15) add(g.id, g.name, 'community', 'recensioni recenti in calo: ' + f.s.rp + '% contro ' + f.s.ap + '% di sempre');
  }
}
(async()=>{
  // copertine: controllo che il link risponda (poche per notte, a rotazione, per non pesare)
  const withCover = D.games.filter(g=> D.enrich[g.id] && D.enrich[g.id].coverUrl);
  const day = Math.floor(Date.now() / 864e5), per = 60, start = (day * per) % Math.max(1, withCover.length);
  const batch = Array.from({length: Math.min(per, withCover.length)}, (_, i)=> withCover[(start + i) % withCover.length]);
  let broken = 0;
  for(const g of batch){
    try{
      const r = await fetch(D.enrich[g.id].coverUrl, {method: 'HEAD', headers: {'User-Agent': 'TierListGame/1.0'}});
      if(r.status === 404 || r.status === 410){ add(g.id, g.name, 'copertina', 'link della copertina rotto (' + r.status + ')'); broken++; }
    }catch(e){}
  }
  fs.writeFileSync(path.join(ROOT, 'quality.js'), 'const QUALITY = ' + JSON.stringify({built: new Date().toISOString().slice(0, 10), checkedCovers: batch.length, issues}) + ';\n');
  const byKind = {}; issues.forEach(i=> byKind[i[2]] = (byKind[i[2]] || 0) + 1);
  console.log('rapporto qualità:', issues.length, 'segnalazioni', JSON.stringify(byKind), '· copertine controllate', batch.length, 'rotte', broken);
})();
