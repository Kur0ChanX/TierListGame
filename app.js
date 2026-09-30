// Nucleo: dati, profili, liste per genere, classifica, filtri, La mia Tier List, scheda gioco. Seguono app-schede.js, app-utente.js, app-ai.js (stesso ambiente globale).
const TIER_ORDER = {'S+':0,'S':1,'A':2,'B':3,'C':4,'D':5,'E':6,'F':7,'ND':8};
const TIER_LABEL = {'S+':'Splus','S':'S','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','ND':'ND'};
const TIERS_LIST = ['S+','S','A','B','C','D','E','F','ND'];      // ND = voto non verificato (né Metacritic né OpenCritic): sta sotto tutti i rank
// testo del voto: «ND» quando il gioco non ha un voto verificato
function scoreTxt(g){ return g.tier === 'ND' ? 'ND' : g.score; }

const TAG_INFO = {
  TAC:{icon:'♟️', label:'Tattico a griglia'},
  ACT:{icon:'⚔️', label:'Action-RPG'},
  DUN:{icon:'🏛️', label:'Dungeon Crawler'},
  TUR:{icon:'🔁', label:'A turni classico'},
  MON:{icon:'🐾', label:'Cattura mostri'},
  CARD:{icon:'🃏', label:'Carte / Deck'},
  WAR:{icon:'🏰', label:'Guerra su larga scala'},
  CROSS:{icon:'🌀', label:'Crossover'},
  VN:{icon:'💬', label:'Ibrido Visual Novel'},
  MECH:{icon:'🤖', label:'Mecha'},
  METR:{icon:'🧭', label:'Metroidvania'},
  SOUL:{icon:'🗡️', label:'Soulslike'},
  HOR:{icon:'👻', label:'Horror'},
  REMAKE:{icon:'♻️', label:'Remake / Remaster'},
  LIFE:{icon:'🌾', label:'Vita / Crafting'},
  ROG:{icon:'🎲', label:'Roguelike'},
  WRPG:{icon:'🧙', label:'RPG occidentale (WRPG)'},
  JRPG:{icon:'🗾', label:'RPG giapponese (JRPG)'},
  MUD:{icon:'⌨️', label:'MUD / RPG testuale'},
  GACHA:{icon:'🎰', label:'Gacha'}
};
const TAG_ORDER = ['TAC','ACT','DUN','TUR','MON','CARD','WAR','CROSS','VN','MECH','METR','SOUL','HOR','REMAKE','LIFE','ROG','WRPG','JRPG','MUD','GACHA'];

