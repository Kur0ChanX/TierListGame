// Nucleo: dati, profili, liste per genere, classifica, filtri, La mia Tier List, scheda gioco. Seguono app-schede.js, app-utente.js, app-ai.js (stesso ambiente globale).
const TIER_ORDER = {'S+':0,'S':1,'A':2,'B':3,'C':4,'D':5,'E':6,'F':7,'ND':8};
const TIER_LABEL = {'S+':'Splus','S':'S','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','ND':'ND'};
const TIERS_LIST = ['S+','S','A','B','C','D','E','F','ND'];      // ND = voto non verificato (né Metacritic né OpenCritic): sta sotto tutti i rank
// testo del voto: «ND» quando il titolo non ha un voto verificato
function scoreTxt(g){ return g.tier === 'ND' ? 'ND' : g.score; }

// ---- Generi, pubblico, temi e studi (definiti nei dati: GIOCHI_DATA.meta) ----
const AM_META = (typeof GIOCHI_DATA !== 'undefined' && GIOCHI_DATA.meta) || {tags: [], studios: [], sagas: {}, tierCuts: {}};
const TAG_INFO = {};
AM_META.tags.forEach(t=>{ TAG_INFO[t.c] = {icon: t.i, label: t.l, group: t.g}; });
const TAG_ORDER = AM_META.tags.map(t=> t.c);
// studi di animazione come «generi» speciali: studio:pixar, studio:ghibli… (classifica dello studio)
const STUDIO_INFO = {};
(AM_META.studios || []).forEach(st=>{ STUDIO_INFO[st.k] = st; TAG_INFO['studio:' + st.k] = {icon: st.i, label: st.n, group: 'Studi'}; });
// nessun genere «extra»: ogni titolo sta nella lista del suo tipo (Anime, Film, Animazione, Manga, Manhwa)
const EXTRA_GENRE_INFO = {};
// tipi di lista (al posto di «JRPG / RPG»)
const KINDS = [
  {id:'anime', icon:'play', emoji:'📺', label:'Anime', full:'Serie anime', watch:true},
  {id:'film', icon:'film', emoji:'🎞️', label:'Film anime', full:'Film d\'animazione giapponesi', watch:true},
  {id:'animazione', icon:'castle', emoji:'🏰', label:'Animazione', full:'Animazione occidentale (Disney, Pixar, DreamWorks…)', watch:true},
  {id:'manga', icon:'book', emoji:'📚', label:'Manga', full:'Manga', watch:false},
  {id:'manhwa', icon:'webtoon', emoji:'📱', label:'Manhwa', full:'Manhwa e manhua (fumetti coreani e cinesi)', watch:false}
];
const KIND_BY_ID = {}; KINDS.forEach(k=>{ KIND_BY_ID[k.id] = k; });
const isWatch = g=> !g || !KIND_BY_ID[g.kind] || KIND_BY_ID[g.kind].watch;
// parole giuste per il tipo: si GUARDA (anime, film, animazione) o si LEGGE (manga, manhwa); senza titolo: «visto/letto»
function kw(g){
  if(g === undefined) return {done:'Visto/letto', todo:'Da vedere/leggere', again:'Lo rivedrei', againTu:'Lo rivedresti', ask:'L\'hai visto o letto?', verb:'guardare o leggere', done_l:'visto o letto', img:'immagini'};
  return isWatch(g) ? {done:'Visto', todo:'Da vedere', again:'Lo rivedrei', againTu:'Lo rivedresti', ask:'L\'hai visto?', verb:'guardare', done_l:'visto', img:'fotogrammi'}
    : {done:'Letto', todo:'Da leggere', again:'Lo rileggerei', againTu:'Lo rileggeresti', ask:'L\'hai letto?', verb:'leggere', done_l:'letto', img:'tavole'};
}
// Gruppi del selettore «Tutti i generi»
const GENRE_GROUPS = [
  {icon:'🎬', title:'Generi', codes: AM_META.tags.filter(t=> t.g === 'Generi').map(t=> t.c)},
  {icon:'👥', title:'Pubblico', codes: AM_META.tags.filter(t=> t.g === 'Pubblico').map(t=> t.c)},
  {icon:'🧩', title:'Temi', codes: AM_META.tags.filter(t=> t.g === 'Temi' || t.g === 'Formato').map(t=> t.c)}
].concat(['USA', 'Giappone', 'Europa e resto del mondo'].map(gr=> ({icon: gr === 'USA' ? '🇺🇸' : gr === 'Giappone' ? '🇯🇵' : '🌍', title: 'Studi: ' + gr, codes: (AM_META.studios || []).filter(s=> s.g === gr).map(s=> 'studio:' + s.k)})));
const NOVITA_GENRE_SECTIONS = GENRE_GROUPS.map(g=> ({title: g.icon + ' ' + g.title, codes: g.codes.filter(c=> TAG_INFO[c])}));
const NOVITA_GENRE_ALL_CODES = NOVITA_GENRE_SECTIONS.reduce((acc,s)=> acc.concat(s.codes), []);
// Significato di alcuni codici, da dare all'AI insieme al codice
const GENRE_HINT = {
  SHO:'shonen: pensato per ragazzi, azione, crescita e amicizia (Naruto, One Piece)', SEI:'seinen: per adulti, temi maturi (Berserk, Monster)',
  SHJ:'shojo: per ragazze, sentimenti e relazioni (Fruits Basket)', JOS:'josei: per donne adulte (Nana)',
  ISE:'isekai: il protagonista finisce in un altro mondo', IYA:'iyashikei: storie rilassanti e confortanti', SOL:'slice of life: vita quotidiana',
  MEC:'mecha: robot giganti pilotati', MAH:'magical girl: ragazze con poteri magici', ECC:'ecchi: fanservice esplicito'
};
function genreGlossary(codes){ return codes.map(c=> `${c} = ${TAG_INFO[c] ? TAG_INFO[c].label : c}${GENRE_HINT[c] ? ' (' + GENRE_HINT[c] + ')' : ''}`).join('; '); }

// Mappa id titolo -> chiave saga (raggruppamento automatico per franchise, solo sighe con 2+ titoli in classifica)
const SAGA_MAP = GIOCHI_DATA.sagaMap;
// Info per ogni saga: nome, ordine consigliato, nota
// Info per ogni saga: nome (dai dati), ordine consigliato e nota (si possono aggiungere a mano qui)
const SAGA_INFO = {};
Object.keys(AM_META.sagas || {}).forEach(k=>{ SAGA_INFO[k] = {name: AM_META.sagas[k], order: '', note: ''}; });

const MOOD_PRESETS = [
  {key:'quick', icon:'\u23F1\uFE0F', label:'Una serata', test:(g)=> !!(g.enrich && g.enrich.hoursMain && g.enrich.hoursMain<=3)},
  {key:'relax', icon:'\uD83D\uDE0C', label:'Rilassante', test:(g)=> (g.tags.includes('IYA') || g.tags.includes('SOL') || g.tags.includes('COM')) && !g.tags.includes('HOR') && !g.tags.includes('GOR')},
  {key:'challenge', icon:'\uD83E\uDDE0', label:'Fa pensare', test:(g)=> g.tags.includes('PSY') || g.tags.includes('MYS') || g.tags.includes('TIM')},
  {key:'epic', icon:'\uD83D\uDCDA', label:'Epico e lungo', test:(g)=> !!(g.enrich && g.enrich.hoursMain && g.enrich.hoursMain>=40)},
  {key:'dopamine', icon:'\uD83D\uDCA5', label:'Azione pura', test:(g)=> g.tags.includes('ACT') || g.tags.includes('MAR') || g.tags.includes('POW')}
];

const WIZARD_QUESTIONS = [
  {key:'time', question:'Quanto tempo hai a disposizione?', options:[
    {value:'short', label:'\u23F1\uFE0F Poco: un film o una serie breve (fino a 20 ore)'},
    {value:'medium', label:'\u23F3 Qualche settimana (20-50 ore)'},
    {value:'long', label:"\uD83D\uDCDA Tanto, voglio un'epopea (50+ ore)"},
    {value:'', label:'\uD83E\uDD37 Non importa'}
  ]},
  {key:'mood', question:'Che umore hai stasera?', options:[
    {value:'relax', label:'\uD83D\uDE0C Qualcosa di rilassante'},
    {value:'story', label:'\u2728 Una storia intensa'},
    {value:'challenge', label:'\uD83E\uDDE0 Qualcosa che faccia pensare'},
    {value:'action', label:'\u2694\uFE0F Azione e combattimenti'},
    {value:'', label:'\uD83E\uDD37 Non importa'}
  ]},
  {key:'tier', question:'Quanto vuoi puntare in alto?', options:[
    {value:'top', label:'\uD83C\uDFC6 Solo capolavori (S+/S)'},
    {value:'good', label:'\uD83D\uDC4D Anche A/B va benissimo'},
    {value:'', label:'\uD83C\uDFB2 Sorprendimi, qualsiasi tier'}
  ]}
];

