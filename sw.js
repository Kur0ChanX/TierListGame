// Service worker (v202): l'app si apre SEMPRE, anche quando GitHub Pages rifiuta («Rate limit exceeded»).
// Il limite di GitHub è per indirizzo internet: sulla rete mobile l'indirizzo è condiviso con molte altre persone, quindi può scattare anche se tu apri poco.
// Per questo l'app chiede al sito il MINIMO indispensabile:
//  · la pagina: sempre al sito (per sapere se c'è una versione nuova); se il sito rifiuta, la copia salvata;
//  · codice (js/css): dalla copia salvata finché la versione non cambia; con una versione nuova si riscarica una volta sola;
//  · dati che il server aggiorna di notte (voti, prezzi…): al massimo ogni 6 ore;
//  · immagini, caratteri, suoni: dalla copia salvata, ricontrollati al massimo una volta al giorno.
// Se il sito rifiuta e non c'è copia, riprovo da solo qualche volta prima di arrendermi.
const CACHE = 'raccoon-tier-v2';
// tutti i file dell'app (si salvano man mano che la pagina li chiede: NON li scarico tutti insieme all'installazione, era una raffica di richieste)
const SHELL = ['./', 'style.css', 'theme.css', 'packs.css', 'palettes.js', 'packs.js', 'icone.js', 'gusto.js', 'dna.js', 'media.js', 'voti.js', 'idee.js', 'ordine.js', 'cervello.js', 'tratti.js', 'pagine.js', 'avvisi.js', 'voce.js', 'sospetti.js', 'gioco-ora.js', 'voci-plus.js', 'aggiorna-tutti.js', 'motion.js', 'archivio.js', 'sync.js', 'app.js', 'app-schede.js', 'app-utente.js', 'app-ai.js', 'chiavi-cifrate.js', 'acquisto.js', 'cinema.js', 'guida.js', 'shots.js', 'gemini.js', 'loader.js', 'sources.js', 'genres.js', 'verify.js', 'fx.js', 'extras.js', 'extras2.js', 'extras3.js', 'extras4.js', 'qrcode.min.js', 'music.js', 'pet.js', 'radar.js', 'ost.js', 'quality.js', 'intro.js', 'giochi.js', 'facts.js', 'discoveries.js', 'manifest.webmanifest', 'icons/logo.png', 'icons/icon-192.png', 'icons/frugu-hd.gif'];
const PRE = ['./', 'icons/logo.png', 'icons/icon-192.png', 'icons/frugu-hd.gif', 'icons/frugu.gif'];
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
  e.waitUntil(caches.open(CACHE).then(c=> Promise.all(PRE.map(async u=>{ if(await c.match(u)) return; try{ await c.add(new Request(u, {cache: 'no-cache'})); }catch(x){} }))).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== CACHE && k !== COVERS && !/^raccoon-anime/.test(k))      /* v237: le copie dell'app Anime (stesso sito, cartella anime-manga/) non si toccano */.map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});
