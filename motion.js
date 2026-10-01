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
    if(!moOn()) return;
    const tb = document.getElementById('tbody'); if(!tb || !tb.children.length) return;
    const k = typeof lastViewKey !== 'undefined' ? lastViewKey : String(tb.children.length);
    if(k === lastKey) return; lastKey = k;
    const a = document.activeElement; if(a && a.id === 'search') return;      // mentre scrivi nella ricerca le righe cambiano di colpo, senza effetti
    const vh = innerHeight; let i = 0;
    for(const tr of tb.children){
      if(i > 13) break; if(tr.classList.contains('sk')) continue;
      const r = tr.getBoundingClientRect(); if(r.bottom < 0) continue; if(r.top > vh) break;
      try{ tr.animate([{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'none'}], {duration: 420, delay: i * 26, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'}); }catch(e){}
      i++;
    }
  }
  if(typeof window.render === 'function'){
    const orig = window.render;
    window.render = function(){ const r = orig.apply(this, arguments); try{ cascade(); }catch(e){} return r; };
    try{ render = window.render; }catch(e){}
  }

  // ---------------------------------------------------------------- la scheda si apre dalla riga toccata
  let tap = null;
  document.addEventListener('pointerdown', e=>{
    const el = e.target.closest && e.target.closest('tr[data-gid], [data-gid]');
    tap = {x: e.clientX, y: e.clientY, t: performance.now(), r: el ? el.getBoundingClientRect() : null, el};
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
  function ghostOpen(R){
    const W = VW, H = VH, r = R.r;
    const gh = document.createElement('div'); gh.className = 'rt-ghost';
    const panel = document.createElement('div'); panel.className = 'rt-ghost-p'; gh.appendChild(panel);
    let im = null;
    try{ const src = R.el && [...R.el.querySelectorAll('img')].find(x=>{ const b = x.getBoundingClientRect(); return b.width >= 40 && b.height >= b.width * 1.15; }); if(src && src.currentSrc){ /* solo una vera locandina (verticale), non le iconcine */ im = document.createElement('img'); im.className = 'rt-ghost-i'; im.src = src.currentSrc; im.decoding = 'sync'; gh.appendChild(im); im._r = src.getBoundingClientRect(); } }catch(e){}
    document.body.appendChild(gh);
    const sx = Math.max(.05, r.width / W), sy = Math.max(.02, r.height / H);
    const anims = [panel.animate([{transform: `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`, opacity: .5}, {opacity: 1, offset: .35}, {transform: 'none', opacity: 1}], {duration: 380, easing: EASE, fill: 'both'})];
    if(im && im._r && im._r.width > 4){
      const fw = Math.min(W * .74, 340), fh = fw * 1.33, fx = (W - fw) / 2, fy = 120;       // dove starà più o meno la locandina
      im.style.cssText = `left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px`;
      const k = im._r.width / fw;
      anims.push(im.animate([{transform: `translate(${im._r.left - fx}px, ${im._r.top - fy}px) scale(${k}, ${im._r.height / fh})`}, {transform: 'none'}], {duration: 380, easing: EASE, fill: 'both'}));
    }
    return {gh, done: Promise.all(anims.map(a=> a.finished.catch(()=>{})))};
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
      if(!was && R && moOn() && VW <= 760 && document.body.animate){
        tap = null; haptic('soft');
        const self = this, G = ghostOpen(R); let args = arguments;
        setTimeout(()=>{ try{ if(G.gh.isConnected) G.gh.remove(); const c = document.getElementById('modalCard'); if(c && c.style.opacity === '0') c.style.opacity = ''; }catch(x){} }, 2500);   // rete di sicurezza: il cartoncino non resta MAI sopra l'app
        // lascio partire il cartoncino (un fotogramma), poi costruisco la scheda vera sotto di lui
        // v210: se i testi lunghi del gioco non sono ancora arrivati, li aspetto (al massimo 450 ms) MENTRE il cartoncino si allarga:
        // così la scheda si costruisce una volta sola, già completa (prima si disegnava vuota e poi di nuovo, con un salto)
        const g0 = args[0], needTx = !!(g0 && window.rtTexts && !rtTexts.has(g0));
        const wait = needTx ? Promise.race([rtTexts.ensure(g0).catch(()=>{}), new Promise(r=> setTimeout(r, 450))]) : Promise.resolve();
        requestAnimationFrame(()=> wait.then(()=> setTimeout(()=>{
          if(needTx && rtTexts.has(g0) && typeof GAMES !== 'undefined'){ const fresh = GAMES.find(x=> x.id === g0.id); if(fresh) args = [fresh].concat([].slice.call(args, 1)); }
          let card = null;
          try{ origOpen.apply(self, args); card = document.getElementById('modalCard'); if(card) card.style.opacity = '0'; }catch(e){ G.gh.remove(); throw e; }
          requestAnimationFrame(()=> requestAnimationFrame(async ()=>{
            await Promise.race([G.done, new Promise(r=> setTimeout(r, 700))]);      // v208: mai aspettare all'infinito (animazioni sospese, schermo intero…)
            if(card){ card.style.opacity = ''; try{ card.animate([{opacity: 0}, {opacity: 1}], {duration: 160, easing: 'ease-out'}); }catch(e){} countUp(card); }
            try{ G.gh.animate([{opacity: 1}, {opacity: 0}], {duration: 200, easing: 'ease-out', fill: 'forwards'}).finished.then(()=> G.gh.remove(), ()=> G.gh.remove()); }catch(e){ G.gh.remove(); }
          }));
        }, 0)));
        return;
      }
      const r = origOpen.apply(this, arguments);
      try{ if(!was) reveal(); }catch(e){}
      return r;
    };
    try{ openModal = window.openModal; }catch(e){}
  }

  // ---------------------------------------------------------------- la pagina scivola tra le sezioni
  const bar = document.getElementById('viewTabs');
  if(bar && document.startViewTransition){
    bar.addEventListener('click', e=>{
      const tab = e.target.closest && e.target.closest('.view-tab[data-view]'); if(!tab || !moOn()) return;
      if(typeof state === 'undefined' || typeof setView !== 'function') return;
      const v = tab.dataset.view; if(v === state.view) return;
      const order = [...bar.querySelectorAll('.view-tab[data-view]')].map(t=> t.dataset.view);
      const dir = order.indexOf(v) > order.indexOf(state.view) ? 'f' : 'b';
      e.stopImmediatePropagation(); e.preventDefault();
      html.setAttribute('data-vt', dir);
      let t; try{ t = document.startViewTransition(()=>{ setView(v); }); }catch(err){ html.removeAttribute('data-vt'); setView(v); return; }
      const done = ()=> html.removeAttribute('data-vt');
      if(t && t.finished) t.finished.then(done, done); else setTimeout(done, 600);
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
      <label class="ask-toggle"><input type="checkbox" id="moHap" ${hapOn() ? 'checked' : ''}> Vibrazione brevissima al tocco <small>(Android e iPhone da iOS 17.4; l'iPad non ha il motorino della vibrazione, quindi lì non si sente)</small></label>
      <button type="button" class="btn" id="moTry" style="margin-top:8px">${typeof giIcon === 'function' ? giIcon('star') : ''} Provala</button>`);
    body.querySelector('#moOn').addEventListener('change', e=>{ LSS(K_MO, e.target.checked ? 'on' : 'off'); syncMo(); });
    body.querySelector('#moHap').addEventListener('change', e=>{ try{ localStorage.setItem(K_HP, e.target.checked ? 'on' : 'off'); }catch(err){} if(e.target.checked) haptic('success'); });
    body.querySelector('#moTry').addEventListener('click', e=>{ const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); haptic('success'); });
  }});

  // all'avvio la classifica è già disegnata: la prima volta entra a cascata
  setTimeout(()=>{ try{ cascade(); }catch(e){} }, 0);
  window.__rtReady = true; try{ if(window.__rtQ) window.__rtQ(); }catch(e){}      // v206: rifaccio il tocco fatto mentre il programma si caricava
})();
