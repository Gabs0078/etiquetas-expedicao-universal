/* Service worker do Expedição - Etiquetas.
   Estratégia: cache-first para os arquivos estáticos do app.
   Ao alterar qualquer arquivo da lista, incremente CACHE_VERSION
   para que os usuários recebam a versão nova. */

const CACHE_VERSION = 'etiquetas-v5-importacao';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/nfe.js',
  './assets/js/fontes.js',
  './assets/js/importacao.js',
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
          .filter(chave => chave.startsWith('etiquetas-') && chave !== CACHE_VERSION)
          .map(chave => caches.delete(chave))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.headers.has('Authorization')) return;
  const permitidos = ARQUIVOS.map(arquivo => new URL(arquivo, self.registration.scope).href);
  if (!permitidos.includes(event.request.url)) return;

  event.respondWith(
    caches.match(event.request).then(resposta => {
      if (resposta) return resposta;

      return fetch(event.request);
    })
  );
});
