#!/usr/bin/env node
// Crea un UNICO file HTML autosufficiente (CSS, JS, dati e immagini dentro) per mostrare l'app senza server:
// si apre con doppio clic o dal telefono. Serve per le anteprime; l'app vera resta nei file separati.
// Uso:  node anime-manga/tools/bundle.js [--out percorso.html]      (predefinito: tools/.cache/anteprima.html)
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const out = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : path.join(__dirname, '.cache', 'anteprima.html');
const MIME = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp'};
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const dataUri = f => { const p = path.join(ROOT, f); if (!fs.existsSync(p)) return f; const ext = path.extname(f).toLowerCase(); return 'data:' + (MIME[ext] || 'application/octet-stream') + ';base64,' + fs.readFileSync(p).toString('base64'); };
let html = read('index.html');
// CSS
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => {
  let css = read(f).replace(/url\((['"]?)(icons\/[^'")]+)\1\)/g, (mm, q, u) => 'url(' + dataUri(u) + ')');
  return '<style>/* ' + f + ' */\n' + css + '\n</style>';
});
// JS (nello stesso ordine dell'HTML)
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => {
  if (!fs.existsSync(path.join(ROOT, f))) return '';
  const js = read(f).replace(/<\/script/gi, '<\\/script');
  return '<script>/* ' + f + ' */\n' + js + '\n</script>';
});
// immagini e icone
html = html.replace(/(src|href|srcset)="(icons\/[^"]+)"/g, (m, a, u) => a + '="' + dataUri(u) + '"');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
// nell'anteprima non si registra il service worker (serve solo all'app installata)
html = html.replace('<meta name="build"', '<meta name="anteprima" content="1">\n<meta name="build"');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, html);
console.log('scritto', out, (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
