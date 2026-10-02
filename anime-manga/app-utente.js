// Utente: changelog, cambio profilo, export/import, verifica qualità dati. Caricato dopo gli altri file app*.js nell'ordine: app, app-schede, app-utente, app-ai.
// ---- Changelog "Novità del programma": cronologia visibile delle versioni per Mario ----
// Aggiungere una riga in cima ogni volta che pubblico un aggiornamento, così la crescita del
// programma si vede anche dentro l'app, non solo nei messaggi di chat.
const CHANGELOG = [
  {version:'a3', date:'2026-10-02', time:'17:35', items:[
    'Tratti nuovi pensati per anime e manga (storia, colpi di scena, personaggi, crescita, amicizia, combattimenti, poteri, atmosfera, animazione, musica, comicità, toni rilassanti, isekai, mecha, sport e altri): calcolati per 2272 titoli su 2273',
    'Il tuo DNA dei gusti ora usa questi tratti al posto di quelli dei videogiochi'
  ]},
  {version:'a2', date:'2026-10-02', time:'15:05', items:[
    'Nuova base: l\'app è stata rifatta partendo dalla Tier List dei videogiochi v236, con tutte le sue funzioni (cervello dei gusti, DNA, Sintonia, scheda in 3 parti, temi grafici, voce, Update+, profili, sincronizzazione) adattate ad anime, film, manga e animazione.',
    'Cinque classifiche sempre in vista: 📺 Anime, 🎞️ Film anime, 🏰 Animazione (Disney, Pixar, DreamWorks, Illumination, Sony, Warner, Blue Sky, Laika, Aardman…), 📚 Manga e 📱 Manhwa, più «Tutti». Da «Generi e studi» apri la classifica di un genere o di uno studio.',
    'Voti verificati da AniList (anime e manga) e IMDb (film): il logo accanto al voto dice da dove arriva.',
    'Grafica nuova: la mascotte Frugu in versione anime, logo, icone dell\'app e apertura animata con la luna e i petali di ciliegio.',
  ]},
  {version:'a1', date:'2026-09-30', time:'00:20', items:[
    'Prima versione dell\'app Anime e Manga: 2273 titoli da AniList, IMDb e Wikidata, tier calcolati per ogni tipo di lista.',
  ]},
];
const changelogBackdrop = document.getElementById('changelogBackdrop');
const changelogCard = document.getElementById('changelogCard');
function openChangelog(){
  changelogCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">🆕 News del programma</div>
      <button class="modal-close" id="changelogCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="lp-tools" style="margin:8px 0"><button class="btn primary" id="rtRestartBtn" title="Ricarica subito il programma con l'ultima versione, senza filmato iniziale">🔄 Riavvia e aggiorna</button></div>
    <div class="modal-note">Cronologia degli ultimi aggiornamenti, dal più recente.</div>
    <div class="changelog-list">${CHANGELOG.map(e=> `
      <div class="changelog-entry">
        <div class="changelog-entry-head"><span class="changelog-version">${escHtml(e.version)}</span><span class="changelog-date">${escHtml(e.date.split('-').reverse().join('/'))}${e.time ? ' · ore ' + escHtml(e.time) : ''}</span></div>
        <ul class="changelog-items">${e.items.map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>
      </div>`).join('')}</div>
  `;
  document.getElementById('changelogCloseBtn').addEventListener('click', closeChangelog);
  document.getElementById('rtRestartBtn').addEventListener('click', async ()=>{
    // riavvio veloce: niente filmato iniziale e cache dell'app svuotata, così si aggancia subito l'ultimo aggiornamento
    try{ sessionStorage.setItem('atl_intro_seen', '1'); }catch(e){}
    try{ showToast('Riavvio…', 1500); }catch(e){}
    try{ const regs = navigator.serviceWorker && await navigator.serviceWorker.getRegistrations(); if(regs) await Promise.all(regs.map(r=> r.update().catch(()=>{}))); }catch(e){}
    try{ const ks = window.caches && await caches.keys(); if(ks) await Promise.all(ks.filter(k=> /^raccoon-anime/.test(k)).map(k=> caches.delete(k))); }catch(e){}
    location.reload();
  });
  changelogBackdrop.classList.add('show');
}
function closeChangelog(){ changelogBackdrop.classList.remove('show'); }
document.getElementById('changelogBtn').addEventListener('click', openChangelog);
changelogBackdrop.addEventListener('click', (e)=>{ if(e.target===changelogBackdrop) closeChangelog(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && changelogBackdrop.classList.contains('show')) closeChangelog(); });

// ---- Profili utente: passa da un profilo all'altro e ricarica tutti i dati personali di quel profilo ----
function switchProfile(id){
  if(id === ACTIVE_PROFILE_ID) return;
  if(!PROFILES.some(p=>p.id===id)) return;
  ACTIVE_PROFILE_ID = id;
  saveActiveProfileId();
  loadFavs(); loadStatuses(); loadMyTier(); loadMySubs(); loadDiscoverSkipped(); loadLists(); renderListBar();
  loadNovitaSkipped(); loadNovitaSkippedDetails(); loadNovitaGenreSelected(); loadNovitaGenreOther();
  // Le proposte di Novità già in corso appartengono al profilo precedente: si riparte da capo.
  novitaQueue = []; novitaIdx = 0; novitaErrorMsg = null; novitaEverFetched = false; novitaSkippedListOpen = false;
  novitaGenreQueue = []; novitaGenreIdx = 0; novitaGenreErrorMsg = null; novitaGenreEverFetched = false; novitaGenreSkippedListOpen = false;
  renderMetrics(); renderStats();
  setView(state.view);
  showToast(`Ora stai usando il profilo "${currentProfile().name}"`);
}
const profileBackdrop = document.getElementById('profileBackdrop');
const profileCard = document.getElementById('profileCard');
let profileEditingId = null;
function profileRowHtml(p){
  const isActive = p.id === ACTIVE_PROFILE_ID;
  if(profileEditingId === p.id){
    return `<div class="profile-row${isActive?' active':''}">
      <div class="profile-edit-row">
        <input type="text" id="profileEditInput" value="${escHtml(p.name)}" maxlength="24" placeholder="Nome...">
        <button class="btn primary" type="button" data-profile-save="${escHtml(p.id)}">✓</button>
      </div>
    </div>`;
  }
  const canDelete = p.id !== 'mario' && PROFILES.length > 1;
  return `<div class="profile-row${isActive?' active':''}">
    <button type="button" class="profile-name-btn" data-profile-switch="${escHtml(p.id)}">${escHtml(p.name)}</button>
    ${isActive ? '<span class="profile-active-badge">IN USO</span>' : ''}
    <div class="profile-row-actions">
      <button type="button" title="Rinomina" data-profile-rename="${escHtml(p.id)}">✏️</button>
      ${canDelete ? `<button type="button" title="Rimuovi" data-profile-delete="${escHtml(p.id)}">🗑️</button>` : ''}
    </div>
  </div>`;
}
function openProfilePanel(){
  profileEditingId = null;
  renderProfilePanel();
  profileBackdrop.classList.add('show');
}
function closeProfilePanel(){ profileBackdrop.classList.remove('show'); profileEditingId = null; }
function renderProfilePanel(){
  profileCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">👤 Profili</div>
      <button class="modal-close" id="profileCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="modal-note">Ogni profilo ha i propri preferiti, stati, tier list e proposte scartate. Utile se anche altri usano questo stesso dispositivo/link.</div>
    <div class="profile-list">${PROFILES.map(profileRowHtml).join('')}</div>
    <button class="btn profile-add-btn" type="button" id="profileAddBtn">➕ Aggiungi ospite</button>
    <div class="profile-note">I dati di "Mario" restano quelli di sempre. Un ospite può rinominarsi con la matita ✏️.</div>
  `;
  document.getElementById('profileCloseBtn').addEventListener('click', closeProfilePanel);
  document.getElementById('profileAddBtn').addEventListener('click', ()=>{
    const p = {id: nextGuestId(), name: 'Ospite'};
    PROFILES.push(p);
    saveProfiles();
    profileEditingId = p.id;
    renderProfilePanel();
  });
  profileCard.querySelectorAll('[data-profile-switch]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ switchProfile(btn.dataset.profileSwitch); closeProfilePanel(); });
  });
  profileCard.querySelectorAll('[data-profile-rename]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ profileEditingId = btn.dataset.profileRename; renderProfilePanel(); const inp=document.getElementById('profileEditInput'); if(inp){ inp.focus(); inp.select(); } });
  });
  profileCard.querySelectorAll('[data-profile-delete]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.profileDelete;
      const p = PROFILES.find(x=>x.id===id);
      if(!p) return;
      PROFILES = PROFILES.filter(x=>x.id!==id);
      saveProfiles();
      // Pulizia: rimuove anche i dati salvati di quell'ospite (chiavi con suffisso, mai quelle di "mario").
      ['atl_favs','atl_status','atl_mytier','atl_my_subs','atl_discover_skipped','atl_novita_skipped','atl_novita_skipped_details','atl_novita_genre_selected','atl_novita_genre_other'].forEach(k=>{
        try{ localStorage.removeItem(k + '__' + id); }catch(e){}
      });
      if(ACTIVE_PROFILE_ID === id) switchProfile('mario');
      showToast(`Profilo "${p.name}" rimosso`);
      renderProfilePanel();
    });
  });
  const saveBtn = profileCard.querySelector('[data-profile-save]');
  if(saveBtn) saveBtn.addEventListener('click', ()=>{
    const id = saveBtn.dataset.profileSave;
    const inp = document.getElementById('profileEditInput');
    const name = (inp && inp.value.trim()) || 'Ospite';
    const p = PROFILES.find(x=>x.id===id);
    if(p) p.name = name.slice(0,24);
    saveProfiles();
    profileEditingId = null;
    renderProfilePanel();
    if(id===ACTIVE_PROFILE_ID) showToast(`Nome aggiornato: "${name}"`);
  });
  const editInput = document.getElementById('profileEditInput');
  if(editInput) editInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const b=profileCard.querySelector('[data-profile-save]'); if(b) b.click(); } });
}
document.getElementById('profileBtn').addEventListener('click', openProfilePanel);
profileBackdrop.addEventListener('click', (e)=>{ if(e.target===profileBackdrop) closeProfilePanel(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && profileBackdrop.classList.contains('show')) closeProfilePanel(); });