// v209: indice «a tabella» (enc 't1'): una riga per titolo → oggetti come prima (stesso codice di tools/data-io.js decodeT1)
(function decodeIndex(D){
  if(!D || D.enc !== 't1' || !D.t) return;
  const NUL = '\u2205', dec = v=> v === NUL ? null : v, T = D.t, gc = T.cols.g, lc = T.cols.l, ec = T.cols.e, games = [], labels = {}, lite = {};
  for(const r of T.rows){
    const g = {}; let i = 0;
    for(const c of gc){ const v = r[i++]; if(v !== null && v !== undefined) g[c] = dec(v); }
    const hasL = r[i++], l = {}; for(const c of lc){ const v = r[i++]; if(v !== null && v !== undefined) l[c] = dec(v); }
    const hasE = r[i++], e = {}; for(const c of ec){ const v = r[i++]; if(v !== null && v !== undefined) e[c] = dec(v); }
    const x = r[i] || null;
    if(x){ for(const k in x){ if(k !== 'l' && k !== 'e') g[k] = x[k]; } if(x.l) Object.assign(l, x.l); if(x.e) Object.assign(e, x.e); }
    games.push(g); if(hasL) labels[g.id] = l; if(hasE) lite[g.id] = e;
  }
  D.games = games; D.labels = labels; D.lite = lite; delete D.t;
})(typeof GIOCHI_DATA !== 'undefined' ? GIOCHI_DATA : null);
const GAMES = GIOCHI_DATA.games;
// ---- DATI v3 (v209): INDICE LEGGERO + TESTI A PEZZI (pensato per 20.000+ titoli) ----
// giochi.js ha solo l'indice: nome, generi, voto, tier, etichetta in numeri e un «lite» per titolo (storyTag, dopamina, ore,
// punteggi, locandina e i tratti già riconosciuti nei testi, mx). I testi lunghi (trama, analisi, pro/contro, «fa per te se»,
// dopamina) stanno in dati/testi-K.js (250 titoli a pezzo) e arrivano quando servono: apri un titolo, Update+, Oracolo…
// Se il catalogo non è enorme li carico anche in sottofondo, un pezzo alla volta, quando il telefono è libero.
// Fino all'arrivo dei testi g.enrich è il «lite» (con _lite: true) e g.story manca: il codice lo gestisce già (come prima, in attesa dei dettagli).
const DATA_V3 = GIOCHI_DATA.v === 3, TEXT_SH = GIOCHI_DATA.sh || 250;
const LITE = GIOCHI_DATA.lite || {};
GAMES.forEach(g=>{ g.enrich = DATA_V3 && LITE[g.id] ? Object.assign({_lite: true}, LITE[g.id]) : null; });
let DETAILS_READY = DATA_V3;            // con l'indice i dati per lista, filtri e gusti ci sono subito
function detailsReady(){ return DETAILS_READY; }
const RT_TEXT = {have: new Set(), wait: new Map(), loading: new Map(), byId: null};
const textShard = id=> Math.floor(+id / TEXT_SH);
function textMerge(pack){
  if(!pack || !pack.g) return;
  if(!RT_TEXT.byId || RT_TEXT.byId.size !== GAMES.length){ RT_TEXT.byId = new Map(GAMES.map(x=> [String(x.id), x])); }
  Object.keys(pack.g).forEach(id=>{
    const g = RT_TEXT.byId.get(String(id)), x = pack.g[id]; if(!g || g.custom) return;
    if(x.story != null) g.story = x.story;
    if(x.lab) g.label = Object.assign({}, g.label || {}, x.lab);
    if(x.enrich){ const lite = g.enrich || {}; const e = Object.assign({}, x.enrich); if(x.dopa) e.dopa = x.dopa; ['coverUrl'].forEach(k=>{ if(lite[k] && !e[k]) e[k] = lite[k]; }); g.enrich = e; }
    else if(g.enrich && g.enrich._lite){ delete g.enrich._lite; }
  });
  RT_TEXT.have.add(pack.k);
}
// ogni file di testi, quando arriva, chiama questa funzione (o si mette in coda se l'app non è ancora pronta)
window.rtTestiArrived = function(){
  const Q = window.rtTestiArrivati || []; window.rtTestiArrivati = [];
  const ks = [];
  Q.forEach(p=>{ try{ textMerge(p); ks.push(p.k); }catch(e){} });
  if(!ks.length) return;
  try{ if(typeof applyGameOverrides === 'function') applyGameOverrides(); }catch(e){}       // le tue correzioni approvate valgono sempre sopra i testi di base
  // NIENTE ricalcolo dei gusti: i tratti dell'indice (mx) sono identici a quelli dei testi (verificato da tools/test/tv3.js)
  ks.forEach(k=>{ const w = RT_TEXT.wait.get(k); if(w){ RT_TEXT.wait.delete(k); w.forEach(f=>{ try{ f(); }catch(e){} }); } RT_TEXT.loading.delete(k); });
  try{ window.dispatchEvent(new CustomEvent('rt-texts', {detail: ks})); }catch(e){}
};
function textLoad(k){
  if(RT_TEXT.have.has(k)) return Promise.resolve();
  return new Promise(res=>{
    const w = RT_TEXT.wait.get(k) || []; w.push(res); RT_TEXT.wait.set(k, w);
    if(RT_TEXT.loading.has(k)) return;
    let tries = 0;
    const go = ()=>{
      const s = document.createElement('script'); s.src = 'dati/testi-' + k + '.js'; s.async = true;
      s.onerror = ()=>{ s.remove(); if(++tries < 3) setTimeout(go, 1200 * tries); else { RT_TEXT.loading.delete(k); const ww = RT_TEXT.wait.get(k) || []; RT_TEXT.wait.delete(k); ww.forEach(f=> f()); } };   // niente rete: vado avanti con l'indice
      document.head.appendChild(s);
    };
    RT_TEXT.loading.set(k, true); go();
  });
}
// API per tutto il programma: rtTexts.has(g) · rtTexts.ensure(g | [g…] | id) → Promise · rtTexts.ensureAll(progress) → Promise
window.rtTexts = {
  has: g=> !DATA_V3 || !g || g.custom || RT_TEXT.have.has(textShard(g.id)) || !(g.enrich && g.enrich._lite) && g.story != null,
  ensure(x){
    if(!DATA_V3) return Promise.resolve();
    const list = (Array.isArray(x) ? x : [x]).map(v=> typeof v === 'object' && v ? v : {id: v}).filter(v=> v && v.id != null && !v.custom);
    const ks = [...new Set(list.map(v=> textShard(v.id)))].filter(k=> !RT_TEXT.have.has(k));
    return Promise.all(ks.map(textLoad)).then(()=>{});
  },
  async ensureAll(progress){
    if(!DATA_V3) return;
    const ks = [...new Set(GAMES.filter(g=> !g.custom).map(g=> textShard(g.id)))].filter(k=> !RT_TEXT.have.has(k));
    for(let i = 0; i < ks.length; i++){ await textLoad(ks[i]); try{ progress && progress(i + 1, ks.length); }catch(e){} }
  },
  loaded: ()=> RT_TEXT.have.size, shard: textShard
};
// i testi dei titoli «vicini» al dito arrivano prima del tocco: inizio a caricarli appena lo appoggi
document.addEventListener('pointerdown', e=>{
  try{ const el = e.target.closest && e.target.closest('[data-gid],[data-id],[data-open],[data-brg],[data-sp]'); if(!el) return;
    const id = el.dataset.gid || el.dataset.id || el.dataset.open || el.dataset.brg || el.dataset.sp; if(id && /^\d+$/.test(id)) rtTexts.ensure(+id); }catch(x){}
}, {capture: true, passive: true});
// in sottofondo, quando il telefono è libero: con un catalogo normale carico tutti i testi (un pezzo ogni ~0,6 s),
// con uno enorme solo quelli dei titoli che contano per i tuoi gusti (preferiti, visti, nel cuore, votati)
setTimeout(function fill(){
  if(!DATA_V3) return;
  const idle = f=> (window.requestIdleCallback ? requestIdleCallback(f, {timeout: 4000}) : setTimeout(f, 200));
  const total = GAMES.length;
  let ks;
  // v215: prima i pezzi con i TUOI titoli (preferiti, visti, nel cuore): sono quelli che apri di più
  let mineK = []; try{ const top = new Set((window.rtLSro ? rtLSro('atl_top', []) : []) || []); mineK = [...new Set(GAMES.filter(g=> !g.custom && (FAVS.has(g.id) || STATUSES[g.id] || top.has(g.id))).map(g=> textShard(g.id)))]; }catch(e){}
  if(total <= 6000) ks = [...new Set(mineK.concat(GAMES.filter(g=> !g.custom).map(g=> textShard(g.id))))];
  else { let mine = []; try{ mine = GAMES.filter(g=> FAVS.has(g.id) || STATUSES[g.id]); }catch(e){} ks = [...new Set(mine.map(g=> textShard(g.id)))]; }
  ks = ks.filter(k=> !RT_TEXT.have.has(k));
  let i = 0;
  const step = ()=>{ if(i >= ks.length) return; if(document.hidden){ setTimeout(step, 3000); return; } const k = ks[i++]; textLoad(k).then(()=> setTimeout(()=> idle(step), 350)); };
  idle(step);
}, 2500);          // v215: prima partiva dopo 7 s, e chi apriva un titolo subito aspettava i testi (locandina sola sul nero per ~0,7 s)
// compatibilità: chi aspettava «i dettagli» li ha già (indice)
if(DATA_V3) setTimeout(()=>{ try{ window.dispatchEvent(new Event('details-ready')); }catch(e){} }, 0);
// ---- formato vecchio (fino alla v208): dettagli in 4 pezzi, se qualcuno li ha ancora ----
const DETAILS_N = 4;
function detailsPart(){
  if(DATA_V3) return false;
  const P = window.GIOCHI_DETAILS_PARTS || [], seen = new Set(P.map(x=> x.part));
  if(seen.size < DETAILS_N || DETAILS_READY) return false;
  const all = {enrich: {}, dopa: {}};
  P.forEach(x=>{ Object.assign(all.enrich, x.enrich || {}); Object.assign(all.dopa, x.dopa || {}); });
  window.GIOCHI_DETAILS = all;
  return applyDetails();
}
function applyDetails(){
  if(DETAILS_READY || typeof GIOCHI_DETAILS === 'undefined' || !GIOCHI_DETAILS) return false;
  const EN = GIOCHI_DETAILS.enrich || {}, DP = GIOCHI_DETAILS.dopa || {};
  GAMES.forEach(g=>{
    if(g.custom) return;
    g.enrich = EN[g.id] || null;
    if(g.enrich && DP[g.id]) g.enrich.dopa = DP[g.id];
  });
  DETAILS_READY = true;
  try{ if(typeof applyGameOverrides === 'function') applyGameOverrides(); }catch(e){}
  try{ renderMetrics(); renderStats(); render(); renderListBar(); }catch(e){}
  try{ if(typeof currentModalGame !== 'undefined' && currentModalGame && modalBackdrop.classList.contains('show')) openModal(currentModalGame); }catch(e){}
  try{ window.dispatchEvent(new Event('details-ready')); }catch(e){}
  return true;
}
function retryDetails(){}
const LABELS = GIOCHI_DATA.labels;
GAMES.forEach(g=>{ g.label = LABELS[g.id] || null; });
const MARKET = GIOCHI_DATA.market;
GAMES.forEach(g=>{ g.market = (MARKET.games && MARKET.games[g.id]) || null; });

