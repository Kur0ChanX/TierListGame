// Service worker minimo: serve solo a rendere l'app installabile ("Aggiungi a schermata Home").
// Non mette nulla in cache: la pagina si aggiorna sempre da sola con l'ultima versione.
self.addEventListener('install', ()=> self.skipWaiting());
self.addEventListener('activate', e=> e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', ()=>{});
