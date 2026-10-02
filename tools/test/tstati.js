// v218: «etichette» sul corpo della pagina (al posto di :has()): si accendono e si spengono con finestre, Chiedi, filtri, avvisi
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const st=()=>p.evaluate(()=>['rt-mopen','rt-gopen','rt-ask','rt-sheet','rt-noteon','rt-filt','rt-empty'].filter(c=>document.body.classList.contains(c)||document.documentElement.classList.contains(c)||document.querySelector('.wrap').classList.contains(c)).join(' ')||'(nessuna)');
console.log('a riposo:', await st());
await p.evaluate(()=>openModal(GAMES[3])); await p.waitForTimeout(700); console.log('scheda gioco aperta:', await st(), '| badge avvisi nascosto:', await p.evaluate(()=>{ const a=document.querySelector('.au-badge'); return !a||getComputedStyle(a).display==='none'; }), '| animali nascosto:', await p.evaluate(()=>{ const a=document.querySelector('.pet-av'); return !a||getComputedStyle(a).display==='none'; }));
await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(700); console.log('scheda chiusa:', await st());
await p.evaluate(()=>openAsk()); await p.waitForTimeout(700); console.log('Chiedi aperto:', await st(), '| tasto Chiedi sopra:', await p.evaluate(()=>getComputedStyle(document.getElementById('viewTabs')).zIndex));
await p.evaluate(()=>document.getElementById('askCloseBtn').click()); await p.waitForTimeout(600); console.log('Chiedi chiuso:', await st());
await p.evaluate(()=>{ document.getElementById('filtersPanel').classList.add('open'); }); await p.waitForTimeout(300); console.log('filtri aperti:', await st());
await p.evaluate(()=>{ document.getElementById('filtersPanel').classList.remove('open'); }); await p.waitForTimeout(300); console.log('filtri chiusi:', await st());
await p.evaluate(()=>{ rtNotify('🔔 prova avviso', ()=>{}); }); await p.waitForTimeout(500); console.log('avviso comparso:', await st());
await p.evaluate(()=>document.querySelector('#rtNote .rn-x').click()); await p.waitForTimeout(500); console.log('avviso chiuso:', await st());
await p.evaluate(()=>{ const s=document.getElementById('search'); s.value='zzzzqqqq'; s.dispatchEvent(new Event('input',{bubbles:true})); }); await p.waitForTimeout(800); console.log('ricerca senza risultati:', await st(), '| tabella nascosta:', await p.evaluate(()=>getComputedStyle(document.getElementById('tableWrap')).display));
console.log('ERR',errs);await b.close();})();
