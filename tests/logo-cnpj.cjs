const assert = require('node:assert/strict');
const { xmlNota } = require('./ajudantes.cjs');
module.exports = async function testarLogo(browser, url) {
  const contexto = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const pagina = await contexto.newPage();
    await pagina.goto(url);
    await pagina.locator('#xmlArquivos').setInputFiles({ name: 'nota.xml', mimeType: 'text/xml', buffer: Buffer.from(xmlNota()) });
    await pagina.locator('[data-revisar]').click();
    await pagina.locator('#confirmarRevisao').check();
    await pagina.locator('#btnAdicionar').click();
    assert.equal(await pagina.locator('.label img').count(), 0);
    await pagina.locator('#btnConfiguracoes').click();
    await pagina.locator('#cnpjEmpresa').fill('11.111.111/0001-11');
    await pagina.locator('#logoEmpresa').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    await pagina.waitForFunction(() => document.querySelector('#logoPreview').getAttribute('src')?.startsWith('data:image/png'));
    await pagina.locator('#btnSalvarEmpresa').click();
    assert.equal(await pagina.locator('.label img').count(), 0);
    await pagina.locator('#tamanhoLogo').fill('60');
    await pagina.locator('#tamanhoLogo').dispatchEvent('input');
    assert.equal(await pagina.locator('#valorTamanhoLogo').textContent(), '60%');
    await pagina.locator('#cnpjEmpresa').fill('00.000.000/0001-00');
    await pagina.locator('#btnSalvarEmpresa').click();
    await pagina.locator('#btnFecharConfiguracoes').click();
    assert.equal(await pagina.locator('.label img').count(), 5);
    assert.match(await pagina.locator('.label').first().textContent(), /Empresa Fictícia/);
    await pagina.reload();
    assert.equal(await pagina.locator('.label img').count(), 5);
    assert.equal(await pagina.locator('.label img').first().getAttribute('data-logo-tamanho'), '60');
    await pagina.locator('#btnConfiguracoes').click();
    assert.equal(await pagina.locator('#tamanhoLogo').inputValue(), '60');
    await pagina.locator('#btnRestaurarLogo').click();
    assert.equal(await pagina.locator('#tamanhoLogo').inputValue(), '100');
    await pagina.locator('#tamanhoLogo').fill('300');
    await pagina.locator('#tamanhoLogo').dispatchEvent('input');
    await pagina.locator('#btnSalvarEmpresa').click();
    await pagina.locator('#btnFecharConfiguracoes').click();
    await pagina.waitForFunction(() => [...document.querySelectorAll('.label-logo')].every(img => img.complete && img.naturalWidth));
    assert.equal(await pagina.locator('.label-logo').first().getAttribute('data-logo-tamanho'), '300');
    for (const mode of ['a4','bobina80','bobina85','bobina']) {
      await pagina.locator('[data-formato="' + mode + '"]').evaluate(e => { e.closest('details').open = true; }); await pagina.locator('[data-formato="' + mode + '"]').click();
      await pagina.waitForFunction(() => [...document.querySelectorAll('.label-logo')].every(img => img.complete && img.naturalWidth));
      assert.ok(await pagina.locator('.label-logo').first().evaluate(img => {
        const r=img.getBoundingClientRect(), b=img.parentElement.getBoundingClientRect();
        return r.width<=b.width+.5 && r.height<=b.height+.5 && Math.abs(r.width/r.height-img.naturalWidth/img.naturalHeight)<.02;
      }));
    }
    await pagina.reload();
    assert.equal(await pagina.locator('.label-logo').first().getAttribute('data-logo-tamanho'), '300');
    console.log('Logo: notas existentes atualizadas por CNPJ, sem alterar remetente; recarga verificada.');
  } finally { await contexto.close(); }
};
