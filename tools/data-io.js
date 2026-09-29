// Lettura/scrittura dei dati dei giochi, divisi in due file per l'avvio veloce dell'app:
//   giochi.js            -> const GIOCHI_DATA    = {games, sagaMap, labels, market}   (serve subito per la lista)
//   giochi-dettagli.js   -> const GIOCHI_DETAILS = {enrich, dopa}                     (caricato dopo la prima schermata)
// Gli strumenti (check-data, ecc.) usano load() per avere tutto insieme; per modificare i dati usa load() e save().
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const parse = (file, prefix)=> JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(new RegExp('^const ' + prefix + ' = '), '').replace(/;\s*$/, ''));
exports.load = function(){
  const base = parse('giochi.js', 'GIOCHI_DATA');
  let det = {enrich: {}, dopa: {}};
  try{ det = parse('giochi-dettagli.js', 'GIOCHI_DETAILS'); }catch(e){ if(base.enrich){ det = {enrich: base.enrich, dopa: base.dopa || {}}; } }
  return Object.assign({}, base, {enrich: det.enrich || {}, dopa: det.dopa || {}});
};
exports.save = function(D){
  const {enrich, dopa, ...base} = D;
  fs.writeFileSync(path.join(ROOT, 'giochi.js'), 'const GIOCHI_DATA = ' + JSON.stringify(base) + ';\n');
  fs.writeFileSync(path.join(ROOT, 'giochi-dettagli.js'), 'const GIOCHI_DETAILS = ' + JSON.stringify({enrich: enrich || {}, dopa: dopa || {}}) + ';\n');
};
