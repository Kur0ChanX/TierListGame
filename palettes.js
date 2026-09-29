// ---- Palette di colori selezionabili (caricato nell'<head> subito dopo theme.css: nessun "lampo" di colori sbagliati) ----
// Ogni palette ha 3 colori guida: da questi calcolo sfondi, vetro, bordi, sfumature, bagliori e aurora,
// sia per il tema chiaro sia per lo scuro. "aurora" è il tema originale (nessuna modifica).
(function(){
  const P = [
    // Eleganti
    {id:'aurora', g:'Originali', n:'Aurora (originale)', c:['#7c5cff','#b04cf5','#ff6ec7']},
    {id:'apple', g:'Eleganti', n:'Apple', c:['#0a84ff','#5e5ce6','#64d2ff'], t:0, dk:{bg:'#000000', card:'#1c1c1e', border:'#38383a', row:'#2c2c2e'}, lt:{bg:'#f2f2f7', border:'#d1d1d6'}},
    {id:'graphite', g:'Eleganti', n:'Grafite', c:['#8e8e93','#aeaeb2','#d1d1d6'], t:0, dk:{bg:'#0b0b0c', card:'#1a1a1c'}},
    {id:'champagne', g:'Eleganti', n:'Champagne', c:['#c8a96a','#e6cf9b','#a67c52'], t:.05},
    {id:'midnightgold', g:'Eleganti', n:'Notte e oro', c:['#d4af37','#f5d67b','#8c6d1f'], t:0, dk:{bg:'#0a0f1f', card:'#121a31', border:'#24304f', row:'#16203b'}},
    {id:'rosegold', g:'Eleganti', n:'Oro rosa', c:['#b76e79','#e8b4b8','#d4a373'], t:.06},
    {id:'sapphire', g:'Eleganti', n:'Zaffiro', c:['#2f5bea','#4f8cff','#9ec5ff'], t:.08},
    {id:'emerald', g:'Eleganti', n:'Smeraldo', c:['#059669','#34d399','#0ea5e9'], t:.07},
    {id:'bordeaux', g:'Eleganti', n:'Bordeaux', c:['#9f1239','#e11d48','#f59e9e'], t:.07},
    {id:'pearl', g:'Eleganti', n:'Perla', c:['#64748b','#94a3b8','#cbd5e1'], t:.03},
    {id:'nord', g:'Eleganti', n:'Nordico', c:['#88c0d0','#81a1c1','#b48ead'], t:0, dk:{bg:'#242933', card:'#2e3440', border:'#434c5e', row:'#3b4252'}, lt:{bg:'#eceff4', border:'#d8dee9'}},
    // Vivaci
    {id:'neontokyo', g:'Vivaci', n:'Neon Tokyo', c:['#ff2e88','#8b5cf6','#22d3ee'], t:.08},
    {id:'sunset', g:'Vivaci', n:'Tramonto', c:['#f97316','#ef4444','#ec4899'], t:.07},
    {id:'tropical', g:'Vivaci', n:'Tropicale', c:['#06b6d4','#22c55e','#facc15'], t:.06},
    {id:'cyberpunk', g:'Vivaci', n:'Cyberpunk', c:['#f5e50a','#00e5ff','#ff003c'], t:.04, dk:{bg:'#07070d', card:'#12121c'}},
    {id:'vaporwave', g:'Vivaci', n:'Vaporwave', c:['#ff71ce','#b967ff','#01cdfe'], t:.09},
    {id:'candy', g:'Vivaci', n:'Caramella', c:['#ff5da2','#ffb86b','#7afcff'], t:.07},
    {id:'lime', g:'Vivaci', n:'Lime', c:['#84cc16','#22c55e','#14b8a6'], t:.06},
    {id:'electric', g:'Vivaci', n:'Blu elettrico', c:['#3b82f6','#6366f1','#06b6d4'], t:.09},
    // Natura
    {id:'forest', g:'Natura', n:'Foresta', c:['#15803d','#65a30d','#a3e635'], t:.08},
    {id:'ocean', g:'Natura', n:'Oceano', c:['#0369a1','#0891b2','#22d3ee'], t:.09},
    {id:'lavender', g:'Natura', n:'Lavanda', c:['#8b5cf6','#c4b5fd','#f0abfc'], t:.08},
    {id:'sakura', g:'Natura', n:'Sakura', c:['#ec4899','#fda4af','#f9a8d4'], t:.07},
    {id:'autumn', g:'Natura', n:'Autunno', c:['#b45309','#d97706','#dc2626'], t:.07},
    {id:'desert', g:'Natura', n:'Deserto', c:['#c2410c','#f59e0b','#fcd34d'], t:.06},
    {id:'aurora_bor', g:'Natura', n:'Aurora boreale', c:['#10b981','#06b6d4','#8b5cf6'], t:.08},
    // Gaming
    {id:'gameboy', g:'Gaming', n:'Game Boy', c:['#8bac0f','#9bbc0f','#306230'], t:0, dk:{bg:'#0f1f0b', card:'#172b11', border:'#2c4a20', row:'#1c3315'}, lt:{bg:'#e7f0c9'}},
    {id:'playstation', g:'Gaming', n:'PlayStation', c:['#0070d1','#00439c','#35a7ff'], t:.1},
    {id:'xbox', g:'Gaming', n:'Xbox', c:['#107c10','#52b043','#9bf00b'], t:.07},
    {id:'nintendo', g:'Gaming', n:'Nintendo', c:['#e60012','#ff4757','#ff9f9f'], t:.05},
    {id:'snes', g:'Gaming', n:'Super Nintendo', c:['#5b4fcf','#a8a2e0','#e4000f'], t:.06},
    {id:'dracula', g:'Gaming', n:'Dracula', c:['#bd93f9','#ff79c6','#8be9fd'], t:0, dk:{bg:'#1e1f29', card:'#282a36', border:'#44475a', row:'#303241'}},
    {id:'crystal', g:'Gaming', n:'Cristallo (Final Fantasy)', c:['#38bdf8','#818cf8','#c4b5fd'], t:.08},
    {id:'hyrule', g:'Gaming', n:'Hyrule', c:['#2f855a','#d4af37','#63b3ed'], t:.06}
  ];
  const hex = h=>{ h = h.replace('#',''); return [0,2,4].map(i=> parseInt(h.slice(i, i+2), 16)); };
  const toHex = a=> '#' + a.map(v=> Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
  const mix = (a, b, t)=>{ const A = hex(a), B = hex(b); return toHex(A.map((v, i)=> v + (B[i] - v) * t)); };
  const rgb = h=> hex(h).join(',');
  const lum = h=>{ const [r,g,b] = hex(h).map(v=>{ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126*r + .7152*g + .0722*b; };
  function vars(p, dark){
    const [a1, a2, a3] = p.c, t = p.t == null ? .07 : p.t, o = (dark ? p.dk : p.lt) || {};
    const accent = dark ? (lum(a1) < .12 ? mix(a1, '#ffffff', .35) : a1) : (lum(a1) > .35 ? mix(a1, '#000000', .35) : a1);
    const bg = o.bg || (dark ? mix('#0e0e13', a1, t) : mix('#f6f6f8', a1, t * .6));
    const card = o.card || (dark ? mix('#1b1b23', a1, t * 1.4) : '#ffffff');
    const border = o.border || (dark ? mix('#2f2f3a', a1, Math.max(.08, t * 2)) : mix('#e4e4ea', a1, .14));
    const row = o.row || (dark ? mix('#202029', a1, t * 1.2) : mix('#fafafc', a1, .05));
    const text = dark ? '#f2f1f7' : '#1c1b22', sub = dark ? mix('#a9a8b5', a1, .18) : mix('#6b6a76', a1, .12);
    return `--bg:${bg}; --card:${card}; --text:${text}; --sub:${sub}; --border:${border}; --row-alt:${row};
      --accent:${accent}; --accent2:${a2}; --a1rgb:${rgb(a1)}; --a2rgb:${rgb(a2)}; --a3rgb:${rgb(a3)};
      --grad:linear-gradient(135deg,${a1} 0%,${a2} 55%,${a3} 100%);
      --grad-soft:linear-gradient(135deg,rgba(${rgb(a1)},.16),rgba(${rgb(a3)},.12));
      --glass:${dark ? `rgba(${rgb(card)},.62)` : 'rgba(255,255,255,.72)'}; --glass-line:rgba(${rgb(a1)},${dark ? .22 : .18});
      --aur1:rgba(${rgb(a1)},${dark ? .34 : .28}); --aur2:rgba(${rgb(a3)},${dark ? .18 : .2}); --aur3:rgba(${rgb(a2)},${dark ? .16 : .16});
      --dopa-bg:${dark ? mix(card, a1, .12) : mix('#ffffff', a1, .08)}; --dopa-border:${mix(dark ? card : '#ffffff', a1, .35)}; --dopa-ink:${dark ? mix(a1, '#ffffff', .55) : mix(a1, '#000000', .3)};`;
  }
  function css(p){
    const L = vars(p, false), D = vars(p, true);
    return `:root{${L}}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${D}}}\n:root[data-theme="dark"]{${D}}`;
  }
  const KEY = 'jrpg_palette';
  let cur = 'aurora'; try{ cur = JSON.parse(localStorage.getItem(KEY) || '"aurora"') || 'aurora'; }catch(e){}
  const style = document.createElement('style'); style.id = 'paletteStyle';
  // subito dopo l'ultimo foglio di stile già presente (vince su theme.css anche se la pagina viene "impacchettata", es. dentro Claude)
  const links = document.querySelectorAll('link[rel="stylesheet"], style'); const last = links[links.length - 1];
  if(last && last.parentNode) last.parentNode.insertBefore(style, last.nextSibling); else document.head.appendChild(style);
  function apply(id){
    const p = P.find(x=> x.id === id) || P[0];
    cur = p.id;
    style.textContent = p.id === 'aurora' ? '' : css(p);
    try{ localStorage.setItem(KEY, JSON.stringify(p.id)); }catch(e){}
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', p.id === 'aurora' ? '#161221' : vars(p, true).match(/--bg:([^;]+)/)[1]);
  }
  apply(cur);
  window.RT_PALETTES = P;
  window.applyPalette = apply;
  // selettore: griglia di anteprime per gruppo, si applica subito toccandola
  window.openPalettePicker = function(){
    let el = document.getElementById('xPalette');
    if(!el){ el = document.createElement('div'); el.id = 'xPalette'; el.className = 'dup-backdrop x-sheet'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-x-close]')) el.classList.remove('show');
        const b = e.target.closest('[data-pal]'); if(b){ apply(b.dataset.pal); el.querySelectorAll('[data-pal]').forEach(x=> x.classList.toggle('on', x.dataset.pal === cur)); } }); }
    const groups = [...new Set(P.map(p=> p.g))];
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🎨 Palette colori</b><button class="btn" data-x-close>Fatto</button></div>
      <div class="lp-sub">Tocca una palette: la vedi subito su tutta l'app, con sfumature, trasparenze e bagliori. Funziona sia col tema chiaro che scuro (pulsante Tema).</div>
      ${groups.map(g=> `<div class="pal-group">${g}</div><div class="pal-grid">${P.filter(p=> p.g === g).map(p=> `<button type="button" class="pal${p.id === cur ? ' on' : ''}" data-pal="${p.id}">
        <span class="pal-sw" style="background:linear-gradient(135deg,${p.c[0]},${p.c[1]} 55%,${p.c[2]})"></span>
        <span class="pal-dots">${p.c.map(c=> `<i style="background:${c}"></i>`).join('')}</span><span class="pal-n">${p.n}</span></button>`).join('')}</div>`).join('')}</div>`;
    el.classList.add('show');
  };
})();