// ---- Profili utente: Mario di default + ospiti rinominabili, ognuno con i propri dati personali ----
// Il profilo "mario" (quello di sempre) continua a usare le chiavi di salvataggio storiche, SENZA
// suffisso: così chi aggiorna l'app non perde nulla di quello che aveva già salvato. Solo i NUOVI
// profili ospite usano chiavi proprie, isolate dalle sue.
function loadProfiles(){
  try{
    const raw = localStorage.getItem('atl_profiles');
    if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }
  }catch(e){}
  return [{id:'mario', name:'Mario'}];
}
let PROFILES = loadProfiles();
function saveProfiles(){ try{ localStorage.setItem('atl_profiles', JSON.stringify(PROFILES)); }catch(e){} }
function loadActiveProfileId(){
  try{
    const id = localStorage.getItem('atl_active_profile');
    if(id && PROFILES.some(p=>p.id===id)) return id;
  }catch(e){}
  return PROFILES[0].id;
}
let ACTIVE_PROFILE_ID = loadActiveProfileId();
function saveActiveProfileId(){ try{ localStorage.setItem('atl_active_profile', ACTIVE_PROFILE_ID); }catch(e){} }
function currentProfile(){ return PROFILES.find(p=>p.id===ACTIVE_PROFILE_ID) || PROFILES[0]; }
function profileKey(baseKey){ return ACTIVE_PROFILE_ID==='mario' ? baseKey : (baseKey + '__' + ACTIVE_PROFILE_ID); }
function nextGuestId(){ return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

let FAVS = new Set();
function loadFavs(){
  FAVS = new Set();
  try{
    const stored = localStorage.getItem(profileKey('atl_favs'));
    if(stored) FAVS = new Set(JSON.parse(stored));
  }catch(e){ FAVS = new Set(); }
}
loadFavs();
function saveFavs(){ try{ localStorage.setItem(profileKey('atl_favs'), JSON.stringify(Array.from(FAVS))); }catch(e){} }

const STATUS_INFO = {
  played:{icon:'✅', label:'Visto / letto', dot:'played'},
  playing:{icon:'▶️', label:'In corso', dot:'playing'},
  backlog:{icon:'📌', label:'Da vedere / leggere', dot:'backlog'},
  dropped:{icon:'⛔', label:'Droppato', dot:'dropped'}
};
let STATUSES = {};
function loadStatuses(){
  STATUSES = {};
  try{
    const storedS = localStorage.getItem(profileKey('atl_status'));
    if(storedS) STATUSES = JSON.parse(storedS);
  }catch(e){ STATUSES = {}; }
}
loadStatuses();
function saveStatuses(){ try{ localStorage.setItem(profileKey('atl_status'), JSON.stringify(STATUSES)); }catch(e){} }
function setStatus(id, status){
  if(STATUSES[id]===status){ delete STATUSES[id]; }
  else { STATUSES[id] = status; }
  saveStatuses();
}

let MYTIER = {};
function loadMyTier(){
  MYTIER = {};
  try{
    const storedMT = localStorage.getItem(profileKey('atl_mytier'));
    if(storedMT) MYTIER = JSON.parse(storedMT);
  }catch(e){ MYTIER = {}; }
}
loadMyTier();
function saveMyTier(){ try{ localStorage.setItem(profileKey('atl_mytier'), JSON.stringify(MYTIER)); }catch(e){} }
function effectiveTier(g){ return MYTIER[g.id] || g.tier; }
function moveToTier(id, tier){
  const g = GAMES.find(x=>String(x.id)===String(id));
  if(!g) return;
  MYTIER[id] = tier;                                  // sempre esplicito: «l'ho classificato io» anche se coincide con la classifica ufficiale
  saveMyTier(); renderMyTier();
  showToast(`${g.name} → ${tier}`);
}
function removeFromMyTier(id){
  const g = GAMES.find(x=>String(x.id)===String(id)); if(!g) return;
  delete MYTIER[id]; saveMyTier(); renderMyTier();
  showToast(`${g.name} tolto dalla tua tier list`);
}

// ---- Classifiche: per TIPO (Anime, Film anime, Animazione, Manga, Manhwa: sempre in vista) + le liste per genere o studio che scegli tu ----
let ACTIVE_LIST = 'anime';   // 'all' | tipo (anime, film…) | codice genere | studio:chiave
let MY_LISTS = [];           // codici genere/studio aggiunti come classifica
const isKindList = id=> !!KIND_BY_ID[id];
function loadLists(){
  ACTIVE_LIST = 'anime'; MY_LISTS = [];
  try{
    const v = JSON.parse(localStorage.getItem(profileKey('atl_lists')) || 'null');
    if(v && Array.isArray(v.mine)) MY_LISTS = v.mine.filter(c=> TAG_INFO[c]);
    if(v && typeof v.sel === 'string' && (isKindList(v.sel) || v.sel === 'all' || MY_LISTS.includes(v.sel))) ACTIVE_LIST = v.sel;
  }catch(e){}
}
function saveLists(){ try{ localStorage.setItem(profileKey('atl_lists'), JSON.stringify({sel: ACTIVE_LIST, mine: MY_LISTS})); }catch(e){} }
function inActiveList(g){
  if(ACTIVE_LIST === 'all') return true;
  if(isKindList(ACTIVE_LIST)) return (g.kind || 'anime') === ACTIVE_LIST;
  if(ACTIVE_LIST.indexOf('studio:') === 0) return g.stk === ACTIVE_LIST.slice(7);
  return (g.tags || []).includes(ACTIVE_LIST);
}
function listCount(id){ const prev = ACTIVE_LIST; ACTIVE_LIST = id; const n = GAMES.filter(inActiveList).length; ACTIVE_LIST = prev; return n; }
function bumpListUsage(id){ if(isKindList(id) || id === 'all') return; try{ const k = profileKey('atl_list_usage'); const u = JSON.parse(localStorage.getItem(k) || '{}') || {}; u[id] = (u[id] || 0) + 1; localStorage.setItem(k, JSON.stringify(u)); }catch(e){} }
function listUsage(){ try{ return JSON.parse(localStorage.getItem(profileKey('atl_list_usage')) || '{}') || {}; }catch(e){ return {}; } }
function setActiveList(id){ ACTIVE_LIST = id; bumpListUsage(id); saveLists(); renderListBar(); if(typeof setView === 'function') setView(state.view); }
// barra «salva-pollice»: Tutti, i 5 tipi, i generi/studi tenuti in vista (📌) o i più usati (max 4), poi il selettore completo a gruppi
const LIST_BAR_MAX = 4;
function listPins(){ try{ const v = JSON.parse(localStorage.getItem(profileKey('atl_list_pins')) || 'null'); return Array.isArray(v) ? v.filter(c=> TAG_INFO[c]) : null; }catch(e){ return null; } }
function saveListPins(a){ try{ if(a == null) localStorage.removeItem(profileKey('atl_list_pins')); else localStorage.setItem(profileKey('atl_list_pins'), JSON.stringify(a)); }catch(e){} }
function renderListBar(){
  const bar = document.getElementById('listBar'); if(!bar) return;
  const chip = (id, icon, label)=> `<button class="list-chip${ACTIVE_LIST===id?' active':''}" data-list="${id}">${icon} ${escHtml(label)} <span class="list-cnt">${listCount(id)}</span></button>`;
  const GI = n=> `<svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-${n}"/></svg>`;
  const use = listUsage();
  const cand = MY_LISTS.map(c=> ({c, n: listCount(c), u: use[c] || 0})).filter(o=> o.n > 0 && TAG_INFO[o.c]).sort((a, b)=> b.u - a.u || b.n - a.n);
  const pins = listPins();
  let shown = pins ? pins.slice() : cand.slice(0, LIST_BAR_MAX).map(o=> o.c);
  if(!isKindList(ACTIVE_LIST) && ACTIVE_LIST !== 'all' && TAG_INFO[ACTIVE_LIST] && !shown.includes(ACTIVE_LIST)) shown = [ACTIVE_LIST].concat(pins ? shown : shown.slice(0, LIST_BAR_MAX - 1));
  bar.innerHTML = chip('all', GI('globe'), 'Tutti') + KINDS.map(k=> chip(k.id, GI(k.icon), k.label)).join('') + shown.map(c=> chip(c, TAG_INFO[c].icon, TAG_INFO[c].label)).join('') + `<button class="list-chip list-add" id="listAddBtn" title="Tutti i generi e gli studi, divisi per gruppi">${GI('lens')} Generi e studi</button>`;
  bar.querySelectorAll('[data-list]').forEach(b=> b.addEventListener('click', ()=> setActiveList(b.dataset.list)));
  document.getElementById('listAddBtn').addEventListener('click', ()=> openListPicker());
}
// selettore a gruppi espandibili (accordion): usato dalla barra dei generi e da «Novità per genere»
const GG_OPEN = new Set([0]);
function genreAccordionHtml(chipFn, countFn, q){
  return GENRE_GROUPS.map((g, gi)=>{
    const codes = g.codes.filter(c=> TAG_INFO[c] && (!q || (TAG_INFO[c].label + ' ' + g.title).toLowerCase().includes(q)));
    if(!codes.length) return '';
    const n = countFn ? countFn(codes) : 0;
    return `<details class="gg" data-gg="${gi}" ${(q || GG_OPEN.has(gi)) ? 'open' : ''}><summary><span>${g.icon} ${escHtml(g.title)}</span><small>${n ? n + ' · ' : ''}${codes.length}</small></summary><div class="gg-chips">${codes.map(chipFn).join('')}</div></details>`;
  }).join('') || '<div class="lp-sub">Nessun genere con questo nome.</div>';
}
function wireAccordion(root, hasQuery){
  root.querySelectorAll('details.gg').forEach(d=> d.addEventListener('toggle', ()=>{ if(hasQuery) return; const i = +d.dataset.gg; if(d.open) GG_OPEN.add(i); else GG_OPEN.delete(i); }));
}
let PIN_MODE = false;
function openListPicker(q){
  q = typeof q === 'string' ? q.trim().toLowerCase() : '';
  let el = document.getElementById('listPickerBackdrop');
  if(!el){
    el = document.createElement('div'); el.id = 'listPickerBackdrop'; el.className = 'dup-backdrop';
    el.addEventListener('click', (e)=>{ if(e.target === el || e.target.closest('[data-lp-close]')){ PIN_MODE = false; el.classList.remove('show'); renderListBar(); } });
    document.body.appendChild(el);
  }
  const pinned = new Set(listPins() || []), chip = c=>{ const n = listCount(c); return `<button class="list-chip${ACTIVE_LIST===c?' active':''}${n ? '' : ' lp-zero'}${PIN_MODE && pinned.has(c) ? ' pinned' : ''}" data-lp="${c}">${PIN_MODE ? (pinned.has(c) ? '📌 ' : '') : ''}${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)} <span class="list-cnt">${n}</span></button>`; };
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🔍 Tutti i generi</b><button class="btn" data-lp-close>Chiudi</button></div>
    <div class="lp-sub">${PIN_MODE ? 'Tocca i generi da tenere in vista nella barra (📌 = in vista). Gli altri restano qui sotto «Tutti i generi».' : 'Tocca un genere per aprire la sua classifica. I gruppi si aprono e si chiudono.'}</div>
    <div class="lp-tools"><button class="btn${PIN_MODE ? ' primary' : ''}" type="button" id="lpPin">📌 ${PIN_MODE ? 'Fatto' : 'Scegli quali tenere in vista'}</button>${listPins() ? '<button class="btn" type="button" id="lpAuto">Usa i più cercati</button>' : ''}</div>
    <input class="lp-search" id="lpSearch" type="search" placeholder="Cerca un genere (es. horror, kart, puzzle)…" value="${escHtml(q)}" autocomplete="off">
    <div class="gg-wrap">${genreAccordionHtml(chip, codes=> codes.filter(c=> listCount(c) > 0).length, q)}</div></div>`;
  const inp = el.querySelector('#lpSearch');
  let h = 0; inp.addEventListener('input', ()=>{ clearTimeout(h); h = setTimeout(()=>{ const v = inp.value; openListPicker(v); const n = document.getElementById('lpSearch'); if(n){ n.focus(); n.setSelectionRange(v.length, v.length); } }, 200); });
  wireAccordion(el, !!q);
  el.querySelector('#lpPin').addEventListener('click', ()=>{ PIN_MODE = !PIN_MODE; if(PIN_MODE && !listPins()) saveListPins(MY_LISTS.map(c=> ({c, u: listUsage()[c] || 0})).sort((a, b)=> b.u - a.u).slice(0, LIST_BAR_MAX).map(o=> o.c)); renderListBar(); openListPicker(q); });
  const au = el.querySelector('#lpAuto'); if(au) au.addEventListener('click', ()=>{ saveListPins(null); PIN_MODE = false; renderListBar(); openListPicker(q); });
  el.querySelectorAll('[data-lp]').forEach(b=> b.addEventListener('click', ()=>{
    const c = b.dataset.lp;
    if(PIN_MODE){ const a = (listPins() || []).slice(), i = a.indexOf(c); if(i >= 0) a.splice(i, 1); else { a.push(c); if(!MY_LISTS.includes(c)) MY_LISTS.push(c); saveLists(); } saveListPins(a); renderListBar(); openListPicker(q); return; }
    if(!MY_LISTS.includes(c)){ MY_LISTS.push(c); }
    el.classList.remove('show'); setActiveList(c);
  }));
  el.classList.add('show');
}
function ensureGenreLists(tags){
  // crea la classifica del genere principale (primo tag) e di ogni genere non-RPG del titolo
  const wanted = [];
  (tags || []).forEach((t, i)=>{ if(TAG_INFO[t] && (i === 0 || EXTRA_GENRE_INFO[t]) && !wanted.includes(t)) wanted.push(t); });
  const added = wanted.filter(t=> !MY_LISTS.includes(t));
  if(added.length){ added.forEach(t=> MY_LISTS.push(t)); saveLists(); renderListBar(); }
  return added;
}
// Conferma grande e ben visibile (al centro dello schermo) quando un titolo viene aggiunto
function showAddedBanner(name, tags, newLists){
  if(window.__bulkAdd) return;                         // «Accetta tutto»: niente banner per ogni titolo, c'è l'elenco finale
  let el = document.getElementById('addedBanner');
  if(!el){ el = document.createElement('div'); el.id = 'addedBanner'; el.className = 'added-banner'; document.body.appendChild(el); }
  const parts = [];
  const gk = GAMES.find(x=> x.name === name); const kd = gk && KIND_BY_ID[gk.kind];
  (tags || []).forEach(t=>{ if(MY_LISTS.includes(t) && TAG_INFO[t]) parts.push(`${TAG_INFO[t].icon} ${TAG_INFO[t].label}` + (newLists.includes(t) ? ' <b>(nuova classifica)</b>' : '')); });
  if(kd) parts.unshift(kd.emoji + ' ' + kd.label);
  const where = parts.length ? parts.join(' · ') : '🌐 Tutti';
  el.innerHTML = `<div class="added-title">✅ Aggiunto alla tua libreria!</div><div class="added-name">${escHtml(name)}</div><div class="added-where">Lo trovi in: ${where}</div>`;
  el.classList.add('show');
  clearTimeout(el._h); el._h = setTimeout(()=> el.classList.remove('show'), 3200);
}
let state = {
  search:'', tiers:new Set(), method:'', decade:'', minScore:'', onlyFavs:false, onlyStory:false,
  tags:new Set(), status:'', sortKey:'id', sortDir:1, view:'list', mood:''
};

function computeStats(){
  const counts = {};
  TIERS_LIST.forEach(t=>counts[t]=0);
  GAMES.forEach(g=>{ if(counts[g.tier]===undefined) counts[g.tier]=0; counts[g.tier]++; });
  return counts;
}

function renderMetrics(){
  const scores = GAMES.map(g=>g.score).sort((a,b)=>a-b);
  const avg = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
  const median = scores[Math.floor(scores.length/2)];
  const years = GAMES.map(g=>g.ysort).filter(Boolean);
  const minY = Math.min(...years), maxY = Math.max(...years);
  const withStory = GAMES.filter(g=> g.story || g.hs).length;
  const playedCount = Object.values(STATUSES).filter(s=>s==='played').length;
  const pct = GAMES.length ? Math.round((playedCount/GAMES.length)*100) : 0;
  const withCover = GAMES.filter(g=>effectiveCover(g)).length;
  const coverPct = GAMES.length ? Math.round((withCover/GAMES.length)*100) : 0;
  const withEnrich = GAMES.filter(g=>g.enrich).length;
  const enrichPct = GAMES.length ? Math.round((withEnrich/GAMES.length)*100) : 0;
  const withLabel = GAMES.filter(g=>g.label).length;
  const labelPct = GAMES.length ? Math.round((withLabel/GAMES.length)*100) : 0;
  document.getElementById('metricsRow').innerHTML = `
    <div class="metric"><b>${GAMES.length}</b>titoli totali</div>
    <div class="metric"><b>${avg}</b>voto medio</div>
    <div class="metric"><b>${median}</b>voto mediano</div>
    <div class="metric"><b>${minY}\u2013${maxY}</b>periodo coperto</div>
    <div class="metric"><b>${withStory}</b>schede narrative</div>
    <div class="metric"><b>${FAVS.size}</b>preferiti</div>
    <div class="metric"><b>${playedCount} (${pct}%)</b>visti da te</div>
    <div class="metric" title="Titoli con una copertina visibile"><b>${withCover}/${GAMES.length} (${coverPct}%)</b>copertine</div>
    <div class="metric" title="Titoli con scheda approfondita (pro/contro, ore, dopamina...)"><b>${withEnrich}/${GAMES.length} (${enrichPct}%)</b>schede complete</div>
    <div class="metric" title="Titoli con l'etichetta (difficoltà, ore, fa per te se...)"><b>${withLabel}/${GAMES.length} (${labelPct}%)</b>etichette</div>
  `;
}

function renderStats(){
  const counts = computeStats();
  const maxCount = Math.max(...Object.values(counts));
  const row = document.getElementById('statsRow');
  row.innerHTML = '';
  const allChip = document.createElement('div');
  allChip.className = 'stat-chip' + (state.tiers.size===0 ? ' active' : '');
  allChip.innerHTML = `<div class="n">${GAMES.length}</div><div class="l">Tutti</div>`;
  allChip.onclick = ()=>{ state.tiers.clear(); renderStats(); render(); };
  row.appendChild(allChip);
  TIERS_LIST.forEach(t=>{
    const c = counts[t]||0;
    const pct = maxCount ? Math.round((c/maxCount)*100) : 0;
    const chip = document.createElement('div');
    chip.className = 'stat-chip' + (state.tiers.has(t) ? ' active' : '');
    chip.innerHTML = `<div class="n">${c}</div><div class="l"><span class="badge ${TIER_LABEL[t]}">${t}</span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
    chip.onclick = ()=>{
      if(state.tiers.has(t)) state.tiers.delete(t); else state.tiers.add(t);
      renderStats(); render();
    };
    row.appendChild(chip);
  });
}

