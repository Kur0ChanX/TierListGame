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

  function close(){
    if(closed) return; closed = true;
    el.classList.add('closing');
    document.documentElement.classList.remove('intro-on');
    setTimeout(()=>{ el.remove(); }, 500);
    window.removeEventListener('keydown', onKey);
  }
  // il browser permette lo schermo intero solo dopo un tocco: il tocco su "ENTRA" lo attiva e apre il programma
  function enter(){
    if(canFull){ try{ document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{}); }catch(e){} }
    close();
  }
  function onKey(e){ enter(); }
  el.addEventListener('click', enter);
  window.addEventListener('keydown', onKey);
  setTimeout(close, 12000);                            // rete di sicurezza
  if(start && canFull) start.textContent = '▶ ENTRA A SCHERMO INTERO';

  // si chiude da sola (2,2 s) solo se non c'è lo schermo intero da attivare; altrimenti aspetta il tocco
  function check(){
    if(closed) return;
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(ready && msg) msg.textContent = `${GAMES.length} giochi pronti`;
    if(timeUp && ready && !canFull){ close(); return; }
    setTimeout(check, 150);
  }
  setTimeout(()=>{ timeUp = true; }, reduce ? 1200 : 2200);
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
})();
