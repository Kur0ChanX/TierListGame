#!/usr/bin/env node
// Converte i titoli (anime, film anime, animazione occidentale, manga, manhwa) nel formato dati v3 dell'app
// (lo stesso della Tier List dei videogiochi v236): giochi.js (indice a tabella) + dati/testi-K.js (testi lunghi a pezzi).
// Fonte: tools/legacy-v1/dati.js (costruito da build-data.js con AniList, IMDb, Wikidata, it.wikipedia)
//        + tools/content/testi/*.json (testi in italiano scritti a mano, facoltativi: trama, pro/contro, «fa per te se»…)
// Uso:  node anime-manga/tools/build-v3.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const IO = require('./data-io.js');
const raw = fs.readFileSync(path.join(__dirname, 'legacy-v1', 'dati.js'), 'utf8');
const AM = JSON.parse(raw.replace(/^[\s\S]*?const AM_DATA = /, '').replace(/;\s*$/, ''));

// ---- tipo di lista: i film giapponesi restano «Film», gli altri vanno in «Animazione» (Disney, Pixar, DreamWorks…) ----
const JP_STUDIOS = new Set(AM.studios.filter(s=> s.g === 'Giappone').map(s=> s.k));
function kindOf(i){
  if(i.l !== 'film') return i.l;
  if(i.al || JP_STUDIOS.has(i.stk) || /Giappone/.test(i.cn || '')) return 'film';
  return 'animazione';
}
const KIND_ORDER = {anime: 0, film: 1, animazione: 2, manga: 3, manhwa: 4};
const FORMAT_IT = {TV: 'Serie TV', TV_SHORT: 'Serie breve', ONA: 'Serie web', OVA: 'OVA', MOVIE: 'Film', MANGA: 'Manga', ONE_SHOT: 'One-shot', SPECIAL: 'Speciale'};

// ---- testi scritti a mano (facoltativi) ----
const TXT = {};
const TDIR = path.join(__dirname, 'content', 'testi');
if(fs.existsSync(TDIR)) fs.readdirSync(TDIR).filter(f=> f.endsWith('.json')).forEach(f=> Object.assign(TXT, JSON.parse(fs.readFileSync(path.join(TDIR, f), 'utf8'))));

// ---- ore per finirlo: episodi × durata, film = durata, manga ≈ 4 minuti a capitolo ----
function hoursOf(i){
  if(i.l === 'film') return i.d ? Math.round(i.d / 60 * 10) / 10 : 1.6;
  if(i.l === 'anime'){ const eps = i.n || (i.seasons ? i.seasons.reduce((s, x)=> s + (x[2] || 0), 0) : 12); return Math.max(1, Math.round(eps * (i.d || 24) / 60)); }
  const ch = i.ch || (i.v ? i.v * 9 : 60);
  return Math.max(1, Math.round(ch * 4 / 60));
}
const has = (i, ...c)=> c.some(x=> i.tags.includes(x));
// «etichetta» in numeri, come per i giochi: d = complessità, g = riempitivi/lentezza, s = peso della storia, p = ritmo, h = ore
function labelOf(i, h){
  let d = 2 + (has(i, 'PSY', 'MYS') ? 1 : 0) + (has(i, 'SCI', 'SEI', 'HIS') ? 0.5 : 0) - (has(i, 'KID', 'FAM', 'COM') ? 0.7 : 0);
  let g = (i.n || 0) > 150 ? 4 : (i.n || 0) > 60 ? 3 : (i.ch || 0) > 300 ? 4 : (i.ch || 0) > 120 ? 3 : 2;
  if(i.l === 'film') g = 1;
  let s = 3 + (has(i, 'DRA', 'MYS', 'PSY') ? 1 : 0) + (has(i, 'SEI') ? 0.5 : 0) - (has(i, 'SOL', 'COM', 'ECC') ? 1 : 0);
  const p = has(i, 'ACT', 'SPO', 'THR') ? 'V' : has(i, 'SOL', 'IYA') || (has(i, 'DRA') && !has(i, 'ACT')) ? 'L' : 'M';
  const it = i.ia === 'D' ? 'D' : i.ia === 'S' || i.ia === 'E' ? 'S' : i.ia === 'N' ? 'N' : undefined;
  const r = x=> Math.max(1, Math.min(5, Math.round(x)));
  const o = {d: r(d), g: r(g), s: r(s), p, h};
  if(it) o.it = it;
  return o;
}
function coverOf(i){
  if(i.img) return `https://s4.anilist.co/file/anilistcdn/media/${i.l === 'manga' || i.l === 'manhwa' ? 'manga' : 'anime'}/cover/large/${i.img}`;
  if(i.pu) return 'https://upload.wikimedia.org/wikipedia/' + String(i.pu).replace('{w}', 330);
  return null;
}
const yearTxt = i=> !i.y ? '' : i.st === 'R' && i.l !== 'film' ? i.y + '–in corso' : i.y2 && i.y2 !== i.y ? i.y + '–' + i.y2 : String(i.y);

