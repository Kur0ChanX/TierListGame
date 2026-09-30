// ---- Triple Triad di Frugu 2.0: sala, album, carte con 6 stili grafici, mazzi, impostazioni (si carica solo quando lo apri) ----
// 200 carte di giochi famosi (triad-cards.js), regole FF8 (triad-core.js), immagini (triad-art.js), partite (triad-play.js), online (triad-online.js).
(function(){
  'use strict';
  if(window.TT && window.TT.loaded) return;
  const TT = window.TT = window.TT || {}; TT.loaded = true;
  const XUI = window.XUI || {};
  const LS = XUI.LS || {get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }};
  const esc = s=> String(s == null ? '' : s).replace(/[&<>"']/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'}[c]));
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));
  const $ = (s, r)=> (r || document).querySelector(s), $$ = (s, r)=> Array.from((r || document).querySelectorAll(s));
  Object.assign(TT, {LS, esc, sleep, $, $$});

  // ---------------------------------------------------------------- caricamento dei pezzi
  const build = ()=> (document.querySelector('meta[name="build"]') || {}).content || '0';
  const loadJS = src=> new Promise((res, rej)=>{ if(document.querySelector('script[data-tt="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src + '?b=' + build(); s.async = true; s.dataset.tt = src; s.onload = ()=> res(); s.onerror = ()=>{ s.remove(); rej(new Error('file ' + src + ' non trovato')); }; document.head.appendChild(s); });
  const loadCSS = href=> new Promise(res=>{ if(document.querySelector('link[data-tt="' + href + '"]')) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href + '?b=' + build(); l.dataset.tt = href; l.onload = ()=> res(); l.onerror = ()=> res(); document.head.appendChild(l); });
  TT.loadJS = loadJS;
  let booted = null;
  function boot(){
    if(booted) return booted;
    booted = (async ()=>{
      await Promise.all([loadCSS('triad.css'), loadJS('triad-cards.js'), loadJS('triad-core.js')]);
      loadJS('triad-art.js').catch(()=>{}); await loadJS('triad-play.js');
      try{ await loadJS('triad-config.js'); }catch(e){}
      initCards();
    })();
    booted.catch(()=>{ booted = null; });
    return booted;
  }

  // ---------------------------------------------------------------- preferenze
  const PK = 'jrpg_triad_prefs';
  const P = Object.assign({style: 'classico', board: 'verde', sound: true, vol: .7, fast: false, confirm: true, hide: true, auto: true, art: {}, st: {}, decks: []}, LS.get(PK, {}) || {});
  const saveP = ()=> LS.set(PK, P);
  TT.P = P; TT.saveP = saveP;
  const STYLES = [['classico', 'Classico', 'Come le carte di FF8: tinta blu o rossa'], ['olografico', 'Olografico', 'Riflessi arcobaleno che si muovono'], ['pixel', 'Pixel 16-bit', 'Immagine a pixel e righe da vecchio schermo'], ['copertina', 'Copertina', 'La locandina a tutta carta, numeri nei cerchi'], ['neon', 'Neon', 'Cornice luminosa su fondo scuro'], ['emblema', 'Emblema', 'Disegno originale, senza immagini']];
  const BOARDS = [['verde', 'Tavolo verde'], ['notte', 'Notte blu'], ['rosso', 'Velluto rosso'], ['legno', 'Legno'], ['viola', 'Viola'], ['oro', 'Oro'], ['grafite', 'Grafite']];
  Object.assign(TT, {STYLES, BOARDS});

  // ---------------------------------------------------------------- suoni (sintetizzati, nessun file)
  let AC = null;
  const ac = ()=>{ if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume().catch(()=>{}); return AC; };
  function tone(f, t0, d, type, v, to){
    const a = ac(); if(!a || !P.sound) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if(to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (v || .15) * P.vol), t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .03);
  }
  const SND = {
    click: ()=> tone(700, 0, .05, 'triangle', .1), place: ()=>{ tone(200, 0, .1, 'triangle', .3, 90); tone(520, 0, .05, 'square', .06); }, flip: ()=> tone(520, 0, .09, 'square', .07, 1040),
    same: ()=> [523, 659, 784].forEach((f, i)=> tone(f, i * .07, .16, 'triangle', .16)), plus: ()=> [440, 554, 659, 880].forEach((f, i)=> tone(f, i * .06, .16, 'triangle', .16)),
    combo: ()=> [523, 659, 784, 1047, 1319].forEach((f, i)=> tone(f, i * .055, .2, 'square', .1)), win: ()=> [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i)=> tone(f, i * .11, .28, 'triangle', .18)),
    lose: ()=> [392, 349, 311, 262].forEach((f, i)=> tone(f, i * .16, .34, 'sawtooth', .09)), tick: ()=> tone(1200, 0, .03, 'square', .05), coin: ()=>{ tone(988, 0, .07, 'square', .1); tone(1319, .07, .22, 'square', .1); },
    steal: ()=> [330, 294, 262, 196].forEach((f, i)=> tone(f, i * .1, .2, 'sawtooth', .12)), emote: ()=> tone(880, 0, .1, 'sine', .12, 1320), turn: ()=> { tone(660, 0, .08, 'triangle', .1); tone(880, .08, .1, 'triangle', .1); }, sud: ()=> [196, 196, 233, 196].forEach((f, i)=> tone(f, i * .12, .2, 'sawtooth', .12))
  };
  TT.snd = n=>{ try{ (SND[n] || SND.click)(); }catch(e){} };
  TT.vib = ms=>{ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };

  // ---------------------------------------------------------------- carte: dati, rarità, immagini, emblema
  let CARD = {}, LIST = [];
  const RAR = ['', 'c', 'c', 'c', 'u', 'u', 'r', 'r', 'e', 'l', 'm'], RARN = {c: 'Comune', u: 'Non comune', r: 'Rara', e: 'Epica', l: 'Leggendaria', m: 'Mitica'};
  const LV_TIER = {10: 'S+', 9: 'S', 8: 'A', 7: 'A', 6: 'B', 5: 'B', 4: 'C', 3: 'C', 2: 'D', 1: 'E'};
  const ELEM = {fuoco: ['Fuoco', '🔥'], ghiaccio: ['Ghiaccio', '❄️'], tuono: ['Tuono', '⚡'], terra: ['Terra', '🪨'], veleno: ['Veleno', '☠️'], vento: ['Vento', '🌪️'], acqua: ['Acqua', '💧'], sacro: ['Sacro', '✨']};
  const GLYPH = {plat: '🍄', rpg: '⚔️', act: '🗡️', fps: '🎯', fight: '🥊', horror: '👻', strat: '♟️', race: '🏎️', puzzle: '🧩', arcade: '👾', sport: '⚽', mobile: '📱', online: '🌐', indie: '🌱', stealth: '🕶️', sandbox: '⛏️'};
  const GHUE = {plat: 8, rpg: 265, act: 352, fps: 205, fight: 22, horror: 285, strat: 140, race: 48, puzzle: 172, arcade: 322, sport: 100, mobile: 190, online: 218, indie: 152, stealth: 232, sandbox: 34};
  const GENRE_N = {plat: 'Platform', rpg: 'GDR', act: 'Azione', fps: 'Sparatutto', fight: 'Picchiaduro', horror: 'Horror', strat: 'Strategia', race: 'Corse', puzzle: 'Puzzle', arcade: 'Arcade', sport: 'Sport', mobile: 'Mobile', online: 'Online', indie: 'Indie', stealth: 'Stealth', sandbox: 'Sandbox'};
  Object.assign(TT, {RARN, LV_TIER, ELEM, GLYPH, GENRE_N});
  const slug = n=> String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hash = s=>{ let h = 2166136261; for(const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function initCards(){
    CARD = {}; LIST = [];
    (window.TRIAD_CARDS || []).forEach(a=>{ const c = {id: a[0], name: a[1], year: a[2], plat: a[3], lv: a[4], v: a[5], e: a[6], g: a[7]}; CARD[c.id] = c; LIST.push(c); });
    TT.CARD = CARD; TT.LIST = LIST;
  }
  const sum = c=> c.v[0] + c.v[1] + c.v[2] + c.v[3];
  const V = n=> n >= 10 ? 'A' : String(n);
  Object.assign(TT, {slug, hash, sum, V, rarKey: lv=> RAR[lv] || 'c', starsOf: lv=> '★'.repeat(Math.ceil(lv / 2))});
  const autoArt = ()=> LS.get('jrpg_triad_autoart', {}) || {};
  const photos = ()=> LS.get('jrpg_triad_photos', {}) || {};
  function arts(cid){
    const list = ((window.TRIAD_ART || {})[cid] || []).slice(), a = autoArt()[cid];
    if(a && !list.includes(a)) list.push(a);
    return list;
  }
  TT.arts = arts;
  const thumb = (u, w)=>{ try{ return typeof window.coverThumb === 'function' ? window.coverThumb(u, w || 360) : u; }catch(e){ return u; } };
  const pix = u=> 'https://wsrv.nl/?url=' + encodeURIComponent(u) + '&w=42&h=59&fit=cover&output=png';
  const EMB = {};
  function emblem(cid){
    if(EMB[cid]) return EMB[cid];
    const c = CARD[cid]; if(!c) return 'none';
    const h = hash(cid), hue = ((GHUE[c.g] != null ? GHUE[c.g] : 200) + (h % 44) - 22 + 360) % 360, hue2 = (hue + 46 + ((h >> 3) % 44)) % 360, pat = (h >> 5) % 4;
    let deco = '', r = i=> ((h >>> (i * 3)) & 255) / 255;
    if(pat === 0) for(let i = 0; i < 9; i++) deco += `<circle cx="${Math.round(r(i) * 200)}" cy="${Math.round(r(i + 3) * 280)}" r="${18 + Math.round(r(i + 5) * 34)}" fill="hsla(${hue2},90%,72%,.14)"/>`;
    else if(pat === 1) for(let i = -3; i < 9; i++) deco += `<path d="M${i * 34 - 60} 300 L${i * 34 + 120} -20" stroke="hsla(${hue2},90%,75%,.16)" stroke-width="${8 + (i & 3) * 5}"/>`;
    else if(pat === 2) for(let i = 1; i < 7; i++) deco += `<circle cx="100" cy="120" r="${i * 26}" fill="none" stroke="hsla(${hue2},95%,78%,.17)" stroke-width="${3 + (i & 1) * 4}"/>`;
    else for(let y = 0; y < 8; y++) for(let x = 0; x < 6; x++) deco += `<path d="M${x * 40 + (y & 1) * 20} ${y * 38} l17 10 v20 l-17 10 l-17 -10 v-20z" fill="hsla(${hue2},90%,70%,${((x + y * 2 + h) % 5) / 30 + .05})"/>`;
    const words = c.name.replace(/[^A-Za-z0-9À-ÿ' ]/g, ' ').split(/\s+/).filter(w=> w && !/^(the|of|a|an|and|il|la|di|e)$/i.test(w));
    let ini = words.length > 1 ? words.slice(0, 3).map(w=> /^[0-9IVX]+$/.test(w) ? w : w[0]).join('') : (words[0] || '?').slice(0, 3);
    ini = ini.toUpperCase().slice(0, 4);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},72%,40%)"/><stop offset="1" stop-color="hsl(${hue2},82%,13%)"/></linearGradient><radialGradient id="r" cx=".5" cy=".4" r=".62"><stop offset="0" stop-color="hsla(${hue},100%,78%,.6)"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient></defs><rect width="200" height="280" fill="url(#g)"/>${deco}<rect width="200" height="280" fill="url(#r)"/><text x="100" y="142" font-size="92" text-anchor="middle" dominant-baseline="middle">${GLYPH[c.g] || '🎮'}</text><text x="100" y="232" font-size="${ini.length > 3 ? 30 : 38}" font-weight="900" text-anchor="middle" fill="rgba(255,255,255,.28)" font-family="system-ui,sans-serif">${esc(ini)}</text></svg>`;
    return EMB[cid] = "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
  }
  TT.emblem = emblem;
  const cardStyle = cid=> P.st[cid] || P.style;
  // scelta dell'immagine di una carta: {kind:'img'|'photo'|'em', url}
  function artChoice(cid){
    const ch = P.art[cid], list = arts(cid);
    if(ch === 'e') return {kind: 'em'};
    if(ch === 'f'){ const f = photos()[cid]; if(f) return {kind: 'photo', url: f}; }
    if(typeof ch === 'number' && list[ch]) return {kind: 'img', url: list[ch], i: ch};
    return list.length ? {kind: 'img', url: list[0], i: 0} : {kind: 'em'};
  }
  TT.artErr = function(img){
    const cid = img.dataset.cid, i = +img.dataset.i || 0, list = arts(cid);
    if(img.dataset.orig && img.src !== img.dataset.orig && !/^data:/.test(img.dataset.orig)){ img.src = img.dataset.orig; return; }       // l'anteprima ridotta non c'è: provo l'originale
    const n = i + 1;
    if(img.dataset.kind === 'img' && list[n] && !P.art[cid] && P.art[cid] !== 0){ img.dataset.i = n; img.dataset.orig = list[n]; img.src = thumb(list[n], 360); return; }
    img.remove(); if(P.auto) autoFind(cid);
  };
  let afQ = [], afBusy = false;
  function autoFind(cid){
    if(!window.XCOVER || !window.XCOVER.find || autoArt()[cid] || afQ.includes(cid) || arts(cid).length) return;
    afQ.push(cid); if(afBusy) return; afBusy = true;
    (async ()=>{
      while(afQ.length){
        const id = afQ.shift(), c = CARD[id]; if(!c) continue;
        try{ const r = await window.XCOVER.find({name: c.name, plat: c.plat, year: c.year}, {quick: true}); if(r && r.url){ const m = autoArt(); m[id] = r.url; LS.set('jrpg_triad_autoart', m); $$('.ttc[data-cid="' + id + '"] .ttc-art').forEach(el=>{ if(!el.querySelector('img')) el.insertAdjacentHTML('beforeend', imgTag(id, {kind: 'img', url: r.url, i: 0}, cardStyle(id))); }); } }catch(e){}
        await sleep(600);
      }
      afBusy = false;
    })();
  }
  function imgTag(cid, ch, st){
    if(ch.kind === 'em' || st === 'emblema') return '';
    const src = ch.kind === 'photo' ? ch.url : (st === 'pixel' ? pix(ch.url) : thumb(ch.url, 360));
    return `<img src="${esc(src)}" data-cid="${cid}" data-kind="${ch.kind}" data-i="${ch.i || 0}" data-orig="${esc(ch.url)}" alt="" decoding="async" loading="lazy" referrerpolicy="no-referrer" onload="this.classList.add('ok')" onerror="TT.artErr(this)">`;
  }
  // HTML di una carta. o: {owner 0/1, style, mods[4], sel, cnt, lock, cls}
  function cardHtml(cid, o){
    o = o || {}; const c = CARD[cid]; if(!c) return '';
    const st = o.style || cardStyle(cid), rk = RAR[c.lv] || 'c', mods = o.mods || [0, 0, 0, 0], ch = artChoice(cid), tier = LV_TIER[c.lv];
    const vals = ['t', 'r', 'b', 'l'].map((k, i)=>{ const raw = c.v[i], eff = raw + (mods[i] || 0); return `<b class="${k}${mods[i] > 0 ? ' up' : mods[i] < 0 ? ' dn' : ''}${eff >= 10 ? ' A' : ''}">${V(Math.max(0, eff))}</b>`; }).join('');
    const foil = (c.lv >= 9 || st === 'olografico') ? '<b class="ttc-foil"></b>' : '';
    const col = (XUI.TIER_COL || {})[tier] || '#fff';
    return `<div class="ttc${o.sel ? ' sel' : ''}${o.lock ? ' lock' : ''}${o.cls ? ' ' + o.cls : ''}" data-cid="${cid}" data-r="${rk}" data-st="${st}"${o.owner != null ? ' data-o="' + o.owner + '"' : ''}><div class="ttc-in"><div class="ttc-art"><i class="ttc-em" style="--em:${emblem(cid)}"></i>${imgTag(cid, ch, st)}</div><div class="ttc-tint"></div><div class="ttc-shade"></div><div class="ttc-v">${vals}</div>${c.e ? `<div class="ttc-el" title="${ELEM[c.e][0]}">${ELEM[c.e][1]}</div>` : ''}<div class="ttc-st">${'★'.repeat(Math.ceil(c.lv / 2))}</div><div class="ttc-tier" style="color:${col}">${tier}</div><div class="ttc-nm">${esc(c.name)}</div>${foil}</div>${o.cnt > 1 ? `<div class="ttc-cnt">×${o.cnt}</div>` : ''}${o.lock === 'x' ? '<div class="ttc-lock">🔒</div>' : ''}</div>`;
  }
  TT.cardHtml = cardHtml;
  // le carte scelte dal giocatore con la sua grafica: anche il rivale le vede così (stile della carta)
  const power = c=> c.lv * 100 + sum(c);
  TT.power = power;

  // ---------------------------------------------------------------- collezione locale (allenamento e due giocatori)
  const SK = 'jrpg_triad2';
  let S = null;
  function loadSave(){
    S = LS.get(SK, null);
    if(!S || !S.owned){
      S = {v: 2, owned: {}, stats: {w: 0, l: 0, d: 0, streak: 0, best: 0}, npc: {}, created: Date.now()};
      const pickLv = lv=>{ const l = LIST.filter(c=> c.lv === lv); return l[Math.floor(Math.random() * l.length)].id; };
      [1, 1, 2, 2, 3].forEach(lv=>{ const id = pickLv(lv); S.owned[id] = (S.owned[id] || 0) + 1; });
      try{                                                   // vecchia collezione (v135): porto le carte dei giochi che esistono ancora tra le 200
        const old = LS.get('jrpg_triad', null);
        if(old && old.owned && window.GAMES){
          const byId = new Map(window.GAMES.map(g=> [String(g.id), g]));
          Object.keys(old.owned).forEach(k=>{ const g = byId.get(String(k)); if(!g) return; const id = slug(g.name); if(CARD[id]) S.owned[id] = Math.min(3, (S.owned[id] || 0) + old.owned[k]); });
          if(old.stats) S.stats = Object.assign(S.stats, old.stats);
        }
      }catch(e){}
      LS.set(SK, S);
    }
    return S;
  }
  const saveS = ()=> LS.set(SK, S);
  const ownedIds = ()=> Object.keys(S.owned).filter(k=> S.owned[k] > 0 && CARD[k]);
  const ownedCount = ()=> ownedIds().reduce((a, k)=> a + S.owned[k], 0);
  function refill(){ let n = ownedCount(); while(n < 5){ const l = LIST.filter(c=> c.lv <= 2); const c = l[Math.floor(Math.random() * l.length)]; S.owned[c.id] = (S.owned[c.id] || 0) + 1; n++; } saveS(); }
  Object.assign(TT, {save: ()=> S || loadSave(), saveS, ownedIds, ownedCount, refill});

  // ---------------------------------------------------------------- schermate e finestre
  let root = null, hist = [], onClose = null;
  function ensureRoot(){
    if(!root){ root = document.createElement('div'); root.className = 'tt2'; root.id = 'ttRoot'; document.body.appendChild(root); }
    root.classList.add('show'); document.documentElement.classList.add('tt2-open');
    return root;
  }
  const getRoot = ()=> root;
  TT.root = getRoot;
  function screen(title, body, o){
    o = o || {};
    root.innerHTML = `<div class="tt2-top">${o.back === false ? '<span class="tt2-ib" style="visibility:hidden"></span>' : '<button class="tt2-ib" data-back aria-label="Indietro">‹</button>'}<b>${title}</b>${o.right || '<button class="tt2-ib" data-x aria-label="Chiudi">✕</button>'}</div><div class="tt2-scr" id="ttScr">${body}</div>`;
    $('[data-back]', root) && $('[data-back]', root).addEventListener('click', ()=>{ TT.snd('click'); (o.backFn || TT.back)(); });
    $('[data-x]', root) && $('[data-x]', root).addEventListener('click', ()=>{ TT.snd('click'); TT.close(); });
    return $('#ttScr', root);
  }
  function go(fn, ...args){
    if(hist.length && hist[hist.length - 1].fn === fn && JSON.stringify(hist[hist.length - 1].args) === JSON.stringify(args)) hist.pop();
    hist.push({fn, args}); return fn(...args);
  }
  function back(){
    if(hist.length > 1){ hist.pop(); const h = hist[hist.length - 1]; return h.fn(...h.args); }
    close();
  }
  function close(){ if(TT.onLeave){ const f = TT.onLeave; TT.onLeave = null; try{ f(); }catch(e){} } if(root){ root.classList.remove('show'); root.innerHTML = ''; } document.documentElement.classList.remove('tt2-open'); hist = []; if(onClose) try{ onClose(); }catch(e){} }
  function replaceTop(fn, ...args){ hist.pop(); return go(fn, ...args); }
  Object.assign(TT, {screen, go, back, close, replaceTop, ensureRoot, hist: ()=> hist});
  function modal(html, o){
    o = o || {}; const m = document.createElement('div'); m.className = 'tt2-modal' + (o.center ? ' c' : '');
    m.innerHTML = `<div class="tt2-sheet">${html}</div>`; root.appendChild(m);
    m.addEventListener('click', e=>{ if(e.target === m && !o.sticky){ m.remove(); o.onClose && o.onClose(); } });
    m.close = ()=>{ m.remove(); o.onClose && o.onClose(); };
    $$('[data-mclose]', m).forEach(b=> b.addEventListener('click', ()=> m.close()));
    return m;
  }
  function tToast(msg, ms){ if(!root) return; const t = document.createElement('div'); t.className = 'tt2-toast'; t.textContent = msg; root.appendChild(t); setTimeout(()=> t.remove(), ms || 2600); }
  function ask(text, yes, no){
    return new Promise(res=>{
      const m = modal(`<p style="font-size:1rem;text-align:center;margin:8px 0 14px">${text}</p><div class="tt2-row c"><button class="tt2-btn" data-n>${no || 'No'}</button><button class="tt2-btn pri" data-y>${yes || 'Sì'}</button></div>`, {center: true, sticky: true});
      $('[data-y]', m).addEventListener('click', ()=>{ m.remove(); res(true); }); $('[data-n]', m).addEventListener('click', ()=>{ m.remove(); res(false); });
    });
  }
  Object.assign(TT, {modal, toast: tToast, ask});
  const loading = t=> screen('Triple Triad', `<div class="tt2-load"><div><i></i>${t || 'Mescolo le carte…'}</div></div>`, {back: false});

  // ---------------------------------------------------------------- sala
  function home(){
    loadSave(); refill();
    const st = S.stats, uniq = ownedIds().length;
    screen('Triple Triad', `
      <div class="tt2-hero"><div class="tt2-title">TRIPLE TRIAD</div><div class="mut">di Frugu · 200 carte di giochi famosi</div>${fanHtml()}</div>
      <div class="tt2-stats"><div><b>${ownedCount()}</b>carte</div><div><b>${uniq}/200</b>diverse</div><div><b>${st.w}</b>vittorie</div><div><b>${st.best || 0}</b>serie record</div></div>
      <div class="tt2-menu">
        <button class="tt2-tile big" data-go="online"><span class="ic">🌐</span><b>Sfida i tuoi amici online</b><small>Con codice, QR o richiesta d'amicizia. Se vinci ti prendi le loro carte migliori!</small><span class="bd" id="ttOnBd" style="display:none"></span></button>
        <button class="tt2-tile" data-go="npc"><span class="ic">🤖</span><b>Allenamento</b><small>11 avversari, IA da 1 a 5</small></button>
        <button class="tt2-tile" data-go="hot"><span class="ic">👥</span><b>Due giocatori</b><small>Sullo stesso telefono</small></button>
        <button class="tt2-tile" data-go="album"><span class="ic">📚</span><b>Album</b><small>${uniq} di 200 carte</small></button>
        <button class="tt2-tile" data-go="gfx"><span class="ic">🎨</span><b>Grafica delle carte</b><small>6 stili e l'immagine di ogni carta</small></button>
        <button class="tt2-tile" data-go="rules"><span class="ic">📖</span><b>Regole</b><small>Same, Plus, Combo, Elementi…</small></button>
        <button class="tt2-tile" data-go="settings"><span class="ic">⚙️</span><b>Tavolo e suoni</b><small>Temi, volume, animazioni</small></button>
      </div>`, {back: false});
    $$('[data-go]', root).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); const k = b.dataset.go; if(k === 'online') openOnline(); else if(k === 'npc') go(TT.npcList); else if(k === 'hot') go(TT.hotseat); else if(k === 'album') go(albumLocal); else if(k === 'gfx') go(gfxPage); else if(k === 'rules') go(rulesPage); else if(k === 'settings') go(settingsPage); }));
    try{ if(LS.get('jrpg_triad_acct', null)){ if(window.TT_ONLINE_BADGE) window.TT_ONLINE_BADGE(); else loadJS('triad-online.js').then(()=> window.TT_ONLINE_BADGE && window.TT_ONLINE_BADGE()).catch(()=>{}); } }catch(e){}
  }
  function fanHtml(){
    const ids = ownedIds().sort((a, b)=> CARD[b].lv - CARD[a].lv || sum(CARD[b]) - sum(CARD[a]));
    const top = ids.length >= 3 ? [ids[1], ids[0], ids[2]] : ids.concat(ids).concat(ids).slice(0, 3);
    return '<div class="tt2-fan">' + top.map(id=> cardHtml(id, {})).join('') + '</div>';
  }
  async function openOnline(){
    loading('Apro la sala online…');
    try{ await loadJS('triad-online.js'); go(TT.online); }catch(e){ TT.toast('Non riesco a caricare la parte online: controlla la connessione'); go(home); }
  }
  TT.openOnline = openOnline;

  // ---------------------------------------------------------------- album
  function albumLocal(){
    loadSave();
    albumPage({title: 'Il mio album', counts: S.owned, mode: 'local'});
  }
  // src: {title, counts:{cid:n}, locks:{cid:n bloccate}, supply:{cid:[minted,cap]}, mode}
  function albumPage(src){
    const st = TT.albumState = TT.albumState || {f: 'all', q: '', g: ''};
    const have = new Set(Object.keys(src.counts).filter(k=> src.counts[k] > 0 && CARD[k]));
    const draw = ()=>{
      let body = `<div class="tt2-row sb"><span class="mut">${have.size} di ${LIST.length} carte · ${Object.keys(src.counts).reduce((a, k)=> a + (CARD[k] ? src.counts[k] : 0), 0)} in tutto</span></div><div class="tt2-bar" style="margin:6px 0 8px"><i style="width:${Math.round(have.size / LIST.length * 100)}%"></i></div>
        <input type="text" id="ttQ" placeholder="Cerca un gioco…" value="${esc(st.q)}"><div class="tt2-strip" style="margin-top:8px">${[['all', 'Tutte'], ['mine', 'Mie'], ['miss', 'Mancanti']].map(x=> `<button class="tt2-chip${st.f === x[0] ? ' on' : ''}" data-f="${x[0]}">${x[1]}</button>`).join('')}<span style="width:8px"></span>${Object.keys(GENRE_N).map(g=> `<button class="tt2-chip${st.g === g ? ' on' : ''}" data-g="${g}">${GLYPH[g]} ${GENRE_N[g]}</button>`).join('')}</div>`;
      const q = slug(st.q || '');
      for(let lv = 10; lv >= 1; lv--){
        const cs = LIST.filter(c=> c.lv === lv && (!st.g || c.g === st.g) && (!q || slug(c.name).includes(q)) && (st.f === 'all' || (st.f === 'mine' ? have.has(c.id) : !have.has(c.id))));
        if(!cs.length) continue;
        const own = LIST.filter(c=> c.lv === lv && have.has(c.id)).length;
        body += `<div class="tt2-lvl" style="color:${(XUI.TIER_COL || {})[LV_TIER[lv]] || '#fff'}">Livello ${lv} · Tier ${LV_TIER[lv]} <small>${RARN[RAR[lv]]} · ${own}/20</small></div><div class="tt2-grid">${cs.sort((a, b)=> sum(b) - sum(a)).map(c=>{ const n = src.counts[c.id] || 0; return `<div class="cw" data-c="${c.id}">${cardHtml(c.id, {cnt: n, lock: n ? (src.locks && src.locks[c.id] >= n ? 'x' : '') : 'x'})}${src.supply && src.supply[c.id] ? `<div class="mut" style="text-align:center;font-size:.62rem;margin-top:3px">${src.supply[c.id][0]}/${src.supply[c.id][1]} nel mondo</div>` : ''}</div>`; }).join('')}</div>`;
      }
      const sc = $('#ttScr', root), keep = sc ? sc.scrollTop : 0;
      screen(src.title, body); const sc2 = $('#ttScr', root); sc2.scrollTop = keep;
      const q2 = $('#ttQ', root); q2.addEventListener('input', ()=>{ st.q = q2.value; clearTimeout(draw.t); draw.t = setTimeout(()=>{ draw(); const i = $('#ttQ', root); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); });
      $$('[data-f]', root).forEach(b=> b.addEventListener('click', ()=>{ st.f = b.dataset.f; draw(); }));
      $$('[data-g]', root).forEach(b=> b.addEventListener('click', ()=>{ st.g = st.g === b.dataset.g ? '' : b.dataset.g; draw(); }));
      $$('[data-c]', root).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); cardDetail(b.dataset.c, src); }));
    };
    draw();
  }
  Object.assign(TT, {albumPage});
  const dbGame = c=>{ try{ const s = slug(c.name); return (window.GAMES || []).find(g=> slug(g.name) === s); }catch(e){ return null; } };

  // ---------------------------------------------------------------- dettaglio carta e scelta della grafica
  function cardDetail(cid, src){
    const c = CARD[cid], n = src && src.counts ? (src.counts[cid] || 0) : 0, g = dbGame(c);
    const draw = ()=>{
      const st = cardStyle(cid), ch = artChoice(cid), list = arts(cid), ph = photos()[cid];
      const m = modal(`
        <div class="tt2-big" id="ttBig">${cardHtml(cid, {})}</div>
        <div class="tt2-row c" style="margin-bottom:6px"><span class="tt2-chip r">${RARN[RAR[c.lv]]}</span><span class="tt2-chip t">Livello ${c.lv} · Tier ${LV_TIER[c.lv]}</span>${c.e ? `<span class="tt2-chip r">${ELEM[c.e][1]} ${ELEM[c.e][0]}</span>` : ''}<span class="tt2-chip r">${GLYPH[c.g] || ''} ${GENRE_N[c.g] || ''}</span></div>
        <div class="tt2-kv"><span>Gioco</span><span>${esc(c.name)}</span><span>Anno · sistema</span><span>${esc(c.year)} · ${esc(c.plat)}</span><span>Lati</span><span>Alto ${V(c.v[0])} · Destra ${V(c.v[1])} · Basso ${V(c.v[2])} · Sinistra ${V(c.v[3])} (somma ${sum(c)})</span>${src && src.counts ? `<span>Le tue copie</span><span>${n ? n : 'Non ancora tua'}</span>` : ''}${src && src.supply && src.supply[cid] ? `<span>Nel mondo</span><span>${src.supply[cid][0]} di ${src.supply[cid][1]} copie create</span>` : ''}${g ? `<span>Nella tua Tier List</span><span>${g.tier} · ${g.score}/100</span>` : ''}</div>
        ${c.e ? `<p class="mut">Su una casella ${ELEM[c.e][0]} ${ELEM[c.e][1]} questa carta prende +1 a tutti i lati; su una casella con un altro elemento prende −1.</p>` : ''}
        <h3>Stile della carta</h3><div class="tt2-stylegrid">${STYLES.map(s=> `<button data-s="${s[0]}" class="${st === s[0] ? 'on' : ''}">${cardHtml(cid, {style: s[0]})}${s[1]}</button>`).join('')}</div>
        <label class="chk"><input type="checkbox" id="ttAll"> Usa questo stile per tutte le carte</label>
        <h3>Immagine <small>(scegli quella che preferisci)</small></h3>
        <div class="tt2-arts">${list.map((u, i)=> `<button data-a="${i}" class="${ch.kind === 'img' && ch.i === i ? 'on' : ''}" style="background-image:url('${esc(thumb(u, 200))}')"></button>`).join('')}<button data-a="e" class="${ch.kind === 'em' ? 'on' : ''}" style="background-image:${emblem(cid)}">Emblema</button>${ph ? `<button data-a="f" class="${ch.kind === 'photo' ? 'on' : ''}" style="background-image:url('${ph}')"></button>` : ''}<button data-photo>📷<br>La mia foto</button></div>
        ${list.length ? '' : '<p class="mut">Per questa carta non c\'è ancora un\'immagine ufficiale: uso l\'Emblema disegnato. Puoi metterci una tua foto.</p>'}
        <div class="tt2-row c" style="margin-top:10px">${P.st[cid] || P.art[cid] != null ? '<button class="tt2-btn sm" data-reset>Ripristina automatico</button>' : ''}${g && window.openModal ? '<button class="tt2-btn sm" data-open>Apri nella Tier List</button>' : ''}<button class="tt2-btn pri" data-mclose>Fatto</button></div>
        <input type="file" accept="image/*" id="ttPh" style="display:none">`, {onClose: ()=>{}});
      const big = $('#ttBig .ttc', m);
      if(big){
        const mv = e=>{ const r = big.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; big.classList.add('tilt'); big.style.setProperty('--ry', (x * 26) + 'deg'); big.style.setProperty('--rx', (-y * 26) + 'deg'); };
        big.addEventListener('pointermove', mv); big.addEventListener('pointerleave', ()=>{ big.style.setProperty('--rx', '0deg'); big.style.setProperty('--ry', '0deg'); });
      }
      $$('[data-s]', m).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); if($('#ttAll', m).checked){ P.style = b.dataset.s; P.st = {}; } else P.st[cid] = b.dataset.s; saveP(); m.remove(); draw(); }));
      $$('[data-a]', m).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); const a = b.dataset.a; P.art[cid] = a === 'e' || a === 'f' ? a : +a; saveP(); m.remove(); draw(); }));
      const rs = $('[data-reset]', m); if(rs) rs.addEventListener('click', ()=>{ delete P.st[cid]; delete P.art[cid]; saveP(); m.remove(); draw(); });
      const op = $('[data-open]', m); if(op) op.addEventListener('click', ()=>{ try{ close(); window.openModal(g); }catch(e){} });
      $('[data-photo]', m).addEventListener('click', ()=> $('#ttPh', m).click());
      $('#ttPh', m).addEventListener('change', e=> photoPick(cid, e.target.files && e.target.files[0], ()=>{ m.remove(); draw(); }));
    };
    draw();
  }
  Object.assign(TT, {cardDetail});
  function photoPick(cid, f, done){
    if(!f) return;
    const fr = new FileReader();
    fr.onload = ()=>{
      const im = new Image();
      im.onload = ()=>{
        const w = 300, h = 420, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
        const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; cx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
        const url = cv.toDataURL('image/jpeg', .8), all = photos(); all[cid] = url; LS.set('jrpg_triad_photos', all); P.art[cid] = 'f'; saveP(); TT.toast('Foto messa sulla carta'); done && done();
      };
      im.onerror = ()=> TT.toast('Non riesco a leggere questa immagine'); im.src = fr.result;
    };
    fr.readAsDataURL(f);
  }

  // ---------------------------------------------------------------- pagina Grafica (stile per tutte le carte)
  function gfxPage(){
    const ids = ownedIds().sort((a, b)=> CARD[b].lv - CARD[a].lv), demo = ids[0] || LIST[0].id, demo2 = ids[1] || demo;
    screen('Grafica delle carte', `<p class="mut" style="text-align:center">Scegli lo stile di tutte le carte. Poi, dall'Album, tocca una carta per cambiare stile o immagine solo a lei (o metterci una tua foto).</p>
      <div class="tt2-stylegrid" style="margin-top:8px">${STYLES.map((s, i)=> `<button data-s="${s[0]}" class="${P.style === s[0] ? 'on' : ''}">${cardHtml(i % 2 ? demo2 : demo, {style: s[0], owner: i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : null})}${s[1]}<br><span class="mut" style="font-weight:600;font-size:.62rem">${s[2]}</span></button>`).join('')}</div>
      <label class="chk"><input type="checkbox" id="gAuto" ${P.auto ? 'checked' : ''}> Cerca da sola l'immagine delle carte che ne sono senza</label>
      <h3>Tavolo</h3><div class="tt2-strip">${BOARDS.map(b=> `<button class="tt2-chip${P.board === b[0] ? ' on' : ''}" data-b="${b[0]}">${b[1]}</button>`).join('')}</div>
      <div class="tt2-table" data-tb="${P.board}" id="ttPrev" style="width:fit-content;margin:8px auto"><div class="tt2-grid3" style="--cw:58px">${[0, 1, 2, 3, 4, 5].map(i=> `<div class="tt2-cell">${i === 1 ? '<div class="sq on">🔥</div>' : ''}${i < 2 ? '' : i === 2 ? `<div class="ttc-w" style="position:absolute;inset:0">${cardHtml(demo, {owner: 0})}</div>` : i === 3 ? `<div class="ttc-w" style="position:absolute;inset:0">${cardHtml(demo2, {owner: 1})}</div>` : ''}</div>`).join('')}</div></div>`);
    $$('[data-s]', root).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); P.style = b.dataset.s; P.st = {}; saveP(); gfxPage(); }));
    $$('[data-b]', root).forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); P.board = b.dataset.b; saveP(); gfxPage(); }));
    $('#gAuto', root).addEventListener('change', e=>{ P.auto = e.target.checked; saveP(); });
  }

  // ---------------------------------------------------------------- impostazioni
  function settingsPage(){
    screen('Tavolo e suoni', `
      <label class="chk"><input type="checkbox" id="sSnd" ${P.sound ? 'checked' : ''}> Suoni</label>
      <div class="tt2-row"><span class="mut" style="width:70px">Volume</span><input type="range" id="sVol" min="0" max="1" step=".05" value="${P.vol}" style="flex:1"></div>
      <label class="chk"><input type="checkbox" id="sFast" ${P.fast ? 'checked' : ''}> Animazioni veloci</label>
      <label class="chk"><input type="checkbox" id="sConf" ${P.confirm ? 'checked' : ''}> Anteprima della mossa: tocca la casella per vedere cosa prendi, tocca ancora per giocare</label>
      <label class="chk"><input type="checkbox" id="sHide" ${P.hide ? 'checked' : ''}> Due giocatori: nascondi le carte di chi non è di turno</label>
      <h3>Tavolo</h3><div class="tt2-strip">${BOARDS.map(b=> `<button class="tt2-chip${P.board === b[0] ? ' on' : ''}" data-b="${b[0]}">${b[1]}</button>`).join('')}</div>
      <h3>Dati</h3><div class="tt2-row"><button class="tt2-btn sm" id="sRes">Azzera la collezione dell'allenamento</button></div><p class="mut">L'account online e le sue carte stanno sul server e non si toccano da qui.</p>`);
    const bind = (id, k, num)=> $('#' + id, root).addEventListener('input', e=>{ P[k] = num ? +e.target.value : e.target.checked; saveP(); if(k === 'sound' && P.sound) TT.snd('click'); });
    bind('sSnd', 'sound'); bind('sVol', 'vol', true); bind('sFast', 'fast'); bind('sConf', 'confirm'); bind('sHide', 'hide');
    $$('[data-b]', root).forEach(b=> b.addEventListener('click', ()=>{ P.board = b.dataset.b; saveP(); settingsPage(); }));
    $('#sRes', root).addEventListener('click', async ()=>{ if(await ask('Azzero la collezione e i record dell\'allenamento? Ricominci con 5 carte.', 'Azzera', 'Annulla')){ LS.set(SK, null); S = null; loadSave(); TT.toast('Collezione azzerata'); back(); } });
  }

  // ---------------------------------------------------------------- regole
  function rulesPage(){
    screen('Regole', `
      <div class="tt2-box"><b>Come si gioca</b><p>Ognuno ha 5 carte. A turno si mette una carta su una casella del tavolo 3×3. Ogni carta ha 4 numeri (alto, destra, basso, sinistra) da 1 ad A (=10). Se il tuo numero è <b>più alto</b> di quello della carta avversaria che tocca, la carta passa a te. A tavolo pieno vince chi ha più carte del proprio colore (carte sul tavolo + carta rimasta in mano).</p></div>
      <div class="tt2-box"><b>${GLYPH.rpg} Elementale</b><p>Alcune caselle hanno un elemento (🔥 ❄️ ⚡ 🪨 ☠️ 🌪️ 💧 ✨). Una carta con lo <b>stesso elemento</b> prende +1 a tutti i lati; una carta con elemento diverso (o senza) prende −1. Vale solo per la regola Base e per le Combo.</p></div>
      <div class="tt2-box"><b>Uguale (Same)</b><p>Se la carta che giochi ha <b>2 o più lati uguali</b> ai numeri che toccano (anche carte tue: contano per far scattare la regola), tutte le carte <b>avversarie</b> toccate da quei lati passano a te, anche se più forti. Si usano i numeri veri, senza elementi.</p></div>
      <div class="tt2-box"><b>Uguale-muro</b><p>Come Uguale, ma il bordo del tavolo vale A: un lato con A rivolto al bordo conta come uguale.</p></div>
      <div class="tt2-box"><b>Più (Plus)</b><p>Se sommi il tuo lato al lato che tocca e <b>2 o più somme sono uguali</b> (per esempio 3+5 e 2+6), le carte avversarie di quelle somme passano a te. I bordi non contano.</p></div>
      <div class="tt2-box"><b>Combo</b><p>Le carte girate da Uguale o Più girano a loro volta le vicine più deboli (regola Base), a catena. È così che si ribaltano le partite!</p></div>
      <div class="tt2-box"><b>Morte improvvisa</b><p>Se finisce in parità si ricomincia con le carte che ognuno possiede in quel momento (al massimo 5 manche).</p></div>
      <div class="tt2-box"><b>Cosa si vince</b><p><b>Uno</b>: prendi 1 carta a scelta del perdente · <b>Diff</b>: tante carte quanti punti di scarto · <b>Diretto</b>: ognuno prende le carte girate al rivale · <b>Tutto</b>: prendi tutte e 5 le sue carte.</p></div>
      <div class="tt2-box"><b>Rarità</b><p>Le carte vanno dal livello 1 al 10 (Comune, Non comune, Rara, Epica, Leggendaria, Mitica) e corrispondono ai tier della tua Tier List (E … S+). Online le carte forti esistono in poche copie nel mondo: si guadagnano battendo i Custodi o si rubano ai giocatori.</p></div>`);
  }

  // ---------------------------------------------------------------- selezione del mazzo (5 carte)
  // o: {title, items:[{key, cid, lock}], onDone(keys), sub, need}
  function pickDeck(o){
    const need = o.need || 5, sel = [], st = {f: 'all'};
    const items = o.items.slice().sort((a, b)=> CARD[b.cid].lv - CARD[a.cid].lv || sum(CARD[b.cid]) - sum(CARD[a.cid]));
    const draw = ()=>{
      const keep = ($('#ttScr', root) || {}).scrollTop || 0;
      const chosen = sel.map(k=> items.find(i=> i.key === k));
      const pow = chosen.reduce((a, i)=> a + CARD[i.cid].lv, 0);
      screen(o.title || 'Scegli il mazzo', `${o.sub ? `<p class="mut" style="text-align:center">${o.sub}</p>` : ''}
        <div class="tt2-grid s" style="margin:4px 0 8px;padding:8px;border-radius:16px;background:rgba(0,0,0,.25)">${Array.from({length: need}, (_, i)=> chosen[i] ? `<div class="cw" data-x="${chosen[i].key}">${cardHtml(chosen[i].cid, {sel: false})}</div>` : `<div class="ttc" style="opacity:.25;background:rgba(255,255,255,.15)"><div class="ttc-in" style="background:transparent;display:grid;place-items:center;font-size:2rem">＋</div></div>`).join('')}</div>
        <div class="tt2-row sb"><span class="mut">${sel.length}/${need} · livelli ${pow}</span><span class="tt2-row"><button class="tt2-btn sm" id="dkBest">Migliori 5</button>${P.decks.length ? '<button class="tt2-btn sm" id="dkLoad">Mazzi salvati</button>' : ''}${sel.length === need ? '<button class="tt2-btn sm" id="dkSave">Salva mazzo</button>' : ''}</span></div>
        <div class="tt2-strip">${[['all', 'Tutte'], ...Object.keys(GENRE_N).map(g=> [g, GLYPH[g] + ' ' + GENRE_N[g]])].map(x=> `<button class="tt2-chip${st.f === x[0] ? ' on' : ''}" data-f="${x[0]}">${x[1]}</button>`).join('')}</div>
        <div class="tt2-grid s">${items.filter(i=> st.f === 'all' || CARD[i.cid].g === st.f).map(i=> `<div class="cw" data-k="${i.key}">${cardHtml(i.cid, {sel: sel.includes(i.key), lock: i.lock ? 'x' : '', cls: sel.length >= need && !sel.includes(i.key) ? 'dim' : ''})}</div>`).join('')}</div>
        <div style="position:sticky;bottom:0;padding:10px 0 2px;background:linear-gradient(180deg,transparent,#0a0820 40%)"><button class="tt2-btn pri w" id="dkOk" ${sel.length === need ? '' : 'disabled'}>${o.ok || 'Conferma'} (${sel.length}/${need})</button></div>`, {backFn: o.back});
      $('#ttScr', root).scrollTop = keep;
      $$('[data-k]', root).forEach(b=> b.addEventListener('click', ()=>{ const k = b.dataset.k, it = items.find(i=> i.key === k); if(it.lock){ TT.toast('Questa carta è già in una sfida o in una partita'); return; } const at = sel.indexOf(k); if(at >= 0) sel.splice(at, 1); else if(sel.length < need) sel.push(k); else return TT.toast('Hai già ' + need + ' carte: toglierne una'); TT.snd('click'); draw(); }));
      $$('[data-x]', root).forEach(b=> b.addEventListener('click', ()=>{ sel.splice(sel.indexOf(b.dataset.x), 1); draw(); }));
      $$('[data-f]', root).forEach(b=> b.addEventListener('click', ()=>{ st.f = b.dataset.f; draw(); }));
      $('#dkBest', root).addEventListener('click', ()=>{ sel.length = 0; items.filter(i=> !i.lock).slice(0, need).forEach(i=> sel.push(i.key)); TT.snd('coin'); draw(); });
      const sv = $('#dkSave', root); if(sv) sv.addEventListener('click', ()=>{ P.decks.unshift({cids: chosen.map(i=> i.cid), t: Date.now()}); P.decks = P.decks.slice(0, 6); saveP(); TT.toast('Mazzo salvato'); draw(); });
      const ld = $('#dkLoad', root); if(ld) ld.addEventListener('click', ()=>{
        const m = modal(`<h3 style="margin-top:0">Mazzi salvati</h3>${P.decks.map((d, i)=> `<button class="tt2-item" data-d="${i}"><div class="tx"><b>Mazzo ${i + 1}</b><small>${d.cids.map(c=> esc(CARD[c] ? CARD[c].name : '?')).join(' · ')}</small></div></button>`).join('<div style="height:6px"></div>')}`);
        $$('[data-d]', m).forEach(b=> b.addEventListener('click', ()=>{ const d = P.decks[+b.dataset.d]; sel.length = 0; const used = new Set(); d.cids.forEach(cid=>{ const it = items.find(i=> i.cid === cid && !i.lock && !used.has(i.key)); if(it){ sel.push(it.key); used.add(it.key); } }); m.remove(); if(sel.length < need) TT.toast('Di questo mazzo hai solo ' + sel.length + ' carte'); draw(); }));
      });
      $('#dkOk', root).addEventListener('click', ()=>{ if(sel.length === need){ TT.snd('coin'); o.onDone(sel.slice()); } });
    };
    draw();
  }
  Object.assign(TT, {pickDeck, home, loading, albumLocal, gfxPage, settingsPage, rulesPage, dbGame});

  // ---------------------------------------------------------------- apertura
  window.openTriad = async function(){
    ensureRoot(); hist = [];
    if(!TT.booted){ loading(); try{ await boot(); TT.booted = true; }catch(e){ screen('Triple Triad', `<div class="tt2-load"><div>Non riesco a caricare il gioco.<br><small>Controlla la connessione e riprova.</small><br><br><button class="tt2-btn" data-x2>Chiudi</button></div></div>`, {back: false}); $('[data-x2]', root).addEventListener('click', close); return; } }
    loadSave();
    // link d'invito ricevuto (#tt=room:CODICE o #tt=friend:CODICE): apro subito la parte online
    let inv = null; try{ inv = sessionStorage.getItem('rt_tt_invite'); }catch(e){}
    if(inv){
      try{ sessionStorage.removeItem('rt_tt_invite'); }catch(e){}
      const sm = String(inv).match(/;s=(https?:\/\/[^;\s]+)/);            // l'invito porta con sé l'indirizzo del server, se questo telefono non lo ha ancora
      if(sm && !LS.get('jrpg_triad_server', '') && !window.TRIAD_SERVER) LS.set('jrpg_triad_server', sm[1].replace(/\/+$/, ''));
      TT.invite = inv; return go(async ()=>{ await openOnline(); });
    }
    go(home);
  };
  window.addEventListener('popstate', ()=>{});
})();
