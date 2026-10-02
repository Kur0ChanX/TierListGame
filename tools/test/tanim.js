// v218: i 7 stili di animazione: apertura scheda, cambio sezione, pannelli, righe; «telefono» parte dalla copertina toccata
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const cdp=await ctx.newCDPSession(p);
console.log('stili:', await p.evaluate(()=>rtAnim.STYLES.map(s=>s.id).join(', ')), '| attuale:', await p.evaluate(()=>rtAnim.id()));
for(const id of ['lampo','morbida','zoom','rimbalzo','scivola','cinema','telefono']){
  await p.evaluate(id=>rtAnim.set(id),id); await p.waitForTimeout(200);
  // 1) apertura con un tocco vero su una copertina
  const row=await p.evaluate(()=>{ const r=[...document.querySelectorAll('#tbody tr[data-gid], #tbody [data-gid]')].find(e=>{const b=e.getBoundingClientRect(); return b.top>250&&b.bottom<800}); const b=r.getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2,w:Math.round(b.width),h:Math.round(b.height)}; });
  await p.evaluate(()=>{ window.__S=[]; const t0=performance.now(); const f=()=>{ const c=document.getElementById('modalCard'); if(c){ const r=c.getBoundingClientRect(); __S.push([Math.round(performance.now()-window.__T0),Math.round(r.width),Math.round(r.height),Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)]); } if(performance.now()-t0<700) requestAnimationFrame(f); }; window.__T0=performance.now(); f(); });
  await p.touchscreen.tap(row.x,row.y); await p.waitForTimeout(900);
  const S=await p.evaluate(()=>window.__S.filter((_,i)=>i%3===0).slice(0,9).map(s=>s.join(':')).join(' '));
  const open=await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show'));
  console.log(id.padEnd(9),'scheda aperta:',open,'| tempo:larg:alt:cx:cy →',S.slice(0,150));
  await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(600);
  // 2) sezione + pannello
  const a=await p.evaluate(()=>{ setView('novita'); return document.getAnimations().length; }); await p.waitForTimeout(400);
  await p.evaluate(()=>setView('list')); await p.waitForTimeout(300);
  await p.evaluate(()=>{ XUI.sheet('xProva','Prova','<p>ciao</p>'); }); await p.waitForTimeout(50);
  const sh=await p.evaluate(()=>document.getAnimations().filter(a=>a.animationName&&/anSh/.test(a.animationName)).length);
  console.log('         animazioni attive al cambio sezione:',a,'| pannello (animazione CSS):',sh);
  await p.evaluate(()=>document.getElementById('xProva').classList.remove('show')); await p.waitForTimeout(300);
}
console.log('ERR',errs);await b.close();})();
