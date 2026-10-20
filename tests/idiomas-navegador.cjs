const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {xmlNota}=require('./ajudantes.cjs');
module.exports=async(browser,url)=>{
 const c=await browser.newContext({locale:'en-US',serviceWorkers:'block',viewport:{width:1440,height:1000}}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 try{
  await p.goto(url);assert.equal(await p.locator('html').getAttribute('lang'),'en');assert.match(await p.locator('#btnImprimir').textContent(),/Print labels/);
  await p.locator('#nf').fill('LANG');await p.locator('#destinatario').fill('Data\nRua Exemplo, 20');await p.locator('#descricao').fill('Empresa · 地址 · Español');await p.locator('#btnAdicionar').click();
  const labels=await p.locator('#preview').textContent(),stored=await p.evaluate(()=>localStorage.getItem('expedicao_notas_v1'));
  const captions={'en':'Print labels','pt-BR':'Imprimir Etiquetas','es':'Imprimir etiquetas','zh-Hans':'打印标签'};
  for(const lang of ['pt-BR','es','zh-Hans','en']){
   await p.locator('#idiomaInterface').selectOption(lang);assert.equal(await p.locator('html').getAttribute('lang'),lang);assert.match(await p.locator('#btnImprimir').textContent(),new RegExp(captions[lang]));
   assert.equal(await p.locator('#preview').textContent(),labels,'Printed data and captions are independent from UI language');
   assert.equal(await p.evaluate(()=>localStorage.getItem('expedicao_notas_v1')),stored);
   await p.setViewportSize({width:320,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Layout fits '+lang);
   await p.setViewportSize({width:1440,height:1000});
   if(process.env.QA_OUTPUT){await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await p.screenshot({path:path.join(process.env.QA_OUTPUT,'idioma-'+lang+'.png'),fullPage:true});}
  }
  await p.locator('[data-editar-nota="0"]').click();await p.locator('#destinatario').fill('Rascunho 保留');await p.locator('#idiomaInterface').selectOption('es');
  assert.equal(await p.locator('#destinatario').inputValue(),'Rascunho 保留');assert(await p.locator('#edicaoNota').isVisible());assert.match(await p.locator('#btnAdicionar').textContent(),/Guardar cambios/);
  await p.locator('#btnCancelarEdicao').click();
  await p.locator('#xmlArquivos').setInputFiles({name:'test.xml',mimeType:'text/xml',buffer:Buffer.from(xmlNota())});
  await p.locator('[data-revisar]').click();await p.locator('#confirmarRevisao').check();await p.locator('#idiomaInterface').selectOption('zh-Hans');
  assert(await p.locator('#confirmarRevisao').isChecked());assert.match(await p.locator('#destinatario').inputValue(),/Cliente Fictício/);
  await p.reload();assert.equal(await p.locator('#idiomaInterface').inputValue(),'zh-Hans');assert.equal(await p.locator('#countNotas').textContent(),'1');
  assert.deepEqual(errors,[]);console.log('Languages: English default, four locales, persistence, drafts/XML preserved, fixed print language and mobile verified.');
 }finally{await c.close();}
};
