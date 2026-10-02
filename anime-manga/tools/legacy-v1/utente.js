// Utente: cronologia versioni, cambio profilo, esporta/importa i tuoi dati, verifica qualità dati.
// ---- Versione: DEVE coincidere con <meta name="build"> nell'HTML (lo controlla fx.js e tools/check-data.js) ----
const DATA_BUILD_DATE = '2026-09-30';
const DATA_BUILD_VERSION = 'a1';
// ---- «Novità del programma»: aggiungere una voce in cima a ogni aggiornamento ----
const CHANGELOG = [
  {version:'a1', date:'2026-09-30', items:[
    'Nasce Raccoon Tier — Anime & Manga: un programma tutto suo, separato dall\'app dei giochi (dati e salvataggi distinti: nessuna interferenza). Stesso stile «Aurora glass», stesse funzioni, riadattate a Anime, Film e Manga.',
    'Classifiche a tier S+…F di serie anime, film, manga e manhwa con i voti reali degli utenti di AniList (le stagioni di una serie sono fuse in un\'unica voce). Liste per tipo e per genere, filtri rapidi, ricerca tollerante agli errori, ricerca a voce, vista Tabella / Copertine / Schede.',
    'La mia Tier List con trascinamento (mouse e dito), immagine da condividere con le copertine, Scopri a carte da scorrere, «Cosa guardo stasera?», saghe con collegamento manga↔anime, confronto, affinità con i tuoi gusti (DNA), traguardi, wishlist con date di uscita, statistiche e molto altro.',
    'Novità da AniList (in onda, in arrivo, di tendenza), ricerca online per aggiungere qualunque titolo, Chiedi all\'AI (Gemini), Aggiorna info e Controllo dati con «Prima/Dopo» e approvazione, sincronizzazione tra dispositivi sul tuo GitHub.'
  ]}
];
const changelogBackdrop = document.getElementById('changelogBackdrop'), changelogCard = document.getElementById('changelogCard');
function openChangelog(){
  changelogCard.innerHTML = `
    <div class="modal-head"><div class="modal-title">🆕 Novità del programma</div><button class="modal-close" id="changelogCloseBtn" aria-label="Chiudi">✕</button></div>
    <div class="modal-note">Cronologia degli aggiornamenti, dal più recente.</div>
    <div class="changelog-list">${CHANGELOG.map(e=> `
      <div class="changelog-entry">
        <div class="changelog-entry-head"><span class="changelog-version">${escHtml(e.version)}</span><span class="changelog-date">${escHtml(e.date)}</span></div>
        <ul class="changelog-items">${e.items.map(i=> `<li>${escHtml(i)}</li>`).join('')}</ul>
      </div>`).join('')}</div>`;
  document.getElementById('changelogCloseBtn').addEventListener('click', closeChangelog);
  changelogBackdrop.classList.add('show');
}
function closeChangelog(){ changelogBackdrop.classList.remove('show'); }
document.getElementById('changelogBtn').addEventListener('click', openChangelog);
changelogBackdrop.addEventListener('click', (e)=>{ if(e.target === changelogBackdrop) closeChangelog(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && changelogBackdrop.classList.contains('show')) closeChangelog(); });

