// Lettura/scrittura dei dati dei giochi (formato v3, dalla v209: pensato per 20.000+ giochi).
//   giochi.js              -> const GIOCHI_DATA = {v: 3, sh, games, sagaMap, labels, market, lite}
//                             INDICE LEGGERO: serve subito per la lista. games = senza trama; labels = solo numeri e sigle
//                             (niente frasi «fa per te se…»); lite = per ogni gioco i pochi dati usati da lista, filtri e gusti
//                             (storyTag, dopamine, ore, punteggi, locandina) + «mx/cbt» = i tratti riconosciuti nei testi
//                             (calcolati qui con tratti.js, identici a quelli che calcolerebbe l'app).
//   dati/testi-K.js        -> i TESTI LUNGHI (trama, analisi, pro/contro, «fa per te se», dopamina) dei giochi con
//                             Math.floor(id / sh) === K. L'app li carica solo quando servono (apri un gioco, Update+…)
//                             e, se il catalogo non è enorme, in sottofondo a pezzetti.
// Gli strumenti usano load() per avere tutto insieme NEL VECCHIO FORMATO ({games con story, labels completi, enrich, dopa})
// e save(D) per riscrivere: non devono sapere niente dei pezzi. Legge anche il formato vecchio (giochi-dettagli-1..4.js).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SH = 250;                                   // giochi per pezzo di testi (≈ 600 KB a pezzo)
const DIR = path.join(ROOT, 'dati');
const LITE_KEYS = ['storyTag', 'dopamine', 'hoursMain', 'hoursCompletionist', 'coverUrl', 'eraScore', 'todayScore', 'gameplayScore'];
const LAB_TEXT = ['ok', 'ko', 'play'];
exports.SH = SH;

// ---- formato «a tabella» (enc: 't1'): una riga per gioco, nomi delle colonne scritti una volta sola (con 20.000 giochi pesa meno della metà) ----
// GC = colonne del gioco, LC = colonne dell'etichetta (prefisso l.), EC = colonne del lite (prefisso e.). Campi non previsti: colonna «x» (oggetto), così non si perde mai niente.
const NUL = '\u2205';
const GC = ['id', 'name', 'plat', 'year', 'ysort', 'tier', 'score', 'm', 'tags', 'note', 'hs', 'vs'];
const LC = ['d', 'g', 's', 'p', 'h', 'it', 'fam', 'demo', 'cost'];
const EC = ['storyTag', 'dopamine', 'hoursMain', 'hoursCompletionist', 'coverUrl', 'eraScore', 'todayScore', 'gameplayScore', 'mx', 'cbt'];
exports.COLS = {GC, LC, EC};
function encodeT1(idx, labIdx, lite){
  const rows = idx.map(g=>{
    const l = labIdx[g.id], e = lite[g.id], x = {};
    const enc = v=> v === undefined ? null : v === null ? NUL : v;     // «manca» = null; «c'è ed è null» = NUL (così il formato non perde niente)
    const r = GC.map(c=> enc(g[c]));
    Object.keys(g).forEach(k=>{ if(!GC.includes(k)) x[k] = g[k]; });
    r.push(l ? 1 : 0, ...LC.map(c=> l ? enc(l[c]) : null));
    if(l) Object.keys(l).forEach(k=>{ if(!LC.includes(k)) (x.l = x.l || {})[k] = l[k]; });
    r.push(e ? 1 : 0, ...EC.map(c=> e ? enc(e[c]) : null));
    if(e) Object.keys(e).forEach(k=>{ if(!EC.includes(k)) (x.e = x.e || {})[k] = e[k]; });
    r.push(Object.keys(x).length ? x : null);
    while(r.length && r[r.length - 1] === null) r.pop();
    return r;
  });
  return {cols: {g: GC, l: LC, e: EC}, rows};
}
function decodeT1(T){
  const gc = T.cols.g, lc = T.cols.l, ec = T.cols.e, games = [], labels = {}, lite = {};
  const dec = v=> v === NUL ? null : v;
  T.rows.forEach(r=>{
    const g = {}; let i = 0;
    gc.forEach(c=>{ const v = r[i++]; if(v !== null && v !== undefined) g[c] = dec(v); });
    const hasL = r[i++]; const l = {}; lc.forEach(c=>{ const v = r[i++]; if(v !== null && v !== undefined) l[c] = dec(v); });
    const hasE = r[i++]; const e = {}; ec.forEach(c=>{ const v = r[i++]; if(v !== null && v !== undefined) e[c] = dec(v); });
    const x = r[i] || null;
    if(x){ Object.keys(x).forEach(k=>{ if(k !== 'l' && k !== 'e') g[k] = x[k]; }); if(x.l) Object.assign(l, x.l); if(x.e) Object.assign(e, x.e); }
    games.push(g); if(hasL) labels[g.id] = l; if(hasE) lite[g.id] = e;
  });
  return {games, labels, lite};
}
exports.decodeT1 = decodeT1; exports.NUL = NUL;
const parse = (file, prefix)=> JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(new RegExp('^const ' + prefix + ' = '), '').replace(/;\s*$/, ''));
const readShard = f=>{ const t = fs.readFileSync(path.join(DIR, f), 'utf8'); return JSON.parse(t.slice(t.indexOf('.push(') + 6, t.indexOf(');window.rtTestiArrived'))); };