// Generi extra (NON RPG) usati solo dalla scheda "Novità per genere", per poter cercare titoli di
// qualunque genere videoludico e non solo RPG/JRPG. Vengono uniti a TAG_INFO (così icona/etichetta
// si vedono correttamente ovunque nel sito, es. su un gioco aggiunto con uno di questi tag) ma MAI
// aggiunti a TAG_ORDER, che resta l'elenco dei filtri della lista principale (100% RPG/JRPG).
const EXTRA_GENRE_INFO = {
  PLAT:{icon:'🕹️', label:'Platform 2D / Precision Platformer'},
  BEAT:{icon:'👊', label:'Picchiaduro a scorrimento (Beat \'em Up)'},
  FIGHT:{icon:'🥊', label:'Picchiaduro 1v1 (2D/3D)'},
  STEALTH:{icon:'🥷', label:'Stealth'},
  ADV:{icon:'🔍', label:'Avventura punta e clicca'},
  ACTADV:{icon:'🦸', label:'Action-Adventure'},
  OPENW:{icon:'🌍', label:'Open World / Sandbox'},
  MMO:{icon:'🌐', label:'MMO / MMORPG'},
  SIMVEH:{icon:'✈️', label:'Simulatori (volo / spazio / mecha)'},
  TRIVIA:{icon:'❓', label:'Quiz / trivia'},
  WALK:{icon:'🚶', label:'Avventura narrativa / Walking Sim'},
  FPS:{icon:'🔫', label:'FPS Tattico / Militare'},
  TPS:{icon:'🎯', label:'TPS / Looter Shooter'},
  SHMUP:{icon:'🚀', label:'Shoot \'em Up / Bullet Hell / Run & Gun'},
  BR:{icon:'🪂', label:'Battle royale'},
  SPORT:{icon:'⚽', label:'Sport simulazione'},
  RACE:{icon:'🏎️', label:'Corse simracing'},
  RTS:{icon:'🛰️', label:'Strategia in tempo reale'},
  TBS4X:{icon:'🗺️', label:'Strategia a turni / 4X'},
  MOBA:{icon:'🛡️', label:'MOBA'},
  CITY:{icon:'🏙️', label:'Gestionale / City Builder / Colony Sim'},
  TOWERDEF:{icon:'🏹', label:'Tower defense'},
  ECOSIM:{icon:'📈', label:'Tycoon / Simulazione economica'},
  PUZ:{icon:'🧩', label:'Puzzle / Logica'},
  PARTY:{icon:'🎉', label:'Party game'},
  RHY:{icon:'🎵', label:'Musicale / Rhythm Game'},
  BOARDG:{icon:'♠️', label:'Tabletop / Carte digitali (non RPG)'},
  SAND:{icon:'⛏️', label:'Survival Crafting / Sopravvivenza'},
  SIMLIFE:{icon:'🧑‍🌾', label:'Simulazione di vita / Cozy'},
  ARCADE:{icon:'👾', label:'Arcade / Cabinati / Pinball'},
  IDLE:{icon:'⏳', label:'Idle / clicker'},
  RUN:{icon:'🏃', label:'Endless runner'},
  COOP:{icon:'🤝', label:'Cooperativo / Co-op sociale'},
  HNS:{icon:'🪓', label:'Hack & Slash'},
  SURV:{icon:'🧟', label:'Survival Horror classico'},
  STRATTAC:{icon:'🎖️', label:'Strategia a turni tattica (non RPG)'},
  PLAT3D:{icon:'🦘', label:'Platform 3D / Collectathon'},
  PUZPLAT:{icon:'🧱', label:'Puzzle Platformer'},
  IMSIM:{icon:'🕵️', label:'Immersive Sim'},
  FMV:{icon:'🎞️', label:'FMV (film interattivo)'},
  BRAWL:{icon:'🥋', label:'Arena Brawler / Platform Fighter'},
  FPSARENA:{icon:'⚡', label:'FPS Arena'},
  BOOMER:{icon:'💥', label:'Boomer Shooter / Retro FPS'},
  HEROSH:{icon:'🦹', label:'Hero Shooter'},
  EXTRACT:{icon:'🎒', label:'Extraction Shooter'},
  TWINSTICK:{icon:'🕹️', label:'Twin-Stick Shooter'},
  RAILSH:{icon:'🔫', label:'Sparatutto su binari / Light Gun'},
  SPORTARC:{icon:'🏀', label:'Sport arcade'},
  SPORTXT:{icon:'🛹', label:'Sport estremi'},
  SPORTFIGHT:{icon:'🤼', label:'Sport da combattimento (Wrestling/MMA)'},
  SPORTMGR:{icon:'📋', label:'Manageriale sportivo'},
  RACEARC:{icon:'🚗', label:'Corse arcade'},
  KART:{icon:'🏁', label:'Kart racing'},
  RALLY:{icon:'🌄', label:'Off-road / Rally'},
  RACEFUT:{icon:'🛸', label:'Corse futuristiche / anti-gravità'},
  HORACT:{icon:'🔪', label:'Action Horror'},
  HORPSY:{icon:'🧠', label:'Horror psicologico'},
  HORMASC:{icon:'🐻', label:'Mascot Horror'},
  HORASYM:{icon:'🎭', label:'Horror asimmetrico'},
  GRAND:{icon:'🌐', label:'Grand Strategy'},
  RTT:{icon:'🪖', label:'RTT (tattica in tempo reale)'},
  AUTOB:{icon:'♟️', label:'Auto Battler'},
  ARTY:{icon:'💣', label:'Artiglieria (tipo Worms)'},
  GOD:{icon:'☁️', label:'God Game'},
  PHYSPUZ:{icon:'⚙️', label:'Physics Puzzle'},
  MATCH3:{icon:'💎', label:'Match-3 / Falling Block'},
  HIDDEN:{icon:'🔎', label:'Hidden Object'},
  FARM:{icon:'🚜', label:'Farming Sim'},
  DATING:{icon:'💘', label:'Dating Sim'},
  JOBSIM:{icon:'🧰', label:'Job Sim'},
  FITNESS:{icon:'🏋️', label:'Fitness'},
  SOCDED:{icon:'🕵️‍♂️', label:'Social Deduction'}
};
Object.assign(TAG_INFO, EXTRA_GENRE_INFO);
// Sezioni per il selettore generi di "Novità per genere": copre RPG + praticamente ogni genere
// videoludico, raggruppato in modo schematico invece di un listone unico.
const GENRE_GROUPS = [
  {icon:'🎲', title:'RPG e ruolistica', codes:['JRPG','WRPG','ACT','TUR','TAC','DUN','MON','CARD','ROG','MUD','GACHA','CROSS','MECH','LIFE','REMAKE']},
  {icon:'🗡️', title:'Azione, avventura e platform', codes:['ACTADV','HNS','PLAT','PLAT3D','PUZPLAT','METR','SOUL','IMSIM','STEALTH','OPENW','ADV','WALK','VN','FMV']},
  {icon:'🥊', title:'Picchiaduro e combattimento', codes:['FIGHT','BRAWL','BEAT']},
  {icon:'🔫', title:'Sparatutto e battle', codes:['FPS','FPSARENA','BOOMER','HEROSH','TPS','EXTRACT','BR','TWINSTICK','RAILSH','SHMUP']},
  {icon:'⚽', title:'Sport, corse e motori', codes:['SPORT','SPORTARC','SPORTXT','SPORTFIGHT','SPORTMGR','RACE','RACEARC','KART','RALLY','RACEFUT']},
  {icon:'💀', title:'Horror e sopravvivenza', codes:['SURV','HORACT','HOR','HORPSY','HORMASC','HORASYM','SAND']},
  {icon:'🧠', title:'Strategia e gestionale', codes:['RTS','TBS4X','GRAND','RTT','STRATTAC','WAR','MOBA','AUTOB','CITY','TOWERDEF','ARTY','ECOSIM','GOD']},
  {icon:'🧩', title:'Puzzle, simulatori e casual', codes:['PUZ','PHYSPUZ','MATCH3','HIDDEN','RHY','PARTY','SIMLIFE','FARM','DATING','JOBSIM','SIMVEH','BOARDG','TRIVIA','FITNESS']},
  {icon:'🌐', title:'Multiplayer e arcade', codes:['MMO','COOP','SOCDED','ARCADE','IDLE','RUN']}
];
// compatibilità: sezioni piatte per i selettori esistenti (titolo con icona)
const NOVITA_GENRE_SECTIONS = GENRE_GROUPS.map(g=> ({title: g.icon + ' ' + g.title, codes: g.codes.filter(c=> TAG_INFO[c])}));
const NOVITA_GENRE_ALL_CODES = NOVITA_GENRE_SECTIONS.reduce((acc,s)=> acc.concat(s.codes), []);
// Significato di ogni codice, da dare SEMPRE all'AI insieme al codice: senza spiegazione "ADV" veniva letto come "avventura qualsiasi" e finivano lì Elden Ring, Portal, Stardew...
const GENRE_HINT = {
  ADV:'avventura grafica/narrativa basata su enigmi e dialoghi, tipo Monkey Island, Grim Fandango, Life is Strange; NON i giochi con combattimento o esplorazione libera (quelli sono ACTADV, RPG o OPENW)',
  ACTADV:'avventura d\'azione con esplorazione, combattimento e piccoli enigmi: Zelda, Uncharted, Tomb Raider, Metroid Prime; non se è un RPG con statistiche',
  OPENW:'mondo aperto da esplorare liberamente come esperienza centrale (GTA, Red Dead, Breath of the Wild)',
  WALK:'esperienza narrativa in cui si cammina e si osserva, con poca o nessuna sfida (Firewatch, Gone Home)',
  PLAT:'platform: saltare tra piattaforme è il cuore del gioco (Mario, Celeste)',
  SAND:'sandbox / survival con costruzione e raccolta risorse (Minecraft, Subnautica)',
  SIMLIFE:'simulazione di vita o di lavoro (Stardew Valley, The Sims, Euro Truck Simulator)',
  COOP:'gioco pensato soprattutto per giocare in cooperativa o multiplayer sociale (It Takes Two)',
  ARCADE:'gioco arcade/retro a punteggio, partite brevi',
  TBS4X:'strategia a turni o 4X su mappa (Civilization, XCOM)',
  BOARDG:'gioco da tavolo o di carte NON GDR',
  CITY:'costruzione e gestione di città/parchi',
  ECOSIM:'gestionale economico (tycoon)',
  SIMVEH:'simulatori di volo, treni o veicoli',
  MMO:'gioco online persistente con tanti giocatori (WoW, FFXIV)',
  IMSIM:'immersive sim: sistemi che reagiscono alle scelte del giocatore (Deus Ex, Prey, Dishonored)',
  HORACT:'horror d\'azione: paura più combattimento (Resident Evil 4, Dead Space)',
  HORPSY:'horror psicologico: disagio e atmosfera più che mostri (Silent Hill 2, Amnesia)',
  HORMASC:'mascot horror: personaggi inquietanti in luoghi ordinari (Five Nights at Freddy\'s, Poppy Playtime)',
  HORASYM:'horror asimmetrico multigiocatore (Dead by Daylight)',
  BRAWL:'arena brawler / platform fighter (Super Smash Bros., Brawlhalla)',
  HEROSH:'hero shooter con personaggi dalle abilità uniche (Overwatch, Valorant)',
  EXTRACT:'extraction shooter: entra, raccogli, esci vivo (Escape from Tarkov)',
  BOOMER:'boomer shooter: FPS retrò veloce (Doom Eternal, Ultrakill)',
  AUTOB:'auto battler: schieri le unità, il combattimento è automatico (Teamfight Tactics)',
  GOD:'god game: controlli un mondo dall\'alto (Populous, Black & White)',
  FMV:'film interattivo con riprese reali (Her Story, Telling Lies)',
  MUD:'RPG testuale o MUD',
  GACHA:'RPG con sistema gacha e personaggi da collezionare (Genshin Impact)',
  JRPG:'RPG giapponese (Final Fantasy, Dragon Quest, Persona, Xenoblade): storia lineare, party fisso, combattimenti a turni o d\'azione',
  WRPG:'RPG occidentale (Skyrim, Baldur\'s Gate, The Witcher, Dragon Age): scelte, dialoghi e mondo aperto; i giapponesi sono JRPG',
  HNS:'hack & slash: combattimento frenetico contro orde di nemici (Diablo, Devil May Cry, Bayonetta) — se ha progressione da RPG usa ACT',
  SURV:'survival horror: risorse scarse e tensione (Resident Evil, Silent Hill, Dead Space)',
  STRATTAC:'strategia a turni su griglia SENZA elementi RPG di crescita personaggi (Advance Wars, Into the Breach)',
  TUR:'RPG a turni classico', ACT:'RPG d\'azione in tempo reale', REMAKE:'remake o remaster di un titolo già uscito'
};
function genreGlossary(codes){ return codes.map(c=> `${c} = ${TAG_INFO[c] ? TAG_INFO[c].label : c}${GENRE_HINT[c] ? ' (' + GENRE_HINT[c] + ')' : ''}`).join('; '); }

