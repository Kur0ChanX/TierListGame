// ---- Riconoscitore dei TRATTI dai testi (v209) — condiviso tra app (browser) e strumenti del server (Node) ----
// Da qui le parole-chiave (MRX) che riconoscono loot, build, lore, storia… nei testi di un gioco. Il server lo usa per calcolare
// in anticipo i tratti di ogni gioco (campo «mx» nell'indice), così l'app conosce i tratti anche senza scaricare i testi lunghi.
// Se cambi le parole-chiave qui, rigenera i dati: node tools/build-index.js (lo fa anche data-io.save).
(function(root){
  'use strict';
  const MRX = {
    LOOT: /\b(loot\w*|drop|drop rate|randomi[sz]ed loot|loot casuale|god ?roll|affix\w*|affiss\w*|rarita (a colori|per colore|a gradi|a livelli)|oggetti (viola|arancioni|dorati|leggendari)|bottin\w*|oggetti rari|oggetti leggendari|equipaggiament\w* (raro|rari|unico|unici|leggendari\w*|casuali)|item world|tesori|casse|ricompense casuali|looter|rarita|reliquie|artefatti|armi (rare|uniche|leggendarie)|dungeon generat\w*|generazion\w* procedural\w*)/,
    BUILD: /(\bbuild\b|min-?max\w*|job system|sistema (di )?(job|lavori|mestieri)|class tree|albero delle classi|cross[- ]?class|multiclass\w*|build diversity|varieta di build|sphere grid|griglia (delle )?sfere|license board|sinergi\w*|ottimizz\w* (le |la |il |l.)?(build|equipaggiament\w*|party|squadra|personagg\w*|abilita)|sperimentaz\w* (con|nelle|delle|di) (build|combinazion\w*|abilita|materia|classi|equipaggiament\w*)|premia la sperimentazione|albero (di )?(abilita|talent\w*)|sistema (materia|job|classi|licenze|sfera|di classi|di creazione|di fusione)|multiclasse|crafting|artigianato|fusione (di|dei|delle) (demoni|mostri|persona|armi|abilita|creature)|assemblaggio|personalizzazione (profonda|estrema|totale|quasi infinita|ampia|delle armi|dell.equipaggiamento|del party|dei personaggi|del personaggio|di build)|liberta di (personalizzare|costruire|creare))/,
    POWER: /(power ?trip|overlevel\w*|sovralivell\w*|onnipotent\w*|potenziament\w*|progressione|crescita (del|dei|di)|diventare (sempre )?piu forte|piu forte|livellare|statistiche|numeri (di danno|enormi|esagerati|giganti)|potenza|upgrade|evoluzion\w*|sviluppo del personaggio|power fantasy)/,
    CHALL: /(sfida (appagante|punitiva|estrema|impegnativa|dura|esigente|che premia)|boss (opzional\w*|segret\w*|superboss)|superboss|punitiv\w*|premia (la|i|il|lo|le|chi) (strateg\w*|prepar\w*|rifless\w*|ottimizz\w*|padronanza)|padronanza|preparazione|curva di difficolta|soulslike|roguelike|difficolta (elevata|estrema|alta))/,
    DOPA: /(dopamin\w*|dopamine hit|variable ratio|ricompens\w* variabil\w*|one more (turn|run)|ancora (un turno|una run|una partita)|ricompens\w* (continu\w*|frequent\w*)|gratificazion\w*|loop (coinvolgent\w*|appagant\w*)|incollat\w*|assuefa\w*|dipendenza)/,
    EFFORT: /(premia (l.?impegno|la dedizione|lo sforzo|la pazienza|la perseveranza|la padronanza|l.?ottimizzazione)|gratificant\w*|appagant\w*|soddisfazion\w*|dedizione|sforzo|perseveranz\w*|ricompensa chi)/,
    FARM: /(\bfarm\w*|\bgrind\w*|ripetere|ripetizion\w*|raccolta (di )?risorse|coltivazion\w*|allevament\w*)/,
    COLL: /(collezion\w*|completist\w*|catturare (mostri|creature|pokemon)|cattura di (mostri|creature)|bestiario|reclutare|tutti i (personaggi|mostri)|trofei|oggetti nascosti)/,
    LORE: /(\blore\b|mitologi\w*|leggend\w* (del mondo|antich\w*)|storia del mondo|segreti del mondo|documenti|descrizioni degli oggetti|narrazione ambientale|criptic\w*|frammenti di storia|retroscena)/,
    WORLD: /(world ?building|mondo (vivo|coerente|ricco|dettagliato|vasto|affascinante|credibile|unico|originale)|ambientazione (ricca|originale|unica|dettagliata)|culture|fazioni|nazioni|regni|cosmologi\w*|universo (narrativo|coerente|ricco))/,
    EXPLO: /(esplorazion\w*|esplorare|segreti|aree (nascoste|segrete|opzionali)|scorciatoie|metroidvania|scoperta|scoprire|mappa (aperta|vasta)|open world|mondo aperto|dungeon (opzionali|segreti|nascosti))/,
    CRAFT: /(crafting|craft\w*|creare (oggetti|armi|equipaggiament\w*)|forgiare|fabbricare|alchimia|sintesi|ricette|forgia|potenziare (le )?armi)/,
    RES: /(gestione (delle )?risorse|risorse (limitate|scarse)|scarsita|munizioni (limitate|scarse)|inventario (limitato|ristretto)|economia (del gioco|interna)|survival|sopravvivenza|razion\w*)/,
    SAND: /(sandbox|liberta (totale|di approccio|d.azione)|approcci (diversi|multipli|liberi)|sistemi(c\w*)? (emergent\w*|liber\w*)|emergent\w*|fai (quello|cio) che vuoi|immersive sim|mondo aperto sistemico)/,
    BASE: /(costruzion\w* (della|di una|di) (base|citta|villaggio|accampamento|fortezza)|gestionale|gestire (la|il|un|una) (citta|base|villaggio|squadra|regno|economia)|base operativa|quartier generale|insediament\w*|colonia)/,
    TACT: /(tattic\w*|posizionament\w*|pianific\w*|strategia profonda|profondita strategica|scacchi|formazion\w* (della|di) squadra|sinergie di squadra)/,
    COMBAT: /(combattiment\w* (fluido|appagante|frenetico|profondo|tecnico|spettacolare|preciso|reattivo|stratificato)|parat\w*|parry|schivat\w*|combo|tempismo|sistema di combattimento (eccellente|profondo|appagante|tecnico)|action (fluido|frenetico|tecnico))/,
    STORY: /(trama (avvincente|coinvolgente|memorabile|profonda|emozionante|epica|intricata|matura)|colpi di scena|narrativa (forte|eccellente|matura|coinvolgente|memorabile)|storia (coinvolgente|emozionante|memorabile|epica|toccante|profonda|matura)|finale (memorabile|emozionante|toccante))/,
    CHAR: /(personaggi (carismatic\w*|memorabil\w*|ben scritt\w*|indimenticabil\w*|caratterizzat\w*|profond\w*)|cast (memorabile|carismatico|eccellente|ben scritto|indimenticabile)|legam\w* tra (i )?personaggi|compagni (di viaggio|memorabili)|rapporti tra (i )?personaggi)/,
    CHOICE: /(scelte (morali|che contano|con conseguenze|importanti)|conseguenze|finali multipli|diversi finali|piu finali|bivi|decisioni (che contano|morali)|ramificat\w*)/,
    ATMO: /(atmosfer\w*|direzione artistica|stile (artistico|visivo|unico|inconfondibile)|ambientazione (suggestiva|cupa|onirica|evocativa|gotica)|suggestiv\w*|evocativ\w*|onirico|malinconic\w*|inquietant\w*)/,
    MUSIC: /(colonna sonora (memorabile|splendida|eccellente|indimenticabile|epica|iconica|straordinaria|bellissima|stupenda)|musiche (memorabili|splendide|iconiche|indimenticabili|epiche|bellissime|stupende)|soundtrack (memorabile|iconica)|compost\w* da|uematsu|shimomura|mitsuda|sakimoto|kondo)/,
    SOCIAL: /(cooperativ\w*|\bco-?op\b|multigiocatore|multiplayer|online con|comunita|\bmmo\w*|giocare con (gli )?amici|raid|gilda|pvp)/,
    PUZZ: /(enigm\w*|rompicap\w*|puzzle|indovinell\w*|meccanismi da (capire|risolvere)|logica|ingegno)/,
    PROC: /(procedural\w*|generat\w* (casualmente|proceduralmente|a caso)|roguelit\w*|roguelike|one more run|ancora una run|run (diverse|sempre diverse)|rigiocabil\w*|permadeath|morte permanente)/,
    GACHA: /(gacha|\bwish\b|\bpity\b|banner|evocazion\w* (casual\w*|a pagamento)|\bsummon\w*|estrazion\w* casual\w*|loot ?box)/,
    FEEL: /(game ?feel|juic\w*|feedback (dei colpi|tattile|appagante|soddisfacente)|pesantezza (dei )?colpi|colpi (pesanti|che si sentono)|impatto (dei colpi|fisico)|hit ?stop|controlli (reattivi|precisi|fluidi)|fisicita)/,
    DAILY: /(time ?sink|\bdaily\b|\bweekly\b|reset (giornalier\w*|settimanal\w*)|(missioni|attivita) giornalier\w*|login giornalier\w*|endgame (infinito|senza fine)|impegno quotidiano)/,
    SUPERBOSS: /(superboss|boss (segret\w*|opzional\w*|nascost\w*|facoltativ\w*)|eoni oscuri|dark aeon|weapon (emerald|ruby|omega)|nemici (opzionali|leggendari)|boss piu (duri|difficili))/,
    SUMMON: /(evocazion\w*|\bsummon\w*|\besper\b|\beoni\b|\baeon\w*|guardian force|\bg\.?f\.?\b|evocare)/,
    PARTY: /(gestione (del|della) (party|squadra|gruppo)|cambiare (i )?personaggi|personaggi intercambiabili|composizione (del|della) (party|squadra)|party di \d|squadra di \d|scambiare (i )?membri)/,
    JOURNEY: /(viaggio|pellegrinaggio|avventura epica|odissea|attraverso (il|un) mondo|di tappa in tappa)/,
    ROMANCE: /(storia d.amore|romance|romantic\w*|relazione amorosa|innamorat\w*)/,
    VILLAIN: /(antagonist\w* (memorabil\w*|carismatic\w*|iconic\w*|indimenticabil\w*)|cattivo (memorabile|carismatico|iconico)|villain)/,
    MINI: /(minigioch\w*|mini-gioch\w*|blitzball|triple triad|gioco di carte|corse (dei|di) chocobo|chocobo|casino|gold saucer|pesca)/,
    ENDGAME: /(endgame|post-?game|new game ?\+|ng\+|contenuti (opzionali|extra|post)|dopo la fine|sfide opzionali|attivita secondarie)/,
    LIFE: /(calendari\w*|vita (scolastica|quotidiana|di tutti i giorni)|routine|tempo libero|gestione del tempo|legami social\w*|social link|confidant|confidenti|attivita (quotidiane|del giorno)|simulazione (di vita|sociale)|giorno dopo giorno)/,
    HUMOR: /(umoris\w*|ironi\w*|divertente|comic\w*|scanzonat\w*|esilarant\w*|assurd\w*|parodi\w*|battute)/
  };

  const mnrm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const STORYK = new Set(['LORE', 'WORLD', 'CHAR', 'CHOICE', 'ATMO', 'HUMOR']);
  // tratti che vengono dai TESTI (pro, perché piace, gameplay, ciclo della dopamina, «fa per te se», trama): {mx: [...], cbt: 1 se il testo parla di combattimento}
  function textTraits(g){
    const e = g.enrich || {}, dop = e.dopa || {};
    const txt = mnrm([e.whyLikeIt, e.gameplayNote, (e.pros || []).join(' . '), (dop.loop || []).join(' '), dop.hook, (g.label || {}).ok].join(' . '));
    const txtS = mnrm([g.story, e.agingNote].join(' . '));
    const mx = Object.keys(MRX).filter(k=> MRX[k].test(txt) || (STORYK.has(k) && MRX[k].test(txtS)));
    return {mx, cbt: /(combattiment|parat|schivat|combo)/.test(txt) ? 1 : 0};
  }
  const api = {MRX, mnrm, STORYK, textTraits};
  root.RT_TRATTI = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
