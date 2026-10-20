param([switch]$SemInterface, [switch]$SemAtalhos)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'instalacao.ps1')
$destino = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if (!(Test-Path -LiteralPath (Join-Path $destino 'tagex-install.json')) -or (Get-Content -LiteralPath (Join-Path $destino 'tagex-install.json') -Raw | ConvertFrom-Json).produto -ne 'TagEX') { throw 'Esta pasta não é uma instalação do TagEX.' }
if (!$SemInterface) {
    Add-Type -AssemblyName System.Windows.Forms
    $confirmar = [Windows.Forms.MessageBox]::Show('Remover o aplicativo TagEX? As pastas de XMLs, configurações e dados do navegador serão mantidos.', 'Desinstalar TagEX', 'YesNo', 'Question')
    if ($confirmar -ne 'Yes') { exit 0 }
}
try {
    ConferirTagEXFechado
    if ((Split-Path $destino -Leaf) -ne 'TagEX' -or (Get-Item -LiteralPath $destino).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Local de instalação inesperado; nada foi removido.' }
    if (!$SemAtalhos) {
        $wsh = New-Object -ComObject WScript.Shell
        foreach ($atalho in @((Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'TagEX.lnk'), (Join-Path ([Environment]::GetFolderPath('Programs')) 'TagEX\TagEX.lnk'))) {
            if ((Test-Path -LiteralPath $atalho) -and $wsh.CreateShortcut($atalho).TargetPath -eq (Join-Path $destino 'Abrir TagEX.exe')) { Remove-Item -LiteralPath $atalho }
        }
        $registro = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\TagEX'
        if ((Get-ItemProperty -Path $registro -ErrorAction SilentlyContinue).InstallLocation -eq $destino) { Remove-Item -LiteralPath $registro -Recurse }
        $inicio = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        $valor = (Get-ItemProperty -Path $inicio -Name 'EtiquetasExpedicao' -ErrorAction SilentlyContinue).EtiquetasExpedicao
        if ($valor -and $valor.Contains((Join-Path $destino 'desktop\iniciar.ps1'))) { Remove-ItemProperty -Path $inicio -Name 'EtiquetasExpedicao' }
    }
    # O destino foi obtido da própria pasta do script e conferido pelo marcador acima.
    Remove-Item -LiteralPath $destino -Recurse -Force
    if (!$SemInterface) { [Windows.Forms.MessageBox]::Show('Aplicativo removido. Seus dados foram mantidos.', 'TagEX') | Out-Null }
} catch {
    if ($SemInterface) { throw }
    [Windows.Forms.MessageBox]::Show($_.Exception.Message, 'TagEX') | Out-Null
}
