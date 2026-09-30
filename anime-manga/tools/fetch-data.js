#!/usr/bin/env node
// Scarica da AniList (GraphQL, gratuito, senza chiave) i titoli da mettere nella Tier List Anime & Manga.
// Uso:   node anime-manga/tools/fetch-data.js [--fresh]      (poi: node anime-manga/tools/build-data.js)
// Scrive anime-manga/tools/.cache/selection.json (ignorato da git). Le risposte grezze restano in cache: rilanciando
// lo script non rifà le richieste già fatte (--fresh le rifà tutte). Dietro un proxy aziendale: NODE_USE_ENV_PROXY=1.
// Selezione: per ogni lista i titoli più POPOLARI (i più conosciuti, anche quelli mediocri, così i tier bassi non sono vuoti)
// uniti a quelli col VOTO più alto (i capolavori meno famosi). Niente titoli per adulti (isAdult), niente corti/speciali.
'use strict';
const fs = require('fs'), path = require('path');
const CACHE = process.env.AM_CACHE || path.join(__dirname, '.cache');
const FRESH = process.argv.includes('--fresh');
fs.mkdirSync(CACHE, {recursive: true});

// pagine da 50: `pop` = pagine per popolarità, `score` = pagine per voto (solo titoli con almeno minPop utenti: evita i voti gonfiati da pochi)
const SETS = [
  {key: 'anime',  type: 'ANIME', format: ['TV', 'ONA', 'OVA'], country: 'JP', pop: 13, score: 6, minPop: 40000},
  {key: 'film',   type: 'ANIME', format: ['MOVIE'],            country: 'JP', pop: 3,  score: 3, minPop: 15000},
  {key: 'manga',  type: 'MANGA', format: ['MANGA', 'ONE_SHOT'], country: 'JP', pop: 8,  score: 4, minPop: 12000},
  {key: 'manhwa', type: 'MANGA', format: ['MANGA'],            country: 'KR', pop: 2,  score: 1, minPop: 8000},
  {key: 'manhwa', type: 'MANGA', format: ['MANGA'],            country: 'CN', pop: 1,  score: 1, minPop: 8000}
];

const MEDIA_FIELDS = `
  id idMal type format status countryOfOrigin title{romaji english native} synonyms startDate{year month} endDate{year}
  chapters volumes episodes duration averageScore popularity favourites genres
  tags{name rank isMediaSpoiler} coverImage{extraLarge large color}
  studios(isMain:true){nodes{name}} staff(perPage:3,sort:RELEVANCE){edges{role node{name{full}}}}
  relations{edges{relationType node{id idMal type format title{romaji english}}}} source description(asHtml:false)`;
const LIST_Q = `query($page:Int,$type:MediaType,$format:[MediaFormat],$sort:[MediaSort],$country:CountryCode,$minPop:Int){
  Page(page:$page,perPage:50){pageInfo{hasNextPage}
    media(type:$type,format_in:$format,sort:$sort,countryOfOrigin:$country,isAdult:false,popularity_greater:$minPop){${MEDIA_FIELDS}}}}`;
