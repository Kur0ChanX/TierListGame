// Triple Triad di Frugu — economia del gioco: monete, XP e livelli, buste, missioni, collezioni, traguardi, polvere (officina), eventi.
// Tutto sta nel server: nessuno può darsi monete o carte da solo. Questi metodi vengono aggiunti alla classe Hub in worker.js.
const GENRE_N = {plat: 'Platform', rpg: 'GDR', act: 'Azione', fps: 'Sparatutto', fight: 'Picchiaduro', horror: 'Horror', strat: 'Strategia', race: 'Corse', puzzle: 'Puzzle', arcade: 'Arcade', sport: 'Sport', mobile: 'Mobile', online: 'Online', indie: 'Indie', stealth: 'Stealth', sandbox: 'Sandbox'};
const LV_XP = L=> 100 + 40 * L;                                    // XP per passare dal livello L al successivo
export function lvOf(xp){ let L = 1, n = Math.max(0, xp | 0); while(n >= LV_XP(L) && L < 500){ n -= LV_XP(L); L++; } return {lvl: L, cur: n, need: LV_XP(L)}; }
export const lvReward = L=> ({coins: 40 + 6 * L, ticket: L % 25 === 0 ? 'leg' : L % 10 === 0 ? 'epica' : L % 5 === 0 ? 'rara' : null});
const W_BASE = [34, 26, 18, 10, 6, 3.5, 1.5, .7, .25, .05];
export const PACKS = {
  base: {name: 'Busta Base', cost: 60, n: 3, w: W_BASE, guar: 3, pity: 10},
  rara: {name: 'Busta Rara', cost: 200, n: 3, w: [0, 0, 0, 12, 30, 28, 18, 8, 3.5, .5], guar: 5, pity: 8},
  epica: {name: 'Busta Epica', cost: 520, n: 3, w: [0, 0, 0, 0, 0, 32, 34, 22, 10, 2], guar: 7, pity: 6},
  leg: {name: 'Busta Leggendaria', cost: 1300, n: 2, w: [0, 0, 0, 0, 0, 0, 0, 52, 38, 10], guar: 9, pity: 4}
};
const W_EXP = [10, 14, 17, 16, 14, 11, 8, 5.5, 3.5, 1];
const DUST = [0, 5, 8, 12, 20, 35, 60, 110, 200, 380, 750];
export const VARIANTS = ['Normale', 'Holo', 'Reverse Holo', 'Full Art', 'Oro', 'Segreta'];   // stesse cifre, aspetto diverso: si collezionano, non si «potenziano»
const VMUL = [1, 3, 3, 5, 8, 15];                                // valore in polvere delle versioni
const VW = {base: [880, 60, 35, 18, 6, 1], rara: [820, 90, 55, 25, 9, 1], epica: [740, 120, 75, 40, 20, 5], leg: [600, 170, 110, 70, 40, 10], exp: [860, 70, 40, 20, 9, 1]};   // probabilità per mille      // polvere ottenuta smontando una copia extra, per livello
const CRAFT_MAX = 8;                                              // dal livello 9 in su le carte non si possono creare
const MIS_D = [
  {k: 'play3', kind: 'play', t: 3, txt: 'Gioca 3 partite', c: 40, xp: 30}, {k: 'win2', kind: 'win', t: 2, txt: 'Vinci 2 partite', c: 60, xp: 50},
  {k: 'trig3', kind: 'trigger', t: 3, txt: 'Fai scattare Same, Plus o Combo 3 volte', c: 50, xp: 40}, {k: 'boss1', kind: 'boss', t: 1, txt: 'Batti un Custode', c: 80, xp: 60},
  {k: 'cap15', kind: 'capture', t: 15, txt: 'Cattura 15 carte in partita', c: 50, xp: 40}, {k: 'rank1', kind: 'ranked', t: 1, txt: 'Gioca una Sfida vera', c: 45, xp: 40},
  {k: 'elem3', kind: 'elem', t: 3, txt: 'Gioca 3 carte sulla casella del loro elemento', c: 40, xp: 30}
];
const MIS_W = [
  {k: 'win10', kind: 'win', t: 10, txt: 'Vinci 10 partite', c: 200, xp: 150, ticket: 'rara'}, {k: 'play20', kind: 'play', t: 20, txt: 'Gioca 20 partite', c: 150, xp: 120},
  {k: 'trig20', kind: 'trigger', t: 20, txt: 'Fai scattare 20 regole speciali', c: 160, xp: 120}, {k: 'boss5', kind: 'boss', t: 5, txt: 'Batti i Custodi 5 volte', c: 250, xp: 180, ticket: 'rara'},
  {k: 'steal2', kind: 'steal', t: 2, txt: 'Ruba 2 carte agli amici', c: 300, xp: 200, ticket: 'epica'}
];
const ACH = [
  ['first', 'Prima vittoria', 'Vinci una partita', 'wins', 1, 50], ['w10', 'Vincitore', 'Vinci 10 partite', 'wins', 10, 100], ['w50', 'Campione', 'Vinci 50 partite', 'wins', 50, 300, 'rara'], ['w100', 'Leggenda', 'Vinci 100 partite', 'wins', 100, 600, 'epica'],
  ['s5', 'In serie', 'Vinci 5 partite di fila', 'streak', 5, 150], ['s10', 'Inarrestabile', 'Vinci 10 partite di fila', 'streak', 10, 400, 'rara'],
  ['g25', 'Giocatore assiduo', 'Gioca 25 partite', 'games', 25, 80], ['g100', 'Veterano', 'Gioca 100 partite', 'games', 100, 250],
  ['u25', 'Collezionista', '25 carte diverse', 'uniq', 25, 100], ['u50', 'Grande collezione', '50 carte diverse', 'uniq', 50, 250], ['u100', 'Museo', '100 carte diverse', 'uniq', 100, 500, 'rara'], ['u200', 'Enciclopedia', '200 carte diverse', 'uniq', 200, 2000, 'epica'],
  ['l1', 'Carta leggendaria', 'Possiedi una carta di livello 9 o 10', 'legend', 1, 200], ['m1', 'Carta mitica', 'Possiedi una carta di livello 10', 'mythic', 1, 500, 'epica'],
  ['b1', 'Cacciatore di Custodi', 'Batti un Custode', 'boss', 1, 100], ['b5', 'Domatore', 'Batti 5 Custodi diversi', 'boss', 5, 300], ['b10', 'Re dei Giochi', 'Batti tutti i 10 Custodi', 'boss', 10, 1000, 'leg'],
  ['t1', 'Ladro di carte', 'Ruba una carta a un amico', 'steals', 1, 100], ['t10', 'Ladro esperto', 'Ruba 10 carte', 'steals', 10, 400, 'rara'], ['t25', 'Re dei ladri', 'Ruba 25 carte', 'steals', 25, 900, 'epica'],
  ['e12', 'SeeD', 'Raggiungi 1200 ELO', 'elo', 1200, 150], ['e14', 'Comandante', 'Raggiungi 1400 ELO', 'elo', 1400, 350, 'rara'], ['e16', 'Maestro Triad', 'Raggiungi 1600 ELO', 'elo', 1600, 800, 'epica'],
  ['v5', 'Livello 5', 'Raggiungi il livello 5', 'lvl', 5, 50], ['v10', 'Livello 10', 'Raggiungi il livello 10', 'lvl', 10, 150, 'rara'], ['v25', 'Livello 25', 'Raggiungi il livello 25', 'lvl', 25, 500, 'epica'], ['v50', 'Livello 50', 'Raggiungi il livello 50', 'lvl', 50, 1500, 'leg'],
  ['p10', 'Apri-buste', 'Apri 10 buste', 'packs', 10, 100], ['p50', 'Pacchi a go-go', 'Apri 50 buste', 'packs', 50, 300, 'rara'], ['p200', 'Re delle buste', 'Apri 200 buste', 'packs', 200, 1000, 'epica'],
  ['f1', 'Brillantezza', 'Ottieni una carta foil', 'foil', 1, 150], ['f5', 'Collezione scintillante', 'Ottieni 5 carte foil', 'foil', 5, 500, 'rara'], ['f20', 'Tesoro luccicante', 'Ottieni 20 carte foil diverse', 'variants', 20, 900, 'epica'], ['gold1', 'Oro colato', 'Ottieni una carta in versione Oro', 'gold', 1, 600, 'epica'], ['sec1', 'Segreta!', 'Ottieni una carta Segreta', 'secret', 1, 1500, 'leg'],
  ['c1', 'Set completo', 'Completa una collezione', 'sets', 1, 200, 'rara'], ['c5', 'Maestro dei set', 'Completa 5 collezioni', 'sets', 5, 600, 'epica'], ['c10', 'Signore dei set', 'Completa 10 collezioni', 'sets', 10, 1500, 'leg']
].map(a=> ({id: a[0], name: a[1], desc: a[2], stat: a[3], target: a[4], coins: a[5], ticket: a[6] || null}));
const hash = s=>{ let h = 2166136261; for(const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const TICKET_N = {base: 'Busta Base', rara: 'Busta Rara', epica: 'Busta Epica', leg: 'Busta Leggendaria'};

export function makeEconomy(D){
  const {CARD, BASE, EXPSETS, ALLC, fail, rint} = D;
  const M = {};
  // ---------------- eventi, ticket, premi
  M.eventInfo = function(){ const d = new Date().getUTCDay(); return (d === 0 || d === 6) ? {mul: 2, name: 'Weekend doppio: monete ×2!'} : {mul: 1, name: ''}; };
  M.inv = function(acc){ try{ return JSON.parse(this.row('SELECT inv FROM accounts WHERE id=?', acc).inv || '{}') || {}; }catch(e){ return {}; } };
  M.dailyCap = function(acc, key, max){
    const k = 'cap:' + key + ':' + acc, day = Math.floor(Date.now() / 86400000), r = this.row('SELECT n,t FROM throttle WHERE k=?', k);
    if(!r || r.t !== day){ this.run('INSERT OR REPLACE INTO throttle(k,n,t) VALUES(?,?,?)', k, 1, day); return true; }
    if(r.n >= max) return false; this.run('UPDATE throttle SET n=n+1 WHERE k=?', k); return true;
  };
  // assegna monete/xp/polvere/buste. Sale di livello da solo (con premi). Ritorna il riepilogo.
  M.award = function(acc, g){
    if(!acc || String(acc).startsWith('boss')) return null;
    const a = this.row('SELECT xp,coins,dust,inv FROM accounts WHERE id=?', acc); if(!a) return null;
    const mul = g.noEvent ? 1 : this.eventInfo().mul, coins = Math.round((g.coins || 0) * mul), xp = g.xp || 0, dust = g.dust || 0;
    let inv = {}; try{ inv = JSON.parse(a.inv || '{}') || {}; }catch(e){}
    if(g.ticket) inv[g.ticket] = (inv[g.ticket] || 0) + 1;
    const l0 = lvOf(a.xp).lvl, l1 = lvOf(a.xp + xp).lvl, ups = [];
    let bonus = 0;
    for(let L = l0 + 1; L <= l1; L++){ const r = lvReward(L); bonus += r.coins; if(r.ticket) inv[r.ticket] = (inv[r.ticket] || 0) + 1; ups.push({lvl: L, coins: r.coins, ticket: r.ticket}); }
    this.run('UPDATE accounts SET coins=coins+?, xp=xp+?, dust=dust+?, inv=? WHERE id=?', coins + bonus, xp, dust, JSON.stringify(inv), acc);
    ups.forEach(u=> this.news(acc, 'level', u));
    return {coins, xp, dust, mul, levels: ups, ticket: g.ticket || null};
  };
  M.grant = function(acc, g){ const r = this.award(acc, g); this.checkAch(acc); return r; };

  // ---------------- missioni
  const pickN = (pool, n, seed)=> pool.slice().sort((a, b)=> hash(a.k + seed) - hash(b.k + seed)).slice(0, n);
  M.missionKeys = function(){
    const days = Math.floor(Date.now() / 86400000), wk = Math.floor((days + 3) / 7);
    return {ds: 'd' + days, ws: 'w' + wk, daily: pickN(MIS_D, 3, days), weekly: pickN(MIS_W, 2, wk), nextDay: (days + 1) * 86400000, nextWeek: (wk * 7 + 4) * 86400000};
  };
  M.ensureMissions = function(acc){
    const K = this.missionKeys();
    K.daily.forEach(d=> this.run('INSERT OR IGNORE INTO missions(acc,sk,k) VALUES(?,?,?)', acc, K.ds, d.k));
    K.weekly.forEach(d=> this.run('INSERT OR IGNORE INTO missions(acc,sk,k) VALUES(?,?,?)', acc, K.ws, d.k));
    return K;
  };
  M.track = function(acc, kind, n){
    if(!acc || String(acc).startsWith('boss') || !(n > 0)) return;
    const K = this.ensureMissions(acc);
    K.daily.concat(K.weekly).forEach(d=>{ if(d.kind === kind) this.run('UPDATE missions SET prog=MIN(prog+?,?) WHERE acc=? AND sk=? AND k=?', n, d.t, acc, K.daily.includes(d) ? K.ds : K.ws, d.k); });
  };
  // conta cosa è successo in una mossa: carte prese, regole scattate, carte sulla casella del loro elemento
  M.trackEvents = function(acc, me, st0, events){
    let cur = -1, cap = 0, trig = 0, elem = 0;
    events.forEach(e=>{
      if(e.t === 'place'){ cur = e.p; if(e.p === me && st0.rules.elemental && st0.squares[e.cell] && e.card.e === st0.squares[e.cell]) elem++; }
      else if(cur === me && e.t === 'flip') cap++; else if(cur === me && e.t === 'rule') trig++;
    });
    this.track(acc, 'capture', cap); this.track(acc, 'trigger', trig); this.track(acc, 'elem', elem);
  };
  M.missionList = function(a){
    const K = this.ensureMissions(a.id), rows = this.rows('SELECT sk,k,prog,claimed FROM missions WHERE acc=? AND sk IN (?,?)', a.id, K.ds, K.ws), by = {};
    rows.forEach(r=> by[r.sk + r.k] = r);
    const fmt = (list, sk)=> list.map(d=>{ const r = by[sk + d.k] || {prog: 0, claimed: 0}; return {k: d.k, txt: d.txt, t: d.t, prog: r.prog, claimed: !!r.claimed, c: d.c, xp: d.xp, ticket: d.ticket || null}; });
    return {daily: fmt(K.daily, K.ds), weekly: fmt(K.weekly, K.ws), nextDay: K.nextDay, nextWeek: K.nextWeek, scope: {d: K.ds, w: K.ws}};
  };
  M.missionClaim = function(a, body){
    const K = this.ensureMissions(a.id), sc = body.scope === 'weekly' ? 'weekly' : 'daily', list = K[sc], sk = sc === 'weekly' ? K.ws : K.ds;
    const d = list.find(x=> x.k === String(body.key || '')); if(!d) fail(404, 'Missione non trovata', 'nf');
    const r = this.row('SELECT prog,claimed FROM missions WHERE acc=? AND sk=? AND k=?', a.id, sk, d.k);
    if(!r || r.prog < d.t) fail(409, 'Missione non ancora completata', 'todo');
    if(r.claimed) fail(409, 'Premio già ritirato', 'claimed');
    this.run('UPDATE missions SET claimed=1 WHERE acc=? AND sk=? AND k=?', a.id, sk, d.k);
    return {gain: this.grant(a.id, {coins: d.c, xp: d.xp, ticket: d.ticket})};
  };
  M.missionsReady = function(acc){ const l = this.missionList({id: acc}); return l.daily.concat(l.weekly).filter(m=> m.prog >= m.t && !m.claimed).length; };

  // ---------------- buste
  M.packDef = function(type){
    if(PACKS[type]) return Object.assign({type}, PACKS[type]);
    const m = String(type).match(/^exp:([a-z0-9]+)$/), s = m && EXPSETS.find(x=> x.id === m[1]);
    return s ? {type, name: 'Busta ' + s.name, cost: 220, n: 3, w: W_EXP, guar: 4, pity: 8, set: s.id, level: s.level} : null;
  };
  const rollVar = (key, lv)=>{ const w = (VW[key] || VW.exp).slice(); if(lv >= 7){ w[0] = Math.max(300, w[0] - 120); w[1] += 60; w[2] += 30; w[3] += 20; w[4] += 8; w[5] += 2; } const tot = w.reduce((a, b)=> a + b, 0), r = rint(tot); let acc = 0; for(let i = 0; i < w.length; i++){ acc += w[i]; if(r < acc) return i; } return 0; };
  const rollW = w=>{ const tot = w.reduce((x, y)=> x + y, 0), r = rint(100000) / 100000 * tot; let acc = 0; for(let i = 0; i < w.length; i++){ acc += w[i]; if(r < acc) return i + 1; } return w.findIndex(x=> x > 0) + 1; };
  M.shop = function(a){
    const row = this.row('SELECT * FROM accounts WHERE id=?', a.id), lv = lvOf(row.xp).lvl, inv = this.inv(a.id), pity = (()=>{ try{ return JSON.parse(row.pity || '{}'); }catch(e){ return {}; } })();
    const owned = new Set(this.rows('SELECT DISTINCT cid FROM cards WHERE owner=?', a.id).map(r=> r.cid));
    return {coins: row.coins, dust: row.dust, tickets: inv, level: lv, event: this.eventInfo(),
      packs: Object.keys(PACKS).map(k=> ({type: k, name: PACKS[k].name, cost: PACKS[k].cost, n: PACKS[k].n, guar: PACKS[k].guar, pityMax: PACKS[k].pity, pity: pity[k] || 0, ticket: inv[k] || 0})),
      expansions: EXPSETS.map(s=>{ const cs = ALLC.filter(c=> c.set === s.id); return {id: s.id, name: s.name, emoji: s.emoji, desc: s.desc, level: s.level, locked: lv < s.level, owned: cs.filter(c=> owned.has(c.id)).length, total: cs.length, cost: 220, ticket: inv['exp:' + s.id] || 0, pity: pity['exp:' + s.id] || 0, pityMax: 8}; })};
  };
  M.openPack = function(a, body){
    const def = this.packDef(String(body.type || '')); if(!def) fail(400, 'Busta sconosciuta', 'pack');
    this.hit('pk:' + a.id, 60, 60000, 'Calma con le buste!');
    const row = this.row('SELECT * FROM accounts WHERE id=?', a.id), lv = lvOf(row.xp).lvl;
    if(def.level && lv < def.level) fail(403, 'Questa espansione si sblocca al livello ' + def.level, 'locked');
    let inv = this.inv(a.id), paid = 'coins';
    const tk = def.set ? 'exp:' + def.set : def.type;
    if(inv[tk] > 0 && body.coins !== true){ inv[tk]--; paid = 'ticket'; this.run('UPDATE accounts SET inv=? WHERE id=?', JSON.stringify(inv), a.id); }
    else { if(row.coins < def.cost) fail(402, 'Monete insufficienti: servono ' + def.cost + ' 🪙', 'coins'); this.run('UPDATE accounts SET coins=coins-? WHERE id=?', def.cost, a.id); }
    let pity = {}; try{ pity = JSON.parse(row.pity || '{}'); }catch(e){}
    pity[tk] = (pity[tk] || 0) + 1;
    const lvls = Array.from({length: def.n}, ()=> rollW(def.w));
    lvls[def.n - 1] = Math.max(lvls[def.n - 1], def.guar);
    const boostTo = Math.min(10, def.guar + 3);
    if(pity[tk] >= def.pity){ lvls[def.n - 1] = Math.max(lvls[def.n - 1], boostTo); }
    if(Math.max(...lvls) >= boostTo) pity[tk] = 0;
    const owned = new Set(this.rows('SELECT DISTINCT cid FROM cards WHERE owner=?', a.id).map(r=> r.cid)), out = [];
    lvls.sort((x, y)=> x - y).forEach(L=>{
      const vr = rollVar(def.set ? 'exp' : def.type, L), c = this.mint(a.id, L, 'pack', def.set || 'base', vr);
      if(c){ out.push({uid: c.uid, cid: c.cid, lv: c.lv, v: vr, foil: vr > 0, isNew: !owned.has(c.cid)}); owned.add(c.cid); }
    });
    this.run('UPDATE accounts SET pity=?, packs_n=packs_n+1 WHERE id=?', JSON.stringify(pity), a.id);
    const gain = this.award(a.id, {xp: 8, noEvent: true}); this.checkAch(a.id);
    const fresh = this.row('SELECT coins FROM accounts WHERE id=?', a.id);
    return {cards: out, paid, coins: fresh.coins, tickets: this.inv(a.id), pity: pity[tk] || 0, pityMax: def.pity, xp: gain ? gain.xp : 0, name: def.name};
  };

  // ---------------- polvere: smonta le copie doppie, crea le carte che ti mancano
  M.dismantle = function(a, body){
    const uids = Array.isArray(body.uids) ? body.uids.filter(u=> typeof u === 'string' && /^u[0-9a-f]{14}$/.test(u)).slice(0, 40) : [];
    if(!uids.length) fail(400, 'Scegli almeno una copia doppia', 'dust');
    const have = {}; this.rows('SELECT cid,COUNT(*) n FROM cards WHERE owner=? GROUP BY cid', a.id).forEach(r=> have[r.cid] = r.n);
    let dust = 0, n = 0; const seen = new Set();
    uids.forEach(u=>{
      if(seen.has(u)) return; seen.add(u);
      const c = this.row('SELECT * FROM cards WHERE uid=? AND owner=?', u, a.id);
      if(!c || c.lock || !(have[c.cid] > 1)) return;
      have[c.cid]--; dust += DUST[CARD[c.cid].lv] * (VMUL[c.foil] || 1); n++;
      this.run('DELETE FROM cards WHERE uid=?', u);
      this.run('UPDATE supply SET minted=MAX(0,minted-1) WHERE cid=?', c.cid);          // la copia torna disponibile nel mondo
    });
    if(!n) fail(409, 'Si possono smontare solo le copie doppie non in partita', 'dust');
    this.run('UPDATE accounts SET dust=dust+? WHERE id=?', dust, a.id); this.checkAch(a.id);
    return {n, dust, total: this.row('SELECT dust FROM accounts WHERE id=?', a.id).dust};
  };
  M.craftCost = cid=> DUST[CARD[cid].lv] * 5;
  M.craft = function(a, body){
    const c = CARD[String(body.cid || '')]; if(!c) fail(404, 'Carta sconosciuta', 'nf');
    if(c.lv > CRAFT_MAX) fail(403, 'Le carte di livello 9 e 10 non si possono creare: si vincono o si rubano', 'craft');
    const cost = this.craftCost(c.id), row = this.row('SELECT dust FROM accounts WHERE id=?', a.id);
    if(row.dust < cost) fail(402, 'Polvere insufficiente: servono ' + cost, 'dust');
    if(this.left(c.id) <= 0) fail(409, 'Tutte le copie di questa carta sono già in circolazione', 'supply');
    this.run('UPDATE accounts SET dust=dust-? WHERE id=?', cost, a.id);
    const m = this.mintCid(a.id, c.id, 'craft', 0); this.checkAch(a.id);
    return {card: m, dust: row.dust - cost};
  };
  M.dustTable = ()=> ({dust: DUST, craftMax: CRAFT_MAX, craftMul: 5});

  // ---------------- collezioni (set da completare)
  let SETS = null;
  M.setDefs = function(){
    if(SETS) return SETS;
    SETS = [];
    Object.keys(GENRE_N).forEach(g=>{ const cs = BASE.filter(c=> c.g === g).map(c=> c.id); if(cs.length) SETS.push({id: 'g:' + g, name: 'Tutti i giochi «' + GENRE_N[g] + '»', cards: cs, reward: {coins: 15 * cs.length}}); });
    for(let lv = 1; lv <= 10; lv++){ const cs = BASE.filter(c=> c.lv === lv).map(c=> c.id); SETS.push({id: 'l:' + lv, name: 'Livello ' + lv + ' al completo', cards: cs, reward: {coins: 30 * lv * 4, ticket: lv >= 9 ? 'leg' : lv >= 7 ? 'epica' : lv >= 4 ? 'rara' : null}}); }
    EXPSETS.forEach(s=> SETS.push({id: 'x:' + s.id, name: s.emoji + ' ' + s.name + ' al completo', cards: ALLC.filter(c=> c.set === s.id).map(c=> c.id), reward: {coins: 1500, ticket: 'leg'}}));
    SETS.push({id: 'all', name: 'Album base al completo (200 carte)', cards: BASE.map(c=> c.id), reward: {coins: 6000, ticket: 'leg', dust: 2000}});
    return SETS;
  };
  M.setList = function(a){
    const own = new Set(this.rows('SELECT DISTINCT cid FROM cards WHERE owner=?', a.id).map(r=> r.cid)), cl = new Set(this.rows(`SELECT key FROM claims WHERE acc=? AND key LIKE 'set:%'`, a.id).map(r=> r.key));
    return {sets: this.setDefs().map(s=>{ const n = s.cards.filter(c=> own.has(c)).length; return {id: s.id, name: s.name, n, total: s.cards.length, reward: s.reward, claimed: cl.has('set:' + s.id), ready: n === s.cards.length && !cl.has('set:' + s.id), missing: s.cards.filter(c=> !own.has(c)).slice(0, 40)}; })};
  };
  M.setClaim = function(a, body){
    const s = this.setDefs().find(x=> x.id === String(body.id || '')); if(!s) fail(404, 'Collezione sconosciuta', 'nf');
    if(this.row('SELECT 1 FROM claims WHERE acc=? AND key=?', a.id, 'set:' + s.id)) fail(409, 'Premio già ritirato', 'claimed');
    const own = new Set(this.rows('SELECT DISTINCT cid FROM cards WHERE owner=?', a.id).map(r=> r.cid));
    if(!s.cards.every(c=> own.has(c))) fail(409, 'La collezione non è ancora completa', 'todo');
    this.run('INSERT INTO claims(acc,key,at) VALUES(?,?,?)', a.id, 'set:' + s.id, Date.now());
    const gain = this.grant(a.id, {coins: s.reward.coins, ticket: s.reward.ticket, dust: s.reward.dust || 0, xp: 60 + s.cards.length * 3, noEvent: true});
    this.news(a.id, 'set', {name: s.name, coins: s.reward.coins, ticket: s.reward.ticket || null});
    return {gain, set: s.id};
  };

  // ---------------- traguardi
  M.statsOf = function(acc){
    const a = this.row('SELECT * FROM accounts WHERE id=?', acc), cs = this.rows('SELECT cid,foil FROM cards WHERE owner=?', acc), own = new Set(cs.map(c=> c.cid));
    return {wins: a.wins, streak: a.best, games: a.wins + a.losses + a.draws, uniq: own.size, legend: cs.some(c=> CARD[c.cid].lv >= 9) ? 1 : 0, mythic: cs.some(c=> CARD[c.cid].lv === 10) ? 1 : 0,
      boss: this.row('SELECT COUNT(*) n FROM boss WHERE acc=? AND wins>0', acc).n, steals: a.steals, elo: a.elo, lvl: lvOf(a.xp).lvl, packs: a.packs_n, foil: cs.filter(c=> c.foil > 0).length, gold: cs.filter(c=> c.foil === 4).length, secret: cs.filter(c=> c.foil === 5).length, variants: new Set(cs.filter(c=> c.foil > 0).map(c=> c.cid + ':' + c.foil)).size,
      sets: this.row(`SELECT COUNT(*) n FROM claims WHERE acc=? AND key LIKE 'set:%'`, acc).n};
  };
  M.checkAch = function(acc){
    if(!acc || String(acc).startsWith('boss')) return;
    const st = this.statsOf(acc), done = new Set(this.rows(`SELECT key FROM claims WHERE acc=? AND key LIKE 'ach:%'`, acc).map(r=> r.key));
    ACH.forEach(d=>{
      if(done.has('ach:' + d.id) || !(st[d.stat] >= d.target)) return;
      this.run('INSERT OR IGNORE INTO claims(acc,key,at) VALUES(?,?,?)', acc, 'ach:' + d.id, Date.now());
      this.award(acc, {coins: d.coins, ticket: d.ticket, xp: 30, noEvent: true});
      this.news(acc, 'ach', {id: d.id, name: d.name, coins: d.coins, ticket: d.ticket});
    });
  };
  M.achList = function(a){
    const st = this.statsOf(a.id), done = new Set(this.rows(`SELECT key FROM claims WHERE acc=? AND key LIKE 'ach:%'`, a.id).map(r=> r.key));
    return {ach: ACH.map(d=> ({id: d.id, name: d.name, desc: d.desc, target: d.target, prog: Math.min(d.target, st[d.stat] || 0), done: done.has('ach:' + d.id), coins: d.coins, ticket: d.ticket}))};
  };
  return M;
}
