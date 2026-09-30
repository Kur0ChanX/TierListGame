// ---- Triple Triad 2.0: il tavolo da gioco (usato da allenamento, due giocatori e online) e le partite locali ----
(function(){
  'use strict';
  const TT = window.TT; if(!TT || TT.playLoaded) return; TT.playLoaded = true;
  const {P, $, $$, esc, sleep, cardHtml, V} = TT;
  const Core = window.TriadCore, CARD = ()=> TT.CARD;
  const EMOJI = ['😀', '😎', '😮', '😢', '😡', '👏', '🔥', '💀', '🤝', '🦝', '⭐', '🍀'];
  TT.EMOJI = EMOJI;
  const RULE_N = {elemental: 'Elementale', same: 'Same', sameWall: 'Muro', plus: 'Plus', combo: 'Combo', special: 'Caselle speciali', sudden: 'Morte improvvisa'};
  const TRADE_N = {one: 'Uno', diff: 'Diff', direct: 'Diretto', all: 'Tutto'};
  const TRADE_D = {one: 'Il vincitore prende 1 carta a scelta tra le 5 del perdente.', diff: 'Il vincitore prende tante carte quanti punti di scarto (max 5).', direct: 'Ognuno prende le carte che ha girato all\'altro.', all: 'Il vincitore prende tutte e 5 le carte del perdente.'};
  Object.assign(TT, {RULE_N, TRADE_N, TRADE_D});
  const ruleChips = (r, trade)=> Object.keys(RULE_N).filter(k=> r[k]).map(k=> `<span class="tt2-chip r">${RULE_N[k]}</span>`).join('') + (trade ? `<span class="tt2-chip t" title="${esc(TRADE_D[trade])}">Scambio: ${TRADE_N[trade]}</span>` : '');
  TT.ruleChips = ruleChips;
  const cloneSt = s=> JSON.parse(JSON.stringify(s));
  const cobj = cid=>{ const c = CARD()[cid]; return {id: c.id, v: c.v, e: c.e}; };
  TT.cobj = cobj;

  // =====================================================================================================
  // IL TAVOLO
  // =====================================================================================================
  // opt: {state, me (0|1: chi sta in basso), names:[{nick, av, sub}, {...}], title, hidden(seat, st)->bool, canPlay(seat, st)->bool, onPlay(hi, cell)->Promise<{state, events}|null>,
  //       quit(), emotes, onEmote(e), timer}
  TT.mountBoard = function(opt){
    const R = TT.root(); let st = opt.state, sim = cloneSt(st), sel = null, pend = null, busy = false, q = Promise.resolve(), timerIv = 0, dead = false, thinking = false, deadline = 0, total = 0;
    const me = opt.me == null ? 0 : opt.me, top = 1 - me;
    R.innerHTML = `<div class="tt2-top"><button class="tt2-ib" data-quit aria-label="Esci">✕</button><b>${esc(opt.title || 'Triple Triad')}</b><button class="tt2-ib" data-info aria-label="Regole in gioco">ⓘ</button></div>
      <div class="tt2-play" id="ttPlay">
        <div class="tt2-pl o" id="plTop"></div><div class="tt2-hand" id="hTop"></div>
        <div class="tt2-table" data-tb="${P.board}"><div class="tt2-grid3" id="g3"></div></div>
        <div class="tt2-hand me" id="hBot"></div><div class="tt2-pl" id="plBot"></div>
        ${opt.emotes ? `<div class="tt2-emo" id="emo">${EMOJI.map((e, i)=> `<button data-e="${i}">${e}</button>`).join('')}</div>` : ''}
        <div class="mut" id="ttInfo" style="text-align:center;font-size:.74rem;min-height:1.1em"></div>
      </div>`;
    const play = $('#ttPlay', R), g3 = $('#g3', R);
    const seatPanel = (seat, id)=>{ const n = opt.names[seat] || {nick: '?', av: '🙂'}; $(id, R).className = 'tt2-pl' + (seat === 1 ? ' o' : '') + (st.turn === seat ? ' turn' : ''); $(id, R).innerHTML = `<div class="av">${n.av || '🙂'}</div><div class="nm">${esc(n.nick)}${n.sub ? `<small>${esc(n.sub)}</small>` : ''}</div><div class="tt2-tm" id="tm${seat}" style="display:none"></div><div class="sc" id="sc${seat}">5</div>`; };
    const elMods = (card, cell, s)=>{ const el = s.squares[cell]; if(el === 'boost') return [2, 2, 2, 2]; if(el === 'trap') return [-2, -2, -2, -2]; if(!s.rules.elemental || !el) return [0, 0, 0, 0]; const d = card.e === el ? 1 : -1; return [d, d, d, d]; };
    const hidden = seat=> opt.hidden ? opt.hidden(seat, st) : false, fo = c=> (opt.foil && c ? opt.foil(c.u) | 0 : 0);
    function handHtml(seat){ const hide = hidden(seat); return sim.hands[seat].map((c, hi)=> `<div class="sl${hide ? ' back' : ''}" data-hi="${hi}" data-seat="${seat}">${c ? cardHtml(c.id, {owner: seat, foil: fo(c)}) : '<div class="ttc used"></div>'}</div>`).join(''); }
    function cellHtml(i){
      const el = sim.squares[i], b = sim.board[i];
      return `<div class="tt2-cell" data-cell="${i}">${el === 'boost' || el === 'trap' ? `<div class="sq sp-${el}">${el === 'boost' ? '+2' : '−2'}</div>` : (sim.rules.elemental && el ? `<div class="sq">${TT.ELEM[el][1]}</div>` : '')}${b ? cardHtml(b.card.id, {owner: b.owner, mods: elMods(b.card, i, sim), foil: fo(b.card)}) : ''}</div>`;
    }
    function renderAll(){
      seatPanel(top, '#plTop'); seatPanel(me, '#plBot');
      $('#hTop', R).className = 'tt2-hand' + (canAct() && st.turn === top ? ' me' : ''); $('#hTop', R).innerHTML = handHtml(top);
      $('#hBot', R).className = 'tt2-hand me'; $('#hBot', R).innerHTML = handHtml(me);
      g3.innerHTML = Array.from({length: 9}, (_, i)=> cellHtml(i)).join('');
      scores(false); refreshSel(); turnInfo();
    }
    const scoreOf = s=>{ const sc = [0, 0]; s.board.forEach(b=>{ if(b) sc[b.owner]++; }); [0, 1].forEach(p=> s.hands[p].forEach(c=>{ if(c) sc[p]++; })); return sc; };
    function scores(bump){ const sc = scoreOf(sim); [0, 1].forEach(p=>{ const e = $('#sc' + p, R); if(!e) return; if(bump && +e.textContent !== sc[p]){ e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } e.textContent = sc[p]; }); }
    function canAct(){ return !busy && !dead && !st.over && !thinking && (opt.canPlay ? opt.canPlay(st.turn, st) : false); }
    function turnInfo(){
      const t = $('#ttInfo', R); if(!t) return;
      [top, me].forEach((s, i)=>{ const pl = $(i ? '#plBot' : '#plTop', R); pl && pl.classList.toggle('turn', st.turn === s && !st.over); });
      if(st.over){ t.textContent = ''; return; }
      const n = opt.names[st.turn] || {nick: '?'};
      t.textContent = thinking ? n.nick + ' sta pensando…' : (canAct() ? (opt.turnMsg ? opt.turnMsg(st) : 'Tocca una tua carta, poi una casella') : busy ? '' : 'Turno di ' + n.nick + '…');
      $('#hTop', R).classList.toggle('me', canAct() && st.turn === top);
    }
    function refreshSel(){
      $$('.sl .ttc', R).forEach(c=> c.classList.remove('sel'));
      $$('.tt2-cell', R).forEach(c=> c.classList.remove('ok'));
      if(sel != null && canAct()){
        const sl = $(`.sl[data-seat="${st.turn}"][data-hi="${sel}"] .ttc`, R); sl && sl.classList.add('sel');
        $$('.tt2-cell', R).forEach(c=>{ if(!sim.board[+c.dataset.cell]) c.classList.add('ok'); });
      }
    }
    function clearPreview(){ pend = null; $$('.ttc.ghost', R).forEach(e=> e.remove()); $$('.tt2-cell.will', R).forEach(e=> e.classList.remove('will')); $$('.tt2-pop', R).forEach(e=> e.remove()); }
    function preview(cell){
      clearPreview(); const r = Core.play(st, {hi: sel, cell}); if(!r.ok) return;
      const card = st.hands[st.turn][sel], cellEl = $(`.tt2-cell[data-cell="${cell}"]`, R);
      cellEl.insertAdjacentHTML('beforeend', cardHtml(card.id, {owner: st.turn, cls: 'ghost', mods: elMods(card, cell, st)}));
      const fl = r.events.filter(e=> e.t === 'flip').map(e=> e.cell), rules = r.events.filter(e=> e.t === 'rule').map(e=> e.rule);
      fl.forEach(c=> $(`.tt2-cell[data-cell="${c}"]`, R).classList.add('will'));
      pend = {hi: sel, cell};
      $('#ttInfo', R).textContent = (fl.length ? 'Prendi ' + fl.length + (fl.length === 1 ? ' carta' : ' carte') : 'Nessuna carta presa') + (rules.length ? ' · ' + rules.map(x=> x.toUpperCase()).join(' + ') : '') + ' — tocca ancora per giocare';
    }
    async function commit(hi, cell){
      clearPreview(); sel = null; busy = true; refreshSel(); turnInfo();
      let r = null;
      try{ r = await opt.onPlay(hi, cell); }catch(e){ busy = false; refreshSel(); turnInfo(); TT.toast(e && e.message || 'Mossa non riuscita'); return; }
      busy = false;
      if(r) await ctrl.apply(r.state, r.events);
      else { refreshSel(); turnInfo(); }
    }
    R.addEventListener('click', e=>{
      if(dead) return;
      const sl = e.target.closest('.sl'), cell = e.target.closest('.tt2-cell');
      if(sl && canAct() && +sl.dataset.seat === st.turn && !sl.classList.contains('back')){
        const hi = +sl.dataset.hi; if(!sim.hands[st.turn][hi]) return;
        clearPreview(); sel = sel === hi ? null : hi; TT.snd('click'); refreshSel(); turnInfo(); return;
      }
      if(cell && sel != null && canAct()){
        const c = +cell.dataset.cell; if(sim.board[c]) return;
        if(P.confirm && !(pend && pend.cell === c)){ TT.snd('click'); preview(c); return; }
        commit(sel, c);
      }
    });
    const qb = $('[data-quit]', R); qb && qb.addEventListener('click', ()=>{ TT.snd('click'); opt.quit && opt.quit(); });
    const ib = $('[data-info]', R); ib && ib.addEventListener('click', ()=>{ const c = st.rules, l = Object.keys(RULE_N).filter(k=> c[k]).map(k=> RULE_N[k]); TT.modal(`<h3 style="margin-top:0">Regole di questa partita</h3><div class="tt2-row">${ruleChips(c, c.trade)}</div><p class="mut">${esc(TRADE_D[c.trade])}</p><p class="mut">Round ${st.round}/${Core.MAX_ROUNDS}. Le caselle con il simbolo hanno un elemento: +1 alle carte dello stesso elemento, −1 alle altre.</p><div class="tt2-row c"><button class="tt2-btn pri" data-mclose>Ok</button></div>`, {center: true}); });
    $$('#emo [data-e]', R).forEach(b=> b.addEventListener('click', ()=>{ opt.onEmote && opt.onEmote(+b.dataset.e); ctrl.emote(me, +b.dataset.e); }));
    // dimensioni: la carta si adatta allo schermo
    function fit(){
      const H = play.clientHeight, W = play.clientWidth; if(!H) return;
      const extra = 46 + 46 + 18 + (opt.emotes ? 40 : 0) + 34 + 30;
      const cw = Math.max(54, Math.min(132, Math.floor(Math.min((H - extra) / 5.94, (W - 44) / 3))));
      play.style.setProperty('--cw', cw + 'px');
    }
    const onRes = ()=> fit(); window.addEventListener('resize', onRes); setTimeout(fit, 0); setTimeout(fit, 250);

    function banner(text, cls, small){ const b = document.createElement('div'); b.className = 'tt2-banner ' + (cls || ''); b.innerHTML = esc(text) + (small ? `<small>${esc(small)}</small>` : ''); play.appendChild(b); setTimeout(()=> b.remove(), 1250); }
    function pop(cell, text, cls){ const c = $(`.tt2-cell[data-cell="${cell}"]`, R); if(!c) return; const p = document.createElement('div'); p.className = 'tt2-pop ' + cls; p.textContent = text; p.style.left = '50%'; p.style.top = '30%'; p.style.transform = 'translateX(-50%)'; c.appendChild(p); setTimeout(()=> p.remove(), 950); }
    const D = ms=> P.fast ? Math.min(ms, 70) : ms;
    async function run(newSt, events){
      if(dead) return;
      const wasMyTurn = canAct(); busy = true; clearPreview(); sel = null; refreshSel(); thinking = false;
      let sudden = false;
      for(const ev of events){
        if(dead) return;
        if(ev.t === 'place'){
          const card = ev.card, cellEl = $(`.tt2-cell[data-cell="${ev.cell}"]`, R);
          sim.hands[ev.p][ev.hi] = null; sim.board[ev.cell] = {card, owner: ev.p};
          const slot = $(`.sl[data-seat="${ev.p}"][data-hi="${ev.hi}"]`, R); if(slot){ slot.classList.remove('back'); slot.innerHTML = '<div class="ttc used"></div>'; }
          if(cellEl){ $$('.ttc', cellEl).forEach(x=> x.remove()); cellEl.insertAdjacentHTML('beforeend', cardHtml(card.id, {owner: ev.p, cls: 'drop', mods: elMods(card, ev.cell, sim), foil: fo(card)})); }
          TT.snd('place'); scores(true);
          const el = sim.squares[ev.cell]; if(el === 'boost' || el === 'trap') setTimeout(()=> pop(ev.cell, el === 'boost' ? '+2' : '−2', el === 'boost' ? 'up' : 'dn'), 120); else if(sim.rules.elemental && el) setTimeout(()=> pop(ev.cell, card.e === el ? '+1' : '−1', card.e === el ? 'up' : 'dn'), 120);
          await sleep(D(430));
        } else if(ev.t === 'rule'){
          banner(ev.rule === 'same' ? (ev.wall ? 'SAME · MURO' : 'SAME!') : ev.rule === 'plus' ? 'PLUS!' : 'COMBO!', ev.rule);
          TT.snd(ev.rule); TT.vib(30); await sleep(D(720));
        } else if(ev.t === 'flip'){
          const b = sim.board[ev.cell]; if(!b) continue; b.owner = ev.to;
          const c = $(`.tt2-cell[data-cell="${ev.cell}"] .ttc`, R);
          if(c){ c.classList.remove('drop'); c.classList.add('flip'); setTimeout(()=>{ c.dataset.o = ev.to; }, 230); setTimeout(()=> c.classList.remove('flip'), 600); }
          TT.snd('flip'); scores(true); await sleep(D(300));
        } else if(ev.t === 'sudden'){
          sudden = true; banner('MORTE IMPROVVISA', 'sudden', 'Manche ' + ev.round); TT.snd('sud'); TT.vib([60, 40, 60]); await sleep(D(1500));
        }
      }
      st = newSt; sim = cloneSt(newSt); busy = false;
      if(sudden || mismatch()) renderAll(); else { scores(false); refreshSel(); turnInfo(); }
      turnInfo();
      if(!st.over && !wasMyTurn && canAct()){ TT.snd('turn'); TT.vib(15); }
      if(deadline) startTimer(deadline, total);
    }
    function mismatch(){ for(let i = 0; i < 9; i++){ const a = st.board[i], el = $(`.tt2-cell[data-cell="${i}"] .ttc`, R); if(!!a !== !!el) return true; if(a && el && +el.dataset.o !== a.owner) return true; } return false; }
    function startTimer(dl, tot){
      deadline = dl; total = tot || 60000; clearInterval(timerIv);
      const upd = ()=>{
        if(dead || st.over){ clearInterval(timerIv); [0, 1].forEach(s=>{ const e = $('#tm' + s, R); e && (e.style.display = 'none'); }); return; }
        const left = Math.max(0, deadline - Date.now()), frac = Math.min(1, left / total), sec = Math.ceil(left / 1000);
        [0, 1].forEach(s=>{ const e = $('#tm' + s, R); if(!e) return; e.style.display = s === st.turn ? '' : 'none'; if(s !== st.turn) return; const col = sec <= 10 ? '#ff5468' : '#ffe27a'; e.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(94.2 * frac).toFixed(1)} 94.2"/></svg><b>${sec}</b>`; });
        if(sec <= 5 && sec > 0 && canAct() && upd.last !== sec){ upd.last = sec; TT.snd('tick'); }
      };
      upd(); timerIv = setInterval(upd, 250);
    }
    function confetti(){ const c = document.createElement('div'); c.className = 'tt2-confetti'; const cols = ['#ffe27a', '#7dffa3', '#8fd3ff', '#ff9ad5', '#ff8f6b']; for(let i = 0; i < 70; i++){ const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length]; p.style.animationDuration = (2 + Math.random() * 2.2) + 's'; p.style.animationDelay = Math.random() * .8 + 's'; c.appendChild(p); } R.appendChild(c); setTimeout(()=> c.remove(), 5200); }
    // schermata finale. cfg: {kind, title, sub, cards:[{cid, label, cls}], pick:{n, choices:[{u, cid}], onPick(list)}, buttons:[{label, cls, fn}]}
    function showEnd(cfg){
      const el = document.createElement('div'); el.className = 'tt2-end ' + cfg.kind;
      const draw = ()=>{
        el.innerHTML = `<h2>${esc(cfg.title)}</h2>${cfg.sub ? `<div style="opacity:.9">${cfg.sub}</div>` : ''}
          ${cfg.cards && cfg.cards.length ? `<div class="tt2-take">${cfg.cards.map(c=> `<div class="cw">${cardHtml(c.cid, {})}<div class="mut" style="text-align:center;font-size:.7rem;margin-top:4px;color:${c.cls === 'bad' ? '#ff8f9a' : '#7dffa3'}">${esc(c.label)}</div></div>`).join('')}</div>` : ''}
          ${cfg.pick ? `<p><b>Scegli ${cfg.pick.n === 1 ? 'la carta' : cfg.pick.n + ' carte'} da prendere</b></p><div class="tt2-take" id="pkGrid">${cfg.pick.choices.map(c=> `<div class="cw${cfg.pick.sel.includes(c.u) ? ' sel' : ''}" data-u="${c.u}">${cardHtml(c.cid, {owner: 1 - cfg.pick.by})}</div>`).join('')}</div><button class="tt2-btn gold" id="pkOk" ${cfg.pick.sel.length === cfg.pick.n ? '' : 'disabled'}>Prendi ${cfg.pick.sel.length}/${cfg.pick.n}</button>` : ''}
          <div class="tt2-row c" style="margin-top:8px">${(cfg.buttons || []).map((b, i)=> `<button class="tt2-btn ${b.cls || ''}" data-b="${i}">${b.label}</button>`).join('')}</div>`;
        $$('[data-b]', el).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); cfg.buttons[+b.dataset.b].fn(el); }));
        if(cfg.pick){
          $$('[data-u]', el).forEach(b=> b.addEventListener('click', ()=>{ const u = +b.dataset.u, s = cfg.pick.sel, i = s.indexOf(u); if(i >= 0) s.splice(i, 1); else if(s.length < cfg.pick.n) s.push(u); else if(cfg.pick.n === 1){ s[0] = u; } TT.snd('click'); draw(); }));
          $('#pkOk', el).addEventListener('click', ()=>{ $('#pkOk', el).disabled = true; cfg.pick.onPick(cfg.pick.sel.slice(), el); });
        }
      };
      draw(); R.appendChild(el); el.redraw = draw; el.cfg = cfg;
      if(cfg.kind === 'win'){ TT.snd('win'); confetti(); TT.vib([80, 50, 80, 50, 160]); } else if(cfg.kind === 'lose'){ TT.snd('lose'); TT.vib(200); } else TT.snd('same');
      return el;
    }
    const ctrl = {
      apply(newSt, events){ q = q.then(()=> run(newSt, events || [])).catch(e=> console.log('anim', e)); return q; },
      setThinking(v){ thinking = v; turnInfo(); }, setState(s){ st = s; sim = cloneSt(s); renderAll(); }, get state(){ return st; }, banner, showEnd, confetti, startTimer, pop,
      emote(seat, e){ const pl = $(seat === me ? '#plBot' : '#plTop', R); if(!pl) return; pl.style.position = 'relative'; const b = document.createElement('div'); b.className = 'tt2-bubble'; b.textContent = EMOJI[e] || '🙂'; pl.appendChild(b); if(seat !== me) TT.snd('emote'); setTimeout(()=> b.remove(), 1900); },
      refresh(){ turnInfo(); refreshSel(); }, renderAll, setNames(n){ opt.names = n; renderAll(); },
      destroy(){ dead = true; clearInterval(timerIv); window.removeEventListener('resize', onRes); },
      get busy(){ return busy || thinking; }
    };
    renderAll();
    if(opt.timer) startTimer(opt.timer.deadline, opt.timer.total);
    return ctrl;
  };

  // =====================================================================================================
  // PARTITE LOCALI: allenamento (contro l'IA) e due giocatori sullo stesso telefono
  // =====================================================================================================
  const NPC = [
    {id: 'frugu', n: 'Frugu', r: 'Il Bidone', lv: [1, 2], ai: 1, rules: {}, trade: 'one', face: '🦝'},
    {id: 'studente', n: 'Studente del Garden', r: 'Balamb', lv: [1, 3], ai: 1, rules: {elemental: true}, trade: 'one', face: '🧑‍🎓'},
    {id: 'soldato', n: 'Soldato di Galbadia', r: 'Galbadia', lv: [2, 4], ai: 2, rules: {same: true}, trade: 'one', face: '💂'},
    {id: 'bardo', n: 'Bardo di Dollet', r: 'Dollet', lv: [3, 5], ai: 2, rules: {elemental: true, same: true}, trade: 'one', face: '🎻'},
    {id: 'ribelle', n: 'Ribelle di Timber', r: 'Timber', lv: [4, 6], ai: 3, rules: {same: true, plus: true, combo: true}, trade: 'one', face: '🧢'},
    {id: 'nonna', n: 'Nonna di Trabia', r: 'Trabia', lv: [5, 7], ai: 3, rules: {plus: true, combo: true, elemental: true}, trade: 'one', face: '👵'},
    {id: 'esploratore', n: 'Esploratore di Centra', r: 'Centra', lv: [6, 8], ai: 4, rules: {same: true, plus: true, combo: true}, trade: 'diff', face: '🧭'},
    {id: 'scienziata', n: 'Scienziata di Esthar', r: 'Esthar', lv: [7, 9], ai: 4, rules: {elemental: true, same: true, sameWall: true, plus: true, combo: true}, trade: 'diff', face: '🔬'},
    {id: 'regina', n: 'Regina delle Carte', r: 'Ovunque', lv: [7, 10], ai: 5, rules: {special: true, elemental: true, same: true, plus: true, combo: true}, trade: 'direct', face: '👸'},
    {id: 're', n: 'Re del Club', r: 'Club delle Carte', lv: [8, 10], ai: 5, rules: {elemental: true, same: true, sameWall: true, plus: true, combo: true}, trade: 'one', face: '🤴'},
    {id: 'leggenda', n: 'Il Procione Leggendario', r: 'Base Lunare', lv: [9, 10], ai: 5, rules: {elemental: true, same: true, sameWall: true, plus: true, combo: true}, trade: 'all', face: '🌕'}
  ];
  const AI_N = ['', 'Principiante', 'Normale', 'Esperto', 'Maestro', 'Campione'];
  TT.NPC = NPC;
  function npcDeck(n){
    const pool = TT.LIST.filter(c=> c.lv >= n.lv[0] && c.lv <= n.lv[1]).sort(()=> Math.random() - .5), high = pool.filter(c=> c.lv >= n.lv[1] - 1);
    const out = []; [high, pool].forEach(l=> l.forEach(c=>{ if(out.length < 5 && !out.includes(c.id) && (l !== high || out.length < 2)) out.push(c.id); }));
    return out.slice(0, 5);
  }
  // Sfida del giorno: regole speciali uguali per tutti, decise dalla data (serie di vittorie in jrpg_triad_daily)
  const dayKey = ()=> new Date().toISOString().slice(0, 10);
  function dailyNpc(){
    const k = dayKey(), h = TT.hash ? TT.hash(k) : k.split('').reduce((a, c)=> (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const sets = [
      {n: 'Giornata delle trappole', rules: {elemental: true, special: true}},
      {n: 'Giornata del Same', rules: {same: true, sameWall: true, special: true}},
      {n: 'Giornata del Plus', rules: {plus: true, combo: true, special: true}},
      {n: 'Giornata senza elementi', rules: {same: true, plus: true, combo: true}},
      {n: 'Giornata elementale', rules: {elemental: true, same: true, special: true}},
      {n: 'Giornata totale', rules: {elemental: true, same: true, sameWall: true, plus: true, combo: true, special: true}}
    ], d = sets[h % sets.length], ai = 2 + (h >>> 3) % 3, lv = 3 + (h >>> 5) % 4;
    let st = {}; try{ st = JSON.parse(localStorage.getItem('jrpg_triad_daily') || '{}') || {}; }catch(e){}
    const done = st.last === k;
    return {id: 'daily', daily: true, n: 'Sfida del giorno · ' + d.n, r: done ? 'Già vinta oggi ✔ · serie ' + (st.streak || 0) : 'Serie ' + (st.streak || 0) + ' giorni', lv: [lv, lv + 3], ai, rules: d.rules, trade: 'one', face: '🎯'};
  }
  function dailyWin(){
    let st = {}; try{ st = JSON.parse(localStorage.getItem('jrpg_triad_daily') || '{}') || {}; }catch(e){}
    const k = dayKey(); if(st.last === k) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    st.streak = st.last === y ? (st.streak || 0) + 1 : 1; st.last = k; st.best = Math.max(st.best || 0, st.streak);
    try{ localStorage.setItem('jrpg_triad_daily', JSON.stringify(st)); }catch(e){}
    try{ if(TT.toast) TT.toast('🎯 Sfida del giorno vinta! Serie: ' + st.streak); }catch(e){}
  }
  TT.dailyNpc = dailyNpc;
  TT.npcList = function(){
    const S = TT.save();
    TT.screen('Allenamento', `<p class="mut" style="text-align:center">Sfida gli avversari con la tua collezione dell'album. Contro l'IA non perdi mai carte: se vinci, ne prendi una.</p><div class="tt2-list">${[dailyNpc()].concat(NPC).map((n, i0)=>{ const i = i0 - 1, rec = S.npc[n.id] || {w: 0, l: 0}; return `<button class="tt2-item" data-n="${i}"><div class="av">${n.face}</div><div class="tx"><b>${esc(n.n)}</b><small>${esc(n.r)} · IA ${AI_N[n.ai]} · carte livello ${n.lv[0]}–${n.lv[1]}</small><div style="margin-top:3px">${ruleChips(Object.assign({sudden: true}, n.rules), n.trade)}</div></div><div class="rt">${rec.w}V ${rec.l}S</div></button>`; }).join('')}</div>`);
    $$('[data-n]').forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); TT.go(npcSetup, +b.dataset.n); }));
  };
  function localItems(){ const S = TT.save(); const items = []; Object.keys(S.owned).forEach(cid=>{ if(CARD()[cid]) for(let i = 0; i < S.owned[cid]; i++) items.push({key: cid + '#' + i, cid}); }); return items; }
  function npcSetup(i){
    const n = i < 0 ? dailyNpc() : NPC[i]; TT.refill();
    TT.pickDeck({title: 'Contro ' + n.n, sub: `${n.face} ${esc(n.n)} · ${esc(n.r)}<br>${ruleChips(Object.assign({sudden: true}, n.rules), n.trade)}<br><small>${esc(TRADE_D[n.trade])}</small>`, items: localItems(), ok: 'Gioca', onDone: keys=>{
      const mine = keys.map(k=> k.split('#')[0]);
      startLocal({title: n.n, names: [{nick: 'Tu', av: '🦝', sub: 'Blu'}, {nick: n.n, av: n.face, sub: n.r}], hands: [mine, npcDeck(n)], rules: Object.assign({sudden: true, trade: n.trade}, n.rules), ai: n.ai, npc: n, back: ()=> TT.go(npcSetup, i)});
    }});
  }
  TT.hotseat = function(){
    const S = TT.save(), R = {elemental: true, same: true, plus: false, sameWall: false, combo: true, sudden: true};
    const draw = ()=>{
      TT.screen('Due giocatori', `<p class="mut" style="text-align:center">Si gioca in due sullo stesso telefono, con le carte del tuo album. Prima sceglie il giocatore 1 (il 2 non guarda), poi il giocatore 2.</p>
        <div class="tt2-box">${Object.keys(RULE_N).map(k=> `<label class="chk"><input type="checkbox" data-r="${k}" ${R[k] ? 'checked' : ''} ${k === 'sameWall' && !R.same ? 'disabled' : ''}> ${RULE_N[k]}</label>`).join('')}</div>
        <button class="tt2-btn pri w" id="hsGo">Avanti: scelta dei mazzi</button>`);
      $$('[data-r]').forEach(c=> c.addEventListener('change', ()=>{ R[c.dataset.r] = c.checked; if(!R.same) R.sameWall = false; draw(); }));
      $('#hsGo').addEventListener('click', ()=>{
        const items = localItems(); if(items.length < 10){ TT.toast('Servono almeno 10 carte nell\'album per giocare in due'); return; }
        TT.pickDeck({title: 'Giocatore 1: scegli 5 carte', sub: 'Giocatore 2, non guardare!', items, ok: 'Fatto', back: draw, onDone: k1=>{
          const rest = items.filter(i=> !k1.includes(i.key));
          TT.pickDeck({title: 'Giocatore 2: scegli 5 carte', sub: 'Giocatore 1, non guardare!', items: rest, ok: 'Gioca', back: draw, onDone: k2=>{
            startLocal({title: 'Due giocatori', names: [{nick: 'Giocatore 1', av: '🔵', sub: 'Blu'}, {nick: 'Giocatore 2', av: '🔴', sub: 'Rosso'}], hands: [k1.map(k=> k.split('#')[0]), k2.map(k=> k.split('#')[0])], rules: Object.assign({trade: 'one'}, R), ai: 0, hot: true, back: TT.hotseat});
          }});
        }});
      });
    };
    draw();
  };
  function startLocal(cfg){
    const rules = Core.normRules(cfg.rules), seed = Math.floor(Math.random() * 4294967296);
    let st = Core.newGame({rules, seed, first: Math.random() < .5 ? 1 : 0, hands: [cfg.hands[0].map(TT.cobj), cfg.hands[1].map(TT.cobj)]});
    let board = null, over = false, veil = false;
    const cover = (seat, cb)=>{                                   // «passa il telefono» tra un turno e l'altro nei due giocatori
      veil = true; if(board) board.renderAll();
      const m = TT.modal(`<div style="text-align:center"><div style="font-size:2.6rem">${seat ? '🔴' : '🔵'}</div><h3>Tocca a ${esc(cfg.names[seat].nick)}</h3><p class="mut">Passa il telefono: le carte dell'altro restano coperte.</p><button class="tt2-btn pri w" data-go>Sono pronto</button></div>`, {center: true, sticky: true});
      $('[data-go]', m).addEventListener('click', ()=>{ m.remove(); veil = false; board.renderAll(); cb && cb(); });
    };
    function mount(){
      veil = !!(cfg.hot && P.hide);
      board = TT.mountBoard({
        state: st, me: 0, names: cfg.names, title: cfg.title,
        hidden: (seat, s)=> cfg.hot && P.hide ? (veil || s.turn !== seat) : false,
        canPlay: (seat, s)=> !s.over && (cfg.hot ? true : seat === 0),
        onPlay: async (hi, cell)=>{ const r = Core.play(st, {hi, cell}); if(!r.ok) throw new Error(r.error); st = r.state; setTimeout(after, 0); return r; },
        quit: async ()=>{ if(over || await TT.ask('Vuoi uscire dalla partita?', 'Esci', 'Continua')){ board.destroy(); TT.back(); } },
        turnMsg: s=> cfg.hot ? cfg.names[s.turn].nick + ': tocca una carta, poi una casella' : 'Tocca una tua carta, poi una casella'
      });
      st = board.state || st;
      if(cfg.hot && P.hide) setTimeout(()=> cover(st.turn), 300); else if(!cfg.hot && st.turn === 1) aiTurn();
    }
    async function after(){
      await new Promise(r=> setTimeout(r, 30));
      await waitIdle();
      if(st.over) return finish();
      if(cfg.hot){ if(P.hide) cover(st.turn); return; }
      if(st.turn === 1) aiTurn();
    }
    const waitIdle = async ()=>{ let n = 0; while(board.busy && n++ < 200) await sleep(60); };
    async function aiTurn(){
      board.setThinking(true); await sleep(P.fast ? 150 : 700 + Math.random() * 500);
      await new Promise(r=> setTimeout(r, 20));
      const mv = Core.ai(st, cfg.ai), r = Core.play(st, mv); if(!r.ok){ board.setThinking(false); return; }
      st = r.state; board.setThinking(false); await board.apply(st, r.events);
      if(st.over) finish();
    }
    async function finish(){
      if(over) return; over = true; await sleep(P.fast ? 200 : 700);
      const res = st.result, S = TT.save(), w = res.winner, sc = res.score;
      const won = w === 0, draw = w == null, info = Core.tradeInfo(st);
      if(!cfg.hot && !cfg.arena){ S.stats[won ? 'w' : draw ? 'd' : 'l']++; if(won){ S.stats.streak++; S.stats.best = Math.max(S.stats.best || 0, S.stats.streak); } else if(!draw) S.stats.streak = 0; if(cfg.npc && cfg.npc.daily && won) dailyWin(); if(cfg.npc){ const r = S.npc[cfg.npc.id] = S.npc[cfg.npc.id] || {w: 0, l: 0}; if(won) r.w++; else if(!draw) r.l++; } }
      const btns = [{label: 'Rivincita', cls: 'pri', fn: ()=>{ board.destroy(); if(cfg.npc) cfg.hands[1] = npcDeck(cfg.npc); startLocal(cfg); }}, {label: 'Esci', fn: ()=>{ board.destroy(); TT.saveS(); TT.back(); }}];
      const gain = ids=>{ ids.forEach(id=>{ S.owned[id] = (S.owned[id] || 0) + 1; }); TT.saveS(); };
      if(cfg.arena){ board.destroy(); cfg.arena(won, draw, sc); return; }
      if(!cfg.hot && won && info.pick > 0){
        const sel = [], choices = [0, 1, 2, 3, 4].map(i=> ({u: 5 + i, cid: cfg.hands[1][i]}));
        const el = board.showEnd({kind: 'win', title: 'HAI VINTO!', sub: `${sc[0]} a ${sc[1]}`, pick: {n: info.pick, choices, sel, by: 0, onPick: list=>{ gain(list.map(u=> cfg.hands[1][u - 5])); TT.snd('coin'); el.remove(); board.showEnd({kind: 'win', title: 'CARTE PRESE!', sub: 'Sono nel tuo album', cards: list.map(u=> ({cid: cfg.hands[1][u - 5], label: 'Nuova nel mazzo'})), buttons: btns}); }}});
        return;
      }
      if(!cfg.hot && won){ const ids = info.auto.filter(t=> t.to === 0).map(t=> t.id); gain(ids); board.showEnd({kind: 'win', title: 'HAI VINTO!', sub: `${sc[0]} a ${sc[1]}`, cards: ids.map(id=> ({cid: id, label: 'Presa!'})), buttons: btns}); return; }
      TT.saveS();
      if(cfg.hot) board.showEnd({kind: draw ? 'draw' : 'win', title: draw ? 'PAREGGIO' : cfg.names[w].nick.toUpperCase() + ' VINCE!', sub: `${sc[0]} a ${sc[1]}`, buttons: btns});
      else board.showEnd({kind: draw ? 'draw' : 'lose', title: draw ? 'PAREGGIO' : 'HAI PERSO', sub: `${sc[0]} a ${sc[1]}${draw ? '' : '<br><small>Contro l\'IA non perdi nessuna carta.</small>'}`, buttons: btns});
    }
    mount();
    return {board: ()=> board};
  }
  TT.startLocal = startLocal;

  // =====================================================================================================
  // LA TORRE INFINITA (offline): sali piano dopo piano con 5 carte che si potenziano; ogni piano è più duro. Se perdi, i piani superati ti fruttano carte.
  // =====================================================================================================
  const TKEY = 'jrpg_triad_tower', SIDEN = ['in alto', 'a destra', 'in basso', 'a sinistra'], ELN = ['fuoco', 'ghiaccio', 'tuono', 'terra', 'veleno', 'vento', 'acqua', 'sacro'];
  const tload = ()=> Object.assign({best: 0, runs: 0, run: null}, TT.LS.get(TKEY, {}) || {}), tsave = T=> TT.LS.set(TKEY, T);
  const pickOf = arr=> arr[Math.floor(Math.random() * arr.length)];
  function towerOpp(f){
    const boss = f % 10 === 0, avg = Math.min(9.6, 1 + f * .42), deck = [];
    const rules = f < 3 ? {} : f < 6 ? {elemental: true} : f < 10 ? {elemental: true, same: true} : (f < 15 && !boss) ? {elemental: true, same: true, plus: true, combo: true} : {elemental: true, same: true, sameWall: true, plus: true, combo: true};
    let guard = 0;
    while(deck.length < 5 && guard++ < 80){ const lv = Math.max(1, Math.min(10, Math.round(avg + (boss ? 1 : 0) + (Math.random() * 2.4 - 1.2)))), c = pickOf(TT.LIST.filter(x=> x.lv === lv)); if(!deck.includes(c.id)) deck.push(c.id); }
    return {deck, rules, ai: f < 4 ? 1 : f < 8 ? 2 : f < 13 ? 3 : f < 20 ? 4 : 5, boss, avg: Math.round(avg * 10) / 10, name: boss ? 'Guardiano del piano ' + f : 'Sfidante del piano ' + f, face: boss ? '👹' : pickOf(['🧙', '🥷', '🤖', '👽', '🦹', '🧛', '🐉', '🦂'])};
  }
  const tv = (run, i)=> TT.CARD[run.deck[i]].v.map((x, k)=> Math.min(10, x + run.buff[i][k]));
  const tcard = (run, i)=> ({id: run.deck[i], v: tv(run, i), e: run.elem[i] || TT.CARD[run.deck[i]].e});
  const towerMini = (run, i)=> { const c = tcard(run, i), b = run.buff[i]; return `<div class="cw">${cardHtml(c.id, {mods: b.map(x=> x)})}<div class="mut" style="text-align:center;font-size:.62rem">${b.some(x=> x) ? '💪 +' + b.reduce((a, x)=> a + x, 0) : ''}${run.elem[i] ? ' ' + TT.ELEM[run.elem[i]][1] : ''}</div></div>`; };
  TT.tower = function(){
    const T = tload(), run = T.run;
    if(!run){
      TT.screen('Torre infinita', `<div class="tt2-tower-hd"><div style="font-size:2.6rem">🗼</div><div class="fl">${T.best}</div><div class="mut">piano record · ${T.runs} scalate</div></div>
        <p>Scegli <b>5 carte</b> del tuo album e sali il più in alto possibile. Dopo ogni vittoria scegli un <b>potenziamento</b> (+1 ai lati, un elemento, una carta più forte…). Ogni piano è più difficile e ogni 10 piani c'è un <b>Guardiano</b>. Se perdi, i piani superati ti fruttano <b>carte nuove</b> per l'album.</p>
        <button class="tt2-btn pri w" id="twGo">Inizia la scalata</button>`);
      $('#twGo').addEventListener('click', ()=>{
        TT.refill();
        const items = []; const S = TT.save(); Object.keys(S.owned).forEach(cid=>{ if(TT.CARD[cid]) for(let i = 0; i < S.owned[cid]; i++) items.push({key: cid + '#' + i, cid}); });
        TT.pickDeck({title: 'Le tue 5 carte per la Torre', sub: 'Durante la scalata le potenzierai. Scegli con cura!', items, ok: 'Sali!', back: TT.tower, onDone: keys=>{
          T.run = {floor: 1, deck: keys.map(k=> k.split('#')[0]), buff: keys.map(()=> [0, 0, 0, 0]), elem: keys.map(()=> null), first: false}; tsave(T); towerHub();
        }});
      });
      return;
    }
    towerHub();
  };
  function towerHub(){
    const T = tload(), run = T.run, f = run.floor, o = towerOpp(f);
    TT.screen('Torre infinita', `<div class="tt2-tower-hd"><div class="mut">Piano</div><div class="fl">${f}</div><div class="mut">record ${T.best}${o.boss ? ' · ⚠️ GUARDIANO' : ''}</div></div>
      <div class="tt2-box"><b>${o.face} ${esc(o.name)}</b><div class="mut" style="margin:4px 0">IA ${AI_N[o.ai]} · carte di livello medio ${o.avg}</div><div class="tt2-row">${ruleChips(Object.assign({sudden: true}, o.rules), '')}</div></div>
      <h3>La tua squadra ${run.first ? '<small>· 🥇 parti per primo!</small>' : ''}</h3><div class="tt2-grid s">${run.deck.map((_, i)=> towerMini(run, i)).join('')}</div>
      <button class="tt2-btn pri w" id="twFight" style="margin-top:14px">⚔️ Sfida il piano ${f}</button><div class="tt2-row c" style="margin-top:8px"><button class="tt2-btn sm red" id="twQuit">Concludi la scalata</button></div>`);
    $('#twFight').addEventListener('click', ()=> towerFight(o));
    $('#twQuit').addEventListener('click', async ()=>{ if(await TT.ask('Concludere la scalata? Riceverai le carte dei piani superati (' + (f - 1) + ').', 'Concludi', 'Continua')) towerEnd(T, f - 1, true); });
  }
  function towerRewards(cleared){
    const n = cleared >= 2 ? Math.floor(cleared / 2) : 0, out = [];
    for(let j = 1; j <= n; j++){ const lv = Math.max(1, Math.min(10, Math.round(1 + j * .8 + (Math.random() < .3 ? 1 : 0)))); out.push(pickOf(TT.BASE.filter(c=> c.lv === lv)).id); }
    return out;
  }
  function towerEnd(T, cleared, quit){
    const rw = towerRewards(cleared), S = TT.save(); rw.forEach(id=>{ S.owned[id] = (S.owned[id] || 0) + 1; }); TT.saveS();
    T.best = Math.max(T.best, cleared); T.runs++; T.run = null; tsave(T);
    const R = TT.root();
    R.innerHTML = ''; TT.screen('Torre infinita', `<div class="tt2-tower-hd"><div style="font-size:2.4rem">${cleared >= T.best && cleared > 0 ? '🏆' : '🗼'}</div><div class="fl">${cleared}</div><div class="mut">piani superati${cleared >= T.best && cleared > 0 ? ' · NUOVO RECORD!' : ' · record ' + T.best}</div></div>
      ${rw.length ? `<h3>Carte guadagnate</h3><div class="tt2-grid s">${rw.map(id=> `<div class="cw">${cardHtml(id, {})}</div>`).join('')}</div>` : '<p class="mut" style="text-align:center">Supera almeno 2 piani per vincere carte.</p>'}
      <button class="tt2-btn pri w" id="twAgain" style="margin-top:14px">Nuova scalata</button>`);
    if(rw.length){ TT.snd('win'); }
    $('#twAgain').addEventListener('click', ()=> TT.replaceTop(TT.tower));
  }
  function towerBoons(T){
    const run = T.run, opts = [], idx = ()=> Math.floor(Math.random() * 5);
    const nm = i=> esc(TT.CARD[run.deck[i]].name);
    for(let k = 0; k < 2; k++){ const i = idx(), sd = [0, 1, 2, 3].sort(()=> Math.random() - .5).slice(0, 2); opts.push({t: 'buff', i, sd, ic: '💪', ti: 'Rinforza', tx: `${nm(i)}: +1 ${SIDEN[sd[0]]} e +1 ${SIDEN[sd[1]]}`}); }
    { const i = run.deck.map((c, k)=> [TT.CARD[c].lv, k]).sort((a, b)=> a[0] - b[0])[0][1], lv = Math.min(10, TT.CARD[run.deck[i]].lv + 2), c = pickOf(TT.BASE.filter(x=> x.lv === lv && !run.deck.includes(x.id))); if(c) opts.push({t: 'swap', i, id: c.id, ic: '🔄', ti: 'Carta più forte', tx: `Al posto di ${nm(i)} entra ${esc(c.name)} (livello ${c.lv})`}); }
    { const i = idx(), e = pickOf(ELN); opts.push({t: 'elem', i, e, ic: TT.ELEM[e][1], ti: 'Elemento', tx: `${nm(i)} diventa ${TT.ELEM[e][0]}`}); }
    opts.push({t: 'first', ic: '🥇', ti: 'Prima mossa', tx: 'Nel prossimo piano giochi per primo'});
    opts.push({t: 'all', ic: '⭐', ti: 'Benedizione', tx: 'Una carta a caso prende +1 a tutti i lati', i: idx()});
    return opts.sort(()=> Math.random() - .5).slice(0, 3);
  }
  function towerBoonScreen(){
    const T = tload(), opts = towerBoons(T);
    TT.screen('Potenziamento', `<p style="text-align:center"><b>Piano ${T.run.floor - 1} superato!</b><br>Scegli un potenziamento:</p><div class="tt2-list">${opts.map((o, i)=> `<button class="tt2-item" data-o="${i}"><div class="av" style="font-size:1.6rem">${o.ic}</div><div class="tx"><b>${o.ti}</b><small>${o.tx}</small></div></button>`).join('')}</div>`, {back: false});
    $$('[data-o]').forEach(b=> b.addEventListener('click', ()=>{
      const o = opts[+b.dataset.o], run = T.run; TT.snd('coin');
      if(o.t === 'buff') o.sd.forEach(k=>{ run.buff[o.i][k]++; }); else if(o.t === 'swap'){ run.deck[o.i] = o.id; run.buff[o.i] = [0, 0, 0, 0]; run.elem[o.i] = null; } else if(o.t === 'elem') run.elem[o.i] = o.e; else if(o.t === 'first') run.first = true; else if(o.t === 'all') run.buff[o.i] = run.buff[o.i].map(x=> x + 1);
      tsave(T); towerHub();
    }));
  }
  function towerFight(o){
    const T = tload(), run = T.run, rules = Core.normRules(Object.assign({sudden: true, trade: 'one'}, o.rules));
    let st = Core.newGame({rules, seed: Math.floor(Math.random() * 4294967296), first: run.first ? 0 : (Math.random() < .5 ? 1 : 0), hands: [run.deck.map((_, i)=> tcard(run, i)), o.deck.map(TT.cobj)]});
    run.first = false; tsave(T);
    let board = null, over = false;
    board = TT.mountBoard({
      state: st, me: 0, names: [{nick: 'Tu', av: '🦝', sub: 'Piano ' + run.floor}, {nick: o.name, av: o.face, sub: 'IA ' + AI_N[o.ai]}], title: '🗼 Piano ' + run.floor,
      canPlay: (seat, s)=> !s.over && seat === 0,
      onPlay: async (hi, cell)=>{ const r = Core.play(st, {hi, cell}); if(!r.ok) throw new Error(r.error); st = r.state; setTimeout(after, 0); return r; },
      quit: async ()=>{ if(over || await TT.ask('Uscire dal piano? La scalata finisce e ricevi le carte dei piani superati.', 'Esci', 'Continua')){ board.destroy(); towerEnd(tload(), run.floor - 1, true); } }
    });
    st = board.state || st;
    if(st.turn === 1) aiTurn();
    async function after(){ await sleep(30); let n = 0; while(board.busy && n++ < 200) await sleep(60); if(st.over) return finish(); if(st.turn === 1) aiTurn(); }
    async function aiTurn(){
      board.setThinking(true); await sleep(P.fast ? 150 : 650); await sleep(20);
      const mv = Core.ai(st, o.ai), r = Core.play(st, mv); if(!r.ok){ board.setThinking(false); return; }
      st = r.state; board.setThinking(false); await board.apply(st, r.events); if(st.over) finish();
    }
    async function finish(){
      if(over) return; over = true; await sleep(P.fast ? 200 : 700);
      const won = st.result.winner === 0, T2 = tload(), sc = st.result.score;
      if(won){
        T2.run.floor++; T2.best = Math.max(T2.best, T2.run.floor - 1); tsave(T2);
        board.showEnd({kind: 'win', title: 'PIANO ' + (T2.run.floor - 1) + ' SUPERATO!', sub: `${sc[0]} a ${sc[1]}`, buttons: [{label: 'Scegli il potenziamento', cls: 'pri', fn: ()=>{ board.destroy(); towerBoonScreen(); }}]});
      } else {
        const cleared = run.floor - 1;
        board.showEnd({kind: st.result.winner == null ? 'draw' : 'lose', title: 'FINE DELLA SCALATA', sub: `${sc[0]} a ${sc[1]} · hai superato ${cleared} ${cleared === 1 ? 'piano' : 'piani'}`, buttons: [{label: 'Ritira le carte', cls: 'pri', fn: ()=>{ board.destroy(); towerEnd(tload(), cleared, false); }}]});
      }
    }
  }

  // =====================================================================================================
  // ARENA (offline): si pesca il mazzo da zero, 5 scelte tra 3 carte a caso. Tutti partono alla pari: conta il colpo d'occhio, non la collezione.
  // 3 vittorie = premio (una carta in più per l'album), 2 sconfitte = fine. Nessuna carta in palio.
  // =====================================================================================================
  const AR_KEY = 'jrpg_triad_arena';
  const arLoad = ()=>{ try{ return Object.assign({best: 0, runs: 0, perfect: 0}, JSON.parse(localStorage.getItem(AR_KEY) || '{}')); }catch(e){ return {best: 0, runs: 0, perfect: 0}; } };
  const arSave = a=>{ try{ localStorage.setItem(AR_KEY, JSON.stringify(a)); }catch(e){} };
  const AR_RULES = [{elemental: true, same: true, plus: true, combo: true, special: true}, {same: true, sameWall: true, special: true}, {plus: true, combo: true, elemental: true}, {elemental: true, same: true, special: true}];
  TT.arena = function(){
    const A = arLoad();
    TT.screen('Arena', `<div class="tt2-tower-hd"><div style="font-size:2.6rem">🏟️</div><div class="fl">${A.best}</div><div class="mut">vittorie record in una corsa · ${A.runs} corse · ${A.perfect} imbattute</div></div>
      <p>Pesca <b>5 carte</b> scegliendo ogni volta tra <b>3 a caso</b>, poi affronta l'IA. <b>3 vittorie</b> = una carta in premio per l'album; con <b>2 sconfitte</b> la corsa finisce. Non rischi nessuna carta e conta solo il tuo colpo d'occhio: chi ha l'album più ricco non ha vantaggi.</p>
      <button class="tt2-btn pri w" id="arGo">Inizia la corsa</button>`);
    $('#arGo').addEventListener('click', ()=> TT.go(arenaDraft, {picked: [], wins: 0, losses: 0}));
  };
  function arenaDraft(run){
    const pool = TT.LIST.filter(c=> c.set === 'base'), n = run.picked.length;
    // il livello delle proposte sale un po' a ogni scelta: le carte forti arrivano in fondo, ma sono poche
    const pickLv = ()=>{ const r = Math.random(); return r < .5 ? [1, 4] : r < .85 ? [4, 7] : [7, 10]; };
    const offer = []; let guard = 0;
    while(offer.length < 3 && guard++ < 200){ const lv = pickLv(), c = pool[Math.floor(Math.random() * pool.length)]; if(c.lv >= lv[0] && c.lv <= lv[1] && !offer.includes(c.id) && !run.picked.includes(c.id)) offer.push(c.id); }
    TT.screen('Arena · scelta ' + (n + 1) + ' di 5', `<div class="tt2-row c" style="margin-bottom:8px">${run.picked.map(id=> `<span class="tt2-chip">${esc(TT.chr ? TT.chr(id) : id)}</span>`).join('') || '<span class="mut">Nessuna carta ancora</span>'}</div>
      <div class="tt2-grid s">${offer.map(id=> `<div class="cw" data-o="${id}">${cardHtml(id, {})}</div>`).join('')}</div><p class="mut" style="text-align:center">Tocca la carta che vuoi tenere.</p>`, {back: false});
    $$('[data-o]').forEach(b=> b.addEventListener('click', ()=>{ TT.snd('coin'); run.picked.push(b.dataset.o); if(run.picked.length >= 5) arenaFight(run); else arenaDraft(run); }));
  }
  function arenaFight(run){
    const lvs = 3 + run.wins * 2, opp = TT.LIST.filter(c=> c.set === 'base' && c.lv >= Math.max(1, lvs - 3) && c.lv <= Math.min(10, lvs + 1)).sort(()=> Math.random() - .5).slice(0, 5).map(c=> c.id);
    const rules = AR_RULES[Math.floor(Math.random() * AR_RULES.length)];
    startLocal({title: 'Arena · ' + run.wins + 'V ' + run.losses + 'S', names: [{nick: 'Tu', av: '🦝', sub: 'Blu'}, {nick: 'Sfidante', av: '🏟️', sub: 'IA ' + AI_N[Math.min(4, 2 + run.wins)]}], hands: [run.picked.slice(), opp], rules: Object.assign({sudden: true, trade: 'one'}, rules), ai: Math.min(4, 2 + run.wins),
      arena: (won, draw, sc)=>{
        if(won) run.wins++; else if(!draw) run.losses++;
        const A = arLoad(); A.best = Math.max(A.best, run.wins);
        const end = run.wins >= 3 || run.losses >= 2;
        if(!end){ arSave(A); const m = TT.modal(`<div style="text-align:center"><div style="font-size:2rem">${won ? '🏆' : draw ? '🤝' : '💥'}</div><h3>${won ? 'Vittoria' : draw ? 'Pareggio' : 'Sconfitta'} ${sc[0]}–${sc[1]}</h3><p class="mut">${run.wins} vittorie · ${run.losses} sconfitte</p><button class="tt2-btn pri w" data-y>Prossimo incontro</button></div>`, {center: true, sticky: true}); $('[data-y]', m).addEventListener('click', ()=>{ m.remove(); arenaFight(run); }); return; }
        A.runs++; let prize = '';
        if(run.wins >= 3){ if(run.losses === 0) A.perfect++; const S = TT.save(); const ids = TT.LIST.filter(x=> x.set === 'base' && x.lv >= 4 && x.lv <= (run.losses ? 7 : 9)); const pick = ids[Math.floor(Math.random() * ids.length)]; S.owned[pick.id] = (S.owned[pick.id] || 0) + 1; TT.saveS(); prize = `<div class="cw" style="width:120px;margin:8px auto">${cardHtml(pick.id, {})}</div><p>Premio: <b>${esc(pick.name)}</b> nel tuo album!</p>`; }
        arSave(A);
        TT.screen('Arena · fine corsa', `<div class="tt2-tower-hd"><div style="font-size:2.6rem">${run.wins >= 3 ? '🏆' : '🏟️'}</div><div class="fl">${run.wins}V ${run.losses}S</div></div>${prize}<button class="tt2-btn pri w" id="arAgain">Nuova corsa</button>`, {back: false});
        $('#arAgain').addEventListener('click', ()=> TT.go(arenaDraft, {picked: [], wins: 0, losses: 0}));
      }});
  }
})();
