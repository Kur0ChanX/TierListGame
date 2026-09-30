// Triple Triad di Frugu — server online. Un solo Durable Object («Hub», database SQLite) tiene account, carte, amici, sfide e partite.
// Le regole di gioco sono quelle di ../../triad-core.js: le mosse le decide SOLO il server, quindi nessuno può barare.
// Comandi via HTTP (POST/GET /api/...), aggiornamenti in tempo reale via WebSocket (/ws?token=...).
import { DurableObject } from 'cloudflare:workers';
import Core from '../../triad-core.js';
import CARDS from '../../triad-cards.js';
import EXPD from '../../triad-exp.js';
import { makeEconomy, lvOf } from './economy.js';

const CARD = {}, BY_LV = {}, BY_SET = {}, BASE = [], ALLC = [], EXPSETS = EXPD.sets;   // BY_LV = carte base per livello; BY_SET[espansione][livello]
CARDS.concat(EXPD.cards).forEach(c=>{
  const o = {id: c[0], name: c[1], year: c[2], plat: c[3], lv: c[4], v: c[5], e: c[6], g: c[7], set: c[8] || 'base'}; CARD[o.id] = o; ALLC.push(o);
  if(o.set === 'base'){ BASE.push(o); (BY_LV[o.lv] = BY_LV[o.lv] || []).push(o); } else { BY_SET[o.set] = BY_SET[o.set] || {}; (BY_SET[o.set][o.lv] = BY_SET[o.set][o.lv] || []).push(o); }
});
// copie di ogni carta che possono esistere nel mondo (0 = illimitate). Le carte forti sono rare: dopo l'ultima copia si possono solo rubare.
const SUPPLY = {1: 0, 2: 0, 3: 0, 4: 0, 5: 14, 6: 10, 7: 8, 8: 6, 9: 4, 10: 3};
const BOSSES = [
  {n: 1, name: 'Zeno', title: 'Custode del Campo Minato', ai: 1, rules: {elemental: false, same: false, plus: false, combo: false}, lv: [1, 1, 1, 2, 2], reward: 2},
  {n: 2, name: 'Pixel', title: 'Guardiana dell\'Arcade', ai: 2, rules: {elemental: true, same: false, plus: false, combo: false}, lv: [1, 2, 2, 3, 3], reward: 3},
  {n: 3, name: 'Viola', title: 'Custode del Platform', ai: 2, rules: {elemental: false, same: true, plus: false, combo: false}, lv: [2, 2, 3, 3, 4], reward: 4},
  {n: 4, name: 'Dante', title: 'Custode dei Dungeon', ai: 3, rules: {elemental: true, same: true, plus: false, combo: true}, lv: [3, 3, 4, 4, 5], reward: 5},
  {n: 5, name: 'Mira', title: 'Custode delle Corse', ai: 3, rules: {elemental: false, same: false, plus: true, combo: true}, lv: [4, 4, 5, 5, 6], reward: 6},
  {n: 6, name: 'Rex', title: 'Custode degli Sparatutto', ai: 4, rules: {elemental: true, same: true, plus: true, combo: true}, lv: [5, 5, 6, 6, 7], reward: 7},
  {n: 7, name: 'Nova', title: 'Custode dell\'Horror', ai: 4, rules: {elemental: true, same: true, plus: true, sameWall: true, combo: true}, lv: [6, 6, 7, 7, 8], reward: 8},
  {n: 8, name: 'Kaiser', title: 'Custode dei JRPG', ai: 5, rules: {elemental: true, same: true, plus: true, combo: true}, lv: [7, 7, 8, 8, 9], reward: 9},
  {n: 9, name: 'Ombra', title: 'Custode delle Leggende', ai: 5, rules: {elemental: true, same: true, plus: true, sameWall: true, combo: true}, lv: [8, 8, 9, 9, 9], reward: 10},
  {n: 10, name: 'Il Re dei Giochi', title: 'Custode Supremo', ai: 5, rules: {elemental: true, same: true, plus: true, sameWall: true, combo: true}, lv: [9, 9, 10, 10, 10], reward: 10}
];
const RANKS = [[0, 'Recluta'], [1000, 'Cadetto'], [1150, 'SeeD'], [1300, 'SeeD Elite'], [1450, 'Comandante'], [1600, 'Maestro Triad']];
const rankOf = elo=> { let r = RANKS[0][1]; RANKS.forEach(x=>{ if(elo >= x[0]) r = x[1]; }); return r; };
const PICK_MS = 90000, CHALLENGE_MS = 15 * 60000, DAILY_MS = 20 * 3600000, BOSS_DAILY_MS = 20 * 3600000;
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CORS = {'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type', 'access-control-max-age': '86400'};

