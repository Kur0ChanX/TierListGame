// Schede: copertina, scheda titolo, «A colpo d'occhio», dove guardarlo/leggerlo, affinità (DNA), confronto, CSV, saghe, Scopri e wizard.
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const wizardBackdrop = document.getElementById('wizardBackdrop');
const wizardCard = document.getElementById('wizardCard');
let currentModalItem = null;

// ---- Copertina (immagini AniList: se una non si carica resta il riquadro colorato col titolo) ----
const WIKI_W = {small: 120, medium: 250, large: 330};
let WPIMG = lsGet('atl_wpimg', {});                                   // locandine trovate su Wikipedia: {titolo voce: percorso con {w}}
function coverUrl(g, size){
  if(g.imgUrl) return g.imgUrl;
  if(g.img){ const type = String(g.id)[0] === 'a' ? 'anime' : 'manga'; return `https://s4.anilist.co/file/anilistcdn/media/${type}/cover/${size || 'large'}/${g.img}`; }
  const pu = g.pu || (g.enw && WPIMG[g.enw]);
  if(pu) return 'https://upload.wikimedia.org/wikipedia/' + String(pu).replace('{w}', WIKI_W[size] || 250);
  return null;
}
function coverPlaceholderHtml(g){
  const st = g.stk && STUDIO_INFO[g.stk];
  return `<div class="modal-cover placeholder-cover" style="--tc:${escHtml(g.c || TIER_COL[g.tier] || '#7c5cff')}"><i>${st ? st.i : (KIND_ICON[g.l] || '🎬')}</i><span>${escHtml(g.name)}</span></div>`;
}
function coverHtml(g){
  const url = coverUrl(g, 'large');
  return url ? `<img class="modal-cover" src="${escHtml(url)}" alt="Copertina di ${escHtml(g.name)}" decoding="async" referrerpolicy="no-referrer">` : coverPlaceholderHtml(g);
}
function wireCover(g){
  const img = modalCard.querySelector('img.modal-cover'); if(!img) return;
  img.addEventListener('error', ()=>{ img.outerHTML = coverPlaceholderHtml(g); }, {once:true});
  img.addEventListener('click', ()=> openLightbox(img.src, img.alt));
}

// ---- «A colpo d'occhio»: valori derivati da generi e durata (modificabili con g.gl = {ac, dk, dp, em, pc}) ----
function glanceOf(g){
  const t = new Set(g.tags || []), has = (...c)=> c.some(x=> t.has(x));
  let ac = 2 + (has('ACT') ? 1 : 0) + (has('MAR', 'MEC', 'SPO', 'POW', 'SUR') ? 1 : 0) + (has('MIL', 'SCI') ? 0.5 : 0) - (has('SOL', 'IYA', 'ROM') ? 1 : 0) - (has('PSY', 'MYS') && !has('ACT') ? 0.5 : 0);
  let dk = 2 + (has('HOR', 'GOR') ? 1.5 : 0) + (has('PSY', 'THR', 'DYS', 'SUR') ? 1 : 0) + (has('SEI') ? 0.5 : 0) + (has('MIL') ? 0.5 : 0) - (has('COM', 'IYA', 'SOL', 'KID', 'MAH') ? 1.2 : 0);
  let dp = 2.5 + (has('PSY', 'MYS') ? 1 : 0) + (has('SCI', 'HIS', 'DYS') ? 0.5 : 0) + (has('SEI') ? 0.5 : 0) + (g.score >= 84 ? 0.5 : 0) - (has('COM', 'ECC', 'HAR', 'KID') && !has('DRA') ? 0.8 : 0);
  let em = 2 + (has('DRA') ? 1 : 0) + (has('ROM') ? 0.8 : 0) + (has('SOL') && has('DRA') ? 0.5 : 0) + (g.hl === 'tears' ? 1.5 : 0) + (g.hl === 'bond' ? 0.5 : 0) - (has('ECC', 'HAR', 'GAM') ? 0.6 : 0);
  const clamp = v=> Math.max(1, Math.min(5, Math.round(v)));
  let pc = 'M';
  if(g.l === 'anime' && g.n && g.n > 100) pc = 'L';
  if(has('ACT', 'SPO', 'THR', 'SUR') && !has('SOL', 'IYA')) pc = 'V';
  if(has('IYA', 'SOL') && !has('ACT')) pc = 'L';
  const o = {ac: clamp(ac), dk: clamp(dk), dp: clamp(dp), em: clamp(em), pc};
  return Object.assign(o, g.gl || {});
}
const LABEL_PACE = {L:'Lento e disteso', M:'Medio', V:'Veloce'};
const LABEL_IT = {D:'🎙️ Doppiato in italiano', S:'✅ Sottotitoli in italiano', E:'📖 Edizione italiana ufficiale', F:'🌐 Solo traduzione dei fan', N:'🇬🇧 Nessuna edizione italiana'};
function fixSecondPerson(t){ return String(t || '').trim(); }
function labelBar(n, max){ let out = '<span class="glabel-bar">'; for(let i = 1; i <= max; i++) out += `<i class="${i <= n ? 'on' : ''}"></i>`; return out + '</span>'; }
function audienceOf(g){ const a = (g.tags || []).find(t=> ['SHO','SEI','SHJ','JOS','KID'].includes(t)); return a ? TAG_INFO[a].label : null; }
function glanceHtml(g){
  const l = glanceOf(g);
  const it = g.ia ? LABEL_IT[g.ia] : null;
  const itSrc = g.itw ? ` <a class="glabel-src" href="https://it.wikipedia.org/wiki/${encodeURIComponent(String(g.itw).replace(/ /g, '_'))}" target="_blank" rel="noopener" title="Fonte: it.wikipedia">↗ fonte</a>` : '';
  const hrs = g.hours >= 1 ? `≈ ${Math.round(g.hours)} ore` : (g.hours > 0 ? `≈ ${Math.round(g.hours * 60)} min` : '—');
  return `<div class="modal-section-title">🏷️ A colpo d'occhio</div>
  <div class="glabel">
    <div class="glabel-title">${g.watch ? 'Da guardare' : 'Da leggere'}</div>
    <div class="glabel-grid">
      <div class="glabel-row"><span>Azione</span><span class="v">${labelBar(l.ac, 5)}</span></div>
      <div class="glabel-row"><span>Tono cupo</span><span class="v">${labelBar(l.dk, 5)}</span></div>
      <div class="glabel-row"><span>Complessità</span><span class="v">${labelBar(l.dp, 5)}</span></div>
      <div class="glabel-row"><span>Carico emotivo</span><span class="v">${labelBar(l.em, 5)}</span></div>
      <div class="glabel-row"><span>Ritmo</span><span class="v">${LABEL_PACE[l.pc] || '—'}</span></div>
      <div class="glabel-row"><span>Durata</span><span class="v">${escHtml(lenText(g))} <small>(${hrs})</small></span></div>
      <div class="glabel-row"><span>Italiano</span><span class="v">${it ? it + itSrc : '❔ non ancora verificato'}</span></div>
      ${audienceOf(g) ? `<div class="glabel-row"><span>Pubblico</span><span class="v">${escHtml(audienceOf(g))}</span></div>` : ''}
      ${g.src ? `<div class="glabel-row"><span>Tratto da</span><span class="v">${escHtml(g.src)}</span></div>` : ''}
    </div>
    ${g.ok ? `<div class="glabel-ok">🟢 <b>Fa per te se</b>${escHtml(g.ok)}</div>` : ''}
    ${g.ko ? `<div class="glabel-ko">🔴 <b>Lascia stare se</b>${escHtml(g.ko)}</div>` : ''}
    ${g.how ? `<div class="glabel-play">🎯 <b>Come ${g.watch ? 'guardarlo' : 'leggerlo'}:</b> ${escHtml(g.how)}</div>` : ''}
    <div class="cover-hint" style="text-align:left;margin-top:8px;">Azione, tono, complessità e carico emotivo sono una stima ricavata dai generi e dai temi (AniList): servono a orientarti, non sono un dato ufficiale.</div>
  </div>`;
}

