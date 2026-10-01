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
    XCOVER.save = async function(g, url, opts){ if(g && (lockOf(g) || {}).cover && !(opts && opts.force)) return false; return orig.call(this, g, url, opts); };
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

  // ---------- 🎞️ Schermate del carosello (v199): tocchi una foto → tante alternative → tocchi quella nuova: la sostituisce e la blocca 🔒 ----------
  const thumbOf = new Map();          // foto grande -> miniatura (per la griglia, più leggera)
  async function steamId(g){
    try{ const f = window.SearchHub && SearchHub.factsFor(g), id = f && f.s && f.s.id; if(id) return id; }catch(e){}
    try{
      const j = await SearchHub.json('https://store.steampowered.com/api/storesearch/?l=english&cc=us&term=' + encodeURIComponent(String(g.name).replace(/[:™®]/g, ' ')), {timeout: 12000});
      const n = s=> String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''), it = ((j && j.items) || []).find(x=> n(x.name) === n(g.name)) || ((j && j.items) || [])[0];
      return it ? it.id : null;
    }catch(e){ return null; }
  }
  async function steamAll(g){
    try{
      const id = await steamId(g); if(!id) return [];
      const j = await SearchHub.json('https://store.steampowered.com/api/appdetails?appids=' + id + '&filters=screenshots,movies', {timeout: 15000});
      const d = j && j[id] && j[id].success ? j[id].data : null, out = [];
      ((d && d.screenshots) || []).forEach(x=>{ const full = String(x.path_full || x.path_thumbnail || '').replace(/\?.*$/, ''); if(full){ out.push(full); thumbOf.set(full, String(x.path_thumbnail || full).replace(/\?.*$/, '')); } });
      ((d && d.movies) || []).forEach(m=>{ const u = String(m.thumbnail || '').replace(/\?.*$/, ''); if(u) out.push(u); });      // fotogrammi dei trailer
      return out;
    }catch(e){ return []; }
  }
  // anteprima grande (tieni premuto su una foto, o tocca 🔍)
  function preview(src){
    let ov = document.getElementById('rtPrev');
    if(!ov){ ov = document.createElement('div'); ov.id = 'rtPrev'; ov.className = 'rt-prev'; ov.innerHTML = '<img alt=""><small>Tocca per chiudere</small>'; ov.addEventListener('click', ()=> ov.classList.remove('show')); document.body.appendChild(ov); }
    ov.querySelector('img').src = src; ov.classList.add('show');
  }
  window.rtPreview = preview;
  let lpT = 0, lpDone = false, lpX = 0, lpY = 0;
  document.addEventListener('pointerdown', e=>{
    const it = e.target.closest && e.target.closest('.cv-it'), im = it && it.querySelector('img'); if(!im) return;
    lpDone = false; lpX = e.clientX; lpY = e.clientY; clearTimeout(lpT);
    lpT = setTimeout(()=>{ lpDone = true; preview(im.dataset.full || im.src); try{ navigator.vibrate && navigator.vibrate(15); }catch(x){} }, 450);
  }, true);
  document.addEventListener('pointermove', e=>{ if(lpT && Math.hypot(e.clientX - lpX, e.clientY - lpY) > 12){ clearTimeout(lpT); lpT = 0; } }, true);
  ['pointerup', 'pointercancel'].forEach(t=> document.addEventListener(t, ()=>{ clearTimeout(lpT); lpT = 0; }, true));
  document.addEventListener('click', e=>{ if(lpDone && e.target.closest && e.target.closest('.cv-it')){ e.stopPropagation(); e.preventDefault(); lpDone = false; } }, true);
  document.addEventListener('contextmenu', e=>{ if(e.target.closest && e.target.closest('.cv-it')) e.preventDefault(); }, true);

  async function openShots(g){
    const body = sheet('xShots', '🎞️ Foto del carosello', `<div class="lp-sub"><b>Tocca la foto che non ti piace</b>: ti mostro tante alternative, tocchi quella nuova e la sostituisce, bloccata 🔒. <b>Tieni premuto</b> su una foto per vederla in grande.</div>
      <div id="shCur" class="lp-sub">Cerco…</div><div id="shAlt"></div>
      <div class="lp-tools"><button class="btn" id="shUnlock" type="button">🔓 Torna automatiche</button></div>`);
    const cur = body.querySelector('#shCur'), alt = body.querySelector('#shAlt');
    body.querySelector('#shUnlock').addEventListener('click', ()=>{ setLock(g, {shots: null}); toast('Foto di nuovo automatiche', 1800); const sh = document.getElementById('xShots'); if(sh) sh.classList.remove('show'); reopen(g); });
    let slots = [];
    try{ slots = (await (window.rtShotsFor ? rtShotsFor(g) : [])).slice(0, 12); }catch(e){}
    const pool = [], add = u=>{ if(u && !pool.includes(u)) pool.push(u); };
    let poolReady = (async()=>{
      try{ (window.rtSteamShots ? rtSteamShots(g) : []).forEach(add); }catch(e){}
      const [a, b] = await Promise.all([steamAll(g).catch(()=> []), (window.rtRawgShots ? rtRawgShots(g) : Promise.resolve([])).catch(()=> [])]);
      a.forEach(add); (b || []).forEach(add);
    })();
    if(!cur.isConnected) return;
    const locked = ()=> !!((lockOf(g) || {}).shots || []).length;
    const img = u=> `<img src="${esc(thumbOf.get(u) || u)}" data-full="${esc(u)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.cv-it').classList.add('bad')">`;
    let sel = -1, page = 0;
    const drawCur = ()=>{
      cur.innerHTML = `<div class="cv-grid sh cur">${slots.map((u, i)=> `<button type="button" class="cv-it on${sel === i ? ' pick' : ''}" data-s="${i}">${img(u)}<span class="cv-n">${i + 1}${locked() ? ' 🔒' : ''}</span></button>`).join('')}${slots.length < 12 ? '<button type="button" class="cv-it cv-plus" data-s="new">＋<small>Aggiungi una foto</small></button>' : ''}</div>`;
    };
    const save = ()=>{ setLock(g, {shots: slots.slice()}); };
    const drawAlt = async ()=>{
      if(sel === -1){ alt.innerHTML = ''; return; }
      alt.innerHTML = '<div class="lp-sub">Cerco le alternative…</div>';
      await poolReady; if(!alt.isConnected) return;
      const free = pool.filter(u=> !slots.includes(u));
      if(!free.length){ alt.innerHTML = '<div class="lp-sub">Non trovo altre foto di questo gioco (Steam e, con la chiave, RAWG).</div>'; return; }
      const per = 12, pages = Math.ceil(free.length / per); page = page % pages;
      const show = free.slice(page * per, page * per + per);
      alt.innerHTML = `<div class="gs2-h">${sel === 'new' ? 'Scegli la foto da aggiungere' : 'Al posto della foto ' + (sel + 1) + ':'} <small>(${free.length} disponibili${pages > 1 ? ', gruppo ' + (page + 1) + ' di ' + pages : ''})</small></div>
        <div class="cv-grid sh">${show.map(u=> `<button type="button" class="cv-it" data-a="${esc(u)}">${img(u)}</button>`).join('')}</div>
        <div class="lp-tools">${pages > 1 ? '<button class="btn" type="button" id="shMore">🔄 Altre foto diverse</button>' : ''}${sel !== 'new' && slots.length > 1 ? '<button class="btn" type="button" id="shDel">🗑️ Togli questa foto</button>' : ''}<button class="btn" type="button" id="shCancel">Annulla</button></div>`;
      const m = alt.querySelector('#shMore'); if(m) m.addEventListener('click', ()=>{ page++; drawAlt(); });
      const d = alt.querySelector('#shDel'); if(d) d.addEventListener('click', ()=>{ slots.splice(sel, 1); sel = -1; save(); toast('Foto tolta 🔒', 1500); drawCur(); drawAlt(); });
      alt.querySelector('#shCancel').addEventListener('click', ()=>{ sel = -1; drawCur(); drawAlt(); });
      alt.querySelectorAll('[data-a]').forEach(b=> b.addEventListener('click', ()=>{
        const u = b.dataset.a; if(sel === 'new') slots.push(u); else slots[sel] = u;
        save(); toast('🔒 Foto ' + (sel === 'new' ? slots.length : sel + 1) + ' cambiata e bloccata', 1800);
        sel = -1; drawCur(); drawAlt(); reopenSoft(g);
      }));
      try{ alt.scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(e){}
    };
    cur.addEventListener('click', e=>{
      const b = e.target.closest('[data-s]'); if(!b) return;
      const v = b.dataset.s === 'new' ? 'new' : +b.dataset.s;
      if(sel === v){ page++; } else { sel = v; page = 0; }      // ritocchi la stessa foto: altre alternative
      drawCur(); drawAlt();
    });
    if(!slots.length){ await poolReady; slots = pool.slice(0, 6); }
    if(!slots.length){ cur.textContent = 'Non trovo foto per questo gioco (servono Steam o la chiave RAWG).'; return; }
    drawCur();
  }
  // quando chiudi il pannello, la scheda riparte con le foto nuove
  const reopenSoft = g=>{
    const sh = document.getElementById('xShots'); if(!sh || sh._rtObs) return;
    const mo = new MutationObserver(()=>{ if(!sh.classList.contains('show')){ mo.disconnect(); sh._rtObs = null; reopen(g); } });
    sh._rtObs = mo; mo.observe(sh, {attributes: true, attributeFilter: ['class']});
  };

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
