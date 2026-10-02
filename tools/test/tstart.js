const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile Safari/537.36'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false}); window.__lt=[]; try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});}catch(e){}});
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost')) return r.continue(); return r.abort();});
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.goto('http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html?intro=force');
for(const t of [1500,3000,6000,10000,16000]){ await p.waitForTimeout(t-(window=0)||0); }
console.log('long tasks:',await p.evaluate(()=>JSON.stringify(__lt.filter(x=>x[1]>120))));
console.log('intro presente:',await p.evaluate(()=>!!document.getElementById('intro')),'intro-on:',await p.evaluate(()=>document.documentElement.classList.contains('intro-on')),'msg:',await p.evaluate(()=>(document.querySelector('.intro-msg')||{}).textContent));
await b.close();})();