// ---- Dove guardarlo / leggerlo: ricerche pronte sulle TUE piattaforme + dettagli live da AniList ----
const PLATFORM_OPTIONS = [
  {key:'crunchyroll', label:'Crunchyroll', watch:true, url: q=> 'https://www.crunchyroll.com/it/search?q=' + q},
  {key:'netflix', label:'Netflix', watch:true, url: q=> 'https://www.netflix.com/search?q=' + q},
  {key:'prime', label:'Prime Video', watch:true, url: q=> 'https://www.primevideo.com/search/?phrase=' + q},
  {key:'disney', label:'Disney+', watch:true, url: q=> 'https://www.disneyplus.com/search?q=' + q},
  {key:'youtube', label:'YouTube (Muse/Ani-One)', watch:true, url: q=> 'https://www.youtube.com/results?search_query=' + q + '+anime+ITA'},
  {key:'mangaplus', label:'MANGA Plus (gratis)', watch:false, url: q=> 'https://mangaplus.shueisha.co.jp/search_result?keyword=' + q},
  {key:'panini', label:'Panini / Planet Manga', watch:false, url: q=> 'https://www.panini.it/shp_ita_it/catalogsearch/result/?q=' + q},
  {key:'starcomics', label:'Star Comics', watch:false, url: q=> 'https://www.starcomics.com/ricerca?search=' + q},
  {key:'kindle', label:'Kindle / Amazon', watch:false, url: q=> 'https://www.amazon.it/s?k=' + q + '+manga&i=digital-text'}
];
let MY_PLATFORMS = {};
function loadPlatforms(){ MY_PLATFORMS = lsGet(profileKey('atl_platforms'), {}) || {}; }
loadPlatforms();
function savePlatforms(){ lsSet(profileKey('atl_platforms'), MY_PLATFORMS); }
function whereHtml(g){
  const q = encodeURIComponent(g.name);
  const opts = PLATFORM_OPTIONS.filter(o=> o.watch === g.watch);
  const mine = opts.filter(o=> MY_PLATFORMS[o.key]);
  const jw = `https://www.justwatch.com/it/cerca?q=${q}`;
  const gsearch = g.watch ? `https://www.google.com/search?q=${encodeURIComponent(g.name + ' anime dove guardare in streaming Italia')}` : `https://www.google.com/search?q=${encodeURIComponent(g.name + ' manga edizione italiana')}`;
  return `<div class="modal-section-title">${g.watch ? '📺 Dove guardarlo' : '📚 Dove leggerlo'}</div>
  <div class="glabel">
    <div class="cover-hint" style="text-align:left;margin-top:0;">${mine.length ? 'Cerca su una delle tue piattaforme:' : 'Segna qui sotto le piattaforme che usi: cercherò il titolo direttamente lì.'} La disponibilità cambia spesso: il collegamento apre la ricerca, non garantisce che ci sia.</div>
    <div class="cover-tools" style="justify-content:flex-start;margin-top:6px;">
      ${mine.map(o=> `<a class="cover-pill" href="${o.url(q)}" target="_blank" rel="noopener">🔎 ${escHtml(o.label)}</a>`).join('')}
      ${g.watch ? `<a class="cover-pill" href="${jw}" target="_blank" rel="noopener">🎯 JustWatch</a>` : ''}
      <a class="cover-pill" href="${gsearch}" target="_blank" rel="noopener">🌐 ${g.watch ? 'Cerca in streaming' : 'Edizione italiana'}</a>
    </div>
    <div class="glabel-title" style="margin-top:10px; border-top:2px solid var(--text); padding-top:6px; border-bottom:none;">Le mie piattaforme</div>
    <div class="cover-tools" style="justify-content:flex-start;" id="myPlatRow">${opts.map(o=> `<button type="button" class="tagchip ${MY_PLATFORMS[o.key] ? 'active' : ''}" data-plat="${o.key}">${escHtml(o.label)}</button>`).join('')}</div>
    <div id="liveBox" class="live-box" data-id="${escHtml(g.id)}"></div>
  </div>`;
}

