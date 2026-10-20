const assert=require('node:assert/strict');
const {criarServidor}=require('../integracao/servidor.cjs');
module.exports=async(browser)=>{
 const {servidor,token}=criarServidor({fontes:[]},{desktop:true});
 await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+servidor.address().port,c=await browser.newContext(),p=await c.newPage();
 try{
  const {caminho}=await (await fetch(base+'/api/sessao',{method:'POST',headers:{Authorization:'Bearer '+token}})).json();
  await p.goto(base+caminho);
  await p.waitForFunction(()=>document.getElementById('acessoIntegracao').hidden);
  assert.equal(await p.locator('#btnManual').getAttribute('aria-pressed'),'true','Sem pastas, continua no modo manual');
  assert.equal(await p.locator('#painelIntegracao').evaluate(e=>e.open),false);
  await p.locator('#btnIntegracao').click();
  assert(await p.locator('#btnAssistenteIntegracao').isVisible());
  await p.locator('#btnAssistenteIntegracao').click();
  const controle=await (await fetch(base+'/api/controle',{headers:{Authorization:'Bearer '+token}})).json();
  assert.equal(controle.abrirAssistente,true);
  console.log('Primeiro uso: integração opcional, manual preservado e assistente disponível depois.');
 }finally{await c.close();await new Promise(r=>servidor.close(r));}
};
