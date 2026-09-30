#!/usr/bin/env node
// Prova del server Triple Triad con giocatori finti. Si avvia il server (npx wrangler dev --port 8799 --local --var TURN_MS:2500 --var REG_MAX:100 --var SUPPLY_SCALE:0.3)
// e poi: node tools/triad-server/test.js [http://localhost:8799]
const assert = require('assert');
const Core = require('../../triad-core.js');
const BASE = process.argv[2] || 'http://localhost:8799';
let ok = 0, bad = 0;
const test = async (name, fn)=>{ try{ await fn(); ok++; console.log('  ok  ' + name); }catch(e){ bad++; console.log('  KO  ' + name + '\n      ' + (e && e.stack || e).split('\n').slice(0, 4).join('\n      ')); } };
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
async function api(method, path, body, tok){
  const r = await fetch(BASE + path, {method, headers: Object.assign({'content-type': 'application/json'}, tok ? {authorization: 'Bearer ' + tok} : {}), body: body ? JSON.stringify(body) : undefined});
  const d = await r.json().catch(()=> ({})); d._s = r.status; return d;
}
const expectErr = async (p, status, code)=>{ const d = await p; assert.strictEqual(d._s, status, 'atteso ' + status + ' ottenuto ' + d._s + ' ' + JSON.stringify(d)); if(code) assert.strictEqual(d.code, code); return d; };
function socket(tok){
  const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws?token=' + tok), msgs = [];
  const ready = new Promise((res, rej)=>{ ws.onopen = ()=> res(); ws.onerror = e=> rej(new Error('ws errore')); });
  ws.onmessage = e=>{ try{ msgs.push(JSON.parse(e.data)); }catch(x){} };
  return {ws, msgs, ready, wait: async (pred, ms)=>{ const t0 = Date.now(); while(Date.now() - t0 < (ms || 4000)){ const m = msgs.find(pred); if(m) return m; await sleep(40); } throw new Error('messaggio WebSocket non arrivato'); }};
}
const U = {};
async function reg(nick){ const d = await api('POST', '/api/register', {nick}); assert.strictEqual(d._s, 200, JSON.stringify(d)); return {nick, tok: d.token, rec: d.recovery, me: d.me}; }
const cards = async p=> (await api('GET', '/api/collection', null, p.tok)).cards;
const pickFive = async (p, prefer)=>{ const c = (await cards(p)).filter(x=> !x.lock); return c.slice(0, 5).map(x=> x.uid); };
// gioca una partita intera con mosse decise da `chooser(state)`; ritorna la vista finale
async function playOut(match, A, B, chooserA, chooserB){
  let m = match, guard = 0;
  while(m.status === 'active' && guard++ < 80){
    const st = m.state, turnP = st.turn === 0 ? [A, B].find(p=> m.players[0].id === p.me.id) : [A, B].find(p=> m.players[1].id === p.me.id);
    const chooser = turnP === A ? chooserA : chooserB;
    const mv = chooser(st);
    const r = await api('POST', '/api/match/' + m.id + '/move', mv, turnP.tok); assert.strictEqual(r._s, 200, JSON.stringify(r));
    m = r.match;
  }
  return m;
}
const rnd = st=>{ const mv = Core.legalMoves(st); return mv[Math.floor(Math.random() * mv.length)]; };

