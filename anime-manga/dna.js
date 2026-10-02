// ---- DNA del giocatore (v195): cosa ti ha preso di un gioco + giochi simili «intelligenti» ----
// 1) Nella scheda, sotto la sintonia: «🧬 Cosa ti ha preso di questo gioco?». Tocchi i tratti (lore, build, esplorazione, crafting…):
//    👍 mi ha preso → 👎 non mi piace → niente. Si salva in atl_dna_why {id: {TRATTO: 1|-1}} e pesa forte nel modello dei gusti (extras3.js):
//    così capisco PERCHÉ ti piace un gioco che sembra «fuori genere» (una meccanica, una parte del gameplay, il mondo…).
// 2) «Se ti è piaciuto questo, prova anche»: non più solo saga e generi, ma tratti in comune (pesati con i TUOI gusti), struttura
//    (difficoltà, grinding, peso storia, ritmo), qualità e simboli. La saga va in una riga a parte. Meglio pochi consigli giusti che tanti banali.
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.gusto) return;
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const WHY = 'atl_dna_why';
  const MECH = ()=> window.rtMech || {};
  const mechOf = g=>{ try{ return window.rtMechOf ? window.rtMechOf(g) : []; }catch(e){ return []; } };
  const stOf = g=>{ try{ return (typeof STATUSES !== 'undefined' && STATUSES[g.id]) || ''; }catch(e){ return ''; } };
  const U = window.XUI || {};
  const isFav = g=>{ try{ return typeof FAVS !== 'undefined' && FAVS.has(g.id); }catch(e){ return false; } };

  // ---------- 1) cosa ti ha preso (v198: categorie, spiegazioni, parole tue) ----------
  // i tratti raggruppati per tema: così trovi subito quello che cerchi, qualunque sia il genere del gioco
  const CATS = [
    ['📖', 'Storia', ['STORY', 'TWIST', 'MYST', 'STRAT', 'MIND', 'DARK']],
    ['🫂', 'Personaggi e sentimenti', ['CHAR', 'GROWTH', 'FRIEND', 'VILLAIN', 'ROMANCE', 'EMO']],
    ['⚔️', 'Azione e poteri', ['COMBAT', 'POWER', 'HYPE', 'MECHA', 'SPORT']],
    ['🗺️', 'Mondo e atmosfera', ['WORLD', 'LORE', 'ATMO', 'JOURNEY', 'ISEKAI', 'SOCIETY']],
    ['☕', 'Toni leggeri', ['HUMOR', 'COZY', 'SCHOOL']],
    ['🎞️', 'Arte, musica e durata', ['ANIM', 'ART', 'MUSIC', 'LONG', 'SHORT']]
  ];
  // cosa significano i termini (anche quelli in inglese dei giocatori): compare toccando un tratto
  const XPL = {
    ANIM: 'Sakuga = scene animate con cura speciale (spesso i combattimenti), dove si vede la mano dei migliori animatori.',
    ISEKAI: 'Isekai = «altro mondo»: il protagonista viene reincarnato o trasportato in un mondo diverso, spesso fantasy.',
    FRIEND: 'Nakama = compagni legati come una famiglia (parola resa famosa da One Piece).',
    COZY: 'Iyashikei = storie «che curano»: ritmi lenti, vita quotidiana, sensazione di calma.',
    HYPE: 'Hype = momenti esaltanti, costruiti per farti saltare dalla sedia.',
    MECHA: 'Mecha = storie con robot giganti guidati da piloti (Gundam, Evangelion).',
    WORLD: 'World building = un mondo costruito con cura: culture, luoghi, regole e sistemi di poteri propri.',
    LONG: 'Serie da almeno 100 episodi o manga da almeno 60 volumi.',
    SHORT: 'Film, serie fino a 13 episodi o manga fino a 3 volumi.'
  };
  const CUST = 'atl_dna_custom';
  // ---------- v207: «Cosa ti ha preso» rifatto ----------
  // Un riquadro pulito: il tuo «filamento di DNA» con questo gioco (una striscia colorata), i motivi principali 💖, cosa ti è piaciuto 👍
  // e cosa no 👎. Per decidere in fretta c'è il GIOCO VELOCE: una carta alla volta da scorrere (destra 👍, sinistra 👎, su 💖, o i tasti).
  // Valori in atl_dna_why {id: {TRATTO: 2 💖 motivo principale | 1 👍 | 0.5 🫤 Mah, ex «Ni» (c'è, ma così così: neutro per i gusti) | -1 👎}}: il 💖 pesa il doppio.
  const MAXMAIN = 3;
  const getDw = g=> (LSG(WHY, {}) || {})[g.id] || {};
  function setDw(g, k, v){
    const all = LSG(WHY, {}) || {}, cur = all[g.id] || {};
    if(v) cur[k] = v; else delete cur[k];
    if(Object.keys(cur).length) all[g.id] = cur; else delete all[g.id];
    LSS(WHY, all); try{ SIMC.clear(); }catch(x){}
    try{ window.rtHaptic ? rtHaptic(v === 2 ? 'success' : 'soft') : (navigator.vibrate && navigator.vibrate(8)); }catch(x){}
    return cur;
  }
  const nMain = dw=> Object.values(dw).filter(v=> v === 2).length;
  const explain = k=>{ const M = MECH(); return XPL[k] || (M[k] ? M[k].d.charAt(0).toUpperCase() + M[k].d.slice(1) + '.' : ''); };
  const nameOf = k=>{ const M = MECH(); return M[k] ? M[k].n : k; };
  const icOf = k=>{ const M = MECH(); return M[k] ? M[k].ic : '•'; };
  // i tratti da proporre nel gioco veloce: prima quelli riconosciuti nel gioco, poi quelli che di solito ami, poi gli altri
  function deckFor(g){
    const M = MECH(), dw = getDw(g), det = mechOf(g).filter(k=> M[k]);
    let tm = null; try{ tm = window.rtTasteModel && rtTasteModel(); }catch(e){}
    const loved = Object.keys(M).filter(k=> !det.includes(k) && tm && (tm.wts['mech:' + k] || 0) > .3).sort((a, b)=> tm.wts['mech:' + b] - tm.wts['mech:' + a]);
    const rest = CATS.flatMap(c=> c[2]).filter(k=> M[k] && !det.includes(k) && !loved.includes(k));
    return [...det.map(k=> ({k, why: 'det'})), ...loved.map(k=> ({k, why: 'love'})), ...rest.map(k=> ({k, why: ''}))].filter(x=> !dw[x.k]);
  }
  const vcls = v=> v < 0 ? 'n' : v === .5 ? 'h' : v;
  const chip2 = (k, v)=> `<button type="button" class="d2-chip v${vcls(v)}" data-dna="${k}"><span>${icOf(k)}</span>${esc(nameOf(k))}${v === 2 ? '<i>💖</i>' : ''}</button>`;
  function whyHtml(g, info){
    const M = MECH(); if(!Object.keys(M).length) return '';
    const dw = getDw(g), known = isFav(g) || ['played', 'playing', 'dropped'].includes(stOf(g));
    const ks = Object.keys(dw).filter(k=> M[k] && dw[k]);
    const main = ks.filter(k=> dw[k] === 2), like = ks.filter(k=> dw[k] === 1), ni = ks.filter(k=> dw[k] === .5), no = ks.filter(k=> dw[k] < 0);
    const todo = deckFor(g), det = mechOf(g).filter(k=> M[k] && !dw[k]).length;
    const mine = Object.entries(LSG(CUST, {}) || {});
    // la striscia: un segmento per ogni tratto deciso (rosa = motivo principale, verde = piaciuto, rosso = no)
    const strip = ks.length ? `<div class="d2-strip" aria-hidden="true">${[...main, ...like, ...ni, ...no].map(k=> `<i class="s${vcls(dw[k])}"></i>`).join('')}</div>` : '<div class="d2-strip empty" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    const say = ks.length
      ? `${main.length ? `Ti ha preso soprattutto per <b>${main.map(k=> esc(nameOf(k).toLowerCase())).join('</b>, <b>')}</b>` : (like.length === 1 ? 'Ti è piaciuto per una cosa' : `Ti è piaciuto per ${like.length} cose`)}${main.length && like.length ? (like.length === 1 ? ' e un\'altra cosa' : ` e altre ${like.length} cose`) : ''}${no.length ? (no.length === 1 ? ' · una non ti è piaciuta' : ` · ${no.length} non ti sono piaciute`) : ''}.`
      : (known ? 'Dimmi cosa ti ha preso: in 30 secondi il cervello impara il <b>perché</b> dei tuoi gusti.' : 'Dimmi cosa ti attira: capirò meglio cosa cerchi nei giochi.');
    const go = todo.length ? (ks.length ? `▶ Continua il gioco veloce <small>${det ? det + ' riconosciuti qui · ' : ''}${todo.length} da decidere</small>` : `▶ Scopri cosa ti ha preso <small>gioco veloce · 30 secondi</small>`) : '';
    const sec = (t, list)=> list.length ? `<div class="d2-sec"><div class="d2-st">${t}</div><div class="d2-chips">${list.map(k=> chip2(k, dw[k])).join('')}</div></div>` : '';
    return `<div class="dna-card dna2" id="dnaWhy">
      <div class="d2-head"><span class="d2-logo" aria-hidden="true">🧬</span><div class="d2-ht"><b>${known ? 'Cosa ti ha preso di questo gioco?' : 'Cosa ti attira di questo gioco?'}</b><small>${ks.length ? ks.length + (ks.length === 1 ? ' tratto deciso' : ' tratti decisi') : 'Il tuo DNA di giocatore con ' + esc(g.name)}</small></div></div>
      ${strip}
      <div class="d2-say">${say}</div>
      ${go ? `<button type="button" class="d2-go" data-dna-deck>${go}</button>` : ''}
      ${sec('💖 I motivi principali', main)}${sec('👍 Ti è piaciuto', like)}${sec('🫤 Mah, così così', ni)}${sec('👎 Non ti è piaciuto', no)}
      ${ks.length ? '<div class="d2-hint">Tocca un tratto per cambiarlo: 👍 → 💖 → 🫤 Mah → 👎 → via</div>' : ''}
      ${mine.length ? `<div class="d2-sec"><div class="d2-st">✍️ I tuoi tratti</div><div class="d2-chips">${mine.map(([k, c])=> { const v = (c.by || []).includes(g.id) ? 1 : (c.no || []).includes(g.id) ? -1 : 0; return `<button type="button" class="d2-chip v${v < 0 ? 'n' : v}" data-mine="${esc(k)}"><span>✍️</span>${esc(c.n)}</button>`; }).join('')}</div></div>` : ''}
      <div class="dna-info" id="dnaInfo"${info ? '' : ' hidden'}>${info || ''}</div>
      <div class="d2-tools"><button type="button" class="btn" data-dna-all>🔎 Tutti i tratti <small>${Object.keys(M).length}</small></button><button type="button" class="btn" data-dna-free>✍️ Con parole tue</button></div>
    </div>`;
  }
  // ---------- il GIOCO VELOCE: una carta alla volta ----------
  function openDeck(card, g){
    if(!U.sheet) return;
    const deck = deckFor(g).slice(0, 14); if(!deck.length){ U.toast && U.toast('Hai già deciso tutti i tratti di questo gioco 👏'); return; }
    let i = 0; const done = {like: 0, main: 0, no: 0};
    const body = U.sheet('xDnaDeck', '🧬 Gioco veloce', `<div class="dk"><div class="dk-top"><span id="dkN"></span><div class="dk-prog"><i id="dkP"></i></div></div><div class="dk-stage" id="dkStage"></div>
      <div class="dk-btns"><button type="button" class="dk-b no" data-dk="-1" aria-label="Non mi è piaciuto">👎<small>No</small></button><button type="button" class="dk-b skip" data-dk="0" aria-label="Non c'è o salta">⏭️<small>Non c'è</small></button><button type="button" class="dk-b ni" data-dk="0.5" aria-label="Mah, così così">🫤<small>Mah</small></button><button type="button" class="dk-b yes" data-dk="1" aria-label="Mi è piaciuto">👍<small>Sì</small></button><button type="button" class="dk-b main" data-dk="2" aria-label="È il motivo principale">💖<small>Il motivo!</small></button></div>
      <div class="dk-help">Scorri la carta: <b>→</b> mi piace · <b>←</b> no · <b>↑</b> è il motivo principale</div></div>`);
    const stage = body.querySelector('#dkStage');
    const tag = w=> w === 'det' ? '<span class="dk-tag det">🔎 Riconosciuto in questo gioco</span>' : w === 'love' ? '<span class="dk-tag love">💜 Di solito ti piace: c\'è anche qui?</span>' : '<span class="dk-tag">❓ C\'è in questo gioco?</span>';
    function show(){
      body.querySelector('#dkN').textContent = Math.min(i + 1, deck.length) + ' / ' + deck.length;
      body.querySelector('#dkP').style.width = Math.round(i / deck.length * 100) + '%';
      if(i >= deck.length){ finish(); return; }
      const {k, why} = deck[i];
      stage.innerHTML = `<div class="dk-card" id="dkCard"><div class="dk-stamp yes">MI PIACE</div><div class="dk-stamp no">NO</div><div class="dk-stamp main">💖 IL MOTIVO</div>
        ${tag(why)}<div class="dk-ic">${icOf(k)}</div><b class="dk-name">${esc(nameOf(k))}</b><p class="dk-x">${esc(explain(k))}</p></div>`;
      const c = stage.querySelector('#dkCard');
      try{ c.animate([{transform: 'translateY(18px) scale(.94)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 260, easing: 'cubic-bezier(.32,.72,0,1)'}); }catch(e){}
      drag(c);
    }
    function decide(v){
      if(i >= deck.length) return;
      const {k} = deck[i], dw = getDw(g);
      if(v === 2 && nMain(dw) >= MAXMAIN){ v = 1; U.toast && U.toast('Hai già 3 motivi principali: lo segno come 👍', 2200); }
      if(v) setDw(g, k, v);
      if(v === 2) done.main++; else if(v === 1) done.like++; else if(v === .5) done.ni = (done.ni || 0) + 1; else if(v < 0) done.no++;
      const c = stage.querySelector('#dkCard');
      const to = v === 2 ? 'translateY(-130%) rotate(-4deg)' : v === 1 ? 'translateX(130%) rotate(16deg)' : v < 0 ? 'translateX(-130%) rotate(-16deg)' : v === .5 ? 'translateY(30%) scale(.8) rotate(6deg)' : 'translateY(40%) scale(.85)';
      i++;
      if(c){ c.classList.add('dk-' + (v === 2 ? 'main' : v === 1 ? 'yes' : v < 0 ? 'no' : 'skip')); try{ c.animate([{transform: c.style.transform || 'none', opacity: 1}, {transform: to, opacity: 0}], {duration: 240, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards'}).finished.then(show, show); return; }catch(e){} }
      show();
    }
    function drag(c){
      let x0 = 0, y0 = 0, dx = 0, dy = 0, on = false;
      c.addEventListener('pointerdown', e=>{ on = true; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; try{ c.setPointerCapture(e.pointerId); }catch(x){} c.style.transition = 'none'; });
      c.addEventListener('pointermove', e=>{ if(!on) return; dx = e.clientX - x0; dy = e.clientY - y0; c.style.transform = `translate(${dx}px, ${Math.min(0, dy)}px) rotate(${dx / 18}deg)`;
        c.classList.toggle('t-yes', dx > 50); c.classList.toggle('t-no', dx < -50); c.classList.toggle('t-main', dy < -70 && Math.abs(dx) < 60); });
      const end = ()=>{ if(!on) return; on = false;
        if(dy < -90 && Math.abs(dx) < 80) decide(2); else if(dx > 90) decide(1); else if(dx < -90) decide(-1);
        else { c.style.transition = 'transform .25s cubic-bezier(.32,.72,0,1)'; c.style.transform = ''; c.classList.remove('t-yes', 't-no', 't-main'); } };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    }
    function finish(){
      const tot = done.like + done.main + done.no + (done.ni || 0);
      stage.innerHTML = `<div class="dk-end"><div class="dk-end-ic">🧬</div><b>${tot ? 'Il tuo DNA è cresciuto!' : 'Fatto!'}</b><p>${tot ? `${done.main ? `💖 ${done.main} ${done.main === 1 ? 'motivo principale' : 'motivi principali'} · ` : ''}👍 ${done.like} · ${done.ni ? '🫤 ' + done.ni + ' · ' : ''}👎 ${done.no}<br>Il cervello ora sa meglio <b>perché</b> ti piace un gioco come questo.` : 'Nessun tratto segnato questa volta.'}</p><button type="button" class="btn primary" id="dkClose">Chiudi</button></div>`;
      body.querySelector('.dk-btns').hidden = true; body.querySelector('.dk-help').hidden = true;
      try{ window.rtHaptic && rtHaptic('success'); }catch(e){}
      body.querySelector('#dkClose').addEventListener('click', ()=>{ const sh = document.getElementById('xDnaDeck'); if(sh) sh.classList.remove('show'); });
    }
    body.querySelectorAll('[data-dk]').forEach(b=> b.addEventListener('click', ()=> decide(+b.dataset.dk)));
    // alla chiusura del foglio aggiorno il riquadro nella scheda (sul posto, senza far saltare la pagina)
    const sh = document.getElementById('xDnaDeck');
    if(sh && !sh._dk){ sh._dk = 1; new MutationObserver(()=>{ if(!sh.classList.contains('show')){ const c2 = document.getElementById('modalCard'), g2 = typeof currentModalGame !== 'undefined' ? currentModalGame : null; if(c2 && g2) redraw(c2, g2, ''); } }).observe(sh, {attributes: true, attributeFilter: ['class']}); }
    show();
  }
  // ---------- tutti i tratti, con la ricerca ----------
  function openAll(card, g){
    if(!U.sheet) return;
    const M = MECH(), inCat = new Set(CATS.flatMap(c=> c[2])), extra = Object.keys(M).filter(k=> !inCat.has(k));
    const cats = CATS.map(c=> [c[0], c[1], c[2].concat(c[1] === 'Sistemi e attività' ? extra : []).filter(k=> M[k])]);
    const body = U.sheet('xDnaAll', '🔎 Tutti i tratti', `<input type="search" id="daQ" class="d2-search" placeholder="Cerca: loot, lore, minigiochi, superboss…" autocomplete="off">
      <div class="d2-hint">Tocca per cambiare: 👍 → 💖 → 🫤 Mah → 👎 → via</div><div id="daL"></div>`);
    const L = body.querySelector('#daL'), Q = body.querySelector('#daQ');
    const det = new Set(mechOf(g));
    const draw = ()=>{
      const q = Q.value.trim().toLowerCase(), dw = getDw(g);
      const hit = k=> !q || (nameOf(k) + ' ' + (M[k].d || '') + ' ' + (XPL[k] || '')).toLowerCase().includes(q);
      L.innerHTML = cats.map(([ic, n, ks])=>{ const list = ks.filter(hit); if(!list.length) return ''; return `<div class="d2-sec"><div class="d2-st">${ic} ${esc(n)}</div><div class="d2-chips">${list.map(k=> chip2(k, dw[k] || 0).replace('class="d2-chip', 'class="d2-chip' + (det.has(k) && !dw[k] ? ' det' : ''))).join('')}</div></div>`; }).join('') || '<div class="lp-sub">Nessun tratto con queste parole. Prova «✍️ Con parole tue»: l\'AI può crearne uno nuovo.</div>';
    };
    L.addEventListener('click', e=>{ const b = e.target.closest('[data-dna]'); if(!b) return; cycle(g, b.dataset.dna); draw(); });
    Q.addEventListener('input', draw); draw();
    const sh = document.getElementById('xDnaAll');
    if(sh && !sh._da){ sh._da = 1; new MutationObserver(()=>{ if(!sh.classList.contains('show')){ const c2 = document.getElementById('modalCard'), g2 = typeof currentModalGame !== 'undefined' ? currentModalGame : null; if(c2 && g2) redraw(c2, g2, ''); } }).observe(sh, {attributes: true, attributeFilter: ['class']}); }
  }
  // 👍 → 💖 → 👎 → via
  function cycle(g, k){
    const dw = getDw(g), v = dw[k] || 0;
    let nx = v === 0 ? 1 : v === 1 ? 2 : v === 2 ? .5 : v === .5 ? -1 : 0;
    if(nx === 2 && nMain(dw) >= MAXMAIN){ nx = .5; U.toast && U.toast('Massimo 3 motivi principali', 1800); }
    setDw(g, k, nx); return nx;
  }
  function freeText(card, g){
    if(!U.sheet){ return; }
    const body = U.sheet('xDnaFree', '✍️ Con parole tue', `<div class="lp-sub">Cosa ti è piaciuto (o non piaciuto) di <b>${esc(g.name)}</b>? Scrivilo come lo diresti a un amico: anche una piccola parte, una meccanica, un personaggio, la musica. L'AI lo trasforma in tratti del tuo DNA (anche nuovi) e li userò per tutti i giochi.</div>
      <textarea id="dfT" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:12px;border:1px solid var(--border,#555);background:var(--card,#222);color:inherit;font:inherit" placeholder="Es. adoro i dark eoni e la sphere grid, la storia di Tidus e Yuna, il blitzball; non sopporto il backtracking"></textarea>
      <div class="lp-tools"><button class="btn primary" id="dfGo" type="button">🧬 Capisci i miei gusti</button></div><div id="dfMsg" class="lp-sub"></div>`);
    const go = body.querySelector('#dfGo');
    go.addEventListener('click', async ()=>{ const t = body.querySelector('#dfT').value; if(!t.trim()) return; go.disabled = true; body.querySelector('#dfMsg').textContent = 'Ci penso…'; await freeRun(card, g, t); go.disabled = false; const sh = document.getElementById('xDnaFree'); if(sh) sh.classList.remove('show'); });
    setTimeout(()=>{ try{ body.querySelector('#dfT').focus(); }catch(e){} }, 200);
  }
  // v200: i tratti nuovi non finiscono in «altro»: l'AI crea il tratto preciso (es. «Attacchi a tempo» di Legend of Dragoon)
  // e poi cerca nel TUO catalogo quali giochi ce l'hanno. Così il tratto funziona davvero per sintonia e giochi simili.
  const slugOf = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  async function gamesWith(c){
    const list = GAMES.map(x=> x.id + '|' + x.name).join('\n');
    const pr = `Tratto di gioco: «${c.n}»${(c.kw || []).length ? ' (parole chiave: ' + c.kw.join(', ') + ')' : ''}${c.d ? ' — ' + c.d : ''}.
Qui sotto c'è un catalogo di videogiochi, una riga per gioco nel formato id|nome. Indica SOLO i giochi in cui questo tratto è presente in modo chiaro e riconoscibile (non vago). Se non sei sicuro, escludilo.
Rispondi SOLO con JSON: {"ids":[numeri id]}.
CATALOGO:
${list}`;
    try{ const r = await askLLM(pr, {}, {fast: true, label: 'Cerco «' + c.n + '» nei tuoi giochi…'}); const m = String(r && r.text || '').match(/\{[\s\S]*\}/); const j = m ? JSON.parse(m[0]) : null;
      const ok = new Set(GAMES.map(x=> x.id)); return ((j && j.ids) || []).map(Number).filter(id=> ok.has(id)).slice(0, 150);
    }catch(e){ return null; }
  }
  window.rtDnaGamesWith = gamesWith;
  async function freeRun(card, g, txt){
    if(typeof askLLM !== 'function'){ U.toast && U.toast('Serve la chiave Gemini (⚙️ in Chiedi a Claude)'); return; }
    const M = MECH(), cat = Object.keys(M).map(k=> k + ' = ' + M[k].n + ' (' + M[k].d + ')').join('\n');
    const cu0 = LSG(CUST, {}) || {}, mineList = Object.keys(cu0).map(k=> k + ' = ' + cu0[k].n).join('\n');
    const pr = `Un giocatore descrive cosa gli è piaciuto o no del videogioco "${g.name}". Trasforma le sue parole in tratti del suo DNA di giocatore.
TRATTI GENERALI (sigle):\n${cat}\n${mineList ? `\nTRATTI GIÀ CREATI DA LUI (sigle):\n${mineList}\n` : ''}
Regole:
- "si"/"no": sigle dei tratti generali che corrispondono DAVVERO a quello che dice.
- "suoi_si"/"suoi_no": sigle dei tratti già creati da lui che corrispondono.
- "nuovi": se cita qualcosa di SPECIFICO che nessun tratto descrive con precisione (una meccanica particolare, es. «combattimento con attacchi a tempo da premere al momento giusto», un tipo di minigioco, uno stile di musica, un tipo di personaggio), crea un tratto nuovo preciso. Meglio un tratto nuovo preciso che forzarlo in uno generico. Massimo 4.
Rispondi SOLO con JSON: {"si":[], "no":[], "suoi_si":[], "suoi_no":[], "nuovi":[{"nome":"nome breve e chiaro in italiano","descrizione":"cosa significa, in una frase semplice","parole":["4-8 parole chiave in italiano e inglese, anche nomi tecnici (es. timed hits, QTE, additions)"],"piace":true}]}
TESTO: «${txt.trim().slice(0, 1200)}»`;
    let j = null;
    try{ const r = await askLLM(pr, {}, {fast: true, label: 'Capisco cosa ti è piaciuto…'}); const m = String(r && r.text || '').match(/\{[\s\S]*\}/); j = m ? JSON.parse(m[0]) : null; }catch(e){ try{ showToast('L\'AI non risponde ora: riprova tra poco', 3000); }catch(x){} return; }
    if(!j){ try{ showToast('Non ho capito: riprova con altre parole', 2500); }catch(x){} return; }
    const all = LSG(WHY, {}) || {}, cur = all[g.id] || {}; let n = 0;
    (j.si || []).forEach(k=>{ if(M[k]){ cur[k] = 1; n++; } }); (j.no || []).forEach(k=>{ if(M[k]){ cur[k] = -1; n++; } });
    if(Object.keys(cur).length) all[g.id] = cur; LSS(WHY, all);
    const cu = LSG(CUST, {}) || {}, made = [], todo = [];
    (j.suoi_si || []).forEach(k=>{ const c = cu[k]; if(!c) return; c.by = c.by || []; if(!c.by.includes(g.id)) c.by.push(g.id); c.no = (c.no || []).filter(x=> x !== g.id); n++; });
    (j.suoi_no || []).forEach(k=>{ const c = cu[k]; if(!c) return; c.no = c.no || []; if(!c.no.includes(g.id)) c.no.push(g.id); c.by = (c.by || []).filter(x=> x !== g.id); n++; });
    (j.nuovi || []).slice(0, 4).forEach(x=>{
      if(!x || !x.nome) return; const k = slugOf(x.nome); if(!k) return;
      const c = cu[k] || {n: String(x.nome).slice(0, 48), kw: [], by: [], no: []};
      if(x.descrizione && !c.d) c.d = String(x.descrizione).slice(0, 160);
      c.kw = [...new Set((c.kw || []).concat((x.parole || []).map(String).slice(0, 8)))];
      c.by = c.by || []; c.no = c.no || [];
      if(x.piace === false){ if(!c.no.includes(g.id)) c.no.push(g.id); } else if(!c.by.includes(g.id)) c.by.push(g.id);
      cu[k] = c; made.push(c.n); if(!c.games) todo.push(k);
    });
    LSS(CUST, cu); try{ SIMC.clear(); }catch(x){}
    redraw(card, g, `✅ Capito: ${n} tratti segnati${made.length ? ' · nuovi tratti tuoi: ' + made.map(esc).join(', ') + ' — ora cerco quali tuoi giochi li hanno…' : ''}.`);
    // per ogni tratto nuovo: quali giochi del catalogo ce l'hanno
    const found = [];
    for(const k of todo){
      const c = (LSG(CUST, {}) || {})[k]; if(!c) continue;
      const ids = await gamesWith(c); if(!ids) continue;
      const cu2 = LSG(CUST, {}) || {}; if(!cu2[k]) continue;
      if(!ids.includes(g.id) && (cu2[k].by || []).includes(g.id)) ids.push(g.id);
      cu2[k].games = ids; LSS(CUST, cu2); try{ SIMC.clear(); }catch(x){}
      const names = ids.filter(id=> id !== g.id).slice(0, 5).map(id=> (GAMES.find(x=> x.id === id) || {}).name).filter(Boolean);
      found.push(`<b>${esc(c.n)}</b>: in ${ids.length} tuoi giochi${names.length ? ' (' + names.map(esc).join(', ') + (ids.length > 6 ? '…' : '') + ')' : ''}`);
    }
    if(found.length && card.isConnected) redraw(card, g, '✅ ' + found.join('<br>✅ ') + '<br><small>Ora contano nella Sintonia e nei giochi simili.</small>');
  }
  function redraw(card, g, info){
    const box = card.querySelector('#dnaWhy'); if(!box) return;
    const open = [...box.querySelectorAll('details.dna-cat')].map(d=> d.open), y = card.scrollTop, tb = box.dataset.tab;
    box.outerHTML = whyHtml(g, info); const nb = card.querySelector('#dnaWhy'); if(nb && tb) nb.dataset.tab = tb;      // resta nella sua linguetta (niente lampeggi)
    if(nb) [...nb.querySelectorAll('details.dna-cat')].forEach((d, i)=>{ if(open[i]) d.open = true; });
    wire(card, g);
    try{ const gs = card.querySelector('#gsCard'); const h = window.rtRadar && window.rtRadar(g); if(gs && h){ const t2 = gs.dataset.tab; gs.outerHTML = h; const n2 = card.querySelector('#gsCard'); if(n2 && t2) n2.dataset.tab = t2; } }catch(x){}
    card.scrollTop = y; requestAnimationFrame(()=>{ card.scrollTop = y; });
  }
  function wire(card, g){
    const box = card.querySelector('#dnaWhy'); if(!box || box.dataset.w) return; box.dataset.w = '1';
    box.addEventListener('click', e=>{
      if(e.target.closest('[data-dna-free]')){ freeText(card, g); return; }
      if(e.target.closest('[data-dna-deck]')){ openDeck(card, g); return; }
      if(e.target.closest('[data-dna-all]')){ openAll(card, g); return; }
      const mb = e.target.closest('[data-mine]');
      if(mb){ const cu = LSG(CUST, {}) || {}, c = cu[mb.dataset.mine]; if(!c) return; c.by = c.by || []; c.no = c.no || []; if(c.by.includes(g.id)){ c.by = c.by.filter(x=> x !== g.id); c.no.push(g.id); } else if(c.no.includes(g.id)) c.no = c.no.filter(x=> x !== g.id); else c.by.push(g.id); LSS(CUST, cu); try{ SIMC.clear(); }catch(x){}
        const v = c.by.includes(g.id) ? 1 : c.no.includes(g.id) ? -1 : 0; mb.className = 'd2-chip v' + (v < 0 ? 'n' : v);
        const inf = box.querySelector('#dnaInfo'); if(inf){ inf.innerHTML = '✍️ <b>' + esc(c.n) + '</b>' + (c.d ? '<br>' + esc(c.d) : '') + (c.games ? '<br>Presente in ' + c.games.length + ' tuoi giochi.' : ''); inf.hidden = false; }
        if(!c.games && typeof askLLM === 'function') gamesWith(c).then(ids=>{ if(!ids) return; const cu2 = LSG(CUST, {}) || {}, k = mb.dataset.mine; if(!cu2[k]) return; cu2[k].games = ids; LSS(CUST, cu2); try{ SIMC.clear(); }catch(x){} });
        return; }
      const b = e.target.closest('[data-dna]'); if(!b) return;
      const k = b.dataset.dna, nx = cycle(g, k);
      // aggiorno il chip sul posto, poi ridisegno il riquadro quando smetti di toccare (i tratti cambiano gruppo) — lo scorrimento resta fermo
      b.className = 'd2-chip v' + vcls(nx); b.innerHTML = `<span>${icOf(k)}</span>${esc(nameOf(k))}${nx === 2 ? '<i>💖</i>' : ''}`;
      try{ b.animate([{transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'scale(1)'}], {duration: 260}); }catch(x){}
      const info = `<b>${icOf(k)} ${esc(nameOf(k))}</b> · ${nx === 2 ? '💖 il motivo principale' : nx === .5 ? '🫤 mah, così così' : nx > 0 ? '👍 ti è piaciuto' : nx < 0 ? '👎 non ti è piaciuto' : 'tolto'}<br>${esc(explain(k))}`;
      const inf = box.querySelector('#dnaInfo'); if(inf){ inf.innerHTML = info; inf.hidden = false; }
      clearTimeout(box._rt); box._rt = setTimeout(()=> redraw(card, g, info), 1400);
    });
  }

  // ---------- 2) giochi simili ----------
  const EXCL = [['HOR', 'GOR'], ['SPO'], ['MEC'], ['KID'], ['ECC', 'HAR'], ['IDO'], ['MAH'], ['DOC']];      // versione Anime
  const yearOf = x=> x.ysort || (parseInt(String(x.year || '').slice(0, 4), 10) || null);
  const sagaK = x=>{ try{ return typeof sagaKeyOf === 'function' ? sagaKeyOf(x) : ''; }catch(e){ return ''; } };
  const keyN = t=> String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  // rarità di ogni tratto e genere: un tratto che hanno quasi tutti (es. «storia» nei JRPG) dice poco; uno raro (lore, sandbox, loot) dice molto
  let IDF = null, IDFn = 0;
  function idf(){
    if(IDF && IDFn === GAMES.length) return IDF;
    const df = {}, N = GAMES.length || 1;
    GAMES.forEach(x=>{ new Set(mechOf(x).map(k=> 'm:' + k).concat((x.tags || []).map(t=> 't:' + t))).forEach(k=> df[k] = (df[k] || 0) + 1); });
    IDF = {}; Object.keys(df).forEach(k=> IDF[k] = Math.log((N + 1) / (df[k] + 1)) + .15); IDFn = GAMES.length; return IDF;
  }
  function similar(g){
    let tm = null; try{ tm = window.rtTasteModel && window.rtTasteModel(); }catch(e){}
    const wt = k=> (tm && tm.wts && tm.wts['mech:' + k]) || 0;
    const gt = new Set(g.tags || []), gm = new Set(mechOf(g)), gl = g.label || {}, ge = g.enrich || {}, gy = yearOf(g), saga = sagaK(g);
    const hint = new Set((ge.similarTo || []).map(keyN));
    const same = [], other = [];
    GAMES.forEach(x=>{
      if(x.id === g.id) return;
      const xt = new Set(x.tags || []);
      for(const grp of EXCL){ const a = grp.some(t=> gt.has(t)), b = grp.some(t=> xt.has(t)); if(a !== b) return; }
      if(stOf(x) === 'dropped') return;
      if(saga && sagaK(x) === saga){ same.push(x); return; }
      // generi
      const W = idf(), wsum = (arr, p)=> arr.reduce((s, k)=> s + (W[p + k] || 1), 0);
      const sh = [...xt].filter(t=> gt.has(t)), uni = [...new Set([...gt, ...xt])];
      let sc = wsum(sh, 't:') / (wsum(uni, 't:') || 1) * 4;
      const primary = (g.tags || [])[0] && (g.tags || [])[0] === (x.tags || [])[0]; if(primary) sc += 1.5;
      // tratti del DNA in comune, pesati per rarità e con i tuoi gusti
      const xm = mechOf(x), shm = xm.filter(k=> gm.has(k)), unim = [...new Set([...gm, ...xm])];
      sc += wsum(shm, 'm:') / (wsum(unim, 'm:') || 1) * 8;
      const pers = shm.reduce((s, k)=> s + Math.max(0, wt(k)), 0); sc += Math.min(3, pers * 1.2);
      const bad = xm.filter(k=> wt(k) < -.3).length; sc -= bad * 1.2;                  // tratti che di solito eviti
      // struttura
      const xl = x.label || {}, xe = x.enrich || {};
      [['d', 1], ['g', 1], ['s', 1]].forEach(([k])=>{ if(gl[k] && xl[k]){ const d = Math.abs(gl[k] - xl[k]); sc += d <= 1 ? .6 : d >= 3 ? -.7 : 0; } });
      if(gl.p && xl.p) sc += gl.p === xl.p ? .4 : 0;
      if(ge.storyTag && ge.storyTag === xe.storyTag) sc += 1;
      if(ge.dopamine && xe.dopamine) sc += .8;
      const xy = yearOf(x); if(gy && xy){ const d = Math.abs(gy - xy); sc += d <= 5 ? .5 : d > 20 ? -.6 : 0; }
      // qualità: niente consigli mediocri
      const s0 = +x.score || 0; sc += s0 >= 88 ? 1.2 : s0 >= 80 ? .6 : s0 < 60 ? -3 : s0 < 70 ? -1.6 : s0 < 77 ? -.6 : 0;
      if(hint.has(keyN(x.name))) sc += 3;
      if(isFav(x) || stOf(x) === 'played') sc -= .6;                                     // già giocati: dopo quelli nuovi
      if(sc >= 8) other.push({x, sc, shm: shm.sort((a, b)=> wt(b) - wt(a)), primary, pers});
    });
    other.sort((a, b)=> b.sc - a.sc);
    same.sort((a, b)=> Math.abs((yearOf(a) || 0) - (gy || 0)) - Math.abs((yearOf(b) || 0) - (gy || 0)));
    return {other: other.slice(0, 6), same: same.slice(0, 4)};
  }
  window.rtSimilar = similar;
  // somiglianza 0..1 tra due giochi (per la Sintonia): tratti del DNA pesati per rarità, generi, struttura e simboli. Calcolata una volta per coppia.
  const SIMC = new Map();
  // v208: per ogni gioco preparo UNA volta i suoi insiemi (tratti, generi, saga, tratti tuoi) e li riuso: prima si ricalcolavano
  // a ogni confronto (con l'ordine «Più adatti a te» erano decine di migliaia di confronti → 10+ secondi di blocco)
  const PREP = new Map();
  const prep = g=>{
    const ver = (window.rtTasteVer ? rtTasteVer() : 0);
    const c = PREP.get(g.id); if(c && c.ver === ver && c.n === g.name) return c;
    const ma = mechOf(g), ta = g.tags || [];
    let sk = ''; try{ sk = typeof sagaKeyOf === 'function' ? sagaKeyOf(g) : ''; }catch(e){}
    let mine = null; try{ const cu = window.rtLSro ? rtLSro(CUST, {}) : LSG(CUST, {}); if(cu && Object.keys(cu).length && window.rtFeats) mine = new Set(rtFeats(g).filter(x=> x.indexOf('mine:') === 0)); }catch(e){}
    const o = {ver, n: g.name, ma, am: new Set(ma), ta, at: new Set(ta), sk, mine};
    if(PREP.size > 20000) PREP.clear(); PREP.set(g.id, o); return o;
  };
  window.rtSimNorm = function(a, b){
    const key = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id; if(SIMC.has(key)) return SIMC.get(key);
    const W = idf(), wsum = (arr, p)=>{ let s = 0; for(const k of arr) s += (W[p + k] || 1); return s; };
    const A = prep(a), B = prep(b);
    let shm = 0, unm = 0; for(const k of A.ma){ const w = W['m:' + k] || 1; unm += w; if(B.am.has(k)) shm += w; } for(const k of B.ma) if(!A.am.has(k)) unm += (W['m:' + k] || 1);
    const fJ = unm ? shm / unm : 0;
    let sht = 0, unt = 0; for(const k of A.ta){ const w = W['t:' + k] || 1; unt += w; if(B.at.has(k)) sht += w; } for(const k of B.ta) if(!A.at.has(k)) unt += (W['t:' + k] || 1);
    const tJ = unt ? sht / unt : 0;
    const al = a.label || {}, bl = b.label || {}; let lc = 0, ln = 0;
    if(al.d && bl.d){ ln++; lc += Math.max(0, 1 - Math.abs(al.d - bl.d) / 2); } if(al.g && bl.g){ ln++; lc += Math.max(0, 1 - Math.abs(al.g - bl.g) / 2); } if(al.s && bl.s){ ln++; lc += Math.max(0, 1 - Math.abs(al.s - bl.s) / 2); }
    if(al.p && bl.p){ ln++; lc += al.p === bl.p ? 1 : 0; }
    const ae = a.enrich || {}, be = b.enrich || {};
    let v = fJ * .55 + tJ * .25 + (ln ? lc / ln : .5) * .2;
    if(ae.storyTag && ae.storyTag === be.storyTag) v += .06;
    if(ae.dopamine && be.dopamine) v += .04;
    if(A.sk && A.sk === B.sk) v += .12;
    if(A.mine && B.mine && A.mine.size){ let shared = 0; B.mine.forEach(x=>{ if(A.mine.has(x)) shared++; }); v += Math.min(.15, shared * .06); }   // i tuoi tratti scritti a parole
    v = Math.max(0, Math.min(1, v)); if(SIMC.size > 200000) SIMC.clear(); SIMC.set(key, v); return v;
  };
  const tierB = x=>{ try{ return `<span class="badge ${TIER_LABEL[x.tier]}">${x.tier}</span>`; }catch(e){ return ''; } };
  function similarHtml(g){
    let r; try{ r = similar(g); }catch(e){ return ''; }
    if(!r.other.length && !r.same.length) return '';
    const M = MECH();
    const chip = (o, isSaga)=>{ const x = isSaga ? o : o.x; let sy = null; try{ sy = window.rtSintonia && window.rtSintonia(x); }catch(e){}
      const why = isSaga ? 'stessa saga' : (o.shm.slice(0, 3).map(k=> M[k] ? M[k].ic : '').join('') + (o.shm.length ? ' ' + o.shm.slice(0, 2).map(k=> M[k] ? M[k].n.toLowerCase() : '').join(', ') : (o.primary ? 'stesso genere e struttura' : 'struttura simile')));
      return `<button class="similar-chip sim2" data-id="${x.id}">${tierB(x)}<span class="sim2-t"><b>${esc(x.name)}</b><small>${esc(why)}${sy ? ` · <span class="sim2-p${sy.approved ? ' a' : ''}">${sy.approved ? '😍 ' : ''}${sy.pct}% per te</span>` : ''}</small></span></button>`; };
    return `<div class="modal-section-title">🔁 Se ti è piaciuto questo, prova anche</div>
      ${r.other.length ? `<div class="similar-games sim2-list">${r.other.map(o=> chip(o)).join('')}</div>` : '<div class="dna-sub">Nessun gioco abbastanza simile nel tuo database: meglio niente che un consiglio sbagliato.</div>'}
      ${r.same.length ? `<div class="sim2-saga">📚 <b>Della stessa saga</b></div><div class="similar-games sim2-list">${r.same.map(x=> chip(x, true)).join('')}</div>` : ''}`;
  }
  // v200: la sezione dei simili costa (confronta tutti i giochi): la scheda si apre subito con uno spazio riservato,
  // e la riempio a animazione finita, quando il telefono è libero. Così l'apertura non scatta.
  const idleDo = (fn, t)=> (window.requestIdleCallback ? requestIdleCallback(fn, {timeout: t || 900}) : setTimeout(fn, 60));
  function similarLazy(g){
    if(!g || g.id == null) return '';
    const id = g.id;
    setTimeout(()=> warmAll(()=>{                                         // v214: prima i tratti pronti (a pezzetti), poi i simili: niente blocco unico
      const box = document.querySelector('.sim-lazy[data-sim="' + id + '"]'); if(!box) return;
      if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id !== id) return;
      const h = similarHtml(GAMES.find(x=> x.id === id) || g);
      if(!h){ box.remove(); return; }
      box.innerHTML = h; box.classList.add('in'); box.style.minHeight = '';
      box.querySelectorAll('.similar-chip').forEach(b=> b.addEventListener('click', ()=>{ const gg = GAMES.find(x=> x.id === parseInt(b.dataset.id, 10)); if(gg) openModal(gg); }));
    }), 520);
    return `<div class="sim-lazy" data-sim="${id}" style="min-height:180px"><div class="modal-section-title">🔁 Se ti è piaciuto questo, prova anche</div><div class="sim-skel"><i></i><i></i><i></i></div></div>`;
  }
  try{ if(typeof similarGamesHtml === 'function'){ window.similarGamesHtml = similarLazy; similarGamesHtml = similarLazy; window.rtSimilarHtmlNow = similarHtml; } }catch(e){}
  // preparo in anticipo, a pezzetti e quando il telefono è libero, i tratti di tutti i giochi: la prima scheda aperta non deve calcolarli
  // v214: lo stesso lavoro, ma riavviabile: quando arrivano i testi completi dei giochi (circa 7 s dopo l'avvio) i tratti si ricalcolano
  // qui, a pezzetti da pochi millesimi nei momenti liberi. Prima li ricalcolava tutti insieme il riquadro «Se ti è piaciuto…»
  // alla prima scheda aperta: un blocco unico di ~0,2 s proprio mentre la scheda si apriva.
  const WARM = {i: 0, run: false, wait: []};
  function warmAll(done){
    if(done) WARM.wait.push(done);
    if(WARM.run) return; WARM.run = true;
    const step = dl=>{
      try{
        if(window.__rtOpenUntil && performance.now() < window.__rtOpenUntil){ setTimeout(step, 150); return; }     // v218: non durante l'animazione di apertura
        if(typeof GAMES === 'undefined' || !GAMES.length){ WARM.run = false; setTimeout(()=> warmAll(), 1500); return; }
        const t0 = performance.now();
        while(WARM.i < GAMES.length && performance.now() - t0 < 7 && (!dl || !dl.timeRemaining || dl.timeRemaining() > 2)){ mechOf(GAMES[WARM.i]); WARM.i++; }
        if(WARM.i < GAMES.length){ (WARM.wait.length ? setTimeout(step, 0) : idleDo(step, 3000)); return; }
        idf(); try{ window.rtTasteModel && rtTasteModel(); }catch(e){}
      }catch(e){}
      WARM.run = false; const w = WARM.wait.splice(0); w.forEach(f=>{ try{ f(); }catch(e){} });
    };
    idleDo(step, 3000);
  }
  window.rtWarmTraits = warmAll;
  setTimeout(()=> warmAll(), 2500);
  window.addEventListener('rt-texts', ()=>{ WARM.i = 0; if(!WARM.run) setTimeout(()=> warmAll(), 300); });

  // ---------- una sola percentuale in tutta l'app ----------
  // il vecchio «DNA di compatibilità» (solo generi e voto) diventa la stessa % della Sintonia: ordinamento «Più adatti a te», righe, verdetto
  if(typeof window.dnaForGame === 'function'){
    const od = window.dnaForGame;
    window.dnaForGame = function(g, p){ const r = od.apply(this, arguments); try{ const s = window.rtSintonia && window.rtSintonia(g); if(s){ const o = r || {matchedTags: [], avoidTags: []}; o.pct = Math.max(3, Math.min(99, s.pct)); o.approved = s.approved; return o; } }catch(e){} return r; };
    try{ dnaForGame = window.dnaForGame; }catch(e){}
  }
  // ---------- aggancio alla scheda ----------
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){
      const out = prev.apply(this, arguments);
      try{
        const card = document.getElementById('modalCard');
        if(card && g && g.id != null){
          card.querySelectorAll('#dnaWhy').forEach(n=> n.remove());
          if(card.querySelector('#gsCard')) card.querySelectorAll('.dna-box').forEach(n=> n.remove());     // la sintonia sostituisce il vecchio riquadro (stessa %)
          const h = whyHtml(g), gs = card.querySelector('#gsCard'), story = [...card.querySelectorAll('.modal-section-title')].find(t=> /storia/i.test(t.textContent));
          if(h){ if(gs) gs.insertAdjacentHTML('afterend', h); else if(story) story.insertAdjacentHTML('beforebegin', h); else card.insertAdjacentHTML('beforeend', h); wire(card, g); }
        }
      }catch(e){ try{ console.error(e); }catch(x){} }
      return out;
    };
    try{ openModal = window.openModal; }catch(e){}
  }
})();
