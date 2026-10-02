// Service worker: rende l'app installabile e SALTA la cache del browser.
// GitHub Pages fa tenere i file in cache per 10 minuti: senza questo, dopo un aggiornamento si vedeva ancora la versione vecchia.
// 'no-cache' = chiede sempre al server "è cambiato?" (se no, risposta velocissima 304): niente download inutili, mai versioni vecchie.
self.addEventListener('install', ()=> self.skipWaiting());
self.addEventListener('activate', e=> e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e=>{
  const r = e.request;
  if(r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r, {cache: 'no-cache'}).catch(()=> fetch(r)));
});
