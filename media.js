// ---- Locandina e schermate scelte da te (v196): «🔄 Cambia locandina» e «🎞️ Scegli le schermate» nella scheda ----
// Quello che scegli resta BLOCCATO 🔒 (jrpg_media_lock {id: {cover: 1, shots: [url…]}}): nessun aggiornamento automatico,
// Update+ o ricerca in background lo cambia. Lo sblocchi dagli stessi pannelli.
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc} = U;
  const K = 'jrpg_media_lock';
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const lockOf = g=> (LSG(K, {}) || {})[g.id] || null;
  const setLock = (g, patch)=>{ const all = LSG(K, {}) || {}, e = Object.assign({}, all[g.id] || {}, patch); Object.keys(e).forEach(k=>{ if(e[k] == null || e[k] === 0 || (Array.isArray(e[k]) && !e[k].length)) delete e[k]; }); if(Object.keys(e).length) all[g.id] = e; else delete all[g.id]; LSS(K, all); };
  window.rtMediaLock = lockOf;

  // la locandina bloccata non si sostituisce in automatico (Update+, giochi nuovi, catalogo…): solo da qui, con «force»
  if(window.XCOVER && XCOVER.save){
    const orig = XCOVER.save;
    XCOVER.save = async function(g, url, opts){ if(g && (lockOf(g) || {}).cover && !(opts && opts.force)) return false; return orig.call(this, g, url); };
  }
  const reopen = g=>{ try{ const ng = GAMES.find(x=> x.id === g.id) || g; if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id) openModal(ng); }catch(e){} };

  // ---------- 🔄 Cambia locandina ----------
  async function openCovers(g){
    const lk = lockOf(g) || {};
    const body = sheet('xCovers', '🔄 Cambia locandina', `<div class="lp-sub">Tutte le locandine ufficiali che trovo (Steam, Libretro, Wikipedia, RAWG…). Tocca quella che ti piace: diventa la locandina del gioco e resta <b>bloccata 🔒</b>, nessun aggiornamento la cambia.</div>
      ${lk.cover ? '<div class="lp-tools"><button class="btn" id="cvUnlock" type="button">🔓 Sblocca la locandina (torna automatica)</button></div>' : ''}<div id="cvRes" class="lp-sub">Cerco…</div>`);
    const un = body.querySelector('#cvUnlock'); if(un) un.addEventListener('click', ()=>{ setLock(g, {cover: null}); toast('Locandina sbloccata', 1800); un.remove(); });
    const res = body.querySelector('#cvRes');
    let list = [];
    try{ list = await XCOVER.all(g, t=>{ if(res) res.textContent = 'Cerco… ' + t; }); }catch(e){}
    if(!res.isConnected) return;
    if(!list.length){ res.textContent = 'Non trovo altre locandine ora. Puoi sempre caricarne una dal telefono («Carica dal telefono»).'; return; }
    res.innerHTML = `<div class="cv-grid">${list.map((o, i)=> `<button type="button" class="cv-it" data-i="${i}"><img src="${esc(o.url)}" alt="" loading="lazy" decoding="async"><small>${esc(o.source)}</small></button>`).join('')}</div>`;
    res.querySelectorAll('[data-i]').forEach(b=> b.addEventListener('click', async ()=>{
      const o = list[+b.dataset.i]; b.classList.add('busy');
      try{ await XCOVER.save(g, o.url, {force: true}); setLock(g, {cover: 1}); toast('🔒 Locandina scelta e bloccata', 2200); const sh = document.getElementById('xCovers'); if(sh) sh.classList.remove('show'); reopen(g); }
      catch(e){ toast('Non riesco a salvarla: riprova', 2500); b.classList.remove('busy'); }
    }));
  }

  // ---------- 🎞️ Scegli le schermate del carosello ----------
  async function steamAll(g){
    try{
      const f = window.SearchHub && SearchHub.factsFor(g), id = f && f.s && f.s.id; if(!id) return [];
      const j = await SearchHub.json('https://store.steampowered.com/api/appdetails?appids=' + id + '&filters=screenshots', {timeout: 15000});
      const d = j && j[id] && j[id].success ? j[id].data : null;
      return ((d && d.screenshots) || []).map(x=> String(x.path_thumbnail || x.path_full || '').replace(/\?.*$/, '')).filter(Boolean).slice(0, 24);
    }catch(e){ return []; }
  }
  async function openShots(g){
    const lk = lockOf(g) || {};
    const body = sheet('xShots', '🎞️ Scegli le schermate', `<div class="lp-sub">Spunta le schermate che vuoi nel carosello della scheda (almeno una), poi «Salva e blocca»: restano quelle 🔒 finché non le sblocchi.</div>
      <div id="shRes" class="lp-sub">Cerco…</div>
      <div class="lp-tools"><button class="btn primary" id="shSave" type="button">✅ Salva e blocca 🔒</button>${lk.shots ? '<button class="btn" id="shUnlock" type="button">🔓 Torna automatiche</button>' : ''}</div>`);
    const un = body.querySelector('#shUnlock'); if(un) un.addEventListener('click', ()=>{ setLock(g, {shots: null}); toast('Schermate di nuovo automatiche', 1800); const sh = document.getElementById('xShots'); if(sh) sh.classList.remove('show'); reopen(g); });
    const res = body.querySelector('#shRes');
    const pool = [], add = u=>{ if(u && !pool.includes(u)) pool.push(u); };
    (lk.shots || []).forEach(add);
    try{ (window.rtSteamShots ? rtSteamShots(g) : []).forEach(add); }catch(e){}
    try{ (await steamAll(g)).forEach(add); }catch(e){}
    try{ (window.rtRawgShots ? await rtRawgShots(g) : []).forEach(add); }catch(e){}
    if(!res.isConnected) return;
    if(!pool.length){ res.textContent = 'Non trovo schermate per questo gioco (servono Steam o la chiave RAWG).'; return; }
    const sel = new Set(lk.shots && lk.shots.length ? lk.shots : pool.slice(0, 8));
    res.innerHTML = `<div class="cv-grid sh">${pool.map((u, i)=> `<button type="button" class="cv-it${sel.has(u) ? ' on' : ''}" data-i="${i}"><img src="${esc(u)}" alt="" loading="lazy" decoding="async"><span class="cv-ck">✓</span></button>`).join('')}</div><small>${pool.length} schermate trovate · tocca per scegliere</small>`;
    res.querySelectorAll('[data-i]').forEach(b=> b.addEventListener('click', ()=>{ const u = pool[+b.dataset.i]; if(sel.has(u)) sel.delete(u); else sel.add(u); b.classList.toggle('on', sel.has(u)); }));
    body.querySelector('#shSave').addEventListener('click', ()=>{
      const list = pool.filter(u=> sel.has(u)); if(!list.length){ toast('Scegline almeno una', 2000); return; }
      setLock(g, {shots: list}); toast('🔒 ' + list.length + ' schermate scelte e bloccate', 2200);
      const sh = document.getElementById('xShots'); if(sh) sh.classList.remove('show'); reopen(g);
    });
  }

  // ---------- pulsanti nella scheda (vicino agli strumenti della copertina) ----------
  function addButtons(g){
    const tools = document.querySelector('#coverBlock .cover-tools'); if(!tools || tools.querySelector('[data-media]')) return;
    const lk = lockOf(g) || {};
    tools.insertAdjacentHTML('afterbegin', `<button class="cover-pill" type="button" data-media="cover" title="Scegli un'altra locandina ufficiale: poi resta bloccata">🔄<span>${lk.cover ? 'Locandina 🔒' : 'Cambia locandina'}</span></button><button class="cover-pill" type="button" data-media="shots" title="Scegli le schermate del carosello: poi restano bloccate">🎞️<span>${lk.shots ? 'Schermate 🔒' : 'Schermate'}</span></button>`);
  }
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('[data-media]'); if(!b || typeof currentModalGame === 'undefined' || !currentModalGame) return;
    e.preventDefault(); if(b.dataset.media === 'cover') openCovers(currentModalGame); else openShots(currentModalGame);
  });
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){ const r = prev.apply(this, arguments); try{ if(g) addButtons(g); }catch(e){} return r; };
    try{ openModal = window.openModal; }catch(e){}
  }
  // la copertina viene ridisegnata quando arriva l'immagine: rimetto i pulsanti se spariscono
  try{ const card = document.getElementById('modalCard'); if(card) new MutationObserver(()=>{ if(typeof currentModalGame !== 'undefined' && currentModalGame && document.querySelector('#coverBlock .cover-tools') && !document.querySelector('#coverBlock [data-media]')) addButtons(currentModalGame); }).observe(card, {childList: true, subtree: true}); }catch(e){}
})();
