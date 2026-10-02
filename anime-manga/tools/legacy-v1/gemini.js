// ---- Motore AI: Gemini (chiave API di Google AI Studio, gratuita) ----
// La chiave NON sta nel codice: la incolla l'utente e resta solo in localStorage di questo browser.
// askLLM() è il punto unico per chiamare l'AI. Se la pagina gira dentro Claude (artifact) si può usare anche Claude (askSample).
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_FALLBACK_MODEL = 'gemini-flash-lite-latest';
const geminiUrl = m=> 'https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent';
const GEMINI_NO_FALLBACK = ['cancelled', 'refused', 'empty_completion', 'prompt_too_large', 'image_rejected'];
let askSample = null;              // Claude dentro un artifact (assente fuori)
let askImagesSupported = false;

const lsRaw = k=>{ try{ return (localStorage.getItem(k) || '').trim(); }catch(e){ return ''; } };
const lsPut = (k, v)=>{ try{ if(v) localStorage.setItem(k, v); else localStorage.removeItem(k); }catch(e){} };
function geminiCustomModel(){ return lsRaw('atl_gemini_model'); }
let geminiBadModels = new Set();   // modelli che Google ha risposto «non esiste» in questa sessione: non li riprovo
// la chiave inserita nell'app dei giochi (stesso sito) viene riconosciuta da sola
function geminiKey(){ return lsRaw('atl_gemini_key') || lsRaw('jrpg_gemini_key'); }
function setGeminiKey(k){ lsPut('atl_gemini_key', k); }
function llmEngine(){ return lsRaw('atl_engine') || 'auto'; }
function setLlmEngine(v){ lsPut('atl_engine', v); }
function llmAvailable(){ return !!(askSample || geminiKey()); }

async function geminiFetch(body, signal, model){
  let r;
  try{
    r = await fetch(geminiUrl(model || GEMINI_MODEL), {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': geminiKey()}, body: JSON.stringify(body), signal});
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
const gSleep = ms=> new Promise(r=> setTimeout(r, ms));
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
        if(a < attempts - 1){ if(signal && signal.aborted) throw e; await gSleep(1500 * (a + 1)); }
      }
    }
  }
  throw lastErr;
}

// foto → JPEG ridimensionato in base64 (copertine viste in negozio, locandine, screenshot)
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
        resolve({mimeType: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1]});
      }catch(e){ URL.revokeObjectURL(url); reject(e); }
    };
    im.onerror = ()=>{ URL.revokeObjectURL(url); const e = new Error('immagine non leggibile'); e.code = 'image_rejected'; reject(e); };
    im.src = url;
  });
}

