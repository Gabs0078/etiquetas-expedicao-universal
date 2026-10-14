const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
module.exports=async function(browser,url){
 const c=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900},colorScheme:'dark'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const output=process.env.QA_OUTPUT||path.join(os.tmpdir(),'tagex-topo');await fs.mkdir(output,{recursive:true});
 try{
  await p.goto(url);
  assert.match(await p.title(),/^TagEX/);assert.equal(await p.locator('.brand-wordmark').textContent(),'TagEX');assert.equal(await p.locator('.brand-mark svg').count(),1);
  const theme=p.locator('#temaAparencia');assert.equal(await theme.getAttribute('role'),'switch');assert.equal(await p.locator('select#temaAparencia').count(),0);
  for(const appearance of ['dark','light']){
   if(await p.locator('html').getAttribute('data-theme')!==appearance)await theme.click();
   await p.reload();assert.equal(await theme.getAttribute('aria-checked'),String(appearance==='dark'));
   for(const width of [1920,1440,1024,768,390,320]){
    await p.setViewportSize({width,height:900});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Página cabe '+width);
    const fit=await p.locator('.brand-shell').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('button,.brand-identity,.workflow-nav a')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right+1;});});
    assert(fit,'Topo cabe '+appearance+'/'+width);
   }
   await p.setViewportSize({width:1440,height:900});await p.locator('.brand-shell').screenshot({path:path.join(output,'tagex-topo-'+appearance+'.png')});
  }
  await theme.press('Space');assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');await theme.press('Enter');assert.equal(await p.locator('html').getAttribute('data-theme'),'light');
  await p.locator('#btnConfiguracoes').click();assert(await p.locator('#configuracoesEmpresa').isVisible());await p.locator('#btnFecharConfiguracoes').click();
  await p.locator('.workflow-nav a').nth(1).click();assert.equal(await p.locator('.workflow-nav a').nth(1).getAttribute('aria-current'),'step');assert.equal(await p.evaluate(()=>location.hash),'#etapaConferencia');
  await p.locator('.workflow-nav a').last().click();assert.equal(await p.locator('.workflow-nav a').last().getAttribute('aria-current'),'step');
  await p.emulateMedia({media:'print'});assert.equal(await p.locator('.brand-shell').isVisible(),false);await p.emulateMedia({media:'screen'});
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('TagEX: cabeçalho, switch persistente e teclado, Empresa, etapas, seis larguras nos dois temas e exclusão na impressão verificados.');
 }finally{await c.close()}
};
