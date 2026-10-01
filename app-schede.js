// Schede e viste: copertine, giochi aggiunti, archivio locale, etichetta, DNA, confronto, saga, Scopri, wizard. Caricato dopo gli altri file app*.js nell'ordine: app, app-schede, app-utente, app-ai.
// ---- Copertine: archivio interno della pagina (assets) + indice nel database (db, collezione "covers") ----
var USER_COVERS = {};      // id gioco -> url dell'immagine caricata
var USER_COVER_IDS = {};   // id gioco -> id asset (per sostituire senza lasciare file orfani)
var COVER_ASSETS = null, COVER_DB = null, currentModalGame = null, coverBusy = false;
var COVER_STATE = 'pending'; // 'pending' | 'ready' | 'unavailable'
function escHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const ICON_GLOBE = giIcon('globe');
const ICON_PHOTO = giIcon('photo');
function coverSearchUrl(g){ return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(g.name + ' cover art boxart'); }
// ---- Formato della locandina nella scheda: mai tagliata (contain + sfondo sfocato); il pulsante «adatta» passa da un formato all'altro, per gioco ----
const COVER_FITS = [['auto', 'Automatico (segue l\'immagine)', 0], ['v', 'Verticale 3:4', 0.75], ['s', 'Quadrata 1:1', 1], ['h', 'Orizzontale 4:3', 1.3333], ['w', 'Panorama 16:9', 1.7778]];
function coverFitMap(){ try{ return JSON.parse(localStorage.getItem('jrpg_cover_fit') || '{}') || {}; }catch(e){ return {}; } }
function coverFitGet(id){ return 'v'; }           // cornice SEMPRE 3:4 (le immagini orizzontali restano intere su fondo sfocato): così la scheda non si sposta quando la copertina finisce di caricarsi
function coverFitSet(id, mode){ const m = coverFitMap(); m[id] = mode; try{ localStorage.setItem('jrpg_cover_fit', JSON.stringify(m)); }catch(e){} }
function coverFitApply(frame, mode, img){
  const f = COVER_FITS.find(x=> x[0] === mode) || COVER_FITS[0];
  let rn = f[2];
  if(!rn){ const im = img || frame.querySelector('img'); rn = (im && im.naturalWidth && im.naturalHeight) ? im.naturalWidth / im.naturalHeight : 0.75; rn = Math.min(1.9, Math.max(0.62, rn)); }
  frame.style.setProperty('--rn', rn.toFixed(3)); frame.dataset.fit = mode;
}
function coverFitLoad(img){ const fr = img.closest('.cover-frame'); if(fr && fr.dataset.fit === 'auto') coverFitApply(fr, 'auto', img); }
function effectiveCover(g){ return USER_COVERS[String(g.id)] || (g.enrich && g.enrich.coverUrl) || null; }
function coverPlaceholderHtml(g){
  const platShort = (g.plat||'').split('/')[0].trim();
  return `<div class="modal-cover placeholder-cover"><div class="pc-row"><span class="pc-plat">${escHtml(platShort)}</span><span class="pc-tier ${TIER_LABEL[g.tier]}">${g.tier}</span></div></div>`;
}
const COVER_BAD_URL_HINTS = [
  { re: /^https?:\/\/share\.google\//i, msg: 'Questo è un link di condivisione di Google, non porta direttamente a un\'immagine.' },
  { re: /^https?:\/\/photos\.app\.goo\.gl\//i, msg: 'Questo è un link di condivisione di Google Foto, non porta direttamente a un\'immagine.' },
  { re: /^https?:\/\/(www\.)?photos\.google\.com\//i, msg: 'Questo è un link di Google Foto, non porta direttamente a un\'immagine.' },
  { re: /^https?:\/\/(www\.)?drive\.google\.com\//i, msg: 'Questo è un link di Google Drive, non porta direttamente a un\'immagine.' },
  { re: /^https?:\/\/(www\.)?dropbox\.com\/s\//i, msg: 'Questo è un link di condivisione Dropbox: prova ad aggiungere "?dl=1" alla fine, oppure usane un altro.' },
  { re: /^https?:\/\/(www\.)?(instagram\.com|facebook\.com|pinterest\.[a-z.]+|x\.com|twitter\.com)\//i, msg: 'Questo è un link a una pagina, non al file dell\'immagine.' }
];
function coverUrlKnownBadHint(url){
  for(const b of COVER_BAD_URL_HINTS){ if(b.re.test(url)) return b.msg; }
  return null;
}
function probeImageUrl(url, timeoutMs){
  // Restituisce {ok, reason}: reason è 'ok', 'error' (il browser ha rifiutato/bloccato subito
  // il caricamento — link sbagliato, hotlink-protection, o una policy di sicurezza della pagina)
  // oppure 'timeout' (nessuna risposta entro il tempo massimo — rete lenta o bloccata in silenzio).
  timeoutMs = timeoutMs || 9000;
  return new Promise(resolve=>{
    let done = false;
    const img = new Image();
    const finish = (reason)=>{ if(done) return; done = true; img.onload = img.onerror = null; resolve({ok: reason==='ok', reason}); };
    img.onload = ()=> finish('ok');
    img.onerror = ()=> finish('error');
    try{ img.referrerPolicy = 'no-referrer'; }catch(_){}
    img.src = url;
    setTimeout(()=> finish('timeout'), timeoutMs);
  });
}
const COVER_TEST_IMG_URL = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
async function runCoverImageSelfTest(){
  coverLog('test di connessione: provo a caricare una foto di prova esterna nota e funzionante…');
  const { reason } = await probeImageUrl(COVER_TEST_IMG_URL, 9000);
  if(reason==='ok'){
    coverLog('test di connessione: OK — questa pagina RIESCE a caricare immagini esterne. Il problema è nei link specifici che hai provato (non diretti, o protetti).');
    showToast('✅ Test riuscito: le immagini esterne funzionano qui. Il link che avevi provato non era quello giusto.');
  } else {
    coverLog('test di connessione: FALLITO (' + reason + ') — anche una foto esterna nota e sempre funzionante non si carica: molto probabilmente questa pagina/dispositivo blocca il caricamento di QUALSIASI immagine esterna, non solo il tuo link.');
    showToast('❌ Test fallito: nemmeno una foto di prova sempre funzionante si carica qui. Il problema non è il tuo link: sembra che questa pagina non riesca a caricare immagini esterne su questo dispositivo.');
  }
}
var COVER_LOG = [];
function coverLog(msg){
  try{
    COVER_LOG.push(new Date().toTimeString().slice(0,8) + ' — ' + msg);
    if(COVER_LOG.length > 14) COVER_LOG.shift();
    console.info('[coperture] ' + msg);
    const el = document.getElementById('coverDiagLog');
    if(el) el.innerHTML = COVER_LOG.map(escHtml).join('<br>');
  }catch(_){}
}
var coverDiagOpen = false;
function coverDiagHtml(){
  if(!coverDiagOpen) return '';
  const rows = [
    ['Pagina dentro Claude', (window.claude && typeof window.claude.use==='function') ? 'sì' : 'NO (file locale?)'],
    ['Stato archivio', COVER_STATE + ' (db: ' + (COVER_DB?'ok':'—') + ', foto: ' + (COVER_ASSETS?'ok':'—') + ')'],
    ['Copertine caricate da te', String(Object.keys(USER_COVERS).length)],
    ['Browser', (navigator.userAgent||'').slice(0,90)]
  ];
  return `<div class="cover-diag">${rows.map(r=>`<b>${r[0]}:</b> ${escHtml(r[1])}`).join('<br>')}<br><button class="btn" type="button" data-cover-selftest style="margin:8px 0;">🧪 Testa se le foto esterne funzionano qui</button><br><b>Eventi:</b><br><span id="coverDiagLog">${COVER_LOG.length?COVER_LOG.map(escHtml).join('<br>'):'(ancora nessuno)'}</span></div>`;
}
function coverHtml(g){
  const url = effectiveCover(g);
  const canUrl = !!COVER_DB;
  const canUpload = !!(COVER_DB && COVER_ASSETS);
  const fitMode = coverFitGet(g.id), fitF = COVER_FITS.find(f=> f[0] === fitMode), cssUrl = url ? escHtml(String(url).replace(/'/g, '%27').replace(/"/g, '%22').replace(/[()\\]/g, c=> '%' + c.charCodeAt(0).toString(16))) : '';
  const media = url ? `<div class="cover-frame" data-fit="${fitMode}" style="--rn:${fitF[2] || 0.75};--cov:url('${cssUrl}')"><img class="modal-cover" src="${escHtml(url)}" alt="Copertina di ${escHtml(g.name)}" decoding="async" onload="coverFitLoad(this);this.classList.add('ld')" onerror="this.classList.add('ld')"><div class="cover-mini"><button type="button" data-cover-alt title="Cerca un'altra immagine migliore" aria-label="Cerca un'altra immagine">${giIcon('lens')}</button></div></div>` : coverPlaceholderHtml(g);
  const currentUrlValue = (url && /^https?:\/\//i.test(url)) ? url : '';
  const uploadRow = canUpload ? `<div class="cover-tools">
      <label class="cover-pill${coverBusy?' busy':''}" data-cover-upload-label title="Scegli una foto dalla galleria del telefono">${ICON_PHOTO}<span>Carica dal telefono</span><input type="file" accept="image/*" data-cover-file-input ${coverBusy?'disabled':''}></label>
      <label class="cover-pill${coverBusy?' busy':''}" data-cover-camera-label title="Scatta una foto adesso con la fotocamera">${giIcon('cam')}<span>Scatta foto</span><input type="file" accept="image/*" capture="environment" data-cover-camera-input ${coverBusy?'disabled':''}></label>
    </div>` : '';
  const hint = !canUrl
    ? `<div class="cover-hint">Il salvataggio della copertina non è disponibile qui: apri questa pagina restando connesso al tuo account Claude (non da un link "pubblico" o da un altro browser senza accesso).</div>`
    : `<div class="cover-hint">${canUpload ? '<b>Consigliato:</b> usa "Carica dal telefono" o "Scatta foto" qui sopra — funziona sempre, anche se il tuo telefono non riesce a caricare immagini da internet.<br>' : ''}In alternativa, incolla un link diretto a un\'immagine qui sotto (su molti telefoni i link a foto esterne non si aprono: se il link non funziona, usa il caricamento qui sopra invece).</div>`;
  // strumenti copertina tutti su una riga; link e spiegazioni in un riquadro richiudibile (scheda più ordinata)
  return `<div class="cover-block" id="coverBlock">${media}
    <div class="cover-tools">${uploadRow ? uploadRow.replace(/^<div class="cover-tools">|<\/div>$/g, '') : ''}
      <a class="cover-pill" href="${coverSearchUrl(g)}" target="_blank" rel="noopener" title="Cerca la copertina su internet">${ICON_GLOBE}<span>Cerca copertina</span></a>
      <button class="cover-pill" type="button" data-cover-diag aria-expanded="${coverDiagOpen?'true':'false'}" title="Mostra la diagnostica">${giIcon('pulse')}</button>
    </div>
    <details class="cover-more"${coverBusy || !canUrl ? ' open' : ''}><summary>${giIcon('link')} Usa un link o leggi i consigli</summary>
    ${canUrl ? `<div class="cover-urlrow">
      <input type="text" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Incolla qui il link dell'immagine (https://...)" value="${escHtml(currentUrlValue)}" data-cover-url-input ${coverBusy?'disabled':''}>
      <button class="btn primary" type="button" data-cover-url-save ${coverBusy?'disabled':''}>${coverBusy?'…':'Salva'}</button>
    </div>` : ''}
    ${hint}</details>${coverDiagHtml()}</div>`;
}
function wireCover(g){
  const block = document.getElementById('coverBlock'); if(!block) return;
  const img = block.querySelector('img.modal-cover');
  if(img){
    img.addEventListener('error', ()=>{ const fr = img.closest('.cover-frame'); (fr || img).outerHTML = coverPlaceholderHtml(g); }, {once:true});
    img.addEventListener('click', ()=>{ openLightbox(img.src, img.alt); });
  }
  const urlInput = block.querySelector('[data-cover-url-input]');
  const urlSaveBtn = block.querySelector('[data-cover-url-save]');
  if(urlSaveBtn) urlSaveBtn.addEventListener('click', ()=> saveCoverUrl(g, urlInput ? urlInput.value : ''));
  if(urlInput) urlInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); saveCoverUrl(g, urlInput.value); } });
  const fileInput = block.querySelector('[data-cover-file-input]');
  if(fileInput) fileInput.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if(file) handleCoverUpload(g, file);
  });
  const cameraInput = block.querySelector('[data-cover-camera-input]');
  if(cameraInput) cameraInput.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if(file) handleCoverUpload(g, file);
  });
  const diagBtn = block.querySelector('[data-cover-diag]');
  if(diagBtn) diagBtn.addEventListener('click', ()=>{ coverDiagOpen = !coverDiagOpen; refreshCover(g); });
  const selfTestBtn = block.querySelector('[data-cover-selftest]');
  if(selfTestBtn) selfTestBtn.addEventListener('click', runCoverImageSelfTest);
}
async function saveCoverUrl(g, raw){
  const trimmed = String(raw || '').trim();
  if(!trimmed){ showToast('Incolla prima un link nella casella'); return; }
  if(!/^https?:\/\/\S+$/i.test(trimmed)){ showToast('Non sembra un link valido (deve iniziare con http:// o https://)'); coverLog('link scartato: formato non valido (' + trimmed.slice(0,40) + ')'); return; }
  const badHint = coverUrlKnownBadHint(trimmed);
  if(badHint){
    coverLog('link scartato: pattern noto non-immagine (' + trimmed.slice(0,60) + ')');
    showToast(badHint + ' Apri la foto a schermo intero, tieni premuto sull\'immagine vera e propria (non su "Condividi") e scegli "Copia indirizzo immagine".');
    return;
  }
  if(!COVER_DB){ showToast('Archivio non disponibile in questa pagina al momento'); coverLog('salvataggio link annullato: db non pronto'); return; }
  coverBusy = true; refreshCover(g);
  coverLog('verifico che il link si apra come immagine…');
  const { ok, reason } = await probeImageUrl(trimmed);
  if(!ok){
    coverBusy = false; refreshCover(g);
    coverLog('link scartato (' + reason + '), NON salvato (' + trimmed.slice(0,60) + ')');
    const extra = reason==='timeout' ? ' (il link non ha risposto in tempo: rete lenta o bloccata)' : '';
    showToast('Questo link non si apre come immagine' + extra + ': non l\'ho salvato. Se ti succede con OGNI link che provi, tocca 🩺 qui sotto → "Testa se le foto esterne funzionano qui" per capire se il problema è generale.');
    return;
  }
  coverLog('immagine verificata (ok), salvo il link…');
  try{
    await COVER_DB.doc('covers/' + String(g.id)).set({url: trimmed, name: g.name, updatedAt: new Date().toISOString()});
    USER_COVERS[String(g.id)] = trimmed;
    coverLog('fatto: copertina salvata come link, sincronizzata su ogni dispositivo');
    showToast('Copertina salvata');
  }catch(e){
    coverLog('ERRORE salvataggio link: ' + (e && e.code || 'sconosciuto'));
    showToast(coverErrorMessage(e));
  }finally{
    coverBusy = false; refreshCover(g);
  }
}
async function pasteCoverUrl(g){
  const raw = window.prompt('Incolla qui il link diretto a un\'immagine (su Google Immagini: tieni premuto sulla foto → "Copia indirizzo immagine"):');
  if(raw === null) return;
  const trimmed = raw.trim();
  if(!trimmed) return;
  if(!/^https?:\/\/\S+$/i.test(trimmed)){ showToast('Non sembra un link valido (deve iniziare con http:// o https://)'); coverLog('link scartato: formato non valido'); return; }
  if(!COVER_DB){ showToast('Archivio non disponibile in questa pagina al momento'); coverLog('salvataggio link annullato: db non pronto'); return; }
  coverBusy = true; refreshCover(g);
  coverLog('salvo la copertina come link esterno…');
  try{
    await COVER_DB.doc('covers/' + String(g.id)).set({url: trimmed, name: g.name, updatedAt: new Date().toISOString()});
    USER_COVERS[String(g.id)] = trimmed;
    coverLog('fatto: copertina salvata come link, sincronizzata su ogni dispositivo');
    showToast('Copertina salvata (link)');
  }catch(e){
    coverLog('ERRORE salvataggio link: ' + (e && e.code || 'sconosciuto'));
    showToast(coverErrorMessage(e));
  }finally{
    coverBusy = false; refreshCover(g);
  }
}
// ---- Giochi aggiunti da Mario (via "Chiedi a Claude"), sincronizzati su ogni dispositivo ----
let CUSTOM_GAME_IDS = new Set();
function nextCustomGameId(){
  let id;
  do{ id = 900000 + Math.floor(Math.random()*99999); }while(GAMES.some(x=>x.id===id));
  return id;
}
function clampIntOrNull(v, min, max){
  const n = parseInt(v, 10);
  if(isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}
function cleanProsCons(pros, cons){
  const f = arr=> Array.isArray(arr) ? arr.map(x=>String(x).trim()).filter(Boolean).slice(0,5) : [];
  const p = f(pros), c = f(cons);
  return (p.length || c.length) ? {pros:p, cons:c} : null;
}
// ---- Simboli e dettagli dei giochi aggiunti: stessi campi dei giochi di base (💕 storia romantica, 🤝 legame, ✨ sorprendente, 💉 dopamina, voto nel tempo, gameplay...) ----
// «Fa per te se…» / «Lascia stare se…»: sempre in seconda persona. Corregge le frasi in terza persona dell'AI («gli piacerà», «a chi ama…»); se non riesce, scarta.
function fixSecondPerson(t){
  if(t == null) return t;
  let s = String(t).trim();
  if(!s) return s;
  s = s.replace(/^(?:fa per te se|lascia stare se|adatto se|consigliato se)\s*[:,\-–]?\s*/i, '');
  s = s.replace(/^se\s+/i, '');
  s = s.replace(/^(?:a chi|per chi|a chiunque|chi)\s+/i, '');
  const V = {ama:'ami', cerca:'cerchi', vuole:'vuoi', apprezza:'apprezzi', preferisce:'preferisci', gradisce:'gradisci', odia:'odi', teme:'temi', sopporta:'sopporti', desidera:'desideri', ricerca:'ricerchi', predilige:'prediligi', ha:'hai', è:'sei', gioca:'giochi', 'si annoia':'ti annoi', 'si aspetta':'ti aspetti', 'non ama':'non ami', 'non cerca':'cerchi', 'non vuole':'non vuoi', 'non sopporta':'non sopporti', 'non apprezza':'non apprezzi', 'non ha':'non hai', 'non gradisce':'non gradisci', 'non regge':'non reggi', 'ha paura':'hai paura', 'ama':'ami'};
  s = s.replace(/^(gli|le)\s+piac(?:e|erà|ciono|eranno)\s+/i, 'ami ');
  s = s.replace(/^piacer[àa]\s+(?:a chi|se)\s+/i, '');
  s = s.replace(/^non piacer[àa]\s+(?:a chi|se)\s+/i, 'non ');
  const m = s.match(/^(non ama|non cerca|non vuole|non sopporta|non apprezza|non ha|non gradisce|non regge|si annoia|si aspetta|ha paura|ama|cerca|vuole|apprezza|preferisce|gradisce|odia|teme|sopporta|desidera|ricerca|predilige|ha|è|gioca)\b/i);
  if(m){ s = V[m[1].toLowerCase()] + s.slice(m[1].length); }
  s = s.replace(/\.+$/, '');
  if(/\b(gli|le)\s+piac|\bil giocatore\b|\bi giocatori\b|\bl'utente\b|^Mario\b|\b(?:a|per|da|di)\s+Mario\b(?!\s+(?:Bros|Kart|Party|Golf|Tennis|Odyssey|RPG|Strikers|Maker|Galaxy|Sunshine|Wonder))/i.test(s)) return '';
  return s.charAt(0).toLowerCase() + s.slice(1);
}
// coerenza tra «peso storia» e «ore storia»: se la trama è minima le ore non possono essere quelle di un gioco lungo
function labelCoherent(l, tags){
  if(!l) return true;
  const noStory = ['ROG','TAC','PUZ','ARCADE','SHMUP','PLAT','RACE','SPORT','RTS','TOWERDEF','FPS','BR','MOBA','FIGHT','BEAT','RHY','CITY','SAND'];
  const genreNoStory = (tags || []).some(t=> noStory.includes(t));
  if(l.s != null && l.s <= 1 && l.h != null && l.h > 10) return false;
  if(l.s != null && l.s <= 2 && genreNoStory && l.h != null && l.h > 15) return false;
  return true;
}
function cleanCustomEnrich(o){
  if(!o || typeof o !== 'object') return null;
  const str = (x, min)=> (typeof x === 'string' && x.trim().length >= (min || 3)) ? x.trim() : null;
  const num = (x, lo, hi)=>{ const n = typeof x === 'number' ? x : parseFloat(x); return (isFinite(n) && n >= lo && n <= hi) ? n : null; };
  const e = {};
  if(['romance','affinity','wow'].includes(o.storyTag)){ e.storyTag = o.storyTag; const n = str(o.storyTagNote, 8); if(n) e.storyTagNote = n; }
  if(o.dopamine === true){
    e.dopamine = true;
    const d = o.dopa;
    if(d && Array.isArray(d.loop) && d.loop.length >= 2 && str(d.hook, 8)) e.dopa = {loop: d.loop.map(String).slice(0, 5), hook: String(d.hook), watch: str(d.watch, 8) || ''};
  }
  const full = {eraScore: num(o.eraScore, 0, 100), todayScore: num(o.todayScore, 0, 100), gameplayScore: num(o.gameplayScore, 0, 10),
    agingNote: str(o.agingNote, 12), gameplayNote: str(o.gameplayNote, 12), whyLikeIt: str(o.whyLikeIt, 12),
    hoursMain: num(o.hoursMain, 1, 400), hoursCompletionist: num(o.hoursCompletionist, 1, 1500), lengthVerdict: str(o.lengthVerdict, 8), remaster: str(o.remaster, 5), language: str(o.language, 5)};
  // serve solo il nucleo dell'analisi (prima serviva TUTTO e bastava un campo vuoto per perdere anche «come regge oggi» e gameplay); ore, riedizioni e lingua sono facoltativi
  if(['eraScore', 'todayScore', 'gameplayScore', 'agingNote', 'gameplayNote', 'whyLikeIt'].every(k=> full[k] != null)) Object.keys(full).forEach(k=>{ if(full[k] != null) e[k] = full[k]; });
  if(Array.isArray(o.similarTo)){ const sim = o.similarTo.map(x=> String(x).trim()).filter(x=> x.length > 1 && x.length < 80).slice(0, 5); if(sim.length) e.similarTo = sim; }
  e.checked = typeof o.checked === 'string' ? o.checked : undefined;
  return (e.storyTag || e.dopamine || e.eraScore != null || e.checked) ? e : null;
}
// firma dei dati che cambiano ordine o filtri della lista: se cambiano serve un ridisegno completo, altrimenti basta la riga
const CUSTOM_SIG = new Map(), CUSTOM_DATA = new Map();
const customSig = g=> [g.name, g.tier, g.score, g.year, (g.tags || []).join(','), g.plat, g.m].join('|');
function syncCustomGames(snap){
  const seen = new Set();
  let structural = false; const changed = [];
  (snap.docs || []).forEach(d=>{
    const v = d.data();
    const id = parseInt(d.id, 10);
    if(!id || !v || !v.name) return;
    seen.add(id);
    const entry = {
      id,
      name: String(v.name),
      plat: v.plat ? String(v.plat) : '—',
      year: v.year ? String(v.year) : '',
      ysort: parseInt(v.year, 10) || 0,
      // ND: un gioco aggiunto con voto NON verificato (né Metacritic né OpenCritic) sta sotto tutti i rank; diventa un rank vero solo quando il voto è verificato
      tier: v.m === 'V' ? ((TIERS_LIST.includes(v.tier) && v.tier !== 'ND') ? v.tier : (sc0=> sc0 >= 95 ? 'S+' : sc0 >= 90 ? 'S' : sc0 >= 85 ? 'A' : sc0 >= 80 ? 'B' : sc0 >= 70 ? 'C' : sc0 >= 60 ? 'D' : sc0 >= 40 ? 'E' : 'F')(clampIntOrNull(v.score, 0, 100) != null ? clampIntOrNull(v.score, 0, 100) : 70)) : 'ND',
      score: v.m === 'V' ? (clampIntOrNull(v.score, 0, 100) != null ? clampIntOrNull(v.score, 0, 100) : 70) : Math.min(79, clampIntOrNull(v.score, 0, 100) != null ? clampIntOrNull(v.score, 0, 100) : 70),
      vs: v.vs ? String(v.vs) : undefined,
      m: v.m === 'V' ? 'V' : 'S',          // V = voto verificato da Metacritic/OpenCritic (lo scrive Update+ / «Aggiorna info»)
      note: v.note ? String(v.note) : 'Aggiunto da te tramite "Chiedi" — non è nella classifica ufficiale, il voto è una stima.',
      story: v.story ? String(v.story) : '',
      tags: Array.isArray(v.tags) ? v.tags.filter(t=> TAG_INFO[t]) : [],
      custom: true,
      proscons: cleanProsCons(v.pros, v.cons),
      label: (v.label && typeof v.label === 'object') ? v.label : null
    };
    { const ce = cleanCustomEnrich(v.enrich); if(ce && !ce.storyTagNote && ce.storyTag){ delete ce.storyTag; }   // simbolo solo se l'AI spiega cosa rende unico il gioco (il voto non conta)
      if(ce){ if(ce.eraScore != null){ ce.pros = (entry.proscons && entry.proscons.pros) || []; ce.cons = (entry.proscons && entry.proscons.cons) || []; } entry.enrich = ce; } }
    const idx = GAMES.findIndex(x=>x.id===id);
    if(idx>=0) GAMES[idx] = entry; else GAMES.push(entry);
    CUSTOM_GAME_IDS.add(id);
    const sig = customSig(entry), old = CUSTOM_SIG.get(id);
    const dsig = v._u != null ? String(v._u) : JSON.stringify(v), dold = CUSTOM_DATA.get(id);
    if(old === undefined || old !== sig) structural = true;
    else if(dold !== dsig) changed.push(entry);
    CUSTOM_SIG.set(id, sig); CUSTOM_DATA.set(id, dsig);
  });
  Array.from(CUSTOM_GAME_IDS).forEach(id=>{
    if(!seen.has(id)){
      const idx = GAMES.findIndex(x=>x.id===id);
      if(idx>=0) GAMES.splice(idx, 1);
      CUSTOM_GAME_IDS.delete(id);
      CUSTOM_SIG.delete(id); CUSTOM_DATA.delete(id); structural = true;
    }
  });
  if(structural){ try{ renderWhenIdle({metrics: true, stats: true, list: true, bar: true}); }catch(e){ try{ renderMetrics(); renderStats(); render(); renderListBar(); }catch(x){} } }
  else changed.forEach(g=> refreshGameRow(g));          // cambiati solo testi/simboli: aggiorno le righe, la lista resta ferma dov'è
}
async function pasteCover(g){
  coverLog('provo a leggere gli appunti');
  try{
    const items = await navigator.clipboard.read();
    for(const it of items){
      const type = (it.types || []).find(t=>t && t.indexOf('image/')===0);
      if(type){
        const blob = await it.getType(type);
        coverLog('immagine trovata negli appunti (' + type + ', ' + Math.round(blob.size/1024) + ' KB)');
        handleCoverUpload(g, blob);
        return;
      }
    }
    showToast('Negli appunti non c\'è un\'immagine: copia prima una foto');
    coverLog('appunti letti ma senza immagini');
  }catch(e){
    showToast('Non riesco a leggere gli appunti: consenti l\'accesso quando il browser lo chiede');
    coverLog('lettura appunti rifiutata o fallita');
  }
}
function refreshCover(g){
  const block = document.getElementById('coverBlock');
  if(!block || !currentModalGame || currentModalGame.id !== g.id) return;
  block.outerHTML = coverHtml(g);
  wireCover(g);
}
function shrinkImage(file){
  return new Promise(resolve=>{
    let objUrl;
    try { objUrl = URL.createObjectURL(file); } catch(e){ resolve(file); return; }
    const img = new Image();
    img.onload = ()=>{
      try{
        const w = img.naturalWidth, h = img.naturalHeight, max = 1000;
        const s = Math.min(1, max / Math.max(w, h));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w*s)); c.height = Math.max(1, Math.round(h*s));
        const ctx = c.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b=>{ URL.revokeObjectURL(objUrl); resolve(b && b.size > 0 ? b : file); }, 'image/jpeg', 0.88);
      }catch(e){ URL.revokeObjectURL(objUrl); resolve(file); }
    };
    img.onerror = ()=>{ URL.revokeObjectURL(objUrl); resolve(file); };
    img.src = objUrl;
  });
}
function coverErrorMessage(e){
  const code = e && e.code;
  if(code === 'unsupported_type') return 'Formato non supportato: scegli una foto JPG o PNG';
  if(code === 'too_large') return 'Immagine troppo grande (massimo 20 MB)';
  if(code === 'quota_or_state' || code === 'quota_exceeded') return 'Spazio della pagina esaurito: non posso salvare altre copertine';
  if(code === 'rate_limited' || code === 'resource_exhausted') return 'Troppi caricamenti ravvicinati: riprova tra un attimo';
  if(code === 'upstream_auth') return 'Sessione scaduta: ricarica la pagina e riprova';
  if(code === 'not_granted') return 'Non hai i permessi per salvare qui: apri il link dal tuo account Claude';
  if(code === 'capability_disabled' || code === 'capability_removed') return 'Funzione non disponibile in questa versione della pagina: ricaricala e riprova';
  if(code === 'store_unavailable') return 'Servizio momentaneamente non disponibile: riprova tra poco';
  return 'Caricamento non riuscito: riprova';
}
async function handleCoverUpload(g, file){
  if(coverBusy) return;
  if(!COVER_ASSETS || !COVER_DB){ coverLog('caricamento annullato: archivio non pronto (stato ' + COVER_STATE + ')'); return; }
  coverBusy = true; refreshCover(g);
  coverLog('avvio caricamento e ridimensionamento…');
  const key = String(g.id);
  let uploaded = null;
  try{
    const blob = await shrinkImage(file);
    coverLog('immagine pronta (' + Math.round(blob.size/1024) + ' KB): la invio all\'archivio della pagina');
    const type = /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : undefined;
    uploaded = await COVER_ASSETS.upload(blob, type ? {type} : undefined);
    coverLog('foto salvata nell\'archivio, aggiorno il database…');
    await COVER_DB.doc('covers/' + key).set({asset: uploaded.id, name: g.name, updatedAt: new Date().toISOString()});
    const previous = USER_COVER_IDS[key];
    USER_COVERS[key] = uploaded.url; USER_COVER_IDS[key] = uploaded.id;
    if(previous && previous !== uploaded.id){ try{ await COVER_ASSETS.delete(previous); }catch(e){} }
    coverLog('fatto: copertina salvata e sincronizzata');
    showToast('Copertina salvata: la ritrovi su ogni dispositivo');
  }catch(e){
    coverLog('ERRORE: ' + (e && e.code || 'sconosciuto') + ' — ' + (e && e.message || ''));
    if(uploaded && USER_COVER_IDS[key] !== uploaded.id){ try{ await COVER_ASSETS.delete(uploaded.id); }catch(_){} }
    showToast(coverErrorMessage(e));
  }finally{
    coverBusy = false; refreshCover(g);
  }
}
// Foto copertina fuori da Claude: ridotte (max 480px) e salvate in localStorage, poi sincronizzate con il resto
function localBlobs(){ try{ return JSON.parse(localStorage.getItem('jrpg_db_blobs') || '{}') || {}; }catch(e){ return {}; } }
function makeLocalAssets(){
  const small = blob=> new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(blob), im = new Image();
    im.onload = ()=>{
      const s = Math.min(1, 480 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.72));
    };
    im.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('immagine non leggibile')); };
    im.src = url;
  });
  return {
    async upload(blob){
      const dataUrl = await small(blob);
      const id = Array.from({length:32}, ()=> Math.floor(Math.random()*16).toString(16)).join('');
      const all = localBlobs(); all[id] = dataUrl;
      try{ localStorage.setItem('jrpg_db_blobs', JSON.stringify(all)); }catch(e){ const err = new Error('spazio del browser esaurito'); err.code = 'quota'; throw err; }
      return {id, url: dataUrl, sizeBytes: dataUrl.length, contentType: 'image/jpeg'};
    },
    async delete(id){ const all = localBlobs(); delete all[id]; try{ localStorage.setItem('jrpg_db_blobs', JSON.stringify(all)); }catch(e){} }
  };
}
// ---- Fuori da Claude non c'è il database: un piccolo archivio in localStorage con la stessa interfaccia ----
function makeLocalDb(){
  const key = c=> 'jrpg_db_' + c;
  const load = c=>{ try{ return JSON.parse(localStorage.getItem(key(c)) || '{}') || {}; }catch(e){ return {}; } };
  const save = (c, m)=>{ try{ localStorage.setItem(key(c), JSON.stringify(m)); }catch(e){ try{ showToast('⚠️ Spazio del browser esaurito: la modifica non è stata salvata. Fai un backup da ✨ → Backup e libera spazio.', 6000); }catch(x){} } };
  const listeners = {};
  // ogni documento porta la data di modifica (_u); le cancellazioni lasciano una «lapide» (_d) così la sincronizzazione tra dispositivi le propaga
  const live = m=> Object.keys(m).filter(id=> !(m[id] && typeof m[id] === 'object' && m[id]._d));
  const snapOf = c=>{ const m = load(c); return {docs: live(m).map(id=>({id, data:()=>m[id]}))}; };
  const notify = c=>{ (listeners[c] || []).forEach(fn=>{ try{ fn(snapOf(c)); }catch(e){} }); };
  return {
    doc(path){
      const [c, id] = path.split('/');
      return {
        set(d){ const m = load(c); m[id] = (d && typeof d === 'object') ? Object.assign({}, d, {_u: Date.now()}) : d; save(c, m); notify(c); return Promise.resolve(); },
        delete(){ const m = load(c); m[id] = {_d: 1, _u: Date.now()}; save(c, m); notify(c); return Promise.resolve(); }
      };
    },
    collection(c){
      return {
        onSnapshot(fn){ (listeners[c] = listeners[c] || []).push(fn); setTimeout(()=>fn(snapOf(c)), 0); return ()=>{}; },
        add(d){ const m = load(c); m['a' + Date.now() + Math.random().toString(36).slice(2,6)] = d; save(c, m); return Promise.resolve(); }
      };
    }
  };
}
function attachDbListeners(){
    try{
      COVER_DB.collection('covers').onSnapshot(snap=>{
        const next = {}, nextIds = {};
        snap.docs.forEach(d=>{
          const v = d.data();
          if(!v) return;
          if(typeof v.asset === 'string' && /^[0-9a-f]{32}$/.test(v.asset)){ next[d.id] = localBlobs()[v.asset] || ('/_blob/' + v.asset); nextIds[d.id] = v.asset; }
          else if(typeof v.url === 'string' && /^https?:\/\//i.test(v.url)){ next[d.id] = v.url; }
        });
        USER_COVERS = next; USER_COVER_IDS = nextIds;
        if(currentModalGame && modalBackdrop.classList.contains('show') && !coverBusy) refreshCover(currentModalGame);
      }, ()=>{});
    }catch(e){}
    try{
      COVER_DB.collection('customGames').onSnapshot(snap=>{ syncCustomGames(snap); }, ()=>{});
    }catch(e){}
}
(function initCoverStore(){
  if(!(window.claude && typeof window.claude.use === 'function')){
    COVER_DB = makeLocalDb();
    COVER_ASSETS = makeLocalAssets();
    COVER_STATE = 'ready';
    attachDbListeners();
    coverLog('window.claude non disponibile: pagina aperta fuori dalla piattaforma Claude (es. file salvato in locale)');
    return;
  }
  const markUnavailableIfPending = setTimeout(()=>{
    if(COVER_STATE === 'pending'){
      COVER_STATE = 'unavailable';
      coverLog('use("db")/use("assets") non hanno risposto entro 12s');
      if(currentModalGame && modalBackdrop.classList.contains('show') && !coverBusy) refreshCover(currentModalGame);
    }
  }, 12000);
  Promise.all([
    window.claude.use('db').catch(e=>{ coverLog('use("db") fallita: ' + (e&&e.code||e)); return null; }),
    window.claude.use('assets').catch(e=>{ coverLog('use("assets") fallita: ' + (e&&e.code||e)); return null; })
  ]).then(([db, assets])=>{
    clearTimeout(markUnavailableIfPending);
    COVER_DB = db || null;
    COVER_ASSETS = (db && assets) ? assets : null;
    COVER_STATE = COVER_ASSETS ? 'ready' : 'unavailable';
    coverLog('capacità risolte — db: ' + !!db + ', foto: ' + !!assets);
    if(COVER_DB) attachDbListeners();
    if(currentModalGame && modalBackdrop.classList.contains('show') && !coverBusy) refreshCover(currentModalGame);
  });
})();
function highlightsHtml(g){
  const e = g.enrich; if(!e || (!e.storyTag && !e.dopamine)) return '';
  let out = '<div class="enrich-highlights">';
  if(e.storyTag && STORY_TAG_INFO[e.storyTag]) out += `<span class="enrich-chip ${e.storyTag}">${STORY_TAG_INFO[e.storyTag].icon} ${STORY_TAG_INFO[e.storyTag].label}${e.storyTagNote ? ' — ' + e.storyTagNote : ''}</span>`;
  if(e.dopamine) out += `<button type="button" class="enrich-chip dopamine dopa-toggle" aria-expanded="false" aria-controls="dopaPanel">💉 Loop molto coinvolgente <span class="dopa-chev" aria-hidden="true">▾</span></button>`;
  out += '</div>';
  if(e.dopamine) out += dopaPanelHtml(g);
  return out;
}
function dopaPanelHtml(g){
  const d = g.enrich && g.enrich.dopa;
  const def = `<p class="dopa-def"><b>Cosa vuol dire «dopamina»:</b> il gioco ti premia spesso e ti spinge a dire «ancora un turno». Non misura la qualità, misura quanto è difficile staccarsi.</p>`;
  if(!d) return `<div class="dopa-panel" id="dopaPanel" hidden>${def}</div>`;
  const steps = (d.loop||[]).map(s=>`<span class="dopa-step">${escHtml(s)}</span>`).join('<span class="dopa-arrow" aria-hidden="true">→</span>');
  return `<div class="dopa-panel" id="dopaPanel" hidden>
    ${def}
    <span class="dopa-k">Il ciclo che ti tiene incollato</span>
    <div class="dopa-loop">${steps}</div>
    <p><span class="dopa-k">🎣 Perché non smetti</span>${escHtml(d.hook)}</p>
    ${d.watch ? `<p><span class="dopa-k">⚠️ Quando può stancare</span>${escHtml(d.watch)}</p>` : ''}
  </div>`;
}
function customProsConsHtml(g){
  const pc = g.proscons;
  if(!pc || !((pc.pros||[]).length || (pc.cons||[]).length)) return '';
  return `<div class="modal-section-title">➕➖ Pro & Contro</div>
    <div class="proscons">
      <ul class="pros">${(pc.pros||[]).map(p=>`<li>${escHtml(p)}</li>`).join('')}</ul>
      <ul class="cons">${(pc.cons||[]).map(c=>`<li>${escHtml(c)}</li>`).join('')}</ul>
    </div>`;
}
function enrichHtml(g){
  const e = g.enrich;
  if((!e || e.eraScore == null) && g.custom && customProsConsHtml(g)) return customProsConsHtml(g);
  if(!e || e.eraScore == null){
    return `<div class="modal-section-title">🔍 Approfondimento</div><div class="modal-story placeholder">Analisi approfondita (voto nel tempo, gameplay, longevità, lingua...) in arrivo per questo titolo.</div>`;
  }
  return `
    <div class="modal-section-title">⚖️ Voto nel tempo</div>
    <div class="dualscore-row">
      <div class="dualscore-box"><span class="dualscore-label">Ai tempi</span><span class="dualscore-val">${e.eraScore}</span></div>
      <div class="dualscore-box"><span class="dualscore-label">Oggi</span><span class="dualscore-val">${e.todayScore}</span></div>
    </div>
    <div class="modal-note">${e.agingNote}</div>
    <div class="modal-section-title">🎮 Gameplay <span class="badge outline">${e.gameplayScore}/10</span></div>
    <div class="modal-note">${e.gameplayNote}</div>
    <div class="modal-section-title">💡 Perché potrebbe piacerti</div>
    <div class="modal-note">${e.whyLikeIt}</div>
    <div class="modal-section-title">➕➖ Pro & Contro</div>
    <div class="proscons">
      <ul class="pros">${e.pros.map(p=>`<li>${p}</li>`).join('')}</ul>
      <ul class="cons">${e.cons.map(c=>`<li>${c}</li>`).join('')}</ul>
    </div>
    ${e.hoursMain != null ? `<div class="modal-section-title">⏱️ Longevità</div>
    <div class="modal-note"><strong>${e.hoursMain}h</strong> storia principale${e.hoursCompletionist != null ? ` · <strong>${e.hoursCompletionist}h</strong> completista` : ''}.${e.lengthVerdict ? '<br>' + e.lengthVerdict : ''}</div>` : ''}
    ${(e.remaster || e.language) ? `<div class="modal-section-title">ℹ️ Dettagli</div>
    <div class="modal-note">${e.remaster ? `<strong>Riedizioni:</strong> ${e.remaster}` : ''}${e.remaster && e.language ? '<br>' : ''}${e.language ? `<strong>Lingua:</strong> ${e.language}` : ''}</div>` : ''}
  `;
}

// ---- Etichetta del gioco (stile valori nutrizionali) ----
const LABEL_PACE = {L:'Lento', M:'Medio', V:'Veloce'};
const LABEL_IT = {D:'🎙️ Testi e doppiaggio in italiano', S:'✅ Testi/sottotitoli in italiano', F:'🌐 Solo fan-translation', N:'🇬🇧 Solo inglese/altro'};
const LABEL_STORE = {PS:'PlayStation', XB:'Xbox', NS:'Switch', PC:'PC', MOB:'Mobile'};
// nota «voto e dettagli sono una stima…»: se il voto è poi diventato verificato (V) la frase non è più vera, la sostituisco
function noteForVoto(g){
  const n = String(g.note || '');
  const vs = String(g.vs || '').replace(/ \(nessun Metacritic trovato\)/, '').trim();
  return g.m === 'V' ? n.replace(/ — (?:nessun Metacritic trovato: )?voto e dettagli sono una stima[^.]*\.| — voto verificato \(Metacritic\/OpenCritic\)\./, ' — voto verificato (' + (vs || 'Metacritic/OpenCritic') + ').') : n;
}
// da dove viene il voto: Metacritic se c'è, altrimenti lo dico chiaramente (fonte o stima)
// link al sito ufficiale di Metacritic per controllare il voto a mano (dal telefono il sito non si può leggere dentro il programma)
const mcLink = g=> ` <a class="mc-link" href="https://www.metacritic.com/search/${encodeURIComponent(cleanBaseTitle(g.name))}/?category=13" target="_blank" rel="noopener" title="Apri la ricerca su Metacritic (sito ufficiale)">↗ Metacritic ufficiale</a>`;
const cleanBaseTitle = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').trim();
function voteSourceHtml(g){ return voteSourceHtml0(g) + mcLink(g); }
function voteSourceHtml0(g){
  const vs = g.vs || '';
  if(g.m === 'V' && /^Metacritic/.test(vs)) return `${giIcon('tag')} <span>Voto preso da <b>${escHtml(vs)}</b>.</span>`;
  if(g.m === 'V' && vs) return `⚠️ <span>Nessun Metacritic trovato: voto preso da <b>${escHtml(vs.replace(/ \(nessun Metacritic trovato\)/, ''))}</b>.</span>`;
  if(g.m === 'V') return `${giIcon('tag')} <span>Voto verificato (Metacritic/OpenCritic): fonte esatta non ancora registrata, premi «Update V+» per vederla.</span>`;
  return `⚠️ <span>Nessun Metacritic trovato: il voto è una <b>stima</b> (non verificata).</span>`;
}
// esito dell'ultimo controllo del voto, fonte per fonte (priorità: Metacritic → OpenCritic → RAWG); i ⚠️ dicono se un sito è bloccato, la chiave non va o la quota è finita
function voteDiagHtml(g){
  const d = typeof voteDiagFor === 'function' ? voteDiagFor(g.id) : null;
  if(!d || !d.lines || !d.lines.length) return '';
  const day = new Date(d.t).toLocaleDateString('it-IT') + ' ' + new Date(d.t).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
  return `<details class="fresh-line" ${d.prob && d.prob.length ? 'open' : ''}><summary>Ricerca del voto (${day})${d.prob && d.prob.length ? ' · ⚠️ ' + d.prob.length + ' fonte/i con problemi' : ''}</summary><div>${d.lines.map(escHtml).join('<br>')}</div></details>`;
}
function labelBar(n, max){
  let out = '<span class="glabel-bar">';
  for(let i=1;i<=max;i++) out += `<i class="${i<=n?'on':''}"></i>`;
  return out + '</span>';
}
// prezzo e sconto su Steam, dai dati settimanali scaricati dai server (facts.js)
function factsHtml(g){
  const f = window.SearchHub ? SearchHub.factsFor(g) : null;
  if(!f || !f.s || !f.s.p) return '';
  const p = f.s.p, eur = n=> n.toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  const d = p.d > 0 ? ` <b class="fx-disc">−${p.d}%</b> <s>${eur(p.i)}</s>` : '';
  const it = f.s.it === 'D' ? ' · 🎙️ testi e doppiaggio in italiano' : f.s.it === 'S' ? ' · testi in italiano' : f.s.it === 'N' ? ' · nessun italiano su Steam' : '';
  return `<div class="fx-steam">${giIcon('gem')} <span>Su Steam ${p.f === 0 ? '<b>gratis</b>' : '<b>' + eur(p.f) + '</b>'}${d}${it}</span> <small>aggiornato il ${escHtml(f.t || '')}</small></div>`;
}
// v200: «A colpo d'occhio» a riquadri: per ogni voce una parola chiara, una barra colorata e (se lo so) se è come piace a te
const GL_WORDS = {
  d: ['', 'Molto facile', 'Facile', 'Media', 'Impegnativa', 'Durissima'],
  g: ['', 'Niente grinding', 'Poco', 'Un po\'', 'Tanto', 'Tantissimo'],
  s: ['', 'Quasi assente', 'Leggera', 'Presente', 'Importante', 'Al centro di tutto']
};
function glTaste(key){
  try{ const tm = window.rtTasteModel && window.rtTasteModel(); if(!tm || !tm.wts || (tm.cnt[key] || 0) < 2) return ''; const w = tm.wts[key] || 0;
    return w > .2 ? '<em class="gl-yes">💜 come piace a te</em>' : w < -.2 ? '<em class="gl-no">⚠️ di solito non ti piace</em>' : ''; }catch(e){ return ''; }
}
function glMeter(n, max, hue){ let o = '<span class="gl-m">'; for(let i = 1; i <= max; i++) o += `<i${i <= n ? ` class="on" style="--h:${hue}"` : ''}></i>`; return o + '</span>'; }
function glHours(h){
  if(!h) return '';
  const days = Math.ceil(h / 1.5), w = days / 7;
  return days <= 6 ? `≈ ${days} ${days === 1 ? 'giorno' : 'giorni'} a 1h30 al giorno` : w < 9 ? `≈ ${Math.round(w)} ${Math.round(w) === 1 ? 'settimana' : 'settimane'} a 1h30 al giorno` : `≈ ${Math.round(w / 4.3)} mesi a 1h30 al giorno`;
}
function labelHtml(g){
  const l = g.label;
  if(!l) return '';
  const costLabel = l.cost==='S' ? '€ (< 20)' : l.cost==='M' ? '€€ (20-40)' : l.cost==='H' ? '€€€ (> 40)' : '—';
  const h = (g.enrich && g.enrich.hoursMain) || l.h || 0;          // stesse ore della «Longevità»
  const lv = v=> v >= 4 ? 'alta' : v <= 2 ? 'bassa' : 'media';
  const tiles = [];
  if(l.d) tiles.push(`<div class="gl-t"><span class="gl-k">🔥 Difficoltà</span><b>${GL_WORDS.d[l.d] || '—'}</b>${glMeter(l.d, 5, 130 - l.d * 26)}${glTaste('diff:' + lv(l.d))}</div>`);
  if(l.s) tiles.push(`<div class="gl-t"><span class="gl-k">📖 Storia</span><b>${GL_WORDS.s[l.s] || '—'}</b>${glMeter(l.s, 5, 270)}${glTaste('storia:' + (l.s >= 4 ? 'forte' : l.s <= 2 ? 'leggera' : 'media'))}</div>`);
  if(l.g) tiles.push(`<div class="gl-t"><span class="gl-k">⏳ Grinding</span><b>${GL_WORDS.g[l.g] || '—'}</b>${glMeter(l.g, 5, 40)}${glTaste('grind:' + (l.g >= 4 ? 'alto' : l.g <= 2 ? 'basso' : 'medio'))}</div>`);
  if(h) tiles.push(`<div class="gl-t"><span class="gl-k">🕐 Durata</span><b>${h} ore <small>${h < 20 ? 'breve' : h <= 50 ? 'media' : 'lunga'}</small></b>${glMeter(Math.max(1, Math.min(5, Math.ceil(h / 20))), 5, 200)}<span class="gl-s">${glHours(h)}</span>${glTaste('ore:' + (h < 20 ? 'brevi' : h <= 50 ? 'medie' : 'lunghe'))}</div>`);
  if(l.p) tiles.push(`<div class="gl-t"><span class="gl-k">🏃 Ritmo</span><b>${LABEL_PACE[l.p] || '—'}</b>${glMeter({L: 1, M: 2, V: 3}[l.p] || 0, 3, 170)}${glTaste('ritmo:' + ({L: 'lento', M: 'medio', V: 'veloce'}[l.p] || ''))}</div>`);
  if(l.it){ const IT = {D: ['Doppiato in italiano', 3], S: ['Testi in italiano', 3], F: ['Traduzione amatoriale', 2], N: ['Niente italiano', 1]}[l.it] || ['—', 0];
    tiles.push(`<div class="gl-t"><span class="gl-k">🇮🇹 Italiano</span><b>${IT[0]}</b>${glMeter(IT[1], 3, IT[1] === 3 ? 140 : IT[1] === 2 ? 45 : 0)}</div>`); }
  // una frase che riassume tutto, da leggere in 2 secondi
  const bits = [];
  if(h) bits.push(h < 20 ? 'breve' : h <= 50 ? 'di durata media' : 'lungo');
  if(l.s >= 4) bits.push('con la storia al centro'); else if(l.s && l.s <= 2) bits.push('con poca storia');
  if(l.d >= 4) bits.push('impegnativo'); else if(l.d && l.d <= 2) bits.push('facile');
  if(l.g >= 4) bits.push('con tanto grinding'); else if(l.g && l.g <= 2) bits.push('senza grinding');
  const sum = bits.length ? `<div class="gl-sum">In breve: <b>${bits.join(', ').replace(/, ([^,]*)$/, ' e $1')}</b>.</div>` : '';
  return `<div class="modal-section-title">${giIcon('tag')} A colpo d'occhio</div>
  <div class="glabel gl2">
    ${sum}
    <div class="gl-grid">${tiles.join('')}</div>
    ${(l.ok && fixSecondPerson(l.ok)) ? `<div class="glabel-ok">🟢 <b>Fa per te se</b>${escHtml(fixSecondPerson(l.ok))}</div>` : ''}
    ${(l.ko && fixSecondPerson(l.ko)) ? `<div class="glabel-ko">🔴 <b>Lascia stare se</b>${escHtml(fixSecondPerson(l.ko))}</div>` : ''}
    ${l.play ? `<div class="glabel-play">${giIcon('target')} <b>Come giocarlo oggi:</b> ${escHtml(l.play)}</div>` : ''}
    ${(l.fam && l.fam.length) || l.cost || l.demo!=null ? `<div class="glabel-stores">
      ${(l.fam||[]).map(f=>`<span class="glabel-store">${LABEL_STORE[f]||f}</span>`).join('')}
      ${l.cost ? `<span class="glabel-store">${costLabel}</span>` : ''}
      ${l.demo===true ? `<span class="glabel-store">🆓 Demo disponibile</span>` : ''}
    </div>` : ''}
  </div>`;
}

// ---- Prima di comprarlo: abbonamenti e verdetto, con data di verifica ----
const SUB_OPTIONS = [
  {key:'psplus_extra', label:'PS Plus Extra/Premium'},
  {key:'gamepass', label:'Xbox Game Pass'},
  {key:'nso', label:'Nintendo Switch Online'},
  {key:'eaplay', label:'EA Play'},
  {key:'applearcade', label:'Apple Arcade'}
];
let MY_SUBS = {};
function loadMySubs(){
  MY_SUBS = {};
  try{ const s = localStorage.getItem(profileKey('jrpg_my_subs')); if(s) MY_SUBS = JSON.parse(s); }catch(e){ MY_SUBS = {}; }
}
loadMySubs();
function saveMySubs(){ try{ localStorage.setItem(profileKey('jrpg_my_subs'), JSON.stringify(MY_SUBS)); }catch(e){} }
function subMatchesMine(svcName){
  const s = (svcName||'').toLowerCase();
  if(MY_SUBS.psplus_extra && s.indexOf('ps plus')>=0) return true;
  if(MY_SUBS.gamepass && (s.indexOf('game pass')>=0)) return true;
  if(MY_SUBS.nso && s.indexOf('nintendo switch online')>=0) return true;
  if(MY_SUBS.eaplay && s.indexOf('ea play')>=0) return true;
  if(MY_SUBS.applearcade && s.indexOf('apple arcade')>=0) return true;
  return false;
}
function marketHtml(g){
  const entries = g.market || [];
  const asof = (typeof MARKET !== 'undefined' && MARKET.asof) ? MARKET.asof : null;
  const asofStr = asof ? new Date(asof+'T00:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}) : null;
  const mine = entries.filter(e=> subMatchesMine(e.svc));
  const others = entries.filter(e=> !subMatchesMine(e.svc));
  const priceUrl = 'https://www.google.com/search?q=' + encodeURIComponent(g.name + ' prezzo offerta oggi');
  const hltbUrl = 'https://howlongtobeat.com/?q=' + encodeURIComponent(g.name);
  let verdict;
  if(mine.length){
    verdict = `<div class="glabel-ok">🎉 <b>Ce l'hai già!</b> Incluso in ${mine.map(e=>escHtml(e.svc)).join(', ')} — non serve comprarlo.</div>`;
  } else if(others.length){
    verdict = `<div class="cover-hint" style="text-align:left; margin-top:0;">Incluso in ${others.map(e=>escHtml(e.svc)).join(', ')}, ma non tra i tuoi abbonamenti segnati qui sotto.</div>`;
  } else {
    verdict = `<div class="cover-hint" style="text-align:left; margin-top:0;">Non risulta oggi in nessun abbonamento che ho controllato: verifica il prezzo con il link qui sotto.</div>`;
  }
  const notes = entries.filter(e=>e.note).map(e=>`<div class="modal-note">ℹ️ ${escHtml(e.svc)}: ${escHtml(e.note)}</div>`).join('');
  return `<div class="modal-section-title">${giIcon('cart')} Prima di comprarlo</div>
  <div class="glabel">
    ${verdict}
    ${notes}
    <div class="glabel-play" style="margin-top:8px;">
      <a href="${priceUrl}" target="_blank" rel="noopener" style="color:var(--accent); font-weight:700; text-decoration:none;">${giIcon('tag')} Controlla il prezzo di oggi</a>
      &nbsp;·&nbsp;
      <a href="${hltbUrl}" target="_blank" rel="noopener" style="color:var(--accent); font-weight:700; text-decoration:none;">⏱️ HowLongToBeat</a>
    </div>
    <div class="glabel-title" style="margin-top:10px; border-top:2px solid var(--text); padding-top:6px; border-bottom:none;">I tuoi abbonamenti</div>
    <div class="cover-tools" style="justify-content:flex-start;" id="mySubsRow">
      ${SUB_OPTIONS.map(o=>`<button type="button" class="tagchip ${MY_SUBS[o.key]?'active':''}" data-sub="${o.key}">${o.label}</button>`).join('')}
    </div>
    ${asofStr ? `<div class="cover-hint" style="margin-top:8px;">Abbonamenti verificati il ${asofStr}. Aggiorno automaticamente ogni settimana.</div>` : ''}
  </div>`;
}

// ---- DNA di compatibilità: quanto un gioco assomiglia ai tuoi gusti ----
function buildTasteProfile(){
  const liked = GAMES.filter(g=> FAVS.has(g.id) || STATUSES[g.id]==='played' || STATUSES[g.id]==='playing');
  const dropped = GAMES.filter(g=> STATUSES[g.id]==='dropped');
  const profile = {tagScore:{}, tierBias:0, avgScore:0, n:liked.length, dropTags:{}};
  if(liked.length===0) return profile;
  let scoreSum = 0;
  liked.forEach(g=>{
    const weight = FAVS.has(g.id) ? 2 : 1;
    g.tags.forEach(t=> profile.tagScore[t] = (profile.tagScore[t]||0) + weight);
    scoreSum += g.score;
  });
  dropped.forEach(g=> g.tags.forEach(t=> profile.dropTags[t] = (profile.dropTags[t]||0) + 1));
  profile.avgScore = scoreSum / liked.length;
  return profile;
}
function dnaForGame(g, profile){
  if(!profile || profile.n < 2) return null;
  const maxTag = Math.max(1, ...Object.values(profile.tagScore));
  let tagMatch = 0, matchedTags = [];
  g.tags.forEach(t=>{
    if(profile.tagScore[t]){ tagMatch += profile.tagScore[t]/maxTag; matchedTags.push(t); }
  });
  tagMatch = g.tags.length ? Math.min(1, tagMatch / g.tags.length) : 0;
  const scoreDelta = Math.max(0, 1 - Math.abs(g.score - profile.avgScore)/30);
  let penalty = 0, avoidTags = [];
  g.tags.forEach(t=>{ if(profile.dropTags[t]){ penalty += 0.12; avoidTags.push(t); } });
  let pct = Math.round((tagMatch*0.65 + scoreDelta*0.35) * 100 - penalty*100);
  pct = Math.max(3, Math.min(99, pct));
  return {pct, matchedTags, avoidTags};
}
function dnaColor(pct){
  if(pct>=75) return '#2f9e6b';
  if(pct>=50) return '#c9a12a';
  return '#c93a3a';
}
function dnaHtml(g){
  const profile = buildTasteProfile();
  if(profile.n < 2) return '';
  const dna = dnaForGame(g, profile);
  if(!dna) return '';
  const color = dnaColor(dna.pct);
  let why = matchWhy(dna, g);
  return `<div class="dna-box">
    <div class="dna-ring" style="background:conic-gradient(${color} ${dna.pct*3.6}deg, var(--row-alt) 0deg); color:var(--text);"><span style="background:var(--card); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">${dna.pct}%</span></div>
    <div class="dna-why"><b>DNA di compatibilità</b> — basato sui giochi che hai segnato come preferiti o giocati.<br>${why}</div>
  </div>`;
}
function matchWhy(dna, g){
  if(dna.avoidTags.length) return `Attenzione: condivide elementi (${dna.avoidTags.map(t=>TAG_INFO[t]?TAG_INFO[t].label:t).join(', ')}) con giochi che hai droppato.`;
  if(dna.matchedTags.length) return `Condivide ${dna.matchedTags.map(t=>TAG_INFO[t]?TAG_INFO[t].label:t).join(', ')} con i tuoi giochi preferiti, e un voto vicino alla tua media gradita.`;
  return `Genere diverso da quelli che ti sono piaciuti finora — potrebbe essere una scoperta o un azzardo.`;
}

const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const wizardBackdrop = document.getElementById('wizardBackdrop');
const wizardCard = document.getElementById('wizardCard');

function openModal(g){
  currentModalGame = g;
  modalCard.classList.remove('wide');
  const isFav = FAVS.has(g.id);
  const storyHtml = g.story
    ? `<div class="modal-story">${g.story}</div>`
    : `<div class="modal-story placeholder">Scheda narrativa in arrivo per questo titolo — verrà aggiunta durante la prossima fase di aggiornamento del compendio.</div>`;
  const reviewUrl = itReviewsUrl(g.name);
  const imagesUrl = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(g.name + ' gameplay screenshot');
  const youtubeUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(g.name + ' Gameplay ITA');
  const soundtrackUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(g.name + ' soundtrack OST colonna sonora');
  modalCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">${g.name}</div>
      <button class="modal-close" id="modalCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    ${coverHtml(g)}
    <div class="modal-plat">${g.plat}${g.year ? ' · ' + g.year : ''}</div>
    <div class="modal-badges">
      <span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span>
      <span class="badge big outline">${g.tier === 'ND' ? 'voto ND' : g.score + '/100'}</span>
      <span class="badge big outline">${srcIcon(g)} ${SRC_NAME[srcKind(g)]}</span>
      ${(()=>{ const f = freshInfo(g); return f ? `<span class="badge big outline fresh-badge" title="${escHtml(freshWhy(f))}">${giIcon(f.m ? 'upmanual' : 'upplus')} ${f.m ? 'Controllato a mano' : 'Update V+'}</span>` : ''; })()}
    </div>
    <div class="fresh-line ${g.m === 'V' && /^Metacritic/.test(g.vs || '') ? 'ok' : ''}" id="voteSrc">${voteSourceHtml(g)}</div>
    ${voteDiagHtml(g)}
    ${typeof updatePlusNow === 'function' ? (()=>{ const f = freshInfo(g); return f ? `<div class="fresh-line ok">${giIcon(f.m ? 'upmanual' : 'upplus')} <span>${escHtml(freshWhy(f))}</span></div>` : `<div class="fresh-line">Non ancora aggiornato con Update V+: lo faccio io in automatico (una sola volta) oppure premi «Update V+».</div>`; })() : ''}
    <div class="modal-tags">${g.tags.map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${TAG_INFO[t].label}</span>` : '').join('')}</div>
    ${dnaHtml(g)}
    ${labelHtml(g)}
    ${typeof dataScoreHtml === 'function' ? dataScoreHtml(g) : ''}
    ${marketHtml(g)}
    ${factsHtml(g)}
    ${highlightsHtml(g)}
    ${sagaHtml(g)}
    <div class="modal-section-title">Il tuo stato</div>
    <div class="status-row" id="statusRow">
      ${Object.keys(STATUS_INFO).map(k=> `<button class="btn ${STATUSES[g.id]===k?'on':''}" data-status="${k}">${giIcon({played:'check',playing:'play',backlog:'pin',dropped:'stop'}[k])} ${STATUS_INFO[k].label}</button>`).join('')}
    </div>
    <div class="modal-section-title">${giIcon('book')} La storia (senza spoiler)</div>
    ${storyHtml}
    ${g.note ? `<div class="modal-section-title">Nota</div><div class="modal-note">${noteForVoto(g)}</div>` : ''}
    ${castHtml(g)}
    ${enrichHtml(g)}
    ${soundtrackHtml(g)}
    ${similarGamesHtml(g)}
    <div class="modal-links">
      <a class="btn" href="${youtubeUrl}" target="_blank" rel="noopener">▶️ Gameplay ITA (YouTube)</a>
      <a class="btn" href="${reviewUrl}" target="_blank" rel="noopener">📰 Recensioni ITA</a>
      <a class="btn" href="${imagesUrl}" target="_blank" rel="noopener">🖼️ Immagini gameplay</a>
      <a class="btn" href="${soundtrackUrl}" target="_blank" rel="noopener">🎵 Colonna sonora (YouTube)</a>
    </div>
    <div class="modal-actions">
      <button class="btn" id="modalFavBtn">${giIcon(isFav ? 'favon' : 'favoff')} ${isFav ? 'Nei preferiti' : 'Aggiungi ai preferiti'}</button>
      <button class="btn" id="modalCompareBtn">${compareList.includes(g.id) ? '✓ Nel confronto' : '⚖️ Confronta'}</button>
      ${typeof infoBtnHtml === 'function' ? infoBtnHtml(g) : ''}
      ${typeof updatePlusNow === 'function' ? `<button class="btn upplus-btn" id="updatePlusBtn" title="Controlla voto (Metacritic), generi, anno, lingua, testi e locandina da tutte le fonti e ti mostra cosa cambiare">${giIcon('upplus')} ${freshInfo(g) ? 'Rifai Update V+' : 'Update V+'}</button>` : ''}
      ${typeof openGameFields === 'function' ? `<button class="btn" id="gameFieldsBtn" title="Scegli da quale fonte prendere ogni informazione di questa scheda e blocca quelle che vuoi tenere">🎛️ Fonti</button>` : ''}
      <button class="btn" id="modalDelBtn" title="Elimina questo gioco dalla tua lista (chiede due conferme)">🗑️ Elimina</button>
      <button class="btn primary" id="modalCloseBtn2">Chiudi</button>
    </div>
  `;
  modalBackdrop.classList.add('show');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
  { // elimina: doppia conferma (prima un secondo tocco, poi la domanda finale) così non succede per sbaglio
    const del = document.getElementById('modalDelBtn'); let armed = 0, tm = 0;
    if(del) del.addEventListener('click', ()=>{
      if(!armed){ armed = 1; del.textContent = '⚠️ Tocca ancora per eliminare'; del.classList.add('danger'); clearTimeout(tm); tm = setTimeout(()=>{ armed = 0; del.textContent = '🗑️ Elimina'; del.classList.remove('danger'); }, 4000); return; }
      clearTimeout(tm); armed = 0; del.textContent = '🗑️ Elimina'; del.classList.remove('danger');
      if(!window.confirm('Ultima conferma: elimino «' + g.name + '» dalla tua lista?\n\nSparisce anche dai preferiti, dagli stati e dalla tua tier list' + (g.custom ? ' (e dagli altri tuoi dispositivi).' : '. Il gioco di base viene solo nascosto.'))) return;
      if(typeof rtDeleteGame === 'function' && rtDeleteGame(g)){ closeModal(); showToast('«' + g.name + '» eliminato', 2600); } else showToast('Non sono riuscito a eliminarlo', 2600);
    });
  }
  document.getElementById('modalCompareBtn').addEventListener('click', ()=>{
    toggleCompare(g.id);
    openModal(g);
  });
  document.getElementById('modalFavBtn').addEventListener('click', ()=>{
    if(FAVS.has(g.id)){ FAVS.delete(g.id); showToast('Rimosso dai preferiti'); }
    else { FAVS.add(g.id); showToast('Aggiunto ai preferiti'); }
    saveFavs(); renderMetrics(); render();
    openModal(g);
  });
  document.getElementById('statusRow').querySelectorAll('[data-status]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setStatus(g.id, btn.dataset.status);
      renderMetrics(); render();
      openModal(g);
    });
  });
  wireCover(g);
  const mySubsRow = document.getElementById('mySubsRow');
  if(mySubsRow){
    mySubsRow.querySelectorAll('[data-sub]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.dataset.sub;
        MY_SUBS[key] = !MY_SUBS[key];
        saveMySubs();
        openModal(g);
      });
    });
  }
  const dopaBtn = modalCard.querySelector('.dopa-toggle');
  if(dopaBtn){
    dopaBtn.addEventListener('click', ()=>{
      const panel = document.getElementById('dopaPanel'); if(!panel) return;
      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      dopaBtn.setAttribute('aria-expanded', String(willOpen));
    });
  }
  modalCard.querySelectorAll('.similar-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const gg = GAMES.find(x=>x.id===parseInt(btn.dataset.id,10));
      if(gg) openModal(gg);
    });
  });
}
function closeModal(){ modalBackdrop.classList.remove('show'); }
modalBackdrop.addEventListener('click', (e)=>{ if(e.target===modalBackdrop) closeModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ closeLightbox(); closeModal(); } });