// input: stringa oppure turni [{role:'user'|'assistant', content}]. opts: {tools, images, signal, onText}; extra: {system, search, fast}
async function geminiGenerate(input, opts, extra){
  opts = opts || {}; extra = extra || {};
  const turns = typeof input === 'string' ? [{role: 'user', content: input}] : input.slice();
  const contents = turns.map(t=>({role: t.role === 'assistant' ? 'model' : 'user', parts: [{text: String(t.content)}]}));
  if(opts.images){
    const list = (opts.images instanceof Blob) ? [opts.images] : Array.from(opts.images);
    const last = contents[contents.length - 1];
    for(const b of list){ last.parts.push({inlineData: await blobToInlineData(b)}); }
  }
  const tools = opts.tools || [];
  const toolMap = {}; tools.forEach(t=>{ toolMap[t.name] = t; });
  const body = {contents};
  if(extra.system) body.systemInstruction = {parts: [{text: extra.system}]};
  if(tools.length) body.tools = [{functionDeclarations: tools.map(t=>({name: t.name, description: t.description, parameters: t.inputSchema}))}];
  else if(extra.search) body.tools = [{google_search: {}}];
  // richieste "veloci" (completamento schede, voce…): poco ragionamento interno = risposte molto più rapide a parità di qualità
  if(extra.fast && !geminiNoThink) body.generationConfig = {thinkingConfig: {thinkingBudget: 512}};
  for(let round = 0; round < 6; round++){
    let data;
    try{
      data = await callGemini(body, opts.signal);
    }catch(e){
      if(body.generationConfig && e.status === 400 && /think/i.test(e.message || '')){ geminiNoThink = true; delete body.generationConfig; data = await callGemini(body, opts.signal); }   // il modello non accetta il parametro: si va avanti senza
      else if(body.tools && !tools.length && ((e.code === 'gemini_error' && e.status === 400) || e.status === 429)){ delete body.tools; data = await callGemini(body, opts.signal); }   // la ricerca web può non essere disponibile sul piano gratuito
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
        try{ out = t ? await t.execute(p.functionCall.args || {}) : {error: 'strumento sconosciuto'}; }
        catch(err){ out = {error: (err && err.message) || 'errore'}; }
        responses.push({functionResponse: {name: p.functionCall.name, response: {result: out}}});
      }
      contents.push({role: 'user', parts: responses});
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

// Punto unico per chiamare l'AI. extra: {system, search, fast, forceGemini, label, silent}
async function askLLM(input, opts, extra){
  opts = opts || {}; extra = extra || {};
  const eng = llmEngine(), hasG = !!geminiKey();
  const useGeminiFirst = hasG && (eng === 'gemini' || extra.forceGemini || !askSample || (opts.images && !askImagesSupported && eng !== 'claude'));
  if(useGeminiFirst) return geminiGenerate(input, opts, extra);
  if(!askSample){ const e = new Error('non disponibile'); e.code = 'not_declared'; throw e; }
  try{
    const cinput = (extra.system && Array.isArray(input)) ? [{role: 'user', content: extra.system}].concat(input) : (extra.system ? extra.system + '\n\n' + input : input);
    const r = await askSample(cinput, Object.assign({}, opts));
    r.engine = 'claude';
    return r;
  }catch(e){
    if(eng === 'claude' || !hasG || (e && GEMINI_NO_FALLBACK.includes(e.code))) throw e;
    if(opts.signal && opts.signal.aborted) throw e;
    showToast('Claude non disponibile: uso Gemini', 3000);
    return geminiGenerate(input, opts, extra);
  }
}
// dentro un artifact di Claude c'è anche Claude (facoltativo)
(function detectClaude(){
  if(!(window.claude && typeof window.claude.use === 'function')) return;
  window.claude.use('sample').then(s=>{ if(!s) return; askSample = s; if(typeof s.limits === 'function') s.limits().then(l=>{ askImagesSupported = !!(l && l.images); }).catch(()=>{}); const fab = document.getElementById('askFab'); if(fab) fab.hidden = false; }).catch(()=>{});
})();

function askErrorCopy(code){
  switch(code){
    case 'gemini_bad_key': return 'Chiave Gemini non valida: controllala su Google AI Studio.';
    case 'gemini_rate_limited': return 'Gemini ha raggiunto il suo limite gratuito: riprova più tardi.';
    case 'gemini_network': return 'Non riesco a contattare Google da questa pagina. Dentro l\'anteprima di Claude le connessioni esterne sono bloccate: apri il sito su GitHub Pages (o il file dal disco) per usare Gemini.';
    case 'gemini_busy': return 'Gemini è molto richiesto in questo momento (ho già riprovato anche con il modello leggero): riprova tra qualche minuto.';
    case 'gemini_error': return 'Gemini ha restituito un errore: riprova tra poco.';
    case 'not_declared': return 'Per usare l\'AI serve la chiave Gemini: incollala in ⚙️ Impostazioni (dentro «Chiedi»). È gratuita.';
    case 'sampling_disabled': return 'Claude non è disponibile per questo account al momento.';
    case 'not_granted': return 'Hai negato il permesso di usare Claude in questa pagina.';
    case 'rate_limited': return 'Troppe richieste: aspetta un momento e riprova.';
    case 'image_rejected': return 'Foto non valida: prova con un\'altra immagine.';
    case 'images_unavailable': return 'Le foto non sono supportate in questa visualizzazione.';
    case 'refused': return 'L\'AI ha preferito non rispondere a questo messaggio.';
    case 'empty_completion': return 'Nessuna risposta: prova a riformulare la domanda.';
    case 'prompt_too_large': return 'La conversazione è troppo lunga: cancella la chat e ricomincia.';
    case 'cancelled': return 'Richiesta interrotta.';
    default: return 'Qualcosa è andato storto, riprova tra poco.';
  }
}
// Messaggio d'errore per l'utente, con il dettaglio di Google quando è un errore Gemini
function llmErrorText(e){
  const base = askErrorCopy(e && e.code);
  return (e && e.code && String(e.code).indexOf('gemini_') === 0 && e.message) ? base + ' (' + String(e.message).slice(0, 160) + ')' : base;
}

// ---- Impostazioni (dentro «Chiedi») ----
(function initGeminiSettings(){
  const box = document.getElementById('geminiSettings');
  if(!box) return;
  const keyEl = document.getElementById('geminiKeyInput'), stEl = document.getElementById('geminiStatus');
  keyEl.value = lsRaw('atl_gemini_key');
  const say = (m, ok)=>{ stEl.textContent = m; stEl.style.color = ok === true ? '#2e7d32' : ok === false ? '#c62828' : ''; };
  const engEl = document.getElementById('llmEngineSelect'); if(engEl){ engEl.value = llmEngine(); engEl.addEventListener('change', ()=>{ setLlmEngine(engEl.value); say('Motore: ' + engEl.options[engEl.selectedIndex].text); }); }
  document.getElementById('geminiSaveBtn').addEventListener('click', async ()=>{
    const k = keyEl.value.trim();
    setGeminiKey(k);
    if(!k){ say('Chiave rimossa.'); return; }
    say('Verifico la chiave…');
    try{
      await geminiGenerate('Rispondi solo con la parola: ok', {});
      say('✅ Gemini funziona (' + (geminiCustomModel() || GEMINI_MODEL) + '). Ora puoi usare Chiedi, la ricerca a voce evoluta e il completamento delle schede.', true);
    }catch(e){ say('❌ ' + llmErrorText(e), false); }
  });
  document.getElementById('geminiClearBtn').addEventListener('click', ()=>{ setGeminiKey(''); keyEl.value = ''; say('Chiave rimossa.'); });
  const modEl = document.getElementById('geminiModelInput');
  if(modEl){ modEl.value = geminiCustomModel(); modEl.addEventListener('change', ()=>{ const v = modEl.value.trim(); lsPut('atl_gemini_model', v); geminiBadModels = new Set(); say(v ? 'Modello impostato: ' + v + ' (se non esiste uso automaticamente ' + GEMINI_MODEL + ').' : 'Modello automatico: ' + GEMINI_MODEL + ' (sempre l\'ultimo Flash).'); }); }
  // chiave TMDB (facoltativa): trame in italiano, locandine e «dove guardarlo» per i film
  const tmEl = document.getElementById('tmdbKeyInput');
  if(tmEl){ tmEl.value = lsRaw('atl_tmdb_key'); tmEl.addEventListener('change', async ()=>{
    const v = tmEl.value.trim(); lsPut('atl_tmdb_key', v);
    if(!v){ say('Chiave TMDB rimossa.'); return; }
    say('Verifico la chiave TMDB…');
    try{ await window.SearchHub.tmdb.ping(); say('✅ TMDB funziona: la uso per trame in italiano, locandine e dove guardare i film in Italia.', true); }
    catch(e){ say('❌ TMDB non risponde con questa chiave: ' + String(e && e.message || e).slice(0, 120), false); }
  }); }
  // ponte personale (facoltativo): un piccolo servizio tuo che aggira i blocchi dei browser per i siti che non li ammettono
  const relEl = document.getElementById('relayUrlInput');
  if(relEl){ relEl.value = lsRaw('atl_relay_url'); relEl.addEventListener('change', async ()=>{
    const v = relEl.value.trim(); lsPut('atl_relay_url', v);
    if(!v){ say('Ponte personale rimosso.'); return; }
    say('Provo il tuo ponte…');
    try{ const n = await window.SearchHub.testCustomRelay(); say('✅ Il tuo ponte funziona (' + n + ').', true); }
    catch(e){ say('❌ Il ponte non risponde: ' + String(e && e.message || e).slice(0, 100), false); }
  }); }
  const fab = document.getElementById('askFab'); if(fab) fab.hidden = false;
})();

// Selettore del motore riusabile (schermate con funzioni AI): stesso valore dell'impostazione in «Chiedi»
function llmEngineSelectHtml(){
  const cur = llmEngine();
  const opt = (v, l)=> `<option value="${v}"${cur === v ? ' selected' : ''}>${l}</option>`;
  return `<label class="novita-engine">🤖 Motore <select class="novita-engine-select">${opt('auto', 'Auto')}${opt('gemini', 'Solo Gemini')}${askSample ? opt('claude', 'Solo Claude') : ''}</select></label>`;
}
document.addEventListener('change', e=>{
  const t = e.target;
  if(!t || !t.classList || !t.classList.contains('novita-engine-select')) return;
  setLlmEngine(t.value);
  document.querySelectorAll('.novita-engine-select, #llmEngineSelect').forEach(s=>{ s.value = t.value; });
  if(t.value !== 'claude' && !geminiKey()) showToast('Per usare Gemini incolla la chiave in Chiedi → ⚙️ Impostazioni', 4000);
});
