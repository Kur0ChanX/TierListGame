// Prova con il catalogo finto di 20.000 giochi (creato da make-big.js): avvio, memoria, lista, ricerca, apertura scheda, ordine «Più adatti a te»
// Uso: node tools/test/tbig.js /cartella/del/catalogo/finto [cpu=4]
const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const BIG=process.argv[2], CPU=+process.argv[3]||4;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--enable-precise-memory-info']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); const m=/\/(giochi\.js|dati\/testi-\d+\.js)(\?|$)/.exec(u); if(m && BIG && fs.existsSync(path.join(BIG,m[1]))) return r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(BIG,m[1]))}); if(u.startsWith('http://localhost')) return r.continue(); return r.abort();});
await p.addInitScript(()=>{window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});}catch(e){}});
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:CPU});
const T0=Date.now(); await p.goto('http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html',{waitUntil:'commit'});
let tl=0; for(let i=0;i<600;i++){ await p.waitForTimeout(100); if(await p.evaluate(()=>document.querySelectorAll('#tbody tr').length>5).catch(()=>false)){ tl=Date.now()-T0; break; } }
console.log('ERR iniziali',errs.slice(0,3)); console.log('giochi:',await p.evaluate(()=>typeof GAMES!=='undefined'?GAMES.length:'NON CARICATI'),'| lista visibile dopo',tl,'ms');
await p.waitForTimeout(12000);
console.log('giochi ora:',await p.evaluate(()=>typeof GAMES!=='undefined'?GAMES.length:'?')); console.log('dettagli pronti:',await p.evaluate(()=>typeof detailsReady==='function'&&detailsReady()),'| memoria JS (MB):',await p.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):'?'));
console.log('blocchi >300ms nei primi 13 s:',await p.evaluate(()=>JSON.stringify(__lt.filter(x=>x[1]>300))));
const time=async(lbl,fn)=>{ await p.evaluate(()=>{__lt.length=0}); const t=Date.now(); await p.evaluate(fn); await p.waitForTimeout(600); console.log(lbl, (Date.now()-t-600)+'ms', 'blocco max', await p.evaluate(()=>Math.max(0,...__lt.map(x=>x[1])))); };
await time('ricerca «fantasy»',()=>{const s=document.getElementById('search'); s.value='fantasy'; s.dispatchEvent(new Event('input',{bubbles:true}));});
await time('ricerca vuota',()=>{const s=document.getElementById('search'); s.value=''; s.dispatchEvent(new Event('input',{bubbles:true}));});
await time('apri scheda',()=>openModal(GAMES[12345]||GAMES[100]));
await time('chiudi scheda',()=>closeModal());
await time('ordina «Più adatti a te»',()=>{ state.sortKey='dna'; render(); });
await time('ordina per voto',()=>{ state.sortKey='score'; render(); });
console.log('ERR',errs.slice(0,3));await b.close();})();
