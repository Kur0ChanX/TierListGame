const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{ GAMES.filter(g=>/^Final Fantasy (VII|IX|VI)$|^Chrono Trigger$/.test(g.name)).forEach(g=>FAVS.add(g.id)); saveFavs(); openModal(GAMES.find(g=>g.name==='Final Fantasy X'));}); await p.waitForTimeout(1500);
console.log('ordine in alto:',await p.evaluate(()=>{const k=[...document.querySelectorAll('#modalCard > *')];const i=k.findIndex(e=>e.classList.contains('cd-tabs'));return k.slice(0,i+1).map(e=>e.id||e.className.split(' ')[0]).join(' | ')}));
await p.evaluate(()=>document.querySelector('.cd-tabs').scrollIntoView({block:'start'})); await p.waitForTimeout(400);
await p.screenshot({path:(process.env.SP||'/tmp')+'/h207-dna.png'});
await p.evaluate(()=>document.querySelector('[data-dna-deck]').click()); await p.waitForTimeout(600);
await p.screenshot({path:(process.env.SP||'/tmp')+'/h207-deck.png'});
// swipe right
const c=await p.locator('#dkCard').boundingBox(); await p.mouse.move(c.x+c.width/2,c.y+c.height/2); await p.mouse.down(); await p.mouse.move(c.x+c.width/2+150,c.y+c.height/2,{steps:8}); await p.mouse.up(); await p.waitForTimeout(500);
for(const v of ['2','-1','0','1']){ await p.evaluate(v=>document.querySelector('[data-dk="'+v+'"]').click(),v); await p.waitForTimeout(450); }
console.log('dopo deck:',await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('jrpg_dna_why'))[GAMES.find(g=>g.name==='Final Fantasy X').id])), await p.evaluate(()=>document.getElementById('dkN').textContent));
await p.evaluate(()=>document.getElementById('xDnaDeck').classList.remove('show')); await p.waitForTimeout(500);
console.log('riquadro:',await p.evaluate(()=>document.querySelector('#dnaWhy .d2-say').textContent), await p.evaluate(()=>document.querySelectorAll('#dnaWhy .d2-strip i').length));
await p.evaluate(()=>document.getElementById('dnaWhy').scrollIntoView({block:'start'})); await p.waitForTimeout(300);
await p.screenshot({path:(process.env.SP||'/tmp')+'/h207-dna2.png'});
await p.evaluate(()=>document.querySelector('[data-dna-all]').click()); await p.waitForTimeout(300);
await p.fill('#daQ','boss'); await p.waitForTimeout(200);
console.log('ricerca boss:',await p.evaluate(()=>[...document.querySelectorAll('#daL .d2-chip')].map(x=>x.textContent).join(', ')));
await p.evaluate(()=>document.getElementById('xDnaAll').classList.remove('show'));
await p.evaluate(()=>document.querySelector('.cd-tabs [data-ctab="gioco"]').click()); await p.waitForTimeout(500);
console.log('gioco inizia con:',await p.evaluate(()=>[...document.querySelectorAll('#modalCard > [data-tab="gioco"]')].slice(0,4).map(e=>e.id||e.className.split(' ')[0]).join(' | ')));
console.log('ERR',errs);await b.close();})();
