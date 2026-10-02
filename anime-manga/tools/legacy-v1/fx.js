// ---- Guardia di versione: se l'HTML in cache è più vecchio degli script, ricarico una volta sola saltando la cache ----
(function(){
  try{
    const mb = document.querySelector('meta[name="build"]');
    if(typeof DATA_BUILD_VERSION === 'string' && (!mb || mb.content !== DATA_BUILD_VERSION) && /^https?:$/.test(location.protocol) && !sessionStorage.getItem('atl_build_reload')){
      sessionStorage.setItem('atl_build_reload', '1');
      const urls = [location.href].concat(Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"]')).map(e=> e.src || e.href));
      Promise.all(urls.map(u=> fetch(u, {cache:'reload'}).catch(()=>{}))).then(()=> location.reload());
    }
  }catch(e){}
})();
// ---- Effetti funzionali: barra del voto nelle righe, vibrazione leggera, transizione morbida tra le viste, schermo intero, app installabile ----
(function(){
  // 1) barra del voto (variabile CSS --sc) su ogni riga della classifica
  const tb = document.getElementById('tbody');
  function paint(){ if(!tb) return; tb.querySelectorAll('td.score:not([style])').forEach(td=>{ const n = parseInt(td.textContent, 10); if(!isNaN(n)) td.style.setProperty('--sc', Math.max(0, Math.min(100, n))); }); }
  if(tb){ new MutationObserver(paint).observe(tb, {childList:true}); paint(); }
  // 2) vibrazione leggera (Android) su preferito / cuore / scarta / tab
  document.addEventListener('click', e=>{
    if(e.target.closest && e.target.closest('td.fav, .discover-btn, .view-tab, .list-chip')){ try{ navigator.vibrate && navigator.vibrate(12); }catch(_){} }
  }, true);
  // 3) dissolvenza tra le viste (dove il browser la supporta)
  if(typeof window.setView === 'function' && document.startViewTransition){
    const orig = window.setView;
    window.setView = function(v){ try{ document.startViewTransition(()=> orig(v)); }catch(e){ orig(v); } };
  }
  // 4) schermo intero
  const fs = document.getElementById('fsBtn');
  const standalone = window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches);
  if(fs){
    if(!document.documentElement.requestFullscreen || standalone){ fs.style.display = 'none'; }
    fs.addEventListener('click', ()=>{
      try{
        if(document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{ showToast('Il browser non permette lo schermo intero qui'); });
      }catch(e){}
    });
    const wrapIc = lb=> `<span class="ib-ic"><svg class="gi" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><use href="#g-screen"/></svg></span><span class="ib-lb">${lb}</span>`;
    const IC_ON = wrapIc('Esci'), IC_OFF = wrapIc('Schermo');
    document.addEventListener('fullscreenchange', ()=>{ fs.innerHTML = document.fullscreenElement ? IC_ON : IC_OFF; });
  }
  // 5) installabile come app (solo su http/https)
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){ try{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(e){} }
  // 6) interruttori dell'apertura animata e dello schermo intero (⚙️ Impostazioni)
  const it = document.getElementById('introToggle');
  if(it){ it.checked = lsGet('atl_intro', 'on') !== 'off'; it.addEventListener('change', ()=> lsSet('atl_intro', it.checked ? 'on' : 'off')); }
  const af = document.getElementById('autoFsToggle');
  if(af){ af.checked = lsGet('atl_autofs', 'on') !== 'off'; af.addEventListener('change', ()=> lsSet('atl_autofs', af.checked ? 'on' : 'off')); }
  // 7) schermo intero di default: il browser lo consente solo dopo un tocco (se l'apertura animata non c'era)
  try{
    const wantFs = lsGet('atl_autofs', 'on') !== 'off';
    const isFull = ()=> !!document.fullscreenElement || (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches));
    if(wantFs && !document.getElementById('intro') && document.documentElement.requestFullscreen && !isFull() && !navigator.webdriver){
      const once = ()=>{ document.removeEventListener('click', once, true); try{ if(!isFull()) document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{}); }catch(e){} };
      document.addEventListener('click', once, true);
    }
  }catch(e){}
  // 8) scorciatoie da tastiera (computer): "/" = cerca, 1-7 = cambia vista
  document.addEventListener('keydown', e=>{
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if(typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal-backdrop.show, .dup-backdrop.show')) return;
    if(e.key === '/'){ const s = document.getElementById('search'); if(s){ e.preventDefault(); s.focus(); } return; }
    const tabs = document.querySelectorAll('#viewTabs .view-tab');
    if(/^[1-9]$/.test(e.key) && tabs[+e.key - 1]) tabs[+e.key - 1].click();
  });
  // 9) chiusura con «indietro» del telefono: se c'è una finestra aperta, chiude quella
  window.addEventListener('popstate', ()=>{ const m = document.querySelector('.modal-backdrop.show'); if(m) m.classList.remove('show'); });
})();
