#!/usr/bin/env node
// Genera le immagini dell'app (mascotte «Frugu» in stile anime/manga, logo, icone, apertura, animazione di caricamento).
// Tutto è disegnato in SVG dal codice: nessuna immagine di partenza. Le scritte sono convertite in tracciati (nessun font da caricare).
//
// Serve solo per RIGENERARE le immagini (quelle pronte sono già in icons/):
//   cd anime-manga/tools/.cache/art && npm i opentype.js @fontsource/luckiest-guy @fontsource/kosugi-maru      (una volta)
//   node anime-manga/tools/make-art.js            → scrive icons/*.svg
//   node anime-manga/tools/make-art.js --png      → in più le icone PNG (serve Playwright + Chromium)
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'icons'), NM = path.join(__dirname, '.cache', 'art', 'node_modules');
fs.mkdirSync(OUT, {recursive: true});
const opentype = require(path.join(NM, 'opentype.js'));

// ------------------------------------------------------------------ font → tracciati
const loadFont = f => { const b = fs.readFileSync(f); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const LUCKY = loadFont(path.join(NM, '@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff'));
const KOSUGI_DIR = path.join(NM, '@fontsource/kosugi-maru');
const kosugiCache = {};
function kosugiFor(code){                                   // il carattere giapponese sta in uno dei tanti pacchetti numerati
  const css = fs.readFileSync(path.join(KOSUGI_DIR, 'index.css'), 'utf8');
  const re = /kosugi-maru-\[(\d+)\]-400-normal \*\/[\s\S]*?unicode-range:\s*([^;]+);/g; let m;
  while ((m = re.exec(css))){
    const hit = m[2].split(',').some(r => { r = r.trim().replace(/^U\+/i, ''); const [a, b] = r.split('-'); const lo = parseInt(a, 16), hi = b ? parseInt(b, 16) : lo; return code >= lo && code <= hi; });
    if (hit){ const f = path.join(KOSUGI_DIR, 'files', `kosugi-maru-${m[1]}-400-normal.woff`); return kosugiCache[f] || (kosugiCache[f] = loadFont(f)); }
  }
  return null;
}
function textPath(text, size, x, y, o){                    // o: {spacing, anchor:'start'|'middle'|'end', jp:true}
  o = o || {}; const sp = o.spacing || 0; const glyphs = [];
  for (const ch of text){
    const font = o.jp ? kosugiFor(ch.codePointAt(0)) : LUCKY; if (!font) continue;
    glyphs.push({font, g: font.charToGlyph(ch)});
  }
  const adv = ({font, g}) => g.advanceWidth * size / font.unitsPerEm;
  const w = glyphs.reduce((t, e) => t + adv(e) + sp, -sp);
  let cx = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x; const ds = [];
  glyphs.forEach(e => { ds.push(e.g.getPath(cx, y, size).toPathData(1)); cx += adv(e) + sp; });
  return {d: ds.join(' '), w};
}

// ------------------------------------------------------------------ mascotte
const INK = '#2a1f45';
const P = {ink: INK, mask: '#43375c', white: '#fcf9ff', pink: '#ff7fb5', pinkD: '#ff4f97', gold: '#ffcf4a', violet: '#7a5cff', sky: '#5fd0ff'};
const f1 = n => Math.round(n * 10) / 10;

// percorso simmetrico: si descrive la metà destra (dall'alto verso il basso, sull'asse x=256) e viene specchiata
function symPath(segs){
  const mx = x => 512 - x; const d = segs.map(s => s[0] + s.slice(1).map(f1).join(' ')).join(' ');
  const ends = segs.map(s => [s[s.length - 2], s[s.length - 1]]); let back = '';
  for (let i = segs.length - 1; i >= 1; i--){
    const s = segs[i], prev = ends[i - 1];
    if (s[0] === 'L') back += 'L' + f1(mx(prev[0])) + ' ' + f1(prev[1]);
    else if (s[0] === 'C') back += 'C' + [mx(s[3]), s[4], mx(s[1]), s[2], mx(prev[0]), prev[1]].map(f1).join(' ');
    else if (s[0] === 'Q') back += 'Q' + [mx(s[1]), s[2], mx(prev[0]), prev[1]].map(f1).join(' ');
  }
  return d + back + 'Z';
}
const defs = id => `<defs>
<linearGradient id="${id}fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdb2d2"/><stop offset="1" stop-color="#8f83aa"/></linearGradient>
<linearGradient id="${id}face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4effb"/><stop offset="1" stop-color="#d9d0ea"/></linearGradient>
<linearGradient id="${id}hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f6bff"/><stop offset="1" stop-color="#c04bff"/></linearGradient>
<linearGradient id="${id}hoodD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3fe0"/><stop offset="1" stop-color="#3a24a8"/></linearGradient>
<linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe685"/><stop offset="1" stop-color="#f5a623"/></linearGradient>
<linearGradient id="${id}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a58"/><stop offset=".55" stop-color="#5b3bd0"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient>
<linearGradient id="${id}book" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5aa5"/><stop offset="1" stop-color="#ff8a4d"/></linearGradient>
</defs>`;

const tail = id => {
  const d = 'M318 470 C400 486 468 452 470 384 C472 336 440 312 420 300';
  return `<g class="tailwag"><path d="${d}" fill="none" stroke="${INK}" stroke-width="64" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="url(#${id}fur)" stroke-width="46" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="${P.mask}" stroke-width="46" stroke-dasharray="20 44" stroke-dashoffset="-6"/>
<path d="M424 302 C420 300 418 300 416 298" fill="none" stroke="${P.mask}" stroke-width="46" stroke-linecap="round"/>
<path d="M330 452 C400 468 452 440 456 388" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="7" stroke-linecap="round"/></g>`;
};
const body = id => `<g><ellipse cx="256" cy="402" rx="128" ry="34" fill="url(#${id}hoodD)" stroke="${INK}" stroke-width="10"/>
<path d="M150 396 C126 430 116 474 114 512 L398 512 C396 474 386 430 362 396 C336 410 296 418 256 418 C216 418 176 410 150 396 Z" fill="url(#${id}hood)" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
<path d="M160 404 C190 424 222 430 256 430 C290 430 322 424 352 404" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" opacity=".55"/>
<path d="M226 420 L220 476" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="220" cy="480" r="7" fill="#fff" stroke="${INK}" stroke-width="4"/>
<path d="M286 420 L292 476" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="292" cy="480" r="7" fill="#fff" stroke="${INK}" stroke-width="4"/></g>`;
const ear = (id, side) => { const cx = 256 + side * 108, cy = 126;
  return `<g transform="rotate(${side * 20} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="46" ry="52" fill="url(#${id}fur)" stroke="${INK}" stroke-width="10"/>
<ellipse cx="${cx}" cy="${cy + 6}" rx="26" ry="32" fill="${P.pink}" stroke="${INK}" stroke-width="6"/><ellipse cx="${cx - side * 4}" cy="${cy - 2}" rx="11" ry="14" fill="#fff" opacity=".28"/></g>`; };
const HEAD_HALF = [['M', 256, 128], ['C', 336, 128, 402, 158, 418, 216], ['C', 424, 240, 428, 254, 440, 266], ['L', 462, 278], ['L', 436, 296], ['L', 456, 330], ['L', 414, 334], ['C', 392, 372, 330, 398, 256, 398]];
function eyes(id, kind){
  const L = 200, R = 312, y = 252;
  const open = x => `<g><ellipse cx="${x}" cy="${y}" rx="27" ry="34" fill="url(#${id}iris)" stroke="${INK}" stroke-width="5"/><ellipse cx="${x}" cy="${y - 6}" rx="16" ry="21" fill="${INK}" opacity=".8"/>
<ellipse cx="${x - 8}" cy="${y - 14}" rx="10" ry="12" fill="#fff"/><circle cx="${x + 9}" cy="${y + 12}" r="5.5" fill="#fff"/><circle cx="${x + 12}" cy="${y - 20}" r="3" fill="#fff" opacity=".9"/></g>`;
  const arc = (x, up) => `<path d="M${x - 24} ${y + (up ? 6 : -4)} Q${x} ${y + (up ? -26 : 24)} ${x + 24} ${y + (up ? 6 : -4)}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`;
  const star = x => `<g><ellipse cx="${x}" cy="${y}" rx="28" ry="34" fill="url(#${id}iris)" stroke="${INK}" stroke-width="5"/><path transform="translate(${x} ${y}) scale(.95)" d="M0 -23 L6.500 -7 L23 -6 L10 4.500 L14.500 21 L0 12 L-14.500 21 L-10 4.500 L-23 -6 L-6.500 -7Z" fill="#fff"/></g>`;
  if (kind === 'happy') return arc(L, true) + arc(R, true);
  if (kind === 'sleep') return arc(L, false) + arc(R, false);
  if (kind === 'wink') return open(L) + arc(R, true);
  if (kind === 'star') return star(L) + star(R);
  return open(L) + open(R);
}
function mouth(kind){
  if (kind === 'open') return `<path d="M232 318 Q256 356 280 318 Q256 326 232 318Z" fill="${INK}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M244 336 Q256 350 268 336 Q256 330 244 336Z" fill="${P.pink}"/>`;
  if (kind === 'o') return `<ellipse cx="256" cy="330" rx="8" ry="10" fill="${INK}"/>`;
  return `<path d="M256 308 L256 318" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M256 318 Q244 336 226 324" fill="none" stroke="${INK}" stroke-width="5.500" stroke-linecap="round"/><path d="M256 318 Q268 336 286 324" fill="none" stroke="${INK}" stroke-width="5.500" stroke-linecap="round"/>`;
}
function head(id, o){
  const hp = symPath(HEAD_HALF);
  const maskP = symPath([['M', 256, 224], ['C', 296, 206, 350, 206, 392, 234], ['C', 412, 250, 404, 282, 374, 292], ['C', 330, 306, 288, 290, 256, 270]]);
  return `<g>${ear(id, -1)}${ear(id, 1)}<path d="${hp}" fill="url(#${id}fur)" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
<clipPath id="${id}hc"><path d="${hp}"/></clipPath>
<g clip-path="url(#${id}hc)"><ellipse cx="256" cy="352" rx="176" ry="104" fill="url(#${id}face)"/><ellipse cx="200" cy="150" rx="70" ry="22" fill="#fff" opacity=".22" transform="rotate(-14 200 150)"/></g>
<path d="M256 134 C270 150 282 190 280 234 L232 234 C230 190 242 150 256 134Z" fill="${P.mask}"/>
<path d="${maskP}" fill="${P.mask}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><rect x="236" y="232" width="40" height="36" rx="10" fill="${P.mask}"/>
<ellipse cx="322" cy="196" rx="20" ry="10" fill="#fff" transform="rotate(-12 322 196)"/><ellipse cx="190" cy="196" rx="20" ry="10" fill="#fff" transform="rotate(12 190 196)"/>
<ellipse cx="256" cy="322" rx="70" ry="52" fill="${P.white}"/>
<g class="eyes">${eyes(id, o.eyes || 'open')}</g>
<ellipse cx="146" cy="300" rx="24" ry="13" fill="${P.pink}" opacity=".6"/><ellipse cx="366" cy="300" rx="24" ry="13" fill="${P.pink}" opacity=".6"/>
<ellipse cx="256" cy="296" rx="18" ry="12" fill="${INK}"/><ellipse cx="250" cy="292" rx="6" ry="3.400" fill="#fff" opacity=".85"/>${mouth(o.mouth || 'smile')}</g>`;
}
const crown = id => `<g transform="translate(0 6)"><path d="M212 138 L212 100 L234 118 L256 84 L278 118 L300 100 L300 138 Q256 148 212 138Z" fill="url(#${id}gold)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<circle cx="256" cy="120" r="7" fill="${P.pinkD}" stroke="${INK}" stroke-width="3"/><circle cx="228" cy="126" r="4.500" fill="${P.sky}" stroke="${INK}" stroke-width="2.500"/><circle cx="284" cy="126" r="4.500" fill="${P.sky}" stroke="${INK}" stroke-width="2.500"/>
<circle cx="212" cy="98" r="6" fill="#fff5c4" stroke="${INK}" stroke-width="3"/><circle cx="256" cy="82" r="6.500" fill="#fff5c4" stroke="${INK}" stroke-width="3"/><circle cx="300" cy="98" r="6" fill="#fff5c4" stroke="${INK}" stroke-width="3"/></g>`;
const paw = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0})"><ellipse rx="25" ry="21" fill="${P.mask}" stroke="${INK}" stroke-width="6"/><circle cx="-11" cy="-16" r="7" fill="${P.mask}" stroke="${INK}" stroke-width="4"/><circle cx="1" cy="-20" r="7.500" fill="${P.mask}" stroke="${INK}" stroke-width="4"/><circle cx="13" cy="-15" r="7" fill="${P.mask}" stroke="${INK}" stroke-width="4"/></g>`;
const manga = (id, x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-50" y="-66" width="100" height="132" rx="8" fill="#fff8fc" stroke="${INK}" stroke-width="7"/>
<rect x="-50" y="-66" width="94" height="132" rx="8" fill="url(#${id}book)" stroke="${INK}" stroke-width="7"/><rect x="-50" y="-66" width="14" height="132" rx="6" fill="#000" opacity=".16"/>
<path d="M-6 -20 L2 -6 L18 -2 L6 8 L9 24 L-6 16 L-21 24 L-18 8 L-30 -2 L-14 -6Z" fill="#fff5c4" stroke="${INK}" stroke-width="4" stroke-linejoin="round" transform="translate(4 -10) scale(1.100)"/>
<rect x="-30" y="34" width="66" height="18" rx="5" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M-22 43 h50" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
const kern = (cx, cy, r) => `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff4cf" stroke="${INK}" stroke-width="4"/><circle cx="${cx - r * .3}" cy="${cy - r * .3}" r="${r * .38}" fill="#fff"/></g>`;
const popcorn = (id, x, y) => `<g transform="translate(${x} ${y})">${kern(-30, -62, 16)}${kern(0, -72, 18)}${kern(30, -60, 16)}${kern(-14, -50, 15)}${kern(16, -46, 15)}
<path d="M-50 -44 L50 -44 L38 58 Q0 66 -38 58 Z" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M-32 -42 L-26 60 L-12 62 L-14 -42Z M8 -42 L10 62 L24 60 L20 -42Z" fill="#ff4f6d"/>
<path d="M-50 -44 L50 -44 L38 58 Q0 66 -38 58 Z" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><rect x="-30" y="-10" width="60" height="26" rx="8" fill="#ffd45e" stroke="${INK}" stroke-width="4"/><path d="M-18 3 h36" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
const magnifier = (id, x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 34 L0 92" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M0 34 L0 92" stroke="#ff8a4d" stroke-width="11" stroke-linecap="round"/>
<circle r="46" fill="#bfe9ff" fill-opacity=".55" stroke="${INK}" stroke-width="9"/><circle r="46" fill="none" stroke="#5fd0ff" stroke-width="4" opacity=".9"/><path d="M-28 -12 Q-22 -30 -6 -34" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/></g>`;
const zzz = (x, y) => { const a = `M${x} ${y} h34 l-34 40 h34`, b = `M${x + 44} ${y - 46} h24 l-24 28 h24`;
  return `<g class="tw"><path d="${a}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="${a}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${b}" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="${b}" fill="none" stroke="#fff" stroke-width="5.500" stroke-linecap="round" stroke-linejoin="round"/></g>`; };
const sparkle = (x, y, s, c, cls) => `<path ${cls ? `class="${cls}" ` : ''}d="M${x} ${y - s} Q${x + s * .18} ${y - s * .18} ${x + s} ${y} Q${x + s * .18} ${y + s * .18} ${x} ${y + s} Q${x - s * .18} ${y + s * .18} ${x - s} ${y} Q${x - s * .18} ${y - s * .18} ${x} ${y - s}Z" fill="${c || '#fff'}"/>`;

const ANIM_CSS = `<style>
.bob{animation:bob 2s ease-in-out infinite}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.tailwag{transform-origin:318px 470px;animation:wag 1.7s ease-in-out infinite alternate}@keyframes wag{from{transform:rotate(-4deg)}to{transform:rotate(6deg)}}
.eyes{transform-origin:256px 252px;animation:blink 4.4s infinite}@keyframes blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
.tw{transform-box:fill-box;transform-origin:center;animation:tw 1.8s ease-in-out infinite}.tw2{animation-delay:-.9s}.tw3{animation-delay:-.4s}@keyframes tw{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`;

// intero personaggio (busto) come frammento: {defs, g}
function mascotParts(o){
  o = o || {}; const id = o.id || 'm', pose = o.pose || 'manga'; let s = '';
  if (o.tail !== false) s += tail(id);
  s += body(id) + head(id, o);
  if (o.crown !== false) s += crown(id);
  if (pose === 'manga') s += manga(id, 256, 452, -6) + paw(204, 462, -20) + paw(308, 462, 20);
  else if (pose === 'popcorn') s += popcorn(id, 256, 458) + paw(212, 470, -14) + paw(300, 470, 14);
  else if (pose === 'search') s += paw(200, 470, -10) + magnifier(id, 380, 398, 18) + paw(360, 458, -20);
  else if (pose === 'sleep') s += manga(id, 256, 458, -6) + paw(204, 470, -20) + paw(308, 470, 20) + zzz(400, 130);
  if (o.sparks !== false) s += sparkle(96, 110, 16, '#fff', 'tw') + sparkle(432, 96, 12, '#ffe685', 'tw tw2') + sparkle(74, 210, 8, P.sky, 'tw tw3');
  return {defs: defs(id), g: `<g transform="translate(15 4) scale(.94)">${s}</g>`};
}
function mascotSvg(o){
  const p = mascotParts(o);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${o && o.animated ? ANIM_CSS : ''}${p.defs}${o && o.animated ? '<g class="bob">' : ''}${p.g}${o && o.animated ? '</g>' : ''}</svg>`;
}

// ------------------------------------------------------------------ scritte del marchio
const wordmarkGrad = `<linearGradient id="wm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6a8"/><stop offset=".55" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff8a2a"/></linearGradient>`;
function wordmark(text, size, x, y, o){
  o = o || {}; const t = textPath(text, size, x, y, {anchor: o.anchor, spacing: o.spacing || 0}); const sw = o.stroke || size * .16;
  return {w: t.w, g: `<path d="${t.d}" fill="${P.pinkD}" stroke="${P.pinkD}" stroke-width="${sw}" stroke-linejoin="round" transform="translate(${size * .045} ${size * .075})"/>
<path d="${t.d}" fill="${INK}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/><path d="${t.d}" fill="url(#wm)"/>`};
}
function ribbon(text, size, cx, cy, padX, o){
  o = o || {}; const t = textPath(text, size, cx, cy + size * .36, {anchor: 'middle', spacing: o.spacing || 0}); const w = t.w + padX * 2, h = size * 1.55;
  return `<g><rect x="${f1(cx - w / 2)}" y="${f1(cy - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${o.fill || '#7a5cff'}" stroke="${INK}" stroke-width="${size * .16}"/><rect x="${f1(cx - w / 2 + 3)}" y="${f1(cy - h / 2 + 3)}" width="${f1(w - 6)}" height="${f1(h * .42)}" rx="${f1(h * .21)}" fill="#fff" opacity=".22"/><path d="${t.d}" fill="#fff"/></g>`;
}

// ------------------------------------------------------------------ sfondi manga: linee di concentrazione, retino
function rng(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function focusLines(cx, cy, r0, r1, n, seed, fill, op){
  const r = rng(seed); let d = '';
  for (let i = 0; i < n; i++){
    const a = i / n * Math.PI * 2 + (r() - .5) * .04, w = (.004 + r() * .022) * (r() > .8 ? 1.8 : 1);
    const ax = cx + Math.cos(a - w) * r1, ay = cy + Math.sin(a - w) * r1, bx = cx + Math.cos(a + w) * r1, by = cy + Math.sin(a + w) * r1;
    d += `M${f1(cx + Math.cos(a) * r0)} ${f1(cy + Math.sin(a) * r0)}L${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}Z`;
  }
  return `<path d="${d}" fill="${fill || '#fff'}" fill-opacity="${op == null ? .14 : op}"/>`;
}
function squircle(cx, cy, r, n){
  n = n || 5; const pts = [];
  for (let i = 0; i < 240; i++){ const t = i / 240 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push([cx + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), cy + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]); }
  return 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
}

// ------------------------------------------------------------------ logo orizzontale (barra in alto)
function logoSvg(){
  const m = mascotParts({id: 'l', pose: 'none', tail: false, sparks: false});
  const k = .58, head_ = `<g transform="translate(${f1(8 - 60 * k)} ${f1(12 - 74 * k)}) scale(${k})">${head('l', {})}${crown('l')}</g>`;
  const x0 = 256, w1 = wordmark('RACCOON TIER', 76, x0, 116, {spacing: 1});
  const rib = ribbon('ANIME · FILM · MANGA', 27, x0 + w1.w / 2, 168, 22, {spacing: 2.500});
  const W = Math.round(x0 + w1.w + 16), H = 214;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Raccoon Tier — Anime, Film e Manga"><defs>${wordmarkGrad}</defs>${m.defs}${head_}${w1.g}${rib}</svg>`;
}

// logo compatto (telefono): testa a sinistra, scritta su due righe
function logoCompactSvg(){
  const m = mascotParts({id: 'c', pose: 'none', tail: false, sparks: false});
  const k = .5, head_ = `<g transform="translate(${f1(6 - 60 * k)} ${f1(8 - 74 * k)}) scale(${k})">${head('c', {})}${crown('c')}</g>`;
  const x0 = 212, a = wordmark('RACCOON', 66, x0, 86, {spacing: 1}), b = wordmark('TIER', 66, x0, 150, {spacing: 1});
  const W = Math.round(x0 + a.w + 14), H = 176;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Raccoon Tier"><defs>${wordmarkGrad}</defs>${m.defs}${head_}${a.g}${b.g}</svg>`;
}

// ------------------------------------------------------------------ icona dell'app
function iconSvg(kind){
  // kind: 'any' (squircle con angoli trasparenti) | 'maskable' e 'apple' (quadrato pieno, contenuto più piccolo)
  const full = kind !== 'any', k = full ? .70 : .86;
  const bg = full ? `<rect width="512" height="512" fill="url(#ib)"/>` : `<path d="${squircle(256, 256, 244, 5)}" fill="url(#ib)"/>`;
  const clip = full ? '' : `<clipPath id="ic"><path d="${squircle(256, 256, 244, 5)}"/></clipPath>`;
  const m = mascotParts({id: 'i', pose: 'none', tail: false, sparks: false});
  const cx = 256, cy = 236;                                  // centro dell'area testa+corona: (x 60–462, y 82–402)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>
<linearGradient id="ib" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f6bff"/><stop offset=".55" stop-color="#b13cf5"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient>
<radialGradient id="ig" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>${clip}</defs>
${bg}<g ${full ? '' : 'clip-path="url(#ic)"'}>${focusLines(256, 246, 90, 420, 64, 7, '#fff', .16)}<circle cx="256" cy="246" r="190" fill="url(#ig)"/>
<path d="M0 340 Q256 300 512 340 V512 H0Z" fill="#000" opacity=".10"/>
${!full ? '<path d="M40 60 Q256 -20 472 60 L472 120 Q256 60 40 120Z" fill="#fff" opacity=".10"/>' : ''}</g>
<g transform="translate(${256 - cx * k} ${256 - cy * k}) scale(${k})">${m.defs}${head('i', {})}${crown('i')}</g></svg>`;
}

// ------------------------------------------------------------------ schermata d'apertura (768×1376, animata)
function introSvg(){
  const W = 768, H = 1376, r = rng(11); let stars = '';
  for (let i = 0; i < 46; i++){ const x = r() * W, y = r() * 560, s = 4 + r() * 9; stars += sparkle(f1(x), f1(y), f1(s), ['#fff', '#ffe685', '#bff0ff', '#ffd1f0'][i % 4], 'tw' + (i % 3 ? ' tw' + (1 + i % 3) : '')); }
  let petals = ''; const r2 = rng(5);
  for (let i = 0; i < 26; i++){ const x = r2() * W, y = r2() * 900, s = 8 + r2() * 12, d = 7 + r2() * 8, dl = -r2() * d;
    petals += `<g class="petal" style="animation-duration:${f1(d)}s;animation-delay:${f1(dl)}s"><path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(r2() * 360)})" d="M0 0 C${f1(s * .9)} ${f1(-s * .5)} ${f1(s * 1.2)} ${f1(s * .8)} 0 ${f1(s * 1.4)} C${f1(-s * 1.2)} ${f1(s * .8)} ${f1(-s * .9)} ${f1(-s * .5)} 0 0Z" fill="#ffb7d9" opacity=".85"/></g>`; }
  // skyline
  let sky = ''; const r3 = rng(21); let x = -10;
  while (x < W + 10){ const w = 30 + r3() * 54, h = 90 + r3() * 210; sky += `<rect x="${f1(x)}" y="${f1(H - 150 - h)}" width="${f1(w)}" height="${f1(h + 160)}" fill="#14082f"/>`;
    for (let wy = H - 150 - h + 14; wy < H - 150; wy += 20) for (let wx = x + 6; wx < x + w - 8; wx += 14) if (r3() > .72) sky += `<rect x="${f1(wx)}" y="${f1(wy)}" width="5" height="8" fill="${r3() > .5 ? '#ffd45e' : '#ff9fd6'}" opacity=".8"/>`; x += w + 3 + r3() * 6; }
  const tower = `<path d="M600 ${H - 150} L620 ${H - 470} L640 ${H - 150}Z M614 ${H - 470} L620 ${H - 640} L626 ${H - 470}Z" fill="#1c0d3d"/><rect x="606" y="${H - 372}" width="28" height="10" fill="#ff5fa2"/><rect x="612" y="${H - 268}" width="16" height="8" fill="#ff5fa2"/><circle cx="620" cy="${H - 642}" r="4" fill="#ff5fa2"/>`;
  const m = mascotParts({id: 'n', pose: 'manga'});
  const title = wordmark('RACCOON TIER', 88, 384, 1040, {anchor: 'middle', spacing: 2}), rib = ribbon('ANIME · FILM · MANGA', 30, 384, 1104, 28, {spacing: 4});
  const jp = textPath('アニメ・映画・マンガ', 34, 384, 170, {anchor: 'middle', jp: true, spacing: 6});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">${ANIM_CSS}
<style>.petal{animation:fall linear infinite}@keyframes fall{0%{transform:translate(0,-60px) rotate(0)}50%{transform:translate(40px,520px) rotate(200deg)}100%{transform:translate(-20px,1120px) rotate(400deg)}}
.moon{animation:moonp 5s ease-in-out infinite alternate;transform-origin:384px 420px}@keyframes moonp{from{transform:scale(1)}to{transform:scale(1.035)}}.spin{transform-origin:384px 640px;animation:spin 90s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>
<defs>${wordmarkGrad}${m.defs}<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0524"/><stop offset=".38" stop-color="#2a1170"/><stop offset=".64" stop-color="#7a2ab8"/><stop offset=".8" stop-color="#ff6ec7"/><stop offset="1" stop-color="#ffb37a"/></linearGradient>
<radialGradient id="moon" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fffaf5"/><stop offset=".6" stop-color="#ffd6ec"/><stop offset="1" stop-color="#ffa8d6"/></radialGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8ad8" stop-opacity=".6"/><stop offset="1" stop-color="#ff8ad8" stop-opacity="0"/></radialGradient>
<pattern id="ht" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="8" cy="8" r="3.400" fill="#fff" fill-opacity=".22"/></pattern>
<linearGradient id="htf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="htm"><rect y="700" width="${W}" height="500" fill="url(#htf)"/></mask></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>${stars}
<circle cx="384" cy="430" r="420" fill="url(#glow)"/><g class="spin">${focusLines(384, 640, 200, 1500, 96, 3, '#fff', .09)}</g>
<g class="moon"><circle cx="384" cy="420" r="250" fill="url(#moon)"/><circle cx="300" cy="350" r="34" fill="#ffb8de" opacity=".55"/><circle cx="470" cy="470" r="46" fill="#ffb8de" opacity=".45"/><circle cx="430" cy="320" r="18" fill="#ffb8de" opacity=".5"/></g>
<rect y="700" width="${W}" height="500" fill="url(#ht)" mask="url(#htm)"/>
${sky}${tower}<rect y="${H - 160}" width="${W}" height="170" fill="#0e0524"/>
<g transform="translate(384 992) scale(1.1) translate(-256 -512)"><g class="bob">${m.g}</g></g>
${title.g}${rib}<path d="${jp.d}" fill="#fff" opacity=".92"/>${petals}</svg>`;
}

// ------------------------------------------------------------------ scrittura dei file
const write = (f, s) => { fs.writeFileSync(path.join(OUT, f), s); console.log('scritto icons/' + f, (s.length / 1024).toFixed(0) + ' KB'); };
write('mascot.svg', mascotSvg({}));
write('mascot-film.svg', mascotSvg({pose: 'popcorn', eyes: 'star', mouth: 'open'}));
write('mascot-search.svg', mascotSvg({pose: 'search', eyes: 'wink'}));
write('mascot-sleep.svg', mascotSvg({pose: 'sleep', eyes: 'sleep', mouth: 'o'}));
write('mascot-happy.svg', mascotSvg({eyes: 'happy', mouth: 'open'}));
write('mascot-anim.svg', mascotSvg({animated: true}));
write('logo.svg', logoSvg());
write('logo-compact.svg', logoCompactSvg());
write('intro.svg', introSvg());
write('icon-any.svg', iconSvg('any'));
// testa con corona senza sfondo (distintivo «titolo che amo» nella lista)
write('top-procione.svg', (()=>{ const m = mascotParts({id: 't', pose: 'none', tail: false, sparks: false}); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="52 66 408 344" width="408" height="344">${m.defs}${head('t', {eyes: 'happy', mouth: 'open'})}${crown('t')}</svg>`; })());
write('icon-full.svg', iconSvg('full'));

if (process.argv.includes('--png')){
  const {chromium} = require('/opt/node22/lib/node_modules/playwright');
  (async () => {
    const b = await chromium.launch({args: ['--no-sandbox']}); const p = await b.newPage();
    const job = async (svg, size, out, transparent) => {
      await p.setViewportSize({width: size, height: size});
      await p.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${fs.readFileSync(path.join(OUT, svg)).toString('base64')}" style="display:block;width:${size}px;height:${size}px">`);
      await p.waitForTimeout(150); await p.screenshot({path: path.join(OUT, out), omitBackground: transparent}); console.log('scritto icons/' + out);
    };
    await job('icon-any.svg', 512, 'icon-512.png', true); await job('icon-any.svg', 192, 'icon-192.png', true); await job('icon-any.svg', 64, 'favicon-64.png', true);
    await job('icon-full.svg', 512, 'icon-maskable-512.png', false); await job('icon-full.svg', 180, 'apple-touch-icon.png', false);
    await b.close();
  })();
}