// ---- Profili ----
const PROFILE_RELOADERS = [];                       // altri file ci aggiungono le loro funzioni «ricarica i dati del profilo»
function switchProfile(id){
  if(id === ACTIVE_PROFILE_ID || !PROFILES.some(p=> p.id === id)) return;
  ACTIVE_PROFILE_ID = id; saveActiveProfileId();
  loadFavs(); loadStatuses(); loadMyTier(); loadPlatforms(); loadDiscoverSkipped(); loadLists();
  PROFILE_RELOADERS.forEach(f=>{ try{ f(); }catch(e){} });
  renderListBar(); renderMetrics(); renderStats();
  setView(state.view);
  showToast(`Ora stai usando il profilo "${currentProfile().name}"`);
}
const profileBackdrop = document.getElementById('profileBackdrop'), profileCard = document.getElementById('profileCard');
let profileEditingId = null;
function profileRowHtml(p){
  const isActive = p.id === ACTIVE_PROFILE_ID;
  if(profileEditingId === p.id){
    return `<div class="profile-row${isActive ? ' active' : ''}"><div class="profile-edit-row">
      <input type="text" id="profileEditInput" value="${escHtml(p.name)}" maxlength="24" placeholder="Nome..."><button class="btn primary" type="button" data-profile-save="${escHtml(p.id)}">✓</button></div></div>`;
  }
  const canDelete = p.id !== 'mario' && PROFILES.length > 1;
  return `<div class="profile-row${isActive ? ' active' : ''}">
    <button type="button" class="profile-name-btn" data-profile-switch="${escHtml(p.id)}">${escHtml(p.name)}</button>
    ${isActive ? '<span class="profile-active-badge">IN USO</span>' : ''}
    <div class="profile-row-actions"><button type="button" title="Rinomina" data-profile-rename="${escHtml(p.id)}">✏️</button>${canDelete ? `<button type="button" title="Rimuovi" data-profile-delete="${escHtml(p.id)}">🗑️</button>` : ''}</div>
  </div>`;
}
function openProfilePanel(){ profileEditingId = null; renderProfilePanel(); profileBackdrop.classList.add('show'); }
function closeProfilePanel(){ profileBackdrop.classList.remove('show'); profileEditingId = null; }
function renderProfilePanel(){
  profileCard.innerHTML = `
    <div class="modal-head"><div class="modal-title">👤 Profili</div><button class="modal-close" id="profileCloseBtn" aria-label="Chiudi">✕</button></div>
    <div class="modal-note">Ogni profilo ha i propri preferiti, stati, tier list, piattaforme e scelte in Scopri e Novità. Utile se anche altri usano questo dispositivo/link.</div>
    <div class="profile-list">${PROFILES.map(profileRowHtml).join('')}</div>
    <button class="btn profile-add-btn" type="button" id="profileAddBtn">➕ Aggiungi ospite</button>
    <div class="profile-note">I dati di «Mario» sono quelli principali. Un ospite può rinominarsi con la matita ✏️.</div>`;
  document.getElementById('profileCloseBtn').addEventListener('click', closeProfilePanel);
  document.getElementById('profileAddBtn').addEventListener('click', ()=>{ const p = {id: nextGuestId(), name: 'Ospite'}; PROFILES.push(p); saveProfiles(); profileEditingId = p.id; renderProfilePanel(); const inp = document.getElementById('profileEditInput'); if(inp){ inp.focus(); inp.select(); } });
  profileCard.querySelectorAll('[data-profile-switch]').forEach(btn=> btn.addEventListener('click', ()=>{ switchProfile(btn.dataset.profileSwitch); closeProfilePanel(); }));
  profileCard.querySelectorAll('[data-profile-rename]').forEach(btn=> btn.addEventListener('click', ()=>{ profileEditingId = btn.dataset.profileRename; renderProfilePanel(); const inp = document.getElementById('profileEditInput'); if(inp){ inp.focus(); inp.select(); } }));
  profileCard.querySelectorAll('[data-profile-delete]').forEach(btn=> btn.addEventListener('click', ()=>{
    const id = btn.dataset.profileDelete, p = PROFILES.find(x=> x.id === id); if(!p) return;
    if(!confirm(`Rimuovere il profilo «${p.name}» e tutti i suoi dati (preferiti, stati, tier list)?`)) return;
    PROFILES = PROFILES.filter(x=> x.id !== id); saveProfiles();
    PROFILE_KEYS.forEach(k=>{ try{ localStorage.removeItem(k + '__' + id); }catch(e){} });      // mai le chiavi di «mario»
    if(ACTIVE_PROFILE_ID === id) switchProfile('mario');
    showToast(`Profilo "${p.name}" rimosso`); renderProfilePanel();
  }));
  const saveBtn = profileCard.querySelector('[data-profile-save]');
  if(saveBtn) saveBtn.addEventListener('click', ()=>{
    const id = saveBtn.dataset.profileSave, inp = document.getElementById('profileEditInput');
    const name = (inp && inp.value.trim()) || 'Ospite';
    const p = PROFILES.find(x=> x.id === id); if(p) p.name = name.slice(0, 24);
    saveProfiles(); profileEditingId = null; renderProfilePanel();
    if(id === ACTIVE_PROFILE_ID) showToast(`Nome aggiornato: "${name}"`);
  });
  const editInput = document.getElementById('profileEditInput');
  if(editInput) editInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); const b = profileCard.querySelector('[data-profile-save]'); if(b) b.click(); } });
}
document.getElementById('profileBtn').addEventListener('click', openProfilePanel);
profileBackdrop.addEventListener('click', (e)=>{ if(e.target === profileBackdrop) closeProfilePanel(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && profileBackdrop.classList.contains('show')) closeProfilePanel(); });

