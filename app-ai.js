// AI e avvio: anti-doppione, Chiedi, Novità, Novità per genere, avvio dell'app (deve restare ultimo). Caricato dopo gli altri file app*.js nell'ordine: app, app-schede, app-utente, app-ai.
// ---- Anti-doppione: confronto nomi ignorando maiuscole, accenti, punteggiatura e parentesi ----
function normGameName(n){
  return String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\([^)]*\)/g,' ').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\bthe\b/g,' ').replace(/\s+/g,' ').trim();
}
// Stesso gioco con la parola dell'edizione in più ("Disco Elysium" = "Disco Elysium - The Final Cut"): solo per edizioni, così "Fire Emblem: Engage" e "Fire Emblem: Three Houses" restano diversi
const EDITION_TAIL = /^(final cut|definitive edition|director s cut|directors cut|remastered|remaster|complete edition|complete|goty|game of the year edition|game of the year|deluxe edition|deluxe|enhanced edition|hd|hd remaster|special edition|ultimate edition|legendary edition|royal|intergrade|reloaded|anniversary edition|gold edition|standard edition)$/;
function sameGameName(a, b){
  if(!a || !b) return false;
  if(a === b) return true;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  return s.length >= 6 && l.startsWith(s + ' ') && EDITION_TAIL.test(l.slice(s.length + 1).replace(/^the /, '').replace(/^the /, ''));
}
function findDuplicateGame(name){
  const n = normGameName(name);
  if(!n) return null;
  return GAMES.find(g=> sameGameName(normGameName(g.name), n)) || null;
}
function showDuplicateBanner(g){
  let el = document.getElementById('dupBackdrop');
  if(!el){
    el = document.createElement('div'); el.id = 'dupBackdrop'; el.className = 'dup-backdrop';
    el.addEventListener('click', (e)=>{ if(e.target===el || e.target.closest('[data-dup-close]')) el.classList.remove('show'); });
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="dup-card" role="alertdialog" aria-live="assertive">
    <div class="dup-icon">⚠️</div>
    <div class="dup-title">Il gioco è già nel tuo database!</div>
    <div class="dup-name">${escHtml(g.name)}</div>
    <div class="dup-sub">Non è stato aggiunto di nuovo, così non hai doppioni.</div>
    <div class="dup-actions"><button class="dup-open" data-dup-open>Apri la scheda</button><button class="dup-ok" data-dup-close>OK</button></div>
  </div>`;
  el.querySelector('[data-dup-open]').addEventListener('click', ()=>{ el.classList.remove('show'); try{ closeAsk(); }catch(e){} openModal(g); });
  el.classList.add('show');
}
function askToolAddCustomGame(input, sourceLabel){
  input = input || {};
  sourceLabel = sourceLabel || 'Chiedi a Claude';
  const name = String(input.name || '').trim();
  if(!name) throw new Error('serve il nome del gioco da aggiungere');
  const existing = findDuplicateGame(name);
  if(existing){
    showDuplicateBanner(existing);
    throw new Error(`DOPPIONE: "${existing.name}" è già nel database (id ${existing.id}) e NON è stato aggiunto. Dillo a Mario chiaramente e usa get_game_details su quell'id invece di riprovare ad aggiungerlo.`);
  }
  if(!COVER_DB) throw new Error('Il database non è raggiungibile in questa pagina in questo momento: riprova più tardi o da un altro dispositivo/browser di Mario.');
  const id = nextCustomGameId();
  const tier = TIERS_LIST.includes(input.tier) ? input.tier : 'B';
  const score = clampIntOrNull(input.score, 0, 100);
  const tags = Array.isArray(input.tags) ? input.tags.filter(t=> TAG_INFO[t]) : [];
  const label = {
    d: clampIntOrNull(input.difficulty, 1, 5),
    g: clampIntOrNull(input.grind, 1, 5),
    s: clampIntOrNull(input.storyWeight, 1, 5),
    p: ['L','M','V'].includes(input.pace) ? input.pace : null,
    h: input.hours != null ? Number(input.hours) : null,
    it: ['D','S','F','N'].includes(input.italian) ? input.italian : null,
    ok: input.fitIf ? String(input.fitIf) : null,
    ko: input.avoidIf ? String(input.avoidIf) : null,
    cost: ['S','M','H'].includes(input.cost) ? input.cost : null
  };
  const doc = {
    name,
    plat: input.plat ? String(input.plat) : null,
    year: input.year ? String(input.year) : null,
    tier,
    score: score != null ? score : 70,
    tags,
    story: input.story ? String(input.story) : '',
    note: `Aggiunto da Mario tramite "${sourceLabel}" il ` + new Date().toLocaleDateString('it-IT') + ' — voto e dettagli sono una stima di Claude, non della classifica ufficiale curata a mano.',
    label,
    pros: (cleanProsCons(input.pros, input.cons) || {pros:[]}).pros,
    cons: (cleanProsCons(input.pros, input.cons) || {cons:[]}).cons,
    enrich: cleanCustomEnrich(input.enrich) || undefined,
    addedAt: new Date().toISOString()
  };
  try{ COVER_DB.doc('customGames/' + String(id)).set(doc).catch(()=>{}); }catch(e){}
  try{ queueEnrich(id); }catch(e){}
  const newLists = ensureGenreLists(tags);
  try{ if(typeof verifyNewGameGenres === 'function') verifyNewGameGenres(id, doc); }catch(e){}
  showAddedBanner(name, tags, newLists);
  return {id, name, added: true, resultNote: 'Salvato nel database di Mario: comparirà nella classifica su ogni suo dispositivo.'};
}

