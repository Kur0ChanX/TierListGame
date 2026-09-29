#!/usr/bin/env node
// Costruisce discoveries.js: un grande elenco di giochi "da scoprire" raccolti dai SERVER di Steam, GOG, CheapShark, Wikipedia (e RAWG se c'è la chiave RAWG_KEY),
// dove il browser non ha blocchi CORS. Gira da solo ogni settimana su GitHub; a mano:  node tools/build-discoveries.js [--quick]
// Solo giochi con almeno 5/10: voto = % di recensioni positive su Steam, Metacritic (CheapShark, RAWG) o valutazione GOG. Wikipedia porta anche giochi senza voto.
// L'app li usa come fonte istantanea nella ricerca «Fruga altri titoli»: il giro di ricerca pesca a caso, per genere, da qui, senza chiamate di rete.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const QUICK = process.argv.includes('--quick');
const UA = {'User-Agent': 'TierListGame/1.0 (uso personale; +https://github.com/Kur0ChanX/TierListGame)', 'Accept': 'application/json'};
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
const norm = t=> String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[™®©]/g, '').replace(/[^a-z0-9]/g, '');
const clean = t=> String(t || '').replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
const unesc = t=> String(t || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
async function get(url, json = true, tries = 3){
  for(let a = 0; a < tries; a++){
    try{
      const r = await fetch(url, {headers: UA});
      if(r.status === 429 || r.status >= 500){ await sleep(5000 * (a + 1)); continue; }
      if(!r.ok) return null;
      return json ? await r.json() : await r.text();
    }catch(e){ await sleep(2000 * (a + 1)); }
  }
  return null;
}
const raw = fs.readFileSync(path.join(ROOT, 'giochi.js'), 'utf8').replace(/^const GIOCHI_DATA = /, '').replace(/;\s*$/, '');
const KNOWN = new Set(JSON.parse(raw).games.map(g=> norm(g.name)));

const NAME2CODE = {'JRPG': 'JRPG', 'RPG': 'WRPG', 'Action RPG': 'ACT', 'Turn-Based Combat': 'TUR', 'Turn-Based': 'TUR', 'Strategy RPG': 'TAC', 'Tactical RPG': 'TAC', 'Roguelike': 'ROG', 'Roguelite': 'ROG', 'Metroidvania': 'METR', 'Souls-like': 'SOUL',
  'Horror': 'HOR', 'Survival Horror': 'SURV', 'Survival': 'SAND', 'Platformer': 'PLAT', 'Precision Platformer': 'PLAT', '3D Platformer': 'PLAT3D', 'Puzzle': 'PUZ', 'Fighting': 'FIGHT', "Beat 'em up": 'BEAT', 'FPS': 'FPS', "Shoot 'Em Up": 'SHMUP',
  'Bullet Hell': 'SHMUP', 'Racing': 'RACE', 'Sports': 'SPORT', 'RTS': 'RTS', 'Turn-Based Strategy': 'TBS4X', '4X': 'TBS4X', 'Grand Strategy': 'GRAND', 'Visual Novel': 'VN', 'Stealth': 'STEALTH', 'Open World': 'OPENW', 'Rhythm': 'RHY',
  'Tower Defense': 'TOWERDEF', 'City Builder': 'CITY', 'Colony Sim': 'CITY', 'Life Sim': 'SIMLIFE', 'Cozy': 'SIMLIFE', 'Farming Sim': 'FARM', 'MMORPG': 'MMO', 'Hack and Slash': 'HNS', 'Card Game': 'CARD', 'Deckbuilding': 'CARD',
  'Roguelike Deckbuilder': 'CARD', 'Dungeon Crawler': 'DUN', 'Mechs': 'MECH', 'Immersive Sim': 'IMSIM', 'Dating Sim': 'DATING', 'Walking Simulator': 'WALK', 'Battle Royale': 'BR', 'Auto Battler': 'AUTOB', 'Hero Shooter': 'HEROSH',
  'Boomer Shooter': 'BOOMER', 'Extraction Shooter': 'EXTRACT', 'Party Game': 'PARTY', 'Action-Adventure': 'ACTADV', 'Point & Click': 'ADV'};
const SEARCH_TAGS = QUICK ? ['JRPG', 'Metroidvania'] : Object.keys(NAME2CODE).filter(n=> !['Turn-Based Combat', 'Bullet Hell', 'Deckbuilding', 'Colony Sim', 'Cozy', 'Precision Platformer'].includes(n));

const pool = new Map();          // norm(nome) -> candidato
function add(c){
  if(!c || !c.name) return;
  const k = norm(c.name); if(!k || KNOWN.has(k)) return;
  if(c.score != null && c.score < 50) return;
  const ex = pool.get(k);
  if(!ex){ pool.set(k, Object.assign({tags: [], rev: 0}, c, {tags: [...new Set(c.tags || [])], src: [c.src]})); return; }
  ex.tags = [...new Set(ex.tags.concat(c.tags || []))];
  if(c.score != null && (ex.score == null || c.score > ex.score)) ex.score = c.score;
  if(!ex.year && c.year) ex.year = c.year;
  if((c.rev || 0) > ex.rev) ex.rev = c.rev;
  if(!ex.src.includes(c.src)) ex.src.push(c.src);
}
(async()=>{
  // 1) Steam: elenco dei tag (id reali) e ricerca per tag ordinata per recensioni
  const tagList = await get('https://store.steampowered.com/tagdata/populartags/english') || [];
  const id2code = {}, name2id = {};
  tagList.forEach(t=>{ name2id[t.name] = t.tagid; if(NAME2CODE[t.name]) id2code[t.tagid] = NAME2CODE[t.name]; });
  console.log('tag Steam:', tagList.length, '· riconosciuti:', Object.keys(id2code).length);
  for(const tn of SEARCH_TAGS){
    const id = name2id[tn]; if(!id) continue;
    for(let page = 0; page < (QUICK ? 1 : 4); page++){
      const j = await get('https://store.steampowered.com/search/results/?query&start=' + (page * 50) + '&count=50&sort_by=Reviews_DESC&infinite=1&cc=it&l=english&category1=998&tags=' + id);
      if(!j || !j.results_html) break;
      const rows = j.results_html.split('search_result_row').slice(1);
      for(const r of rows){
        const t = /class="title">([^<]*)/.exec(r), rel = /search_released[^>]*>\s*([^<]*)/.exec(r), tip = /data-tooltip-html="([^"]*)"/.exec(r), tg = /data-ds-tagids="\[([^\]]*)\]"/.exec(r);
        if(!t || !tip) continue;
        const m = /(\d+)%\s+of the\s+([\d,\.]+)/.exec(unesc(tip[1]));
        if(!m) continue;
        const pct = +m[1], cnt = parseInt(m[2].replace(/[,\.]/g, ''), 10);
        if(pct < 60 || cnt < 200) continue;
        const y = rel && /(19[7-9]\d|20[0-3]\d)/.exec(rel[1]);
        const codes = tg ? [...new Set(tg[1].split(',').map(x=> id2code[x.trim()]).filter(Boolean))] : [];
        add({name: clean(unesc(t[1])), year: y ? +y[1] : 0, plat: 'PC', score: pct, tags: codes.length ? codes : [NAME2CODE[tn]], src: 'S', rev: cnt});
      }
      await sleep(1200);
    }
    console.log('Steam', tn, '→ pool', pool.size);
  }
  // 2) GOG: per genere, ordinati per popolarità; reviewsRating è su 50
  for(const slug of QUICK ? ['rpg'] : ['rpg', 'action', 'adventure', 'strategy', 'simulation', 'sports', 'racing', 'shooter']){
    for(let page = 1; page <= (QUICK ? 1 : 6); page++){
      const j = await get('https://catalog.gog.com/v1/catalog?limit=48&order=desc:trending&productType=in:game&page=' + page + '&countryCode=IT&locale=en-US&currencyCode=EUR&genres=in:' + slug);
      if(!j || !j.products) break;
      j.products.forEach(p=>{
        const r = Number(p.reviewsRating), sc = r > 0 ? Math.round(r * 2) : null;
        const tags = [];
        (p.genres || []).map(g=> g.name).concat((p.tags || []).map(t=> t.name || t)).forEach(n=>{ if(NAME2CODE[n] && !tags.includes(NAME2CODE[n])) tags.push(NAME2CODE[n]); if(/role-playing/i.test(n) && !tags.includes('WRPG')) tags.push('WRPG'); });
        add({name: clean(p.title), year: +String(p.releaseDate || '').slice(0, 4) || 0, plat: 'PC (GOG)', score: sc, tags, src: 'G', rev: p.reviewsCount || 0});
      });
      await sleep(900);
    }
    console.log('GOG', slug, '→ pool', pool.size);
  }
  // 3) CheapShark: i migliori per Metacritic e per recensioni
  for(const sort of QUICK ? ['Metacritic'] : ['Metacritic', 'Reviews']){
    for(let page = 0; page < (QUICK ? 2 : 22); page++){
      const j = await get('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=60&metacritic=60&sortBy=' + sort + '&pageNumber=' + page);
      if(!Array.isArray(j) || !j.length) break;
      j.forEach(d=>{ const mc = +d.metacriticScore || 0, sp = +d.steamRatingPercent || 0; add({name: clean(d.title), year: d.releaseDate ? new Date(d.releaseDate * 1000).getFullYear() : 0, plat: 'PC', score: mc || sp || null, tags: [], src: 'C', rev: +d.steamRatingCount || 0}); });
      await sleep(800);
    }
    console.log('CheapShark', sort, '→ pool', pool.size);
  }
  // 4) Wikipedia: categorie di genere (giochi anche senza voto)
  const CATS = {JRPG: 'Japanese role-playing video games', ACT: 'Action role-playing video games', TAC: 'Tactical role-playing video games', DUN: 'Dungeon crawler video games', ROG: 'Roguelike video games', METR: 'Metroidvania games',
    SOUL: 'Soulslike video games', HOR: 'Horror video games', SURV: 'Survival horror video games', PLAT: 'Platform games', PUZ: 'Puzzle video games', FIGHT: 'Fighting games', BEAT: "Beat 'em ups", FPS: 'First-person shooters',
    SHMUP: "Shoot 'em ups", RACE: 'Racing video games', SPORT: 'Sports video games', RTS: 'Real-time strategy video games', TBS4X: 'Turn-based strategy video games', ADV: 'Point-and-click adventure games', VN: 'Visual novels',
    STEALTH: 'Stealth video games', OPENW: 'Open-world video games', RHY: 'Rhythm games', PARTY: 'Party video games', TOWERDEF: 'Tower defense video games', CITY: 'City-building games', SIMLIFE: 'Life simulation games',
    MMO: 'Massively multiplayer online role-playing games', MOBA: 'Multiplayer online battle arena games', MECH: 'Mecha video games', HNS: 'Hack and slash games', ARCADE: 'Arcade video games', CARD: 'Digital collectible card games'};
  for(const [code, cat] of Object.entries(QUICK ? {JRPG: CATS.JRPG} : CATS)){
    const j = await get('https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent('Category:' + cat) + '&cmnamespace=0&cmlimit=120&cmtype=page&format=json');
    const titles = ((j && j.query && j.query.categorymembers) || []).map(m=> m.title).filter(t=> !/^(list of|timeline|comparison|outline|history of)/i.test(t) && !/\((series|franchise|disambiguation)\)/i.test(t));
    for(let i = 0; i < titles.length; i += 20){
      const ex = await get('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=2&exlimit=20&redirects=1&format=json&titles=' + encodeURIComponent(titles.slice(i, i + 20).join('|')));
      Object.values((ex && ex.query && ex.query.pages) || {}).forEach(p=>{ const t = p.extract || ''; if(!/game/i.test(t)) return; const y = /\b(19[7-9]\d|20[0-3]\d)\b/.exec(t); add({name: clean(String(p.title).replace(/\s*\((?:video game|videogame)\)$/i, '')), year: y ? +y[1] : 0, plat: '', score: null, tags: [code], src: 'W', rev: 0}); });
      await sleep(350);
    }
    console.log('Wikipedia', code, '→ pool', pool.size);
  }
  // 5) RAWG (facoltativo: serve la chiave in RAWG_KEY)
  if(process.env.RAWG_KEY){
    for(let y = 1990; y <= 2026; y += 3){
      const j = await get('https://api.rawg.io/api/games?key=' + process.env.RAWG_KEY + '&page_size=40&metacritic=55,100&ordering=-added&dates=' + y + '-01-01,' + (y + 2) + '-12-31');
      ((j && j.results) || []).forEach(g=>{ add({name: clean(g.name), year: +String(g.released || '').slice(0, 4) || 0, plat: (g.platforms || []).map(x=> x.platform && x.platform.name).filter(Boolean).slice(0, 3).join(' / '), score: g.metacritic || null, tags: [], src: 'R', rev: g.ratings_count || 0}); });
      await sleep(400);
    }
    console.log('RAWG → pool', pool.size);
  }
  // qualità = voto + peso delle recensioni + conferme da più fonti; quelli senza voto in coda
  const q = c=> (c.score == null ? 45 : c.score) + Math.min(12, Math.log10(1 + (c.rev || 0)) * 3) + (c.src.length - 1) * 3;
  const items = [...pool.values()].sort((a, b)=> q(b) - q(a)).slice(0, QUICK ? 200 : 3200);
  const out = {built: new Date().toISOString().slice(0, 10), n: items.length, items: items.map(c=> [c.name, c.year || 0, c.plat || '', c.score == null ? 0 : c.score, c.tags.join(','), c.src.join(''), c.rev || 0])};
  fs.writeFileSync(QUICK ? '/tmp/discoveries-quick.js' : path.join(ROOT, 'discoveries.js'), 'const DISCOVERIES = ' + JSON.stringify(out) + ';\n');
  const byTag = {}; items.forEach(c=> c.tags.forEach(t=> byTag[t] = (byTag[t] || 0) + 1));
  console.log('fatto:', items.length, 'giochi nuovi · per fonte:', ['S', 'G', 'C', 'W', 'R'].map(s=> s + '=' + items.filter(c=> c.src.includes(s)).length).join(' '), '· generi:', Object.keys(byTag).length);
})();