function renderTagChips(){
  const row = document.getElementById('tagChips');
  if(!row) return;
  row.innerHTML = '';
  TAG_ORDER.forEach(code=>{
    const info = TAG_INFO[code];
    if(!info) return;
    const chip = document.createElement('div');
    chip.className = 'tagchip' + (state.tags.has(code) ? ' active' : '');
    chip.textContent = info.icon + ' ' + info.label;
    chip.onclick = ()=>{
      if(state.tags.has(code)) state.tags.delete(code); else state.tags.add(code);
      renderTagChips(); render();
    };
    row.appendChild(chip);
  });
}
function renderMoodChips(){
  const row = document.getElementById('moodChips');
  if(!row) return;
  row.innerHTML = '';
  MOOD_PRESETS.forEach(preset=>{
    const chip = document.createElement('div');
    chip.className = 'tagchip' + (state.mood===preset.key ? ' active' : '');
    chip.textContent = preset.icon + ' ' + preset.label;
    chip.onclick = ()=>{
      state.mood = (state.mood===preset.key) ? '' : preset.key;
      renderMoodChips(); render();
    };
    row.appendChild(chip);
  });
}

function chartHtml(title, rows){
  const max = Math.max(1, ...rows.map(r=>r.count));
  return `<div class="chart-section"><div class="chart-title">${title}</div>` +
    rows.map(r=> `<div class="chart-row"><span class="lbl" title="${r.label}">${r.label}</span><span class="barwrap"><i style="width:${Math.round(r.count/max*100)}%"></i></span><span class="val">${r.count}</span></div>`).join('') +
    `</div>`;
}

function renderStatsPanel(){
  const panel = document.getElementById('statsPanel');
  if(!panel) return;

  const decadeCounts = {"Anni '80":0, "Anni '90":0, "Anni 2000":0, "Anni 2010":0, "Anni 2020":0};
  GAMES.forEach(g=>{
    const y = g.ysort;
    if(!y) return;
    if(y<1990) decadeCounts["Anni '80"]++;
    else if(y<2000) decadeCounts["Anni '90"]++;
    else if(y<2010) decadeCounts["Anni 2000"]++;
    else if(y<2020) decadeCounts["Anni 2010"]++;
    else decadeCounts["Anni 2020"]++;
  });
  const decadeRows = Object.entries(decadeCounts).map(([label,count])=>({label,count}));

  const tierCounts = computeStats();
  const tierRows = TIERS_LIST.map(t=>({label:t, count: tierCounts[t]||0}));

  const platCounts = {};
  GAMES.forEach(g=>{
    g.plat.split('/').map(s=>s.trim()).filter(Boolean).forEach(p=>{
      platCounts[p] = (platCounts[p]||0)+1;
    });
  });
  const platRows = Object.entries(platCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,count])=>({label,count}));

  const statusCounts = {Visto:0, 'In corso':0, 'Da vedere':0, Droppato:0};
  Object.values(STATUSES).forEach(s=>{
    if(s==='played') statusCounts.Visto++;
    else if(s==='playing') statusCounts['In corso']++;
    else if(s==='backlog') statusCounts['Da vedere']++;
    else if(s==='dropped') statusCounts.Droppato++;
  });
  statusCounts['Non tracciato'] = GAMES.length - Object.keys(STATUSES).length;
  const statusRows = Object.entries(statusCounts).map(([label,count])=>({label,count}));

  const tagCounts = {};
  GAMES.forEach(g=> g.tags.forEach(t=>{ tagCounts[t]=(tagCounts[t]||0)+1; }));
  const tagRows = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1])
    .map(([code,count])=>({label:(TAG_INFO[code] ? TAG_INFO[code].icon+' '+TAG_INFO[code].label : code), count}));

  let totalHoursPlayed = 0;
  let gamesPlayedCount = 0;
  GAMES.forEach(g=>{
    const st = STATUSES[g.id];
    if(st==='played') gamesPlayedCount++;
    if((st==='played' || st==='playing') && g.enrich && g.enrich.hoursMain) totalHoursPlayed += g.enrich.hoursMain;
  });
  const completionRows = TIERS_LIST.map(t=>{
    const inTier = GAMES.filter(g=>g.tier===t);
    const played = inTier.filter(g=> STATUSES[g.id]==='played').length;
    return {label:t, count: inTier.length ? Math.round((played/inTier.length)*100) : 0};
  });

  panel.innerHTML =
    `<div class="metrics" style="margin-bottom:16px;"><div class="metric"><b>${Math.round(totalHoursPlayed)}h</b>ore stimate giocate (titoli "visto"/"in corso" con dati di durata)</div><div class="metric"><b>${gamesPlayedCount}</b>titoli con stato "visto"</div></div>` +
    chartHtml('Completamento per tier (% visto)', completionRows) +
    chartHtml('Distribuzione per tier', tierRows) +
    chartHtml('Distribuzione per decade', decadeRows) +
    chartHtml('Piattaforme pi\u00F9 rappresentate', platRows) +
    chartHtml('Il tuo stato di gioco', statusRows) +
    chartHtml('Generi pi\u00F9 comuni', tagRows);
}

