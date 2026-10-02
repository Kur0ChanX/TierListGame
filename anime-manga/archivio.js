// ---- v211: ARCHIVIO GRANDE (IndexedDB) per i titoli aggiunti, le copertine e le foto ----
// La memoria normale del browser (localStorage) tiene circa 5 MB in tutto: con migliaia di titoli aggiunti si riempirebbe.
// Le tre voci più pesanti (atl_db_customGames, atl_db_covers, atl_db_blobs) ora stanno in IndexedDB (centinaia di MB).
// Il resto del programma NON cambia: continua a usare localStorage.getItem/setItem con gli stessi nomi; qui quelle tre voci
// vengono servite dalla memoria (copia in RAM) e salvate nell'archivio grande poco dopo (e subito quando l'app va in sottofondo).
// Va caricato PRIMA di sync.js e di app-schede.js (è l'unica eccezione alla regola «nuovi moduli in fondo»).
// Sicurezza: 1) finché l'archivio non è pronto si legge e si scrive come prima, nella memoria normale;
// 2) al primo avvio i dati vengono copiati, RILETTI e confrontati, e solo allora tolti dalla memoria normale;
// 3) se nella memoria normale ricompare qualcosa (una scheda vecchia del browser aperta, un ripristino) viene UNITO documento per documento
//    (vince la modifica più recente, come nella sincronizzazione), mai sovrascritto;
// 4) se IndexedDB non funziona (navigazione privata, browser vecchio) resta tutto nella memoria normale, come prima.
(function(){
  'use strict';
  const BIG = ['atl_db_customGames', 'atl_db_covers', 'atl_db_blobs',
    // v214: anche gli archivi d'appoggio più pesanti (si leggono quando servono, mai all'avvio: se non sono ancora pronti è solo un «non lo so ancora»).
    // Erano loro a riempire la memoria normale fino all'avviso del 70%.
    'atl_vote_diag', 'atl_audit', 'atl_audit_undo', 'atl_wd_cache2', 'atl_wd_labels2', 'atl_brain_hist', 'atl_vibes_results', 'atl_saga_scan',
    'art_ost_ia2', 'art_ost_live', 'art_ost_miss', 'art_ost_ia3', 'art_ost_live2', 'art_ost_miss2', 'art_shots_rawg4', 'art_en_name', 'art_idee_cache', 'art_tint_cache', 'art_oc_cache', 'art_price_cache', 'art_debuglog'];
  const isBig = k=> BIG.indexOf(k) >= 0;
  let LSX = null; try{ LSX = window.localStorage; }catch(e){}
  const P = window.Storage && Storage.prototype;
  if(!LSX || !P || !window.indexedDB){ window.rtBig = {ready: Promise.resolve(false), ok: false, keys: ()=> [], isBig, flush: ()=> Promise.resolve(), info: ()=> ({ok: false, bytes: 0})}; return; }
  const _g = P.getItem, _s = P.setItem, _r = P.removeItem;
  const MEM = new Map();
  let ok = false, db = null, tmr = 0;
  const dirty = new Set();
  const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('art_big') : null;      // più schede aperte insieme: si tengono allineate
  const log = m=>{ try{ if(window.rtDebugLog) rtDebugLog('archivio', m); }catch(e){} };

  P.getItem = function(k){ if(ok && this === LSX && isBig(k)) return MEM.has(k) ? MEM.get(k) : null; return _g.apply(this, arguments); };
  P.setItem = function(k, v){
    if(ok && this === LSX && isBig(k)){ const s = String(v); MEM.set(k, s); touch(k); return; }
    return _s.apply(this, arguments);
  };
  P.removeItem = function(k){
    if(ok && this === LSX && isBig(k)){ MEM.set(k, null); touch(k); return; }
    return _r.apply(this, arguments);
  };
  function touch(k){
    dirty.add(k);
    // v216: alle altre schede mando solo il NOME della voce (prima copiavo ogni volta tutto il contenuto, anche megabyte): la rileggono dall'archivio
    if(bc){ clearTimeout(touch._bc); touch._bc = setTimeout(()=>{ try{ bc.postMessage({k}); }catch(e){} }, 400); }
    clearTimeout(tmr); tmr = setTimeout(flush, 150);
  }
  function tx(mode){ return db.transaction('kv', mode).objectStore('kv'); }
  function flush(){
    clearTimeout(tmr);
    if(!ok || !db || !dirty.size) return Promise.resolve();
    const ks = Array.from(dirty); dirty.clear();
    return new Promise(res=>{
      try{
        const t = db.transaction('kv', 'readwrite'), st = t.objectStore('kv');
        ks.forEach(k=>{ const v = MEM.get(k); if(v == null) st.delete(k); else st.put(v, k); });
        t.oncomplete = ()=> res(true);
        t.onerror = t.onabort = ()=>{ ks.forEach(k=> dirty.add(k)); log('scrittura non riuscita: ' + (t.error && t.error.name)); res(false); };
      }catch(e){ ks.forEach(k=> dirty.add(k)); res(false); }
    });
  }
  // unione documento per documento (stessa regola della sincronizzazione: vince il _u più recente; a parità vince «a»)
  function union(a, b){
    let A = null, B = null;
    try{ A = JSON.parse(a); }catch(e){} try{ B = JSON.parse(b); }catch(e){}
    if(!A || typeof A !== 'object') return b; if(!B || typeof B !== 'object') return a;
    if(Array.isArray(A) || Array.isArray(B)) return b;                      // elenchi semplici: vince l'ultima versione scritta
    const u = d=> (d && typeof d === 'object' && d._u) || 0, out = Object.assign({}, A);
    Object.keys(B).forEach(id=>{ if(out[id] === undefined || u(B[id]) > u(out[id])) out[id] = B[id]; });
    return JSON.stringify(out);
  }
  const ready = new Promise(resolve=>{
    let done = false;
    const finish = v=>{ if(done) return; done = true; resolve(v); };
    setTimeout(()=>{ if(!done){ log('IndexedDB non risponde: resto sulla memoria normale'); finish(false); } }, 4000);
    let rq;
    try{ rq = indexedDB.open('raccoon-anime', 1); }catch(e){ finish(false); return; }
    rq.onupgradeneeded = ()=>{ try{ rq.result.createObjectStore('kv'); }catch(e){} };
    rq.onerror = ()=> finish(false);
    rq.onblocked = ()=> log('archivio bloccato da un\'altra scheda');
    rq.onsuccess = ()=>{
      if(done){ try{ rq.result.close(); }catch(e){} return; }
      db = rq.result;
      db.onversionchange = ()=>{ try{ db.close(); }catch(e){} };
      const got = {};
      let t;
      try{ t = db.transaction('kv', 'readonly'); }catch(e){ finish(false); return; }
      const st = t.objectStore('kv');
      BIG.forEach(k=>{ const r = st.get(k); r.onsuccess = ()=>{ got[k] = r.result == null ? null : String(r.result); }; });
      t.onerror = t.onabort = ()=> finish(false);
      t.oncomplete = ()=>{
        if(done) return;
        // da qui in poi le tre voci vivono nell'archivio grande. Tutto in un solo passo, senza attese: nessuna scrittura può infilarsi in mezzo
        const fromLS = {};
        BIG.forEach(k=>{
          const l = _g.call(LSX, k), d = got[k];
          let v = d;
          if(l != null){ fromLS[k] = l; v = d == null ? l : union(d, l); if(v !== d) dirty.add(k); }
          MEM.set(k, v == null ? null : v);
        });
        ok = true;
        finish(true);
        // copia, rileggo, confronto e solo allora libero la memoria normale
        const ks = Object.keys(fromLS);
        if(!ks.length) return;
        flush().then(okW=>{
          if(!okW) return;
          const t2 = db.transaction('kv', 'readonly'), s2 = t2.objectStore('kv'), back = {};
          ks.forEach(k=>{ const r = s2.get(k); r.onsuccess = ()=>{ back[k] = r.result; }; });
          t2.oncomplete = ()=>{
            ks.forEach(k=>{
              if(back[k] !== MEM.get(k)) return;                                 // non coincide: lascio tutto com'è e riprovo al prossimo avvio
              if(_g.call(LSX, k) !== fromLS[k]) return;                          // nel frattempo qualcuno l'ha cambiata: la unirò al prossimo avvio
              try{ _r.call(LSX, k); }catch(e){}
            });
            log('spostati nell\'archivio grande: ' + ks.join(', '));
          };
        });
      };
    };
  });
  if(bc) bc.onmessage = e=>{
    const m = e.data || {}; if(!ok || !db || !isBig(m.k) || dirty.has(m.k)) return;
    setTimeout(()=>{ try{ const r = tx('readonly').get(m.k); r.onsuccess = ()=>{ if(!dirty.has(m.k)) MEM.set(m.k, r.result == null ? null : String(r.result)); }; }catch(x){} }, 500);      // l'altra scheda ha appena scritto: rileggo dall'archivio
  };
  const bye = ()=>{ if(dirty.size) flush(); };
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') bye(); });
  addEventListener('pagehide', bye);
  try{ if(navigator.storage && navigator.storage.persist) ready.then(v=>{ if(v) navigator.storage.persisted().then(p=>{ if(!p) navigator.storage.persist().catch(()=>{}); }).catch(()=>{}); }); }catch(e){}
  window.rtBig = {
    ready, isBig, flush,
    get ok(){ return ok; },
    keys: ()=> BIG.filter(k=> LSX.getItem(k) != null),
    info: ()=>{ let b = 0; BIG.forEach(k=>{ const v = LSX.getItem(k); if(v) b += k.length + v.length; }); return {ok, bytes: b}; }
  };
})();

