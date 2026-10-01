// ---- Schermata d'apertura animata (Raccoon Tier) ----
// Tocca o premi un tasto per entrare; si chiude da sola. Si vede una volta per sessione; si disattiva da ⚙️ Impostazioni.
(function(){
  const el = document.getElementById('intro');
  if(!el) return;
  const forced = /[?&]intro=force/.test(location.search);
  let off = false, seen = false;
  try{ off = localStorage.getItem('jrpg_intro') === 'off'; seen = sessionStorage.getItem('jrpg_intro_seen') === '1'; }catch(e){}
  const bot = !!navigator.webdriver;                   // i test automatici non devono essere coperti dall'intro
  if(!forced && (off || seen || bot)){ el.remove(); return; }
  try{ sessionStorage.setItem('jrpg_intro_seen', '1'); }catch(e){}
  document.documentElement.classList.add('intro-on');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const msg = el.querySelector('.intro-msg'), start = el.querySelector('.intro-start');
  let closed = false, timeUp = false;
  const isFull = ()=> !!document.fullscreenElement || (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches));
  const canFull = !!document.documentElement.requestFullscreen && !isFull();   // iPhone/Safari e app installata: niente da fare o già a schermo intero

  const wantFs = (()=>{ try{ return localStorage.getItem('jrpg_autofs') !== 'off'; }catch(e){ return true; } })();
  function close(){
    if(closed) return; closed = true;
    el.classList.add('closing');
    document.documentElement.classList.remove('intro-on');
    setTimeout(()=>{ el.style.pointerEvents = 'none'; }, 350);     // v206: dopo 0,35 s non intercetta più nessun tocco (prima restava 0,7 s: News e le icone in alto sembravano bloccate)
    setTimeout(()=>{ el.remove(); document.documentElement.classList.remove('intro-on'); }, 700);
    window.removeEventListener('keydown', onKey);
  }
  // dopo "Entra" ignoriamo per un attimo ogni tocco/click residuo, così non apre per sbaglio un gioco
  function swallow(e){ e.stopPropagation(); e.preventDefault(); }
  function guardTaps(){ ['click','pointerup','pointerdown','touchend','mouseup','mousedown'].forEach(n=> window.addEventListener(n, swallow, true)); setTimeout(()=> ['click','pointerup','pointerdown','touchend','mouseup','mousedown'].forEach(n=> window.removeEventListener(n, swallow, true)), 330); }
  // il browser permette lo schermo intero solo dopo un tocco: il tocco su "ENTRA" lo attiva e apre il programma
  function enter(){
    if(closed) return;
    guardTaps();
    if(canFull && wantFs){ try{ document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{}); }catch(e){} }
    close();
  }
  function onKey(e){ enter(); }
  el.addEventListener('click', e=>{ e.stopPropagation(); e.preventDefault(); enter(); });
  window.addEventListener('keydown', onKey);
  setTimeout(()=>{ if(typeof GAMES !== 'undefined' && GAMES.length) close(); }, 12000);   // rete di sicurezza (non chiudo su una pagina vuota)
  if(start && canFull && wantFs) start.textContent = '▶ INIZIA A FRUGARE';

  // si chiude da sola (2,2 s) solo se non c'è lo schermo intero da attivare; altrimenti aspetta il tocco
  function check(){
    if(closed) return;
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(ready && msg) msg.textContent = `${GAMES.length} giochi pronti`;
    if(timeUp && ready && !(canFull && wantFs)){ close(); return; }
    setTimeout(check, 150);
  }
  setTimeout(()=>{ timeUp = true; }, reduce ? 1200 : 2200);
  // v202: se dopo 9 secondi i giochi non ci sono, quasi sempre è GitHub che rifiuta (troppe richieste dalla tua rete):
  // lo dico chiaramente e riprovo da solo (al massimo 3 volte), invece di restare fermo su «Carico la tua collezione…»
  let touched = false; window.addEventListener('pointerdown', ()=>{ touched = true; }, {capture: true, once: true});
  setTimeout(()=>{
    if(closed || touched || (typeof GAMES !== 'undefined' && GAMES.length)) return;       // mai ricaricare mentre stai toccando lo schermo
    let n = 0; try{ n = +(sessionStorage.getItem('rt_boot_retry') || 0); }catch(e){}
    if(msg) msg.textContent = n < 3 ? 'Il sito di GitHub è sovraccarico in questo momento: riprovo da solo…' : 'GitHub non risponde dalla tua rete. Prova a spegnere e riaccendere i dati (o il Wi-Fi) e riapri.';
    if(n < 3){ try{ sessionStorage.setItem('rt_boot_retry', String(n + 1)); }catch(e){} setTimeout(()=> location.reload(), 4000 + n * 6000); }
  }, 9000);
  window.addEventListener('load', ()=>{ setTimeout(()=>{ if(typeof GAMES !== 'undefined' && GAMES.length){ try{ sessionStorage.removeItem('rt_boot_retry'); }catch(e){} } }, 500); });
  check();

  // stelline e coriandoli (solo CSS, partono subito)
  const sp = el.querySelector('.intro-sparks');
  if(sp){
    const colors = ['#ff6ec7','#7c5cff','#38bdf8','#ffe066','#7CFFB2','#ff9f43'];
    const R = (a, b)=> a + Math.random() * (b - a);
    let h = '';
    for(let i = 0; i < 22; i++) h += `<s style="left:${R(2,94).toFixed(1)}%;top:${R(2,90).toFixed(1)}%;--s:${R(14,30).toFixed(0)}px;--c:${colors[i%colors.length]};--d:${R(.9,1.8).toFixed(2)}s;--w:-${R(0,1.8).toFixed(2)}s">✦</s>`;
    for(let i = 0; i < 34; i++) h += `<u style="left:${R(0,100).toFixed(1)}%;--w2:${R(5,9).toFixed(0)}px;--h2:${R(8,15).toFixed(0)}px;--c:${colors[i%colors.length]};--dx:${R(-40,40).toFixed(0)}px;--d:${R(2.4,4.2).toFixed(2)}s;--w:-${R(0,4).toFixed(2)}s"></u>`;
    sp.innerHTML = h;
  }
  // rete di sicurezza finale: se per qualsiasi motivo la schermata d'apertura resta in piedi con i giochi pronti, la tolgo (non deve mai coprire l'app)
  setInterval(()=>{ const e = document.getElementById('intro'); if(e && !closed && typeof GAMES !== 'undefined' && GAMES.length && performance.now() > 20000){ close(); } if(!e) document.documentElement.classList.remove('intro-on'); }, 2000);
})();