// ---- Ricerca intelligente: ignora accenti, spazi e simboli ("persona5" = "Persona 5") e tollera piccoli errori di battitura ----
let lastSearchFuzzy = false;
const searchNorm = s=> String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const searchCompact = s=> searchNorm(s).replace(/[^a-z0-9]+/g,'');
function searchCompactMatch(g, q){ const c = searchCompact(q); return c.length >= 3 && searchCompact(g.name).includes(c); }
function editDistanceWithin(a, b, max){
  if(Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({length: b.length + 1}, (_, i)=> i);
  for(let i = 1; i <= a.length; i++){
    const cur = [i]; let rowMin = i;
    for(let j = 1; j <= b.length; j++){ cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1)); rowMin = Math.min(rowMin, cur[j]); }
    if(rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}
function searchFuzzyMatch(g, q){
  const qt = searchNorm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if(!qt.length) return false;
  const words = searchNorm(g.name).split(/[^a-z0-9]+/).filter(Boolean);
  return qt.every(t=> words.some(w=> w.startsWith(t) || (t.length >= 4 && (editDistanceWithin(t, w, t.length >= 7 ? 2 : 1) || (w.length > t.length && editDistanceWithin(t, w.slice(0, t.length), 1))))));
}
function applyFilters(){
  try{ faUpdate(); }catch(e){}
  let list = GAMES.filter(inActiveList);
  if(state.tiers.size>0) list = list.filter(g=> state.tiers.has(state.view==='mytier' ? effectiveTier(g) : g.tier));
  if(state.method) list = list.filter(g=> state.method === 'V' || state.method === 'S' ? g.m === state.method : srcKind(g) === state.method);
  if(state.decade){
    const d = parseInt(state.decade,10);
    list = list.filter(g=> g.ysort>=d && g.ysort < d+10);
  }
  if(state.minScore){
    const ms = parseInt(state.minScore,10);
    list = list.filter(g=> g.score >= ms);
  }
  if(state.onlyFavs) list = list.filter(g=> FAVS.has(g.id));
  if(state.onlyStory) list = list.filter(g=> !!(g.story || g.hs));
  if(state.tags.size>0) list = list.filter(g=> g.tags.some(t=> state.tags.has(t)));
  if(state.mood){
    const moodPreset = MOOD_PRESETS.find(m=>m.key===state.mood);
    if(moodPreset) list = list.filter(moodPreset.test);
  }
  if(state.status){
    if(state.status==='none') list = list.filter(g=> !STATUSES[g.id]);
    else list = list.filter(g=> STATUSES[g.id]===state.status);
  }
  if(state.search.trim()!==''){
    const q = state.search.trim().toLowerCase();
    const exact = list.filter(g=> g.name.toLowerCase().includes(q) || g.plat.toLowerCase().includes(q) || g.year.includes(q) || searchCompactMatch(g, q));
    // nessun risultato esatto: ricerca tollerante agli errori di battitura ("xenoblad", "persna", "final fantsy")
    list = exact.length ? exact : list.filter(g=> searchFuzzyMatch(g, q));
    lastSearchFuzzy = !exact.length && list.length > 0;
  } else lastSearchFuzzy = false;
  const dnaProfileForSort = state.sortKey==='dna' ? buildTasteProfile() : null;
  // v233: «Nel cuore» (procione con gli occhi a cuore) prima di tutto, poi i preferiti, poi gli altri (a parità: ordine della classifica)
  const heartSort = state.sortKey==='heart' ? (()=>{ try{ const t = window.rtLSro ? rtLSro('atl_top', []) : JSON.parse(localStorage.getItem('atl_top') || '[]'); return new Set(Array.isArray(t) ? t : []); }catch(e){ return new Set(); } })() : null;
  list = list.slice().sort((a,b)=>{
    if(EXTRA_SORT[state.sortKey]){ const f = EXTRA_SORT[state.sortKey], d = (f(a) - f(b)) * state.sortDir; return d || (a.id - b.id); }
    if(heartSort){ const ha = (heartSort.has(a.id) ? 2 : 0) + (FAVS.has(a.id) ? 1 : 0), hb = (heartSort.has(b.id) ? 2 : 0) + (FAVS.has(b.id) ? 1 : 0); if(ha !== hb) return (ha - hb) * state.sortDir; return (a.id - b.id); }
    let va=a[state.sortKey], vb=b[state.sortKey];
    if(state.sortKey==='tier'){ va=TIER_ORDER[a.tier]; vb=TIER_ORDER[b.tier]; }
    if(state.sortKey==='fav'){ va = FAVS.has(a.id)?1:0; vb = FAVS.has(b.id)?1:0; }
    if(state.sortKey==='dna'){
      const da = dnaForGame(a, dnaProfileForSort), db = dnaForGame(b, dnaProfileForSort);
      va = da ? da.pct : -1; vb = db ? db.pct : -1;
    }
    if(typeof va === 'string') return va.localeCompare(vb) * state.sortDir;
    return (va-vb) * state.sortDir;
  });
  return list;
}

function methodIcon(m, g){ const f = g && typeof freshInfo === 'function' ? freshInfo(g) : null; if(m==='V'){ return f ? '<span class="vplus" title="Voto verificato e titolo aggiornato con Update+">V+</span>' : '✅'; } return f ? '<span class="vplus s" title="Titolo aggiornato con Update+, ma il voto è ancora una stima: nessuna fonte affidabile (Metacritic) lo ha confermato. Diventa V+ appena una fonte lo conferma.">🗳️+</span>' : '🗳️'; }   // V+ dorata = voto verificato + Update+   // V dorata = voto verificato + Update+
// fonte del voto: logo piccolo nella lista (AniList, IMDb, MyAnimeList, TMDB, Kitsu; STIMA = non verificato)
function srcKind(g){
  if(g.m !== 'V') return 'stima';
  const v = String(g.vs || '');
  return /^IMDb/.test(v) ? 'imdb' : /^MyAnimeList|^MAL/.test(v) ? 'mal' : /^TMDB/.test(v) ? 'tmdb' : /^Kitsu/.test(v) ? 'kitsu' : 'al';
}
const SRC_NAME = {al: 'AniList', imdb: 'IMDb', mal: 'MyAnimeList', tmdb: 'TMDB', kitsu: 'Kitsu', stima: 'Stima (nessun voto verificato)'};
function srcIcon(g){
  const k = srcKind(g);
  return `<img class="srcico" src="icons/fonti/${k}.${k === 'stima' ? 'png' : 'svg'}" width="24" height="24" alt="${SRC_NAME[k]}" title="${SRC_NAME[k]}${g.vs && k !== 'stima' ? ' · ' + escHtml(g.vs) : ''}" loading="lazy">`;
}
function methodLabel(m){ return m==='V' ? 'Voto medio degli utenti (AniList per anime e manga, IMDb per i film): verificato' : 'Stima (titolo aggiunto senza un voto verificato)'; }

function showToast(msg, ms, onTap){
  // v215: gli avvisi IMPORTANTI (con un'azione o lunghi) diventano notifiche che restano finché le tocchi, e finiscono nella 🔔 (avvisi.js)
  if(typeof onTap === 'function' || (+ms || 0) >= 7000){
    if(typeof window.rtNotify === 'function'){ window.rtNotify(msg, onTap); return; }
    (window.__rtNotifQ = window.__rtNotifQ || []).push([msg, onTap]); return;
  }
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  t._tap = typeof onTap === 'function' ? onTap : null; t.classList.toggle('tappable', !!t._tap);          // palloncino con azione: toccandolo si apre la cosa di cui parla
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), ms || 1800);
}

const ROW_PAGE = 80;
let renderToken = 0, rowObserver = null, lastViewKey = '', lastShownRows = 0;
function render(){
  const list = applyFilters();
  const tbody = document.getElementById('tbody');
  const emptyMsg = document.getElementById('emptyMsg');
  document.getElementById('countLine').textContent = `${list.length} risultati su ${GAMES.filter(inActiveList).length}` + (lastSearchFuzzy ? ' · 🔎 nessun nome esatto: mostro i più simili' : '');
  document.getElementById('favCountLine').textContent = FAVS.size ? `★ ${FAVS.size} preferiti` : '';

  const myRender = ++renderToken;
  if(rowObserver){ rowObserver.disconnect(); rowObserver = null; }
  if(list.length===0){ tbody.innerHTML=''; emptyMsg.style.display='block'; return; }
  emptyMsg.style.display='none';

  const dnaProfileForRow = state.sortKey==='dna' ? buildTasteProfile() : null;
  // v219: l'elenco dei «top» si legge UNA volta per ridisegno (prima: una volta per ogni riga, centinaia di volte)
  const topIds = (()=>{ try{ const t = window.rtLSro ? rtLSro('atl_top', []) : JSON.parse(localStorage.getItem('atl_top') || '[]'); return Array.isArray(t) ? t : []; }catch(e){ return []; } })();
  const topSet = new Set(topIds);
  try{ const tb = document.getElementById('gameTable'); if(tb && tb.classList.contains('has-top') !== !!topIds.length) tb.classList.toggle('has-top', !!topIds.length); }catch(e){}
  function buildRow(g){
    const tr = document.createElement('tr');
    tr.dataset.gid = g.id;
    const isFav = FAVS.has(g.id);
    // v212: i tuoi top in assoluto (👑 «Nei miei top») hanno lo stemma del procione con gli occhi a cuore (disegnato da Mario) a sinistra della stella e la riga bordata d'oro
    const isTop = topSet.has(g.id);
    if(isTop) tr.className = 'is-top';
    const topBadge = isTop ? '<img class="row-badge" src="icons/top-procione.svg" alt="Titolo che amo" title="Titolo che amo" width="24" height="24" decoding="async">' : '';
    const heartBadge = '';
    const dnaBadge = (()=>{ if(!dnaProfileForRow) return ''; const d = dnaForGame(g, dnaProfileForRow); return d ? `<span class="dna-chip${d.approved ? ' appr' : ''}" style="color:${dnaColor(d.pct)}; border-color:${dnaColor(d.pct)};"${d.approved ? ' title="Approvato dal procione: sintonia altissima con i tuoi gusti"' : ''}>${d.approved ? '<img src="icons/approved.webp" alt="" width="16" height="17">' : ''}${d.pct}%</span>` : ''; })();
    tr.innerHTML = `
      <td class="fav" data-role="fav">${topBadge}<svg class="gi ${isFav ? '' : 'fav-off'}" viewBox="0 0 32 32" aria-label="${isFav ? 'Preferito' : 'Non preferito'}"><use href="#g-${isFav ? 'favon' : 'favoff'}"/></svg></td>
      <td class="rank mobhide">${g.id}</td>
      <td>${miniIcons(g)}${g.name}${heartBadge}${dnaBadge}</td>
      <td class="plat mobhide">${g.plat}</td>
      <td class="year">${g.year || g.ysort || ''}</td>
      <td><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span></td>
      <td class="score">${scoreTxt(g)}</td>
      <td class="method" title="${methodLabel(g.m)}${g.m==='V' && freshInfo(g) && !freshInfo(g).m ? ' · aggiornato con Update+' : ''}">${srcIcon(g)}</td>
      <td class="storyicon">${itBadge(g)}</td>
    `;
    { const rb = tr.querySelector('.row-badge'); if(rb) rb.addEventListener('click', ev=>{ ev.stopPropagation(); try{ showToast('😍 È un titolo che ami (lo togli dalla scheda: «Titolo che amo»)', 2600); }catch(x){} }); }
    tr.querySelector('[data-role="fav"]').addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(FAVS.has(g.id)){ FAVS.delete(g.id); showToast('Rimosso dai preferiti'); }
      else { FAVS.add(g.id); showToast('Aggiunto ai preferiti'); }
      saveFavs(); renderMetrics(); render();
    });
    // toccando un simbolo (💕🤝✨💉) si legge PERCHÉ il titolo ce l'ha; il resto della riga apre la scheda
    tr.addEventListener('click', ev=>{ const mi = ev.target.closest && ev.target.closest('.mini-icon'); if(mi && mi.dataset.why){ ev.stopPropagation(); showToast(mi.dataset.why, 5200); return; } openModal(g); });
    return tr;
  }
  window.__rtBuildRow = buildRow;         // usata per aggiornare una sola riga senza ridisegnare la lista
  // v219: con la griglia (copertine) o l'elenco compatto la tabella è nascosta: non la costruisco (80 righe inutili a ogni ridisegno, ~150 ms sul telefono).
  // Quando torni alla tabella si ridisegna da sola (setMode in extras.js).
  try{ if(window.rtAltMode && window.rtAltMode()){ tbody.innerHTML = ''; lastViewKey = ''; lastShownRows = 0; updateArrows(); return; } }catch(e){}
  // Righe a blocchi: ne disegniamo ROW_PAGE subito e le altre solo quando ci si avvicina in fondo alla lista (molto più leggero sul telefono)
  // se cambia solo un dato di una riga (preferito, stato...) manteniamo le righe già scese, così la posizione nella lista non salta
  const viewKey = JSON.stringify([state.search, [...state.tiers], state.method, state.decade, state.minScore, state.onlyFavs, state.onlyStory, [...state.tags], state.status, state.sortKey, state.sortDir, state.mood, typeof ACTIVE_LIST !== 'undefined' ? ACTIVE_LIST : '']);
  const keepRows = viewKey === lastViewKey ? lastShownRows : 0;
  tbody.innerHTML='';
  let shown = 0;
  function addChunk(){
    if(myRender !== renderToken) return;
    const frag = document.createDocumentFragment();
    const end = Math.min(list.length, Math.max(shown + ROW_PAGE, keepRows));
    for(; shown < end; shown++) frag.appendChild(buildRow(list[shown]));
    tbody.appendChild(frag);
    lastViewKey = viewKey; lastShownRows = shown;
    if(shown < list.length && 'IntersectionObserver' in window){
      rowObserver = new IntersectionObserver(es=>{ if(es.some(e=> e.isIntersecting)){ rowObserver.disconnect(); rowObserver = null; addChunk(); } }, {rootMargin:'800px 0px'});
      rowObserver.observe(tbody.lastElementChild);
    } else if(shown < list.length){ addChunk(); }
  }
  addChunk();
  updateArrows();
}

