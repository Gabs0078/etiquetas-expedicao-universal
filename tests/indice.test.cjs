const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {criarIndice}=require('../integracao/fontes/indice.cjs');
const {xmlNota}=require('./ajudantes.cjs');
test('índice em disco persiste, reaproveita XMLs iguais e detecta alterações, inclusão e exclusão',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'etiquetas-indice-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const pasta=path.join(dir,'xml');await fs.mkdir(pasta);
 const a=path.join(pasta,'a.xml');await fs.writeFile(a,xmlNota());await fs.writeFile(path.join(pasta,'invalido.xml'),'<evento/>');
 const config={id:'teste',pastas:[pasta]};
 let indice=criarIndice(config,path.join(dir,'db'));
 await indice.atualizar();assert.equal(indice.progresso().total,2);assert.equal(indice.progresso().processados,2);
 assert.equal((await indice.pesquisar({busca:'123'})).total,1);
 assert.equal((await indice.pesquisar()).erros.length,1);
 await indice.fechar();
 indice=criarIndice(config,path.join(dir,'db'));
 try{
  assert.equal(indice.progresso().pronto,true);
  const read=fs.readFile.bind(fs);
  const mock=t.mock.method(fs,'readFile',(...args)=>{if(String(args[0]).endsWith('.xml'))throw Error('XML inalterado não deve ser relido');return read(...args)});
  await indice.atualizar();assert.equal((await indice.pesquisar()).total,1);assert.equal(mock.mock.callCount(),0);mock.mock.restore();
  const r=await indice.pesquisar();
  await fs.writeFile(a,xmlNota({volumes:'<vol><qVol>7</qVol></vol>'}));
  assert.equal((await indice.obter(r.notas[0].id)).volumes,7); // relê mesmo antes de atualizar índice
  await indice.atualizar();assert.equal((await indice.pesquisar()).notas[0].volumes,7);
  await fs.writeFile(path.join(pasta,'b.xml'),xmlNota().replaceAll('000000123','000000124').replace('<nNF>123','<nNF>124'));
  await indice.atualizar();assert.equal((await indice.pesquisar({busca:'124'})).total,1);
  await fs.unlink(a);await indice.atualizar();assert.equal((await indice.pesquisar({busca:'123'})).total,0);
 }finally{await indice.fechar()}
});
test('pasta indisponível preserva índice salvo, mas não permite importar XML inacessível',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'etiquetas-indice-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const pasta=path.join(dir,'xml');await fs.mkdir(pasta);await fs.writeFile(path.join(pasta,'a.xml'),xmlNota());
 const indice=criarIndice({id:'teste',pastas:[pasta]},path.join(dir,'db'));
 try{
  await indice.atualizar();const r=await indice.pesquisar();const movida=path.join(dir,'fora');await fs.rename(pasta,movida);
  await indice.atualizar();assert.equal(indice.progresso().desatualizado,true);
  assert.equal((await indice.pesquisar()).total,1);assert.equal(await indice.obter(r.notas[0].id),null);
  await fs.rename(movida,pasta);await fs.writeFile(path.join(pasta,'a.xml'),xmlNota({status:'101'}));
  await indice.atualizar();assert.equal((await indice.pesquisar()).total,0);
 }finally{await indice.fechar()}
});
test('índice filtra número, chave, cliente e datas sem expor caminhos',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'etiquetas-indice-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const pasta=path.join(dir,'xml');await fs.mkdir(pasta);await fs.writeFile(path.join(pasta,'a.xml'),xmlNota());
 const indice=criarIndice({id:'teste',pastas:[pasta]},path.join(dir,'db'));
 try{
  await indice.atualizar();
  const r=await indice.pesquisar({busca:'fictício'});assert.equal(r.total,1);
  assert.equal((await indice.pesquisar({busca:r.notas[0].chave})).total,1);
  assert.equal((await indice.pesquisar({inicio:'2026-11-01'})).total,0);
  assert.doesNotMatch(JSON.stringify(r),/caminho|raiz|etiquetas-indice-/);
 }finally{await indice.fechar()}
});
test('API do índice exige autenticação e expõe progresso durante preparação sem bloquear a interface',async t=>{
 const {criarServidor}=require('../integracao/servidor.cjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'etiquetas-indice-api-'));
 const pasta=path.join(dir,'xml');await fs.mkdir(pasta);await fs.writeFile(path.join(pasta,'a.xml'),xmlNota());
 const readdir=fs.readdir.bind(fs);let liberar;
 const bloqueio=new Promise(r=>{liberar=r});
 t.mock.method(fs,'readdir',async(...args)=>{if(args[0]===await fs.realpath(pasta))await bloqueio;return readdir(...args)});
 const {servidor,token}=criarServidor({fontes:[{id:'teste',tipo:'pastas',pastas:[pasta]}]},{desktop:true,diretorioIndice:path.join(dir,'db')});
 await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+servidor.address().port,headers={Authorization:'Bearer '+token};
 try{
  assert.equal((await fetch(base+'/api/indice?fonte=teste')).status,401);
  const p=await (await fetch(base+'/api/indice?fonte=teste',{headers})).json();assert.equal(p.pronto,false);assert.equal(p.total,null);
  assert.equal((await fetch(base+'/api/notas?fonte=teste',{headers})).status,202);
  assert.equal((await fetch(base+'/')).status,200);
  liberar();
  for(let i=0;i<100;i++){if((await (await fetch(base+'/api/indice?fonte=teste',{headers})).json()).pronto)break;await new Promise(r=>setTimeout(r,10))}
  const notas=await (await fetch(base+'/api/notas?fonte=teste&busca=123',{headers})).json();assert.equal(notas.total,1);
  assert.doesNotMatch(JSON.stringify(notas),/caminho|raiz|etiquetas-indice-api-/);
 }finally{liberar();await new Promise(r=>servidor.close(r));await new Promise(r=>setTimeout(r,20));await fs.rm(dir,{recursive:true,force:true})}
});