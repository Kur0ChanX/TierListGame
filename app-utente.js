// Utente: changelog, cambio profilo, export/import, verifica qualità dati. Caricato dopo gli altri file app*.js nell'ordine: app, app-schede, app-utente, app-ai.
// ---- Changelog "Novità del programma": cronologia visibile delle versioni per Mario ----
// Aggiungere una riga in cima ogni volta che pubblico un aggiornamento, così la crescita del
// programma si vede anche dentro l'app, non solo nei messaggi di chat.
const CHANGELOG = [
  {version:'v232', date:'2026-10-02', time:'13:27', items:[
    'Musica + voce: con «Auto» della musica acceso, quando parte la voce della storia controllo che la musica stia suonando e, se non è partita, la faccio partire. Se il telefono blocca l\'avvio della musica, riparte da sola al primo tocco sullo schermo.',
    'Mentre la voce parla la musica scende meno (al 45% del volume scelto, prima al 25%) e non va mai sotto una soglia udibile: con un volume già basso sembrava che la musica non partisse.',
  ]},
  {version:'v231', date:'2026-10-02', time:'13:15', items:[
    'Il «flash» di icone e locandina appena aperto un gioco: nel video si vede che, finito il movimento, per 2 fotogrammi la scheda diventava vuota (locandina a metà). Il telefono la ridisegnava da zero perché a fine animazione il programma toglieva lo «strato pronto per muoversi». Ora quello strato resta sempre: niente più ridisegno né fotogrammi vuoti (aiuta anche la chiusura).',
  ]},
  {version:'v230', date:'2026-10-02', time:'13:03', items:[
    'Apertura dei giochi: nel nuovo video (85 fotogrammi al secondo) l\'apertura scattava ancora mentre la chiusura era fluida. Causa: la copia sfocata della copertina dietro la locandina e l\'ombra sulle foto del carosello venivano ricalcolate a ogni fotogramma mentre la scheda si ingrandiva. Ora durante il movimento la sfocatura non c\'è (compare in dissolvenza subito dopo) e le foto del carosello non hanno più quell\'ombra pesante.',
  ]},
  {version:'v229', date:'2026-10-02', time:'12:39', items:[
    'SCHERMO INTERO, la causa vera: l\'app installata partiva «normale» (con la barra dell\'ora) e poi il programma forzava lo schermo intero; Android lo toglie ogni volta che esci dall\'app o cambi schermata, da qui i salti, le bande nere e il «flash» in classifica. Ora l\'app chiede ad Android di essere a schermo intero fin dall\'avvio (come un gioco): niente più forzature. Il telefono aggiorna l\'app installata da solo (può volerci un giorno), oppure subito reinstallandola.',
    'Apertura dei giochi più fluida: nel video a 88 fotogrammi il movimento si fermava 2-3 fotogrammi alla volta. Causa: insieme alla scheda partivano ~25 piccole animazioni dei riquadri interni (servono solo cambiando linguetta) e il carosello delle foto si preparava a metà animazione. Ora i riquadri si animano solo cambiando linguetta, il carosello si prepara a scheda aperta e la scheda viene disegnata (invisibile) un attimo prima di muoversi.',
  ]},
  {version:'v228', date:'2026-10-02', time:'11:42', items:[
    'Avvisi della campanella 🔔: toccandoli dopo aver riaperto l\'app non succedeva nulla (quello che dovevano aprire era tenuto solo finché l\'app restava aperta). Ora si aprono sempre: «Oggi: novità per te» apre Oggi per te, un gioco in offerta o un\'uscita apre la scheda del gioco, «Hai copiato un\'immagine per…» apre la scheda e incolla l\'immagine come locandina.',
  ]},
  {version:'v227', date:'2026-10-02', time:'11:30', items:[
    'Musica della scheda: nell\'elenco dei brani (☰) ogni brano ha 📌 «parti sempre da qui». Il brano scelto resta per sempre e l\'elenco si blocca 🔒 (nessun aggiornamento automatico lo cambia). Dietro «⋯» il lucchetto sblocca o blocca i brani.',
    'Player in home: nuovo tasto 🔊 con il volume e il lucchetto (lo stesso volume della scheda: impostato, resta bloccato anche riaprendo l\'app). Chiudendo la scheda la musica non resta più abbassata.',
    'Auto in home: acceso = chiudendo la scheda la canzone continua e poi passa alla successiva; spento = chiudendo la scheda la musica si ferma e in home non parte mai da sola.',
    'Animazioni a scatti «a volte»: la prima volta che apri un gioco l\'app calcola i colori della copertina e li applicava a metà animazione, facendo ricalcolare tutta la scheda. Ora li applica solo a scheda ferma; in chiusura li toglie a scheda chiusa.',
    'Velocità animazioni: a 0,7× e 0,5× ora anche la dissolvenza iniziale rallenta (prima durava pochissimo e copriva il movimento, per questo sembrava sempre veloce).',
    'Voce: la decodifica dell\'audio non blocca più l\'app mentre scorri.',
  ]},
  {version:'v226', date:'2026-10-02', time:'11:18', items:[
    'Scheda del gioco: toccando «Per te», «Il gioco» o «Altro» dopo aver scorso la scheda, ora la vista torna all\'inizio della parte scelta (prima restava giù e sembrava che il tasto non facesse nulla).',
    'Voce Gemini: niente più falsi «quota finita». Prima partivano più richieste insieme e Google rispondeva «troppe richieste»: ora ne parte una alla volta, la storia è divisa in meno pezzi e, se Google dice di aspettare, il tasto mostra «Gemini occupato, riprovo tra N s» e riprova da solo.',
    'Se un modello di voce ha finito la quota del giorno passo al successivo (ognuno ha la sua). Solo se sono finiti tutti te lo dico chiaramente.',
    'Con la Voce AI scelta non parte più la voce robotica del telefono al suo posto: se Gemini proprio non risponde vedi il motivo e puoi riprovare.',
  ]},
  {version:'v225', date:'2026-10-02', time:'11:07', items:[
    'Voce della lettura: la voce robotica era quella del telefono, perché a settembre 2026 Google ha cambiato i modelli della voce AI (Gemini 3.8) e il vecchio modo di chiamarla non funzionava più. Ora uso i modelli nuovi (e, se non rispondono, quelli vecchi) e ricordo quale funziona.',
    'Accanto ad «Auto» c\'è il nome della voce (es. «Charon ▾»): si apre «Voce della lettura» con il motore (✨ Voce AI oppure 📱 Voce del telefono) e 16 voci AI, 8 maschili e 8 femminili; toccandone una la senti subito. Con il telefono puoi scegliere tra le sue voci italiane.',
    'Se la voce AI non va, ora lo dico chiaramente (manca la chiave, chiave non valida, quota finita) invece di passare in silenzio alla voce del telefono.',
    'Parte molto prima: la storia viene letta a pezzi. Il primo è corto (una frase) e arriva in un paio di secondi; i successivi si preparano mentre ascolti. Ogni pezzo resta salvato: la seconda volta parte subito.',
    'Musica: con «Auto» spento, dopo 2 secondi nella scheda preparo in silenzio l\'elenco dei brani (e YouTube se serve), così premendo ▶ parte prima.',
  ]},
  {version:'v224', date:'2026-10-02', time:'12:10', items:[
    'Apertura dell\'app: la locandina «Inizia a frugare» non si muove più quando il telefono passa a schermo intero (prima la finestra cambiava altezza e la locandina si spostava, con la banda bianca sotto). Ora resta ferma e l\'app si apre solo a finestra assestata; sfondo scuro anche prima del caricamento.',
    'Tasto «Inizia a frugare»: fermo finché non lo tocchi; al tocco si schiaccia e rimbalza restando nello schermo. Vibrazione appena tocchi e suono che parte subito (tre note brevi, nessuna coda).',
    'Animazioni: due selettori di velocità (1,25× · 1× · 0,85× · 0,7× · 0,5×): uno per l\'apertura della scheda, uno per tutto il resto (righe, pannelli, cambio sezione, tocco). Nelle impostazioni c\'è un\'anteprima sempre visibile in alto: tocca uno stile e la vedi muoversi, «Rivedi» la ripete. La fluidità segue lo schermo (90/120 Hz già inclusi).',
    'Apertura del gioco «a blocco unico»: se mancano i testi lunghi li aspetto un attimo (max 0,14 s) prima di costruire la scheda, e non la ridisegno mentre si apre. Via la cornice chiara sottile durante la transizione.',
    'Barra dei generi in classifica: «Tutti» per primo, poi JRPG/RPG, poi i generi che scegli di tenere in vista, «Tutti i generi» alla fine. In «Tutti i generi» c\'è «📌 Scegli quali tenere in vista» (o «Usa i più cercati» per tornare all\'automatico).',
    'Player nella scheda su una sola riga (precedente · play · successivo · ⋯). Dietro «⋯»: elenco, cambia, cerca, Auto, stop e il volume della musica. Il volume, appena lo imposti, si blocca 🔒 e resta anche riaprendo l\'app; tocca il lucchetto per sbloccarlo e cambiarlo.',
    'Ascolta la storia: mentre la voce parla la musica scende al 25% del volume scelto e poi risale piano.',
  ]},
  {version:'v223', date:'2026-10-02', time:'10:15', items:[
    'Scheda del gioco: in alto, sotto il titolo, c\'è il tasto piccolo «Ascolta la storia». Legge prima la storia e subito dopo le informazioni principali (anno, tier, voto, punti di forza, durata).',
    'Accanto c\'è l\'interruttore «Auto»: acceso, la lettura parte da sola circa 2 secondi dopo che la scheda si è aperta e ferma (così non rovina l\'animazione); spento, parte solo se tocchi il tasto. Si ferma da sola se chiudi la scheda o esci dall\'app.',
    'Voce più naturale: se nelle impostazioni hai la chiave Gemini usa la voce AI (Kore) e la tiene in memoria, così la seconda volta è subito pronta e non consuma; senza chiave, o se Gemini non risponde, usa la migliore voce italiana del telefono.',
  ]},
  {version:'v222', date:'2026-10-02', time:'09:59', items:[
    'PROBLEMA ALLA RADICE trovato: la funzione «tema dalla copertina» cambiava i colori di TUTTA l\'app animandoli per 0,7 s. Quei colori sono ereditati da ~1650 elementi, quindi a ogni fotogramma, mentre la scheda si apriva (e quando si chiudeva), il telefono ricalcolava gli stili di tutta la pagina: per questo le animazioni «non avevano influenza». Ora i colori stanno solo sulla scheda (~500 elementi) e non c\'è più l\'animazione sulla radice. Nel telefono simulato lento: calcolo degli stili all\'apertura da ~530 a ~65 ms, disegno da ~685 a ~310 ms.',
    'Sincronizzazione: la parte pesante (160-260 ms) non parte più mentre usi l\'app: aspetta almeno 5 minuti dall\'ultima volta e che tu non tocchi lo schermo; le modifiche non inviate partono quando lasci l\'app. All\'avvio parte dopo 6 s e a schermo fermo.',
    'Controllato anche l\'aspect ratio delle locandine: la cornice è sempre 3:4 (non si adatta più all\'immagine), quindi non sposta niente quando la copertina arriva.'
  ]},
  {version:'v221', date:'2026-10-02', time:'09:40', items:[
    'Apertura del gioco senza «doppio colpo»: la scheda è piena fin dal primo fotogramma (prima si vedeva la lista attraverso la scheda che sfumava) e compare insieme alla locandina: aspetta pochi millesimi che la miniatura sia pronta e poi parte l\'animazione già con la locandina dentro. Vale per tutti gli stili.',
    'Player nella scheda: i tasti sono di nuovo tondi (con il tasto «Auto» la riga era troppo larga e li schiacciava a uovo).',
    'Colonne sonore: ora si cerca la versione GIUSTA del gioco. «Final Fantasy VII» (1997) non prende più i brani di Remake, Rebirth, Crisis Core, Dirge of Cerberus o Advent Children; un Remake non prende l\'originale; conta anche il numero del capitolo (VII ≠ VIII), altri giochi più «lunghi» del tuo catalogo con lo stesso nome e l\'anno scritto nel titolo. Le ricerche vecchie sono state azzerate.'
  ]},
  {version:'v220', date:'2026-10-02', time:'09:08', items:[
    'Filtri «super scattosi»: con il pannello Filtri aperto la griglia non scorreva più da sola e il programma caricava a raffica tutte le copertine (fino a 1500, un blocco dopo l\'altro). Ora ne carica solo quante servono: aprire i Filtri passa da ~190 a ~10 ms (telefono simulato lento). Il pannello non anima più l\'altezza ma si apre con una breve dissolvenza.',
    'Dal tuo Rapporto lentezza: toccare «Classifica» costava ~150 ms. Con la griglia (copertine) il programma costruiva anche la tabella nascosta a ogni ridisegno: ora non più (il ridisegno costa circa 8 volte meno).',
    'Aprire un gioco: tolto un costo mio della v218 (riportare la scheda in cima obbligava a impaginare tutta la pagina: ~40 ms), e l\'elenco dei «top» non si rilegge più per ogni riga.',
    'Locandina immediata: aprendo un gioco compare subito la miniatura già vista nella lista (niente più riquadro viola vuoto con il bordino chiaro per 0,4 s), poi arriva quella nitida.',
    'Sincronizzazione: se il tuo archivio su GitHub non è cambiato risponde «nessuna novità» e non c\'è niente da scaricare né da analizzare (prima ~0,2-0,3 s a ogni ritorno nell\'app); non parte più a ogni ritorno ma al massimo ogni 3 minuti e mai mentre tocchi lo schermo.',
    'Avvio: la lista non si ridisegna più una seconda volta se non ci sono correzioni dei generi da applicare.'
  ]},
  {version:'v219', date:'2026-10-02', time:'08:38', items:[
    'Animazioni: 6 stili + il tuo (✨ → Movimento e vibrazione → «Stile delle animazioni»): Lampo, Morbida, Zoom (quello di sempre), Rimbalzo, Scorrimento, Cinema e «Come il mio telefono» (la finestra cresce dalla copertina toccata fino a tutto schermo, circa 0,24 s, come le app di Android). Lo stile vale per tutta l\'app: apertura e chiusura delle schede, cambio sezione, righe della lista, pannelli e tocco. Tutto solo con movimenti leggeri (li fa la scheda grafica): nessun lavoro in più e nessun ritardo al tocco.',
    'Molto più leggera ogni apertura e ogni cambio sullo schermo: il calcolo degli stili è sceso da ~330 ms a ~75 ms (misura su telefono simulato lento). Erano regole «:has()» che a ogni cambio facevano controllare tutta la pagina. Anche la scheda ora disegna subito solo la prima schermata e il resto quando ti avvicini (l\'impaginazione più lunga: da ~58 a ~12 ms).',
    'Corretto: dopo aver chiuso una scheda la lista si ridisegnava da sola 1,5 secondi dopo e le copertine lampeggiavano.',
    'Sfondo della scheda: non più un colore piatto ma 4 bagliori morbidi con i colori della copertina (stile app moderna), che cambiano dolcemente da un gioco all\'altro.',
    'Il gesto «scorri dal basso» riesce al primo colpo anche se parte dalla barra dei tasti (cambio di pagina con il dito fermo, annullato dallo scorrimento).'
  ]},
  {version:'v218', date:'2026-10-02', time:'07:39', items:[
    'Gesto «scorri dal basso» di Android: nella striscia più bassa dello schermo i tasti non scattano più al tocco (il gesto cambiava pagina per sbaglio e dovevi riprovare). Il tocco normale funziona come prima.',
    'Apertura del gioco più leggera in verticale: durante l\'animazione i lavori di sottofondo aspettano, e la lista non si ridisegna sotto la scheda aperta.',
    'Carosello: ora parte anche per i vecchi giochi senza foto su Steam (es. Suikoden V): schermata di gioco e schermata del titolo da Libretro. «Nessuna foto» si ricorda 3 giorni, non 30.',
    'Carosello, impostazioni: nel menu 🖼️ della locandina c\'è «⚙️ Impostazioni del carosello» (acceso/spento, secondi per foto, attesa della locandina, velocità del passaggio, effetto). Il lucchetto 🔒 serve solo a non far cambiare locandina e foto dagli aggiornamenti.',
    'Player: tasto «Auto» separato. Nella scheda decide se aprendo un gioco la sua musica parte da sola; nel player in home decide se, finito un brano, parte il successivo. «■» ferma solo il brano.',
    'La scheda del gioco parte sempre in alto (nome e locandina in vista): prima, aprendo un gioco dopo averne scorso un altro, restava a metà.',
    'Aprendo un gioco, Update+, ricerca locandina e foto partono dopo qualche secondo a scheda ferma, e solo se mancano: Update+ non si ripete se il gioco è già stato aggiornato (o provato negli ultimi 7 giorni). Con la 🧘 Modalità calma non parte niente.'
  ]},
  {version:'v217', date:'2026-10-02', time:'03:40', items:[
    'Sistemato: a volte il gioco appena aperto si richiudeva da solo e tornavi in Classifica. Era un «indietro» che arrivava in ritardo dopo un cambio di pagina.',
    'Pagine ferme: ogni tasto di sotto parte sempre dall\'alto e la pagina non si muove da sola. Ritoccare «Classifica» quando ci sei già ti riporta in cima, di colpo. Tornando da un gioco resti dov\'eri.',
    'Nuovo: 🧘 Modalità calma (✨ → Moduli). Spegne tutti i lavori automatici da internet: Update+ all\'avvio, controllo con Gemini, copertine e foto cercate da sole. Per ogni gioco premi tu ⚡ Update+ e scarica tutto. Il backup resta acceso.',
    'Locandina da internet: «Cerca su internet» apre Google Immagini. Tieni premuto sulla foto → Condividi immagine → Raccoon Tier e diventa la locandina 🔒. Oppure «Copia immagine» e al ritorno tocchi l\'avviso o «📋 Incolla l\'immagine copiata».',
    'Con la scheda di un gioco aperta, sotto non si muove più niente (risparmio per il telefono).'
  ]},
  {version:'v216', date:'2026-10-02', time:'03:15', items:[
    'Apertura del gioco: niente più «prima la locandina e poi il resto». La scheda intera compare insieme con una piccola zoomata che parte dal punto che hai toccato, leggera per il telefono.',
    'Tocco più reattivo: la copertina o la riga che tocchi si «schiaccia» subito, così senti che il tocco è arrivato.',
    'Scroll dentro la scheda più fluido: mentre scorri si fermano il carosello delle foto e il disco che gira, e ripartono quando ti fermi. Le foto non hanno più la sfocatura pesante.',
    'Tasti di sotto (Classifica, Novità…) più leggeri: la lista resta «addormentata» mentre sei su un\'altra pagina e i lavori in sottofondo (Update+, archivio) aspettano qualche secondo dopo un tuo tocco.',
    'Nuovo: ✨ → 🐢 Rapporto lentezza. L\'app annota da sola i tocchi lenti: tocca «Copia» e mandamelo, così vedo cosa rallenta sul tuo telefono.',
    'Sistemati piccoli difetti trovati dal controllo completo (riquadro Sintonia doppio in «I tuoi gusti»).'
  ]},
  {version:'v215', date:'2026-10-02', time:'02:27', items:[
    'Apertura di un gioco rifatta: prima la locandina restava da sola sul nero per quasi un secondo (il programma aspettava i testi completi, che cominciava a caricare solo dopo 7 secondi) e poi «saltava» in un altro punto. Ora i testi arrivano in sottofondo già dopo 2,5 s (prima quelli dei tuoi giochi), e la locandina si allarga dalla copertina toccata e SCIVOLA esattamente al suo posto nella scheda, con lo stesso taglio: niente salto, niente nero.',
    'Notifiche nuove: gli avvisi importanti (Oggi, Radar, prezzi, backup, memoria…) compaiono in basso come una scheda e RESTANO finché li tocchi: toccandoli ti portano alla cosa di cui parlano, con ✕ li chiudi. Se ne arrivano più insieme vedi «+1». In alto c\'è la 🔔 campanella con il numero di quelli che non hai visto (anche dopo aver riaperto l\'app) e l\'elenco completo. I palloncini brevi di conferma restano come prima.',
    'Tamagotchi: niente più popup automatici («Frugu: ha sporcato!», premi, livelli) fuori dalla sua pagina.',
    'Le copertine scelte da te ora compaiono subito anche nella griglia (dalla v211 arrivavano un attimo dopo il primo disegno e la griglia non si aggiornava).',
    'Check completo: controllo automatico dei conflitti tra i file (nomi doppi, id doppi, file mancanti, sintassi: nessuno) e un «utente robot» che usa tutto il programma con un profilo pesante (12 cambi di sezione, 30 giochi aperti in tabella e griglia, tutte le 31 voci del menu ✨, ricerca, filtri, Chiedi, avvisi): nessun errore, nessun blocco lungo, memoria e timer stabili (nessuna perdita).'
  ]},
  {version:'v214', date:'2026-10-02', time:'01:52', items:[
    'Memoria piena al 70%: spostati nell\'archivio grande anche gli archivi d\'appoggio più pesanti (diagnosi dei voti, controlli di Update+, album delle colonne sonore, nomi inglesi, schermate RAWG, registro…). La memoria normale torna quasi vuota e non si perde niente. Se mai si riempisse di nuovo, prima libero da solo quello che si può rigenerare.',
    'Lettore musicale sempre al suo posto: nella Classifica resta visibile anche dopo Stop (con ▶ per ripartire); nella scheda sta in alto, sopra «Per te / Il gioco / Altro», e si vede in tutte e tre le parti (prima era dentro «Il gioco»).',
    'Ingresso: la schermata aspetta SEMPRE il tuo tocco su «▶ INIZIA A FRUGARE» (anche nell\'app installata, prima si chiudeva da sola). Al tocco il pulsante fa «pop» con un anello di luce, un piccolo suono di tre note e la schermata si apre in avanti. Se tocchi prima che i giochi siano pronti, entra appena lo sono.',
    'Scatto dopo l\'apertura di un gioco: circa 7 secondi dopo l\'avvio, quando arrivano i testi completi, il riquadro «Se ti è piaciuto…» ricalcolava i tratti di tutti i giochi in un colpo solo (un blocco ben visibile). Ora si ricalcolano a pezzetti nei momenti liberi.',
    'Controllo onesto sulla struttura per 20.000 giochi (v209): stesso telefono simulato con il tuo profilo, v208 contro oggi. Oggi è più veloce quasi ovunque (sezioni 2–3 volte più rapide, scorrimento della scheda senza scatti contro 40 scatti); l\'unico peggioramento era lo scatto qui sopra, ora tolto.'
  ]},
  {version:'v213', date:'2026-10-02', time:'01:36', items:[
    'Velocità: trovato il vero freno. 155 copertine della lista base puntavano a un indirizzo che esiste solo dentro Claude; nella griglia ogni copertina rotta veniva ritentata all\'infinito (centinaia di volte al secondo) e rallentava TUTTO: scorrimento della scheda, cambio sezione, apertura dei giochi. Ora la copertina rotta si prova una volta sola e quelle 155 vengono cercate da capo. Scorrimento nella scheda: da «frenato» a 60 fotogrammi al secondo.',
    'Apertura di un gioco più pulita: la scheda veniva riordinata due volte (e «saltava»); ora una volta sola, già completa. Anche dalla griglia parte l\'animazione veloce che si allarga dalla copertina toccata (prima no: si vedeva la scheda trasparente sopra la lista).',
    'Scopri si apre molto prima: la sintonia fine si calcola solo sui giochi più promettenti, non su tutti i 1500.',
    'Stemma del procione: ora è il tuo disegno intero (orecchie e cornice comprese), senza il cerchio dorato aggiunto, e nella griglia è piccolo nell\'angolo della copertina (prima, per errore, copriva tutta la locandina). Anche il pulsante «Nel cuore» usa il tuo stemma.',
    'Previsione del voto: usa lo stesso «cervello» della Sintonia (prima un vecchio calcolo che dava voti bassissimi). I pulsanti per dare il tuo voto ci sono sempre, anche su un gioco nuovo; al voto si «congela» la previsione che avevi visto, così il confronto è onesto.',
    'Riquadri della scheda: ogni riquadro ha le sue frecce ▲▼ per spostarlo più su o più giù, lì dove sei (il riquadro resta sotto il dito).',
    'Eredi e radici spirituali: cerca col nome inglese ufficiale, riconosce anche «ispirato a / influenzato da» (es. Like a Dragon → Dragon Quest) e, se Wikipedia non dice niente, cerca subito sul web con Gemini.'
  ]},
  {version:'v212', date:'2026-10-02', time:'00:50', items:[
    'Sezioni in basso fulminee: si cambiano appena il dito tocca l\'icona (prima solo quando lo alzavi, più un\'animazione che doveva «fotografare» la pagina: da lì il ritardo). Niente più animazioni di passaggio, niente scorrimenti automatici: ogni sezione, Classifica compresa, si apre sempre in cima, di colpo. Tornando alla Classifica le righe non «scendono» più.',
    'Chiedi si apre di colpo e la barra in basso resta visibile: tocchi un\'altra sezione e Chiedi si chiude da solo.',
    'I tuoi top in assoluto: nella lista c\'è il tuo stemma del procione con gli occhi a cuore, a sinistra della stella (ritagliato rotondo e stretto sul muso per leggerlo anche piccolo); nella griglia sulla copertina. Ho ristretto un po\' le colonne Anno, Tier e Voto per fargli posto.',
    'Novità: ogni proposta che guardi viene controllata subito su Metacritic, OpenCritic e RAWG (prima solo a fine ricerca: se la fermavi prima restava il voto inventato dall\'AI, tipo 98 S+). Vedi «⏳ controllo il voto vero…», poi il voto verificato con la fonte, oppure «stima» con rank ND e quanto diceva l\'AI. Se l\'anno è sbagliato lo corregge con RAWG.'
  ]},
  {version:'v211', date:'2026-10-01', time:'21:37', items:[
    'I tuoi top in assoluto (👑 «Nei miei top») si riconoscono nella lista con una corona d\'oro accanto al nome e la riga bordata d\'oro; nella griglia la copertina ha la corona e la cornice dorata. Via il procione con gli occhi a cuore.',
    'Cambio sezione nuovo: niente più pagine che arrivano da destra o da sinistra. La pagina vecchia arretra e sfuma, la nuova emerge e si posa. Nella barra in basso una bolla di luce scivola sotto la sezione APPENA tocchi (prima ancora che la pagina sia pronta) e l\'icona fa un piccolo salto a molla.',
    'Nella scheda, passando tra «Per te», «Il gioco» e «Altro» i riquadri emergono morbidi invece di comparire di colpo. La pagina Saghe disegna solo quello che vedi: si apre più svelta.',
    'Archivio grande: i giochi che aggiungi, le copertine e le foto ora stanno nella memoria grande del browser (centinaia di MB) e non più in quella piccola da 5 MB. Lo spostamento è automatico e sicuro: copio, ricontrollo e solo dopo libero la memoria vecchia; se una scheda vecchia del browser scrive ancora lì, al prossimo avvio unisco tutto senza perdere niente. Backup e sincronizzazione funzionano come prima.',
    'Colonne sonore e schermate preparate dal server ogni notte ora arrivano a pezzi: l\'app scarica solo il pezzo del gioco che apri (lo prepara già al tocco), non più tutto il file. Pronto per 20.000 giochi.',
    'DNA: «🤷 Ni» diventa «🫤 Mah» (c\'è, ma così così): stesso significato, non pesa sui tuoi gusti.'
  ]},
  {version:'v210', date:'2026-10-01', time:'21:20', items:[
    'Scopri, Novità, Mia tier, Saghe e Statistiche ora sono pagine a tutto schermo: la parte alta della classifica (logo, ricerca, filtri, Oggi) sparisce, in cima c\'è il nome della sezione con «‹ Classifica» per tornare. Il tasto «indietro» del telefono riporta alla classifica, che riparte dal punto dove l\'avevi lasciata. Se in Saghe o Scopri ci sono filtri attivi, lo vedi in alto con «togli».',
    'Passaggio tra le sezioni sistemato: prima partivano due animazioni una dentro l\'altra e si annullavano (si vedeva solo una dissolvenza a metà); ora la pagina scivola davvero, una volta sola.',
    'Scheda del gioco: aperta nei primi secondi si costruiva due volte (prima senza testi, poi di nuovo, con un salto). Ora aspetta i testi mentre si allarga e si disegna una volta sola, già completa.',
    'La barra «Per te / Il gioco / Altro», quando resta ferma in alto, sale fin quasi al bordo dello schermo (lascia libero solo lo spazio della fotocamera) e lo spazio sopra è coperto, senza buchi.'
  ]},
  {version:'v209', date:'2026-10-01', time:'21:00', items:[
    '🏗️ Nuova struttura dei dati, pronta per 20.000+ giochi. All\'avvio arriva solo un «indice» leggero (nomi, voti, generi, i tratti già riconosciuti per i tuoi gusti); i testi lunghi (trama, analisi, pro e contro) arrivano a pezzi quando servono: quando apri un gioco (anzi, già quando lo sfiori col dito) e in sottofondo quando il telefono è libero. L\'indice dei tuoi giochi è passato da 713 KB a 178 KB. Provato con un catalogo finto di 20.000 giochi: si apre in mezzo secondo, usa 4 volte meno memoria e non si blocca. I tuoi gusti e la Sintonia restano identici (verificato gioco per gioco).',
    '😍 Nella lista e nella griglia i giochi «Nel cuore» mostrano il procione con gli occhi a cuore.',
    '🧬 «Cosa ti ha preso»: c\'è anche 🤷 Ni (c\'è ma così così: non pesa né in positivo né in negativo). Tocca un tratto: 👍 → 💖 → 🤷 Ni → 👎 → via; nel gioco veloce c\'è il tasto Ni.'
  ]},
  {version:'v208', date:'2026-10-01', time:'20:36', items:[
    '🛠️ STABILITÀ — trovato e tolto il vero blocco: con tanti giochi e tanti dati (come i tuoi) il telefono restava occupato fino a 40 secondi subito dopo l\'avvio. Per questo si bloccava la foto del procione, poi i tocchi in alto, poi i giochi (lo scorrimento invece andava). La causa: il calcolo dei tuoi gusti veniva rifatto da capo per ogni gioco, rileggendo tutti i dati ogni volta (era peggiorato dalla v203, colpa mia). Ora si calcola una volta e si rifà solo quando cambi davvero qualcosa: da 40 secondi a meno di 1.',
    'Stesso problema con l\'ordine «Più adatti a te»: 12 secondi di blocco → meno di 1.',
    'Il riquadro «Oggi» si prepara quando il telefono è libero e il suo posto è riservato subito, così la lista non si sposta più sotto il dito.',
    'Reti di sicurezza: l\'animazione di apertura di un gioco non può più restare sopra l\'app; il «ricorda il tocco» dell\'avvio si spegne da solo.',
    'Torna il pulsante «Schermo intero» (spariva quando l\'app è installata) e l\'intro attiva di nuovo lo schermo intero.'
  ]},
  {version:'v207', date:'2026-10-01', time:'20:16', items:[
    '🧬 «Cosa ti ha preso di questo gioco» rifatto da zero. In alto c\'è il tuo «filamento di DNA» con il gioco (una striscia colorata), poi in tre gruppi: 💖 i motivi principali (al massimo 3, pesano il doppio), 👍 cosa ti è piaciuto, 👎 cosa no.',
    'Nuovo GIOCO VELOCE: un tratto alla volta su una carta grande, con la spiegazione. Scorri a destra = mi piace, a sinistra = no, in su = è il motivo principale (o usa i 4 tasti). Prima i tratti riconosciuti nel gioco, poi quelli che di solito ami. In 30 secondi il cervello impara il perché dei tuoi gusti.',
    '«🔎 Tutti i tratti» con la ricerca (scrivi «boss», «loot», «minigiochi»…). Tocca un tratto per cambiarlo: 👍 → 💖 → 👎 → via, senza salti di pagina.',
    'Le linguette Per te / Il gioco / Altro ora stanno subito sotto la tua barra (più in alto), restano attaccate in cima a tutta larghezza mentre scorri, con un evidenziatore che scivola sulla linguetta scelta. Le tue valutazioni stanno in «Per te»; voti, piattaforme e musica in «Il gioco».'
  ]},
  {version:'v206', date:'2026-10-01', time:'20:01', items:[
    'Risolto «appena entro clicco News o le icone in alto e non apre»: la schermata d\'apertura copriva i tocchi per quasi un secondo dopo «Inizia a frugare». Ora smette dopo 0,35 secondi. In più, se tocchi un pulsante in alto mentre il programma si sta ancora caricando, il tocco non si perde più: viene rifatto appena è pronto.',
    'Intro: se aspetti a lungo il programma non ricarica più la pagina mentre stai toccando lo schermo, e una rete di sicurezza toglie la schermata d\'apertura se resta ferma con i giochi già pronti.',
    'Nuovo file di passaggio di consegne (docs/PASSAGGIO-CONSEGNE.md) con tutto quello che serve per continuare il lavoro da un altro account, più le prove automatiche in tools/test/.'
  ]},
  {version:'v205', date:'2026-10-01', time:'19:50', items:[
    'Locandina di Dragon Quest XI S (finalmente): l\'immagine ufficiale di Steam c\'era, ma il telefono non può chiedere a Steam «qual è il numero di questo gioco» e ricadeva su RAWG, che sbagliava gioco. Ora il numero Steam arriva dal server per molti più giochi (il server ora cerca anche con il nome italiano), e le locandine sbagliate di RAWG già salvate si correggono da sole (ricontrollo ogni 3 giorni; mai se l\'hai caricata tu o bloccata 🔒).',
    'Valutazioni rifatte: via i cursori scomodi. Ora ogni voce ha i tasti 1–10 grandi (+½ per il mezzo punto, ✕ per togliere) e c\'è il tasto ✅ Fine: finché non lo premi vedi «Non ancora salvato», dopo vedi «🔒 Salvato». Se chiudi la scheda senza premere, le salvo io.',
    'Riordina la scheda come vuoi: al posto del vecchio 📌 (limitato e mezzo rotto) c\'è il pulsante ↕️ accanto alle linguette. Scegli la parte, poi sposta ogni riquadro: ⤒ in cima, ▲ su, ▼ giù, ⤓ in fondo. Vale per tutti i giochi. Chi aveva dei blocchi fissati li ritrova in cima.',
    'Tolto «Segna come posseduto» (poco utile).',
    'Storia sorprendente / Loop coinvolgente (dopamina): ora sono due riquadri grandi e leggibili, con icona, titolo e spiegazione, e il dettaglio del loop a passi numerati.',
    '«Cosa ti ha preso»: cliccando un tratto non salta più a fine pagina (si aggiorna sul posto), le categorie partono chiuse con il conteggio dei tratti segnati, testi più chiari.'
  ]},
  {version:'v204', date:'2026-10-01', time:'17:48', items:[
    'Scheda del gioco in 3 parti, con le linguette che restano in alto mentre scorri: 💜 Per te (verdetto, sintonia, DNA, recensione, comprare, giochi simili) · 🎮 Il gioco (storia, a colpo d\'occhio, gameplay, pro e contro, guida, saga) · 📚 Altro (affidabilità dei dati, eredi, dietro le quinte, album). Sopra le linguette resta sempre quello che serve subito: locandina, la tua barra, le valutazioni e la musica. Le parti che non guardi non vengono disegnate: la scheda si apre più leggera. L\'ultima linguetta scelta viene ricordata.',
    '🖼️ Un solo pulsante «Locandina e foto» al posto di 8: dentro trovi cambia locandina, foto del carosello, carica dal telefono, scatta foto, aggiorna in automatico, prossima immagine, cerca su internet, usa un link, sblocca e diagnostica. Se la locandina è bloccata 🔒, le voci automatiche spariscono.',
    'Pulizia dei doppioni: il verdetto d\'acquisto compariva due volte (ora in alto c\'è la pillola, che con un tocco ti porta al verdetto completo in «Per te»), le note tecniche sul voto vanno in «Altro», e il vecchio «Il tuo stato» e «Aggiungi ai preferiti» sono nella barra sotto la locandina.'
  ]},
  {version:'v203', date:'2026-10-01', time:'17:40', items:[
    '🧠 Nasce il CERVELLO dei tuoi gusti: un solo posto che raccoglie tutto quello che dici dei giochi (preferiti, cuori, voti, stati, valutazioni, icone, tratti del DNA) e impara nel tempo. Le cose recenti pesano un po\' di più, perché i gusti cambiano. Dal menu ✨ o dalla Sintonia: «🧠 Cosa ho imparato di te» (quanto ti conosco, cosa ami, cosa eviti, cosa conta nei tuoi voti, cosa è cambiato nell\'ultima settimana, quali giochi valutare per aiutarlo).',
    'Nuova barra sotto la locandina, tutto in un posto solo: ⭐ Preferito · 😍 Nel cuore (i tuoi top) · 👍 Mi piace · 👎 Non mi piace · 🚫 Non è il mio genere (abbassa tutto quel genere) · 💔 Mi ha deluso · 🔁 Lo rigiocherei · e lo stato (In corso, Giocato, Da giocare, Mollato). Via i doppioni più in basso.',
    '🎚️ Le tue valutazioni: 6 voci da 1 a 10 (a mezzi punti), diverse per ogni famiglia di giochi (ruolo, action, avventura/horror, sparatutto, sport/guida, platform, strategici, puzzle). Il cervello capisce quali voci contano davvero per te: per esempio, se quando la storia è alta il tuo voto sale sempre, darà più peso alla storia in tutti i consigli.'
  ]},
  {version:'v202', date:'2026-10-01', time:'17:21', items:[
    'Risolto il programma che non si apriva («Rate limit exceeded»). Il limite di GitHub vale per indirizzo internet, e sulla rete mobile l\'indirizzo è condiviso con tante persone (per questo spegnendo e riaccendendo i dati ripartiva). Ora il programma chiede al sito solo la pagina: tutto il resto lo prende dalla memoria del telefono, i file nuovi una sola volta per versione, i dati notturni al massimo ogni 6 ore. Se GitHub rifiuta, si apre lo stesso con la copia salvata. Prima ogni apertura erano circa 60 richieste, ora 1.',
    'Se il caricamento resta fermo, lo dico chiaramente e riprovo da solo (al massimo 3 volte).',
    'Locandina e foto di Dragon Quest XI S: RAWG scambiava «Dragon Quest XI S: Echi di un\'era perduta» per «Dragon Quest» (il primo). Ora un nome più corto non basta più, e le foto sbagliate salvate vengono rifatte.'
  ]},
  {version:'v201', date:'2026-10-01', time:'16:50', items:[
    'Trovato perché locandine, foto e voti sbagliavano gioco: molti nomi sono in italiano («Echi di un\'era perduta») e i siti stranieri trovavano un altro gioco (es. Dragon Quest I) o «non trovato». Ora il programma ricava da Steam il nome inglese ufficiale di ogni gioco e lo usa per RAWG, OpenCritic, Metacritic, Wikidata e le locandine. Anche il controllo notturno sul server ora trova i giochi coi nomi italiani.',
    '🎞️ Foto del carosello senza fine: quando finiscono quelle di Steam e RAWG, «Altre foto diverse» continua a cercarne di nuove dai video di gameplay (sempre del gioco giusto).',
    'Apertura della scheda «stile iPhone»: al tocco parte subito un cartoncino che si allarga dalla riga, animato dalla scheda grafica (fluido a 60/120 Hz), e sfuma nella scheda vera appena pronta. Chiusura con la stessa curva morbida di iOS.'
  ]},
  {version:'v200', date:'2026-10-01', time:'16:35', items:[
    'Scheda del gioco più fluida: prima si apriva scattando perché calcolava i «giochi simili» confrontando tutti i giochi durante l\'animazione. Ora la scheda si apre subito (3-4 volte più veloce la prima volta), l\'animazione parte solo quando è pronta e i simili arrivano un attimo dopo. Anche la chiusura scivola dolcemente.',
    'Nuovo «A colpo d\'occhio»: riquadri con una parola chiara (es. «Durissima», «Al centro di tutto»), una barra colorata, la durata in settimane a 1h30 al giorno, una frase che riassume tutto e il segno 💜 «come piace a te» (o ⚠️ «di solito non ti piace») preso dal tuo DNA.',
    '🧬 «Con parole tue» più intelligente: se scrivi qualcosa che non esiste tra i tratti (es. il combattimento a tempo di Legend of Dragoon), l\'AI crea un tratto nuovo preciso e cerca nel tuo catalogo quali giochi ce l\'hanno. Il tratto conta subito nella Sintonia e nei giochi simili. Anche i tuoi tratti si segnano 👍 / 👎.'
  ]},
  {version:'v199', date:'2026-10-01', time:'16:14', items:[
    'Risolto l\'errore «Rate limit exceeded» di GitHub e Frugu che non partiva nel caricamento: immagini e caratteri ora vengono dalla memoria del telefono (ricontrollati al massimo una volta al giorno), il codice al massimo una richiesta al minuto, e se il sito rifiuta si usa la copia salvata.',
    '👑 I miei top: nella Sintonia di ogni gioco c\'è «È tra i miei giochi top», e in «I miei top» li metti in ordine (il n. 1 è il tuo preferito di sempre). Pesano più di tutto nel tuo DNA: un gioco dei tuoi top è sempre al 97–100%, anche nei «giochi simili» e nella stessa saga.',
    '🔒 La locandina bloccata non la cambia più niente: sparisce il vecchio «Aggiorna locandina», la lente e gli aggiornamenti automatici la lasciano stare.',
    '🎞️ Foto del carosello: tocchi la foto che non ti piace, ti mostro tante alternative (Steam, trailer, RAWG), tocchi quella nuova e la sostituisce bloccata. «Altre foto diverse» per vederne altre, «＋» per aggiungerne, 🗑️ per toglierla.',
    'Tieni premuto su una locandina o una foto per vederla in grande.'
  ]},
  {version:'v198', date:'2026-10-01', time:'15:58', items:[
    '🎯 Sintonia rifatta: oltre ai tuoi gusti più forti ora conta quanto il gioco SOMIGLIA ai giochi che ami (i 3 più vicini, scritti nella scheda: «Somiglia a giochi che ami: …») e la qualità (un gioco mediocre non può risultare perfetto per te). Un gioco che ami già non viene «indovinato»: c\'è scritto «È uno dei giochi che ami» (es. FFX ora 94-98% invece di 71%). Prova: FF IX 89%, FF XII 88%, Chrono Cross 83%, Disgaea 34%.',
    'Sintonia più chiara: «✓ Ha queste cose che ami» e, a parte, «Cose che ami ma che qui non ci sono (non è un difetto del gioco)» — prima «difficoltà bassa» sembrava un giudizio sul gioco. Niente più doppioni («Storia che coinvolge» e «storia forte»), tutte le etichette con la maiuscola, e la durata usa le stesse ore della Longevità nella scheda.',
    '🧬 «Cosa ti ha preso» rifatto: 43 tratti divisi in 6 categorie (Combattimento, Crescita e build, Mondo, Storia e personaggi, Sistemi, Completare e restare); nuovi: superboss e sfide segrete, evocazioni, gestione della squadra, viaggio epico, storia d\'amore, antagonista memorabile, minigiochi, endgame. Toccando un tratto ti spiego cosa significa (min-maxing, drop rate, god roll, pity, game feel…).',
    '✍️ «Scrivilo con parole tue»: scrivi cosa ti è piaciuto di un gioco (es. «i dark eoni, la sphere grid, il blitzball, Tidus e Yuna») e l\'AI lo trasforma in tratti; se manca un tratto ne crea uno TUO (es. «Sistema a tempo condizionale (CTB)») con le parole per riconoscerlo negli altri giochi. I tuoi tratti entrano nei gusti, nella sintonia e nei giochi simili.',
    '🎵 Canzoni: cerco con le tue parole («soundtrack music», «soundtrack ost», «OST music»), scarto lofi, relax, piano, cover, remix, mix di ore e gli altri capitoli (niente FFX-2 per FFX), e metto PRIMA i brani più famosi (confronto l\'album con i video più visti: To Zanarkand, Otherworld…).',
    '🎛️ Lettore della scheda nuovo: titolo grande, album e fonte, barra di avanzamento (toccala per saltare), ⏮ ⏯ ⏭, ☰ elenco dei 5 brani, 🔁 cambia brano, 🔎 cerca, ■ ferma.',
  ]},
  {version:'v197', date:'2026-10-01', time:'15:20', items:[
    'Corretto lo sfarfallio delle copertine nella vista a griglia (il tuo video): ogni aggiornamento in background (Update+, voti…) ridisegnava da zero tutta la griglia, le immagini ripartivano e compariva l\'icona «rotta». Ora si ridisegnano solo le schede cambiate e un\'immagine che non si carica resta invisibile (si vede lo sfondo colorato col nome).',
    '🧬 DNA più ricco con i termini dei giocatori: drop rate, loot casuale, god roll, rarità a colori/gradi (→ loot); dopamine hit, variable ratio, one more turn/run (→ dopamina); power trip, overlevel (→ potenza); job system, class tree, cross-class, build diversity, sphere grid (→ build). Quattro tratti nuovi da segnare 👍/👎 nelle schede: 🎲 rigiocabilità procedurale («ancora una run»), 🎰 gacha/wish/pity, 💥 game feel (colpi pesanti, juiciness), 🗓️ routine giornaliere e time sink (daily/weekly reset). Servono anche a capire cosa NON ti piace.',
  ]},
  {version:'v196', date:'2026-10-01', time:'15:10', items:[
    '🔄 «Cambia locandina» nella scheda (sopra, negli strumenti della copertina): ti mostro TUTTE le locandine ufficiali che trovo (Steam verticale e HD, Steam orizzontale, Libretro in tutte le regioni, Wikipedia, Wikimedia, RAWG). Tocchi quella bella e resta bloccata 🔒: nessun aggiornamento automatico la cambia più (la sblocchi dallo stesso pannello).',
    '🎞️ «Schermate»: vedi tutte le schermate disponibili (Steam completo, fino a 24, più RAWG) e spunti quelle che vuoi nel carosello; «Salva e blocca» e restano quelle 🔒.',
    '🎵 Colonne sonore SENZA pubblicità: prima cerco l\'album completo su Internet Archive (file musicali normali, nessuna pubblicità né collegamento a Google); YouTube resta solo come riserva (e ora in modalità senza cookie). Si può cambiare in ✨ → Suoni e musica. I brani senza pubblicità hanno il simbolo 🚫📢.',
    '🔁 Nel lettore della scheda: se un brano non ti piace, il tasto 🔁 ti propone le alternative (altri brani dello stesso album o da YouTube); quello che scegli prende il suo posto e resta bloccato 🔒 per quel gioco. Sempre 5 brani per gioco quando l\'album li ha (presi lungo tutto l\'album, non solo i primi).',
    'Corretto: se nessun brano si caricava (senza rete) il lettore passava da un brano all\'altro all\'infinito; ora si ferma e te lo dice.',
  ]},
  {version:'v195', date:'2026-10-01', time:'15:02', items:[
    '🧬 DNA del giocatore, il cuore dell\'app: oltre alle 8 meccaniche di prima riconosco altri 19 tratti di un gioco (lore, world building, esplorazione e segreti, crafting, gestione delle risorse, sandbox, costruzione e gestione, tattica, combattimento, storia, personaggi e legami, scelte e conseguenze, atmosfera, colonna sonora, gioco con gli altri, enigmi, umorismo, vita quotidiana e legami). Li leggo da storia, gameplay, pro, «perché piacerti», etichette e simboli di ogni scheda.',
    'Nuovo blocco nella scheda, sotto la sintonia: «🧬 Cosa ti ha preso di questo gioco?». Tocchi i tratti che ti hanno preso davvero (👍), anche una piccola parte; di nuovo per 👎. È il modo più forte per insegnarmi PERCHÉ ti piace un gioco che sembra fuori dal tuo genere: ogni tratto che segni pesa subito sui tuoi gusti, sulla sintonia e sui consigli. I tratti tratteggiati sono quelli che ho riconosciuto io.',
    '😍 Procione «approved»: quando un gioco ha una sintonia altissima con il tuo DNA (80% o più, nessuna cosa che eviti, profilo con almeno 6 giochi) compare nella sintonia della scheda e accanto alla % nella lista.',
    'Una sola percentuale in tutta l\'app: il vecchio «DNA di compatibilità» (solo generi e voto) ora usa la stessa % della Sintonia (anche per «Più adatti a te» e nelle righe della lista).',
    '🔁 «Se ti è piaciuto questo, prova anche» riscritto: conta i tratti in comune pesati per rarità (un tratto raro dice più di uno che hanno tutti) e per i TUOI gusti, la struttura (difficoltà, grinding, storia, ritmo), i simboli e la qualità (niente consigli mediocri); la saga è in una riga a parte. Ogni consiglio dice perché (icone dei tratti) e la sua % per te. Se nessun gioco è abbastanza simile non ne mostro: meglio niente che un consiglio sbagliato.',
  ]},
  {version:'v194', date:'2026-10-01', time:'14:35', items:[
    'Nuovo «🎛️ Fonti e lucchetti» (⚙️ Impostazioni → Dati e fonti, o ✨): scegli da quale fonte prendere OGNI informazione (voto, anno, generi, lingua, storia, pro e contro, perché piacerti, come regge oggi, gameplay, ore, colpo d\'occhio) oppure «non toccare mai». C\'è anche «Applica tutto da solo»: Update+ e «Aggiorna info» correggono senza chiederti l\'ok (resta la conferma solo per i casi con ⚠️) e tutto si annulla dalla cronologia.',
    'Nella scheda di ogni gioco il pulsante «🎛️ Fonti» (vicino a Update V+): scegli la fonte solo per quel gioco, premi «↻ Prendi adesso», vedi prima/dopo e con «Usa questa e blocca 🔒» il dato resta fermo: nessun aggiornamento automatico o in background lo cambia più (finché non togli il lucchetto).',
    'Il contatore Update+ in home ora sta piccolo e fisso a destra della riga «Database aggiornato».',
    'Anteprima nella scheda: la locandina ufficiale si vede SEMPRE prima, ferma (aspetto che sia caricata), poi parte il carosello. Almeno 5 schermate quando possibile (Steam + RAWG insieme, con RAWG fino a 12). Nuove impostazioni: tempo della locandina iniziale, tempo di ogni schermata, locandina tra un giro e l\'altro, effetto (zoom lento, dissolvenza, scorrimento, panoramica).',
    'Il radar a 8 punte diventa «🎯 Sintonia con i tuoi gusti»: un cerchio con la % di sintonia, poi i tuoi 10 gusti più forti come barre in ordine, con ✓ su quelli che ha il gioco. Dentro ci sono anche i simboli 💕🤝✨💉 del gioco, spiegati e collegati ai tuoi gusti.',
    'Ordine di lettura della scheda: prima la storia e il colpo d\'occhio, poi la sintonia con i tuoi gusti, perché potrebbe piacerti, gameplay, pro e contro; dettagli tecnici in fondo.',
    'Ricaricando la pagina resti nella vista dove eri (es. Novità) invece di tornare alla classifica.',
    'OpenCritic SENZA chiave e senza limiti: ogni notte il server legge il voto dalle pagine pubbliche di OpenCritic per i giochi che Metacritic non ha (trovati tramite Wikidata). Oggi: 28 voti in più. La tua chiave RapidAPI ora serve solo come riserva.',
    'Giro notturno: i voti ora si fanno prima delle colonne sonore (che sono lente: 150 giochi a notte).',
  ]},
  {version:'v193', date:'2026-10-01', time:'13:54', items:[
    'Gemini, falso allarme corretto: Google spesso elenca insieme il limite al minuto e quello al giorno; bastava la parola «giorno» per mettere in pausa il modello principale fino al mattino dopo. Ora la pausa scatta solo se è davvero finita la quota del giorno; altrimenti aspetto i secondi indicati e riprovo. Le pause messe per errore sono state tolte.',
    'La Diagnostica prova DAVVERO il modello principale di Gemini: se risponde toglie la pausa; se è al limite dice se è il limite del minuto o del giorno e che intanto il modello leggero funziona.',
    'Orari in ora italiana: nel rapporto e nel registro (prima alcuni erano nell\'ora di Londra, 2 ore indietro) e la pausa di Gemini dice «oggi/domani alle … (ora italiana)».',
  ]},
  {version:'v192', date:'2026-10-01', time:'13:09', items:[
    'Diagnostica: per il ponte personale da aggiornare il rapporto diceva per errore «LIMITE» e non mostrava il pulsante «🌉 Copia il codice nuovo del ponte». Ora dice «PONTE da aggiornare» e il pulsante compare.',
  ]},
  {version:'v191', date:'2026-10-01', time:'11:54', items:[
    'Controllo generale: tutte le viste, 15 schede aperte e riaperte, le 28 voci del menu ✨ e la Diagnostica, su telefono e computer, anche con 1365 giochi: nessun errore, avvio in circa 0,3 secondi.',
    '«Aggiorna info» senza rete diceva «non ho trovato questo titolo»: ora dice chiaramente che le fonti non rispondono (rete assente o bloccata) e di riprovare.',
    'Se tieni l\'app aperta a lungo, quando esce una versione nuova compare in basso «✨ È uscita la vNNN: tocca per aggiornare» (prima restavi sulla vecchia finché non la riaprivi).',
    'Giro notturno: se una versione nuova veniva pubblicata mentre il server lavorava, alla fine i dati raccolti non si salvavano (ore perse). Ora li mette sopra la versione nuova e riprova fino a 4 volte.',
    'Misuratore della memoria del browser (circa 5 milioni di caratteri per sito): nel rapporto della Diagnostica e con un avviso se supera il 70%. Con circa 2.500-3.000 giochi aggiunti andrà spostata in una memoria più grande.',
  ]},
  {version:'v190', date:'2026-10-01', time:'11:40', items:[
    'Ricerca nelle fonti, sistemata a strati. 1) Il giro notturno non partiva più per un mio errore nella v188 (due punti nel nome di un passaggio): corretto, e ora controllo il file a ogni versione.',
    '2) Il server ora lavora per TUTTI i giochi, anche i ~600 che hai aggiunto tu (prima solo i 765 di base): ogni notte prende lingue, prezzo, Metascore e colonne sonore dei giochi nuovi; il lunedì rinfresca quelli vecchi. Mai tutto da capo: solo nuovi o vecchi di 7/30 giorni, con un tetto per notte (va bene anche con 10.000 giochi).',
    '3) Memoria delle risposte sul telefono: la stessa domanda a Wikipedia, Wikidata, Steam, RAWG ecc. non si rifà per giorni (meno «troppe richieste», ricerche più veloci). Se un sito è giù, uso l\'ultima risposta buona (fino a 90 giorni) invece di fallire.',
    '4) Gemini: le richieste partono in fila e distanziate (niente raffiche), se Google dice «aspetta 20 secondi» aspetto e riprovo, se è finita la quota del GIORNO di un modello lo salto fino a domattina e uso quello leggero.',
    '5) Ponte personale: se un sito risponde «non trovato» il ponte non viene più messo in pausa per sbaglio (prima perdevi Steam per 10 minuti). Nuova versione 2 del ponte (codice copiabile dalla Diagnostica): legge anche Metacritic ufficiale DAL VIVO, così un gioco aggiunto oggi ha subito il voto verificato, senza aspettare la notte.',
    '6) Il rapporto della Diagnostica dice anche la versione del ponte, la memoria delle risposte e i modelli Gemini in pausa.',
  ]},
  {version:'v189', date:'2026-10-01', time:'11:25', items:[
    'Controllo fonti dal tuo telefono: 12 su 12 funzionano, Steam passa dal ponte personale. I ponti pubblici sono quasi tutti morti (4-8% di successo): ora quelli con troppi fallimenti vengono saltati e, quando c\'è il ponte personale, se ne prova solo uno pubblico di scorta. Meno attese a vuoto.',
  ]},
  {version:'v188', date:'2026-10-01', time:'11:35', items:[
    'Fonti: ho provato una per una tutte le fonti dal server. Risultato: Steam, Metacritic, OpenCritic e YouTube funzionano; il problema è che Steam e Metacritic NON si lasciano leggere dal browser (blocco CORS) e i ponti pubblici sono morti o lenti. Wikipedia/Wikidata rispondono «troppe richieste» se si insiste. OpenCritic ha chiuso l\'accesso libero (solo chiave limitata).',
    'Soluzione definitiva: ogni notte GitHub (dal server, senza blocchi né chiavi né limiti) legge il Metascore UFFICIALE da metacritic.com per tutti i giochi, anche quelli che aggiungi tu, e lo salva in un archivio (voti.js). Update+ lo usa per primo: voto verificato «Metacritic (sito ufficiale)» istantaneo, senza ponti e senza consumare OpenCritic.',
    'Diagnostica fonti: il pulsante «🩺 Prova le fonti e fai il rapporto» fa chiamate vere a ogni fonte (una alla volta) e dà DUE rapporti: uno facile da leggere e uno tecnico da copiare e incollare a Claude (esito, tempo, via usata, ponti, errore preciso, di chi è il problema).',
    'L\'archivio voti è incrementale: ogni notte controlla solo i giochi nuovi o controllati da più di 30 giorni (massimo 3000 a notte), quindi anche con 10.000 giochi non rilegge tutto.',
    'La «Mappa delle fonti» ora mostra anche l\'archivio ufficiale e, quando una fonte non risponde, dice di chi è il problema (il sito, il browser o il limite di una chiave) e cosa fare.',
  ]},
  {version:'v187', date:'2026-10-01', time:'10:34', items:[
    'Corretto il «loop» di etichette in cima alla scheda (Capire il gioco, Giocarlo bene, Il tuo stato…): quando la scheda veniva ridisegnata (per esempio da Update V+) le etichette vecchie si accumulavano. Ora ce n\'è una sola per strato e non spariscono più solo premendo Update V+.',
    'Popup «Aggiornare la password?» di Google: i quattro campi delle chiavi sono testo a pallini già nel file della pagina (non più campi password trasformati dopo), così Chrome non li riconosce. Se compare ancora, cancella la voce salvata in Chrome → Gestore password → raccoon/kur0chanx.github.io.',
    'Nuovo «⭐ Importa i miei preferiti da un elenco» (✨ → Il tuo gusto): scrivi i giochi che ami (c\'è già il tuo elenco), li cerca nel database, segni tra i preferiti quelli trovati (con * tutta la saga) e puoi aggiungere con ＋ quelli che mancano. Serve ad allenare subito «I tuoi gusti».',
    'La sincronizzazione con GitHub ora aspetta 15 secondi dopo l\'ultima modifica (prima 4): durante Update V+ faceva decine di chiamate al gist, ora ne fa poche. Il link «↗ Metacritic ufficiale» ora si legge anche sul tema scuro.'
  ]},
  {version:'v186', date:'2026-10-01', time:'10:11', items:[
    'Riquadro «🌅 Oggi» sotto la barra di ricerca e UN SOLO avviso all\'avvio: i palloncini sparsi dei primi secondi (Radar, prezzi sotto soglia, uscite, backup) vengono raccolti in un unico «🌅 Oggi: N novità per te. Tocca per vederle». Dentro trovi gli avvisi con il pulsante Apri, «Cosa è cambiato mentre non c\'eri» (modifiche automatiche ai tuoi giochi dall\'ultima volta e novità del programma), i giochi che stai giocando, la wishlist (prossime uscite e prezzi sotto soglia) e il gioco più adatto a te ora con le meccaniche che tocca. Con «✎ Scegli cosa vedere» decidi quali riquadri mostrare e in che ordine.',
    'Nuovo «🧩 Moduli» (✨ → Moduli): interruttori per Musica e suoni, Anteprima cinematografica, Guida e Compagno, Radar di gusto, Blocchi extra della scheda, Frugu e Animazioni. Le funzioni spente non partono al prossimo avvio; i dati restano. Qui accendi o spegni anche la scheda in ordine di importanza, il menu in stanze e il riquadro Oggi, e togli le pulci.',
    'Nuovo «⚙️ Impostazioni (tutto in un posto)» (✨ → Impostazioni): Aspetto, Chiavi e sincronizzazione, Dati e fonti, Avvisi, Funzioni, con ricerca e «Ripristina» per l\'aspetto. Ogni riga apre la schermata che già conoscevi: niente è stato spostato di nascosto.'
  ]},
  {version:'v185', date:'2026-10-01', time:'10:08', items:[
    'Scheda a strati con la «pulce» 📌: tutto resta visibile scorrendo, ma in ordine di importanza. In alto identità, voto e verdetto; poi «🔎 Capire il gioco» (generi, storia, etichetta, gameplay, pro e contro, longevità…), «🎮 Giocarlo bene» (come iniziare, compagno, saga), «📋 Il tuo stato», «🛒 Comprare» (prezzo e versioni: ora in fondo), «🔁 Altri giochi» e «📚 Per approfondire». Su ogni blocco c\'è la pulce: toccala e quel blocco sale subito sotto il verdetto, per tutti i giochi (ritocca per toglierlo). Se un gioco è «In corso» salgono prima il compagno e il tuo stato. Nessuna informazione è stata tolta. Si spegne dai Moduli.',
    'Menu ✨ in stanze: Scopri, Il tuo gusto, Aspetto e comportamento, Condividi e mostra, Dati e manutenzione. In cima una casella «Cerca una funzione…» (scrivi «backup» e trova subito la voce), le tue funzioni preferite (pulce) e quelle usate di recente. Le stanze ricordano se le hai aperte.'
  ]},
  {version:'v184', date:'2026-10-01', time:'10:04', items:[
    'Nuovi blocchi in fondo a ogni scheda: «🧬 Eredi e radici spirituali» (cerca su Wikipedia le frasi «spiritual successor to…»; se hai Gemini anche sul web; i giochi trovati si aprono o si aggiungono con ＋), «🎬 Dietro le quinte» (4 ricerche già pronte su interviste, documentari, diari di sviluppo e retrospettive + «Come è nato» da Wikipedia), «🚪 Punto d\'uscita» (per i giochi sopra le 15 ore: storia principale contro completista, giudizio sulla durata e difetti di ritmo segnalati; con Gemini cerca nelle recensioni dove cala) e «📷 Il mio album» (le tue foto e screenshot per gioco, solo su questo dispositivo; si possono scattare, aggiungere in gruppo, ingrandire e cancellare).',
    'Nuove voci in ✨: «🪜 Scala d\'ingresso a un genere» (i giochi del genere in tre scalini: per iniziare, per prendere confidenza, per esperti; con filtro «solo con italiano»), «📷 Screenshot nell\'album» (scegli degli screenshot: con la chiave Gemini riconosco il gioco, altrimenti lo scegli tu) e «📅 Uscite nel calendario» (crea un file .ics con le date di uscita della wishlist e un promemoria il giorno prima e quello stesso; il pulsante c\'è anche dentro la Wishlist).',
    'Scheda più robusta: se un altro pezzo del programma la ridisegna mentre è aperta, Verdetto d\'acquisto e «Come iniziare al meglio» tornano al loro posto da soli. La nota «voto verificato» ora dice la fonte vera (es. Metacritic), non sempre «Metacritic/OpenCritic».'
  ]},
  {version:'v183', date:'2026-10-01', time:'09:56', items:[
    '«I tuoi gusti» ora capisce le MECCANICHE, non solo i generi: caccia al loot e drop rate, build e min-maxing, crescita e potenza visibile, sfida che premia strategia e ottimizzazione, effetto dopamina, gratificazione dello sforzo, farming con beneficio tangibile, collezionabili. Per ogni gioco le riconosce da trama dei pro, «perché ti piace», note di gameplay, loop e ore (tutto sul dispositivo, senza AI).',
    'Le meccaniche le puoi anche dire tu: in «I tuoi gusti» tocca una meccanica per «mi piace» 👍, ancora per «la evito» 👎, ancora per toglierla. Quello che dici pesa subito (anche con pochi giochi segnati) e si somma a quello che l\'app impara dai tuoi preferiti, giocati, droppati, voti e tier list; sotto ogni meccanica imparata vedi da quali giochi l\'ha capito.',
    'Schermata più chiara: spiega a cosa serve, dice quanto è affidabile il profilo (debole / discreto / affidabile), raggruppa le meccaniche in alto, poi generi e stile; «Da provare» mostra con delle icone quali delle tue meccaniche ha ogni gioco. Le meccaniche entrano anche nel Radar di gusto, nel verdetto d\'acquisto, in «Più adatti a te» e nei consigli di Chiedi.'
  ]},
  {version:'v182', date:'2026-10-01', time:'09:52', items:[
    'Home più ordinata: dopo i contatori dei tier, fonti, epoche, voto, scheda, stato, generi e umore, «Solo preferiti», «Sorprendimi», «Più adatti a te», «Cosa gioco stasera?», Reset e gli strumenti stanno in un solo riquadro «Altri filtri». Anche da chiuso dice cosa è attivo (es. «2 attivi: Metacritic · Anni 2000»). Nessuna funzione tolta; i filtri rapidi (Preferiti, Giocati…) e i contatori restano in vista.',
    'La mia tier list rifatta da capo, per capirla al primo sguardo: un riquadro «Come funziona» in 3 passi; due modi, «Solo i miei giochi» (predefinito: vedi solo quelli che hai classificato, senza il rumore dei filtri e delle liste della home) e «Tutti i giochi» (come prima, parte dalla classifica ufficiale); «Da classificare» propone i giochi che hai segnato Giocati/In corso/Preferiti; cercando un gioco compare «Scegli tier»; il tier si sceglie con una finestra a grandi tasti S+ … F (si cambia toccando di nuovo il tier). Il trascinamento col dito resta. «Ricomincia da zero» ora chiede conferma.'
  ]},
  {version:'v181', date:'2026-10-01', time:'09:48', items:[
    'OpenCritic non finisce più subito: ora lo si interroga solo se Metacritic non ha dato nessun voto (prima partiva per ogni gioco), la risposta si ricorda 45 giorni (14 se il gioco non c\'è) e, quando il gioco è già noto, si salta la ricerca: da due richieste a gioco a quasi zero. Il piano gratuito resta di circa 200 al giorno (non si può alzare senza pagare).',
    'Generi dalle fonti: «Update V+» ora cerca i generi su Wikidata, RAWG e Steam. I generi che le fonti riconoscono (Soulslike, Action-RPG, Dungeon Crawler, Horror, Metroidvania…) diventano quelli del gioco: aggiunge i confermati e toglie quelli che nessuna fonte conferma. JRPG/WRPG, «A turni», Crossover, Remake, Guerra e Gacha non si possono verificare e restano. Se un genere sposterebbe il gioco fuori da RPG/JRPG chiede conferma; se le fonti dicono solo «RPG» non cambia niente. Con «Rifai Update V+» lo applichi ai giochi già fatti. Ogni cambio finisce nella cronologia con Annulla.',
    'Nuovo «🔄 Aggiorna saghe» nella vista Saghe: per ogni saga cerca su Wikidata (e su RAWG se hai la chiave) i capitoli che mancano e, per i giochi senza saga, le serie a cui appartengono, e li aggiunge da solo (fino a 30 giochi per volta, poi premi di nuovo; si può fermare). Salta platform, corse e picchiaduro: la lista resta di RPG/JRPG.',
    'Accanto alla fonte del voto, nella scheda, c\'è «↗ Metacritic ufficiale»: apre la ricerca sul sito di Metacritic per controllare a mano.'
  ]},
  {version:'v180', date:'2026-10-01', time:'09:40', items:[
    'Anteprima cinematografica sistemata: la copertina non si riaffaccia più per errore mentre scorrono le schermate. Ora il giro è: schermate di gioco → copertina ferma per qualche secondo → di nuovo le schermate, e così via.',
    'Nuovo «🗑️ Elimina» in fondo a ogni scheda, con doppia conferma (secondo tocco + domanda finale). I giochi aggiunti da te spariscono anche sugli altri dispositivi; quelli della classifica di base vengono solo nascosti. Sparisce anche da preferiti, stati, tua tier list e wishlist.',
    'Player musicale: ora sta fisso sotto la barra di ricerca, non ti segue mentre scorri, non copre nulla e scompare quando apri una scheda (che ha già il suo). ■ lo ferma e lo chiude. Chi preferisce quello mobile lo riattiva da ✨ → Suoni e musica.',
    'Colonne sonore: se un gioco non ha brani cerca su YouTube con tre tentativi in ordine («nome OST music», «nome soundtrack», «nome playlist complete music») e scarta video che non c\'entrano. Nuovo tasto 🔎 nel player della scheda: scrivi tu le parole, scegli il brano e resta salvato per quel gioco. La preparazione settimanale ora cerca anche i giochi aggiunti da te e ha già riempito 22 giochi di base che mancavano.',
    'Google non propone più «Aggiornare la password?»: i campi delle chiavi (Gemini, RAWG, OpenCritic, token GitHub) e quello dell\'accesso non sono più campi password per il telefono (restano a pallini).'
  ]},
  {version:'v179', date:'2026-10-01', time:'03:47', items:[
    'Correzione sulla vibrazione: funziona su Android e su iPhone (da iOS 17.4). L\'iPad non ha il motorino della vibrazione, quindi lì non si sente nulla: prima la schermata «Movimento e vibrazione» e questo elenco dicevano il contrario. Ora lo dicono chiaramente.'
  ]},
  {version:'v178', date:'2026-10-01', time:'03:26', items:[
    'Temi grafici: le scritte dei contatori attivi (Tutti, S, A…) nei filtri ora si leggono bene in ogni tema, e il tier ND del tema Fumetto ha di nuovo il testo scuro sulla stella bianca. Controllo automatico dei contrasti su 15 schermate per tutti i 20 temi, chiaro e scuro.'
  ]},
  {version:'v177', date:'2026-10-01', time:'03:13', items:[
    'Avvisi di prezzo a soglia: nella wishlist ogni gioco ha «🔔 Avvisami sotto X €» (Imposta/Cambia/Togli) e nel Verdetto d\'acquisto «Aspetta uno sconto» c\'è il pulsante «🔔 Avvisami a X €» con il prezzo giusto già calcolato. All\'apertura dell\'app (e dopo ogni controllo dei prezzi) compare il palloncino «🔔 … costa X €: sotto i tuoi Y €», che toccato apre la wishlist; con le notifiche attive arriva anche quella del telefono. Prezzi Steam dai dati settimanali dei server (CheapShark in dollari: conversione indicativa).',
    'Nuovo «🕸️ Radar di gusto»: i tuoi 8 gusti più forti disegnati a ragnatela (animata), dentro «I tuoi gusti» e, nella scheda di ogni gioco, sotto il verdetto: i punti si accendono sui gusti che quel gioco tocca e una riga dice quanti sono e se ha anche cose che di solito eviti. Calcolato sul dispositivo dal modello dei gusti, senza AI; compare quando hai segnato almeno 3 giochi.'
  ]},
  {version:'v176', date:'2026-10-01', time:'03:06', items:[
    'Animazioni più fluide: le righe della classifica entrano a cascata; sul telefono la scheda si apre «allargandosi» dalla riga che hai toccato; passando da una sezione all\'altra dalla barra in basso (o con lo swipe) la pagina scivola mentre le barre restano ferme; nella scheda il voto salta e conta fino al valore; i preferiti esplodono in scintille; i pulsanti si schiacciano e tornano con un piccolo rimbalzo.',
    'Vibrazione brevissima al tocco: su Android una vibrazione, su iPhone (da iOS 17.4) il «tic» del sistema (l\'iPad non ha il motorino della vibrazione e non vibra), anche quando compare e quando rilasci l\'anteprima a pressione. Si regola da ✨ → «Movimento e vibrazione», dove si spengono anche le animazioni (si fermano da sole con «riduci animazioni» del telefono).',
    'Pagine vuote curate: quando non c\'è nessun risultato (filtri, ricerca nella tua tier list, saghe, wishlist) compare Frugu nel bidone con una frase chiara e il pulsante giusto (Azzera i filtri, Chiedi a Frugu, Cancella la ricerca, Scopri giochi).',
    'Più veloce a vedersi: la classifica mostra subito righe «scheletro» che brillano mentre arrivano i dati, la riga si illumina appena la tocchi, la copertina nella scheda ha un riflesso finché non è pronta e il sito si collega in anticipo al servizio delle copertine.',
    'Tipografia: cifre di voti, anni e contatori tutte della stessa larghezza (niente più «ballo» mentre cambiano), titoli bilanciati, paragrafi senza parole sole a fine riga, sillabazione italiana nei testi lunghi e righe più comode nelle trame.'
  ]},
  {version:'v175', date:'2026-10-01', time:'02:57', items:[
    'Nuovi «🧩 Set di icone» (✨ → Set di icone, o dal selettore dei temi): 20 stili per tutte le icone dell\'app (bottoni, barra in basso, liste, schede), ridisegnati al volo da quelle di prima. Fantasy (oro inciso), Sci-fi (mirino HUD), Horror (inchiostro e sangue), Retro (pixel 8-bit), Cyberpunk (neon), Steampunk (ottone), Anime (adesivo), Fumetto (pop-art); tre minimal (linea sottile, linea spessa, solido); duotone, schizzo a pennarello, gessetto, vetrata, olografico, carta ritagliata, blueprint, timbro ed emoji.',
    '«Automatico» (predefinito) abbina le icone al tema grafico scelto (Pixel Quest → pixel, Retrowave → neon, Fumetto → pop-art, Grimorio → oro…); «Originale» riporta il gel lucido di sempre. Le anteprime del selettore sono le icone vere di ogni stile. Il pixel 8-bit si prepara una volta sola e poi resta salvato.'
  ]},
  {version:'v174', date:'2026-10-01', time:'02:46', items:[
    'Nuovi «🎭 Temi grafici» (✨ → Temi grafici, oppure dal pulsante in 🎨 Palette colori): 20 stili completi, ognuno con colori, forme, scritte, sfondo animato e aspetto dei tier tutti suoi. Videogiochi retro: Pixel Quest, Finestre JRPG, Sala giochi, Terminale, Retrowave. Fantasy: Grimorio, Taverna, Vapore, Washi. Carta e design: Quaderno, Bauhaus, Art Déco, Fumetto, Noir, Brutale. Luci e mondi: Aero, Olografico, Abissi, Nebulosa, HUD tattico.',
    'Il selettore mostra l\'anteprima vera di ogni tema (chiaro o scuro, come ce l\'ha il tuo telefono) e si cambia con un tocco. Molti temi hanno sia chiaro sia scuro e seguono il pulsante Tema; gli altri hanno un solo aspetto e te lo dicono. «Originale» riporta il vetro lucido con le palette di sempre.',
    'Con un tema attivo i colori restano quelli del tema (il colore dalla copertina si mette in pausa) e la barra del telefono prende il colore del tema. Gli sfondi si muovono (stelle, bolle, griglia neon, braci, ingranaggi…): si fermano con l\'interruttore in fondo al selettore o da soli con «riduci animazioni» del telefono. I font sono dentro il sito (nessun servizio esterno) e si scaricano solo quando scegli quel tema.'
  ]},
  {version:'v173', date:'2026-10-01', time:'01:50', items:[
    'Nuova «🚀 Come iniziare al meglio» in ogni scheda: una guida breve e senza spoiler, preparata dalle fonti e dalla ricerca web (Gemini) una volta sola per gioco: impostazioni da scegliere prima di cominciare, scelte iniziali, errori da evitare, «quando ingrana» (con una barra che mostra dopo quante ore) e quanto provarlo prima di decidere. Resta salvata e si condivide con gli altri dispositivi.',
    'Nuovo «🦝 Compagno di gioco» per i giochi «In corso»: scrivi a che punto sei e cosa ti blocca, scegli quanto aiuto vuoi (💡 un indizio, 🧭 una strategia, 📖 la soluzione) e la risposta resta sfocata finché non la tocchi, per non rovinarti la sorpresa. Tiene un diario delle ultime domande.',
    'Il «palloncino misterioso» all\'avvio era l\'avviso del Radar delle uscite (nuovi giochi adatti a te): ora toccandolo si apre davvero il Radar. Lo stesso per l\'avviso dei prezzi/uscite della wishlist e per quelli del backup e dello spazio.'
  ]},
  {version:'v172', date:'2026-10-01', time:'01:46', items:[
    'Scheda cinematografica: aprendo un gioco la copertina resta ferma in alto per qualche secondo, poi passa con dissolvenze alle schermate ufficiali di gioco (store Steam, scaricate dai server ogni settimana per 292 giochi; per gli altri, da RAWG se hai la chiave), con barra di avanzamento e musica che continua. Nessun filmato: pochi dati e pochi spoiler.',
    'Si regola da ✨ → «Anteprima cinematografica»: interruttore, secondi di copertina ferma (3, 5, 8, 12). Si spegne da sola con il risparmio dati o «riduci animazioni».'
  ]},
  {version:'v171', date:'2026-10-01', time:'01:35', items:[
    'Nuovo «Verdetto d\'acquisto» in ogni scheda (pillola sotto il titolo e riquadro completo): Compralo, Aspetta uno sconto, Giocalo senza spendere, Lascialo stare, Mancano i dati oppure Ce l\'hai già. È calcolato sul tuo dispositivo (nessuna AI) da voto e fonte, compatibilità coi tuoi gusti, prezzo su Steam, abbonamenti, andamento delle recensioni recenti, lingua, ore e quanti giochi hai già in coda, e spiega sempre i motivi.',
    'Anche «Chiedi» usa lo stesso verdetto: se gli fotografi una copertina o gli chiedi «lo prendo?», ti risponde con lo stesso esito e gli stessi motivi della scheda.'
  ]},
  {version:'v170', date:'2026-10-01', time:'01:30', items:[
    'Scheda del gioco stabile: il vero motivo dello sfarfallio era la cornice della copertina, che cambiava forma quando l\'immagine finiva di caricarsi (da 8 scatti misurati a zero). Ora la cornice è fissa e la copertina appare in dissolvenza; il tema colorato della copertina si ricorda e si applica subito, e passa dolcemente invece di scattare.',
    'Palloncini (notifiche): il tocco non passa più alla riga sotto. Era questo il «palloncino misterioso» che apriva un gioco a caso: toccandolo, il tocco arrivava alla lista dietro. Ora toccare un palloncino lo chiude e basta.',
    'Approvazioni: si applicano da sole anche i dati che riempiono un campo vuoto (trama, pro e contro, ore, lingua…), perché non possono peggiorare nulla. In coda restano solo le proposte davvero dubbie.',
    'Player musica: nuovo piccolo grip ⠿ per spostarlo subito (senza tenere premuto) e lucchetto 🔒 con un semplice tocco per bloccarlo; quando non lo usi diventa più discreto.',
    'Anteprima a pressione unica (l\'altra, vecchia, è spenta): tieni premuto il titolo e rilasciando sparisce.'
  ]},
  {version:'v169', date:'2026-09-30', time:'01:16', items:[
    'Approvazioni automatiche: il voto da fonte in ordine di priorità (Metacritic → OpenCritic → RAWG), la lingua italiana e i giochi affini ora si applicano da soli, anche quelli rimasti in coda. Una fonte meno affidabile non sostituisce mai Metacritic. Si chiede conferma solo per scarti sopra 15 punti (probabile gioco sbagliato), generi, anno e testi riscritti.',
    'Anteprima a pressione più piccola: tieni premuto il titolo, compare l\'anteprima; rilasci il dito e sparisce, tornando alla lista. Per aprire la scheda basta un tocco.',
    'Scheda del gioco a schermo intero sul telefono e stabile: niente sfocature né animazioni nel primo secondo, quindi niente sfarfallio.',
    'Vibrazione brevissima al tocco di pulsanti, icone e righe (solo Android; su iPad non esiste).'
  ]},
  {version:'v168', date:'2026-09-30', time:'00:23', items:[
    'Niente più lampeggi: quando un gioco si aggiorna in background la riga non rifà l\'animazione d\'ingresso e, se nulla cambia, non viene nemmeno toccata.',
    'Il pulsante in alto «Novità» (aggiornamenti del programma) ora si chiama «News» e dentro ha «🔄 Riavvia e aggiorna»: ricarica subito il programma con l\'ultima versione, senza filmato iniziale e senza chiudere e riaprire l\'app.',
    'Gesto o tasto «indietro» del telefono: dentro una scheda (o news, chiedi, profilo…) torna indietro di una pagina invece di uscire dal programma.',
    'Tieni premuto il titolo di un gioco nella classifica: si apre un\'anteprima veloce con copertina, voto, fonte, trama breve e «fa per te se / lascia stare se», con «Apri la scheda» per entrare.'
  ]},
  {version:'v167', date:'2026-09-30', time:'00:08', items:[
    'Nuova «🧭 Mappa fonti» (in Diagnostica fonti: 5 tocchi sulla riga «Database aggiornato…»): per ogni dato mostra l\'ordine delle fonti (voto, anno, generi, lingua, storia, pro e contro, a colpo d\'occhio, ore, prezzo) e con «Verifica ora» controlla se ogni fonte funziona adesso (✅ funziona, ⚠️ problema con il motivo, ➖ chiave mancante).'
  ]},
  {version:'v166', date:'2026-09-30', time:'00:07', items:[
    'Colonna Fonte pulita: una sola icona per significato, niente doppioni. Metacritic (M gialla, anche per i vecchi ✅ e V+), OpenCritic (rosso), RAWG (R) e Stima (il tuo logo, al posto della scatola blu). Lo stesso simbolo compare nella scheda del gioco.',
    'Regola dei voti in background: prima Metacritic, poi OpenCritic, poi RAWG. Se un sito ti blocca o la quota giornaliera è finita, usa la fonte successiva e riprova il giorno dopo; se il gioco semplicemente non c\'è su quella fonte, tiene la successiva e non riprova più. Se nessuna delle tre lo trova resta «Stima». Lo stato viene condiviso con gli altri dispositivi, così non ripetono le stesse richieste.'
  ]},
  {version:'v165', date:'2026-09-30', time:'23:37', items:[
    'Dispositivi nuovi: all\'avvio scaricano da soli il catalogo condiviso (giochi aggiunti dal telefono, correzioni, Update V+ già fatti, fonti dei voti). Quindi niente più 753 giochi e niente Update+ da zero: parte solo da ciò che manca.',
    '«🔑 Accedi / Nuovo utente»: Accedi (utente + password) porta chiavi, sincronizzazione e tutto il profilo come sul telefono; Nuovo utente crea un profilo con tutti i giochi e le schede ma con preferiti, tier, classifiche e recensioni solo suoi. Il pulsante «📱 QR» mostra il codice da inquadrare con l\'altro dispositivo: si apre il programma già sulla schermata di accesso.',
    '«☁️ Salva chiavi» ora salva cifrate anche il token di sincronizzazione, così un solo accesso basta per avere tutto.'
  ]},
  {version:'v164', date:'2026-09-30', time:'23:34', items:[
    'Colonna «Fonte» con i loghi: M gialla = Metacritic, cerchio rosso = OpenCritic, R = RAWG, «STIMA» = voto non verificato. Il filtro «Tutte le fonti» ora permette di scegliere una fonte precisa (Metacritic, OpenCritic, RAWG, stima). Finché la fonte di un voto verificato non è registrata resta il simbolo verde.'
  ]},
  {version:'v163', date:'2026-09-30', time:'23:00', items:[
    'Chiavi in due tocchi: «☁️ Salva chiavi» (sul dispositivo che le ha) e «☁️ Recupera chiavi» (sul nuovo): chiedono solo utente (Mario) e password. Le chiavi, cifrate con la password, stanno in un gist del tuo GitHub; niente codici da copiare a mano.'
  ]},
  {version:'v162', date:'2026-09-30', time:'22:52', items:[
    '«🔐 Cifra le chiavi»: il codice cifrato ora compare sempre a schermo in una finestra (prima, se la copia negli appunti riusciva, non si vedeva nulla).'
  ]},
  {version:'v161', date:'2026-09-30', time:'22:44', items:[
    'Chiavi dentro il programma, cifrate: in ⚙️ Chiedi a Claude, «🔐 Cifra le chiavi» crea un codice protetto da una tua password (profilo + password, almeno 12 caratteri); una volta inserito nel programma, su qualsiasi dispositivo basta «🔓 Recupera chiavi»: scegli il profilo, scrivi la password e le chiavi mancanti vengono aggiunte e quelle diverse sostituite. Nel codice non c\'è mai nessuna chiave in chiaro né la password. Restano anche Copia e Incolla.'
  ]},
  {version:'v160', date:'2026-09-30', time:'22:34', items:[
    'iPad, tastiera: l\'app installata sulla schermata Home era impostata a «schermo intero», che su iOS impedisce alla tastiera di aprirsi. Ora è una normale app (standalone) e funziona anche in orizzontale. Per applicare la modifica: elimina l\'icona dalla Home e rifai «Aggiungi alla schermata Home».'
  ]},
  {version:'v159', date:'2026-09-30', time:'22:16', items:[
    'iPad: la tastiera non si apriva perché l\'app entrava a schermo intero al primo tocco (su iOS lì la tastiera è bloccata). Ora su iPad/iPhone non entra più a schermo intero da sola, e se si tocca un campo di testo in schermo intero ne esce subito.',
    'Microfono di «Chiedi» su iPad/iPhone: apre la tastiera e ti ricorda di usare il microfono di sistema, perché la dettatura del sito non parte in modo affidabile su iOS.'
  ]},
  {version:'v158', date:'2026-09-30', time:'22:11', items:[
    'Le chiavi (Gemini, RAWG, OpenCritic) e il ponte restano su ogni dispositivo: ora in ⚙️ Chiedi a Claude ci sono «📤 Copia le mie chiavi» e «📥 Incolla le chiavi» per portarle da un dispositivo all\'altro in un attimo (per esempio sull\'iPad). Non passano da backup, file o sincronizzazione.',
    'Il messaggio «chiave non impostata» nella ricerca del voto spiega ora che basta copiarla dall\'altro dispositivo.'
  ]},
  {version:'v157', date:'2026-09-30', time:'22:08', items:[
    'iPad e tablet: la barra in basso è più grande (icone e scritte ingrandite) e raccolta al centro, invece di icone minuscole sparse su tutta la larghezza.'
  ]},
  {version:'v156', date:'2026-09-30', time:'22:04', items:[
    'Su iPad e sugli altri tablet (schermo touch), anche aggiunto alla schermata Home e in orizzontale, ora compare la barra con le icone in basso (Classifica, Scopri, Novità, Chiedi…) come sul telefono.'
  ]},
  {version:'v155', date:'2026-09-30', time:'21:55', items:[
    'Ricerca del voto con priorità fissa: 1) Metacritic (Wikipedia, Steam, CheapShark) → 2) OpenCritic → 3) RAWG. Una fonte meno affidabile non sostituisce mai una più affidabile; se un voto veniva già da Metacritic resta quello.',
    'Se una fonte non arriva al sito lo dice chiaramente: nella scheda compare «Ricerca del voto» con un simbolo per ogni fonte (✅ trovato, ➖ non trovato, ⚠️ problema) e il motivo: chiave non impostata, accesso negato o permessi mancanti, quota finita, sito che blocca, non raggiungibile. Gli stessi avvisi compaiono a fine Update V+, nella ricerca di nuovi giochi e in Diagnostica fonti.'
  ]},
  {version:'v154', date:'2026-09-30', time:'21:31', items:[
    'Risolto il problema serio per cui Update V+ sembrava non servire a nulla: nei giochi aggiunti (es. Bayonetta) il completamento automatico dell\'AI, partito prima, scriveva alla fine una copia vecchia della scheda e cancellava il voto verificato, i generi e i testi appena aggiornati (e viceversa). Ora ogni salvataggio parte sempre dall\'ultima versione della scheda.',
    'Nei giochi aggiunti i generi sono al massimo 3 (prima le fonti potevano aggiungerne 5-6 sbagliati, come Soulslike o Looter Shooter su Bayonetta).',
    'Nelle novità dell\'app ogni versione mostra ora anche l\'orario, oltre alla data.'
  ]},
  {version:'v153', date:'2026-09-30', time:'21:24', items:[
    'Nuovo rank «ND» (voto non disponibile), sotto tutti gli altri: i giochi aggiunti dalla ricerca o da Chiedi il cui voto NON è verificato da Metacritic o OpenCritic ci finiscono da soli, invece di un S+ inventato dall\'AI. Quando Update V+ trova un voto vero, il gioco passa al rank giusto. I giochi della tua classifica curata a mano non cambiano.'
  ]},
  {version:'v152', date:'2026-09-30', time:'21:13', items:[
    'Update+ e «Aggiorna info» sono un solo pulsante: «Update V+». Le modifiche dubbie (voto molto diverso) restano da approvare col pulsante 📝.',
    'Ogni voto dice da dove viene: «Voto preso da Metacritic (da Wikipedia/Steam/RAWG)». Se non c\'è Metacritic lo segnala («Nessun Metacritic trovato»: OpenCritic oppure stima). Il Metacritic ora sostituisce da solo il voto anche nei giochi già verificati, se la differenza è fino a 6 punti (oltre, chiede conferma). Nei prossimi giorni i 765 giochi vengono ricontrollati 40 alla volta.',
    'Ricerca nuovi giochi più severa: prima di proporre un titolo ne controllo il voto reale (Metacritic/OpenCritic). Se non lo trovo, il voto è segnato «stima» e non può superare 79 (tier C): basta titoli sconosciuti con S+ inventato dall\'AI. Sotto 50 di voto reale viene scartato.',
    'Affidabilità dei dati: corretto il motivo per cui restava al 90% («manca: analisi»). Bastava che l\'AI lasciasse vuoto un solo campo (es. lingua o ore) per perdere tutta l\'analisi; ora basta il nucleo (voto nel tempo, come regge oggi, gameplay) e ore/riedizioni/lingua sono facoltativi. Update V+ completa l\'analisi se manca.'
  ]},
  {version:'v151', date:'2026-09-30', time:'20:55', items:[
    'Quando un voto diventa verificato (V), la nota «voto e dettagli sono una stima» viene sostituita da «voto verificato», sia nei giochi nuovi sia in quelli già aggiunti (es. Dark Souls).'
  ]},
  {version:'v150', date:'2026-09-30', time:'20:40', items:[
    'Corretto il vero motivo per cui il voto restava «stima»: nei giochi aggiunti da te (es. Dark Souls) l\'app non salvava mai il segno di voto verificato, anche quando Update+ o «Aggiorna info» trovavano il Metacritic. Ora viene salvato e il gioco diventa V+. Basta ripremere Update+ sulla scheda.'
  ]},
  {version:'v149', date:'2026-09-30', time:'14:42', items:[
    'Update+ ricontrolla i giochi aggiornati in passato il cui voto è ancora una stima (prima li considerava finiti e non li toccava più): ora sono di nuovo in coda, i più deboli per primi. Puoi anche premere Update+ nella scheda per farlo subito.',
    'Il voto Metacritic (o OpenCritic) di un gioco ancora «stima» si applica da solo anche ai giochi di base, senza chiedere conferma, e diventa V+. Prima finiva nell\'elenco «da approvare», dove nessuno lo vedeva.'
  ]},
  {version:'v148', date:'2026-10-19', items:[
    'OpenCritic come seconda fonte dei voti: se hai una chiave gratuita (rapidapi.com → «OpenCritic API») incollala in ⚙️ Chiedi a Claude. Update+ e «Aggiorna info» la usano quando Metacritic non ha il gioco: una stima diventa verificata con la media dei critici. La chiave resta solo sul tuo dispositivo, non finisce nei backup né nella sincronizzazione.'
  ]},
  {version:'v147', date:'2026-10-18', items:[
    'Update+ si fida di tutte le fonti del Metacritic: Wikipedia, Steam, CheapShark e anche RAWG. Un voto ancora «stima» viene sostituito da solo con il Metascore e diventa verificato (V+). Prima il Metascore di RAWG veniva ignorato dal giro automatico.'
  ]},
  {version:'v146', date:'2026-10-17', items:[
    'Voto verificato più affidabile: Update+ e «Aggiorna info» ora leggono il Metascore anche per i giochi su più piattaforme (es. Dark Souls, con un voto per PC, PS3 e Xbox: vale il più alto) e, se Wikipedia non lo riporta, lo prendono da Steam o CheapShark. Un voto ancora «stima» diventa verificato (V+) con il Metacritic reale.'
  ]},
  {version:'v145', date:'2026-10-16', items:[
    'Il Triple Triad è diventato un gioco a parte: Raccoon Triad (kur0chanx.github.io/raccoon-triad). Nel menu ✨ trovi «Raccoon Triad» che lo apre; i vecchi link d\'invito portano lì. La collezione già fatta si ritrova perché il sito è sullo stesso dominio. Qui la Tier List è più leggera.'
  ]},
  {version:'v144', date:'2026-10-15', items:[
    'Update+ ora toglie i generi che nessuna fonte conferma (Wikidata, RAWG, Steam): un gioco narrativo non resta più segnato Soulslike o Action-RPG. Prima Update+ sapeva solo aggiungere generi.',
    'Se Metacritic (da Wikipedia) conferma il voto che era ancora una stima, il gioco diventa verificato e mostra V+ invece del pacchetto blu. Il pacchetto blu resta solo quando nessuna fonte affidabile conferma il voto, e ora il suggerimento lo spiega.'
  ]},
  {version:'v143', date:'2026-10-14', items:[
    'Triple Triad: ogni carta ha il suo PERSONAGGIO iconico e la scena da cui è tratto (Cloud, Samus, Link…), non più la copertina del gioco. Le illustrazioni artistiche si aggiungono in triad-img/ (cartella e istruzioni pronte, con i testi per generarle); finché mancano si vedono le immagini di prima.',
    '6 versioni di ogni carta, tutte solo estetiche (i numeri non cambiano): Normale, Holo, Reverse Holo, Full Art, Oro e Segreta, con riflessi in stile carte collezionabili. Le buste possono farle uscire e valgono più polvere.',
    'Doppio tocco (o doppio clic) su una carta: si ingrandisce e la muovi in 3D col dito o inclinando il telefono, con riflessi e rilievi; puoi anche provare le altre versioni e gli stili.',
    'Nuove regole di equilibrio: caselle speciali (+2 e −2), limite di punti del mazzo nelle stanze online, Sfida del giorno con regole diverse e serie di vittorie, Arena (peschi il mazzo da zero, 3 vittorie = carta in premio) e stagioni mensili con ELO ridotto a metà e premi ai primi 3.'
  ]},
  {version:'v142', date:'2026-10-13', items:[
    'Triple Triad 3.0, il gioco che non finisce mai. Monete, XP e livelli (premi ad ogni livello, buste in regalo ogni 5, 10 e 25). Negozio di buste (Base, Rara, Epica, Leggendaria) con apertura animata: strappi la busta e giri le carte una a una, con anelli colorati per la rarità, scintille, tremolio e suoni crescenti. Ogni busta ha la «fortuna garantita»: dopo un po\' di buste senza carte forti, la prossima è sicura. Carte foil ✨ più brillanti e preziose.',
    'Ogni giorno nuove missioni giornaliere e settimanali, ricompensa quotidiana con serie e busta al 7° giorno, weekend con monete doppie. 38 traguardi con medaglie e premi, e collezioni da completare (per livello, per genere, per espansione e tutto l\'album) con ricompense grosse.',
    'Officina: le copie doppie si smontano in polvere e con la polvere crei le carte che ti mancano (fino al livello 8; le carte di livello 9-10 si vincono o si rubano). Le carte forti restano in poche copie nel mondo.',
    'Espansioni (DLC): 4 nuove serie da 30 carte, Sogni JRPG, Arcade & Retro, Notte Horror e Indie & Cult, che si sbloccano salendo di livello, con buste dedicate e album a parte. Se ne possono aggiungere altre in qualsiasi momento senza toccare l\'app.',
    'Torre infinita (senza server): scegli 5 carte e sali piano dopo piano; dopo ogni vittoria scegli un potenziamento (+1 ai lati, elementi, carte più forti, prima mossa…), ogni 10 piani c\'è un Guardiano e ogni piano è più duro. Se perdi, i piani superati ti fruttano carte per l\'album.'
  ]},
  {version:'v141', date:'2026-10-12', items:[
    'Triple Triad 2.0, rifatto da zero. 200 carte solo di giochi che conoscono tutti (Mario, Zelda, Tetris, Pac-Man, Doom, Minecraft, GTA, Elden Ring…), in 10 livelli che seguono i tier della tua lista (E → S+) e 6 rarità (Comune → Mitica). Regole complete di Final Fantasy VIII: Base, Elementale, Same, Same-Muro, Plus, Combo e Morte improvvisa; scambi Uno, Diff, Diretto e Tutto. Le regole sono in un motore unico con 38 prove automatiche.',
    'Grafica delle carte a tua scelta: 6 stili (Classico, Olografico, Pixel 16-bit, Copertina, Neon, Emblema), scelti per tutte o per una sola carta. Per ogni carta scegli anche l\'immagine (copertine da Steam, Libretro e Wikipedia) oppure metti una tua foto. Nessuna carta resta senza grafica: se manca l\'immagine c\'è l\'Emblema disegnato, e l\'app cerca da sola quella vera.',
    'Sfide online con i tuoi amici: ognuno ha il suo account (nome unico, codice amico e codice di recupero) legato a un solo telefono. Amici con richiesta, codice o QR; stanze con codice e QR; sfide dirette in tempo reale. In una Sfida vera le carte sono in palio e chi vince le ruba (con la notizia «ti ha rubato…» e il tasto per riprendertela); nelle Amichevoli non si perde nulla. ELO e gradi da Recluta a Maestro Triad, classifica, timer per mossa con mossa automatica, resa, emoticon e rivincita. Il server decide le mosse: nessuno può barare.',
    'Le carte non si regalano né si comprano: si vincono. Le carte forti esistono in poche copie nel mondo (si vede quante sono state create), 10 Custodi da battere per guadagnarne di nuove (senza rischiare le tue) e una ricompensa al giorno. Se ti restano meno di 5 carte ti aiuto io con carte comuni.',
    'Sul tavolo: anteprima della mossa (vedi cosa prendi prima di giocare), carte che si girano a catena, scritte SAME · PLUS · COMBO, bonus +1/−1 degli elementi, suoni, vibrazione e 7 temi del tavolo. Allenamento contro 11 avversari con IA da 1 a 5, e due giocatori sullo stesso telefono con schermo «passa il telefono». Il token dell\'account resta solo su questo telefono (mai nei backup né nel Gist).'
  ]},
  {version:'v140', date:'2026-10-11', items:[
    'Scorrimento sistemato davvero: toccando le righe della tabella la pagina a volte non si muoveva (mentre sopra, sui filtri, sì). Era un blocco «anti tira-per-aggiornare» messo sulla tabella e sul pannello dei filtri: se la tabella aveva anche solo 1 pixel di scorrimento in più, il dito restava intrappolato lì. Ora lo scorrimento passa sempre alla pagina, e il blocco del «tira per aggiornare» sta sulla pagina intera. Con i filtri aperti scorre tutta la pagina e l\'intestazione delle colonne resta fissa in alto.'
  ]},
  {version:'v139', date:'2026-10-11', items:[
    'Tolto il «+» giallo accanto al nome dei giochi (lista, copertine, schede compatte, La mia Tier List): restano solo la V+ dorata nella colonna del voto. Per sapere se un gioco è già aggiornato con Update+ apri la scheda: c\'è il badge, la riga con la data e le fonti usate, e il pulsante «Rifai Update+». Un gioco già aggiornato non viene più ripreso dall\'aggiornamento automatico (solo i prezzi).'
  ]},
  {version:'v138', date:'2026-10-11', items:[
    'Scorrimento della classifica di nuovo fluido: quando un gioco aggiunto da te veniva aggiornato in background (Update+ o completamento delle schede) l\'app ridisegnava tutta la lista e si bloccava per quasi mezzo secondo ogni volta. Ora cambia solo la riga di quel gioco, e i ridisegni completi aspettano che tu smetta di toccare lo schermo.'
  ]},
  {version:'v137', date:'2026-10-10', items:[
    'Update+ sceglie per ogni dato la fonte più attendibile: voto = Metacritic (Wikipedia) → Steam dal vivo → dati settimanali → CheapShark; anno = Wikidata → Steam → CheapShark → RAWG; lingua = Steam → PCGamingWiki → it.wikipedia; storia = Wikipedia → RAWG → Steam (riscritta dall\'AI solo dalle fonti, con Gemini). Da Steam dal vivo ora prende anche Metascore, anno, generi e prezzo.',
    'Niente più sfarfallio: l\'aggiornamento in background cambia solo il simbolo del gioco interessato, senza ridisegnare la lista.',
    'Frugu vive solo nel menu ✨ (tolta l\'icona sospesa).',
    'Il player della musica si sposta dove vuoi: tienilo premuto e trascinalo; la posizione resta salvata («Rimetti il player al suo posto» in ✨ → Suoni e musica).',
    'Colonne sonore disponibili per 699 giochi.'
  ]},
  {version:'v136', date:'2026-10-09', items:[
    'Riparata la pubblicazione: la v135 non era arrivata sul sito (per questo non vedevi Update+ e la V dorata). Ora la V+ dorata è un\'etichetta ben visibile nella colonna del voto e nella scheda.',
    'La lente sulla locandina cerca molte più immagini del gioco (locandine Steam HD, box art, copertine di Wikipedia in 6 lingue, immagini di Wikidata, banner, schermate) e ogni tocco ne mostra una nuova diversa da quella attuale, partendo dalla migliore.',
    '🔮 Oracolo del procione: descrivi una sensazione («voglio piangere ma con combattimenti a turni») e trova i giochi che te la fanno provare.',
    'Condividi con un QR: la tua tier list in sola lettura per gli amici, oppure «Regala l\'app»: l\'amico ha la sua copia con il suo nome e i suoi dati; il tuo utente resta blindato (nessun dato o chiave nel link).',
    'Previsione del voto: la scheda dice quanto ti piacerà un gioco; dopo averlo giocato gli dai il tuo voto e l\'app impara (precisione in «I tuoi gusti»).',
    'La tua recensione a voce: detti, l\'AI sistema il testo senza cambiare le tue opinioni (vedi prima e dopo e scegli tu), la salvi e puoi fartela leggere; anche «Ascolta la scheda del gioco».'
  ]},
  {version:'v135', date:'2026-10-08', items:[
    'Update+ ora si vede e si può forzare: pulsante «Update+ adesso» nella scheda, contatore sotto «Database aggiornato», logo dorato anche nella Mia tier; basta che risponda una fonte (sono elencate toccando il simbolo).',
    'Scheda gioco: prova del nove sul voto (quante fonti sono d\'accordo), termometro Steam (recensioni degli ultimi 30 giorni contro quelle di sempre), rischio introvabile, percorso della saga con ore e prezzi, «Quale versione conviene?», «Segna come posseduto», cronologia delle modifiche con Annulla.',
    'Nuovo nel menu ✨: Radar delle uscite (ogni notte), I tuoi gusti (imparati: cosa ami, cosa eviti, cosa accetti «nonostante»), Tier list animata (video), Modalità vetrina, Scansiona lo scaffale, Gesti rapidi, Copertine per l\'offline, Rapporto qualità notturno, Tema dalla copertina.',
    'Colonne sonore: premi ▶ in una scheda e ogni gioco che apri suona la sua; ■ la ferma ovunque. Puoi scegliere un altro brano. 15 temi di suoni per i pulsanti (spenti di default).',
    'Frugu, il procione da compagnia: fame, sete, sonno, bagnetto, medicine, coccole, minigiochi, negozio di accessori; cresce e da adulto prende la forma del genere che giochi di più.',
    'Triple Triad di Frugu: 500 carte dai tuoi giochi in 10 livelli, tutte le regole di FF8 (Open, Same, Same Wall, Plus, Combo, Elemental, Random, Sudden Death; scambi One, Diff, Direct, All), 11 avversari con carte rare e 4 livelli di intelligenza.',
    'Ricerca con le sigle (ff7, ffx, dq11, p5r, xc3), analisi dei giochi in 4 pezzi (aggiornamenti più leggeri), prezzi, radar e controllo qualità ogni notte su GitHub.'
  ]},
  {version:'v134', date:'2026-10-07', items:[
    'La cornice della locandina si adatta sempre da sola alla forma dell\'immagine e allo spazio della scheda: tolto il pulsante del formato. Resta la lente per cercare un\'altra immagine.'
  ]},
  {version:'v133', date:'2026-10-06', items:[
    'La locandina nella scheda non viene più tagliata: si vede intera su uno sfondo sfocato dei suoi stessi colori.',
    'Due mini-pulsanti sulla locandina: «adatta» cambia il formato della cornice (automatico, verticale 3:4, quadrata, orizzontale 4:3, panorama 16:9) e lo ricorda per ogni gioco; la lente cerca un\'altra immagine (box art, Wikipedia, RAWG, banner) e le fa scorrere una per volta, salvando quella scelta.'
  ]},
  {version:'v132', date:'2026-10-05', items:[
    'Il simbolo Update+ ora è un piccolo logo dorato con un «+»: compare nella lista, nella scheda e anche nella griglia delle copertine. Sui giochi con voto verificato e Update+ completato la V verde diventa una V dorata.',
    'Le locandine trovate (in automatico o con «Aggiorna locandina») restano salvate nell\'app e, con la sincronizzazione attiva, si ritrovano su ogni tuo dispositivo.'
  ]},
  {version:'v131', date:'2026-10-04', items:[
    'Update+: all\'avvio, con calma e in silenzio, l\'app aggiorna da tutte le fonti (nell\'ordine di priorità) le info e la locandina dei giochi, cominciando da quelli con i dati meno attendibili. Ne fa una quarantina per avvio e poi si ferma; ogni gioco viene aggiornato una volta sola. Puoi spegnerlo da ✨ → Controllo dati.',
    'Simbolo dorato (scudo con fulmine) sui giochi con Update+ completato (serve che almeno 2 fonti abbiano risposto); simbolo viola (scudo con lente) sui giochi che hai controllato tu con «Aggiorna info». Toccandolo vedi data e fonti.',
    'Dopo il cuore, il gioco accettato viene aggiornato subito con tutte le fonti. I giochi aggiunti da te ricevono le correzioni sicure; quelli di base mandano le proposte in «Controllo dati», dove decidi tu.',
    'Prezzi aggiornati ogni notte da GitHub (anche a telefono spento); il lunedì il giro completo.'
  ]},
  {version:'v130', date:'2026-10-03', items:[
    'Torna il pulsante «Aggiorna locandina» nella scheda dei giochi che hanno già una copertina: la riscarica dalle fonti online (Steam, Libretro, Wikipedia, RAWG). Senza copertina resta «Trova copertina», che parte anche da solo.'
  ]},
  {version:'v129', date:'2026-10-03', items:[
    'Ogni ricerca («Fruga altri titoli» e «Fruga per genere») ora raccoglie fino a 60 giochi (prima 30): sono ancora leggeri per la libreria.',
    'Nuovo pulsante «Accetta tutto»: aggiunge in un colpo solo tutte le proposte e poi mostra l\'elenco essenziale dei giochi accettati (nome, voto, tier, piattaforma, anno, genere).'
  ]},
  {version:'v128', date:'2026-10-02', items:[
    'Ricerca e informazioni dei giochi (la priorità): ogni settimana un processo automatico raccoglie da Steam, GOG, CheapShark e Wikipedia i dati «di fatto» (lingua italiana ufficiale, prezzi, voti, anni) e un grande elenco di giochi da scoprire; «Fruga altri titoli» lo usa subito, senza attese. Corretti gli id dei tag Steam.',
    'Le fonti hanno un ordine di priorità: «Fruga» interroga prima le più affidabili e veloci (elenco settimanale, RAWG, Steam, GOG) e per ultime le mediocri (Reddit, SteamSpy); chi rende di più viene usata più spesso.',
    'Avvio più veloce: le analisi dei giochi stanno in un file a parte che si carica dopo la lista. L\'app funziona anche offline e i dati salvati si uniscono per singolo gioco tra dispositivi.',
    'Nel menu ✨: backup con promemoria mensile e controllo dello spazio, livello del procione, cronologia da giocatore, carta profilo da condividere, prezzi in wishlist, backlog e affidabilità dei dati in Statistiche, joypad. Il controllo dati segnala anche i simboli non distintivi.',
    'Icone a tema videogioco al posto delle emoji in filtri, Chiedi, impostazioni e scheda gioco; testi resi neutri (niente più «Claude ti propone»).'
  ]},
  {version:'v127', date:'2026-10-01', items:[
    'La colonna dei libri (📖) ora mostra la lingua italiana di ogni gioco: ITA = testi e doppiaggio, sub = sottotitoli, fan = traduzione dei fan, no = nessuna, ? = non ancora verificata. Non viene più tagliata a destra.',
    'Lista più lunga (arriva fino alla barra in basso); badge «da approvare» e freccia «Torna su» più piccoli; icone a tema videogioco anche nei pulsanti «Fruga altri titoli», «Fruga per genere», «Aggiorna info», preferiti e capitoli mancanti.',
    'Ponte personale facoltativo (Cloudflare Worker gratuito, codice in tools/cloudflare-worker.js) per riattivare Steam, GOG e Reddit; GOG corretto (genere «rpg»).'
  ]},
  {version:'v126', date:'2026-09-30', items:[
    'Sicurezza: le richieste con chiave (RAWG) non passano più dai ponti pubblici e il registro diagnostico nasconde le chiavi anche negli indirizzi annidati; il registro già salvato viene ripulito.',
    'Ricerca più veloce e stabile: massimo di richieste contemporanee per sito, pausa automatica per le fonti mute (Steam e Reddit dietro ponti morti), Wikipedia sempre in accesso diretto, verifica dei giochi appena aggiunti uno alla volta e con fonti leggere, trama di una frase nelle proposte (la trama completa arriva con il ♥).',
    'RAWG: gli «affini» ora usano generi e tag distintivi (la lista suggerita di RAWG è solo a pagamento).'
  ]},
  {version:'v125', date:'2026-09-30', items:[
    'RAWG (chiave gratuita in ⚙️) usata ovunque: scoperta di giochi con anni, generi e ordinamenti sempre diversi, uscite dell\'ultimo anno e in arrivo, giochi affini ai tuoi preferiti, capitoli mancanti delle saghe (elenco ufficiale della serie), controllo di anno e voto Metacritic nel controllo dati e in «Aggiorna info», descrizione come fonte per le trame, giochi affini nelle schede e copertina di riserva.',
    'Icone a tema videogioco al posto di quelle lineari: barra delle viste (pergamena, inventario, carte, bacchetta), ricerca (lente a gradiente), generi (joypad, globo), preferiti (stella d\'oro). La finestra Chiedi non nasconde più il messaggio iniziale sotto le impostazioni; pulsante «Diagnostica fonti» in ⚙️.'
  ]},
  {version:'v124', date:'2026-09-30', items:[
    'Ricerca senza sosta: 9 fonti dirette (CheapShark, categorie e ricerca di Wikipedia, Wikidata, SteamSpy, Steam, GOG, RAWG, Reddit) alternate alle ricerche AI. Se una via è bloccata: attesa e nuovo tentativo, poi una catena di ponti pubblici che impara da sola quali funzionano; se una fonte resta muta si passa subito alla successiva, con pause crescenti e strategie diverse fino al tempo massimo di 8 minuti o al tuo «Basta frugare!».',
    'Le chiamate a Wikipedia, Wikidata, Steam e PCGamingWiki di «Aggiorna info» e del controllo dati passano dalla stessa catena di vie alternative. I nomi consigliati nei forum vengono verificati su Wikipedia prima di entrare.'
  ]},
  {version:'v123', date:'2026-09-30', items:[
    'Barra in basso: «Chiedi» al posto di «Per genere» (il selettore per genere è ora sotto «Fruga altri titoli» nella schermata Novità); tolto il pulsante flottante rosa. Badge «da approvare» in basso a sinistra, speculare a «Torna su». Impostazioni senza testo coperto.',
    'Ricerca: fonti di riserva istantanee (RAWG con chiave gratuita facoltativa e Wikidata) se le altre restano vuote o bloccate; stato live nel box di caricamento con frasi a tema Frugu Frugu; registro diagnostico nascosto (5 tocchi su «Database aggiornato…» o ?debug=1) con fonte, esito, tempi e status HTTP, senza chiavi.'
  ]},
  {version:'v122', date:'2026-09-30', items:[
    '⚡ Controllo dati Turbo (✨ → Controllo dati): un gioco ogni ~12 secondi, fino a 800 al giorno, per finire il giro di tutto il database più in fretta. Il controllo ora prosegue con Gemini anche se Wikipedia/Wikidata non rispondono.'
  ]},
  {version:'v121', date:'2026-09-30', items:[
    'A colpo d\'occhio più coerente: peso storia, ore e grinding sono calibrati (roguelite e tattici: ore di una run, sblocchi contati nel grinding) e «Fa per te se / Lascia stare se» sono sempre in seconda persona.',
    'Consigli «Se ti è piaciuto prova anche» con affinità reale (genere principale, saga, epoca, struttura di gioco) e senza generi incompatibili come horror per un action indie.',
    'Saghe automatiche: i giochi aggiunti e quelli non mappati si raggruppano per titolo; pulsante «Capitoli mancanti» per cercarli online.',
    'Mia Tier: barra di ricerca, salto rapido ai tier e trascinamento col dito (tieni premuto). Pulsante Chiedi al centro in basso senza tastiera automatica e con microfono; badge «da approvare» piccolo; avvisi sempre sopra la barra di navigazione.',
    'Generi: barra con i più usati + «Tutti i generi», selettore a gruppi espandibili con ricerca e 92 generi/sottogeneri. Novità: filtro per genere immediato, rotazione automatica dei generi e modello Gemini configurabile. Freccia del Tier corretta (▼).'
  ]},
  {version:'v120', date:'2026-09-30', items:[
    'Anche «Aggiorna info» nella scheda del gioco usa ora la revisione a schede scrollabili con «Prima» e «Dopo» separati e un solo gruppo di pulsanti (Approva / Tieni precedente / Decido dopo). Generi: aggiunto JRPG e i generi RPG sono raggruppati in due sezioni.'
  ]},
  {version:'v119', date:'2026-09-30', items:[
    '🦝 Ricerca senza sosta: «Trova nuovi titoli» accumula fino a 30 giochi passando da una fonte all\'altra (Metacritic, Steam, Wikipedia, riviste, Reddit e forum, IGDB/MobyGames…), accetta i giochi da 5/10 in su, mostra il contatore «Giochi trovati nel bidone» e il pulsante «Basta frugare! Mostra bottino».',
    'Scheda di ricerca compatta: titolo, ✕ e ♥ sulla stessa riga. Con il ♥ il gioco viene completato con la scheda intera (trama ricca, a colpo d\'occhio, pro e contro, prima di comprarlo).',
    '❤️ Le mie vibes (in Scopri): lista dei preferiti Top e consigli per atmosfera, sensazioni e meccaniche, dal database e dal web (forum e community).',
    'Revisione delle modifiche: una sola scheda per gioco, «Prima» e «Dopo» separati e testo intero; badge fisso «giochi da approvare». Aggiorna info prova più fonti prima di arrendersi. Intro: «INIZIA A FRUGARE» e titolo più veloce. Avviso di aggiunta piccolo; nuovi generi WRPG, Hack & Slash, Survival Horror, Strategia tattica.'
  ]},
  {version:'v118', date:'2026-09-29', items:[
    'Revisione una modifica alla volta: «Prima» e «Dopo» con i pulsanti ✅ Approva / ↩️ Tieni precedente / ⏭️ Decido dopo. Nella scheda del gioco compare «✅ Aggiornato il…» oppure «📝 N modifiche da approvare».'
  ]},
  {version:'v117', date:'2026-09-29', items:[
    'Un gioco controllato a fondo non viene più ricontrollato (solo con «Ricomincia» o «Aggiorna info»). Il menu ✨ → Controllo dati mostra quante modifiche ci sono da approvare e un avviso compare quando ne arrivano di nuove.'
  ]},
  {version:'v116', date:'2026-09-29', items:[
    '🔎 Controllo dati a fondo: parte subito all\'apertura e, gioco per gioco, controlla voto, anno, generi, lingua, ore, trama, pro/contro e gameplay con Wikipedia/Wikidata e Gemini (ricerca con fonti). Niente viene cambiato da solo: in ✨ → Controllo dati trovi «Da approvare» (prima/dopo + fonti), «Controllati» e «Applicate» con pulsante Annulla. Limite di 200 giochi al giorno e pausa automatica se Gemini è al limite.'
  ]},
  {version:'v115', date:'2026-09-29', items:[
    '🔎 Controllo dati passivo: in background, un gioco ogni ~25 secondi, l\'app confronta voto, anno, generi e doppiaggio italiano con Wikipedia e Wikidata (nessuna AI, nessun costo). Non cambia mai nulla da sola: le proposte si vedono in ✨ → Controllo dati, e si applicano o si ignorano una per una.'
  ]},
  {version:'v114', date:'2026-09-29', items:[
    'Simboli 💕🤝✨💉: il voto non c\'entra più. L\'AI cerca sul gioco e li assegna solo a chi ha qualcosa di unico (una meccanica travolgente o una storia affascinante), anche se il resto del gioco è modesto.'
  ]},
  {version:'v113', date:'2026-09-29', items:[
    'Simboli 💕🤝✨💉 solo dove servono: nei giochi aggiunti l\'AI li assegna ormai di rado (al massimo 1 gioco su 4 per la storia e 1 su 5 per la dopamina) e solo se il gioco ha qualcosa di unico; sotto il voto 85 non compaiono mai.'
  ]},
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
    try{ sessionStorage.setItem('jrpg_intro_seen', '1'); }catch(e){}
    try{ showToast('Riavvio…', 1500); }catch(e){}
    try{ const regs = navigator.serviceWorker && await navigator.serviceWorker.getRegistrations(); if(regs) await Promise.all(regs.map(r=> r.update().catch(()=>{}))); }catch(e){}
    try{ const ks = window.caches && await caches.keys(); if(ks) await Promise.all(ks.filter(k=> /^raccoon-tier/.test(k)).map(k=> caches.delete(k))); }catch(e){}
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
// ---- Affidabilità dei dati di una scheda (0-100): quanto è completa e verificata ----
function dataScore(g, ctx){
  ctx = ctx || {};
  const au = ctx.au || (function(){ try{ return JSON.parse(localStorage.getItem('jrpg_audit') || '{}') || {}; }catch(e){ return {}; } })();
  const ck = ctx.ck || (function(){ try{ return JSON.parse(localStorage.getItem('jrpg_info_checked') || '{}') || {}; }catch(e){ return {}; } })();
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
