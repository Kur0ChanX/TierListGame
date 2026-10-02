// v218: quanto lavoro (ms) fa il programma all'apertura di un gioco e quanti fotogrammi saltano subito dopo (telefono simulato più lento)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.6});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(9000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.env.TH||4)});
for(const id of [3,50,200,400]){
  const r=await p.evaluate(id=>new Promise(res=>{
    const fr=[]; let last=performance.now(), run=true; const tick=t=>{ if(!run) return; fr.push(Math.round(t-last)); last=t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    var T0=0; const lt=[]; const po=new PerformanceObserver(l=>l.getEntries().forEach(e=>lt.push(Math.round(e.startTime-T0)+'+'+Math.round(e.duration)))); po.observe({type:'longtask'});
    var T0=performance.now(); const t0=T0; openModal(GAMES[id]); const sync=Math.round(performance.now()-t0);
    setTimeout(()=>{ run=false; po.disconnect(); const slow=fr.filter(x=>x>34); res({sync, lunghi:lt, fotogrammiLenti:slow.length, peggiore:Math.max(...fr)}); },900);
  }),id);
  console.log('gioco',id,JSON.stringify(r));
  await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(700);
}
console.log('ERR',errs);await b.close();})();
