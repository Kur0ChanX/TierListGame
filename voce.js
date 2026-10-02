// ---- v223: «Ascolta la storia» in alto sulla scheda. Legge prima la storia, poi le informazioni principali.
// Voce: se c'è la chiave Gemini (solo nel browser dell'utente) usa la voce AI naturale e la tiene in memoria; altrimenti la migliore voce italiana del telefono.
(function(){
  'use strict';
  const AUTO = 'jrpg_story_auto', MODEL_K = 'jrpg_tts_model', VOICE_K = 'jrpg_tts_voice', CACHE = 'rt_voce1';
  const ls = {get: k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set: (k, v)=>{ try{ localStorage.setItem(k, v); }catch(e){} }};
  const autoOn = ()=> ls.get(AUTO) !== 'off';
  let cur = null, audio = null, token = 0, autoFor = null, state = 'idle';
  const plain = h=>{ const d = document.createElement('div'); d.innerHTML = String(h || '').replace(/<\/(p|div|li|h\d)>/gi, '. '); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const sent = s=> /[.!?…]$/.test(s) ? s : s + '.';

  // testo: PRIMA la storia, POI le informazioni principali
  function textFor(g){
    const e = g.enrich || {}, l = g.label || {};
    const story = plain(g.story);
    const info = [g.name + (g.year ? ', uscito nel ' + g.year : '') + '.', g.tier && g.tier !== 'ND' ? 'Tier ' + g.tier + ', voto ' + g.score + ' su 100.' : '', plain(e.whyLikeIt), (e.pros || []).length ? 'Punti di forza: ' + e.pros.map(plain).join('; ') + '.' : '', (e.cons || []).length ? 'Difetti: ' + e.cons.map(plain).join('; ') + '.' : '', l.h ? 'Dura circa ' + l.h + ' ore per la storia principale.' : ''].filter(Boolean).map(sent);
    return {story, info: info.join(' ')};
  }

  // ---- voce AI (Gemini): audio grezzo → file WAV
  function wav(pcm, rate){
    const n = pcm.length, b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, s)=> { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n, true);
    new Uint8Array(b, 44).set(pcm); return new Blob([b], {type: 'audio/wav'});
  }
  const hash = s=>{ let h = 5381; for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  // ---- v225: motore e voce scelti dall'utente. Google a settembre 2026 ha cambiato i modelli della voce (Gemini 3.8 TTS) e il modo di chiamarli
  // (/v1beta/interactions): la vecchia chiamata falliva e partiva la voce del telefono. Ora provo i modelli nuovi e poi i vecchi; quello che funziona lo ricordo.
  const ENG_K = 'jrpg_tts_engine', PV_K = 'jrpg_tts_phone_voice', OK_K = 'rt_tts_ok', ERR_K = 'rt_tts_err';
  const VOICES = [
    {id: 'Charon', g: 'u', d: 'narratore, chiaro'}, {id: 'Orus', g: 'u', d: 'profonda, decisa'}, {id: 'Algieba', g: 'u', d: 'vellutata'}, {id: 'Iapetus', g: 'u', d: 'limpida'},
    {id: 'Sadaltager', g: 'u', d: 'esperto, calmo'}, {id: 'Puck', g: 'u', d: 'allegra'}, {id: 'Algenib', g: 'u', d: 'ruvida'}, {id: 'Fenrir', g: 'u', d: 'energica'},
    {id: 'Sulafat', g: 'd', d: 'calda'}, {id: 'Kore', g: 'd', d: 'decisa'}, {id: 'Aoede', g: 'd', d: 'leggera'}, {id: 'Achernar', g: 'd', d: 'morbida'},
    {id: 'Vindemiatrix', g: 'd', d: 'gentile'}, {id: 'Gacrux', g: 'd', d: 'matura'}, {id: 'Leda', g: 'd', d: 'giovane'}, {id: 'Despina', g: 'd', d: 'vellutata'}
  ];
  const engine = ()=> ls.get(ENG_K) === 'phone' ? 'phone' : 'ai';
  const voiceId = ()=>{ const v = ls.get(VOICE_K); return VOICES.some(x=> x.id === v) ? v : 'Charon'; };
  const STYLE = 'narratore italiano caldo e coinvolgente, ritmo disteso, pause naturali';
  // modelli in ordine: [modello, tipo di chiamata]
  const MODELS = [['gemini-3.8-flash-tts', 'ix'], ['gemini-3.8-flash-lite-tts', 'ix'], ['gemini-3.1-flash-tts-preview', 'gc'], ['gemini-2.5-flash-preview-tts', 'gc'], ['gemini-2.5-pro-preview-tts', 'gc']];
  const b64 = d=>{ const bin = atob(d), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  function findAudio(o, depth){        // cerca nella risposta il pezzo audio (forma nuova «steps[].content[]» o vecchia «inlineData»)
    if(!o || typeof o !== 'object' || depth > 8) return null;
    if(o.inlineData && o.inlineData.data) return {data: o.inlineData.data, mime: o.inlineData.mimeType || ''};
    if((o.type === 'audio' || /^audio\//.test(o.mime_type || o.mimeType || '')) && typeof o.data === 'string') return {data: o.data, mime: o.mime_type || o.mimeType || 'audio/wav'};
    for(const k in o){ const r = findAudio(o[k], depth + 1); if(r) return r; }
    return null;
  }
  async function post(url, body){
    const r = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': geminiKey()}, body: JSON.stringify(body)});
    if(!r.ok){ let m = ''; try{ const j = await r.json(); m = (j.error && j.error.message) || ''; }catch(e){} const e = new Error(m || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return r.json();
  }
  async function callModel(model, kind, text, voice){
    let j;
    if(kind === 'ix') j = await post('https://generativelanguage.googleapis.com/v1beta/interactions', {model, input: [{type: 'user_input', content: [{type: 'text', text, annotations: [{type: 'speech_metadata', style: STYLE}]}]}], response_format: {type: 'audio', mime_type: 'audio/wav', sample_rate: 24000}, generation_config: {speech_config: [{voice}]}});
    else j = await post('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {contents: [{parts: [{text: 'Leggi questo testo in italiano come un ' + STYLE + ':\n\n' + text}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}}}}});
    const a = findAudio(j, 0); if(!a) throw Object.assign(new Error('risposta senza audio'), {status: 0});
    const u = b64(a.data);
    if(/wav/i.test(a.mime) || (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46)) return new Blob([u], {type: 'audio/wav'});
    if(/mpeg|mp3|ogg|opus/i.test(a.mime)) return new Blob([u], {type: a.mime});
    return wav(u, +((/rate=(\d+)/.exec(a.mime) || [])[1]) || 24000);          // audio grezzo (PCM 24 kHz): gli aggiungo l'intestazione WAV
  }
  async function aiAudio(text, voiceOver){
    if(typeof geminiKey !== 'function' || !geminiKey()){ ls.set(ERR_K, 'manca la chiave Gemini (⚙️ Impostazioni → AI)'); throw new Error('nokey'); }
    const voice = voiceOver || voiceId();
    const key = 'https://rt.local/voce2/' + voice + '/' + hash(text);
    let c = null; try{ c = window.caches ? await caches.open(CACHE) : null; if(c){ const hit = await c.match(key); if(hit) return await hit.blob(); } }catch(e){}
    const ok = ls.get(OK_K), order = MODELS.slice().sort((x, y)=> (y[0] === ok) - (x[0] === ok));
    let last = null;
    for(const [m, kind] of order){
      try{
        const blob = await callModel(m, kind, text, voice);
        ls.set(OK_K, m); ls.set(ERR_K, '');
        try{ if(c) await c.put(key, new Response(blob, {headers: {'content-type': blob.type}})); }catch(e){}
        return blob;
      }catch(e){
        last = e;
        if(e.status === 403 || e.status === 401 || (e.status === 400 && /api key/i.test(e.message))){ ls.set(ERR_K, 'la chiave Gemini non è valida'); throw e; }
        if(e.status === 429){ ls.set(ERR_K, 'quota della voce AI finita per ora (riprova più tardi)'); throw e; }
      }
    }
    ls.set(ERR_K, 'nessun modello di voce risponde (' + (last && last.message || 'errore') + ')'); throw last || new Error('tts');
  }
  // testo a pezzi: primo pezzo breve (parte presto), poi pezzi da ~600 caratteri tagliati a fine frase
  function chunks(t){
    const ss = t.match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) || [t], out = []; let cur = '';
    const lim = ()=> out.length === 0 ? 170 : 600;
    if(ss[0] && ss[0].length > 200){ const f = ss[0], m = f.slice(80, 190).lastIndexOf(', '); if(m > 0){ ss.splice(0, 1, f.slice(0, 80 + m + 1) + ' ', f.slice(80 + m + 2)); } }      // prima frase lunghissima: taglio alla virgola, per partire prima
    for(const x of ss){ if(cur && (cur + x).length > lim()){ out.push(cur.trim()); cur = ''; } cur += x; }
    if(cur.trim()) out.push(cur.trim());
    return out;
  }
  // ---- voce del telefono (riserva)
  function itVoice(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [], it = vs.filter(v=> /^it(-|_|$)/i.test(v.lang));
    const pick = ls.get(PV_K); if(pick){ const f = it.find(v=> v.name === pick); if(f) return f; }
    return it.find(v=> /natural|premium|enhanced|neural|online/i.test(v.name)) || it.find(v=> /google/i.test(v.name)) || it[0] || null;
  }
  function browserSpeak(t, done){
    if(!window.speechSynthesis) return done(false);
    speechSynthesis.cancel();
    const parts = t.match(/[^.!?;:]+[.!?;:]?/g) || [t], v = itVoice();
    parts.forEach((p, i)=>{ const u = new SpeechSynthesisUtterance(p.trim()); u.lang = 'it-IT'; if(v) u.voice = v; u.rate = .97; if(i === parts.length - 1){ u.onend = ()=> done(true); u.onerror = ()=> done(true); } speechSynthesis.speak(u); });
  }

  // ---- stato e tasti
  const btn = ()=> document.getElementById('vcBtn'), tog = ()=> document.getElementById('vcAuto');
  const duck = on=>{ try{ window.rtMusic && rtMusic.duck && rtMusic.duck(on); }catch(e){} };      // v224: mentre la voce parla la musica scende al 25% e poi risale piano
  function paint(){
    const b = btn(); if(b){ b.dataset.s = state; b.querySelector('span').textContent = state === 'idle' ? 'Ascolta la storia' : state === 'load' ? 'Preparo la voce…' : 'Ferma'; b.setAttribute('aria-label', b.querySelector('span').textContent); }
    const t = tog(); if(t){ t.setAttribute('aria-checked', autoOn() ? 'true' : 'false'); t.classList.toggle('on', autoOn()); }
  }
  function stop(){
    token++; state = 'idle';
    try{ if(audio){ audio.pause(); URL.revokeObjectURL(audio.src); audio = null; } }catch(e){}
    try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){}
    duck(false); paint();
  }
  async function play(g){
    stop(); const my = ++token; state = 'load'; paint();
    const T = textFor(g), full = [T.story, T.info].filter(Boolean).join(' ');
    if(!full){ state = 'idle'; paint(); return; }
    const fin = ()=>{ if(my === token){ state = 'idle'; duck(false); paint(); } };
    // v225: a pezzi. Il primo è corto (1-2 frasi): la voce AI lo prepara in 1-2 secondi e parte; gli altri si preparano mentre ascolti
    if(engine() === 'ai'){
      const parts = chunks(full.slice(0, 6000)), jobs = [];
      const get = i=>{ if(i >= parts.length) return null; if(!jobs[i]){ jobs[i] = aiAudio(parts[i]); jobs[i].catch(()=>{}); } return jobs[i]; };
      get(0); get(1);
      for(let i = 0; i < parts.length; i++){
        let blob = null;
        try{ blob = await get(i); }catch(e){
          if(my !== token) return;
          if(!play.warned){ play.warned = 1; try{ XUI.toast('Voce AI non disponibile: ' + (ls.get(ERR_K) || 'errore') + '. Uso la voce del telefono', 4500); }catch(_){} }
          state = 'play'; duck(true); paint(); browserSpeak(parts.slice(i).join(' '), fin); return;          // il resto con la voce del telefono
        }
        if(my !== token) return;
        get(i + 1); get(i + 2);
        const ok = await new Promise(res=>{
          audio = new Audio(URL.createObjectURL(blob)); audio.onended = ()=> res(true); audio.onerror = ()=> res(false);
          audio.play().then(()=>{ if(my === token && state !== 'play'){ state = 'play'; duck(true); paint(); } }, ()=> res(false));     // il browser può rifiutare l'avvio automatico: resta il tasto
        });
        try{ URL.revokeObjectURL(audio.src); }catch(e){}
        if(my !== token) return;
        if(!ok && state !== 'play'){ fin(); return; }
      }
      fin(); return;
    }
    state = 'play'; duck(true); paint(); browserSpeak(full, fin);
  }

  // ---- v225: finestra «Voce della lettura»: motore (AI o telefono), voce maschile/femminile, prova
  const SAMPLE = 'Ciao! Sono la voce che ti racconterà le storie dei tuoi giochi. Ti piace come suono?';
  async function sample(btnEl, fn){
    stop(); const my = ++token; const old = btnEl ? btnEl.innerHTML : ''; if(btnEl) btnEl.classList.add('vs-load');
    const end = ()=>{ if(btnEl) btnEl.classList.remove('vs-load'); };
    try{ await fn(my); }catch(e){ end(); try{ XUI.toast('Voce AI non disponibile: ' + (ls.get(ERR_K) || 'errore'), 4000); }catch(_){} paintSet(); return; }
    end(); paintSet();
  }
  function playBlob(blob, my){ return new Promise(res=>{ if(my !== token) return res(); audio = new Audio(URL.createObjectURL(blob)); audio.onended = ()=>{ duck(false); res(); }; audio.onerror = ()=> res(); audio.play().then(()=> duck(true), ()=> res()); }); }
  function paintSet(){
    const b = document.querySelector('#xVoce .x-body'); if(!b) return;
    b.querySelectorAll('[data-eng]').forEach(x=> x.classList.toggle('on', x.dataset.eng === engine()));
    b.querySelectorAll('[data-vv]').forEach(x=> x.classList.toggle('on', x.dataset.vv === voiceId()));
    const cur = (window.speechSynthesis && itVoice()) || null;
    b.querySelectorAll('[data-pv]').forEach(x=> x.classList.toggle('on', !!cur && x.dataset.pv === cur.name));
    const st = b.querySelector('.vs-st'), hasKey = typeof geminiKey === 'function' && !!geminiKey(), err = ls.get(ERR_K), ok = ls.get(OK_K);
    if(st) st.textContent = !hasKey ? '⚠️ Per la voce AI serve la chiave Gemini (⚙️ Impostazioni → AI). Senza chiave uso la voce del telefono.' : err ? '⚠️ Ultimo tentativo: ' + err + '.' : ok ? '✅ Voce AI funzionante (' + ok + ').' : 'Tocca una voce per sentirla (la prima volta ci vogliono alcuni secondi).';
    const ai = b.querySelector('.vs-ai'), ph = b.querySelector('.vs-ph'); if(ai) ai.hidden = engine() !== 'ai'; if(ph) ph.hidden = engine() !== 'phone';
  }
  function openSettings(){
    if(!window.XUI) return;
    const chip = v=> `<button type="button" class="vs-chip" data-vv="${v.id}"><b>${v.id}</b><small>${v.d}</small></button>`;
    const phone = ((window.speechSynthesis && speechSynthesis.getVoices()) || []).filter(v=> /^it(-|_|$)/i.test(v.lang));
    const b = XUI.sheet('xVoce', '🔊 Voce della lettura', `
      <div class="vs-eng"><button type="button" class="vs-e" data-eng="ai"><b>✨ Voce AI</b><small>Gemini: naturale, come una persona</small></button><button type="button" class="vs-e" data-eng="phone"><b>📱 Voce del telefono</b><small>subito pronta, senza internet</small></button></div>
      <div class="lp-sub vs-st"></div>
      <div class="vs-ai"><div class="an-h">👨 Voci maschili</div><div class="vs-grid">${VOICES.filter(v=> v.g === 'u').map(chip).join('')}</div>
        <div class="an-h">👩 Voci femminili</div><div class="vs-grid">${VOICES.filter(v=> v.g === 'd').map(chip).join('')}</div>
        <div class="lp-sub">Tocca una voce: la scelgo e te la faccio sentire. Ogni storia letta resta salvata sul telefono: la seconda volta parte subito e non consuma.</div></div>
      <div class="vs-ph"><div class="an-h">Voci italiane di questo telefono</div><div class="vs-grid">${phone.length ? phone.map(v=> `<button type="button" class="vs-chip" data-pv="${esc(v.name)}"><b>${esc(v.name.replace(/^(Microsoft|Google)\s*/i, ''))}</b><small>${v.localService ? 'sul telefono' : 'online'}</small></button>`).join('') : '<div class="lp-sub">Il telefono non ha voci italiane installate.</div>'}</div></div>`);
    b.querySelectorAll('[data-eng]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(ENG_K, x.dataset.eng); play.warned = 0; paintSet(); }));
    b.querySelectorAll('[data-vv]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(VOICE_K, x.dataset.vv); paintSet(); sample(x, async my=>{ const bl = await aiAudio(SAMPLE, x.dataset.vv); await playBlob(bl, my); }); }));
    b.querySelectorAll('[data-pv]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(PV_K, x.dataset.pv); paintSet(); stop(); browserSpeak(SAMPLE, ()=>{}); }));
    paintSet();
  }
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      const card = document.getElementById('modalCard'); if(!card || !g) return r;
      const head = card.querySelector('.modal-head'); if(!head || card.querySelector('.vc-row')) return r;
      if(!cur || cur.id !== g.id){ stop(); autoFor = null; }
      cur = g;
      head.insertAdjacentHTML('afterend', `<div class="vc-row"><button type="button" class="vc-btn" id="vcBtn" data-s="${state}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path class="vc-p" d="M8 5v14l11-7z"/><path class="vc-s" d="M7 7h10v10H7z"/></svg><span>Ascolta la storia</span></button><button type="button" role="switch" class="vc-auto" id="vcAuto" aria-label="Avvio automatico della lettura"><i></i><b>Auto</b></button><button type="button" class="vc-set" id="vcSet" aria-label="Scegli la voce" title="Scegli la voce">${engine() === 'ai' ? voiceId() : 'Telefono'} ▾</button></div>`);
      paint();
      btn().addEventListener('click', ()=>{ if(state === 'idle') play(cur); else stop(); });
      document.getElementById('vcSet').addEventListener('click', openSettings);
      tog().addEventListener('click', ()=>{ ls.set(AUTO, autoOn() ? 'off' : 'on'); paint(); if(!autoOn() && state !== 'idle') stop(); else if(autoOn() && state === 'idle'){ autoFor = cur.id; play(cur); } });
      // avvio automatico: un po' dopo l'apertura (animazione finita, scheda ferma), una volta sola per apertura
      if(autoOn() && autoFor !== g.id && state === 'idle'){
        autoFor = g.id; const id = g.id, t0 = token;
        (window.rtSettle ? rtSettle(1800) : new Promise(r=> setTimeout(r, 1800))).then(()=>{
          const bd = document.getElementById('modalBackdrop');
          if(cur && cur.id === id && token === t0 && state === 'idle' && autoOn() && bd && bd.classList.contains('show') && !document.hidden) play(cur);
        });
      }
    }catch(e){}
    return r;
  };
  // scheda chiusa o app in secondo piano: silenzio
  try{ const bd = document.getElementById('modalBackdrop'); if(bd) new MutationObserver(()=>{ if(!bd.classList.contains('show')){ if(state !== 'idle') stop(); autoFor = null; cur = null; } }).observe(bd, {attributes: true, attributeFilter: ['class']}); }catch(e){}
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && state !== 'idle') stop(); });
  window.rtStory = {play, stop, text: textFor, settings: openSettings, _chunks: chunks, _wav: wav, _find: findAudio};
})();
