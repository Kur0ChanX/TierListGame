// v233: riga «Ordina» nelle viste a copertine/schede (Nel cuore → preferiti → altri), procione accanto alla stella, freccette ▲▼ intere
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.addInitScript(()=>{ try{ localStorage.setItem('jrpg_view_mode','"grid"'); localStorage.setItem('jrpg_story_auto','off'); }catch(e){} });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
await p.evaluate(()=>{ const ids=GAMES.slice(40,43).map(g=>g.id); localStorage.setItem('jrpg_top', JSON.stringify(ids)); window.__ids=ids; });
console.log('riga ordina visibile:', await p.evaluate(()=>getComputedStyle(document.getElementById('altSort')).display!=='none'), '| tasti:', await p.evaluate(()=>document.querySelectorAll('#altSort .as-c').length));
await p.evaluate(()=>document.querySelector('#altSort [data-sk="heart"]').click()); await p.waitForTimeout(500);
console.log('primi 3 = Nel cuore:', await p.evaluate(()=>[...document.querySelectorAll('#altView [data-id]')].slice(0,3).map(e=>+e.dataset.id).every(id=>__ids.includes(id))));
await p.screenshot({path: process.argv[2]+'/s233a.png', clip:{x:0,y:0,width:412,height:700}});
await p.evaluate(()=>document.querySelector('#altSort [data-sk="id"]').click());
await p.evaluate(()=>openModal(GAMES[2])); await p.waitForTimeout(1200);
console.log('freccette dentro i riquadri:', await p.evaluate(()=>[...document.querySelectorAll('#modalCard .cd-mv button')].filter(b=>b.offsetParent).slice(0,6).every(b=>{ const r=b.getBoundingClientRect(), pr=b.closest('#modalCard > *').getBoundingClientRect(); return r.top>=pr.top-0.5 && r.bottom<=pr.bottom+0.5; })));
console.log('ERR',errs); await b.close();})();
