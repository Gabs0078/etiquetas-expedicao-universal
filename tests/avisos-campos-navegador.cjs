const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {xmlNota}=require('./ajudantes.cjs');
module.exports=async function(browser,url){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 const input=id=>p.locator('#'+id),tip=id=>input('dicaCampo-'+id),warning=id=>input('botaoAviso-'+id);
 let sequencia=0;
 async function importXML(xml){const chave="3526100000000000010055001000000123112345"+String(++sequencia).padStart(4,"0");xml=xml.replaceAll("35261000000000000100550010000001231123456780",chave);await input('btnManual').click();await input('xmlArquivos').setInputFiles({name:'teste.xml',mimeType:'text/xml',buffer:Buffer.from(xml)});await p.waitForFunction(chave=>importacao.fila.some(n=>n.chave===chave),chave);await p.locator('[data-revisar]').last().click();}
 try{
  await p.goto(url);
  for(const xml of [xmlNota(),xmlNota().replace('</infNFe>','<infAdic><infCpl>ENTREGA R. DA ENTREGA DE TESTE, S/N - GALPAO DE TESTE; CIDADE EXEMPLO / PR; Vendedor: Exemplo</infCpl></infAdic></infNFe>')]){
   await importXML(xml);
   assert.equal(await p.locator('.field-attention:not([hidden])').count(),0,'XML preenchido corretamente não mostra avisos');
  }
  await importXML(xmlNota({volumes:''}));
  assert.equal(await p.locator('.review-box').count(),0);
  assert.match(await input('origemRevisao').textContent(),/XML · NF 123 · Série 1/);
  assert.equal(await input('volumes').inputValue(),'');assert(await warning('volumes').isVisible());
  assert.equal(await input('volumes').getAttribute('aria-invalid'),'true');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'volumes');
  assert.equal(await tip('volumes').isVisible(),false);
  assert.equal(await warning('volumes').locator('svg').count(),1);assert.equal(await warning('volumes').locator('svg').getAttribute('stroke-width'),'1.6');
  await warning('volumes').hover();assert(await tip('volumes').isVisible());assert.match(await tip('volumes').textContent(),/Informe o total de volumes/);
  await input('data').hover();await tip('volumes').waitFor({state:'hidden'});assert.equal(await tip('volumes').isVisible(),false);
  if(process.env.QA_OUTPUT){await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});for(const theme of ['dark','light']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await warning('volumes').hover();await tip('volumes').waitFor({state:'visible'});await input('etapaConferencia').screenshot({path:path.join(process.env.QA_OUTPUT,'volume-ausente-'+theme+'.png')});}}
  await warning('volumes').focus();assert(await tip('volumes').isVisible());await warning('volumes').press('Escape');assert.equal(await tip('volumes').isVisible(),false);
  await warning('volumes').click();assert.equal(await warning('volumes').getAttribute('aria-expanded'),'true');assert(await tip('volumes').isVisible());
  await input('data').click();assert.equal(await tip('volumes').isVisible(),false);
  await input('volumes').fill('0');assert(await warning('volumes').isVisible());
  await input('volumes').fill('2.5');assert(await warning('volumes').isVisible());
  await input('volumes').fill('1000');assert(await warning('volumes').isVisible());
  await input('volumes').fill('3');assert.equal(await warning('volumes').isVisible(),false);assert.equal(await input('volumes').getAttribute('aria-invalid'),'false');
  await input('confirmarRevisao').check();await input('descricao').fill('Item editado');assert.equal(await input('confirmarRevisao').isChecked(),false);
  await input('btnAdicionar').click();assert.equal(await input('countNotas').textContent(),'0');
  await input('confirmarRevisao').check();await input('btnAdicionar').click();assert.equal(await input('countNotas').textContent(),'1');
  assert.equal(await input('confirmacaoXML').isVisible(),false);assert.equal(await warning('nf').isVisible(),false);
  await importXML(xmlNota({semProtocolo:true}));
  assert(await warning('nf').isVisible());
  assert.match(await tip('nf').textContent(),/confirmar a autorização/);
  await input('nf').fill('999');assert.equal(await input('nf').getAttribute('aria-invalid'),'true');assert.match(await tip('nf').textContent(),/Use NF 123/);
  await input('nf').fill('123');
  await importXML(xmlNota().replace('</infNFe>','<infAdic><infCpl>ENTREGA: verificar com cliente</infCpl></infAdic></infNFe>'));
  assert.match(await tip('destinatario').textContent(),/Não foi possível identificar/g);
  await input('destinatario').fill('Rua informada, 42\nCidade / SP');assert.equal(await warning('destinatario').isVisible(),false);
  await input('usarEnderecoDestinatario').check();
  await importXML(xmlNota().replace('Item &amp; Exemplo','Produto '.repeat(40)));
  assert(await warning('descricao').isVisible());assert.match(await tip('descricao').textContent(),/encurtada/);
  await input('descricao').fill('Resumo corrigido');assert.equal(await warning('descricao').isVisible(),false);
  await importXML(xmlNota().replace('<UF>SP</UF><CEP>00000000</CEP></enderDest>','<CEP>00000000</CEP></enderDest>'));
  assert.match(await tip('destinatario').textContent(),/incompleto/);
  await importXML(xmlNota({entrega:'<entrega><xLgr>Rua Entrega</xLgr><nro>1</nro><xMun>Cidade</xMun><UF>SP</UF></entrega>'}).replace('</infNFe>','<infAdic><infCpl>ENTREGA R. DA ENTREGA DE TESTE, 10 - CIDADE EXEMPLO / PR</infCpl></infAdic></infNFe>'));
  assert.match(await tip('destinatario').textContent(),/dois lugares/);
  assert((await tip('destinatario').textContent()).length<120);
  for(const theme of ['light','dark']){
   await p.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   for(const width of [1440,390,320]){
    await p.setViewportSize({width,height:1000});
    await input('destinatario').focus();await warning('destinatario').focus();
    assert(await tip('destinatario').isVisible());
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const b=await tip('destinatario').boundingBox();assert(b.x>=0 && b.x+b.width<=width+1,'Tooltip cabe '+theme+'/'+width);
    await warning('destinatario').press('Escape');
   }
   if(process.env.QA_OUTPUT){await p.setViewportSize({width:1440,height:1000});await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await input('etapaConferencia').screenshot({path:path.join(process.env.QA_OUTPUT,'conferencia-'+theme+'.png')});}
  }
  await input('btnManual').click();await input('nf').fill('M1');await input('destinatario').fill('Rua manual');await input('volumes').fill('');await input('btnAdicionar').click();assert(await warning('volumes').isVisible());await input('volumes').fill('2');assert.equal(await warning('volumes').isVisible(),false);
  await input('btnAdicionar').click();assert.equal(await input('countNotas').textContent(),'2');
  await p.emulateMedia({media:'print'});assert.equal(await input('etapaConferencia').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('Conferência: alertas por campo, correção de volumes, endereço incerto, autorização, confirmação, teclado/toque, temas e larguras verificados.');
 }finally{await context.close();}
};
