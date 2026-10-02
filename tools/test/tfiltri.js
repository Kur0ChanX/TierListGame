// v220: apertura/chiusura del pannello Filtri: quante impaginazioni e quanto lavoro (telefono simulato lento, 1519 giochi)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.6});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
await ctx.addInitScript(()=>{ if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1'); localStorage.setItem('jrpg_view_mode', JSON.stringify('grid')); const m={}; for(let i=0;i<754;i++) m[String(900000+i)]={name:'Gioco aggiunto '+i, plat:'PC / PS5', year:String(1995+i%30), m:i%2?'V':'S', score:60+i%35, tags:[['JRPG','ARPG','TURN','TACT'][i%4]], story:'Trama '.repeat(30)}; localStorage.setItem('jrpg_db_customGames', JSON.stringify(m)); });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(10000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
for(const fase of ['apro','chiudo','apro','chiudo']){
  const ev=[]; cdp.on('Tracing.dataCollected', d=> ev.push(...d.value));
  await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});
  await p.evaluate(()=>document.getElementById('filtersBtn').click()); await p.waitForTimeout(800);
  const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r)); await cdp.send('Tracing.end'); await done; cdp.removeAllListeners('Tracing.dataCollected');
  const L=ev.filter(e=>e.name==='Layout'&&e.dur), S=ev.filter(e=>e.name==='UpdateLayoutTree'&&e.dur);
  const sum=a=>Math.round(a.reduce((x,e)=>x+e.dur,0)/1000);
  console.log('   schede nella griglia:', await p.evaluate(()=>document.querySelectorAll('#altView .x-card').length)); console.log(fase.padEnd(7),'impaginazioni:',String(L.length).padStart(3),'(totale',String(sum(L)).padStart(4),'ms, la più lunga',Math.round(Math.max(0,...L.map(e=>e.dur))/1000),'ms) | stili:',String(S.length).padStart(3),'eventi',sum(S),'ms');
}
console.log('ERR',errs);await b.close();})();
