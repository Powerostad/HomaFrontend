/// <reference lib="webworker" />
import { matchRoute } from './seo/routes';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };
const manifest = self.__WB_MANIFEST;
// A build-specific asset cache; HTML is never part of the public precache.
const version = manifest.reduce((hash, item) => Array.from(item.url + item.revision).reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), hash), 2166136261) >>> 0;
const cacheName = `homa-assets-v3-${version}`;
const offlineShell = '/offline-shell.html';
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // includeAssets and globPatterns can both include the same icon. Cache.addAll
    // rejects duplicate requests and would prevent the entire worker installing.
    const urls = new Set(manifest.map((asset) => new URL(asset.url, self.location.origin).href));
    urls.delete(new URL('/config.js', self.location.origin).href);
    urls.add(new URL(offlineShell, self.location.origin).href);
    await cache.addAll([...urls]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('homa-assets-') && key !== cacheName) || key.startsWith('workbox-precache-')) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    // Never intercept public documents: the server owns HTML, redirects and 404s.
    if (matchRoute(url.pathname).kind !== 'private') return;
    event.respondWith(fetch(event.request).catch(async () => (await caches.match(offlineShell)) || Response.error()));
    return;
  }
  if (url.pathname.startsWith('/assets/')) event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
