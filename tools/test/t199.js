const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},colorScheme:'dark',hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const PNG=require('fs').readFileSync('/home/user/TierListGame/icons/icon-192.png');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue();
 if(u.includes('storesearch')) return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({items:[{id:39150,name:'FINAL FANTASY VIII'}]})});
 if(u.includes('appdetails')) return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({39150:{success:true,data:{screenshots:Array.from({length:30},(_,i)=>({path_thumbnail:'https://x.test/t'+i+'.jpg',path_full:'https://x.test/f'+i+'.jpg'})),movies:[]}}})});
 if(u.includes('x.test')||u.includes('steamstatic')||u.includes('akamai')) return r.fulfill({status:200,contentType:'image/png',body:PNG});
 return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');await p.waitForTimeout(3500);
await p.evaluate(()=>{ GAMES.filter(g=>/^Final Fantasy (VII|X|VI|IX)$|^Chrono Trigger$/.test(g.name)).forEach(g=>FAVS.add(g.id)); saveFavs(); });
const ff8=()=>p.evaluate(()=>{const g=GAMES.find(g=>g.name==='Final Fantasy VIII');openModal(g);const s=rtSintonia(g);return s&&s.pct+' '+s.known;});
console.log('FF8 prima:', await ff8());
await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('[data-gtop]').click()); await p.waitForTimeout(800);
console.log('FF8 dopo top:', await p.evaluate(()=>rtSintonia(GAMES.find(g=>g.name==='Final Fantasy VIII')).pct), await p.evaluate(()=>document.querySelector('#gsCard .gs2-verd span').textContent));
// saga chip FFX -> FF8 %
await p.evaluate(()=>openModal(GAMES.find(g=>g.name==='Final Fantasy X'))); await p.waitForTimeout(800);
console.log('chip saga:', await p.evaluate(()=>[...document.querySelectorAll('.similar-chip')].map(c=>c.textContent).filter(t=>/VIII/.test(t)).join('|')));
await p.evaluate(()=>document.querySelector('[data-gtopall]').click()); await p.waitForTimeout(400);
await p.fill('#tpQ','chrono'); await p.waitForTimeout(300);
console.log('ricerca top:', await p.evaluate(()=>document.querySelectorAll('[data-tpa]').length));
await p.evaluate(()=>{document.querySelector('[data-tpa]').click(); document.querySelector('#xTop').classList.remove('show');});
// locandina bloccata
const r=await p.evaluate(async()=>{const g=GAMES.find(g=>g.name==='Final Fantasy VIII'); const all=JSON.parse(localStorage.getItem('jrpg_media_lock')||'{}'); all[g.id]={cover:1}; localStorage.setItem('jrpg_media_lock',JSON.stringify(all)); const before=XCOVER.has(g); const ok=await XCOVER.save(g,'https://x.test/zz.png'); openModal(g); await new Promise(r=>setTimeout(r,600)); return [ok, XCOVER.has(g)===before, !!document.querySelector('.x-autocover')];});
console.log('lock cover (false,true,false):', r);
// carosello
await p.evaluate(()=>{document.querySelector('.cv-menu-btn').click(); document.querySelector('[data-cvm="shots"]').click();}); await p.waitForTimeout(1500);
console.log('slot:', await p.evaluate(()=>document.querySelectorAll('#shCur [data-s]').length));
await p.evaluate(()=>document.querySelector('#shCur [data-s="1"]').click()); await p.waitForTimeout(800);
console.log('alternative:', await p.evaluate(()=>document.querySelectorAll('#shAlt [data-a]').length+' '+document.querySelector('#shAlt .gs2-h').textContent));
const first=await p.evaluate(()=>document.querySelector('#shAlt [data-a]').dataset.a);
await p.evaluate(()=>document.querySelector('#shMore').click()); await p.waitForTimeout(300);
console.log('altre diverse:', await p.evaluate(f=>document.querySelector('#shAlt [data-a]').dataset.a!==f,first));
await p.evaluate(()=>document.querySelector('#shAlt [data-a]').click()); await p.waitForTimeout(300);
console.log('lock shots:', await p.evaluate(()=>{const g=GAMES.find(g=>g.name==='Final Fantasy VIII');return (rtMediaLock(g).shots||[]).length;}));
// long press
await p.locator('#shCur .cv-it img').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(400); const box=await p.locator('#shCur .cv-it img').first().boundingBox(); console.log(await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.tagName+'.'+e.className+' '+(e.closest('.x-sheet')||{}).id;},[box.x+20,box.y+20]));
await p.mouse.move(box.x+20,box.y+20); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(200);
console.log('anteprima:', await p.evaluate(()=>!!document.querySelector('#rtPrev.show')), 'nessuna selezione:', await p.evaluate(()=>!document.querySelector('#shAlt [data-a]')));
await p.screenshot({path:(process.env.SP||'/tmp')+'/h199-prev.png'});
await p.evaluate(()=>document.querySelector('#rtPrev').click());
await p.evaluate(()=>document.querySelector('#xShots').scrollIntoView()); await p.screenshot({path:(process.env.SP||'/tmp')+'/h199-shots.png'});
console.log('ERR',errs);await b.close();})();
