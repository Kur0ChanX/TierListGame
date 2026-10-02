// v215: CHECK COMPLETO dal vivo — un «utente robot» usa tutto il programma con un profilo pesante e controllo:
// errori, avvisi in console, file mancanti, id duplicati, crescita della pagina / memoria / timer / osservatori (perdite), blocchi lunghi.
const {chromium}=require('playwright');const SP=process.env.SP||'/tmp';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--enable-precise-memory-info','--js-flags=--expose-gc']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,colorScheme:'dark'});const p=await ctx.newPage();
const errs=[], warns=[], missing=[];
p.on('pageerror',e=>errs.push('ERRORE: '+e.message));
p.on('console',m=>{ const t=m.text(); if(m.type()==='error' && !/ERR_FAILED|ERR_ABORTED|net::/.test(t)) errs.push('console.error: '+t.slice(0,200)); else if(m.type()==='warning') warns.push(t.slice(0,140)); });
const IMG=require('fs').readFileSync('/home/user/TierListGame/icons/intro.jpg');
await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) return r.continue(); if(r.request().resourceType()==='image') return r.fulfill({status:200,contentType:'image/jpeg',body:IMG}); return r.abort();});
p.on('requestfailed', r=>{ const u=r.url(); if(u.startsWith('file:')) missing.push(u.split('/').slice(-2).join('/')); });
await ctx.addInitScript(()=>{
  // contatori di timer e osservatori (per scovare perdite)
  window.__lt=[]; try{ new PerformanceObserver(l=>l.getEntries().forEach(e=>{ if(performance.now()>9500) __lt.push([Math.round(e.startTime),Math.round(e.duration)]); })).observe({type:'longtask'}); }catch(e){}
  window.__C={iv:0, ivLive:new Set(), mo:0, ro:0, io:0};
  const si=window.setInterval, ci=window.clearInterval; window.setInterval=function(){ const id=si.apply(this,arguments); __C.iv++; __C.ivLive.add(id); return id; }; window.clearInterval=function(id){ __C.ivLive.delete(id); return ci.apply(this,arguments); };
  const MO=window.MutationObserver; window.MutationObserver=function(cb){ __C.mo++; return new MO(cb); }; window.MutationObserver.prototype=MO.prototype;
  const IO=window.IntersectionObserver; if(IO){ window.IntersectionObserver=function(a,b){ __C.io++; return new IO(a,b); }; window.IntersectionObserver.prototype=IO.prototype; }
  if(sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed','1');
  const m={}, now=Date.now(); for(let i=0;i<730;i++) m[String(900000+i)]={name:'Gioco aggiunto '+i, plat:'PC / PS5', year:String(1995+i%30), m:i%2?'V':'S', score:60+i%35, tags:[['JRPG','ARPG','TURN','TACT'][i%4]], story:'Trama lunga '.repeat(60), enrich:{storyTag:'epic', hoursMain:20+i%40, pros:['a','b'], cons:['c']}, _u: now};
  localStorage.setItem('jrpg_db_customGames', JSON.stringify(m));
  localStorage.setItem('jrpg_top',JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12]));
  const st={}; Object.keys(m).slice(0,200).forEach((id,i)=>st[id]=i%5?'played':'playing'); localStorage.setItem('jrpg_status',JSON.stringify(st));
});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(9000);
const snap=async(lbl)=>{ await p.evaluate(()=>{ try{ window.gc && gc(); }catch(e){} }); return p.evaluate(lbl=>({lbl, nodi: document.getElementsByTagName('*').length, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1e5)/10 : 0, timerVivi: __C.ivLive.size, osservatori: __C.mo + __C.io, schedeAperte: document.querySelectorAll('.x-sheet.show, .modal-backdrop.show, .dup-backdrop.show').length, idDoppi: (()=>{ const c={}; document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1); return Object.entries(c).filter(([,n])=>n>1).map(([k,n])=>k+'×'+n).slice(0,8); })()}), lbl); };
const S=[]; S.push(await snap('inizio'));
console.log('giochi', await p.evaluate(()=>GAMES.length));
const tap=async sel=>{ const l=p.locator(sel).first(); await l.scrollIntoViewIfNeeded().catch(()=>{}); const bb=await l.boundingBox(); if(!bb) return false; await p.touchscreen.tap(bb.x+bb.width/2, bb.y+bb.height/2); return true; };
const closeAll=async()=>{ await p.evaluate(()=>{ document.querySelectorAll('.x-sheet.show, .dup-backdrop.show').forEach(s=>s.classList.remove('show')); const m=document.getElementById('modalBackdrop'); if(m && m.classList.contains('show')){ const c=document.querySelector('#modalBackdrop .modal-close, #modalCloseBtn'); if(c) c.click(); else m.classList.remove('show'); } const a=document.getElementById('askBackdrop'); if(a && a.classList.contains('show')) document.getElementById('askCloseBtn').click(); }); await p.waitForTimeout(250); };
// 1) tutte le sezioni, due giri
for(let r=0;r<2;r++) for(const v of ['discover','novita','mytier','saga','stats','list']){ await tap('.view-tab[data-view="'+v+'"]'); await p.waitForTimeout(450); }
S.push(await snap('dopo 12 cambi di sezione'));
// 2) 20 giochi aperti, in tabella e in griglia, con le tre linguette e lo scorrimento
for(const mode of ['table','grid']){
  await p.evaluate(m=>{ const b=document.querySelector('[data-x-mode="'+m+'"]'); if(b) b.click(); }, mode); await p.waitForTimeout(600);
  for(let i=0;i<10;i++){
    const sel = mode==='grid' ? '.x-card' : '#tbody tr[data-gid]';
    await p.evaluate(([sel,i])=>{ const l=document.querySelectorAll(sel); const el=l[i*3 % l.length]; if(el) el.scrollIntoView({block:'center'}); }, [sel,i]);
    await p.waitForTimeout(150);
    const ok=await p.evaluate(([sel,i])=>{ const l=document.querySelectorAll(sel); return !!l[i*3 % l.length]; }, [sel,i]);
    if(!ok) continue;
    const bb=await p.evaluate(([sel,i])=>{ const l=document.querySelectorAll(sel); const r=l[i*3 % l.length].getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+Math.min(r.height/2, 30)}; }, [sel,i]);
    await p.touchscreen.tap(bb.x, bb.y); await p.waitForTimeout(900);
    for(const t of ['gioco','altro','perme']){ await p.evaluate(t=>{ const b=document.querySelector('.cd-tabs [data-ctab="'+t+'"]'); if(b) b.click(); }, t); await p.waitForTimeout(150); }
    await p.mouse.move(200,500); for(let k=0;k<6;k++){ await p.mouse.wheel(0,400); await p.waitForTimeout(30); }
    await closeAll();
  }
}
S.push(await snap('dopo 20 giochi aperti'));
// 3) finestre e menu: News, Profilo, Filtri, Tema, Chiedi, Avvisi, ricerca, ordinamento, «Più adatti a te», menu ✨ (tutte le voci)
for(const id of ['#changelogBtn','#profileBtn','#filtersBtn','#themeBtn','#bellBtn']){ await tap(id); await p.waitForTimeout(500); await closeAll(); }
await tap('#askTab'); await p.waitForTimeout(500); await closeAll();
await p.fill('#search','final'); await p.waitForTimeout(600); await p.fill('#search',''); await p.waitForTimeout(400);
await p.evaluate(()=>{ const th=document.querySelector('th[data-key="score"]'); if(th) th.click(); }); await p.waitForTimeout(400);
await p.evaluate(()=>{ const b=document.getElementById('dnaSortBtn'); if(b) b.click(); }); await p.waitForTimeout(800);
await p.evaluate(()=>{ const b=document.getElementById('resetBtn'); if(b) b.click(); }); await p.waitForTimeout(400);
const menu=await p.evaluate(()=> (window.XMENU||[]).map(x=>String(x.html||'').replace(/<[^>]+>/g,'').slice(0,40)));
let menuErr=0;
await p.evaluate(()=>{ window.open=()=>null; window.__navBlock=true; window.addEventListener('beforeunload', e=>{ e.preventDefault(); }); });
for(let i=0;i<menu.length;i++){ if(/Triad|Riavvia|Ricarica|Esci|Svuota|Cancella|Elimina|Ripristina|Reset/i.test(menu[i])) continue; const url0=p.url(); const before=errs.length; await p.evaluate(()=>{ window.__alive=1; }).catch(()=>{}); await p.evaluate(i=>{ try{ (window.XMENU||[])[i].run(); }catch(e){ console.error('menu '+i+': '+e.message); } }, i); await p.waitForTimeout(350); if(p.url()!==url0 || !(await p.evaluate(()=>!!window.__alive).catch(()=>false))){ errs.push('   la voce di menu «'+menu[i]+'» ha ricaricato o cambiato pagina'); await p.goBack().catch(()=>{}); await p.waitForTimeout(3000); } if(errs.length>before){ menuErr++; errs.push('   ↑ voce di menu: '+menu[i]); } await closeAll(); }
S.push(await snap('dopo menu e finestre ('+menu.length+' voci di menu)'));
// 4) di nuovo 10 giochi per vedere se qualcosa cresce
for(let i=0;i<10;i++){ await p.evaluate(i=>openModal(GAMES[(i*37)%GAMES.length]), i); await p.waitForTimeout(500); await closeAll(); }
S.push(await snap('dopo altri 10 giochi'));
// esito
console.log('\n--- STATO DELLA PAGINA ---'); S.forEach(s=>console.log(JSON.stringify(s)));
const lt=await p.evaluate(()=>__lt.filter(x=>x[1]>=200));
console.log('\n--- BLOCCHI ≥200 ms durante il giro (senza rallentare la CPU) ---', lt.length ? JSON.stringify(lt) : 'nessuno');
console.log('\n--- FILE MANCANTI ---', missing.length ? [...new Set(missing)].join(', ') : 'nessuno');
console.log('\n--- AVVISI CONSOLE ---', warns.length ? [...new Set(warns)].slice(0,10).join('\n') : 'nessuno');
console.log('\n--- ERRORI ---', errs.length ? '\n'+[...new Set(errs)].join('\n') : 'nessuno');
await b.close();})();
