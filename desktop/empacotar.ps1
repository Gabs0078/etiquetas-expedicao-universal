param([Parameter(Mandatory=$true)][string]$Destino)
$ErrorActionPreference='Stop'
$raiz=Split-Path $PSScriptRoot -Parent
$node=Join-Path $PSScriptRoot 'runtime/node.exe'
if(!(Test-Path -LiteralPath $node)){throw 'Inclua o runtime em desktop/runtime/node.exe antes de empacotar.'}
$saida=[IO.Path]::GetFullPath($Destino)
if(Test-Path -LiteralPath $saida){throw 'O arquivo de destino já existe. Escolha outro nome.'}
$stage=Join-Path ([IO.Path]::GetTempPath()) ('etiquetas-pacote-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
foreach($item in @('index.html','sw.js','manifest.webmanifest','assets','integracao','docs','README.md')) { Copy-Item -LiteralPath (Join-Path $raiz $item) -Destination $stage -Recurse }
$desktop=New-Item -ItemType Directory -Path (Join-Path $stage 'desktop')
foreach($item in @('iniciar.ps1','assistente.ps1','diagnostico.cjs','Abrir Etiquetas.vbs','README.md')) {Copy-Item -LiteralPath (Join-Path $PSScriptRoot $item) -Destination $desktop.FullName}
New-Item -ItemType Directory -Path (Join-Path $desktop.FullName 'runtime') | Out-Null
Copy-Item -LiteralPath $node -Destination (Join-Path $desktop.FullName 'runtime/node.exe')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'runtime/LICENSE-node.txt') -Destination (Join-Path $desktop.FullName 'runtime/LICENSE-node.txt')
$parser=& $node -e "console.log(require.resolve(process.argv[1]))" (Join-Path $raiz 'node_modules/@xmldom/xmldom/package.json')
if($LASTEXITCODE -ne 0){throw 'Dependência XML não instalada.'}
$modulos=New-Item -ItemType Directory -Path (Join-Path $stage 'node_modules/@xmldom') -Force
Copy-Item -LiteralPath (Split-Path $parser -Parent) -Destination (Join-Path $modulos.FullName 'xmldom') -Recurse
# Nunca distribuir configuração local nem arquivos XML da empresa.
$local=Join-Path $stage 'integracao/config.local.json'
if(Test-Path -LiteralPath $local){Remove-Item -LiteralPath $local}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $saida
Write-Output $saida
Write-Output ('Pasta temporária preservada para inspeção: '+$stage)
