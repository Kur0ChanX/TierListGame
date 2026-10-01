// v213: profilo come quello vero (≈1500 giochi con 730 aggiunti, griglia, voti, gusti) su telefono 4× più lento:
// tempo dal tocco al cambio sezione, apertura di un gioco, fluidità dello scorrimento nella scheda. Uso: MODE=grid|table
const {chromium}=require('playwright');const SP=process.env.SP||'/tmp';const MODE=process.env.MODE||'grid';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark',deviceScaleFactor:2.6});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/top-procione-256.webp');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200, contentType:'image/webp', body:IMG}); return r.abort();});
await ctx.addInitScript(MODE=>{ if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const m={}, now=Date.now(); for(let i=0;i<730;i++) m[String(900000+i)]={name:'Gioco aggiunto '+i, plat:'PC / PS5', year:String(1995+i%30), m:i%2?'V':'S', score:60+i%35, tags:[['JRPG','ARPG','TURN','TACT'][i%4]], story:'Trama lunga '.repeat(60), enrich:{storyTag:'epic', hoursMain:20+i%40, pros:['a','b'], cons:['c']}, _u: now};
  localStorage.setItem('jrpg_db_customGames', JSON.stringify(m)); localStorage.setItem('jrpg_view_mode', JSON.stringify(MODE));
  const ids=Object.keys(m).map(Number).slice(0,300); localStorage.setItem('jrpg_top',JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12]));
  const st={}; ids.slice(0,200).forEach((id,i)=>st[id]=i%5?'played':'playing'); localStorage.setItem('jrpg_status',JSON.stringify(st));
  const mv={}; ids.slice(0,80).forEach((id,i)=>mv[id]=5+i%6); localStorage.setItem('jrpg_myvote',JSON.stringify(mv));
  const rx={}; ids.slice(100,160).forEach(id=>rx[id]={like:1,t:now}); localStorage.setItem('jrpg_react',JSON.stringify(rx));
}, MODE);
await p.goto('file://'+(process.env.ROOT||'/home/user/TierListGame').replace(/ /g,'%20')+'/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(12000);
await p.evaluate(()=>{const i=document.getElementById('intro'); if(i) i.remove();});
console.log('giochi', await p.evaluate(()=>GAMES.length), 'modo', MODE);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const frameAfterTap=async(sel)=>{ const bb=await p.locator(sel).first().boundingBox(); await p.evaluate(()=>{window.__t0=0; document.addEventListener('pointerdown',()=>{window.__t0=performance.now();},{capture:true,once:true});});
  await p.touchscreen.tap(bb.x+bb.width/2, bb.y+bb.height/2);
  return p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(Math.round(performance.now()-__t0)))))); };
