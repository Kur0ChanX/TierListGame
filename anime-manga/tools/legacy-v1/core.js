// Nucleo: dati, profili, liste per tipo e per genere, filtri, ricerca, classifica, La mia Tier List, statistiche.
// Seguono schede.js (scheda titolo, Scopri, wizard, saghe), utente.js (changelog, profili, export), online.js (AniList, Novità, titoli aggiunti),
// gemini.js + ask.js (Chiedi), verify.js (Aggiorna info / Controllo dati), extras.js (viste, menu ✨, wishlist, traguardi) e boot.js (AVVIO: ultimo).
// Tutte le chiavi salvate nel browser iniziano con «atl_»: non toccano mai quelle dell'app dei giochi («jrpg_»).
const AM = AM_DATA;
function escHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function lsGet(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function showToast(msg, ms){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), ms || 1800);
}

// ---- Tier ----
const TIER_ORDER = {'S+':0,'S':1,'A':2,'B':3,'C':4,'D':5,'E':6,'F':7};
const TIER_LABEL = {'S+':'Splus','S':'S','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F'};
const TIERS_LIST = ['S+','S','A','B','C','D','E','F'];
const TIER_CUTS = AM.tierCuts;                                   // soglie sul voto, una per lista (ricavate dalla distribuzione dei voti), le stesse usate per costruire i dati
function tierOfScore(s, list){ const c = TIER_CUTS[list] || TIER_CUTS.anime; for(const t of TIERS_LIST.slice(0, 7)) if(s >= c[t]) return t; return 'F'; }
const TIER_COL = {'S+':'#f5b82e','S':'#a855f7','A':'#3b82f6','B':'#10b981','C':'#eab308','D':'#f97316','E':'#ef4444','F':'#8b8b8b'};