// ---- Lightbox (foto a schermo intero) ----
const lightboxBackdrop = document.getElementById('lightboxBackdrop');
const lightboxImg = document.getElementById('lightboxImg');
function openLightbox(src, alt){
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightboxBackdrop.classList.add('show');
}
function closeLightbox(){ lightboxBackdrop.classList.remove('show'); }
lightboxBackdrop.addEventListener('click', (e)=>{ if(e.target!==lightboxImg) closeLightbox(); });
document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);

// ---- Confronto testa a testa ----
let compareList = [];
function renderCompareTray(){
  const tray = document.getElementById('compareTray');
  const items = document.getElementById('compareTrayItems');
  const goBtn = document.getElementById('compareGoBtn');
  if(compareList.length===0){ tray.style.display='none'; return; }
  tray.style.display='flex';
  items.innerHTML = compareList.map(id=>{
    const g = GAMES.find(x=>x.id===id);
    return g ? `<span class="compare-tray-chip">${g.name}<button data-id="${id}">✕</button></span>` : '';
  }).join('');
  items.querySelectorAll('button[data-id]').forEach(b=>{
    b.addEventListener('click', ()=>{ toggleCompare(parseInt(b.dataset.id,10)); });
  });
  goBtn.disabled = compareList.length !== 2;
  goBtn.textContent = compareList.length===2 ? '⚖️ Confronta ora' : `⚖️ Aggiungine un altro (${compareList.length}/2)`;
}
function toggleCompare(id){
  const idx = compareList.indexOf(id);
  if(idx>=0){ compareList.splice(idx,1); }
  else {
    if(compareList.length>=2) compareList.shift();
    compareList.push(id);
  }
  renderCompareTray();
}
document.getElementById('compareGoBtn').addEventListener('click', ()=>{
  if(compareList.length===2) openCompareModal(compareList[0], compareList[1]);
});
function openCompareModal(id1, id2){
  const g1 = GAMES.find(x=>x.id===id1), g2 = GAMES.find(x=>x.id===id2);
  if(!g1||!g2) return;
  modalCard.classList.add('wide');
  const col = (g)=>{
    const storyHtml = g.story || 'Scheda narrativa non ancora disponibile per questo titolo.';
    const tagsHtml = g.tags.map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${TAG_INFO[t].label}</span>` : '').join('');
    return `<div class="compare-col">
        <div class="compare-name">${g.name}</div>
        <div class="modal-plat">${g.plat}${g.year ? ' · ' + g.year : ''}</div>
        <div class="modal-badges">
          <span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span>
          <span class="badge big outline">${g.tier === 'ND' ? 'voto ND' : g.score + '/100'}</span>
        </div>
        <div class="modal-tags">${tagsHtml}</div>
        <div class="compare-story">${storyHtml}</div>
      </div>`;
  };
  modalCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">⚖️ Confronto</div>
      <button class="modal-close" id="modalCloseBtn">✕</button>
    </div>
    <div class="compare-grid">${col(g1)}${col(g2)}</div>
    <div class="modal-actions"><button class="btn primary" id="modalCloseBtn2">Chiudi</button></div>
  `;
  modalBackdrop.classList.add('show');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
}

// CSV export
async function getDownloadsCap(){
  try{
    if(typeof claude === 'undefined' || !claude.use) return null;
    return await claude.use('downloads');
  }catch(e){ return null; }
}
function toCsvValue(v){
  const s = String(v==null ? '' : v);
  if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}
function buildCsv(list){
  const header = ['Numero','Nome','Piattaforma','Anno','Tier','Voto','Fonte','Preferito','Storia'];
  const lines = [header.join(',')];
  list.forEach(g=>{
    lines.push([g.id, g.name, g.plat, g.year, g.tier, g.score,
      methodLabel(g.m), FAVS.has(g.id)?'Si':'No', g.story].map(toCsvValue).join(','));
  });
  return lines.join('\n');
}
document.getElementById('exportBtn').addEventListener('click', async ()=>{
  const list = applyFilters();
  const csv = buildCsv(list);
  const filename = 'tier-list-jrpg-filtrata.csv';
  const cap = await getDownloadsCap();
  if(cap){
    try{ await cap.save({filename, data: new Blob([csv], {type:'text/csv'})}); showToast('CSV salvato'); return; }
    catch(e){}
  }
  try{
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('CSV scaricato');
  }catch(e){ showToast('Esportazione non disponibile qui'); }
});

// ---- Nuove funzioni: saga, cast, colonna sonora, consigli incrociati ----
// ---- Saghe automatiche: raggruppa anche i giochi aggiunti e quelli non mappati, per titolo ----
const SAGA_STOP = new Set(['the','of','a','an','and','e','il','la','lo','di','de']);
const SAGA_ROMAN = /^(i{1,3}|iv|v|vi{0,3}|ix|x{1,3}|xi{0,3}|xiv|xv|xvi{0,3})$/;
function sagaTokens(name){
  let t = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').split(/\s*[:–—]\s+|\s+-\s+/)[0];
  t = t.replace(/[^a-z0-9& ]/g, ' ').replace(/&/g, ' and ').split(/\s+/).filter(w=> w && !SAGA_STOP.has(w));
  while(t.length > 1 && (/^\d+$/.test(t[t.length-1]) || SAGA_ROMAN.test(t[t.length-1]) || /^(remake|remastered|remaster|hd|definitive|edition|reloaded|reborn|origins)$/.test(t[t.length-1]))) t.pop();
  return t;
}
function sagaRoot(name){ const t = sagaTokens(name); return t.length >= 2 ? t.slice(0, 2).join(' ') : (t[0] && t[0].length >= 5 ? t[0] : null); }
let DYN_SAGA = {}, DYN_SAGA_FOR = -1;
function buildDynamicSagas(){
  if(DYN_SAGA_FOR === GAMES.length) return;
  DYN_SAGA_FOR = GAMES.length; DYN_SAGA = {};
  const idx = {};                                                   // radice del titolo -> saga già nota
  GAMES.forEach(g=>{ const k = SAGA_MAP[g.id]; if(!k) return; const rk = sagaRoot(g.name); if(!rk) return; (idx[rk] = idx[rk] || {})[k] = ((idx[rk] || {})[k] || 0) + 1; });
  const loose = {};
  GAMES.forEach(g=>{
    if(SAGA_MAP[g.id]) return;
    const rk = sagaRoot(g.name); if(!rk) return;
    const known = idx[rk] && Object.entries(idx[rk]).sort((a, b)=> b[1] - a[1])[0];
    if(known && SAGA_INFO[known[0]]){ DYN_SAGA[g.id] = known[0]; return; }
    (loose[rk] = loose[rk] || []).push(g);
  });
  Object.keys(loose).forEach(rk=>{
    const arr = loose[rk]; if(arr.length < 2) return;
    const key = 'auto:' + rk;
    const nm = String(arr[0].name).replace(/\([^)]*\)/g, '').split(/\s*[:–—]\s+|\s+-\s+/)[0].replace(/\s+(?:[IVX]+|\d+)$/i, '').trim();
    SAGA_INFO[key] = {name: nm, order: 'per anno di uscita', note: 'Saga raggruppata automaticamente dal titolo. In assenza di indicazioni diverse, l\'ordine consigliato è quello di uscita.', auto: true};
    arr.forEach(g=>{ DYN_SAGA[g.id] = key; });
  });
}
function sagaKeyOf(g){ buildDynamicSagas(); return SAGA_MAP[g.id] || DYN_SAGA[g.id] || null; }
// «Cerca capitoli mancanti»: chiede alla ricerca web i capitoli/spin-off della saga che non hai ancora
async function sagaFindMissing(key, host){
  const info = SAGA_INFO[key]; if(!info) return;
  const hasRawg = !!(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has());
  if(!hasRawg && (typeof llmAvailable !== 'function' || !llmAvailable())){ showToast('Serve una chiave Gemini o RAWG (⚙️ Impostazioni in Chiedi)', 3000); return; }
  host.innerHTML = '<div class="lp-sub">🦝 Frugu Frugu cerca gli altri capitoli…</div>';
  const known = GAMES.filter(g=> sagaKeyOf(g) === key).map(g=> g.name);
  let fromRawg = [];
  if(hasRawg){       // fonte diretta: l'elenco ufficiale della serie su RAWG (nessuna AI, nessun rischio di titoli inventati)
    try{
      for(const nm of known.slice(0, 3)){ const rg = await SearchHub.rawg.find(nm); if(!rg) continue; fromRawg = fromRawg.concat(await SearchHub.rawg.series(rg.id)); if(fromRawg.length) break; }
      fromRawg = dedupeNovitaCandidates(fromRawg, novitaKnownNames(), NOVITA_GENRE_ALL_CODES).filter(c=> c.score == null || c.score >= 50);
    }catch(e){ fromRawg = []; }
  }
  if(fromRawg.length && (typeof llmAvailable !== 'function' || !llmAvailable() || fromRawg.length >= 3)){
    host._cands = fromRawg;
    host.innerHTML = fromRawg.map((c, i)=> `<div class="saga-miss"><span><b>${escHtml(c.name)}</b> <small>${escHtml(c.year || '')} · ${escHtml(c.plat || '')} · da RAWG</small></span><button class="btn" data-add="${i}" title="Aggiungi con scheda completa">♥ Aggiungi</button></div>`).join('');
    host.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const c = host._cands[+b.dataset.add]; try{ askToolAddCustomGame(c, 'Saghe'); b.closest('.saga-miss').remove(); }catch(e){ showToast(String(e && e.message || 'Non aggiunto').slice(0, 120), 3000); } }));
    return;
  }
  if(typeof llmAvailable !== 'function' || !llmAvailable()){ host.innerHTML = '<div class="lp-sub">Nessun altro capitolo trovato su RAWG ✅</div>'; return; }
  const prompt = todayLine() + `Elenca i capitoli principali e gli spin-off importanti della saga «${info.name}» che NON sono in questo elenco (già presenti): ${known.join('; ')}.
Rispondi SOLO con un array JSON (max 10 oggetti, vuoto se non manca nulla) con: name (titolo esatto), plat, year, tier (S+..F), score (0-100), tags (0-3 codici tra: ${genreGlossary(NOVITA_GENRE_ALL_CODES)}), story (2-3 frasi), fitIf (una frase in seconda persona che completa «Fa per te se…»). Solo giochi realmente esistenti.`;
  try{
    const r = await askLLM(prompt, {}, {search:true, fast:true, label:'Cerco i capitoli mancanti…'});
    const arr = dedupeNovitaCandidates(parseNovitaJson(r && r.text) || [], novitaKnownNames(), NOVITA_GENRE_ALL_CODES);
    host._cands = arr;
    host.innerHTML = arr.length ? arr.map((c, i)=> `<div class="saga-miss"><span><b>${escHtml(c.name)}</b> <small>${escHtml(c.year || '')} · ${escHtml(c.plat || '')}</small></span><button class="btn" data-add="${i}" title="Aggiungi con scheda completa">♥ Aggiungi</button></div>`).join('') : '<div class="lp-sub">Nessun capitolo mancante trovato ✅</div>';
    host.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ const c = host._cands[+b.dataset.add]; try{ askToolAddCustomGame(c, 'Saghe'); b.closest('.saga-miss').remove(); }catch(e){ showToast(String(e && e.message || 'Non aggiunto').slice(0, 120), 3000); } }));
  }catch(e){ host.innerHTML = '<div class="lp-sub">Ricerca non riuscita: riprova tra poco.</div>'; }
}
function sagaHtml(g){
  const key = sagaKeyOf(g);
  if(!key) return '';
  const info = SAGA_INFO[key];
  if(!info) return '';
  return `<div class="saga-note"><span class="saga-note-title">🗂️ Saga: ${info.name}</span><span class="saga-note-order">${info.order}</span><div class="saga-note-text">${info.note}</div></div>`;
}
function castHtml(g){
  const cast = g.enrich && g.enrich.cast;
  if(!cast || !cast.length) return '';
  return `<div class="modal-section-title">🎭 Cast principale</div><div class="cast-list">${cast.map(c=>`<div class="cast-item"><b>${c.name}</b> — ${c.role}</div>`).join('')}</div>`;
}
function soundtrackHtml(g){
  const st = g.enrich && g.enrich.soundtrack;
  if(!st) return '';
  const tracks = (st.tracks||[]).map(t=>`<li>${t}</li>`).join('');
  return `<div class="modal-section-title">🎼 Colonna sonora</div><div class="modal-note"><strong>Compositore:</strong> ${st.composer}</div><ul class="soundtrack-tracks">${tracks}</ul>`;
}
function findSimilarGames(g, n){
  // Affinità reale, non solo «stesso tag»: genere principale, tag condivisi, saga, stessa epoca, stessa struttura (ritmo, peso storia, difficoltà),
  // e nessun genere incompatibile (mai horror per chi guarda un action indie, mai sport per un JRPG…). Meglio pochi consigli buoni che quattro sbagliati.
  const EXCL = [['HOR','SURV'], ['SPORT','RACE','SIMVEH'], ['FIGHT'], ['PARTY','TRIVIA','RHY'], ['FPS','TPS','BR'], ['CITY','ECOSIM','SIMLIFE','LIFE'], ['MECH']];
  const gt = new Set(g.tags || []);
  const gYear = g.ysort || (parseInt(String(g.year || '').slice(0,4), 10) || null);
  const gs = new Set((g.plat || '').toLowerCase().split(/[\/,]/).map(x=> x.trim()).filter(Boolean));
  const saga = sagaKeyOf(g);
  const hint = new Set(((g.enrich && g.enrich.similarTo) || []).map(x=> String(x).toLowerCase().replace(/[^a-z0-9]/g, '')));
  const scored = GAMES.filter(x=> x.id !== g.id).map(x=>{
    const xt = new Set(x.tags || []);
    for(const grp of EXCL){ const a = grp.some(t=> gt.has(t)), b = grp.some(t=> xt.has(t)); if(a !== b) return {x, score: -1}; }
    const shared = [...xt].filter(t=> gt.has(t));
    const uni = new Set([...gt, ...xt]).size || 1;
    let score = shared.length / uni * 5;
    const primary = (g.tags || [])[0] && (g.tags || [])[0] === (x.tags || [])[0];
    if(primary) score += 2.5;
    if(saga && sagaKeyOf(x) === saga) score += 4;
    const xYear = x.ysort || (parseInt(String(x.year || '').slice(0,4), 10) || null);
    if(gYear && xYear){ const d = Math.abs(gYear - xYear); score += d <= 4 ? 1 : d > 15 ? -1 : 0; }
    const ge = g.enrich || {}, xe = x.enrich || {}, gl = g.label || {}, xl = x.label || {};
    if(ge.storyTag && ge.storyTag === xe.storyTag) score += 1.5;
    if(ge.dopamine && xe.dopamine) score += 1;
    if(gl.s && xl.s && Math.abs(gl.s - xl.s) <= 1) score += 1;
    if(gl.p && xl.p && gl.p === xl.p) score += 0.5;
    if(gl.d && xl.d && Math.abs(gl.d - xl.d) <= 1) score += 0.5;
    if(gs.size && (x.plat || '').toLowerCase().split(/[\/,]/).some(p=> gs.has(p.trim()))) score += 0.5;
    if(hint.has(String(x.name).toLowerCase().replace(/[^a-z0-9]/g, ''))) score += 6;      // consigliato da fonti (ricerca web) per questo gioco
    const ok = primary || shared.length >= 2 || hint.size && score >= 6;
    return {x, score: ok ? score : -1};
  }).filter(o=> o.score >= 4);
  scored.sort((a,b)=> b.score-a.score || b.x.score-a.x.score);
  return scored.slice(0,n).map(o=>o.x);
}
function similarGamesHtml(g){
  const sims = findSimilarGames(g, 4);
  if(!sims.length) return '';
  return `<div class="modal-section-title">🔁 Se ti è piaciuto questo, prova anche</div><div class="similar-games">${sims.map(s=>`<button class="similar-chip" data-id="${s.id}"><span class="badge ${TIER_LABEL[s.tier]}">${s.tier}</span>${s.name}</button>`).join('')}</div>`;
}

