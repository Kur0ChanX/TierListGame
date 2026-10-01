// ---- Il CERVELLO dei tuoi gusti (v203) ----
// Un solo posto che raccoglie TUTTO quello che dici di un gioco e impara nel tempo, come un cervello che cresce:
//  · la barra di icone sotto la locandina: ⭐ preferito · 😍 nel cuore · 👍 mi piace · 👎 non mi piace · 🚫 non è il mio genere
//    · 💔 mi ha deluso · 🔁 lo rigiocherei · e lo stato (in corso, giocato, da giocare, mollato) — un solo posto, niente doppioni;
//  · le tue valutazioni a 6 voci (da 1 a 10, a mezzi punti), diverse per ogni famiglia di giochi;
//  · tutto entra nel modello dei gusti (extras3.js → Sintonia, giochi simili, consigli) con questi principi:
//    - le cose recenti pesano un po' di più (i gusti cambiano);
//    - dalle valutazioni capisce QUALI voci contano davvero per te (es. «quando la storia è alta, il tuo voto sale sempre»);
//    - «non è il mio genere» abbassa tutto il genere, «mi ha deluso» abbassa quel gioco senza punire il genere;
//    - ogni giorno salva una «fotografia» dei gusti, così può dirti cosa è cambiato.
// Chiavi (si sincronizzano come le altre): jrpg_react {id:{k:1, t}}, jrpg_rate {id:{f, v:{voce: 1..10}, t}}, jrpg_brain_hist [{t, w}].
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.cervello) return;
  const U = window.XUI || {};
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const toast = (t, ms)=>{ try{ (U.toast || window.showToast)(t, ms || 1800); }catch(e){} };
  const RK = 'jrpg_react', RTK = 'jrpg_rate', HK = 'jrpg_brain_hist';
  const DAY = 864e5;

  // ---------------------------------------------------------------- reazioni
  const REACT = [
    {k: 'like',     ic: '👍', n: 'Mi piace',            w: 1.4, off: ['dislike', 'notgenre', 'letdown']},
    {k: 'dislike',  ic: '👎', n: 'Non mi piace',        w: -1.6, off: ['like', 'replay']},
    {k: 'notgenre', ic: '🚫', n: 'Non è il mio genere', w: -1.1, off: []},
    {k: 'letdown',  ic: '💔', n: 'Mi ha deluso',        w: -1.0, off: ['replay']},
    {k: 'replay',   ic: '🔁', n: 'Lo rigiocherei',      w: 1.5, off: ['dislike', 'letdown']}
  ];
  const RMAP = Object.fromEntries(REACT.map(r=> [r.k, r]));
  const reacts = ()=> LSG(RK, {}) || {};
  // v208: lettura «solo per guardare» (niente JSON.parse se il testo non è cambiato): il modello la chiede per ogni gioco
  const RO = (k, d)=> window.rtLSro ? (rtLSro(k, d) || d) : (LSG(k, d) || d);
  const reactOf = g=> (g && reacts()[g.id]) || {};
  function setReact(g, k){
    const all = reacts(), cur = Object.assign({}, all[g.id] || {}), on = !cur[k];
    if(on){ cur[k] = 1; (RMAP[k].off || []).forEach(x=> delete cur[x]); } else delete cur[k];
    cur.t = Date.now();
    if(Object.keys(cur).some(x=> x !== 't')) all[g.id] = cur; else delete all[g.id];
    LSS(RK, all); changed(); return on;
  }

  // ---------------------------------------------------------------- valutazioni a 6 voci per famiglia
  // dim = cosa misura davvero la voce (uguale tra famiglie diverse), così il cervello impara anche da generi diversi
  const FAM = {
    rpg:    {n: 'Giochi di ruolo', ic: '🗡️', v: [
      ['combat', 'Combattimento e crescita', 'COMBAT', 'sistema di lotta, build, abilità, quanto è bello far crescere il party'],
      ['story', 'Storia e personaggi', 'STORY', 'trama, dialoghi, personaggi, quanto ti ha coinvolto'],
      ['music', 'Musica e sonoro', 'MUSIC', 'colonna sonora, temi dei boss, doppiaggio'],
      ['explore', 'Esplorazione e dungeon', 'EXPLORE', 'mappe, dungeon, segreti, voglia di scoprire'],
      ['world', 'Mondo e stile visivo', 'ART', 'ambientazione, direzione artistica, character design'],
      ['pace', 'Ritmo e durata', 'PACE', 'scorre bene? niente parti noiose o allungate']]},
    action: {n: 'Action e picchiaduro', ic: '⚔️', v: [
      ['combat', 'Combattimento e impatto dei colpi', 'COMBAT', 'combo, sensazione dei colpi, varietà delle mosse'],
      ['control', 'Controlli e reattività', 'CONTROL', 'risposta immediata ai tasti, precisione'],
      ['level', 'Livelli e boss', 'LEVEL', 'struttura dei livelli, nemici, boss fight'],
      ['art', 'Stile e animazioni', 'ART', 'spettacolarità, fluidità dei movimenti'],
      ['music', 'Musica e audio', 'MUSIC', 'musiche, impatto sonoro degli attacchi'],
      ['challenge', 'Sfida e rigiocabilità', 'CHALLENGE', 'difficoltà giusta, voglia di rigiocarlo']]},
    adv:    {n: 'Avventura e horror', ic: '🕯️', v: [
      ['atmo', 'Atmosfera e tensione', 'ATMO', 'suoni, silenzi, ansia o meraviglia'],
      ['story', 'Storia e mistero', 'STORY', 'racconto, colpi di scena, documenti e lore'],
      ['explore', 'Esplorazione e mappa', 'EXPLORE', 'scorciatoie, segreti, enigmi ambientali'],
      ['play', 'Gameplay e risorse', 'COMBAT', 'combattimento, inventario, gestione di cure e munizioni'],
      ['art', 'Grafica e direzione artistica', 'ART', 'luci, ambienti, creature'],
      ['pace', 'Ritmo', 'PACE', 'alternanza giusta tra calma, tensione e azione']]},
    shooter: {n: 'Sparatutto', ic: '🎯', v: [
      ['gun', 'Feeling delle armi', 'COMBAT', 'rinculo, varietà, soddisfazione nello sparare'],
      ['level', 'Mappe e livelli', 'LEVEL', 'coperture, verticalità, varietà'],
      ['tech', 'Fluidità e tecnica', 'TECH', 'frame rate, pulizia, stabilità'],
      ['music', 'Audio', 'MUSIC', 'suono delle armi, audio posizionale, musiche'],
      ['content', 'Contenuti e rigiocabilità', 'CONTENT', 'modalità, bilanciamento, longevità'],
      ['story', 'Campagna e storia', 'STORY', 'quanto ti ha preso la campagna']]},
    sport:  {n: 'Sport, guida e simulazione', ic: '🏎️', v: [
      ['control', 'Controlli e fisica', 'CONTROL', 'risposta dei comandi, realismo o divertimento della guida'],
      ['content', 'Modalità e contenuti', 'CONTENT', 'carriera, squadre, veicoli, tracciati'],
      ['tech', 'Fluidità e tecnica', 'TECH', 'frame rate, caricamenti, stabilità'],
      ['art', 'Presentazione e grafica', 'ART', 'modelli, meteo, replay, regia'],
      ['music', 'Audio e atmosfera', 'MUSIC', 'motori, stadio, telecronaca, musiche'],
      ['depth', 'Profondità e longevità', 'DEPTH', 'quanto c\'è da imparare e da fare']]},
    plat:   {n: 'Platform e metroidvania', ic: '🦘', v: [
      ['control', 'Movimento e salto', 'CONTROL', 'fisica del salto, controllo in aria, nuove abilità'],
      ['level', 'Livelli e segreti', 'LEVEL', 'disposizione degli ostacoli, scorciatoie, segreti'],
      ['art', 'Stile visivo', 'ART', 'personalità grafica, leggibilità'],
      ['music', 'Musica', 'MUSIC', 'colonna sonora orecchiabile'],
      ['explore', 'Esplorazione', 'EXPLORE', 'voglia di tornare indietro con abilità nuove'],
      ['challenge', 'Sfida e precisione', 'CHALLENGE', 'difficoltà giusta, morti «giuste»']]},
    strat:  {n: 'Strategici e gestionali', ic: '♟️', v: [
      ['depth', 'Profondità e bilanciamento', 'DEPTH', 'scelte che contano, equilibrio, intelligenza avversaria'],
      ['control', 'Interfaccia e comandi', 'CONTROL', 'menu chiari, informazioni leggibili'],
      ['level', 'Mappe e scenari', 'LEVEL', 'varietà dei terreni, missioni'],
      ['prog', 'Progressione ed economia', 'PROG', 'crescita, risorse, ricerca'],
      ['art', 'Grafica e leggibilità', 'ART', 'si capisce cosa succede anche nel caos'],
      ['content', 'Rigiocabilità', 'CONTENT', 'voglia di un\'altra partita']]},
    puzzle: {n: 'Puzzle, carte e casual', ic: '🧩', v: [
      ['ideas', 'Idee e regole', 'IDEAS', 'originalità, eleganza, «ah, che genio!»'],
      ['satis', 'Soddisfazione', 'CHALLENGE', 'rapporto tra frustrazione e premio'],
      ['art', 'Stile visivo', 'ART', 'pulizia, personalità'],
      ['music', 'Musica', 'MUSIC', 'musiche e suoni delle azioni'],
      ['pace', 'Curva di difficoltà', 'PACE', 'impari piano piano, niente muri'],
      ['content', 'Varietà', 'CONTENT', 'quante idee diverse, quanto dura']]}
  };
  // genere principale → famiglia (il catalogo è soprattutto di giochi di ruolo: nel dubbio «rpg»)
  const TAGF = {FIGHT: 'action', BEAT: 'action', SPORTFIGHT: 'action', SHMUP: 'action', HNS: 'action',
    ADV: 'adv', ACTADV: 'adv', HOR: 'adv', STEALTH: 'adv', OPENW: 'adv', WALK: 'adv', SURV: 'adv',
    FPS: 'shooter', TPS: 'shooter', BR: 'shooter',
    SPORT: 'sport', RACE: 'sport', SIMVEH: 'sport', SIMLIFE: 'sport',
    PLAT: 'plat', METR: 'plat',
    RTS: 'strat', TBS4X: 'strat', TOWERDEF: 'strat', MOBA: 'strat', CITY: 'strat', ECOSIM: 'strat',
    PUZ: 'puzzle', PARTY: 'puzzle', TRIVIA: 'puzzle', RHY: 'puzzle'};
  const RPGT = new Set(['TAC', 'ACT', 'DUN', 'TUR', 'MON', 'WAR', 'CROSS', 'MECH', 'SOUL', 'REMAKE', 'WRPG', 'JRPG', 'MUD', 'GACHA', 'MMO', 'ROG', 'VN', 'LIFE', 'CARD']);
  function famOf(g){
    const tg = (g && g.tags) || [];
    if(tg[0] && TAGF[tg[0]]) return TAGF[tg[0]];
    if(tg[0] && RPGT.has(tg[0])) return 'rpg';
    for(const t of tg) if(TAGF[t]) return TAGF[t];
    return 'rpg';
  }
  // dimensione → tratti del gioco collegati (per far contare le voci nella Sintonia)
  const DIMF = {STORY: ['mech:STORY', 'mech:CHAR', 'storia:forte'], COMBAT: ['mech:COMBAT', 'mech:BUILD', 'mech:TACT'], MUSIC: ['mech:MUSIC'], EXPLORE: ['mech:EXPLO', 'mech:WORLD'],
    ART: ['mech:ATMO', 'mech:WORLD'], ATMO: ['mech:ATMO'], CHALLENGE: ['mech:CHALL', 'diff:alta'], CONTROL: ['mech:FEEL'], LEVEL: ['mech:EXPLO'], CONTENT: ['mech:ENDGAME', 'mech:COLL'],
    DEPTH: ['mech:BUILD', 'mech:TACT'], PROG: ['mech:POWER'], IDEAS: ['mech:PUZZ'], PACE: [], TECH: []};
  const DIMN = {STORY: 'la storia', COMBAT: 'il combattimento', MUSIC: 'la musica', EXPLORE: 'l\'esplorazione', ART: 'lo stile visivo', ATMO: 'l\'atmosfera', CHALLENGE: 'la sfida',
    CONTROL: 'i controlli', LEVEL: 'i livelli', CONTENT: 'i contenuti', DEPTH: 'la profondità', PROG: 'la progressione', IDEAS: 'le idee', PACE: 'il ritmo', TECH: 'la tecnica'};
  const rates = ()=> LSG(RTK, {}) || {};
  const rateOf = g=> (g && rates()[g.id]) || null;
  const avgOf = r=>{ const v = r && r.v ? Object.values(r.v).filter(x=> typeof x === 'number') : []; return v.length ? v.reduce((a, b)=> a + b, 0) / v.length : null; };
  function setRate(g, key, val){
    const all = rates(), r = all[g.id] || {f: famOf(g), v: {}};
    if(val == null) delete r.v[key]; else r.v[key] = Math.max(1, Math.min(10, Math.round(val * 2) / 2));
    r.t = Date.now();
    if(Object.keys(r.v).length) all[g.id] = r; else delete all[g.id];
    LSS(RTK, all); changed();
  }
  // il voto complessivo di un gioco per te: il tuo voto personale se c'è, altrimenti la media delle voci
  const myVote = id=>{ const mv = (LSG('jrpg_myvote', {}) || {})[id]; return mv != null ? +mv : null; };

  // ---------------------------------------------------------------- quanto conta ogni voce per te
  // correlazione tra la voce e il tuo voto complessivo, su tutti i giochi valutati (servono almeno 3 giochi con quella voce)
  let IMPc = null, IMPkey = '';
  function importance(){
    let key = ''; try{ key = (localStorage.getItem(RTK) || '').length + ':' + (localStorage.getItem('jrpg_myvote') || '').length; }catch(e){}
    if(IMPc && IMPkey === key) return IMPc;
    const all = RO(RTK, {});
    if(IMPc && IMPkey === key) return IMPc;
    const pairs = {};                     // dim -> [[voce, voto]]
    const level = {};                     // dim -> scarti dalla media del gioco (cosa valuti più alto)
    Object.keys(all).forEach(id=>{
      const r = all[id], fam = FAM[r.f] || FAM.rpg, avg = avgOf(r); if(avg == null) return;
      const O = myVote(+id) != null ? myVote(+id) : avg;
      fam.v.forEach(([k, , dim])=>{ const v = r.v[k]; if(typeof v !== 'number') return; (pairs[dim] = pairs[dim] || []).push([v, O]); (level[dim] = level[dim] || []).push(v - avg); });
    });
    const out = {};
    Object.keys(pairs).forEach(d=>{
      const p = pairs[d], n = p.length; if(n < 3) { out[d] = {n, imp: null, lvl: level[d].reduce((a, b)=> a + b, 0) / n}; return; }
      const mx = p.reduce((a, x)=> a + x[0], 0) / n, my = p.reduce((a, x)=> a + x[1], 0) / n;
      let sxy = 0, sxx = 0, syy = 0; p.forEach(([x, y])=>{ sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
      const corr = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
      out[d] = {n, imp: corr * Math.min(1, n / 8), lvl: level[d].reduce((a, b)=> a + b, 0) / n};     // con pochi giochi la fiducia è più bassa
    });
    IMPc = out; IMPkey = key; return out;
  }

  // ---------------------------------------------------------------- aggancio al modello dei gusti (extras3.js)
  // le cose recenti pesano di più: oggi ×1, dopo un anno ×0.8, dopo due anni ×0.65 (mai sotto 0.6)
  const recency = t=> t ? Math.max(.6, 1 - (Date.now() - t) / DAY / 1100) : 1;
  window.rtBrain = {
    // peso in più di un gioco (si somma a preferiti, voto, stato, tier…)
    sigFor(g, hasMyVote){
      let w = 0;
      const r = RO(RK, {})[g.id];
      if(r){ const rc = recency(r.t); REACT.forEach(x=>{ if(r[x.k]) w += x.w * rc; }); }
      const rt = RO(RTK, {})[g.id];
      if(rt && !hasMyVote){ const a = avgOf(rt); if(a != null) w += (a - 6) * .5 * recency(rt.t); }
      return w;
    },
    // ritocchi al modello: generi che non sono per te, voci che contano, voci alte o basse su un gioco
    adjust(wts, cnt){
      const R = RO(RK, {});
      const ng = {}; Object.keys(R).forEach(id=>{ if(!R[id].notgenre) return; const g = GAMES.find(x=> x.id === +id); const t = g && (g.tags || [])[0]; if(t) ng[t] = (ng[t] || 0) + 1; });
      Object.keys(ng).forEach(t=>{ const k = 'tag:' + t; wts[k] = (wts[k] || 0) - Math.min(1.5, .55 * ng[t]); cnt[k] = Math.max(cnt[k] || 0, 2); });
      const imp = importance();
      Object.keys(imp).forEach(d=>{ const x = imp[d]; if(x.imp == null || Math.abs(x.imp) < .2) return; (DIMF[d] || []).forEach(k=>{ wts[k] = (wts[k] || 0) + x.imp * .7; cnt[k] = Math.max(cnt[k] || 0, 2); }); });
      const all = RO(RTK, {});
      Object.keys(all).forEach(id=>{ const r = all[id], fam = FAM[r.f] || FAM.rpg, rc = recency(r.t);
        fam.v.forEach(([k, , dim])=>{ const v = r.v[k]; if(typeof v !== 'number') return; const s = v >= 8.5 ? .25 : v <= 4 ? -.25 : 0; if(!s) return; (DIMF[dim] || []).forEach(f=>{ wts[f] = (wts[f] || 0) + s * rc; cnt[f] = Math.max(cnt[f] || 0, 2); }); }); });
    },
    key(){ let a = '', b = ''; try{ a = localStorage.getItem(RK) || ''; b = localStorage.getItem(RTK) || ''; }catch(e){} return a.length + '|' + b.length; },
    reactOf, rateOf, famOf, FAM, importance
  };
  // quando cambia qualcosa: ricalcolo i gusti e aggiorno la Sintonia della scheda aperta, senza ridisegnare tutto
  function changed(){
    try{ if(window.rtTasteModel) rtTasteModel(); }catch(e){}
    try{
      const card = document.getElementById('modalCard'), g = typeof currentModalGame !== 'undefined' ? currentModalGame : null;
      const gs = card && card.querySelector('#gsCard'); if(gs && g && window.rtRadar){ const h = rtRadar(g); if(h) gs.outerHTML = h; }
    }catch(e){}
    try{ if(typeof renderWhenIdle === 'function') renderWhenIdle({list: true}); }catch(e){}
    snapshotSoon();
  }

  // ---------------------------------------------------------------- fotografie dei gusti (per dire cosa è cambiato)
  let snapT = 0;
  function snapshotSoon(){ clearTimeout(snapT); snapT = setTimeout(snapshot, 4000); }
  function snapshot(){
    try{
      const tm = window.rtTasteModel && rtTasteModel(); if(!tm) return;
      const h = LSG(HK, []) || [], today = new Date().toISOString().slice(0, 10);
      const w = {}; Object.entries(tm.wts).filter(([k])=> tm.cnt[k] >= 2 && k.indexOf('epoca') !== 0).sort((a, b)=> Math.abs(b[1]) - Math.abs(a[1])).slice(0, 40).forEach(([k, v])=> w[k] = Math.round(v * 100) / 100);
      const last = h[h.length - 1];
      if(last && last.d === today) last.w = w; else h.push({d: today, t: Date.now(), w});
      while(h.length > 60) h.shift();
      LSS(HK, h);
    }catch(e){}
  }
  setTimeout(()=>{ try{ const h = LSG(HK, []) || []; if(!h.length || h[h.length - 1].d !== new Date().toISOString().slice(0, 10)) snapshot(); }catch(e){} }, 15000);

  // ---------------------------------------------------------------- barra sotto la locandina
  const isFav = g=>{ try{ return FAVS.has(g.id); }catch(e){ return false; } };
  const inHeart = g=>{ try{ return (window.rtTopList ? rtTopList() : []).includes(g.id); }catch(e){ return false; } };
  const stOf = g=>{ try{ return STATUSES[g.id] || ''; }catch(e){ return ''; } };
  const ST = [['playing', '▶️', 'In corso'], ['played', '✅', 'Giocato'], ['backlog', '📌', 'Da giocare'], ['dropped', '⛔', 'Mollato']];
  function barHtml(g){
    const r = reactOf(g), st = stOf(g);
    const b = (k, ic, n, on)=> `<button type="button" class="rb-i${on ? ' on' : ''}" data-rb="${k}" aria-pressed="${on ? 'true' : 'false'}" title="${esc(n)}"><span class="rb-ic">${ic}</span><small>${esc(n)}</small></button>`;
    return `<div class="rb" id="rtBar">
      <div class="rb-row">
        ${b('fav', '⭐', 'Preferito', isFav(g))}
        ${b('heart', '<img src="icons/top-procione-64.webp" srcset="icons/top-procione-64.webp 1x, icons/top-procione-128.webp 2x" alt="" width="28" height="28" style="border-radius:50%">', 'Nel cuore', inHeart(g))}
        ${REACT.map(x=> b(x.k, x.ic, x.n, !!r[x.k])).join('')}
      </div>
      <div class="rb-st">${ST.map(([k, ic, n])=> `<button type="button" class="rb-s${st === k ? ' on' : ''}" data-rs="${k}"><span>${ic}</span>${n}</button>`).join('')}</div>
    </div>`;
  }
  function pop(el){ try{ el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.28)'}, {transform: 'scale(1)'}], {duration: 320, easing: 'cubic-bezier(.32,.72,0,1)'}); }catch(e){} try{ window.rtHaptic && rtHaptic('soft'); }catch(e){} }
  // aggiorno la barra «sul posto» (senza rifare l'HTML): niente salti di pagina
  function refreshBar(g){
    const bar = document.getElementById('rtBar'); if(!bar) return;
    const r = reactOf(g), st = stOf(g), on = {fav: isFav(g), heart: inHeart(g)}; REACT.forEach(x=> on[x.k] = !!r[x.k]);
    bar.querySelectorAll('[data-rb]').forEach(b=>{ const o = !!on[b.dataset.rb]; b.classList.toggle('on', o); b.setAttribute('aria-pressed', o ? 'true' : 'false'); });
    bar.querySelectorAll('[data-rs]').forEach(b=> b.classList.toggle('on', st === b.dataset.rs));
  }
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('#rtBar [data-rb], #rtBar [data-rs]'); if(!b) return;
    const g = typeof currentModalGame !== 'undefined' ? currentModalGame : null; if(!g) return;
    e.preventDefault(); e.stopPropagation();
    if(b.dataset.rs){
      try{ setStatus(g.id, b.dataset.rs); if(typeof renderMetrics === 'function') renderMetrics(); }catch(x){}
      const on = stOf(g) === b.dataset.rs; refreshBar(g); changed();
      toast(on ? ST.find(s=> s[0] === b.dataset.rs).slice(1).join(' ') : 'Stato tolto', 1400);
    } else {
      const k = b.dataset.rb; let on;
      if(k === 'fav'){ try{ if(FAVS.has(g.id)) FAVS.delete(g.id); else FAVS.add(g.id); saveFavs(); if(typeof renderMetrics === 'function') renderMetrics(); }catch(x){} on = isFav(g); }
      else if(k === 'heart'){
        const t = window.rtTopList ? rtTopList() : [], i = t.indexOf(g.id);
        if(i >= 0) t.splice(i, 1); else t.push(g.id);
        try{ localStorage.setItem('jrpg_top', JSON.stringify(t)); }catch(x){}
        on = i < 0;
        if(on){ const all = reacts(), cur = all[g.id] || {}; ['dislike', 'notgenre', 'letdown'].forEach(x=> delete cur[x]); cur.like = 1; cur.t = Date.now(); all[g.id] = cur; LSS(RK, all); }
      }
      else on = setReact(g, k);
      if(k === 'fav' || k === 'heart') changed();
      refreshBar(g);
      const nb = document.querySelector('#rtBar [data-rb="' + k + '"]'); if(nb && on) pop(nb);
      const names = {fav: 'Preferito', heart: 'Nel cuore 😍 (tra i tuoi top)', like: 'Mi piace', dislike: 'Non mi piace', notgenre: 'Non è il mio genere: lo terrò a mente per tutto il genere', letdown: 'Ti ha deluso', replay: 'Lo rigiocheresti'};
      toast(on ? '✓ ' + names[k] + ' — il cervello ha imparato' : 'Tolto: ' + names[k].split(' —')[0].split(':')[0], 1800);
    }
  }, true);

  // ---------------------------------------------------------------- valutazioni nella scheda (v205: tasti 1–10 grandi + «Fine», niente cursori)
  // Le modifiche restano in una «bozza» finché non premi «✅ Fine»: così sai che sono al sicuro. Se chiudi la scheda senza premere, le salvo io (non si perde niente).
  let DRAFT = null;                  // {id, f, v:{voce:valore}, dirty}
  const draftOf = g=>{
    if(DRAFT && DRAFT.id === g.id) return DRAFT;
    const r = rateOf(g); DRAFT = {id: g.id, f: (r && r.f) || famOf(g), v: Object.assign({}, (r && r.v) || {}), dirty: false}; return DRAFT;
  };
  const dAvg = d=>{ const v = Object.values(d.v).filter(x=> typeof x === 'number'); return v.length ? v.reduce((a, b)=> a + b, 0) / v.length : null; };
  const fmt = v=> String(v).replace('.', ',');
  function rowHtml(k, label, help, v){
    const has = typeof v === 'number', base = has ? Math.floor(v) : 0, half = has && v % 1 !== 0;
    return `<div class="rr${has ? ' set' : ''}" data-k="${k}">
      <div class="rr-h"><b>${esc(label)}</b><span class="rr-v">${has ? fmt(v) : '—'}</span></div>
      <div class="rr-n" role="radiogroup" aria-label="${esc(label)}">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n=> `<button type="button" role="radio" data-n="${n}" aria-checked="${has && base === n ? 'true' : 'false'}" class="${has && base === n ? 'on' : (has && n < base ? 'lo' : '')}">${n}</button>`).join('')}</div>
      <div class="rr-f"><small>${esc(help)}</small><span class="rr-act"><button type="button" class="rr-half${half ? ' on' : ''}"${has && base < 10 ? '' : ' disabled'} title="Aggiungi mezzo punto">+½</button><button type="button" class="rr-x"${has ? '' : ' disabled'} title="Togli il voto">✕</button></span></div>
    </div>`;
  }
  function rateHtml(g, open){
    const d = draftOf(g), fam = FAM[d.f] || FAM.rpg, n = Object.keys(d.v).length, avg = dAvg(d);
    const famSel = `<select class="rr-fam" aria-label="Famiglia">${Object.keys(FAM).map(k=> `<option value="${k}"${k === d.f ? ' selected' : ''}>${FAM[k].ic} ${FAM[k].n}</option>`).join('')}</select>`;
    return `<details class="rr-card" id="rtRate"${open ? ' open' : ''}><summary>🎚️ <b>Le tue valutazioni</b> <span class="rr-sum">${sumText(n, avg)}</span></summary>
      <div class="rr-top"><small>Voci per</small>${famSel}</div>
      ${fam.v.map(([k, label, , help])=> rowHtml(k, label, help, d.v[k])).join('')}
      <div class="rr-learn" id="rrLearn">${learnLine()}</div>
      <div class="rr-end"><span class="rr-state" id="rrState">${savedText(d)}</span><button type="button" class="btn primary rr-done" id="rrDone"${d.dirty ? '' : ' disabled'}>✅ Fine</button></div>
    </details>`;
  }
  const sumText = (n, avg)=> n ? `${n}/6 voci · media <b>${fmt(avg.toFixed(1))}</b>` : '6 voci da 1 a 10: aiutano il cervello a capirti';
  const savedText = d=> d.dirty ? '✏️ Non ancora salvato: premi «Fine»' : (Object.keys(d.v).length ? '🔒 Salvato' : '');
  function learnLine(){
    const imp = importance(), top = Object.entries(imp).filter(([, x])=> x.imp != null && x.imp > .25).sort((a, b)=> b[1].imp - a[1].imp).slice(0, 2);
    if(top.length) return `🧠 Ho capito che per te conta di più <b>${top.map(([d])=> DIMN[d] || d).join('</b> e <b>')}</b>: è lì che si decide il tuo voto.`;
    const nRated = Object.keys(rates()).length;
    return nRated < 3 ? `🧠 Valuta almeno 3 giochi e capirò quali voci contano di più per te (ora: ${nRated}).` : '🧠 Sto ancora capendo quali voci contano di più per te: continua a valutare.';
  }
  function paintDraft(){
    const box = document.getElementById('rtRate'); if(!box || !DRAFT) return;
    const d = DRAFT, n = Object.keys(d.v).length, avg = dAvg(d);
    box.querySelector('.rr-sum').innerHTML = sumText(n, avg);
    box.querySelectorAll('.rr').forEach(row=>{
      const v = d.v[row.dataset.k], has = typeof v === 'number', base = has ? Math.floor(v) : 0, half = has && v % 1 !== 0;
      row.classList.toggle('set', has); row.querySelector('.rr-v').textContent = has ? fmt(v) : '—';
      row.querySelectorAll('[data-n]').forEach(b=>{ const k = +b.dataset.n, on = has && base === k; b.classList.toggle('on', on); b.classList.toggle('lo', has && k < base); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      const h = row.querySelector('.rr-half'); h.classList.toggle('on', half); h.disabled = !(has && base < 10);
      row.querySelector('.rr-x').disabled = !has;
    });
    box.querySelector('#rrState').textContent = savedText(d);
    const done = box.querySelector('#rrDone'); done.disabled = !d.dirty;
  }
  function commitDraft(silent){
    const d = DRAFT; if(!d || !d.dirty) return;
    const g = (typeof GAMES !== 'undefined' && GAMES.find(x=> x.id === d.id)); if(!g){ DRAFT = null; return; }
    const all = rates();
    if(Object.keys(d.v).length) all[g.id] = {f: d.f, v: Object.assign({}, d.v), t: Date.now()}; else delete all[g.id];
    LSS(RTK, all); d.dirty = false; changed();
    const box = document.getElementById('rtRate');
    if(box && currentModalGame && currentModalGame.id === g.id){ paintDraft(); const l = box.querySelector('#rrLearn'); if(l) l.innerHTML = learnLine(); }
    if(!silent) toast('✅ Valutazioni salvate — il cervello ha imparato', 2200);
  }
  document.addEventListener('click', e=>{
    const t = e.target; if(!t.closest) return;
    const box = t.closest('#rtRate'); if(!box) return;
    const g = currentModalGame; if(!g) return;
    const d = draftOf(g);
    const nb = t.closest('.rr-n [data-n]');
    if(nb){ const k = nb.closest('.rr').dataset.k; d.v[k] = +nb.dataset.n; d.dirty = true; paintDraft(); try{ window.rtHaptic && rtHaptic('tick'); }catch(x){} return; }
    const hb = t.closest('.rr-half');
    if(hb && !hb.disabled){ const k = hb.closest('.rr').dataset.k, cur = d.v[k]; if(typeof cur === 'number'){ d.v[k] = cur % 1 ? Math.floor(cur) : Math.min(10, cur + .5); d.dirty = true; paintDraft(); } return; }
    const xb = t.closest('.rr-x');
    if(xb && !xb.disabled){ delete d.v[xb.closest('.rr').dataset.k]; d.dirty = true; paintDraft(); return; }
    if(t.closest('#rrDone')){ commitDraft(false); try{ box.open = false; }catch(x){} return; }
  });
  document.addEventListener('change', e=>{
    const sel = e.target.closest && e.target.closest('#rtRate .rr-fam'); if(!sel) return;
    const g = currentModalGame; if(!g) return; const d = draftOf(g);
    d.f = sel.value; d.v = {}; d.dirty = true;
    const box = document.getElementById('rtRate'), wasOpen = box.open; box.outerHTML = rateHtml(g, wasOpen);
  });
  // se chiudi la scheda con valutazioni non salvate, le salvo io
  try{ const bd = document.getElementById('modalBackdrop'); if(bd) new MutationObserver(()=>{ if(!bd.classList.contains('show')) commitDraft(false); }).observe(bd, {attributes: true, attributeFilter: ['class']}); }catch(e){}

  // ---------------------------------------------------------------- «🧠 Cosa ho imparato di te»
  const FL = k=> { try{ return window.rtFLAB ? rtFLAB(k) : k; }catch(e){ return k; } };
  const capF = s=> s ? s[0].toUpperCase() + s.slice(1) : s;
  function openBrain(){
    if(!U.sheet) return;
    const tm = window.rtTasteModel && rtTasteModel(); if(!tm){ toast('Il cervello sta ancora caricando'); return; }
    const R = reacts(), RT = rates(), nR = Object.keys(R).length, nRt = Object.keys(RT).length;
    let nFav = 0, nSt = 0; try{ nFav = FAVS.size; nSt = Object.keys(STATUSES).length; }catch(e){}
    const nTop = (window.rtTopList ? rtTopList() : []).length, nMV = Object.keys(LSG('jrpg_myvote', {}) || {}).length, nDna = Object.keys(LSG('jrpg_dna_why', {}) || {}).length + Object.keys(LSG('jrpg_dna_custom', {}) || {}).length;
    // quanto ti conosco: cresce con quello che mi dici (più peso a valutazioni, voti e cuori)
    const pts = nFav * 1.5 + nTop * 3 + nMV * 2.5 + nRt * 4 + nR * 1.5 + nSt * .8 + nDna * 2;
    const know = Math.min(100, Math.round(100 * (1 - Math.exp(-pts / 160))));
    const stage = know < 20 ? ['🥚', 'Appena nato', 'Sto iniziando a conoscerti'] : know < 45 ? ['🐣', 'In crescita', 'Ho capito le basi dei tuoi gusti'] : know < 70 ? ['🦝', 'Ti conosco bene', 'So cosa ti piace e cosa eviti'] : know < 90 ? ['🧠', 'Esperto di te', 'Capisco anche le sfumature'] : ['🌟', 'Gemello digitale', 'Ti conosco come un amico di vecchia data'];
    const SAME = {'storia:forte': 'mech:STORY'};      // due modi di dire la stessa cosa: ne mostro uno
    const ent = Object.entries(tm.wts).filter(([k])=> tm.cnt[k] >= 2 && k.indexOf('epoca') !== 0 && !(SAME[k] && tm.cnt[SAME[k]] >= 2));
    const pos = ent.filter(([, w])=> w > .15).sort((a, b)=> b[1] - a[1]).slice(0, 10), neg = ent.filter(([, w])=> w < -.15).sort((a, b)=> a[1] - b[1]).slice(0, 6);
    const mx = Math.max(.01, ...pos.map(x=> x[1]), ...neg.map(x=> -x[1]));
    const bar = ([k, w])=> `<div class="br-row"><span>${esc(capF(String(FL(k))))}</span><i style="--p:${Math.round(Math.abs(w) / mx * 100)}%" class="${w < 0 ? 'neg' : ''}"></i></div>`;
    // cosa è cambiato rispetto a ~7 giorni fa
    const h = LSG(HK, []) || [], old = h.filter(x=> Date.now() - x.t >= 6 * DAY).pop() || (h.length > 1 ? h[0] : null);
    let chg = '';
    if(old){
      const now = Object.fromEntries(ent), ks = new Set(Object.keys(old.w).concat(Object.keys(now)));
      const d = [...ks].map(k=> [k, (now[k] || 0) - (old.w[k] || 0)]).filter(([, x])=> Math.abs(x) >= .15).sort((a, b)=> Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6);
      chg = d.length ? d.map(([k, x])=> `<span class="br-chg ${x > 0 ? 'up' : 'down'}">${x > 0 ? '▲' : '▼'} ${esc(capF(String(FL(k))))}</span>`).join('') : '<small>Nessun cambiamento importante: i tuoi gusti sono stabili.</small>';
      chg = `<div class="br-h">📈 Cosa è cambiato dal ${esc(new Date(old.t).toLocaleDateString('it-IT', {day: 'numeric', month: 'long'}))}</div><div class="br-chgs">${chg}</div>`;
    }
    const imp = importance(), impL = Object.entries(imp).filter(([, x])=> x.imp != null).sort((a, b)=> b[1].imp - a[1].imp);
    const impHtml = impL.length ? `<div class="br-h">🎚️ Cosa conta di più quando dai un voto</div>${impL.slice(0, 6).map(([d, x])=> `<div class="br-row"><span>${esc(capF(DIMN[d] || d))} <small>(${x.n} giochi)</small></span><i style="--p:${Math.round(Math.max(0, x.imp) * 100)}%"></i></div>`).join('')}` : `<div class="br-h">🎚️ Cosa conta di più quando dai un voto</div><small>Valuta almeno 3 giochi con le 6 voci (nella scheda, sotto la locandina) e te lo dico.</small>`;
    // giochi da valutare per aiutarmi: quelli che hai giocato/amato ma non hai ancora valutato
    let todo = [];
    try{ todo = GAMES.filter(g=> !RT[g.id] && (FAVS.has(g.id) || STATUSES[g.id] === 'played' || (window.rtTopList && rtTopList().includes(g.id)))).slice(0, 6); }catch(e){}
    const body = U.sheet('xBrain', '🧠 Cosa ho imparato di te', `
      <div class="br-top"><div class="br-ring" style="--p:${know}"><b>${know}%</b></div><div><b>${stage[0]} ${stage[1]}</b><br><small>${stage[2]}. Imparo da ${tm.n} giochi e da ogni tuo tocco: più mi dici, più divento preciso.</small></div></div>
      <div class="br-src"><span>⭐ ${nFav}</span><span>😍 ${nTop}</span><span>🗳️ ${nMV} voti</span><span>🎚️ ${nRt} valutati</span><span>👍👎 ${nR}</span><span>📋 ${nSt} stati</span><span>🧬 ${nDna}</span></div>
      <div class="br-h">💜 Cosa ami</div>${pos.length ? pos.map(bar).join('') : '<small>Ancora poco: segna preferiti, cuori e valutazioni.</small>'}
      ${neg.length ? `<div class="br-h">🚫 Cosa di solito eviti</div>${neg.map(bar).join('')}` : ''}
      ${impHtml}
      ${chg}
      ${todo.length ? `<div class="br-h">🙏 Aiutami a capirti meglio: valuta questi</div><div class="br-todo">${todo.map(g=> `<button type="button" class="btn" data-brg="${g.id}">${esc(g.name)}</button>`).join('')}</div>` : ''}
    `);
    body.querySelectorAll('[data-brg]').forEach(b=> b.addEventListener('click', ()=>{ const g = GAMES.find(x=> x.id === +b.dataset.brg); const sh = document.getElementById('xBrain'); if(sh) sh.classList.remove('show'); if(g){ openModal(g); setTimeout(()=>{ const r = document.getElementById('rtRate'); if(r){ r.open = true; r.scrollIntoView({behavior: 'smooth', block: 'center'}); } }, 900); } }));
  }
  window.rtOpenBrain = openBrain;
  try{ (window.XMENU = window.XMENU || []).push({html: '🧠 Cosa ho imparato di te', run: openBrain}); }catch(e){}
  document.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('[data-brain]')){ e.preventDefault(); openBrain(); } });

  // ---------------------------------------------------------------- aggancio alla scheda
  function mount(g){
    const card = document.getElementById('modalCard'); if(!card || !g) return;
    if(DRAFT && DRAFT.id !== g.id) commitDraft(true);          // passo a un altro gioco senza chiudere: salvo le valutazioni in sospeso
    card.querySelectorAll('#rtBar, #rtRate').forEach(n=> n.remove());
    const anchor = card.querySelector('#coverBlock') || card.querySelector('.modal-head');
    if(anchor) anchor.insertAdjacentHTML('afterend', barHtml(g) + rateHtml(g, false));
    // via i doppioni: il vecchio «Il tuo stato» e «Aggiungi ai preferiti» (ora sono nella barra)
    const sr = card.querySelector('#statusRow');
    if(sr){ const t = sr.previousElementSibling; if(t && t.classList.contains('modal-section-title') && /il tuo stato/i.test(t.textContent)) t.remove(); sr.remove(); }
    const fb = card.querySelector('#modalFavBtn'); if(fb) fb.remove();
  }
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){ const r = prev.apply(this, arguments); try{ mount(g); }catch(e){ try{ console.error(e); }catch(x){} } return r; };
    try{ openModal = window.openModal; }catch(e){}
  }
})();
