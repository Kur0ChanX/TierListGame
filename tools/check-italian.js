// Cerca su it.wikipedia le prove di localizzazione italiana (doppiaggio/testi) per i giochi con lingua "N".
// Uso: NODE_USE_ENV_PROXY=1 node tools/check-italian.js out.json  (serve un User-Agent, altrimenti Wikipedia rifiuta)
const fs = require('fs');
const UA = 'TierListGame/1.0 (https://github.com/Kur0ChanX/TierListGame)';
const s = fs.readFileSync(__dirname + '/../giochi.js', 'utf8');
const D = JSON.parse(s.slice('const GIOCHI_DATA = '.length).replace(/;\s*$/, ''));
const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(params){ for(let i = 0; i < 4; i++){ const r = await fetch('https://it.wikipedia.org/w/api.php?' + new URLSearchParams({format:'json', ...params}), {headers:{'User-Agent':UA}, signal: AbortSignal.timeout(15000)}); if(r.ok) return r.json(); await sleep(1500 * (i + 1)); } throw new Error('api'); }
const RX = /doppiatore italiano|doppiaggio italiano|doppiato in italiano|edizione italiana|localizzat\w+ in italiano|tradott\w+ in italiano|sottotitoli in italiano|testi in italiano|lingua italiana/i;
(async()=>{
  const out = {}; const todo = D.games.filter(g => (D.labels[g.id] || {}).it !== 'D');
  const only = process.argv[3] ? new Set(process.argv[3].split(',').map(Number)) : null;
  for(const g of todo){
    if(only && !only.has(g.id)) continue;
    try{
      const base = g.name.replace(/\s*\([^)]*\)/g, '').trim();
      const r = await api({action:'query', list:'search', srsearch: base + ' videogioco', srlimit:'3'});
      const hit = ((r.query || {}).search || []).find(h => { const a = norm(h.title), b = norm(base); return a === b; });
      if(!hit){ out[g.id] = {name:g.name, page:null}; continue; }
      const t = await api({action:'query', prop:'revisions', rvprop:'content', rvslots:'main', titles: hit.title, redirects:'1'});
      const p = Object.values(t.query.pages)[0]; const txt = (p.revisions && p.revisions[0].slots.main['*']) || '';
      const dub = /doppiatore italiano/i.test(txt), m = txt.match(RX);
      out[g.id] = {name:g.name, page:hit.title, dub, hint: m ? txt.slice(Math.max(0, m.index - 80), m.index + 140).replace(/\s+/g, ' ') : null, current:(D.labels[g.id] || {}).it || null};
    }catch(e){ out[g.id] = {name:g.name, error:String(e.message)}; }
    await sleep(250);
    if(Object.keys(out).length % 25 === 0){ console.log(Object.keys(out).length + '/' + todo.length); fs.writeFileSync(process.argv[2] || 'italian-report.json', JSON.stringify(out, null, 1)); }
  }
  fs.writeFileSync(process.argv[2] || 'italian-report.json', JSON.stringify(out, null, 1));
  const found = Object.entries(out).filter(([, v]) => v.dub || v.hint);
  console.log('controllati', Object.keys(out).length, '· con prove di italiano', found.length);
})();
