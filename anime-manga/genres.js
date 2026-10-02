// ---- Verifica dei generi su Wikidata (fonte pubblica e consultabile dal browser) ----
// Non cambia nulla da solo sui giochi già presenti: propone le aggiunte e l'utente conferma.
// Sui giochi NUOVI aggiunti da Novità/Chiedi aggiunge in automatico i generi che Wikidata conferma.
(function(){
  const WD = 'https://www.wikidata.org/w/api.php';
  // etichette inglesi dei generi di Wikidata → codici dei tag anime (meta.tags nei dati)
  const MAP = [
    [/documentar/i, 'DOC'], [/\baction\b/i, 'ACT'], [/adventure/i, 'ADV'], [/comedy|comedic|humor/i, 'COM'], [/drama/i, 'DRA'],
    [/fantasy/i, 'FAN'], [/science fiction|sci-fi|cyberpunk|space opera/i, 'SCI'], [/horror/i, 'HOR'],
    [/mystery|whodunit/i, 'MYS'], [/psycholog/i, 'PSY'], [/thriller/i, 'THR'], [/romance|romantic|love story/i, 'ROM'],
    [/slice of life/i, 'SOL'], [/sport/i, 'SPO'], [/supernatural|occult|ghost/i, 'SUP'], [/mecha|giant robot|real robot|super robot/i, 'MEC'],
    [/music|musical/i, 'MUS'], [/magical girl|mahou shoujo|mahō shōjo/i, 'MAH'], [/ecchi/i, 'ECC'],
    [/sh[oō]nen|shounen/i, 'SHO'], [/seinen/i, 'SEI'], [/sh[oō]jo|shoujo/i, 'SHJ'], [/josei/i, 'JOS'],
    [/children|kodomo/i, 'KID'], [/family film|family/i, 'FAM'], [/isekai/i, 'ISE'], [/school/i, 'SCH'],
    [/martial arts|wuxia|kung fu/i, 'MAR'], [/superhero|super power/i, 'POW'], [/historical|period drama|jidaigeki|samurai/i, 'HIS'],
    [/\bwar\b|military/i, 'MIL'], [/survival|death game|battle royale/i, 'SUR'], [/gambling|game/i, 'GAM'], [/iyashikei/i, 'IYA'],
    [/cooking|food|gourmet/i, 'FOO'], [/\bidol/i, 'IDO'], [/time travel|time loop/i, 'TIM'], [/vampire/i, 'VAM'],
    [/splatter|gore/i, 'GOR'], [/crime|detective|yakuza|gangster|police/i, 'CRI'], [/post-apocalyptic|dystopi/i, 'DYS'],
    [/harem/i, 'HAR'], [/yuri|boys.? love|yaoi|lgbt/i, 'LGB'], [/webtoon/i, 'WEB']
  ];
  const codesFrom = labels=>{ const out = []; labels.forEach(l=> MAP.forEach(([re, c])=>{ if(re.test(l) && !out.includes(c)) out.push(c); })); return out; };
  const fj = (u, o)=> window.SearchHub ? SearchHub.json(u, o) : fetch(u).then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  async function wd(params){
    return fj(WD + '?' + new URLSearchParams(Object.assign({format:'json', origin:'*'}, params)));
  }
  const cleanName = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remake|complete|hd|edition|reborn|reloaded).*$/i, '').trim();
  async function genreCodes(name){
    const s = await wd({action:'wbsearchentities', search: cleanName(name), language:'en', type:'item', limit:'8'});
    const target = normGameName(cleanName(name));
    const cand = (s.search || []).find(x=> /anime|manga|manhwa|manhua|webtoon|animated|animation|film|television series|light novel/i.test(x.description || '') && !/franchise|soundtrack|video ?game|episode|character/i.test(x.description || '') && (normGameName(x.label) === target || normGameName(x.label).includes(target) || target.includes(normGameName(x.label))));
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
  window.wikidataCodesFrom = codesFrom;

  // ----- giochi nuovi: unisce in automatico i generi confermati da Wikidata -----
  // verifyNewGameGenres è definita in verify.js (coda e fonti leggere)

  // ----- controllo completo, con conferma -----
  const OV_KEY = 'atl_tag_overrides';
  const cacheKey = 'atl_wd_cache2', labKey = 'atl_wd_labels2';   // v2: salva anche le etichette di Wikidata (servono per proporre di TOGLIERE tag sbagliati)
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
    if(window.Progress) Progress.begin('Verifico i generi su Wikidata…');
    const worker = async ()=>{
      while(idx < todo.length){
        const g = todo[idx++];
        try{ const r = await genreCodes(g.name); cache[g.id] = r ? r.codes : []; labs[g.id] = r ? r.labels : null; }catch(e){ fail++; }
        done++;
        if(window.Progress) Progress.set(done / Math.max(1, todo.length) * 100, `Generi: ${done}/${todo.length}`);
        if(done % 8 === 0){ status.textContent = `Controllo… ${done}/${todo.length}`; try{ localStorage.setItem(cacheKey, JSON.stringify(cache)); localStorage.setItem(labKey, JSON.stringify(labs)); }catch(_){} }
      }
    };
    try{ await Promise.all([worker(), worker(), worker()]); }finally{ running = false; if(window.Progress) Progress.end(); }
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
      const remove = [];      // versione Anime: si propongono solo aggiunte (i generi di Wikidata sono troppo larghi per togliere)
      if(add.length || remove.length) rows.push({g, add, remove, wl});
    });
    const body = el.querySelector('#gcBody');
    if(!rows.length){ body.innerHTML = `<div class="lp-sub">✅ Nessuna differenza: i generi che ho salvato coincidono con quelli di Wikidata${fail ? ` (${fail} titoli non trovati o non raggiungibili)` : ''}.</div>`; return; }
    body.innerHTML = `<div class="lp-sub">Wikidata suggerisce correzioni ai generi di <b>${rows.length}</b> titoli. Togli la spunta a quelli che non ti convincono.${fail ? ` (${fail} titoli non trovati)` : ''}</div>
      <div class="gc-rows">${rows.map((r,i)=> `<label class="gc-row"><input type="checkbox" data-i="${i}" checked> <span><b>${escHtml(r.g.name)}</b><br>${(r.remove.length ? `❌ togliere ${TAG_INFO.ADV.icon} ${escHtml(TAG_INFO.ADV.label)} <small>(Wikidata: ${escHtml((r.wl || []).join(', '))})</small><br>` : '') + r.add.map(c=> `${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)}${EXTRA_GENRE_INFO[c] ? ' ⚠️' : ''}`).join(' · ')}</span></label>`).join('')}</div>
      <div class="lp-tools"><button class="btn primary" id="gcApply">Applica i selezionati</button></div>`;
    body.querySelector('#gcApply').addEventListener('click', ()=>{
      const ov = loadJson(OV_KEY, {}); let n = 0; const sets = [];
      body.querySelectorAll('input[data-i]:checked').forEach(cb=>{
        const r = rows[+cb.dataset.i]; const tags = r.g.tags.filter(t=> !r.remove.includes(t)).concat(r.add).slice(0, 6);
        if(r.g.custom){ try{ COVER_DB && COVER_DB.doc('customGames/' + r.g.id).set(Object.assign(customDocFromGame(r.g, cleanCustomEnrich(r.g.enrich) || undefined), {tags})); }catch(e){} }
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
  // v219: ridisegno solo se ci sono davvero correzioni dei generi da applicare (prima sempre: 100-200 ms in più a ogni avvio)
  try{ if(Object.keys(loadJson(OV_KEY, {})).length){ applyTagOverrides(); renderListBar(); if(state.view === 'list') render(); } }catch(e){}
})();
