// v217: regola «pagine ferme»: ogni tasto di sotto parte dall'alto e la pagina non si muove da sola; tornando da un gioco la posizione resta
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark',deviceScaleFactor:2.6});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(9000);
await p.evaluate(()=>{ window.__sy=[]; window.SC=()=>{ const ids=['tableWrap','altView','myTierWrap','statsPanel','sagaPanel','discoverPanel','novitaPanel','novitaGenrePanel']; let m=Math.round(scrollY); ids.forEach(i=>{ const e=document.getElementById(i); if(e&&e.offsetParent!==null) m=Math.max(m,Math.round(e.scrollTop)); }); return m; };
  window.SET=y=>{ scrollTo(0,y); ['tableWrap','altView','myTierWrap','statsPanel','sagaPanel','discoverPanel','novitaPanel','novitaGenrePanel'].forEach(i=>{ const e=document.getElementById(i); if(e&&e.offsetParent!==null) e.scrollTop=y; }); };
  document.addEventListener('scroll',()=>__sy.push(SC()),{passive:true,capture:true}); });
const tap=async sel=>{ const bb=await p.locator(sel).first().boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2, bb.y+bb.height/2); };
for(const v of ['list','discover','novita','stats','saga','mytier','list']){
  await p.evaluate(()=>SET(1500)); await p.waitForTimeout(300);
  await p.evaluate(()=>{ __sy.length=0; });
  await tap('.view-tab[data-view="'+v+'"]'); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({ora:SC(), movimenti:[...new Set(__sy)].slice(0,12)}));
  console.log(v.padEnd(9), JSON.stringify(r), r.ora===0 && r.movimenti.filter(x=>x>0).length<=1 ? 'OK' : '<-- si è mosso');
}
// ritorno da un gioco
await p.evaluate(()=>SET(1200)); await p.waitForTimeout(400); const y0=await p.evaluate(()=>SC());
await p.evaluate(()=>{ const r=[...document.querySelectorAll('#tbody tr, .x-card')].find(e=>e.getBoundingClientRect().top>200); r.click(); }); await p.waitForTimeout(1500);
await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(800);
console.log('ritorno dal gioco: prima', y0, 'dopo', await p.evaluate(()=>SC()));
// scheda chiusa da sola? apro un gioco subito dopo aver cambiato pagina
await tap('.view-tab[data-view="novita"]'); await p.waitForTimeout(600); await tap('.view-tab[data-view="list"]');
await p.waitForTimeout(30); await p.evaluate(()=>{ const r=document.querySelector('#tbody tr, .x-card'); r.click(); }); await p.waitForTimeout(1200);
console.log('gioco aperto subito dopo il cambio pagina, ancora aperto:', await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show')));
console.log('ERR',errs);await b.close();})();
// v217: «indietro» in ritardo: cambio pagina e apro un gioco nello stesso istante (succede sui telefoni lenti)
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
await p.evaluate(()=>setView('novita')); await p.waitForTimeout(500);
await p.evaluate(()=>{ setView('list'); openModal(GAMES[3]); }); await p.waitForTimeout(1200);
console.log('[ritardo] scheda ancora aperta:', await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show')));
// chiudo una finestra col pulsante mentre sono in una pagina: non devo finire in Classifica
await p.evaluate(()=>setView('novita')); await p.waitForTimeout(500);
await p.evaluate(()=>openModal(GAMES[5])); await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(800);
console.log('[chiusura] pagina dopo aver chiuso il gioco:', await p.evaluate(()=>state.view));
await p.evaluate(()=>history.back()); await p.waitForTimeout(800);
console.log('[indietro vero] pagina:', await p.evaluate(()=>state.view));
await p.evaluate(()=>setView('saga')); await p.waitForTimeout(400); await p.evaluate(()=>openModal(GAMES[7])); await p.waitForTimeout(800);
await p.evaluate(()=>history.back()); await p.waitForTimeout(600);
console.log('[indietro sul gioco] chiuso:', await p.evaluate(()=>!document.getElementById('modalBackdrop').classList.contains('show')), 'pagina:', await p.evaluate(()=>state.view));
await p.evaluate(()=>history.back()); await p.waitForTimeout(600);
console.log('[indietro ancora] pagina:', await p.evaluate(()=>state.view), 'sempre nel programma:', await p.evaluate(()=>typeof GAMES!=='undefined'));
await b.close();})();
