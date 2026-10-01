// ---- DNA del giocatore (v195): cosa ti ha preso di un gioco + giochi simili «intelligenti» ----
// 1) Nella scheda, sotto la sintonia: «🧬 Cosa ti ha preso di questo gioco?». Tocchi i tratti (lore, build, esplorazione, crafting…):
//    👍 mi ha preso → 👎 non mi piace → niente. Si salva in jrpg_dna_why {id: {TRATTO: 1|-1}} e pesa forte nel modello dei gusti (extras3.js):
//    così capisco PERCHÉ ti piace un gioco che sembra «fuori genere» (una meccanica, una parte del gameplay, il mondo…).
// 2) «Se ti è piaciuto questo, prova anche»: non più solo saga e generi, ma tratti in comune (pesati con i TUOI gusti), struttura
//    (difficoltà, grinding, peso storia, ritmo), qualità e simboli. La saga va in una riga a parte. Meglio pochi consigli giusti che tanti banali.
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.gusto) return;
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const WHY = 'jrpg_dna_why';
  const MECH = ()=> window.rtMech || {};
  const mechOf = g=>{ try{ return window.rtMechOf ? window.rtMechOf(g) : []; }catch(e){ return []; } };
  const stOf = g=>{ try{ return (typeof STATUSES !== 'undefined' && STATUSES[g.id]) || ''; }catch(e){ return ''; } };
  const isFav = g=>{ try{ return typeof FAVS !== 'undefined' && FAVS.has(g.id); }catch(e){ return false; } };

  // ---------- 1) cosa ti ha preso ----------
  function whyHtml(g){
    const M = MECH(), keys = Object.keys(M); if(!keys.length) return '';
    const dw = (LSG(WHY, {}) || {})[g.id] || {}, det = new Set(mechOf(g));
    const known = isFav(g) || ['played', 'playing', 'dropped'].includes(stOf(g));
    const chip = k=>{ const v = dw[k] || 0; return `<button type="button" class="dna-chip${v > 0 ? ' like' : v < 0 ? ' no' : ''}${det.has(k) && !v ? ' det' : ''}" data-dna="${k}" title="${esc(M[k].d)}">${M[k].ic} ${esc(M[k].n)}${v > 0 ? ' 👍' : v < 0 ? ' 👎' : ''}</button>`; };
    const first = keys.filter(k=> det.has(k) || dw[k]), rest = keys.filter(k=> !first.includes(k));
    const nSet = Object.keys(dw).filter(k=> dw[k]).length;
    return `<div class="dna-card" id="dnaWhy"><div class="dna-head">🧬 <b>${known ? 'Cosa ti ha preso di questo gioco?' : 'Cosa ti attira di questo gioco?'}</b></div>
      <div class="dna-sub">${known ? 'Tocca ciò che ti è piaciuto davvero (anche una piccola parte: una meccanica, il mondo, la musica…): 👍 · di nuovo 👎 non mi piace · di nuovo niente.' : 'Se qualcosa ti incuriosisce o ti respinge, toccalo: 👍 / 👎.'} Così imparo il <b>perché</b> dei tuoi gusti, non solo il genere.${nSet ? ` <span class="dna-n">${nSet} ${nSet === 1 ? 'tratto segnato' : 'tratti segnati'}</span>` : ''}</div>
      <div class="dna-chips">${first.map(chip).join('')}${rest.length ? `<button type="button" class="dna-more">＋ altri ${rest.length} tratti</button><span class="dna-rest" hidden>${rest.map(chip).join('')}</span>` : ''}</div>
      ${first.length ? '<div class="dna-leg"><span class="dna-chip det mini">tratteggiato</span> = l\'ho riconosciuto io dalla scheda</div>' : ''}</div>`;
  }
  function wire(card, g){
    const box = card.querySelector('#dnaWhy'); if(!box || box.dataset.w) return; box.dataset.w = '1';
    box.addEventListener('click', e=>{
      const more = e.target.closest('.dna-more'); if(more){ more.remove(); const r = box.querySelector('.dna-rest'); if(r) r.hidden = false; return; }
      const b = e.target.closest('[data-dna]'); if(!b) return;
      const all = LSG(WHY, {}) || {}, cur = all[g.id] || {}, k = b.dataset.dna, v = cur[k] || 0, nx = v === 0 ? 1 : v === 1 ? -1 : 0;
      if(nx) cur[k] = nx; else delete cur[k];
      if(Object.keys(cur).length) all[g.id] = cur; else delete all[g.id];
      LSS(WHY, all);
      try{ if(navigator.vibrate) navigator.vibrate(8); }catch(x){}
      // ridisegno il blocco e la sintonia (il modello dei gusti cambia subito)
      const open = !(box.querySelector('.dna-rest') || {hidden: true}).hidden;
      box.outerHTML = whyHtml(g); const nb = card.querySelector('#dnaWhy'); if(open && nb){ const r = nb.querySelector('.dna-rest'), m = nb.querySelector('.dna-more'); if(r) r.hidden = false; if(m) m.remove(); }
      wire(card, g);
      try{ const gs = card.querySelector('#gsCard'); const h = window.rtRadar && window.rtRadar(g); if(gs && h) gs.outerHTML = h; }catch(x){}
    });
  }

  // ---------- 2) giochi simili ----------
  const EXCL = [['HOR', 'SURV'], ['SPORT', 'RACE', 'SIMVEH'], ['FIGHT'], ['PARTY', 'TRIVIA', 'RHY'], ['FPS', 'TPS', 'BR'], ['CITY', 'ECOSIM', 'SIMLIFE', 'LIFE'], ['MECH']];
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
  try{ if(typeof similarGamesHtml === 'function'){ window.similarGamesHtml = similarHtml; similarGamesHtml = similarHtml; } }catch(e){}

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
