// ---- Barra di caricamento con la mascotte Frugu ----
// Si accende da sola per ogni richiesta all'AI (ricerche, Chiedi, Aggiorna info, completamento schede) avvolgendo askLLM,
// e può essere guidata a mano dove i passi sono contabili: Progress.begin(testo) · Progress.set(0-100, testo) · Progress.end().
// Nelle richieste all'AI la percentuale è STIMATA (il tempo di risposta non si conosce: il simbolo ~ lo dice); quando i passi
// sono contati (copertine, controllo dati) è esatta.
// ---- Registro diagnostico nascosto (per il debug): ogni richiesta a una fonte esterna, con esito, tempo e status HTTP ----
// Non contiene MAI chiavi o token (redatti) né il testo delle richieste. Si apre toccando 5 volte «Database aggiornato…» o con ?debug=1.
(function(){
  const KEY = 'atl_debuglog';                                  // prefisso atl_: non si mescola con il registro dell'app dei giochi
  let buf = []; try{ buf = JSON.parse(localStorage.getItem(KEY) || '[]') || []; }catch(e){}
  let saveT = 0;
  const persist = ()=>{ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(KEY, JSON.stringify(buf.slice(-200))); }catch(e){} }, 1500); };
  const cut = (x, n)=> String(x == null ? '' : x).slice(0, n || 220);
  // le chiavi vanno tolte anche quando l'indirizzo è annidato e codificato (es. dentro un ponte: ...%3Fkey%3D...)
  const redact = u=> String(u).replace(/((?:\?|&|%3F|%26)(?:key|api_key|apikey|token|access_token)(?:=|%3D))[^&%\s]+/gi, '$1***');
  buf = buf.map(e=>{ if(e && e.url) e.url = redact(e.url); if(e && e.err) e.err = redact(e.err); if(e && e.note) e.note = redact(e.note); return e; });
  window.DebugLog = {
    // add({kind, src, url, status, ok, ms, err, note})  oppure  add('Fonte', 'tipo', 'nota')
    add(e, kind, note){
      if(typeof e === 'string') e = {src: e, kind: kind || 'nota', note: note};
      e = Object.assign({t: new Date().toISOString()}, e);
      if(e.url) e.url = cut(redact(e.url), 200); if(e.err) e.err = cut(redact(e.err)); if(e.note) e.note = cut(redact(e.note));
      buf.push(e); if(buf.length > 300) buf = buf.slice(-300); persist();
    },
    all(){ return buf.slice(); },
    clear(){ buf = []; try{ localStorage.removeItem(KEY); }catch(e){} },
    text(){ return buf.map(e=> `${e.t.slice(11, 19)} [${e.kind || 'nota'}] ${e.src || ''} ${e.status != null ? 'HTTP ' + e.status : ''} ${e.ms != null ? e.ms + 'ms' : ''} ${e.ok === false ? 'ERRORE' : ''} ${e.url || ''} ${e.err || ''} ${e.note || ''}`.replace(/\s+/g, ' ').trim()).join('\n'); },
    open(){ openDebugLog(); }
  };
  // fonti riconosciute: (indirizzo → nome nel registro, chiave delle frasi di caricamento)
  const HOSTS = [[/graphql\.anilist\.co|anilist\.co/, 'AniList', 'anilist'], [/kitsu\.(io|app)/, 'Kitsu', 'kitsu'], [/jikan\.moe/, 'Jikan (MAL)', 'jikan'], [/wikipedia\.org/, 'Wikipedia', 'wikipedia'], [/query\.wikidata|wikidata\.org/, 'Wikidata', 'wikidata'],
    [/imdb\.com/, 'IMDb', 'imdb'], [/themoviedb\.org/, 'TMDB', 'tmdb'], [/generativelanguage\.googleapis/, 'Gemini', 'ai'], [/api\.github\.com|gist\.github/, 'GitHub Gist', 'gist'], [/wsrv\.nl|corsproxy|allorigins|codetabs|thingproxy|workers\.dev/, 'Ponte', 'proxy']];
  const of = window.fetch;
  if(typeof of === 'function') window.fetch = function(input, init){
    let url = ''; try{ url = typeof input === 'string' ? input : (input && input.url) || String(input); }catch(e){}
    const h = HOSTS.find(x=> x[0].test(url));
    if(!h) return of.apply(this, arguments);
    const t0 = performance.now();
    try{ if(h[2] && window.Progress && Progress.active && Progress.active()) Progress.source(h[2]); }catch(e){}
    return of.apply(this, arguments).then(r=>{
      DebugLog.add({kind: 'fetch', src: h[1], url, status: r.status, ok: r.ok, ms: Math.round(performance.now() - t0), err: r.ok ? '' : ('risposta ' + r.status + (r.status === 429 ? ' (troppe richieste)' : r.status === 403 ? ' (bloccato/permessi)' : r.status >= 500 ? ' (il sito ha un problema)' : ''))});
      return r;
    }, e=>{
      DebugLog.add({kind: 'fetch', src: h[1], url, ok: false, ms: Math.round(performance.now() - t0), err: (e && e.name === 'AbortError') ? 'annullata' : ('rete/CORS/timeout: ' + (e && e.message))});
      throw e;
    });
  };
  window.addEventListener('error', e=>{ DebugLog.add({kind: 'js', ok: false, err: (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno}); });
  window.addEventListener('unhandledrejection', e=>{ DebugLog.add({kind: 'js', ok: false, err: 'promessa non gestita: ' + (e.reason && (e.reason.message || e.reason))}); });
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  function panel(){
    let el = document.getElementById('dbgBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'dbgBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    return el;
  }
  window.openDebugLog = function(){
    const el = panel(), all = DebugLog.all().slice().reverse(), bad = all.filter(e=> e.ok === false).length;
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🛠️ Diagnostica fonti</b><button class="btn" data-ui-close>Chiudi</button></div>
      <div class="lp-sub">${all.length} eventi · ${bad} errori. Nessuna chiave o token viene registrato. Se una fonte non va, tocca «Copia log» e incollalo a Claude.</div>
      <div class="lp-tools"><button class="btn primary" id="dbgCopy">📋 Copia log</button><button class="btn" id="dbgClear">🗑️ Svuota</button></div>
      <div class="dbg-rows">${all.slice(0, 120).map(e=> `<div class="dbg-row${e.ok === false ? ' bad' : ''}"><b>${esc(e.t.slice(11, 19))}</b> ${esc(e.src || e.kind || '')} ${e.status != null ? '<span class="dbg-st">HTTP ' + e.status + '</span>' : ''} ${e.ms != null ? e.ms + ' ms' : ''} ${esc(e.err || e.note || '')}<br><small>${esc(e.url || '')}</small></div>`).join('') || '<div class="lp-sub">Ancora nessun evento.</div>'}</div></div>`;
    el.classList.add('show');
    el.querySelector('#dbgCopy').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(DebugLog.text()); if(window.showToast) showToast('Log copiato', 1800); }catch(e){ const ta = document.createElement('textarea'); ta.value = DebugLog.text(); document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e2){} ta.remove(); } });
    el.querySelector('#dbgClear').addEventListener('click', ()=>{ DebugLog.clear(); openDebugLog(); });
  };
  // apertura nascosta: 5 tocchi sulla riga «Database aggiornato…» oppure ?debug=1
  document.addEventListener('click', e=>{
    const t = e.target && e.target.closest && e.target.closest('#buildLine');
    if(!t) return;
    window.__dbgTaps = (window.__dbgTaps || []).filter(x=> Date.now() - x < 2500); window.__dbgTaps.push(Date.now());
    if(window.__dbgTaps.length >= 5){ window.__dbgTaps = []; openDebugLog(); }
  });
  if(/[?&]debug=1/.test(location.search)) window.addEventListener('load', ()=> setTimeout(()=> openDebugLog(), 800));
})();

(function(){
  const MASCOT = 'icons/mascot-anim.svg';
  const FLAVOR = ['Frugu sfoglia il catalogo…', 'Consulto le fonti…', 'Leggo le schede…', 'Controllo i dettagli…', 'Quasi fatto: metto in ordine gli scaffali…'];
  let logText = '', cnt = null, stopFn = null, el = null, depth = 0, exact = false, pct = 0, target = 0, label = '', t0 = 0, hideT = 0, raf = 0, manual = 0;

  // Frasi per ogni fonte: ruotano mentre la fonte è in consultazione
  const PHR = {
    anilist: ['Sfoglio il catalogo di AniList: che scaffali infiniti…', 'AniList: controllo voti, stagioni e relazioni tra i titoli…', 'Frugu legge le schede di AniList con la tazza di tè in mano…'],
    kitsu: ['Kitsu: cerco un secondo parere sui titoli…', 'Consulto Kitsu, la libreria della community…'],
    jikan: ['MyAnimeList (via Jikan): confronto i punteggi…', 'Jikan: pesco i voti dagli scaffali di MAL…'],
    wikipedia: ['Sfoglio Wikipedia: ogni voce è un volumetto da aprire…', 'Wikipedia: cerco trama, anno e locandina…', 'Wikipedia: leggo con calma la voce in italiano…'],
    wikidata: ['Scavo tra i dati di Wikidata: studi, registi, date…', 'Wikidata: rovisto tra i cassetti dell\'enciclopedia dei dati…'],
    imdb: ['IMDb: controllo voti e locandine dei film…'],
    tmdb: ['TMDB: cerco la locandina e dove vederlo in Italia…'],
    covers: ['Cerco la locandina giusta tra gli scaffali…', 'Frugu lucida le copertine prima di appenderle…'],
    gist: ['Metto al sicuro le tue liste sul tuo GitHub…', 'Sincronizzo: nascondo le noccioline nella tana…'],
    proxy: ['Passo dal passaggio segreto per aggirare i blocchi…', 'Un cunicolo laterale per raggiungere la fonte…'],
    ai: ['Frugu consulta il web con l\'aiuto di Gemini…', 'Leggo le fonti e verifico i voti…', 'Le zampette sono stanche ma il bottino cresce…', 'Annuso qualcosa di buono…']
  };
  let srcKeys = [], srcTimer = 0, holdUntil = 0, lastPhrase = '';
  const pick = ()=>{
    const k = srcKeys[Math.floor(Math.random() * srcKeys.length)]; const arr = PHR[k] || PHR.ai;
    let t = arr[Math.floor(Math.random() * arr.length)]; if(t === lastPhrase && arr.length > 1) t = arr[(arr.indexOf(t) + 1) % arr.length];
    lastPhrase = t; return '🦝 ' + t;
  };
  function srcTick(){ if(Date.now() < holdUntil || !srcKeys.length) return; logText = pick(); if(el) paint(); }
  function setSource(k){
    const ks = (Array.isArray(k) ? k : [k]).filter(x=> x && PHR[x]); if(!ks.length) return;
    if(ks.join() !== srcKeys.join()){ srcKeys = ks; holdUntil = 0; logText = pick(); if(el) paint(); }
    if(!srcTimer) srcTimer = setInterval(srcTick, 3400);
  }
  function stopSource(){ clearInterval(srcTimer); srcTimer = 0; srcKeys = []; holdUntil = 0; }
  function build(){
    el = document.createElement('div'); el.className = 'rt-loader'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="rt-pet"><img alt="" width="96" height="96" decoding="async"></div>
      <div class="rt-main"><div class="rt-title"></div><div class="rt-sub"></div>
      <div class="rt-count" hidden></div>
      <div class="rt-row"><div class="rt-bar"><i></i></div><b class="rt-pct">0%</b></div>
      <button class="rt-stop" type="button" hidden>Basta cercare! Mostra il bottino</button></div>
      <button class="rt-x" type="button" aria-label="Nascondi">✕</button>`;
    document.body.appendChild(el);
    el.querySelector('.rt-x').addEventListener('click', ()=> el.classList.remove('show'));
    el.querySelector('.rt-stop').addEventListener('click', ()=>{ const f = stopFn; if(f){ el.querySelector('.rt-stop').disabled = true; try{ f(); }catch(e){} } });
    return el;
  }
  function paint(){
    if(!el) return;
    const shown = Math.max(0, Math.min(100, Math.round(pct)));
    el.querySelector('.rt-bar i').style.width = shown + '%';
    const waiting = overdue && !exact && depth > 0;
    el.querySelector('.rt-pct').textContent = waiting ? Math.round((performance.now() - t0) / 1000) + 's' : (exact ? '' : '~') + shown + '%';
    el.classList.toggle('waiting', waiting);
    const el2 = Math.round((performance.now() - t0) / 1000);
    el.querySelector('.rt-title').textContent = label;
    const cEl = el.querySelector('.rt-count'); cEl.hidden = !cnt; if(cnt) cEl.textContent = `📚 Titoli trovati: ${cnt.n}${cnt.max ? ' / ' + cnt.max : ''}`;
    const sEl = el.querySelector('.rt-stop'); sEl.hidden = !stopFn;
    el.querySelector('.rt-sub').textContent = logText ? logText : waiting ? 'Ci sta mettendo più del solito: sto ancora aspettando la risposta…' : FLAVOR[Math.min(FLAVOR.length - 1, Math.floor(shown / 22))] + (el2 >= 4 ? ` · ${el2}s` : '');
    el.classList.toggle('done', shown >= 100);
  }
  // Stima calibrata: per ogni richiesta uso la durata media REALE delle volte scorse (salvata per tipo di ricerca).
  // Se una richiesta supera il tempo abituale non resto fermo su un numero finto: passo a "sto ancora cercando…" con i secondi.
  const AVG_KEY = 'atl_rt_avg';
  const avgs = ()=>{ try{ return JSON.parse(localStorage.getItem(AVG_KEY) || '{}') || {}; }catch(e){ return {}; } };
  const expectedFor = (lb, search)=> avgs()[lb] || (search ? 14 : 7);
  const learn = (lb, sec)=>{ try{ const m = avgs(); m[lb] = m[lb] ? Math.round((m[lb] * 0.6 + sec * 0.4) * 10) / 10 : sec; localStorage.setItem(AVG_KEY, JSON.stringify(m)); }catch(e){} };
  let calls = [], sessionDone = 0, overdue = false;
  function estimate(){
    const now = performance.now(); let partial = 0; overdue = false;
    calls.forEach(c=>{
      const e2 = (now - c.t0) / 1000, ex = c.expected;
      const p = e2 <= ex ? 0.9 * (e2 / ex) : 0.9 + 0.05 * (1 - Math.exp(-(e2 - ex) / ex));
      partial += Math.min(0.95, p);
      if(e2 > ex * 1.15) overdue = true;
    });
    const total = calls.length + sessionDone;
    return total ? (sessionDone + partial) / total * 100 : 0;
  }
  function tick(){
    raf = 0;
    if(!exact && depth > 0) target = Math.max(target, estimate());
    pct += (target - pct) * 0.12 + (target > pct ? 0.05 : 0);
    if(pct > target) pct = target;
    paint();
    if(el && el.classList.contains('show') && (depth > 0 || manual > 0 || pct < 100)) raf = requestAnimationFrame(tick);
  }
  function open(txt){
    clearTimeout(hideT);
    if(!el) build();
    const img = el.querySelector('img'); if(!img.getAttribute('src')) img.src = MASCOT;
    if(!el.classList.contains('show')){ pct = 0; target = 0; t0 = performance.now(); }
    if(txt) label = txt;
    el.classList.add('show'); el.classList.remove('done');
    paint(); if(!raf) raf = requestAnimationFrame(tick);
  }
  function close(){
    clearTimeout(hideT);
    hideT = setTimeout(()=>{                       // piccola attesa: se parte subito un'altra richiesta la barra continua (niente lampeggi)
      if(depth > 0 || manual > 0) return;
      target = 100; exact = true;
      const fin = ()=>{ if(pct < 99.5 && el.classList.contains('show')){ requestAnimationFrame(fin); return; } setTimeout(()=>{ if(depth === 0 && manual === 0 && el){ el.classList.remove('show'); exact = false; logText = ''; cnt = null; stopFn = null; stopSource(); } }, 500); };
      if(!raf) raf = requestAnimationFrame(tick); fin();
    }, 650);
  }
  window.Progress = {
    begin(txt){ manual++; exact = true; open(txt); },
    set(p, txt){ exact = true; target = Math.max(target, Math.min(100, p)); if(txt) label = txt; open(); },
    end(){ manual = Math.max(0, manual - 1); if(!manual) close(); },
    log(t){ logText = t || ''; holdUntil = t ? Date.now() + 3200 : 0; if(el) paint(); },
    source(k){ setSource(k); },
    active(){ return depth > 0 || manual > 0; },
    counter(n, max){ cnt = (n == null) ? null : {n, max}; if(el) paint(); },
    onStop(fn){ stopFn = fn || null; if(el){ const b = el.querySelector('.rt-stop'); if(b){ b.disabled = false; b.hidden = !fn; } } },
    hideNow(){ clearTimeout(hideT); manual = 0; depth = 0; if(el){ el.classList.remove('show'); } exact = false; logText = ''; cnt = null; stopFn = null; stopSource(); },
    reset(){ logText = ''; cnt = null; stopFn = null; stopSource(); if(el) paint(); }
  };
  // ogni richiesta all'AI accende la barra (tranne quelle "silent" in background)
  if(typeof window.askLLM === 'function'){
    const orig = window.askLLM;
    window.askLLM = function(input, opts, extra){
      extra = extra || {};
      const tt = performance.now();
      const logAi = (ok, e, r)=>{ try{ DebugLog.add({kind: 'ai', src: 'AI · ' + (extra.label || (extra.search ? 'ricerca web' : 'richiesta')) + (extra.search ? ' (con ricerca)' : ''), ok, ms: Math.round(performance.now() - tt), err: ok ? '' : ((e && (e.code || '')) + ' ' + (e && e.message || '')).trim(), note: ok ? ((r && r.sources && r.sources.length) ? r.sources.length + ' fonti' : 'ok') : ''}); }catch(x){} };
      if(extra.silent){ let p0; try{ p0 = orig.apply(this, arguments); }catch(e){ logAi(false, e); throw e; } return Promise.resolve(p0).then(r=>{ logAi(true, null, r); return r; }, e=>{ logAi(false, e); throw e; }); }
      const lb = extra.label || (extra.search ? 'Cerco online…' : 'Sto pensando…');
      const rec = {t0: performance.now(), label: lb, expected: expectedFor(lb, !!extra.search)};
      calls.push(rec); depth++; exact = false; setSource('ai');
      open(lb);
      let p; try{ p = orig.apply(this, arguments); }catch(e){ calls = calls.filter(c=> c !== rec); depth--; logAi(false, e); throw e; }
      return Promise.resolve(p).then(r=>{ logAi(true, null, r); return r; }, e=>{ logAi(false, e); throw e; }).finally(()=>{
        learn(lb, (performance.now() - rec.t0) / 1000);
        calls = calls.filter(c=> c !== rec); sessionDone++; depth = Math.max(0, depth - 1);
        if(depth === 0 && manual === 0){ sessionDone = 0; stopSource(); close(); }
      });
    };
  }
})();
