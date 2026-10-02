// ---- v215: NOTIFICHE — i popup importanti restano finché non li tocchi, e non si perdono più ----
// Prima ogni avviso (Oggi, Radar, prezzi, backup, memoria…) era un palloncino che spariva da solo dopo qualche secondo: se non guardavi, era perso.
// Ora: 1) l'avviso compare in basso come una scheda e RESTA finché lo tocchi (ti porta alla cosa di cui parla) o lo chiudi con ✕;
//      2) se ne arrivano più insieme si mettono in fila (vedi «+2»);
//      3) ogni avviso finisce nella 🔔 campanella in alto, con il numero di quelli che non hai ancora visto.
// Quali sono «importanti»: quelli con un'azione (toccandoli si apre qualcosa) o lunghi (7 s o più) — li decide showToast in app.js.
// I palloncini brevi di conferma («Musica ferma», «Salvato»…) restano come prima: compaiono e spariscono da soli.
(function(){
  'use strict';
  const K = 'rt_notifs', MAX = 40;                                 // rt_: resta su questo dispositivo (non si sincronizza)
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let list = (LSG(K, []) || []).filter(n=> n && n.msg).slice(0, MAX);
  const acts = new Map();                                          // id → cosa fare al tocco (solo in questa sessione)
  const queue = [];
  let cur = null;
  const save = ()=> LSS(K, list.slice(0, MAX).map(({id, msg, t, read})=> ({id, msg, t, read})));
  const EMO = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍(?:\p{Extended_Pictographic}))*)\s*/u;
  const iconOf = m=>{ const x = EMO.exec(m || ''); return x ? x[1] : '🔔'; };
  const textOf = m=> String(m || '').replace(EMO, '').replace(/\s*[·.]?\s*(?:Tocca|tocca) per [^.]*\.?\s*$/, '').trim();
  const ago = t=>{ const s = (Date.now() - t) / 1000; if(s < 60) return 'adesso'; if(s < 3600) return Math.round(s / 60) + ' min fa'; if(s < 86400) return Math.round(s / 3600) + ' h fa'; const d = new Date(t); return d.toLocaleDateString('it-IT', {day: 'numeric', month: 'short'}); };

  // ---------- la campanella ----------
  const bell = document.getElementById('bellBtn'), badge = document.getElementById('bellBadge');
  function paintBadge(){
    const n = list.filter(x=> !x.read).length;
    if(badge){ badge.hidden = !n; badge.textContent = n > 9 ? '9+' : String(n); }
    if(bell) bell.classList.toggle('has-new', !!n);
  }

  // ---------- il popup ----------
  const el = document.createElement('div');
  el.id = 'rtNote'; el.className = 'rt-note'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<button type="button" class="rn-main"><span class="rn-ic"></span><span class="rn-tx"></span><span class="rn-go" aria-hidden="true">›</span></button><span class="rn-more" hidden></span><button type="button" class="rn-x" aria-label="Chiudi l\'avviso">✕</button>';
  document.body.appendChild(el);
  const $ = s=> el.querySelector(s);
  function show(id){
    const n = list.find(x=> x.id === id); if(!n){ next(); return; }
    cur = id;
    $('.rn-ic').textContent = iconOf(n.msg);
    $('.rn-tx').textContent = textOf(n.msg) || n.msg;
    $('.rn-go').hidden = !actOf(id);
    const more = queue.filter(q=> q !== id).length; $('.rn-more').hidden = !more; $('.rn-more').textContent = '+' + more;
    // v216: niente «void offsetWidth» (ricalcolava la pagina intera): due fotogrammi e poi entra
    if(el.classList.contains('show')){ el.classList.remove('show'); requestAnimationFrame(()=> requestAnimationFrame(()=> el.classList.add('show'))); } else requestAnimationFrame(()=> el.classList.add('show'));
    try{ window.rtHaptic && rtHaptic('soft'); }catch(e){}
  }
  function hide(){ cur = null; el.classList.remove('show'); }
  function next(){ const id = queue.shift(); if(id == null){ hide(); return; } show(id); }
  function markRead(id){ const n = list.find(x=> x.id === id); if(n && !n.read){ n.read = true; save(); paintBadge(); } }
  // v228: dopo aver riaperto l'app le azioni degli avvisi vecchi non c'erano più (erano solo in memoria) e il tocco non portava da nessuna parte.
  // Ora, se manca, l'azione si ricava dal testo: «novità per te» → Oggi per te; un gioco nominato (offerta, immagine copiata, uscita…) → la sua scheda.
  let names = null;
  function smart(msg){
    const m = String(msg || '');
    if(/novit[àa] per te|^\W*oggi:/i.test(m)){ const it = (window.XMENU || []).find(x=> /Oggi/.test(x.html || '')); if(it) return ()=> it.run(); }
    if(typeof GAMES !== 'undefined' && GAMES.length && typeof openModal === 'function'){
      if(!names) names = GAMES.filter(g=> g && g.name && g.name.length > 3).map(g=> [g.name.toLowerCase(), g.id]).sort((a, b)=> b[0].length - a[0].length);
      const low = m.toLowerCase(), hit = names.find(([n])=> low.includes(n));
      if(hit){
        const id = hit[1];
        if(/hai copiato un'immagine/i.test(m)) return ()=>{ const g = GAMES.find(x=> x.id === id); if(g){ openModal(g); setTimeout(()=>{ try{ window.rtWebPaste && rtWebPaste(g); }catch(e){} }, 500); } };
        return ()=>{ const g = GAMES.find(x=> x.id === id); if(g) openModal(g); };
      }
    }
    return null;
  }
  const actOf = id=>{ if(acts.has(id)) return acts.get(id); const n = list.find(x=> x.id === id); return n ? smart(n.msg) : null; };
  function run(id){ markRead(id); const fn = actOf(id); if(fn){ try{ fn(); }catch(e){} } }
  $('.rn-main').addEventListener('click', e=>{ e.stopPropagation(); const id = cur; if(id == null) return; run(id); next(); });
  $('.rn-x').addEventListener('click', e=>{ e.stopPropagation(); const id = cur; if(id != null) markRead(id); next(); });

  // ---------- l'entrata: chiamata da showToast (app.js) per gli avvisi importanti ----------
  window.rtNotify = function(msg, onTap){
    if(!msg) return;
    msg = String(msg);
    // lo stesso avviso ripetuto entro 10 minuti: non lo duplico, lo riporto in cima
    const same = list.find(x=> x.msg === msg && Date.now() - x.t < 10 * 60e3);
    let id;
    if(same){ id = same.id; same.t = Date.now(); same.read = false; list = [same].concat(list.filter(x=> x !== same)); }
    else { id = Date.now() + '-' + Math.random().toString(36).slice(2, 6); list.unshift({id, msg, t: Date.now(), read: false}); list = list.slice(0, MAX); }
    if(typeof onTap === 'function') acts.set(id, onTap);
    save(); paintBadge();
    if(cur === id) return;
    if(!queue.includes(id)) queue.push(id);
    if(cur == null) next(); else { const more = queue.length; $('.rn-more').hidden = !more; $('.rn-more').textContent = '+' + more; }
  };
  // avvisi arrivati mentre il programma si caricava
  try{ (window.__rtNotifQ || []).splice(0).forEach(([m, f])=> window.rtNotify(m, f)); }catch(e){}

  // ---------- l'elenco (tocca la campanella) ----------
  function openList(){
    const U = window.XUI; if(!U || !U.sheet) return;
    hide(); queue.length = 0;
    const draw = ()=>{
      const rows = list.length ? list.map(n=> `<button type="button" class="rn-row${n.read ? '' : ' new'}" data-rn="${esc(n.id)}"><span class="rn-ic">${esc(iconOf(n.msg))}</span><span class="rn-rt"><b>${esc(textOf(n.msg) || n.msg)}</b><small>${esc(ago(n.t))}${actOf(n.id) ? ' · tocca per aprire' : ''}</small></span>${n.read ? '' : '<i class="rn-dot" aria-label="nuovo"></i>'}</button>`).join('') : '<div class="lp-sub" style="text-align:center;padding:24px 0">🦝 Nessun avviso: tutto tranquillo.</div>';
      return `<div class="rn-list">${rows}</div>${list.length ? '<div class="lp-tools"><button class="btn" type="button" id="rnAll">✓ Segna tutti come letti</button><button class="btn" type="button" id="rnClear">🧹 Svuota</button></div>' : ''}`;
    };
    const body = U.sheet('xNotifs', '🔔 Avvisi', draw());
    const wire = ()=>{
      body.querySelectorAll('[data-rn]').forEach(b=> b.addEventListener('click', ()=>{
        const id = b.dataset.rn;
        if(actOf(id)){ const sh = document.getElementById('xNotifs'); if(sh) sh.classList.remove('show'); run(id); }
        else { markRead(id); b.classList.remove('new'); const d = b.querySelector('.rn-dot'); if(d) d.remove(); }
      }));
      const a = body.querySelector('#rnAll'); if(a) a.addEventListener('click', ()=>{ list.forEach(x=> x.read = true); save(); paintBadge(); body.innerHTML = draw(); wire(); });
      const c = body.querySelector('#rnClear'); if(c) c.addEventListener('click', ()=>{ list = []; acts.clear(); save(); paintBadge(); body.innerHTML = draw(); wire(); });
    };
    wire();
  }
  if(bell) bell.addEventListener('click', openList);
  window.rtOpenNotifs = openList;
  paintBadge();
})();
