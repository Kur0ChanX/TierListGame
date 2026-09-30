#!/usr/bin/env node
// Costruisce anime-manga/dati.js dai dati scaricati da anime-manga/tools/fetch-data.js (offline: non fa richieste).
// Uso:  node anime-manga/tools/build-data.js            → scrive anime-manga/dati.js e stampa un riepilogo
//       node anime-manga/tools/build-data.js --groups   → elenca le serie ottenute fondendo più stagioni (per controllare le fusioni)
//       node anime-manga/tools/build-data.js --worksheet [N] [da]  → stampa N titoli senza testo italiano (per scriverlo in anime-manga/tools/content/)
// Decisioni principali (tutte qui, in un posto solo):
//  - fonte unica dei voti: AniList (averageScore 0-100, media degli utenti); niente stime inventate.
//  - ANIME: le stagioni di una stessa serie TV diventano UNA voce (voto = media pesata sulla popolarità, episodi sommati);
//    film, OVA e manga restano voci singole. Le regole di fusione stanno in sameSeries() + SPLIT_TITLES.
//  - FILM: tutti i film d'animazione di ogni studio (Pixar, Disney, DreamWorks, Illumination, Ghibli, Laika…) da IMDb + Wikidata (fetch-films.js);
//    i film anime di AniList vengono agganciati a quelli IMDb (stessa voce, copertina e collegamenti AniList).
//  - TIER: soglie per lista ricavate dalla distribuzione (S+ ~2%, S ~6%, A ~14%, B ~24%, C ~26%, D ~16%, E ~8%, F ~4%);
//    il programma usa le stesse soglie (AM_DATA.tierCuts) per i titoli aggiunti dall'utente.
//  - TESTI in italiano (trama, «fa per te se»…): file anime-manga/tools/content/*.json, chiave = id della voce.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const CACHE = process.env.AM_CACHE || path.join(__dirname, '.cache');
const OUT = path.join(ROOT, 'anime-manga', 'dati.js');
const CONTENT = path.join(__dirname, 'content');
const SEL = JSON.parse(fs.readFileSync(path.join(CACHE, 'selection.json'), 'utf8'));

// ---------------------------------------------------------------- tier
const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
const CUM = [0.02, 0.08, 0.22, 0.46, 0.72, 0.88, 0.96];                // quota cumulata di titoli da S+ a E (il resto è F)
function deriveCuts(scores){
  const a = scores.slice().sort((x, y) => y - x), n = a.length, cuts = {};
  TIER_ORDER.slice(0, 7).forEach((t, k) => { cuts[t] = a[Math.min(n - 1, Math.max(0, Math.round(n * CUM[k]) - 1))]; });
  for (let k = 1; k < 7; k++){ const t = TIER_ORDER[k], prev = cuts[TIER_ORDER[k - 1]]; if (cuts[t] >= prev) cuts[t] = prev - 1; }
  return cuts;
}
const tierWith = (cuts, s) => { for (const t of TIER_ORDER.slice(0, 7)) if (s >= cuts[t]) return t; return 'F'; };
const FILM_TAGS = {Action: 'ACT', Adventure: 'ADV', Comedy: 'COM', Drama: 'DRA', Fantasy: 'FAN', Horror: 'HOR', Mystery: 'MYS', Romance: 'ROM', 'Sci-Fi': 'SCI', Thriller: 'THR', Music: 'MUS', Musical: 'MUS', Sport: 'SPO', War: 'MIL', History: 'HIS', Crime: 'CRI', Family: 'FAM'};

