const assert=require('node:assert/strict');
const {criarServidor}=require('../integracao/servidor.cjs');
module.exports=async function(browser){
 const {servidor}=criarServidor();await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+servidor.address().port;
 const contexto=await browser.newContext();const p=await contexto.newPage();
 try{
  for(const color of ['black','white']){
   const resposta=await contexto.request.get(base+'/assets/icons/github-invertocat-'+color+'.svg');
   assert.equal(resposta.status(),200);assert.match(resposta.headers()['content-type'],/image\/svg\+xml/);
  }
  await p.goto(base);
  await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  for(let n=0;n<3;n++){
   await p.reload();
   assert.equal(await p.locator('.app-footer').count(),1);
   for(const theme of ['light','dark']){
    if (await p.locator('html').getAttribute('data-theme') !== theme) await p.locator('#temaAparencia').click();
    const img=p.locator('.github-mark-'+theme);assert(await img.isVisible());
    await img.evaluate(i=>i.decode());assert(await img.evaluate(i=>i.naturalWidth>0));
   }
  }
  await contexto.setOffline(true);await p.reload();assert.equal(await p.locator('.app-footer').count(),1);
  await p.locator('.github-mark-dark').evaluate(i=>i.decode());
  console.log('Rodapé/SVG: HTTP, três recargas com service worker, temas e offline verificados.');
 }finally{await contexto.close();await new Promise(r=>servidor.close(r))}
};
