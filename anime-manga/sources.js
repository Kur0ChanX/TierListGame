// ---- SearchHub: motore di ricerca senza sosta per anime, manga e film ----
// SearchHub.fetch / json / text : accesso diretto → attesa se «troppe richieste» (429) → catena di ponti CORS (con autoapprendimento in atl_relay_health).
// Fonti dirette (tutte ammettono il browser): AniList (in online.js), Kitsu, Jikan/MAL, Wikipedia, Wikidata, TMDB (chiave facoltativa).
// SearchHub.scout() ruota le fonti finché ha trovato abbastanza titoli che NON sono ancora nella libreria.
// Ogni tentativo va nel registro DebugLog (loader.js; si apre con 5 tocchi su «Database aggiornato» o ?debug=1).
// Le richieste con una chiave nell'indirizzo (TMDB) vanno SEMPRE con relays:false: la chiave non passa mai dai ponti pubblici.
window.SearchHub = (function(){
  const H = {};
  const sleepMs = ms=> new Promise(r=> setTimeout(r, ms));
  const rd = k=>{ try{ return (localStorage.getItem(k) || '').trim(); }catch(e){ return ''; } };
  const log = e=>{ try{ if(window.DebugLog) DebugLog.add(e); }catch(x){} };

  // ---------------- ponti CORS ----------------
  const RELAYS = [
    {name: 'corsproxy', url: u=> 'https://corsproxy.io/?url=' + encodeURIComponent(u)},
    {name: 'allorigins', url: u=> 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)},
    {name: 'codetabs', url: u=> 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u)},
    {name: 'thingproxy', url: u=> 'https://thingproxy.freeboard.io/fetch/' + u}
  ];
  const HK = 'atl_relay_health';
  let health = {}; try{ health = JSON.parse(localStorage.getItem(HK) || '{}') || {}; }catch(e){}
  const saveHealth = ()=>{ try{ localStorage.setItem(HK, JSON.stringify(health)); }catch(e){} };
  const hOf = n=> health[n] || (health[n] = {ok: 0, fail: 0, cool: 0});
  const relayCooling = n=> hOf(n).cool > Date.now();
  function customRelay(){
    const u = rd('atl_relay_url') || rd('jrpg_relay_url');            // lo stesso ponte personale dell'app dei giochi va bene
    if(!u) return null;
    return {name: 'personale', url: t=> u.indexOf('{url}') >= 0 ? u.replace('{url}', encodeURIComponent(t)) : u + (u.indexOf('?') >= 0 ? '&' : '?') + 'url=' + encodeURIComponent(t)};
  }
  H.hasCustomRelay = ()=> !!customRelay();
  H.testCustomRelay = async ()=>{
    const c = customRelay(); if(!c) throw new Error('indirizzo non impostato');
    const r = await fetch(c.url('https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json'));
    if(!r.ok) throw new Error('risposta ' + r.status);
    const j = await r.json(); if(!(j && j.query)) throw new Error('risposta strana');
    return 'letto Wikipedia';
  };
  function relayOrder(o){
    const list = RELAYS.filter(r=> !relayCooling(r.name)).sort((a, b)=> (hOf(b.name).ok - 2 * hOf(b.name).fail) - (hOf(a.name).ok - 2 * hOf(a.name).fail));
    const cr = customRelay(); if(cr && !relayCooling(cr.name)) list.unshift(cr);
    return list.slice(0, o.maxRelays || 3);
  }
  const hostOf = u=>{ try{ return new URL(u).hostname; }catch(e){ return u; } };
  async function tryFetch(url, opts, ms){
    const ctl = new AbortController(), t = setTimeout(()=> ctl.abort(), ms);
    const parent = opts.signal; if(parent){ if(parent.aborted) ctl.abort(); else parent.addEventListener('abort', ()=> ctl.abort(), {once: true}); }
    try{ return await fetch(url, Object.assign({}, opts, {signal: ctl.signal})); }
    finally{ clearTimeout(t); }
  }
  // opts: fetch standard + {relays:false (mai ponti) | 'only' (solo ponti), timeout, maxRelays, check(text)→bool}
  H.fetch = async function(url, opts){
    opts = opts || {}; const init = Object.assign({}, opts); ['relays', 'timeout', 'maxRelays', 'check'].forEach(k=> delete init[k]);
    let lastErr;
    if(opts.relays !== 'only'){
      for(let a = 0; a < 2; a++){
        try{
          const r = await tryFetch(url, init, opts.timeout || 15000);
          if(r.status === 429){
            const ra = Math.min(20, +r.headers.get('retry-after') || 5 * (a + 1));
            log({kind: 'attesa', src: hostOf(url), ok: false, status: 429, note: 'troppe richieste: aspetto ' + ra + 's'});
            await sleepMs(ra * 1000); lastErr = new Error('HTTP 429'); continue;
          }
          if(r.ok || (r.status >= 400 && r.status < 500 && r.status !== 403)) return r;
          lastErr = new Error('HTTP ' + r.status);
          if(r.status < 500) break;                                  // 403: si prova con i ponti
          await sleepMs(900 * (a + 1));
        }catch(e){
          lastErr = e; if(opts.signal && opts.signal.aborted) throw e;
          break;                                                     // rete/CORS: inutile ripetere, si passa ai ponti
        }
      }
    }
    if(opts.relays !== false){
      for(const rl of relayOrder(opts)){
        const h = hOf(rl.name);
        try{
          const r = await tryFetch(rl.url(url), init, opts.timeout || 18000);
          if(r.ok){
            if(opts.check){ const txt = await r.clone().text(); if(!opts.check(txt)) throw new Error('risposta non valida dal ponte'); }
            h.ok++; h.cool = 0; saveHealth(); log({kind: 'ponte', src: rl.name, ok: true, status: r.status, url}); return r;
          }
          throw new Error('HTTP ' + r.status);
        }catch(e){
          if(opts.signal && opts.signal.aborted) throw e;
          h.fail++; if(h.fail - h.ok >= 3) h.cool = Date.now() + 10 * 60000; saveHealth();
          log({kind: 'ponte', src: rl.name, ok: false, url, err: String(e && e.message || e)}); lastErr = e;
        }
      }
    }
    throw lastErr || new Error('nessuna via di accesso');
  };
  H.json = async (url, opts)=>{ const r = await H.fetch(url, opts); if(!r.ok){ const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); };
  H.text = async (url, opts)=>{ const r = await H.fetch(url, opts); if(!r.ok){ const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.text(); };

  const norm = s=> String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  const qs = o=> Object.keys(o).filter(k=> o[k] != null && o[k] !== '').map(k=> encodeURIComponent(k) + '=' + encodeURIComponent(o[k])).join('&');

  // ---------------- Kitsu (JSON:API, CORS libero) ----------------
  const KITSU_FMT = {TV: 'TV', movie: 'MOVIE', OVA: 'OVA', ONA: 'ONA', special: 'SPECIAL', music: 'MUSIC', manga: 'MANGA', novel: 'NOVEL', manhwa: 'MANGA', manhua: 'MANGA', oneshot: 'ONE_SHOT', doujin: 'MANGA', oel: 'MANGA'};
  const KITSU_ST = {finished: 'FINISHED', current: 'RELEASING', upcoming: 'NOT_YET_RELEASED', tba: 'NOT_YET_RELEASED', unreleased: 'NOT_YET_RELEASED'};
  const KITSU_GENRE = {'action': 'Action', 'adventure': 'Adventure', 'comedy': 'Comedy', 'drama': 'Drama', 'fantasy': 'Fantasy', 'horror': 'Horror', 'mystery': 'Mystery', 'romance': 'Romance', 'science fiction': 'Sci-Fi', 'slice of life': 'Slice of Life', 'sports': 'Sports', 'supernatural': 'Supernatural', 'thriller': 'Thriller', 'psychological': 'Psychological', 'mecha': 'Mecha', 'music': 'Music', 'ecchi': 'Ecchi', 'mahou shoujo': 'Mahou Shoujo'};
  function mediaFromKitsu(k, included){
    const a = k.attributes || {}, isAnime = k.type === 'anime', t = a.titles || {};
    const cats = ((k.relationships && k.relationships.categories && k.relationships.categories.data) || []).map(r=> (included || []).find(x=> x.type === 'categories' && x.id === r.id)).filter(Boolean).map(x=> String(x.attributes.title || '').toLowerCase());
    const genres = [...new Set(cats.map(c=> KITSU_GENRE[c]).filter(Boolean))];
    const sub = String(a.subtype || a.mangaType || '');
    const year = d=> d ? +String(d).slice(0, 4) : null;
    const poster = a.posterImage || {};
    return {_src: 'kitsu', id: +k.id, type: isAnime ? 'ANIME' : 'MANGA', format: KITSU_FMT[sub] || (isAnime ? 'TV' : 'MANGA'), countryOfOrigin: sub === 'manhwa' ? 'KR' : sub === 'manhua' ? 'CN' : 'JP', isAdult: false,
      title: {romaji: t.en_jp || a.canonicalTitle || '', english: t.en || t.en_us || '', native: t.ja_jp || ''}, synonyms: a.abbreviatedTitles || [],
      startDate: {year: year(a.startDate)}, endDate: {year: year(a.endDate)}, chapters: a.chapterCount || null, volumes: a.volumeCount || null, episodes: a.episodeCount || null, duration: a.episodeLength || null,
      averageScore: a.averageRating != null ? Math.round(+a.averageRating) : null, meanScore: null, popularity: a.userCount || 0, favourites: a.favoritesCount || 0, genres, tags: [],
      coverImage: {large: poster.large || poster.medium || poster.original || '', medium: poster.medium || poster.small || poster.large || '', color: null}, studios: {nodes: []}, staff: {edges: []},
      description: a.synopsis || '', status: KITSU_ST[a.status] || 'FINISHED', source: null, season: null, seasonYear: null, nextAiringEpisode: null};
  }
  H.kitsu = {
    mediaFromKitsu,
    // kind: 'anime' | 'manga'
    async search(q, kind, limit){
      const j = await H.json('https://kitsu.io/api/edge/' + (kind === 'manga' ? 'manga' : 'anime') + '?' + qs({'filter[text]': q, 'page[limit]': limit || 12, include: 'categories'}), {headers: {Accept: 'application/vnd.api+json'}});
      return (j.data || []).map(x=> mediaFromKitsu(x, j.included));
    },
    async browse(kind, o){
      o = o || {};
      const p = {'page[limit]': o.limit || 20, 'page[offset]': o.offset || 0, sort: o.sort || '-userCount', include: 'categories'};
      if(o.genre) p['filter[categories]'] = o.genre;
      const j = await H.json('https://kitsu.io/api/edge/' + (kind === 'manga' ? 'manga' : 'anime') + '?' + qs(p), {headers: {Accept: 'application/vnd.api+json'}});
      return (j.data || []).map(x=> mediaFromKitsu(x, j.included));
    }
  };

  // ---------------- Jikan (MyAnimeList) ----------------
  H.jikan = {
    async search(q, kind, limit){
      const j = await H.json('https://api.jikan.moe/v4/' + (kind === 'manga' ? 'manga' : 'anime') + '?' + qs({q, limit: limit || 12, sfw: 'true', order_by: 'members', sort: 'desc'}));
      return (j.data || []).map(x=>{
        const isAnime = kind !== 'manga', img = (x.images && (x.images.jpg || x.images.webp)) || {};
        return {_src: 'jikan', id: x.mal_id, idMal: x.mal_id, type: isAnime ? 'ANIME' : 'MANGA', format: ({TV: 'TV', Movie: 'MOVIE', OVA: 'OVA', ONA: 'ONA', Special: 'SPECIAL', Manga: 'MANGA', Manhwa: 'MANGA', Manhua: 'MANGA', Novel: 'NOVEL', 'One-shot': 'ONE_SHOT'})[x.type] || (isAnime ? 'TV' : 'MANGA'),
          countryOfOrigin: x.type === 'Manhwa' ? 'KR' : x.type === 'Manhua' ? 'CN' : 'JP', isAdult: false, title: {romaji: x.title || '', english: x.title_english || '', native: x.title_japanese || ''}, synonyms: x.title_synonyms || [],
          startDate: {year: (x.aired && x.aired.prop && x.aired.prop.from && x.aired.prop.from.year) || (x.published && x.published.prop && x.published.prop.from && x.published.prop.from.year) || x.year || null}, endDate: {year: (x.aired && x.aired.prop && x.aired.prop.to && x.aired.prop.to.year) || (x.published && x.published.prop && x.published.prop.to && x.published.prop.to.year) || null},
          chapters: x.chapters || null, volumes: x.volumes || null, episodes: x.episodes || null, duration: null, averageScore: x.score != null ? Math.round(x.score * 10) : null, popularity: x.members || 0, favourites: x.favorites || 0,
          genres: (x.genres || []).map(g=> g.name === 'Sci-Fi' ? 'Sci-Fi' : g.name), tags: [], coverImage: {large: img.large_image_url || img.image_url || '', medium: img.image_url || '', color: null},
          studios: {nodes: (x.studios || []).slice(0, 2).map(s=> ({name: s.name}))}, staff: {edges: (x.authors || []).slice(0, 2).map(a=> ({role: 'Story & Art', node: {name: {full: String(a.name || '').replace(/^([^,]+), (.+)$/, '$2 $1')}}}))},
          description: x.synopsis || '', status: ({'Finished Airing': 'FINISHED', 'Currently Airing': 'RELEASING', 'Not yet aired': 'NOT_YET_RELEASED', Finished: 'FINISHED', Publishing: 'RELEASING', 'On Hiatus': 'HIATUS'})[x.status] || 'FINISHED', source: null, nextAiringEpisode: null};
      });
    }
  };

  // ---------------- Wikipedia / Wikidata: film (CORS libero con origin=*) ----------------
  const WD = 'https://www.wikidata.org/w/api.php', SPARQL = 'https://query.wikidata.org/sparql';
  const FILM_DESC = /film|movie|cortometraggio|short|animat|cartoon|lungometraggio/i;
  const wpThumbPath = u=>{ const m = String(u || '').match(/\/wikipedia\/(.+)$/); return m ? m[1].replace(/\/\d+px-/, '/{w}px-') : ''; };
  H.wikidata = {
    // ricerca per titolo (italiano + inglese) → elenco di elementi che sembrano film
    async searchFilms(q){
      const seen = new Map();
      for(const lang of ['it', 'en']){
        const j = await H.json(WD + '?' + qs({action: 'wbsearchentities', search: q, language: lang, uselang: lang, type: 'item', limit: 12, format: 'json', origin: '*'}));
        (j.search || []).forEach(x=>{ if(FILM_DESC.test(x.description || '') && !seen.has(x.id)) seen.set(x.id, {qid: x.id, label: x.label, desc: x.description || ''}); });
        if(seen.size >= 6) break;
      }
      return [...seen.values()].slice(0, 10);
    },
    // dettagli di più elementi in una sola interrogazione
    async details(qids){
      if(!qids.length) return [];
      const ids = qids.map(q=> 'wd:' + q).join(' ');
      const q1 = `SELECT ?f ?en ?it ?enw ?itw ?date ?imdb ?run ?mal ?al ?anim ?img WHERE { VALUES ?f { ${ids} }
        OPTIONAL { ?f rdfs:label ?en FILTER(LANG(?en)="en") } OPTIONAL { ?f rdfs:label ?it FILTER(LANG(?it)="it") }
        OPTIONAL { ?enw schema:about ?f ; schema:isPartOf <https://en.wikipedia.org/> } OPTIONAL { ?itw schema:about ?f ; schema:isPartOf <https://it.wikipedia.org/> }
        OPTIONAL { ?f wdt:P577 ?date } OPTIONAL { ?f wdt:P345 ?imdb } OPTIONAL { ?f wdt:P2047 ?run } OPTIONAL { ?f wdt:P4086 ?mal } OPTIONAL { ?f wdt:P8729 ?al }
        BIND(EXISTS { ?f wdt:P31/wdt:P279* wd:Q202866 } AS ?anim) }`;
      const q2 = `SELECT ?f ?prod ?dist ?dir ?country ?genre ?series WHERE { VALUES ?f { ${ids} }
        OPTIONAL { ?f wdt:P272 ?p . ?p rdfs:label ?prod FILTER(LANG(?prod)="en") } OPTIONAL { ?f wdt:P750 ?d . ?d rdfs:label ?dist FILTER(LANG(?dist)="en") }
        OPTIONAL { ?f wdt:P57 ?di . ?di rdfs:label ?dir FILTER(LANG(?dir)="en") } OPTIONAL { ?f wdt:P495 ?c . ?c rdfs:label ?country FILTER(LANG(?country)="en") }
        OPTIONAL { ?f wdt:P136 ?g . ?g rdfs:label ?genre FILTER(LANG(?genre)="en") } OPTIONAL { ?f wdt:P179 ?s . ?s rdfs:label ?series FILTER(LANG(?series)="en") } }`;
      const run = q=> H.json(SPARQL + '?' + qs({format: 'json', query: q}), {headers: {Accept: 'application/sparql-results+json'}, timeout: 25000});
      const [a, b] = await Promise.all([run(q1), run(q2)]);
      const by = new Map();
      const qid = u=> String(u || '').replace(/^.*\//, '');
      (a.results.bindings || []).forEach(r=>{
        const id = qid(r.f.value); const o = by.get(id) || {qid: id, prods: new Set(), dists: new Set(), dirs: new Set(), countries: new Set(), genres: new Set(), series: new Set()};
        const v = k=> r[k] && r[k].value;
        o.en = o.en || v('en'); o.it = o.it || v('it'); o.enw = o.enw || (v('enw') && decodeURIComponent(String(v('enw')).replace(/^.*\/wiki\//, '')).replace(/_/g, ' '));
        o.itw = o.itw || (v('itw') && decodeURIComponent(String(v('itw')).replace(/^.*\/wiki\//, '')).replace(/_/g, ' '));
        if(v('date') && (!o.date || v('date') < o.date)) o.date = v('date');
        o.imdb = o.imdb || v('imdb'); o.run = o.run || (v('run') ? Math.round(+v('run')) : null); o.mal = o.mal || v('mal'); o.al = o.al || v('al'); o.anim = o.anim || v('anim') === 'true';
        by.set(id, o);
      });
      (b.results.bindings || []).forEach(r=>{ const o = by.get(qid(r.f.value)); if(!o) return; [['prod', 'prods'], ['dist', 'dists'], ['dir', 'dirs'], ['country', 'countries'], ['genre', 'genres'], ['series', 'series']].forEach(([k, s])=>{ if(r[k]) o[s].add(r[k].value); }); });
      return [...by.values()].map(o=> Object.assign(o, {prods: [...o.prods], dists: [...o.dists], dirs: [...o.dirs], countries: [...o.countries], genres: [...o.genres], series: [...o.series], year: o.date ? +String(o.date).slice(0, 4) : null}));
    },
    // film d'animazione usciti (o in uscita) dopo una certa data: per «Nuovi film» e la ricerca di titoli mancanti
    async newAnimated(fromIso, limit){
      const q = `SELECT DISTINCT ?f (MIN(?d) AS ?date) WHERE { ?f wdt:P31/wdt:P279* wd:Q202866 ; wdt:P577 ?d . FILTER(?d >= "${fromIso}T00:00:00Z"^^xsd:dateTime) ?f wdt:P345 ?imdb } GROUP BY ?f ORDER BY DESC(?date) LIMIT ${limit || 40}`;
      const j = await H.json(SPARQL + '?' + qs({format: 'json', query: q}), {headers: {Accept: 'application/sparql-results+json'}, timeout: 25000});
      return (j.results.bindings || []).map(r=> String(r.f.value).replace(/^.*\//, ''));
    },
    // film di uno studio (chiave del nostro elenco) che non sono ancora in libreria
    async studioFilms(studioQid, limit){
      const q = `SELECT DISTINCT ?f WHERE { { ?f wdt:P272 wd:${studioQid} } UNION { ?f wdt:P750 wd:${studioQid} } ?f wdt:P31/wdt:P279* wd:Q11424 ; wdt:P345 ?imdb } LIMIT ${limit || 60}`;
      const j = await H.json(SPARQL + '?' + qs({format: 'json', query: q}), {headers: {Accept: 'application/sparql-results+json'}, timeout: 25000});
      return (j.results.bindings || []).map(r=> String(r.f.value).replace(/^.*\//, ''));
    }
  };
  // locandine e trame: Wikipedia inglese (immagine + breve testo) per titolo di voce
  H.wikipedia = {
    async summaries(lang, titles){
      const out = {}; if(!titles.length) return out;
      for(let i = 0; i < titles.length; i += 20){
        const chunk = titles.slice(i, i + 20);
        const j = await H.json('https://' + lang + '.wikipedia.org/w/api.php?' + qs({action: 'query', prop: 'pageimages|extracts', piprop: 'thumbnail', pithumbsize: 330, exintro: 1, explaintext: 1, exsentences: 4, exlimit: 20, redirects: 1, titles: chunk.join('|'), format: 'json', formatversion: 2, origin: '*'}));
        const norm2 = {}; ((j.query && j.query.normalized) || []).forEach(n=> norm2[n.from] = n.to); ((j.query && j.query.redirects) || []).forEach(n=> norm2[n.from] = n.to);
        const pages = new Map(((j.query && j.query.pages) || []).map(p=> [p.title, p]));
        chunk.forEach(t=>{ const p = pages.get(norm2[norm2[t] || t] || norm2[t] || t) || pages.get(t); if(p && !p.missing) out[t] = {extract: p.extract || '', pu: p.thumbnail ? wpThumbPath(p.thumbnail.source) : ''}; });
      }
      return out;
    }
  };
  H.wpThumbPath = wpThumbPath;

  // ---------------- TMDB (facoltativo, con la chiave dell'utente: mai dai ponti) ----------------
  const tmKey = ()=> rd('atl_tmdb_key');
  const TM = 'https://api.themoviedb.org/3';
  const tmGet = (path, p)=> H.json(TM + path + '?' + qs(Object.assign({api_key: tmKey(), language: 'it-IT'}, p || {})), {relays: false});
  H.tmdb = {
    has: ()=> !!tmKey(),
    async ping(){ if(!tmKey()) throw new Error('chiave mancante'); return tmGet('/configuration'); },
    async searchMovie(q){ const j = await tmGet('/search/movie', {query: q, include_adult: 'false'}); return j.results || []; },
    async movie(id){ return tmGet('/movie/' + id, {append_to_response: 'credits,watch/providers,external_ids'}); },
    poster: (path, w)=> path ? 'https://image.tmdb.org/t/p/' + (w || 'w342') + path : ''
  };

  // ---------------- «Fruga»: ricerca di titoli non ancora in libreria ----------------
  // o: {list: anime|film|manga|manhwa, tag: codice genere, max, signal, onFound(m), skip:Set}
  // Ruota AniList (pagine di titoli famosi per genere) → Kitsu; per i film aggiunge Wikidata. Restituisce l'elenco di «media» trovati.
  H.scout = async function(o){
    o = o || {}; const found = [], seenIds = new Set(); const max = o.max || 20;
    const known = m=> (typeof findDuplicateItem === 'function' && findDuplicateItem(m)) || seenIds.has(m._src + ':' + m.id) || (o.skip && o.skip.has(String(m.id)));
    const push = m=>{ if(known(m)) return false; seenIds.add(m._src + ':' + m.id); found.push(m); if(o.onFound) o.onFound(m, found.length); return true; };
    const stopped = ()=> (o.signal && o.signal.aborted) || found.length >= max;
    const def = (window.AM && AM.tags || []).find(t=> t.c === o.tag), gname = def && def.r && def.r.g, tname = def && def.r && def.r.t && def.r.t[0];
    const list = o.list || 'anime', isManga = list === 'manga' || list === 'manhwa';
    // 1) AniList
    try{
      for(let page = o.page || 1; page < (o.page || 1) + 6 && !stopped(); page++){
        const filt = [`type:${isManga ? 'MANGA' : 'ANIME'}`, 'isAdult:false', 'sort:POPULARITY_DESC'];
        if(list === 'film') filt.push('format:MOVIE'); else if(list === 'anime') filt.push('format_in:[TV,ONA]');
        if(list === 'manhwa') filt.push('countryOfOrigin:KR'); else if(list === 'manga') filt.push('countryOfOrigin:JP');
        if(gname) filt.push(`genre:"${gname}"`); if(!gname && tname) filt.push(`tag:"${tname}"`);
        filt.push('popularity_greater:1500');
        const d = await AniList.q(`query($p:Int){Page(page:$p,perPage:30){media(${filt.join(',')}){${MEDIA_LITE}}}}`, {p: page}, {signal: o.signal});
        (d.Page.media || []).forEach(m=>{ m._src = 'al'; if(!stopped()) push(m); });
        if(!d.Page.media.length) break;
        if(window.Progress) Progress.counter(found.length, max);
      }
    }catch(e){ log({kind: 'scout', src: 'AniList', ok: false, err: String(e && e.message || e)}); }
    // 2) Kitsu (riserva)
    if(!stopped() && found.length < 3){
      try{
        const ms = await H.kitsu.browse(isManga ? 'manga' : 'anime', {limit: 20, sort: '-userCount'});
        ms.forEach(m=>{ if(!stopped() && (list !== 'film' || m.format === 'MOVIE') && (list !== 'anime' || m.format !== 'MOVIE')) push(m); });
      }catch(e){ log({kind: 'scout', src: 'Kitsu', ok: false, err: String(e && e.message || e)}); }
    }
    return found;
  };
  return H;
})();