// ---- Generi e temi (definiti nei dati) ----
const TAG_INFO = {}, TAG_ORDER = [];
AM.tags.forEach(t=>{ TAG_INFO[t.c] = {icon: t.i, label: t.l, group: t.g}; TAG_ORDER.push(t.c); });
const GENRE_GROUPS = [
  {title:'Generi', icon:'🎬'}, {title:'Pubblico', icon:'👥'}, {title:'Temi', icon:'🧩'}, {title:'Formato', icon:'📱'}
].map(g=> Object.assign(g, {codes: AM.tags.filter(t=> t.g === g.title).map(t=> t.c)}));
// ---- Studi di animazione (Pixar, Disney, DreamWorks, Ghibli…): liste e filtro ----
const STUDIO_INFO = {}, STUDIO_GROUPS = [];
(AM.studios || []).forEach(st=>{
  STUDIO_INFO[st.k] = st; TAG_INFO['studio:' + st.k] = {icon: st.i, label: st.n, group: 'Studi'};
  let gr = STUDIO_GROUPS.find(x=> x.title === 'Studi: ' + st.g);
  if(!gr){ gr = {title: 'Studi: ' + st.g, icon: '🏢', codes: []}; STUDIO_GROUPS.push(gr); }
  gr.codes.push('studio:' + st.k);
});
const PICKER_GROUPS = GENRE_GROUPS.concat(STUDIO_GROUPS);
function tagPills(g, n){ return (g.tags || []).slice(0, n || 99).map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${escHtml(TAG_INFO[t].label)}</span>` : '').join(''); }

// ---- Tipi di lista ----
const LIST_DEFS = [
  {id:'anime',  icon:'play',    label:'Anime',   full:'Serie anime',        watch:true},
  {id:'film',   icon:'film',    label:'Film',    full:'Film d\'animazione', watch:true},
  {id:'manga',  icon:'book',    label:'Manga',   full:'Manga',              watch:false},
  {id:'manhwa', icon:'webtoon', label:'Manhwa',  full:'Manhwa e Manhua',    watch:false}
];
const LIST_IDS = LIST_DEFS.map(d=> d.id);
const LIST_BY_ID = {}; LIST_DEFS.forEach(d=>{ LIST_BY_ID[d.id] = d; });
const FORMAT_LABEL = {TV:'Serie TV', TV_SHORT:'Serie breve', ONA:'Serie web (ONA)', OVA:'OVA', MOVIE:'Film', MANGA:'Manga', ONE_SHOT:'One-shot'};
const AIR_LABEL = {F:'Concluso', R:'In corso', H:'In pausa'};

// ---- Titoli: base + aggiunti dall'utente + correzioni approvate ----
const searchNorm = s=> String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const searchCompact = s=> searchNorm(s).replace(/[^a-z0-9]+/g, '');
function yearText(g){
  if(!g.y) return '';
  if(g.st === 'R' && g.l !== 'film') return g.y + '–in corso';
  return g.y2 && g.y2 !== g.y ? g.y + '–' + g.y2 : String(g.y);
}
function hoursEst(g){
  if(g.l === 'film') return (g.d || 100) / 60;
  if(g.l === 'anime') return (g.n || 12) * (g.d || 24) / 60;
  if(g.v) return g.v * 1.7;
  if(g.ch) return g.ch * 0.16;
  return 0;
}
function lenText(g){
  if(g.l === 'film') return g.d ? g.d + ' min' : '—';
  if(g.l === 'anime') return g.n ? g.n + ' ep' : (g.st === 'R' ? 'in corso' : '—');
  if(g.ch) return g.ch + ' cap';
  if(g.v) return g.v + ' vol';
  return g.st === 'R' ? 'in corso' : '—';
}
function lenLong(g){
  if(g.l === 'film') return g.d ? g.d + ' minuti' : 'durata non nota';
  if(g.l === 'anime'){ const h = hoursEst(g); return (g.n ? g.n + ' episodi' + (g.d ? ' da ' + g.d + ' min' : '') : 'episodi non noti') + (g.n && h >= 1 ? ' (≈ ' + Math.round(h) + ' ore)' : ''); }
  const parts = []; if(g.ch) parts.push(g.ch + ' capitoli'); if(g.v) parts.push(g.v + ' volumi'); return parts.join(' · ') || (g.st === 'R' ? 'in corso di pubblicazione' : 'lunghezza non nota');
}
function lengthClass(g){
  if(g.l === 'film') return 'short';
  if(g.l === 'anime'){ if(!g.n) return null; return g.n <= 13 ? 'short' : g.n <= 52 ? 'mid' : 'long'; }
  if(g.v) return g.v <= 6 ? 'short' : g.v <= 20 ? 'mid' : 'long';
  if(g.ch) return g.ch <= 60 ? 'short' : g.ch <= 200 ? 'mid' : 'long';
  return g.st === 'R' ? 'long' : null;
}
function prepItem(g){
  g.tags = g.tags || [];
  g.watch = g.l === 'anime' || g.l === 'film';
  g.ysort = g.y || 0; g.year = yearText(g);
  g.hours = hoursEst(g); g.len = g.hours;
  g._q = searchNorm([g.name, g.jp, g.itn, (g.alt || []).join(' '), g.who, g.dir, g.y].join(' '));
  g._c = searchCompact([g.name, g.jp, g.itn].join(' '));
  return g;
}
function loadCustomItems(){ const a = lsGet('atl_custom', []); return Array.isArray(a) ? a : []; }
function saveCustomItems(){ lsSet('atl_custom', ITEMS.filter(g=> g.custom).map(g=>{ const o = Object.assign({}, g); ['_q','_c','watch','ysort','year','hours','len','rank','sagaKey'].forEach(k=> delete o[k]); return o; })); }
let OVERRIDES = lsGet('atl_overrides', {});                        // correzioni approvate ai dati di base: {id: {campo: valore}}
function applyOverrides(){
  for(const g of ITEMS){ const o = OVERRIDES[g.id]; if(o) Object.assign(g, o); if(o && o.score != null && o.tier == null) g.tier = tierOfScore(g.score, g.l); }
}
const ITEMS = AM.items.slice();
{
  const have = new Set(ITEMS.map(g=> g.id));
  loadCustomItems().forEach(c=>{ if(c && c.id && !have.has(c.id)){ c.custom = true; ITEMS.push(c); have.add(c.id); } });
  applyOverrides();
  ITEMS.forEach(prepItem);
}
const BY_ID = new Map();
function reindex(){
  BY_ID.clear(); ITEMS.forEach(g=> BY_ID.set(String(g.id), g));
  for(const id of LIST_IDS){
    ITEMS.filter(g=> g.l === id).sort((a, b)=> b.score - a.score || (b.pop || 0) - (a.pop || 0)).forEach((g, i)=>{ g.rank = i + 1; });
  }
}
reindex();
function byId(id){ return BY_ID.get(String(id)); }
function addItemToLibrary(g){ prepItem(g); g.custom = true; ITEMS.push(g); reindex(); saveCustomItems(); }

// ---- Profili: «mario» usa le chiavi base, gli ospiti le stesse con suffisso ----
function loadProfiles(){ const a = lsGet('atl_profiles', null); return Array.isArray(a) && a.length ? a : [{id:'mario', name:'Mario'}]; }
let PROFILES = loadProfiles();
function saveProfiles(){ lsSet('atl_profiles', PROFILES); }
function loadActiveProfileId(){ try{ const id = localStorage.getItem('atl_active_profile'); if(id && PROFILES.some(p=> p.id === id)) return id; }catch(e){} return PROFILES[0].id; }
let ACTIVE_PROFILE_ID = loadActiveProfileId();
function saveActiveProfileId(){ try{ localStorage.setItem('atl_active_profile', ACTIVE_PROFILE_ID); }catch(e){} }
function currentProfile(){ return PROFILES.find(p=> p.id === ACTIVE_PROFILE_ID) || PROFILES[0]; }
function profileKey(baseKey){ return ACTIVE_PROFILE_ID === 'mario' ? baseKey : (baseKey + '__' + ACTIVE_PROFILE_ID); }
function nextGuestId(){ return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
const PROFILE_KEYS = ['atl_favs','atl_status','atl_mytier','atl_lists','atl_list_usage','atl_discover_skipped','atl_novita_skipped','atl_novita_skipped_details','atl_platforms','atl_wishlist','atl_badges','atl_vibes_results'];

let FAVS = new Set();
function loadFavs(){ FAVS = new Set(lsGet(profileKey('atl_favs'), []).map(String)); }
loadFavs();
function saveFavs(){ lsSet(profileKey('atl_favs'), Array.from(FAVS)); }
function toggleFav(id){ id = String(id); if(FAVS.has(id)){ FAVS.delete(id); showToast('Rimosso dai preferiti'); } else { FAVS.add(id); showToast('Aggiunto ai preferiti'); } saveFavs(); }

const STATUS_INFO = {
  done:{icon:'✅', dot:'played',  w:'Visto',      r:'Letto',      wl:'Completato'},
  now: {icon:'▶️', dot:'playing', w:'In visione', r:'In lettura', wl:'In corso'},
  plan:{icon:'📌', dot:'backlog', w:'Da vedere',  r:'Da leggere', wl:'Da vedere/leggere'},
  drop:{icon:'⛔', dot:'dropped', w:'Droppato',   r:'Droppato',   wl:'Droppato'}
};
function statusLabel(g, k){ const s = STATUS_INFO[k]; return s ? (g && !g.watch ? s.r : s.w) : ''; }
let STATUSES = {};
function loadStatuses(){ STATUSES = lsGet(profileKey('atl_status'), {}) || {}; }
loadStatuses();
function saveStatuses(){ lsSet(profileKey('atl_status'), STATUSES); }
function setStatus(id, status){ id = String(id); if(STATUSES[id] === status) delete STATUSES[id]; else STATUSES[id] = status; saveStatuses(); }

let MYTIER = {};
function loadMyTier(){ MYTIER = lsGet(profileKey('atl_mytier'), {}) || {}; }
loadMyTier();
function saveMyTier(){ lsSet(profileKey('atl_mytier'), MYTIER); }
function effectiveTier(g){ return MYTIER[g.id] || g.tier; }
function moveToTier(id, tier){
  const g = byId(id); if(!g) return;
  if(g.tier === tier) delete MYTIER[g.id]; else MYTIER[g.id] = tier;
  saveMyTier(); renderMyTier();
  showToast(`${g.name} spostato in ${tier}`);
}

// ---- Liste: un tipo (Anime, Film, Manga, Manhwa), «Tutti», oppure un genere scelto da te ----
let ACTIVE_LIST = 'anime';
let MY_LISTS = [];                                                // codici genere aggiunti alla barra
function loadLists(){
  ACTIVE_LIST = 'anime'; MY_LISTS = [];
  const v = lsGet(profileKey('atl_lists'), null);
  if(v && Array.isArray(v.mine)) MY_LISTS = v.mine.filter(c=> TAG_INFO[c]);
  if(v && typeof v.sel === 'string' && (LIST_IDS.includes(v.sel) || v.sel === 'all' || MY_LISTS.includes(v.sel))) ACTIVE_LIST = v.sel;
}
loadLists();
function saveLists(){ lsSet(profileKey('atl_lists'), {sel: ACTIVE_LIST, mine: MY_LISTS}); }
function inList(g, id){ return id === 'all' ? true : LIST_BY_ID[id] ? g.l === id : id.startsWith('studio:') ? g.stk === id.slice(7) : (g.tags || []).includes(id); }
function inActiveList(g){ return inList(g, ACTIVE_LIST); }
function listCount(id){ let n = 0; for(const g of ITEMS) if(inList(g, id)) n++; return n; }
function bumpListUsage(id){ if(LIST_BY_ID[id] || id === 'all') return; const u = lsGet(profileKey('atl_list_usage'), {}) || {}; u[id] = (u[id] || 0) + 1; lsSet(profileKey('atl_list_usage'), u); }
function listUsage(){ return lsGet(profileKey('atl_list_usage'), {}) || {}; }
function setActiveList(id){ ACTIVE_LIST = id; bumpListUsage(id); saveLists(); renderListBar(); renderStudioFilter(); renderStats(); if(typeof setView === 'function') setView(state.view); }
function giIcon(n){ return `<svg class="gi gi-s" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-${n}"/></svg>`; }
const LIST_BAR_MAX = 3;
function renderListBar(){
  const bar = document.getElementById('listBar'); if(!bar) return;
  const chip = (id, icon, label)=> `<button class="list-chip${ACTIVE_LIST === id ? ' active' : ''}" data-list="${id}">${icon} ${escHtml(label)} <span class="list-cnt">${listCount(id)}</span></button>`;
  const use = listUsage();
  const cand = MY_LISTS.map(c=> ({c, n: listCount(c), u: use[c] || 0})).filter(o=> o.n > 0 && TAG_INFO[o.c]).sort((a, b)=> b.u - a.u || b.n - a.n);
  let shown = cand.slice(0, LIST_BAR_MAX).map(o=> o.c);
  if(TAG_INFO[ACTIVE_LIST] && !shown.includes(ACTIVE_LIST)) shown = [ACTIVE_LIST].concat(shown.slice(0, LIST_BAR_MAX - 1));
  bar.innerHTML = LIST_DEFS.map(d=> chip(d.id, giIcon(d.icon), d.label)).join('') + shown.map(c=> chip(c, TAG_INFO[c].icon, TAG_INFO[c].label)).join('') + chip('all', giIcon('globe'), 'Tutti') + `<button class="list-chip list-add" id="listAddBtn" title="Tutti i generi e gli studi, divisi per gruppi">${giIcon('lens')} Generi e studi</button>`;
  bar.querySelectorAll('[data-list]').forEach(b=> b.addEventListener('click', ()=> setActiveList(b.dataset.list)));
  document.getElementById('listAddBtn').addEventListener('click', ()=> openListPicker());
  const act = bar.querySelector('.list-chip.active'); if(act && act.scrollIntoView){ try{ act.scrollIntoView({block:'nearest', inline:'center'}); }catch(e){} }
}
// selettore a gruppi espandibili (accordion)
const GG_OPEN = new Set([0]);
function genreAccordionHtml(chipFn, countFn, q){
  return PICKER_GROUPS.map((g, gi)=>{
    const codes = g.codes.filter(c=> TAG_INFO[c] && (!q || (TAG_INFO[c].label + ' ' + g.title).toLowerCase().includes(q)));
    if(!codes.length) return '';
    const n = countFn ? countFn(codes) : 0;
    return `<details class="gg" data-gg="${gi}" ${(q || GG_OPEN.has(gi)) ? 'open' : ''}><summary><span>${g.icon} ${escHtml(g.title)}</span><small>${n ? n + ' · ' : ''}${codes.length}</small></summary><div class="gg-chips">${codes.map(chipFn).join('')}</div></details>`;
  }).join('') || '<div class="lp-sub">Nessun genere con questo nome.</div>';
}
function wireAccordion(root, hasQuery){
  root.querySelectorAll('details.gg').forEach(d=> d.addEventListener('toggle', ()=>{ if(hasQuery) return; const i = +d.dataset.gg; if(d.open) GG_OPEN.add(i); else GG_OPEN.delete(i); }));
}
function openListPicker(q){
  q = typeof q === 'string' ? q.trim().toLowerCase() : '';
  let el = document.getElementById('listPickerBackdrop');
  if(!el){
    el = document.createElement('div'); el.id = 'listPickerBackdrop'; el.className = 'dup-backdrop';
    el.addEventListener('click', (e)=>{ if(e.target === el || e.target.closest('[data-lp-close]')){ el.classList.remove('show'); renderListBar(); } });
    document.body.appendChild(el);
  }
  const chip = c=>{ const n = listCount(c); return `<button class="list-chip${ACTIVE_LIST === c ? ' active' : ''}${n ? '' : ' lp-zero'}" data-lp="${c}">${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)} <span class="list-cnt">${n}</span></button>`; };
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🔍 Generi e studi</b><button class="btn" data-lp-close>Chiudi</button></div>
    <div class="lp-sub">Tocca un genere o uno studio (Pixar, Disney, Ghibli…) per aprire la sua classifica. I gruppi si aprono e si chiudono; i più usati restano nella barra.</div>
    <input class="lp-search" id="lpSearch" type="search" placeholder="Cerca un genere o uno studio (es. isekai, Pixar, horror)…" value="${escHtml(q)}" autocomplete="off">
    <div class="gg-wrap">${genreAccordionHtml(chip, codes=> codes.filter(c=> listCount(c) > 0).length, q)}</div></div>`;
  const inp = el.querySelector('#lpSearch');
  let h = 0; inp.addEventListener('input', ()=>{ clearTimeout(h); h = setTimeout(()=>{ const v = inp.value; openListPicker(v); const n = document.getElementById('lpSearch'); if(n){ n.focus(); n.setSelectionRange(v.length, v.length); } }, 200); });
  wireAccordion(el, !!q);
  el.querySelectorAll('[data-lp]').forEach(b=> b.addEventListener('click', ()=>{
    const c = b.dataset.lp; if(!MY_LISTS.includes(c)) MY_LISTS.push(c);
    el.classList.remove('show'); setActiveList(c);
  }));
  el.classList.add('show');
}
// quando aggiungi un titolo, la classifica del suo genere principale compare da sola
function ensureGenreLists(tags){
  const wanted = [];
  (tags || []).slice(0, 1).forEach(t=>{ if(TAG_INFO[t] && !wanted.includes(t)) wanted.push(t); });
  const added = wanted.filter(t=> !MY_LISTS.includes(t));
  if(added.length){ added.forEach(t=> MY_LISTS.push(t)); saveLists(); renderListBar(); }
  return added;
}
function showAddedBanner(g, newLists){
  let el = document.getElementById('addedBanner');
  if(!el){ el = document.createElement('div'); el.id = 'addedBanner'; el.className = 'added-banner'; document.body.appendChild(el); }
  const parts = [`${LIST_BY_ID[g.l] ? LIST_BY_ID[g.l].label : ''}`];
  (g.tags || []).slice(0, 1).forEach(t=>{ if(TAG_INFO[t]) parts.push(`${TAG_INFO[t].icon} ${TAG_INFO[t].label}` + ((newLists || []).includes(t) ? ' <b>(nuova classifica)</b>' : '')); });
  el.innerHTML = `<div class="added-title">✅ Aggiunto alla tua libreria!</div><div class="added-name">${escHtml(g.name)}</div><div class="added-where">Lo trovi in: ${parts.filter(Boolean).join(' · ')} · Tutti</div>`;
  el.classList.add('show');
  clearTimeout(el._h); el._h = setTimeout(()=> el.classList.remove('show'), 3200);
}

// ---- Stato dei filtri ----
function freshState(){
  return {search:'', tiers:new Set(), method:'', decade:'', minTier:'', onlyFavs:false, onlyLink:false, kind:'', studio:'', len:'', air:'',
    tags:new Set(), status:'', sortKey:'rank', sortDir:1, view: (state && state.view) || 'list', mood:''};
}
let state = null;
state = freshState();

// umore (filtro «Generi, temi e umore»)
const MOOD_PRESETS = [
  {key:'quick',   icon:'⏱️', label:'Si finisce in fretta', test:g=> lengthClass(g) === 'short'},
  {key:'relax',   icon:'😌', label:'Rilassante',           test:g=> (g.tags.includes('SOL') || g.tags.includes('IYA') || g.tags.includes('COM')) && !g.tags.some(t=> ['HOR','GOR','PSY','THR','SUR','DYS'].includes(t))},
  {key:'intense', icon:'💥', label:'Storia intensa',       test:g=> g.tags.some(t=> ['PSY','DRA','THR','MYS'].includes(t)) && g.score >= 80},
  {key:'action',  icon:'⚔️', label:'Azione dinamica',      test:g=> g.tags.some(t=> ['ACT','MAR','MEC','SPO','POW'].includes(t))},
  {key:'romance', icon:'💕', label:'Romantico',            test:g=> g.tags.includes('ROM')},
  {key:'dark',    icon:'🌑', label:'Cupo e adulto',        test:g=> g.tags.some(t=> ['HOR','GOR','PSY','DYS','SEI'].includes(t)) && g.tags.some(t=> ['HOR','GOR','PSY','DYS','THR','SUR'].includes(t))},
  {key:'epic',    icon:'📚', label:'Epico e lungo',        test:g=> lengthClass(g) === 'long'}
];
const WIZARD_QUESTIONS = [
  {key:'what', question:'Cosa hai voglia di fare?', options:[
    {value:'anime', label:'📺 Guardare una serie anime'},
    {value:'film', label:'🎞️ Vedere un film'},
    {value:'manga', label:'📚 Leggere un manga'},
    {value:'', label:'🤷 Non importa'}
  ]},
  {key:'time', question:'Quanto tempo vuoi dedicargli?', options:[
    {value:'short', label:'⏱️ Poco (una serata o un weekend)'},
    {value:'mid', label:'⏳ Nella media (qualche settimana)'},
    {value:'long', label:'🐘 Tanto, voglio un\'epopea'},
    {value:'', label:'🤷 Non importa'}
  ]},
  {key:'mood', question:'Che umore hai?', options:[
    {value:'relax', label:'😌 Qualcosa di rilassante'},
    {value:'intense', label:'💥 Una storia intensa'},
    {value:'action', label:'⚔️ Azione dinamica'},
    {value:'romance', label:'💕 Romantico'},
    {value:'dark', label:'🌑 Qualcosa di cupo e adulto'},
    {value:'', label:'🤷 Non importa'}
  ]},
  {key:'tier', question:'Quanto vuoi puntare in alto?', options:[
    {value:'top', label:'🏆 Solo capolavori (S+/S)'},
    {value:'good', label:'👍 Anche A/B va benissimo'},
    {value:'', label:'🎲 Sorprendimi, qualsiasi tier'}
  ]}
];

// filtro per studio: mostra solo gli studi presenti nella lista attiva (con quanti titoli)
function renderStudioFilter(){
  const el = document.getElementById('studioFilter'); if(!el) return;
  const counts = {}; ITEMS.filter(inActiveList).forEach(g=>{ if(g.stk) counts[g.stk] = (counts[g.stk] || 0) + 1; });
  const groups = {};
  Object.keys(counts).forEach(k=>{ const st = STUDIO_INFO[k]; if(st) (groups[st.g] = groups[st.g] || []).push(st); });
  const cur = state.studio;
  el.innerHTML = '<option value="">Ogni studio</option>' + Object.keys(groups).map(gname=> `<optgroup label="${escHtml(gname)}">${groups[gname].sort((a, b)=> counts[b.k] - counts[a.k]).map(st=> `<option value="${st.k}">${st.i} ${escHtml(st.n)} (${counts[st.k]})</option>`).join('')}</optgroup>`).join('');
  el.value = counts[cur] ? cur : ''; if(!counts[cur]) state.studio = '';
}

// ---- Statistiche e chip dei tier ----
function computeStats(){
  const counts = {}; TIERS_LIST.forEach(t=> counts[t] = 0);
  ITEMS.forEach(g=>{ if(inActiveList(g)){ const t = state.view === 'mytier' ? effectiveTier(g) : g.tier; counts[t] = (counts[t] || 0) + 1; } });
  return counts;
}
function median(a){ const s = a.slice().sort((x, y)=> x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; }
function renderMetrics(){
  const el = document.getElementById('metricsRow'); if(!el) return;
  const all = ITEMS, scores = all.map(g=> g.score);
  const avg = scores.length ? (scores.reduce((a, b)=> a + b, 0) / scores.length).toFixed(1) : '0';
  const years = all.map(g=> g.y).filter(Boolean);
  const done = Object.values(STATUSES).filter(s=> s === 'done').length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;
  const withStory = all.filter(g=> g.story).length, withOk = all.filter(g=> g.ok).length;
  const custom = all.filter(g=> g.custom).length;
  el.innerHTML = `
    <div class="metric"><b>${all.length}</b>titoli totali</div>
    <div class="metric"><b>${LIST_DEFS.map(d=> all.filter(g=> g.l === d.id).length).join(' · ')}</b>anime · film · manga · manhwa</div>
    <div class="metric"><b>${avg}</b>voto medio</div>
    <div class="metric"><b>${median(scores)}</b>voto mediano</div>
    <div class="metric"><b>${years.length ? Math.min(...years) + '–' + Math.max(...years) : '—'}</b>periodo coperto</div>
    <div class="metric"><b>${withStory}/${all.length}</b>trame in italiano</div>
    <div class="metric" title="Titoli con «fa per te se / lascia stare se»"><b>${withOk}/${all.length}</b>schede «fa per te se»</div>
    <div class="metric"><b>${FAVS.size}</b>preferiti</div>
    <div class="metric"><b>${done} (${pct}%)</b>completati da te</div>
    <div class="metric"><b>${custom}</b>aggiunti da te</div>`;
}
function renderStats(){
  const row = document.getElementById('statsRow'); if(!row) return;
  const counts = computeStats(), total = ITEMS.filter(inActiveList).length;
  const maxCount = Math.max(1, ...Object.values(counts));
  row.innerHTML = '';
  const allChip = document.createElement('div');
  allChip.className = 'stat-chip' + (state.tiers.size === 0 ? ' active' : '');
  allChip.innerHTML = `<div class="n">${total}</div><div class="l">Tutti</div>`;
  allChip.onclick = ()=>{ state.tiers.clear(); renderStats(); render(); };
  row.appendChild(allChip);
  TIERS_LIST.forEach(t=>{
    const c = counts[t] || 0, pct = Math.round(c / maxCount * 100);
    const chip = document.createElement('div');
    chip.className = 'stat-chip' + (state.tiers.has(t) ? ' active' : '');
    chip.innerHTML = `<div class="n">${c}</div><div class="l"><span class="badge ${TIER_LABEL[t]}">${t}</span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
    chip.onclick = ()=>{ if(state.tiers.has(t)) state.tiers.delete(t); else state.tiers.add(t); renderStats(); render(); if(state.view === 'mytier') renderMyTier(); };
    row.appendChild(chip);
  });
}
function renderTagChips(){
  const row = document.getElementById('tagChips'); if(!row) return;
  row.innerHTML = '';
  GENRE_GROUPS.forEach(gr=>{
    const h = document.createElement('div'); h.className = 'tg-title'; h.textContent = gr.icon + ' ' + gr.title; row.appendChild(h);
    gr.codes.forEach(code=>{
      const info = TAG_INFO[code]; if(!info) return;
      const chip = document.createElement('div');
      chip.className = 'tagchip' + (state.tags.has(code) ? ' active' : '');
      chip.textContent = info.icon + ' ' + info.label;
      chip.onclick = ()=>{ if(state.tags.has(code)) state.tags.delete(code); else state.tags.add(code); renderTagChips(); render(); };
      row.appendChild(chip);
    });
  });
}
function renderMoodChips(){
  const row = document.getElementById('moodChips'); if(!row) return;
  row.innerHTML = '';
  const h = document.createElement('div'); h.className = 'tg-title'; h.textContent = '🌗 Umore'; row.appendChild(h);
  MOOD_PRESETS.forEach(p=>{
    const chip = document.createElement('div');
    chip.className = 'tagchip' + (state.mood === p.key ? ' active' : '');
    chip.textContent = p.icon + ' ' + p.label;
    chip.onclick = ()=>{ state.mood = state.mood === p.key ? '' : p.key; renderMoodChips(); render(); };
    row.appendChild(chip);
  });
}
function chartHtml(title, rows){
  const max = Math.max(1, ...rows.map(r=> r.count));
  return `<div class="chart-section"><div class="chart-title">${title}</div>` +
    rows.map(r=> `<div class="chart-row"><span class="lbl" title="${escHtml(r.label)}">${escHtml(r.label)}</span><span class="barwrap"><i style="width:${Math.round(r.count / max * 100)}%"></i></span><span class="val">${r.count}</span></div>`).join('') + `</div>`;
}
function topCounts(arr, n){ const c = {}; arr.forEach(k=>{ if(k) c[k] = (c[k] || 0) + 1; }); return Object.entries(c).sort((a, b)=> b[1] - a[1]).slice(0, n).map(([label, count])=> ({label, count})); }
function renderStatsPanel(){
  const panel = document.getElementById('statsPanel'); if(!panel) return;
  const pool = ITEMS.filter(inActiveList);
  const dec = [["Prima del 1990", y=> y < 1990], ["Anni '90", y=> y >= 1990 && y < 2000], ['Anni 2000', y=> y >= 2000 && y < 2010], ['Anni 2010', y=> y >= 2010 && y < 2020], ['Anni 2020', y=> y >= 2020]];
  const decadeRows = dec.map(([label, f])=> ({label, count: pool.filter(g=> g.y && f(g.y)).length}));
  const tc = {}; TIERS_LIST.forEach(t=> tc[t] = 0); pool.forEach(g=>{ tc[g.tier]++; });
  const tierRows = TIERS_LIST.map(t=> ({label: t, count: tc[t]}));
  const kindRows = LIST_DEFS.map(d=> ({label: d.full, count: pool.filter(g=> g.l === d.id).length})).filter(r=> r.count);
  const whoRows = topCounts(pool.flatMap(g=> String(g.who || '').split(/ \+ | e /).map(s=> s.trim())), 8);
  const lenRows = [['⚡ Brevi', 'short'], ['📺 Medi', 'mid'], ['🐘 Lunghi', 'long']].map(([label, k])=> ({label, count: pool.filter(g=> lengthClass(g) === k).length}));
  const sc = {done:0, now:0, plan:0, drop:0}; pool.forEach(g=>{ if(STATUSES[g.id]) sc[STATUSES[g.id]]++; });
  const statusRows = [['Completati', sc.done], ['In corso', sc.now], ['Da vedere/leggere', sc.plan], ['Droppati', sc.drop], ['Non segnati', pool.length - sc.done - sc.now - sc.plan - sc.drop]].map(([label, count])=> ({label, count}));
  const tagRows = topCounts(pool.flatMap(g=> g.tags), 14).map(r=> ({label: TAG_INFO[r.label] ? TAG_INFO[r.label].icon + ' ' + TAG_INFO[r.label].label : r.label, count: r.count}));
  const completionRows = TIERS_LIST.map(t=>{ const inT = pool.filter(g=> g.tier === t); const d = inT.filter(g=> STATUSES[g.id] === 'done').length; return {label: t, count: inT.length ? Math.round(d / inT.length * 100) : 0}; });
  let hWatched = 0, chRead = 0, nDone = 0;
  ITEMS.forEach(g=>{ const s = STATUSES[g.id]; if(s === 'done' || s === 'now'){ if(g.watch) hWatched += g.hours; else chRead += g.ch || (g.v ? g.v * 9 : 0); if(s === 'done') nDone++; } });
  panel.innerHTML =
    `<div class="metrics" style="margin-bottom:16px;"><div class="metric"><b>${Math.round(hWatched)}h</b>ore stimate di anime e film visti (titoli «visto»/«in visione»)</div><div class="metric"><b>${Math.round(chRead)}</b>capitoli stimati letti</div><div class="metric"><b>${nDone}</b>titoli completati</div></div>` +
    chartHtml('Completamento per tier (% completato)', completionRows) +
    chartHtml('Distribuzione per tier', tierRows) +
    (ACTIVE_LIST === 'all' || !LIST_BY_ID[ACTIVE_LIST] ? chartHtml('Per tipo', kindRows) : '') +
    chartHtml('Distribuzione per decade', decadeRows) +
    chartHtml('Studi e autori più rappresentati', whoRows) +
    chartHtml('Durata', lenRows) +
    chartHtml('Il tuo stato', statusRows) +
    chartHtml('Generi più comuni', tagRows);
}