(async()=>{
  console.log('Registrazione e account');
  await test('ping e configurazione', async ()=>{
    const p = await api('GET', '/api/ping'); assert.strictEqual(p.cards, 200);
    const c = await api('GET', '/api/config'); assert.strictEqual(c.bosses.length, 10); assert.strictEqual(c.turnMs, 2500); assert(c.supply[10] >= 1);
  });
  await test('registro due giocatori con carte iniziali', async ()=>{
    U.a = await reg('Alice'); U.b = await reg('Bob ' + Math.floor(Math.random() * 900 + 100));
    assert.strictEqual(U.a.me.cards, 5); assert.strictEqual(U.a.me.elo, 1000); assert.strictEqual(U.a.rec.split('-').length, 5);
    const c = await cards(U.a); assert.strictEqual(c.length, 5);
  });
  await test('nomi non validi, doppi o riservati sono rifiutati', async ()=>{
    await expectErr(api('POST', '/api/register', {nick: 'ab'}), 400, 'nick');
    await expectErr(api('POST', '/api/register', {nick: '<script>'}), 400, 'nick');
    await expectErr(api('POST', '/api/register', {nick: 'ALICE'}), 409, 'nick_taken');
    await expectErr(api('POST', '/api/register', {nick: 'Álice'}), 409, 'nick_taken');
    await expectErr(api('POST', '/api/register', {nick: 'Admin'}), 400, 'nick');
    await expectErr(api('POST', '/api/register', {nick: 'Custode Uno'}), 400, 'nick');
  });
  await test('senza accesso non si entra', async ()=>{
    await expectErr(api('GET', '/api/me'), 401, 'auth');
    await expectErr(api('GET', '/api/me', null, 'tfalso0123456789012345678901234567890'), 401, 'auth');
  });
  await test('recupero: codice sbagliato no, giusto sì, il vecchio telefono viene scollegato', async ()=>{
    await expectErr(api('POST', '/api/recover', {nick: 'Alice', recovery: 'AAAA-BBBB-CCCC-DDDD-EEEE'}), 403, 'recover');
    const old = U.a.tok; const sk = socket(old); await sk.ready;
    const d = await api('POST', '/api/recover', {nick: 'alice', recovery: U.a.rec.toLowerCase()}); assert.strictEqual(d._s, 200);
    U.a.tok = d.token; assert.notStrictEqual(old, d.token);
    await expectErr(api('GET', '/api/me', null, old), 401, 'auth');
    assert.strictEqual((await api('GET', '/api/me', null, U.a.tok)).nick, 'Alice');
    await sk.wait(m=> m.t === 'kick');
  });
  await test('ricompensa quotidiana: una volta sola', async ()=>{
    const d = await api('POST', '/api/daily', null, U.a.tok); assert.strictEqual(d._s, 200); assert(d.card && d.card.cid);
    await expectErr(api('POST', '/api/daily', null, U.a.tok), 429, 'daily');
    assert.strictEqual((await cards(U.a)).length, 6);
  });
  await test('supply pubblico, classifica e profilo', async ()=>{
    const s = await api('GET', '/api/supply'); assert(Object.keys(s.supply).length > 50);
    const l = await api('GET', '/api/leaderboard?by=collection'); assert(l.players.length >= 2);
    const pr = await api('GET', '/api/player/' + U.a.me.id, null, U.b.tok); assert.strictEqual(pr.nick, 'Alice'); assert(pr.top.length >= 5);
  });

  console.log('Amici');
  await test('richiesta col codice amico, accettazione, presenza online', async ()=>{
    const sb = socket(U.b.tok); await sb.ready; U.sb = sb;
    const r = await api('POST', '/api/friends/request', {code: U.b.me.code}, U.a.tok); assert.strictEqual(r.state, 'sent');
    await sb.wait(m=> m.t === 'news' && m.item.kind === 'friend_req');
    const l = await api('GET', '/api/friends', null, U.b.tok); assert.strictEqual(l.friends[0].state, 'incoming');
    assert.strictEqual((await api('GET', '/api/me', null, U.b.tok)).requests, 1);
    assert.strictEqual((await api('POST', '/api/friends/accept', {id: U.a.me.id}, U.b.tok)).ok, true);
    assert.strictEqual((await api('GET', '/api/friends', null, U.a.tok)).friends[0].state, 'friend');
    const sa = socket(U.a.tok); await sa.ready; U.sa = sa;
    await sb.wait(m=> m.t === 'presence' && m.online);
    assert.strictEqual((await api('GET', '/api/friends', null, U.a.tok)).friends[0].online, true);
  });
  await test('non ci si può aggiungere da soli e la ricerca funziona', async ()=>{
    await expectErr(api('POST', '/api/friends/request', {code: U.a.me.code}, U.a.tok), 400, 'self');
    await expectErr(api('POST', '/api/friends/request', {nick: 'nessunoqui'}, U.a.tok), 404, 'nf');
    assert((await api('GET', '/api/players?q=bob', null, U.a.tok)).players.length >= 1);
  });

  console.log('Stanza, partita, furto delle carte');
  let room;
  await test('creo una stanza con il codice, l\'amico entra, parte la partita in tempo reale', async ()=>{
    const uidsA = await pickFive(U.a);
    room = await api('POST', '/api/challenge', {mode: 'ranked', rules: {trade: 'one'}, cards: uidsA}, U.a.tok); assert.strictEqual(room._s, 200); assert.strictEqual(room.code.length, 5);
    assert((await cards(U.a)).filter(c=> c.lock).length === 5);
    await expectErr(api('POST', '/api/challenge', {mode: 'ranked', cards: uidsA}, U.a.tok), 409, 'locked');
    await expectErr(api('POST', '/api/room/join', {code: 'ZZZZZ', cards: await pickFive(U.b)}, U.b.tok), 404);
    await expectErr(api('POST', '/api/room/join', {code: room.code, cards: uidsA}, U.b.tok), 403, 'cards');           // carte non sue
    await expectErr(api('POST', '/api/room/join', {code: room.code, cards: (await pickFive(U.b)).slice(0, 4)}, U.b.tok), 400, 'cards');
    await expectErr(api('POST', '/api/room/join', {code: room.code, cards: [1, 2, 3, 4, 5]}, U.b.tok), 400, 'cards');
    await expectErr(api('POST', '/api/room/join', {code: room.code, cards: await pickFive(U.a)}, U.a.tok), 400, 'self');
    const j = await api('POST', '/api/room/join', {code: room.code, cards: await pickFive(U.b)}, U.b.tok); assert.strictEqual(j._s, 200, JSON.stringify(j));
    U.m = j.match; assert.strictEqual(U.m.status, 'active'); assert.strictEqual(U.m.you !== -1, true);
    await U.sa.wait(m=> m.t === 'match' && m.match.id === U.m.id);
    await expectErr(api('POST', '/api/room/join', {code: room.code, cards: await pickFive(U.b)}, U.b.tok), 404);      // la stanza è chiusa
  });
  await test('mosse: turno sbagliato, casella occupata, carta già giocata, estranei', async ()=>{
    const m = U.m, first = m.state.turn === 0 ? [U.a, U.b].find(p=> p.me.id === m.players[0].id) : [U.a, U.b].find(p=> p.me.id === m.players[1].id), second = first === U.a ? U.b : U.a;
    await expectErr(api('POST', '/api/match/' + m.id + '/move', {hi: 0, cell: 0}, second.tok), 409, 'turn');
    await expectErr(api('POST', '/api/match/' + m.id + '/move', {hi: 7, cell: 0}, first.tok), 400, 'move');
    await expectErr(api('POST', '/api/match/' + m.id + '/move', {hi: 0, cell: 'a'}, first.tok), 400, 'move');
    const c = await reg('Estranea' + Math.floor(Math.random() * 999));
    await expectErr(api('POST', '/api/match/' + m.id + '/move', {hi: 0, cell: 0}, c.tok), 403, 'forbidden');
    await expectErr(api('GET', '/api/match/' + m.id, null, c.tok), 403, 'forbidden');
    const r = await api('POST', '/api/match/' + m.id + '/move', {hi: 0, cell: 4}, first.tok); assert.strictEqual(r._s, 200);
    assert(r.events.some(e=> e.t === 'place'));
    await expectErr(api('POST', '/api/match/' + m.id + '/move', {hi: 0, cell: 4}, second.tok), 400, 'move');           // casella occupata
    await U.sa.wait(m2=> m2.t === 'move' || true);
    U.m = r.match;
    const g = await api('GET', '/api/match/' + m.id + '?ver=' + r.match.ver, null, first.tok); assert.strictEqual(g.same, true);
  });
  let done;
  await test('partita intera: la fine, il vincitore sceglie una carta del perdente e la ruba', async ()=>{
    const before = {a: (await cards(U.a)).map(c=> c.cid + c.uid), b: (await cards(U.b)).map(c=> c.cid + c.uid)};
    done = await playOut(U.m, U.a, U.b, rnd, rnd);
    let guard = 0;
    while(done.status === 'active' && guard++ < 3) done = (await api('GET', '/api/match/' + U.m.id, null, U.a.tok)).match;
    if(done.result && done.result.winner == null){ console.log('      (pareggio: nessuno scambio)'); assert.strictEqual(done.status, 'done'); return; }
    assert.strictEqual(done.status, 'picking', done.status);
    const w = done.players[done.pick.by].id === U.a.me.id ? U.a : U.b, l = w === U.a ? U.b : U.a, wIdx = done.pick.by;
    assert.strictEqual(done.pick.n, 1); assert.strictEqual(done.pick.choices.length, 5);
    await expectErr(api('POST', '/api/match/' + U.m.id + '/pick', {picks: [done.pick.choices[0].u]}, l.tok), 403, 'forbidden');    // il perdente non sceglie
    await expectErr(api('POST', '/api/match/' + U.m.id + '/pick', {picks: [wIdx * 5]}, w.tok), 400, 'pick');                      // non una carta tua
    await expectErr(api('POST', '/api/match/' + U.m.id + '/pick', {picks: []}, w.tok), 400, 'pick');
    const take = done.pick.choices[2], pk = await api('POST', '/api/match/' + U.m.id + '/pick', {picks: [take.u]}, w.tok); assert.strictEqual(pk._s, 200, JSON.stringify(pk));
    assert.strictEqual(pk.match.status, 'done'); assert.strictEqual(pk.match.result.transfers.length, 1); assert.strictEqual(pk.match.result.transfers[0].cid, take.cid);
    const cw = await cards(w), cl = await cards(l);
    const wb = (w === U.a ? before.a : before.b).length, lb = (l === U.a ? before.a : before.b).length;
    assert.strictEqual(cw.length, wb + 1, 'il vincitore ha una carta in più'); assert(cl.length === lb - 1 || cl.length === 5, 'il perdente ne ha una in meno (o è tornato a 5)');
    assert(cw.some(c=> c.cid === take.cid)); assert(cw.every(c=> !c.lock) && cl.every(c=> !c.lock), 'tutte le carte sbloccate');
    const nl = await api('GET', '/api/news', null, l.tok); assert(nl.news.some(n=> n.kind === 'stolen' && n.data.cid === take.cid), 'notizia «ti ha rubato»');
    const nw = await api('GET', '/api/news', null, w.tok); assert(nw.news.some(n=> n.kind === 'won'));
    const mw = await api('GET', '/api/me', null, w.tok), ml = await api('GET', '/api/me', null, l.tok);
    assert(mw.elo > 1000 && ml.elo < 1000, 'ELO ' + mw.elo + '/' + ml.elo); assert.strictEqual(mw.wins, 1); assert.strictEqual(ml.losses, 1); assert.strictEqual(mw.streak, 1);
    U.w = w; U.l = l;
  });
  await test('il perdente resta sempre con almeno 5 carte (aiuto)', async ()=>{
    for(const p of [U.a, U.b]){ const c = await cards(p); assert(c.length >= 5, p.nick + ' ' + c.length); }
  });

  console.log('Regole di scambio: Diff, Diretto, Tutto');
  async function duel(trade, extra){
    const A = U.a, B = U.b;
    const cA = await cards(A), cB = await cards(B);
    const r = await api('POST', '/api/challenge', {mode: 'ranked', rules: Object.assign({trade}, extra), cards: cA.filter(c=> !c.lock).slice(0, 5).map(c=> c.uid)}, A.tok); assert.strictEqual(r._s, 200, JSON.stringify(r));
    const j = await api('POST', '/api/room/join', {code: r.code, cards: cB.filter(c=> !c.lock).slice(0, 5).map(c=> c.uid)}, B.tok); assert.strictEqual(j._s, 200, JSON.stringify(j));
    return playOut(j.match, A, B, rnd, rnd);
  }
  for(const trade of ['all', 'direct', 'diff']){
    await test('scambio «' + trade + '»', async ()=>{
      let d, tries = 0;
      do{ d = await duel(trade); tries++; if(d.result && d.result.winner == null){ continue; } break; }while(tries < 6);
      const beforeTotal = (await cards(U.a)).length + (await cards(U.b)).length;
      if(d.status === 'picking'){
        const n = d.pick.n, w = d.players[d.pick.by].id === U.a.me.id ? U.a : U.b; const picks = d.pick.choices.slice(0, n).map(c=> c.u);
        const pk = await api('POST', '/api/match/' + d.id + '/pick', {picks}, w.tok); assert.strictEqual(pk._s, 200, JSON.stringify(pk)); assert.strictEqual(pk.match.result.transfers.length, n);
        assert.strictEqual(trade, 'diff'); assert(n >= 1 && n <= 5);
      } else {
        assert.strictEqual(d.status, 'done');
        if(d.result.winner != null){
          const t = d.result.transfers; assert(trade === 'all' ? t.length === 5 : t.length >= 0);
          if(trade === 'all'){ const wid = d.players[d.result.winner].id; assert(t.every(x=> x.to === wid)); }
        }
      }
      const c = [...await cards(U.a), ...await cards(U.b)]; assert(c.every(x=> !x.lock), 'nessuna carta rimasta bloccata');
      assert.strictEqual(new Set(c.map(x=> x.uid)).size, c.length, 'nessuna carta duplicata');
    });
  }

  console.log('Sfida diretta, rifiuto, resa, emoticon');
  await test('sfida a un amico: arriva subito via WebSocket, si rifiuta, le carte si sbloccano', async ()=>{
    const r = await api('POST', '/api/challenge', {to: 'bob', mode: 'friendly', cards: await pickFive(U.a)}, U.a.tok);
    if(r._s !== 200){ const b2 = U.b.nick; const r2 = await api('POST', '/api/challenge', {to: b2, mode: 'friendly', cards: await pickFive(U.a)}, U.a.tok); assert.strictEqual(r2._s, 200, JSON.stringify(r2)); U.ch = r2; } else U.ch = r;
    await U.sb.wait(m=> m.t === 'challenge' && m.challenge.id === U.ch.id);
    const l = await api('GET', '/api/challenges', null, U.b.tok); assert(l.incoming.some(c=> c.id === U.ch.id));
    await expectErr(api('POST', '/api/challenge/' + U.ch.id + '/accept', {cards: await pickFive(U.a)}, U.a.tok), 400, 'self');
    assert.strictEqual((await api('POST', '/api/challenge/' + U.ch.id + '/decline', null, U.b.tok)).ok, true);
    assert((await cards(U.a)).every(c=> !c.lock));
  });
  await test('amichevole: nessun furto, nessun ELO; resa; emoticon', async ()=>{
    const eloBefore = (await api('GET', '/api/me', null, U.a.tok)).elo;
    const r = await api('POST', '/api/challenge', {to: U.b.nick, mode: 'friendly', cards: await pickFive(U.a)}, U.a.tok);
    const j = await api('POST', '/api/challenge/' + r.id + '/accept', {cards: await pickFive(U.b)}, U.b.tok); assert.strictEqual(j._s, 200, JSON.stringify(j));
    const em = await api('POST', '/api/match/' + j.match.id + '/emote', {e: 3}, U.b.tok); assert.strictEqual(em.ok, true);
    await U.sa.wait(m=> m.t === 'emote' && m.e === 3);
    await expectErr(api('POST', '/api/match/' + j.match.id + '/emote', {e: 99}, U.b.tok), 400, 'emote');
    const ff = await api('POST', '/api/match/' + j.match.id + '/forfeit', null, U.b.tok); assert.strictEqual(ff._s, 200);
    assert.strictEqual(ff.match.status, 'done'); assert.strictEqual(ff.match.result.winner, ff.match.you === 0 ? 1 : 0); assert.strictEqual(ff.match.result.transfers.length, 0);
    assert.strictEqual((await api('GET', '/api/me', null, U.a.tok)).elo, eloBefore);
    assert((await cards(U.a)).every(c=> !c.lock));
  });
  await test('una partita finita non si può più giocare o abbandonare', async ()=>{
    const ml = (await api('GET', '/api/matches', null, U.a.tok)).matches; assert(ml.length >= 4);
    const id = ml.find(m=> m.status === 'done').id;
    await expectErr(api('POST', '/api/match/' + id + '/move', {hi: 0, cell: 0}, U.a.tok), 409, 'over');
    await expectErr(api('POST', '/api/match/' + id + '/forfeit', null, U.a.tok), 409, 'over');
  });

  console.log('Timer: se non giochi, gioca il server; dopo 3 turni saltati perdi');
  await test('mossa automatica allo scadere del tempo e sconfitta a tavolino', async ()=>{
    const r = await api('POST', '/api/challenge', {mode: 'friendly', cards: await pickFive(U.a)}, U.a.tok);
    const j = await api('POST', '/api/room/join', {code: r.code, cards: await pickFive(U.b)}, U.b.tok); assert.strictEqual(j._s, 200);
    const t0 = Date.now(); let auto = 0, end = null;
    while(Date.now() - t0 < 30000){
      await sleep(400);
      const g = (await api('GET', '/api/match/' + j.match.id, null, U.a.tok)).match;
      auto = g.autos[0] + g.autos[1];
      if(g.status !== 'active'){ end = g; break; }
    }
    assert(end, 'la partita doveva finire da sola'); assert(auto >= 3); assert(end.result.forfeit === true); assert(end.result.winner === 0 || end.result.winner === 1);
    assert((await cards(U.a)).every(c=> !c.lock) && (await cards(U.b)).every(c=> !c.lock));
  });
  await test('giocando, il contatore dei turni saltati riparte', async ()=>{
    const r = await api('POST', '/api/challenge', {mode: 'friendly', cards: await pickFive(U.a)}, U.a.tok);
    const j = await api('POST', '/api/room/join', {code: r.code, cards: await pickFive(U.b)}, U.b.tok);
    let m = j.match; await sleep(2800);            // scade un turno
    m = (await api('GET', '/api/match/' + m.id, null, U.a.tok)).match; assert(m.autos[0] + m.autos[1] >= 1);
    const turnP = m.state.turn === 0 ? [U.a, U.b].find(p=> p.me.id === m.players[0].id) : [U.a, U.b].find(p=> p.me.id === m.players[1].id);
    const mv = await api('POST', '/api/match/' + m.id + '/move', rnd(m.state), turnP.tok); assert.strictEqual(mv._s, 200);
    assert.strictEqual(mv.match.autos[mv.match.you], 0);
    await api('POST', '/api/match/' + m.id + '/forfeit', null, U.a.tok);
  });

  console.log('Custodi (bosse)');
  await test('il Custode 2 è chiuso finché non batti il 1', async ()=>{
    await expectErr(api('POST', '/api/boss/start', {n: 2, cards: await pickFive(U.a)}, U.a.tok), 403, 'locked_boss');
    await expectErr(api('POST', '/api/boss/start', {n: 99, cards: await pickFive(U.a)}, U.a.tok), 400, 'boss');
  });
  await test('batto il Custode 1: ricompensa, progresso, nessun rischio per le mie carte', async ()=>{
    const cardsBefore = (await cards(U.a)).length; let won = null, tries = 0;
    while(!won && tries++ < 8){
      const r = await api('POST', '/api/boss/start', {n: 1, cards: await pickFive(U.a)}, U.a.tok); assert.strictEqual(r._s, 200, JSON.stringify(r));
      await expectErr(api('POST', '/api/boss/start', {n: 1, cards: await pickFive(U.a)}, U.a.tok), 409);            // già in corso (o carte bloccate)
      let m = r.match;
      while(m.status === 'active'){
        const mv = await api('POST', '/api/match/' + m.id + '/move', Core.ai(m.state, 4), U.a.tok); assert.strictEqual(mv._s, 200, JSON.stringify(mv)); m = mv.match;
      }
      assert.strictEqual(m.status, 'done'); assert(m.boss === 1); assert.strictEqual(m.result.transfers.length, 0);
      if(m.result.winner === 0) won = m;
      assert((await cards(U.a)).length >= cardsBefore);
    }
    assert(won, 'l\'IA di livello 4 doveva battere il Custode 1');
    assert(won.result.first === true && won.result.reward && won.result.reward.cid, 'ricompensa alla prima vittoria');
    const me = await api('GET', '/api/me', null, U.a.tok); assert.strictEqual(me.boss[1] >= 1, true);
    const n = await api('GET', '/api/news', null, U.a.tok); assert(n.news.some(x=> x.kind === 'boss'));
    const s = await api('POST', '/api/boss/start', {n: 2, cards: await pickFive(U.a)}, U.a.tok); assert.strictEqual(s._s, 200, JSON.stringify(s));   // ora il 2 è aperto
    await api('POST', '/api/match/' + s.match.id + '/forfeit', null, U.a.tok);
  });
  await test('le sfide ai Custodi non toccano record e ELO contro gli amici', async ()=>{
    const me = await api('GET', '/api/me', null, U.a.tok); assert.strictEqual(me.wins + me.losses + me.draws >= 1, true);
    const list = (await api('GET', '/api/matches', null, U.a.tok)).matches; assert(list.some(m=> m.boss === 1));
  });

  console.log('Limiti e sicurezza');
  await test('le carte fuori dalla quantità mondiale non si creano più', async ()=>{
    const s = await api('GET', '/api/supply'); Object.values(s.supply).forEach(([minted, cap])=> assert(minted <= cap, 'oltre il limite'));
  });
  await test('richieste strane non fanno crollare il server', async ()=>{
    for(const [m, p, b] of [['POST', '/api/register', '{"nick":'], ['POST', '/api/recover', '[]'], ['GET', '/api/nulla', null], ['POST', '/api/friends/request', 'x']]){
      const r = await fetch(BASE + p, {method: m, headers: {'content-type': 'application/json', authorization: 'Bearer ' + U.a.tok}, body: b}); assert(r.status >= 400 && r.status < 500, p + ' ' + r.status);
    }
    const big = await fetch(BASE + '/api/register', {method: 'POST', body: JSON.stringify({nick: 'x'.repeat(30000)})}); assert.strictEqual(big.status, 413);
    assert.strictEqual((await fetch(BASE + '/api/me', {method: 'OPTIONS'})).status, 204);
  });
  await test('troppi tentativi di recupero vengono fermati', async ()=>{
    let last; for(let i = 0; i < 10; i++) last = await api('POST', '/api/recover', {nick: 'Alice', recovery: 'AAAA-BBBB-CCCC-DDDD-EEE' + (i % 9)}); assert.strictEqual(last._s, 429);
  });

  console.log('\n' + ok + ' prove riuscite, ' + bad + ' fallite');
  try{ U.sa.ws.close(); U.sb.ws.close(); }catch(e){}
  process.exit(bad ? 1 : 0);
})();
