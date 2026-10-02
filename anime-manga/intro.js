// ---- Schermata d'apertura animata (Raccoon Tier) ----
// Tocca «Inizia a frugare» (o premi un tasto) per entrare: aspetta il tuo tocco. Si vede una volta per sessione; si disattiva da ⚙️ Impostazioni.
(function(){
  const el = document.getElementById('intro');
  if(!el) return;
  const forced = /[?&]intro=force/.test(location.search);
  let off = false, seen = false;
  try{ off = localStorage.getItem('atl_intro') === 'off'; seen = sessionStorage.getItem('atl_intro_seen') === '1'; }catch(e){}
  if(/[?&]shared=/.test(location.search)) seen = true;           // v217: aperta da «Condividi immagine»: niente intro, si va dritti alla locandina
  const bot = !!navigator.webdriver;                   // i test automatici non devono essere coperti dall'intro
  if(!forced && (off || seen || bot)){ el.remove(); return; }
  try{ sessionStorage.setItem('atl_intro_seen', '1'); }catch(e){}
  document.documentElement.classList.add('intro-on');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const msg = el.querySelector('.intro-msg'), start = el.querySelector('.intro-start');
  let closed = false, timeUp = false, pressV = false;
  const isFull = ()=> !!document.fullscreenElement || (window.matchMedia && matchMedia('(display-mode: fullscreen)').matches);   // v208: l'app installata (standalone) NON è a schermo intero: lo schermo intero si attiva comunque
  const canFull = !!document.documentElement.requestFullscreen && !isFull();   // iPhone/Safari e app installata: niente da fare o già a schermo intero

  const wantFs = (()=>{ try{ return localStorage.getItem('atl_autofs') !== 'off'; }catch(e){ return true; } })();
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
  // v214: piccolo suono d'ingresso (due note rapide, creato nel telefono: nessun file). Niente suono se i suoni sono spenti in ✨ → Suoni.
  // v224: il contesto audio nasce quando il dito tocca lo schermo (non a tocco finito) e il suono parte subito: niente attesa e niente «coda» (tre note brevi, fine netta dopo ~0,3 s)
  let ac = null;
  function prime(){
    try{
      if(localStorage.getItem('atl_sfx') === 'off') return;
      const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
      if(!ac) ac = new AC(); if(ac.state === 'suspended') ac.resume();
    }catch(e){}
  }
  function chime(){
    try{
      if(!ac || localStorage.getItem('atl_sfx') === 'off') return;
      const now = ac.currentTime + .005, vol = Math.max(0, Math.min(1, +(localStorage.getItem('atl_sfx_vol') || .6))) * .2, out = ac.createGain(); out.gain.value = vol; out.connect(ac.destination);
      [[783.99, 0, .11], [1174.66, .06, .13], [1567.98, .12, .2]].forEach(([f, t, d])=>{
        const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + t); g.gain.exponentialRampToValueAtTime(1, now + t + .008); g.gain.exponentialRampToValueAtTime(.0001, now + t + d);
        o.connect(g); g.connect(out); o.start(now + t); o.stop(now + t + d + .02);
      });
      setTimeout(()=>{ try{ out.disconnect(); }catch(e){} }, 600);
    }catch(e){}
  }
  el.addEventListener('pointerdown', ()=>{ prime(); if(!pressV){ pressV = true; try{ navigator.vibrate && navigator.vibrate(8); }catch(e){} } }, {passive: true});
  el.addEventListener('pointerup', ()=>{ pressV = false; }, {passive: true}); el.addEventListener('pointercancel', ()=>{ pressV = false; }, {passive: true});
  let entering = false;
  function enter(){
    if(closed || entering) return;
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(!ready){ wantIn = true; if(start) start.textContent = '⏳ UN ATTIMO…'; return; }     // toccato prima che i giochi siano pronti: entro appena lo sono
    entering = true;
    guardTaps();
    prime(); chime();
    try{ navigator.vibrate && navigator.vibrate([0, 18]); }catch(e){}
    // v224: lo schermo intero cambia l'altezza della finestra: fermo la locandina alla misura di adesso (non si muove, niente bande) e apro l'app solo a finestra assestata
    const fr = el.querySelector('.intro-frame'); if(fr){ const r = fr.getBoundingClientRect(); fr.style.width = r.width + 'px'; fr.style.height = r.height + 'px'; fr.style.flex = 'none'; }
    if(start) start.classList.add('hit');                              // il pulsante fa «pop» con un anello di luce…
    const go = ()=>{ el.classList.add('entering'); setTimeout(close, reduce ? 0 : 230); };      // …e la schermata si apre in avanti
    if(canFull && wantFs){
      let done = false; const fin = ()=>{ if(done) return; done = true; window.removeEventListener('resize', onR); setTimeout(go, 60); };
      const onR = ()=>{ clearTimeout(onR.t); onR.t = setTimeout(fin, 90); };      // finestra ferma per 90 ms = assestata
      window.addEventListener('resize', onR);
      setTimeout(fin, 380);                                                        // se il telefono non cambia nulla, non aspetto oltre
      try{ document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(fin); }catch(e){ fin(); }
    } else go();
  }
  let wantIn = false;
  function onKey(e){ enter(); }
  el.addEventListener('click', e=>{ e.stopPropagation(); e.preventDefault(); enter(); });
  window.addEventListener('keydown', onKey);
  if(start) start.textContent = '▶ INIZIA A FRUGARE';                  // v214: aspetta SEMPRE il tuo tocco (anche nell'app installata)

  // si chiude da sola (2,2 s) solo se non c'è lo schermo intero da attivare; altrimenti aspetta il tocco
  function check(){
    if(closed) return;
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(ready && msg) msg.textContent = `${GAMES.length} giochi pronti`;
    if(ready && start && !start.classList.contains('ready')){ start.classList.add('ready'); if(!wantIn) start.textContent = '▶ INIZIA A FRUGARE'; }
    if(ready && wantIn){ enter(); return; }
    setTimeout(check, 150);
  }
  setTimeout(()=>{ timeUp = true; }, reduce ? 1200 : 2200);
  // v202: se dopo 9 secondi i giochi non ci sono, quasi sempre è GitHub che rifiuta (troppe richieste dalla tua rete):
  // lo dico chiaramente e riprovo da solo (al massimo 3 volte), invece di restare fermo su «Carico la tua collezione…»
  let touched = false; window.addEventListener('pointerdown', ()=>{ touched = true; }, {capture: true, once: true});
  setTimeout(()=>{
    if(closed || touched || (typeof GAMES !== 'undefined' && GAMES.length)) return;       // mai ricaricare mentre stai toccando lo schermo
    let n = 0; try{ n = +(sessionStorage.getItem('art_boot_retry') || 0); }catch(e){}
    if(msg) msg.textContent = n < 3 ? 'Il sito di GitHub è sovraccarico in questo momento: riprovo da solo…' : 'GitHub non risponde dalla tua rete. Prova a spegnere e riaccendere i dati (o il Wi-Fi) e riapri.';
    if(n < 3){ try{ sessionStorage.setItem('art_boot_retry', String(n + 1)); }catch(e){} setTimeout(()=> location.reload(), 4000 + n * 6000); }
  }, 9000);
  window.addEventListener('load', ()=>{ setTimeout(()=>{ if(typeof GAMES !== 'undefined' && GAMES.length){ try{ sessionStorage.removeItem('art_boot_retry'); }catch(e){} } }, 500); });
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
  // (v214: solo se hai GIÀ toccato e qualcosa si è inceppato; altrimenti aspetta il tuo tocco quanto vuoi)
  setInterval(()=>{ const e = document.getElementById('intro'); if(e && !closed && (wantIn || entering) && typeof GAMES !== 'undefined' && GAMES.length){ close(); } if(!e) document.documentElement.classList.remove('intro-on'); }, 2000);
})();
