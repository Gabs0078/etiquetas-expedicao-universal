const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { DOMParser } = require('@xmldom/xmldom');
const { lerXML } = require('../assets/js/nfe.js');
const { criarServidor } = require('../integracao/servidor.cjs');

async function testar() {
  const config = JSON.parse(await fs.readFile(path.join(process.env.LOCALAPPDATA, 'EtiquetasExpedicao/config.json'), 'utf8'));
  assert.equal(config.fontes[0].pastas.length, 4);
  const amostras = new Map();
  for (const pasta of config.fontes[0].pastas) {
    let lidos = 0;
    for (const arquivo of await fs.readdir(pasta)) {
      if (!/\.xml$/i.test(arquivo) || ++lidos > 30) continue;
      try {
        const buffer = await fs.readFile(path.join(pasta, arquivo));
        const nota = lerXML(new TextDecoder('utf-8', { fatal: true }).decode(buffer), DOMParser);
        if (['1', '2'].includes(nota.serie) && !amostras.has(nota.serie)) amostras.set(nota.serie, { nota, buffer });
      } catch { }
    }
  }
  assert.equal(amostras.size, 2, 'Amostras das duas series nao encontradas.');
  console.log('Configuracao: quatro pastas acessiveis e amostras das series 1 e 2.');
  const { servidor, token } = criarServidor(config, { desktop: true });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const perfil = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-homologacao-'));
  let contexto;
  const erros = [];
  const abrir = async () => {
    contexto = await chromium.launchPersistentContext(perfil, { headless: true });
    await contexto.addInitScript(() => { window.print = () => { throw new Error('Impressao fisica desativada no teste'); }; });
    const pagina = await contexto.newPage();
    pagina.setDefaultTimeout(15000);
    pagina.on('pageerror', erro => erros.push(erro.message));
    pagina.on('dialog', dialogo => dialogo.accept());
    const { caminho } = await (await fetch(`${base}/api/sessao`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).json();
    await pagina.goto(base + caminho, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
    return pagina;
  };
  try {
    let pagina = await abrir();
    const buscar = async texto => {
      await pagina.locator('#buscaIntegracao').fill(texto);
      const inicio = Date.now();
      const resposta = pagina.waitForResponse(r => new URL(r.url()).pathname === '/api/notas', { timeout: 120000 });
      await pagina.locator('#btnBuscarIntegracao').click();
      const dados = await (await resposta).json();
      await pagina.waitForFunction(() => !document.querySelector('#btnBuscarIntegracao').disabled);
      assert.equal(dados.limitado, false, 'Busca incompleta por limite de leitura ou resultados.');
      console.log(`Busca real: ${dados.notas.length} resultado(s), ${Math.round((Date.now() - inicio) / 1000)}s.`);
      return dados;
    };
    const sequencia = await buscar('533');
    assert.ok(sequencia.notas.length);
    assert.ok(sequencia.notas.every(n => n.nf.includes('533')));
    for (const serie of ['1', '2']) {
      const dados = await buscar(amostras.get(serie).nota.chave);
      assert.ok(dados.notas.some(n => n.serie === serie));
    }
    console.log('Busca: sequencia 533 e notas conhecidas das series 1 e 2 verificadas.');
    const revisaoIntegrada = pagina.waitForFunction(() => document.querySelectorAll('[data-revisar]').length > 0, null, { timeout: 90000 });
    await pagina.locator('[data-importar-id]').first().click();
    await revisaoIntegrada;
    await pagina.locator('[data-descartar]').click();
    console.log('Integracao: nota trazida do compartilhamento para revisao.');
    await pagina.locator('#nomeEmpresa').fill('Empresa de homologacao');
    await pagina.locator('#btnSalvarEmpresa').click();
    for (const [serie, volumes] of [['1', 3], ['2', 8]]) {
      await pagina.locator('#xmlArquivos').setInputFiles({ name: `amostra-serie-${serie}.xml`, mimeType: 'text/xml', buffer: amostras.get(serie).buffer });
      await pagina.locator('[data-revisar]').click();
      await pagina.locator('#volumes').fill(String(volumes));
      await pagina.locator('#btnAdicionar').click();
      assert.equal(await pagina.locator('#countNotas').textContent(), serie === '1' ? '0' : '1');
      await pagina.locator('#confirmarRevisao').check();
      await pagina.locator('#btnAdicionar').click();
    }
    assert.equal(await pagina.locator('.label').count(), 11);
    assert.equal(await pagina.locator('.sheet').count(), 2);
    assert.deepEqual(await pagina.locator('.volume-number').allTextContents(), ['1/3', '2/3', '3/3', '1/8', '2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8']);
    await pagina.locator('#xmlArquivos').setInputFiles({ name: 'repetida.xml', mimeType: 'text/xml', buffer: amostras.get('1').buffer });
    await pagina.waitForFunction(() => document.querySelector('#statusImportacao').textContent.includes('duplicada'));
    assert.equal(await pagina.locator('[data-revisar]').count(), 0);
    for (const modo of ['a4', 'bobina']) {
      await pagina.locator('[data-formato="' + modo + '"]').evaluate(e => { e.closest('details').open = true; }); await pagina.locator('[data-formato="' + modo + '"]').click();
      await pagina.emulateMedia({ media: 'print' });
      const dimensoes = await pagina.locator('.label').first().boundingBox();
      assert.ok(Math.abs(dimensoes.width - 100 * 96 / 25.4) < 1);
      assert.ok(Math.abs(dimensoes.height - 50 * 96 / 25.4) < 1);
      const cabem = await pagina.evaluate(() => [...document.querySelectorAll('.content-main,.content-grid,.right-box,.desc')].every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1));
      console.log(`Previa real ${modo}: ${cabem ? 'textos cabem' : 'texto excedido; revisar aviso de layout'}.`);
      if (!cabem) assert.equal(await pagina.locator('#avisoLayout').getAttribute('hidden'), null);
      if (modo === 'bobina') assert.equal(await pagina.locator('.bobina-page').count(), 11);
      await pagina.emulateMedia({ media: 'screen' });
    }
    await contexto.close(); contexto = null;
    pagina = await abrir();
    assert.equal(await pagina.locator('.label').count(), 11);
    assert.equal(await pagina.locator('#nomeEmpresa').inputValue(), 'Empresa de homologacao');
    assert.deepEqual(erros, []);
    console.log('Revisao, duplicidade, 11 volumes, A4/bobina e persistencia apos fechar o navegador: verificados.');
  } finally {
    if (contexto) await contexto.close();
    await new Promise(resolve => servidor.close(resolve));
    if (path.dirname(perfil) === os.tmpdir() && path.basename(perfil).startsWith('etiquetas-homologacao-')) await fs.rm(perfil, { recursive: true, force: true });
  }
}
testar().catch(erro => { console.error(erro.message); process.exitCode = 1; });
