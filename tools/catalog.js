// Giochi AGGIUNTI da Mario: stanno nel catalogo pubblico su GitHub (gist «RaccoonTier-catalogo», pubblicato dal suo dispositivo).
// Gli strumenti dei dati notturni li leggono da qui, così l'archivio dal server copre TUTTI i giochi, non solo quelli di base.
// Uso: const {allGames} = require('./catalog'); const list = await allGames(D.games);
async function customGames(){
  try{
    const owner = process.env.GITHUB_REPOSITORY_OWNER || 'kur0chanx';
    const h = {'User-Agent': 'raccoon-tier', Accept: 'application/vnd.github+json'}; if(process.env.GITHUB_TOKEN) h.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    let f = null;
    for(let page = 1; page <= 3 && !f; page++){
      const r = await fetch('https://api.github.com/users/' + owner + '/gists?per_page=100&page=' + page, {headers: h});
      if(!r.ok){ console.log('catalogo: elenco gist non letto (HTTP ' + r.status + ')'); return []; }
      const l = await r.json(); f = Array.isArray(l) && l.find(g=> g.description === 'RaccoonTier-catalogo'); if(!Array.isArray(l) || l.length < 100) break;
    }
    const file = f && f.files && f.files['catalogo.json']; if(!file){ console.log('catalogo: gist non trovato'); return []; }
    const j = await (await fetch(file.raw_url)).json(); const v = j.keys && j.keys.jrpg_db_customGames && j.keys.jrpg_db_customGames.v; if(!v) return [];
    const o = JSON.parse(v);
    return Object.keys(o).filter(id=> o[id] && o[id].name && !o[id]._d).map(id=> ({id, name: o[id].name, plat: o[id].plat || '', year: o[id].year || '', custom: true}));
  }catch(e){ console.log('catalogo non letto:', e.message); return []; }
}
async function allGames(base){
  const custom = await customGames(); console.log('giochi aggiunti dal catalogo:', custom.length);
  const seen = new Set();
  return base.concat(custom).filter(g=> g && g.name && !seen.has(String(g.id)) && seen.add(String(g.id)));
}
module.exports = {customGames, allGames};
