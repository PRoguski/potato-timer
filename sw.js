// Service worker: "najpierw sieć". Każdy plik jest pobierany z serwera z rewalidacją
// (omija 10-minutowy cache GitHub Pages), a kopia w cache służy tylko offline.
// __APP_VERSION__ podmienia GitHub Actions — zmiana pliku = nowy SW po każdym deployu.
const CACHE = 'potato-timer-__APP_VERSION__';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for(const key of await caches.keys()){
      if(key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== location.origin) return;
  if(url.pathname.endsWith('/version.json')) return; // zawsze prosto z sieci

  event.respondWith((async () => {
    try{
      // Nowe żądanie (nie można przekazać init do żądania typu navigate)
      const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
      if(res.redirected && req.mode === 'navigate') return Response.redirect(res.url, 302);
      if(res.ok){
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    }catch(err){
      const hit = await caches.match(req, { ignoreSearch: true });
      if(hit) return hit;
      throw err;
    }
  })());
});
