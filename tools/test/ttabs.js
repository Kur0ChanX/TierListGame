const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(4000);
await p.evaluate(()=>openModal(GAMES.find(g=>g.name==='Final Fantasy X'))); await p.waitForTimeout(1500);
const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#modalCard > *')].filter(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none').filter(e=>getComputedStyle(e).display!=='none').map(e=>(e.id||e.className.toString().split(' ')[0]).slice(0,14)+(e.classList.contains('modal-section-title')?':'+e.textContent.trim().slice(0,12):'')).join(' | '));
console.log('TAB', await p.evaluate(()=>document.getElementById('modalCard').dataset.ctab)); console.log(await vis());
for(const t of ['gioco','altro']){ await p.evaluate(t=>document.querySelector('.cd-tabs [data-ctab="'+t+'"]').click(),t); await p.waitForTimeout(300); console.log('TAB',t); console.log(await vis()); }
await p.evaluate(()=>document.querySelector('.cd-tabs [data-ctab="perme"]').click());
await p.evaluate(()=>document.querySelector('.cv-menu-btn').click()); await p.waitForTimeout(400);
console.log('menu locandina:', await p.evaluate(()=>[...document.querySelectorAll('#xCvMenu [data-cvm]')].map(b=>b.dataset.cvm).join(',')));
await p.screenshot({path:(process.env.SP||'/tmp')+'/h204-menu.png'});
await p.evaluate(()=>document.querySelector('#xCvMenu').classList.remove('show'));
await p.evaluate(()=>document.querySelector('.cd-tabs').scrollIntoView({block:'start'})); await p.waitForTimeout(300);
await p.screenshot({path:(process.env.SP||'/tmp')+'/h204-tabs.png'});
await p.evaluate(()=>document.getElementById('modalCard').scrollTo(0,0)); await p.waitForTimeout(300);
await p.screenshot({path:(process.env.SP||'/tmp')+'/h204-top.png'});
console.log('ERR',errs);await b.close();})();
