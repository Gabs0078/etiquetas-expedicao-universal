const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
module.exports=async function(browser,url){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}});const p=await context.newPage();
 const output=process.env.QA_OUTPUT||path.join(os.tmpdir(),'etiquetas-papel-padrao');await fs.mkdir(output,{recursive:true});
 try{
  await p.goto(url);
  await p.locator('#nf').fill('778');
  await p.locator('#destinatario').fill('EMPRESA FICTÍCIA DE EQUIPAMENTOS E MATERIAIS LTDA\nR. EXEMPLO PARA ENTREGA, 1234\nCEP: 85875-000 SANTA TEREZINHA DO ITAIPU / PR');
  await p.locator('#descricao').fill('Materiais de construção: tubos, conexões, válvulas e acessórios para instalação.');
  await p.locator('#volumes').fill('11');await p.locator('#btnAdicionar').click();
  for(const [mode,capacidade,w,h] of [['a4',10,210,297],['a3',16,297,420],['a2',44,420,594],['a5',4,148,210],['carta',10,215.9,279.4],['oficio',12,215.9,355.6]]){
   await p.locator('[data-formato="'+mode+'"]').click();
   await p.locator('#disposicaoPapel').selectOption('atual');
   assert.equal(await p.locator('.sheet').count(),Math.ceil(11/capacidade));
   for(let opcoes=0;opcoes<8;opcoes++){
    for(const [i,id] of ['exibirData','exibirDescricao','exibirEnderecoRemetente'].entries())await p.locator('#'+id).setChecked(Boolean(opcoes&(1<<i)));
    assert.equal(await p.locator('#avisoLayout').isVisible(),false,mode+'/'+opcoes);
    for(const media of ['screen','print']){
     await p.emulateMedia({media});
     const medidas=await p.locator('.label').first().evaluate(e=>{
      const lateral=e.querySelector('.right-box').getBoundingClientRect();
      const primeiro=e.querySelector('.nf-label').getBoundingClientRect();
      const ultimo=e.querySelector('.volume-number').getBoundingClientRect();
      const main=e.querySelector('.content-main').getBoundingClientRect();
      const titulo=e.querySelector('.content-main>.block-title').getBoundingClientRect();
      const escala=e.getBoundingClientRect().width/parseFloat(getComputedStyle(e).width);
      return {centralizado:Math.abs((primeiro.top+ultimo.bottom-lateral.top-lateral.bottom)/2)/escala,topo:(titulo.top-main.top)/escala,fits:[...e.querySelectorAll('.content-main,.right-box,.nf-number,.volume-number,.desc')].every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1),fonte:parseFloat(getComputedStyle(e.querySelector('.shipping-text')).fontSize)};
     });
     assert(medidas.centralizado<2,'NF/volume no centro '+mode+'/'+opcoes+'/'+media+': '+medidas.centralizado);
     assert(medidas.fits,'Sem corte '+mode+'/'+opcoes+'/'+media);
     if(!(opcoes&1))assert(Math.abs(medidas.topo)<1,'Endereço continua no topo');
     if(opcoes===0)assert(medidas.fonte>=10,'Endereço mais legível');
    }
    await p.emulateMedia({media:'screen'});
   }
   await p.emulateMedia({media:'print'});
   const pdf=await p.pdf({path:path.join(output,mode+'-grade-atual.pdf'),preferCSSPageSize:true,displayHeaderFooter:false});
   assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,Math.ceil(11/capacidade));
   const box=pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
   assert(box);assert(Math.abs(Number(box[1])-w*72/25.4)<1&&Math.abs(Number(box[2])-h*72/25.4)<1);
   if(mode==='a4')await p.locator('.label').first().screenshot({path:path.join(output,'a4-padrao-identificacao-centralizada.png')});
   await p.emulateMedia({media:'screen'});
  }
  console.log('Grades atuais: NF/volume centralizados, endereço no topo, 8 combinações opcionais e PDFs nos 6 papéis verificados.');
 }finally{await context.close()}
};
