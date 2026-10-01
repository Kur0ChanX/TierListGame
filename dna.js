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
  const U = window.XUI || {};
  const isFav = g=>{ try{ return typeof FAVS !== 'undefined' && FAVS.has(g.id); }catch(e){ return false; } };

  // ---------- 1) cosa ti ha preso (v198: categorie, spiegazioni, parole tue) ----------
  // i tratti raggruppati per tema: così trovi subito quello che cerchi, qualunque sia il genere del gioco
  const CATS = [
    ['⚔️', 'Combattimento', ['COMBAT', 'FEEL', 'TACT', 'CHALL', 'SUPERBOSS', 'SUMMON']],
    ['📈', 'Crescita, build e ricompense', ['POWER', 'BUILD', 'PARTY', 'LOOT', 'DOPA', 'EFFORT', 'FARM', 'GACHA']],
    ['🗺️', 'Mondo ed esplorazione', ['WORLD', 'LORE', 'EXPLO', 'JOURNEY', 'SAND', 'ATMO']],
    ['📖', 'Storia e personaggi', ['STORY', 'CHAR', 'ROMANCE', 'VILLAIN', 'CHOICE', 'HUMOR', 'LIFE']],
    ['🧩', 'Sistemi e attività', ['CRAFT', 'RES', 'BASE', 'PUZZ', 'MINI', 'PROC', 'DAILY']],
    ['🏆', 'Completare e restare', ['COLL', 'ENDGAME', 'MUSIC', 'SOCIAL']]
  ];
  // cosa significano i termini (anche quelli in inglese dei giocatori): compare toccando un tratto
  const XPL = {
    BUILD: 'Build = la combinazione di abilità, equipaggiamento e statistiche del personaggio. Min-maxing = spingere al massimo ciò che serve e sacrificare il resto, per «rompere» il gioco. Job system / class tree / sphere grid = sistemi per costruirla.',
    LOOT: 'Loot = oggetti che trovi o lasciano i nemici. Drop rate = probabilità che un oggetto cada. God roll = un oggetto uscito con le statistiche migliori possibili. Rarità a colori = grigio, verde, blu, viola, arancione…',
    DOPA: 'La «scarica di dopamina»: ricompense frequenti e un po\' casuali (variable ratio reward) che ti fanno dire «ancora un turno» o «ancora una run».',
    POWER: 'Vedere il personaggio diventare sempre più forte. Power trip = sentirsi onnipotenti; overleveled = più forte del necessario, a forza di livelli.',
    CHALL: 'Sfide dure che si vincono preparandosi e ottimizzando, non solo con i riflessi.',
    EFFORT: 'Più ti impegni e più vieni ricompensato: la fatica ripaga.',
    FARM: 'Grinding / farming = ripetere un\'attività (battaglie, raccolta) per ottenere risorse o livelli. Qui solo quando porta un vantaggio concreto.',
    GACHA: 'Gacha = estrazioni a caso di personaggi o oggetti (wish, banner, summon), spesso a pagamento. Pity = garanzia di un premio raro dopo tot tentativi.',
    FEEL: 'Game feel / juiciness = quanto i comandi «si sentono»: colpi pesanti, impatti, vibrazioni, animazioni reattive.',
    DAILY: 'Daily / weekly reset = attività che si rinnovano ogni giorno o settimana. Time sink = attività fatte per tenerti nel gioco a lungo.',
    PROC: 'Procedurale = mappe e partite generate a caso: ogni run è diversa. Roguelite = si muore spesso ma si riparte più forti.',
    SAND: 'Sandbox = libertà di fare le cose come vuoi, con sistemi che interagiscono tra loro.',
    LORE: 'Lore = la storia profonda del mondo: miti, segreti, documenti, dettagli da scoprire.',
    WORLD: 'World building = un mondo costruito con cura: culture, luoghi, regole proprie.',
    TACT: 'Tattica = pensare prima di agire: posizioni, turni, ordine delle mosse.',
    SUPERBOSS: 'Superboss = nemici opzionali molto più forti dei boss della storia (es. eoni oscuri e Penance in FFX, le Weapon in FFVII).',
    SUMMON: 'Evocazioni = creature potenti chiamate in battaglia (eoni, esper, G.F.).',
    ENDGAME: 'Endgame / post-game = tutto quello che c\'è da fare oltre la storia principale: sfide, armi finali, NG+ (rigiocare con i progressi).',
    RES: 'Gestione delle risorse = amministrare cose limitate: cure, munizioni, soldi, spazio nell\'inventario.',
    MINI: 'Minigiochi = giochi dentro il gioco (blitzball, carte, corse dei chocobo, pesca…).',
    PARTY: 'Gestione della squadra = scegliere chi combatte, cambiare i personaggi, costruire un gruppo equilibrato.'
  };
  const CUST = 'jrpg_dna_custom';
  function whyHtml(g, info){
    const M = MECH(); if(!Object.keys(M).length) return '';
    const dw = (LSG(WHY, {}) || {})[g.id] || {}, det = new Set(mechOf(g));
    const known = isFav(g) || ['played', 'playing', 'dropped'].includes(stOf(g));
    const chip = k=>{ if(!M[k]) return ''; const v = dw[k] || 0; return `<button type="button" class="dna-chip${v > 0 ? ' like' : v < 0 ? ' no' : ''}${det.has(k) && !v ? ' det' : ''}" data-dna="${k}">${M[k].ic} ${esc(M[k].n)}${v > 0 ? ' 👍' : v < 0 ? ' 👎' : ''}</button>`; };
    const inCat = new Set(CATS.flatMap(c=> c[2])), extra = Object.keys(M).filter(k=> !inCat.has(k));
    const cats = CATS.map(c=> [c[0], c[1], c[2].concat(c[1] === 'Sistemi e attività' ? extra : [])]);
    const mine = Object.entries(LSG(CUST, {}) || {});
    const nSet = Object.keys(dw).filter(k=> dw[k]).length;
    const detList = [...det].filter(k=> M[k]);
    return `<div class="dna-card" id="dnaWhy"><div class="dna-head">🧬 <b>${known ? 'Cosa ti ha preso di questo gioco?' : 'Cosa ti attira di questo gioco?'}</b>${nSet ? ` <span class="dna-n">${nSet} ${nSet === 1 ? 'tratto segnato' : 'tratti segnati'}</span>` : ''}</div>
      <div class="dna-sub">Tocca un tratto: 👍 mi piace · di nuovo 👎 non mi piace · di nuovo niente. Sotto ti spiego cosa significa. Più ne segni, più capisco il <b>perché</b> dei tuoi gusti.</div>
      ${detList.length ? `<div class="dna-cat"><div class="dna-ct">🔎 Riconosciuti in questo gioco</div><div class="dna-chips">${detList.map(chip).join('')}</div></div>` : ''}
      ${cats.map(([ic, n, ks])=> `<details class="dna-cat"${ks.some(k=> dw[k]) ? ' open' : ''}><summary class="dna-ct">${ic} ${esc(n)} <small>${ks.filter(k=> M[k]).length}</small></summary><div class="dna-chips">${ks.map(chip).join('')}</div></details>`).join('')}
      ${mine.length ? `<details class="dna-cat" open><summary class="dna-ct">✍️ I tuoi tratti <small>${mine.length}</small></summary><div class="dna-chips">${mine.map(([k, c])=> `<button type="button" class="dna-chip${(c.by || []).includes(g.id) ? ' like' : (c.no || []).includes(g.id) ? ' no' : ''}" data-mine="${esc(k)}">✍️ ${esc(c.n)}${(c.by || []).includes(g.id) ? ' 👍' : (c.no || []).includes(g.id) ? ' 👎' : ''}</button>`).join('')}</div></details>` : ''}
      <div class="dna-info" id="dnaInfo"${info ? '' : ' hidden'}>${info || ''}</div>
      <div class="dna-free"><button type="button" class="btn" data-dna-free>✍️ Scrivilo con parole tue</button><small>Es. «adoro i dark eoni e la sphere grid, la storia di Tidus e Yuna, il blitzball»: l'AI lo trasforma in tratti (anche nuovi) che userò per TUTTI i giochi.</small></div></div>`;
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
    const open = [...box.querySelectorAll('details.dna-cat')].map(d=> d.open);
    box.outerHTML = whyHtml(g, info); const nb = card.querySelector('#dnaWhy');
    if(nb) [...nb.querySelectorAll('details.dna-cat')].forEach((d, i)=>{ if(open[i]) d.open = true; });
    wire(card, g);
    try{ const gs = card.querySelector('#gsCard'); const h = window.rtRadar && window.rtRadar(g); if(gs && h) gs.outerHTML = h; }catch(x){}
  }
  function wire(card, g){
    const box = card.querySelector('#dnaWhy'); if(!box || box.dataset.w) return; box.dataset.w = '1';
    box.addEventListener('click', e=>{
      if(e.target.closest('[data-dna-free]')){ freeText(card, g); return; }
      const mb = e.target.closest('[data-mine]');
      if(mb){ const cu = LSG(CUST, {}) || {}, c = cu[mb.dataset.mine]; if(!c) return; c.by = c.by || []; c.no = c.no || []; if(c.by.includes(g.id)){ c.by = c.by.filter(x=> x !== g.id); c.no.push(g.id); } else if(c.no.includes(g.id)) c.no = c.no.filter(x=> x !== g.id); else c.by.push(g.id); LSS(CUST, cu); try{ SIMC.clear(); }catch(x){} const info = '✍️ <b>' + esc(c.n) + '</b>' + (c.d ? '<br>' + esc(c.d) : '') + (c.games ? '<br>Presente in ' + c.games.length + ' tuoi giochi.' : '<br>Parole che lo riconoscono: ' + esc((c.kw || []).join(', ')));
        redraw(card, g, info);
        if(!c.games && typeof askLLM === 'function') gamesWith(c).then(ids=>{ if(!ids) return; const cu2 = LSG(CUST, {}) || {}, k = mb.dataset.mine; if(!cu2[k]) return; cu2[k].games = ids; LSS(CUST, cu2); try{ SIMC.clear(); }catch(x){} if(card.isConnected) redraw(card, g, '✍️ <b>' + esc(cu2[k].n) + '</b>: trovato in ' + ids.length + ' tuoi giochi.'); });
        return; }
      const b = e.target.closest('[data-dna]'); if(!b) return;
      const all = LSG(WHY, {}) || {}, cur = all[g.id] || {}, k = b.dataset.dna, v = cur[k] || 0, nx = v === 0 ? 1 : v === 1 ? -1 : 0;
      if(nx) cur[k] = nx; else delete cur[k];
      if(Object.keys(cur).length) all[g.id] = cur; else delete all[g.id];
      LSS(WHY, all); try{ SIMC.clear(); }catch(x){}
      try{ if(navigator.vibrate) navigator.vibrate(8); }catch(x){}
      const M = MECH(), info = M[k] ? `<b>${M[k].ic} ${esc(M[k].n)}</b>${nx > 0 ? ' · 👍 ti piace' : nx < 0 ? ' · 👎 non ti piace' : ' · tolto'}<br>${esc(XPL[k] || (M[k].d.charAt(0).toUpperCase() + M[k].d.slice(1)) + '.')}` : '';
      redraw(card, g, info);
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
  // somiglianza 0..1 tra due giochi (per la Sintonia): tratti del DNA pesati per rarità, generi, struttura e simboli. Calcolata una volta per coppia.
  const SIMC = new Map();
  window.rtSimNorm = function(a, b){
    const key = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id; if(SIMC.has(key)) return SIMC.get(key);
    const W = idf(), wsum = (arr, p)=> arr.reduce((s, k)=> s + (W[p + k] || 1), 0);
    const am = new Set(mechOf(a)), bm = mechOf(b), shm = bm.filter(k=> am.has(k)), unim = [...new Set([...am, ...bm])];
    const fJ = unim.length ? wsum(shm, 'm:') / (wsum(unim, 'm:') || 1) : 0;
    const at = new Set(a.tags || []), bt = b.tags || [], sht = bt.filter(t=> at.has(t)), unit = [...new Set([...at, ...bt])];
    const tJ = unit.length ? wsum(sht, 't:') / (wsum(unit, 't:') || 1) : 0;
    const al = a.label || {}, bl = b.label || {}; let lc = 0, ln = 0;
    ['d', 'g', 's'].forEach(k=>{ if(al[k] && bl[k]){ ln++; lc += Math.max(0, 1 - Math.abs(al[k] - bl[k]) / 2); } });
    if(al.p && bl.p){ ln++; lc += al.p === bl.p ? 1 : 0; }
    const ae = a.enrich || {}, be = b.enrich || {};
    let v = fJ * .55 + tJ * .25 + (ln ? lc / ln : .5) * .2;
    if(ae.storyTag && ae.storyTag === be.storyTag) v += .06;
    if(ae.dopamine && be.dopamine) v += .04;
    try{ const sk = typeof sagaKeyOf === 'function' ? sagaKeyOf(a) : ''; if(sk && sk === sagaKeyOf(b)) v += .12; }catch(e){}
    try{ if(Object.keys(LSG(CUST, {}) || {}).length && window.rtFeats){ const fa = new Set(rtFeats(a).filter(x=> x.indexOf('mine:') === 0)); const shared = rtFeats(b).filter(x=> fa.has(x)).length; v += Math.min(.15, shared * .06); } }catch(e){}   // i tuoi tratti scritti a parole
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
    setTimeout(()=> idleDo(()=>{
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
  (function warm(){
    let i = 0;
    const step = dl=>{
      try{ if(typeof GAMES === 'undefined' || !GAMES.length){ setTimeout(()=> idleDo(step, 3000), 1500); return; }
        while(i < GAMES.length && (!dl || !dl.timeRemaining || dl.timeRemaining() > 4)){ mechOf(GAMES[i]); i++; if(!dl || !dl.timeRemaining) { if(i % 40 === 0) break; } }
        if(i < GAMES.length){ idleDo(step, 3000); return; }
        idf(); try{ window.rtTasteModel && rtTasteModel(); }catch(e){}
      }catch(e){}
    };
    setTimeout(()=> idleDo(step, 4000), 2500);
  })();

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
