const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {catalog,generated}=require('../scripts/compilar-i18n.cjs');
const root=path.resolve(__dirname,'..');

test('catalogs include every explicit UI key, match generated assets and preserve placeholders',()=>{
 const rows=catalog();
 for(const [name,content]of Object.entries(generated()))assert.equal(fs.readFileSync(path.join(root,'assets/i18n',name),'utf8'),content,'Run pnpm i18n:build: '+name);
 for(const file of ['index.html','instalar.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g)){
   const id=match[1].replaceAll('&amp;','&').replaceAll('&quot;','"');assert(rows[id],file+': '+id);
  }
 }
 const {parse}=require('acorn');
 function visit(node,file){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='tr'){
   const key=node.arguments[0];
   if(key.type==='Literal')assert(rows[key.value],file+': '+key.value);
   else assert(key.type==='MemberExpression'&&(['f.nome','e.motivo','e.message','dados.erro'].includes(key.object.name+'.'+key.property.name)),'Unexpected computed translation key: '+file);
  }
  for(const [key,value]of Object.entries(node))if(key!=='parent'){if(Array.isArray(value))value.forEach(v=>visit(v,file));else if(value&&typeof value==='object')visit(value,file);}
 }
 for(const file of ['app.js','fontes.js','importacao.js'])visit(parse(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),{ecmaVersion:'latest'}),file);
});

test('UI translation defaults to English, persists choices and treats values as data',()=>{
 const events=[],data=new Map(),document={documentElement:{},querySelectorAll:()=>[],addEventListener(){},dispatchEvent:e=>events.push(e)};
 const ctx=vm.createContext({document,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},CustomEvent:class{constructor(name,options){this.type=name;this.detail=options.detail;}}});
 vm.runInContext(generated()['catalogs.js'],ctx);vm.runInContext(fs.readFileSync(path.join(root,'assets/js/i18n.js'),'utf8'),ctx);
 assert.equal(ctx.I18n.language,'en');assert.equal(ctx.tr('Baixar TagEX'),'Download TagEX');
 for(const locale of ['pt-BR','es','zh-Hans','en']){ctx.I18n.setLanguage(locale);assert.equal(data.get('tagex_language_v1'),locale);assert.equal(document.documentElement.lang,locale);assert.equal(ctx.tr('Cliente / 公司 <&>'),'Cliente / 公司 <&>');}
 assert.throws(()=>ctx.I18n.setLanguage('unsupported'));
 assert.equal(events.length,4);
});

test('Windows UI catalog supports all locales, LF/CRLF sources and parses every launcher', {skip:process.platform!=='win32'},()=>{
 const script=String.raw`
 $ErrorActionPreference='Stop'
 $ProgressPreference='SilentlyContinue'
 [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
 . './desktop/idiomas.ps1'
 $intro=($script:CatalogoTagEX.Keys | Where-Object { $_.StartsWith('Como funciona') } | Select-Object -First 1)
 $results=foreach($lang in @('en','pt-BR','es','zh-Hans')){
   $script:IdiomaTagEX=$lang
   if((T $intro) -ne (T ($intro.Replace("` + '`n' + String.raw`","` + '`r`n' + String.raw`")))){throw 'Line-ending mismatch'}
   [pscustomobject]@{language=$lang;install=(T 'Instalar TagEX');summary=(T 'Configuração salva. {0} pasta(s) acessível(is). Use Buscar nota no aplicativo.' @(4))}
 }
 foreach($file in (Get-ChildItem './desktop/*.ps1')){
   $errors=$null;$tokens=$null;[Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$tokens,[ref]$errors)|Out-Null
   if($errors.Count){throw ($errors|Out-String)}
 }
 ConvertTo-Json -InputObject @($results) -Compress
 `;
 const encoded=Buffer.from(script,'utf16le').toString('base64');
 const result=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-EncodedCommand',encoded],{cwd:root,encoding:'utf8'}).replace(/^\uFEFF/,''));
 assert.deepEqual(result.map(x=>x.install),['Install TagEX','Instalar TagEX','Instalar TagEX','安装 TagEX']);
 for(const row of result)assert.match(row.summary,/4/);
});
