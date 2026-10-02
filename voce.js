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
  const ENG_K = 'jrpg_tts_engine', PV_K = 'jrpg_tts_phone_voice', OK_K = 'rt_tts_ok', ERR_K = 'rt_tts_err', DAY_K = 'rt_tts_dayout';
  const VOICES = [
    {id: 'Charon', g: 'u', d: 'narratore, chiaro'}, {id: 'Orus', g: 'u', d: 'profonda, decisa'}, {id: 'Algieba', g: 'u', d: 'vellutata'}, {id: 'Iapetus', g: 'u', d: 'limpida'},
    {id: 'Sadaltager', g: 'u', d: 'esperto, calmo'}, {id: 'Puck', g: 'u', d: 'allegra'}, {id: 'Algenib', g: 'u', d: 'ruvida'}, {id: 'Fenrir', g: 'u', d: 'energica'},
    {id: 'Sulafat', g: 'd', d: 'calda'}, {id: 'Kore', g: 'd', d: 'decisa'}, {id: 'Aoede', g: 'd', d: 'leggera'}, {id: 'Achernar', g: 'd', d: 'morbida'},
    {id: 'Vindemiatrix', g: 'd', d: 'gentile'}, {id: 'Gacrux', g: 'd', d: 'matura'}, {id: 'Leda', g: 'd', d: 'giovane'}, {id: 'Despina', g: 'd', d: 'vellutata'}
  ];
  // v243: 4 motori — 'ai' Gemini · 'cloud' Google Cloud Voce (stessa chiave, voci HD, velocissima) · 'gtr' Google Traduttore (senza chiave, voce unica) · 'phone' voce del telefono
  const ENGINES = ['ai', 'cloud', 'gtr', 'phone'];
  const engine = ()=>{ const e = ls.get(ENG_K); return ENGINES.includes(e) ? e : 'ai'; };
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
    let r;
    try{ r = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': geminiKey()}, body: JSON.stringify(body)}); }
    catch(e){ throw Object.assign(new Error('rete'), {status: -1}); }
    if(!r.ok){
      let m = '', det = []; try{ const j = await r.json(); m = (j.error && j.error.message) || ''; det = (j.error && j.error.details) || []; }catch(e){}
      const e = new Error(m || ('HTTP ' + r.status)); e.status = r.status;
      if(r.status === 429){       // Google dice quanto aspettare («23s») e se è finita la quota del minuto o del giorno
        const rd = det.map(d=> d && d.retryDelay).filter(Boolean)[0], hm = /retry in ([\d.]+)\s*s/i.exec(m); e.retryMs = rd ? parseFloat(rd) * 1000 : hm ? parseFloat(hm[1]) * 1000 : 0;
        const ids = []; det.forEach(d=> ((d && d.violations) || []).forEach(v=> ids.push(String(v.quotaId || v.quotaMetric || '')))); const txt = ids.join(' ') + ' ' + m;
        e.perDay = (/PerDay|per[ _]day|daily/i.test(txt) && !/PerMinute|per[ _]minute/i.test(txt)) || /limit:\s*0\b/i.test(m);      // v253: «limit: 0» = per questo modello la quota gratuita non c'è proprio: inutile aspettare      // v252: Google mette «riprova tra 60 s» anche quando è finita la quota del GIORNO: conta il tipo di quota, non l'attesa
      }
      throw e;
    }
    return r.json();
  }
  async function callModel(model, kind, text, voice){
    let j;
    if(kind === 'ix') j = await post('https://generativelanguage.googleapis.com/v1beta/interactions', {model, input: [{type: 'user_input', content: [{type: 'text', text, annotations: [{type: 'speech_metadata', style: STYLE}]}]}], response_format: {type: 'audio', mime_type: 'audio/wav', sample_rate: 24000}, generation_config: {speech_config: [{voice}]}});
    else j = await post('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {contents: [{parts: [{text: 'Leggi questo testo in italiano come un ' + STYLE + ':\n\n' + text}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}}}}});
    const a = findAudio(j, 0); if(!a) throw Object.assign(new Error('risposta senza audio'), {status: 0});
    // v227: decodifica dell'audio fuori dal filo principale (prima un ciclo su milioni di caratteri: scatti mentre scorrevi)
    const raw = await (await fetch('data:application/octet-stream;base64,' + a.data)).arrayBuffer(), u = new Uint8Array(raw);
    if(/wav/i.test(a.mime) || (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46)) return new Blob([u], {type: 'audio/wav'});
    if(/mpeg|mp3|ogg|opus/i.test(a.mime)) return new Blob([u], {type: a.mime});
    return wav(u, +((/rate=(\d+)/.exec(a.mime) || [])[1]) || 24000);          // audio grezzo (PCM 24 kHz): gli aggiungo l'intestazione WAV
  }
  // v226: UNA richiesta alla volta (prima partivano insieme 3 pezzi × modelli e Google rispondeva «troppe richieste» → falso «quota finita»).
  // Se Google dice «aspetta N secondi» aspetto e riprovo da sola; se è finita la quota del giorno di un modello passo al successivo (ognuno ha la sua).
  let queue = Promise.resolve();
  const serial = fn=>{ const p = queue.catch(()=>{}).then(fn); queue = p.catch(()=>{}); return p; };
  const badModels = new Set(), dayOut = {}, coolUntil = {};      // v250: coolUntil = modello «occupato» fino a quell'ora: non aspetto, uso un'altra voce
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));
  let onWait = null;          // chi aspetta (il tasto) riceve il messaggio «riprovo tra N s»
  async function aiAudio(text, voiceOver, tk){
    if(typeof geminiKey !== 'function' || !geminiKey()){ ls.set(ERR_K, 'manca la chiave Gemini (⚙️ Impostazioni → AI)'); throw Object.assign(new Error('nokey'), {fatal: true}); }
    const voice = voiceOver || voiceId();
    const key = 'https://rt.local/voce2/' + voice + '/' + hash(text);
    let c = null; try{ c = window.caches ? await caches.open(CACHE) : null; if(c){ const hit = await c.match(key); if(hit) return await hit.blob(); } }catch(e){}
    return serial(async ()=>{
      // v252: ogni modello ha la sua quota. Se uno è «occupato» (attesa lunga) o ha finito la quota del giorno provo SUBITO gli altri;
      // aspetto (massimo 60 s, conto alla rovescia sul tasto) solo se sono occupati tutti. La quota del giorno finita resta segnata fino a domani.
      const ok = ls.get(OK_K), today = new Date().toDateString();
      try{ const d = JSON.parse(ls.get(DAY_K) || '{}'); if(d.day === today) (d.m || []).forEach(m=> dayOut[m] = today); }catch(e){}
      const markDay = m=>{ dayOut[m] = today; ls.set(DAY_K, JSON.stringify({day: today, m: MODELS.map(([x])=> x).filter(x=> dayOut[x] === today)})); };
      const stopped = ()=> tk != null && tk !== token;
      let last = null;
      for(let round = 0; round < 3; round++){
        const order = MODELS.filter(([m])=> !badModels.has(m) && dayOut[m] !== today).sort((x, y)=> (y[0] === ok) - (x[0] === ok));
        if(!order.length) break;
        const now = Date.now(), ready = order.filter(([m])=> !(coolUntil[m] > now));
        if(!ready.length){
          const w = Math.min(60000, Math.max(1000, Math.min(...order.map(([m])=> coolUntil[m])) - now));
          if(onWait) onWait(Math.ceil(w / 1000)); await sleep(w + 300);
          if(stopped()) throw Object.assign(new Error('fermato'), {stopped: true});
          continue;
        }
        for(const [m, kind] of ready){
          for(let tries = 0; tries < 3; tries++){
            if(stopped()) throw Object.assign(new Error('fermato'), {stopped: true});
            try{
              const blob = await callModel(m, kind, text, voice);
              ls.set(OK_K, m); ls.set(ERR_K, ''); delete coolUntil[m];
              try{ if(c) await c.put(key, new Response(blob, {headers: {'content-type': blob.type}})); }catch(e){}
              return blob;
            }catch(e){
              last = e;
              if(e.status === 401 || e.status === 403 || (e.status === 400 && /api key/i.test(e.message))){ ls.set(ERR_K, 'la chiave Gemini non è valida'); e.fatal = true; throw e; }
              if(e.status === 404 || (e.status === 400 && /model|not found|not supported|unknown/i.test(e.message))){ badModels.add(m); break; }      // modello che non c'è: il prossimo
              if(e.status === 429 && e.perDay){ markDay(m); break; }                    // quota del giorno di questo modello: il prossimo
              if(e.status === 429){ const w = Math.max(1500, e.retryMs || 4000 * (tries + 1)); if(w <= 6000 && tries < 2){ if(onWait) onWait(Math.ceil(w / 1000)); await sleep(w + 300); continue; } coolUntil[m] = Date.now() + w; break; }      // attesa lunga: provo subito un altro modello
              if((e.status === -1 || e.status >= 500 || e.status === 0) && tries < 2){ if(onWait) onWait(2); await sleep(1500 * (tries + 1)); continue; }   // rete o Google occupato: riprovo
              break;
            }
          }
        }
      }
      const allDay = MODELS.every(([m])=> badModels.has(m) || dayOut[m] === today);
      ls.set(ERR_K, allDay && MODELS.some(([m])=> dayOut[m] === today) ? 'oggi la quota gratuita della voce Gemini è finita su tutti i modelli (torna domani)' : last && last.status === 429 ? 'Gemini è occupato in questo momento' : 'Gemini non risponde (' + (last && last.message || 'errore') + ')');
      throw last || new Error('tts');
    });
  }
  // testo a pezzi: primo pezzo breve (parte presto), poi pezzi da ~600 caratteri tagliati a fine frase
  function chunks(t){
    const ss = t.match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) || [t], out = []; let cur = '';
    const lim = ()=> out.length === 0 ? 170 : 1500;
    if(ss[0] && ss[0].length > 200){ const f = ss[0], m = f.slice(80, 190).lastIndexOf(', '); if(m > 0){ ss.splice(0, 1, f.slice(0, 80 + m + 1) + ' ', f.slice(80 + m + 2)); } }      // prima frase lunghissima: taglio alla virgola, per partire prima
    for(const x of ss){ if(cur && (cur + x).length > lim()){ out.push(cur.trim()); cur = ''; } cur += x; }
    if(cur.trim()) out.push(cur.trim());
    return out;
  }
  // v243: Gemini gratis concede poche richieste al minuto: troppi pezzi = «aspetta» = la voce si ferma a metà.
  // Ora AL MASSIMO 3 richieste: un pezzo corto per partire subito, uno medio, e il resto; si preparano in fila appena premi «Ascolta».
  function plan(t, sizes){
    const ss = t.match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) || [t], out = []; let cur = '';
    for(const x of ss){ const lim = sizes[Math.min(out.length, sizes.length - 1)]; if(cur && (cur + x).length > lim && out.length < sizes.length - 1){ out.push(cur.trim()); cur = ''; } cur += x; }
    if(cur.trim()) out.push(cur.trim());
    return out;
  }
  // ---- Google Cloud Voce (Text-to-Speech ufficiale): usa la chiave Gemini se nel suo progetto Google è attiva la «Cloud Text-to-Speech API»
  const CV_K = 'jrpg_tts_cloud_voice', CVL_K = 'rt_tts_cloud_voices';
  const cloudErr = (st, m)=>{ if(st === 403 && /disabled|not been used|SERVICE_DISABLED|has not been enabled/i.test(m)) return 'nel progetto Google della tua chiave va attivata la «Cloud Text-to-Speech API» (una volta sola, gratis fino a 1 milione di caratteri al mese)'; if(st === 403 && /blocked|API_KEY_SERVICE_BLOCKED|restrict/i.test(m)) return 'la tua chiave Gemini è limitata solo a Gemini, quindi la voce Google Cloud non la accetta'; if(st === 400 && /api key/i.test(m) || st === 401 || st === 403) return 'la chiave non è accettata dalla voce Google Cloud'; if(st === 429) return 'troppe richieste, riprova tra un minuto'; return m || ('errore ' + st); };
  async function cloudFetch(url, body){
    if(typeof geminiKey !== 'function' || !geminiKey()) throw Object.assign(new Error('manca la chiave Gemini (⚙️ Impostazioni → AI)'), {fatal: true});
    let r; try{ r = await fetch(url, {method: body ? 'POST' : 'GET', headers: Object.assign({'x-goog-api-key': geminiKey()}, body ? {'Content-Type': 'application/json'} : {}), body: body ? JSON.stringify(body) : undefined}); }
    catch(e){ throw Object.assign(new Error('rete non disponibile'), {status: -1}); }
    if(!r.ok){ let m = ''; try{ const j = await r.json(); m = (j.error && j.error.message) || ''; }catch(e){} const e = new Error(cloudErr(r.status, m)); e.status = r.status; e.fatal = r.status === 403 || r.status === 401; throw e; }
    return r.json();
  }
  async function cloudVoices(force){
    try{ const c = JSON.parse(ls.get(CVL_K) || 'null'); if(!force && c && Date.now() - c.t < 7 * 864e5 && c.v.length) return c.v; }catch(e){}
    const j = await cloudFetch('https://texttospeech.googleapis.com/v1/voices?languageCode=it-IT');
    const rank = n=> /Chirp3-HD/.test(n) ? 0 : /Chirp-HD/.test(n) ? 1 : /Studio/.test(n) ? 2 : /Neural2/.test(n) ? 3 : /Wavenet/.test(n) ? 4 : 9;
    const v = ((j && j.voices) || []).filter(x=> (x.languageCodes || []).some(l=> /^it-IT/i.test(l)) && rank(x.name) < 9).map(x=> ({id: x.name, g: x.ssmlGender === 'FEMALE' ? 'd' : 'u', q: rank(x.name)})).sort((a, b)=> a.q - b.q || a.id.localeCompare(b.id));
    ls.set(CVL_K, JSON.stringify({t: Date.now(), v})); return v;
  }
  const cloudVoice = ()=> ls.get(CV_K) || 'it-IT-Chirp3-HD-Charon';
  async function cloudAudio(text, voiceOver){
    const voice = voiceOver || cloudVoice(), key = 'https://rt.local/cloud1/' + voice + '/' + hash(text);
    let c = null; try{ c = window.caches ? await caches.open(CACHE) : null; if(c){ const hit = await c.match(key); if(hit) return await hit.blob(); } }catch(e){}
    try{
      const j = await cloudFetch('https://texttospeech.googleapis.com/v1/text:synthesize', {input: {text}, voice: {languageCode: 'it-IT', name: voice}, audioConfig: {audioEncoding: 'MP3', speakingRate: 1.0}});
      const u = new Uint8Array(await (await fetch('data:audio/mpeg;base64,' + j.audioContent)).arrayBuffer()), blob = new Blob([u], {type: 'audio/mpeg'});
      ls.set(ERR_K + '_cloud', ''); try{ if(c) await c.put(key, new Response(blob, {headers: {'content-type': 'audio/mpeg'}})); }catch(e){}
      return blob;
    }catch(e){ ls.set(ERR_K + '_cloud', e.message); throw e; }
  }
  // ---- Google Traduttore: voce unica, senza chiave; pezzi da massimo ~190 caratteri (limite del servizio), l'audio lo suona direttamente il lettore
  const gtrUrl = t=> 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=it&ttsspeed=1&q=' + encodeURIComponent(t);
  // v249: Google Traduttore rifiuta la voce (404) quando la richiesta dice da quale sito arriva. Solo per questi audio il sito non si presenta;
  // appena la richiesta è partita rimetto la regola normale (tutte le altre richieste restano come prima).
  let refMeta = null, refN = 0;
  function noRefAudio(src){
    if(!refMeta){ refMeta = document.createElement('meta'); refMeta.name = 'referrer'; refMeta.content = 'strict-origin-when-cross-origin'; document.head.appendChild(refMeta); }
    refN++; refMeta.content = 'no-referrer';
    const a = new Audio(); let done = false;
    const off = ()=>{ if(done) return; done = true; if(--refN <= 0){ refN = 0; refMeta.content = 'strict-origin-when-cross-origin'; } };
    a.addEventListener('loadstart', ()=> setTimeout(off, 0), {once: true}); a.addEventListener('error', off, {once: true}); setTimeout(off, 2500);
    a.preload = 'auto'; a.src = src; try{ a.load(); }catch(e){}
    return a;
  }
  function gtrParts(t){
    const out = []; let cur = '';
    (t.match(/[^.!?…;:,]+[.!?…;:,]?\s*/g) || [t]).forEach(x=>{
      while(x.length > 190){ const cut = x.lastIndexOf(' ', 190) > 60 ? x.lastIndexOf(' ', 190) : 190; if(cur.trim()){ out.push(cur.trim()); cur = ''; } out.push(x.slice(0, cut).trim()); x = x.slice(cut); }
      if((cur + x).length > 190 && cur.trim()){ out.push(cur.trim()); cur = ''; } cur += x;
    });
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
  // v249: se una voce non funziona (chiave rifiutata, quota finita, sito che non risponde) NON mi fermo: il resto del testo lo legge la voce successiva.
  // Ordine: quella scelta → Google Traduttore → telefono. L'avviso compare una volta sola per voce.
  const NAMES = {ai: 'Voce Gemini', cloud: 'Voce Google Cloud', gtr: 'Voce Google Traduttore', phone: 'Voce del telefono'};
  const chainOf = e=> e === 'phone' ? ['phone'] : e === 'gtr' ? ['gtr', 'phone'] : [e, 'gtr', 'phone'];
  const warned = {}, skip = {};
  async function play(g, txt){
    stop(); const my = ++token; state = 'load'; paint();
    let full = txt ? String(txt) : ''; if(!full){ const T = textFor(g); full = [T.story, T.info].filter(Boolean).join(' '); }
    if(!full){ state = 'idle'; paint(); return; }
    const fin = ()=>{ if(my === token){ state = 'idle'; duck(false); paint(); } };
    const order = chainOf(engine()).filter((e, i)=> i === 0 || !skip[e]);
    let rest = full;
    for(let n = 0; n < order.length; n++){
      const eng = order[n];
      if(my !== token) return;
      if(eng === 'phone'){ if(!window.speechSynthesis){ try{ XUI.toast('🔊 Non riesco a far partire la voce: riprova', 3000); }catch(_){} fin(); return; } state = 'play'; duck(true); paint(); browserSpeak(rest, fin); return; }
      const r = await runChain(eng, rest, my, g);
      if(my !== token || r.stopped) return;
      if(r.done){ fin(); return; }
      if(r.fatal && eng !== engine()) skip[eng] = 1;
      rest = r.left || rest;
      const nx = order[n + 1];
      if(!warned[eng]){ warned[eng] = 1; try{ XUI.toast('🔊 ' + NAMES[eng] + ': ' + r.why + (nx ? '. Continuo con la ' + NAMES[nx].toLowerCase() : ''), 5000); }catch(_){} }
    }
    fin();
  }
  // lettore «a catena» per Gemini, Google Cloud e Google Traduttore: mentre suona un pezzo, i successivi sono già in preparazione.
  // Risultato: {done} se ha letto tutto, altrimenti {left: testo non ancora letto, why: motivo}.
  async function runChain(eng, text0, my, g){
    const text = text0.slice(0, eng === 'ai' ? 3800 : 6000);
    const parts = eng === 'ai' ? plan(text, [280, 900, 2800]) : eng === 'cloud' ? plan(text, [220, 1400, 1400, 1400, 1400]) : gtrParts(text);
    const make = eng === 'ai' ? (t=> aiAudio(t, null, my).then(b=> URL.createObjectURL(b))) : eng === 'cloud' ? (t=> cloudAudio(t).then(b=> URL.createObjectURL(b))) : (t=> Promise.resolve(gtrUrl(t)));
    const mk = src=>{ if(eng === 'gtr') return noRefAudio(src); const a = new Audio(); a.preload = 'auto'; a.src = src; try{ a.load(); }catch(e){} return a; };
    const jobs = [], AHEAD = eng === 'ai' ? parts.length : 2;
    const get = i=>{ if(i >= parts.length) return null; if(!jobs[i]){ jobs[i] = make(parts[i]); jobs[i].catch(()=>{}); } return jobs[i]; };
    const left = i=> parts.slice(i).join(' ') + (text0.length > text.length ? ' ' + text0.slice(text.length) : '');
    onWait = sec=>{ if(my === token){ const b = btn(); if(b) b.querySelector('span').textContent = 'Gemini occupato, riprovo tra ' + sec + ' s…'; } };
    for(let k = 0; k <= AHEAD; k++) get(k);
    let next = null;          // il pezzo successivo si carica in anticipo (niente silenzi tra un pezzo e l'altro)
    for(let i = 0; i < parts.length; i++){
      let src = null;
      try{ src = await get(i); }catch(e){
        if(my !== token || e.stopped) return {stopped: true};
        return {left: left(i), why: eng === 'ai' ? (ls.get(ERR_K) || 'non risponde ora') : (e.message || 'errore'), fatal: !!e.fatal};
      }
      if(my !== token) return {stopped: true};
      for(let k = i + 1; k <= i + AHEAD; k++) get(k);
      const el = next && next.src === src ? next.a : mk(src);
      next = null;
      Promise.resolve(get(i + 1)).then(u=>{ if(u && my === token) next = {src: u, a: mk(u)}; }).catch(()=>{});
      const ok = await new Promise(res=>{
        audio = el; audio.onended = ()=> res(true); audio.onerror = ()=> res(false);
        audio.play().then(()=>{ if(my === token && state !== 'play'){ state = 'play'; duck(true); paint(); try{ g && window.rtMusic && rtMusic.ensure && rtMusic.ensure(g); }catch(e){} } }, ()=> res(false));
      });
      try{ if(/^blob:/.test(src)) URL.revokeObjectURL(src); }catch(e){}
      if(my !== token) return {stopped: true};
      if(!ok) return {left: left(i), why: eng === 'gtr' ? 'Google non risponde ora' : 'l\'audio non parte'};
      if(state === 'play' && i + 1 < parts.length){ const b = btn(); if(b) b.querySelector('span').textContent = 'Ferma'; }
    }
    return {done: true};
  }
  // v249: leggere ad alta voce un testo qualunque (risposte della «Modalità gioco») con la stessa voce scelta e le stesse riserve
  function say(t){ return play(cur, String(t || '')); }

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
    const e = engine();
    b.querySelectorAll('[data-eng]').forEach(x=> x.classList.toggle('on', x.dataset.eng === e));
    b.querySelectorAll('[data-vv]').forEach(x=> x.classList.toggle('on', x.dataset.vv === voiceId()));
    b.querySelectorAll('[data-cv]').forEach(x=> x.classList.toggle('on', x.dataset.cv === cloudVoice()));
    const cur = (window.speechSynthesis && itVoice()) || null;
    b.querySelectorAll('[data-pv]').forEach(x=> x.classList.toggle('on', !!cur && x.dataset.pv === cur.name));
    const st = b.querySelector('.vs-st'), hasKey = typeof geminiKey === 'function' && !!geminiKey(), err = ls.get(ERR_K), ok = ls.get(OK_K), cerr = ls.get(ERR_K + '_cloud');
    if(st) st.textContent = e === 'ai' ? (!hasKey ? '⚠️ Serve la chiave Gemini (⚙️ Impostazioni → AI).' : err ? '⚠️ Ultimo tentativo: ' + err + '.' : ok ? '✅ Voce Gemini funzionante (' + ok + ').' : 'Tocca una voce per sentirla (la prima volta ci vogliono alcuni secondi).')
      : e === 'cloud' ? (!hasKey ? '⚠️ Serve la chiave Gemini (⚙️ Impostazioni → AI): Google Cloud usa la stessa.' : cerr ? '⚠️ ' + cerr + '.' : 'Voci HD di Google: partono in un attimo e non si fermano. Tocca una voce per sentirla.')
      : e === 'gtr' ? 'Voce unica di Google Traduttore: senza chiave, sempre disponibile. Non ha altre voci da scegliere.'
      : 'Voce del telefono: subito pronta, anche senza internet.';
    b.querySelectorAll('[data-pane]').forEach(x=> x.hidden = x.dataset.pane !== e);
    const help = b.querySelector('.vs-help'); if(help) help.hidden = !(e === 'cloud' && cerr && /attivata/.test(cerr));
  }
  function fillCloud(b, force){
    const box = b.querySelector('.vs-cloud'); if(!box) return;
    box.innerHTML = '<div class="lp-sub">Carico le voci italiane di Google…</div>';
    cloudVoices(force).then(v=>{
      ls.set(ERR_K + '_cloud', '');
      const lbl = id=> id.replace(/^it-IT-/, '').replace(/^Chirp3-HD-/, '').replace(/^Chirp-HD-/, 'HD ').replace(/^(Neural2|Wavenet|Studio)-/, '$1 ');
      const chip = x=> `<button type="button" class="vs-chip" data-cv="${esc(x.id)}"><b>${esc(lbl(x.id))}</b><small>${x.q === 0 ? 'HD naturale' : x.q === 1 ? 'HD' : x.q === 2 ? 'studio' : x.q === 3 ? 'neurale' : 'WaveNet'}</small></button>`;
      box.innerHTML = v.length ? `<div class="an-h">👨 Voci maschili</div><div class="vs-grid">${v.filter(x=> x.g === 'u').map(chip).join('')}</div><div class="an-h">👩 Voci femminili</div><div class="vs-grid">${v.filter(x=> x.g === 'd').map(chip).join('')}</div>` : '<div class="lp-sub">Nessuna voce italiana disponibile.</div>';
      box.querySelectorAll('[data-cv]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(CV_K, x.dataset.cv); paintSet(); sample(x, async my=>{ const bl = await cloudAudio(SAMPLE, x.dataset.cv); await playBlob(bl, my); }); }));
      paintSet();
    }).catch(err=>{ ls.set(ERR_K + '_cloud', err.message); box.innerHTML = '<button type="button" class="btn" data-cretry>🔄 Riprova a caricare le voci</button>'; box.querySelector('[data-cretry]').addEventListener('click', ()=> fillCloud(b, true)); paintSet(); });
  }
  function openSettings(){
    if(!window.XUI) return;
    const chip = v=> `<button type="button" class="vs-chip" data-vv="${v.id}"><b>${v.id}</b><small>${v.d}</small></button>`;
    const phone = ((window.speechSynthesis && speechSynthesis.getVoices()) || []).filter(v=> /^it(-|_|$)/i.test(v.lang));
    const b = XUI.sheet('xVoce', '🔊 Voce della lettura', `
      <div class="vs-eng vs-eng4">
        <button type="button" class="vs-e" data-eng="ai"><b>✨ Gemini</b><small>naturale, come una persona</small></button>
        <button type="button" class="vs-e" data-eng="cloud"><b>☁️ Google Cloud</b><small>voci HD, parte subito</small></button>
        <button type="button" class="vs-e" data-eng="gtr"><b>🌐 Google Traduttore</b><small>senza chiave, voce unica</small></button>
        <button type="button" class="vs-e" data-eng="phone"><b>📱 Telefono</b><small>anche senza internet</small></button></div>
      <div class="lp-sub vs-st"></div>
      <div class="lp-sub vs-help" hidden>Apri <a href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com" target="_blank" rel="noopener">questa pagina di Google</a>, scegli il progetto della tua chiave Gemini e premi «Abilita». Poi torna qui e tocca una voce.</div>
      <div data-pane="ai"><div class="an-h">👨 Voci maschili</div><div class="vs-grid">${VOICES.filter(v=> v.g === 'u').map(chip).join('')}</div>
        <div class="an-h">👩 Voci femminili</div><div class="vs-grid">${VOICES.filter(v=> v.g === 'd').map(chip).join('')}</div>
        <div class="lp-sub">Tocca una voce: la scelgo e te la faccio sentire. Ogni storia letta resta salvata sul telefono: la seconda volta parte subito e non consuma.</div>
        <button type="button" class="btn" data-vdiag>🩺 Controlla Gemini</button><div class="lp-sub vs-diag"></div></div>
      <div data-pane="cloud"><div class="vs-cloud"></div></div>
      <div data-pane="gtr"><button type="button" class="btn" data-gtr-try>▶️ Senti la voce</button></div>
      <div data-pane="phone"><div class="an-h">Voci italiane di questo telefono</div><div class="vs-grid">${phone.length ? phone.map(v=> `<button type="button" class="vs-chip" data-pv="${esc(v.name)}"><b>${esc(v.name.replace(/^(Microsoft|Google)\s*/i, ''))}</b><small>${v.localService ? 'sul telefono' : 'online'}</small></button>`).join('') : '<div class="lp-sub">Il telefono non ha voci italiane installate.</div>'}</div></div>`);
    b.querySelectorAll('[data-eng]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(ENG_K, x.dataset.eng); Object.keys(warned).forEach(k=> delete warned[k]); Object.keys(skip).forEach(k=> delete skip[k]); if(x.dataset.eng === 'cloud' && !b.querySelector('[data-cv]')) fillCloud(b); paintSet(); }));
    b.querySelectorAll('[data-vv]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(VOICE_K, x.dataset.vv); paintSet(); sample(x, async my=>{ const bl = await aiAudio(SAMPLE, x.dataset.vv); await playBlob(bl, my); }); }));
    b.querySelectorAll('[data-pv]').forEach(x=> x.addEventListener('click', ()=>{ ls.set(PV_K, x.dataset.pv); paintSet(); stop(); browserSpeak(SAMPLE, ()=>{}); }));
    const dg = b.querySelector('[data-vdiag]'); if(dg) dg.addEventListener('click', ()=> diagnose(dg, b.querySelector('.vs-diag')));
    const gt = b.querySelector('[data-gtr-try]'); if(gt) gt.addEventListener('click', ()=>{ stop(); const my = ++token; audio = noRefAudio(gtrUrl(SAMPLE)); audio.onended = ()=> duck(false); audio.play().then(()=> duck(true), ()=>{ try{ XUI.toast('🔊 Google Traduttore non risponde ora', 3000); }catch(_){} }); });
    if(engine() === 'cloud') fillCloud(b);
    paintSet();
  }
  // v253: «Controlla Gemini»: prova ogni modello una volta con una frase corta e mostra la risposta di Google così com'è (per capire perché non va)
  async function diagnose(bt, box){
    if(!box) return;
    if(typeof geminiKey !== 'function' || !geminiKey()){ box.textContent = 'Manca la chiave Gemini (⚙️ Impostazioni → AI).'; return; }
    bt.disabled = true; box.innerHTML = '';
    const today = new Date().toDateString();
    for(const [m, kind] of MODELS){
      const row = document.createElement('div'); row.textContent = '⏳ ' + m + '…'; box.appendChild(row);
      try{ await callModel(m, kind, 'Ciao.', voiceId()); row.textContent = '✅ ' + m + ': funziona'; badModels.delete(m); delete coolUntil[m]; if(dayOut[m] === today) delete dayOut[m]; }
      catch(e){
        const what = e.status === 429 ? (e.perDay ? 'quota del giorno finita' : 'occupato' + (e.retryMs ? ' (riprova tra ' + Math.round(e.retryMs / 1000) + ' s)' : '')) : e.status === 404 ? 'modello non trovato' : e.status === -1 ? 'nessuna connessione' : 'errore ' + e.status;
        row.textContent = '❌ ' + m + ': ' + what + ' — ' + String(e.message || '').slice(0, 220);
      }
    }
    try{ ls.set(DAY_K, JSON.stringify({day: today, m: MODELS.map(([x])=> x).filter(x=> dayOut[x] === today)})); }catch(e){}
    const t = document.createElement('div'); t.textContent = 'Fai una foto a questo elenco e mandala a Claude.'; box.appendChild(t);
    bt.disabled = false;
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
      head.insertAdjacentHTML('afterend', `<div class="vc-row"><button type="button" class="vc-btn" id="vcBtn" data-s="${state}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path class="vc-p" d="M8 5v14l11-7z"/><path class="vc-s" d="M7 7h10v10H7z"/></svg><span>Ascolta la storia</span></button><button type="button" role="switch" class="vc-auto" id="vcAuto" aria-label="Avvio automatico della lettura"><i></i><b>Auto</b></button><button type="button" class="vc-set" id="vcSet" aria-label="Scegli la voce" title="Scegli la voce">${engine() === 'ai' ? voiceId() : {cloud: 'Google Cloud', gtr: 'Traduttore', phone: 'Telefono'}[engine()]} ▾</button></div>`);
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
  window.rtStory = {play, say, stop, state: ()=> state, text: textFor, settings: openSettings, _chunks: chunks, _wav: wav, _find: findAudio};
})();
