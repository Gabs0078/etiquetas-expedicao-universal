if (!(Get-Command T -ErrorAction SilentlyContinue)) { . (Join-Path $PSScriptRoot 'idiomas.ps1') }
function SalvarModoSimples([string]$ArquivoConfig) {
    if (!(Test-Path -LiteralPath $ArquivoConfig)) { [IO.File]::WriteAllText($ArquivoConfig, '{"fontes":[]}', [Text.UTF8Encoding]::new($false)) }
}
function MostrarPrimeiroUso {
    $form = New-Object Windows.Forms.Form
    AplicarIconeTagEX $form
    $form.Text = (T 'Bem-vindo ao TagEX'); $form.ClientSize = New-Object Drawing.Size(620,450)
    $form.StartPosition = 'CenterScreen'; $form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false
    $form.Font = New-Object Drawing.Font('Segoe UI',10); $form.BackColor = [Drawing.Color]::White
    $titulo = New-Object Windows.Forms.Label; $titulo.SetBounds(28,22,560,40); $titulo.Text = (T 'Como você quer começar?')
    $titulo.Font = New-Object Drawing.Font('Segoe UI',18,[Drawing.FontStyle]::Bold)
    $texto = New-Object Windows.Forms.Label; $texto.SetBounds(28,76,560,50); $texto.Text = (T 'O TagEX já está pronto para usar neste computador. Você pode configurar as pastas da empresa depois.')
    $simples = New-Object Windows.Forms.Button; $simples.SetBounds(28,144,560,50); $simples.Text = (T 'Importar XMLs ou preencher manualmente')
    $dica = New-Object Windows.Forms.Label; $dica.SetBounds(38,202,540,42); $dica.Text = (T 'Funciona sem internet. Use XMLs salvos no computador ou digite as informações.')
    $pastas = New-Object Windows.Forms.Button; $pastas.SetBounds(28,258,560,50); $pastas.Text = (T 'Configurar busca nas pastas da empresa')
    $rede = New-Object Windows.Forms.Label; $rede.SetBounds(38,316,540,56); $rede.Text = (T 'O assistente ajuda a selecionar e testar as pastas. Pastas compartilhadas exigem acesso à rede ou VPN da empresa.')
    $form.Controls.AddRange(@($titulo,$texto,$simples,$dica,$pastas,$rede))
    $seletorIdioma=AdicionarSeletorIdiomaTagEX $form 28 400 260
    $script:escolhaInicio = ''
    $simples.add_Click({ $script:escolhaInicio = 'simples'; $form.Close() })
    $pastas.add_Click({ $script:escolhaInicio = 'pastas'; $form.Close() })
    try { $form.ShowDialog() | Out-Null; return $script:escolhaInicio } finally { $form.Dispose() }
}
