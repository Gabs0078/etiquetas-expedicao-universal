# Guia do usuário

## Abrir e configurar
Abra o atalho Etiquetas de Expedição ou desktop/Abrir Etiquetas.vbs. Na primeira abertura, o assistente orienta quatro etapas: entender a busca, adicionar pastas, conferir o teste e salvar. Selecione pastas locais ou cole um endereço de rede. Subpastas são consultadas. O teste usa uma amostra de até 100 entradas por pasta, tem prazo máximo de 30 segundos e pode ser cancelado. A busca diária consulta um limite maior.

Pasta vazia pode ser configurada: o aplicativo aguardará novos XMLs. Avisos de arquivos não impedem continuar: pastas acessíveis são mantidas, mesmo vazias ou sem XMLs válidos na amostra. A caixa Guardar também as pastas sem acesso só aparece quando uma pasta não pode ser acessada. É opcional: marcada, salva essas pastas para tentar depois; desmarcada, salva apenas as acessíveis. A última etapa resume as pastas que serão salvas. Cancelar mantém a configuração anterior. A opção Iniciar a integração junto com o Windows é por usuário e pode ser desmarcada em uma nova configuração.

## Uso diário
1. Em Modo de Preenchimento, clique em Buscar nas pastas. Informe número ou cliente e, se necessário, datas.
2. Clique em Conferir dados, revise a nota e confirme a revisão.
3. Clique em Adicionar nota ao lote. Cada volume gera uma etiqueta. Repita para outras notas.
4. Escolha A4, 100 × 50, 80 × 35 ou 85 × 35 mm. Confira a prévia e imprima.

Atualizar resultados automaticamente consulta a busca a cada 30 segundos. Não adiciona notas ao lote nem imprime sozinho. A seleção de tamanho volta ao padrão A4 ao recarregar a página; confira o tamanho antes de imprimir.

As caixas Exibir endereço do remetente, Data e Descrição dos itens controlam o conteúdo em todos os tamanhos. Ocultar o endereço mantém logo, nome e CNPJ. O switch com sol e lua alterna entre Claro e Escuro; a escolha fica salva neste navegador. A impressão permanece em preto e branco.

## Empresa e logo
Abra Configurações da empresa. Importe uma logo PNG/JPEG de até 2 MB. O tamanho permite redução ou ampliação; para automaticamente no limite da área da logo, preservando a proporção. A prévia informa essa área conforme o formato selecionado. Salvar Modelo guarda os dados por empresa e atualiza a logo nas notas cujo CNPJ corresponde ao modelo. Cadastros, lote e preferências ficam neste navegador e endereço local.

## Resolver problemas
- Configurar integração abre o assistente pelo iniciador. Também é possível usar o ícone ao lado do relógio → Configurar pastas dos XMLs.
- Se o serviço estiver desligado, abra o atalho. Fechar a aba não encerra o serviço; Encerrar no ícone encerra.
- Pasta não encontrada: confira o endereço e a conexão com o servidor.
- Sem acesso: a conta atual do Windows precisa de permissão na pasta. Procure o responsável pela rede; o aplicativo não salva senhas de compartilhamento.
- Nenhum XML válido: confira se o sistema está salvando NF-e de saída autorizadas, modelo 55. Arquivos incompletos podem ser tentados novamente após a gravação terminar.
- Teste demorou: confira a rede e teste menos pastas por vez.
- Sem integração: preenchimento manual e importação de XML continuam disponíveis.

## Impressão em bobina
A Argox usa USB. Selecione o papel correto no diálogo de impressão; o tema da interface não altera a impressão. Driver e compartilhamento não são modificados pelo assistente. O alinhamento e a qualidade física dependem também das configurações de impressão e do ribbon.

## Endereço de entrega
A importação prioriza o campo próprio de entrega da NF-e. Quando ele não existe, procura um marcador explícito ENTREGA, LOCAL DE ENTREGA ou ENDEREÇO DE ENTREGA nas informações complementares. Reconhece um trecho iniciado por logradouro e terminado em cidade/UF, separado por ponto e vírgula ou quebra de linha. Não acrescenta o CEP ou o bairro do cadastro fiscal ao endereço extraído.