// ---- Export / import dati personali ----
// Rete di sicurezza indipendente dal database cloud: un file scaricabile con tutto quello che
// oggi vive solo su questo dispositivo/browser (preferiti, stati, la tua tier list, abbonamenti,
// scartati di Novità). I giochi aggiunti tramite Novità/Chiedi a Claude sono già al sicuro nel
// database cloud del tuo account: qui li includiamo solo come istantanea leggibile, non li
// tocchiamo mai in fase di importazione, per non rischiare doppioni o conflitti.
document.getElementById('exportDataBtn').addEventListener('click', async ()=>{
  const data = {
    favs: Array.from(FAVS),
    statuses: STATUSES,
    mytier: MYTIER,
    mySubs: MY_SUBS,
    novitaSkipped: Array.from(NOVITA_SKIPPED),
    novitaSkippedDetails: NOVITA_SKIPPED_DETAILS,
    customGamesSnapshot: GAMES.filter(g=>g.custom).map(g=>({id:g.id, name:g.name, plat:g.plat, year:g.year, tier:g.tier, score:g.score, tags:g.tags, story:g.story})),
    exportedAt: new Date().toISOString(),
    exportVersion: DATA_BUILD_VERSION
  };
  const json = JSON.stringify(data, null, 2);
  const filename = 'tier-list-jrpg-dati-personali.json';
  const cap = await getDownloadsCap();
  if(cap){
    try{ await cap.save({filename, data: new Blob([json], {type:'application/json'})}); showToast('Dati esportati'); return; }
    catch(e){}
  }
  try{
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('Dati scaricati');
  }catch(e){ showToast('Esportazione non disponibile qui'); }
});
document.getElementById('importDataBtn').addEventListener('click', ()=>{
  document.getElementById('importDataFile').click();
});
document.getElementById('importDataFile').addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data.favs)) FAVS = new Set(data.favs);
      if(data.statuses && typeof data.statuses==='object') STATUSES = data.statuses;
      if(data.mytier && typeof data.mytier==='object') MYTIER = data.mytier;
      if(data.mySubs && typeof data.mySubs==='object') MY_SUBS = data.mySubs;
      if(Array.isArray(data.novitaSkipped)) NOVITA_SKIPPED = new Set(data.novitaSkipped);
      if(data.novitaSkippedDetails && typeof data.novitaSkippedDetails==='object') NOVITA_SKIPPED_DETAILS = data.novitaSkippedDetails;
      saveFavs(); saveStatuses(); saveMyTier(); saveMySubs(); saveNovitaSkipped(); saveNovitaSkippedDetails();
      renderMetrics(); renderStats(); render(); renderMyTier();
      showToast('Dati importati con successo');
    }catch(err){ showToast('File non valido o corrotto'); }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ---- Verifica qualità dati: controllo locale (NESSUNA chiamata a Claude, non consuma limiti) ----
