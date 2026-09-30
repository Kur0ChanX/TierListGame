// ---- Musica e suoni (v135) ----
// 21) Colonne sonore: entrando in un gioco parte la sua colonna sonora (YouTube). Play/Stop valgono OVUNQUE e restano in memoria:
//     se è su Play, ogni gioco che apri suona da solo; se la fermi, non parte più finché non premi Play. Puoi scegliere un altro brano.
//     I brani vengono da ost.js (preparato ogni settimana su GitHub); per i giochi aggiunti da te li cerco al volo.
// 22) Suoni dell'interfaccia: 15 temi sintetizzati nel telefono (nessun file da scaricare), spenti di default, scegli tu tema e volume.
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS} = U;
  const gi = n=> (typeof giIcon === 'function') ? giIcon(n) : '';
  const menu = (html, run)=>{ (window.XMENU = window.XMENU || []).push({html, run}); };
  const load = src=> (window.RT_LOAD ? window.RT_LOAD(src) : Promise.reject());

  // =====================================================================
  // 22) SUONI: motore Web Audio + 15 temi
  // =====================================================================
  let AC = null, master = null;
  function ac(){
    if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.connect(AC.destination); }catch(e){ return null; } }
    if(AC.state === 'suspended') AC.resume().catch(()=>{});
    master.gain.value = sfxVol();
    return AC;
  }
  const sfxVol = ()=> Math.max(0, Math.min(1, +LS.get('jrpg_sfx_vol', 0.5)));
  // nota: [frequenza Hz, durata s, ritardo s, frequenza finale (scivolata), onda, volume]
  function tone(n, w){
    const a = ac(); if(!a) return;
    const [f, d, del = 0, f2, wave, vol = 0.25] = n, t = a.currentTime + del;
    const o = a.createOscillator(), g = a.createGain();
    o.type = wave || w || 'square'; o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, del = 0, vol = 0.15, hp = 2000){
    const a = ac(); if(!a) return;
    const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
    for(let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + del);
  }
  const N = (f, d, del, f2, w, v)=> [f, d, del, f2, w, v];
  // ogni tema: onda di base e note per ogni evento (tap, open, close, nav, fav, success, error)
  const THEMES = {
    coin:    {name: 'Moneta 8-bit (stile platform)', w: 'square', tap: [N(988, .05)], open: [N(988, .07), N(1319, .18, .07)], close: [N(659, .06), N(494, .09, .05)], nav: [N(1175, .04)], fav: [N(988, .07), N(1319, .3, .07)], success: [N(523, .08), N(659, .08, .08), N(784, .08, .16), N(1047, .08, .24), N(1319, .08, .32), N(1568, .3, .4)], error: [N(196, .12), N(147, .2, .12)]},
    ring:    {name: 'Anello blu (stile velocità)', w: 'triangle', tap: [N(1760, .06, 0, 0, 'sine', .18)], open: [N(1319, .08, 0, 0, 'sine'), N(1976, .22, .06, 0, 'sine')], close: [N(1976, .06, 0, 0, 'sine'), N(1319, .12, .05, 0, 'sine')], nav: [N(2093, .05, 0, 0, 'sine', .15)], fav: [N(1568, .08, 0, 0, 'sine'), N(2093, .08, .07, 0, 'sine'), N(2637, .35, .14, 0, 'sine')], success: [N(1047, .1), N(1319, .1, .09), N(1568, .1, .18), N(2093, .5, .27, 0, 'sine')], error: [N(440, .1, 0, 220), N(330, .2, .1, 160)]},
    jrpg:    {name: 'Cursore JRPG', w: 'square', tap: [N(1200, .03, 0, 0, 'square', .15)], open: [N(880, .04), N(1320, .09, .04)], close: [N(660, .06)], nav: [N(1500, .025, 0, 0, 'square', .12)], fav: [N(1320, .05), N(1760, .12, .05)], success: [N(659, .12), N(784, .12, .12), N(988, .12, .24), N(1319, .5, .36, 0, 'triangle')], error: [N(110, .18, 0, 0, 'sawtooth', .2)]},
    crystal: {name: 'Cristalli', w: 'sine', tap: [N(2637, .09, 0, 0, 'sine', .12)], open: [N(1760, .25, 0, 0, 'sine', .18), N(2637, .3, .04, 0, 'sine', .1)], close: [N(1318, .2, 0, 0, 'sine', .15)], nav: [N(3136, .08, 0, 0, 'sine', .1)], fav: [N(2093, .3, 0, 0, 'sine'), N(3136, .4, .08, 0, 'sine', .12)], success: [N(1568, .3), N(2093, .3, .1), N(2637, .3, .2), N(3136, .6, .3)], error: [N(740, .25, 0, 700, 'sine')]},
    arcade:  {name: 'Arcade 16-bit', w: 'sawtooth', tap: [N(600, .05, 0, 900, 'sawtooth', .12)], open: [N(300, .12, 0, 1200, 'sawtooth', .15)], close: [N(1200, .12, 0, 300, 'sawtooth', .15)], nav: [N(800, .04, 0, 1000, 'square', .12)], fav: [N(700, .08, 0, 1400), N(1400, .16, .08, 2100)], success: [N(400, .1, 0, 800), N(600, .1, .1, 1200), N(800, .3, .2, 1600)], error: [N(300, .3, 0, 80, 'sawtooth', .2)]},
    gameboy: {name: 'Console tascabile', w: 'square', tap: [N(2093, .03, 0, 0, 'square', .12)], open: [N(1047, .05), N(2093, .08, .05)], close: [N(2093, .05), N(1047, .08, .05)], nav: [N(1568, .03, 0, 0, 'square', .1)], fav: [N(1568, .06), N(2093, .06, .06), N(2637, .15, .12)], success: [N(1047, .07), N(1319, .07, .07), N(1568, .07, .14), N(2093, .25, .21)], error: [N(131, .1), N(98, .2, .1)]},
    laser:   {name: 'Laser sci-fi', w: 'sawtooth', tap: [N(1800, .07, 0, 400, 'square', .1)], open: [N(2400, .18, 0, 300, 'sawtooth', .13)], close: [N(300, .15, 0, 2000, 'sawtooth', .12)], nav: [N(1500, .05, 0, 700, 'square', .1)], fav: [N(3000, .2, 0, 600, 'square', .12)], success: [N(200, .4, 0, 3000, 'sawtooth', .14)], error: [N(150, .35, 0, 60, 'sawtooth', .2)]},
    bells:   {name: 'Campanellini', w: 'sine', tap: [N(2349, .15, 0, 0, 'sine', .12)], open: [N(1568, .3), N(2349, .3, .1)], close: [N(2349, .2), N(1568, .3, .1)], nav: [N(2794, .12, 0, 0, 'sine', .1)], fav: [N(1976, .25), N(2637, .4, .1)], success: [N(1568, .3), N(1976, .3, .12), N(2349, .3, .24), N(3136, .6, .36)], error: [N(880, .3, 0, 830)]},
    xylo:    {name: 'Xilofono di legno', w: 'triangle', tap: [N(784, .08, 0, 0, 'triangle', .25)], open: [N(523, .1), N(784, .15, .08)], close: [N(784, .1), N(523, .15, .08)], nav: [N(988, .06, 0, 0, 'triangle', .2)], fav: [N(659, .1), N(988, .2, .09)], success: [N(523, .1), N(659, .1, .1), N(784, .1, .2), N(1047, .3, .3)], error: [N(220, .2), N(196, .25, .15)]},
    retro:   {name: 'Beep da vecchio PC', w: 'sine', tap: [N(1000, .04, 0, 0, 'square', .1)], open: [N(800, .08, 0, 0, 'square', .12)], close: [N(500, .08, 0, 0, 'square', .12)], nav: [N(1200, .03, 0, 0, 'square', .08)], fav: [N(1000, .06), N(1500, .1, .08)], success: [N(800, .08), N(1000, .08, .1), N(1600, .2, .2)], error: [N(250, .35, 0, 0, 'square', .15)]},
    bubble:  {name: 'Bolle', w: 'sine', tap: [N(400, .09, 0, 900, 'sine', .25)], open: [N(300, .15, 0, 1100, 'sine', .25)], close: [N(900, .15, 0, 300, 'sine', .2)], nav: [N(600, .07, 0, 1200, 'sine', .2)], fav: [N(500, .1, 0, 1200), N(700, .12, .08, 1600)], success: [N(300, .12, 0, 900), N(500, .12, .1, 1300), N(700, .25, .2, 1800)], error: [N(500, .3, 0, 150, 'sine', .25)]},
    kawaii:  {name: 'Kawaii', w: 'triangle', tap: [N(1397, .06, 0, 1760, 'triangle', .2)], open: [N(1175, .07, 0, 1568), N(1568, .12, .07, 2093)], close: [N(1568, .08, 0, 1175)], nav: [N(1760, .05, 0, 2093, 'triangle', .15)], fav: [N(1319, .08, 0, 1760), N(1760, .08, .08, 2349), N(2349, .2, .16, 2637)], success: [N(1047, .1, 0, 1319), N(1319, .1, .1, 1568), N(1568, .1, .2, 2093), N(2093, .35, .3, 2637)], error: [N(700, .12, 0, 500), N(500, .2, .12, 350)]},
    harp:    {name: 'Arpa incantata', w: 'triangle', tap: [N(1319, .2, 0, 0, 'triangle', .14)], open: [N(523, .3), N(659, .3, .05), N(784, .3, .1), N(1047, .4, .15)], close: [N(1047, .3), N(784, .3, .05), N(523, .4, .1)], nav: [N(1568, .15, 0, 0, 'triangle', .1)], fav: [N(784, .3), N(1047, .3, .06), N(1319, .5, .12)], success: [N(523, .3), N(659, .3, .07), N(784, .3, .14), N(1047, .3, .21), N(1319, .3, .28), N(1568, .7, .35)], error: [N(330, .4, 0, 0, 'triangle', .2)]},
    synth:   {name: 'Synth cyberpunk', w: 'sawtooth', tap: [N(220, .07, 0, 440, 'sawtooth', .12)], open: [N(110, .25, 0, 880, 'sawtooth', .14)], close: [N(880, .2, 0, 110, 'sawtooth', .12)], nav: [N(330, .05, 0, 660, 'square', .1)], fav: [N(440, .1, 0, 880), N(660, .2, .1, 1320)], success: [N(220, .15, 0, 440), N(330, .15, .15, 660), N(440, .4, .3, 1760)], error: [N(80, .4, 0, 40, 'sawtooth', .22)]},
    click:   {name: 'Click minimale', w: 'sine', tap: [], open: [], close: [], nav: [], fav: [N(1500, .05, 0, 0, 'sine', .12)], success: [N(1000, .06, 0, 0, 'sine', .12), N(1500, .08, .06, 0, 'sine', .12)], error: [N(300, .1, 0, 0, 'sine', .15)], noise: true}
  };
  const theme = ()=> LS.get('jrpg_sfx', 'off');
  let lastT = 0;
  window.rtSfx = function(ev, force){
    const k = force || theme(); if(k === 'off' || !THEMES[k]) return;
    const now = performance.now(); if(ev === 'tap' && now - lastT < 60) return; lastT = now;
    const th = THEMES[k];
    if(th.noise && ['tap', 'nav', 'open', 'close'].includes(ev)){ noise(ev === 'open' ? .05 : .025, 0, .12, ev === 'close' ? 800 : 2500); return; }
    (th[ev] || th.tap || []).forEach(n=> tone(n, th.w));
  };
  // agganci: tocchi sui pulsanti, cambio vista, apertura/chiusura scheda, preferiti, giochi aggiunti, traguardi
  document.addEventListener('pointerdown', e=>{ if(theme() === 'off') return; const b = e.target.closest && e.target.closest('button, .btn, a.btn, .view-tab, .list-chip, .qf-chip, .tagchip, .genre-chip, td.fav, summary'); if(!b) return; rtSfx(b.classList.contains('view-tab') ? 'nav' : 'tap'); }, true);
  if(typeof window.showToast === 'function'){ const o = window.showToast; window.showToast = function(m){ try{ const t = String(m || ''); if(/aggiunto ai preferiti/i.test(t)) rtSfx('fav'); else if(/traguardo|completato|aggiunt[io] alla/i.test(t)) rtSfx('success'); else if(/non (sono riuscito|riesco)|errore/i.test(t)) rtSfx('error'); }catch(e){} return o.apply(this, arguments); }; try{ showToast = window.showToast; }catch(e){} }
  if(typeof window.showAddedBanner === 'function'){ const o = window.showAddedBanner; window.showAddedBanner = function(){ rtSfx('success'); return o.apply(this, arguments); }; try{ showAddedBanner = window.showAddedBanner; }catch(e){} }

  // =====================================================================
  // 21) COLONNE SONORE
  // =====================================================================
  const ON = ()=> LS.get('jrpg_music', 'off') === 'on';
  const PICK = 'jrpg_music_pick';
  let yt = null, ytReady = null, cur = {id: null, list: [], i: 0, playing: false}, ostP = null;
  function loadYT(){
    if(ytReady) return ytReady;
    ytReady = new Promise((res, rej)=>{
      if(window.YT && window.YT.Player){ res(); return; }
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = ()=>{ try{ prev && prev(); }catch(e){} res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = ()=>{ ytReady = null; rej(new Error('YouTube non raggiungibile')); }; document.head.appendChild(s);
      setTimeout(()=> rej(new Error('YouTube lento')), 15000);
    });
    return ytReady;
  }
  function dock(){
    let d = document.getElementById('rtMusic');
    if(!d){
      d = document.createElement('div'); d.id = 'rtMusic'; d.className = 'rt-music';
      d.innerHTML = '<div class="rm-frame"><div id="rtYt"></div></div><button type="button" class="rm-g" data-m="grip" aria-label="Sposta o blocca il player" title="Trascina per spostare · tocca per bloccare"></button><button type="button" class="rm-b" data-m="toggle" aria-label="Play/Pausa"></button><div class="rm-t"><b></b><small></small></div><button type="button" class="rm-b" data-m="next" aria-label="Altro brano">⏭</button><button type="button" class="rm-b" data-m="stop" aria-label="Ferma la musica">■</button>';
      document.body.appendChild(d); dragify(d); placeDock(d); lockPaint(d);
      if(!LS.get('jrpg_music_hint', false)){ LS.set('jrpg_music_hint', true); setTimeout(()=> toast('Suggerimento: tieni premuto il player per spostarlo dove vuoi', 4500), 1500); }
      d.addEventListener('click', e=>{ const b = e.target.closest('[data-m]'); if(!b) return; const m = b.dataset.m; if(m === 'toggle') cur.playing ? pause() : resume(); else if(m === 'next') next(); else if(m === 'stop') stopAll(); });
    }
    return d;
  }
  // il player si sposta dove vuoi: tienilo premuto (mezzo secondo), poi trascinalo; la posizione resta salvata
  const POS = 'jrpg_music_pos', LOCK = 'jrpg_music_lock';
  function lockPaint(d){ const on = !!LS.get(LOCK, false); d.classList.toggle('locked', on); const g = d.querySelector('.rm-g'); if(g) g.textContent = on ? '🔒' : '⠿'; }
  function toggleLock(d){ const on = !LS.get(LOCK, false); LS.set(LOCK, on); lockPaint(d); toast(on ? 'Player bloccato 🔒: non si sposta per sbaglio' : 'Player sbloccato: trascina ⠿ per spostarlo', 2200); }
  function placeDock(d){
    const p = LS.get(POS, null); if(!p) return;
    const w = d.offsetWidth || 240, h = d.offsetHeight || 44;
    d.style.left = Math.max(4, Math.min(innerWidth - w - 4, p.x * innerWidth)) + 'px'; d.style.top = Math.max(4, Math.min(innerHeight - h - 4, p.y * innerHeight)) + 'px'; d.style.bottom = 'auto';
  }
  function dragify(d){
    let timer = 0, start = null, drag = null;
    const fade = ()=>{ d.classList.remove('idle'); clearTimeout(d._idle); d._idle = setTimeout(()=> d.classList.add('idle'), 3500); };
    fade();
    d.addEventListener('pointerdown', e=>{
      fade();
      const grip = !!(e.target.closest && e.target.closest('[data-m="grip"]'));
      if(LS.get(LOCK, false)){ if(grip) start = {x: e.clientX, y: e.clientY, lockTap: true}; return; }          // bloccato: solo il lucchetto risponde
      start = {x: e.clientX, y: e.clientY, grip};
      const begin = ()=>{ const r = d.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false}; d.classList.add('moving'); try{ navigator.vibrate && navigator.vibrate(12); }catch(x){} try{ d.setPointerCapture(e.pointerId); }catch(x){} };
      if(grip) begin(); else timer = setTimeout(begin, 480);       // dal piccolo grip si trascina subito; altrove serve tenere premuto
    });
    d.addEventListener('pointermove', e=>{
      if(!drag){ if(start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clearTimeout(timer); return; }
      if(Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) drag.moved = true;
      e.preventDefault();
      const x = Math.max(4, Math.min(innerWidth - d.offsetWidth - 4, e.clientX - drag.dx)), y = Math.max(4, Math.min(innerHeight - d.offsetHeight - 4, e.clientY - drag.dy));
      d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.bottom = 'auto';
    });
    const end = ()=>{
      clearTimeout(timer);
      if(start && start.lockTap){ start = null; toggleLock(d); return; }
      const wasTap = !!(drag && !drag.moved && start && start.grip); start = null;
      if(wasTap){ drag = null; d.classList.remove('moving'); toggleLock(d); return; }          // un semplice tocco sul grip = blocca / sblocca
      if(!drag) return; drag = null; d.classList.remove('moving');
      const r = d.getBoundingClientRect(); LS.set(POS, {x: r.left / innerWidth, y: r.top / innerHeight});
      d.dataset.moved = '1'; setTimeout(()=>{ delete d.dataset.moved; }, 350);
      toast('Player spostato: resta qui', 1800);
    };
    d.addEventListener('pointerup', end); d.addEventListener('pointercancel', end);
    d.addEventListener('click', e=>{ if(d.dataset.moved){ e.stopPropagation(); e.preventDefault(); } }, true);
    window.addEventListener('resize', ()=> placeDock(d));
  }
  function paint(){
    const d = dock(), t = cur.list[cur.i];
    placeDock(d);
    d.classList.toggle('show', !!t && ON());
    d.querySelector('[data-m="toggle"]').textContent = cur.playing ? '❚❚' : '▶';
    d.querySelector('.rm-t b').textContent = t ? t[1] : '';
    const g = GAMES.find(x=> x.id === cur.id); d.querySelector('.rm-t small').textContent = g ? g.name + ' · ' + (cur.i + 1) + '/' + cur.list.length : '';
    const mb = document.getElementById('mzBar'); if(mb && typeof currentModalGame !== 'undefined' && currentModalGame) mb.outerHTML = barHtml(currentModalGame), wireBar(currentModalGame);
  }
  const parseYT = html=>{
    const m = String(html).match(/var ytInitialData = (\{.*?\});<\/script>/s); if(!m) return [];
    let data; try{ data = JSON.parse(m[1]); }catch(e){ return []; }
    const out = [];
    (function walk(o){ if(!o || typeof o !== 'object' || out.length >= 12) return; if(o.videoRenderer && o.videoRenderer.videoId){ const v = o.videoRenderer; out.push([v.videoId, ((v.title && v.title.runs && v.title.runs[0] && v.title.runs[0].text) || '').slice(0, 70), (v.lengthText && v.lengthText.simpleText) || '']); return; } for(const k in o) walk(o[k]); })(data);
    return out.filter(v=> /ost|soundtrack|music|theme|bgm|score/i.test(v[1])).slice(0, 5);
  };
  async function tracksFor(g){
    if(!ostP) ostP = load('ost.js').catch(()=>{});
    await ostP;
    const t = (typeof OST !== 'undefined' && OST.games && OST.games[g.id]) || null;
    if(t && t.length) return t;
    const k = 'rt_ost_live', c = LS.get(k, {}) || {}; if(c[g.id] && c[g.id].length) return c[g.id];
    try{
      const html = await SearchHub.text('https://www.youtube.com/results?search_query=' + encodeURIComponent(String(g.name).replace(/\s*\([^)]*\)/g, '') + ' soundtrack OST'), {timeout: 15000});
      const l = parseYT(html); if(l.length){ c[g.id] = l; LS.set(k, c); } return l;
    }catch(e){ return []; }
  }
  async function playTrack(){
    const t = cur.list[cur.i]; if(!t) return;
    try{ await loadYT(); }catch(e){ toast('La musica non parte: YouTube non è raggiungibile ora', 3500); return; }
    dock();
    if(!yt){
      yt = new YT.Player('rtYt', {width: 200, height: 113, videoId: t[0], playerVars: {autoplay: 1, playsinline: 1, controls: 0, rel: 0, modestbranding: 1},
        events: {onReady: e=>{ try{ e.target.setVolume(70); e.target.playVideo(); }catch(x){} }, onStateChange: e=>{ cur.playing = e.data === 1; if(e.data === 0) next(true); paint(); }, onError: ()=> next(true)}});
    } else { try{ yt.loadVideoById(t[0]); }catch(e){} }
    cur.playing = true; paint();
  }
  async function playFor(g, force){
    if(!force && !ON()) return;
    if(cur.id === g.id && cur.list.length && (cur.playing || !force)){ paint(); return; }
    const list = await tracksFor(g);
    if(!list.length){ if(force) toast('Non trovo la colonna sonora di questo gioco', 3000); return; }
    const pick = (LS.get(PICK, {}) || {})[g.id] || 0;
    cur = {id: g.id, list, i: Math.min(pick, list.length - 1), playing: false};
    playTrack();
  }
  function pause(){ try{ yt && yt.pauseVideo(); }catch(e){} cur.playing = false; paint(); }
  function resume(){ LS.set('jrpg_music', 'on'); try{ yt && yt.playVideo(); }catch(e){} cur.playing = true; paint(); }
  function next(auto){ if(!cur.list.length) return; cur.i = (cur.i + 1) % cur.list.length; if(!auto){ const p = LS.get(PICK, {}) || {}; p[cur.id] = cur.i; LS.set(PICK, p); } playTrack(); }
  function stopAll(){ LS.set('jrpg_music', 'off'); try{ yt && yt.stopVideo(); }catch(e){} cur.playing = false; paint(); toast('Musica spenta ovunque: premi ▶ in una scheda per riaccenderla', 3000); }
  window.rtMusic = {playFor, stop: stopAll, on: ON, dock};
  // barra nella scheda del gioco
  function barHtml(g){
    const mine = cur.id === g.id && cur.list.length, t = mine ? cur.list[cur.i] : null;
    const opts = mine ? cur.list.map((x, i)=> `<option value="${i}"${i === cur.i ? ' selected' : ''}>${esc(x[1])}${x[2] ? ' (' + esc(x[2]) + ')' : ''}</option>`).join('') : '';
    return `<div class="mz-bar" id="mzBar"><button type="button" class="btn${ON() && mine && cur.playing ? ' primary' : ''}" data-mz="play">${ON() && mine && cur.playing ? '❚❚' : '▶'}</button><button type="button" class="btn" data-mz="stop" title="Ferma la musica ovunque">■</button><button type="button" class="btn" data-mz="next" title="Altro brano">⏭</button>
      <div class="mz-t">${mine ? `<select data-mz="sel">${opts}</select>` : `<small>${ON() ? 'Cerco la colonna sonora…' : 'Colonna sonora: premi ▶ (resta accesa per tutti i giochi)'}</small>`}</div></div>`;
  }
  function wireBar(g){
    const b = document.getElementById('mzBar'); if(!b) return;
    b.addEventListener('click', e=>{ const x = e.target.closest('[data-mz]'); if(!x || x.tagName === 'SELECT') return; const m = x.dataset.mz;
      if(m === 'play'){ if(cur.id === g.id && cur.list.length){ cur.playing ? pause() : resume(); } else { LS.set('jrpg_music', 'on'); playFor(g, true); } }
      else if(m === 'stop') stopAll(); else if(m === 'next'){ if(cur.id === g.id) next(); else { LS.set('jrpg_music', 'on'); playFor(g, true); } } });
    const s = b.querySelector('select'); if(s) s.addEventListener('change', ()=>{ cur.i = +s.value; const p = LS.get(PICK, {}) || {}; p[g.id] = cur.i; LS.set(PICK, p); LS.set('jrpg_music', 'on'); playTrack(); });
  }
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      rtSfx('open');
      const cover = document.getElementById('coverBlock'), card = document.getElementById('modalCard');
      if(card && g){ (cover || card.querySelector('.modal-head')).insertAdjacentHTML('afterend', barHtml(g)); wireBar(g); }
      if(ON()) playFor(g);
    }catch(e){}
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}
  new MutationObserver(()=>{ if(!document.getElementById('modalBackdrop').classList.contains('show')) rtSfx('close'); }).observe(document.getElementById('modalBackdrop'), {attributes: true, attributeFilter: ['class']});

  // impostazioni: suoni e musica
  function openSound(){
    const cur0 = theme(), vol = sfxVol();
    const body = sheet('xSound', gi('pad') + ' Suoni e musica', `<div class="lp-sub">Suoni dei pulsanti creati nel telefono (nessun download). Scegli un tema: toccalo per sentirlo.</div>
      <label class="ask-toggle"><input type="checkbox" id="muOn" ${ON() ? 'checked' : ''}> ${gi('play')} Colonna sonora automatica quando apri un gioco</label>
      <label class="gs-row">Volume dei suoni <input type="range" min="0" max="1" step="0.05" value="${vol}" id="sfxVol"></label>
      <button class="btn" type="button" id="muReset">Rimetti il player al suo posto</button>
      <div class="snd-grid"><button type="button" class="btn${cur0 === 'off' ? ' primary' : ''}" data-snd="off">Nessun suono</button>${Object.entries(THEMES).map(([k, t])=> `<button type="button" class="btn${cur0 === k ? ' primary' : ''}" data-snd="${k}">${esc(t.name)}</button>`).join('')}</div>`);
    body.querySelectorAll('[data-snd]').forEach(b=> b.addEventListener('click', ()=>{ LS.set('jrpg_sfx', b.dataset.snd); body.querySelectorAll('[data-snd]').forEach(x=> x.classList.toggle('primary', x === b)); if(b.dataset.snd !== 'off'){ rtSfx('success', b.dataset.snd); } }));
    body.querySelector('#sfxVol').addEventListener('input', e=>{ LS.set('jrpg_sfx_vol', +e.target.value); if(master) master.gain.value = +e.target.value; });
    body.querySelector('#sfxVol').addEventListener('change', ()=> rtSfx('fav'));
    body.querySelector('#muReset').addEventListener('click', ()=>{ LS.set(POS, null); const d = document.getElementById('rtMusic'); if(d){ d.style.left = ''; d.style.top = ''; d.style.bottom = ''; } toast('Player rimesso al suo posto', 1800); });
    body.querySelector('#muOn').addEventListener('change', e=>{ LS.set('jrpg_music', e.target.checked ? 'on' : 'off'); if(!e.target.checked){ try{ yt && yt.stopVideo(); }catch(x){} cur.playing = false; paint(); } });
  }
  menu(gi('pad') + ' Suoni e musica (15 temi)', openSound);
})();
