// v218: tasto «Auto» (auto play) separato: nella scheda del gioco e nel player in home
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const ls=k=>p.evaluate(k=>localStorage.getItem(k),k);
await p.evaluate(()=>openModal(GAMES[3])); await p.waitForTimeout(1200);
console.log('bottone Auto nella scheda:', await p.evaluate(()=>!!document.querySelector('#mzBar [data-mz="ap"]')), '| stato iniziale acceso:', await p.evaluate(()=>document.querySelector('#mzBar [data-mz="ap"]').classList.contains('on')));
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="ap"]').click()); await p.waitForTimeout(300);
console.log('dopo un tocco → memoria scheda:', await ls('jrpg_ap_card'), '| acceso:', await p.evaluate(()=>document.querySelector('#mzBar [data-mz="ap"]').classList.contains('on')), '| player home toccato?', await ls('jrpg_ap_home'));
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="ap"]').click()); await p.waitForTimeout(300);
console.log('secondo tocco → memoria scheda:', await ls('jrpg_ap_card'));
await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(500);
await p.evaluate(()=>rtMusic.dock()); await p.waitForTimeout(300);
console.log('bottone Auto nel player home:', await p.evaluate(()=>!!document.querySelector('#rtMusic [data-m="ap"]')), '| acceso di base:', await p.evaluate(()=>document.querySelector('#rtMusic [data-m="ap"]').classList.contains('on')));
await p.evaluate(()=>document.querySelector('#rtMusic [data-m="ap"]').click()); await p.waitForTimeout(300);
console.log('dopo un tocco → memoria home:', await ls('jrpg_ap_home'), '| acceso:', await p.evaluate(()=>document.querySelector('#rtMusic [data-m="ap"]').classList.contains('on')), '| scheda intatta:', await ls('jrpg_ap_card'));
console.log('ERR',errs);await b.close();})();
