param([string]$Destino = (Join-Path $env:LOCALAPPDATA 'Programs\TagEX'), [switch]$SemInterface, [switch]$SemAtalhos)
if (!(Get-Command T -ErrorAction SilentlyContinue)) { . (Join-Path $PSScriptRoot 'idiomas.ps1') }

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'instalacao.ps1')
$origem = Split-Path $PSScriptRoot -Parent
if ($SemInterface) {
    $versao = InstalarPacoteTagEX $origem $Destino
    if (!$SemAtalhos) { CriarAtalhosTagEX $Destino $true }
    Write-Output ("TagEX $versao instalado em $Destino"); exit 0
}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$form = New-Object Windows.Forms.Form
AplicarIconeTagEX $form
$form.Text = (T 'Instalar TagEX'); $form.ClientSize = New-Object Drawing.Size(600,480)
$form.StartPosition = 'CenterScreen'; $form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false
$form.Font = New-Object Drawing.Font('Segoe UI',10); $form.BackColor = [Drawing.Color]::White
$titulo = New-Object Windows.Forms.Label; $titulo.SetBounds(28,24,540,36); $titulo.Text = (T 'TagEX no seu computador'); $titulo.Font = New-Object Drawing.Font('Segoe UI',18,[Drawing.FontStyle]::Bold)
$texto = New-Object Windows.Forms.Label; $texto.SetBounds(28,78,540,80)
$texto.Text = (T 'Instala somente para sua conta do Windows. Inclui os componentes necessários: não é preciso instalar Node.js nem usar comandos.')
$local = New-Object Windows.Forms.Label; $local.SetBounds(28,160,540,52); $local.Text = (T 'Local de instalação: {0}' @($Destino)); $local.ForeColor = [Drawing.Color]::DimGray
$atalho = New-Object Windows.Forms.CheckBox; $atalho.SetBounds(28,220,540,30); $atalho.Text = (T 'Criar atalho na área de trabalho'); $atalho.Checked = $true
$status = New-Object Windows.Forms.Label; $status.SetBounds(28,260,540,82)
$status.Text = (T 'Depois de instalar, escolha entre importar XMLs, preencher manualmente ou configurar pastas. O uso local não precisa de internet.')
$instalar = New-Object Windows.Forms.Button; $instalar.SetBounds(342,424,230,36); $instalar.Text = (T 'Instalar')
$cancelar = New-Object Windows.Forms.Button; $cancelar.SetBounds(198,424,132,36); $cancelar.Text = (T 'Cancelar'); $cancelar.DialogResult = 'Cancel'
$form.Controls.AddRange(@($titulo,$texto,$local,$atalho,$status,$instalar,$cancelar)); $form.CancelButton = $cancelar
$seletorIdioma=AdicionarSeletorIdiomaTagEX $form 28 360 260
$script:instalou = $false
$instalar.add_Click({
    if ($script:instalou) { Start-Process -FilePath (Join-Path $Destino 'Abrir TagEX.exe') -WindowStyle Hidden; $form.Close(); return }
    $instalar.Enabled = $false; $cancelar.Enabled = $false; $form.ControlBox = $false
    $status.Text = (T 'Conferindo e copiando o aplicativo. Aguarde...'); $form.Refresh()
    try {
        $versao = InstalarPacoteTagEX $origem $Destino
        $script:instalou = $true
        $status.Text = (T 'TagEX {0} instalado. Seus dados e pastas configuradas foram preservados.' @($versao))
        try { CriarAtalhosTagEX $Destino $atalho.Checked } catch { $status.Text = (T 'Instalado. Não foi possível criar todos os atalhos; use Abrir TagEX abaixo ou na pasta indicada.') }
        $instalar.Text = (T 'Abrir TagEX'); $cancelar.Text = (T 'Fechar')
    } catch { $status.Text = $_.Exception.Message }
    finally { $instalar.Enabled = $true; $cancelar.Enabled = $true; $form.ControlBox = $true }
})
try { $form.ShowDialog() | Out-Null } finally { $form.Dispose() }
