param([string]$Versao = '24.22.0')
$ErrorActionPreference = 'Stop'
if ($Versao -notmatch '^24\.\d+\.\d+$') { throw 'Informe uma versão explícita da linha Node.js 24.' }
$nome = "node-v$Versao-win-x64.zip"
$base = "https://nodejs.org/dist/v$Versao"
$temp = Join-Path ([IO.Path]::GetTempPath()) ('tagex-runtime-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
    Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -OutFile (Join-Path $temp 'SHASUMS256.txt') -UseBasicParsing -TimeoutSec 120
    Invoke-WebRequest -Uri "$base/$nome" -OutFile (Join-Path $temp $nome) -UseBasicParsing -TimeoutSec 120
    $linha = Get-Content -LiteralPath (Join-Path $temp 'SHASUMS256.txt') | Where-Object { $_ -match ('  ' + [regex]::Escape($nome) + '$') }
    if (@($linha).Count -ne 1 -or ($linha -split '\s+')[0] -ne (Get-FileHash -LiteralPath (Join-Path $temp $nome) -Algorithm SHA256).Hash.ToLowerInvariant()) { throw 'O checksum oficial do runtime não corresponde ao arquivo baixado.' }
    Expand-Archive -LiteralPath (Join-Path $temp $nome) -DestinationPath (Join-Path $temp 'extraido')
    $runtime = Join-Path $PSScriptRoot 'runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    $origem = Join-Path $temp "extraido/node-v$Versao-win-x64"
    Copy-Item -LiteralPath (Join-Path $origem 'node.exe') -Destination $runtime -Force
    Copy-Item -LiteralPath (Join-Path $origem 'LICENSE') -Destination (Join-Path $runtime 'LICENSE-node.txt') -Force
    Write-Output ("Runtime incluído: " + (& (Join-Path $runtime 'node.exe') --version))
} finally {
    $seguro = [IO.Path]::GetFullPath($temp)
    if ((Split-Path $seguro -Parent) -eq [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') -and (Split-Path $seguro -Leaf) -match '^tagex-runtime-[a-f0-9]{32}$') { Remove-Item -LiteralPath $seguro -Recurse -Force }
}
