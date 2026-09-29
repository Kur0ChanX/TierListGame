// Audit dei voti su Metacritic (uso: node tools/audit-metacritic.js risultati.json). Cerca ogni gioco nell'autosuggest di Metacritic e salva titolo, data, generi, piattaforme e Metascore.
// Con un proxy: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=<ca> node tools/audit-metacritic.js out.json. Confrontare poi il Metascore con 'score' e correggere solo se la differenza è >6 e le recensioni ≥15.
const fs=require('fs');const OUT=process.argv[2];
const D=JSON.parse(fs.readFileSync(require('path').join(__dirname,'..','giochi.js'),'utf8').replace(/^const GIOCHI_DATA = /,'').replace(/;\s*$/,''));const G=D.games;
const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const norm=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\([^)]*\)/g,' ').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\bthe\b/g,' ').replace(/\s+/g,' ').trim();
const clean=n=>String(n).replace(/\s*\([^)]*\)/g,'').replace(/^Pokemon /i,'Pokémon ').trim();
const state=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT)):{};
async function q(name){
  const u='https://backend.metacritic.com/finder/metacritic/autosuggest/'+encodeURIComponent(name)+'?apiKey=1MOZgmNFxvmljaQR1X9KAuUFFdE9ZK&mcoTypeId=13';
  for(let a=0;a<5;a++){try{const r=await fetch(u,{headers:{'User-Agent':UA}});const t=await r.text();if(t.startsWith('{'))return JSON.parse(t);}catch(e){}await sleep(1500*(a+1));}
  return null;
}
let idx=0,done=0;
async function worker(){
  while(idx<G.length){
    const g=G[idx++];if(state[g.id]!==undefined)continue;
    const nm=clean(g.name);const t=norm(nm);
    let res=await q(nm);let items=(res&&res.data&&res.data.items||[]).filter(x=>x.type==='game-title');
    let best=items.find(x=>norm(x.title)===t)||items.find(x=>norm(x.title).startsWith(t)&&t.length>6)||null;
    if(!best){ // secondo tentativo senza sottotitolo dopo i due punti
      const short=nm.split(/:| - /)[0];if(short&&short!==nm){res=await q(short);items=(res&&res.data&&res.data.items||[]).filter(x=>x.type==='game-title');best=items.find(x=>norm(x.title)===t)||null;}
    }
    state[g.id]=best?{title:best.title,slug:best.slug,date:best.releaseDate,year:best.premiereYear,genres:(best.genres||[]).map(x=>x.name),platforms:(best.platforms||[]).map(x=>x.name),score:best.criticScoreSummary&&best.criticScoreSummary.score}:null;
    if(++done%40===0){fs.writeFileSync(OUT,JSON.stringify(state));console.log('done',done,'/',G.length);}
    await sleep(250);
  }
}
(async()=>{await Promise.all([worker(),worker(),worker()]);fs.writeFileSync(OUT,JSON.stringify(state));console.log('DONE',Object.values(state).filter(Boolean).length,'trovati');})();
