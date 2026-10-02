// ---- Movimento: animazioni fluide, piccoli «effetti sorpresa», vibrazione al tocco e stati vuoti con Frugu ----
// Si regola da ✨ → «Movimento e vibrazione». Si ferma da solo con «riduci animazioni» del telefono.
// Cosa fa: le righe della classifica entrano a cascata · la scheda si apre «allargandosi» dalla riga toccata (sul telefono) · cambiando sezione dalla barra in basso
// la pagina scivola (View Transitions, dove il browser le ha) · il preferito esplode in scintille · il voto della scheda conta fino al valore · vibrazione brevissima
// (Android: vibrazione; iPhone da iOS 17.4: «tic» del sistema; l'iPad non ha il motorino e non vibra) · pagine vuote con Frugu e un pulsante utile.
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.motion) return;
  const html = document.documentElement;
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const K_MO = 'jrpg_motion', K_HP = 'jrpg_haptics';           // jrpg_haptics resta testo semplice ('off') come prima
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
  const moOn = ()=> LSG(K_MO, 'on') !== 'off' && !mq.matches;
  const syncMo = ()=> html.classList.toggle('mo-off', !moOn());
  syncMo(); try{ mq.addEventListener('change', syncMo); }catch(e){}

  // ---------------------------------------------------------------- vibrazione
  const hapOn = ()=>{ try{ return localStorage.getItem(K_HP) !== 'off'; }catch(e){ return true; } };
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let swEl = null;
  function iosTick(){                                              // iOS 17.4+: un interruttore nascosto, quando scatta, fa il «tic» di sistema
    try{
      if(!swEl){
        const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true'); l.style.cssText = 'position:fixed;left:-60px;top:-60px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; l.appendChild(i); document.body.appendChild(l); swEl = l;
      }
      swEl.click();
    }catch(e){}
  }
  function haptic(kind){
    if(!hapOn()) return;
    if(navigator.vibrate){ try{ navigator.vibrate(kind === 'success' ? [8, 36, 10] : kind === 'soft' ? 5 : 8); }catch(e){} return; }
    if(IOS){ iosTick(); if(kind === 'success') setTimeout(iosTick, 90); }
  }
  window.rtHaptic = haptic;
  // su iPhone il «tic» parte solo da un gesto completato: lo do alla fine del tocco (sull'iPad non esiste, ma il tentativo è innocuo)
  if(IOS && !navigator.vibrate) document.addEventListener('click', e=>{
    if(e.target.closest && e.target.closest('button, .btn, .iconbtn, .view-tab, .qf-chip, .list-chip, .tagchip, #tbody tr')) haptic('tick');
  }, true);
  // anteprima a pressione: «tic» quando compare e quando rilasci
  try{
    const watchPv = ()=>{
      const pv = document.getElementById('pvBackdrop'); if(!pv || pv._mo) return; pv._mo = 1;
      let was = false;
      new MutationObserver(()=>{ const s = pv.classList.contains('show'); if(s !== was){ was = s; haptic(s ? 'soft' : 'tick'); } }).observe(pv, {attributes: true, attributeFilter: ['class']});
    };
    new MutationObserver(watchPv).observe(document.body, {childList: true}); watchPv();
  }catch(e){}

  // ---------------------------------------------------------------- righe a cascata
  let lastKey = null;
  function cascade(){
    if(!moOn() || window.__rtViewSwitch) return;                      // v212: tornando alla classifica dalla barra in basso niente righe che scendono
    const AID = animId(); if(AID === 'lampo') return;                // v218: stile «Lampo»: righe già al loro posto
    const tb = document.getElementById('tbody'); if(!tb || !tb.children.length) return;
    const k = typeof lastViewKey !== 'undefined' ? lastViewKey : String(tb.children.length);
    if(k === lastKey) return; lastKey = k;
    const a = document.activeElement; if(a && a.id === 'search') return;      // mentre scrivi nella ricerca le righe cambiano di colpo, senza effetti
    const vh = innerHeight; let i = 0;
    for(const tr of tb.children){
      if(i > 13) break; if(tr.classList.contains('sk')) continue;
      const r = tr.getBoundingClientRect(); if(r.bottom < 0) continue; if(r.top > vh) break;
      const RF = ROWFX[AID];
      try{ tr.animate(RF ? RF.kf : [{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'none'}], {duration: RF ? RF.dur : 420, delay: i * (RF ? RF.step : 26), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'}); }catch(e){}
      i++;
    }
  }
  if(typeof window.render === 'function'){
    const orig = window.render;
    window.render = function(){ const r = orig.apply(this, arguments); try{ cascade(); }catch(e){} return r; };
    try{ render = window.render; }catch(e){}
  }

  // ---------------------------------------------------------------- v218: STILI DI ANIMAZIONE (6 + «come il mio telefono»)
  // Uno solo scelto in ✨ → Movimento e vibrazione (jrpg_anim); governa: apertura/chiusura della scheda, cambio sezione, righe che entrano,
  // pannelli e tocco. Tutto solo con transform/opacity (lo fa la scheda grafica): nessun lavoro in più per il telefono, nessun ritardo al tocco.
  const AK = 'jrpg_anim';
  const STYLES = [
    {id: 'lampo', n: '⚡ Lampo', d: 'Quasi nessun movimento: compare subito. Il più rapido e leggero.'},
    {id: 'morbida', n: '🌫️ Morbida', d: 'Dissolvenza con una piccola salita. Calma e pulita.'},
    {id: 'zoom', n: '🔍 Zoom', d: 'Si avvicina dal punto che tocchi (lo stile di sempre).'},
    {id: 'rimbalzo', n: '🎈 Rimbalzo', d: 'Si ingrandisce con un piccolo rimbalzo finale. Vivace.'},
    {id: 'scivola', n: '📜 Scorrimento', d: 'Sale dal basso come un foglio. Pulito e preciso.'},
    {id: 'cinema', n: '🎬 Cinema', d: 'Arriva da vicino e si assesta, lenta e morbida.'},
    {id: 'telefono', n: '📱 Come il mio telefono', d: 'Cresce dall\'icona toccata fino a tutto schermo, come le app di Android (circa 0,24 s).'}
  ];
  const animId = ()=>{ const v = LSG(AK, 'zoom'); return STYLES.some(s=> s.id === v) ? v : 'zoom'; };
  const syncAnim = ()=> html.setAttribute('data-anim', animId());
  syncAnim();
  const EASE_PH = 'cubic-bezier(.2,.85,.25,1)';
  // apertura della scheda: keyframe (solo scale/translate: la dissolvenza la fa il CSS, e «transform:none» dei CSS non blocca queste proprietà)
  function openFx(id, T, box){
    if(id === 'lampo') return null;
    if(id === 'morbida') return {kf: [{translate: '0 18px'}, {translate: '0 0'}], dur: 240, ease: 'cubic-bezier(.22,1,.36,1)'};
    if(id === 'zoom') return {kf: [{scale: '.93', translate: '0 14px'}, {scale: '1', translate: '0 0'}], dur: 280, ease: 'cubic-bezier(.2,.9,.25,1)', origin: true};
    if(id === 'rimbalzo') return {kf: [{scale: '.86', easing: 'cubic-bezier(.2,.9,.3,1)'}, {scale: '1.018', offset: .62, easing: 'ease-out'}, {scale: '1'}], dur: 380, ease: 'linear', origin: true};
    if(id === 'scivola') return {kf: [{translate: '0 9%'}, {translate: '0 0'}], dur: 280, ease: 'cubic-bezier(.32,.72,0,1)'};
    if(id === 'cinema') return {kf: [{scale: '1.05'}, {scale: '1'}], dur: 380, ease: 'cubic-bezier(.16,1,.3,1)'};
    // telefono: la finestra nasce dalla copertina/riga toccata e cresce a tutto schermo (angoli arrotondati), come il lanciatore di Android
    const r = T && T.r && T.r.width > 20 ? T.r : null;
    if(!r || !box) return {kf: [{scale: '.8'}, {scale: '1'}], dur: 240, ease: EASE_PH, round: true};
    const s = Math.max(.12, Math.min(.6, r.width / box.width));
    return {kf: [{scale: String(s), translate: (r.left + r.width / 2 - (box.left + box.width / 2)) + 'px ' + (r.top + r.height / 2 - (box.top + box.height / 2)) + 'px'}, {scale: '1', translate: '0 0'}], dur: 240, ease: EASE_PH, round: true};
  }
  // locandina IMMEDIATA: la miniatura del gioco toccato è già nella lista (caricata e decodificata): la metto subito nella scheda, sotto l'immagine nitida,
  // che arriva dopo e si sovrappone in dissolvenza. Prima: riquadro viola vuoto (con un bordino chiaro) per circa 0,4 s, poi sfocata, poi nitida.
  function seedCover(card, T){
    try{
      if(!card || !T || !T.el || !T.el.querySelector)return;
      const th = T.el.querySelector('.x-cover img, .x-thumb img'); if(!th || !th.complete || !th.naturalWidth)return;
      const fr = card.querySelector('.cover-frame'); if(!fr)return;
      const big = fr.querySelector('img.modal-cover'); if(!big || (big.complete && big.naturalWidth))return;
      const src = th.currentSrc || th.src; if(!src || /^data:/.test(src) && src.length > 4000) return;
      const im = document.createElement('img'); im.className = 'cv-seed'; im.alt = ''; im.decoding = 'sync'; im.src = src;
      fr.insertBefore(im, big); fr.classList.add('has-seed'); fr.style.setProperty('--cov', "url('" + src.replace(/'/g, '%27') + "')");
      const off = ()=>{ setTimeout(()=>{ try{ im.remove(); fr.classList.remove('has-seed'); }catch(e){} }, 320); };
      big.addEventListener('load', off, {once: true}); big.addEventListener('error', off, {once: true}); setTimeout(()=>{ try{ im.remove(); }catch(e){} }, 6000);
    }catch(e){}
  }
  function playOpen(card, T, box){
    if(!card || !card.animate) return;
    const id = animId(); if(!box) box = card.getBoundingClientRect();
    const fx = openFx(id, T, box); if(!fx) return;
    if(fx.origin) card.style.transformOrigin = (T ? Math.round(T.x - box.left) : box.width / 2) + 'px ' + (T ? Math.round(T.y - box.top) : box.height * .6) + 'px';
    card.style.willChange = 'transform, opacity'; if(fx.round) card.classList.add('rt-an-round');
    const done = ()=>{ card.style.transformOrigin = ''; card.style.willChange = ''; card.classList.remove('rt-an-round'); };
    try{ card.animate(fx.kf, {duration: fx.dur, easing: fx.ease}).finished.then(done, done); }catch(e){ done(); }
  }
  // cambio sezione (Classifica, Novità…): il pannello nuovo compare già visibile (parte da metà opacità: nessun ritardo percepito)
  const SECT = {
    morbida: {kf: [{opacity: .55, translate: '0 10px'}, {opacity: 1, translate: '0 0'}], dur: 180, ease: 'cubic-bezier(.22,1,.36,1)'},
    rimbalzo: {kf: [{scale: '.965', opacity: .6, easing: 'cubic-bezier(.2,.9,.3,1)'}, {scale: '1.006', opacity: 1, offset: .62, easing: 'ease-out'}, {scale: '1', opacity: 1}], dur: 280, ease: 'linear'},
    scivola: {kf: [{opacity: .5, translate: '0 18px'}, {opacity: 1, translate: '0 0'}], dur: 220, ease: 'cubic-bezier(.32,.72,0,1)'},
    cinema: {kf: [{opacity: .35}, {opacity: 1}], dur: 280, ease: 'ease-out'},
    telefono: {kf: [{opacity: .55, scale: '.95'}, {opacity: 1, scale: '1'}], dur: 210, ease: EASE_PH}
  };
  const PANELS = ['tableWrap', 'altView', 'myTierWrap', 'statsPanel', 'sagaPanel', 'discoverPanel', 'novitaPanel', 'novitaGenrePanel'];
  function section(){
    if(!moOn()) return; const S = SECT[animId()]; if(!S) return;
    const el = PANELS.map(id=> document.getElementById(id)).find(e=> e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'); if(!el) return;
    try{ el.animate(S.kf, {duration: S.dur, easing: S.ease}); }catch(e){}
  }
  // righe della lista che entrano (a cascata)
  const ROWFX = {
    morbida: {kf: [{opacity: 0, translate: '0 10px'}, {opacity: 1, translate: '0 0'}], dur: 300, step: 18},
    rimbalzo: {kf: [{opacity: 0, scale: '.94'}, {opacity: 1, scale: '1.012', offset: .6}, {opacity: 1, scale: '1'}], dur: 420, step: 28},
    scivola: {kf: [{opacity: 0, translate: '0 26px'}, {opacity: 1, translate: '0 0'}], dur: 360, step: 22},
    cinema: {kf: [{opacity: 0}, {opacity: 1}], dur: 520, step: 36},
    telefono: {kf: [{opacity: 0, scale: '.96'}, {opacity: 1, scale: '1'}], dur: 300, step: 20}
  };
  window.rtAnim = {
    STYLES, id: animId,
    set(id){ if(!STYLES.some(s=> s.id === id)) return; LSS(AK, id); syncAnim(); },
    section,
    demo(el){ if(!el || !el.animate) return; const id = animId(), fx = openFx(id, null, null); if(!fx){ el.animate([{opacity: .3}, {opacity: 1}], {duration: 90}); return; }
      el.style.transformOrigin = '50% 50%'; el.animate(fx.kf, {duration: fx.dur, easing: fx.ease}); }
  };

  // ---------------------------------------------------------------- la scheda si apre dalla riga toccata
  let tap = null;
  document.addEventListener('pointerdown', e=>{
    const el = e.target.closest && e.target.closest('tr[data-gid], [data-gid], .x-card[data-id], .x-row[data-id]');
    tap = {x: e.clientX, y: e.clientY, t: performance.now(), r: el ? el.getBoundingClientRect() : null, el};
    // v216: risposta immediata al tocco — il gioco toccato si «schiaccia» subito (prima ancora che la scheda sia pronta)
    try{ if(el && el.classList && moOn()){ el.classList.add('rt-press'); const off = ()=>{ el.classList.remove('rt-press'); }; setTimeout(off, 450); window.addEventListener('pointercancel', off, {once: true}); } }catch(x){}
  }, true);
  let VW = innerWidth, VH = innerHeight;
  addEventListener('resize', ()=>{ VW = innerWidth; VH = innerHeight; }, {passive: true});
  function reveal(){
    if(!moOn() || VW > 760) return;
    const card = document.getElementById('modalCard'), bd = document.getElementById('modalBackdrop');
    if(!card || !bd || !bd.classList.contains('show') || !card.animate) return;
    const R = tap && performance.now() - tap.t < 1200 ? tap : null, W = VW, H = VH;      // misure già pronte: leggerle qui costringerebbe il telefono a impaginare la scheda a metà
    let l, t, rr, b, rad = 18;
    if(R && R.r && R.r.width > 60 && R.r.height > 20){ l = R.r.left; t = R.r.top; rr = W - R.r.right; b = H - R.r.bottom; rad = 14; }
    else { const x = R ? R.x : W / 2, y = R ? R.y : H * .62; l = x - 80; t = y - 26; rr = W - x - 80; b = H - y - 26; rad = 26; }
    l = Math.max(0, l); rr = Math.max(0, rr); t = Math.max(0, t); b = Math.max(0, b);
    // v200: niente più «ritaglio» (pesante da disegnare a ogni fotogramma su una scheda lunga): la scheda sale e si allarga
    // dal punto toccato muovendo solo il livello (scorrevole anche sui telefoni lenti)
    const cy = Math.round((t + (H - b)) / 2), cx = Math.round((l + (W - rr)) / 2);
    card.style.transformOrigin = cx + 'px ' + Math.max(0, cy) + 'px'; card.style.opacity = '0';
    // aspetto che il telefono abbia impaginato la scheda (primo fotogramma, scheda ancora invisibile): poi l'animazione parte pulita, senza salti
    requestAnimationFrame(()=> requestAnimationFrame(()=>{
      card.style.opacity = '';
      try{ card.animate([{transform: 'translateY(18px) scale(.92)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 340, easing: 'cubic-bezier(.2,.9,.25,1)'}).finished.then(()=>{ card.style.transformOrigin = ''; }).catch(()=>{}); }catch(e){}
    }));
    haptic('soft');
    // il voto «salta» e conta fino al valore
    setTimeout(()=>{
      card.querySelectorAll('.badge.big').forEach(el=>{
        try{ el.animate([{transform: 'scale(.55)', opacity: 0}, {transform: 'scale(1.14)', opacity: 1, offset: .6}, {transform: 'scale(1)', opacity: 1}], {duration: 560, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards'}); }catch(e){}
        const m = el.textContent.trim().match(/^(\d{1,3})(\/100)?$/);
        if(m && !el.dataset.moCount){
          el.dataset.moCount = '1'; const to = +m[1], suf = m[2] || '', w = el.offsetWidth; el.style.minWidth = w + 'px';
          const t0 = performance.now();
          const step = now=>{ const p = Math.min(1, (now - t0) / 720), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if(p < 1) requestAnimationFrame(step); else el.style.minWidth = ''; };
          requestAnimationFrame(step);
        }
      });
    }, 460);
  }
  // v201: apertura «stile iPhone». Al tocco parte SUBITO un cartoncino che si allarga dalla riga fino a tutto schermo:
  // si muove solo con transform/opacity, quindi lo anima la scheda grafica a 60/120 Hz anche mentre il telefono costruisce la scheda vera.
  // Quando la scheda vera è impaginata, il cartoncino sfuma e lascia il posto a lei. Niente attese, niente scatti.
  const EASE = 'cubic-bezier(.32,.72,0,1)';          // la curva delle animazioni di iOS
  let LASTC = null;
  function ghostOpen(R){
    const W = VW, H = VH, r = R.r;
    const gh = document.createElement('div'); gh.className = 'rt-ghost';
    const panel = document.createElement('div'); panel.className = 'rt-ghost-p'; gh.appendChild(panel);
    let im = null;
    try{ const src = R.el && [...R.el.querySelectorAll('img')].find(x=>{ const b = x.getBoundingClientRect(); return b.width >= 40 && b.height >= b.width * 1.15; }); if(src && src.currentSrc){ /* solo una vera locandina (verticale), non le iconcine */ im = document.createElement('img'); im.className = 'rt-ghost-i'; im.src = src.currentSrc; im.decoding = 'sync'; gh.appendChild(im); im._r = src.getBoundingClientRect(); } }catch(e){}
    document.body.appendChild(gh);
    const sx = Math.max(.05, r.width / W), sy = Math.max(.02, r.height / H);
    const anims = [panel.animate([{transform: `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`, opacity: .5}, {opacity: 1, offset: .35}, {transform: 'none', opacity: 1}], {duration: 300, easing: EASE, fill: 'both'})];
    if(im && im._r && im._r.width > 4){
      const fw = LASTC ? LASTC.w : Math.min(W * .74, 340), fh = LASTC ? LASTC.h : fw * 1.33, fx = LASTC ? LASTC.l : (W - fw) / 2, fy = LASTC ? LASTC.t : 120;       // dove starà la locandina (v215: dove stava l'ultima volta)
      im.style.cssText = `left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px`;
      im._fin = {l: fx, t: fy, w: fw, h: fh};
      const k = im._r.width / fw;
      anims.push(im.animate([{transform: `translate(${im._r.left - fx}px, ${im._r.top - fy}px) scale(${k}, ${im._r.height / fh})`}, {transform: 'none'}], {duration: 300, easing: EASE, fill: 'both'}));
    }
    return {gh, panel, im, done: Promise.all(anims.map(a=> a.finished.catch(()=>{})))};
  }
  function countUp(card){
    setTimeout(()=>{
      card.querySelectorAll('.badge.big').forEach(el=>{
        const m = el.textContent.trim().match(/^(\d{1,3})(\/100)?$/);
        if(m && !el.dataset.moCount){
          el.dataset.moCount = '1'; const to = +m[1], suf = m[2] || '';
          el.style.fontVariantNumeric = 'tabular-nums';
          const t0 = performance.now();
          const step = now=>{ const p = Math.min(1, (now - t0) / 650), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if(p < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step);
        }
      });
    }, 120);
  }
  if(typeof window.openModal === 'function'){
    const origOpen = window.openModal;
    window.openModal = function(){
      const bd = document.getElementById('modalBackdrop'), was = bd && bd.classList.contains('show');
      const R = tap && performance.now() - tap.t < 900 && tap.r && tap.r.width > 60 ? tap : null;
      // v216: apertura SEMPLICE e leggera — niente più «prima la locandina e poi il resto»: la scheda si costruisce subito e compare tutta insieme,
      // avvicinandosi dal punto toccato (solo transform/opacity: lo fa la scheda grafica, non pesa sul telefono). Il cartoncino resta solo come riserva (RT_GHOST).
      if(!was && moOn() && VW <= 760 && !window.RT_GHOST){
        const T = tap && performance.now() - tap.t < 900 ? tap : null; tap = null; haptic('soft');
      window.__rtOpenAt = performance.now(); window.__rtOpenUntil = performance.now() + 420;                     // v218: per questa frazione di secondo i lavori di sottofondo aspettano (l'animazione ha tutta la forza)
        const r = origOpen.apply(this, arguments);
        try{
          const card = document.getElementById('modalCard');
          if(card && card.animate){
            seedCover(card, T);
            playOpen(card, T, {left: 0, top: 0, width: VW, height: VH});
            countUp(card);
          }
          if(T && T.el && T.el.classList) T.el.classList.remove('rt-press');
        }catch(e){}
        return r;
      }
      if(!was && R && moOn() && VW <= 760 && document.body.animate){
        tap = null; haptic('soft');
        const self = this, G = ghostOpen(R), T0 = performance.now(); let args = arguments;
        setTimeout(()=>{ try{ if(G.gh.isConnected) G.gh.remove(); const c = document.getElementById('modalCard'); if(c && c.style.opacity === '0') c.style.opacity = ''; }catch(x){} }, 2500);   // rete di sicurezza: il cartoncino non resta MAI sopra l'app
        // lascio partire il cartoncino (un fotogramma), poi costruisco la scheda vera sotto di lui
        // v210: se i testi lunghi del gioco non sono ancora arrivati, li aspetto (al massimo 450 ms) MENTRE il cartoncino si allarga:
        // così la scheda si costruisce una volta sola, già completa (prima si disegnava vuota e poi di nuovo, con un salto)
        const g0 = args[0], needTx = !!(g0 && window.rtTexts && !rtTexts.has(g0));
        const wait = needTx ? Promise.race([rtTexts.ensure(g0).catch(()=>{}), new Promise(r=> setTimeout(r, 160))]) : Promise.resolve();      // v215: al massimo 160 ms (prima 450: locandina sola sul nero); i testi ora arrivano quasi sempre prima
        requestAnimationFrame(()=> wait.then(()=> setTimeout(()=>{
          if(needTx && rtTexts.has(g0) && typeof GAMES !== 'undefined'){ const fresh = GAMES.find(x=> x.id === g0.id); if(fresh) args = [fresh].concat([].slice.call(args, 1)); }
          let card = null;
          try{ origOpen.apply(self, args); card = document.getElementById('modalCard'); if(card) card.style.opacity = '0'; }catch(e){ G.gh.remove(); throw e; }
          requestAnimationFrame(()=> requestAnimationFrame(async ()=>{
            await Promise.race([G.done, new Promise(r=> setTimeout(r, Math.max(0, 210 - (performance.now() - T0))))]);      // v215: la scheda pronta non aspetta la fine del cartoncino (prima fino a 700 ms)
            // v215: la locandina del cartoncino SCIVOLA esattamente dove sta nella scheda vera (prima si fermava in un punto fisso e poi «saltava»);
            // intanto lo sfondo del cartoncino sfuma e sotto compare la scheda; la locandina sparisce solo quando quella vera è caricata
            const ci = card && card.querySelector('#coverBlock img.modal-cover, #coverBlock img');
            const tr = ci && ci.getBoundingClientRect(), ir = G.im && G.im.isConnected && G.im._fin;
            if(tr && tr.width > 40) LASTC = {l: tr.left, t: tr.top, w: tr.width, h: tr.height};
            if(card && G.im && ir && tr && tr.width > 40 && tr.top < VH && tr.bottom > 0){
              card.style.opacity = '';
              // FLIP: l'immagine prende SUBITO misure, taglio e angoli di quella vera, e parte da dov'è adesso: arriva identica, niente cambio a fine volo
              try{
                const from = G.im.getBoundingClientRect(), cs = getComputedStyle(ci);
                G.im.getAnimations().forEach(a=> a.cancel());
                G.im.style.left = tr.left + 'px'; G.im.style.top = tr.top + 'px'; G.im.style.width = tr.width + 'px'; G.im.style.height = tr.height + 'px';
                G.im.style.objectFit = cs.objectFit || 'cover'; G.im.style.objectPosition = cs.objectPosition || ''; G.im.style.borderRadius = cs.borderRadius || '';
                if(ci.complete && ci.naturalWidth && ci.currentSrc) G.im.src = ci.currentSrc;
                G.im.animate([{transform: `translate(${from.left - tr.left}px, ${from.top - tr.top}px) scale(${from.width / tr.width}, ${from.height / tr.height})`}, {transform: 'none'}], {duration: 240, easing: EASE, fill: 'both'});
              }catch(e){}
              try{ G.panel.animate([{opacity: 1}, {opacity: 0}], {duration: 220, easing: 'ease-out', fill: 'forwards'}); }catch(e){}
              countUp(card);
              const loaded = ()=> ci.complete && ci.naturalWidth > 0 && (!ci.closest('.cover-frame') || ci.classList.contains('ld') || getComputedStyle(ci).opacity === '1');
              const t0 = performance.now();
              await new Promise(res=>{ const chk = ()=>{ if(loaded() || performance.now() - t0 > 600) res(); else setTimeout(chk, 40); }; setTimeout(chk, 250); });
              try{ G.gh.animate([{opacity: 1}, {opacity: 0}], {duration: 140, easing: 'ease-out', fill: 'forwards'}).finished.then(()=> G.gh.remove(), ()=> G.gh.remove()); }catch(e){ G.gh.remove(); }
              return;
            }
            if(card){ card.style.opacity = ''; countUp(card); }                  // v215: la scheda è già sotto, al suo posto: sfuma solo il cartoncino sopra (niente doppia dissolvenza «nera»)
            try{ G.gh.animate([{opacity: 1}, {opacity: 0}], {duration: 150, easing: 'ease-out', fill: 'forwards'}).finished.then(()=> G.gh.remove(), ()=> G.gh.remove()); }catch(e){ G.gh.remove(); }
          }));
        }, 0)));
        return;
      }
      const r = origOpen.apply(this, arguments);
      try{ if(!was){ if(animId() === 'zoom') reveal(); else { const T2 = tap && performance.now() - tap.t < 900 ? tap : null; tap = null; seedCover(document.getElementById('modalCard'), T2); playOpen(document.getElementById('modalCard'), T2); } } }catch(e){}
      return r;
    };
    try{ openModal = window.openModal; }catch(e){}
  }
  // v218: la scheda di un gioco parte SEMPRE in alto (nome e locandina in vista): prima, aprendo un gioco dopo averne scorso un altro, restava a metà.
  // Solo se è lo stesso gioco già aperto (ridisegno sul posto, es. dopo Update+) la posizione si mantiene.
  if(typeof window.openModal === 'function'){
    const inner = window.openModal;
    window.openModal = function(g){
      const c = document.getElementById('modalCard'), bd = document.getElementById('modalBackdrop');
      const same = !!(c && bd && bd.classList.contains('show') && typeof currentModalGame !== 'undefined' && currentModalGame && g && currentModalGame.id === g.id);
      // (assegnare scrollTop obbliga il telefono a impaginare subito tutta la pagina: ~40 ms. Lo faccio solo se la scheda era davvero scorsa; la posizione la tengo da un ascoltatore, senza leggerla dal layout)
      if(c && !c.__syw){ c.__syw = 1; c.__sy = 0; c.addEventListener('scroll', ()=>{ c.__sy = c.scrollTop; }, {passive: true}); }
      if(c && !same && c.__sy){ c.scrollTop = 0; c.__sy = 0; }
      const r = inner.apply(this, arguments);
      if(c && !same) requestAnimationFrame(()=>{ if(!window.__rtCardScrolling && c.__sy) c.scrollTop = 0; });
      return r;
    };
    try{ openModal = window.openModal; }catch(e){}
  }

  // ---------------------------------------------------------------- v212: cambio sezione FULMINEO
  // Prima: passaggio animato (View Transition) che partiva al «click», cioè dopo che il dito si alzava, e doveva prima fotografare la pagina:
  // ritardo ben visibile. Ora la sezione cambia appena il dito TOCCA la barra (pointerdown), senza animazioni né scorrimenti: la pagina compare
  // già in cima. Il «click» che arriva dopo viene ignorato (la sezione è già quella giusta).
  const bar = document.getElementById('viewTabs');
  if(bar){
    let swallowUntil = 0, swallowTab = null;
    // v218: il gesto «scorri su dal bordo basso» di Android (schede app / casa) parte proprio dalla barra dei tasti. Quindi la sezione non cambia
    // nell'istante del tocco ma 70 millesimi dopo, e solo se il dito è ancora fermo (se scorre, o Android prende il gesto = pointercancel, non succede nulla).
    // Negli ultimi 14 px dello schermo il tasto scatta solo al «click», quando alzi il dito.
    window.rtEdgeZone = e=> e.clientY > (window.innerHeight || 0) - 14;
    bar.addEventListener('pointerdown', e=>{
      if(e.button > 0 || e.isPrimary === false) return;
      if(window.rtEdgeZone(e)) return;
      const tab = e.target.closest && e.target.closest('.view-tab'); if(!tab) return;
      if(typeof state === 'undefined' || typeof setView !== 'function') return;
      const sx = e.clientX, sy = e.clientY;
      const go = ()=>{
        swallowTab = tab; swallowUntil = performance.now() + 900;
        const ab = document.getElementById('askBackdrop');
        if(tab.dataset.view && ab && ab.classList.contains('show')){ const cb = document.getElementById('askCloseBtn'); if(cb) cb.click(); else ab.classList.remove('show'); }      // da «Chiedi» a un'altra sezione: chiudo Chiedi
        if(tab.dataset.view){ if(tab.dataset.view !== state.view) setView(tab.dataset.view); else { try{ if(window.rtViewTop) rtViewTop(); else scrollTo({top: 0, behavior: 'instant'}); }catch(x){} } }
        else if(tab.dataset.ask && typeof openAsk === 'function') openAsk();
        haptic('tick');
      };
      let timer = 0;
      const stopW = ()=>{ clearTimeout(timer); window.removeEventListener('pointermove', mv, true); window.removeEventListener('pointercancel', stopW, true); window.removeEventListener('pointerup', stopW, true); };
      const mv = ev=>{ if(Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) stopW(); };
      timer = setTimeout(()=>{ stopW(); go(); }, 70);
      window.addEventListener('pointermove', mv, true); window.addEventListener('pointercancel', stopW, true); window.addEventListener('pointerup', stopW, true);
    }, true);
    bar.addEventListener('click', e=>{
      const tab = e.target.closest && e.target.closest('.view-tab'); if(!tab) return;
      if(tab === swallowTab && performance.now() < swallowUntil){ swallowTab = null; e.stopImmediatePropagation(); e.preventDefault(); }
      else { const ab = document.getElementById('askBackdrop'); if(tab.dataset.view && ab && ab.classList.contains('show')){ const cb = document.getElementById('askCloseBtn'); if(cb) cb.click(); else ab.classList.remove('show'); } }      // v218: tocco rapido (arriva dal click): da «Chiedi» a un'altra sezione chiudo comunque Chiedi
    }, true);
  }

  // ---------------------------------------------------------------- preferito: scintille
  function burst(x, y){
    if(!moOn()) return;
    const host = document.createElement('div'); host.className = 'mo-burst'; host.style.left = x + 'px'; host.style.top = y + 'px'; document.body.appendChild(host);
    const cols = ['#ffd23f', '#ff7ac6', '#7df3ff', '#a7ff9a', '#fff'];
    for(let i = 0; i < 14; i++){
      const p = document.createElement('i'); p.textContent = i % 3 ? '✦' : '★'; p.style.color = cols[i % cols.length]; host.appendChild(p);
      const a = (Math.PI * 2 * i) / 14 + Math.random() * .5, d = 40 + Math.random() * 42;
      try{ p.animate([{transform: 'translate(-50%,-50%) scale(.2)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(${.9 + Math.random() * .7}) rotate(${(Math.random() - .5) * 200}deg)`, opacity: 0}], {duration: 560 + Math.random() * 260, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards'}); }catch(e){}
    }
    setTimeout(()=> host.remove(), 1000);
  }
  document.addEventListener('click', e=>{
    const f = e.target.closest && e.target.closest('td.fav'); if(!f) return;
    const tr = f.closest('tr'), id = tr && +tr.dataset.gid, x = e.clientX, y = e.clientY;
    setTimeout(()=>{ try{ if(typeof FAVS !== 'undefined' && FAVS.has(id)){ burst(x, y); haptic('success'); } }catch(err){} }, 0);
  }, true);
  window.rtBurst = burst;

  // ---------------------------------------------------------------- pagine vuote con Frugu
  const FRUGU = 'icons/frugu.gif';
  const ACT = {
    reset: ['Azzera i filtri', ()=>{ const b = document.getElementById('resetBtn'); if(b) b.click(); }],
    ask: ['Chiedi a Frugu', ()=>{ if(typeof openAsk === 'function'){ openAsk(); const q = (document.getElementById('search') || {}).value; const inp = document.getElementById('askInput'); if(inp && q) inp.value = 'Parlami di ' + q; } }],
    clearSearch: ['Cancella la ricerca', ()=>{ const m = document.getElementById('mtSearch'); if(m){ m.value = ''; m.dispatchEvent(new Event('input', {bubbles: true})); } }],
    discover: ['Scopri giochi', ()=>{ if(typeof setView === 'function') setView('discover'); document.querySelectorAll('.x-sheet.show').forEach(s=> s.classList.remove('show')); }]
  };
  const KINDS = {
    list: {t: 'Frugu ha frugato dappertutto', p: 'Con questi filtri non c\'è niente. Togline qualcuno o prova a cercare un altro nome.', a: ['reset', 'ask']},
    search: {t: 'Nessun gioco con questo nome', p: 'Controlla come l\'hai scritto, oppure togli la ricerca per rivedere tutta la lista.', a: ['clearSearch']},
    saga: {t: 'Nessuna saga qui', p: 'Nessuna saga corrisponde ai filtri attuali. Prova a toglierne qualcuno.', a: ['reset']},
    wish: {t: 'La wishlist è vuota', p: 'Apri la scheda di un gioco e tocca «Wishlist»: ti avviso quando esce o scende di prezzo.', a: ['discover']}
  };
  window.rtEmpty = function(kind){
    const k = KINDS[kind] || KINDS.list;
    return `<div class="mo-empty"><img src="${FRUGU}" alt="" width="120" height="94" loading="lazy" decoding="async"><b>${esc(k.t)}</b><p>${esc(k.p)}</p><div class="mo-act">${k.a.map(a=> `<button type="button" class="btn" data-mo-act="${a}">${esc(ACT[a][0])}</button>`).join('')}</div></div>`;
  };
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('[data-mo-act]'); if(!b) return;
    const a = ACT[b.dataset.moAct]; if(a){ e.preventDefault(); e.stopPropagation(); a[1](); }
  }, true);
  { const em = document.getElementById('emptyMsg'); if(em) em.innerHTML = window.rtEmpty('list'); }

  // ---------------------------------------------------------------- impostazioni
  (window.XMENU = window.XMENU || []).push({html: '🎛️ Movimento e vibrazione', run: function(){
    const U = window.XUI; if(!U) return;
    const body = U.sheet('xMotion', '🎛️ Movimento e vibrazione', `<div class="lp-sub">Righe che entrano a cascata, la scheda che si apre dalla riga toccata, il passaggio tra le sezioni, le scintille sul preferito. Si spengono da sole se il telefono chiede «riduci animazioni».</div>
      <label class="ask-toggle"><input type="checkbox" id="moOn" ${LSG(K_MO, 'on') !== 'off' ? 'checked' : ''}> Animazioni dell'interfaccia</label>
      <div class="an-h">Stile delle animazioni <small>(vale per tutta l'app: schede, sezioni, righe, pannelli, tocco)</small></div>
      <div class="an-grid">${STYLES.map(s=> `<button type="button" class="an-opt${s.id === animId() ? ' on' : ''}" data-an="${s.id}" aria-pressed="${s.id === animId()}"><b>${s.n}</b><small>${s.d}</small></button>`).join('')}</div>
      <div class="an-demo" id="anDemo">Tocca uno stile per provarlo qui</div>
      <label class="ask-toggle"><input type="checkbox" id="moHap" ${hapOn() ? 'checked' : ''}> Vibrazione brevissima al tocco <small>(Android e iPhone da iOS 17.4; l'iPad non ha il motorino della vibrazione, quindi lì non si sente)</small></label>
      <button type="button" class="btn" id="moTry" style="margin-top:8px">${typeof giIcon === 'function' ? giIcon('star') : ''} Provala</button>`);
    body.querySelector('#moOn').addEventListener('change', e=>{ LSS(K_MO, e.target.checked ? 'on' : 'off'); syncMo(); });
    body.querySelectorAll('[data-an]').forEach(b=> b.addEventListener('click', ()=>{
      window.rtAnim.set(b.dataset.an); haptic('tick');
      body.querySelectorAll('[data-an]').forEach(x=>{ const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      window.rtAnim.demo(body.querySelector('#anDemo'));
    }));
    body.querySelector('#moHap').addEventListener('change', e=>{ try{ localStorage.setItem(K_HP, e.target.checked ? 'on' : 'off'); }catch(err){} if(e.target.checked) haptic('success'); });
    body.querySelector('#moTry').addEventListener('click', e=>{ const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); haptic('success'); });
  }});

  // ---------------------------------------------------------------- v211: barra in basso «viva»
  // una bolla di luce scivola sotto la sezione scelta APPENA il dito tocca (prima che la pagina sia pronta): risposta immediata, niente attesa;
  // l'icona fa un piccolo salto a molla. Si muove solo con transform (fluido anche mentre il telefono disegna la pagina nuova).
  const SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  if(bar){
    const puck = document.createElement('i'); puck.className = 'vt-puck'; puck.setAttribute('aria-hidden', 'true'); bar.insertBefore(puck, bar.firstChild);
    const placeOn = (tab, instant)=>{
      if(!tab || !bar.offsetWidth) return;
      const br = bar.getBoundingClientRect(), r = tab.getBoundingClientRect();
      const x = Math.round(r.left - br.left + r.width / 2 - 28);
      if(instant) puck.style.transition = 'none';
      puck.style.transform = 'translate3d(' + x + 'px,0,0)'; puck.classList.add('on');
      if(instant){ void puck.offsetWidth; puck.style.transition = ''; }
    };
    const activeTab = ()=>{ const ab = document.getElementById('askBackdrop'); return ab && ab.classList.contains('show') ? (document.getElementById('askTab') || bar.querySelector('.view-tab.active')) : bar.querySelector('.view-tab.active'); };
    let pending = null, pendT = 0;
    bar.addEventListener('pointerdown', e=>{
      if(window.rtEdgeZone && window.rtEdgeZone(e)) return;
      const tab = e.target.closest && e.target.closest('.view-tab[data-view]'); if(!tab || !moOn()) return;
      pending = tab; clearTimeout(pendT); placeOn(tab);
      pendT = setTimeout(()=>{ if(pending){ pending = null; placeOn(activeTab()); } }, 900);     // dito trascinato via senza scegliere: la bolla torna al suo posto
    }, true);
    bar.addEventListener('pointercancel', ()=>{ pending = null; placeOn(activeTab()); });
    bar.addEventListener('click', e=>{
      const tab = e.target.closest && e.target.closest('.view-tab'); if(!tab) return;
      pending = null; clearTimeout(pendT);
      if(tab.dataset.view) placeOn(tab);
      if(!moOn()) return;
      const ic = tab.querySelector('.vt-ic svg') || tab.querySelector('svg');
      try{ ic && ic.animate([{transform: 'scale(.78)'}, {transform: 'scale(1.18)', offset: .45}, {transform: 'scale(.96)', offset: .75}, {transform: 'scale(1)'}], {duration: 460, easing: 'ease-out'}); }catch(err){}
    }, true);
    // la sezione può cambiare anche da altri comandi (indietro, ‹ Classifica, link interni): la bolla la segue
    new MutationObserver(()=> requestAnimationFrame(()=>{ if(!pending) placeOn(activeTab()); })).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
    { const ab = document.getElementById('askBackdrop'); if(ab) new MutationObserver(()=>{ if(!pending) placeOn(activeTab()); }).observe(ab, {attributes: true, attributeFilter: ['class']}); }
    addEventListener('resize', ()=> placeOn(activeTab(), true), {passive: true});
    requestAnimationFrame(()=> placeOn(activeTab(), true));
  }

  // ---------------------------------------------------------------- v211: «Per te / Il gioco / Altro»: i riquadri nuovi emergono morbidi
  document.addEventListener('click', e=>{
    const tb = e.target.closest && e.target.closest('.cd-tabs [data-ctab]'); if(!tb || !moOn()) return;
    requestAnimationFrame(()=>{
      const card = document.getElementById('modalCard'), t = card && card.querySelector('.cd-tabs'); if(!t) return;
      const H = innerHeight; let n = 0;
      for(let el = t.nextElementSibling; el && n < 8; el = el.nextElementSibling){
        if(el.offsetParent === null) continue;
        const r = el.getBoundingClientRect(); if(r.bottom < 0) continue; if(r.top > H) break;
        try{ el.animate([{opacity: 0, transform: 'translateY(10px) scale(.985)'}, {opacity: 1, transform: 'none'}], {duration: 300, delay: n * 22, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'backwards'}); }catch(err){}
        n++;
      }
    });
  });
  window.rtSpring = SPRING;

  // all'avvio la classifica è già disegnata: la prima volta entra a cascata
  setTimeout(()=>{ try{ cascade(); }catch(e){} }, 0);
  window.__rtReady = true; try{ if(window.__rtQ) window.__rtQ(); }catch(e){}      // v206: rifaccio il tocco fatto mentre il programma si caricava
})();
