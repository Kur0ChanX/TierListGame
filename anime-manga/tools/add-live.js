#!/usr/bin/env node
// Unisce ai dati (giochi.js + dati/testi-*.js) i film e le serie DAL VIVO scaricati da fetch-live.js (AM_CACHE/live.json).
// Si può rilanciare: i titoli già presenti (stesso id IMDb, campo aid «l…») tengono il loro id; quelli che non sono più in lista si tolgono.
// Uso:  AM_CACHE=… node anime-manga/tools/add-live.js
'use strict';
const fs = require('fs'), path = require('path');
const io = require('./data-io');
const CACHE = process.env.AM_CACHE || path.join(__dirname, '.cache');
const LIVE = JSON.parse(fs.readFileSync(path.join(CACHE, 'live.json'), 'utf8'));

// stesse soglie di tier di build-data.js (quota cumulata di titoli da S+ a E; il resto è F)
const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'], CUM = [0.02, 0.08, 0.22, 0.46, 0.72, 0.88, 0.96];
function deriveCuts(scores){
  const a = scores.slice().sort((x, y)=> y - x), n = a.length, cuts = {};
  TIER_ORDER.slice(0, 7).forEach((t, k)=>{ cuts[t] = a[Math.min(n - 1, Math.max(0, Math.round(n * CUM[k]) - 1))]; });
  for (let k = 1; k < 7; k++){ const t = TIER_ORDER[k], prev = cuts[TIER_ORDER[k - 1]]; if (cuts[t] >= prev) cuts[t] = prev - 1; }
  return cuts;
}
const tierWith = (cuts, s)=>{ for (const t of TIER_ORDER.slice(0, 7)) if (s >= cuts[t]) return t; return 'F'; };
const norm = s=> String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// generi IMDb → codici dei tag (il primo dell'elenco PRI che il titolo ha diventa il genere principale)
const G = {Action: 'ACT', Adventure: 'ADV', Comedy: 'COM', Drama: 'DRA', Fantasy: 'FAN', 'Sci-Fi': 'SCI', Horror: 'HOR', Mystery: 'MYS', Thriller: 'THR', Romance: 'ROM',
  Sport: 'SPO', Music: 'MUS', Musical: 'MUS', War: 'MIL', History: 'HIS', Crime: 'CRI', Family: 'FAM', Documentary: 'DOC', Biography: 'BIO', Western: 'WES', 'Film-Noir': 'NOI'};
const PRI = ['DOC', 'WES', 'NOI', 'BIO', 'SPO', 'MUS', 'HOR', 'SCI', 'FAN', 'ACT', 'CRI', 'MIL', 'HIS', 'ROM', 'THR', 'MYS', 'COM', 'ADV', 'DRA', 'FAM'];
const tagsOf = genres=>{ const c = [...new Set(genres.map(g=> G[g]).filter(Boolean))]; return PRI.filter(x=> c.includes(x)).slice(0, 5); };
// nuovi generi (regola: un genere fondamentale che manca si aggiunge alla lista ufficiale)
const NEW_TAGS = [{c: 'BIO', l: 'Biografico', i: '👤', g: 'Generi', r: {}}, {c: 'WES', l: 'Western', i: '🤠', g: 'Generi', r: {}}, {c: 'NOI', l: 'Noir', i: '🎩', g: 'Generi', r: {}}];
const IT_NETS = /^(sky|rai|mediaset|canale 5|italia 1|rete 4|la7|tv8)/i;

const D = io.load();
NEW_TAGS.forEach(t=>{ if (!D.meta.tags.some(x=> x.c === t.c)){ const i = D.meta.tags.findIndex(x=> x.c === 'DOC'); D.meta.tags.splice(i + 1, 0, t); } });
['NOI', 'WES', 'BIO'].forEach(c=>{ if (!D.meta.genreOrder.includes(c)) D.meta.genreOrder.unshift(c); });

const keep = new Map(D.games.filter(g=> g.kind === 'filmlive' || g.kind === 'serie').map(g=> [g.aid, g]));
const taken = new Set(D.games.filter(g=> g.imdb && g.kind !== 'filmlive' && g.kind !== 'serie').map(g=> g.imdb));
D.games = D.games.filter(g=> g.kind !== 'filmlive' && g.kind !== 'serie');
let nextId = Math.max(...D.games.map(g=> g.id), ...[...keep.values()].map(g=> g.id)) + 1;

