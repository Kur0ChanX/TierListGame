// v227: brano di partenza 📌 + blocco brani, volume nel player in home, Auto home spento = musica ferma chiudendo la scheda
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
await p.evaluate(()=>{ localStorage.setItem('jrpg_story_auto','off'); localStorage.setItem('jrpg_ap_card','"off"'); window.__g=GAMES[5];
  const L=[['ia:https://x/a.mp3','Brano A','1:00'],['ia:https://x/b.mp3','Brano B','2:00'],['ia:https://x/c.mp3','Brano C','3:00']];
  const u=JSON.parse(localStorage.getItem('rt_ost_user')||'{}'); u[__g.id]=L; localStorage.setItem('rt_ost_user',JSON.stringify(u));
  HTMLMediaElement.prototype.play=function(){ this.dispatchEvent(new Event('playing')); return Promise.resolve(); }; HTMLMediaElement.prototype.pause=function(){ window.__paused=(window.__paused||0)+1; };
  openModal(__g); });
await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="play"]').click()); await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="list"]').click()); await p.waitForTimeout(100);
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="first"][data-i="2"]').click()); await p.waitForTimeout(200);
console.log('primo brano salvato:', await p.evaluate(()=>JSON.parse(localStorage.getItem('jrpg_ost_first'))[__g.id]));
await p.reload(); await p.waitForTimeout(6500);
await p.evaluate(()=>{ window.__g=GAMES[5]; HTMLMediaElement.prototype.play=function(){ (window.__srcs=window.__srcs||[]).push(this.src); this.dispatchEvent(new Event('playing')); return Promise.resolve(); }; HTMLMediaElement.prototype.pause=function(){ window.__paused=(window.__paused||0)+1; }; openModal(__g); }); await p.waitForTimeout(700);
await p.evaluate(()=>document.querySelector('#mzBar [data-mz="play"]').click()); await p.waitForTimeout(400);
console.log('riparte da:', await p.evaluate(()=>window.__srcs[0]), await p.evaluate(()=>[localStorage.getItem('jrpg_ost_first'), localStorage.getItem('jrpg_music_pick')]));
// Auto home spento → chiudendo si ferma
await p.evaluate(()=>{ localStorage.setItem('jrpg_ap_home','"off"'); window.__paused=0; document.getElementById('modalCloseBtn').click(); }); await p.waitForTimeout(700);
await p.waitForTimeout(300); console.log('Auto home spento → fermata alla chiusura:', await p.evaluate(()=>window.__paused>0));
// volume in home
await p.evaluate(()=>document.querySelector('#rtMusic [data-m="vol"]').click()); await p.waitForTimeout(100);
console.log('volume in home:', await p.evaluate(()=>!!document.querySelector('#rtMusic .mz2-vol') && !document.querySelector('#rtMusic .rm-vol').hidden));
// sblocca brani
await p.evaluate(()=>openModal(__g)); await p.waitForTimeout(600);
await p.evaluate(()=>{ document.querySelector('#mzBar [data-mz="more"]').click(); document.querySelector('#mzBar [data-mz="ulock"]').click(); });
console.log('sbloccati:', await p.evaluate(()=>!JSON.parse(localStorage.getItem('rt_ost_user'))[__g.id] && !JSON.parse(localStorage.getItem('jrpg_ost_first'))[__g.id]));
console.log('ERR',errs);await b.close();})();
