// ---- Ordine (v185): scheda a strati con la «pulce» 📌 e menu ✨ in stanze con ricerca ----
// Non toglie nessuna informazione: riordina soltanto, in ordine di importanza, e ti lascia fissare in alto quello che ti interessa di più.
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {toast, esc, LS} = U;
  const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const menu = (html, run)=> (window.XMENU = window.XMENU || []).push({html, run});

  // =====================================================================
  // R1) SCHEDA A STRATI CON LA PULCE
  // =====================================================================
  const PINS = 'jrpg_card_pins', ON = 'jrpg_card_order';
  const cardOrderOn = ()=> LS.get(ON, 'on') !== 'off';
  // v204: la scheda è divisa in 3 parti (linguette in alto): «Per te», «Il gioco», «Altro». Le parti nascoste non si disegnano: apertura più leggera.
  const LAYERS = [
    {id: 'perme', tab: 'perme', n: '💜 Per te', keys: ['verdetto', 'valuta', 'radar', 'dna', 'recensione', 'nota', 'stato']},
    {id: 'comprare', tab: 'perme', n: '🛒 Comprare', keys: ['comprare', 'versioni']},
    {id: 'simili', tab: 'perme', n: '🔁 Altri giochi', keys: ['simili']},
    {id: 'scheda', tab: 'gioco', n: '⭐ Voti e musica', keys: ['punteggi', 'musica']},
    {id: 'capire', tab: 'gioco', n: '🔎 Capire il gioco', keys: ['storia', 'etichetta', 'piace', 'gameplay', 'proscons', 'generi', 'longevita', 'tempo', 'colonna', 'cast', 'approfondimento', 'dettagli', 'simboli']},
    {id: 'giocare', tab: 'gioco', n: '🎮 Giocarlo bene', keys: ['guida', 'compagno', 'saga']},
    {id: 'altro', tab: 'altro', n: '📚 Per approfondire', keys: ['affidabilita', 'eredi', 'quinte', 'uscita', 'album', 'cronologia']}
  ];
  const TABS = [['perme', '💜 Per te'], ['gioco', '🎮 Il gioco'], ['altro', '📚 Altro']];
  const tabNow = ()=>{ const t = LS.get('jrpg_card_tab', 'perme'); return TABS.some(x=> x[0] === t) ? t : 'perme'; };
  const KEY_NAMES = {valuta: 'Le tue valutazioni', punteggi: 'Voti e piattaforme', musica: 'Colonna sonora (lettore)', verdetto: 'Verdetto d\'acquisto', radar: 'Sintonia con i tuoi gusti', dna: 'Cosa ti ha preso (DNA)', generi: 'Generi', simboli: 'Simboli', storia: 'La storia', etichetta: 'A colpo d\'occhio', affidabilita: 'Affidabilità dei dati', gameplay: 'Gameplay', piace: 'Perché potrebbe piacerti', proscons: 'Pro e contro', tempo: 'Voto nel tempo', longevita: 'Longevità', colonna: 'Colonna sonora', cast: 'Cast', approfondimento: 'Approfondimento', dettagli: 'Dettagli', guida: 'Come iniziare al meglio', compagno: 'Compagno di gioco', saga: 'Saga', stato: 'Il tuo stato', recensione: 'La tua recensione', nota: 'Nota', comprare: 'Prima di comprarlo', versioni: 'Quale versione conviene?', simili: 'Se ti è piaciuto…', eredi: 'Eredi spirituali', quinte: 'Dietro le quinte', uscita: 'Punto d\'uscita', album: 'Il mio album', cronologia: 'Cronologia delle modifiche'};
  const titleKey = t=>{
    t = norm(t);
    if(/etichetta|colpo d.?occhio/.test(t)) return 'etichetta'; if(/prima di comprarlo/.test(t)) return 'comprare'; if(/quale versione/.test(t)) return 'versioni'; if(/il tuo stato/.test(t)) return 'stato';
    if(/recensione/.test(t)) return 'recensione'; if(/voto nel tempo/.test(t)) return 'tempo'; if(/storia/.test(t)) return 'storia'; if(/gameplay/.test(t)) return 'gameplay'; if(/perche potrebbe/.test(t)) return 'piace';
    if(/pro contro|pro e contro/.test(t)) return 'proscons'; if(/longevit/.test(t)) return 'longevita'; if(/dettagli/.test(t)) return 'dettagli'; if(/se ti e piaciuto/.test(t)) return 'simili';
    if(/colonna sonora/.test(t)) return 'colonna'; if(/cast/.test(t)) return 'cast'; if(/approfondimento/.test(t)) return 'approfondimento'; if(/eredi/.test(t)) return 'eredi'; if(/dietro le quinte/.test(t)) return 'quinte';
    if(/punto d uscita/.test(t)) return 'uscita'; if(/il mio album/.test(t)) return 'album'; if(/^nota/.test(t)) return 'nota';
    return 'x-' + t.slice(0, 24);
  };
  function startKey(el){
    if(el.classList.contains('cd-layer')) return null;
    if(el.classList.contains('modal-section-title')) return titleKey(el.textContent);
    if(el.classList.contains('sim-lazy')) return 'simili'; if(el.id === 'rtRate') return 'valuta'; if(el.id === 'mzBar') return null;      /* v214: il lettore musicale sta sempre in alto, visibile in tutte e tre le parti */ if(el.classList.contains('modal-plat') || el.classList.contains('modal-badges')) return 'punteggi'; if(el.id === 'voteSrc') return 'affidabilita'; if(el.id === 'vdCard') return 'verdetto'; if(el.id === 'gsCard') return 'radar'; if(el.id === 'dnaWhy') return 'dna'; if(el.id === 'gdCard') return 'guida'; if(el.id === 'cpCard') return 'compagno';
    if(el.classList.contains('modal-tags')) return 'generi'; if(el.classList.contains('enrich-highlights')) return 'simboli'; if(el.classList.contains('ds-chip')) return 'affidabilita';
    if(el.classList.contains('saga-note')) return 'saga'; if(el.matches('details.hist')) return 'cronologia';
    return null;
  }
  // v205: il tuo ordine dei blocchi, per ogni parte (sostituisce il vecchio «fissa in alto»): jrpg_card_order2 = {perme: [chiavi…], gioco: […], altro: […]}
  const OK2 = 'jrpg_card_order2';
  const customOrder = ()=>{ const o = LS.get(OK2, {}) || {}; return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; };
  const pins = ()=> (LS.get(PINS, []) || []).filter(k=> typeof k === 'string');
  (function migratePins(){        // chi aveva fissato dei blocchi li ritrova in cima alla loro parte
    try{ const p = pins(); if(!p.length || Object.keys(customOrder()).length) return;
      const co = {}; p.forEach(k=>{ const l = LAYERS.find(x=> x.keys.includes(k)); if(l){ (co[l.tab] = co[l.tab] || []).push(k); } });
      if(Object.keys(co).length) LS.set(OK2, co); LS.set(PINS, []); }catch(e){}
  })();
  let arranging = false, obs = null, tm = 0;
  function arrange(){
    const card = document.getElementById('modalCard'); if(!card || !card.children.length) return;
    if(!cardOrderOn()){ card.querySelectorAll('.cd-layer, .cd-pin, .cd-tabs').forEach(n=> n.remove()); delete card.dataset.ctab; card.querySelectorAll('[data-tab]').forEach(n=> n.removeAttribute('data-tab')); return; }
    const g = (typeof currentModalGame !== 'undefined') ? currentModalGame : null;
    const kids = Array.from(card.children).filter(el=> !el.classList.contains('cd-layer') && !el.classList.contains('cd-tabs') && !el.classList.contains('cd-mvrow'));
    const top = [], bottom = [], blocks = new Map();
    let cur = null, inBottom = false;
    kids.forEach(el=>{
      if(inBottom || el.classList.contains('modal-links') || (el.classList.contains('modal-actions') && cur !== null)){ inBottom = true; bottom.push(el); return; }
      if(el.id === 'mzBar'){ top.push(el); return; }                  // v214: il lettore musicale sta sempre in alto, sopra le linguette
      const k = startKey(el);
      if(k){ cur = k; if(!blocks.has(k)) blocks.set(k, []); blocks.get(k).push(el); }
      else if(cur) blocks.get(cur).push(el);
      else top.push(el);
    });
    // ordine: in alto identità e verdetto; poi quello che hai fissato; poi gli strati (la sintonia con i tuoi gusti sta dopo storia e colpo d'occhio)
    const st = g && typeof STATUSES !== 'undefined' ? STATUSES[g.id] : '';
    let layers = LAYERS.slice();
    if(st === 'playing'){ const a = layers.find(l=> l.id === 'giocare'); layers = [a].concat(layers.filter(l=> l !== a)); }
    const used = new Set(), out = top.slice();
    // le etichette già presenti si riusano (altrimenti a ogni ridisegno se ne accumulavano di vecchie in cima alla scheda)
    const prevL = {}; card.querySelectorAll(':scope > .cd-layer').forEach(n=>{ if(prevL[n.dataset.l]) n.remove(); else prevL[n.dataset.l] = n; });
    const label = (id, text)=>{ let d = prevL[id]; if(!d){ d = document.createElement('div'); d.className = 'cd-layer'; d.dataset.l = id; } d.textContent = text; return d; };
    const known = new Set(LAYERS.flatMap(l=> l.keys));
    // v213: riga sottile con ▲▼ sopra i riquadri senza titolo (quelli col titolo hanno le frecce nel titolo)
    const prevMv = {}; card.querySelectorAll(':scope > .cd-mvrow').forEach(n=>{ if(prevMv[n.dataset.k]) n.remove(); else prevMv[n.dataset.k] = n; });
    const usedMv = new Set(), mvEls = {};
    const pushBlock = (k, tid)=>{
      const els = blocks.get(k) || [], el0 = els[0];
      if(el0 && !(el0.classList && el0.classList.contains('modal-section-title'))){
        let r = prevMv[k]; if(!r){ r = document.createElement('div'); r.className = 'cd-mvrow'; r.dataset.k = k; r.innerHTML = '<small></small><span class="cd-mv"><button type="button" data-cmv="up" aria-label="Sposta più su">▲</button><button type="button" data-cmv="down" aria-label="Sposta più giù">▼</button></span>'; }
        r.firstChild.textContent = KEY_NAMES[k] || ''; r.dataset.tab = tid; usedMv.add(k); mvEls[k] = r; out.push(r);
      }
      els.forEach(el=>{ el.dataset.tab = tid; out.push(el); });
    };
    // tutto ciò che sta sopra le linguette (identità, locandina, la tua barra) si vede sempre
    out.forEach(el=> el.removeAttribute && el.removeAttribute('data-tab'));
    let bar = card.querySelector(':scope > .cd-tabs');
    if(!bar){ bar = document.createElement('div'); bar.className = 'cd-tabs'; bar.setAttribute('role', 'tablist'); bar.innerHTML = '<span class="cd-ind" aria-hidden="true"></span>' + TABS.map(([id, n])=> `<button type="button" role="tab" data-ctab="${id}">${n}</button>`).join('') + '<button type="button" class="cd-reorder" data-creorder title="Riordina la scheda come vuoi" aria-label="Riordina la scheda">↕️</button>'; }
    out.push(bar);
    // 1) quali blocchi ci sono in ogni parte (nell'ordine di base); 2) il TUO ordine, se l'hai scelto
    const byTab = {perme: [], gioco: [], altro: []};
    layers.forEach(l=>{
      const ks = l.keys.filter(k=> blocks.has(k) && !used.has(k));
      if(l.id === 'altro') blocks.forEach((v, k)=>{ if(!known.has(k) && !used.has(k) && !ks.includes(k)) ks.push(k); });         // blocchi nuovi/sconosciuti: in «Altro»
      ks.forEach(k=>{ byTab[l.tab].push({k, l}); used.add(k); });
    });
    const co = customOrder(), firstOfTab = {}, ordered = {};
    TABS.forEach(([tid])=>{
      let items = byTab[tid]; if(!items.length) return; firstOfTab[tid] = true;
      const mine = co[tid];
      if(mine && mine.length){
        items = items.map((x, i)=> [x, mine.indexOf(x.k) >= 0 ? mine.indexOf(x.k) : 1000 + i]).sort((a, b)=> a[1] - b[1]).map(x=> x[0]);       // il tuo ordine (i blocchi nuovi in fondo)
        ordered[tid] = items.map(x=> x.k);
        items.forEach(({k})=> pushBlock(k, tid));
      } else {
        ordered[tid] = items.map(x=> x.k);
        let lastL = null;
        items.forEach(({k, l})=>{ if(lastL && lastL !== l.id){ const lb = label(l.id, l.n); lb.dataset.tab = tid; out.push(lb); } lastL = l.id; pushBlock(k, tid); });
      }
    });
    window.__rtTabKeys = Object.fromEntries(TABS.map(([tid])=> [tid, (byTab[tid] || []).map(x=> x.k)]));
    Object.keys(prevMv).forEach(k=>{ if(!usedMv.has(k)){ if(obs) obs.disconnect(); arranging = true; prevMv[k].remove(); arranging = false; } });
    window.__rtTabOrder = ordered;
    // v213: su ogni riquadro (accanto al titolo) le frecce ▲▼ per spostarlo più su o più giù, senza aprire «↕️ Riordina»
    try{
      Object.keys(ordered).forEach(tid=>{
        const ks = ordered[tid];
        ks.forEach((k, i)=>{
          const el0 = (blocks.get(k) || [])[0]; if(!el0 || !el0.classList) return;
          let m = el0.classList.contains('modal-section-title') ? el0.querySelector(':scope > .cd-mv') : (mvEls[k] ? mvEls[k].querySelector('.cd-mv') : null);
          if(!m && !el0.classList.contains('modal-section-title')) return;
          if(!m){ m = document.createElement('span'); m.className = 'cd-mv'; m.innerHTML = '<button type="button" data-cmv="up" aria-label="Sposta più su">▲</button><button type="button" data-cmv="down" aria-label="Sposta più giù">▼</button>'; el0.appendChild(m); }
          m.dataset.k = k; m.dataset.t = tid;
          m.children[0].disabled = i === 0; m.children[1].disabled = i === ks.length - 1;
        });
      });
    }catch(e){}
    bottom.forEach(el=> el.removeAttribute('data-tab'));
    out.push(...bottom);
    const t = tabNow(); if(card.dataset.ctab !== t) card.dataset.ctab = t; bar.style.setProperty('--i', TABS.findIndex(x=> x[0] === t));
    bar.querySelectorAll('[data-ctab]').forEach(b=>{ const on = b.dataset.ctab === t, n = firstOfTab[b.dataset.ctab]; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.hidden = !n; });
    card.querySelectorAll('.cd-pin').forEach(n=> n.remove()); card.querySelectorAll('.cd-has-pin').forEach(n=> n.classList.remove('cd-has-pin'));
    // tolgo le etichette che non servono più
    Object.keys(prevL).forEach(k=>{ if(!out.includes(prevL[k])){ if(obs) obs.disconnect(); arranging = true; prevL[k].remove(); arranging = false; } });
    // se l'ordine è già quello giusto non tocco nulla (evita giri a vuoto)
    const now = Array.from(card.children);
    if(now.length === out.length && now.every((e, i)=> e === out[i])){ watch(); return; }
    if(obs) obs.disconnect();
    arranging = true;
    // spostando i blocchi il browser potrebbe far saltare la pagina: rimetto lo scorrimento dov'era.
    // v213: la posizione la so già (evento scroll) — leggerla qui costringeva il telefono a impaginare la scheda intera a metà apertura (~40 ms)
    if(!card._syW){ card._syW = 1; card._sy = 0; card.addEventListener('scroll', ()=>{ card._sy = card.scrollTop; }, {passive: true}); }
    const sy = card.closest('.show') ? card._sy || 0 : 0;
    out.forEach(el=> card.appendChild(el));
    if(sy > 0) card.scrollTop = sy;
    arranging = false;
    watch();
  }
  function watch(){ const card = document.getElementById('modalCard'); if(!card) return; if(!obs) obs = new MutationObserver(()=>{ if(arranging) return; clearTimeout(tm); tm = setTimeout(arrange, 90); }); obs.observe(card, {childList: true}); }
  document.addEventListener('click', e=>{
    const ch = e.target.closest && e.target.closest('#modalCard .vd-chiprow'); if(!ch) return;
    const card = document.getElementById('modalCard'), b = card && card.querySelector('.cd-tabs [data-ctab="perme"]'); if(b) b.click();
    setTimeout(()=>{ const v = card && card.querySelector('#vdCard'); if(v){ try{ v.scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(x){} } }, 60);
  });
  document.addEventListener('click', e=>{
    const tb = e.target.closest && e.target.closest('.cd-tabs [data-ctab]'); if(!tb) return;
    e.preventDefault(); const card = document.getElementById('modalCard'); if(!card) return;
    LS.set('jrpg_card_tab', tb.dataset.ctab); card.dataset.ctab = tb.dataset.ctab; const br = tb.closest('.cd-tabs'); if(br) br.style.setProperty('--i', TABS.findIndex(x=> x[0] === tb.dataset.ctab));
    card.querySelectorAll('.cd-tabs [data-ctab]').forEach(b=>{ const on = b === tb; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    try{ window.rtHaptic && rtHaptic('tick'); }catch(x){}
    const bar = card.querySelector('.cd-tabs'); if(bar && bar.getBoundingClientRect().top < 0){ try{ card.scrollTo({top: bar.offsetTop - 6, behavior: 'smooth'}); }catch(x){} }
  });
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('[data-cmv]'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const m = b.parentNode, k = m.dataset.k, tid = m.dataset.t, list = ((window.__rtTabOrder || {})[tid] || []).slice(), i = list.indexOf(k);
    const to = b.dataset.cmv === 'up' ? i - 1 : i + 1; if(i < 0 || to < 0 || to >= list.length) return;
    list.splice(i, 1); list.splice(to, 0, k);
    const c = customOrder(); c[tid] = list; LS.set(OK2, c);
    const card = document.getElementById('modalCard'), title = m.parentNode, before = title.getBoundingClientRect().top;
    arrange();
    try{ const after = title.getBoundingClientRect().top; card.scrollTop += after - before; }catch(x){}     // il riquadro resta sotto il dito: si sposta la scheda, non lui
    try{ title.animate([{background: 'rgba(124,92,255,.28)'}, {background: 'transparent'}], {duration: 700, easing: 'ease-out'}); }catch(x){}
    try{ window.rtHaptic && rtHaptic('tick'); }catch(x){}
  }, true);
  // ---------- «↕️ Riordina la scheda»: scegli tu cosa va al 1°, 2°, 3° posto… e cosa in fondo (vale per tutti i giochi) ----------
  document.addEventListener('click', e=>{
    const rb = e.target.closest && e.target.closest('[data-creorder]'); if(!rb) return;
    e.preventDefault(); openReorder();
  });
  function openReorder(tabId){
    if(!U.sheet) return;
    const card = document.getElementById('modalCard'); if(!card) return;
    const tid = tabId || tabNow(), keys = (window.__rtTabKeys || {})[tid] || [], co = customOrder();
    let list = (co[tid] && co[tid].length) ? keys.slice().sort((a, b)=>{ const ia = co[tid].indexOf(a), ib = co[tid].indexOf(b); return (ia < 0 ? 1000 : ia) - (ib < 0 ? 1000 : ib); }) : keys.slice();
    const name = k=> KEY_NAMES[k] || k;
    const body = U.sheet('xReorder', '↕️ Riordina la scheda', `<div class="lp-sub">Scegli la parte, poi sposta i riquadri: il <b>primo in lista</b> compare per primo. Vale per <b>tutti</b> i giochi.</div>
      <div class="ro-tabs">${TABS.map(([id, n])=> `<button type="button" class="${id === tid ? 'on' : ''}" data-rot="${id}">${n}</button>`).join('')}</div>
      <div id="roList" class="ro-list"></div>
      <div class="lp-tools"><button class="btn" id="roReset" type="button">↩️ Ordine originale di questa parte</button></div>`);
    const L = body.querySelector('#roList');
    const save = ()=>{ const c = customOrder(); c[tid] = list.slice(); LS.set(OK2, c); arrange(); };
    const draw = ()=>{
      L.innerHTML = list.length ? list.map((k, i)=> `<div class="ro-row"><b>${i + 1}</b><span>${esc(name(k))}</span>
        <button type="button" data-mv="${i}:top" ${i ? '' : 'disabled'} title="In cima">⤒</button><button type="button" data-mv="${i}:up" ${i ? '' : 'disabled'} title="Su">▲</button><button type="button" data-mv="${i}:down" ${i < list.length - 1 ? '' : 'disabled'} title="Giù">▼</button><button type="button" data-mv="${i}:end" ${i < list.length - 1 ? '' : 'disabled'} title="In fondo">⤓</button></div>`).join('') : '<div class="lp-sub">Questa parte è vuota per questo gioco.</div>';
    };
    body.addEventListener('click', ev=>{
      const t = ev.target.closest('[data-rot]'); if(t){ openReorder(t.dataset.rot); return; }
      if(ev.target.closest('#roReset')){ const c = customOrder(); delete c[tid]; LS.set(OK2, c); arrange(); toast('Ordine originale ripristinato', 1600); openReorder(tid); return; }
      const b = ev.target.closest('[data-mv]'); if(!b || b.disabled) return;
      const [i, a] = b.dataset.mv.split(':'), n = +i, it = list.splice(n, 1)[0];
      const to = a === 'top' ? 0 : a === 'end' ? list.length : a === 'up' ? n - 1 : n + 1;
      list.splice(to, 0, it); save(); draw();
      try{ window.rtHaptic && rtHaptic('tick'); }catch(x){}
      const row = L.children[to]; if(row){ row.classList.add('moved'); try{ row.scrollIntoView({block: 'nearest'}); }catch(x){} }
    });
    draw();
  }
  window.rtOpenReorder = openReorder;
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){
      try{ const c = document.getElementById('modalCard'), bd = document.getElementById('modalBackdrop'); const same = c && bd && bd.classList.contains('show') && typeof currentModalGame !== 'undefined' && currentModalGame && g && currentModalGame.id === g.id; if(c && !same) c._sy = 0; }catch(e){}
      if(obs) obs.disconnect();
      const r = prev.apply(this, arguments);
      // v213: riordino UNA volta, quando tutta la catena di apertura ha finito (barra icone, valutazioni, DNA… si aggiungono dopo di me):
      // prima riordinavo subito e poi di nuovo 90 ms dopo, e la scheda appena aperta «saltava»
      const run = ()=>{ try{ clearTimeout(tm); if(obs) obs.disconnect(); arrange(); watch(); }catch(e){ try{ console.error(e); }catch(x){} } };
      try{ queueMicrotask(run); }catch(e){ Promise.resolve().then(run); }
      return r;
    };
    try{ openModal = window.openModal; }catch(e){}
  }
  window.rtCardOrder = {arrange, pins, resetPins: ()=> { LS.set(PINS, []); LS.set(OK2, {}); arrange(); }, openReorder: ()=> openReorder(), on: cardOrderOn, setOn: v=> { LS.set(ON, v ? 'on' : 'off'); arrange(); }, KEY_NAMES};

  // =====================================================================
  // R2) MENU ✨ IN STANZE, con ricerca, preferite (pulce) e usate di recente
  // =====================================================================
  const ROOMS = [
    {id: 'scopri', n: '🔍 Scopri', rx: /Radar|Wishlist|Scansiona|Oracolo|Scala d.ingresso|Uscite nel calendario|Raccoon Triad|Oggi/i},
    {id: 'gusto', n: '🧬 Il tuo gusto', rx: /gusti|Livello|cronologia|Traguardi|preferiti/i},
    {id: 'aspetto', n: '🎨 Aspetto e comportamento', rx: /Palette|Temi grafici|Set di icone|Movimento|Suoni|Anteprima cinematografica|Vetro sfocato|Colori della scheda|Tema dalla copertina|Gesti|Impostazioni|Moduli|Ordine della scheda/i},
    {id: 'condividi', n: '📤 Condividi e mostra', rx: /Condividi|carta profilo|Tier list animata|QR|vetrina|Screenshot nell/i},
    {id: 'dati', n: '🗂️ Dati e manutenzione', rx: /Controllo dati|Completa le schede|Copertin|Backup|Rapporto qualit|Versione di sicurezza|offline/i}
  ];
  const MP = 'jrpg_menu_pins', MR = 'jrpg_menu_recent', MO = 'jrpg_menu_rooms', MON = 'jrpg_menu_rooms_on';
  const roomsOn = ()=> LS.get(MON, 'on') !== 'off';
  const labelOf = el=> String(el.textContent || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  function roomify(root){
    const menuEl = root.querySelector('.x-menu'); if(!menuEl || menuEl.dataset.rooms) return;
    if(!roomsOn()) return;
    menuEl.dataset.rooms = '1';
    const items = Array.from(menuEl.children);
    const pinned = LS.get(MP, []) || [], recent = LS.get(MR, []) || [], openMap = LS.get(MO, {}) || {};
    const info = items.map(el=>({el, label: labelOf(el), html: el.innerHTML}));
    const wrap = info.map(x=>{ const w = document.createElement('div'); w.className = 'mn-it'; w.dataset.k = x.label; const pb = document.createElement('button'); pb.type = 'button'; pb.className = 'mn-pin' + (pinned.includes(x.label) ? ' on' : ''); pb.title = 'Fissa tra le preferite'; pb.setAttribute('aria-label', 'Preferita'); pb.textContent = '📌'; x.w = w; x.pin = pb; return x; });
    const roomOf = x=> (ROOMS.find(r=> r.rx.test(x.label)) || {id: 'altro'}).id;
    const rooms = ROOMS.concat([{id: 'altro', n: '✨ Altro'}]);
    const frag = document.createDocumentFragment();
    const search = document.createElement('div'); search.className = 'mn-search'; search.innerHTML = '<input type="search" placeholder="Cerca una funzione… (es. backup, colori, radar)" autocomplete="off" enterkeyhint="search">'; frag.appendChild(search);
    const fav = document.createElement('div'); fav.className = 'mn-fav'; frag.appendChild(fav);
    const roomEls = {};
    rooms.forEach(r=>{
      const mine = wrap.filter(x=> roomOf(x) === r.id); if(!mine.length) return;
      const d = document.createElement('details'); d.className = 'mn-room'; d.dataset.r = r.id; d.open = !!openMap[r.id];
      d.innerHTML = `<summary>${esc(r.n)} <small>${mine.length}</small></summary><div class="mn-items"></div>`;
      const host = d.querySelector('.mn-items'); mine.forEach(x=>{ x.w.appendChild(x.el); x.w.appendChild(x.pin); host.appendChild(x.w); });
      d.addEventListener('toggle', ()=>{ const m = LS.get(MO, {}) || {}; m[r.id] = d.open; LS.set(MO, m); });
      roomEls[r.id] = d; frag.appendChild(d);
    });
    const empty = document.createElement('div'); empty.className = 'lp-sub mn-none'; empty.textContent = 'Nessuna funzione con questo nome.'; empty.hidden = true; frag.appendChild(empty);
    menuEl.innerHTML = ''; menuEl.appendChild(frag); menuEl.classList.add('mn-rooms');
    // scorciatoie: preferite e recenti (cliccano l'elemento vero)
    const byLabel = Object.fromEntries(wrap.map(x=> [x.label, x]));
    const shortcut = (x, tag)=>{ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn mn-sc'; b.innerHTML = x.html.replace(/<small>.*?<\/small>/g, ''); b.addEventListener('click', ()=>{ const t = x.el.matches('label') ? x.el.querySelector('input') : x.el; t && t.click(); }); return b; };
    const paintFav = ()=>{
      const p = (LS.get(MP, []) || []).map(k=> byLabel[k]).filter(Boolean), r = (LS.get(MR, []) || []).map(k=> byLabel[k]).filter(x=> x && !(LS.get(MP, []) || []).includes(x.label) && !x.el.matches('label')).slice(0, 4);
      fav.innerHTML = '';
      if(p.length){ const h = document.createElement('div'); h.className = 'mn-h'; h.textContent = '📌 Preferite'; fav.appendChild(h); const row = document.createElement('div'); row.className = 'mn-row'; p.forEach(x=> row.appendChild(shortcut(x))); fav.appendChild(row); }
      if(r.length){ const h = document.createElement('div'); h.className = 'mn-h'; h.textContent = '🕘 Usate di recente'; fav.appendChild(h); const row = document.createElement('div'); row.className = 'mn-row'; r.forEach(x=> row.appendChild(shortcut(x))); fav.appendChild(row); }
    };
    paintFav();
    wrap.forEach(x=>{
      x.pin.addEventListener('click', e=>{ e.stopPropagation(); const p = LS.get(MP, []) || [], i = p.indexOf(x.label); if(i >= 0) p.splice(i, 1); else p.push(x.label); LS.set(MP, p); x.pin.classList.toggle('on', i < 0); paintFav(); });
      x.w.addEventListener('click', e=>{ if(e.target.closest('.mn-pin')) return; if(x.el.matches('label') || x.el.querySelector('input')) return; const r = (LS.get(MR, []) || []).filter(k=> k !== x.label); r.unshift(x.label); LS.set(MR, r.slice(0, 8)); }, true);
    });
    const inp = search.querySelector('input');
    inp.addEventListener('input', ()=>{
      const q = norm(inp.value); let any = false;
      Object.values(roomEls).forEach(d=>{
        let n = 0; d.querySelectorAll('.mn-it').forEach(w=>{ const hit = !q || norm(w.textContent).includes(q); w.hidden = !hit; if(hit) n++; });
        d.hidden = !!q && !n; if(q && n){ d.open = true; any = true; }
        if(!q){ d.open = !!((LS.get(MO, {}) || {})[d.dataset.r]); }
      });
      fav.hidden = !!q; empty.hidden = !q || any;
    });
  }
  // il menu ✨ viene ridisegnato a ogni apertura: lo riordino appena compare
  (function(){
    let inner = null;
    const hook = el=>{ if(inner) return; inner = new MutationObserver(()=> roomify(el)); inner.observe(el, {childList: true, subtree: true}); roomify(el); };
    const el0 = document.getElementById('xMenu'); if(el0) hook(el0);
    new MutationObserver(()=>{ const el = document.getElementById('xMenu'); if(el && !inner) hook(el); }).observe(document.body, {childList: true});
  })();

  // =====================================================================
  // R3) MODULI: accendi e spegni le funzioni (le spente non partono al prossimo avvio)
  // =====================================================================
  const OFFK = 'jrpg_mod_off';
  const offMap = ()=> LS.get(OFFK, {}) || {};
  const MODS = [
    {id: 'music', n: '🎵 Musica e suoni', d: 'Colonne sonore, player e suoni dei pulsanti'},
    {id: 'cinema', n: '🎬 Anteprima cinematografica', d: 'Copertina e poi schermate di gioco in cima alla scheda'},
    {id: 'guida', n: '🚀 Guida e Compagno di gioco', d: '«Come iniziare al meglio» e l\'aiuto senza spoiler'},
    {id: 'gusto', n: '🕸️ Radar di gusto', d: 'La ragnatela dei tuoi gusti nella scheda'},
    {id: 'idee', n: '🧬 Blocchi extra della scheda', d: 'Eredi spirituali, dietro le quinte, punto d\'uscita, album'},
    {id: 'pet', n: '🦝 Frugu, il procione da compagnia', d: 'La mascotte con minigiochi e negozio'},
    {id: 'motion', n: '🎛️ Animazioni e vibrazione', d: 'Righe a cascata, scintille, tic al tocco'}
  ];
  const SOFT = [
    {k: 'calm', n: '🧘 Modalità calma (tutto a mano)', d: 'Niente lavori automatici da internet: Update+ all\'avvio, controllo con Gemini, copertine e foto cercate da sole. Per un gioco premi tu ⚡ Update+ nella scheda: scarica tutto (voto, info, copertina, foto). Il backup resta acceso.', get: ()=> !!(window.rtCalm && rtCalm()), set: v=>{ try{ localStorage.setItem('rt_calm', v ? 'on' : 'off'); }catch(e){} }},
    {k: 'cardorder', n: '📑 Scheda in 3 parti', d: 'Divide la scheda in Per te / Il gioco / Altro (con ↕️ scegli tu l\'ordine dei riquadri)', get: ()=> cardOrderOn(), set: v=> window.rtCardOrder.setOn(v)},
    {k: 'menurooms', n: '🗂️ Menu ✨ in stanze', d: 'Raggruppa le voci per argomento, con ricerca', get: ()=> roomsOn(), set: v=> window.rtMenuRooms.setOn(v)},
    {k: 'oggi', n: '🌅 Riquadro «Oggi» e avviso unico', d: 'Un solo avviso all\'avvio e il riquadro con le novità', get: ()=> todayOn(), set: v=>{ LS.set(TON, v ? 'on' : 'off'); renderToday(); }}
  ];
  function openModules(){
    const body = U.sheet('xModules', '🧩 Moduli', '');
    const draw = ()=>{
      const off = offMap();
      body.innerHTML = `<div class="lp-sub">Accendi solo ciò che usi. Le funzioni spente non partono al prossimo avvio (l'app si carica prima e consuma meno). Non cancello nulla: i tuoi dati restano.</div>
        <h4>Funzioni</h4>${MODS.map(m=> `<label class="ask-toggle md-row"><input type="checkbox" data-m="${m.id}" ${off[m.id] ? '' : 'checked'}> <span><b>${m.n}</b><small>${esc(m.d)}</small></span></label>`).join('')}
        <div class="lp-tools"><button type="button" class="btn primary" id="mdReload" hidden>🔄 Riavvia ora per applicare</button></div>
        <h4>Ordine e comodità (subito)</h4>${SOFT.map(m=> `<label class="ask-toggle md-row"><input type="checkbox" data-s="${m.k}" ${m.get() ? 'checked' : ''}> <span><b>${m.n}</b><small>${esc(m.d)}</small></span></label>`).join('')}
        <div class="lp-tools"><button type="button" class="btn" id="mdPins">↩️ Ordine della scheda: rimetti l'originale</button></div>`;
      body.querySelectorAll('[data-m]').forEach(c=> c.addEventListener('change', ()=>{ const o = offMap(); if(c.checked) delete o[c.dataset.m]; else o[c.dataset.m] = true; LS.set(OFFK, o); body.querySelector('#mdReload').hidden = false; }));
      body.querySelectorAll('[data-s]').forEach(c=> c.addEventListener('change', ()=>{ const m = SOFT.find(x=> x.k === c.dataset.s); m.set(c.checked); toast(c.checked ? 'Acceso' : 'Spento', 1400); }));
      body.querySelector('#mdReload').addEventListener('click', ()=> location.reload());
      body.querySelector('#mdPins').addEventListener('click', ()=>{ window.rtCardOrder.resetPins(); toast('Ordine della scheda ripristinato', 1600); draw(); });
    };
    draw();
  }
  menu('🧩 Moduli (accendi e spegni le funzioni)', openModules);

  // =====================================================================
  // R4) «OGGI» e un solo avviso all'avvio
  // =====================================================================
  const TON = 'jrpg_today_on', TW = 'jrpg_today';
  const todayOn = ()=> LS.get(TON, 'on') !== 'off';
  const T0 = performance.now(), queue = [], LAST = +LS.get('rt_last_visit', 0) || 0, VER = LS.get('rt_last_ver', '') || '';
  const WIDGETS = [
    {id: 'avvisi', n: '🔔 Avvisi di oggi'}, {id: 'novita', n: '🆕 Cosa è cambiato mentre non c\'eri'}, {id: 'incorso', n: '▶️ Stai giocando'},
    {id: 'wish', n: '🎁 Wishlist'}, {id: 'consiglio', n: '💡 Più adatto a te ora'}
  ];
  const wcfg = ()=>{ const c = LS.get(TW, {}) || {}; const order = (c.order || []).filter(id=> WIDGETS.some(w=> w.id === id)); WIDGETS.forEach(w=>{ if(!order.includes(w.id)) order.push(w.id); }); return {order, hidden: c.hidden || []}; };
  const eur = n=> Number(n).toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  // gli avvisi sparsi dei primi secondi (Radar, prezzi, uscite, backup) vengono raccolti qui e mostrati con UN solo palloncino
  (function(){
    const BRIEF = /^(📡|🔔|🎉|💾|⚠️ Lo spazio)/;
    const orig = window.showToast; if(typeof orig !== 'function') return;
    window.showToast = function(msg, ms, onTap){
      try{ if(todayOn() && typeof msg === 'string' && typeof onTap === 'function' && BRIEF.test(msg) && performance.now() - T0 < 30000 && !queue.some(q=> q.msg === msg)){ queue.push({msg: msg.replace(/\s*[·.]?\s*Tocca per .*$/i, '').replace(/\s*· tocca per vedere$/i, ''), tap: onTap}); schedule(); return; } }catch(e){}
      return orig.apply(this, arguments);
    };
    try{ showToast = window.showToast; }catch(e){}
    let to = 0;
    function schedule(){ clearTimeout(to); to = setTimeout(emit, Math.max(2500, 15000 - (performance.now() - T0))); }
    function emit(){
      if(!queue.length) return;
      renderToday(true);
      const n = queue.length;
      orig.call(window, '🌅 Oggi: ' + n + (n === 1 ? ' novità' : ' novità') + ' per te. Tocca per vederle', 9000, ()=> openToday());
    }
  })();
  window.addEventListener('pagehide', ()=> LS.set('rt_last_visit', Date.now()));
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) LS.set('rt_last_visit', Date.now()); });
  setTimeout(()=> LS.set('rt_last_visit', Date.now()), 90000);
  function changesSince(){
    if(!LAST) return [];
    const h = LS.get('jrpg_history', {}) || {}, out = [];
    Object.keys(h).forEach(id=> (h[id] || []).forEach(x=>{ if(Date.parse(x.t) > LAST) out.push({id, ...x}); }));
    return out.sort((a, b)=> Date.parse(b.t) - Date.parse(a.t));
  }
  function widget(id){
    const byId = i=> GAMES.find(g=> String(g.id) === String(i));
    const chip = g=> `<button type="button" class="btn td-g" data-open="${g.id}"><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span> ${esc(g.name)}</button>`;
    if(id === 'avvisi'){ if(!queue.length) return ''; return `<ul class="td-list">${queue.map((q, i)=> `<li>${esc(q.msg)} ${q.tap ? `<button type="button" class="btn td-act" data-q="${i}">Apri</button>` : ''}</li>`).join('')}</ul>`; }
    if(id === 'novita'){
      const ch = changesSince(), cl = (typeof CHANGELOG !== 'undefined' && CHANGELOG[0]) || null, newVer = cl && VER && cl.version !== VER;
      if(!ch.length && !newVer) return '';
      return (newVer ? `<div class="td-line">🆕 App aggiornata alla <b>${esc(cl.version)}</b>: ${esc(String((cl.items || [])[0] || '').slice(0, 150))}…</div>` : '')
        + (ch.length ? `<div class="td-line"><b>${ch.length}</b> ${ch.length === 1 ? 'modifica automatica' : 'modifiche automatiche'} ai tuoi giochi:</div><ul class="td-list">${ch.slice(0, 5).map(x=>{ const g = byId(x.id); return g ? `<li><button type="button" class="btn td-g" data-open="${g.id}">${esc(g.name)}</button> <small>${esc(x.f)}: ${esc(x.a)} → ${esc(x.b)}</small></li>` : ''; }).join('')}</ul><div class="lp-sub">Ogni modifica si può annullare dalla «Cronologia delle modifiche» nella scheda del gioco.</div>` : '');
    }
    if(id === 'incorso'){ const l = GAMES.filter(g=> STATUSES[g.id] === 'playing').slice(0, 6); return l.length ? `<div class="td-chips">${l.map(chip).join('')}</div>` : ''; }
    if(id === 'wish'){
      const w = LS.get('jrpg_wishlist', {}) || {}, today = new Date().toISOString().slice(0, 10), items = Object.keys(w).map(i=> ({id: i, ...w[i]}));
      const next = items.filter(x=> !x.released && x.date && x.date.length === 10 && x.date >= today).sort((a, b)=> a.date.localeCompare(b.date)).slice(0, 2);
      const under = items.filter(x=> x.th && x.price && x.price.f && x.price.f <= x.th).slice(0, 3);
      if(!next.length && !under.length) return '';
      return `<ul class="td-list">${next.map(x=>{ const d = Math.round((new Date(x.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / 864e5); return `<li>📅 ${esc(x.name)}: esce tra ${d} giorn${d === 1 ? 'o' : 'i'}</li>`; }).join('')}${under.map(x=> `<li>💸 ${esc(x.name)}: ${eur(x.price.f)}, sotto i tuoi ${eur(x.th)}</li>`).join('')}</ul><button type="button" class="btn td-act" data-wl="1">Apri la wishlist</button>`;
    }
    if(id === 'consiglio'){
      if(typeof window.tasteScore !== 'function') return '';
      const ts = window.rtTasteModel && window.rtTasteModel(); if(!ts || ts.n < 3) return '';
      // il consiglio del giorno si calcola una volta sola finché i tuoi gusti non cambiano
      const ver = (window.rtTasteVer ? rtTasteVer() : 0) + ':' + GAMES.length;
      if(!widget._c || widget._c.ver !== ver){ const best = GAMES.filter(x=> !STATUSES[x.id] && !FAVS.has(x.id) && x.tier !== 'ND').map(x=> ({x, s: window.tasteScore(x)})).sort((a, b)=> b.s - a.s)[0]; widget._c = {ver, id: best ? best.x.id : null}; }
      const gx = widget._c.id != null ? GAMES.find(x=> x.id === widget._c.id) : null; const g = gx ? {x: gx} : null; if(!g) return '';
      const mm = (window.rtMechOf ? window.rtMechOf(g.x) : []).slice(0, 3).map(k=> window.rtMech[k].ic + ' ' + window.rtMech[k].n).join(' · ');
      return `<div class="td-chips">${chip(g.x)}</div>${mm ? `<div class="lp-sub">Tocca: ${esc(mm)}</div>` : ''}`;
    }
    return '';
  }
  function bodyHtml(){
    const c = wcfg(); let n = 0;
    const parts = c.order.filter(id=> !c.hidden.includes(id)).map(id=>{ const w = WIDGETS.find(x=> x.id === id), h = widget(id); if(!h) return ''; n++; return `<div class="td-w"><div class="td-t">${w.n}</div>${h}</div>`; }).join('');
    return {html: parts || '<div class="lp-sub">Niente di nuovo per ora: torna più tardi.</div>', n};
  }
  function wireToday(root){
    root.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = GAMES.find(x=> String(x.id) === b.dataset.open); const sh = document.getElementById('xToday'); if(sh) sh.classList.remove('show'); if(g) openModal(g); }));
    root.querySelectorAll('[data-q]').forEach(b=> b.addEventListener('click', ()=>{ const q = queue[+b.dataset.q]; const sh = document.getElementById('xToday'); if(sh) sh.classList.remove('show'); try{ q && q.tap && q.tap(); }catch(e){} }));
    root.querySelectorAll('[data-wl]').forEach(b=> b.addEventListener('click', ()=>{ const sh = document.getElementById('xToday'); if(sh) sh.classList.remove('show'); if(window.openWishlist) window.openWishlist(); }));
    root.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=> editToday()));
  }
  function renderToday(openIt){
    let box = document.getElementById('todayBox');
    if(!todayOn()){ if(box) box.remove(); return; }
    if(!box){
      const slot = document.getElementById('rtMusicSlot') || document.getElementById('buildLine'); if(!slot) return;
      box = document.createElement('details'); box.id = 'todayBox'; box.className = 'today-box'; slot.insertAdjacentElement('afterend', box);
      box.addEventListener('toggle', ()=> LS.set('jrpg_today_open', box.open));
      box.open = !!LS.get('jrpg_today_open', false);
    }
    if(!box._filled){ box._filled = true; box.open = !!LS.get('jrpg_today_open', false); }
    const {html, n} = bodyHtml();
    box.innerHTML = `<summary>🌅 <b>Oggi</b> <span class="td-n">${n ? n + (n === 1 ? ' cosa' : ' cose') : 'niente di nuovo'}</span></summary><div class="td-body">${html}<div class="td-foot"><button type="button" class="btn" data-edit="1">✎ Scegli cosa vedere</button></div></div>`;
    if(openIt && n) box.open = true;
    wireToday(box);
  }
  function openToday(){
    const body = U.sheet('xToday', '🌅 Oggi', '');
    const {html} = bodyHtml(); body.innerHTML = html + '<div class="td-foot"><button type="button" class="btn" data-edit="1">✎ Scegli cosa vedere</button></div>'; wireToday(body);
  }
  function editToday(){
    const body = U.sheet('xTodayEdit', '✎ Cosa vedere in «Oggi»', ''), c = wcfg();
    const draw = ()=>{
      const cc = wcfg();
      body.innerHTML = `<div class="lp-sub">Spunta quello che vuoi vedere e riordina con le frecce.</div>` + cc.order.map((id, i)=>{ const w = WIDGETS.find(x=> x.id === id); return `<div class="td-ed"><label class="ask-toggle"><input type="checkbox" data-id="${id}" ${cc.hidden.includes(id) ? '' : 'checked'}> ${w.n}</label><button type="button" class="btn" data-up="${i}" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" class="btn" data-dn="${i}" ${i === cc.order.length - 1 ? 'disabled' : ''}>▼</button></div>`; }).join('');
      const save = (order, hidden)=>{ LS.set(TW, {order, hidden}); renderToday(); draw(); };
      body.querySelectorAll('[data-id]').forEach(cb=> cb.addEventListener('change', ()=>{ const cur = wcfg(), h = cur.hidden.filter(x=> x !== cb.dataset.id); if(!cb.checked) h.push(cb.dataset.id); save(cur.order, h); }));
      body.querySelectorAll('[data-up],[data-dn]').forEach(b=> b.addEventListener('click', ()=>{ const cur = wcfg(), i = +(b.dataset.up != null ? b.dataset.up : b.dataset.dn), j = b.dataset.up != null ? i - 1 : i + 1; [cur.order[i], cur.order[j]] = [cur.order[j], cur.order[i]]; save(cur.order, cur.hidden); }));
    };
    draw();
  }
  menu('🌅 Oggi: le novità per te', openToday);
  window.rtToday = {render: renderToday, open: openToday};
  // v208: il posto del riquadro «Oggi» lo riservo SUBITO (vuoto): se comparisse dopo, spingerebbe giù la lista mentre tocchi
  setTimeout(()=>{ try{ if(!todayOn() || document.getElementById('todayBox')) return; const slot = document.getElementById('rtMusicSlot') || document.getElementById('buildLine'); if(!slot) return;
    const box = document.createElement('details'); box.id = 'todayBox'; box.className = 'today-box'; box.innerHTML = '<summary>🌅 <b>Oggi</b> <span class="td-n">…</span></summary>'; slot.insertAdjacentElement('afterend', box);
    box.addEventListener('toggle', ()=> LS.set('jrpg_today_open', box.open)); }catch(e){} }, 0);
  // v208: «Oggi» si prepara quando il telefono è libero (prima partiva a 1,2 s e poteva bloccare i primi tocchi dopo l'intro)
  setTimeout(()=>{ const run = ()=>{ try{ renderToday(); }catch(e){} }; if(window.requestIdleCallback) requestIdleCallback(run, {timeout: 6000}); else setTimeout(run, 50); }, 4500);
  setTimeout(()=>{ try{ const cl = (typeof CHANGELOG !== 'undefined' && CHANGELOG[0]); if(cl) LS.set('rt_last_ver', cl.version); }catch(e){} }, 60000);

  // =====================================================================
  // R5) IMPOSTAZIONI in un posto solo
  // =====================================================================
  const runMenu = rx=> { const it = (window.XMENU || []).find(x=> rx.test(x.html)); if(it) it.run(); else toast('Funzione non disponibile', 1800); };
  const openAskSettings = ()=>{ try{ openAsk(); setTimeout(()=>{ const d = document.getElementById('geminiSettings'); if(d){ d.open = true; d.scrollIntoView({block: 'start'}); } }, 300); }catch(e){ toast('Apri «Chiedi» e poi ⚙️', 2600); } };
  const SECTIONS = [
    {n: '🎨 Aspetto', reset: ['jrpg_pack', 'jrpg_pack_anim', 'jrpg_icons', 'jrpg_palette', 'jrpg_motion', 'jrpg_haptics', 'jrpg_hero', 'jrpg_view_mode', 'jrpg_fx', 'jrpg_cover_tint'], rows: [
      ['Palette colori', 'I 34 colori di base dell\'app', ()=> window.openPalettePicker && openPalettePicker()],
      ['Temi grafici', '20 stili completi, chiari e scuri', ()=> window.openPackPicker && openPackPicker()],
      ['Set di icone', '20 stili per tutte le icone', ()=> window.openIconPicker && openIconPicker()],
      ['Movimento e vibrazione', 'Animazioni e tic al tocco', ()=> runMenu(/Movimento/)],
      ['Suoni e musica', 'Suoni dei pulsanti e colonne sonore', ()=> runMenu(/Suoni/)],
      ['Anteprima cinematografica', 'Copertina e poi schermate nella scheda', ()=> runMenu(/Anteprima cinematografica/)],
      ['Gesti rapidi', 'Scorciatoie a tocco e swipe', ()=> runMenu(/Gesti/)]]},
    {n: '🔑 Chiavi e sincronizzazione', rows: [
      ['Chiavi (Gemini, RAWG, OpenCritic) e ponte', 'Le chiavi restano solo su questo dispositivo', openAskSettings],
      ['Sincronizzazione con GitHub', 'Token, «Sincronizza ora», accesso con utente', openAskSettings],
      ['Avvio: schermo intero e apertura animata', 'Le due opzioni di avvio', openAskSettings]]},
    {n: '🗂️ Dati e fonti', rows: [
      ['Fonti e lucchetti', 'Da quale fonte prendere ogni dato, «applica tutto da solo»', ()=> window.openFieldPrefs && openFieldPrefs()],
      ['Controllo dati', 'Modifiche da approvare e fonti', ()=> window.openAuditPanel && openAuditPanel()],
      ['Backup e spazio del browser', 'Copia di sicurezza e spazio libero', ()=> runMenu(/Backup/)],
      ['Verifica generi online', 'Confronto con Wikidata', ()=> window.openGenreCheck && openGenreCheck()],
      ['Copertine per l\'offline', 'Salva le copertine per usarle senza rete', ()=> runMenu(/offline/)],
      ['Rapporto qualità notturno', 'Cosa manca nelle schede', ()=> runMenu(/qualit/)]]},
    {n: '🔔 Avvisi', rows: [
      ['Wishlist, uscite e avvisi di prezzo', 'Soglie in € e notifiche del telefono', ()=> window.openWishlist && openWishlist()],
      ['Uscite nel calendario', 'File .ics con promemoria', ()=> window.rtExportIcs && rtExportIcs()],
      ['Riquadro «Oggi»', 'Cosa vedere e in che ordine', ()=> editToday()]]},
    {n: '🧩 Funzioni', rows: [
      ['Moduli', 'Accendi e spegni le funzioni', openModules],
      ['Ordine della scheda', 'Blocchi fissati con la pulce', openModules]]}
  ];
  function openSettings(){
    const body = U.sheet('xSettings', '⚙️ Impostazioni', '');
    body.innerHTML = `<div class="mn-search"><input type="search" placeholder="Cerca un\'impostazione…" autocomplete="off"></div><div id="stSecs">${SECTIONS.map((s, si)=> `<div class="st-sec" data-si="${si}"><div class="st-h"><b>${s.n}</b>${s.reset ? '<button type="button" class="btn st-reset" data-r="' + si + '">Ripristina</button>' : ''}</div>${s.rows.map(([t, d], ri)=> `<button type="button" class="btn st-row" data-si="${si}" data-ri="${ri}"><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join('')}</div>`).join('')}</div>`;
    const close = ()=>{ const el = document.getElementById('xSettings'); if(el) el.classList.remove('show'); };
    body.querySelectorAll('.st-row').forEach(b=> b.addEventListener('click', ()=>{ close(); SECTIONS[+b.dataset.si].rows[+b.dataset.ri][2](); }));
    body.querySelectorAll('.st-reset').forEach(b=> b.addEventListener('click', ()=>{ const s = SECTIONS[+b.dataset.r]; if(!confirm('Ripristino «' + s.n.replace(/^\S+\s/, '') + '» ai valori di fabbrica? Il programma si riavvia.')) return; s.reset.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} }); location.reload(); }));
    const inp = body.querySelector('input');
    inp.addEventListener('input', ()=>{ const q = norm(inp.value); body.querySelectorAll('.st-sec').forEach(sec=>{ let n = 0; sec.querySelectorAll('.st-row').forEach(r=>{ const hit = !q || norm(r.textContent).includes(q) || norm(sec.querySelector('.st-h b').textContent).includes(q); r.hidden = !hit; if(hit) n++; }); sec.hidden = !n; }); });
  }
  menu('⚙️ Impostazioni (tutto in un posto)', openSettings);
  window.rtSettings = {open: openSettings, modules: openModules};

  window.rtMenuRooms = {on: roomsOn, setOn: v=> LS.set(MON, v ? 'on' : 'off'), resetPins: ()=> { LS.set(MP, []); LS.set(MR, []); }};
})();
// ---- ricaricando la pagina (es. da Novità) torno nella stessa vista invece che in Classifica ----
(function(){
  try{
    const v0 = sessionStorage.getItem('rt_view');
    new MutationObserver(()=>{ const v = document.body.dataset.view; if(v) try{ sessionStorage.setItem('rt_view', v); }catch(e){} }).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
    if(v0 && v0 !== 'list'){
      let n = 0; const go = ()=>{ if(typeof window.setView === 'function' && typeof GAMES !== 'undefined' && GAMES.length){ try{ window.setView(v0); }catch(e){} } else if(++n < 40) setTimeout(go, 150); };
      setTimeout(go, 400);
    }
  }catch(e){}
})();
