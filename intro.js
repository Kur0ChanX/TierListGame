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
  const bar = el.querySelector('.intro-bar i'), msg = el.querySelector('.intro-msg');
  const t0 = performance.now();
  let closed = false;

  function close(){
    if(closed) return; closed = true;
    el.classList.add('closing');
    document.documentElement.classList.remove('intro-on');
    setTimeout(()=>{ el.remove(); }, 700);
    window.removeEventListener('keydown', close);
  }
  el.addEventListener('pointerdown', close);
  window.addEventListener('keydown', close);
  setTimeout(close, 15000);                            // rete di sicurezza

  function tick(){
    if(closed) return;
    const p = Math.min(1, (performance.now() - t0) / DURATION);
    const ready = typeof GAMES !== 'undefined' && GAMES.length;
    if(bar) bar.style.width = (ready ? p * 100 : Math.min(p, .85) * 100) + '%';
    if(msg && ready) msg.textContent = `${GAMES.length} giochi pronti`;
    if(p >= 1 && ready){ close(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // coriandoli e stelline al neon
  const cv = el.querySelector('canvas');
  if(cv && !reduce){
    const ctx = cv.getContext('2d');
    const colors = ['#ff6ec7','#7c5cff','#38bdf8','#ffe066','#7CFFB2','#ff9f43'];
    let W = 0, H = 0;
    const size = ()=>{ W = cv.width = el.clientWidth; H = cv.height = el.clientHeight; };
    size(); window.addEventListener('resize', size);
    const N = Math.min(70, Math.round(el.clientWidth / 8));
    const ps = Array.from({length: N}, ()=> ({x: Math.random(), y: Math.random() + .2, v: .0006 + Math.random() * .0016, s: 3 + Math.random() * 6, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6, w: (Math.random() - .5) * .0004, star: Math.random() < .5}));
    (function draw(){
      if(closed){ return; }
      ctx.clearRect(0, 0, W, H);
      ps.forEach(q=>{
        q.y -= q.v; q.x += q.w; q.r += .03;
        if(q.y < -.05){ q.y = 1.05; q.x = Math.random(); }
        const X = q.x * W, Y = q.y * H;
        ctx.save(); ctx.translate(X, Y); ctx.rotate(q.r); ctx.fillStyle = q.c; ctx.globalAlpha = .85;
        if(q.star){ ctx.beginPath(); for(let i = 0; i < 8; i++){ const rad = i % 2 ? q.s * .35 : q.s; const a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(-q.s / 2, -q.s / 3, q.s, q.s * .66);
        ctx.restore();
      });
      requestAnimationFrame(draw);
    })();
  }
  // leggero effetto "profondità" con il dito/mouse
  if(!reduce){
    const frame = el.querySelector('.intro-frame');
    el.addEventListener('pointermove', e=>{
      const x = (e.clientX / innerWidth - .5) * 2, y = (e.clientY / innerHeight - .5) * 2;
      if(frame) frame.style.setProperty('--px', (x * 8).toFixed(1) + 'px'), frame.style.setProperty('--py', (y * 8).toFixed(1) + 'px');
    });
  }
})();
