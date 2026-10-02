// ---- Guardia di versione: se la pagina (HTML) in cache è più vecchia degli script, la ricarico una volta sola saltando la cache ----
(function(){
  try{
    const mb = document.querySelector('meta[name="build"]');
    if(typeof DATA_BUILD_VERSION === 'string' && (!mb || mb.content !== DATA_BUILD_VERSION) && /^https?:$/.test(location.protocol) && !sessionStorage.getItem('atl_build_reload')){
      sessionStorage.setItem('atl_build_reload', '1');
      // v202: con il service worker attivo basta ricaricare (lui sa quali file sono vecchi): niente raffica di richieste a GitHub
      if(navigator.serviceWorker && navigator.serviceWorker.controller){ location.reload(); }
      else {
        const urls = [location.href].concat(Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"]')).map(e=> e.src || e.href));
        Promise.all(urls.map(u=> fetch(u, {cache:'reload'}).catch(()=>{}))).then(()=> location.reload());
      }
    }
  }catch(e){}
})();
// ---- Versione nuova pubblicata mentre l'app è aperta (app installata o scheda lasciata aperta): avviso e aggiorno con un tocco ----
(function(){
  if(!/^https?:$/.test(location.protocol)) return;
  const cur = (document.querySelector('meta[name="build"]') || {}).content || '';
  let last = 0, shown = false;
  async function check(){
    if(shown || document.hidden || Date.now() - last < 10 * 60e3) return; last = Date.now();
    try{
      const t = await (await fetch(location.pathname + '?vchk=' + Date.now(), {cache: 'no-store'})).text();
      const m = /<meta name="build" content="(v\d+)"/.exec(t); if(!m || !cur || m[1] === cur) return;
      if(+m[1].slice(1) <= +cur.slice(1)) return;
      shown = true;
      const bar = document.createElement('button'); bar.type = 'button'; bar.className = 'rt-newver';
      bar.textContent = '✨ È uscita la ' + m[1] + ' (tu hai la ' + cur + '): tocca per aggiornare';
      bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));z-index:100950;padding:10px 16px;border-radius:999px;border:0;background:var(--pk-accent,#3b82f6);color:#fff;font:600 14px/1.2 inherit;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:92vw';
      bar.addEventListener('click', ()=>{ try{ sessionStorage.removeItem('atl_build_reload'); }catch(e){} bar.textContent = 'Aggiorno…'; const urls = [location.href].concat(Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"]')).map(e=> e.src || e.href)); if(navigator.serviceWorker && navigator.serviceWorker.controller) location.reload(); else Promise.all(urls.map(u=> fetch(u, {cache: 'reload'}).catch(()=>{}))).then(()=> location.reload()); });
      document.body.appendChild(bar);
    }catch(e){}
  }
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) check(); });
  setInterval(check, 15 * 60e3);
  setTimeout(check, 60e3);
})();
// ---- Misuratore della memoria del browser (localStorage, circa 5 MB): avviso una volta al giorno sopra il 70% ----
(function(){
  window.rtStorageUse = function(){
    let tot = 0; const per = [];
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i), v = localStorage.getItem(k) || ''; const n = k.length + v.length; tot += n; per.push([k, n]); } }catch(e){}
    per.sort((a, b)=> b[1] - a[1]);
    return {bytes: tot, mb: (tot / 1e6).toFixed(2), pct: Math.round(100 * tot / 5e6), top: per.slice(0, 5)};   // il limite di Chrome è circa 5 milioni di caratteri per sito
  };
  setTimeout(()=>{ try{
    let m = rtStorageUse(); const day = new Date().toISOString().slice(0, 10);
    if(m.pct >= 70){ try{ window.__emergencyClean && __emergencyClean(); }catch(e){} m = rtStorageUse(); }      // v214: prima libero da solo quello che si può rigenerare
    if(m.pct >= 70 && localStorage.getItem('art_storage_warn') !== day){ localStorage.setItem('art_storage_warn', day); if(window.showToast) showToast('💾 La memoria del browser è piena al ' + m.pct + '%: fai un backup da ✨ → Backup e spazio, e dillo a Claude (le voci più pesanti: ' + m.top.slice(0, 3).map(x=> x[0].replace(/^atl_|^rt_/, '')).join(', ') + ').', 9000); }
  }catch(e){} }, 20000);
})();
// ---- Effetti funzionali: barra voto nelle righe, vibrazione leggera, transizione morbida tra le schede ----
(function(){
  // 1) barra del voto (variabile CSS --sc) su ogni riga della classifica
  const tb = document.getElementById('tbody');
  function paint(){ if(!tb) return; tb.querySelectorAll('td.score:not([style])').forEach(td=>{ const n = parseInt(td.textContent, 10); if(!isNaN(n)) td.style.setProperty('--sc', Math.max(0, Math.min(100, n))); }); }
  if(tb){ new MutationObserver(paint).observe(tb, {childList:true}); paint(); }

  // 2) vibrazione leggera (Android) su preferito / cuore / scarta / tab
  document.addEventListener('click', e=>{
    if(e.target.closest && e.target.closest('td.fav, .discover-btn, .view-tab, .list-chip')){ try{ navigator.vibrate && navigator.vibrate(12); }catch(_){} }
  }, true);

  // 3) transizione a dissolvenza tra le schede (dove il browser la supporta)
  if(typeof window.setView === 'function' && document.startViewTransition){
    const orig = window.setView;
    window.setView = function(v){
      // v210: se il passaggio animato l'ha già avviato motion.js (barra in basso, data-vt), NON ne avvio un secondo dentro il primo:
      // si annullavano a vicenda e lo scivolamento tra le sezioni saltava o si vedeva a metà
      if(window.__rtInstantViews || document.documentElement.hasAttribute('data-vt') || document.documentElement.classList.contains('mo-off')) return orig(v);      // v212: sezioni istantanee (pagine.js)
      try{ document.startViewTransition(()=> orig(v)); }catch(e){ orig(v); }
    };
  }

  // 4) schermo intero: nasconde barra del browser e barra di stato (orario, batteria)
  const fs = document.getElementById('fsBtn');
  const standalone = window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches);
  if(fs){
    // v208: anche nell'app installata (standalone) lo schermo intero serve a nascondere la barra di stato: il pulsante resta
    if(!document.documentElement.requestFullscreen || (window.matchMedia && matchMedia('(display-mode: fullscreen)').matches)){ fs.style.display = 'none'; }
    fs.addEventListener('click', ()=>{
      try{
        if(document.fullscreenElement){ document.exitFullscreen(); }
        else { document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{ if(typeof showToast === 'function') showToast('Il browser non permette lo schermo intero qui'); }); }
      }catch(e){}
    });
    const wrapIc = lb=> `<span class="ib-ic"><svg class="gi" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><use href="#g-screen"/></svg></span><span class="ib-lb">${lb}</span>`;
    const IC_ON = wrapIc('Esci'), IC_OFF = wrapIc('Schermo');
    document.addEventListener('fullscreenchange', ()=>{ fs.innerHTML = document.fullscreenElement ? IC_ON : IC_OFF; });
  }

  // 5) installabile come app (solo su http/https, mai dentro Claude)
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !(window.claude && window.claude.use)){
    try{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(e){}
  }

  // 6) interruttore dell'apertura animata (⚙️ Impostazioni)
  const it = document.getElementById('introToggle');
  if(it){
    try{ it.checked = localStorage.getItem('atl_intro') !== 'off'; }catch(e){}
    it.addEventListener('change', ()=>{ try{ localStorage.setItem('atl_intro', it.checked ? 'on' : 'off'); }catch(e){} });
  }
  const af = document.getElementById('autoFsToggle');
  if(af){
    try{ af.checked = localStorage.getItem('atl_autofs') !== 'off'; }catch(e){}
    af.addEventListener('change', ()=>{ try{ localStorage.setItem('atl_autofs', af.checked ? 'on' : 'off'); }catch(e){} });
  }
  // 7) schermo intero di default: il browser lo consente solo dopo un tocco, quindi al primo tocco (se l'apertura animata non c'era)
  try{
    // iPad/iPhone: nello schermo intero del browser la tastiera NON si apre (limite di Safari/Chrome su iOS), quindi lì niente schermo intero automatico
    const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const wantFs = localStorage.getItem('atl_autofs') !== 'off' && !apple;
    // rete di sicurezza: se si tocca un campo di testo mentre si è a schermo intero, ne esco subito così la tastiera può aprirsi
    document.addEventListener('focusin', e=>{ try{ if(document.fullscreenElement && e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) document.exitFullscreen(); }catch(x){} }, true);
    const isFull = ()=> !!document.fullscreenElement || (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches));
    if(wantFs && !document.getElementById('intro') && document.documentElement.requestFullscreen && !isFull() && !navigator.webdriver){
      const once = ()=>{ document.removeEventListener('click', once, true); try{ if(!isFull()) document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{}); }catch(e){} };
      document.addEventListener('click', once, true);
    }
  }catch(e){}
  // 8) Frugu Frugu in basso al centro, grande quanto lo spazio libero sotto la lista (mai oltre 170 px, mai sopra i contenuti)
  const ff = document.querySelector('.frugu-foot');
  if(ff){
    const img = ff.querySelector('img');
    let raf = 0;
    const place = ()=>{
      raf = 0;
      const w = document.querySelector('.wrap');
      const vis = Array.from(w.children).filter(x=> x.offsetHeight > 0 && getComputedStyle(x).position !== 'fixed');
      const last = vis[vis.length - 1];
      const bottom = last ? last.getBoundingClientRect().bottom : 0;
      const nav = document.getElementById('viewTabs');
      const floor = (nav && getComputedStyle(nav).position === 'fixed') ? nav.getBoundingClientRect().top : innerHeight;   // sul telefono la barra di navigazione sta in basso
      const room = floor - bottom - 14;
      const h = Math.min(170, room);
      if(h >= 60){ ff.style.setProperty('--fh', Math.round(h) + 'px'); ff.classList.add('show'); }
      else ff.classList.remove('show');
    };
    const sched = ()=>{ if(!raf) raf = requestAnimationFrame(place); };
    window.addEventListener('resize', sched); window.addEventListener('scroll', sched, {passive:true});
    try{ const ro = new ResizeObserver(sched); ro.observe(document.querySelector('.wrap')); Array.from(document.querySelector('.wrap').children).forEach(x=> ro.observe(x)); }catch(e){}
    document.addEventListener('click', ()=> setTimeout(sched, 60), true);   // pannelli che si aprono/chiudono (Filtri, generi...)
    if(img && !img.complete) img.addEventListener('load', sched);
    sched(); setTimeout(sched, 600);
  }
  // 9) scorciatoie da tastiera (computer): "/" = cerca, 1-7 = cambia vista
  document.addEventListener('keydown', e=>{
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if(typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal-backdrop.show')) return;
    if(e.key === '/'){ const s = document.getElementById('search'); if(s){ e.preventDefault(); s.focus(); } return; }
    const tabs = document.querySelectorAll('#viewTabs .view-tab');
    if(/^[1-9]$/.test(e.key) && tabs[+e.key - 1]){ tabs[+e.key - 1].click(); }
  });
  // 10) filtri rapidi (usano gli stessi comandi del pannello) + numero di filtri attivi sul pulsante Filtri
  const qf = document.getElementById('quickFilters'), badge = document.getElementById('filtersBadge');
  const setSel = (id, v)=>{ const el = document.getElementById(id); if(el){ el.value = v; el.dispatchEvent(new Event('change')); } };
  function syncQuick(){
    if(typeof state === 'undefined') return;
    const on = {fav: state.onlyFavs, played: state.status === 'played', playing: state.status === 'playing', backlog: state.status === 'backlog', top: state.minScore === '90', story: state.onlyStory};
    if(qf) qf.querySelectorAll('[data-qf]').forEach(b=> b.classList.toggle('active', !!on[b.dataset.qf]));
    const n = [state.onlyFavs, state.status, state.minScore, state.onlyStory, state.method, state.decade, state.mood, state.tags && state.tags.size, state.tiers && state.tiers.size].filter(Boolean).length;
    if(badge){ badge.hidden = !n; badge.textContent = n; }
  }
  if(qf) qf.addEventListener('click', e=>{
    const b = e.target.closest('[data-qf]'); if(!b) return;
    const k = b.dataset.qf;
    if(k === 'fav'){ const fb = document.getElementById('favBtn'); if(fb) fb.click(); }
    else if(k === 'played' || k === 'playing' || k === 'backlog') setSel('statusFilter', state.status === k ? '' : k);
    else if(k === 'top') setSel('scoreFilter', state.minScore === '90' ? '' : '90');
    else if(k === 'story') setSel('storyFilter', state.onlyStory ? '' : 'yes');
    else if(k === 'reset'){ const rb = document.getElementById('resetBtn'); if(rb) rb.click(); }
    syncQuick();
  });
  // si aggiorna anche quando i filtri cambiano da altri comandi (tier, generi, reset...)
  const tbq = document.getElementById('tbody');
  if(tbq) new MutationObserver(syncQuick).observe(tbq, {childList:true});
  document.addEventListener('change', syncQuick);
  syncQuick();
})();

