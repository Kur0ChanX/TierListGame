// ---- Guardia di versione: se la pagina (HTML) in cache è più vecchia degli script, la ricarico una volta sola saltando la cache ----
(function(){
  try{
    const mb = document.querySelector('meta[name="build"]');
    if(typeof DATA_BUILD_VERSION === 'string' && (!mb || mb.content !== DATA_BUILD_VERSION) && /^https?:$/.test(location.protocol) && !sessionStorage.getItem('jrpg_build_reload')){
      sessionStorage.setItem('jrpg_build_reload', '1');
      const urls = [location.href].concat(Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"]')).map(e=> e.src || e.href));
      Promise.all(urls.map(u=> fetch(u, {cache:'reload'}).catch(()=>{}))).then(()=> location.reload());
    }
  }catch(e){}
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
      try{ document.startViewTransition(()=> orig(v)); }catch(e){ orig(v); }
    };
  }

  // 4) schermo intero: nasconde barra del browser e barra di stato (orario, batteria)
  const fs = document.getElementById('fsBtn');
  const standalone = window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches);
  if(fs){
    if(!document.documentElement.requestFullscreen || standalone){ fs.style.display = 'none'; }
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
    try{ it.checked = localStorage.getItem('jrpg_intro') !== 'off'; }catch(e){}
    it.addEventListener('change', ()=>{ try{ localStorage.setItem('jrpg_intro', it.checked ? 'on' : 'off'); }catch(e){} });
  }
  const af = document.getElementById('autoFsToggle');
  if(af){
    try{ af.checked = localStorage.getItem('jrpg_autofs') !== 'off'; }catch(e){}
    af.addEventListener('change', ()=>{ try{ localStorage.setItem('jrpg_autofs', af.checked ? 'on' : 'off'); }catch(e){} });
  }
  // 7) schermo intero di default: il browser lo consente solo dopo un tocco, quindi al primo tocco (se l'apertura animata non c'era)
  try{
    // iPad/iPhone: nello schermo intero del browser la tastiera NON si apre (limite di Safari/Chrome su iOS), quindi lì niente schermo intero automatico
    const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const wantFs = localStorage.getItem('jrpg_autofs') !== 'off' && !apple;
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
  const sync = ()=>{
    const n = ovs().length;
    while(pushed < n){ try{ history.pushState({rtov: pushed + 1}, ''); }catch(e){} pushed++; }
    if(pushed > n){ const d = pushed - n; pushed = n; ignore += d; try{ history.go(-d); }catch(e){} }        // chiusa dal pulsante: tolgo i segni in più
  };
  new MutationObserver(sync).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']});
  window.addEventListener('popstate', ()=>{
    if(ignore > 0){ ignore--; return; }
    const el = top(); if(!el) return;
    pushed = Math.max(0, pushed - 1);
    const b = el.querySelector('[data-ui-close], .modal-close, button[id$="CloseBtn"]');
    if(b) b.click(); else el.classList.remove('show');
    setTimeout(sync, 50);
  });
  // 2) tieni premuto il titolo di un gioco: anteprima veloce (copertina, voto, trama breve) senza aprire la scheda
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

// vibrazione brevissima al tocco (come un «tic» di sistema); si può spegnere con localStorage jrpg_haptics = off
document.addEventListener('pointerdown', e=>{
  try{ if(!navigator.vibrate || e.pointerType !== 'touch' || localStorage.getItem('jrpg_haptics') === 'off') return; if(e.target.closest && e.target.closest('button, .btn, .iconbtn, .view-tab, .qf-chip, #tbody tr')) navigator.vibrate(7); }catch(x){}
}, {passive: true});
