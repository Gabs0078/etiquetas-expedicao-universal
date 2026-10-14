const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
test('Windows PowerShell apresenta cada pasta separadamente e lê diagnóstico em UTF-8', {skip:process.platform!=='win32'}, async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'etiquetas-texto-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const script=path.join(dir,'verificar.ps1');
  const entrada=path.join(dir,'entrada.json');
  await fs.writeFile(entrada,JSON.stringify({pastas:[dir]}));
  await fs.writeFile(script,'\ufeff'+String.raw`param([string]$Raiz,[string]$Node,[string]$Entrada)
$ErrorActionPreference='Stop'
. (Join-Path $Raiz 'desktop/assistente.ps1')
$json='[{"pasta":"EMP1","mensagem":"Notas válidas.","notas":47,"avisos":50,"limitado":true},{"pasta":"EMP2","mensagem":"Pasta acessível.","notas":90,"avisos":10}]'
$r=ConverterResultadoDiagnostico $json
if($r.Resultados.Count -ne 2){throw 'Registros agrupados'}
if(!$r.Texto.Contains("EMP1"+[Environment]::NewLine+"Notas válidas.")){throw 'Primeiro bloco incorreto'}
if(!$r.Texto.Contains("EMP2"+[Environment]::NewLine+"Pasta acessível.")){throw 'Segundo bloco incorreto'}
$unico=ConverterResultadoDiagnostico '[{"pasta":"Única","mensagem":"Sem acesso."}]'
if($unico.Resultados.Count -ne 1 -or !$unico.Texto.StartsWith('Única')){throw 'Pasta única incorreta'}
$info=New-Object Diagnostics.ProcessStartInfo
$info.FileName=$Node
$info.Arguments='"'+(Join-Path $Raiz 'desktop/diagnostico.cjs')+'" "'+$Entrada+'"'
$info.UseShellExecute=$false; $info.CreateNoWindow=$true; $info.RedirectStandardOutput=$true
$info.StandardOutputEncoding=[Text.Encoding]::UTF8
$p=[Diagnostics.Process]::Start($info)
try {$texto=$p.StandardOutput.ReadToEnd(); $p.WaitForExit(); if($p.ExitCode -ne 0){throw 'Diagnóstico falhou'}}finally{$p.Dispose()}
$r=ConverterResultadoDiagnostico $texto
if(!$r.Texto.Contains('Pasta acessível. Aguardando XMLs de NF-e.')){throw 'Acentos corrompidos'}
$casos=ConvertFrom-Json '[{"pasta":"EMP1","estado":"pronta","notas":47,"avisos":50},{"pasta":"EMP2","estado":"xml-invalido","notas":0,"avisos":10},{"pasta":"EMP3","estado":"vazia","notas":0},{"pasta":"EMP4","estado":"parcial","notas":3,"avisos":1},{"pasta":"EMP5","estado":"sem-acesso"},{"pasta":"EMP6","estado":"inexistente"},{"pasta":"EMP7","estado":"indisponivel"}]'
$resumo=ResumirDiagnostico $casos
if($resumo.Acessiveis.Count -ne 4 -or $resumo.SemAcesso.Count -ne 3){throw 'Avisos de XML confundidos com falta de acesso'}
if($resumo.Notas -ne 50 -or $resumo.Avisos -ne 61){throw 'Totais associados incorretamente'}
$soAvisos=ResumirDiagnostico @($casos[0],$casos[1])
if($soAvisos.SemAcesso.Count -ne 0){throw 'Pastas acessíveis exigem confirmação desnecessária'}
Write-Output 'OK'
`);
  const {stdout}=await promisify(execFile)('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script,'-Raiz',path.resolve(__dirname,'..'),'-Node',process.execPath,'-Entrada',entrada],{timeout:15000});
  assert.match(stdout,/OK/);
});