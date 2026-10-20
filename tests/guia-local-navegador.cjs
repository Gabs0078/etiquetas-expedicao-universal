const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {xmlNota}=require('./ajudantes.cjs');
module.exports=async(browser,url)=>{
 const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 // A rede local continua acessível; toda conexão externa é bloqueada.
 await c.route('**/*',route=>new URL(route.request().url()).origin===new URL(url).origin?route.continue():route.abort());
 try{
  await p.goto(url);await p.getByRole('link',{name:'Instalar / usar offline'}).click();
  assert.match(await p.title(),/Instalar e usar offline/);assert.equal(await p.locator('#instalar .guide-steps li').count(),4);
  assert.match(await p.locator('#baixarWindows').getAttribute('href'),/releases\/download\/v0\.4\.0\/TagEX-Windows-0\.4\.0\.zip$/);
  assert.match(await p.locator('#offline').textContent(),/rede ou VPN/);
  for(const theme of ['dark','light']){
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#alternarTema').click();
   for(const width of [1440,768,390,320]){
    await p.setViewportSize({width,height:900});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Guia cabe '+theme+'/'+width);
   }
   if(process.env.QA_OUTPUT){await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await p.setViewportSize({width:1100,height:1100});await p.screenshot({path:path.join(process.env.QA_OUTPUT,'instalacao-'+theme+'.png'),fullPage:true});}
  }
  await p.getByRole('link',{name:'Voltar ao aplicativo'}).click();
  await p.locator('#nf').fill('OFFLINE');await p.locator('#destinatario').fill('Cliente Exemplo\nRua Local, 10');
  await p.locator('#btnAdicionar').click();assert.equal(await p.locator('#countNotas').textContent(),'1');
  await p.locator('#xmlArquivos').setInputFiles({name:'exemplo.xml',mimeType:'text/xml',buffer:Buffer.from(xmlNota())});
  await p.locator('[data-revisar]').click();await p.locator('#confirmarRevisao').check();await p.locator('#btnAdicionar').click();
  assert.equal(await p.locator('#countNotas').textContent(),'2');
  await p.reload();assert.equal(await p.locator('#countNotas').textContent(),'2');
  assert.deepEqual(errors,[]);
  console.log('Guia local: navegação, quatro passos, temas/mobile e manual/XML com internet bloqueada verificados.');
 }finally{await c.close();}
};
