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
  const TIER_COL = {'S+':'#f5b82e','S':'#a855f7','A':'#3b82f6','B':'#10b981','C':'#eab308','D':'#f97316','E':'#ef4444','F':'#8b8b8b'};

  // piccolo pannello riutilizzabile
  function sheet(id, title, bodyHtml){
    let el = document.getElementById(id);
    if(!el){ el = document.createElement('div'); el.id = id; el.className = 'dup-backdrop x-sheet'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-x-close]')) el.classList.remove('show'); }); }
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>${title}</b><button class="btn" data-x-close>Chiudi</button></div><div class="x-body">${bodyHtml}</div></div>`;
    el.classList.add('show');
    return el.querySelector('.x-body');
  }

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
    const img = c ? `<img src="${esc(c)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : '';
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
    tb.innerHTML = `<button type="button" data-x-mode="table" title="Tabella" aria-label="Tabella"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lines"/></svg></button><button type="button" data-x-mode="grid" title="Copertine" aria-label="Copertine"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-grid"/></svg></button><button type="button" data-x-mode="cards" title="Schede" aria-label="Schede"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cards"/></svg></button><button type="button" id="xMenuBtn" title="Strumenti extra" aria-label="Extra"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-sparkle"/></svg></button>`;
    cl.appendChild(tb);
    tb.addEventListener('click', e=>{ const b = e.target.closest('button'); if(!b) return; if(b.dataset.xMode) setMode(b.dataset.xMode); else openMenu(); });
  }

  // =====================================================================
  // 2) MENU EXTRA
  // =====================================================================
  function openMenu(){
    const tint = LS.get('jrpg_cover_tint', false);
    const body = sheet('xMenu', '✨ Extra', `
      <div class="lp-sub">Vista della classifica</div>
      <div class="lp-tools"><button class="btn${MODE==='table'?' primary':''}" data-m="table">☰ Tabella</button><button class="btn${MODE==='grid'?' primary':''}" data-m="grid">▦ Copertine</button><button class="btn${MODE==='cards'?' primary':''}" data-m="cards">▤ Schede</button></div>
      <div class="x-menu">
        <button class="btn" data-a="palette">🎨 Palette colori <small>(34 temi)</small></button>
        <button class="btn" data-a="covers">🖼️ Copertine automatiche <small>(Wikipedia)</small></button>
        <button class="btn" data-a="wish">🎁 Wishlist e date di uscita</button>
        <button class="btn" data-a="share">📤 Condividi la tua tier list (immagine)</button>
        <button class="btn" data-a="badges">🏆 Traguardi</button>
        <label class="ask-toggle"><input type="checkbox" id="xTint" ${tint?'checked':''}> 🎨 Colori della scheda presi dalla copertina</label>
      </div>`);
    body.querySelectorAll('[data-m]').forEach(b=> b.addEventListener('click', ()=>{ setMode(b.dataset.m); document.getElementById('xMenu').classList.remove('show'); }));
    body.querySelector('#xTint').addEventListener('change', e=>{ LS.set('jrpg_cover_tint', e.target.checked); toast(e.target.checked ? 'Apri un gioco con copertina per vedere i colori' : 'Colori standard'); });
    body.querySelectorAll('[data-a]').forEach(b=> b.addEventListener('click', ()=>{ document.getElementById('xMenu').classList.remove('show'); ({palette: ()=> window.openPalettePicker && window.openPalettePicker(), covers: openCovers, wish: openWishlist, share: shareTierImage, badges: openBadges})[b.dataset.a](); }));
  }

  // =====================================================================
  // 3) COPERTINE AUTOMATICHE da Wikipedia (richieste a gruppi di 50: ~16 in tutto)
  // =====================================================================
  const WP = 'https://en.wikipedia.org/w/api.php';
  const cleanT = n=> String(n).replace(/\s*\([^)]*\)/g, '').trim();
  async function wpq(params){
    const r = await fetch(WP + '?' + new URLSearchParams(Object.assign({format:'json', origin:'*', formatversion:'2'}, params)));
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
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
  let coversRunning = false;
  function openCovers(){
    const missing = GAMES.filter(g=> !coverOf(g));
    const body = sheet('xCovers', '🖼️ Copertine automatiche', `<div class="lp-sub">Cerco su Wikipedia la copertina ufficiale dei <b>${missing.length}</b> giochi che non ce l'hanno. Le copertine che hai già messo tu non vengono toccate. Si salvano e si sincronizzano come le altre.</div>
      <div class="lp-tools"><button class="btn primary" id="xCovGo" ${coversRunning || !missing.length ? 'disabled' : ''}>${missing.length ? 'Avvia' : 'Tutte le copertine ci sono già'}</button></div><div class="lp-sub" id="xCovSt"></div><div class="x-bar"><i id="xCovBar"></i></div>`);
    const st = body.querySelector('#xCovSt'), bar = body.querySelector('#xCovBar');
    body.querySelector('#xCovGo').addEventListener('click', async e=>{
      if(coversRunning) return; coversRunning = true; e.target.disabled = true;
      let found = 0, done = 0; const left = [];
      const step = ()=>{ bar.style.width = Math.round(done / missing.length * 100) + '%'; st.textContent = `Controllati ${done}/${missing.length} · trovate ${found}`; };
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
          try{ const u = await searchCover(g.name); if(u){ await saveAutoCover(g, u); found++; } }catch(err){}
          done++; step(); await new Promise(r=> setTimeout(r, 700));
          if(!document.getElementById('xCovers').classList.contains('show') && done % 20 === 0) toast(`Copertine: ${found} trovate finora…`);
        }
        st.textContent = `Fatto: ${found} copertine trovate su ${missing.length}. ${missing.length - found ? 'Per le altre puoi usare "Cerca copertina" nella scheda del gioco.' : ''}`;
        toast(`🖼️ ${found} copertine aggiunte`, 4000);
      }finally{ coversRunning = false; try{ render(); }catch(e){} }
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
        const r = await askLLM(prompt, {});
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
    mic.type = 'button'; mic.className = 'x-mic'; mic.title = 'Cerca a voce'; mic.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-mic"/></svg>'; mic.setAttribute('aria-label', 'Cerca a voce');
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
      const r = await askLLM(prompt, {}, {search: true});
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
      return `<div class="x-wrow"><div><b>${esc(it.name)}</b><br><small>${when}${it.note ? ' · ' + esc(it.note) : ''}${it.checked ? ' · controllato il ' + fmtD(it.checked) : ''}</small></div><div class="x-wbtn"><button class="btn" data-w-open="${id}">Apri</button><button class="btn" data-w-check="${id}">↻</button><button class="btn" data-w-del="${id}">✕</button></div></div>`;
    }).join('');
    const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    const body = sheet('xWish', '🎁 Wishlist e uscite', `<div class="lp-sub">Aggiungi un gioco dalla sua scheda con "🎁 Wishlist". Controllo la data di uscita (con Gemini e ricerca web) e ti avviso quando esce, <b>quando apri l'app</b> (un sito web non può avvisarti a app chiusa).</div>
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
        bar.innerHTML = `<button class="btn${on ? ' primary' : ''}" type="button" id="xWishBtn">${on ? '🎁 In wishlist' : '🎁 Wishlist'}</button>`;
        head.insertAdjacentElement('afterend', bar);
        bar.querySelector('#xWishBtn').addEventListener('click', ev=>{ toggleWish(g); const now = !!wl()[g.id]; ev.target.className = 'btn' + (now ? ' primary' : ''); ev.target.textContent = now ? '🎁 In wishlist' : '🎁 Wishlist'; });
      }
      tintModal(g);
    }catch(e){}
    return r;
  };
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
    const body = sheet('xBadges', '🏆 Traguardi', '<div class="x-badges">' + BADGES.map(b=>{ const ok = b[4](s); return `<div class="x-badge${ok ? ' ok' : ''}"><span>${b[1]}</span><b>${esc(b[2])}</b><small>${esc(b[3])}</small></div>`; }).join('') + '</div>');
    return body;
  }
  let bT = 0; const tbody = document.getElementById('tbody');
  if(tbody) new MutationObserver(()=>{ clearTimeout(bT); bT = setTimeout(()=> checkBadges(false), 1500); }).observe(tbody, {childList:true});

  // avvio
  syncMode();
  setTimeout(()=>{ checkBadges(true); releaseAlerts(); }, 2500);
})();
