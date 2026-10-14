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
. (Join-Path $PSScriptRoot 'assistente.ps1')
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
    $info.Arguments = '--max-old-space-size=96 "' + (Join-Path $raiz 'integracao\servidor.cjs') + '"'
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
    $timer.Interval = 1500
    $timer.add_Tick({
        if ($script:processo -and !$script:janelaPasta -and !$script:processo.HasExited) {
            try {
                $controle = Invoke-RestMethod -Uri "$script:base/api/controle" -Headers @{ Authorization = "Bearer $script:token" } -TimeoutSec 1
                if ($controle.abrirAssistente) { if (EscolherPasta) { AplicarIntegracao } }
            } catch { }
        }
        if ($evento.WaitOne(0)) {
            try {
                if ($script:janelaPasta) { $script:janelaPasta.Activate(); $script:janelaPasta.BringToFront() }
                elseif ($script:processo) { AbrirAplicativo }
            } catch { Avisar $_.Exception.Message }
        }
    })
    $timer.Start()
    if (!(Test-Path -LiteralPath $node)) { throw 'Node.js nao encontrado. Este aplicativo requer Node.js 24 ou superior.' }
    if ($Verificar) {
        IniciarServico
        $sessao = Invoke-RestMethod -Uri "$script:base/api/sessao" -Method Post -Headers @{ Authorization = "Bearer $script:token" } -TimeoutSec 10
        $resposta = Invoke-WebRequest -Uri ($script:base + $sessao.caminho) -UseBasicParsing -SessionVariable navegador
        $fontes = Invoke-RestMethod -Uri "$script:base/api/fontes" -WebSession $navegador
        if (!$fontes.desktop -or $resposta.StatusCode -ne 200) { throw 'Falha na sessao automatica.' }
        Write-Output 'Iniciador: servico e sessao automatica verificados.'
        return
    }
    if (!(Test-Path -LiteralPath $config)) { if (EscolherPasta) { AplicarIntegracao -SemAbrir } }
    if (!$script:processo -or $script:processo.HasExited) { IniciarServico }
    $icone = [System.Windows.Forms.NotifyIcon]::new()
    $icone.Icon = [System.Drawing.SystemIcons]::Application
    $icone.Text = 'Etiquetas de Expedicao'
    $menu = [System.Windows.Forms.ContextMenuStrip]::new()
    $abrir = $menu.Items.Add('Abrir etiquetas')
    $abrir.add_Click({ try { AbrirAplicativo } catch { Avisar $_.Exception.Message } })
    $pastas = $menu.Items.Add('Configurar pastas dos XMLs')
    $pastas.add_Click({ try { if (EscolherPasta) { AplicarIntegracao } } catch { Avisar $_.Exception.Message } })
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
