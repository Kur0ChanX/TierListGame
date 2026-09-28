// ---- Gemini come riserva/alternativa a Claude (chiave API di Google AI Studio) ----
// La chiave NON sta nel codice: la incolla l'utente e resta solo in localStorage di questo browser.
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
const GEMINI_NO_FALLBACK = ['cancelled','refused','empty_completion','prompt_too_large','image_rejected'];

function geminiKey(){ try{ return (localStorage.getItem('jrpg_gemini_key') || '').trim(); }catch(e){ return ''; } }
function setGeminiKey(k){ try{ if(k) localStorage.setItem('jrpg_gemini_key', k); else localStorage.removeItem('jrpg_gemini_key'); }catch(e){} }
function llmEngine(){ try{ return localStorage.getItem('jrpg_engine') || 'auto'; }catch(e){ return 'auto'; } }
function setLlmEngine(v){ try{ localStorage.setItem('jrpg_engine', v); }catch(e){} }
function llmAvailable(){ return !!(askSample || geminiKey()); }

async function geminiFetch(body, signal){
  let r;
  try{
    r = await fetch(GEMINI_URL, {method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':geminiKey()}, body:JSON.stringify(body), signal});
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
    err.code = r.status === 429 ? 'gemini_rate_limited' : (r.status === 403 || (r.status === 400 && /api key/i.test(msg))) ? 'gemini_bad_key' : 'gemini_error';
    throw err;
  }
  return r.json();
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
  for(let round = 0; round < 6; round++){
    let data;
    try{
      data = await geminiFetch(body, opts.signal);
    }catch(e){
      if(body.tools && !tools.length && e.code === 'gemini_error' && e.status === 400){ delete body.tools; data = await geminiFetch(body, opts.signal); }
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
    return {text, truncated: !!(cand && cand.finishReason === 'MAX_TOKENS'), engine: 'gemini'};
  }
  const err = new Error('troppi passaggi'); err.code = 'gemini_error'; throw err;
}

// Punto unico per chiamare l'AI: Claude, con Gemini come riserva (auto) o per scelta.
// extra: {system, search, preferGemini}
async function askLLM(input, opts, extra){
  opts = opts || {}; extra = extra || {};
  const eng = llmEngine(), hasG = !!geminiKey();
  const useGeminiFirst = hasG && (eng === 'gemini' || !askSample || (opts.images && !askImagesSupported && eng !== 'claude'));
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
      say('✅ Gemini funziona (' + GEMINI_MODEL + ').', true);
      refreshFab();
    }catch(e){
      say('❌ ' + askErrorCopy(e && e.code), false);
    }
  });
  document.getElementById('geminiClearBtn').addEventListener('click', ()=>{ setGeminiKey(''); keyEl.value = ''; say('Chiave rimossa.'); });
  refreshFab();
})();
