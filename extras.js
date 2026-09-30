// ---- Extra (v99): viste a copertine, copertine automatiche, ricerca a voce, wishlist con uscite,
// tier list da condividere, traguardi, colori dalla copertina. Tutto qui, caricato per ultimo:
// si aggancia alle funzioni esistenti (render, setView, openModal, applyFilters) senza modificarle.
(function(){
  const LS = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const esc = s=> (typeof escHtml === 'function') ? escHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast = (m, ms)=>{ try{ showToast(m, ms || 2600); }catch(e){} };
  const byId = id=> GAMES.find(g=> String(g.id) === String(id));
  const coverOf = g=>{ try{ return effectiveCover(g); }catch(e){ return null; } };
  const hoursOf = g=> (g.label && g.label.h) || (g.enrich && g.enrich.hoursMain) || null;
  const TIER_COL = {'S+':'#f5b82e','S':'#a855f7','A':'#3b82f6','B':'#10b981','C':'#eab308','D':'#f97316','E':'#ef4444','F':'#8b8b8b','ND':'#5b6070'};

  // piccolo pannello riutilizzabile
  function sheet(id, title, bodyHtml){
    let el = document.getElementById(id);
    if(!el){ el = document.createElement('div'); el.id = id; el.className = 'dup-backdrop x-sheet'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-x-close]')) el.classList.remove('show'); }); }
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>${title}</b><button class="btn" data-x-close>Chiudi</button></div><div class="x-body">${bodyHtml}</div></div>`;
    el.classList.add('show');
    return el.querySelector('.x-body');
  }

  window.XUI = {sheet, toast, esc, LS, byId, hoursOf, TIER_COL};

  // =====================================================================
  // 1) TRE MODI DI VEDERE LA CLASSIFICA: Tabella · Copertine · Schede
  // =====================================================================
  let MODE = LS.get('jrpg_view_mode', 'table');
  const tw = document.getElementById('tableWrap');
  const alt = document.createElement('div');
  alt.id = 'altView'; alt.className = 'alt-view'; alt.style.display = 'none';
  tw.parentNode.insertBefore(alt, tw.nextSibling);
  let altToken = 0, altObs = null;

  function cardHtml(g){
    const c = coverOf(g), st = (typeof STATUSES !== 'undefined') && STATUSES[g.id];
    const fav = FAVS.has(g.id) ? '<span class="x-fav">★</span>' : '';
    const img = c ? `<img src="${esc(coverThumb(c, 360))}" data-orig="${esc(c)}" alt="" loading="lazy" decoding="async" onerror="if(this.dataset.orig&&this.src!==this.dataset.orig){this.src=this.dataset.orig}else{this.remove()}">` : '';
    const ph = `<div class="x-ph" style="--tc:${TIER_COL[g.tier] || '#7c5cff'}"><span>${esc(g.name)}</span></div>`;
    const badge = `<span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span>`;
    if(MODE === 'grid'){
      return `<div class="x-card" data-id="${g.id}"><div class="x-cover">${ph}${img}${fav}<div class="x-corner">${badge}<b>${g.score}</b></div></div><div class="x-name">${esc(g.name)}</div></div>`;
    }
    const tags = (g.tags || []).slice(0, 2).map(t=> TAG_INFO[t] ? `<span class="x-tag">${TAG_INFO[t].icon} ${esc(TAG_INFO[t].label)}</span>` : '').join('');
    const stl = st && STATUS_INFO[st] ? `<span class="x-st">${esc(STATUS_INFO[st].label)}</span>` : '';
    return `<div class="x-row" data-id="${g.id}"><div class="x-thumb">${ph}${img}</div><div class="x-info"><div class="x-name">${fav}${esc(g.name)}</div><div class="x-meta">${esc(g.plat)} · ${esc(g.year || '')}${hoursOf(g) ? ' · ' + hoursOf(g) + 'h' : ''}</div><div class="x-tags">${tags}${stl}</div></div><div class="x-score">${badge}<b>${g.score}</b></div></div>`;
  }
  function renderAlt(){
    const my = ++altToken;
    if(altObs){ altObs.disconnect(); altObs = null; }
    const list = applyFilters();
    alt.className = 'alt-view mode-' + MODE;
    alt.innerHTML = list.length ? '' : '<div class="empty" style="display:block">Nessun gioco trovato con questi filtri.</div>';
    let shown = 0;
    (function more(){
      if(my !== altToken) return;
      const end = Math.min(list.length, shown + 60);
      let h = ''; for(; shown < end; shown++) h += cardHtml(list[shown]);
      alt.insertAdjacentHTML('beforeend', h);
      if(shown < list.length && 'IntersectionObserver' in window){
        altObs = new IntersectionObserver(es=>{ if(es.some(e=> e.isIntersecting)){ altObs.disconnect(); altObs = null; more(); } }, {root: alt, rootMargin:'600px'});
        altObs.observe(alt.lastElementChild);
      }
    })();
  }
  alt.addEventListener('click', e=>{ const c = e.target.closest('[data-id]'); if(c){ const g = byId(c.dataset.id); if(g) openModal(g); } });
  function syncMode(){
    const isList = state.view === 'list';
    const useAlt = isList && MODE !== 'table';
    tw.style.display = isList && !useAlt ? '' : 'none';
    alt.style.display = useAlt ? '' : 'none';
    if(useAlt) renderAlt();
    document.querySelectorAll('[data-x-mode]').forEach(b=> b.classList.toggle('active', b.dataset.xMode === MODE));
  }
  const origRender = window.render;
  window.render = function(){ const r = origRender.apply(this, arguments); try{ syncMode(); }catch(e){} return r; };
  const origSetView = window.setView;
  window.setView = function(v){ const r = origSetView.apply(this, arguments); try{ syncMode(); }catch(e){} return r; };
  const stb = document.getElementById('scrollTopBtn');
  if(stb) stb.addEventListener('click', ()=> alt.scrollTo({top:0, behavior:'smooth'}));
  function setMode(m){ MODE = m; LS.set('jrpg_view_mode', m); syncMode(); }

  // barra strumenti accanto al conteggio (non aggiunge altezza)
  const cl = document.querySelector('.count-line');
  if(cl){
    const tb = document.createElement('span'); tb.className = 'x-toolbar';
    tb.innerHTML = `<button type="button" data-x-mode="table" title="Tabella" aria-label="Tabella"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-table"/></svg></button><button type="button" data-x-mode="grid" title="Copertine" aria-label="Copertine"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-grid"/></svg></button><button type="button" data-x-mode="cards" title="Schede" aria-label="Schede"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-cards"/></svg></button><button type="button" id="xMenuBtn" title="Strumenti extra" aria-label="Extra"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-wand"/></svg></button>`;
    cl.appendChild(tb);
    tb.addEventListener('click', e=>{ const b = e.target.closest('button'); if(!b) return; if(b.dataset.xMode) setMode(b.dataset.xMode); else openMenu(); });
  }

  // =====================================================================
  // 2) MENU EXTRA
  // =====================================================================
  function openMenu(){
    const tint = LS.get('jrpg_cover_tint', false);
    const body = sheet('xMenu', giIcon('wand') + ' Extra', `
      <div class="lp-sub">Vista della classifica</div>
      <div class="lp-tools"><button class="btn${MODE==='table'?' primary':''}" data-m="table">${giIcon('table')} Tabella</button><button class="btn${MODE==='grid'?' primary':''}" data-m="grid">${giIcon('grid')} Copertine</button><button class="btn${MODE==='cards'?' primary':''}" data-m="cards">${giIcon('cards')} Schede</button></div>
      <div class="x-menu">
        <button class="btn" data-a="palette">${giIcon('orb')} Palette colori <small>(34 temi)</small></button>
        <button class="btn" data-a="complete">${giIcon('wand')} Completa le schede dei giochi aggiunti <small>(💕🤝✨💉)</small></button>
        <button class="btn" data-a="covers">${giIcon('screen')} Copertine automatiche <small>(Wikipedia)</small></button>
        <button class="btn" data-a="audit">${giIcon('lens')} Controllo dati <small>(${window.auditStats ? auditStats().props : 0} da approvare · ${window.auditStats ? auditStats().done : 0}/765 controllati)</small></button>
        <button class="btn" data-a="wish">${giIcon('gift')} Wishlist e date di uscita</button>
        <button class="btn" data-a="share">${giIcon('up')} Condividi la tua tier list (immagine)</button>
        <button class="btn" data-a="badges">${giIcon('trophy')} Traguardi</button>
        <a class="btn" href="backup-aurora/" title="La versione di prima delle palette, sempre disponibile">${giIcon('layers')} Versione di sicurezza (Aurora)</a>
        <label class="ask-toggle"><input type="checkbox" id="xAutoCov" ${LS.get('jrpg_autocover', true)?'checked':''}> ${giIcon('screen')} Cerca la copertina da sola quando apro un gioco che non ce l'ha</label>
        <label class="ask-toggle"><input type="checkbox" id="xFx" ${document.documentElement.classList.contains('fx-on')?'checked':''}> ${giIcon('layers')} Vetro sfocato e sfondo animato <small>(più bello, ma può rallentare lo scorrimento)</small></label>
        <label class="ask-toggle"><input type="checkbox" id="xTint" ${tint?'checked':''}> ${giIcon('orb')} Colori della scheda presi dalla copertina</label>
      </div>`);
    body.querySelectorAll('[data-m]').forEach(b=> b.addEventListener('click', ()=>{ setMode(b.dataset.m); document.getElementById('xMenu').classList.remove('show'); }));
    body.querySelector('#xAutoCov').addEventListener('change', ev=>{ LS.set('jrpg_autocover', ev.target.checked); });
    body.querySelector('#xFx').addEventListener('change', ev=>{ LS.set('jrpg_fx', ev.target.checked ? 'on' : 'off'); document.documentElement.classList.toggle('fx-on', ev.target.checked); toast(ev.target.checked ? 'Effetti extra attivi' : 'Effetti extra spenti: scorrimento più fluido'); });
    body.querySelector('#xTint').addEventListener('change', e=>{ LS.set('jrpg_cover_tint', e.target.checked); toast(e.target.checked ? 'Apri un gioco con copertina per vedere i colori' : 'Colori standard'); });
    { const xm = body.querySelector('.x-menu'); (window.XMENU || []).forEach(it=>{ const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.innerHTML = it.html; b.addEventListener('click', ()=>{ document.getElementById('xMenu').classList.remove('show'); it.run(); }); const first = xm.querySelector('a.btn, label.ask-toggle'); xm.insertBefore(b, first || null); }); }
    body.querySelectorAll('[data-a]').forEach(b=> b.addEventListener('click', ()=>{ document.getElementById('xMenu').classList.remove('show'); ({audit: ()=> window.openAuditPanel && window.openAuditPanel(), complete: ()=> window.completeCustomGames && window.completeCustomGames(), palette: ()=> window.openPalettePicker && window.openPalettePicker(), covers: openCovers, wish: openWishlist, share: shareTierImage, badges: openBadges})[b.dataset.a](); }));
  }

  // =====================================================================
  // 3) COPERTINE AUTOMATICHE da Wikipedia (richieste a gruppi di 50: ~16 in tutto)
  // =====================================================================
  const WP = 'https://en.wikipedia.org/w/api.php';
  const cleanT = n=> String(n).replace(/\s*\([^)]*\)/g, '').trim();
  const fj = (u, o)=> window.SearchHub ? SearchHub.json(u, o) : fetch(u).then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  async function wpq(params){
    return fj(WP + '?' + new URLSearchParams(Object.assign({format:'json', origin:'*', formatversion:'2'}, params)));
  }
  async function batchCovers(titles){           // titolo -> url copertina (segue i redirect, scarta le disambigue)
    const out = {};
    const j = await wpq({action:'query', titles: titles.join('|'), redirects:'1', prop:'pageimages|pageprops', ppprop:'disambiguation', piprop:'thumbnail', pithumbsize:'500', pilicense:'any'});
    const q = j.query || {}; const map = {};
    titles.forEach(t=> map[t] = t);
    (q.normalized || []).forEach(n=> Object.keys(map).forEach(k=> { if(map[k] === n.from) map[k] = n.to; }));
    (q.redirects || []).forEach(n=> Object.keys(map).forEach(k=> { if(map[k] === n.from) map[k] = n.to; }));
    const pages = {}; (q.pages || []).forEach(p=> pages[p.title] = p);
    titles.forEach(t=>{ const p = pages[map[t]]; if(p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops) && p.thumbnail) out[t] = p.thumbnail.source; });
    return out;
  }
  async function searchCover(name){
    const j = await wpq({action:'query', generator:'search', gsrsearch: cleanT(name) + ' video game', gsrlimit:'3', prop:'pageimages', piprop:'thumbnail', pithumbsize:'500', pilicense:'any'});
    const target = normGameName(cleanT(name));
    const p = ((j.query && j.query.pages) || []).sort((a, b)=> a.index - b.index).find(p=> p.thumbnail && normGameName(p.title.replace(/\s*\([^)]*\)\s*$/, '')) === target);
    return p ? p.thumbnail.source : null;
  }
  async function saveAutoCover(g, url){
    USER_COVERS[String(g.id)] = url;
    try{ if(COVER_DB) await COVER_DB.doc('covers/' + String(g.id)).set({url, name: g.name, auto: true, updatedAt: new Date().toISOString()}); }catch(e){}
  }

  // ---- Ricerca copertina "a catena" (solo fonti ufficiali/aperte, niente pagine da "grattare", niente chiavi, niente CAPTCHA) ----
  // 1) Wikidata: nome inglese ufficiale, ID Steam, voce Wikipedia   2) Steam: copertina verticale 600x900 (giochi PC moderni)
  // 3) Libretro Thumbnails (RetroArch): box art ufficiali di PS1/PS2/PSP/SNES/N64/GB/GBA/DS/GameCube/Wii/Sega/NEC/Xbox
  // 4) Wikipedia: immagine principale della voce del gioco
  const LR = 'https://thumbnails.libretro.com/';
  const LR_SYS = [
    [/\bps1\b|playstation(?! ?[2-5]| portable| vita)|\bpsx\b/i, 'Sony - PlayStation'], [/\bps2\b|playstation 2/i, 'Sony - PlayStation 2'], [/\bpsp\b/i, 'Sony - PlayStation Portable'],
    [/\bps3\b/i, 'Sony - PlayStation 3'], [/vita/i, 'Sony - PlayStation Vita'],
    [/\bsnes\b|super nintendo|super famicom/i, 'Nintendo - Super Nintendo Entertainment System'], [/\bnes\b|famicom(?!.*super)/i, 'Nintendo - Nintendo Entertainment System'],
    [/\bn64\b|nintendo 64/i, 'Nintendo - Nintendo 64'], [/\bgbc\b|game boy color/i, 'Nintendo - Game Boy Color'], [/\bgba\b|game boy advance/i, 'Nintendo - Game Boy Advance'],
    [/\bgb\b|game ?boy(?! (color|advance))/i, 'Nintendo - Game Boy'], [/\b3ds\b/i, 'Nintendo - Nintendo 3DS'], [/\bnds\b|\bds\b|nintendo ds/i, 'Nintendo - Nintendo DS'],
    [/gamecube|\bgc\b|\bngc\b/i, 'Nintendo - GameCube'], [/wii ?u/i, 'Nintendo - Wii U'], [/\bwii\b(?! ?u)/i, 'Nintendo - Wii'],
    [/mega ?drive|genesis/i, 'Sega - Mega Drive - Genesis'], [/saturn/i, 'Sega - Saturn'], [/dreamcast/i, 'Sega - Dreamcast'], [/mega-?cd|sega cd/i, 'Sega - Mega-CD - Sega CD'],
    [/master system/i, 'Sega - Master System - Mark III'], [/game gear/i, 'Sega - Game Gear'], [/pc ?engine ?cd|turbografx-?cd/i, 'NEC - PC Engine CD - TurboGrafx-CD'],
    [/pc ?engine|turbografx/i, 'NEC - PC Engine - TurboGrafx 16'], [/xbox 360/i, 'Microsoft - Xbox 360'], [/\bxbox\b(?! ?(360|one|series))/i, 'Microsoft - Xbox']
  ];
  const lrSystems = plat=>{ const out = []; String(plat || '').split(/\s*\/\s*/).forEach(tok=> LR_SYS.forEach(([re, s])=>{ if(re.test(tok) && !out.includes(s)) out.push(s); })); return out.slice(0, 3); };
  const lrSafe = s=> s.replace(/[&*\/:`<>?\\|"]/g, '_');
  function lrTitles(names){
    const out = [];
    names.filter(Boolean).forEach(n=>{
      const b = cleanT(n).replace(/\s+/g, ' ').trim();
      const dash = b.replace(/\s*:\s*/g, ' - ');
      const the = t=> /^the\s+/i.test(t) ? t.replace(/^the\s+(.*?)((\s+-\s+.*)?)$/i, (m, a, rest)=> a + ', The' + (rest || '')) : null;
      [dash, the(dash), b.replace(/\s*:.*$/, '')].forEach(x=>{ if(x && !out.includes(x)) out.push(x); });
    });
    return out.slice(0, 3);
  }
  const LR_REG = ['(USA)', '(Europe)', '(USA) (Disc 1)', '(Europe) (Disc 1)', '(Japan)', '(USA, Europe)', '(World)', '(Europe) (En,Fr,De,Es,It)', '(Italy)'];
  function probeImg(url, ms){
    return new Promise(res=>{ const im = new Image(); let t = setTimeout(()=>{ im.src = ''; res(false); }, ms || 8000);
      im.onload = ()=>{ clearTimeout(t); res(im.naturalWidth >= 80 && im.naturalHeight >= 80); }; im.onerror = ()=>{ clearTimeout(t); res(false); }; im.src = url; });
  }
  async function firstOk(urls, par){
    for(let i = 0; i < urls.length; i += (par || 6)){
      const part = urls.slice(i, i + (par || 6));
      const r = await Promise.all(part.map(u=> probeImg(u)));
      const k = r.indexOf(true); if(k >= 0) return part[k];
    }
    return null;
  }
  async function wikidataInfo(name){
    const W = 'https://www.wikidata.org/w/api.php?';
    const q = cleanT(name), target = normGameName(q);
    const s = await fj(W + new URLSearchParams({action:'wbsearchentities', search:q, language:'en', uselang:'en', type:'item', limit:'7', format:'json', origin:'*'}));
    const hit = (s.search || []).find(x=> /video ?game|role-playing|game/i.test(x.description || '') && !/series|franchise|soundtrack|film|character/i.test(x.description || '') && normGameName(x.label || '') === target)
      || (s.search || []).find(x=> /video ?game/i.test(x.description || '') && !/series|franchise/i.test(x.description || '') && (normGameName(x.label || '').startsWith(target) || target.startsWith(normGameName(x.label || ''))));
    if(!hit) return null;
    const d = await fj(W + new URLSearchParams({action:'wbgetentities', ids: hit.id, props:'claims|sitelinks|labels', languages:'en', sitefilter:'enwiki', format:'json', origin:'*'}));
    const en = d.entities && d.entities[hit.id]; if(!en) return null;
    const c = en.claims || {}, val = p=> ((c[p] || [])[0] || {}).mainsnak;
    const steam = (c.P1733 || []).map(x=> x.mainsnak && x.mainsnak.datavalue && x.mainsnak.datavalue.value).filter(Boolean);
    const files = p=> (c[p] || []).map(x=> x.mainsnak && x.mainsnak.datavalue && x.mainsnak.datavalue.value).filter(v=> typeof v === 'string');
    return {qid: hit.id, label: en.labels && en.labels.en && en.labels.en.value, enwiki: en.sitelinks && en.sitelinks.enwiki && en.sitelinks.enwiki.title, steam, img: files('P18'), logo: files('P154')};
  }
  async function wikiPageImage(title){
    const j = await wpq({action:'query', titles: title, redirects:'1', prop:'pageimages', piprop:'thumbnail', pithumbsize:'500', pilicense:'any'});
    const p = ((j.query && j.query.pages) || [])[0];
    return p && p.thumbnail ? p.thumbnail.source : null;
  }
  // trova la copertina migliore; restituisce {url, source} oppure null
  async function findCover(g, opts){
    opts = opts || {}; const say = opts.onStep || (()=>{});
    let wd = null;
    say('Wikidata…'); try{ wd = await wikidataInfo(g.name); }catch(e){}
    if(wd && wd.steam && wd.steam.length){
      say('Steam…');
      const u = await firstOk(wd.steam.slice(0, 2).map(id=> `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`));
      if(u) return {url: u, source: 'Steam'};
    }
    const sys = lrSystems(g.plat);
    if(sys.length){
      say('Libretro (box art ufficiali)…');
      const titles = lrTitles([wd && wd.label, g.name]);
      const regs = opts.quick ? LR_REG.slice(0, 4) : LR_REG;
      const urls = []; titles.forEach(t=> sys.forEach(s=> regs.forEach(r=> urls.push(LR + encodeURIComponent(s) + '/Named_Boxarts/' + encodeURIComponent(lrSafe(t) + ' ' + r + '.png')))));   // prima il titolo completo su tutte le console, poi le varianti più corte
      const u = await firstOk(urls, 8);
      if(u) return {url: u, source: 'Libretro'};
    }
    say('Wikipedia…');
    try{ const u = wd && wd.enwiki ? await wikiPageImage(wd.enwiki) : await searchCover(g.name); if(u) return {url: u, source: 'Wikipedia'}; }catch(e){}
    // ultima possibilità: immagine ufficiale del gioco su RAWG (non è una box art, ma è sempre del gioco giusto)
    try{ if(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has()){ say('RAWG…'); const i = await SearchHub.rawg.info(g.name); if(i && i.cover) return {url: i.cover, source: 'RAWG'}; } }catch(e){}
    return null;
  }
  window.findGameCover = findCover;
  window.XCOVER = {find: findCover, save: saveAutoCover, has: coverOf};

  // ---- «Cerca un'altra immagine»: raccoglie TUTTE le immagini trovate (box art in verticale prima, poi Wikipedia, RAWG, banner e schermate) e le fa scorrere una per volta ----
  async function okAll(urls, par){
    const good = [];
    for(let i = 0; i < urls.length; i += (par || 10)){
      const part = urls.slice(i, i + (par || 10)), r = await Promise.all(part.map(u=> probeImg(u)));
      part.forEach((u, k)=>{ if(r[k]) good.push(u); });
    }
    return good;
  }
  async function coverCandidates(g){
    // tutte le immagini che rappresentano il gioco, dalla più adatta a fare da locandina alla meno: box art verticali, copertine
    // di Wikipedia in più lingue, immagini ufficiali di Wikidata, grafiche di Steam (capsule, banner, hero), RAWG, schermate del titolo e di gioco
    const out = [], add = (u, src, rk)=>{ if(u && !out.some(x=> x.url === u)) out.push({url: u, source: src, rk}); };
    let wd = null; try{ wd = await wikidataInfo(g.name); }catch(e){}
    const tasks = [];
    const f = (window.SearchHub && SearchHub.factsFor) ? SearchHub.factsFor(g) : null;
    const ids = [...new Set([...((wd && wd.steam) || []), f && f.s && f.s.id ? String(f.s.id) : null].filter(Boolean))].slice(0, 2);
    if(ids.length){
      const A = id=> `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/`;
      const kinds = [['library_600x900_2x.jpg', 'Steam (locandina HD)', 0], ['library_600x900.jpg', 'Steam (locandina)', 0], ['capsule_616x353.jpg', 'Steam (copertina)', 3], ['header.jpg', 'Steam (banner)', 4], ['library_hero.jpg', 'Steam (immagine grande)', 5]];
      ids.forEach(id=> kinds.forEach(([k, src, rk])=> tasks.push(probeImg(A(id) + k).then(ok=> ok && add(A(id) + k, src, rk)))));
    }
    const sys = lrSystems(g.plat);
    if(sys.length){
      const titles = lrTitles([wd && wd.label, g.name]);
      const mk = kind=>{ const urls = []; titles.forEach(t=> sys.forEach(s=> LR_REG.forEach(r=> urls.push(LR + encodeURIComponent(s) + '/' + kind + '/' + encodeURIComponent(lrSafe(t) + ' ' + r + '.png'))))); return urls; };
      tasks.push(okAll(mk('Named_Boxarts')).then(l=> l.forEach(u=> add(u, 'Libretro (box art)', 0))));
      tasks.push(okAll(mk('Named_Titles'), 8).then(l=> l.slice(0, 2).forEach(u=> add(u, 'Libretro (schermata del titolo)', 6))));
      tasks.push(okAll(mk('Named_Snaps'), 8).then(l=> l.slice(0, 2).forEach(u=> add(u, 'Libretro (schermata di gioco)', 7))));
    }
    // Wikipedia: la voce inglese e le stesse voci in italiano, giapponese, francese, tedesco, spagnolo (spesso copertine diverse: europea, giapponese…)
    tasks.push((async()=>{ try{
      const t = wd && wd.enwiki; if(!t){ const u = await searchCover(g.name); if(u) add(u, 'Wikipedia', 1); return; }
      const u0 = await wikiPageImage(t); if(u0) add(u0, 'Wikipedia (inglese)', 1);
      const ll = await wpq({action: 'query', titles: t, prop: 'langlinks', lllimit: '100', redirects: '1'});
      const links = ((((ll.query || {}).pages || [])[0] || {}).langlinks || []).filter(l=> ['it', 'ja', 'fr', 'de', 'es'].includes(l.lang));
      await Promise.all(links.map(async l=>{ try{ const j = await fj('https://' + l.lang + '.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', titles: l.title, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '600', format: 'json', formatversion: '2', origin: '*'})); const p = ((j.query && j.query.pages) || [])[0]; if(p && p.thumbnail) add(p.thumbnail.source, 'Wikipedia (' + l.lang + ')', 2); }catch(e){} }));
    }catch(e){} })());
    // Wikidata: immagine e logo ufficiali (Wikimedia Commons)
    if(wd){ (wd.img || []).slice(0, 2).forEach(fn=> add('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(fn) + '?width=600', 'Wikidata (immagine)', 2)); (wd.logo || []).slice(0, 1).forEach(fn=> add('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(fn) + '?width=600', 'Wikidata (logo)', 6)); }
    tasks.push((async()=>{ try{ if(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has()){ const i = await SearchHub.rawg.info(g.name); if(i && i.cover) add(i.cover, 'RAWG', 3); } }catch(e){} })());
    await Promise.all(tasks);
    return out.sort((a, b)=> a.rk - b.rk);
  }
  const ALT = {};        // id gioco -> {list, idx}
  document.addEventListener('click', async ev=>{
    const fitBtn = ev.target.closest && ev.target.closest('[data-cover-fit]'), altBtn = ev.target.closest && ev.target.closest('[data-cover-alt]');
    if(!fitBtn && !altBtn) return;
    ev.stopPropagation();
    const g = (typeof currentModalGame !== 'undefined') ? currentModalGame : null; if(!g) return;
    if(fitBtn){
      const fr = fitBtn.closest('.cover-frame'); if(!fr) return;
      const cur = coverFitGet(g.id), i = COVER_FITS.findIndex(f=> f[0] === cur), nx = COVER_FITS[(i + 1) % COVER_FITS.length];
      coverFitSet(g.id, nx[0]); coverFitApply(fr, nx[0]); fitBtn.title = 'Adatta la locandina al formato: ' + nx[1] + ' (tocca per cambiare)';
      toast('Formato: ' + nx[1]);
      return;
    }
    if(altBtn.disabled) return;
    const cur0 = coverOf(g);
    if(!ALT[g.id]){
      if(typeof USER_COVER_IDS !== 'undefined' && USER_COVER_IDS[String(g.id)] && !confirm('Hai caricato una tua foto per questo gioco. La sostituisco con un\'altra immagine trovata online?')) return;
      altBtn.disabled = true; toast('Cerco altre immagini…', 6000);
      let list = []; try{ list = await coverCandidates(g); }catch(e){}
      altBtn.disabled = false;
      const curIdx = list.findIndex(x=> x.url === cur0);
      ALT[g.id] = {list, idx: -1};          // si parte sempre dalla migliore (box art), saltando quella attuale
      if(!list.length){ delete ALT[g.id]; toast('Non ho trovato altre immagini nelle fonti aperte'); return; }
    }
    const st = ALT[g.id];
    const others = st.list.filter(x=> x.url !== cur0);
    if(!others.length){ toast('Non ho trovato altre immagini di questo gioco oltre a quella attuale'); return; }
    let pick = null;
    for(let k = 0; k < st.list.length; k++){ st.idx = (st.idx + 1) % st.list.length; if(st.list[st.idx].url !== cur0){ pick = st.list[st.idx]; break; } }
    await saveAutoCover(g, pick.url);
    try{ if(typeof refreshCover === 'function') refreshCover(g); }catch(e){} try{ render(); }catch(e){}
    toast('Immagine ' + (st.idx + 1) + ' di ' + st.list.length + ' · ' + pick.source + ' (tocca ancora la lente per la prossima)', 3500);
  }, true);
  // le box art Libretro sono PNG grandi: in lista/griglia le mostro ridotte da un servizio di ridimensionamento (se non risponde, si usa l'originale)
  window.coverThumb = (u, w)=> /^https:\/\/thumbnails\.libretro\.com\//.test(u || '') ? 'https://wsrv.nl/?url=' + encodeURIComponent(u) + '&w=' + (w || 360) + '&output=webp' : u;
  let coversRunning = false;
  function openCovers(){
    const missing = GAMES.filter(g=> !coverOf(g));
    const body = sheet('xCovers', giIcon('screen') + ' Copertine automatiche', `<div class="lp-sub">Cerco la copertina ufficiale dei <b>${missing.length}</b> giochi che non ce l'hanno, da fonti aperte: Wikipedia, Steam (copertine verticali), Libretro/RetroArch (box art originali delle console) e Wikidata. Le copertine che hai già messo tu non vengono toccate. Si salvano e si sincronizzano come le altre.</div>
      <div class="lp-tools"><button class="btn primary" id="xCovGo" ${coversRunning || !missing.length ? 'disabled' : ''}>${missing.length ? 'Avvia' : 'Tutte le copertine ci sono già'}</button></div><div class="lp-sub" id="xCovSt"></div><div class="x-bar"><i id="xCovBar"></i></div>`);
    const st = body.querySelector('#xCovSt'), bar = body.querySelector('#xCovBar');
    body.querySelector('#xCovGo').addEventListener('click', async e=>{
      if(coversRunning) return; coversRunning = true; e.target.disabled = true;
      let found = 0, done = 0; const left = [];
      if(window.Progress) Progress.begin('Cerco le copertine…');
      const step = ()=>{ bar.style.width = Math.round(done / missing.length * 100) + '%'; st.textContent = `Controllati ${done}/${missing.length} · trovate ${found}`; if(window.Progress) Progress.set(done / missing.length * 100, `Copertine: ${done}/${missing.length} · trovate ${found}`); };
      try{
        for(let i = 0; i < missing.length; i += 50){       // 1° giro: titoli esatti, 50 alla volta
          const part = missing.slice(i, i + 50);
          let res = {};
          try{ res = await batchCovers(part.map(g=> cleanT(g.name))); }catch(err){ st.textContent = 'Wikipedia non risponde ora: riprova tra poco.'; }
          for(const g of part){ const u = res[cleanT(g.name)]; if(u){ await saveAutoCover(g, u); found++; } else left.push(g); done++; }
          step(); await new Promise(r=> setTimeout(r, 400));
        }
        done = missing.length - left.length;
        for(const g of left){                               // 2° giro: ricerca, uno alla volta e con calma
          try{ const r = await findCover(g, {quick:true}); if(r){ await saveAutoCover(g, r.url); found++; } }catch(err){}
          done++; step(); await new Promise(r=> setTimeout(r, 700));
          if(!document.getElementById('xCovers').classList.contains('show') && done % 20 === 0) toast(`Copertine: ${found} trovate finora…`);
        }
        st.textContent = `Fatto: ${found} copertine trovate su ${missing.length}. ${missing.length - found ? 'Per le altre puoi usare "Cerca copertina" nella scheda del gioco.' : ''}`;
        toast(`🖼️ ${found} copertine aggiunte`, 4000);
      }finally{ coversRunning = false; if(window.Progress) Progress.end(); try{ render(); }catch(e){} }
    });
  }

  // =====================================================================
  // 4) RICERCA A VOCE: "JRPG a turni sotto le 40 ore in italiano"
  // =====================================================================
  let VX = null;   // filtri extra dettati a voce: {maxHours, italian}
  const origApply = window.applyFilters;
  window.applyFilters = function(){
    let l = origApply.apply(this, arguments);
    if(VX && VX.maxHours) l = l.filter(g=> { const h = hoursOf(g); return h && h <= VX.maxHours; });
    if(VX && VX.italian) l = l.filter(g=> g.label && ['D','S'].includes(g.label.it));
    return l;
  };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const search = document.getElementById('search');
  const row2 = document.querySelector('.topbar-row2');
  const vchip = document.createElement('div'); vchip.className = 'x-voicechip'; vchip.hidden = true;
  if(row2){ row2.classList.add('x-has-mic'); row2.parentNode.insertBefore(vchip, row2.nextSibling); }
  function showVoiceChip(txt){
    vchip.hidden = !txt; vchip.innerHTML = txt ? `🎤 ${esc(txt)} <button type="button" aria-label="Togli filtri vocali">✕</button>` : '';
    const b = vchip.querySelector('button');
    if(b) b.addEventListener('click', ()=>{ VX = null; showVoiceChip(''); try{ document.getElementById('resetBtn').click(); }catch(e){} });
  }
  async function applyVoice(text){
    search.value = ''; state.search = '';
    if(typeof llmAvailable === 'function' && llmAvailable()){
      showVoiceChip('“' + text + '” · capisco…');
      const codes = Object.keys(TAG_INFO).map(c=> c + '=' + TAG_INFO[c].label).join(', ');
      const prompt = `Trasforma questa richiesta vocale in filtri per un catalogo di videogiochi. Richiesta: "${text}". Rispondi SOLO con JSON: {"search": testo da cercare nel nome o "" (solo se cita un titolo o una saga), "tags": [codici genere tra: ${codes}], "minScore": 70|80|90|null, "decade": 1980|1990|2000|2010|2020|null, "status": "played"|"playing"|"backlog"|"dropped"|null, "maxHours": numero|null, "italian": true|false, "onlyStory": true|false}`;
      try{
        const r = await askLLM(prompt, {}, {fast:true, label:'Capisco la tua richiesta…'});
        const s = String(r && r.text || ''), j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
        state.tags = new Set((j.tags || []).filter(c=> TAG_INFO[c]));
        const setSel = (id, v, key)=>{ const el = document.getElementById(id); if(el){ el.value = v; state[key] = v; } };
        setSel('scoreFilter', j.minScore ? String(j.minScore >= 90 ? 90 : j.minScore >= 80 ? 80 : 70) : '', 'minScore');
        setSel('decadeFilter', j.decade ? String(j.decade) : '', 'decade');
        setSel('statusFilter', j.status || '', 'status');
        state.onlyStory = !!j.onlyStory; const sf = document.getElementById('storyFilter'); if(sf) sf.value = j.onlyStory ? 'yes' : '';
        state.search = j.search || ''; search.value = state.search;
        VX = {maxHours: +j.maxHours || null, italian: !!j.italian};
        const parts = [...state.tags].map(c=> TAG_INFO[c].label).concat(j.minScore ? ['voto ' + j.minScore + '+'] : [], j.decade ? ['anni ' + j.decade] : [], VX.maxHours ? ['≤ ' + VX.maxHours + ' ore'] : [], VX.italian ? ['in italiano'] : [], j.status ? [STATUS_INFO[j.status] ? STATUS_INFO[j.status].label : j.status] : [], state.search ? ['“' + state.search + '”'] : []);
        showVoiceChip(parts.join(' · ') || text);
        try{ renderTagChips(); }catch(e){}
        if(state.view !== 'list') setView('list');
        render(); return;
      }catch(e){ toast('Non ho capito la richiesta: cerco il testo così com\'è'); }
    }
    showVoiceChip(''); state.search = text; search.value = text; render();
  }
  if(row2 && search){
    const mic = document.createElement('button');
    mic.type = 'button'; mic.className = 'x-mic'; mic.title = 'Cerca a voce'; mic.innerHTML = '<svg class="gi" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><use href="#g-mic"/></svg>'; mic.setAttribute('aria-label', 'Cerca a voce');
    row2.appendChild(mic);
    mic.addEventListener('click', ()=>{
      if(!SR){ toast('Questo browser non supporta la ricerca a voce (prova Chrome o Safari aggiornati)', 4000); return; }
      const rec = new SR(); rec.lang = 'it-IT'; rec.interimResults = false; rec.maxAlternatives = 1;
      mic.classList.add('listening'); toast('🎤 Ti ascolto… es. "JRPG a turni sotto le 40 ore in italiano"', 3500);
      rec.onresult = e=>{ const t = e.results[0][0].transcript; applyVoice(t); };
      rec.onerror = e=>{ toast(e.error === 'not-allowed' ? 'Permesso microfono negato: attivalo nelle impostazioni del browser' : e.error === 'network' ? 'Il riconoscimento vocale ha bisogno di internet: riprova' : 'Non ho sentito nulla, riprova'); };
      rec.onend = ()=> mic.classList.remove('listening');
      try{ rec.start(); }catch(e){ mic.classList.remove('listening'); }
    });
  }

  // =====================================================================
  // 5) WISHLIST con data di uscita e avviso quando esce
  // =====================================================================
  const WK = 'jrpg_wishlist';
  const wl = ()=> LS.get(WK, {});
  const today = ()=> new Date().toISOString().slice(0, 10);
  const daysTo = d=> Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5);
  function fmtD(d){ try{ return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return d; } }
  function toggleWish(g){
    const w = wl();
    if(w[g.id]){ delete w[g.id]; toast('Tolto dalla wishlist'); }
    else { w[g.id] = {name: g.name, added: today(), date: null, released: null, checked: null, notified: false}; toast('🎁 Aggiunto alla wishlist: controllo la data di uscita…'); }
    LS.set(WK, w);
    if(w[g.id]) checkRelease(g.id, true);
  }
  async function checkRelease(id, verbose){
    const w = wl(), it = w[id]; if(!it) return;
    if(typeof llmAvailable !== 'function' || !llmAvailable()){ if(verbose) toast('Per la data di uscita serve la chiave Gemini (⚙️ in Chiedi)'); return; }
    const prompt = todayLine() + `Cerca online la data di uscita in Italia/Europa del videogioco "${it.name}". Rispondi SOLO con JSON: {"released": true|false, "date": "AAAA-MM-GG" oppure "AAAA-MM" oppure "AAAA" oppure null se non annunciata, "note": frase breve in italiano (es. piattaforme, edizione)}`;
    try{
      const r = await askLLM(prompt, {}, {search: true, fast:true, silent: !verbose, label:'Controllo la data di uscita…'});
      const s = String(r && r.text || ''), j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
      const w2 = wl(); if(!w2[id]) return;
      w2[id].date = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(j.date || '') ? j.date : null;
      w2[id].released = !!j.released; w2[id].note = j.note || ''; w2[id].checked = today();
      LS.set(WK, w2);
      if(verbose) toast(w2[id].released ? `${it.name}: è già uscito` : w2[id].date ? `${it.name}: esce il ${fmtD(w2[id].date.length === 10 ? w2[id].date : w2[id].date + '-01')}` : `${it.name}: data non ancora annunciata`, 4500);
      if(document.getElementById('xWish') && document.getElementById('xWish').classList.contains('show')) openWishlist();
    }catch(e){ if(verbose) toast('Non sono riuscito a controllare la data ora'); }
  }
  function releaseAlerts(){
    const w = wl(); let changed = false;
    Object.keys(w).forEach(id=>{
      const it = w[id]; if(it.notified) return;
      const out = it.released || (it.date && it.date.length === 10 && daysTo(it.date) <= 0);
      if(out){
        it.notified = true; changed = true;
        const msg = `🎉 ${it.name} è uscito! È nella tua wishlist.`;
        toast(msg, 6000);
        try{ if('Notification' in window && Notification.permission === 'granted') new Notification('Raccoon Tier', {body: msg, icon: 'icons/icon-192.png'}); }catch(e){}
      }
    });
    if(changed) LS.set(WK, w);
    // ricontrolla in silenzio al massimo 2 giochi non usciti ogni 3 giorni (pochissime richieste)
    Object.keys(w).filter(id=> !w[id].released && (!w[id].checked || daysTo(w[id].checked) <= -3)).slice(0, 2).forEach((id, i)=> setTimeout(()=> checkRelease(id, false), 4000 + i * 3000));
  }
  function openWishlist(){
    const w = wl(), ids = Object.keys(w);
    ids.sort((a, b)=> (w[a].released - w[b].released) || String(w[a].date || '9999').localeCompare(String(w[b].date || '9999')));
    const rows = ids.map(id=>{
      const it = w[id]; let when = 'data non ancora annunciata';
      if(it.released) when = '✅ già uscito';
      else if(it.date && it.date.length === 10){ const d = daysTo(it.date); when = d > 0 ? `📅 ${fmtD(it.date)} · tra ${d} giorn${d === 1 ? 'o' : 'i'}` : '🎉 uscito'; }
      else if(it.date) when = `📅 previsto: ${esc(it.date)}`;
      return `<div class="x-wrow"><div><b>${esc(it.name)}</b><br><small>${when}${it.note ? ' · ' + esc(it.note) : ''}${it.price ? ' · 💶 ' + (it.price.cur === 'USD' ? '$' + it.price.f.toFixed(2) : it.price.f.toLocaleString('it-IT', {style:'currency', currency:'EUR'})) + (it.price.d > 0 ? ' (−' + it.price.d + '%)' : '') : ''}${it.checked ? ' · controllato il ' + fmtD(it.checked) : ''}</small></div><div class="x-wbtn"><button class="btn" data-w-open="${id}">Apri</button><button class="btn" data-w-check="${id}">↻</button><button class="btn" data-w-del="${id}">✕</button></div></div>`;
    }).join('');
    const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    const body = sheet('xWish', giIcon('gift') + ' Wishlist e uscite', `<div class="lp-sub">Aggiungi un gioco dalla sua scheda con il pulsante «Wishlist». Controllo la data di uscita (con Gemini e ricerca web) e ti avviso quando esce, <b>quando apri l'app</b> (un sito web non può avvisarti a app chiusa).</div>
      ${perm === 'default' ? '<div class="lp-tools"><button class="btn" id="xNotif">🔔 Attiva notifiche del telefono</button></div>' : ''}
      ${rows || '<div class="lp-sub">La wishlist è vuota.</div>'}`);
    const n = body.querySelector('#xNotif'); if(n) n.addEventListener('click', ()=> Notification.requestPermission().then(p=> toast(p === 'granted' ? '🔔 Notifiche attive' : 'Notifiche non attivate')));
    body.querySelectorAll('[data-w-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.wOpen); if(g){ document.getElementById('xWish').classList.remove('show'); openModal(g); } }));
    body.querySelectorAll('[data-w-check]').forEach(b=> b.addEventListener('click', ()=>{ b.textContent = '…'; checkRelease(b.dataset.wCheck, true); }));
    body.querySelectorAll('[data-w-del]').forEach(b=> b.addEventListener('click', ()=>{ const w2 = wl(); delete w2[b.dataset.wDel]; LS.set(WK, w2); openWishlist(); }));
  }

  // pulsante Wishlist nella scheda del gioco + colori dalla copertina
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      const card = document.getElementById('modalCard'), head = card && card.querySelector('.modal-head');
      if(head && g && g.id != null){
        const on = !!wl()[g.id];
        const bar = document.createElement('div'); bar.className = 'x-modal-actions';
        bar.innerHTML = `<button class="btn${on ? ' primary' : ''}" type="button" id="xWishBtn">${giIcon('gift')} ${on ? 'In wishlist' : 'Wishlist'}</button>`;
        head.insertAdjacentElement('afterend', bar);
        bar.querySelector('#xWishBtn').addEventListener('click', ev=>{ toggleWish(g); const now = !!wl()[g.id]; const bt = ev.currentTarget; bt.className = 'btn' + (now ? ' primary' : ''); bt.innerHTML = giIcon('gift') + ' ' + (now ? 'In wishlist' : 'Wishlist'); });
      }
      tintModal(g);
      coverAssist(g);
    }catch(e){}
    return r;
  };
  // scheda del gioco senza copertina: pulsante "Trova copertina" e (se attivo) ricerca automatica all'apertura
  let assistToken = 0;
  function coverAssist(g){
    if(!g) return;
    const block = document.getElementById('coverBlock'); if(!block) return;
    const my = ++assistToken;
    if(coverOf(g)){                                   // ha già una locandina: pulsante per riscaricarla dalle fonti online (mai in automatico)
      const r2 = document.createElement('div'); r2.className = 'x-autocover';
      r2.innerHTML = '<button class="btn" type="button">' + giIcon('refresh') + ' Aggiorna locandina</button><span class="x-ac-st"></span>';
      const tl = block.querySelector('.cover-tools'); (tl || block).insertAdjacentElement('afterend', r2);
      const b2 = r2.querySelector('button'), s2 = r2.querySelector('.x-ac-st');
      b2.addEventListener('click', async ()=>{
        b2.disabled = true; s2.textContent = 'Cerco…';
        const r = await findCover(g, {onStep: x=>{ if(my === assistToken) s2.textContent = 'Cerco su ' + x; }});
        if(my !== assistToken) return;
        if(r && r.url !== coverOf(g)){ await saveAutoCover(g, r.url); s2.textContent = '✅ Aggiornata da ' + r.source;
          try{ if(typeof refreshCover === 'function') refreshCover(g); }catch(e){} try{ render(); }catch(e){} toast('Locandina aggiornata (' + r.source + ')'); }
        else { s2.textContent = r ? 'È già la migliore che trovo.' : 'Nessuna locandina trovata nelle fonti aperte.'; b2.disabled = false; }
      });
      return;
    }
    const row = document.createElement('div'); row.className = 'x-autocover';
    row.innerHTML = '<button class="btn primary" type="button">✨ Trova copertina</button><span class="x-ac-st"></span>';
    const tools = block.querySelector('.cover-tools'); (tools || block).insertAdjacentElement('afterend', row);
    const btn = row.querySelector('button'), st = row.querySelector('.x-ac-st');
    const run = async ()=>{
      btn.disabled = true; st.textContent = 'Cerco…';
      const r = await findCover(g, {onStep: s=>{ if(my === assistToken) st.textContent = 'Cerco su ' + s; }});
      if(my !== assistToken) return;
      if(r){ await saveAutoCover(g, r.url); st.textContent = '✅ Trovata su ' + r.source + ' e salvata';
        try{ if(typeof refreshCover === 'function') refreshCover(g); }catch(e){} try{ render(); }catch(e){} toast('🖼️ Copertina trovata su ' + r.source); }
      else { st.textContent = 'Non trovata nelle fonti aperte: usa "Cerca copertina" qui sopra.'; btn.disabled = false; }
    };
    btn.addEventListener('click', run);
    if(LS.get('jrpg_autocover', true)) run();
  }
  function tintModal(g){
    const card = document.getElementById('modalCard'); if(!card) return;
    card.classList.remove('x-tinted'); card.style.removeProperty('--x-tint');
    if(!LS.get('jrpg_cover_tint', false)) return;
    const apply = rgb=>{ card.style.setProperty('--x-tint', rgb); card.classList.add('x-tinted'); };
    const fallback = ()=>{ const h = TIER_COL[g.tier] || '#7c5cff'; const n = parseInt(h.slice(1), 16); apply(`${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`); };
    const url = coverOf(g); if(!url){ fallback(); return; }
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = ()=>{ try{
      const c = document.createElement('canvas'); c.width = c.height = 12; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 12, 12);
      const d = x.getImageData(0, 0, 12, 12).data; let r = 0, gg = 0, b = 0, n = 0;
      for(let i = 0; i < d.length; i += 4){ const mx = Math.max(d[i], d[i+1], d[i+2]), mn = Math.min(d[i], d[i+1], d[i+2]); const w = 1 + (mx - mn) / 40; r += d[i] * w; gg += d[i+1] * w; b += d[i+2] * w; n += w; }
      apply(`${Math.round(r / n)}, ${Math.round(gg / n)}, ${Math.round(b / n)}`);
    }catch(e){ fallback(); } };
    im.onerror = fallback; im.src = url;
  }

  // =====================================================================
  // 6) CONDIVIDI LA TIER LIST come immagine
  // =====================================================================
  function shareTierImage(){
    const mine = GAMES.filter(g=> FAVS.has(g.id) || (typeof STATUSES !== 'undefined' && STATUSES[g.id] && STATUSES[g.id] !== 'backlog') || (typeof MYTIER !== 'undefined' && MYTIER[g.id]));
    const pool = mine.length >= 5 ? mine : GAMES.filter(inActiveList).slice().sort((a, b)=> b.score - a.score).slice(0, 60);
    const tiers = ['S+','S','A','B','C','D','E','F'].map(t=> ({t, games: pool.filter(g=> effectiveTier(g) === t).sort((a, b)=> b.score - a.score)})).filter(x=> x.games.length);
    const W = 1080, P = 40, rowPad = 18, chipH = 44, font = '600 26px system-ui, sans-serif';
    const c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = font;
    const layout = tiers.map(tr=>{ const lines = [[]]; let lw = 0; const maxW = W - P * 2 - 140;
      tr.games.slice(0, 40).forEach(g=>{ const name = g.name.length > 34 ? g.name.slice(0, 33) + '…' : g.name; const w = x.measureText(name).width + 32; if(lw + w > maxW && lines[lines.length - 1].length){ lines.push([]); lw = 0; } lines[lines.length - 1].push({name, w}); lw += w + 10; });
      return {t: tr.t, lines, extra: Math.max(0, tr.games.length - 40)}; });
    const H = 220 + layout.reduce((s, l)=> s + Math.max(96, l.lines.length * (chipH + 10) + rowPad * 2) + 12, 0) + 80;
    c.width = W; c.height = H;
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1a1033'); bg.addColorStop(1, '#2b1450'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; x.font = '800 60px system-ui, sans-serif'; x.fillText('🦝 La mia Tier List', P, 100);
    x.font = '500 28px system-ui, sans-serif'; x.fillStyle = '#c9b8ff'; x.fillText(mine.length >= 5 ? 'I giochi che ho giocato e amato' : 'I migliori della mia collezione', P, 150);
    let y = 200;
    layout.forEach(l=>{
      const h = Math.max(96, l.lines.length * (chipH + 10) + rowPad * 2);
      x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(P, y, W - P * 2, h);
      x.fillStyle = TIER_COL[l.t] || '#888'; x.fillRect(P, y, 120, h);
      x.fillStyle = '#111'; x.font = '900 46px system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(l.t, P + 60, y + h / 2 + 16); x.textAlign = 'left';
      x.font = font;
      l.lines.forEach((line, i)=>{ let cx = P + 140; const cy = y + rowPad + i * (chipH + 10);
        line.forEach(ch=>{ x.fillStyle = 'rgba(255,255,255,.12)'; if(x.roundRect){ x.beginPath(); x.roundRect(cx, cy, ch.w, chipH, 12); x.fill(); } else x.fillRect(cx, cy, ch.w, chipH); x.fillStyle = '#fff'; x.fillText(ch.name, cx + 16, cy + 31); cx += ch.w + 10; }); });
      if(l.extra){ x.fillStyle = '#c9b8ff'; x.fillText('+' + l.extra, W - P - 70, y + h - 16); }
      y += h + 12;
    });
    x.fillStyle = '#9d8cd6'; x.font = '500 24px system-ui, sans-serif'; x.fillText('Raccoon Tier · kur0chanx.github.io/TierListGame', P, H - 36);
    c.toBlob(async blob=>{
      if(!blob){ toast('Non sono riuscito a creare l\'immagine'); return; }
      const file = new File([blob], 'mia-tier-list.png', {type:'image/png'});
      try{ if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:'La mia Tier List'}); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mia-tier-list.png'; document.body.appendChild(a); a.click(); a.remove();
      toast('📤 Immagine salvata: mia-tier-list.png');
    }, 'image/png');
  }

  // =====================================================================
  // 7) TRAGUARDI (calcolati dai tuoi dati, nessuna rete)
  // =====================================================================
  const BADGES = [
    ['first', '🎮', 'Si comincia', 'Segna il primo gioco come giocato', s=> s.played >= 1],
    ['p10', '🥉', 'Giocatore', '10 giochi giocati', s=> s.played >= 10],
    ['p25', '🥈', 'Veterano', '25 giochi giocati', s=> s.played >= 25],
    ['p50', '🥇', 'Leggenda', '50 giochi giocati', s=> s.played >= 50],
    ['splus', '👑', 'Solo il meglio', '5 giochi S+ giocati', s=> s.splus >= 5],
    ['retro', '📼', 'Anima retrò', 'Un gioco degli anni \'80 o \'90 giocato', s=> s.retro >= 1],
    ['decades', '⏳', 'Viaggiatore del tempo', 'Giochi giocati di 4 decenni diversi', s=> s.decades >= 4],
    ['genres', '🧭', 'Esploratore', 'Giochi giocati di 6 generi diversi', s=> s.genres >= 6],
    ['fav10', '💖', 'Cuore d\'oro', '10 preferiti', s=> s.favs >= 10],
    ['long', '🏔️', 'Maratoneta', 'Un gioco da 60+ ore giocato', s=> s.long >= 1],
    ['covers', '🖼️', 'Collezionista', '100 copertine nella collezione', s=> s.covers >= 100],
    ['wish', '🎁', 'Sognatore', '3 giochi in wishlist', s=> s.wish >= 3]
  ];
  function badgeStats(){
    const S = (typeof STATUSES !== 'undefined') ? STATUSES : {};
    const played = GAMES.filter(g=> S[g.id] === 'played');
    const decs = new Set(played.map(g=> Math.floor((g.ysort || 0) / 10)));
    const gens = new Set(); played.forEach(g=> (g.tags || []).forEach(t=> gens.add(t)));
    return {played: played.length, splus: played.filter(g=> g.tier === 'S+').length, retro: played.filter(g=> g.ysort && g.ysort < 2000).length, decades: decs.size, genres: gens.size, favs: FAVS.size, long: played.filter(g=> (hoursOf(g) || 0) >= 60).length, covers: GAMES.filter(g=> coverOf(g)).length, wish: Object.keys(wl()).length};
  }
  function checkBadges(silent){
    const s = badgeStats(), seen = LS.get('jrpg_badges', null);
    const now = BADGES.filter(b=> b[4](s)).map(b=> b[0]);
    if(seen === null){ LS.set('jrpg_badges', now); return; }       // primo avvio: nessuna raffica di avvisi
    const fresh = now.filter(k=> !seen.includes(k));
    if(fresh.length){ LS.set('jrpg_badges', seen.concat(fresh)); if(!silent) fresh.forEach((k, i)=>{ const b = BADGES.find(b=> b[0] === k); setTimeout(()=> toast(`🏆 Traguardo sbloccato: ${b[1]} ${b[2]}`, 4000), i * 4200); }); }
  }
  function openBadges(){
    const s = badgeStats();
    const body = sheet('xBadges', giIcon('trophy') + ' Traguardi', '<div class="x-badges">' + BADGES.map(b=>{ const ok = b[4](s); return `<div class="x-badge${ok ? ' ok' : ''}"><span>${b[1]}</span><b>${esc(b[2])}</b><small>${esc(b[3])}</small></div>`; }).join('') + '</div>');
    return body;
  }
  let bT = 0; const tbody = document.getElementById('tbody');
  if(tbody) new MutationObserver(()=>{ clearTimeout(bT); bT = setTimeout(()=> checkBadges(false), 1500); }).observe(tbody, {childList:true});

  // avvio
  syncMode();
  setTimeout(()=>{ checkBadges(true); releaseAlerts(); }, 2500);
})();

