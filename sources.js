// ---- Motore di ricerca "senza sosta" (SearchHub) ----
// Tante fonti diverse e vie alternative per raggiungerle. Se una via è bloccata, lenta o risponde con un errore, si passa SUBITO alla successiva:
//  1) accesso diretto; 2) attesa per «troppe richieste» e nuovo tentativo; 3) catena di ponti CORS pubblici (impara da sola quali funzionano e
//  mette in pausa quelli che falliscono); 4) altra fonte con lo stesso scopo. La ricerca continua a girare (con pause crescenti) finché non ha
//  abbastanza giochi, finché non premi «Basta frugare» o fino al tempo massimo.
// Usa solo endpoint pubblici e pagine pubbliche: niente accessi con credenziali altrui, niente aggiramento di login, captcha o paywall.
// Ogni tentativo finisce nel registro diagnostico nascosto (DebugLog, in loader.js).
(function(){
  'use strict';
  const H = window.SearchHub = {};
  const LOG = e=>{ try{ if(window.DebugLog) DebugLog.add(e); }catch(_){} };
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));
  const rnd = (a, b)=> a + Math.random() * (b - a);
  const ri = (a, b)=> Math.floor(rnd(a, b + 1));
  const pickOne = a=> a[ri(0, a.length - 1)];
  const shuffle = a=>{ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hostOf = u=>{ try{ return new URL(u).hostname; }catch(e){ return ''; } };
  const ls = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const tierOf = n=> n >= 95 ? 'S+' : n >= 90 ? 'S' : n >= 85 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : n >= 40 ? 'E' : 'F';
  const cleanTitle = t=> String(t || '').replace(/\s*\((?:video game|videogame|game)\)\s*$/i, '').replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();

  // ---------- attese minime per sito (per non farsi bloccare con «troppe richieste») ----------
  const GAP = {'en.wikipedia.org': 350, 'it.wikipedia.org': 350, 'www.wikidata.org': 400, 'query.wikidata.org': 1500, 'www.reddit.com': 1500, 'old.reddit.com': 1500, 'store.steampowered.com': 900, 'steamspy.com': 1100, 'catalog.gog.com': 800, 'www.cheapshark.com': 700, 'api.rawg.io': 500, 'www.pcgamingwiki.com': 500};
  const lastAt = {};
  async function gap(host){
    const g = GAP[host] || 300, now = Date.now(), slot = Math.max(now, (lastAt[host] || 0) + g);
    lastAt[host] = slot;
    if(slot > now) await sleep(slot - now);
  }

  // ---------- ponti CORS pubblici (autoapprendimento) ----------
  const RELAYS = [
    {name: 'allorigins', url: u=> 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)},
    {name: 'corsproxy.io', url: u=> 'https://corsproxy.io/?url=' + encodeURIComponent(u)},
    {name: 'corsproxy.io (v1)', url: u=> 'https://corsproxy.io/?' + encodeURIComponent(u)},
    {name: 'codetabs', url: u=> 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u)},
    {name: 'cors.eu.org', url: u=> 'https://cors.eu.org/' + u},
    {name: 'yacdn', url: u=> 'https://yacdn.org/proxy/' + u},
    {name: 'thingproxy', url: u=> 'https://thingproxy.freeboard.io/fetch/' + u},
    {name: 'jina reader', url: u=> 'https://r.jina.ai/' + u, textOnly: true}
  ];
  const HK = 'rt_relay_health', NRK = 'rt_needs_relay';               // senza prefisso jrpg_: non si sincronizzano
  let health = ls.get(HK, {}), needsRelay = ls.get(NRK, {});
  const relayScore = n=>{ const h = health[n] || {ok: 0, fail: 0}; return (h.ok + 1) / (h.ok + h.fail + 2); };
  const relayCooling = n=> !!(health[n] && health[n].cool && health[n].cool > Date.now());
  function markRelay(n, ok){
    const h = health[n] = health[n] || {ok: 0, fail: 0, streak: 0};
    if(ok){ h.ok++; h.streak = 0; h.cool = 0; }
    else { h.fail++; h.streak = (h.streak || 0) + 1; if(h.streak >= 3){ h.cool = Date.now() + 10 * 60e3; h.streak = 0; } }   // 3 errori di fila: pausa di 10 minuti
    ls.set(HK, health);
  }
  // siti che permettono l'accesso diretto dal browser: non vanno mai spostati sui ponti (i ponti sono lenti e spesso morti)
  const CORS_OK = new Set(['en.wikipedia.org', 'it.wikipedia.org', 'www.wikidata.org', 'query.wikidata.org', 'www.pcgamingwiki.com', 'api.rawg.io', 'www.cheapshark.com']);
  function flagNeedsRelay(host){
    if(CORS_OK.has(host)) return; if(typeof navigator !== 'undefined' && navigator.onLine === false) return; needsRelay[host] = Date.now() + 30 * 60e3; ls.set(NRK, needsRelay); }
  H.relayStatus = ()=> RELAYS.map(r=> ({name: r.name, score: Math.round(relayScore(r.name) * 100), cooling: relayCooling(r.name), ...(health[r.name] || {})}));

  // massimo di richieste contemporanee per sito (troppe insieme = lentezza e blocchi) e interruttore per le fonti mute
  const MAXC = {'store.steampowered.com': 2, 'www.reddit.com': 1, 'old.reddit.com': 1, 'api.reddit.com': 1, 'query.wikidata.org': 1, 'api.rawg.io': 3, 'www.pcgamingwiki.com': 2};
  const actC = {}, waitQ = {};
  async function slot(host){
    const max = MAXC[host] || 3;
    while((actC[host] || 0) >= max) await new Promise(r=> (waitQ[host] = waitQ[host] || []).push(r));
    actC[host] = (actC[host] || 0) + 1;
    let done = false;
    return ()=>{ if(done) return; done = true; actC[host]--; const w = (waitQ[host] || []).shift(); if(w) w(); };
  }
  const hostFails = {}, hostDown = {}, hostTrips = {};
  // ponte personale facoltativo (Cloudflare Worker dell'utente, vedi tools/cloudflare-worker.js): sempre il primo tentativo quando c'è
  function customRelay(){
    let u = ''; try{ u = (localStorage.getItem('jrpg_relay_url') || '').trim(); }catch(e){}
    if(!/^https:\/\//i.test(u)) return null;
    const base = /[?&]url=$/.test(u) ? u : u + (u.indexOf('?') > -1 ? '&' : '?') + 'url=';
    return {name: 'ponte personale', url: x=> base + encodeURIComponent(x)};
  }
  H.hasCustomRelay = ()=> !!customRelay();
  H.testCustomRelay = async ()=>{ const c = customRelay(); if(!c) throw new Error('indirizzo non impostato'); const r = await fetch(c.url('https://www.cheapshark.com/api/1.0/stores')); if(!r.ok) throw new Error('risposta ' + r.status); const j = await r.json(); return Array.isArray(j) ? j.length : 0; };
  const cache = new Map();
  async function once(url, o){
    const ctrl = new AbortController(), tm = setTimeout(()=> ctrl.abort(), o.timeout || 12000);
    try{
      const r = await fetch(url, {signal: ctrl.signal, headers: o.headers});
      if(!r.ok){ const e = new Error('HTTP ' + r.status); e.status = r.status; e.retryAfter = parseInt(r.headers.get('retry-after') || '0', 10) || 0; throw e; }
      const txt = await r.text();
      if(o.as === 'text') return txt;
      try{ return JSON.parse(txt); }catch(x){ const e = new Error('risposta non JSON (pagina di blocco?)'); e.status = -1; throw e; }
    } finally { clearTimeout(tm); }
  }
  const emsg = e=> e ? (e.name === 'AbortError' ? 'timeout' : (e.message || String(e))) : 'errore';

  // H.fetch(url, {as:'json'|'text', direct, relays, timeout, retries, headers, cache})
  H.fetch = async function(url, o){
    o = Object.assign({as: 'json', direct: true, relays: true, timeout: 12000, retries: 1, cache: true}, o || {});
    const ck = o.as + ':' + url, hit = cache.get(ck);
    if(o.cache && hit && Date.now() - hit.t < 10 * 60e3) return hit.v;
    const host = hostOf(url), attempts = []; let lastErr = null, usedRelay = false;
    if(hostDown[host] && hostDown[host] > Date.now()){ const e = new Error('fonte in pausa (non risponde da un po\': riprovo tra qualche minuto)'); e.fast = true; throw e; }
    const done = v=>{ hostFails[host] = 0; hostTrips[host] = 0; if(needsRelay[host] && !usedRelay){ delete needsRelay[host]; ls.set(NRK, needsRelay); } if(o.cache) cache.set(ck, {t: Date.now(), v}); return v; };
    if(o.direct && !(needsRelay[host] && needsRelay[host] > Date.now() && o.relays)){
      await gap(host);
      for(let a = 0; a <= o.retries; a++){
        const rel = await slot(host);
        try{ return done(await once(url, o)); }
        catch(e){
          lastErr = e; attempts.push('diretto: ' + emsg(e));
          if((e.status === 429 || e.status === 503) && a < o.retries){
            const w = Math.min(8000, (e.retryAfter ? e.retryAfter * 1000 : 1500 * (a + 1)) + rnd(0, 600));
            LOG({kind: 'relay', src: host, ok: false, note: 'troppe richieste: attendo ' + Math.round(w / 100) / 10 + ' s e riprovo'});
            await sleep(w); continue;
          }
          if(!e.status && e.name !== 'AbortError') flagNeedsRelay(host);      // errore di rete/CORS: le prossime volte passo direttamente dai ponti
          break;
        } finally { rel(); }
      }
    }
    if(o.relays){
      // al massimo 3 ponti per richiesta (i migliori per esito recente, con un po' di casualità sui pari merito): una fonte muta non deve bloccare la ricerca
      const list = RELAYS.filter(r=> !relayCooling(r.name) && !(o.as === 'json' && r.textOnly)).map(r=> ({r, k: relayScore(r.name) + Math.random() * 0.05})).sort((a, b)=> b.k - a.k).slice(0, o.maxRelays || 3).map(x=> x.r);
      { const cr = customRelay(); if(cr && !relayCooling(cr.name)){ list.unshift(cr); if(list.length > (o.maxRelays || 3)) list.pop(); } }
      for(const R of list){
        const full = R.url(url);
        await gap(hostOf(full));
        const relSlot = await slot(hostOf(full));
        try{
          usedRelay = true;
          const v = await once(full, Object.assign({}, o, {timeout: Math.min(o.timeout || 12000, 7000)}));
          markRelay(R.name, true); LOG({kind: 'relay', src: R.name, ok: true, note: 'ponte riuscito per ' + host});
          return done(v);
        }catch(e){
          markRelay(R.name, false); lastErr = e; attempts.push(R.name + ': ' + emsg(e));
          LOG({kind: 'relay', src: R.name, ok: false, err: emsg(e) + ' (per ' + host + ')'});
        } finally { relSlot(); }
      }
    }
    // ultima spiaggia: se avevo saltato l'accesso diretto perché in passato serviva un ponte, provo comunque una volta
    if(o.direct && o.relays && needsRelay[host] && needsRelay[host] > Date.now()){
      try{ return done(await once(url, o)); }catch(e){ lastErr = e; attempts.push('diretto (ultima spiaggia): ' + emsg(e)); }
    }
    hostFails[host] = (hostFails[host] || 0) + 1;
    if(hostFails[host] >= 3 && o.relays !== false){ hostTrips[host] = (hostTrips[host] || 0) + 1; const pause = Math.min(45e3 * Math.pow(2, hostTrips[host] - 1), 10 * 60e3); hostDown[host] = Date.now() + pause; hostFails[host] = 0; LOG({kind: 'relay', src: host, ok: false, note: 'fonte in pausa per ' + Math.round(pause / 1000) + ' s (3 tentativi completi falliti)'}); }
    const err = new Error('nessuna via ha risposto: ' + attempts.join(' | ')); err.attempts = attempts; err.status = lastErr && lastErr.status;
    throw err;
  };
  H.json = (u, o)=> H.fetch(u, Object.assign({as: 'json'}, o || {}));
  H.text = (u, o)=> H.fetch(u, Object.assign({as: 'text'}, o || {}));

  // ---------- verifica di un titolo su Wikipedia (serve a confermare i nomi trovati nei forum) ----------
  const WP = 'https://en.wikipedia.org/w/api.php?';
  const qs = p=> new URLSearchParams(Object.assign({format: 'json', origin: '*'}, p)).toString();
  H.verifyGame = async function(name){
    const j = await H.json(WP + qs({action: 'query', list: 'search', srsearch: name + ' video game', srlimit: '4', srnamespace: '0'}));
    const hits = (j.query && j.query.search) || [], tgt = norm(name);
    const strip = t=> norm(String(t).replace(/\s*\([^)]*\)\s*$/, ''));
    const hit = hits.find(h=> strip(h.title) === tgt && /video game|game/i.test(h.snippet || '')) || hits.find(h=> /video game/i.test(h.snippet || '') && strip(h.title) === tgt);
    if(!hit) return null;
    const y = (String(hit.snippet || '').replace(/<[^>]+>/g, '').match(/\b(19[7-9]\d|20[0-3]\d)\b/) || [])[1] || '';
    return {name: cleanTitle(hit.title), year: y};
  };

  // ---------- tabelle di corrispondenza generi -> fonti ----------
  const CATS = {
    JRPG: ['Japanese role-playing video games'], WRPG: ['Western role-playing video games', 'Role-playing video games'], ACT: ['Action role-playing video games'],
    TUR: ['Turn-based role-playing video games', 'Japanese role-playing video games'], TAC: ['Tactical role-playing video games'], DUN: ['Dungeon crawler video games'],
    MON: ['Monster-taming video games', 'Creature-breeding video games'], CARD: ['Digital collectible card games', 'Deck-building video games'], ROG: ['Roguelike video games', 'Roguelite video games'],
    METR: ['Metroidvania games', 'Metroidvania video games'], SOUL: ['Soulslike video games', 'Souls-like video games'], HOR: ['Horror video games'], SURV: ['Survival horror video games'],
    PLAT: ['Platform games'], PLAT3D: ['3D platform games'], PUZ: ['Puzzle video games'], FIGHT: ['Fighting games'], BEAT: ['Beat \'em ups'], FPS: ['First-person shooters'], TPS: ['Third-person shooters'],
    SHMUP: ['Shoot \'em ups'], RACE: ['Racing video games'], SPORT: ['Sports video games'], RTS: ['Real-time strategy video games'], TBS4X: ['Turn-based strategy video games', '4X video games'],
    ADV: ['Point-and-click adventure games', 'Adventure games'], VN: ['Visual novels'], STEALTH: ['Stealth video games'], OPENW: ['Open-world video games'], RHY: ['Rhythm games'],
    PARTY: ['Party video games'], TOWERDEF: ['Tower defense video games'], CITY: ['City-building games'], SIMLIFE: ['Life simulation games'], SAND: ['Survival video games', 'Sandbox games'],
    MMO: ['Massively multiplayer online role-playing games'], MOBA: ['Multiplayer online battle arena games'], BR: ['Battle royale games'], MECH: ['Mecha video games'], HNS: ['Hack and slash games'],
    ARCADE: ['Arcade video games'], IDLE: ['Incremental games'], COOP: ['Cooperative video games'], FARM: ['Farming video games'], DATING: ['Dating sims'], ACTADV: ['Action-adventure games'],
    WALK: ['Walking simulators'], KART: ['Kart racing video games'], LIFE: ['Life simulation games'], WAR: ['Wargames', 'Grand strategy video games']
  };
  const ENG = {
    JRPG: 'JRPG', WRPG: 'western RPG', ACT: 'action RPG', TUR: 'turn-based RPG', TAC: 'tactical RPG', DUN: 'dungeon crawler', MON: 'monster taming', CARD: 'deck building', ROG: 'roguelike',
    METR: 'metroidvania', SOUL: 'soulslike', HOR: 'horror', SURV: 'survival horror', PLAT: 'platformer', PUZ: 'puzzle', FIGHT: 'fighting', BEAT: 'beat em up', FPS: 'first-person shooter',
    TPS: 'third-person shooter', SHMUP: 'shoot em up', RACE: 'racing', SPORT: 'sports', RTS: 'real-time strategy', TBS4X: 'turn-based strategy', ADV: 'adventure', VN: 'visual novel',
    STEALTH: 'stealth', OPENW: 'open world', RHY: 'rhythm', PARTY: 'party', TOWERDEF: 'tower defense', CITY: 'city builder', SIMLIFE: 'life simulation', SAND: 'survival crafting',
    MMO: 'MMORPG', MOBA: 'MOBA', BR: 'battle royale', MECH: 'mecha', HNS: 'hack and slash', ARCADE: 'arcade', IDLE: 'idle', COOP: 'co-op', FARM: 'farming', ACTADV: 'action adventure', LIFE: 'life sim'
  };
  const GENERIC_WORDS = ['role-playing', 'action', 'adventure', 'strategy', 'puzzle', 'platform', 'simulation', 'horror', 'indie', 'racing', 'sports', 'shooter', 'roguelike', 'turn-based', 'metroidvania', 'visual novel'];
  // id REALI dei tag di Steam (da store.steampowered.com/tagdata/populartags/english), uno diverso per ogni codice
  const STEAM_TAG = {JRPG: 4434, WRPG: 122, ACT: 4231, TUR: 1677, TAC: 21725, DUN: 1720, CARD: 1666, ROG: 1716, METR: 1628, SOUL: 29482, HOR: 1667, SURV: 3978, PLAT: 1625, PUZ: 1664, FIGHT: 1743, FPS: 1663, SHMUP: 4255,
    RACE: 699, SPORT: 701, RTS: 1676, TBS4X: 1741, ADV: 1698, VN: 3799, STEALTH: 1687, OPENW: 1695, RHY: 1752, TOWERDEF: 1645, CITY: 4328, SIMLIFE: 10235, FARM: 87918, MMO: 1754, ACTADV: 4106, HNS: 1646, TPS: 3814,
    MECH: 4821, MON: 916648, PLAT3D: 5395, PUZPLAT: 5537, IMSIM: 9204, DATING: 9551, WALK: 5900, BR: 176981, AUTOB: 1084988, GRAND: 4364, BEAT: 4158, HEROSH: 620519, BOOMER: 1023537, EXTRACT: 1199779, PARTY: 7178, SAND: 1662, TWINSTICK: 4758};
  const STEAMSPY_TAG = {JRPG: 'JRPG', WRPG: 'RPG', ACT: 'Action RPG', TUR: 'Turn-Based', TAC: 'Tactical RPG', DUN: 'Dungeon Crawler', CARD: 'Card Game', ROG: 'Roguelike', METR: 'Metroidvania', SOUL: 'Souls-like',
    HOR: 'Horror', SURV: 'Survival', PLAT: 'Platformer', PUZ: 'Puzzle', FIGHT: 'Fighting', FPS: 'FPS', SHMUP: 'Shoot \'Em Up', RACE: 'Racing', SPORT: 'Sports', RTS: 'RTS', TBS4X: 'Turn-Based Strategy', ADV: 'Adventure',
    VN: 'Visual Novel', STEALTH: 'Stealth', OPENW: 'Open World', RHY: 'Rhythm', TOWERDEF: 'Tower Defense', CITY: 'City Builder', SIMLIFE: 'Life Sim', MMO: 'MMORPG', HNS: 'Hack and Slash', TPS: 'Third Person'};
  const GOG_GENRE = {JRPG: 'rpg', WRPG: 'rpg', ACT: 'rpg', TUR: 'rpg', TAC: 'strategy', DUN: 'rpg', ROG: 'rpg', ADV: 'adventure', VN: 'adventure', ACTADV: 'action', HNS: 'action', PLAT: 'action',
    FPS: 'shooter', TPS: 'shooter', SHMUP: 'shooter', RTS: 'strategy', TBS4X: 'strategy', CITY: 'simulation', SIMLIFE: 'simulation', SPORT: 'sports', RACE: 'racing', HOR: 'action', STEALTH: 'action', OPENW: 'action'};
  const GOG_ALL = ['rpg', 'action', 'adventure', 'strategy', 'simulation', 'sports', 'racing', 'shooter'];
  const codeFor = (map, key)=> Object.keys(map).find(c=> map[c] === key);

  // ---------- fonti dirette ----------
  // Ogni fonte riceve ctx = {focus: [codici genere], seeds: [nomi di giochi preferiti], know: Set di nomi già noti} e restituisce candidati grezzi.
  const foc = ctx=> (ctx.focus && ctx.focus.length) ? ctx.focus : (ctx.allowed || []);
  const M = {};

  M.cheapshark = async ctx=>{
    const sorts = ['Metacritic', 'Reviews', 'Release', 'recent'];
    const list = async page=> H.json('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=60&metacritic=50&pageNumber=' + page + '&sortBy=' + pickOne(sorts));
    let j = await list(ri(0, 35)); if(!Array.isArray(j) || !j.length) j = await list(ri(0, 4));
    return (j || []).map(d=>{
      const mc = parseInt(d.metacriticScore, 10) || 0, st = parseInt(d.steamRatingPercent, 10) || 0, stc = parseInt(d.steamRatingCount, 10) || 0;
      const score = mc || (stc >= 200 && st >= 55 ? st : null); if(score == null) return null;
      return {name: cleanTitle(d.title), plat: 'PC', year: d.releaseDate ? String(new Date(d.releaseDate * 1000).getFullYear()) : '', score, tier: tierOf(score), tags: [], story: '', fitIf: ''};
    }).filter(Boolean);
  };

  M.wikicat = async ctx=>{
    const codes = shuffle((foc(ctx).some(c=> CATS[c]) ? foc(ctx) : Object.keys(CATS)).filter(c=> CATS[c]));
    const out = [];
    for(const code of codes.slice(0, 3)){
      for(const cat of shuffle(CATS[code]).slice(0, 2)){
        let j;
        const hex = (0x41 + ri(0, 25)).toString(16);
        try{ j = await H.json(WP + qs({action: 'query', list: 'categorymembers', cmtitle: 'Category:' + cat, cmnamespace: '0', cmlimit: '60', cmsort: 'sortkey', cmstarthexsortkey: hex, cmtype: 'page'})); }catch(e){ continue; }
        let titles = ((j.query && j.query.categorymembers) || []).map(m=> m.title);
        if(titles.length < 8){ try{ const j2 = await H.json(WP + qs({action: 'query', list: 'categorymembers', cmtitle: 'Category:' + cat, cmnamespace: '0', cmlimit: '60', cmtype: 'page'})); titles = ((j2.query && j2.query.categorymembers) || []).map(m=> m.title); }catch(e){} }
        titles = titles.filter(t=> !/^(list of|timeline|comparison|outline|history of)/i.test(t) && !/\((series|franchise|disambiguation)\)/i.test(t));
        if(!titles.length) continue;
        const pick = shuffle(titles).slice(0, 20);
        let pages = {};
        try{ const ex = await H.json(WP + qs({action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', exsentences: '2', exlimit: '20', titles: pick.join('|'), redirects: '1'})); pages = (ex.query && ex.query.pages) || {}; }catch(e){}
        Object.values(pages).forEach(p=>{
          const t = p.extract || ''; if(!/game/i.test(t)) return;
          const y = (t.match(/\b(19[7-9]\d|20[0-3]\d)\b/) || [])[1] || '';
          out.push({name: cleanTitle(p.title), plat: '', year: y, score: null, tier: 'B', tags: [code], story: '', fitIf: ''});
        });
        if(out.length >= 10) return out;
      }
    }
    return out;
  };

  M.wikisearch = async ctx=>{
    const engCodes = foc(ctx).filter(c=> ENG[c]);
    const code = engCodes.length ? pickOne(engCodes) : null;
    const word = (code && ENG[code]) || pickOne(GENERIC_WORDS), y = ri(1986, 2024);
    const j = await H.json(WP + qs({action: 'query', list: 'search', srsearch: word + ' video game ' + y, srlimit: '40', srnamespace: '0'}));
    return ((j.query && j.query.search) || []).filter(h=> /video game|game/i.test(h.snippet || '') && !/^(list of|timeline)/i.test(h.title) && !/\((series|franchise)\)/i.test(h.title)).map(h=>{
      const sn = String(h.snippet).replace(/<[^>]+>/g, ''), yy = (sn.match(/\b(19[7-9]\d|20[0-3]\d)\b/) || [])[1] || '';
      return {name: cleanTitle(h.title), plat: '', year: yy, score: null, tier: 'B', tags: code ? [code] : [], story: '', fitIf: ''};
    });
  };

  M.wikidata = async ctx=>{
    const y1 = ri(1984, 2020), y2 = y1 + 4;
    const q = `SELECT ?itemLabel ?date ?genreLabel WHERE { ?item wdt:P31 wd:Q7889; wdt:P577 ?date; wdt:P136 ?genre; wikibase:sitelinks ?sl. FILTER(?sl > 9) FILTER(YEAR(?date) >= ${y1} && YEAR(?date) <= ${y2}) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 200`;
    const j = await H.json('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), {headers: {Accept: 'application/sparql-results+json'}, timeout: 20000});
    const by = {};
    (((j || {}).results || {}).bindings || []).forEach(b=>{ const n = b.itemLabel && b.itemLabel.value; if(!n || /^Q\d+$/.test(n)) return; const o = by[n] = by[n] || {name: n, year: String(b.date.value).slice(0, 4), genres: []}; if(b.genreLabel) o.genres.push(b.genreLabel.value); });
    let list = Object.values(by).map(o=> ({name: cleanTitle(o.name), plat: '', year: o.year, score: null, tier: 'B', tags: (window.wikidataCodesFrom ? window.wikidataCodesFrom(o.genres) : []).slice(0, 3), story: '', fitIf: ''}));
    if(foc(ctx).length){ const pref = list.filter(c=> c.tags.some(t=> foc(ctx).includes(t))); if(pref.length >= 4) list = pref; }
    return shuffle(list).slice(0, 30);
  };

  M.steamspy = async ctx=>{
    const fl = foc(ctx).filter(c=> STEAMSPY_TAG[c]); const code = fl.length ? pickOne(fl) : null;
    const tag = (code && STEAMSPY_TAG[code]) || pickOne(Object.values(STEAMSPY_TAG));
    const j = await H.json('https://steamspy.com/api.php?request=tag&tag=' + encodeURIComponent(tag), {timeout: 25000});
    return shuffle(Object.values(j || {}).filter(g=> g && g.name && (g.positive + g.negative) >= 150 && g.positive / (g.positive + g.negative) >= 0.6)).slice(0, 40).map(g=>{
      const sc = Math.round(100 * g.positive / (g.positive + g.negative));
      return {name: cleanTitle(g.name), plat: 'PC', year: '', score: sc, tier: tierOf(sc), tags: code ? [code] : (codeFor(STEAMSPY_TAG, tag) ? [codeFor(STEAMSPY_TAG, tag)] : []), story: '', fitIf: ''};
    });
  };

  M.steamsearch = async ctx=>{
    const fl = foc(ctx).filter(c=> STEAM_TAG[c]); const code = fl.length ? pickOne(fl) : null;
    const tag = code ? STEAM_TAG[code] : pickOne(Object.values(STEAM_TAG));
    const j = await H.json('https://store.steampowered.com/search/results/?query&start=' + (ri(0, 14) * 50) + '&count=50&sort_by=Reviews_DESC&infinite=1&cc=it&l=english&category1=998&tags=' + tag, {timeout: 15000});
    if(!j || !j.results_html) throw new Error('risposta Steam vuota');
    const doc = new DOMParser().parseFromString(j.results_html, 'text/html'), out = [];
    doc.querySelectorAll('a.search_result_row').forEach(a=>{
      const t = a.querySelector('.title'), rel = a.querySelector('.search_released'), rv = a.querySelector('.search_review_summary');
      if(!t) return;
      const tip = rv ? (rv.getAttribute('data-tooltip-html') || '') : '', m = tip.match(/(\d+)%\s+of the\s+([\d,\.]+)/i);
      const pct = m ? +m[1] : null, cnt = m ? parseInt(m[2].replace(/[,\.]/g, ''), 10) : 0;
      if(pct == null || pct < 55 || cnt < 50) return;
      const y = ((rel && rel.textContent) || '').match(/(19[7-9]\d|20[0-3]\d)/);
      out.push({name: cleanTitle(t.textContent), plat: 'PC', year: y ? y[1] : '', score: pct, tier: tierOf(pct), tags: code ? [code] : (codeFor(STEAM_TAG, tag) ? [codeFor(STEAM_TAG, tag)] : []), story: '', fitIf: ''});
    });
    return out;
  };

  M.gog = async ctx=>{
    const fl = foc(ctx).filter(c=> GOG_GENRE[c]); const code = fl.length ? pickOne(fl) : null;
    const slug = (code && GOG_GENRE[code]) || pickOne(GOG_ALL);
    const j = await H.json('https://catalog.gog.com/v1/catalog?limit=48&order=desc:trending&productType=in:game&page=' + ri(1, 6) + '&countryCode=IT&locale=en-US&currencyCode=EUR&genres=in:' + slug, {timeout: 15000});
    return ((j && j.products) || []).map(p=>{
      const r = Number(p.reviewsRating), sc = r > 0 ? (r <= 5 ? Math.round(r * 20) : r <= 50 ? Math.round(r * 2) : Math.round(r)) : null;
      const names = (p.genres || []).map(g=> (g && (g.name || g)) || '').filter(Boolean);
      return {name: cleanTitle(p.title), plat: 'PC (GOG)', year: String(p.releaseDate || '').slice(0, 4), score: sc, tier: sc != null ? tierOf(sc) : 'B', tags: (window.wikidataCodesFrom ? window.wikidataCodesFrom(names) : []).slice(0, 3), story: '', fitIf: ''};
    }).filter(c=> c.name);
  };

  // ---------- RAWG (chiave gratuita dell'utente): scoperta, dettagli, giochi affini, saghe e copertine ----------
  const RAWG_LIMIT = 18000, RUK = 'rt_rawg_usage';                    // il piano gratuito concede 20.000 richieste al mese
  const rawgKey = ()=>{ try{ return (localStorage.getItem('jrpg_rawg_key') || '').trim(); }catch(e){ return ''; } };
  const rawgUsage = ()=>{ const m = new Date().toISOString().slice(0, 7), u = ls.get(RUK, {}); return u.m === m ? u : {m, n: 0}; };
  const skipErr = msg=>{ const e = new Error(msg); e.skip = true; return e; };
  async function rawgGet(path, params){
    if(!rawgKey()) throw skipErr('chiave RAWG non impostata');
    const u = rawgUsage(); if(u.n >= RAWG_LIMIT) throw skipErr('limite mensile RAWG quasi raggiunto (' + u.n + ')');
    u.n++; ls.set(RUK, u);
    // la chiave sta nell'indirizzo: la richiesta NON passa mai dai ponti pubblici (li vedrebbero), solo accesso diretto
    return H.json('https://api.rawg.io/api/' + path + '?' + new URLSearchParams(Object.assign({key: rawgKey()}, params || {})).toString(), {timeout: 12000, relays: false, retries: 1});
  }
  const RAWG_SLUG = {JRPG: 'role-playing-games-rpg', WRPG: 'role-playing-games-rpg', ACT: 'role-playing-games-rpg', TUR: 'role-playing-games-rpg', TAC: 'strategy', DUN: 'role-playing-games-rpg', MON: 'role-playing-games-rpg', CARD: 'card', ROG: 'role-playing-games-rpg',
    PLAT: 'platformer', PLAT3D: 'platformer', METR: 'platformer', PUZ: 'puzzle', FPS: 'shooter', TPS: 'shooter', SHMUP: 'shooter', FIGHT: 'fighting', BEAT: 'fighting', RACE: 'racing', KART: 'racing', SPORT: 'sports', RTS: 'strategy', TBS4X: 'strategy',
    ADV: 'adventure', ACTADV: 'action', HNS: 'action', SOUL: 'action', STEALTH: 'action', OPENW: 'action', HOR: 'action', SURV: 'action', ARCADE: 'arcade', SIMLIFE: 'simulation', CITY: 'simulation', FARM: 'simulation', SAND: 'simulation', BOARDG: 'board-games', PARTY: 'family', MMO: 'massively-multiplayer', VN: 'adventure', TOWERDEF: 'strategy'};
  const RAWG_MAP = [[/jrpg|japanese rpg/i, 'JRPG'], [/turn-based(?! strategy)/i, 'TUR'], [/tactical/i, 'TAC'], [/roguelike|roguelite|rogue-lite/i, 'ROG'], [/metroidvania/i, 'METR'], [/souls-?like/i, 'SOUL'], [/hack and slash|hack & slash/i, 'HNS'],
    [/survival horror/i, 'SURV'], [/horror/i, 'HOR'], [/visual novel/i, 'VN'], [/tower defen[cs]e/i, 'TOWERDEF'], [/city builder/i, 'CITY'], [/deckbuild|card game/i, 'CARD'], [/rhythm/i, 'RHY'], [/stealth/i, 'STEALTH'], [/open world/i, 'OPENW'],
    [/^fps$|first-person shooter/i, 'FPS'], [/third person shooter/i, 'TPS'], [/fighting/i, 'FIGHT'], [/beat 'em up|beat em up/i, 'BEAT'], [/platformer/i, 'PLAT'], [/puzzle/i, 'PUZ'], [/racing/i, 'RACE'], [/^sports$/i, 'SPORT'], [/real time strategy|^rts$/i, 'RTS'],
    [/4x|grand strategy|turn-based strategy/i, 'TBS4X'], [/massively multiplayer|^mmo/i, 'MMO'], [/dungeon crawler/i, 'DUN'], [/action rpg|action-rpg/i, 'ACT'], [/monster/i, 'MON'], [/point & click|point and click/i, 'ADV'], [/farming/i, 'FARM'],
    [/life sim/i, 'SIMLIFE'], [/shoot 'em up|shmup|bullet hell/i, 'SHMUP'], [/party/i, 'PARTY'], [/arcade/i, 'ARCADE']];
  function rawgTags(g, fb){
    const names = (g.genres || []).map(x=> x.name).concat((g.tags || []).map(x=> x.name)), out = [];
    RAWG_MAP.forEach(([re, c])=>{ if(names.some(n=> re.test(n)) && !out.includes(c)) out.push(c); });
    if(!out.length && fb && fb.length) out.push(fb[0]);            // la ricerca era già filtrata per quel genere
    return out.slice(0, 3);
  }
  function rawgItem(g, fb){
    const mc = g.metacritic || 0, rt = g.rating && g.ratings_count >= 20 ? Math.round(g.rating * 20) : 0;
    const score = mc || rt || null;
    return {name: cleanTitle(g.name), plat: (g.platforms || []).map(x=> x.platform && x.platform.name).filter(Boolean).slice(0, 4).join(' / '), year: (g.released || '').slice(0, 4), score, tier: score != null ? tierOf(score) : 'B', tags: rawgTags(g, fb), story: '', fitIf: ''};
  }
  const rawgOk = c=> c.name && (c.score == null || c.score >= 50);
  M.rawg = async ctx=>{           // scoperta: ogni giro cambia anni, generi e ordinamento, così non si ripete mai
    const fl = foc(ctx), slugs = [...new Set(fl.map(c=> RAWG_SLUG[c]).filter(Boolean))].sort(()=> Math.random() - .5).slice(0, 2);
    const y1 = ri(1985, 2023), noMc = Math.random() < .4;
    const params = {page_size: '40', page: String(ri(1, 6)), ordering: noMc ? '-rating' : pickOne(['-added', '-metacritic', '-released']), dates: y1 + '-01-01,' + (y1 + ri(2, 6)) + '-12-31'};
    if(!noMc) params.metacritic = '50,100';
    if(slugs.length) params.genres = slugs.join(',');
    let j = await rawgGet('games', params);
    if(!(j.results || []).length){ params.page = '1'; j = await rawgGet('games', params); }
    return (j.results || []).map(g=> rawgItem(g, fl)).filter(rawgOk);
  };
  M.rawgnew = async ctx=>{        // uscite dell'ultimo anno e in arrivo
    const fl = foc(ctx), slugs = [...new Set(fl.map(c=> RAWG_SLUG[c]).filter(Boolean))].slice(0, 2), d = x=> x.toISOString().slice(0, 10), now = Date.now();
    const params = {page_size: '40', page: String(ri(1, 4)), ordering: '-added', dates: d(new Date(now - 365 * 864e5)) + ',' + d(new Date(now + 240 * 864e5))};
    if(slugs.length) params.genres = slugs.join(',');
    const j = await rawgGet('games', params);
    return (j.results || []).map(g=> rawgItem(g, fl)).filter(rawgOk);
  };
  M.rawgsimilar = async ctx=>{    // giochi affini ai preferiti: stessi generi e stessi tag distintivi su RAWG
    const seeds = ctx.seeds || []; if(!seeds.length) throw skipErr('nessun preferito da cui partire');
    const name = pickOne(seeds), info = await H.rawg.info(name); if(!info) return [];
    return (await H.rawg.similarItems(info)).map(c=> Object.assign(c, {because: 'Stessi tag su RAWG di «' + name + '»: ' + (info.tagNames || []).slice(0, 3).join(', ')}));
  };
  H.rawg = {
    has: ()=> !!rawgKey(),
    usage: ()=> rawgUsage().n,
    async ping(){ const j = await rawgGet('games', {page_size: '1'}); return !!(j && (j.results || j.count != null)); },
    async find(name){
      const j = await rawgGet('games', {search: name, search_precise: 'true', page_size: '6'});
      const strip = x=> norm(String(x).replace(/\s*\([^)]*\)/g, '')), t = strip(name), list = j.results || [];
      return list.find(g=> strip(g.name) === t) || list.find(g=> { const n = strip(g.name); return n.length > 4 && (n.startsWith(t) || t.startsWith(n)); }) || null;
    },
    async info(name){
      const g = await H.rawg.find(name); if(!g) return null;
      let d = null; try{ d = await rawgGet('games/' + g.id); }catch(e){}
      const x = d || g;
      return {id: g.id, name: g.name, url: 'https://rawg.io/games/' + (x.slug || g.slug), year: (x.released || '').slice(0, 4), mc: x.metacritic || null, rating: x.rating || null, playtime: x.playtime || 0, desc: (d && d.description_raw) || '',
        genres: (x.genres || []).map(z=> z.name), genreSlugs: (x.genres || []).map(z=> z.slug), tags: (x.tags || []).map(t=> ({slug: t.slug, name: t.name, n: t.games_count || 0})), platforms: (x.platforms || []).map(z=> z.platform && z.platform.name).filter(Boolean), cover: x.background_image || '', esrb: x.esrb_rating ? x.esrb_rating.name : ''};
    },
    // affini per tag: la lista «suggested» di RAWG è solo per i piani a pagamento, quindi cerco i giochi con gli stessi generi e gli stessi tag distintivi
    async similarItems(info){
      const generic = /single|multi|steam|achiev|controller|cloud|co-?op|online|local|family|cross|partial|full audio|subtitle|remote|play|trading|leaderboard|stats|captions/i;
      const tags = (info.tags || []).filter(t=> t.slug && !generic.test(t.name) && t.n >= 250 && t.n <= 60000).sort((a, b)=> a.n - b.n).slice(0, 3);
      info.tagNames = tags.map(t=> t.name);
      const gen = (info.genreSlugs || []).slice(0, 1).join(',');
      for(let k = tags.length; k >= 1; k--){
        const params = {tags: tags.slice(0, k).map(t=> t.slug).join(','), ordering: '-metacritic', metacritic: '55,100', page_size: '20'};
        if(gen && k > 1) params.genres = gen;
        const j = await rawgGet('games', params);
        const list = (j.results || []).filter(g=> g.id !== info.id).map(g=> rawgItem(g, [])).filter(rawgOk);
        if(list.length >= 4 || k === 1) return list;
      }
      return [];
    },
    async similar(info, n){ return (await H.rawg.similarItems(info)).slice(0, n || 6).map(c=> c.name); },
    async series(id){ const j = await rawgGet('games/' + id + '/game-series', {page_size: '40'}); return (j.results || []).map(g=> rawgItem(g, [])); }
  };

  // Forum (Reddit): cerca i thread «giochi simili / nascosti / sottovalutati», legge i commenti e prende i titoli scritti in **grassetto** o tra virgolette,
  // poi li verifica su Wikipedia (così non entrano frasi a caso). Prova tre indirizzi diversi e i ponti.
  const STOPWORDS = new Set(['this', 'that', 'edit', 'yes', 'no', 'and', 'the', 'game', 'games', 'rpg', 'jrpg', 'also', 'note', 'update', 'thanks', 'thank you', 'op', 'tl;dr', 'spoilers', 'spoiler', 'steam', 'ps5', 'ps4', 'ps2', 'ps1', 'pc', 'switch', 'xbox', 'nintendo', 'sony', 'metacritic', 'reddit']);
  function bolds(text){
    const out = [];
    String(text || '').replace(/\*\*([^*\n]{2,60})\*\*/g, (_, t)=>{ out.push(t); return _; });
    String(text || '').replace(/[“"]([A-Z0-9][^”"\n]{2,50})[”"]/g, (_, t)=>{ out.push(t); return _; });
    return out.map(t=> t.replace(/\s*\((?:\d{4}|[^)]{0,20})\)\s*$/, '').replace(/[.:,;!?]+$/, '').trim()).filter(t=> t.length >= 3 && t.length <= 50 && !STOPWORDS.has(t.toLowerCase()) && /[A-Za-z]/.test(t) && !/^https?:/i.test(t));
  }
  async function redditJson(path){
    let last;
    for(const host of ['www.reddit.com', 'old.reddit.com', 'api.reddit.com']){
      try{ return await H.json('https://' + host + path, {timeout: 14000, retries: 0}); }catch(e){ last = e; }
    }
    throw last;
  }
  M.reddit = async ctx=>{
    const words = foc(ctx).map(c=> ENG[c]).filter(Boolean);
    const qs0 = [];
    (ctx.seeds || []).slice(0, 3).forEach(s=> qs0.push('games like ' + s));
    shuffle(words).slice(0, 2).forEach(w=>{ qs0.push('underrated ' + w + ' games hidden gems'); qs0.push('best ' + w + ' games you never heard of'); });
    if(!qs0.length) qs0.push('underrated games hidden gems', 'best hidden gem games ' + ri(2005, 2024));
    const q = pickOne(qs0);
    const s = await redditJson('/search.json?q=' + encodeURIComponent(q) + '&sort=top&t=all&limit=6&type=link&raw_json=1');
    const threads = ((s.data && s.data.children) || []).map(c=> c.data).filter(d=> d && d.num_comments >= 8).slice(0, 2);
    if(!threads.length) return [];
    const count = {};
    for(const th of threads){
      const bodies = [th.selftext || '', th.title || ''];
      try{
        const cj = await redditJson(String(th.permalink).replace(/\/$/, '') + '.json?limit=120&depth=1&sort=top&raw_json=1');
        const walk = n=>{ (n || []).forEach(c=>{ if(c && c.data){ if(c.data.body) bodies.push(c.data.body); } }); };
        if(Array.isArray(cj) && cj[1] && cj[1].data) walk(cj[1].data.children);
      }catch(e){ LOG({kind: 'scout', src: 'Reddit', ok: false, err: 'commenti non letti: ' + emsg(e)}); }
      bodies.forEach(b=> bolds(b).forEach(t=>{ const k = t.toLowerCase(); count[k] = count[k] || {t, n: 0}; count[k].n++; }));
    }
    const names = Object.values(count).sort((a, b)=> b.n - a.n).slice(0, 24).map(x=> x.t).filter(t=> !ctx.know || !ctx.know.has(norm(t)));
    const out = [];
    for(const n of names){
      if(out.length >= 12) break;
      try{ const v = await H.verifyGame(n); if(v) out.push({name: v.name, plat: '', year: v.year, score: null, tier: 'B', tags: [], story: '', fitIf: '', forum: 'Consigliato dai giocatori su Reddit (thread «' + String(q).slice(0, 60) + '»)'}); }catch(e){}
    }
    return out;
  };

  // «Scoperte del procione»: elenco costruito ogni settimana dai server (Steam, GOG, CheapShark, Wikipedia) e salvato in discoveries.js: istantaneo, senza rete
  M.scoperte = async ctx=>{
    const D = (typeof DISCOVERIES !== 'undefined') ? DISCOVERIES : null;
    if(!D || !D.items || !D.items.length) throw skipErr('discoveries.js non ancora caricato');
    const want = new Set(foc(ctx));
    const list = D.items.filter(r=> !want.size || String(r[4]).split(',').some(t=> want.has(t)));
    const top = list.slice(0, Math.max(60, Math.min(list.length, 900)));        // già ordinati per qualità
    return shuffle(top).slice(0, 40).map(r=>{ const sc = r[3] || null; return {name: r[0], plat: r[2] || '', year: r[1] ? String(r[1]) : '', score: sc, tier: sc != null ? tierOf(sc) : 'B', tags: String(r[4]).split(',').filter(Boolean).slice(0, 3), story: '', fitIf: ''}; });
  };
  const DIRECT_INFO = {
    scoperte: {name: 'Scoperte del procione', key: 'scoperte'},
    cheapshark: {name: 'CheapShark', key: 'cheapshark'}, wikicat: {name: 'Wikipedia (categorie)', key: 'wikipedia'}, wikisearch: {name: 'Wikipedia (ricerca)', key: 'wikipedia'},
    wikidata: {name: 'Wikidata', key: 'wikidata'}, rawgnew: {name: 'RAWG (uscite)', key: 'rawg'}, rawgsimilar: {name: 'RAWG (affini)', key: 'rawg'}, steamspy: {name: 'SteamSpy', key: 'steamspy'}, steamsearch: {name: 'Steam', key: 'steam'}, gog: {name: 'GOG', key: 'gog'},
    rawg: {name: 'RAWG', key: 'rawg'}, reddit: {name: 'Reddit', key: 'reddit'}
  };
  H.directKeys = Object.keys(DIRECT_INFO);
  // ---------- ORDINE DI PRIORITÀ delle fonti (1 = si interroga per prima; le mediocri per ultime) ----------
  // Criterio: affidabilità dei dati (voti e giochi reali) · velocità (locale = istantaneo) · nessun rischio di blocco. Un numero alto pesa di più: la fonte gira meno spesso.
  // Se una fonte dà molti giochi nuovi sale, se dà zero scende (vedi H.scout).
  H.PRIORITY = {
    discover: ['scoperte', 'rawgnew', 'rawg', 'steamsearch', 'gog', 'cheapshark', 'wikicat', 'wikidata', 'wikisearch', 'steamspy', 'reddit', 'rawgsimilar'],
    // dove prendere i DATI di un gioco (il primo che li ha vince; gli altri servono da conferma): dal più sicuro al meno
    info: {
      lingua: ['facts.js (Steam ufficiale)', 'Steam', 'PCGamingWiki', 'it.wikipedia'],
      voto: ['Metacritic via Wikipedia', 'facts.js (Metascore Steam/CheapShark)', 'RAWG (Metacritic)', '% recensioni Steam'],
      anno: ['Wikidata', 'facts.js (Steam)', 'RAWG', 'Wikipedia'],
      generi: ['Wikidata', 'RAWG', 'Wikipedia'],
      prezzo: ['facts.js (Steam in euro)', 'CheapShark dal vivo'],
      copertina: ['Steam', 'Libretro', 'Wikidata/Wikipedia'],
      testi: ['Wikipedia + RAWG riscritti dall\'AI', 'AI con ricerca web (ultima spiaggia)']
    }
  };
  const RANK = {}; H.PRIORITY.discover.forEach((k, i)=> RANK[k] = i);
  H.methods = M;

  // facts.js e discoveries.js (aggiornati ogni settimana da GitHub) si caricano dopo l'avvio, così non rallentano la prima schermata
  H.loadLocalData = function(){
    const b = (document.querySelector('meta[name="build"]') || {}).content || '0';
    ['facts.js', 'discoveries.js'].forEach(f=>{ const sc = document.createElement('script'); sc.src = f + '?b=' + b; sc.async = true; sc.onerror = ()=> LOG({kind: 'note', src: f, ok: false, note: 'file non trovato (il workflow «Dati settimanali» non è ancora girato?)'}); sc.onload = ()=>{ LOG({kind: 'note', src: f, ok: true, note: 'caricato'}); try{ window.dispatchEvent(new Event('localdata')); }catch(e){} }; document.head.appendChild(sc); });
  };
  setTimeout(()=> H.loadLocalData(), 2500);
  // CheapShark dal browser (accesso diretto): Metascore, % recensioni Steam e prezzo in dollari di un gioco PC. Serve ai giochi che non sono nel database di base (quindi non in facts.js).
  H.cheapFacts = async function(name){
    const base = String(name || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remastered|remake|complete|hd|edition|reborn|reloaded).*$/i, '').trim();
    if(!base) return null;
    const j = await H.json('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=10&title=' + encodeURIComponent(base), {timeout: 10000});
    const t = norm(base), hit = (Array.isArray(j) ? j : []).find(x=> norm(String(x.title).replace(/\s*\([^)]*\)/g, '')) === t);
    if(!hit) return null;
    return {mc: +hit.metacriticScore || 0, sp: +hit.steamRatingPercent || 0, sc: +hit.steamRatingCount || 0, y: hit.releaseDate ? new Date(hit.releaseDate * 1000).getFullYear() : 0, p: {f: +hit.salePrice, i: +hit.normalPrice, d: Math.round(+hit.savings || 0)}, id: hit.steamAppID};
  };
  H.factsFor = g=>{ try{ return (typeof GAME_FACTS !== 'undefined' && GAME_FACTS.games && GAME_FACTS.games[g.id]) || null; }catch(e){ return null; } };

  // ---------- il cuore: giri di ricerca senza sosta ----------
  // Corsie parallele: una per le ricerche AI e due per le fonti dirette, ognuna con il proprio ritmo. Una fonte lenta o bloccata non rallenta le altre.
  // opts: {max, focusSets, ai: {strategies, run(strategy, focus) -> Promise<raw[]>, available()}, directKeys, seeds, know(Set), accept(raw[], nome, tipo) -> nuovi,
  //        found() -> n, stopped() -> bool, stopP: Promise, onSource(keys[]), onSay(text), onCount(n), maxMs, maxRounds}
  H.scout = async function(opts){
    const deadline = Date.now() + (opts.maxMs || 8 * 60e3), maxRounds = opts.maxRounds || 160;
    const dk = (opts.directKeys || H.directKeys).filter(k=> M[k]);
    const aiOn = !!(opts.ai && opts.ai.available && opts.ai.available());
    const A = aiOn ? (opts.ai.strategies || []).map(s=> ({kind: 'ai', id: 'ai:' + s.src, s, name: s.src, key: s.key || 'ai'})) : [];
    const D = dk.map(k=> ({kind: 'direct', id: k, name: DIRECT_INFO[k].name, key: DIRECT_INFO[k].key, run: M[k]})).sort((a, b)=> (RANK[a.id] == null ? 99 : RANK[a.id]) - (RANK[b.id] == null ? 99 : RANK[b.id]));
    const rawgSkip = !H.rawg.has();
    const st = {}; A.concat(D).forEach(m=> st[m.id] = {streak: 0, cool: 0, yield: 0, runs: 0});
    let rounds = 0, aiCool = 0, fi = ri(0, 50);
    const active = new Map();
    const say = t=>{ try{ opts.onSay && opts.onSay(t); }catch(e){} };
    const setActive = (lane, key)=>{ if(key) active.set(lane, key); else active.delete(lane); try{ opts.onSource && opts.onSource([...active.values()]); }catch(e){} };
    const alive = ()=> !opts.stopped() && opts.found() < opts.max && Date.now() < deadline && rounds < maxRounds;
    const nap = ms=> Promise.race([sleep(ms), opts.stopP || new Promise(()=>{})]);
    const guard = (p, ms)=> Promise.race([p, new Promise((_, rej)=> setTimeout(()=> rej(new Error('timeout ' + Math.round(ms / 1000) + ' s')), ms)), opts.stopP ? opts.stopP.then(()=> null) : new Promise(()=>{})]);
    LOG({kind: 'scout', src: 'Ricerca', ok: true, note: 'AI: ' + (A.map(m=> m.name).join(', ') || 'non disponibile') + ' · dirette: ' + D.map(m=> m.name).join(', ')});
    let staleCount = 0;                                            // giri completi senza frutti (di tutte le corsie): allarga la ricerca
    async function lane(name, list, workers){
      let cur = Math.floor(Math.random() * Math.max(1, list.length)), sinceYield = 0, ran = 0;
      const worker = async wi=>{
        while(alive()){
          // prossimo metodo non in pausa
          // sceglie la fonte con il «costo» più basso: chi ha più priorità (rango basso) e ha già reso di più viene interrogata più spesso; le mediocri per ultime
          let m = null, best = Infinity;
          for(const c of list){
            if(st[c.id].cool > rounds && list.length > 1) continue; if(c.kind === 'ai' && Date.now() < aiCool) continue;
            const q = st[c.id], rk = c.kind === 'ai' ? 0 : (RANK[c.id] == null ? 8 : RANK[c.id]);
            const cost = (q.runs + 1) * (1 + rk * 0.45) - Math.min(q.yield, 20) * 0.35;
            if(cost < best){ best = cost; m = c; }
          }
          if(!m){ await nap(1200); if(list.every(c=> st[c.id].cool > rounds)) rounds++; continue; }
          const s0 = st[m.id]; s0.runs++; rounds++; ran++;
          const focus = (staleCount >= 2 || !(opts.focusSets && opts.focusSets.length)) ? [] : opts.focusSets[(fi++) % opts.focusSets.length];
          setActive(name + wi, m.key);
          const ctx = {focus, allowed: opts.allowed || [], seeds: opts.seeds || [], know: opts.know || null};
          const t0 = performance.now();
          let n = 0;
          try{
            const raw = m.kind === 'ai' ? await guard(opts.ai.run(m.s, focus), 70000) : await guard(m.run(ctx), 45000);
            if(!opts.stopped()){
              n = raw ? opts.accept(raw, m.name, m.kind) : 0;
              s0.streak = 0; s0.yield += n;
              LOG({kind: 'scout', src: m.name, ok: n > 0, ms: Math.round(performance.now() - t0), note: (raw ? raw.length : 0) + ' proposte, ' + n + ' nuovi' + (focus.length ? ' · giro: ' + focus.join(',') : '')});
            }
          }catch(e){
            if(m.kind === 'ai' && e && (e.code === 'gemini_rate_limited' || e.status === 429)){ aiCool = Date.now() + 90e3; LOG({kind: 'scout', src: m.name, ok: false, err: 'AI al limite: pausa di 90 s, proseguo con le altre fonti'}); say('L\'AI è al limite: Frugu Frugu prosegue con le altre fonti…'); }
            else if(!(e && e.skip)){ s0.streak++; if(s0.streak >= 2){ s0.cool = rounds + 3; s0.streak = 0; } LOG({kind: 'scout', src: m.name, ok: false, ms: Math.round(performance.now() - t0), err: emsg(e)}); }
          }
          setActive(name + wi, null);
          try{ opts.onCount && opts.onCount(opts.found()); }catch(e){}
          if(n > 0){ sinceYield = 0; staleCount = 0; say('Trovati ' + n + ' giochi luccicanti da «' + m.name + '»! Totale ' + opts.found() + '.'); }
          else { sinceYield++; say('«' + m.name + '»: bidone vuoto o chiuso, passo alla prossima fonte…'); }
          // un giro completo della corsia senza frutti: pausa crescente, poi si riparte con altre parole e altri anni
          if(sinceYield >= list.length && alive()){
            staleCount++; sinceYield = 0;
            const w = Math.min(2000 * staleCount, 12000);
            say('Nessuna fonte ha dato frutti: cambio strategia (pausa ' + Math.round(w / 1000) + ' s) e riprovo con altre parole e altri anni…');
            await nap(w);
          }
        }
      };
      await Promise.all(Array.from({length: workers}, (_, i)=> worker(i)));
    }
    const lanes = [];
    if(A.length) lanes.push(lane('ai', A, 1));
    const D2 = D.filter(m=> !(rawgSkip && /^rawg/.test(m.id)));
    if(D2.length) lanes.push(lane('dir', D2, H.rawg.has() ? 3 : 2));
    await Promise.all(lanes);
    LOG({kind: 'scout', src: 'Ricerca', ok: opts.found() > 0, note: 'fine: ' + opts.found() + ' giochi in ' + rounds + ' giri' + (Date.now() >= deadline ? ' (tempo massimo)' : '')});
    return opts.found();
  };
})();
