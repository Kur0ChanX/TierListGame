// v218+: aprendo un gioco, la locandina compare subito con la miniatura della lista (niente riquadro vuoto), poi quella nitida
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg'); let slow=true;
await ctx.route('**/*',async r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image'){ if(!/wsrv/.test(u) && slow) await new Promise(x=>setTimeout(x,900)); return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); } return r.abort();});
await ctx.addInitScript(()=>{ localStorage.setItem('jrpg_view_mode', JSON.stringify('grid')); localStorage.setItem('jrpg_top','[]'); });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(9000);
await p.evaluate(()=>{ GAMES.slice(0,60).forEach(g=>{ g.enrich=g.enrich||{}; g.enrich.coverUrl='https://x.test/c'+g.id+'.jpg'; }); setView('list'); render(); }); await p.waitForTimeout(2500);
const row=await p.evaluate(()=>{ const r=[...document.querySelectorAll('#altView .x-card')].find(e=>{const b=e.getBoundingClientRect(); return b.top>250&&b.bottom<800&&e.querySelector('.x-cover img')}); const b=r.getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2,has:!!r.querySelector('.x-cover img')}; });
console.log('miniatura nella riga:', row.has);
await p.touchscreen.tap(row.x,row.y); await p.waitForTimeout(450);
console.log('coverBlock:', await p.evaluate(()=>{ const c=document.getElementById('coverBlock'); return c? c.innerHTML.slice(0,170):'(assente)'; })); console.log('riga img:', await p.evaluate(()=>{ const r=document.querySelector('#tbody [data-gid] img'); return r? r.src.slice(0,90):''; })); console.log('perché:', await p.evaluate(()=>window.__seedWhy)); console.log('dopo 450 ms: miniatura messa:', await p.evaluate(()=>!!document.querySelector('#modalCard .cv-seed')), '| immagine nitida già pronta:', await p.evaluate(()=>{ const i=document.querySelector('#modalCard img.modal-cover'); return !!(i&&i.complete&&i.naturalWidth); }));
await p.waitForTimeout(2500);
console.log('dopo 3 s: miniatura tolta:', await p.evaluate(()=>!document.querySelector('#modalCard .cv-seed')), '| nitida:', await p.evaluate(()=>{ const i=document.querySelector('#modalCard img.modal-cover'); return !!(i&&i.complete&&i.naturalWidth); }));
console.log('ERR',errs);await b.close();})();
