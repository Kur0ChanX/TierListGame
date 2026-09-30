// ---- Triple Triad 2.0: il tavolo da gioco (usato da allenamento, due giocatori e online) e le partite locali ----
(function(){
  'use strict';
  const TT = window.TT; if(!TT || TT.playLoaded) return; TT.playLoaded = true;
  const {P, $, $$, esc, sleep, cardHtml, V} = TT;
  const Core = window.TriadCore, CARD = ()=> TT.CARD;
  const EMOJI = ['😀', '😎', '😮', '😢', '😡', '👏', '🔥', '💀', '🤝', '🦝', '⭐', '🍀'];
  TT.EMOJI = EMOJI;
  const RULE_N = {elemental: 'Elementale', same: 'Same', sameWall: 'Muro', plus: 'Plus', combo: 'Combo', sudden: 'Morte improvvisa'};
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
    const elMods = (card, cell, s)=>{ const el = s.squares[cell]; if(!s.rules.elemental || !el) return [0, 0, 0, 0]; const d = card.e === el ? 1 : -1; return [d, d, d, d]; };
    const hidden = seat=> opt.hidden ? opt.hidden(seat, st) : false;
    function handHtml(seat){ const hide = hidden(seat); return sim.hands[seat].map((c, hi)=> `<div class="sl${hide ? ' back' : ''}" data-hi="${hi}" data-seat="${seat}">${c ? cardHtml(c.id, {owner: seat}) : '<div class="ttc used"></div>'}</div>`).join(''); }
    function cellHtml(i){
      const el = sim.squares[i], b = sim.board[i];
      return `<div class="tt2-cell" data-cell="${i}">${sim.rules.elemental && el ? `<div class="sq">${TT.ELEM[el][1]}</div>` : ''}${b ? cardHtml(b.card.id, {owner: b.owner, mods: elMods(b.card, i, sim)}) : ''}</div>`;
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
          if(cellEl){ $$('.ttc', cellEl).forEach(x=> x.remove()); cellEl.insertAdjacentHTML('beforeend', cardHtml(card.id, {owner: ev.p, cls: 'drop', mods: elMods(card, ev.cell, sim)})); }
          TT.snd('place'); scores(true);
          const el = sim.squares[ev.cell]; if(sim.rules.elemental && el) setTimeout(()=> pop(ev.cell, card.e === el ? '+1' : '−1', card.e === el ? 'up' : 'dn'), 120);
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
    {id: 'regina', n: 'Regina delle Carte', r: 'Ovunque', lv: [7, 10], ai: 5, rules: {elemental: true, same: true, plus: true, combo: true}, trade: 'direct', face: '👸'},
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
  TT.npcList = function(){
    const S = TT.save();
    TT.screen('Allenamento', `<p class="mut" style="text-align:center">Sfida gli avversari con la tua collezione dell'album. Contro l'IA non perdi mai carte: se vinci, ne prendi una.</p><div class="tt2-list">${NPC.map((n, i)=>{ const rec = S.npc[n.id] || {w: 0, l: 0}; return `<button class="tt2-item" data-n="${i}"><div class="av">${n.face}</div><div class="tx"><b>${esc(n.n)}</b><small>${esc(n.r)} · IA ${AI_N[n.ai]} · carte livello ${n.lv[0]}–${n.lv[1]}</small><div style="margin-top:3px">${ruleChips(Object.assign({sudden: true}, n.rules), n.trade)}</div></div><div class="rt">${rec.w}V ${rec.l}S</div></button>`; }).join('')}</div>`);
    $$('[data-n]').forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); TT.go(npcSetup, +b.dataset.n); }));
  };
  function localItems(){ const S = TT.save(); const items = []; Object.keys(S.owned).forEach(cid=>{ if(CARD()[cid]) for(let i = 0; i < S.owned[cid]; i++) items.push({key: cid + '#' + i, cid}); }); return items; }
  function npcSetup(i){
    const n = NPC[i]; TT.refill();
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
      if(!cfg.hot){ S.stats[won ? 'w' : draw ? 'd' : 'l']++; if(won){ S.stats.streak++; S.stats.best = Math.max(S.stats.best || 0, S.stats.streak); } else if(!draw) S.stats.streak = 0; if(cfg.npc){ const r = S.npc[cfg.npc.id] = S.npc[cfg.npc.id] || {w: 0, l: 0}; if(won) r.w++; else if(!draw) r.l++; } }
      const btns = [{label: 'Rivincita', cls: 'pri', fn: ()=>{ board.destroy(); if(cfg.npc) cfg.hands[1] = npcDeck(cfg.npc); startLocal(cfg); }}, {label: 'Esci', fn: ()=>{ board.destroy(); TT.saveS(); TT.back(); }}];
      const gain = ids=>{ ids.forEach(id=>{ S.owned[id] = (S.owned[id] || 0) + 1; }); TT.saveS(); };
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
})();