// ---------------------------------------------------------------- generi e temi (codice, etichetta italiana, icona, gruppo, come si riconosce in AniList)
const TAGDEFS = [
  ['ACT', 'Azione', '⚔️', 'Generi', {g: 'Action'}],
  ['ADV', 'Avventura', '🧭', 'Generi', {g: 'Adventure'}],
  ['COM', 'Commedia', '😂', 'Generi', {g: 'Comedy'}],
  ['DRA', 'Drammatico', '🎭', 'Generi', {g: 'Drama'}],
  ['FAN', 'Fantasy', '🧙', 'Generi', {g: 'Fantasy'}],
  ['SCI', 'Fantascienza', '🚀', 'Generi', {g: 'Sci-Fi'}],
  ['HOR', 'Horror', '👻', 'Generi', {g: 'Horror'}],
  ['MYS', 'Mistero', '🕵️', 'Generi', {g: 'Mystery'}],
  ['PSY', 'Psicologico', '🧠', 'Generi', {g: 'Psychological'}],
  ['THR', 'Thriller', '🔪', 'Generi', {g: 'Thriller'}],
  ['ROM', 'Romantico', '💕', 'Generi', {g: 'Romance'}],
  ['SOL', 'Slice of Life', '🍵', 'Generi', {g: 'Slice of Life'}],
  ['SPO', 'Sportivo', '⚽', 'Generi', {g: 'Sports'}],
  ['SUP', 'Soprannaturale', '🌀', 'Generi', {g: 'Supernatural'}],
  ['MEC', 'Mecha', '🤖', 'Generi', {g: 'Mecha'}],
  ['MUS', 'Musicale', '🎵', 'Generi', {g: 'Music'}],
  ['MAH', 'Magical girl', '🪄', 'Generi', {g: 'Mahou Shoujo'}],
  ['ECC', 'Ecchi', '😳', 'Generi', {g: 'Ecchi'}],
  ['SHO', 'Shonen', '🥊', 'Pubblico', {t: ['Shounen']}],
  ['SEI', 'Seinen', '🕶️', 'Pubblico', {t: ['Seinen']}],
  ['SHJ', 'Shojo', '🎀', 'Pubblico', {t: ['Shoujo']}],
  ['JOS', 'Josei', '🌸', 'Pubblico', {t: ['Josei']}],
  ['KID', 'Per ragazzi', '🧸', 'Pubblico', {t: ['Kids']}],
  ['FAM', 'Per tutta la famiglia', '👨‍👩‍👧', 'Pubblico', {}],
  ['ISE', 'Isekai', '🌍', 'Temi', {t: ['Isekai', 'Reincarnation'], min: 65}],
  ['SCH', 'Scolastico', '🏫', 'Temi', {t: ['School'], min: 70}],
  ['MAR', 'Arti marziali', '🥋', 'Temi', {t: ['Martial Arts'], min: 60}],
  ['POW', 'Super poteri', '⚡', 'Temi', {t: ['Super Power'], min: 65}],
  ['HIS', 'Storico', '🏯', 'Temi', {t: ['Historical', 'Samurai'], min: 65}],
  ['MIL', 'Guerra e militare', '🎖️', 'Temi', {t: ['Military', 'War'], min: 65}],
  ['SUR', 'Sopravvivenza', '🏕️', 'Temi', {t: ['Survival', 'Battle Royale', 'Death Game'], min: 65}],
  ['GAM', 'Giochi e sfide', '🎲', 'Temi', {t: ['Gambling', 'Card Battle', 'Video Games', 'Board Game', 'Virtual World', 'Strategy'], min: 60}],
  ['IYA', 'Rilassante', '🌿', 'Temi', {t: ['Iyashikei'], min: 50}],
  ['FOO', 'Cucina', '🍜', 'Temi', {t: ['Food', 'Cooking'], min: 70}],
  ['IDO', 'Idol e spettacolo', '🎤', 'Temi', {t: ['Idol', 'Idols'], min: 50}],
  ['TIM', 'Tempo e loop', '⏳', 'Temi', {t: ['Time Manipulation', 'Time Loop'], min: 65}],
  ['VAM', 'Vampiri', '🧛', 'Temi', {t: ['Vampire'], min: 65}],
  ['GOR', 'Gore', '🩸', 'Temi', {t: ['Gore'], min: 70}],
  ['CRI', 'Crimine e detective', '🚔', 'Temi', {t: ['Crime', 'Detective', 'Police', 'Yakuza', 'Mafia'], min: 65}],
  ['DYS', 'Post-apocalittico', '☢️', 'Temi', {t: ['Post-Apocalyptic', 'Dystopian'], min: 65}],
  ['HAR', 'Harem', '💘', 'Temi', {t: ['Female Harem', 'Male Harem', 'Harem'], min: 65}],
  ['LGB', 'Amore LGBTQ+', '🏳️‍🌈', 'Temi', {t: ['LGBTQ+ Themes', 'Yuri', 'Boys\' Love'], min: 65}],
  ['WEB', 'Webtoon (a colori)', '📱', 'Formato', {t: ['Full Color', 'Long Strip'], min: 60}]
];
// ordine dei generi (il primo è il «genere principale» mostrato per primo): prima i più caratteristici, poi i larghi
const GENRE_ORDER = ['MEC', 'SPO', 'MAH', 'MUS', 'HOR', 'ROM', 'ACT', 'ADV', 'SCI', 'FAN', 'PSY', 'THR', 'MYS', 'SUP', 'DRA', 'COM', 'SOL', 'ECC'];
const AUDIENCE = ['SHO', 'SEI', 'SHJ', 'JOS', 'KID', 'FAM'];
function tagsOf(m){
  const tagRank = new Map((m.tags || []).filter(t => !t.isMediaSpoiler).map(t => [t.name, t.rank]));
  const genres = GENRE_ORDER.filter(c => { const d = TAGDEFS.find(x => x[0] === c); return (m.genres || []).includes(d[4].g); }).slice(0, 5);
  const themes = [];
  for (const [code, , , group, rule] of TAGDEFS){
    if (!rule.t || group === 'Pubblico') continue;
    const best = Math.max(0, ...rule.t.map(n => tagRank.get(n) || 0));
    if (best >= (rule.min || 65)) themes.push([code, best]);
  }
  themes.sort((a, b) => b[1] - a[1]);
  const aud = AUDIENCE.find(c => { const d = TAGDEFS.find(x => x[0] === c); return d[4].t && d[4].t.some(n => (tagRank.get(n) || 0) >= 50); });
  return [...genres, ...themes.slice(0, 3).map(x => x[0]), aud].filter(Boolean);
}

// ---------------------------------------------------------------- utilità
const notLatin = s => !/^[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(s || '');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const titleEn = m => (m.title.english || m.title.romaji || '').trim();
const titleJp = m => (m.title.romaji || '').trim();
const stripHtml = s => String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/\(Source:[^)]*\)|\[Written by[^\]]*\]/gi, '').trim();
const startKey = m => (m.startDate.year || 9999) * 100 + (m.startDate.month || 0);
const SRC = {MANGA: 'Manga', LIGHT_NOVEL: 'Light novel', NOVEL: 'Romanzo', WEB_NOVEL: 'Web novel', VISUAL_NOVEL: 'Visual novel', VIDEO_GAME: 'Videogioco', ORIGINAL: null, ANIME: null, OTHER: null, GAME: 'Videogioco', COMIC: 'Fumetto', DOUJINSHI: 'Doujinshi', LIVE_ACTION: 'Live action', MULTIMEDIA_PROJECT: 'Progetto multimediale', PICTURE_BOOK: 'Libro illustrato'};
const FMT_LABEL = {TV: 'Serie TV', TV_SHORT: 'Serie breve', ONA: 'Serie web (ONA)', OVA: 'OVA', MOVIE: 'Film', MANGA: 'Manga', ONE_SHOT: 'One-shot'};

