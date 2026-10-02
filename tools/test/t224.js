// v224: velocità animazioni, anteprima, barra generi con «Tutti» per primo e pin, player compatto + volume bloccabile, voce che abbassa la musica
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
// barra generi
console.log('ordine barra:', await p.evaluate(()=>[...document.querySelectorAll('#listBar .list-chip')].map(c=>c.textContent.replace(/\s+/g,' ').trim().replace(/ \d+$/,'')).join(' | ')));
await p.evaluate(()=>{ saveListPins(['horror'].filter(c=>TAG_INFO[c])); renderListBar(); });
console.log('con pin:', await p.evaluate(()=>[...document.querySelectorAll('#listBar .list-chip')].map(c=>c.textContent.replace(/\s+/g,' ').trim().replace(/ \d+$/,'')).join(' | ')));
await p.evaluate(()=>{ saveListPins(null); renderListBar(); });
// velocità
await p.evaluate(()=>{ rtAnim.setSpeed('card',.5); rtAnim.setSpeed('ui',1.25); });
console.log('--spd', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--spd')), '--spd2', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--spd2')));
console.log('durata fade con .5×:', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--an-fade')));
await p.evaluate(()=>{ rtAnim.setSpeed('card',1); rtAnim.setSpeed('ui',1); });
// impostazioni anteprima
await p.evaluate(()=>window.XMENU.find(x=>/Movimento/.test(x.html)).run()); await p.waitForTimeout(400);
await p.tap('[data-an="cinema"]'); await p.waitForTimeout(80);
console.log('anteprima animata:', await p.evaluate(()=>document.getElementById('anDemo').getAnimations().length), '| velocità tasti:', await p.evaluate(()=>document.querySelectorAll('.an-sp').length));
await p.tap('.an-spd[data-k="card"] .an-sp[data-v="0.5"]'); await p.waitForTimeout(80);
console.log('velocità scheda salvata:', await p.evaluate(()=>localStorage.getItem('jrpg_anim_speed')));
await p.evaluate(()=>{rtAnim.setSpeed('card',1); rtAnim.set('zoom'); document.querySelector('#xMotion').classList.remove('show'); document.querySelector('#xMotion').remove();});
// scheda + player compatto
await p.evaluate(()=>{ window.__g=GAMES.find(x=>x.story)||GAMES[3]; openModal(__g); }); await p.waitForTimeout(900);
console.log('player altezza:', await p.evaluate(()=>Math.round(document.getElementById('mzBar').getBoundingClientRect().height)), '| ⋯ chiuso:', await p.evaluate(()=>document.querySelector('.mz2-more').hidden));
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="more"]').click());
console.log('⋯ aperto:', await p.evaluate(()=>!document.querySelector('.mz2-more').hidden));
await p.evaluate(()=>{ const r=document.querySelector('.mz2-vol'); r.value=35; r.dispatchEvent(new Event('input',{bubbles:true})); r.dispatchEvent(new Event('change',{bubbles:true})); });
console.log('volume:', await p.evaluate(()=>[localStorage.getItem('jrpg_music_vol'), localStorage.getItem('jrpg_music_vol_lock'), document.querySelector('.mz2-vol').disabled, rtMusic.vol()]));
await p.evaluate(()=>document.querySelector('[data-mz="vlock"]').click());
console.log('sbloccato:', await p.evaluate(()=>[localStorage.getItem('jrpg_music_vol_lock'), document.querySelector('.mz2-vol').disabled]));
console.log('ERR',errs);await b.close();})();
