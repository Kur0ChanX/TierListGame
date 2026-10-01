const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const PNG=require('fs').readFileSync('/home/user/TierListGame/icons/icon-192.png');let n=0;
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue();
 if(u.includes('youtube.com/results')){ n++; const vids=Array.from({length:8},(_,i)=>({videoRenderer:{videoId:'v'+n+'x'+i,title:{runs:[{text:(i%2?'DRAGON QUEST 11 S - Gameplay Part ':'Final Fantasy X gameplay ')+i}]},lengthText:{simpleText:'10:00'}}}));
   return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'text/html'},body:'<script>var ytInitialData = '+JSON.stringify({contents:vids})+';</script>'});}
 if(u.includes('storesearch')) return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({items:[{id:1295510,name:"DRAGON QUEST XI S: Echi di un'era perduta – Edizione definitiva"}]})});
 if(u.includes('appdetails')) return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({1295510:{success:true,data:{name:'DRAGON QUEST® XI S: Echoes of an Elusive Age™ - Definitive Edition',screenshots:[{path_thumbnail:'https://x.test/a.jpg',path_full:'https://x.test/A.jpg'}]}}})});
 if(u.includes('ytimg')||u.includes('x.test')) return r.fulfill({status:200,contentType:'image/png',body:PNG});
 return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(3500);
console.log('en:', await p.evaluate(async()=>SearchHub.enName(GAMES.find(g=>g.id===10))));
await p.evaluate(()=>openModal(GAMES.find(g=>g.id===10))); await p.waitForTimeout(800);
await p.evaluate(()=>{document.querySelector('.cv-menu-btn').click(); document.querySelector('[data-cvm="shots"]').click();}); await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelector('#shCur [data-s="0"]').click()); await p.waitForTimeout(3000);
console.log('alt:', await p.evaluate(()=>document.querySelectorAll('#shAlt [data-a]').length+' '+document.querySelector('#shAlt').textContent.slice(0,80)));
for(let i=0;i<3;i++){ await p.evaluate(()=>document.querySelector('#shMore').click()); await p.waitForTimeout(2500); console.log('pag', await p.evaluate(()=>document.querySelector('#shAlt .gs2-h').textContent+' n='+document.querySelectorAll('#shAlt [data-a]').length)); }
console.log('richieste yt',n,'ERR',errs);await b.close();})();
