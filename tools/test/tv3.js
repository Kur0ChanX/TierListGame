// Formato dati v3: (1) i tratti dall'indice = tratti dai testi completi, per TUTTI i giochi; (2) scheda aperta subito → la trama arriva da sola;
// (3) la sintonia non cambia quando arrivano i testi; (4) i testi arrivano in sottofondo
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.addInitScript(()=>{ localStorage.setItem('jrpg_favs',JSON.stringify([2,3,5,6,32])); localStorage.setItem('jrpg_status',JSON.stringify({2:'played',3:'played',31:'played'})); });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(1200);
console.log('testi caricati all\'avvio (pezzi):',await p.evaluate(()=>rtTexts.loaded()),'| FF X ha la trama?',await p.evaluate(()=>!!GAMES.find(g=>g.id===2).story));
const lite=await p.evaluate(()=>{const o={};GAMES.forEach(g=>o[g.id]=rtMechOf(g).slice().sort().join(','));return o;});
const sint0=await p.evaluate(()=>{const o={};GAMES.slice(0,120).forEach(g=>{const s=rtSintonia(g);o[g.id]=s?s.pct:null});return o;});
// apro una scheda subito, prima che arrivino i testi del suo pezzo
await p.evaluate(()=>openModal(GAMES.find(g=>g.id===700)));
console.log('scheda aperta: trama subito?',await p.evaluate(()=>/senza spoiler/.test(document.getElementById('modalCard').textContent) && !!GAMES.find(g=>g.id===700).story));
await p.waitForTimeout(800);
console.log('…dopo 0,8 s: trama nella scheda?',await p.evaluate(()=>{const s=GAMES.find(g=>g.id===700).story;return !!s && document.getElementById('modalCard').textContent.includes(s.slice(0,40));}));
await p.evaluate(()=>closeModal());
await p.evaluate(()=>rtTexts.ensureAll()); await p.waitForTimeout(300);
console.log('dopo ensureAll pezzi:',await p.evaluate(()=>rtTexts.loaded()),'| testi lite rimasti:',await p.evaluate(()=>GAMES.filter(g=>g.enrich&&g.enrich._lite).length));
const full=await p.evaluate(()=>{const o={};GAMES.forEach(g=>o[g.id]=rtMechOf(g).slice().sort().join(','));return o;});
const diff=Object.keys(lite).filter(id=>lite[id]!==full[id]);
console.log('tratti diversi tra indice e testi completi:',diff.length, diff.slice(0,3).map(id=>id+': '+lite[id]+' ≠ '+full[id]).join(' | '));
const sint1=await p.evaluate(()=>{const o={};GAMES.slice(0,120).forEach(g=>{const s=rtSintonia(g);o[g.id]=s?s.pct:null});return o;});
const sd=Object.keys(sint0).filter(id=>sint0[id]!==sint1[id]);
console.log('sintonia cambiata dopo i testi:',sd.length,sd.slice(0,3).map(id=>id+':'+sint0[id]+'→'+sint1[id]).join(' '));
console.log('ERR',errs.slice(0,3));await b.close();})();
