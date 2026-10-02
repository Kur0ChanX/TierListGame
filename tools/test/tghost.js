const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(5000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const row=p.locator('#tbody tr').nth(4); const bb=await row.boundingBox();
await p.touchscreen.tap(bb.x+bb.width/2, bb.y+bb.height/2);
const t0=Date.now();
for(const ms of [30,150,300]){ await p.waitForTimeout(ms===30?30:ms-(ms===150?30:150)); console.log(ms,'ms ghost:',await p.evaluate(()=>!!document.querySelector('.rt-ghost')),'modal:',await p.evaluate(()=>document.getElementById('modalBackdrop').classList.contains('show'))); if(ms===150) await p.screenshot({path:(process.env.SP||'/tmp')+'/h201-ghost.png'}); }
await p.waitForTimeout(1500);
console.log('fine: ghost',await p.evaluate(()=>!!document.querySelector('.rt-ghost')),'card opacity',await p.evaluate(()=>getComputedStyle(document.getElementById('modalCard')).opacity), await p.evaluate(()=>currentModalGame&&currentModalGame.name));
await p.screenshot({path:(process.env.SP||'/tmp')+'/h201-open.png'});
console.log('ERR',errs);await b.close();})();
