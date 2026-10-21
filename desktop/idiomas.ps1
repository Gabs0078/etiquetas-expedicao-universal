# UI language only. XML data and fiscal parsing remain unchanged.
$script:CatalogoTagEX = [Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
$script:MensagensEmitidasTagEX = [Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
$arquivoIdiomas = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/i18n/catalogs.json'
foreach ($linha in (ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($arquivoIdiomas)))) { $script:CatalogoTagEX[([string]$linha[0]).Replace("`r`n","`n")] = $linha }
$script:IdiomaTagEX = 'en'
$script:PreferenciaIdiomaTagEX = Join-Path $env:LOCALAPPDATA 'EtiquetasExpedicao/idioma.json'
try {
    $salvo = (Get-Content -LiteralPath $script:PreferenciaIdiomaTagEX -Raw -ErrorAction Stop | ConvertFrom-Json).language
    if ($salvo -in @('en','pt-BR','es','zh-Hans')) { $script:IdiomaTagEX = $salvo }
} catch {}
if ($env:TAGEX_UI_LANGUAGE -in @('en','pt-BR','es','zh-Hans')) { $script:IdiomaTagEX = $env:TAGEX_UI_LANGUAGE }
function T([string]$Texto, [object[]]$Valores = @()) {
    $formato = $Texto
    $chave = $Texto.Replace("`r`n","`n")
    if ($script:CatalogoTagEX.ContainsKey($chave)) {
        $coluna = @{en=1;'pt-BR'=0;es=2;'zh-Hans'=3}[$script:IdiomaTagEX]
        $formato = [string]$script:CatalogoTagEX[$chave][$coluna]
    }
    $resultado = [regex]::Replace($formato,'\{(\d+)\}',{param($m) $indice=[int]$m.Groups[1].Value;if($indice -lt $Valores.Count){[string]$Valores[$indice]}else{$m.Value}})
    $script:MensagensEmitidasTagEX[$resultado] = @{Texto=$Texto;Valores=$Valores}
    return $resultado
}
function LocalizarJanelaTagEX($Controle) {
    if ($Controle -isnot [Windows.Forms.TextBox] -and $Controle -isnot [Windows.Forms.ComboBox] -and $Controle -isnot [Windows.Forms.ListBox]) {
        if ($script:MensagensEmitidasTagEX.ContainsKey($Controle.Text)) { $origem=$script:MensagensEmitidasTagEX[$Controle.Text]; $Controle.Text=T $origem.Texto $origem.Valores }
    }
    foreach ($filho in $Controle.Controls) { LocalizarJanelaTagEX $filho }
}
function AplicarIconeTagEX($Janela) {
    $iconeJanela = [Drawing.Icon]::new((Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/icons/app-icon.ico'),[Drawing.Size]::new(32,32))
    $Janela.Icon = $iconeJanela
    $Janela.add_Disposed({ $iconeJanela.Dispose() }.GetNewClosure())
}
function AdicionarSeletorIdiomaTagEX($Janela,[int]$X,[int]$Y,[int]$Largura=210) {
    $combo = New-Object Windows.Forms.ComboBox
    $combo.SetBounds($X,$Y,$Largura,28); $combo.DropDownStyle='DropDownList'
    $combo.Items.AddRange(@('English','Português (Brasil)','Español','简体中文'))
    $combo.SelectedIndex = [array]::IndexOf(@('en','pt-BR','es','zh-Hans'),$script:IdiomaTagEX)
    $combo.add_SelectedIndexChanged({
        $script:IdiomaTagEX=@('en','pt-BR','es','zh-Hans')[$this.SelectedIndex]
        New-Item -ItemType Directory -Path (Split-Path $script:PreferenciaIdiomaTagEX -Parent) -Force | Out-Null
        [IO.File]::WriteAllText($script:PreferenciaIdiomaTagEX,(@{language=$script:IdiomaTagEX}|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
        LocalizarJanelaTagEX ($this.FindForm())
    })
    $Janela.Controls.Add($combo)
    return $combo
}
