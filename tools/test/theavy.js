// avvio con un profilo «pesante» come quello vero: misura i blocchi del telefono e cosa li causa
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
// 1) creo il profilo
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(3000);
await p.evaluate(()=>{const ids=GAMES.map(g=>g.id), pick=(n,o)=>ids.slice(o,o+n);
 localStorage.setItem(profileKey('jrpg_favs'),JSON.stringify(pick(45,0)));
 const st={};pick(200,0).forEach((id,i)=>st[id]=i%9===0?'dropped':i%5===0?'playing':'played');pick(80,300).forEach(id=>st[id]='backlog');localStorage.setItem(profileKey('jrpg_status'),JSON.stringify(st));
 const mt={};pick(150,0).forEach((id,i)=>mt[id]=['S','A','B','C'][i%4]);localStorage.setItem(profileKey('jrpg_mytier'),JSON.stringify(mt));
 const mv={};pick(60,0).forEach((id,i)=>mv[id]=5+(i%6));localStorage.setItem('jrpg_myvote',JSON.stringify(mv));
 localStorage.setItem('jrpg_top',JSON.stringify(pick(12,0)));
 const dw={};pick(25,0).forEach((id,i)=>dw[id]={BUILD:1,LORE:i%2?2:1,EXPLO:-1,STORY:1});localStorage.setItem('jrpg_dna_why',JSON.stringify(dw));
 const cu={};['attacchi-a-tempo','sfere','carte','pesca','corse'].forEach((k,i)=>cu[k]={n:k,kw:['timed hits','qte','additions','sphere grid','minigioco '+i],by:[ids[i]],games:pick(20,i*30)});localStorage.setItem('jrpg_dna_custom',JSON.stringify(cu));
 const rx={};pick(40,100).forEach((id,i)=>rx[id]={like:1,t:Date.now()});localStorage.setItem('jrpg_react',JSON.stringify(rx));
 const rt={};pick(8,0).forEach((id,i)=>rt[id]={f:'rpg',v:{combat:7+i%3,story:8,music:9,explore:6,world:8,pace:7},t:Date.now()});localStorage.setItem('jrpg_rate',JSON.stringify(rt));
});
// 2) riapro come il telefono (CPU 4× più lenta), registro un profilo delle funzioni
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.addInitScript(()=>{window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'});}catch(e){}});
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval',{interval:500}); await cdp.send('Profiler.start');
await p.reload(); await p.waitForTimeout(15000);
const {profile}=await cdp.send('Profiler.stop');
console.log('blocchi >200ms (inizio,durata):',await p.evaluate(()=>JSON.stringify(__lt.filter(x=>x[1]>200))));
const byId={};profile.nodes.forEach(n=>byId[n.id]=n);const parent={};profile.nodes.forEach(n=>(n.children||[]).forEach(c=>parent[c]=n.id));
const dt={};profile.samples.forEach((s,i)=>{dt[s]=(dt[s]||0)+(profile.timeDeltas[i]||0)});
const key=n=>n.callFrame.functionName+'@'+n.callFrame.url.split('/').pop()+':'+n.callFrame.lineNumber;const tot={},self={};
Object.keys(dt).forEach(id=>{let n=byId[id];self[key(n)]=(self[key(n)]||0)+dt[id];const seen=new Set();while(n){const k=key(n);if(!seen.has(k)){tot[k]=(tot[k]||0)+dt[id];seen.add(k)}n=byId[parent[n.id]]}});
console.log('TOTALE\n'+Object.entries(tot).sort((a,b)=>b[1]-a[1]).filter(([k])=>!/^\(|^@:0|RegExp/.test(k)).slice(0,28).map(([k,v])=>(v/1000).toFixed(0)+'ms '+k).join('\n'));
console.log('ERR',errs.slice(0,3));await b.close();})();