const items = AM.items.slice().sort((a, b)=> KIND_ORDER[kindOf(a)] - KIND_ORDER[kindOf(b)] || b.score - a.score || (b.pop || 0) - (a.pop || 0));
// id numerici STABILI: chi era già numerato tiene il suo numero (tools/content/ids.json), i nuovi in coda
const IDF = path.join(__dirname, 'content', 'ids.json');
const IDS = fs.existsSync(IDF) ? JSON.parse(fs.readFileSync(IDF, 'utf8')) : {};
let next = Math.max(0, ...Object.values(IDS)) + 1;
items.forEach(i=>{ if(!IDS[i.id]) IDS[i.id] = next++; });
fs.writeFileSync(IDF, JSON.stringify(IDS).replace(/,"/g, ',\n"') + '\n');

const games = [], labels = {}, enrich = {}, dopa = {}, sagaMap = {};
const numOf = aid=> IDS[aid];
for(const i of items){
  const id = IDS[i.id], kind = kindOf(i), h = hoursOf(i), t = TXT[i.id] || {};
  const g = {id, name: i.name, plat: [FORMAT_IT[i.f] || i.f, i.who].filter(Boolean).join(' · '), year: yearTxt(i), ysort: i.y || 0,
    tier: i.tier, score: i.score, m: i.m || 'V', tags: i.tags.slice(), note: '', vs: i.sc === 'imdb' ? 'IMDb' : 'AniList',
    kind, aid: i.id, fmt: i.f};
  ['al', 'mal', 'imdb', 'jp', 'alt', 'who', 'dir', 'cn', 'stk', 'n', 'd', 'ch', 'v', 'st', 'pop', 'fav', 'c', 'src', 'itw', 'enw', 'ir', 'itn', 'ia', 'y2'].forEach(k=>{ if(i[k] != null && i[k] !== '') g[k] = i[k]; });
  if(i.seasons) g.seasons = i.seasons;
  if(i.ad) g.ad = i.ad.map(a=> Object.assign({}, a, a.i ? {i: numOf(a.i)} : {})).filter(a=> a.i != null);
  if(i.rec) g.rec = i.rec.map(numOf).filter(Boolean);
  if(t.story) g.story = t.story;
  games.push(g);
  const lab = labelOf(i, h); if(t.ok) lab.ok = t.ok; if(t.ko) lab.ko = t.ko; if(t.play) lab.play = t.play;
  labels[id] = lab;
  const e = {hoursMain: h, coverUrl: coverOf(i)};
  ['storyTag', 'storyTagNote', 'dopamine', 'eraScore', 'todayScore', 'agingNote', 'gameplayScore', 'gameplayNote', 'whyLikeIt', 'pros', 'cons', 'lengthVerdict', 'remaster', 'language', 'cast', 'soundtrack', 'hoursCompletionist'].forEach(k=>{ if(t[k] != null) e[k] = t[k]; });
  enrich[id] = e;
  if(t.dopa) dopa[id] = t.dopa;
  if(i.sg) sagaMap[id] = i.sg;
}
// saghe con almeno 2 titoli
const cnt = {}; Object.values(sagaMap).forEach(s=> cnt[s] = (cnt[s] || 0) + 1);
Object.keys(sagaMap).forEach(id=>{ if(cnt[sagaMap[id]] < 2) delete sagaMap[id]; });
const D = {sagaMap, market: {asof: AM.built, games: {}, incoming: []}, games, labels, enrich, dopa,
  meta: {built: AM.built, tierCuts: AM.tierCuts, tags: AM.tags, genreOrder: AM.genreOrder, audience: AM.audience, studios: AM.studios, sagas: AM.sagas}};
IO.save(D);
const by = {}; games.forEach(g=> by[g.kind] = (by[g.kind] || 0) + 1);
console.log('scritto giochi.js + dati/testi-*.js:', games.length, 'titoli', JSON.stringify(by), '· con testi scritti:', games.filter(g=> g.story).length);
