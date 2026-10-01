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
  const LAYERS = [
    {id: 'capire', n: '🔎 Capire il gioco', keys: ['generi', 'simboli', 'storia', 'etichetta', 'affidabilita', 'gameplay', 'piace', 'proscons', 'tempo', 'longevita', 'colonna', 'cast', 'approfondimento', 'dettagli']},
    {id: 'giocare', n: '🎮 Giocarlo bene', keys: ['guida', 'compagno', 'saga']},
    {id: 'stato', n: '📋 Il tuo stato', keys: ['stato', 'recensione', 'nota']},
    {id: 'comprare', n: '🛒 Comprare', keys: ['comprare', 'versioni']},
    {id: 'simili', n: '🔁 Altri giochi', keys: ['simili']},
    {id: 'altro', n: '📚 Per approfondire', keys: ['eredi', 'quinte', 'uscita', 'album', 'cronologia']}
  ];
  const KEY_NAMES = {verdetto: 'Verdetto d\'acquisto', radar: 'Radar di gusto', generi: 'Generi', simboli: 'Simboli', storia: 'La storia', etichetta: 'Etichetta del gioco', affidabilita: 'Affidabilità dei dati', gameplay: 'Gameplay', piace: 'Perché potrebbe piacerti', proscons: 'Pro e contro', tempo: 'Voto nel tempo', longevita: 'Longevità', colonna: 'Colonna sonora', cast: 'Cast', approfondimento: 'Approfondimento', dettagli: 'Dettagli', guida: 'Come iniziare al meglio', compagno: 'Compagno di gioco', saga: 'Saga', stato: 'Il tuo stato', recensione: 'La tua recensione', nota: 'Nota', comprare: 'Prima di comprarlo', versioni: 'Quale versione conviene?', simili: 'Se ti è piaciuto…', eredi: 'Eredi spirituali', quinte: 'Dietro le quinte', uscita: 'Punto d\'uscita', album: 'Il mio album', cronologia: 'Cronologia delle modifiche'};
  const titleKey = t=>{
    t = norm(t);
    if(/etichetta/.test(t)) return 'etichetta'; if(/prima di comprarlo/.test(t)) return 'comprare'; if(/quale versione/.test(t)) return 'versioni'; if(/il tuo stato/.test(t)) return 'stato';
    if(/recensione/.test(t)) return 'recensione'; if(/voto nel tempo/.test(t)) return 'tempo'; if(/storia/.test(t)) return 'storia'; if(/gameplay/.test(t)) return 'gameplay'; if(/perche potrebbe/.test(t)) return 'piace';
    if(/pro contro|pro e contro/.test(t)) return 'proscons'; if(/longevit/.test(t)) return 'longevita'; if(/dettagli/.test(t)) return 'dettagli'; if(/se ti e piaciuto/.test(t)) return 'simili';
    if(/colonna sonora/.test(t)) return 'colonna'; if(/cast/.test(t)) return 'cast'; if(/approfondimento/.test(t)) return 'approfondimento'; if(/eredi/.test(t)) return 'eredi'; if(/dietro le quinte/.test(t)) return 'quinte';
    if(/punto d uscita/.test(t)) return 'uscita'; if(/il mio album/.test(t)) return 'album'; if(/^nota/.test(t)) return 'nota';
    return 'x-' + t.slice(0, 24);
  };
  function startKey(el){
    if(el.classList.contains('cd-layer')) return null;
    if(el.classList.contains('modal-section-title')) return titleKey(el.textContent);
    if(el.id === 'vdCard') return 'verdetto'; if(el.id === 'gsCard') return 'radar'; if(el.id === 'gdCard') return 'guida'; if(el.id === 'cpCard') return 'compagno';
    if(el.classList.contains('modal-tags')) return 'generi'; if(el.classList.contains('enrich-highlights')) return 'simboli'; if(el.classList.contains('ds-chip')) return 'affidabilita';
    if(el.classList.contains('saga-note')) return 'saga'; if(el.matches('details.hist')) return 'cronologia';
    return null;
  }
  const pins = ()=> (LS.get(PINS, []) || []).filter(k=> typeof k === 'string');
  let arranging = false, obs = null, tm = 0;
  function arrange(){
    const card = document.getElementById('modalCard'); if(!card || !card.children.length) return;
    if(!cardOrderOn()){ card.querySelectorAll('.cd-layer, .cd-pin').forEach(n=> n.remove()); return; }
    const g = (typeof currentModalGame !== 'undefined') ? currentModalGame : null;
    const kids = Array.from(card.children).filter(el=> !el.classList.contains('cd-layer'));
    const top = [], bottom = [], blocks = new Map();
    let cur = null, inBottom = false;
    kids.forEach(el=>{
      if(inBottom || el.classList.contains('modal-links') || (el.classList.contains('modal-actions') && cur !== null)){ inBottom = true; bottom.push(el); return; }
      const k = startKey(el);
      if(k){ cur = k; if(!blocks.has(k)) blocks.set(k, []); blocks.get(k).push(el); }
      else if(cur) blocks.get(cur).push(el);
      else top.push(el);
    });
    // ordine: in alto identità, verdetto e radar; poi quello che hai fissato; poi gli strati
    const st = g && typeof STATUSES !== 'undefined' ? STATUSES[g.id] : '';
    let layers = LAYERS.slice();
    if(st === 'playing'){ const a = layers.find(l=> l.id === 'giocare'), b = layers.find(l=> l.id === 'stato'); layers = [a, b].concat(layers.filter(l=> l !== a && l !== b)); }
    const used = new Set(), out = top.slice(), pinned = pins().filter(k=> blocks.has(k) && !['verdetto', 'radar'].includes(k));
    ['verdetto', 'radar'].forEach(k=>{ if(blocks.has(k)){ out.push(...blocks.get(k)); used.add(k); } });
    const label = (id, text)=>{ const d = document.createElement('div'); d.className = 'cd-layer'; d.dataset.l = id; d.textContent = text; return d; };
    if(pinned.length){ out.push(label('pins', '📌 Fissati da te')); pinned.forEach(k=>{ out.push(...blocks.get(k)); used.add(k); }); }
    const known = new Set(LAYERS.flatMap(l=> l.keys).concat(['verdetto', 'radar']));
    layers.forEach(l=>{
      const ks = l.keys.filter(k=> blocks.has(k) && !used.has(k));
      if(l.id === 'capire') blocks.forEach((v, k)=>{ if(!known.has(k) && !used.has(k) && !ks.includes(k)) ks.push(k); });         // blocchi nuovi/sconosciuti: restano tra quelli per capire
      if(!ks.length) return;
      out.push(label(l.id, l.n)); ks.forEach(k=>{ out.push(...blocks.get(k)); used.add(k); });
    });
    out.push(...bottom);
    // pulce su ogni blocco
    blocks.forEach((els, k)=>{
      const f = els[0]; if(!f || f.querySelector(':scope > .cd-pin')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cd-pin'; b.dataset.pin = k; b.title = 'Fissa questo blocco in alto'; b.setAttribute('aria-label', 'Fissa in alto'); b.textContent = '📌';
      f.classList.add('cd-has-pin'); f.appendChild(b);
    });
    card.querySelectorAll('.cd-pin').forEach(b=> b.classList.toggle('on', pins().includes(b.dataset.pin)));
    // se l'ordine è già quello giusto non tocco nulla (evita giri a vuoto)
    const now = Array.from(card.children);
    if(now.length === out.length && now.every((e, i)=> e === out[i])) return;
    if(obs) obs.disconnect();
    arranging = true;
    out.forEach(el=> card.appendChild(el));
    arranging = false;
    watch();
  }
  function watch(){ const card = document.getElementById('modalCard'); if(!card) return; if(!obs) obs = new MutationObserver(()=>{ if(arranging) return; clearTimeout(tm); tm = setTimeout(arrange, 90); }); obs.observe(card, {childList: true}); }
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('.cd-pin'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const k = b.dataset.pin, p = pins(), i = p.indexOf(k);
    if(i >= 0){ p.splice(i, 1); toast('Blocco rimesso al suo posto', 1800); } else { p.push(k); if(!LS.get('jrpg_card_pin_hint', false)){ LS.set('jrpg_card_pin_hint', true); toast('📌 Fissato in alto per tutti i giochi (rifai il tocco per toglierlo)', 3600); } else toast('📌 Fissato in alto', 1500); }
    LS.set(PINS, p); try{ window.rtHaptic && rtHaptic('tick'); }catch(x){}
    const y = b.getBoundingClientRect().top; arrange();
    const nb = document.querySelector('.cd-pin[data-pin="' + k + '"]'); if(nb){ try{ nb.scrollIntoView({block: 'center', behavior: 'smooth'}); }catch(x){} }
  }, true);
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){
      const r = prev.apply(this, arguments);
      try{ if(obs){ obs.disconnect(); } arrange(); watch(); }catch(e){ try{ console.error(e); }catch(x){} }
      return r;
    };
    try{ openModal = window.openModal; }catch(e){}
  }
  window.rtCardOrder = {arrange, pins, resetPins: ()=> { LS.set(PINS, []); arrange(); }, on: cardOrderOn, setOn: v=> { LS.set(ON, v ? 'on' : 'off'); arrange(); }, KEY_NAMES};

  // =====================================================================
  // R2) MENU ✨ IN STANZE, con ricerca, preferite (pulce) e usate di recente
  // =====================================================================
  const ROOMS = [
    {id: 'scopri', n: '🔍 Scopri', rx: /Radar|Wishlist|Scansiona|Oracolo|Scala d.ingresso|Uscite nel calendario|Raccoon Triad/i},
    {id: 'gusto', n: '🧬 Il tuo gusto', rx: /gusti|Livello|cronologia|Traguardi/i},
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

  window.rtMenuRooms = {on: roomsOn, setOn: v=> LS.set(MON, v ? 'on' : 'off'), resetPins: ()=> { LS.set(MP, []); LS.set(MR, []); }};
})();
