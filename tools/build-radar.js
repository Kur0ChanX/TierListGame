#!/usr/bin/env node
// Radar delle uscite: ogni notte (workflow «Dati settimanali», giro notturno) cerca su Steam i giochi USCITI negli ultimi 45 giorni
// nei generi della app, già con un minimo di recensioni positive, e li salva in radar.js. L'app li confronta con la tua wishlist e i tuoi gusti.
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-radar.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const UA = {'User-Agent': 'TierListGame/1.0 (uso personale; +https://github.com/Kur0ChanX/TierListGame)', 'Accept': 'application/json'};
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const unesc = t=> String(t || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
// codice app -> id del tag Steam (stessi di sources.js)
const TAGS = {JRPG: 4434, WRPG: 122, ACT: 4231, TUR: 1677, TAC: 21725, DUN: 1720, CARD: 1666, ROG: 1716, METR: 1628, SOUL: 29482, MON: 916648, VN: 3799, HOR: 1667, PLAT: 1625, PUZ: 1664, ACTADV: 4106, SIMLIFE: 10235, CITY: 4328, TBS4X: 1741, RTS: 1676, SHMUP: 4255, FIGHT: 1743};
const NO_ADULT = '&untags=12095,6650,9130';
const MON = {Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12};
function parseDate(t){
  const m = String(t || '').trim().match(/(\d{1,2}) (\w{3}),? (\d{4})/) || String(t || '').trim().match(/(\w{3}) (\d{1,2}),? (\d{4})/);
  if(!m) return null;
  let d, mo, y;
  if(/^\d/.test(m[1])){ d = +m[1]; mo = MON[m[2]]; y = +m[3]; } else { mo = MON[m[1]]; d = +m[2]; y = +m[3]; }
  if(!mo) return null;
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
async function get(url){
  for(let a = 0; a < 3; a++){
    try{ const r = await fetch(url, {headers: UA}); if(r.status === 429 || r.status >= 500){ await sleep(4000 * (a + 1)); continue; } if(!r.ok) return null; return await r.json(); }catch(e){ await sleep(1500); }
  }
  return null;
}
(async()=>{
  const today = new Date(), minDate = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
  const pool = new Map();
  for(const [code, tag] of Object.entries(TAGS)){
    for(let page = 0; page < 3; page++){
      const j = await get('https://store.steampowered.com/search/results/?query&start=' + (page * 50) + '&count=50&sort_by=Released_DESC&infinite=1&cc=it&l=english&category1=998&tags=' + tag + NO_ADULT);
      if(!j || !j.results_html) break;
      let older = 0;
      j.results_html.split('search_result_row').slice(1).forEach(r=>{
        const title = unesc((r.match(/class="title">([^<]+)/) || [])[1]);
        const app = (r.match(/data-ds-appid="(\d+)"/) || [])[1];
        const date = parseDate((r.match(/search_released[^>]*>\s*([^<]+)/) || [])[1]);
        const tip = unesc((r.match(/data-tooltip-html="([^"]+)/) || [])[1] || '');
        const m = tip.match(/(\d+)% of the ([\d,.]+) user reviews/i);
        const price = (r.match(/discount_final_price[^>]*>([^<]+)</) || [])[1] || '';
        if(!title || !app || !date) return;
        if(date < minDate){ older++; return; }
        if(date > today.toISOString().slice(0, 10)) return;
        const pct = m ? +m[1] : null, cnt = m ? parseInt(m[2].replace(/[,.]/g, ''), 10) : 0;
        if(pct == null || pct < 70 || cnt < 15) return;
        const ex = pool.get(app);
        if(ex){ if(!ex.tags.includes(code)) ex.tags.push(code); return; }
        pool.set(app, {name: title.trim(), app: +app, date, pct, cnt, tags: [code], price: price.trim()});
      });
      if(older >= 40) break;
      await sleep(1200);
    }
  }
  const items = [...pool.values()].sort((a, b)=> (b.pct * Math.log10(b.cnt + 10)) - (a.pct * Math.log10(a.cnt + 10))).slice(0, 250)
    .map(x=> [x.name, x.app, x.date, x.pct, x.cnt, x.tags.join(','), x.price]);
  fs.writeFileSync(path.join(ROOT, 'radar.js'), 'const RADAR = ' + JSON.stringify({built: today.toISOString().slice(0, 10), items}) + ';\n');
  console.log('radar:', items.length, 'uscite degli ultimi 45 giorni');
})();
