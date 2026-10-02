// v218: aprendo un gioco, Update+ / locandina / foto partono da soli solo dopo qualche secondo e solo se mancano
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const t0=Date.now(); const net=[];
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); net.push([Date.now()-T,new URL(u).host]); return r.abort();});
let T=0;
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
await p.evaluate(()=>{ window.__q=[]; const o=updatePlusQueue; window.updatePlusQueue=id=>{ __q.push([id,Math.round(performance.now()-window.__T0)]); return o(id); }; localStorage.setItem('jrpg_update_plus','on'); });
const open=async id=>{ T=Date.now(); net.length=0; await p.evaluate(id=>{ window.__T0=performance.now(); openModal(GAMES.find(g=>g.id===id)); },id); await p.waitForTimeout(9000); const q=await p.evaluate(()=>window.__q.splice(0)); const first=net.length?net[0][0]:null; console.log('gioco',id,'| Update+ chiesto:',JSON.stringify(q),'| prima richiesta internet a ms:',first, '| richieste:',net.length); await p.evaluate(()=>document.getElementById('modalCloseBtn').click()); await p.waitForTimeout(600); };
await open(3);
console.log('--- ora segno il gioco 8 come già aggiornato con Update+');
await p.evaluate(()=>{ const f=JSON.parse(localStorage.getItem('jrpg_fresh')||'{}'); f[8]={gold:1,t:new Date().toISOString(),src:['x'],e:3}; localStorage.setItem('jrpg_fresh',JSON.stringify(f)); });
await open(8);
console.log('--- modalità calma accesa');
await p.evaluate(()=>localStorage.setItem('rt_calm','on')); await open(20);
console.log('ERR',errs);await b.close();})();
