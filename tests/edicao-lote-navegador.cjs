const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {xmlNota} = require('./ajudantes.cjs');
module.exports = async function(browser, url) {
 const context = await browser.newContext({serviceWorkers:'block', viewport:{width:1440,height:1000}});
 const p = await context.newPage(), errors = [];
 p.on('pageerror', e => errors.push(e.message));
 let aceitar = true;
 p.on('dialog', d => aceitar ? d.accept() : d.dismiss());
 const campo = id => p.locator('#'+id);
 const notas = () => p.evaluate(() => JSON.parse(localStorage.getItem('expedicao_notas_v1')));
 const editar = i => p.locator('[data-editar-nota="'+i+'"]').click();
 async function adicionar(nf, volumes='1') {
  await campo('nf').fill(nf);await campo('destinatario').fill('Cliente Exemplo\nRua Teste, 10');
  await campo('volumes').fill(volumes);await campo('btnAdicionar').click();
 }
 try {
  await p.goto(url);
  await adicionar('101','2');await adicionar('102');
  const original = (await notas())[0];
  await editar(0);
  assert.equal(await campo('nf').inputValue(),'101');
  assert.equal(await campo('destinatario').inputValue(),original.destinatario);
  assert.equal(await campo('btnAdicionar').textContent(),'Salvar alterações');
  assert(await campo('edicaoNota').isVisible());assert(await campo('btnImprimir').isDisabled());
  await campo('volumes').fill('3');await campo('destinatario').fill('Cliente Exemplo\nRua Nova, 20');
  await campo('descricao').fill('Volumes atualizados');await campo('data').fill('2026-10-15');await campo('nf').fill('101-A');
  assert.deepEqual((await notas())[0],original,'Rascunho não altera o lote');
  // A empresa selecionada depois da inclusão não pode substituir o remetente da nota salva.
  await p.evaluate(() => {state.empresas.push({...state.empresas[0], id:'outra',nome:'Outra Empresa'});state.empresaAtivaId='outra';});
  await campo('btnAdicionar').click();
  let lote = await notas();assert.equal(lote.length,2);assert.equal(lote[0].nf,'101-A');assert.equal(lote[0].volumes,3);
  assert.equal(lote[0].data,'2026-10-15');assert.equal(lote[0].descricao,'Volumes atualizados');assert.deepEqual(lote[0].empresa,original.empresa);
  assert.equal(await p.locator('#preview .label').count(),4);assert.match(await campo('summary').textContent(),/Total de etiquetas: 4/);
  assert.match(await p.locator('#preview .shipping-text').first().textContent(),/Rua Nova, 20/);
  assert.equal(await campo('edicaoNota').isVisible(),false);assert.equal(await campo('btnImprimir').isDisabled(),false);
  await editar(0);await campo('volumes').fill('0');await campo('btnAdicionar').click();assert.equal((await notas())[0].volumes,3);
  assert.equal(await campo('volumes').getAttribute('aria-invalid'),'true');await campo('btnCancelarEdicao').click();assert.equal((await notas())[0].volumes,3);
  // Referência à nota sobrevive à exclusão de outra linha; cancelar não salva o rascunho.
  await editar(1);await campo('descricao').fill('Não salvar');await campo('btnCancelarEdicao').click();assert.equal((await notas())[1].descricao,'');
  await editar(1);await p.locator('[data-remover-nota="0"]').click();await campo('volumes').fill('2');await campo('btnAdicionar').click();
  assert.equal((await notas()).length,1);assert.equal((await notas())[0].nf,'102');assert.equal((await notas())[0].volumes,2);
  await p.reload();assert.equal((await notas())[0].volumes,2);assert.equal(await campo('edicaoNota').isVisible(),false);
  // A chave e os metadados do XML são preservados; a NF não perde seu vínculo.
  await campo('xmlArquivos').setInputFiles({name:'ficticia.xml',mimeType:'text/xml',buffer:Buffer.from(xmlNota())});
  await p.locator('[data-revisar]').click();await campo('confirmarRevisao').check();await campo('btnAdicionar').click();
  const importada=(await notas())[1];await editar(1);assert(await campo('nf').evaluate(e=>e.readOnly));
  await campo('destinatario').fill('Cliente Fictício\nRua Entrega, 30');await campo('volumes').fill('4');await campo('btnAdicionar').click();
  lote=await notas();for(const key of ['chave','serie','origem','dataEmissao','empresa','nf'])assert.deepEqual(lote[1][key],importada[key]);
  assert.equal(lote[1].volumes,4);
  // Protege o rascunho ao trocar de nota ou voltar ao manual.
  await editar(0);await campo('descricao').fill('Rascunho');aceitar=false;await editar(1);assert.equal(await campo('nf').inputValue(),'102');
  await campo('btnManual').click();assert(await campo('edicaoNota').isVisible());aceitar=true;
  await campo('btnManual').click();assert.equal(await campo('edicaoNota').isVisible(),false);assert.equal(await campo('nf').evaluate(e=>e.readOnly),false);
  // Abrir outro XML encerra a edição e volta a exigir a conferência da importação.
  await editar(0);
  const outroXML=xmlNota().replaceAll('35261000000000000100550010000001231123456780','35261000000000000100550010000001241123456780').replace('<nNF>123</nNF>','<nNF>124</nNF>');
  await campo('xmlArquivos').setInputFiles({name:'outra.xml',mimeType:'text/xml',buffer:Buffer.from(outroXML)});await p.locator('[data-revisar]').click();
  assert.equal(await campo('edicaoNota').isVisible(),false);assert(await campo('confirmacaoXML').isVisible());assert.equal(await campo('nf').inputValue(),'124');
  await campo('btnAdicionar').click();assert.equal((await notas()).length,2);await campo('btnCancelarRevisao').click();
  await editar(1);await p.locator('[data-remover-nota="1"]').click();assert.equal(await campo('edicaoNota').isVisible(),false);assert.equal(await campo('nf').inputValue(),'');
  // Os limites consideram a substituição, sem somar a nota antiga outra vez.
  await p.evaluate(() => {const base=state.notas[0];state.notas=Array.from({length:100},(_,i)=>({...base,nf:String(1000+i),volumes:1}));renderizar();});
  await editar(99);await campo('descricao').fill('Atualização no limite de notas');await campo('btnAdicionar').click();assert.equal((await notas()).length,100);assert.equal((await notas())[99].descricao,'Atualização no limite de notas');
  await p.evaluate(() => {window.__renderizarEdicaoTeste=renderizar;renderizar=salvarNotas;const base=state.notas[0];state.notas=[{...base,volumes:999},{...base,nf:'2001',volumes:999},{...base,nf:'2002',volumes:999},{...base,nf:'2003',volumes:3}];salvarNotas();});
  // Evita renderizar 3.000 folhas no teste: o formulário executa a mesma validação antes de salvar.
  await p.evaluate(() => {editarNota(0);});await campo('volumes').fill('999');await campo('btnAdicionar').click();assert.equal((await notas())[0].volumes,999);
  await p.evaluate(() => {editarNota(3);});await campo('volumes').fill('4');await campo('btnAdicionar').click();assert.equal((await notas())[3].volumes,3);assert(await campo('edicaoNota').isVisible());
  await campo('btnCancelarEdicao').click();
  // Layout dos dois ícones no celular e nas duas aparências.
  await p.evaluate(() => {renderizar=window.__renderizarEdicaoTeste;delete window.__renderizarEdicaoTeste;state.notas=state.notas.slice(3);renderizar();});
  await p.waitForFunction(() => document.querySelectorAll('.toast').length === 0);
  await p.setViewportSize({width:390,height:844});
  for(const theme of ['light','dark']) {
   await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await editar(0);
   const actions=p.locator('.note-actions').first(), box=await actions.boundingBox();assert(box.x>=0&&box.x+box.width<=390);
   assert.equal(await actions.locator('button svg').count(),2);
   if(process.env.QA_OUTPUT) {await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await campo('etapaConferencia').screenshot({path:path.join(process.env.QA_OUTPUT,'editar-nota-'+theme+'.png')});await campo('btnCancelarEdicao').click();await campo('listaNotas').screenshot({path:path.join(process.env.QA_OUTPUT,'acoes-nota-'+theme+'.png')});}
   else await campo('btnCancelarEdicao').click();
  }
  assert.deepEqual(errors,[]);
  console.log('Lote: editar/salvar/cancelar, remetente e XML, exclusão, persistência, limites e ícones responsivos verificados.');
 } finally {await context.close();}
};
