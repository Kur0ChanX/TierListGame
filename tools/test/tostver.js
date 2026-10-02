// v220: colonna sonora della versione giusta (Final Fantasy VII 1997 ≠ Remake/Rebirth/Crisis Core…)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(8000);
const r=await p.evaluate(()=>{ const out={}; const f=n=>GAMES.find(g=>g.name===n);
  const names=GAMES.filter(g=>/^Final Fantasy VII/.test(g.name)).map(g=>g.name+' ('+g.year+')');
  const t=window.rtMusic&&window.rtMusic._test; return {names, has:!!t}; });
console.log(JSON.stringify(r));
const T=[
 ['Final Fantasy VII (1997)','FINAL FANTASY VII ORIGINAL SOUNDTRACK - Full Album',true],
 ['Final Fantasy VII (1997)','Final Fantasy VII Remake OST - Full Soundtrack',false],
 ['Final Fantasy VII (1997)','FINAL FANTASY VII REBIRTH Original Soundtrack',false],
 ['Final Fantasy VII (1997)','Crisis Core: Final Fantasy VII OST',false],
 ['Final Fantasy VII (1997)','Final Fantasy VII Advent Children OST',false],
 ['Final Fantasy VII (1997)','Final Fantasy VII OST (2020) Remake music',false],
 ['Final Fantasy VII (1997)','Final Fantasy VII - One Winged Angel (1997) OST',true],
 ['Final Fantasy VII Remake (2020)','Final Fantasy VII Remake OST - Full Soundtrack',true],
 ['Final Fantasy VII Remake (2020)','FINAL FANTASY VII ORIGINAL SOUNDTRACK - Full Album',false],
 ['Final Fantasy VII Remake (2020)','Final Fantasy VII Rebirth OST',false],
 ['Final Fantasy VII Rebirth (2024)','Final Fantasy VII Rebirth Original Soundtrack',true],
 ['Final Fantasy VIII (1999)','Final Fantasy VIII OST - Eyes On Me',true],
 ['Final Fantasy VIII (1999)','Final Fantasy VII OST',false]
];
let bad=0;
for(const [gn,title,want] of T){ const got=await p.evaluate(([gn,title])=>{ const g=GAMES.find(x=>x.name+' ('+x.year+')'===gn); return rtMusic._test.namesGame(title,g.name,g); },[gn,title]); const ok=got===want; if(!ok) bad++; console.log((ok?'OK  ':'ERRORE ')+gn.padEnd(34)+' | '+title.padEnd(52)+' | accettato:',got); }
console.log('queste sono le ricerche per FF VII 1997:', await p.evaluate(()=>{ const g=GAMES.find(x=>x.name==='Final Fantasy VII'); return rtMusic._test.queriesFor(g.name,g).slice(0,2); }));
console.log(bad?('ERRORI: '+bad):'tutti i controlli di versione passano');
console.log('ERR',errs);await b.close();})();