// ---- «Aggiorna saghe»: cerca da solo i capitoli e le saghe che mancano e li aggiunge (senza chiavi: Wikidata; con la chiave RAWG anche l'elenco delle serie di RAWG) ----
const SAGA_UPD = {running: false, stop: false, msg: ''}, SAGA_SCAN = 'jrpg_saga_scan', SAGA_CAP = 30;
const sagaNorm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sagaSleep = ms=> new Promise(r=> setTimeout(r, ms));
function sagaQuietAdd(c){
  const name = String(c.name || '').trim(); if(!name || !COVER_DB) return false;
  if(typeof findDuplicateGame === 'function' && findDuplicateGame(name)) return false;
  const id = nextCustomGameId(), sc = clampIntOrNull(c.score, 0, 100);
  const doc = {name, plat: c.plat ? String(c.plat) : null, year: c.year ? String(c.year) : null, tier: 'ND', score: sc != null ? Math.min(sc, 79) : 70, tags: Array.isArray(c.tags) ? c.tags.filter(t=> TAG_INFO[t]).slice(0, 3) : [], story: '',
    note: 'Aggiunto da Mario tramite "Aggiorna saghe" il ' + new Date().toLocaleDateString('it-IT') + ' — nessun Metacritic trovato: voto e dettagli sono una stima automatica, non della classifica ufficiale curata a mano.', label: {}, pros: [], cons: [], addedAt: new Date().toISOString()};
  try{ COVER_DB.doc('customGames/' + String(id)).set(doc).catch(()=>{}); }catch(e){ return false; }
  try{ queueEnrich(id); }catch(e){}
  try{ if(window.updatePlusQueue) updatePlusQueue(id); }catch(e){}
  return true;
}
// capitoli della stessa serie su Wikidata (proprietà «parte della serie»), per un gioco che già conosci
async function sagaWdMembers(name){
  const r = window.wikidataGenreCodes ? await window.wikidataGenreCodes(name) : null; if(!r || !r.qid) return [];
  const e = await SearchHub.json('https://www.wikidata.org/w/api.php?' + new URLSearchParams({action: 'wbgetentities', ids: r.qid, props: 'claims', format: 'json', origin: '*'}));
  const claims = (e.entities && e.entities[r.qid] && e.entities[r.qid].claims) || {};
  const series = (claims.P179 || []).map(c=> c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id).filter(Boolean).slice(0, 2);
  const out = [], nowY = new Date().getFullYear();
  for(const sq of series){
    const q = `SELECT ?g ?gLabel (MIN(YEAR(?d)) AS ?yr) (GROUP_CONCAT(DISTINCT ?plL; separator=", ") AS ?plat) (GROUP_CONCAT(DISTINCT ?geL; separator=", ") AS ?gen) WHERE { ?g wdt:P179 wd:${sq}. ?g wdt:P31/wdt:P279* wd:Q7889. OPTIONAL{ ?g wdt:P577 ?d. } OPTIONAL{ ?g wdt:P400 ?pl. ?pl rdfs:label ?plL. FILTER(LANG(?plL)='en') } OPTIONAL{ ?g wdt:P136 ?ge. ?ge rdfs:label ?geL. FILTER(LANG(?geL)='en') } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?g ?gLabel LIMIT 80`;
    const j = await SearchHub.json('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), {headers: {Accept: 'application/sparql-results+json'}, timeout: 25000});
    ((j.results && j.results.bindings) || []).forEach(b=>{
      const nm = b.gLabel && b.gLabel.value; if(!nm || /^Q\d+$/.test(nm)) return;
      const yr = b.yr && +b.yr.value, gen = (b.gen && b.gen.value) || '';
      if(!yr || yr > nowY) return;                                                           // senza anno o non ancora uscito
      if(gen && !/role|rpg|tactic|dungeon|monster|rogue|hack|action-adventure|strategy/i.test(gen)) return;   // la lista è di RPG/JRPG: salto platform, corse, picchiaduro…
      out.push({name: nm, year: yr || '', plat: ((b.plat && b.plat.value) || '').split(', ').slice(0, 4).join(' / '), src: 'Wikidata'});
    });
  }
  return out;
}
async function sagaCandidates(names){
  let out = [];
  for(const nm of names.slice(0, 2)){ try{ out = out.concat(await sagaWdMembers(nm)); }catch(e){} if(out.length) break; }
  if(window.SearchHub && SearchHub.rawg && SearchHub.rawg.has()){
    try{ for(const nm of names.slice(0, 2)){ const rg = await SearchHub.rawg.find(nm); if(!rg) continue; const l = (await SearchHub.rawg.series(rg.id)).filter(c=> c && c.name && (c.score == null || c.score >= 50)); out = out.concat(l.map(c=> ({name: c.name, year: c.year || '', plat: c.plat || '', score: c.score, tags: c.tags, src: 'RAWG'}))); if(l.length) break; } }catch(e){}
  }
  const seen = new Set(); return out.filter(c=>{ const k = sagaNorm(c.name); if(!k || seen.has(k)) return false; seen.add(k); return true; });
}
async function sagaUpdateAll(){
  if(SAGA_UPD.running) return;
  if(!window.SearchHub){ showToast('Ricerca non disponibile ora', 2500); return; }
  SAGA_UPD.running = true; SAGA_UPD.stop = false;
  const say = t=>{ SAGA_UPD.msg = t; const m = document.getElementById('sagaUpdMsg'); if(m) m.textContent = t; };
  const btn = ()=> document.getElementById('sagaUpdBtn'), stp = ()=> document.getElementById('sagaUpdStop');
  if(btn()) btn().disabled = true; if(stp()) stp().style.display = '';
  const scan = (()=>{ try{ return JSON.parse(localStorage.getItem(SAGA_SCAN) || '{}') || {}; }catch(e){ return {}; } })(), saveScan = ()=>{ try{ localStorage.setItem(SAGA_SCAN, JSON.stringify(scan)); }catch(e){} };
  const fresh = k=> scan[k] && Date.now() - scan[k] < 30 * 864e5;
  let added = 0, looked = 0;
  try{
    // 1) saghe già presenti: i capitoli che mancano
    buildDynamicSagas();
    const groups = {}; GAMES.forEach(g=>{ const k = sagaKeyOf(g); if(k) (groups[k] = groups[k] || []).push(g); });
    const keys = Object.keys(groups).sort((a, b)=> groups[b].length - groups[a].length).filter(k=> !fresh(k));
    for(let i = 0; i < keys.length && added < SAGA_CAP && !SAGA_UPD.stop; i++){
      const k = keys[i], names = groups[k].slice().sort((a, b)=> a.score - b.score).reverse().map(g=> g.name);
      say(`Saghe: ${i + 1}/${keys.length} · ${(SAGA_INFO[k] || {}).name || k}… (aggiunti ${added})`);
      const cands = await sagaCandidates(names); looked++;
      let n = 0; for(const c of cands){ if(added >= SAGA_CAP) break; if(sagaQuietAdd(c)){ added++; n++; } }
      if(added < SAGA_CAP || n === 0) scan[k] = Date.now(); saveScan();
      await sagaSleep(350);
    }
    // 2) giochi senza saga: se Wikidata li mette in una serie con altri capitoli, nasce una saga nuova
    if(added < SAGA_CAP && !SAGA_UPD.stop){
      const singles = GAMES.filter(g=> !sagaKeyOf(g) && !fresh('g' + g.id)).sort((a, b)=> b.score - a.score).slice(0, 60);
      for(let i = 0; i < singles.length && added < SAGA_CAP && !SAGA_UPD.stop; i++){
        const g = singles[i]; say(`Giochi senza saga: ${i + 1}/${singles.length} · ${g.name}… (aggiunti ${added})`);
        const cands = await sagaCandidates([g.name]); looked++;
        let n = 0; for(const c of cands){ if(added >= SAGA_CAP) break; if(sagaQuietAdd(c)){ added++; n++; } }
        scan['g' + g.id] = Date.now(); saveScan(); await sagaSleep(350);
      }
    }
    DYN_SAGA_FOR = -1;
    say(added ? `Fatto: ${added} giochi aggiunti da ${looked} ricerche${added >= SAGA_CAP ? ' (limite per volta: premi di nuovo per continuare)' : ''}. Si completano da soli nei prossimi minuti.` : (SAGA_UPD.stop ? 'Fermato.' : 'Nessun capitolo nuovo trovato: le saghe sono complete per le fonti disponibili.'));
  }catch(e){ say('Ricerca interrotta: ' + String((e && e.message) || e).slice(0, 100)); }
  SAGA_UPD.running = false;
  try{ if(state.view === 'saga') renderSagaView(); }catch(e){}
}

// ---- Vista "per saga" ----
function renderSagaView(){
  const panel = document.getElementById('sagaPanel');
  if(!panel) return;
  const list = applyFilters();
  const bySaga = {};
  list.forEach(g=>{
    const key = sagaKeyOf(g);
    if(!key) return;
    if(!bySaga[key]) bySaga[key]=[];
    bySaga[key].push(g);
  });
  const keys = Object.keys(bySaga).sort((a,b)=> bySaga[b].length - bySaga[a].length);
  if(keys.length===0){
    panel.innerHTML = window.rtEmpty ? window.rtEmpty('saga') : '<div class="empty">Nessuna saga corrisponde ai filtri attuali (prova a rimuovere qualche filtro).</div>';
    return;
  }
  panel.innerHTML = `<div class="count-line" style="margin-bottom:10px;"><span>${keys.length} saghe multi-capitolo trovate (su ${list.length} giochi visibili)</span></div>
    <div class="saga-upd"><button class="btn primary" id="sagaUpdBtn" title="Cerca su Wikidata (e RAWG se hai la chiave) i capitoli e le saghe che mancano e li aggiunge alla lista">${giIcon('refresh')} Aggiorna saghe</button><button class="btn" id="sagaUpdStop" style="display:none">Ferma</button><div class="lp-sub" id="sagaUpdMsg">${escHtml(SAGA_UPD.msg || 'Cerca i capitoli e le saghe che mancano e li aggiunge da solo (fino a 30 giochi per volta: se ne restano, premi di nuovo).')}</div></div>` + keys.map(key=>{
    const info = SAGA_INFO[key];
    const games = bySaga[key].slice().sort((a,b)=> (a.ysort||0)-(b.ysort||0));
    return `<div class="saga-section">
      <div class="saga-section-head">
        <span class="saga-section-name">${info.name}</span>
        <span class="badge outline">${games.length} giochi</span>
        <span class="badge outline">${info.order}</span>
        <button class="btn saga-miss-btn" data-saga="${key}" title="Cerca online i capitoli che non hai">${giIcon('lens')} Capitoli mancanti</button>
      </div>
      <div class="saga-section-note">${info.note}</div>
      <div class="saga-games-grid">${games.map(g=>`<button class="saga-game-chip" data-id="${g.id}"><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span>${g.name}${g.year?` (${g.year})`:''}</button>`).join('')}</div>
      <div class="saga-missing" data-host="${key}"></div>
    </div>`;
  }).join('');
  { const ub = panel.querySelector('#sagaUpdBtn'), us = panel.querySelector('#sagaUpdStop');
    if(ub){ ub.addEventListener('click', ()=> sagaUpdateAll()); us.addEventListener('click', ()=>{ SAGA_UPD.stop = true; }); if(SAGA_UPD.running){ ub.disabled = true; us.style.display = ''; } } }
  panel.querySelectorAll('.saga-miss-btn').forEach(b=> b.addEventListener('click', ()=>{ const host = panel.querySelector(`.saga-missing[data-host="${b.dataset.saga}"]`); if(host) sagaFindMissing(b.dataset.saga, host); }));
  panel.querySelectorAll('.saga-game-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const gg = GAMES.find(x=>x.id===parseInt(btn.dataset.id,10));
      if(gg) openModal(gg);
    });
  });
}

