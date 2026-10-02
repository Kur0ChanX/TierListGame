// v242 — 🧹 SOSPETTI MESSI DA PARTE + 🔍 GUARDA MEGLIO
// 1) Giochi AGGIUNTI sospetti (per adulti, spazzatura/scherzi, demo/prologhi, soundtrack, solo asiatici sconosciuti): spostati a parte,
//    non compaiono più nella lista finché non li rimetti (♻️) o li elimini (🗑️). I 765 di base non vengono mai toccati.
//    Chiavi: jrpg_sus_park {id:{k,r,t}} = messi da parte · jrpg_sus_ok [id] = «tienilo, non è sospetto» (si sincronizzano).
// 2) Frugu Frugu: le proposte sospette non finiscono tra quelle da accettare ma in una pila a parte (jrpg_sus_frugu, ultime 150).
// 3) «🔍 Guarda meglio»: scheda di prova per una proposta non ancora in libreria (locandina vera, foto del gioco, trailer, descrizione,
//    lingua italiana, avvisi per adulti, link a gameplay e recensioni in italiano). Dati da Steam via SearchHub (ponte), locandine da XCOVER.
// Dove si trova: menu ✨ → «🧹 Sospetti messi da parte», e in Novità il pulsante «🧹 Sospetti» accanto a «Scartati».
(function(){
  const U = window.XUI || {};
  const esc = s=> String(s == null ? '' : s).replace(/[&<>"']/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const toast = (m, ms)=>{ try{ (U.toast || window.showToast)(m, ms); }catch(e){} };
  const get = (k, d)=>{ try{ const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } };
  const put = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} if(k === 'jrpg_sus_park') parkRaw = null; };
  const PARK = 'jrpg_sus_park', OK = 'jrpg_sus_ok', FRU = 'jrpg_sus_frugu';
  const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9぀-ヿ㐀-鿿]+/g, ' ').trim();

  const KIND = {adulti: '🔞 Per adulti', spazzatura: '🗑️ Spazzatura o scherzo', demo: '🧪 Demo o prologo', nongioco: '🎵 Non è un gioco', asia: '🇯🇵 Solo asiatico, sconosciuto'};
  // trovati nel controllo del 2 ottobre 2026 (giochi aggiunti, nomi controllati su Steam)
  const LIST = {
    adulti: ['nekopara vol 1', 'nekopara vol 4', 'nekopara extra', 'kinkoi golden loveriche', 'kindred spirits on the roof', 'wanna make it', 'neko nin exheart', 'black souls', 'black souls ii', 'fluffy store',
      'aokana four rhythms across the blue extra2', 'cbt with yuuka kazami', 'marco the galaxy dragon', 'nukitashi', 'nukitashi 2', 'hitler is my crush', 'your wife'],
    spazzatura: ['the test final revelation', 'the test secrets of the soul', 'the test secrets of the soul 2', 'the test hypothesis rising', 'coloring game 2', 'tree simulator 2022', 'silly linguine cat simulator deluxe online',
      'squirrel stapler', 'cat or bread', 'ding dong xl', 'zup s', 'charlie in the moistverse of madness', 'talk to strangers', 'nicotine vs fulanwang', 'owinka shooter', 'intergalactic fishing', 'nazi zombies'],
    demo: ['hello neighbor alpha 2', 'the planet crafter prologue', 'gladiator guild manager prologue', 'kriegsfront tactics prologue'],
    asia: ['封神榜2023', 'at home alone final', 'hachishakusama', 'ghost party nyanbaba', 'kemono friends cellien may cry']
  };
  const BY = {}; Object.keys(LIST).forEach(k=> LIST[k].forEach(n=> BY[norm(n)] = k));
  const RX = [
    ['adulti', /\b(hentai|nukige|eroge|nsfw|18\+|porn|lewd|nekopara|cbt with)\b/i],
    ['nongioco', /\b(original soundtrack|soundtrack|ost|piano collections?|artbook|art book|wallpapers?)\b/i],
    ['demo', /\b(prologue|demo|playtest|alpha \d|pre-alpha)\b/i],
    ['spazzatura', /\b(simulator 20\d\d|coloring game|achievement hunter|clicker 20\d\d)\b/i]
  ];
  const CJK = /[぀-ヿ㐀-鿿가-힯]/;
  // c = gioco o proposta {name, m, score, sus}. Torna {k, r} oppure null
  function check(c){
    if(!c || !c.name) return null;
    const n = String(c.name);
    if(c.sus) return {k: c.sus === 'adulti' ? 'adulti' : 'spazzatura', r: c.sus === 'adulti' ? 'segnato per adulti su RAWG' : 'quasi nessuno lo ha in libreria'};
    const k = BY[norm(n)]; if(k) return {k, r: 'trovato nel controllo dei giochi'};
    for(const [kk, rx] of RX) if(rx.test(n)) return {k: kk, r: 'dal nome'};
    if(CJK.test(n) && c.m !== 'V') return {k: 'asia', r: 'titolo asiatico senza voto verificato'};
    return null;
  }

  // lettura «ricordata»: il filtro della lista la chiama per OGNI gioco, quindi niente JSON.parse se il testo non è cambiato (vedi v208)
  let parkRaw = null, parkObj = {};
  const park = ()=>{ let raw = null; try{ raw = localStorage.getItem(PARK); }catch(e){} if(raw !== parkRaw){ parkRaw = raw; try{ parkObj = JSON.parse(raw || '{}') || {}; }catch(e){ parkObj = {}; } } return parkObj; };
  const okSet = ()=> new Set(get(OK, []) || []);
  const isParked = g=> !!(g && g.custom && park()[g.id]);
  // la lista principale non mostra i giochi messi da parte (stessa funzione usata da tutte le viste della classifica)
  try{ if(typeof inActiveList === 'function'){ const orig = inActiveList; inActiveList = function(g){ return !isParked(g) && orig(g); }; } }catch(e){}

  // al primo giro (e quando arrivano giochi nuovi) controllo i giochi aggiunti
  function scan(quiet){
    if(typeof GAMES === 'undefined') return 0;
    const p = park(), ok = okSet(); let n = 0;
    GAMES.forEach(g=>{ if(!g.custom || p[g.id] || ok.has(String(g.id))) return; const s = check(g); if(s){ p[g.id] = {k: s.k, r: s.r, t: Date.now(), n: g.name}; n++; } });
    if(n){ put(PARK, p); try{ (window.renderWhenIdle || (o=> render()))({}); }catch(e){} if(!quiet) toast('🧹 Ho messo da parte ' + n + ' giochi sospetti: li trovi nel menu ✨ → «Sospetti messi da parte»', 6000); }
    return n;
  }
  const idle = fn=> (window.requestIdleCallback || (f=> setTimeout(f, 1500)))(fn, {timeout: 8000});
  setTimeout(()=> idle(()=> scan(false)), 6000);

  // pila di Frugu
  function addFrugu(c, s){
    const L = get(FRU, []) || [], k = norm(c.name);
    if(L.some(x=> norm(x.name) === k)) return;
    L.unshift({name: c.name, plat: c.plat || '', year: c.year || '', score: c.score != null ? c.score : null, tier: c.tier || '', tags: c.tags || [], story: c.story || '', fitIf: c.fitIf || '', k: s.k, r: s.r, src: c.viaSource || '', t: Date.now()});
    put(FRU, L.slice(0, 150));
  }
  const fruguCount = ()=> (get(FRU, []) || []).length;
  const parkCount = ()=> Object.keys(park()).filter(id=> typeof GAMES === 'undefined' || GAMES.some(g=> String(g.id) === String(id))).length;

  // ---------- 🔍 GUARDA MEGLIO (proposte non ancora in libreria) ----------
  const sj = (u, o)=> window.SearchHub ? SearchHub.json(u, Object.assign({timeout: 15000}, o || {})) : Promise.reject(new Error('no hub'));
  async function steamDetails(c){
    const r = await SearchHub.resolveGame({id: 'peek:' + norm(c.name), name: c.name});
    if(!r || !r.sid) return null;
    const j = await sj('https://store.steampowered.com/api/appdetails?appids=' + r.sid + '&l=italian&cc=it');
    const d = j && j[r.sid] && j[r.sid].success ? j[r.sid].data : null;
    return d ? Object.assign({sid: r.sid}, d) : null;
  }
  function itLang(s){
    const t = String(s || '').replace(/<[^>]+>/g, ' ');
    const m = /(italiano|italian)([^,]*)/i.exec(t); if(!m) return '❌ Niente italiano';
    return /\*/.test(m[2]) ? '🇮🇹 Italiano con doppiaggio' : '🇮🇹 Italiano (testi)';
  }
  function peek(c, acts){
    if(!U.sheet || !c) return;
    acts = acts || {};
    const links = [
      ['▶️ Gameplay ITA', typeof novitaYoutubeUrl === 'function' ? novitaYoutubeUrl(c.name) : 'https://www.youtube.com/results?search_query=' + encodeURIComponent(c.name + ' gameplay ita')],
      ['📰 Recensione ITA', typeof novitaReviewSearchUrl === 'function' ? novitaReviewSearchUrl(c.name) : 'https://www.google.com/search?q=' + encodeURIComponent(c.name + ' recensione')],
      ['📸 Foto gameplay', typeof novitaGameplaySearchUrl === 'function' ? novitaGameplaySearchUrl(c.name) : 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(c.name + ' gameplay')],
      ['🎬 Trailer', 'https://www.youtube.com/results?search_query=' + encodeURIComponent(c.name + ' trailer')]
    ];
    const s = check(c);
    const body = U.sheet('xPeek', '🔍 ' + esc(c.name), `<div class="gm-wrap">
      <div class="gm-top"><div class="gm-cover"><div class="gm-ph">⏳</div></div>
        <div class="gm-info"><div class="gm-meta">${esc(c.year || '?')} · ${esc(c.plat || '?')}</div>
          ${c.score != null ? `<div class="gm-score"><span class="badge ${typeof TIER_LABEL !== 'undefined' ? (TIER_LABEL[c.tier] || '') : ''}">${esc(c.tier || '')}</span> <b>${c.score}</b>/100 ${c.m === 'V' ? '✔ verificato' + (c.vs ? ' (' + esc(c.vs) + ')' : '') : '<small>stima, non verificato</small>'}</div>` : ''}
          ${s ? `<div class="gm-warn">${KIND[s.k]}: ${esc(s.r)}</div>` : ''}
          <div class="gm-chips" id="gmChips"><span class="gm-chip">⏳ chiedo a Steam…</span></div></div></div>
      <div class="gm-shots" id="gmShots"><div class="gm-shot gm-sk"></div><div class="gm-shot gm-sk"></div></div>
      <div class="gm-desc" id="gmDesc">${c.fitIf ? '<b>Potrebbe piacerti perché</b> ' + esc(c.fitIf) : ''}</div>
      <div class="gm-links">${links.map(l=> `<a class="novita-link-btn" href="${l[1]}" target="_blank" rel="noopener">${l[0]}</a>`).join('')}<span id="gmSteam"></span></div>
      ${acts.like || acts.nope || acts.restore ? `<div class="gm-acts">${acts.nope ? '<button class="btn" data-gm="nope">✕ Non fa per me</button>' : ''}${acts.restore ? '<button class="btn" data-gm="restore">♻️ Rimetti tra le proposte</button>' : ''}${acts.like ? '<button class="btn primary" data-gm="like">♥ Aggiungi alla libreria</button>' : ''}</div>` : ''}
    </div>`);
    const sheetEl = body.closest('.x-sheet');
    body.querySelectorAll('[data-gm]').forEach(b=> b.addEventListener('click', ()=>{ sheetEl.classList.remove('show'); const f = acts[b.dataset.gm]; if(f) f(); }));
    const alive = ()=> sheetEl.classList.contains('show') && body.isConnected;
    // locandina vera (Steam, Libretro, Wikipedia, Wikimedia, RAWG: solo immagini che esistono davvero)
    (async()=>{
      let list = [];
      try{ if(window.XCOVER && XCOVER.all) list = await XCOVER.all({id: 'peek:' + norm(c.name), name: c.name, plat: c.plat || '', year: c.year || ''}); }catch(e){}
      if(!alive()) return;
      const box = body.querySelector('.gm-cover');
      box.innerHTML = list.length ? `<img src="${esc(list[0].url)}" alt="" loading="lazy"><small>${esc(list[0].source || '')}</small>` : '<div class="gm-ph">🖼️<br><small>nessuna locandina trovata</small></div>';
      const im = box.querySelector('img'); if(im) im.addEventListener('click', ()=> window.rtPreview && rtPreview(im.src));
    })();
    // Steam: foto, trailer, descrizione, italiano, avvisi
    (async()=>{
      let d = null; try{ d = await steamDetails(c); }catch(e){}
      if(!alive()) return;
      const chips = body.querySelector('#gmChips'), shots = body.querySelector('#gmShots'), desc = body.querySelector('#gmDesc');
      if(!d){ chips.innerHTML = '<span class="gm-chip">Non trovato su Steam</span>'; shots.innerHTML = '<div class="lp-sub">Niente foto da Steam: usa «📸 Foto gameplay» qui sotto.</div>'; return; }
      const cd = (d.content_descriptors && d.content_descriptors.ids) || [];
      const c2 = [itLang(d.supported_languages)];
      if(d.metacritic && d.metacritic.score) c2.push('Metacritic ' + d.metacritic.score);
      if(d.recommendations && d.recommendations.total) c2.push('👍 ' + d.recommendations.total.toLocaleString('it-IT') + ' recensioni Steam');
      if(d.release_date && d.release_date.date) c2.push('📅 ' + d.release_date.date);
      if((d.genres || []).length) c2.push(d.genres.map(x=> x.description).slice(0, 3).join(' · '));
      if(d.type && d.type !== 'game') c2.push('⚠️ su Steam è «' + d.type + '», non un gioco');
      chips.innerHTML = c2.map(x=> `<span class="gm-chip">${esc(x)}</span>`).join('') + (cd.some(x=> x === 1 || x === 3 || x === 4) ? '<span class="gm-chip gm-bad">🔞 Contenuti sessuali (Steam)</span>' : '');
      const pics = (d.screenshots || []).map(x=> ({t: String(x.path_thumbnail || '').replace(/\?.*$/, ''), f: String(x.path_full || '').replace(/\?.*$/, '')})).filter(x=> x.f).slice(0, 12);
      const mov = (d.movies || []).slice(0, 2).map(m=> ({t: String(m.thumbnail || '').replace(/\?.*$/, ''), v: (m.mp4 && (m.mp4.max || m.mp4['480'])) || ''}));
      shots.innerHTML = mov.filter(m=> m.v).map(m=> `<video class="gm-shot" controls preload="none" playsinline poster="${esc(m.t)}" src="${esc(m.v)}"></video>`).join('') +
        pics.map(p=> `<img class="gm-shot" src="${esc(p.t || p.f)}" data-full="${esc(p.f)}" alt="" loading="lazy">`).join('') || '<div class="lp-sub">Steam non ha foto di questo gioco.</div>';
      shots.querySelectorAll('img.gm-shot').forEach(im=> im.addEventListener('click', ()=> window.rtPreview && rtPreview(im.dataset.full || im.src)));
      if(d.short_description) desc.innerHTML = (desc.innerHTML ? desc.innerHTML + '<br><br>' : '') + esc(String(d.short_description).replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
      const st = body.querySelector('#gmSteam'); if(st) st.innerHTML = `<a class="novita-link-btn" href="https://store.steampowered.com/app/${d.sid}/" target="_blank" rel="noopener">🛒 Pagina Steam</a>`;
    })();
  }

  // ---------- 🧹 PANNELLO SOSPETTI ----------
  let tab = 'lib';
  function open(t){
    if(!U.sheet) return;
    tab = t || tab;
    scan(true);
    const p = park(), ids = Object.keys(p).filter(id=> GAMES.some(g=> String(g.id) === String(id)));
    const F = get(FRU, []) || [];
    const row = (name, k, r, btns, sub)=> `<div class="gc-row sus-row"><span><b>${esc(name)}</b> <small>${KIND[k] || ''}${r ? ' · ' + esc(r) : ''}${sub ? ' · ' + esc(sub) : ''}</small></span><span class="sus-btns">${btns}</span></div>`;
    const lib = ids.length ? ids.map(id=>{ const g = GAMES.find(x=> String(x.id) === String(id)), e = p[id];
      return row(g.name, e.k, e.r, `<button class="btn" data-open="${esc(id)}" title="Apri la scheda">🔍</button><button class="btn" data-keep="${esc(id)}" title="Non è sospetto: rimettilo nella lista">♻️</button><button class="btn" data-del="${esc(id)}" title="Eliminalo dalla libreria">🗑️</button>`, g.year); }).join('')
      : '<div class="lp-sub">Nessun gioco della libreria messo da parte.</div>';
    const fr = F.length ? F.map((c, i)=> row(c.name, c.k, c.r, `<button class="btn" data-peek="${i}" title="Guarda meglio">🔍</button><button class="btn" data-add="${i}" title="Aggiungilo comunque">➕</button><button class="btn" data-drop="${i}" title="Toglilo dalla pila">✕</button>`, [c.year, c.src].filter(Boolean).join(' · '))).join('')
      : '<div class="lp-sub">Frugu non ha ancora messo da parte niente.</div>';
    const body = U.sheet('xSus', '🧹 Sospetti messi da parte', `
      <div class="lp-sub">Giochi per adulti, spazzatura, demo, soundtrack o titoli asiatici sconosciuti. <b>Non sono cancellati</b>: quelli della libreria sono solo nascosti dalla lista. Tocca 🔍 per guardarli meglio.</div>
      <div class="lp-tools"><button class="btn${tab === 'lib' ? ' primary' : ''}" data-t="lib">📚 Dalla libreria (${ids.length})</button><button class="btn${tab === 'fru' ? ' primary' : ''}" data-t="fru">🦝 Da Frugu (${F.length})</button></div>
      ${tab === 'lib' ? `<div class="gc-rows">${lib}</div>${ids.length > 1 ? '<div class="lp-tools"><button class="btn" data-keepall>♻️ Rimetti tutti nella lista</button><button class="btn" data-delall>🗑️ Elimina tutti</button></div>' : ''}`
        : `<div class="gc-rows">${fr}</div>${F.length > 1 ? '<div class="lp-tools"><button class="btn" data-dropall>✕ Svuota la pila</button></div>' : ''}`}`);
    const re = ()=> open(tab);
    const refresh = ()=>{ try{ (window.renderWhenIdle || (o=> render()))({}); }catch(e){} };
    body.querySelectorAll('[data-t]').forEach(b=> b.addEventListener('click', ()=> open(b.dataset.t)));
    body.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = GAMES.find(x=> String(x.id) === b.dataset.open); if(g && typeof openModal === 'function'){ body.closest('.x-sheet').classList.remove('show'); openModal(g.id); } }));
    const keep = id=>{ const q = park(); delete q[id]; put(PARK, q); const o = okSet(); o.add(String(id)); put(OK, [...o]); };
    body.querySelectorAll('[data-keep]').forEach(b=> b.addEventListener('click', ()=>{ keep(b.dataset.keep); refresh(); toast('♻️ Rimesso nella lista'); re(); }));
    body.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>{ const g = GAMES.find(x=> String(x.id) === b.dataset.del); if(!g || !confirm('Elimino «' + g.name + '» dalla libreria?')) return; const q = park(); delete q[g.id]; put(PARK, q); if(window.rtDeleteGame) rtDeleteGame(g); toast('🗑️ Eliminato'); re(); }));
    const ka = body.querySelector('[data-keepall]'); if(ka) ka.addEventListener('click', ()=>{ ids.forEach(keep); refresh(); toast('♻️ Tutti rimessi nella lista'); re(); });
    const da = body.querySelector('[data-delall]'); if(da) da.addEventListener('click', ()=>{ if(!confirm('Elimino dalla libreria tutti i ' + ids.length + ' giochi messi da parte?')) return; const q = park(); ids.forEach(id=>{ const g = GAMES.find(x=> String(x.id) === String(id)); delete q[id]; if(g && window.rtDeleteGame) rtDeleteGame(g); }); put(PARK, q); toast('🗑️ Eliminati ' + ids.length + ' giochi'); re(); });
    const fx = i=> (get(FRU, []) || [])[+i];
    const drop = i=>{ const L = get(FRU, []) || []; L.splice(+i, 1); put(FRU, L); };
    body.querySelectorAll('[data-peek]').forEach(b=> b.addEventListener('click', ()=>{ const c = fx(b.dataset.peek); if(c) peek(c, {like: ()=>{ addGame(c); drop(b.dataset.peek); }, nope: ()=>{ drop(b.dataset.peek); }}); }));
    body.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const c = fx(b.dataset.add); if(c){ addGame(c); drop(b.dataset.add); re(); } }));
    body.querySelectorAll('[data-drop]').forEach(b=> b.addEventListener('click', ()=>{ drop(b.dataset.drop); re(); }));
    const dd = body.querySelector('[data-dropall]'); if(dd) dd.addEventListener('click', ()=>{ put(FRU, []); re(); });
  }
  function addGame(c){
    try{ const o = okSet(); askToolAddCustomGame(Object.assign({}, c), 'Novità'); setTimeout(()=>{ const g = GAMES.find(x=> x.custom && norm(x.name) === norm(c.name)); if(g){ o.add(String(g.id)); put(OK, [...o]); } }, 1500); toast('➕ Aggiunto alla libreria'); }
    catch(e){ toast((e && e.message) || 'Non sono riuscito ad aggiungerlo'); }
  }

  try{ (window.XMENU = window.XMENU || []).push({html: '🧹 Sospetti messi da parte', run: ()=> open('lib')}); }catch(e){}
  window.rtSus = {check, isParked, scan, addFrugu, fruguCount, parkCount, open, peek, KIND};
})();
