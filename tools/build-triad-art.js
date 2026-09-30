#!/usr/bin/env node
// Trova per ogni carta del Triple Triad (triad-cards.js) le immagini vere del gioco e le verifica: scrive triad-art.js.
// Fonti, dalla più bella: Steam (copertina verticale 600x900), Libretro (box art delle console, nome esatto preso dall'elenco del sito),
// Wikipedia inglese (immagine dell'articolo). Ogni carta ha fino a 3 immagini; senza nessuna l'app disegna comunque l'«Emblema».
// Uso: NODE_USE_ENV_PROXY=1 node tools/build-triad-art.js [--only id1,id2] [--redo] [--nowiki]   (riprende da dove era: tiene ciò che è già nel file)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CARDS = require(path.join(ROOT, 'triad-cards.js'));
const OUT = path.join(ROOT, 'triad-art.js');
const args = process.argv.slice(2);
const only = (args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean);
const redo = args.includes('--redo'), noWiki = args.includes('--nowiki');
const UA = {'user-agent': 'RaccoonTier/1.0 (https://kur0chanx.github.io/TierListGame/; carte Triple Triad)'};
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const norm = s=> String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/\bthe\b/g, ' ').replace(/[^a-z0-9]+/g, '');
// nomi italiani o abbreviati -> nomi inglesi usati dai siti (uno o più alias)
const ALIAS = {
  'Pokémon Rosso e Blu': ['Pokemon - Red Version', 'Pokemon - Blue Version', 'Pokémon Red and Blue'], 'Pokémon Oro e Argento': ['Pokemon - Gold Version', 'Pokemon - Silver Version', 'Pokémon Gold and Silver'],
  'Campo minato': ['Minesweeper'], 'Solitario': ['Klondike (solitaire)', 'Solitaire (video game)'], 'Uncharted 2: Il covo dei ladri': ['Uncharted 2: Among Thieves'],
  'Street Fighter II': ['Street Fighter II: The World Warrior', 'Street Fighter II: The World Warrior (World 910522)', 'Street Fighter II: The World Warrior (video game)'],
  'Pac-Man': ['Pac-Man (Midway)', 'Pac-Man (video game)'], 'Donkey Kong': ['Donkey Kong (US Set 1)', 'Donkey Kong (arcade game)'], 'Galaga': ['Galaga (Namco rev. B)', 'Galaga (video game)'],
  'Space Invaders': ['Space Invaders (Midway)', 'Space Invaders (video game)'], 'Pong': ['Pong (Atari)'], 'Asteroids': ['Asteroids (rev 4)', 'Asteroids (video game)'],
  'Mortal Kombat': ['Mortal Kombat (rev 5.0 T-Unit 03/19/93)', 'Mortal Kombat (1992 video game)'], 'Q*bert': ['Q*bert (US set 1)', 'Q*bert'],
  'Metal Slug': ['Metal Slug - Super Vehicle-001', 'Metal Slug (video game)'], 'Frogger': ['Frogger (video game)'], 'Defender': ['Defender (Williams)'], 'Joust': ['Joust (video game)'],
  'Centipede': ['Centipede (revision 4)'], 'Dig Dug': ['Dig Dug (video game)'], 'Pole Position': ['Pole Position (video game)'], 'Out Run': ['OutRun'], 'Snake': ['Snake (video game genre)'],
  'Crash Team Racing': ['CTR - Crash Team Racing'], 'Marvel\'s Spider-Man': ['Spider-Man (2018 video game)'], 'The Legend of Zelda: Ocarina of Time': ['The Legend of Zelda - Ocarina of Time'],
  'Final Fantasy VII': ['Final Fantasy VII (1997 video game)'], 'Tetris': ['Tetris (video game)', 'Tetris (Nintendo)'], 'Minecraft': ['Minecraft'],
  'Castlevania': ['Castlevania (video game)'], 'Prince of Persia': ['Prince of Persia (1989 video game)']
};
// sistema Libretro per ogni piattaforma della carta (la prima è quella giusta, le altre si provano se non si trova)
const LR = {
  'NES': ['Nintendo - Nintendo Entertainment System'], 'SNES': ['Nintendo - Super Nintendo Entertainment System'], 'N64': ['Nintendo - Nintendo 64'],
  'Game Boy': ['Nintendo - Game Boy', 'Nintendo - Game Boy Advance'], 'Game Boy Color': ['Nintendo - Game Boy Color', 'Nintendo - Game Boy'], 'GameCube': ['Nintendo - GameCube'], 'Wii': ['Nintendo - Wii'],
  'PS1': ['Sony - PlayStation'], 'PS2': ['Sony - PlayStation 2'], 'PS3': ['Sony - PlayStation 3'], 'PS Vita': ['Sony - PlayStation Vita'], 'Mega Drive': ['Sega - Mega Drive - Genesis'],
  'Dreamcast': ['Sega - Dreamcast'], 'Atari 2600': ['Atari - 2600'], 'Xbox': ['Microsoft - Xbox'], 'Xbox 360': ['Microsoft - Xbox 360'], 'Arcade': ['MAME', 'FBNeo - Arcade Games'],
  'PC': ['DOS', 'Sony - PlayStation 2', 'Microsoft - Xbox 360', 'Sony - PlayStation 3', 'Nintendo - Wii'], 'Multi': ['Sony - PlayStation 2', 'Sony - PlayStation', 'Nintendo - Nintendo 64'], 'Switch': [], 'PS4': [], 'Mobile': [], 'Nokia': []
};
const REGION_SCORE = n=> (/\(USA\)/.test(n) ? 0 : /\(World\)/.test(n) ? 1 : /\(USA, /.test(n) ? 2 : /\(Europe\)/.test(n) ? 3 : /\(Europe, /.test(n) ? 4 : 5) + (/\((Beta|Proto|Demo|Sample|Unl|Pirate|Hack|Bootleg)/i.test(n) ? 20 : 0) + (/Rev [A-Z0-9]/.test(n) ? 0.5 : 0) + (/\((Disc [2-9]|Disc B)\)/.test(n) ? 8 : 0);
const decode = s=> s.replace(/&amp;/g, '&').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function jget(u, tries){
  for(let i = 0; i < (tries || 3); i++){
    try{ const r = await fetch(u, {headers: UA}); if(r.status === 429){ const ra = +(r.headers.get('retry-after') || 0); await sleep((ra ? ra * 1000 : 3000) + i * 1500); continue; } if(!r.ok) return null; return await r.json(); }catch(e){ await sleep(800); }
  }
  return null;
}
async function imgOk(u){
  for(let i = 0; i < 2; i++){
    try{ const r = await fetch(u, {headers: {...UA, range: 'bytes=0-1023'}}); if(r.status === 429){ await sleep(2000); continue; } const ct = r.headers.get('content-type') || ''; return (r.status === 200 || r.status === 206) && /^image\//.test(ct); }catch(e){ await sleep(500); }
  }
  return false;
}
const names = c=> [c[1]].concat(ALIAS[c[1]] || []);

// ---- Steam
async function steamArt(c){
  const want = names(c).map(norm);
  for(const q of names(c).slice(0, 2)){
    const d = await jget('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(q) + '&cc=us&l=en');
    const items = (d && d.items || []).filter(x=> x.type === 'app');
    const EDI = /(remastered|remaster|definitiveedition|gameoftheyearedition|gameoftheyear|enhancededition|completeedition|complete|goty|specialedition|ultimateedition|ultimate|deluxeedition|deluxe|anniversaryedition|classic|hd|collection|themasteredition|masteredition|legendaryedition|redux|reforged|directorscut|reloaded)$/;
    const strip = s=> { let n = norm(s), p; do{ p = n; n = n.replace(EDI, ''); }while(n !== p && n.length > 3); return n; };
    const hit = items.find(x=> want.includes(norm(x.name))) || items.find(x=> want.includes(strip(x.name)));
    if(!hit) continue;
    const base = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + hit.id + '/', out = [];
    for(const f of ['library_600x900.jpg', 'header.jpg']){ if(await imgOk(base + f)) out.push(base + f); }
    if(out.length) return out;
  }
  return [];
}
// ---- Libretro: elenco dei file di ogni sistema (una sola richiesta per sistema)
const LIST = {};
async function libList(sys){
  if(LIST[sys]) return LIST[sys];
  let html = '';
  for(let i = 0; i < 3 && !html; i++){ try{ const r = await fetch('https://thumbnails.libretro.com/' + encodeURIComponent(sys).replace(/%2F/g, '/') + '/Named_Boxarts/', {headers: UA}); if(r.ok) html = await r.text(); }catch(e){ await sleep(1000); } }
  const files = []; const re = /<a href="([^"?]+\.png)">/g; let m;
  while((m = re.exec(html))) files.push(decode(decodeURIComponent(m[1])));
  const idx = Object.create(null);
  files.forEach(f=>{ const k = norm(f.replace(/\.png$/, '').replace(/\s*\([^)]*\)/g, '')); (idx[k] = idx[k] || []).push(f); });
  return LIST[sys] = {sys, files, idx};
}
// nomi nello stile No-Intro dei file Libretro: «The Legend of Zelda: Ocarina of Time» -> «Legend of Zelda, The - Ocarina of Time (USA)»
function noIntro(t){
  const sub = t.replace(/: /g, ' - ').replace(/&/g, '_');
  const m = sub.match(/^(The|A|An) (.*?)( - .*)?$/);
  return m ? [m[2] + ', ' + m[1] + (m[3] || ''), sub] : [sub];
}
const SUFFIX = ['(USA)', '(World)', '(USA, Europe)', '(Europe)', '(USA) (Rev 1)', '(USA) (Disc 1)', '(USA) (Disc 1) (Rev 1)', '(USA, Europe) (Rev 1)', '(USA, Australia)', '(USA, Europe, Brazil)', '(Japan, USA)', '(Japan)'];
async function libArt(c){
  const want = names(c).map(norm), systems = LR[c[3]] || [];
  const url = (sys, f)=> 'https://thumbnails.libretro.com/' + encodeURIComponent(sys).replace(/%2F/g, '/') + '/Named_Boxarts/' + encodeURIComponent(f);
  for(const sys of systems){                                  // 1) nome trovato nell'elenco del sito
    const L = await libList(sys);
    for(const w of want){
      const cand = L.idx[w]; if(!cand) continue;
      cand.sort((a, b)=> REGION_SCORE(a) - REGION_SCORE(b));
      return [url(sys, cand[0])];
    }
  }
  for(const sys of systems.slice(0, 2)){                     // 2) l'elenco è incompleto: provo i nomi standard e verifico che il file esista
    for(const t of names(c)){
      for(const base of noIntro(t)) for(const suf of SUFFIX){
        const f = base + ' ' + suf + '.png';
        if(await imgOk(url(sys, f))) return [url(sys, f)];
      }
    }
  }
  return [];
}
// ---- Wikipedia (piano B: a volte risponde «troppe richieste»; in quel caso la carta usa le altre fonti o l'Emblema)
let wikiBlocked = 0;
async function wikiArt(c){
  if(noWiki || wikiBlocked > 6) return [];
  const q = names(c).slice(-1)[0], year = c[2];
  const s = await jget('https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=' + encodeURIComponent(q + ' ' + (year || '') + ' video game') + '&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=600&redirects=1', 2);
  if(!s){ wikiBlocked++; return []; }
  wikiBlocked = 0;
  const pages = Object.values(s.query && s.query.pages || {}).sort((a, b)=> (a.index || 0) - (b.index || 0));
  const want = names(c).map(norm), clean = t=> norm(t.replace(/\((?:[^)]*video game|[^)]*game)\)/i, ''));
  const cand = pages.filter(p=> p.thumbnail && want.includes(clean(p.title)));
  cand.sort((a, b)=> (new RegExp(String(year)).test(b.title) ? 1 : 0) - (new RegExp(String(year)).test(a.title) ? 1 : 0));
  return cand.length ? [cand[0].thumbnail.source.replace(/\?.*$/, '')] : [];
}

