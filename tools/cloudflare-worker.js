// Ponte personale (Cloudflare Workers, piano gratuito) per Tier List RPG & JRPG di Mario e per Raccoon Anime — VERSIONE 3
// Serve ai siti che non permettono l'accesso diretto dal browser (Steam, Metacritic ufficiale, SteamSpy, GOG, Reddit, YouTube; per l'app Anime: IMDb, MyAnimeList, AnimeClick, Anime News Network, JustWatch).
// Sicurezza: risponde SOLO per i siti elencati qui sotto e SOLO alla tua app; NON è incluso api.rawg.io, perché la chiave RAWG non deve passare da nessun ponte.
// Aggiornare: Cloudflare → Workers → il tuo ponte → «Modifica codice» → incolla tutto questo file → «Distribuisci». L'indirizzo resta lo stesso.
const VERSION = 3;
const ALLOW_HOSTS = new Set([
  'store.steampowered.com', 'steamspy.com', 'catalog.gog.com',
  'www.reddit.com', 'old.reddit.com', 'api.reddit.com',
  'en.wikipedia.org', 'it.wikipedia.org', 'www.wikidata.org', 'query.wikidata.org',
  'www.cheapshark.com', 'www.pcgamingwiki.com', 'www.youtube.com',
  'backend.metacritic.com', 'www.metacritic.com', 'opencritic.com',
  // v3: app Anime (anime, manga, film e serie)
  'www.imdb.com', 'm.imdb.com', 'api.jikan.moe', 'myanimelist.net', 'kitsu.io', 'www.animeclick.it', 'www.animenewsnetwork.com', 'www.justwatch.com'
]);
// quanto tenere in memoria ogni risposta sui server Cloudflare (secondi): meno richieste ai siti, risposte più veloci
const TTL = {'store.steampowered.com': 3600, 'backend.metacritic.com': 21600, 'www.metacritic.com': 21600, 'opencritic.com': 21600, 'www.youtube.com': 86400, 'en.wikipedia.org': 3600, 'it.wikipedia.org': 3600, 'www.imdb.com': 21600, 'm.imdb.com': 21600, 'myanimelist.net': 21600, 'www.animeclick.it': 21600, 'www.justwatch.com': 21600};
const ALLOW_ORIGINS = new Set(['https://kur0chanx.github.io', 'null']);   // 'null' = app aperta da file
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || 'null';
    const cors = {
      'Access-Control-Allow-Origin': ALLOW_ORIGINS.has(origin) ? origin : 'https://kur0chanx.github.io',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (!ALLOW_ORIGINS.has(origin)) return new Response('origine non consentita', {status: 403, headers: cors});
    const q = new URL(request.url).searchParams;
    if (q.get('info') === '1') return new Response(JSON.stringify({v: VERSION, hosts: [...ALLOW_HOSTS]}), {headers: Object.assign({'Content-Type': 'application/json'}, cors)});
    let target;
    try { target = new URL(q.get('url')); } catch (e) { return new Response('parametro url mancante', {status: 400, headers: cors}); }
    if (target.protocol !== 'https:' || !ALLOW_HOSTS.has(target.hostname)) return new Response('sito non consentito', {status: 403, headers: cors});
    const browserLike = /metacritic|opencritic|youtube|imdb|myanimelist|animeclick|animenewsnetwork|justwatch/.test(target.hostname);
    const r = await fetch(target.toString(), {
      headers: {'User-Agent': browserLike ? UA : 'TierListGame/1.0 (uso personale)', 'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8', 'Accept-Language': /animeclick|justwatch/.test(target.hostname) ? 'it-IT,it;q=0.9' : 'en-US,en;q=0.9'},
      cf: {cacheTtl: TTL[target.hostname] || 600, cacheEverything: true}
    });
    const h = new Headers(r.headers);
    Object.entries(cors).forEach(([k, v]) => h.set(k, v));
    h.delete('content-security-policy'); h.delete('set-cookie'); h.set('X-Ponte-Versione', String(VERSION));
    return new Response(r.body, {status: r.status, headers: h});
  }
};