// ---------------------------------------------------------------- fusione delle stagioni in serie (solo anime TV/ONA)
const TVF = new Set(['TV', 'TV_SHORT', 'ONA']);
// titoli che aprono una serie a sé anche se sono un sequel col titolo simile (per chi fa la tier list sono «opere» diverse).
// Due stagioni si fondono solo se hanno la stessa chiave (null = nessuna regola): «Stardust Crusaders - Battle in Egypt» segue «Stardust Crusaders», non JoJo (2012).
const SPLIT_RE = [
  /stardust crusaders|diamond is unbreakable|golden wind|stone ocean|steel ball run/i,                        // le parti di JoJo
  /dragon ball (z|gt|super|daima)|dragon ball kai/i,
  /thousand[- ]year blood war/i,                                                                              // Bleach 2022
  /unlimited blade works|fate\/zero|fate\/apocrypha|fate\/grand order|heaven'?s feel|fate\/kaleid/i,
  /shipp(u|ū)?den/i,                                                                                          // Naruto Shippuden ≠ Naruto
  /jujutsu kaisen 0/i,
  /alicization|progressive|alternative: gun gale|extra edition/i                                              // Sword Art Online: sotto-serie
];
const splitKey = m => { const t = titleEn(m) + ' | ' + titleJp(m); for (const re of SPLIT_RE){ const mm = t.match(re); if (mm) return mm[0].toLowerCase(); } return null; };
const seriesWordPrefix = (a, b) => a && b && (b === a || b.startsWith(a + ' '));
// «x season 2», «x 2nd season», «x ii», «x part 2», «x cour 2», «x final season»… → «x»
function baseTitle(n){
  let t = n;
  for (let i = 0; i < 4; i++){
    t = t.replace(/\b(the )?(final|last|second|third|fourth|fifth|sixth|seventh|eighth)( season| part| plate| chapter)?( part \d+| cour \d+)?$/, '')
      .replace(/\b(season|part|cour|series|stage) ?\d+( part \d+| cour \d+)?$/, '').replace(/\b\d+(st|nd|rd|th) (season|part|cour)( part \d+)?$/, '')
      .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)$/, '').replace(/ \d+$/, '').trim();
  }
  return t;
}
function sameSeries(node, root){
  const A = [norm(titleEn(root)), norm(titleJp(root))].filter(Boolean), B = [norm(titleEn(node)), norm(titleJp(node))].filter(Boolean);
  if (splitKey(node) !== splitKey(root)) return false;
  for (const a of A) for (const b of B){
    if (seriesWordPrefix(a, b) || seriesWordPrefix(b, a)) return true;
    const ba = baseTitle(a), bb = baseTitle(b);
    if (ba.length >= 4 && ba === bb) return true;
  }
  return false;
}

const byId = new Map();
for (const m of [...SEL.members, ...SEL.media]) byId.set(m.id, m);
const listOf = new Map(SEL.media.map(m => [m.id, m.list]));
const seriesOfMember = new Map();          // id AniList (qualunque stagione) → id della voce che la rappresenta
const seriesMembers = new Map();           // id voce (root) → [media…] in ordine cronologico