// ---- v211: pezzi dei file notturni (colonne sonore e schermate): l'app scarica solo il pezzo del titolo che apri ----
// dati/notte-F-K.js con K = id % 64 (tools/shard-night.js). I pezzi arrivati riempiono gli stessi oggetti di prima (OST, GAME_SHOTS),
// così music.js e cinema.js leggono come sempre: basta chiamare prima rtNight.ensure('ost'|'shots', id).
(function(){
  'use strict';
  const NB = 64, GL = {ost: 'OST', shots: 'GAME_SHOTS'};
  const have = new Set(), wait = {}, tries = {};
  const build = ()=> (document.querySelector('meta[name="build"]') || {}).content || '0';
  function arrived(){
    const q = window.rtNotte || []; window.rtNotte = [];
    q.forEach(p=>{
      if(!p || !GL[p.f]) return;
      const name = GL[p.f], cur = window[name] && window[name].games ? window[name] : (window[name] = {games: {}});
      Object.keys(p).forEach(x=>{ if(x !== 'g' && x !== 'f' && x !== 'k' && cur[x] === undefined) cur[x] = p[x]; });
      Object.assign(cur.games, p.g || {});
      const key = p.f + p.k; have.add(key); (wait[key] || []).forEach(r=> r()); delete wait[key];
    });
  }
  window.rtNotteArrived = arrived;
  function load(f, k){
    const key = f + k;
    if(have.has(key)) return Promise.resolve();
    return new Promise(res=>{
      const first = !wait[key]; (wait[key] = wait[key] || []).push(res);
      if(!first) return;
      const s = document.createElement('script'); s.async = true; s.src = 'dati/notte-' + f + '-' + k + '.js?b=' + build();
      s.onerror = ()=>{ s.remove(); const n = tries[key] = (tries[key] || 0) + 1; const l = wait[key] || []; delete wait[key]; l.forEach(r=> r()); if(n >= 3) have.add(key); };    // manca: vado avanti senza (dopo 3 tentativi non riprovo più)
      s.onload = ()=> s.remove();
      document.head.appendChild(s);
    });
  }
  window.rtNight = {
    ensure(f, id){ if(!GL[f] || id == null || isNaN(+id)) return Promise.resolve(); return Promise.race([load(f, (+id) % NB), new Promise(r=> setTimeout(r, 6000))]); },
    has: (f, id)=> have.has(f + ((+id) % NB)),
    NB
  };
  // al tocco su un titolo preparo già il suo pezzo di schermate e di musiche (prima ancora che la scheda si apra)
  document.addEventListener('pointerdown', e=>{
    const el = e.target && e.target.closest && e.target.closest('[data-gid], [data-id]'); if(!el) return;
    const id = +(el.dataset.gid || el.dataset.id); if(!id) return;
    rtNight.ensure('shots', id); rtNight.ensure('ost', id);
  }, {capture: true, passive: true});
})();
