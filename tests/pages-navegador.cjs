const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {preparar,arquivos}=require('../scripts/preparar-pages.cjs');
const {xmlNota}=require('./ajudantes.cjs');
module.exports=async function(browser){
 const stage=await fs.mkdtemp(path.join(os.tmpdir(),'tagex-pages-'));await preparar(stage);
 const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.replace(/^\/etiquetas-expedicao-universal\//,'')||'index.html';
  if(!arquivos.includes(name)){res.writeHead(404,{'Content-Type':'text/html'});return res.end('Not Found')}
  const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webmanifest')?'application/manifest+json':name.endsWith('.png')?'image/png':'text/html';
  res.writeHead(200,{'Content-Type':type});res.end(await fs.readFile(path.join(stage,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const c=await browser.newContext(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  const base='http://127.0.0.1:'+server.address().port+'/etiquetas-expedicao-universal/';
  await p.goto(base);assert.match(await p.title(),/TagEX/);
  assert.equal(await fs.readdir(stage).then(a=>a.includes('integracao')),false);
  await p.locator('#nf').fill('PUBLICO');await p.locator('#destinatario').fill('Cliente Exemplo\nRua Teste, 1');await p.locator('#volumes').fill('2');await p.locator('#btnAdicionar').click();assert.equal(await p.locator('#preview .label').count(),2);
  await p.locator('#xmlArquivos').setInputFiles({name:'ficticia.xml',mimeType:'text/xml',buffer:Buffer.from(xmlNota())});await p.locator('[data-revisar]').click();await p.locator('#confirmarRevisao').check();await p.locator('#btnAdicionar').click();assert.equal(await p.locator('#countNotas').textContent(),'2');
  await p.evaluate(()=>navigator.serviceWorker.ready);
  await p.reload();assert.equal(await p.locator('#countNotas').textContent(),'2');
  await c.setOffline(true);await p.reload();assert.equal(await p.locator('#countNotas').textContent(),'2');await c.setOffline(false);
  assert.deepEqual(errors,[]);console.log('Pages: artefato estático, subpasta, manual, XML, assets, recarga e cache offline verificados.');
 }finally{await c.close();await new Promise(r=>server.close(r));if(path.resolve(stage).startsWith(path.join(os.tmpdir(),'tagex-pages-')))await fs.rm(stage,{recursive:true,force:true});}
};
