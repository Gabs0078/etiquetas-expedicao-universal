const assert = require('node:assert/strict');
const path = require('node:path');

module.exports = async function testarTextosEtiquetas(browser, url, saida) {
  const contexto = await browser.newContext({ serviceWorkers: 'block' });
  const pagina = await contexto.newPage({ viewport: { width: 1600, height: 1000 } });
  try {
    await pagina.goto(url);
    assert.equal(await pagina.locator('#exibirData').isChecked(), false);
    assert.equal(await pagina.locator('#exibirDescricao').isChecked(), true);
    await pagina.locator('#exibirData').check();
    await pagina.locator('#nomeEmpresa').fill('EMPRESA FICTICIA DE MATERIAIS PARA CONSTRUCAO LTDA');
    await pagina.locator('#enderecoEmpresa').fill('RUA DE DEMONSTRACAO, 1396, LOJA 1 E 2');
    await pagina.locator('#btnSalvarEmpresa').click();
    const descricao = ('CAIXA SUBTERRANEA EM PP PARA HIDROMETRO 3/4 DE PASSEIO GRANDE; HIDROMETRO UNIJATO RESIDENCIAL AGUA FRIA CORPO METALICO; TUBETE BRANCO PARA INSTALACAO HIDRAULICA; ').repeat(2).slice(0, 180);
    await pagina.locator('#nf').fill('5371');
    await pagina.locator('#destinatario').fill('CLIENTE FICTICIO DE CONSTRUCOES CIVIS LTDA\nRUA DE TESTE PARA EXPEDICAO, 365\nBAIRRO DE EXEMPLO - Curitiba / PR\nCEP: 82515-385');
    await pagina.locator('#descricao').fill(descricao);
    await pagina.locator('#btnAdicionar').click();
    const medir = () => pagina.locator('.label').first().evaluate(etiqueta => {
      const limite = etiqueta.getBoundingClientRect().bottom - parseFloat(getComputedStyle(etiqueta).paddingBottom) - parseFloat(getComputedStyle(etiqueta).borderBottomWidth);
      return [...etiqueta.querySelectorAll('.content-main,.content-grid,.right-box,.desc')].every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().bottom <= limite + 1);
    });
    for (const modo of ['a4', 'bobina']) {
      await pagina.locator('#modoImpressao').selectOption(modo);
      assert.equal(await pagina.locator('.desc-text').textContent(), descricao.trim());
      const dimensoes = await pagina.locator('.label').first().evaluate(e => [...e.querySelectorAll('.content-main,.content-grid,.right-box,.desc')].map(el => ({classe: el.className, altura: [el.clientHeight, el.scrollHeight], largura: [el.clientWidth, el.scrollWidth], fonte: getComputedStyle(el).fontSize})));
      assert.equal(await pagina.locator('#avisoLayout').isVisible(), false, JSON.stringify(dimensoes));
      assert.equal(await medir(), true, `Texto cortado na prévia ${modo}`);
      await pagina.emulateMedia({ media: 'print' });
      assert.equal(await medir(), true, `Texto cortado na impressão ${modo}`);
      if (saida) await pagina.pdf({ path: path.join(saida, `descricao-${modo}.pdf`), preferCSSPageSize: true });
      await pagina.emulateMedia({ media: 'screen' });
    }
    await pagina.locator('#exibirData').uncheck();
    await pagina.locator('#exibirDescricao').uncheck();
    assert.equal(await pagina.locator('.date-line,.desc').count(), 0);
    await pagina.reload();
    assert.equal(await pagina.locator('#exibirData').isChecked(), false);
    assert.equal(await pagina.locator('#exibirDescricao').isChecked(), false);
    assert.equal(await pagina.locator('.date-line,.desc').count(), 0);
    await pagina.locator('#exibirData').check();
    await pagina.locator('#exibirDescricao').check();
    assert.equal(await pagina.locator('.date-line').count(), 1);
    assert.equal(await pagina.locator('.desc-text').textContent(), descricao.trim());
    await pagina.locator('#nf').fill('EXCESSO');
    await pagina.locator('#destinatario').fill('Cliente fictício\nRua Exemplo, 10');
    await pagina.locator('#descricao').fill(Array(30).fill('LINHA QUE EXCEDE O ESPACO DA ETIQUETA').join('\n'));
    await pagina.locator('#btnAdicionar').click();
    assert.match(await pagina.locator('#avisoLayout').textContent(), /EXCESSO/);
    await pagina.evaluate(() => { window.tentouImprimir = false; window.print = () => { window.tentouImprimir = true; }; });
    await pagina.locator('#btnImprimir').click();
    assert.equal(await pagina.evaluate(() => window.tentouImprimir), false);
    console.log('Texto: descrição de 180 caracteres e endereço longo cabem em prévia/impressão A4 e bobina; excesso bloqueia o botão de impressão.');
  } finally { await contexto.close(); }
};