// =====================================================================
// 10) LE MIE VIBES: preferiti Top + consigli per atmosfera, sensazioni e meccaniche (in «Scopri»)
//     - «Nel tuo database»: somiglianza calcolata in locale (nessuna AI, nessun costo)
//     - «Nuovi da fuori»: ricerca web a fonti multiple (Reddit, ResetEra, forum…) con il box Frugu Frugu e il pulsante «Basta frugare»
// =====================================================================
(function(){
  const RK = 'jrpg_vibes_results';
  const ld = ()=>{ try{ return JSON.parse(localStorage.getItem(RK) || '[]') || []; }catch(e){ return []; } };
  const sv = a=>{ try{ localStorage.setItem(RK, JSON.stringify(a.slice(0, 40))); }catch(e){} };
  let results = ld(), busy = false, showLocal = true;
  const tn = t=> (TAG_INFO[t] ? TAG_INFO[t].label : t);
  const favGames = ()=> GAMES.filter(g=> FAVS.has(g.id));
  const pace = {L:0, M:1, V:2};
  function similarity(g, favs){
    let best = 0, bestFav = null, why = [];
    favs.forEach(f=>{
      if(f.id === g.id) return;
      const a = new Set(g.tags || []), b = new Set(f.tags || []);
      const inter = [...a].filter(t=> b.has(t)), uni = new Set([...a, ...b]);
      let sc = uni.size ? inter.length / uni.size * 0.42 : 0;
      const ea = g.enrich || {}, eb = f.enrich || {}, la = g.label || {}, lb = f.label || {};
      const w = [];
      if(ea.storyTag && ea.storyTag === eb.storyTag){ sc += 0.14; w.push('stessa forza della storia'); }
      if(ea.dopamine && eb.dopamine){ sc += 0.1; w.push('lo stesso "ancora un turno"'); }
      if(la.s && lb.s && Math.abs(la.s - lb.s) <= 1 && la.s >= 4){ sc += 0.08; w.push('storia al centro'); }
      if(la.p && lb.p && la.p === lb.p){ sc += 0.05; w.push('ritmo simile'); }
      if(la.d && lb.d && Math.abs(la.d - lb.d) <= 1){ sc += 0.04; }
      if(g.ysort && f.ysort && Math.abs(g.ysort - f.ysort) <= 6){ sc += 0.04; w.push('della stessa epoca'); }
      sc += Math.max(0, (g.score - 60)) / 40 * 0.13;
      if(sc > best){ best = sc; bestFav = f; why = inter.slice(0, 2).map(tn).concat(w).slice(0, 3); }
    });
    return {sc: best, fav: bestFav, why};
  }
  function localList(){
    const favs = favGames(); if(!favs.length) return [];
    return GAMES.filter(g=> !FAVS.has(g.id) && !STATUSES[g.id]).map(g=>({g, ...similarity(g, favs)})).sort((a, b)=> b.sc - a.sc).slice(0, 8);
  }
  const VIBES_STRATEGIES = [
    {key:'reddit', src:'Reddit', hint:"Cerca nelle discussioni di Reddit (r/patientgamers, r/JRPG, r/rpg_gamers, r/gamingsuggestions, r/truegaming): thread «se ti è piaciuto X prova Y», «giochi simili a X»."},
    {key:'reddit', src:'ResetEra e forum', hint:"Cerca su ResetEra, Steam Discussions, GameFAQs, forum di Multiplayer.it e altri forum: utenti che dicono «se ti è piaciuto X amerai Y perché dà le stesse sensazioni»."},
    {key:'riviste', src:'liste «giochi simili a…»', hint:"Cerca liste e articoli «games like X» di riviste (IGN, Eurogamer, PC Gamer, RPGFan, Game Rant) e siti di raccomandazioni (Similar Games, GamePressure, Lutris)."},
    {key:'igdb', src:'IGDB, RAWG e MobyGames', hint:"Cerca i «simili» di IGDB, RAWG e MobyGames per ciascun preferito."},
    {key:'riviste', src:'YouTube e recensioni', hint:"Cerca video e recensioni «se ti è piaciuto X, gioca a…», e giochi che i recensori paragonano ai preferiti per atmosfera e meccaniche."},
    {key:'retro', src:'nicchia e retro', hint:"Cerca perle di nicchia o retro che trasmettono le stesse sensazioni, anche di genere in parte diverso."}
  ];
  function buildPrompt(favs, count){
    const list = favs.slice(0, 14).map(f=> `- "${f.name}" (${f.year || 'n.d.'}, ${f.plat}; ${(f.tags || []).map(tn).join(', ') || 'n.d.'})${(f.enrich && f.enrich.whyLikeIt) ? ' — ' + f.enrich.whyLikeIt : ''}`).join('\n');
    return todayLine() + `Mario ha questi giochi PREFERITI (la sua lista Top):\n${list}\n
Trova ${count} videogiochi che gli darebbero le STESSE VIBES: atmosfera, mood, tono della storia, sensazioni, meccaniche chiave e affinità emotive. Non limitarti al genere tecnico: sono ben accetti giochi di genere in parte diverso se la sensazione è la stessa. Basati soprattutto su consigli REALI di giocatori (forum, Reddit, ResetEra, commenti e liste), e dì cosa dicono.
NON proporre nessuno di questi (già nel suo database o già rifiutati): ${novitaExcludeListText(novitaKnownNames())}
Rispondi SOLO con un array JSON valido con ${count} oggetti, ognuno con: name (titolo esatto), plat, year, tier (S+, S, A, B, C, D, E, F), score (0-100), tags (0-3 codici tra: ${genreGlossary(NOVITA_GENRE_ALL_CODES)}), story (2-3 frasi di premessa), fitIf (completa la frase «Fa per te se…» in SECONDA PERSONA singolare, es. "cerchi un tattico a turni senza grinding": inizia con un verbo alla seconda persona come ami, cerchi, vuoi, preferisci; NON ripetere «Fa per te se» e MAI la terza persona tipo «gli piacerà»), because (una frase: perché dà le stesse sensazioni, citando almeno un preferito), basedOn (array con 1-3 nomi esatti tra i preferiti elencati), sharedVibes (array di 2-4 parole chiave: es. "malinconia", "viaggio epico", "scelte morali", "esplorazione"), forum (una frase su cosa dicono i giocatori, con la fonte es. "Reddit r/JRPG"; null se non trovi un consiglio reale: NON inventare).`;
  }
  async function findVibes(){
    if(busy) return; const favs = favGames();
    if(favs.length < 1){ showToast('Aggiungi prima almeno un gioco preferito', 2500); return; }
    if(typeof llmAvailable !== 'function' || !llmAvailable()){ showToast('Serve una chiave Gemini (⚙️ Impostazioni in Chiedi) per cercare sul web', 3500); return; }
    busy = true; refresh();
    try{
      const arr = await novitaSearchParallel(n=> buildPrompt(favs, n), 12, VIBES_STRATEGIES, null, {directKeys: ['reddit', 'rawgsimilar'], seeds: favs.slice(0, 8).map(f=> f.name)});
      const have = new Set(results.map(c=> c.name.toLowerCase()));
      const fresh = arr.filter(c=> !have.has(c.name.toLowerCase()));
      results = fresh.concat(results); sv(results);
      showToast(fresh.length ? '🦝 ' + fresh.length + ' giochi con le tue vibes' : 'Nessun gioco nuovo trovato: riprova più tardi', 3000);
    }catch(e){ showToast('Ricerca non riuscita: ' + ((typeof llmErrorText === 'function' && e && e.code) ? llmErrorText(e) : 'riprova tra poco'), 4000); }
    busy = false; refresh();
  }
  function barHtml(){
    const favs = favGames(), loc = showLocal ? localList() : [];
    return `<div class="vb-wrap" id="vibesBar">
      <div class="vb-title">❤️ I miei preferiti Top <small>(${favs.length})</small></div>
      <div class="vb-chips">${favs.slice(0, 40).map(f=> `<span class="vb-chip" data-open="${f.id}">${escHtml(f.name)} <b data-unfav="${f.id}" title="Togli dai preferiti">×</b></span>`).join('') || '<span class="vb-empty">Ancora nessuno: aggiungi i giochi che ami di più.</span>'}</div>
      <div class="vb-add"><input id="vbInput" list="vbList" placeholder="Aggiungi un gioco ai preferiti…" autocomplete="off"><datalist id="vbList"></datalist><button class="btn" id="vbAdd">＋</button></div>
      <div class="lp-tools"><button class="btn primary" id="vbFind" ${busy ? 'disabled' : ''}>${giIcon('wand')} Consigliati per le mie vibes</button><button class="btn" id="vbLocal">${showLocal ? 'Nascondi' : 'Mostra'} quelli già nel database</button></div>
      <div class="vb-hint">Atmosfera, sensazioni e meccaniche dei tuoi preferiti, confrontate con quello che dicono giocatori e forum. Le proposte da fuori si aggiungono con ♥ e diventano schede complete.</div>
      ${loc.length ? `<div class="vb-sec">📚 Già nel tuo database, con le stesse vibes</div>${loc.map(o=> `<div class="vb-loc" data-open="${o.g.id}"><b>${escHtml(o.g.name)}</b> <span class="badge ${TIER_LABEL[o.g.tier]}">${o.g.tier}</span><br><small>Come «${escHtml(o.fav ? o.fav.name : '')}»${o.why.length ? ': ' + escHtml(o.why.join(' · ')) : ''}</small></div>`).join('')}` : ''}
      ${results.length ? `<div class="vb-sec">🌐 Nuovi da fuori (${results.length})</div>${results.map((c, i)=> `<div class="vb-card novita-compact">
        <div class="novita-head"><div class="discover-title">${escHtml(c.name)}</div><div class="novita-acts"><button class="discover-btn nope" data-vno="${i}" title="Non fa per me">✕</button><button class="discover-btn like" data-vyes="${i}" title="Aggiungi con scheda completa">♥</button></div></div>
        <div class="novita-meta"><span>${escHtml(c.year || '?')}</span> · <span>${escHtml(c.plat || '?')}</span><span class="badge ${TIER_LABEL[c.tier]}">${c.tier}</span>${c.score != null ? `<span class="badge outline">${c.score}/100</span>` : ''}</div>
        ${c.because ? `<div class="vb-because">${escHtml(c.because)}</div>` : ''}
        ${(c.sharedVibes || []).length ? `<div class="modal-tags">${c.sharedVibes.map(v=> `<span class="tagpill">${escHtml(v)}</span>`).join('')}</div>` : ''}
        ${c.forum ? `<div class="novita-why"><b>Cosa dicono i giocatori</b> ${escHtml(c.forum)}</div>` : ''}
        <div class="novita-links"><a class="novita-link-btn" href="${novitaYoutubeUrl(c.name)}" target="_blank" rel="noopener">▶️ Gameplay ITA</a><a class="novita-link-btn" href="${novitaReviewSearchUrl(c.name)}" target="_blank" rel="noopener">📰 Recensione ITA</a><a class="novita-link-btn" href="${coverSearchUrl({name:c.name})}" target="_blank" rel="noopener">🖼️ Locandina</a><a class="novita-link-btn" href="${novitaGameplaySearchUrl(c.name)}" target="_blank" rel="noopener">📸 Foto gameplay</a></div>
      </div>`).join('')}` : ''}
    </div>`;
  }
  function wire(root){
    const inp = root.querySelector('#vbInput'), dl = root.querySelector('#vbList');
    const fillDl = ()=>{ if(dl && !dl.childElementCount) dl.innerHTML = GAMES.map(g=> `<option value="${escHtml(g.name)}">`).join(''); };
    if(inp) inp.addEventListener('focus', fillDl);
    const add = ()=>{
      const v = (inp.value || '').trim().toLowerCase(); if(!v) return;
      const g = GAMES.find(x=> x.name.toLowerCase() === v) || GAMES.find(x=> x.name.toLowerCase().includes(v));
      if(!g){ showToast('Non trovo questo gioco nel database', 2200); return; }
      FAVS.add(g.id); saveFavs(); try{ renderMetrics(); render(); }catch(e){} showToast('❤️ ' + g.name + ' tra i preferiti', 1600); refresh();
    };
    root.querySelector('#vbAdd').addEventListener('click', add);
    if(inp) inp.addEventListener('keydown', e=>{ if(e.key === 'Enter') add(); });
    root.querySelector('#vbFind').addEventListener('click', findVibes);
    root.querySelector('#vbLocal').addEventListener('click', ()=>{ showLocal = !showLocal; refresh(); });
    root.querySelectorAll('[data-unfav]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); FAVS.delete(+b.dataset.unfav); saveFavs(); try{ renderMetrics(); render(); }catch(x){} refresh(); }));
    root.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', e=>{ if(e.target.closest('[data-unfav]')) return; const g = GAMES.find(x=> x.id == b.dataset.open); if(g) openModal(g); }));
    root.querySelectorAll('[data-vyes]').forEach(b=> b.addEventListener('click', ()=>{ const c = results[+b.dataset.vyes]; if(!c) return; try{ askToolAddCustomGame(c, 'Le mie vibes'); }catch(e){ showToast((e && e.message || 'Non aggiunto').slice(0, 120), 3000); } results.splice(+b.dataset.vyes, 1); sv(results); refresh(); }));
    root.querySelectorAll('[data-vno]').forEach(b=> b.addEventListener('click', ()=>{ const c = results[+b.dataset.vno]; if(!c) return; try{ novitaSkipCandidate(c); }catch(e){} results.splice(+b.dataset.vno, 1); sv(results); refresh(); }));
  }
  function refresh(){
    const panel = document.getElementById('discoverPanel'); if(!panel) return;
    const old = document.getElementById('vibesBar'); const keep = old && old.querySelector('#vbInput') ? old.querySelector('#vbInput').value : '';
    if(old) old.remove();
    const wrap = panel.querySelector('.discover-wrap') || panel;
    wrap.insertAdjacentHTML('afterbegin', barHtml());
    const root = document.getElementById('vibesBar'); wire(root);
    const inp = root.querySelector('#vbInput'); if(inp && keep) inp.value = keep;
  }
  if(typeof window.renderDiscoverCard === 'function'){
    const orig = window.renderDiscoverCard;
    window.renderDiscoverCard = function(){ orig.apply(this, arguments); try{ refresh(); }catch(e){ console.error(e); } };
  }
})();

// microfono anche in «Chiedi»: detta la domanda a voce (la tastiera non si apre da sola)
(function(){
  const mic = document.getElementById('askMicBtn'), inp = document.getElementById('askInput');
  if(!mic || !inp) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ mic.title = 'Il tuo browser non supporta la dettatura'; mic.style.opacity = '.5'; }
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  mic.addEventListener('click', ()=>{
    // su iPad/iPhone la dettatura del sito non è affidabile (soprattutto dalla schermata Home): apro la tastiera, dove c'è il microfono di sistema
    if(apple){ try{ inp.focus(); showToast('Tocca il microfono 🎤 sulla tastiera per dettare', 3500); }catch(e){} return; }
    if(!SR){ try{ showToast('Questo browser non supporta la voce (prova Chrome o Safari aggiornati)', 3500); }catch(e){} return; }
    const rec = new SR(); rec.lang = 'it-IT'; rec.interimResults = true; rec.maxAlternatives = 1;
    mic.classList.add('listening'); mic.textContent = '🔴';
    const base = inp.value ? inp.value.trim() + ' ' : '';
    rec.onresult = e=>{ let t = ''; for(let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; inp.value = base + t; try{ inp.dispatchEvent(new Event('input')); }catch(x){} };
    rec.onerror = e=>{ try{ showToast(e.error === 'not-allowed' ? 'Permesso microfono negato: attivalo nelle impostazioni del browser' : e.error === 'network' ? 'La dettatura ha bisogno di internet' : e.error === 'service-not-allowed' ? 'Dettatura non disponibile qui: usa il microfono della tastiera' : 'Non ho sentito nulla: riprova', 3500); }catch(x){} };
    rec.onend = ()=>{ mic.classList.remove('listening'); mic.textContent = '🎤'; };
    try{ rec.start(); }catch(e){ mic.classList.remove('listening'); mic.textContent = '🎤'; }
  });
})();
