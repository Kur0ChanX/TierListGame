// Utente: changelog, cambio profilo, export/import, verifica qualità dati. Caricato dopo gli altri file app*.js nell'ordine: app, app-schede, app-utente, app-ai.
// ---- Changelog "Novità del programma": cronologia visibile delle versioni per Mario ----
// Aggiungere una riga in cima ogni volta che pubblico un aggiornamento, così la crescita del
// programma si vede anche dentro l'app, non solo nei messaggi di chat.
const CHANGELOG = [
  {version:'v112', date:'2026-09-29', items:[
    'Copertine automatiche vere: nella scheda di un gioco senza copertina c\'è "✨ Trova copertina", e di base la cerca da sola all\'apertura (si spegne dal menu ✨). Fonti aperte, senza chiavi né CAPTCHA: Wikidata (nome inglese e ID Steam), Steam (copertine verticali dei giochi PC), Libretro/RetroArch (box art originali di PS1, PS2, PSP, SNES, N64, Game Boy, DS, GameCube, Wii, Sega, PC Engine, Xbox) e Wikipedia.',
    'Anche "Copertine automatiche" per tutta la collezione ora usa le stesse fonti. Nella griglia le box art grandi sono mostrate ridotte, per restare leggere.'
  ]},
  {version:'v111', date:'2026-09-29', items:[
    'Scorrimento fluido: trovata la causa degli scatti (il vetro sfocato ricalcolato a ogni fotogramma sopra lo sfondo animato). Ora di base è spento: nel test lista e scheda gioco passano da 32 e 16 fotogrammi al secondo a 60 (il massimo che la prova permette). I colori sono gli stessi; dal menu ✨ si può riaccendere "Vetro sfocato e sfondo animato".',
    'Il completamento dei giochi aggiunti ora è un lavoro una tantum e silenzioso: niente più barra di caricamento a ogni avvio; una scheda completata non si rifà mai.',
    'Toccando un simbolo (💕 🤝 ✨ 💉) accanto al nome di un gioco si legge il perché ce l\'ha.'
  ]},
  {version:'v110', date:'2026-09-29', items:[
    'Ricerche AI più veloci: Novità e Novità per genere ora lanciano due ricerche insieme (classici e moderni) con meno "ragionamento interno": attesa circa dimezzata, stesse fonti e stessa qualità, più varietà.',
    'Barra di caricamento più onesta: la percentuale si calibra sui tempi reali delle ricerche precedenti e sale davvero quando una delle due ricerche finisce; se ci mette più del solito non resta ferma al 95%, ma mostra i secondi e "sto ancora aspettando".',
    'Tolto il bidone fisso in fondo alla schermata principale: resta solo quello della barra di caricamento.'
  ]},
  {version:'v109', date:'2026-09-29', items:[
    'I giochi aggiunti (da Novità, Novità per genere o Chiedi) ora hanno gli stessi simboli e dettagli dei giochi di base: 💕 storia romantica, 🤝 legame speciale, ✨ storia sorprendente, 💉 loop coinvolgente (dopamina) con il suo pannello, voto nel tempo, gameplay, perché potrebbe piacerti, longevità e lingua.',
    'Completamento automatico: all\'aggiunta e a ogni avvio (fino a 12 giochi) l\'app completa da sola le schede che ne sono prive; dal menu ✨ "Completa le schede dei giochi aggiunti" le completa tutte con la barra di avanzamento.'
  ]},
  {version:'v108', date:'2026-09-29', items:[
    'Barra di caricamento stile JRPG: quando cerchi con l\'AI (Novità, Chiedi, Aggiorna info, voce, wishlist) compare una finestra blu con il bidone Frugu Frugu che fruga (GIF ad alta risoluzione) e la barra dei punti con la percentuale. Con le copertine automatiche e la verifica dei generi la percentuale è reale; con le richieste all\'AI è stimata (~).'
  ]},
  {version:'v107', date:'2026-09-29', items:[
    'Nuovo logo (Frugu Frugu Raccoon Tier) in alto a sinistra, con più respiro: i pulsanti Schermo, Profilo, Novità, Tema e Filtri sono spostati a destra e non lo toccano.'
  ]},
  {version:'v106', date:'2026-09-29', items:[
    'Icone in alto un po\' più in basso (lontane dal foro della fotocamera) e staccate dal logo del procione.'
  ]},
  {version:'v105', date:'2026-09-29', items:[
    'Pulsanti più piccoli e tondi, in vetro trasparente con riflesso 3D: Profilo (distintivo), Novità (gemma), Tema (sfera giorno/notte), Filtri (cursori), Schermo. Icone nuove, moderne e a tema videogioco, con sfumature e riflessi (niente più icone retro o piatte). Stesso stile per le 7 schede in basso, il pulsante Chiedi, la freccia su e il microfono.',
    'Backup: nel menu ✨ c\'è "Versione di sicurezza (Aurora)", la copia congelata del sito com\'era prima delle palette; funziona sempre, anche se qualcosa del nuovo tema non va.'
  ]},
  {version:'v104', date:'2026-09-29', items:[
    'Pulsanti in alto (Profilo, Novità, Tema, Filtri, Schermo) rifatti come contenitori di vetro cristallino con bordo speculare di luce e icone 3D a tema gaming: Memory Card, Gemma, Joystick, Slider, TV retrò. Anche le 7 schede in basso e il microfono hanno icone 3D (Fluent Emoji, licenza MIT).',
    'Corretto: dopo un aggiornamento il telefono poteva mescolare una pagina vecchia con script nuovi (tessere viola senza icone, doppia lente nella ricerca). Ora, se le versioni non coincidono, la pagina si ricarica da sola una volta.'
  ]},
  {version:'v103', date:'2026-09-29', items:[
    'Interfaccia in stile Apple: nuove icone vettoriali (Profilo, Novità, Tema, Filtri, Schermo, viste, ricerca, microfono e le 7 schede) su tessere "squircle" con curvatura continua, come le app iOS; la scheda attiva nella barra in basso è una tessera colorata.',
    'Riflessi rifatti: un solo filo di luce sul bordo, schiarita morbida dall\'alto e ombre ampie e sfumate, al posto delle fasce lucide. Sfondo con sfumature senza bande e grana finissima. Palette predefinita: Apple.',
    'Nuova icona dell\'app (installazione/Home) in stile Apple: squircle in vetro con il procione.'
  ]},
  {version:'v102', date:'2026-09-29', items:[
    'Palette rifatte in stile "Liquid Glass": sfondo con i colori del tema sfumati, superfici in vetro con riflesso sul bordo, pulsanti lucidi con luce dall\'alto e bagliore colorato. Ora il colore del tema tinge anche sfondo, tabella, schede, filtri, barra in basso, titoli e barre del voto.'
  ]},
  {version:'v101', date:'2026-09-29', items:[
    'Palette più professionali: colori pieni con una sfumatura appena percettibile (niente più arcobaleni a 3 colori), intestazione della tabella neutra, ombre morbide, sfondo più discreto. Nel selettore ogni palette ha un\'anteprima dell\'app invece delle sfere lucide. La palette Aurora originale resta com\'era.'
  ]},
  {version:'v100', date:'2026-09-29', items:[
    '🎨 Palette colori (menu ✨): 34 temi preimpostati in 5 gruppi (Originali, Eleganti, Vivaci, Natura, Gaming), ognuno con sfumature, trasparenze, bagliori e sfondo aurora coordinati, per tema chiaro e scuro.',
    'Corretto: con i Filtri aperti la lista restava bloccata e non si scorreva fino in fondo; ora si scorre tutta.',
    'Corretta una riga in cima alla pagina (arrivata col file originale) che spostava l\'intestazione nel corpo della pagina.'
  ]},
  {version:'v99', date:'2026-09-29', items:[
    'Tre viste della classifica, a scelta (pulsanti ☰ ▦ ▤ accanto al conteggio): Tabella, Copertine (griglia stile libreria) e Schede.',
    'Copertine automatiche (menu ✨): cerca su Wikipedia la copertina di tutti i giochi che non ce l\'hanno, a gruppi di 50 per non appesantire.',
    'Ricerca a voce 🎤: dici "JRPG a turni sotto le 40 ore in italiano" e l\'AI imposta i filtri giusti.',
    'Wishlist 🎁 nella scheda di ogni gioco: controlla la data di uscita e ti avvisa quando esce (all\'apertura dell\'app, con notifica se la attivi).',
    'Condividi la tua tier list come immagine, traguardi 🏆 e colori della scheda presi dalla copertina (attivabile dal menu ✨).'
  ]},
  {version:'v98', date:'2026-09-29', items:[
    'Intestazione più chiara: i pulsanti in alto hanno il nome (Profilo, Novità, Tema, Filtri) e Filtri mostra quanti filtri sono attivi.',
    'Filtri più semplici: in cima i filtri rapidi (Preferiti, Giocati, In corso, Da giocare, 90+, Con storia, Azzera); generi, umore, strumenti, numeri e link sono in riquadri che si aprono a richiesta.',
    'Ricerca intelligente: ignora spazi e simboli ("persona5" trova Persona 5) e tollera gli errori di battitura ("persna", "final fantsy x"); quando non c\'è un nome esatto mostra i più simili e lo dice.'
  ]},
  {version:'v97', date:'2026-09-29', items:[
    'Nuovo look da app: sul telefono le schede (Classifica, Scopri, Novità, Per genere, Mia tier, Saghe, Statistiche) sono in una barra fissa in basso, sempre a portata di pollice.',
    'Corretto: in Statistiche e Saghe il contenuto copriva le schede in alto; ora ogni vista scorre al suo interno come la classifica.',
    'Scheda gioco più ordinata: i pulsanti della copertina stanno su una riga, link e spiegazioni in un riquadro che si apre a richiesta.',
    'Da computer: premi "/" per cercare e i tasti 1-7 per cambiare vista.'
  ]},
  {version:'v96', date:'2026-09-29', items:[
    'Novità per genere: in cima c\'è la scelta della console, tutte in ordine di uscita (dall\'Atari 2600 alla Switch 2, poi PC e Mobile). Nessuna scelta = qualsiasi console, di ogni epoca. La scelta resta salvata.'
  ]},
  {version:'v95', date:'2026-09-29', items:[
    'Generi: trovata la causa degli errori (l\'AI riceveva i codici dei generi senza spiegazione e leggeva ADV come "avventura qualsiasi": Elden Ring, Portal, Stardew finivano in Avventura punta e clicca). Ora riceve significato ed esempi per ogni genere, con una regola di sicurezza. La "Verifica generi online" propone anche di TOGLIERE i tag Avventura non confermati da Wikidata.',
    'Novità per genere: nuovi generi (Avventura d\'azione, Open world, MMO, Simulatori, Quiz) e 16 proposte per ricerca invece di 10. Anche lingua italiana con doppiaggio (D) nelle proposte.'
  ]},
  {version:'v94', date:'2026-09-29', items:[
    'Novità: le proposte che sono già nel tuo database (aggiunte dopo il caricamento, da un altro dispositivo o con un nome leggermente diverso, es. "Disco Elysium" / "Disco Elysium - The Final Cut") vengono saltate e non compaiono più come "Non nel tuo database". Il riquadro verde "Aggiunto alla tua libreria" è più in alto.'
  ]},
  {version:'v93', date:'2026-09-29', items:[
    'Apertura molto più veloce: la classifica disegna 80 righe subito e le altre man mano che scorri (prima le disegnava tutte 753). Nessun dato o funzione cambiato.'
  ]},
  {version:'v92', date:'2026-09-29', items:[
    'Sotto il cofano: il programma è stato diviso in file più piccoli per argomento (nessuna funzione cambiata). Serve a rendere le prossime modifiche più veloci e leggere.'
  ]},
  {version:'v91', date:'2026-09-29', items:[
    '"Aggiorna info" consulta altre fonti per la lingua italiana: Steam (interfaccia, audio, sottotitoli) e PCGamingWiki, oltre a it.wikipedia. Propone il cambio solo con prova positiva e mostra il link alla fonte; se una fonte non risponde lo dice. Nessuna ricerca in massa: solo sul gioco che apri.'
  ]},
  {version:'v90', date:'2026-09-29', items:[
    'Aggiornamenti subito visibili sul sito: il browser non tiene più in cache la vecchia versione (prima poteva restare fino a 10 minuti). Dopo questa versione basta riaprire il sito.'
  ]},
  {version:'v89', date:'2026-09-29', items:[
    'Apertura: la scritta Frugu Frugu ora resta ferma (niente effetto fantasma) e cambia colore scorrendo tutto l\'arcobaleno.'
  ]},
  {version:'v88', date:'2026-09-29', items:[
    'Frugu Frugu più piccolo e sempre centrato in basso: compare solo se sotto la lista c\'è spazio libero, senza cambiare la lunghezza della lista né coprire nulla.'
  ]},
  {version:'v87', date:'2026-09-29', items:[
    'Il tocco su "Entra" non finisce più sul gioco sotto. Schermo intero di default (al tocco, si spegne da ⚙️). Il bidone Frugu Frugu è ora grande in fondo alla pagina, al centro, senza coprire nulla.'
  ]},
  {version:'v86', date:'2026-09-29', items:[
    '"Aggiorna info" ora controlla direttamente it.wikipedia: se la voce elenca i doppiatori italiani propone "testi e doppiaggio in italiano" con il link come prova (senza AI). The Legend of Dragoon: fonte aggiunta.'
  ]},
  {version:'v85', date:'2026-09-29', items:[
    'Apertura più corta (2 secondi) e visibile subito: la scritta Frugu Frugu pulsa e dondola, stelline che brillano e coriandoli che cadono. Un tocco su "Entra" apre il programma a schermo intero (dove il browser lo permette).'
  ]},
  {version:'v84', date:'2026-09-29', items:[
    'Lingua italiana: "Aggiorna info" ora distingue testi e doppiaggio (nuova voce 🎙️), controlla l\'edizione europea/italiana dei giochi vecchi e non scrive più "solo inglese" quando non trova fonti. Se la ricerca contraddice il dato attuale, la correzione resta spenta con un avviso. Corretto The Legend of Dragoon (testi e doppiaggio in italiano).'
  ]},
  {version:'v83', date:'2026-09-29', items:[
    'Apertura più fluida: il poster resta fermo (niente effetto fantasma sul procione), si animano solo la scritta Frugu Frugu (alone e riflesso) e le stelline luminose.'
  ]},
  {version:'v82', date:'2026-09-29', items:[
    'Apertura animata all\'avvio con il poster Tier List Game / Frugu Frugu (zoom, coriandoli al neon, barra di caricamento). Tocca per entrare; si può spegnere dalle impostazioni ⚙️.'
  ]},
  {version:'v81', date:'2026-09-29', items:[
    'Accanto al logo Raccoon Tier c\'è ora il bidone animato "Frugu Frugu" con le zampe che frugano (si ferma se hai "riduci animazioni" attivo).'
  ]},
  {version:'v80', date:'2026-09-29', items:[
    'Il tasto "Aggiorna info" diventa verde con "✅ Info aggiornate il [data]" dopo il controllo di un gioco, così sai quali hai già verificato. Puoi rifarlo quando vuoi.'
  ]},
  {version:'v79', date:'2026-09-29', items:[
    'Il tasto "📰 Recensioni ITA" (accanto a Gameplay ITA) ora cerca solo su siti italiani (Multiplayer.it, Everyeye, SpazioGames, GamesVillage, TechGaming e altri).',
    'Aggiorna info: la ricerca Gemini ora sa che giorno è, cerca includendo gli ultimi anni, ignora pagine vecchie per ciò che cambia nel tempo (edizioni, lingue, piattaforme, ore) e giudica la grafica rispetto agli standard di oggi. I dati basati su fonti datate compaiono con ⏳ e deselezionati.'
  ]},
  {version:'v78', date:'2026-09-29', items:[
    'Aggiorna info ora controlla anche: ore di gioco (storia e completista), "A colpo d\'occhio" (difficoltà, grinding, peso storia, ritmo, lingua italiana, a chi piace / chi evita), gameplay, lingue ed edizioni. Usa Gemini con la ricerca Google (serve la chiave) e mostra le fonti consultate; ogni dato che non trova resta com\'è.'
  ]},
  {version:'v77', date:'2026-09-29', items:[
    'Nuovo: 🔄 Aggiorna info, in ogni scheda di gioco. Controlla il gioco su Wikipedia e Wikidata (voto Metacritic, generi, anno) e, se c\'è un motore AI, riscrive trama e pro/contro usando solo gli estratti di Wikipedia. Ti mostra "prima / dopo" e applichi solo ciò che ti convince.',
    'I giochi nuovi che aggiungi vengono verificati in automatico su Wikipedia/Wikidata (voto, generi, anno, giochi non ancora usciti). Le istruzioni all\'AI ora vietano di inventare dati e di parlare di giochi non usciti.'
  ]},
  {version:'v76', date:'2026-09-29', items:[
    'Controllo dei dati con Metacritic: 105 voti che non corrispondevano alla critica sono stati corretti (con almeno 15 recensioni alla base), con i relativi tier. Prima molti giochi avevano un voto provvisorio di 72: ora quelli verificabili hanno il voto reale e la fonte "verificato".',
    'Tre giochi non ancora usciti (Fate/Extra Record, Decapolice, SacriFire) avevano recensioni e pro/contro inventati: ora sono segnati come "non ancora usciti" con la data prevista.',
    'Riscritte circa 115 frasi che dicevano "recente" o "essendo recente invecchia bene" (non più vere), altri generi corretti (Rune Factory, Devil Survivor, Summon Night, ecc.).',
    'I voti ancora provvisori (circa 230 giochi a 72) restano segnati come "stima", perché non ho trovato una fonte di critica per verificarli.'
  ]},
  {version:'v75', date:'2026-09-29', items:[
    'Sincronizzazione: i giochi aggiunti (e le copertine) su dispositivi diversi ora si UNISCONO invece di sostituirsi. Prima, se aggiungevi giochi sia dal telefono sia dal computer, uno dei due elenchi poteva sovrascrivere l\'altro.'
  ]},
  {version:'v74', date:'2026-09-29', items:[
    'Su un dispositivo nuovo (es. il computer) Novità e Novità per genere ora spiegano che manca la chiave Gemini e hanno il pulsante "🔑 Inserisci la chiave". Per sicurezza la chiave non si sincronizza tra i dispositivi.'
  ]},
  {version:'v73', date:'2026-09-29', items:[
    'Nuovo logo Raccoon Tier in alto (e come icona dell\'app).',
    'Nuovo: 🔎 Verifica generi online. In "Chiedi" → ⚙️ Impostazioni: confronta i generi dei tuoi giochi con Wikidata e ti propone le aggiunte, che confermi tu. I giochi nuovi che aggiungi vengono controllati da soli e ricevono i generi confermati da Wikidata.',
    'Le righe della classifica ora finiscono sopra i pulsanti in basso e, a schermo intero, il contenuto sale più in alto.'
  ]},
  {version:'v72', date:'2026-09-29', items:[
    'Generi ricontrollati su tutti i 765 giochi: circa 130 correzioni (es. Secret of Mana, Legend of Mana, CrossCode, Ni no Kuni II, Granblue Relink sono Action-RPG; Luminous Arc, Agarest e Shadowrun sono Tattici; i Pokémon e Yo-kai Watch sono Cattura mostri). Persona 4 Arena e Granblue Versus sono ora Picchiaduro, Heroes of Mana e Realms of Ruin sono Strategia in tempo reale, e vanno nelle loro classifiche.',
    'Nella finestra ➕ Generi c\'è ora "Aggiungi tutti i generi che hanno giochi" per riempire la barra con un tocco.',
    'Le nuove schede scritte da Claude/Gemini ricevono la data di oggi e il divieto di frasi come "uscito da poco", così non invecchiano più. Aggiunto anche un controllo automatico dei dati (tools/check-data.js).',
    'Schermo intero: nuova icona e corretto il grosso spazio vuoto in alto.'
  ]},
  {version:'v71', date:'2026-09-29', items:[
    'Nuovo: ⛶ schermo intero. Il pulsante in alto nasconde la barra del browser e la barra di stato (orario, batteria). Per averlo sempre così: menù ⋮ del browser → "Aggiungi a schermata Home" / "Installa app": si apre come un\'app vera.',
    'Generi corretti su 29 giochi (es. i Pokémon ora sono "Cattura mostri", Phantom Brave e XCOM 2 sono "Tattico a griglia", Slay the Spire è Roguelike, i Xenosaga sono Mecha).',
    'Testi da aggiornare: le frasi "uscito troppo di recente" (che non erano più vere) sono state riscritte, e il contro di Octopath Traveler II ora spiega meglio la differenza con il primo capitolo.'
  ]},
  {version:'v70', date:'2026-09-29', items:[
    'Quando aggiungi un gioco, la sua classifica di genere (es. Dungeon Crawler) viene creata da sola e la conferma dice chiaramente dove lo trovi: prima la classifica del genere, poi JRPG / RPG.',
    'L\'avviso "Non nel tuo database" nelle proposte è ora una piccola etichetta in vetro, in basso sulla copertina, con un puntino che pulsa.'
  ]},
  {version:'v69', date:'2026-09-29', items:[
    'Nuova grafica "Aurora glass": sfondo con luci animate, barre e pulsanti in vetro sfumato, badge dei tier con gradienti (il S+ brilla), finestre che salgono dal basso con effetto molla, conferme animate.',
    'Funzionale: ogni riga della classifica mostra una barra del voto, le barre delle statistiche crescono all\'apertura, la tabella sta sempre intera nello schermo del telefono e le schede cambiano con una dissolvenza.',
    'Vibrazione leggera (Android) su preferiti, cuore/scarta e schede. Chi ha "riduci animazioni" attivo nel telefono non vede movimenti.'
  ]},
  {version:'v68', date:'2026-09-29', items:[
    'Quando aggiungi un gioco (❤️ in Novità, o da Chiedi) compare una conferma grande al centro dello schermo con il nome del gioco e la classifica in cui lo trovi.',
    'Un gioco con un genere non RPG (es. Puzzle, Platform) ora sta solo nella sua classifica di genere e non più in "JRPG / RPG"; "Tutti" li mostra sempre tutti.',
    'Novità non ripropone più giochi che hai già, anche se il nome è scritto in modo leggermente diverso.'
  ]},
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