// v234: ordinamenti in più (menu della ★ in tabella e riga «Ordina»): storia romantica, legame, sorprendente, dopamina, stato
const ST_ORDER = {playing: 4, played: 3, backlog: 2, dropped: 1};
const EXTRA_SORT = {
  st_romance: g=> g.enrich && g.enrich.storyTag === 'romance' ? 1 : 0,
  st_affinity: g=> g.enrich && g.enrich.storyTag === 'affinity' ? 1 : 0,
  st_wow: g=> g.enrich && g.enrich.storyTag === 'wow' ? 1 : 0,
  dopa: g=> g.enrich && g.enrich.dopamine ? 1 : 0,
  status: g=> ST_ORDER[STATUSES[g.id]] || 0
};
const SORT_MENU = [['heart', '😍', 'Titoli che amo'], ['fav', '⭐', 'Preferiti'], ['st_romance', '💕', 'Storia romantica'], ['st_affinity', '🤝', 'Legame speciale'], ['st_wow', '🤯', 'Storia sorprendente'], ['dopa', '💉', 'Effetto dopamina'], ['status', '✅', 'Stato (in corso, visto…)'], ['id', '🏆', 'Classifica normale']];
function openSortMenu(anchor){
  let m = document.getElementById('sortMenu');
  if(m){ m.remove(); return; }
  m = document.createElement('div'); m.id = 'sortMenu'; m.className = 'sort-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = '<div class="sm-h">Metti in cima</div>' + SORT_MENU.map(([k, ic, n])=> `<button type="button" role="menuitem" class="sm-i${state.sortKey === k ? ' on' : ''}" data-sm="${k}"><span>${ic}</span>${n}${state.sortKey === k && k !== 'id' ? '<small>' + (state.sortDir === -1 ? 'in cima' : 'in fondo') + ' · tocca per invertire</small>' : ''}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.left)) + 'px'; m.style.top = (r.bottom + 6) + 'px';
  const close = ev=>{ if(ev && m.contains(ev.target)) return; m.remove(); document.removeEventListener('pointerdown', close, true); window.removeEventListener('scroll', close, true); };
  setTimeout(()=>{ document.addEventListener('pointerdown', close, true); window.addEventListener('scroll', close, true); }, 0);
  m.addEventListener('click', ev=>{ const b = ev.target.closest('[data-sm]'); if(!b) return; const k = b.dataset.sm;
    if(state.sortKey === k && k !== 'id') state.sortDir *= -1; else { state.sortKey = k; state.sortDir = k === 'id' ? 1 : -1; }
    try{ localStorage.setItem('atl_alt_sort', JSON.stringify({k: state.sortKey, d: state.sortDir})); }catch(e){}
    close(); render(); });
}
function updateArrows(){
  document.querySelectorAll('thead th').forEach(th=>{
    const arrow = th.querySelector('.arrow');
    if(!arrow) return;
    // per il Tier la direzione 1 = dal migliore (S+) al peggiore, cioè valori decrescenti → ▼
    const desc = th.dataset.key==='tier' ? state.sortDir===1 : state.sortDir===-1;
    const mine = th.dataset.key===state.sortKey || (th.dataset.key==='fav' && (state.sortKey==='heart' || EXTRA_SORT[state.sortKey]));
    arrow.textContent = mine ? (desc ? '▼' : '▲') : '';
  });
}

document.querySelectorAll('thead th[data-key]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.key;
    if(key==='fav'){ openSortMenu(th); return; }      // v234: la ★ apre il menu «Metti in cima»
    if(state.sortKey===key){ state.sortDir *= -1; }
    else { state.sortKey = key; state.sortDir = (key==='score'||key==='ysort') ? -1 : 1; }
    render();
  });
});

// Debounce: sulla ricerca digitando velocemente non ricostruiamo la lista ad OGNI tasto premuto
// (con centinaia di titoli, e destinati a crescere, tenerla reattiva anche su telefoni più lenti).
let searchDebounceTimer = null;
document.getElementById('search').addEventListener('input', (e)=>{
  state.search = e.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(render, 150);
});
document.getElementById('methodFilter').addEventListener('change', (e)=>{ state.method = e.target.value; render(); });
document.getElementById('decadeFilter').addEventListener('change', (e)=>{ state.decade = e.target.value; render(); });
document.getElementById('scoreFilter').addEventListener('change', (e)=>{ state.minScore = e.target.value; render(); });
document.getElementById('storyFilter').addEventListener('change', (e)=>{ state.onlyStory = e.target.value==='yes'; render(); });
document.getElementById('statusFilter').addEventListener('change', (e)=>{ state.status = e.target.value; render(); });
document.getElementById('favBtn').addEventListener('click', (e)=>{
  state.onlyFavs = !state.onlyFavs;
  e.target.classList.toggle('active', state.onlyFavs);
  render();
});
document.getElementById('resetBtn').addEventListener('click', ()=>{
  state = {search:'', tiers:new Set(), method:'', decade:'', minScore:'', onlyFavs:false, onlyStory:false, tags:new Set(), status:'', sortKey:'id', sortDir:1, mood:''};
  document.getElementById('search').value='';
  document.getElementById('methodFilter').value='';
  document.getElementById('decadeFilter').value='';
  document.getElementById('scoreFilter').value='';
  document.getElementById('storyFilter').value='';
  document.getElementById('statusFilter').value='';
  document.getElementById('favBtn').classList.remove('active');
  renderStats(); renderTagChips(); renderMoodChips(); render();
});
document.getElementById('randomBtn').addEventListener('click', ()=>{
  const list = applyFilters();
  const pool = list.length ? list : GAMES;
  const pick = pool[Math.floor(Math.random()*pool.length)];
  openModal(pick);
});
document.getElementById('dnaSortBtn').addEventListener('click', ()=>{
  const profile = buildTasteProfile();
  if(profile.n < 2){ showToast('Segna qualche preferito o titolo visto prima: mi serve per capire i tuoi gusti'); return; }
  state.sortKey = 'dna'; state.sortDir = -1;
  render();
  showToast('Ordinato per affinità con i tuoi gusti');
});
document.getElementById('scrollTopBtn').addEventListener('click', ()=>{
  window.scrollTo({top:0, behavior:'smooth'});
  const tw = document.getElementById('tableWrap');
  if(tw) tw.scrollTo({top:0, behavior:'smooth'});
  const mtw = document.getElementById('myTierWrap');
  if(mtw) mtw.scrollTo({top:0, behavior:'smooth'});
  const sp = document.getElementById('statsPanel');
  if(sp) sp.scrollTo({top:0, behavior:'smooth'});
  const sg = document.getElementById('sagaPanel');
  if(sg) sg.scrollTo({top:0, behavior:'smooth'});
  const nv = document.getElementById('novitaPanel');
  if(nv) nv.scrollTo({top:0, behavior:'smooth'});
  const nvg = document.getElementById('novitaGenrePanel');
  if(nvg) nvg.scrollTo({top:0, behavior:'smooth'});
});

// Theme toggle
const root = document.documentElement;
let themeState = 'auto';
document.getElementById('themeBtn').addEventListener('click', ()=>{
  if(themeState==='auto'){ themeState='light'; root.setAttribute('data-theme','light'); }
  else if(themeState==='light'){ themeState='dark'; root.setAttribute('data-theme','dark'); }
  else { themeState='auto'; root.removeAttribute('data-theme'); }
});

// View tabs
function setView(v){
  state.view = v; document.body.dataset.view = v;
  document.querySelectorAll('.view-tab').forEach(t=> t.classList.toggle('active', t.dataset.view===v));
  document.getElementById('tableWrap').style.display = (v==='list') ? '' : 'none';
  document.getElementById('emptyMsg').style.display = 'none';
  document.getElementById('myTierWrap').style.display = (v==='mytier') ? '' : 'none';
  document.getElementById('statsPanel').style.display = (v==='stats') ? '' : 'none';
  document.getElementById('sagaPanel').style.display = (v==='saga') ? '' : 'none';
  document.getElementById('discoverPanel').style.display = (v==='discover') ? '' : 'none';
  document.getElementById('novitaPanel').style.display = (v==='novita') ? '' : 'none';
  document.getElementById('novitaGenrePanel').style.display = (v==='novitagenere') ? '' : 'none';
  if(v==='list') render();
  else if(v==='mytier') renderMyTier();
  else if(v==='stats') renderStatsPanel();
  else if(v==='saga') renderSagaView();
  else if(v==='discover') renderDiscoverView();
  else if(v==='novita') renderNovitaView();
  else if(v==='novitagenere') renderNovitaGenreView();
}
document.querySelectorAll('.view-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{ if(tab.dataset.view) setView(tab.dataset.view); else if(tab.dataset.ask && typeof openAsk === 'function') openAsk(); });
});

