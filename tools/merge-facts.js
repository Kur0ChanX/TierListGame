// Unisce facts.js / tools/facts-chk.json dopo un conflitto di merge con main (il giro notturno li riscrive): node tools/merge-facts.js, poi git add + commit
const {execSync}=require('child_process'),vm=require('vm');
const get=(ref,f)=>execSync('git show '+ref+':'+f,{maxBuffer:1e8}).toString();
const parse=t=>{const c={};vm.createContext(c);vm.runInContext(t.replace(/^const (\w+)/m,'var $1'),c);return c.GAME_FACTS;};
const A=parse(get('origin/main','facts.js')),B=parse(get('HEAD','facts.js'));
const games=Object.assign({},A.games);Object.keys(B.games).forEach(id=>{const a=games[id],b=B.games[id];if(!a||(!(a.s&&a.s.id)&&b.s&&b.s.id)||(a.s&&b.s&&b.s.en&&!a.s.en)) games[id]=b;});
require('fs').writeFileSync('facts.js','const GAME_FACTS = '+JSON.stringify({built:A.built>B.built?A.built:B.built,games})+';\n');
const ca=JSON.parse(get('origin/main','tools/facts-chk.json')),cb=JSON.parse(get('HEAD','tools/facts-chk.json'));
const chk=Object.assign({},ca);Object.keys(cb).forEach(k=>{if(!chk[k]||cb[k]>chk[k])chk[k]=cb[k];});
require('fs').writeFileSync('tools/facts-chk.json',JSON.stringify(chk));
console.log('giochi',Object.keys(games).length,'con id Steam',Object.values(games).filter(x=>x.s&&x.s.id).length);
