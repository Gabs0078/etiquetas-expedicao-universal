param([string]$Destino = (Join-Path $env:LOCALAPPDATA 'Programs\TagEX'), [switch]$SemInterface, [switch]$SemAtalhos)
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
$form.Text = 'Instalar TagEX'; $form.ClientSize = New-Object Drawing.Size(600,410)
$form.StartPosition = 'CenterScreen'; $form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false
$form.Font = New-Object Drawing.Font('Segoe UI',10); $form.BackColor = [Drawing.Color]::White
$titulo = New-Object Windows.Forms.Label; $titulo.SetBounds(28,24,540,36); $titulo.Text = 'TagEX no seu computador'; $titulo.Font = New-Object Drawing.Font('Segoe UI',18,[Drawing.FontStyle]::Bold)
$texto = New-Object Windows.Forms.Label; $texto.SetBounds(28,78,540,80)
$texto.Text = 'Instala somente para sua conta do Windows. Inclui os componentes necessários: não é preciso instalar Node.js nem usar comandos.'
$local = New-Object Windows.Forms.Label; $local.SetBounds(28,160,540,52); $local.Text = "Local de instalação: $Destino"; $local.ForeColor = [Drawing.Color]::DimGray
$atalho = New-Object Windows.Forms.CheckBox; $atalho.SetBounds(28,220,540,30); $atalho.Text = 'Criar atalho na área de trabalho'; $atalho.Checked = $true
$status = New-Object Windows.Forms.Label; $status.SetBounds(28,260,540,82)
$status.Text = 'Depois de instalar, escolha entre importar XMLs, preencher manualmente ou configurar pastas. O uso local não precisa de internet.'
$instalar = New-Object Windows.Forms.Button; $instalar.SetBounds(342,354,230,36); $instalar.Text = 'Instalar'
$cancelar = New-Object Windows.Forms.Button; $cancelar.SetBounds(198,354,132,36); $cancelar.Text = 'Cancelar'; $cancelar.DialogResult = 'Cancel'
$form.Controls.AddRange(@($titulo,$texto,$local,$atalho,$status,$instalar,$cancelar)); $form.CancelButton = $cancelar
$script:instalou = $false
$instalar.add_Click({
    if ($script:instalou) { Start-Process -FilePath (Join-Path $Destino 'Abrir TagEX.exe') -WindowStyle Hidden; $form.Close(); return }
    $instalar.Enabled = $false; $cancelar.Enabled = $false; $form.ControlBox = $false
    $status.Text = 'Conferindo e copiando o aplicativo. Aguarde...'; $form.Refresh()
    try {
        $versao = InstalarPacoteTagEX $origem $Destino
        $script:instalou = $true
        $status.Text = "TagEX $versao instalado. Seus dados e pastas configuradas foram preservados."
        try { CriarAtalhosTagEX $Destino $atalho.Checked } catch { $status.Text = 'Instalado. Não foi possível criar todos os atalhos; use Abrir TagEX abaixo ou na pasta indicada.' }
        $instalar.Text = 'Abrir TagEX'; $cancelar.Text = 'Fechar'
    } catch { $status.Text = $_.Exception.Message }
    finally { $instalar.Enabled = $true; $cancelar.Enabled = $true; $form.ControlBox = $true }
})
try { $form.ShowDialog() | Out-Null } finally { $form.Dispose() }
