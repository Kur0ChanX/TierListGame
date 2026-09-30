// ---- Barra di caricamento stile JRPG con Frugu Frugu ----
// Si accende da sola per ogni richiesta all'AI (ricerche, Novità, Aggiorna info, Chiedi, voce, wishlist) avvolgendo askLLM,
// e può essere guidata a mano dove i passi sono contabili: Progress.set(0-100, "testo") con Progress.begin/end.
// Nelle richieste all'AI la percentuale è STIMATA (il tempo di risposta non si conosce: il simbolo ~ lo dice); quando i passi
// sono contati (copertine, verifica generi) è esatta.
// ---- Registro diagnostico nascosto (per il debug): ogni richiesta a una fonte esterna, con esito, tempo e status HTTP ----
// Non contiene MAI chiavi o token (redatti) né il testo delle richieste. Si apre toccando 5 volte «Database aggiornato…» o con ?debug=1.
(function(){
  const KEY = 'rt_debuglog';                                   // niente prefisso jrpg_: non viene sincronizzato sul Gist
  let buf = []; try{ buf = JSON.parse(localStorage.getItem(KEY) || '[]') || []; }catch(e){}
  let saveT = 0;
  const persist = ()=>{ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(KEY, JSON.stringify(buf.slice(-200))); }catch(e){} }, 1500); };
  const cut = (x, n)=> String(x == null ? '' : x).slice(0, n || 220);
  // le chiavi vanno tolte anche quando l'indirizzo è annidato e codificato (es. dentro un ponte: ...%3Fkey%3D...)
  const redact = u=> String(u).replace(/((?:\?|&|%3F|%26)(?:key|api_key|apikey|token|access_token)(?:=|%3D))[^&%\s]+/gi, '$1***');
  buf = buf.map(e=>{ if(e && e.url) e.url = redact(e.url); if(e && e.err) e.err = redact(e.err); if(e && e.note) e.note = redact(e.note); return e; });
  window.DebugLog = {
    add(e){ e = Object.assign({t: new Date().toISOString()}, e); if(e.url) e.url = cut(redact(e.url), 200); if(e.err) e.err = cut(e.err); if(e.note) e.note = cut(e.note); buf.push(e); if(buf.length > 300) buf = buf.slice(-300); persist(); },
    all(){ return buf.slice(); },
    clear(){ buf = []; try{ localStorage.removeItem(KEY); }catch(e){} },
    text(){ return buf.map(e=> `${e.t.slice(11, 19)} [${e.kind || 'note'}] ${e.src || ''} ${e.status != null ? 'HTTP ' + e.status : ''} ${e.ms != null ? e.ms + 'ms' : ''} ${e.ok === false ? 'ERRORE' : ''} ${e.url || ''} ${e.err || ''} ${e.note || ''}`.replace(/\s+/g, ' ').trim()).join('\n'); }
  };
  const HOSTS = [[/wikipedia\.org/, 'Wikipedia', 'wikipedia'], [/query\.wikidata|wikidata\.org/, 'Wikidata', 'wikidata'], [/steampowered|steamstatic/, 'Steam', 'steam'], [/pcgamingwiki/, 'PCGamingWiki', 'pcgw'], [/rawg\.io/, 'RAWG', 'rawg'], [/reddit\.com/, 'Reddit', 'reddit'], [/cheapshark\.com/, 'CheapShark', 'cheapshark'], [/steamspy\.com/, 'SteamSpy', 'steamspy'], [/catalog\.gog\.com|gog\.com/, 'GOG', 'gog'], [/r\.jina\.ai|cors\.eu\.org|yacdn\.org/, 'Proxy CORS', 'proxy'], [/generativelanguage/, 'Gemini', null], [/wsrv\.nl/, 'wsrv (copertine)', 'covers'], [/libretro/, 'Libretro (copertine)', 'covers'], [/api\.github\.com|gist\.github/, 'GitHub Gist', 'gist'], [/corsproxy|allorigins|codetabs|thingproxy/, 'Proxy CORS', 'proxy']];
  const of = window.fetch;
  if(typeof of === 'function') window.fetch = function(input, init){
    let url = ''; try{ url = typeof input === 'string' ? input : (input && input.url) || String(input); }catch(e){}
    const h = HOSTS.find(x=> x[0].test(url));
    if(!h) return of.apply(this, arguments);
    const t0 = performance.now();
    try{ if(h[2] && window.Progress && Progress.active && Progress.active()) Progress.source(h[2]); }catch(e){}
    return of.apply(this, arguments).then(r=>{
      DebugLog.add({kind: 'fetch', src: h[1], url, status: r.status, ok: r.ok, ms: Math.round(performance.now() - t0), err: r.ok ? '' : ('risposta ' + r.status + (r.status === 429 ? ' (troppe richieste)' : r.status === 403 ? ' (bloccato/permesso)' : r.status === 404 ? ' (non trovato)' : ''))});
      return r;
    }, e=>{
      DebugLog.add({kind: 'fetch', src: h[1], url, ok: false, ms: Math.round(performance.now() - t0), err: (e && e.name === 'AbortError') ? 'annullata' : ('rete/CORS/timeout: ' + (e && e.message))});
      throw e;
    });
  };
  window.addEventListener('error', e=>{ DebugLog.add({kind: 'js', ok: false, err: (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno}); });
  window.addEventListener('unhandledrejection', e=>{ DebugLog.add({kind: 'js', ok: false, err: 'promessa non gestita: ' + (e.reason && (e.reason.message || e.reason))}); });
  function panel(){
    let el = document.getElementById('dbgBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'dbgBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    return el;
  }
  window.openDebugLog = function(){
    const el = panel(), all = DebugLog.all().slice().reverse();
    const bad = all.filter(e=> e.ok === false).length;
    const esc = t=> String(t == null ? '' : t).replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🛠️ Diagnostica fonti</b><button class="btn" data-ui-close>Chiudi</button></div>
      <div class="lp-sub">${all.length} eventi · ${bad} errori. Nessuna chiave o token viene registrato. Se una fonte non va, tocca «Copia log» e incollalo a Claude.</div>
      <div class="lp-tools"><button class="btn primary" id="dbgMap">🧭 Mappa fonti</button><button class="btn" id="dbgCopy">📋 Copia log</button><button class="btn" id="dbgClear">🗑️ Svuota</button></div>
      <div class="dbg-rows">${all.slice(0, 120).map(e=> `<div class="dbg-row${e.ok === false ? ' bad' : ''}"><b>${esc(e.t.slice(11, 19))}</b> ${esc(e.src || e.kind || '')} ${e.status != null ? '<span class="dbg-st">HTTP ' + e.status + '</span>' : ''} ${e.ms != null ? e.ms + ' ms' : ''}<br><small>${esc(e.url || '')}${e.err ? ' — ' + esc(e.err) : ''}${e.note ? ' — ' + esc(e.note) : ''}</small></div>`).join('') || '<div class="lp-sub">Ancora nessun evento.</div>'}</div></div>`;
    el.classList.add('show');
    el.querySelector('#dbgCopy').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(DebugLog.text()); if(window.showToast) showToast('Log copiato', 1800); }catch(e){ const ta = document.createElement('textarea'); ta.value = DebugLog.text(); document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(x){} ta.remove(); } });
    el.querySelector('#dbgClear').addEventListener('click', ()=>{ DebugLog.clear(); openDebugLog(); });
    el.querySelector('#dbgMap').addEventListener('click', ()=>{ if(window.openSourceMap) openSourceMap(); else if(window.showToast) showToast('Non disponibile ora', 1800); });
  };
  // apertura nascosta: 5 tocchi sulla riga «Database aggiornato…» oppure ?debug=1
  document.addEventListener('click', e=>{
    const t = e.target && e.target.closest && e.target.closest('#buildLine, #dbAsOf, .db-asof, .frugu-foot');
    if(!t) return;
    window.__dbgTaps = (window.__dbgTaps || []).filter(x=> Date.now() - x < 2500); window.__dbgTaps.push(Date.now());
    if(window.__dbgTaps.length >= 5){ window.__dbgTaps = []; openDebugLog(); }
  });
  document.addEventListener('click', e=>{ if(e.target && e.target.id === 'dbgOpenBtn') openDebugLog(); });
  if(/[?&]debug=1/.test(location.search)) window.addEventListener('load', ()=> setTimeout(()=> openDebugLog(), 800));
})();
(function(){
  const GIF = 'icons/frugu-hd.gif';
  const FLAVOR = ['Frugu Frugu fruga tra i giochi…', 'Consulto le fonti…', 'Leggo le recensioni…', 'Controllo i dettagli…', 'Quasi fatto: metto in ordine il bottino…'];
  let logText = '', cnt = null, stopFn = null, el = null, depth = 0, exact = false, pct = 0, target = 0, label = '', t0 = 0, timer = 0, hideT = 0, raf = 0, manual = 0;

  // Frasi a tema Frugu Frugu per ogni fonte: ruotano mentre la fonte è in consultazione
  const PHR = {
    wikipedia: ['Frugu Frugu sfoglia le pagine di Wikipedia con le zampette bagnate…', 'Consulto Wikipedia: ogni voce è un bidone da scoperchiare…', 'Wikipedia: cerco l\'anno giusto e lo lavo bene prima di servirlo…'],
    wikidata: ['Scavo tra i dati di Wikidata alla ricerca di generi e date…', 'Wikidata: rovisto tra i cassetti dell\'enciclopedia dei dati…', 'Lavo i dati grezzi di Wikidata e li asciugo al sole…'],
    steam: ['Sto scoperchiando i bidoni di Steam alla ricerca di perle nascoste…', 'Scraping dati da Steam: Frugu Frugu ha trovato uno sconto luccicante…', 'Steam: controllo le lingue e le recensioni degli utenti…'],
    pcgw: ['PCGamingWiki: controllo le lingue e i fix con la lente dell\'esperto…', 'Rovistando tra le guide di PCGamingWiki per scovare i dettagli tecnici…'],
    rawg: ['Frugando nei cassonetti di RAWG: quanti titoli ben nascosti!', 'RAWG: setaccio il catalogo e tengo solo i voti dal 5 in su…', 'Interrogo RAWG e lavo per bene ogni scheda…'],
    igdb: ['Frugando nei cassonetti di IGDB, dove i titoli rari fanno capolino…', 'IGDB e MobyGames: Frugu Frugu ci mette dentro tutto il muso…', 'Consulto IGDB per scovare titoli sconosciuti ai più…'],
    metacritic: ['Rovistando tra le recensioni di Metacritic per scovare capolavori…', 'Metacritic e OpenCritic: lavo i voti e li asciugo bene…', 'Confronto i voti della critica: qui i punteggi bassi vanno nel bidone…'],
    riviste: ['Sfoglio le riviste specializzate: Frugu Frugu legge solo le recensioni con le figure…', 'RPGFan e RPGamer: cerco le liste «best of» tra i giornali dimenticati…'],
    reddit: ['Origlio su Reddit dove la gente consiglia i giochi come vecchi amici…', 'Reddit e forum: rovisto tra i thread «se ti è piaciuto X prova Y»…', 'Frugu Frugu fa capolino dai forum: ecco i consigli veri dei giocatori!'],
    retro: ['Nel bidone dei classici: polvere, cartucce e perle dimenticate…', 'Ripesco giochi retro dal fondo del cassonetto…'],
    indie: ['Setaccio gli indie: piccoli bidoni, grandi tesori…', 'Indie e novità: Frugu Frugu annusa qualcosa di fresco…'],
    covers: ['Cerco la locandina giusta tra gli scaffali…', 'Frugu Frugu lucida le copertine prima di appenderle…'],
    gist: ['Metto al sicuro il bottino sul tuo GitHub…', 'Sincronizzo: nascondo le noccioline nella tana…'],
    cheapshark: ['Seguo le tracce di sconti e voti su CheapShark: qui i capolavori si fanno pagare poco…', 'CheapShark: Frugu Frugu annusa le offerte e i punteggi Metacritic…'],
    steamspy: ['SteamSpy: conto i pollici su e giù dei giocatori di Steam…', 'Scoperchio le classifiche di SteamSpy alla ricerca di gemme…'],
    gog: ['Fatturando nei cassonetti di GOG: i classici fanno capolino…', 'GOG: rovisto tra i titoli senza DRM e senza pietà…'],
    scoperte: ['Pesco dal bottino della settimana: Frugu Frugu ha già scoperchiato Steam, GOG e CheapShark…', 'Scoperte del procione: perle già lavate e pronte all\'uso…'],
    proxy: ['Passo dal passaggio segreto per aggirare i blocchi…', 'Un cunicolo laterale per raggiungere la fonte…'],
    ai: ['Frugu Frugu consulta il web con l\'aiuto di Gemini…', 'Scoperchio i bidoni del web e leggo le fonti…', 'Lavando il cibo e verificando i voti degli utenti…', 'Fatturando nei cassonetti più profondi della rete…', 'Annuso qualcosa di buono…', 'Le zampette sono stanche ma il bottino cresce…']
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
    el.innerHTML = `<div class="rt-pet"><img alt="" width="120" height="94" decoding="async"></div>
      <div class="rt-main"><div class="rt-title"></div><div class="rt-sub"></div>
      <div class="rt-count" hidden></div>
      <div class="rt-row"><span class="rt-tag">PE</span><div class="rt-bar"><i></i></div><b class="rt-pct">0%</b></div>
      <button class="rt-stop" type="button" hidden>Basta frugare! Mostra bottino</button></div>
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
    const cEl = el.querySelector('.rt-count'); cEl.hidden = !cnt; if(cnt) cEl.textContent = `🗑️ Giochi trovati nel bidone: ${cnt.n} / ${cnt.max}`;
    const sEl = el.querySelector('.rt-stop'); sEl.hidden = !stopFn;
    el.querySelector('.rt-sub').textContent = logText ? logText : waiting ? 'Ci sta mettendo più del solito: sto ancora aspettando la risposta…' : FLAVOR[Math.min(FLAVOR.length - 1, Math.floor(shown / 22))] + (el2 >= 4 ? ` · ${el2}s` : '');
    el.classList.toggle('done', shown >= 100);
  }
  // Stima calibrata: per ogni richiesta uso la durata media REALE delle volte scorse (salvata per tipo di ricerca).
  // Con più richieste in parallelo la percentuale sale davvero quando una finisce. Se una richiesta supera il tempo abituale
  // non resto fermo su un numero finto: passo a "sto ancora cercando…" con i secondi e la barra che scorre.
  const AVG_KEY = 'jrpg_rt_avg';
  const avgs = ()=>{ try{ return JSON.parse(localStorage.getItem(AVG_KEY) || '{}') || {}; }catch(e){ return {}; } };
  const expectedFor = (lb, search)=> avgs()[lb] || (search ? 14 : 7);
  const learn = (lb, sec)=>{ try{ const m = avgs(); m[lb] = m[lb] ? Math.round((m[lb] * 0.6 + sec * 0.4) * 10) / 10 : sec; localStorage.setItem(AVG_KEY, JSON.stringify(m)); }catch(e){} };
  let calls = [], sessionDone = 0, overdue = false;
  function estimate(){
    const now = performance.now(); let partial = 0; overdue = false;
    calls.forEach(c=>{
      const el = (now - c.t0) / 1000, ex = c.expected;
      const p = el <= ex ? 0.9 * (el / ex) : 0.9 + 0.05 * (1 - Math.exp(-(el - ex) / ex));
      partial += Math.min(0.95, p);
      if(el > ex * 1.15) overdue = true;
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
    const img = el.querySelector('img'); if(!img.getAttribute('src')) img.src = GIF;
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
    active(){ return depth > 0 || manual > 0; },                       // riga di log a tema Frugu Frugu (fonte attuale, giochi trovati…)
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
      const t0 = performance.now();
      const logAi = (ok, e, r)=>{ try{ DebugLog.add({kind: 'ai', src: 'AI · ' + (extra.label || (extra.search ? 'ricerca web' : 'richiesta')) + (extra.search ? ' (con ricerca)' : ''), ok, ms: Math.round(performance.now() - t0), err: ok ? '' : ((e && (e.code || '')) + ' ' + (e && e.message || '')).trim(), note: ok ? ((r && r.sources ? r.sources.length + ' fonti web citate' : '') + (r && r.text ? ' · ' + String(r.text).length + ' caratteri' : ' · risposta vuota')) : ''}); }catch(x){} };
      if(extra.silent){ let p0; try{ p0 = orig.apply(this, arguments); }catch(e){ logAi(false, e); throw e; } return Promise.resolve(p0).then(r=>{ logAi(true, null, r); return r; }, e=>{ logAi(false, e); throw e; }); }
      const lb = extra.label || (extra.search ? 'Cerco online…' : 'Sto pensando…');
      const rec = {t0: performance.now(), label: lb, expected: expectedFor(lb, !!extra.search)};
      if(depth === 0){ calls = []; sessionDone = 0; target = Math.max(0, pct < 100 ? target : 0); }
      calls.push(rec); depth++; if(manual === 0) exact = false;
      open(lb); setSource(extra.search ? 'ai' : 'ai');
      const finish = ok=>{
        if(ok) learn(lb, (performance.now() - rec.t0) / 1000);
        calls = calls.filter(c=> c !== rec); sessionDone++; depth--;
        if(depth <= 0){ depth = 0; close(); }
      };
      let p; try{ p = orig.apply(this, arguments); }catch(e){ finish(false); throw e; }
      return Promise.resolve(p).then(r=>{ finish(true); logAi(true, null, r); return r; }, e=>{ finish(false); logAi(false, e); throw e; });
    };
  }
  // scarica la GIF ad alta risoluzione a riposo, così è già pronta quando serve
  const idle = window.requestIdleCallback || (f=> setTimeout(f, 4000));
  idle(()=>{ try{ if(!(navigator.connection && navigator.connection.saveData)){ const i = new Image(); i.src = GIF; } }catch(e){} });
})();
