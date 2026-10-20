'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {arquivos}=require('./preparar-pages.cjs');
async function preparar(stage,root=path.resolve(__dirname,'..')){
 await fs.mkdir(stage,{recursive:true});
 if((await fs.readdir(stage)).length)throw Error('A pasta do pacote precisa estar vazia.');
 const copiar=async nome=>{const alvo=path.join(stage,nome);await fs.mkdir(path.dirname(alvo),{recursive:true});await fs.copyFile(path.join(root,nome),alvo);};
 // Lista explícita: não copiar XMLs, configurações, índice ou dependências de desenvolvimento.
 for(const nome of [...arquivos,'LICENSE','package.json','README.md','integracao/servidor.cjs','integracao/config.exemplo.json','integracao/fontes/pastas.cjs','integracao/fontes/indice.cjs',
 'desktop/iniciar.ps1','desktop/assistente.ps1','desktop/boas-vindas.ps1','desktop/instalar.ps1','desktop/instalacao.ps1','desktop/desinstalar.ps1','desktop/diagnostico.cjs','desktop/Abrir Etiquetas.vbs','desktop/README.md','desktop/runtime/node.exe','desktop/runtime/LICENSE-node.txt',
 'docs/guia-usuario.md','docs/pacote-windows.md','docs/integracoes.md','docs/instalacao-windows.md','docs/arquitetura-integracao.md','docs/validacao-assistente.md'])await copiar(nome);
 const parser=path.dirname(require.resolve('@xmldom/xmldom/package.json'));
 await fs.cp(parser,path.join(stage,'node_modules/@xmldom/xmldom'),{recursive:true,dereference:true});
 await fs.copyFile(path.join(stage,'instalar.html'),path.join(stage,'LEIA-ME.html'));
}
async function manifesto(stage){
 const lista=[];
 async function visitar(dir=''){
  for(const e of await fs.readdir(path.join(stage,dir),{withFileTypes:true})){
   const nome=path.posix.join(dir,e.name);if(nome==='pacote.json')continue;
   if(e.isDirectory())await visitar(nome);else if(e.isFile())lista.push({nome,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(stage,nome))).digest('hex')});else throw Error('Link não permitido no pacote: '+nome);
  }
 }
 await visitar();lista.sort((a,b)=>a.nome.localeCompare(b.nome));
 const versao=JSON.parse(await fs.readFile(path.join(stage,'package.json'))).version;
 await fs.writeFile(path.join(stage,'pacote.json'),JSON.stringify({produto:'TagEX',formato:1,versao,arquitetura:'win-x64',arquivos:lista},null,2));
}
if(require.main===module)(process.argv[2]==='manifesto'?manifesto(process.argv[3]):preparar(process.argv[3])).catch(e=>{console.error(e);process.exitCode=1});
module.exports={preparar,manifesto};
