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
  async function aiAudio(text){
    if(typeof geminiKey !== 'function' || !geminiKey() || typeof geminiFetch !== 'function') return null;
    const model = ls.get(MODEL_K) || 'gemini-2.5-flash-preview-tts', voice = ls.get(VOICE_K) || 'Kore';
    const key = 'https://rt.local/voce/' + model + '/' + voice + '/' + hash(text);
    let c = null; try{ c = window.caches ? await caches.open(CACHE) : null; if(c){ const hit = await c.match(key); if(hit) return await hit.blob(); } }catch(e){}
    const body = {contents: [{parts: [{text: 'Leggi in italiano, con voce calda e naturale da narratore, ritmo disteso: ' + text}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}}}}};
    const j = await (await geminiFetch(body, null, model)).json();
    const p = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    const d = p && p.find(x=> x.inlineData && x.inlineData.data); if(!d) return null;
    const rate = +((/rate=(\d+)/.exec(d.inlineData.mimeType || '') || [])[1]) || 24000;
    const bin = atob(d.inlineData.data), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const blob = wav(u, rate);
    try{ if(c) await c.put(key, new Response(blob, {headers: {'content-type': 'audio/wav'}})); }catch(e){}
    return blob;
  }
  // ---- voce del telefono (riserva)
  function itVoice(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [], it = vs.filter(v=> /^it(-|_|$)/i.test(v.lang));
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
    let blob = null;
    try{ blob = await aiAudio(full.slice(0, 4000)); }catch(e){ if(!play.warned){ play.warned = 1; try{ XUI.toast('Voce AI non disponibile ora: uso quella del telefono', 3000); }catch(_){} } }
    if(my !== token) return;
    if(blob){
      audio = new Audio(URL.createObjectURL(blob)); audio.onended = fin; audio.onerror = fin;
      try{ await audio.play(); if(my === token){ state = 'play'; duck(true); paint(); } }catch(e){ fin(); }       // il browser può rifiutare l'avvio automatico: in quel caso resta il tasto
      return;
    }
    state = 'play'; duck(true); paint(); browserSpeak(full, fin);
  }

  const origOpen = window.openModal;
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      const card = document.getElementById('modalCard'); if(!card || !g) return r;
      const head = card.querySelector('.modal-head'); if(!head || card.querySelector('.vc-row')) return r;
      if(!cur || cur.id !== g.id){ stop(); autoFor = null; }
      cur = g;
      head.insertAdjacentHTML('afterend', `<div class="vc-row"><button type="button" class="vc-btn" id="vcBtn" data-s="${state}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path class="vc-p" d="M8 5v14l11-7z"/><path class="vc-s" d="M7 7h10v10H7z"/></svg><span>Ascolta la storia</span></button><button type="button" role="switch" class="vc-auto" id="vcAuto" aria-label="Avvio automatico della lettura"><i></i><b>Auto</b></button></div>`);
      paint();
      btn().addEventListener('click', ()=>{ if(state === 'idle') play(cur); else stop(); });
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
  window.rtStory = {play, stop, text: textFor, _wav: wav};
})();
