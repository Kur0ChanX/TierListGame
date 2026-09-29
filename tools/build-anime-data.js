#!/usr/bin/env node
// Costruisce anime-manga/dati.js dai dati scaricati da tools/fetch-anime-data.js (offline: non fa richieste).
// Uso:  node tools/build-anime-data.js            → scrive anime-manga/dati.js e stampa un riepilogo
//       node tools/build-anime-data.js --groups   → elenca le serie ottenute fondendo più stagioni (per controllare le fusioni)
//       node tools/build-anime-data.js --worksheet [N] [da]  → stampa N titoli senza testo italiano (per scriverlo in tools/anime-content/)
// Decisioni principali (tutte qui, in un posto solo):
//  - fonte unica dei voti: AniList (averageScore 0-100, media degli utenti); niente stime inventate.
//  - ANIME: le stagioni di una stessa serie TV diventano UNA voce (voto = media pesata sulla popolarità, episodi sommati);
//    film, OVA e manga restano voci singole. Le regole di fusione stanno in sameSeries() + SPLIT_TITLES.
//  - TIER: soglie fisse sul voto (TIER_CUTS); il programma usa le stesse per i titoli aggiunti dall'utente.
//  - TESTI in italiano (trama, «fa per te se»…): file tools/anime-content/*.json, chiave = id della voce.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CACHE = process.env.AM_CACHE || path.join(__dirname, '.anime-cache');
const OUT = path.join(ROOT, 'anime-manga', 'dati.js');
const CONTENT = path.join(__dirname, 'anime-content');
const SEL = JSON.parse(fs.readFileSync(path.join(CACHE, 'selection.json'), 'utf8'));

// ---------------------------------------------------------------- tier
const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
const TIER_CUTS = {'S+': 89, 'S': 86, 'A': 83, 'B': 79, 'C': 75, 'D': 70, 'E': 65};   // F = sotto 65
const tierOf = s => { for (const t of TIER_ORDER.slice(0, 7)) if (s >= TIER_CUTS[t]) return t; return 'F'; };

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
const AUDIENCE = ['SHO', 'SEI', 'SHJ', 'JOS', 'KID'];
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
  const aud = AUDIENCE.find(c => { const d = TAGDEFS.find(x => x[0] === c); return d[4].t.some(n => (tagRank.get(n) || 0) >= 50); });
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
  it.tier = tierOf(score); it.m = 'V';
  it.tags = tagsOf(m);
  const src = SRC[m.source]; if (src && (isAnime || src !== 'Manga')) it.src = src;
  const cp = coverParts(m); if (cp) it.img = cp;
  if (m.coverImage && m.coverImage.color) it.c = m.coverImage.color;
  it.desc = stripHtml(m.description);                     // solo per il foglio di lavoro: non finisce in dati.js
  if (members.length > 1){
    it.seasons = members.map(x => [titleEn(x), x.startDate.year || null, x.episodes || null, x.averageScore == null ? null : x.averageScore]);
  }
  return it;
}

// ---------------------------------------------------------------- selezione finale
const items = [];
const CAPS = {film: {pop: 30000, altScore: 84, altPop: 20000, max: 150}, manhwa: {pop: 12000, max: 100}};
const cleanName = n => n.replace(/\s*\((TV|ONA|OVA)\)$/i, '').replace(/\s+(Season 1|1st Season)$/i, '').trim();
{
  const animeRoots = new Set();
  for (const m of SEL.media){
    if (m.list === 'anime'){ animeRoots.add(seriesOfMember.has(m.id) ? seriesOfMember.get(m.id) : m.id); }
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
const SAGA_EDGES = new Set(['ADAPTATION', 'SOURCE', 'PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SUMMARY']);
{
  const parent = new Map(); const find = x => { while (parent.get(x) !== x){ parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const add = x => { if (!parent.has(x)) parent.set(x, x); }; const uni = (a, b) => { add(a); add(b); parent.set(find(a), find(b)); };
  for (const m of byId.values()) for (const e of m.relations.edges) if (SAGA_EDGES.has(e.relationType)){ if (!(m.type === 'ANIME' && e.node.type === 'ANIME' && e.node.format === 'MOVIE' && false)) uni(m.id, e.node.id); }
  const comp = new Map();
  for (const i of items){
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
    n++;
  }
  console.log('saghe con almeno 2 voci:', n);
}

// ---------------------------------------------------------------- testi in italiano
const content = {};
if (fs.existsSync(CONTENT)) for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.json')).sort()){
  const o = JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
  for (const [k, v] of Object.entries(o)) content[k] = Object.assign(content[k] || {}, v);
}
let withStory = 0, unknownKeys = 0;
for (const k of Object.keys(content)) if (!itemById.has(k)){ unknownKeys++; if (unknownKeys <= 10) console.log('⚠️  contenuto per una voce che non c\'è più:', k); }
for (const i of items){
  const c = content[i.id]; if (!c) continue;
  if (c.s){ i.story = c.s; withStory++; }
  if (c.ok) i.ok = c.ok; if (c.ko) i.ko = c.ko;
  if (c.it) i.it = c.it;                                   // titolo italiano (se diverso)
  if (c.alt){ const al = i.alt || []; c.alt.forEach(a => { if (!al.some(x => norm(x) === norm(a))) al.unshift(a); }); i.alt = al.slice(0, 10); }
  if (c.nm) i.name = c.nm;                                 // nome da mostrare, se quello di AniList non è quello comune
}

// ---------------------------------------------------------------- ordinamento e id progressivo di classifica
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
    console.log(`\n[${i.id}] ${i.name}${i.jp ? ' / ' + i.jp : ''} | ${i.l} ${i.f} ${i.y}${i.y2 ? '-' + i.y2 : ''} | ${i.who || ''} | ${len} | ${i.tags.join(',')}${i.seasons ? ' | stagioni:' + i.seasons.length : ''}\n${i.desc.slice(0, 330)}`);
  });
  process.exit(0);
}

// ---------------------------------------------------------------- scrittura
items.forEach(i => { delete i.desc; });
const data = {
  built: SEL.fetched, source: SEL.source,
  tierCuts: TIER_CUTS,
  tags: TAGDEFS.map(([c, l, ic, g]) => ({c, l, i: ic, g})),
  items
};
const lines = JSON.stringify(data.items).slice(1, -1).replace(/\},\{/g, '},\n{');
const head = JSON.stringify(Object.assign({}, data, {items: '@@ITEMS@@'})).replace('"@@ITEMS@@"', '[\n' + lines + '\n]');
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, '// Generato da tools/build-anime-data.js (dati AniList, testi in tools/anime-content). Non modificare a mano.\nconst AM_DATA = ' + head + ';\n');
const by = {}; items.forEach(i => { by[i.l] = (by[i.l] || 0) + 1; });
const tiers = {}; items.forEach(i => { tiers[i.tier] = (tiers[i.tier] || 0) + 1; });
console.log('voci:', by, 'totale', items.length, '| con trama italiana:', withStory);
console.log('tier:', TIER_ORDER.map(t => t + ':' + (tiers[t] || 0)).join(' '));
console.log('dimensione dati.js:', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB');
