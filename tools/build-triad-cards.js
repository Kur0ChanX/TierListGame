#!/usr/bin/env node
// Genera triad-cards.js dalle 200 carte di tools/triad-cards-src.js: id, valori dei 4 lati (stile FF8, fissi per sempre), elemento.
// Uso: node tools/build-triad-cards.js   (da rilanciare solo se si cambia la lista; i valori dipendono solo dal nome, quindi restano uguali)
const fs = require('fs'), path = require('path');
const SRC = require('./triad-cards-src.js');
const ROOT = path.join(__dirname, '..');
const slug = n=> String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function hash(s){ let h = 2166136261; for(const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ let a = seed >>> 0; return ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// genere -> [elemento, pesi dei lati alto/destra/basso/sinistra, probabilità che la carta abbia l'elemento]
const GEN = {
  plat: ['vento', [1.3, 1.0, 0.7, 1.0], .55], rpg: ['sacro', [1, 1, 1, 1], .6], act: ['fuoco', [1.15, 1.1, 0.85, 0.9], .5], fps: ['tuono', [1.35, 0.95, 0.75, 0.95], .55],
  fight: ['fuoco', [0.8, 1.35, 0.8, 1.35], .5], horror: ['veleno', [0.9, 1.0, 1.25, 0.9], .65], strat: ['terra', [1, 1, 1, 1], .55], race: ['vento', [0.9, 1.35, 0.9, 1.0], .5],
  puzzle: ['acqua', [1, 1, 1, 1], .5], arcade: [null, [1.1, 1.0, 1.0, 0.9], 0], sport: [null, [1, 1.2, 0.9, 1], 0], mobile: ['acqua', [1.1, 1, 1, 0.9], .35],
  online: ['tuono', [1, 1.1, 1, 1.1], .45], indie: ['ghiaccio', [1.05, 1, 1, 0.95], .5], stealth: ['ghiaccio', [1.1, 0.95, 1.1, 0.95], .6], sandbox: ['terra', [1, 1, 1.1, 1], .55]
};
const TARGET = [0, 12, 14, 16, 17.5, 19, 21, 22.5, 24, 26, 28];
const CAP = [0, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10];
const seen = new Set();
function gen(SRCX, setId){
  const out = [];
  for(let L = 1; L <= 10; L++){
    (SRCX[L] || []).forEach(([name, year, plat, genre])=>{
    const id = slug(name); if(seen.has(id)) throw new Error('id doppio ' + id); seen.add(id);
    const G = GEN[genre]; if(!G) throw new Error('genere sconosciuto ' + genre);
    const R = rng(hash(id));
    const v = [1, 1, 1, 1], cap = CAP[L], w = G[1].map(x=> x * (0.75 + R() * 0.5));
    if(L >= 9){ const k = [0, 1, 2, 3].sort((a, b)=> w[b] - w[a])[0]; v[k] = 10; }       // una A sul lato più forte
    let sum = Math.round(TARGET[L] + (R() * 2 - 1)), left = sum - v.reduce((a, b)=> a + b, 0), guard = 0;
    while(left > 0 && guard++ < 500){
      const opts = [0, 1, 2, 3].map(i=> v[i] >= (v[i] === 10 ? 10 : Math.min(cap, 9)) ? 0 : w[i] * (cap - v[i] + 0.5));
      const tot = opts.reduce((a, b)=> a + b, 0); if(!tot) break;
      let x = R() * tot, k = 0; while(x > opts[k]){ x -= opts[k]; k++; }
      v[k]++; left--;
    }
    if(L === 10 && Math.max(...v.filter((x, i)=> i !== v.indexOf(10))) < 8){ const k = v.map((x, i)=> [x, i]).filter(p=> p[0] !== 10).sort((a, b)=> b[0] - a[0])[0][1]; v[k] = 8; }
    const el = G[0] && R() < G[2] ? G[0] : null;
      out.push(setId ? [id, name, year, plat, L, v, el, genre, setId] : [id, name, year, plat, L, v, el, genre]);
    });
  }
  return out;
}
const out = gen(SRC);
const header = `// Triple Triad di Frugu: le 200 carte (generato da tools/build-triad-cards.js, non modificare a mano).
// [id, nome, anno, piattaforma, livello 1-10, [alto, destra, basso, sinistra] (10 = A), elemento o null, genere]
`;
const body = `(function(root){\n  var TRIAD_CARDS = ${JSON.stringify(out)};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_CARDS; else root.TRIAD_CARDS = TRIAD_CARDS;\n})(typeof self !== 'undefined' ? self : this);\n`;
fs.writeFileSync(path.join(ROOT, 'triad-cards.js'), header + body);
// espansioni (DLC): triad-exp.js = {sets:[{id, name, emoji, desc, level}], cards:[[...come le base..., idEspansione]]}
const EXP = require('./triad-exp-src.js'), expCards = [];
EXP.forEach(e=>{ expCards.push(...gen(e.cards, e.id)); });
const expBody = `(function(root){\n  var TRIAD_EXP = ${JSON.stringify({sets: EXP.map(e=> ({id: e.id, name: e.name, emoji: e.emoji, desc: e.desc, level: e.level})), cards: expCards})};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_EXP; else root.TRIAD_EXP = TRIAD_EXP;\n})(typeof self !== 'undefined' ? self : this);\n`;
fs.writeFileSync(path.join(ROOT, 'triad-exp.js'), '// Triple Triad: le carte delle espansioni (generato da tools/build-triad-cards.js, non modificare a mano). Come triad-cards.js con l\'id dell\'espansione in fondo.\n' + expBody);
console.log('espansioni:', EXP.map(e=> e.id + ' ' + gen.length).join(' ').replace(/ 1/g, ''), '· carte:', expCards.length);
const byL = {}; out.forEach(c=>{ (byL[c[4]] = byL[c[4]] || []).push(c[5].reduce((a, b)=> a + b, 0)); });
console.log('carte:', out.length, Object.entries(byL).map(([l, s])=> 'L' + l + ' somma ' + Math.min(...s) + '-' + Math.max(...s)).join(' · '));
const els = {}; out.forEach(c=> els[c[6] || 'nessuno'] = (els[c[6] || 'nessuno'] || 0) + 1); console.log('elementi:', JSON.stringify(els));