// Mappa id gioco -> chiave saga (raggruppamento automatico per franchise, solo sighe con 2+ titoli in classifica)
const SAGA_MAP = GIOCHI_DATA.sagaMap;
// Info per ogni saga: nome, ordine consigliato, nota
const SAGA_INFO = {
  "persona": {
    "name": "Persona",
    "order": "indipendenti",
    "note": "Ogni generazione (2, 3, 4, 5) racconta una storia completamente autonoma con cast e ambientazione nuovi: si può iniziare da qualsiasi capitolo numerato senza perdere nulla. Gli spin-off (Arena, Q, Tactica, Strikers) vanno invece dopo il capitolo numerato a cui si riferiscono."
  },
  "smt": {
    "name": "Shin Megami Tensei",
    "order": "indipendenti",
    "note": "I capitoli numerati e gli spin-off (Devil Survivor, Digital Devil Saga, Strange Journey, Devil Summoner) sono storie autonome, legate solo dal tema del fondersi/negoziare con i demoni e non da una trama comune."
  },
  "suikoden": {
    "name": "Suikoden",
    "order": "consigliato in ordine",
    "note": "Ogni capitolo racconta una guerra diversa in un continente diverso ed è autoconclusivo, ma personaggi ricorrenti e il filo dei 108 Astri del Destino si apprezzano di più giocando in ordine di uscita (I, II, III, IV, V)."
  },
  "trails": {
    "name": "Trails / Legend of Heroes (Kiseki)",
    "order": "ordine rigoroso",
    "note": "Serie fortemente serializzata: gli archi Sky (FC/SC/3rd), Crossbell (Zero/Azure) e Cold Steel (I-IV) proseguono la trama da un capitolo all'altro e vanno giocati in ordine di uscita; Trails through Daybreak apre un nuovo arco un po' più accessibile ma con forti richiami al passato della saga."
  },
  "tales": {
    "name": "Tales of",
    "order": "indipendenti",
    "note": "Ogni capitolo ha ambientazione, cast e trama indipendenti: si può iniziare da qualsiasi titolo della serie senza perdere continuità narrativa."
  },
  "dq": {
    "name": "Dragon Quest",
    "order": "indipendenti",
    "note": "I capitoli numerati sono storie autoconclusive (con leggeri richiami a trilogie tematiche: I-III, IV-VI, VII-IX): si può iniziare da qualunque titolo senza problemi di continuità."
  },
  "ff": {
    "name": "Final Fantasy",
    "order": "indipendenti",
    "note": "Ogni capitolo numerato ha un mondo e una trama a sé stanti. Fanno eccezione i sequel diretti dichiarati (es. X-2, XIII-2 e Lightning Returns, Crisis Core come prequel di VII) che vanno giocati dopo il capitolo di riferimento."
  },
  "fe": {
    "name": "Fire Emblem",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta una guerra e un cast diversi in un continente diverso: nessun ordine obbligato, salvo le versioni multiple dello stesso capitolo (es. Fates: Birthright/Conquest/Revelation) che sono varianti della stessa storia."
  },
  "pokemon": {
    "name": "Pokémon",
    "order": "indipendenti",
    "note": "Ogni generazione/regione è una storia autonoma; le versioni doppie (Rosso Fuoco/Verde Foglia, Nero/Bianco...) raccontano la stessa vicenda con differenze minori."
  },
  "xenoblade": {
    "name": "Xenoblade Chronicles",
    "order": "consigliato in ordine",
    "note": "Le trame dei tre capitoli principali sono autonome, ma personaggi e rivelazioni cosmologiche si intrecciano sempre di più: consigliato l'ordine 1 (Definitive Edition) → 2 → 3 per cogliere tutti i collegamenti."
  },
  "xenosaga": {
    "name": "Xenosaga",
    "order": "ordine rigoroso",
    "note": "Trilogia con un'unica trama continuativa e densissima: va giocata rigorosamente in ordine (Episode I → II → III)."
  },
  "atelier": {
    "name": "Atelier",
    "order": "trilogie indipendenti",
    "note": "La serie è divisa in piccoli archi (Arland, Dusk, Mysterious, Secret/Ryza...) quasi sempre autoconclusivi al loro interno: si può iniziare da un qualsiasi arco, ma dentro lo stesso arco conviene rispettare l'ordine numerico."
  },
  "disgaea": {
    "name": "Disgaea",
    "order": "indipendenti",
    "note": "Ogni capitolo ha protagonisti e Netherworld diversi: nessun ordine necessario, a parte i camei incrociati che sono solo un bonus per chi conosce i capitoli precedenti."
  },
  "etrian": {
    "name": "Etrian Odyssey",
    "order": "indipendenti",
    "note": "Ogni capitolo è un dungeon crawler autonomo con il proprio labirinto e la propria ambientazione: si può iniziare da qualunque titolo."
  },
  "wildarms": {
    "name": "Wild Arms",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta una storia autonoma in un pianeta western-fantasy diverso: nessun ordine obbligato."
  },
  "bof": {
    "name": "Breath of Fire",
    "order": "indipendenti",
    "note": "Ogni capitolo ha protagonista, mondo e trama diversi, uniti solo dal tema del Drago: nessun ordine necessario."
  },
  "growlanser": {
    "name": "Growlanser",
    "order": "indipendenti",
    "note": "Ogni capitolo è una storia autonoma con un proprio cast: nessun ordine obbligato."
  },
  "langrisser": {
    "name": "Langrisser",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta un conflitto diverso legato alla spada Langrisser: nessun ordine necessario."
  },
  "starocean": {
    "name": "Star Ocean",
    "order": "consigliato in ordine",
    "note": "Trame perlopiù indipendenti, ma la numerazione segue una cronologia interna coerente (First Departure → Second Story → Till the End of Time → Integrity and Faithlessness → The Last Hope → The Divine Force), utile per apprezzare i rimandi."
  },
  "valkyria": {
    "name": "Valkyria Chronicles",
    "order": "indipendenti",
    "note": "Ogni capitolo segue una squadra e un fronte diversi della stessa guerra: si può iniziare da qualunque titolo."
  },
  "chaosrings": {
    "name": "Chaos Rings",
    "order": "indipendenti",
    "note": "Ogni capitolo (incluso lo spin-off Omega) racconta un torneo e un cast diversi: nessun ordine obbligato."
  },
  "srw": {
    "name": "Super Robot Wars",
    "order": "indipendenti",
    "note": "Ogni capitolo è un crossover autonomo tra serie mecha diverse: nessuna continuità narrativa obbligata da rispettare tra un titolo e l'altro."
  },
  "ogre": {
    "name": "Ogre Battle / Tactics Ogre",
    "order": "indipendenti",
    "note": "I diversi capitoli condividono l'universo e alcuni temi politici, ma ognuno racconta un conflitto autonomo: nessun ordine obbligato per la comprensione della trama."
  },
  "frontmission": {
    "name": "Front Mission",
    "order": "indipendenti",
    "note": "Ogni capitolo segue un conflitto e un cast diversi nello stesso futuro alternativo dominato dai wanzer: nessun ordine obbligato."
  },
  "vandalhearts": {
    "name": "Vandal Hearts",
    "order": "consigliato in ordine",
    "note": "Flame of Judgment è un prequel diretto degli eventi del primo Vandal Hearts: giocarlo prima aiuta a cogliere i riferimenti politici del capitolo originale."
  },
  "classofheroes": {
    "name": "Class of Heroes",
    "order": "indipendenti",
    "note": "Ogni capitolo è un dungeon crawler scolastico autonomo: nessun ordine obbligato."
  },
  "summonnight": {
    "name": "Summon Night",
    "order": "indipendenti",
    "note": "Ogni capitolo/spin-off ha un proprio cast e una propria storia: nessun ordine obbligato."
  },
  "mercenariessaga": {
    "name": "Mercenaries Saga",
    "order": "indipendenti",
    "note": "Piccoli tattici autonomi ambientati in un mondo condiviso: nessun ordine obbligato tra i vari capitoli/spin-off."
  },
  "runefactory": {
    "name": "Rune Factory",
    "order": "indipendenti",
    "note": "Ogni capitolo ha una propria fattoria, città e cast: nessun ordine obbligato."
  },
  "shadowhearts": {
    "name": "Shadow Hearts",
    "order": "consigliato in ordine",
    "note": "Covenant e From the New World proseguono, seppur con cast in parte nuovo, il tono e alcuni riferimenti del primo capitolo: apprezzabili di più in ordine di uscita."
  },
  "lunar": {
    "name": "Lunar",
    "order": "indipendenti",
    "note": "Silver Star Story ed Eternal Blue sono due avventure autonome nello stesso mondo fantasy: nessun ordine obbligato."
  },
  "kingdomhearts": {
    "name": "Kingdom Hearts",
    "order": "ordine rigoroso",
    "note": "La trama prosegue direttamente da un capitolo all'altro con una continuità molto stretta: consigliato rispettare l'ordine narrativo (II Final Mix dopo il primo capitolo, poi III)."
  },
  "marioluigi": {
    "name": "Mario & Luigi",
    "order": "indipendenti",
    "note": "Ogni capitolo è un'avventura autoconclusiva con la propria minaccia comica: nessun ordine obbligato."
  },
  "maryskelter": {
    "name": "Mary Skelter",
    "order": "consigliato in ordine",
    "note": "Nightmares, il sequel 2 e Finale proseguono la medesima vicenda: consigliato l'ordine di uscita."
  },
  "neptunia": {
    "name": "Neptunia",
    "order": "indipendenti",
    "note": "La serie ha continuity leggera e molto ironica sul mezzo videoludico stesso: si può iniziare da quasi ogni capitolo senza problemi."
  },
  "valhallaknights": {
    "name": "Valhalla Knights",
    "order": "indipendenti",
    "note": "Ogni capitolo è un dungeon crawler autonomo: nessun ordine obbligato."
  },
  "warhammer": {
    "name": "Warhammer",
    "order": "indipendenti",
    "note": "Titoli di autori e sotto-ambientazioni diverse dell'universo Warhammer: nessun ordine o continuità narrativa da rispettare tra loro."
  },
  "bannersaga": {
    "name": "The Banner Saga",
    "order": "ordine rigoroso",
    "note": "Trilogia con un'unica trama continuativa: va giocata in ordine (1 → 2 → 3), i salvataggi si trasferiscono da un capitolo all'altro."
  },
  "catquest": {
    "name": "Cat Quest",
    "order": "indipendenti",
    "note": "Ogni capitolo è un'avventura autonoma nel proprio regno felino: nessun ordine obbligato."
  },
  "grandia": {
    "name": "Grandia",
    "order": "indipendenti",
    "note": "Ogni capitolo segue protagonisti e un mondo diversi: nessun ordine obbligato."
  },
  "goldensun": {
    "name": "Golden Sun",
    "order": "consigliato in ordine",
    "note": "Dark Dawn è ambientato una generazione dopo Golden Sun e The Lost Age e ne riprende diversi personaggi: consigliato giocarli in ordine di uscita."
  },
  "sakurataisen": {
    "name": "Sakura Taisen",
    "order": "consigliato in ordine",
    "note": "Sakura Taisen II prosegue direttamente la storia e i legami costruiti nel primo capitolo: consigliato l'ordine di uscita."
  },
  "twewy": {
    "name": "The World Ends with You",
    "order": "consigliato in ordine",
    "note": "NEO: The World Ends with You è ambientato dopo il primo capitolo e ne riprende temi e camei: meglio giocare prima l'originale."
  },
  "mana": {
    "name": "Serie Mana",
    "order": "indipendenti",
    "note": "I diversi capitoli (Secret, Legend, Trials, Sword, Visions) condividono solo l'ambientazione fantasy e l'Albero di Mana: nessun ordine narrativo obbligato."
  },
  "fossilfighters": {
    "name": "Fossil Fighters",
    "order": "indipendenti",
    "note": "Ogni capitolo è un'avventura autonoma sul recupero di fossili: nessun ordine obbligato."
  },
  "spectrobes": {
    "name": "Spectrobes",
    "order": "consigliato in ordine",
    "note": "Beyond the Portals prosegue la storia del primo capitolo: meglio giocarli in ordine di uscita."
  },
  "moero": {
    "name": "Moero Chronicle",
    "order": "indipendenti",
    "note": "I capitoli condividono il cast ma raccontano avventure a sé stanti: nessun ordine obbligato."
  },
  "blackmatrix": {
    "name": "Black/Matrix",
    "order": "indipendenti",
    "note": "Le diverse versioni raccontano varianti della stessa mitologia da prospettive diverse: nessun ordine obbligato."
  },
  "cladun": {
    "name": "Cladun",
    "order": "indipendenti",
    "note": "Ogni capitolo è un dungeon crawler autonomo con il proprio scherzoso worldbuilding: nessun ordine obbligato."
  },
  "criminalgirls": {
    "name": "Criminal Girls",
    "order": "indipendenti",
    "note": "Il secondo capitolo (Party Favors) ha un cast nuovo: nessun ordine obbligato."
  },
  "jadecocoon": {
    "name": "Jade Cocoon",
    "order": "consigliato in ordine",
    "note": "Il secondo capitolo prosegue la storia del primo con nuovi protagonisti: consigliato l'ordine di uscita."
  },
  "legaia": {
    "name": "Legend of Legaia",
    "order": "indipendenti",
    "note": "Legaia 2 ha ambientazione e cast completamente nuovi: nessun ordine obbligato."
  },
  "nierdrakengard": {
    "name": "NieR / Drakengard",
    "order": "consigliato in ordine",
    "note": "NieR nasce come spin-off/finale alternativo dell'universo Drakengard: per i curiosi dei collegamenti conviene esplorare prima Drakengard, ma ogni titolo si gode benissimo anche da solo."
  },
  "whiteknight": {
    "name": "White Knight Chronicles",
    "order": "ordine rigoroso",
    "note": "Il secondo capitolo prosegue direttamente la trama del primo: da giocare in ordine."
  },
  "7thdragon": {
    "name": "7th Dragon",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta un'incursione diversa contro i draghi in epoche diverse: nessun ordine obbligato."
  },
  "agarest": {
    "name": "Agarest (Record of Agarest War)",
    "order": "indipendenti",
    "note": "Ogni capitolo segue generazioni e conflitti diversi legati al tema del matrimonio/ereditarietà: nessun ordine narrativo stretto."
  },
  "artonelico": {
    "name": "Ar tonelico / Ar nosurge",
    "order": "consigliato in ordine",
    "note": "I titoli condividono lore e temi (il canto come magia) con alcuni rimandi da un capitolo all'altro: apprezzabili di più in ordine di uscita."
  },
  "batenkaitos": {
    "name": "Baten Kaitos",
    "order": "indipendenti",
    "note": "Origins è un prequel con cast quasi del tutto nuovo: si può giocare anche prima del primo capitolo senza spoiler rilevanti."
  },
  "bravely": {
    "name": "Bravely",
    "order": "indipendenti",
    "note": "Default II e Second sono storie autonome nello stesso stile di gioco: nessun ordine obbligato."
  },
  "darkcloud": {
    "name": "Dark Cloud",
    "order": "indipendenti",
    "note": "Il secondo capitolo (Dark Chronicle) ha protagonisti e trama nuovi: nessun ordine obbligato."
  },
  "deathend": {
    "name": "Death end re;Quest",
    "order": "consigliato in ordine",
    "note": "Il secondo capitolo riprende ed espande eventi e personaggi del primo: meglio giocarli in ordine."
  },
  "digimon": {
    "name": "Digimon Story",
    "order": "indipendenti",
    "note": "Hacker's Memory è ambientato in parallelo a Cyber Sleuth con protagonista diverso; Survive ha un cast e un tono narrativo completamente a sé: nessun ordine obbligato."
  },
  "dbz": {
    "name": "Dragon Ball Z (RPG)",
    "order": "indipendenti",
    "note": "Titoli con approcci e periodi della storia di Dragon Ball diversi: nessun ordine narrativo da rispettare tra loro."
  },
  "dragonforce": {
    "name": "Dragon Force",
    "order": "indipendenti",
    "note": "Il secondo capitolo ha un cast e continente nuovi: nessun ordine obbligato."
  },
  "fairyfencer": {
    "name": "Fairy Fencer F",
    "order": "indipendenti",
    "note": "Refrain Chord è una nuova versione/rilettura della stessa premessa: si può giocare uno dei due senza l'altro."
  },
  "fairytail": {
    "name": "Fairy Tail",
    "order": "consigliato in ordine",
    "note": "Il secondo capitolo prosegue la trama dell'anime/manga dal punto in cui finiva il primo: meglio giocarli in ordine."
  },
  "fateextra": {
    "name": "Fate/Extra",
    "order": "indipendenti",
    "note": "CCC è ambientato in un ramo temporale alternativo allo stesso torneo, Record ne è un remake: si può iniziare da uno qualsiasi."
  },
  "luminousarc": {
    "name": "Luminous Arc",
    "order": "indipendenti",
    "note": "Ogni capitolo ha protagonisti e streghe diverse: nessun ordine obbligato."
  },
  "lufia": {
    "name": "Lufia",
    "order": "indipendenti",
    "note": "Curse of the Sinistrals è un prequel/remake che precede narrativamente Rise of the Sinistrals: si può iniziare da uno qualsiasi."
  },
  "shiningforce": {
    "name": "Shining Force",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta una guerra diversa nel medesimo universo fantasy: nessun ordine obbligato."
  },
  "voiceofcards": {
    "name": "Voice of Cards",
    "order": "indipendenti",
    "note": "Ogni capitolo è una fiaba autonoma raccontata con lo stesso stile a carte: nessun ordine obbligato."
  },
  "ys": {
    "name": "Ys",
    "order": "indipendenti",
    "note": "Le avventure del vagabondo Adol Christin sono perlopiù autoconclusive capitolo per capitolo: si può iniziare da qualunque titolo, anche se la numerazione segue la sua cronologia di viaggi."
  },
  "yokai": {
    "name": "Yo-kai Watch",
    "order": "indipendenti",
    "note": "Ogni capitolo racconta un'avventura autonoma nella stessa cittadina: nessun ordine obbligato."
  },
  "inazuma": {
    "name": "Inazuma Eleven",
    "order": "consigliato in ordine",
    "note": "GO Chrono Stones e GO Galaxy proseguono la storia della sotto-serie GO in ordine di uscita."
  },
  "metalmax": {
    "name": "Metal Max",
    "order": "indipendenti",
    "note": "Ogni capitolo è un'avventura post-apocalittica autonoma: nessun ordine obbligato."
  },
  "valkyrieprofile": {
    "name": "Valkyrie Profile",
    "order": "consigliato in ordine",
    "note": "Silmeria è ambientato dopo il primo capitolo nello stesso mondo norreno, Covenant of the Plume è un prequel: godibile di più seguendo la cronologia interna (Covenant of the Plume → Valkyrie Profile → Silmeria)."
  }
};

