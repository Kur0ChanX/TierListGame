// Lettura/scrittura dei dati dei giochi, divisi in due file per l'avvio veloce dell'app:
//   giochi.js            -> const GIOCHI_DATA    = {games, sagaMap, labels, market}   (serve subito per la lista)
//   giochi-dettagli-1..4.js -> pezzi di {enrich, dopa} divisi per id % 4             (caricati dopo la prima schermata;
//                              se cambia un gioco cambia un solo pezzo e il telefono riscarica solo quello)
// Gli strumenti (check-data, ecc.) usano load() per avere tutto insieme; per modificare i dati usa load() e save().
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PARTS = 4;
exports.PARTS = PARTS;
const parse = (file, prefix)=> JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(new RegExp('^const ' + prefix + ' = '), '').replace(/;\s*$/, ''));
exports.load = function(){
  const base = parse('giochi.js', 'GIOCHI_DATA');
  let det = {enrich: {}, dopa: {}};
  if(fs.existsSync(path.join(ROOT, 'giochi-dettagli-1.js'))){
    for(let k = 1; k <= PARTS; k++){
      const t = fs.readFileSync(path.join(ROOT, 'giochi-dettagli-' + k + '.js'), 'utf8');
      const j = JSON.parse(t.slice(t.indexOf('.push(') + 6, t.lastIndexOf(');')));
      Object.assign(det.enrich, j.enrich || {}); Object.assign(det.dopa, j.dopa || {});
    }
  } else {
    try{ det = parse('giochi-dettagli.js', 'GIOCHI_DETAILS'); }catch(e){ if(base.enrich){ det = {enrich: base.enrich, dopa: base.dopa || {}}; } }
  }
  return Object.assign({}, base, {enrich: det.enrich || {}, dopa: det.dopa || {}});
};
exports.save = function(D){
  const {enrich, dopa, ...base} = D;
  fs.writeFileSync(path.join(ROOT, 'giochi.js'), 'const GIOCHI_DATA = ' + JSON.stringify(base) + ';\n');
  for(let k = 1; k <= PARTS; k++){
    const pick = o=>{ const r = {}; Object.keys(o || {}).forEach(id=>{ if(((+id % PARTS) + PARTS) % PARTS === k - 1) r[id] = o[id]; }); return r; };
    fs.writeFileSync(path.join(ROOT, 'giochi-dettagli-' + k + '.js'), '(window.GIOCHI_DETAILS_PARTS = window.GIOCHI_DETAILS_PARTS || []).push(' + JSON.stringify({part: k, enrich: pick(enrich), dopa: pick(dopa)}) + ');\n');
  }
  try{ fs.unlinkSync(path.join(ROOT, 'giochi-dettagli.js')); }catch(e){}
};