A caixa junto ao endereço permite usar o cadastro do destinatário quando aplicável. Um aviso aparece apenas se a leitura detectar um possível problema. Confira antes de confirmar e adicionar ao lote. Textos incompletos, formatos não reconhecidos ou múltiplos marcadores geram um aviso para corrigir manualmente; não há reconhecimento universal de texto livre. Um campo próprio de entrega continua tendo prioridade, com aviso se também houver indicação no rodapé. Notas já adicionadas ao lote não são alteradas automaticamente: revise e importe novamente quando necessário.
O CEP de entrega é opcional: só é preenchido quando estiver identificado como CEP na linha de cidade/UF ou no bloco imediatamente seguinte, antes de vendedor/pedido. Sem CEP nesse trecho, a etiqueta não exibe CEP de entrega; o CEP fiscal não é usado como substituto.
Atualização de 09/10/2026: também é reconhecida a entrega escrita como logradouro, número e cidade separados por hífen, mesmo sem UF (ex.: ENTREGA R. EXEMPLO DE ENTREGA, 1234 - CURITIBA). O texto é preservado, sem acrescentar UF, bairro ou CEP do cadastro fiscal. Endereços sem cidade reconhecível continuam exigindo correção manual.
## Orientação na revisão e na impressão
A revisão mostra avisos junto aos campos que precisam de atenção. Confira o endereço e os volumes antes de adicionar a nota.

O resumo do lote mostra o total de etiquetas e de folhas. Para corrigir uma nota, clique no lápis ao lado da lixeira, altere os campos na etapa 2 e escolha Salvar alterações. Cancelar edição descarta os ajustes sem alterar a nota. O remetente é preservado; em notas importadas, o número permanece vinculado ao XML original. Para carregar um XML atualizado, remova a nota e importe novamente. O botão verde Imprimir fica desativado quando o lote está vazio ou existe uma edição em andamento.

A integração diferencia conexão com o serviço local de acesso às pastas. Ao conectar, uma busca ainda é necessária para verificar as pastas. Resultados com falha de acesso exibem essa condição, e a última busca concluída aparece separadamente. Quando desconectada, é possível continuar preenchendo manualmente ou importando XML.
## Escolher o endereço de entrega
O campo e o título da etiqueta usam Endereço de entrega. Ao conferir um XML, a caixa Usar o endereço cadastrado do destinatário preenche o cadastro fiscal completo, incluindo seu CEP quando informado ali. Isso é uma escolha explícita; o endereço extraído das informações complementares continua sem aproveitar o CEP fiscal.

A caixa vem desmarcada quando a nota possui entrega específica e marcada quando só o cadastro do destinatário foi usado. Desmarcar restaura o endereço de entrega identificado originalmente. Se você editou o campo, uma confirmação protege o texto antes de substituí-lo. Toda troca exige confirmar a revisão novamente. No preenchimento manual ou XML sem endereço cadastrado disponível, a caixa fica desativada.
## Buscar notas nas pastas
Escolha Buscar nas pastas nas opções de entrada. Digite no campo Buscar nota (por exemplo, 123 ou Cliente Exemplo) e pressione Enter ou clique na lupa no final do campo. Filtros por data ficam recolhidos; abra-os somente quando precisar.

Na primeira preparação, a barra começa indeterminada enquanto o aplicativo levanta os arquivos e depois mostra quantos foram verificados do total. Com um índice salvo, a pesquisa continua disponível durante a atualização. Pesquisar não adiciona notas ao lote nem imprime.

