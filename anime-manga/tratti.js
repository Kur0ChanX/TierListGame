// ---- Riconoscitore dei TRATTI di anime, manga e film (versione Anime, dalla v209 dei giochi) — condiviso tra app (browser) e strumenti (Node) ----
// Due fonti: 1) i GENERI/TAG del titolo (sempre presenti, vengono da AniList); 2) le parole-chiave (MRX) nei testi (trama, pro, «perché piace»),
// quando ci sono. Il server calcola in anticipo i tratti di ogni titolo (campo «mx» nell'indice), così l'app li conosce anche senza i testi lunghi.
// Se cambi le parole-chiave o la tabella dei tag qui, rigenera i dati: load() + save() di tools/data-io.js.
(function(root){
  'use strict';
  // parole-chiave nei testi (italiano + inglese, senza accenti: il testo passa da mnrm)
  const MRX = {
    STORY:   /(trama (avvincente|coinvolgente|memorabile|profonda|emozionante|epica|intricata|matura|solida)|storia (coinvolgente|emozionante|memorabile|epica|toccante|profonda|matura)|narrazione (solida|eccellente|matura)|gripping (plot|story)|compelling (plot|story|narrative))/,
    TWIST:   /(colp\w* di scena|plot ?twist|twist\w*|rivelazion\w*|non e (quello|cio) che sembra|finale (sorprendente|inaspettato|scioccante)|ribaltament\w*)/,
    CHAR:    /(personaggi (carismatic\w*|memorabil\w*|ben scritt\w*|indimenticabil\w*|caratterizzat\w*|profond\w*)|cast (memorabile|carismatico|eccellente|ben scritto|indimenticabile)|character development|well[- ]written characters|memorable (cast|characters))/,
    GROWTH:  /(crescita (del|della|dei|personale)|percorso di crescita|romanzo di formazione|coming[- ]of[- ]age|maturazione|diventare (piu forte|adulto|un eroe)|da zero a)/,
    FRIEND:  /(amicizi\w*|nakama|compagni (di avventura|di squadra|inseparabili)|legam\w* (tra|di amicizia|fraterno)|friendship|found family|famiglia (scelta|acquisita))/,
    WORLD:   /(world ?building|mondo (vivo|coerente|ricco|dettagliato|vasto|affascinante|credibile|unico|originale)|ambientazione (ricca|originale|unica|dettagliata)|sistema (di magia|magico|di poteri)|magic system|universo (narrativo|coerente|ricco))/,
    LORE:    /(\blore\b|mitologi\w*|leggend\w*|folklore|segreti del mondo|retroscena|misteri del passato)/,
    ATMO:    /(atmosfer\w*|stile (visivo|unico|inconfondibile)|suggestiv\w*|evocativ\w*|onirico|malinconic\w*|inquietant\w*|atmospheric|melanchol\w*|dreamlike)/,
    ANIM:    /(animazion\w* (spettacolare|fluida|eccezionale|curata|splendida|di altissimo livello)|sakuga|regia (visiva|spettacolare|curata)|combattimenti animati|visivamente (splendid\w*|stupend\w*|spettacolar\w*)|stunning animation|beautifully animated|gorgeous animation)/,
    ART:     /(disegn\w* (splendid\w*|dettagliat\w*|curat\w*|meraviglios\w*|stupend\w*)|tratto (elegante|dettagliato|unico|inconfondibile)|tavole|artwork|chine|art style|gorgeous art|detailed art)/,
    MUSIC:   /(colonna sonora|musiche (memorabili|splendide|iconiche|indimenticabili|epiche|bellissime)|soundtrack|opening (iconica|memorabile|indimenticabile)|sigla|ending (iconica|memorabile)|\bost\b|musica|canzon\w*|band|concert\w*)/,
    EMO:     /(commovent\w*|strappalacrime|lacrime|piangere|toccante|emozionant\w*|struggent\w*|tear[- ]?jerker|heartbreaking|emotional|cuore spezzato)/,
    DARK:    /(cup\w*|violent\w*|brutal\w*|crud\w*|disturbant\w*|tem\w* maturi|traum\w*|tragedi\w*|tragic\w*|dark|gore|sanguinos\w*|disperazion\w*|morte)/,
    MIND:    /(psicologic\w*|introspe\w*|filosofic\w*|esistenzial\w*|riflessiv\w*|mind[- ]?bend\w*|cervellotic\w*|sulla natura (umana|della realta)|psychological|philosophical|existential)/,
    MYST:    /(mister\w*|indagin\w*|investigazion\w*|detective|giall\w*|enigm\w*|deduzion\w*|whodunit|thriller|suspense|tension\w*)/,
    STRAT:   /(strateg\w*|tattic\w*|giochi mentali|mind games|battaglia di (cervelli|ingegno)|piani (geniali|elaborati)|scacchi|duelli di intelligenza|mente brillante|genio)/,
    COMBAT:  /(combattiment\w* (spettacolar\w*|epic\w*|coreografat\w*|adrenalinic\w*|memorabil\w*)|scontri (epici|spettacolari|memorabili)|battaglie (epiche|spettacolari)|fight scenes|epic battles|arti marziali|duell\w*)/,
    POWER:   /(poteri|superpoter\w*|power ?up|livello di potere|power scaling|tornei|torneo|trasformazion\w*|diventare sempre piu forte|overpowered|\bop\b|power fantasy)/,
    HYPE:    /(adrenalin\w*|hype|esaltant\w*|epic\w*|gasante|carica|pelle d.oca|hype moments|goosebumps|exhilarating)/,
    VILLAIN: /(antagonist\w* (memorabil\w*|carismatic\w*|iconic\w*|indimenticabil\w*)|cattiv\w* (memorabil\w*|carismatic\w*|iconic\w*)|villain\w*)/,
    ROMANCE: /(storia d.amore|romance|romantic\w*|relazione amorosa|innamorat\w*|triangolo amoroso|coppia|love story|slow ?burn)/,
    HUMOR:   /(umoris\w*|ironi\w*|divertent\w*|comic\w*|scanzonat\w*|esilarant\w*|assurd\w*|parodi\w*|gag|battute|hilarious|funny|demenzial\w*)/,
    COZY:    /(rilassant\w*|tranquill\w*|riscalda il cuore|leggero|leggerezza|delicat\w*|dolce|wholesome|heartwarming|cozy|comfort|iyashikei|slice of life|vita quotidiana|quotidianita)/,
    JOURNEY: /(viaggio|pellegrinaggio|avventura epica|odissea|road movie|di tappa in tappa|journey|quest)/,
    SCHOOL:  /(scuola|scolastic\w*|liceo|liceal\w*|club (scolastico|del liceo)|compagni di classe|high school|academy|accademia)/,
    SPORT:   /(sport\w*|squadra (di|del) (calcio|basket|pallavolo|baseball)|partit\w*|campionat\w*|allenament\w*|torneo nazionale|agonism\w*)/,
    ISEKAI:  /(isekai|reincarnat\w*|trasportat\w* in un altro mondo|un altro mondo|altro mondo|rinasce|reincarnazione|another world)/,
    MECHA:   /(mecha|robot (gigant\w*|da combattimento)|mobile suit|gundam|pilot\w* (di|del) robot)/,
    SOCIETY: /(critica (sociale|alla societa)|satira|politic\w*|guerra|militar\w*|distopi\w*|potere e corruzione|sistema sociale|discriminazion\w*|social commentary)/,
    LONG:    /(lunghissim\w*|centinaia di episodi|serie lunga|saga (lunga|infinita|monumentale)|long[- ]running|lungo corso)/,
    SHORT:   /(breve|corto|autoconclusiv\w*|in pochi episodi|si guarda in un (giorno|weekend)|binge|tutto d.un fiato|one[- ]shot|volume unico)/
  };

  // tratti dai TAG del titolo (codici in genres.js). Un tag può accendere più tratti.
  const TAGT = {
    ACT: ['COMBAT', 'HYPE'], ADV: ['JOURNEY'], FAN: ['WORLD'], DRA: ['EMO'], ROM: ['ROMANCE'], COM: ['HUMOR'],
    SCI: ['WORLD'], SOL: ['COZY'], IYA: ['COZY'], SUP: ['LORE'], SCH: ['SCHOOL'], POW: ['POWER'], MAR: ['COMBAT', 'POWER'],
    MYS: ['MYST'], PSY: ['MIND'], THR: ['MYST', 'DARK'], CRI: ['MYST', 'DARK'], HOR: ['ATMO', 'DARK'], GOR: ['DARK'],
    SUR: ['DARK'], DYS: ['SOCIETY', 'DARK'], MIL: ['SOCIETY', 'STRAT'], HIS: ['LORE'], MUS: ['MUSIC'], IDO: ['MUSIC'],
    SPO: ['SPORT', 'GROWTH'], ISE: ['ISEKAI', 'WORLD'], GAM: ['STRAT'], MEC: ['MECHA'], TIM: ['TWIST'], VAM: ['ATMO'],
    FAM: ['COZY'], KID: ['COZY'], FOO: ['COZY'], SHO: ['FRIEND', 'GROWTH'], SHJ: ['ROMANCE'], JOS: ['ROMANCE'], SEI: ['MIND']
  };

  const mnrm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const STORYK = new Set(['STORY', 'TWIST', 'CHAR', 'WORLD', 'LORE', 'ATMO', 'EMO', 'DARK', 'MIND', 'MYST', 'ROMANCE', 'HUMOR', 'COZY', 'SOCIETY', 'ISEKAI', 'SCHOOL', 'SPORT', 'MECHA', 'JOURNEY', 'FRIEND', 'GROWTH', 'VILLAIN']);
  // regole a soglia per non accendere tratti «di massa» (DARK, MUSIC…) da una parola sola: qui basta una volta, ma i testi sono brevi e mirati
  function tagTraits(g){
    const out = new Set();
    (g.tags || []).forEach(t=> (TAGT[t] || []).forEach(k=> out.add(k)));
    const n = +g.n || 0, kind = g.kind || '';
    if(kind === 'anime' || kind === 'animazione'){ if(n >= 100) out.add('LONG'); else if(n && n <= 13) out.add('SHORT'); }
    if(kind === 'manga' || kind === 'manhwa'){ if(n >= 60) out.add('LONG'); else if(n && n <= 3) out.add('SHORT'); }
    if(kind === 'film') out.add('SHORT');
    return out;
  }
  // tratti dai TESTI (pro, perché piace, trama…) + dai TAG: {mx: [...], cbt: 1 se si parla di combattimenti}
  function textTraits(g){
    const e = g.enrich || {}, dop = e.dopa || {};
    const txt = mnrm([e.whyLikeIt, e.gameplayNote, (e.pros || []).join(' . '), (dop.loop || []).join(' '), dop.hook, (g.label || {}).ok].join(' . '));
    const txtS = mnrm([g.story, e.agingNote].join(' . '));
    const out = tagTraits(g);
    Object.keys(MRX).forEach(k=>{ if(MRX[k].test(txt) || (STORYK.has(k) && MRX[k].test(txtS))) out.add(k); });
    const mx = Object.keys(MRX).filter(k=> out.has(k));                        // ordine fisso, come MRX
    return {mx, cbt: out.has('COMBAT') || /(combattiment|scontr|battagli|duell)/.test(txt) ? 1 : 0};
  }
  const api = {MRX, TAGT, mnrm, STORYK, tagTraits, textTraits};
  root.RT_TRATTI = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
