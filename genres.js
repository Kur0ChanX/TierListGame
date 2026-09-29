// ---- Verifica dei generi su Wikidata (fonte pubblica e consultabile dal browser) ----
// Non cambia nulla da solo sui giochi già presenti: propone le aggiunte e l'utente conferma.
// Sui giochi NUOVI aggiunti da Novità/Chiedi aggiunge in automatico i generi che Wikidata conferma.
(function(){
  const WD = 'https://www.wikidata.org/w/api.php';
  const MAP = [
    [/tactical role|strategy role|turn-based tactic|tactical rpg|grid-based tactic/i, 'TAC'],
    [/action role|action rpg|hack and slash|hack & slash/i, 'ACT'],
    [/dungeon crawl/i, 'DUN'],
    [/monster[- ]?(taming|collecting|raising|hunting rpg)|creature[- ]collect/i, 'MON'],
    [/card game|deck[- ]?build|collectible card|digital collectible/i, 'CARD'],
    [/roguelike|roguelite|rogue-lite/i, 'ROG'],
    [/metroidvania/i, 'METR'],
    [/soulslike|souls-like/i, 'SOUL'],
    [/visual novel/i, 'VN'],
    [/survival horror|horror/i, 'HOR'],
    [/mecha/i, 'MECH'],
    [/life simulation|farming simulation|farm/i, 'LIFE'],
    [/platform/i, 'PLAT'],
    [/fighting game/i, 'FIGHT'],
    [/real-time strategy|\brts\b/i, 'RTS'],
    [/tower defen/i, 'TOWERDEF'],
    [/puzzle/i, 'PUZ'],
    [/stealth/i, 'STEALTH'],
    [/first-person shooter/i, 'FPS'],
    [/third-person shooter/i, 'TPS'],
    [/shoot 'em up|shoot em up|shmup/i, 'SHMUP'],
    [/racing/i, 'RACE'],
    [/sports? (video )?game|association football/i, 'SPORT'],
    [/city[- ]building|construction and management/i, 'CITY'],
    [/action-adventure|action adventure/i, 'ACTADV'],
    [/open[- ]world/i, 'OPENW'],
    [/massively multiplayer online|\bmmo/i, 'MMO'],
    [/flight simulat|vehicle simulat|train simulat/i, 'SIMVEH'],
    [/quiz|trivia/i, 'TRIVIA'],
    [/point[- ]and[- ]click|graphic adventure/i, 'ADV'],
    [/walking simulator/i, 'WALK'],
    [/battle royale/i, 'BR'],
    [/rhythm|music video game/i, 'RHY'],
    [/party game/i, 'PARTY'],
    [/sandbox|survival game/i, 'SAND'],
    [/multiplayer online battle arena|\bmoba\b/i, 'MOBA'],
    [/4x|turn-based strategy/i, 'TBS4X'],
    [/beat 'em up|beat em up/i, 'BEAT']
  ];
  const codesFrom = labels=>{ const out = []; labels.forEach(l=> MAP.forEach(([re, c])=>{ if(re.test(l) && !out.includes(c)) out.push(c); })); return out; };
  async function wd(params){
    const r = await fetch(WD + '?' + new URLSearchParams(Object.assign({format:'json', origin:'*'}, params)));
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  const cleanName = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remake|complete|hd|edition|reborn|reloaded).*$/i, '').trim();
  async function genreCodes(name){
    const s = await wd({action:'wbsearchentities', search: cleanName(name), language:'en', type:'item', limit:'8'});
    const target = normGameName(cleanName(name));
    const cand = (s.search || []).find(x=> /video ?game|role-playing|game/i.test(x.description || '') && !/series|franchise|soundtrack/i.test(x.description || '') && (normGameName(x.label) === target || normGameName(x.label).includes(target) || target.includes(normGameName(x.label))));
    if(!cand) return null;
    const e = await wd({action:'wbgetentities', ids: cand.id, props:'claims'});
    const claims = (e.entities && e.entities[cand.id] && e.entities[cand.id].claims) || {};
    const gids = (claims.P136 || []).map(c=> c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id).filter(Boolean);
    const years = (claims.P577 || []).map(c=> c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.time).filter(Boolean).map(t=> parseInt(String(t).slice(1,5),10)).filter(Boolean);
    if(!gids.length) return {qid: cand.id, labels: [], codes: [], years};
    const l = await wd({action:'wbgetentities', ids: gids.join('|'), props:'labels', languages:'en'});
    const labels = gids.map(id=> l.entities && l.entities[id] && l.entities[id].labels && l.entities[id].labels.en && l.entities[id].labels.en.value).filter(Boolean);
    return {qid: cand.id, labels, codes: codesFrom(labels), years};
  }
  window.wikidataGenreCodes = genreCodes;

  // ----- giochi nuovi: unisce in automatico i generi confermati da Wikidata -----
  window.verifyNewGameGenres = async function(id, doc){
    try{
      const r = await genreCodes(doc.name);
      if(!r || !r.codes.length) return;
      const tags = (doc.tags || []).slice();
      const add = r.codes.filter(c=> !tags.includes(c) && TAG_INFO[c]);
      if(!add.length) return;
      const merged = tags.concat(add).slice(0, 5);
      const next = Object.assign({}, doc, {tags: merged});
      if(COVER_DB) await COVER_DB.doc('customGames/' + String(id)).set(next);
      ensureGenreLists(merged);
      showToast('🔎 Generi verificati su Wikidata: aggiunti ' + add.map(c=> TAG_INFO[c].label).join(', '), 4500);
    }catch(e){}
  };

  // ----- controllo completo, con conferma -----
  const OV_KEY = 'jrpg_tag_overrides';
  const cacheKey = 'jrpg_wd_cache2', labKey = 'jrpg_wd_labels2';   // v2: salva anche le etichette di Wikidata (servono per proporre di TOGLIERE tag sbagliati)
  const loadJson = (k, d)=>{ try{ return JSON.parse(localStorage.getItem(k) || 'null') || d; }catch(e){ return d; } };
  window.applyTagOverrides = function(){
    const ov = loadJson(OV_KEY, {});
    GAMES.forEach(g=>{ if(ov[g.id] && !g.custom) g.tags = ov[g.id].slice(); });
  };
  function panel(){
    let el = document.getElementById('genreCheckBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'genreCheckBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-gc-close]')) el.classList.remove('show'); }); }
    return el;
  }
  let running = false;
  async function runCheck(el){
    if(running) return; running = true;
    const cache = loadJson(cacheKey, {}), labs = loadJson(labKey, {});
    const todo = GAMES.filter(g=> !(g.id in cache));
    let done = 0, fail = 0, idx = 0;
    const status = el.querySelector('#gcStatus');
    const worker = async ()=>{
      while(idx < todo.length){
        const g = todo[idx++];
        try{ const r = await genreCodes(g.name); cache[g.id] = r ? r.codes : []; labs[g.id] = r ? r.labels : null; }catch(e){ fail++; }
        done++;
        if(done % 8 === 0){ status.textContent = `Controllo… ${done}/${todo.length}`; try{ localStorage.setItem(cacheKey, JSON.stringify(cache)); localStorage.setItem(labKey, JSON.stringify(labs)); }catch(_){} }
      }
    };
    try{ await Promise.all([worker(), worker(), worker()]); }finally{ running = false; }
    try{ localStorage.setItem(cacheKey, JSON.stringify(cache)); localStorage.setItem(labKey, JSON.stringify(labs)); }catch(_){}
    if(todo.length && fail === todo.length){ status.textContent = 'Non riesco a contattare Wikidata da questa pagina (bloccato in Claude? usa la versione GitHub).'; return; }
    status.textContent = 'Controllo completato.';
    showProposals(el, cache, labs, fail);
  }
  function showProposals(el, cache, labs, fail){
    const rows = [];
    GAMES.forEach(g=>{
      const codes = cache[g.id] || [], wl = labs[g.id];
      const add = codes.filter(c=> TAG_INFO[c] && !g.tags.includes(c));
      // "Avventura punta e clicca" è un genere preciso: se Wikidata conosce i generi del gioco e non lo indica, propongo di toglierlo (errore tipico: Elden Ring, Portal, Stardew finiti lì)
      const remove = (g.tags.includes('ADV') && wl && wl.length && !codes.includes('ADV') && (g.tags.filter(t=> t !== 'ADV').length || add.length)) ? ['ADV'] : [];
      if(add.length || remove.length) rows.push({g, add, remove, wl});
    });
    const body = el.querySelector('#gcBody');
    if(!rows.length){ body.innerHTML = `<div class="lp-sub">✅ Nessuna differenza: i generi che ho salvato coincidono con quelli di Wikidata${fail ? ` (${fail} giochi non trovati o non raggiungibili)` : ''}.</div>`; return; }
    body.innerHTML = `<div class="lp-sub">Wikidata suggerisce correzioni ai generi di <b>${rows.length}</b> giochi (aggiunte e tag da togliere). Togli la spunta a quelli che non ti convincono. ⚠️ = sposta il gioco fuori da JRPG / RPG.${fail ? ` (${fail} giochi non trovati)` : ''}</div>
      <div class="gc-rows">${rows.map((r,i)=> `<label class="gc-row"><input type="checkbox" data-i="${i}" checked> <span><b>${escHtml(r.g.name)}</b><br>${(r.remove.length ? `❌ togliere ${TAG_INFO.ADV.icon} ${escHtml(TAG_INFO.ADV.label)} <small>(Wikidata: ${escHtml((r.wl || []).join(', '))})</small><br>` : '') + r.add.map(c=> `${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)}${EXTRA_GENRE_INFO[c] ? ' ⚠️' : ''}`).join(' · ')}</span></label>`).join('')}</div>
      <div class="lp-tools"><button class="btn primary" id="gcApply">Applica i selezionati</button></div>`;
    body.querySelector('#gcApply').addEventListener('click', ()=>{
      const ov = loadJson(OV_KEY, {}); let n = 0; const sets = [];
      body.querySelectorAll('input[data-i]:checked').forEach(cb=>{
        const r = rows[+cb.dataset.i]; const tags = r.g.tags.filter(t=> !r.remove.includes(t)).concat(r.add).slice(0, 6);
        if(r.g.custom){ try{ COVER_DB && COVER_DB.doc('customGames/' + r.g.id).set({name:r.g.name, plat:r.g.plat, year:r.g.year, tier:r.g.tier, score:r.g.score, tags, story:r.g.story, note:r.g.note, label:r.g.label}); }catch(e){} }
        else { ov[r.g.id] = tags; r.g.tags = tags.slice(); }
        n++; sets.push(tags);
      });
      try{ localStorage.setItem(OV_KEY, JSON.stringify(ov)); }catch(e){}
      try{ renderListBar(); render(); }catch(e){}
      body.innerHTML = `<div class="lp-sub">✅ Applicate ${n} correzioni.</div>`;
    });
  }
  window.openGenreCheck = function(){
    const el = panel();
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🔎 Verifica generi online</b><button class="btn" data-gc-close>Chiudi</button></div>
      <div class="lp-sub">Confronta i generi di tutti i tuoi giochi con <b>Wikidata</b> (database pubblico). Non cambia nulla senza il tuo ok. Al primo giro può richiedere qualche minuto; i risultati restano salvati.</div>
      <div class="lp-tools"><button class="btn primary" id="gcStart">Avvia il controllo</button></div><div class="lp-sub" id="gcStatus"></div><div id="gcBody"></div></div>`;
    el.querySelector('#gcStart').addEventListener('click', ()=>{ el.querySelector('#gcStatus').textContent = 'Controllo…'; runCheck(el); });
    el.classList.add('show');
  };
  document.addEventListener('DOMContentLoaded', ()=>{ const b = document.getElementById('genreCheckBtn'); if(b) b.addEventListener('click', window.openGenreCheck); });
  try{ applyTagOverrides(); renderListBar(); if(state.view === 'list') render(); }catch(e){}
})();
