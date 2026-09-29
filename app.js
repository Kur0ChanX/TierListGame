// Nucleo: dati, profili, liste per genere, classifica, filtri, La mia Tier List, scheda gioco. Seguono app-schede.js, app-utente.js, app-ai.js (stesso ambiente globale).
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
  ACTADV:{icon:'🦸', label:'Avventura d\'azione'},
  OPENW:{icon:'🌍', label:'Open world'},
  MMO:{icon:'🌐', label:'MMO / online persistente'},
  SIMVEH:{icon:'✈️', label:'Simulatori (volo/veicoli)'},
  TRIVIA:{icon:'❓', label:'Quiz / trivia'},
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
  {title:'Azione e avventura', codes:['PLAT','BEAT','FIGHT','STEALTH','ADV','ACTADV','OPENW','WALK']},
  {title:'Sparatutto e battle', codes:['FPS','TPS','SHMUP','BR']},
  {title:'Sport e corse', codes:['SPORT','RACE','SIMVEH']},
  {title:'Strategia e gestionale', codes:['RTS','TBS4X','MOBA','CITY','TOWERDEF','ECOSIM']},
  {title:'Puzzle e party', codes:['PUZ','PARTY','RHY','BOARDG','TRIVIA']},
  {title:'Sandbox e simulazione', codes:['SAND','SIMLIFE']},
  {title:'Arcade e altro', codes:['ARCADE','IDLE','RUN','COOP','MMO']}
];
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
  if(ACTIVE_LIST === 'jrpg') return !tags.some(t=> EXTRA_GENRE_INFO[t]);
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
  el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>Le tue classifiche per genere</b><button class="btn" data-lp-close>Fatto</button></div><div class="lp-sub">Tocca un genere per aggiungerlo o toglierlo dalla barra. La classifica JRPG / RPG resta sempre disponibile.</div><div class="lp-tools"><button class="btn" data-lp-all>➕ Aggiungi tutti i generi che hanno giochi</button><button class="btn" data-lp-none>Togli tutti</button></div>${body}</div>`;
  el.querySelector('[data-lp-all]').addEventListener('click', ()=>{
    NOVITA_GENRE_ALL_CODES.forEach(c=>{ if(!MY_LISTS.includes(c) && listCount(c) > 0) MY_LISTS.push(c); });
    saveLists(); openListPicker();
  });
  el.querySelector('[data-lp-none]').addEventListener('click', ()=>{ MY_LISTS = []; ACTIVE_LIST = 'jrpg'; saveLists(); openListPicker(); });
  el.querySelectorAll('[data-lp]').forEach(b=> b.addEventListener('click', ()=>{
    const c = b.dataset.lp, i = MY_LISTS.indexOf(c);
    if(i >= 0){ MY_LISTS.splice(i, 1); if(ACTIVE_LIST === c) ACTIVE_LIST = 'jrpg'; } else MY_LISTS.push(c);
    saveLists(); openListPicker();
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

function methodIcon(m){ return m==='V' ? '✅' : '🗳️'; }
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
    return tr;
  }
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
