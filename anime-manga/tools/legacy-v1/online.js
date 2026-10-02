// Online: AniList (ricerca, novità, dettagli), locandine e trame da Wikipedia, titoli aggiunti dall'utente, controllo doppioni, saghe incomplete.
// Ogni chiamata a un sito esterno passa da netJson(): usa SearchHub (sources.js) se c'è, altrimenti fetch con nuovi tentativi.
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
function sheet(id, title, bodyHtml){
  let el = document.getElementById(id);
  if(!el){ el = document.createElement('div'); el.id = id; el.className = 'dup-backdrop x-sheet'; document.body.appendChild(el);
    el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-x-close]')) el.classList.remove('show'); }); }
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>${title}</b><button class="btn" data-x-close>Chiudi</button></div><div class="x-body">${bodyHtml}</div></div>`;
  el.classList.add('show');
  return el.querySelector('.x-body');
}
async function netJson(url, opts){
  if(window.SearchHub && SearchHub.json) return SearchHub.json(url, opts);
  let last;
  for(let a = 1; a <= 3; a++){
    try{
      const ctl = new AbortController(), t = setTimeout(()=> ctl.abort(), 15000);
      const r = await fetch(url, Object.assign({signal: ctl.signal}, opts || {})); clearTimeout(t);
      if(r.status === 429){ await sleep(2500 * a); continue; }
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    }catch(e){ last = e; await sleep(700 * a); }
  }
  throw last || new Error('rete');
}

// ---- AniList (GraphQL, gratuito, senza chiave): massimo ~26 richieste al minuto ----
const AniList = (function(){
  const stamps = [], cache = new Map();
  async function q(query, vars, opts){
    opts = opts || {};
    const key = JSON.stringify([query, vars]);
    if(opts.cache !== false && cache.has(key)) return cache.get(key);
    const p = (async ()=>{
      for(let attempt = 1; attempt <= 3; attempt++){
        const now = Date.now(); while(stamps.length && now - stamps[0] > 60000) stamps.shift();
        if(stamps.length >= 26) await sleep(60000 - (now - stamps[0]) + 250);
        stamps.push(Date.now());
        let res;
        try{
          if(window.DebugLog) DebugLog.add('AniList', 'richiesta', JSON.stringify(vars || {}).slice(0, 80));
          res = await fetch('https://graphql.anilist.co', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({query, variables: vars}), signal: opts.signal});
        }catch(e){ if(opts.signal && opts.signal.aborted) throw e; await sleep(900 * attempt); continue; }
        if(res.status === 429){ const ra = +res.headers.get('retry-after') || 30; if(window.DebugLog) DebugLog.add('AniList', '429', 'attesa ' + ra + 's'); await sleep(Math.min(70, ra) * 1000 + 400); continue; }
        if(!res.ok){ if(res.status >= 500){ await sleep(1200 * attempt); continue; } const e = new Error('AniList HTTP ' + res.status); e.status = res.status; throw e; }
        const j = await res.json();
        if(j.errors && !j.data){ const e = new Error((j.errors[0] && j.errors[0].message) || 'errore AniList'); throw e; }
        return j.data;
      }
      throw new Error('AniList non risponde');
    })();
    if(opts.cache !== false){ cache.set(key, p); p.catch(()=> cache.delete(key)); }
    return p;
  }
  return {q};
})();
const MEDIA_LITE = `id idMal type format status countryOfOrigin isAdult title{romaji english native} synonyms startDate{year month} endDate{year}
  chapters volumes episodes duration averageScore meanScore popularity favourites genres tags{name rank isMediaSpoiler}
  coverImage{large medium color} studios(isMain:true){nodes{name}} staff(perPage:3,sort:RELEVANCE){edges{role node{name{full}}}}
  source description(asHtml:false) nextAiringEpisode{episode airingAt} season seasonYear`;
const stripHtmlTags = s=> String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/\(Source:[^)]*\)|\[Written by[^\]]*\]/gi, '').trim();
const normTitle = s=> searchNorm(s).replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

// ---- Da un titolo AniList a una voce della libreria (stesse regole dello script di costruzione) ----
function tagsFromMedia(m){
  const rank = new Map((m.tags || []).filter(t=> !t.isMediaSpoiler).map(t=> [t.name, t.rank]));
  const def = c=> AM.tags.find(x=> x.c === c);
  const genres = AM.genreOrder.filter(c=>{ const d = def(c); return d && d.r && d.r.g && (m.genres || []).includes(d.r.g); }).slice(0, 5);
  const themes = [];
  AM.tags.forEach(d=>{ if(!d.r || !d.r.t || d.g === 'Pubblico') return; const best = Math.max(0, ...d.r.t.map(n=> rank.get(n) || 0)); if(best >= (d.r.min || 65)) themes.push([d.c, best]); });
  themes.sort((a, b)=> b[1] - a[1]);
  const aud = AM.audience.find(c=>{ const d = def(c); return d && d.r && d.r.t && d.r.t.some(n=> (rank.get(n) || 0) >= 50); });
  return [...genres, ...themes.slice(0, 3).map(x=> x[0]), aud].filter(Boolean);
}
const SRC_IT = {MANGA:'Manga', LIGHT_NOVEL:'Light novel', NOVEL:'Romanzo', WEB_NOVEL:'Web novel', VISUAL_NOVEL:'Visual novel', VIDEO_GAME:'Videogioco', GAME:'Videogioco', COMIC:'Fumetto', DOUJINSHI:'Doujinshi'};
function listOfMedia(m){
  if(m.type === 'ANIME') return m.format === 'MOVIE' ? 'film' : 'anime';
  return ['KR', 'CN', 'TW'].includes(m.countryOfOrigin) ? 'manhwa' : 'manga';
}
function itemFromMedia(m){
  const isAnime = m.type === 'ANIME', l = listOfMedia(m);
  const en = (m.title.english || m.title.romaji || '').trim();
  const g = {id: (isAnime ? 'a' : 'm') + m.id, al: m.id, l, f: m.format, name: en, custom: true, added: new Date().toISOString().slice(0, 10)};
  if(m.idMal) g.mal = m.idMal;
  const jp = (m.title.romaji || '').trim(); if(jp && normTitle(jp) !== normTitle(en)) g.jp = jp;
  const alt = []; (m.synonyms || []).concat([m.title.english, m.title.romaji]).forEach(x=>{ x = (x || '').trim(); if(x && /^[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(x) && normTitle(x) !== normTitle(en) && !alt.some(a=> normTitle(a) === normTitle(x))) alt.push(x); });
  if(alt.length) g.alt = alt.slice(0, 5);
  if(isAnime){
    const st = (m.studios && m.studios.nodes || []).map(s=> s.name); if(st.length) g.who = st.slice(0, 2).join(' + ');
    if(m.episodes) g.n = m.episodes; if(m.duration) g.d = m.duration;
  } else {
    const a = []; ((m.staff && m.staff.edges) || []).forEach(e=>{ if(/story|art|original|creator/i.test(e.role || '') && !a.includes(e.node.name.full)) a.push(e.node.name.full); });
    if(a.length) g.who = a.slice(0, 2).join(' e ');
    if(m.chapters) g.ch = m.chapters; if(m.volumes) g.v = m.volumes;
  }
  g.y = m.startDate && m.startDate.year || new Date().getFullYear();
  const rel = m.status === 'RELEASING' || m.status === 'NOT_YET_RELEASED';
  if(!rel && m.endDate && m.endDate.year && m.endDate.year !== g.y) g.y2 = m.endDate.year;
  g.st = m.status === 'RELEASING' ? 'R' : m.status === 'HIATUS' ? 'H' : 'F';
  if(m.averageScore != null){ g.score = m.averageScore; g.m = 'V'; g.sc = 'al'; }
  else { g.score = m.meanScore || 70; g.m = 'S'; }
  g.pop = m.popularity || 0; g.fav = m.favourites || 0;
  g.tier = tierOfScore(g.score, l);
  g.tags = tagsFromMedia(m);
  const src = SRC_IT[m.source]; if(src && (isAnime || src !== 'Manga')) g.src = src;
  const cm = ((m.coverImage && (m.coverImage.large || m.coverImage.medium)) || '').match(/\/media\/(?:anime|manga)\/cover\/[a-zA-Z]+\/([^/]+)$/);
  if(cm) g.img = cm[1]; if(m.coverImage && m.coverImage.color) g.c = m.coverImage.color;
  const d = stripHtmlTags(m.description); if(d) g.descEn = d.slice(0, 700);
  return g;
}
function findDuplicateItem(m){
  const id = m.id, names = [m.title.english, m.title.romaji, m.title.native].concat(m.synonyms || []).filter(Boolean).map(normTitle);
  for(const g of ITEMS){
    if(g.al === id) return g;
    if(g.seasons && g.seasons.some(s=> s[4] === id)) return g;
  }
  const mainNames = [m.title.english, m.title.romaji].filter(Boolean).map(normTitle);
  for(const g of ITEMS){
    if((g.l === 'film') !== (listOfMedia(m) === 'film') || (g.watch) !== (m.type === 'ANIME')) continue;
    const gn = [g.name, g.jp].concat(g.alt || []).filter(Boolean).map(normTitle);
    if(mainNames.some(n=> n.length > 3 && gn.includes(n))) return g;
  }
  return null;
}
function addMediaToLibrary(m, opts){
  opts = opts || {};
  const dup = findDuplicateItem(m);
  if(dup){ showDuplicateBanner(dup); return dup; }
  const g = itemFromMedia(m);
  addItemToLibrary(g);
  const newLists = ensureGenreLists(g.tags);
  if(opts.status){ STATUSES[g.id] = opts.status; saveStatuses(); }
  renderListBar(); renderStudioFilter(); renderStats(); renderMetrics(); buildSagas();
  if(state.view === 'list') render();
  showAddedBanner(g, newLists);
  if(typeof queueEnrich === 'function') queueEnrich(g.id);
  return g;
}
// avviso «è già nel tuo database»
function showDuplicateBanner(g){
  let el = document.getElementById('dupBanner');
  if(!el){ el = document.createElement('div'); el.id = 'dupBanner'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-dup-close]')) el.classList.remove('show'); }); }
  el.innerHTML = `<div class="dup-card"><div class="dup-icon">⚠️</div><div class="dup-title">È già nel tuo database!</div><div class="dup-name">${escHtml(g.name)}</div><div class="dup-sub">${escHtml(LIST_BY_ID[g.l].full)} · ${escHtml(g.year || '')} · tier ${g.tier}</div><div class="dup-actions"><button class="btn primary" id="dupOpenBtn">Apri la scheda</button><button class="btn" data-dup-close>Chiudi</button></div></div>`;
  el.classList.add('show');
  document.getElementById('dupOpenBtn').onclick = ()=>{ el.classList.remove('show'); const s = document.getElementById('xOnline'); if(s) s.classList.remove('show'); openModal(g); };
}

// ---- Locandine da Wikipedia per i film senza copertina (a gruppi di 50, con memoria nel browser) ----
let wpBusy = false; const wpTried = new Set();
async function queueWikiPosters(list){
  if(wpBusy || !navigator.onLine) return;
  const need = []; const seen = new Set();
  (list || []).slice(0, 220).forEach(g=>{ if(g.enw && !g.pu && WPIMG[g.enw] === undefined && !wpTried.has(g.enw) && !seen.has(g.enw)){ seen.add(g.enw); need.push(g.enw); } });
  if(!need.length) return;
  wpBusy = true;
  try{
    let got = 0;
    for(let i = 0; i < need.length; i += 50){
      const chunk = need.slice(i, i + 50); chunk.forEach(t=> wpTried.add(t));
      const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', titles: chunk.join('|'), prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '330', redirects: '1', format: 'json', formatversion: '2', origin: '*'});
      let j; try{ j = await netJson(url); }catch(e){ break; }
      const q = (j && j.query) || {}, norm = {}, redir = {}, pages = {};
      (q.normalized || []).forEach(n=>{ norm[n.from] = n.to; }); (q.redirects || []).forEach(n=>{ redir[n.from] = n.to; }); (q.pages || []).forEach(p=>{ pages[p.title] = p; });
      chunk.forEach(t=>{
        const p = pages[redir[norm[t] || t] || norm[t] || t];
        if(p && p.thumbnail && p.thumbnail.source){ const m = p.thumbnail.source.match(/\/wikipedia\/(.+)$/); if(m){ WPIMG[t] = m[1].replace(/\/\d+px-/, '/{w}px-'); got++; } }
        else if(p && !p.missing) WPIMG[t] = 0;
      });
      lsSet('atl_wpimg', WPIMG);
      if(got){ refreshCovers(); }
      await sleep(900);
    }
  } finally { wpBusy = false; }
}
function refreshCovers(){
  // aggiorna le miniature già disegnate senza ridisegnare la lista
  document.querySelectorAll('[data-cover-id]').forEach(el=>{
    const g = byId(el.dataset.coverId); if(!g) return; const u = coverUrl(g, el.dataset.coverSize || 'medium');
    if(u && !el.querySelector('img')) el.insertAdjacentHTML('afterbegin', `<img src="${escHtml(u)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`);
  });
  if(state.view === 'list' && typeof renderAlt === 'function' && document.getElementById('altView').style.display !== 'none') renderAlt();
}
function onListRendered(list){ try{ queueWikiPosters(list); }catch(e){} }

