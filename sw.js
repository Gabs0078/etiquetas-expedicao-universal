/* Service worker do Expedição - Etiquetas.
   Estratégia: cache-first para os arquivos estáticos do app.
   Ao alterar qualquer arquivo da lista, incremente CACHE_VERSION
   para que os usuários recebam a versão nova. */

const CACHE_VERSION = 'etiquetas-v65-edicao';
const ASSET_VERSION = '65';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/nfe.js',
  './assets/js/fontes.js',
  './assets/js/importacao.js',
  './assets/icons/github-invertocat-black.svg',
  './assets/icons/github-invertocat-white.svg',
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
  const url = new URL(event.request.url);
  const versao = url.searchParams.get('v');
  if (versao && versao !== ASSET_VERSION) return;
  url.search = ''; url.hash = '';
  if (!permitidos.includes(url.href)) return;

  // Navegações usam a página atual; o cache fica como alternativa offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).then(resposta => {
      if (resposta.ok) { const copia = resposta.clone(); event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.put(url.href, copia))); }
      return resposta;
    }).catch(() => caches.open(CACHE_VERSION).then(cache => cache.match(url.href))));
    return;
  }
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache => cache.match(url.href)).then(resposta => {
      if (resposta) return resposta;

      return fetch(event.request);
    })
  );
});