const STATIC = /\/(icons|packs|fonts)\/|\.(png|jpe?g|webp|gif|svg|woff2?|ttf|otf|mp3|ogg)(\?|$)/i;      // v229: il manifest NON in cache: Chrome deve vedere subito «schermo intero»
const DATA = /\/(voti|facts|ost|shots|radar|quality|discoveries)\.js$|\/dati\/notte-/;      // v211: anche i pezzi notturni (cambiano ogni notte, non con la versione)
const DAY = 864e5, DATA_TTL = 6 * 3600e3;
let BUILD = '';                                   // versione dell'ultima pagina scaricata dal sito
const META = new Request('./__sw_build');
async function getBuild(){ if(BUILD) return BUILD; try{ const m = await caches.match(META); if(m) BUILD = await m.text(); }catch(e){} return BUILD; }
async function setBuild(b){ if(!b || b === BUILD) return; BUILD = b; try{ const c = await caches.open(CACHE); await c.put(META, new Response(b)); }catch(e){} }
const sleep = ms=> new Promise(r=> setTimeout(r, ms));
// scarica dal sito e salva con l'etichetta di versione e l'ora; se rifiuta (429/5xx) riprova un paio di volte
async function netSave(r, tries){
  let res = null;
  for(let i = 0; i < (tries || 1); i++){
    try{ res = await fetch(r, {cache: 'no-cache'}); }catch(e){ res = null; }
    if(res && res.ok) break;
    if(i < (tries || 1) - 1) await sleep(1500 * (i + 1));
  }
  if(!res || !res.ok) return res;
  try{
    const body = await res.clone().blob(), h = new Headers(res.headers);
    h.set('x-sw-t', String(Date.now())); h.set('x-sw-b', BUILD || '');
    const c = await caches.open(CACHE); await c.put(r.url.split('#')[0], new Response(body, {status: 200, statusText: 'OK', headers: h}));
  }catch(e){}
  return res;
}
async function anyCopy(r){
  const hit = await caches.match(r.url.split('#')[0]) || await caches.match(r, {ignoreSearch: true});
  if(hit) return hit;
  if(r.mode === 'navigate'){ const home = await caches.match('./'); if(home) return home; }
  return null;
}
// v217: «Condividi immagine» da Chrome (o dalla galleria) → Raccoon Tier: tengo l'immagine da parte e apro l'app, che la mette come locandina
const SHARED = new Request('./__shared-cover');
async function takeShare(r){
  try{
    const fd = await r.formData(), f = fd.get('image'), c = await caches.open(CACHE);
    if(f && f.size) await c.put(SHARED, new Response(f, {headers: {'content-type': f.type || 'image/jpeg', 'x-sw-t': String(Date.now())}}));
    else { const t = ['url', 'text', 'title'].map(k=> fd.get(k)).filter(Boolean).join(' '); if(t) await c.put(SHARED, new Response(t, {headers: {'content-type': 'text/plain', 'x-sw-t': String(Date.now())}})); }
  }catch(err){}
  return Response.redirect(new URL('./?shared=cover', self.location).href, 303);
}
self.addEventListener('fetch', e=>{
  const r = e.request;
  if(r.method === 'POST' && /\/share-cover\/?$/.test(new URL(r.url).pathname)){ e.respondWith(takeShare(r)); return; }
  // copertine in miniatura (wsrv.nl, con CORS): prima la copia salvata, così si vedono anche offline
  if(r.method === 'GET' && /^https:\/\/wsrv\.nl\//.test(r.url)){ e.respondWith(coverFetch(r)); return; }
  if(r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  if(/[?&]vchk/.test(r.url)) return;               // controllo nuova versione: sempre al sito
  const path = new URL(r.url).pathname;
  if(/\/anime-manga(\/|$)/.test(path)) return;      // v237: l'app Anime ha il suo service worker: qui non la tocco (altrimenti salverei la sua pagina come «casa»)
  e.respondWith((async()=>{
    // 1) la pagina
    if(r.mode === 'navigate' || /\.html$/.test(path) || /\/$/.test(path)){
      let res = null; try{ res = await fetch(r, {cache: 'no-cache'}); }catch(err){}
      if(res && res.ok){
        try{ const t = await res.clone().text(), m = /<meta name="build" content="(v\d+)"/.exec(t); if(m) await setBuild(m[1]); const c = await caches.open(CACHE); await c.put('./', new Response(t, {headers: {'content-type': 'text/html; charset=utf-8'}})); }catch(x){}
        return res;
      }
      return (await anyCopy(r)) || res || Response.error();
    }
    const hit = await caches.match(r.url.split('#')[0]) || (STATIC.test(path) ? await caches.match(r, {ignoreSearch: true}) : null);
    const age = hit ? Date.now() - (+hit.headers.get('x-sw-t') || Date.parse(hit.headers.get('date') || '') || 0) : Infinity;
    // 2) immagini/caratteri/suoni: copia salvata, ricontrollo al massimo una volta al giorno (in background)
    if(STATIC.test(path)){
      if(hit){ if(age > DAY) e.waitUntil(netSave(r).catch(()=>{})); return hit; }
      return (await netSave(r, 3)) || Response.error();
    }
    // 3) dati notturni: copia se ha meno di 6 ore (e stessa versione), altrimenti al sito
    const b = await getBuild();
    const fresh = hit && (hit.headers.get('x-sw-b') || '') === b && (!DATA.test(path) || age < DATA_TTL);
    if(fresh) return hit;
    // 4) codice di una versione nuova (o mai scaricato): al sito, con la copia salvata come riserva
    const res = await netSave(r, hit ? 1 : 3);
    if(res && res.ok) return res;
    return hit || (await anyCopy(r)) || res || Response.error();
  })());
});
