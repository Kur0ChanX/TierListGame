#!/usr/bin/env node
// Prove del motore Triple Triad (triad-core.js): regole FF8, casi limite, scambi, morte improvvisa, IA. Uso: node tools/test-triad-core.js
const assert = require('assert');
const T = require('../triad-core.js');
let ok = 0, bad = 0;
const test = (name, fn)=>{ try{ fn(); ok++; console.log('  ok  ' + name); }catch(e){ bad++; console.log('  KO  ' + name + '\n      ' + (e && e.message || e)); } };
const C = (v, e)=> ({id: 'c' + v.join(''), v, e: e || null});
const filler = ()=> [0, 1, 2, 3, 4].map(i=> C([1 + i, 2, 3, 4]));
// partita con la situazione voluta: board = {casella: [proprietario, [lati], elemento]}, mano del giocatore di turno = la carta `mine`
function setup(o){
  const st = T.newGame({rules: Object.assign({elemental: false, same: false, plus: false, sameWall: false, combo: false, sudden: true, trade: 'one'}, o.rules), seed: 1, first: 0, hands: [filler(), filler()]});
  st.squares = o.squares || [null, null, null, null, null, null, null, null, null];
  let n = 0; let uid = 20;
  Object.keys(o.board || {}).forEach(k=>{ const [owner, v, e] = o.board[k]; st.board[k] = {card: {id: 'b' + k, v, e: e || null, u: uid++}, owner, from: owner}; n++; });
  st.moveNo = n; st.turn = 0; st.hands[0][0] = Object.assign({}, C(o.mine[0], o.mine[1]), {u: 0});
  return st;
}
const put = (st, cell)=>{ const r = T.play(st, {hi: 0, cell}); assert(r.ok, r.error); return r; };
const owners = st=> st.board.map(b=> b ? b.owner : '.').join('');
const flips = r=> r.events.filter(e=> e.t === 'flip').map(e=> e.cell + ':' + e.by).sort().join(',');

