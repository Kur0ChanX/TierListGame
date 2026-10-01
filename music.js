// ---- Musica e suoni (v135) ----
// 21) Colonne sonore: entrando in un gioco parte la sua colonna sonora (YouTube). Play/Stop valgono OVUNQUE e restano in memoria:
//     se è su Play, ogni gioco che apri suona da solo; se la fermi, non parte più finché non premi Play. Puoi scegliere un altro brano.
//     I brani vengono da ost.js (preparato ogni settimana su GitHub, anche per i giochi aggiunti); se mancano li cerco al volo con tre tentativi
//     («nome OST music» → «nome soundtrack» → «nome playlist complete music») e col tasto 🔎 puoi cercare tu con altre parole.
//     Il player sta in un punto fisso della pagina (sotto la barra di ricerca): non ti segue, non copre nulla e sparisce quando è aperta una scheda.
// 22) Suoni dell'interfaccia: 15 temi sintetizzati nel telefono (nessun file da scaricare), spenti di default, scegli tu tema e volume.
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.music) return;
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
  // brani «ia:…» = file musicali di Internet Archive: si suonano con un normale lettore audio, quindi SENZA pubblicità
  let au = null;
  const isIA = t=> t && String(t[0]).indexOf('ia:') === 0;
  // un brano che non si carica passa al successivo; se non se ne carica nessuno mi fermo (prima girava all'infinito senza rete)
  function failNext(){ cur.fails = (cur.fails || 0) + 1; if(cur.fails >= Math.max(1, cur.list.length)){ cur.playing = false; cur.fails = 0; paint(); toast('La colonna sonora non si carica ora (rete o sito): riprova tra poco', 3200); return; } next(true); }
  function audio(){ if(!au){ au = new Audio(); au.preload = 'auto'; au.addEventListener('ended', ()=> next(true)); au.addEventListener('error', ()=> failNext()); au.addEventListener('playing', ()=>{ cur.fails = 0; cur.playing = true; paint(); }); au.addEventListener('pause', ()=>{ if(!au.ended){ cur.playing = false; paint(); } }); } return au; }
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
  const MODE = 'jrpg_music_mode';                                   // 'dock' (fisso nella pagina, predefinito) | 'float' (mobile, lo sposti tu)
  const docked = ()=> LS.get(MODE, 'dock') !== 'float' && !!document.getElementById('rtMusicSlot');
  function dock(){
    let d = document.getElementById('rtMusic');
    if(!d){
      const fixed = docked();
      d = document.createElement('div'); d.id = 'rtMusic'; d.className = 'rt-music' + (fixed ? ' docked' : '');
      d.innerHTML = '<div class="rm-frame"><div id="rtYt"></div></div><button type="button" class="rm-g" data-m="grip" aria-label="Sposta o blocca il player" title="Trascina per spostare · tocca per bloccare"></button><button type="button" class="rm-b" data-m="toggle" aria-label="Play/Pausa"></button><div class="rm-t"><b></b><small></small></div><button type="button" class="rm-b" data-m="next" aria-label="Altro brano">⏭</button><button type="button" class="rm-b" data-m="stop" aria-label="Ferma la musica">■</button>';
      if(fixed){ document.getElementById('rtMusicSlot').appendChild(d); }
      else { document.body.appendChild(d); dragify(d); placeDock(d); }
      lockPaint(d);
      if(!fixed && !LS.get('jrpg_music_hint', false)){ LS.set('jrpg_music_hint', true); setTimeout(()=> toast('Suggerimento: tieni premuto il player per spostarlo dove vuoi', 4500), 1500); }
      d.addEventListener('click', e=>{ const b = e.target.closest('[data-m]'); if(!b) return; const m = b.dataset.m; if(m === 'toggle') cur.playing ? pause() : resume(); else if(m === 'next') next(); else if(m === 'stop') stopAll(); });
    }
    return d;
  }
  // il player si sposta dove vuoi: tienilo premuto (mezzo secondo), poi trascinalo; la posizione resta salvata
  const POS = 'jrpg_music_pos', LOCK = 'jrpg_music_lock';
  function lockPaint(d){ const on = !!LS.get(LOCK, false); d.classList.toggle('locked', on); const g = d.querySelector('.rm-g'); if(g) g.textContent = on ? '🔒' : '⠿'; }
  function toggleLock(d){ const on = !LS.get(LOCK, false); LS.set(LOCK, on); lockPaint(d); toast(on ? 'Player bloccato 🔒: non si sposta per sbaglio' : 'Player sbloccato: trascina ⠿ per spostarlo', 2200); }
  function placeDock(d){
    if(d.classList.contains('docked')) return;
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
    paintBar();
  }
  function paintBar(){ const mb = document.getElementById('mzBar'); if(mb && typeof currentModalGame !== 'undefined' && currentModalGame){ const l0 = mb.querySelector('.mz2-list'), open = !!(l0 && !l0.hidden); mb.outerHTML = barHtml(currentModalGame); wireBar(currentModalGame); if(open){ const l = document.querySelector('#mzBar .mz2-list'); if(l) l.hidden = false; } } }
  // ---- ricerca su YouTube: tre tentativi in ordine («triade») e, a mano, con le parole che vuoi ----
  const USER = 'rt_ost_user', MISS = 'rt_ost_miss', LIVE = 'rt_ost_live', STAT = {};
  const cleanN = n=> String(n).replace(/\s*\([^)]*\)/g, '').trim();
  const baseN = n=> cleanN(n).replace(/\s*[:–—]\s.*$/, '').replace(/\s+-\s.*$/, '').trim();
  const normT = t=> String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const STOPW = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for', 'edition', 'remastered', 'remake', 'definitive', 'complete', 'hd', 'game', 'collection']);
  const tokensOf = n=> normT(n).split(' ').filter(w=> w.length >= 2 && !STOPW.has(w));
  const namesGame0 = (title, name)=>{ const t = ' ' + normT(title) + ' ', w = tokensOf(name); if(!w.length) return true; return w.filter(x=> t.includes(' ' + x)).length >= Math.max(1, Math.ceil(w.length / 2)); };
  // non deve essere un altro capitolo: «Final Fantasy X-2» non è «Final Fantasy X», «Kingdom Hearts II» non è «Kingdom Hearts»
  const namesGame = (title, name)=>{
    if(!namesGame0(title, name)) return false;
    const t = normT(title), n = normT(cleanN(name)); const i = t.indexOf(n); if(i < 0) return true;
    const after = t.slice(i + n.length);
    return !/^\s?(2|3|4|ii|iii|iv|zero|origins|remix)\b/.test(after);
  };
  // le parole che usi tu (in quest'ordine): «soundtrack music», «soundtrack ost», «OST music», poi «playlist complete music»
  const queriesFor = name=>{ const n = cleanN(name), b = baseN(name), q = [n + ' soundtrack music', n + ' soundtrack ost', n + ' OST music', n + ' playlist complete music']; if(b && b !== n) q.push(b + ' soundtrack music', b + ' soundtrack ost'); return [...new Set(q)]; };
  const secsOf = t=> String(t || '').split(':').reduce((a, x)=> a * 60 + (+x || 0), 0);
  // via tutto ciò che non è la musica ORIGINALE: lofi, relax, piano, cover, remix, mix di ore, ambienti, reazioni…
  const BAD = /reaction|review|tutorial|live stream|gameplay|walkthrough|let'?s play|trailer|rap by|remix|cover|lo-?fi|relax|relaxing|sleep|study|chill|ambien|asmr|rain|beats|piano|guitar|violin|orchestra(l)? (version|arrangement)|arrange|8.?bit|chiptune|metal version|\b\d+ ?(hours?|ore)\b|mashup|medley|karaoke|nightcore|slowed|reverb|tribute|fan ?made|ai cover/i;
  const parseYT = html=>{
    const m = String(html).match(/var ytInitialData = (\{.*?\});<\/script>/s); if(!m) return [];
    let data; try{ data = JSON.parse(m[1]); }catch(e){ return []; }
    const out = [];
    (function walk(o){ if(!o || typeof o !== 'object' || out.length >= 20) return; if(o.videoRenderer && o.videoRenderer.videoId){ const v = o.videoRenderer; out.push([v.videoId, ((v.title && v.title.runs && v.title.runs[0] && v.title.runs[0].text) || '').slice(0, 70), (v.lengthText && v.lengthText.simpleText) || '', +String((v.viewCountText && (v.viewCountText.simpleText || (v.viewCountText.runs || []).map(r=> r.text).join(''))) || '').replace(/[^0-9]/g, '') || 0]); return; } for(const k in o) walk(o[k]); })(data);
    return out;
  };
  // tiene i brani veri: titolo giusto, nome del gioco, non reazioni/gameplay; prima le raccolte lunghe
  const pickTracks = (list, name)=> list.filter(v=> /ost|soundtrack|music|theme|bgm|score|original|playlist|album/i.test(v[1]) && !BAD.test(v[1]) && secsOf(v[2]) >= 60 && namesGame(v[1], name))
    .sort((a, b)=> (secsOf(b[2]) > 1800) - (secsOf(a[2]) > 1800)).slice(0, 5);
  const searchYT = async q=> parseYT(await SearchHub.text('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), {timeout: 15000}));
  window.rtYtSearch = q=> searchYT(q).catch(()=> []);      // usato anche per le foto del carosello (fotogrammi dei video di gameplay)
  const setStat = (id, t)=>{ if(t) STAT[id] = t; else delete STAT[id]; paintBar(); };
  // ---- Internet Archive: album interi caricati dagli utenti, file mp3 diretti (niente pubblicità). Cache 30 giorni (anche i «non trovato»). ----
  const IA = 'rt_ost_ia2', SRC = 'jrpg_music_src';                 // fonte preferita: 'ia' (senza pubblicità, predefinita) | 'yt'
  const IA_BAD = /piano|cover|remix|arrang|orchestra|8.?bit|lo-?fi|tribute|guitar|acoustic|metal version|karaoke|ringtone|medley|chiptune/i;
  const fmt = sec=>{ sec = Math.round(+sec || 0); return sec ? Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') : ''; };
  async function iaAlbum(g){
    const c = LS.get(IA, {}) || {}, e = c[g.id]; if(e && Date.now() - e.t < 30 * 864e5) return e.l ? e : null;
    let res = null;
    try{
      const nm = cleanN(g.name).replace(/[()"]/g, ' ');
      const q = 'title:(' + nm + ') AND (soundtrack OR ost OR "original sound" OR music) AND mediatype:audio';
      const j = await SearchHub.json('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) + '&fl[]=identifier&fl[]=title&fl[]=downloads&rows=10&output=json', {timeout: 15000, relays: false});
      const docs = ((j && j.response && j.response.docs) || []).filter(d=> d && d.title && namesGame(d.title, g.name) && /ost|soundtrack|sound track|music|score|original/i.test(d.title) && !IA_BAD.test(d.title)).sort((a, b)=> (b.downloads || 0) - (a.downloads || 0));
      for(const d of docs.slice(0, 2)){
        const m = await SearchHub.json('https://archive.org/metadata/' + encodeURIComponent(d.identifier), {timeout: 15000, relays: false});
        const seen = new Set(), files = ((m && m.files) || []).filter(f=> /\.mp3$/i.test(f.name || '') && !/_64kb\.mp3$/i.test(f.name) && (+f.length || 0) >= 40)
          .map(f=>{ const tt = String(f.title || f.name.replace(/\.mp3$/i, '').replace(/^[\d\s.\-_]+/, '')).trim(); return ['ia:https://archive.org/download/' + encodeURIComponent(d.identifier) + '/' + f.name.split('/').map(encodeURIComponent).join('/'), tt.slice(0, 70), fmt(f.length)]; })
          .filter(x=>{ const k = x[1].toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
        if(files.length >= 3){ res = {all: files, album: d.title, id: d.identifier}; break; }
      }
    }catch(err){ return null; }                                     // rete/blocco: non salvo, riprovo la prossima volta
    // prima i brani PIÙ FAMOSI: confronto i titoli dell'album con i video più visti su YouTube («To Zanarkand», «Otherworld»…);
    // se YouTube non risponde prendo 5 brani sparsi lungo l'album. Il resto resta come «alternative» per il tasto 🔁, in ordine di fama.
    let l = null;
    if(res){
      try{
        const yt = [].concat(await searchYT(cleanN(g.name) + ' soundtrack ost').catch(()=> []), await searchYT(cleanN(g.name) + ' soundtrack music').catch(()=> []));
        const tl = yt.map(v=> [normT(v[1]), +v[3] || 1]);
        res.all.forEach(x=>{ const k = normT(x[1]).replace(/^\d+\s*/, ''); x[3] = k.length >= 4 ? tl.filter(v=> (' ' + v[0] + ' ').includes(' ' + k + ' ')).reduce((a, v)=> a + v[1], 0) : 0; });
      }catch(e){}
      const famous = res.all.filter(x=> x[3] > 0).sort((a, b)=> b[3] - a[3]);
      const n = res.all.length, spread = [...new Set([0, 1, 2, 3, 4].map(i=> Math.round(i * (n - 1) / 4)))].map(i=> res.all[i]);
      l = famous.slice(0, 5); spread.forEach(x=>{ if(l.length < 5 && !l.includes(x)) l.push(x); });
      res.all = famous.concat(res.all.filter(x=> !famous.includes(x)));
    }
    c[g.id] = {t: Date.now(), l, alt: res ? res.all.slice(0, 60) : null, album: res && res.album};
    const ks = Object.keys(c); if(ks.length > 300) ks.slice(0, ks.length - 300).forEach(k=> delete c[k]);
    LS.set(IA, c); return l ? c[g.id] : null;
  }
  async function tracksFor(g){
    const u = (LS.get(USER, {}) || {})[g.id]; if(u && u.length) return u;                      // scelto da te (🔎 o 🔁): bloccato, nessun aggiornamento lo cambia
    if(LS.get(SRC, 'ia') === 'ia'){ setStat(g.id, 'Cerco l\'album senza pubblicità…'); const a = await iaAlbum(g); setStat(g.id, ''); if(a && a.l && a.l.length) return a.l; }
    if(!ostP) ostP = load('ost.js').catch(()=>{});
    await ostP;
    const t = (typeof OST !== 'undefined' && OST.games && OST.games[g.id]) || null;
    if(t && t.length) return t;
    const c = LS.get(LIVE, {}) || {}; if(c[g.id] && c[g.id].length) return c[g.id];
    const miss = LS.get(MISS, {}) || {}; if(miss[g.id] && Date.now() - miss[g.id] < 864e5) return [];     // già provato oggi: non insisto
    const qs = queriesFor(g.name).slice(0, 3);
    for(let i = 0; i < qs.length; i++){
      setStat(g.id, 'Cerco la colonna sonora… (' + (i + 1) + '/' + qs.length + ')');
      try{ const l = pickTracks(await searchYT(qs[i]), g.name); if(l.length){ c[g.id] = l; const ks = Object.keys(c); if(ks.length > 250) ks.slice(0, ks.length - 250).forEach(k=> delete c[k]); LS.set(LIVE, c); setStat(g.id, ''); return l; } }catch(e){}
    }
    miss[g.id] = Date.now(); LS.set(MISS, miss); setStat(g.id, ''); return [];
  }
  // 🔎 ricerca a mano: scrivi tu le parole, scegli il brano giusto e resta salvato per quel gioco
  function openFind(g){
    const nm = cleanN(g.name);
    const body = sheet('xOstFind', '🔎 Cerca la colonna sonora', `<div class="lp-sub">Cerca su YouTube con le parole che vuoi. Il brano che scegli resta salvato per questo gioco.</div>
      <input id="ostQ" type="search" value="${esc(nm + ' OST music')}" autocomplete="off" enterkeyhint="search" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border,#555);background:var(--card,#222);color:inherit;font-size:1rem">
      <div class="tagchips" style="margin:8px 0">${['OST music', 'soundtrack', 'playlist complete music', 'full album', 'main theme'].map(x=> `<button type="button" class="tagchip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div class="lp-tools"><button class="btn primary" id="ostGo" type="button">🔎 Cerca</button></div><div id="ostRes" class="lp-sub"></div>`);
    const res = body.querySelector('#ostRes'), inp = body.querySelector('#ostQ');
    const go = async ()=>{
      const q = inp.value.trim(); if(!q) return; res.textContent = 'Cerco…';
      let l = []; try{ l = (await searchYT(q)).filter(v=> !BAD.test(v[1]) && secsOf(v[2]) >= 30).slice(0, 12); }catch(e){ res.textContent = 'YouTube non risponde ora: riprova tra poco.'; return; }
      if(!l.length){ res.textContent = 'Nessun risultato: prova con altre parole.'; return; }
      res.innerHTML = l.map((v, i)=> `<button type="button" class="btn" data-i="${i}" style="display:block;width:100%;text-align:left;margin:4px 0">▶ ${esc(v[1])}${v[2] ? ' <small>(' + esc(v[2]) + ')</small>' : ''}</button>`).join('');
      res.querySelectorAll('[data-i]').forEach(b=> b.addEventListener('click', ()=>{
        const v = l[+b.dataset.i], list = [v].concat(l.filter(x=> x !== v).slice(0, 4));
        const u = LS.get(USER, {}) || {}; u[g.id] = list; LS.set(USER, u);
        cur = {id: g.id, list, i: 0, playing: false}; LS.set('jrpg_music', 'on'); playTrack();
        const sh = document.getElementById('xOstFind'); if(sh) sh.classList.remove('show'); toast('Colonna sonora scelta: la ricordo per questo gioco', 2400);
      }));
    };
    body.querySelector('#ostGo').addEventListener('click', go);
    inp.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); go(); } });
    body.querySelectorAll('[data-q]').forEach(b=> b.addEventListener('click', ()=>{ inp.value = nm + ' ' + b.dataset.q; go(); }));
    setTimeout(go, 50);
  }
  // 🔁 cambia il brano che sta suonando con un'alternativa (dallo stesso album senza pubblicità o da YouTube); la scelta resta bloccata 🔒
  async function openSwap(g){
    if(!(cur.id === g.id && cur.list.length)){ toast('Fai partire la musica di questo gioco, poi cambia il brano', 2500); return; }
    const body = sheet('xOstSwap', '🔁 Cambia questo brano', `<div class="lp-sub">Sta suonando: <b>${esc(cur.list[cur.i][1])}</b>. Scegli quello che preferisci: prende il suo posto e resta salvato 🔒 per questo gioco (nessun aggiornamento lo cambia).</div><div id="swRes" class="lp-sub">Cerco le alternative…</div>
      <div class="lp-tools"><button class="btn" id="swAuto" type="button">↩️ Torna alla scelta automatica</button></div>`);
    body.querySelector('#swAuto').addEventListener('click', ()=>{ const u = LS.get(USER, {}) || {}; delete u[g.id]; LS.set(USER, u); const sh = document.getElementById('xOstSwap'); if(sh) sh.classList.remove('show'); cur = {id: null, list: [], i: 0, playing: false}; playFor(g, true); toast('Brani di nuovo automatici', 2000); });
    const inList = new Set(cur.list.map(x=> x[0])), alts = [];
    try{ const a = await iaAlbum(g); if(a && a.alt) a.alt.filter(x=> !inList.has(x[0])).slice(0, 25).forEach(x=> alts.push(x)); }catch(e){}
    try{
      const seen = new Set(), yt = [];
      for(const q of queriesFor(g.name).slice(0, 2)){ (await searchYT(q).catch(()=> [])).forEach(v=>{ if(!seen.has(v[0])){ seen.add(v[0]); yt.push(v); } }); }
      yt.filter(v=> !BAD.test(v[1]) && secsOf(v[2]) >= 60 && secsOf(v[2]) <= 15 * 60 && namesGame(v[1], g.name) && !inList.has(v[0])).sort((a, b)=> (b[3] || 0) - (a[3] || 0)).slice(0, 12).forEach(v=> alts.push(v));
    }catch(e){}
    const res = body.querySelector('#swRes'); if(!res) return;
    if(!alts.length){ res.textContent = 'Non trovo alternative ora: prova con 🔎 e parole tue.'; return; }
    res.innerHTML = alts.map((v, i)=> `<button type="button" class="btn" data-i="${i}" style="display:block;width:100%;text-align:left;margin:4px 0">${isIA(v) ? '🚫📢' : '▶'} ${esc(v[1])}${v[2] ? ' <small>(' + esc(v[2]) + ')</small>' : ''}</button>`).join('');
    res.querySelectorAll('[data-i]').forEach(b=> b.addEventListener('click', ()=>{
      const v = alts[+b.dataset.i], list = cur.list.slice(); list[cur.i] = v;
      const u = LS.get(USER, {}) || {}; u[g.id] = list; LS.set(USER, u);
      cur.list = list; LS.set('jrpg_music', 'on'); playTrack();
      const sh = document.getElementById('xOstSwap'); if(sh) sh.classList.remove('show'); toast('🔒 Brano cambiato e bloccato per questo gioco', 2400);
    }));
  }
  async function playTrack(){
    const t = cur.list[cur.i]; if(!t) return;
    if(isIA(t)){
      try{ yt && yt.pauseVideo(); }catch(e){}
      dock(); const a = audio(); a.src = t[0].slice(3); a.volume = .7;
      try{ await a.play(); cur.playing = true; }catch(e){ cur.playing = false; if(e && e.name === 'NotAllowedError') toast('Tocca ▶ per far partire la musica', 2500); }
      paint(); return;
    }
    try{ au && au.pause(); }catch(e){}
    try{ await loadYT(); }catch(e){ toast('La musica non parte: YouTube non è raggiungibile ora', 3500); return; }
    dock();
    if(!yt){
      yt = new YT.Player('rtYt', {host: 'https://www.youtube-nocookie.com', width: 200, height: 113, videoId: t[0], playerVars: {autoplay: 1, playsinline: 1, controls: 0, rel: 0, modestbranding: 1},
        events: {onReady: e=>{ try{ e.target.setVolume(70); e.target.playVideo(); }catch(x){} }, onStateChange: e=>{ cur.playing = e.data === 1; if(e.data === 1) cur.fails = 0; if(e.data === 0) next(true); paint(); }, onError: ()=> failNext()}});
    } else { try{ yt.loadVideoById(t[0]); }catch(e){} }
    cur.playing = true; paint();
  }
  async function playFor(g, force){
    if(!force && !ON()) return;
    if(cur.id === g.id && cur.list.length && (cur.playing || !force)){ paint(); return; }
    const list = await tracksFor(g);
    if(!list.length){ cur = {id: g.id, list: [], i: 0, playing: false, none: true}; paintBar(); if(force) toast('Non trovo la colonna sonora: prova col tasto 🔎', 3200); return; }
    const pick = (LS.get(PICK, {}) || {})[g.id] || 0;
    cur = {id: g.id, list, i: Math.min(pick, list.length - 1), playing: false};
    paintBar(); playTrack();
  }
  function pause(){ try{ yt && yt.pauseVideo(); }catch(e){} try{ au && au.pause(); }catch(e){} cur.playing = false; paint(); }
  function resume(){ LS.set('jrpg_music', 'on'); const t = cur.list[cur.i]; if(isIA(t)){ if(au && au.src) au.play().catch(()=>{}); else playTrack(); } else { try{ yt && yt.playVideo(); }catch(e){} } cur.playing = true; paint(); }
  function next(auto){ if(!cur.list.length) return; cur.i = (cur.i + 1) % cur.list.length; if(!auto){ const p = LS.get(PICK, {}) || {}; p[cur.id] = cur.i; LS.set(PICK, p); } playTrack(); }
  function stopAll(){ LS.set('jrpg_music', 'off'); try{ yt && yt.stopVideo(); }catch(e){} try{ au && au.pause(); }catch(e){} cur.playing = false; paint(); toast('Musica spenta ovunque: premi ▶ in una scheda per riaccenderla', 3000); }
  window.rtMusic = {playFor, stop: stopAll, on: ON, dock};
  // barra nella scheda del gioco
  // ---- lettore nella scheda (v198): titolo grande, album/fonte, barra di avanzamento toccabile, ⏮ ⏯ ⏭, elenco dei brani, 🔁 cambia, 🔎 cerca ----
  const albumOf = g=>{ try{ const e = (LS.get(IA, {}) || {})[g.id]; return e && e.album ? e.album : ''; }catch(e){ return ''; } };
  function barHtml(g){
    const mine = cur.id === g.id && cur.list.length, t = mine ? cur.list[cur.i] : null, playing = ON() && mine && cur.playing;
    const locked = !!(LS.get(USER, {}) || {})[g.id];
    const src = t ? (isIA(t) ? '🚫📢 senza pubblicità · ' + (albumOf(g) || 'Internet Archive') : '▶ YouTube') : '';
    const status = STAT[g.id] || (cur.id === g.id && cur.none ? 'Non trovata: prova col tasto 🔎' : (ON() ? 'Cerco la colonna sonora…' : 'Premi ▶: la musica resta accesa per tutti i giochi'));
    const list = mine ? `<div class="mz2-list" hidden>${cur.list.map((x, i)=> `<button type="button" class="mz2-li${i === cur.i ? ' cur' : ''}" data-mz="pick" data-i="${i}"><span>${i + 1}</span><b>${esc(x[1])}</b><small>${esc(x[2] || '')}</small></button>`).join('')}</div>` : '';
    return `<div class="mz2${playing ? ' on' : ''}" id="mzBar">
      <div class="mz2-top"><div class="mz2-art${playing ? ' spin' : ''}">🎵</div><div class="mz2-info"><b class="mz2-title">${t ? esc(t[1]) : 'Colonna sonora'}</b><small>${t ? esc(src) + ' · ' + (cur.i + 1) + '/' + cur.list.length + (locked ? ' · 🔒 scelti da te' : '') : esc(status)}</small></div></div>
      ${mine ? `<div class="mz2-prog"><span class="mz2-cur">0:00</span><div class="mz2-pb" data-mz="seek"><i></i></div><span class="mz2-dur">${esc(t[2] || '')}</span></div>` : ''}
      <div class="mz2-ctl"><button type="button" data-mz="prev" title="Brano precedente" aria-label="Precedente">⏮</button><button type="button" class="mz2-play" data-mz="play" aria-label="Play o pausa">${playing ? '❚❚' : '▶'}</button><button type="button" data-mz="next" title="Brano successivo" aria-label="Successivo">⏭</button>
        <span class="mz2-sep"></span><button type="button" data-mz="list" title="Elenco dei brani" aria-label="Elenco">☰</button><button type="button" data-mz="swap" title="Questo brano non mi piace: cambialo (poi resta bloccato 🔒)" aria-label="Cambia brano">🔁</button><button type="button" data-mz="find" title="Cerca con parole tue" aria-label="Cerca">🔎</button><button type="button" data-mz="stop" title="Ferma la musica ovunque" aria-label="Ferma">■</button></div>
      ${list}</div>`;
  }
  const mmss = x=>{ x = Math.max(0, Math.floor(+x || 0)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
  let progT = 0;
  function progTick(){
    const b = document.getElementById('mzBar'); if(!b){ clearInterval(progT); progT = 0; return; }
    const t = cur.list[cur.i]; if(!t) return; let c = 0, d = 0;
    try{ if(isIA(t) && au){ c = au.currentTime; d = au.duration; } else if(yt && yt.getCurrentTime){ c = yt.getCurrentTime(); d = yt.getDuration(); } }catch(e){}
    const i = b.querySelector('.mz2-pb i'), ce = b.querySelector('.mz2-cur'), de = b.querySelector('.mz2-dur');
    if(i && d) i.style.width = Math.min(100, 100 * c / d) + '%'; if(ce) ce.textContent = mmss(c); if(de && d) de.textContent = mmss(d);
  }
  function prev(){ if(!cur.list.length) return; cur.i = (cur.i - 1 + cur.list.length) % cur.list.length; const p = LS.get(PICK, {}) || {}; p[cur.id] = cur.i; LS.set(PICK, p); playTrack(); }
  function wireBar(g){
    const b = document.getElementById('mzBar'); if(!b) return;
    if(!progT) progT = setInterval(progTick, 1000);
    b.addEventListener('click', e=>{ const x = e.target.closest('[data-mz]'); if(!x) return; const m = x.dataset.mz;
      const mine = cur.id === g.id && cur.list.length;
      if(m === 'play'){ if(mine){ cur.playing ? pause() : resume(); } else { LS.set('jrpg_music', 'on'); playFor(g, true); } }
      else if(m === 'find') openFind(g);
      else if(m === 'swap') openSwap(g);
      else if(m === 'list'){ const l = b.querySelector('.mz2-list'); if(l) l.hidden = !l.hidden; else toast('Fai partire la musica per vedere i brani', 2000); }
      else if(m === 'pick'){ cur.i = +x.dataset.i; const p = LS.get(PICK, {}) || {}; p[g.id] = cur.i; LS.set(PICK, p); LS.set('jrpg_music', 'on'); playTrack(); }
      else if(m === 'seek'){ const r = x.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), t = cur.list[cur.i]; try{ if(isIA(t) && au && au.duration) au.currentTime = f * au.duration; else if(yt && yt.getDuration) yt.seekTo(f * yt.getDuration(), true); }catch(err){} progTick(); }
      else if(m === 'stop') stopAll();
      else if(m === 'prev'){ if(mine) prev(); }
      else if(m === 'next'){ if(mine) next(); else { LS.set('jrpg_music', 'on'); playFor(g, true); } } });
    progTick();
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
      <label class="ask-toggle"><input type="checkbox" id="muIA" ${LS.get(SRC, 'ia') === 'ia' ? 'checked' : ''}> 🚫📢 Prima le colonne sonore SENZA pubblicità (album completi su Internet Archive); YouTube solo se l'album non c'è</label>
      <label class="gs-row">Volume dei suoni <input type="range" min="0" max="1" step="0.05" value="${vol}" id="sfxVol"></label>
      <label class="ask-toggle"><input type="checkbox" id="muFloat" ${LS.get(MODE, 'dock') === 'float' ? 'checked' : ''}> Player mobile (lo sposti tu) invece che fisso sotto la ricerca <small>(si applica al riavvio)</small></label>
      <button class="btn" type="button" id="muReset">Rimetti il player al suo posto</button>
      <div class="snd-grid"><button type="button" class="btn${cur0 === 'off' ? ' primary' : ''}" data-snd="off">Nessun suono</button>${Object.entries(THEMES).map(([k, t])=> `<button type="button" class="btn${cur0 === k ? ' primary' : ''}" data-snd="${k}">${esc(t.name)}</button>`).join('')}</div>`);
    body.querySelectorAll('[data-snd]').forEach(b=> b.addEventListener('click', ()=>{ LS.set('jrpg_sfx', b.dataset.snd); body.querySelectorAll('[data-snd]').forEach(x=> x.classList.toggle('primary', x === b)); if(b.dataset.snd !== 'off'){ rtSfx('success', b.dataset.snd); } }));
    body.querySelector('#sfxVol').addEventListener('input', e=>{ LS.set('jrpg_sfx_vol', +e.target.value); if(master) master.gain.value = +e.target.value; });
    body.querySelector('#sfxVol').addEventListener('change', ()=> rtSfx('fav'));
    body.querySelector('#muReset').addEventListener('click', ()=>{ LS.set(POS, null); const d = document.getElementById('rtMusic'); if(d){ d.style.left = ''; d.style.top = ''; d.style.bottom = ''; } toast('Player rimesso al suo posto', 1800); });
    body.querySelector('#muFloat').addEventListener('change', e=>{ LS.set(MODE, e.target.checked ? 'float' : 'dock'); toast('Fatto: si applica al prossimo avvio del programma', 2600); });
    body.querySelector('#muIA').addEventListener('change', e=>{ LS.set(SRC, e.target.checked ? 'ia' : 'yt'); toast(e.target.checked ? 'Prima gli album senza pubblicità' : 'Prima YouTube', 2000); });
    body.querySelector('#muOn').addEventListener('change', e=>{ LS.set('jrpg_music', e.target.checked ? 'on' : 'off'); if(!e.target.checked){ try{ yt && yt.stopVideo(); }catch(x){} cur.playing = false; paint(); } });
  }
  menu(gi('pad') + ' Suoni e musica (15 temi)', openSound);
})();
