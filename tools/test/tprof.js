const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',hasTouch:true,isMobile:true});const p=await ctx.newPage();
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(9000);
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4}); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval',{interval:100}); await cdp.send('Profiler.start');
await p.evaluate(()=>{const tr=document.querySelectorAll("#tbody tr")[3]; (tr.querySelector("td:nth-child(2)")||tr).click();});
await p.waitForTimeout(1500);
const {profile}=await cdp.send('Profiler.stop');
const self={},tot={};const byId={};profile.nodes.forEach(n=>byId[n.id]=n);
const dt={};profile.samples.forEach((s,i)=>{dt[s]=(dt[s]||0)+(profile.timeDeltas[i]||0)});
// total time per function including children
const parent={};profile.nodes.forEach(n=>(n.children||[]).forEach(c=>parent[c]=n.id));
const key=n=>n.callFrame.functionName+'@'+n.callFrame.url.split('/').pop()+':'+n.callFrame.lineNumber;
Object.keys(dt).forEach(id=>{let n=byId[id];self[key(n)]=(self[key(n)]||0)+dt[id];const seen=new Set();while(n){const k=key(n);if(!seen.has(k)){tot[k]=(tot[k]||0)+dt[id];seen.add(k)}n=byId[parent[n.id]]}});
const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,v])=>(v/1000).toFixed(0)+'ms '+k).join('\n');
console.log('SELF\n'+top(self));console.log('TOTAL\n'+top(tot));
await b.close();})();