class ApiError extends Error { constructor(status, msg, code){ super(msg); this.status = status; this.code = code || 'err'; } }
const fail = (status, msg, code)=>{ throw new ApiError(status, msg, code); };
const enc = new TextEncoder();
async function sha256(s){ const b = await crypto.subtle.digest('SHA-256', enc.encode(s)); return [...new Uint8Array(b)].map(x=> x.toString(16).padStart(2, '0')).join(''); }
const rbytes = n=>{ const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
const hex = n=> [...rbytes(n)].map(x=> x.toString(16).padStart(2, '0')).join('');
const rcode = n=> [...rbytes(n)].map(x=> ALPHA[x % 32]).join('');
const rint = n=>{ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const norm = s=> String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const json = (data, status, extra)=> new Response(JSON.stringify(data), {status: status || 200, headers: Object.assign({'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}, CORS, extra || {})});

export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, {status: 204, headers: CORS});
    const url = new URL(req.url);
    if(url.pathname === '/' || url.pathname === '/api/ping') return json({ok: true, service: 'frugu-triad', v: 1, cards: ALLC.length});
    const stub = env.HUB.get(env.HUB.idFromName('main'));
    return stub.fetch(req);
  }
};

export class Hub extends DurableObject {
  constructor(ctx, env){
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.turnMs = Math.max(2000, parseInt(env.TURN_MS, 10) || 60000);
    this.scale = parseFloat(env.SUPPLY_SCALE) || 1;
    this.regMax = parseInt(env.REG_MAX, 10) || 8;
    this.startCoins = env.START_COINS != null ? parseInt(env.START_COINS, 10) : 150;
    ctx.blockConcurrencyWhile(async ()=>{ this.migrate(); });
  }
  migrate(){
    const q = s=> this.sql.exec(s);
    q(`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, nick TEXT, nick_l TEXT UNIQUE, code TEXT UNIQUE, tok TEXT, rec TEXT, created INTEGER, seen INTEGER,
      elo INTEGER DEFAULT 1000, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, draws INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, best INTEGER DEFAULT 0, ranked INTEGER DEFAULT 0,
      daily_at INTEGER DEFAULT 0, daily_n INTEGER DEFAULT 0)`);
    q(`CREATE INDEX IF NOT EXISTS acc_tok ON accounts(tok)`);
    q(`CREATE TABLE IF NOT EXISTS cards(uid TEXT PRIMARY KEY, owner TEXT, cid TEXT, lock TEXT, got INTEGER, src TEXT)`);
    q(`CREATE INDEX IF NOT EXISTS cards_owner ON cards(owner)`);
    q(`CREATE TABLE IF NOT EXISTS supply(cid TEXT PRIMARY KEY, minted INTEGER DEFAULT 0)`);
    q(`CREATE TABLE IF NOT EXISTS friends(a TEXT, b TEXT, status TEXT, created INTEGER, PRIMARY KEY(a, b))`);
    q(`CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, code TEXT UNIQUE, from_id TEXT, to_id TEXT, mode TEXT, rules TEXT, uids TEXT, created INTEGER, expires INTEGER)`);
    q(`CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY, p0 TEXT, p1 TEXT, mode TEXT, boss INTEGER, state TEXT, uids TEXT, status TEXT, deadline INTEGER, autos TEXT, ver INTEGER DEFAULT 1,
      result TEXT, created INTEGER, updated INTEGER)`);
    q(`CREATE INDEX IF NOT EXISTS m_status ON matches(status, deadline)`);
    q(`CREATE TABLE IF NOT EXISTS news(id INTEGER PRIMARY KEY AUTOINCREMENT, acc TEXT, ts INTEGER, kind TEXT, data TEXT, seen INTEGER DEFAULT 0)`);
    q(`CREATE INDEX IF NOT EXISTS news_acc ON news(acc, id)`);
    q(`CREATE TABLE IF NOT EXISTS boss(acc TEXT, n INTEGER, wins INTEGER DEFAULT 0, last_reward INTEGER DEFAULT 0, PRIMARY KEY(acc, n))`);
    q(`CREATE TABLE IF NOT EXISTS throttle(k TEXT PRIMARY KEY, n INTEGER, t INTEGER)`);
    q(`CREATE TABLE IF NOT EXISTS pairs(k TEXT PRIMARY KEY, n INTEGER, day INTEGER)`);
    q(`CREATE TABLE IF NOT EXISTS missions(acc TEXT, sk TEXT, k TEXT, prog INTEGER DEFAULT 0, claimed INTEGER DEFAULT 0, PRIMARY KEY(acc, sk, k))`);
    q(`CREATE TABLE IF NOT EXISTS claims(acc TEXT, key TEXT, at INTEGER, PRIMARY KEY(acc, key))`);
    const addCol = (t, c, def)=>{ if(!this.rows('PRAGMA table_info(' + t + ')').some(r=> r.name === c)) this.run('ALTER TABLE ' + t + ' ADD COLUMN ' + c + ' ' + def); };
    addCol('accounts', 'coins', 'INTEGER DEFAULT 150'); addCol('accounts', 'dust', 'INTEGER DEFAULT 0'); addCol('accounts', 'xp', 'INTEGER DEFAULT 0'); addCol('accounts', 'inv', "TEXT DEFAULT '{}'");
    addCol('accounts', 'pity', "TEXT DEFAULT '{}'"); addCol('accounts', 'steals', 'INTEGER DEFAULT 0'); addCol('accounts', 'packs_n', 'INTEGER DEFAULT 0'); addCol('cards', 'foil', 'INTEGER DEFAULT 0');
  }
  rows(q, ...a){ return this.sql.exec(q, ...a).toArray(); }
  row(q, ...a){ return this.rows(q, ...a)[0] || null; }
  run(q, ...a){ this.sql.exec(q, ...a); }
  hit(key, max, windowMs, msg){
    const now = Date.now(), r = this.row('SELECT n,t FROM throttle WHERE k=?', key);
    if(!r || r.t + windowMs < now){ this.run('INSERT OR REPLACE INTO throttle(k,n,t) VALUES(?,?,?)', key, 1, now); return; }
    if(r.n >= max) fail(429, msg || 'Troppi tentativi: riprova più tardi', 'throttle');
    this.run('UPDATE throttle SET n=n+1 WHERE k=?', key);
  }

  // ------------------------------------------------------------------ entrata
  async fetch(req){
    const url = new URL(req.url);
    try{
      if(url.pathname === '/ws') return await this.openSocket(req, url);
      const body = req.method === 'POST' ? await this.readBody(req) : {};
      return json(await this.route(req, url, body));
    }catch(e){
      if(e instanceof ApiError) return json({error: e.message, code: e.code}, e.status);
      console.log('errore', e && e.stack || e);
      return json({error: 'Errore del server, riprova', code: 'server'}, 500);
    }
  }
  async readBody(req){
    const t = await req.text(); if(t.length > 20000) fail(413, 'Richiesta troppo grande');
    if(!t) return {};
    try{ const b = JSON.parse(t); return b && typeof b === 'object' ? b : {}; }catch(e){ fail(400, 'JSON non valido'); }
  }
  async auth(req, url){
    const h = req.headers.get('authorization') || '', tok = h.startsWith('Bearer ') ? h.slice(7) : (url.searchParams.get('token') || '');
    if(!tok || tok.length < 20 || tok.length > 80) fail(401, 'Accesso richiesto', 'auth');
    const a = this.row('SELECT * FROM accounts WHERE tok=?', await sha256(tok));
    if(!a) fail(401, 'Sessione scaduta: questo account è stato aperto su un altro telefono, oppure il codice è cambiato', 'auth');
    if(Date.now() - a.seen > 60000) this.run('UPDATE accounts SET seen=? WHERE id=?', Date.now(), a.id);
    return a;
  }
  async route(req, url, body){
    const p = url.pathname.replace(/\/+$/, ''), m = req.method;
    const ip = req.headers.get('cf-connecting-ip') || 'x';
    if(m === 'POST' && p === '/api/register') return this.register(body, ip);
    if(m === 'POST' && p === '/api/recover') return this.recover(body, ip);
    if(m === 'GET' && p === '/api/config') return this.config();
    if(m === 'GET' && p === '/api/supply') return this.supplyInfo();
    if(m === 'GET' && p === '/api/leaderboard') return this.leaderboard(url.searchParams.get('by'));
    const a = await this.auth(req, url);
    const id = (re)=>{ const x = p.match(re); return x ? x[1] : null; };
    if(m === 'GET' && p === '/api/me') return this.me(a);
    if(m === 'GET' && p === '/api/collection') return this.collection(a);
    if(m === 'GET' && p === '/api/shop') return this.shop(a);
    if(m === 'POST' && p === '/api/packs/open') return this.openPack(a, body);
    if(m === 'GET' && p === '/api/missions') return this.missionList(a);
    if(m === 'POST' && p === '/api/missions/claim') return this.missionClaim(a, body);
    if(m === 'GET' && p === '/api/sets') return this.setList(a);
    if(m === 'POST' && p === '/api/sets/claim') return this.setClaim(a, body);
    if(m === 'GET' && p === '/api/achievements') return this.achList(a);
    if(m === 'POST' && p === '/api/dust/dismantle') return this.dismantle(a, body);
    if(m === 'POST' && p === '/api/dust/craft') return this.craft(a, body);
    if(m === 'POST' && p === '/api/daily') return this.daily(a);
    if(m === 'GET' && p === '/api/friends') return this.friendList(a);
    if(m === 'POST' && p === '/api/friends/request') return this.friendRequest(a, body);
    if(m === 'POST' && p === '/api/friends/accept') return this.friendAccept(a, body);
    if(m === 'POST' && p === '/api/friends/remove') return this.friendRemove(a, body);
    if(m === 'GET' && p === '/api/players') return this.searchPlayers(a, url.searchParams.get('q'));
    if(m === 'GET' && id(/^\/api\/player\/([a-z0-9]+)$/)) return this.profile(id(/^\/api\/player\/([a-z0-9]+)$/));
    if(m === 'GET' && p === '/api/news') return this.newsList(a, url.searchParams.get('since'));
    if(m === 'POST' && p === '/api/challenge') return this.challengeCreate(a, body);
    if(m === 'GET' && p === '/api/challenges') return this.challengeList(a);
    if(m === 'POST' && id(/^\/api\/challenge\/([a-z0-9]+)\/accept$/)) return this.challengeAccept(a, id(/^\/api\/challenge\/([a-z0-9]+)\/accept$/), body);
    if(m === 'POST' && id(/^\/api\/challenge\/([a-z0-9]+)\/(?:decline|cancel)$/)) return this.challengeEnd(a, id(/^\/api\/challenge\/([a-z0-9]+)\/(?:decline|cancel)$/));
    if(m === 'POST' && p === '/api/room/join') return this.roomJoin(a, body);
    if(m === 'POST' && p === '/api/boss/start') return this.bossStart(a, body);
    if(m === 'GET' && p === '/api/matches') return this.myMatches(a);
    if(m === 'GET' && id(/^\/api\/match\/([a-z0-9]+)$/)) return this.matchGet(a, id(/^\/api\/match\/([a-z0-9]+)$/), url.searchParams.get('ver'));
    if(m === 'POST' && id(/^\/api\/match\/([a-z0-9]+)\/move$/)) return this.matchMove(a, id(/^\/api\/match\/([a-z0-9]+)\/move$/), body);
    if(m === 'POST' && id(/^\/api\/match\/([a-z0-9]+)\/pick$/)) return this.matchPick(a, id(/^\/api\/match\/([a-z0-9]+)\/pick$/), body);
    if(m === 'POST' && id(/^\/api\/match\/([a-z0-9]+)\/forfeit$/)) return this.matchForfeit(a, id(/^\/api\/match\/([a-z0-9]+)\/forfeit$/));
    if(m === 'POST' && id(/^\/api\/match\/([a-z0-9]+)\/emote$/)) return this.matchEmote(a, id(/^\/api\/match\/([a-z0-9]+)\/emote$/), body);
    fail(404, 'Non trovato', 'nf');
  }

  // ------------------------------------------------------------------ WebSocket
  async openSocket(req, url){
    if(req.headers.get('upgrade') !== 'websocket') fail(426, 'Serve un WebSocket');
    const a = await this.auth(req, url);
    this.ctx.getWebSockets(a.id).forEach(w=>{ try{ w.send(JSON.stringify({t: 'kick', reason: 'other_tab'})); w.close(4000, 'altra scheda'); }catch(e){} });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [a.id]);
    pair[1].send(JSON.stringify({t: 'hello', me: this.me(a)}));
    this.friendIds(a.id).forEach(f=> this.push(f, {t: 'presence', id: a.id, nick: a.nick, online: true}));
    return new Response(null, {status: 101, webSocket: pair[0]});
  }
  webSocketMessage(ws, msg){
    try{ const d = JSON.parse(msg); if(d && d.t === 'ping') ws.send('{"t":"pong"}'); }catch(e){}
  }
  webSocketClose(ws){ try{ ws.close(); }catch(e){} }
  push(accId, msg){
    if(!accId || String(accId).startsWith('boss')) return;
    const s = JSON.stringify(msg);
    this.ctx.getWebSockets(accId).forEach(w=>{ try{ w.send(s); }catch(e){} });
  }
  online(accId){ return this.ctx.getWebSockets(accId).length > 0; }

  // ------------------------------------------------------------------ account
  cfg(){ return {turnMs: this.turnMs, pickMs: PICK_MS, supply: Object.fromEntries(Object.keys(SUPPLY).map(k=> [k, this.cap(+k)])), ranks: RANKS, elements: Core.ELEMENTS}; }
  config(){
    return Object.assign(this.cfg(), {expansions: EXPSETS, cards: ALLC.length, dust: this.dustTable(), rules: Core.DEFAULT_RULES, bosses: BOSSES.map(b=> ({n: b.n, name: b.name, title: b.title, ai: b.ai, rules: Core.normRules(b.rules), reward: b.reward}))});
  }
  cap(lv){ const s = SUPPLY[lv]; return s ? Math.max(1, Math.ceil(s * this.scale)) : 0; }
  async register(body, ip){
    const nick = String(body.nick || '').replace(/\s+/g, ' ').trim();
    if(!/^[A-Za-z0-9_\-. À-ÖØ-öø-ÿ]{3,16}$/.test(nick)) fail(400, 'Il nome deve avere da 3 a 16 caratteri (lettere, numeri, spazio, _ - .)', 'nick');
    const nl = norm(nick);
    if(/^(admin|frugu|raccoon|boss|custode|server|sistema|mario)$/.test(nl) || /(^| )(admin|custode)( |$)/.test(nl)) fail(400, 'Questo nome è riservato', 'nick');
    this.hit('reg:' + (await sha256(ip)).slice(0, 16), this.regMax, 24 * 3600000, 'Troppi account creati da questa rete oggi');
    if(this.row('SELECT 1 FROM accounts WHERE nick_l=?', nl)) fail(409, 'Nome già preso: scegline un altro', 'nick_taken');
    const id = 'a' + hex(6), token = 't' + hex(24), recovery = [0, 1, 2, 3, 4].map(()=> rcode(4)).join('-');
    let code; do{ code = rcode(6); }while(this.row('SELECT 1 FROM accounts WHERE code=?', code));
    const now = Date.now();
    this.run('INSERT INTO accounts(id,nick,nick_l,code,tok,rec,created,seen) VALUES(?,?,?,?,?,?,?,?)', id, nick, nl, code, await sha256(token), await sha256(recovery.replace(/-/g, '')), now, now);
    [1, 1, 2, 2, 3].forEach(lv=> this.mint(id, lv, 'starter'));
    this.run('UPDATE accounts SET coins=? WHERE id=?', this.startCoins, id);
    return {token, recovery, me: this.me(this.row('SELECT * FROM accounts WHERE id=?', id))};
  }
  async recover(body, ip){
    const nl = norm(body.nick || ''), rec = String(body.recovery || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!nl || rec.length !== 20) fail(400, 'Scrivi il nome e il codice di recupero (20 caratteri)', 'recover');
    this.hit('rec:' + nl + ':' + (await sha256(ip)).slice(0, 8), 8, 3600000, 'Troppi tentativi: riprova tra un\'ora');
    const a = this.row('SELECT * FROM accounts WHERE nick_l=?', nl);
    if(!a || a.rec !== await sha256(rec)) fail(403, 'Nome o codice di recupero non corretti', 'recover');
    const token = 't' + hex(24);
    this.run('UPDATE accounts SET tok=?, seen=? WHERE id=?', await sha256(token), Date.now(), a.id);
    this.ctx.getWebSockets(a.id).forEach(w=>{ try{ w.send(JSON.stringify({t: 'kick', reason: 'other_device'})); w.close(4001, 'altro telefono'); }catch(e){} });
    return {token, me: this.me(this.row('SELECT * FROM accounts WHERE id=?', a.id))};
  }
  me(a){
    a = this.row('SELECT * FROM accounts WHERE id=?', a.id);
    const cards = this.rows('SELECT cid FROM cards WHERE owner=?', a.id), power = cards.reduce((s, c)=> s + CARD[c.cid].lv * CARD[c.cid].lv, 0);
    const act = this.row(`SELECT id FROM matches WHERE (p0=?1 OR p1=?1) AND status IN ('active','picking') ORDER BY created DESC LIMIT 1`, a.id);
    const now = Date.now(), next = a.daily_at + DAILY_MS;
    return {id: a.id, nick: a.nick, code: a.code, elo: a.elo, rank: rankOf(a.elo), wins: a.wins, losses: a.losses, draws: a.draws, streak: a.streak, best: a.best, ranked: a.ranked,
      cards: cards.length, power, daily: {ready: now >= next, nextAt: next, n: a.daily_n}, match: act ? act.id : null,
      coins: a.coins, dust: a.dust, level: lvOf(a.xp).lvl, xp: lvOf(a.xp), tickets: this.inv(a.id), event: this.eventInfo(), missions: this.missionsReady(a.id), packs: a.packs_n, steals: a.steals,
      news: this.row('SELECT COUNT(*) n FROM news WHERE acc=? AND seen=0', a.id).n,
      requests: this.row(`SELECT COUNT(*) n FROM friends WHERE b=? AND status='pending'`, a.id).n,
      boss: Object.fromEntries(this.rows('SELECT n,wins FROM boss WHERE acc=?', a.id).map(r=> [r.n, r.wins]))};
  }
  profile(id){
    const a = this.row('SELECT * FROM accounts WHERE id=?', id); if(!a) fail(404, 'Giocatore non trovato', 'nf');
    const cards = this.rows('SELECT cid FROM cards WHERE owner=?', id).map(c=> CARD[c.cid]).sort((x, y)=> y.lv - x.lv || (y.v[0] + y.v[1] + y.v[2] + y.v[3]) - (x.v[0] + x.v[1] + x.v[2] + x.v[3]));
    return {id: a.id, nick: a.nick, elo: a.elo, rank: rankOf(a.elo), wins: a.wins, losses: a.losses, draws: a.draws, best: a.best, cards: cards.length, power: cards.reduce((s, c)=> s + c.lv * c.lv, 0), top: cards.slice(0, 5).map(c=> c.id), online: this.online(a.id), seen: a.seen};
  }

  // ------------------------------------------------------------------ carte
  left(cid){ const cap = this.cap(CARD[cid].lv); if(!cap) return 1e9; const r = this.row('SELECT minted FROM supply WHERE cid=?', cid); return cap - (r ? r.minted : 0); }
  // crea una carta nuova (livello richiesto, o il più alto ancora disponibile sotto); null se non ce n'è
  // crea una carta nuova (livello richiesto, o il più alto ancora disponibile sotto) dall'insieme `setId` ('base' o un'espansione); null se non ce n'è
  mint(acc, lv, src, setId, foil){
    const table = !setId || setId === 'base' ? BY_LV : (BY_SET[setId] || BY_LV);
    for(let L = Math.min(10, Math.max(1, lv)); L >= 1; L--){
      const pool = (table[L] || []).filter(c=> this.left(c.id) > 0);
      if(!pool.length) continue;
      return this.mintCid(acc, pool[rint(pool.length)].id, src, foil);
    }
    return null;
  }
  mintCid(acc, cid, src, foil){
    const uid = 'u' + hex(7);
    this.run('INSERT INTO cards(uid,owner,cid,got,src,foil) VALUES(?,?,?,?,?,?)', uid, acc, cid, Date.now(), src || '', foil ? 1 : 0);
    this.run('INSERT INTO supply(cid,minted) VALUES(?,1) ON CONFLICT(cid) DO UPDATE SET minted=minted+1', cid);
    return {uid, cid, lv: CARD[cid].lv, foil: !!foil};
  }
  ensureMin(acc){
    if(String(acc).startsWith('boss')) return 0;
    const n = this.row('SELECT COUNT(*) n FROM cards WHERE owner=?', acc).n;
    if(n >= 5) return 0;
    for(let i = n; i < 5; i++) this.mint(acc, 1, 'aiuto');
    this.news(acc, 'refill', {n: 5 - n});
    return 5 - n;
  }
  collection(a){
    this.ensureMin(a.id);
    return {cards: this.rows('SELECT uid,cid,lock,got,src,foil FROM cards WHERE owner=? ORDER BY got DESC', a.id).map(c=> ({uid: c.uid, cid: c.cid, lock: !!c.lock, got: c.got, src: c.src, foil: !!c.foil}))};
  }
  supplyInfo(){
    const m = Object.fromEntries(this.rows('SELECT cid,minted FROM supply').map(r=> [r.cid, r.minted]));
    const out = {};
    ALLC.forEach(c=>{ const cap = this.cap(c.lv); if(cap) out[c.id] = [m[c.id] || 0, cap]; });
    return {supply: out};
  }
  daily(a){
    const now = Date.now(), next = a.daily_at + DAILY_MS;
    if(now < next) fail(429, 'La ricompensa di oggi è già stata ritirata', 'daily');
    const cont = a.daily_at && now - a.daily_at < DAILY_MS * 2.2, n = cont ? a.daily_n + 1 : 1;
    let lv = [1, 1, 1, 1, 2, 2, 3][rint(7)];
    if(n % 7 === 0) lv = 4; else if(n % 3 === 0) lv = Math.max(lv, 2);
    const c = this.mint(a.id, lv, 'daily');
    this.run('UPDATE accounts SET daily_at=?, daily_n=? WHERE id=?', now, n, a.id);
    const gain = this.grant(a.id, {coins: 30 + 8 * Math.min(n % 7 || 7, 7), xp: 25, ticket: n % 7 === 0 ? 'rara' : null});
    return {card: c, streak: n, gain};
  }
  // controlla le 5 carte scelte (tue, diverse, libere) e le blocca con `tag`; ritorna gli uid nell'ordine dato
  takeCards(acc, uids, tag){
    if(!Array.isArray(uids) || uids.length !== 5) fail(400, 'Scegli esattamente 5 carte', 'cards');
    const seen = new Set();
    uids.forEach(u=>{ if(typeof u !== 'string' || !/^u[0-9a-f]{14}$/.test(u) || seen.has(u)) fail(400, 'Carte non valide', 'cards'); seen.add(u); });
    const rows = uids.map(u=> this.row('SELECT * FROM cards WHERE uid=? AND owner=?', u, acc));
    rows.forEach(r=>{ if(!r) fail(403, 'Una carta non è tua', 'cards'); if(r.lock) fail(409, 'Una carta è già in una sfida o partita in corso', 'locked'); });
    uids.forEach(u=> this.run('UPDATE cards SET lock=? WHERE uid=?', tag, u));
    return rows.map(r=> r.cid);
  }
  unlock(tag){ this.run('UPDATE cards SET lock=NULL WHERE lock=?', tag); }

  // ------------------------------------------------------------------ amici, novità
  news(acc, kind, data){
    if(String(acc).startsWith('boss')) return;
    const ts = Date.now(); this.run('INSERT INTO news(acc,ts,kind,data) VALUES(?,?,?,?)', acc, ts, kind, JSON.stringify(data || {}));
    const id = this.row('SELECT last_insert_rowid() i').i;
    this.push(acc, {t: 'news', item: {id, ts, kind, data: data || {}, seen: 0}});
  }
  newsList(a, since){
    const rows = this.rows('SELECT id,ts,kind,data,seen FROM news WHERE acc=? AND id>? ORDER BY id DESC LIMIT 60', a.id, +since || 0);
    this.run('UPDATE news SET seen=1 WHERE acc=? AND seen=0', a.id);
    return {news: rows.map(r=> ({id: r.id, ts: r.ts, kind: r.kind, data: JSON.parse(r.data), seen: r.seen}))};
  }
  friendIds(id){ return this.rows(`SELECT CASE WHEN a=?1 THEN b ELSE a END f FROM friends WHERE (a=?1 OR b=?1) AND status='accepted'`, id).map(r=> r.f); }
  areFriends(x, y){ return !!this.row(`SELECT 1 FROM friends WHERE status='accepted' AND ((a=?1 AND b=?2) OR (a=?2 AND b=?1))`, x, y); }
  findPlayer(who){
    who = String(who || '').trim(); if(!who) return null;
    return this.row('SELECT * FROM accounts WHERE code=?', who.toUpperCase()) || this.row('SELECT * FROM accounts WHERE id=?', who) || this.row('SELECT * FROM accounts WHERE nick_l=?', norm(who));
  }
  friendList(a){
    const out = this.rows('SELECT a,b,status FROM friends WHERE a=?1 OR b=?1', a.id).map(r=>{
      const other = r.a === a.id ? r.b : r.a, o = this.row('SELECT id,nick,elo,seen FROM accounts WHERE id=?', other); if(!o) return null;
      return {id: o.id, nick: o.nick, elo: o.elo, rank: rankOf(o.elo), online: this.online(o.id), seen: o.seen, state: r.status === 'accepted' ? 'friend' : (r.a === a.id ? 'sent' : 'incoming')};
    }).filter(Boolean);
    return {friends: out};
  }
  friendRequest(a, body){
    const o = this.findPlayer(body.to || body.code || body.nick);
    if(!o) fail(404, 'Non trovo nessuno con questo nome o codice', 'nf');
    if(o.id === a.id) fail(400, 'Sei tu!', 'self');
    this.hit('fr:' + a.id, 30, 3600000);
    const rev = this.row('SELECT * FROM friends WHERE a=? AND b=?', o.id, a.id), fwd = this.row('SELECT * FROM friends WHERE a=? AND b=?', a.id, o.id);
    if(fwd) return {ok: true, state: fwd.status === 'accepted' ? 'friend' : 'sent', friend: {id: o.id, nick: o.nick}};
    if(rev){ this.run(`UPDATE friends SET status='accepted' WHERE a=? AND b=?`, o.id, a.id); this.news(o.id, 'friend_ok', {id: a.id, nick: a.nick}); return {ok: true, state: 'friend', friend: {id: o.id, nick: o.nick}}; }
    this.run(`INSERT INTO friends(a,b,status,created) VALUES(?,?,'pending',?)`, a.id, o.id, Date.now());
    this.news(o.id, 'friend_req', {id: a.id, nick: a.nick});
    return {ok: true, state: 'sent', friend: {id: o.id, nick: o.nick}};
  }
  friendAccept(a, body){
    const r = this.row(`SELECT * FROM friends WHERE a=? AND b=? AND status='pending'`, String(body.id || ''), a.id);
    if(!r) fail(404, 'Richiesta non trovata', 'nf');
    this.run(`UPDATE friends SET status='accepted' WHERE a=? AND b=?`, r.a, a.id);
    this.news(r.a, 'friend_ok', {id: a.id, nick: a.nick});
    return {ok: true};
  }
  friendRemove(a, body){
    const id = String(body.id || '');
    this.run('DELETE FROM friends WHERE (a=?1 AND b=?2) OR (a=?2 AND b=?1)', a.id, id);
    return {ok: true};
  }
  searchPlayers(a, q){
    q = norm(q || '').replace(/[%_]/g, ''); if(q.length < 2) return {players: []};
    return {players: this.rows(`SELECT id,nick,elo FROM accounts WHERE nick_l LIKE ? AND id<>? ORDER BY elo DESC LIMIT 12`, '%' + q + '%', a.id).map(r=> ({id: r.id, nick: r.nick, elo: r.elo, rank: rankOf(r.elo), online: this.online(r.id)}))};
  }
  leaderboard(by){
    if(by === 'collection'){
      const rows = this.rows('SELECT a.id,a.nick,a.elo,c.cid FROM accounts a JOIN cards c ON c.owner=a.id');
      const m = {}; rows.forEach(r=>{ const o = m[r.id] = m[r.id] || {id: r.id, nick: r.nick, power: 0, cards: 0, best: 0}; const lv = CARD[r.cid].lv; o.power += lv * lv; o.cards++; if(lv > o.best) o.best = lv; });
      return {by: 'collection', players: Object.values(m).sort((x, y)=> y.power - x.power).slice(0, 50)};
    }
    return {by: 'elo', players: this.rows('SELECT id,nick,elo,wins,losses,draws,best FROM accounts WHERE ranked>0 ORDER BY elo DESC LIMIT 50').map(r=> Object.assign(r, {rank: rankOf(r.elo)}))};
  }

  // ------------------------------------------------------------------ sfide e stanze
  cleanRules(r, mode){
    r = Core.normRules(r && typeof r === 'object' ? r : {});
    return r;
  }
  challengeCreate(a, body){
    this.hit('ch:' + a.id, 40, 3600000);
    const mode = body.mode === 'friendly' ? 'friendly' : 'ranked', rules = this.cleanRules(body.rules);
    let to = null;
    if(body.to){ to = this.findPlayer(body.to); if(!to) fail(404, 'Giocatore non trovato', 'nf'); if(to.id === a.id) fail(400, 'Non puoi sfidare te stesso', 'self'); }
    const open = this.row('SELECT COUNT(*) n FROM challenges WHERE from_id=?', a.id).n; if(open >= 6) fail(429, 'Hai già troppe sfide aperte: annullane qualcuna', 'many');
    const id = 'c' + hex(6); let code = null;
    if(!to){ do{ code = rcode(5); }while(this.row('SELECT 1 FROM challenges WHERE code=?', code)); }
    const cid = this.takeCards(a.id, body.cards, 'c:' + id);
    const now = Date.now();
    this.run('INSERT INTO challenges(id,code,from_id,to_id,mode,rules,uids,created,expires) VALUES(?,?,?,?,?,?,?,?,?)', id, code, a.id, to ? to.id : null, mode, JSON.stringify(rules), JSON.stringify(body.cards), now, now + CHALLENGE_MS);
    if(to){ this.push(to.id, {t: 'challenge', challenge: this.chView(this.row('SELECT * FROM challenges WHERE id=?', id))}); this.news(to.id, 'challenge', {id, from: a.nick, mode}); }
    this.reschedule();
    return {id, code, mode, rules, expires: now + CHALLENGE_MS, cards: cid};
  }
  chView(c){
    const f = this.row('SELECT id,nick,elo FROM accounts WHERE id=?', c.from_id);
    return {id: c.id, code: c.code, from: f ? {id: f.id, nick: f.nick, elo: f.elo, rank: rankOf(f.elo)} : null, to: c.to_id, mode: c.mode, rules: JSON.parse(c.rules), expires: c.expires,
      cards: JSON.parse(c.uids).map(u=>{ const r = this.row('SELECT cid FROM cards WHERE uid=?', u); return r ? r.cid : null; })};
  }
  challengeList(a){
    const now = Date.now();
    return {incoming: this.rows('SELECT * FROM challenges WHERE to_id=? AND expires>?', a.id, now).map(c=> this.chView(c)), mine: this.rows('SELECT * FROM challenges WHERE from_id=? AND expires>?', a.id, now).map(c=> this.chView(c))};
  }
  challengeEnd(a, id){
    const c = this.row('SELECT * FROM challenges WHERE id=?', id); if(!c) fail(404, 'Sfida non trovata', 'nf');
    if(c.from_id !== a.id && c.to_id !== a.id) fail(403, 'Non è la tua sfida', 'forbidden');
    this.run('DELETE FROM challenges WHERE id=?', id); this.unlock('c:' + id);
    if(c.to_id === a.id) this.push(c.from_id, {t: 'challenge_end', id, reason: 'declined'});
    return {ok: true};
  }
  challengeAccept(a, id, body){
    const c = this.row('SELECT * FROM challenges WHERE id=?', id); if(!c || c.expires < Date.now()) fail(404, 'Sfida scaduta o non trovata', 'nf');
    if(c.from_id === a.id) fail(400, 'Non puoi accettare la tua sfida', 'self');
    if(c.to_id && c.to_id !== a.id) fail(403, 'Questa sfida non è per te', 'forbidden');
    return this.startFromChallenge(c, a, body.cards);
  }
  roomJoin(a, body){
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const c = this.row('SELECT * FROM challenges WHERE code=? AND expires>?', code, Date.now()); if(!c) fail(404, 'Stanza non trovata o scaduta', 'nf');
    if(c.from_id === a.id) fail(400, 'Questa è la tua stanza: fai entrare un amico', 'self');
    return this.startFromChallenge(c, a, body.cards);
  }
  startFromChallenge(c, a, cards){
    const mid = 'm' + hex(6);
    let cidB; try{ cidB = this.takeCards(a.id, cards, 'm:' + mid); }catch(e){ throw e; }
    const uidsA = JSON.parse(c.uids); this.run('UPDATE cards SET lock=? WHERE lock=?', 'm:' + mid, 'c:' + c.id);
    this.run('DELETE FROM challenges WHERE id=?', c.id);
    const flip = rint(2), p0 = flip ? c.from_id : a.id, p1 = flip ? a.id : c.from_id, u0 = flip ? uidsA : cards, u1 = flip ? cards : uidsA;
    const m = this.newMatch(mid, p0, p1, c.mode, 0, JSON.parse(c.rules), [u0, u1]);
    return {match: this.view(m, a.id)};
  }

  // ------------------------------------------------------------------ partite
  handOf(uids){ return uids.map(u=>{ const r = this.row('SELECT cid FROM cards WHERE uid=?', u); const c = CARD[r.cid]; return {id: c.id, v: c.v, e: c.e}; }); }
  newMatch(id, p0, p1, mode, boss, rules, uids, hands){
    hands = hands || [this.handOf(uids[0]), this.handOf(uids[1])];
    const st = Core.newGame({rules, seed: rint(4294967296), first: rint(2), hands}), now = Date.now();
    this.run('INSERT INTO matches(id,p0,p1,mode,boss,state,uids,status,deadline,autos,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', id, p0, p1, mode, boss || 0, JSON.stringify(st), JSON.stringify(uids), 'active', now + this.turnMs, '[0,0]', now, now);
    let m = this.row('SELECT * FROM matches WHERE id=?', id), ev = [];
    if(boss && st.turn === 1){ const r = this.bossPlay(m, st); m = r.m; ev = r.events; }
    [p0, p1].forEach(p=> this.push(p, {t: 'match', events: ev, match: this.view(m, p)}));
    this.reschedule();
    return m;
  }
  pinfo(id){
    if(String(id).startsWith('boss')){ const b = BOSSES[+id.slice(4) - 1]; return {id, nick: b.name, title: b.title, boss: b.n, elo: 0, rank: 'Custode'}; }
    const a = this.row('SELECT id,nick,elo FROM accounts WHERE id=?', id); return a ? {id: a.id, nick: a.nick, elo: a.elo, rank: rankOf(a.elo)} : {id, nick: '?', elo: 0, rank: ''};
  }
  view(m, me){
    const st = JSON.parse(m.state), res = m.result ? JSON.parse(m.result) : null, out = {id: m.id, mode: m.mode, boss: m.boss, status: m.status, ver: m.ver, deadline: m.deadline, turnMs: this.turnMs,
      players: [this.pinfo(m.p0), this.pinfo(m.p1)], you: m.p0 === me ? 0 : (m.p1 === me ? 1 : -1), state: st, result: res, autos: JSON.parse(m.autos)};
    try{ out.foil = JSON.parse(m.uids).map(l=> l.map(u=>{ const r = /^u[0-9a-f]{14}$/.test(u) ? this.row('SELECT foil FROM cards WHERE uid=?', u) : null; return r ? r.foil : 0; })); }catch(e){}
    if(m.status === 'picking' && st.over){
      const info = Core.tradeInfo(st), uids = JSON.parse(m.uids);
      out.pick = {by: info.winner, n: info.pick, from: info.loser, choices: [0, 1, 2, 3, 4].map(i=> ({u: info.loser * 5 + i, cid: st.stake[info.loser][i]}))};
    }
    return out;
  }
  saveMatch(m, st, patch){
    const now = Date.now();
    this.run('UPDATE matches SET state=?, status=?, deadline=?, autos=?, ver=ver+1, result=?, updated=? WHERE id=?', JSON.stringify(st), patch.status || m.status, patch.deadline != null ? patch.deadline : m.deadline, patch.autos || m.autos, patch.result || m.result, now, m.id);
    return this.row('SELECT * FROM matches WHERE id=?', m.id);
  }
  loadMatch(id){ const m = this.row('SELECT * FROM matches WHERE id=?', id); if(!m) fail(404, 'Partita non trovata', 'nf'); return m; }
  matchGet(a, id, ver){
    const m = this.loadMatch(id); if(m.p0 !== a.id && m.p1 !== a.id) fail(403, 'Non è la tua partita', 'forbidden');
    if(ver && +ver === m.ver) return {same: true, ver: m.ver};
    return {match: this.view(m, a.id)};
  }
  myMatches(a){
    return {matches: this.rows(`SELECT * FROM matches WHERE p0=?1 OR p1=?1 ORDER BY created DESC LIMIT 20`, a.id).map(m=>{
      const st = JSON.parse(m.state), r = m.result ? JSON.parse(m.result) : null;
      return {id: m.id, mode: m.mode, boss: m.boss, status: m.status, created: m.created, players: [this.pinfo(m.p0), this.pinfo(m.p1)], you: m.p0 === a.id ? 0 : 1, winner: r ? r.winner : null, score: r ? r.score : null, transfers: r ? r.transfers : null, elo: r ? r.elo : null};
    })};
  }
  matchMove(a, id, body){
    const m = this.loadMatch(id), me = m.p0 === a.id ? 0 : (m.p1 === a.id ? 1 : -1);
    if(me < 0) fail(403, 'Non è la tua partita', 'forbidden');
    if(m.status !== 'active') fail(409, 'La partita è finita', 'over');
    let st = JSON.parse(m.state);
    if(st.turn !== me) fail(409, 'Non è il tuo turno', 'turn');
    const st0 = st, r = Core.play(st, {hi: body.hi, cell: body.cell});
    if(!r.ok) fail(400, r.error, 'move');
    const autos = JSON.parse(m.autos); autos[me] = 0;
    const ev = r.events.slice(); st = r.state;
    this.trackEvents(a.id, me, st0, r.events);
    let mm = this.saveMatch(m, st, {deadline: Date.now() + this.turnMs, autos: JSON.stringify(autos)});
    if(st.over){ mm = this.finish(mm, st); }
    else if(mm.boss && st.turn === 1){ const b = this.bossPlay(mm, st); mm = b.m; b.events.forEach(e=> ev.push(e)); }
    const other = me === 0 ? mm.p1 : mm.p0;
    this.push(other, {t: 'move', id: mm.id, events: ev, match: this.view(mm, other)});
    this.reschedule();
    return {events: ev, match: this.view(mm, a.id)};
  }
  // il Custode gioca subito (senza attesa): ritorna gli eventi in ordine
  bossPlay(m, st){
    const b = BOSSES[m.boss - 1], events = []; let guard = 0;
    while(!st.over && st.turn === 1 && guard++ < 12){
      const mv = Core.ai(st, b.ai), r = Core.play(st, mv); if(!r.ok) break;
      st = r.state; r.events.forEach(e=> events.push(e));
    }
    m = this.saveMatch(m, st, {deadline: Date.now() + this.turnMs});
    if(st.over) m = this.finish(m, st);
    return {m, events};
  }
  forfeitState(st, loser){
    const s = JSON.parse(JSON.stringify(st)); s.over = true; s.turn = -1;
    const sc = Core.score(s); if(loser === 0 && sc[0] >= sc[1]) sc[0] = sc[1] - 1; if(loser === 1 && sc[1] >= sc[0]) sc[1] = sc[0] - 1;
    s.result = {winner: 1 - loser, score: [Math.max(0, sc[0]), Math.max(0, sc[1])], round: s.round, holders: Core.holders(st), forfeit: true};
    return s;
  }
  matchForfeit(a, id){
    const m = this.loadMatch(id), me = m.p0 === a.id ? 0 : (m.p1 === a.id ? 1 : -1);
    if(me < 0) fail(403, 'Non è la tua partita', 'forbidden');
    if(m.status !== 'active') fail(409, 'La partita è finita', 'over');
    const st = this.forfeitState(JSON.parse(m.state), me);
    let mm = this.saveMatch(m, st, {});
    mm = this.finish(mm, st);
    const other = me === 0 ? mm.p1 : mm.p0;
    this.push(other, {t: 'move', id: mm.id, events: [{t: 'end', winner: 1 - me, score: st.result.score, forfeit: true}], match: this.view(mm, other)});
    this.reschedule();
    return {match: this.view(mm, a.id)};
  }
  matchEmote(a, id, body){
    const m = this.loadMatch(id), me = m.p0 === a.id ? 0 : (m.p1 === a.id ? 1 : -1);
    if(me < 0) fail(403, 'Non è la tua partita', 'forbidden');
    const e = body.e | 0; if(e < 0 || e > 11) fail(400, 'Emoticon non valida', 'emote');
    this.hit('em:' + a.id, 12, 20000, 'Calma con le emoticon!');
    this.push(me === 0 ? m.p1 : m.p0, {t: 'emote', match: id, from: me, e});
    return {ok: true};
  }
  matchPick(a, id, body){
    const m = this.loadMatch(id); if(m.status !== 'picking') fail(409, 'Non c\'è nulla da scegliere', 'state');
    const st = JSON.parse(m.state), res = JSON.parse(m.result), win = res.winner === 0 ? m.p0 : m.p1;
    if(win !== a.id) fail(403, 'Le carte le sceglie il vincitore', 'forbidden');
    const picks = Array.isArray(body.picks) ? body.picks.map(Number) : [];
    const tr = Core.tradeResolve(st, picks); if(!tr) fail(400, 'Scelta non valida: controlla quante carte puoi prendere', 'pick');
    const mm = this.settle(m, st, tr);
    const other = mm.p0 === a.id ? mm.p1 : mm.p0;
    this.push(other, {t: 'match', events: [], match: this.view(mm, other)});
    this.reschedule();
    return {match: this.view(mm, a.id)};
  }

  // ------------------------------------------------------------------ fine partita, ELO, scambi
  elo(m, st, res){
    if(m.mode !== 'ranked' || String(m.p1).startsWith('boss')) return null;
    const A = this.row('SELECT * FROM accounts WHERE id=?', m.p0), B = this.row('SELECT * FROM accounts WHERE id=?', m.p1);
    const day = Math.floor(Date.now() / 86400000), key = [m.p0, m.p1].sort().join('|');
    const pr = this.row('SELECT * FROM pairs WHERE k=?', key), n = pr && pr.day === day ? pr.n + 1 : 1;
    this.run('INSERT OR REPLACE INTO pairs(k,n,day) VALUES(?,?,?)', key, n, day);
    const S = res.winner === 0 ? 1 : (res.winner === 1 ? 0 : 0.5), ea = 1 / (1 + Math.pow(10, (B.elo - A.elo) / 400));
    const K = x=> x.elo >= 1400 ? 24 : 32, farm = n > 8 ? 0 : 1;              // dopo 8 sfide al giorno con la stessa persona non si guadagna più
    const da = Math.round(K(A) * (S - ea) * farm), db = Math.round(K(B) * ((1 - S) - (1 - ea)) * farm);
    this.run('UPDATE accounts SET elo=MAX(100,elo+?), ranked=ranked+1 WHERE id=?', da, A.id); this.run('UPDATE accounts SET elo=MAX(100,elo+?), ranked=ranked+1 WHERE id=?', db, B.id);
    return [da, db];
  }
  stats(id, outcome){
    if(String(id).startsWith('boss')) return;
    if(outcome === 'w') this.run('UPDATE accounts SET wins=wins+1, streak=streak+1, best=MAX(best,streak+1) WHERE id=?', id);
    else if(outcome === 'l') this.run('UPDATE accounts SET losses=losses+1, streak=0 WHERE id=?', id);
    else this.run('UPDATE accounts SET draws=draws+1 WHERE id=?', id);
  }
  finish(m, st){
    const res = st.result, players = [m.p0, m.p1], w = res.winner;
    if(!m.boss) players.forEach((p, i)=> this.stats(p, w == null ? 'd' : (w === i ? 'w' : 'l')));      // le sfide ai Custodi non contano nel record contro gli amici
    const elo = this.elo(m, st, res);
    const out = {winner: w, score: res.score, round: res.round, forfeit: !!res.forfeit, elo, transfers: [], gain: [null, null]};
    const farm = m.mode === 'ranked' && elo && elo[0] === 0 && elo[1] === 0 && w != null;
    players.forEach((id, i)=>{
      if(String(id).startsWith('boss')) return;
      const won = w === i, draw = w == null; let coins, xp;
      if(m.boss){ coins = won ? 40 : 5; xp = won ? 60 : 15; }
      else if(m.mode === 'ranked'){ coins = won ? 25 : draw ? 12 : 6; xp = won ? 45 : draw ? 25 : 15; if(farm || !this.dailyCap(id, 'rc', 30)) coins = 2; }
      else { coins = won ? 10 : draw ? 6 : 4; xp = won ? 25 : draw ? 15 : 10; if(!this.dailyCap(id, 'fc', 12)){ coins = 0; xp = Math.ceil(xp / 3); } }
      if(res.forfeit && !won){ coins = Math.min(coins, 2); xp = 5; }
      out.gain[i] = this.award(id, {coins, xp});
      this.track(id, 'play', 1); if(won) this.track(id, 'win', 1); if(m.mode === 'ranked' && !m.boss) this.track(id, 'ranked', 1);
      if(m.boss && won) this.track(id, 'boss', 1);
    });
    if(m.boss){
      const human = m.p0, won = w === 0, tag = 'm:' + m.id;
      this.unlock(tag);
      if(won){
        const b = BOSSES[m.boss - 1], rec = this.row('SELECT * FROM boss WHERE acc=? AND n=?', human, b.n), now = Date.now();
        let reward = null;
        if(!rec || rec.wins === 0){ reward = this.mint(human, b.reward, 'boss' + b.n); this.run('INSERT OR REPLACE INTO boss(acc,n,wins,last_reward) VALUES(?,?,1,?)', human, b.n, now); out.first = true; }
        else if(now - rec.last_reward >= BOSS_DAILY_MS){ reward = this.mint(human, rint(100) < 30 ? b.reward : Math.max(1, b.reward - 2), 'boss' + b.n); this.run('UPDATE boss SET wins=wins+1, last_reward=? WHERE acc=? AND n=?', now, human, b.n); }
        else this.run('UPDATE boss SET wins=wins+1 WHERE acc=? AND n=?', human, b.n);
        if(reward){ out.reward = reward; this.news(human, 'boss', {boss: b.n, name: b.name, cid: reward.cid, first: !!out.first}); }
        if(out.first){ const g2 = this.award(human, {coins: 160, xp: 100, noEvent: true}); if(out.gain[0] && g2){ out.gain[0].coins += g2.coins; out.gain[0].xp += g2.xp; out.gain[0].levels = out.gain[0].levels.concat(g2.levels); } }
      }
      this.checkAch(human);
      const mm = this.saveMatch(m, st, {status: 'done', result: JSON.stringify(out)});
      this.ensureMin(human);
      return mm;
    }
    const mode = m.mode, tag = 'm:' + m.id;
    if(mode === 'ranked' && w != null){
      const info = Core.tradeInfo(st);
      if(info.pick > 0){ return this.saveMatch(m, st, {status: 'picking', deadline: Date.now() + PICK_MS, result: JSON.stringify(out)}); }
      return this.settle(this.saveMatch(m, st, {result: JSON.stringify(out)}), st, info.auto);
    }
    this.unlock(tag);
    const mm = this.saveMatch(m, st, {status: 'done', result: JSON.stringify(out)});
    players.forEach(p=> this.checkAch(p));
    return mm;
  }
  // applica gli scambi: `tr` = [{u, id, from, to}] (u = indice carta nella partita 0-9)
  settle(m, st, tr){
    const uids = JSON.parse(m.uids), players = [m.p0, m.p1], out = JSON.parse(m.result) || {}, done = [];
    tr.forEach(t=>{
      const uid = uids[Math.floor(t.u / 5)][t.u % 5], from = players[t.from], to = players[t.to];
      this.run('UPDATE cards SET owner=?, lock=NULL, got=?, src=? WHERE uid=? AND owner=?', to, Date.now(), 'win:' + m.id, uid, from);
      done.push({cid: t.id, from, to, uid});
    });
    this.unlock('m:' + m.id);
    out.transfers = done.map(d=> ({cid: d.cid, from: d.from, to: d.to}));
    const A = this.pinfo(players[0]), B = this.pinfo(players[1]), nm = id=> id === players[0] ? A.nick : B.nick;
    done.forEach(d=>{ this.run('UPDATE accounts SET steals=steals+1 WHERE id=?', d.to); this.track(d.to, 'steal', 1); });
    done.forEach(d=>{ this.news(d.from, 'stolen', {by: nm(d.to), byId: d.to, cid: d.cid, match: m.id}); this.news(d.to, 'won', {from: nm(d.from), cid: d.cid, match: m.id}); });
    const mm = this.saveMatch(m, st, {status: 'done', result: JSON.stringify(out)});
    players.forEach(p=>{ this.ensureMin(p); this.checkAch(p); });
    return mm;
  }
  bossStart(a, body){
    const n = body.n | 0, b = BOSSES[n - 1]; if(!b) fail(400, 'Custode sconosciuto', 'boss');
    if(n > 1){ const prev = this.row('SELECT wins FROM boss WHERE acc=? AND n=?', a.id, n - 1); if(!prev || prev.wins < 1) fail(403, 'Prima devi battere il Custode precedente', 'locked_boss'); }
    const act = this.row(`SELECT 1 FROM matches WHERE (p0=?1 OR p1=?1) AND status='active' AND boss>0`, a.id); if(act) fail(409, 'Hai già una partita col Custode in corso', 'busy');
    this.hit('boss:' + a.id, 60, 3600000);
    const mid = 'm' + hex(6); this.takeCards(a.id, body.cards, 'm:' + mid);
    const hand = b.lv.map(L=>{ const c = BY_LV[L][rint(BY_LV[L].length)]; return {id: c.id, v: c.v, e: c.e}; });
    const m = this.newMatch(mid, a.id, 'boss' + n, 'boss', n, Core.normRules(b.rules), [body.cards, ['x', 'x', 'x', 'x', 'x']], [this.handOf(body.cards), hand]);
    return {match: this.view(this.row('SELECT * FROM matches WHERE id=?', mid), a.id)};
  }

  // ------------------------------------------------------------------ timer (allarmi)
  reschedule(){
    const a = this.row(`SELECT MIN(deadline) d FROM matches WHERE status IN ('active','picking')`), b = this.row('SELECT MIN(expires) d FROM challenges');
    const t = Math.min(a && a.d ? a.d : Infinity, b && b.d ? b.d : Infinity);
    if(t < Infinity) this.ctx.storage.setAlarm(Math.max(Date.now() + 200, t)); else this.ctx.storage.deleteAlarm();
  }
  async alarm(){
    const now = Date.now();
    this.rows('SELECT * FROM challenges WHERE expires<=?', now).forEach(c=>{ this.run('DELETE FROM challenges WHERE id=?', c.id); this.unlock('c:' + c.id); this.push(c.from_id, {t: 'challenge_end', id: c.id, reason: 'expired'}); });
    this.rows(`SELECT id FROM matches WHERE status IN ('active','picking') AND deadline<=?`, now).forEach(r=>{ try{ this.timeout(r.id); }catch(e){ console.log('timeout', e && e.stack || e); } });
    this.reschedule();
  }
  timeout(id){
    let m = this.row('SELECT * FROM matches WHERE id=?', id); if(!m) return;
    let st = JSON.parse(m.state);
    if(m.status === 'picking'){                                // il vincitore non ha scelto: prendo io le carte migliori del perdente
      const info = Core.tradeInfo(st), cards = [0, 1, 2, 3, 4].map(i=> ({u: info.loser * 5 + i, lv: CARD[st.stake[info.loser][i]].lv})).sort((x, y)=> y.lv - x.lv);
      const tr = Core.tradeResolve(st, cards.slice(0, info.pick).map(x=> x.u));
      const mm = this.settle(m, st, tr || []);
      [mm.p0, mm.p1].forEach(p=> this.push(p, {t: 'match', events: [], match: this.view(mm, p)}));
      return;
    }
    const me = st.turn, autos = JSON.parse(m.autos); autos[me]++;
    if(autos[me] >= 3){                                        // 3 turni di fila senza giocare: perde a tavolino
      const fs = this.forfeitState(st, me); let mm = this.saveMatch(m, fs, {autos: JSON.stringify(autos)}); mm = this.finish(mm, fs);
      [mm.p0, mm.p1].forEach(p=> this.push(p, {t: 'move', id: mm.id, events: [{t: 'end', winner: 1 - me, score: fs.result.score, forfeit: true}], match: this.view(mm, p)}));
      return;
    }
    const mv = Core.ai(st, 2), r = Core.play(st, mv); if(!r.ok) return;
    st = r.state; const ev = r.events.slice(); ev.forEach(e=>{ if(e.t === 'place') e.auto = true; });
    let mm = this.saveMatch(m, st, {deadline: Date.now() + this.turnMs, autos: JSON.stringify(autos)});
    if(st.over) mm = this.finish(mm, st);
    else if(mm.boss && st.turn === 1){ const b = this.bossPlay(mm, st); mm = b.m; b.events.forEach(e=> ev.push(e)); }
    [mm.p0, mm.p1].forEach(p=> this.push(p, {t: 'move', id: mm.id, events: ev, match: this.view(mm, p)}));
  }
}
Object.assign(Hub.prototype, makeEconomy({CARD, BASE, EXPSETS, ALLC, fail, rint}));
