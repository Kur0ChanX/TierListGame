// ---- Gemini come riserva/alternativa a Claude (chiave API di Google AI Studio) ----
// La chiave NON sta nel codice: la incolla l'utente e resta solo in localStorage di questo browser.
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_FALLBACK_MODEL = 'gemini-flash-lite-latest';
const geminiUrl = m=> 'https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent';
const GEMINI_NO_FALLBACK = ['cancelled','refused','empty_completion','prompt_too_large','image_rejected'];

function geminiCustomModel(){ try{ return (localStorage.getItem('jrpg_gemini_model') || '').trim(); }catch(e){ return ''; } }
let geminiBadModels = new Set();   // modelli che Google ha risposto «non esiste» in questa sessione: non li riprovo
function geminiKey(){ try{ return (localStorage.getItem('jrpg_gemini_key') || '').trim(); }catch(e){ return ''; } }
function setGeminiKey(k){ try{ if(k) localStorage.setItem('jrpg_gemini_key', k); else localStorage.removeItem('jrpg_gemini_key'); }catch(e){} }
function llmEngine(){ try{ return localStorage.getItem('jrpg_engine') || 'auto'; }catch(e){ return 'auto'; } }
function setLlmEngine(v){ try{ localStorage.setItem('jrpg_engine', v); }catch(e){} }
function llmAvailable(){ return !!(askSample || geminiKey()); }