// ---- v168: «indietro» del telefono chiude la scheda (non esce dal programma) + anteprima veloce con pressione lunga sul titolo ----
(function(){
  // 1) gesto/tasto indietro: ogni finestra aperta (scheda, news, chiedi, profilo…) mette un segno nella cronologia; «indietro» la chiude
  const ovs = ()=> Array.from(document.querySelectorAll('[id$="Backdrop"].show, .dup-backdrop.show'));
  let pushed = 0, ignore = 0;
  const top = ()=>{ const l = ovs(); return l.sort((a, b)=> (parseInt(getComputedStyle(b).zIndex, 10) || 0) - (parseInt(getComputedStyle(a).zIndex, 10) || 0))[0]; };
  // v218: «etichette» sul corpo della pagina al posto delle regole CSS con :has() (ogni ricalcolo degli stili le doveva verificare scorrendo TUTTA la pagina: decine di ms)
  const flip = (el, c, on)=>{ if(el && el.classList.contains(c) !== on) el.classList.toggle(c, on); };
  const states = l=>{
    const b = document.body, id = x=> l.some(e=> e.id === x);
    flip(b, 'rt-mopen', l.length > 0); flip(b, 'rt-gopen', id('modalBackdrop')); flip(b, 'rt-ask', id('askBackdrop'));
    flip(b, 'rt-sheet', !!document.querySelector('.x-sheet.show, .tt2.show'));
    const fp = document.getElementById('filtersPanel'), fo = !!(fp && fp.classList.contains('open'));
    flip(document.documentElement, 'rt-filt', fo); flip(b, 'rt-filt', fo); flip(document.querySelector('.wrap'), 'rt-filt', fo); flip(document.querySelector('.topbar'), 'rt-filt', fo);
    const rn = document.getElementById('rtNote'); flip(b, 'rt-noteon', !!(rn && rn.classList.contains('show')));
  };
  const sync = ()=>{
    const lst = ovs(), n = lst.length; states(lst);
    while(pushed < n){ try{ history.pushState({rtov: pushed + 1}, ''); }catch(e){} pushed++; }
    if(pushed > n){ const d = pushed - n; pushed = n; ignore += d; window.__rtSelfPops = (window.__rtSelfPops || 0) + d; try{ history.go(-d); }catch(e){} }        // chiusa dal pulsante: tolgo i segni in più
    if(n > lastN) openedT = performance.now(); lastN = n;
  };
  let openedT = 0, lastN = 0;
  // si riguarda solo quando cambia un «show» o «open» (prima a ogni cambio di classe di qualsiasi riga della lista)
  new MutationObserver(recs=>{ for(const r of recs){ const o = r.oldValue || ''; if(r.target.classList.contains('show') || r.target.classList.contains('open') || o.indexOf('show') > -1 || o.indexOf('open') > -1){ sync(); return; } } })
    .observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true});
  sync();
  // la lista vuota («nessun risultato») nasconde la tabella: etichetta sul contenitore
  try{ const em = document.getElementById('emptyMsg'), wr = document.querySelector('.wrap'); if(em && wr){ const f = ()=> flip(wr, 'rt-empty', !/none/.test(em.getAttribute('style') || '')); new MutationObserver(f).observe(em, {attributes: true, attributeFilter: ['style']}); f(); } }catch(e){}
  window.addEventListener('popstate', e=>{
    // v217: dopo ogni «indietro» rileggo dalla cronologia quanti segni ci sono davvero (prima li contavo a memoria e il conto poteva sballare)
    const st = e.state, depth = st && st.rtov ? st.rtov : 0;
    // un «indietro» partito dal programma stesso non chiude niente
    if((window.rtSelfPop && window.rtSelfPop(e)) || ignore > 0){
      if(ignore > 0) ignore--;
      if(!ignore && !(window.__rtSelfPops > 0)){ pushed = depth; setTimeout(sync, 0); }
      return;
    }
    pushed = depth;
    const el = top(); if(!el) return;
    // una finestra appena aperta (meno di 0,4 s) non può essere chiusa da un «indietro» vero: è un segnale in ritardo → rimetto il segno
    if(performance.now() - openedT < 400){ setTimeout(sync, 0); return; }
    const b = el.querySelector('[data-ui-close], .modal-close, button[id$="CloseBtn"]');
    if(b) b.click(); else el.classList.remove('show');
    setTimeout(sync, 50);
  });
  // 2) tieni premuto il titolo di un titolo: anteprima veloce (copertina, voto, trama breve) senza aprire la scheda
  let timer = 0, sx = 0, sy = 0, fired = 0;
  const cell = t=> t && t.closest && t.closest('#tbody tr td:nth-child(3)');
  const start = (t, x, y)=>{
    const c = cell(t); if(!c) return; const tr = c.closest('tr'), g = (typeof GAMES !== 'undefined' ? GAMES : []).find(v=> String(v.id) === tr.dataset.gid); if(!g) return;
    sx = x; sy = y; clearTimeout(timer);
    timer = setTimeout(()=>{ fired = Date.now(); try{ navigator.vibrate && navigator.vibrate(18); }catch(e){} preview(g); }, 450);
  };
  let peekOpen = false;
  const cancel = ()=>{ clearTimeout(timer); if(peekOpen){ peekOpen = false; const pv = document.getElementById('pvBackdrop'); if(pv) pv.classList.remove('show'); } };       // anteprima «a pressione»: rilasci il dito e sparisce
  document.addEventListener('touchstart', e=>{ const t = e.touches[0]; start(e.target, t.clientX, t.clientY); }, {passive: true});
  document.addEventListener('touchmove', e=>{ const t = e.touches[0]; if(Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) cancel(); }, {passive: true});
  ['touchend', 'touchcancel'].forEach(n=> document.addEventListener(n, cancel, {passive: true}));
  document.addEventListener('mousedown', e=>{ if(e.button === 0) start(e.target, e.clientX, e.clientY); });
  ['mouseup', 'mouseleave'].forEach(n=> document.addEventListener(n, cancel));
  document.addEventListener('contextmenu', e=>{ if(cell(e.target)) e.preventDefault(); });
  document.addEventListener('click', e=>{ if(Date.now() - fired < 700 && cell(e.target)){ e.stopPropagation(); e.preventDefault(); } }, true);       // il rilascio dopo la pressione lunga non apre la scheda
  function preview(g){
    let el = document.getElementById('pvBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'pvBackdrop'; el.className = 'dup-backdrop'; el.style.zIndex = 100800; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
    const cov = typeof effectiveCover === 'function' ? effectiveCover(g) : null, l = g.label || {};
    const story = String(g.story || '').replace(/\s+/g, ' ').trim();
    el.innerHTML = `<div class="lp-card pv-card"><div class="lp-head"><b>${esc(g.name)}</b></div>
      ${cov ? `<img class="pv-cover" src="${esc(cov)}" alt="">` : (typeof coverPlaceholderHtml === 'function' ? coverPlaceholderHtml(g) : '')}
      <div class="pv-badges"><span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span><span class="badge big outline">${typeof scoreTxt === 'function' ? scoreTxt(g) : g.score}${g.tier === 'ND' ? '' : '/100'}</span><span class="badge big outline">${typeof srcIcon === 'function' ? srcIcon(g) : ''}</span><span style="opacity:.8">${esc(g.plat)}${g.year ? ' · ' + esc(g.year) : ''}</span></div>
      ${story ? `<div class="pv-line">${esc(story.slice(0, 230))}${story.length > 230 ? '…' : ''}</div>` : ''}
      ${l.ok ? `<div class="pv-line">🟢 <b>Fa per te se</b> ${esc(l.ok)}</div>` : ''}${l.ko ? `<div class="pv-line">🔴 <b>Lascia stare se</b> ${esc(l.ko)}</div>` : ''}
      <div class="pv-line" style="opacity:.6">Rilascia per chiudere · tocca il titolo per aprire la scheda</div></div>`;
    el.classList.add('show'); peekOpen = true;
  }
})();

// vibrazione brevissima al tocco (come un «tic» di sistema); si può spegnere con localStorage atl_haptics = off
document.addEventListener('pointerdown', e=>{
  try{ if(!navigator.vibrate || e.pointerType !== 'touch' || localStorage.getItem('atl_haptics') === 'off') return; if(e.target.closest && e.target.closest('button, .btn, .iconbtn, .view-tab, .qf-chip, #tbody tr')) navigator.vibrate(7); }catch(x){}
}, {passive: true});

// v170: palloncini (toast) — il tocco non passa più alla riga sotto, e toccarli li chiude; l'anteprima a pressione sostituisce quella vecchia dei «gesti rapidi»
window.__rtHoldPreview = true;
document.addEventListener('click', e=>{
  const t = e.target && e.target.closest && e.target.closest('#toast.show, #addedBanner.show');
  if(t){ const fn = t._tap; t._tap = null; t.classList.remove('show', 'tappable'); e.stopPropagation(); e.preventDefault(); if(fn){ try{ fn(); }catch(x){} } }
}, true);