// ---- Affinità con i tuoi gusti (DNA) ----
function buildTasteProfile(){
  const liked = ITEMS.filter(g=> FAVS.has(g.id) || STATUSES[g.id] === 'done' || STATUSES[g.id] === 'now');
  const dropped = ITEMS.filter(g=> STATUSES[g.id] === 'drop');
  const p = {tagScore:{}, who:{}, kind:{}, n: liked.length, dropTags:{}, avgScore:0, likedIds:new Set(liked.map(g=> g.id))};
  if(!liked.length) return p;
  let sum = 0;
  liked.forEach(g=>{
    const w = FAVS.has(g.id) ? 2 : 1;
    g.tags.forEach(t=>{ p.tagScore[t] = (p.tagScore[t] || 0) + w; });
    String(g.who || '').split(/ \+ | e /).forEach(x=>{ x = x.trim(); if(x) p.who[x] = (p.who[x] || 0) + w; });
    p.kind[g.l] = (p.kind[g.l] || 0) + w;
    sum += g.score;
  });
  dropped.forEach(g=> g.tags.forEach(t=>{ p.dropTags[t] = (p.dropTags[t] || 0) + 1; }));
  p.avgScore = sum / liked.length;
  return p;
}
function dnaForItem(g, p){
  if(!p || p.n < 2) return null;
  const maxTag = Math.max(1, ...Object.values(p.tagScore));
  let tagMatch = 0; const matched = [], avoid = [];
  g.tags.forEach(t=>{ if(p.tagScore[t]){ tagMatch += p.tagScore[t] / maxTag; matched.push(t); } });
  tagMatch = g.tags.length ? Math.min(1, tagMatch / g.tags.length) : 0;
  const scoreDelta = Math.max(0, 1 - Math.abs(g.score - p.avgScore) / 30);
  let bonus = 0; const why = [];
  String(g.who || '').split(/ \+ | e /).forEach(x=>{ x = x.trim(); if(x && p.who[x]){ bonus += 0.06; why.push(x); } });
  const maxKind = Math.max(1, ...Object.values(p.kind)); if(p.kind[g.l]) bonus += 0.05 * (p.kind[g.l] / maxKind);
  const adapted = (g.ad || []).some(a=> a.i && p.likedIds.has(a.i)); if(adapted) bonus += 0.12;
  let penalty = 0; g.tags.forEach(t=>{ if(p.dropTags[t]){ penalty += 0.12; avoid.push(t); } });
  let pct = Math.round((tagMatch * 0.6 + scoreDelta * 0.3 + Math.min(0.2, bonus)) * 100 - penalty * 100);
  pct = Math.max(3, Math.min(99, pct));
  return {pct, matchedTags: matched, avoidTags: avoid, people: why, adapted};
}
function dnaColor(pct){ return pct >= 75 ? '#2f9e6b' : pct >= 50 ? '#c9a12a' : '#c93a3a'; }
function matchWhy(dna, g){
  const nm = t=> TAG_INFO[t] ? TAG_INFO[t].label : t;
  const bits = [];
  if(dna.adapted) bits.push(g.watch ? 'è l\'adattamento di un manga che ti piace' : 'ha un adattamento anime che ti piace');
  if(dna.people.length) bits.push(`stesso ${g.watch ? 'studio' : 'autore'} di titoli che ami (${dna.people.join(', ')})`);
  if(dna.avoidTags.length) return `Attenzione: condivide elementi (${dna.avoidTags.map(nm).join(', ')}) con titoli che hai droppato.` + (bits.length ? ' In compenso ' + bits.join(' e ') + '.' : '');
  if(dna.matchedTags.length) return `Condivide ${dna.matchedTags.slice(0, 4).map(nm).join(', ')} con i tuoi preferiti` + (bits.length ? ' e ' + bits.join(' e ') : '') + ', con un voto vicino alla tua media.';
  return bits.length ? 'Ha ' + bits.join(' e ') + '.' : 'Genere diverso da quelli che ti sono piaciuti finora: potrebbe essere una scoperta o un azzardo.';
}
function dnaHtml(g){
  const p = buildTasteProfile(); if(p.n < 2) return '';
  const dna = dnaForItem(g, p); if(!dna) return '';
  const color = dnaColor(dna.pct);
  return `<div class="dna-box">
    <div class="dna-ring" style="background:conic-gradient(${color} ${dna.pct * 3.6}deg, var(--row-alt) 0deg); color:var(--text);"><span style="background:var(--card); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">${dna.pct}%</span></div>
    <div class="dna-why"><b>DNA di compatibilità</b> — basato su anime e manga che hai segnato come preferiti, completati o in corso.<br>${escHtml(matchWhy(dna, g))}</div>
  </div>`;
}

// ---- Evidenziazioni (💕🤝✨😭💉) ----
function dopaPanelHtml(g){
  const def = `<p class="dopa-def"><b>Cosa vuol dire «binge»:</b> ti premia spesso e ti spinge a dire «ancora un episodio» (o «ancora un capitolo»). Non misura la qualità: misura quanto è difficile staccarsi.</p>`;
  if(!g.lp && !g.hk) return `<div class="dopa-panel" id="dopaPanel" hidden>${def}</div>`;
  const steps = (g.lp || []).map(s=> `<span class="dopa-step">${escHtml(s)}</span>`).join('<span class="dopa-arrow" aria-hidden="true">→</span>');
  return `<div class="dopa-panel" id="dopaPanel" hidden>${def}
    ${steps ? `<span class="dopa-k">Il ciclo che ti tiene incollato</span><div class="dopa-loop">${steps}</div>` : ''}
    ${g.hk ? `<p><span class="dopa-k">🎣 Perché non smetti</span>${escHtml(g.hk)}</p>` : ''}
    ${g.wt ? `<p><span class="dopa-k">⚠️ Quando può stancare</span>${escHtml(g.wt)}</p>` : ''}</div>`;
}
function highlightsHtml(g){
  if(!g.hl || !HL_INFO[g.hl]) return '';
  const info = HL_INFO[g.hl];
  if(g.hl === 'binge') return `<div class="enrich-highlights"><button type="button" class="enrich-chip dopamine dopa-toggle" aria-expanded="false" aria-controls="dopaPanel">💉 ${info.label}${g.hln ? ' — ' + escHtml(g.hln) : ''} <span class="dopa-chev" aria-hidden="true">▾</span></button></div>${dopaPanelHtml(g)}`;
  return `<div class="enrich-highlights"><span class="enrich-chip ${g.hl === 'romance' ? 'romance' : g.hl === 'bond' ? 'affinity' : 'wow'}">${info.icon} ${info.label}${g.hln ? ' — ' + escHtml(g.hln) : ''}</span></div>`;
}
function proconsHtml(g){
  if(!(g.pros && g.pros.length) && !(g.cons && g.cons.length)) return '';
  return `<div class="modal-section-title">➕➖ Pro & Contro</div>
    <div class="proscons"><ul class="pros">${(g.pros || []).map(p=> `<li>${escHtml(p)}</li>`).join('')}</ul><ul class="cons">${(g.cons || []).map(c=> `<li>${escHtml(c)}</li>`).join('')}</ul></div>`;
}
function enrichHtml(g){
  let out = '';
  if(g.age) out += `<div class="modal-section-title">⏳ Come regge oggi</div><div class="modal-note">${escHtml(g.age)}</div>`;
  if(g.why) out += `<div class="modal-section-title">💡 Perché potrebbe piacerti</div><div class="modal-note">${escHtml(g.why)}</div>`;
  out += proconsHtml(g);
  out += `<div class="modal-section-title">⏱️ Longevità</div><div class="modal-note"><strong>${escHtml(lenLong(g))}</strong>${g.hours >= 1 ? ` — circa ${Math.round(g.hours)} ore ${g.watch ? 'di visione' : 'di lettura'} (stima).` : ''}<br>${g.st === 'R' ? 'È ancora in corso: la fine non è stata pubblicata.' : g.st === 'H' ? 'È in pausa (hiatus).' : 'Opera conclusa.'}</div>`;
  if(!g.why && !g.age && !(g.pros && g.pros.length)) out = `<div class="modal-section-title">🔍 Approfondimento</div><div class="modal-story placeholder">Analisi approfondita (perché piace, pro e contro, come regge oggi) in arrivo per questo titolo.</div>` + out;
  return out;
}
function seasonsHtml(g){
  if(!g.seasons || g.seasons.length < 2) return '';
  return `<div class="modal-section-title">🗓️ Stagioni e parti (${g.seasons.length})</div>
    <div class="seasons-list">${g.seasons.map(s=> `<div class="season-row"><span class="s-n">${escHtml(s[0])}</span><span class="s-y">${s[1] || ''}</span><span class="s-e">${s[2] ? s[2] + ' ep' : ''}</span><span class="s-v">${s[3] != null ? `<b>${s[3]}</b>` : '—'}</span></div>`).join('')}</div>
    <div class="cover-hint" style="text-align:left;">Il voto del titolo è la media pesata delle stagioni (più seguite = più peso).</div>`;
}

