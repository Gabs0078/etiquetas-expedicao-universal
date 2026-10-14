const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { criarServidor } = require('../integracao/servidor.cjs');
const { xmlNota } = require('./ajudantes.cjs');
async function testar() {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-browser-'));
  const { servidor, token } = criarServidor({ fontes: [
    { id: 'teste', nome: 'Empresa de demonstração', tipo: 'pastas', pastas: [pasta] },
    { id: 'teste2', nome: 'Segunda empresa', tipo: 'pastas', pastas: [pasta] }
  ] });
  await fs.writeFile(path.join(pasta, 'nota.xml'), xmlNota());
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  let browser;
  const erros = [];
  try {
    browser = await chromium.launch({ ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
    await require('./avisos-campos-navegador.cjs')(browser, 'http://127.0.0.1:' + servidor.address().port);
    await require('./pages-navegador.cjs')(browser);
    await require('./busca-indice-navegador.cjs')(browser);
    await require('./creditos-navegador.cjs')(browser);
    const pagina = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    pagina.on('pageerror', e => erros.push(e.message));
    pagina.on('dialog', dialog => dialog.accept());
    await pagina.goto(`http://127.0.0.1:${servidor.address().port}`);
    await pagina.emulateMedia({ colorScheme: 'light' });
    await pagina.evaluate(() => localStorage.setItem('expedicao_aparencia_v1', 'system'));
    await pagina.reload();
    assert.equal(await pagina.locator('html').getAttribute('data-theme'), 'light');
    await pagina.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await pagina.locator('html').getAttribute('data-theme'), 'light');
    await pagina.locator('#temaAparencia').click();
    await pagina.reload();
    assert.equal(await pagina.locator('#temaAparencia').getAttribute('aria-checked'), 'true');
    assert.equal(await pagina.locator('html').getAttribute('data-theme'), 'dark');
    await pagina.locator('#temaAparencia').press('Space');
    await pagina.reload();
    assert.equal(await pagina.locator('html').getAttribute('data-theme'), 'light');
    await pagina.locator('#temaAparencia').press('Enter');
    await pagina.reload();
    assert.equal(await pagina.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await pagina.locator('#usarEnderecoDestinatario').isDisabled(), true);
    assert.equal(await pagina.locator('#btnImprimir').isDisabled(), true);
    assert.equal(await pagina.locator('#btnImprimir').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(21, 128, 61)');
    await pagina.locator('#nf').fill('MANUAL-1');
    await pagina.locator('#destinatario').fill('Destinatário manual\nRua Exemplo, 10');
    await pagina.locator('#volumes').fill('2.5');
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#countNotas').textContent(), '0');
    await pagina.locator('#volumes').fill('2');
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#preview .label').count(), 2);
    assert.equal(await pagina.locator('#btnImprimir').isDisabled(), false);
    for (const formato of ['a4', 'bobina', 'bobina80', 'bobina85']) {
      await pagina.locator('[data-formato="' + formato + '"]').evaluate(e => { e.closest('details').open = true; }); await pagina.locator('[data-formato="' + formato + '"]').click();
      const antes = await pagina.locator('.company strong').first().evaluate(e => getComputedStyle(e).fontSize);
      await pagina.locator('#exibirEnderecoRemetente').uncheck();
        assert.equal(await pagina.locator('.label').first().locator('.company-line').count(), 1);
      assert.equal(await pagina.locator('.company strong').first().evaluate(e => getComputedStyle(e).fontSize), antes);
      await pagina.locator('#exibirEnderecoRemetente').check();
      assert.equal(await pagina.locator('.label').first().locator('.company-line').count(), 4);
    }
    await pagina.locator('#exibirEnderecoRemetente').uncheck();
    await pagina.reload();
    assert.equal(await pagina.locator('#exibirEnderecoRemetente').isChecked(), false);
    assert.equal(await pagina.locator('.label').first().locator('.company-line').count(), 1);
    await pagina.locator('#exibirEnderecoRemetente').check();
    await pagina.locator('[data-formato="' + 'a4' + '"]').evaluate(e => { e.closest('details').open = true; }); await pagina.locator('[data-formato="' + 'a4' + '"]').click();
    const upload = [{ name: 'nota.xml', mimeType: 'text/xml', buffer: Buffer.from(xmlNota().replace('</infNFe>', '<infAdic><infCpl>ENTREGA R. DA ENTREGA DE TESTE, S/N - GALPAO DE TESTE; CIDADE EXEMPLO / PR; Vendedor: Exemplo</infCpl></infAdic></infNFe>')) }, { name: 'errado.xml', mimeType: 'text/xml', buffer: Buffer.from('<invalido>') }];
    await pagina.locator('#xmlArquivos').setInputFiles(upload);
    await pagina.locator('[data-revisar]').waitFor();
    assert.match(await pagina.locator('#errosImportacao').textContent(), /malformado/);
    await pagina.locator('[data-revisar]').click();
    assert.match(await pagina.locator('#destinatario').inputValue(), /GALPAO DE TESTE\nCIDADE EXEMPLO \/ PR/);
    assert.doesNotMatch(await pagina.locator('#destinatario').inputValue(), /Rua Destino|CEP|Vendedor/);
    assert.equal(await pagina.locator('#botaoAviso-destinatario').isVisible(), false);
    const entregaOriginal = await pagina.locator('#destinatario').inputValue();
    assert.equal(await pagina.locator('#usarEnderecoDestinatario').isChecked(), false);
    await pagina.locator('#usarEnderecoDestinatario').check();
    assert.match(await pagina.locator('#destinatario').inputValue(), /Rua Destino, 20/);
    await pagina.locator('#usarEnderecoDestinatario').uncheck();
    assert.equal(await pagina.locator('#destinatario').inputValue(), entregaOriginal);
    await pagina.locator('#destinatario').fill('Endereço editado manualmente');
    pagina.removeAllListeners('dialog');
    pagina.once('dialog', dialog => dialog.dismiss());
    await pagina.locator('#usarEnderecoDestinatario').click();
    assert.equal(await pagina.locator('#destinatario').inputValue(), 'Endereço editado manualmente');
    assert.equal(await pagina.locator('#usarEnderecoDestinatario').isChecked(), false);
    pagina.on('dialog', dialog => dialog.accept());
    await pagina.locator('#usarEnderecoDestinatario').check();
    assert.match(await pagina.locator('#destinatario').inputValue(), /Rua Destino/);
    await pagina.locator('#usarEnderecoDestinatario').uncheck();
    assert.equal(await pagina.locator('#destinatario').inputValue(), entregaOriginal);
    assert.equal(await pagina.locator('.batch-help').getAttribute('open'), null);
    assert.equal(await pagina.locator('#confirmarRevisao').isChecked(), false);
    assert.equal(await pagina.locator('#volumes').inputValue(), '5');
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#countNotas').textContent(), '1');
    await pagina.locator('#confirmarRevisao').check();
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#preview .label').count(), 7);
    assert.equal(await pagina.locator('#filaImportacao .import-card').count(), 0);
    await pagina.locator('#xmlArquivos').setInputFiles(upload.slice(0, 1));
    await pagina.waitForFunction(() => document.querySelector('#statusImportacao').textContent.includes('duplicada'));
    assert.equal(await pagina.locator('#filaImportacao .import-card').count(), 0);
    await pagina.locator('#btnConfiguracoes').click();
    await pagina.locator('#btnNovaEmpresa').click();
    await pagina.locator('#nomeEmpresa').fill('Outra empresa');
    await pagina.locator('#cnpjEmpresa').fill('11.111.111/0001-11');
    await pagina.locator('#btnSalvarEmpresa').click();
    assert.match(await pagina.locator('#preview .label').nth(2).textContent(), /Empresa Fictícia/);
    assert.doesNotMatch(await pagina.locator('#preview .label').first().textContent(), /Outra empresa/);
    await pagina.locator('#btnFecharConfiguracoes').click();
    await pagina.reload();
    assert.equal(await pagina.locator('#preview .label').count(), 7);
    await pagina.evaluate(() => navigator.serviceWorker.ready);
    await pagina.reload();
    await pagina.context().setOffline(true);
    await pagina.reload();
    assert.equal(await pagina.locator('#preview .label').count(), 7);
    await pagina.context().setOffline(false);
    await pagina.locator('#btnIntegracao').click();
    await pagina.locator('#tokenIntegracao').fill(token);
    await pagina.locator('#btnConectar').click();
    await pagina.locator('#btnBuscarIntegracao').waitFor({ state: 'visible' });
    await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    await pagina.locator('#btnBuscarIntegracao').click();
    await pagina.locator('[data-importar-id]').waitFor();
    await pagina.locator('[data-importar-id]').click();
    await pagina.waitForFunction(() => document.querySelector('#statusImportacao').textContent.includes('duplicada'));
    assert.equal(await pagina.locator('#filaImportacao .import-card').count(), 0);
    const semVolumes = xmlNota({ volumes: '' }).replaceAll('35261000000000000100550010000001231123456780', '35261000000000000100550010000001241123456780').replace('<nNF>123', '<nNF>124');
    await pagina.locator('#xmlArquivos').setInputFiles({ name: 'sem-volumes.xml', mimeType: 'text/xml', buffer: Buffer.from(semVolumes) });
    await pagina.locator('[data-revisar]').waitFor();
    await pagina.locator('[data-revisar]').click();
    assert.equal(await pagina.locator('#volumes').inputValue(), '');
    await pagina.locator('#confirmarRevisao').check();
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#countNotas').textContent(), '2');
    await pagina.locator('#volumes').fill('4');
    await pagina.locator('#confirmarRevisao').check();
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('#preview .label').count(), 11);
    assert.equal(await pagina.locator('.sheet').count(), 2);
    const saida = process.env.QA_OUTPUT;
    if (saida) { await fs.mkdir(saida, { recursive: true }); await pagina.pdf({ path: path.join(saida, 'a4.pdf'), preferCSSPageSize: true }); }
    await pagina.locator('[data-formato="' + 'bobina' + '"]').evaluate(e => { e.closest('details').open = true; }); await pagina.locator('[data-formato="' + 'bobina' + '"]').click();
    assert.equal(await pagina.locator('.bobina-page').count(), 11);
    const dimensoes = await pagina.locator('.bobina-page').first().boundingBox();
    assert.ok(Math.abs(dimensoes.width - 100 * 96 / 25.4) < 1);
    assert.ok(Math.abs(dimensoes.height - 50 * 96 / 25.4) < 1);
    if (saida) { await pagina.pdf({ path: path.join(saida, 'bobina.pdf'), preferCSSPageSize: true }); await pagina.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.scrollTo(0, 0); }); await pagina.screenshot({ path: path.join(saida, 'desktop.png') }); }
    await pagina.setViewportSize({ width: 390, height: 844 });
    assert.ok(await pagina.locator('#btnUploadXML').isVisible());
    assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (saida) await pagina.screenshot({ path: path.join(saida, 'mobile.png') });
    const arquivo = await browser.newPage();
    arquivo.on('pageerror', e => erros.push(e.message));
    await arquivo.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
    await arquivo.locator('#xmlArquivos').setInputFiles(upload.slice(0, 1));
    await arquivo.locator('[data-revisar]').waitFor();
    await arquivo.locator('[data-revisar]').click();
    assert.equal(await arquivo.locator('#nf').inputValue(), '123');
    const cachesPermitidos = await pagina.evaluate(async () => {
      const cache = await caches.open('etiquetas-v63-pages');
      return (await cache.keys()).every(r => !new URL(r.url).pathname.startsWith('/api/'));
    });
    assert.equal(cachesPermitidos, true);
    const contextoCorrida = await browser.newContext({ serviceWorkers: 'block' });
    const corrida = await contextoCorrida.newPage();
    corrida.on('pageerror', e => erros.push(e.message));
    await corrida.goto(`http://127.0.0.1:${servidor.address().port}`);
    await corrida.locator('#btnIntegracao').click();
    await corrida.locator('#tokenIntegracao').fill(token);
    await corrida.locator('#btnConectar').click();
    await corrida.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    for (const alterarSelecao of [
      () => corrida.locator('#fonteIntegracao').selectOption('teste2'),
      () => corrida.locator('#buscaIntegracao').fill('novo filtro')
    ]) {
      let liberarResposta, sinalizarInicio;
      const iniciada = new Promise(resolve => { sinalizarInicio = resolve; });
      const liberada = new Promise(resolve => { liberarResposta = resolve; });
      await corrida.route('**/api/notas?**', async route => {
        sinalizarInicio();
        await liberada;
        await route.fulfill({ json: {
          notas: [{ id: 'a'.repeat(64), nf: 'ANTIGA', serie: '1', data: '2026-10-05', emitente: 'Fonte anterior', destinatario: 'Cliente fictício' }],
          total: 1, erros: [], limitado: false
        } });
      });
      await corrida.locator('#btnBuscarIntegracao').click();
      await iniciada;
      await alterarSelecao();
      liberarResposta();
      await corrida.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
      assert.equal(await corrida.locator('#resultadosIntegracao .import-card').count(), 0);
      assert.match(await corrida.locator('#statusIntegracao').textContent(), /alterados/);
      await corrida.unroute('**/api/notas?**');
    }
    await contextoCorrida.close();
    await require('./textos-etiqueta.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`, saida);
    await arquivo.locator('#btnManual').click();
    await arquivo.locator('#nf').fill('XSS');
    await arquivo.locator('#destinatario').fill('<img src=x onerror="window.injetado=true">');
    await arquivo.locator('#btnAdicionar').click();
    assert.equal(await arquivo.locator('#preview .shipping-text img').count(), 0);
    assert.equal(await arquivo.evaluate(() => Boolean(window.injetado)), false);
    await arquivo.evaluate(() => { localStorage.setItem('expedicao_empresas_v2', '{}'); localStorage.setItem('expedicao_notas_v1', '[{"volumes":-1}]'); });
    await arquivo.reload();
    assert.equal(await arquivo.locator('#countNotas').textContent(), '0');
    await arquivo.evaluate(() => {
      const nota = { nf: 'LEGADO', data: '2026-10-05', destinatario: 'Cliente\nRua Exemplo', volumes: 1 };
      localStorage.setItem('expedicao_notas_v1', JSON.stringify([
        nota,
        { ...nota, nf: 'INVALIDA', empresa: [] },
        { ...nota, nf: 'NORMALIZADA', descricao: {}, empresa: { nome: 'Remetente salvo', cidade: {}, logo: 'https://externo.example/logo.png' } }
      ]));
    });
    await arquivo.reload();
    assert.equal(await arquivo.locator('#countNotas').textContent(), '2');
    assert.match(await arquivo.locator('.label').nth(1).textContent(), /Remetente salvo/);
    assert.equal(await arquivo.locator('.label img').count(), 0);
    await arquivo.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException('Sem espaco', 'QuotaExceededError'); };
    });
    await arquivo.locator('#btnConfiguracoes').click();
    await arquivo.locator('#nomeEmpresa').fill('Empresa apenas na sessao');
    await arquivo.locator('#btnSalvarEmpresa').click();
    assert.match(await arquivo.locator('.toast.error').first().textContent(), /Não foi possível salvar/);
    assert.equal(await arquivo.locator('.toast.success').count(), 0);
    assert.deepEqual(erros, []);
    await require('./desktop-navegador.cjs')(browser, pasta);
    await require('./logo-cnpj.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    await require('./bobina85.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    await require('./disposicoes-papel.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    await require('./papel-padrao-navegador.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    await require('./grade-lista-navegador.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    await require('./topo-tagex-navegador.cjs')(browser, `http://127.0.0.1:${servidor.address().port}`);
    console.log('Navegador: manual, upload, revisão, duplicidade, remetentes, persistência, integração, troca de fonte/filtros durante busca, volumes ausentes, file://, mobile e impressão verificados.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
    if (path.resolve(pasta).startsWith(path.join(os.tmpdir(), 'etiquetas-browser-'))) await fs.rm(pasta, { recursive: true, force: true });
  }
}
testar().catch(e => { console.error(e); process.exitCode = 1; });
