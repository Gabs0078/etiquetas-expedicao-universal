const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
module.exports=async function(browser,url){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const output=process.env.QA_OUTPUT||path.join(os.tmpdir(),'etiquetas-disposicoes-papel');await fs.mkdir(output,{recursive:true});
 try{
  await p.goto(url);
  await p.evaluate(()=>{
   const empresa=empresaAtiva();
   empresa.nome='EMPRESA DE MATERIAIS PARA CONSTRUÇÃO LTDA';
   empresa.logo='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="44"><rect width="160" height="44" fill="black"/><text x="12" y="30" font-family="Arial" font-size="22" fill="white">EMPRESA</text></svg>');
  });
  await p.locator('#nf').fill('1234567');
  await p.locator('#destinatario').fill('CLIENTE DE TESTE DE EXPEDIÇÃO\nRua Exemplo, 125, Galpão 2\nCentro - Curitiba / PR\nCEP: 80000-000');
  await p.locator('#descricao').fill('Materiais para instalação: conexões, tubos, válvulas e componentes de montagem.');
  await p.locator('#volumes').fill('11');
  await p.locator('#btnAdicionar').click();
  const fontBase=await p.locator('.shipping-text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  const volumeBase=await p.locator('.volume-number').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  const medir=()=>p.locator('.label').first().evaluate(e=>{
   const nodes=[...e.querySelectorAll('.content-main,.content-grid,.right-box,.desc,.company,.logo-box,.nf-number,.volume-number')];
   const r=e.getBoundingClientRect();
   return nodes.every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1&&n.getBoundingClientRect().bottom<=r.bottom+1);
  });
  for(const mode of ['a4','a3','a2','a5','carta','oficio']){
   await p.locator('[data-formato="'+mode+'"]').evaluate(e=>e.closest('details').open=true);
   await p.locator('[data-formato="'+mode+'"]').click();
   for(const n of [4,3,2,1]){
    await p.locator('#disposicaoPapel').selectOption(String(n));
    assert.equal(await p.locator('.sheet').count(),Math.ceil(11/n),mode+'/'+n);
    assert.equal(await p.locator('.label').count(),11);
    assert.match(await p.locator('#summary').textContent(),new RegExp('Folhas necessárias.*'+Math.ceil(11/n)));
    assert.equal(await p.locator('#avisoLayout').isVisible(),false,mode+'/'+n+' '+JSON.stringify(await p.locator('.label').first().evaluate(e=>[...e.querySelectorAll('.company strong,.company-line,.nf-number,.volume-number,.content-main,.content-grid,.right-box,.desc')].map(n=>({c:n.className,cw:n.clientWidth,sw:n.scrollWidth,ch:n.clientHeight,sh:n.scrollHeight})))));
    assert(await medir(),mode+'/'+n+' sem corte '+JSON.stringify(await p.locator('.label').first().evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.content-main,.content-grid,.right-box,.desc,.company,.logo-box,.nf-number,.volume-number')].map(n=>({c:n.className,cw:n.clientWidth,sw:n.scrollWidth,ch:n.clientHeight,sh:n.scrollHeight,b:n.getBoundingClientRect().bottom,max:r.bottom}));})));
    assert(await p.locator('.nf-number').first().evaluate(e=>e.scrollWidth<=e.clientWidth),'NF completa');
    const dims=await p.locator('.sheet').first().evaluate(e=>{const s=getComputedStyle(e);return {w:parseFloat(s.width),h:parseFloat(s.height)}});
    const label=await p.locator('.label').first().boundingBox();
    assert(label.width<dims.w&&label.height<dims.h);
    assert.equal(dims.w>dims.h,n===1,'Paisagem apenas para 1 por folha: '+mode+'/'+n);
    assert(await p.locator('#preview').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Prévia sem rolagem horizontal '+mode+'/'+n);
    if(mode==='a4'){
     for (let opcoes=0;opcoes<8;opcoes++) {
       for (const [i,id] of ['exibirData','exibirDescricao','exibirEnderecoRemetente'].entries()) await p.locator('#'+id).setChecked(Boolean(opcoes & (1<<i)));
       assert.equal(await p.locator('.label').first().locator('.date-line').count(),opcoes&1?1:0);
       assert.equal(await p.locator('.label').first().locator('.desc').count(),opcoes&2?1:0);
       assert.equal(await p.locator('.label').first().locator('.company-line').count(),opcoes&4?4:1);
       assert.equal(await p.locator('#avisoLayout').isVisible(),false,'Opcionais sem corte A4/'+n+'/'+opcoes);
       assert(await medir(),'Opcionais cabem A4/'+n+'/'+opcoes);
     }
     await p.locator('#exibirData').uncheck();
     assert(await p.locator('.volume-number').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>volumeBase,'Volume ampliado');
     assert(await p.locator('.shipping-text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>fontBase);
     await p.emulateMedia({media:'print'});assert(await medir());
     const pdf=await p.pdf({path:path.join(output,'a4-'+n+'-por-folha.pdf'),preferCSSPageSize:true,displayHeaderFooter:false});
     assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,Math.ceil(11/n),'PDF A4/'+n);
     const box=pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
     assert(box,'Dimensões do PDF');
     assert(Math.abs(Number(box[1])-(n===1?297:210)*72/25.4)<1,'Largura PDF A4/'+n);
     assert(Math.abs(Number(box[2])-(n===1?210:297)*72/25.4)<1,'Altura PDF A4/'+n);
     await p.locator('.sheet').first().screenshot({path:path.join(output,'a4-'+n+'-por-folha.png')});
     await p.emulateMedia({media:'screen'});
    }
   }
  }
  await p.locator('[data-formato="a4"]').click();
  await p.locator('#disposicaoPapel').selectOption('1');
  for(const width of [1920,1440,1024,768,390,321]) {
    await p.setViewportSize({width,height:900});
    await p.waitForFunction(()=>{const e=document.querySelector('#preview');return e.scrollWidth<=e.clientWidth+1;});
    const panel=await p.locator('#preview').boundingBox();
    const page=await p.locator('.sheet').first().boundingBox();
    assert(page.x>=panel.x && page.x+page.width<=panel.x+panel.width+1,'Folha inteira na moldura '+width);
    assert(page.width>page.height,'Paisagem preservada na prévia '+width);
    if(width===1440) await p.locator('.paper-sheet-preview').first().screenshot({path:path.join(output,'previa-a4-paisagem-ajustada.png')});
  }
  await p.locator('#disposicaoPapel').selectOption('2');
  await p.reload();assert.equal(await p.locator('#disposicaoPapel').inputValue(),'2');
  for(const width of [1920,1440,1024,768,390,321]){await p.setViewportSize({width,height:844});await p.waitForFunction(()=>{const e=document.querySelector('#preview');return e.scrollWidth<=e.clientWidth+1;});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.locator('[data-formato="bobina80"]').evaluate(e=>e.closest('details').open=true);await p.locator('[data-formato="bobina80"]').click();
  assert.equal(await p.locator('#controleDisposicao').isVisible(),false);
  assert.equal(await p.locator('.bobina-page').count(),11);
  await p.locator('[data-formato="a4"]').click();assert.equal(await p.locator('#disposicaoPapel').inputValue(),'2');
  await p.locator('#disposicaoPapel').selectOption('atual');assert.equal(await p.locator('.sheet').count(),2);
  const labelWidth=await p.locator('.label').first().evaluate(e=>parseFloat(getComputedStyle(e).width));assert(Math.abs(labelWidth-100*96/25.4)<1);
  await p.emulateMedia({media:'print'});
  const atual=await p.pdf({path:path.join(output,'a4-10-por-folha.pdf'),preferCSSPageSize:true,displayHeaderFooter:false});
  assert.equal((atual.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,2);
  await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>{state.notas[0].volumes=3;renderizar();});
  await p.locator('#disposicaoPapel').selectOption('2');
  assert.equal(await p.locator('.sheet').count(),2);
  assert.equal(await p.locator('.sheet').last().locator('.label').count(),1);
  assert.equal(await p.locator('.volume-number').last().textContent(),'3/3');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Papel: 4/3/2/1 por folha em seis tamanhos; fontes, logo, PDFs A4, persistência, bobina e mobile verificados. Artefatos: '+output);
 }finally{await context.close()}
};
