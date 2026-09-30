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
