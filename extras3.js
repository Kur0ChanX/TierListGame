// ---- Extra 3 (v135): radar delle uscite, prova del nove sul voto, termometro della community, mappa delle versioni, rischio introvabile,
// percorso di saga, tema dalla copertina, gusti imparati, tier list animata, vetrina, scansione dello scaffale, gesti rapidi,
// ricerca tollerante con sigle, copertine offline, cronologia delle modifiche, rapporto qualità notturno. Caricato dopo extras2.js.
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS, TIER_COL} = U;
  // v208: BLOCCHI DI 40 SECONDI all'avvio — il modello dei gusti si ricalcolava per OGNI gioco (rileggendo tutti i dati ogni volta).
  // Ora c'è un contatore di versione: cambia solo quando cambia davvero un dato dei gusti (preferiti, stati, voti, cuori, icone, valutazioni, DNA…).
  // Finché non cambia, il modello è già pronto e costa zero. Le letture «solo per guardare» non rifanno il JSON.parse se il testo è uguale.
  let TVER = 1;
  const TASTE_RX = /jrpg_(favs|status|mytier|myvote|top|react|rate|dna_why|dna_custom|taste|active_profile)/;
  (function(){
    const _s = Storage.prototype.setItem, _r = Storage.prototype.removeItem;
    Storage.prototype.setItem = function(k, v){ const r = _s.apply(this, arguments); try{ if(TASTE_RX.test(k)) TVER++; }catch(e){} return r; };
    Storage.prototype.removeItem = function(k){ const r = _r.apply(this, arguments); try{ if(TASTE_RX.test(k)) TVER++; }catch(e){} return r; };
  })();
  window.rtTasteVer = ()=> TVER;
  window.rtTasteDirty = ()=>{ TVER++; };
  const RO = new Map();       // lettura senza modifiche: chiave -> {raw, val}
  const LSro = (k, d)=>{ let raw = null; try{ raw = localStorage.getItem(k); }catch(e){} if(raw == null) return d; const c = RO.get(k); if(c && c.raw === raw) return c.val; let val = d; try{ val = JSON.parse(raw); }catch(e){} RO.set(k, {raw, val}); return val; };
  window.rtLSro = LSro;
  const gi = n=> (typeof giIcon === 'function') ? giIcon(n) : '';
  const menu = (html, run)=>{ (window.XMENU = window.XMENU || []).push({html, run}); };
  const nrm = s=> String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const facts = g=>{ try{ return (window.SearchHub && SearchHub.factsFor(g)) || null; }catch(e){ return null; } };
  const TIERS = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
  const fmtN = n=> Number(n).toLocaleString('it-IT');
  const eur = n=> Number(n).toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  const loadScript = src=> new Promise((res, rej)=>{ const b = (document.querySelector('meta[name="build"]') || {}).content || '0'; const s = document.createElement('script'); s.src = src + '?b=' + b; s.async = true; s.onload = ()=> res(); s.onerror = ()=> rej(new Error('file ' + src + ' non trovato')); document.head.appendChild(s); });
  window.RT_LOAD = loadScript;

  // =====================================================================
  // DATI NOTTURNI: radar.js e quality.js (caricati dopo l'avvio, non pesano)
  // =====================================================================
  setTimeout(()=>{ loadScript('radar.js').then(radarCheck).catch(()=>{}); loadScript('quality.js').catch(()=>{}); }, 4000);

  // =====================================================================
  // 1) RADAR DELLE USCITE
  // =====================================================================
  function tagWeights(){
    const w = {};
    GAMES.forEach(g=>{ const s = STATUSES[g.id]; const k = (FAVS.has(g.id) ? 2 : 0) + (s === 'played' ? 1 : s === 'playing' ? 1 : s === 'dropped' ? -1.5 : 0); if(k) (g.tags || []).forEach(t=> w[t] = (w[t] || 0) + k); });
    return w;
  }
  function radarItems(){
    if(typeof RADAR === 'undefined' || !RADAR.items) return [];
    const wish = LS.get('jrpg_wishlist', {}) || {}, wishN = Object.values(wish).map(x=> nrm(x && x.name)).filter(Boolean);
    const know = new Set(GAMES.map(g=> nrm(g.name))), tw = tagWeights();
    return RADAR.items.map(r=>{
      const n = nrm(r[0]), tags = String(r[5] || '').split(',').filter(Boolean);
      const inWish = wishN.some(w=> w && (w === n || (w.length > 5 && n.startsWith(w)) || (n.length > 5 && w.startsWith(n))));
      const fit = tags.reduce((a, t)=> a + (tw[t] || 0), 0);
      return {name: r[0], app: r[1], date: r[2], pct: r[3], cnt: r[4], tags, price: r[6], inWish, fit, known: know.has(n)};
    }).filter(x=> !x.known).sort((a, b)=> (b.inWish - a.inWish) || (b.fit - a.fit) || (b.pct - a.pct));
  }
  function radarCheck(){
    const it = radarItems(); if(!it.length) return;
    const today = new Date().toISOString().slice(0, 10);
    if(LS.get('rt_radar_seen', '') === today) return;
    const wishHits = it.filter(x=> x.inWish), mine = it.filter(x=> x.fit > 0).slice(0, 3);
    if(!wishHits.length && !mine.length) return;
    LS.set('rt_radar_seen', today);
    setTimeout(()=> showToast(wishHits.length ? '📡 Radar: è uscito «' + wishHits[0].name + '» dalla tua wishlist! Tocca per vederlo' : '📡 Radar: ' + mine.length + ' uscite nuove adatte a te. Tocca per vederle', 7000, openRadar), 3000);
  }
  function openRadar(){
    const it = radarItems();
    if(!it.length){ sheet('xRadar', gi('target') + ' Radar delle uscite', '<div class="lp-sub">Il radar si aggiorna ogni notte su GitHub (workflow «Dati settimanali»). Non ci sono ancora dati: lancialo una volta da Actions, poi torna qui.</div>'); return; }
    const row = x=> `<div class="rd-row"><div><b>${esc(x.name)}</b>${x.inWish ? ' <span class="rd-wish">dalla tua wishlist</span>' : ''}<br><small>${esc(x.date)} · ${x.pct}% positive su ${fmtN(x.cnt)} · ${x.tags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(', ')}${x.price ? ' · ' + esc(x.price) : ''}</small></div>
      <div class="rd-act"><a class="btn" href="https://store.steampowered.com/app/${x.app}/" target="_blank" rel="noopener">Steam</a><button class="btn" data-rd-add="${esc(x.name)}" type="button">${gi('heart')}</button></div></div>`;
    const body = sheet('xRadar', gi('target') + ' Radar delle uscite', `<div class="lp-sub">Giochi usciti negli ultimi 45 giorni su Steam nei generi della app, con almeno il 70% di recensioni positive. Prima quelli della tua wishlist, poi quelli più vicini ai tuoi gusti. Aggiornato il ${esc(RADAR.built)}.</div><div class="rd-list">${it.slice(0, 60).map(row).join('')}</div>`);
    body.querySelectorAll('[data-rd-add]').forEach(b=> b.addEventListener('click', ()=>{
      const x = it.find(y=> y.name === b.dataset.rdAdd); if(!x) return;
      try{ askToolAddCustomGame({name: x.name, plat: 'PC', year: x.date.slice(0, 4), score: x.pct, tier: x.pct >= 95 ? 'S' : x.pct >= 90 ? 'A' : x.pct >= 80 ? 'B' : 'C', tags: x.tags.filter(t=> TAG_INFO[t])}, 'Radar delle uscite'); b.disabled = true; b.textContent = '✓'; }
      catch(e){ toast((e && e.message) || 'Non aggiunto', 4000); }
    }));
  }
  menu(gi('target') + ' Radar delle uscite', openRadar);

  // =====================================================================
  // 2) PROVA DEL NOVE SUL VOTO + 3) TERMOMETRO + 5) RISCHIO INTROVABILE + 4) VERSIONI + 15) SAGA + 29) CRONOLOGIA
  // =====================================================================
  function nineHtml(g){
    const f = facts(g), vals = [];
    vals.push({src: g.m === 'V' ? 'Metacritic (database)' : 'Stima del database', v: g.score, main: true});
    if(f && f.s && f.s.mc) vals.push({src: 'Metascore su Steam', v: f.s.mc});
    if(f && f.c && f.c.mc && !(f.s && f.s.mc === f.c.mc)) vals.push({src: 'Metascore su CheapShark', v: f.c.mc});
    const ap = (f && f.s && f.s.ap) || (f && f.c && f.c.sp); const an = (f && f.s && f.s.an) || (f && f.c && f.c.sc);
    if(ap) vals.push({src: 'Utenti Steam' + (an ? ' (' + fmtN(an) + ')' : ''), v: ap});
    if(vals.length < 2) return '';
    const nums = vals.map(x=> x.v), spread = Math.max(...nums) - Math.min(...nums);
    const verdict = spread <= 8 ? ['ok', 'Fonti d\'accordo: voto solido'] : spread <= 14 ? ['mid', 'Fonti abbastanza d\'accordo'] : ['bad', 'Fonti in disaccordo: prendilo con le pinze'];
    return `<div class="nine nine-${verdict[0]}"><div class="nine-head">${gi('scale')} <b>Prova del nove</b> · ${verdict[1]} <small>(scarto ${spread})</small></div><div class="nine-chips">${vals.map(x=> `<span class="nine-chip${x.main ? ' main' : ''}"><b>${x.v}</b> ${esc(x.src)}</span>`).join('')}</div></div>`;
  }
  function thermoHtml(g){
    const f = facts(g), s = f && f.s; if(!s || s.rp == null || s.ap == null) return '';
    const d = s.rp - s.ap, cls = d >= 5 ? 'up' : d <= -5 ? 'down' : 'flat';
    const txt = d >= 5 ? 'Sta migliorando: gli ultimi giocatori lo apprezzano più di prima (patch, aggiornamenti o riscoperta)' : d <= -5 ? 'In calo: le recensioni recenti sono peggiori di quelle di sempre (controlla cosa è cambiato)' : 'Stabile: i giocatori di oggi la pensano come quelli di sempre';
    return `<div class="thermo thermo-${cls}"><div class="thermo-bar"><i style="width:${s.ap}%"></i><u style="left:${s.rp}%"></u></div><div><b>Termometro Steam</b> · ultimi 30 giorni <b>${s.rp}%</b> (${s.rn} recensioni) · da sempre <b>${s.ap}%</b><br><small>${txt}</small></div></div>`;
  }
  const MODERN = /\b(pc|steam|windows|switch|ps4|ps5|xbox|mobile|ios|android|stadia|mac|linux)\b/i;
  function rarityHtml(g){
    const p = String(g.plat || ''), f = facts(g);
    const notes = [];
    if(p && !MODERN.test(p)) notes.push('Esiste solo su console di vecchia generazione: oggi si trova usato o tramite emulazione/collezioni. Se ti interessa, compralo finché si trova a buon prezzo.');
    if(f && f.s && f.s.id && !f.s.p) notes.push('Su Steam la pagina esiste ma non ha un prezzo: potrebbe essere stato ritirato dalla vendita.');
    if(!notes.length) return '';
    return `<div class="rarity">${gi('gem')} <div><b>Rischio introvabile</b><br><small>${notes.join('<br>')}</small></div></div>`;
  }
  function sagaPathHtml(g){
    let key = null; try{ key = sagaKeyOf(g); }catch(e){}
    if(!key) return '';
    const list = GAMES.filter(x=>{ try{ return sagaKeyOf(x) === key; }catch(e){ return false; } }).sort((a, b)=> (a.ysort || 0) - (b.ysort || 0));
    if(list.length < 2) return '';
    const hrs = x=> (x.label && x.label.h) || (x.enrich && x.enrich.hoursMain) || 0;
    const price = x=>{ const f = facts(x); return f && f.s && f.s.p ? f.s.p.f : null; };
    const hasRemake = new Set(list.filter(x=> (x.tags || []).includes('REMAKE')).map(x=> nrm(x.name).replace(/ (remake|remastered|hd|reborn|definitive edition|pixel remaster)\b.*/, '')));
    let totH = 0, totP = 0, nP = 0;
    const rows = list.map(x=>{
      const base = nrm(x.name);
      const skip = x.score < 75 ? 'saltabile (voto basso)' : (!(x.tags || []).includes('REMAKE') && [...hasRemake].some(r=> r && base.startsWith(r))) ? 'c\'è il remake: gioca quello' : '';
      if(!skip){ totH += hrs(x); const pr = price(x); if(pr != null){ totP += pr; nP++; } }
      const st = STATUSES[x.id];
      return `<button type="button" class="sp-row${x.id === g.id ? ' cur' : ''}${skip ? ' skip' : ''}" data-sp="${x.id}"><span class="badge ${TIER_LABEL[x.tier]}">${x.tier}</span><span class="sp-n">${esc(x.name)}<small>${esc(x.year || '')}${hrs(x) ? ' · ' + hrs(x) + ' h' : ''}${price(x) != null ? ' · ' + eur(price(x)) : ''}${skip ? ' · ' + skip : ''}</small></span>${st === 'played' ? gi('check') : ''}</button>`;
    }).join('');
    return `<details class="sp-box"${list.length <= 6 ? ' open' : ''}><summary><span class="modal-section-title">${gi('layers')} Percorso della saga (${list.length})</span><span class="sp-tot">Consigliato: <b>${totH || '?'} ore</b>${nP ? ' · circa <b>' + eur(totP) + '</b> su Steam (' + nP + ' con prezzo)' : ''}</span></summary><div class="sp-list">${rows}</div></details>`;
  }
  // 4) mappa delle versioni (AI con ricerca web, salvata per ogni gioco)
  const VK = 'jrpg_versions';
  function versionsHtml(g){
    const v = (LS.get(VK, {}) || {})[g.id];
    const table = v && v.list && v.list.length ? `<div class="vm-list">${v.list.map(x=> `<div class="vm-row${x.best ? ' best' : ''}"><b>${esc(x.name)}</b>${x.best ? ' <span class="vm-best">consigliata</span>' : ''}<br><small>${esc([x.platforms, x.year, x.italian ? 'italiano: ' + x.italian : '', x.note].filter(Boolean).join(' · '))}</small></div>`).join('')}</div><div class="lp-sub">Dall'AI con ricerca web il ${esc(new Date(v.t).toLocaleDateString('it-IT'))}: verifica prima di comprare.</div>` : '';
    return `<div class="modal-section-title">${gi('screen')} Quale versione conviene?</div>${table}<button class="btn" type="button" id="vmBtn">${gi('lens')} ${table ? 'Rifai l\'analisi' : 'Confronta le versioni'}</button>`;
  }
  async function runVersions(g){
    if(typeof llmAvailable === 'function' && !llmAvailable()){ toast('Serve una chiave Gemini (⚙️ Impostazioni in Chiedi)', 4000); return; }
    const f = facts(g);
    const prompt = `Elenca le versioni ufficiali del videogioco "${g.name}" (originale, remaster, remake, porting e collezioni) che si possono giocare oggi. Per ognuna: name, platforms, year, italian ("testi e doppiaggio" | "sottotitoli" | "no" | "?"), note (breve: qualità tecnica, contenuti extra, difetti noti), best (true solo per quella che conviene di più oggi). Dati di Steam già noti: ${f && f.s ? 'italiano Steam ' + (f.s.it || '?') + (f.s.p ? ', prezzo ' + f.s.p.f + '€' : '') : 'nessuno'}. Non inventare: se non sei sicuro scrivi "?". Rispondi SOLO con JSON: {"list":[...]}`;
    const b = document.getElementById('vmBtn'); if(b){ b.disabled = true; b.textContent = 'Sto confrontando…'; }
    try{
      const r = await askLLM(prompt, {}, {search: true, label: 'Confronto le versioni di ' + g.name + '…'});
      const t = String(r && r.text || ''), a = t.indexOf('{'), z = t.lastIndexOf('}');
      const j = JSON.parse(t.slice(a, z + 1));
      if(!j.list || !j.list.length) throw new Error('vuoto');
      const all = LS.get(VK, {}) || {}; all[g.id] = {t: new Date().toISOString(), list: j.list.slice(0, 8)}; LS.set(VK, all);
      history(g.id, 'Versioni', '—', j.list.length + ' versioni analizzate', 'AI + ricerca web');
    }catch(e){ toast('Non sono riuscito a confrontare le versioni: riprova', 4000); }
    try{ openModal(g); }catch(e){}
  }

  // 29) cronologia delle modifiche (verify.js registra le correzioni; qui le copertine e il resto)
  function history(id, field, from, to, src, undo){
    const h = LS.get('jrpg_history', {}) || {};
    (h[id] = h[id] || []).unshift({t: new Date().toISOString(), f: field, a: String(from == null ? '—' : from).slice(0, 160), b: String(to == null ? '—' : to).slice(0, 160), s: src || '', u: undo || null});
    h[id] = h[id].slice(0, 30); LS.set('jrpg_history', h);
  }
  window.rtHistory = history;
  function historyHtml(g){
    const h = ((LS.get('jrpg_history', {}) || {})[g.id]) || [];
    if(!h.length) return '';
    return `<details class="hist"><summary>${gi('refresh')} Cronologia delle modifiche (${h.length})</summary>${h.map((x, i)=> `<div class="hist-row"><small>${esc(new Date(x.t).toLocaleDateString('it-IT'))} · ${esc(x.s)}</small><br><b>${esc(x.f)}</b>: ${esc(x.a)} → ${esc(x.b)}${x.u ? ` <button class="btn" type="button" data-hist-undo="${i}">Annulla</button>` : ''}</div>`).join('')}</details>`;
  }
  async function historyUndo(g, i){
    const h = LS.get('jrpg_history', {}) || {}, x = (h[g.id] || [])[i]; if(!x || !x.u) return;
    try{
      if(x.u.cover !== undefined){
        if(x.u.cover){ await window.XCOVER.save(g, x.u.cover); }
      } else if(x.u.patch && window.rtApplyPatch){ await window.rtApplyPatch(g, x.u.patch); }
      history(g.id, x.f, x.b, x.a, 'annullato da te');
      toast('Modifica annullata', 2500);
    }catch(e){ toast('Non riesco ad annullare questa modifica', 3000); }
    try{ openModal(g); }catch(e){}
  }
  // copertine: registra ogni cambio (automatico o dalla lente)
  if(window.XCOVER){
    const origSave = window.XCOVER.save;
    window.XCOVER.save = async function(g, url){
      const prev = (typeof effectiveCover === 'function') ? effectiveCover(g) : null;
      const r = await origSave.apply(this, arguments);
      if(prev !== url) history(g.id, 'Locandina', prev ? 'immagine precedente' : 'nessuna', 'nuova immagine', 'ricerca copertina', prev ? {cover: prev} : null);
      return r;
    };
  }

  // =====================================================================
  // 13) I TUOI GUSTI (imparati): modello per tag, difficoltà, grinding, storia, ritmo, durata, epoca
  // =====================================================================
  const TI = t=> Math.max(0, TIERS.indexOf(t));
  function signals(){
    const out = [];
    let MT = {}; try{ MT = MYTIER || {}; }catch(e){}
    const MV = LSro('jrpg_myvote', {}) || {};
    const TOP = LSro('jrpg_top', []) || [];        // v199: «👑 I miei top» in ordine: il n.1 pesa più di tutti
    GAMES.forEach(g=>{
      let w = 0; const s = STATUSES[g.id], ti = TOP.indexOf(g.id);
      if(ti >= 0) w += Math.max(2.4, 4 - ti * .08);
      if(MV[g.id] != null) w += (MV[g.id] - 6) * .5;          // il tuo voto personale insegna molto
      if(FAVS.has(g.id)) w += 2;
      if(s === 'played') w += 1; else if(s === 'playing') w += .6; else if(s === 'backlog') w += .25; else if(s === 'dropped') w -= 2;
      if(MT[g.id]) w += (TI(g.tier) - TI(MT[g.id])) * .8;
      try{ if(window.rtBrain) w += rtBrain.sigFor(g, MV[g.id] != null); }catch(e){}      // v203: icone 👍👎🚫💔🔁 e valutazioni a 6 voci (cervello.js)
      if(w) out.push({g, w});
    });
    return out;
  }
  // ---- MECCANICHE: cosa ti tiene incollato a un gioco, oltre al genere (loot, build, crescita…). Si riconoscono da testi, pro, loop e dati di ogni scheda ----
  const MECH = {
    LOOT:   {ic: '🎁', n: 'Caccia al loot e drop rate', d: 'oggetti rari e drop casuali che ti tengono incollato'},
    BUILD:  {ic: '🧩', n: 'Build e min-maxing', d: 'costruire la build perfetta, combinare sistemi, «rompere» il gioco'},
    POWER:  {ic: '📈', n: 'Crescita e potenza visibile', d: 'il personaggio diventa sempre più forte e si vede'},
    CHALL:  {ic: '🎯', n: 'Sfida che premia strategia e ottimizzazione', d: 'boss duri che si battono preparandosi e ottimizzando'},
    DOPA:   {ic: '⚡', n: 'Effetto dopamina', d: 'un ciclo che ti premia di continuo: «ancora un turno»'},
    EFFORT: {ic: '💪', n: 'Gratificazione dello sforzo', d: 'più ti impegni, più vieni ricompensato'},
    FARM:   {ic: '🌾', n: 'Farming con beneficio tangibile', d: 'ripetere un\'attività se porta vantaggi concreti'},
    COLL:   {ic: '🏆', n: 'Collezionabili', d: 'raccogliere, completare, catturare tutto'},
    // v195 — il DNA si allarga: non solo «cosa ti tiene incollato», ma anche mondo, storia, sistemi e sensazioni
    LORE:   {ic: '📜', n: 'Lore profonda', d: 'mitologia, segreti del mondo, storia da scoprire in documenti e dettagli'},
    WORLD:  {ic: '🗺️', n: 'World building', d: 'un mondo coerente e vivo, con culture, luoghi e regole propri'},
    EXPLO:  {ic: '🧭', n: 'Esplorazione e segreti', d: 'esplorare ogni angolo, aree nascoste, scorciatoie e scoperte'},
    CRAFT:  {ic: '🔨', n: 'Crafting', d: 'creare e migliorare oggetti, armi, ricette'},
    RES:    {ic: '🎒', n: 'Gestione delle risorse', d: 'risorse limitate da amministrare: munizioni, cure, soldi, inventario'},
    SAND:   {ic: '🏖️', n: 'Libertà sandbox', d: 'fai quello che vuoi, come vuoi: sistemi liberi e approcci diversi'},
    BASE:   {ic: '🏰', n: 'Costruzione e gestione', d: 'costruire una base, una città, gestire un\'economia o una squadra'},
    TACT:   {ic: '♟️', n: 'Tattica e pianificazione', d: 'pensare prima di agire: posizionamento, turni, strategia'},
    COMBAT: {ic: '⚔️', n: 'Combattimento appagante', d: 'un sistema di combattimento con ritmo, combo, parate e tempismo'},
    STORY:  {ic: '📖', n: 'Storia che coinvolge', d: 'trama forte, colpi di scena, emozioni'},
    CHAR:   {ic: '🫂', n: 'Personaggi e legami', d: 'un cast che ti resta nel cuore, rapporti tra i personaggi'},
    CHOICE: {ic: '🔀', n: 'Scelte e conseguenze', d: 'le tue decisioni cambiano la storia o il finale'},
    ATMO:   {ic: '🌫️', n: 'Atmosfera e stile', d: 'ambientazione, direzione artistica, sensazione unica'},
    MUSIC:  {ic: '🎼', n: 'Colonna sonora che resta', d: 'musiche memorabili che fanno il gioco'},
    SOCIAL: {ic: '👥', n: 'Gioco con gli altri', d: 'cooperativa, multiplayer, comunità, MMO'},
    PUZZ:   {ic: '🧠', n: 'Enigmi e ingegno', d: 'rompicapi, meccanismi da capire, soluzioni intelligenti'},
    HUMOR:  {ic: '😄', n: 'Umorismo e leggerezza', d: 'ironia, situazioni assurde, toni scanzonati'},
    LIFE:   {ic: '📅', n: 'Vita quotidiana e legami', d: 'calendario, routine, tempo libero, rapporti da coltivare giorno per giorno'},
    // v197 — i termini dei giocatori (lista di Mario): così si distingue meglio anche ciò che NON piace
    PROC:   {ic: '🎲', n: 'Rigiocabilità procedurale («ancora una run»)', d: 'mappe e partite generate a caso, run diverse ogni volta, permadeath'},
    GACHA:  {ic: '🎰', n: 'Gacha, wish e pity', d: 'evocazioni casuali, banner, sistema pity, personaggi da «pescare»'},
    FEEL:   {ic: '💥', n: 'Game feel (colpi pesanti, juiciness)', d: 'ogni colpo si sente: impatto, feedback, controlli reattivi'},
    DAILY:  {ic: '🗓️', n: 'Routine giornaliere e time sink', d: 'daily e weekly reset, missioni giornaliere, endgame infinito che chiede tempo'},
    // v198 — tratti in più (per giochi come FFX: boss segreti, evocazioni, minigiochi…)
    SUPERBOSS: {ic: '👹', n: 'Superboss e sfide segrete', d: 'boss opzionali durissimi, nemici segreti da preparare con cura'},
    SUMMON: {ic: '🐉', n: 'Evocazioni', d: 'creature potenti da chiamare in battaglia (eoni, esper, G.F.)'},
    PARTY:  {ic: '🧑‍🤝‍🧑', n: 'Gestione della squadra', d: 'scegliere e alternare i personaggi, comporre il gruppo giusto'},
    JOURNEY: {ic: '🧳', n: 'Viaggio epico', d: 'un lungo viaggio attraverso un mondo, tappa dopo tappa'},
    ROMANCE: {ic: '💞', n: 'Storia d\'amore', d: 'una relazione romantica che conta nella storia'},
    VILLAIN: {ic: '🦹', n: 'Antagonista memorabile', d: 'un cattivo carismatico che resta impresso'},
    MINI:   {ic: '🃏', n: 'Minigiochi', d: 'giochi nel gioco: carte, sport, corse, pesca, casinò'},
    ENDGAME: {ic: '🏁', n: 'Endgame ricco', d: 'tanto da fare dopo la fine o fuori dalla storia: post-game, NG+, sfide opzionali'}
  };
  // v209: le parole-chiave dei tratti stanno in tratti.js (le usa anche il server per preparare l'indice)
  const TR = ()=> window.RT_TRATTI;
  const mnrm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const MC = new Map();
  function mechOf(g){
    const e = g.enrich || {}, c = MC.get(g.id), dwS = (()=>{ try{ const v = (LSro('jrpg_dna_why', {}) || {})[g.id]; return v ? JSON.stringify(v) : ''; }catch(x){ return ''; } })(), sig = (e._lite ? 'L' : 'F') + (g.tags || []).join(',') + '|' + (e.whyLikeIt || '').length + '|' + ((e.pros || []).length) + '|' + ((g.label || {}).d || 0) + '|' + String(g.story || '').length + '|' + dwS;
    if(c && c.sig === sig) return c.list;
    // tratti dai testi: se i testi lunghi del gioco non sono ancora caricati uso quelli calcolati dal server (e.mx), identici
    const tt = e._lite ? {mx: e.mx || [], cbt: e.cbt || 0} : (TR() ? TR().textTraits(g) : {mx: [], cbt: 0});
    const out = new Set(tt.mx), tg = g.tags || [], l = g.label || {};
    // indizi dai dati della scheda (generi, etichette, simboli)
    if(l.s >= 4 || e.storyTag === 'wow') out.add('STORY');
    if(e.storyTag === 'affinity' || e.storyTag === 'romance') out.add('CHAR');
    if(tg.includes('TAC') || tg.includes('WAR')) out.add('TACT');
    if(tg.includes('METR')) out.add('EXPLO');
    if(tg.includes('SOUL') || tg.includes('ACT')){ if(tt.cbt) out.add('COMBAT'); }
    if(tg.includes('VN')){ out.add('STORY'); }
    if(tg.includes('HOR')) out.add('ATMO');
    if(tg.includes('LIFE')) out.add('BASE');
    if(tg.includes('ROG')) out.add('PROC');
    if(e.storyTag === 'romance') out.add('ROMANCE');
    if(out.has('SUPERBOSS')) out.add('CHALL');
    if(tg.includes('GACHA')){ out.add('GACHA'); out.add('DAILY'); }
    if(tg.includes('MUD') || tg.includes('MMO')) out.add('DAILY');
    try{ const dw = (LSro('jrpg_dna_why', {}) || {})[g.id] || {}; Object.keys(dw).forEach(k=>{ if(dw[k] > 0) out.add(k); else if(dw[k] < 0) out.delete(k); }); }catch(x){}   // quello che hai detto tu di questo gioco vale più dei testi
    if(e.dopamine === true) out.add('DOPA');
    if(tg.includes('MON')) out.add('COLL');
    if(tg.includes('CARD')){ out.add('COLL'); out.add('BUILD'); }
    if(tg.includes('ROG')){ out.add('LOOT'); out.add('BUILD'); }
    if(tg.includes('SOUL')) out.add('CHALL');
    if(tg.includes('LIFE')){ out.add('FARM'); out.add('COLL'); }
    if(l.d >= 4) out.add('CHALL');
    if(e.hoursCompletionist && e.hoursMain && e.hoursCompletionist >= e.hoursMain * 3) out.add('COLL');
    if(l.g >= 4 && (out.has('LOOT') || out.has('BUILD') || out.has('POWER'))) out.add('FARM');
    const list = [...out]; MC.set(g.id, {sig, list}); return list;
  }
  window.rtMech = MECH; window.rtMechOf = mechOf;
  const DECL = 'jrpg_taste_mech';                                  // le meccaniche che dici tu: 1 = mi piace, -1 = evito
  const declared = ()=> LS.get(DECL, {}) || {};
  // v208: i tratti di un gioco si calcolano una volta e si riusano finché non cambiano i tuoi dati o quelli del gioco
  const FC = new Map();
  function feats(g){
    const l0 = g.label || {}, ck = TVER + '|' + (g.tags || []).join(',') + '|' + (l0.d || 0) + (l0.g || 0) + (l0.s || 0) + (l0.p || '') + (l0.h || 0) + '|' + ((g.enrich && g.enrich.hoursMain) || 0) + '|' + (g.ysort || 0);
    const c = FC.get(g.id); if(c && c.k === ck) return c.v;
    const v = feats0(g); if(FC.size > 20000) FC.clear(); FC.set(g.id, {k: ck, v}); return v;
  }
  function feats0(g){
    const l = g.label || {}, h = (g.enrich && g.enrich.hoursMain) || l.h || 0, f = [];      // stesse ore della «Longevità» nella scheda
    (g.tags || []).forEach(t=> f.push('tag:' + t));
    if(l.d) f.push('diff:' + (l.d >= 4 ? 'alta' : l.d <= 2 ? 'bassa' : 'media'));
    if(l.g) f.push('grind:' + (l.g >= 4 ? 'alto' : l.g <= 2 ? 'basso' : 'medio'));
    if(l.s) f.push('storia:' + (l.s >= 4 ? 'forte' : l.s <= 2 ? 'leggera' : 'media'));
    if(l.p) f.push('ritmo:' + ({L: 'lento', M: 'medio', V: 'veloce'}[l.p] || l.p));
    if(h) f.push('ore:' + (h < 20 ? 'brevi' : h <= 50 ? 'medie' : 'lunghe'));
    if(g.ysort) f.push('epoca:' + (Math.floor(g.ysort / 10) * 10));
    try{ mechOf(g).forEach(m=> f.push('mech:' + m)); }catch(e){}
    try{ const cu = LSro('jrpg_dna_custom', {}) || {}, ks = Object.keys(cu); if(ks.length){ const e = g.enrich || {}, txt = mnrm([g.story, e.whyLikeIt, e.gameplayNote, (e.pros || []).join(' . '), (g.label || {}).ok].join(' . ')); ks.forEach(k=>{ const c = cu[k]; if((c.no || []).includes(g.id)) return; if((c.by || []).includes(g.id) || (c.games || []).includes(g.id) || (c.kw || []).some(w=> w && w.length >= 4 && txt.includes(mnrm(w)))) f.push('mine:' + k); }); } }catch(e){}
    return f;
  }
  const FLAB = k=>{ const [a, b] = k.split(':'); if(a === 'mine'){ const c = (LS.get('jrpg_dna_custom', {}) || {})[b]; return c ? c.n : b; } if(a === 'mech') return MECH[b] ? MECH[b].n : b; if(a === 'tag') return TAG_INFO[b] ? TAG_INFO[b].label : b; if(a === 'ore') return {brevi: 'giochi brevi (sotto 20 h)', medie: 'durata media (20-50 h)', lunghe: 'giochi lunghi (oltre 50 h)'}[b] || b; return ({diff: 'difficoltà ', grind: 'grinding ', storia: 'storia ', ritmo: 'ritmo ', ore: 'durata ', epoca: 'anni '}[a] || '') + (a === 'epoca' ? String(b).slice(2) : b); };
  let TM = null, TMkey = '';
  let TMver = 0, TMn = 0;
  function tasteModel(){
    if(TM && TMver === TVER && TMn === (typeof GAMES !== 'undefined' ? GAMES.length : 0)) return TM;      // v208: niente è cambiato → pronto subito
    const sig = signals(), dc = declared(), dw = LSro('jrpg_dna_why', {}) || {}, key = sig.length + ':' + sig.reduce((a, x)=> a + x.w * x.g.id, 0) + ':' + JSON.stringify(dc) + ':' + JSON.stringify(dw) + ':' + JSON.stringify(LS.get('jrpg_dna_custom', {}) || {}) + ':' + (window.rtBrain ? rtBrain.key() : '');
    if(TM && TMkey === key){ TMver = TVER; TMn = GAMES.length; return TM; }
    const sum = {}, cnt = {};
    sig.forEach(({g, w})=> feats(g).forEach(k=>{ sum[k] = (sum[k] || 0) + w; cnt[k] = (cnt[k] || 0) + 1; }));
    const wts = {}; Object.keys(sum).forEach(k=> wts[k] = sum[k] / (cnt[k] + 2));
    // quello che dici tu pesa subito (anche con pochi giochi segnati); il resto lo imparo dai tuoi giochi
    Object.keys(dc).forEach(m=>{ if(!MECH[m] || !dc[m]) return; const k = 'mech:' + m; wts[k] = (wts[k] || 0) + dc[m] * 1.1; cnt[k] = Math.max(cnt[k] || 0, 2); });
    // «cosa ti ha preso di questo gioco» (🧬 nella scheda): ogni tratto che indichi tu su un gioco pesa come un segnale forte
    const dwc = {}; Object.keys(dw).forEach(id=> Object.keys(dw[id] || {}).forEach(m=>{ if(MECH[m] && dw[id][m] && Math.abs(dw[id][m]) >= 1) dwc[m] = (dwc[m] || 0) + dw[id][m]; })      /* 🤷 Ni (0.5) = neutro */);
    Object.keys(dwc).forEach(m=>{ const k = 'mech:' + m, v = dwc[m]; wts[k] = (wts[k] || 0) + Math.sign(v) * Math.min(1.6, .55 * Math.abs(v)); cnt[k] = Math.max(cnt[k] || 0, 2); });
    // v200: i tratti che hai creato a parole contano subito (come quelli che segni con 👍/👎)
    try{ const cu = LS.get('jrpg_dna_custom', {}) || {}; Object.keys(cu).forEach(m=>{ const c = cu[m], v = (c.by || []).length - (c.no || []).length; if(!v) return; const k = 'mine:' + m; wts[k] = (wts[k] || 0) + Math.sign(v) * Math.min(1.6, .7 + .3 * Math.abs(v)); cnt[k] = Math.max(cnt[k] || 0, 2); }); }catch(e){}
    try{ if(window.rtBrain) rtBrain.adjust(wts, cnt); }catch(e){}
    TM = {n: sig.length, wts, cnt, sig, dc, dw}; TMkey = key; TMver = TVER; TMn = GAMES.length; return TM;
  }
  function tasteScore(g){
    const m = tasteModel(); if(m.n < 3 && !Object.keys(m.dc || {}).some(k=> m.dc[k])) return 0;
    const f = feats(g); if(!f.length) return 0;
    const v = f.reduce((a, k)=> a + (m.wts[k] || 0), 0) / Math.sqrt(f.length);
    return Math.max(-1, Math.min(1, v / 2.2));
  }
  window.tasteScore = tasteScore;
  window.rtTasteModel = tasteModel; window.rtFeats = feats; window.rtFLAB = FLAB;
  function tolerances(m){
    const liked = m.sig.filter(x=> x.w > 0.9).map(x=> x.g), out = [];
    const traits = [['grind:alto', 'grinding alto'], ['diff:alta', 'difficoltà alta'], ['ore:lunghe', 'più di 50 ore'], ['ritmo:lento', 'ritmo lento'], ['storia:leggera', 'storia leggera']];
    traits.forEach(([t, lab])=>{
      const withT = liked.filter(g=> feats(g).includes(t)); if(withT.length < 2) return;
      const c = {}; withT.forEach(g=> feats(g).forEach(k=>{ if(k !== t && !k.startsWith('epoca')) c[k] = (c[k] || 0) + 1; }));
      const best = Object.entries(c).sort((a, b)=> b[1] - a[1])[0];
      if(best && best[1] >= 2) out.push(`Accetti ${lab} quando c'è ${FLAB(best[0])} (es. ${withT.slice(0, 2).map(g=> g.name).join(', ')})`);
    });
    return out;
  }
  window.tasteSummary = function(){
    const m = tasteModel(); if(m.n < 3) return '';
    const e = Object.entries(m.wts).filter(([k])=> m.cnt[k] >= 2);
    const pos = e.filter(x=> x[1] > .25).sort((a, b)=> b[1] - a[1]).slice(0, 8).map(x=> FLAB(x[0]));
    const neg = e.filter(x=> x[1] < -.2).sort((a, b)=> a[1] - b[1]).slice(0, 5).map(x=> FLAB(x[0]));
    const tol = tolerances(m);
    return `\nGUSTI DI MARIO IMPARATI DALL'APP (da ${m.n} giochi segnati): ama ${pos.join(', ') || '—'}; evita ${neg.join(', ') || '—'}.${tol.length ? ' ' + tol.join('. ') + '.' : ''} Usali per consigliare.`;
  };
  // i consigli dell'app usano anche il modello dei gusti: DNA (ordine «Più adatti a te») e prompt dell'AI
  if(typeof dnaForGame === 'function'){
    const origDna = dnaForGame;
    window.dnaForGame = dnaForGame = function(g, p){ const r = origDna.apply(this, arguments); if(!r) return r; const ts = tasteScore(g); if(ts) r.pct = Math.max(3, Math.min(99, Math.round(r.pct * .65 + (50 + 50 * ts) * .35))); return r; };
  }
  ['askInstructions', 'buildNovitaPrompt', 'buildNovitaGenrePrompt'].forEach(fn=>{
    if(typeof window[fn] !== 'function') return;
    const o = window[fn];
    window[fn] = function(){ const r = o.apply(this, arguments); try{ return typeof r === 'string' ? r + window.tasteSummary() : r; }catch(e){ return r; } };
    try{ if(fn === 'askInstructions') askInstructions = window[fn]; else if(fn === 'buildNovitaPrompt') buildNovitaPrompt = window[fn]; else buildNovitaGenrePrompt = window[fn]; }catch(e){}
  });
  // un'etichetta chiara per ogni «gusto»: le meccaniche con la loro icona
  const tlab = k=>{ const [a, b] = k.split(':'); return a === 'mech' && MECH[b] ? MECH[b].ic + ' ' + MECH[b].n : FLAB(k); };
  function why(m, k){          // i giochi che ti hanno «insegnato» questo gusto
    return m.sig.filter(x=> x.w > .5 && feats(x.g).includes(k)).sort((a, b)=> b.w - a.w).slice(0, 2).map(x=> x.g.name);
  }
  function openTaste(){
    const m = tasteModel(), dc = declared();
    const hasDecl = Object.keys(dc).some(k=> dc[k]);
    const intro = `<div class="lp-sub"><b>A cosa serve:</b> guardo i giochi che hai segnato (preferiti, giocati, droppati, i tuoi voti e la tua tier list) e capisco cosa hanno in comune: non solo il genere, ma anche <b>le meccaniche che ti tengono incollato</b> (loot, build, crescita del personaggio, farming, collezionabili…). Poi lo uso per «Più adatti a te», per i verdetti, per il Radar e per i consigli di Chiedi.</div>`;
    // 1) le meccaniche: le dici tu (tocca per ciclare: 👍 mi piace → 👎 evito → neutro) e le imparo io
    const mrow = k=>{ const v = dc[k] || 0, kk = 'mech:' + k, w = m.wts[kk] || 0, learned = m.cnt[kk] >= 2 && !v ? (w > .25 ? 'imparato: ti piace' : w < -.2 ? 'imparato: lo eviti' : '') : '';
      const w2 = why(m, kk);
      return `<div class="tg-mech"><button type="button" class="tg-mbtn${v > 0 ? ' like' : v < 0 ? ' no' : ''}" data-mech="${k}" aria-label="${esc(MECH[k].n)}"><span class="tg-mi">${MECH[k].ic}</span><span class="tg-mt"><b>${esc(MECH[k].n)}</b><small>${esc(MECH[k].d)}</small>${learned ? `<small class="tg-lrn">${learned}${w2.length ? ' · da ' + esc(w2.join(', ')) : ''}</small>` : ''}</span><span class="tg-ms">${v > 0 ? '👍' : v < 0 ? '👎' : '＋'}</span></button></div>`; };
    const mech = `<h4>🧬 Il tuo DNA: cosa ti prende in un gioco</h4><div class="lp-sub">Dimmelo tu: tocca una meccanica per «mi piace» 👍, ancora per «la evito» 👎, ancora per toglierla. Quello che dici pesa subito; il resto lo imparo dai tuoi giochi.</div><div class="tg-mechs">${Object.keys(MECH).map(mrow).join('')}</div>`;
    if(m.n < 3 && !hasDecl){
      const body0 = sheet('xTaste', gi('dna') + ' I tuoi gusti', `${intro}<div class="lp-sub">Per cominciare segna almeno <b>3 giochi</b> come preferiti, giocati o droppati (o spostali nella tua tier list), oppure scegli qui sotto le meccaniche che ami.</div>${mech}`);
      wireMech(body0); return;
    }
    const e = Object.entries(m.wts).filter(([k])=> m.cnt[k] >= 2);
    const bar = (k, v)=> `<div class="tg-row"><span>${esc(tlab(k))}</span><i class="${v >= 0 ? 'p' : 'n'}" style="width:${Math.min(100, Math.abs(v) * 60)}%"></i><small>${v >= 0 ? '+' : ''}${Math.round(v * 50)}</small></div>`;
    const pos = e.filter(x=> x[1] > 0 && !x[0].startsWith('mech:')).sort((a, b)=> b[1] - a[1]).slice(0, 10), neg = e.filter(x=> x[1] < 0).sort((a, b)=> a[1] - b[1]).slice(0, 8);
    const tol = tolerances(m);
    const likedMech = Object.keys(MECH).filter(k=> (m.wts['mech:' + k] || 0) > .25);
    const recs = GAMES.filter(g=> !STATUSES[g.id] && !FAVS.has(g.id)).map(g=> ({g, s: tasteScore(g)})).sort((a, b)=> b.s - a.s).slice(0, 8);
    const body = sheet('xTaste', gi('dna') + ' I tuoi gusti', `${intro}
      <div class="tg-status">${m.n >= 3 ? `Ho imparato da <b>${m.n}</b> giochi` : 'Per ora conto solo su quello che mi hai detto'} · ${m.n >= 25 ? '🟢 profilo affidabile' : m.n >= 10 ? '🟡 profilo discreto: più giochi segni, meglio è' : '🔴 profilo ancora debole: segna altri giochi'}</div>
      ${mech}
      ${window.rtRadar ? String(window.rtRadar(null) || "").replace('id="gsCard"', 'id="gsTaste"') : ''}
      <h4>Generi e stile che ti piacciono</h4>${pos.map(x=> bar(...x)).join('') || '<small>ancora poco chiaro</small>'}
      <h4>Tendi a evitare</h4>${neg.map(x=> bar(...x)).join('') || '<small>niente di netto</small>'}
      ${tol.length ? '<h4>Nonostante…</h4>' + tol.map(t=> `<div class="tg-tol">${esc(t)}</div>`).join('') : ''}
      ${(()=>{ const ps = window.rtPredictStats && rtPredictStats(); return ps ? `<h4>Quanto ti conosce l'app</h4><div class="tg-tol">Previsioni azzeccate (entro 1 punto): <b>${ps.hit}%</b> su ${ps.n} giochi votati · errore medio ${ps.avg.toFixed(1)}</div>` : ''; })()}
      <h4>Da provare secondo i tuoi gusti</h4><div class="tg-recs">${recs.map(r=>{ const mm = mechOf(r.g).filter(k=> likedMech.includes(k) || (dc[k] || 0) > 0); return `<button class="btn" type="button" data-tg="${r.g.id}">${esc(r.g.name)}${mm.length ? ` <span class="tg-why">${mm.map(k=> MECH[k].ic).join('')}</span>` : ''}</button>`; }).join('')}</div>${likedMech.length ? '<div class="lp-sub">Le icone dicono quali delle tue meccaniche preferite ha ogni gioco.</div>' : ''}`);
    body.querySelectorAll('[data-tg]').forEach(b=> b.addEventListener('click', ()=>{ document.getElementById('xTaste').classList.remove('show'); openModal(GAMES.find(g=> g.id == b.dataset.tg)); }));
    wireMech(body);
  }
  function wireMech(body){
    body.querySelectorAll('[data-mech]').forEach(b=> b.addEventListener('click', ()=>{
      const k = b.dataset.mech, d = declared(), cur = d[k] || 0, nx = cur === 0 ? 1 : cur === 1 ? -1 : 0;
      if(nx) d[k] = nx; else delete d[k];
      LS.set(DECL, d); TM = null; try{ window.rtHaptic && rtHaptic('tick'); }catch(e){}
      const sc = document.querySelector('#xTaste .lp-card'), top = sc ? sc.scrollTop : 0;
      openTaste(); const sc2 = document.querySelector('#xTaste .lp-card'); if(sc2) sc2.scrollTop = top;
    }));
  }
  menu(gi('dna') + ' I tuoi gusti (imparati)', openTaste);

  // =====================================================================
  // 20) TEMA DALLA COPERTINA: aprendo un gioco l'app prende i suoi colori (si toglie chiudendo la scheda)
  // =====================================================================
  const TINT_ON = ()=> LS.get('jrpg_app_tint', true) && !document.documentElement.hasAttribute('data-pack');
  const wsrv = (u, w, fmt)=> 'https://wsrv.nl/?url=' + encodeURIComponent(u) + '&w=' + w + (fmt ? '&output=' + fmt : '&output=webp');
  function coverColors(url){
    return new Promise(res=>{
      const im = new Image(); im.crossOrigin = 'anonymous';
      const t = setTimeout(()=> res(null), 6000);
      im.onload = ()=>{ clearTimeout(t); try{
        const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 32);
        const d = x.getImageData(0, 0, 32, 32).data, bins = {};
        for(let i = 0; i < d.length; i += 4){
          const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
          if(mx < 40) continue;
          const k = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5);
          const e = bins[k] || (bins[k] = {n: 0, r: 0, g: 0, b: 0, s: 0});
          e.n++; e.r += r; e.g += g; e.b += b; e.s += sat;
        }
        const cols = Object.values(bins).map(e=> ({c: [e.r / e.n, e.g / e.n, e.b / e.n].map(Math.round), w: e.n * (0.3 + e.s / e.n)})).sort((a, b)=> b.w - a.w);
        const pick = [];
        cols.forEach(o=>{ if(pick.length < 3 && pick.every(p=> Math.abs(p[0] - o.c[0]) + Math.abs(p[1] - o.c[1]) + Math.abs(p[2] - o.c[2]) > 90)) pick.push(o.c); });
        while(pick.length && pick.length < 3) pick.push(pick[pick.length - 1]);
        res(pick.length ? pick : null);
      }catch(e){ res(null); } };
      im.onerror = ()=>{ clearTimeout(t); res(null); };
      im.src = wsrv(url, 64, 'png');
    });
  }
  let tintOn = false;
  // v222: i colori del tema dalla copertina stanno SOLO sullo sfondo della scheda (#modalBackdrop), non su tutta la pagina: prima cambiavano su <html> e,
  // essendo ereditati da ~1650 elementi e animati per 0,7 s, il telefono ricalcolava gli stili di tutta la pagina a ogni fotogramma mentre la scheda si apriva.
  const tintEl = ()=> document.getElementById('modalBackdrop');
  function tintClear(){
    if(!tintOn) return; tintOn = false;
    const r = tintEl(); if(!r) return; r.classList.remove('rt-tinted');
    ['--a1rgb', '--a2rgb', '--a3rgb', '--rt-tint'].forEach(k=> r.style.removeProperty(k));
  }
  const TINT_K = 'rt_tint_cache';
  const tintGet = id=>{ try{ return (JSON.parse(localStorage.getItem(TINT_K) || '{}') || {})[id] || null; }catch(e){ return null; } };
  const tintPut = (id, cols)=>{ try{ const c = JSON.parse(localStorage.getItem(TINT_K) || '{}') || {}; c[id] = cols; const ks = Object.keys(c); if(ks.length > 400) ks.slice(0, ks.length - 400).forEach(k=> delete c[k]); localStorage.setItem(TINT_K, JSON.stringify(c)); }catch(e){} };
  function tintSet(cols){ const r = tintEl(), v = c=> c.join(', '); if(!r) return; r.style.setProperty('--a1rgb', v(cols[0])); r.style.setProperty('--a2rgb', v(cols[1])); r.style.setProperty('--a3rgb', v(cols[2])); r.style.setProperty('--rt-tint', v(cols[0])); r.classList.add('rt-tinted'); tintOn = true; }
  async function tintApp(g){
    const cached = tintGet(g.id);
    if(!TINT_ON()){ tintClear(); return; }
    if(cached){ tintSet(cached, true); return; }                        // già calcolato: i colori sono pronti fin dal primo fotogramma
    tintClear();
    const url = (typeof effectiveCover === 'function') ? effectiveCover(g) : null; if(!url || !/^https?:/.test(url)) return;
    const my = g.id, cols = await coverColors(url);
    if(!cols || typeof currentModalGame === 'undefined' || !currentModalGame || currentModalGame.id !== my || !document.getElementById('modalBackdrop').classList.contains('show')) return;
    tintPut(my, cols); tintSet(cols);
  }
  new MutationObserver(()=>{ if(!document.getElementById('modalBackdrop').classList.contains('show')) tintClear(); }).observe(document.getElementById('modalBackdrop'), {attributes: true, attributeFilter: ['class']});

  // =====================================================================
  // aggancio alla scheda del gioco
  // =====================================================================
  const OWN = 'jrpg_owned';
  const owned = ()=> new Set(LS.get(OWN, []) || []);
  function ownedHtml(g){ const on = owned().has(g.id); return `<button class="btn${on ? ' primary' : ''}" type="button" id="ownBtn">${gi('gem')} ${on ? 'Ce l\'ho' : 'Segna come posseduto'}</button>`; }
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      const card = document.getElementById('modalCard'); if(!card || !g) return r;
      const badges = card.querySelector('.modal-badges');
      if(badges){ badges.insertAdjacentHTML('afterend', nineHtml(g) + thermoHtml(g) + rarityHtml(g)); }
      const stTitle = [...card.querySelectorAll('.modal-section-title')].find(x=> /Il tuo stato/.test(x.textContent));
      const extra = sagaPathHtml(g) + versionsHtml(g) + historyHtml(g);
      if(stTitle) stTitle.insertAdjacentHTML('beforebegin', extra); else card.insertAdjacentHTML('beforeend', extra);
      const sr = document.getElementById('statusRow'); if(sr) sr.insertAdjacentHTML('afterend', '<div class="own-row"></div>');      // v205: via «Segna come posseduto» (poco utile); resta solo il punto d'aggancio per voto e recensione
      card.querySelectorAll('[data-sp]').forEach(b=> b.addEventListener('click', ()=>{ const x = GAMES.find(y=> y.id == b.dataset.sp); if(x && x.id !== g.id) openModal(x); }));
      const vb = document.getElementById('vmBtn'); if(vb) vb.addEventListener('click', ()=> runVersions(g));
      card.querySelectorAll('[data-hist-undo]').forEach(b=> b.addEventListener('click', ()=> historyUndo(g, +b.dataset.histUndo)));
      const ob = document.getElementById('ownBtn'); if(ob) ob.addEventListener('click', ()=>{ const s = owned(); if(s.has(g.id)) s.delete(g.id); else s.add(g.id); LS.set(OWN, [...s]); ob.outerHTML = ownedHtml(g); openModal(g); });
      tintApp(g);
    }catch(e){}
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}

  // =====================================================================
  // 7) TIER LIST ANIMATA (video WebM creato nel telefono)
  // =====================================================================
  function loadImg(u){ return new Promise(res=>{ if(!u || !/^https?:/.test(u)){ res(null); return; } const im = new Image(); im.crossOrigin = 'anonymous'; const t = setTimeout(()=> res(null), 7000); im.onload = ()=>{ clearTimeout(t); res(im); }; im.onerror = ()=>{ clearTimeout(t); res(null); }; im.src = wsrv(u, 160, 'jpg'); }); }
  async function openAnimated(){
    const body = sheet('xAnim', gi('cards') + ' Tier list animata', '<div class="lp-sub">Preparo le copertine…</div>');
    let MT = {}; try{ MT = MYTIER || {}; }catch(e){}
    const pool = GAMES.filter(g=> FAVS.has(g.id) || STATUSES[g.id] === 'played' || MT[g.id]);
    const src = pool.length >= 8 ? pool : GAMES.filter(g=> g.score >= 88);
    const rows = TIERS.map(t=> ({t, games: src.filter(g=> (MT[g.id] || g.tier) === t).sort((a, b)=> b.score - a.score).slice(0, 7)})).filter(r=> r.games.length);
    const imgs = new Map(); await Promise.all(rows.flatMap(r=> r.games).map(async g=> imgs.set(g.id, await loadImg(effectiveCover(g)))));
    const W = 720, rowH = 118, H = 110 + rows.length * rowH + 40, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const items = []; rows.forEach((r, ri)=> r.games.forEach((g, gi2)=> items.push({g, ri, gi2, t0: 0.6 + items.length * 0.22})));
    const total = Math.max(...items.map(i=> i.t0)) + 2.2;
    function frame(t){
      const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1b1440'); bg.addColorStop(1, '#0c2a4a'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#fff'; x.font = '800 34px system-ui'; x.textAlign = 'center'; x.fillText('La mia Tier List', W / 2, 52); x.font = '600 16px system-ui'; x.globalAlpha = .7; x.fillText('Raccoon Tier · Frugu Frugu', W / 2, 80); x.globalAlpha = 1;
      rows.forEach((r, ri)=>{ const y = 100 + ri * rowH; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(12, y, W - 24, rowH - 10); x.fillStyle = TIER_COL[r.t] || '#888'; x.fillRect(12, y, 76, rowH - 10); x.fillStyle = '#fff'; x.font = '900 32px system-ui'; x.fillText(r.t, 50, y + rowH / 2 + 6); });
      items.forEach(it=>{
        const p = Math.min(1, Math.max(0, (t - it.t0) / 0.55)); if(p <= 0) return;
        const e = 1 - Math.pow(1 - p, 3), bounce = p < 1 ? Math.sin(p * Math.PI) * 10 : 0;
        const tx = 100 + it.gi2 * 86, ty = 100 + it.ri * rowH + 6, y = -130 + (ty + 130) * e - bounce;
        x.save(); x.globalAlpha = Math.min(1, p * 2); x.translate(tx + 38, y + 50); x.rotate((1 - e) * 0.5); x.translate(-38, -50);
        const im = imgs.get(it.g.id);
        x.fillStyle = TIER_COL[it.g.tier] || '#555'; x.fillRect(0, 0, 76, 100);
        if(im){ const s = Math.max(76 / im.width, 100 / im.height); x.drawImage(im, (76 - im.width * s) / 2, (100 - im.height * s) / 2, im.width * s, im.height * s); }
        else { x.fillStyle = '#fff'; x.font = '700 11px system-ui'; x.textAlign = 'center'; String(it.g.name).slice(0, 36).match(/.{1,12}(\s|$)/g).slice(0, 4).forEach((l, i)=> x.fillText(l.trim(), 38, 24 + i * 14)); }
        x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.strokeRect(0, 0, 76, 100); x.restore();
        if(p >= 1 && t - it.t0 < 0.9){ x.save(); x.globalAlpha = 1 - (t - it.t0 - 0.55) / 0.35; x.strokeStyle = '#ffd24a'; x.lineWidth = 4; x.strokeRect(tx - 3, ty - 3, 82, 106); x.restore(); }
      });
      x.textAlign = 'left';
    }
    body.innerHTML = `<div class="lp-sub">${items.length} giochi · ${Math.round(total)} secondi. Il video si crea nel telefono (nessun caricamento online).</div><canvas class="anim-cv"></canvas><div class="lp-tools"><button class="btn primary" type="button" id="anRec">${gi('play')} Crea il video</button><button class="btn" type="button" id="anPlay">Anteprima</button></div>`;
    const view = body.querySelector('.anim-cv'); view.width = W; view.height = H; const vx = view.getContext('2d');
    const play = (rec)=> new Promise(done=>{ const t0 = performance.now(); (function step(){ const t = (performance.now() - t0) / 1000; frame(Math.min(t, total)); vx.drawImage(c, 0, 0); if(t < total) requestAnimationFrame(step); else done(); })(); });
    body.querySelector('#anPlay').addEventListener('click', ()=> play());
    body.querySelector('#anRec').addEventListener('click', async ev=>{
      const b = ev.currentTarget; b.disabled = true; b.textContent = 'Registro…';
      let stream; try{ stream = c.captureStream(30); }catch(e){ toast('Questo browser non registra video: uso l\'anteprima', 4000); b.disabled = false; return; }
      const mime = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(m=> window.MediaRecorder && MediaRecorder.isTypeSupported(m));
      if(!mime){ toast('Questo browser non registra video', 4000); b.disabled = false; return; }
      const chunks = [], rec = new MediaRecorder(stream, {mimeType: mime, videoBitsPerSecond: 2500000});
      rec.ondataavailable = e=> e.data.size && chunks.push(e.data);
      const stopped = new Promise(r=> rec.onstop = r);
      rec.start(); await play(); await new Promise(r=> setTimeout(r, 600)); rec.stop(); await stopped;
      const ext = mime.includes('mp4') ? 'mp4' : 'webm', file = new File(chunks, 'tier-list-animata.' + ext, {type: mime.split(';')[0]});
      try{ if(navigator.canShare && navigator.canShare({files: [file]})){ await navigator.share({files: [file], title: 'La mia Tier List'}); b.disabled = false; b.textContent = 'Crea di nuovo'; return; } }catch(e){}
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      b.disabled = false; b.textContent = 'Crea di nuovo';
    });
    play();
  }
  menu(gi('cards') + ' Tier list animata (video)', openAnimated);

  // =====================================================================
  // 10) MODALITÀ VETRINA (a schermo intero, per tablet e TV)
  // =====================================================================
  function openShowcase(){
    const list = (GAMES.filter(g=> FAVS.has(g.id) && effectiveCover(g)).length >= 5 ? GAMES.filter(g=> FAVS.has(g.id)) : GAMES.filter(g=> ['S+', 'S', 'A'].includes(g.tier))).filter(g=> effectiveCover(g)).sort(()=> Math.random() - .5);
    if(list.length < 2){ toast('Servono almeno 2 giochi con copertina (preferiti o tier alti)', 4000); return; }
    const el = document.createElement('div'); el.className = 'showcase'; document.body.appendChild(el);
    el.innerHTML = '<div class="sc-bg"></div><div class="sc-bg sc-b2"></div><img class="sc-img" alt=""><div class="sc-cap"></div><button class="sc-x" type="button" aria-label="Chiudi">✕</button>';
    let i = 0, tm = 0, wake = null;
    try{ navigator.wakeLock && navigator.wakeLock.request('screen').then(w=> wake = w).catch(()=>{}); }catch(e){}
    try{ el.requestFullscreen && el.requestFullscreen().catch(()=>{}); }catch(e){}
    const bgs = el.querySelectorAll('.sc-bg'), img = el.querySelector('.sc-img'), cap = el.querySelector('.sc-cap');
    function show(){
      const g = list[i % list.length], u = effectiveCover(g), big = wsrv(u, 900);
      const b = bgs[i % 2], o = bgs[(i + 1) % 2]; b.style.backgroundImage = `url("${big.replace(/"/g, '%22')}")`; b.classList.add('on'); o.classList.remove('on');
      img.classList.remove('in'); setTimeout(()=>{ img.onerror = ()=>{ img.onerror = null; img.src = u; }; img.src = big; img.classList.add('in'); }, 250);
      cap.innerHTML = `<span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span> <b>${esc(g.name)}</b><small>${esc(g.plat)} · ${esc(g.year || '')} · ${g.score}/100</small>`;
      i++; clearTimeout(tm); tm = setTimeout(show, 7000);
    }
    const tilt = e=>{ const gx = (e.gamma || 0) / 30, gy = (e.beta || 0) / 60 - .5; img.style.transform = `translate(${gx * 14}px, ${gy * 10}px)`; bgs.forEach(b=> b.style.transform = `scale(1.25) translate(${-gx * 22}px, ${-gy * 16}px)`); };
    const mouse = e=> tilt({gamma: (e.clientX / innerWidth - .5) * 60, beta: (e.clientY / innerHeight) * 60});
    window.addEventListener('deviceorientation', tilt); window.addEventListener('mousemove', mouse);
    const close = ()=>{ clearTimeout(tm); window.removeEventListener('deviceorientation', tilt); window.removeEventListener('mousemove', mouse); try{ wake && wake.release(); }catch(e){} try{ document.fullscreenElement && document.exitFullscreen(); }catch(e){} el.remove(); };
    el.querySelector('.sc-x').addEventListener('click', e=>{ e.stopPropagation(); close(); });
    el.addEventListener('click', show);
    show();
  }
  menu(gi('screen') + ' Modalità vetrina (schermo intero)', openShowcase);

  // =====================================================================
  // 11) SCANSIONE DELLO SCAFFALE (foto delle custodie → giochi posseduti)
  // =====================================================================
  function matchName(t){
    const n = nrm(t); if(n.length < 3) return null;
    let best = null, bs = 0;
    GAMES.forEach(g=>{ const m = nrm(g.name); let s = 0; if(m === n) s = 3; else if(m.startsWith(n) || n.startsWith(m)) s = 2; else if(m.includes(n) || n.includes(m)) s = 1.5; if(s > bs){ bs = s; best = g; } });
    return bs >= 1.5 ? best : null;
  }
  function openShelf(){
    const body = sheet('xShelf', gi('cam') + ' Scansione dello scaffale', `<div class="lp-sub">Fotografa i tuoi giochi fisici (coste delle custodie ben leggibili, anche più foto). L'AI legge i titoli, io li cerco nel database e tu confermi quali segnare come posseduti.</div>
      <label class="btn primary sh-pick">${gi('cam')} Scatta o scegli le foto<input type="file" accept="image/*" multiple capture="environment" hidden></label><div class="sh-out"></div>`);
    const inp = body.querySelector('input'), out = body.querySelector('.sh-out');
    inp.addEventListener('change', async ()=>{
      const files = [...inp.files].slice(0, 4); if(!files.length) return;
      if(typeof llmAvailable === 'function' && !llmAvailable()){ out.innerHTML = '<div class="lp-sub">Serve una chiave Gemini (⚙️ Impostazioni in Chiedi).</div>'; return; }
      out.innerHTML = '<div class="lp-sub">Leggo i titoli…</div>';
      let titles = [];
      try{
        const r = await askLLM('Nelle foto ci sono custodie di videogiochi (coste o fronti). Elenca TUTTI i titoli leggibili, uno per custodia, con il nome ufficiale completo in inglese se lo riconosci. Rispondi SOLO con JSON: {"titles":["..."]}', {images: files}, {label: 'Leggo le custodie…'});
        const t = String(r && r.text || ''); titles = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).titles || [];
      }catch(e){ out.innerHTML = '<div class="lp-sub">Non sono riuscito a leggere le foto: riprova con più luce e le coste dritte.</div>'; return; }
      const found = [], missing = [];
      titles.forEach(t=>{ const g = matchName(t); if(g){ if(!found.some(x=> x.id === g.id)) found.push(g); } else missing.push(t); });
      const own = owned();
      out.innerHTML = `<div class="lp-sub">Letti ${titles.length} titoli: ${found.length} trovati nel database.</div>${found.map(g=> `<label class="ask-toggle"><input type="checkbox" data-sh="${g.id}" checked> ${esc(g.name)}${own.has(g.id) ? ' <small>(già posseduto)</small>' : ''}</label>`).join('')}
        ${missing.length ? `<div class="lp-sub">Non nel database: ${missing.map(esc).join(', ')}</div>` : ''}${found.length ? `<button class="btn primary" type="button" id="shSave">${gi('check')} Segna come posseduti</button>` : ''}`;
      const sv = out.querySelector('#shSave'); if(sv) sv.addEventListener('click', ()=>{ const s = owned(); out.querySelectorAll('[data-sh]:checked').forEach(c=> s.add(+c.dataset.sh)); LS.set(OWN, [...s]); toast(s.size + ' giochi posseduti in tutto', 3000); document.getElementById('xShelf').classList.remove('show'); });
    });
  }
  menu(gi('cam') + ' Scansiona lo scaffale (giochi fisici)', openShelf);

  // =====================================================================
  // 23) GESTI RAPIDI nella lista (opzionali, ognuno si sceglie)
  // =====================================================================
  const GK = 'jrpg_gestures';
  const gset = ()=> Object.assign({on: false, right: 'played', left: 'backlog', hold: true}, LS.get(GK, {}) || {});
  const ACTS = {none: 'Niente', played: 'Giocato', playing: 'In corso', backlog: 'Da giocare', dropped: 'Droppato', fav: 'Preferito'};
  function doAct(g, a){
    if(a === 'fav'){ if(FAVS.has(g.id)) FAVS.delete(g.id); else FAVS.add(g.id); saveFavs(); toast(FAVS.has(g.id) ? '★ Aggiunto ai preferiti' : 'Tolto dai preferiti', 1600); }
    else if(STATUS_INFO[a]){ setStatus(g.id, a); toast((STATUSES[g.id] === a ? STATUS_INFO[a].label : 'Stato tolto') + ': ' + g.name, 1600); }
    try{ navigator.vibrate && navigator.vibrate(15); }catch(e){}
    try{ window.rtSfx && rtSfx('success'); }catch(e){}
    try{ renderMetrics(); render(); }catch(e){}
  }
  function peek(g, x, y){
    let p = document.getElementById('rtPeek'); if(!p){ p = document.createElement('div'); p.id = 'rtPeek'; p.className = 'rt-peek'; document.body.appendChild(p); }
    const c = effectiveCover(g), l = g.label || {};
    p.innerHTML = `${c ? `<img src="${esc(c)}" alt="">` : ''}<div><b>${esc(g.name)}</b><br><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span> ${g.score}/100 · ${esc(g.year || '')}<br><small>${esc([l.h ? l.h + ' h' : '', l.ok || (g.enrich && g.enrich.whyLikeIt) || ''].filter(Boolean).join(' · ')).slice(0, 180)}</small></div>`;
    p.style.top = Math.min(innerHeight - 200, Math.max(10, y - 120)) + 'px'; p.classList.add('show');
  }
  const unpeek = ()=>{ const p = document.getElementById('rtPeek'); if(p) p.classList.remove('show'); };
  (function(){
    const tb = document.getElementById('tbody'); if(!tb) return;
    let st = null;
    tb.addEventListener('touchstart', e=>{
      const s = gset(); if(!s.on) return;
      const tr = e.target.closest('tr'); if(!tr) return;
      const t = e.touches[0]; st = {tr, x: t.clientX, y: t.clientY, dx: 0, lock: null, held: false};
      if(s.hold && !window.__rtHoldPreview) st.timer = setTimeout(()=>{ const g = rowGame(tr); if(g){ st.held = true; peek(g, t.clientX, t.clientY); try{ navigator.vibrate && navigator.vibrate(10); }catch(e){} } }, 480);
    }, {passive: true});
    tb.addEventListener('touchmove', e=>{
      if(!st) return; const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
      if(Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(st.timer);
      if(!st.lock) st.lock = Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : (Math.abs(dy) > 10 ? 'y' : null);
      if(st.lock === 'x'){ st.dx = dx; st.tr.style.transform = `translateX(${Math.max(-110, Math.min(110, dx))}px)`; st.tr.classList.toggle('sw-r', dx > 60); st.tr.classList.toggle('sw-l', dx < -60); }
    }, {passive: true});
    const end = e=>{
      if(!st) return; clearTimeout(st.timer);
      const s = gset(), tr = st.tr, dx = st.dx;
      tr.style.transform = ''; tr.classList.remove('sw-r', 'sw-l');
      if(st.held){ unpeek(); e.preventDefault && e.cancelable && e.preventDefault(); tr.dataset.noclick = '1'; setTimeout(()=> delete tr.dataset.noclick, 400); }
      else if(st.lock === 'x' && Math.abs(dx) > 60){ const g = rowGame(tr); const a = dx > 0 ? s.right : s.left; if(g && a !== 'none') doAct(g, a); tr.dataset.noclick = '1'; setTimeout(()=> delete tr.dataset.noclick, 400); }
      st = null;
    };
    tb.addEventListener('touchend', end); tb.addEventListener('touchcancel', end);
    tb.addEventListener('click', e=>{ const tr = e.target.closest('tr'); if(tr && tr.dataset.noclick){ e.stopPropagation(); e.preventDefault(); } }, true);
    function rowGame(tr){ const rows = [...tb.querySelectorAll('tr')], i = rows.indexOf(tr); const list = applyFilters(); return list[i] || null; }
  })();
  function openGestures(){
    const s = gset(), opt = v=> Object.entries(ACTS).map(([k, l])=> `<option value="${k}"${k === v ? ' selected' : ''}>${l}</option>`).join('');
    const body = sheet('xGest', gi('pad') + ' Gesti rapidi', `<div class="lp-sub">Nella lista dei giochi (telefono): scorri una riga verso destra o sinistra per un'azione veloce, tieni premuto per un'anteprima. Scegli tu cosa fa ogni gesto.</div>
      <label class="ask-toggle"><input type="checkbox" id="gsOn" ${s.on ? 'checked' : ''}> Attiva i gesti rapidi</label>
      <label class="gs-row">Scorri a destra → <select id="gsR">${opt(s.right)}</select></label>
      <label class="gs-row">Scorri a sinistra ← <select id="gsL">${opt(s.left)}</select></label>
      <label class="ask-toggle"><input type="checkbox" id="gsH" ${s.hold ? 'checked' : ''}> Tieni premuto per l'anteprima</label>`);
    const save = ()=> LS.set(GK, {on: body.querySelector('#gsOn').checked, right: body.querySelector('#gsR').value, left: body.querySelector('#gsL').value, hold: body.querySelector('#gsH').checked});
    body.querySelectorAll('input,select').forEach(x=> x.addEventListener('change', save));
  }
  menu(gi('pad') + ' Gesti rapidi', openGestures);

  // =====================================================================
  // 26) RICERCA TOLLERANTE: sigle (ff7, ffx, dq11, p5r, ct), numeri romani ↔ arabi, «and»/«&», articoli
  // =====================================================================
  const ROM = {i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16};
  const ALIAS = new Map();
  function aliasesOf(g){
    if(ALIAS.has(g.id)) return ALIAS.get(g.id);
    const words = nrm(g.name).replace(/\bthe\b|\bof\b|\band\b/g, ' ').split(' ').filter(Boolean);
    const arab = words.map(w=> ROM[w] ? String(ROM[w]) : w), set = new Set();
    const acr = (ws, keepNum)=> ws.map(w=> /^\d+$/.test(w) ? (keepNum ? w : '') : w[0]).join('');
    set.add(arab.join('')); set.add(words.join(''));
    set.add(acr(arab, true)); set.add(acr(words, true));
    // sigla + numero romano scritto intero (ffvii, ffx) e senza sottotitolo (prima dei due punti)
    const main = nrm(String(g.name).split(/[:\-–]/)[0]).split(' ').filter(Boolean);
    const lastW = main[main.length - 1];
    if(main.length >= 2){ set.add(main.slice(0, -1).map(w=> w[0]).join('') + (ROM[lastW] ? lastW : '')); set.add(main.slice(0, -1).map(w=> w[0]).join('') + (ROM[lastW] ? ROM[lastW] : lastW)); set.add(main.map(w=> ROM[w] ? String(ROM[w]) : w[0]).join('')); }
    const out = [...set].filter(a=> a.length >= 2); ALIAS.set(g.id, out); return out;
  }
  if(typeof searchCompactMatch === 'function'){
    const orig = searchCompactMatch;
    const aliasMatch = (g, q)=>{ const c = nrm(q).replace(/ /g, ''); if(c.length < 2) return false; const qa = c.replace(/(^|[a-z])(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3})$/, (m, p, r)=> ROM[r] ? p + ROM[r] : m); return aliasesOf(g).some(a=> a === c || a === qa || (c.length >= 4 && a.startsWith(c))); };
    const repl = function(g, q){ return orig(g, q) || aliasMatch(g, q); };
    try{ searchCompactMatch = repl; }catch(e){}
    window.searchCompactMatch = repl;
  }

  // =====================================================================
  // 28) COPERTINE OFFLINE: miniature servite da wsrv.nl (con CORS) e salvate dal service worker
  // =====================================================================
  if(typeof window.coverThumb === 'function'){
    const orig = window.coverThumb;
    window.coverThumb = (u, w)=> /^https?:\/\//.test(u || '') && !/^https:\/\/wsrv\.nl\//.test(u) ? wsrv(u, w || 360) : orig(u, w);
  }
  async function offlineCovers(){
    const list = GAMES.map(g=> effectiveCover(g)).filter(u=> u && /^https?:/.test(u));
    const body = sheet('xOffline', gi('cloud') + ' Copertine per l\'offline', `<div class="lp-sub">Salvo nel telefono una miniatura di ${list.length} copertine, così le vedi anche senza internet. Circa ${Math.round(list.length * 25 / 1024)} MB.</div><div class="lp-sub" id="offSt">Pronto.</div><button class="btn primary" type="button" id="offGo">${gi('cloud')} Scarica</button>`);
    body.querySelector('#offGo').addEventListener('click', async ev=>{
      ev.currentTarget.disabled = true; const st = body.querySelector('#offSt'); let ok = 0, n = 0;
      for(let i = 0; i < list.length; i += 6){
        await Promise.all(list.slice(i, i + 6).map(u=> fetch(wsrv(u, 360), {mode: 'cors'}).then(r=>{ if(r.ok) ok++; }).catch(()=>{})));
        n = Math.min(list.length, i + 6); st.textContent = n + ' / ' + list.length + ' (' + ok + ' salvate)';
      }
      st.textContent = 'Fatto: ' + ok + ' copertine disponibili offline.'; LS.set('rt_offline_covers', Date.now());
    });
  }
  menu(gi('cloud') + ' Copertine per l\'offline', offlineCovers);

  // =====================================================================
  // 30) RAPPORTO QUALITÀ NOTTURNO
  // =====================================================================
  function openQuality(){
    if(typeof QUALITY === 'undefined'){ sheet('xQual', gi('pulse') + ' Rapporto qualità notturno', '<div class="lp-sub">Il rapporto si crea ogni notte su GitHub (workflow «Dati settimanali»). Non è ancora disponibile.</div>'); return; }
    const by = {}; QUALITY.issues.forEach(i=> (by[i[2]] = by[i[2]] || []).push(i));
    const LAB = {doppione: 'Nomi doppi', anno: 'Anni', tag: 'Generi', testo: 'Testi legati al tempo', voto: 'Voti diversi dal Metascore', lingua: 'Lingua italiana', community: 'Recensioni in calo', copertina: 'Copertine rotte'};
    const body = sheet('xQual', gi('pulse') + ' Rapporto qualità notturno', `<div class="lp-sub">Controllo del ${esc(QUALITY.built)}: ${QUALITY.issues.length} segnalazioni. Tocca un gioco per aprirlo e usare «Update+» o «Aggiorna info».</div>` +
      Object.keys(by).map(k=> `<details class="hist"><summary>${esc(LAB[k] || k)} (${by[k].length})</summary>${by[k].slice(0, 80).map(i=> `<button class="btn qr-row" type="button" data-qr="${i[0]}"><b>${esc(i[1])}</b><br><small>${esc(i[3])}</small></button>`).join('')}</details>`).join(''));
    body.querySelectorAll('[data-qr]').forEach(b=> b.addEventListener('click', ()=>{ const g = GAMES.find(x=> x.id == b.dataset.qr); if(g){ document.getElementById('xQual').classList.remove('show'); openModal(g); } }));
  }
  menu(gi('pulse') + ' Rapporto qualità notturno', openQuality);
  // Triple Triad: ora è un gioco a parte (repository raccoon-triad); qui resta solo il collegamento
  const TT_URL = 'https://kur0chanx.github.io/raccoon-triad/';
  function openTT(){ toast('Apro Raccoon Triad…', 1500); location.href = TT_URL; }
  window.openTT = openTT;
  menu(gi('cards') + ' Raccoon Triad (gioco di carte)', openTT);
  menu(gi('orb') + ' Tema dalla copertina: ' + (TINT_ON() ? 'acceso' : 'spento'), ()=>{ LS.set('jrpg_app_tint', !TINT_ON()); toast('Tema dalla copertina ' + (TINT_ON() ? 'acceso' : 'spento'), 2500); });
})();