const IDS_Q = `query($ids:[Int],$page:Int){Page(page:$page,perPage:50){media(id_in:$ids,type:ANIME){${MEDIA_FIELDS}}}}`;
const REC_Q = `query($ids:[Int]){Page(page:1,perPage:25){media(id_in:$ids){id recommendations(perPage:8,sort:RATING_DESC){nodes{rating mediaRecommendation{id type}}}}}}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastCall = 0;
async function anilist(query, variables, cacheName){
  const file = path.join(CACHE, cacheName + '.json');
  if (!FRESH && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let attempt = 1; attempt <= 6; attempt++){
    const wait = 2300 - (Date.now() - lastCall);            // AniList: ora 30 richieste al minuto
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    let res;
    try{
      res = await fetch('https://graphql.anilist.co', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({query, variables})});
    }catch(e){ console.log(`  rete: ${e.cause && e.cause.code || e.message} (tentativo ${attempt})`); await sleep(4000 * attempt); continue; }
    if (res.status === 429){ const s = (+res.headers.get('retry-after') || 60) + 2; console.log(`  limite richieste: aspetto ${s}s`); await sleep(s * 1000); continue; }
    const text = await res.text();
    let json; try{ json = JSON.parse(text); }catch(e){ json = null; }
    if (res.ok && json && json.data){ fs.writeFileSync(file, JSON.stringify(json)); return json; }
    console.log(`  HTTP ${res.status} ${text.slice(0, 120).replace(/\s+/g, ' ')} (tentativo ${attempt})`);
    await sleep(3000 * attempt);
  }
  throw new Error('AniList non risponde: ' + cacheName);
}

(async () => {
  const picked = new Map();                                   // id AniList → {…media, list, via}
  for (const S of SETS){
    for (const [mode, pages] of [['pop', S.pop], ['score', S.score]]){
      for (let page = 1; page <= pages; page++){
        const name = `list-${S.key}-${S.country}-${mode}-${page}`;
        process.stdout.write(`${name} … `);
        const j = await anilist(LIST_Q, {page, type: S.type, format: S.format, country: S.country, sort: [mode === 'pop' ? 'POPULARITY_DESC' : 'SCORE_DESC'], minPop: mode === 'score' ? S.minPop : 0}, name);
        const media = j.data.Page.media;
        let added = 0;
        for (const m of media){
          if (m.averageScore == null) continue;                // senza voto non si può mettere in classifica
          if (m.status === 'NOT_YET_RELEASED' || m.status === 'CANCELLED') continue;
          if (!picked.has(m.id)){ picked.set(m.id, Object.assign(m, {list: S.key})); added++; }
        }
        console.log(`${media.length} titoli, ${added} nuovi (totale ${picked.size})`);
        if (!j.data.Page.pageInfo.hasNextPage) break;
      }
    }
  }
  // stagioni mancanti: ogni serie TV va presa per intero (le stagioni si fondono in una sola voce), anche se una stagione da sola non è tra le più popolari
  const TVF = new Set(['TV', 'TV_SHORT', 'ONA']);
  const members = new Map();                                  // id → media (solo per calcolare la serie, non compare da sola)
  for (let round = 1; round <= 4; round++){
    const want = new Set();
    for (const m of [...picked.values(), ...members.values()]){
      if (m.type !== 'ANIME' || !TVF.has(m.format)) continue;
      for (const e of m.relations.edges){
        if ((e.relationType === 'SEQUEL' || e.relationType === 'PREQUEL') && e.node.type === 'ANIME' && TVF.has(e.node.format) && !picked.has(e.node.id) && !members.has(e.node.id)) want.add(e.node.id);
      }
    }
    if (!want.size) break;
    const ids = [...want];
    console.log(`stagioni mancanti (giro ${round}): ${ids.length}`);
    for (let i = 0; i < ids.length; i += 50){
      const chunk = ids.slice(i, i + 50);
      const j = await anilist(IDS_Q, {ids: chunk, page: 1}, `members-${round}-${chunk[0]}-${chunk.length}`);
      for (const m of j.data.Page.media) if (m.type === 'ANIME' && !m.isAdult) members.set(m.id, m);
    }
  }
  // consigli degli utenti («se ti è piaciuto X…»)
  const ids = [...picked.keys()];
  for (let i = 0; i < ids.length; i += 25){
    const chunk = ids.slice(i, i + 25);
    process.stdout.write(`consigli ${i}-${i + chunk.length} … `);
    const j = await anilist(REC_Q, {ids: chunk}, `rec-${chunk[0]}-${chunk.length}`);
    for (const m of j.data.Page.media){
      const p = picked.get(m.id); if (!p) continue;
      p.recs = (m.recommendations.nodes || []).filter(n => n.mediaRecommendation && n.rating > 0).map(n => ({id: n.mediaRecommendation.id, r: n.rating}));
    }
    console.log('ok');
  }
  const out = {fetched: new Date().toISOString().slice(0, 10), source: 'AniList', media: [...picked.values()], members: [...members.values()]};
  fs.writeFileSync(path.join(CACHE, 'selection.json'), JSON.stringify(out));
  const by = {}; out.media.forEach(m => { by[m.list] = (by[m.list] || 0) + 1; });
  console.log('\nSelezione salvata:', by, 'totale', out.media.length, '+ stagioni di appoggio', out.members.length);
})().catch(e => { console.error(e); process.exit(1); });
