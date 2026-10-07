const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
module.exports = async function testarBobina85(browser, url) {
  const contexto = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1400, height: 900 } });
  try {
    const pagina = await contexto.newPage();
    await pagina.goto(url);
    await pagina.locator('#nf').fill('123533');
    await pagina.locator('#destinatario').fill('CLIENTE DE TESTE\nRua Exemplo, 125\nCentro - Curitiba / PR\nCEP: 80000-000');
    await pagina.locator('#descricao').fill('Material para instalacao hidraulica; conexoes e tubos.');
    await pagina.locator('#volumes').fill('11');
    await pagina.locator('#btnAdicionar').click();
    await pagina.locator('#modoImpressao').selectOption('bobina85');
    assert.equal(await pagina.locator('.bobina-page').count(), 11);
    assert.equal(await pagina.locator('#avisoLayout').isVisible(), false);
    for (const media of ['screen', 'print']) {
      await pagina.emulateMedia({ media });
      for (const seletor of ['.label', '.bobina-page']) {
        const dimensoes = await pagina.locator(seletor).first().boundingBox();
        assert.ok(Math.abs(dimensoes.width - 85 * 96 / 25.4) < 1);
        assert.ok(Math.abs(dimensoes.height - 35 * 96 / 25.4) < 1);
      }
      assert.equal(await pagina.locator('.label').first().evaluate(e => [...e.querySelectorAll('.content-main,.content-grid,.right-box,.desc')].every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)), true);
    }
    assert.match(await pagina.locator('#print-page-rule').textContent(), /85mm 35mm/);
    for (const width of [1400, 321, 390]) {
      await pagina.setViewportSize({ width, height: 900 });
      const pdf = await pagina.pdf({ preferCSSPageSize: true, displayHeaderFooter: false });
      assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 11, `11 etiquetas devem gerar 11 paginas (viewport ${width})`);
      assert.equal(await pagina.locator('.preview-wrap').evaluate(el => getComputedStyle(el).padding), '0px');
    }
    await pagina.setViewportSize({ width: 1400, height: 900 });
    await pagina.emulateMedia({ media: 'screen' });
    const imagem = path.join(os.tmpdir(), 'etiquetas-bobina85-teste.png');
    await pagina.locator('.label').first().screenshot({ path: imagem });
    console.log(`Previa sintetica: ${imagem}`);
    await pagina.locator('#modoImpressao').selectOption('a4');
    assert.equal(await pagina.locator('.sheet').count(), 2);
    assert.ok(Math.abs((await pagina.locator('.label').first().boundingBox()).width - 100 * 96 / 25.4) < 1);
    assert.match(await pagina.locator('#print-page-rule').textContent(), /A4/);
    await pagina.emulateMedia({ media: 'print' });
    const pdfA4 = await pagina.pdf({ preferCSSPageSize: true });
    assert.equal((pdfA4.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 2);
    await pagina.emulateMedia({ media: 'screen' });
    await pagina.locator('#modoImpressao').selectOption('bobina');
    assert.ok(Math.abs((await pagina.locator('.label').first().boundingBox()).height - 50 * 96 / 25.4) < 1);
    await pagina.emulateMedia({ media: 'print' });
    const pdfBobina = await pagina.pdf({ preferCSSPageSize: true });
    assert.equal((pdfBobina.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 11);
    await pagina.emulateMedia({ media: 'screen' });
    await pagina.setViewportSize({ width: 390, height: 844 });
    await pagina.locator('#modoImpressao').selectOption('bobina85');
    assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    console.log('Bobina 85x35: medidas, texto, 11 volumes, mobile e retorno ao A4/100x50 verificados.');
  } finally { await contexto.close(); }
};