// ---- "La mia Tier List" (drag & drop personal editor) ----
let tierPickerEl = null;
function closeTierPicker(){ if(tierPickerEl){ tierPickerEl.remove(); tierPickerEl=null; } }
document.addEventListener('click', (e)=>{ if(tierPickerEl && !tierPickerEl.contains(e.target) && !e.target.closest('.movebtn')) closeTierPicker(); });

function openTierPicker(btn, gid){
  closeTierPicker();
  const rect = btn.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'tierpicker';
  pop.style.top = (rect.bottom + 4) + 'px';
  pop.style.left = Math.max(4, Math.min(window.innerWidth-190, rect.left)) + 'px';
  TIERS_LIST.forEach(t=>{
    const b = document.createElement('button');
    b.textContent = t;
    b.addEventListener('click', (ev)=>{ ev.stopPropagation(); moveToTier(gid, t); closeTierPicker(); });
    pop.appendChild(b);
  });
  document.body.appendChild(pop);
  tierPickerEl = pop;
}

// icona a tema videogioco da usare dentro testi e pulsanti
function giIcon(n){ return `<svg class="gi gi-s" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-${n}"/></svg>`; }
function itBadge(g){
  const it = g.label && g.label.it;
  const M = {D: ['d', 'ITA', 'Testi e doppiaggio in italiano'], S: ['s', 'sub', 'Testi/sottotitoli in italiano'], F: ['f', 'fan', 'Solo traduzione dei fan'], N: ['n', 'no', 'Nessun italiano ufficiale']};
  return M[it] ? `<span class="itb itb-${M[it][0]}" title="${M[it][2]}">${M[it][1]}</span>` : '<span class="itb itb-x" title="Lingua non ancora verificata">?</span>';
}
let mtQuery = '';
const mtNorm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// trascinamento con il dito: tieni premuto ~0,35 s su un titolo, poi trascinalo su un altro tier
function mtEnableTouchDrag(chip, gid){
  let timer = 0, active = false, ghost = null, sx = 0, sy = 0, lastZone = null;
  const cleanup = ()=>{ clearTimeout(timer); if(ghost){ ghost.remove(); ghost = null; } if(lastZone) lastZone.classList.remove('dragover'); lastZone = null; chip.classList.remove('mt-dragging'); document.body.classList.remove('mt-noscroll'); active = false; };
  chip.addEventListener('touchstart', e=>{
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    if(e.target.closest('.movebtn')) return;
    timer = setTimeout(()=>{
      active = true; try{ navigator.vibrate && navigator.vibrate(15); }catch(x){}
      chip.classList.add('mt-dragging'); document.body.classList.add('mt-noscroll');
      ghost = chip.cloneNode(true); ghost.className = 'mytier-chip mt-ghost'; ghost.style.width = chip.offsetWidth + 'px'; document.body.appendChild(ghost);
      ghost.style.left = (sx - 30) + 'px'; ghost.style.top = (sy - 22) + 'px';
    }, 350);
  }, {passive:true});
  chip.addEventListener('touchmove', e=>{
    const t = e.touches[0];
    if(!active){ if(Math.abs(t.clientX - sx) > 8 || Math.abs(t.clientY - sy) > 8) clearTimeout(timer); return; }
    e.preventDefault();
    ghost.style.left = (t.clientX - 30) + 'px'; ghost.style.top = (t.clientY - 22) + 'px';
    // scorrimento automatico vicino ai bordi
    if(t.clientY < 110) window.scrollBy(0, -12); else if(t.clientY > innerHeight - 120) window.scrollBy(0, 12);
    ghost.style.visibility = 'hidden'; const el = document.elementFromPoint(t.clientX, t.clientY); ghost.style.visibility = '';
    const z = el && el.closest('.mytier-dropzone');
    if(z !== lastZone){ if(lastZone) lastZone.classList.remove('dragover'); if(z) z.classList.add('dragover'); lastZone = z; }
  }, {passive:false});
  chip.addEventListener('touchend', ()=>{ if(active && lastZone){ const tier = lastZone.dataset.tier; cleanup(); moveToTier(gid, tier); } else cleanup(); });
  chip.addEventListener('touchcancel', cleanup);
}
// ---- La mia tier list: «Solo i miei titoli» (predefinita) oppure «Tutti» (parte dalla classifica ufficiale) ----
const MT_TIERS = ['S+','S','A','B','C','D','E','F'];
let mtMode = 'mine'; try{ mtMode = localStorage.getItem('atl_mt_mode') === 'all' ? 'all' : 'mine'; }catch(e){}
function openTierSheet(g){
  const U = window.XUI; if(!U || !U.sheet){ openTierPicker(document.body, g.id); return; }
  const cur = MYTIER[g.id], off = g.tier;
  const body = U.sheet('xTierSheet', 'In che tier lo metti?', `<div class="mt-sheet-name"><b>${escHtml(g.name)}</b><small>${g.year ? escHtml(g.year) + ' · ' : ''}${scoreTxt(g)}${off && off !== 'ND' ? ' · classifica ufficiale: ' + off : ''}</small></div>
    <div class="mt-sheet-grid">${MT_TIERS.map(t=> `<button type="button" class="mt-sheet-t${cur === t ? ' cur' : ''}" data-t="${t}"><span class="badge big ${TIER_LABEL[t]}">${t}</span></button>`).join('')}</div>
    <div class="lp-tools">${cur ? '<button type="button" class="btn" data-rm="1">Togli dalla mia tier list</button>' : ''}<button type="button" class="btn" data-open="1">Apri la scheda</button></div>`);
  const close = ()=>{ const el = document.getElementById('xTierSheet'); if(el) el.classList.remove('show'); };
  body.querySelectorAll('[data-t]').forEach(b=> b.addEventListener('click', ()=>{ close(); moveToTier(g.id, b.dataset.t); try{ window.rtHaptic && rtHaptic('success'); }catch(e){} }));
  const rm = body.querySelector('[data-rm]'); if(rm) rm.addEventListener('click', ()=>{ close(); removeFromMyTier(g.id); });
  body.querySelector('[data-open]').addEventListener('click', ()=>{ close(); openModal(g); });
}
function mtChip(g, opts){
  opts = opts || {};
  const chip = document.createElement('div');
  chip.className = 'mytier-chip' + (opts.tray ? ' mt-tray-chip' : '');
  chip.draggable = !opts.tray;
  const t = MYTIER[g.id];
  chip.innerHTML = `<span class="nm" title="${escHtml(g.name)}">${escHtml(g.name)}</span><span class="sc">${scoreTxt(g)}</span><button class="mt-tb${t ? '' : ' mt-tb-new'}" aria-label="Scegli il tier">${t ? `<span class="badge ${TIER_LABEL[t]}">${t}</span>` : 'Scegli tier'} ▾</button>`;
  chip.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', String(g.id)); });
  chip.querySelector('.nm').addEventListener('click', ()=> openModal(g));
  chip.querySelector('.mt-tb').addEventListener('click', e=>{ e.stopPropagation(); openTierSheet(g); });
  if(!opts.tray) mtEnableTouchDrag(chip, g.id);
  return chip;
}
function renderMyTier(){
  const q = mtNorm(mtQuery), mine = mtMode === 'mine';
  document.querySelectorAll('#mtModes .mt-mode').forEach(b=> b.classList.toggle('active', b.dataset.mtm === mtMode));
  document.body.dataset.mtmode = mtMode;
  const how = document.getElementById('mtHow'); if(how && !how.dataset.touched){ how.open = !GAMES.some(g=> MYTIER[g.id]); }
  const tray = document.getElementById('mtTray'); if(tray) tray.innerHTML = '';
  const grouped = {}; MT_TIERS.concat(['ND']).forEach(t=> grouped[t] = []);
  // elenco di partenza: solo i miei (fuori dai filtri della home) oppure tutti i titoli filtrati come nella classifica
  let base = mine ? GAMES.filter(g=> MYTIER[g.id]) : applyFilters();
  const rankedCount = GAMES.reduce((n, g)=> n + (MYTIER[g.id] ? 1 : 0), 0);
  let results = null;
  if(mine && q){ results = GAMES.filter(g=> mtNorm(g.name).includes(q)).sort((a, b)=> b.score - a.score).slice(0, 40); base = base.filter(g=> mtNorm(g.name).includes(q)); }
  else if(q) base = base.filter(g=> mtNorm(g.name).includes(q));
  base.forEach(g=>{ const t = effectiveTier(g); (grouped[t] = grouped[t] || []).push(g); });
  if(mine && tray){
    if(results){
      tray.innerHTML = `<div class="mt-tray-head"><b>Risultati per «${escHtml(mtQuery)}»</b><small>tocca «Scegli tier» per metterlo nella tua tier list</small></div><div class="mt-tray-list"></div>`;
      const host = tray.querySelector('.mt-tray-list'); results.forEach(g=> host.appendChild(mtChip(g, {tray: true})));
      if(!results.length) host.innerHTML = '<div class="lp-sub">Nessun titolo con questo nome.</div>';
    } else {
      const sug = GAMES.filter(g=> !MYTIER[g.id] && (FAVS.has(g.id) || STATUSES[g.id] === 'played' || STATUSES[g.id] === 'playing')).sort((a, b)=> b.score - a.score);
      if(sug.length){
        tray.innerHTML = `<div class="mt-tray-head"><b>Da classificare (${sug.length})</b><small>titoli che hai già visto o messo tra i preferiti: scegli il tier di ognuno</small></div><div class="mt-tray-list"></div>`;
        const host = tray.querySelector('.mt-tray-list'); sug.slice(0, 40).forEach(g=> host.appendChild(mtChip(g, {tray: true})));
      } else if(!rankedCount){
        tray.innerHTML = `<div class="mt-empty-card"><b>La tua tier list è vuota</b><p>Cerca un titolo nella casella qui sotto e scegli il suo tier. Se segni qualche titolo come «Visto» o tra i preferiti, comparirà qui da classificare.</p></div>`;
      }
    }
  }
  const wrap = document.getElementById('myTierSections');
  wrap.innerHTML = '';
  const jump = document.getElementById('mtJump'); if(jump) jump.innerHTML = '';
  let total = 0;
  (mine ? MT_TIERS : TIERS_LIST).forEach(t=>{
    const games = grouped[t] || []; total += games.length;
    if((q || mine) && !games.length) return;                          // niente blocchi vuoti: solo i tier che contengono qualcosa
    if(jump) jump.insertAdjacentHTML('beforeend', `<button type="button" class="mt-jbtn" data-jt="${t}"><span class="badge ${TIER_LABEL[t]}">${t}</span> ${games.length}</button>`);
    const section = document.createElement('div');
    section.className = 'mytier-section' + (games.length ? '' : ' mt-empty');
    section.id = 'mt-sec-' + String(t).replace('+', 'plus');
    section.innerHTML = `<div class="mytier-section-head"><span class="badge big ${TIER_LABEL[t]}">${t}</span><span class="count">${games.length} titoli</span></div>`;
    const dz = document.createElement('div');
    dz.className = 'mytier-dropzone';
    dz.dataset.tier = t;
    games.sort((a, b)=> b.score - a.score).forEach(g=> dz.appendChild(mtChip(g)));
    dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', ()=> dz.classList.remove('dragover'));
    dz.addEventListener('drop', e=>{
      e.preventDefault(); dz.classList.remove('dragover');
      const id = e.dataTransfer.getData('text/plain');
      if(id) moveToTier(id, t);
    });
    section.appendChild(dz);
    wrap.appendChild(section);
  });
  if(mine && !rankedCount && !q) wrap.innerHTML = '';
  else if(q && !total && !results) wrap.innerHTML = window.rtEmpty ? window.rtEmpty('search') : '<div class="empty" style="padding:24px;text-align:center;">Nessun titolo trovato con questo nome.</div>';
}
{ const how = document.getElementById('mtHow'); if(how) how.addEventListener('toggle', e=>{ if(e.isTrusted !== false) how.dataset.touched = '1'; }); }
document.getElementById('mtModes').addEventListener('click', e=>{ const b = e.target.closest('[data-mtm]'); if(!b) return; mtMode = b.dataset.mtm; try{ localStorage.setItem('atl_mt_mode', mtMode); }catch(x){} renderMyTier(); });
(function(){
  const inp = document.getElementById('mtSearch'), clr = document.getElementById('mtClear'), jump = document.getElementById('mtJump');
  if(!inp) return;
  let h = 0;
  inp.addEventListener('input', ()=>{ clearTimeout(h); h = setTimeout(()=>{ mtQuery = inp.value; clr.hidden = !inp.value; renderMyTier(); }, 120); });
  clr.addEventListener('click', ()=>{ inp.value = ''; mtQuery = ''; clr.hidden = true; renderMyTier(); inp.focus(); });
  jump.addEventListener('click', e=>{ const b = e.target.closest('[data-jt]'); if(!b) return; const el = document.getElementById('mt-sec-' + String(b.dataset.jt).replace('+', 'plus')); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); });
})();
document.getElementById('resetMyTierBtn').addEventListener('click', ()=>{
  if(!Object.keys(MYTIER).length){ showToast('La tua tier list è già vuota'); return; }
  if(!window.confirm('Ricomincio da zero? La tua tier list personale (' + Object.keys(MYTIER).length + ' titoli) verrà svuotata. I preferiti e gli stati restano.')) return;
  MYTIER = {}; saveMyTier(); renderMyTier();
  showToast('La tua tier list è stata svuotata');
});