for(const v of (process.env.SEQ||'discover,list,mytier,list,saga,list,stats,list,novita,list').split(',')){ console.log('sezione', v, await frameAfterTap('.view-tab[data-view="'+v+'"]'),'ms'); await p.waitForTimeout(700); }
// apertura di un gioco
await p.evaluate(()=>{ window.__fr=[]; let l=performance.now(); (function f(n){ __fr.push(n-l); l=n; if(__fr.length<400) requestAnimationFrame(f); })(performance.now()); });
const sel = MODE==='grid' ? '.x-card' : '#tbody tr';
await p.locator(sel).nth(1).scrollIntoViewIfNeeded();
await p.evaluate(()=>{ window.__marks=[]; const m=n=>__marks.push(n+'@'+Math.round(performance.now()-(window.__t0||0))); ['pointerdown','pointerup','click'].forEach(t=>document.addEventListener(t,()=>m(t),true)); const o=window.openModal; window.openModal=function(){ m('openModal'); const r=o.apply(this,arguments); m('openModal fine'); return r; }; new MutationObserver(ms=>ms.forEach(x=>x.addedNodes.forEach(n=>n.classList&&n.classList.contains('rt-ghost')&&m('ghost')))).observe(document.body,{childList:true}); });
if(process.env.SECOND){ await p.evaluate(()=>{ openModal(GAMES[40]); }); await p.waitForTimeout(1500); await p.evaluate(()=>document.getElementById('modalBackdrop').classList.remove('show')); await p.waitForTimeout(800); }
if(process.env.PROFTAP){ const prof=require(process.env.SP+'/prof.js'); const bb=await p.locator(sel+':nth-child(2)').first().boundingBox(); await prof(p,cdp,'0','tocco+2,5s', async()=>{ await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); await p.waitForTimeout(2500); }); }
let t; if(process.env.TRACETAP){ const tr=require(process.env.SP+'/trace.js'); const bb=await p.locator(sel+':nth-child(2)').first().boundingBox(); await tr(p,cdp,null,'tocco gioco',async()=>{ await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); }); t=0; } else t=await frameAfterTap(sel+':nth-child(2)');
await p.waitForTimeout(1200); console.log('tempi:', (await p.evaluate(()=>__marks)).join(' '));
await p.waitForTimeout(1500);
const fr=await p.evaluate(()=>__fr.slice(0,60).map(Math.round));
console.log('apertura gioco: primo fotogramma', t, 'ms | fotogrammi lenti (>50ms) nei primi 60:', fr.filter(x=>x>50).join(','), '| scheda aperta', await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show')));
// scorrimento nella scheda: 40 colpi di rotella, misuro i fotogrammi
await p.evaluate(()=>{ window.__fr=[]; let l=performance.now(); window.__stop=false; (function f(n){ __fr.push(n-l); l=n; if(!__stop) requestAnimationFrame(f); })(performance.now()); });
const evs=[]; if(process.env.TRACESCROLL){ cdp.on('Tracing.dataCollected', d=> evs.push(...d.value)); await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline', transferMode:'ReportEvents'}); }
await p.evaluate(()=>{ window.__errs={}; document.addEventListener('error', e=>{ const t=e.target; const k=(t.tagName||'?')+'.'+t.className+' in '+((t.parentNode&&t.parentNode.className)||'(staccata)')+' conn:'+t.isConnected; __errs[k]=(__errs[k]||0)+1; }, true); });
console.log('gioco aperto:', await p.evaluate(()=>currentModalGame&&currentModalGame.name), 'nodi scheda', await p.evaluate(()=>document.querySelectorAll('#modalCard *').length));
await p.mouse.move(200,500); for(let i=0;i<40;i++){ await p.mouse.wheel(0,120); await p.waitForTimeout(16); }
if(process.env.TRACESCROLL){ const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r)); await cdp.send('Tracing.end'); await done; const sum={}; evs.filter(e=>e.ph==='X'&&e.dur).forEach(e=>{ sum[e.name]=(sum[e.name]||0)+e.dur; }); console.log('scroll trace:', Object.entries(sum).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>Math.round(v/1000)+'ms '+k).join(' | '));
  const fc={}; evs.filter(e=>e.name==='FunctionCall'&&e.dur>3000).forEach(e=>{ const d=e.args&&e.args.data; const k=d?(d.functionName||'')+'@'+String(d.url||'').split('/').pop()+':'+d.lineNumber:'?'; fc[k]=(fc[k]||0)+e.dur; }); const ed={}; evs.filter(e=>e.name==='EventDispatch'&&e.dur).forEach(e=>{ const k=(e.args&&e.args.data&&e.args.data.type)||'?'; ed[k]=(ed[k]||0)+e.dur; }); console.log('eventi:', Object.entries(ed).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>Math.round(v/1000)+'ms '+k).join(' | '));
  console.log('funzioni:', Object.entries(fc).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>Math.round(v/1000)+'ms '+k).join(' | ')); }
await p.waitForTimeout(300);
console.log('errori:', JSON.stringify(await p.evaluate(()=>Object.entries(__errs).sort((a,b)=>b[1]-a[1]).slice(0,6))));
const s=await p.evaluate(()=>{ __stop=true; const a=__fr.slice(2); a.sort((x,y)=>x-y); return {n:a.length, mediana:Math.round(a[a.length>>1]), p95:Math.round(a[Math.floor(a.length*.95)]), max:Math.round(a[a.length-1]), lenti:a.filter(x=>x>34).length}; });
console.log('scorrimento scheda (ms per fotogramma):', JSON.stringify(s));
if(process.env.TRACE){ const tr=require(process.env.SP+'/trace.js'); await p.evaluate(()=>{ document.getElementById('modalBackdrop').classList.remove('show'); setView('list'); }); await p.waitForTimeout(800);
  for(const v of (process.env.TRACE||'discover').split(',')){ await tr(p,cdp,new Function('setView('+JSON.stringify(v)+')'),v); await p.evaluate(()=>setView('list')); await p.waitForTimeout(600); } }
if(process.env.TRACEOPEN){ const tr=require(process.env.SP+'/trace.js'); await p.evaluate(()=>{ document.getElementById('modalBackdrop').classList.remove('show'); }); await p.waitForTimeout(800); await tr(p,cdp,()=>openModal(GAMES[7]),'apri gioco'); }
if(process.env.PROF){ const prof=require(process.env.SP+'/prof.js'); await p.evaluate(()=>{ document.getElementById('modalBackdrop').classList.remove('show'); setView('list'); }); await p.waitForTimeout(800);
  await prof(p,cdp,()=>setView('discover'),'Scopri'); await p.evaluate(()=>setView('list')); await p.waitForTimeout(500);
  await prof(p,cdp,()=>openModal(GAMES[5]),'Apri gioco'); }
console.log('ERR',errs);await b.close();})();
