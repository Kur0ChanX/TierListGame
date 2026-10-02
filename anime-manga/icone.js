// ---- Set di icone: 20 stili per le icone dell'app (si scelgono a parte, o seguono il tema grafico) ----
// Le icone vere sono i <symbol id="g-…"> dello sprite nell'HTML (gel lucido). Qui le rifaccio al volo in 20 stili diversi
// (oro inciso, HUD, inchiostro, pixel 8-bit, neon, ottone, adesivo, pop-art, linee, solido, schizzo, gesso, vetrata, olografico, carta, blueprint, timbro, emoji):
// ogni stile legge la «ricetta» del simbolo originale (corpo colorato, dettagli bianchi, riflessi, bordo) e la ridisegna.
// Caricato subito dopo lo sprite, prima delle icone, così la pagina nasce già con lo stile giusto (nessun lampo del gel).
// Scelta salvata in atl_icons: 'auto' (segue il tema grafico), 'original' o l'id di uno stile.
(function(){
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', KEY = 'atl_icons', CACHE = 'art_icons_cache';
  const gem = document.getElementById('g-gem');
  if(!gem || !gem.ownerSVGElement) return;
  const sprite = gem.ownerSVGElement, defs = sprite.querySelector('defs');
  const SYM = {}, ORIG = {};
  sprite.querySelectorAll('symbol[id^="g-"]').forEach(s=>{ const n = s.id.slice(2); SYM[n] = s; ORIG[n] = s.innerHTML; });
  const NAMES = Object.keys(SYM);
  const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };

  // ---- lettura dei simboli ----
  const parse = s=> [...new DOMParser().parseFromString('<svg xmlns="' + NS + '">' + s + '</svg>', 'image/svg+xml').documentElement.children];
  const num = (v, d)=> v == null || v === '' ? d : parseFloat(v);
  const GEO = ['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset'];
  const geo = el=> GEO.filter(k=> el.hasAttribute(k)).map(k=> k + '="' + el.getAttribute(k) + '"').join(' ');
  const mk = (el, paint)=> '<' + el.localName + ' ' + geo(el) + ' ' + paint + '/>';
  const keep = el=> '<' + el.localName + ' ' + [...el.attributes].map(a=> a.name + '="' + a.value + '"').join(' ') + '/>';
  const lw = (el, min, mul)=> Math.max(min || 0, num(el.getAttribute('stroke-width'), 1.5) * (mul || 1));
  const line = (c, w, extra)=> `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}`;

  // ruolo di ogni elemento: body (corpo con gradiente) · line (tratto con gradiente) · glyph (dettaglio bianco pieno) · wline (tratto bianco) · shade (ombreggiatura bianca tenue)
  // · hl (riflesso) · rim (filo di luce sul bordo) · tone (grigi/scuri) · tline (tratto di altro colore) · cc (currentColor)
  function info(el, inh){
    const f = el.hasAttribute('fill') ? el.getAttribute('fill') : inh.f, s = el.hasAttribute('stroke') ? el.getAttribute('stroke') : inh.s;
    const fo = num(el.getAttribute('fill-opacity'), 1), so = num(el.getAttribute('stroke-opacity'), 1), op = num(el.getAttribute('opacity'), inh.op == null ? 1 : inh.op);
    let role = 'other', col = null, m;
    if(f && (m = f.match(/url\(#gg-(\w+)\)/)) && !/^(hl|orb)$/.test(m[1])){ role = 'body'; col = m[1]; }
    else if(f && /url\(#gg-(hl|orb)\)/.test(f)) role = 'hl';
    else if(s && /gg-rim/.test(s)) role = 'rim';
    else if(s && (m = s.match(/url\(#gg-(\w+)\)/))){ role = 'line'; col = m[1]; }
    else if(f === '#fff') role = fo * op >= .6 ? 'glyph' : 'shade';
    else if(s === '#fff' && (!f || f === 'none')) role = so * op >= .5 ? 'wline' : 'shade';
    else if(f && f[0] === '#') role = 'tone';
    else if(s && s[0] === '#') role = 'tline';
    else if(f === 'currentColor') role = 'cc';
    return {role, col, fo, so, op};
  }
  function walk(nodes, fn, inh){
    inh = inh || {};
    return nodes.map(el=>{
      if(el.localName === 'g'){
        const ni = {f: el.hasAttribute('fill') ? el.getAttribute('fill') : inh.f, s: el.hasAttribute('stroke') ? el.getAttribute('stroke') : inh.s,
          op: el.hasAttribute('opacity') ? num(el.getAttribute('opacity'), 1) * (inh.op == null ? 1 : inh.op) : inh.op};
        const inner = walk([...el.children], fn, ni);
        return inner ? '<g' + (el.hasAttribute('transform') ? ' transform="' + el.getAttribute('transform') + '"' : '') + '>' + inner + '</g>' : '';
      }
      return fn(el, info(el, inh)) || '';
    }).join('');
  }
  // ricetta: un'azione per ruolo ('keep' = com'era). Ruoli senza regola: hl, rim, shade spariscono; tone, tline, cc restano.
  function build(nodes, rules){
    return walk(nodes, (el, i)=>{
      let f = rules[i.role];
      if(f === undefined) f = ({tone: 'keep', tline: 'keep', cc: 'keep', other: 'keep'})[i.role];
      if(f === undefined || f === null) return '';
      if(f === 'keep') return keep(el);
      return typeof f === 'function' ? f(el, i) : f;
    });
  }
  // misure (serve a capire se un dettaglio è un puntino o una forma, e se sta sopra al corpo)
  let measurer = null;
  function bb(el){
    try{
      if(!measurer){ measurer = document.createElementNS(NS, 'svg'); measurer.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden'); (document.body || document.documentElement).appendChild(measurer); }
      const c = document.importNode(el, true); measurer.appendChild(c); const b = c.getBBox(); measurer.removeChild(c); return b;
    }catch(e){ return {x: 0, y: 0, width: 8, height: 8}; }
  }
  const small = el=>{ const b = bb(el); return b.width * b.height < 12 || Math.min(b.width, b.height) < 2.6; };

  // ---- elementi comuni (riempimenti, filtri) per tutti gli stili: inseriti una volta sola nello sprite ----
  const gradUS = (id, stops, x1, y1, x2, y2)=> `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1 == null ? 6 : x1}" y1="${y1 == null ? 3 : y1}" x2="${x2 == null ? 26 : x2}" y2="${y2 == null ? 29 : y2}">${stops.map((s, i)=> `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${s}"/>`).join('')}</linearGradient>`;
  const DEFS = [
    gradUS('ic-oro', ['#fff3b0', '#f1c24a', '#c98a1e', '#8a5410']), gradUS('ic-ruby', ['#ffa0b4', '#d6284a', '#6e0f2a']), gradUS('ic-zaf', ['#a8dcff', '#2f78d6', '#14306e']),
    gradUS('ic-smer', ['#b0f7c8', '#27b36a', '#0c5a3a']), gradUS('ic-ame', ['#dccbff', '#8a5cf0', '#3a1f8f']),
    gradUS('ic-ottone', ['#f8e2a0', '#d4a040', '#8a5e1c', '#5a3a10']), gradUS('ic-rame', ['#f6bc98', '#c8703c', '#6e3414']), gradUS('ic-patina', ['#b0e4da', '#4fa59a', '#26605a']), gradUS('ic-ferro', ['#c4c4ce', '#707080', '#34343e']),
    gradUS('ic-holo', ['#ff7ac6', '#ffb347', '#5ce0a8', '#4fb8ff', '#a07bff'], 0, 0, 32, 32), gradUS('ic-holo2', ['#a07bff', '#4fb8ff', '#5ce0a8', '#ffb347', '#ff7ac6'], 32, 0, 0, 32),
    '<filter id="ic-glow" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="1.15" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '<filter id="ic-glow-s" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation=".7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '<filter id="ic-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>',
    '<filter id="ic-wobble" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>',
    '<filter id="ic-chalk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" xChannelSelector="R" yChannelSelector="G" result="d"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.12" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>',
    '<filter id="ic-stamp" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" result="d"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.25" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>',
    '<filter id="ic-sticker" x="-15%" y="-15%" width="130%" height="135%"><feDropShadow dx="0" dy=".9" stdDeviation=".8" flood-color="#14102e" flood-opacity=".38"/></filter>',
    '<filter id="ic-soft" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation=".7"/></filter>',
    '<pattern id="ic-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="none"/><path d="M0 1.5h3" stroke="#8a93b8" stroke-opacity=".6" stroke-width=".9"/></pattern>',
    '<pattern id="ic-dots" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".75" fill="#000" fill-opacity=".34"/></pattern>'
  ].join('');
  defs.insertAdjacentHTML('beforeend', DEFS);

  // ---- tavolozze ----
  const INK = '#252a45';
  const GEMS = {gold: 'ic-oro', orange: 'ic-oro', cyan: 'ic-oro', violet: 'ic-oro', indigo: 'ic-ottone', red: 'ic-ruby', pink: 'ic-ruby', green: 'ic-smer'};
  const METAL = {gold: 'ic-ottone', orange: 'ic-ottone', red: 'ic-rame', pink: 'ic-rame', cyan: 'ic-patina', green: 'ic-patina', violet: 'ic-ferro', indigo: 'ic-ferro'};
  const NEON = {cyan: '#00f0ff', pink: '#ff2bd6', violet: '#a35cff', orange: '#ff9a1a', gold: '#ffee00', green: '#39ff88', red: '#ff3355', indigo: '#6a7bff'};
  const HUDC = {cyan: '#00d4ff', violet: '#7ab8ff', indigo: '#7ab8ff', green: '#3dffb0', gold: '#ffb000', orange: '#ffb000', red: '#ff3d5a', pink: '#ff3d5a'};
  const PASTEL = {cyan: '#7fd8ff', pink: '#ff9ad5', violet: '#b9a4ff', orange: '#ffb36b', gold: '#ffd75a', green: '#7be0a4', red: '#ff8a8a', indigo: '#8c93e8'};
  const CHALK = {cyan: '#5cc6f2', pink: '#f78cc4', violet: '#a48cf5', orange: '#f5a45c', gold: '#f2c94c', green: '#58d68d', red: '#f26b6b', indigo: '#7e86e8'};
  const GLASS = {cyan: '#1fa3e6', pink: '#e0409e', violet: '#7a52e0', orange: '#f08a2c', gold: '#f2b705', green: '#1fb870', red: '#e0304a', indigo: '#4a52c4'};
  const POP = {cyan: '#27c6ff', pink: '#ff5fa8', violet: '#8b6bff', orange: '#ff9a2e', gold: '#ffd400', green: '#2fe08a', red: '#ff4a4a', indigo: '#3b4be0'};
  const PAPER = {cyan: '#3ab0ec', pink: '#ee5aa8', violet: '#7d5ae0', orange: '#f58a3c', gold: '#f2bd2c', green: '#2fbf7a', red: '#e8475a', indigo: '#4a52b8'};
  const BLUE = {cyan: '#4d9bf2', pink: '#6fb0ff', violet: '#6a8cf0', orange: '#8cc2ff', gold: '#8cc2ff', green: '#5ab4e8', red: '#7aa8ff', indigo: '#4a7ae0'};
  const col = (T, i)=> T[i.col] || '#999';

  // ---- gli stili ----
  const SETS = [];
  const add = s=> SETS.push(s);

  add({id: 'oro', n: 'Fantasy · Oro inciso', t: 'Oro lucente con rubini, zaffiri e incisioni scure',
    skin: nodes=> build(nodes, {
      body: (el, i)=> mk(el, `fill="url(#${GEMS[i.col]})" stroke="#4a2c0a" stroke-width="1.1" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(`url(#${GEMS[i.col]})`, lw(el, 2))),
      glyph: el=> mk(el, 'fill="#4a2c0a" fill-opacity=".85"'),
      wline: el=> mk(el, line('#4a2c0a', lw(el, 1.1), 'stroke-opacity=".8"')),
      hl: el=> mk(el, 'fill="url(#gg-hl)" opacity=".38"'),
      tone: el=> mk(el, 'fill="#6b4a14" fill-opacity=".55"'),
      tline: el=> mk(el, line('#c98a1e', lw(el, 2))) }),
    css: 'html[data-icons="oro"]:not([data-pack]) svg.gi{filter:drop-shadow(0 1px 1px rgba(70,35,0,.55)) !important}'});

  add({id: 'hud', n: 'Sci-fi · Mirino HUD', t: 'Linee azzurre luminose con i mirini agli angoli',
    skin: nodes=> '<g filter="url(#ic-glow-s)">' + build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(HUDC, i)}" fill-opacity=".1" stroke="${col(HUDC, i)}" stroke-width="1.3" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(col(HUDC, i), lw(el, 1.5))),
      glyph: el=> mk(el, 'fill="currentColor" fill-opacity=".95"'),
      wline: el=> mk(el, line('currentColor', lw(el, 1.2), 'stroke-opacity=".9"')),
      tone: el=> mk(el, 'fill="#00d4ff" fill-opacity=".14" stroke="#00d4ff" stroke-opacity=".4" stroke-width=".8"'),
      tline: el=> mk(el, line('#ffb000', lw(el, 2))) }) +
      '<path d="M1.6 6.4V1.8h4.6M25.8 1.8h4.6v4.6M30.4 25.6v4.6h-4.6M6.2 30.2H1.6v-4.6" fill="none" stroke="#00d4ff" stroke-opacity=".6" stroke-width="1"/></g>',
    css: 'html[data-icons="hud"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'inchiostro', n: 'Horror · Inchiostro e sangue', t: 'Sagome d\'inchiostro dal bordo rovinato, con il rosso sangue per i dettagli',
    skin: (nodes, name)=> maskSkin('inchiostro', i=> /^(red|pink)$/.test(i.col) ? 'fill="#b3122a" stroke="#b3122a" stroke-width=".8" stroke-linejoin="round"' : 'fill="currentColor" stroke="currentColor" stroke-width=".8" stroke-linejoin="round"', {filter: 'ic-rough'})(nodes, name),
    css: 'html[data-icons="inchiostro"]:not([data-pack]) svg.gi{filter:drop-shadow(0 0 1.5px rgba(179,18,42,.5)) !important}'});

  add({id: 'pixel', n: 'Retro · Pixel 8-bit', t: 'Ogni icona ridisegnata a 16×16 quadratini, con il contorno scuro', async: true, skin: null,
    css: 'html[data-icons="pixel"]:not([data-pack]) svg.gi{filter:none !important; image-rendering:pixelated}'});

  add({id: 'neon', n: 'Cyberpunk · Neon', t: 'Tubi al neon con alone, su qualsiasi sfondo scuro',
    skin: nodes=> '<g filter="url(#ic-glow)">' + build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(NEON, i)}" fill-opacity=".16" stroke="${col(NEON, i)}" stroke-width="1.6" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(col(NEON, i), lw(el, 1.7))),
      glyph: el=> mk(el, 'fill="currentColor" fill-opacity=".96"'),
      wline: el=> mk(el, line('currentColor', lw(el, 1.3), 'stroke-opacity=".92"')),
      tone: el=> mk(el, 'fill="#9aa4ff" fill-opacity=".22" stroke="#9aa4ff" stroke-opacity=".6" stroke-width=".8"'),
      tline: el=> mk(el, line('#ff9a1a', lw(el, 2))) }) + '</g>',
    css: 'html[data-icons="neon"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'ottone', n: 'Steampunk · Ottone', t: 'Ottone, rame e ferro con incisioni scure',
    skin: nodes=> build(nodes, {
      body: (el, i)=> mk(el, `fill="url(#${METAL[i.col]})" stroke="#2e1c0a" stroke-width="1.2" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(`url(#${METAL[i.col]})`, lw(el, 2))),
      glyph: el=> mk(el, 'fill="#2e1c0a" fill-opacity=".86"'),
      wline: el=> mk(el, line('#2e1c0a', lw(el, 1.1), 'stroke-opacity=".85"')),
      hl: el=> mk(el, 'fill="url(#gg-hl)" opacity=".45"'),
      tone: el=> mk(el, 'fill="#2e1c0a" fill-opacity=".4"'),
      tline: el=> mk(el, line('#8a5e1c', lw(el, 2))) }),
    css: 'html[data-icons="ottone"]:not([data-pack]) svg.gi{filter:drop-shadow(0 1px 1px rgba(0,0,0,.6)) !important}'});

  // adesivo: l'icona originale con un bordo bianco spesso e un'ombra morbida
  add({id: 'adesivo', n: 'Anime · Adesivo', t: 'Colori vivaci con il bordo bianco da adesivo e l\'ombra',
    skin: nodes=> {
      const under = build(nodes, {
        body: el=> mk(el, 'fill="#fff" stroke="#fff" stroke-width="3.6" stroke-linejoin="round"'),
        line: (el, i)=> mk(el, line('#fff', lw(el, 2) + 3.4)),
        glyph: el=> mk(el, 'fill="#fff" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"'),
        wline: el=> mk(el, line('#fff', lw(el, 1.2) + 3.2)),
        tone: el=> mk(el, 'fill="#fff" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"'), tline: el=> mk(el, line('#fff', lw(el, 2) + 3.4)), cc: null, hl: null, rim: null, shade: null });
      return '<g filter="url(#ic-sticker)">' + under + '</g>' + build(nodes, {glyph: 'keep', wline: 'keep', hl: 'keep', shade: 'keep', rim: 'keep', body: 'keep', line: 'keep'});
    },
    css: 'html[data-icons="adesivo"]:not([data-pack]) svg.gi{filter:none !important; overflow:visible}'});

  add({id: 'pop', n: 'Fumetto · Pop-art', t: 'Colori piatti, contorno nero spesso, retino e ombra dura',
    skin: nodes=> {
      const shadow = build(nodes, {body: el=> mk(el, 'fill="#111" stroke="#111" stroke-width="1.8" stroke-linejoin="round"'), line: el=> mk(el, line('#111', lw(el, 2) + 1.8)), glyph: null, wline: null, tone: null, tline: null, cc: null, hl: null, rim: null, shade: null});
      return '<g transform="translate(1.3 1.3)">' + shadow + '</g>' + build(nodes, {
        body: (el, i)=> mk(el, `fill="${col(POP, i)}" stroke="#111" stroke-width="1.7" stroke-linejoin="round"`) + mk(el, 'fill="url(#ic-dots)"'),
        line: (el, i)=> mk(el, line('#111', lw(el, 2) + 1.8)) + mk(el, line(col(POP, i), lw(el, 2))),
        glyph: el=> mk(el, 'fill="#fff"'), wline: el=> mk(el, line('#fff', lw(el, 1.3))),
        tone: el=> mk(el, 'fill="#fff" fill-opacity=".45" stroke="#111" stroke-width="1"') });
    },
    css: 'html[data-icons="pop"]:not([data-pack]) svg.gi{filter:none !important}'});

  const thin = (w, id, nm, tt)=> add({id, n: nm, t: tt,
    skin: nodes=> build(nodes, {
      body: el=> mk(el, line('currentColor', w)),
      line: el=> mk(el, line('currentColor', w)),
      glyph: el=> small(el) ? mk(el, 'fill="currentColor"') : mk(el, line('currentColor', w)),
      wline: el=> mk(el, line('currentColor', w * .92)),
      tone: el=> mk(el, line('currentColor', Math.max(1, w * .7), 'stroke-opacity=".4"')),
      tline: el=> mk(el, line('currentColor', w)) }),
    css: `html[data-icons="${id}"]:not([data-pack]) svg.gi{filter:none !important}`});
  thin(1.5, 'sottile', 'Minimal · Linea sottile', 'Contorni fini, dello stesso colore del testo');
  thin(2.5, 'spessa', 'Minimal · Linea spessa', 'Contorni decisi con le punte tonde, dello stesso colore del testo');

  // solido: sagoma piena del colore del testo, con i dettagli «bucati» (maschera)
  function maskSkin(setId, bodyFill, extra){
    return (nodes, name)=>{
      const id = 'ms-' + setId + '-' + name;
      const bodyBoxes = [], bodyCols = []; walk(nodes, (el, i)=>{ if(i.role === 'body'){ bodyBoxes.push(bb(el)); bodyCols.push(i.col); } return ''; });
      let bn = -1;
      const nested = (el, i)=>{ const k = ++bn, b = bodyBoxes[k]; if(!b) return false; for(let j = 0; j < k; j++){ const q = bodyBoxes[j]; if(bodyCols[j] !== i.col && b.x >= q.x - .3 && b.y >= q.y - .3 && b.x + b.width <= q.x + q.width + .3 && b.y + b.height <= q.y + q.height + .3 && b.width * b.height < q.width * q.height * .8) return true; } return false; };
      const onBody = el=>{ const b = bb(el), cx = b.x + b.width / 2, cy = b.y + b.height / 2; return bodyBoxes.some(q=> cx >= q.x - .5 && cx <= q.x + q.width + .5 && cy >= q.y - .5 && cy <= q.y + q.height + .5); };
      bn = -1;
      const nest = []; walk(nodes, (el, i)=>{ if(i.role === 'body') nest.push(nested(el, i)); return ''; });
      let hn = -1;
      const holes = walk(nodes, (el, i)=> i.role === 'body' ? (nest[++hn] ? mk(el, 'fill="#747474"') : '') : (i.role === 'glyph' && onBody(el)) ? mk(el, 'fill="#000"') : (i.role === 'wline' && onBody(el)) ? mk(el, line('#000', lw(el, 1.3))) : (i.role === 'tone' && onBody(el)) ? mk(el, 'fill="#8c8c8c"') : '');
      let mn = -1;
      const main = build(nodes, {
        body: (el, i)=> nest[++mn] ? '' : mk(el, bodyFill(i)),
        line: (el, i)=> mk(el, line(extra && extra.ink || 'currentColor', lw(el, 2))),
        glyph: el=> onBody(el) ? '' : mk(el, 'fill="' + (extra && extra.ink || 'currentColor') + '"'),
        wline: el=> onBody(el) ? '' : mk(el, line(extra && extra.ink || 'currentColor', lw(el, 1.3))),
        tone: el=> onBody(el) ? '' : mk(el, 'fill="' + (extra && extra.ink || 'currentColor') + '" fill-opacity=".3"'),
        tline: el=> mk(el, line(extra && extra.ink || 'currentColor', lw(el, 2))), cc: 'keep' });
      return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><rect width="32" height="32" fill="#fff"/>${holes}</mask><g mask="url(#${id})"${extra && extra.filter ? ' filter="url(#' + extra.filter + ')"' : ''}>${main}</g>`;
    };
  }
  add({id: 'solido', n: 'Minimal · Solido', t: 'Sagome piene dello stesso colore del testo, con i dettagli in negativo',
    skin: maskSkin('solido', ()=> 'fill="currentColor" stroke="currentColor" stroke-width=".6" stroke-linejoin="round"'),
    css: 'html[data-icons="solido"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'duotone', n: 'Minimal · Duotone', t: 'Due toni: colore del tema sfumato e testo pieno',
    skin: nodes=> build(nodes, {
      body: el=> mk(el, 'style="fill:var(--accent,currentColor)" fill-opacity=".34" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"'),
      line: el=> mk(el, line('currentColor', lw(el, 1.8))),
      glyph: el=> mk(el, 'fill="currentColor"'),
      wline: el=> mk(el, line('currentColor', 1.5)),
      tone: el=> mk(el, 'fill="currentColor" fill-opacity=".22"'),
      tline: el=> mk(el, line('currentColor', lw(el, 1.8))) }),
    css: 'html[data-icons="duotone"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'schizzo', n: 'Schizzo a pennarello', t: 'Contorno a penna tremolante e colore spostato, come sul quaderno',
    skin: nodes=> '<g filter="url(#ic-wobble)">' + '<g transform="translate(1 .9)">' + build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(PASTEL, i)}" fill-opacity=".7"`), line: null, glyph: null, wline: null, tone: null, tline: null, cc: null, hl: null, rim: null, shade: null }) + '</g>' + build(nodes, {
      body: el=> mk(el, `fill="none" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`),
      line: (el, i)=> mk(el, line(col(PASTEL, i), lw(el, 2) + 1.2, 'stroke-opacity=".8"')) + mk(el, line(INK, 1.2)),
      glyph: el=> mk(el, `fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"`),
      wline: el=> mk(el, line(INK, lw(el, 1.2))),
      tone: el=> mk(el, `fill="#9aa4c8" fill-opacity=".4" stroke="${INK}" stroke-width="1"`),
      tline: el=> mk(el, line(INK, lw(el, 1.6))) }) + '</g>',
    css: 'html[data-icons="schizzo"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'gesso', n: 'Gessetto', t: 'Tratti di gesso colorato con la retinatura, come sulla lavagna',
    skin: nodes=> '<g filter="url(#ic-chalk)">' + build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(CHALK, i)}" fill-opacity=".22"`) + mk(el, 'fill="url(#ic-hatch)"') + mk(el, `fill="none" stroke="${col(CHALK, i)}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"`),
      line: (el, i)=> mk(el, line(col(CHALK, i), lw(el, 2))),
      glyph: el=> mk(el, 'fill="currentColor" fill-opacity=".92"'),
      wline: el=> mk(el, line('currentColor', lw(el, 1.3), 'stroke-opacity=".9"')),
      tone: el=> mk(el, 'fill="currentColor" fill-opacity=".18"'),
      tline: el=> mk(el, line('#f5a45c', lw(el, 2))) }) + '</g>',
    css: 'html[data-icons="gesso"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'vetrata', n: 'Vetrata', t: 'Vetri colorati separati da nervature di piombo',
    skin: nodes=> build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(GLASS, i)}" stroke="#1b1426" stroke-width="1.7" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line('#1b1426', lw(el, 2) + 1.6)) + mk(el, line(col(GLASS, i), lw(el, 2))),
      glyph: el=> mk(el, 'fill="#fff4c4" fill-opacity=".96" stroke="#1b1426" stroke-width=".9" stroke-linejoin="round"'),
      wline: el=> mk(el, line('#1b1426', lw(el, 1.2), 'stroke-opacity=".85"')),
      hl: el=> mk(el, 'fill="url(#gg-hl)" opacity=".4"'),
      tone: el=> mk(el, 'fill="#c8c0d8" fill-opacity=".6" stroke="#1b1426" stroke-width="1"') }),
    css: 'html[data-icons="vetrata"]:not([data-pack]) svg.gi{filter:drop-shadow(0 0 2px rgba(255,255,255,.3)) !important}'});

  add({id: 'holo', n: 'Olografico', t: 'Riflessi arcobaleno come le carte rare',
    skin: nodes=> build(nodes, {
      body: (el, i)=> mk(el, `fill="url(#${/^(cyan|violet|green|indigo)$/.test(i.col) ? 'ic-holo' : 'ic-holo2'})" stroke="#5b3fa8" stroke-opacity=".5" stroke-width=".9" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(`url(#${/^(cyan|violet|green|indigo)$/.test(i.col) ? 'ic-holo' : 'ic-holo2'})`, lw(el, 2))),
      glyph: 'keep', wline: 'keep', hl: el=> mk(el, 'fill="url(#gg-hl)" opacity=".6"'), rim: 'keep',
      tone: el=> mk(el, 'fill="#c9b8ff" fill-opacity=".4"') }),
    css: 'html[data-icons="holo"]:not([data-pack]) svg.gi{filter:drop-shadow(0 1px 3px rgba(138,92,255,.45)) !important}'});

  add({id: 'carta', n: 'Carta ritagliata', t: 'Forme di carta colorata con l\'ombra sotto, come un diorama',
    skin: nodes=> '<g filter="url(#ic-soft)" opacity=".42" transform="translate(0 1.5)">' + build(nodes, {
      body: el=> mk(el, 'fill="#000"'), line: el=> mk(el, line('#000', lw(el, 2))), glyph: null, wline: null, tone: null, tline: null, cc: null, hl: null, rim: null, shade: null }) + '</g>' + build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(PAPER, i)}" stroke="#fff" stroke-opacity=".55" stroke-width=".8" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(col(PAPER, i), lw(el, 2))),
      glyph: el=> mk(el, 'fill="#fffaf0" fill-opacity=".97"'),
      wline: el=> mk(el, line('#fffaf0', lw(el, 1.3), 'stroke-opacity=".95"')),
      tone: el=> mk(el, 'fill="#fffaf0" fill-opacity=".5"') }),
    css: 'html[data-icons="carta"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'blueprint', n: 'Blueprint', t: 'Disegno tecnico: linee blu con i segni di quota agli angoli',
    skin: nodes=> build(nodes, {
      body: (el, i)=> mk(el, `fill="${col(BLUE, i)}" fill-opacity=".12" stroke="${col(BLUE, i)}" stroke-width="1.3" stroke-linejoin="round"`),
      line: (el, i)=> mk(el, line(col(BLUE, i), lw(el, 1.6), 'stroke-dasharray="3 1.8"')),
      glyph: el=> small(el) ? mk(el, 'fill="#8ab8ff"') : mk(el, line('#8ab8ff', 1.1)),
      wline: el=> mk(el, line('#8ab8ff', lw(el, 1.1))),
      tone: el=> mk(el, 'fill="#4d9bf2" fill-opacity=".18" stroke="#4d9bf2" stroke-opacity=".6" stroke-width=".8"'),
      tline: el=> mk(el, line('#8ab8ff', lw(el, 1.6))) }) +
      '<path d="M1.5 3h3M3 1.5v3M27.5 29h3M29 27.5v3" fill="none" stroke="#4d9bf2" stroke-opacity=".6" stroke-width=".9"/>',
    css: 'html[data-icons="blueprint"]:not([data-pack]) svg.gi{filter:none !important}'});

  add({id: 'timbro', n: 'Timbro', t: 'Inchiostro rosso su carta, con i bordi consumati',
    skin: maskSkin('timbro', ()=> 'fill="#c1272d" stroke="#c1272d" stroke-width=".6" stroke-linejoin="round"', {ink: '#c1272d', filter: 'ic-stamp'}),
    css: 'html[data-icons="timbro"]:not([data-pack]) svg.gi{filter:none !important}'});

  const EMOJI = {profile: '👤', gem: '💎', orb: '🔮', sliders: '🎛️', screen: '🖥️', trophy: '🏆', dice: '🎲', star: '⭐', genres: '🎭', target: '🎯', layers: '📚', bars: '📊', chat: '💬', up: '⬆️', mic: '🎤', table: '📋', grid: '🧩', cards: '🃏', wand: '🪄', pad: '🎮', globe: '🌍', lens: '🔍', favon: '⭐', favoff: '☆', refresh: '🔄', heart: '❤️', check: '✅', pin: '📍', book: '📖', dna: '🧬', compass: '🧭', save: '💾', inbox: '📥', pulse: '💓', cloud: '☁️', gear: '⚙️', tag: '🏷️', scale: '⚖️', cam: '📷', photo: '🖼️', send: '📤', wrench: '🔧', gift: '🎁', play: '▶️', stop: '⏹️', cart: '🛒', link: '🔗', upplus: '➕', vgold: '🥇', upmanual: '🛡️'};
  add({id: 'emoji', n: 'Emoji', t: 'Le emoji del telefono al posto delle icone',
    skin: (nodes, name)=> name === 'favoff' ? '<path d="M16 3.8l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L16 22.8l-7.4 4 1.4-8.3-6-5.9 8.3-1.2z" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".6" stroke-width="1.7" stroke-linejoin="round"/>'
      : `<text x="16" y="25" font-size="23" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${EMOJI[name] || '❓'}</text>`,
    css: 'html[data-icons="emoji"]:not([data-pack]) svg.gi{filter:drop-shadow(0 1px 1px rgba(0,0,0,.25)) !important}'});

  // ---- pixel 8-bit: ridisegno ogni icona su una griglia 16×16 (il bordo scuro occupa il margine) ----
  const PXPAL = ['#ffffff', '#cfd3e6', '#8d93b8', '#4a4f78', '#ffd23f', '#f2a516', '#ff7b3a', '#ee4266', '#a3173f', '#ff8ad6', '#b13ff0', '#7a52e0', '#3b8bff', '#1f4fb8', '#27c6ff', '#1c8cb8', '#3bd37a', '#1d8a52', '#a8f070', '#7a4a1e', '#2a2438'];
  const hexRgb = h=> [1, 3, 5].map(i=> parseInt(h.slice(i, i + 2), 16));
  const PXRGB = PXPAL.map(hexRgb);
  const PXOUT = '#14122a';
  async function pixelSkin(name){
    const colorCtx = name === 'favoff' ? '#808080' : '#000';
    const svg = `<svg xmlns="${NS}" viewBox="0 0 32 32" width="96" height="96"><defs>${[...defs.querySelectorAll('[id^="gg-"]')].map(n=> n.outerHTML).join('')}</defs>${(name === 'favoff' ? ORIG[name].replace('fill-opacity=".10"', 'fill-opacity="0"').replace('stroke-opacity=".55"', 'stroke-opacity="1"').replace('stroke-width="1.7"', 'stroke-width="3"') : ORIG[name]).replace(/currentColor/g, colorCtx)}</svg>`;
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d', {willReadFrequently: true});
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(img, 1, 1, 14, 14);
    const d = g.getImageData(0, 0, 16, 16).data, N = 16, grid = [];
    for(let y = 0; y < N; y++){ grid[y] = []; for(let x = 0; x < N; x++){
      const k = (y * N + x) * 4, a = d[k + 3];
      if(a < 110){ grid[y][x] = null; continue; }
      let best = 0, bd = 1e9; for(let p = 0; p < PXRGB.length; p++){ const dr = d[k] - PXRGB[p][0], dg = d[k + 1] - PXRGB[p][1], db = d[k + 2] - PXRGB[p][2], dd = dr * dr + dg * dg + db * db; if(dd < bd){ bd = dd; best = p; } }
      grid[y][x] = name === 'favoff' ? 'cc' : PXPAL[best];
    } }
    const rows = grid.map((r, y)=> r.map((c, x)=> c || (name !== 'favoff' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy])=> grid[y + dy] && grid[y + dy][x + dx]) ? PXOUT : null)));
    let svgOut = '';
    for(let y = 0; y < N; y++){ let x = 0; while(x < N){ const cc = rows[y][x]; if(!cc){ x++; continue; } let e = x; while(e + 1 < N && rows[y][e + 1] === cc) e++; svgOut += `<rect x="${x * 2}" y="${y * 2}" width="${(e - x + 1) * 2}" height="2" fill="${cc === 'cc' ? 'currentColor' : cc}"/>`; x = e + 1; } }
    return '<g shape-rendering="crispEdges">' + svgOut + '</g>';
  }

  // ---- scelta, applicazione ----
  const AUTO = {pixel: 'pixel', jrpg: 'oro', arcade: 'neon', crt: 'hud', synth: 'neon', grimorio: 'oro', taverna: 'timbro', vapore: 'ottone', washi: 'inchiostro', quaderno: 'schizzo', bauhaus: 'solido', deco: 'oro', fumetto: 'pop', noir: 'inchiostro', brutale: 'pop', aero: 'original', holo: 'holo', abissi: 'hud', nebulosa: 'neon', hud: 'hud'};
  const byId = id=> SETS.find(s=> s.id === id) || null;
  let pref = LS.get(KEY, 'auto'); if(pref !== 'auto' && pref !== 'original' && !byId(pref)) pref = 'auto';
  const effective = ()=>{ if(pref !== 'auto') return pref; const p = window.currentPack && window.currentPack(); return p ? (AUTO[p] || 'original') : 'original'; };
  const styleEl = document.createElement('style'); styleEl.id = 'iconStyle'; document.head.appendChild(styleEl);
  let applied = null, ticket = 0;

  function refreshUses(){
    document.querySelectorAll('use[href^="#g-"]').forEach(u=>{ const h = u.getAttribute('href'); u.removeAttribute('href'); u.setAttribute('href', h); });
  }
  function write(map){ NAMES.forEach(n=>{ if(map[n] != null) SYM[n].innerHTML = map[n]; }); }
  function pixelCache(){ const c = LS.get(CACHE, null); return c && c.v === 1 && c.set === 'pixel' ? c.map : null; }

  async function applyNow(){
    const id = effective(), my = ++ticket;
    if(id === applied) return;
    const html = document.documentElement;
    if(id === 'original'){
      applied = id; NAMES.forEach(n=> SYM[n].innerHTML = ORIG[n]); html.removeAttribute('data-icons'); styleEl.textContent = ''; refreshUses(); fire(); return;
    }
    const set = byId(id); if(!set) return;
    let map = {};
    if(set.async){
      map = pixelCache();
      if(!map){ map = {}; for(const n of NAMES){ map[n] = await pixelSkin(n); if(my !== ticket) return; } LS.set(CACHE, {v: 1, set: 'pixel', map}); }
    }else NAMES.forEach(n=> map[n] = set.skin(parse(ORIG[n]), n));
    if(my !== ticket) return;
    applied = id; write(map); html.setAttribute('data-icons', id); styleEl.textContent = set.css || ''; refreshUses(); fire();
  }
  const fire = ()=>{ try{ window.dispatchEvent(new CustomEvent('iconschange', {detail: {id: applied}})); }catch(e){} };
  applyNow();
  window.addEventListener('packchange', ()=>{ if(pref === 'auto') applyNow(); });

  // ---- selettore: anteprime vere di ogni stile ----
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const SAMPLE = ['pad', 'trophy', 'gem', 'heart', 'chat', 'gear'];
  const setName = id=> id === 'original' ? 'Originale (gel lucido)' : (byId(id) || {}).n || id;
  window.openIconPicker = function(){
    const U = window.XUI; if(!U) return;
    const tiles = [{id: 'auto', n: 'Automatico', t: 'Segue il tema grafico: ogni tema ha lo stile di icone che gli sta meglio'}, {id: 'original', n: 'Originale', t: 'Il gel lucido colorato di sempre'}, ...SETS];
    const body = U.sheet('xIcons', '🧩 Set di icone', `<div class="pk-sub">Cambia lo stile di tutte le icone dell'app: bottoni, barra in basso, liste e schede. «Automatico» le abbina al tema grafico scelto; gli altri 20 stili si scelgono a mano, con qualsiasi tema.</div>
      <div class="pk-grid">${tiles.map(t=> `<button type="button" class="pk-tile${pref === t.id ? ' on' : ''}" data-ic="${t.id}"><span class="ic-pv" data-pv="${t.id}">${SAMPLE.map(()=> '<svg viewBox="0 0 32 32" width="34" height="34"></svg>').join('')}</span><span class="pk-ck">✓</span><span class="pk-n">${esc(t.n)}</span><span class="pk-t">${esc(t.id === 'auto' ? 'Adesso: ' + setName(effective()) : t.t)}</span></button>`).join('')}</div>`);
    const fill = async()=>{
      for(const el of body.querySelectorAll('[data-pv]')){
        const id = el.dataset.pv === 'auto' ? effective() : el.dataset.pv;
        const svgs = el.querySelectorAll('svg');
        for(let k = 0; k < SAMPLE.length; k++){ try{ svgs[k].innerHTML = await window.RT_ICONS.markup(id, SAMPLE[k]); }catch(e){} }
      }
    };
    fill();
    body.addEventListener('click', e=>{
      const b = e.target.closest('[data-ic]'); if(!b) return;
      window.RT_ICONS.set(b.dataset.ic);
      body.querySelectorAll('.pk-tile').forEach(x=> x.classList.toggle('on', x === b));
      const a = body.querySelector('[data-ic="auto"] .pk-t'); if(a) a.textContent = 'Adesso: ' + setName(effective());
    });
  };
  (window.XMENU = window.XMENU || []).push({html: '🧩 Set di icone <small>(20 stili)</small>', run: ()=> window.openIconPicker()});

  window.RT_ICONS = {
    sets: SETS, names: NAMES, auto: AUTO,
    pref: ()=> pref, current: ()=> applied || effective(),
    set(id){ pref = id; LS.set(KEY, id); applyNow(); },
    markup: async (id, name)=> id === 'original' ? ORIG[name] : (byId(id).async ? (id === applied ? SYM[name].innerHTML : await pixelSkin(name)) : byId(id).skin(parse(ORIG[name]), name))
  };
})();
