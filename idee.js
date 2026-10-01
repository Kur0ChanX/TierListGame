// ---- Nuove idee v184: eredi spirituali, scala d'ingresso, dietro le quinte, punto d'uscita, album personale, uscite nel calendario ----
// Tutto sulle fonti aperte (Wikipedia) e sui dati già nella scheda; niente chiavi obbligatorie. Gemini (se la chiave c'è) serve solo per i pulsanti «cerca nelle fonti».
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS} = U;
  if(window.RT_OFF && window.RT_OFF.idee) return;
  const menu = (html, run)=>{ (window.XMENU = window.XMENU || []).push({html, run}); };
  const clean = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').trim();
  const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const byName = n=> GAMES.find(x=> norm(clean(x.name)) === norm(clean(n)));
  const yt = q=> 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const llmOk = ()=> typeof llmAvailable === 'function' && llmAvailable();
  const CK = 'rt_idee_cache';
  const cget = (k, days)=>{ const c = LS.get(CK, {}) || {}, e = c[k]; return e && Date.now() - e.t < (days || 60) * 864e5 ? e.v : null; };
  const cset = (k, v)=>{ const c = LS.get(CK, {}) || {}; c[k] = {t: Date.now(), v}; const ks = Object.keys(c); if(ks.length > 400) ks.sort((a, b)=> c[a].t - c[b].t).slice(0, ks.length - 400).forEach(x=> delete c[x]); LS.set(CK, c); };

  // ---- Wikipedia ----
  const WP = 'https://en.wikipedia.org/w/api.php';
  const wp = p=> SearchHub.json(WP + '?' + new URLSearchParams(Object.assign({format: 'json', origin: '*', formatversion: '2'}, p)));
  async function wpTitle(name){
    const q = clean(name), j = await wp({action: 'query', list: 'search', srsearch: q + ' video game', srlimit: '6'});
    const t = norm(q), list = (j.query && j.query.search) || [];
    const hit = list.find(x=> norm(x.title.replace(/\s*\([^)]*\)/g, '')) === t) || list.find(x=> norm(x.title).startsWith(t));
    return hit ? hit.title : null;
  }
  async function wpText(title, intro){
    const e = await wp(Object.assign({action: 'query', prop: 'extracts', explaintext: '1', exsectionformat: 'wiki', titles: title}, intro ? {exintro: '1'} : {}));
    return ((((e.query || {}).pages || [])[0]) || {}).extract || '';
  }
  const wpUrl = t=> 'https://en.wikipedia.org/wiki/' + encodeURIComponent(String(t).replace(/ /g, '_'));
  const section = (txt, names)=>{ const m = new RegExp('==\\s*(?:' + names + ')[^=\\n]*==\\s*\\n([\\s\\S]*?)(?=\\n==[^=]|$)', 'i').exec(txt); return m ? m[1].trim() : ''; };
  const firstChars = (t, n)=>{ t = String(t || '').replace(/\s+/g, ' ').trim(); if(t.length <= n) return t; const c = t.slice(0, n), i = c.lastIndexOf('. '); return (i > n * .5 ? c.slice(0, i + 1) : c.trim() + '…'); };

  // =====================================================================
  // 8) EREDI E RADICI SPIRITUALI (da Wikipedia: frasi «spiritual successor to …»)
  // =====================================================================
  async function findHeirs(g){
    const name = clean(g.name), out = {heirs: [], roots: []}, nre = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const j = await wp({action: 'query', list: 'search', srsearch: '"spiritual successor" "' + name + '" video game', srlimit: '15', srprop: 'snippet'});
    const re = new RegExp('spiritual (?:successor|sequel|follow-?up)[^.]{0,100}' + nre + '|' + nre + '[^.]{0,80}spiritual (?:successor|sequel)', 'i');
    ((j.query && j.query.search) || []).forEach(x=>{
      const sn = String(x.snippet || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
      if(norm(x.title).includes(norm(name)) || /^(list of|characters of)/i.test(x.title)) return;
      if(re.test(sn)) out.heirs.push({title: x.title.replace(/\s*\([^)]*\)$/, ''), url: wpUrl(x.title), why: firstChars(sn, 170)});
    });
    const t = await wpTitle(g.name);
    if(t){
      const txt = await wpText(t, true);
      const m = /spiritual (?:successor|sequel|follow-?up)(?: (?:of|to))? (?:the )?(?:\d{4} (?:video )?game )?([A-Z][^.,;()]{2,70}?)(?= (?:series|franchise)|[.,;()]|$)/.exec(txt);
      if(m) out.roots.push({title: m[1].trim(), url: wpUrl(t), why: firstChars(txt.slice(Math.max(0, m.index - 60), m.index + 160), 190)});
    }
    return out;
  }
  async function heirsAI(g){
    const r = await askLLM(todayLine() + `Del videogioco "${g.name}" elenca gli eredi spirituali (giochi presentati dalla stampa o dagli sviluppatori come «successore spirituale») e le sue radici spirituali (giochi di cui è erede). Includi SOLO relazioni dichiarate esplicitamente da fonti affidabili, non semplici somiglianze. Rispondi SOLO con JSON: {"heirs":[{"title":"","year":"","why":"una frase","source":"url"}],"roots":[{"title":"","year":"","why":"","source":"url"}]} (max 5 per elenco, vuoto se non ne sai).`, {}, {search: true, fast: true, label: 'Cerco gli eredi spirituali…'});
    const s = String(r && r.text || ''), j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
    const fix = a=> (Array.isArray(a) ? a : []).filter(x=> x && x.title).slice(0, 5).map(x=> ({title: String(x.title).slice(0, 80), url: /^https?:/.test(x.source || '') ? x.source : '', why: String(x.why || '').slice(0, 170), year: x.year || ''}));
    return {heirs: fix(j.heirs), roots: fix(j.roots), ai: true};
  }
  function heirChips(list, label){
    if(!list.length) return '';
    return `<div class="id-sub">${label}</div><div class="id-chips">${list.map(x=>{
      const have = byName(x.title);
      return `<span class="id-chip">${have ? `<button type="button" class="btn" data-open="${have.id}"><span class="badge ${TIER_LABEL[have.tier]}">${have.tier}</span> ${esc(x.title)}</button>` : `<span class="id-name">${esc(x.title)}${x.year ? ' <small>(' + esc(x.year) + ')</small>' : ''}</span> <button type="button" class="btn" data-add="${esc(x.title)}" data-year="${esc(x.year || '')}" title="Aggiungi alla lista">＋</button>`}${x.url ? ` <a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.why || 'fonte')}">↗</a>` : ''}</span>`;
    }).join('')}</div>`;
  }
  function paintHeirs(host, g, d){
    host.innerHTML = (d.heirs.length || d.roots.length ? heirChips(d.roots, '🌱 Radici: è l\'erede spirituale di') + heirChips(d.heirs, '🌳 Eredi: giochi che lo continuano nello spirito') + `<div class="lp-sub">${d.ai ? 'Trovati con la ricerca web (Gemini): controlla il link ↗.' : 'Trovati su Wikipedia: ogni ↗ porta alla pagina con la frase.'}</div>` : '<div class="lp-sub">Nessuna relazione «erede spirituale» dichiarata nelle fonti consultate.</div>')
      + `<div class="lp-tools">${d.ai ? '' : '<button type="button" class="btn" data-ai="1">🔎 Cerca anche sul web (Gemini)</button>'}</div>`;
    host.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const x = GAMES.find(y=> String(y.id) === b.dataset.open); if(x) openModal(x); }));
    host.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ try{ const c = {name: b.dataset.add, year: b.dataset.year}; if(typeof sagaQuietAdd === 'function' ? sagaQuietAdd(c) : (askToolAddCustomGame(c, 'Eredi spirituali'), true)){ b.textContent = '✓'; b.disabled = true; toast('Aggiunto: si completa da solo', 2200); } else toast('Già in lista', 1800); }catch(e){ toast('Non aggiunto', 2000); } }));
    const ai = host.querySelector('[data-ai]'); if(ai){ if(!llmOk()){ ai.disabled = true; ai.title = 'Serve la chiave Gemini (⚙️ in Chiedi)'; } ai.addEventListener('click', async ()=>{ ai.disabled = true; ai.textContent = 'Cerco…'; try{ const r = await heirsAI(g); const prev = cget('heir:' + g.id) || {heirs: [], roots: []}; const m = {heirs: prev.heirs.concat(r.heirs), roots: prev.roots.concat(r.roots), ai: true}; cset('heir:' + g.id, m); paintHeirs(host, g, m); }catch(e){ ai.textContent = 'Non riuscito: riprova'; ai.disabled = false; } }); }
  }

  // =====================================================================
  // 10) DIETRO LE QUINTE
  // =====================================================================
  function backstageHtml(g){
    const n = clean(g.name);
    const L = [['🎙️ Interviste agli sviluppatori', n + ' developer interview'], ['🎞️ Documentario / making of', n + ' making of documentary'], ['📓 Diario di sviluppo', n + ' development diary behind the scenes'], ['🧠 Retrospettiva / postmortem', n + ' postmortem retrospective']];
    return `<div class="id-links">${L.map(([t, q])=> `<a class="btn" href="${esc(yt(q))}" target="_blank" rel="noopener">${t}</a>`).join('')}</div><div class="lp-tools"><button type="button" class="btn" data-dev="1">📖 Come è nato (Wikipedia)</button></div><div class="id-dev"></div>`;
  }
  function wireBackstage(host, g){
    const b = host.querySelector('[data-dev]'), out = host.querySelector('.id-dev'); if(!b) return;
    b.addEventListener('click', async ()=>{
      const c = cget('dev:' + g.id, 120); if(c){ out.innerHTML = c; return; }
      b.disabled = true; b.textContent = 'Leggo…';
      try{
        const t = await wpTitle(g.name); if(!t) throw new Error('nessuna pagina');
        const txt = await wpText(t, false), s = section(txt, 'Development|Production|Design|Conception|Creation|Development and release');
        const html = s ? `<div class="modal-note">${esc(firstChars(s, 900))} <a href="${esc(wpUrl(t))}" target="_blank" rel="noopener">Leggi tutto su Wikipedia ↗</a></div>` : `<div class="lp-sub">La pagina di Wikipedia non ha una sezione sullo sviluppo. <a href="${esc(wpUrl(t))}" target="_blank" rel="noopener">Aprila ↗</a></div>`;
        cset('dev:' + g.id, html); out.innerHTML = html;
      }catch(e){ out.innerHTML = '<div class="lp-sub">Non trovo una pagina di Wikipedia per questo gioco ora.</div>'; }
      b.disabled = false; b.textContent = '📖 Come è nato (Wikipedia)';
    });
  }

  // =====================================================================
  // 13) PUNTO D'USCITA (dai dati della scheda; le recensioni solo su richiesta)
  // =====================================================================
  const PACE = /ripetitiv|dilatat|padding|filler|prolisso|rallent|lungaggin|dispersiv|ritmo|stancant|monoton|grinding/i;
  function exitInfo(g){
    const e = g.enrich || {}, l = g.label || {}, hm = e.hoursMain || l.h || 0, hc = e.hoursCompletionist || 0;
    if(hm < 15) return null;
    const cons = (e.cons || (g.proscons && g.proscons.cons) || []).filter(c=> PACE.test(c));
    const lines = [];
    lines.push(`Storia principale circa <b>${hm} h</b>${hc ? ` · completista circa <b>${hc} h</b>` : ''}.`);
    if(hc && hc >= hm * 1.6) lines.push(`👉 Se ti interessa la storia, fermati intorno alle <b>${hm} h</b>: il resto (fino a ${hc} h) è contenuto opzionale.`);
    else if(hm >= 40) lines.push('Gioco lungo: ritagliati una pausa a metà per non arrivare stanco al finale.');
    if(e.lengthVerdict) lines.push('Giudizio sulla durata: ' + esc(e.lengthVerdict));
    if(cons.length) lines.push('⚠️ Dai difetti segnalati: ' + cons.slice(0, 2).map(esc).join(' · '));
    return lines;
  }
  function exitHtml(g){
    const L = exitInfo(g); if(!L) return '';
    const c = cget('exit:' + g.id, 120);
    return `<div class="modal-section-title">🚪 Punto d'uscita</div><div class="id-body" id="idExit"><div class="modal-note">${L.join('<br>')}</div>${c ? `<div class="modal-note id-ai">${esc(c)}</div>` : `<div class="lp-tools"><button type="button" class="btn" data-exit="1">🔎 Cerca nelle recensioni dove cala il ritmo</button></div><div class="id-exit-out"></div>`}</div>`;
  }
  function wireExit(host, g){
    const b = host.querySelector('[data-exit]'), out = host.querySelector('.id-exit-out'); if(!b) return;
    if(!llmOk()){ b.disabled = true; b.title = 'Serve la chiave Gemini (⚙️ in Chiedi)'; }
    b.addEventListener('click', async ()=>{
      b.disabled = true; b.textContent = 'Leggo le recensioni…';
      try{
        const t = await wpTitle(g.name); if(!t) throw new Error('nessuna pagina');
        const txt = await wpText(t, false), rec = section(txt, 'Reception|Critical reception|Critical response|Reviews');
        if(!rec) throw new Error('nessuna sezione');
        const r = await askLLM(todayLine() + `Dal testo seguente (recensioni di «${g.name}» su Wikipedia) scrivi in italiano, in massimo 3 frasi, SOLO ciò che dice su ritmo, ripetitività, durata o parti deboli del gioco, e dove la storia o il gioco sono al meglio. Non inventare nulla: se il testo non ne parla scrivi esattamente NESSUNA INFO.\n\n${rec.slice(0, 5000)}`, {}, {fast: true, silent: true, label: 'Leggo le recensioni…'});
        const a = String(r && r.text || '').trim();
        const msg = !a || /NESSUNA INFO/i.test(a) ? 'Le recensioni di Wikipedia non indicano un punto preciso in cui cala il ritmo.' : a;
        cset('exit:' + g.id, msg); out.innerHTML = `<div class="modal-note id-ai">${esc(msg)} <small><a href="${esc(wpUrl(t))}" target="_blank" rel="noopener">fonte ↗</a></small></div>`; b.remove();
      }catch(e){ out.innerHTML = '<div class="lp-sub">Non riesco a leggere le recensioni ora.</div>'; b.disabled = false; b.textContent = '🔎 Cerca nelle recensioni dove cala il ritmo'; }
    });
  }

  // =====================================================================
  // 16) IL MIO ALBUM (foto e screenshot tuoi, per gioco; restano su questo dispositivo)
  // =====================================================================
  const idb = ()=> new Promise((res, rej)=>{ try{ const r = indexedDB.open('rt_album', 1); r.onupgradeneeded = ()=>{ r.result.createObjectStore('p', {keyPath: 'id', autoIncrement: true}).createIndex('g', 'g'); }; r.onsuccess = ()=> res(r.result); r.onerror = ()=> rej(r.error); }catch(e){ rej(e); } });
  const albumList = async gid=>{ const db = await idb(); return new Promise(res=>{ const out = [], q = db.transaction('p').objectStore('p').index('g').openCursor(IDBKeyRange.only(String(gid))); q.onsuccess = e=>{ const c = e.target.result; if(c){ out.push(c.value); c.continue(); } else res(out); }; q.onerror = ()=> res(out); }); };
  const albumAdd = async (gid, blob)=>{ const db = await idb(); return new Promise((res, rej)=>{ const t = db.transaction('p', 'readwrite'); t.objectStore('p').add({g: String(gid), t: Date.now(), b: blob}); t.oncomplete = ()=> res(true); t.onerror = ()=> rej(t.error); }); };
  const albumDel = async id=>{ const db = await idb(); return new Promise(res=>{ const t = db.transaction('p', 'readwrite'); t.objectStore('p').delete(id); t.oncomplete = ()=> res(true); t.onerror = ()=> res(false); }); };
  const shrink = (file, max, q)=> new Promise((res, rej)=>{
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = ()=>{ const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b=> b ? res(b) : rej(new Error('immagine')), 'image/jpeg', q); };
    im.onerror = ()=>{ URL.revokeObjectURL(url); rej(new Error('immagine non leggibile')); };
    im.src = url;
  });
  window.rtAlbum = {list: albumList, add: async (gid, file)=> albumAdd(gid, await shrink(file, 1600, .82)), del: albumDel};
  let urls = [];
  const freeUrls = ()=>{ urls.forEach(u=> URL.revokeObjectURL(u)); urls = []; };
  function viewer(items, i, onDel){
    let el = document.getElementById('idViewer');
    if(!el){ el = document.createElement('div'); el.id = 'idViewer'; el.className = 'id-viewer'; document.body.appendChild(el); }
    const paint = ()=>{
      const it = items[i]; if(!it){ el.classList.remove('show'); return; }
      el.innerHTML = `<button type="button" class="id-vx" data-x="1" aria-label="Chiudi">✕</button><img src="${it.url}" alt=""><div class="id-vbar"><button type="button" class="btn" data-p="1">‹</button><span>${i + 1}/${items.length}</span><button type="button" class="btn" data-n="1">›</button><button type="button" class="btn" data-d="1">🗑️ Elimina</button></div>`;
      el.classList.add('show');
    };
    el.onclick = async e=>{
      const b = e.target.closest('button'); if(!b){ if(e.target === el) el.classList.remove('show'); return; }
      if(b.dataset.x) el.classList.remove('show');
      else if(b.dataset.p){ i = (i - 1 + items.length) % items.length; paint(); }
      else if(b.dataset.n){ i = (i + 1) % items.length; paint(); }
      else if(b.dataset.d){ if(!confirm('Elimino questa foto dall\'album?')) return; await albumDel(items[i].id); items.splice(i, 1); i = Math.max(0, Math.min(i, items.length - 1)); await onDel(); paint(); }
    };
    paint();
  }
  async function paintAlbum(host, g){
    let list = []; try{ list = await albumList(g.id); }catch(e){ host.innerHTML = '<div class="lp-sub">L\'album non è disponibile in questo browser.</div>'; return; }
    freeUrls();
    const items = list.map(x=> { const u = URL.createObjectURL(x.b); urls.push(u); return {id: x.id, url: u}; });
    host.innerHTML = `${items.length ? `<div class="id-thumbs">${items.map((x, i)=> `<button type="button" class="id-th" data-i="${i}"><img src="${x.url}" alt="" loading="lazy"></button>`).join('')}</div>` : '<div class="lp-sub">Nessuna foto: aggiungi i tuoi screenshot o scatta una foto allo schermo mentre giochi.</div>'}
      <div class="lp-tools"><label class="btn id-up">＋ Aggiungi foto<input type="file" accept="image/*" multiple hidden></label><label class="btn id-up">📷 Scatta<input type="file" accept="image/*" capture="environment" hidden></label></div><div class="lp-sub">Restano su questo dispositivo (non vengono sincronizzate).</div>`;
    host.querySelectorAll('.id-th').forEach(b=> b.addEventListener('click', ()=> viewer(items, +b.dataset.i, ()=> paintAlbum(host, g))));
    host.querySelectorAll('input[type=file]').forEach(inp=> inp.addEventListener('change', async ()=>{
      const files = Array.from(inp.files || []); if(!files.length) return;
      let n = 0; for(const f of files){ try{ await window.rtAlbum.add(g.id, f); n++; }catch(e){} }
      toast(n ? n + (n === 1 ? ' foto aggiunta' : ' foto aggiunte') + ' all\'album' : 'Non sono riuscito a leggere le foto', 2400); paintAlbum(host, g);
    }));
  }

  // ---- blocchi nella scheda del gioco ----
  function blocksHtml(g){
    return `<div class="modal-section-title">🧬 Eredi e radici spirituali</div><div class="id-body" id="idHeirs"><div class="lp-tools"><button type="button" class="btn" data-heir="1">🔎 Cerca nelle fonti (Wikipedia)</button></div></div>
      <div class="modal-section-title">🎬 Dietro le quinte</div><div class="id-body" id="idBack">${backstageHtml(g)}</div>
      ${exitHtml(g)}
      <div class="modal-section-title">📷 Il mio album</div><div class="id-body" id="idAlbum"><div class="lp-sub">Carico…</div></div>`;
  }
  function putBlocks(g, onlyMissing){
    const card = document.getElementById('modalCard'); if(!card || !g) return;
    if(onlyMissing && card.querySelector('#idHeirs')) return;
    card.querySelectorAll('#idHeirs, #idBack, #idExit, #idAlbum').forEach(n=>{ const p = n.previousElementSibling; if(p && p.classList.contains('modal-section-title')) p.remove(); n.remove(); });
    const links = card.querySelector('.modal-links') || card.querySelector('.modal-actions'); if(!links) return;
    links.insertAdjacentHTML('beforebegin', blocksHtml(g));
    const hh = card.querySelector('#idHeirs');
    const c = cget('heir:' + g.id, 90); if(c) paintHeirs(hh, g, c);
    else hh.querySelector('[data-heir]').addEventListener('click', async e=>{
      const b = e.currentTarget; b.disabled = true; b.textContent = 'Cerco…';
      try{ const d = await findHeirs(g); cset('heir:' + g.id, d); paintHeirs(hh, g, d); }catch(x){ b.disabled = false; b.textContent = 'Non riuscito: riprova'; }
    });
    wireBackstage(card.querySelector('#idBack'), g);
    const ex = card.querySelector('#idExit'); if(ex) wireExit(ex, g);
    paintAlbum(card.querySelector('#idAlbum'), g);
  }
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      putBlocks(g, false);
      const again = ()=>{ try{ if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id && document.getElementById('modalBackdrop').classList.contains('show')) putBlocks(g, true); }catch(e){} };
      setTimeout(again, 1200); setTimeout(again, 3600);
    }catch(e){ try{ console.error(e); }catch(x){} }
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}

  // =====================================================================
  // 9) LA SCALA D'INGRESSO AL GENERE
  // =====================================================================
  function ladder(tag, onlyIt){
    const pool = GAMES.filter(g=> (tag === '*' || (g.tags || []).includes(tag)) && g.tier !== 'ND' && g.score >= 72 && (!onlyIt || ['D', 'S'].includes((g.label || {}).it)));
    const ease = g=>{ const l = g.label || {}, h = (g.enrich && g.enrich.hoursMain) || l.h || 30; return (l.d || 3) * 10 + (l.g || 3) * 3 + h / 8; };
    const sorted = pool.slice().sort((a, b)=> ease(a) - ease(b)), n = sorted.length, k = Math.ceil(n / 3);
    return [sorted.slice(0, k), sorted.slice(k, 2 * k), sorted.slice(2 * k)].map(a=> a.sort((x, y)=> y.score - x.score).slice(0, 3));
  }
  function openLadder(){
    const counts = {}; GAMES.forEach(g=> (g.tags || []).forEach(t=> { if(TAG_INFO[t]) counts[t] = (counts[t] || 0) + 1; }));
    const tags = Object.keys(counts).filter(t=> counts[t] >= 9).sort((a, b)=> counts[b] - counts[a]);
    let cur = LS.get('jrpg_ladder', '*'), it = !!LS.get('jrpg_ladder_it', false);
    const body = sheet('xLadder', '🪜 La scala d\'ingresso', '');
    const draw = ()=>{
      const rungs = ladder(cur, it), T = ['1 · Per iniziare', '2 · Per prendere confidenza', '3 · Per esperti'], S = ['I più accessibili: difficoltà bassa, durata contenuta.', 'Quando ti sei abituato: un po\' più di sistemi e di ore.', 'I più impegnativi del genere: difficoltà e profondità alte.'];
      body.innerHTML = `<div class="lp-sub">Scegli un genere: ti metto i giochi in ordine, dal più accessibile al più impegnativo (solo giochi con voto 72 o più). Va bene anche per consigliarlo a un amico.</div>
        <div class="tagchips" style="margin:8px 0"><button type="button" class="tagchip${cur === '*' ? ' active' : ''}" data-t="*">Tutti</button>${tags.map(t=> `<button type="button" class="tagchip${cur === t ? ' active' : ''}" data-t="${t}">${TAG_INFO[t].icon} ${esc(TAG_INFO[t].label)}</button>`).join('')}</div>
        <label class="ask-toggle"><input type="checkbox" id="ldIt" ${it ? 'checked' : ''}> Solo con italiano (testi o doppiaggio)</label>
        ${rungs.map((r, i)=> `<div class="ld-rung"><b>${T[i]}</b><small>${S[i]}</small>${r.length ? r.map(g=>{ const l = g.label || {}, h = (g.enrich && g.enrich.hoursMain) || l.h; return `<button type="button" class="ld-g" data-id="${g.id}"><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span><span class="nm">${esc(g.name)}</span><small>${l.d ? 'difficoltà ' + l.d + '/5' : ''}${h ? ' · ' + h + ' h' : ''}${['D', 'S'].includes(l.it) ? ' · 🇮🇹' : ''}</small></button>`; }).join('') : '<small>nessun gioco con questi filtri</small>'}</div>`).join('')}`;
      body.querySelectorAll('[data-t]').forEach(b=> b.addEventListener('click', ()=>{ cur = b.dataset.t; LS.set('jrpg_ladder', cur); draw(); }));
      body.querySelector('#ldIt').addEventListener('change', e=>{ it = e.target.checked; LS.set('jrpg_ladder_it', it); draw(); });
      body.querySelectorAll('[data-id]').forEach(b=> b.addEventListener('click', ()=>{ const x = GAMES.find(y=> String(y.id) === b.dataset.id); document.getElementById('xLadder').classList.remove('show'); if(x) openModal(x); }));
    };
    draw();
  }
  menu('🪜 Scala d\'ingresso a un genere', openLadder);

  // =====================================================================
  // 19) USCITE NEL CALENDARIO (.ics con promemoria)
  // =====================================================================
  const icsEsc = t=> String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  function wishItems(){
    const w = LS.get('jrpg_wishlist', {}) || {}, now = new Date().toISOString().slice(0, 10), out = [];
    Object.keys(w).forEach(id=>{
      const it = w[id]; if(!it || it.released || !it.date) return;
      let d = it.date, approx = false;
      if(/^\d{4}-\d{2}$/.test(d)){ d += '-01'; approx = true; } else if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      if(d < now) return;
      out.push({id, name: it.name, date: d, approx, note: it.note || ''});
    });
    return out.sort((a, b)=> a.date.localeCompare(b.date));
  }
  function buildIcs(items){
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Raccoon Tier//Wishlist//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    items.forEach(x=>{
      const d = x.date.replace(/-/g, ''), nx = new Date(x.date + 'T00:00:00'); nx.setDate(nx.getDate() + 1);
      const d2 = nx.getFullYear() + String(nx.getMonth() + 1).padStart(2, '0') + String(nx.getDate()).padStart(2, '0');
      L.push('BEGIN:VEVENT', 'UID:rt-' + x.id + '-' + d + '@raccoon-tier', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + d2,
        'SUMMARY:' + icsEsc('🎮 Esce: ' + x.name + (x.approx ? ' (mese indicativo)' : '')),
        'DESCRIPTION:' + icsEsc('Dalla tua wishlist di Raccoon Tier.' + (x.note ? ' ' + x.note : '')),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Domani esce ' + x.name), 'TRIGGER:-PT15H', 'END:VALARM',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Oggi esce ' + x.name), 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }
  function exportIcs(){
    const items = wishItems();
    if(!items.length){ toast('Nessuna uscita con data nella wishlist: aggiungi un gioco 🎁 e aspetta il controllo della data', 4200); return; }
    const blob = new Blob([buildIcs(items)], {type: 'text/calendar;charset=utf-8'}), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'uscite-raccoon-tier.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=> URL.revokeObjectURL(a.href), 4000);
    toast('📅 ' + items.length + (items.length === 1 ? ' uscita pronta' : ' uscite pronte') + ': aprila per aggiungerle al calendario', 4500);
  }
  window.rtExportIcs = exportIcs;
  menu('📅 Uscite nel calendario (.ics)', exportIcs);
  // pulsante dentro la wishlist
  (function(){
    const addBtn = ()=>{ const el = document.getElementById('xWish'); if(!el || !el.classList.contains('show')) return; const body = el.querySelector('.x-body'); if(!body || body.querySelector('#idIcs')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'idIcs'; b.textContent = '📅 Aggiungi le uscite al calendario'; b.addEventListener('click', exportIcs); body.appendChild(b); };
    new MutationObserver(()=> addBtn()).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
  })();

  // =====================================================================
  // 16b) SCREENSHOT → ALBUM: riconosco il gioco dalla foto (Gemini) e la archivio
  // =====================================================================
  function openShots(){
    const body = sheet('xShots', '📷 Screenshot nell\'album', `<div class="lp-sub">Scegli uno o più screenshot dal telefono: riconosco il gioco${llmOk() ? ' (con Gemini)' : ' (serve la chiave Gemini: senza, scegli tu il gioco)'} e li metto nell\'album di quel gioco. Restano su questo dispositivo.</div>
      <label class="btn primary id-up">Scegli le foto<input type="file" accept="image/*" multiple hidden id="shIn"></label><datalist id="shNames">${GAMES.map(g=> `<option value="${esc(g.name)}">`).join('')}</datalist><div id="shRows"></div>`);
    body.querySelector('#shIn').addEventListener('change', async e=>{
      const files = Array.from(e.target.files || []), rows = body.querySelector('#shRows'); rows.innerHTML = '';
      for(const f of files){
        const row = document.createElement('div'); row.className = 'sh-row'; rows.appendChild(row);
        const u = URL.createObjectURL(f); urls.push(u);
        row.innerHTML = `<img src="${u}" alt=""><div class="sh-f"><input list="shNames" placeholder="Che gioco è?" autocomplete="off"><div class="sh-m lp-sub">${llmOk() ? 'Riconosco…' : ''}</div><button type="button" class="btn primary" disabled>Salva nell\'album</button></div>`;
        const inp = row.querySelector('input'), btn = row.querySelector('button'), msg = row.querySelector('.sh-m');
        const upd = ()=>{ btn.disabled = !byName(inp.value); };
        inp.addEventListener('input', upd);
        btn.addEventListener('click', async ()=>{ const g = byName(inp.value); if(!g) return; btn.disabled = true; try{ await window.rtAlbum.add(g.id, f); btn.textContent = '✓ Salvata in ' + g.name; }catch(x){ btn.disabled = false; msg.textContent = 'Non riuscito'; } });
        if(llmOk()){
          (async()=>{ try{
            const small = await shrink(f, 1024, .8);
            const r = await askLLM('Che videogioco è mostrato in questa immagine? Rispondi SOLO con il titolo esatto in inglese, senza altro testo. Se non lo riconosci con certezza rispondi SCONOSCIUTO.', {images: small}, {fast: true, silent: true, label: 'Riconosco il gioco…'});
            const t = String(r && r.text || '').trim().replace(/^["'«]|["'»]$/g, '').split('\n')[0];
            const g = /SCONOSCIUTO/i.test(t) ? null : byName(t);
            if(g){ inp.value = g.name; msg.textContent = 'Riconosciuto: ' + g.name; } else msg.textContent = t && !/SCONOSCIUTO/i.test(t) ? 'Sembra «' + t.slice(0, 50) + '», ma non è in lista: scegli tu' : 'Non lo riconosco: scegli tu';
            upd();
          }catch(x){ msg.textContent = 'Riconoscimento non riuscito: scegli tu'; } })();
        }
      }
    });
  }
  menu('📷 Screenshot nell\'album (riconosco il gioco)', openShots);

  // =====================================================================
  // ⭐ IMPORTA I PREFERITI DA UN ELENCO (per «allenare» i gusti in un colpo solo)
  // =====================================================================
  const ROM = {1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi', 7: 'vii', 8: 'viii', 9: 'ix', 10: 'x', 11: 'xi', 12: 'xii', 13: 'xiii', 14: 'xiv', 15: 'xv', 16: 'xvi'};
  const toks = t=> norm(t).split(' ').filter(Boolean).map(w=> ROM[+w] && /^\d+$/.test(w) ? ROM[+w] : w).filter(w=> !['the', 'of', 'and', 'a', 'di', 'il', 'la', 'e'].includes(w));
  const DEFAULT_FAVS = 'Final Fantasy VIII, Final Fantasy VII, Final Fantasy X, Final Fantasy VI, Ultima Online, Sekiro, The Division 2, Uncharted*, Metal Gear Solid, Elden Ring, Lies of P, World of Warcraft, StarCraft II, Age of Empires*, Nier Automata, Grand Theft Auto*, Fallout*, MediEvil, Mega Man X*, Ape Escape*, Detroit Become Human, Kingdom Hearts II, SSX Tricky, Chrono Trigger, Clair Obscur Expedition 33, Warcraft III, Ori*, Silent Hill 2, Ghost of Tsushima, Bully, Sonic*, Tomb Raider*, Arc Raiders, Onimusha 3, Metal Slug*, South Park, Crash Bandicoot*, The Last of Us, Balatro, Dave the Diver';
  function matchFav(entry){
    const multi = /\*\s*$/.test(entry), q = toks(entry.replace(/\*+\s*$/, '')); if(!q.length) return {entry, hits: []};
    let hits = GAMES.filter(g=>{ const gt = new Set(toks(clean(g.name))); return q.every(w=> gt.has(w) || [...gt].some(x=> w.length >= 5 && x.startsWith(w))); });
    if(!multi && hits.length){ const exact = hits.filter(g=> toks(clean(g.name)).length === q.length); hits = (exact.length ? exact : hits).sort((a, b)=> a.name.length - b.name.length).slice(0, 3); }
    else hits = hits.sort((a, b)=> (a.ysort || 0) - (b.ysort || 0)).slice(0, 14);
    return {entry: entry.replace(/\*+\s*$/, '').trim(), hits};
  }
  function openFavImport(){
    const body = sheet('xFavImp', '⭐ Importa i miei preferiti', `<div class="lp-sub">Scrivi i giochi che ami (uno per riga o separati da virgole): li cerco nel database e li segno tra i preferiti, così «I tuoi gusti» impara subito. Con un asterisco (es. «Tomb Raider*») segno tutta la saga. Questo è il tuo elenco: puoi cambiarlo.</div>
      <textarea id="fiTxt" rows="7" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border,#555);background:var(--card,#222);color:inherit;font-size:.95rem">${esc(DEFAULT_FAVS)}</textarea>
      <div class="lp-tools"><button type="button" class="btn primary" id="fiGo">🔎 Cerca nel database</button></div><div id="fiRes"></div>`);
    const res = body.querySelector('#fiRes');
    body.querySelector('#fiGo').addEventListener('click', ()=>{
      const list = body.querySelector('#fiTxt').value.split(/[\n,;]+/).map(x=> x.replace(/[♥️❤️]/g, '').trim()).filter(Boolean).map(matchFav);
      const found = list.filter(x=> x.hits.length), miss = list.filter(x=> !x.hits.length);
      res.innerHTML = `<div class="lp-sub">Trovati <b>${found.reduce((n, x)=> n + x.hits.length, 0)}</b> giochi per ${found.length} voci${miss.length ? ` · ${miss.length} non sono nel database` : ''}. Togli la spunta a quelli che non vuoi.</div>
        ${found.map(x=> `<div class="fi-g"><b>${esc(x.entry)}</b>${x.hits.map(g=> `<label class="ask-toggle"><input type="checkbox" data-id="${g.id}" ${FAVS.has(g.id) ? '' : 'checked'}> ${esc(g.name)} <small>${esc(g.year || '')}${FAVS.has(g.id) ? ' · già preferito' : ''}</small></label>`).join('')}</div>`).join('')}
        ${miss.length ? `<div class="fi-g"><b>Non nel database</b>${miss.map((x, i)=> `<div class="fi-m"><span>${esc(x.entry)}</span><button type="button" class="btn" data-add="${i}">＋ Aggiungi</button></div>`).join('')}</div>` : ''}
        <div class="lp-tools"><button type="button" class="btn primary" id="fiSave">⭐ Segna come preferiti</button></div>`;
      res.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const x = miss[+b.dataset.add]; try{ if(typeof sagaQuietAdd === 'function' && sagaQuietAdd({name: x.entry})){ b.textContent = '✓ Aggiunto'; b.disabled = true; toast('Aggiunto: si completa da solo, poi segnalo come preferito', 3200); } else { b.textContent = 'Già presente'; b.disabled = true; } }catch(e){ toast('Non aggiunto', 2000); } }));
      res.querySelector('#fiSave').addEventListener('click', ()=>{
        const ids = [...res.querySelectorAll('input[data-id]:checked')].map(i=> +i.dataset.id); ids.forEach(id=> FAVS.add(id));
        try{ saveFavs(); renderMetrics(); renderStats(); render(); }catch(e){}
        const sh = document.getElementById('xFavImp'); if(sh) sh.classList.remove('show');
        toast('⭐ ' + ids.length + ' giochi segnati tra i preferiti: «I tuoi gusti» sta imparando', 4200);
      });
    });
  }
  menu('⭐ Importa i miei preferiti da un elenco', openFavImport);
})();