// ---- Trama in italiano da Wikipedia (quando non ne ho scritta una) ----
async function loadWikiStory(g){
  const box = document.getElementById('storyPlaceholder'); if(!box) return;
  const cached = lsGet('atl_wikistory', {})[g.id];
  const show = (t, u)=>{ box.className = 'modal-story'; box.innerHTML = `${escHtml(t)}<div class="cover-hint" style="text-align:left;margin-top:6px;">Da <a href="${escHtml(u)}" target="_blank" rel="noopener">Wikipedia (it)</a> · testo CC BY-SA. Non è la mia trama: può contenere anticipazioni.</div>`; };
  if(cached){ show(cached.t, cached.u); return; }
  box.innerHTML = 'Cerco su Wikipedia…';
  try{
    let title = g.itw;
    if(!title){
      const kw = g.l === 'film' ? 'film d\'animazione' : g.watch ? 'anime' : 'manga';
      const j = await netJson('https://it.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', list: 'search', srsearch: (g.itn || g.name) + ' ' + kw, srlimit: '3', format: 'json', formatversion: '2', origin: '*'}));
      const n = normTitle(g.itn || g.name);
      const hit = ((j.query && j.query.search) || []).find(x=> normTitle(x.title.replace(/\s*\([^)]*\)$/, '')) === n || normTitle(x.title).startsWith(n));
      title = hit && hit.title;
    }
    if(!title) throw new Error('nessuna voce');
    const j2 = await netJson('https://it.wikipedia.org/w/api.php?' + new URLSearchParams({action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', exchars: '900', redirects: '1', titles: title, format: 'json', formatversion: '2', origin: '*'}));
    const p = j2.query && j2.query.pages && j2.query.pages[0];
    if(!p || p.missing || !p.extract) throw new Error('vuota');
    const url = 'https://it.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_'));
    const all = lsGet('atl_wikistory', {}); all[g.id] = {t: p.extract.trim(), u: url}; lsSet('atl_wikistory', all);
    show(p.extract.trim(), url);
  }catch(e){
    box.innerHTML = `Non ho trovato una voce in italiano.${g.descEn ? `<div class="modal-note" style="margin-top:8px;"><b>Trama (inglese, AniList):</b> ${escHtml(g.descEn)}</div>` : ''}`;
  }
}