(function buildSeries(){
  const tv = [...byId.values()].filter(m => m.type === 'ANIME' && TVF.has(m.format));
  // catena di sequel/prequel: passa anche da OVA, speciali e film (S1 → OVA → S2), quindi la componente si calcola su TUTTI i nodi
  const parent = new Map(); const find = x => { while (parent.get(x) !== x){ parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const add = x => { if (!parent.has(x)) parent.set(x, x); }; const uni = (a, b) => { add(a); add(b); parent.set(find(a), find(b)); };
  for (const m of byId.values()) if (m.type === 'ANIME') for (const e of m.relations.edges)
    if ((e.relationType === 'SEQUEL' || e.relationType === 'PREQUEL') && e.node.type === 'ANIME') uni(m.id, e.node.id);
  const comps = new Map();
  for (const m of tv){ add(m.id); const r = find(m.id); (comps.get(r) || comps.set(r, []).get(r)).push(m); }
  for (const comp of comps.values()){
    comp.sort((a, b) => startKey(a) - startKey(b) || a.id - b.id);
    const groups = [];
    for (const m of comp){
      let g = groups.find(gr => sameSeries(m, gr.root));       // il gruppo più antico con lo stesso titolo di base
      if (!g){ g = {root: m, members: []}; groups.push(g); }
      g.members.push(m);
    }
    for (const g of groups){ seriesMembers.set(g.root.id, g.members); for (const m of g.members) seriesOfMember.set(m.id, g.root.id); }
  }
})();

// ---------------------------------------------------------------- voci
const wmean = (arr, key, w) => { let s = 0, n = 0; for (const m of arr){ if (m[key] == null) continue; const k = Math.max(1, m[w] || 1); s += m[key] * k; n += k; } return n ? s / n : null; };
function authorsOf(m){
  const out = [];
  for (const e of (m.staff && m.staff.edges) || []){
    if (!/story|art|original|creator/i.test(e.role || '')) continue;
    const n = e.node.name.full; if (n && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 2).join(' e ');
}
function coverParts(m){
  const u = (m.coverImage && (m.coverImage.large || m.coverImage.extraLarge)) || '';
  const mm = u.match(/\/media\/(anime|manga)\/cover\/[a-zA-Z]+\/([^/]+)$/);
  return mm ? mm[2] : null;
}
function makeItem(m, list){
  const isAnime = m.type === 'ANIME';
  const members = list === 'anime' ? (seriesMembers.get(m.id) || [m]) : [m];
  const scored = members.filter(x => x.averageScore != null);
  const score = Math.round(wmean(scored, 'averageScore', 'popularity'));
  const it = {id: (isAnime ? 'a' : 'm') + m.id, al: m.id, l: list, f: m.format};
  if (m.idMal) it.mal = m.idMal;
  it.name = cleanName(titleEn(m));
  const jp = titleJp(m); if (jp && norm(jp) !== norm(it.name)) it.jp = jp;
  const alt = [];
  const add = s => { s = (s || '').trim(); if (s && !notLatin(s) && norm(s) !== norm(it.name) && norm(s) !== norm(jp) && !alt.some(a => norm(a) === norm(s))) alt.push(s); };
  add(m.title.english); add(m.title.romaji); (m.synonyms || []).forEach(add);
  members.slice(1).forEach(x => { add(titleEn(x)); });
  if (alt.length) it.alt = alt.slice(0, 6);
  if (isAnime){
    const studios = []; members.forEach(x => (x.studios && x.studios.nodes || []).forEach(s => { if (!studios.includes(s.name)) studios.push(s.name); }));
    if (studios.length) it.who = studios.slice(0, 2).join(' + ');
    const eps = members.reduce((s, x) => s + (x.episodes || 0), 0); if (eps) it.n = eps;
    if (m.duration) it.d = m.duration;
  } else {
    const a = authorsOf(m); if (a) it.who = a;
    if (m.chapters) it.ch = m.chapters; if (m.volumes) it.v = m.volumes;
  }
  it.y = Math.min(...members.map(x => x.startDate.year || 9999));
  const rel = members.some(x => x.status === 'RELEASING');
  const ends = members.map(x => x.endDate && x.endDate.year).filter(Boolean);
  if (!rel && ends.length){ const y2 = Math.max(...ends); if (y2 !== it.y) it.y2 = y2; }
  it.st = rel ? 'R' : (members.some(x => x.status === 'HIATUS') ? 'H' : 'F');
  it.score = score; it.pop = Math.max(...members.map(x => x.popularity || 0)); it.fav = members.reduce((s, x) => s + (x.favourites || 0), 0);
  it.m = 'V'; it.sc = 'al';
  it.tags = tagsOf(m);
  const src = SRC[m.source]; if (src && (isAnime || src !== 'Manga')) it.src = src;
  const cp = coverParts(m); if (cp) it.img = cp;
  if (m.coverImage && m.coverImage.color) it.c = m.coverImage.color;
  it.desc = stripHtml(m.description);                     // solo per il foglio di lavoro: non finisce in dati.js
  if (members.length > 1){
    it.seasons = members.map(x => [titleEn(x), x.startDate.year || null, x.episodes || null, x.averageScore == null ? null : x.averageScore, x.id]);
  }
  return it;
}

// ---------------------------------------------------------------- selezione finale
const items = [], alFilms = [];
const CAPS = {manhwa: {pop: 12000, max: 100}};
const cleanName = n => n.replace(/\s*\((TV|ONA|OVA)\)$/i, '').replace(/\s+(Season 1|1st Season)$/i, '').trim();
{
  const animeRoots = new Set();
  for (const m of SEL.media){
    if (m.list === 'anime'){ animeRoots.add(seriesOfMember.has(m.id) ? seriesOfMember.get(m.id) : m.id); }
    else if (m.list === 'film'){ alFilms.push(m); }
    else items.push(makeItem(m, m.list));
  }
  for (const r of animeRoots) items.push(makeItem(byId.get(r), 'anime'));
}
function trim(list, rule){
  const all = items.filter(i => i.l === list);
  const keep = all.filter(i => i.pop >= rule.pop || (rule.altScore && i.score >= rule.altScore && i.pop >= rule.altPop)).sort((a, b) => b.pop - a.pop).slice(0, rule.max);
  const drop = new Set(all.filter(i => !keep.includes(i)).map(i => i.id));
  for (let k = items.length - 1; k >= 0; k--) if (drop.has(items[k].id)) items.splice(k, 1);
}
for (const [list, rule] of Object.entries(CAPS)) trim(list, rule);

// ---------------------------------------------------------------- studi di animazione (chiave, nome, icona, gruppo, regola sul nome in inglese minuscolo)
// L'ordine conta: il primo studio che corrisponde a UNA delle società di produzione vince (Pixar prima di Disney, Blue Sky prima di Fox…).
const STUDIOS = [
  ['pixar', 'Pixar', '💡', 'USA', /pixar/],
  ['disney', 'Walt Disney Animation', '🏰', 'USA', /walt disney (animation|feature)|disneytoon|disney television animation|disney animation|walt disney pictures|walt disney productions|^disney$|buena vista/],
  ['dreamworks', 'DreamWorks Animation', '🌙', 'USA', /dreamworks|pacific data images/],
  ['illumination', 'Illumination', '🍌', 'USA', /illumination/],
  ['sony', 'Sony Pictures Animation', '🕷️', 'USA', /sony pictures animation|sony pictures imageworks/],
  ['warner', 'Warner Bros. Animation', '🎬', 'USA', /warner.{0,25}animation|warner animation|dc entertainment|warner bros\. feature/],
  ['bluesky', 'Blue Sky Studios', '❄️', 'USA', /blue sky/],
  ['fox', '20th Century Animation', '🦊', 'USA', /20th century.{0,20}animation|fox animation|twentieth century.{0,20}animation/],
  ['paramount', 'Paramount / Nickelodeon', '⛰️', 'USA', /paramount animation|nickelodeon/],
  ['universal', 'Universal Animation', '🌍', 'USA', /universal (animation|cartoon)/],
  ['bluth', 'Don Bluth e Amblimation', '🐭', 'USA', /bluth|amblimation/],
  ['netflix', 'Netflix Animation', '🅽', 'USA', /netflix/],
  ['rankin', 'Rankin/Bass e Hanna-Barbera', '🎄', 'USA', /rankin|hanna-barbera|filmation|ralph bakshi/],
  ['ghibli', 'Studio Ghibli', '🌳', 'Giappone', /ghibli/],
  ['toei', 'Toei Animation', '🐉', 'Giappone', /toei/],
  ['madhouse', 'Madhouse', '🎞️', 'Giappone', /madhouse/],
  ['kyoani', 'Kyoto Animation', '🌸', 'Giappone', /kyoto animation/],
  ['ufotable', 'ufotable', '🔥', 'Giappone', /ufotable/],
  ['bones', 'Bones', '🦴', 'Giappone', /^bones$|studio bones/],
  ['mappa', 'MAPPA', '🗡️', 'Giappone', /mappa/],
  ['wit', 'Wit Studio', '🧠', 'Giappone', /wit studio/],
  ['sunrise', 'Sunrise', '🌅', 'Giappone', /sunrise|bandai namco filmworks/],
  ['ig', 'Production I.G', '🤖', 'Giappone', /production i\.?g/],
  ['a1', 'A-1 Pictures', '🅰️', 'Giappone', /a-1 pictures/],
  ['shaft', 'Shaft', '🌀', 'Giappone', /^shaft$/],
  ['trigger', 'Trigger', '💥', 'Giappone', /^trigger$|studio trigger/],
  ['comixwave', 'CoMix Wave Films', '🌈', 'Giappone', /comix wave/],
  ['chizu', 'Studio Chizu', '🐺', 'Giappone', /studio chizu/],
  ['ponoc', 'Studio Ponoc', '🌙', 'Giappone', /ponoc/],
  ['pierrot', 'Studio Pierrot', '🍥', 'Giappone', /pierrot/],
  ['tms', 'TMS Entertainment', '🎩', 'Giappone', /tms entertainment|tokyo movie shinsha/],
  ['deen', 'Studio Deen', '📚', 'Giappone', /studio deen/],
  ['gainax', 'Gainax e Khara', '🚀', 'Giappone', /gainax|khara/],
  ['studio4c', 'Studio 4°C', '🎨', 'Giappone', /studio 4/],
  ['cloverworks', 'CloverWorks', '🍀', 'Giappone', /cloverworks/],
  ['pa', 'P.A. Works', '🌾', 'Giappone', /p\.a\. works/],
  ['dogakobo', 'Doga Kobo', '🎀', 'Giappone', /doga kobo/],
  ['tatsunoko', 'Tatsunoko / Nippon Animation', '🐓', 'Giappone', /tatsunoko|nippon animation/],
  ['laika', 'Laika', '🧵', 'Europa e resto del mondo', /laika/],
  ['aardman', 'Aardman', '🐑', 'Europa e resto del mondo', /aardman/],
  ['cartoonsaloon', 'Cartoon Saloon', '🍀', 'Europa e resto del mondo', /cartoon saloon/],
  ['folimage', 'Studi europei (Francia, Belgio, Spagna…)', '🥖', 'Europa e resto del mondo', /gaumont|folimage|xilam|pathé|studiocanal|les armateurs|nord-ouest|walking the dog|belvision|mac guff|onyx films|animation.*(france|paris)/],
  ['cina', 'Animazione cinese e coreana', '🐲', 'Europa e resto del mondo', /beijing|shanghai animation|light chaser|enlight|coloroom|china film|cj entertainment|nexon|studio mir/]
];
function studioOf(names){ for (const st of STUDIOS) for (const n of names || []) if (st[4].test(String(n).toLowerCase())) return st; return null; }
const COUNTRY_IT = {'United States of America': 'USA', 'United States': 'USA', 'Japan': 'Giappone', 'France': 'Francia', 'United Kingdom': 'Regno Unito', 'Germany': 'Germania', 'Italy': 'Italia', 'Canada': 'Canada', 'South Korea': 'Corea del Sud', 'China': 'Cina', "People's Republic of China": 'Cina', 'Spain': 'Spagna', 'Ireland': 'Irlanda', 'Denmark': 'Danimarca', 'Belgium': 'Belgio', 'Russia': 'Russia', 'Soviet Union': 'URSS', 'Australia': 'Australia', 'Sweden': 'Svezia', 'Norway': 'Norvegia', 'Netherlands': 'Paesi Bassi', 'Brazil': 'Brasile', 'Argentina': 'Argentina', 'India': 'India', 'Mexico': 'Messico', 'Poland': 'Polonia', 'Czech Republic': 'Cechia', 'Switzerland': 'Svizzera', 'Luxembourg': 'Lussemburgo', 'Israel': 'Israele', 'Finland': 'Finlandia', 'Hungary': 'Ungheria', 'Latvia': 'Lettonia', 'Iran': 'Iran', 'New Zealand': 'Nuova Zelanda', 'Taiwan': 'Taiwan', 'Hong Kong': 'Hong Kong'};
const ACRONYMS = new Set(['OLM', 'TMS', 'MAPPA', 'CLAP', 'J.C.STAFF', 'ENGI', 'NUT', 'P.A.', 'A-1', 'CG', 'ILCA', 'TOHO', 'SILVER']);
const niceStudio = n => (/^[^a-z]+$/.test(n) && n.length >= 5 && !ACRONYMS.has(n) && !/[.\d]/.test(n)) ? n.toLowerCase().replace(/\b([a-z])/g, m => m.toUpperCase()) : (/^[a-z]/.test(n) ? n[0].toUpperCase() + n.slice(1) : n);
const slug = t => norm(String(t || '').replace(/\((film|movie|animated|media)?\s*(series|franchise|trilogy|saga)?\)/gi, '')).replace(/ (film|movie)? ?(series|franchise|trilogy|saga)$/, '').replace(/\s+/g, '-');

// ---------------------------------------------------------------- film d'animazione (IMDb + Wikidata + locandine di Wikipedia)
const WR_M = 25000;                                           // voti minimi della formula ponderata
const filmFile = path.join(CACHE, 'films.json');
const filmsRaw = fs.existsSync(filmFile) ? JSON.parse(fs.readFileSync(filmFile, 'utf8')).films : [];
const WR_C = filmsRaw.length ? filmsRaw.reduce((s, f) => s + f.r, 0) / filmsRaw.length : 6.7;   // media dei voti
const alFilmById = new Map(alFilms.map(m => [String(m.id), m])), alFilmByMal = new Map(alFilms.filter(m => m.idMal).map(m => [String(m.idMal), m]));
const filmExclude = new Set(JSON.parse(fs.readFileSync(path.join(CONTENT, 'film-exclude.json'), 'utf8')));
const usedAl = new Set();
function matchAlFilm(f){
  const w = f.wd || {};
  let m = (w.al && alFilmById.get(String(w.al))) || (w.mal && alFilmByMal.get(String(w.mal)));
  if (m) return m;
  const names = [f.title, f.orig, w.en].filter(Boolean).map(norm);
  for (const c of alFilms){
    if (usedAl.has(c.id)) continue;
    const cy = c.startDate.year; if (!cy || !f.year || Math.abs(cy - f.year) > 1) continue;
    const cn = [c.title.english, c.title.romaji, ...(c.synonyms || [])].filter(Boolean).map(norm);
    if (names.some(a => cn.some(b => a && b && (a === b || (Math.min(a.length, b.length) > 8 && (a.startsWith(b) || b.startsWith(a))))))){
      if (!c.duration || !f.run || Math.abs(c.duration - f.run) <= 8) return c;
    }
  }
  return null;
}
// generi di Wikidata (P136) → codici dei nostri generi; IMDb dà al massimo 3 generi, Wikidata ne aggiunge altri
const WD_GENRE = [[/comedy/, 'COM'], [/adventure/, 'ADV'], [/fantasy/, 'FAN'], [/drama/, 'DRA'], [/romance|romantic/, 'ROM'], [/music/, 'MUS'], [/science fiction|sci-fi/, 'SCI'], [/action/, 'ACT'], [/horror/, 'HOR'], [/thriller/, 'THR'], [/mystery|detective/, 'MYS'], [/crime|gangster/, 'CRI'], [/\bwar\b/, 'MIL'], [/histor/, 'HIS'], [/family|children/, 'FAM'], [/sport/, 'SPO'], [/superhero/, 'POW'], [/martial arts/, 'MAR'], [/musical/, 'MUS']];
function filmTags(f, am){
  const t = new Set(); (f.genres || '').split(',').forEach(g => { if (FILM_TAGS[g]) t.add(FILM_TAGS[g]); });
  ((f.wd && f.wd.wdGenres) || []).forEach(g => { for (const [re, code] of WD_GENRE) if (re.test(g.toLowerCase())) t.add(code); });
  if (am) tagsOf(am).forEach(c => t.add(c));
  const rest = [...t].filter(c => !GENRE_ORDER.includes(c) && !AUDIENCE.includes(c));
  return [...GENRE_ORDER.filter(c => t.has(c)).slice(0, 6), ...rest.slice(0, 3), ...AUDIENCE.filter(c => t.has(c)).slice(0, 1)];
}
function posterPath(u){ const m = String(u || '').match(/\/wikipedia\/(.+)$/); return m ? m[1].replace(/\/\d+px-/, '/{w}px-') : null; }
let filmDropped = 0, filmsNotAnim = [];
const droppedLive = new Set(['Documentary']);
for (const f of filmsRaw){
  const w = f.wd || {};
  const am = matchAlFilm(f);
  // IMDb mette «Animation» anche a film con attori veri e a documentari: si escludono a mano quelli (elenco in content/film-exclude.json); tutti gli altri restano
  if (filmExclude.has(`${f.title} (${f.year})`)){ filmDropped++; continue; }
  if (am) usedAl.add(am.id);
  const num = parseInt(f.imdb.slice(2), 10);
  const prods = (w.prods || []).concat(w.dists || []);
  // la società di produzione decide; solo se manca si guarda il distributore (mai Netflix: distribuisce anche film di altri studi)
  const st = studioOf(w.prods) || studioOf((w.dists || []).filter(d => !/netflix|amazon|hulu|apple/i.test(d))) || (am && studioOf((am.studios && am.studios.nodes || []).map(x => x.name)));
  const it = {id: 'f' + num, l: 'film', f: 'MOVIE', imdb: num};
  const itLabel = w.it && norm(w.it) !== norm(f.title) ? w.it : null;
  it.name = itLabel || f.title;
  const sub = itLabel ? f.title : (f.orig && norm(f.orig) !== norm(f.title) ? f.orig : null); if (sub) it.jp = sub;
  const alt = []; const add = x => { x = String(x || '').trim(); if (x && !notLatin(x) && norm(x) !== norm(it.name) && norm(x) !== norm(it.jp) && !alt.some(a => norm(a) === norm(x))) alt.push(x); };
  add(f.title); add(f.orig); add(w.en); if (am){ add(am.title.english); add(am.title.romaji); (am.synonyms || []).forEach(add); }
  if (alt.length) it.alt = alt.slice(0, 4);
  it.who = st ? st[1] : ((w.prods || [])[0] || (w.dists || [])[0] || '');
  if (st) it.stk = st[0];
  const dir = (w.dirs || []).slice(0, 2).join(' e '); if (dir) it.dir = dir;
  const cn = [...new Set((w.countries || []).map(c => COUNTRY_IT[c] || c))].slice(0, 2).join(' · '); if (cn) it.cn = cn;
  it.y = f.year; if (f.run) it.d = f.run; it.st = 'F';
  // voto ponderato come nella Top 250 di IMDb: pochi voti = si avvicina alla media (evita che film di nicchia con 9,1 battano i capolavori); il voto grezzo resta in ir
  it.score = Math.round(((f.v / (f.v + WR_M)) * f.r + (WR_M / (f.v + WR_M)) * WR_C) * 10); it.ir = f.r; it.pop = f.v; it.m = 'V'; it.sc = 'imdb';
  it.tags = filmTags(f, am);
  if (w.itw) it.itw = w.itw;
  if (am){
    it.al = am.id; if (am.idMal) it.mal = am.idMal;
    const cp = coverParts(am); if (cp) it.img = cp; if (am.coverImage && am.coverImage.color) it.c = am.coverImage.color;
    const src = SRC[am.source]; if (src) it.src = src;
    it.desc = stripHtml(am.description);
  } else {
    const pp = posterPath(f.poster); if (pp) it.pu = pp; else if (w.enw) it.enw = w.enw;      // senza locandina già risolta: l'app la cerca da Wikipedia (a gruppi, con cache)
    it.desc = '';
  }
  // «serie» di Wikidata: si scartano gli elenchi di studio («List of Pixar films», «feature film canon») che non sono saghe
  const serie = (w.series || []).find(x => !/^list of|feature film|canon|filmography|^walt disney animation|^pixar|^dreamworks|\bfilms$|animated films|golden age|renaissance/i.test(x));
  if (!am && serie) it.wsg = slug(serie), it.wsgName = String(serie).replace(/\s*\((film|movie|animated)?.*?(series|franchise|trilogy|saga)\)\s*$/i, '');
  it.genresImdb = f.genres;
  items.push(it);
}
{
  const unmatched = alFilms.filter(m => !usedAl.has(m.id));
  console.log(`film: ${filmsRaw.length - filmDropped} tenuti (${usedAl.size} anime agganciati ad AniList), esclusi ${filmDropped} (film con attori veri, documentari, riassunti di serie); film AniList senza voce IMDb (scartati): ${unmatched.length}`);
  if (unmatched.length) console.log('   es.:', unmatched.slice(0, 12).map(m => titleEn(m) + ' (' + (m.startDate.year || '?') + ')').join(' | '));
  if (filmsNotAnim.length) console.log('   non riconosciuti come animazione da Wikidata (con molti voti):', filmsNotAnim.slice(0, 15).join(' | '));
}

// studi anche per anime (serie): dal nome dello studio di AniList
for (const i of items){
  if (i.l === 'anime' && i.who){
    const names = i.who.split(' + ');
    if (!i.stk){ const st = studioOf(names); if (st) i.stk = st[0]; }
    i.who = names.map(n => { const st = studioOf([n]); return st ? st[1] : niceStudio(n); }).join(' + ');
  }
}
const studioCount = {}; items.forEach(i => { if (i.stk) studioCount[i.stk] = (studioCount[i.stk] || 0) + 1; });

// id di un qualunque titolo AniList → id della voce (se è nella selezione)
const itemById = new Map(items.map(i => [i.id, i]));
const alToItem = new Map();
for (const i of items) alToItem.set(i.al, i.id);
for (const [member, root] of seriesOfMember) if (itemById.has('a' + root)) alToItem.set(member, 'a' + root);
const resolve = alId => alToItem.get(alId) || null;

// ---------------------------------------------------------------- adattamenti manga↔anime e consigli degli utenti
for (const i of items){
  const src = byId.get(i.al); if (!src) continue;
  const members = i.l === 'anime' ? (seriesMembers.get(i.al) || [src]) : [src];
  const ad = [], seen = new Set();
  for (const mm of members) for (const e of mm.relations.edges){
    if (e.relationType !== 'ADAPTATION' && e.relationType !== 'SOURCE') continue;
    const other = e.node; if (!other || other.type === mm.type) continue;
    const rid = resolve(other.id); const key = rid || ('x' + other.id);
    if (seen.has(key) || (rid && rid === i.id)) continue; seen.add(key);
    ad.push(rid ? {i: rid} : {al: other.id, t: other.type === 'MANGA' ? 'manga' : 'anime', n: (other.title.english || other.title.romaji)});
  }
  const inDb = ad.filter(x => x.i), outDb = ad.filter(x => !x.i && norm(x.n).startsWith(norm(i.name).slice(0, 12)));
  const pick = inDb.length ? inDb : outDb.slice(0, 2);
  if (pick.length) i.ad = pick.slice(0, 4);
  const recs = []; const rs = new Set();
  const pool = (SEL.media.find(x => x.id === i.al) || src).recs || [];
  for (const r of pool.slice().sort((a, b) => b.r - a.r)){ const rid = resolve(r.id); if (rid && rid !== i.id && !rs.has(rid)){ rs.add(rid); recs.push(rid); } }
  if (recs.length) i.rec = recs.slice(0, 6);
}

// ---------------------------------------------------------------- saghe (franchise): componenti connesse sulle relazioni «di trama»
const SAGA_NAMES = {};
const SAGA_EDGES = new Set(['ADAPTATION', 'SOURCE', 'PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SUMMARY']);
{
  const parent = new Map(); const find = x => { while (parent.get(x) !== x){ parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const add = x => { if (!parent.has(x)) parent.set(x, x); }; const uni = (a, b) => { add(a); add(b); parent.set(find(a), find(b)); };
  for (const m of byId.values()) for (const e of m.relations.edges) if (SAGA_EDGES.has(e.relationType)){ if (!(m.type === 'ANIME' && e.node.type === 'ANIME' && e.node.format === 'MOVIE' && false)) uni(m.id, e.node.id); }
  const comp = new Map();
  for (const i of items){
    if (!i.al) continue;
    const ids = i.l === 'anime' ? (seriesMembers.get(i.al) || [byId.get(i.al)]).map(x => x.id) : [i.al];
    ids.forEach(add);
    const r = find(ids[0]); (comp.get(r) || comp.set(r, []).get(r)).push(i);
  }
  let n = 0;
  for (const list of comp.values()){
    if (list.length < 2) continue;
    // nome della saga: la voce più popolare (di solito quella che tutti chiamano con il nome della franchise)
    const flagship = list.slice().sort((a, b) => b.pop - a.pop)[0];
    const key = 's' + flagship.al;
    list.forEach(i => { i.sg = key; });
    SAGA_NAMES[key] = flagship.name;
    n++;
  }
  // film occidentali: «parte della serie» di Wikidata (Toy Story, Shrek, Ice Age…)
  const byWsg = new Map();
  for (const i of items) if (!i.sg && i.wsg) (byWsg.get(i.wsg) || byWsg.set(i.wsg, []).get(i.wsg)).push(i);
  for (const [k, list] of byWsg){
    if (list.length < 2) continue;
    const key = 'w' + k; list.forEach(i => { i.sg = key; }); SAGA_NAMES[key] = list[0].wsgName || list[0].name; n++;
  }
  console.log('saghe con almeno 2 voci:', n);
}

// ---------------------------------------------------------------- titoli italiani (Wikidata) per anime e manga
{
  const f = path.join(CACHE, 'wd-it.json');
  if (fs.existsSync(f)){
    const wdIt = JSON.parse(fs.readFileSync(f, 'utf8')); let n = 0;
    for (const i of items){
      const w = wdIt[i.id]; if (!w) continue;
      if (w.it && !/stagione|episodi|season/i.test(w.it) && norm(w.it) !== norm(i.name) && norm(w.it) !== norm(i.jp)){ i.itn = w.it; n++; }
      if (w.itw && !/^(episodi|stagioni|personaggi|lista|elenco)/i.test(w.itw)) i.itw = w.itw;
    }
    console.log('titoli italiani da Wikidata:', n);
  }
}

// ---------------------------------------------------------------- testi in italiano
const content = {};
if (fs.existsSync(CONTENT)) for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.json') && f !== 'film-exclude.json').sort()){
  const o = JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
  for (const [k, v] of Object.entries(o)) content[k] = Object.assign(content[k] || {}, v);
}
let withStory = 0, unknownKeys = 0;
for (const k of Object.keys(content)) if (!itemById.has(k)){ unknownKeys++; if (unknownKeys <= 10) console.log('⚠️  contenuto per una voce che non c\'è più:', k); }
// mappa delle chiavi brevi dei file di contenuto → campi della voce
const CONTENT_KEYS = {s: 'story', ok: 'ok', ko: 'ko', w: 'why', p: 'pros', c: 'cons', g: 'age', h: 'hl', hn: 'hln', how: 'how', lp: 'lp', hk: 'hk', wt: 'wt', gl: 'gl', nm: 'name', itn: 'itn', ia: 'ia', itw: 'itw', ite: 'ite', pu: 'pu'};
for (const i of items){
  const c = content[i.id]; if (!c) continue;
  for (const [k, field] of Object.entries(CONTENT_KEYS)){ if (c[k] != null && c[k] !== '' && !(k === 'pu' && (i.img || i.pu))) i[field] = c[k]; }
  if (c.s) withStory++;
  if (c.alt){ const al = i.alt || []; c.alt.forEach(a => { if (!al.some(x => norm(x) === norm(a))) al.unshift(a); }); i.alt = al.slice(0, 10); }
}

// ---------------------------------------------------------------- tier: soglie per lista dalla distribuzione dei voti
const TIER_CUTS = {};
for (const l of ['anime', 'film', 'manga', 'manhwa']){
  const list = items.filter(i => i.l === l);
  if (!list.length) continue;
  TIER_CUTS[l] = deriveCuts(list.map(i => i.score));
  list.forEach(i => { i.tier = tierWith(TIER_CUTS[l], i.score); });
}
// ---------------------------------------------------------------- ordinamento
const LIST_ORDER = {anime: 0, film: 1, manga: 2, manhwa: 3};
items.sort((a, b) => LIST_ORDER[a.l] - LIST_ORDER[b.l] || b.score - a.score || b.pop - a.pop);

// ---------------------------------------------------------------- comandi di servizio
const arg = process.argv.slice(2);
if (arg.includes('--groups')){
  for (const [root, ms] of seriesMembers) if (ms.length > 1 && itemById.has('a' + root)) console.log(`${ms.length}× ${titleEn(ms[0])}  ←  ${ms.slice(1).map(titleEn).join(' | ')}`);
  process.exit(0);
}
if (arg.includes('--worksheet')){
  const i0 = arg.indexOf('--worksheet'); const N = +arg[i0 + 1] || 60, from = +arg[i0 + 2] || 0;
  const todo = items.filter(i => !content[i.id] || !content[i.id].s).sort((a, b) => b.pop - a.pop);
  console.log(`# ${todo.length} voci senza testo italiano; ne mostro ${N} dalla posizione ${from}`);
  todo.slice(from, from + N).forEach(i => {
    const len = i.l === 'manga' || i.l === 'manhwa' ? [i.ch && i.ch + ' cap', i.v && i.v + ' vol'].filter(Boolean).join(' ') : [i.n && i.n + ' ep', i.d && i.d + 'min'].filter(Boolean).join(' ');
    console.log(`\n[${i.id}] ${i.name}${i.jp ? ' / ' + i.jp : ''} | ${i.l} ${i.f} ${i.y}${i.y2 ? '-' + i.y2 : ''} | ${i.who || ''}${i.dir ? ' | regia ' + i.dir : ''} | ${len} | ${i.tags.join(',')}${i.seasons ? ' | stagioni:' + i.seasons.length : ''}\n${i.desc.slice(0, 330)}`);
  });
  process.exit(0);
}

// ---------------------------------------------------------------- scrittura
items.forEach(i => { delete i.desc; delete i.genresImdb; delete i.wsg; delete i.wsgName; });
const sagaCount = {}; items.forEach(i => { if (i.sg) sagaCount[i.sg] = (sagaCount[i.sg] || 0) + 1; });
const sagas = {}; Object.keys(SAGA_NAMES).forEach(k => { if (sagaCount[k] >= 2) sagas[k] = SAGA_NAMES[k]; });
const data = {
  built: SEL.fetched, source: 'AniList (anime e manga) · IMDb (film) · Wikidata',
  tierCuts: TIER_CUTS,
  tags: TAGDEFS.map(([c, l, ic, g, r]) => ({c, l, i: ic, g, r})),
  genreOrder: GENRE_ORDER, audience: AUDIENCE,
  studios: STUDIOS.filter(st => (studioCount[st[0]] || 0) >= 2).map(([k, n, i, g]) => ({k, n, i, g, c: studioCount[k]})),
  sagas,
  items
};
const lines = JSON.stringify(data.items).slice(1, -1).replace(/\},\{/g, '},\n{');
const head = JSON.stringify(Object.assign({}, data, {items: '@@ITEMS@@'})).replace('"@@ITEMS@@"', '[\n' + lines + '\n]');
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, '// Generato da anime-manga/tools/build-data.js (AniList, IMDb, Wikidata; testi in tools/content). Non modificare a mano.\nconst AM_DATA = ' + head + ';\n');
const by = {}; items.forEach(i => { by[i.l] = (by[i.l] || 0) + 1; });
console.log('voci:', by, 'totale', items.length, '| con trama italiana:', withStory);
for (const l of Object.keys(TIER_CUTS)){ const t = {}; items.filter(i => i.l === l).forEach(i => { t[i.tier] = (t[i.tier] || 0) + 1; }); console.log(' tier', l.padEnd(6), TIER_ORDER.map(x => x + ':' + (t[x] || 0)).join(' '), '| soglie', JSON.stringify(TIER_CUTS[l])); }
console.log('studi:', data.studios.map(s => s.k + ':' + s.c).join(' '));
console.log('dimensione dati.js:', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB');
