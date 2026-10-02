// v228: gli avvisi della campanella si aprono anche dopo aver riaperto l'app (azione ricavata dal testo)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(6000);
await p.evaluate(()=>{ localStorage.setItem('jrpg_story_auto','off'); const g=GAMES.find(x=>/Final Fantasy X$/.test(x.name))||GAMES[3]; window.__n=g.name; showToast('🌅 Oggi: 1 novità per te', 9000, ()=>{}); showToast('💶 '+g.name+' è in offerta: 9,99 € (−60%)', 9000, ()=>{}); });
await p.reload(); await p.waitForTimeout(6000);
await p.evaluate(()=>rtOpenNotifs()); await p.waitForTimeout(300);
console.log('righe:', await p.evaluate(()=>[...document.querySelectorAll('#xNotifs .rn-row small')].map(x=>x.textContent).join(' | ')));
await p.evaluate(()=>[...document.querySelectorAll('#xNotifs .rn-row')].find(r=>/offerta/.test(r.textContent)).click()); await p.waitForTimeout(900);
console.log('offerta → scheda aperta:', await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show') && document.querySelector('.modal-title').textContent));
await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(700);
await p.evaluate(()=>rtOpenNotifs()); await p.waitForTimeout(300);
await p.evaluate(()=>[...document.querySelectorAll('#xNotifs .rn-row')].find(r=>/novit/.test(r.textContent)).click()); await p.waitForTimeout(900);
console.log('novità → finestra aperta:', await p.evaluate(()=>[...document.querySelectorAll('.x-sheet.show .lp-head b')].map(x=>x.textContent).join(',')));
console.log('ERR',errs);await b.close();})();