// ---- Saghe e adattamenti manga ↔ anime ----
const SAGAS = {};
function buildSagas(){
  Object.keys(SAGAS).forEach(k=> delete SAGAS[k]);
  ITEMS.forEach(g=>{ if(g.sg) (SAGAS[g.sg] = SAGAS[g.sg] || {key: g.sg, items: []}).items.push(g); });
  Object.values(SAGAS).forEach(s=>{
    s.items.sort((a, b)=> (a.y || 0) - (b.y || 0));
    const flag = s.items.slice().sort((a, b)=> (b.pop || 0) - (a.pop || 0))[0];
    s.name = (AM.sagas && AM.sagas[s.key]) || flag.name;
    const n = k=> s.items.filter(g=> g.l === k).length;
    const parts = []; if(n('anime')) parts.push(n('anime') + ' serie anime'); if(n('film')) parts.push(n('film') + ' film'); if(n('manga')) parts.push(n('manga') + ' manga'); if(n('manhwa')) parts.push(n('manhwa') + ' manhwa');
    s.order = parts.join(' + ');
    const ys = s.items.map(g=> g.y).filter(Boolean); s.years = ys.length ? Math.min(...ys) + '–' + Math.max(...ys) : '';
  });
}
buildSagas();
function sagaOf(g){ return g.sg ? SAGAS[g.sg] : null; }
const KIND_ICON = {anime:'📺', film:'🎞️', manga:'📚', manhwa:'📱'};
function chipOf(s, extra){ return `<button class="similar-chip" data-id="${escHtml(s.id)}"><span class="badge ${TIER_LABEL[s.tier]}">${s.tier}</span>${KIND_ICON[s.l] || ''} ${escHtml(s.name)}${extra || ''}</button>`; }
function sagaHtml(g){
  const s = sagaOf(g); if(!s) return '';
  const others = s.items.filter(x=> x.id !== g.id);
  if(!others.length) return '';
  return `<div class="saga-note"><span class="saga-note-title">🗂️ Saga: ${escHtml(s.name)}</span>
    <div class="saga-note-text">${escHtml(s.order)}${s.years ? ' · ' + s.years : ''}</div>
    <div class="similar-games" style="margin-top:8px;">${others.slice(0, 12).map(x=> chipOf(x, x.y ? ` (${x.y})` : '')).join('')}</div></div>`;
}
function adaptHtml(g){
  if(!g.ad || !g.ad.length) return '';
  const rows = g.ad.map(a=>{
    if(a.i){ const x = byId(a.i); if(x) return chipOf(x); }
    const url = 'https://anilist.co/' + (a.t === 'manga' ? 'manga' : 'anime') + '/' + a.al;
    return `<a class="similar-chip" href="${url}" target="_blank" rel="noopener">${a.t === 'manga' ? '📚' : '📺'} ${escHtml(a.n || 'Apri su AniList')} ↗</a>`;
  }).join('');
  const title = g.watch ? '📚 Il manga da cui è tratto' : '📺 L\'adattamento anime';
  return `<div class="modal-section-title">${title}</div><div class="similar-games">${rows}</div>`;
}

// ---- Simili: prima i consigli degli utenti (AniList), poi affinità per generi ----
function findSimilarItems(g, n){
  const out = []; const seen = new Set([g.id]);
  (g.rec || []).forEach(id=>{ const x = byId(id); if(x && !seen.has(x.id)){ seen.add(x.id); out.push(x); } });
  if(out.length >= n) return out.slice(0, n);
  const gt = new Set(g.tags), EXCL = [['HOR','GOR'], ['KID','MAH'], ['ECC','HAR']];
  const scored = ITEMS.filter(x=> !seen.has(x.id) && x.l === g.l).map(x=>{
    const xt = new Set(x.tags); const shared = [...xt].filter(t=> gt.has(t));
    for(const grp of EXCL){ if(grp.some(t=> gt.has(t)) !== grp.some(t=> xt.has(t))) return {x, s: -1}; }
    const uni = new Set([...gt, ...xt]).size || 1;
    let s = shared.length / uni * 5;
    if(g.tags[0] && g.tags[0] === x.tags[0]) s += 2;
    if(g.sg && g.sg === x.sg) s += 3;
    if(g.y && x.y && Math.abs(g.y - x.y) <= 5) s += 0.6;
    return {x, s: shared.length >= 2 ? s : -1};
  }).filter(o=> o.s >= 3).sort((a, b)=> b.s - a.s || b.x.score - a.x.score);
  scored.forEach(o=>{ if(out.length < n) out.push(o.x); });
  return out;
}
function similarHtml(g){
  const sims = findSimilarItems(g, 6); if(!sims.length) return '';
  return `<div class="modal-section-title">🔁 Se ti è piaciuto questo, prova anche</div><div class="similar-games">${sims.map(s=> chipOf(s)).join('')}</div>`;
}

