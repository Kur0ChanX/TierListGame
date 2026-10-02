// v216: costo di UNA correzione di Update+ su un gioco aggiunto (profilo con 730 giochi aggiunti), sul telefono simulato 4× più lento
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await ctx.addInitScript(()=>{ if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const m={}, now=Date.now(); for(let i=0;i<730;i++) m[String(900000+i)]={name:'Gioco aggiunto '+i, plat:'PC / PS5', year:String(1995+i%30), m:i%2?'V':'S', score:60+i%35, tags:['JRPG'], story:'Trama lunga e dettagliata del gioco con tanti particolari. '.repeat(25), pros:['a lungo pro '.repeat(5),'b'], cons:['c contro '.repeat(5)], enrich:{storyTag:'epic', hoursMain:20+i%40, whyLikeIt:'perché '.repeat(40), pros:['x'], cons:['y']}, _u: now};
  localStorage.setItem('jrpg_db_customGames', JSON.stringify(m)); const au={}; for(let i=0;i<1400;i++) au[i]={t:new Date().toISOString(), ch:[], deep:true, src:[{title:'Fonte '.repeat(10), uri:'https://example.com/'+'x'.repeat(80)}]}; localStorage.setItem('jrpg_audit', JSON.stringify(au)); });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
console.log('dimensioni (MB): giochi aggiunti', await p.evaluate(()=>(localStorage.getItem('jrpg_db_customGames').length/1e6).toFixed(2)), '| audit', await p.evaluate(()=>(localStorage.getItem('jrpg_audit').length/1e6).toFixed(2)));
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>{ window.__lt=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(Math.round(e.duration)))).observe({type:'longtask'}); });
for(let k=0;k<3;k++){
  const r=await p.evaluate(async k=>{ const g=GAMES.find(x=>x.id===900000+k*7); __lt.length=0; const t0=performance.now(); await rtApplyPatch(g,{tags:['JRPG','TURN'], score: 70+k},true); const t1=performance.now(); await new Promise(r=>setTimeout(r,1500)); return {applyPatch: Math.round(t1-t0), blocchi: __lt.slice()}; }, k);
  console.log('correzione', k+1, JSON.stringify(r));
}
if(process.env.PROF){ const prof=require(process.env.SP+'/prof.js'); await prof(p,cdp,null,'una correzione + 1,5 s',async()=>{ await p.evaluate(async()=>{ const g=GAMES.find(x=>x.id===900050); await rtApplyPatch(g,{tags:['JRPG','TACT'], score: 77},true); await new Promise(r=>setTimeout(r,1500)); }); }); }
const r2=await p.evaluate(async()=>{ __lt.length=0; const t0=performance.now(); const a=JSON.parse(localStorage.getItem('jrpg_audit')); a[5].t=new Date().toISOString(); localStorage.setItem('jrpg_audit', JSON.stringify(a)); const t1=performance.now(); await new Promise(r=>setTimeout(r,800)); return {salvaAudit: Math.round(t1-t0), blocchi: __lt.slice()}; });
console.log('salvataggio audit', JSON.stringify(r2));
console.log('ERR',errs);await b.close();})();
