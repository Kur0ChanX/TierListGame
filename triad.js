// ---- Triple Triad di Frugu (v135): il gioco di carte di Final Fantasy VIII, con le carte dei giochi del database ----
// 500 carte (i 500 giochi migliori del database) divise in 10 livelli come in FF8: livello 1 = carte comuni, livello 10 = leggendarie.
// Valori dei 4 lati da 1 ad A (10), elementi (Fuoco, Ghiaccio, Tuono, Terra, Veleno, Vento, Acqua, Sacro).
// Regole: Open, Same, Same Wall, Plus, Combo, Elemental, Random, Sudden Death. Regole di scambio: One, Diff, Direct, All.
// Avversari con regioni e regole diverse, intelligenza artificiale a 4 livelli, carte rare da vincere. Caricato solo quando lo apri.
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {toast, esc, LS} = U;
  const KEY = 'jrpg_triad';
  const sfx = e=>{ try{ window.rtSfx && rtSfx(e); }catch(x){} };
  const ELEM = {fuoco: ['Fuoco', '🔥'], ghiaccio: ['Ghiaccio', '❄️'], tuono: ['Tuono', '⚡'], terra: ['Terra', '🪨'], veleno: ['Veleno', '☠️'], vento: ['Vento', '🌪️'], acqua: ['Acqua', '💧'], sacro: ['Sacro', '✨']};
  const TAG_EL = {ACT: 'fuoco', SOUL: 'ghiaccio', MECH: 'tuono', TAC: 'terra', MON: 'terra', DUN: 'veleno', HOR: 'veleno', ROG: 'vento', CARD: 'vento', LIFE: 'acqua', VN: 'acqua', TUR: 'sacro', CROSS: 'sacro', WAR: 'fuoco', METR: 'vento'};
  const RULES = {open: ['Open', 'Vedi le carte dell\'avversario (e lui le tue).'], same: ['Same', 'Se i numeri che si toccano sono UGUALI su 2 o più lati, le carte avversarie su quei lati passano a te.'], wall: ['Same Wall', 'Con Same, il bordo del tavolo vale come un A: un lato A contro il bordo conta come uguale.'], plus: ['Plus', 'Se le SOMME dei numeri che si toccano sono uguali su 2 o più lati, prendi quelle carte.'], elem: ['Elemental', 'Alcune caselle hanno un elemento: +1 a una carta dello stesso elemento, −1 alle altre.'], random: ['Random', 'Le tue 5 carte vengono scelte a caso dalla collezione.'], sudden: ['Sudden Death', 'In caso di pareggio si rigioca con le carte che ognuno possiede sul tavolo, finché qualcuno vince.']};
  const TRADES = {one: ['One', 'Il vincitore prende 1 carta a scelta tra le 5 del perdente.'], diff: ['Diff', 'Il vincitore prende tante carte quanta è la differenza di punteggio.'], direct: ['Direct', 'Ognuno tiene le carte che possiede sul tavolo a fine partita.'], all: ['All', 'Il vincitore prende tutte e 5 le carte del perdente.']};
  // avversari (come i giocatori di carte di FF8, con regioni e regole)
  const NPC = [
    {id: 'frugu', n: 'Frugu', r: 'Il Bidone', lv: [1, 2], ai: 0, rules: ['open'], trade: 'one', face: '🦝'},
    {id: 'studente', n: 'Studente del Garden', r: 'Balamb', lv: [1, 3], ai: 0, rules: ['open'], trade: 'one', face: '🧑‍🎓'},
    {id: 'soldato', n: 'Soldato di Galbadia', r: 'Galbadia', lv: [2, 4], ai: 1, rules: ['same'], trade: 'one', face: '💂'},
    {id: 'bardo', n: 'Bardo di Dollet', r: 'Dollet', lv: [3, 5], ai: 1, rules: ['random', 'elem', 'open'], trade: 'one', face: '🎻'},
    {id: 'ribelle', n: 'Ribelle di Timber', r: 'Timber', lv: [4, 6], ai: 1, rules: ['same', 'plus'], trade: 'one', face: '🧢'},
    {id: 'nonna', n: 'Nonna di Trabia', r: 'Trabia', lv: [5, 7], ai: 2, rules: ['random', 'plus'], trade: 'one', face: '👵'},
    {id: 'esploratore', n: 'Esploratore di Centra', r: 'Centra', lv: [6, 8], ai: 2, rules: ['same', 'plus', 'random'], trade: 'diff', face: '🧭'},
    {id: 'scienziata', n: 'Scienziata di Esthar', r: 'Esthar', lv: [7, 9], ai: 2, rules: ['elem', 'same', 'wall'], trade: 'diff', face: '🔬'},
    {id: 'regina', n: 'Regina delle Carte', r: 'Ovunque', lv: [7, 10], ai: 3, rules: ['open', 'same', 'plus', 'elem'], trade: 'direct', face: '👸'},
    {id: 're', n: 'Re del Club', r: 'Club delle Carte', lv: [8, 10], ai: 3, rules: ['open', 'same', 'plus', 'wall'], trade: 'one', face: '🤴'},
    {id: 'leggenda', n: 'Il Procione Leggendario', r: 'Base Lunare', lv: [9, 10], ai: 3, rules: ['open', 'same', 'plus', 'wall', 'elem', 'random', 'sudden'], trade: 'all', face: '🌕'}
  ];
  const AI_N = ['Principiante', 'Normale', 'Esperto', 'Maestro'];

  // ---------- carte ----------
  function rng(seed){ let a = seed >>> 0; return ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  let CARDS = null, BY = null;
  function cards(){
    if(CARDS) return CARDS;
    const base = GAMES.filter(g=> !g.custom).slice().sort((a, b)=> (b.score - a.score) || (a.id - b.id)).slice(0, 500).reverse();
    CARDS = base.map((g, i)=>{
      const L = Math.min(10, 1 + Math.floor(i / (base.length / 10))), R = rng(g.id * 2654435761 + 7);
      const cap = Math.min(10, L + 3), r = [1, 1, 1, 1];
      if(L >= 8){ r[Math.floor(R() * 4)] = L >= 9 ? 10 : 9; }
      let left = 10 + L * 2 + Math.round(R() * 2 - 1) - r.reduce((a, b)=> a + b, 0);
      let guard = 0;
      while(left > 0 && guard++ < 200){ const k = Math.floor(R() * 4); if(r[k] < cap){ r[k]++; left--; } }
      const t = (g.tags || []).find(x=> TAG_EL[x]);
      const el = t && R() < .45 ? TAG_EL[t] : null;
      return {id: g.id, name: g.name, lv: L, r, el, g};
    });
    BY = new Map(CARDS.map(c=> [c.id, c]));
    return CARDS;
  }
  const card = id=> (cards(), BY.get(+id));
  const V = n=> n >= 10 ? 'A' : String(n);

  // ---------- salvataggio ----------
  function load(){
    let S = LS.get(KEY, null);
    if(!S || !S.owned){
      cards(); const R = rng(Date.now() & 0xffff);
      const pick = lv=>{ const l = CARDS.filter(c=> c.lv === lv); return l[Math.floor(R() * l.length)].id; };
      const owned = {}; [1, 1, 1, 1, 1, 2, 2, 2, 3, 3].forEach(lv=>{ const id = pick(lv); owned[id] = (owned[id] || 0) + 1; });
      S = {owned, w: 0, l: 0, d: 0, pts: 0, npc: {}, deck: [], log: []};
      LS.set(KEY, S);
    }
    return S;
  }
  let S = load();
  const save = ()=> LS.set(KEY, S);
  const ownedList = ()=> Object.keys(S.owned).filter(k=> S.owned[k] > 0).map(card).filter(Boolean).sort((a, b)=> (b.lv - a.lv) || (b.r.reduce((x, y)=> x + y) - a.r.reduce((x, y)=> x + y)));
  const ownedCount = ()=> Object.values(S.owned).reduce((a, b)=> a + Math.max(0, b), 0);
  const give = id=>{ S.owned[id] = (S.owned[id] || 0) + 1; };
  const takeAway = id=>{ S.owned[id] = Math.max(0, (S.owned[id] || 0) - 1); if(!S.owned[id]) delete S.owned[id]; };
  function refill(){                       // se ti restano meno di 5 carte, il negozio ti regala carte comuni (per poter sempre giocare)
    cards(); let n = 0;
    while(ownedCount() < 5){ const l = CARDS.filter(c=> c.lv <= 2); give(l[Math.floor(Math.random() * l.length)].id); n++; }
    if(n) toast('Il negozio di carte ti regala ' + n + ' carte comuni per continuare a giocare', 4000);
  }
  function npcState(n){ return S.npc[n.id] || (S.npc[n.id] = {taken: [], rareWon: false, w: 0, l: 0}); }
  function npcRare(n){ cards(); const lv = Math.min(10, n.lv[1] + (n.lv[1] < 10 ? 1 : 0)); const l = CARDS.filter(c=> c.lv === lv); return l[Math.floor(rng(n.id.length * 977 + lv * 31)() * l.length)]; }
  function npcDeck(n){
    cards(); const R = Math.random, st = npcState(n);
    const pool = CARDS.filter(c=> c.lv >= n.lv[0] && c.lv <= n.lv[1]);
    const deck = [];
    const extra = st.taken.map(card).filter(Boolean);                         // le carte che ti ha vinto: puoi riprendertele
    if(extra.length && R() < .7) deck.push(extra[Math.floor(R() * extra.length)]);
    if(!st.rareWon && R() < .35) deck.push(npcRare(n));
    while(deck.length < 5){ const c = pool[Math.floor(R() * pool.length)]; if(!deck.includes(c)) deck.push(c); }
    return deck.slice(0, 5);
  }

  // ---------- regole del tavolo ----------
  const ADJ = [[-3, 0, 2], [1, 1, 3], [3, 2, 0], [-1, 3, 1]];        // [spostamento, mio lato, lato del vicino]
  function neigh(i, d){ const [off] = ADJ[d], j = i + off; if(j < 0 || j > 8) return -1; if((d === 1 || d === 3) && Math.floor(j / 3) !== Math.floor(i / 3)) return -1; return j; }
  const mod = (st, i)=>{ const b = st.board[i]; if(!b || !st.rules.elem || !st.cellEl[i]) return 0; return b.c.el === st.cellEl[i] ? 1 : -1; };
  const val = (st, i, side)=> st.board[i].c.r[side] + mod(st, i);
  function place(st, hi, i){     // restituisce il nuovo stato e gli eventi (per le animazioni)
    const who = st.turn, hand = st.hands[who], c = hand[hi];
    const ns = {rules: st.rules, cellEl: st.cellEl, board: st.board.slice(), hands: {p: st.hands.p.slice(), o: st.hands.o.slice()}, turn: who === 'p' ? 'o' : 'p'};
    ns.hands[who].splice(hi, 1);
    ns.board[i] = {c, o: who};
    const ev = [], flipped = [];
    const flip = (j, why)=>{ if(ns.board[j].o !== who){ ns.board[j] = {c: ns.board[j].c, o: who}; flipped.push(j); ev.push([why, j]); return true; } return false; };
    const combo = [];
    if(st.rules.same || st.rules.plus){
      const same = [], sums = {};
      for(let d = 0; d < 4; d++){
        const j = neigh(i, d), my = c.r[ADJ[d][1]];
        if(j < 0){ if(st.rules.same && st.rules.wall && my === 10) same.push(-1); continue; }
        const nb = ns.board[j]; if(!nb) continue;
        const their = nb.c.r[ADJ[d][2]];
        if(st.rules.same && my === their) same.push(j);
        if(st.rules.plus){ (sums[my + their] = sums[my + their] || []).push(j); }
      }
      if(st.rules.same && same.length >= 2){ let any = false; same.forEach(j=>{ if(j >= 0 && flip(j, 'same')){ combo.push(j); any = true; } }); if(any) ev.push(['banner', 'SAME!']); }
      if(st.rules.plus){ Object.values(sums).forEach(l=>{ if(l.length >= 2){ let any = false; l.forEach(j=>{ if(flip(j, 'plus')){ combo.push(j); any = true; } }); if(any) ev.push(['banner', 'PLUS!']); } }); }
    }
    for(let d = 0; d < 4; d++){ const j = neigh(i, d); if(j < 0 || !ns.board[j] || ns.board[j].o === who) continue; if(val(ns, i, ADJ[d][1]) > val(ns, j, ADJ[d][2])) flip(j, 'basic'); }
    let q = combo.slice(), comboHit = false;
    while(q.length){
      const k = q.shift();
      for(let d = 0; d < 4; d++){ const j = neigh(k, d); if(j < 0 || !ns.board[j] || ns.board[j].o === who) continue; if(val(ns, k, ADJ[d][1]) > val(ns, j, ADJ[d][2])){ flip(j, 'combo'); q.push(j); comboHit = true; } }
    }
    if(comboHit) ev.push(['banner', 'COMBO!']);
    return {st: ns, ev, flipped};
  }
  const score = st=>{ let p = st.hands.p.length, o = st.hands.o.length; st.board.forEach(b=>{ if(b){ if(b.o === 'p') p++; else o++; } }); return {p, o}; };
  const full = st=> st.board.every(Boolean);

  // ---------- intelligenza artificiale ----------
  function moves(st){ const m = []; st.hands[st.turn].forEach((c, hi)=> st.board.forEach((b, i)=>{ if(!b) m.push([hi, i]); })); return m; }
  function heur(st, me){
    const s = score(st); let h = (me === 'o' ? s.o - s.p : s.p - s.o) * 10;
    st.board.forEach((b, i)=>{ if(!b) return; let exposed = 0; for(let d = 0; d < 4; d++){ const j = neigh(i, d); if(j >= 0 && !st.board[j]) exposed += 10 - (b.c.r[ADJ[d][1]] + mod(st, i)); } h += (b.o === me ? -1 : 1) * exposed * .15; });
    st.hands[me].forEach(c=> h += c.r.reduce((a, x)=> a + x, 0) * .03);
    return h;
  }
  function search(st, depth, me, alpha, beta){
    if(depth === 0 || full(st)) return heur(st, me);
    const ms = moves(st), maxi = st.turn === me;
    let best = maxi ? -Infinity : Infinity;
    for(const [hi, i] of ms){
      const v = search(place(st, hi, i).st, depth - 1, me, alpha, beta);
      if(maxi){ best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
      if(beta <= alpha) break;
    }
    return best;
  }
  function aiMove(st, level){
    const ms = moves(st), me = st.turn;
    const depth = [1, 1, 2, 3][level] || 1, t0 = performance.now();
    const scored = ms.map(([hi, i])=>{ const r = place(st, hi, i); let v = depth === 1 || performance.now() - t0 > 1800 ? heur(r.st, me) : search(r.st, depth - 1, me, -Infinity, Infinity); v += (i === 0 || i === 2 || i === 6 || i === 8 ? .3 : 0) - st.hands[me][hi].lv * .05; return {hi, i, v}; }).sort((a, b)=> b.v - a.v);
    if(level === 0){ const top = scored.filter(x=> x.v >= scored[0].v - 12); return top[Math.floor(Math.random() * Math.min(top.length, 4))]; }
    return scored[0];
  }

  // ---------- disegno ----------
  const thumb = c=>{ try{ const u = effectiveCover(c.g); return u ? coverThumb(u, 240) : null; }catch(e){ return null; } };
  function cardHtml(c, owner, opts = {}){
    if(opts.back) return `<div class="tt-card back ${owner}"><span>🦝</span></div>`;
    const im = thumb(c), el = c.el ? `<i class="tt-el" title="${ELEM[c.el][0]}">${ELEM[c.el][1]}</i>` : '';
    return `<div class="tt-card ${owner || ''} lv${c.lv}${opts.sel ? ' sel' : ''}" data-cid="${c.id}"${im ? ` style="--img:url('${esc(im).replace(/'/g, '%27')}')"` : ''}>${im ? '' : `<em>${esc(c.name)}</em>`}
      <b class="tt-r"><u>${V(c.r[0])}</u><u>${V(c.r[3])}</u><u>${V(c.r[1])}</u><u>${V(c.r[2])}</u></b>${el}<small class="tt-lv">L${c.lv}</small>${opts.mod ? `<i class="tt-mod ${opts.mod > 0 ? 'up' : 'dn'}">${opts.mod > 0 ? '+1' : '−1'}</i>` : ''}</div>`;
  }
  let root = null;
  function shell(html){
    if(!root){ root = document.createElement('div'); root.id = 'ttApp'; root.className = 'tt-app'; document.body.appendChild(root); }
    root.innerHTML = `<div class="tt-wrap">${html}</div>`; root.classList.add('show');
    root.querySelectorAll('[data-tt-close]').forEach(b=> b.addEventListener('click', ()=> root.classList.remove('show')));
    return root;
  }
  const head = t=> `<div class="tt-head"><button class="tt-x" type="button" data-tt-close aria-label="Chiudi">✕</button><b>${t}</b><button class="tt-x" type="button" data-tt-home aria-label="Menu">☰</button></div>`;
  function wireHome(){ root.querySelectorAll('[data-tt-home]').forEach(b=> b.addEventListener('click', home)); }

  // ---------- schermate ----------
  function home(){
    S = load(); cards(); refill(); save();
    const pct = Math.round(100 * new Set(Object.keys(S.owned)).size / CARDS.length);
    shell(`${head('Triple Triad di Frugu')}
      <div class="tt-hero"><div class="tt-fan">${ownedList().slice(0, 3).map(c=> cardHtml(c, 'p')).join('')}</div>
      <div class="tt-stats"><div><b>${S.w}</b>vinte</div><div><b>${S.l}</b>perse</div><div><b>${S.d}</b>pari</div><div><b>${S.pts}</b>punti</div></div>
      <div class="tt-prog">Collezione: <b>${new Set(Object.keys(S.owned)).size}</b>/500 carte diverse (${pct}%) · ${ownedCount()} in tutto</div></div>
      <div class="tt-menu"><button class="btn primary" type="button" data-go="npc">⚔️ Sfida un giocatore</button><button class="btn" type="button" data-go="free">🎲 Partita libera (scegli le regole)</button><button class="btn" type="button" data-go="album">📚 Collezione (album)</button><button class="btn" type="button" data-go="rules">📜 Regole</button></div>`);
    wireHome();
    root.querySelectorAll('[data-go]').forEach(b=> b.addEventListener('click', ()=> ({npc: npcList, free: freeSetup, album, rules: rulesPage})[b.dataset.go]()));
  }
  function ruleChips(rs, trade){ return rs.map(k=> `<span class="tt-rule" title="${esc(RULES[k][1])}">${RULES[k][0]}</span>`).join('') + (trade ? `<span class="tt-rule tr" title="${esc(TRADES[trade][1])}">Scambio: ${TRADES[trade][0]}</span>` : ''); }
  function npcList(){
    shell(`${head('Sfida un giocatore')}<div class="tt-npcs">${NPC.map(n=>{ const st = npcState(n), rare = npcRare(n); return `<button class="tt-npc" type="button" data-npc="${n.id}"><span class="tt-face">${n.face}</span><span class="tt-ni"><b>${esc(n.n)}</b><small>${esc(n.r)} · livelli ${n.lv[0]}–${n.lv[1]} · IA ${AI_N[n.ai]} · ${st.w}V ${st.l}P</small><span>${ruleChips(n.rules, n.trade)}</span><small>${st.rareWon ? '✓ carta rara vinta' : 'Carta rara: ' + esc(rare.name) + ' (L' + rare.lv + ')'}${st.taken.length ? ' · ha ' + st.taken.length + ' tue carte' : ''}</small></span></button>`; }).join('')}</div>`);
    wireHome();
    root.querySelectorAll('[data-npc]').forEach(b=> b.addEventListener('click', ()=> setup(NPC.find(n=> n.id === b.dataset.npc))));
  }
  function freeSetup(){
    const on = new Set(LS.get('jrpg_triad_free', ['open', 'same', 'plus']));
    const tr = LS.get('jrpg_triad_trade', 'one'), lvl = LS.get('jrpg_triad_ai', 1);
    shell(`${head('Partita libera')}<div class="tt-free"><h4>Regole</h4>${Object.entries(RULES).map(([k, r])=> `<label class="ask-toggle"><input type="checkbox" data-r="${k}" ${on.has(k) ? 'checked' : ''}> <b>${r[0]}</b> <small>${esc(r[1])}</small></label>`).join('')}
      <h4>Scambio</h4>${Object.entries(TRADES).map(([k, t])=> `<label class="ask-toggle"><input type="radio" name="tttr" value="${k}" ${tr === k ? 'checked' : ''}> <b>${t[0]}</b> <small>${esc(t[1])}</small></label>`).join('')}
      <h4>Avversario</h4><select id="ttAi">${AI_N.map((n, i)=> `<option value="${i}"${i === lvl ? ' selected' : ''}>${n}</option>`).join('')}</select>
      <button class="btn primary" type="button" id="ttGoFree">Gioca</button></div>`);
    wireHome();
    root.querySelector('#ttGoFree').addEventListener('click', ()=>{
      const rs = [...root.querySelectorAll('[data-r]:checked')].map(x=> x.dataset.r), t = (root.querySelector('[name=tttr]:checked') || {}).value || 'one', ai = +root.querySelector('#ttAi').value;
      LS.set('jrpg_triad_free', rs); LS.set('jrpg_triad_trade', t); LS.set('jrpg_triad_ai', ai);
      const lvr = [[1, 4], [3, 6], [5, 8], [7, 10]][ai];
      setup({id: 'libera', n: 'Sfidante', r: 'Partita libera', lv: lvr, ai, rules: rs, trade: t, face: '🎴', free: true});
    });
  }
  function album(){
    cards();
    const own = S.owned;
    shell(`${head('Collezione')}<div class="tt-prog">Hai ${new Set(Object.keys(own)).size} carte diverse su 500. Le carte non ancora trovate sono in grigio.</div>
      ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(L=>{ const l = CARDS.filter(c=> c.lv === L), n = l.filter(c=> own[c.id]).length; return `<details class="tt-lvl"${L >= 9 ? '' : ''}><summary>Livello ${L} · ${n}/${l.length}</summary><div class="tt-grid">${l.map(c=> own[c.id] ? `<div class="tt-cell">${cardHtml(c, 'p')}${own[c.id] > 1 ? `<i class="tt-n">×${own[c.id]}</i>` : ''}</div>` : `<div class="tt-cell"><div class="tt-card miss"><em>?</em></div></div>`).join('')}</div></details>`; }).join('')}`);
    wireHome();
    root.querySelectorAll('.tt-lvl').forEach(d=> d.addEventListener('click', e=>{ const cc = e.target.closest('[data-cid]'); if(cc){ const c = card(cc.dataset.cid); toast(c.name + ' · livello ' + c.lv + (c.el ? ' · ' + ELEM[c.el][0] : '') + ' · ' + c.r.map(V).join('/'), 3500); } }));
  }
  function rulesPage(){
    shell(`${head('Regole')}<div class="tt-free"><p>Si gioca su un tavolo 3×3 con 5 carte a testa. A turno metti una carta: se un suo lato è <b>più alto</b> del lato che tocca di una carta avversaria, quella carta diventa tua. Vince chi a fine partita possiede più carte (quelle sul tavolo più quella rimasta in mano).</p>
      ${Object.values(RULES).map(r=> `<p><b>${r[0]}</b>: ${esc(r[1])}</p>`).join('')}<p><b>Combo</b>: le carte prese con Same o Plus, a loro volta, catturano le carte avversarie vicine più deboli (a catena).</p>
      <h4>Scambi</h4>${Object.values(TRADES).map(t=> `<p><b>${t[0]}</b>: ${esc(t[1])}</p>`).join('')}
      <h4>Carte</h4><p>500 carte, una per ognuno dei 500 giochi migliori del tuo database: più alto è il voto del gioco, più alto è il livello (1–10) e più forti sono i numeri. A = 10. Alcune carte hanno un elemento. Ogni avversario ha una carta rara da vincere; le carte che ti vince le tiene nel mazzo e puoi riprendertele.</p></div>`);
    wireHome();
  }

  // ---------- scelta del mazzo e partita ----------
  let G = null;
  function setup(n){
    refill();
    const rules = {}; n.rules.forEach(r=> rules[r] = true);
    if(rules.random){ const all = []; Object.entries(S.owned).forEach(([id, k])=>{ for(let i = 0; i < k; i++) all.push(card(id)); }); const hand = all.filter(Boolean).sort(()=> Math.random() - .5).slice(0, 5); start(n, rules, hand); return; }
    const list = ownedList(); let sel = (S.deck || []).filter(id=> S.owned[id]).slice(0, 5);
    const draw = ()=>{
      shell(`${head('Scegli 5 carte')}<div class="tt-prog">${n.face} ${esc(n.n)} · ${ruleChips(n.rules, n.trade)}</div><div class="tt-pickbar"><button class="btn" type="button" id="ttBest">Le 5 più forti</button><button class="btn primary" type="button" id="ttGo" ${sel.length === 5 ? '' : 'disabled'}>Gioca (${sel.length}/5)</button></div>
        <div class="tt-grid">${list.map(c=>{ const k = sel.filter(x=> x === c.id).length; return `<div class="tt-cell">${cardHtml(c, 'p', {sel: k > 0})}${S.owned[c.id] > 1 ? `<i class="tt-n">${k}/${S.owned[c.id]}</i>` : ''}</div>`; }).join('')}</div>`);
      wireHome();
      root.querySelectorAll('.tt-grid [data-cid]').forEach(el=> el.addEventListener('click', ()=>{ const id = +el.dataset.cid, k = sel.filter(x=> x === id).length; if(k && (k >= S.owned[id] || sel.length >= 5)){ sel.splice(sel.lastIndexOf(id), 1); } else if(sel.length < 5) sel.push(id); sfx('tap'); draw(); }));
      root.querySelector('#ttBest').addEventListener('click', ()=>{ sel = []; list.forEach(c=>{ for(let i = 0; i < S.owned[c.id] && sel.length < 5; i++) sel.push(c.id); }); draw(); });
      root.querySelector('#ttGo').addEventListener('click', ()=>{ S.deck = sel.slice(); save(); start(n, rules, sel.map(card)); });
    };
    draw();
  }
  function start(n, rules, hand, round){
    const els = Object.keys(ELEM), cellEl = Array.from({length: 9}, ()=> rules.elem && Math.random() < .35 ? els[Math.floor(Math.random() * els.length)] : null);
    const oppHand = G && round ? G.nextO : npcDeck(n);
    const st = {rules, cellEl, board: Array(9).fill(null), hands: {p: hand.slice(), o: oppHand.slice()}, turn: Math.random() < .5 ? 'p' : 'o'};
    G = {n, st, used: {p: round ? G.used.p : hand.slice(), o: round ? G.used.o : oppHand.slice()}, sel: -1, busy: false, round: round || 1, last: -1};
    drawGame(true);
    if(st.turn === 'o') setTimeout(aiTurn, 900);
  }
  function drawGame(first){
    const st = G.st, s = score(st), open = st.rules.open;
    shell(`${head(esc(G.n.n) + (G.round > 1 ? ' · Sudden Death ' + G.round : ''))}
      <div class="tt-rules">${ruleChips(Object.keys(st.rules).filter(k=> st.rules[k]), G.n.trade)}</div>
      <div class="tt-hand o">${st.hands.o.map((c, i)=> cardHtml(c, 'o', {back: !open})).join('')}</div>
      <div class="tt-mid"><div class="tt-sc o">${G.n.face}<b>${s.o}</b></div>
        <div class="tt-board">${st.board.map((b, i)=> `<div class="tt-slot${st.cellEl[i] ? ' el' : ''}${G.last === i ? ' last' : ''}" data-slot="${i}" style="--i:${i}">${st.cellEl[i] ? `<i class="tt-cel">${ELEM[st.cellEl[i]][1]}</i>` : ''}${b ? cardHtml(b.c, b.o, {mod: mod(st, i)}) : ''}</div>`).join('')}</div>
        <div class="tt-sc p">🦝<b>${s.p}</b></div></div>
      <div class="tt-turn">${full(st) ? '' : st.turn === 'p' ? (G.sel >= 0 ? 'Tocca una casella libera' : 'Tocca una tua carta') : G.n.face + ' sta pensando…'}</div>
      <div class="tt-hand p">${st.hands.p.map((c, i)=> `<div class="tt-hc${G.sel === i ? ' up' : ''}" data-hi="${i}">${cardHtml(c, 'p')}</div>`).join('')}</div>`);
    wireHome();
    if(first) root.querySelector('.tt-board').classList.add('deal');
    root.querySelectorAll('[data-hi]').forEach(el=> el.addEventListener('click', ()=>{ if(G.busy || st.turn !== 'p') return; G.sel = +el.dataset.hi; sfx('tap'); drawGame(); }));
    root.querySelectorAll('[data-slot]').forEach(el=> el.addEventListener('click', ()=>{ const i = +el.dataset.slot; if(G.busy || st.turn !== 'p' || G.sel < 0 || st.board[i]) return; play(G.sel, i); }));
  }
  function banner(t){ const b = document.createElement('div'); b.className = 'tt-banner'; b.textContent = t; root.appendChild(b); sfx('success'); setTimeout(()=> b.remove(), 1100); }
  function play(hi, i){
    G.busy = true;
    const r = place(G.st, hi, i);
    G.st = r.st; G.sel = -1; G.last = i;
    drawGame(); sfx('tap');
    const slot = root.querySelector(`[data-slot="${i}"] .tt-card`); if(slot) slot.classList.add('drop');
    r.ev.filter(e=> e[0] === 'banner').forEach((e, k)=> setTimeout(()=> banner(e[1]), 250 + k * 700));
    r.flipped.forEach((j, k)=> setTimeout(()=>{ const c = root.querySelector(`[data-slot="${j}"] .tt-card`); if(c){ c.classList.add('flip'); sfx('fav'); } }, 120 + k * 90));
    setTimeout(()=>{ G.busy = false; if(full(G.st)) return finish(); if(G.st.turn === 'o') aiTurn(); }, 450 + r.flipped.length * 90 + (r.ev.some(e=> e[0] === 'banner') ? 700 : 0));
  }
  function aiTurn(){
    if(!G || full(G.st)) return;
    drawGame();
    setTimeout(()=>{ const m = aiMove(G.st, G.n.ai); play(m.hi, m.i); }, 650 + Math.random() * 500);
  }
  function finish(){
    const st = G.st, s = score(st);
    const res = s.p > s.o ? 'win' : s.p < s.o ? 'lose' : 'draw';
    if(res === 'draw' && st.rules.sudden && G.round < 5){
      // si rigioca con le carte che ognuno possiede ora (tavolo + mano)
      const mine = st.board.filter(b=> b.o === 'p').map(b=> b.c).concat(st.hands.p), his = st.board.filter(b=> b.o === 'o').map(b=> b.c).concat(st.hands.o);
      G.nextO = his.slice(0, 5); banner('SUDDEN DEATH'); setTimeout(()=> start(G.n, st.rules, mine.slice(0, 5), G.round + 1), 1300); return;
    }
    const nst = npcState(G.n);
    if(res === 'win'){ S.w++; nst.w++; S.pts += 2 + G.n.ai * 2 + Math.max(0, s.p - s.o); sfx('success'); }
    else if(res === 'lose'){ S.l++; nst.l++; sfx('error'); } else { S.d++; S.pts += 1; }
    const trade = G.n.trade, diff = Math.abs(s.p - s.o);
    const opp = G.used.o, mine = G.used.p;
    const doneLog = t=>{ S.log = [{t: Date.now(), x: t}].concat(S.log || []).slice(0, 30); };
    // scambio
    if(trade === 'direct'){
      const got = [], lost = [];
      st.board.forEach(b=>{ if(b.o === 'p' && opp.includes(b.c) && !mine.includes(b.c)) got.push(b.c); if(b.o === 'o' && mine.includes(b.c)) lost.push(b.c); });
      got.forEach(c=>{ give(c.id); if(G.n.id !== 'libera' && npcRare(G.n).id === c.id) nst.rareWon = true; nst.taken = nst.taken.filter(x=> x !== c.id); });
      lost.forEach(c=>{ takeAway(c.id); nst.taken.push(c.id); });
      doneLog('Direct contro ' + G.n.n + ': +' + got.length + ' / −' + lost.length); save();
      return result(res, s, `<p>Regola Direct: tieni le carte che possiedi sul tavolo.</p><p>Vinte: ${got.map(c=> esc(c.name)).join(', ') || 'nessuna'}<br>Perse: ${lost.map(c=> esc(c.name)).join(', ') || 'nessuna'}</p>`);
    }
    if(res === 'draw'){ save(); return result(res, s, '<p>Pareggio: nessuno scambio.</p>'); }
    const n = trade === 'all' ? 5 : trade === 'diff' ? Math.max(1, diff) : 1;
    if(res === 'lose'){
      const taken = mine.slice().sort((a, b)=> (b.lv - a.lv) || (b.r.reduce((x, y)=> x + y) - a.r.reduce((x, y)=> x + y))).slice(0, n);
      taken.forEach(c=>{ takeAway(c.id); nst.taken.push(c.id); });
      doneLog('Perso contro ' + G.n.n + ': −' + taken.map(c=> c.name).join(', ')); save();
      return result(res, s, `<p>${G.n.face} ${esc(G.n.n)} sceglie ${n === 1 ? 'la tua carta' : 'le tue carte'}:</p><div class="tt-hand">${taken.map(c=> cardHtml(c, 'o')).join('')}</div><p><small>Puoi riprendertele sfidandolo di nuovo.</small></p>`);
    }
    // vittoria: scegli tu le carte da prendere
    let chosen = n >= 5 ? opp.map((c, i)=> i) : [];
    const pick = ()=>{
      result(res, s, `<p>Hai vinto! Scegli ${n === 5 ? 'ti prendi tutte le carte' : n + (n === 1 ? ' carta' : ' carte')} dell'avversario:</p><div class="tt-hand pick">${opp.map((c, i)=> `<div class="tt-hc${chosen.includes(i) ? ' up' : ''}" data-take="${i}">${cardHtml(c, 'o')}</div>`).join('')}</div><button class="btn primary" type="button" id="ttTake" ${chosen.length === Math.min(n, opp.length) ? '' : 'disabled'}>Prendi</button>`, true);
      root.querySelectorAll('[data-take]').forEach(el=> el.addEventListener('click', ()=>{ const i = +el.dataset.take; if(chosen.includes(i)) chosen = chosen.filter(x=> x !== i); else if(chosen.length < n) chosen.push(i); sfx('tap'); pick(); }));
      const b = root.querySelector('#ttTake'); if(b) b.addEventListener('click', ()=>{
        const got = chosen.map(i=> opp[i]);
        got.forEach(c=>{ give(c.id); if(G.n.id !== 'libera' && npcRare(G.n).id === c.id){ nst.rareWon = true; toast('✨ Hai vinto la carta rara ' + c.name + '!', 4000); } const k = nst.taken.indexOf(c.id); if(k > -1) nst.taken.splice(k, 1); });
        doneLog('Vinto contro ' + G.n.n + ': +' + got.map(c=> c.name).join(', ')); save(); sfx('success');
        result(res, s, `<p>Nuove carte nella collezione:</p><div class="tt-hand">${got.map(c=> cardHtml(c, 'p')).join('')}</div>`);
      });
    };
    pick();
  }
  function result(res, s, body, keep){
    shell(`${head(res === 'win' ? 'Vittoria!' : res === 'lose' ? 'Sconfitta' : 'Pareggio')}<div class="tt-result ${res}"><div class="tt-big">${res === 'win' ? '🏆' : res === 'lose' ? '💀' : '🤝'} ${s.p} – ${s.o}</div>${body}
      ${keep ? '' : `<div class="tt-menu"><button class="btn primary" type="button" id="ttAgain">Rivincita</button><button class="btn" type="button" data-tt-home2>Menu</button></div>`}</div>`);
    wireHome();
    const a = root.querySelector('#ttAgain'); if(a) a.addEventListener('click', ()=> G.n.free ? setup(G.n) : setup(NPC.find(n=> n.id === G.n.id)));
    const h = root.querySelector('[data-tt-home2]'); if(h) h.addEventListener('click', home);
  }

  window.openTriad = home;
  window.TRIAD = {cards, place, score, aiMove, card, NPC};      // per i test
})();
