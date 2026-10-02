// ---- v249: «🎮 Sto giocando ora»: un tasto grande in ogni scheda che apre la Modalità gioco.
// Tutti gli aiuti in un posto solo, pronti con un tocco mentre giochi: domanda a voce, foto dello schermo, indizio/strategia/soluzione,
// passo passo, riassunto per riprendere, equipaggiamento consigliato, cose da non perdere, appunti, tempo di gioco e link rapidi.
// Le risposte usano lo stesso diario del «Compagno di gioco» (jrpg_companion) e si possono ascoltare con la voce scelta (rtStory.say).
(function(){
  'use strict';
  if(!window.XUI) return;
  const {toast, esc, LS} = XUI;
  const K_CP = 'jrpg_companion', K_PN = 'jrpg_playnow', K_NOTE = 'jrpg_play_notes', K_TIME = 'jrpg_playtime', K_STEPS = 'jrpg_play_steps', K_READ = 'jrpg_play_read', K_LV = 'jrpg_play_lv';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const aiOk = ()=>{ try{ return typeof llmAvailable === 'function' && llmAvailable(); }catch(e){ return false; } };
  const today = ()=>{ try{ return todayLine(); }catch(e){ return ''; } };
  const errTxt = e=>{ try{ return typeof llmErrorText === 'function' && e && e.code ? ' (' + llmErrorText(e) + ')' : ''; }catch(x){ return ''; } };
  const cur = ()=> (typeof currentModalGame !== 'undefined') ? currentModalGame : null;
  const comp = ()=> LS.get(K_CP, {}) || {};
  const progOf = g=> ((comp()[g.id] || {}).progress || '').trim();
  function setProg(g, t){ const d = comp(); d[g.id] = d[g.id] || {progress: '', log: []}; d[g.id].progress = String(t || '').trim().slice(0, 160); LS.set(K_CP, d); }
  function logAns(g, q, lv, a){ const d = comp(); d[g.id] = d[g.id] || {progress: '', log: []}; d[g.id].log = (d[g.id].log || []).concat([{t: new Date().toISOString(), q: String(q).slice(0, 200), lv, a}]).slice(-12); LS.set(K_CP, d); }
  const readOn = ()=> LS.get(K_READ, true) !== false;
  const lvNow = ()=>{ const v = +LS.get(K_LV, 1); return v >= 1 && v <= 3 ? v : 1; };
  const LV = {1: ['💡', 'Indizio', 'LIVELLO 1 — SOLO UN INDIZIO: una o due frasi che spingano nella direzione giusta, SENZA dire la soluzione né nomi di oggetti o mosse decisive.'],
    2: ['🧭', 'Strategia', 'LIVELLO 2 — STRATEGIA: spiega come ragionare o prepararsi (equipaggiamento, abilità, schemi da osservare) senza rivelare eventi della storia e senza la soluzione passo per passo.'],
    3: ['📖', 'Soluzione', 'LIVELLO 3 — SOLUZIONE: elenco numerato di cosa fare, passo per passo.']};

  // ---------------------------------------------------------------- tempo di gioco (sessione in corso + totale per gioco)
  const sess = ()=>{ const s = LS.get(K_PN, null); return s && s.id != null && Date.now() - s.start < 12 * 3600e3 ? s : null; };
  const times = ()=> LS.get(K_TIME, {}) || {};
  const fmtMin = m=> m < 60 ? Math.max(1, Math.round(m)) + ' min' : Math.floor(m / 60) + ' h' + (Math.round(m % 60) ? ' ' + Math.round(m % 60) + ' min' : '');
  const clock = ms=>{ const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  function startSess(g){ const s = sess(); if(s && s.id === g.id) return s; if(s) endSess(true); const n = {id: g.id, start: Date.now()}; LS.set(K_PN, n); return n; }
  function endSess(quiet){
    const s = sess(); LS.set(K_PN, null); if(!s) return 0;
    const min = (Date.now() - s.start) / 60000; if(min < 1) return 0;
    const t = times(), r = t[s.id] || {min: 0, n: 0}; r.min = Math.round((r.min + min) * 10) / 10; r.n++; r.last = new Date().toISOString(); t[s.id] = r; LS.set(K_TIME, t);
    if(!quiet) toast('⏸️ Sessione salvata: ' + fmtMin(min) + ' di gioco', 2600);
    return min;
  }

  // ---------------------------------------------------------------- domande all'AI
  const RULES = 'REGOLE FERME: NIENTE SPOILER su ciò che succede DOPO il punto in cui si trova Mario; se non sei sicuro (versione del gioco, punto preciso) dillo e chiedi una precisazione invece di inventare. Usa la ricerca web. Italiano semplice, dai del tu, frasi brevi (la risposta può essere letta ad alta voce), niente tabelle né simboli strani.';
  function promptFor(g, kind, q, lv){
    const prog = progOf(g), base = today() + `Sei Frugu Frugu, il compagno di gioco di Mario. Mario sta giocando ADESSO a "${g.name}" (${g.year || ''}, ${g.plat || ''}).${prog ? ' È arrivato a: ' + prog + '.' : ' Non ha detto a che punto è.'}\n`;
    if(kind === 'q') return base + `Domanda di Mario: "${q}"\n${LV[lv][2]}\n${RULES} Massimo 140 parole.`;
    if(kind === 'photo') return base + `Mario ti manda una foto dello schermo fatta col telefono (può essere storta o con riflessi). Capisci in che punto del gioco si trova e cosa sta succedendo${q ? '. La sua domanda: "' + q + '"' : ''}.\nRispondi così: prima una frase su cosa vedi, poi cosa fare adesso.\n${LV[lv][2]}\n${RULES} Massimo 150 parole.`;
    if(kind === 'steps') return base + `Scrivi i prossimi 3-5 obiettivi concreti da fare da questo punto (dove andare, cosa preparare, cosa fare), uno per riga, numerati «1.», «2.»… Ogni riga massimo 20 parole. Niente introduzione né conclusione.\n${RULES}`;
    if(kind === 'recap') return base + `Mario riprende il gioco dopo una pausa. Riassumi in 5-8 frasi cosa è successo e cosa stava facendo FINO al punto in cui è arrivato, così si ricorda tutto. Poi una frase su cosa conviene fare adesso. Nulla di quello che succede dopo.\n${RULES}`;
    if(kind === 'build') return base + `Consiglia equipaggiamento, abilità, livello consigliato e (se il gioco ce l'ha) squadra o build adatti al punto in cui si trova, con il motivo in poche parole. Elenco breve.\n${RULES} Massimo 150 parole.`;
    if(kind === 'miss') return base + `Elenca le cose che si possono PERDERE per sempre (oggetti, missioni secondarie, personaggi reclutabili, trofei/obiettivi mancabili) nella zona in cui si trova o nella prossima, senza svelare la trama. Se in questo punto non ce ne sono dillo chiaramente. Elenco breve.\n${RULES} Massimo 150 parole.`;
    return base + q;
  }
  let busy = 0;
  async function ask(g, kind, q, lv, img){
    const out = document.getElementById('poOut'); if(!out) return;
    if(!aiOk()){ out.innerHTML = '<div class="po-msg">Per gli aiuti serve la chiave Gemini (⚙️ Impostazioni → AI). I link qui sotto funzionano anche senza.</div>'; return; }
    if((kind === 'recap' || kind === 'steps' || kind === 'build' || kind === 'miss') && !progOf(g)){ out.innerHTML = '<div class="po-msg">✏️ Prima scrivi (o detta) <b>a che punto sei</b> qui sopra: così rispondo senza rovinarti niente.</div>'; const p = document.getElementById('poProg'); if(p) p.focus(); return; }
    const my = ++busy;
    try{ window.rtStory && rtStory.stop(); }catch(e){}
    out.innerHTML = `<div class="po-msg po-wait">🦝 ${kind === 'photo' ? 'Guardo la foto…' : 'Ci penso…'}</div>`;
    out.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    try{
      const r = await askLLM(promptFor(g, kind, q, lv), img ? {images: [img]} : {}, {search: true, silent: true, label: 'Il compagno cerca…'});
      if(my !== busy) return;
      const ans = String(r && r.text || '').trim(); if(!ans) throw new Error('vuota');
      const title = {q: LV[lv][0] + ' ' + LV[lv][1], photo: '📸 Dalla foto · ' + LV[lv][1].toLowerCase(), steps: '🪜 Prossimi passi', recap: '🧠 Dove eravamo', build: '⚔️ Equipaggiamento consigliato', miss: '🏆 Da non perdere'}[kind];
      logAns(g, kind === 'q' ? q : title + (q ? ': ' + q : ''), kind === 'q' || kind === 'photo' ? lv : 2, ans);
      if(kind === 'steps') return showSteps(g, ans);
      const hide = (kind === 'q' || kind === 'photo') && lv === 3;          // la soluzione resta coperta finché non la tocchi
      out.innerHTML = `<div class="po-ans${hide ? ' po-hide' : ''}"><div class="po-ans-h">${esc(title)}</div><div class="po-ans-t">${esc(ans).replace(/\n/g, '<br>')}</div>${hide ? '<button type="button" class="po-reveal">👆 Tocca per vedere la soluzione</button>' : ''}</div>
        <div class="po-ans-tools"><button type="button" class="btn" data-po-read>🔊 Ascolta</button>${(kind === 'q' || kind === 'photo') && lv < 3 ? `<button type="button" class="btn" data-po-more>${LV[lv + 1][0]} Serve di più: ${LV[lv + 1][1].toLowerCase()}</button>` : ''}<button type="button" class="btn" data-po-note>📝 Negli appunti</button></div>`;
      const box = out.querySelector('.po-ans');
      const rv = out.querySelector('.po-reveal'); if(rv) rv.addEventListener('click', ()=>{ box.classList.remove('po-hide'); rv.remove(); if(readOn()) say(ans); });
      out.querySelector('[data-po-read]').addEventListener('click', ()=>{ box.classList.remove('po-hide'); const x = out.querySelector('.po-reveal'); if(x) x.remove(); say(ans); });
      const mo = out.querySelector('[data-po-more]'); if(mo) mo.addEventListener('click', ()=> ask(g, kind, q, lv + 1, img));
      out.querySelector('[data-po-note]').addEventListener('click', ()=>{ addNote(g, title + ': ' + ans); toast('📝 Aggiunto ai tuoi appunti', 1600); });
      if(readOn() && !hide) say(ans);
    }catch(e){ if(my === busy) out.innerHTML = '<div class="po-msg">Non riesco a rispondere adesso' + esc(errTxt(e)) + '. Riprova tra poco.</div>'; }
  }
  function say(t){ try{ if(window.rtStory && rtStory.say) rtStory.say(t.replace(/^\s*\d+[.)]\s*/gm, '').replace(/[*#_`]/g, '')); }catch(e){} }

  // ---------------------------------------------------------------- passo passo (lista da spuntare)
  function showSteps(g, ans){
    let items = String(ans).split(/\n+/).map(x=> x.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').replace(/[*#_`]/g, '').trim()).filter(x=> x.length > 3).slice(0, 6);
    const all = LS.get(K_STEPS, {}) || {}; all[g.id] = {t: Date.now(), items: items.map(x=> ({x, ok: 0}))}; LS.set(K_STEPS, all);
    const out = document.getElementById('poOut'); if(out) out.innerHTML = '';
    paintSteps(g); const st = document.getElementById('poSteps'); if(st){ try{ st.scrollIntoView({behavior: 'smooth', block: 'nearest'}); }catch(e){} }
    if(readOn()) say(items.map((x, i)=> (i + 1) + '. ' + x).join('. '));
  }
  function stepsHtml(g){
    const s = (LS.get(K_STEPS, {}) || {})[g.id]; if(!s || !s.items || !s.items.length) return '';
    const done = s.items.every(x=> x.ok);
    return `<div class="po-steps"><div class="po-ans-h">🪜 I tuoi prossimi passi</div>${s.items.map((x, i)=> `<label class="po-step${x.ok ? ' ok' : ''}"><input type="checkbox" data-step="${i}"${x.ok ? ' checked' : ''}><span>${esc(x.x)}</span></label>`).join('')}
      <div class="po-ans-tools">${done ? '<button type="button" class="btn primary" data-po-next>✅ Fatto tutto: dammi i prossimi</button>' : ''}<button type="button" class="btn" data-po-sread>🔊 Ascolta</button><button type="button" class="btn" data-po-sclear>✕ Togli</button></div></div>`;
  }
  function paintSteps(g){
    const box = document.getElementById('poSteps'); if(!box) return;
    box.innerHTML = stepsHtml(g);
    box.querySelectorAll('[data-step]').forEach(c=> c.addEventListener('change', ()=>{
      const all = LS.get(K_STEPS, {}) || {}, s = all[g.id]; if(!s) return; s.items[+c.dataset.step].ok = c.checked ? 1 : 0; LS.set(K_STEPS, all);
      try{ window.rtHaptic && rtHaptic('tick'); }catch(e){} paintSteps(g);
    }));
    const nx = box.querySelector('[data-po-next]'); if(nx) nx.addEventListener('click', ()=>{ const s = (LS.get(K_STEPS, {}) || {})[g.id]; if(s && s.items.length) setProg(g, (progOf(g) ? progOf(g) + '; ' : '') + 'fatto: ' + s.items[s.items.length - 1].x); paintProg(g); ask(g, 'steps', '', 2); });
    const rd = box.querySelector('[data-po-sread]'); if(rd) rd.addEventListener('click', ()=>{ const s = (LS.get(K_STEPS, {}) || {})[g.id]; if(s) say(s.items.filter(x=> !x.ok).map((x, i)=> (i + 1) + '. ' + x.x).join('. ') || 'Hai fatto tutto!'); });
    const cl = box.querySelector('[data-po-sclear]'); if(cl) cl.addEventListener('click', ()=>{ const all = LS.get(K_STEPS, {}) || {}; delete all[g.id]; LS.set(K_STEPS, all); paintSteps(g); });
  }

  // ---------------------------------------------------------------- appunti
  const notes = ()=> LS.get(K_NOTE, {}) || {};
  function addNote(g, t){ const n = notes(); n[g.id] = ((n[g.id] || '') + (n[g.id] ? '\n\n' : '') + String(t).trim()).slice(-6000); LS.set(K_NOTE, n); const ta = document.getElementById('poNotes'); if(ta) ta.value = n[g.id]; }

  // ---------------------------------------------------------------- dettatura (microfono del telefono)
  let rec = null;
  function dictate(onText, onEnd){
    if(!SR){ toast('La dettatura non è disponibile su questo browser: scrivi la domanda', 3200); return null; }
    const r = new SR(); r.lang = 'it-IT'; r.continuous = false; r.interimResults = true; let fin = '';
    r.onresult = e=>{ let inter = ''; for(let i = e.resultIndex; i < e.results.length; i++){ const t = e.results[i][0].transcript; if(e.results[i].isFinal) fin += t + ' '; else inter += t; } onText((fin + inter).trim()); };
    r.onend = ()=>{ rec = null; onEnd && onEnd(fin.trim()); };
    r.onerror = e=>{ if(e.error === 'not-allowed') toast('Consenti il microfono per fare domande a voce', 3000); };
    try{ try{ window.rtStory && rtStory.stop(); }catch(x){} r.start(); }catch(e){ return null; }
    return r;
  }

  // ---------------------------------------------------------------- il pannello
  const q = s=> encodeURIComponent(s);
  function links(g){
    const n = g.name, p = progOf(g);
    return [['🎬', 'Video guida', 'https://www.youtube.com/results?search_query=' + q(n + (p ? ' ' + p : '') + ' guida ita')],
      ['📖', 'Soluzione scritta', 'https://www.google.com/search?q=' + q(n + ' soluzione completa ita')],
      ['🗺️', 'Mappa interattiva', 'https://www.google.com/search?q=' + q(n + ' interactive map')],
      ['📚', 'Wiki del gioco', 'https://www.google.com/search?q=' + q(n + ' wiki fandom')],
      ['🏆', 'Trofei e obiettivi', 'https://www.google.com/search?q=' + q(n + ' guida trofei obiettivi')],
      ['🔐', 'Segreti e trucchi', 'https://www.google.com/search?q=' + q(n + ' segreti trucchi consigli')]];
  }
  function timeLine(g){
    const s = sess(), t = times()[g.id];
    const live = s && s.id === g.id ? `<b id="poClock">${clock(Date.now() - s.start)}</b> in questa sessione` : 'Sessione non avviata';
    return `⏱️ ${live}${t && t.min ? ` · in tutto <b>${fmtMin(t.min)}</b> (${t.n} ${t.n === 1 ? 'sessione' : 'sessioni'})` : ''}`;
  }
  function paintProg(g){ const p = document.getElementById('poProg'); if(p && document.activeElement !== p) p.value = progOf(g); }
  let tick = 0;
  function open(g){
    if(!g) return;
    try{ if(typeof STATUSES !== 'undefined' && STATUSES[g.id] !== 'playing'){ setStatus(g.id, 'playing'); if(typeof renderMetrics === 'function') renderMetrics(); document.querySelectorAll('#rtBar [data-rs]').forEach(b=> b.classList.toggle('on', b.dataset.rs === 'playing')); } }catch(e){}
    startSess(g); paintBtn(g);
    const lv = lvNow(), n = notes()[g.id] || '', first = !progOf(g) && !(times()[g.id] || {}).min;
    const b = XUI.sheet('xPlayNow', '🎮 Sto giocando ora', `
      <div class="po-hero"><div class="po-name">${esc(g.name)}</div><div class="po-time" id="poTime">${timeLine(g)}</div></div>
      <label class="po-l">📍 A che punto sei? <span class="po-row"><input id="poProg" type="text" maxlength="160" value="${esc(progOf(g))}" placeholder="es. capitolo 3, appena arrivato in città">${SR ? '<button type="button" class="po-mic-s" data-po-pmic aria-label="Detta a che punto sei">🎙️</button>' : ''}</span></label>
      ${first ? '<button type="button" class="po-start" data-po-guide>🚀 Stai iniziando? Apri «Come iniziare al meglio»</button>' : ''}
      <div class="po-lv" role="radiogroup" aria-label="Quanto aiuto vuoi">${[1, 2, 3].map(k=> `<button type="button" role="radio" data-po-lv="${k}" aria-checked="${k === lv ? 'true' : 'false'}" class="${k === lv ? 'on' : ''}">${LV[k][0]} ${LV[k][1]}</button>`).join('')}</div>
      <div class="po-ask">
        <button type="button" class="po-mic" id="poMic"><span>🎙️</span><b>Chiedi a voce</b><small>tocca e parla</small></button>
        <label class="po-mic po-cam"><span>📸</span><b>Foto dello schermo</b><small>capisco dove sei</small><input type="file" accept="image/*" capture="environment" id="poCam" hidden></label>
      </div>
      <div class="po-row po-qrow"><textarea id="poQ" rows="2" maxlength="300" placeholder="…oppure scrivi: es. come batto il boss della miniera?"></textarea><button type="button" class="btn primary" id="poSend">Chiedi</button></div>
      <div id="poOut" class="po-out" aria-live="polite"></div>
      <div class="po-grid">
        <button type="button" data-po-k="steps"><span>🪜</span><b>Passo passo</b><small>i prossimi obiettivi da spuntare</small></button>
        <button type="button" data-po-k="recap"><span>🧠</span><b>Dove eravamo?</b><small>riassunto per riprendere</small></button>
        <button type="button" data-po-k="build"><span>⚔️</span><b>Equipaggiamento</b><small>build e livello giusti</small></button>
        <button type="button" data-po-k="miss"><span>🏆</span><b>Da non perdere</b><small>oggetti e trofei mancabili</small></button>
      </div>
      <div id="poSteps"></div>
      <div class="po-h">🔗 Aiuti rapidi</div>
      <div class="po-links">${links(g).map(([ic, t, u])=> `<a href="${esc(u)}" target="_blank" rel="noopener"><span>${ic}</span>${esc(t)}</a>`).join('')}</div>
      <div class="po-h">📝 I tuoi appunti <small>(codici, combinazioni, dove hai lasciato…)</small></div>
      <div class="po-row"><textarea id="poNotes" rows="3" placeholder="Scrivi o detta qui">${esc(n)}</textarea>${SR ? '<button type="button" class="po-mic-s" data-po-nmic aria-label="Detta un appunto">🎙️</button>' : ''}</div>
      <div class="po-foot">
        <label class="po-sw"><input type="checkbox" id="poRead"${readOn() ? ' checked' : ''}> 🔊 Leggi le risposte ad alta voce</label>
        <button type="button" class="btn" id="poEnd">⏸️ Fine sessione</button>
      </div>`);
    const prog = b.querySelector('#poProg');
    prog.addEventListener('change', ()=>{ setProg(g, prog.value); toast('📍 Segnato: ' + (prog.value.trim() || 'nessun punto'), 1400); });
    b.querySelectorAll('[data-po-lv]').forEach(x=> x.addEventListener('click', ()=>{ LS.set(K_LV, +x.dataset.poLv); b.querySelectorAll('[data-po-lv]').forEach(y=>{ const on = y === x; y.classList.toggle('on', on); y.setAttribute('aria-checked', on ? 'true' : 'false'); }); try{ window.rtHaptic && rtHaptic('tick'); }catch(e){} }));
    const qa = b.querySelector('#poQ');
    const send = ()=>{ const t = qa.value.trim(); if(t.length < 3){ toast('Scrivi o detta cosa ti serve', 1800); qa.focus(); return; } setProg(g, prog.value); ask(g, 'q', t, lvNow()); };
    b.querySelector('#poSend').addEventListener('click', send);
    qa.addEventListener('keydown', e=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
    const mic = b.querySelector('#poMic');
    mic.addEventListener('click', ()=>{
      if(rec){ rec.stop(); return; }
      mic.classList.add('live'); mic.querySelector('small').textContent = 'ti ascolto…';
      rec = dictate(t=>{ qa.value = t; }, fin=>{ mic.classList.remove('live'); mic.querySelector('small').textContent = 'tocca e parla'; if(fin && fin.length >= 3){ qa.value = fin; send(); } else toast('Non ho sentito: riprova', 1600); });
      if(!rec){ mic.classList.remove('live'); mic.querySelector('small').textContent = 'tocca e parla'; }
    });
    const pm = b.querySelector('[data-po-pmic]'); if(pm) pm.addEventListener('click', ()=>{ if(rec){ rec.stop(); return; } pm.classList.add('live'); rec = dictate(t=>{ prog.value = t; }, fin=>{ pm.classList.remove('live'); if(fin){ prog.value = fin; setProg(g, fin); toast('📍 Segnato: ' + fin, 1400); } }); if(!rec) pm.classList.remove('live'); });
    const cam = b.querySelector('#poCam'); cam.addEventListener('change', ()=>{ const f = cam.files && cam.files[0]; cam.value = ''; if(!f) return; setProg(g, prog.value); ask(g, 'photo', qa.value.trim(), lvNow(), f); });
    b.querySelectorAll('[data-po-k]').forEach(x=> x.addEventListener('click', ()=>{ setProg(g, prog.value); ask(g, x.dataset.poK, '', 2); }));
    const ta = b.querySelector('#poNotes'); let nt = 0;
    ta.addEventListener('input', ()=>{ clearTimeout(nt); nt = setTimeout(()=>{ const all = notes(); if(ta.value.trim()) all[g.id] = ta.value; else delete all[g.id]; LS.set(K_NOTE, all); }, 400); });
    const nm = b.querySelector('[data-po-nmic]'); if(nm) nm.addEventListener('click', ()=>{ if(rec){ rec.stop(); return; } nm.classList.add('live'); const base = ta.value; rec = dictate(t=>{ ta.value = (base ? base + '\n' : '') + t; }, fin=>{ nm.classList.remove('live'); if(fin){ ta.value = (base ? base + '\n' : '') + fin; ta.dispatchEvent(new Event('input')); } }); if(!rec) nm.classList.remove('live'); });
    b.querySelector('#poRead').addEventListener('change', e=>{ LS.set(K_READ, e.target.checked); if(!e.target.checked){ try{ window.rtStory && rtStory.stop(); }catch(x){} } });
    b.querySelector('#poEnd').addEventListener('click', ()=>{ setProg(g, prog.value); endSess(false); try{ window.rtStory && rtStory.stop(); }catch(e){} const sh = document.getElementById('xPlayNow'); if(sh) sh.classList.remove('show'); paintBtn(g); });
    const gd = b.querySelector('[data-po-guide]'); if(gd) gd.addEventListener('click', ()=>{
      const sh = document.getElementById('xPlayNow'); if(sh) sh.classList.remove('show');
      const card = document.getElementById('modalCard'), t = card && card.querySelector('.cd-tabs [data-ctab="gioco"]'); if(t) t.click();
      setTimeout(()=>{ const c = document.getElementById('gdCard'); if(c){ try{ c.scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(e){} } else toast('La guida è nella parte «🎮 Il gioco»', 2000); }, 120);
    });
    paintSteps(g);
    clearInterval(tick);
    tick = setInterval(()=>{ const sh = document.getElementById('xPlayNow'); if(!sh || !sh.classList.contains('show')){ clearInterval(tick); return; } const el = document.getElementById('poTime'); if(el) el.innerHTML = timeLine(g); }, 1000);
  }

  // ---------------------------------------------------------------- il tasto grande nella scheda
  function btnInner(g){
    const s = sess(), live = s && s.id === g.id;
    return `<span class="po-bic">🎮</span><span class="po-btx"><b>${live ? 'Stai giocando · ' + fmtMin((Date.now() - s.start) / 60000) : 'Sto giocando ora'}</b><small>${live ? 'apri gli aiuti: voce, foto, passo passo' : 'aiuti a voce, foto, passo passo, soluzioni'}</small></span><span class="po-bgo">›</span>`;
  }
  function paintBtn(g){ const b = document.getElementById('poBtn'); if(b && g){ b.innerHTML = btnInner(g); b.classList.toggle('live', !!(sess() && sess().id === g.id)); } }
  function putBtn(g){
    const card = document.getElementById('modalCard'); if(!card || !g || card.querySelector('#poBtn')) return;
    const anchor = card.querySelector('#rtBar .rb-st') || card.querySelector('#statusRow'); if(!anchor) return;
    anchor.insertAdjacentHTML('afterend', `<button type="button" class="po-btn" id="poBtn">${btnInner(g)}</button>`);
    paintBtn(g);
    card.querySelector('#poBtn').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); try{ window.rtHaptic && rtHaptic('soft'); }catch(x){} open(cur() || g); });
  }
  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{ putBtn(g); }catch(e){}
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}
  // dal menu ✨: riapre il gioco che stai giocando
  try{ (window.XMENU = window.XMENU || []).push({html: '🎮 Sto giocando ora', run: ()=>{
    const s = sess(); let g = s ? GAMES.find(x=> x.id === s.id) : null;
    if(!g){ try{ g = GAMES.find(x=> STATUSES[x.id] === 'playing'); }catch(e){} }
    if(!g){ toast('Apri un gioco e tocca «🎮 Sto giocando ora»', 2600); return; }
    openModal(g); setTimeout(()=> open(g), 350);
  }}); }catch(e){}
  window.rtPlayNow = {open, end: endSess, session: sess};
})();