// ---- Ricerca intelligente: ignora accenti, spazi e simboli e tollera errori di battitura ----
let lastSearchFuzzy = false;
function editDistanceWithin(a, b, max){
  if(Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({length: b.length + 1}, (_, i)=> i);
  for(let i = 1; i <= a.length; i++){
    const cur = [i]; let rowMin = i;
    for(let j = 1; j <= b.length; j++){ cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); rowMin = Math.min(rowMin, cur[j]); }
    if(rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}
function searchFuzzyMatch(g, q){
  const qt = searchNorm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if(!qt.length) return false;
  const words = g._q.split(/[^a-z0-9]+/).filter(Boolean);
  return qt.every(t=> words.some(w=> w.startsWith(t) || (t.length >= 4 && (editDistanceWithin(t, w, t.length >= 7 ? 2 : 1) || (w.length > t.length && editDistanceWithin(t, w.slice(0, t.length), 1))))));
}
function lengthOk(g, want){ return lengthClass(g) === want; }
function applyFilters(){
  let list = ITEMS.filter(inActiveList);
  if(state.kind) list = list.filter(g=> g.l === state.kind);
  if(state.tiers.size > 0) list = list.filter(g=> state.tiers.has(state.view === 'mytier' ? effectiveTier(g) : g.tier));
  if(state.method) list = list.filter(g=> g.m === state.method);
  if(state.decade){
    if(state.decade === 'pre1990') list = list.filter(g=> g.y && g.y < 1990);
    else { const d = parseInt(state.decade, 10); list = list.filter(g=> g.y >= d && g.y < d + 10); }
  }
  if(state.minTier){ const mt = TIER_ORDER[state.minTier]; list = list.filter(g=> TIER_ORDER[g.tier] <= mt); }
  if(state.studio) list = list.filter(g=> g.stk === state.studio);
  if(state.len) list = list.filter(g=> lengthOk(g, state.len));
  if(state.air) list = list.filter(g=> (g.st || 'F') === state.air);
  if(state.onlyFavs) list = list.filter(g=> FAVS.has(g.id));
  if(state.onlyLink) list = list.filter(g=> g.ad && g.ad.length);
  if(state.tags.size > 0) list = list.filter(g=> g.tags.some(t=> state.tags.has(t)));
  if(state.mood){ const mp = MOOD_PRESETS.find(m=> m.key === state.mood); if(mp) list = list.filter(mp.test); }
  if(state.status){
    if(state.status === 'none') list = list.filter(g=> !STATUSES[g.id]);
    else list = list.filter(g=> STATUSES[g.id] === state.status);
  }
  if(state.search.trim() !== ''){
    const q = searchNorm(state.search.trim()), qc = searchCompact(state.search);
    const exact = list.filter(g=> g._q.includes(q) || (qc.length >= 3 && g._c.includes(qc)));
    list = exact.length ? exact : list.filter(g=> searchFuzzyMatch(g, state.search));
    lastSearchFuzzy = !exact.length && list.length > 0;
  } else lastSearchFuzzy = false;
  const dnaP = state.sortKey === 'dna' && typeof buildTasteProfile === 'function' ? buildTasteProfile() : null;
  const key = state.sortKey, dir = state.sortDir;
  list = list.slice().sort((a, b)=>{
    if(key === 'rank') return ((b.score - a.score) || ((b.pop || 0) - (a.pop || 0))) * dir;
    let va = a[key], vb = b[key];
    if(key === 'tier'){ va = TIER_ORDER[effectiveTierFor(a)]; vb = TIER_ORDER[effectiveTierFor(b)]; }
    if(key === 'fav'){ va = FAVS.has(a.id) ? 1 : 0; vb = FAVS.has(b.id) ? 1 : 0; }
    if(key === 'dna'){ const da = dnaForItem(a, dnaP), db = dnaForItem(b, dnaP); va = da ? da.pct : -1; vb = db ? db.pct : -1; }
    if(typeof va === 'string' || typeof vb === 'string') return String(va || '').localeCompare(String(vb || '')) * dir;
    return ((va || 0) - (vb || 0)) * dir;
  });
  return list;
}
function effectiveTierFor(g){ return state.view === 'mytier' ? effectiveTier(g) : g.tier; }
function methodIcon(m){ return m === 'V' ? '✅' : '🗳️'; }
function methodLabel(m, g){ return m === 'V' ? (g && g.sc === 'imdb' ? 'Voto medio degli utenti di IMDb (verificato)' : 'Voto medio degli utenti di AniList (verificato)') : 'Stima (titolo aggiunto da te, voto non verificato)'; }
function sourceName(g){ return g.m !== 'V' ? 'Stima' : g.sc === 'imdb' ? 'IMDb' : 'AniList'; }

// ---- Tabella a blocchi ----
const ROW_PAGE = 80;
let renderToken = 0, rowObserver = null, lastViewKey = '', lastShownRows = 0;
function thumbHtml(g, w){
  const u = coverUrl(g, 'medium');
  const bg = g.c ? ` style="--tc:${escHtml(g.c)}"` : '';
  return u ? `<span class="row-th"${bg}><img src="${escHtml(u)}" alt="" loading="lazy" decoding="async" width="30" height="42" onerror="this.remove()"></span>` : `<span class="row-th"${bg}></span>`;
}
function itBadge(g){
  const M = {D:['d','ITA','Doppiato in italiano'], S:['s','sub','Sottotitoli in italiano'], E:['e','ITA','Edizione italiana ufficiale'], F:['f','fan','Solo traduzione dei fan'], N:['n','no','Nessuna edizione italiana ufficiale']};
  const t = M[g.ia];
  const src = g.itw ? ' · fonte: it.wikipedia' : '';
  return t ? `<span class="itb itb-${t[0]}" title="${t[2]}${src}">${t[1]}</span>` : '<span class="itb itb-x" title="Disponibilità in italiano non ancora verificata (usa «Aggiorna info» nella scheda)">?</span>';
}
function miniIcons(g){
  let out = '';
  const attr = s=> String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  if(g.hl && HL_INFO[g.hl]){ const w = HL_INFO[g.hl].label + (g.hln ? ': ' + g.hln : ''); out += `<span class="mini-icon" title="${attr(w)}" data-why="${attr(HL_INFO[g.hl].icon + ' ' + w)}">${HL_INFO[g.hl].icon}</span>`; }
  return out;
}
const HL_INFO = {
  romance:{icon:'💕', label:'Storia romantica'},
  bond:{icon:'🤝', label:'Legami e amicizia'},
  twist:{icon:'✨', label:'Trama sorprendente'},
  tears:{icon:'😭', label:'Fa piangere'},
  binge:{icon:'💉', label:'Ti fa dire «ancora un episodio»'}
};
function render(){
  const list = applyFilters();
  const tbody = document.getElementById('tbody'), emptyMsg = document.getElementById('emptyMsg');
  const cl = document.getElementById('countLine');
  if(cl){
    const first = cl.firstElementChild;
    const txt = `${list.length} risultati su ${ITEMS.filter(inActiveList).length}` + (lastSearchFuzzy ? ' · 🔎 nessun nome esatto: mostro i più simili' : '');
    if(first && first.id === 'countText') first.textContent = txt; else cl.textContent = txt;
  }
  const fc = document.getElementById('favCountLine'); if(fc) fc.textContent = FAVS.size ? `★ ${FAVS.size} preferiti` : '';
  const myRender = ++renderToken;
  if(rowObserver){ rowObserver.disconnect(); rowObserver = null; }
  updateOnlineHint(list.length);
  if(list.length === 0){ tbody.innerHTML = ''; emptyMsg.style.display = 'block'; return; }
  emptyMsg.style.display = 'none';
  const dnaP = state.sortKey === 'dna' && typeof buildTasteProfile === 'function' ? buildTasteProfile() : null;
  function buildRow(g){
    const tr = document.createElement('tr');
    const isFav = FAVS.has(g.id), st = STATUSES[g.id];
    const dnaBadge = (()=>{ if(!dnaP) return ''; const d = dnaForItem(g, dnaP); return d ? `<span class="dna-chip" style="color:${dnaColor(d.pct)}; border-color:${dnaColor(d.pct)};">${d.pct}%</span>` : ''; })();
    const sub = g.itn && g.itn !== g.name ? g.itn : (g.jp || '');
    tr.innerHTML = `
      <td class="fav" data-role="fav"><svg class="gi ${isFav ? '' : 'fav-off'}" viewBox="0 0 32 32" aria-label="${isFav ? 'Preferito' : 'Non preferito'}"><use href="#g-${isFav ? 'favon' : 'favoff'}"/></svg></td>
      <td class="rank mobhide">${g.rank || ''}</td>
      <td class="ttl">${thumbHtml(g)}<span class="ttl-tx">${st ? `<span class="status-dot ${STATUS_INFO[st].dot}" title="${statusLabel(g, st)}"></span>` : ''}${miniIcons(g)}<span class="ttl-name">${escHtml(g.name)}</span>${dnaBadge}${sub ? `<small class="row-sub">${escHtml(sub)}</small>` : ''}<small class="row-meta-m">${escHtml([g.year, lenText(g), g.who].filter(Boolean).join(' · '))}</small></span></td>
      <td class="plat mobhide">${escHtml(g.who || '')}</td>
      <td class="year mobhide">${escHtml(g.year || '')}</td>
      <td><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span></td>
      <td class="score">${g.score}</td>
      <td class="method mobhide" title="${methodLabel(g.m, g)}">${methodIcon(g.m)}</td>
      <td class="len mobhide">${escHtml(lenText(g))}</td>
      <td class="storyicon">${itBadge(g)}</td>`;
    tr.querySelector('[data-role="fav"]').addEventListener('click', (ev)=>{ ev.stopPropagation(); toggleFav(g.id); renderMetrics(); render(); });
    tr.addEventListener('click', ev=>{ const mi = ev.target.closest && ev.target.closest('.mini-icon'); if(mi && mi.dataset.why){ ev.stopPropagation(); showToast(mi.dataset.why, 5200); return; } openModal(g); });
    return tr;
  }
  const viewKey = JSON.stringify([state.search, [...state.tiers], state.method, state.decade, state.minTier, state.studio, state.onlyFavs, state.onlyLink, state.kind, state.len, state.air, [...state.tags], state.status, state.sortKey, state.sortDir, state.mood, ACTIVE_LIST]);
  const keepRows = viewKey === lastViewKey ? lastShownRows : 0;
  tbody.innerHTML = '';
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
  if(typeof onListRendered === 'function') onListRendered(list);
}
// «Non lo trovi? Cerca online»: compare quando la ricerca dà pochi risultati
function updateOnlineHint(n){
  let el = document.getElementById('onlineHint');
  const q = (state.search || '').trim();
  if(!q || n > 3 || state.view !== 'list'){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'onlineHint'; el.className = 'online-hint'; const cl = document.querySelector('.list-bar'); if(cl && cl.parentNode) cl.parentNode.insertBefore(el, cl.nextSibling); }
  el.innerHTML = `<span>Non trovi «${escHtml(q)}»?</span> <button class="btn primary" type="button" id="onlineHintBtn">🌐 Cerca su AniList e aggiungilo</button>`;
  document.getElementById('onlineHintBtn').onclick = ()=>{ if(typeof openOnlineSearch === 'function') openOnlineSearch(q); };
}
function updateArrows(){
  document.querySelectorAll('thead th').forEach(th=>{
    const arrow = th.querySelector('.arrow'); if(!arrow) return;
    const desc = th.dataset.key === 'tier' || th.dataset.key === 'rank' ? state.sortDir === 1 : state.sortDir === -1;
    arrow.textContent = (th.dataset.key === state.sortKey) ? (desc ? '▼' : '▲') : '';
  });
}
document.querySelectorAll('thead th[data-key]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.key;
    if(key === 'fav'){ if(state.sortKey === 'fav') state.sortDir *= -1; else { state.sortKey = 'fav'; state.sortDir = -1; } render(); return; }
    if(state.sortKey === key) state.sortDir *= -1;
    else { state.sortKey = key; state.sortDir = (key === 'score' || key === 'y' || key === 'len') ? -1 : 1; }
    render();
  });
});

