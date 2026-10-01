// v214: memoria del browser quasi piena (archivi d'appoggio pesanti) → spostati nell'archivio grande, la memoria normale si libera, niente perso
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await ctx.addInitScript(()=>{ if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const big = n=>{ const o={}; for(let i=0;i<n;i++) o['k'+i]={lines:['riga di diagnosi del voto '.repeat(8)], t:Date.now()}; return JSON.stringify(o); };
  localStorage.setItem('jrpg_vote_diag', big(4500)); localStorage.setItem('rt_ost_ia2', big(3500)); localStorage.setItem('jrpg_audit', big(2500));
  const en={}; for(let i=0;i<800;i++) en['gioco '+i]={n:'Game '+i, t:Date.now()}; localStorage.setItem('rt_en_name', JSON.stringify(en));
  localStorage.setItem('rt_debuglog', JSON.stringify([{t:1,m:'vecchia riga'}]));
});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(500);
console.log('prima (memoria normale):', await p.evaluate(()=>{ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); t+=k.length+(Storage.prototype.getItem.call(localStorage,k)||'').length; } return Math.round(t/1e6*100)/100+' MB'; }));
await p.waitForTimeout(4000);
console.log('dopo:', JSON.stringify(await p.evaluate(()=>({normale: rtStorageUse().mb+' MB ('+rtStorageUse().pct+'%)', archivio: Math.round(rtBig.info().bytes/1e4)/100+' MB', diag: Object.keys(JSON.parse(localStorage.getItem('jrpg_vote_diag')||'{}')).length, en: Object.keys(JSON.parse(localStorage.getItem('rt_en_name')||'{}')).length}))));
await p.reload(); await p.waitForTimeout(3000);
console.log('ricaricato:', JSON.stringify(await p.evaluate(()=>({normale: rtStorageUse().pct+'%', diag: Object.keys(JSON.parse(localStorage.getItem('jrpg_vote_diag')||'{}')).length, audit: Object.keys(JSON.parse(localStorage.getItem('jrpg_audit')||'{}')).length, en: Object.keys(JSON.parse(localStorage.getItem('rt_en_name')||'{}')).length, log: (JSON.parse(localStorage.getItem('rt_debuglog')||'[]')).length}))));
console.log('ERR',errs);await b.close();})();