(async()=>{
  let art = {};
  try{ const src = fs.readFileSync(OUT, 'utf8'); const m = src.match(/TRIAD_ART = (\{[\s\S]*?\});\n/); if(m) art = JSON.parse(m[1]); }catch(e){}
  const todo = CARDS.filter(c=> (only.length ? only.includes(c[0]) : (redo || !art[c[0]] || art[c[0]].length < 2)));
  console.log('da cercare:', todo.length, 'di', CARDS.length);
  let n = 0;
  // Steam e Libretro in parallelo (4 alla volta); Wikipedia una carta per volta, con calma
  const pool = 4; let i = 0;
  await Promise.all(Array.from({length: pool}, async ()=>{
    while(i < todo.length){
      const c = todo[i++], found = [];
      try{ found.push(...await steamArt(c)); }catch(e){ if(process.env.DEBUG) console.log("steamArt", c[1], e && e.message); }
      try{ found.push(...await libArt(c)); }catch(e){ if(process.env.DEBUG) console.log("libArt", c[1], e && e.message); }
      art[c[0]] = found.filter((u, k, a)=> a.indexOf(u) === k);
      if(++n % 25 === 0) console.log(n + '/' + todo.length);
    }
  }));
  if(!noWiki){
    for(const c of todo){
      if((art[c[0]] || []).length >= 2) continue;
      try{ const w = await wikiArt(c); art[c[0]] = (art[c[0]] || []).concat(w).filter((u, k, a)=> a.indexOf(u) === k); }catch(e){}
      await sleep(900);
    }
  }
  const ordered = {}; CARDS.forEach(c=> ordered[c[0]] = art[c[0]] || []);
  const body = `(function(root){\n  var TRIAD_ART = ${JSON.stringify(ordered)};\n  if(typeof module === 'object' && module.exports) module.exports = TRIAD_ART; else root.TRIAD_ART = TRIAD_ART;\n})(typeof self !== 'undefined' ? self : this);\n`;
  fs.writeFileSync(OUT, '// Triple Triad: immagini verificate per carta (generato da tools/build-triad-art.js, non modificare a mano). id -> [url, url, ...] dalla migliore.\n' + body);
  const none = CARDS.filter(c=> !ordered[c[0]].length);
  const by = {steam: 0, libretro: 0, wiki: 0};
  CARDS.forEach(c=>{ (ordered[c[0]] || []).forEach(u=>{ if(/steamstatic/.test(u)) by.steam++; else if(/libretro/.test(u)) by.libretro++; else by.wiki++; }); });
  console.log('con almeno un\'immagine:', CARDS.length - none.length, '/', CARDS.length, '· immagini per fonte:', JSON.stringify(by));
  if(none.length) console.log('senza immagine (useranno l\'Emblema):', none.map(c=> c[1] + ' [' + c[3] + ']').join(' | '));
})();
