// ---- Scheda «cinematografica»: copertina ferma in alto per qualche secondo, poi dissolvenze sulle schermate di gioco ----
// Le schermate vengono da shots.js (Steam, costruito dai server ogni settimana) e, per i giochi senza Steam, da RAWG (serve la tua chiave).
// Si spegne da ✨ → «Anteprima cinematografica» (o da solo con il risparmio dati / «riduci animazioni» del telefono). La musica non si tocca.
(function(){
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const K_ON = 'jrpg_hero', K_HOLD = 'jrpg_hero_hold';
  const enabled = ()=> LSG(K_ON, 'on') !== 'off'
    && !(navigator.connection && navigator.connection.saveData)
    && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const holdMs = ()=> Math.max(2000, Math.min(12000, (+LSG(K_HOLD, 5)) * 1000));
  const SLIDE_MS = 4400, BACK_MS = 3800, MAX_CYCLES = 2;

  let ticket = 0, timers = [];
  const stop = ()=>{ ticket++; timers.forEach(clearTimeout); timers = []; };
  const later = (fn, ms)=>{ const t = setTimeout(fn, ms); timers.push(t); return t; };

  // ---- sorgenti delle schermate ----
  function steamShots(g){
    try{
      if(typeof GAME_SHOTS === 'undefined' || !GAME_SHOTS || !GAME_SHOTS.games) return [];
      const d = GAME_SHOTS.games[g.id]; return d ? d.map(u=> GAME_SHOTS.base + u) : [];
    }catch(e){ return []; }
  }
  async function rawgShots(g){
    const c = LSG('rt_shots_rawg', {}), e = c[g.id];
    if(e && Date.now() - e.t < 30 * 864e5) return e.u || [];
    try{
      if(!(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has() && SearchHub.rawg.shots)) return [];
      const u = await SearchHub.rawg.shots(g.name);
      c[g.id] = {t: Date.now(), u: u || []};
      const ks = Object.keys(c); if(ks.length > 300) ks.slice(0, ks.length - 300).forEach(k=> delete c[k]);
      LSS('rt_shots_rawg', c); return u || [];
    }catch(e2){ return []; }
  }
  async function shotsFor(g){
    const s = steamShots(g); if(s.length) return s;
    return rawgShots(g);
  }
  window.rtShotsFor = shotsFor;

  const preload = u=> new Promise(res=>{ const im = new Image(); im.onload = ()=> res(u); im.onerror = ()=> res(null); im.decoding = 'async'; im.src = u; });

  // ---- la sequenza ----
  async function run(g){
    stop(); const my = ticket;
    if(!document.getElementById('modalCard') || !document.getElementById('coverBlock') || !enabled()) return;
    if(typeof GAME_SHOTS === 'undefined'){ await new Promise(res=>{ const f = ()=>{ window.removeEventListener('localdata', f); res(); }; window.addEventListener('localdata', f); setTimeout(res, 3500); }); if(my !== ticket) return; }
    const urls0 = await shotsFor(g);
    const same = ()=> my === ticket && typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id;
    if(!same() || !urls0.length) return;

    const layer = document.createElement('div'); layer.className = 'hero-shots';
    layer.innerHTML = '<img class="hs" alt=""><img class="hs" alt=""><div class="hero-bar"></div>';
    const imgs = layer.querySelectorAll('img.hs'), bar = layer.querySelector('.hero-bar');
    // la cornice può essere ridisegnata da altri pezzi dell'app (copertina che arriva, dettagli pronti…): ogni passo la ritrova e ci rimette lo strato
    const mount = ()=>{
      const blk = document.getElementById('coverBlock'); if(!blk) return null;
      let f = blk.querySelector('.cover-frame');
      if(!f){
        f = document.createElement('div'); f.className = 'cover-frame hero-only'; f.style.setProperty('--rn', '.75'); f.style.setProperty('--cov', `url("${urls[0] || urls0[0]}")`);
        blk.insertBefore(f, blk.firstChild);
        const ph = blk.querySelector('.placeholder-cover'); if(ph) ph.style.display = 'none';
      }
      if(layer.parentNode !== f) f.appendChild(layer);
      return f;
    };
    let urls = [], cur = 0, cycles = 0, face = 0;
    const first = await preload(urls0[0]);
    if(!same()) return;
    if(first) urls.push(first);
    urls0.slice(1).forEach(u=> urls.push(u));                          // le altre si scaricano una alla volta, appena prima di mostrarle
    const frame0 = mount(); if(!frame0) return;
    const hadCover = !!frame0.querySelector('img.modal-cover');
    bar.innerHTML = urls.map(()=> '<i></i>').join('');
    bar.style.setProperty('--hd', (SLIDE_MS / 1000) + 's');
    const segs = [...bar.children];
    const clearTimers = ()=>{ timers.forEach(clearTimeout); timers = []; };
    segs.forEach((sg, i)=> sg.addEventListener('click', e=>{ e.stopPropagation(); if(!same()) return; clearTimers(); cur = i; show(); }));
    const setBar = idx=> segs.forEach((sg, i)=>{ sg.className = i < idx ? 'done' : (i === idx ? 'cur' : ''); });

    async function show(){
      if(!same()) return;
      if(document.hidden){ later(show, 1000); return; }
      const frame = mount(); if(!frame) return;
      if(cur >= urls.length){                                          // fine giro: torna la copertina
        frame.classList.remove('hero-play'); imgs.forEach(im=> im.classList.remove('on')); setBar(-1); cycles++;
        if(cycles >= MAX_CYCLES) return;                               // dopo due giri si ferma sulla copertina
        cur = 0; later(show, BACK_MS); return;
      }
      const ok = await preload(urls[cur]);
      if(!same()) return;
      if(!ok){ urls.splice(cur, 1); const sg = segs.pop(); if(sg) sg.remove(); return show(); }
      const next = imgs[face], prev = imgs[1 - face];
      next.src = urls[cur]; face = 1 - face;
      next.classList.remove('on'); void next.offsetWidth; next.classList.add('on');       // riparte il lento zoom
      prev.classList.remove('on');
      mount().classList.add('hero-play'); setBar(cur);
      cur++; later(show, SLIDE_MS);
    }
    later(show, hadCover ? holdMs() : 300);
  }
  window.rtHero = {run, stop, enabled};

  // ---- aggancio alla scheda del gioco ----
  const origOpen = window.openModal;
  window.openModal = function(g){
    stop();
    const r = origOpen.apply(this, arguments);
    try{ if(g && g.id != null) setTimeout(()=> run(g), 60); }catch(e){}
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}
  try{ new MutationObserver(()=>{ const b = document.getElementById('modalBackdrop'); if(b && !b.classList.contains('show')) stop(); }).observe(document.getElementById('modalBackdrop'), {attributes: true, attributeFilter: ['class']}); }catch(e){}
  document.addEventListener('visibilitychange', ()=>{ /* in pausa quando la pagina è nascosta: il passo successivo aspetta */ });

  // ---- impostazioni ----
  (window.XMENU = window.XMENU || []).push({html: '🎬 Anteprima cinematografica delle schede', run: function(){
    const U = window.XUI; if(!U) return;
    const on = LSG(K_ON, 'on') !== 'off', hold = +LSG(K_HOLD, 5);
    const body = U.sheet('xHero', '🎬 Anteprima cinematografica', `<div class="lp-sub">Aprendo un gioco la copertina resta ferma in alto per qualche secondo, poi passa con dissolvenze alle schermate di gioco (senza filmati, quindi poco spoiler e pochi dati). La musica continua.</div>
      <label class="ask-toggle"><input type="checkbox" id="hrOn" ${on ? 'checked' : ''}> Attiva nelle schede dei giochi</label>
      <label class="gs-row">Copertina ferma per <select id="hrHold">${[3, 5, 8, 12].map(n=> `<option value="${n}"${n === hold ? ' selected' : ''}>${n} secondi</option>`).join('')}</select></label>
      <div class="lp-sub">Si ferma da sola con il risparmio dati o con «riduci animazioni» del telefono. Per uno spettacolo a schermo intero con le tue copertine usa anche «Modalità vetrina».</div>`);
    body.querySelector('#hrOn').addEventListener('change', e=>{ LSS(K_ON, e.target.checked ? 'on' : 'off'); if(!e.target.checked) stop(); });
    body.querySelector('#hrHold').addEventListener('change', e=> LSS(K_HOLD, +e.target.value));
  }});
})();
