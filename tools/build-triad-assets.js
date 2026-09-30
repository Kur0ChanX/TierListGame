#!/usr/bin/env node
// Genera: triad-chars.js (id -> [personaggio, scena]), tools/triad-prompts.md (istruzioni per creare le illustrazioni) e triad-imgs.js (elenco delle illustrazioni presenti in triad-img/).
// Uso: node tools/build-triad-assets.js   (rilancialo dopo aver aggiunto immagini in triad-img/)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CARDS = require(path.join(ROOT, 'triad-cards.js')).map(c=> c.concat(['base'])).map(c=> c.slice(0, 8).concat([c[8] === 'base' ? 'base' : c[8]])).concat(require(path.join(ROOT, 'triad-exp.js')).cards);
const CH = require('./triad-chars-src.js');
const chars = {};
CARDS.forEach(c=>{ const e = CH[c[1]]; if(!e) throw new Error('manca il personaggio di ' + c[1]); chars[c[0]] = e; });
fs.writeFileSync(path.join(ROOT, 'triad-chars.js'), `// Triple Triad: personaggio e scena di ogni carta (generato da tools/build-triad-assets.js). id -> [personaggio, scena]\n(function(root){\n  var TRIAD_CHARS = ${JSON.stringify(chars)};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_CHARS; else root.TRIAD_CHARS = TRIAD_CHARS;\n})(typeof self !== 'undefined' ? self : this);\n`);
const PAL = {fuoco: 'warm reds and oranges', ghiaccio: 'icy blues and white', tuono: 'electric yellow and deep violet', terra: 'earthy browns and ochre', veleno: 'toxic green and purple', vento: 'teal and pale sky', acqua: 'deep ocean blues', sacro: 'gold and soft white'};
const GP = {plat: 'bright saturated primary colors', rpg: 'epic fantasy palette', act: 'high-contrast action palette', fps: 'gritty steel and orange', fight: 'bold red and blue arena lights', horror: 'dark desaturated with one sickly accent', strat: 'earthy strategic map tones', race: 'speed blur, sunset colors', puzzle: 'clean candy colors', arcade: 'neon on black', sport: 'stadium lights', mobile: 'friendly bright colors', online: 'vivid competitive palette', indie: 'stylised limited palette', stealth: 'cold shadows and a single warm light', sandbox: 'blocky bright biomes'};
let md = `# Istruzioni per creare le illustrazioni delle carte\n\nOgni carta ha bisogno di **una illustrazione verticale 5:7** (consigliato 750×1050 px, formato WebP). Si salva in \`triad-img/<id>.webp\` (l'id è scritto in ogni scheda) e poi si lancia \`node tools/build-triad-assets.js\`: il gioco la usa da solo al posto delle copertine.\n\nFacoltativo: \`triad-img/<id>-full.webp\` = illustrazione alternativa "a tutta carta" usata dalle versioni Full Art e Segreta.\n\n## Stile comune (metti sempre questa riga)\n> Vertical collectible trading-card illustration, 5:7 ratio, poster / wallpaper key-art style, dynamic pose in an iconic moment, dramatic cinematic lighting, painterly detail, clean silhouette readable at small size, empty space at top-left (numbers) and bottom (name), no text, no logo, no border.\n\n## Le carte\n`;
CARDS.forEach(c=>{
  const [id, name, year, plat, lv, , el, g] = c, [chr, scene] = chars[id];
  md += `\n### ${name} — livello ${lv}\n- id: \`${id}\`\n- Personaggio: **${chr}** · Scena: ${scene}\n- Prompt: \`${chr} from the video game "${name}" (${year}), ${scene}. Palette: ${el ? PAL[el] : GP[g] || 'balanced'}. Collectible card key art, poster style.\`\n`;
});
fs.writeFileSync(path.join(__dirname, 'triad-prompts.md'), md);
const dir = path.join(ROOT, 'triad-img'); fs.mkdirSync(dir, {recursive: true});
const files = fs.readdirSync(dir).filter(f=> /\.(webp|png|jpg|jpeg)$/i.test(f)).map(f=> f.replace(/\.[^.]+$/, ''));
fs.writeFileSync(path.join(ROOT, 'triad-imgs.js'), `// Triple Triad: illustrazioni presenti in triad-img/ (generato da tools/build-triad-assets.js)\n(function(root){\n  var TRIAD_IMGS = ${JSON.stringify(files)};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_IMGS; else root.TRIAD_IMGS = TRIAD_IMGS;\n})(typeof self !== 'undefined' ? self : this);\n`);
console.log('personaggi:', CARDS.length, '· illustrazioni presenti:', files.length);
