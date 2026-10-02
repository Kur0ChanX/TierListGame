// ---- Sincronizzazione automatica dei dati personali tra dispositivi, tramite un Gist privato del tuo GitHub ----
// Il token (permesso "gist" soltanto) resta solo in questo browser. Non viene mai sincronizzato.
(function(){
  const NOSYNC = ['jrpg_gemini_key','jrpg_rawg_key','jrpg_opencritic_key','jrpg_audit_turbo','jrpg_sync_token','jrpg_sync_gist','jrpg_sync_meta','jrpg_catalog_gist','jrpg_catalog_at','jrpg_catalog_pub','jrpg_keys_user','jrpg_relay_url','jrpg_engine','jrpg_filters_open','jrpg_ask_requests','jrpg_active_profile','jrpg_db_askRequests','jrpg_triad_acct','jrpg_triad_server','jrpg_triad_photos','jrpg_triad_autoart'];
  const GIST_DESC = 'TierListGame dati (sync automatica)';
  const FILE = 'tierlist-data.json';
  const API = 'https://api.github.com';
  const _get = Storage.prototype.getItem, _set = Storage.prototype.setItem, _rem = Storage.prototype.removeItem;
  const ls = { get:k=>{ try{ return _get.call(localStorage, k); }catch(e){ return null; } }, set:(k,v)=>{ try{ _set.call(localStorage, k, v); }catch(e){} }, rem:k=>{ try{ _rem.call(localStorage, k); }catch(e){} } };
  const UNION = ['jrpg_db_customGames','jrpg_db_covers','jrpg_db_blobs'];
  const syncable = k=> typeof k === 'string' && k.indexOf('jrpg_') === 0 && !NOSYNC.includes(k);
  const token = ()=> (ls.get('jrpg_sync_token') || '').trim();
  const loadMeta = ()=>{ try{ return JSON.parse(ls.get('jrpg_sync_meta') || '{}') || {}; }catch(e){ return {}; } };
  const saveMeta = m=> ls.set('jrpg_sync_meta', JSON.stringify(m));
  let applying = false, timer = null, busy = false, statusEl = null, lastSync = 0;

  function setStatus(msg, ok){
    if(!statusEl) statusEl = document.getElementById('syncStatus');
    if(statusEl){ statusEl.textContent = msg; statusEl.style.color = ok === true ? '#2e7d32' : ok === false ? '#c62828' : ''; }
  }
  function stamp(k){ const m = loadMeta(); m[k] = Date.now(); saveMeta(m); ls.set('rt_sync_dirty', '1'); schedulePush(); }      // v219: «ci sono modifiche da inviare» (resta anche se chiudi l'app)
  // Spazio del browser (circa 5 MB): se una scrittura non ci sta, prima libero ciò che si può rigenerare (registro diagnostico, cache dei ponti, dettagli dell'audit) e riprovo;
  // se ancora non basta, avviso l'utente invece di perdere i dati in silenzio.
  const isQuota = e=> !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
  function emergencyClean(except){
    let freed = false;
    ['rt_debuglog', 'rt_relay_health', 'rt_needs_relay', 'rt_price_cache'].forEach(v=>{ if(v !== except && _get.call(localStorage, v) != null){ try{ _rem.call(localStorage, v); freed = true; }catch(e){} } });
    try{
      const a = JSON.parse(_get.call(localStorage, 'jrpg_audit') || '{}'); let ch = false;
      Object.keys(a).forEach(id=>{ const r = a[id]; if(r && !(r.ch && r.ch.length) && r.src){ delete r.src; ch = true; } });
      if(ch && except !== 'jrpg_audit'){ _set.call(localStorage, 'jrpg_audit', JSON.stringify(a)); freed = true; }
    }catch(e){}
    return freed;
  }
  window.__emergencyClean = ()=> emergencyClean('');
  Storage.prototype.setItem = function(k, v){
    try{ _set.call(this, k, v); }
    catch(e){
      if(this === localStorage && isQuota(e)){
        let ok = false;
        if(emergencyClean(k)){ try{ _set.call(this, k, v); ok = true; }catch(e2){} }
        if(!ok){ try{ window.dispatchEvent(new CustomEvent('storage-full', {detail: k})); }catch(x){} throw e; }
      } else throw e;
    }
    if(this === localStorage && !applying && syncable(k) && token()) stamp(k);
  };
  Storage.prototype.removeItem = function(k){ _rem.call(this, k); if(this === localStorage && !applying && syncable(k) && token()) stamp(k); };

  function localKeys(){
    const set = new Set(Object.keys(loadMeta()).filter(syncable));
    for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(syncable(k)) set.add(k); }
    try{ if(window.rtBig) rtBig.keys().forEach(k=>{ if(syncable(k)) set.add(k); }); }catch(e){}     // v211: le voci dell'archivio grande
    return Array.from(set);
  }
  function snapshot(){
    const meta = loadMeta(), out = {}; let changedMeta = false;
    localKeys().forEach(k=>{
      if(!meta[k]){ meta[k] = Date.now(); changedMeta = true; }
      out[k] = {v: ls.get(k), t: meta[k]};
    });
    if(changedMeta) saveMeta(meta);
    return out;
  }
  async function ghRaw(path, opts, extraHeaders){
    const r = await fetch(API + path, Object.assign({headers: Object.assign({'Authorization':'Bearer ' + token(), 'Accept':'application/vnd.github+json', 'Content-Type':'application/json'}, extraHeaders || {})}, opts || {}));
    if(!r.ok && r.status !== 304){ const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    return r;
  }
  async function gh(path, opts){ return (await ghRaw(path, opts)).json(); }
  async function findOrCreateGist(){
    let id = ls.get('jrpg_sync_gist');
    if(id) return id;
    for(let page = 1; page <= 5 && !id; page++){
      const list = await gh('/gists?per_page=100&page=' + page);
      const hit = list.find(g=> g.description === GIST_DESC);
      if(hit) id = hit.id;
      if(list.length < 100) break;
    }
    if(!id){
      const created = await gh('/gists', {method:'POST', body: JSON.stringify({description: GIST_DESC, public: false, files: {[FILE]: {content: JSON.stringify({keys: snapshot()})}}})});
      id = created.id;
    }
    ls.set('jrpg_sync_gist', id);
    return id;
  }
  // Ritorna true se ha modificato i dati locali (serve ricaricare la pagina)
  function mergeRemote(remoteKeys){
    const meta = loadMeta(); let changed = false;
    applying = true;
    try{
      Object.keys(remoteKeys || {}).forEach(k=>{
        if(!syncable(k)) return;
        const r = remoteKeys[k]; if(!r || typeof r.t !== 'number') return;
        if(UNION.includes(k)){
          // archivi di "elenchi" (giochi aggiunti, copertine, foto): si uniscono documento per documento.
          // Ogni documento ha una data di modifica (_u): vince il più recente, quindi due dispositivi che modificano giochi DIVERSI non si sovrascrivono
          // e nemmeno lo stesso gioco (vince l'ultima modifica). Le cancellazioni viaggiano come «lapidi» (_d) e si ripuliscono dopo 60 giorni.
          let lo = {}, ro = {};
          try{ lo = JSON.parse(ls.get(k) || '{}') || {}; }catch(e){}
          try{ ro = JSON.parse(r.v || '{}') || {}; }catch(e){}
          const remoteNewer = r.t > (meta[k] || 0), u = d=> (d && typeof d === 'object' && d._u) || 0, merged = Object.assign({}, lo), old = Date.now() - 60 * 864e5;
          Object.keys(ro).forEach(id=>{
            const a = lo[id], b = ro[id];
            if(a === undefined){ merged[id] = b; return; }
            const ua = u(a), ub = u(b);
            merged[id] = ub > ua ? b : ub < ua ? a : (remoteNewer ? b : a);
          });
          Object.keys(merged).forEach(id=>{ const d = merged[id]; if(d && typeof d === 'object' && d._d && u(d) < old) delete merged[id]; });
          const ms = JSON.stringify(merged);
          if(ms !== (ls.get(k) || '{}')){ ls.set(k, ms); changed = true; }
          meta[k] = (JSON.stringify(ro) !== ms) ? Date.now() : Math.max(meta[k] || 0, r.t);
          return;
        }
        if(r.t > (meta[k] || 0)){
          if(r.v === null || r.v === undefined) ls.rem(k); else ls.set(k, r.v);
          meta[k] = r.t;
          changed = true;
        }
      });
    } finally { applying = false; }
    saveMeta(meta);
    return changed;
  }
  async function syncNow(opts){
    opts = opts || {};
    if(!token() || busy) return false;
    busy = true; setStatus('Sincronizzo…');
    try{
      if(window.rtBig) await rtBig.ready;                                   // v211: prima di unire, l'archivio grande deve essere letto
      const id = await findOrCreateGist();
      // v219: richiesta condizionale (ETag): se il tuo archivio su GitHub non è cambiato dall'ultima volta e qui non c'è niente da inviare, GitHub risponde «304 nessuna novità»
      // senza corpo: niente da scaricare né da analizzare (prima ogni ritorno nell'app costava 0,2-0,3 s di calcolo per leggere tutto l'archivio).
      const et = ls.get('rt_sync_etag'), dirty = ls.get('rt_sync_dirty') === '1';
      const resp = await ghRaw('/gists/' + id, null, (et && !dirty && !opts.force) ? {'If-None-Match': et} : null);
      if(resp.status === 304){
        lastSync = Date.now();
        setStatus('☁️ Sincronizzato ✓ ' + new Date().toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}), true);
        return false;
      }
      const newEt = resp.headers.get('etag'); if(newEt) ls.set('rt_sync_etag', newEt);
      const g = await resp.json();
      let remote = {};
      try{
        const f = g.files && g.files[FILE];
        let txt = (f && f.content) || '{}';
        if(f && f.truncated && f.raw_url){ const rr = await fetch(f.raw_url); if(rr.ok) txt = await rr.text(); }
        remote = JSON.parse(txt).keys || {};
      }catch(e){}
      const changed = mergeRemote(remote);
      const snap = snapshot();
      const needPush = Object.keys(snap).some(k=> !remote[k] || snap[k].t > remote[k].t);
      if(needPush){
        const pr = await ghRaw('/gists/' + id, {method:'PATCH', body: JSON.stringify({files: {[FILE]: {content: JSON.stringify({keys: Object.assign({}, remote, snap)})}}})});
        const pe = pr.headers.get('etag'); if(pe) ls.set('rt_sync_etag', pe); else ls.rem('rt_sync_etag');
      }
      ls.rem('rt_sync_dirty'); lastSync = Date.now();
      try{ publishCatalog().catch(()=>{}); }catch(e){}
      setStatus('☁️ Sincronizzato ✓ ' + new Date().toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}), true);
      if(changed && !opts.noReload){ showToast('Dati aggiornati da un altro dispositivo: ricarico…', 2500); const fl = window.rtBig ? rtBig.flush() : Promise.resolve(); setTimeout(()=> fl.then(()=> location.reload(), ()=> location.reload()), 900); }
      return changed;
    }catch(e){
      const msg = e && e.status === 401 ? 'Token GitHub non valido o scaduto.' : e && e.status === 403 ? 'GitHub ha rifiutato il permesso: il token deve avere il permesso "gist".' : (e && e.status === 404) ? 'Archivio di sincronizzazione non trovato: premi Disattiva e poi Attiva di nuovo.' : 'Non riesco a contattare GitHub (rete assente o bloccata).';
      setStatus('❌ ' + msg, false);
      return false;
    }finally{ busy = false; }
  }
  // v222: la sincronizzazione completa (scarica e analizza tutto l'archivio: 160-260 ms di blocco sul telefono) non parte più mentre usi l'app.
  // Aspetta: almeno 15 s dall'ultima modifica, almeno 5 minuti dall'ultima sincronizzazione, e che tu non stia toccando lo schermo.
  // Le modifiche non inviate partono comunque appena lasci l'app (passi a un'altra app o chiudi): lì il blocco non si sente.
  const idleNow = ()=>{ try{ return typeof rtLastInput === 'undefined' || Date.now() - rtLastInput > 4000; }catch(e){ return true; } };
  function schedulePush(){
    clearTimeout(timer);
    const wait = Math.max(15000, 5 * 60e3 - (Date.now() - lastSync));
    const run = ()=>{ if(!idleNow() || document.visibilityState !== 'visible'){ timer = setTimeout(run, 4000); return; } syncNow({noReload: true}); };
    timer = setTimeout(run, wait);
  }
  const flushHidden = ()=>{ if(token() && ls.get('rt_sync_dirty') === '1' && !busy){ clearTimeout(timer); syncNow({noReload: true}); } };
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flushHidden(); });
  window.addEventListener('pagehide', flushHidden);

  // ---- Catalogo condiviso (dati NON personali): giochi aggiunti, correzioni, Update+ già fatto, note sul voto ----
  // Il dispositivo di Mario lo pubblica in un gist pubblico; ogni altro dispositivo lo scarica da solo all'avvio, così non parte da zero e non rifà gli Update+ già fatti.
  const CAT_KEYS = ['jrpg_db_customGames', 'jrpg_db_covers', 'jrpg_game_overrides', 'jrpg_fresh', 'jrpg_info_checked', 'jrpg_vote_diag', 'jrpg_vote_state', 'jrpg_guides', 'jrpg_tag_overrides'];
  const CAT_DESC = 'RaccoonTier-catalogo', CAT_FILE = 'catalogo.json';
  const GH_USER = /\.github\.io$/.test(location.hostname) ? location.hostname.split('.')[0] : 'kur0chanx';
  const isOwner = ()=> String(ls.get('jrpg_keys_user') || '').toLowerCase() === 'mario' && !!token();
  async function publishCatalog(force){
    if(!isOwner()) return false;
    const last = +ls.get('jrpg_catalog_pub') || 0; if(!force && Date.now() - last < 10 * 60e3) return false;
    const meta = loadMeta(), keys = {};
    CAT_KEYS.forEach(k=>{
      let v = ls.get(k); if(v == null) return;
      if(k === 'jrpg_db_covers'){ try{ const o = JSON.parse(v) || {}, out = {}; Object.keys(o).forEach(id=>{ const d = o[id]; if(d && typeof d === 'object' && typeof d.url === 'string' && !d._d) out[id] = d; }); v = JSON.stringify(out); }catch(e){ return; } }
      keys[k] = {v, t: meta[k] || Date.now()};
    });
    const content = JSON.stringify({keys, at: Date.now()});
    let id = ls.get('jrpg_catalog_gist');
    if(!id){
      for(let page = 1; page <= 5 && !id; page++){ const l = await gh('/gists?per_page=100&page=' + page); const f = l.find(g=> g.description === CAT_DESC); if(f) id = f.id; if(l.length < 100) break; }
    }
    const body = JSON.stringify({description: CAT_DESC, public: true, files: {[CAT_FILE]: {content}}});
    const r = id ? await gh('/gists/' + id, {method: 'PATCH', body}) : await gh('/gists', {method: 'POST', body});
    ls.set('jrpg_catalog_gist', r.id || id); ls.set('jrpg_catalog_pub', String(Date.now()));
    return true;
  }
  function mergeCatalog(remote){
    let changed = false; applying = true;
    try{
      CAT_KEYS.forEach(k=>{
        const r = remote && remote[k]; if(!r || typeof r.v !== 'string') return;
        let lo = {}, ro = {}; try{ lo = JSON.parse(ls.get(k) || '{}') || {}; }catch(e){} try{ ro = JSON.parse(r.v) || {}; }catch(e){ return; }
        const u = d=> (d && typeof d === 'object' && d._u) || 0; let merged;
        if(k === 'jrpg_db_customGames' || k === 'jrpg_db_covers'){ merged = Object.assign({}, lo); Object.keys(ro).forEach(id=>{ if(lo[id] === undefined || u(ro[id]) > u(lo[id])) merged[id] = ro[id]; }); }
        else merged = Object.assign({}, ro, lo);                            // il dispositivo tiene ciò che ha già fatto, e riceve il resto
        const ms = JSON.stringify(merged); if(ms !== (ls.get(k) || '{}')){ ls.set(k, ms); changed = true; }
      });
    } finally { applying = false; }
    return changed;
  }
  async function loadCatalog(opts){
    opts = opts || {};
    if(token() && !opts.force) return false;                                // chi ha la sincronizzazione attiva riceve già tutto da lì
    const last = +ls.get('jrpg_catalog_at') || 0; if(!opts.force && Date.now() - last < 6 * 3600e3) return false;
    const r = await fetch('https://api.github.com/users/' + GH_USER + '/gists?per_page=100'); if(!r.ok) throw new Error('HTTP ' + r.status);
    const f = (await r.json()).find(g=> g.description === CAT_DESC); const file = f && f.files && f.files[CAT_FILE]; if(!file) return false;
    const j = await (await fetch(file.raw_url)).json();
    if(window.rtBig) await rtBig.ready;
    const changed = mergeCatalog(j.keys || {}); ls.set('jrpg_catalog_at', String(Date.now()));
    if(changed && window.rtBig) await rtBig.flush();
    return changed;
  }
  window.publishCatalog = publishCatalog; window.loadCatalog = loadCatalog;
  // all'avvio: scarico il catalogo PRIMA che parta Update+; se cambia qualcosa ricarico una volta sola
  if(!token()){
    window.__catalogPending = true;
    const done = ()=>{ window.__catalogPending = false; };
    setTimeout(done, 15000);
    loadCatalog().then(ch=>{ done(); if(ch && !sessionStorage.getItem('rt_cat_reload')){ try{ sessionStorage.setItem('rt_cat_reload', '1'); }catch(e){} location.reload(); } }).catch(done);
  }

  window.syncNow = syncNow;
  window.__syncInternals = {mergeRemote, snapshot, syncable}; // per i test

  document.addEventListener('DOMContentLoaded', ()=>{
    const tk = document.getElementById('syncTokenInput');
    if(!tk) return;
    tk.value = token();
    document.getElementById('syncSaveBtn').addEventListener('click', async ()=>{
      const v = tk.value.trim();
      if(!v){ setStatus('Incolla prima il token.', false); return; }
      ls.set('jrpg_sync_token', v); ls.rem('jrpg_sync_gist');
      const ch = await syncNow({force: true});
      if(ch === false && statusEl && statusEl.textContent.indexOf('✓') === -1) return;
    });
    document.getElementById('syncNowBtn').addEventListener('click', ()=> syncNow({force: true}));
    document.getElementById('syncOffBtn').addEventListener('click', ()=>{
      ls.rem('jrpg_sync_token'); ls.rem('jrpg_sync_gist'); ls.rem('jrpg_sync_meta'); tk.value = '';
      setStatus('Sincronizzazione disattivata su questo dispositivo (i dati sul tuo GitHub restano).');
    });
    if(token()) setStatus('Sincronizzazione attiva.');
  });
  window.addEventListener('load', ()=>{ if(token()) setTimeout(function go(){ if(!idleNow()){ setTimeout(go, 3000); return; } syncNow(); }, 6000); });      // v222: all'avvio non subito: dopo 6 s e a schermo fermo
  // v219: tornando nell'app NON si sincronizza a ogni volta: al massimo ogni 3 minuti, e mai mentre stai toccando lo schermo
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState !== 'visible' || !token() || Date.now() - lastSync < 180e3) return;
    const go = ()=>{ try{ if(typeof rtLastInput !== 'undefined' && Date.now() - rtLastInput < 3000){ setTimeout(go, 2500); return; } }catch(e){} syncNow(); };
    setTimeout(go, 2500);
  });
})();