// ---- La scheda ----
function itemLinks(g){
  const q = encodeURIComponent(g.name);
  const al = g.al ? `https://anilist.co/${String(g.id)[0] === 'a' ? 'anime' : 'manga'}/${g.al}` : null;
  const mal = g.mal ? `https://myanimelist.net/${String(g.id)[0] === 'a' ? 'anime' : 'manga'}/${g.mal}` : null;
  const imdb = g.imdb ? 'https://www.imdb.com/title/tt' + String(g.imdb).padStart(7, '0') + '/' : null;
  const btn = (href, label)=> `<a class="btn" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  return `<div class="modal-links">
    ${g.watch ? btn('https://www.youtube.com/results?search_query=' + q + '+trailer+ITA', '▶️ Trailer (YouTube)') : btn('https://www.youtube.com/results?search_query=' + q + '+manga+recensione+ITA', '▶️ Recensioni video')}
    ${btn('https://www.google.com/search?q=' + encodeURIComponent(g.name + ' recensione') + '&hl=it', '📰 Recensioni ITA')}
    ${btn('https://www.google.com/search?tbm=isch&q=' + q + '+' + (g.watch ? 'anime+screenshot' : 'manga+pagine'), '🖼️ Immagini')}
    ${g.watch ? btn('https://www.youtube.com/results?search_query=' + q + '+OST+colonna+sonora', '🎵 Colonna sonora') : ''}
    ${g.itw ? btn('https://it.wikipedia.org/wiki/' + encodeURIComponent(String(g.itw).replace(/ /g, '_')), '📖 Wikipedia (IT)') : btn('https://it.wikipedia.org/w/index.php?search=' + q, '📖 Cerca su Wikipedia')}
    ${imdb ? btn(imdb, '⭐ IMDb') : ''}${al ? btn(al, '🅰️ AniList') : ''}${mal ? btn(mal, '🔷 MyAnimeList') : ''}
  </div>`;
}
function statusButtonsHtml(g){
  return Object.keys(STATUS_INFO).map(k=> `<button class="btn ${STATUSES[g.id] === k ? 'on' : ''}" data-status="${k}">${STATUS_INFO[k].icon} ${statusLabel(g, k)}</button>`).join('');
}
function myTierRowHtml(g){
  return `<div class="modal-section-title">🎯 Il mio tier <small style="font-weight:500;color:var(--sub)">(ufficiale: ${g.tier})</small></div>
    <div class="mytier-quick" id="myTierQuick">${TIERS_LIST.map(t=> `<button type="button" class="btn mtq ${effectiveTier(g) === t ? 'on' : ''}" data-mt="${t}"><span class="badge ${TIER_LABEL[t]}">${t}</span></button>`).join('')}</div>`;
}
function openModal(g){
  if(typeof g === 'string') g = byId(g); if(!g) return;
  currentModalItem = g;
  modalCard.classList.remove('wide');
  const isFav = FAVS.has(g.id);
  const storyHtml = g.story ? `<div class="modal-story">${escHtml(g.story)}</div>` : `<div class="modal-story placeholder" id="storyPlaceholder">Trama in italiano in arrivo per questo titolo. <button class="btn" id="storyFetchBtn" type="button">📖 Leggi da Wikipedia</button></div>`;
  const sub = [g.itn && g.itn !== g.name ? g.itn : null, g.jp].filter(Boolean).join(' · ');
  modalCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">${escHtml(g.name)}</div>
      <button class="modal-close" id="modalCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="modal-hero">
      <div class="cover-block" id="coverBlock">${coverHtml(g)}</div>
      <div class="modal-hero-info">
        ${sub ? `<div class="modal-sub">${escHtml(sub)}</div>` : ''}
        <div class="modal-plat">${escHtml(g.who || '')}${g.who && g.year ? ' · ' : ''}${escHtml(g.year || '')}</div>
        ${g.dir ? `<div class="modal-plat">🎬 Regia: ${escHtml(g.dir)}${g.cn ? ' · ' + escHtml(g.cn) : ''}</div>` : ''}
        <div class="modal-plat">${escHtml((FORMAT_LABEL[g.f] || LIST_BY_ID[g.l].full))} · ${escHtml(lenText(g))}${g.st ? ' · ' + AIR_LABEL[g.st] : ''}</div>
        <div class="modal-badges">
          <span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span>
          <span class="badge big outline">${g.score}/100</span>
          <span class="badge big outline" title="${methodLabel(g.m, g)}">${methodIcon(g.m)} ${sourceName(g)}</span>
          ${g.rank ? `<span class="badge big outline" title="Posizione nella classifica ${LIST_BY_ID[g.l].label}">#${g.rank}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="modal-tags">${tagPills(g)}</div>
    ${dnaHtml(g)}
    ${highlightsHtml(g)}
    ${glanceHtml(g)}
    ${adaptHtml(g)}
    ${sagaHtml(g)}
    <div class="modal-section-title">Il tuo stato</div>
    <div class="status-row" id="statusRow">${statusButtonsHtml(g)}</div>
    ${myTierRowHtml(g)}
    <div class="modal-section-title">📖 La storia (senza spoiler)</div>
    ${storyHtml}
    ${g.note ? `<div class="modal-section-title">Nota</div><div class="modal-note">${escHtml(g.note)}</div>` : ''}
    ${seasonsHtml(g)}
    ${enrichHtml(g)}
    ${whereHtml(g)}
    ${similarHtml(g)}
    ${itemLinks(g)}
    <div class="modal-actions">
      <button class="btn" id="modalFavBtn">${giIcon(isFav ? 'favon' : 'favoff')} ${isFav ? 'Nei preferiti' : 'Aggiungi ai preferiti'}</button>
      <button class="btn" id="modalCompareBtn">${compareList.includes(g.id) ? '✓ Nel confronto' : '⚖️ Confronta'}</button>
      ${typeof wishBtnHtml === 'function' ? wishBtnHtml(g) : ''}
      ${typeof infoBtnHtml === 'function' ? infoBtnHtml(g) : ''}
      <button class="btn primary" id="modalCloseBtn2">Chiudi</button>
    </div>`;
  modalBackdrop.classList.add('show');
  modalCard.scrollTop = 0;
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
  document.getElementById('modalCompareBtn').addEventListener('click', ()=>{ toggleCompare(g.id); openModal(g); });
  document.getElementById('modalFavBtn').addEventListener('click', ()=>{ toggleFav(g.id); renderMetrics(); render(); openModal(g); });
  document.getElementById('statusRow').querySelectorAll('[data-status]').forEach(btn=> btn.addEventListener('click', ()=>{ setStatus(g.id, btn.dataset.status); renderMetrics(); render(); openModal(g); }));
  document.getElementById('myTierQuick').querySelectorAll('[data-mt]').forEach(btn=> btn.addEventListener('click', ()=>{ const t = btn.dataset.mt; if(t === g.tier) delete MYTIER[g.id]; else MYTIER[g.id] = t; saveMyTier(); showToast(t === g.tier ? 'Tier personale rimosso (torna quello ufficiale)' : `Nel tuo tier ${t}`); if(state.view === 'mytier') renderMyTier(); openModal(g); }));
  wireCover(g);
  const pr = document.getElementById('myPlatRow');
  if(pr) pr.querySelectorAll('[data-plat]').forEach(btn=> btn.addEventListener('click', ()=>{ MY_PLATFORMS[btn.dataset.plat] = !MY_PLATFORMS[btn.dataset.plat]; savePlatforms(); openModal(g); }));
  const dopaBtn = modalCard.querySelector('.dopa-toggle');
  if(dopaBtn) dopaBtn.addEventListener('click', ()=>{ const panel = document.getElementById('dopaPanel'); if(!panel) return; const willOpen = panel.hidden; panel.hidden = !willOpen; dopaBtn.setAttribute('aria-expanded', String(willOpen)); });
  modalCard.querySelectorAll('.similar-chip[data-id]').forEach(btn=> btn.addEventListener('click', ()=>{ const gg = byId(btn.dataset.id); if(gg) openModal(gg); }));
  const sf = document.getElementById('storyFetchBtn'); if(sf) sf.addEventListener('click', ()=>{ if(typeof loadWikiStory === 'function') loadWikiStory(g); });
  if(typeof loadLiveDetails === 'function') loadLiveDetails(g);
}
function closeModal(){ modalBackdrop.classList.remove('show'); }
modalBackdrop.addEventListener('click', (e)=>{ if(e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeLightbox(); closeModal(); } });

// ---- Lightbox ----
const lightboxBackdrop = document.getElementById('lightboxBackdrop'), lightboxImg = document.getElementById('lightboxImg');
function openLightbox(src, alt){ lightboxImg.src = src; lightboxImg.alt = alt || ''; lightboxBackdrop.classList.add('show'); }
function closeLightbox(){ lightboxBackdrop.classList.remove('show'); }
lightboxBackdrop.addEventListener('click', (e)=>{ if(e.target !== lightboxImg) closeLightbox(); });
document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);

// ---- Confronto testa a testa ----
let compareList = [];
function renderCompareTray(){
  const tray = document.getElementById('compareTray'), items = document.getElementById('compareTrayItems'), goBtn = document.getElementById('compareGoBtn');
  if(!compareList.length){ tray.style.display = 'none'; return; }
  tray.style.display = 'flex';
  items.innerHTML = compareList.map(id=>{ const g = byId(id); return g ? `<span class="compare-tray-chip">${escHtml(g.name)}<button data-id="${escHtml(id)}">✕</button></span>` : ''; }).join('');
  items.querySelectorAll('button[data-id]').forEach(b=> b.addEventListener('click', ()=> toggleCompare(b.dataset.id)));
  goBtn.disabled = compareList.length !== 2;
  goBtn.textContent = compareList.length === 2 ? '⚖️ Confronta ora' : `⚖️ Aggiungine un altro (${compareList.length}/2)`;
}
function toggleCompare(id){
  id = String(id); const idx = compareList.indexOf(id);
  if(idx >= 0) compareList.splice(idx, 1); else { if(compareList.length >= 2) compareList.shift(); compareList.push(id); }
  renderCompareTray();
}
document.getElementById('compareGoBtn').addEventListener('click', ()=>{ if(compareList.length === 2) openCompareModal(compareList[0], compareList[1]); });
function openCompareModal(id1, id2){
  const a = byId(id1), b = byId(id2); if(!a || !b) return;
  modalCard.classList.add('wide');
  const better = (x, y, key, hi)=> x[key] === y[key] ? '' : ((hi ? x[key] > y[key] : x[key] < y[key]) ? ' cmp-win' : '');
  const col = (g, o)=> `<div class="compare-col">
      <div class="compare-name">${escHtml(g.name)}</div>
      <div class="modal-plat">${escHtml(g.who || '')}${g.year ? ' · ' + escHtml(g.year) : ''}</div>
      <div class="modal-badges"><span class="badge big ${TIER_LABEL[g.tier]}${better(g, o, 'score', true)}">${g.tier}</span><span class="badge big outline${better(g, o, 'score', true)}">${g.score}/100</span></div>
      <div class="modal-plat">${LIST_BY_ID[g.l].full} · <span class="${better(g, o, 'hours', false)}">${escHtml(lenText(g))}${g.hours >= 1 ? ' (≈' + Math.round(g.hours) + ' h)' : ''}</span></div>
      <div class="modal-tags">${tagPills(g, 6)}</div>
      ${g.ok ? `<div class="glabel-ok">🟢 <b>Fa per te se</b>${escHtml(g.ok)}</div>` : ''}
      <div class="compare-story">${escHtml(g.story || 'Trama in italiano non ancora disponibile per questo titolo.')}</div>
    </div>`;
  modalCard.innerHTML = `<div class="modal-head"><div class="modal-title">⚖️ Confronto</div><button class="modal-close" id="modalCloseBtn">✕</button></div>
    <div class="compare-grid">${col(a, b)}${col(b, a)}</div>
    <div class="modal-actions"><button class="btn primary" id="modalCloseBtn2">Chiudi</button></div>`;
  modalBackdrop.classList.add('show');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
}

// ---- Esporta CSV ----
function toCsvValue(v){ const s = String(v == null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function buildCsv(list){
  const lines = [['Posizione','Titolo','Titolo originale','Tipo','Studio / Autore','Anno','Tier','Il mio tier','Voto','Fonte','Preferito','Stato','Durata','Generi','Trama'].join(',')];
  list.forEach(g=> lines.push([g.rank, g.name, g.jp || '', LIST_BY_ID[g.l].full, g.who || '', g.year, g.tier, MYTIER[g.id] || '', g.score, methodLabel(g.m, g), FAVS.has(g.id) ? 'Sì' : 'No', STATUSES[g.id] ? statusLabel(g, STATUSES[g.id]) : '', lenText(g), (g.tags || []).map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(' / '), g.story || ''].map(toCsvValue).join(',')));
  return '﻿' + lines.join('\n');
}
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=> URL.revokeObjectURL(url), 2000);
}
document.getElementById('exportBtn').addEventListener('click', ()=>{
  try{ downloadBlob(new Blob([buildCsv(applyFilters())], {type:'text/csv;charset=utf-8'}), 'tier-list-anime-manga.csv'); showToast('CSV scaricato'); }
  catch(e){ showToast('Esportazione non disponibile qui'); }
});

// ---- Vista «Per saga» ----
function renderSagaView(){
  const panel = document.getElementById('sagaPanel'); if(!panel) return;
  buildSagas();
  const visible = new Set(applyFilters().map(g=> g.id));
  const onlyCross = !!panel._cross;
  const keys = Object.keys(SAGAS).filter(k=>{
    const s = SAGAS[k]; if(!s.items.some(g=> visible.has(g.id))) return false;
    return !onlyCross || (new Set(s.items.map(g=> g.watch ? 'w' : 'r')).size > 1);
  }).sort((a, b)=> SAGAS[b].items.length - SAGAS[a].items.length || (SAGAS[b].items[0].pop || 0) - (SAGAS[a].items[0].pop || 0));
  const head = `<div class="count-line" style="margin-bottom:10px;"><span>${keys.length} saghe (franchise) con più titoli</span><span><label class="ask-toggle" style="display:inline-flex"><input type="checkbox" id="sagaCross" ${onlyCross ? 'checked' : ''}> solo con manga <b>e</b> anime</label></span></div>`;
  if(!keys.length){ panel.innerHTML = head + '<div class="empty" style="display:block">Nessuna saga corrisponde ai filtri attuali (prova a rimuovere qualche filtro).</div>'; }
  else panel.innerHTML = head + keys.slice(0, 120).map(key=>{
    const s = SAGAS[key];
    return `<div class="saga-section">
      <div class="saga-section-head">
        <span class="saga-section-name">${escHtml(s.name)}</span>
        <span class="badge outline">${s.items.length} titoli</span>
        <span class="badge outline">${escHtml(s.order)}</span>
        <button class="btn saga-miss-btn" data-saga="${key}" title="Cerca su AniList i titoli della saga che non hai">${giIcon('lens')} Titoli mancanti</button>
      </div>
      <div class="saga-section-note">${escHtml(s.years)}</div>
      <div class="saga-games-grid">${s.items.map(g=> `<button class="saga-game-chip" data-id="${escHtml(g.id)}"><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span>${KIND_ICON[g.l] || ''} ${escHtml(g.name)}${g.y ? ` (${g.y})` : ''}</button>`).join('')}</div>
      <div class="saga-missing" data-host="${key}"></div>
    </div>`;
  }).join('') + (keys.length > 120 ? `<div class="lp-sub">…e altre ${keys.length - 120} saghe: usa i filtri o la ricerca per restringere.</div>` : '');
  const cb = panel.querySelector('#sagaCross'); if(cb) cb.addEventListener('change', ()=>{ panel._cross = cb.checked; renderSagaView(); });
  panel.querySelectorAll('.saga-miss-btn').forEach(b=> b.addEventListener('click', ()=>{ const host = panel.querySelector(`.saga-missing[data-host="${b.dataset.saga}"]`); if(host && typeof sagaFindMissing === 'function') sagaFindMissing(b.dataset.saga, host); }));
  panel.querySelectorAll('.saga-game-chip').forEach(btn=> btn.addEventListener('click', ()=>{ const gg = byId(btn.dataset.id); if(gg) openModal(gg); }));
}

// ---- Vista «Scopri» (a carte da scorrere, come Tinder) ----
let DISCOVER_SKIPPED = new Set();
function loadDiscoverSkipped(){ DISCOVER_SKIPPED = new Set(lsGet(profileKey('atl_discover_skipped'), []).map(String)); }
loadDiscoverSkipped();
function saveDiscoverSkipped(){ lsSet(profileKey('atl_discover_skipped'), Array.from(DISCOVER_SKIPPED)); }
let discoverQueue = [], discoverIdx = 0, discoverHistory = [];
function buildDiscoverQueue(){
  const p = buildTasteProfile();
  const pool = ITEMS.filter(g=> inActiveList(g) && !FAVS.has(g.id) && !STATUSES[g.id] && !DISCOVER_SKIPPED.has(g.id));
  const scored = pool.map(g=> ({g, dna: dnaForItem(g, p)}));
  scored.sort((a, b)=>{
    if(a.dna && b.dna) return b.dna.pct - a.dna.pct || b.g.score - a.g.score;
    if(a.dna && !b.dna) return -1; if(!a.dna && b.dna) return 1;
    return b.g.score - a.g.score;
  });
  return scored.map(o=> o.g);
}
function currentDiscoverItem(){ return discoverQueue[discoverIdx] || null; }
function discoverCoverMedia(g){
  const url = coverUrl(g, 'large');
  if(url) return `<img src="${escHtml(url)}" alt="Copertina di ${escHtml(g.name)}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'discover-cover-placeholder',innerHTML:'<span class=&quot;pc-plat&quot;>${escHtml(LIST_BY_ID[g.l].label)}</span><span class=&quot;pc-tier ${TIER_LABEL[g.tier]}&quot;>${g.tier}</span>'}))">`;
  return `<div class="discover-cover-placeholder"><span class="pc-plat">${escHtml(LIST_BY_ID[g.l].label)}</span><span class="pc-tier ${TIER_LABEL[g.tier]}">${g.tier}</span></div>`;
}
function discoverCardHtml(g){
  if(!g){
    return `<div class="discover-empty"><div class="discover-empty-icon">🎉</div>
      <div>${ITEMS.length ? 'Hai visto tutti i titoli di questa lista che potevano interessarti (in base a preferiti, stati e scarti già segnati).' : 'Nessun titolo da scoprire al momento.'}</div>
      ${DISCOVER_SKIPPED.size ? `<button class="btn" id="discoverResetBtn">🔄 Rivedi quelli scartati (${DISCOVER_SKIPPED.size})</button>` : ''}</div>`;
  }
  const dna = dnaForItem(g, buildTasteProfile());
  return `<div class="discover-card" id="discoverCard" data-id="${escHtml(g.id)}">
    <div class="discover-swipe-tag discover-like">MI INTERESSA</div>
    <div class="discover-swipe-tag discover-nope">PASSO</div>
    <div class="discover-cover">${discoverCoverMedia(g)}</div>
    <div class="discover-body">
      <div class="discover-title">${escHtml(g.name)}</div>
      <div class="modal-plat">${escHtml(g.who || '')}${g.year ? ' · ' + escHtml(g.year) : ''} · ${escHtml(lenText(g))}</div>
      <div class="modal-badges"><span class="badge big ${TIER_LABEL[g.tier]}">${g.tier}</span><span class="badge big outline">${g.score}/100</span>${dna ? `<span class="badge big outline" style="color:${dnaColor(dna.pct)};">🧬 ${dna.pct}%</span>` : ''}</div>
      <div class="modal-tags">${tagPills(g, 4)}</div>
      ${g.ok ? `<div class="glabel-ok" style="margin-top:8px;">🟢 ${escHtml(g.ok)}</div>` : (g.story ? `<div class="modal-note">${escHtml(g.story.length > 170 ? g.story.slice(0, 168) + '…' : g.story)}</div>` : '')}
    </div>
  </div>`;
}
function renderDiscoverView(){ discoverQueue = buildDiscoverQueue(); discoverIdx = 0; discoverHistory = []; renderDiscoverCard(); }
function renderDiscoverCard(){
  const panel = document.getElementById('discoverPanel'); if(!panel) return;
  const g = currentDiscoverItem();
  panel.innerHTML = `<div class="discover-wrap">
    <div class="discover-stage">${discoverCardHtml(g)}</div>
    ${g ? `<div class="discover-actions">
      <button class="discover-btn nope" id="discoverNopeBtn" title="Non fa per me">✕</button>
      <button class="discover-btn undo" id="discoverUndoBtn" title="Annulla ultima scelta" ${discoverHistory.length ? '' : 'disabled'}>↩️</button>
      <button class="discover-btn info" id="discoverInfoBtn" title="Vedi tutti i dettagli">ℹ️</button>
      <button class="discover-btn like" id="discoverLikeBtn" title="Mi interessa: lo metto da ${g.watch ? 'vedere' : 'leggere'}">♥</button>
    </div>
    <div class="discover-hint">Trascina la copertina a destra/sinistra, oppure usa i pulsanti · ${discoverQueue.length - discoverIdx} da scoprire in «${ACTIVE_LIST === 'all' ? 'Tutti' : LIST_BY_ID[ACTIVE_LIST] ? LIST_BY_ID[ACTIVE_LIST].label : (TAG_INFO[ACTIVE_LIST] ? TAG_INFO[ACTIVE_LIST].label : '')}»</div>` : ''}
    ${typeof vibesHtml === 'function' ? vibesHtml() : ''}
  </div>`;
  wireDiscoverCard();
  if(typeof wireVibes === 'function') wireVibes(panel);
}
function discoverAdvance(action){
  const g = currentDiscoverItem(); if(!g) return;
  discoverHistory.push({id: g.id, action, prevStatus: STATUSES[g.id] || null});
  if(action === 'like'){ STATUSES[g.id] = 'plan'; saveStatuses(); renderMetrics(); showToast(`📌 ${g.name} aggiunto a «${statusLabel(g, 'plan').toLowerCase()}»`); }
  else { DISCOVER_SKIPPED.add(g.id); saveDiscoverSkipped(); }
  discoverIdx++; renderDiscoverCard();
}
function discoverUndo(){
  const last = discoverHistory.pop(); if(!last) return;
  if(last.action === 'like'){ if(last.prevStatus) STATUSES[last.id] = last.prevStatus; else delete STATUSES[last.id]; saveStatuses(); renderMetrics(); }
  else { DISCOVER_SKIPPED.delete(last.id); saveDiscoverSkipped(); }
  discoverIdx = Math.max(0, discoverIdx - 1);
  if(!discoverQueue[discoverIdx] || discoverQueue[discoverIdx].id !== last.id){
    const pos = discoverQueue.findIndex(x=> x.id === last.id);
    if(pos >= 0){ const item = discoverQueue.splice(pos, 1)[0]; discoverQueue.splice(discoverIdx, 0, item); }
    else { const gg = byId(last.id); if(gg) discoverQueue.splice(discoverIdx, 0, gg); }
  }
  renderDiscoverCard(); showToast('Scelta annullata');
}
function wireDiscoverCard(){
  const $ = id=> document.getElementById(id);
  if($('discoverNopeBtn')) $('discoverNopeBtn').addEventListener('click', ()=> discoverAdvance('skip'));
  if($('discoverLikeBtn')) $('discoverLikeBtn').addEventListener('click', ()=> discoverAdvance('like'));
  if($('discoverUndoBtn')) $('discoverUndoBtn').addEventListener('click', discoverUndo);
  if($('discoverInfoBtn')) $('discoverInfoBtn').addEventListener('click', ()=>{ const g = currentDiscoverItem(); if(g) openModal(g); });
  if($('discoverResetBtn')) $('discoverResetBtn').addEventListener('click', ()=>{ DISCOVER_SKIPPED.clear(); saveDiscoverSkipped(); showToast('Elenco degli scartati azzerato'); renderDiscoverView(); });
  const card = $('discoverCard'); if(card) wireDiscoverSwipe(card);
}
function wireDiscoverSwipe(card){
  let startX = 0, dx = 0, dragging = false, moved = false;
  const likeTag = card.querySelector('.discover-like'), nopeTag = card.querySelector('.discover-nope');
  card.addEventListener('pointerdown', (e)=>{ dragging = true; moved = false; startX = e.clientX; dx = 0; card.classList.add('dragging'); try{ card.setPointerCapture(e.pointerId); }catch(_){} });
  card.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    dx = e.clientX - startX; if(Math.abs(dx) > 6) moved = true;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
    const op = Math.min(1, Math.abs(dx) / 90);
    if(dx > 0){ likeTag.style.opacity = op; nopeTag.style.opacity = 0; } else { nopeTag.style.opacity = op; likeTag.style.opacity = 0; }
  });
  function endDrag(){
    if(!dragging) return; dragging = false; card.classList.remove('dragging');
    if(Math.abs(dx) > 110){
      const dir = dx > 0 ? 1 : -1;
      card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      card.style.transform = `translateX(${dir * 700}px) rotate(${dir * 24}deg)`; card.style.opacity = '0';
      setTimeout(()=> discoverAdvance(dir > 0 ? 'like' : 'skip'), 200);
    } else {
      card.style.transition = 'transform 0.2s'; card.style.transform = 'translateX(0) rotate(0)';
      likeTag.style.opacity = 0; nopeTag.style.opacity = 0;
      if(!moved){ const g = currentDiscoverItem(); if(g) openModal(g); }
    }
    dx = 0;
  }
  card.addEventListener('pointerup', endDrag); card.addEventListener('pointercancel', endDrag);
  card.addEventListener('pointerleave', (e)=>{ if(dragging && e.buttons === 0) endDrag(); });
}

// ---- Wizard «Cosa guardo stasera?» ----
let wizardAnswers = {}, wizardStep = 0;
function openWizard(){ wizardAnswers = {}; wizardStep = 0; renderWizardStep(); wizardBackdrop.classList.add('show'); }
function closeWizard(){ wizardBackdrop.classList.remove('show'); }
function renderWizardStep(){
  const q = WIZARD_QUESTIONS[wizardStep];
  wizardCard.innerHTML = `
    <div class="modal-head"><div class="modal-title">🧭 Cosa guardo stasera?</div><button class="modal-close" id="wizardCloseBtn" aria-label="Chiudi">✕</button></div>
    <div class="modal-note">Domanda ${wizardStep + 1} di ${WIZARD_QUESTIONS.length}</div>
    <div class="modal-section-title">${q.question}</div>
    <div class="wizard-options">${q.options.map(o=> `<button class="btn wizard-opt" data-value="${o.value}">${o.label}</button>`).join('')}</div>`;
  document.getElementById('wizardCloseBtn').addEventListener('click', closeWizard);
  wizardCard.querySelectorAll('.wizard-opt').forEach(btn=> btn.addEventListener('click', ()=>{
    wizardAnswers[q.key] = btn.dataset.value; wizardStep++;
    if(wizardStep >= WIZARD_QUESTIONS.length) finishWizard(); else renderWizardStep();
  }));
}
function finishWizard(){
  let pool = ITEMS.filter(g=> !STATUSES[g.id] || STATUSES[g.id] === 'plan');
  const a = wizardAnswers;
  if(a.what) pool = pool.filter(g=> g.l === a.what);
  if(a.time) pool = pool.filter(g=> lengthClass(g) === a.time);
  if(a.mood){ const mp = MOOD_PRESETS.find(m=> m.key === a.mood); if(mp) pool = pool.filter(mp.test); }
  if(a.tier === 'top') pool = pool.filter(g=> g.tier === 'S+' || g.tier === 'S');
  else if(a.tier === 'good') pool = pool.filter(g=> ['S+','S','A','B'].includes(g.tier));
  let relaxed = false;
  if(!pool.length){ pool = ITEMS.filter(g=> !STATUSES[g.id]); relaxed = true; if(a.what) pool = pool.filter(g=> g.l === a.what); if(!pool.length) pool = ITEMS.slice(); }
  const p = buildTasteProfile();
  const ranked = p.n >= 2 ? pool.slice().sort((x, y)=> (dnaForItem(y, p).pct - dnaForItem(x, p).pct)).slice(0, Math.max(5, Math.ceil(pool.length / 4))) : pool;
  const pick = ranked[Math.floor(Math.random() * ranked.length)];
  closeWizard(); openModal(pick);
  showToast(relaxed ? `Nessun titolo con tutti i criteri: la sorte ha scelto ${pick.name}` : `La sorte ha scelto: ${pick.name}`, 3200);
}
document.getElementById('wizardBtn').addEventListener('click', openWizard);
wizardBackdrop.addEventListener('click', (e)=>{ if(e.target === wizardBackdrop) closeWizard(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && wizardBackdrop.classList.contains('show')) closeWizard(); });