const MOOD_PRESETS = [
  {key:'quick', icon:'\u23F1\uFE0F', label:"Un'ora libera", test:(g)=> !!(g.enrich && g.enrich.hoursMain && g.enrich.hoursMain<=20)},
  {key:'relax', icon:'\uD83D\uDE0C', label:'Rilassante', test:(g)=> !!(g.enrich && (g.enrich.dopamine || (g.enrich.gameplayScore||0)>=7) && !g.tags.includes('HOR') && !g.tags.includes('SOUL'))},
  {key:'challenge', icon:'\uD83D\uDD25', label:'Una sfida tattica', test:(g)=> g.tags.includes('TAC') || g.tags.includes('SOUL') || g.tags.includes('WAR')},
  {key:'epic', icon:'\uD83D\uDCDA', label:'Epico e lungo', test:(g)=> !!(g.enrich && g.enrich.hoursCompletionist && g.enrich.hoursCompletionist>=60)},
  {key:'dopamine', icon:'\uD83D\uDC89', label:'Loop coinvolgente', test:(g)=> !!(g.enrich && g.enrich.dopamine)}
];

const WIZARD_QUESTIONS = [
  {key:'time', question:'Quanto tempo hai a disposizione?', options:[
    {value:'short', label:'\u23F1\uFE0F Poco (sotto le 20 ore)'},
    {value:'medium', label:'\u23F3 Nella media (20-50 ore)'},
    {value:'long', label:"\uD83D\uDCDA Tanto, voglio un'epopea (50+ ore)"},
    {value:'', label:'\uD83E\uDD37 Non importa'}
  ]},
  {key:'mood', question:'Che umore hai stasera?', options:[
    {value:'relax', label:'\uD83D\uDE0C Qualcosa di rilassante'},
    {value:'story', label:'\u2728 Una storia intensa'},
    {value:'challenge', label:'\uD83D\uDD25 Una bella sfida tattica'},
    {value:'action', label:'\u2694\uFE0F Azione dinamica'},
    {value:'', label:'\uD83E\uDD37 Non importa'}
  ]},
  {key:'tier', question:'Quanto vuoi puntare in alto?', options:[
    {value:'top', label:'\uD83C\uDFC6 Solo capolavori (S+/S)'},
    {value:'good', label:'\uD83D\uDC4D Anche A/B va benissimo'},
    {value:'', label:'\uD83C\uDFB2 Sorprendimi, qualsiasi tier'}
  ]}
];

