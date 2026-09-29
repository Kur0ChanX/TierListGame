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
  const DURATION = reduce ? 1400 : 4600;
  const msg = el.querySelector('.intro-msg');
  let closed = false, timeUp = false;

  function close(){
    if(closed) return; closed = true;
    el.classList.add('closing');
    document.documentElement.classList.remove('intro-on');
    setTimeout(()=>{ el.remove(); }, 600);
    window.removeEventListener('keydown', close);
  }
  el.addEventListener('pointerdown', close);
  window.addEventListener('keydown', close);
  setTimeout(close, 15000);                            // rete di sicurezza

  // si chiude quando la barra (CSS) è piena E i dati sono pronti; niente animazioni JS che possano scattare durante il caricamento
  function check(){
    if(closed) return;
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(ready && msg) msg.textContent = `${GAMES.length} giochi pronti`;
    if(timeUp && ready){ close(); return; }
    setTimeout(check, 200);
  }
  setTimeout(()=>{ timeUp = true; }, reduce ? 1400 : 4600);
  check();

  // stelline e lucine che brillano (solo CSS)
  const sp = el.querySelector('.intro-sparks');
  if(sp && !reduce){
    const colors = ['#ff6ec7','#7c5cff','#38bdf8','#ffe066','#7CFFB2','#ff9f43'];
    let h = '';
    for(let i = 0; i < 26; i++){
      h += `<s style="left:${(Math.random()*94).toFixed(1)}%;top:${(Math.random()*92).toFixed(1)}%;--s:${(8+Math.random()*16).toFixed(0)}px;--c:${colors[i%colors.length]};--d:${(1.4+Math.random()*1.6).toFixed(2)}s;--w:${(Math.random()*3).toFixed(2)}s"></s>`;
    }
    sp.innerHTML = h;
  }
})();
