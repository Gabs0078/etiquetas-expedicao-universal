// Existing regression tests exercise the established Portuguese workflow.
// Internationalization tests create explicit en-US contexts and verify the English default.
module.exports=browser=>{
 for(const name of ['newContext','newPage']){
  const original=browser[name].bind(browser);
  browser[name]=async(options={})=>{
   const surface=await original(options);
   if(!options.locale)await surface.addInitScript(()=>{try{if(!localStorage.getItem('tagex_language_v1'))localStorage.setItem('tagex_language_v1','pt-BR')}catch{}});
   return surface;
  };
 }
};