// Cerca doppioni, schede con campi mancanti/non validi, e voci "Scartati" ormai obsolete
// (un titolo scartato in passato ma poi entrato comunque nel database in un altro modo).
// ---- Affidabilità dei dati di una scheda (0-100): quanto è completa e verificata ----
function dataScore(g, ctx){
  ctx = ctx || {};
  const au = ctx.au || (function(){ try{ return JSON.parse(localStorage.getItem('atl_audit') || '{}') || {}; }catch(e){ return {}; } })();
  const ck = ctx.ck || (function(){ try{ return JSON.parse(localStorage.getItem('atl_info_checked') || '{}') || {}; }catch(e){ return {}; } })();
  const l = g.label || {}, e = g.enrich || {}, miss = [];
  let pts = 0;
  if(g.m === 'V') pts += 20; else miss.push('voto verificato (ora è una stima)');
  if(['D', 'S', 'F', 'N'].includes(l.it)) pts += 15; else miss.push('lingua italiana');
  if(l.h || e.hoursMain) pts += 10; else miss.push('durata');
  const sl = String(g.story || '').length;
  if(sl >= 250) pts += 15; else if(sl >= 120){ pts += 8; miss.push('trama più ricca'); } else miss.push('trama');
  if((g.proscons && g.proscons.pros && g.proscons.pros.length) || (e.pros && e.pros.length)) pts += 10; else miss.push('pro e contro');
  if(e.eraScore != null || e.agingNote || e.gameplayNote) pts += 10; else miss.push('analisi (come regge oggi, gameplay)');
  const facts = window.SearchHub && SearchHub.factsFor ? SearchHub.factsFor(g) : null;
  if((au[g.id] && au[g.id].deep) || ck[g.id] || facts) pts += 20; else miss.push('controllo su fonti esterne');
  return {pct: pts, miss};
}
function dataScoreHtml(g){
  const d = dataScore(g), col = d.pct >= 80 ? '#16a34a' : d.pct >= 55 ? '#ca8a04' : '#dc2626';
  return `<div class="ds-chip" title="${d.miss.length ? 'Manca: ' + d.miss.join(', ') : 'Scheda completa e verificata'}"><span class="ds-ring" style="--p:${d.pct}; --c:${col}"></span><span>Affidabilità dei dati <b>${d.pct}%</b>${d.miss.length ? '<small> · manca: ' + d.miss.slice(0, 3).join(', ') + '</small>' : ''}</span></div>`;
}
function runDataQualityCheck(){
  const report = { duplicateNames: [], duplicateIds: [], missingFields: [], staleSkips: [] };
  const byId = new Map();
  const byName = new Map();
  GAMES.forEach(g=>{
    if(byId.has(g.id)) report.duplicateIds.push({id: g.id, names: [byId.get(g.id).name, g.name]});
    else byId.set(g.id, g);
    const key = String(g.name||'').toLowerCase().trim();
    if(!key) return;
    if(byName.has(key)) report.duplicateNames.push({name: g.name, ids: [byName.get(key).id, g.id]});
    else byName.set(key, g);
  });
  GAMES.forEach(g=>{
    const problems = [];
    if(!g.name || !String(g.name).trim()) problems.push('nome mancante');
    if(!TIERS_LIST.includes(g.tier)) problems.push('tier non valido');
    if(g.score==null || isNaN(g.score) || g.score<0 || g.score>100) problems.push('voto mancante o fuori range');
    if(problems.length) report.missingFields.push({id:g.id, name:g.name||('id '+g.id), problems});
  });
  const gameNames = new Set(GAMES.map(g=> String(g.name||'').toLowerCase().trim()));
  Object.keys(NOVITA_SKIPPED_DETAILS).forEach(k=>{
    if(gameNames.has(k)) report.staleSkips.push(k);
  });
  return report;
}
const qualityBackdrop = document.getElementById('qualityBackdrop');
const qualityCard = document.getElementById('qualityCard');
function openQualityCheck(){
  const report = runDataQualityCheck();
  const total = report.duplicateNames.length + report.duplicateIds.length + report.missingFields.length + report.staleSkips.length;
  let body;
  if(total===0){
    body = `<div class="quality-ok"><div class="quality-ok-icon">✅</div><div><b>Tutto in ordine.</b><br>Nessun doppione, scheda incompleta o voce da sistemare trovata nei tuoi ${GAMES.length} giochi.</div></div>`;
  } else {
    const sections = [];
    if(report.duplicateNames.length) sections.push(`<div class="quality-section">
        <div class="quality-section-title">⚠️ Nomi doppi (${report.duplicateNames.length})</div>
        ${report.duplicateNames.map(d=>`<div class="quality-row"><span class="quality-row-label">${escHtml(d.name)}</span><span class="quality-note">id ${escHtml(d.ids.join(' e '))}</span></div>`).join('')}
      </div>`);
    if(report.duplicateIds.length) sections.push(`<div class="quality-section">
        <div class="quality-section-title">⚠️ Id duplicati (${report.duplicateIds.length})</div>
        ${report.duplicateIds.map(d=>`<div class="quality-row"><span class="quality-row-label">id ${escHtml(String(d.id))}</span><span class="quality-note">${escHtml(d.names.join(' / '))}</span></div>`).join('')}
      </div>`);
    if(report.missingFields.length) sections.push(`<div class="quality-section">
        <div class="quality-section-title">⚠️ Schede incomplete (${report.missingFields.length})</div>
        ${report.missingFields.map(d=>`<div class="quality-row"><span class="quality-row-label">${escHtml(d.name)}</span><span class="quality-note">${escHtml(d.problems.join(', '))}</span></div>`).join('')}
      </div>`);
    if(report.staleSkips.length) sections.push(`<div class="quality-section">
        <div class="quality-section-title">🧹 Scartati non più necessari (${report.staleSkips.length})</div>
        <div class="quality-note">Titoli scartati in passato in "Novità" ma ormai comunque presenti nel database: la voce in "Scartati" è superflua.</div>
        ${report.staleSkips.map(k=>`<div class="quality-row"><span class="quality-row-label">${escHtml((NOVITA_SKIPPED_DETAILS[k]&&NOVITA_SKIPPED_DETAILS[k].name)||k)}</span></div>`).join('')}
        <button class="btn" id="qualityCleanStaleBtn" style="margin-top:8px; width:100%;">🧹 Pulisci queste voci scartate</button>
      </div>`);
    body = sections.join('');
  }
  qualityCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">🩺 Verifica qualità dati</div>
      <button class="modal-close" id="qualityCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="modal-note">Controllo locale su doppioni e schede incomplete: NON usa Claude e non consuma nulla dei tuoi limiti.</div>
    ${body}
  `;
  document.getElementById('qualityCloseBtn').addEventListener('click', closeQualityCheck);
  const cleanBtn = document.getElementById('qualityCleanStaleBtn');
  if(cleanBtn) cleanBtn.addEventListener('click', ()=>{
    report.staleSkips.forEach(k=>{ delete NOVITA_SKIPPED_DETAILS[k]; NOVITA_SKIPPED.delete(k); });
    saveNovitaSkipped(); saveNovitaSkippedDetails();
    showToast('Voci scartate obsolete rimosse');
    openQualityCheck();
  });
  qualityBackdrop.classList.add('show');
}
function closeQualityCheck(){ qualityBackdrop.classList.remove('show'); }
document.getElementById('qualityCheckBtn').addEventListener('click', openQualityCheck);
qualityBackdrop.addEventListener('click', (e)=>{ if(e.target===qualityBackdrop) closeQualityCheck(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && qualityBackdrop.classList.contains('show')) closeQualityCheck(); });

// ---- Chiedi a Claude: chat integrata sul database personale ----
let askSample = null;
let askImagesSupported = false;
let askHistory = []; // {role:'user'|'assistant', content:string}
let askPendingImage = null;
let askController = null;
let askBusy = false;
let askStreamingText = null;

function askTagMatches(gTags, wanted){
  const w = String(wanted||'').toLowerCase().trim();
  if(!w) return false;
  return gTags.some(t=>{
    if(t.toLowerCase()===w) return true;
    const label = TAG_INFO[t] ? TAG_INFO[t].label.toLowerCase() : '';
    return label && (label.includes(w) || w.includes(label));
  });
}
function askGameCard(g, profile){
  const dna = dnaForGame(g, profile);
  return {
    id: g.id, name: g.name, plat: g.plat, year: g.year, tier: g.tier, score: g.score,
    tags: g.tags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t),
    status: STATUSES[g.id] || null,
    favorite: FAVS.has(g.id),
    oneLiner: (g.label && g.label.ok) || null,
    avoidIf: (g.label && g.label.ko) || null,
    hoursMain: (g.label && g.label.h!=null) ? g.label.h : (g.enrich ? g.enrich.hoursMain : null),
    dnaMatchPct: dna ? dna.pct : null
  };
}
function askToolSearchGames(input){
  input = input || {};
  const q = String(input.query||'').toLowerCase().trim();
  const tagFilter = Array.isArray(input.tags) ? input.tags.map(String) : (input.tag ? [String(input.tag)] : []);
  const tierFilter = input.tier ? String(input.tier).toUpperCase() : null;
  const minScore = input.minScore!=null && input.minScore!=='' ? Number(input.minScore) : null;
  const favoritesOnly = !!input.favoritesOnly;
  const statusFilter = input.status ? String(input.status) : null;
  const limit = Math.max(1, Math.min(20, parseInt(input.limit,10) || 10));
  const profile = buildTasteProfile();
  let pool = GAMES;
  if(q) pool = pool.filter(g=> g.name.toLowerCase().includes(q));
  if(tagFilter.length) pool = pool.filter(g=> tagFilter.some(t=> askTagMatches(g.tags, t)));
  if(tierFilter) pool = pool.filter(g=> g.tier === tierFilter);
  if(minScore!=null && !isNaN(minScore)) pool = pool.filter(g=> g.score >= minScore);
  if(favoritesOnly) pool = pool.filter(g=> FAVS.has(g.id));
  if(statusFilter) pool = pool.filter(g=> STATUSES[g.id] === statusFilter);
  const scored = pool.map(g=>({g, dna: dnaForGame(g, profile)}));
  scored.sort((a,b)=>{
    if(a.dna && b.dna) return b.dna.pct - a.dna.pct;
    if(a.dna && !b.dna) return -1;
    if(!a.dna && b.dna) return 1;
    return b.g.score - a.g.score;
  });
  const results = scored.slice(0, limit).map(({g})=> askGameCard(g, profile));
  return {count: results.length, totalMatching: pool.length, results};
}
function askToolGetGameDetails(input){
  const id = parseInt(input && input.id, 10);
  const g = GAMES.find(x=>x.id===id);
  if(!g) return {error: 'Nessun gioco con id ' + id + ' nel database.'};
  const profile = buildTasteProfile();
  const dna = dnaForGame(g, profile);
  return {
    id: g.id, name: g.name, plat: g.plat, year: g.year, tier: g.tier, score: g.score,
    tags: g.tags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t),
    story: g.story || null,
    status: STATUSES[g.id] || null,
    favorite: FAVS.has(g.id),
    dnaMatchPct: dna ? dna.pct : null,
    dnaWhy: dna ? matchWhy(dna, g) : null,
    label: g.label || null,
    market: g.market || null,
    enrichSummary: g.enrich ? {
      whyLikeIt: g.enrich.whyLikeIt || null,
      pros: g.enrich.pros || null,
      cons: g.enrich.cons || null,
      hoursMain: g.enrich.hoursMain || null,
      hoursCompletionist: g.enrich.hoursCompletionist || null,
      todayScore: g.enrich.todayScore || null,
      gameplayNote: g.enrich.gameplayNote || null,
      language: g.enrich.language || null
    } : null
  };
}
function askToolGetTasteProfile(){
  const liked = GAMES.filter(g=> FAVS.has(g.id) || STATUSES[g.id]==='played' || STATUSES[g.id]==='playing');
  const dropped = GAMES.filter(g=> STATUSES[g.id]==='dropped');
  const profile = buildTasteProfile();
  const topTags = Object.entries(profile.tagScore).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([t])=> TAG_INFO[t] ? TAG_INFO[t].label : t);
  return {
    favoritesCount: FAVS.size,
    likedGames: liked.slice(0,15).map(g=>({id:g.id, name:g.name, tier:g.tier})),
    droppedGames: dropped.slice(0,10).map(g=>({id:g.id, name:g.name})),
    topTags,
    avgLikedScore: liked.length ? Math.round(profile.avgScore) : null,
    note: profile.n < 2 ? 'Mario non ha ancora segnato abbastanza giochi come preferiti/giocati per calcolare un profilo affidabile.' : null
  };
}
function askToolSetFavorite(input){
  const id = parseInt(input && input.id, 10);
  const g = GAMES.find(x=>x.id===id);
  if(!g) throw new Error('id gioco non trovato: ' + id);
  const value = (input.value===undefined || input.value===null) ? !FAVS.has(id) : !!input.value;
  if(value) FAVS.add(id); else FAVS.delete(id);
  saveFavs(); renderMetrics(); render();
  if(currentModalGame && currentModalGame.id===id && modalBackdrop.classList.contains('show')) openModal(currentModalGame);
  showToast(value ? `⭐ ${g.name} aggiunto ai preferiti` : `${g.name} rimosso dai preferiti`);
  return {id, name: g.name, favorite: value};
}
function askToolSetStatus(input){
  const id = parseInt(input && input.id, 10);
  const g = GAMES.find(x=>x.id===id);
  if(!g) throw new Error('id gioco non trovato: ' + id);
  let status = input.status ? String(input.status).trim() : '';
  const valid = ['played','playing','backlog','dropped'];
  if(status && !valid.includes(status)) throw new Error('status non valido, usa uno tra: ' + valid.join(', ') + ' oppure stringa vuota per rimuovere lo stato');
  if(!status){ delete STATUSES[id]; }
  else { STATUSES[id] = status; }
  saveStatuses(); renderMetrics(); render();
  if(currentModalGame && currentModalGame.id===id && modalBackdrop.classList.contains('show')) openModal(currentModalGame);
  showToast(status ? `${g.name}: stato "${STATUS_INFO[status].label}"` : `${g.name}: stato rimosso`);
  return {id, name: g.name, status: status || null};
}
let ASK_LOG_LOCAL = [];
try{ const s = localStorage.getItem('atl_ask_requests'); if(s) ASK_LOG_LOCAL = JSON.parse(s); }catch(e){ ASK_LOG_LOCAL = []; }
function askToolLogMissingGame(input){
  const name = String((input && input.name) || '').trim();
  if(!name) throw new Error('serve il nome del gioco da registrare');
  const entry = {
    name,
    plat: input.plat ? String(input.plat) : null,
    reason: input.reason ? String(input.reason) : null,
    askedAt: new Date().toISOString()
  };
  if(COVER_DB){
    try{ COVER_DB.collection('askRequests').add(entry).catch(()=>{}); }catch(e){}
  } else {
    ASK_LOG_LOCAL.push(entry);
    try{ localStorage.setItem('atl_ask_requests', JSON.stringify(ASK_LOG_LOCAL)); }catch(e){}
  }
  showToast(`📝 Segnato "${name}" da aggiungere al database`);
  return {logged: true, name};
}
