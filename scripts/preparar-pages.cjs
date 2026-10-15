'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const arquivos=[
 'index.html','sw.js','manifest.webmanifest','assets/brand/tagex-compartilhamento-v1.png',
 'assets/css/styles.css','assets/js/app.js','assets/js/nfe.js','assets/js/fontes.js','assets/js/importacao.js',
 'assets/icons/app-icon.svg','assets/icons/app-icon-192.png','assets/icons/app-icon-512.png',
 'assets/icons/github-invertocat-black.svg','assets/icons/github-invertocat-white.svg'
];
async function preparar(destino=path.resolve(__dirname,'../_site')){
 const raiz=path.resolve(__dirname,'..');
 await fs.mkdir(destino,{recursive:true});
 if((await fs.readdir(destino)).length)throw Error('A pasta de publicação precisa estar vazia.');
 for(const arquivo of arquivos){
  const origem=path.join(raiz,arquivo);
  if(!(await fs.lstat(origem)).isFile())throw Error('Asset inválido: '+arquivo);
  const alvo=path.join(destino,arquivo);
  await fs.mkdir(path.dirname(alvo),{recursive:true});
  await fs.copyFile(origem,alvo);
 }
 await fs.writeFile(path.join(destino,'.nojekyll'),'');
 return destino;
}
if(require.main===module)preparar(process.argv[2]).then(p=>console.log('Site estático preparado: '+p)).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={preparar,arquivos};
