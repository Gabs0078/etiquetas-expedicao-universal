/* Local, offline UI translations. Document values and printed labels are never translated. */
(function(root){
 'use strict';
 const supported=['en','pt-BR','es','zh-Hans'],key='tagex_language_v1',bindings=new Map(),issued=new Map();
 let language='en';
 try{const saved=localStorage.getItem(key);if(supported.includes(saved))language=saved;}catch{}
 function t(id,params=[]){
  const row=root.TagEXMessages?.[id],column={'en':1,'pt-BR':0,'es':2,'zh-Hans':3}[language];
  const text=row?row[column]:id;
  const result=String(text).replace(/\{(\d+)\}/g,(match,index)=>params[index]===undefined?match:String(params[index]));
  if(row){issued.set(result,{id,params});if(issued.size>1000)issued.delete(issued.keys().next().value);}
  return result;
 }
 function text(element,getter){const value=getter(),token=issued.get(value);if(token)bindings.set(element,token);else bindings.delete(element);element.textContent=value;}
 function apply(scope=document){
  for(const el of scope.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
  for(const attr of ['title','placeholder','aria-label','alt','content']){
   for(const el of scope.querySelectorAll('[data-i18n-'+attr+']'))el.setAttribute(attr,t(el.getAttribute('data-i18n-'+attr)));
  }
  for(const el of scope.querySelectorAll('[data-language]'))el.value=language;
  document.documentElement.lang=language;
 }
 function setLanguage(next){
  if(!supported.includes(next))throw new Error('Unsupported UI language');
  language=next;try{localStorage.setItem(key,next);}catch{}
  apply();
  for(const [el,token]of bindings){if(el.isConnected)el.textContent=t(token.id,token.params);else bindings.delete(el);}
  document.dispatchEvent(new CustomEvent('tagex:languagechange',{detail:{language}}));
 }
 root.I18n={t,text,apply,setLanguage,get language(){return language},supported};
 root.tr=t;
 document.documentElement.lang=language;
 document.addEventListener('DOMContentLoaded',()=>{
  apply();
  for(const select of document.querySelectorAll('[data-language]'))select.addEventListener('change',()=>setLanguage(select.value));
 });
})(globalThis);