// ---- Vista "Scopri" (scoperta in stile swipe, tipo Tinder) ----
let DISCOVER_SKIPPED = new Set();
function loadDiscoverSkipped(){
  DISCOVER_SKIPPED = new Set();
  try{ const ds = localStorage.getItem(profileKey('jrpg_discover_skipped')); if(ds) DISCOVER_SKIPPED = new Set(JSON.parse(ds)); }catch(e){ DISCOVER_SKIPPED = new Set(); }
}
loadDiscoverSkipped();
function saveDiscoverSkipped(){ try{ localStorage.setItem(profileKey('jrpg_discover_skipped'), JSON.stringify(Array.from(DISCOVER_SKIPPED))); }catch(e){} }
let discoverQueue = [];
let discoverIdx = 0;
let discoverHistory = [];
function buildDiscoverQueue(){
  const profile = buildTasteProfile();
  const pool = GAMES.filter(g=> !FAVS.has(g.id) && !STATUSES[g.id] && !DISCOVER_SKIPPED.has(g.id));
  const scored = pool.map(g=>({g, dna: dnaForGame(g, profile)}));
  scored.sort((a,b)=>{
    if(a.dna && b.dna) return b.dna.pct - a.dna.pct;
    if(a.dna && !b.dna) return -1;
    if(!a.dna && b.dna) return 1;
    return b.g.score - a.g.score;
  });
  return scored.map(o=>o.g);
}
function currentDiscoverGame(){ return discoverQueue[discoverIdx] || null; }
function discoverCoverMedia(g){
  const url = effectiveCover(g);
  if(url) return `<img src="${escHtml(url)}" alt="Copertina di ${escHtml(g.name)}" loading="lazy" decoding="async" draggable="false">`;
  const platShort = (g.plat||'').split('/')[0].trim();
  return `<div class="discover-cover-placeholder"><span class="pc-plat">${escHtml(platShort)}</span><span class="pc-tier ${TIER_LABEL[g.tier]}">${g.tier}</span></div>`;
}
function discoverCardHtml(g){
  if(!g){
    const anyLeftToRevisit = DISCOVER_SKIPPED.size > 0;
    return `<div class="discover-empty">
      <div class="discover-empty-icon">🎉</div>
      <div>${GAMES.length ? 'Hai visto tutti i giochi che potevano interessarti (in base a preferiti, stati e scarti già segnati).' : 'Nessun gioco da scoprire al momento.'}</div>
      ${anyLeftToRevisit ? `<button class="btn" id="discoverResetBtn">🔄 Rivedi quelli scartati (${DISCOVER_SKIPPED.size})</button>` : ''}
    </div>`;
  }
  const profile = buildTasteProfile();
  const dna = dnaForGame(g, profile);
  return `<div class="discover-card" id="discoverCard" data-id="${g.id}">
    <div class="discover-swipe-tag discover-like">MI INTERESSA</div>
    <div class="discover-swipe-tag discover-nope">PASSO</div>
    <div class="discover-cover">${discoverCoverMedia(g)}</div>
    <div class="discover-body">
      <div class="discover-title">${escHtml(g.name)}</div>
      <div class="modal-plat">${g.plat}${g.year ? ' · ' + g.year : ''}</div>
      <div class="modal-badges">
        <span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span>
        <span class="badge big outline">${g.tier === 'ND' ? 'voto ND' : g.score + '/100'}</span>
        ${dna ? `<span class="badge big outline" style="color:${dnaColor(dna.pct)};">🧬 ${dna.pct}%</span>` : ''}
      </div>
      <div class="modal-tags">${g.tags.slice(0,4).map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${TAG_INFO[t].label}</span>` : '').join('')}</div>
      ${g.label && g.label.ok ? `<div class="glabel-ok" style="margin-top:8px;">🟢 ${escHtml(g.label.ok)}</div>` : (g.enrich && g.enrich.whyLikeIt ? `<div class="modal-note">${g.enrich.whyLikeIt}</div>` : '')}
    </div>
  </div>`;
}
function renderDiscoverView(){
  discoverQueue = buildDiscoverQueue();
  discoverIdx = 0;
  discoverHistory = [];
  renderDiscoverCard();
}
function renderDiscoverCard(){
  const panel = document.getElementById('discoverPanel');
  if(!panel) return;
  const g = currentDiscoverGame();
  panel.innerHTML = `<div class="discover-wrap">
    <div class="discover-stage">${discoverCardHtml(g)}</div>
    ${g ? `<div class="discover-actions">
      <button class="discover-btn nope" id="discoverNopeBtn" title="Non fa per me">✕</button>
      <button class="discover-btn undo" id="discoverUndoBtn" title="Annulla ultima scelta" ${discoverHistory.length ? '' : 'disabled'}>↩️</button>
      <button class="discover-btn info" id="discoverInfoBtn" title="Vedi tutti i dettagli">ℹ️</button>
      <button class="discover-btn like" id="discoverLikeBtn" title="Mi interessa, da giocare">♥</button>
    </div>
    <div class="discover-hint">Trascina la copertina a destra/sinistra, oppure usa i pulsanti · ${discoverQueue.length - discoverIdx} da vedere</div>` : ''}
  </div>`;
  wireDiscoverCard();
}
function discoverAdvance(action){
  const g = currentDiscoverGame();
  if(!g) return;
  discoverHistory.push({id:g.id, action, prevStatus: STATUSES[g.id] || null});
  if(action==='like'){
    STATUSES[g.id] = 'backlog';
    saveStatuses(); renderMetrics();
    showToast(`📌 ${g.name} aggiunto a "da giocare"`);
  } else {
    DISCOVER_SKIPPED.add(g.id);
    saveDiscoverSkipped();
  }
  discoverIdx++;
  renderDiscoverCard();
}
function discoverUndo(){
  const last = discoverHistory.pop();
  if(!last) return;
  if(last.action==='like'){
    if(last.prevStatus) STATUSES[last.id] = last.prevStatus; else delete STATUSES[last.id];
    saveStatuses(); renderMetrics();
  } else {
    DISCOVER_SKIPPED.delete(last.id);
    saveDiscoverSkipped();
  }
  discoverIdx = Math.max(0, discoverIdx - 1);
  if(!discoverQueue[discoverIdx] || discoverQueue[discoverIdx].id !== last.id){
    const pos = discoverQueue.findIndex(x=>x.id===last.id);
    if(pos>=0){ const item = discoverQueue.splice(pos,1)[0]; discoverQueue.splice(discoverIdx,0,item); }
    else { const gg = GAMES.find(x=>x.id===last.id); if(gg) discoverQueue.splice(discoverIdx,0,gg); }
  }
  renderDiscoverCard();
  showToast('Scelta annullata');
}
function wireDiscoverCard(){
  const nopeBtn = document.getElementById('discoverNopeBtn');
  const likeBtn = document.getElementById('discoverLikeBtn');
  const undoBtn = document.getElementById('discoverUndoBtn');
  const infoBtn = document.getElementById('discoverInfoBtn');
  const resetBtn = document.getElementById('discoverResetBtn');
  if(nopeBtn) nopeBtn.addEventListener('click', ()=> discoverAdvance('skip'));
  if(likeBtn) likeBtn.addEventListener('click', ()=> discoverAdvance('like'));
  if(undoBtn) undoBtn.addEventListener('click', discoverUndo);
  if(infoBtn) infoBtn.addEventListener('click', ()=>{ const g = currentDiscoverGame(); if(g) openModal(g); });
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    DISCOVER_SKIPPED.clear(); saveDiscoverSkipped();
    showToast('Elenco degli scartati azzerato');
    renderDiscoverView();
  });
  const card = document.getElementById('discoverCard');
  if(card) wireDiscoverSwipe(card);
}
function wireDiscoverSwipe(card){
  let startX = 0, dx = 0, dragging = false;
  const likeTag = card.querySelector('.discover-like');
  const nopeTag = card.querySelector('.discover-nope');
  card.addEventListener('pointerdown', (e)=>{
    dragging = true; startX = e.clientX; dx = 0;
    card.classList.add('dragging');
    try{ card.setPointerCapture(e.pointerId); }catch(_){}
  });
  card.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    dx = e.clientX - startX;
    const rot = dx / 14;
    card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
    const op = Math.min(1, Math.abs(dx) / 90);
    if(dx > 0){ likeTag.style.opacity = op; nopeTag.style.opacity = 0; }
    else { nopeTag.style.opacity = op; likeTag.style.opacity = 0; }
  });
  function endDrag(){
    if(!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    if(Math.abs(dx) > 110){
      const dir = dx > 0 ? 1 : -1;
      card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      card.style.transform = `translateX(${dir*700}px) rotate(${dir*24}deg)`;
      card.style.opacity = '0';
      setTimeout(()=> discoverAdvance(dir>0 ? 'like' : 'skip'), 200);
    } else {
      card.style.transition = 'transform 0.2s';
      card.style.transform = 'translateX(0) rotate(0)';
      likeTag.style.opacity = 0; nopeTag.style.opacity = 0;
    }
    dx = 0;
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  card.addEventListener('pointerleave', (e)=>{ if(dragging && e.buttons===0) endDrag(); });
}

// ---- Wizard "Cosa gioco stasera?" ----
let wizardAnswers = {time:'', mood:'', tier:''};
let wizardStep = 0;
function openWizard(){
  wizardAnswers = {time:'', mood:'', tier:''};
  wizardStep = 0;
  renderWizardStep();
  wizardBackdrop.classList.add('show');
}
function closeWizard(){ wizardBackdrop.classList.remove('show'); }
function renderWizardStep(){
  const q = WIZARD_QUESTIONS[wizardStep];
  wizardCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">🧭 Cosa gioco stasera?</div>
      <button class="modal-close" id="wizardCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="modal-note">Domanda ${wizardStep+1} di ${WIZARD_QUESTIONS.length}</div>
    <div class="modal-section-title">${q.question}</div>
    <div class="wizard-options">${q.options.map(o=>`<button class="btn wizard-opt" data-value="${o.value}">${o.label}</button>`).join('')}</div>
  `;
  document.getElementById('wizardCloseBtn').addEventListener('click', closeWizard);
  wizardCard.querySelectorAll('.wizard-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      wizardAnswers[q.key] = btn.dataset.value;
      wizardStep++;
      if(wizardStep >= WIZARD_QUESTIONS.length) finishWizard();
      else renderWizardStep();
    });
  });
}
function finishWizard(){
  let pool = GAMES.slice();
  if(wizardAnswers.time==='short') pool = pool.filter(g=> g.enrich && g.enrich.hoursMain && g.enrich.hoursMain<=20);
  else if(wizardAnswers.time==='medium') pool = pool.filter(g=> g.enrich && g.enrich.hoursMain && g.enrich.hoursMain>20 && g.enrich.hoursMain<=50);
  else if(wizardAnswers.time==='long') pool = pool.filter(g=> g.enrich && g.enrich.hoursMain && g.enrich.hoursMain>50);
  if(wizardAnswers.mood==='relax') pool = pool.filter(g=> g.enrich && (g.enrich.dopamine || (g.enrich.gameplayScore||0)>=7) && !g.tags.includes('HOR') && !g.tags.includes('SOUL'));
  else if(wizardAnswers.mood==='story') pool = pool.filter(g=> g.enrich && g.enrich.storyTag);
  else if(wizardAnswers.mood==='challenge') pool = pool.filter(g=> g.tags.includes('TAC')||g.tags.includes('SOUL')||g.tags.includes('WAR'));
  else if(wizardAnswers.mood==='action') pool = pool.filter(g=> g.tags.includes('ACT')||g.tags.includes('MECH'));
  if(wizardAnswers.tier==='top') pool = pool.filter(g=> g.tier==='S+'||g.tier==='S');
  else if(wizardAnswers.tier==='good') pool = pool.filter(g=> ['S+','S','A','B'].includes(g.tier));
  if(pool.length===0) pool = GAMES.slice();
  const pick = pool[Math.floor(Math.random()*pool.length)];
  closeWizard();
  openModal(pick);
  showToast(`La sorte ha scelto: ${pick.name}`);
}
document.getElementById('wizardBtn').addEventListener('click', openWizard);
wizardBackdrop.addEventListener('click', (e)=>{ if(e.target===wizardBackdrop) closeWizard(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && wizardBackdrop.classList.contains('show')) closeWizard(); });