// ---- Comandi dei filtri ----
let searchDebounceTimer = null;
document.getElementById('search').addEventListener('input', (e)=>{
  state.search = e.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(()=>{ if(state.view !== 'list') setView('list'); else render(); }, 150);
});
const SEL_MAP = {methodFilter:'method', decadeFilter:'decade', scoreFilter:'minTier', kindFilter:'kind', studioFilter:'studio', lenFilter:'len', airFilter:'air', statusFilter:'status'};
Object.keys(SEL_MAP).forEach(id=>{ const el = document.getElementById(id); if(el) el.addEventListener('change', e=>{ state[SEL_MAP[id]] = e.target.value; render(); syncQuick(); }); });
document.getElementById('favBtn').addEventListener('click', (e)=>{ state.onlyFavs = !state.onlyFavs; e.currentTarget.classList.toggle('active', state.onlyFavs); render(); syncQuick(); });
function resetFilters(){
  state = freshState();
  document.getElementById('search').value = '';
  Object.keys(SEL_MAP).forEach(id=>{ const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('favBtn').classList.remove('active');
  renderStats(); renderTagChips(); renderMoodChips(); render(); syncQuick();
}
document.getElementById('resetBtn').addEventListener('click', resetFilters);
document.getElementById('randomBtn').addEventListener('click', ()=>{
  const list = applyFilters(); const pool = list.length ? list : ITEMS.filter(inActiveList);
  if(pool.length) openModal(pool[Math.floor(Math.random() * pool.length)]);
});
document.getElementById('dnaSortBtn').addEventListener('click', ()=>{
  const p = buildTasteProfile();
  if(p.n < 2){ showToast('Segna qualche preferito o titolo completato prima: mi serve per capire i tuoi gusti'); return; }
  state.sortKey = 'dna'; state.sortDir = -1; if(state.view !== 'list') setView('list'); else render();
  showToast('Ordinato per affinità con i tuoi gusti');
});
document.getElementById('scrollTopBtn').addEventListener('click', ()=>{
  window.scrollTo({top:0, behavior:'smooth'});
  ['tableWrap','altView','myTierWrap','statsPanel','sagaPanel','discoverPanel','novitaPanel'].forEach(id=>{ const e = document.getElementById(id); if(e) e.scrollTo({top:0, behavior:'smooth'}); });
});
// filtri rapidi (i chip in cima al pannello) + numero di filtri attivi sul pulsante Filtri
const qfBox = document.getElementById('quickFilters'), qfBadge = document.getElementById('filtersBadge');
function setSel(id, v){ const el = document.getElementById(id); if(el){ el.value = v; el.dispatchEvent(new Event('change')); } }
function syncQuick(){
  const on = {fav: state.onlyFavs, done: state.status === 'done', now: state.status === 'now', plan: state.status === 'plan', top: state.minTier === 'S', short: state.len === 'short', link: state.onlyLink};
  if(qfBox) qfBox.querySelectorAll('[data-qf]').forEach(b=> b.classList.toggle('active', !!on[b.dataset.qf]));
  const n = [state.onlyFavs, state.status, state.minTier, state.studio, state.onlyLink, state.method, state.decade, state.mood, state.kind, state.len, state.air, state.tags.size, state.tiers.size].filter(Boolean).length;
  if(qfBadge){ qfBadge.hidden = !n; qfBadge.textContent = n; }
}
if(qfBox) qfBox.addEventListener('click', e=>{
  const b = e.target.closest('[data-qf]'); if(!b) return;
  const k = b.dataset.qf;
  if(k === 'fav') document.getElementById('favBtn').click();
  else if(k === 'done' || k === 'now' || k === 'plan') setSel('statusFilter', state.status === k ? '' : k);
  else if(k === 'top') setSel('scoreFilter', state.minTier === 'S' ? '' : 'S');
  else if(k === 'short') setSel('lenFilter', state.len === 'short' ? '' : 'short');
  else if(k === 'link'){ state.onlyLink = !state.onlyLink; render(); syncQuick(); }
  else if(k === 'reset') resetFilters();
});

// tema chiaro/scuro/automatico
const root = document.documentElement;
let themeState = lsGet('atl_theme', 'auto');
function applyTheme(){ if(themeState === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', themeState); }
applyTheme();
document.getElementById('themeBtn').addEventListener('click', ()=>{
  themeState = themeState === 'auto' ? 'light' : themeState === 'light' ? 'dark' : 'auto';
  lsSet('atl_theme', themeState); applyTheme();
  showToast(themeState === 'auto' ? 'Tema automatico (come il telefono)' : themeState === 'light' ? 'Tema chiaro' : 'Tema scuro');
});

// ---- Viste ----
function setView(v){
  state.view = v;
  document.querySelectorAll('.view-tab').forEach(t=> t.classList.toggle('active', t.dataset.view === v));
  const show = (id, on)=>{ const e = document.getElementById(id); if(e) e.style.display = on ? '' : 'none'; };
  show('tableWrap', v === 'list'); show('emptyMsg', false); show('myTierWrap', v === 'mytier'); show('statsPanel', v === 'stats');
  show('sagaPanel', v === 'saga'); show('discoverPanel', v === 'discover'); show('novitaPanel', v === 'novita');
  if(v === 'list') render();
  else if(v === 'mytier'){ renderStats(); renderMyTier(); }
  else if(v === 'stats') renderStatsPanel();
  else if(v === 'saga') renderSagaView();
  else if(v === 'discover') renderDiscoverView();
  else if(v === 'novita') renderNovitaView();
  if(v !== 'mytier') renderStats();
  updateOnlineHint(v === 'list' ? 99 : 99);
}
document.querySelectorAll('.view-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{ if(tab.dataset.view) setView(tab.dataset.view); else if(tab.dataset.ask && typeof openAsk === 'function') openAsk(); });
});

// ---- «La mia Tier List»: trascina i titoli tra i tier ----
let tierPickerEl = null;
function closeTierPicker(){ if(tierPickerEl){ tierPickerEl.remove(); tierPickerEl = null; } }
document.addEventListener('click', (e)=>{ if(tierPickerEl && !tierPickerEl.contains(e.target) && !e.target.closest('.movebtn')) closeTierPicker(); });
function openTierPicker(btn, gid){
  closeTierPicker();
  const rect = btn.getBoundingClientRect();
  const pop = document.createElement('div'); pop.className = 'tierpicker';
  pop.style.top = (rect.bottom + 4) + 'px';
  pop.style.left = Math.max(4, Math.min(window.innerWidth - 190, rect.left)) + 'px';
  TIERS_LIST.forEach(t=>{
    const b = document.createElement('button'); b.textContent = t;
    b.addEventListener('click', (ev)=>{ ev.stopPropagation(); moveToTier(gid, t); closeTierPicker(); });
    pop.appendChild(b);
  });
  document.body.appendChild(pop); tierPickerEl = pop;
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
    const sc = document.getElementById('myTierWrap');
    if(t.clientY < 130) (sc || window).scrollBy(0, -14); else if(t.clientY > innerHeight - 130) (sc || window).scrollBy(0, 14);
    ghost.style.visibility = 'hidden'; const el = document.elementFromPoint(t.clientX, t.clientY); ghost.style.visibility = '';
    const z = el && el.closest('.mytier-dropzone');
    if(z !== lastZone){ if(lastZone) lastZone.classList.remove('dragover'); if(z) z.classList.add('dragover'); lastZone = z; }
  }, {passive:false});
  chip.addEventListener('touchend', ()=>{ if(active && lastZone){ const tier = lastZone.dataset.tier; cleanup(); moveToTier(gid, tier); } else cleanup(); });
  chip.addEventListener('touchcancel', cleanup);
}
function renderMyTier(){
  const list = applyFilters();
  const q = mtNorm(mtQuery);
  const grouped = {}; TIERS_LIST.forEach(t=> grouped[t] = []);
  list.forEach(g=>{
    if(q && !mtNorm([g.name, g.jp, g.itn, (g.alt || []).join(' ')].join(' ')).includes(q)) return;
    const t = effectiveTier(g); (grouped[t] = grouped[t] || []).push(g);
  });
  const wrap = document.getElementById('myTierSections'); wrap.innerHTML = '';
  const jump = document.getElementById('mtJump'); if(jump) jump.innerHTML = '';
  let total = 0;
  TIERS_LIST.forEach(t=>{
    const items = grouped[t] || []; total += items.length;
    if(q && !items.length) return;
    if(jump) jump.insertAdjacentHTML('beforeend', `<button type="button" class="mt-jbtn" data-jt="${t}"><span class="badge ${TIER_LABEL[t]}">${t}</span> ${items.length}</button>`);
    const section = document.createElement('div');
    section.className = 'mytier-section' + (items.length ? '' : ' mt-empty');
    section.id = 'mt-sec-' + String(t).replace('+', 'plus');
    section.innerHTML = `<div class="mytier-section-head"><span class="badge big ${TIER_LABEL[t]}">${t}</span><span class="count">${items.length} titoli</span></div>`;
    const dz = document.createElement('div'); dz.className = 'mytier-dropzone'; dz.dataset.tier = t;
    items.sort((a, b)=> b.score - a.score).forEach(g=>{
      const chip = document.createElement('div');
      chip.className = 'mytier-chip'; chip.draggable = true;
      chip.innerHTML = `${thumbHtml(g)}<span class="nm" title="${escHtml(g.name)}">${escHtml(g.name)}</span><span class="sc">${g.score}</span><button class="movebtn" aria-label="Sposta">⇅</button>`;
      chip.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', String(g.id)); });
      chip.querySelector('.nm').addEventListener('click', ()=> openModal(g));
      chip.querySelector('.row-th').addEventListener('click', ()=> openModal(g));
      chip.querySelector('.movebtn').addEventListener('click', (e)=>{ e.stopPropagation(); openTierPicker(e.currentTarget, g.id); });
      mtEnableTouchDrag(chip, g.id);
      dz.appendChild(chip);
    });
    dz.addEventListener('dragover', (e)=>{ e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', ()=> dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e)=>{ e.preventDefault(); dz.classList.remove('dragover'); const id = e.dataTransfer.getData('text/plain'); if(id) moveToTier(id, t); });
    section.appendChild(dz); wrap.appendChild(section);
  });
  if(q && !total) wrap.innerHTML = '<div class="empty" style="padding:24px;text-align:center;">Nessun titolo trovato con questo nome.</div>';
}
(function(){
  const inp = document.getElementById('mtSearch'), clr = document.getElementById('mtClear'), jump = document.getElementById('mtJump');
  if(!inp) return;
  let h = 0;
  inp.addEventListener('input', ()=>{ clearTimeout(h); h = setTimeout(()=>{ mtQuery = inp.value; clr.hidden = !inp.value; renderMyTier(); }, 120); });
  clr.addEventListener('click', ()=>{ inp.value = ''; mtQuery = ''; clr.hidden = true; renderMyTier(); inp.focus(); });
  jump.addEventListener('click', e=>{ const b = e.target.closest('[data-jt]'); if(!b) return; const el = document.getElementById('mt-sec-' + String(b.dataset.jt).replace('+', 'plus')); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); });
})();
document.getElementById('resetMyTierBtn').addEventListener('click', ()=>{
  if(Object.keys(MYTIER).length && !confirm('Vuoi davvero azzerare la tua tier list personale e tornare alla classifica ufficiale?')) return;
  MYTIER = {}; saveMyTier(); renderMyTier(); showToast('Classifica personale azzerata');
});

// ---- Pannello filtri comprimibile ----
const filtersPanel = document.getElementById('filtersPanel'), filtersBtn = document.getElementById('filtersBtn');
let filtersOpen = lsGet('atl_filters_open', false) === true;
function applyFiltersPanelState(){ filtersPanel.classList.toggle('open', filtersOpen); filtersBtn.classList.toggle('active', filtersOpen); }
filtersBtn.addEventListener('click', ()=>{ filtersOpen = !filtersOpen; lsSet('atl_filters_open', filtersOpen); applyFiltersPanelState(); });
applyFiltersPanelState();

// link condivisibile
(function(){
  const linkInput = document.getElementById('shareLink'); if(!linkInput) return;
  linkInput.value = location.href.split('#')[0];
  document.getElementById('copyLinkBtn').addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(linkInput.value); showToast('Link copiato'); }
    catch(e){ linkInput.select(); try{ document.execCommand('copy'); showToast('Link copiato'); }catch(e2){ showToast('Copia manualmente il link qui sopra'); } }
  });
})();
