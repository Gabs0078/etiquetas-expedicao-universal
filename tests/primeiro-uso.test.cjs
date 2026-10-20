const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{promisify}=require('node:util'),{execFile}=require('node:child_process');
test('escolha de uso simples salva configuração vazia uma vez e preserva configuração anterior',{skip:process.platform!=='win32'},async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tagex-primeiro-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const script=path.join(dir,'teste.ps1');
 await fs.writeFile(script,'\ufeff'+String.raw`param([string]$Fonte,[string]$Destino)
$ErrorActionPreference='Stop'
. $Fonte
SalvarModoSimples $Destino
if((Get-Content -LiteralPath $Destino -Raw | ConvertFrom-Json).fontes.Count -ne 0){throw 'Configuração simples inválida'}
[IO.File]::WriteAllText($Destino,'{"fontes":[{"id":"preservar"}]}')
SalvarModoSimples $Destino
if((Get-Content -LiteralPath $Destino -Raw | ConvertFrom-Json).fontes[0].id -ne 'preservar'){throw 'Configuração substituída'}
Write-Output 'Escolha simples preservada.'
`);
 const r=await promisify(execFile)('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script,'-Fonte',path.resolve('desktop/boas-vindas.ps1'),'-Destino',path.join(dir,'config.json')]);
 assert.match(r.stdout,/Escolha simples preservada/);
});
