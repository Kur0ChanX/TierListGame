const TIER_ORDER = {'S+':0,'S':1,'A':2,'B':3,'C':4,'D':5,'E':6,'F':7};
const TIER_LABEL = {'S+':'Splus','S':'S','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F'};
const TIERS_LIST = ['S+','S','A','B','C','D','E','F'];

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
  ROG:{icon:'🎲', label:'Roguelike'}
};
const TAG_ORDER = ['TAC','ACT','DUN','TUR','MON','CARD','WAR','CROSS','VN','MECH','METR','SOUL','HOR','REMAKE','LIFE','ROG'];

// Generi extra (NON RPG) usati solo dalla scheda "Novità per genere", per poter cercare titoli di
// qualunque genere videoludico e non solo RPG/JRPG. Vengono uniti a TAG_INFO (così icona/etichetta
// si vedono correttamente ovunque nel sito, es. su un gioco aggiunto con uno di questi tag) ma MAI
// aggiunti a TAG_ORDER, che resta l'elenco dei filtri della lista principale (100% RPG/JRPG).
const EXTRA_GENRE_INFO = {
  PLAT:{icon:'🕹️', label:'Platform'},
  BEAT:{icon:'👊', label:'Picchiaduro a scorrimento'},
  FIGHT:{icon:'🥊', label:'Picchiaduro 1v1'},
  STEALTH:{icon:'🥷', label:'Stealth'},
  ADV:{icon:'🔍', label:'Avventura punta e clicca'},
  WALK:{icon:'🚶', label:'Narrativo / walking sim'},
  FPS:{icon:'🔫', label:'Sparatutto FPS'},
  TPS:{icon:'🎯', label:'Sparatutto TPS'},
  SHMUP:{icon:'🚀', label:'Sparatutto a scorrimento'},
  BR:{icon:'🪂', label:'Battle royale'},
  SPORT:{icon:'⚽', label:'Sport'},
  RACE:{icon:'🏎️', label:'Corse / guida'},
  RTS:{icon:'🛰️', label:'Strategia in tempo reale'},
  TBS4X:{icon:'🗺️', label:'Strategia a turni / 4X'},
  MOBA:{icon:'🛡️', label:'MOBA'},
  CITY:{icon:'🏙️', label:'Gestionale / city builder'},
  TOWERDEF:{icon:'🏹', label:'Tower defense'},
  ECOSIM:{icon:'📈', label:'Simulazione economica/gestionale'},
  PUZ:{icon:'🧩', label:'Puzzle'},
  PARTY:{icon:'🎉', label:'Party game'},
  RHY:{icon:'🎵', label:'Musicale / ritmo'},
  BOARDG:{icon:'♠️', label:'Da tavolo / carte (non RPG)'},
  SAND:{icon:'⛏️', label:'Sandbox / survival crafting'},
  SIMLIFE:{icon:'🧑‍🌾', label:'Simulazione di vita/lavoro'},
  ARCADE:{icon:'👾', label:'Arcade / retro'},
  IDLE:{icon:'⏳', label:'Idle / clicker'},
  RUN:{icon:'🏃', label:'Endless runner'},
  COOP:{icon:'🤝', label:'Cooperativo / multiplayer sociale'}
};
Object.assign(TAG_INFO, EXTRA_GENRE_INFO);
// Sezioni per il selettore generi di "Novità per genere": copre RPG + praticamente ogni genere
// videoludico, raggruppato in modo schematico invece di un listone unico.
const NOVITA_GENRE_SECTIONS = [
  {title:'RPG e stili affini', codes: TAG_ORDER.slice()},
  {title:'Azione e avventura', codes:['PLAT','BEAT','FIGHT','STEALTH','ADV','WALK']},
  {title:'Sparatutto e battle', codes:['FPS','TPS','SHMUP','BR']},
  {title:'Sport e corse', codes:['SPORT','RACE']},
  {title:'Strategia e gestionale', codes:['RTS','TBS4X','MOBA','CITY','TOWERDEF','ECOSIM']},
  {title:'Puzzle e party', codes:['PUZ','PARTY','RHY','BOARDG']},
  {title:'Sandbox e simulazione', codes:['SAND','SIMLIFE']},
  {title:'Arcade e altro', codes:['ARCADE','IDLE','RUN','COOP']}
];
const NOVITA_GENRE_ALL_CODES = NOVITA_GENRE_SECTIONS.reduce((acc,s)=> acc.concat(s.codes), []);

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
const ENRICH = GIOCHI_DATA.enrich;
GAMES.forEach(g=>{ g.enrich = ENRICH[g.id] || null; });
const DOPA = GIOCHI_DATA.dopa;
GAMES.forEach(g=>{ if(g.enrich && DOPA[g.id]) g.enrich.dopa = DOPA[g.id]; });
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
  if(ACTIVE_LIST === 'jrpg') return !(tags.some(t=> EXTRA_GENRE_INFO[t]) && !tags.some(t=> !EXTRA_GENRE_INFO[t]));
  return tags.includes(ACTIVE_LIST);
}
function listCount(id){ const prev = ACTIVE_LIST; ACTIVE_LIST = id; const n = GAMES.filter(inActiveList).length; ACTIVE_LIST = prev; return n; }
function setActiveList(id){ ACTIVE_LIST = id; saveLists(); renderListBar(); if(typeof setView === 'function') setView(state.view); }
function renderListBar(){
  const bar = document.getElementById('listBar'); if(!bar) return;
  const chip = (id, icon, label)=> `<button class="list-chip${ACTIVE_LIST===id?' active':''}" data-list="${id}">${icon} ${escHtml(label)} <span class="list-cnt">${listCount(id)}</span></button>`;
  bar.innerHTML = chip('jrpg','🎮','JRPG / RPG') + MY_LISTS.map(c=> chip(c, TAG_INFO[c].icon, TAG_INFO[c].label)).join('') + chip('all','🌐','Tutti') + `<button class="list-chip list-add" id="listAddBtn">➕ Generi</button>`;
  bar.querySelectorAll('[data-list]').forEach(b=> b.addEventListener('click', ()=> setActiveList(b.dataset.list)));
  document.getElementById('listAddBtn').addEventListener('click', openListPicker);
}
function openListPicker(){
  let el = document.getElementById('listPickerBackdrop');
  if(!el){
    el = document.createElement('div'); el.id = 'listPickerBackdrop'; el.className = 'dup-backdrop';
    el.addEventListener('click', (e)=>{ if(e.target === el || e.target.closest('[data-lp-close]')){ el.classList.remove('show'); renderListBar(); } });
    document.body.appendChild(el);
  }
  const body = NOVITA_GENRE_SECTIONS.map(sec=> `<div class="lp-title">${escHtml(sec.title)}</div><div class="lp-chips">${sec.codes.map(c=> `<button class="list-chip${MY_LISTS.includes(c)?' active':''}" data-lp="${c}">${TAG_INFO[c].icon} ${escHtml(TAG_INFO[c].label)} <span class="list-cnt">${listCount(c)}</span></button>`).join('')}</div>`).join('');
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>Le tue classifiche per genere</b><button class="btn" data-lp-close>Fatto</button></div><div class="lp-sub">Tocca un genere per aggiungerlo o toglierlo dalla barra. La classifica JRPG / RPG resta sempre disponibile.</div>${body}</div>`;
  el.querySelectorAll('[data-lp]').forEach(b=> b.addEventListener('click', ()=>{
    const c = b.dataset.lp, i = MY_LISTS.indexOf(c);
    if(i >= 0){ MY_LISTS.splice(i, 1); if(ACTIVE_LIST === c) ACTIVE_LIST = 'jrpg'; } else MY_LISTS.push(c);
    saveLists(); openListPicker();
  }));
  el.classList.add('show');
}
function ensureGenreLists(tags){
  const added = (tags || []).filter(t=> EXTRA_GENRE_INFO[t] && !MY_LISTS.includes(t));
  if(!added.length) return;
  added.forEach(t=> MY_LISTS.push(t)); saveLists(); renderListBar();
  showToast('Creata la classifica: ' + added.map(t=> TAG_INFO[t].label).join(', '), 3500);
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

function applyFilters(){
  let list = GAMES.filter(inActiveList);
  if(state.tiers.size>0) list = list.filter(g=> state.tiers.has(state.view==='mytier' ? effectiveTier(g) : g.tier));
  if(state.method) list = list.filter(g=>g.m===state.method);
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
    list = list.filter(g=> g.name.toLowerCase().includes(q) || g.plat.toLowerCase().includes(q) || g.year.includes(q));
  }
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

function methodIcon(m){ return m==='V' ? '✅' : '🗳️'; }
function methodLabel(m){ return m==='V' ? 'Metacritic / aggregato verificato' : 'Stima community / recensori specializzate'; }

function showToast(msg, ms){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), ms || 1800);
}

function render(){
  const list = applyFilters();
  const tbody = document.getElementById('tbody');
  const emptyMsg = document.getElementById('emptyMsg');
  document.getElementById('countLine').textContent = `${list.length} risultati su ${GAMES.filter(inActiveList).length}`;
  document.getElementById('favCountLine').textContent = FAVS.size ? `★ ${FAVS.size} preferiti` : '';

  if(list.length===0){ tbody.innerHTML=''; emptyMsg.style.display='block'; return; }
  emptyMsg.style.display='none';

  const dnaProfileForRow = state.sortKey==='dna' ? buildTasteProfile() : null;
  const frag = document.createDocumentFragment();
  list.forEach(g=>{
    const tr = document.createElement('tr');
    const isFav = FAVS.has(g.id);
    const dnaBadge = (()=>{ if(!dnaProfileForRow) return ''; const d = dnaForGame(g, dnaProfileForRow); return d ? `<span class="dna-chip" style="color:${dnaColor(d.pct)}; border-color:${dnaColor(d.pct)};">${d.pct}%</span>` : ''; })();
    tr.innerHTML = `
      <td class="fav" data-role="fav">${isFav ? '★' : '☆'}</td>
      <td class="rank mobhide">${g.id}</td>
      <td>${STATUSES[g.id] ? `<span class="status-dot ${STATUS_INFO[STATUSES[g.id]].dot}" title="${STATUS_INFO[STATUSES[g.id]].label}"></span>` : ''}${miniIcons(g)}${g.name}${dnaBadge}</td>
      <td class="plat mobhide">${g.plat}</td>
      <td class="year">${g.year || g.ysort || ''}</td>
      <td><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span></td>
      <td class="score">${g.score}</td>
      <td class="method" title="${methodLabel(g.m)}">${methodIcon(g.m)}</td>
      <td class="storyicon">${g.story ? '📖' : ''}</td>
    `;
    tr.querySelector('[data-role="fav"]').addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(FAVS.has(g.id)){ FAVS.delete(g.id); showToast('Rimosso dai preferiti'); }
      else { FAVS.add(g.id); showToast('Aggiunto ai preferiti'); }
      saveFavs(); renderMetrics(); render();
    });
    tr.addEventListener('click', ()=> openModal(g));
    frag.appendChild(tr);
  });
  tbody.innerHTML=''; tbody.appendChild(frag);
  updateArrows();
}

function updateArrows(){
  document.querySelectorAll('thead th').forEach(th=>{
    const arrow = th.querySelector('.arrow');
    if(!arrow) return;
    arrow.textContent = (th.dataset.key===state.sortKey) ? (state.sortDir===1 ? '▲' : '▼') : '';
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
  tab.addEventListener('click', ()=> setView(tab.dataset.view));
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

function renderMyTier(){
  const list = applyFilters();
  const grouped = {};
  TIERS_LIST.forEach(t=> grouped[t]=[]);
  list.forEach(g=>{
    const t = effectiveTier(g);
    if(!grouped[t]) grouped[t]=[];
    grouped[t].push(g);
  });
  const wrap = document.getElementById('myTierSections');
  wrap.innerHTML = '';
  TIERS_LIST.forEach(t=>{
    const games = grouped[t] || [];
    const section = document.createElement('div');
    section.className = 'mytier-section';
    section.innerHTML = `<div class="mytier-section-head"><span class="badge big ${TIER_LABEL[t]}">${t}</span><span class="count">${games.length} giochi</span></div>`;
    const dz = document.createElement('div');
    dz.className = 'mytier-dropzone';
    dz.dataset.tier = t;
    games.sort((a,b)=> b.score-a.score).forEach(g=>{
      const chip = document.createElement('div');
      chip.className = 'mytier-chip';
      chip.draggable = true;
      chip.innerHTML = `<span class="nm" title="${g.name}">${g.name}</span><span class="sc">${g.score}</span><button class="movebtn" aria-label="Sposta">⇅</button>`;
      chip.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', String(g.id)); });
      chip.querySelector('.nm').addEventListener('click', ()=> openModal(g));
      chip.querySelector('.movebtn').addEventListener('click', (e)=>{ e.stopPropagation(); openTierPicker(e.currentTarget, g.id); });
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
}
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
function miniIcons(g){
  const e = g.enrich; if(!e) return '';
  let out = '';
  if(e.storyTag && STORY_TAG_INFO[e.storyTag]) out += `<span class="mini-icon" title="${STORY_TAG_INFO[e.storyTag].label}">${STORY_TAG_INFO[e.storyTag].icon}</span>`;
  if(e.dopamine) out += `<span class="mini-icon" title="Loop di gioco molto coinvolgente">💉</span>`;
  return out;
}
// ---- Copertine: archivio interno della pagina (assets) + indice nel database (db, collezione "covers") ----
var USER_COVERS = {};      // id gioco -> url dell'immagine caricata
var USER_COVER_IDS = {};   // id gioco -> id asset (per sostituire senza lasciare file orfani)
var COVER_ASSETS = null, COVER_DB = null, currentModalGame = null, coverBusy = false;
var COVER_STATE = 'pending'; // 'pending' | 'ready' | 'unavailable'
function escHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
const ICON_PHOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M16 5h6"/><path d="M19 2v6"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
function coverSearchUrl(g){ return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(g.name + ' cover art boxart'); }
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
  const media = url ? `<img class="modal-cover" src="${escHtml(url)}" alt="Copertina di ${escHtml(g.name)}" loading="lazy" decoding="async">` : coverPlaceholderHtml(g);
  const currentUrlValue = (url && /^https?:\/\//i.test(url)) ? url : '';
  const uploadRow = canUpload ? `<div class="cover-tools">
      <label class="cover-pill${coverBusy?' busy':''}" data-cover-upload-label title="Scegli una foto dalla galleria del telefono">${ICON_PHOTO}<span>Carica dal telefono</span><input type="file" accept="image/*" data-cover-file-input ${coverBusy?'disabled':''}></label>
      <label class="cover-pill${coverBusy?' busy':''}" data-cover-camera-label title="Scatta una foto adesso con la fotocamera">📸<span>Scatta foto</span><input type="file" accept="image/*" capture="environment" data-cover-camera-input ${coverBusy?'disabled':''}></label>
    </div>` : '';
  const hint = !canUrl
    ? `<div class="cover-hint">Il salvataggio della copertina non è disponibile qui: apri questa pagina restando connesso al tuo account Claude (non da un link "pubblico" o da un altro browser senza accesso).</div>`
    : `<div class="cover-hint">${canUpload ? '<b>Consigliato:</b> usa "Carica dal telefono" o "Scatta foto" qui sopra — funziona sempre, anche se il tuo telefono non riesce a caricare immagini da internet.<br>' : ''}In alternativa, incolla un link diretto a un\'immagine qui sotto (su molti telefoni i link a foto esterne non si aprono: se il link non funziona, usa il caricamento qui sopra invece).</div>`;
  return `<div class="cover-block" id="coverBlock">${media}
    ${uploadRow}
    <div class="cover-tools">
      <a class="cover-pill" href="${coverSearchUrl(g)}" target="_blank" rel="noopener" title="Cerca la copertina su internet">${ICON_GLOBE}<span>Cerca copertina</span></a>
      <button class="cover-pill" type="button" data-cover-diag aria-expanded="${coverDiagOpen?'true':'false'}" title="Mostra la diagnostica">🩺</button>
    </div>
    ${canUrl ? `<div class="cover-urlrow">
      <input type="text" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Incolla qui il link dell'immagine (https://...)" value="${escHtml(currentUrlValue)}" data-cover-url-input ${coverBusy?'disabled':''}>
      <button class="btn primary" type="button" data-cover-url-save ${coverBusy?'disabled':''}>${coverBusy?'…':'Salva'}</button>
    </div>` : ''}
    ${hint}${coverDiagHtml()}</div>`;
}
function wireCover(g){
  const block = document.getElementById('coverBlock'); if(!block) return;
  const img = block.querySelector('img.modal-cover');
  if(img){
    img.addEventListener('error', ()=>{ img.outerHTML = coverPlaceholderHtml(g); }, {once:true});
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
function syncCustomGames(snap){
  const seen = new Set();
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
      tier: TIERS_LIST.includes(v.tier) ? v.tier : 'B',
      score: clampIntOrNull(v.score, 0, 100) != null ? clampIntOrNull(v.score, 0, 100) : 70,
      m: 'S',
      note: v.note ? String(v.note) : 'Aggiunto da te tramite "Chiedi a Claude" — non è nella classifica ufficiale, il voto è una stima.',
      story: v.story ? String(v.story) : '',
      tags: Array.isArray(v.tags) ? v.tags.filter(t=> TAG_INFO[t]) : [],
      custom: true,
      proscons: cleanProsCons(v.pros, v.cons),
      label: (v.label && typeof v.label === 'object') ? v.label : null
    };
    const idx = GAMES.findIndex(x=>x.id===id);
    if(idx>=0) GAMES[idx] = entry; else GAMES.push(entry);
    CUSTOM_GAME_IDS.add(id);
  });
  Array.from(CUSTOM_GAME_IDS).forEach(id=>{
    if(!seen.has(id)){
      const idx = GAMES.findIndex(x=>x.id===id);
      if(idx>=0) GAMES.splice(idx, 1);
      CUSTOM_GAME_IDS.delete(id);
    }
  });
  try{ renderMetrics(); renderStats(); render(); renderListBar(); }catch(e){}
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
  const save = (c, m)=>{ try{ localStorage.setItem(key(c), JSON.stringify(m)); }catch(e){} };
  const listeners = {};
  const snapOf = c=>{ const m = load(c); return {docs: Object.keys(m).map(id=>({id, data:()=>m[id]}))}; };
  const notify = c=>{ (listeners[c] || []).forEach(fn=>{ try{ fn(snapOf(c)); }catch(e){} }); };
  return {
    doc(path){
      const [c, id] = path.split('/');
      return {
        set(d){ const m = load(c); m[id] = d; save(c, m); notify(c); return Promise.resolve(); },
        delete(){ const m = load(c); delete m[id]; save(c, m); notify(c); return Promise.resolve(); }
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
  if(!e && g.custom && customProsConsHtml(g)) return customProsConsHtml(g);
  if(!e){
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
    <div class="modal-section-title">⏱️ Longevità</div>
    <div class="modal-note"><strong>${e.hoursMain}h</strong> storia principale · <strong>${e.hoursCompletionist}h</strong> completista.<br>${e.lengthVerdict}</div>
    <div class="modal-section-title">ℹ️ Dettagli</div>
    <div class="modal-note"><strong>Riedizioni:</strong> ${e.remaster}<br><strong>Lingua:</strong> ${e.language}</div>
  `;
}

// ---- Etichetta del gioco (stile valori nutrizionali) ----
const LABEL_PACE = {L:'Lento', M:'Medio', V:'Veloce'};
const LABEL_IT = {S:'✅ Sottotitoli ufficiali', F:'🌐 Solo fan-translation', N:'🇬🇧 Solo inglese/altro'};
const LABEL_STORE = {PS:'PlayStation', XB:'Xbox', NS:'Switch', PC:'PC', MOB:'Mobile'};
function labelBar(n, max){
  let out = '<span class="glabel-bar">';
  for(let i=1;i<=max;i++) out += `<i class="${i<=n?'on':''}"></i>`;
  return out + '</span>';
}
function labelHtml(g){
  const l = g.label;
  if(!l) return '';
  const costLabel = l.cost==='S' ? '€ (< 20)' : l.cost==='M' ? '€€ (20-40)' : l.cost==='H' ? '€€€ (> 40)' : '—';
  return `<div class="modal-section-title">🏷️ Etichetta del gioco</div>
  <div class="glabel">
    <div class="glabel-title">A colpo d'occhio</div>
    <div class="glabel-grid">
      <div class="glabel-row"><span>Difficoltà</span><span class="v">${labelBar(l.d,5)}</span></div>
      <div class="glabel-row"><span>Grinding</span><span class="v">${labelBar(l.g,5)}</span></div>
      <div class="glabel-row"><span>Peso storia</span><span class="v">${labelBar(l.s,5)}</span></div>
      <div class="glabel-row"><span>Ritmo</span><span class="v">${LABEL_PACE[l.p]||'—'}</span></div>
      <div class="glabel-row"><span>Ore (storia)</span><span class="v">${l.h!=null ? l.h+'h' : '—'}</span></div>
      <div class="glabel-row"><span>Italiano</span><span class="v">${l.it ? LABEL_IT[l.it] : '—'}</span></div>
    </div>
    ${l.ok ? `<div class="glabel-ok">🟢 <b>Fa per te se</b>${escHtml(l.ok)}</div>` : ''}
    ${l.ko ? `<div class="glabel-ko">🔴 <b>Lascia stare se</b>${escHtml(l.ko)}</div>` : ''}
    ${l.play ? `<div class="glabel-play">🎯 <b>Come giocarlo oggi:</b> ${escHtml(l.play)}</div>` : ''}
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
  return `<div class="modal-section-title">🛒 Prima di comprarlo</div>
  <div class="glabel">
    ${verdict}
    ${notes}
    <div class="glabel-play" style="margin-top:8px;">
      <a href="${priceUrl}" target="_blank" rel="noopener" style="color:var(--accent); font-weight:700; text-decoration:none;">💶 Controlla il prezzo di oggi</a>
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
  const reviewUrl = 'https://www.google.com/search?q=' + encodeURIComponent(g.name + ' recensione metacritic');
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
      <span class="badge big outline">${g.score}/100</span>
      <span class="badge big outline">${methodIcon(g.m)} ${g.m==='V' ? 'Verificato' : 'Stima'}</span>
    </div>
    <div class="modal-tags">${g.tags.map(t=> TAG_INFO[t] ? `<span class="tagpill">${TAG_INFO[t].icon} ${TAG_INFO[t].label}</span>` : '').join('')}</div>
    ${dnaHtml(g)}
    ${labelHtml(g)}
    ${marketHtml(g)}
    ${highlightsHtml(g)}
    ${sagaHtml(g)}
    <div class="modal-section-title">Il tuo stato</div>
    <div class="status-row" id="statusRow">
      ${Object.keys(STATUS_INFO).map(k=> `<button class="btn ${STATUSES[g.id]===k?'on':''}" data-status="${k}">${STATUS_INFO[k].icon} ${STATUS_INFO[k].label}</button>`).join('')}
    </div>
    <div class="modal-section-title">📖 La storia (senza spoiler)</div>
    ${storyHtml}
    ${g.note ? `<div class="modal-section-title">Nota</div><div class="modal-note">${g.note}</div>` : ''}
    ${castHtml(g)}
    ${enrichHtml(g)}
    ${soundtrackHtml(g)}
    ${similarGamesHtml(g)}
    <div class="modal-links">
      <a class="btn" href="${youtubeUrl}" target="_blank" rel="noopener">▶️ Gameplay ITA (YouTube)</a>
      <a class="btn" href="${reviewUrl}" target="_blank" rel="noopener">🔗 Recensioni</a>
      <a class="btn" href="${imagesUrl}" target="_blank" rel="noopener">🖼️ Immagini gameplay</a>
      <a class="btn" href="${soundtrackUrl}" target="_blank" rel="noopener">🎵 Colonna sonora (YouTube)</a>
    </div>
    <div class="modal-actions">
      <button class="btn" id="modalFavBtn">${isFav ? '★ Nei preferiti' : '☆ Aggiungi ai preferiti'}</button>
      <button class="btn" id="modalCompareBtn">${compareList.includes(g.id) ? '✓ Nel confronto' : '⚖️ Confronta'}</button>
      <button class="btn primary" id="modalCloseBtn2">Chiudi</button>
    </div>
  `;
  modalBackdrop.classList.add('show');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
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
          <span class="badge big outline">${g.score}/100</span>
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
function sagaHtml(g){
  const key = SAGA_MAP[g.id];
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
  const scored = GAMES.filter(x=>x.id!==g.id).map(x=>{
    let score = 0;
    const sharedTags = x.tags.filter(t=> g.tags.includes(t)).length;
    score += sharedTags;
    if(g.enrich && x.enrich && g.enrich.storyTag && x.enrich.storyTag===g.enrich.storyTag) score += 2;
    if(x.tier===g.tier) score += 0.5;
    return {x, score};
  }).filter(o=>o.score>0);
  scored.sort((a,b)=> b.score-a.score || b.x.score-a.x.score);
  return scored.slice(0,n).map(o=>o.x);
}
function similarGamesHtml(g){
  const sims = findSimilarGames(g, 4);
  if(!sims.length) return '';
  return `<div class="modal-section-title">🔁 Se ti è piaciuto questo, prova anche</div><div class="similar-games">${sims.map(s=>`<button class="similar-chip" data-id="${s.id}"><span class="badge ${TIER_LABEL[s.tier]}">${s.tier}</span>${s.name}</button>`).join('')}</div>`;
}

// ---- Vista "per saga" ----
function renderSagaView(){
  const panel = document.getElementById('sagaPanel');
  if(!panel) return;
  const list = applyFilters();
  const bySaga = {};
  list.forEach(g=>{
    const key = SAGA_MAP[g.id];
    if(!key) return;
    if(!bySaga[key]) bySaga[key]=[];
    bySaga[key].push(g);
  });
  const keys = Object.keys(bySaga).sort((a,b)=> bySaga[b].length - bySaga[a].length);
  if(keys.length===0){
    panel.innerHTML = '<div class="empty">Nessuna saga corrisponde ai filtri attuali (prova a rimuovere qualche filtro).</div>';
    return;
  }
  panel.innerHTML = `<div class="count-line" style="margin-bottom:10px;"><span>${keys.length} saghe multi-capitolo trovate (su ${list.length} giochi visibili)</span></div>` + keys.map(key=>{
    const info = SAGA_INFO[key];
    const games = bySaga[key].slice().sort((a,b)=> (a.ysort||0)-(b.ysort||0));
    return `<div class="saga-section">
      <div class="saga-section-head">
        <span class="saga-section-name">${info.name}</span>
        <span class="badge outline">${games.length} giochi</span>
        <span class="badge outline">${info.order}</span>
      </div>
      <div class="saga-section-note">${info.note}</div>
      <div class="saga-games-grid">${games.map(g=>`<button class="saga-game-chip" data-id="${g.id}"><span class="badge ${TIER_LABEL[g.tier]}">${g.tier}</span>${g.name}${g.year?` (${g.year})`:''}</button>`).join('')}</div>
    </div>`;
  }).join('');
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
        <span class="badge big outline">${g.score}/100</span>
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

// ---- Changelog "Novità del programma": cronologia visibile delle versioni per Mario ----
// Aggiungere una riga in cima ogni volta che pubblico un aggiornamento, così la crescita del
// programma si vede anche dentro l'app, non solo nei messaggi di chat.
const CHANGELOG = [
  {version:'v67', date:'2026-09-29', items:[
    'Nuovo: 🗂️ Classifiche per genere. Sopra le schede trovi la barra "🎮 JRPG / RPG" (la lista di sempre, con tutti i filtri) e, con ➕ Generi, puoi aggiungere una classifica per qualsiasi genere (Platform, Sparatutto, Strategia, Corse…) o toglierla quando vuoi. C\'è anche "🌐 Tutti".',
    'Quando aggiungi da Novità per genere un gioco di un genere non RPG, la sua classifica viene creata da sola.',
    'Copertine: il tasto per caricare/scattare la foto dal telefono torna disponibile anche sul sito GitHub (foto ridotte e sincronizzate con gli altri dati).',
    'Gemini: se il modello è sovraccarico riprova da solo e poi passa al modello più leggero, così Novità non si blocca più con l\'errore "high demand".'
  ]},
  {version:'v66', date:'2026-09-28', items:[
    'Nuovo: ☁️ Sincronizzazione automatica. In "Chiedi" → ⚙️ Impostazioni incolli un token GitHub (il link ti porta già al permesso giusto) e da quel momento preferiti, stati, tier list, abbonamenti, giochi aggiunti e locandine (link) si salvano da soli in un file privato del tuo GitHub e si ritrovano su ogni dispositivo.',
    'Gemini ora aggiunge i giochi con le stesse informazioni di Claude: voto, tier, generi, trama, ritmo, lingua, fa per te se / lascia stare se, e anche Pro e Contro nella scheda.',
    'Nelle schermate Novità c\'è la scelta del motore: Auto (Gemini solo se Claude ha raggiunto il limite), Solo Claude o Solo Gemini.',
    'Fuori da Claude (GitHub Pages) i giochi aggiunti e le locandine da link si salvano nel browser e poi si sincronizzano.'
  ]},
  {version:'v65', date:'2026-09-28', items:[
    'Nuovo: ✨ Gemini come alternativa a Claude. In "Chiedi a Claude" apri ⚙️ Motore AI, incolla la tua chiave gratuita di Google AI Studio e scegli: Automatico (Gemini prende il posto di Claude quando ha raggiunto il limite), solo Claude o solo Gemini.',
    'Vale anche per Novità e Novità per genere (con ricerca web di Gemini per titoli nuovi). Con una chiave Gemini le foto di copertine si possono inviare anche dal browser del telefono. Il controllo doppioni resta attivo con entrambi i motori.',
    'La chiave resta salvata solo nel tuo browser e non entra mai nel codice.',
    'Nella pagina Claude le connessioni esterne sono bloccate: per usare Gemini apri la versione su GitHub Pages. Lì i giochi aggiunti si salvano nel browser del dispositivo.'
  ]},
  {version:'v64', date:'2026-09-28', items:[
    'Nuovo: ⚠️ controllo doppioni molto più intelligente. Se chiedi a Claude di aggiungere un gioco che hai già (anche scritto in modo diverso: maiuscole, accenti, parentesi, "The"), compare un avviso giallo ben visibile "Il gioco è già nel tuo database!" con il tasto per aprire la scheda, e il gioco NON viene aggiunto.',
    'Dietro le quinte: il progetto è stato diviso in file separati (pagina, stile, logica, dati) per aggiornarlo più facilmente. Nessuna funzione è cambiata o rimossa.',
    'Foto in "Chiedi a Claude": i tasti 📷 (galleria) e 📸 (fotocamera) ora sono sempre visibili. Se la tua vista non accetta le foto ti verrà detto e potrai scrivere il nome del gioco: il controllo doppioni funziona comunque.'
  ]},
  {version:'v63', date:'2026-09-28', items:[
    'Nuovo: 👤 Profili utente! Ora c\'è il tuo profilo "Mario" e puoi aggiungere profili Ospite (rinominabili) — ognuno ha i propri preferiti, stati, tier list personale, abbonamenti e scelte su Novità, completamente separati. Utile se condividi il telefono/tablet con qualcun altro.',
    'I tuoi dati esistenti non sono stati toccati: il profilo Mario continua a usare esattamente gli stessi dati di sempre.'
  ]},
  {version:'v62', date:'2026-09-28', items:[
    '"💾 Esporta i miei dati" ora include anche abbonamenti e lista Scartati di Novità, non solo preferiti/stati/tier list — un backup completo in un unico file.'
  ]},
  {version:'v61', date:'2026-09-28', items:[
    'Nuovo: tasto 🩺 "Verifica qualità dati" (nei Filtri) — controlla doppioni, schede incomplete e voci "Scartati" ormai obsolete. È un controllo locale: NON usa Claude e non consuma nulla dei tuoi limiti d\'uso.'
  ]},
  {version:'v60', date:'2026-09-28', items:[
    'Ricerca più fluida da tastiera: la lista si aggiorna appena smetti di digitare, invece che a ogni singolo tasto (utile su telefoni più lenti, e il database continuerà a crescere).',
    'Piccola ottimizzazione nel caricamento delle copertine (scheda gioco e Scopri).'
  ]},
  {version:'v59', date:'2026-09-28', items:[
    'Nuovo: questa sezione "Novità del programma" (🆕 in alto) con la cronologia degli aggiornamenti, così vedi la crescita del progetto passo dopo passo.'
  ]},
  {version:'v58', date:'2026-09-28', items:[
    'Schede di navigazione (Classifica, Scopri, Novità...) più piccole e a scorrimento orizzontale, per lasciare più spazio alla lista sotto.'
  ]},
  {version:'v57', date:'2026-09-28', items:[
    '"Novità per genere" ora copre TUTTI i generi videoludici (sport, corse, sparatutto, strategia, puzzle, arcade e molti altri), non solo sottogeneri RPG.',
    'Selezione a bandierine: tutti i generi partono attivi, togli la spunta a quelli che non vuoi vedere.'
  ]},
  {version:'v56', date:'2026-09-27', items:[
    'In "Novità" aggiunto il link diretto alle recensioni italiane di ogni gioco proposto.',
    'Più proposte per ogni ricerca di nuovi titoli.',
    'I giochi scartati in "Novità" ora restano salvati e revisionabili in qualsiasi momento (non si ripropongono più per sbaglio, ma puoi sempre ripescarli).',
    'Aggiunta la nuova scheda "Novità per genere", separata da "Novità", per non mischiare le proposte basate sui tuoi gusti con quelle per genere scelto a mano.'
  ]},
  {version:'v55', date:'2026-09-27', items:[
    'Caricamento copertine dal telefono (galleria) e scatto foto diretto dalla fotocamera, per aggirare i blocchi di caricamento immagini esterne dentro le chat.'
  ]},
  {version:'v54', date:'2026-09-27', items:[
    'Aggiunto un autotest per capire se un problema di copertine è del singolo link o generale del dispositivo/pagina.'
  ]},
  {version:'v53', date:'2026-09-27', items:[
    'Il salvataggio di un link-copertina ora verifica davvero che l\'immagine si carichi prima di dire "salvato", per evitare falsi successi.'
  ]}
];
const changelogBackdrop = document.getElementById('changelogBackdrop');
const changelogCard = document.getElementById('changelogCard');
function openChangelog(){
  changelogCard.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">🆕 Novità del programma</div>
      <button class="modal-close" id="changelogCloseBtn" aria-label="Chiudi">✕</button>
    </div>
    <div class="modal-note">Cronologia degli ultimi aggiornamenti, dal più recente.</div>
    <div class="changelog-list">${CHANGELOG.map(e=> `
      <div class="changelog-entry">
        <div class="changelog-entry-head"><span class="changelog-version">${escHtml(e.version)}</span><span class="changelog-date">${escHtml(e.date)}</span></div>
        <ul class="changelog-items">${e.items.map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>
      </div>`).join('')}</div>
  `;
  document.getElementById('changelogCloseBtn').addEventListener('click', closeChangelog);
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
      ['jrpg_favs','jrpg_status','jrpg_mytier','jrpg_my_subs','jrpg_discover_skipped','jrpg_novita_skipped','jrpg_novita_skipped_details','jrpg_novita_genre_selected','jrpg_novita_genre_other'].forEach(k=>{
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
try{ const s = localStorage.getItem('jrpg_ask_requests'); if(s) ASK_LOG_LOCAL = JSON.parse(s); }catch(e){ ASK_LOG_LOCAL = []; }
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
    try{ localStorage.setItem('jrpg_ask_requests', JSON.stringify(ASK_LOG_LOCAL)); }catch(e){}
  }
  showToast(`📝 Segnato "${name}" da aggiungere al database`);
  return {logged: true, name};
}
// ---- Anti-doppione: confronto nomi ignorando maiuscole, accenti, punteggiatura e parentesi ----
function normGameName(n){
  return String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\([^)]*\)/g,' ').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\bthe\b/g,' ').replace(/\s+/g,' ').trim();
}
function findDuplicateGame(name){
  const n = normGameName(name);
  if(!n) return null;
  return GAMES.find(g=> normGameName(g.name) === n) || null;
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
    it: ['S','F','N'].includes(input.italian) ? input.italian : null,
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
    addedAt: new Date().toISOString()
  };
  try{ COVER_DB.doc('customGames/' + String(id)).set(doc).catch(()=>{}); }catch(e){}
  ensureGenreLists(tags);
  showToast(`✨ ${name} aggiunto alla tua libreria!`);
  return {id, name, added: true, resultNote: 'Salvato nel database di Mario: comparirà nella classifica su ogni suo dispositivo.'};
}
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
        italian: {type:'string', enum:['S','F','N'], description:'lingua italiana: S=sottotitoli ufficiali, F=solo fan-translation, N=solo inglese/altro'},
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
function askInstructions(){
  return `Sei l'assistente integrato nel database personale di giochi RPG/JRPG di Mario (${GAMES.length} giochi catalogati con voti, tag, "etichetta" stile valori nutrizionali, compatibilità DNA con i suoi gusti, e dove trovarli in abbonamento oggi). Rispondi sempre in italiano, in modo breve e colloquiale, come in una chat — evita elenchi puntati lunghi se non richiesti esplicitamente.
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
    const result = await askLLM(askHistory, opts, {system: askInstructions()});
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
const NOVITA_BATCH_COUNT = 10;
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
let novitaGenreIncludeOther = true;
function loadNovitaGenreOther(){
  novitaGenreIncludeOther = true;
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
function novitaReviewSearchUrl(name){ return 'https://www.google.com/search?q=' + encodeURIComponent(name + ' recensione ITA'); }
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
  return `Suggerisci ${count} RPG/JRPG (di qualunque epoca e piattaforma, anche poco conosciuti) che NON sono in questo elenco di giochi che Mario ha già nel suo database o ha già rifiutato (non riproporli, nemmeno con nome leggermente diverso): ${novitaExcludeListText(excludeNames)}.
Gusti di Mario: ${novitaTasteSummaryText()}
Rispondi SOLO con un array JSON valido (nessun testo prima o dopo, nessun blocco di codice), con esattamente ${count} oggetti, ognuno con questi campi:
name (titolo esatto e corretto), plat (piattaforme, es "PS5 / PC"), year (anno di uscita), tier (una tua stima onesta tra S+, S, A, B, C, D, E, F), score (voto 0-100 coerente col tier), tags (1-3 valori tra questi codici: ${NOVITA_TAG_ENUM.join(',')}), story (1-2 frasi di trama senza spoiler pesanti), hours (ore indicative per finire la storia, numero), difficulty (1-5), pace ("L","M" o "V"), italian ("S"=sottotitoli ufficiali,"F"=fan-translation,"N"=solo inglese/altro), cost ("S","M" o "H"), fitIf (perché potrebbe piacere A MARIO IN PARTICOLARE, in una frase, basandoti sui suoi gusti sopra), avoidIf (una frase su chi dovrebbe evitarlo), pros (array di 3-4 punti di forza concreti, frasi brevi), cons (array di 2-3 difetti concreti, frasi brevi).
Scegli titoli realmente esistenti, con dati il più possibile accurati. Varia epoche/piattaforme tra le ${count} proposte.`;
}
function buildNovitaGenrePrompt(count, excludeNames, selectedTags, includeOther){
  const labels = selectedTags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t);
  const scopeLine = labels.length
    ? `Suggerisci SOLO videogiochi che rientrano in almeno uno di questi generi/stili: ${labels.join(', ')}.${includeOther ? ' Includi anche giochi molto simili a questi generi anche se non ci rientrano perfettamente, o stili affini non elencati qui.' : ' Scarta tutto ciò che non rientra chiaramente in questi generi.'} IMPORTANTE: NON limitarti agli RPG — se un genere qui sopra non è un gioco di ruolo (es. sport, corse, sparatutto, strategia, puzzle...), proponi comunque giochi di QUEL genere anche se non hanno alcun elemento da RPG.`
    : `Includi videogiochi di QUALSIASI genere possibile (non solo RPG), di ogni tipo, epoca e piattaforma: varia il più possibile tra i ${count} suggerimenti.`;
  return `Suggerisci ${count} videogiochi (di qualunque genere, epoca e piattaforma, anche poco conosciuti — NON limitarti a RPG/JRPG) che NON sono in questo elenco di giochi che Mario ha già nel suo database o ha già rifiutato (non riproporli, nemmeno con nome leggermente diverso): ${novitaExcludeListText(excludeNames)}.
${scopeLine}
Non scartare un gioco valido solo perché non rientra esattamente nei codici di genere che uso per le etichette (${NOVITA_GENRE_ALL_CODES.join(',')}): includilo comunque e assegna i tag più vicini possibile, oppure lascia l'elenco tags vuoto se nessuno si adatta bene — la categorizzazione delle etichette non deve mai essere un motivo per escludere un gioco valido.
Contesto sui gusti abituali di Mario, soprattutto orientati a RPG/JRPG (utile SOLO per spiegare perché un titolo potrebbe piacergli comunque, MAI per restringere la ricerca al genere RPG, che qui è solo una delle tante opzioni possibili): ${novitaTasteSummaryText()}
Rispondi SOLO con un array JSON valido (nessun testo prima o dopo, nessun blocco di codice), con esattamente ${count} oggetti, ognuno con questi campi:
name (titolo esatto e corretto), plat (piattaforme, es "PS5 / PC"), year (anno di uscita), tier (una tua stima onesta tra S+, S, A, B, C, D, E, F), score (voto 0-100 coerente col tier), tags (0-3 valori tra questi codici: ${NOVITA_GENRE_ALL_CODES.join(',')}, oppure elenco vuoto se nessuno si adatta), story (1-2 frasi che descrivono il gioco/la sua premessa, senza spoiler pesanti), hours (ore indicative per finirlo, numero), difficulty (1-5), pace ("L","M" o "V"), italian ("S"=sottotitoli/doppiaggio ufficiale in italiano,"F"=fan-translation,"N"=solo inglese/altro), cost ("S","M" o "H"), fitIf (perché potrebbe piacere a Mario, in una frase), avoidIf (una frase su chi dovrebbe evitarlo), pros (array di 3-4 punti di forza concreti, frasi brevi), cons (array di 2-3 difetti concreti, frasi brevi).
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
    tags: Array.isArray(raw.tags) ? raw.tags.filter(t=> enumList.includes(t)) : [],
    story: raw.story ? String(raw.story) : '',
    hours: raw.hours!=null ? Number(raw.hours) : null,
    difficulty: clampIntOrNull(raw.difficulty, 1, 5),
    pace: ['L','M','V'].includes(raw.pace) ? raw.pace : null,
    italian: ['S','F','N'].includes(raw.italian) ? raw.italian : null,
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
    if(known.has(k) || seenBatch.has(k)) return false;
    seenBatch.add(k);
    return true;
  });
}
async function fetchNovitaBatch(){
  if(novitaLoading) return;
  if(!llmAvailable()){ novitaErrorMsg = 'Questa funzione non è disponibile in questa visualizzazione.'; renderNovitaCard(); return; }
  novitaLoading = true; novitaErrorMsg = null; renderNovitaCard();
  const excludeNames = novitaKnownNames();
  try{
    // Stessa richiesta di "Novità per genere" (che funziona meglio con Gemini), limitata ai generi RPG/JRPG
    const prompt = buildNovitaGenrePrompt(NOVITA_BATCH_COUNT, excludeNames, TAG_ORDER.slice(), false);
    const result = await askLLM(prompt, {}, {search:true});
    const arr = parseNovitaJson(result && result.text);
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
    const prompt = buildNovitaGenrePrompt(NOVITA_BATCH_COUNT, excludeNames, selectedTags, novitaGenreIncludeOther);
    const result = await askLLM(prompt, {}, {search:true});
    const arr = parseNovitaJson(result && result.text);
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
function currentNovitaGame(){ return novitaQueue[novitaIdx] || null; }
function currentNovitaGenreGame(){ return novitaGenreQueue[novitaGenreIdx] || null; }
function novitaCardHtml(c){
  return `<div class="discover-card" id="novitaCard">
    <div class="novita-badge-new">Non nel tuo database</div>
    <div class="discover-cover"><div class="discover-cover-placeholder"><span class="pc-plat">${escHtml((c.plat||'').split('/')[0].trim())}</span><span class="pc-tier ${TIER_LABEL[c.tier]}">${c.tier}</span></div></div>
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
function renderNovitaView(){ renderNovitaCard(); }
function renderNovitaCard(){
  const panel = document.getElementById('novitaPanel');
  if(!panel) return;
  if(!llmAvailable()){
    panel.innerHTML = `<div class="novita-intro"><div class="novita-intro-icon">🆕</div><div>Questa funzione non è disponibile in questa visualizzazione (serve restare connessi al tuo account Claude, non da un link "pubblico").</div></div>`;
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
  return `<div class="novita-genre-picker">
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
    panel.innerHTML = `<div class="novita-intro"><div class="novita-intro-icon">🎭</div><div>Questa funzione non è disponibile in questa visualizzazione (serve restare connessi al tuo account Claude, non da un link "pubblico").</div></div>`;
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
const DATA_BUILD_VERSION = 'v67';
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
