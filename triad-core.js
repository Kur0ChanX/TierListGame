// Triple Triad di Frugu: motore delle regole (stile Final Fantasy VIII). Nessuna dipendenza: gira identico nel telefono e sul server.
// Lo stato è un semplice oggetto JSON. Lati di una carta: [alto, destra, basso, sinistra], 1-10 (10 = A). Caselle 0-8 (riga per riga).
// Regole: Base, Elementale, Uguale (Same), Uguale-muro, Più (Plus), Combo, Morte improvvisa, scambi Uno / Diff / Diretto / Tutto.
(function(root){
  'use strict';
  var DIRS = [0, 1, 2, 3];                                   // 0 alto, 1 destra, 2 basso, 3 sinistra
  var opp = function(d){ return (d + 2) & 3; };
  var NB = [];                                               // NB[casella] = [[direzione, casella vicina], ...]
  for(var c = 0; c < 9; c++){
    var r = Math.floor(c / 3), col = c % 3, l = [];
    if(r > 0) l.push([0, c - 3]); if(col < 2) l.push([1, c + 1]); if(r < 2) l.push([2, c + 3]); if(col > 0) l.push([3, c - 1]);
    NB.push(l);
  }
  var ELEMENTS = ['fuoco', 'ghiaccio', 'tuono', 'terra', 'veleno', 'vento', 'acqua', 'sacro'];
  var MAX_ROUNDS = 5;                                        // morte improvvisa: al massimo 5 manche
  var DEFAULT_RULES = {elemental: true, same: true, plus: true, sameWall: false, combo: true, sudden: true, special: false, cap: 0, trade: 'one'};

  function mulberry(seed){ var a = seed >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normRules(r){
    var o = {}, k; for(k in DEFAULT_RULES) o[k] = DEFAULT_RULES[k];
    if(r) for(k in DEFAULT_RULES) if(r[k] !== undefined) o[k] = r[k];
    if(['one', 'diff', 'direct', 'all'].indexOf(o.trade) < 0) o.trade = 'one';
    ['elemental', 'same', 'plus', 'sameWall', 'combo', 'sudden'].forEach(function(x){ o[x] = !!o[x]; });
    if(!o.same) o.sameWall = false;
    return o;
  }
  // caselle con elemento: dipendono solo dal seme (uguali per tutti i giocatori e per il server)
  function makeSquares(seed, rules){
    var sq = [null, null, null, null, null, null, null, null, null];
    var i;
    if(rules.elemental){
      var R = mulberry((seed >>> 0) ^ 0x9E3779B9);
      for(i = 0; i < 9; i++) if(R() < 0.28) sq[i] = ELEMENTS[Math.floor(R() * ELEMENTS.length)];
    }
    // caselle speciali (regola «special»): 'boost' = +2 ai lati di chiunque, 'trap' = -2; solo dove non c'è un elemento
    if(rules.special){
      var S = mulberry((seed >>> 0) ^ 0x51ED270B);
      for(i = 0; i < 9; i++){ var x = S(); if(!sq[i] && x < 0.22) sq[i] = x < 0.11 ? 'boost' : 'trap'; }
    }
    return sq;
  }
  function cardOf(c, u){ return {id: c.id, v: [c.v[0], c.v[1], c.v[2], c.v[3]], e: c.e || null, u: u}; }

  // opts: {rules, seed, first (0/1), hands: [[carta x5], [carta x5]]} con carta = {id, v:[4], e}
  function newGame(opts){
    var rules = normRules(opts.rules), seed = (opts.seed == null ? Math.floor(Math.random() * 4294967296) : opts.seed) >>> 0;
    var first = opts.first === 1 ? 1 : 0;
    var hands = [0, 1].map(function(p){ var h = opts.hands[p]; if(!h || h.length !== 5) throw new Error('servono 5 carte per giocatore'); return h.map(function(c, i){ return cardOf(c, p * 5 + i); }); });
    return {
      v: 1, rules: rules, seed: seed, round: 1, first: first, turn: first, moveNo: 0,
      board: [null, null, null, null, null, null, null, null, null], squares: makeSquares(seed, rules),
      hands: hands, stake: hands.map(function(h){ return h.map(function(c){ return c.id; }); }),
      over: false, result: null, log: []
    };
  }
  function clone(st){
    return {v: st.v, rules: st.rules, seed: st.seed, round: st.round, first: st.first, turn: st.turn, moveNo: st.moveNo, board: st.board.slice(), squares: st.squares,
      hands: [st.hands[0].slice(), st.hands[1].slice()], stake: st.stake, over: st.over, result: st.result, log: st.log.slice()};
  }
  // valore di un lato con il bonus/malus dell'elemento della casella (solo regola Base e Combo)
  function eff(st, cell, d){
    var b = st.board[cell], v = b.card.v[d], el = st.squares[cell];
    if(el === 'boost') v += 2; else if(el === 'trap') v -= 2;
    else if(st.rules.elemental && el) v += (b.card.e === el) ? 1 : -1;
    return v;
  }
  function score(st){
    var s = [0, 0];
    st.board.forEach(function(b){ if(b) s[b.owner]++; });
    [0, 1].forEach(function(p){ st.hands[p].forEach(function(c){ if(c) s[p]++; }); });
    return s;
  }
  function legalMoves(st){
    var out = [];
    if(st.over) return out;
    st.hands[st.turn].forEach(function(c, hi){ if(!c) return; for(var cell = 0; cell < 9; cell++) if(!st.board[cell]) out.push({hi: hi, cell: cell}); });
    return out;
  }

  // Risolve le prese dopo aver messo la carta in `cell` (modifica st.board). Ritorna gli eventi.
  function resolve(st, cell, out){
    var mover = st.board[cell].owner, R = st.rules, me = st.board[cell].card;
    var flipped = {}, special = [];
    function flip(c, by, src){
      if(flipped[c]) return false; flipped[c] = 1;
      var b = st.board[c]; st.board[c] = {card: b.card, owner: mover, from: b.from};
      out.push({t: 'flip', cell: c, by: by, src: src, to: mover});
      return true;
    }
    var i, j, d, nc, n;
    // 1) UGUALE: due o più lati uguali (contano anche le tue carte e, con «muro», i bordi = A). Girano solo le carte avversarie.
    if(R.same){
      var m = [], wall = false;
      for(i = 0; i < NB[cell].length; i++){ d = NB[cell][i][0]; nc = NB[cell][i][1]; n = st.board[nc]; if(n && me.v[d] === n.card.v[opp(d)]) m.push([d, nc]); }
      if(R.sameWall){
        for(d = 0; d < 4; d++){ var has = false; for(j = 0; j < NB[cell].length; j++) if(NB[cell][j][0] === d) has = true; if(!has && me.v[d] === 10){ m.push([d, -1]); wall = true; } }
      }
      if(m.length >= 2){
        var fl = m.filter(function(x){ return x[1] >= 0 && st.board[x[1]].owner !== mover; }).map(function(x){ return x[1]; });
        if(fl.length){ out.push({t: 'rule', rule: 'same', cells: fl.slice(), wall: wall}); fl.forEach(function(c){ if(flip(c, 'same', cell)) special.push(c); }); }
      }
    }
    // 2) PIÙ: due o più lati con la stessa somma (i muri non contano). Girano solo le carte avversarie.
    if(R.plus){
      var sums = {};
      for(i = 0; i < NB[cell].length; i++){ d = NB[cell][i][0]; nc = NB[cell][i][1]; n = st.board[nc]; if(n){ var s = me.v[d] + n.card.v[opp(d)]; (sums[s] = sums[s] || []).push(nc); } }
      var pl = [];
      Object.keys(sums).forEach(function(k){ if(sums[k].length >= 2) sums[k].forEach(function(c){ if(st.board[c].owner !== mover && pl.indexOf(c) < 0) pl.push(c); }); });
      if(pl.length){ out.push({t: 'rule', rule: 'plus', cells: pl.slice()}); pl.forEach(function(c){ if(flip(c, 'plus', cell)) special.push(c); }); }
    }
    // 3) BASE: il lato che tocca è più alto (con gli elementi)
    for(i = 0; i < NB[cell].length; i++){
      d = NB[cell][i][0]; nc = NB[cell][i][1]; n = st.board[nc];
      if(n && n.owner !== mover && !flipped[nc] && eff(st, cell, d) > eff(st, nc, opp(d))) flip(nc, 'basic', cell);
    }
    // 4) COMBO: le carte girate da Uguale/Più prendono le vicine con la regola Base, a catena
    if(R.combo && special.length){
      var q = special.slice(), cb = [];
      while(q.length){
        var c0 = q.shift();
        for(i = 0; i < NB[c0].length; i++){
          d = NB[c0][i][0]; nc = NB[c0][i][1]; n = st.board[nc];
          if(n && n.owner !== mover && eff(st, c0, d) > eff(st, nc, opp(d))){ if(flip(nc, 'combo', c0)){ q.push(nc); cb.push(nc); } }
        }
      }
      if(cb.length) out.push({t: 'rule', rule: 'combo', cells: cb.slice()});
    }
    return out;
  }

  function holders(st){                                       // a chi appartiene ogni carta (per uid) a fine manche
    var h = {};
    st.board.forEach(function(b){ if(b) h[b.card.u] = b.owner; });
    [0, 1].forEach(function(p){ st.hands[p].forEach(function(c){ if(c) h[c.u] = p; }); });
    return h;
  }
  // Gioca una carta. move = {hi, cell}. Ritorna {ok, state, events} oppure {ok:false, error}.
  // opts.noSudden: per l'IA, tratta il pareggio come fine partita.
  function play(st, move, opts){
    if(st.over) return {ok: false, error: 'partita finita'};
    var hi = move && move.hi, cell = move && move.cell;
    if(!(hi >= 0 && hi < 5) || !(cell >= 0 && cell < 9) || hi !== (hi | 0) || cell !== (cell | 0)) return {ok: false, error: 'mossa non valida'};
    var card = st.hands[st.turn][hi];
    if(!card) return {ok: false, error: 'carta già giocata'};
    if(st.board[cell]) return {ok: false, error: 'casella occupata'};
    var n = clone(st), ev = [], p = st.turn;
    n.hands[p][hi] = null;
    n.board[cell] = {card: card, owner: p, from: p};
    ev.push({t: 'place', p: p, hi: hi, cell: cell, card: card});
    resolve(n, cell, ev);
    n.moveNo++;
    n.log.push([p, hi, cell]);
    if(n.moveNo >= 9){
      var sc = score(n), noSudden = opts && opts.noSudden;
      if(sc[0] === sc[1] && n.rules.sudden && !noSudden && n.round < MAX_ROUNDS){
        var h = holders(n), nh = [[], []];
        [0, 1].forEach(function(q){ var list = []; n.board.forEach(function(b){ if(b && b.owner === q) list.push(b.card); }); n.hands[q].forEach(function(c){ if(c && h[c.u] === q) list.push(c); }); nh[q] = list; });
        n.round++; n.first = 1 - n.first; n.turn = n.first; n.moveNo = 0;
        n.board = [null, null, null, null, null, null, null, null, null];
        n.hands = nh.map(function(l){ return l.slice(0, 5); });
        n.squares = makeSquares(n.seed + n.round * 7919, n.rules);
        ev.push({t: 'sudden', round: n.round, score: sc});
      } else {
        var w = sc[0] > sc[1] ? 0 : (sc[1] > sc[0] ? 1 : null);
        n.over = true; n.turn = -1;
        n.result = {winner: w, score: sc, round: n.round, holders: holders(n)};
        ev.push({t: 'end', winner: w, score: sc});
      }
    } else n.turn = 1 - p;
    return {ok: true, state: n, events: ev};
  }

  // ---- scambi a fine partita ----
  // Ritorna cosa succede alle carte: {winner, loser, mode, pick (quante ne sceglie il vincitore tra le 5 del perdente) oppure auto:[{u, id, from, to}]}
  function tradeInfo(st){
    if(!st.over || !st.result || st.result.winner == null) return {winner: null, mode: st.rules.trade, pick: 0, auto: []};
    var w = st.result.winner, l = 1 - w, mode = st.rules.trade, sc = st.result.score, hold = st.result.holders;
    var stakeU = function(p){ return st.stake[p].map(function(id, i){ return {u: p * 5 + i, id: id}; }); };
    if(mode === 'one') return {winner: w, loser: l, mode: mode, pick: 1, auto: []};
    if(mode === 'diff') return {winner: w, loser: l, mode: mode, pick: Math.min(5, Math.max(1, sc[w] - sc[l])), auto: []};
    if(mode === 'all') return {winner: w, loser: l, mode: mode, pick: 0, auto: stakeU(l).map(function(x){ return {u: x.u, id: x.id, from: l, to: w}; })};
    var auto = [];                                             // diretto: ogni carta va a chi la possiede a fine partita
    [0, 1].forEach(function(p){ stakeU(p).forEach(function(x){ if(hold[x.u] !== p) auto.push({u: x.u, id: x.id, from: p, to: hold[x.u]}); }); });
    return {winner: w, loser: l, mode: mode, pick: 0, auto: auto};
  }
  // picks = uid scelte dal vincitore (solo Uno / Diff). Ritorna l'elenco dei passaggi di carta o null se le scelte non sono valide.
  function tradeResolve(st, picks){
    var info = tradeInfo(st);
    if(info.winner == null) return [];
    if(info.pick === 0) return info.auto;
    picks = (picks || []).filter(function(x, i, a){ return a.indexOf(x) === i; });
    if(picks.length !== info.pick) return null;
    var out = [];
    for(var i = 0; i < picks.length; i++){
      var u = picks[i], idx = u - info.loser * 5;
      if(!(idx >= 0 && idx < 5) || u !== (u | 0)) return null;
      out.push({u: u, id: st.stake[info.loser][idx], from: info.loser, to: info.winner});
    }
    return out;
  }

  // ---- intelligenza artificiale: livello 1 (a caso) … 5 (maestro) ----
  function searchState(st){ var s = clone(st); s.rules = normRules(st.rules); s.rules.sudden = false; return s; }
  function evalFor(st, me){
    var s = score(st), d = s[me] - s[1 - me];
    if(st.over) return d > 0 ? 1000 + d : (d < 0 ? -1000 + d : 0);
    // piccolo bonus posizionale: le carte proprie con lati deboli esposti a caselle vuote valgono meno
    var pos = 0;
    st.board.forEach(function(b, cell){
      if(!b) return;
      var exp = 0; NB[cell].forEach(function(x){ if(!st.board[x[1]]) exp += Math.max(0, 6 - b.card.v[x[0]]); });
      pos += (b.owner === me ? -1 : 1) * exp * 0.08;
    });
    return d * 10 + pos;
  }
  function ab(st, depth, alpha, beta, me, stats){
    if(st.over || depth === 0){ stats.n++; return evalFor(st, me); }
    var mv = legalMoves(st), maxi = st.turn === me, best = maxi ? -1e9 : 1e9, i, r, v;
    // ordina le mosse per rendere efficace la potatura
    var list = mv.map(function(m){ var x = play(st, m, {noSudden: true}); return {st: x.state, o: (x.state.over ? 0 : score(x.state)[st.turn] - score(x.state)[1 - st.turn])}; });
    list.sort(function(a, b){ return b.o - a.o; });
    for(i = 0; i < list.length; i++){
      v = ab(list[i].st, depth - 1, alpha, beta, me, stats);
      if(maxi){ if(v > best) best = v; if(best > alpha) alpha = best; } else { if(v < best) best = v; if(best < beta) beta = best; }
      if(beta <= alpha) break;
    }
    return best;
  }
  // Sceglie la mossa. level 1-5, rnd = funzione casuale (facoltativa). Ritorna {hi, cell}.
  function ai(st, level, rnd){
    rnd = rnd || Math.random; level = Math.max(1, Math.min(5, level | 0 || 3));
    var mv = legalMoves(st); if(!mv.length) return null;
    if(level === 1) return mv[Math.floor(rnd() * mv.length)];
    var me = st.turn, s0 = searchState(st), empties = 9 - st.moveNo;
    var depth = level === 2 ? 1 : level === 3 ? 2 : level === 4 ? (empties > 6 ? 3 : Math.min(empties, 6)) : (empties > 7 ? 4 : Math.min(empties, 9));
    var scored = mv.map(function(m){
      var x = play(s0, m, {noSudden: true}), stats = {n: 0};
      var v = depth <= 1 ? evalFor(x.state, me) : ab(x.state, depth - 1, -1e9, 1e9, me, stats);
      return {m: m, v: v};
    });
    var best = -1e9; scored.forEach(function(x){ if(x.v > best) best = x.v; });
    var tol = level === 2 ? 6 : 0.0001;                        // il livello 2 sbaglia ogni tanto: sceglie tra le mosse quasi buone
    var top = scored.filter(function(x){ return x.v >= best - tol; });
    if(level >= 3){                                            // a parità preferisci tenere le carte forti per dopo
      top.forEach(function(x){ var c = st.hands[me][x.m.hi]; x.p = c.v[0] + c.v[1] + c.v[2] + c.v[3]; });
      var minP = Math.min.apply(null, top.map(function(x){ return x.p; }));
      top = top.filter(function(x){ return x.p <= minP + (level === 3 ? 2 : 0); });
    }
    return top[Math.floor(rnd() * top.length)].m;
  }

  var api = {
    ELEMENTS: ELEMENTS, MAX_ROUNDS: MAX_ROUNDS, DEFAULT_RULES: DEFAULT_RULES, NB: NB,
    normRules: normRules, newGame: newGame, play: play, legalMoves: legalMoves, score: score, holders: holders, eff: eff,
    tradeInfo: tradeInfo, tradeResolve: tradeResolve, ai: ai, makeSquares: makeSquares, mulberry: mulberry
  };
  if(typeof module === 'object' && module.exports) module.exports = api; else root.TriadCore = api;
})(typeof self !== 'undefined' ? self : this);
