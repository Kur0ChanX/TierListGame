const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const PNG=require('fs').readFileSync('/home/user/TierListGame/icons/icon-192.png');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(/steamstatic|rawg|wikidata|wikipedia|libretro/.test(u)) { if(/library_600x900\.jpg|rawg/.test(u)) return r.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:PNG}); return r.fulfill({status:404,headers:{'access-control-allow-origin':'*'},body:'{}'});} return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{USER_COVERS['10']='https://media.rawg.io/media/games/zzz/wrong.jpg'; openModal(GAMES.find(g=>g.id===10));}); await p.waitForTimeout(6000);
console.log('cover ora:',await p.evaluate(()=>USER_COVERS['10']));
console.log('ERR',errs);await b.close();})();
