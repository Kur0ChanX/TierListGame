// v219: con la griglia la tabella nascosta non si costruisce; tornando alla tabella (e alla Classifica) compare giusta
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const n=()=>p.evaluate(()=>({righe:document.querySelectorAll('#tbody tr').length, schede:document.querySelectorAll('#altView .x-card, #altView .x-row').length, tabella:getComputedStyle(document.getElementById('tableWrap')).display, alt:getComputedStyle(document.getElementById('altView')).display}));
console.log('tabella (di base):', JSON.stringify(await n()));
await p.evaluate(()=>document.querySelector('[data-x-mode="grid"]').click()); await p.waitForTimeout(800); console.log('griglia:', JSON.stringify(await n()));
await p.evaluate(()=>setView('stats')); await p.waitForTimeout(400); await p.evaluate(()=>setView('list')); await p.waitForTimeout(800); console.log('griglia dopo Statistiche→Classifica:', JSON.stringify(await n()));
await p.evaluate(()=>document.querySelector('[data-x-mode="table"]').click()); await p.waitForTimeout(800); console.log('di nuovo tabella:', JSON.stringify(await n()));
await p.evaluate(()=>{ const s=document.getElementById('search'); s.value='final'; s.dispatchEvent(new Event('input',{bubbles:true})); }); await p.waitForTimeout(800); console.log('tabella con ricerca «final»:', JSON.stringify(await n()));
await p.evaluate(()=>document.querySelector('[data-x-mode="grid"]').click()); await p.waitForTimeout(800); console.log('griglia con ricerca:', JSON.stringify(await n()));
await p.evaluate(()=>{ const f=document.querySelector('#tbody tr'); }); 
console.log('ERR',errs);await b.close();})();
