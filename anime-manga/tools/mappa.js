// MAPPA DEL CODICE (risparmia token): elenca funzioni, sezioni e API pubbliche di un file con il numero di riga,
// così si legge solo l'intervallo che serve (Read con offset/limit) invece del file intero.
// Uso: node tools/mappa.js app.js            → mappa di un file
//      node tools/mappa.js app.js render     → solo le voci che contengono «render»
//      node tools/mappa.js --tutti           → una riga per file: righe totali e numero di funzioni
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = /^(giochi|facts|voti|ost|shots|radar|quality|discoveries|qrcode\.min|chiavi-cifrate)\.js$/;
const arg = process.argv[2], filt = (process.argv[3] || '').toLowerCase();
const RX = [
  [/^\s*(?:async\s+)?function\s+([\w$]+)\s*\(/, 'fn'],
  [/^\s*(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/, 'fn'],
  [/^\s*window\.([\w$]+)\s*=\s*/, 'API'],
  [/^\s*(?:H|SearchHub)\.([\w$]+)\s*=\s*/, 'API'],
  [/^\s*\/\/\s*-{3,}\s*(.+?)\s*-*\s*$/, '§'],
  [/^\s*\/\/\s*={5,}\s*$/, null],
  [/^\s*\/\/\s*(R\d+\)|\d+\))\s*(.+)$/, '§']
];
function map(file){
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n'), out = [];
  lines.forEach((l, i)=>{
    for(const [rx, kind] of RX){ const m = rx.exec(l); if(m && kind){ const name = kind === '§' ? (m[2] ? m[1] + ' ' + m[2] : m[1]) : m[1]; out.push({n: i + 1, kind, name: name.slice(0, 90)}); break; } }
  });
  return {lines: lines.length, out};
}
if(arg === '--tutti' || !arg){
  fs.readdirSync(ROOT).filter(f=> f.endsWith('.js') && !DATA.test(f)).sort().forEach(f=>{ const m = map(f); console.log(String(m.lines).padStart(6) + ' righe  ' + String(m.out.filter(x=> x.kind !== '§').length).padStart(4) + ' funzioni  ' + f); });
  console.log('\nUso: node tools/mappa.js FILE [parola] — poi leggi solo le righe che ti servono.');
} else {
  if(DATA.test(path.basename(arg))){ console.log('È un file di DATI: non si legge. Usa tools/data-io.js (load/save).'); process.exit(0); }
  const m = map(arg);
  console.log(arg + ' — ' + m.lines + ' righe');
  m.out.filter(x=> !filt || x.name.toLowerCase().includes(filt)).forEach(x=> console.log(String(x.n).padStart(6) + '  ' + (x.kind === '§' ? '§ ' : x.kind === 'API' ? '⇢ ' : '  ') + x.name));
}
