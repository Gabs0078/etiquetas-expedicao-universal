const assert=require('node:assert/strict');
module.exports=async(browser,url)=>{
 const c=await browser.newContext({locale:'en-US',serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(url);
  const button=p.locator('#btnDownload'),menu=p.locator('#menuDownload');
  assert.equal(await button.locator('svg').count(),2);
  for(const lang of ['en','pt-BR','es','zh-Hans']){
   await p.locator('#idiomaInterface').selectOption(lang);
   for(const width of [1440,390,320]){
    await p.setViewportSize({width,height:800});await button.click();
    await assert.doesNotReject(()=>menu.waitFor({state:'visible'}));
    const box=await menu.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,'Download menu fits '+lang+'/'+width);
    assert.equal(await menu.locator('button:disabled').count(),2);assert.match(await menu.textContent(),/Linux/);assert.match(await menu.textContent(),/macOS/);
    assert.match(await p.locator('#downloadWindows').getAttribute('href'),/v0\.5\.0\/TagEX-Windows-0\.5\.0\.zip$/);
    await p.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);
   }
  }
  await button.focus();await p.keyboard.press('Enter');await menu.waitFor({state:'visible'});
  await p.locator('.brand-wordmark').click();assert.equal(await menu.isVisible(),false);
  await button.click();await p.emulateMedia({media:'print'});assert.equal(await menu.isVisible(),false);await p.emulateMedia({media:'screen'});
  await p.goto(new URL('instalar.html',url).href);assert.equal(await p.locator('html').getAttribute('lang'),'zh-Hans');
  for(const lang of ['en','pt-BR','es','zh-Hans']){await p.locator('[data-language]').selectOption(lang);assert.equal(await p.locator('html').getAttribute('lang'),lang);assert.equal(await p.locator('#instalar .guide-steps li').count(),4);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  assert.deepEqual(errors,[]);console.log('Download: icon, OS options, disabled future platforms, keyboard, outside click, print, mobile and localized guide verified.');
 }finally{await c.close();}
};
