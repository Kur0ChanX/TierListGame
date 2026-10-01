const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(9000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>{window.__fr=[];window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});
 let last=performance.now();const f=t=>{__fr.push(Math.round(t-last));last=t;if(__fr.length<400)requestAnimationFrame(f)};requestAnimationFrame(f);});
const run=async(lbl,fn)=>{await p.evaluate(()=>{__fr.length=0;__lt.length=0;window.__t0=performance.now()});await fn();await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>({lt:__lt.filter(x=>x[0]>__t0).map(x=>x[1]),bad:__fr.filter(x=>x>34).length,max:Math.max(...__fr),n:__fr.length}));console.log(lbl,JSON.stringify(r));};
for(let i=0;i<2;i++){
await run("apri",()=>p.evaluate(i=>{const tr=document.querySelectorAll("#tbody tr")[3+i*2]; (tr.querySelector("td:nth-child(2)")||tr).click();},i));
await run('chiudi',()=>p.evaluate(()=>{const x=document.querySelector('#modalClose,[data-close-modal],.modal-close');x?x.click():history.back();}));
}
console.log('ERR',errs);await b.close();})();
