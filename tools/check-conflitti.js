// v215: controllo dei CONFLITTI tra i file del programma (uso: node tools/check-conflitti.js)
// 1) nomi globali (function / const / let / var a inizio riga, fuori da (function(){…})) dichiarati in più file: l'ultimo vince e rompe il primo
// 2) id HTML duplicati nell'HTML
// 3) ordine degli script: ogni file in HTML anche in sw.js (SHELL) e nel workflow pages.yml
// 4) sintassi di tutti i file JS
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), HTML = fs.readFileSync(path.join(ROOT, 'Tier List RPG & JRPG di Mario.html'), 'utf8');
const scripts = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m=> m[1]).filter(s=> !/^https?:/.test(s));
const BIG = new Set(['giochi.js', 'facts.js', 'voti.js', 'ost.js', 'shots.js', 'radar.js', 'quality.js', 'discoveries.js']);
let problems = 0; const P = m=>{ problems++; console.log('⚠️  ' + m); };
const decl = {};
scripts.filter(s=> !BIG.has(s)).forEach(f=>{
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  t.forEach((l, i)=>{ const m = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(l); if(m){ const n = m[1] || m[2]; (decl[n] = decl[n] || []).push(f + ':' + (i + 1)); } });
});
Object.entries(decl).forEach(([n, where])=>{ const files = new Set(where.map(w=> w.split(':')[0])); if(files.size > 1) P('nome globale «' + n + '» dichiarato in più file: ' + where.join(', ')); });
const ids = {}; [...HTML.matchAll(/\sid="([^"]+)"/g)].forEach(m=> ids[m[1]] = (ids[m[1]] || 0) + 1);
Object.entries(ids).filter(([, n])=> n > 1).forEach(([id, n])=> P('id HTML duplicato «' + id + '» (' + n + ' volte)'));
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), wf = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
scripts.forEach(s=>{ if(!sw.includes("'" + s + "'")) P(s + ' manca in sw.js (SHELL)'); if(!wf.includes(' ' + s + ' ') && !wf.includes(' ' + s + '\n')) P(s + ' manca nel workflow pages.yml'); if(!fs.existsSync(path.join(ROOT, s))) P(s + ' è nell\'HTML ma il file non c\'è'); });
if(scripts[scripts.length - 1] !== 'motion.js') P('motion.js non è l\'ultimo script');
scripts.filter(s=> !BIG.has(s) && s.endsWith('.js')).concat(['sw.js']).forEach(f=>{ try{ cp.execFileSync(process.execPath, ['--check', path.join(ROOT, f)], {stdio: 'pipe'}); }catch(e){ P('errore di sintassi in ' + f + ': ' + String(e.stderr).split('\n').slice(0, 3).join(' ')); } });
console.log(problems ? '\n' + problems + ' problemi.' : 'Nessun conflitto: ' + scripts.length + ' script controllati.');
