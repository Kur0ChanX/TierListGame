// ---- Aggiorna info: controlla un gioco su fonti pubbliche (Wikipedia, Wikidata) e propone correzioni ----
// Voto = Metascore riportato da Wikipedia; generi e anno = Wikidata; testi riscritti dall'AI SOLO a partire dagli estratti di Wikipedia.
// Non cambia nulla senza conferma. Sui giochi nuovi controlla in automatico voto, generi e anno (senza AI).
(function(){
  const OV = 'jrpg_game_overrides';
  const tierOf = s=> s >= 95 ? 'S+' : s >= 90 ? 'S' : s >= 85 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : s >= 40 ? 'E' : 'F';
  const CK = 'jrpg_info_checked';
  const loadCk = ()=>{ try{ return JSON.parse(localStorage.getItem(CK) || '{}') || {}; }catch(e){ return {}; } };
  const fmtDate = iso=>{ try{ return new Date(iso).toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit', year:'numeric'}); }catch(e){ return iso; } };
  function markChecked(id){
    try{ frManual(id); }catch(e){}
    const c = loadCk(); c[id] = new Date().toISOString();
    try{ localStorage.setItem(CK, JSON.stringify(c)); }catch(e){}
    const b = document.getElementById('updateInfoBtn');
    if(b){ b.className = 'btn upd-done'; b.textContent = '✅ Aggiornato il ' + fmtDate(c[id]); }
  }
  window.infoBtnHtml = g=>{
    const d = loadCk()[g.id];
    let au = null; try{ au = (JSON.parse(localStorage.getItem('jrpg_audit') || '{}') || {})[g.id]; }catch(e){}
    if(au && au.ch && au.ch.length) return `<button class="btn" id="auditPendingBtn" title="Il controllo automatico ha trovato delle differenze: tocca per confrontarle e decidere">📝 ${au.ch.length} ${au.ch.length === 1 ? 'modifica' : 'modifiche'} da approvare</button>`;
    return '';                                                      // «Aggiorna info» è stato unito a «Update V+»: resta solo il pulsante delle modifiche da approvare
  };
  const loadOv = ()=>{ try{ return JSON.parse(localStorage.getItem(OV) || '{}') || {}; }catch(e){ return {}; } };
  const saveOv = o=>{ try{ localStorage.setItem(OV, JSON.stringify(o)); }catch(e){} };
  const baseName = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remake|complete|hd|edition|reborn|reloaded).*$/i, '').trim();
  const yearsOf = g=> (String(g.year || '').match(/\d{4}/g) || []).map(Number);

  // pulizia una tantum: correzioni sbagliate della lingua di The Legend of Dragoon (id 16), che è in italiano con doppiaggio
  (function(){ try{ if(localStorage.getItem('jrpg_ovfix83')) return; const o = loadOv(); if(o[16]){ if(o[16].label){ delete o[16].label.it; delete o[16].label.ko; delete o[16].label.ok; } if(o[16].enrich) delete o[16].enrich.language; saveOv(o); } localStorage.setItem('jrpg_ovfix83', '1'); }catch(e){} })();
  window.applyGameOverrides = function(){
    const ov = loadOv();
    GAMES.forEach(g=>{
      const o = ov[g.id]; if(!o || g.custom) return;
      ['score','tier','m','vs','tags','year','ysort','story','note'].forEach(k=>{ if(o[k] !== undefined) g[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; });
      if(o.enrich){ g.enrich = g.enrich || {}; Object.assign(g.enrich, o.enrich); }
      if(o.label){ g.label = Object.assign({}, g.label || {}, o.label); }
    });
    // giochi di base eliminati dall'utente: nascosti (il file dei dati non si tocca; la scelta viaggia con le correzioni sugli altri dispositivi)
    for(let i = GAMES.length - 1; i >= 0; i--){ const o = ov[GAMES[i].id]; if(o && o.hide && !GAMES[i].custom) GAMES.splice(i, 1); }
  };
  // Elimina un gioco dalla tua lista. Aggiunto da te: lapide nel database locale (sparisce anche dagli altri dispositivi). Di base: viene nascosto.
  window.rtDeleteGame = function(g){
    if(!g) return false;
    const id = g.id;
    try{
      if(g.custom){ if(typeof COVER_DB !== 'undefined' && COVER_DB) COVER_DB.doc('customGames/' + String(id)).delete(); }
      else{ const ov = loadOv(); ov[id] = Object.assign({}, ov[id] || {}, {hide: 1}); saveOv(ov); applyGameOverrides(); }
      try{ FAVS.delete(id); saveFavs(); }catch(e){}
      try{ if(STATUSES[id] !== undefined){ delete STATUSES[id]; saveStatuses(); } }catch(e){}
      try{ if(typeof MYTIER === 'object' && MYTIER && MYTIER[id] !== undefined){ delete MYTIER[id]; saveMyTier(); } }catch(e){}
      try{ const w = JSON.parse(localStorage.getItem('jrpg_wishlist') || '{}'); if(w && w[id]){ delete w[id]; localStorage.setItem('jrpg_wishlist', JSON.stringify(w)); } }catch(e){}
      try{ if(typeof compareList !== 'undefined'){ const i = compareList.indexOf(id); if(i >= 0) compareList.splice(i, 1); } }catch(e){}
      try{ renderMetrics(); renderStats(); render(); renderListBar(); }catch(e){}
      return true;
    }catch(e){ return false; }
  };

  const fj = (u, o)=> window.SearchHub ? SearchHub.json(u, o) : fetch(u).then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  async function wp(params){
    return fj('https://en.wikipedia.org/w/api.php?' + new URLSearchParams(Object.assign({format:'json', origin:'*'}, params)));
  }
  // Metascore dal wikitext. Accetta «| MC = 89», «| MC = 89/100» e i giochi su più piattaforme («| MC = PC: 84/100<br>PS3: 89/100»): in quel caso vale il più alto
  function mcFromWikitext(t){
    const f = String(t).match(/\|\s*MC\d*\s*=\s*([^\n]*(?:\n(?!\s*\|)[^\n]*){0,4})/i); if(!f) return null;
    const txt = f[1].replace(/<ref[\s\S]*?(?:<\/ref>|\/>)/gi, ' ').replace(/\{\{[^}]*\}\}/g, m=> m.replace(/[^0-9\/]+/g, ' '));
    let nums = (txt.match(/\b(\d{2,3})\s*\/\s*100\b/g) || []).map(x=> +x.match(/\d+/)[0]);
    if(!nums.length){ const b = txt.match(/^\s*(\d{2,3})\b/); if(b) nums = [+b[1]]; }
    nums = nums.filter(n=> n >= 20 && n <= 100);
    return nums.length ? Math.max.apply(null, nums) : null;
  }
  async function wikiPage(name){
    const base = baseName(name), target = normGameName(base);
    const s = await wp({action:'query', list:'search', srsearch: base + ' video game', srlimit:'6'});
    const hits = (s.query && s.query.search) || [];
    const strip = t=> normGameName(t.replace(/\s*\([^)]*\)\s*$/, ''));
    const pick = hits.find(h=> strip(h.title) === target) || hits.find(h=> /video game/i.test(h.snippet || '') && strip(h.title).includes(target));
    if(!pick) return null;
    const ex = await wp({action:'query', prop:'extracts', explaintext:'1', exsectionformat:'plain', titles: pick.title, redirects:'1'});
    const text = (Object.values(ex.query.pages)[0] || {}).extract || '';
    let mc = null;
    try{
      const w = await wp({action:'parse', page: pick.title, prop:'wikitext', redirects:'1'});
      mc = mcFromWikitext(w.parse.wikitext['*'] || '');
    }catch(e){}
    const cm = text.match(/Metacritic[^.]{0,200}?(?:based on|from)\s+(\d+)\s+(?:critic )?reviews/i);
    return {title: pick.title, url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(pick.title.replace(/ /g, '_')), text, mc, count: cm ? +cm[1] : null};
  }
  // Wikipedia ad albero: se il titolo esatto non basta prova varianti (senza sottotitolo, senza edizione, «(video game)», parole chiave) prima di arrendersi
  async function wikiPageTree(name){
    const seenN = new Set(); const variants = [name, baseName(name), String(name).split(/\s*[:–-]\s+/)[0], String(name).replace(/\s*\([^)]*\)/g, '').trim(), baseName(name) + ' (video game)']
      .map(x=> String(x || '').trim()).filter(x=>{ if(!x || seenN.has(x.toLowerCase())) return false; seenN.add(x.toLowerCase()); return true; });
    let lastErr = null;
    for(const v of variants){
      try{ const r = await wikiPage(v); if(r) return r; }catch(e){ lastErr = e; }
    }
    if(lastErr && variants.length) throw lastErr;
    return null;
  }
  // estratto utile per l'AI: introduzione + gameplay + accoglienza (max ~9000 caratteri)
  function digest(text){
    const t = String(text || '');
    const i = t.search(/\n\s*Reception\s*\n/i);
    const head = t.slice(0, 5200);
    const rec = i > 0 ? t.slice(i, i + 3600) : '';
    return (head + (rec ? '\n[...]\n' + rec : '')).slice(0, 9000);
  }
  // prova diretta dell'italiano: la voce di it.wikipedia con la tabella "Doppiatore italiano" (nessuna AI, nessuna stima)
  async function itWikiLang(name){
    const base = baseName(name), target = normGameName(base);
    const q = new URLSearchParams({format:'json', origin:'*', action:'query', list:'search', srsearch: base + ' videogioco', srlimit:'3'});
    const s = await fj('https://it.wikipedia.org/w/api.php?' + q);
    const hit = ((s.query && s.query.search) || []).find(h=> normGameName(h.title.replace(/\s*\([^)]*\)\s*$/, '')) === target);
    if(!hit) return null;
    const q2 = new URLSearchParams({format:'json', origin:'*', action:'parse', page: hit.title, prop:'wikitext', redirects:'1'});
    const w = await fj('https://it.wikipedia.org/w/api.php?' + q2);
    const txt = (w.parse && w.parse.wikitext && w.parse.wikitext['*']) || '';
    return {title: hit.title, url: 'https://it.wikipedia.org/wiki/' + encodeURIComponent(hit.title.replace(/ /g, '_')), dub: /doppiatore italiano|doppiaggio italiano|doppiato in italiano/i.test(txt)};
  }
  // ---- Steam: lingue ufficiali (interfaccia/audio/sottotitoli). Steam non permette l'accesso diretto dal browser: si passa da un ponte pubblico (CORS proxy). Se il ponte non risponde, la fonte viene saltata senza errori.
  const PROXIES = [u=> 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u=> 'https://corsproxy.io/?' + encodeURIComponent(u)];
  async function viaProxy(url){
    // Steam non permette l'accesso diretto dal browser: catena di ponti pubblici con autoapprendimento (SearchHub); se manca, i due ponti storici
    if(window.SearchHub) return SearchHub.json(url, {direct: false});
    for(const p of PROXIES){
      try{ const r = await fetch(p(url), {signal: AbortSignal.timeout(9000)}); if(r.ok){ const t = await r.text(); try{ return JSON.parse(t); }catch(e){} } }catch(e){}
    }
    throw new Error('ponte non raggiungibile');
  }
  async function steamInfo(name){
    const base = baseName(name), target = normGameName(base);
    const s = await viaProxy('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(base) + '&cc=IT&l=english');
    const hit = ((s && s.items) || []).find(x=> x.type === 'app' && normGameName(String(x.name).replace(/\s*\([^)]*\)/g, '')) === target);
    if(!hit) return null;
    const d = await viaProxy('https://store.steampowered.com/api/appdetails?appids=' + hit.id + '&cc=it&l=english&filters=basic,supported_languages,metacritic,release_date,genres,price_overview');
    const x = (d && d[hit.id] && d[hit.id].data) || {};
    const html = x.supported_languages || '';
    if(!html) return null;
    const it = /Italian(<strong>\*<\/strong>)?/i.exec(html);
    const yy = String((x.release_date && x.release_date.date) || '').match(/(19[7-9]\d|20[0-3]\d)/);
    return {id: hit.id, url: 'https://store.steampowered.com/app/' + hit.id + '/', itText: !!it, itAudio: !!(it && it[1]),
      mc: (x.metacritic && x.metacritic.score) || null, mcUrl: (x.metacritic && x.metacritic.url) || null, year: yy ? yy[1] : null, genres: (x.genres || []).map(z=> z.description),
      price: x.price_overview ? x.price_overview.final / 100 : (x.is_free ? 0 : null), desc: String(x.about_the_game || x.detailed_description || x.short_description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3500), langs: html.replace(/<[^>]+>/g, '').replace(/languages with full audio support/i, '').trim().slice(0, 300)};
  }
  // ---- PCGamingWiki: tabella lingue (interfaccia/audio/sottotitoli). Accesso diretto dal browser; se non risponde viene saltata.
  async function pcgwInfo(name){
    const base = baseName(name);
    const q = new URLSearchParams({action:'cargoquery', tables:'L10n', fields:'_pageName=page,Language,Interface,Audio,Subtitles', where:`_pageName="${base.replace(/"/g, '')}" AND Language="Italian"`, format:'json', origin:'*'});
    const j = await fj('https://www.pcgamingwiki.com/w/api.php?' + q, {timeout: 9000}); const row = j.cargoquery && j.cargoquery[0] && j.cargoquery[0].title;
    if(!row) return null;
    const yes = x=> String(x).toLowerCase() === 'true';
    return {url: 'https://www.pcgamingwiki.com/wiki/' + encodeURIComponent(row.page.replace(/ /g, '_')), itText: yes(row.Interface) || yes(row.Subtitles), itAudio: yes(row.Audio)};
  }
  // RAWG (chiave gratuita dell'utente): anno, voto Metacritic, descrizione, giochi affini. Se non c'è la chiave o non risponde, viene saltata.
  async function ocInfoFor(g){
    if(!(window.SearchHub && SearchHub.opencritic && SearchHub.opencritic.has())) return null;
    return SearchHub.opencritic.info(g.name);
  }
  async function rawgInfoFor(g){
    if(!(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has())) return null;
    const i = await SearchHub.rawg.info(g.name); if(!i) return null;
    try{ i.similar = (await SearchHub.rawg.similar(i, 8)).filter(n=> n && n.toLowerCase() !== String(g.name).toLowerCase()).slice(0, 6); }catch(e){ i.similar = []; }
    return i;
  }
  // perché una fonte non ha risposto, in parole semplici
  function whyFail(e){
    const m = String((e && e.message) || e || ''), c = e && e.status;
    if(e && e.skip) return /chiave/i.test(m) ? 'chiave non impostata' : /limite/i.test(m) ? 'limite giornaliero raggiunto (' + m.replace(/^.*\(|\)$/g, '') + ' richieste)' : m;
    if(c === 401 || c === 403 || /HTTP (401|403)/.test(m)) return 'accesso negato (chiave non valida, API non attivata o permessi mancanti)';
    if(c === 429 || /HTTP 429/.test(m)) return 'quota finita o troppe richieste (riprova più tardi)';
    if(c === 402 || /HTTP 402/.test(m)) return 'piano a pagamento richiesto / quota esaurita';
    if(c === -1 || /non JSON|blocco/i.test(m)) return 'bloccato dal sito (pagina di blocco)';
    if(/in pausa/i.test(m)) return 'in pausa dopo troppi errori (riprovo tra qualche minuto)';
    if(/^HTTP 5|HTTP 5\d\d/.test(m) || (c && c >= 500)) return 'il sito ha un problema (errore ' + (c || '5xx') + ')';
    if(/timeout|Abort/i.test(m)) return 'non ha risposto in tempo';
    return 'non raggiungibile (rete o blocco del sito)';
  }
  // Stato della ricerca del voto per gioco: se un sito mi ha bloccato (o la quota è finita) riprovo domani; se il gioco semplicemente non c'è, non riprovo più
  const VSK = 'jrpg_vote_state';
  const vsLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(VSK) || '{}') || {}; }catch(e){ return {}; } };
  function voteOutcome(st){
    let found = 0, retry = false;
    for(const [r, ks] of [[3, ['wiki', 'steam', 'cheap']], [2, ['oc']], [1, ['rawg']]]){
      const ss = ks.map(k=> st && st[k]).filter(x=> x && x.state !== 'skip');
      if(ss.some(x=> x.state === 'ok')){ found = r; break; }
      if(ss.some(x=> x.state === 'err')) retry = true;                       // bloccato / quota finita: la fonte c'è ma oggi non risponde
    }
    return {found, retry};
  }
  function saveVoteState(id, st){
    try{ const o = voteOutcome(st), all = vsLoad(), now = Date.now(); all[id] = {t: now, f: o.found, r: o.retry ? now + 24 * 3600e3 : 0}; localStorage.setItem(VSK, JSON.stringify(all)); return o; }catch(e){ return null; }
  }
  const VDIAG = 'jrpg_vote_diag';
  const voteLines = st=> ['wiki', 'steam', 'cheap', 'oc', 'rawg'].map(k=> st && st[k]).filter(x=> x && x.state !== 'skip').map(x=> (x.state === 'ok' ? '✅ ' : x.state === 'nd' ? '➖ ' : '⚠️ ') + x.name + ': ' + (x.state === 'ok' ? 'voto ' + x.score : x.why));
  function saveVoteDiag(id, st){
    try{ const all = JSON.parse(localStorage.getItem(VDIAG) || '{}') || {}; all[id] = {t: new Date().toISOString(), lines: voteLines(st), prob: ['wiki', 'steam', 'cheap', 'oc', 'rawg'].map(k=> st[k]).filter(x=> x && (x.state === 'err' || x.state === 'off')).map(x=> x.name + ': ' + x.why)}; localStorage.setItem(VDIAG, JSON.stringify(all)); return all[id]; }catch(e){ return null; }
  }
  window.voteDiagFor = id=>{ try{ return (JSON.parse(localStorage.getItem(VDIAG) || '{}') || {})[id] || null; }catch(e){ return null; } };
  async function gather(g, lite){
    // lite: solo le fonti leggere (Wikipedia, Wikidata, RAWG); Steam e PCGamingWiki (lingue) restano per «Aggiorna info»
    const none = Promise.resolve(null);
    const needCheap = !(window.SearchHub && SearchHub.factsFor(g)) && window.SearchHub;
    const [wiki, wd, itw, steam, pcgw, rawg, cheap] = await Promise.allSettled([wikiPageTree(g.name), wikidataGenreCodes(g.name), lite ? none : itWikiLang(g.name), lite ? none : steamInfo(g.name), lite ? none : pcgwInfo(g.name), rawgInfoFor(g), needCheap ? SearchHub.cheapFacts(g.name) : none]);
    const cheapLive = cheap.status === 'fulfilled' ? cheap.value : null;
    // OpenCritic (poche richieste gratuite al giorno) si interroga solo se Metacritic non ha dato nessun voto (Wikipedia, Steam o CheapShark)
    const mcSeen = (wiki.status === 'fulfilled' && wiki.value && wiki.value.mc) || (steam.status === 'fulfilled' && steam.value && steam.value.mc) || (cheapLive && cheapLive.mc) || (window.SearchHub && (f=> f && ((f.s && f.s.mc) || (f.c && f.c.mc)))(SearchHub.factsFor(g)));
    const needOc = !mcSeen;
    const oc = needOc ? (await Promise.allSettled([ocInfoFor(g)]))[0] : {status: 'fulfilled', value: null};
    const ok = x=> x.status === 'fulfilled' ? x.value : null;
    // stato di ogni fonte del voto (per dire chiaramente se un sito è bloccato, la chiave non va o la quota è finita)
    const H = window.SearchHub, hasK = f=> { try{ return !!(H && f && f.has()); }catch(e){ return false; } };
    const mk = (name, r, val, sc, noKey, skipped)=> skipped ? {name, state:'skip'} : noKey ? {name, state:'off', why:'chiave non impostata su questo dispositivo (copiala dall\'altro con «Copia le mie chiavi» in ⚙️ Chiedi a Claude)'} : r.status === 'rejected' ? {name, state:'err', why: whyFail(r.reason)} : sc ? {name, state:'ok', score: sc} : {name, state:'nd', why: val ? 'trovato ma senza voto' : 'gioco non trovato'};
    const vals = {wiki: ok(wiki), steam: ok(steam), rawg: ok(rawg), oc: ok(oc)};
    const cf = (H && H.factsFor(g)) || (cheapLive ? {c: cheapLive} : null);
    const st = {
      wiki: mk('Wikipedia (Metacritic)', wiki, vals.wiki, vals.wiki && vals.wiki.mc),
      steam: mk('Steam (Metacritic)', steam, vals.steam, vals.steam && vals.steam.mc, false, lite),
      cheap: mk('CheapShark (Metacritic)', needCheap ? cheap : {status:'fulfilled'}, cf, (cf && ((cf.s && cf.s.mc) || (cf.c && cf.c.mc))) || 0),
      oc: mk('OpenCritic', oc, vals.oc, vals.oc && vals.oc.score, needOc && !hasK(H && H.opencritic), !needOc),
      rawg: mk('RAWG', rawg, vals.rawg, vals.rawg && vals.rawg.mc, !hasK(H && H.rawg))
    };
    return {st, wiki: ok(wiki), wd: ok(wd), itw: ok(itw), steam: ok(steam), pcgw: ok(pcgw), rawg: ok(rawg), oc: ok(oc), facts: (window.SearchHub && SearchHub.factsFor(g)) || (cheapLive ? {c: cheapLive} : null), steamFailed: steam.status === 'rejected', pcgwFailed: pcgw.status === 'rejected',
            errors: [wiki, wd].filter(x=> x.status === 'rejected').length};
  }
  // proposte "di fatto" (senza AI)
  function factChanges(g, src){
    const ch = [];
    // Il voto si cerca in quest'ordine di priorità: 1) Metacritic (Wikipedia, Steam, CheapShark) → 2) OpenCritic → 3) RAWG. Una fonte meno affidabile non sostituisce mai una più affidabile.
    const rk = v=> /^Metacritic/.test(v || '') ? 3 : /^OpenCritic/.test(v || '') ? 2 : /^RAWG/.test(v || '') ? 1 : 0;
    const offerScore = (r, sc, vs, id, label, to)=>{
      if(!sc || ch.some(c=> /^score|^method|^vsrc/.test(c.id))) return;
      const v = g.m === 'V';
      if(v && g.vs && rk(g.vs) > r) return;                                   // voto già preso da una fonte più affidabile
      if(sc === g.score){                                                      // stesso voto: lo confermo e registro da dove viene
        if(!v) ch.push({id:'method', label:'Voto confermato (' + to + ')', from:'stima', to:'verificato (V)', patch:{m:'V', vs}});
        else if(r === 3 && rk(g.vs) < 3) ch.push({id:'vsrc', label:'Fonte del voto', from: g.vs || 'non registrata', to: vs, patch:{vs}});
        return;
      }
      // un voto verificato di origine ignota è quasi sempre Metacritic: OpenCritic/RAWG non lo toccano. Metacritic vince sempre da solo; solo uno scarto enorme (>15, probabile gioco sbagliato) chiede conferma
      if(v && !g.vs && r < 3) return;
      const off = v && Math.abs(sc - g.score) > 15;
      ch.push({id, label: label + ' (' + to + ')', from: `${g.score} (${v ? 'verificato' : 'stima'})`, to: `${sc} (${to})`, patch:{score: sc, tier: tierOf(sc), m:'V', vs}, off});
    };
    // lingua italiana da fonti ufficiali (solo prove positive: se un sito non elenca l'italiano non significa che il gioco non lo abbia; l'edizione PC può differire da quella console)
    { const cur = (g.label || {}).it, rank = {N:0, F:0, S:1, D:2};
      const found = [];
      // Steam dal browser (se raggiungibile) oppure dai dati settimanali scaricati dai server (facts.js)
      const fs0 = src.facts && src.facts.s && (src.facts.s.it === 'D' || src.facts.s.it === 'S') ? src.facts.s : null;
      const steamSrc = src.steam || (fs0 ? {url: 'https://store.steampowered.com/app/' + fs0.id + '/', itText: true, itAudio: fs0.it === 'D'} : null);
      if(steamSrc && steamSrc.itText) found.push({code: steamSrc.itAudio ? 'D' : 'S', name:'Steam' + (src.steam ? '' : ' (dati settimanali)'), url: steamSrc.url, audio: steamSrc.itAudio});
      if(src.pcgw && src.pcgw.itText) found.push({code: src.pcgw.itAudio ? 'D' : 'S', name:'PCGamingWiki', url: src.pcgw.url, audio: src.pcgw.itAudio});
      const best = found.sort((a, b)=> rank[b.code] - rank[a.code])[0];
      if(best && (rank[cur] || 0) < rank[best.code]){
        ch.push({id:'itsrc', label:'🇮🇹 Lingua italiana (' + found.map(f=> f.name).join(' + ') + ')', from: `italiano: ${cur || '—'}`, to: (best.code === 'D' ? 'testi e doppiaggio in italiano' : 'testi/sottotitoli in italiano') + ' — ' + found.map(f=> f.url).join(' · '), patch:{label:{it: best.code}}});
      }
    }
    if(src.itw && src.itw.dub && (g.label || {}).it !== 'D'){
      ch.push({id:'itdub', label:'🎙️ Doppiaggio italiano', from: `italiano: ${(g.label || {}).it || '—'}`, to: `testi e doppiaggio in italiano (prova: la voce di it.wikipedia "${src.itw.title}" elenca i doppiatori italiani) ${src.itw.url}`, patch:{label:{it:'D'}}});
    }
    const nowY = new Date().getFullYear();
    offerScore(3, src.wiki && src.wiki.mc, 'Metacritic (da Wikipedia)', 'score', 'Voto', 'Metacritic, da Wikipedia');
    // GENERI dalle fonti (Wikidata, RAWG, Steam): i generi che le fonti sanno riconoscere diventano quelli del gioco (si aggiungono i confermati, si tolgono quelli che nessuna fonte conferma).
    // JRPG/WRPG, «a turni», Crossover, Remake, Guerra, Gacha… non si possono verificare e restano. Se le fonti non dicono nulla di preciso (solo «RPG») non si cambia niente.
    {
      const VER = new Set(['TAC','ACT','DUN','MON','CARD','ROG','METR','SOUL','VN','HOR','MECH','LIFE','PLAT','FIGHT','RTS','TOWERDEF','PUZ','STEALTH','FPS','TPS','SHMUP','RACE','SPORT','CITY','ACTADV','OPENW','MMO','SIMVEH','TRIVIA','ADV','WALK','BR','RHY','PARTY','SAND','MOBA','TBS4X','BEAT']);
      const info = c=> TAG_INFO[c] || EXTRA_GENRE_INFO[c];
      const hy = x=> String(x).replace(/[-_]/g, ' ');
      const raw = [].concat((src.rawg && src.rawg.genres) || [], ((src.rawg && src.rawg.tags) || []).map(t=> t.name), (src.steam && src.steam.genres) || []).filter(Boolean);
      const cf = window.wikidataCodesFrom || (()=> []);
      const fromWd = ((src.wd && src.wd.labels && src.wd.labels.length) ? (src.wd.codes || []) : []).filter(c=> VER.has(c) && info(c));
      const fromWeb = [...new Set(cf(raw).concat(cf(raw.map(hy))))].filter(c=> VER.has(c) && info(c));
      const found = [...new Set(fromWd.concat(fromWeb))];                       // tutto ciò che le fonti riconoscono (basta una fonte per NON togliere)
      const addOk = c=> fromWd.includes(c) || (fromWeb.includes(c) && (fromWd.length === 0 || (src.rawg && src.steam)));   // per AGGIUNGERE: Wikidata, oppure RAWG/Steam quando Wikidata tace
      if(found.length){
        const mine = g.tags.slice(), add = found.filter(c=> !mine.includes(c) && addOk(c)), drop = mine.filter(t=> VER.has(t) && !found.includes(t));
        if(add.length || drop.length){
          const keep = mine.filter(t=> !drop.includes(t)).concat(add).slice(0, 6);
          const extra = add.concat(drop).some(c=> EXTRA_GENRE_INFO[c]);
          const lab = c=> (info(c) || {}).label || c, srcN = [fromWd.length ? 'Wikidata' : '', fromWeb.length ? (src.rawg ? 'RAWG' : 'Steam') : ''].filter(Boolean).join(' + ');
          if(keep.length) ch.push({id:'tagsync', label:'Generi (dalle fonti)', from: mine.map(lab).join(', ') || '—', to: [add.length ? '+ ' + add.map(lab).join(', ') : '', drop.length ? '− ' + drop.map(lab).join(', ') : ''].filter(Boolean).join(' · ') + ' (' + srcN + ')' + (extra ? ' ⚠️ (esce da JRPG / RPG)' : ''), patch:{tags: keep}, warn: extra});
        }
      }
    }
    if(src.wd && src.wd.years && src.wd.years.length){
      const mine = yearsOf(g), wy = src.wd.years;
      if(mine.length && !mine.some(y=> wy.some(z=> Math.abs(y - z) <= 1))){
        const y = Math.min(...wy);
        ch.push({id:'year', label:'Anno', from: g.year, to: String(y) + ' (Wikidata)', patch:{year: String(y), ysort: y}});
      }
      if(Math.min(...wy) > nowY) ch.push({id:'unreleased', label:'⚠️ Non ancora uscito', from:'', to:'Wikidata indica un\'uscita nel ' + Math.min(...wy) + ': voto e recensioni non possono essere reali', patch:{note:'Non ancora uscito (uscita prevista ' + Math.min(...wy) + '): voto provvisorio.', m:'S'}});
    }
    // dati settimanali dai server: Metascore riportato da Steam/CheapShark (proposta mai attiva di default: le recensioni non sono contabili)
    {
      // ordine di attendibilità del Metascore: Wikipedia (già sopra) → Steam dal vivo → Steam nei dati settimanali → CheapShark
      const cands = [[src.steam && src.steam.mc, 'Steam dal vivo'], [src.facts && src.facts.s && src.facts.s.mc, 'Steam, dati settimanali'], [src.facts && src.facts.c && src.facts.c.mc, 'CheapShark']].filter(x=> x[0]);
      const [mc, from] = cands[0] || [];
      offerScore(3, mc, 'Metacritic (da ' + (/CheapShark/.test(from || '') ? 'CheapShark' : 'Steam') + ')', 'score4', 'Voto (Metascore da ' + from + ')', 'Metascore riportato da ' + from + '; recensioni non verificabili');
      // anno: Wikidata (già sopra) → Steam dal vivo → Steam nei dati settimanali → CheapShark → RAWG (sotto)
      const ys = [[src.steam && src.steam.year, 'Steam dal vivo'], [src.facts && src.facts.s && src.facts.s.y, 'Steam, dati settimanali'], [src.facts && src.facts.c && src.facts.c.y, 'CheapShark']].filter(x=> x[0]);
      const mine = yearsOf(g);
      if(ys.length && mine.length && !ch.some(c=> c.id === 'year' || c.id === 'unreleased') && !(src.wd && src.wd.years && src.wd.years.length)){
        const [y, yf] = ys[0];
        if(!mine.some(m=> Math.abs(m - +y) <= 1)) ch.push({id:'year', label:'Anno', from: g.year, to: y + ' (' + yf + ')', patch:{year: String(y), ysort: +y}});
      }
    }
    // OpenCritic (2ª fonte, solo se Metacritic non ha il gioco)
    offerScore(2, src.oc && src.oc.score, 'OpenCritic (nessun Metacritic trovato)', 'score5', 'Voto (OpenCritic)', 'media dei critici su OpenCritic' + (src.oc && src.oc.reviews ? ', ' + src.oc.reviews + ' recensioni' : ''));
    // RAWG: conferma l'anno (se Wikidata non ha già proposto), voto Metacritic (mai attivo di default: le recensioni non sono contabili) e giochi affini
    if(src.rawg){
      const r = src.rawg, mine = yearsOf(g);
      if(r.year && mine.length && !mine.some(y=> Math.abs(y - +r.year) <= 1) && !ch.some(c=> c.id === 'year')){
        ch.push({id:'year', label:'Anno', from: g.year, to: r.year + ' (RAWG ' + r.url + ')', patch:{year: r.year, ysort: +r.year}});
      }
      offerScore(1, r.mc, 'RAWG (Metacritic riportato da RAWG)', 'score3', 'Voto (RAWG)', 'Metacritic riportato da RAWG: numero di recensioni non verificabile');
      const cur = (g.enrich && g.enrich.similarTo) || [];
      if(r.similar && r.similar.length >= 3 && cur.join('|') !== r.similar.join('|')){
        ch.push({id:'similar', label:'Giochi affini (consigliati da RAWG)', from: cur.join(', ') || '—', to: r.similar.join(', '), patch:{enrich:{similarTo: r.similar.slice(0, 5)}}});
      }
    }
    return ch;
  }
  window.__factChanges = factChanges;                                    // per i test automatici
  function parseJson(t){
    const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if(a < 0 || b < a) return null;
    try{ return JSON.parse(s.slice(a, b + 1)); }catch(e){ return null; }
  }
  async function textChanges(g, src, silent){
    const hasSrc = !!((src.wiki && src.wiki.text) || (src.rawg && src.rawg.desc) || (src.steam && src.steam.desc));
    if(!llmAvailable() || !hasSrc) return {changes:[], note: !hasSrc ? 'Nessuna pagina Wikipedia o RAWG trovata: testi non riscritti.' : 'Nessun motore AI configurato: testi non riscritti.'};
    const prompt = todayLine() + `Aggiorna la scheda del videogioco "${g.name}" (${g.year}, ${g.plat}) usando SOLO le fonti qui sotto. Se una informazione non è nelle fonti scrivi null: non inventare nulla. Niente espressioni come "recente" o "uscito da poco": usa gli anni.
Rispondi SOLO con un oggetto JSON valido con questi campi (in italiano): story (trama ricca e dettagliata: 5-8 frasi, circa 600-900 caratteri: ambientazione, protagonisti, premessa e svolgimento generale, senza spoiler pesanti sul finale), pros (3-4 punti di forza concreti, emersi dalla critica), cons (2-3 difetti concreti, emersi dalla critica), agingNote (1-2 frasi su come regge oggi, con gli anni), whyLikeIt (una frase impersonale che spiega cosa rende appagante il gioco; niente riferimenti a persone tipo «gli piacerà»).
${src.wiki && src.wiki.text ? `FONTE — Wikipedia (${src.wiki.title}):\n${digest(src.wiki.text)}` : ''}${src.rawg && src.rawg.desc ? `\nFONTE — RAWG (${src.rawg.name}${src.rawg.playtime ? ', durata media giocata dagli utenti ' + src.rawg.playtime + ' h' : ''}):\n${src.rawg.desc.slice(0, 3500)}` : ''}${src.steam && src.steam.desc ? `\nFONTE — Steam (descrizione ufficiale, testo promozionale: usala solo per confermare i fatti, la priorità è Wikipedia):\n${src.steam.desc.slice(0, 2500)}` : ''}`;
    const r = await askLLM(prompt, {}, {fast:true, silent: !!silent, label:'Riscrivo la scheda dalle fonti…'});
    const j = parseJson(r && r.text);
    if(!j) return {changes:[], note:'L\'AI non ha restituito un risultato leggibile: riprova.'};
    const arr = a=> Array.isArray(a) ? a.map(x=> String(x).trim()).filter(Boolean).slice(0, 5) : [];
    const en = {}; const ch = [];
    const pros = arr(j.pros), cons = arr(j.cons);
    if(pros.length && cons.length){ en.pros = pros; en.cons = cons; ch.push({id:'proscons', label:'Pro e Contro', from: ((g.enrich && g.enrich.pros) || (g.proscons && g.proscons.pros) || []).slice(0,2).join(' · ') || '—', to: pros.slice(0,2).join(' · ') + ' … (riscritti dalle fonti)', patch:{enrich:{pros, cons}}}); }
    if(typeof j.agingNote === 'string' && j.agingNote.length > 20){ ch.push({id:'aging', label:'Come regge oggi', from: ((g.enrich && g.enrich.agingNote) || '—'), to: j.agingNote, patch:{enrich:{agingNote: j.agingNote}}}); }
    if(typeof j.whyLikeIt === 'string' && j.whyLikeIt.length > 15){ ch.push({id:'why', label:'Perché potrebbe piacerti', from: ((g.enrich && g.enrich.whyLikeIt) || '—'), to: j.whyLikeIt, patch:{enrich:{whyLikeIt: j.whyLikeIt}}}); }
    if(typeof j.story === 'string' && j.story.length > 200){ ch.push({id:'story', label:'Trama', from: (g.story || '—'), to: j.story, patch:{story: j.story}}); }
    return {changes: ch, note: ''};
  }

  // ricerca approfondita (Gemini con ricerca Google): ore, "a colpo d'occhio", gameplay, lingua, edizioni. Ogni dato deve avere una fonte, altrimenti null.
  async function deepChanges(g, silent){
    if(!geminiKey()) return {changes:[], sources:[], note:'Ricerca approfondita (ore, difficoltà, lingua, gameplay) non fatta: serve la chiave Gemini.'};
    const Y = new Date().getFullYear();
    const symTxt = (g.enrich && (g.enrich.storyTag || g.enrich.dopamine)) ? `\nSIMBOLI: questo gioco ha già ${g.enrich.storyTag ? 'il simbolo storia «' + g.enrich.storyTag + '»' + (g.enrich.storyTagNote ? ' (' + g.enrich.storyTagNote + ')' : '') : ''}${g.enrich.storyTag && g.enrich.dopamine ? ' e ' : ''}${g.enrich.dopamine ? 'il simbolo dopamina (loop di ricompense)' : ''}. Giudica con onestà, cercando sulle fonti, se è DAVVERO distintivo: storia affascinante o memorabile, oppure meccanica unica e travolgente che quasi nessun altro gioco ha (il voto NON conta). Aggiungi al JSON i campi storyTagUnique (true/false/null se non c'è il simbolo), dopamineUnique (true/false/null) e symbolWhy (una frase che spiega perché sì o perché no).` : '';
    const prompt = todayLine() + symTxt + `Fai le ricerche includendo gli anni ${Y} e ${Y - 1} nelle query. Per le informazioni che cambiano nel tempo (piattaforme, edizioni, lingue, prezzi, abbonamenti, patch, ore dopo gli aggiornamenti) usa SOLO pagine datate ${Y - 2} o dopo e ignora quelle senza data o più vecchie; per le informazioni storiche (trama, voto alla prima uscita) va bene qualsiasi anno. Se per un dato non trovi fonti aggiornate scrivi null. Cerca online informazioni ATTENDIBILI sul videogioco "${g.name}" (${g.year}, ${g.plat}) consultando fonti come Metacritic, OpenCritic, HowLongToBeat, Wikipedia, PCGamingWiki, Steam (lingue: interfaccia, audio, sottotitoli), PSXDataCenter (edizioni PAL dei giochi PS1/PS2), RPGamer, RPGFan, gli store ufficiali (Steam, PlayStation Store, Nintendo eShop) e i siti dei publisher. Compila SOLO ciò che trovi in fonti affidabili; se non lo trovi scrivi null, NON stimare e NON inventare.
Rispondi SOLO con un oggetto JSON valido con questi campi: hoursMain (ore indicative per finire la storia principale o la run/campagna principale; nei giochi senza trama vera (roguelite, tattici, puzzle, arcade) indica la durata di UNA run o campagna (1-3h), MAI le ore per sbloccare tutto (quelle vanno in hoursCompletionist), numero), hoursCompletionist (ore completista, numero), difficulty (1-5), grind (1-5: quanta ripetizione/farming serve; conta anche sblocchi di contenuti, squadre, armi e meta-progressione dei roguelite: mai lasciarlo vuoto se ci sono sblocchi; 1 = nessuno, 3 = qualche sblocco, 5 = molto grinding), storyWeight (1-5: 1 = trama assente o minima, 5 = la storia è il cuore del gioco; deve essere COERENTE con le ore storia), pace ("L" lento, "M" medio, "V" veloce), italian ("D" testi E doppiaggio italiani ufficiali, "S" solo testi/sottotitoli italiani ufficiali, "F" solo fan-translation, "N" nessun italiano ufficiale, oppure null se NON trovi una fonte esplicita: NON rispondere "N" per mancanza di informazioni; per i giochi usciti prima del 2010 controlla l'edizione europea/italiana (PAL) originale del disco o della cartuccia e non solo gli store attuali, perché molti giochi PS1/PS2/Wii/DS uscirono localizzati in italiano anche se la versione americana era solo in inglese), language (una frase in italiano su lingue di testi E doppiaggio nell'edizione italiana/europea e nelle riedizioni, citando ciò che dice la fonte; null se non lo trovi), remaster (una frase in italiano su edizioni, remaster o remake esistenti), gameplayScore (0-10, in base alla critica), gameplayNote (una frase in italiano sul gameplay), fitIf (completa la frase «Fa per te se…» in SECONDA PERSONA singolare, es. "cerchi un tattico a turni senza grinding": inizia con un verbo alla seconda persona come ami, cerchi, vuoi, preferisci; NON ripetere «Fa per te se» e MAI la terza persona tipo «gli piacerà»), avoidIf (completa la frase «Lascia stare se…» in SECONDA PERSONA singolare, es. "cerchi una trama profonda": inizia con un verbo alla seconda persona come cerchi, vuoi, odi, non sopporti; NON ripetere «Lascia stare se» e MAI la terza persona), criticScore (Metascore o OpenCritic, numero 0-100, oppure null), graphicsToday (1-2 frasi in italiano su come regge oggi la grafica e la parte tecnica rispetto agli standard del ${Y}, senza dire "recente"), asOf (l'anno della fonte PIÙ VECCHIA che hai usato per lingua, edizioni, piattaforme e ore).`;
    let r = await askLLM(prompt, {}, {search:true, forceGemini:true, silent: !!silent, label:'Ricerca approfondita sul web…'});
    let j = parseJson(r && r.text);
    // non mi fermo al primo tentativo: altre fonti (Steam, IGDB, RAWG, MobyGames, GameFAQs, HowLongToBeat, Reddit)
    if(!j || !Object.values(j).some(v=> v != null)){
      const alt = prompt + `\nIMPORTANTE: il primo tentativo non ha dato risultati. Ora cerca ALTROVE: pagine Steam, IGDB, RAWG, MobyGames, GameFAQs, HowLongToBeat, Fandom wiki, Reddit e riviste specializzate, anche con titoli alternativi o nomi giapponesi/europei. Prova varianti del titolo (senza sottotitolo, con l'edizione remaster). Restituisci comunque il JSON compilato con ciò che trovi.`;
      try{ r = await askLLM(alt, {}, {search:true, forceGemini:true, silent: !!silent, label:'Frugu Frugu prova altre fonti…'}); j = parseJson(r && r.text) || j; }catch(e){}
    }
    const srcs = ((r && r.sources) || []).filter(s=> s.title).slice(0, 6);
    if(!j) return {changes:[], sources: srcs, note:'La ricerca approfondita non ha dato un risultato leggibile.'};
    const num = (x, lo, hi)=>{ const n = typeof x === 'number' ? x : parseFloat(x); return (isFinite(n) && n >= lo && n <= hi) ? n : null; };
    const str = x=> (typeof x === 'string' && x.trim().length > 8 && !/^null$/i.test(x.trim())) ? x.trim() : null;
    const e = g.enrich || {}, l = g.label || {}, ch = [];
    const asOf = num(j.asOf, 1990, Y + 1); const stale = !!(asOf && asOf < Y - 2); const sfx = stale ? ` ⏳ fonte del ${asOf}` : '';
    const hm = num(j.hoursMain, 1, 400), hc = num(j.hoursCompletionist, 1, 1500);
    const sw0 = num(j.storyWeight, 1, 5) || l.s; const incoh = !labelCoherent({s: sw0, h: hm}, g.tags);
    if(hm && hm !== (e.hoursMain || l.h)){ ch.push({id:'hours', label:'Ore di gioco' + (incoh ? ' ⚠️ incoerenti col peso storia' : ''), warn: incoh, from: `${e.hoursMain || l.h || '—'}h storia · ${e.hoursCompletionist || '—'}h completista`, to: `${hm}h storia · ${hc || e.hoursCompletionist || '—'}h completista` + sfx, off: stale, patch:{enrich:{hoursMain: hm, hoursCompletionist: hc || e.hoursCompletionist}, label:{h: hm}}}); }
    const d = num(j.difficulty, 1, 5), gr = num(j.grind, 1, 5), sw = num(j.storyWeight, 1, 5);
    const pace = ['L','M','V'].includes(j.pace) ? j.pace : null, it = ['D','S','F','N'].includes(j.italian) ? j.italian : null;
    const lab = {}; if(d) lab.d = Math.round(d); if(gr) lab.g = Math.round(gr); if(sw) lab.s = Math.round(sw); if(pace) lab.p = pace; if(it) lab.it = it;
    const fit = fixSecondPerson(str(j.fitIf)), avoid = fixSecondPerson(str(j.avoidIf)); if(fit) lab.ok = fit; if(avoid) lab.ko = avoid;
    const itDown = !!(lab.it === 'N' && ['D','S','F'].includes(l.it));   // l'AI dice "nessun italiano" ma il dato attuale dice il contrario: mai applicare in automatico
    const diff = Object.keys(lab).filter(k=> lab[k] !== l[k]);
    if(diff.length){ ch.push({id:'label', label:'A colpo d\'occhio' + (itDown ? ' ⚠️ lingua in contrasto' : ''), from: `difficoltà ${l.d || '—'}, grinding ${l.g || '—'}, storia ${l.s || '—'}, ritmo ${l.p || '—'}, italiano ${l.it || '—'}`, to: `difficoltà ${lab.d || l.d || '—'}, grinding ${lab.g || l.g || '—'}, storia ${lab.s || l.s || '—'}, ritmo ${lab.p || l.p || '—'}, italiano ${lab.it || l.it || '—'}` + (fit || avoid ? ' · consigli aggiornati' : '') + sfx, off: stale || itDown, warn: itDown, patch:{label: lab}}); }
    const gs = num(j.gameplayScore, 0, 10), gn = str(j.gameplayNote);
    if(gs != null || gn){ ch.push({id:'gameplay', label:'Gameplay', from: `${e.gameplayScore != null ? e.gameplayScore : '—'}/10 — ${(e.gameplayNote || '')}`, to: `${gs != null ? gs : (e.gameplayScore != null ? e.gameplayScore : '—')}/10 — ${(gn || e.gameplayNote || '')}`, patch:{enrich:Object.assign({}, gs != null ? {gameplayScore: gs} : {}, gn ? {gameplayNote: gn} : {})}}); }
    const lg = str(j.language), rm = str(j.remaster);
    const langDown = !!(lg && /nessun[oa]? .{0,25}italian|solo inglese|non .{0,20}in italiano/i.test(lg) && ['D','S','F'].includes(l.it));
    if(lg || rm){ ch.push({id:'lang', label:'Lingua ed edizioni' + (langDown ? ' ⚠️ in contrasto col dato attuale' : ''), from: ((e.language || '') + ' ' + (e.remaster || '')) || '—', to: [lg, rm].filter(Boolean).join(' ') + sfx, off: stale || langDown, patch:{enrich:Object.assign({}, lg ? {language: lg} : {}, rm ? {remaster: rm} : {})}}); }
    const gt = str(j.graphicsToday);
    if(gt){ ch.push({id:'aging', label:'Grafica e tecnica oggi', from: ((e.agingNote) || '—'), to: gt, patch:{enrich:{agingNote: gt}}}); }
    const cs = num(j.criticScore, 0, 100);
    if(cs && cs !== g.score){ ch.push({id:'score2', label:'Voto (ricerca AI, da confermare)', from: String(g.score), to: `${cs} (Metascore/OpenCritic secondo la ricerca)`, patch:{score: cs, tier: tierOf(cs), m:'V'}, off:true}); }
    // simboli 💕🤝✨💉 non distintivi: si propone di toglierli (mai attivo in automatico: decidi tu)
    if(g.enrich && g.enrich.storyTag && j.storyTagUnique === false){
      ch.push({id:'symStory', label:'Simbolo storia non distintivo', from: (STORY_TAG_INFO[g.enrich.storyTag] ? STORY_TAG_INFO[g.enrich.storyTag].icon + ' ' + STORY_TAG_INFO[g.enrich.storyTag].label : g.enrich.storyTag) + (g.enrich.storyTagNote ? ' — ' + g.enrich.storyTagNote : ''), to: 'Togliere il simbolo. ' + (str(j.symbolWhy) || 'La storia non ha nulla di davvero unico rispetto agli altri giochi.'), patch:{enrich:{storyTag:null, storyTagNote:null}}, off:true});
    }
    if(g.enrich && g.enrich.dopamine && j.dopamineUnique === false){
      ch.push({id:'symDopa', label:'Simbolo dopamina non distintivo', from: '💉 Loop di ricompense molto coinvolgente', to: 'Togliere il simbolo. ' + (str(j.symbolWhy) || 'Il loop di ricompense è nella media del genere.'), patch:{enrich:{dopamine:false}}, off:true});
    }
    return {changes: ch, sources: srcs, note:''};
  }
  function mergePatch(list){
    const p = {};
    list.forEach(c=>{ Object.keys(c.patch).forEach(k=>{ if(k === 'enrich') p.enrich = Object.assign(p.enrich || {}, c.patch.enrich); else if(k === 'label') p.label = Object.assign(p.label || {}, c.patch.label); else p[k] = c.patch[k]; }); });
    return p;
  }
  // gioco aggiunto: la copia in memoria cambia a ogni salvataggio; lavoro sempre sull'ultima, altrimenti un salvataggio «vecchio» (es. scheda aperta da prima, o il completamento AI) cancella quello nuovo
  const latest = g=> (g && g.custom && typeof GAMES !== 'undefined' && GAMES.find(x=> x.id === g.id)) || g;
  async function applyPatch(g, p, quiet){
    g = latest(g);
    // voto diventato verificato: la nota «è una stima» non è più vera, la correggo nei dati (vale anche per i giochi futuri)
    if((p.m === 'V' || g.m === 'V') && p.note == null && /voto e dettagli sono una stima/.test(g.note || '')) p = Object.assign({}, p, {note: g.note.replace(/ — (?:nessun Metacritic trovato: )?voto e dettagli sono una stima[^.]*\./, ' — voto verificato (Metacritic/OpenCritic).')});
    // cronologia (idea 29): salvo i valori di prima per poterli ripristinare
    try{
      if(window.rtHistory){
        const undo = {}, sh = v=> v == null ? '—' : Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v).slice(0, 120) : String(v);
        Object.keys(p).forEach(k=>{
          if(k === 'enrich' || k === 'label'){ undo[k] = {}; Object.keys(p[k] || {}).forEach(sk=>{ const old = g[k] ? g[k][sk] : undefined; undo[k][sk] = old === undefined ? null : old; rtHistory(g.id, (k === 'label' ? 'Etichetta · ' : 'Scheda · ') + sk, sh(old), sh(p[k][sk]), 'correzione approvata', null); }); }
          else { undo[k] = g[k] === undefined ? null : g[k]; if(k !== 'tier' && k !== 'ysort' && k !== 'm') rtHistory(g.id, k, sh(g[k]), sh(p[k]), 'correzione approvata', null); }
        });
        const h = JSON.parse(localStorage.getItem('jrpg_history') || '{}'); if(h[g.id] && h[g.id][0]) h[g.id][0].u = {patch: undo}; localStorage.setItem('jrpg_history', JSON.stringify(h));
      }
    }catch(e){}
    if(g.custom){
      const doc = {name: g.name, plat: g.plat, year: p.year || g.year, tier: p.tier || g.tier, score: p.score != null ? p.score : g.score, m: p.m || g.m || 'S', vs: p.vs || g.vs || undefined, tags: p.tags || g.tags, story: p.story != null ? p.story : g.story, note: p.note || g.note, label: Object.assign({}, g.label || {}, p.label || {}),
        pros: (p.enrich && p.enrich.pros) || (g.proscons && g.proscons.pros) || [], cons: (p.enrich && p.enrich.cons) || (g.proscons && g.proscons.cons) || [], enrich: cleanCustomEnrich(Object.assign({}, g.enrich || {}, p.enrich || {})) || undefined, addedAt: new Date().toISOString()};
      if(COVER_DB) await COVER_DB.doc('customGames/' + String(g.id)).set(doc);
    } else {
      const ov = loadOv(); const cur = ov[g.id] || {};
      ov[g.id] = Object.assign({}, cur, p, {enrich: Object.assign({}, cur.enrich || {}, p.enrich || {}), label: Object.assign({}, cur.label || {}, p.label || {})});
      saveOv(ov); applyGameOverrides();
    }
    try{ ensureGenreLists(p.tags || []); if(!quiet){ renderListBar(); render(); } }catch(e){}       // quiet = aggiornamento in background: non ridisegno la lista (niente sfarfallio)
  }

  window.rtApplyPatch = applyPatch;
  // estratto delle fonti aperte per la guida e il compagno: sezione «Gameplay» di Wikipedia (o introduzione) + descrizione RAWG
  window.rtSourceDigest = async function(g){
    const out = {names: [], text: ''};
    try{
      const src = await gather(g, true);
      if(src.wiki && src.wiki.text){
        const t = src.wiki.text, i = t.search(/\n\s*(Gameplay|Game ?play and (synopsis|story|plot)|Gameplay and plot|Combat|Battle system)[^\n]{0,30}\n/i);
        out.names.push('Wikipedia'); out.text += 'FONTE — Wikipedia (' + src.wiki.title + '):\n' + (i >= 0 ? t.slice(i, i + 3400) : digest(t).slice(0, 3400)) + '\n';
      }
      if(src.rawg && src.rawg.desc){ out.names.push('RAWG'); out.text += '\nFONTE — RAWG:\n' + String(src.rawg.desc).slice(0, 1800) + '\n'; }
    }catch(e){}
    return out;
  };
  // regola unica delle approvazioni automatiche: voto da fonte in ordine di priorità, lingua, giochi affini, e QUALSIASI dato che riempie un campo vuoto (non può peggiorare nulla)
  const isFill = c=>{ const f = String(c.from == null ? '' : c.from).trim(); return f === '' || /^—/.test(f); };
  function canAuto(c, g){
    if(!c || !c.patch || c.off || c.warn || c.id === 'score2') return false;
    if(c.patch.score != null && Math.abs(c.patch.score - g.score) > 15) return false;              // scarto enorme: probabile gioco sbagliato, chiedo
    if(/^(method|vsrc|score\d?|itsrc|itdub|similar|tagsync)$/.test(c.id)) return true;
    return isFill(c) && /^(story|proscons|aging|why|hours|gameplay|lang|label)$/.test(c.id);
  }
  // le proposte «sicure» (voto da fonte in ordine di priorità, lingua da Steam/PCGamingWiki/it.wikipedia, giochi affini) si applicano da sole, anche quelle rimaste in coda: niente scelte inutili
  async function autoApproveQueue(){
    const a = auLoad(); let n = 0;
    for(const id of Object.keys(a)){
      const rec = a[id]; if(!rec || !rec.ch || !rec.ch.length) continue;
      const g = GAMES.find(x=> String(x.id) === String(id)); if(!g || g.custom) continue;
      const ok = rec.ch.filter(c=> canAuto(c, g));
      if(!ok.length) continue;
      try{ await applyPatch(g, mergePatch(ok), true); rec.ch = rec.ch.filter(c=> !ok.includes(c)); n++; }catch(e){}
      if(n % 10 === 0){ auSave(a); await new Promise(r=> setTimeout(r, 40)); }
    }
    if(n){ auSave(a); try{ window.dispatchEvent(new Event('audit-update')); }catch(e){} try{ auBadge(); }catch(e){} }
    return n;
  }
  window.autoApproveQueue = autoApproveQueue;
  setTimeout(()=>{ try{ autoApproveQueue(); }catch(e){} }, 25000);
  // ---- Mappa delle fonti: per ogni dato, in che ordine si cerca, e se ogni fonte funziona adesso ----
  const SRC_MAP = [
    ['Voto', 'Metacritic (Wikipedia → Steam → dati settimanali → CheapShark) → OpenCritic → RAWG → altrimenti Stima', ['wiki', 'steam', 'cheap', 'oc', 'rawg']],
    ['Anno di uscita', 'Wikidata → Steam → CheapShark → RAWG', ['wd', 'steam', 'cheap', 'rawg']],
    ['Generi', 'Wikidata + RAWG + Steam (si confermano a vicenda; i generi non confermati si tolgono)', ['wd', 'rawg', 'steam']],
    ['Lingua italiana', 'Steam → PCGamingWiki → it.wikipedia (solo prove positive)', ['steam', 'pcgw', 'itw']],
    ['Storia (senza spoiler)', 'Wikipedia → RAWG → Steam, riscritta da Gemini SOLO da questi testi', ['wiki', 'rawg', 'steam', 'gem']],
    ['Pro e contro · Come regge oggi · Gameplay · Perché piacerti', 'Gli stessi testi (Wikipedia → RAWG → Steam) riscritti da Gemini: emerge solo ciò che dicono le fonti', ['wiki', 'rawg', 'steam', 'gem']],
    ['A colpo d\'occhio (difficoltà, grinding, peso storia, ritmo, costo)', 'Giochi di base: dati curati a mano. Giochi aggiunti: Gemini con ricerca web (nessuna fonte fissa: è la parte meno verificabile)', ['gem']],
    ['Ore della storia', 'Giochi di base: dati curati; giochi aggiunti: Gemini / durata media RAWG. Link a HowLongToBeat nella scheda', ['rawg', 'gem']],
    ['Prezzo e sconto', 'Steam (dati settimanali) → CheapShark', ['steam', 'cheap']]
  ];
  async function probe(key){
    const t0 = Date.now(), ok = ()=> ({s: 'ok', ms: Date.now() - t0});
    try{
      const H = window.SearchHub;
      if(key === 'wiki'){ await wp({action: 'query', meta: 'siteinfo'}); return ok(); }
      if(key === 'wd'){ await fj('https://www.wikidata.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*'); return ok(); }
      if(key === 'itw'){ await fj('https://it.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*'); return ok(); }
      if(key === 'steam'){ const s = await viaProxy('https://store.steampowered.com/api/storesearch/?term=Bayonetta&cc=IT&l=english'); if(!(s && s.items)) throw new Error('risposta vuota'); return ok(); }
      if(key === 'pcgw'){ await pcgwInfo('Bayonetta'); return ok(); }
      if(key === 'cheap'){ const r = await H.json('https://www.cheapshark.com/api/1.0/stores', {timeout: 12000}); if(!Array.isArray(r)) throw new Error('risposta vuota'); return ok(); }
      if(key === 'rawg'){ if(!(H && H.rawg && H.rawg.has())) return {s: 'off', why: 'chiave non impostata'}; await H.rawg.ping(); return ok(); }
      if(key === 'oc'){ if(!(H && H.opencritic && H.opencritic.has())) return {s: 'off', why: 'chiave non impostata'}; await H.opencritic.ping(); return ok(); }
      if(key === 'gem'){ if(!(typeof geminiKey === 'function' && geminiKey())) return {s: 'off', why: 'chiave Gemini non impostata'}; await geminiGenerate('Rispondi solo con: ok', {}); return ok(); }
    }catch(e){ return {s: 'err', why: whyFail(e)}; }
    return {s: 'off', why: 'non controllabile'};
  }
  const SRC_NAMES = {wiki: 'Wikipedia', wd: 'Wikidata', itw: 'it.wikipedia', steam: 'Steam', pcgw: 'PCGamingWiki', cheap: 'CheapShark', rawg: 'RAWG', oc: 'OpenCritic', gem: 'Gemini'};
  window.openSourceMap = function(){
    let el = document.getElementById('srcMapBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'srcMapBackdrop'; el.className = 'dup-backdrop'; el.style.zIndex = 100900; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    const esc = t=> String(t == null ? '' : t).replace(/[&<>]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
    const keys = Object.keys(SRC_NAMES);
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🧭 Mappa delle fonti</b><button class="btn" data-ui-close>Chiudi</button></div>
      <div class="lp-sub">Per ogni dato: in che ordine cerco, e se ogni fonte funziona adesso.</div>
      <div class="lp-tools"><button class="btn primary" id="smRun">🔎 Verifica ora tutte le fonti</button></div>
      <div id="smState" class="dbg-rows">${keys.map(k=> `<div class="dbg-row" id="sm_${k}"><b>${SRC_NAMES[k]}</b> <span>non ancora verificata</span></div>`).join('')}</div>
      <div class="dbg-rows">${SRC_MAP.map(r=> `<div class="dbg-row"><b>${esc(r[0])}</b><br>${esc(r[1])}<br><span>${r[2].map(k=> '<span class="sm_ic_' + k + '">' + SRC_NAMES[k] + ' ·</span>').join(' ')}</span></div>`).join('')}</div></div>`;
    el.classList.add('show');
    el.querySelector('#smRun').addEventListener('click', async ()=>{
      const b = el.querySelector('#smRun'); b.disabled = true; b.textContent = 'Verifico…';
      await Promise.all(keys.map(async k=>{
        const row = el.querySelector('#sm_' + k); row.querySelector('span').textContent = '… provo'; const r = await probe(k);
        row.querySelector('span').textContent = r.s === 'ok' ? '✅ funziona (' + r.ms + ' ms)' : r.s === 'off' ? '➖ ' + r.why : '⚠️ ' + r.why;
        el.querySelectorAll('.sm_ic_' + k).forEach(n=>{ n.textContent = (r.s === 'ok' ? '✅ ' : r.s === 'off' ? '➖ ' : '⚠️ ') + SRC_NAMES[k] + ' ·'; });
      }));
      b.disabled = false; b.textContent = '🔎 Verifica di nuovo';
    });
  };
  // voto reale di un titolo (per la ricerca di nuovi giochi): Metacritic da Wikipedia → Metacritic da RAWG → OpenCritic. null = nessuna fonte lo conferma
  window.rtScoreCheck = async function(c){
    const src = await gather({name: c.name, plat: c.plat || '', year: c.year || '', tags: [], custom: true}, true);
    const base = {st: src.st};
    if(src.wiki && src.wiki.mc) return Object.assign(base, {score: src.wiki.mc, vs: 'Metacritic (da Wikipedia)'});
    if(src.facts && src.facts.c && src.facts.c.mc) return Object.assign(base, {score: src.facts.c.mc, vs: 'Metacritic (da CheapShark)'});
    if(src.oc && src.oc.score) return Object.assign(base, {score: src.oc.score, vs: 'OpenCritic (nessun Metacritic trovato)'});
    if(src.rawg && src.rawg.mc) return Object.assign(base, {score: src.rawg.mc, vs: 'RAWG (Metacritic riportato da RAWG)'});
    return base;
  };
  // ----- interfaccia -----
  function panel(){
    let el = document.getElementById('updInfoBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'updInfoBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    return el;
  }
  window.openUpdateInfo = async function(g){
    if(!g) return;
    const el = panel();
    const shell = body=> `<div class="lp-card"><div class="lp-head"><b>🔄 Aggiorna info — ${escHtml(g.name)}</b><button class="btn" data-ui-close>Chiudi</button></div>${body}</div>`;
    const prev = loadCk()[g.id];
    el.innerHTML = shell('<div class="lp-sub" id="uiStatus">Cerco su Wikipedia e Wikidata…' + (prev ? ' (ultimo controllo: ' + fmtDate(prev) + ')' : '') + '</div>');
    el.classList.add('show');
    const status = t=>{ const s = el.querySelector('#uiStatus'); if(s) s.textContent = t; };
    let src;
    try{ src = await gather(g); }catch(e){ src = {wiki:null, wd:null, errors:2}; }
    const openFail = !src.wiki && !src.wd && !src.rawg;                       // nessuna fonte aperta ha risposto: non mi arrendo, passo alla ricerca web (Gemini) e alle altre fonti
    if(openFail && !geminiKey() && !src.steam && !src.pcgw && !src.itw){ el.innerHTML = shell('<div class="lp-sub">🦝 Frugu Frugu ha guardato in tutti i bidoni aperti (Wikipedia, Wikidata, it.wikipedia, Steam, PCGamingWiki) e non ha trovato questo titolo. Con una chiave Gemini (⚙️ in Chiedi a Claude) frugherei anche sul web: aggiungila e riprova.</div>'); return; }
    let changes = factChanges(g, src), note = '';
    if(src.steamFailed || src.pcgwFailed) note = 'Non raggiungibili ora: ' + [src.steamFailed && 'Steam', src.pcgwFailed && 'PCGamingWiki'].filter(Boolean).join(', ') + ' (le altre fonti sì).';
    status(openFail ? 'Frugu Frugu: le fonti aperte sono vuote, passo al bidone del web…' : 'Frugu Frugu ha trovato le fonti. Riscrivo trama e pro/contro…');
    try{ const t = await textChanges(g, src); changes = changes.concat(t.changes); note = (note ? note + ' ' : '') + (t.note || ''); }catch(e){ note = 'Testi non riscritti: ' + llmErrorText(e); }
    status('Ricerca approfondita di ore, gameplay, lingua ed edizioni…');
    let deepSrc = [];
    try{ const d = await deepChanges(g); if(d.changes.some(c=> c.id === 'aging')) changes = changes.filter(c=> c.id !== 'aging'); changes = changes.concat(d.changes); deepSrc = d.sources; if(d.note) note += (note ? ' ' : '') + d.note; }catch(e){ note += (note ? ' ' : '') + 'Ricerca approfondita non riuscita: ' + llmErrorText(e); }
    const sources = [src.rawg && `<a href="${src.rawg.url}" target="_blank" rel="noopener">RAWG</a>`, src.itw && `<a href="${src.itw.url}" target="_blank" rel="noopener">it.wikipedia</a>`, src.steam && `<a href="${src.steam.url}" target="_blank" rel="noopener">Steam</a>`, src.pcgw && `<a href="${src.pcgw.url}" target="_blank" rel="noopener">PCGamingWiki</a>`, src.wiki && `<a href="${src.wiki.url}" target="_blank" rel="noopener">Wikipedia</a>`, src.wd && src.wd.qid && `<a href="https://www.wikidata.org/wiki/${src.wd.qid}" target="_blank" rel="noopener">Wikidata</a>`].concat(deepSrc.map(s=> `<a href="${escHtml(s.uri)}" target="_blank" rel="noopener">${escHtml(s.title)}</a>`)).filter(Boolean).join(' · ');
    if(!changes.length){ markChecked(g.id); el.innerHTML = shell(`<div class="lp-sub">✅ Nessuna correzione da proporre: i dati coincidono con le fonti (${sources || 'nessuna fonte'}).${note ? '<br>' + escHtml(note) : ''}</div>`); return; }
    el.innerHTML = shell(`<div class="lp-sub">Fonti: ${sources || 'nessuna'}. ${changes.length} ${changes.length === 1 ? 'modifica proposta' : 'modifiche proposte'}: scorri per vedere tutto e togli la spunta a ciò che non ti convince.${note ? '<br>' + escHtml(note) : ''}</div>
      <div class="au-rev">${changes.map((c,i)=> `<div class="au-chg"><label><h4><input type="checkbox" data-i="${i}" ${(c.off || c.warn) ? '' : 'checked'}> ${escHtml(c.label)}</h4></label>
        <div class="au-box au-before"><small>PRIMA (quello che c'è ora)</small>${escHtml(c.from || '—')}</div>
        <div class="au-box au-after"><small>DOPO (proposta)</small>${escHtml(c.to)}</div></div>`).join('')}
        <div class="au-actions"><button class="btn primary" id="uiApply">✅ Approva le modifiche spuntate</button><button class="btn" id="uiKeep">↩️ Tieni precedente</button><button class="btn" data-ui-close>⏭️ Decido dopo</button></div></div>`);
    el.querySelector('#uiKeep').addEventListener('click', ()=>{ markChecked(g.id); el.classList.remove('show'); showToast('Tenuti i dati precedenti', 2000); });
    el.querySelector('#uiApply').addEventListener('click', async ()=>{
      const chosen = [...el.querySelectorAll('input[data-i]:checked')].map(cb=> changes[+cb.dataset.i]);
      if(!chosen.length){ showToast('Spunta almeno una modifica, oppure scegli «Tieni precedente»', 2500); return; }
      await applyPatch(g, mergePatch(chosen)); markChecked(g.id);
      el.classList.remove('show'); showToast('✅ Scheda aggiornata', 3000);
      try{ openModal(GAMES.find(x=> x.id === g.id) || g); }catch(e){}
    });
  };
  document.addEventListener('click', e=>{ if(e.target && e.target.id === 'auditPendingBtn' && typeof currentModalGame !== 'undefined' && currentModalGame){ try{ document.getElementById('modalBackdrop').classList.remove('show'); }catch(x){} openAuditReview(currentModalGame.id); } });
  document.addEventListener('click', e=>{ const b = e.target && e.target.closest && e.target.closest('#updatePlusBtn'); if(b && typeof currentModalGame !== 'undefined' && currentModalGame){ b.disabled = true; updatePlusNow(currentModalGame); } });
  document.addEventListener('click', e=>{ if(e.target && e.target.id === 'updateInfoBtn' && typeof currentModalGame !== 'undefined' && currentModalGame) openUpdateInfo(currentModalGame); });

  // ----- giochi nuovi: controllo automatico di voto, generi e anno (senza AI) -----
  // i giochi aggiunti (anche 30 di fila con il ♥) vengono verificati UNO alla volta, con fonti leggere: niente raffiche che intasano Wikipedia e i ponti
  let vngQueue = Promise.resolve();
  window.verifyNewGameGenres = function(id, doc){
    vngQueue = vngQueue.then(()=> verifyNewOne(id, doc)).catch(()=>{}).then(()=> new Promise(r=> setTimeout(r, 1200)));
    return vngQueue;
  };
  async function verifyNewOne(id, doc){
    try{
      const g = GAMES.find(x=> x.id === id); if(!g) return;
      const src = await gather({name: doc.name}, true);
      const ch = factChanges(g, src).filter(c=> !c.off);   // in automatico solo le correzioni sicure
      if(!ch.length) return;
      await applyPatch(g, mergePatch(ch));
      showToast('🔎 Verificato su Wikipedia/Wikidata: ' + ch.map(c=> c.label).join(', ') + ' aggiornati', 5000);
    }catch(e){}
  };

  // ----- controllo passivo del database: un gioco alla volta, in silenzio, dall'apertura dell'app -----
  // Per ogni gioco: fonti aperte (Wikipedia, Wikidata, it.wikipedia) + Gemini (riscrittura dalle fonti e ricerca approfondita con fonti).
  // Non cambia MAI nulla da solo: le proposte vanno in ✨ → Controllo dati, dove vedi prima/dopo e dai tu l'ok (e puoi annullare).
  const AU = 'jrpg_audit', AU_SKIP = 'jrpg_audit_skip', AU_ON = 'jrpg_autoaudit', AU_CAP = 'jrpg_audit_cap', AU_DAY = 'jrpg_audit_day', AU_UNDO = 'jrpg_audit_undo', AU_DAYS = 90;
  const auLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(AU) || '{}') || {}; }catch(e){ return {}; } };
  const auSave = o=>{ try{ localStorage.setItem(AU, JSON.stringify(o)); }catch(e){} };
  const skLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(AU_SKIP) || '{}') || {}; }catch(e){ return {}; } };
  const auKey = (id, c)=> id + '|' + c.id + '|' + String(c.to).slice(0, 60);
  const auTurbo = ()=> localStorage.getItem('jrpg_audit_turbo') === '1';
  const auCap = ()=> auTurbo() ? 800 : (parseInt(localStorage.getItem(AU_CAP), 10) || 200);
  const auBase = ()=> auTurbo() ? 12000 : 40000;
  const today = ()=> new Date().toISOString().slice(0, 10);
  const dayLoad = ()=>{ try{ const d = JSON.parse(localStorage.getItem(AU_DAY) || '{}'); return d.d === today() ? d : {d: today(), n: 0}; }catch(e){ return {d: today(), n: 0}; } };
  const useAI = ()=>{ try{ return !!geminiKey(); }catch(e){ return false; } };
  window.auditOn = ()=> localStorage.getItem(AU_ON) !== 'off';
  window.auditSetOn = on=>{ try{ localStorage.setItem(AU_ON, on ? 'on' : 'off'); }catch(e){} if(on) auSchedule(3000); };
  window.auditStats = function(){
    const a = auLoad(), ids = GAMES.map(g=> g.id), done = ids.filter(id=> a[id]).length;
    const props = ids.filter(id=> a[id] && a[id].ch && a[id].ch.length).length;
    return {done, total: ids.length, props, today: dayLoad().n, cap: auCap()};
  };
  let auDelay = auBase(), auTimer = 0, auBusy = false, auPause = '';
  function auNext(){
    const a = auLoad(), now = Date.now(), lim = AU_DAYS * 864e5, ai = useAI();
    let best = null, bt = Infinity;
    GAMES.forEach(g=>{ const r = a[g.id]; const t = r ? new Date(r.t).getTime() : 0;
      if(r && (r.deep || !ai)) return;          // controllato: non lo ricontrollo mai più (solo «Ricomincia» o «Aggiorna info» nella scheda)          // già controllato a fondo (o senza AI disponibile: non insisto)
      if(t < bt){ bt = t; best = g; } });
    return best;
  }
  function auSchedule(ms){ clearTimeout(auTimer); auTimer = setTimeout(auStep, ms == null ? auDelay : ms); }
  async function auStep(){
    if(!auditOn() || auBusy) return;
    if(typeof detailsReady === 'function' && !detailsReady()) return auSchedule(1500);   // aspetta che i dettagli dei giochi siano caricati (altrimenti confronterebbe con dati vuoti)
    const calm = document.visibilityState === 'visible' && navigator.onLine !== false && !(navigator.connection && navigator.connection.saveData) && !document.querySelector('.modal-backdrop.show, .dup-backdrop.show, .rt-loader.show');
    if(!calm){ return auSchedule(30000); }
    const ai = useAI(), day = dayLoad();
    if(ai && day.n >= auCap()){ auPause = 'Limite giornaliero raggiunto (' + day.n + ' giochi): riprendo domani.'; return auSchedule(30 * 60e3); }
    auPause = '';
    const g = auNext(); if(!g) return auSchedule(6 * 3600e3);
    auBusy = true;
    try{
      const [wiki, wd, itw, rawg, cheap, oc] = await Promise.allSettled([wikiPageTree(g.name), wikidataGenreCodes(g.name), itWikiLang(g.name), rawgInfoFor(g), SearchHub.factsFor(g) ? Promise.resolve(null) : SearchHub.cheapFacts(g.name), ocInfoFor(g)]);
      const ok = x=> x.status === 'fulfilled' ? x.value : null;
      const src = {wiki: ok(wiki), wd: ok(wd), itw: ok(itw), rawg: ok(rawg), oc: ok(oc), facts: SearchHub.factsFor(g) || (ok(cheap) ? {c: ok(cheap)} : null)};
      if(wiki.status === 'rejected' && wd.status === 'rejected' && !useAI()) throw new Error('fonti');   // con Gemini si va avanti lo stesso: le fonti aperte sono solo un di più
      let ch = factChanges(g, src), srcs = [], deep = false;
      if(ai){
        // se l'AI fallisce (limite di richieste, rete) NON segno il gioco come controllato: riproverò più tardi
        const t = await textChanges(g, src, true).catch(e=>{ throw e; });
        const d = await deepChanges(g, true);
        if(d.changes.some(c=> c.id === 'aging')) t.changes = t.changes.filter(c=> c.id !== 'aging');
        ch = ch.concat(t.changes, d.changes); srcs = (d.sources || []).map(x=>({title: x.title, uri: x.uri})); deep = true;
        if(t.note && /leggibile/.test(t.note) && d.note && /leggibile/.test(d.note)) throw new Error('risposta');
        day.n++; try{ localStorage.setItem(AU_DAY, JSON.stringify(day)); }catch(e){}
      }
      auDelay = ai ? auBase() : 8000;
      const sk = skLoad();
      // le proposte sicure si applicano da sole; in coda restano solo quelle davvero dubbie
      const autoL = ch.filter(c=> canAuto(c, g) && !sk[auKey(g.id, c)]);
      if(autoL.length){ try{ await applyPatch(g, mergePatch(autoL), true); }catch(e){} ch = ch.filter(c=> !autoL.includes(c)); }
      const keep = ch.filter(c=> c.patch && !sk[auKey(g.id, c)]).map(c=>({id: c.id, label: c.label, from: c.from, to: c.to, patch: c.patch, off: !!c.off, warn: !!c.warn}));
      const a = auLoad(); a[g.id] = {t: new Date().toISOString(), ch: keep, deep, src: srcs.slice(0, 5)}; auSave(a);
      if(keep.length){ try{ window.dispatchEvent(new Event('audit-update')); }catch(e){} }
    }catch(e){
      auDelay = Math.min(auDelay * 2, 30 * 60e3);
      auPause = 'Fonti o AI momentaneamente non disponibili: riprovo tra ' + Math.round(auDelay / 60000 * 10) / 10 + ' min.';
    }
    auBusy = false; auSchedule();
  }
  const fmtD = iso=>{ try{ return new Date(iso).toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit'}); }catch(e){ return ''; } };
  window.openAuditPanel = function(tab){
    tab = tab || 'todo';
    const el = panel(), a = auLoad(), st = auditStats();
    const todo = GAMES.filter(g=> a[g.id] && a[g.id].ch && a[g.id].ch.length);
    const clean = GAMES.filter(g=> a[g.id] && !(a[g.id].ch && a[g.id].ch.length)).sort((x, y)=> a[y.id].t.localeCompare(a[x.id].t));
    let undo = {}; try{ undo = JSON.parse(localStorage.getItem(AU_UNDO) || '{}') || {}; }catch(e){}
    const shell = body=> `<div class="lp-card"><div class="lp-head"><b>🔎 Controllo dati</b><button class="btn" data-ui-close>Chiudi</button></div>${body}</div>`;
    const head = `<div class="lp-sub">Controllati <b>${st.done}</b> giochi su ${st.total} · oggi ${st.today}/${st.cap}${useAI() ? '' : ' · <b>senza chiave Gemini controllo solo voto, anno, generi e lingua</b>'}. ${auPause ? '<br>⏸️ ' + escHtml(auPause) : ''}<br><b>Non cambia nulla senza il tuo ok.</b> Le proposte vengono da fonti aperte e da Gemini con ricerca web; controllale prima di applicarle.</div>
      <label class="ask-toggle"><input type="checkbox" id="fpOn" ${updatePlusOn() ? 'checked' : ''}> ${giIcon('upplus')} Update+ all\'avvio: aggiorna tutte le info e la locandina di ogni gioco, una volta sola <small>(${updatePlusStats().done}/${updatePlusStats().total} fatti)</small></label>
      <label class="ask-toggle"><input type="checkbox" id="auOn" ${auditOn() ? 'checked' : ''}> Controlla da solo in background</label>
      <div class="lp-tools"><button class="btn${tab==='todo'?' primary':''}" data-tab="todo">📝 Da approvare (${todo.length})</button><button class="btn${tab==='clean'?' primary':''}" data-tab="clean">✅ Controllati (${clean.length})</button><button class="btn${tab==='done'?' primary':''}" data-tab="done">↩️ Applicate (${Object.keys(undo).length})</button><button class="btn${auTurbo()?' primary':''}" id="auTurbo" title="Un gioco ogni ~12 secondi, fino a 800 al giorno (usa più quota Gemini)">⚡ Turbo ${auTurbo()?'acceso':'spento'}</button><button class="btn" id="auReset" title="Cancella lo storico dei controlli e ricomincia">↻ Ricomincia</button></div>`;
    let body;
    if(tab === 'todo') body = todo.length ? `<div class="lp-tools"><button class="btn primary" id="auStart">▶ Rivedi una per una</button></div><div class="gc-rows">${todo.map(g=> `<div class="gc-row"><span><b>${escHtml(g.name)}</b> <small>${a[g.id].ch.length} ${a[g.id].ch.length === 1 ? 'modifica' : 'modifiche'}: ${a[g.id].ch.map(c=> escHtml(c.label.replace(/ ⚠️.*$/, ''))).join(', ')}</small> <button class="btn" data-rv="${g.id}">Rivedi</button></span></div>`).join('')}</div>` : '<div class="lp-sub">Niente da approvare per ora ✅</div>';
    else if(tab === 'done') body = Object.keys(undo).length ? `<div class="gc-rows">${Object.keys(undo).map(id=>{ const g = GAMES.find(x=> x.id == id); return g ? `<div class="gc-row"><span><b>${escHtml(g.name)}</b> <small>applicato il ${fmtD(undo[id].t)}</small> <button class="btn" data-un="${id}">↩️ Annulla</button></span></div>` : ''; }).join('')}</div>` : '<div class="lp-sub">Nessuna modifica applicata da qui.</div>';
    else body = clean.length ? `<div class="gc-rows">${clean.slice(0, 150).map(g=> `<div class="gc-row"><span>✅ <b>${escHtml(g.name)}</b> <small>${fmtD(a[g.id].t)}${a[g.id].deep ? ' · fonti + AI' : ' · solo fonti aperte'}</small></span></div>`).join('')}</div>${clean.length > 150 ? '<div class="lp-sub">…e altri ' + (clean.length - 150) + '</div>' : ''}` : '<div class="lp-sub">Nessun gioco controllato senza modifiche, per ora.</div>';
    el.innerHTML = shell(head + body);
    el.classList.add('show');
    el.querySelector('#auOn').addEventListener('change', e=> auditSetOn(e.target.checked));
    el.querySelector('#fpOn').addEventListener('change', e=> updatePlusSetOn(e.target.checked));
    el.querySelectorAll('[data-tab]').forEach(b=> b.addEventListener('click', ()=> openAuditPanel(b.dataset.tab)));
    el.querySelector('#auTurbo').addEventListener('click', ()=>{ try{ localStorage.setItem('jrpg_audit_turbo', auTurbo() ? '0' : '1'); }catch(e){} auDelay = auBase(); if(auditOn()) auSchedule(2000); openAuditPanel(tab); });
    el.querySelector('#auReset').addEventListener('click', ()=>{ if(confirm('Cancellare lo storico dei controlli e ricominciare da capo? (le correzioni già applicate restano)')){ auSave({}); openAuditPanel(tab); } });
    const st0 = el.querySelector('#auStart'); if(st0) st0.addEventListener('click', ()=> openAuditReview());
    el.querySelectorAll('[data-rv]').forEach(b=> b.addEventListener('click', ()=> openAuditReview(b.dataset.rv)));
    el.querySelectorAll('[data-un]').forEach(b=> b.addEventListener('click', ()=>{ if(confirm('Annullare la modifica e tornare ai dati di prima?')) auditUndo(b.dataset.un); }));
  };
  // badge fisso «modifiche da approvare» (sempre visibile finché ce ne sono, mai coperto)
  function auBadge(){
    let el = document.getElementById('auBadge');
    if(!el){ el = document.createElement('button'); el.id = 'auBadge'; el.type = 'button'; el.className = 'au-badge'; document.body.appendChild(el); el.addEventListener('click', ()=> openAuditPanel('todo')); }
    const n = auditStats().props;
    el.innerHTML = '<b>' + n + '</b>'; el.title = el.ariaLabel = n + (n === 1 ? ' gioco con modifiche da approvare' : ' giochi con modifiche da approvare');
    el.classList.toggle('show', n > 0);
  }
  window.addEventListener('audit-update', auBadge);
  setTimeout(auBadge, 2500);
  // revisione: UNA scheda per gioco con tutte le modifiche, «PRIMA» e «DOPO» separati e testo intero; un solo gruppo di pulsanti
  window.openAuditReview = function(startId){
    const el = panel(); const later = new Set();
    const pick = ()=>{
      const a = auLoad(); const games = GAMES.filter(g=> a[g.id] && a[g.id].ch && a[g.id].ch.length && !later.has(g.id));
      if(!games.length) return null;
      const g = (startId != null && games.find(x=> x.id == startId)) || games[0];
      return {g, a, left: games.length};
    };
    const show = ()=>{
      const p = pick();
      if(!p){ el.classList.remove('show'); showToast('✅ Revisione finita', 2500); try{ auBadge(); }catch(e){} return; }
      startId = null;
      const {g, a} = p, rec = a[g.id];
      el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>📝 ${escHtml(g.name)}</b><button class="btn" data-ui-close>Chiudi</button></div>
        <div class="lp-sub">${rec.ch.length} ${rec.ch.length === 1 ? 'modifica proposta' : 'modifiche proposte'} · ${p.left} ${p.left === 1 ? 'gioco' : 'giochi'} da rivedere. Scorri per vedere tutto.</div>
        <div class="au-rev">${rec.ch.map((c, i)=>{ const warn = c.off || c.warn || /⚠️/.test(c.label + c.to); return `<div class="au-chg"><label><h4><input type="checkbox" data-i="${i}" ${warn ? '' : 'checked'}> ${escHtml(c.label)}</h4></label>${warn ? '<div class="lp-sub">⚠️ Fai attenzione: fonte datata, dato in contrasto o cambio di genere. Spuntala solo se sei sicuro.</div>' : ''}
          <div class="au-box au-before"><small>PRIMA (quello che c'è ora)</small>${escHtml(c.from || '—')}</div>
          <div class="au-box au-after"><small>DOPO (proposta)</small>${escHtml(c.to)}</div></div>`; }).join('')}
          ${(rec.src || []).length ? '<div class="lp-sub"><small>Fonti: ' + rec.src.map(x=> `<a href="${escHtml(x.uri || '#')}" target="_blank" rel="noopener">${escHtml(x.title)}</a>`).join(' · ') + '</small></div>' : ''}
          <div class="au-actions"><button class="btn primary" id="rvOk">✅ Approva le modifiche spuntate</button><button class="btn" id="rvNo">↩️ Tieni precedente</button><button class="btn" id="rvLater">⏭️ Decido dopo</button></div>
        </div></div>`;
      el.classList.add('show');
      el.querySelector('#rvOk').addEventListener('click', async ()=>{
        const idx = [...el.querySelectorAll('input[data-i]:checked')].map(x=> +x.dataset.i);
        if(!idx.length){ showToast('Spunta almeno una modifica, oppure scegli «Tieni precedente»', 2500); return; }
        const chosen = idx.map(i=> rec.ch[i]);
        try{ const u = JSON.parse(localStorage.getItem(AU_UNDO) || '{}'); if(!g.custom && !u[g.id]){ u[g.id] = {t: new Date().toISOString(), prev: loadOv()[g.id] || null}; localStorage.setItem(AU_UNDO, JSON.stringify(u)); } }catch(e){}
        await applyPatch(g, mergePatch(chosen));
        // le non spuntate restano tra le scartate: la tua scelta vale per tutto il gioco
        const sk = skLoad(); rec.ch.forEach((c, i)=>{ if(!idx.includes(i)) sk[auKey(g.id, c)] = 1; }); try{ localStorage.setItem(AU_SKIP, JSON.stringify(sk)); }catch(e){}
        const r = auLoad(); r[g.id].ch = []; auSave(r); showToast('✅ Approvato', 1200); auBadge(); show();
      });
      el.querySelector('#rvNo').addEventListener('click', ()=>{
        const sk = skLoad(); rec.ch.forEach(c=>{ sk[auKey(g.id, c)] = 1; }); try{ localStorage.setItem(AU_SKIP, JSON.stringify(sk)); }catch(e){}
        const r = auLoad(); r[g.id].ch = []; auSave(r); auBadge(); show();
      });
      el.querySelector('#rvLater').addEventListener('click', ()=>{ later.add(g.id); show(); });
    };
    show();
  };
  window.auditUndo = function(id){
    try{ const u = JSON.parse(localStorage.getItem(AU_UNDO) || '{}'); const e = u[id]; if(!e) return false;
      const ov = loadOv(); if(e.prev) ov[id] = e.prev; else delete ov[id]; saveOv(ov); delete u[id]; localStorage.setItem(AU_UNDO, JSON.stringify(u));
      location.reload(); return true; }catch(err){ return false; }
  };
  // parte subito dopo l'avvio (poche secondi, quando l'app è già disegnata)
  setTimeout(()=> auSchedule(4000), 3000);
  try{ applyGameOverrides(); renderListBar(); if(state.view === 'list') render(); }catch(e){}

  // ----- «Update+»: aggiornamento COMPLETO di un gioco da tutte le fonti, una volta sola (poi restano solo i prezzi) -----
  // All'avvio dell'app, con calma e in silenzio: prima i giochi con i dati meno attendibili (aggiunti da te, voti «stima»), poi gli altri; e subito dopo aver accettato un gioco col cuore.
  // Fonti nell'ordine di SearchHub.PRIORITY. Copertina mancante: la trova. Giochi aggiunti da te: applica le correzioni sicure; giochi di base: le proposte vanno in «Controllo dati» (le approvi tu).
  // Il simbolo dorato si prende solo se almeno 2 fonti hanno risposto: se i siti non rispondono riprova dopo 3 giorni, senza fingere.
  const FR = 'jrpg_fresh', FR_ON = 'jrpg_update_plus', FP_BUDGET = 40, FP_EPOCH = 3;      // FP_EPOCH: sale quando cambia la logica dei voti, così i giochi ancora «stima» si ricontrollano una volta
  const frLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(FR) || '{}') || {}; }catch(e){ return {}; } };
  const frSave = o=>{ try{ localStorage.setItem(FR, JSON.stringify(o)); }catch(e){} };
  window.updatePlusOn = ()=> localStorage.getItem(FR_ON) !== 'off';
  window.updatePlusSetOn = on=>{ try{ localStorage.setItem(FR_ON, on ? 'on' : 'off'); }catch(e){} if(on) fpKick(3000); };
  window.updatePlusStats = ()=>{ const f = frLoad(); const n = GAMES.filter(g=> f[g.id] && f[g.id].gold).length; return {done: n, total: GAMES.length}; };
  const FP_SRC = {wiki: 'Wikipedia', wd: 'Wikidata', itw: 'it.wikipedia', steam: 'Steam', pcgw: 'PCGamingWiki', rawg: 'RAWG', oc: 'OpenCritic', facts: 'Dati settimanali'};
  const fpQueue = [], fpMiss = {};
  window.updatePlusQueue = id=>{ if(!fpQueue.includes(id)) fpQueue.push(id); fpKick(6000); };
  function frManual(id){                                        // «Aggiorna info» a mano: simbolo viola
    const f = frLoad(); f[id] = {gold: 1, m: 1, t: new Date().toISOString(), src: (f[id] && f[id].src) || []}; frSave(f);
    try{ const g = GAMES.find(x=> x.id === id); g && refreshRowFresh(g); }catch(e){}
  }
  function fpNext(){
    while(fpQueue.length){
      const id = fpQueue[0], g = GAMES.find(x=> x.id === id);
      if(g) { fpQueue.shift(); return g; }
      fpMiss[id] = (fpMiss[id] || 0) + 1; if(fpMiss[id] > 8){ fpQueue.shift(); continue; } break;      // il gioco può non essere ancora comparso in libreria
    }
    const fr = frLoad(), now = Date.now(), vs0 = vsLoad();
    const weak = g=> g.custom ? 0 : (g.m !== 'V' ? 1 : (window.SearchHub && SearchHub.factsFor(g) ? 3 : 2));
    let best = null, bw = 9, bt = Infinity;
    GAMES.forEach(g=>{
      const f = fr[g.id], vsx = vs0[g.id], due = !!(vsx && vsx.r && now >= vsx.r);                 // due = un sito mi aveva bloccato: riprovo
      if(f && f.gold && !due && !((g.m !== 'V' || !g.vs) && (f.e || 0) < FP_EPOCH)) return;      // rifaccio anche i voti verificati senza fonte registrata (così ogni voto dice da dove viene)
      const t = f ? new Date(f.t).getTime() : 0; if(f && now - t < (due ? 20 * 3600e3 : 3 * 864e5)) return;
      const w = weak(g);
      if(w < bw || (w === bw && t < bt)){ best = g; bw = w; bt = t; }
    });
    return best;
  }
  let fpTextN = 0;                       // trame riscritte dall'AI in questa sessione (con limite, per non consumare le richieste gratuite)
  async function updatePlus(g, manual){
    g = latest(g);
    const src = await gather(g, false);
    const names = Object.keys(FP_SRC).filter(k=> src[k]).map(k=> FP_SRC[k]);
    let ch = factChanges(g, src);
    const vdiag = saveVoteDiag(g.id, src.st);
    saveVoteState(g.id, src.st);
    try{ (vdiag && vdiag.prob || []).forEach(p=> window.DebugLog && DebugLog.add && DebugLog.add({kind: 'note', src: 'Voto di ' + g.name, ok: false, note: p})); }catch(e){}
    // storia, pro/contro, «perché piacerti»: riscritti dall'AI SOLO dalle fonti (Wikipedia → RAWG → Steam), se c'è una chiave e la scheda è povera (o l'hai chiesto tu)
    try{
      const poor = g.custom || String(g.story || '').length < 300 || !((g.enrich && g.enrich.pros) || []).length;
      if(typeof llmAvailable === 'function' && llmAvailable() && (manual || (poor && fpTextN < 8))){ fpTextN++; const t = await textChanges(g, src, true); ch = ch.concat(t.changes.filter(c=> c.id !== 'aging')); if(t.changes.length) names.push('Testi riscritti dalle fonti'); }
    }catch(e){}
    let applied = 0, pending = 0, cover = false;
    if(g.custom){
      const safe = ch.filter(c=> !c.off && c.patch).map(c=> c.patch.tags ? Object.assign({}, c, {patch: Object.assign({}, c.patch, {tags: c.patch.tags.slice(0, 3)})}) : c);      // massimo 3 generi nei giochi aggiunti: più di 3 sono quasi sempre rumore delle fonti
      if(safe.length){ await applyPatch(g, mergePatch(safe), true); applied = safe.length; }
    } else {
      // il voto Metacritic (o OpenCritic) di un gioco ancora «stima» si applica da solo, anche sui giochi di base: è la fonte che rende un voto verificato
      const auto = ch.filter(c=> canAuto(c, g));
      if(auto.length){ try{ await applyPatch(g, mergePatch(auto), true); applied += auto.length; ch = ch.filter(c=> !auto.includes(c)); }catch(e){} }
      const sk = skLoad(), a = auLoad(), old = a[g.id];
      const keep = ch.filter(c=> c.patch && !sk[auKey(g.id, c)]).map(c=>({id: c.id, label: c.label, from: c.from, to: c.to, patch: c.patch, off: !!c.off, warn: !!c.warn}));
      const seen = new Set(((old && old.ch) || []).map(c=> auKey(g.id, c)));
      const merged = ((old && old.ch) || []).concat(keep.filter(c=> !seen.has(auKey(g.id, c))));
      if(merged.length){ a[g.id] = {t: new Date().toISOString(), ch: merged, deep: !!(old && old.deep), src: (old && old.src) || []}; auSave(a); pending = merged.length; try{ window.dispatchEvent(new Event('audit-update')); }catch(e){} }
    }
    try{ if(window.XCOVER && !XCOVER.has(g)){ const r = await XCOVER.find(g, {quick: true}); if(r){ await XCOVER.save(g, r.url); cover = true; } } }catch(e){}
    if(cover || (window.XCOVER && XCOVER.has(g))) names.push('Locandina');
    const fr = frLoad(), iso = new Date().toISOString();
    const okN = names.filter(n=> n !== 'Locandina').length;
    if(okN >= 1) fr[g.id] = {gold: 1, t: iso, src: names, ap: applied, pe: pending, cv: cover ? 1 : 0, e: FP_EPOCH};
    else fr[g.id] = {t: iso, tries: ((fr[g.id] || {}).tries || 0) + 1, src: names};
    frSave(fr);
    try{ window.DebugLog && DebugLog.add && DebugLog.add({kind: 'note', src: 'Update+', ok: okN >= 1, note: g.name + ': ' + (names.join(', ') || 'nessuna fonte ha risposto') + (applied ? ' · ' + applied + ' correzioni' : '') + (pending ? ' · ' + pending + ' da approvare' : '')}); }catch(e){}
    try{ if(applied || pending || cover || (window.XCOVER && false)){ /* i dati della riga sono cambiati */ } refreshRowFresh(g); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('update-plus', {detail: {id: g.id, ok: okN >= 1, names}})); }catch(e){}
    return {ok: okN >= 1, names, applied, pending, cover, vote: vdiag};
  }
  // «Update+» forzato dalla scheda: subito, con la barra di caricamento
  window.updatePlusNow = async function(g){
    g = latest(g);
    const P = window.Progress; try{ P && P.begin && P.begin('Update V+ di ' + g.name + '…'); }catch(e){}
    let r = null;
    try{ r = await updatePlus(g, true); }catch(e){}
    // scheda senza analisi («come regge oggi», gameplay): la completo adesso, così l'affidabilità non resta bloccata
    try{ if(g.custom && typeof runEnrich === 'function' && !(g.enrich && (g.enrich.eraScore != null || g.enrich.agingNote || g.enrich.gameplayNote))) await runEnrich([g.id], {force: true}); }catch(e){}
    try{ P && P.end && P.end(); }catch(e){}
    if(r && r.ok) showToast('Update V+ completato · fonti: ' + r.names.join(', ') + (r.pending ? ' · ' + r.pending + ' modifiche da approvare' : '') + (r.applied ? ' · ' + r.applied + ' correzioni applicate' : ''), 5500);
    else showToast('Nessuna fonte ha risposto adesso: riprova tra poco (controlla la connessione o il ponte personale)', 5000);
    try{ if(r && r.vote && r.vote.prob && r.vote.prob.length) setTimeout(()=> showToast('⚠️ Fonti del voto con problemi — ' + r.vote.prob.join(' · '), 9000), 5800); }catch(e){}
    try{ g = latest(g); if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id) openModal(g); }catch(e){}
    return r;
  };
  let fpTimer = 0, fpBusy = false, fpDone = 0;
  function fpKick(ms){ clearTimeout(fpTimer); fpTimer = setTimeout(fpStep, ms == null ? 4000 : ms); }
  async function fpStep(){
    if(!updatePlusOn() || fpBusy) return;
    if(window.__catalogPending) return fpKick(2500);          // prima scarico il catalogo condiviso: Update+ non riparte da zero su un dispositivo nuovo
    if(typeof detailsReady === 'function' && !detailsReady()) return fpKick(2000);
    const calm = document.visibilityState === 'visible' && navigator.onLine !== false && !(navigator.connection && navigator.connection.saveData) && !document.querySelector('.rt-loader.show');
    if(!calm) return fpKick(15000);
    const queued = fpQueue.length > 0;
    if(!queued && fpDone >= FP_BUDGET) return;                  // per questo avvio basta: gli altri al prossimo, così non appesantisco
    const g = fpNext(); if(!g) return;
    fpBusy = true; try{ fpLine(); }catch(e){}
    try{ await updatePlus(g); if(!queued) fpDone++; }
    catch(e){ const fr = frLoad(); fr[g.id] = {t: new Date().toISOString(), tries: ((fr[g.id] || {}).tries || 0) + 1, src: []}; frSave(fr); }
    fpBusy = false; fpKick(queued ? 4000 : 5000);
  }
  function fpLine(){
    const el = document.getElementById('buildLine'); if(!el) return;
    let c = document.getElementById('upPlusLine');
    if(!c){ c = document.createElement('button'); c.type = 'button'; c.id = 'upPlusLine'; c.className = 'upplus-line'; el.insertAdjacentElement('afterend', c); c.addEventListener('click', ()=> window.openAuditPanel && openAuditPanel('todo')); }
    const st = updatePlusStats();
    c.innerHTML = giIcon('upplus') + ' Update+ ' + st.done + '/' + st.total + (updatePlusOn() ? (fpBusy ? ' · al lavoro…' : '') : ' · spento');
  }
  window.addEventListener('update-plus', fpLine);
  setTimeout(fpLine, 2500);
  setTimeout(()=> fpKick(0), 12000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') fpKick(3000); });
})();
