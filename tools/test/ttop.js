// v218: ogni scheda di gioco si apre in alto (nome e locandina in vista), mai a metà
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const pos=()=>p.evaluate(()=>{ const c=document.getElementById('modalCard'), b=document.getElementById('modalBackdrop'); const h=c.querySelector('.modal-head, #coverBlock'); return {card:Math.round(c.scrollTop), backdrop:Math.round(b.scrollTop), cima:h?Math.round(h.getBoundingClientRect().top):null}; });
for(const [id,how] of [[3,'dalla lista'],[8,'altro gioco subito dopo'],[3,'di nuovo il primo']]){
  await p.evaluate(()=>{ const c=document.getElementById('modalCard'); if(c){ c.scrollTop=1400; } });
  await p.evaluate(id=>openModal(GAMES.find(g=>g.id===id)),id); await p.waitForTimeout(1500);
  console.log(how.padEnd(26), JSON.stringify(await pos()));
  await p.evaluate(()=>{ document.getElementById('modalCard').scrollTop=1500; }); await p.waitForTimeout(200);
  await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(700);
}
// tocco su una riga, dopo aver scorso la lista
await p.evaluate(()=>{ document.getElementById('tableWrap').scrollTop=900; }); await p.waitForTimeout(300);
await p.evaluate(()=>{ const r=[...document.querySelectorAll('#tbody tr')].find(e=>e.getBoundingClientRect().top>200); r.click(); }); await p.waitForTimeout(1500);
console.log('da riga a metà lista'.padEnd(26), JSON.stringify(await pos()));
console.log('ERR',errs);await b.close();})();
