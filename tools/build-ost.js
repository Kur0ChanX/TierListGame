#!/usr/bin/env node
// Colonne sonore: per ogni gioco del database cerca su YouTube (dal server: niente blocchi) i video della colonna sonora
// e salva in ost.js fino a 5 brani per gioco: [idVideo, titolo, durata]. L'app lo carica solo quando serve (lettore musicale).
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-ost.js [--limit N] [--offset N]   (gira ogni settimana e riprende da dove era)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require('./data-io').load();
const arg = n=>{ const i = process.argv.indexOf('--' + n); return i > -1 ? +process.argv[i + 1] : null; };
const LIMIT = arg('limit') || 99999, OFFSET = arg('offset') || 0;
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9'};
const FILE = path.join(ROOT, 'ost.js');
let prev = {games: {}};
try{ prev = JSON.parse(fs.readFileSync(FILE, 'utf8').replace(/^const OST = /, '').replace(/;\s*$/, '')); }catch(e){}
const clean = n=> String(n).replace(/\s*\([^)]*\)/g, '').trim();
// estrae i risultati video dalla pagina di ricerca (ytInitialData)
function parse(html){
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s); if(!m) return [];
  let data; try{ data = JSON.parse(m[1]); }catch(e){ return []; }
  const out = [];
  (function walk(o){
    if(!o || typeof o !== 'object' || out.length >= 20) return;
    if(o.videoRenderer && o.videoRenderer.videoId){
      const v = o.videoRenderer;
      out.push([v.videoId, ((v.title && v.title.runs && v.title.runs[0] && v.title.runs[0].text) || '').slice(0, 70), (v.lengthText && v.lengthText.simpleText) || '']);
      return;
    }
    for(const k in o) walk(o[k]);
  })(data);
  return out;
}
const secs = t=> String(t || '').split(':').reduce((a, x)=> a * 60 + (+x || 0), 0);
async function search(q){
  for(let a = 0; a < 3; a++){
    try{ const r = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), {headers: UA}); if(r.status === 429){ await sleep(8000 * (a + 1)); continue; } if(!r.ok) return []; return parse(await r.text()); }catch(e){ await sleep(2000); }
  }
  return [];
}
(async()=>{
  const games = Object.assign({}, prev.games || {});
  const list = D.games.slice(OFFSET, OFFSET + LIMIT);
  let n = 0, ok = 0;
  for(const g of list){
    n++;
    const res = await search(clean(g.name) + ' soundtrack OST');
    const good = res.filter(v=> /ost|soundtrack|music|theme|bgm|score|original/i.test(v[1]) && !/reaction|review|piano cover|tutorial|live stream/i.test(v[1]) && secs(v[2]) >= 60);
    // prima le raccolte complete (lunghe), poi i brani singoli
    const pick = good.sort((a, b)=> (secs(b[2]) > 1800) - (secs(a[2]) > 1800)).slice(0, 5);
    if(pick.length){ games[g.id] = pick; ok++; }
    if(n % 50 === 0){ console.log(n + '/' + list.length, '· con musica:', ok); fs.writeFileSync(FILE, 'const OST = ' + JSON.stringify({built: new Date().toISOString().slice(0, 10), games}) + ';\n'); }
    await sleep(900);
  }
  fs.writeFileSync(FILE, 'const OST = ' + JSON.stringify({built: new Date().toISOString().slice(0, 10), games}) + ';\n');
  console.log('fatto:', Object.keys(games).length, 'giochi con colonna sonora');
})();
