/* Service worker do Expedição - Etiquetas.
   Estratégia: cache-first para os arquivos estáticos do app.
   Ao alterar qualquer arquivo da lista, incremente CACHE_VERSION
   para que os usuários recebam a versão nova. */

const CACHE_VERSION = 'etiquetas-v2';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/icons/app-icon.svg',
  './assets/icons/app-icon-192.png',
  './assets/icons/app-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(
        chaves
          .filter(chave => chave !== CACHE_VERSION)
          .map(chave => caches.delete(chave))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(resposta => {
      if (resposta) return resposta;

      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
