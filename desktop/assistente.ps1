# Carregado pelo iniciador em Windows PowerShell 5.1, STA.
function ConfigurarInicioAutomatico([bool]$Ativar) {
    $chave = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
    if ($Ativar) {
        $comando = 'powershell.exe -NoProfile -WindowStyle Hidden -STA -ExecutionPolicy Bypass -File "' + (Join-Path $PSScriptRoot 'iniciar.ps1') + '"'
        New-Item -Path $chave -Force | Out-Null
        New-ItemProperty -Path $chave -Name 'EtiquetasExpedicao' -Value $comando -PropertyType String -Force | Out-Null
    } else { Remove-ItemProperty -Path $chave -Name 'EtiquetasExpedicao' -ErrorAction SilentlyContinue }
}
function ConverterResultadoDiagnostico([string]$Json) {
    $itens = ConvertFrom-Json -InputObject $Json
    $blocos = foreach ($item in $itens) {
        $linhas = @([string]$item.pasta, [string]$item.mensagem)
        if ($null -ne $item.notas) { $linhas += ('Notas válidas na amostra: ' + $item.notas) }
        if ($null -ne $item.avisos) { $linhas += ('Ocorrências no teste (arquivos ou subpastas): ' + $item.avisos) }
        if ($item.limitado) { $linhas += 'Amostra de até 100 entradas. A busca diária poderá encontrar outras notas.' }
        $linhas -join "`r`n"
    }
    [pscustomobject]@{ Resultados = @($itens); Texto = ($blocos -join "`r`n`r`n") }
}
function ResumirDiagnostico($Resultados) {
    $itens=@($Resultados)
    $semAcesso=@($itens | Where-Object {$_.estado -in @('sem-acesso','inexistente','indisponivel')})
    $acessiveis=@($itens | Where-Object {$_.estado -notin @('sem-acesso','inexistente','indisponivel')})
    $notas=0; $avisos=0
    foreach($item in $acessiveis){$notas+=[int]$item.notas; $avisos+=[int]$item.avisos}
    $linhas=@(('Pastas acessíveis: '+$acessiveis.Count+' de '+$itens.Count),('Notas válidas na amostra: '+$notas))
    if($avisos){$linhas+='Alguns arquivos ou subpastas não foram aproveitados. Isso não impede salvar as pastas acessíveis.'}
    if($semAcesso.Count){$linhas+=('Sem acesso agora: '+$semAcesso.Count+' pasta(s). Desmarcada a opção abaixo, elas não serão salvas.')}
    [pscustomobject]@{Acessiveis=$acessiveis; SemAcesso=$semAcesso; Notas=$notas; Avisos=$avisos; Texto=($linhas -join "`r`n")}
}
function EscolherPasta {
    $anterior = if (Test-Path -LiteralPath $config) { Get-Content -LiteralPath $config -Raw | ConvertFrom-Json } else { [pscustomobject]@{fontes=@()} }
    $script:assist = @{ etapa=0; processo=$null; leitura=$null; entrada=$null; inicio=$null; resultados=@(); testadas=@(); retorno=$false }
    $janela = New-Object System.Windows.Forms.Form
    $janela.Text = 'Assistente de integração — Etiquetas'
    $janela.ClientSize = New-Object System.Drawing.Size(740,540)
    $janela.StartPosition = 'CenterScreen'; $janela.FormBorderStyle='FixedDialog'; $janela.MaximizeBox=$false
    $janela.Font=New-Object System.Drawing.Font('Segoe UI',10)
    $janela.BackColor=[System.Drawing.Color]::White
    $script:janelaPasta = $janela
    $titulo = New-Object System.Windows.Forms.Label
    $titulo.SetBounds(24,20,690,30); $titulo.Font = New-Object System.Drawing.Font('Segoe UI',14,[System.Drawing.FontStyle]::Bold)
    $texto = New-Object System.Windows.Forms.Label
    $texto.SetBounds(24,58,690,60)
    $campo = New-Object System.Windows.Forms.TextBox; $campo.SetBounds(24,130,470,28)
    $procurar = New-Object System.Windows.Forms.Button; $procurar.Text='Selecionar pasta'; $procurar.SetBounds(506,128,120,30)
    $adicionar = New-Object System.Windows.Forms.Button; $adicionar.Text='Adicionar'; $adicionar.SetBounds(632,128,84,30)
    $lista = New-Object System.Windows.Forms.ListBox; $lista.SetBounds(24,170,692,230); $lista.HorizontalScrollbar=$true
    foreach($fonte in $anterior.fontes) { foreach($pasta in $fonte.pastas) { if (!$lista.Items.Contains($pasta)) { $lista.Items.Add([string]$pasta) | Out-Null } } }
    $remover=New-Object System.Windows.Forms.Button; $remover.Text='Remover selecionada'; $remover.SetBounds(24,411,165,30)
    $resultado=New-Object System.Windows.Forms.TextBox; $resultado.Multiline=$true; $resultado.ReadOnly=$true; $resultado.ScrollBars='Vertical'; $resultado.SetBounds(24,250,692,155)
    $automatico=New-Object System.Windows.Forms.CheckBox; $automatico.Text='Iniciar automaticamente quando eu entrar no Windows'; $automatico.SetBounds(24,405,692,28)
    $automatico.Checked = !!(Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'EtiquetasExpedicao' -ErrorAction SilentlyContinue)
    $pendentes=New-Object System.Windows.Forms.CheckBox; $pendentes.Text='Guardar também as pastas sem acesso para tentar novamente depois'; $pendentes.SetBounds(24,416,690,38)
    $voltar=New-Object System.Windows.Forms.Button; $voltar.Text='Voltar'; $voltar.SetBounds(24,480,110,34)
    $cancelar=New-Object System.Windows.Forms.Button; $cancelar.Text='Cancelar'; $cancelar.SetBounds(382,480,110,34); $cancelar.DialogResult='Cancel'
    $continuar=New-Object System.Windows.Forms.Button; $continuar.SetBounds(504,480,212,34)
    $resumo=New-Object System.Windows.Forms.Label; $resumo.SetBounds(24,130,692,112)
    $painel=New-Object System.Windows.Forms.TextBox; $painel.SetBounds(24,140,692,240)
    $painel.Multiline=$true; $painel.ReadOnly=$true; $painel.BorderStyle='None'; $painel.ScrollBars='Vertical'
    $painel.BackColor=[System.Drawing.Color]::FromArgb(245,247,250); $painel.Padding=New-Object System.Windows.Forms.Padding(16)
    $ajudaInicio=New-Object System.Windows.Forms.Label; $ajudaInicio.SetBounds(45,437,660,32)
    $ajudaInicio.Text='Recomendado para buscar notas sem precisar abrir o atalho antes.'
    $ajudaInicio.ForeColor=[System.Drawing.Color]::DimGray
    $janela.Controls.AddRange(@($resumo,$painel,$ajudaInicio))
    $janela.Controls.AddRange(@($titulo,$texto,$campo,$procurar,$adicionar,$lista,$remover,$resultado,$automatico,$pendentes,$voltar,$cancelar,$continuar))
    $janela.CancelButton=$cancelar
    $mostrar={
        $etapa=$script:assist.etapa
        $titulo.Text=@('1 de 4 — Entender a busca de notas','2 de 4 — Adicionar pastas de XMLs','3 de 4 — Conferir o teste das pastas','4 de 4 — Salvar e começar a usar')[$etapa]
        $texto.Text=@('A integração permite encontrar notas fiscais sem importar um XML de cada vez.','Selecione uma pasta ou cole o endereço completo e clique em Adicionar. As subpastas também serão consultadas.','O teste apenas lê uma amostra dos arquivos; não altera nem move seus XMLs. Confira o resultado abaixo.','Confira o que será salvo. Depois, use Buscar nota no aplicativo para localizar suas notas fiscais.')[ $etapa ]
        foreach($c in @($campo,$procurar,$adicionar,$lista,$remover)) { $c.Visible=($etapa -eq 1) }
        $resultado.Visible=($etapa -eq 2)
        $resumo.Visible=($etapa -eq 2)
        $painel.Visible=($etapa -eq 0 -or $etapa -eq 3)
        $ajudaInicio.Visible=($etapa -eq 3)
        if($etapa -eq 0){$painel.Text="Como funciona`r`n`r`n1. Você informa onde a empresa salva os XMLs.`r`n2. O assistente verifica se essas pastas podem ser lidas.`r`n3. Você salva e passa a buscar as notas no aplicativo.`r`n`r`nOs arquivos originais permanecem nas pastas. Sua conta do Windows precisa ter acesso a elas."}
        $classificacao=ResumirDiagnostico $script:assist.resultados
        if($etapa -eq 2){
            $resumo.Text=if($script:assist.processo){'Verificando acesso e procurando notas...'}elseif($script:assist.resultados.Count){$classificacao.Texto}else{'Teste não concluído. Volte à etapa 2 para tentar novamente.'}
        }
        if($etapa -eq 3){
            $salvas=@($script:assist.selecionadas)
            $guardadas=if($pendentes.Checked){$classificacao.SemAcesso.Count}else{0}
            $painel.Text="Resumo da configuração`r`n`r`nPastas que serão salvas: $($salvas.Count)`r`nAcessíveis agora: $($classificacao.Acessiveis.Count)`r`nGuardadas para tentar depois: $guardadas`r`n`r`n"+($salvas -join "`r`n")
        }
        $automatico.Visible=($etapa -eq 3); $pendentes.Visible=($etapa -eq 2 -and $classificacao.SemAcesso.Count -gt 0 -and !$script:assist.processo)
        $voltar.Enabled=($etapa -gt 0 -and !$script:assist.processo)
        $continuar.Text=@('Escolher pastas','Testar pastas','Revisar configuração','Salvar e abrir etiquetas')[ $etapa ]
        $continuar.Enabled=(!$script:assist.processo)
    }
    $procurar.add_Click({ $seletor=New-Object System.Windows.Forms.FolderBrowserDialog; $seletor.ShowNewFolderButton=$false; try { if($seletor.ShowDialog($janela) -eq 'OK') { $campo.Text=$seletor.SelectedPath } } finally {$seletor.Dispose()} })
    $incluir={
        $p=$campo.Text.Trim()
        if (!$p) { return }
        if (![IO.Path]::IsPathRooted($p)) { Avisar 'Escolha uma pasta ou cole um endereço completo.'; return }
        $p=[IO.Path]::GetFullPath($p)
        if (!$lista.Items.Contains($p)) { $lista.Items.Add($p) | Out-Null }; $campo.Clear(); $pendentes.Checked=$false
    }
    $adicionar.add_Click($incluir)
    $remover.add_Click({ if($lista.SelectedIndex -ge 0){$lista.Items.RemoveAt($lista.SelectedIndex); $pendentes.Checked=$false} })
    $voltar.add_Click({$script:assist.etapa--; & $mostrar})
    $poll=New-Object System.Windows.Forms.Timer; $poll.Interval=250
    $poll.add_Tick({
        if (!$script:assist.processo) { return }
        if (!$script:assist.processo.HasExited -and ((Get-Date)-$script:assist.inicio).TotalSeconds -lt 30) { return }
        try {
            if (!$script:assist.processo.HasExited) { $script:assist.processo.Kill(); $script:assist.processo.WaitForExit(); throw 'O teste demorou mais de 30 segundos. Confira a rede ou teste menos pastas por vez.' }
            if($script:assist.processo.ExitCode -ne 0) { throw 'Não foi possível testar. Confira o runtime e as dependências do aplicativo.' }
            $apresentacao=ConverterResultadoDiagnostico $script:assist.leitura.Result
            $script:assist.resultados=$apresentacao.Resultados
            $resultado.Text=$apresentacao.Texto
        } catch { $resultado.Text=$_.Exception.Message; $script:assist.resultados=@() }
        finally { $script:assist.processo.Dispose(); $script:assist.processo=$null; if($script:assist.entrada){Remove-Item -LiteralPath $script:assist.entrada -ErrorAction SilentlyContinue}; & $mostrar }
    })
    $continuar.add_Click({
        try {
            switch($script:assist.etapa) {
                0 { $script:assist.etapa=1 }
                1 {
                    & $incluir; if($campo.Text -or !$lista.Items.Count) { Avisar 'Adicione ao menos uma pasta.'; return }
                    $script:assist.testadas=@($lista.Items); $script:assist.resultados=@(); $pendentes.Checked=$false
                    $script:assist.entrada=Join-Path $dados ('diagnostico-'+[guid]::NewGuid().ToString()+'.json')
                    [IO.File]::WriteAllText($script:assist.entrada,(@{pastas=@($lista.Items)} | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
                    $info=New-Object Diagnostics.ProcessStartInfo; $info.FileName=$node
                    $info.Arguments='"'+(Join-Path $PSScriptRoot 'diagnostico.cjs')+'" "'+$script:assist.entrada+'"'
                    $info.UseShellExecute=$false; $info.CreateNoWindow=$true; $info.RedirectStandardOutput=$true; $info.StandardOutputEncoding=[Text.Encoding]::UTF8
                    $script:assist.processo=[Diagnostics.Process]::Start($info); $script:assist.leitura=$script:assist.processo.StandardOutput.ReadToEndAsync(); $script:assist.inicio=Get-Date
                    $script:assist.etapa=2; $resultado.Text='Teste das pastas em andamento. Você pode cancelar.'
                }
                2 {
                    if(!$script:assist.resultados.Count) { Avisar 'Volte e tente testar novamente.'; return }
                    $r=ResumirDiagnostico $script:assist.resultados
                    $script:assist.selecionadas=@($r.Acessiveis | ForEach-Object {$_.pasta})
                    if($pendentes.Checked){$script:assist.selecionadas+=@($r.SemAcesso | ForEach-Object {$_.pasta})}
                    if(!$script:assist.selecionadas.Count){Avisar 'Nenhuma pasta está acessível. Volte para corrigir os endereços ou marque Guardar também as pastas sem acesso para configurar e tentar depois.'; return}
                    $script:assist.etapa=3
                }
                3 {
                    $escolhidas=@($script:assist.selecionadas); $fontes=New-Object Collections.ArrayList; $conhecidas=@()
                    foreach($f in $anterior.fontes) {
                        if($f.tipo -ne 'pastas') { $fontes.Add($f) | Out-Null; continue }
                        $mantidas=@($f.pastas | Where-Object {$escolhidas -contains $_})
                        if($mantidas.Count) { $f.pastas=$mantidas; $fontes.Add($f) | Out-Null; $conhecidas+=$mantidas }
                    }
                    $novas=@($escolhidas | Where-Object {$conhecidas -notcontains $_})
                    if($novas.Count) { $fontes.Add([pscustomobject]@{id=('pastas-'+[guid]::NewGuid().ToString('N').Substring(0,8));nome='Pastas de notas';tipo='pastas';pastas=$novas;recursivo=$true}) | Out-Null }
                    $anterior.fontes=@($fontes)
                    $tmp=Join-Path $dados 'config.tmp'
                    [IO.File]::WriteAllText($tmp,($anterior | ConvertTo-Json -Depth 12),[Text.UTF8Encoding]::new($false))
                    $script:configTinhaAnterior = Test-Path -LiteralPath $config
                    if($script:configTinhaAnterior){Copy-Item -LiteralPath $config -Destination ($config+'.bak') -Force}
                    Move-Item -LiteralPath $tmp -Destination $config -Force
                    $script:inicioDesejado=$automatico.Checked
                    $script:assist.retorno=$true; $janela.DialogResult='OK'
                }
            }; & $mostrar
        } catch { Avisar $_.Exception.Message }
    })
    try {
        $versao=& $node --version
        if([int]($versao.TrimStart('v').Split('.')[0]) -lt 24){throw 'O pacote precisa incluir Node.js 24 ou superior.'}
        & $node -e "require(process.argv[1])" (Join-Path $raiz 'node_modules/@xmldom/xmldom') 2>$null
        if($LASTEXITCODE -ne 0){throw 'Dependências ausentes. Reinstale o pacote do aplicativo.'}
        New-Item -ItemType Directory -Path $dados -Force | Out-Null
        $resultado.Text='Runtime e dependências disponíveis. As permissões das pastas serão verificadas na etapa 3.'
        & $mostrar; $poll.Start(); $janela.ShowDialog() | Out-Null
        return $script:assist.retorno
    } finally {
        $poll.Stop(); $poll.Dispose()
        if($script:assist.processo){if(!$script:assist.processo.HasExited){$script:assist.processo.Kill();$script:assist.processo.WaitForExit()};$script:assist.processo.Dispose()}
        if($script:assist.entrada){Remove-Item -LiteralPath $script:assist.entrada -ErrorAction SilentlyContinue}
        $script:janelaPasta=$null; $janela.Dispose()
    }
}
function AplicarIntegracao([switch]$SemAbrir) {
    try {
        PararServico; IniciarServico
        $diagnostico=Invoke-RestMethod -Uri "$script:base/api/diagnostico" -Headers @{Authorization="Bearer $script:token"} -TimeoutSec 35
        $r=ResumirDiagnostico $diagnostico.pastas
        ConfigurarInicioAutomatico $script:inicioDesejado
        $mensagem=if($r.Acessiveis.Count){"Configuração salva. $($r.Acessiveis.Count) pasta(s) acessível(is). Use Buscar nota no aplicativo."}else{'Configuração salva. As pastas ainda estão sem acesso; confira a conexão ao servidor antes de buscar notas.'}
        if($r.SemAcesso.Count){$mensagem+="`r`n$($r.SemAcesso.Count) pasta(s) guardada(s) para tentar novamente depois."}
        if($r.Avisos){$mensagem+="`r`nAlguns arquivos ou subpastas não foram aproveitados no teste. As notas válidas continuam disponíveis."}
        Avisar $mensagem
        if(!$SemAbrir){AbrirAplicativo}
    } catch {
        PararServico
        if($script:configTinhaAnterior -and (Test-Path -LiteralPath ($config+'.bak'))){Copy-Item -LiteralPath ($config+'.bak') -Destination $config -Force}
        try {IniciarServico; AbrirAplicativo} catch {}
        Avisar 'Não foi possível concluir a verificação. A configuração anterior foi recuperada quando disponível. Você pode tentar novamente pelo ícone do aplicativo.'
    }
}