// ---- Dettagli dal vivo di AniList nella scheda: streaming, trailer, prossima puntata, personaggi, staff, consigli ----
const LIVE_Q = `query($id:Int){Media(id:$id){id status nextAiringEpisode{episode airingAt} trailer{id site} siteUrl
  externalLinks{site url type language isDisabled} rankings{rank type allTime context}
  characters(sort:[ROLE,RELEVANCE],perPage:8){edges{role node{name{full} image{medium}}}}
  staff(sort:RELEVANCE,perPage:8){edges{role node{name{full}}}}
  recommendations(sort:RATING_DESC,perPage:6){nodes{rating mediaRecommendation{id idMal type format title{romaji english} coverImage{medium} averageScore startDate{year}}}}}}`;
const ROLE_IT = [[/^original creator|^original story/i, 'autore originale'], [/^story & art/i, 'storia e disegni'], [/^story/i, 'storia'], [/^art/i, 'disegni'], [/^director/i, 'regia'], [/^series composition/i, 'composizione della serie'], [/^character design/i, 'character design'], [/^music|^composer/i, 'musiche'], [/^script|^screenplay/i, 'sceneggiatura'], [/^sound director/i, 'direzione del suono'], [/^art director/i, 'direzione artistica'], [/^chief animation director/i, 'direzione animazione'], [/^supervisor|^supervis/i, 'supervisione'], [/^producer/i, 'produzione'], [/^editing/i, 'montaggio'], [/^cinematography/i, 'fotografia'], [/^theme song/i, 'sigla']];
const roleIt = r=>{ r = String(r || ''); for(const [re, t] of ROLE_IT) if(re.test(r)) return t; return r.toLowerCase(); };
const rankIt = c=>{
  c = String(c || '');
  let m;
  if(/^highest rated all time/i.test(c)) return 'più votato di sempre';
  if(/^most popular all time/i.test(c)) return 'più popolare di sempre';
  if((m = c.match(/^highest rated (\d{4})/i))) return 'più votato del ' + m[1];
  if((m = c.match(/^most popular (\d{4})/i))) return 'più popolare del ' + m[1];
  if((m = c.match(/^highest rated (?:on )?(.+?)( all time)?$/i))) return 'più votato: ' + m[1];
  return c.toLowerCase();
};
const LIVE_TTL = 6 * 3600 * 1000;
async function fetchLive(g){
  const key = 'atl_live_' + g.al, c = lsGet(key, null);
  if(c && Date.now() - c.t < LIVE_TTL) return c.d;
  const d = await AniList.q(LIVE_Q, {id: g.al});
  lsSet(key, {t: Date.now(), d: d.Media});
  return d.Media;
}
function liveHtml(g, m){
  const parts = [];
  const links = (m.externalLinks || []).filter(l=> !l.isDisabled);
  const stream = links.filter(l=> l.type === 'STREAMING');
  if(m.nextAiringEpisode){ const dt = new Date(m.nextAiringEpisode.airingAt * 1000); parts.push(`<div class="live-row">📡 <b>Prossima puntata:</b> episodio ${m.nextAiringEpisode.episode}, ${dt.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long'})} alle ${dt.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}</div>`); }
  const btns = [];
  if(m.trailer && m.trailer.site === 'youtube') btns.push(`<a class="cover-pill" href="https://www.youtube.com/watch?v=${encodeURIComponent(m.trailer.id)}" target="_blank" rel="noopener">▶️ Trailer ufficiale</a>`);
  stream.forEach(l=> btns.push(`<a class="cover-pill" href="${escHtml(l.url)}" target="_blank" rel="noopener">📺 ${escHtml(l.site)}${l.language ? ' <small>(' + escHtml(l.language) + ')</small>' : ''}</a>`));
  links.filter(l=> l.type === 'INFO' && /official|sito/i.test(l.site)).slice(0, 1).forEach(l=> btns.push(`<a class="cover-pill" href="${escHtml(l.url)}" target="_blank" rel="noopener">🌐 ${escHtml(l.site)}</a>`));
  if(btns.length) parts.push(`<div class="live-row"><b>Streaming e link ufficiali (da AniList)</b> <small>— link internazionali: in Italia la disponibilità può cambiare</small></div><div class="cover-tools" style="justify-content:flex-start;">${btns.join('')}</div>`);
  const ch = (m.characters && m.characters.edges) || [];
  if(ch.length) parts.push(`<div class="live-row"><b>👥 Personaggi principali</b></div><div class="chars">${ch.map(e=> `<div class="char"><img src="${escHtml(e.node.image && e.node.image.medium || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span>${escHtml(e.node.name.full)}</span><small>${e.role === 'MAIN' ? 'Protagonista' : 'Comprimario'}</small></div>`).join('')}</div>`);
  const stf = ((m.staff && m.staff.edges) || []).slice(0, 6);
  if(stf.length) parts.push(`<div class="live-row"><b>🎬 Staff:</b> ${stf.map(e=> `${escHtml(e.node.name.full)} <small>(${escHtml(roleIt(e.role))})</small>`).join(' · ')}</div>`);
  const rk = (m.rankings || []).filter(r=> r.allTime).slice(0, 2);
  if(rk.length) parts.push(`<div class="live-row">🏅 ${rk.map(r=> `#${r.rank} ${escHtml(rankIt(r.context))}`).join(' · ')} <small>(su AniList)</small></div>`);
  const recs = ((m.recommendations && m.recommendations.nodes) || []).filter(n=> n.mediaRecommendation && n.rating > 0);
  if(recs.length) parts.push(`<div class="live-row"><b>💬 Consigliati dagli utenti di AniList</b></div><div class="similar-games">${recs.map(n=>{
    const r = n.mediaRecommendation, dup = ITEMS.find(x=> x.al === r.id);
    const name = escHtml(r.title.english || r.title.romaji);
    return dup ? `<button class="similar-chip" data-id="${escHtml(dup.id)}"><span class="badge ${TIER_LABEL[dup.tier]}">${dup.tier}</span>${name}</button>` : `<button class="similar-chip live-add" data-al="${r.id}" title="Non è nella tua libreria: tocca per aggiungerlo">➕ ${name}${r.startDate && r.startDate.year ? ' (' + r.startDate.year + ')' : ''}</button>`; }).join('')}</div>`);
  return parts.join('') || '<div class="live-row">Nessun dettaglio aggiuntivo su AniList.</div>';
}
async function loadLiveDetails(g){
  const box = document.getElementById('liveBox'); if(!box || !g.al || !navigator.onLine){ if(box && !g.al) box.innerHTML = g.imdb ? '<div class="cover-hint" style="text-align:left;">Per questo film trovi cast, trailer e dove vederlo su <a href="https://www.imdb.com/title/tt' + String(g.imdb).padStart(7, '0') + '/" target="_blank" rel="noopener">IMDb</a>.</div>' : ''; return; }
  box.innerHTML = '<div class="live-row live-loading">📡 Carico i dettagli da AniList…</div>';
  try{
    const m = await fetchLive(g);
    if(!document.getElementById('liveBox') || document.getElementById('liveBox').dataset.id !== String(g.id)) return;
    box.innerHTML = '<div class="glabel-title" style="margin-top:10px; border-top:2px solid var(--text); padding-top:6px; border-bottom:none;">Dal vivo su AniList</div>' + liveHtml(g, m);
    box.querySelectorAll('.similar-chip[data-id]').forEach(b=> b.addEventListener('click', ()=>{ const x = byId(b.dataset.id); if(x) openModal(x); }));
    box.querySelectorAll('.live-add').forEach(b=> b.addEventListener('click', async ()=>{
      b.disabled = true; b.textContent = '…';
      try{ const d = await AniList.q(`query($id:Int){Media(id:$id){${MEDIA_LITE}}}`, {id: +b.dataset.al}); const x = addMediaToLibrary(d.Media); if(x && !x.dup) b.textContent = '✓ Aggiunto'; }catch(e){ b.textContent = 'Errore'; }
    }));
  }catch(e){ box.innerHTML = '<div class="live-row cover-hint" style="text-align:left;">Dettagli dal vivo non disponibili ora (AniList non risponde o sei offline).</div>'; }
}

// ---- Cerca online e aggiungi (AniList) ----
let onlineType = 'ALL';
function mediaRowHtml(m){
  const dup = findDuplicateItem(m), l = listOfMedia(m);
  const name = m.title.english || m.title.romaji;
  const cover = m.coverImage && (m.coverImage.medium || m.coverImage.large);
  const meta = [FORMAT_LABEL[m.format] || m.format, m.startDate && m.startDate.year, m.episodes ? m.episodes + ' ep' : (m.chapters ? m.chapters + ' cap' : ''), (m.studios && m.studios.nodes[0] && m.studios.nodes[0].name) || ''].filter(Boolean).join(' · ');
  return `<div class="ol-row" data-mid="${m.id}"><div class="ol-cover">${cover ? `<img src="${escHtml(cover)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
    <div class="ol-info"><div class="ol-name">${escHtml(name)}</div><div class="ol-meta">${escHtml(meta)}</div>
    <div class="ol-meta">${m.averageScore != null ? `<b>${m.averageScore}</b>/100 su AniList` : '<i>ancora senza voto</i>'} · ${escHtml(LIST_BY_ID[l].label)}</div>
    <div class="modal-tags">${tagPills({tags: tagsFromMedia(m)}, 3)}</div></div>
    <div class="ol-act">${dup ? `<button class="btn" data-open="${escHtml(dup.id)}">✓ Già in libreria</button>` : `<button class="btn primary" data-add="${m.id}">➕ Aggiungi</button>`}</div></div>`;
}
async function runOnlineSearch(body, q){
  const out = body.querySelector('#olResults'); if(!q.trim()){ out.innerHTML = ''; return; }
  out.innerHTML = '<div class="lp-sub">🔎 Cerco su AniList…</div>';
  try{
    const vars = {q: q.trim(), t: onlineType === 'ALL' ? null : onlineType};
    const data = await AniList.q(`query($q:String,$t:MediaType){Page(perPage:12){media(search:$q,type:$t,isAdult:false,sort:SEARCH_MATCH){${MEDIA_LITE}}}}`, vars);
    const list = data.Page.media;
    body._media = new Map(list.map(m=> [String(m.id), m]));
    out.innerHTML = list.length ? list.map(mediaRowHtml).join('') : '<div class="lp-sub">Nessun risultato su AniList. Prova con il titolo originale o in inglese.</div>';
    out.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const m = body._media.get(b.dataset.add); const g = addMediaToLibrary(m); if(g && g.al === m.id){ b.outerHTML = `<button class="btn" data-open="${escHtml(g.id)}">✓ Aggiunto</button>`; out.querySelectorAll(`[data-open="${g.id}"]`).forEach(x=> x.onclick = ()=>{ document.getElementById('xOnline').classList.remove('show'); openModal(g); }); } }));
    out.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.open); if(g){ document.getElementById('xOnline').classList.remove('show'); openModal(g); } }));
  }catch(e){ out.innerHTML = '<div class="lp-sub">Ricerca non riuscita (AniList non risponde o sei offline). Riprova tra poco.</div>'; }
}
function openOnlineSearch(q){
  const body = sheet('xOnline', '🌐 Cerca su AniList e aggiungi', `
    <div class="lp-sub">Trova qualunque anime, film anime, manga o manhwa e aggiungilo alla tua libreria con voto, tier, generi e copertina veri. I film d'animazione occidentali sono già tutti nel database: cercali dalla barra in alto.</div>
    <div class="ol-search"><input id="olInput" type="search" placeholder="Titolo (anche in giapponese romanizzato)…" autocomplete="off" value="${escHtml(q || '')}"><button class="btn primary" id="olGo">Cerca</button></div>
    <div class="tagchips" id="olType">${[['ALL','Tutto'],['ANIME','📺 Anime e film'],['MANGA','📚 Manga e manhwa']].map(([k, l])=> `<div class="tagchip ${onlineType === k ? 'active' : ''}" data-t="${k}">${l}</div>`).join('')}</div>
    <div id="olResults"></div>`);
  const inp = body.querySelector('#olInput'), go = ()=> runOnlineSearch(body, inp.value);
  body.querySelector('#olGo').onclick = go;
  inp.addEventListener('keydown', e=>{ if(e.key === 'Enter') go(); });
  body.querySelector('#olType').addEventListener('click', e=>{ const c = e.target.closest('[data-t]'); if(!c) return; onlineType = c.dataset.t; body.querySelectorAll('#olType .tagchip').forEach(x=> x.classList.toggle('active', x === c)); go(); });
  if(q) go(); else setTimeout(()=> inp.focus(), 50);
}
document.getElementById('onlineBtn').addEventListener('click', ()=> openOnlineSearch(state.search || ''));

// ---- «Titoli mancanti» di una saga (relazioni di AniList) ----
async function sagaFindMissing(key, host){
  const s = SAGAS[key]; if(!s) return;
  host.innerHTML = '<div class="lp-sub">🦝 Il procione cerca gli altri titoli della saga…</div>';
  const ids = s.items.filter(g=> g.al).slice(0, 3);
  if(!ids.length){ host.innerHTML = '<div class="lp-sub">Questa saga non ha titoli con collegamenti AniList da esplorare.</div>'; return; }
  try{
    const found = new Map();
    for(const g of ids){
      const d = await AniList.q(`query($id:Int){Media(id:$id){relations{edges{relationType node{${MEDIA_LITE}}}}}}`, {id: g.al});
      ((d.Media && d.Media.relations && d.Media.relations.edges) || []).forEach(e=>{
        if(!['PREQUEL','SEQUEL','SIDE_STORY','SPIN_OFF','PARENT','ADAPTATION','SOURCE','ALTERNATIVE'].includes(e.relationType)) return;
        const n = e.node; if(!n || n.isAdult || !['TV','TV_SHORT','MOVIE','ONA','OVA','MANGA','ONE_SHOT'].includes(n.format)) return;
        if(!findDuplicateItem(n) && !found.has(n.id)) found.set(n.id, {n, rel: e.relationType});
      });
    }
    const REL = {PREQUEL:'prequel', SEQUEL:'sequel', SIDE_STORY:'storia parallela', SPIN_OFF:'spin-off', PARENT:'storia principale', ADAPTATION:'adattamento', SOURCE:'opera originale', ALTERNATIVE:'versione alternativa'};
    const arr = [...found.values()].sort((a, b)=> (b.n.popularity || 0) - (a.n.popularity || 0)).slice(0, 10);
    host._m = new Map(arr.map(o=> [String(o.n.id), o.n]));
    host.innerHTML = arr.length ? arr.map(o=> `<div class="saga-miss"><span><b>${escHtml(o.n.title.english || o.n.title.romaji)}</b> <small>${escHtml(REL[o.rel] || '')} · ${escHtml(FORMAT_LABEL[o.n.format] || '')} ${o.n.startDate && o.n.startDate.year || ''}${o.n.averageScore != null ? ' · ' + o.n.averageScore + '/100' : ''}</small></span><button class="btn" data-add="${o.n.id}">➕ Aggiungi</button></div>`).join('') : '<div class="lp-sub">Nessun titolo mancante trovato ✅</div>';
    host.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const m = host._m.get(b.dataset.add); const g = addMediaToLibrary(m); if(g && g.al === m.id) b.closest('.saga-miss').remove(); }));
  }catch(e){ host.innerHTML = '<div class="lp-sub">Ricerca non riuscita: riprova tra poco.</div>'; }
}

// ---- Novità: in onda, in arrivo, di tendenza, manga del momento ----
const SEASON_IT = {WINTER:'Inverno', SPRING:'Primavera', SUMMER:'Estate', FALL:'Autunno'};
function seasonOffset(off){
  const d = new Date(), idx = Math.floor(d.getMonth() / 3) + off, names = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  return {season: names[((idx % 4) + 4) % 4], year: d.getFullYear() + Math.floor(idx / 4)};
}
const NOVITA_TABS = [
  {k:'now',   label:'📡 In onda ora',   q: ()=>{ const s = seasonOffset(0); return {vars:{s: s.season, y: s.year}, kind:'anime', title: `Anime della stagione: ${SEASON_IT[s.season]} ${s.year}`}; }},
  {k:'next',  label:'🔜 In arrivo',     q: ()=>{ const s = seasonOffset(1); return {vars:{s: s.season, y: s.year}, kind:'anime', title: `In arrivo: ${SEASON_IT[s.season]} ${s.year}`}; }},
  {k:'trend', label:'🔥 Di tendenza',   q: ()=> ({vars:{}, kind:'trend', title:'Anime più seguiti in questo momento'})},
  {k:'manga', label:'📚 Manga del momento', q: ()=> ({vars:{}, kind:'manga', title:'Manga in corso più letti ora'})},
  {k:'film',  label:'🎞️ Nuovi film',    q: ()=> ({vars:{}, kind:'film', title:'Film anime recenti e in uscita'})}
];
let NOVITA_CACHE = {}, novitaTab = 'now', novitaLoading = false;
let NOVITA_SKIPPED = new Set();
function loadNovitaSkipped(){ NOVITA_SKIPPED = new Set(lsGet(profileKey('atl_novita_skipped'), []).map(String)); }
loadNovitaSkipped(); PROFILE_RELOADERS.push(loadNovitaSkipped);
function saveNovitaSkipped(){ lsSet(profileKey('atl_novita_skipped'), Array.from(NOVITA_SKIPPED)); }
async function fetchNovita(tab){
  const def = NOVITA_TABS.find(t=> t.k === tab), c = def.q();
  const base = `Page(perPage:40){media(`;
  let query, vars = c.vars;
  if(c.kind === 'anime') query = `query($s:MediaSeason,$y:Int){${base}type:ANIME,season:$s,seasonYear:$y,format_in:[TV,ONA,MOVIE],isAdult:false,sort:POPULARITY_DESC){${MEDIA_LITE}}}}`;
  else if(c.kind === 'trend') query = `query{${base}type:ANIME,format_in:[TV,ONA],isAdult:false,sort:TRENDING_DESC){${MEDIA_LITE}}}}`;
  else if(c.kind === 'manga') query = `query{${base}type:MANGA,status:RELEASING,isAdult:false,sort:TRENDING_DESC){${MEDIA_LITE}}}}`;
  else query = `query($from:FuzzyDateInt){${base}type:ANIME,format:MOVIE,isAdult:false,startDate_greater:$from,sort:POPULARITY_DESC){${MEDIA_LITE}}}}`, vars = {from: (new Date().getFullYear() - 1) * 10000 + 101};
  const d = await AniList.q(query, vars);
  return {title: c.title, list: d.Page.media};
}
function novitaCardHtml(m){
  const dup = findDuplicateItem(m), name = m.title.english || m.title.romaji, l = listOfMedia(m);
  const cover = m.coverImage && (m.coverImage.large || m.coverImage.medium);
  const meta = [FORMAT_LABEL[m.format] || m.format, m.episodes ? m.episodes + ' ep' : (m.chapters ? m.chapters + ' cap' : ''), (m.studios && m.studios.nodes[0] && m.studios.nodes[0].name) || (((m.staff && m.staff.edges[0]) || {node: {name: {}}}).node.name.full || '')].filter(Boolean).join(' · ');
  const next = m.nextAiringEpisode ? `<div class="nv-next">📡 Ep. ${m.nextAiringEpisode.episode}: ${new Date(m.nextAiringEpisode.airingAt * 1000).toLocaleDateString('it-IT', {weekday:'short', day:'numeric', month:'short'})}</div>` : '';
  const d = stripHtmlTags(m.description);
  return `<div class="nv-card" data-mid="${m.id}"><div class="nv-cover"${m.coverImage && m.coverImage.color ? ` style="--tc:${escHtml(m.coverImage.color)}"` : ''}>${cover ? `<img src="${escHtml(cover)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
    <div class="nv-body"><div class="nv-title">${escHtml(name)}</div><div class="nv-meta">${escHtml(meta)}</div>${next}
    <div class="modal-tags">${tagPills({tags: tagsFromMedia(m)}, 3)}</div>
    <div class="nv-score">${m.averageScore != null ? `<span class="badge outline">${m.averageScore}/100</span> <span class="badge ${TIER_LABEL[tierOfScore(m.averageScore, l)]}">${tierOfScore(m.averageScore, l)}</span>` : '<span class="badge outline">senza voto</span>'} <small>${escHtml(LIST_BY_ID[l].label)}</small></div>
    ${d ? `<div class="nv-desc" title="Trama in inglese (AniList)">${escHtml(d.length > 190 ? d.slice(0, 188) + '…' : d)} <small>(EN)</small></div>` : ''}
    <div class="nv-actions">${dup ? `<button class="btn" data-open="${escHtml(dup.id)}">✓ Già in libreria</button>` : `<button class="btn primary" data-add="${m.id}">♥ Aggiungi</button><button class="btn" data-skip="${m.id}" title="Non mi interessa">✕</button>`}<button class="btn" data-wish="${m.id}" title="Wishlist con data di uscita">🎁</button><a class="btn" href="https://anilist.co/${m.type === 'ANIME' ? 'anime' : 'manga'}/${m.id}" target="_blank" rel="noopener">↗</a></div></div></div>`;
}
async function renderNovitaView(){
  const panel = document.getElementById('novitaPanel'); if(!panel) return;
  const tabs = NOVITA_TABS.map(t=> `<button class="qf-chip${novitaTab === t.k ? ' active' : ''}" data-nt="${t.k}">${t.label}</button>`).join('');
  panel.innerHTML = `<div class="novita-wrap"><div class="novita-intro"><div class="novita-intro-icon">✨</div><div><b>Novità da AniList</b><br><small>Titoli in onda, in arrivo e di tendenza: aggiungi alla libreria quelli che ti interessano. Dati in tempo reale, voti aggiornati.</small></div></div>
    <div class="quick-filters" id="novitaTabs">${tabs}</div>
    ${typeof scoutBarHtml === 'function' ? scoutBarHtml() : ''}
    <div id="novitaBody" class="nv-list"><div class="novita-loading">📡 Carico da AniList…</div></div></div>`;
  panel.querySelector('#novitaTabs').addEventListener('click', e=>{ const b = e.target.closest('[data-nt]'); if(b){ novitaTab = b.dataset.nt; renderNovitaView(); } });
  if(typeof wireScoutBar === 'function') wireScoutBar(panel);
  const body = panel.querySelector('#novitaBody');
  try{
    if(!NOVITA_CACHE[novitaTab]) NOVITA_CACHE[novitaTab] = await fetchNovita(novitaTab);
    if(novitaTab !== panel.querySelector('#novitaTabs .active').dataset.nt) return;
    const {title, list} = NOVITA_CACHE[novitaTab];
    const vis = list.filter(m=> !NOVITA_SKIPPED.has(String(m.id)));
    body._media = new Map(list.map(m=> [String(m.id), m]));
    body.innerHTML = `<div class="lp-sub" style="margin:8px 0;"><b>${escHtml(title)}</b> · ${vis.length} titoli${NOVITA_SKIPPED.size ? ` · <a href="#" id="novitaResetSkip">rivedi i ${NOVITA_SKIPPED.size} scartati</a>` : ''}</div>` + (vis.map(novitaCardHtml).join('') || '<div class="lp-sub">Niente da mostrare.</div>');
    const rs = body.querySelector('#novitaResetSkip'); if(rs) rs.onclick = e=>{ e.preventDefault(); NOVITA_SKIPPED.clear(); saveNovitaSkipped(); renderNovitaView(); };
    body.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const m = body._media.get(b.dataset.add); const g = addMediaToLibrary(m, {status: 'plan'}); if(g && g.al === m.id) b.closest('.nv-card').querySelector('.nv-actions').innerHTML = `<button class="btn" data-open="${escHtml(g.id)}">✓ Aggiunto</button>`, body.querySelector(`[data-open="${g.id}"]`).onclick = ()=> openModal(g); }));
    body.querySelectorAll('[data-skip]').forEach(b=> b.addEventListener('click', ()=>{ NOVITA_SKIPPED.add(b.dataset.skip); saveNovitaSkipped(); b.closest('.nv-card').remove(); }));
    body.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.open); if(g) openModal(g); }));
    body.querySelectorAll('[data-wish]').forEach(b=> b.addEventListener('click', ()=>{ const m = body._media.get(b.dataset.wish); if(typeof wishAddMedia === 'function') wishAddMedia(m); }));
  }catch(e){ body.innerHTML = '<div class="novita-error">Non riesco a contattare AniList (rete assente o bloccata). <button class="btn" id="novitaRetry">Riprova</button></div>'; const r = body.querySelector('#novitaRetry'); if(r) r.onclick = ()=>{ delete NOVITA_CACHE[novitaTab]; renderNovitaView(); }; }
}
