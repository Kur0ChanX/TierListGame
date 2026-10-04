// ---- v256: «⚡ Aggiorna tutti i giochi» ----
// Come se premessi «Update V+» su ogni gioco, uno dopo l'altro (voto, anno, generi, lingua, testi). In più rinfresca la locandina e le foto del carosello
// SOLO dove non le hai scelte tu: locandina bloccata 🔒 o caricata/incollata da te, schermate bloccate 🔒 restano com'erano.
// Parte solo quando premi il tasto (in «Controllo dati»), si può mettere in pausa, e se chiudi l'app riprende da dove era (rt_upall, solo su questo telefono).
(function(){
  'use strict';
  const K = 'rt_upall';
  const U = window.XUI; if(!U) return;
  const esc = U.esc;
  const load = ()=>{ try{ return JSON.parse(localStorage.getItem(K) || 'null'); }catch(e){ return null; } };
  const save = s=>{ try{ localStorage.setItem(K, JSON.stringify(s)); }catch(e){} };
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));
  const withTimeout = (p, ms)=> Promise.race([p, new Promise((_, rej)=> setTimeout(()=> rej(new Error('tempo scaduto')), ms))]);
  const fmtT = ms=>{ const m = Math.round(ms / 60000); if(m < 1) return 'meno di un minuto'; if(m < 60) return m + ' min'; const h = Math.floor(m / 60); return h + ' h ' + (m % 60) + ' min'; };

  let st = load() || null;                 // {t, done:[id], fail:[id], cv, sh, skCv, skSh, ms}
  let live = null;                         // {paused, stop}
  let wake = null;

  const fresh = ()=> ({t: new Date().toISOString(), done: [], fail: [], cv: 0, sh: 0, skCv: 0, skSh: 0, ms: 0});
  const order = ()=> GAMES.map((g, i)=> ({g, i, w: g.custom ? 0 : (g.m !== 'V' ? 1 : 2)})).sort((a, b)=> a.w - b.w || a.i - b.i).map(x=> x.g);

  // le due cache del carosello (RAWG e Libretro) durano settimane: per rinfrescare le tolgo, solo per questo gioco
  function dropShotCache(id){
    ['rt_shots_rawg4', 'rt_shots_lr'].forEach(k=>{ try{ const c = JSON.parse(localStorage.getItem(k) || '{}') || {}; if(c[id]){ delete c[id]; localStorage.setItem(k, JSON.stringify(c)); } }catch(e){} });
  }

  async function oneGame(g, tally){
    let ok = false;
    try{ const r = await withTimeout(updatePlusQuiet(g), 150000); ok = !!(r && r.ok); }catch(e){}
    g = GAMES.find(x=> x.id === g.id) || g;
    const lk = (window.rtMediaLock && window.rtMediaLock(g)) || {};
    let cvChanged = false;
    // locandina: non tocco quella bloccata 🔒 né quella caricata/incollata da te
    if(lk.cover || (typeof userCoverManual === 'function' && userCoverManual(g))) tally.skCv++;
    else if(window.XCOVER){
      try{
        const f = await withTimeout(XCOVER.find(g), 70000), cur = typeof effectiveCover === 'function' ? effectiveCover(g) : null;
        // una fonte debole (Wikipedia, RAWG) non sostituisce una locandina che c'è già e funziona
        const strong = f && (f.source === 'Steam' || f.source === 'Libretro');
        if(f && f.url && f.url !== cur && (strong || !cur)){ const r = await XCOVER.save(g, f.url); if(r !== false){ tally.cv++; cvChanged = true; } }
      }catch(e){}
    }
    // carosello: non tocco le schermate scelte da te 🔒
    if(lk.shots && lk.shots.length) tally.skSh++;
    else{
      dropShotCache(g.id);
      let n = 0;
      try{ if(window.rtRawgShots) n += (await withTimeout(rtRawgShots(g, true), 60000) || []).length; }catch(e){}
      try{ if(window.XCOVER && XCOVER.lrShots) n += (await withTimeout(XCOVER.lrShots(g), 60000) || []).length; }catch(e){}
      if(n) tally.sh++;
    }
    if(cvChanged){ try{ refreshGameRow(g); }catch(e){} }
    return ok;
  }

  async function holdWake(){ try{ if(navigator.wakeLock && !wake) wake = await navigator.wakeLock.request('screen'); if(wake) wake.addEventListener('release', ()=>{ wake = null; }); }catch(e){} }
  function freeWake(){ try{ if(wake) wake.release(); }catch(e){} wake = null; }
  document.addEventListener('visibilitychange', ()=>{ if(live && document.visibilityState === 'visible') holdWake(); });

  const pane = ()=> document.getElementById('xUpAll');
  function paint(cur){
    const el = pane(); if(!el) return;
    const total = GAMES.length, n = st ? st.done.length : 0, pct = total ? Math.min(100, Math.round(n * 100 / total)) : 0;
    const eta = st && st.ms && n >= 4 && live ? ' · mancano circa ' + fmtT((st.ms / n) * (total - n)) : '';
    const put = (id, h)=>{ const x = el.querySelector('#' + id); if(x && x.innerHTML !== h) x.innerHTML = h; };
    put('uaTxt', st ? `<b>${n}</b> giochi su ${total}${eta}` : `${total} giochi`);
    const bar = el.querySelector('#uaBar'); if(bar) bar.style.width = pct + '%';
    put('uaCur', cur ? '⏳ ' + esc(cur) : (live ? (live.paused ? '⏸️ In pausa' : '') : ''));
    put('uaSum', st ? `Locandine nuove: <b>${st.cv}</b> · carosello rinfrescato: <b>${st.sh}</b> · non riusciti: <b>${st.fail.length}</b><br><small>Lasciate come le hai scelte tu: ${st.skCv} locandine, ${st.skSh} caroselli</small>` : '');
  }

  async function runLoop(only){
    if(live) return;
    live = {paused: false, stop: false}; window.__rtBulkUpdate = true; holdWake(); buttons();
    try{
      for(let guard = 0; guard < 4 && !live.stop; guard++){
        const doneSet = new Set(st.done.map(String));
        let todo = order().filter(g=> !doneSet.has(String(g.id)));
        if(only) todo = todo.filter(g=> only.has(String(g.id)));
        if(!todo.length) break;
        for(const g of todo){
          if(live.stop) break;
          while(live && live.paused && !live.stop) await sleep(700);
          while(!live.stop && (document.visibilityState !== 'visible' || navigator.onLine === false)) await sleep(1500);
          if(live.stop) break;
          while(!live.stop && ((typeof detailsReady === 'function' && !detailsReady()) || window.__catalogPending)) await sleep(1500);
          paint(g.name);
          const t0 = Date.now();
          let ok = false; try{ ok = await oneGame(g, st); }catch(e){}
          st.ms += Date.now() - t0;
          st.done.push(g.id);
          const fi = st.fail.indexOf(g.id); if(ok){ if(fi >= 0) st.fail.splice(fi, 1); } else if(fi < 0) st.fail.push(g.id);
          save(st); paint(g.name);
          if(st.done.length % 30 === 0){ try{ renderWhenIdle({list: true}); }catch(e){} }
          await sleep(700);
        }
        if(only) break;
      }
    }finally{
      const finished = !live.stop;
      live = null; window.__rtBulkUpdate = false; freeWake(); save(st); paint(null); buttons();
      try{ renderWhenIdle({list: true}); }catch(e){}
      try{ window.dispatchEvent(new CustomEvent('update-plus', {detail: {all: true}})); }catch(e){}
      if(finished) U.toast('✅ Aggiorna tutti: finito. Non riusciti: ' + st.fail.length, 6000);
    }
  }

  function buttons(){
    const el = pane(); if(!el) return;
    const box = el.querySelector('#uaBtns'); if(!box) return;
    const n = st ? st.done.length : 0, total = GAMES.length;
    let h = '';
    if(live) h = `<button class="btn primary" id="uaPause" type="button">${live.paused ? '▶ Riprendi' : '⏸️ Pausa'}</button><button class="btn" id="uaStop" type="button">⏹ Ferma</button>`;
    else if(st && n < total) h = `<button class="btn primary" id="uaGo" type="button">▶ Riprendi (${n}/${total})</button><button class="btn" id="uaNew" type="button">↺ Ricomincia da capo</button>`;
    else h = `<button class="btn primary" id="uaNew" type="button">⚡ ${st ? 'Rifai tutto da capo' : 'Aggiorna tutti i giochi'}</button>`;
    if(!live && st && st.fail.length) h += `<button class="btn" id="uaFail" type="button">🔁 Riprova i ${st.fail.length} non riusciti</button>`;
    box.innerHTML = h;
    const on = (id, fn)=>{ const b = box.querySelector('#' + id); if(b) b.addEventListener('click', fn); };
    on('uaPause', ()=>{ live.paused = !live.paused; buttons(); paint(null); });
    on('uaStop', ()=>{ if(live){ live.stop = true; live.paused = false; } });
    on('uaGo', ()=> runLoop());
    on('uaNew', ()=>{
      if(st && st.done.length && !confirm('Ricomincio da capo tutti i giochi?')) return;
      st = fresh(); save(st); paint(null); runLoop();
    });
    on('uaFail', ()=>{ const ids = new Set(st.fail.map(String)); st.done = st.done.filter(i=> !ids.has(String(i))); save(st); runLoop(ids); });
  }

  function open(){
    const body = U.sheet('xUpAll', '⚡ Aggiorna tutti i giochi', `
      <div class="lp-sub">Faccio <b>Update V+</b> su ogni gioco, uno dopo l'altro: voto, anno, generi, lingua e testi dalle fonti. In più rinfresco <b>locandina</b> e <b>foto del carosello</b> dei giochi dove non le hai scelte tu (quelle con 🔒 o caricate da te restano come sono).</div>
      <div class="lp-sub">Serve tenere l'app aperta e lo schermo acceso (lo tengo acceso io). Con tanti giochi ci vogliono <b>ore</b>: puoi fermarti e riprendere quando vuoi, ricomincia da dove eri.</div>
      <div style="margin:10px 0 6px;height:12px;border-radius:8px;background:rgba(127,127,127,.25);overflow:hidden"><div id="uaBar" style="height:100%;width:0;background:var(--accent,#7c5cff);transition:width .4s"></div></div>
      <div id="uaTxt" class="lp-sub"></div><div id="uaCur" class="lp-sub"></div><div id="uaSum" class="lp-sub"></div>
      <div class="lp-tools" id="uaBtns"></div>`);
    paint(null); buttons();
  }
  window.rtUpdateAll = {open, running: ()=> !!live};
})();
