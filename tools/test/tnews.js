const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost')) return r.continue(); return r.abort();});
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.goto('http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html',{waitUntil:'commit'});
let last=0;
for(const ms of [300]){ await p.waitForTimeout(ms-last); last=ms;
 const r=await p.evaluate(()=>{const b=document.getElementById('changelogBtn');if(!b)return 'nobtn';const before=document.querySelectorAll('.show').length;b.click();return 'click'});
 await p.waitForTimeout(5000); console.log('t='+ms,r,'aperto:',await p.evaluate(()=>[...document.querySelectorAll('.show')].map(e=>e.id||e.className).join(',')));
 await p.evaluate(()=>document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'))); }
console.log('ERR',errs.slice(0,3));await b.close();})();
