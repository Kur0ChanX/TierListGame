#!/usr/bin/env node
// Colonne sonore: per ogni gioco del database cerca su YouTube (dal server: niente blocchi) i video della colonna sonora
// e salva in ost.js fino a 5 brani per gioco: [idVideo, titolo, durata]. L'app lo carica solo quando serve (lettore musicale).
// Per ogni gioco prova, in ordine (stile «triade»): «nome OST music», «nome soundtrack», «nome playlist complete music», poi il nome senza sottotitolo.
// Si fermano al primo tentativo che trova brani. Cerca anche i giochi AGGIUNTI (catalogo pubblico su GitHub), non solo quelli di base.
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-ost.js [--limit N] [--offset N] [--all]   (senza --all salta i giochi che hanno già i brani)
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
const base = n=> clean(n).replace(/\s*[:–—]\s.*$/, '').replace(/\s+-\s.*$/, '').trim();       // «Final Fantasy VII: Remake» → «Final Fantasy VII»
const norm = t=> String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for', 'edition', 'remastered', 'remake', 'definitive', 'complete', 'hd', 'game', 'collection']);
const tokens = n=> norm(n).split(' ').filter(w=> w.length >= 2 && !STOP.has(w));
// il titolo del video deve nominare il gioco (almeno metà delle parole importanti), altrimenti è un altro gioco
const names = (title, name)=>{ const t = ' ' + norm(title) + ' ', w = tokens(name); if(!w.length) return true; const hit = w.filter(x=> t.includes(' ' + x)).length; return hit >= Math.max(1, Math.ceil(w.length / 2)); };
const queries = name=>{
  const n = clean(name), b = base(name), q = [n + ' OST music', n + ' soundtrack', n + ' playlist complete music'];
  if(b && b !== n) q.push(b + ' OST music', b + ' soundtrack');
  return [...new Set(q)];
};
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
const BAD = /reaction|review|piano cover|tutorial|live stream|gameplay|walkthrough|let'?s play|trailer|rap by|remix|cover by/i;
const pickFrom = (res, name)=>{
  const good = res.filter(v=> /ost|soundtrack|music|theme|bgm|score|original|playlist|album/i.test(v[1]) && !BAD.test(v[1]) && secs(v[2]) >= 60 && names(v[1], name));
  // prima le raccolte complete (lunghe), poi i brani singoli
  return good.sort((a, b)=> (secs(b[2]) > 1800) - (secs(a[2]) > 1800)).slice(0, 5);
};
// i giochi aggiunti da Mario stanno nel catalogo pubblico (gist «RaccoonTier-catalogo»): si leggono dal server, senza chiavi
async function customGames(){
  try{
    const owner = process.env.GITHUB_REPOSITORY_OWNER || 'kur0chanx';
    const h = {'User-Agent': 'raccoon-tier', Accept: 'application/vnd.github+json'}; if(process.env.GITHUB_TOKEN) h.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    const l = await (await fetch('https://api.github.com/users/' + owner + '/gists?per_page=100', {headers: h})).json();
    const f = Array.isArray(l) && l.find(g=> g.description === 'RaccoonTier-catalogo'); const file = f && f.files && f.files['catalogo.json']; if(!file) return [];
    const j = await (await fetch(file.raw_url)).json(); const v = j.keys && j.keys.jrpg_db_customGames && j.keys.jrpg_db_customGames.v; if(!v) return [];
    const o = JSON.parse(v); return Object.keys(o).filter(id=> o[id] && o[id].name).map(id=> ({id, name: o[id].name}));
  }catch(e){ console.log('catalogo non letto:', e.message); return []; }
}
(async()=>{
  const ALL = process.argv.includes('--all');
  const games = Object.assign({}, prev.games || {});
  const custom = await customGames(); console.log('giochi aggiunti dal catalogo:', custom.length);
  const seen = new Set(), list = D.games.concat(custom).filter(g=> g && g.name && !seen.has(String(g.id)) && seen.add(String(g.id))).slice(OFFSET, OFFSET + LIMIT);
  let n = 0, ok = 0;
  const save = ()=> fs.writeFileSync(FILE, 'const OST = ' + JSON.stringify({built: new Date().toISOString().slice(0, 10), games}) + ';\n');
  for(const g of list){
    n++;
    if(!ALL && games[g.id] && games[g.id].length){ continue; }
    let pick = [];
    for(const q of queries(g.name)){
      pick = pickFrom(await search(q), g.name);
      await sleep(700);
      if(pick.length) break;
    }
    if(pick.length){ games[g.id] = pick; ok++; }
    if(n % 50 === 0){ console.log(n + '/' + list.length, '· nuove:', ok); save(); }
  }
  save();
  console.log('fatto:', Object.keys(games).length, 'giochi con colonna sonora (nuovi in questo giro:', ok + ')');
})();
