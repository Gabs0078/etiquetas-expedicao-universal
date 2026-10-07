const assert = require('node:assert/strict');
const { criarServidor } = require('../integracao/servidor.cjs');

module.exports = async function testarDesktop(browser, pasta) {
  const { servidor, token } = criarServidor({ fontes: [{ id: 'local', nome: 'XMLs de teste', tipo: 'pastas', pastas: [pasta] }] }, { desktop: true });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const contexto = await browser.newContext();
  const erros = [];
  try {
    const { caminho } = await (await fetch(`${base}/api/sessao`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).json();
    const pagina = await contexto.newPage();
    pagina.on('pageerror', e => erros.push(e.message));
    await pagina.goto(base + caminho);
    await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    assert.equal(new URL(pagina.url()).search, '');
    assert.equal(await pagina.locator('#acessoIntegracao').isVisible(), false);
    assert.equal(await pagina.locator('#btnIntegracao').textContent(), 'Buscar na pasta');
    assert.equal(await pagina.evaluate(() => document.cookie.includes('etiquetas_sessao')), false);
    await pagina.locator('#btnBuscarIntegracao').click();
    await pagina.locator('[data-importar-id]').waitFor();
    await pagina.evaluate(() => navigator.serviceWorker.ready);
    await pagina.reload();
    await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    await pagina.locator('#btnBuscarIntegracao').click();
    await pagina.locator('[data-importar-id]').waitFor();
    const chaves = await pagina.evaluate(async () => (await Promise.all((await caches.keys()).map(async nome => (await (await caches.open(nome)).keys()).map(r => new URL(r.url).pathname)))).flat());
    assert.equal(chaves.some(p => p.startsWith('/api/') || p === '/iniciar'), false);
    assert.deepEqual(erros, []);
    console.log('Desktop: conexao automatica, busca, recarga e cache verificados.');
  } finally {
    await contexto.close();
    await new Promise(resolve => servidor.close(resolve));
  }
};
