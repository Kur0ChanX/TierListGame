// Controllo dati (uso: node tools/check-data.js). Segnala:
//  - frasi legate al tempo che invecchiano ("uscito da poco", "troppo recente"...) su giochi non recentissimi
//  - nomi duplicati, giochi senza tag, tag sconosciuti
// Non modifica nulla. Esce con codice 0: sono avvisi da leggere, non errori.
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'giochi.js'), 'utf8');
const D = JSON.parse(raw.replace(/^const GIOCHI_DATA = /, '').replace(/;\s*$/, ''));
const NOW = new Date();
const YEAR = NOW.getFullYear();
const TIME_RE = /uscito da poco|appena uscit|uscita recente|troppo (presto|recente|fresc)|di recente|poco valutabil|ancora presto|da poco (uscit|sul mercato)|pochi mesi|primi mesi|ancora (poche|pochi) (recension|dati|mesi)|non ancora (valutabil|consolidat|giudicabil)|recentissim|troppo nuov|troppo giovane/i;
const KNOWN_TAGS = new Set(['TAC','ACT','DUN','TUR','MON','CARD','WAR','CROSS','VN','MECH','METR','SOUL','HOR','REMAKE','LIFE','ROG','PLAT','BEAT','FIGHT','STEALTH','ADV','WALK','FPS','TPS','SHMUP','BR','SPORT','RACE','RTS','TBS4X','MOBA','CITY','TOWERDEF','ECOSIM','PUZ','PARTY','RHY','BOARDG','SAND','SIMLIFE','ARCADE','IDLE','RUN','COOP']);
const norm = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
let warnings = 0;
const warn = m => { warnings++; console.log('⚠️  ' + m); };
function walk(o, p, cb){ if (typeof o === 'string') cb(p, o); else if (Array.isArray(o)) o.forEach((x, i) => walk(x, p + '[' + i + ']', cb)); else if (o && typeof o === 'object') for (const k in o) walk(o[k], p ? p + '.' + k : k, cb); }
const seen = {};
for (const g of D.games) {
  const k = norm(g.name);
  if (seen[k]) warn(`Nome duplicato: "${g.name}" (id ${g.id} e ${seen[k]})`); else seen[k] = g.id;
  if (!g.tags.length) warn(`Nessun tag: ${g.name} (id ${g.id})`);
  g.tags.forEach(t => { if (!KNOWN_TAGS.has(t)) warn(`Tag sconosciuto "${t}": ${g.name}`); });
  const ys = (String(g.year).match(/\d{4}/g) || []).map(Number);
  const y = ys.length ? Math.max(...ys) : NaN;
  const e = D.enrich[g.id];
  if (e && y && y <= YEAR - 1) {
    walk(e, '', (p, s) => { if (TIME_RE.test(s)) warn(`Frase legata al tempo su un gioco del ${y}: ${g.name} → ${p}: "${s.slice(0, 90)}"`); });
  }
}
console.log(warnings ? `\n${warnings} avvisi.` : 'Nessun avviso: dati coerenti.');
