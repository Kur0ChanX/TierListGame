// ---- Palette di colori selezionabili (caricato nell'<head> subito dopo theme.css: nessun "lampo" di colori sbagliati) ----
// Ogni palette ha 3 colori guida: da questi calcolo sfondi, vetro, bordi, sfumature, bagliori e aurora,
// sia per il tema chiaro sia per lo scuro. "aurora" è il tema originale (nessuna modifica).
(function(){
  const P = [
    // Eleganti
    {id:'aurora', g:'Originali', n:'Aurora (viola)', c:['#7c5cff','#b04cf5','#ff6ec7']},
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
    // Anime e manga
    {id:'shonen', g:'Anime e manga', n:'Shonen Jump', c:['#ff7a00','#ffd23f','#1e6fff'], t:.07},
    {id:'evangelion', g:'Anime e manga', n:'Evangelion (Unit-01)', c:['#7b3fbf','#5dd36a','#ff8a1f'], t:.08, dk:{bg:'#0d0a16', card:'#171226', border:'#2f2450', row:'#1d1731'}},
    {id:'ghibli', g:'Anime e manga', n:'Studio Ghibli', c:['#4f9dc9','#86c17a','#f2d488'], t:.08},
    {id:'demonslayer', g:'Anime e manga', n:'Demon Slayer', c:['#1f9d6b','#26b47f','#e11d48'], t:.05, dk:{bg:'#06100c', card:'#0f1c16', border:'#1d3a2d', row:'#132419'}},
    {id:'akira', g:'Anime e manga', n:'Neo-Tokyo (Akira)', c:['#e10600','#ff5a4f','#ffb703'], t:.05, dk:{bg:'#0b0708', card:'#1a1112', border:'#3a1c1c', row:'#211516'}},
    {id:'bebop', g:'Anime e manga', n:'Cowboy Bebop', c:['#f2b705','#2a6fdb','#d62828'], t:.06, dk:{bg:'#0a0d14', card:'#131a28', border:'#26344f', row:'#182136'}},
    {id:'konoha', g:'Anime e manga', n:'Konoha (Naruto)', c:['#ff8c1a','#2f5fd0','#ffe066'], t:.07},
    {id:'grandline', g:'Anime e manga', n:'Grand Line (One Piece)', c:['#e63946','#f4a300','#1d9bd7'], t:.07},
    {id:'dragonball', g:'Anime e manga', n:'Dragon Ball', c:['#ff9800','#1976d2','#ffee58'], t:.06},
    {id:'ghostshell', g:'Anime e manga', n:'Ghost in the Shell', c:['#00e5a8','#22b8f0','#8b5cf6'], t:.04, dk:{bg:'#050b0c', card:'#0d1a1c', border:'#173a3a', row:'#112326'}},
    {id:'berserk', g:'Anime e manga', n:'Berserk', c:['#b91c1c','#7f1d1d','#d6d3d1'], t:.03, dk:{bg:'#080808', card:'#141414', border:'#2e2424', row:'#1b1717'}},
    {id:'yourname', g:'Anime e manga', n:'Your Name (cometa)', c:['#ff7eb3','#7a5cff','#ffd479'], t:.08},
    {id:'deathnote', g:'Anime e manga', n:'Death Note', c:['#dc2626','#a3a3a3','#f5f5f5'], t:0, dk:{bg:'#060606', card:'#121212', border:'#2a2a2a', row:'#181818'}, lt:{bg:'#f4f4f4', border:'#d4d4d4'}}
  ];
  const hex = h=>{ h = h.replace('#',''); return [0,2,4].map(i=> parseInt(h.slice(i, i+2), 16)); };
  const toHex = a=> '#' + a.map(v=> Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
  const mix = (a, b, t)=>{ const A = hex(a), B = hex(b); return toHex(A.map((v, i)=> v + (B[i] - v) * t)); };
  const rgb = h=> hex(h).join(',');
  const lum = h=>{ const [r,g,b] = hex(h).map(v=>{ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126*r + .7152*g + .0722*b; };
  function vars(p, dark){
    const [a1, a2, a3] = p.c, t = p.t == null ? .07 : p.t, o = (dark ? p.dk : p.lt) || {};
    const accent = dark ? (lum(a1) < .12 ? mix(a1, '#ffffff', .35) : a1) : (lum(a1) > .35 ? mix(a1, '#000000', .35) : a1);
    // fondo profondo tinto dal colore del tema (scuro) o pastello luminoso (chiaro)
    const bg = o.bg || (dark ? mix('#07070b', a1, Math.max(.10, t * 2)) : mix('#f7f7fa', a1, Math.max(.06, t)));
    const card = o.card || (dark ? mix('#15151c', a1, Math.max(.12, t * 2.2)) : mix('#ffffff', a1, .03));
    const border = o.border || (dark ? mix('#2c2c38', a1, .28) : mix('#e2e2ea', a1, .22));
    const row = dark ? mix(card, a1, .06) : mix('#ffffff', a1, .05);
    const text = dark ? '#f4f3f9' : '#17161d', sub = dark ? mix('#b2b1bf', a1, .22) : mix('#62616e', a1, .16);
    const cr = rgb(card), A1 = rgb(a1), A2 = rgb(a2), A3 = rgb(a3);
    return `--bg:${bg}; --card:${card}; --text:${text}; --sub:${sub}; --border:${border}; --row-alt:${row};
      --accent:${accent}; --accent2:${a2}; --a1rgb:${A1}; --a2rgb:${A2}; --a3rgb:${A3}; --cardrgb:${cr};
      --grad:linear-gradient(135deg,${mix(a1, '#ffffff', .12)} 0%,${a1} 40%,${mix(a1, a2, .65)} 100%);
      --grad-soft:linear-gradient(135deg,rgba(${A1},.20),rgba(${A2},.10));
      --glass:${dark ? `rgba(${cr},.58)` : `rgba(255,255,255,.62)`}; --glass-strong:${dark ? `rgba(${cr},.82)` : 'rgba(255,255,255,.86)'};
      --glass-line:${dark ? 'rgba(255,255,255,.09)' : `rgba(${A1},.16)`}; --hl:${dark ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.9)'};
      --glow:rgba(${A1},${dark ? .38 : .28}); --hl2:${dark ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,1)'}; --orb-bg:${dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.5)'}; --orb-edge:${dark ? 'rgba(0,0,0,.45)' : 'rgba(20,20,60,.22)'};
      --m1:${dark ? .46 : .32}; --m2:${dark ? .32 : .24}; --m3:${dark ? .28 : .22};
      --surface-tint:${dark ? mix(card, a1, .16) : mix('#ffffff', a1, .10)}; --on-accent:${lum(a1) > .45 ? '#141414' : '#ffffff'};
      --dopa-bg:${dark ? mix(card, a1, .14) : mix('#ffffff', a1, .08)}; --dopa-border:${mix(dark ? card : '#ffffff', a1, .35)}; --dopa-ink:${dark ? mix(a1, '#ffffff', .55) : mix(a1, '#000000', .3)};`;
  }
  function css(p){
    const L = vars(p, false), D = vars(p, true);
    return `:root{${L}}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${D}}}\n:root[data-theme="dark"]{${D}}`;
  }
  const KEY = 'atl_palette';
  let cur = 'neontokyo'; try{ cur = JSON.parse(localStorage.getItem(KEY) || '"neontokyo"') || 'neontokyo'; }catch(e){}
  const style = document.createElement('style'); style.id = 'paletteStyle';
  // subito dopo l'ultimo foglio di stile già presente (vince su theme.css anche se la pagina viene "impacchettata", es. dentro Claude)
  const links = document.querySelectorAll('link[rel="stylesheet"], style'); const last = links[links.length - 1];
  if(last && last.parentNode) last.parentNode.insertBefore(style, last.nextSibling); else document.head.appendChild(style);
  function apply(id){
    const p = P.find(x=> x.id === id) || P[0];
    cur = p.id;
    style.textContent = css(p);
    document.documentElement.classList.add('pal-refined');
    try{ localStorage.setItem(KEY, JSON.stringify(p.id)); }catch(e){}
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', vars(p, true).match(/--bg:([^;]+)/)[1]);
  }
  try{ if(JSON.parse(localStorage.getItem('atl_fx') || 'null') === 'on') document.documentElement.classList.add('fx-on'); }catch(e){}
  apply(cur);
  window.RT_PALETTES = P;
  window.applyPalette = apply;
  // selettore: griglia di anteprime per gruppo, si applica subito toccandola
  function preview(p){
    const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (document.documentElement.getAttribute('data-theme') !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    const v = vars(p, dark), g = k=> (v.match(new RegExp('--' + k + ':([^;]+);')) || [])[1];
    return `<span class="pal-pv" style="--pb:${g('bg')};--pc:${g('card')};--pl:${g('border')};--pa:${g('grad')}"><i></i><b></b><u></u><s></s></span>`;
  }
  window.openPalettePicker = function(){
    let el = document.getElementById('xPalette');
    if(!el){ el = document.createElement('div'); el.id = 'xPalette'; el.className = 'dup-backdrop x-sheet'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-x-close]')) el.classList.remove('show');
        const b = e.target.closest('[data-pal]'); if(b){ apply(b.dataset.pal); el.querySelectorAll('[data-pal]').forEach(x=> x.classList.toggle('on', x.dataset.pal === cur)); } }); }
    const groups = [...new Set(P.map(p=> p.g))];
    el.innerHTML = `<div class="lp-card"><div class="lp-head"><b>🎨 Palette colori</b><button class="btn" data-x-close>Fatto</button></div>
      <div class="lp-sub">Tocca una palette: la vedi subito su tutta l'app, con sfumature, trasparenze e bagliori. Funziona sia col tema chiaro che scuro (pulsante Tema).</div>
      ${groups.map(g=> `<div class="pal-group">${g}</div><div class="pal-grid">${P.filter(p=> p.g === g).map(p=> `<button type="button" class="pal${p.id === cur ? ' on' : ''}" data-pal="${p.id}">
        ${preview(p)}<span class="pal-n">${p.n}</span></button>`).join('')}</div>`).join('')}</div>`;
    el.classList.add('show');
  };
})();
