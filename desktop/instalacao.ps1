if (!(Get-Command T -ErrorAction SilentlyContinue)) { . (Join-Path $PSScriptRoot 'idiomas.ps1') }
# Funções compartilhadas pelo instalador e pelos testes. Não executam instalação ao importar.
function HashArquivoTagEX([string]$Arquivo) {
    $stream = [IO.File]::OpenRead($Arquivo)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose(); $stream.Dispose() }
}
function CaminhoTagEX([string]$Raiz, [string]$Relativo) {
    if (!$Relativo -or [IO.Path]::IsPathRooted($Relativo) -or $Relativo.Contains(':')) { throw 'Caminho inválido no pacote.' }
    $base = [IO.Path]::GetFullPath($Raiz).TrimEnd('\') + '\'
    $final = [IO.Path]::GetFullPath((Join-Path $base $Relativo))
    if (!$final.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { throw 'Arquivo fora da pasta do pacote.' }
    return $final
}
function ConferirPacoteTagEX([string]$Origem) {
    $manifesto = Get-Content -LiteralPath (Join-Path $Origem 'pacote.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifesto.produto -ne 'TagEX' -or $manifesto.formato -ne 1 -or !$manifesto.arquivos.Count) { throw (T 'Pacote do TagEX inválido ou incompleto. Extraia o ZIP novamente.') }
    $vistos = @{}
    foreach ($arquivo in $manifesto.arquivos) {
        $final = CaminhoTagEX $Origem $arquivo.nome
        if ($vistos.ContainsKey($final) -or $arquivo.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'Lista de arquivos inválida.' }
        $vistos[$final] = $true
        if (!(Test-Path -LiteralPath $final -PathType Leaf)) { throw ((T 'Falta um arquivo do pacote: ') + $arquivo.nome + '. Extraia todo o ZIP antes de instalar.') }
        $item = Get-Item -LiteralPath $final
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'O pacote não pode conter links de arquivos.' }
        $pai = $item.Directory
        while ($pai -and $pai.FullName.Length -ge ([IO.Path]::GetFullPath($Origem)).Length) {
            if ($pai.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'O pacote não pode conter pastas vinculadas.' }
            $pai = $pai.Parent
        }
        if ((HashArquivoTagEX $final) -ne $arquivo.sha256) { throw ((T 'Arquivo incompleto ou alterado: ') + $arquivo.nome + '. Baixe e extraia o pacote novamente.') }
    }
    foreach ($obrigatorio in @('desktop/runtime/node.exe','desktop/iniciar.ps1','desktop/assistente.ps1','desktop/boas-vindas.ps1','integracao/servidor.cjs','index.html','assets/icons/app-icon.ico','node_modules/@xmldom/xmldom/lib/index.js','Abrir TagEX.exe')) {
        if (!$vistos.ContainsKey((CaminhoTagEX $Origem $obrigatorio))) { throw ('Pacote sem componente obrigatório: ' + $obrigatorio) }
    }
    return $manifesto
}
function ConferirTagEXFechado {
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    try { $m = [Threading.Mutex]::OpenExisting("Local\Etiquetas-$sid") } catch [Threading.WaitHandleCannotBeOpenedException] { return }
    if ($m) { $m.Dispose(); throw (T 'Feche o TagEX pelo ícone ao lado do relógio > Encerrar. Depois clique em Instalar novamente.') }
}
function RemoverTemporariaTagEX([string]$Pasta, [string]$Pai) {
    $p = [IO.Path]::GetFullPath($Pasta)
    if ((Split-Path $p -Parent) -ne [IO.Path]::GetFullPath($Pai) -or (Split-Path $p -Leaf) -notmatch '^\.TagEX-(novo|anterior)-[a-f0-9]{32}$') { throw 'Pasta temporária fora do local esperado.' }
    # Windows PowerShell 5.1 can fail to resolve existing 8.3 profile paths in Move/Remove-Item.
    # Keep the boundary checks above and operate on the exact verified directory.
    if ([IO.Directory]::Exists($p)) {
        if ([IO.File]::GetAttributes($p) -band [IO.FileAttributes]::ReparsePoint) { throw 'Pasta temporária não pode ser um link.' }
        [IO.Directory]::Delete($p,$true)
    }
}
function InstalarPacoteTagEX([string]$Origem, [string]$Destino) {
    ConferirTagEXFechado
    $origemReal = [IO.Path]::GetFullPath($Origem).TrimEnd('\')
    $destinoReal = [IO.Path]::GetFullPath($Destino).TrimEnd('\')
    if ($destinoReal -eq [IO.Path]::GetPathRoot($destinoReal) -or $origemReal.StartsWith($destinoReal + '\',[StringComparison]::OrdinalIgnoreCase) -or $origemReal -eq $destinoReal) { throw (T 'Use o instalador extraído em outra pasta.') }
    $pai = Split-Path $destinoReal -Parent
    if (Test-Path -LiteralPath $destinoReal) {
        $marcador = Join-Path $destinoReal 'tagex-install.json'
        if (!(Test-Path -LiteralPath $marcador) -or (Get-Content -LiteralPath $marcador -Raw | ConvertFrom-Json).produto -ne 'TagEX') { throw (T 'A pasta de destino já existe e não foi criada por este instalador. Ela foi preservada.') }
        if ((Get-Item -LiteralPath $destinoReal).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'A pasta instalada não pode ser um link.' }
    }
    $pacote = ConferirPacoteTagEX $origemReal
    New-Item -ItemType Directory -Path $pai -Force | Out-Null
    $stage = Join-Path $pai ('.TagEX-novo-' + [guid]::NewGuid().ToString('N'))
    $backup = Join-Path $pai ('.TagEX-anterior-' + [guid]::NewGuid().ToString('N'))
    $moveu = $false; $ativou = $false
    try {
        New-Item -ItemType Directory -Path $stage | Out-Null
        foreach ($arquivo in $pacote.arquivos) {
            $alvo = CaminhoTagEX $stage $arquivo.nome
            New-Item -ItemType Directory -Path (Split-Path $alvo -Parent) -Force | Out-Null
            Copy-Item -LiteralPath (CaminhoTagEX $origemReal $arquivo.nome) -Destination $alvo
        }
        Copy-Item -LiteralPath (Join-Path $origemReal 'pacote.json') -Destination $stage
        $null = ConferirPacoteTagEX $stage
        $runtime = Join-Path $stage 'desktop/runtime/node.exe'
        & $runtime -e "if(Number(process.versions.node.split('.')[0])<24||process.arch!=='x64')process.exit(1);require(process.argv[1]);require(process.argv[2]);" (Join-Path $stage 'node_modules/@xmldom/xmldom') (Join-Path $stage 'integracao/servidor.cjs')
        if ($LASTEXITCODE -ne 0) { throw (T 'O runtime incluído não iniciou. Este pacote requer Windows 10/11 de 64 bits.') }
        [IO.File]::WriteAllText((Join-Path $stage 'tagex-install.json'), (@{produto='TagEX';versao=$pacote.versao;instaladoEm=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
        ConferirTagEXFechado
        if (Test-Path -LiteralPath $destinoReal) { [IO.Directory]::Move($destinoReal,$backup); $moveu = $true }
        [IO.Directory]::Move($stage,$destinoReal); $ativou = $true
    } catch {
        if ($moveu -and !$ativou -and !(Test-Path -LiteralPath $destinoReal)) { [IO.Directory]::Move($backup,$destinoReal) }
        throw
    } finally {
        RemoverTemporariaTagEX $stage $pai
    }
    # Apenas a cópia anterior do programa; os dados ficam fora de Programs/TagEX.
    if ($moveu) { try { RemoverTemporariaTagEX $backup $pai } catch { Write-Warning 'A versão nova está instalada; uma cópia anterior ficou preservada ao lado da pasta do programa.' } }
    return $pacote.versao
}
function CriarAtalhosTagEX([string]$Destino, [bool]$AreaTrabalho) {
    $destinoReal = [IO.Path]::GetFullPath($Destino)
    $executavel = Join-Path $destinoReal 'Abrir TagEX.exe'
    if (!(Test-Path -LiteralPath $executavel -PathType Leaf)) { throw (T 'Não foi possível criar o atalho: o executável do TagEX não foi encontrado.') }
    $menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'TagEX'
    New-Item -ItemType Directory -Path $menu -Force | Out-Null
    $wsh = New-Object -ComObject WScript.Shell
    $locais = @((Join-Path $menu 'TagEX.lnk'))
    if ($AreaTrabalho) { $locais += Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'TagEX.lnk' }
    foreach ($local in $locais) {
        $atalho = $wsh.CreateShortcut($local); $atalho.TargetPath = $executavel
        $atalho.WorkingDirectory = $destinoReal; $atalho.Description = (T 'TagEX - Etiquetas para expedição'); $atalho.Save()
        $gravado = $wsh.CreateShortcut($local)
        if ([IO.Path]::GetFullPath($gravado.TargetPath) -ne $executavel) { throw (T 'O atalho não foi gravado corretamente: ') + $local }
    }
    if ($AreaTrabalho) {
        # Migra o atalho da versão antiga somente quando ele aponta para o iniciador antigo do projeto.
        $legado = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'Etiquetas de Expedição.lnk'
        if (Test-Path -LiteralPath $legado -PathType Leaf) {
            $antigo = $wsh.CreateShortcut($legado)
            if ($antigo.TargetPath -match '\\Windows\\System32\\WindowsPowerShell\\v1\.0\\powershell\.exe$' -and
                $antigo.Arguments -match '(?i)-File\s+"[^"]+\\desktop\\iniciar\.ps1"') {
                Remove-Item -LiteralPath $legado -Force
            }
        }
    }
    $registro = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\TagEX'
    New-Item -Path $registro -Force | Out-Null
    $comando = 'powershell.exe -NoProfile -WindowStyle Hidden -STA -ExecutionPolicy Bypass -File "' + (Join-Path $Destino 'desktop/desinstalar.ps1') + '"'
    $valores = @{DisplayName='TagEX';DisplayVersion=(Get-Content -LiteralPath (Join-Path $Destino 'tagex-install.json') -Raw | ConvertFrom-Json).versao;Publisher='Gabriel - Gabs0078';InstallLocation=$Destino;UninstallString=$comando;NoModify=1;NoRepair=1}
    foreach ($nome in $valores.Keys) {
        $tipo = if ($valores[$nome] -is [int]) { 'DWord' } else { 'String' }
        New-ItemProperty -Path $registro -Name $nome -Value $valores[$nome] -PropertyType $tipo -Force | Out-Null
    }
    $inicio = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
    $anterior = (Get-ItemProperty -Path $inicio -Name 'EtiquetasExpedicao' -ErrorAction SilentlyContinue).EtiquetasExpedicao
    if ($anterior -and $anterior -match '^powershell\.exe .* -File "[^"]+\\desktop\\iniciar\.ps1"$') {
        $novo = 'powershell.exe -NoProfile -WindowStyle Hidden -STA -ExecutionPolicy Bypass -File "' + (Join-Path $Destino 'desktop\iniciar.ps1') + '"'
        Set-ItemProperty -Path $inicio -Name 'EtiquetasExpedicao' -Value $novo
    }
}