const GAMES = GIOCHI_DATA.games;
// Analisi, trame, pro/contro e «dopamina» stanno in giochi-dettagli.js (~1,2 MB), caricato a parte e in differita: la lista compare subito.
// Appena il file arriva, applyDetails() li aggancia ai giochi, riapplica le correzioni approvate e ridisegna. Fino ad allora g.enrich è null.
GAMES.forEach(g=>{ g.enrich = null; });
let DETAILS_READY = false;
function detailsReady(){ return DETAILS_READY; }
// i dettagli arrivano in 4 pezzi (giochi-dettagli-1..4.js): quando ci sono tutti li unisco e li applico
const DETAILS_N = 4;
function detailsPart(){
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
    if(g.custom) return;                                       // i giochi aggiunti da te hanno già la loro analisi
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
// se il file dei dettagli non arriva (rete che cade) riprova da solo, fino a 3 volte
let detailsTries = 0;
function retryDetails(){
  if(DETAILS_READY) return;
  if(detailsTries >= 3){ try{ showToast('I dettagli dei giochi non si sono caricati: controlla la connessione e ricarica la pagina', 6000); }catch(e){} return; }
  detailsTries++;
  setTimeout(()=>{
    const have = new Set((window.GIOCHI_DETAILS_PARTS || []).map(x=> x.part));
    for(let k = 1; k <= DETAILS_N; k++){
      if(have.has(k)) continue;
      const s = document.createElement('script');
      s.src = 'giochi-dettagli-' + k + '.js?r=' + Date.now();
      s.onload = ()=> detailsPart();
      s.onerror = retryDetails;
      document.head.appendChild(s);
    }
  }, 1500 * detailsTries);
}
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
    const raw = localStorage.getItem('jrpg_profiles');
    if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }
  }catch(e){}
  return [{id:'mario', name:'Mario'}];
}
let PROFILES = loadProfiles();
function saveProfiles(){ try{ localStorage.setItem('jrpg_profiles', JSON.stringify(PROFILES)); }catch(e){} }
function loadActiveProfileId(){
  try{
    const id = localStorage.getItem('jrpg_active_profile');
    if(id && PROFILES.some(p=>p.id===id)) return id;
  }catch(e){}
  return PROFILES[0].id;
}
let ACTIVE_PROFILE_ID = loadActiveProfileId();
function saveActiveProfileId(){ try{ localStorage.setItem('jrpg_active_profile', ACTIVE_PROFILE_ID); }catch(e){} }
function currentProfile(){ return PROFILES.find(p=>p.id===ACTIVE_PROFILE_ID) || PROFILES[0]; }
function profileKey(baseKey){ return ACTIVE_PROFILE_ID==='mario' ? baseKey : (baseKey + '__' + ACTIVE_PROFILE_ID); }
function nextGuestId(){ return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

let FAVS = new Set();
function loadFavs(){
  FAVS = new Set();
  try{
    const stored = localStorage.getItem(profileKey('jrpg_favs'));
    if(stored) FAVS = new Set(JSON.parse(stored));
  }catch(e){ FAVS = new Set(); }
}
loadFavs();
function saveFavs(){ try{ localStorage.setItem(profileKey('jrpg_favs'), JSON.stringify(Array.from(FAVS))); }catch(e){} }

const STATUS_INFO = {
  played:{icon:'✅', label:'Giocato', dot:'played'},
  playing:{icon:'▶️', label:'In corso', dot:'playing'},
  backlog:{icon:'📌', label:'Da giocare', dot:'backlog'},
  dropped:{icon:'⛔', label:'Droppato', dot:'dropped'}
};
let STATUSES = {};
function loadStatuses(){
  STATUSES = {};
  try{
    const storedS = localStorage.getItem(profileKey('jrpg_status'));
    if(storedS) STATUSES = JSON.parse(storedS);
  }catch(e){ STATUSES = {}; }
}
loadStatuses();
function saveStatuses(){ try{ localStorage.setItem(profileKey('jrpg_status'), JSON.stringify(STATUSES)); }catch(e){} }
function setStatus(id, status){
  if(STATUSES[id]===status){ delete STATUSES[id]; }
  else { STATUSES[id] = status; }
  saveStatuses();
}

let MYTIER = {};
function loadMyTier(){
  MYTIER = {};
  try{
    const storedMT = localStorage.getItem(profileKey('jrpg_mytier'));
    if(storedMT) MYTIER = JSON.parse(storedMT);
  }catch(e){ MYTIER = {}; }
}
loadMyTier();
function saveMyTier(){ try{ localStorage.setItem(profileKey('jrpg_mytier'), JSON.stringify(MYTIER)); }catch(e){} }
function effectiveTier(g){ return MYTIER[g.id] || g.tier; }
function moveToTier(id, tier){
  const g = GAMES.find(x=>String(x.id)===String(id));
  if(!g) return;
  if(g.tier===tier) delete MYTIER[id]; else MYTIER[id] = tier;
  saveMyTier(); renderMyTier();
  showToast(`${g.name} spostato in ${tier}`);
}

// ---- Classifiche per genere: "JRPG / RPG" (predefinita) + le liste per genere che scegli tu ----
let ACTIVE_LIST = 'jrpg';   // 'jrpg' | 'all' | codice genere
let MY_LISTS = [];          // codici genere aggiunti come classifica
function loadLists(){
  ACTIVE_LIST = 'jrpg'; MY_LISTS = [];
  try{
    const v = JSON.parse(localStorage.getItem(profileKey('jrpg_lists')) || 'null');
    if(v && Array.isArray(v.mine)) MY_LISTS = v.mine.filter(c=> TAG_INFO[c]);
    if(v && typeof v.sel === 'string' && (v.sel === 'jrpg' || v.sel === 'all' || MY_LISTS.includes(v.sel))) ACTIVE_LIST = v.sel;
  }catch(e){}
}
function saveLists(){ try{ localStorage.setItem(profileKey('jrpg_lists'), JSON.stringify({sel: ACTIVE_LIST, mine: MY_LISTS})); }catch(e){} }
function inActiveList(g){
  if(ACTIVE_LIST === 'all') return true;
  const tags = g.tags || [];
  if(ACTIVE_LIST === 'jrpg') return !tags.some(t=> EXTRA_GENRE_INFO[t]);
  return tags.includes(ACTIVE_LIST);
}
function listCount(id){ const prev = ACTIVE_LIST; ACTIVE_LIST = id; const n = GAMES.filter(inActiveList).length; ACTIVE_LIST = prev; return n; }
function bumpListUsage(id){ if(id === 'jrpg' || id === 'all') return; try{ const k = profileKey('jrpg_list_usage'); const u = JSON.parse(localStorage.getItem(k) || '{}') || {}; u[id] = (u[id] || 0) + 1; localStorage.setItem(k, JSON.stringify(u)); }catch(e){} }
function listUsage(){ try{ return JSON.parse(localStorage.getItem(profileKey('jrpg_list_usage')) || '{}') || {}; }catch(e){ return {}; } }
function setActiveList(id){ ACTIVE_LIST = id; bumpListUsage(id); saveLists(); renderListBar(); if(typeof setView === 'function') setView(state.view); }
// barra dei generi «salva-pollice»: JRPG/RPG, i generi più usati (max 4), Tutti e il pulsante che apre il selettore completo a gruppi
const LIST_BAR_MAX = 4;
function renderListBar(){
  const bar = document.getElementById('listBar'); if(!bar) return;
  const chip = (id, icon, label)=> `<button class="list-chip${ACTIVE_LIST===id?' active':''}" data-list="${id}">${icon} ${escHtml(label)} <span class="list-cnt">${listCount(id)}</span></button>`;
  const GI = n=> `<svg class="gi" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-${n}"/></svg>`;
  const use = listUsage();
  const cand = MY_LISTS.map(c=> ({c, n: listCount(c), u: use[c] || 0})).filter(o=> o.n > 0 && TAG_INFO[o.c]).sort((a, b)=> b.u - a.u || b.n - a.n);
  let shown = cand.slice(0, LIST_BAR_MAX).map(o=> o.c);
  if(ACTIVE_LIST !== 'jrpg' && ACTIVE_LIST !== 'all' && TAG_INFO[ACTIVE_LIST] && !shown.includes(ACTIVE_LIST)) shown = [ACTIVE_LIST].concat(shown.slice(0, LIST_BAR_MAX - 1));
  bar.innerHTML = chip('jrpg', GI('pad'), 'JRPG / RPG') + shown.map(c=> chip(c, TAG_INFO[c].icon, TAG_INFO[c].label)).join('') + chip('all', GI('globe'), 'Tutti') + `<button class="list-chip list-add" id="listAddBtn" title="Tutti i generi, divisi per gruppi">${GI('lens')} Tutti i generi</button>`;
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
function openListPicker(q){
  q = typeof q === 'string' ? q.trim().toLowerCase() : '';
  let el = document.getElementById('listPickerBackdrop');
  if(!el){
    el = document.createElement('div'); el.id = 'listPickerBackdrop'; el.className = 'dup-backdrop';
    el.addEventListener('click', (e)=>{ if(e.target === el || e.target.closest('[data-lp-close]')){ el.classList.remove('show'); renderListBar(); } });
    document.body.appendChild(el);
  }
  const chip = c=>{ const n = listCount(c); return `<button class="list-chip${ACTIVE_LIST===c?' active':''}${n ? '' : ' lp-zero'}" data-lp="${c}">${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)} <span class="list-cnt">${n}</span></button>`; };
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🔍 Tutti i generi</b><button class="btn" data-lp-close>Chiudi</button></div>
    <div class="lp-sub">Tocca un genere per aprire la sua classifica. I gruppi si aprono e si chiudono; i più usati restano nella barra.</div>
    <input class="lp-search" id="lpSearch" type="search" placeholder="Cerca un genere (es. horror, kart, puzzle)…" value="${escHtml(q)}" autocomplete="off">
    <div class="gg-wrap">${genreAccordionHtml(chip, codes=> codes.filter(c=> listCount(c) > 0).length, q)}</div></div>`;
  const inp = el.querySelector('#lpSearch');
  let h = 0; inp.addEventListener('input', ()=>{ clearTimeout(h); h = setTimeout(()=>{ const v = inp.value; openListPicker(v); const n = document.getElementById('lpSearch'); if(n){ n.focus(); n.setSelectionRange(v.length, v.length); } }, 200); });
  wireAccordion(el, !!q);
  el.querySelectorAll('[data-lp]').forEach(b=> b.addEventListener('click', ()=>{
    const c = b.dataset.lp; if(!MY_LISTS.includes(c)){ MY_LISTS.push(c); }
    el.classList.remove('show'); setActiveList(c);
  }));
  el.classList.add('show');
}
function ensureGenreLists(tags){
  // crea la classifica del genere principale (primo tag) e di ogni genere non-RPG del gioco
  const wanted = [];
  (tags || []).forEach((t, i)=>{ if(TAG_INFO[t] && (i === 0 || EXTRA_GENRE_INFO[t]) && !wanted.includes(t)) wanted.push(t); });
  const added = wanted.filter(t=> !MY_LISTS.includes(t));
  if(added.length){ added.forEach(t=> MY_LISTS.push(t)); saveLists(); renderListBar(); }
  return added;
}
// Conferma grande e ben visibile (al centro dello schermo) quando un gioco viene aggiunto
function showAddedBanner(name, tags, newLists){
  if(window.__bulkAdd) return;                         // «Accetta tutto»: niente banner per ogni gioco, c'è l'elenco finale
  let el = document.getElementById('addedBanner');
  if(!el){ el = document.createElement('div'); el.id = 'addedBanner'; el.className = 'added-banner'; document.body.appendChild(el); }
  const inJrpg = !(tags || []).some(t=> EXTRA_GENRE_INFO[t]);
  const parts = [];
  (tags || []).forEach(t=>{ if(MY_LISTS.includes(t) && TAG_INFO[t]) parts.push(`${TAG_INFO[t].icon} ${TAG_INFO[t].label}` + (newLists.includes(t) ? ' <b>(nuova classifica)</b>' : '')); });
  if(inJrpg) parts.push('🎮 JRPG / RPG');
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
  const withStory = GAMES.filter(g=>g.story).length;
  const playedCount = Object.values(STATUSES).filter(s=>s==='played').length;
  const pct = GAMES.length ? Math.round((playedCount/GAMES.length)*100) : 0;
  const withCover = GAMES.filter(g=>effectiveCover(g)).length;
  const coverPct = GAMES.length ? Math.round((withCover/GAMES.length)*100) : 0;
  const withEnrich = GAMES.filter(g=>g.enrich).length;
  const enrichPct = GAMES.length ? Math.round((withEnrich/GAMES.length)*100) : 0;
  const withLabel = GAMES.filter(g=>g.label).length;
  const labelPct = GAMES.length ? Math.round((withLabel/GAMES.length)*100) : 0;
  document.getElementById('metricsRow').innerHTML = `
    <div class="metric"><b>${GAMES.length}</b>giochi totali</div>
    <div class="metric"><b>${avg}</b>voto medio</div>
    <div class="metric"><b>${median}</b>voto mediano</div>
    <div class="metric"><b>${minY}\u2013${maxY}</b>periodo coperto</div>
    <div class="metric"><b>${withStory}</b>schede narrative</div>
    <div class="metric"><b>${FAVS.size}</b>preferiti</div>
    <div class="metric"><b>${playedCount} (${pct}%)</b>giocati da te</div>
    <div class="metric" title="Giochi con una copertina visibile"><b>${withCover}/${GAMES.length} (${coverPct}%)</b>copertine</div>
    <div class="metric" title="Giochi con scheda approfondita (pro/contro, ore, dopamina...)"><b>${withEnrich}/${GAMES.length} (${enrichPct}%)</b>schede complete</div>
    <div class="metric" title="Giochi con l'etichetta (difficoltà, ore, fa per te se...)"><b>${withLabel}/${GAMES.length} (${labelPct}%)</b>etichette</div>
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

  const statusCounts = {Giocato:0, 'In corso':0, 'Da giocare':0, Droppato:0};
  Object.values(STATUSES).forEach(s=>{
    if(s==='played') statusCounts.Giocato++;
    else if(s==='playing') statusCounts['In corso']++;
    else if(s==='backlog') statusCounts['Da giocare']++;
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
    `<div class="metrics" style="margin-bottom:16px;"><div class="metric"><b>${Math.round(totalHoursPlayed)}h</b>ore stimate giocate (titoli "giocato"/"in corso" con dati di durata)</div><div class="metric"><b>${gamesPlayedCount}</b>giochi con stato "giocato"</div></div>` +
    chartHtml('Completamento per tier (% giocato)', completionRows) +
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
  if(state.onlyStory) list = list.filter(g=> !!g.story);
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
  list = list.slice().sort((a,b)=>{
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

function methodIcon(m, g){ const f = g && typeof freshInfo === 'function' ? freshInfo(g) : null; if(m==='V'){ return f ? '<span class="vplus" title="Voto verificato e gioco aggiornato con Update+">V+</span>' : '✅'; } return f ? '<span class="vplus s" title="Gioco aggiornato con Update+, ma il voto è ancora una stima: nessuna fonte affidabile (Metacritic) lo ha confermato. Diventa V+ appena una fonte lo conferma.">🗳️+</span>' : '🗳️'; }   // V+ dorata = voto verificato + Update+   // V dorata = voto verificato + Update+
// fonte del voto: logo piccolo nella lista (M giallo = Metacritic, rosso = OpenCritic, R = RAWG, STIMA = non verificato)
function srcKind(g){
  if(g.m !== 'V') return 'stima';
  const v = String(g.vs || '');
  return /^OpenCritic/.test(v) ? 'oc' : /^RAWG/.test(v) ? 'rawg' : 'mc';       // verificato senza fonte registrata = Metacritic (la fonte storica della classifica)
}
const SRC_NAME = {mc: 'Metacritic', oc: 'OpenCritic', rawg: 'RAWG', stima: 'Stima (nessun voto verificato)'};
function srcIcon(g){
  const k = srcKind(g);
  return `<img class="srcico" src="icons/fonti/${k}.png" width="24" height="24" alt="${SRC_NAME[k]}" title="${SRC_NAME[k]}${g.vs && k !== 'stima' ? ' · ' + escHtml(g.vs) : ''}" loading="lazy">`;
}
function methodLabel(m){ return m==='V' ? 'Metacritic / aggregato verificato' : 'Stima community / recensori specializzate'; }

function showToast(msg, ms){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
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
  function buildRow(g){
    const tr = document.createElement('tr');
    tr.dataset.gid = g.id;
    const isFav = FAVS.has(g.id);
    const dnaBadge = (()=>{ if(!dnaProfileForRow) return ''; const d = dnaForGame(g, dnaProfileForRow); return d ? `<span class="dna-chip" style="color:${dnaColor(d.pct)}; border-color:${dnaColor(d.pct)};">${d.pct}%</span>` : ''; })();
    tr.innerHTML = `
      <td class="fav" data-role="fav"><svg class="gi ${isFav ? '' : 'fav-off'}" viewBox="0 0 32 32" aria-label="${isFav ? 'Preferito' : 'Non preferito'}"><use href="#g-${isFav ? 'favon' : 'favoff'}"/></svg></td>
      <td class="rank mobhide">${g.id}</td>
      <td>${STATUSES[g.id] ? `<span class="status-dot ${STATUS_INFO[STATUSES[g.id]].dot}" title="${STATUS_INFO[STATUSES[g.id]].label}"></span>` : ''}${miniIcons(g)}${g.name}${dnaBadge}</td>
      <td class="plat mobhide">${g.plat}</td>
      <td class="year">${g.year || g.ysort || ''}</td>
      <td><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span></td>
      <td class="score">${scoreTxt(g)}</td>
      <td class="method" title="${methodLabel(g.m)}${g.m==='V' && freshInfo(g) && !freshInfo(g).m ? ' · aggiornato con Update+' : ''}">${srcIcon(g)}</td>
      <td class="storyicon">${itBadge(g)}</td>
    `;
    tr.querySelector('[data-role="fav"]').addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(FAVS.has(g.id)){ FAVS.delete(g.id); showToast('Rimosso dai preferiti'); }
      else { FAVS.add(g.id); showToast('Aggiunto ai preferiti'); }
      saveFavs(); renderMetrics(); render();
    });
    // toccando un simbolo (💕🤝✨💉) si legge PERCHÉ il gioco ce l'ha; il resto della riga apre la scheda
    tr.addEventListener('click', ev=>{ const mi = ev.target.closest && ev.target.closest('.mini-icon'); if(mi && mi.dataset.why){ ev.stopPropagation(); showToast(mi.dataset.why, 5200); return; } openModal(g); });
    return tr;
  }
  window.__rtBuildRow = buildRow;         // usata per aggiornare una sola riga senza ridisegnare la lista
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

function updateArrows(){
  document.querySelectorAll('thead th').forEach(th=>{
    const arrow = th.querySelector('.arrow');
    if(!arrow) return;
    // per il Tier la direzione 1 = dal migliore (S+) al peggiore, cioè valori decrescenti → ▼
    const desc = th.dataset.key==='tier' ? state.sortDir===1 : state.sortDir===-1;
    arrow.textContent = (th.dataset.key===state.sortKey) ? (desc ? '▼' : '▲') : '';
  });
}

document.querySelectorAll('thead th[data-key]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.key;
    if(key==='fav'){
      if(state.sortKey==='fav'){ state.sortDir *= -1; } else { state.sortKey='fav'; state.sortDir=-1; }
      render(); return;
    }
    if(state.sortKey===key){ state.sortDir *= -1; }
    else { state.sortKey = key; state.sortDir = (key==='score'||key==='ysort') ? -1 : 1; }
    render();
  });
});

// Debounce: sulla ricerca digitando velocemente non ricostruiamo la lista ad OGNI tasto premuto
// (con centinaia di giochi, e destinati a crescere, tenerla reattiva anche su telefoni più lenti).
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
  if(profile.n < 2){ showToast('Segna qualche preferito o gioco giocato prima: mi serve per capire i tuoi gusti'); return; }
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
  state.view = v;
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
// trascinamento con il dito: tieni premuto ~0,35 s su un gioco, poi trascinalo su un altro tier
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
function renderMyTier(){
  const list = applyFilters();
  const q = mtNorm(mtQuery);
  const grouped = {};
  TIERS_LIST.forEach(t=> grouped[t]=[]);
  list.forEach(g=>{
    if(q && !mtNorm(g.name).includes(q)) return;
    const t = effectiveTier(g);
    if(!grouped[t]) grouped[t]=[];
    grouped[t].push(g);
  });
  const wrap = document.getElementById('myTierSections');
  wrap.innerHTML = '';
  const jump = document.getElementById('mtJump'); if(jump) jump.innerHTML = '';
  let total = 0;
  TIERS_LIST.forEach(t=>{
    const games = grouped[t] || []; total += games.length;
    if(q && !games.length) return;                                   // con la ricerca mostro solo i tier che contengono qualcosa
    if(jump) jump.insertAdjacentHTML('beforeend', `<button type="button" class="mt-jbtn" data-jt="${t}"><span class="badge ${TIER_LABEL[t]}">${t}</span> ${games.length}</button>`);
    const section = document.createElement('div');
    section.className = 'mytier-section' + (games.length ? '' : ' mt-empty');
    section.id = 'mt-sec-' + String(t).replace('+', 'plus');
    section.innerHTML = `<div class="mytier-section-head"><span class="badge big ${TIER_LABEL[t]}">${t}</span><span class="count">${games.length} giochi</span></div>`;
    const dz = document.createElement('div');
    dz.className = 'mytier-dropzone';
    dz.dataset.tier = t;
    games.sort((a,b)=> b.score-a.score).forEach(g=>{
      const chip = document.createElement('div');
      chip.className = 'mytier-chip';
      chip.draggable = true;
      chip.innerHTML = `<span class="nm" title="${g.name}">${g.name}</span><span class="sc">${scoreTxt(g)}</span><button class="movebtn" aria-label="Sposta">⇅</button>`;
      chip.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', String(g.id)); });
      chip.querySelector('.nm').addEventListener('click', ()=> openModal(g));
      chip.querySelector('.movebtn').addEventListener('click', (e)=>{ e.stopPropagation(); openTierPicker(e.currentTarget, g.id); });
      mtEnableTouchDrag(chip, g.id);
      dz.appendChild(chip);
    });
    dz.addEventListener('dragover', (e)=>{ e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', ()=> dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e)=>{
      e.preventDefault(); dz.classList.remove('dragover');
      const id = e.dataTransfer.getData('text/plain');
      if(id) moveToTier(id, t);
    });
    section.appendChild(dz);
    wrap.appendChild(section);
  });
  if(q && !total) wrap.innerHTML = '<div class="empty" style="padding:24px;text-align:center;">Nessun gioco trovato con questo nome.</div>';
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
  MYTIER = {}; saveMyTier(); renderMyTier();
  showToast('Classifica personale azzerata');
});

// Collapsible filters panel
const filtersPanel = document.getElementById('filtersPanel');
const filtersBtn = document.getElementById('filtersBtn');
let filtersOpen = false;
try{ filtersOpen = localStorage.getItem('jrpg_filters_open') === '1'; }catch(e){}
function applyFiltersPanelState(){
  filtersPanel.classList.toggle('open', filtersOpen);
  filtersBtn.classList.toggle('active', filtersOpen);
}
filtersBtn.addEventListener('click', ()=>{
  filtersOpen = !filtersOpen;
  try{ localStorage.setItem('jrpg_filters_open', filtersOpen ? '1':'0'); }catch(e){}
  applyFiltersPanelState();
});
applyFiltersPanelState();

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

// ---- Modal scheda gioco ----

const STORY_TAG_INFO = {
  romance:{icon:'💕', label:'Storia romantica'},
  affinity:{icon:'🤝', label:'Legame speciale'},
  wow:{icon:'✨', label:'Storia sorprendente'}
};
// ---- Update+ : simbolo «super aggiornato» (dorato = tutte le fonti in automatico, viola = controllato a mano da te) ----
// ---- Aggiornamenti in background senza bloccare lo scorrimento ----
// Un dato cambiato (trama, simboli, lingua…) aggiorna SOLO la riga di quel gioco; i ridisegni completi (nuovi giochi, voto/tier cambiati)
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
    const p = rtPendingParts; rtPendingParts = null;
    try{ if(p.metrics) renderMetrics(); if(p.stats) renderStats(); if(p.list) render(); if(p.bar) renderListBar(); }catch(e){}
  };
  rtIdleTimer = setTimeout(tick, 600);
}
function freshInfo(g){ try{ const f = (JSON.parse(localStorage.getItem('jrpg_fresh') || '{}') || {})[g.id]; return f && f.gold ? f : null; }catch(e){ return null; } }
function freshWhy(f){
  let d = ''; try{ d = new Date(f.t).toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'}); }catch(e){}
  return (f.m ? 'Controllato a mano da te il ' : 'Update V+ il ') + d + ' · fonti: ' + ((f.src && f.src.length) ? f.src.join(', ') : 'ricerca manuale') + (f.pe ? ' · ' + f.pe + ' modifiche da approvare' : '') + '. Non lo aggiorno più (tranne i prezzi).';
}
// aggiorna SOLO la riga di un gioco (la V+ dorata nella colonna voto; il simbolo Update+ sta solo nella scheda) senza ridisegnare la lista: niente sfarfallio negli aggiornamenti in background
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
