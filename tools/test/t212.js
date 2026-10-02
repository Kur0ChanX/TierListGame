// v212: sezioni istantanee e sempre in cima, Chiedi con la barra in basso visibile, stemma dei top nella lista, voto controllato in Novità
const {chromium}=require('playwright');const SP=process.env.SP||'/tmp';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(5000);
await p.evaluate(()=>{const i=document.getElementById('intro'); if(i) i.remove(); localStorage.setItem('jrpg_top',JSON.stringify([GAMES[1].id])); render();});
await p.waitForTimeout(400); await p.screenshot({path:SP+'/b-list.png'});
console.log('stemmi', await p.evaluate(()=>document.querySelectorAll('#tbody .row-badge').length));
// cambio sezione: tempo dal tocco al cambio, animazioni di passaggio, posizione
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>{document.getElementById('tableWrap').scrollTop=1500;});
for(const v of ['mytier','saga','stats','list','discover','list']){
  await p.evaluate(()=>{ for(const id of ['myTierWrap','sagaPanel','statsPanel','discoverPanel']){ const e=document.getElementById(id); if(e) e.scrollTop=0; } });
  const box=await p.locator('.view-tab[data-view="'+v+'"]').boundingBox();
  const t0=await p.evaluate(()=>performance.now());
  await p.touchscreen.tap(box.x+box.width/2, box.y+box.height/2);
  const r=await p.evaluate(t0=>new Promise(res=>requestAnimationFrame(()=>res({ms:Math.round(performance.now()-t0), view:state.view, vt:document.getAnimations().filter(a=>a.effect&&a.effect.pseudoElement).length, y:Math.round(scrollY), tw:document.getElementById('tableWrap').scrollTop}))),t0);
  console.log(v, JSON.stringify(r));
  await p.waitForTimeout(500);
  if(v==='mytier'){ await p.evaluate(()=>{ const e=document.getElementById('myTierWrap'); e.scrollTop=800; window.scrollTo({top:600,behavior:'instant'}); }); }
}
await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
// Chiedi: barra in basso visibile e cambio sezione chiude Chiedi
const ab=await p.locator('#askTab').boundingBox(); await p.touchscreen.tap(ab.x+ab.width/2, ab.y+ab.height/2); await p.waitForTimeout(300);
console.log('chiedi aperto', await p.evaluate(()=>document.getElementById('askBackdrop').classList.contains('show')), 'barra visibile', await p.evaluate(()=>{ const t=document.querySelector('.view-tab[data-view="saga"]'); const r=t.getBoundingClientRect(); return document.elementFromPoint(r.left+r.width/2, r.top+r.height/2)?.closest('.view-tab')===t; }));
await p.screenshot({path:SP+'/b-ask.png'});
const sb=await p.locator('.view-tab[data-view="saga"]').boundingBox(); await p.touchscreen.tap(sb.x+sb.width/2, sb.y+sb.height/2); await p.waitForTimeout(300);
console.log('dopo Saghe: chiedi chiuso', await p.evaluate(()=>!document.getElementById('askBackdrop').classList.contains('show')), state = await p.evaluate(()=>state.view));
// Novità: proposta mai controllata → controllo subito
await p.evaluate(()=>{ window.rtScoreCheck = async c=>{ await new Promise(r=>setTimeout(r,300)); return {score: 81, vs: 'Metacritic (sito ufficiale)', info:{year: 2020}}; };
  llmAvailable = ()=>true; novitaQueue.length=0; novitaQueue.push({name:'Bean and Nothingness', plat:'PC', year:'2021', tier:'S+', score:98, tags:['RGL']}); setView('novita'); });
console.log('subito:', await p.evaluate(()=>document.querySelector('#novitaCard .novita-meta').textContent.replace(/\s+/g,' ').trim()));
await p.waitForTimeout(800);
console.log('dopo il controllo:', await p.evaluate(()=>document.querySelector('#novitaCard .novita-meta').textContent.replace(/\s+/g,' ').trim()));
await p.screenshot({path:SP+'/b-novita.png'});
console.log('ERR',errs);await b.close();})();
