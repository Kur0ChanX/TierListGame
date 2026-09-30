// Ponte personale (Cloudflare Workers, piano gratuito) per Tier List RPG & JRPG di Mario.
// Serve ai siti che non permettono l'accesso diretto dal browser (Steam, SteamSpy, GOG, Reddit).
// Sicurezza: risponde SOLO per i siti elencati qui sotto e SOLO alla tua app; NON è incluso api.rawg.io, perché la chiave RAWG non deve passare da nessun ponte.
const ALLOW_HOSTS = new Set([
  'store.steampowered.com', 'steamspy.com', 'catalog.gog.com',
  'www.reddit.com', 'old.reddit.com', 'api.reddit.com',
  'en.wikipedia.org', 'it.wikipedia.org', 'www.wikidata.org', 'query.wikidata.org',
  'www.cheapshark.com', 'www.pcgamingwiki.com', 'www.youtube.com'
]);
const ALLOW_ORIGINS = new Set(['https://kur0chanx.github.io', 'null']);   // 'null' = app aperta da file
export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || 'null';
    const cors = {
      'Access-Control-Allow-Origin': ALLOW_ORIGINS.has(origin) ? origin : 'https://kur0chanx.github.io',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (!ALLOW_ORIGINS.has(origin)) return new Response('origine non consentita', {status: 403, headers: cors});
    let target;
    try { target = new URL(new URL(request.url).searchParams.get('url')); } catch (e) { return new Response('parametro url mancante', {status: 400, headers: cors}); }
    if (target.protocol !== 'https:' || !ALLOW_HOSTS.has(target.hostname)) return new Response('sito non consentito', {status: 403, headers: cors});
    const r = await fetch(target.toString(), {
      headers: {'User-Agent': 'TierListGame/1.0 (uso personale)', 'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8'},
      cf: {cacheTtl: 600, cacheEverything: true}
    });
    const h = new Headers(r.headers);
    Object.entries(cors).forEach(([k, v]) => h.set(k, v));
    h.delete('content-security-policy'); h.delete('set-cookie');
    return new Response(r.body, {status: r.status, headers: h});
  }
};