console.log('Regola Base');
test('il lato più alto prende, il pari no', ()=>{
  const st = setup({board: {1: [1, [1, 1, 4, 1]], 5: [1, [1, 1, 1, 5]]}, mine: [[5, 5, 1, 1]]});
  const r = put(st, 4); assert.strictEqual(flips(r), '1:basic'); assert.strictEqual(r.state.board[5].owner, 1);
});
test('le carte tue non si girano e nulla accade senza vicini', ()=>{
  const st = setup({board: {1: [0, [1, 1, 1, 1]]}, mine: [[10, 10, 10, 10]]});
  assert.strictEqual(flips(put(st, 4)), '');
  assert.strictEqual(flips(put(setup({mine: [[10, 10, 10, 10]]}), 0)), '');
});
test('A (10) prende tutto tranne un altro A', ()=>{
  const st = setup({board: {1: [1, [1, 1, 9, 1]], 3: [1, [1, 1, 1, 1]], 5: [1, [1, 1, 1, 10]]}, mine: [[10, 10, 10, 10]]});
  assert.strictEqual(flips(put(st, 4)), '1:basic,3:basic');   // prende sopra (9) e a sinistra (1), non l'altro A a destra
});
console.log('Elementale');
test('stesso elemento +1: 5 contro 5 diventa 6 contro 5', ()=>{
  const sq = [null, null, null, null, 'fuoco', null, null, null, null];
  const st = setup({rules: {elemental: true}, squares: sq, board: {1: [1, [1, 1, 5, 1]]}, mine: [[5, 1, 1, 1], 'fuoco']});
  assert.strictEqual(flips(put(st, 4)), '1:basic');
});
test('elemento diverso o assente su casella elementale: -1', ()=>{
  const sq = [null, null, null, null, 'fuoco', null, null, null, null];
  const st = setup({rules: {elemental: true}, squares: sq, board: {1: [1, [1, 1, 4, 1]]}, mine: [[5, 1, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '');           // 5-1=4 contro 4: pari, non prende
  const st2 = setup({rules: {elemental: true}, squares: sq, board: {1: [1, [1, 1, 4, 1]]}, mine: [[5, 1, 1, 1], 'acqua']});
  assert.strictEqual(flips(put(st2, 4)), '');
});
test('anche la carta avversaria sulla casella elementale ha il bonus', ()=>{
  const sq = [null, 'acqua', null, null, null, null, null, null, null];
  const st = setup({rules: {elemental: true}, squares: sq, board: {1: [1, [1, 1, 1, 5], 'acqua']}, mine: [[1, 5, 1, 1]]});  // in 0: destra 5 contro sinistra 5+1
  assert.strictEqual(flips(put(st, 0)), '');
});
test('senza la regola Elementale i bonus non contano', ()=>{
  const sq = [null, null, null, null, 'fuoco', null, null, null, null];
  const st = setup({rules: {elemental: false}, squares: sq, board: {1: [1, [1, 1, 4, 1]]}, mine: [[5, 1, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '1:basic');
});
console.log('Uguale (Same)');
test('due lati uguali girano le carte avversarie anche se più forti', ()=>{
  const st = setup({rules: {same: true}, board: {1: [1, [1, 1, 3, 1]], 5: [1, [1, 1, 1, 7]]}, mine: [[3, 7, 1, 1]]});
  const r = put(st, 4); assert.strictEqual(flips(r), '1:same,5:same');
});
test('una carta tua conta per far scattare ma non si gira', ()=>{
  const st = setup({rules: {same: true}, board: {1: [1, [1, 1, 3, 1]], 3: [0, [1, 4, 1, 1]]}, mine: [[3, 1, 1, 4]]});
  const r = put(st, 4); assert.strictEqual(flips(r), '1:same'); assert.strictEqual(r.state.board[3].owner, 0);
});
test('un solo lato uguale non basta (decide la regola Base)', ()=>{
  const st = setup({rules: {same: true}, board: {1: [1, [1, 1, 3, 1]]}, mine: [[3, 1, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '');
});
test('Uguale usa i valori base, non quelli elementali', ()=>{
  const sq = [null, null, null, null, 'fuoco', null, null, null, null];
  const st = setup({rules: {same: true, elemental: true}, squares: sq, board: {1: [1, [1, 1, 3, 1]], 5: [1, [1, 1, 1, 7]]}, mine: [[3, 7, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '1:same,5:same');
});
test('Uguale-muro: il bordo vale A', ()=>{
  // casella 0: sopra e a sinistra sono muri. Carta con alto=10 e destra uguale al vicino: 2 corrispondenze
  const st = setup({rules: {same: true, sameWall: true}, board: {1: [1, [1, 1, 1, 6]]}, mine: [[10, 6, 1, 1]]});
  assert.strictEqual(flips(put(st, 0)), '1:same');
  const st2 = setup({rules: {same: true, sameWall: false}, board: {1: [1, [1, 1, 1, 6]]}, mine: [[10, 6, 1, 1]]});
  assert.strictEqual(flips(put(st2, 0)), '');              // senza «muro» resta solo la Base: 6 contro 6 è pari, non prende
});
test('Uguale-muro: senza A sul bordo non scatta', ()=>{
  const st = setup({rules: {same: true, sameWall: true}, board: {1: [1, [1, 1, 1, 6]]}, mine: [[9, 6, 1, 1]]});
  assert.strictEqual(flips(put(st, 0)), '');
});
console.log('Più (Plus)');
test('somme uguali girano anche carte più forti', ()=>{
  const st = setup({rules: {plus: true}, board: {1: [1, [1, 1, 6, 1]], 5: [1, [1, 1, 1, 5]]}, mine: [[2, 3, 1, 1]]});   // 2+6 = 3+5 = 8
  assert.strictEqual(flips(put(st, 4)), '1:plus,5:plus');
});
test('due somme uguali diverse: ognuna gira le sue carte', ()=>{
  const st = setup({rules: {plus: true}, board: {1: [1, [1, 1, 6, 1]], 5: [1, [1, 1, 1, 5]], 3: [1, [1, 9, 1, 1]], 7: [1, [8, 1, 1, 1]]}, mine: [[2, 3, 4, 2]]});
  // sopra 2+6=8, destra 3+5=8, sinistra 2+9=11, sotto 4+8=12 -> gira solo il gruppo da 8
  assert.strictEqual(flips(put(st, 4)), '1:plus,5:plus');
});
test('i muri non contano per Più e una carta tua conta', ()=>{
  const st = setup({rules: {plus: true}, board: {1: [1, [1, 1, 6, 1]], 3: [0, [1, 5, 1, 1]]}, mine: [[2, 1, 1, 3]]});
  assert.strictEqual(flips(put(st, 4)), '1:plus');          // 2+6 = 3+5 = 8, la carta 3 è tua e non gira
  const st2 = setup({rules: {plus: true}, board: {1: [1, [1, 1, 8, 1]]}, mine: [[2, 1, 1, 1]]});
  assert.strictEqual(flips(put(st2, 0)), '');
});
test('somme diverse non scattano', ()=>{
  const st = setup({rules: {plus: true}, board: {1: [1, [1, 1, 6, 1]], 5: [1, [1, 1, 1, 6]]}, mine: [[2, 3, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '');
});
console.log('Combo');
test('Combo: catena vera (Uguale gira A e B, A prende C, C prende D)', ()=>{
  // casella 4 al centro. sopra(1): basso 3 ; destra(5): sinistra 7 -> Uguale con alto 3 e destra 7
  // la 1 (girata) ha sinistra 9 contro la destra 2 della 0: prende la 0 (combo); la 0 ha basso 8 contro alto 1 della 3: prende la 3 (a catena)
  const st = setup({rules: {same: true, combo: true}, board: {1: [1, [1, 1, 3, 9]], 0: [1, [1, 2, 8, 1]], 3: [1, [1, 2, 1, 1]], 5: [1, [1, 1, 1, 7]]}, mine: [[3, 7, 1, 1]]});
  const r = put(st, 4);
  assert.strictEqual(flips(r), '0:combo,1:same,3:combo,5:same');
  assert(r.events.some(e=> e.t === 'rule' && e.rule === 'combo'));
  const off = setup({rules: {same: true, combo: false}, board: {1: [1, [1, 1, 3, 9]], 0: [1, [1, 2, 8, 1]], 3: [1, [1, 2, 1, 1]], 5: [1, [1, 1, 1, 7]]}, mine: [[3, 7, 1, 1]]});
  assert.strictEqual(flips(put(off, 4)), '1:same,5:same');
});
test('le carte girate dalla Base NON fanno combo', ()=>{
  // 4 prende la 1 (base) che poi potrebbe prendere la 0, ma senza Uguale/Più non c'è combo
  const st = setup({rules: {same: true, plus: true, combo: true}, board: {1: [1, [1, 1, 2, 9]], 0: [1, [1, 2, 1, 1]]}, mine: [[5, 1, 1, 1]]});
  assert.strictEqual(flips(put(st, 4)), '1:basic');
});
test('Combo usa i valori elementali (Base)', ()=>{
  const sq = [null, 'acqua', null, null, null, null, null, null, null];
  const mk = ()=> ({rules: {same: true, combo: true, elemental: true}, squares: sq, board: {1: [1, [1, 1, 3, 3]], 5: [1, [1, 1, 1, 7]], 0: [1, [1, 3, 1, 1]]}, mine: [[3, 7, 1, 1]]});
  // la 1 (senza elemento su acqua) vale 3-1=2 contro la destra 3 della 0: non la prende
  assert.strictEqual(flips(put(setup(mk()), 4)), '1:same,5:same');
});
console.log('Fine partita, punteggio, morte improvvisa');
function playRandom(st, R){ while(!st.over){ const mv = T.legalMoves(st); st = T.play(st, mv[Math.floor(R() * mv.length)]).state; } return st; }
test('punteggio = carte sulla plancia + carte rimaste in mano', ()=>{
  const st = T.newGame({seed: 5, first: 0, hands: [filler(), filler()]});
  assert.deepStrictEqual(T.score(st), [5, 5]);
  const r = T.play(st, {hi: 0, cell: 4}); assert.deepStrictEqual(T.score(r.state), [5, 5]);
});
test('9 mosse: chi inizia ne gioca 5, l\'altro 4 e ne tiene 1', ()=>{
  const R = T.mulberry(3); let st = T.newGame({seed: 9, first: 0, rules: {sudden: false}, hands: [filler(), filler()]}), moves = 0;
  while(!st.over){ const mv = T.legalMoves(st); st = T.play(st, mv[Math.floor(R() * mv.length)]).state; moves++; }
  assert.strictEqual(moves, 9); assert.strictEqual(st.hands[1].filter(Boolean).length, 1); assert.strictEqual(st.hands[0].filter(Boolean).length, 0);
  assert.strictEqual(T.score(st)[0] + T.score(st)[1], 10);
});
test('mosse non valide sono rifiutate', ()=>{
  let st = T.newGame({seed: 2, hands: [filler(), filler()]}); st = T.play(st, {hi: 0, cell: 4}).state;
  assert.strictEqual(T.play(st, {hi: 0, cell: 4}).ok, false);
  assert.strictEqual(T.play(st, {hi: 9, cell: 0}).ok, false);
  assert.strictEqual(T.play(st, {hi: 0, cell: 9}).ok, false);
  assert.strictEqual(T.play(st, {hi: 0.5, cell: 1}).ok, false);
  assert.strictEqual(T.play(st, null).ok, false);
  const t2 = T.play(st, {hi: 0, cell: 0}).state; t2.hands[t2.turn === 0 ? 1 : 0][0] = null;
  const bad = T.play(T.play(st, {hi: 1, cell: 0}).state, {hi: 0, cell: 0}); assert.strictEqual(bad.ok, false);   // casella 0 occupata
  const fin = playRandom(T.newGame({seed: 4, rules: {sudden: false}, hands: [filler(), filler()]}), T.mulberry(1));
  assert.strictEqual(T.play(fin, {hi: 0, cell: 0}).ok, false);
});
test('la carta già giocata non si rigioca', ()=>{
  let st = T.newGame({seed: 2, hands: [filler(), filler()]}); st = T.play(st, {hi: 0, cell: 0}).state; st = T.play(st, {hi: 0, cell: 1}).state;
  assert.strictEqual(T.play(st, {hi: 0, cell: 2}).ok, false);
});
test('lo stato di partenza non viene modificato (funzione pura)', ()=>{
  const st = T.newGame({seed: 2, hands: [filler(), filler()]}), snap = JSON.stringify(st);
  T.play(st, {hi: 0, cell: 4}); assert.strictEqual(JSON.stringify(st), snap);
});
test('pareggio -> morte improvvisa: ognuno riparte con le carte che possiede', ()=>{
  let found = null;
  for(let s = 1; s < 4000 && !found; s++){
    const R = T.mulberry(s); let st = T.newGame({seed: s, first: 0, hands: [filler(), filler()]}), last = null;
    while(!st.over){ const mv = T.legalMoves(st), r = T.play(st, mv[Math.floor(R() * mv.length)]); last = r; st = r.state; if(r.events.some(e=> e.t === 'sudden')){ found = {r, before: T.score(last.state)}; break; } }
  }
  assert(found, 'nessun pareggio trovato');
  const st = found.r.state, ev = found.r.events.find(e=> e.t === 'sudden');
  assert.strictEqual(st.round, 2); assert.strictEqual(ev.score[0], ev.score[1]);
  assert.deepStrictEqual(st.board, [null, null, null, null, null, null, null, null, null]);
  assert.strictEqual(st.hands[0].length, 5); assert.strictEqual(st.hands[1].length, 5);
  assert.strictEqual(st.first, 1);                             // alterna chi inizia
  assert.deepStrictEqual(T.score(st), [5, 5]);
});
test('dopo 5 manche in pareggio la partita finisce pari', ()=>{
  // due mani identiche e simmetriche con tutti 5: pareggi a oltranza
  const same = ()=> [0, 1, 2, 3, 4].map(()=> C([5, 5, 5, 5]));
  let st = T.newGame({seed: 1, rules: {elemental: false, same: false, plus: false, combo: false}, hands: [same(), same()]}), rounds = 0;
  const R = T.mulberry(1);
  while(!st.over){ const mv = T.legalMoves(st); st = T.play(st, mv[Math.floor(R() * mv.length)]).state; rounds = st.round; if(rounds > 6) break; }
  assert(st.over); assert.strictEqual(st.result.winner, null); assert(st.result.round <= T.MAX_ROUNDS);
});
console.log('Scambi');
function finished(seed, trade){ const R = T.mulberry(seed); let st = T.newGame({seed, first: seed % 2, rules: {trade}, hands: [filler(), filler().map(c=> C([c.v[3], c.v[2], c.v[1], c.v[0]]))]}); st = playRandom(st, R); return st; }
function firstWithWinner(trade, minDiff){ for(let s = 1; s < 3000; s++){ const st = finished(s, trade); if(st.result.winner != null && Math.abs(st.result.score[0] - st.result.score[1]) >= (minDiff || 1)) return st; } }
test('Uno: il vincitore sceglie 1 carta tra le 5 del perdente', ()=>{
  const st = firstWithWinner('one'), w = st.result.winner, l = 1 - w, info = T.tradeInfo(st);
  assert.strictEqual(info.pick, 1); assert.strictEqual(T.tradeResolve(st, []), null); assert.strictEqual(T.tradeResolve(st, [l * 5 + 2]).length, 1);
  assert.strictEqual(T.tradeResolve(st, [w * 5]), null);       // non puoi prendere una tua carta
  assert.strictEqual(T.tradeResolve(st, [l * 5, l * 5 + 1]), null);
  const t = T.tradeResolve(st, [l * 5 + 3])[0]; assert.strictEqual(t.to, w); assert.strictEqual(t.from, l);
});
test('Diff: tante carte quanto la differenza di punteggio (max 5)', ()=>{
  const st = firstWithWinner('diff', 2), w = st.result.winner, l = 1 - w, d = st.result.score[w] - st.result.score[l];
  assert.strictEqual(T.tradeInfo(st).pick, Math.min(5, d));
  const picks = [0, 1, 2, 3, 4].slice(0, Math.min(5, d)).map(i=> l * 5 + i); assert.strictEqual(T.tradeResolve(st, picks).length, picks.length);
  assert.strictEqual(T.tradeResolve(st, picks.slice(1)), null);
});
test('Tutto: il vincitore prende tutte e 5 le carte del perdente', ()=>{
  const st = firstWithWinner('all'), w = st.result.winner, t = T.tradeResolve(st, []);
  assert.strictEqual(t.length, 5); assert(t.every(x=> x.to === w && x.from === 1 - w));
});
test('Diretto: ogni carta va a chi la possiede a fine partita, in entrambe le direzioni', ()=>{
  const st = firstWithWinner('direct'), t = T.tradeResolve(st, []), hold = st.result.holders;
  t.forEach(x=>{ assert.strictEqual(hold[x.u], x.to); assert.notStrictEqual(x.from, x.to); });
  const moved = Object.keys(hold).filter(u=> hold[u] !== (+u < 5 ? 0 : 1)).length; assert.strictEqual(t.length, moved);
});
test('pareggio: nessuno scambio', ()=>{
  const same = ()=> [0, 1, 2, 3, 4].map(()=> C([5, 5, 5, 5]));
  const R = T.mulberry(2); let st = T.newGame({seed: 1, rules: {elemental: false, same: false, plus: false, combo: false, trade: 'all'}, hands: [same(), same()]}); st = playRandom(st, R);
  assert.strictEqual(st.result.winner, null); assert.deepStrictEqual(T.tradeResolve(st, []), []);
});
console.log('Caselle elementali e determinismo');
test('le caselle elementali dipendono solo dal seme', ()=>{
  const r = T.normRules({}); assert.deepStrictEqual(T.makeSquares(77, r), T.makeSquares(77, r));
  const many = new Set(); for(let s = 0; s < 200; s++) many.add(T.makeSquares(s, r).join('|')); assert(many.size > 100);
  assert(T.makeSquares(5, T.normRules({elemental: false})).every(x=> x === null));
  let tot = 0; for(let s = 0; s < 2000; s++) tot += T.makeSquares(s, r).filter(Boolean).length; const avg = tot / 2000; assert(avg > 1.8 && avg < 3.2, 'media ' + avg);
});
test('stessa partita rigiocata con le stesse mosse = stesso risultato', ()=>{
  const mk = ()=> T.newGame({seed: 31, first: 1, hands: [filler(), filler()]});
  let a = mk(), b = mk(); const R = T.mulberry(8), moves = [];
  while(!a.over){ const mv = T.legalMoves(a), m = mv[Math.floor(R() * mv.length)]; moves.push(m); a = T.play(a, m).state; }
  moves.forEach(m=>{ b = T.play(b, m).state; });
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
});
console.log('Sicurezza del punteggio (5000 partite a caso)');
test('invarianti: 10 carte in totale, proprietari validi, finisce sempre', ()=>{
  const cards = ()=> [0, 1, 2, 3, 4].map(()=>{ const v = [0, 0, 0, 0].map(()=> 1 + Math.floor(Math.random() * 10)); return C(v, Math.random() < .3 ? T.ELEMENTS[Math.floor(Math.random() * 8)] : null); });
  for(let g = 0; g < 5000; g++){
    const rules = {elemental: Math.random() < .6, same: Math.random() < .7, plus: Math.random() < .7, sameWall: Math.random() < .3, combo: Math.random() < .7, sudden: Math.random() < .8, trade: ['one', 'diff', 'direct', 'all'][g % 4]};
    let st = T.newGame({seed: g * 13, first: g % 2, rules, hands: [cards(), cards()]}), n = 0;
    while(!st.over){
      const mv = T.legalMoves(st); assert(mv.length > 0);
      const r = T.play(st, mv[Math.floor(Math.random() * mv.length)]); assert(r.ok);
      st = r.state; const s = T.score(st); assert.strictEqual(s[0] + s[1], 10);
      st.board.forEach(b=> b && assert(b.owner === 0 || b.owner === 1));
      if(++n > 60) throw new Error('partita infinita');
    }
    assert(st.result && st.result.score[0] + st.result.score[1] === 10);
    const ti = T.tradeInfo(st); if(ti.winner != null){ const t = T.tradeResolve(st, ti.pick ? Array.from({length: ti.pick}, (_, i)=> ti.loser * 5 + i) : []); assert(Array.isArray(t)); }
  }
});
console.log('Intelligenza artificiale');
test('restituisce sempre una mossa legale a ogni livello', ()=>{
  for(let lv = 1; lv <= 5; lv++){ const R = T.mulberry(lv); let st = T.newGame({seed: lv, hands: [filler(), filler()]}); while(!st.over){ const m = T.ai(st, lv, R); assert(T.play(st, m).ok, 'livello ' + lv); st = T.play(st, m).state; } }
});
test('i livelli alti battono i bassi', ()=>{
  const cards = R=> [0, 1, 2, 3, 4].map(()=>{ const v = [0, 0, 0, 0].map(()=> 2 + Math.floor(R() * 8)); return C(v, R() < .3 ? T.ELEMENTS[Math.floor(R() * 8)] : null); });
  function duel(hi, lo, games){
    let w = 0, l = 0; const R = T.mulberry(hi * 100 + lo);
    for(let g = 0; g < games; g++){
      const A = cards(R), B = cards(R), seat = g % 2; // seat = posto dell'IA forte
      let st = T.newGame({seed: g + 1, first: g % 2, rules: {sudden: true}, hands: seat === 0 ? [A, B] : [B, A]});
      while(!st.over){ const lv = st.turn === seat ? hi : lo; st = T.play(st, T.ai(st, lv, R)).state; }
      if(st.result.winner === seat) w++; else if(st.result.winner === 1 - seat) l++;
    }
    return [w, l];
  }
  const a = duel(5, 1, 60), b = duel(4, 2, 60), c = duel(3, 1, 60);
  console.log('      5 vs 1:', a.join('-'), '· 4 vs 2:', b.join('-'), '· 3 vs 1:', c.join('-'));
  assert(a[0] >= 45 && a[0] > a[1] * 3, 'il 5 deve battere il 1'); assert(b[0] > b[1], 'il 4 deve battere il 2'); assert(c[0] > c[1] * 2, 'il 3 deve battere il 1');
});
test('il livello 5 risponde in tempo utile anche alla prima mossa', ()=>{
  const st = T.newGame({seed: 3, hands: [filler(), filler()]}); const t0 = Date.now(); T.ai(st, 5); const ms = Date.now() - t0;
  console.log('      prima mossa livello 5:', ms, 'ms'); assert(ms < 4000);
});
test('caselle speciali: +2 sulla casella boost, -2 sulla trappola, uguali per il seme', ()=>{
  const a = T.newGame({seed: 9, rules: {special: true}, hands: [filler(), filler()]}), b = T.newGame({seed: 9, rules: {special: true}, hands: [filler(), filler()]});
  assert.deepStrictEqual(a.squares, b.squares);
  assert(T.newGame({seed: 9, rules: {elemental: false}, hands: [filler(), filler()]}).squares.every(x=> !x), 'senza la regola nessuna casella speciale');
  // avversario in 0 con lato destro 5; io gioco in 1 con lato sinistro 4: senza speciale perdo, con boost (+2 = 6) prendo
  const run = sq=>{ const st = setup({board: {0: [1, [1, 5, 1, 1]]}, mine: [[1, 1, 1, 4]], squares: sq}); st.rules.special = true; return owners(put(st, 1).state || st); };
  assert.strictEqual(run([null, null, null, null, null, null, null, null, null]).slice(0, 2), '10');
  assert.strictEqual(run([null, 'boost', null, null, null, null, null, null, null]).slice(0, 2), '00');
  assert.strictEqual(run([null, 'trap', null, null, null, null, null, null, null]).slice(0, 2), '10');
});
console.log('\n' + ok + ' prove riuscite, ' + bad + ' fallite');
process.exit(bad ? 1 : 0);
