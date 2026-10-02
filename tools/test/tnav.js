// v216: tempo reale dal tocco alla pagina disegnata per ogni tasto della barra in basso (griglia con copertine vere, profilo pesante)
const {chromium}=require('playwright');const SP=process.env.SP||'/tmp';const MODE=process.env.MODE||'grid';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark',deviceScaleFactor:2.6});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
await ctx.addInitScript(MODE=>{ localStorage.setItem('jrpg_view_mode', JSON.stringify(MODE)); if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const m={}, now=Date.now(); for(let i=0;i<730;i++) m[String(900000+i)]={name:'Gioco aggiunto '+i, plat:'PC / PS5', year:String(1995+i%30), m:i%2?'V':'S', score:60+i%35, tags:[['JRPG','ARPG','TURN','TACT'][i%4]], story:'Trama lunga '.repeat(60), enrich:{storyTag:'epic', hoursMain:20+i%40, coverUrl:'https://x.test/c'+i+'.jpg'}, _u: now};
  localStorage.setItem('jrpg_db_customGames', JSON.stringify(m)); localStorage.setItem('jrpg_top',JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12]));
}, MODE);
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(10000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.env.TH||4)});
await p.evaluate(()=>{ window.__lt=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'}); });
for(const v of (process.env.SEQ||'novita,list,discover,list,stats,list,novita,list').split(',')){
  const bb=await p.locator('.view-tab[data-view="'+v+'"]').boundingBox();
  await p.evaluate(()=>{ window.__T0=0; window.__lt.length=0; document.addEventListener('pointerdown',()=>{ window.__T0=performance.now(); },{capture:true,once:true}); });
  await p.touchscreen.tap(bb.x+bb.width/2, bb.y+bb.height/2);
  const r=await p.evaluate(()=>new Promise(res=>{ requestAnimationFrame(()=>requestAnimationFrame(()=>{ const t=performance.now()-__T0; setTimeout(()=>res({primoDisegno:Math.round(t), blocchi:__lt.map(x=>x[1]).filter(x=>x>50)}), 900); })); }));
  console.log(v.padEnd(9), 'primo disegno', String(r.primoDisegno).padStart(5), 'ms | blocchi >50ms nei 900ms dopo:', r.blocchi.join(',')||'-');
  await p.waitForTimeout(400);
}
if(process.env.PROF){ const prof=require(SP+'/prof.js'); await p.evaluate(()=>setView('novita')); await p.waitForTimeout(800); await prof(p,cdp,()=>setView('list'),'torno alla Classifica'); }
if(process.env.TRACE){ const tr=require(SP+'/trace.js'); await p.evaluate(()=>setView('novita')); await p.waitForTimeout(1500); await tr(p,cdp,()=>setView('list'),'ritorno alla Classifica'); }
if(process.env.REPORT){ await p.waitForTimeout(2500); console.log(await p.evaluate(()=>window.rtSlowReport ? rtSlowReport() : 'nessun rapporto')); }
console.log('ERR',errs);await b.close();})();
