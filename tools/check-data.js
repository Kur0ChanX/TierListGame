// Controllo dati (uso: node tools/check-data.js). Segnala:
//  - frasi legate al tempo che invecchiano ("uscito da poco", "troppo recente"...) su giochi non recentissimi
//  - nomi duplicati, giochi senza tag, tag sconosciuti
// Non modifica nulla. Esce con codice 0: sono avvisi da leggere, non errori.
const fs = require('fs');
const path = require('path');
const D = require('./data-io').load();          // giochi.js + giochi-dettagli.js insieme
const NOW = new Date();
const YEAR = NOW.getFullYear();
const TIME_RE = /essendo [^;.]{0,40}recente|titolo (relativamente |indipendente )?recente|capitolo (più )?recente|reinvenzione recente|invecchia (bene|benissimo) essendo|panorama indie recente|in corso di rilascio|terzo capitolo in sviluppo|uscito da poco|appena uscit|uscita recente|troppo (presto|recente|fresc)|di recente|poco valutabil|ancora presto|da poco (uscit|sul mercato)|pochi mesi|primi mesi|ancora (poche|pochi) (recension|dati|mesi)|non ancora (valutabil|consolidat|giudicabil)|recentissim|troppo nuov|troppo giovane/i;
// i tag validi sono quelli definiti in app.js (TAG_INFO + EXTRA_GENRE_INFO): li leggo da lì, così l'elenco non invecchia
const KNOWN_TAGS = new Set([...fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').matchAll(/^  ([A-Z][A-Z0-9]+):\{icon:/gm)].map(m => m[1]));
const norm = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
let warnings = 0;
const warn = m => { warnings++; console.log('⚠️  ' + m); };
// workflow di GitHub: un valore senza virgolette con «: » dentro rompe tutto il file (e il giro notturno non parte più)
{ const fs0 = require('fs'), p0 = require('path'), dir = p0.join(__dirname, '..', '.github', 'workflows');
  try{ fs0.readdirSync(dir).filter(f=> /\.ya?ml$/.test(f)).forEach(f=>{ fs0.readFileSync(p0.join(dir, f), 'utf8').split('\n').forEach((l, i)=>{
    const m = /^\s*-?\s*(name|if|run):\s+(.*)$/.exec(l); if(!m) return; const v = m[2].trim();
    if(/^["'|>]/.test(v) || m[1] === 'run' || m[1] === 'if') return;
    if(/:\s/.test(v) || /\s#/.test(v)) warn(`Workflow ${f} riga ${i + 1}: metti il testo tra virgolette («${v.slice(0, 60)}»), altrimenti il workflow non parte`);
  }); }); }catch(e){}
}
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

// coerenza di versione: la pagina (meta build) e gli script (DATA_BUILD_VERSION) devono avere lo stesso numero,
// altrimenti un HTML vecchio in cache si mescola a script nuovi (icone che spariscono, ecc.)
{
  const fs2 = require('fs'), path2 = require('path');
  const root = path2.join(__dirname, '..');
  const html = fs2.readFileSync(path2.join(root, 'Tier List RPG & JRPG di Mario.html'), 'utf8');
  const ai = fs2.readFileSync(path2.join(root, 'app-ai.js'), 'utf8');
  const mb = (html.match(/<meta name="build" content="([^"]+)"/) || [])[1], jv = (ai.match(/DATA_BUILD_VERSION = '([^']+)'/) || [])[1];
  if (mb !== jv) { warnings++; console.log(`Versione non coerente: <meta name="build"> = ${mb}, DATA_BUILD_VERSION = ${jv}. Aggiorna il meta nell'HTML.`); }
  if (!/^<!DOCTYPE html>/i.test(html)) { warnings++; console.log('L\'HTML deve iniziare con <!DOCTYPE html>.'); }
}

// nessun marcatore di conflitto git rimasto nei file (successo una volta con un nome file con spazi)
{
  const fs3 = require('fs'), path3 = require('path'), root3 = path3.join(__dirname, '..');
  for (const f of fs3.readdirSync(root3)) {
    if (!/\.(html|js|css|md|json|webmanifest|yml)$/.test(f) || f === 'giochi.js' || f === 'giochi-dettagli.js') continue;   // i due file dati: un marcatore li farebbe fallire in JSON.parse già sopra
    const txt = fs3.readFileSync(path3.join(root3, f), 'utf8');
    if (/^(<{7} |>{7} )/m.test(txt)) { warnings++; console.log('Marcatore di conflitto git rimasto in: ' + f); }
  }
}
// ogni script locale caricato dall'HTML deve esistere, essere copiato dal workflow Pages e stare nella cache offline (sw.js)
{
  const root4 = path.join(__dirname, '..');
  const html4 = fs.readFileSync(path.join(root4, 'Tier List RPG & JRPG di Mario.html'), 'utf8');
  const pages = fs.readFileSync(path.join(root4, '.github', 'workflows', 'pages.yml'), 'utf8');
  const sw = fs.readFileSync(path.join(root4, 'sw.js'), 'utf8');
  const scripts = [...html4.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]).filter(u => !/^(https?:)?\/\//.test(u));
  for (const u of scripts) {
    if (!fs.existsSync(path.join(root4, u))) { warnings++; console.log('Script nell\'HTML che non esiste: ' + u); continue; }
    if (!new RegExp('(^|\\s)' + u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)', 'm').test(pages)) { warnings++; console.log('Script non copiato dal workflow Pages (.github/workflows/pages.yml): ' + u); }
    if (u !== 'intro.js' && u !== 'palettes.js' && sw.indexOf("'" + u + "'") < 0) { warnings++; console.log('Script mancante nella cache offline (sw.js, elenco SHELL): ' + u); }
  }
  for (const f of ['facts.js', 'discoveries.js']) {
    const fp = path.join(root4, f);
    if (!fs.existsSync(fp)) { warnings++; console.log('File dati mancante: ' + f + ' (il workflow Pages lo copia: senza, la pubblicazione fallisce). Lancia: node tools/' + (f === 'facts.js' ? 'build-facts' : 'build-discoveries') + '.js'); continue; }
    try { JSON.parse(fs.readFileSync(fp, 'utf8').replace(/^const [A-Z_]+ = /, '').replace(/;\s*$/, '')); } catch (e) { warnings++; console.log('File dati non valido (JSON rotto): ' + f); }
  }
}
console.log(warnings ? `\n${warnings} avvisi.` : 'Nessun avviso: dati coerenti.');
