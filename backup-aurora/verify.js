// ---- Aggiorna info: controlla un gioco su fonti pubbliche (Wikipedia, Wikidata) e propone correzioni ----
// Voto = Metascore riportato da Wikipedia; generi e anno = Wikidata; testi riscritti dall'AI SOLO a partire dagli estratti di Wikipedia.
// Non cambia nulla senza conferma. Sui giochi nuovi controlla in automatico voto, generi e anno (senza AI).
(function(){
  const OV = 'jrpg_game_overrides';
  const tierOf = s=> s >= 95 ? 'S+' : s >= 90 ? 'S' : s >= 85 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : s >= 40 ? 'E' : 'F';
  const CK = 'jrpg_info_checked';
  const loadCk = ()=>{ try{ return JSON.parse(localStorage.getItem(CK) || '{}') || {}; }catch(e){ return {}; } };
  const fmtDate = iso=>{ try{ return new Date(iso).toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit', year:'numeric'}); }catch(e){ return iso; } };
  function markChecked(id){
    const c = loadCk(); c[id] = new Date().toISOString();
    try{ localStorage.setItem(CK, JSON.stringify(c)); }catch(e){}
    const b = document.getElementById('updateInfoBtn');
    if(b){ b.className = 'btn upd-done'; b.textContent = '✅ Info aggiornate il ' + fmtDate(c[id]); }
  }
  window.infoBtnHtml = g=>{
    const d = loadCk()[g.id];
    return d ? `<button class="btn upd-done" id="updateInfoBtn" title="Già controllato: tocca per rifarlo">✅ Info aggiornate il ${fmtDate(d)}</button>`
             : '<button class="btn" id="updateInfoBtn" title="Controlla voto, generi, anno e testi su Wikipedia e Wikidata">🔄 Aggiorna info</button>';
  };
  const loadOv = ()=>{ try{ return JSON.parse(localStorage.getItem(OV) || '{}') || {}; }catch(e){ return {}; } };
  const saveOv = o=>{ try{ localStorage.setItem(OV, JSON.stringify(o)); }catch(e){} };
  const baseName = n=> String(n || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[-–:]\s*(definitive|remaster|remake|complete|hd|edition|reborn|reloaded).*$/i, '').trim();
  const yearsOf = g=> (String(g.year || '').match(/\d{4}/g) || []).map(Number);

  // pulizia una tantum: correzioni sbagliate della lingua di The Legend of Dragoon (id 16), che è in italiano con doppiaggio
  (function(){ try{ if(localStorage.getItem('jrpg_ovfix83')) return; const o = loadOv(); if(o[16]){ if(o[16].label){ delete o[16].label.it; delete o[16].label.ko; delete o[16].label.ok; } if(o[16].enrich) delete o[16].enrich.language; saveOv(o); } localStorage.setItem('jrpg_ovfix83', '1'); }catch(e){} })();
  window.applyGameOverrides = function(){
    const ov = loadOv();
    GAMES.forEach(g=>{
      const o = ov[g.id]; if(!o || g.custom) return;
      ['score','tier','m','tags','year','ysort','story','note'].forEach(k=>{ if(o[k] !== undefined) g[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; });
      if(o.enrich){ g.enrich = g.enrich || {}; Object.assign(g.enrich, o.enrich); }
      if(o.label){ g.label = Object.assign({}, g.label || {}, o.label); }
    });
  };

  async function wp(params){
    const r = await fetch('https://en.wikipedia.org/w/api.php?' + new URLSearchParams(Object.assign({format:'json', origin:'*'}, params)));
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  async function wikiPage(name){
    const base = baseName(name), target = normGameName(base);
    const s = await wp({action:'query', list:'search', srsearch: base + ' video game', srlimit:'6'});
    const hits = (s.query && s.query.search) || [];
    const strip = t=> normGameName(t.replace(/\s*\([^)]*\)\s*$/, ''));
    const pick = hits.find(h=> strip(h.title) === target) || hits.find(h=> /video game/i.test(h.snippet || '') && strip(h.title).includes(target));
    if(!pick) return null;
    const ex = await wp({action:'query', prop:'extracts', explaintext:'1', exsectionformat:'plain', titles: pick.title, redirects:'1'});
    const text = (Object.values(ex.query.pages)[0] || {}).extract || '';
    let mc = null;
    try{
      const w = await wp({action:'parse', page: pick.title, prop:'wikitext', redirects:'1'});
      const m = (w.parse.wikitext['*'] || '').match(/\|\s*MC\d*\s*=\s*(\d{2,3})\s*(?:\/\s*100)?/);
      if(m) mc = +m[1];
    }catch(e){}
    const cm = text.match(/Metacritic[^.]{0,200}?(?:based on|from)\s+(\d+)\s+(?:critic )?reviews/i);
    return {title: pick.title, url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(pick.title.replace(/ /g, '_')), text, mc, count: cm ? +cm[1] : null};
  }
  // estratto utile per l'AI: introduzione + gameplay + accoglienza (max ~9000 caratteri)
  function digest(text){
    const t = String(text || '');
    const i = t.search(/\n\s*Reception\s*\n/i);
    const head = t.slice(0, 5200);
    const rec = i > 0 ? t.slice(i, i + 3600) : '';
    return (head + (rec ? '\n[...]\n' + rec : '')).slice(0, 9000);
  }
  // prova diretta dell'italiano: la voce di it.wikipedia con la tabella "Doppiatore italiano" (nessuna AI, nessuna stima)
  async function itWikiLang(name){
    const base = baseName(name), target = normGameName(base);
    const q = new URLSearchParams({format:'json', origin:'*', action:'query', list:'search', srsearch: base + ' videogioco', srlimit:'3'});
    const s = await (await fetch('https://it.wikipedia.org/w/api.php?' + q)).json();
    const hit = ((s.query && s.query.search) || []).find(h=> normGameName(h.title.replace(/\s*\([^)]*\)\s*$/, '')) === target);
    if(!hit) return null;
    const q2 = new URLSearchParams({format:'json', origin:'*', action:'parse', page: hit.title, prop:'wikitext', redirects:'1'});
    const w = await (await fetch('https://it.wikipedia.org/w/api.php?' + q2)).json();
    const txt = (w.parse && w.parse.wikitext && w.parse.wikitext['*']) || '';
    return {title: hit.title, url: 'https://it.wikipedia.org/wiki/' + encodeURIComponent(hit.title.replace(/ /g, '_')), dub: /doppiatore italiano|doppiaggio italiano|doppiato in italiano/i.test(txt)};
  }
  // ---- Steam: lingue ufficiali (interfaccia/audio/sottotitoli). Steam non permette l'accesso diretto dal browser: si passa da un ponte pubblico (CORS proxy). Se il ponte non risponde, la fonte viene saltata senza errori.
  const PROXIES = [u=> 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u=> 'https://corsproxy.io/?' + encodeURIComponent(u)];
  async function viaProxy(url){
    for(const p of PROXIES){
      try{ const r = await fetch(p(url), {signal: AbortSignal.timeout(9000)}); if(r.ok){ const t = await r.text(); try{ return JSON.parse(t); }catch(e){} } }catch(e){}
    }
    throw new Error('ponte non raggiungibile');
  }
  async function steamInfo(name){
    const base = baseName(name), target = normGameName(base);
    const s = await viaProxy('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(base) + '&cc=IT&l=english');
    const hit = ((s && s.items) || []).find(x=> x.type === 'app' && normGameName(String(x.name).replace(/\s*\([^)]*\)/g, '')) === target);
    if(!hit) return null;
    const d = await viaProxy('https://store.steampowered.com/api/appdetails?appids=' + hit.id + '&l=english&filters=basic,supported_languages');
    const html = d && d[hit.id] && d[hit.id].data && d[hit.id].data.supported_languages || '';
    if(!html) return null;
    const it = /Italian(<strong>\*<\/strong>)?/i.exec(html);
    return {id: hit.id, url: 'https://store.steampowered.com/app/' + hit.id + '/', itText: !!it, itAudio: !!(it && it[1]), langs: html.replace(/<[^>]+>/g, '').replace(/languages with full audio support/i, '').trim().slice(0, 300)};
  }
  // ---- PCGamingWiki: tabella lingue (interfaccia/audio/sottotitoli). Accesso diretto dal browser; se non risponde viene saltata.
  async function pcgwInfo(name){
    const base = baseName(name);
    const q = new URLSearchParams({action:'cargoquery', tables:'L10n', fields:'_pageName=page,Language,Interface,Audio,Subtitles', where:`_pageName="${base.replace(/"/g, '')}" AND Language="Italian"`, format:'json', origin:'*'});
    const r = await fetch('https://www.pcgamingwiki.com/w/api.php?' + q, {signal: AbortSignal.timeout(9000)});
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json(); const row = j.cargoquery && j.cargoquery[0] && j.cargoquery[0].title;
    if(!row) return null;
    const yes = x=> String(x).toLowerCase() === 'true';
    return {url: 'https://www.pcgamingwiki.com/wiki/' + encodeURIComponent(row.page.replace(/ /g, '_')), itText: yes(row.Interface) || yes(row.Subtitles), itAudio: yes(row.Audio)};
  }
  async function gather(g){
    const [wiki, wd, itw, steam, pcgw] = await Promise.allSettled([wikiPage(g.name), wikidataGenreCodes(g.name), itWikiLang(g.name), steamInfo(g.name), pcgwInfo(g.name)]);
    const ok = x=> x.status === 'fulfilled' ? x.value : null;
    return {wiki: ok(wiki), wd: ok(wd), itw: ok(itw), steam: ok(steam), pcgw: ok(pcgw), steamFailed: steam.status === 'rejected', pcgwFailed: pcgw.status === 'rejected',
            errors: [wiki, wd].filter(x=> x.status === 'rejected').length};
  }
  // proposte "di fatto" (senza AI)
  function factChanges(g, src){
    const ch = [];
    // lingua italiana da fonti ufficiali (solo prove positive: se un sito non elenca l'italiano non significa che il gioco non lo abbia; l'edizione PC può differire da quella console)
    { const cur = (g.label || {}).it, rank = {N:0, F:0, S:1, D:2};
      const found = [];
      if(src.steam && src.steam.itText) found.push({code: src.steam.itAudio ? 'D' : 'S', name:'Steam', url: src.steam.url, audio: src.steam.itAudio});
      if(src.pcgw && src.pcgw.itText) found.push({code: src.pcgw.itAudio ? 'D' : 'S', name:'PCGamingWiki', url: src.pcgw.url, audio: src.pcgw.itAudio});
      const best = found.sort((a, b)=> rank[b.code] - rank[a.code])[0];
      if(best && (rank[cur] || 0) < rank[best.code]){
        ch.push({id:'itsrc', label:'🇮🇹 Lingua italiana (' + found.map(f=> f.name).join(' + ') + ')', from: `italiano: ${cur || '—'}`, to: (best.code === 'D' ? 'testi e doppiaggio in italiano' : 'testi/sottotitoli in italiano') + ' — ' + found.map(f=> f.url).join(' · '), patch:{label:{it: best.code}}});
      }
    }
    if(src.itw && src.itw.dub && (g.label || {}).it !== 'D'){
      ch.push({id:'itdub', label:'🎙️ Doppiaggio italiano', from: `italiano: ${(g.label || {}).it || '—'}`, to: `testi e doppiaggio in italiano (prova: la voce di it.wikipedia "${src.itw.title}" elenca i doppiatori italiani) ${src.itw.url}`, patch:{label:{it:'D'}}});
    }
    const nowY = new Date().getFullYear();
    if(src.wiki && src.wiki.mc && src.wiki.mc !== g.score){
      ch.push({id:'score', label:'Voto', from: `${g.score} (${g.m === 'V' ? 'verificato' : 'stima'})`, to: `${src.wiki.mc} (Metacritic, da Wikipedia)`, patch:{score: src.wiki.mc, tier: tierOf(src.wiki.mc), m:'V'}});
    }
    if(src.wd && src.wd.codes){
      const add = src.wd.codes.filter(c=> TAG_INFO[c] && !g.tags.includes(c));
      if(add.length){
        const warn = add.some(c=> EXTRA_GENRE_INFO[c]);
        ch.push({id:'tags', label:'Generi', from: g.tags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(', '), to: '+ ' + add.map(c=> TAG_INFO[c].label).join(', ') + (warn ? ' ⚠️ (esce da JRPG / RPG)' : '') + ' (Wikidata)', patch:{tags: g.tags.concat(add).slice(0, 6)}});
      }
    }
    if(src.wd && src.wd.years && src.wd.years.length){
      const mine = yearsOf(g), wy = src.wd.years;
      if(mine.length && !mine.some(y=> wy.some(z=> Math.abs(y - z) <= 1))){
        const y = Math.min(...wy);
        ch.push({id:'year', label:'Anno', from: g.year, to: String(y) + ' (Wikidata)', patch:{year: String(y), ysort: y}});
      }
      if(Math.min(...wy) > nowY) ch.push({id:'unreleased', label:'⚠️ Non ancora uscito', from:'', to:'Wikidata indica un\'uscita nel ' + Math.min(...wy) + ': voto e recensioni non possono essere reali', patch:{note:'Non ancora uscito (uscita prevista ' + Math.min(...wy) + '): voto provvisorio.', m:'S'}});
    }
    return ch;
  }
  function parseJson(t){
    const s = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if(a < 0 || b < a) return null;
    try{ return JSON.parse(s.slice(a, b + 1)); }catch(e){ return null; }
  }
  async function textChanges(g, src){
    if(!llmAvailable() || !src.wiki || !src.wiki.text) return {changes:[], note: !src.wiki ? 'Nessuna pagina Wikipedia trovata: testi non riscritti.' : 'Nessun motore AI configurato: testi non riscritti.'};
    const prompt = todayLine() + `Aggiorna la scheda del videogioco "${g.name}" (${g.year}, ${g.plat}) usando SOLO le fonti qui sotto. Se una informazione non è nelle fonti scrivi null: non inventare nulla. Niente espressioni come "recente" o "uscito da poco": usa gli anni.
Rispondi SOLO con un oggetto JSON valido con questi campi (in italiano): story (1-2 frasi di trama senza spoiler pesanti), pros (3-4 punti di forza concreti, emersi dalla critica), cons (2-3 difetti concreti, emersi dalla critica), agingNote (1-2 frasi su come regge oggi, con gli anni), whyLikeIt (1 frase: a chi piace).
FONTE — Wikipedia (${src.wiki.title}):
${digest(src.wiki.text)}`;
    const r = await askLLM(prompt, {}, {});
    const j = parseJson(r && r.text);
    if(!j) return {changes:[], note:'L\'AI non ha restituito un risultato leggibile: riprova.'};
    const arr = a=> Array.isArray(a) ? a.map(x=> String(x).trim()).filter(Boolean).slice(0, 5) : [];
    const en = {}; const ch = [];
    const pros = arr(j.pros), cons = arr(j.cons);
    if(pros.length && cons.length){ en.pros = pros; en.cons = cons; ch.push({id:'proscons', label:'Pro e Contro', from: ((g.enrich && g.enrich.pros) || (g.proscons && g.proscons.pros) || []).slice(0,2).join(' · ') || '—', to: pros.slice(0,2).join(' · ') + ' … (riscritti dalle fonti)', patch:{enrich:{pros, cons}}}); }
    if(typeof j.agingNote === 'string' && j.agingNote.length > 20){ ch.push({id:'aging', label:'Come regge oggi', from: ((g.enrich && g.enrich.agingNote) || '—').slice(0, 90), to: j.agingNote.slice(0, 140), patch:{enrich:{agingNote: j.agingNote}}}); }
    if(typeof j.whyLikeIt === 'string' && j.whyLikeIt.length > 15){ ch.push({id:'why', label:'Perché potrebbe piacerti', from: ((g.enrich && g.enrich.whyLikeIt) || '—').slice(0, 90), to: j.whyLikeIt.slice(0, 140), patch:{enrich:{whyLikeIt: j.whyLikeIt}}}); }
    if(typeof j.story === 'string' && j.story.length > 30){ ch.push({id:'story', label:'Trama', from: (g.story || '—').slice(0, 90), to: j.story.slice(0, 160), patch:{story: j.story}}); }
    return {changes: ch, note: ''};
  }

  // ricerca approfondita (Gemini con ricerca Google): ore, "a colpo d'occhio", gameplay, lingua, edizioni. Ogni dato deve avere una fonte, altrimenti null.
  async function deepChanges(g){
    if(!geminiKey()) return {changes:[], sources:[], note:'Ricerca approfondita (ore, difficoltà, lingua, gameplay) non fatta: serve la chiave Gemini.'};
    const Y = new Date().getFullYear();
    const prompt = todayLine() + `Fai le ricerche includendo gli anni ${Y} e ${Y - 1} nelle query. Per le informazioni che cambiano nel tempo (piattaforme, edizioni, lingue, prezzi, abbonamenti, patch, ore dopo gli aggiornamenti) usa SOLO pagine datate ${Y - 2} o dopo e ignora quelle senza data o più vecchie; per le informazioni storiche (trama, voto alla prima uscita) va bene qualsiasi anno. Se per un dato non trovi fonti aggiornate scrivi null. Cerca online informazioni ATTENDIBILI sul videogioco "${g.name}" (${g.year}, ${g.plat}) consultando fonti come Metacritic, OpenCritic, HowLongToBeat, Wikipedia, PCGamingWiki, Steam (lingue: interfaccia, audio, sottotitoli), PSXDataCenter (edizioni PAL dei giochi PS1/PS2), RPGamer, RPGFan, gli store ufficiali (Steam, PlayStation Store, Nintendo eShop) e i siti dei publisher. Compila SOLO ciò che trovi in fonti affidabili; se non lo trovi scrivi null, NON stimare e NON inventare.
Rispondi SOLO con un oggetto JSON valido con questi campi: hoursMain (ore storia principale, numero), hoursCompletionist (ore completista, numero), difficulty (1-5), grind (1-5, quanto grinding serve), storyWeight (1-5, peso della storia), pace ("L" lento, "M" medio, "V" veloce), italian ("D" testi E doppiaggio italiani ufficiali, "S" solo testi/sottotitoli italiani ufficiali, "F" solo fan-translation, "N" nessun italiano ufficiale, oppure null se NON trovi una fonte esplicita: NON rispondere "N" per mancanza di informazioni; per i giochi usciti prima del 2010 controlla l'edizione europea/italiana (PAL) originale del disco o della cartuccia e non solo gli store attuali, perché molti giochi PS1/PS2/Wii/DS uscirono localizzati in italiano anche se la versione americana era solo in inglese), language (una frase in italiano su lingue di testi E doppiaggio nell'edizione italiana/europea e nelle riedizioni, citando ciò che dice la fonte; null se non lo trovi), remaster (una frase in italiano su edizioni, remaster o remake esistenti), gameplayScore (0-10, in base alla critica), gameplayNote (una frase in italiano sul gameplay), fitIf (una frase: a chi piace), avoidIf (una frase: chi dovrebbe evitarlo; NON citare la lingua italiana se non hai una fonte esplicita), criticScore (Metascore o OpenCritic, numero 0-100, oppure null), graphicsToday (1-2 frasi in italiano su come regge oggi la grafica e la parte tecnica rispetto agli standard del ${Y}, senza dire "recente"), asOf (l'anno della fonte PIÙ VECCHIA che hai usato per lingua, edizioni, piattaforme e ore).`;
    const r = await askLLM(prompt, {}, {search:true, forceGemini:true});
    const j = parseJson(r && r.text);
    const srcs = ((r && r.sources) || []).filter(s=> s.title).slice(0, 6);
    if(!j) return {changes:[], sources: srcs, note:'La ricerca approfondita non ha dato un risultato leggibile.'};
    const num = (x, lo, hi)=>{ const n = typeof x === 'number' ? x : parseFloat(x); return (isFinite(n) && n >= lo && n <= hi) ? n : null; };
    const str = x=> (typeof x === 'string' && x.trim().length > 8 && !/^null$/i.test(x.trim())) ? x.trim() : null;
    const e = g.enrich || {}, l = g.label || {}, ch = [];
    const asOf = num(j.asOf, 1990, Y + 1); const stale = !!(asOf && asOf < Y - 2); const sfx = stale ? ` ⏳ fonte del ${asOf}` : '';
    const hm = num(j.hoursMain, 1, 400), hc = num(j.hoursCompletionist, 1, 1500);
    if(hm && hm !== (e.hoursMain || l.h)){ ch.push({id:'hours', label:'Ore di gioco', from: `${e.hoursMain || l.h || '—'}h storia · ${e.hoursCompletionist || '—'}h completista`, to: `${hm}h storia · ${hc || e.hoursCompletionist || '—'}h completista` + sfx, off: stale, patch:{enrich:{hoursMain: hm, hoursCompletionist: hc || e.hoursCompletionist}, label:{h: hm}}}); }
    const d = num(j.difficulty, 1, 5), gr = num(j.grind, 1, 5), sw = num(j.storyWeight, 1, 5);
    const pace = ['L','M','V'].includes(j.pace) ? j.pace : null, it = ['D','S','F','N'].includes(j.italian) ? j.italian : null;
    const lab = {}; if(d) lab.d = Math.round(d); if(gr) lab.g = Math.round(gr); if(sw) lab.s = Math.round(sw); if(pace) lab.p = pace; if(it) lab.it = it;
    const fit = str(j.fitIf), avoid = str(j.avoidIf); if(fit) lab.ok = fit; if(avoid) lab.ko = avoid;
    const itDown = !!(lab.it === 'N' && ['D','S','F'].includes(l.it));   // l'AI dice "nessun italiano" ma il dato attuale dice il contrario: mai applicare in automatico
    const diff = Object.keys(lab).filter(k=> lab[k] !== l[k]);
    if(diff.length){ ch.push({id:'label', label:'A colpo d\'occhio' + (itDown ? ' ⚠️ lingua in contrasto' : ''), from: `difficoltà ${l.d || '—'}, grinding ${l.g || '—'}, storia ${l.s || '—'}, ritmo ${l.p || '—'}, italiano ${l.it || '—'}`, to: `difficoltà ${lab.d || l.d || '—'}, grinding ${lab.g || l.g || '—'}, storia ${lab.s || l.s || '—'}, ritmo ${lab.p || l.p || '—'}, italiano ${lab.it || l.it || '—'}` + (fit || avoid ? ' · consigli aggiornati' : '') + sfx, off: stale || itDown, warn: itDown, patch:{label: lab}}); }
    const gs = num(j.gameplayScore, 0, 10), gn = str(j.gameplayNote);
    if(gs != null || gn){ ch.push({id:'gameplay', label:'Gameplay', from: `${e.gameplayScore != null ? e.gameplayScore : '—'}/10 — ${(e.gameplayNote || '').slice(0, 70)}`, to: `${gs != null ? gs : (e.gameplayScore != null ? e.gameplayScore : '—')}/10 — ${(gn || e.gameplayNote || '').slice(0, 110)}`, patch:{enrich:Object.assign({}, gs != null ? {gameplayScore: gs} : {}, gn ? {gameplayNote: gn} : {})}}); }
    const lg = str(j.language), rm = str(j.remaster);
    const langDown = !!(lg && /nessun[oa]? .{0,25}italian|solo inglese|non .{0,20}in italiano/i.test(lg) && ['D','S','F'].includes(l.it));
    if(lg || rm){ ch.push({id:'lang', label:'Lingua ed edizioni' + (langDown ? ' ⚠️ in contrasto col dato attuale' : ''), from: ((e.language || '') + ' ' + (e.remaster || '')).slice(0, 120) || '—', to: [lg, rm].filter(Boolean).join(' ').slice(0, 200) + sfx, off: stale || langDown, patch:{enrich:Object.assign({}, lg ? {language: lg} : {}, rm ? {remaster: rm} : {})}}); }
    const gt = str(j.graphicsToday);
    if(gt){ ch.push({id:'aging', label:'Grafica e tecnica oggi', from: ((e.agingNote) || '—').slice(0, 100), to: gt.slice(0, 200), patch:{enrich:{agingNote: gt}}}); }
    const cs = num(j.criticScore, 0, 100);
    if(cs && cs !== g.score){ ch.push({id:'score2', label:'Voto (ricerca AI, da confermare)', from: String(g.score), to: `${cs} (Metascore/OpenCritic secondo la ricerca)`, patch:{score: cs, tier: tierOf(cs), m:'V'}, off:true}); }
    return {changes: ch, sources: srcs, note:''};
  }
  function mergePatch(list){
    const p = {};
    list.forEach(c=>{ Object.keys(c.patch).forEach(k=>{ if(k === 'enrich') p.enrich = Object.assign(p.enrich || {}, c.patch.enrich); else if(k === 'label') p.label = Object.assign(p.label || {}, c.patch.label); else p[k] = c.patch[k]; }); });
    return p;
  }
  async function applyPatch(g, p){
    if(g.custom){
      const doc = {name: g.name, plat: g.plat, year: p.year || g.year, tier: p.tier || g.tier, score: p.score != null ? p.score : g.score, tags: p.tags || g.tags, story: p.story != null ? p.story : g.story, note: p.note || g.note, label: Object.assign({}, g.label || {}, p.label || {}),
        pros: (p.enrich && p.enrich.pros) || (g.proscons && g.proscons.pros) || [], cons: (p.enrich && p.enrich.cons) || (g.proscons && g.proscons.cons) || [], addedAt: new Date().toISOString()};
      if(COVER_DB) await COVER_DB.doc('customGames/' + String(g.id)).set(doc);
    } else {
      const ov = loadOv(); const cur = ov[g.id] || {};
      ov[g.id] = Object.assign({}, cur, p, {enrich: Object.assign({}, cur.enrich || {}, p.enrich || {}), label: Object.assign({}, cur.label || {}, p.label || {})});
      saveOv(ov); applyGameOverrides();
    }
    try{ ensureGenreLists(p.tags || []); renderListBar(); render(); }catch(e){}
  }

  // ----- interfaccia -----
  function panel(){
    let el = document.getElementById('updInfoBackdrop');
    if(!el){ el = document.createElement('div'); el.id = 'updInfoBackdrop'; el.className = 'dup-backdrop'; document.body.appendChild(el); el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-ui-close]')) el.classList.remove('show'); }); }
    return el;
  }
  window.openUpdateInfo = async function(g){
    if(!g) return;
    const el = panel();
    const shell = body=> `<div class="lp-card"><div class="lp-head"><b>🔄 Aggiorna info — ${escHtml(g.name)}</b><button class="btn" data-ui-close>Chiudi</button></div>${body}</div>`;
    const prev = loadCk()[g.id];
    el.innerHTML = shell('<div class="lp-sub" id="uiStatus">Cerco su Wikipedia e Wikidata…' + (prev ? ' (ultimo controllo: ' + fmtDate(prev) + ')' : '') + '</div>');
    el.classList.add('show');
    const status = t=>{ const s = el.querySelector('#uiStatus'); if(s) s.textContent = t; };
    let src;
    try{ src = await gather(g); }catch(e){ src = {wiki:null, wd:null, errors:2}; }
    if(!src.wiki && !src.wd){ el.innerHTML = shell('<div class="lp-sub">❌ Non riesco a consultare le fonti (rete assente o pagina non trovata). Riprova più tardi.</div>'); return; }
    let changes = factChanges(g, src), note = '';
    if(src.steamFailed || src.pcgwFailed) note = 'Non raggiungibili ora: ' + [src.steamFailed && 'Steam', src.pcgwFailed && 'PCGamingWiki'].filter(Boolean).join(', ') + ' (le altre fonti sì).';
    status('Fonti trovate. Riscrivo trama e pro/contro dalle fonti…');
    try{ const t = await textChanges(g, src); changes = changes.concat(t.changes); note = (note ? note + ' ' : '') + (t.note || ''); }catch(e){ note = 'Testi non riscritti: ' + llmErrorText(e); }
    status('Ricerca approfondita di ore, gameplay, lingua ed edizioni…');
    let deepSrc = [];
    try{ const d = await deepChanges(g); if(d.changes.some(c=> c.id === 'aging')) changes = changes.filter(c=> c.id !== 'aging'); changes = changes.concat(d.changes); deepSrc = d.sources; if(d.note) note += (note ? ' ' : '') + d.note; }catch(e){ note += (note ? ' ' : '') + 'Ricerca approfondita non riuscita: ' + llmErrorText(e); }
    const sources = [src.itw && `<a href="${src.itw.url}" target="_blank" rel="noopener">it.wikipedia</a>`, src.steam && `<a href="${src.steam.url}" target="_blank" rel="noopener">Steam</a>`, src.pcgw && `<a href="${src.pcgw.url}" target="_blank" rel="noopener">PCGamingWiki</a>`, src.wiki && `<a href="${src.wiki.url}" target="_blank" rel="noopener">Wikipedia</a>`, src.wd && src.wd.qid && `<a href="https://www.wikidata.org/wiki/${src.wd.qid}" target="_blank" rel="noopener">Wikidata</a>`].concat(deepSrc.map(s=> `<a href="${escHtml(s.uri)}" target="_blank" rel="noopener">${escHtml(s.title)}</a>`)).filter(Boolean).join(' · ');
    if(!changes.length){ markChecked(g.id); el.innerHTML = shell(`<div class="lp-sub">✅ Nessuna correzione da proporre: i dati coincidono con le fonti (${sources || 'nessuna fonte'}).${note ? '<br>' + escHtml(note) : ''}</div>`); return; }
    el.innerHTML = shell(`<div class="lp-sub">Fonti: ${sources}. Togli la spunta a ciò che non ti convince.${note ? '<br>' + escHtml(note) : ''}</div>
      <div class="gc-rows">${changes.map((c,i)=> `<label class="gc-row"><input type="checkbox" data-i="${i}" ${c.off ? '' : 'checked'}> <span><b>${escHtml(c.label)}</b><br><small>Prima: ${escHtml(c.from || '—')}</small><br>Dopo: ${escHtml(c.to)}</span></label>`).join('')}</div>
      <div class="lp-tools"><button class="btn primary" id="uiApply">Applica i selezionati</button></div>`);
    el.querySelector('#uiApply').addEventListener('click', async ()=>{
      const chosen = [...el.querySelectorAll('input[data-i]:checked')].map(cb=> changes[+cb.dataset.i]);
      await applyPatch(g, mergePatch(chosen)); markChecked(g.id);
      el.classList.remove('show'); showToast('✅ Scheda aggiornata', 3000);
      try{ openModal(GAMES.find(x=> x.id === g.id) || g); }catch(e){}
    });
  };
  document.addEventListener('click', e=>{ if(e.target && e.target.id === 'updateInfoBtn' && typeof currentModalGame !== 'undefined' && currentModalGame) openUpdateInfo(currentModalGame); });

  // ----- giochi nuovi: controllo automatico di voto, generi e anno (senza AI) -----
  window.verifyNewGameGenres = async function(id, doc){
    try{
      const g = GAMES.find(x=> x.id === id); if(!g) return;
      const src = await gather({name: doc.name});
      const ch = factChanges(g, src);
      if(!ch.length) return;
      await applyPatch(g, mergePatch(ch));
      showToast('🔎 Verificato su Wikipedia/Wikidata: ' + ch.map(c=> c.label).join(', ') + ' aggiornati', 5000);
    }catch(e){}
  };
  try{ applyGameOverrides(); renderListBar(); if(state.view === 'list') render(); }catch(e){}
})();