// ---- Esporta / importa i tuoi dati: un file con tutto quello che vive solo su questo dispositivo ----
function exportPayload(){
  const data = {app: 'raccoon-tier-anime-manga', exportVersion: DATA_BUILD_VERSION, exportedAt: new Date().toISOString(), profile: currentProfile().name};
  data.favs = Array.from(FAVS); data.statuses = STATUSES; data.mytier = MYTIER; data.platforms = MY_PLATFORMS;
  data.lists = {sel: ACTIVE_LIST, mine: MY_LISTS};
  data.discoverSkipped = Array.from(DISCOVER_SKIPPED);
  data.wishlist = lsGet(profileKey('atl_wishlist'), {});
  data.customItems = ITEMS.filter(g=> g.custom).map(g=>{ const o = Object.assign({}, g); ['_q','_c','watch','ysort','year','hours','len','rank'].forEach(k=> delete o[k]); return o; });
  data.overrides = OVERRIDES;
  return data;
}
document.getElementById('exportDataBtn').addEventListener('click', ()=>{
  try{ downloadBlob(new Blob([JSON.stringify(exportPayload(), null, 2)], {type:'application/json'}), 'tier-list-anime-manga-dati-personali.json'); showToast('Dati scaricati'); }
  catch(e){ showToast('Esportazione non disponibile qui'); }
});
document.getElementById('importDataBtn').addEventListener('click', ()=> document.getElementById('importDataFile').click());
document.getElementById('importDataFile').addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const d = JSON.parse(reader.result);
      if(!d || (d.app && d.app !== 'raccoon-tier-anime-manga')) throw new Error('altro programma');
      if(Array.isArray(d.favs)){ FAVS = new Set(d.favs.map(String)); saveFavs(); }
      if(d.statuses && typeof d.statuses === 'object'){ STATUSES = d.statuses; saveStatuses(); }
      if(d.mytier && typeof d.mytier === 'object'){ MYTIER = d.mytier; saveMyTier(); }
      if(d.platforms && typeof d.platforms === 'object'){ MY_PLATFORMS = d.platforms; savePlatforms(); }
      if(d.lists && typeof d.lists === 'object'){ MY_LISTS = (d.lists.mine || []).filter(c=> TAG_INFO[c]); if(typeof d.lists.sel === 'string') ACTIVE_LIST = d.lists.sel; saveLists(); }
      if(Array.isArray(d.discoverSkipped)){ DISCOVER_SKIPPED = new Set(d.discoverSkipped.map(String)); saveDiscoverSkipped(); }
      if(d.wishlist && typeof d.wishlist === 'object') lsSet(profileKey('atl_wishlist'), d.wishlist);
      if(Array.isArray(d.customItems)){ const have = new Set(ITEMS.map(g=> g.id)); d.customItems.forEach(c=>{ if(c && c.id && !have.has(c.id)){ c.custom = true; prepItem(c); ITEMS.push(c); have.add(c.id); } }); reindex(); saveCustomItems(); }
      if(d.overrides && typeof d.overrides === 'object'){ OVERRIDES = Object.assign({}, OVERRIDES, d.overrides); lsSet('atl_overrides', OVERRIDES); applyOverrides(); ITEMS.forEach(prepItem); reindex(); }
      renderListBar(); renderMetrics(); renderStats(); setView(state.view);
      showToast('Dati importati con successo');
    }catch(err){ showToast('File non valido o di un altro programma'); }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ---- Verifica qualità dati: controllo locale (nessuna rete) ----
