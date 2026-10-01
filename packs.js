// ---- Temi grafici completi («pack»): colori + forme + font + sfondo animato, scelti da ✨ → Temi grafici ----
// Caricato nell'<head> subito dopo palettes.js, così il tema si vede già al primo disegno della pagina (nessun lampo del tema vecchio).
// Qui: l'elenco dei temi con i loro colori (chiaro/scuro), la scelta salvata, il caricamento del file packs/NOME.css e il selettore con le anteprime.
// «Originale» = nessun tema grafico: tornano le palette colori di palettes.js.
(function(){
  const KEY = 'jrpg_pack', KEY_ANIM = 'jrpg_pack_anim';
  const hex = h=>{ h = h.replace('#', ''); return [0, 2, 4].map(i=> parseInt(h.slice(i, i + 2), 16)); };
  const toHex = a=> '#' + a.map(v=> Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t)=>{ const A = hex(a), B = hex(b); return toHex(A.map((v, i)=> v + (B[i] - v) * t)); };
  const rgb = h=> hex(h).join(',');
  const lum = h=>{ const [r, g, b] = hex(h).map(v=>{ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };

  // m: 'both' (segue il pulsante Tema) · 'dark' / 'light' (un solo aspetto). Colori: bg sfondo, card superfici, text, sub, line bordi, a1/a2/a3 colori guida.
  const PACKS = [
    // Videogiochi retro
    {id: 'pixel', g: 'Videogiochi retro', n: 'Pixel Quest', t: '8-bit: cielo a fasce, stelle a scatti, bordi a pixel', m: 'dark', fonts: ['pixelify-sans', 'press-start-2p-400'],
      D: {bg: '#0b0b24', card: '#15153f', text: '#f4f4ff', sub: '#a9a9d8', line: '#e8e8ff', a1: '#ffd23f', a2: '#3bceac', a3: '#ee4266'}},
    {id: 'jrpg', g: 'Videogiochi retro', n: 'Finestre JRPG', t: 'I menu blu dei classici, con il cursore a mano', m: 'dark', fonts: ['dotgothic16-400'],
      D: {bg: '#050b2e', card: '#14269e', text: '#ffffff', sub: '#b9c6ff', line: '#e9ecff', a1: '#ffe36e', a2: '#7aa2ff', a3: '#ff7ad9'}},
    {id: 'arcade', g: 'Videogiochi retro', n: 'Sala giochi', t: 'Moquette neon, lampadine e gettoni', m: 'dark', fonts: ['bungee-400', 'rubik'],
      D: {bg: '#0a0a2c', card: '#14144f', text: '#fff6e0', sub: '#b8b8f0', line: '#2de2e6', a1: '#ff2e88', a2: '#2de2e6', a3: '#ffd319'}},
    {id: 'crt', g: 'Videogiochi retro', n: 'Terminale', t: 'Schermo verde a fosforo con linee di scansione', m: 'dark', fonts: ['jetbrains-mono', 'vt323-400'],
      D: {bg: '#010a03', card: '#04140a', text: '#6bff9a', sub: '#34c26a', line: '#1e7d40', a1: '#39ff7a', a2: '#ffb000', a3: '#00e5ff'}},
    {id: 'synth', g: 'Videogiochi retro', n: 'Retrowave', t: 'Sole a strisce, griglia neon, anni ’80', m: 'dark', fonts: ['orbitron', 'exo-2'],
      D: {bg: '#10002b', card: '#1d0a3d', text: '#fdf0ff', sub: '#c9a7ff', line: '#ff2e97', a1: '#ff2e97', a2: '#00e5ff', a3: '#ffd319'}},
    // Fantasy e avventura
    {id: 'grimorio', g: 'Fantasy e avventura', n: 'Grimorio', t: 'Tomo oscuro con rune, oro e ceralacca', m: 'dark', fonts: ['cinzel', 'eb-garamond'],
      D: {bg: '#0d0912', card: '#181021', text: '#ecdfc4', sub: '#b9a98a', line: '#7c6129', a1: '#d4a94a', a2: '#c0243e', a3: '#8a63ff'}},
    {id: 'taverna', g: 'Fantasy e avventura', n: 'Taverna', t: 'Bacheca delle quest: legno, pergamena e spille', m: 'both', fonts: ['almendra-400', 'alegreya'],
      L: {bg: '#c9a06c', card: '#f1e2bd', text: '#2a1a0c', sub: '#4d3419', line: '#6b4a22', a1: '#a83a2a', a2: '#2f6b4a', a3: '#d9a441'},
      D: {bg: '#2a1c11', card: '#3a2818', text: '#f3e4c3', sub: '#c9b08a', line: '#8a6a3a', a1: '#e0674f', a2: '#6bbf8a', a3: '#e6b45a'}},
    {id: 'vapore', g: 'Fantasy e avventura', n: 'Vapore', t: 'Ottone, rivetti e ingranaggi che girano', m: 'dark', fonts: ['metamorphous-400', 'special-elite-400'],
      D: {bg: '#17100a', card: '#2a1c11', text: '#f3e2bf', sub: '#c4a77b', line: '#8a6428', a1: '#d9a441', a2: '#c46a3a', a3: '#4fa59a'}},
    {id: 'washi', g: 'Fantasy e avventura', n: 'Washi', t: 'Carta di riso, inchiostro e sigilli rossi', m: 'both', fonts: ['shippori-mincho-500', 'shippori-mincho-700'],
      L: {bg: '#f2ead7', card: '#fbf6e9', text: '#1c1917', sub: '#5a4f43', line: '#2b2420', a1: '#c1272d', a2: '#264653', a3: '#b08d57'},
      D: {bg: '#0e1626', card: '#16223a', text: '#efe6d0', sub: '#b4a98f', line: '#6b5f45', a1: '#e0474c', a2: '#7fb3c8', a3: '#d7b36a'}},
    // Carta, stampa e design
    {id: 'quaderno', g: 'Carta, stampa e design', n: 'Quaderno', t: 'Righe, pennarelli e tratto a mano (di sera: lavagna)', m: 'both', fonts: ['caveat', 'patrick-hand-400'],
      L: {bg: '#fbf8ee', card: '#fffdf6', text: '#1d2b53', sub: '#4b5a85', line: '#1d2b53', a1: '#e8505b', a2: '#2f6bff', a3: '#ffd93d'},
      D: {bg: '#22302d', card: '#2b3b37', text: '#f4f1e6', sub: '#bcc8be', line: '#e9e6da', a1: '#ffd166', a2: '#8ecae6', a3: '#ff8fab'}},
    {id: 'bauhaus', g: 'Carta, stampa e design', n: 'Bauhaus', t: 'Cerchi, quadrati e colori primari', m: 'both', fonts: ['jost'],
      L: {bg: '#f1ead8', card: '#fffdf5', text: '#111111', sub: '#444444', line: '#111111', a1: '#e63329', a2: '#1d4ed8', a3: '#f5c518'},
      D: {bg: '#111111', card: '#1c1c1c', text: '#f5f1e4', sub: '#c8c4b5', line: '#f5f1e4', a1: '#ff4a3d', a2: '#4d7cff', a3: '#ffd23a'}},
    {id: 'deco', g: 'Carta, stampa e design', n: 'Art Déco', t: 'Oro, raggi di sole e angoli a gradini', m: 'both', fonts: ['poiret-one-400', 'josefin-sans'],
      L: {bg: '#f3ead2', card: '#fbf5e3', text: '#1a1a1a', sub: '#5b5033', line: '#a8863a', a1: '#9a7b22', a2: '#1f6f66', a3: '#d4af37'},
      D: {bg: '#080b14', card: '#101626', text: '#f2e8cf', sub: '#bfae85', line: '#b8963e', a1: '#d4af37', a2: '#2a9d8f', a3: '#e9c46a'}},
    {id: 'fumetto', g: 'Carta, stampa e design', n: 'Fumetto', t: 'Retini pop, balloon ed esplosioni', m: 'both', fonts: ['bangers-400', 'comic-neue-400', 'comic-neue-700'],
      L: {bg: '#ffe14d', card: '#ffffff', text: '#111111', sub: '#333333', line: '#111111', a1: '#e63946', a2: '#1d70e8', a3: '#00b4d8'},
      D: {bg: '#10163a', card: '#1b2255', text: '#ffffff', sub: '#cfd6ff', line: '#ffffff', a1: '#ff4d5e', a2: '#ffd23f', a3: '#27d3ff'}},
    {id: 'noir', g: 'Carta, stampa e design', n: 'Noir', t: 'Bianco e nero, veneziane e grana di pellicola (di giorno: giornale)', m: 'both', fonts: ['bebas-neue-400', 'courier-prime-400', 'courier-prime-700'],
      L: {bg: '#e6e0cf', card: '#f1ecdd', text: '#141414', sub: '#4b4a45', line: '#141414', a1: '#b3121b', a2: '#2b2b2b', a3: '#6b675c'},
      D: {bg: '#0b0b0b', card: '#151515', text: '#ece9e2', sub: '#a8a59c', line: '#3a3a3a', a1: '#d62828', a2: '#c9c5ba', a3: '#8a8a8a'}},
    {id: 'brutale', g: 'Carta, stampa e design', n: 'Brutale', t: 'Bordi spessi, ombre dure, colori pop', m: 'both', fonts: ['space-grotesk', 'archivo-black-400'],
      L: {bg: '#fff2b8', card: '#ffffff', text: '#0a0a0a', sub: '#3d3d3d', line: '#0a0a0a', a1: '#e0215f', a2: '#2f6bff', a3: '#ffd400'},
      D: {bg: '#0e0e12', card: '#1c1c24', text: '#ffffff', sub: '#c9c9d6', line: '#ffffff', a1: '#ff5c93', a2: '#5b8cff', a3: '#ffe14d'}},
    // Luci e mondi
    {id: 'aero', g: 'Luci e mondi', n: 'Aero', t: 'Lucido anni 2000: cielo, bolle e pulsanti di gel', m: 'both', fonts: ['fredoka', 'nunito'],
      L: {bg: '#cfeeff', card: '#f4fbff', text: '#0b2f4a', sub: '#3e6480', line: '#7fc4e8', a1: '#1aa3ff', a2: '#34d399', a3: '#ffd54a'},
      D: {bg: '#06223f', card: '#0d3358', text: '#eaf7ff', sub: '#9cc6e6', line: '#3b8ac4', a1: '#35b6ff', a2: '#3be8b0', a3: '#ffd54a'}},
    {id: 'holo', g: 'Luci e mondi', n: 'Olografico', t: 'Bordi cangianti come le carte rare', m: 'both', fonts: ['sora'],
      L: {bg: '#f3f0ff', card: '#ffffff', text: '#1c1535', sub: '#5d5880', line: '#d9d2f5', a1: '#8a5cff', a2: '#ff6bbd', a3: '#27c6e8'},
      D: {bg: '#0c0a1d', card: '#16122f', text: '#f2eeff', sub: '#b7aee6', line: '#3b3470', a1: '#a98cff', a2: '#ff7ad0', a3: '#4fe0ff'}},
    {id: 'abissi', g: 'Luci e mondi', n: 'Abissi', t: 'Fondale con raggi di luce e bolle', m: 'dark', fonts: ['comfortaa'],
      D: {bg: '#001824', card: '#032a3f', text: '#e2fbff', sub: '#8fd0e0', line: '#14688a', a1: '#38e8ff', a2: '#ff5ce1', a3: '#a6ff8a'}},
    {id: 'nebulosa', g: 'Luci e mondi', n: 'Nebulosa', t: 'Stelle, nebulose e stelle cadenti', m: 'dark', fonts: ['exo-2'],
      D: {bg: '#07051a', card: '#120d33', text: '#f1ecff', sub: '#b4a8e8', line: '#3b2f7a', a1: '#8b6bff', a2: '#ff6bd5', a3: '#4fd1ff'}},
    {id: 'hud', g: 'Luci e mondi', n: 'HUD tattico', t: 'Angoli tagliati, griglia esagonale, radar', m: 'dark', fonts: ['rajdhani-500', 'rajdhani-700', 'share-tech-mono-400'],
      D: {bg: '#05090d', card: '#0b141b', text: '#d8f6ff', sub: '#7fb2c4', line: '#1b6a86', a1: '#00d4ff', a2: '#ffb000', a3: '#ff3d5a'}}
  ];
  PACKS.forEach(p=>{ if(!p.L) p.L = p.D; if(!p.D) p.D = p.L; });
  const byId = id=> PACKS.find(p=> p.id === id) || null;

  // Dai colori guida a tutte le variabili che l'app già usa (le stesse di palettes.js, ma piatte: niente vetro né bagliori automatici)
  function V(c, dark){
    const A1 = rgb(c.a1), A2 = rgb(c.a2), A3 = rgb(c.a3), cr = rgb(c.card);
    const alt = c.alt || mix(c.card, c.a1, dark ? .07 : .05);
    return `--bg:${c.bg};--card:${c.card};--text:${c.text};--sub:${c.sub};--border:${c.line};--row-alt:${alt};--accent:${c.a1};--accent2:${c.a2};--a1rgb:${A1};--a2rgb:${A2};--a3rgb:${A3};--cardrgb:${cr};`
      + `--grad:${c.a1};--grad-soft:rgba(${A1},.14);--glass:${c.card};--glass-strong:${c.card};--glass-line:${c.line};--hl:transparent;--hl2:transparent;--glow:rgba(${A1},.35);`
      + `--orb-bg:${c.card};--orb-edge:rgba(0,0,0,.3);--m1:0;--m2:0;--m3:0;--surface-tint:${mix(c.card, c.a1, .1)};--on-accent:${lum(c.a1) > .42 ? '#101010' : '#ffffff'};`
      + `--dopa-bg:${mix(c.card, c.a1, .1)};--dopa-border:${mix(c.card, c.a1, .35)};--dopa-ink:${dark ? mix(c.a1, '#ffffff', .5) : mix(c.a1, '#000000', .3)};`
      + `--shadow:none;--ring:none;--aur1:transparent;--aur2:transparent;--aur3:transparent;color-scheme:${dark ? 'dark' : 'light'};`;
  }
  const S = id=> `html[data-pack="${id}"]:not(#_)`;
  const css = p=> `${S(p.id)}{${V(p.L, false)}}\n${S(p.id)}.pk-dark{${V(p.D, true)}}`;

  const html = document.documentElement;
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : {matches: false};
  const style = document.createElement('style'); style.id = 'packStyle';
  { const ps = document.getElementById('paletteStyle'); if(ps && ps.parentNode) ps.parentNode.insertBefore(style, ps.nextSibling); else document.head.appendChild(style); }

  let cur = '', metaTouched = false;
  try{ cur = JSON.parse(localStorage.getItem(KEY) || '""') || ''; }catch(e){}
  if(!byId(cur)) cur = '';

  const darkNow = p=>{
    if(!p) return html.getAttribute('data-theme') === 'dark' || (html.getAttribute('data-theme') !== 'light' && mq.matches);
    if(p.m === 'dark') return true; if(p.m === 'light') return false;
    return html.getAttribute('data-theme') === 'dark' || (html.getAttribute('data-theme') !== 'light' && mq.matches);
  };
  const sync = ()=>{
    const p = byId(cur), d = darkNow(p);
    html.classList.toggle('pk-dark', !!p && d);
    const m = document.querySelector('meta[name="theme-color"]');
    if(p && m) m.setAttribute('content', (d ? p.D : p.L).bg);
    else if(!p && metaTouched){ metaTouched = false; try{ if(window.applyPalette) window.applyPalette(JSON.parse(localStorage.getItem('jrpg_palette') || '"apple"')); }catch(e){} }      // torna il colore della barra del telefono della palette
    if(p) metaTouched = true;
  };
  const reduce = ()=> window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animOn = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY_ANIM) || 'true') !== false; }catch(e){ return true; } };
  const applyStill = ()=> html.classList.toggle('pk-still', !animOn() || reduce());

  // ---- caricamento del file del tema ----
  const href = id=> 'packs/' + id + '.css';
  const loaded = new Set();
  function addLink(id, cb){
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href(id); l.className = 'pack-css'; l.dataset.pack = id;
    let done = false; const fin = ()=>{ if(done) return; done = true; loaded.add(id); cb && cb(); };
    l.onload = fin; l.onerror = fin; setTimeout(fin, 2500);
    document.head.appendChild(l);
  }
  function setPack(id){                                           // da qui in poi la pagina è del tema (variabili + file già pronti)
    const p = byId(id); cur = p ? p.id : '';
    style.textContent = p ? css(p) : '';
    if(p) html.setAttribute('data-pack', p.id); else html.removeAttribute('data-pack');
    sync();
    ['--a1rgb', '--a2rgb', '--a3rgb', '--rt-tint'].forEach(k=> html.style.removeProperty(k)); html.classList.remove('rt-tinted');      // la tinta dalla copertina non vale sopra un tema grafico
    try{ localStorage.setItem(KEY, JSON.stringify(cur)); }catch(e){}
    document.querySelectorAll('link.pack-css').forEach(l=>{ if(l.dataset.pack !== cur) l.remove(); });
    try{ window.dispatchEvent(new CustomEvent('packchange', {detail: {id: cur}})); }catch(e){}
  }
  function apply(id){
    const p = byId(id);
    if(!p){ setPack(''); return; }
    if(document.querySelector('link.pack-css[data-pack="' + p.id + '"]')){ setPack(p.id); return; }
    addLink(p.id, ()=> setPack(p.id));                            // il tema compare solo quando il suo file è arrivato: niente scatti
  }

  // ---- avvio: durante la lettura della pagina il file del tema viene scritto subito (blocca il disegno finché non c'è) ----
  applyStill();
  if(cur){
    const p = byId(cur);
    style.textContent = css(p); html.setAttribute('data-pack', cur); sync();
    if(document.readyState === 'loading'){ document.write('<link rel="stylesheet" class="pack-css" data-pack="' + cur + '" href="' + href(cur) + '">'); loaded.add(cur); }
    else addLink(cur);
  }
  try{ new MutationObserver(sync).observe(html, {attributes: true, attributeFilter: ['data-theme']}); }catch(e){}
  try{ mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync); }catch(e){}

  // con un tema a un solo aspetto il pulsante Tema non cambia nulla: lo dico una volta sola
  let told = false;
  document.addEventListener('click', e=>{
    const p = byId(cur); if(!p || p.m === 'both' || told || !e.target.closest || !e.target.closest('#themeBtn')) return;
    told = true; const U = window.XUI; if(U && U.toast) U.toast('«' + p.n + '» ha un solo aspetto (' + (p.m === 'dark' ? 'scuro' : 'chiaro') + '). Per chiaro/scuro scegli un altro tema grafico o «Originale» (✨ → Temi grafici)', 4200);
  }, true);
  window.RT_PACKS = PACKS;
  window.applyPack = apply;
  window.currentPack = ()=> cur;

  // ---- selettore ----
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const thumb = (p, dark)=> 'packs/thumbs/' + (p ? p.id : 'orig') + '-' + ((p && p.m === 'dark') ? 'd' : (p && p.m === 'light') ? 'l' : (dark ? 'd' : 'l')) + '.webp';
  window.openPackPicker = function(){
    const U = window.XUI; if(!U) return;
    const dark = darkNow(null);
    const tile = p=> {
      const q = p || {id: '', n: 'Originale', t: 'Il vetro lucido di sempre, con le palette colori', m: 'both'};
      return `<button type="button" class="pk-tile${q.id === cur ? ' on' : ''}${p ? '' : ' pk-orig'}" data-pk="${q.id}"><span class="pk-th"><img src="${thumb(p, dark)}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span>`
        + `<span class="pk-ck">✓</span>${q.m !== 'both' ? `<span class="pk-m">${q.m === 'dark' ? 'solo scuro' : 'solo chiaro'}</span>` : ''}<span class="pk-n">${esc(q.n)}</span><span class="pk-t">${esc(q.t)}</span></button>`;
    };
    const groups = [...new Set(PACKS.map(p=> p.g))];
    const body = U.sheet('xPacks', '🎭 Temi grafici', `<div class="pk-sub">Ogni tema cambia tutto insieme: colori, forme, scritte, sfondo animato e l'aspetto dei tier. Tocca per provarlo subito. «Originale» riporta il vetro lucido con le palette.</div>
      <div class="pk-grid">${tile(null)}</div>
      ${groups.map(g=> `<div class="pk-group">${g}</div><div class="pk-grid">${PACKS.filter(p=> p.g === g).map(tile).join('')}</div>`).join('')}
      <label class="ask-toggle"><input type="checkbox" id="pkAnim" ${animOn() ? 'checked' : ''}> Sfondi animati e effetti in movimento <small>(spegnili se il telefono si scalda o scorre a scatti)</small></label>`);
    body.addEventListener('click', e=>{
      const b = e.target.closest('[data-pk]'); if(!b) return;
      apply(b.dataset.pk);
      body.querySelectorAll('.pk-tile').forEach(x=> x.classList.toggle('on', x.dataset.pk === b.dataset.pk));
      const p = byId(b.dataset.pk);
      if(p && p.m !== 'both' && U.toast) U.toast('«' + p.n + '» ha un solo aspetto (' + (p.m === 'dark' ? 'scuro' : 'chiaro') + '): il pulsante Tema non lo cambia', 3200);
    });
    body.querySelector('#pkAnim').addEventListener('change', e=>{ try{ localStorage.setItem(KEY_ANIM, JSON.stringify(e.target.checked)); }catch(err){} applyStill(); });
  };
  (window.XMENU = window.XMENU || []).push({html: '🎭 Temi grafici <small>(20 stili completi)</small>', run: ()=> window.openPackPicker()});
})();
