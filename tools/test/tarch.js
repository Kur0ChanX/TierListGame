// v211: archivio grande (IndexedDB). Uso: NODE_PATH=/opt/node22/lib/node_modules node tools/test/tarch.js
// 600 giochi aggiunti nella memoria vecchia → spostati nell'archivio grande, ricaricati, aggiunta/cancellazione, scheda vecchia che riscrive la memoria vecchia (unione).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
const URL='file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html';
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL); await p.waitForTimeout(2500);
const base = await p.evaluate(()=>GAMES.filter(g=>!g.custom).length);
// semino 600 giochi aggiunti nella memoria VECCHIA (com'era fino alla v210): scrivo direttamente prima che parta il programma
await p.evaluate(()=>{ indexedDB.deleteDatabase('raccoon-tier'); });
await ctx.addInitScript(()=>{
  if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const m={}; const now=Date.now(); for(let i=0;i<600;i++){ m[String(100000+i)]={name:'Gioco aggiunto '+i, plat:'PC', year:'2020', m:'S', score:75, tags:['JRPG'], story:'x'.repeat(900), _u: now-1000}; }
  localStorage.setItem('jrpg_db_customGames', JSON.stringify(m));
});
await p.reload(); await p.waitForTimeout(3500);
const st=()=>p.evaluate(async()=>{ const raw = await new Promise(res=>{ const r=indexedDB.open('raccoon-tier'); r.onsuccess=()=>{ try{ const g=r.result.transaction('kv').objectStore('kv').get('jrpg_db_customGames'); g.onsuccess=()=>{ res(g.result ? JSON.parse(g.result) : null); r.result.close(); }; }catch(e){ res('ERR '+e.message); } }; r.onerror=()=>res('ERR open'); });
  const real = Object.getOwnPropertyDescriptor(window.localStorage.__proto__,'getItem'); 
  let inLS = false; for(let i=0;i<localStorage.length;i++) if(localStorage.key(i)==='jrpg_db_customGames') inLS=true;
  return {custom: GAMES.filter(g=>g.custom).length, archivio: raw && typeof raw==='object' ? Object.keys(raw).length : raw, memoriaVecchia: inLS, ok: rtBig.ok}; });
console.log('base', base, '| dopo il primo avvio:', JSON.stringify(await st()));
await p.reload(); await p.waitForTimeout(3000);
console.log('ricaricato:', JSON.stringify(await st()));
await p.evaluate(()=>{ COVER_DB.doc('customGames/99999').set({name:'Nuovo gioco test', plat:'PS5', year:'2024', m:'S', score:80, tags:['JRPG']}); COVER_DB.doc('customGames/100003').delete(); });
await p.waitForTimeout(400);
await p.reload(); await p.waitForTimeout(3000);
console.log('aggiunto 1 e tolto 1, ricaricato:', JSON.stringify(await st()), await p.evaluate(()=>[!!GAMES.find(g=>g.id===99999), !!GAMES.find(g=>g.id===100003)]));
// una scheda vecchia del browser (v210) scrive ancora nella memoria vecchia: al prossimo avvio si unisce senza perdere nulla
await ctx.addInitScript(()=>{ if(sessionStorage.getItem('old')) return; if(!sessionStorage.getItem('seed')) return; if(!sessionStorage.getItem('phase')){ sessionStorage.setItem('phase','1'); return; } sessionStorage.setItem('old','1'); localStorage.setItem('jrpg_db_customGames', JSON.stringify({'88888':{name:'Dalla scheda vecchia', plat:'PC', year:'2001', m:'S', score:70, tags:['JRPG'], _u: Date.now()}})); });
await p.reload(); await p.waitForTimeout(2500);
await p.reload(); await p.waitForTimeout(3000);
console.log('dopo la scheda vecchia:', JSON.stringify(await st()), 'c\'è il suo gioco:', await p.evaluate(()=>!!GAMES.find(g=>g.id===88888)), 'c\'è ancora il nuovo:', await p.evaluate(()=>!!GAMES.find(g=>g.id===99999)));
console.log('sincronizzazione vede la voce:', await p.evaluate(()=>Object.keys(window.__syncInternals.snapshot()).includes('jrpg_db_customGames')));
console.log('memoria normale usata (KB):', await p.evaluate(()=>Math.round(rtStorageUse().bytes/1024)), '| archivio grande (KB):', await p.evaluate(()=>Math.round(rtBig.info().bytes/1024)));
console.log('ERR',errs);await b.close();})();