O índice fica em disco, somente neste computador. Ao abrir o aplicativo, a atualização começa em segundo plano; arquivos novos, alterados e removidos são verificados a cada 60 segundos. Não há necessidade de instalar SQLite ou configurar caminhos adicionais. O pacote inclui o runtime necessário. A primeira preparação tem custo de leitura/processamento; as seguintes reutilizam os dados de XMLs inalterados. O indicador informa a última verificação e avisa quando as pastas não puderam ser atualizadas.

Sem acesso ao servidor, resultados antigos podem aparecer com aviso, mas conferir uma nota exige reler o XML original. Atualizar resultados automaticamente, na página, repete a consulta a cada 30 segundos e não dispara uma nova varredura completa.

Nota de manutenção: a opção de endereço e a origem na revisão não foram alteradas por essa reorganização. O CEP de entrega continua opcional e limitado ao trecho correspondente no XML.

O indicador da integração mostra verde quando o serviço e as pastas estão prontos, amarelo durante a preparação ou quando a busca usa um índice salvo com avisos, e vermelho quando o serviço ou a preparação falham. Passe o mouse sobre o botão (?) para ler o estado; também é possível usar Tab ou tocar no botão. Os resultados da pesquisa continuam aparecendo separadamente.

### Tipos e tamanhos de impressão

Expanda Papel ou Bobina de etiquetas e escolha um tamanho. Papel oferece A4, A3, A2, A5, Carta e Ofício (Legal), com etiquetas de 100 × 50 mm distribuídas em orientação retrato e margem de 4 mm. As capacidades são 10, 16, 44, 4, 10 e 12 etiquetas, respectivamente. São grades para impressão e recorte; folhas adesivas pré-cortadas podem exigir um modelo específico.

Bobina oferece 80 × 35, 85 × 35, 100 × 50, 100 × 75, 100 × 100 e 100 × 150 mm, com uma etiqueta por página. O tamanho no diálogo de impressão deve corresponder ao escolhido. Os formatos novos foram verificados no aplicativo; a validação física depende de impressora e mídia compatíveis.


### Etiquetas grandes no papel

Após escolher Papel e o tamanho da folha, use Disposição. A opção atual mantém as etiquetas de 100 × 50 mm. As opções de 4, 3, 2 ou 1 por folha distribuem etiquetas maiores na área útil: 4 em uma grade 2 × 2; 3 e 2 em faixas horizontais; 1 na folha inteira. Nos demais papéis também existe a grade de 10 por folha. A prévia informa a dimensão resultante por etiqueta e o lote atualiza a quantidade de folhas. Textos, logo e volumes são ampliados com ajuste para caber, mantendo 4 mm nas bordas da folha e 3 mm entre etiquetas grandes.

A escolha fica salva por tamanho de papel neste navegador. A bobina continua usando uma etiqueta por página e não apresenta o controle de disposição. Exemplo: 3 volumes com 2 por folha usam 2 folhas; a última fica com uma posição vazia. No diálogo de impressão, selecione o mesmo papel, escala 100% e sem margens extras ou cabeçalhos/rodapés. Essa grade atende impressão e recorte em papel; folhas adesivas pré-cortadas precisam corresponder às medidas da prévia.

Validação em 13/10/2026: layouts de 4/3/2/1 nos seis papéis, textos sem corte, NF completa, retorno ao layout atual e à bobina, persistência, telas estreitas e PDFs A4 com paginação correta. Os testes físicos realizados pelo usuário foram aprovados em 13/10/2026; veja o registro abaixo.


A disposição **1 por folha** usa automaticamente orientação paisagem em todos os tamanhos de papel. A prévia e o PDF usam a mesma orientação; ao voltar para 2, 3, 4 ou a opção atual, a folha volta para retrato. Em 13/10/2026, o usuário confirmou a impressão física de 2 etiquetas por A4.


A prévia das folhas de papel reduz automaticamente para caber na moldura da tela, preservando a orientação escolhida. A escala é apenas visual: a impressão e o PDF mantêm as dimensões em milímetros. Nas disposições grandes, os dados de entrega e os identificadores NF/volume ficam agrupados no centro, a descrição ocupa a faixa inferior separada por uma linha, e a data opcional aparece junto ao endereço. As caixas de seleção continuam controlando data, descrição e endereço do remetente.


