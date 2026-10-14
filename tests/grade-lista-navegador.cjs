const assert=require('node:assert/strict');
const path=require('node:path');const fs=require('node:fs/promises');const os=require('node:os');
module.exports=async function(browser,url){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}});const p=await context.newPage();
 const output=process.env.QA_OUTPUT||path.join(os.tmpdir(),'etiquetas-grade-lista');await fs.mkdir(output,{recursive:true});
 try{
  await p.goto(url);
  await p.locator('#nf').fill('1234567');
  await p.locator('#destinatario').fill('CLIENTE FICTÍCIO DE CONSTRUÇÕES LTDA\nRua de exemplo, 125, galpão 2\nCentro - Curitiba / PR\nCEP: 80000-000');
  await p.locator('#descricao').fill('Materiais para instalação: conexões, tubos, válvulas e acessórios para montagem.');
  await p.locator('#volumes').fill('11');await p.locator('#btnAdicionar').click();
  await p.locator('#disposicaoPapel').selectOption('4');
  const widthGrade=await p.locator('.label').first().evaluate(e=>parseFloat(getComputedStyle(e).width));
  await p.locator('[data-organizacao="lista"]').click();
  assert.equal(await p.locator('[data-organizacao="lista"]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[data-organizacao="grade"]').getAttribute('aria-pressed'),'false');
  assert.equal(await p.locator('#disposicaoPapel').inputValue(),'4');
  assert.equal(await p.locator('.sheet').count(),3);
  assert(await p.locator('.label').first().evaluate(e=>parseFloat(getComputedStyle(e).width))>widthGrade);
  for(const mode of ['a4','a3','a2','a5','carta','oficio']){
   await p.locator('[data-formato="'+mode+'"]').click();
   for(const n of ['4','3','2','1','atual']){
    await p.locator('#disposicaoPapel').selectOption(n);
    const capacidade=await p.evaluate(()=>layoutPapel().quantidade);
    assert.equal(await p.locator('.sheet').count(),Math.ceil(11/capacidade),mode+'/'+n);
    assert.equal(await p.locator('.sheet').first().evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1,'Uma coluna');
    for(let opcionais=0;opcionais<8;opcionais++){
     for(const [i,id] of ['exibirData','exibirDescricao','exibirEnderecoRemetente'].entries())await p.locator('#'+id).setChecked(Boolean(opcionais&(1<<i)));
     assert.equal(await p.locator('#avisoLayout').isVisible(),false,mode+'/'+n+'/'+opcionais+' '+await p.locator('#avisoLayout').textContent());
     assert(await p.locator('.label').first().evaluate(e=>[...e.querySelectorAll('.content-main,.content-grid,.right-box,.nf-number,.volume-number,.desc,.company')].every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1)),'Dados completos '+mode+'/'+n+'/'+opcionais);
    }
    if(mode==='a4'&&['4','atual'].includes(n)){
     await p.emulateMedia({media:'print'});const pdf=await p.pdf({path:path.join(output,'a4-lista-'+n+'.pdf'),preferCSSPageSize:true,displayHeaderFooter:false});
     assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,Math.ceil(11/capacidade));
     await p.locator('.sheet').first().screenshot({path:path.join(output,'a4-lista-'+n+'.png')});
     await p.emulateMedia({media:'screen'});
    }
   }
  }
  await p.locator('[data-formato="a4"]').click();await p.locator('#disposicaoPapel').selectOption('4');
  await p.reload();assert.equal(await p.locator('[data-organizacao="lista"]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#disposicaoPapel').inputValue(),'4');
  await p.locator('[data-organizacao="grade"]').click();assert.equal(await p.locator('#disposicaoPapel').inputValue(),'4');
  assert.equal(await p.locator('.sheet').first().evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2);
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('[data-formato="bobina80"]').evaluate(e=>e.closest('details').open=true);await p.locator('[data-formato="bobina80"]').click();
  assert.equal(await p.locator('#organizacaoFolha').isVisible(),false);
  assert.equal(await p.locator('.bobina-page').count(),11);
  console.log('Grade/Lista: uma coluna, quantidades, oito combinações opcionais em seis papéis, PDFs, preferência salva, grade e bobina verificados.');
 }finally{await context.close()}
};
