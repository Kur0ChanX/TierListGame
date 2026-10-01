const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{const g=GAMES.find(g=>g.name==='Final Fantasy X');localStorage.setItem('jrpg_dna_why',JSON.stringify({[g.id]:{BUILD:1,LORE:1}}));openModal(g);}); await p.waitForTimeout(1500);
// DNA: scroll stays
await p.evaluate(()=>{const c=document.getElementById('modalCard');document.getElementById('dnaWhy').scrollIntoView();});await p.waitForTimeout(300);
const y0=await p.evaluate(()=>document.getElementById('modalCard').scrollTop);
await p.evaluate(()=>document.querySelector('#dnaWhy [data-dna]').click()); await p.waitForTimeout(900);
const y1=await p.evaluate(()=>document.getElementById('modalCard').scrollTop);
console.log('scroll prima/dopo clic tratto:',Math.round(y0),Math.round(y1),'chip on:',await p.evaluate(()=>document.querySelector('#dnaWhy [data-dna]').className));
// ratings
await p.evaluate(()=>{const r=document.getElementById('rtRate');r.open=true;});
await p.evaluate(()=>{document.querySelector('#rtRate [data-k="story"] [data-n="9"]').click();document.querySelector('#rtRate [data-k="story"] .rr-half').click();document.querySelector('#rtRate [data-k="combat"] [data-n="7"]').click();});
console.log('bozza:',await p.evaluate(()=>document.getElementById('rrState').textContent),'storage:',await p.evaluate(()=>localStorage.getItem('jrpg_rate')));
await p.evaluate(()=>document.getElementById('rrDone').click());await p.waitForTimeout(300);
console.log('dopo Fine:',await p.evaluate(()=>document.getElementById('rrState').textContent),await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('jrpg_rate'))[GAMES.find(g=>g.name==='Final Fantasy X').id].v)));
// reorder
await p.evaluate(()=>document.querySelector('.cd-reorder').click());await p.waitForTimeout(300);
console.log('righe riordino:',await p.evaluate(()=>[...document.querySelectorAll('#roList .ro-row span')].map(x=>x.textContent).join(' | ')));
await p.evaluate(()=>document.querySelectorAll('#roList [data-mv$=":end"]')[0].click());await p.waitForTimeout(300);
console.log('dopo "in fondo" al 1°:',await p.evaluate(()=>[...document.querySelectorAll('#roList .ro-row span')].map(x=>x.textContent).join(' | ')));
await p.evaluate(()=>document.getElementById('xReorder').classList.remove('show')); await p.waitForTimeout(300);
console.log('ordine scheda perme:',await p.evaluate(()=>[...document.querySelectorAll('#modalCard > [data-tab="perme"]')].filter(e=>e.classList.contains('modal-section-title')||e.id).map(e=>e.id||e.textContent.trim().slice(0,14)).join(' | ')));
console.log('pin rimasti:',await p.evaluate(()=>document.querySelectorAll('.cd-pin').length));
// chip highlights
await p.evaluate(()=>document.querySelector('.cd-tabs [data-ctab="gioco"]').click());await p.waitForTimeout(300);
await p.evaluate(()=>{const h=document.querySelector('.enrich-highlights');h&&h.scrollIntoView({block:'center'})});await p.waitForTimeout(300);
console.log('hl2:',await p.evaluate(()=>!!document.querySelector('.hl-card')));
await p.screenshot({path:(process.env.SP||'/tmp')+'/h205-hl.png'});
console.log('ERR',errs);await b.close();})();
