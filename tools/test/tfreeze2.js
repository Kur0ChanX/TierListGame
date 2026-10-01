// come tfreeze ma con il profilo pesante e la lista «Più adatti a te»: intro, attesa, tocco in alto / su un gioco
const {chromium}=require('playwright');
const WAIT=+process.argv[2]||3000, WHAT=process.argv[3]||'news';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost')) return r.continue(); return r.abort();});
await p.goto('http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(3000);
await p.evaluate(()=>{const ids=GAMES.map(g=>g.id), pick=(n,o)=>ids.slice(o,o+n);
 localStorage.setItem(profileKey('jrpg_favs'),JSON.stringify(pick(45,0)));
 const st={};pick(200,0).forEach((id,i)=>st[id]=i%9===0?'dropped':i%5===0?'playing':'played');localStorage.setItem(profileKey('jrpg_status'),JSON.stringify(st));
 const mt={};pick(150,0).forEach((id,i)=>mt[id]=['S','A','B','C'][i%4]);localStorage.setItem(profileKey('jrpg_mytier'),JSON.stringify(mt));
 const mv={};pick(60,0).forEach((id,i)=>mv[id]=5+(i%6));localStorage.setItem('jrpg_myvote',JSON.stringify(mv));
 localStorage.setItem('jrpg_top',JSON.stringify(pick(12,0)));
 const dw={};pick(25,0).forEach((id,i)=>dw[id]={BUILD:1,LORE:i%2?2:1,EXPLO:-1});localStorage.setItem('jrpg_dna_why',JSON.stringify(dw));
 const rx={};pick(40,100).forEach(id=>rx[id]={like:1,t:Date.now()});localStorage.setItem('jrpg_react',JSON.stringify(rx));
 sessionStorage.clear(); try{ state.sortKey='dna'; saveState&&saveState(); }catch(e){} });
await p.addInitScript(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false}); window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});}catch(e){}});
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.reload(); await p.waitForTimeout(WAIT);
const st=await p.locator('.intro-start').boundingBox().catch(()=>null);
if(st) await p.touchscreen.tap(st.x+st.width/2,st.y+st.height/2);
await p.waitForTimeout(450);
const T=Date.now();
if(WHAT==='news'){ const bb=await p.locator('#changelogBtn').boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); }
else { await p.evaluate(()=>{ const t=document.querySelector('#tbody'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - 200); }); await p.waitForTimeout(300); const bb=await p.locator('#tbody tr').nth(1).boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); }
let opened=''; for(let i=0;i<30&&!opened;i++){ await p.waitForTimeout(100); opened=await p.evaluate(()=>[...document.querySelectorAll('.show')].map(e=>e.id).join(',')); }
console.log('attesa',WAIT,WHAT,'intro vista:',!!st,'→ aperto:',opened||'NIENTE','in',Date.now()-T,'ms | blocchi>200:',await p.evaluate(()=>JSON.stringify(__lt.filter(x=>x[1]>200))),'| ERR',errs.length);
await b.close();})();
