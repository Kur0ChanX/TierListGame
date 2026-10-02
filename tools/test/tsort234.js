// v234: menu della ★ in tabella (giochi che amo, preferiti, storia, dopamina, stato), niente pallino dello stato
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.addInitScript(()=>{ try{ localStorage.setItem('jrpg_view_mode','"table"'); }catch(e){} });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
await p.evaluate(()=>{ const ids=GAMES.slice(50,52).map(g=>g.id); localStorage.setItem('jrpg_top', JSON.stringify(ids)); window.__ids=ids; render(); });
await p.tap('thead th[data-key="fav"]'); await p.waitForTimeout(300);
console.log('menu aperto:', await p.evaluate(()=>document.querySelectorAll('#sortMenu .sm-i').length));
if(process.argv[2]) await p.screenshot({path: process.argv[2]+'/s234.png', clip:{x:0,y:300,width:412,height:600}});
await p.evaluate(()=>document.querySelector('#sortMenu [data-sm="heart"]').click()); await p.waitForTimeout(400);
console.log('primi = giochi che amo:', await p.evaluate(()=>[...document.querySelectorAll('#tbody tr')].slice(0,2).every(tr=>__ids.includes(+tr.dataset.gid))), '| menu chiuso:', await p.evaluate(()=>!document.getElementById('sortMenu')));
await p.tap('thead th[data-key="fav"]'); await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#sortMenu [data-sm="dopa"]').click()); await p.waitForTimeout(400);
console.log('primo = dopamina:', await p.evaluate(()=>{ const g=GAMES.find(x=>x.id===+document.querySelector('#tbody tr').dataset.gid); return !!(g.enrich&&g.enrich.dopamine); }));
console.log('pallini stato:', await p.evaluate(()=>document.querySelectorAll('#tbody .status-dot').length));
console.log('ERR',errs); await b.close();})();