// ---- Completamento automatico dei giochi aggiunti (simboli 💕🤝✨💉 e dettagli come nei giochi di base) ----
const ENRICH_TRIED = 'jrpg_enrich_tried';
let enrichQueueIds = new Set(), enrichTimer = 0, enrichRunning = false;
function customDocFromGame(g, enrich){
  return {name: g.name, plat: g.plat === '—' ? null : g.plat, year: g.year || null, tier: g.tier, score: g.score, tags: g.tags || [], story: g.story || '', note: g.note || '', label: g.label || null,
    pros: (g.proscons && g.proscons.pros) || [], cons: (g.proscons && g.proscons.cons) || [], enrich: enrich || undefined};
}
function buildEnrichPrompt(games){
  const list = games.map(g=> `- id ${g.id}: "${g.name}" (${g.year || 'anno n.d.'}, ${g.plat}), tier ${g.tier}, voto ${g.score}, generi: ${(g.tags || []).map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(', ') || 'n.d.'}${g.story ? '. Trama: ' + g.story : ''}`).join('\n');
  return todayLine() + `Per ciascuno di questi videogiochi cerca informazioni ATTENDIBILI (Metacritic, HowLongToBeat, Wikipedia, recensioni) e compila la scheda. Se di un gioco non trovi dati sicuri, metti null nei campi incerti: NON inventare.
${list}
Rispondi SOLO con un array JSON valido, un oggetto per gioco (nell'ordine dato), con questi campi: id (numero), storyTag (RARO. Il voto del gioco NON conta: un gioco mediocre può meritarlo e un capolavoro no. Cerca sulle fonti se questo gioco ha qualcosa di unico che quasi nessun altro ha: una storia affascinante o memorabile, oppure una meccanica/idea che travolge. Assegnalo solo in quel caso: "romance" = storia d'amore centrale e memorabile, "affinity" = legame tra personaggi che è il cuore del gioco, "wow" = colpi di scena/momenti sorprendenti entrati nella storia del medium. Per la MAGGIOR PARTE dei giochi la risposta giusta è null: il tag deve andare al massimo a 1 gioco su 4), storyTagNote (una frase che dice COSA lo rende unico, null se storyTag è null), dopamine (RARO, indipendente dal voto: true SOLO se una meccanica o un loop di ricompense è unico e travolgente, tipo "ancora un turno" fino all'alba, anche se il resto del gioco è modesto; per la maggior parte dei giochi è false, al massimo 1 su 5), dopaLoop (se dopamine: 3-4 passi del ciclo con un'emoji ciascuno, es. ["⚔️ Battaglia","⭐ Ricompensa","🔓 Sblocco","🔁 Sfida più dura"], altrimenti null), dopaHook (una frase: perché non riesci a smettere, null se dopamine è false), dopaWatch (una frase: quando può stancare, null se dopamine è false), eraScore (voto 0-100 all'uscita), todayScore (voto 0-100 oggi), agingNote (1-2 frasi su come regge oggi, citando gli anni, senza "recente"/"da poco"), gameplayScore (0-10), gameplayNote (una frase sul gameplay), whyLikeIt (una frase: a chi piace), hoursMain (ore storia), hoursCompletionist (ore completista), lengthVerdict (una frase sulla durata), remaster (una frase su edizioni/remaster esistenti), language (una frase su testi e doppiaggio in italiano, solo se lo trovi in una fonte).`;
}
function queueEnrich(id){
  enrichQueueIds.add(id); clearTimeout(enrichTimer);
  enrichTimer = setTimeout(()=> runEnrich([...enrichQueueIds]), 2500);
}
async function runEnrich(ids, opts){
  opts = opts || {};
  if(enrichRunning || !ids.length || typeof llmAvailable !== 'function' || !llmAvailable() || !COVER_DB) return 0;
  enrichRunning = true; enrichQueueIds = new Set(); let done = 0;
  const todo = ids.map(id=> GAMES.find(g=> g.id === id)).filter(g=> g && g.custom);
  const useProgress = opts.progress && window.Progress;
  try{
    if(useProgress) Progress.begin('Completo le schede dei giochi…');
    for(let i = 0; i < todo.length; i += 6){
      const part = todo.slice(i, i + 6);
      let arr = null;
      try{
        const r = await askLLM(buildEnrichPrompt(part), {}, {search:true, fast:true, label:'Completo le schede: simboli e dettagli…', silent:true});
        arr = parseNovitaJson(r && r.text);
      }catch(e){}
      const tried = (()=>{ try{ return JSON.parse(localStorage.getItem(ENRICH_TRIED) || '{}') || {}; }catch(e){ return {}; } })();
      for(const g of part){
        tried[g.id] = new Date().toISOString().slice(0, 10);
        const row = (arr || []).find(x=> x && Number(x.id) === g.id) || (arr && arr[part.indexOf(g)]);
        if(!row) continue;
        const raw = Object.assign({}, row, {dopa: row.dopamine === true && Array.isArray(row.dopaLoop) ? {loop: row.dopaLoop, hook: row.dopaHook, watch: row.dopaWatch} : null, checked: tried[g.id]});
        const ce = cleanCustomEnrich(raw); if(!ce) continue;
        try{ await COVER_DB.doc('customGames/' + String(g.id)).set(customDocFromGame(g, ce)); done++; }catch(e){}
      }
      try{ localStorage.setItem(ENRICH_TRIED, JSON.stringify(tried)); }catch(e){}
      if(useProgress) Progress.set(Math.min(100, (i + part.length) / todo.length * 100), `Schede completate: ${Math.min(i + part.length, todo.length)}/${todo.length}`);
    }
  }finally{ enrichRunning = false; if(useProgress) Progress.end(); }
  if(done && opts.progress) showToast(`✨ ${done} ${done === 1 ? 'scheda completata' : 'schede completate'} con simboli e dettagli`, 3500);
  return done;
}
// giochi aggiunti senza simboli/dettagli (o con un tentativo vecchio di oltre 7 giorni)
function customNeedingEnrich(){
  const tried = (()=>{ try{ return JSON.parse(localStorage.getItem(ENRICH_TRIED) || '{}') || {}; }catch(e){ return {}; } })();
  return GAMES.filter(g=> g.custom && !(g.enrich && (g.enrich.eraScore != null || g.enrich.checked)) && !(tried[g.id] && (Date.now() - new Date(tried[g.id]).getTime()) < 2 * 864e5));
}
window.completeCustomGames = ()=>{ const n = customNeedingEnrich(); if(!n.length){ showToast('Tutti i giochi aggiunti hanno già simboli e dettagli'); return; } return runEnrich(n.map(g=> g.id), {progress:true}); };
// lavoro "una tantum", in silenzio: completa tutti i giochi aggiunti che ne sono privi (fino a 40 per volta); una volta completati non si rifà più
setTimeout(()=>{ try{ const n = customNeedingEnrich(); if(n.length && llmAvailable()) runEnrich(n.slice(0, 40).map(g=> g.id)); }catch(e){} }, 12000);
const ASK_TOOLS = [
  {
    name: 'search_games',
    description: 'Cerca nel database personale di Mario (765 RPG/JRPG) per nome, tag/genere, tier, voto minimo, stato o preferiti. Ordina i risultati per compatibilità con i gusti di Mario quando può calcolarla. Restituisce fino a 20 giochi con id, nome, piattaforma, anno, tier, voto, tag, stato, preferito, un riassunto "fa per te se...", ore di gioco e percentuale di compatibilità DNA.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {type:'string', description:'testo da cercare nel nome del gioco'},
        tags: {type:'array', items:{type:'string'}, description:'generi/tag da filtrare in italiano (es. "Tattico", "Souls-like", "Mondo aperto"); un gioco basta che ne abbia UNO'},
        tier: {type:'string', description:'tier esatto: S+, S, A, B, C, D, E, F'},
        minScore: {type:'number', description:'voto minimo da 0 a 100'},
        status: {type:'string', description:'played, playing, backlog o dropped'},
        favoritesOnly: {type:'boolean', description:'true per restituire solo i preferiti di Mario'},
        limit: {type:'number', description:'numero massimo di risultati, default 10, max 20'}
      }
    },
    execute: (input)=> askToolSearchGames(input)
  },
  {
    name: 'get_game_details',
    description: 'Dati completi di un gioco del database dato il suo id: etichetta (difficoltà, grinding, ore, lingua italiana, quando giocarlo oggi), compatibilità DNA con i gusti di Mario, dove trovarlo in abbonamento oggi, pro e contro, storia senza spoiler.',
    inputSchema: {type:'object', properties:{ id:{type:'number', description:'id del gioco, ottenuto da search_games'} }, required:['id']},
    execute: (input)=> askToolGetGameDetails(input)
  },
  {
    name: 'get_taste_profile',
    description: 'Riassume i gusti di Mario finora: giochi preferiti/giocati/droppati e i generi/tag che preferisce. Utile PRIMA di consigliare un gioco nuovo per capire cosa gli piace davvero.',
    inputSchema: {type:'object', properties:{}},
    execute: ()=> askToolGetTasteProfile()
  },
  {
    name: 'set_favorite',
    description: 'Aggiunge o rimuove un gioco dai preferiti di Mario, salvandolo davvero nel database (non solo a parole). Usalo SOLO quando Mario chiede esplicitamente di aggiungere/togliere un gioco dai preferiti.',
    inputSchema: {type:'object', properties:{ id:{type:'number'}, value:{type:'boolean', description:'true = aggiungi ai preferiti, false = rimuovi; se omesso inverte lo stato attuale'} }, required:['id']},
    execute: (input)=> askToolSetFavorite(input)
  },
  {
    name: 'set_status',
    description: 'Imposta lo stato di un gioco nel database di Mario: played (giocato), playing (in corso), backlog (da giocare), dropped (droppato), oppure stringa vuota per rimuovere lo stato. Usalo SOLO quando Mario chiede esplicitamente di aggiornare lo stato di un gioco.',
    inputSchema: {type:'object', properties:{ id:{type:'number'}, status:{type:'string', description:'played, playing, backlog, dropped, oppure "" per rimuovere lo stato'} }, required:['id']},
    execute: (input)=> askToolSetStatus(input)
  },
  {
    name: 'log_missing_game',
    description: 'Annota che hai parlato di un gioco assente dal database, SENZA aggiungerlo ancora: usalo quando lo nomini solo di sfuggita o Mario non ha ancora deciso se vuole tenerlo. Se invece Mario dice esplicitamente "aggiungilo"/"mettilo nel database", usa add_custom_game al suo posto, non questo.',
    inputSchema: {type:'object', properties:{ name:{type:'string'}, plat:{type:'string', description:'piattaforma, se nota'}, reason:{type:'string', description:'perché potrebbe interessare a Mario, in una frase'} }, required:['name']},
    execute: (input)=> askToolLogMissingGame(input)
  },
  {
    name: 'add_custom_game',
    description: 'Aggiunge davvero un nuovo gioco alla libreria personale di Mario, con tutte le informazioni di un gioco già catalogato (comparirà nella classifica, nella scheda "Etichetta", nel DNA di compatibilità, ecc. su ogni suo dispositivo). Usalo SOLO quando Mario chiede esplicitamente di aggiungere/salvare un gioco che search_games conferma NON essere già presente. Compila tu i campi con quello che sai davvero del gioco (tier e voto sono una TUA stima onesta, non inventare dettagli inventati di sana pianta se non li conosci — lascia i campi opzionali vuoti piuttosto che inventare).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {type:'string', description:'titolo esatto del gioco'},
        plat: {type:'string', description:'piattaforme, es. "PS5 / PC"'},
        year: {type:'string', description:'anno di uscita'},
        tier: {type:'string', enum:['S+','S','A','B','C','D','E','F'], description:'la tua stima onesta di quanto sia un buon RPG/JRPG'},
        score: {type:'number', description:'voto stimato 0-100, coerente con il tier'},
        tags: {type:'array', items:{type:'string', enum:['TAC','ACT','DUN','TUR','MON','CARD','WAR','CROSS','VN','MECH','METR','SOUL','HOR','REMAKE','LIFE','ROG']}, description:'generi: TAC=tattico a griglia, ACT=action-RPG, DUN=dungeon crawler, TUR=a turni classico, MON=cattura mostri, CARD=carte, WAR=guerra su larga scala, CROSS=crossover, VN=visual novel ibrido, MECH=mecha, METR=metroidvania, SOUL=soulslike, HOR=horror, REMAKE=remake/remaster, LIFE=vita/crafting, ROG=roguelike'},
        story: {type:'string', description:'1-2 frasi di trama senza spoiler pesanti, nello stesso stile narrativo degli altri giochi del database'},
        hours: {type:'number', description:'ore indicative per finire la storia principale'},
        difficulty: {type:'number', description:'difficoltà 1-5'},
        grind: {type:'number', description:'quanto grinding richiede, 1-5'},
        storyWeight: {type:'number', description:'quanto peso ha la storia rispetto al gameplay, 1-5'},
        pace: {type:'string', enum:['L','M','V'], description:'ritmo: L=lento, M=medio, V=veloce'},
        italian: {type:'string', enum:['D','S','F','N'], description:'lingua italiana: D=testi e doppiaggio ufficiali, S=solo testi/sottotitoli ufficiali, F=solo fan-translation, N=solo inglese/altro'},
        cost: {type:'string', enum:['S','M','H'], description:'fascia di prezzo indicativa: S=economico, M=medio, H=costoso'},
        pros: {type:'array', items:{type:'string'}, description:'3-4 punti di forza concreti del gioco, frasi brevi'},
        cons: {type:'array', items:{type:'string'}, description:'2-3 difetti o punti deboli concreti, frasi brevi'},
        fitIf: {type:'string', description:'completa: "fa per te se..." in una frase'},
        avoidIf: {type:'string', description:'completa: "lascia stare se..." in una frase'}
      },
      required: ['name']
    },
    execute: (input)=> askToolAddCustomGame(input)
  }
];
function todayLine(){
  return 'Data di oggi: ' + new Date().toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'}) + '. Nei testi che scrivi NON usare espressioni legate al tempo che invecchiano ("uscito da poco", "recentissimo", "troppo presto per giudicare"): indica sempre l\'anno di uscita. Parla SOLO di giochi già usciti e realmente esistenti: se non conosci con certezza un dato (voto, ore, lingua, data di uscita) NON inventarlo, scrivi che non è noto.\n';
}
function askInstructions(){
  return todayLine() + `Sei l'assistente integrato nel database personale di giochi RPG/JRPG di Mario (${GAMES.length} giochi catalogati con voti, tag, "etichetta" stile valori nutrizionali, compatibilità DNA con i suoi gusti, e dove trovarli in abbonamento oggi). Rispondi sempre in italiano, in modo breve e colloquiale, come in una chat — evita elenchi puntati lunghi se non richiesti esplicitamente.
Hai questi strumenti sul SUO database, usali sempre invece di inventare voti, tag o dettagli:
- search_games: cerca giochi per nome, genere/tag, tier, voto minimo, preferiti o stato.
- get_game_details: dettagli completi di un gioco (etichetta, DNA, abbonamenti, pro/contro, storia).
- get_taste_profile: cosa piace a Mario finora — usalo prima di consigliare un gioco nuovo.
- set_favorite / set_status: se Mario ti chiede di segnare un gioco come preferito, giocato, in corso, da giocare o droppato, USA questi strumenti per farlo davvero, non solo a parole.
- log_missing_game: se nomini di sfuggita un gioco che NON trovi con search_games e Mario non ha ancora deciso, annotalo con questo strumento senza aggiungerlo.
- add_custom_game: quando Mario ti chiede consigli su giochi NON nel suo database e ne vuole aggiungere uno alla sua libreria (o te lo chiede esplicitamente, es. "aggiungilo", "mettilo nel database", "salvalo"), verifica prima con search_games che non ci sia già, poi usa add_custom_game per inserirlo DAVVERO con tutte le informazioni che conosci (piattaforma, anno, generi, un tuo voto/tier onesto, trama breve, e se puoi anche difficoltà/ore/lingua italiana) — comparirà nella sua classifica su ogni dispositivo esattamente come un gioco già catalogato. Non aggiungere mai un gioco senza che Mario lo abbia chiaramente chiesto.
Quando ti chiede "consigliami qualcosa di nuovo" o "cosa mi manca", puoi anche attingere alla tua conoscenza generale di RPG/JRPG oltre al suo database (non sei limitato ai 765 titoli già catalogati): proponi titoli che potrebbero piacergli in base a get_taste_profile, verifica con search_games che non li abbia già, e offriti di aggiungerli con add_custom_game se gli interessano.
Quando nomini un gioco che hai trovato nel database con search_games, get_game_details o add_custom_game, scrivi il suo id tra doppie graffe subito dopo il nome, così: Nome del gioco{{123}} — diventerà un link cliccabile nella pagina. Non farlo per giochi che non sono (ancora) nel database.
Se Mario allega una foto (es. copertina vista in un negozio) o ti dà solo un nome, riconosci il titolo e come PRIMA cosa verifica con search_games se è già nel database: se c'è, dillo subito (con il link) e NON aggiungerlo. Poi valuta se può piacergli in base ai suoi gusti reali, non a supposizioni generiche.`;
}
function askFormatText(text){
  let t = escHtml(text);
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/\{\{(\d+)\}\}/g, (m, id)=>{
    const g = GAMES.find(x=>x.id===parseInt(id,10));
    if(!g) return '';
    return ` <span class="ask-gamelink" data-id="${g.id}">${escHtml(g.name)} ↗</span>`;
  });
  t = t.replace(/\n/g, '<br>');
  return t;
}
function askErrorCopy(code){
  switch(code){
    case 'gemini_bad_key': return 'Chiave Gemini non valida: controllala su Google AI Studio.';
    case 'gemini_rate_limited': return 'Gemini ha raggiunto il suo limite gratuito: riprova più tardi.';
    case 'gemini_network': return 'Non riesco a contattare Google da questa pagina. Dentro la pagina Claude le connessioni esterne sono bloccate: apri la versione su GitHub Pages (o il file dal disco) per usare Gemini.';
    case 'gemini_busy': return 'Gemini è molto richiesto in questo momento (ho già riprovato anche con il modello leggero): riprova tra qualche minuto.';
    case 'gemini_error': return 'Gemini ha restituito un errore: riprova tra poco.';
    case 'not_granted': return 'Hai negato il permesso di usare Claude in questa pagina.';
    case 'sampling_disabled': return 'Claude non è disponibile per questo account al momento.';
    case 'not_declared': return 'Questa funzione non è disponibile in questa versione della pagina.';
    case 'rate_limited': return 'Troppe richieste: aspetta un momento e riprova.';
    case 'session_expired': return 'Devi rientrare nel tuo account Claude.';
    case 'image_rejected': return 'Foto non valida: prova con un\'altra immagine.';
    case 'images_unavailable': return 'Le foto non sono supportate in questa visualizzazione.';
    case 'tools_unavailable': return 'Funzione avanzata non disponibile qui.';
    case 'refused': return 'Claude ha preferito non rispondere a questo messaggio.';
    case 'empty_completion': return 'Nessuna risposta: prova a riformulare la domanda.';
    case 'prompt_too_large': return 'La conversazione è troppo lunga: chiudi e riapri la chat.';
    case 'cancelled': return 'Richiesta interrotta.';
    default: return 'Qualcosa è andato storto, riprova tra poco.';
  }
}
function updateAskSendBtn(){
  const btn = document.getElementById('askSendBtn');
  if(!btn) return;
  btn.textContent = askBusy ? '⏹' : '➤';
  btn.title = askBusy ? 'Ferma' : 'Invia';
}
function renderAskThread(){
  const thread = document.getElementById('askThread');
  if(!thread) return;
  let html = askHistory.map(m=>{
    if(m.role==='user') return `<div class="ask-msg user">${escHtml(m.content)}</div>`;
    return `<div class="ask-msg assistant">${askFormatText(m.content)}</div>`;
  }).join('');
  if(askStreamingText !== null){
    html += `<div class="ask-msg assistant">${askFormatText(askStreamingText)}</div>`;
  } else if(askBusy){
    html += `<div class="ask-thinking">Sto pensando…</div>`;
  }
  thread.innerHTML = html || (!llmAvailable() ? `<div class="ask-thinking">👆 Per usare Chiedi: incolla qui sopra la tua chiave Gemini e premi "Salva e verifica". Poi potrai scrivere, scattare una foto 📸 o caricarne una 📷.</div>` : `<div class="ask-thinking">Chiedimi consigli sui giochi (es. "3 JRPG tattici come Final Fantasy Tactics"), oppure allega la foto di una copertina vista in negozio.</div>`);
  thread.scrollTop = thread.scrollHeight;
  thread.querySelectorAll('.ask-gamelink').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const gg = GAMES.find(x=>x.id===parseInt(chip.dataset.id,10));
      if(gg){ closeAsk(); openModal(gg); }
    });
  });
  updateAskSendBtn();
}
function renderAskPhotoPreview(){
  const wrap = document.getElementById('askPhotoPreview');
  if(!wrap) return;
  if(!askPendingImage){ wrap.hidden = true; wrap.innerHTML = ''; return; }
  const url = URL.createObjectURL(askPendingImage);
  wrap.hidden = false;
  wrap.innerHTML = `<img src="${url}" alt=""><span>Foto allegata</span><button type="button" id="askPhotoRemoveBtn">✕ rimuovi</button>`;
  document.getElementById('askPhotoRemoveBtn').addEventListener('click', ()=>{ askPendingImage = null; renderAskPhotoPreview(); });
}
function autoResizeAskInput(){
  const el = document.getElementById('askInput');
  if(!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(90, el.scrollHeight) + 'px';
}
async function sendAskMessage(){
  if(askBusy) return;
  if(!llmAvailable()){ showToast('Chiedi a Claude non è disponibile qui: aggiungi una chiave Gemini in ⚙️ Motore AI'); return; }
  const input = document.getElementById('askInput');
  const text = input.value.trim();
  const img = askPendingImage;
  if(!text && !img) return;
  askHistory.push({role:'user', content: text || 'Ho allegato una foto di una copertina, dimmi cosa ne pensi.'});
  askPendingImage = null;
  renderAskPhotoPreview();
  input.value = '';
  autoResizeAskInput();
  askBusy = true;
  askStreamingText = null;
  renderAskThread();
  askController = new AbortController();
  try{
    const opts = {
      signal: askController.signal,
      tools: ASK_TOOLS,
      onText: (u)=>{ askStreamingText = u.text; renderAskThread(); }
    };
    if(img) opts.images = img;
    const result = await askLLM(askHistory, opts, {system: askInstructions(), label:'Sto pensando alla risposta…'});
    askHistory.push({role:'assistant', content: (result.engine === 'gemini' ? '✨ Risposta di Gemini\n\n' : '') + result.text});
    askStreamingText = null; askBusy = false;
    renderAskThread();
    if(result.truncated) showToast('Risposta interrotta per lunghezza: prova a chiedere qualcosa di più specifico.');
  }catch(e){
    askStreamingText = null; askBusy = false;
    if(e && e.code === 'cancelled'){
      if(e.text) askHistory.push({role:'assistant', content: e.text});
    } else {
      showToast(llmErrorText(e) + (img ? ' Scrivi il nome del gioco al posto della foto.' : ''), img ? 6000 : 0);
    }
    renderAskThread();
  } finally {
    askController = null;
  }
}
(function initAsk(){
  if(!(window.claude && typeof window.claude.use === 'function')) return;
  window.claude.use('sample').then(s=>{
    if(!s) return;
    askSample = s;
    const fab = document.getElementById('askFab');
    if(fab) fab.hidden = false;
    if(typeof askSample.limits === 'function'){
      askSample.limits().then(lim=>{
        askImagesSupported = !!(lim && lim.images);
        const hint = document.querySelector('.ask-hint');
        if(hint && !askImagesSupported) hint.textContent = 'Chiedi consigli, confronta giochi o aggiungine di nuovi. I tasti 📷/📸 provano a inviare la foto, ma in alcune viste (es. browser del telefono) la piattaforma potrebbe rifiutarla: in tal caso scrivi il nome del gioco.';
      }).catch(()=>{});
    }
  }).catch(()=>{});
})();
const askBackdropEl = document.getElementById('askBackdrop');
function openAsk(){
  askBackdropEl.classList.add('show');
  const gs = document.getElementById('geminiSettings');
  if(gs && !llmAvailable()) gs.open = true;
  renderAskThread();
  const inp = document.getElementById('askInput');
  if(inp) inp.focus();
}
function closeAsk(){ askBackdropEl.classList.remove('show'); }
document.getElementById('askFab').addEventListener('click', openAsk);
document.getElementById('askCloseBtn').addEventListener('click', closeAsk);
askBackdropEl.addEventListener('click', (e)=>{ if(e.target===askBackdropEl) closeAsk(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && askBackdropEl.classList.contains('show')) closeAsk(); });
document.getElementById('askSendBtn').addEventListener('click', ()=>{
  if(askBusy){ if(askController) askController.abort(); return; }
  sendAskMessage();
});
document.getElementById('askInput').addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); if(!askBusy) sendAskMessage(); }
});
document.getElementById('askInput').addEventListener('input', autoResizeAskInput);
document.getElementById('askPhotoInput').addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  askPendingImage = file;
  renderAskPhotoPreview();
  e.target.value = '';
});
document.getElementById('askCameraInput').addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  askPendingImage = file;
  renderAskPhotoPreview();
  e.target.value = '';
});

