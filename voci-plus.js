// ---- v254: voci in più per «Ascolta la storia», ognuna con la sua chiave gratuita (salvata SOLO su questo telefono):
// Microsoft Azure (500.000 lettere al mese), ElevenLabs (10.000), Cartesia (20.000) e Piper (voce offline, senza chiave, si scarica una volta).
// voce.js le usa tramite window.rtVociPlus: audio(id, testo) → Blob, ready(id), status(id), pane(id, box, aiuti).
(function(){
  'use strict';
  const ls = {get: k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set: (k, v)=>{ try{ if(v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }};
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"']/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const hash = s=>{ let h = 5381; for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const CACHE = 'rt_voce_plus', ERR = 'rt_vp_err_';
  const err = (msg, o)=> Object.assign(new Error(msg), {vp: true}, o || {});
  const KEY = {azure: 'jrpg_azure_key', eleven: 'jrpg_eleven_key', cart: 'jrpg_cartesia_key'};
  const REG_K = 'jrpg_azure_region', VOICE = {azure: 'jrpg_tts_azure_voice', eleven: 'jrpg_tts_eleven_voice', cart: 'jrpg_tts_cart_voice', piper: 'jrpg_tts_piper_voice'};
  const LIST = {azure: 'rt_vp_list_azure', eleven: 'rt_vp_list_eleven', cart: 'rt_vp_list_cart'};
  const INFO = {
    azure: {name: 'Voce Microsoft Azure', btn: '🟦 Azure', sub: '500.000 lettere gratis al mese', link: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices',
      how: 'Crea un account gratuito Azure, poi apri il link e crea una risorsa «Speech» con piano <b>Free F0</b> e area <b>West Europe</b>. In «Chiavi ed endpoint» copia la <b>Chiave 1</b> e incollala qui.'},
    eleven: {name: 'Voce ElevenLabs', btn: '🎙️ ElevenLabs', sub: 'la più naturale, 10.000 lettere al mese', link: 'https://elevenlabs.io/app/settings/api-keys',
      how: 'Registrati gratis su ElevenLabs, apri il link, premi «Create API key» (lascia tutti i permessi attivi) e incolla qui la chiave.'},
    cart: {name: 'Voce Cartesia', btn: '⚡ Cartesia', sub: 'velocissima, 20.000 crediti al mese', link: 'https://play.cartesia.ai/keys',
      how: 'Registrati gratis su Cartesia, apri il link, crea una nuova chiave (API key) e incollala qui.'},
    piper: {name: 'Voce offline Piper', btn: '📦 Offline', sub: 'senza chiave, gratis per sempre', link: '',
      how: 'Si scarica una volta sola (Paola ~63 MB, Riccardo ~28 MB) e poi funziona anche senza internet, senza limiti.'}
  };
  const key = id=> (ls.get(KEY[id]) || '').trim();
  const getJSON = k=>{ try{ return JSON.parse(ls.get(k) || 'null'); }catch(e){ return null; } };

  // pezzi già letti restano sul telefono: riascoltare non consuma
  async function cached(id, voice, text, make){
    const k = 'https://rt.local/vp/' + id + '/' + encodeURIComponent(voice) + '/' + hash(text);
    let c = null; try{ c = window.caches ? await caches.open(CACHE) : null; if(c){ const hit = await c.match(k); if(hit) return await hit.blob(); } }catch(e){}
    const blob = await make();
    ls.set(ERR + id, '');
    try{ if(c) await c.put(k, new Response(blob, {headers: {'content-type': blob.type || 'audio/mpeg'}})); }catch(e){}
    return blob;
  }
  async function call(id, url, opt){
    let r; try{ r = await fetch(url, opt); }catch(e){ throw err('rete non disponibile', {status: -1}); }
    if(r.ok) return r;
    let m = ''; try{ const t = await r.text(); try{ const j = JSON.parse(t); const d = j.detail || j.error || j; m = (d && (d.message || d.status || d.error)) || (typeof d === 'string' ? d : ''); if(typeof m !== 'string') m = JSON.stringify(m); }catch(_){ m = t; } }catch(e){}
    m = String(m || '').slice(0, 200);
    const st = r.status; let why;
    if(st === 401 || st === 403) why = /quota/i.test(m) ? 'hai finito le lettere gratis di questo mese' : /unusual|abuse/i.test(m) ? 'il servizio ha bloccato l\'uso gratuito da questa connessione (' + m + ')' : /permission/i.test(m) ? 'la chiave non ha tutti i permessi: creane una nuova con tutti i permessi attivi' : id === 'azure' ? 'chiave o area non accettate (controlla che l\'area sia quella della risorsa)' : 'la chiave non è accettata';
    else if(st === 402) why = 'hai finito i crediti gratis di questo mese';
    else if(st === 429) why = /quota|limit|credit/i.test(m) ? 'hai finito la quota gratuita' : 'troppe richieste, riprova tra poco';
    else why = (m || 'errore') + ' (' + st + ')';
    const e = err(why, {status: st, raw: m}); e.fatal = st === 401 || st === 402 || st === 403;
    ls.set(ERR + id, why); throw e;
  }

  // ---- Microsoft Azure
  const AZ_DEF = [['it-IT-IsabellaMultilingualNeural', 'd'], ['it-IT-ElsaNeural', 'd'], ['it-IT-IsabellaNeural', 'd'], ['it-IT-FiammaNeural', 'd'], ['it-IT-PalmiraNeural', 'd'],
    ['it-IT-GiuseppeMultilingualNeural', 'u'], ['it-IT-AlessioMultilingualNeural', 'u'], ['it-IT-MarcelloMultilingualNeural', 'u'], ['it-IT-DiegoNeural', 'u'], ['it-IT-BenignoNeural', 'u']].map(([id, g])=> ({id, g}));
  const region = ()=> (ls.get(REG_K) || 'westeurope').trim().toLowerCase().replace(/\s+/g, '');
  const azHost = ()=> 'https://' + region() + '.tts.speech.microsoft.com';
  async function azVoices(){
    const c = getJSON(LIST.azure); if(c && c.r === region() && Date.now() - c.t < 7 * 864e5 && c.v.length) return c.v;
    const r = await call('azure', azHost() + '/cognitiveservices/voices/list', {headers: {'Ocp-Apim-Subscription-Key': key('azure')}});
    const v = (await r.json()).filter(x=> x.Locale === 'it-IT').map(x=> ({id: x.ShortName, g: x.Gender === 'Male' ? 'u' : 'd', d: /Multilingual/.test(x.ShortName) ? 'molto naturale' : x.VoiceType === 'Neural' ? 'neurale' : ''}));
    ls.set(LIST.azure, JSON.stringify({t: Date.now(), r: region(), v})); return v;
  }
  function azAudio(text, voice){
    const xml = s=> s.replace(/[&<>"']/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c]));
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="it-IT"><voice name="${xml(voice)}">${xml(text)}</voice></speak>`;
    return call('azure', azHost() + '/cognitiveservices/v1', {method: 'POST', headers: {'Ocp-Apim-Subscription-Key': key('azure'), 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3'}, body: ssml}).then(r=> r.blob());
  }

  // ---- ElevenLabs
  async function elVoices(){
    const c = getJSON(LIST.eleven); if(c && Date.now() - c.t < 7 * 864e5 && c.v.length) return c.v;
    const r = await call('eleven', 'https://api.elevenlabs.io/v1/voices', {headers: {'xi-api-key': key('eleven')}});
    const v = ((await r.json()).voices || []).map(x=>{ const l = x.labels || {}; return {id: x.voice_id, n: x.name.split(/\s+-\s+/)[0], g: /female/i.test(l.gender || '') ? 'd' : 'u', d: [l.description || l.descriptive, l.accent].filter(Boolean).join(', ')}; });
    ls.set(LIST.eleven, JSON.stringify({t: Date.now(), v})); return v;
  }
  function elAudio(text, voice){
    return call('eleven', 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice) + '?output_format=mp3_44100_128', {method: 'POST', headers: {'xi-api-key': key('eleven'), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}, body: JSON.stringify({text, model_id: 'eleven_multilingual_v2', voice_settings: {stability: .5, similarity_boost: .75}})}).then(r=> r.blob());
  }

  // ---- Cartesia
  const CV = '2025-04-16', CM_K = 'rt_vp_cart_model';
  async function caVoices(){
    const c = getJSON(LIST.cart); if(c && Date.now() - c.t < 7 * 864e5 && c.v.length) return c.v;
    const r = await call('cart', 'https://api.cartesia.ai/voices?language=it&limit=100', {headers: {'X-API-Key': key('cart'), 'Cartesia-Version': CV}});
    const j = await r.json(), arr = Array.isArray(j) ? j : (j.data || []);
    const v = arr.filter(x=> !x.language || x.language === 'it').map(x=> ({id: x.id, n: x.name, g: /fem/i.test(x.gender || '') ? 'd' : 'u', d: String(x.description || '').slice(0, 40)}));
    ls.set(LIST.cart, JSON.stringify({t: Date.now(), v})); return v;
  }
  async function caAudio(text, voice){
    const models = [ls.get(CM_K), 'sonic-3', 'sonic-2'].filter((m, i, a)=> m && a.indexOf(m) === i);
    let last = null;
    for(const m of models){
      try{
        const r = await call('cart', 'https://api.cartesia.ai/tts/bytes', {method: 'POST', headers: {'X-API-Key': key('cart'), 'Cartesia-Version': CV, 'Content-Type': 'application/json'}, body: JSON.stringify({model_id: m, transcript: text, voice: {mode: 'id', id: voice}, language: 'it', output_format: {container: 'mp3', sample_rate: 44100, bit_rate: 128000}})});
        ls.set(CM_K, m); return await r.blob();
      }catch(e){ last = e; if(!(e.status === 400 || e.status === 404) || !/model/i.test(e.raw || '')) throw e; }
    }
    throw last;
  }

  // ---- Piper (offline): il programma della voce arriva da jsDelivr, la voce da Hugging Face; poi resta salvata nel telefono
  const PIPER = [{id: 'it_IT-paola-medium', n: 'Paola', g: 'd', d: 'chiara, ~63 MB', path: 'it/it_IT/paola/medium/it_IT-paola-medium.onnx'}, {id: 'it_IT-riccardo-x_low', n: 'Riccardo', g: 'u', d: 'più semplice, ~28 MB', path: 'it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx'}];
  const PDL_K = 'rt_vp_piper_ok';
  let piperLib = null, piperQ = Promise.resolve(), onProg = null;
  async function piperLoad(){
    if(!piperLib){
      piperLib = import(VW).then(m=>{ PIPER.forEach(p=>{ try{ if(m.PATH_MAP && !m.PATH_MAP[p.id]) m.PATH_MAP[p.id] = p.path; }catch(e){} }); return m; });
      piperLib.catch(()=>{ piperLib = null; });
    }
    try{ return await piperLib; }catch(e){ throw err('non riesco a scaricare la voce offline (serve internet la prima volta)', {status: -1}); }
  }
  const piperDone = ()=> (ls.get(PDL_K) || '').split(',').filter(Boolean);
  // v255: la voce offline lavora in un «aiutante» separato (Web Worker): prima girava insieme all'app e la bloccava finché non finiva di leggere
  const VW = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm';
  let wk = null, wseq = 0, noWorker = false; const wjobs = {};
  function worker(){
    if(wk) return wk;
    const src = `import * as m from '${VW}';
const P = ${JSON.stringify(PIPER.map(p=> [p.id, p.path]))}; P.forEach(([id, path])=>{ try{ if(m.PATH_MAP && !m.PATH_MAP[id]) m.PATH_MAP[id] = path; }catch(e){} });
self.onmessage = async e=>{ const {n, text, voice} = e.data;
  try{ const b = await m.predict({text, voiceId: voice}, pr=>{ if(pr && pr.total) self.postMessage({n, p: Math.round(pr.loaded / pr.total * 100)}); }); self.postMessage({n, blob: b}); }
  catch(x){ self.postMessage({n, err: String(x && x.message || x)}); } };
self.postMessage({ready: 1});`;
    const fail = why=>{ Object.keys(wjobs).forEach(k=>{ wjobs[k].rej(err(why, {status: -1})); delete wjobs[k]; }); try{ wk && wk.terminate(); }catch(e){} wk = null; };
    wk = new Worker(URL.createObjectURL(new Blob([src], {type: 'text/javascript'})), {type: 'module'});
    wk.onmessage = e=>{ const d = e.data || {}; if(d.ready) return; const j = wjobs[d.n]; if(!j) return; if(d.p != null){ if(onProg) onProg(d.p); return; } delete wjobs[d.n]; if(d.err) j.rej(err('la voce offline non è riuscita a leggere (' + d.err.slice(0, 80) + ')')); else j.res(d.blob); };
    wk.onerror = ev=>{ try{ ev.preventDefault(); }catch(e){} fail('non riesco a scaricare la voce offline (serve internet la prima volta)'); };
    return wk;
  }
  function piperAudio(text, voice){
    const p = piperQ.catch(()=>{}).then(async ()=>{
      let b;
      try{ if(noWorker) throw err('no'); const w = worker(); b = await new Promise((res, rej)=>{ const n = ++wseq; wjobs[n] = {res, rej}; w.postMessage({n, text, voice}); }); }
      catch(e){
        noWorker = true; try{ wk && wk.terminate(); }catch(x){} wk = null;      // l'aiutante non va su questo telefono: da ora leggo come prima
        // riserva: se l'aiutante separato non parte (alcuni browser), leggo come prima
        const m = await piperLoad();
        try{ b = await m.predict({text, voiceId: voice}, pr=>{ if(onProg && pr && pr.total) onProg(Math.round(pr.loaded / pr.total * 100)); }); }
        catch(x){ throw err('la voce offline non è riuscita a leggere (' + String(x && x.message || x).slice(0, 80) + ')'); }
      }
      if(!piperDone().includes(voice)) ls.set(PDL_K, piperDone().concat(voice).join(','));
      return b;
    });
    piperQ = p.catch(()=>{});
    return p;
  }

  // ---- interfaccia comune
  const DEFV = {azure: 'it-IT-IsabellaMultilingualNeural', piper: 'it_IT-paola-medium'};
  const voiceOf = id=> ls.get(VOICE[id]) || DEFV[id] || '';
  async function firstVoice(id){
    const v = id === 'eleven' ? await elVoices() : await caVoices();
    if(!v.length) throw err('nessuna voce disponibile con questa chiave');
    const pick = v.find(x=> /multilingual|ital/i.test(x.d + x.n)) || v[0]; ls.set(VOICE[id], pick.id); return pick.id;
  }
  async function audio(id, text, voiceOver){
    if(id !== 'piper' && !key(id)){ const e = err('manca la chiave (tocca il nome della voce → ' + INFO[id].btn + ')'); e.fatal = true; ls.set(ERR + id, e.message); throw e; }
    let v = voiceOver || voiceOf(id);
    if(!v) v = await firstVoice(id);
    return cached(id, v, text, ()=> id === 'azure' ? azAudio(text, v) : id === 'eleven' ? elAudio(text, v) : id === 'cart' ? caAudio(text, v) : piperAudio(text, v));
  }
  const ready = id=> id === 'piper' ? piperDone().length > 0 : !!key(id);
  function status(id){
    const e = ls.get(ERR + id);
    if(id === 'piper') return e ? '⚠️ ' + e + '.' : ready('piper') ? '✅ Voce offline pronta: funziona anche senza internet.' : 'Tocca una voce: la scarico una volta (serve qualche minuto la prima volta) e poi è sempre pronta.';
    if(!key(id)) return '🔑 Serve la chiave gratuita: segui i passi qui sotto.';
    return e ? '⚠️ Ultimo tentativo: ' + e + '.' : 'Tocca una voce per sentirla.';
  }

  // riquadro nella finestra «Voce della lettura»: chiave, passi da seguire, voci
  function pane(id, box, H){
    if(!box) return;
    const inf = INFO[id];
    const keyHtml = id === 'piper' ? '' : `
      <details class="vp-how"${key(id) ? '' : ' open'}><summary>🔑 ${key(id) ? 'Chiave salvata · cambia' : 'Come avere la chiave gratis'}</summary>
        <div class="lp-sub">${inf.how} <a href="${inf.link}" target="_blank" rel="noopener">Apri la pagina</a></div>
        <input type="text" class="vp-in" data-vk autocomplete="off" autocapitalize="none" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-form-type="other" style="-webkit-text-security:disc" placeholder="Incolla qui la chiave" value="${esc(key(id))}">
        ${id === 'azure' ? `<input type="text" class="vp-in" data-vr autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Area (es. westeurope)" value="${esc(region())}">` : ''}
        <button type="button" class="btn" data-vsave>💾 Salva e prova</button></details>`;
    box.innerHTML = keyHtml + `<div class="vp-vs"></div>` + (id === 'piper' ? '' : `<div class="lp-sub">${inf.sub}. Ogni pezzo letto resta salvato sul telefono: riascoltare non consuma.</div>`);
    const vs = box.querySelector('.vp-vs');
    const chips = list=>{
      const chip = x=> `<button type="button" class="vs-chip" data-vpv="${esc(x.id)}"><b>${esc(x.n || x.id.replace(/^it-IT-/, '').replace(/Neural$/, '').replace(/Multilingual$/, ' Multi'))}</b><small>${esc(x.d || '')}</small></button>`;
      const u = list.filter(x=> x.g === 'u'), d = list.filter(x=> x.g === 'd');
      vs.innerHTML = (u.length ? `<div class="an-h">👨 Voci maschili</div><div class="vs-grid">${u.map(chip).join('')}</div>` : '') + (d.length ? `<div class="an-h">👩 Voci femminili</div><div class="vs-grid">${d.map(chip).join('')}</div>` : '');
      vs.querySelectorAll('[data-vpv]').forEach(x=> x.addEventListener('click', ()=>{
        ls.set(VOICE[id], x.dataset.vpv); mark();
        if(id === 'piper' && !piperDone().includes(x.dataset.vpv)){ const sm = x.querySelector('small'), old = sm.textContent; onProg = p=>{ sm.textContent = 'scarico… ' + p + '%'; }; H.sample(x, async my=>{ try{ const bl = await audio(id, H.SAMPLE, x.dataset.vpv); sm.textContent = old; await H.playBlob(bl, my); }finally{ onProg = null; sm.textContent = old; } }); return; }
        H.sample(x, async my=>{ const bl = await audio(id, H.SAMPLE, x.dataset.vpv); await H.playBlob(bl, my); });
      }));
      mark();
    };
    const mark = ()=>{ const v = voiceOf(id); vs.querySelectorAll('[data-vpv]').forEach(x=> x.classList.toggle('on', x.dataset.vpv === v)); H.paint(); };
    const load = force=>{
      if(id === 'piper') return chips(PIPER);
      if(id === 'azure' && !key(id)) return chips(AZ_DEF);
      if(!key(id)){ vs.innerHTML = ''; return; }
      if(force) ls.set(LIST[id], '');
      vs.innerHTML = '<div class="lp-sub">Carico le voci…</div>';
      (id === 'azure' ? azVoices() : id === 'eleven' ? elVoices() : caVoices()).then(v=> chips(v.length ? v : (id === 'azure' ? AZ_DEF : [])))
        .catch(e=>{ vs.innerHTML = `<div class="lp-sub">⚠️ ${esc(e.message)}</div>`; if(id === 'azure') chips(AZ_DEF); H.paint(); });
    };
    const sv = box.querySelector('[data-vsave]');
    if(sv) sv.addEventListener('click', ()=>{
      ls.set(KEY[id], box.querySelector('[data-vk]').value.trim());
      const rg = box.querySelector('[data-vr]'); if(rg) ls.set(REG_K, rg.value.trim().toLowerCase().replace(/\s+/g, '') || 'westeurope');
      ls.set(ERR + id, ''); if(id !== 'azure') ls.set(VOICE[id], '');
      load(true);
      if(key(id)) Promise.resolve(H.sample(sv, async my=>{ const bl = await audio(id, H.SAMPLE); mark(); await H.playBlob(bl, my); })).then(mark);
    });
    load(false);
  }

  window.rtVociPlus = {ids: ['azure', 'eleven', 'cart', 'piper'], INFO, audio, ready, status, pane, voice: voiceOf, err: id=> ls.get(ERR + id) || ''};
})();
