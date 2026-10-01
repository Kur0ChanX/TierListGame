// v213: previsione con voto subito disponibile, frecce ▲▼ sui riquadri, stemma piccolo nella griglia
const {chromium}=require('playwright');const SP=process.env.SP||'/tmp';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(5000);
await p.evaluate(()=>{const i=document.getElementById('intro'); if(i) i.remove(); localStorage.setItem('jrpg_top',JSON.stringify([GAMES[1].id,GAMES[3].id]));});
const g=await p.evaluate(()=>{ const g=GAMES.find(x=>!STATUSES[x.id] && x.id>20); openModal(g); return g.name; }); await p.waitForTimeout(1200);
console.log('gioco nuovo:', g, '| previsione:', await p.evaluate(()=>(document.querySelector('.pv-top')||{}).textContent), '| pulsanti voto:', await p.evaluate(()=>document.querySelectorAll('.pv-v').length));
const before=await p.evaluate(()=>document.querySelector('.pv-top').textContent);
await p.evaluate(()=>document.querySelector('.pv-v[data-vote="9"]').click()); await p.waitForTimeout(800);
console.log('dopo il voto 9:', await p.evaluate(()=>[document.querySelector('.pv-top').textContent, (document.querySelector('.pv-res')||{}).textContent].join(' | ')));
// frecce
const st=await p.evaluate(()=>{ const t=[...document.querySelectorAll('#modalCard > .modal-section-title, #modalCard > .cd-mvrow')].filter(x=>x.querySelector('.cd-mv')&&x.offsetParent); return t.map(x=>x.textContent.replace('▲▼','').trim().slice(0,18)); });
console.log('riquadri con frecce:', st.length, st.slice(0,4).join(' / '));
const moved=await p.evaluate(()=>{ const t=[...document.querySelectorAll('#modalCard > .modal-section-title, #modalCard > .cd-mvrow')].filter(x=>x.querySelector('.cd-mv')&&x.offsetParent); const second=t[1]; const name=second.textContent; second.querySelector('[data-cmv="up"]').click(); const t2=[...document.querySelectorAll('#modalCard > .modal-section-title, #modalCard > .cd-mvrow')].filter(x=>x.querySelector('.cd-mv')&&x.offsetParent); return [name.slice(0,18), t2[0].textContent.slice(0,18)]; });
console.log('sposto su il 2°:', moved[0], '→ ora primo:', moved[1]); console.log(await p.evaluate(()=>JSON.stringify([window.__rtTabOrder.perme, localStorage.getItem('jrpg_card_order2')])));
await p.evaluate(()=>document.querySelector('.cd-mvrow').scrollIntoView()); await p.screenshot({path:SP+'/c-arrows.png'});
await p.evaluate(()=>{ localStorage.removeItem('jrpg_card_order2'); document.getElementById('modalBackdrop').classList.remove('show'); document.querySelector('[data-x-mode="grid"]').click(); }); await p.waitForTimeout(800);
console.log('stemma griglia (px):', await p.evaluate(()=>{ const i=document.querySelector('.x-top'); const r=i&&i.getBoundingClientRect(); return r?[Math.round(r.width),Math.round(r.height)]:null; }));
await p.screenshot({path:SP+'/c-grid.png'});
console.log('ERR',errs);await b.close();})();
