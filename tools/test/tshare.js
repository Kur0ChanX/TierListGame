// v217: «Condividi immagine» → Raccoon Tier: il service worker riceve l'immagine, l'app la mette come locandina del gioco di partenza
// (serve un server: python3 -m http.server 8765 nella cartella del progetto)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route('**/*',r=>{const u=r.request().url(); if(!u.startsWith('http://localhost')) return r.abort(); return r.continue();});
const U='http://localhost:8765/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html';
await p.goto(U); await p.waitForTimeout(6000); await p.reload(); await p.waitForTimeout(6000);
console.log('sw attivo:', await p.evaluate(()=>!!navigator.serviceWorker.controller));
const gid=await p.evaluate(()=>GAMES[10].id);
// parto dal menu locandina → «Cerca su internet» → Apri la ricerca (segna il gioco)
await p.evaluate(id=>{ openModal(GAMES.find(g=>g.id===id)); },gid); await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('.cv-menu-btn').click()); await p.waitForTimeout(500);
console.log('voci menu:', await p.evaluate(()=>[...document.querySelectorAll('#xCvMenu [data-cvm]')].map(b=>b.dataset.cvm).join(',')));
await p.evaluate(()=>document.querySelector('#xCvMenu [data-cvm="web"]').click()); await p.waitForTimeout(500);
await p.evaluate(()=>{ const a=document.getElementById('cvwGo'); a.removeAttribute('target'); a.addEventListener('click',e=>e.preventDefault()); a.click(); });
console.log('gioco segnato:', await p.evaluate(()=>localStorage.getItem('rt_cover_wait')));
// la condivisione: POST multipart a ./share-cover (come fa Android)
const png=require('fs').readFileSync('/home/user/TierListGame/icons/icon-192.png').toString('base64');
const st=await p.evaluate(async b64=>{ const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const fd=new FormData(); fd.append('image', new Blob([bin],{type:'image/png'}),'x.png'); const r=await fetch('./share-cover',{method:'POST',body:fd}); return r.url; },png);
console.log('dopo la condivisione vado a:', st.replace('http://localhost:8765/',''));
await p.goto(U+'?shared=cover'); await p.waitForTimeout(9000);
console.log('locandina messa:', await p.evaluate(id=>!!(USER_COVERS[String(id)]),gid), '| bloccata:', await p.evaluate(id=>!!(JSON.parse(localStorage.getItem('jrpg_media_lock')||'{}')[id]||{}).cover,gid), '| scheda aperta:', await p.evaluate(()=>currentModalGame&&currentModalGame.id), '| indirizzo pulito:', await p.evaluate(()=>location.search===''));
console.log('immagine ancora in attesa:', await p.evaluate(async()=>!!(await (await caches.open('raccoon-tier-v2')).match('./__shared-cover'))));
// «Copia immagine» e poi «Incolla l'immagine copiata»
await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://localhost:8765'});
const gid2=await p.evaluate(()=>GAMES[20].id);
await p.evaluate(async b64=>{ const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); await navigator.clipboard.write([new ClipboardItem({'image/png': new Blob([bin],{type:'image/png'})})]); },png);
await p.evaluate(id=>{ openModal(GAMES.find(g=>g.id===id)); },gid2); await p.waitForTimeout(1200);
await p.evaluate(()=>document.querySelector('.cv-menu-btn').click()); await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('#xCvMenu [data-cvm="paste"]').click()); await p.waitForTimeout(4000);
console.log('incolla → locandina messa:', await p.evaluate(id=>!!(USER_COVERS[String(id)]),gid2));
console.log('ERR',errs.slice(0,5));await b.close();})();