// ---- Vista "Novità": proposte di giochi NON ancora nel database, generate da Claude ----
let NOVITA_SKIPPED = new Set();
function loadNovitaSkipped(){
  NOVITA_SKIPPED = new Set();
  try{ const ns = localStorage.getItem(profileKey('jrpg_novita_skipped')); if(ns) NOVITA_SKIPPED = new Set(JSON.parse(ns)); }catch(e){ NOVITA_SKIPPED = new Set(); }
}
loadNovitaSkipped();
function saveNovitaSkipped(){ try{ localStorage.setItem(profileKey('jrpg_novita_skipped'), JSON.stringify(Array.from(NOVITA_SKIPPED))); }catch(e){} }
let NOVITA_SKIPPED_DETAILS = {};
function loadNovitaSkippedDetails(){
  NOVITA_SKIPPED_DETAILS = {};
  try{ const nsd = localStorage.getItem(profileKey('jrpg_novita_skipped_details')); if(nsd) NOVITA_SKIPPED_DETAILS = JSON.parse(nsd) || {}; }catch(e){ NOVITA_SKIPPED_DETAILS = {}; }
}
loadNovitaSkippedDetails();
function saveNovitaSkippedDetails(){ try{ localStorage.setItem(profileKey('jrpg_novita_skipped_details'), JSON.stringify(NOVITA_SKIPPED_DETAILS)); }catch(e){} }
function novitaSkipCandidate(c){
  const key = c.name.toLowerCase().trim();
  NOVITA_SKIPPED.add(key);
  NOVITA_SKIPPED_DETAILS[key] = c;
  saveNovitaSkipped();
  saveNovitaSkippedDetails();
}
const NOVITA_BATCH_COUNT = 16;   // più giochi per ricerca
let novitaQueue = [];
let novitaIdx = 0;
let novitaLoading = false;
let novitaErrorMsg = null;
let novitaEverFetched = false;
let novitaSkippedListOpen = false;
// Novità per genere: stessa idea, ma con scelta esplicita di uno o più generi invece dei gusti di Mario
// Di default sono TUTTI i generi selezionati (così la ricerca non ne salta nemmeno uno): Mario può
// togliere la spunta ai generi che non gli interessano (es. Sportivi) invece di doverli scegliere uno a uno.
let NOVITA_GENRE_SELECTED = new Set(NOVITA_GENRE_ALL_CODES);
function loadNovitaGenreSelected(){
  NOVITA_GENRE_SELECTED = new Set(NOVITA_GENRE_ALL_CODES);
  try{
    const gs = localStorage.getItem(profileKey('jrpg_novita_genre_selected'));
    if(gs){
      const saved = JSON.parse(gs);
      if(Array.isArray(saved) && saved.length) NOVITA_GENRE_SELECTED = new Set(saved);
    }
  }catch(e){}
}
loadNovitaGenreSelected();
function saveNovitaGenreSelected(){ try{ localStorage.setItem(profileKey('jrpg_novita_genre_selected'), JSON.stringify(Array.from(NOVITA_GENRE_SELECTED))); }catch(e){} }
// Console per "Novità per genere", in ordine di uscita. Nessuna selezionata = qualsiasi piattaforma.
const NOVITA_CONSOLES = [
  ['Atari 2600',1977],['NES / Famicom',1983],['Master System',1985],['PC Engine',1987],['Mega Drive',1988],['Game Boy',1989],['SNES',1990],['Neo Geo',1990],['Game Gear',1990],
  ['Sega Saturn',1994],['PlayStation',1994],['Nintendo 64',1996],['Dreamcast',1998],['Game Boy Color',1998],['PlayStation 2',2000],['Game Boy Advance',2001],['GameCube',2001],['Xbox',2001],
  ['Nintendo DS',2004],['PSP',2004],['Xbox 360',2005],['PlayStation 3',2006],['Wii',2006],['Nintendo 3DS',2011],['PS Vita',2011],['Wii U',2012],['PlayStation 4',2013],['Xbox One',2013],
  ['Nintendo Switch',2017],['PlayStation 5',2020],['Xbox Series X|S',2020],['Nintendo Switch 2',2025],['PC (Steam/GOG)',null],['Mobile (iOS/Android)',null]
].sort((a,b)=> (a[1]==null) - (b[1]==null) || (a[1]||0) - (b[1]||0));
let NOVITA_CONSOLE_SELECTED = new Set();
function loadNovitaConsoles(){ NOVITA_CONSOLE_SELECTED = new Set(); try{ const v = localStorage.getItem(profileKey('jrpg_novita_consoles')); if(v) NOVITA_CONSOLE_SELECTED = new Set(JSON.parse(v)); }catch(e){} }
function saveNovitaConsoles(){ try{ localStorage.setItem(profileKey('jrpg_novita_consoles'), JSON.stringify(Array.from(NOVITA_CONSOLE_SELECTED))); }catch(e){} }
loadNovitaConsoles();
let novitaGenreIncludeOther = true;
function loadNovitaGenreOther(){
  novitaGenreIncludeOther = true; loadNovitaConsoles();
  try{ const go = localStorage.getItem(profileKey('jrpg_novita_genre_other')); if(go!=null) novitaGenreIncludeOther = JSON.parse(go); }catch(e){}
}
loadNovitaGenreOther();
function saveNovitaGenreOther(){ try{ localStorage.setItem(profileKey('jrpg_novita_genre_other'), JSON.stringify(novitaGenreIncludeOther)); }catch(e){} }
let novitaGenreQueue = [];
let novitaGenreIdx = 0;
let novitaGenreLoading = false;
let novitaGenreErrorMsg = null;
let novitaGenreEverFetched = false;
let novitaGenreSkippedListOpen = false;
const NOVITA_TAG_ENUM = ['TAC','ACT','DUN','TUR','MON','CARD','WAR','CROSS','VN','MECH','METR','SOUL','HOR','REMAKE','LIFE','ROG'];
function novitaKnownNames(){
  const s = new Set();
  GAMES.forEach(g=> s.add(g.name.toLowerCase().trim()));
  NOVITA_SKIPPED.forEach(n=> s.add(n));
  novitaQueue.forEach(c=> s.add(String(c.name||'').toLowerCase().trim()));
  novitaGenreQueue.forEach(c=> s.add(String(c.name||'').toLowerCase().trim()));
  return s;
}
function novitaGameplaySearchUrl(name){ return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(name + ' gameplay screenshot'); }
function novitaYoutubeUrl(name){ return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' gameplay ita'); }
// Recensioni in italiano: ricerca ristretta ai principali siti italiani di videogiochi
function itReviewsUrl(name){
  const sites = ['multiplayer.it','everyeye.it','spaziogames.it','gamesvillage.it','techgaming.it','gamerclick.it','thegamesmachine.it','it.ign.com'];
  return 'https://www.google.com/search?hl=it&lr=lang_it&q=' + encodeURIComponent('"' + name.replace(/\s*\([^)]*\)/g, '') + '" recensione (' + sites.map(s=> 'site:' + s).join(' OR ') + ')');
}
function novitaReviewSearchUrl(name){ return itReviewsUrl(name); }
function novitaTasteSummaryText(){
  const t = askToolGetTasteProfile();
  if(t.note) return 'Mario non ha ancora segnato abbastanza preferiti/giocati per un profilo affidabile: proponi un mix vario di RPG/JRPG ben considerati, di epoche e piattaforme diverse.';
  const parts = [];
  if(t.topTags.length) parts.push('generi preferiti: ' + t.topTags.join(', '));
  if(t.avgLikedScore != null) parts.push('voto medio dei giochi che ama: ' + t.avgLikedScore + '/100');
  if(t.likedGames.length) parts.push('esempi di giochi che ama: ' + t.likedGames.slice(0,8).map(g=>g.name).join(', '));
  if(t.droppedGames.length) parts.push('giochi droppati (evita cose simili): ' + t.droppedGames.map(g=>g.name).join(', '));
  return parts.join('. ');
}
function novitaExcludeListText(excludeNames){
  let namesList = Array.from(excludeNames).join('; ');
  const MAX_NAMES_CHARS = 24000;
  if(namesList.length > MAX_NAMES_CHARS){ namesList = namesList.slice(0, MAX_NAMES_CHARS) + '…'; }
  return namesList || '(nessuno)';
}
function buildNovitaPrompt(count, excludeNames){
  return todayLine() + `Suggerisci ${count} RPG/JRPG (di qualunque epoca e piattaforma, anche poco conosciuti) che NON sono in questo elenco di giochi che Mario ha già nel suo database o ha già rifiutato (non riproporli, nemmeno con nome leggermente diverso): ${novitaExcludeListText(excludeNames)}.
Gusti di Mario: ${novitaTasteSummaryText()}
Rispondi SOLO con un array JSON valido (nessun testo prima o dopo, nessun blocco di codice), con esattamente ${count} oggetti, ognuno con questi campi:
name (titolo esatto e corretto), plat (piattaforme, es "PS5 / PC"), year (anno di uscita), tier (una tua stima onesta tra S+, S, A, B, C, D, E, F), score (voto 0-100 coerente col tier), tags (1-3 valori tra questi codici, con il loro significato: ${genreGlossary(NOVITA_TAG_ENUM)}), story (1-2 frasi di trama senza spoiler pesanti), hours (ore indicative per finire la storia, numero), difficulty (1-5), pace ("L","M" o "V"), italian ("D"=testi e doppiaggio italiani, "S"=solo testi/sottotitoli italiani ufficiali, "F"=solo fan-translation, "N"=nessun italiano ufficiale), cost ("S","M" o "H"), fitIf (perché potrebbe piacere A MARIO IN PARTICOLARE, in una frase, basandoti sui suoi gusti sopra), avoidIf (una frase su chi dovrebbe evitarlo), pros (array di 3-4 punti di forza concreti, frasi brevi), cons (array di 2-3 difetti concreti, frasi brevi).
Scegli titoli realmente esistenti, con dati il più possibile accurati. Varia epoche/piattaforme tra le ${count} proposte.`;
}
function buildNovitaGenrePrompt(count, excludeNames, selectedTags, includeOther){
  const labels = selectedTags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t);
  const scopeLine = labels.length
    ? `Suggerisci SOLO videogiochi che rientrano in almeno uno di questi generi/stili: ${labels.join(', ')}.${includeOther ? ' Includi anche giochi molto simili a questi generi anche se non ci rientrano perfettamente, o stili affini non elencati qui.' : ' Scarta tutto ciò che non rientra chiaramente in questi generi.'} IMPORTANTE: NON limitarti agli RPG — se un genere qui sopra non è un gioco di ruolo (es. sport, corse, sparatutto, strategia, puzzle...), proponi comunque giochi di QUEL genere anche se non hanno alcun elemento da RPG.`
    : `Includi videogiochi di QUALSIASI genere possibile (non solo RPG), di ogni tipo, epoca e piattaforma: varia il più possibile tra i ${count} suggerimenti.`;
  const consoleLine = NOVITA_CONSOLE_SELECTED.size ? `PIATTAFORME: suggerisci SOLO giochi usciti su almeno una di queste piattaforme: ${NOVITA_CONSOLES.map(c=> c[0]).filter(n=> NOVITA_CONSOLE_SELECTED.has(n)).join(', ')} (giochi validi e apprezzati di ogni epoca, anche retro e poco noti; indica in plat le piattaforme reali). ` : 'PIATTAFORME: qualsiasi console o PC, di ogni epoca (anche retro), purché giochi validi e apprezzati. ';
  return todayLine() + consoleLine + `Suggerisci ${count} videogiochi (di qualunque genere, epoca e piattaforma, anche poco conosciuti — NON limitarti a RPG/JRPG) che NON sono in questo elenco di giochi che Mario ha già nel suo database o ha già rifiutato (non riproporli, nemmeno con nome leggermente diverso): ${novitaExcludeListText(excludeNames)}.
${scopeLine}
Non scartare un gioco valido solo perché non rientra esattamente nei codici di genere che uso per le etichette (${genreGlossary(NOVITA_GENRE_ALL_CODES)}): includilo comunque e assegna i tag più vicini possibile, oppure lascia l'elenco tags vuoto se nessuno si adatta bene — la categorizzazione delle etichette non deve mai essere un motivo per escludere un gioco valido.
Contesto sui gusti abituali di Mario, soprattutto orientati a RPG/JRPG (utile SOLO per spiegare perché un titolo potrebbe piacergli comunque, MAI per restringere la ricerca al genere RPG, che qui è solo una delle tante opzioni possibili): ${novitaTasteSummaryText()}
Rispondi SOLO con un array JSON valido (nessun testo prima o dopo, nessun blocco di codice), con esattamente ${count} oggetti, ognuno con questi campi:
name (titolo esatto e corretto), plat (piattaforme, es "PS5 / PC"), year (anno di uscita), tier (una tua stima onesta tra S+, S, A, B, C, D, E, F), score (voto 0-100 coerente col tier), tags (0-3 valori tra questi codici, con il loro significato: ${genreGlossary(NOVITA_GENRE_ALL_CODES)}. Assegna un tag SOLO se quel genere è centrale nel gioco: meglio 1-2 tag precisi che 3 vaghi, e mai ADV per giochi d'azione, RPG, sandbox o open world; oppure elenco vuoto se nessuno si adatta), story (1-2 frasi che descrivono il gioco/la sua premessa, senza spoiler pesanti), hours (ore indicative per finirlo, numero), difficulty (1-5), pace ("L","M" o "V"), italian ("S"=sottotitoli/doppiaggio ufficiale in italiano,"F"=fan-translation,"N"=solo inglese/altro), cost ("S","M" o "H"), fitIf (perché potrebbe piacere a Mario, in una frase), avoidIf (una frase su chi dovrebbe evitarlo), pros (array di 3-4 punti di forza concreti, frasi brevi), cons (array di 2-3 difetti concreti, frasi brevi).
Scegli titoli realmente esistenti, con dati il più possibile accurati.`;
}
function parseNovitaJson(text){
  if(!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if(start===-1 || end===-1 || end<start) return null;
  t = t.slice(start, end+1);
  try{ const arr = JSON.parse(t); return Array.isArray(arr) ? arr : null; }catch(e){ return null; }
}
// rete di sicurezza: "punta e clicca" non convive con generi d'azione/RPG/sandbox (l'AI tendeva a metterlo su qualsiasi avventura)
function fixNovitaTags(tags){
  if(tags.includes('ADV') && tags.some(t=> ['ACT','SOUL','OPENW','SAND','LIFE','SIMLIFE','ROG','METR','TAC','TUR','DUN','MON','ACTADV','FPS','TPS','PLAT','SHMUP'].includes(t))) return tags.filter(t=> t !== 'ADV');
  return tags;
}
function cleanNovitaCandidate(raw, tagEnum){
  const enumList = tagEnum || NOVITA_TAG_ENUM;
  const name = String((raw && raw.name) || '').trim();
  if(!name) return null;
  return {
    name,
    plat: raw.plat ? String(raw.plat) : '',
    year: raw.year ? String(raw.year) : '',
    tier: TIERS_LIST.includes(raw.tier) ? raw.tier : 'B',
    score: clampIntOrNull(raw.score, 0, 100),
    tags: fixNovitaTags(Array.isArray(raw.tags) ? raw.tags.filter(t=> enumList.includes(t)) : []),
    story: raw.story ? String(raw.story) : '',
    hours: raw.hours!=null ? Number(raw.hours) : null,
    difficulty: clampIntOrNull(raw.difficulty, 1, 5),
    pace: ['L','M','V'].includes(raw.pace) ? raw.pace : null,
    italian: ['D','S','F','N'].includes(raw.italian) ? raw.italian : null,
    cost: ['S','M','H'].includes(raw.cost) ? raw.cost : null,
    fitIf: raw.fitIf ? String(raw.fitIf) : '',
    avoidIf: raw.avoidIf ? String(raw.avoidIf) : '',
    pros: Array.isArray(raw.pros) ? raw.pros.map(String).slice(0,5) : [],
    cons: Array.isArray(raw.cons) ? raw.cons.map(String).slice(0,5) : []
  };
}
function dedupeNovitaCandidates(arr, known, tagEnum){
  const seenBatch = new Set();
  return arr.map(c=> cleanNovitaCandidate(c, tagEnum)).filter(c=>{
    if(!c) return false;
    const k = c.name.toLowerCase().trim();
    if(known.has(k) || seenBatch.has(k) || findDuplicateGame(c.name)) return false;
    seenBatch.add(k);
    return true;
  });
}
// Ricerca in parallelo: la stessa richiesta viene divisa in due metà con orientamenti diversi (classici / moderni) e lanciata insieme:
// tempo d'attesa circa dimezzato, stesse fonti e stessa qualità, più varietà. Se una delle due fallisce si usa l'altra.
async function novitaSearchParallel(makePrompt, total){
  const half = Math.ceil(total / 2);
  const slant = [
    "ORIENTAMENTO DI QUESTA RICERCA: privilegia titoli usciti fino al 2014 (classici, retro, poco noti ma apprezzati).",
    "ORIENTAMENTO DI QUESTA RICERCA: privilegia titoli usciti dal 2015 in poi (moderni, recenti, indie di qualità)."];
  const runs = slant.map(s=> askLLM(makePrompt(half) + '\n' + s, {}, {search:true, fast:true, label:'Cerco nuovi giochi…'}));
  const res = await Promise.allSettled(runs);
  const ok = res.filter(r=> r.status === 'fulfilled');
  if(!ok.length) throw res[0].reason;
  let all = [];
  ok.forEach(r=>{ const arr = parseNovitaJson(r.value && r.value.text); if(arr) all = all.concat(arr); });
  return all;
}
async function fetchNovitaBatch(){
  if(novitaLoading) return;
  if(!llmAvailable()){ novitaErrorMsg = 'Questa funzione non è disponibile in questa visualizzazione.'; renderNovitaCard(); return; }
  novitaLoading = true; novitaErrorMsg = null; renderNovitaCard();
  const excludeNames = novitaKnownNames();
  try{
    // Stessa richiesta di "Novità per genere" (che funziona meglio con Gemini), limitata ai generi RPG/JRPG
    const arr = await novitaSearchParallel(n=> buildNovitaGenrePrompt(n, excludeNames, TAG_ORDER.slice(), false), NOVITA_BATCH_COUNT);
    if(!arr || !arr.length) throw new Error('NOVITA_EMPTY');
    const deduped = dedupeNovitaCandidates(arr, novitaKnownNames(), NOVITA_GENRE_ALL_CODES);
    if(!deduped.length) throw new Error('NOVITA_EMPTY');
    novitaQueue = deduped;
    novitaIdx = 0;
    novitaEverFetched = true;
  }catch(e){
    if(e instanceof Error && e.message === 'NOVITA_EMPTY') novitaErrorMsg = 'Non ho trovato nuovi titoli distinti da proporti adesso: riprova tra poco.';
    else if(e && e.code) novitaErrorMsg = llmErrorText(e);
    else novitaErrorMsg = 'Non sono riuscito a trovare nuovi titoli adesso: riprova tra poco.';
  }finally{
    novitaLoading = false;
    renderNovitaCard();
  }
}
async function fetchNovitaGenreBatch(){
  if(novitaGenreLoading) return;
  if(!llmAvailable()){ novitaGenreErrorMsg = 'Questa funzione non è disponibile in questa visualizzazione.'; renderNovitaGenreCard(); return; }
  if(!NOVITA_GENRE_SELECTED.size){ novitaGenreErrorMsg = 'Seleziona almeno un genere prima di cercare.'; renderNovitaGenreCard(); return; }
  novitaGenreLoading = true; novitaGenreErrorMsg = null; renderNovitaGenreCard();
  const excludeNames = novitaKnownNames();
  const selectedTags = Array.from(NOVITA_GENRE_SELECTED);
  try{
    const arr = await novitaSearchParallel(n=> buildNovitaGenrePrompt(n, excludeNames, selectedTags, novitaGenreIncludeOther), NOVITA_BATCH_COUNT);
    if(!arr || !arr.length) throw new Error('NOVITA_EMPTY');
    const deduped = dedupeNovitaCandidates(arr, novitaKnownNames(), NOVITA_GENRE_ALL_CODES);
    if(!deduped.length) throw new Error('NOVITA_EMPTY');
    novitaGenreQueue = deduped;
    novitaGenreIdx = 0;
    novitaGenreEverFetched = true;
  }catch(e){
    if(e instanceof Error && e.message === 'NOVITA_EMPTY') novitaGenreErrorMsg = 'Non ho trovato nuovi titoli distinti da proporti per questi generi: prova ad allargare la selezione, o spunta "generi simili non elencati".';
    else if(e && e.code) novitaGenreErrorMsg = llmErrorText(e);
    else novitaGenreErrorMsg = 'Non sono riuscito a trovare nuovi titoli adesso: riprova tra poco.';
  }finally{
    novitaGenreLoading = false;
    renderNovitaGenreCard();
  }
}
// salta le proposte che nel frattempo sono già nel database (aggiunte a mano, da un altro dispositivo o da Chiedi)
function currentNovitaGame(){ while(novitaQueue[novitaIdx] && findDuplicateGame(novitaQueue[novitaIdx].name)) novitaIdx++; return novitaQueue[novitaIdx] || null; }
function currentNovitaGenreGame(){ while(novitaGenreQueue[novitaGenreIdx] && findDuplicateGame(novitaGenreQueue[novitaGenreIdx].name)) novitaGenreIdx++; return novitaGenreQueue[novitaGenreIdx] || null; }
function novitaCardHtml(c){
  return `<div class="discover-card" id="novitaCard">
    <div class="discover-cover"><div class="discover-cover-placeholder"><span class="pc-plat">${escHtml((c.plat||'').split('/')[0].trim())}</span><span class="pc-tier ${TIER_LABEL[c.tier]}">${c.tier}</span></div></div>
    <div class="novita-badge-new"><i></i>Non nel tuo database</div>
    <div class="discover-body">
      <div class="discover-title">${escHtml(c.name)}</div>
      <div class="modal-plat">${escHtml(c.plat||'?')}${c.year ? ' · ' + escHtml(c.year) : ''}</div>
      <div class="modal-badges">
        <span class="badge big ${TIER_LABEL[c.tier]}">${c.tier}</span>
        ${c.score!=null ? `<span class="badge big outline">${c.score}/100</span>` : ''}
      </div>
      <div class="modal-tags">${c.tags.map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${TAG_INFO[t].label}</span>` : '').join('')}</div>
      ${c.story ? `<div class="modal-note">${escHtml(c.story)}</div>` : ''}
      ${c.fitIf ? `<div class="novita-why"><b>Potrebbe piacerti perché</b> ${escHtml(c.fitIf)}</div>` : ''}
      <div class="novita-links">
        <a class="novita-link-btn" href="${coverSearchUrl({name:c.name})}" target="_blank" rel="noopener">${ICON_GLOBE} Copertina</a>
        <a class="novita-link-btn" href="${novitaGameplaySearchUrl(c.name)}" target="_blank" rel="noopener">${ICON_PHOTO} Foto gameplay</a>
        <a class="novita-link-btn" href="${novitaYoutubeUrl(c.name)}" target="_blank" rel="noopener">▶️ Gameplay ITA</a>
        <a class="novita-link-btn" href="${novitaReviewSearchUrl(c.name)}" target="_blank" rel="noopener">📰 Recensioni ITA</a>
      </div>
    </div>
  </div>`;
}
function novitaIntroHtml(){
  return `<div class="novita-intro">
    <div class="novita-intro-icon">🆕</div>
    <div><b>Trova nuovi giochi da aggiungere</b><br>Claude ti propone RPG/JRPG che non hai ancora nel database, in base ai tuoi gusti. Per ognuno trovi copertina, foto gameplay, un video gameplay in italiano e le recensioni ITA da controllare prima di decidere: sei sempre tu a scegliere se aggiungerlo.</div>
    <button class="btn primary" id="novitaFindBtn">🔎 Trova nuovi titoli</button>
  </div>`;
}
function novitaLoadingHtml(){
  return `<div class="novita-loading"><div class="novita-spin"></div><div>Sto cercando titoli che potrebbero piacerti…</div></div>`;
}
function novitaErrorHtml(msg){
  return `<div class="novita-error"><div>😕 ${escHtml(msg||'')}</div><button class="btn" id="novitaRetryBtn">Riprova</button></div>`;
}
function novitaDoneHtml(){
  return `<div class="discover-empty">
    <div class="discover-empty-icon">🎉</div>
    <div>Hai deciso su tutte le proposte di questo giro.</div>
    <button class="btn primary" id="novitaFindBtn">🔎 Trova altri titoli</button>
  </div>`;
}
function novitaSkippedTopbarHtml(count, btnId){
  return `<div class="novita-topbar">${llmEngineSelectHtml()}${count ? `<button class="btn" id="${btnId}">📋 Scartati (${count})</button>` : ''}</div>`;
}
function novitaSkippedListHtml(){
  const keys = Object.keys(NOVITA_SKIPPED_DETAILS);
  if(!keys.length) return `<div class="discover-empty"><div class="discover-empty-icon">📋</div><div>Non hai ancora scartato nessuna proposta.</div><button class="btn novita-back-btn">← Torna</button></div>`;
  const rows = keys.map(k=>{
    const c = NOVITA_SKIPPED_DETAILS[k] || {};
    return `<div class="novita-skip-row" data-key="${escHtml(k)}">
      <div class="novita-skip-info">
        <div class="novita-skip-name">${escHtml(c.name||k)}</div>
        <div class="novita-skip-meta">${escHtml(c.plat||'?')}${c.year?' · '+escHtml(c.year):''} <span class="badge ${TIER_LABEL[c.tier]||''}">${escHtml(c.tier||'?')}</span></div>
      </div>
      <div class="novita-skip-actions">
        <button class="btn" type="button" data-novita-skip-restore title="Rimettilo tra le proposte future">♻️</button>
        <button class="btn primary" type="button" data-novita-skip-add title="Aggiungilo comunque alla libreria">➕</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="novita-skip-list"><div class="novita-skip-list-head"><button class="btn novita-back-btn">← Torna</button><span>${keys.length} scartati</span></div>${rows}</div>`;
}
function renderNovitaSkippedListInto(panel, refreshFn){
  if(!panel) return;
  panel.innerHTML = `<div class="novita-wrap">${novitaSkippedListHtml()}</div>`;
  const backBtn = panel.querySelector('.novita-back-btn');
  if(backBtn) backBtn.addEventListener('click', ()=>{ novitaSkippedListOpen = false; novitaGenreSkippedListOpen = false; refreshFn(); });
  panel.querySelectorAll('[data-novita-skip-restore]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const key = e.currentTarget.closest('.novita-skip-row').dataset.key;
      delete NOVITA_SKIPPED_DETAILS[key];
      NOVITA_SKIPPED.delete(key);
      saveNovitaSkipped(); saveNovitaSkippedDetails();
      showToast('Rimesso tra le proposte future');
      refreshFn();
    });
  });
  panel.querySelectorAll('[data-novita-skip-add]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const key = e.currentTarget.closest('.novita-skip-row').dataset.key;
      const c = NOVITA_SKIPPED_DETAILS[key];
      if(!c) return;
      try{ askToolAddCustomGame(c, 'Novità'); }catch(err){ showToast((err && err.message) || 'Non sono riuscito ad aggiungere il gioco.'); }
      delete NOVITA_SKIPPED_DETAILS[key];
      NOVITA_SKIPPED.delete(key);
      saveNovitaSkipped(); saveNovitaSkippedDetails();
      refreshFn();
    });
  });
}
// Messaggio quando nessun motore AI è configurato (es. su un dispositivo nuovo: la chiave Gemini non viaggia con la sincronizzazione)
function needKeyHtml(){
  return 'Per usare questa funzione serve la <b>chiave Gemini</b> su questo dispositivo (per sicurezza la chiave non si sincronizza: va incollata una volta su ogni telefono o computer).<br><br><button class="btn primary" onclick="openAsk()">🔑 Inserisci la chiave</button>';
}
function renderNovitaView(){ renderNovitaCard(); }
function renderNovitaCard(){
  const panel = document.getElementById('novitaPanel');
  if(!panel) return;
  if(!llmAvailable()){
    panel.innerHTML = `<div class="novita-intro"><div class="novita-intro-icon">🆕</div><div>${needKeyHtml()}</div></div>`;
    return;
  }
  if(novitaSkippedListOpen){ renderNovitaSkippedListInto(panel, renderNovitaCard); return; }
  const topBar = novitaSkippedTopbarHtml(Object.keys(NOVITA_SKIPPED_DETAILS).length, 'novitaViewSkippedBtn');
  if(novitaLoading){ panel.innerHTML = `<div class="novita-wrap">${topBar}<div class="discover-stage">${novitaLoadingHtml()}</div></div>`; wireNovitaTopbar(); return; }
  if(novitaErrorMsg){ panel.innerHTML = `<div class="novita-wrap">${topBar}<div class="discover-stage">${novitaErrorHtml(novitaErrorMsg)}</div></div>`; wireNovitaCard(); wireNovitaTopbar(); return; }
  const c = currentNovitaGame();
  if(!c){
    panel.innerHTML = `<div class="novita-wrap">${topBar}<div class="discover-stage">${novitaEverFetched ? novitaDoneHtml() : novitaIntroHtml()}</div></div>`;
    wireNovitaCard(); wireNovitaTopbar();
    return;
  }
  panel.innerHTML = `<div class="novita-wrap">${topBar}
    <div class="discover-stage">${novitaCardHtml(c)}</div>
    <div class="discover-actions">
      <button class="discover-btn nope" id="novitaNopeBtn" title="Non fa per me">✕</button>
      <button class="discover-btn like" id="novitaLikeBtn" title="Aggiungilo alla libreria">♥</button>
    </div>
    <div class="discover-hint">Controlla copertina, foto, video e recensioni prima di decidere · ${novitaQueue.length - novitaIdx} da vedere in questo giro</div>
  </div>`;
  wireNovitaCard(); wireNovitaTopbar();
}
function novitaAdvanceSkip(){
  const c = currentNovitaGame(); if(!c) return;
  novitaSkipCandidate(c);
  novitaIdx++;
  renderNovitaCard();
}
function novitaAdvanceLike(){
  const c = currentNovitaGame(); if(!c) return;
  try{
    askToolAddCustomGame(c, 'Novità');
  }catch(e){
    showToast((e && e.message) || 'Non sono riuscito ad aggiungere il gioco.');
  }
  novitaIdx++;
  renderNovitaCard();
}
function wireNovitaCard(){
  const findBtn = document.getElementById('novitaFindBtn');
  const retryBtn = document.getElementById('novitaRetryBtn');
  const nopeBtn = document.getElementById('novitaNopeBtn');
  const likeBtn = document.getElementById('novitaLikeBtn');
  if(findBtn) findBtn.addEventListener('click', fetchNovitaBatch);
  if(retryBtn) retryBtn.addEventListener('click', fetchNovitaBatch);
  if(nopeBtn) nopeBtn.addEventListener('click', novitaAdvanceSkip);
  if(likeBtn) likeBtn.addEventListener('click', novitaAdvanceLike);
}
function wireNovitaTopbar(){
  const btn = document.getElementById('novitaViewSkippedBtn');
  if(btn) btn.addEventListener('click', ()=>{ novitaSkippedListOpen = true; renderNovitaCard(); });
}
// ---- "Novità per genere": stessa proposta, ma filtrata su generi scelti da Mario invece che sui suoi gusti pregressi ----
function novitaGenrePickerHtml(){
  const sectionsHtml = NOVITA_GENRE_SECTIONS.map(sec=>{
    const chips = sec.codes.map(t=>{
      const info = TAG_INFO[t];
      if(!info) return '';
      const active = NOVITA_GENRE_SELECTED.has(t);
      return `<button class="genre-chip${active?' active':''}" type="button" data-genre-chip="${t}">${info.icon} ${info.label}</button>`;
    }).join('');
    return `<div class="novita-genre-section"><div class="novita-genre-section-title">${escHtml(sec.title)}</div><div class="genre-chip-grid">${chips}</div></div>`;
  }).join('');
  const total = NOVITA_GENRE_ALL_CODES.length;
  const activeCount = NOVITA_GENRE_SELECTED.size;
  const consoleChips = NOVITA_CONSOLES.map(([n,y])=> `<button class="genre-chip${NOVITA_CONSOLE_SELECTED.has(n)?' active':''}" type="button" data-console-chip="${escHtml(n)}">${escHtml(n)}${y ? ` <small>${y}</small>` : ''}</button>`).join('');
  return `<div class="novita-genre-picker">
    <div class="novita-genre-section"><div class="novita-genre-section-title">🎮 Console (in ordine di uscita) · ${NOVITA_CONSOLE_SELECTED.size ? NOVITA_CONSOLE_SELECTED.size + ' scelte' : 'nessuna scelta = tutte'}</div><div class="genre-chip-grid">${consoleChips}</div>
      <div class="novita-genre-picker-actions"><button class="btn small" type="button" id="novitaConsoleClearBtn">Tutte le console</button></div></div>
    <div class="novita-genre-picker-label">Sono selezionati TUTTI i generi videoludici (così la ricerca non ne salta nessuno): togli la spunta a quelli che NON ti interessano, es. "Sportivi", oppure usa i pulsanti qui sotto.</div>
    <div class="novita-genre-picker-actions">
      <button class="btn small" type="button" id="novitaGenreSelectAllBtn">✅ Seleziona tutti</button>
      <button class="btn small" type="button" id="novitaGenreDeselectAllBtn">⬜ Deseleziona tutti</button>
      <span class="novita-genre-count">${activeCount}/${total} generi attivi</span>
    </div>
    ${sectionsHtml}
    <label class="genre-other-toggle"><input type="checkbox" id="novitaGenreOtherToggle" ${novitaGenreIncludeOther?'checked':''}> Includi anche generi/stili simili non elencati qui sopra</label>
    <button class="btn primary" id="novitaGenreFindBtn"${activeCount ? '' : ' disabled title="Seleziona almeno un genere"'}>🔎 Cerca in questi generi</button>
  </div>`;
}
function renderNovitaGenreView(){ renderNovitaGenreCard(); }
function renderNovitaGenreCard(){
  const panel = document.getElementById('novitaGenrePanel');
  if(!panel) return;
  if(!llmAvailable()){
    panel.innerHTML = `<div class="novita-intro"><div class="novita-intro-icon">🎭</div><div>${needKeyHtml()}</div></div>`;
    return;
  }
  if(novitaGenreSkippedListOpen){ renderNovitaSkippedListInto(panel, renderNovitaGenreCard); return; }
  const topBar = novitaSkippedTopbarHtml(Object.keys(NOVITA_SKIPPED_DETAILS).length, 'novitaGenreViewSkippedBtn');
  if(novitaGenreLoading){ panel.innerHTML = `<div class="novita-wrap">${topBar}<div class="discover-stage">${novitaLoadingHtml()}</div></div>`; wireNovitaGenreTopbar(); return; }
  const c = currentNovitaGenreGame();
  if(!c){
    const errorBlock = novitaGenreErrorMsg ? `<div class="novita-error"><div>😕 ${escHtml(novitaGenreErrorMsg)}</div></div>` : '';
    const doneBlock = (!novitaGenreErrorMsg && novitaGenreEverFetched) ? `<div class="discover-empty" style="padding-bottom:0;"><div class="discover-empty-icon">🎉</div><div>Hai deciso su tutte le proposte di questo giro.</div></div>` : '';
    panel.innerHTML = `<div class="novita-wrap">${topBar}<div class="discover-stage">${errorBlock}${doneBlock}${novitaGenrePickerHtml()}</div></div>`;
    wireNovitaGenreCard(); wireNovitaGenreTopbar();
    return;
  }
  panel.innerHTML = `<div class="novita-wrap">${topBar}
    <div class="discover-stage">${novitaCardHtml(c)}</div>
    <div class="discover-actions">
      <button class="discover-btn nope" id="novitaGenreNopeBtn" title="Non fa per me">✕</button>
      <button class="discover-btn like" id="novitaGenreLikeBtn" title="Aggiungilo alla libreria">♥</button>
    </div>
    <div class="discover-hint">Controlla copertina, foto, video e recensioni prima di decidere · ${novitaGenreQueue.length - novitaGenreIdx} da vedere in questo giro</div>
  </div>`;
  wireNovitaGenreCard(); wireNovitaGenreTopbar();
}
function novitaGenreAdvanceSkip(){
  const c = currentNovitaGenreGame(); if(!c) return;
  novitaSkipCandidate(c);
  novitaGenreIdx++;
  renderNovitaGenreCard();
}
function novitaGenreAdvanceLike(){
  const c = currentNovitaGenreGame(); if(!c) return;
  try{
    askToolAddCustomGame(c, 'Novità per genere');
  }catch(e){
    showToast((e && e.message) || 'Non sono riuscito ad aggiungere il gioco.');
  }
  novitaGenreIdx++;
  renderNovitaGenreCard();
}
function wireNovitaGenreCard(){
  document.querySelectorAll('#novitaGenrePanel [data-console-chip]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const n = btn.dataset.consoleChip; if(NOVITA_CONSOLE_SELECTED.has(n)) NOVITA_CONSOLE_SELECTED.delete(n); else NOVITA_CONSOLE_SELECTED.add(n); saveNovitaConsoles(); renderNovitaGenreCard(); });
  });
  const clrC = document.getElementById('novitaConsoleClearBtn');
  if(clrC) clrC.addEventListener('click', ()=>{ NOVITA_CONSOLE_SELECTED = new Set(); saveNovitaConsoles(); renderNovitaGenreCard(); });
  document.querySelectorAll('#novitaGenrePanel [data-genre-chip]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.dataset.genreChip;
      if(NOVITA_GENRE_SELECTED.has(t)) NOVITA_GENRE_SELECTED.delete(t); else NOVITA_GENRE_SELECTED.add(t);
      saveNovitaGenreSelected();
      renderNovitaGenreCard();
    });
  });
  const otherToggle = document.getElementById('novitaGenreOtherToggle');
  if(otherToggle) otherToggle.addEventListener('change', ()=>{ novitaGenreIncludeOther = otherToggle.checked; saveNovitaGenreOther(); });
  const selectAllBtn = document.getElementById('novitaGenreSelectAllBtn');
  const deselectAllBtn = document.getElementById('novitaGenreDeselectAllBtn');
  if(selectAllBtn) selectAllBtn.addEventListener('click', ()=>{ NOVITA_GENRE_SELECTED = new Set(NOVITA_GENRE_ALL_CODES); saveNovitaGenreSelected(); renderNovitaGenreCard(); });
  if(deselectAllBtn) deselectAllBtn.addEventListener('click', ()=>{ NOVITA_GENRE_SELECTED = new Set(); saveNovitaGenreSelected(); renderNovitaGenreCard(); });
  const findBtn = document.getElementById('novitaGenreFindBtn');
  if(findBtn) findBtn.addEventListener('click', fetchNovitaGenreBatch);
  const nopeBtn = document.getElementById('novitaGenreNopeBtn');
  const likeBtn = document.getElementById('novitaGenreLikeBtn');
  if(nopeBtn) nopeBtn.addEventListener('click', novitaGenreAdvanceSkip);
  if(likeBtn) likeBtn.addEventListener('click', novitaGenreAdvanceLike);
}
function wireNovitaGenreTopbar(){
  const btn = document.getElementById('novitaGenreViewSkippedBtn');
  if(btn) btn.addEventListener('click', ()=>{ novitaGenreSkippedListOpen = true; renderNovitaGenreCard(); });
}

const DATA_BUILD_DATE = '2026-09-28';
const DATA_BUILD_VERSION = 'v114';
(function renderBuildLine(){
  const el = document.getElementById('buildLine');
  if(!el) return;
  const d = new Date(DATA_BUILD_DATE + 'T00:00:00Z');
  const dstr = d.toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'});
  el.textContent = `Database aggiornato il ${dstr} (${DATA_BUILD_VERSION})`;
})();
renderMetrics();
renderStats();
renderTagChips();
renderMoodChips();
render();
loadLists(); renderListBar(); if(state.view === 'list') render();

// Dentro Claude (link claude.ai/artifact) Gemini, sincronizzazione e Novità con Gemini non possono funzionare: avviso ben visibile
(function(){
  if(!(window.claude && typeof window.claude.use === 'function')) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:sticky;top:0;z-index:99999;background:#fff3cd;color:#5d3a00;border-bottom:2px solid #f5a300;padding:10px 14px;font:600 14px sans-serif;text-align:center';
  bar.innerHTML = '⚠️ Questa è la versione dentro Claude: qui Gemini, Novità con Gemini e la sincronizzazione NON funzionano.<br><a href="https://kur0chanx.github.io/TierListGame/" target="_blank" rel="noopener" style="color:#0b57d0">👉 Apri la versione completa (GitHub)</a>';
  document.body.insertBefore(bar, document.body.firstChild);
})();
