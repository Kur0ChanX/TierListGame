// ---- Extra 2 (v128): backup e spazio del browser, joypad, livello del procione, cronologia, carta profilo, prezzi e backlog ----
// Caricato dopo extras.js: usa le sue utilità (window.XUI) e aggiunge voci al menu ✨ (window.XMENU).
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS, byId, hoursOf, TIER_COL} = U;
  const menu = (html, run)=>{ (window.XMENU = window.XMENU || []).push({html, run}); };
  const gi = n=> (typeof giIcon === 'function') ? giIcon(n) : '';
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));
  const eur = n=> Number(n).toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  const fmtDate = t=>{ try{ return new Date(t).toLocaleDateString('it-IT', {day: 'numeric', month: 'long', year: 'numeric'}); }catch(e){ return ''; } };

  // =====================================================================
  // 1) BACKUP + SPAZIO DEL BROWSER (per non perdere nulla)
  // =====================================================================
  const SECRET = ['jrpg_gemini_key', 'jrpg_rawg_key', 'jrpg_opencritic_key', 'jrpg_sync_token', 'jrpg_sync_gist', 'jrpg_sync_meta', 'jrpg_triad_acct', 'jrpg_triad_server', 'jrpg_triad_photos'];      // mai dentro un backup: sono chiavi personali
  function collect(){ const out = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && k.indexOf('jrpg_') === 0 && !SECRET.includes(k)) out[k] = localStorage.getItem(k); } return out; }
  function backupObj(){ return {app: 'raccoon-tier', v: 1, created: new Date().toISOString(), build: (document.querySelector('meta[name="build"]') || {}).content || '', keys: collect()}; }
  async function saveBackup(){
    const name = 'raccoon-tier-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    const file = new File([JSON.stringify(backupObj())], name, {type: 'application/json'});
    try{ if(navigator.canShare && navigator.canShare({files: [file]})){ await navigator.share({files: [file], title: 'Backup Raccoon Tier'}); LS.set('rt_last_backup', Date.now()); return 'condiviso'; } }
    catch(e){ if(e && e.name === 'AbortError') return null; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    LS.set('rt_last_backup', Date.now()); return 'scaricato';
  }
  function restoreFrom(file){
    const rd = new FileReader();
    rd.onload = ()=>{
      let o = null; try{ o = JSON.parse(String(rd.result)); }catch(e){}
      if(!o || o.app !== 'raccoon-tier' || !o.keys || typeof o.keys !== 'object'){ toast('Questo file non è un backup di Raccoon Tier', 3500); return; }
      const keys = Object.keys(o.keys).filter(k=> k.indexOf('jrpg_') === 0 && !SECRET.includes(k));
      if(!confirm('Ripristinare ' + keys.length + ' dati dal backup del ' + fmtDate(o.created) + '?\nI dati con lo stesso nome su questo dispositivo verranno sostituiti (le chiavi personali restano). Se hai la sincronizzazione attiva, il ripristino verrà propagato anche agli altri dispositivi.')) return;
      let fail = 0; keys.forEach(k=>{ try{ localStorage.setItem(k, o.keys[k]); }catch(e){ fail++; } });
      toast(fail ? 'Ripristino incompleto: spazio del browser insufficiente' : '✅ Backup ripristinato: ricarico…', 2500);
      if(!fail) setTimeout(()=> location.reload(), 900);
    };
    rd.readAsText(file);
  }
  function storageStats(){
    let total = 0; const per = [];
    for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i), v = localStorage.getItem(k) || ''; per.push([k, k.length + v.length]); total += k.length + v.length; }
    per.sort((a, b)=> b[1] - a[1]);
    return {total, per: per.slice(0, 6), limit: 5 * 1024 * 1024};
  }
  const kb = n=> n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(n / 1024) + ' KB';
  async function persisted(){ try{ return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; }catch(e){ return false; } }
  async function openBackup(){
    const st = storageStats(), pct = Math.min(100, Math.round(st.total / st.limit * 100)), last = LS.get('rt_last_backup', 0), per = await persisted();
    const body = sheet('xBackup', gi('gem') + ' Backup e spazio', `
      <div class="lp-sub">Il backup salva preferiti, stati, giochi aggiunti, tier personale, wishlist e correzioni approvate in un solo file (senza chiavi personali). ${last ? 'Ultimo backup: <b>' + esc(fmtDate(last)) + '</b>.' : '<b>Non hai ancora fatto un backup.</b>'}</div>
      <div class="lp-tools"><button class="btn primary" id="bkSave">💾 Salva backup</button><button class="btn" id="bkLoad">📂 Ripristina da file</button><input type="file" id="bkFile" accept="application/json,.json" hidden></div>
      <div class="lp-sub" style="margin-top:14px"><b>Spazio del browser</b>: ${kb(st.total)} usati su circa ${kb(st.limit)} (${pct}%)</div>
      <div class="bk-bar"><i style="width:${pct}%" class="${pct > 85 ? 'bad' : pct > 65 ? 'mid' : ''}"></i></div>
      <div class="bk-keys">${st.per.map(p=> `<div><span>${esc(p[0])}</span><b>${kb(p[1])}</b></div>`).join('')}</div>
      <div class="lp-tools"><button class="btn" id="bkClean">🧹 Libera spazio (registro e cache)</button><button class="btn" id="bkPersist">🛡️ Proteggi i dati: ${per ? 'attivo ✅' : 'attiva'}</button></div>
      <div class="lp-sub">«Proteggi» chiede al browser di non cancellare i dati dell'app quando il telefono ha poco spazio. Con la sincronizzazione (⚙️) i dati stanno anche sul tuo GitHub.</div>`);
    body.querySelector('#bkSave').addEventListener('click', async ()=>{ const r = await saveBackup(); if(r){ toast('✅ Backup ' + r, 2500); openBackup(); } });
    body.querySelector('#bkLoad').addEventListener('click', ()=> body.querySelector('#bkFile').click());
    body.querySelector('#bkFile').addEventListener('change', e=>{ if(e.target.files[0]) restoreFrom(e.target.files[0]); });
    body.querySelector('#bkClean').addEventListener('click', ()=>{ const before = storageStats().total; try{ window.__emergencyClean && window.__emergencyClean(); }catch(e){} try{ window.DebugLog && DebugLog.clear(); }catch(e){} const freed = before - storageStats().total; toast('🧹 Liberati ' + kb(Math.max(0, freed)), 2500); openBackup(); });
    body.querySelector('#bkPersist').addEventListener('click', async ()=>{ try{ const ok = navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; toast(ok ? '🛡️ Dati protetti dal browser' : 'Il browser non ha concesso la protezione (succede se l\'app è usata poco: installala dalla home)', 4000); }catch(e){} openBackup(); });
  }
  menu(gi('gem') + ' Backup e spazio del browser', openBackup);
  window.addEventListener('storage-full', ()=>{ const t = Date.now(); if(t - (window.__sfAt || 0) < 20000) return; window.__sfAt = t; toast('⚠️ Spazio del browser esaurito: una modifica non è stata salvata. Apri ✨ → Backup e libera spazio.', 7000); });
  // promemoria mensile + richiesta di protezione dei dati (una volta, in silenzio)
  setTimeout(()=>{
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
    const last = LS.get('rt_last_backup', 0), nag = LS.get('rt_backup_nag', 0), hasData = (typeof FAVS !== 'undefined' && FAVS.size > 0) || (typeof STATUSES !== 'undefined' && Object.keys(STATUSES).length > 0) || GAMES.some(g=> g.custom);
    if(hasData && Date.now() - last > 30 * 864e5 && Date.now() - nag > 7 * 864e5){ LS.set('rt_backup_nag', Date.now()); toast('💾 Non fai un backup da più di 30 giorni: ✨ → Backup e spazio', 7000); }
    const st = storageStats(); if(st.total / st.limit > 0.8) toast('⚠️ Lo spazio del browser è quasi pieno (' + Math.round(st.total / st.limit * 100) + '%): ✨ → Backup e spazio', 7000);
  }, 7000);

  // =====================================================================
  // 2) LIVELLO DEL PROCIONE (esperienza)
  // =====================================================================
  const LEVELS = [[1, 'Cucciolo di procione'], [3, 'Frugatore'], [5, 'Cercatore di perle'], [8, 'Esperto di bidoni'], [12, 'Maestro Frugu Frugu'], [16, 'Leggenda del cassonetto'], [20, 'Re dei Procioni']];
  function xpInfo(){
    const S = (typeof STATUSES !== 'undefined') ? STATUSES : {};
    const played = GAMES.filter(g=> S[g.id] === 'played'), playing = GAMES.filter(g=> S[g.id] === 'playing');
    const top = played.filter(g=> g.tier === 'S+' || g.tier === 'S').length, custom = GAMES.filter(g=> g.custom).length;
    const badges = (LS.get('jrpg_badges', []) || []).length, audited = Math.min(500, Object.keys(LS.get('jrpg_audit', {}) || {}).length);
    const parts = [['Giochi finiti', played.length * 30], ['Giochi in corso', playing.length * 10], ['Capolavori giocati (S/S+)', top * 10], ['Preferiti', (typeof FAVS !== 'undefined' ? FAVS.size : 0) * 5], ['Giochi aggiunti da te', custom * 15], ['Traguardi', badges * 100], ['Schede controllate', audited]];
    const xp = parts.reduce((a, p)=> a + p[1], 0), level = Math.floor(Math.sqrt(xp / 40)) + 1, cur = 40 * (level - 1) * (level - 1), next = 40 * level * level;
    const title = LEVELS.slice().reverse().find(l=> level >= l[0])[1];
    return {xp, level, title, pct: Math.round((xp - cur) / (next - cur) * 100), toNext: next - xp, parts, played, playing};
  }
  window.xpInfo = xpInfo;
  function openLevel(){
    const x = xpInfo();
    const body = sheet('xLevel', gi('star') + ' Livello del procione', `
      <div class="lv-card"><div class="lv-num">${x.level}</div><div><b>${esc(x.title)}</b><br><small>${x.xp} punti esperienza · ${x.toNext} al livello ${x.level + 1}</small></div></div>
      <div class="bk-bar"><i style="width:${x.pct}%"></i></div>
      <div class="bk-keys">${x.parts.map(p=> `<div><span>${esc(p[0])}</span><b>+${p[1]}</b></div>`).join('')}</div>
      <div class="lp-sub">Si guadagna esperienza giocando, aggiungendo giochi, segnando i preferiti, controllando le schede e sbloccando i traguardi.</div>
      <div class="lp-tools"><button class="btn primary" id="lvCard">🖼️ La mia carta profilo</button><button class="btn" id="lvTl">📜 La mia cronologia</button></div>`);
    body.querySelector('#lvCard').addEventListener('click', ()=>{ document.getElementById('xLevel').classList.remove('show'); openCard(); });
    body.querySelector('#lvTl').addEventListener('click', ()=>{ document.getElementById('xLevel').classList.remove('show'); openTimeline(); });
  }
  menu(gi('star') + ' Livello del procione', openLevel);

  // =====================================================================
  // 3) CRONOLOGIA DA GIOCATORE
  // =====================================================================
  function openTimeline(){
    const S = (typeof STATUSES !== 'undefined') ? STATUSES : {};
    const list = GAMES.filter(g=> (S[g.id] === 'played' || S[g.id] === 'playing') && g.ysort).sort((a, b)=> a.ysort - b.ysort || b.score - a.score);
    if(!list.length){ sheet('xTimeline', gi('table') + ' La mia cronologia', '<div class="lp-sub">Segna qualche gioco come «Giocato» o «In corso» dalla sua scheda e qui comparirà la tua storia da giocatore, anno per anno.</div>'); return; }
    const plat = {}; list.forEach(g=>{ const p = String(g.plat || '').split('/')[0].trim(); if(p) plat[p] = (plat[p] || 0) + 1; });
    const topPlat = Object.entries(plat).sort((a, b)=> b[1] - a[1]).slice(0, 3).map(p=> p[0] + ' (' + p[1] + ')').join(', ');
    const hours = list.reduce((a, g)=> a + (hoursOf(g) || 0), 0);
    const byDec = {}; list.forEach(g=>{ const d = Math.floor(g.ysort / 10) * 10; (byDec[d] = byDec[d] || {})[g.ysort] = (byDec[d][g.ysort] || []).concat(g); });
    const html = Object.keys(byDec).sort().map(d=> {
      const n = Object.values(byDec[d]).reduce((a, x)=> a + x.length, 0);
      return `<div class="tl-dec"><h4>Anni ${d} <small>${n} ${n === 1 ? 'gioco' : 'giochi'}</small></h4>${Object.keys(byDec[d]).sort().map(y=> `<div class="tl-row"><b>${y}</b><div>${byDec[d][y].map(g=> `<button class="tl-chip" data-open="${g.id}"><span class="tl-t" style="background:${TIER_COL[g.tier] || '#7c5cff'}">${esc(g.tier)}</span>${esc(g.name)}</button>`).join('')}</div></div>`).join('')}</div>`;
    }).join('');
    const body = sheet('xTimeline', gi('table') + ' La mia cronologia', `<div class="lp-sub"><b>${list.length}</b> giochi giocati dal <b>${list[0].ysort}</b> al <b>${list[list.length - 1].ysort}</b>${hours ? ' · circa <b>' + Math.round(hours) + ' ore</b>' : ''}${topPlat ? ' · console preferite: ' + esc(topPlat) : ''}</div><div class="tl">${html}</div><div class="lp-tools"><button class="btn primary" id="tlCard">🖼️ Crea la carta profilo</button></div>`);
    body.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.open); if(g){ document.getElementById('xTimeline').classList.remove('show'); openModal(g); } }));
    body.querySelector('#tlCard').addEventListener('click', ()=>{ document.getElementById('xTimeline').classList.remove('show'); openCard(); });
  }
  menu(gi('table') + ' La mia cronologia da giocatore', openTimeline);

  // =====================================================================
  // 4) CARTA PROFILO (immagine da condividere)
  // =====================================================================
  function fitText(x, t, maxW){ if(x.measureText(t).width <= maxW) return t; let s = t; while(s.length > 3 && x.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
  function rr(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  async function makeCard(){
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1b1147'); bg.addColorStop(.55, '#3b1d8f'); bg.addColorStop(1, '#0e3a5f'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    [['#ff6ec7', 200, 180, 260], ['#38bdf8', 900, 420, 300], ['#ffd23c', 760, 1180, 240]].forEach(([col, cx, cy, r])=>{ const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
    const X = xpInfo(), S = (typeof STATUSES !== 'undefined') ? STATUSES : {};
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    x.font = '800 30px system-ui, sans-serif'; x.globalAlpha = .75; x.fillText('RACCOON TIER', 70, 92); x.globalAlpha = 1;
    x.font = '900 68px system-ui, sans-serif'; x.fillText('La mia collezione', 70, 170);
    // livello
    rr(x, 70, 205, 940, 96, 26); x.fillStyle = 'rgba(255,255,255,.12)'; x.fill();
    x.fillStyle = '#ffd23c'; x.font = '900 56px system-ui, sans-serif'; x.fillText('Lv ' + X.level, 96, 272);
    x.fillStyle = '#fff'; x.font = '700 34px system-ui, sans-serif'; x.fillText(fitText(x, X.title, 640), 260, 246);
    rr(x, 260, 262, 720, 16, 8); x.fillStyle = 'rgba(255,255,255,.2)'; x.fill(); rr(x, 260, 262, Math.max(16, 720 * X.pct / 100), 16, 8); x.fillStyle = '#ffd23c'; x.fill();
    // top 10
    const favs = GAMES.filter(g=> FAVS.has(g.id)).sort((a, b)=> b.score - a.score), seen = new Set(favs.map(g=> g.id));
    const top = favs.concat(GAMES.filter(g=> S[g.id] === 'played' && !seen.has(g.id)).sort((a, b)=> b.score - a.score)).slice(0, 10);
    x.fillStyle = '#fff'; x.font = '800 40px system-ui, sans-serif'; x.fillText(favs.length ? '❤️ I miei Top 10' : '🏆 I miei migliori giochi', 70, 372);
    top.forEach((g, i)=>{
      const y = 400 + i * 62;
      rr(x, 70, y, 940, 52, 16); x.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.12)'; x.fill();
      x.fillStyle = '#ffd23c'; x.font = '900 30px system-ui, sans-serif'; x.fillText(String(i + 1), 92, y + 37);
      x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif'; x.fillText(fitText(x, g.name, 660), 150, y + 37);
      const col = TIER_COL[g.tier] || '#7c5cff'; rr(x, 850, y + 8, 64, 36, 12); x.fillStyle = col; x.fill();
      x.fillStyle = '#fff'; x.font = '900 24px system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(g.tier, 882, y + 34); x.textAlign = 'left';
      x.font = '700 26px system-ui, sans-serif'; x.globalAlpha = .85; x.fillText(String(g.score), 930, y + 35); x.globalAlpha = 1;
    });
    if(!top.length){ x.font = '600 32px system-ui, sans-serif'; x.globalAlpha = .8; x.fillText('Aggiungi qualche gioco ai preferiti per riempire la carta.', 70, 440); x.globalAlpha = 1; }
    // generi preferiti
    const tags = {}; GAMES.filter(g=> FAVS.has(g.id) || S[g.id] === 'played').forEach(g=> (g.tags || []).forEach(t=>{ tags[t] = (tags[t] || 0) + 1; }));
    const topT = Object.entries(tags).sort((a, b)=> b[1] - a[1]).slice(0, 5), mx = topT.length ? topT[0][1] : 1;
    x.fillStyle = '#fff'; x.font = '800 36px system-ui, sans-serif'; x.fillText('I miei generi', 70, 1050);
    topT.forEach(([t, n], i)=>{
      const y = 1075 + i * 42, lab = (typeof TAG_INFO !== 'undefined' && TAG_INFO[t]) ? TAG_INFO[t].label : t;
      x.font = '600 24px system-ui, sans-serif'; x.fillStyle = '#fff'; x.fillText(fitText(x, lab, 300), 70, y + 26);
      rr(x, 390, y + 6, 560, 22, 11); x.fillStyle = 'rgba(255,255,255,.15)'; x.fill(); rr(x, 390, y + 6, Math.max(22, 560 * n / mx), 22, 11); x.fillStyle = '#7c5cff'; x.fill();
    });
    x.fillStyle = '#fff'; x.font = '700 28px system-ui, sans-serif'; x.globalAlpha = .9;
    x.fillText(X.played.length + ' giocati · ' + FAVS.size + ' preferiti · ' + GAMES.length + ' giochi nel database', 70, 1300); x.globalAlpha = 1;
    x.font = '600 22px system-ui, sans-serif'; x.globalAlpha = .6; x.textAlign = 'right'; x.fillText('kur0chanx.github.io/TierListGame', 1010, 1300); x.textAlign = 'left'; x.globalAlpha = 1;
    return new Promise(res=> c.toBlob(res, 'image/png'));
  }
  async function openCard(){
    const body = sheet('xCard', gi('profile') + ' La mia carta profilo', '<div class="lp-sub">Sto disegnando la carta…</div>');
    try{
      const blob = await makeCard(), url = URL.createObjectURL(blob);
      body.innerHTML = `<img class="x-cardimg" src="${url}" alt="La mia carta profilo"><div class="lp-tools"><button class="btn primary" id="cdShare">📤 Condividi</button><button class="btn" id="cdSave">⬇️ Salva immagine</button></div>`;
      const file = new File([blob], 'raccoon-tier-carta.png', {type: 'image/png'});
      body.querySelector('#cdShare').addEventListener('click', async ()=>{ try{ if(navigator.canShare && navigator.canShare({files: [file]})) await navigator.share({files: [file], title: 'La mia collezione — Raccoon Tier'}); else toast('Condivisione non disponibile: usa «Salva immagine»', 3000); }catch(e){} });
      body.querySelector('#cdSave').addEventListener('click', ()=>{ const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); });
    }catch(e){ body.innerHTML = '<div class="lp-sub">Non sono riuscito a creare la carta: riprova.</div>'; }
  }
  menu(gi('profile') + ' La mia carta profilo (immagine)', openCard);

  // =====================================================================
  // 5) PREZZI: avvisi in wishlist e costo del backlog
  // =====================================================================
  const PC = 'rt_price_cache';
  async function priceFor(g){
    const f = window.SearchHub && SearchHub.factsFor(g);
    if(f && f.s && f.s.p) return {f: f.s.p.f, i: f.s.p.i, d: f.s.p.d, cur: 'EUR', src: 'Steam', at: Date.now()};
    const cache = LS.get(PC, {}), c = cache[g.name];
    if(c && Date.now() - c.at < 864e5) return c.none ? null : c;
    let x = null; try{ x = await SearchHub.cheapFacts(g.name); }catch(e){ return null; }
    const cache2 = LS.get(PC, {});
    if(!x || !x.p){ cache2[g.name] = {none: 1, at: Date.now()}; LS.set(PC, cache2); return null; }
    const o = {f: x.p.f, i: x.p.i, d: x.p.d, cur: 'USD', src: 'CheapShark', at: Date.now()}; cache2[g.name] = o; LS.set(PC, cache2); return o;
  }
  window.priceFor = priceFor;
  async function checkWishPrices(){
    const ids = Object.keys(LS.get('jrpg_wishlist', {}) || {}).slice(0, 8);
    for(const id of ids){
      const g = byId(id); if(!g) continue;
      let p = null; try{ p = await priceFor(g); }catch(e){}
      if(!p) continue;
      const w = LS.get('jrpg_wishlist', {}), it = w[id]; if(!it) continue;
      const prev = it.price || {}, low = Math.min(p.f, prev.low != null ? prev.low : Infinity);
      const drop = p.d >= 30 && prev.alerted !== p.f, newLow = prev.low != null && p.f > 0 && p.f < prev.low * 0.9;
      it.price = Object.assign({}, p, {low, alerted: (drop || newLow) ? p.f : prev.alerted});
      LS.set('jrpg_wishlist', w);
      if(p.f > 0 && (drop || newLow)){
        const msg = `💶 ${it.name} è in offerta: ${p.cur === 'USD' ? '$' + p.f.toFixed(2) : eur(p.f)}${p.d > 0 ? ' (−' + p.d + '%)' : ''}`;
        toast(msg, 7000);
        try{ if('Notification' in window && Notification.permission === 'granted') new Notification('Raccoon Tier', {body: msg, icon: 'icons/icon-192.png'}); }catch(e){}
      }
      await sleep(1000);
    }
  }
  setTimeout(()=>{ checkWishPrices().catch(()=>{}); }, 12000);

  // scheda «Il tuo backlog» in Statistiche
  async function addBacklogCard(){
    const panel = document.getElementById('statsPanel'); if(!panel) return;
    const old = document.getElementById('bkCard'); if(old) old.remove();
    const S = (typeof STATUSES !== 'undefined') ? STATUSES : {}, list = GAMES.filter(g=> S[g.id] === 'backlog' || S[g.id] === 'playing');
    const card = document.createElement('div'); card.id = 'bkCard'; card.className = 'bk-card';
    if(!list.length){ card.innerHTML = `<h3>${gi('table')} Il tuo backlog</h3><div class="lp-sub">Non hai giochi «Da giocare» o «In corso»: aggiungine dalla schermata Scopri.</div>`; panel.appendChild(card); return; }
    const hrs = list.reduce((a, g)=> a + (hoursOf(g) || 0), 0), known = list.filter(g=> hoursOf(g)).length;
    const render = (cost, priced)=>{
      const wk = LS.get('rt_hpw', 8);
      card.innerHTML = `<h3>${gi('table')} Il tuo backlog</h3>
        <div class="bk-grid"><div><b>${list.length}</b><small>giochi</small></div><div><b>${Math.round(hrs)}</b><small>ore (${known} su ${list.length} con durata nota)</small></div><div><b>${cost == null ? '…' : eur(cost)}</b><small>${priced == null ? 'calcolo prezzi…' : 'prezzo noto per ' + priced + ' su ' + list.length}</small></div></div>
        <label class="bk-hpw">Ore che riesci a giocare a settimana: <b id="hpwV">${wk}</b><input type="range" id="hpw" min="1" max="40" value="${wk}"></label>
        <div class="lp-sub" id="hpwOut">${hrs ? 'Per finirlo servono circa <b>' + Math.ceil(hrs / wk) + ' settimane</b> (' + (Math.ceil(hrs / wk) / 4.345).toFixed(1).replace('.', ',') + ' mesi).' : 'Servono le durate per stimare i tempi: usa «Aggiorna info» nelle schede.'}</div>`;
      const r = card.querySelector('#hpw'); r.addEventListener('input', ()=>{ LS.set('rt_hpw', +r.value); card.querySelector('#hpwV').textContent = r.value; card.querySelector('#hpwOut').innerHTML = hrs ? 'Per finirlo servono circa <b>' + Math.ceil(hrs / +r.value) + ' settimane</b> (' + (Math.ceil(hrs / +r.value) / 4.345).toFixed(1).replace('.', ',') + ' mesi).' : ''; });
    };
    render(null, null); panel.appendChild(card);
    let cost = 0, priced = 0;
    for(const g of list.slice(0, 30)){ try{ const p = await priceFor(g); if(p && p.f >= 0){ cost += p.cur === 'USD' ? p.f * 0.92 : p.f; priced++; } }catch(e){} await sleep(120); }
    if(document.getElementById('bkCard') === card) render(cost, priced);
  }
  function addQualityCard(){
    const panel = document.getElementById('statsPanel'); if(!panel || typeof dataScore !== 'function') return;
    const old = document.getElementById('dsCard'); if(old) old.remove();
    const ctx = {au: LS.get('jrpg_audit', {}) || {}, ck: LS.get('jrpg_info_checked', {}) || {}};
    const all = GAMES.map(g=> ({g, d: dataScore(g, ctx)})), avg = Math.round(all.reduce((a, o)=> a + o.d.pct, 0) / Math.max(1, all.length));
    const weak = all.filter(o=> o.d.pct < 60).sort((a, b)=> a.d.pct - b.d.pct);
    const card = document.createElement('div'); card.id = 'dsCard'; card.className = 'bk-card';
    card.innerHTML = `<h3>${gi('gem')} Affidabilità dei dati</h3><div class="bk-grid"><div><b>${avg}%</b><small>media del database</small></div><div><b>${all.filter(o=> o.d.pct >= 80).length}</b><small>schede complete (80%+)</small></div><div><b>${weak.length}</b><small>sotto il 60%</small></div></div>
      ${weak.length ? '<div class="lp-sub">Le più deboli: aprine una e usa «Aggiorna info»:</div><div class="tl-row"><div>' + weak.slice(0, 12).map(o=> `<button class="tl-chip" data-open="${o.g.id}"><span class="tl-t" style="background:#dc2626">${o.d.pct}</span>${esc(o.g.name)}</button>`).join('') + '</div></div>' : '<div class="lp-sub">Tutte le schede sono sopra il 60%. 🎉</div>'}`;
    panel.appendChild(card);
    card.querySelectorAll('[data-open]').forEach(b=> b.addEventListener('click', ()=>{ const g = byId(b.dataset.open); if(g) openModal(g); }));
  }
  if(typeof window.renderStatsPanel === 'function'){
    const orig = window.renderStatsPanel;
    window.renderStatsPanel = function(){ const r = orig.apply(this, arguments); try{ addQualityCard(); addBacklogCard(); }catch(e){ console.error(e); } return r; };
  }

  // =====================================================================
  // 6) JOYPAD (Gamepad API): croce/levetta per muoversi, A apre, B indietro, X preferito, Y Chiedi, LB/RB cambia schermata, Start = menu ✨
  // =====================================================================
  const GP = {focus: null, prev: {}, rep: {}, raf: 0, on: false};
  const overlays = ()=> [...document.querySelectorAll('.modal-backdrop.show, .dup-backdrop.show, .ask-backdrop.show, #askBackdrop.show, #wizardBackdrop.show, .lightbox-backdrop.show')];
  function cands(){
    const ov = overlays(), root = ov.length ? ov[ov.length - 1] : document;
    const sel = 'button:not([disabled]), a[href], .view-tab, .list-chip, #tbody tr, .x-card, .tagchip, .qf-chip, input:not([type=hidden]), select, textarea, summary';
    return [...root.querySelectorAll(sel)].filter(el=>{
      if(!ov.length && el.closest('.modal-backdrop, .dup-backdrop, .ask-backdrop')) return false;
      const r = el.getBoundingClientRect(); if(r.width < 4 || r.height < 4) return false;
      const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || cs.display === 'none') return false;
      return r.bottom > -200 && r.top < innerHeight + 300;
    });
  }
  function setFocus(el){
    if(GP.focus) GP.focus.classList.remove('gp-focus');
    GP.focus = el; if(!el) return;
    el.classList.add('gp-focus');
    try{ el.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'smooth'}); }catch(e){}
  }
  function move(dx, dy){
    const list = cands(); if(!list.length) return;
    if(!GP.focus || !list.includes(GP.focus)){
      const active = document.querySelector('.view-tab.active'), row = list.find(el=> el.matches && el.matches('#tbody tr, .x-card') && el.getBoundingClientRect().top > 60);
      setFocus(overlays().length ? list[0] : (row || (active && list.includes(active) ? active : list[0]))); return;
    }
    const a = GP.focus.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bs = Infinity;
    list.forEach(el=>{
      if(el === GP.focus) return;
      const r = el.getBoundingClientRect(), vx = r.left + r.width / 2 - ax, vy = r.top + r.height / 2 - ay;
      const along = vx * dx + vy * dy; if(along <= 2) return;
      const across = Math.abs(vx * dy - vy * dx), sc = along + across * 2.2;
      if(sc < bs){ bs = sc; best = el; }
    });
    if(best) setFocus(best); else if(dy){ window.scrollBy({top: dy * 240, behavior: 'smooth'}); }
  }
  function pressA(){ const el = GP.focus; if(!el) return move(0, 1); if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)){ el.focus(); return; } el.click(); }
  function pressB(){
    const ov = overlays();
    if(ov.length){ const top = ov[ov.length - 1], cl = top.querySelector('[data-ui-close], [data-x-close], [data-lp-close], .modal-close, #askCloseBtn'); if(cl) cl.click(); else top.classList.remove('show'); GP.focus = null; return; }
    if(typeof state !== 'undefined' && state.view !== 'list' && typeof setView === 'function'){ setView('list'); GP.focus = null; }
  }
  function pressX(){
    const fb = document.getElementById('modalFavBtn'); if(fb && overlays().length){ fb.click(); return; }
    const row = GP.focus && GP.focus.closest && GP.focus.closest('#tbody tr'); if(row){ const f = row.querySelector('td.fav'); if(f) f.click(); }
  }
  function tabStep(d){
    const tabs = [...document.querySelectorAll('.view-tab[data-view]')], i = tabs.findIndex(t=> t.classList.contains('active'));
    if(tabs.length){ tabs[(i + d + tabs.length) % tabs.length].click(); GP.focus = null; }
  }
  function poll(){
    GP.raf = requestAnimationFrame(poll);
    if(document.visibilityState !== 'visible') return;
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [], p = [...pads].find(x=> x && x.connected);
    if(!p) return;
    const now = performance.now(), b = i=> !!(p.buttons[i] && p.buttons[i].pressed);
    let dx = 0, dy = 0;
    if(b(12)) dy = -1; else if(b(13)) dy = 1; else if(b(14)) dx = -1; else if(b(15)) dx = 1;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    if(!dx && !dy && (Math.abs(ax) > .6 || Math.abs(ay) > .6)){ if(Math.abs(ax) > Math.abs(ay)) dx = ax > 0 ? 1 : -1; else dy = ay > 0 ? 1 : -1; }
    if(dx || dy){
      const key = dx + ',' + dy, t = GP.rep[key];
      if(!t || now - t.at > (t.n ? 120 : 280)){ move(dx, dy); GP.rep = {[key]: {at: now, n: 1}}; }
    } else GP.rep = {};
    [[0, pressA], [1, pressB], [2, pressX], [3, ()=>{ if(typeof openAsk === 'function') openAsk(); }], [4, ()=> tabStep(-1)], [5, ()=> tabStep(1)], [9, ()=>{ const m = document.getElementById('xMenuBtn'); if(m) m.click(); }]].forEach(([i, fn])=>{
      const is = b(i); if(is && !GP.prev[i]) fn(); GP.prev[i] = is;
    });
  }
  function startPad(){ if(GP.on) return; GP.on = true; document.documentElement.classList.add('gp-on'); toast('🎮 Joypad collegato: croce o levetta per muoversi · A apri · B indietro · X preferito · Y Chiedi · LB/RB cambia schermata · Start menu', 7000); GP.raf = requestAnimationFrame(poll); }
  window.addEventListener('gamepadconnected', startPad);
  window.addEventListener('gamepaddisconnected', ()=>{ const left = ((navigator.getGamepads && navigator.getGamepads()) || []).some(x=> x && x.connected); if(!left){ GP.on = false; cancelAnimationFrame(GP.raf); setFocus(null); document.documentElement.classList.remove('gp-on'); } });
  if(((navigator.getGamepads && navigator.getGamepads()) || []).some(x=> x && x.connected)) startPad();
  window.__gp = {move, pressA, pressB, pressX, tabStep, setFocus};     // per i test
})();
