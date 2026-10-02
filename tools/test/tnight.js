// v211: pezzi notturni (dati/notte-*.js): schermate e musiche arrivano solo per il gioco aperto, niente file interi
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const req=[]; await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')){ if(/(ost|shots)\.js|notte-/.test(u)) req.push(u.split('/').pop()); return r.continue(); } return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(5000);
console.log('richieste all\'avvio:', JSON.stringify(req)); req.length=0;
const r = await p.evaluate(async()=>{ const g=GAMES.find(x=>x.id===3); const s=await rtShotsFor(g); await rtNight.ensure('ost', 1); return {gioco:g.name, schermate:s.length, primaUrl:(s[0]||'').slice(0,60), brani:(OST.games[1]||[]).length}; });
console.log(JSON.stringify(r), 'richieste:', JSON.stringify(req));
const all = await p.evaluate(async()=>{ const ids=GAMES.map(g=>g.id); await Promise.all(ids.map(id=>rtNight.ensure('ost',id))); await Promise.all(ids.map(id=>rtNight.ensure('shots',id))); return [Object.keys(OST.games).length, Object.keys(GAME_SHOTS.games).length]; });
console.log('tutti i pezzi: brani per', all[0], 'giochi, schermate per', all[1]);
console.log('ERR',errs);await b.close();})();