As grades padrão (inclusive 10 por A4) também centralizam verticalmente o grupo NF/Volume na coluna lateral. O endereço de entrega mantém o alinhamento superior e usa uma fonte um pouco maior, com peso médio. Quando há mais conteúdo, o ajuste automático preserva os limites de impressão. A4, A3, A2, A5, Carta e Ofício foram testados com as oito combinações de data, descrição e endereço do remetente, em tela e PDF.


### Grade e Lista

Os dois ícones ao lado dos campos opcionais controlam a organização das etiquetas na folha de papel. Grade mantém a disposição atual. Lista usa uma única coluna de linhas, tanto na prévia quanto na impressão; por exemplo, 4 por folha passa de 2 × 2 para quatro linhas. A prévia, dimensões por etiqueta e total de folhas mudam juntos.

A escolha de Grade/Lista fica salva neste navegador; a disposição é lembrada separadamente para cada organização e tamanho de papel. Lista ajusta a quantidade padrão ao espaço vertical, preservando área para imprimir os dados. No A4, o padrão de Lista é 5 por folha. A opção de 10 linhas fica indisponível quando a altura do papel não comporta esse layout. As bobinas continuam com uma etiqueta por página e não exibem o alternador.

Validação: Grade/Lista em A4, A3, A2, A5, Carta e Ofício, com 4/3/2/1 e as capacidades padrão, oito combinações de campos opcionais, PDFs A4, retorno à grade, preferência salva, mobile e bobina. O usuário informou aprovação dos testes físicos realizados em 13/10/2026.


### Aprovação da impressão física — 13/10/2026

O usuário informou: “todos testes fisicos aprovados”. Registrada a aprovação dos testes físicos realizados após os ajustes de disposição, orientação paisagem, prévia responsiva, textos e alternância Grade/Lista. A confirmação complementa as verificações automatizadas de layout e PDF. O relato não detalhou individualmente papéis, mídias ou impressoras usados em cada teste.


### Identidade TagEX — 14/10/2026

O topo do aplicativo usa TagEX, com a descrição Etiquetas para expedição, duas faixas discretas ao fundo e navegação Preencher → Conferir → Imprimir. As etapas levam às respectivas áreas da página. O botão Empresa abre o cadastro e a identidade visual das empresas. O switch sol/lua substitui o seletor de aparência e oferece apenas Claro e Escuro. Preferências antigas desses temas são mantidas; Sistema é convertido uma vez para o tema do computador na abertura e depois passa a ser uma preferência fixa.

O título da página, o nome do aplicativo instalável e os ícones usam TagEX. Os atalhos Windows já instalados e as configurações de integração continuam usando seus nomes e caminhos existentes. O cabeçalho não é incluído na impressão das etiquetas. Verificações: switch por clique, teclado e recarga, navegação entre etapas, janela Empresa e telas de 320 a 1920 px nos dois temas; testes de impressão e integração mantidos.


## Avisos junto aos campos (14/10/2026)
O pequeno triângulo aparece somente quando falta um dado, o valor é inválido ou a leitura do XML aponta um possível problema. Passe o mouse, use Tab ou toque para ler uma orientação curta. Escape ou toque fora fecha a explicação. Campos sem problemas detectados não mostram ícones.

Volumes ausentes devem ser preenchidos com o total da entrega (1 a 999). O aviso desaparece quando a quantidade é válida. No endereço, os avisos cobrem leitura incerta, texto incompleto, excesso de tamanho ou duas indicações de entrega. A extração bem-sucedida de um endereço e o uso do cadastro do destinatário não geram avisos por si só. A ausência de aviso não confirma que a entrega física corresponde ao documento: confira os dados e marque Conferi os dados do XML junto ao botão de adicionar. Editar qualquer dado desmarca a confirmação. Os avisos não aparecem na impressão.
