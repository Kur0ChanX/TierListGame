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
    if(b){ b.className = 'btn upd-done'; b.textContent = '✅ Aggiornato il ' + fmtDate(c[id]); }
  }
  window.infoBtnHtml = g=>{
    const d = loadCk()[g.id];
    let au = null; try{ au = (JSON.parse(localStorage.getItem('jrpg_audit') || '{}') || {})[g.id]; }catch(e){}
    if(au && au.ch && au.ch.length) return `<button class="btn" id="auditPendingBtn" title="Il controllo automatico ha trovato delle differenze: tocca per confrontarle e decidere">📝 ${au.ch.length} ${au.ch.length === 1 ? 'modifica' : 'modifiche'} da approvare</button>`;
    if(au && au.deep) return `<button class="btn upd-done" id="updateInfoBtn" title="Controllato con fonti e ricerca: non viene ricontrollato. Tocca per rifarlo a mano">✅ Aggiornato il ${fmtDate(au.t)}</button>`;
    return d ? `<button class="btn upd-done" id="updateInfoBtn" title="Già controllato: tocca per rifarlo">✅ Aggiornato il ${fmtDate(d)}</button>`
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
  // Wikipedia ad albero: se il titolo esatto non basta prova varianti (senza sottotitolo, senza edizione, «(video game)», parole chiave) prima di arrendersi
  async function wikiPageTree(name){
    const seenN = new Set(); const variants = [name, baseName(name), String(name).split(/\s*[:–-]\s+/)[0], String(name).replace(/\s*\([^)]*\)/g, '').trim(), baseName(name) + ' (video game)']
      .map(x=> String(x || '').trim()).filter(x=>{ if(!x || seenN.has(x.toLowerCase())) return false; seenN.add(x.toLowerCase()); return true; });
    let lastErr = null;
    for(const v of variants){
      try{ const r = await wikiPage(v); if(r) return r; }catch(e){ lastErr = e; }
    }
    if(lastErr && variants.length) throw lastErr;
    return null;
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
    const [wiki, wd, itw, steam, pcgw] = await Promise.allSettled([wikiPageTree(g.name), wikidataGenreCodes(g.name), itWikiLang(g.name), steamInfo(g.name), pcgwInfo(g.name)]);
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
  async function textChanges(g, src, silent){
    if(!llmAvailable() || !src.wiki || !src.wiki.text) return {changes:[], note: !src.wiki ? 'Nessuna pagina Wikipedia trovata: testi non riscritti.' : 'Nessun motore AI configurato: testi non riscritti.'};
    const prompt = todayLine() + `Aggiorna la scheda del videogioco "${g.name}" (${g.year}, ${g.plat}) usando SOLO le fonti qui sotto. Se una informazione non è nelle fonti scrivi null: non inventare nulla. Niente espressioni come "recente" o "uscito da poco": usa gli anni.
Rispondi SOLO con un oggetto JSON valido con questi campi (in italiano): story (trama ricca e dettagliata: 5-8 frasi, circa 600-900 caratteri: ambientazione, protagonisti, premessa e svolgimento generale, senza spoiler pesanti sul finale), pros (3-4 punti di forza concreti, emersi dalla critica), cons (2-3 difetti concreti, emersi dalla critica), agingNote (1-2 frasi su come regge oggi, con gli anni), whyLikeIt (una frase impersonale che spiega cosa rende appagante il gioco; niente riferimenti a persone tipo «gli piacerà»).
FONTE — Wikipedia (${src.wiki.title}):
${digest(src.wiki.text)}`;
    const r = await askLLM(prompt, {}, {fast:true, silent: !!silent, label:'Riscrivo la scheda dalle fonti…'});
    const j = parseJson(r && r.text);
    if(!j) return {changes:[], note:'L\'AI non ha restituito un risultato leggibile: riprova.'};
    const arr = a=> Array.isArray(a) ? a.map(x=> String(x).trim()).filter(Boolean).slice(0, 5) : [];
    const en = {}; const ch = [];
    const pros = arr(j.pros), cons = arr(j.cons);
    if(pros.length && cons.length){ en.pros = pros; en.cons = cons; ch.push({id:'proscons', label:'Pro e Contro', from: ((g.enrich && g.enrich.pros) || (g.proscons && g.proscons.pros) || []).slice(0,2).join(' · ') || '—', to: pros.slice(0,2).join(' · ') + ' … (riscritti dalle fonti)', patch:{enrich:{pros, cons}}}); }
    if(typeof j.agingNote === 'string' && j.agingNote.length > 20){ ch.push({id:'aging', label:'Come regge oggi', from: ((g.enrich && g.enrich.agingNote) || '—'), to: j.agingNote, patch:{enrich:{agingNote: j.agingNote}}}); }
    if(typeof j.whyLikeIt === 'string' && j.whyLikeIt.length > 15){ ch.push({id:'why', label:'Perché potrebbe piacerti', from: ((g.enrich && g.enrich.whyLikeIt) || '—'), to: j.whyLikeIt, patch:{enrich:{whyLikeIt: j.whyLikeIt}}}); }
    if(typeof j.story === 'string' && j.story.length > 200){ ch.push({id:'story', label:'Trama', from: (g.story || '—'), to: j.story, patch:{story: j.story}}); }
    return {changes: ch, note: ''};
  }

  // ricerca approfondita (Gemini con ricerca Google): ore, "a colpo d'occhio", gameplay, lingua, edizioni. Ogni dato deve avere una fonte, altrimenti null.
  async function deepChanges(g, silent){
    if(!geminiKey()) return {changes:[], sources:[], note:'Ricerca approfondita (ore, difficoltà, lingua, gameplay) non fatta: serve la chiave Gemini.'};
    const Y = new Date().getFullYear();
    const prompt = todayLine() + `Fai le ricerche includendo gli anni ${Y} e ${Y - 1} nelle query. Per le informazioni che cambiano nel tempo (piattaforme, edizioni, lingue, prezzi, abbonamenti, patch, ore dopo gli aggiornamenti) usa SOLO pagine datate ${Y - 2} o dopo e ignora quelle senza data o più vecchie; per le informazioni storiche (trama, voto alla prima uscita) va bene qualsiasi anno. Se per un dato non trovi fonti aggiornate scrivi null. Cerca online informazioni ATTENDIBILI sul videogioco "${g.name}" (${g.year}, ${g.plat}) consultando fonti come Metacritic, OpenCritic, HowLongToBeat, Wikipedia, PCGamingWiki, Steam (lingue: interfaccia, audio, sottotitoli), PSXDataCenter (edizioni PAL dei giochi PS1/PS2), RPGamer, RPGFan, gli store ufficiali (Steam, PlayStation Store, Nintendo eShop) e i siti dei publisher. Compila SOLO ciò che trovi in fonti affidabili; se non lo trovi scrivi null, NON stimare e NON inventare.
Rispondi SOLO con un oggetto JSON valido con questi campi: hoursMain (ore indicative per finire la storia principale o la run/campagna principale; nei giochi senza trama vera (roguelite, tattici, puzzle, arcade) indica la durata di UNA run o campagna (1-3h), MAI le ore per sbloccare tutto (quelle vanno in hoursCompletionist), numero), hoursCompletionist (ore completista, numero), difficulty (1-5), grind (1-5: quanta ripetizione/farming serve; conta anche sblocchi di contenuti, squadre, armi e meta-progressione dei roguelite: mai lasciarlo vuoto se ci sono sblocchi; 1 = nessuno, 3 = qualche sblocco, 5 = molto grinding), storyWeight (1-5: 1 = trama assente o minima, 5 = la storia è il cuore del gioco; deve essere COERENTE con le ore storia), pace ("L" lento, "M" medio, "V" veloce), italian ("D" testi E doppiaggio italiani ufficiali, "S" solo testi/sottotitoli italiani ufficiali, "F" solo fan-translation, "N" nessun italiano ufficiale, oppure null se NON trovi una fonte esplicita: NON rispondere "N" per mancanza di informazioni; per i giochi usciti prima del 2010 controlla l'edizione europea/italiana (PAL) originale del disco o della cartuccia e non solo gli store attuali, perché molti giochi PS1/PS2/Wii/DS uscirono localizzati in italiano anche se la versione americana era solo in inglese), language (una frase in italiano su lingue di testi E doppiaggio nell'edizione italiana/europea e nelle riedizioni, citando ciò che dice la fonte; null se non lo trovi), remaster (una frase in italiano su edizioni, remaster o remake esistenti), gameplayScore (0-10, in base alla critica), gameplayNote (una frase in italiano sul gameplay), fitIf (completa la frase «Fa per te se…» in SECONDA PERSONA singolare, es. "cerchi un tattico a turni senza grinding": inizia con un verbo alla seconda persona come ami, cerchi, vuoi, preferisci; NON ripetere «Fa per te se» e MAI la terza persona tipo «gli piacerà»), avoidIf (completa la frase «Lascia stare se…» in SECONDA PERSONA singolare, es. "cerchi una trama profonda": inizia con un verbo alla seconda persona come cerchi, vuoi, odi, non sopporti; NON ripetere «Lascia stare se» e MAI la terza persona), criticScore (Metascore o OpenCritic, numero 0-100, oppure null), graphicsToday (1-2 frasi in italiano su come regge oggi la grafica e la parte tecnica rispetto agli standard del ${Y}, senza dire "recente"), asOf (l'anno della fonte PIÙ VECCHIA che hai usato per lingua, edizioni, piattaforme e ore).`;
    let r = await askLLM(prompt, {}, {search:true, forceGemini:true, silent: !!silent, label:'Ricerca approfondita sul web…'});
    let j = parseJson(r && r.text);
    // non mi fermo al primo tentativo: altre fonti (Steam, IGDB, RAWG, MobyGames, GameFAQs, HowLongToBeat, Reddit)
    if(!j || !Object.values(j).some(v=> v != null)){
      const alt = prompt + `\nIMPORTANTE: il primo tentativo non ha dato risultati. Ora cerca ALTROVE: pagine Steam, IGDB, RAWG, MobyGames, GameFAQs, HowLongToBeat, Fandom wiki, Reddit e riviste specializzate, anche con titoli alternativi o nomi giapponesi/europei. Prova varianti del titolo (senza sottotitolo, con l'edizione remaster). Restituisci comunque il JSON compilato con ciò che trovi.`;
      try{ r = await askLLM(alt, {}, {search:true, forceGemini:true, silent: !!silent, label:'Frugu Frugu prova altre fonti…'}); j = parseJson(r && r.text) || j; }catch(e){}
    }
    const srcs = ((r && r.sources) || []).filter(s=> s.title).slice(0, 6);
    if(!j) return {changes:[], sources: srcs, note:'La ricerca approfondita non ha dato un risultato leggibile.'};
    const num = (x, lo, hi)=>{ const n = typeof x === 'number' ? x : parseFloat(x); return (isFinite(n) && n >= lo && n <= hi) ? n : null; };
    const str = x=> (typeof x === 'string' && x.trim().length > 8 && !/^null$/i.test(x.trim())) ? x.trim() : null;
    const e = g.enrich || {}, l = g.label || {}, ch = [];
    const asOf = num(j.asOf, 1990, Y + 1); const stale = !!(asOf && asOf < Y - 2); const sfx = stale ? ` ⏳ fonte del ${asOf}` : '';
    const hm = num(j.hoursMain, 1, 400), hc = num(j.hoursCompletionist, 1, 1500);
    const sw0 = num(j.storyWeight, 1, 5) || l.s; const incoh = !labelCoherent({s: sw0, h: hm}, g.tags);
    if(hm && hm !== (e.hoursMain || l.h)){ ch.push({id:'hours', label:'Ore di gioco' + (incoh ? ' ⚠️ incoerenti col peso storia' : ''), warn: incoh, from: `${e.hoursMain || l.h || '—'}h storia · ${e.hoursCompletionist || '—'}h completista`, to: `${hm}h storia · ${hc || e.hoursCompletionist || '—'}h completista` + sfx, off: stale, patch:{enrich:{hoursMain: hm, hoursCompletionist: hc || e.hoursCompletionist}, label:{h: hm}}}); }
    const d = num(j.difficulty, 1, 5), gr = num(j.grind, 1, 5), sw = num(j.storyWeight, 1, 5);
    const pace = ['L','M','V'].includes(j.pace) ? j.pace : null, it = ['D','S','F','N'].includes(j.italian) ? j.italian : null;
    const lab = {}; if(d) lab.d = Math.round(d); if(gr) lab.g = Math.round(gr); if(sw) lab.s = Math.round(sw); if(pace) lab.p = pace; if(it) lab.it = it;
    const fit = fixSecondPerson(str(j.fitIf)), avoid = fixSecondPerson(str(j.avoidIf)); if(fit) lab.ok = fit; if(avoid) lab.ko = avoid;
    const itDown = !!(lab.it === 'N' && ['D','S','F'].includes(l.it));   // l'AI dice "nessun italiano" ma il dato attuale dice il contrario: mai applicare in automatico
    const diff = Object.keys(lab).filter(k=> lab[k] !== l[k]);
    if(diff.length){ ch.push({id:'label', label:'A colpo d\'occhio' + (itDown ? ' ⚠️ lingua in contrasto' : ''), from: `difficoltà ${l.d || '—'}, grinding ${l.g || '—'}, storia ${l.s || '—'}, ritmo ${l.p || '—'}, italiano ${l.it || '—'}`, to: `difficoltà ${lab.d || l.d || '—'}, grinding ${lab.g || l.g || '—'}, storia ${lab.s || l.s || '—'}, ritmo ${lab.p || l.p || '—'}, italiano ${lab.it || l.it || '—'}` + (fit || avoid ? ' · consigli aggiornati' : '') + sfx, off: stale || itDown, warn: itDown, patch:{label: lab}}); }
    const gs = num(j.gameplayScore, 0, 10), gn = str(j.gameplayNote);
    if(gs != null || gn){ ch.push({id:'gameplay', label:'Gameplay', from: `${e.gameplayScore != null ? e.gameplayScore : '—'}/10 — ${(e.gameplayNote || '')}`, to: `${gs != null ? gs : (e.gameplayScore != null ? e.gameplayScore : '—')}/10 — ${(gn || e.gameplayNote || '')}`, patch:{enrich:Object.assign({}, gs != null ? {gameplayScore: gs} : {}, gn ? {gameplayNote: gn} : {})}}); }
    const lg = str(j.language), rm = str(j.remaster);
    const langDown = !!(lg && /nessun[oa]? .{0,25}italian|solo inglese|non .{0,20}in italiano/i.test(lg) && ['D','S','F'].includes(l.it));
    if(lg || rm){ ch.push({id:'lang', label:'Lingua ed edizioni' + (langDown ? ' ⚠️ in contrasto col dato attuale' : ''), from: ((e.language || '') + ' ' + (e.remaster || '')) || '—', to: [lg, rm].filter(Boolean).join(' ') + sfx, off: stale || langDown, patch:{enrich:Object.assign({}, lg ? {language: lg} : {}, rm ? {remaster: rm} : {})}}); }
    const gt = str(j.graphicsToday);
    if(gt){ ch.push({id:'aging', label:'Grafica e tecnica oggi', from: ((e.agingNote) || '—'), to: gt, patch:{enrich:{agingNote: gt}}}); }
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
        pros: (p.enrich && p.enrich.pros) || (g.proscons && g.proscons.pros) || [], cons: (p.enrich && p.enrich.cons) || (g.proscons && g.proscons.cons) || [], enrich: cleanCustomEnrich(Object.assign({}, g.enrich || {}, p.enrich || {})) || undefined, addedAt: new Date().toISOString()};
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
    const openFail = !src.wiki && !src.wd;                       // nessuna fonte aperta ha risposto: non mi arrendo, passo alla ricerca web (Gemini) e alle altre fonti
    if(openFail && !geminiKey() && !src.steam && !src.pcgw && !src.itw){ el.innerHTML = shell('<div class="lp-sub">🦝 Frugu Frugu ha guardato in tutti i bidoni aperti (Wikipedia, Wikidata, it.wikipedia, Steam, PCGamingWiki) e non ha trovato questo titolo. Con una chiave Gemini (⚙️ in Chiedi a Claude) frugherei anche sul web: aggiungila e riprova.</div>'); return; }
    let changes = factChanges(g, src), note = '';
    if(src.steamFailed || src.pcgwFailed) note = 'Non raggiungibili ora: ' + [src.steamFailed && 'Steam', src.pcgwFailed && 'PCGamingWiki'].filter(Boolean).join(', ') + ' (le altre fonti sì).';
    status(openFail ? 'Frugu Frugu: le fonti aperte sono vuote, passo al bidone del web…' : 'Frugu Frugu ha trovato le fonti. Riscrivo trama e pro/contro…');
    try{ const t = await textChanges(g, src); changes = changes.concat(t.changes); note = (note ? note + ' ' : '') + (t.note || ''); }catch(e){ note = 'Testi non riscritti: ' + llmErrorText(e); }
    status('Ricerca approfondita di ore, gameplay, lingua ed edizioni…');
    let deepSrc = [];
    try{ const d = await deepChanges(g); if(d.changes.some(c=> c.id === 'aging')) changes = changes.filter(c=> c.id !== 'aging'); changes = changes.concat(d.changes); deepSrc = d.sources; if(d.note) note += (note ? ' ' : '') + d.note; }catch(e){ note += (note ? ' ' : '') + 'Ricerca approfondita non riuscita: ' + llmErrorText(e); }
    const sources = [src.itw && `<a href="${src.itw.url}" target="_blank" rel="noopener">it.wikipedia</a>`, src.steam && `<a href="${src.steam.url}" target="_blank" rel="noopener">Steam</a>`, src.pcgw && `<a href="${src.pcgw.url}" target="_blank" rel="noopener">PCGamingWiki</a>`, src.wiki && `<a href="${src.wiki.url}" target="_blank" rel="noopener">Wikipedia</a>`, src.wd && src.wd.qid && `<a href="https://www.wikidata.org/wiki/${src.wd.qid}" target="_blank" rel="noopener">Wikidata</a>`].concat(deepSrc.map(s=> `<a href="${escHtml(s.uri)}" target="_blank" rel="noopener">${escHtml(s.title)}</a>`)).filter(Boolean).join(' · ');
    if(!changes.length){ markChecked(g.id); el.innerHTML = shell(`<div class="lp-sub">✅ Nessuna correzione da proporre: i dati coincidono con le fonti (${sources || 'nessuna fonte'}).${note ? '<br>' + escHtml(note) : ''}</div>`); return; }
    el.innerHTML = shell(`<div class="lp-sub">Fonti: ${sources || 'nessuna'}. ${changes.length} ${changes.length === 1 ? 'modifica proposta' : 'modifiche proposte'}: scorri per vedere tutto e togli la spunta a ciò che non ti convince.${note ? '<br>' + escHtml(note) : ''}</div>
      <div class="au-rev">${changes.map((c,i)=> `<div class="au-chg"><label><h4><input type="checkbox" data-i="${i}" ${(c.off || c.warn) ? '' : 'checked'}> ${escHtml(c.label)}</h4></label>
        <div class="au-box au-before"><small>PRIMA (quello che c'è ora)</small>${escHtml(c.from || '—')}</div>
        <div class="au-box au-after"><small>DOPO (proposta)</small>${escHtml(c.to)}</div></div>`).join('')}
        <div class="au-actions"><button class="btn primary" id="uiApply">✅ Approva le modifiche spuntate</button><button class="btn" id="uiKeep">↩️ Tieni precedente</button><button class="btn" data-ui-close>⏭️ Decido dopo</button></div></div>`);
    el.querySelector('#uiKeep').addEventListener('click', ()=>{ markChecked(g.id); el.classList.remove('show'); showToast('Tenuti i dati precedenti', 2000); });
    el.querySelector('#uiApply').addEventListener('click', async ()=>{
      const chosen = [...el.querySelectorAll('input[data-i]:checked')].map(cb=> changes[+cb.dataset.i]);
      if(!chosen.length){ showToast('Spunta almeno una modifica, oppure scegli «Tieni precedente»', 2500); return; }
      await applyPatch(g, mergePatch(chosen)); markChecked(g.id);
      el.classList.remove('show'); showToast('✅ Scheda aggiornata', 3000);
      try{ openModal(GAMES.find(x=> x.id === g.id) || g); }catch(e){}
    });
  };
  document.addEventListener('click', e=>{ if(e.target && e.target.id === 'auditPendingBtn' && typeof currentModalGame !== 'undefined' && currentModalGame){ try{ document.getElementById('modalBackdrop').classList.remove('show'); }catch(x){} openAuditReview(currentModalGame.id); } });
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

  // ----- controllo passivo del database: un gioco alla volta, in silenzio, dall'apertura dell'app -----
  // Per ogni gioco: fonti aperte (Wikipedia, Wikidata, it.wikipedia) + Gemini (riscrittura dalle fonti e ricerca approfondita con fonti).
  // Non cambia MAI nulla da solo: le proposte vanno in ✨ → Controllo dati, dove vedi prima/dopo e dai tu l'ok (e puoi annullare).
  const AU = 'jrpg_audit', AU_SKIP = 'jrpg_audit_skip', AU_ON = 'jrpg_autoaudit', AU_CAP = 'jrpg_audit_cap', AU_DAY = 'jrpg_audit_day', AU_UNDO = 'jrpg_audit_undo', AU_DAYS = 90;
  const auLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(AU) || '{}') || {}; }catch(e){ return {}; } };
  const auSave = o=>{ try{ localStorage.setItem(AU, JSON.stringify(o)); }catch(e){} };
  const skLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(AU_SKIP) || '{}') || {}; }catch(e){ return {}; } };
  const auKey = (id, c)=> id + '|' + c.id + '|' + String(c.to).slice(0, 60);
  const auCap = ()=> parseInt(localStorage.getItem(AU_CAP), 10) || 200;
  const today = ()=> new Date().toISOString().slice(0, 10);
  const dayLoad = ()=>{ try{ const d = JSON.parse(localStorage.getItem(AU_DAY) || '{}'); return d.d === today() ? d : {d: today(), n: 0}; }catch(e){ return {d: today(), n: 0}; } };
  const useAI = ()=>{ try{ return !!geminiKey(); }catch(e){ return false; } };
  window.auditOn = ()=> localStorage.getItem(AU_ON) !== 'off';
  window.auditSetOn = on=>{ try{ localStorage.setItem(AU_ON, on ? 'on' : 'off'); }catch(e){} if(on) auSchedule(3000); };
  window.auditStats = function(){
    const a = auLoad(), ids = GAMES.map(g=> g.id), done = ids.filter(id=> a[id]).length;
    const props = ids.filter(id=> a[id] && a[id].ch && a[id].ch.length).length;
    return {done, total: ids.length, props, today: dayLoad().n, cap: auCap()};
  };
  let auDelay = 40000, auTimer = 0, auBusy = false, auPause = '';
  function auNext(){
    const a = auLoad(), now = Date.now(), lim = AU_DAYS * 864e5, ai = useAI();
    let best = null, bt = Infinity;
    GAMES.forEach(g=>{ const r = a[g.id]; const t = r ? new Date(r.t).getTime() : 0;
      if(r && (r.deep || !ai)) return;          // controllato: non lo ricontrollo mai più (solo «Ricomincia» o «Aggiorna info» nella scheda)          // già controllato a fondo (o senza AI disponibile: non insisto)
      if(t < bt){ bt = t; best = g; } });
    return best;
  }
  function auSchedule(ms){ clearTimeout(auTimer); auTimer = setTimeout(auStep, ms == null ? auDelay : ms); }
  async function auStep(){
    if(!auditOn() || auBusy) return;
    const calm = document.visibilityState === 'visible' && navigator.onLine !== false && !(navigator.connection && navigator.connection.saveData) && !document.querySelector('.modal-backdrop.show, .dup-backdrop.show, .rt-loader.show');
    if(!calm){ return auSchedule(30000); }
    const ai = useAI(), day = dayLoad();
    if(ai && day.n >= auCap()){ auPause = 'Limite giornaliero raggiunto (' + day.n + ' giochi): riprendo domani.'; return auSchedule(30 * 60e3); }
    auPause = '';
    const g = auNext(); if(!g) return auSchedule(6 * 3600e3);
    auBusy = true;
    try{
      const [wiki, wd, itw] = await Promise.allSettled([wikiPageTree(g.name), wikidataGenreCodes(g.name), itWikiLang(g.name)]);
      const ok = x=> x.status === 'fulfilled' ? x.value : null;
      const src = {wiki: ok(wiki), wd: ok(wd), itw: ok(itw)};
      if(wiki.status === 'rejected' && wd.status === 'rejected') throw new Error('fonti');
      let ch = factChanges(g, src), srcs = [], deep = false;
      if(ai){
        // se l'AI fallisce (limite di richieste, rete) NON segno il gioco come controllato: riproverò più tardi
        const t = await textChanges(g, src, true).catch(e=>{ throw e; });
        const d = await deepChanges(g, true);
        if(d.changes.some(c=> c.id === 'aging')) t.changes = t.changes.filter(c=> c.id !== 'aging');
        ch = ch.concat(t.changes, d.changes); srcs = (d.sources || []).map(x=>({title: x.title, uri: x.uri})); deep = true;
        if(t.note && /leggibile/.test(t.note) && d.note && /leggibile/.test(d.note)) throw new Error('risposta');
        day.n++; try{ localStorage.setItem(AU_DAY, JSON.stringify(day)); }catch(e){}
      }
      auDelay = ai ? 40000 : 20000;
      const sk = skLoad();
      const keep = ch.filter(c=> c.patch && !sk[auKey(g.id, c)]).map(c=>({id: c.id, label: c.label, from: c.from, to: c.to, patch: c.patch, off: !!c.off, warn: !!c.warn}));
      const a = auLoad(); a[g.id] = {t: new Date().toISOString(), ch: keep, deep, src: srcs.slice(0, 5)}; auSave(a);
      if(keep.length){ try{ window.dispatchEvent(new Event('audit-update')); }catch(e){} }
    }catch(e){
      auDelay = Math.min(auDelay * 2, 30 * 60e3);
      auPause = 'Fonti o AI momentaneamente non disponibili: riprovo tra ' + Math.round(auDelay / 60000 * 10) / 10 + ' min.';
    }
    auBusy = false; auSchedule();
  }
  const fmtD = iso=>{ try{ return new Date(iso).toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit'}); }catch(e){ return ''; } };
  window.openAuditPanel = function(tab){
    tab = tab || 'todo';
    const el = panel(), a = auLoad(), st = auditStats();
    const todo = GAMES.filter(g=> a[g.id] && a[g.id].ch && a[g.id].ch.length);
    const clean = GAMES.filter(g=> a[g.id] && !(a[g.id].ch && a[g.id].ch.length)).sort((x, y)=> a[y.id].t.localeCompare(a[x.id].t));
    let undo = {}; try{ undo = JSON.parse(localStorage.getItem(AU_UNDO) || '{}') || {}; }catch(e){}
    const shell = body=> `<div class="lp-card"><div class="lp-head"><b>🔎 Controllo dati</b><button class="btn" data-ui-close>Chiudi</button></div>${body}</div>`;
    const head = `<div class="lp-sub">Controllati <b>${st.done}</b> giochi su ${st.total} · oggi ${st.today}/${st.cap}${useAI() ? '' : ' · <b>senza chiave Gemini controllo solo voto, anno, generi e lingua</b>'}. ${auPause ? '<br>⏸️ ' + escHtml(auPause) : ''}<br><b>Non cambia nulla senza il tuo ok.</b> Le proposte vengono da fonti aperte e da Gemini con ricerca web; controllale prima di applicarle.</div>
      <label class="ask-toggle"><input type="checkbox" id="auOn" ${auditOn() ? 'checked' : ''}> Controlla da solo in background</label>
      <div class="lp-tools"><button class="btn${tab==='todo'?' primary':''}" data-tab="todo">📝 Da approvare (${todo.length})</button><button class="btn${tab==='clean'?' primary':''}" data-tab="clean">✅ Controllati (${clean.length})</button><button class="btn${tab==='done'?' primary':''}" data-tab="done">↩️ Applicate (${Object.keys(undo).length})</button><button class="btn" id="auReset" title="Cancella lo storico dei controlli e ricomincia">↻ Ricomincia</button></div>`;
    let body;
    if(tab === 'todo') body = todo.length ? `<div class="lp-tools"><button class="btn primary" id="auStart">▶ Rivedi una per una</button></div><div class="gc-rows">${todo.map(g=> `<div class="gc-row"><span><b>${escHtml(g.name)}</b> <small>${a[g.id].ch.length} ${a[g.id].ch.length === 1 ? 'modifica' : 'modifiche'}: ${a[g.id].ch.map(c=> escHtml(c.label.replace(/ ⚠️.*$/, ''))).join(', ')}</small> <button class="btn" data-rv="${g.id}">Rivedi</button></span></div>`).join('')}</div>` : '<div class="lp-sub">Niente da approvare per ora ✅</div>';
    else if(tab === 'done') body = Object.keys(undo).length ? `<div class="gc-rows">${Object.keys(undo).map(id=>{ const g = GAMES.find(x=> x.id == id); return g ? `<div class="gc-row"><span><b>${escHtml(g.name)}</b> <small>applicato il ${fmtD(undo[id].t)}</small> <button class="btn" data-un="${id}">↩️ Annulla</button></span></div>` : ''; }).join('')}</div>` : '<div class="lp-sub">Nessuna modifica applicata da qui.</div>';
    else body = clean.length ? `<div class="gc-rows">${clean.slice(0, 150).map(g=> `<div class="gc-row"><span>✅ <b>${escHtml(g.name)}</b> <small>${fmtD(a[g.id].t)}${a[g.id].deep ? ' · fonti + AI' : ' · solo fonti aperte'}</small></span></div>`).join('')}</div>${clean.length > 150 ? '<div class="lp-sub">…e altri ' + (clean.length - 150) + '</div>' : ''}` : '<div class="lp-sub">Nessun gioco controllato senza modifiche, per ora.</div>';
    el.innerHTML = shell(head + body);
    el.classList.add('show');
    el.querySelector('#auOn').addEventListener('change', e=> auditSetOn(e.target.checked));
    el.querySelectorAll('[data-tab]').forEach(b=> b.addEventListener('click', ()=> openAuditPanel(b.dataset.tab)));
    el.querySelector('#auReset').addEventListener('click', ()=>{ if(confirm('Cancellare lo storico dei controlli e ricominciare da capo? (le correzioni già applicate restano)')){ auSave({}); openAuditPanel(tab); } });
    const st0 = el.querySelector('#auStart'); if(st0) st0.addEventListener('click', ()=> openAuditReview());
    el.querySelectorAll('[data-rv]').forEach(b=> b.addEventListener('click', ()=> openAuditReview(b.dataset.rv)));
    el.querySelectorAll('[data-un]').forEach(b=> b.addEventListener('click', ()=>{ if(confirm('Annullare la modifica e tornare ai dati di prima?')) auditUndo(b.dataset.un); }));
  };
  // badge fisso «modifiche da approvare» (sempre visibile finché ce ne sono, mai coperto)
  function auBadge(){
    let el = document.getElementById('auBadge');
    if(!el){ el = document.createElement('button'); el.id = 'auBadge'; el.type = 'button'; el.className = 'au-badge'; document.body.appendChild(el); el.addEventListener('click', ()=> openAuditPanel('todo')); }
    const n = auditStats().props;
    el.innerHTML = '<b>' + n + '</b>'; el.title = el.ariaLabel = n + (n === 1 ? ' gioco con modifiche da approvare' : ' giochi con modifiche da approvare');
    el.classList.toggle('show', n > 0);
  }
  window.addEventListener('audit-update', auBadge);
  setTimeout(auBadge, 2500);
  // revisione: UNA scheda per gioco con tutte le modifiche, «PRIMA» e «DOPO» separati e testo intero; un solo gruppo di pulsanti
  window.openAuditReview = function(startId){
    const el = panel(); const later = new Set();
    const pick = ()=>{
      const a = auLoad(); const games = GAMES.filter(g=> a[g.id] && a[g.id].ch && a[g.id].ch.length && !later.has(g.id));
      if(!games.length) return null;
      const g = (startId != null && games.find(x=> x.id == startId)) || games[0];
      return {g, a, left: games.length};
    };
    const show = ()=>{
      const p = pick();
      if(!p){ el.classList.remove('show'); showToast('✅ Revisione finita', 2500); try{ auBadge(); }catch(e){} return; }
      startId = null;
      const {g, a} = p, rec = a[g.id];
      el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>📝 ${escHtml(g.name)}</b><button class="btn" data-ui-close>Chiudi</button></div>
        <div class="lp-sub">${rec.ch.length} ${rec.ch.length === 1 ? 'modifica proposta' : 'modifiche proposte'} · ${p.left} ${p.left === 1 ? 'gioco' : 'giochi'} da rivedere. Scorri per vedere tutto.</div>
        <div class="au-rev">${rec.ch.map((c, i)=>{ const warn = c.off || c.warn || /⚠️/.test(c.label + c.to); return `<div class="au-chg"><label><h4><input type="checkbox" data-i="${i}" ${warn ? '' : 'checked'}> ${escHtml(c.label)}</h4></label>${warn ? '<div class="lp-sub">⚠️ Fai attenzione: fonte datata, dato in contrasto o cambio di genere. Spuntala solo se sei sicuro.</div>' : ''}
          <div class="au-box au-before"><small>PRIMA (quello che c'è ora)</small>${escHtml(c.from || '—')}</div>
          <div class="au-box au-after"><small>DOPO (proposta)</small>${escHtml(c.to)}</div></div>`; }).join('')}
          ${(rec.src || []).length ? '<div class="lp-sub"><small>Fonti: ' + rec.src.map(x=> `<a href="${escHtml(x.uri || '#')}" target="_blank" rel="noopener">${escHtml(x.title)}</a>`).join(' · ') + '</small></div>' : ''}
          <div class="au-actions"><button class="btn primary" id="rvOk">✅ Approva le modifiche spuntate</button><button class="btn" id="rvNo">↩️ Tieni precedente</button><button class="btn" id="rvLater">⏭️ Decido dopo</button></div>
        </div></div>`;
      el.classList.add('show');
      el.querySelector('#rvOk').addEventListener('click', async ()=>{
        const idx = [...el.querySelectorAll('input[data-i]:checked')].map(x=> +x.dataset.i);
        if(!idx.length){ showToast('Spunta almeno una modifica, oppure scegli «Tieni precedente»', 2500); return; }
        const chosen = idx.map(i=> rec.ch[i]);
        try{ const u = JSON.parse(localStorage.getItem(AU_UNDO) || '{}'); if(!g.custom && !u[g.id]){ u[g.id] = {t: new Date().toISOString(), prev: loadOv()[g.id] || null}; localStorage.setItem(AU_UNDO, JSON.stringify(u)); } }catch(e){}
        await applyPatch(g, mergePatch(chosen));
        // le non spuntate restano tra le scartate: la tua scelta vale per tutto il gioco
        const sk = skLoad(); rec.ch.forEach((c, i)=>{ if(!idx.includes(i)) sk[auKey(g.id, c)] = 1; }); try{ localStorage.setItem(AU_SKIP, JSON.stringify(sk)); }catch(e){}
        const r = auLoad(); r[g.id].ch = []; auSave(r); showToast('✅ Approvato', 1200); auBadge(); show();
      });
      el.querySelector('#rvNo').addEventListener('click', ()=>{
        const sk = skLoad(); rec.ch.forEach(c=>{ sk[auKey(g.id, c)] = 1; }); try{ localStorage.setItem(AU_SKIP, JSON.stringify(sk)); }catch(e){}
        const r = auLoad(); r[g.id].ch = []; auSave(r); auBadge(); show();
      });
      el.querySelector('#rvLater').addEventListener('click', ()=>{ later.add(g.id); show(); });
    };
    show();
  };
  window.auditUndo = function(id){
    try{ const u = JSON.parse(localStorage.getItem(AU_UNDO) || '{}'); const e = u[id]; if(!e) return false;
      const ov = loadOv(); if(e.prev) ov[id] = e.prev; else delete ov[id]; saveOv(ov); delete u[id]; localStorage.setItem(AU_UNDO, JSON.stringify(u));
      location.reload(); return true; }catch(err){ return false; }
  };
  // parte subito dopo l'avvio (poche secondi, quando l'app è già disegnata)
  setTimeout(()=> auSchedule(4000), 3000);
  try{ applyGameOverrides(); renderListBar(); if(state.view === 'list') render(); }catch(e){}
})();
