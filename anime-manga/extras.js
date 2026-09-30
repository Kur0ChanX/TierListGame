// Extra: viste Tabella/Copertine/Schede, menu ✨ (palette, interruttori), immagine della tier list, wishlist con date di uscita,
// traguardi, colori dalla copertina, ricerca a voce e «Le mie vibes» (in Scopri). Si aggancia alle funzioni esistenti senza modificarle.
(function(){
  const esc = escHtml, toast = (m, ms)=>{ try{ showToast(m, ms || 2600); }catch(e){} };
  const coverOf = (g, size)=>{ try{ return coverUrl(g, size); }catch(e){ return null; } };

  // =====================================================================
  // 1) TRE MODI DI VEDERE LA CLASSIFICA: Tabella · Copertine · Schede
  // =====================================================================
  let MODE = lsGet('atl_view_mode', 'table');
  const tw = document.getElementById('tableWrap');
  const alt = document.createElement('div');
  alt.id = 'altView'; alt.className = 'alt-view'; alt.style.display = 'none';
  tw.parentNode.insertBefore(alt, tw.nextSibling);
  let altToken = 0, altObs = null;
  function cardHtml(g){
    const st = STATUSES[g.id], fav = FAVS.has(g.id) ? '<span class="x-fav">★</span>' : '';
    const u = coverOf(g, MODE === 'grid' ? 'large' : 'medium');
    const img = u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    const stt = STUDIO_INFO[g.stk];
    const ph = `<div class="x-ph" style="--tc:${esc(g.c || TIER_COL[g.tier] || '#7c5cff')}"><i>${stt ? stt.i : (KIND_ICON[g.l] || '🎬')}</i><span>${esc(g.name)}</span></div>`;
    const badge = `<span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span>`;
    const cov = `<div class="x-cover" data-cover-id="${esc(g.id)}" data-cover-size="${MODE === 'grid' ? 'large' : 'medium'}">${ph}${img}${fav}${MODE === 'grid' ? `<div class="x-corner">${badge}<b>${g.score}</b></div>` : ''}</div>`;
    if(MODE === 'grid') return `<div class="x-card" data-id="${esc(g.id)}">${cov}<div class="x-name">${esc(g.name)}</div></div>`;
    const tags = (g.tags || []).slice(0, 2).map(t=> TAG_INFO[t] ? `<span class="x-tag">${TAG_INFO[t].icon} ${esc(TAG_INFO[t].label)}</span>` : '').join('');
    const stl = st && STATUS_INFO[st] ? `<span class="x-st">${esc(statusLabel(g, st))}</span>` : '';
    return `<div class="x-row" data-id="${esc(g.id)}"><div class="x-thumb" data-cover-id="${esc(g.id)}" data-cover-size="medium">${ph}${img}</div><div class="x-info"><div class="x-name">${fav}${esc(g.name)}</div><div class="x-meta">${esc(g.who || '')}${g.who ? ' · ' : ''}${esc(g.year || '')} · ${esc(lenText(g))}</div><div class="x-tags">${tags}${stl}</div></div><div class="x-score">${badge}<b>${g.score}</b></div></div>`;
  }
  window.renderAlt = function(){
    const my = ++altToken;
    if(altObs){ altObs.disconnect(); altObs = null; }
    const list = applyFilters();
    alt.className = 'alt-view mode-' + MODE;
    alt.innerHTML = list.length ? '' : '<div class="empty" style="display:block">Nessun titolo trovato con questi filtri.</div>';
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
  };
  alt.addEventListener('click', e=>{ const c = e.target.closest('[data-id]'); if(c){ const g = byId(c.dataset.id); if(g) openModal(g); } });
  function syncMode(){
    const isList = state.view === 'list', useAlt = isList && MODE !== 'table';
    tw.style.display = isList && !useAlt ? '' : 'none';
    alt.style.display = useAlt ? '' : 'none';
    if(useAlt) window.renderAlt();
    document.querySelectorAll('[data-x-mode]').forEach(b=> b.classList.toggle('active', b.dataset.xMode === MODE));
  }
  const origRender = window.render;
  window.render = function(){ const r = origRender.apply(this, arguments); try{ syncMode(); }catch(e){} return r; };
  const origSetView = window.setView;
  window.setView = function(v){ const r = origSetView.apply(this, arguments); try{ syncMode(); }catch(e){} return r; };
  function setMode(m){ MODE = m; lsSet('atl_view_mode', m); syncMode(); }
  const cl = document.querySelector('.count-line');
  if(cl){
    const tb = document.createElement('span'); tb.className = 'x-toolbar';
    tb.innerHTML = `<button type="button" data-x-mode="table" title="Tabella" aria-label="Tabella"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-table"/></svg></button><button type="button" data-x-mode="grid" title="Copertine" aria-label="Copertine"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-grid"/></svg></button><button type="button" data-x-mode="cards" title="Schede" aria-label="Schede"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-cards"/></svg></button><button type="button" id="xMenuBtn" title="Strumenti extra" aria-label="Extra"><svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-wand"/></svg></button>`;
    cl.appendChild(tb);
    tb.addEventListener('click', e=>{ const b = e.target.closest('button'); if(!b) return; if(b.dataset.xMode) setMode(b.dataset.xMode); else openMenu(); });
  }

  // =====================================================================
  // 2) MENU EXTRA ✨
  // =====================================================================
  function openMenu(){
    const tint = lsGet('atl_cover_tint', false), thumbs = lsGet('atl_row_thumbs', true);
    const body = sheet('xMenu', '✨ Extra', `
      <div class="lp-sub">Vista della classifica</div>
      <div class="lp-tools"><button class="btn${MODE === 'table' ? ' primary' : ''}" data-m="table">☰ Tabella</button><button class="btn${MODE === 'grid' ? ' primary' : ''}" data-m="grid">▦ Copertine</button><button class="btn${MODE === 'cards' ? ' primary' : ''}" data-m="cards">▤ Schede</button></div>
      <div class="x-menu">
        <button class="btn" data-a="palette">🎨 Palette colori <small>(${(window.RT_PALETTES || []).length} temi)</small></button>
        <button class="btn" data-a="online">🌐 Cerca online e aggiungi un titolo</button>
        <button class="btn" data-a="complete">🧩 Completa le schede dei titoli aggiunti <small>(trama, «fa per te se»…)</small></button>
        <button class="btn" data-a="audit">🔎 Controllo dati <small>(${window.auditStats ? auditStats().props + ' da approvare · ' + auditStats().done + '/' + ITEMS.length + ' controllati' : 'confronto con AniList'})</small></button>
        <button class="btn" data-a="wish">🎁 Wishlist e date di uscita</button>
        <button class="btn" data-a="share">📤 Condividi la tua tier list (immagine)</button>
        <button class="btn" data-a="badges">🏆 Traguardi</button>
        <button class="btn" data-a="sources">📚 Fonti dei dati e crediti</button>
        <button class="btn" data-a="debug">🛠️ Diagnostica fonti</button>
        <a class="btn" href="https://kur0chanx.github.io/TierListGame/" target="_blank" rel="noopener" title="L'altra app: la classifica dei videogiochi">🎮 Tier List RPG &amp; JRPG (altra app)</a>
        <label class="ask-toggle"><input type="checkbox" id="xThumbs" ${thumbs ? 'checked' : ''}> 🖼️ Miniature delle copertine nelle righe della tabella</label>
        <label class="ask-toggle"><input type="checkbox" id="xFx" ${document.documentElement.classList.contains('fx-on') ? 'checked' : ''}> 🪟 Vetro sfocato e sfondo animato <small>(più bello, ma può rallentare lo scorrimento)</small></label>
        <label class="ask-toggle"><input type="checkbox" id="xTint" ${tint ? 'checked' : ''}> 🎨 Colori della scheda presi dalla copertina</label>
      </div>`);
    body.querySelectorAll('[data-m]').forEach(b=> b.addEventListener('click', ()=>{ setMode(b.dataset.m); document.getElementById('xMenu').classList.remove('show'); }));
    body.querySelector('#xThumbs').addEventListener('change', ev=>{ lsSet('atl_row_thumbs', ev.target.checked); document.documentElement.classList.toggle('no-row-th', !ev.target.checked); });
    body.querySelector('#xFx').addEventListener('change', ev=>{ lsSet('atl_fx', ev.target.checked ? 'on' : 'off'); document.documentElement.classList.toggle('fx-on', ev.target.checked); toast(ev.target.checked ? 'Effetti extra attivi' : 'Effetti extra spenti: scorrimento più fluido'); });
    body.querySelector('#xTint').addEventListener('change', e=>{ lsSet('atl_cover_tint', e.target.checked); toast(e.target.checked ? 'Apri un titolo per vedere i colori della copertina' : 'Colori standard'); });
    const actions = {
      palette: ()=> window.openPalettePicker && window.openPalettePicker(), online: ()=> openOnlineSearch(''), share: shareTierImage, badges: openBadges, wish: openWishlist,
      complete: ()=> window.completeCustomItems ? window.completeCustomItems() : toast('Serve il motore AI (⚙️ in Chiedi)'), audit: ()=> window.openAuditPanel && window.openAuditPanel(),
      sources: openSources, debug: ()=> window.DebugLog && DebugLog.open()
    };
    body.querySelectorAll('[data-a]').forEach(b=> b.addEventListener('click', ()=>{ document.getElementById('xMenu').classList.remove('show'); const f = actions[b.dataset.a]; if(f) f(); }));
  }
  function openSources(){
    sheet('xSources', '📚 Fonti dei dati e crediti', `<div class="x-body-text">
      <p><b>Anime, manga e manhwa:</b> voto medio degli utenti di <a href="https://anilist.co" target="_blank" rel="noopener">AniList</a> (0-100), generi, copertine, studi, autori e collegamenti tra opere.</p>
      <p><b>Film d'animazione (di ogni studio):</b> voto medio e numero di voti dai dataset non commerciali di <a href="https://www.imdb.com" target="_blank" rel="noopener">IMDb</a> («Informazioni per gentile concessione di IMDb, usate con permesso»); studio, regia, paese, saga e titoli italiani da <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>; locandine dalle voci di <a href="https://it.wikipedia.org" target="_blank" rel="noopener">Wikipedia</a>.</p>
      <p><b>Tier:</b> le soglie sono calcolate su ogni lista (S+ circa il 2% dei titoli, S 6%, A 14%, B 24%, C 26%, D 16%, E 8%, F 4%) e si applicano anche ai titoli che aggiungi.</p>
      <p><b>Serie:</b> le stagioni di uno stesso anime sono fuse in una sola voce (voto = media pesata sulla popolarità; il dettaglio di ogni stagione è nella scheda).</p>
      <p><b>Testi:</b> trame e consigli in italiano scritti a mano (senza spoiler); dove mancano puoi leggere la voce di Wikipedia (CC BY-SA).</p>
      <p><b>Salvataggi:</b> tutto resta nel tuo browser con chiavi <code>atl_*</code>: non toccano quelli dell'app dei giochi.</p></div>`);
  }

  // =====================================================================
  // 3) CONDIVIDI LA TIER LIST come immagine (con le copertine)
  // =====================================================================
  function loadImg(url){
    return new Promise(res=>{ if(!url) return res(null); const im = new Image(); im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer'; let done = false; const fin = v=>{ if(!done){ done = true; res(v); } };
      im.onload = ()=> fin(im); im.onerror = ()=> fin(null); setTimeout(()=> fin(null), 9000); im.src = url; });
  }
  async function shareTierImage(){
    const mine = ITEMS.filter(g=> MYTIER[g.id] || FAVS.has(g.id) || STATUSES[g.id] === 'done');
    const usingMine = mine.length >= 5;
    const scope = ITEMS.filter(inActiveList);
    const pool = usingMine ? mine.filter(inActiveList).length >= 5 ? mine.filter(inActiveList) : mine : scope.slice().sort((a, b)=> b.score - a.score).slice(0, 60);
    const tiers = TIERS_LIST.map(t=> ({t, items: pool.filter(g=> effectiveTier(g) === t).sort((a, b)=> b.score - a.score)})).filter(x=> x.items.length);
    if(!tiers.length){ toast('Non c\'è ancora niente da mostrare: segna qualche titolo o spostalo nei tier'); return; }
    toast('Preparo l\'immagine…', 2500);
    const W = 1200, P = 36, LBL = 110, CW = 96, CH = 136, GAP = 8, perRow = Math.floor((W - P * 2 - LBL - 16) / (CW + GAP)), MAXT = perRow * 3;
    const shown = tiers.map(x=> ({t: x.t, items: x.items.slice(0, MAXT), extra: Math.max(0, x.items.length - MAXT)}));
    const imgs = new Map();
    await Promise.all(shown.flatMap(x=> x.items).map(async g=>{ imgs.set(g.id, await loadImg(coverOf(g, 'medium'))); }));
    const rows = shown.map(x=> Math.max(1, Math.ceil(x.items.length / perRow)));
    const H = 170 + shown.reduce((s, x, i)=> s + rows[i] * (CH + GAP) + 26, 0) + 70;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#171029'); bg.addColorStop(.55, '#22103f'); bg.addColorStop(1, '#101a3a'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; x.font = '800 54px system-ui, sans-serif'; x.fillText('🦝 La mia Tier List', P, 78);
    const what = usingMine ? 'Quello che ho amato tra anime, film e manga' : `I migliori: ${ACTIVE_LIST === 'all' ? 'anime, film e manga' : (LIST_BY_ID[ACTIVE_LIST] ? LIST_BY_ID[ACTIVE_LIST].full : (TAG_INFO[ACTIVE_LIST] ? TAG_INFO[ACTIVE_LIST].label : ''))}`;
    x.font = '500 26px system-ui, sans-serif'; x.fillStyle = '#c9b8ff'; x.fillText(what, P, 122);
    let y = 150;
    shown.forEach((tr, ti)=>{
      const h = rows[ti] * (CH + GAP) + 18;
      x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(P, y, W - P * 2, h);
      x.fillStyle = TIER_COL[tr.t] || '#888'; x.fillRect(P, y, LBL, h);
      x.fillStyle = '#111'; x.font = '900 44px system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(tr.t, P + LBL / 2, y + h / 2 + 15); x.textAlign = 'left';
      tr.items.forEach((g, i)=>{
        const cx = P + LBL + 12 + (i % perRow) * (CW + GAP), cy = y + 9 + Math.floor(i / perRow) * (CH + GAP), im = imgs.get(g.id);
        if(im){ x.save(); x.beginPath(); (x.roundRect ? x.roundRect(cx, cy, CW, CH, 8) : x.rect(cx, cy, CW, CH)); x.clip(); x.drawImage(im, cx, cy, CW, CH); x.restore(); }
        else { x.fillStyle = g.c || '#3b2d6b'; x.beginPath(); (x.roundRect ? x.roundRect(cx, cy, CW, CH, 8) : x.rect(cx, cy, CW, CH)); x.fill(); x.fillStyle = '#fff'; x.font = '600 13px system-ui, sans-serif'; const words = g.name.split(' '); let line = '', ly = cy + 26; words.forEach(w=>{ if(x.measureText(line + w).width > CW - 12){ x.fillText(line, cx + 6, ly); ly += 16; line = ''; } line += w + ' '; }); x.fillText(line, cx + 6, ly); }
      });
      if(tr.extra){ x.fillStyle = '#c9b8ff'; x.font = '600 22px system-ui, sans-serif'; x.fillText('+' + tr.extra, W - P - 62, y + h - 12); }
      y += h + 8;
    });
    x.fillStyle = '#9d8cd6'; x.font = '500 22px system-ui, sans-serif'; x.fillText('Raccoon Tier · Anime, Film & Manga', P, H - 28);
    c.toBlob(async blob=>{
      if(!blob){ toast('Non sono riuscito a creare l\'immagine'); return; }
      const file = new File([blob], 'mia-tier-list-anime-manga.png', {type:'image/png'});
      try{ if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:'La mia Tier List'}); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
      downloadBlob(blob, 'mia-tier-list-anime-manga.png'); toast('📤 Immagine salvata: mia-tier-list-anime-manga.png');
    }, 'image/png');
  }
  document.getElementById('shareTierBtn').addEventListener('click', shareTierImage);

  // =====================================================================
  // 4) WISHLIST con date di uscita e avvisi
  // =====================================================================
  let WISH = {};
  function loadWishlist(){ WISH = lsGet(profileKey('atl_wishlist'), {}) || {}; }
  loadWishlist(); PROFILE_RELOADERS.push(loadWishlist);
  const saveWish = ()=> lsSet(profileKey('atl_wishlist'), WISH);
  const fmtDate = d=>{ if(!d || !d.year) return null; const o = {year:'numeric'}; if(d.month) o.month = 'long'; if(d.day) o.day = 'numeric'; try{ return new Date(d.year, (d.month || 1) - 1, d.day || 1).toLocaleDateString('it-IT', o); }catch(e){ return String(d.year); } };
  const daysTo = d=>{ if(!d || !d.year) return null; return Math.ceil((new Date(d.year, (d.month || 1) - 1, d.day || 1) - new Date()) / 86400000); };
  window.wishAddMedia = function(m){
    const key = String(m.id); if(WISH[key]){ toast('È già nella tua wishlist'); return; }
    WISH[key] = {al: m.id, type: m.type, name: m.title.english || m.title.romaji, status: m.status, start: m.startDate, next: m.nextAiringEpisode ? {ep: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt} : null, added: Date.now(), notified: m.status === 'RELEASING' || m.status === 'FINISHED'};
    saveWish(); toast('🎁 Aggiunto alla wishlist: ti avviso quando esce');
  };
  window.wishBtnHtml = function(g){
    if(!g.al) return '';
    const on = !!WISH[String(g.al)];
    return `<button class="btn" id="modalWishBtn">${on ? '🎁 In wishlist ✓' : (g.st === 'R' ? '🎁 Avvisami delle uscite' : '🎁 Wishlist')}</button>`;
  };
  document.addEventListener('click', async e=>{
    const b = e.target.closest && e.target.closest('#modalWishBtn'); if(!b || !currentModalItem) return;
    const g = currentModalItem;
    if(WISH[String(g.al)]){ delete WISH[String(g.al)]; saveWish(); toast('Tolto dalla wishlist'); openModal(g); return; }
    b.disabled = true;
    try{ const d = await AniList.q(`query($id:Int){Media(id:$id){${MEDIA_LITE}}}`, {id: g.al}); window.wishAddMedia(d.Media); }catch(err){ toast('Non riesco a leggere le date ora'); }
    openModal(g);
  });
  async function refreshWishlist(){
    const ids = Object.keys(WISH).map(Number); if(!ids.length || !navigator.onLine) return [];
    const d = await AniList.q(`query($ids:[Int]){Page(perPage:50){media(id_in:$ids){id status startDate{year month day} nextAiringEpisode{episode airingAt} title{romaji english} type format}}}}`, {ids}, {cache: false});
    const released = [];
    d.Page.media.forEach(m=>{
      const w = WISH[String(m.id)]; if(!w) return;
      w.start = m.startDate; w.next = m.nextAiringEpisode ? {ep: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt} : null;
      if(w.status === 'NOT_YET_RELEASED' && (m.status === 'RELEASING' || m.status === 'FINISHED') && !w.notified){ released.push(w.name); w.notified = true; }
      w.status = m.status;
    });
    saveWish(); return released;
  }
  window.releaseAlerts = async function(){
    try{
      const rel = await refreshWishlist();
      rel.forEach((n, i)=> setTimeout(()=>{ toast(`🎁 È uscito: ${n}!`, 6000); try{ if(window.Notification && Notification.permission === 'granted') new Notification('Raccoon Tier', {body: `È uscito: ${n}`}); }catch(e){} }, i * 6200));
    }catch(e){}
  };
  function openWishlist(){
    const rows = Object.values(WISH).sort((a, b)=> (daysTo(a.start) ?? 9e4) - (daysTo(b.start) ?? 9e4));
    const body = sheet('xWish', '🎁 Wishlist e date di uscita', rows.length ? `<div class="lp-sub">Ti avviso quando escono (all'apertura dell'app). ${window.Notification && Notification.permission === 'default' ? '<button class="btn" id="wlNotif">🔔 Attiva le notifiche</button>' : ''}</div>` + rows.map(w=>{
      const d = daysTo(w.start), when = fmtDate(w.start);
      const st = w.status === 'NOT_YET_RELEASED' ? (when ? `esce ${when}${d != null && d >= 0 ? ` (tra ${d} giorni)` : ''}` : 'data da annunciare') : w.status === 'RELEASING' ? `in corso${w.next ? ` · prossimo ep. ${w.next.ep} il ${new Date(w.next.at * 1000).toLocaleDateString('it-IT', {day:'numeric', month:'short'})}` : ''}` : 'uscito';
      return `<div class="wl-row"><span><b>${esc(w.name)}</b><br><small>${w.type === 'MANGA' ? '📚' : '📺'} ${esc(st)}</small></span><span><a class="btn" href="https://anilist.co/${w.type === 'MANGA' ? 'manga' : 'anime'}/${w.al}" target="_blank" rel="noopener">↗</a> <button class="btn" data-wl-del="${w.al}">✕</button></span></div>`; }).join('') : '<div class="lp-sub">La wishlist è vuota. Aggiungi titoli in uscita dalla scheda «Novità» (pulsante 🎁) o dalla scheda di un titolo.</div>');
    body.querySelectorAll('[data-wl-del]').forEach(b=> b.addEventListener('click', ()=>{ delete WISH[b.dataset.wlDel]; saveWish(); openWishlist(); }));
    const n = body.querySelector('#wlNotif'); if(n) n.addEventListener('click', ()=>{ try{ Notification.requestPermission().then(()=> openWishlist()); }catch(e){} });
    refreshWishlist().then(()=>{ if(document.getElementById('xWish').classList.contains('show')) { /* dati aggiornati al prossimo apri */ } }).catch(()=>{});
  }

  // =====================================================================
  // 5) TRAGUARDI (calcolati dai tuoi dati, nessuna rete)
  // =====================================================================
  const hoursOfItem = g=> g.hours || 0;
  const BADGES = [
    ['first', '🎬', 'Si comincia', 'Completa il primo titolo', s=> s.done >= 1],
    ['d10', '🥉', 'Appassionato', '10 titoli completati', s=> s.done >= 10],
    ['d25', '🥈', 'Otaku', '25 titoli completati', s=> s.done >= 25],
    ['d50', '🥇', 'Leggenda', '50 titoli completati', s=> s.done >= 50],
    ['d100', '👑', 'Maestro dei tier', '100 titoli completati', s=> s.done >= 100],
    ['splus', '💎', 'Solo il meglio', '5 titoli S+ completati', s=> s.splus >= 5],
    ['anime10', '📺', 'Maratoneta', '10 serie anime completate', s=> s.anime >= 10],
    ['manga10', '📚', 'Divoratore di volumi', '10 manga completati', s=> s.manga >= 10],
    ['film10', '🎞️', 'Cinefilo d\'animazione', '10 film completati', s=> s.film >= 10],
    ['both', '🔁', 'Doppia lettura', 'Completa sia un manga sia il suo anime', s=> s.both >= 1],
    ['studios', '🏰', 'Giro degli studi', 'Film completati di 5 studi diversi', s=> s.studios >= 5],
    ['retro', '📼', 'Anima retrò', 'Un titolo prima del 1990 completato', s=> s.retro >= 1],
    ['decades', '⏳', 'Viaggiatore del tempo', 'Titoli completati di 4 decenni diversi', s=> s.decades >= 4],
    ['genres', '🧭', 'Esploratore', 'Titoli completati di 8 generi diversi', s=> s.genres >= 8],
    ['long', '🏔️', 'Epopea', 'Un titolo da 300+ ore completato', s=> s.long >= 1],
    ['fav10', '💖', 'Cuore d\'oro', '10 preferiti', s=> s.favs >= 10],
    ['mt30', '🎯', 'Giudice severo', '30 titoli spostati nella tua tier list', s=> s.mt >= 30],
    ['wish3', '🎁', 'Sognatore', '3 titoli in wishlist', s=> s.wish >= 3]
  ];
  function badgeStats(){
    const done = ITEMS.filter(g=> STATUSES[g.id] === 'done');
    const decs = new Set(done.map(g=> Math.floor((g.y || 0) / 10))), gens = new Set(); done.forEach(g=> (g.tags || []).forEach(t=> gens.add(t)));
    const doneIds = new Set(done.map(g=> g.id));
    return {done: done.length, splus: done.filter(g=> g.tier === 'S+').length, anime: done.filter(g=> g.l === 'anime').length, manga: done.filter(g=> g.l === 'manga' || g.l === 'manhwa').length, film: done.filter(g=> g.l === 'film').length,
      both: done.filter(g=> (g.ad || []).some(a=> a.i && doneIds.has(a.i))).length, studios: new Set(done.filter(g=> g.l === 'film' && g.stk).map(g=> g.stk)).size,
      retro: done.filter(g=> g.y && g.y < 1990).length, decades: decs.size, genres: gens.size, long: done.filter(g=> hoursOfItem(g) >= 300).length, favs: FAVS.size, mt: Object.keys(MYTIER).length, wish: Object.keys(WISH).length};
  }
  function checkBadges(silent){
    const s = badgeStats(), key = profileKey('atl_badges'), seen = lsGet(key, null), now = BADGES.filter(b=> b[4](s)).map(b=> b[0]);
    if(seen === null){ lsSet(key, now); return; }
    const fresh = now.filter(k=> !seen.includes(k));
    if(fresh.length){ lsSet(key, seen.concat(fresh)); if(!silent) fresh.forEach((k, i)=>{ const b = BADGES.find(b=> b[0] === k); setTimeout(()=> toast(`🏆 Traguardo sbloccato: ${b[1]} ${b[2]}`, 4000), i * 4200); }); }
  }
  function openBadges(){
    const s = badgeStats();
    sheet('xBadges', '🏆 Traguardi', '<div class="x-badges">' + BADGES.map(b=>{ const ok = b[4](s); return `<div class="x-badge${ok ? ' ok' : ''}"><span>${b[1]}</span><b>${esc(b[2])}</b><small>${esc(b[3])}</small></div>`; }).join('') + '</div>');
  }
  let bT = 0; const tbody = document.getElementById('tbody');
  if(tbody) new MutationObserver(()=>{ clearTimeout(bT); bT = setTimeout(()=> checkBadges(false), 1500); }).observe(tbody, {childList: true});

  // =====================================================================
  // 6) COLORI DELLA SCHEDA presi dalla copertina
  // =====================================================================
  function tintModal(g){
    const card = document.getElementById('modalCard'); if(!card) return;
    card.classList.remove('x-tinted'); card.style.removeProperty('--x-tint');
    if(!lsGet('atl_cover_tint', false)) return;
    const h = g.c || TIER_COL[g.tier] || '#7c5cff', n = parseInt(h.slice(1), 16);
    card.style.setProperty('--x-tint', `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`); card.classList.add('x-tinted');
  }
  const origOpenModal = window.openModal;
  window.openModal = function(g){ const r = origOpenModal.apply(this, arguments); try{ tintModal(typeof g === 'string' ? byId(g) : g); }catch(e){} return r; };

  // =====================================================================
  // 7) RICERCA A VOCE 🎤 («film Pixar sotto le due ore», «manga di sport completati»…)
  // =====================================================================
  (function voice(){
    const row = document.querySelector('.topbar-row2'), inp = document.getElementById('search');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!row || !inp || !SR) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mic-btn'; btn.id = 'micBtn'; btn.title = 'Cerca a voce'; btn.setAttribute('aria-label', 'Cerca a voce');
    btn.innerHTML = '<svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-mic"/></svg>'; row.appendChild(btn);
    let rec = null;
    btn.addEventListener('click', ()=>{
      if(rec){ try{ rec.stop(); }catch(e){} return; }
      rec = new SR(); rec.lang = 'it-IT'; rec.interimResults = false; rec.maxAlternatives = 1; btn.classList.add('on');
      rec.onresult = async ev=>{ const text = ev.results[0][0].transcript; await applyVoice(text); };
      rec.onend = ()=>{ rec = null; btn.classList.remove('on'); };
      rec.onerror = ()=>{ rec = null; btn.classList.remove('on'); toast('Non ho sentito bene: riprova'); };
      try{ rec.start(); toast('🎤 Parla pure…', 2000); }catch(e){ rec = null; btn.classList.remove('on'); }
    });
  })();
  async function applyVoice(text){
    const inp = document.getElementById('search');
    if(typeof llmAvailable === 'function' && llmAvailable() && typeof askLLM === 'function'){
      try{
        const studios = Object.values(STUDIO_INFO).map(s=> s.k + '=' + s.n).join('; ');
        const prompt = `Trasforma la richiesta dell'utente in filtri per un elenco di anime, film d'animazione e manga. Rispondi SOLO con un oggetto JSON con questi campi opzionali: search (testo libero da cercare nel titolo), list (uno tra anime, film, manga, manhwa, all), tags (array di codici genere tra: ${Object.keys(TAG_INFO).filter(c=> !c.startsWith('studio:')).join(',')}), studio (una chiave tra: ${studios}), minTier (S, A, B o C), len (short, mid o long), status (done, now, plan, drop, none), air (F concluso, R in corso). Richiesta: «${text}»`;
        const r = await askLLM(prompt, {}, {fast: true, silent: true, label: 'Capisco cosa cerchi…'});
        const m = String(r.text).match(/\{[\s\S]*\}/); const o = JSON.parse(m[0]);
        state = Object.assign(freshState(), {view: state.view});
        if(o.list && (LIST_BY_ID[o.list] || o.list === 'all')){ ACTIVE_LIST = o.list; saveLists(); renderListBar(); }
        state.search = o.search || ''; inp.value = state.search;
        if(Array.isArray(o.tags)) o.tags.filter(c=> TAG_INFO[c]).forEach(c=> state.tags.add(c));
        if(o.studio && STUDIO_INFO[o.studio]) state.studio = o.studio;
        if(['S','A','B','C'].includes(o.minTier)) state.minTier = o.minTier;
        if(['short','mid','long'].includes(o.len)) state.len = o.len;
        if(['done','now','plan','drop','none'].includes(o.status)) state.status = o.status;
        if(['F','R'].includes(o.air)) state.air = o.air;
        ['minTier','len','status','air','studio'].forEach(k=>{ const id = {minTier:'scoreFilter', len:'lenFilter', status:'statusFilter', air:'airFilter', studio:'studioFilter'}[k]; const el = document.getElementById(id); if(el) el.value = state[k]; });
        renderStudioFilter(); renderStats(); renderTagChips(); render(); syncQuick(); if(state.view !== 'list') setView('list');
        toast(`🎤 «${text}»`, 3500); return;
      }catch(e){}
    }
    inp.value = text; state.search = text; if(state.view !== 'list') setView('list'); else render();
    toast(`🎤 Cerco «${text}»`);
  }

  // =====================================================================
  // 8) LE MIE VIBES (in «Scopri»): preferiti Top + consigli per atmosfera
  // =====================================================================
  let vibesOpen = false, vibesOut = lsGet(profileKey('atl_vibes_results'), []), vibesBusy = false;
  PROFILE_RELOADERS.push(()=>{ vibesOut = lsGet(profileKey('atl_vibes_results'), []); });
  function similarityToFavs(g, favs){
    let best = 0, bestFav = null; const why = [];
    favs.forEach(f=>{
      if(f.id === g.id) return;
      const a = new Set(g.tags), b = new Set(f.tags), inter = [...a].filter(t=> b.has(t)), uni = new Set([...a, ...b]);
      let sc = uni.size ? inter.length / uni.size : 0;
      if(g.sg && g.sg === f.sg) sc += 0.3; if(g.who && f.who && g.who === f.who) sc += 0.15;
      if(g.y && f.y && Math.abs(g.y - f.y) <= 6) sc += 0.05;
      if((g.rec || []).includes(f.id) || (f.rec || []).includes(g.id)) sc += 0.25;
      if(sc > best){ best = sc; bestFav = f; }
    });
    return {sc: best, fav: bestFav};
  }
  window.vibesHtml = function(){
    const favs = ITEMS.filter(g=> FAVS.has(g.id));
    if(!favs.length) return `<div class="vibes-box"><div class="lp-sub">❤️ <b>Le mie vibes</b>: segna qualche preferito (★) e qui trovi consigli su misura.</div></div>`;
    const top = favs.slice().sort((a, b)=> b.score - a.score).slice(0, 8);
    const loc = ITEMS.filter(g=> !FAVS.has(g.id) && !STATUSES[g.id]).map(g=> ({g, ...similarityToFavs(g, favs)})).filter(o=> o.sc >= .3).sort((a, b)=> b.sc - a.sc).slice(0, 8);
    return `<div class="vibes-box"><details ${vibesOpen ? 'open' : ''} id="vibesDet"><summary>❤️ <b>Le mie vibes</b> · ${favs.length} preferiti</summary>
      <div class="lp-sub">I tuoi preferiti Top</div><div class="similar-games">${top.map(g=> chipOf(g)).join('')}</div>
      <div class="lp-sub" style="margin-top:8px;">Nel tuo database, simili ai tuoi preferiti</div>
      <div class="similar-games">${loc.map(o=> `<button class="similar-chip" data-id="${esc(o.g.id)}" title="Simile a ${esc(o.fav ? o.fav.name : '')}"><span class="badge ${TIER_LABEL[o.g.tier]}">${o.g.tier}</span>${esc(o.g.name)}</button>`).join('') || '<small>Nessuno per ora.</small>'}</div>
      <div class="lp-sub" style="margin-top:8px;">Nuovi da fuori (consigli degli utenti di AniList sui tuoi preferiti)</div>
      <div id="vibesOut">${vibesOut.length ? vibesOut.map(vibeRow).join('') : '<small>Premi il pulsante per cercarli.</small>'}</div>
      <button class="btn primary" id="vibesGo">${vibesBusy ? '⏳ Cerco…' : '🦝 Trova nuovi titoli da fuori'}</button></details></div>`;
  };
  const vibeRow = v=> `<div class="saga-miss"><span><b>${esc(v.name)}</b> <small>${esc(v.meta || '')}${v.from ? ' · piace a chi ama ' + esc(v.from) : ''}</small></span>${v.dup ? `<button class="btn" data-open="${esc(v.dup)}">✓ Già in libreria</button>` : `<button class="btn" data-vadd="${v.id}">➕ Aggiungi</button>`}</div>`;
  window.wireVibes = function(panel){
    panel.querySelectorAll('.vibes-box .similar-chip[data-id]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.id); if(g) openModal(g); }));
    const det = panel.querySelector('#vibesDet'); if(det) det.addEventListener('toggle', ()=>{ vibesOpen = det.open; });
    panel.querySelectorAll('#vibesOut [data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.open); if(g) openModal(g); }));
    panel.querySelectorAll('#vibesOut [data-vadd]').forEach(b=> b.addEventListener('click', async ()=>{ b.disabled = true; try{ const d = await AniList.q(`query($id:Int){Media(id:$id){${MEDIA_LITE}}}`, {id: +b.dataset.vadd}); const g = addMediaToLibrary(d.Media); if(g) b.outerHTML = `<button class="btn" data-open="${esc(g.id)}">✓ Aggiunto</button>`; }catch(e){ b.textContent = 'Errore'; } }));
    const go = panel.querySelector('#vibesGo'); if(go) go.addEventListener('click', async ()=>{
      if(vibesBusy) return; vibesBusy = true; vibesOpen = true; go.textContent = '⏳ Cerco…';
      try{
        const favs = ITEMS.filter(g=> FAVS.has(g.id) && g.al).sort((a, b)=> b.score - a.score).slice(0, 6), found = new Map();
        for(const f of favs){
          const d = await AniList.q(`query($id:Int){Media(id:$id){recommendations(sort:RATING_DESC,perPage:8){nodes{rating mediaRecommendation{id type format title{romaji english} startDate{year} averageScore}}}}}}`, {id: f.al});
          (((d.Media || {}).recommendations || {}).nodes || []).forEach(n=>{ const r = n.mediaRecommendation; if(!r || n.rating < 1 || found.has(r.id)) return; const dup = ITEMS.find(x=> x.al === r.id); if(dup && (FAVS.has(dup.id) || STATUSES[dup.id])) return; found.set(r.id, {id: r.id, name: r.title.english || r.title.romaji, meta: `${FORMAT_LABEL[r.format] || ''} ${r.startDate && r.startDate.year || ''}${r.averageScore != null ? ' · ' + r.averageScore + '/100' : ''}`, from: f.name, dup: dup ? dup.id : null, n: n.rating}); });
        }
        vibesOut = [...found.values()].sort((a, b)=> b.n - a.n).slice(0, 14); lsSet(profileKey('atl_vibes_results'), vibesOut);
      }catch(e){ toast('AniList non risponde ora: riprova tra poco'); }
      vibesBusy = false; if(state.view === 'discover') renderDiscoverCard();
    });
  };

  // =====================================================================
  // AVVIO degli extra
  // =====================================================================
  document.documentElement.classList.toggle('no-row-th', !lsGet('atl_row_thumbs', true));
  window.bootExtras = function(){ syncMode(); setTimeout(()=>{ checkBadges(true); window.releaseAlerts(); }, 2500); };
})();
