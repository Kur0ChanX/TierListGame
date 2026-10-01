// v211: divide i file notturni «per gioco» più pesanti (colonne sonore ost.js, schermate shots.js) in pezzi dati/notte-F-K.js
// (K = id % 64), così l'app scarica solo il pezzo del gioco che apri invece di tutto il file (a 20.000 giochi sarebbero ~7 MB).
// I file interi in radice restano (li usano gli strumenti del server e la copia congelata backup-aurora).
// Uso: node tools/shard-night.js   (lo lanciano i workflow dopo build-ost.js / build-shots.js)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DIR = path.join(ROOT, 'dati'), NB = 64;
const FILES = [['ost', 'ost.js', 'OST'], ['shots', 'shots.js', 'GAME_SHOTS']];
exports.NB = NB;
if(require.main === module){
  fs.mkdirSync(DIR, {recursive: true});
  for(const [f, file, name] of FILES){
    const fp = path.join(ROOT, file); if(!fs.existsSync(fp)){ console.log(file, 'non c\'è: salto'); continue; }
    const o = JSON.parse(fs.readFileSync(fp, 'utf8').replace(new RegExp('^const ' + name + ' = '), '').replace(/;\s*$/, ''));
    const meta = Object.assign({}, o); delete meta.games;
    const parts = {};
    Object.keys(o.games || {}).forEach(id=>{ const k = (+id) % NB; (parts[k] = parts[k] || {})[id] = o.games[id]; });
    const keep = new Set();
    let bytes = 0;
    for(let k = 0; k < NB; k++){
      const fn = 'notte-' + f + '-' + k + '.js'; keep.add(fn);
      const body = Object.assign({f, k}, meta, {g: parts[k] || {}});        // anche i pezzi vuoti esistono: così l'app non chiede file che non ci sono
      const txt = '(window.rtNotte = window.rtNotte || []).push(' + JSON.stringify(body) + ');window.rtNotteArrived && rtNotteArrived();\n';
      bytes += txt.length;
      fs.writeFileSync(path.join(DIR, fn), txt);
    }
    fs.readdirSync(DIR).filter(x=> x.indexOf('notte-' + f + '-') === 0 && !keep.has(x)).forEach(x=> fs.unlinkSync(path.join(DIR, x)));
    console.log(file, '→', Object.keys(o.games || {}).length, 'giochi in', NB, 'pezzi, in media', Math.round(bytes / NB / 1024), 'KB a pezzo');
  }
}