// Collapsible filters panel
const filtersPanel = document.getElementById('filtersPanel');
const filtersBtn = document.getElementById('filtersBtn');
let filtersOpen = false;
try{ filtersOpen = localStorage.getItem('atl_filters_open') === '1'; }catch(e){}
function applyFiltersPanelState(){
  filtersPanel.classList.toggle('open', filtersOpen);
  filtersBtn.classList.toggle('active', filtersOpen);
}
filtersBtn.addEventListener('click', ()=>{
  filtersOpen = !filtersOpen;
  try{ localStorage.setItem('atl_filters_open', filtersOpen ? '1':'0'); }catch(e){}
  applyFiltersPanelState();
});
applyFiltersPanelState();
// «Altri filtri»: un solo riquadro che raccoglie fonti, epoche, voto, scheda, stato, generi, preferiti… La riga dice cosa è attivo anche da chiuso.
function faUpdate(){
  const el = document.getElementById('faActive'), box = document.getElementById('filtersAdv'); if(!el || !box) return;
  const parts = [], sel = id=>{ const e = document.getElementById(id); return e && e.value && e.selectedIndex >= 0 ? e.options[e.selectedIndex].text.trim() : ''; };
  ['methodFilter', 'decadeFilter', 'scoreFilter', 'storyFilter', 'statusFilter'].forEach(id=>{ const t = sel(id); if(t) parts.push(t); });
  if(state.tags && state.tags.size) parts.push(state.tags.size + (state.tags.size === 1 ? ' genere' : ' generi'));
  if(state.mood) parts.push('umore');
  if(state.onlyFavs) parts.push('★ preferiti');
  const dn = document.getElementById('dnaSortBtn'); if(dn && dn.classList.contains('active')) parts.push('più adatti a te');
  el.textContent = parts.length ? parts.length + (parts.length === 1 ? ' attivo: ' : ' attivi: ') + parts.join(' · ') : 'nessuno attivo';
  box.classList.toggle('has-active', parts.length > 0);
}
(function(){
  const box = document.getElementById('filtersAdv'); if(!box) return;
  try{ box.open = localStorage.getItem('atl_filters_adv') === '1'; }catch(e){}
  box.addEventListener('toggle', ()=>{ try{ localStorage.setItem('atl_filters_adv', box.open ? '1' : '0'); }catch(e){} });
  filtersPanel.addEventListener('click', ()=> setTimeout(faUpdate, 80));
  filtersPanel.addEventListener('change', ()=> setTimeout(faUpdate, 80));
  faUpdate();
})();

// Shareable link
(function(){
  const linkInput = document.getElementById('shareLink');
  linkInput.value = window.location.href;
  document.getElementById('copyLinkBtn').addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(window.location.href); showToast('Link copiato'); }
    catch(e){
      linkInput.select();
      try{ document.execCommand('copy'); showToast('Link copiato'); }
      catch(e2){ showToast('Copia manualmente il link qui sopra'); }
    }
  });
})();

// ---- Modal scheda titolo ----

const STORY_TAG_INFO = {
  romance:{icon:'💕', label:'Storia romantica'},
  affinity:{icon:'🤝', label:'Legame speciale'},
  wow:{icon:'🤯', label:'Storia sorprendente'}
};
// ---- Update+ : simbolo «super aggiornato» (dorato = tutte le fonti in automatico, viola = controllato a mano da te) ----
// ---- Aggiornamenti in background senza bloccare lo scorrimento ----
// Un dato cambiato (trama, simboli, lingua…) aggiorna SOLO la riga di quel titolo; i ridisegni completi (nuovi titoli, voto/tier cambiati)
// si fanno quando non stai toccando lo schermo da almeno un secondo. Prima ogni aggiornamento ridisegnava tutto (~0,4 s bloccati sul telefono).
let rtLastInput = 0, rtPendingParts = null, rtIdleTimer = 0;
['touchstart', 'touchmove', 'wheel', 'scroll', 'pointerdown'].forEach(ev=> document.addEventListener(ev, ()=>{ rtLastInput = Date.now(); }, {passive: true, capture: true}));
function refreshGameRow(g){
  try{
    const tr = document.querySelector('#tbody tr[data-gid="' + g.id + '"]');
    if(tr && typeof window.__rtBuildRow === 'function'){
      const nt = window.__rtBuildRow(g), oc = tr.children, nc = nt.children;
      if(oc.length !== nc.length){ nt.classList.add('rt-noanim'); tr.replaceWith(nt); return; }
      // aggiorno SOLO le celle cambiate, tenendo la riga com'è (niente ridisegno, niente animazione d'ingresso, niente lampeggio)
      for(let i = 0; i < oc.length; i++){
        if(oc[i].innerHTML !== nc[i].innerHTML) oc[i].innerHTML = nc[i].innerHTML;
        if(oc[i].title !== nc[i].title) oc[i].title = nc[i].title;
        if(oc[i].classList.contains('score') && oc[i].style.getPropertyValue('--sc')) oc[i].style.setProperty('--sc', g.score);
      }
    }
  }catch(e){}
}
function renderWhenIdle(parts){
  rtPendingParts = Object.assign(rtPendingParts || {}, parts || {list: true});
  clearTimeout(rtIdleTimer);
  const tick = ()=>{
    const quiet = Date.now() - rtLastInput;
    if(quiet < 1000){ rtIdleTimer = setTimeout(tick, 1050 - quiet); return; }
    // v218: con la scheda di un titolo aperta la lista sotto non si vede: non la ridisegno mentre la scheda si apre o la scorri;
    // solo quando è aperta da un po' e ferma (così il ridisegno è già fatto quando la chiudi: niente copertine che lampeggiano al ritorno)
    try{ const mb = document.getElementById('modalBackdrop'); if(mb && mb.classList.contains('show') && (performance.now() - (window.__rtOpenAt || 0) < 3000 || window.__rtCardScrolling)){ rtIdleTimer = setTimeout(tick, 1200); return; } }catch(e){}
    const p = rtPendingParts; rtPendingParts = null;
    try{ if(p.metrics) renderMetrics(); if(p.stats) renderStats(); if(p.list) render(); if(p.bar) renderListBar(); }catch(e){}
  };
  rtIdleTimer = setTimeout(tick, 600);
}
function freshInfo(g){ try{ const f = (JSON.parse(localStorage.getItem('atl_fresh') || '{}') || {})[g.id]; return f && f.gold ? f : null; }catch(e){ return null; } }
function freshWhy(f){
  let d = ''; try{ d = new Date(f.t).toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'}); }catch(e){}
  return (f.m ? 'Controllato a mano da te il ' : 'Update V+ il ') + d + ' · fonti: ' + ((f.src && f.src.length) ? f.src.join(', ') : 'ricerca manuale') + (f.pe ? ' · ' + f.pe + ' modifiche da approvare' : '') + '. Non lo aggiorno più (tranne i prezzi).';
}
// aggiorna SOLO la riga di un titolo (la V+ dorata nella colonna voto; il simbolo Update+ sta solo nella scheda) senza ridisegnare la lista: niente sfarfallio negli aggiornamenti in background
function refreshRowFresh(g){
  try{
    const tr = document.querySelector('#tbody tr[data-gid="' + g.id + '"]'); if(!tr) return;
    const m = tr.querySelector('td.method'); if(m){ const h = srcIcon(g); if(m.innerHTML !== h) m.innerHTML = h; }
  }catch(e){}
}
function freshIcon(g){
  const f = freshInfo(g); if(!f) return '';
  const w = freshWhy(f).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<span class="mini-icon fresh-ic" title="${w}" data-why="${w}">${giIcon(f.m ? 'upmanual' : 'upplus')}</span>`;
}
function miniIcons(g){
  const e = g.enrich; if(!e) return '';
  let out = '';
  const attr = s=> String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  if(e.storyTag && STORY_TAG_INFO[e.storyTag]){ const w = STORY_TAG_INFO[e.storyTag].label + (e.storyTagNote ? ': ' + e.storyTagNote : ''); out += `<span class="mini-icon" title="${attr(w)}" data-why="${attr(STORY_TAG_INFO[e.storyTag].icon + ' ' + w)}">${STORY_TAG_INFO[e.storyTag].icon}</span>`; }
  if(e.dopamine){ const w = 'Loop molto coinvolgente' + (e.dopa && e.dopa.hook ? ': ' + e.dopa.hook : ''); out += `<span class="mini-icon" title="${attr(w)}" data-why="${attr('💉 ' + w)}">💉</span>`; }
  return out;
}
