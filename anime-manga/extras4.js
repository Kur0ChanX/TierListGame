// ---- Extra 4 (v136): Oracolo del procione, tier list e app da condividere con un QR, previsione del voto, recensione a voce ----
(function(){
  'use strict';
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS} = U;
  const gi = n=> (typeof giIcon === 'function') ? giIcon(n) : '';
  const menu = (html, run)=>{ (window.XMENU = window.XMENU || []).push({html, run}); };
  const load = src=> (window.RT_LOAD ? window.RT_LOAD(src) : Promise.reject());
  const nrm = s=> String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const TIERS = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
  const SITE = 'https://kur0chanx.github.io/TierListGame/';
  const hasAI = ()=> typeof llmAvailable === 'function' && llmAvailable();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // voce che legge (sintesi vocale italiana: sceglie la voce migliore disponibile sul telefono)
  function itVoice(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const it = vs.filter(v=> /^it(-|_|$)/i.test(v.lang));
    return it.find(v=> /natural|premium|enhanced|neural/i.test(v.name)) || it.find(v=> /google/i.test(v.name)) || it[0] || null;
  }
  try{ window.speechSynthesis && speechSynthesis.getVoices(); }catch(e){}
  function speak(text, btn){
    if(!window.speechSynthesis){ toast('Questo browser non sa leggere ad alta voce', 3000); return; }
    if(speechSynthesis.speaking){ speechSynthesis.cancel(); if(btn) btn.textContent = '🔊 Ascolta'; return; }
    // frasi brevi con pause: si capisce meglio
    const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]?/g) || [text];
    const v = itVoice();
    parts.forEach((p, i)=>{ const u = new SpeechSynthesisUtterance(p.trim()); u.lang = 'it-IT'; if(v) u.voice = v; u.rate = .96; u.pitch = 1; if(i === parts.length - 1 && btn) u.onend = ()=>{ btn.textContent = '🔊 Ascolta'; }; speechSynthesis.speak(u); });
    if(btn) btn.textContent = '⏹ Ferma';
  }
  window.rtSpeak = speak;
  function dictate(onText, onEnd){
    if(!SR){ toast('La dettatura non è disponibile in questo browser: scrivi il testo', 3500); return null; }
    const r = new SR(); r.lang = 'it-IT'; r.continuous = true; r.interimResults = true;
    let fin = '';
    r.onresult = e=>{ let inter = ''; for(let i = e.resultIndex; i < e.results.length; i++){ const t = e.results[i][0].transcript; if(e.results[i].isFinal) fin += t + ' '; else inter += t; } onText((fin + inter).trim()); };
    r.onend = ()=> onEnd && onEnd(fin.trim());
    r.onerror = e=>{ if(e.error === 'not-allowed') toast('Consenti il microfono per dettare', 3000); };
    try{ r.start(); }catch(e){ return null; }
    return r;
  }

  // =====================================================================
  // 1) ORACOLO DEL PROCIONE: descrivi una sensazione, trova il gioco
  // =====================================================================
  function gameText(g){
    const e = g.enrich || {}, l = g.label || {};
    return nrm([g.name, (g.tags || []).map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(' '), g.story, e.whyLikeIt, e.storyTagNote, e.gameplayNote, e.agingNote, (e.pros || []).join(' '), l.ok, l.ko, e.storyTag && STORY_TAG_INFO && STORY_TAG_INFO[e.storyTag] ? STORY_TAG_INFO[e.storyTag].label : ''].filter(Boolean).join(' '));
  }
  const STOP = new Set('il lo la i gli le un una uno di da in con su per tra fra e o ma che mi ti si ci vi non piu meno molto voglio vorrei qualcosa gioco giochi un po come quando dove sono sei essere avere ho hai del della dei delle al alla ai alle nel nella sul sulla'.split(' '));
  // sinonimi: una sensazione chiama le parole con cui i giochi sono descritti
  const SYN = {piangere: ['commovente', 'emozion', 'dramm', 'lacrim', 'triste', 'perdita', 'sacrific'], ridere: ['umorism', 'comic', 'divertent', 'ironi', 'buffo'], rilass: ['rilass', 'tranquill', 'cozy', 'calm', 'vita'], paura: ['horror', 'paura', 'inquietant', 'angosc'], sfida: ['difficil', 'sfida', 'tattic', 'punitiv', 'strateg'], esplorare: ['esplor', 'mondo aperto', 'open world', 'segret', 'scopr'], turni: ['turni', 'a turni'], tattico: ['tattic', 'griglia', 'strateg'], storia: ['trama', 'storia', 'narrat', 'personagg'], breve: ['breve', 'corto', 'poche ore'], lungo: ['epico', 'lungo', 'centinaia', 'ore di gioco'], amicizia: ['amicizi', 'compagni', 'legame', 'gruppo'], amore: ['amore', 'romant', 'relazion'], viaggio: ['viaggio', 'avventur'], nostalgia: ['nostalg', 'retro', 'classico', 'anni 90', 'pixel'], musica: ['colonna sonora', 'musica', 'soundtrack'], mostri: ['mostri', 'cattur', 'creature'], carte: ['carte', 'deck', 'mazzo'], azione: ['azione', 'combattimenti in tempo reale', 'action'], mistero: ['mister', 'enigm', 'segret', 'indagin']};
  function localOracle(q){
    const words = nrm(q).split(/[^a-z0-9]+/).filter(w=> w.length > 2 && !STOP.has(w));
    const keys = new Set(); words.forEach(w=>{ keys.add(w.slice(0, Math.max(4, w.length - 2))); Object.entries(SYN).forEach(([k, l])=>{ if(w.startsWith(k.slice(0, 5)) || k.startsWith(w.slice(0, 5))) l.forEach(x=> keys.add(x)); }); });
    const K = [...keys];
    return GAMES.map(g=>{ const t = gameText(g); const hits = K.filter(k=> t.includes(k)); return {g, s: hits.length * 10 + (hits.length ? g.score / 20 + (window.tasteScore ? tasteScore(g) * 6 : 0) : 0), hits}; })
      .filter(x=> x.s > 0).sort((a, b)=> b.s - a.s);
  }
  async function askOracle(q, out){
    out.innerHTML = '<div class="lp-sub">🦝 Frugu Frugu annusa il tuo desiderio…</div>';
    try{ if(window.rtTexts && rtTexts.loaded && GAMES.length <= 6000) await rtTexts.ensureAll(); }catch(e){}       // v209: l'Oracolo cerca nei testi di tutti i giochi
    const local = localOracle(q);
    let picks = [];
    if(hasAI()){
      const cand = (local.length >= 12 ? local.slice(0, 70).map(x=> x.g) : local.map(x=> x.g).concat(GAMES.slice().sort((a, b)=> b.score - a.score).slice(0, 70))).slice(0, 80);
      const list = [...new Set(cand)].map(g=> `${g.id}|${g.name}|${g.year || ''}|${(g.tags || []).map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(',')}|${String((g.enrich && g.enrich.whyLikeIt) || g.story || '').slice(0, 170)}`).join('\n');
      const prompt = `Sei l'Oracolo del procione. Mario descrive una sensazione o un desiderio: "${q}". Tra i giochi qui sotto (formato id|nome|anno|generi|descrizione) scegli i 5 che realizzano MEGLIO proprio quella sensazione. Per ognuno scrivi "why": una frase in seconda persona, concreta, che spiega perché dà quella sensazione (usa solo le informazioni date, niente invenzioni). ${window.tasteSummary ? tasteSummary() : ''}\nRispondi SOLO con JSON: {"picks":[{"id":123,"why":"..."}]}\n\n${list}`;
      try{
        const r = await askLLM(prompt, {}, {label: 'L\'Oracolo sta pensando…'});
        const t = String(r && r.text || ''), j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
        picks = (j.picks || []).map(p=> ({g: GAMES.find(g=> g.id == p.id), why: p.why})).filter(p=> p.g).slice(0, 5);
      }catch(e){}
    }
    if(!picks.length) picks = local.slice(0, 5).map(x=> ({g: x.g, why: 'Nella sua descrizione ci sono: ' + x.hits.slice(0, 4).join(', ')}));
    if(!picks.length){ out.innerHTML = '<div class="lp-sub">L\'Oracolo non ha trovato niente: prova a descrivere la sensazione con altre parole (es. «voglio emozionarmi con una storia di amicizia e combattimenti a turni»).</div>'; return; }
    out.innerHTML = picks.map((p, i)=> `<button class="or-pick" type="button" data-or="${p.g.id}"><span class="or-n">${i + 1}</span><span><b>${esc(p.g.name)}</b> <span class="badge ${TIER_LABEL[p.g.tier]}">${p.g.tier}</span>${STATUSES[p.g.id] === 'played' ? ' <small>(già giocato)</small>' : ''}<br><small>${esc(p.why || '')}</small></span></button>`).join('') + (hasAI() ? '' : '<div class="lp-sub">Senza chiave Gemini l\'Oracolo usa solo le parole delle schede: con l\'AI capisce molto meglio le sensazioni.</div>');
    out.querySelectorAll('[data-or]').forEach(b=> b.addEventListener('click', ()=>{ document.getElementById('xOracle').classList.remove('show'); openModal(GAMES.find(g=> g.id == b.dataset.or)); }));
    try{ window.rtSfx && rtSfx('success'); }catch(e){}
  }
  function openOracle(){
    const body = sheet('xOracle', '🔮 Oracolo del procione', `<div class="lp-sub">Descrivi con parole tue una sensazione o un desiderio, e l'Oracolo trova il gioco che te lo fa provare. Esempi: «voglio piangere ma con combattimenti a turni», «qualcosa di rilassante da 20 ore», «un mondo misterioso da esplorare di notte».</div>
      <textarea id="orQ" rows="3" class="or-q" placeholder="Cosa vuoi provare?"></textarea>
      <div class="lp-tools">${SR ? `<button class="btn" type="button" id="orMic">${gi('mic')} Detta</button>` : ''}<button class="btn primary" type="button" id="orGo">🔮 Chiedi all'Oracolo</button></div><div class="or-out"></div>`);
    const q = body.querySelector('#orQ'), out = body.querySelector('.or-out');
    body.querySelector('#orGo').addEventListener('click', ()=>{ if(q.value.trim().length < 3){ toast('Scrivi cosa vuoi provare', 2000); return; } askOracle(q.value.trim(), out); });
    const mic = body.querySelector('#orMic'); let rec = null;
    if(mic) mic.addEventListener('click', ()=>{ if(rec){ rec.stop(); return; } mic.classList.add('primary'); rec = dictate(t=> q.value = t, fin=>{ rec = null; mic.classList.remove('primary'); if(fin) askOracle(q.value.trim(), out); }); if(!rec) mic.classList.remove('primary'); });
  }
  menu('🔮 Oracolo del procione', openOracle);

  // =====================================================================
  // 10) QR: tier list da mostrare agli amici  +  regalare l'app a un amico (copia sua, dati tuoi al sicuro)
  // =====================================================================
  const b64 = s=> btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s=> decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function tierPayload(){
    let MT = {}; try{ MT = MYTIER || {}; }catch(e){}
    const pool = GAMES.filter(g=> MT[g.id] || FAVS.has(g.id) || STATUSES[g.id] === 'played');
    const src = pool.length >= 5 ? pool : GAMES.filter(g=> ['S+', 'S'].includes(g.tier));
    const t = {}, c = [];
    src.sort((a, b)=> b.score - a.score).slice(0, 140).forEach(g=>{ const tier = MT[g.id] || g.tier; if(g.custom) c.push([String(g.name).slice(0, 40), tier]); else (t[tier] = t[tier] || []).push(g.id.toString(36)); });
    const who = (typeof currentProfile === 'function' ? currentProfile().name : 'Mario');
    return {n: who, t: Object.fromEntries(Object.entries(t).map(([k, v])=> [k, v.join('.')])), c: c.slice(0, 20)};
  }
  async function qrSvg(text){
    if(typeof qrcode === 'undefined') await load('qrcode.min.js');
    const q = qrcode(0, text.length > 900 ? 'L' : 'M'); q.addData(text); q.make();
    return q.createSvgTag({cellSize: 4, margin: 2, scalable: true});
  }
  async function openShare(){
    const tl = SITE + '#tl=' + b64(JSON.stringify(tierPayload()));
    const inv = SITE + '?benvenuto=' + encodeURIComponent((typeof currentProfile === 'function' ? currentProfile().name : 'Mario'));
    const body = sheet('xShare', gi('globe') + ' Condividi con un QR', `<div class="lp-tools qr-tabs"><button class="btn primary" type="button" data-q="tl">La mia tier list</button><button class="btn" type="button" data-q="inv">Regala l'app a un amico</button></div><div class="qr-box">Preparo il codice…</div><div class="qr-info"></div>
      <div class="lp-tools"><button class="btn" type="button" id="qrCopy">${gi('link')} Copia il link</button><button class="btn" type="button" id="qrShare">${gi('up')} Invia</button></div>`);
    let cur = 'tl';
    const info = {
      tl: `<b>La tua tier list in sola lettura.</b> L'amico inquadra il QR e la vede subito sul suo telefono, con copertine e tier, senza installare nulla. Non vede i tuoi dati personali, non può modificarla e non tocca niente sul suo telefono.`,
      inv: `<b>Una copia dell'app tutta sua.</b> L'amico inquadra il QR e apre Raccoon Tier sul suo telefono con un profilo nuovo: le sue impostazioni, i suoi preferiti, la sua tier list. <b>Il tuo utente resta blindato</b>: il link non contiene nessuno dei tuoi dati né le tue chiavi (Gemini, RAWG, token GitHub restano solo sul tuo telefono), quindi non può vedere né toccare niente di tuo.`
    };
    const show = async()=>{
      const url = cur === 'tl' ? tl : inv;
      body.querySelectorAll('[data-q]').forEach(b=> b.classList.toggle('primary', b.dataset.q === cur));
      body.querySelector('.qr-info').innerHTML = info[cur];
      try{ body.querySelector('.qr-box').innerHTML = await qrSvg(url); }catch(e){ body.querySelector('.qr-box').innerHTML = '<div class="lp-sub">Non riesco a creare il QR adesso (serve internet la prima volta): usa «Copia il link».</div>'; }
    };
    body.querySelectorAll('[data-q]').forEach(b=> b.addEventListener('click', ()=>{ cur = b.dataset.q; show(); }));
    body.querySelector('#qrCopy').addEventListener('click', ()=>{ const u = cur === 'tl' ? tl : inv; try{ navigator.clipboard.writeText(u).then(()=> toast('Link copiato', 1800)); }catch(e){ prompt('Copia il link', u); } });
    body.querySelector('#qrShare').addEventListener('click', ()=>{ const u = cur === 'tl' ? tl : inv; if(navigator.share) navigator.share({title: 'Raccoon Tier', text: cur === 'tl' ? 'Guarda la mia tier list dei giochi!' : 'Ti regalo Raccoon Tier: la tier list dei giochi con il procione!', url: u}).catch(()=>{}); else { try{ navigator.clipboard.writeText(u); toast('Link copiato', 1800); }catch(e){} } });
    show();
  }
  menu(gi('globe') + ' Condividi con un QR (tier list o app)', openShare);
  // chi apre un link con #tl= vede la tier list in sola lettura (niente viene salvato sul suo telefono)
  function viewShared(){
    const m = location.hash.match(/#tl=([A-Za-z0-9_-]+)/); if(!m) return;
    let d; try{ d = JSON.parse(unb64(m[1])); }catch(e){ return; }
    const el = document.createElement('div'); el.className = 'tl-view'; document.body.appendChild(el);
    const rows = TIERS.map(t=>{
      const ids = String((d.t || {})[t] || '').split('.').filter(Boolean).map(x=> parseInt(x, 36));
      const gs = ids.map(id=> GAMES.find(g=> g.id === id)).filter(Boolean), cs = (d.c || []).filter(x=> x[1] === t);
      if(!gs.length && !cs.length) return '';
      return `<div class="tlv-row"><b class="tlv-t badge ${TIER_LABEL[t]}">${t}</b><div class="tlv-g">${gs.map(g=>{ const u = effectiveCover(g); return `<div class="tlv-c" title="${esc(g.name)}">${u ? `<img src="${esc(coverThumb(u, 200))}" data-orig="${esc(u)}" onerror="if(this.dataset.orig&amp;&amp;!this.dataset.tr){this.dataset.tr=1;this.src=this.dataset.orig}else{this.onerror=null;this.remove()}" alt="">` : ''}<span>${esc(g.name)}</span></div>`; }).join('')}${cs.map(c=> `<div class="tlv-c"><span>${esc(c[0])}</span></div>`).join('')}</div></div>`;
    }).join('');
    el.innerHTML = `<div class="tlv-head"><b>🦝 La tier list di ${esc(d.n || 'un amico')}</b><button class="btn" type="button" id="tlvClose">Chiudi</button></div><div class="lp-sub">Sola lettura: niente viene salvato sul tuo telefono.</div>${rows}<div class="lp-tools"><button class="btn primary" type="button" id="tlvApp">Crea la tua con Raccoon Tier</button></div>`;
    const close = ()=>{ el.remove(); history.replaceState(null, '', location.pathname + location.search); };
    el.querySelector('#tlvClose').addEventListener('click', close); el.querySelector('#tlvApp').addEventListener('click', close);
  }
  // chi apre il link d'invito: benvenuto e profilo con il suo nome (solo se su questo telefono non c'è ancora niente di suo)
  function welcome(){
    const from = new URLSearchParams(location.search).get('benvenuto'); if(!from) return;
    const clean = ()=> history.replaceState(null, '', location.pathname + location.hash);
    const hasData = (FAVS && FAVS.size) || Object.keys(STATUSES || {}).length || localStorage.getItem('atl_welcomed');
    if(hasData){ clean(); return; }
    const body = sheet('xWelcome', '🦝 Benvenuto in Raccoon Tier!', `<div class="lp-sub"><b>${esc(from)}</b> ti ha regalato l'app. Questa è la <b>tua</b> copia: preferiti, tier list e impostazioni restano sul tuo telefono e sono solo tuoi (non vedi i dati di ${esc(from)} e lui non vede i tuoi).</div>
      <label class="gs-row">Come ti chiami? <input id="wlName" maxlength="20" placeholder="Il tuo nome"></label><button class="btn primary" type="button" id="wlGo">Inizia a frugare</button><div class="lp-sub">Consiglio: aggiungila alla schermata Home dal menu del browser per usarla come un'app.</div>`);
    body.querySelector('#wlGo').addEventListener('click', ()=>{
      const n = body.querySelector('#wlName').value.trim();
      try{ if(n && typeof PROFILES !== 'undefined'){ PROFILES[0].name = n; saveProfiles(); } }catch(e){}
      try{ localStorage.setItem('atl_welcomed', '1'); }catch(e){}
      document.getElementById('xWelcome').classList.remove('show'); clean(); toast('Ciao ' + (n || 'giocatore') + '! Tocca un gioco per iniziare', 3500);
      try{ typeof renderProfileBadge === 'function' && renderProfileBadge(); }catch(e){}
    });
  }
  const whenReady = f=> (typeof detailsReady === 'function' && detailsReady()) ? setTimeout(f, 300) : window.addEventListener('details-ready', ()=> setTimeout(f, 300), {once: true});
  whenReady(viewShared); setTimeout(welcome, 1500);

  // =====================================================================
  // 11) PREVISIONE DEL VOTO  +  16) RECENSIONE A VOCE (nella scheda del gioco)
  // =====================================================================
  const MV = 'atl_myvote', PR = 'atl_prediction', RV = 'atl_reviews';
  // v213: la previsione usa la Sintonia (lo stesso «cervello» dei consigli: gusti, giochi che ami, qualità), non più il vecchio profilo DNA che dava voti bassissimi.
  // Quella che vedi prima di votare è quella che si «congela» al voto (anche se nel frattempo hai dato le 6 valutazioni o un 👍 che cambiano la Sintonia).
  const SHOWN = new Map();
  function predict(g){
    try{ const s = window.rtSintonia && rtSintonia(g); if(s && typeof s.pct === 'number' && s.n > 0) return Math.max(1, Math.min(10, Math.round(1 + s.pct / 100 * 9))); }catch(e){}
    let pct = 55;
    try{ const d = dnaForGame(g, buildTasteProfile()); if(d) pct = d.pct; else if(window.tasteScore) pct = 50 + tasteScore(g) * 40; }catch(e){}
    const q = (g.score - 70) / 30;                      // un gioco molto votato parte avvantaggiato
    return Math.max(1, Math.min(10, Math.round(3.5 + pct / 100 * 5 + q * 1.5)));
  }
  window.rtPredict = predict;
  function voteHtml(g){
    const my = (LS.get(MV, {}) || {})[g.id], pr = (LS.get(PR, {}) || {})[g.id], st = STATUSES[g.id];
    let now = SHOWN.get(g.id); if(now == null || my != null){ now = predict(g); if(my == null) SHOWN.set(g.id, now); }
    const words = n=> n >= 9 ? 'lo adorerai' : n >= 7 ? 'ti piacerà' : n >= 5 ? 'potrebbe piacerti' : 'probabilmente non fa per te';
    let h = `<div class="pv-box"><div class="pv-top">${gi('orb')} <b>Previsione:</b> ${my != null ? (pr != null ? pr : now) : now}/10 · <small>${esc(words(my != null && pr != null ? pr : now))}</small></div>`;
    if(my != null){ const p = pr != null ? pr : now, d = my - p; h += `<div class="pv-res">Il tuo voto: <b>${my}/10</b> · ${Math.abs(d) <= 1 ? '🎯 previsione azzeccata' : d > 0 ? 'ti è piaciuto più del previsto (+' + d + ')' : 'ti è piaciuto meno del previsto (' + d + ')'}</div>`; }
    h += `<div class="pv-votes">${my != null ? '<small>Cambia voto:</small>' : '<small>' + (st === 'played' || st === 'dropped' || st === 'playing' ? 'Quanto ti è piaciuto?' : 'L\'hai giocato? Il tuo voto:') + '</small>'} ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n=> `<button type="button" class="pv-v${my === n ? ' on' : ''}" data-vote="${n}">${n}</button>`).join('')}</div>`;
    return h + '</div>';
  }
  function reviewHtml(g){
    const r = (LS.get(RV, {}) || {})[g.id];
    return `<div class="modal-section-title">${gi('mic')} La tua recensione</div><div class="rv-box">${r ? `<div class="rv-text">${esc(r.text)}</div><small class="rv-d">${new Date(r.t).toLocaleDateString('it-IT')}${r.ai ? ' · sistemata dall\'AI' : ''}</small>` : '<small>Detta a voce cosa ne pensi: l\'AI lo sistema (senza cambiare le tue opinioni) e lo salvo qui.</small>'}
      <div class="lp-tools">${SR ? `<button class="btn" type="button" id="rvMic">${gi('mic')} ${r ? 'Rifalla a voce' : 'Detta'}</button>` : ''}<button class="btn" type="button" id="rvWrite">✍️ Scrivi</button>${r ? '<button class="btn" type="button" id="rvRead">🔊 Ascolta</button>' : ''}</div><div class="rv-edit"></div></div>
      <button class="btn rv-listen" type="button" id="rvCard">🔊 Ascolta la scheda del gioco</button>`;
  }
  async function polish(g, raw){
    if(!hasAI()) return null;
    const prompt = `Mario ha dettato a voce questa recensione del videogioco "${g.name}". Trascrizione grezza: "${raw}".\nRiscrivila in italiano corretto e scorrevole, IN PRIMA PERSONA come se la scrivesse Mario, mantenendo il suo tono, le sue opinioni e i suoi giudizi esattamente come sono: correggi solo errori della dettatura, ripetizioni e punteggiatura. Non aggiungere fatti, voti o giudizi nuovi. Massimo 130 parole. Rispondi SOLO con il testo.`;
    try{ const r = await askLLM(prompt, {}, {label: 'Sistemo la tua recensione…'}); return String(r && r.text || '').trim().replace(/^["«]|["»]$/g, '') || null; }catch(e){ return null; }
  }
  function editReview(g, box, start){
    box.innerHTML = `<textarea class="or-q" rows="4" placeholder="Cosa ne pensi?">${esc(start || '')}</textarea><div class="lp-tools">${hasAI() ? '<button class="btn" type="button" data-rv="ai">✨ Sistema con l\'AI</button>' : ''}<button class="btn primary" type="button" data-rv="save">Salva</button></div><div class="rv-prev"></div>`;
    const ta = box.querySelector('textarea'); let ai = false;
    const b = box.querySelector('[data-rv="ai"]'); if(b) b.addEventListener('click', async()=>{ b.disabled = true; b.textContent = 'Sistemo…'; const p = await polish(g, ta.value); b.disabled = false; b.textContent = '✨ Sistema con l\'AI';
      if(!p){ toast('Non sono riuscito a sistemarla: puoi salvarla così', 3000); return; }
      box.querySelector('.rv-prev').innerHTML = `<div class="rv-cmp"><small>Originale</small><div>${esc(ta.value)}</div><small>Sistemata dall'AI</small><div class="rv-text">${esc(p)}</div><div class="lp-tools"><button class="btn primary" type="button" data-use>Usa questa</button><button class="btn" type="button" data-keep>Tengo la mia</button></div></div>`;
      box.querySelector('[data-use]').addEventListener('click', ()=>{ ta.value = p; ai = true; box.querySelector('.rv-prev').innerHTML = ''; });
      box.querySelector('[data-keep]').addEventListener('click', ()=>{ box.querySelector('.rv-prev').innerHTML = ''; }); });
    box.querySelector('[data-rv="save"]').addEventListener('click', ()=>{ const t = ta.value.trim(); const all = LS.get(RV, {}) || {}; if(t) all[g.id] = {text: t, raw: start || '', t: new Date().toISOString(), ai}; else delete all[g.id]; LS.set(RV, all); toast(t ? 'Recensione salvata' : 'Recensione tolta', 2000); try{ window.rtSfx && rtSfx('success'); }catch(e){} openModal(g); });
    ta.focus();
  }
  function cardText(g){
    const e = g.enrich || {}, l = g.label || {};
    return [g.name + '. ' + (g.year ? 'Uscito nel ' + g.year + '. ' : '') + 'Tier ' + g.tier + ', voto ' + g.score + ' su 100.', g.story, e.whyLikeIt, (e.pros || []).length ? 'Punti di forza: ' + e.pros.join('. ') + '.' : '', (e.cons || []).length ? 'Difetti: ' + e.cons.join('. ') + '.' : '', l.h ? 'Dura circa ' + l.h + ' ore per la storia principale.' : ''].filter(Boolean).join(' ');
  }
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      const card = document.getElementById('modalCard'); if(!card || !g) return r;
      const own = card.querySelector('.own-row') || document.getElementById('statusRow');
      if(own) own.insertAdjacentHTML('afterend', voteHtml(g) + reviewHtml(g));
      card.querySelectorAll('[data-vote]').forEach(b=> b.addEventListener('click', ()=>{
        const v = +b.dataset.vote, mv = LS.get(MV, {}) || {}, pr = LS.get(PR, {}) || {};
        if(pr[g.id] == null) pr[g.id] = SHOWN.has(g.id) ? SHOWN.get(g.id) : predict(g);          // la previsione si «congela» al primo voto, così il confronto è onesto
        mv[g.id] = v; LS.set(MV, mv); LS.set(PR, pr); try{ window.rtSfx && rtSfx('fav'); }catch(e){} openModal(g);
      }));
      const box = card.querySelector('.rv-edit');
      const w = document.getElementById('rvWrite'); if(w) w.addEventListener('click', ()=> editReview(g, box, ((LS.get(RV, {}) || {})[g.id] || {}).text || ''));
      const rd = document.getElementById('rvRead'); if(rd) rd.addEventListener('click', ()=> speak(((LS.get(RV, {}) || {})[g.id] || {}).text || '', rd));
      const cd = document.getElementById('rvCard'); if(cd) cd.addEventListener('click', ()=>{ speak(cardText(g), null); cd.textContent = speechSynthesis && speechSynthesis.speaking ? '⏹ Ferma la lettura' : '🔊 Ascolta la scheda del gioco'; });
      const mic = document.getElementById('rvMic'); let rec = null;
      if(mic) mic.addEventListener('click', ()=>{
        if(rec){ rec.stop(); return; }
        box.innerHTML = '<div class="rv-live">🎙️ Ti ascolto… tocca di nuovo «Detta» per finire</div>'; mic.classList.add('primary');
        rec = dictate(t=>{ const lv = box.querySelector('.rv-live'); if(lv) lv.textContent = '🎙️ ' + t; }, fin=>{ rec = null; mic.classList.remove('primary'); if(!fin){ box.innerHTML = '<small>Non ho sentito niente: riprova.</small>'; return; }
          editReview(g, box, fin); const ab = box.querySelector('[data-rv="ai"]'); if(ab) ab.click(); });
        if(!rec) mic.classList.remove('primary');
      });
    }catch(e){}
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}
  // chiudendo la scheda smette di leggere
  new MutationObserver(()=>{ if(!document.getElementById('modalBackdrop').classList.contains('show')){ try{ speechSynthesis.cancel(); }catch(e){} } }).observe(document.getElementById('modalBackdrop'), {attributes: true, attributeFilter: ['class']});
  // precisione delle previsioni (mostrata ne «I tuoi gusti»)
  window.rtPredictStats = function(){
    const mv = LS.get(MV, {}) || {}, pr = LS.get(PR, {}) || {};
    const ids = Object.keys(mv).filter(id=> pr[id] != null); if(!ids.length) return null;
    const err = ids.map(id=> Math.abs(mv[id] - pr[id]));
    return {n: ids.length, avg: err.reduce((a, b)=> a + b, 0) / ids.length, hit: Math.round(100 * err.filter(e=> e <= 1).length / ids.length)};
  };
  // link d'invito al Triple Triad (#tt=room:CODICE o #tt=friend:CODICE): il gioco ora sta su Raccoon Triad, giro l'invito lì
  (function(){
    const m = location.hash.match(/#tt=[^&]+/); if(!m) return;
    location.replace('https://kur0chanx.github.io/raccoon-triad/' + m[0]);
  })();
})();
