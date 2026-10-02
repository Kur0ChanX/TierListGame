// v218: il carosello parte anche per un vecchio gioco senza foto Steam/RAWG (Suikoden V, id 45): schermata + titolo da Libretro
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg'); const asked=[];
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue();
  if(/thumbnails\.libretro\.com/.test(u)){ asked.push(decodeURIComponent(u.split('libretro.com/')[1])); if(/Suikoden V \(USA\)\.png$/.test(decodeURIComponent(u))&&/Named_(Snaps|Titles)/.test(u)) return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.fulfill({status:404,body:''}); }
  return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
await p.evaluate(()=>openModal(GAMES.find(g=>g.id===45))); await p.waitForTimeout(14000);
console.log('gioco:', await p.evaluate(()=>currentModalGame.name), '| segmenti carosello:', await p.evaluate(()=>document.querySelectorAll('.hero-bar i').length), '| in riproduzione:', await p.evaluate(()=>!!document.querySelector('.cover-frame.hero-play')));
console.log('salvate:', await p.evaluate(()=>localStorage.getItem('rt_shots_lr')));
console.log('richieste Libretro (prime 3):', asked.slice(0,3));
console.log('ERR',errs);await b.close();})();
