// Service worker: rende l'app installabile, funziona OFFLINE e non mostra mai versioni vecchie.
// Strategia «prima la rete, poi la copia»: con internet chiede sempre al server «è cambiato?» (cache: 'no-cache', risposta veloce 304 se no),
// aggiorna la copia nella cache del dispositivo; senza internet (metropolitana, aereo…) usa l'ultima copia salvata.
// GitHub Pages tiene i file in cache 10 minuti: qui la si salta, così gli aggiornamenti si vedono subito.
const CACHE = 'raccoon-tier-v2';
const SHELL = ['./', 'style.css', 'theme.css', 'palettes.js', 'sync.js', 'app.js', 'app-schede.js', 'app-utente.js', 'app-ai.js', 'gemini.js', 'loader.js', 'sources.js', 'genres.js', 'verify.js', 'fx.js', 'extras.js', 'extras2.js', 'extras3.js', 'extras4.js', 'qrcode.min.js', 'music.js', 'pet.js', 'triad.js', 'triad.css', 'triad-core.js', 'triad-cards.js', 'triad-exp.js', 'triad-chars.js', 'triad-imgs.js', 'triad-art.js', 'triad-play.js', 'triad-online.js', 'triad-config.js', 'radar.js', 'ost.js', 'quality.js', 'intro.js', 'giochi.js', 'giochi-dettagli-1.js', 'giochi-dettagli-2.js', 'giochi-dettagli-3.js', 'giochi-dettagli-4.js', 'facts.js', 'discoveries.js', 'manifest.webmanifest', 'icons/logo.png', 'icons/icon-192.png', 'icons/frugu-hd.gif'];
const COVERS = 'raccoon-covers-v1', COVER_MAX = 1600;
async function coverFetch(r){
  const c = await caches.open(COVERS);
  const hit = await c.match(r.url);
  if(hit) return hit;
  try{
    const res = await fetch(r.url, {mode: 'cors', credentials: 'omit'});
    if(res && res.ok && res.type !== 'opaque'){
      await c.put(r.url, res.clone());
      c.keys().then(ks=>{ if(ks.length > COVER_MAX) ks.slice(0, ks.length - COVER_MAX).forEach(k=> c.delete(k)); }).catch(()=>{});
    }
    return res;
  }catch(err){ return fetch(r); }
}
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> Promise.all(SHELL.map(u=> c.add(new Request(u, {cache: 'no-cache'})).catch(()=>{})))).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== CACHE && k !== COVERS).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const r = e.request;
  // copertine in miniatura (wsrv.nl, con CORS): prima la copia salvata, così si vedono anche offline
  if(r.method === 'GET' && /^https:\/\/wsrv\.nl\//.test(r.url)){ e.respondWith(coverFetch(r)); return; }
  if(r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith((async()=>{
    try{
      const res = await fetch(r, {cache: 'no-cache'});
      if(res && res.ok){ const c = await caches.open(CACHE); c.put(r, res.clone()).catch(()=>{}); }
      return res;
    }catch(err){
      const hit = await caches.match(r, {ignoreSearch: true});
      if(hit) return hit;
      if(r.mode === 'navigate'){ const home = await caches.match('./'); if(home) return home; }
      throw err;
    }
  })());
});
