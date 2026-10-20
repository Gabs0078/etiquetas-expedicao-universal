param([Parameter(Mandatory=$true)][string]$Destino)
$ErrorActionPreference='Stop'
$raiz=Split-Path $PSScriptRoot -Parent
$node=Join-Path $PSScriptRoot 'runtime/node.exe'
if(!(Test-Path -LiteralPath $node)){throw 'Execute desktop/preparar-runtime.ps1 antes de empacotar.'}
$saida=[IO.Path]::GetFullPath($Destino)
if(Test-Path -LiteralPath $saida){throw 'O arquivo de destino já existe. Escolha outro nome.'}
$stage=Join-Path ([IO.Path]::GetTempPath()) ('tagex-pacote-'+[guid]::NewGuid().ToString('N'))
& $node (Join-Path $raiz 'scripts/pacote-windows.cjs') preparar $stage
if($LASTEXITCODE -ne 0){throw 'Falha ao preparar os arquivos do pacote.'}
Add-Type -Path (Join-Path $PSScriptRoot 'Bootstrap.cs') -ReferencedAssemblies 'System.Windows.Forms','System.Core' -OutputAssembly (Join-Path $stage 'Instalar TagEX.exe') -OutputType WindowsApplication
Copy-Item -LiteralPath (Join-Path $stage 'Instalar TagEX.exe') -Destination (Join-Path $stage 'Abrir TagEX.exe')
& $node (Join-Path $raiz 'scripts/pacote-windows.cjs') manifesto $stage
if($LASTEXITCODE -ne 0){throw 'Falha ao conferir a lista de arquivos do pacote.'}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $saida
$hash=(Get-FileHash -LiteralPath $saida -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText(($saida+'.sha256'),($hash+'  '+[IO.Path]::GetFileName($saida)+[Environment]::NewLine))
Write-Output $saida
Write-Output ('Pasta temporária para testar o pacote: '+$stage)