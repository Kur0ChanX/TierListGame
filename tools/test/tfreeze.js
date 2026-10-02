// riproduce: intro col procione, attesa, tocco su «Inizia», poi tocco in alto (News) o su un gioco
const {chromium}=require('playwright');
const WAIT=+process.argv[2]||3000, WHAT=process.argv[3]||'news', OFF=process.argv[4]||'';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark',userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text().slice(0,120))});
await p.addInitScript(off=>{Object.defineProperty(navigator,'webdriver',{get:()=>false}); if(off) localStorage.setItem('jrpg_mod_off',JSON.stringify({[off]:true})); window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});}catch(e){}},OFF);
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost')) return r.continue(); return r.abort();});
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.goto('http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');
await p.waitForTimeout(WAIT);
console.log('intro c\'è:',await p.evaluate(()=>!!document.getElementById('intro')), 'msg:',await p.evaluate(()=>(document.querySelector('.intro-msg')||{}).textContent));
const st=await p.locator('.intro-start').boundingBox().catch(()=>null);
if(st) await p.touchscreen.tap(st.x+st.width/2,st.y+st.height/2); else await p.touchscreen.tap(200,800);
await p.waitForTimeout(500);
const t0=Date.now();
if(WHAT==='news'){ const bb=await p.locator('#changelogBtn').boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); }
else { const bb=await p.locator('#tbody tr').nth(2).boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); }
await p.waitForTimeout(2500);
const top=await p.evaluate(()=>{const e=document.elementFromPoint(200,60);return e?(e.id||e.className||e.tagName).toString().slice(0,40):'-'});
console.log(WHAT,'aperto:',await p.evaluate(()=>[...document.querySelectorAll('.show')].map(e=>e.id||e.className).join(',')||'NIENTE'),'| elemento in alto:',top,'| ghost:',await p.evaluate(()=>!!document.querySelector('.rt-ghost')),'| intro:',await p.evaluate(()=>!!document.getElementById('intro')),'| ready:',await p.evaluate(()=>!!window.__rtReady));
const r=await Promise.race([p.evaluate(()=>1+1),new Promise(r=>setTimeout(()=>r('BLOCCATO'),3000))]); console.log('pagina risponde:',r);
console.log('long>300:',await p.evaluate(()=>JSON.stringify(__lt.filter(x=>x[1]>300))));
console.log('ERR',errs.slice(0,5));await b.close();})();