async function geminiFetch(body, signal, model){
  let r;
  try{
    r = await fetch(geminiUrl(model || GEMINI_MODEL), {method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':geminiKey()}, body:JSON.stringify(body), signal});
  }catch(e){
    const err = new Error(e && e.message || 'rete');
    err.code = (e && e.name === 'AbortError') ? 'cancelled' : 'gemini_network';
    throw err;
  }
  if(!r.ok){
    let msg = '';
    try{ const j = await r.json(); msg = (j.error && j.error.message) || ''; }catch(e){}
    const err = new Error(msg || ('HTTP ' + r.status));
    err.status = r.status;
    err.code = r.status === 429 ? 'gemini_rate_limited' : r.status === 503 ? 'gemini_busy' : (r.status === 403 || (r.status === 400 && /api key/i.test(msg))) ? 'gemini_bad_key' : 'gemini_error';
    throw err;
  }
  return r.json();
}

let geminiNoThink = false;
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
// Se il modello è sovraccarico (503/500) riprova con calma, poi passa al modello più leggero; se è al limite (429) prova subito quello leggero
async function callGemini(body, signal){
  let lastErr;
  const custom = geminiCustomModel();
  const chain = [custom, GEMINI_MODEL, GEMINI_FALLBACK_MODEL].filter((m, i, a)=> m && a.indexOf(m) === i && !geminiBadModels.has(m));
  for(const [mi, model] of chain.entries()){
    const attempts = mi === 0 ? 3 : 1;
    for(let a = 0; a < attempts; a++){
      try{ return await geminiFetch(body, signal, model); }
      catch(e){
        lastErr = e;
        if((e.status === 404 || (e.status === 400 && /model|not found|not supported/i.test(e.message || ''))) && mi < chain.length - 1){ geminiBadModels.add(model); break; }   // modello inesistente: passo al successivo
        if(![429, 500, 503].includes(e.status)) throw e;
        if(e.status === 429) break;
        if(a < attempts - 1){ if(signal && signal.aborted) throw e; await sleep(1500 * (a + 1)); }
      }
    }
  }
  throw lastErr;
}

function blobToInlineData(blob){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = ()=>{
      try{
        const max = 1280, sc = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({mimeType:'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1]});
      }catch(e){ URL.revokeObjectURL(url); reject(e); }
    };
    im.onerror = ()=>{ URL.revokeObjectURL(url); const e = new Error('immagine non leggibile'); e.code = 'image_rejected'; reject(e); };
    im.src = url;
  });
}

// input: stringa oppure turni [{role:'user'|'assistant', content}]. opts: {tools, images, signal, onText}; extra: {system, search}
async function geminiGenerate(input, opts, extra){
  opts = opts || {}; extra = extra || {};
  const turns = typeof input === 'string' ? [{role:'user', content: input}] : input.slice();
  const contents = turns.map(t=>({role: t.role === 'assistant' ? 'model' : 'user', parts:[{text: String(t.content)}]}));
  if(opts.images){
    const list = (opts.images instanceof Blob) ? [opts.images] : Array.from(opts.images);
    const last = contents[contents.length - 1];
    for(const b of list){ last.parts.push({inlineData: await blobToInlineData(b)}); }
  }
  const tools = opts.tools || [];
  const toolMap = {}; tools.forEach(t=>{ toolMap[t.name] = t; });
  const body = {contents};
  if(extra.system) body.systemInstruction = {parts:[{text: extra.system}]};
  if(tools.length) body.tools = [{functionDeclarations: tools.map(t=>({name:t.name, description:t.description, parameters:t.inputSchema}))}];
  else if(extra.search) body.tools = [{google_search:{}}];
  // richieste "veloci" (Novità, completamento schede, voce...): poco ragionamento interno = risposte molto più rapide a parità di qualità del risultato
  if(extra.fast && !geminiNoThink) body.generationConfig = {thinkingConfig:{thinkingBudget: 512}};
  for(let round = 0; round < 6; round++){
    let data;
    try{
      data = await callGemini(body, opts.signal);
    }catch(e){
      // la ricerca web (grounding) può non essere disponibile sul piano gratuito: riprovo senza
      if(body.generationConfig && e.status === 400 && /think/i.test(e.message || '')){ geminiNoThink = true; delete body.generationConfig; data = await callGemini(body, opts.signal); }   // il modello non accetta il parametro: si va avanti senza
      else if(body.tools && !tools.length && ((e.code === 'gemini_error' && e.status === 400) || e.status === 429)){ delete body.tools; data = await callGemini(body, opts.signal); }
      else throw e;
    }
    const cand = data.candidates && data.candidates[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const calls = parts.filter(p=> p.functionCall);
    if(calls.length && round < 5){
      contents.push(cand.content);
      const responses = [];
      for(const p of calls){
        const t = toolMap[p.functionCall.name];
        let out;
        try{ out = t ? await t.execute(p.functionCall.args || {}) : {error:'strumento sconosciuto'}; }
        catch(err){ out = {error: (err && err.message) || 'errore'}; }
        responses.push({functionResponse:{name: p.functionCall.name, response:{result: out}}});
      }
      contents.push({role:'user', parts: responses});
      continue;
    }
    const text = parts.filter(p=> p.text && !p.thought).map(p=> p.text).join('').trim();
    if(!text){
      const err = new Error('nessuna risposta');
      err.code = (cand && cand.finishReason === 'SAFETY') ? 'refused' : 'empty_completion';
      throw err;
    }
    if(opts.onText) opts.onText({text, delta: text});
    const gm = (cand && cand.groundingMetadata) || {};
    const sources = (gm.groundingChunks || []).map(c=> c.web).filter(Boolean).map(w=> ({title: w.title || '', uri: w.uri || ''}));
    return {text, truncated: !!(cand && cand.finishReason === 'MAX_TOKENS'), engine: 'gemini', sources};
  }
  const err = new Error('troppi passaggi'); err.code = 'gemini_error'; throw err;
}

// Punto unico per chiamare l'AI: Claude, con Gemini come riserva (auto) o per scelta.
// extra: {system, search, preferGemini}
async function askLLM(input, opts, extra){
  opts = opts || {}; extra = extra || {};
  const eng = llmEngine(), hasG = !!geminiKey();
  const useGeminiFirst = hasG && (eng === 'gemini' || extra.forceGemini || !askSample || (opts.images && !askImagesSupported && eng !== 'claude'));
  if(useGeminiFirst) return geminiGenerate(input, opts, extra);
  if(!askSample){ const e = new Error('non disponibile'); e.code = 'not_declared'; throw e; }
  const copts = Object.assign({}, opts);
  try{
    const cinput = (extra.system && Array.isArray(input)) ? [{role:'user', content: extra.system}].concat(input) : input;
    const r = await askSample(cinput, copts);
    r.engine = 'claude';
    return r;
  }catch(e){
    if(eng === 'claude' || !hasG || (e && GEMINI_NO_FALLBACK.includes(e.code))) throw e;
    if(opts.signal && opts.signal.aborted) throw e;
    showToast('Claude non disponibile: uso Gemini', 3000);
    return geminiGenerate(input, opts, extra);
  }
}

// ---- Impostazioni (dentro "Chiedi a Claude") ----
(function initGeminiSettings(){
  const box = document.getElementById('geminiSettings');
  if(!box) return;
  const keyEl = document.getElementById('geminiKeyInput');
  const engEl = document.getElementById('llmEngineSelect');
  const stEl = document.getElementById('geminiStatus');
  keyEl.value = geminiKey();
  engEl.value = llmEngine();
  const say = (m, ok)=>{ stEl.textContent = m; stEl.style.color = ok === true ? '#2e7d32' : ok === false ? '#c62828' : ''; };
  const refreshFab = ()=>{ const fab = document.getElementById('askFab'); if(fab && (askSample || geminiKey())) fab.hidden = false; };
  engEl.addEventListener('change', ()=>{ setLlmEngine(engEl.value); say('Motore: ' + engEl.options[engEl.selectedIndex].text); });
  document.getElementById('geminiSaveBtn').addEventListener('click', async ()=>{
    const k = keyEl.value.trim();
    setGeminiKey(k);
    if(!k){ say('Chiave rimossa.'); return; }
    say('Verifico la chiave…');
    try{
      const r = await geminiGenerate('Rispondi solo con la parola: ok', {});
      say('✅ Gemini funziona (' + (geminiCustomModel() || GEMINI_MODEL) + ').', true);
      refreshFab();
    }catch(e){
      say('❌ ' + askErrorCopy(e && e.code), false);
    }
  });
  const rawgEl = document.getElementById('rawgKeyInput');
  if(rawgEl){ try{ rawgEl.value = localStorage.getItem('jrpg_rawg_key') || ''; }catch(e){} rawgEl.addEventListener('change', async ()=>{
    const v = rawgEl.value.trim(); try{ if(v) localStorage.setItem('jrpg_rawg_key', v); else localStorage.removeItem('jrpg_rawg_key'); }catch(e){}
    if(!v){ say('Chiave RAWG rimossa.'); return; }
    say('Verifico la chiave RAWG…');
    try{ await window.SearchHub.rawg.ping(); say('✅ RAWG funziona: la uso per scoprire giochi, uscite, affini, saghe, voti, anni e copertine (richieste questo mese: ' + window.SearchHub.rawg.usage() + ' su 20.000).', true); }
    catch(e){ say('❌ RAWG non risponde con questa chiave: ' + String(e && e.message || e).slice(0, 120), false); }
  }); }
  const ocEl = document.getElementById('ocKeyInput');
  if(ocEl){ try{ ocEl.value = localStorage.getItem('jrpg_opencritic_key') || ''; }catch(e){} ocEl.addEventListener('change', async ()=>{
    const v = ocEl.value.trim(); try{ if(v) localStorage.setItem('jrpg_opencritic_key', v); else localStorage.removeItem('jrpg_opencritic_key'); }catch(e){}
    if(!v){ say('Chiave OpenCritic rimossa.'); return; }
    say('Verifico la chiave OpenCritic…');
    try{ await window.SearchHub.opencritic.ping(); say('✅ OpenCritic funziona: la uso come seconda fonte dei voti (richieste oggi: ' + window.SearchHub.opencritic.usage() + ' su circa 200).', true); }
    catch(e){ say('❌ OpenCritic non risponde con questa chiave: ' + String(e && e.message || e).slice(0, 120), false); }
  }); }
  const relEl = document.getElementById('relayUrlInput');
  if(relEl){ try{ relEl.value = localStorage.getItem('jrpg_relay_url') || ''; }catch(e){}
    relEl.addEventListener('change', async ()=>{
      const v = relEl.value.trim(); try{ if(v) localStorage.setItem('jrpg_relay_url', v); else localStorage.removeItem('jrpg_relay_url'); }catch(e){}
      if(!v){ say('Ponte personale rimosso.'); return; }
      say('Provo il tuo ponte…');
      try{ const n = await window.SearchHub.testCustomRelay(); say('✅ Il tuo ponte funziona (' + n + ' negozi letti da CheapShark). Ora Steam, GOG e Reddit hanno una via di accesso.', true); }
      catch(e){ say('❌ Il ponte non risponde: ' + String(e && e.message || e).slice(0, 100), false); }
    }); }
  // trasferimento delle chiavi tra dispositivi: si copia un codice e lo si incolla sull'altro (le chiavi non passano mai da file, backup o sincronizzazione)
  const KEYS_T = [['jrpg_gemini_key', 'g'], ['jrpg_rawg_key', 'r'], ['jrpg_opencritic_key', 'o'], ['jrpg_relay_url', 'p']];
  const kc = document.getElementById('keysCopyBtn'), kp = document.getElementById('keysPasteBtn');
  if(kc) kc.addEventListener('click', async ()=>{
    const o = {}; KEYS_T.forEach(([k, s])=>{ try{ const v = (localStorage.getItem(k) || '').trim(); if(v) o[s] = v; }catch(e){} });
    if(!Object.keys(o).length){ say('Non ci sono chiavi da copiare su questo dispositivo.', false); return; }
    const code = 'RTK1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
    try{ await navigator.clipboard.writeText(code); say('✅ Copiate (' + Object.keys(o).length + ' chiavi). Sull\'altro dispositivo tocca «Incolla le chiavi». Poi cancella il codice dagli appunti.', true); }
    catch(e){ window.prompt('Copia questo codice (tieni premuto, Seleziona tutto, Copia):', code); }
  });
  if(kp) kp.addEventListener('click', ()=>{
    const code = (window.prompt('Incolla qui il codice copiato dall\'altro dispositivo:', '') || '').trim();
    if(!code) return;
    try{
      if(!/^RTK1:/.test(code)) throw new Error('codice non valido');
      const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(5))))); let n = 0;
      KEYS_T.forEach(([k, s])=>{ if(typeof o[s] === 'string' && o[s].trim()){ try{ localStorage.setItem(k, o[s].trim()); n++; }catch(e){} } });
      [['rawgKeyInput', 'jrpg_rawg_key'], ['ocKeyInput', 'jrpg_opencritic_key'], ['relayUrlInput', 'jrpg_relay_url']].forEach(([id, k])=>{ const el = document.getElementById(id); if(el) try{ el.value = localStorage.getItem(k) || ''; }catch(e){} });
      try{ keyEl.value = geminiKey(); }catch(e){}
      say('✅ Importate ' + n + ' chiavi. Ricarica la pagina per usarle subito dappertutto.', true); try{ refreshFab(); }catch(e){}
    }catch(e){ say('❌ Codice non valido: copialo di nuovo dall\'altro dispositivo.', false); }
  });
  // chiavi cifrate nel programma: profilo + password → le chiavi tornano da sole (mancanti aggiunte, diverse sostituite)
  const b64 = u=> btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(u)))), unb64 = s=> Uint8Array.from(atob(s), c=> c.charCodeAt(0));
  async function kbKey(pw, salt, it){ const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']); }
  async function kbEncrypt(obj, pw){ const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), it = 310000; const k = await kbKey(pw, salt, it); const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, k, new TextEncoder().encode(JSON.stringify(obj))); return {s: b64(salt), v: b64(iv), c: b64(ct), i: it}; }
  async function kbDecrypt(box, pw){ const k = await kbKey(pw, unb64(box.s), box.i); const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: unb64(box.v)}, k, unb64(box.c)); return JSON.parse(new TextDecoder().decode(pt)); }
  const applyKeys = o=>{
    const added = [], changed = [], NM = {g: 'Gemini', r: 'RAWG', o: 'OpenCritic', p: 'Ponte'};
    KEYS_T.forEach(([k, s])=>{ const v = typeof o[s] === 'string' ? o[s].trim() : ''; if(!v) return; let cur = ''; try{ cur = (localStorage.getItem(k) || '').trim(); }catch(e){}
      if(!cur){ added.push(NM[s]); } else if(cur !== v){ changed.push(NM[s]); } else return; try{ localStorage.setItem(k, v); }catch(e){} });
    [['rawgKeyInput', 'jrpg_rawg_key'], ['ocKeyInput', 'jrpg_opencritic_key'], ['relayUrlInput', 'jrpg_relay_url']].forEach(([id, k])=>{ const el = document.getElementById(id); if(el) try{ el.value = localStorage.getItem(k) || ''; }catch(e){} });
    try{ keyEl.value = geminiKey(); }catch(e){}
    return {added, changed};
  };
  // Salva/Recupera le chiavi in un attimo: utente + password. Le chiavi, cifrate con la password, stanno in un gist pubblico del tuo GitHub (illeggibile senza password)
  const GH_USER = /\.github\.io$/.test(location.hostname) ? location.hostname.split('.')[0] : 'kur0chanx';
  const kbDesc = u=> 'RaccoonTier-chiavi-' + u.toLowerCase();
  const askUP = (verb)=>{
    const u = (window.prompt('Utente (es. Mario):', localStorage.getItem('jrpg_keys_user') || 'Mario') || '').trim().replace(/[^A-Za-z0-9À-ÿ_-]/g, '').slice(0, 24); if(!u) return null;
    const pw = window.prompt('Password di ' + u + (verb === 'save' ? ' (almeno 12 caratteri; se la perdi dovrai rincollare le chiavi a mano)' : '') + ':', '') || ''; if(!pw) return null;
    if(verb === 'save' && pw.length < 12){ say('❌ Password troppo corta: servono almeno 12 caratteri (il codice sta su un sito pubblico, una password debole si indovina).', false); return null; }
    try{ localStorage.setItem('jrpg_keys_user', u); }catch(e){}
    return {u, pw};
  };
  const kenc = document.getElementById('keysEncBtn'), krec = document.getElementById('keysRecBtn');
  if(kenc) kenc.addEventListener('click', async ()=>{
    if(!(window.crypto && crypto.subtle)){ say('❌ Questo browser non può cifrare (serve https).', false); return; }
    const tok = (localStorage.getItem('jrpg_sync_token') || '').trim();
    if(!tok){ say('❌ Serve il token GitHub attivo (sezione «Sincronizzazione tra dispositivi» qui sotto) su questo dispositivo.', false); return; }
    const o = {}; KEYS_T.forEach(([k, s])=>{ try{ const v = (localStorage.getItem(k) || '').trim(); if(v) o[s] = v; }catch(e){} });
    o.t = tok;
    if(Object.keys(o).length < 2){ say('Non ci sono chiavi da salvare su questo dispositivo.', false); return; }
    const up = askUP('save'); if(!up) return;
    say('Cifro e salvo…');
    try{
      const box = await kbEncrypt(o, up.pw), content = JSON.stringify(box), desc = kbDesc(up.u);
      const H = {'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'};
      let id = null;
      for(let page = 1; page <= 5 && !id; page++){
        const r = await fetch('https://api.github.com/gists?per_page=100&page=' + page, {headers: H}); if(!r.ok){ const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
        const l = await r.json(); const f = l.find(g=> g.description === desc); if(f) id = f.id; if(l.length < 100) break;
      }
      const body = JSON.stringify({description: desc, public: true, files: {'chiavi.json': {content}}});
      const r2 = await fetch('https://api.github.com/gists' + (id ? '/' + id : ''), {method: id ? 'PATCH' : 'POST', headers: H, body});
      if(!r2.ok){ const e = new Error('HTTP ' + r2.status); e.status = r2.status; throw e; }
      say('✅ Chiavi salvate per «' + up.u + '». Sugli altri dispositivi: «🔑 Accedi» (o il QR), utente e password.', true);
    }catch(e){ say('❌ Non sono riuscito a salvare: ' + (e && e.status === 401 ? 'token GitHub non valido.' : e && e.status === 403 ? 'il token deve avere il permesso «gist».' : 'controlla la connessione.'), false); }
  });
  // ---- Accedi / Nuovo utente (anche da QR): utente + password → chiavi, token e sincronizzazione completa del profilo ----
  async function cloudLogin(u, pw, say2){
    const r = await fetch('https://api.github.com/users/' + GH_USER + '/gists?per_page=100'); if(!r.ok){ const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    const f = (await r.json()).find(g=> g.description === kbDesc(u)); const file = f && f.files && f.files['chiavi.json'];
    if(!file){ say2('❌ Non trovo l\'utente «' + u + '». Sul dispositivo che ha le chiavi tocca prima «☁️ Salva chiavi».'); return false; }
    const box = await (await fetch(file.raw_url)).json();
    let keys; try{ keys = await kbDecrypt(box, pw); }catch(e){ say2('❌ Password sbagliata.'); return false; }
    const res = applyKeys(keys);
    if(keys.t){ try{ localStorage.setItem('jrpg_sync_token', keys.t); localStorage.removeItem('jrpg_sync_gist'); localStorage.setItem('jrpg_keys_user', u); }catch(e){} }
    say2('✅ Accesso fatto' + (res.added.length || res.changed.length ? ' (chiavi: ' + res.added.concat(res.changed).join(', ') + ')' : '') + '. Scarico tutto il tuo profilo…');
    try{ if(typeof syncNow === 'function') await syncNow({noReload: true}); }catch(e){}
    setTimeout(()=> location.reload(), 1200);
    return true;
  }
  function openLogin(){
    let el = document.getElementById('loginBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'loginBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    const U = localStorage.getItem('jrpg_keys_user') || 'Mario';
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🔑 Accedi o crea utente</b><button class="btn" data-ui-close>Chiudi</button></div>
      <div class="lp-tools"><button class="btn primary" id="lgTabIn">Accedi</button><button class="btn" id="lgTabNew">Nuovo utente</button></div>
      <div id="lgBody"></div><div class="lp-sub" id="lgMsg"></div></div>`;
    el.classList.add('show');
    const msg = t=>{ const m = el.querySelector('#lgMsg'); if(m) m.textContent = t; }, body = el.querySelector('#lgBody');
    // il campo password è un testo «a pallini» (non type=password): così Chrome/Google non propone «Salva/Aggiorna la password?»
    const HIDE_OK = !!(window.CSS && CSS.supports && CSS.supports('-webkit-text-security', 'disc'));
    const fld = (id, label, type, val)=> `<label style="display:block;margin:8px 0">${label}<input id="${id}" name="rt-${id}" type="${type === 'password' && HIDE_OK ? 'text' : type}" value="${val || ''}" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" autocapitalize="none" spellcheck="false" style="${type === 'password' && HIDE_OK ? '-webkit-text-security:disc;' : ''}width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border,#555);background:var(--card,#222);color:inherit;font-size:1rem"></label>`;
    const showIn = ()=>{ el.querySelector('#lgTabIn').classList.add('primary'); el.querySelector('#lgTabNew').classList.remove('primary');
      body.innerHTML = `<div class="lp-sub">Come se fossi sul telefono: chiavi, sincronizzazione e tutti i tuoi dati.</div>${fld('lgUser', 'Utente', 'text', U)}${fld('lgPw', 'Password', 'password', '')}<div class="lp-tools"><button class="btn primary" id="lgGo">Accedi</button></div>`;
      el.querySelector('#lgGo').addEventListener('click', async ()=>{ const u = el.querySelector('#lgUser').value.trim(), pw = el.querySelector('#lgPw').value; if(!u || !pw){ msg('Scrivi utente e password.'); return; } msg('Accedo…'); try{ await cloudLogin(u, pw, msg); }catch(e){ msg('❌ Non riesco a leggere da GitHub' + (e && e.status === 403 ? ' (troppe richieste, riprova tra un po\')' : '') + '.'); } });
    };
    const showNew = ()=>{ el.querySelector('#lgTabNew').classList.add('primary'); el.querySelector('#lgTabIn').classList.remove('primary');
      body.innerHTML = `<div class="lp-sub">Avrai tutti i giochi, le schede e le informazioni complete; preferiti, tier, classifiche e recensioni saranno solo tuoi.</div>${fld('lgNu', 'Nome del nuovo utente', 'text', '')}${fld('lgNp', 'Password nuova (almeno 12 caratteri)', 'password', '')}<div class="lp-tools"><button class="btn primary" id="lgMk">Crea utente</button></div>`;
      el.querySelector('#lgMk').addEventListener('click', async ()=>{
        const n = el.querySelector('#lgNu').value.trim().replace(/[^A-Za-z0-9À-ÿ _-]/g, '').slice(0, 24), pw = el.querySelector('#lgNp').value;
        if(!n){ msg('Scrivi il nome.'); return; } if(pw.length < 12){ msg('Password troppo corta: almeno 12 caratteri.'); return; }
        if(typeof PROFILES === 'undefined' || typeof switchProfile !== 'function'){ msg('Profili non disponibili.'); return; }
        if(PROFILES.some(p=> p.name.toLowerCase() === n.toLowerCase())){ msg('Esiste già un utente con questo nome.'); return; }
        msg('Creo l\'utente e scarico il catalogo…');
        try{ if(typeof loadCatalog === 'function') await loadCatalog({force: true}); }catch(e){}
        const id = nextGuestId(); PROFILES.push({id, name: n}); saveProfiles(); try{ localStorage.setItem('jrpg_keys_user', n); }catch(e){}
        switchProfile(id); msg('✅ Utente «' + n + '» creato. Ricarico…'); setTimeout(()=> location.reload(), 1200);
      });
    };
    el.querySelector('#lgTabIn').addEventListener('click', showIn); el.querySelector('#lgTabNew').addEventListener('click', showNew);
    showIn();
  }
  window.openLogin = openLogin;
  if(krec) krec.addEventListener('click', openLogin);
  const kqr = document.getElementById('keysQrBtn');
  if(kqr) kqr.addEventListener('click', async ()=>{
    let el = document.getElementById('qrLoginBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'qrLoginBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    const url = 'https://' + GH_USER + '.github.io/TierListGame/#login';
    el.innerHTML = '<div class="lp-card"><div class="lp-head"><b>📱 QR per un altro dispositivo</b><button class="btn" data-ui-close>Chiudi</button></div><div class="lp-sub">Inquadralo con l\'altro dispositivo: si apre il programma e ti chiede utente e password (o di creare un nuovo utente).</div><div id="qrLoginBox" style="background:#fff;padding:12px;border-radius:12px;max-width:280px;margin:10px auto"></div></div>'; el.classList.add('show');
    try{
      if(typeof qrcode === 'undefined') await new Promise((res, rej)=>{ const s = document.createElement('script'); s.src = 'qrcode.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      const q = qrcode(0, 'M'); q.addData(url); q.make(); el.querySelector('#qrLoginBox').innerHTML = q.createSvgTag({cellSize: 4, margin: 2, scalable: true});
    }catch(e){ el.querySelector('#qrLoginBox').textContent = url; }
  });
  if(location.hash === '#login'){ setTimeout(()=>{ try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){} openLogin(); }, 1500); }
  const modEl = document.getElementById('geminiModelInput');
  if(modEl){ modEl.value = geminiCustomModel(); modEl.addEventListener('change', ()=>{ const v = modEl.value.trim(); try{ if(v) localStorage.setItem('jrpg_gemini_model', v); else localStorage.removeItem('jrpg_gemini_model'); }catch(e){} geminiBadModels = new Set(); say(v ? 'Modello impostato: ' + v + ' (se non esiste uso automaticamente ' + GEMINI_MODEL + ').' : 'Modello automatico: ' + GEMINI_MODEL + ' (sempre l\'ultimo Flash).'); }); }
  document.getElementById('geminiClearBtn').addEventListener('click', ()=>{ setGeminiKey(''); keyEl.value = ''; say('Chiave rimossa.'); });
  refreshFab();
})();

// Selettore del motore riusabile (schermate Novità): stesso valore dell'impostazione in "Chiedi a Claude"
function llmEngineSelectHtml(){
  const cur = llmEngine();
  const opt = (v, l)=> `<option value="${v}"${cur === v ? ' selected' : ''}>${l}</option>`;
  return `<label class="novita-engine">🤖 Motore <select class="novita-engine-select">${opt('auto','Auto: Gemini solo se Claude è al limite')}${opt('claude','Solo Claude')}${opt('gemini','Solo Gemini')}</select></label>`;
}
document.addEventListener('change', (e)=>{
  const t = e.target;
  if(!t || !t.classList || !t.classList.contains('novita-engine-select')) return;
  setLlmEngine(t.value);
  document.querySelectorAll('.novita-engine-select, #llmEngineSelect').forEach(s=>{ s.value = t.value; });
  if(t.value !== 'claude' && !geminiKey()) showToast('Per usare Gemini incolla la chiave in Chiedi → ⚙️ Impostazioni', 4000);
});

// Messaggio d'errore per l'utente, con il dettaglio di Google quando è un errore Gemini
function llmErrorText(e){
  const base = askErrorCopy(e && e.code);
  return (e && e.code && String(e.code).indexOf('gemini_') === 0 && e.message) ? base + ' (' + String(e.message).slice(0, 160) + ')' : base;
}

// I campi delle chiavi (Gemini, RAWG, OpenCritic, token GitHub) sono testi «a pallini», non type=password: Chrome/Google non propone più «Salva/Aggiorna la password?».
(function(){
  try{
    if(!(window.CSS && CSS.supports && CSS.supports('-webkit-text-security', 'disc'))) return;           // senza questo supporto (Firefox) restano campi password normali
    ['geminiKeyInput', 'rawgKeyInput', 'ocKeyInput', 'syncTokenInput'].forEach(id=>{
      const el = document.getElementById(id); if(!el) return;
      el.type = 'text'; el.style.webkitTextSecurity = 'disc';
      el.setAttribute('name', 'rt-' + id); el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-1p-ignore', 'true'); el.setAttribute('data-form-type', 'other');
    });
  }catch(e){}
})();