exports.load = function(){
  const base = parse('giochi.js', 'GIOCHI_DATA');
  if(base.enc === 't1'){ const d = decodeT1(base.t); Object.assign(base, d); delete base.t; delete base.enc; }
  if(base.v === 3){
    const T = {};
    if(fs.existsSync(DIR)) fs.readdirSync(DIR).filter(f=> /^testi-\d+\.js$/.test(f)).forEach(f=> Object.assign(T, readShard(f).g || {}));
    const enrich = {}, dopa = {}, labels = {};
    const games = base.games.map(g0=>{
      const g = Object.assign({}, g0), x = T[g.id] || {}; delete g.hs;
      if(x.story != null) g.story = x.story;
      return g;
    });
    Object.keys(base.labels || {}).forEach(id=>{ labels[id] = Object.assign({}, base.labels[id], (T[id] || {}).lab || {}); });
    Object.keys(T).forEach(id=>{ if(T[id].lab && !labels[id]) labels[id] = Object.assign({}, T[id].lab); if(T[id].enrich) enrich[id] = T[id].enrich; if(T[id].dopa) dopa[id] = T[id].dopa; });
    const {v, sh, lite, ...rest} = base;
    return Object.assign({}, rest, {games, labels, enrich, dopa});
  }
  // formato vecchio (fino alla v208)
  let det = {enrich: {}, dopa: {}};
  if(fs.existsSync(path.join(ROOT, 'giochi-dettagli-1.js'))){
    for(let k = 1; k <= 4; k++){
      const t = fs.readFileSync(path.join(ROOT, 'giochi-dettagli-' + k + '.js'), 'utf8');
      const j = JSON.parse(t.slice(t.indexOf('.push(') + 6, t.lastIndexOf(');')));
      Object.assign(det.enrich, j.enrich || {}); Object.assign(det.dopa, j.dopa || {});
    }
  } else if(base.enrich){ det = {enrich: base.enrich, dopa: base.dopa || {}}; }
  return Object.assign({}, base, {enrich: det.enrich || {}, dopa: det.dopa || {}});
};

exports.save = function(D, outRoot){                // outRoot: solo per le prove (catalogo finto); di norma la cartella del progetto
  const TR = require('../tratti.js'), ROOTW = outRoot || ROOT, DIRW = path.join(ROOTW, 'dati');
  const {enrich = {}, dopa = {}, labels = {}, games = [], ...rest} = D;
  const shards = {}, lite = {}, labIdx = {};
  const idx = games.map(g=>{
    const o = Object.assign({}, g); delete o.story; delete o.enrich; delete o.label;
    if(g.story) o.hs = 1;                                                         // «ha la trama» (per il filtro, senza scaricarla)
    const id = g.id, k = Math.floor(id / SH), e = enrich[id], l = labels[id];
    const sh = shards[k] = shards[k] || {};
    const x = {};
    if(g.story) x.story = g.story;
    if(e) x.enrich = e;
    if(dopa[id]) x.dopa = dopa[id];
    if(l){ const lt = {}; LAB_TEXT.forEach(f=>{ if(l[f] != null) lt[f] = l[f]; }); if(Object.keys(lt).length) x.lab = lt; }
    if(Object.keys(x).length) sh[id] = x;
    const lo = {};
    if(e) LITE_KEYS.forEach(f=>{ if(e[f] != null && e[f] !== '') lo[f] = e[f]; });
    const tt = TR.textTraits({story: g.story, enrich: Object.assign({}, e || {}, dopa[id] ? {dopa: dopa[id]} : {}), label: l || {}});
    if(tt.mx.length) lo.mx = tt.mx; if(tt.cbt) lo.cbt = 1;
    if(e || tt.mx.length) lite[id] = lo;
    return o;
  });
  Object.keys(labels).forEach(id=>{ const l = labels[id], o = {}; Object.keys(l || {}).forEach(f=>{ if(!LAB_TEXT.includes(f)) o[f] = l[f]; }); labIdx[id] = o; });
  const out = Object.assign({v: 3, sh: SH, enc: 't1'}, rest, {t: encodeT1(idx, labIdx, lite)});
  fs.writeFileSync(path.join(ROOTW, 'giochi.js'), 'const GIOCHI_DATA = ' + JSON.stringify(out) + ';\n');
  fs.mkdirSync(DIRW, {recursive: true});
  const keep = new Set();
  Object.keys(shards).forEach(k=>{
    const f = 'testi-' + k + '.js'; keep.add(f);
    fs.writeFileSync(path.join(DIRW, f), '(window.rtTestiArrivati = window.rtTestiArrivati || []).push(' + JSON.stringify({k: +k, g: shards[k]}) + ');window.rtTestiArrived && rtTestiArrived();\n');
  });
  fs.readdirSync(DIRW).filter(f=> /^testi-\d+\.js$/.test(f) && !keep.has(f)).forEach(f=> fs.unlinkSync(path.join(DIRW, f)));
  for(let k = 1; k <= 4; k++){ try{ fs.unlinkSync(path.join(ROOTW, 'giochi-dettagli-' + k + '.js')); }catch(e){} }
  try{ fs.unlinkSync(path.join(ROOTW, 'giochi-dettagli.js')); }catch(e){}
};
