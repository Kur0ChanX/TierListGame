// ---- Effetti funzionali: barra voto nelle righe, vibrazione leggera, transizione morbida tra le schede ----
(function(){
  // 1) barra del voto (variabile CSS --sc) su ogni riga della classifica
  const tb = document.getElementById('tbody');
  function paint(){ if(!tb) return; tb.querySelectorAll('td.score').forEach(td=>{ const n = parseInt(td.textContent, 10); if(!isNaN(n)) td.style.setProperty('--sc', Math.max(0, Math.min(100, n))); }); }
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
    try{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(e){}
  }
})();
