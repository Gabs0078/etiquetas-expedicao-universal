const assert = require('node:assert/strict');
const { criarServidor } = require('../integracao/servidor.cjs');

module.exports = async function testarDesktop(browser, pasta) {
  let { servidor, token } = criarServidor({ fontes: [{ id: 'local', nome: 'XMLs de teste', tipo: 'pastas', pastas: [pasta] }] }, { desktop: true });
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
    assert.equal(await pagina.locator('#btnIntegracao').textContent(), 'Buscar nas pastas');
    assert.equal(await pagina.evaluate(() => document.cookie.includes('etiquetas_sessao')), false);
    await pagina.locator('#btnBuscarIntegracao').click();
    await pagina.locator('[data-importar-id]').waitFor();
    await pagina.evaluate(() => navigator.serviceWorker.ready);
    await pagina.reload();
    await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    await pagina.locator('#btnBuscarIntegracao').click();
    await pagina.locator('[data-importar-id]').waitFor();
    // Reabertura no mesmo perfil com service worker ativo.
    const reabrir = async () => {
      const sessao = await (await fetch(base + '/api/sessao', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })).json();
      const aba = await contexto.newPage();
      await aba.goto(base + sessao.caminho);
      await aba.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
      assert.equal(aba.url(), base + '/');
      assert.equal(await aba.locator('#btnImprimir').isVisible(), true);
      assert.equal(await aba.locator('#acessoIntegracao').isVisible(), false);
      await aba.close();
    };
    await reabrir();
    // Nova sessão no mesmo endereço, preservando cookies e cache antigos.
    const porta = servidor.address().port;
    await new Promise(resolve => servidor.close(resolve));
    ({ servidor, token } = criarServidor({ fontes: [{ id: 'local', nome: 'XMLs de teste', tipo: 'pastas', pastas: [pasta] }] }, { desktop: true }));
    await new Promise(resolve => servidor.listen(porta, '127.0.0.1', resolve));
    await reabrir();
    const chaves = await pagina.evaluate(async () => (await Promise.all((await caches.keys()).map(async nome => (await (await caches.open(nome)).keys()).map(r => new URL(r.url).pathname)))).flat());
    assert.equal(chaves.some(p => p.startsWith('/api/') || p === '/iniciar'), false);
    // Os assets com versão continuam disponíveis offline no cache estático.
    await contexto.setOffline(true);
    await pagina.reload();
    await pagina.locator('#btnManual').click();
    await pagina.locator('#nf').fill('OFFLINE');
    await pagina.locator('#destinatario').fill('Cliente offline\nRua Exemplo, 1');
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#countNotas').textContent(), '1');
    await contexto.setOffline(false);
    assert.deepEqual(erros, []);
    console.log('Desktop: conexao automatica, busca, recarga e cache verificados.');
  } finally {
    await contexto.close();
    await new Promise(resolve => servidor.close(resolve));
  }
};
