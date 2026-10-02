// v216: scorrimento nella scheda con la modalità cinema attiva (foto che scorrono sulla locandina), telefono 4× più lento
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark',deviceScaleFactor:2.6});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(6000);
await p.evaluate(()=>{ const g=GAMES.find(x=>x.id===3); COVER_DB.doc('covers/'+g.id).set({url:'https://x.test/ffx.jpg'}); openModal(g); }); await p.waitForTimeout(11000);
console.log('cinema attivo:', await p.evaluate(()=>!!document.querySelector('.hero-shots .hs.on')), '| copertina pronta:', await p.evaluate(()=>!!document.querySelector('img.modal-cover.ld')));
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.env.TH||4)});
const run=async(lbl)=>{ await p.evaluate(()=>{ document.getElementById('modalCard').scrollTop=0; }); await p.waitForTimeout(300);
  await p.evaluate(()=>{ window.__fr=[]; let l=performance.now(); window.__stop=false; (function f(n){ __fr.push(n-l); l=n; if(!__stop) requestAnimationFrame(f); })(performance.now()); });
  await p.mouse.move(200,500); for(let i=0;i<50;i++){ await p.mouse.wheel(0,90); await p.waitForTimeout(16); }
  await p.waitForTimeout(200);
  const s=await p.evaluate(()=>{ __stop=true; const a=__fr.slice(3).sort((x,y)=>x-y); return {n:a.length, mediana:Math.round(a[a.length>>1]), p95:Math.round(a[Math.floor(a.length*.95)]), max:Math.round(a[a.length-1]), lenti:a.filter(x=>x>34).length}; });
  console.log(lbl.padEnd(28), JSON.stringify(s)); };
await run('con cinema');
await p.evaluate(()=>{ document.querySelectorAll('.hero-shots').forEach(h=>h.remove()); }); await run('senza cinema');
console.log('ERR',errs);await b.close();})();
