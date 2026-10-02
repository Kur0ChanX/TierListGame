// ---- «Come iniziare al meglio» (guida per ogni gioco) + «Compagno di gioco» (aiuto a livelli, senza spoiler) ----
// Tutto nasce da Gemini con le fonti aperte (Wikipedia, RAWG) e la ricerca web; se non è sicuro di un dato scrive null.
// La guida si prepara una volta sola per gioco e resta salvata (e condivisa nel catalogo). Il compagno tiene un diario di dove sei arrivato.
(function(){
  if(window.RT_OFF && window.RT_OFF.guida) return;
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const LSG = (k, d)=>{ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const LSS = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const K_GD = 'atl_guides', K_CP = 'atl_companion';
  const aiOk = ()=>{ try{ return typeof llmAvailable === 'function' && llmAvailable(); }catch(e){ return false; } };
  const fmtD = iso=>{ try{ return new Date(iso).toLocaleDateString('it-IT', {day: 'numeric', month: 'long', year: 'numeric'}); }catch(e){ return ''; } };
  const parseJ = t=>{ const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim(), a = s.indexOf('{'), b = s.lastIndexOf('}'); if(a < 0 || b < a) return null; try{ return JSON.parse(s.slice(a, b + 1)); }catch(e){ return null; } };
  const arr = (x, n)=> Array.isArray(x) ? x.map(v=> typeof v === 'string' ? v.trim() : (v && typeof v === 'object' ? [v.titolo || v.title || v.nome || '', v.consiglio || v.motivo || v.text || v.why || ''].filter(Boolean).join(': ') : '')).filter(v=> v && !/^null$/i.test(v)).slice(0, n || 5) : [];
  const str = x=> (typeof x === 'string' && x.trim().length > 6 && !/^null$/i.test(x.trim())) ? x.trim() : null;
  const today = ()=> { try{ return todayLine(); }catch(e){ return ''; } };

  // ============================== GUIDA ==============================
  const guides = ()=> LSG(K_GD, {});
  function guideHtml(g){
    const e = guides()[g.id], l = g.label || {};
    const head = `<div class="modal-section-title gd-title">🚀 Come iniziare al meglio</div>`;
    if(!e){
      return `<div class="gd-card" id="gdCard">${head}<div class="gd-empty">${aiOk()
        ? 'Una guida breve e senza spoiler: impostazioni da scegliere, scelte iniziali, errori da evitare e dopo quante ore il gioco «ingrana».<div class="lp-tools"><button class="btn primary" type="button" id="gdMake">✨ Prepara la guida</button></div>'
        : 'Per preparare la guida serve una chiave Gemini (⚙️ in «Chiedi»).'}</div></div>`;
    }
    const d = e.d || {};
    const list = (icon, ttl, items)=> items && items.length ? `<div class="gd-blk"><h4>${icon} ${ttl}</h4><ul>${items.map(x=> `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    let hook = '';
    if(d.hook && (d.hook.hours != null || d.hook.note)){
      const total = l.h || (g.enrich && g.enrich.hoursMain) || null, hrs = d.hook.hours;
      const pct = (hrs != null && total) ? Math.max(3, Math.min(96, Math.round(hrs / total * 100))) : null;
      hook = `<div class="gd-blk gd-hook"><h4>⏱️ Quando ingrana</h4>${pct != null ? `<div class="gd-ecg" title="circa ${hrs} ore su ${total}"><i style="left:${pct}%"></i><b style="left:${pct}%">${hrs} h</b><span>0</span><span>${total} h</span></div>` : (hrs != null ? `<div class="gd-hrs">dopo circa <b>${hrs} ore</b></div>` : '')}${d.hook.note ? `<p>${esc(d.hook.note)}</p>` : ''}</div>`;
    }
    return `<div class="gd-card" id="gdCard">${head}
      ${d.tip ? `<div class="gd-gold">💡 ${esc(d.tip)}</div>` : ''}
      ${list('⚙️', 'Prima di cominciare', d.settings)}
      ${list('🧭', 'Scelte iniziali', d.firstChoices)}
      ${list('🚫', 'Errori da evitare', d.mistakes)}
      ${hook}
      ${d.testDrive ? `<div class="gd-blk"><h4>🎯 Quanto provarlo</h4><p>${esc(d.testDrive)}</p></div>` : ''}
      <div class="gd-foot">Preparata il ${esc(fmtD(e.t))} con ${esc((e.src && e.src.length ? e.src.join(', ') + ' e ' : '') + 'la ricerca web')} · senza spoiler · <button type="button" class="gd-lnk" id="gdMake">rifai</button></div></div>`;
  }
  async function makeGuide(g, btn){
    const card = document.getElementById('gdCard'); if(!card) return;
    const setMsg = t=>{ card.innerHTML = `<div class="modal-section-title gd-title">🚀 Come iniziare al meglio</div><div class="gd-empty">${t}</div>`; };
    setMsg('🦝 Frugu Frugu sta leggendo le fonti e preparando la guida…');
    let dg = {names: [], text: ''};
    try{ if(typeof rtSourceDigest === 'function') dg = await Promise.race([rtSourceDigest(g), new Promise(res=> setTimeout(()=> res({names: [], text: ''}), 9000))]); }catch(e){}       // se le fonti sono lente vado avanti lo stesso
    const l = g.label || {};
    const prompt = today() + `Sei Frugu Frugu, un amico esperto di videogiochi. Scrivi la guida «Come iniziare al meglio» per "${g.name}" (${g.year || 'anno n.d.'}, ${g.plat}) per Mario, che sta per iniziarlo (o vuole ricominciarlo).
REGOLE: NESSUNO SPOILER (niente colpi di scena, morti di personaggi, boss finali, finali). Usa le fonti qui sotto e, se serve, la ricerca web. Se NON sei sicuro di un'informazione scrivi null: non inventare. Italiano semplice, frasi brevi, dai del tu. Niente frasi legate al tempo («uscito da poco»): usa gli anni.
Rispondi SOLO con un oggetto JSON valido con questi campi: settings (da 2 a 4 impostazioni o opzioni da scegliere PRIMA di cominciare: difficoltà, lingua/audio, comandi, accessibilità, versione/piattaforma; ognuna con il motivo in una frase), firstChoices (da 2 a 4 scelte iniziali importanti: classe, personaggio, modalità, stile; con un consiglio per un principiante), mistakes (da 2 a 4 errori tipici dei nuovi giocatori da evitare), hook (oggetto: hours = dopo quante ore circa il gioco ingrana davvero, numero o null; note = una frase su cosa aspettarsi all'inizio: lento, difficile, tutorial lungo…), testDrive (una frase: quanto giocare prima di decidere se fa per te e cosa osservare), tip (il consiglio d'oro, una frase).
Dati già noti: difficoltà ${l.d || 'n.d.'}/5, ritmo ${l.p || 'n.d.'}, ore per la storia ${l.h || 'n.d.'}.
${dg.text}`;
    try{
      const r = await askLLM(prompt, {}, {search: true, silent: true, label: 'Preparo la guida…'});
      const j = parseJ(r && r.text); if(!j) throw new Error('risposta non leggibile');
      const d = {settings: arr(j.settings, 4), firstChoices: arr(j.firstChoices, 4), mistakes: arr(j.mistakes, 4), tip: str(j.tip), testDrive: str(j.testDrive),
        hook: j.hook && typeof j.hook === 'object' ? {hours: (typeof j.hook.hours === 'number' && j.hook.hours >= 0 && j.hook.hours < 400) ? Math.round(j.hook.hours * 10) / 10 : null, note: str(j.hook.note)} : null};
      if(!(d.settings.length || d.firstChoices.length || d.mistakes.length || d.tip)) throw new Error('guida vuota');
      const all = guides(); all[g.id] = {t: new Date().toISOString(), d, src: dg.names}; LSS(K_GD, all);
      const cur = document.getElementById('gdCard'); if(cur && typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id){ cur.outerHTML = guideHtml(g); wireGuide(g); }
    }catch(e){
      setMsg('Non sono riuscito a preparare la guida adesso' + (typeof llmErrorText === 'function' && e && e.code ? ' (' + esc(llmErrorText(e)) + ')' : '') + '. <div class="lp-tools"><button class="btn" type="button" id="gdMake">Riprova</button></div>');
      wireGuide(g);
    }
  }
  function wireGuide(g){ const b = document.getElementById('gdMake'); if(b) b.addEventListener('click', ()=> makeGuide(g, b)); }

  // ============================== COMPAGNO ==============================
  const comp = ()=> LSG(K_CP, {});
  const LV = {1: ['💡', 'Solo un indizio', 'Dammi solo una spinta, senza dire la soluzione.'], 2: ['🧭', 'Consiglio di strategia', 'Spiegami come affrontarlo, senza svelare gli eventi della storia.'], 3: ['📖', 'Soluzione completa', 'Dimmi esattamente cosa fare, passo per passo.']};
  function compHtml(g){
    const st = (typeof STATUSES !== 'undefined') ? STATUSES[g.id] : null, data = comp()[g.id] || {progress: '', log: []};
    if(st !== 'playing' && !(data.log && data.log.length)) return '';
    const log = (data.log || []).slice(-4).reverse().map((x, i)=> `<details class="cp-old"><summary>${LV[x.lv] ? LV[x.lv][0] : '💬'} ${esc(x.q).slice(0, 70)}<small> · ${esc(fmtD(x.t))}</small></summary><div class="cp-ans">${esc(x.a).replace(/\n/g, '<br>')}</div></details>`).join('');
    return `<details class="cp-card" id="cpCard" ${st === 'playing' ? 'open' : ''}><summary>🦝 Compagno di gioco <small>aiuto senza spoiler</small></summary>
      <div class="cp-body">
        <label class="cp-l">A che punto sei? <input id="cpProg" type="text" maxlength="120" value="${esc(data.progress || '')}" placeholder="es. dopo il primo villaggio, ore 6"></label>
        <label class="cp-l">Cosa ti blocca o cosa vuoi sapere? <textarea id="cpQ" rows="2" maxlength="300" placeholder="es. non riesco a battere il boss della miniera"></textarea></label>
        <div class="cp-lv">${[1, 2, 3].map(n=> `<button type="button" class="btn${n === 1 ? ' primary' : ''}" data-lv="${n}" title="${esc(LV[n][2])}">${LV[n][0]} ${LV[n][1]}</button>`).join('')}</div>
        <div class="cp-out" id="cpOut"></div>
        ${log ? `<div class="cp-hist"><small>Ultime domande</small>${log}</div>` : ''}
      </div></details>`;
  }
  async function askComp(g, lv){
    const q = (document.getElementById('cpQ') || {}).value || '', prog = (document.getElementById('cpProg') || {}).value || '', out = document.getElementById('cpOut');
    if(!out) return;
    if(!aiOk()){ out.innerHTML = '<div class="lp-sub">Serve una chiave Gemini (⚙️ in «Chiedi»).</div>'; return; }
    if(q.trim().length < 4){ out.innerHTML = '<div class="lp-sub">Scrivi cosa ti blocca, anche in poche parole.</div>'; return; }
    const data = comp(); data[g.id] = data[g.id] || {progress: '', log: []}; data[g.id].progress = prog.trim(); LSS(K_CP, data);
    out.innerHTML = '<div class="lp-sub">🦝 Ci penso…</div>';
    const levelTxt = {1: 'LIVELLO 1 — SOLO UN INDIZIO: una o due frasi che spingano nella direzione giusta, SENZA dire la soluzione né nomi di oggetti o mosse decisive.', 2: 'LIVELLO 2 — STRATEGIA: spiega come ragionare o prepararsi (equipaggiamento, abilità, schemi da osservare) senza rivelare eventi della storia e senza la soluzione passo per passo.', 3: 'LIVELLO 3 — SOLUZIONE: elenco numerato di cosa fare, passo per passo.'}[lv];
    const prompt = today() + `Sei Frugu Frugu, il compagno di gioco di Mario. Mario sta giocando a "${g.name}" (${g.year || ''}, ${g.plat}).${prog.trim() ? ' È arrivato a: ' + prog.trim() + '.' : ''}
Domanda di Mario: "${q.trim()}"
${levelTxt}
REGOLE FERME: NIENTE SPOILER oltre a ciò che serve per rispondere; non parlare di quello che succede DOPO il punto in cui si trova; se non sei sicuro della risposta (versione, punto del gioco) dillo e chiedi una precisazione invece di inventare. Usa la ricerca web. Italiano semplice, dai del tu, massimo 140 parole.`;
    try{
      const r = await askLLM(prompt, {}, {search: true, silent: true, label: 'Il compagno cerca…'});
      const ans = String(r && r.text || '').trim(); if(!ans) throw new Error('vuota');
      const d2 = comp(); d2[g.id] = d2[g.id] || {progress: prog.trim(), log: []}; d2[g.id].log = (d2[g.id].log || []).concat([{t: new Date().toISOString(), q: q.trim(), lv, a: ans}]).slice(-12); LSS(K_CP, d2);
      // scudo anti-spoiler: la risposta resta sfocata finché non la tocchi
      out.innerHTML = `<div class="cp-shield" id="cpShield" role="button" tabindex="0"><div class="cp-ans blur">${esc(ans).replace(/\n/g, '<br>')}</div><span class="cp-tap">👆 Tocca per rivelare (${LV[lv][1].toLowerCase()})</span></div>`;
      const sh = out.querySelector('#cpShield'); const rev = ()=>{ sh.classList.add('open'); };
      sh.addEventListener('click', rev); sh.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') rev(); });
      if(lv < 3) out.insertAdjacentHTML('beforeend', `<div class="lp-tools"><button class="btn" type="button" id="cpMore" data-lv="${lv + 1}">${LV[lv + 1][0]} Serve di più: ${LV[lv + 1][1].toLowerCase()}</button></div>`);
      const more = out.querySelector('#cpMore'); if(more) more.addEventListener('click', ()=> askComp(g, lv + 1));
    }catch(e){ out.innerHTML = '<div class="lp-sub">Non riesco a rispondere adesso' + (typeof llmErrorText === 'function' && e && e.code ? ' (' + esc(llmErrorText(e)) + ')' : '') + '. Riprova tra poco.</div>'; }
  }
  function wireComp(g){
    const c = document.getElementById('cpCard'); if(!c) return;
    c.querySelectorAll('.cp-lv [data-lv]').forEach(b=> b.addEventListener('click', ()=> askComp(g, +b.dataset.lv)));
    const pr = c.querySelector('#cpProg'); if(pr) pr.addEventListener('change', ()=>{ const d = comp(); d[g.id] = d[g.id] || {progress: '', log: []}; d[g.id].progress = pr.value.trim(); LSS(K_CP, d); });
  }

  // ---- aggancio alla scheda ----
  window.rtGuideHtml = guideHtml; window.rtMakeGuide = makeGuide;
  const origOpen = window.openModal;
  function putGuide(g, onlyMissing){
    const card = document.getElementById('modalCard'); if(!card || !g) return;
    if(onlyMissing && card.querySelector('#gdCard')) return;
    card.querySelectorAll('#gdCard, #cpCard').forEach(n=> n.remove());
    const lab = card.querySelector('.glabel'), anchor = lab || card.querySelector('.modal-story') || card.querySelector('#statusRow');
    if(anchor){ const html = guideHtml(g); if(lab) lab.insertAdjacentHTML('afterend', html); else anchor.insertAdjacentHTML('beforebegin', html); wireGuide(g); }
    const sr = card.querySelector('#statusRow'), ch = compHtml(g);
    if(sr && ch){ sr.insertAdjacentHTML('afterend', ch); wireComp(g); }
  }
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      putGuide(g, false);
      const again = ()=>{ try{ if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id && document.getElementById('modalBackdrop').classList.contains('show')) putGuide(g, true); }catch(e){} };
      setTimeout(again, 1000); setTimeout(again, 3400);
    }catch(e){ try{ console.error(e); }catch(x){} }
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}
})();
