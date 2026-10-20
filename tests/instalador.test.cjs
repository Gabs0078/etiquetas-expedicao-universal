const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const exec=promisify(execFile);
test('pacote Windows instala, atualiza e remove offline sem Node global e sem tocar dados externos',{skip:process.platform!=='win32'||!process.env.TAGEX_PACOTE_TESTE,timeout:180000},async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tagex-instalar-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const script=path.join(dir,'teste.ps1'),pacote=path.resolve(process.env.TAGEX_PACOTE_TESTE);
 await fs.writeFile(script,'\ufeff'+String.raw`param([string]$Zip,[string]$RaizTeste)
$ErrorActionPreference='Stop'
Expand-Archive -LiteralPath $Zip -DestinationPath (Join-Path $RaizTeste 'pacote')
$origem=Join-Path $RaizTeste 'pacote'
$destino=Join-Path $RaizTeste 'Programs\TagEX'
$dados=Join-Path $RaizTeste 'dados-empresa'
New-Item -ItemType Directory -Path $dados | Out-Null
[IO.File]::WriteAllText((Join-Path $dados 'config.json'),'{"fontes":[],"teste":"preservado"}')
$env:PATH=$env:SystemRoot+'\System32;'+$env:SystemRoot+';'+$env:SystemRoot+'\System32\WindowsPowerShell\v1.0'
. (Join-Path $origem 'desktop\instalacao.ps1')
$v=InstalarPacoteTagEX $origem $destino
if($v -ne '0.5.0'){throw 'Versão incorreta'}
if(!(Test-Path -LiteralPath (Join-Path $destino 'Abrir TagEX.exe'))){throw 'Executável não instalado'}
if(Test-Path -LiteralPath (Join-Path $destino 'integracao\config.local.json')){throw 'Configuração privada no pacote'}
if(Test-Path -LiteralPath (Join-Path $destino 'node_modules\playwright')){throw 'Dependência de teste distribuída'}
$segunda=InstalarPacoteTagEX $origem $destino
if((Get-Content -LiteralPath (Join-Path $dados 'config.json') -Raw) -ne '{"fontes":[],"teste":"preservado"}'){throw 'Dados externos alterados'}
# Um dano não pode sobrescrever a instalação válida.
$html=Join-Path $origem 'index.html'
[IO.File]::AppendAllText($html,'alteração de teste')
$bloqueou=$false
try {InstalarPacoteTagEX $origem $destino | Out-Null} catch {$bloqueou=$_.Exception.Message.Contains('incompleto ou alterado')}
if(!$bloqueou){throw 'Pacote danificado não foi bloqueado'}
if((Get-Content -LiteralPath (Join-Path $destino 'index.html') -Raw).Contains('alteração de teste')){throw 'Instalação válida substituída por arquivo danificado'}
# Caminhos externos e destino não pertencente ao aplicativo são preservados.
try { CaminhoTagEX $origem '..\fora.txt'; throw 'Traversal aceito' } catch {if($_.Exception.Message -eq 'Traversal aceito'){throw}}
$estranho=Join-Path $RaizTeste 'pasta-com-arquivos';New-Item -ItemType Directory -Path $estranho | Out-Null
[IO.File]::WriteAllText((Join-Path $estranho 'manter.txt'),'manter')
try {InstalarPacoteTagEX $origem $estranho | Out-Null;throw 'Destino estranho aceito'} catch {if($_.Exception.Message -eq 'Destino estranho aceito'){throw}}
if(!(Test-Path -LiteralPath (Join-Path $estranho 'manter.txt'))){throw 'Arquivo alheio removido'}
# Iniciador usa o runtime empacotado com PATH sem Node e não abre navegador em verificação.
$ouvir=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,0);$ouvir.Start();$porta=$ouvir.LocalEndpoint.Port;$ouvir.Stop()
& (Join-Path $destino 'desktop\iniciar.ps1') -Verificar -Porta $porta -DiretorioDados $dados
& (Join-Path $destino 'desktop\desinstalar.ps1') -SemInterface -SemAtalhos
if(Test-Path -LiteralPath $destino){throw 'Programa não removido'}
if(!(Test-Path -LiteralPath (Join-Path $dados 'config.json'))){throw 'Configuração removida na desinstalação'}
Write-Output 'Pacote offline, atualização, integridade, isolamento e desinstalação aprovados.'
`);
 const r=await exec('powershell.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',script,'-Zip',pacote,'-RaizTeste',dir],{timeout:160000,maxBuffer:1024*1024});
 assert.match(r.stdout,/Pacote offline/);
});
