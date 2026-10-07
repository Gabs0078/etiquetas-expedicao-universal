param([int]$Porta = 8788, [string]$DiretorioDados = '', [switch]$Verificar)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
if ($Verificar) { $sid = "$sid-verificar-$Porta" }
$mutex = [System.Threading.Mutex]::new($false, "Local\Etiquetas-$sid")
$evento = [System.Threading.EventWaitHandle]::new($false, [System.Threading.EventResetMode]::AutoReset, "Local\Etiquetas-Abrir-$sid")
try { $primeiro = $mutex.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $primeiro = $true }
if (!$primeiro) { $evento.Set() | Out-Null; $evento.Dispose(); $mutex.Dispose(); exit }
$script:processo = $null
$script:token = ''
$script:base = "http://127.0.0.1:$Porta"
$dados = Join-Path $env:LOCALAPPDATA 'EtiquetasExpedicao'
if ($DiretorioDados) { $dados = $DiretorioDados }
$config = Join-Path $dados 'config.json'
$script:janelaPasta = $null
$raiz = Split-Path $PSScriptRoot -Parent
$node = Join-Path $PSScriptRoot 'runtime\node.exe'
if (!(Test-Path -LiteralPath $node)) {
    $comando = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($comando) { $node = $comando.Source } else { $node = Join-Path $env:ProgramFiles 'nodejs\node.exe' }
}
function Avisar([string]$texto) {
    [System.Windows.Forms.MessageBox]::Show($texto, 'Etiquetas de Expedicao', 'OK', 'Information') | Out-Null
}
function EscolherPasta {
    $janela = [System.Windows.Forms.Form]::new()
    $janela.Text = 'Pastas dos XMLs'
    $janela.ClientSize = [System.Drawing.Size]::new(700, 350)
    $janela.StartPosition = 'CenterScreen'
    $janela.FormBorderStyle = 'FixedDialog'
    $janela.MaximizeBox = $false
    $janela.MinimizeBox = $false
    $janela.TopMost = $true
    $script:janelaPasta = $janela
    $janela.add_Shown({ $janela.Activate(); $campo.Focus() })
    $rotulo = [System.Windows.Forms.Label]::new()
    $rotulo.Text = 'Caminho da pasta (local ou compartilhada)'
    $rotulo.SetBounds(16, 16, 545, 22)
    $campo = [System.Windows.Forms.TextBox]::new()
    $campo.SetBounds(16, 42, 440, 24)
    $lista = [System.Windows.Forms.ListBox]::new()
    $lista.SetBounds(16, 110, 668, 175)
    $lista.HorizontalScrollbar = $true
    if (Test-Path -LiteralPath $config) {
        try {
            $salvas = Get-Content -LiteralPath $config -Raw | ConvertFrom-Json
            foreach ($fonteSalva in $salvas.fontes) {
                foreach ($pastaSalva in $fonteSalva.pastas) {
                    if (!$lista.Items.Contains($pastaSalva)) { $lista.Items.Add([string]$pastaSalva) | Out-Null }
                }
            }
        } catch { }
    }
    $exemplo = [System.Windows.Forms.Label]::new()
    $exemplo.Text = 'Exemplo: \\SRV-001\Adiogo\NotasXML_EMP1'
    $exemplo.SetBounds(16, 76, 545, 22)
    $procurar = [System.Windows.Forms.Button]::new()
    $procurar.Text = 'Procurar...'
    $procurar.SetBounds(464, 40, 105, 28)
    $procurar.add_Click({
        $seletor = [System.Windows.Forms.FolderBrowserDialog]::new()
        $seletor.ShowNewFolderButton = $false
        $seletor.SelectedPath = $campo.Text
        try { if ($seletor.ShowDialog($janela) -eq 'OK') { $campo.Text = $seletor.SelectedPath } }
        finally { $seletor.Dispose() }
    })
    $adicionar = [System.Windows.Forms.Button]::new()
    $adicionar.Text = 'Adicionar'
    $adicionar.SetBounds(577, 40, 107, 28)
    $adicionarPasta = {
        $pastaSelecionada = $campo.Text.Trim()
        try {
            if (![System.IO.Path]::IsPathRooted($pastaSelecionada) -or !(Test-Path -LiteralPath $pastaSelecionada -PathType Container)) { throw 'Pasta invalida.' }
            Get-ChildItem -LiteralPath $pastaSelecionada -ErrorAction Stop | Select-Object -First 1 | Out-Null
            $pastaSelecionada = [System.IO.Path]::GetFullPath($pastaSelecionada)
            if (!$lista.Items.Contains($pastaSelecionada)) { $lista.Items.Add($pastaSelecionada) | Out-Null }
            $campo.Clear()
        } catch { Avisar 'Nao foi possivel acessar a pasta. Confira o caminho, a conexao e as permissoes.' }
    }
    $adicionar.add_Click($adicionarPasta)
    $remover = [System.Windows.Forms.Button]::new()
    $remover.Text = 'Remover selecionada'
    $remover.SetBounds(16, 305, 165, 30)
    $remover.add_Click({ if ($lista.SelectedIndex -ge 0) { $lista.Items.RemoveAt($lista.SelectedIndex) } })
    $salvar = [System.Windows.Forms.Button]::new()
    $salvar.Text = 'Salvar pastas'
    $salvar.SetBounds(459, 305, 110, 30)
    $salvar.add_Click({
        if ($campo.Text.Trim()) { & $adicionarPasta; if ($campo.Text.Trim()) { return } }
        if (!$lista.Items.Count) { Avisar 'Adicione pelo menos uma pasta antes de salvar.'; return }
        $janela.Tag = [string[]]@($lista.Items)
        $janela.DialogResult = [System.Windows.Forms.DialogResult]::OK
    })
    $cancelar = [System.Windows.Forms.Button]::new()
    $cancelar.Text = 'Cancelar'
    $cancelar.SetBounds(577, 305, 107, 30)
    $cancelar.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $janela.AcceptButton = $adicionar
    $janela.CancelButton = $cancelar
    $janela.Controls.AddRange(@($rotulo, $campo, $exemplo, $procurar, $adicionar, $lista, $remover, $salvar, $cancelar))
    try {
        if ($janela.ShowDialog() -ne 'OK') { return $false }
        $pastasSelecionadas = [string[]]$janela.Tag
        $novo = @{ fontes = @(@{ id = 'expedicao'; nome = "Pastas de XML ($($pastasSelecionadas.Count))"; tipo = 'pastas'; pastas = @($pastasSelecionadas); recursivo = $true }) }
        New-Item -ItemType Directory -Path $dados -Force | Out-Null
        $temporario = Join-Path $dados 'config.tmp'
        [System.IO.File]::WriteAllText($temporario, ($novo | ConvertTo-Json -Depth 5), [System.Text.UTF8Encoding]::new($false))
        Move-Item -LiteralPath $temporario -Destination $config -Force
        Avisar 'Pastas salvas. A configuracao sera mantida nas proximas aberturas.'
        return $true
    } finally { $script:janelaPasta = $null; $janela.Dispose() }
}
function PararServico {
    if ($script:processo) {
        if (!$script:processo.HasExited) { $script:processo.Kill(); $script:processo.WaitForExit() }
        $script:processo.Dispose()
        $script:processo = $null
    }
}
function IniciarServico {
    $scriptServidor = Join-Path $raiz 'integracao\servidor.cjs'
    $ocupadas = @(Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue)
    foreach ($ocupada in $ocupadas) {
        $ocupante = Get-CimInstance Win32_Process -Filter "ProcessId=$($ocupada.OwningProcess)"
        if ($ocupante -and $ocupante.Name -eq 'node.exe' -and $ocupante.CommandLine.Contains('"' + $scriptServidor + '"')) {
            $paiOcupante = Get-CimInstance Win32_Process -Filter "ProcessId=$($ocupante.ParentProcessId)"
            if (!$paiOcupante) { Stop-Process -Id $ocupante.ProcessId -ErrorAction Stop }
        }
    }
    $info = [System.Diagnostics.ProcessStartInfo]::new()
    $info.FileName = $node
    $info.Arguments = '"' + (Join-Path $raiz 'integracao\servidor.cjs') + '"'
    $info.WorkingDirectory = $raiz
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.EnvironmentVariables['ETIQUETAS_CONFIG'] = $config
    $info.EnvironmentVariables['ETIQUETAS_DESKTOP'] = '1'
    $info.EnvironmentVariables['ETIQUETAS_PARENT_PID'] = "$PID"
    $info.EnvironmentVariables['PORT'] = "$Porta"
    $script:processo = [System.Diagnostics.Process]::Start($info)
    $leitura = $script:processo.StandardOutput.ReadLineAsync()
    if (!$leitura.Wait(10000) -or !$leitura.Result) { PararServico; throw 'Servico indisponivel. A porta pode estar ocupada ou a configuracao invalida.' }
    $inicio = $leitura.Result | ConvertFrom-Json
    $script:token = $inicio.token
}
function AbrirAplicativo {
    if (!$script:processo -or $script:processo.HasExited) { PararServico; IniciarServico }
    $sessao = Invoke-RestMethod -Uri "$script:base/api/sessao" -Method Post -Headers @{ Authorization = "Bearer $script:token" } -TimeoutSec 10
    Start-Process ($script:base + $sessao.caminho) -WindowStyle Hidden
}
$icone = $null
$timer = $null
try {
    if (!$Verificar) { New-Item -ItemType Directory -Path $dados -Force | Out-Null }
    $timer = [System.Windows.Forms.Timer]::new()
    $timer.Interval = 500
    $timer.add_Tick({
        if ($evento.WaitOne(0)) {
            try {
                if ($script:janelaPasta) { $script:janelaPasta.Activate(); $script:janelaPasta.BringToFront() }
                elseif ($script:processo) { AbrirAplicativo }
            } catch { Avisar $_.Exception.Message }
        }
    })
    $timer.Start()
    if (!(Test-Path -LiteralPath $node)) { throw 'Node.js nao encontrado. Este prototipo requer Node.js 22 ou superior.' }
    if ($Verificar) {
        IniciarServico
        $sessao = Invoke-RestMethod -Uri "$script:base/api/sessao" -Method Post -Headers @{ Authorization = "Bearer $script:token" } -TimeoutSec 10
        $resposta = Invoke-WebRequest -Uri ($script:base + $sessao.caminho) -UseBasicParsing -SessionVariable navegador
        $fontes = Invoke-RestMethod -Uri "$script:base/api/fontes" -WebSession $navegador
        if (!$fontes.desktop -or $resposta.StatusCode -ne 200) { throw 'Falha na sessao automatica.' }
        Write-Output 'Iniciador: servico e sessao automatica verificados.'
        return
    }
    if (!(Test-Path -LiteralPath $config)) { EscolherPasta | Out-Null }
    IniciarServico
    $icone = [System.Windows.Forms.NotifyIcon]::new()
    $icone.Icon = [System.Drawing.SystemIcons]::Application
    $icone.Text = 'Etiquetas de Expedicao'
    $menu = [System.Windows.Forms.ContextMenuStrip]::new()
    $abrir = $menu.Items.Add('Abrir etiquetas')
    $abrir.add_Click({ try { AbrirAplicativo } catch { Avisar $_.Exception.Message } })
    $pastas = $menu.Items.Add('Configurar pastas dos XMLs')
    $pastas.add_Click({ try { if (EscolherPasta) { PararServico; IniciarServico; AbrirAplicativo } } catch { Avisar $_.Exception.Message } })
    $sair = $menu.Items.Add('Encerrar')
    $sair.add_Click({ [System.Windows.Forms.Application]::ExitThread() })
    $icone.ContextMenuStrip = $menu
    $icone.add_DoubleClick({ try { AbrirAplicativo } catch { Avisar $_.Exception.Message } })
    $icone.Visible = $true
    AbrirAplicativo
    [System.Windows.Forms.Application]::Run()
} catch {
    if (!$Verificar) { try { [System.IO.File]::WriteAllText((Join-Path $dados 'ultimo-erro.txt'), $_.Exception.ToString()) } catch { } }
    if ($Verificar) { throw } else { Avisar $_.Exception.Message }
}
finally {
    if ($timer) { $timer.Stop(); $timer.Dispose() }
    if ($icone) { $icone.Visible = $false; $icone.ContextMenuStrip.Dispose(); $icone.Dispose() }
    PararServico
    $evento.Dispose()
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
