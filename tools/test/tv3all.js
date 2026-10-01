// apre la scheda di TUTTI i giochi quando i testi non sono ancora arrivati (solo indice) e poi con i testi: nessun errore ammesso
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return /dati\/testi-/.test(u) && !globalThis.__allow ? r.abort() : r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(2500);
const run=async lbl=>{ const r=await p.evaluate(()=>{const bad=[];for(const g of GAMES){ try{ openModal(g); }catch(e){ bad.push(g.id+': '+e.message); } } try{closeModal();}catch(e){} return bad;}); console.log(lbl,'errori:',r.length, r.slice(0,4).join(' | ')); };
await run('SOLO INDICE (testi bloccati) →');
globalThis.__allow=true; await p.evaluate(()=>rtTexts.ensureAll()); await p.waitForTimeout(500);
console.log('pezzi caricati:',await p.evaluate(()=>rtTexts.loaded()));
await run('CON I TESTI →');
console.log('errori pagina:',errs.length, errs.slice(0,3));await b.close();})();