const films = LIVE.filter(x=> x.type === 'movie'), series = LIVE.filter(x=> x.type !== 'movie');
const wr = (list, M)=>{ const C = list.reduce((s, x)=> s + x.r, 0) / list.length; list.forEach(x=>{ x.score = Math.round(((x.v / (x.v + M)) * x.r + (M / (x.v + M)) * C) * 10); }); };
wr(films, 25000); wr(series, 10000);      // voto ponderato come la Top 250 di IMDb: pochi voti = si avvicina alla media
const cuts = {filmlive: deriveCuts(films.map(x=> x.score)), serie: deriveCuts(series.map(x=> x.score))};
D.meta.tierCuts = Object.assign({}, D.meta.tierCuts, cuts);

let added = 0, skipped = 0;
for (const x of LIVE){
  const num = parseInt(x.imdb.slice(2), 10);
  if (taken.has(num)){ skipped++; continue; }
  const kind = x.type === 'movie' ? 'filmlive' : 'serie', w = x.wd || {};
  const aid = 'l' + num, old = keep.get(aid);
  const name = w.it && !/^Q\d+$/.test(w.it) ? w.it : x.title;
  const g = {id: old ? old.id : nextId++, name, kind, aid, fmt: kind === 'filmlive' ? 'MOVIE' : x.type === 'tvMiniSeries' ? 'MINI' : 'TV', imdb: num};
  if (norm(x.title) !== norm(name)) g.jp = x.title; else if (x.orig && norm(x.orig) !== norm(name)) g.jp = x.orig;
  if (kind === 'filmlive'){
    const dir = (w.dirs || []).slice(0, 2);
    g.plat = 'Film' + (dir.length ? ' · ' + dir.join(' e ') : ''); g.who = dir[0] || ''; if (dir.length) g.dir = dir.join(' e ');
    g.year = String(x.y1 || ''); g.st = 'F';
  } else {
    const nets = (w.nets || []), net = nets.find(n=> !IT_NETS.test(n)) || nets[0] || '', cre = (w.cres || []).slice(0, 2);
    g.plat = (x.type === 'tvMiniSeries' ? 'Miniserie' : 'Serie TV') + (net ? ' · ' + net : ''); g.who = net; if (cre.length) g.dir = cre.join(' e ');
    const ongoing = x.type === 'tvSeries' && !x.y2;
    g.year = x.y2 && x.y2 !== x.y1 ? x.y1 + '–' + x.y2 : ongoing ? x.y1 + '–in corso' : String(x.y1 || ''); g.st = ongoing ? 'R' : 'F';
    if (x.eps) g.n = x.eps; if (x.y2) g.y2 = x.y2;
  }
  g.ysort = x.y1 || 0;
  const cn = (w.cns || []).slice(0, 2).join(' · '); if (cn) g.cn = cn;
  if (x.run) g.d = x.run;
  g.score = x.score; g.tier = tierWith(cuts[kind], x.score); g.m = 'V'; g.vs = 'IMDb'; g.ir = x.r; g.pop = x.v;
  g.tags = tagsOf(x.genres); g.note = '';
  if (w.itw) g.itw = w.itw; if (w.enw) g.enw = w.enw;
  if (old && old.c) g.c = old.c;
  D.games.push(g);
  const h = kind === 'filmlive' ? (x.run ? Math.round(x.run / 60 * 10) / 10 : null) : (x.eps && x.run ? Math.round(x.eps * x.run / 60 * 10) / 10 : null);
  D.labels[g.id] = Object.assign({}, old ? D.labels[g.id] : {}, h ? {h} : {});
  if (h) D.enrich[g.id] = Object.assign({}, D.enrich[g.id] || {}, {hoursMain: h});
  added++;
}
// testi e etichette dei titoli tolti dalla lista
const ids = new Set(D.games.map(g=> g.id));
Object.keys(D.labels).forEach(id=>{ if (!ids.has(+id)) delete D.labels[id]; });
Object.keys(D.enrich).forEach(id=>{ if (!ids.has(+id)) delete D.enrich[id]; });
io.save(D);
console.log(`film e serie dal vivo: ${added} (${films.length} film, ${series.length} serie; ${skipped} già presenti come animazione). Titoli totali: ${D.games.length}`);
console.log('soglie tier', JSON.stringify(cuts));