function runDataQualityCheck(){
  const report = {duplicateNames: [], duplicateIds: [], missingFields: [], orphans: 0, noStory: 0};
  const byIdMap = new Map(), byName = new Map();
  ITEMS.forEach(g=>{
    if(byIdMap.has(g.id)) report.duplicateIds.push({id: g.id, names: [byIdMap.get(g.id).name, g.name]}); else byIdMap.set(g.id, g);
    const key = searchCompact(g.name) + '|' + g.l;
    if(key.length > 2 && byName.has(key)) report.duplicateNames.push({name: g.name, ids: [byName.get(key).id, g.id]}); else byName.set(key, g);
    const problems = [];
    if(!g.name || !String(g.name).trim()) problems.push('nome mancante');
    if(!TIERS_LIST.includes(g.tier)) problems.push('tier non valido');
    if(g.score == null || isNaN(g.score) || g.score < 0 || g.score > 100) problems.push('voto mancante o fuori range');
    if(!LIST_BY_ID[g.l]) problems.push('tipo di lista sconosciuto');
    (g.tags || []).forEach(t=>{ if(!TAG_INFO[t]) problems.push('genere sconosciuto «' + t + '»'); });
    if(problems.length) report.missingFields.push({id: g.id, name: g.name || ('id ' + g.id), problems});
    if(!g.story) report.noStory++;
  });
  const ids = new Set(ITEMS.map(g=> g.id));
  [...FAVS, ...Object.keys(STATUSES), ...Object.keys(MYTIER)].forEach(id=>{ if(!ids.has(String(id))) report.orphans++; });
  return report;
}
const qualityBackdrop = document.getElementById('qualityBackdrop'), qualityCard = document.getElementById('qualityCard');
function openQualityCheck(){
  const r = runDataQualityCheck();
  const total = r.duplicateNames.length + r.duplicateIds.length + r.missingFields.length + r.orphans;
  const sec = (title, rows)=> rows.length ? `<div class="quality-section"><div class="quality-section-title">${title} (${rows.length})</div>${rows.join('')}</div>` : '';
  const row = (a, b)=> `<div class="quality-row"><span class="quality-row-label">${escHtml(a)}</span><span class="quality-note">${escHtml(b)}</span></div>`;
  const body = (total === 0
    ? `<div class="quality-ok"><div class="quality-ok-icon">✅</div><div><b>Tutto in ordine.</b><br>Nessun doppione, scheda incompleta o riferimento orfano nei tuoi ${ITEMS.length} titoli.</div></div>`
    : sec('⚠️ Nomi doppi', r.duplicateNames.map(d=> row(d.name, 'id ' + d.ids.join(' e ')))) + sec('⚠️ Id duplicati', r.duplicateIds.map(d=> row('id ' + d.id, d.names.join(' / ')))) + sec('⚠️ Schede incomplete', r.missingFields.map(d=> row(d.name, d.problems.join(', '))))
      + (r.orphans ? `<div class="quality-section"><div class="quality-section-title">🧹 Voci che puntano a titoli non più presenti (${r.orphans})</div><button class="btn" id="qualityCleanBtn" style="margin-top:8px;width:100%;">🧹 Pulisci queste voci</button></div>` : ''))
    + `<div class="quality-note" style="margin-top:10px;">Trame in italiano scritte: ${ITEMS.length - r.noStory}/${ITEMS.length}. Le altre si leggono da Wikipedia (pulsante nella scheda) o si scrivono man mano.</div>`;
  qualityCard.innerHTML = `<div class="modal-head"><div class="modal-title">🩺 Verifica qualità dati</div><button class="modal-close" id="qualityCloseBtn" aria-label="Chiudi">✕</button></div>
    <div class="modal-note">Controllo locale su doppioni e schede incomplete: non usa la rete né l'AI.</div>${body}`;
  document.getElementById('qualityCloseBtn').addEventListener('click', closeQualityCheck);
  const cb = document.getElementById('qualityCleanBtn');
  if(cb) cb.addEventListener('click', ()=>{
    const ids = new Set(ITEMS.map(g=> g.id));
    FAVS = new Set([...FAVS].filter(i=> ids.has(String(i)))); Object.keys(STATUSES).forEach(i=>{ if(!ids.has(i)) delete STATUSES[i]; }); Object.keys(MYTIER).forEach(i=>{ if(!ids.has(i)) delete MYTIER[i]; });
    saveFavs(); saveStatuses(); saveMyTier(); renderMetrics(); showToast('Voci orfane rimosse'); openQualityCheck();
  });
  qualityBackdrop.classList.add('show');
}
function closeQualityCheck(){ qualityBackdrop.classList.remove('show'); }
document.getElementById('qualityCheckBtn').addEventListener('click', openQualityCheck);
qualityBackdrop.addEventListener('click', (e)=>{ if(e.target === qualityBackdrop) closeQualityCheck(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && qualityBackdrop.classList.contains('show')) closeQualityCheck(); });
