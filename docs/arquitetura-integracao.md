# Instalação e manutenção da integração

## Dependências e execução
Windows, Windows PowerShell 5.1 em STA, Windows Forms e navegador. Node.js >=24 e @xmldom/xmldom são as dependências do serviço. A distribuição deve incluir desktop/runtime/node.exe e a dependência de produção; Playwright é apenas para desenvolvimento. A instalação é por usuário, sem serviço do Windows nem alteração de driver/firewall.

O iniciador usa mutex por usuário para impedir instâncias duplicadas, mantém o processo Node filho e oferece ícone de bandeja. O serviço escuta somente 127.0.0.1:8788. Abrir o atalho gera ingresso de uso único e cookie HttpOnly/SameSite=Strict. Não mude a porta sem considerar que os dados do navegador são vinculados ao endereço.

## Assistente e diagnóstico
desktop/assistente.ps1 implementa quatro etapas e reutiliza o iniciador. desktop/diagnostico.cjs usa o mesmo adaptador e parser da busca. A janela inicia processo de diagnóstico sem console, lê a saída de modo assíncrono e cancela o processo após 30 segundos. O teste não altera XMLs. O diagnóstico usa uma amostra de até 100 entradas por pasta; a busca normal continua com profundidade máxima 20 e até 10000 entradas por pasta. O limite é informado; ausência de notas numa amostra limitada não é apresentada como pasta vazia.

A configuração fica em %LOCALAPPDATA%/EtiquetasExpedicao/config.json. O assistente preserva propriedades das fontes existentes, remove apenas pastas desmarcadas e cria uma nova fonte para caminhos adicionais. Salva arquivo temporário e cópia config.json.bak antes de substituir. Se a aplicação falhar na conclusão e houver configuração anterior, o iniciador a restaura. Não colocar configurações reais, tokens ou XMLs privados no Git.

GET /api/diagnostico executa diagnóstico autenticado apenas das pastas configuradas em um processo filho fixo, limitado a 30 segundos; não aceita caminhos fornecidos pelo navegador. A conclusão usa essa verificação por amostra, evitando uma varredura completa antes de abrir o aplicativo.

POST /api/assistente solicita somente a abertura do assistente; exige autenticação local e as verificações de host/origem. GET /api/controle é exclusivo do segredo do iniciador, consome o sinal e não aceita somente cookie. Não há API para executar comandos ou escolher caminhos arbitrários. A bandeja verifica o sinal a cada 1,5 segundo. O processo existente precisa ser reiniciado após atualizar o código do iniciador.

Inicialização automática usa HKCU/Software/Microsoft/Windows/CurrentVersion/Run, entrada EtiquetasExpedicao, apontando para o iniciador em modo oculto. É opcional e é aplicada somente na conclusão. Não exige administrador. Antes de mover a instalação, desative e reative essa opção para atualizar o caminho. Para desinstalar, desative a inicialização e encerre pelo ícone antes de remover o pacote. Faça backup dos cadastros/lotes do navegador conforme a política da empresa.

## Testes e homologação
Execute node --test tests/*.test.cjs e BROWSER_CHANNEL=msedge node tests/navegador.cjs. O modo powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File desktop/iniciar.ps1 -Verificar -Porta 18788 -DiretorioDados <pasta de teste> verifica serviço/sessão sem abrir janelas.

Homologue manualmente a janela nativa: selecionar pasta local e UNC, Voltar, cancelar durante o teste, pasta vazia, falta de acesso, salvar mantendo avisos, renovar sessão e repetir com usuário padrão. Teste também login sem rede e ativação/desativação da inicialização automática. Testes automatizados não substituem essa homologação nem comprovam impressão física.

## Distribuição
Use desktop/empacotar.ps1 para criar um ZIP com aplicação, runtime e parser. O pacote precisa ser testado em uma conta padrão com Node global ausente. Não há instalador assinado ou atualizador nesta versão. Se políticas corporativas bloquearem PowerShell/Windows Script Host, o administrador precisa avaliar uma alternativa de distribuição; não reduzir proteções do sistema.

## Índice de pesquisa do desktop
O runtime Node.js 24 inclui node:sqlite; não é necessário instalar um banco separadamente. O serviço desktop guarda um SQLite por configuração/parser em %LOCALAPPDATA%/EtiquetasExpedicao/indice. O índice contém dados resumidos da pesquisa, caminhos e assinaturas de tamanho/data de alteração; não contém cópias dos XMLs. Fica fora do repositório e do ZIP.

Ao abrir, o índice salvo já pode ser consultado. Uma atualização ocorre em segundo plano e se repete a cada 60 segundos, sem sobrepor varreduras. São verificadas até quatro entradas simultâneas; apenas XMLs novos/alterados são lidos e processados. Exclusões são removidas quando a pasta é acessível e a leitura é completa; pastas indisponíveis preservam o índice com aviso. Conferir dados sempre relê o XML com validação de caminhos, links, tamanho e alterações durante gravação. Um arquivo inacessível não pode ser importado a partir do índice.

GET /api/indice exige a mesma autenticação das buscas e retorna progresso sem expor caminhos. A busca inicial pode retornar 202 enquanto o primeiro índice é preparado. Consultas usam SQLite com limite de 100 resultados. O número, chave, cliente e emitente mantêm os critérios anteriores. API do serviço genérico sem modo desktop mantém o adaptador direto anterior.

O iniciador limita o heap JavaScript a 96 MiB; isso não limita a memória total do processo, que inclui runtime, buffers e SQLite. A memória e o processador não são gratuitos: a preparação inicial custa mais, e as verificações posteriores consultam metadados. O objetivo é evitar releituras e processamento repetidos a cada pesquisa.
