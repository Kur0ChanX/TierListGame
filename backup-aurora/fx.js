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
    const IC_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
    const IC_OFF = fs.innerHTML;
    document.addEventListener('fullscreenchange', ()=>{ fs.innerHTML = document.fullscreenElement ? IC_ON : IC_OFF; });
  }

  // 5) installabile come app (solo su http/https, mai dentro Claude)
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !(window.claude && window.claude.use)){
    try{ Promise.resolve().catch(()=>{}); }catch(e){}
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
    const wantFs = localStorage.getItem('jrpg_autofs') !== 'off';
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
