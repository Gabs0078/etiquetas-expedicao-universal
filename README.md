# Expedição — Etiquetas

Etiquetas de expedição **10 × 5 cm**, com volumes numerados automaticamente, para folha A4 ou bobina térmica. Digite os dados, importe XMLs de NF-e ou conecte o serviço opcional de busca em pastas da empresa.

## Três formas de trabalhar

| Modo | Como funciona | Instalação |
| --- | --- | --- |
| Manual | Preencha nota, destinatário e volumes como na versão original | Abra `index.html` |
| Upload de XML | Selecione um ou vários XMLs, revise cada nota e adicione ao lote | Abra `index.html` |
| Integração com pastas | Busque por número, chave, destinatário, emitente e período; traga a nota para revisão | Serviço Node.js opcional na máquina que tem acesso às pastas |

O aplicativo mantém HTML, CSS e JavaScript sem framework e sem build. **Manual e upload não precisam de Node.js, dependências ou servidor.** O serviço e seus testes têm dependências próprias, utilizadas apenas quando esses recursos são necessários.

## Começar pelo modo simples

1. Baixe o projeto e abra `index.html` em um navegador moderno.
2. Cadastre a empresa e sua logo para as notas digitadas manualmente.
3. Preencha o formulário ou clique em **Upload de XML**.
4. No upload, clique em **Revisar**, confira os campos e marque a confirmação. Clique em **Adicionar nota revisada**.
5. Escolha A4 ou bobina e imprima. Use escala 100%, sem cabeçalho/rodapé e sem margens do navegador.

No topo da pré-visualização, **Exibir data na etiqueta** e **Exibir descrição dos itens** controlam esses campos em todas as etiquetas do lote. A data começa desativada e a descrição ativada; a escolha fica salva neste navegador. Desmarcar não apaga os dados da nota. A data registrada pode continuar sendo revisada no formulário mesmo quando não aparece na impressão.

A descrição ocupa a largura inteira abaixo do endereço e da identificação da NF/volume. O app ajusta o texto entre 8 e 9 px e verifica o espaço disponível. Se uma descrição ou endereço ainda exceder a etiqueta, a interface avisa e o botão de impressão solicita revisão; é possível ocultar a descrição ou resumir os dados antes de adicionar a nota. O resumo de produtos do XML continua limitado a 180 caracteres, com aviso na revisão.

A escolha da impressora pertence ao diálogo do navegador. Se o navegador integrado não permitir trocar o destino, abra o aplicativo no Chrome ou Edge local para imprimir. Os dados salvos pertencem a cada navegador: importe as notas nesse navegador antes de imprimir. Em bobina, selecione também o papel 100 × 50 mm no driver.

Cada nota adicionada mantém uma cópia do remetente. Trocar a empresa selecionada afeta as próximas notas manuais. XMLs usam o emitente da NF-e; uma logo cadastrada é aproveitada somente se o CNPJ corresponder. O cadastro de empresas não é alterado pela importação.

## O que o XML preenche

- Número, série e chave de acesso da NF-e.
- Data de emissão, que pode ser ajustada para a data de expedição durante a revisão.
- Emitente e seu endereço.
- Nome do destinatário e endereço: o grupo `entrega` tem prioridade sobre `enderDest`.
- Soma de `qVol` dos grupos de volumes. Sem quantidade válida, o campo fica vazio e exige preenchimento; quantidade de produtos não substitui volumes de transporte.
- Descrição dos produtos, resumida a 180 caracteres com aviso quando necessário.

São aceitos XMLs completos `NFe` ou `nfeProc`, com namespace oficial, modelo **55**, de saída e ambiente de produção. O leitor verifica estrutura básica, consistência da chave com emitente/número/série e, quando presente, protocolo com status 100 ou 150. NFC-e, NFS-e, CT-e, resumos e eventos exigem outros leitores e são recusados nesta versão.

**Esta importação não valida assinatura digital, schema fiscal completo ou situação atual na SEFAZ.** Um XML autorizado pode ter sido cancelado depois em um arquivo de evento separado. Confira a situação no ERP antes de imprimir; a tela exige essa revisão. XML sem protocolo também recebe aviso. Eventos de cancelamento separados não são conciliados automaticamente nesta versão.

Limites: 2 MB por XML, 100 arquivos por seleção, 100 notas em revisão, 100 notas no lote, 1–999 volumes por nota e 3.000 etiquetas no lote. Uma chave já presente no lote ou na fila não é importada novamente. Remover a nota do lote permite reimpressão posterior.

## Integrar com pastas locais ou compartilhadas

O navegador usa arquivos selecionados pelo usuário; ele não pode procurar livremente em `C:\\` ou em um servidor de rede. Para leitura automática, o serviço opcional acessa **somente as pastas configuradas** e entrega os dados ao aplicativo local.

1. Instale Node.js 22 ou superior na máquina que consegue acessar os XMLs.
2. Na pasta do projeto, instale as dependências:

   ```sh
   npm install --global pnpm@11.25.0
   pnpm install --prod --frozen-lockfile
   ```

3. Copie `integracao/config.exemplo.json` para `integracao/config.local.json`. Ajuste as pastas e remova os exemplos que não usa. Esse arquivo é ignorado pelo Git.
4. Inicie com `pnpm start` e abra **http://127.0.0.1:8787** na mesma máquina. O terminal mostra um código de acesso temporário.
5. Clique em **Integração**, informe o código e conecte. Selecione a fonte e busque.
6. Opcionalmente, marque a atualização a cada 30 segundos. As notas encontradas continuam exigindo seleção e revisão antes da impressão. A atualização funciona enquanto o aplicativo estiver aberto; o navegador pode reduzir a frequência em segundo plano.

Exemplo de configuração, com dados fictícios:

```json
{
  "fontes": [
    {
      "id": "matriz",
      "nome": "Notas emitidas da matriz",
      "tipo": "pastas",
      "pastas": ["C:\\XMLs\\Emitidas", "\\\\SERVIDOR\\Fiscal\\Emitidas"],
      "recursivo": true,
      "cnpjEmitente": ""
    }
  ]
}
```

`cnpjEmitente` vazio aceita os emitentes encontrados. Preencha os 14 dígitos para limitar a fonte a uma empresa. É possível cadastrar várias fontes com conjuntos diferentes de pastas e emitentes. `recursivo: false` lê somente o primeiro nível.

A conta que executa o serviço precisa ter permissão de leitura no compartilhamento. Em Windows, prefira caminhos UNC a unidades mapeadas quando executar com outra conta. Credenciais do compartilhamento são administradas pelo sistema operacional, fora do app e do repositório.

O serviço escuta apenas em `127.0.0.1`; ele pode ler arquivos de um servidor remoto acessível, mas não fica exposto à rede. Para vários postos, instale o serviço em cada posto com acesso ao compartilhamento. Acesso central por navegador em outras máquinas exige uma implantação futura com HTTPS, autenticação de usuários e autorização por empresa; alterar apenas o endereço de escuta não implementa essa solução.

A busca verifica novamente as pastas, reutilizando a listagem por até 10 segundos. A nota é relida ao ser trazida para revisão. Cada varredura limita 10.000 entradas e 20 níveis de subpastas; a resposta mostra até 100 notas e 50 erros. Se atingir o limite de varredura, reduza ou separe as pastas; filtros de busca não ampliam esse limite. Pastas indisponíveis e arquivos inválidos são apresentados como avisos.

Variáveis opcionais: `PORT` muda a porta; `ETIQUETAS_CONFIG` indica outro arquivo de configuração; `ETIQUETAS_TOKEN` define um código com pelo menos 32 caracteres. Sem código fixo, cada reinício gera um novo. O código fica apenas na memória da página, sem persistência no navegador.

## Modularidade e próximas integrações

O normalizador de NF-e é compartilhado pelo navegador e pelo serviço. As fontes fornecem dados no mesmo formato; os detalhes de onde encontrar arquivos ficam fora do formulário e da impressão. Veja [a arquitetura e as alternativas de implantação](docs/integracoes.md).

Nesta entrega, **upload e pastas estão implementados**. API de ERP, SFTP, banco de dados e outros documentos são possibilidades de novos adaptadores, ainda não implementados.

## Dados e funcionamento offline

Empresas e notas adicionadas ficam no `localStorage` deste navegador/dispositivo. A fila de revisão e os resultados de busca são temporários. Os XMLs brutos não são persistidos. Se o armazenamento falhar, o app avisa que as notas permanecerão apenas na sessão.

Upload e digitação processam dados no navegador. Na integração, o serviço local lê os arquivos e envia os campos normalizados à página local. Não há envio para serviços externos. Em HTTP local ou HTTPS, o PWA guarda somente arquivos estáticos para uso offline; APIs, XMLs e códigos de acesso ficam fora do cache. Busca em servidor precisa estar online com o serviço disponível.

Não inclua XMLs reais, logos de clientes, configurações empresariais ou credenciais no repositório. Os testes usam somente dados fictícios.

## Verificação

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
```

No Windows, `BROWSER_CHANNEL=msedge` permite executar a verificação com o Edge instalado. A integração contínua usa Chromium. Os testes cobrem normalização, namespaces, volumes, documentos recusados, acesso à API, busca, revisão, duplicidades, remetentes, persistência, offline, abertura direta de arquivo, proteção de HTML, layout móvel e impressão. A impressão física continua dependendo do navegador, driver e impressora; homologue os dois formatos no equipamento usado pela empresa.

## Estrutura

```text
index.html                    Interface e formulário manual
assets/js/app.js              Notas, empresas e etiquetas
assets/js/nfe.js               Leitor e normalizador compartilhado
assets/js/fontes.js            Adaptadores do navegador
assets/js/importacao.js        Fila, revisão e busca
integracao/servidor.cjs        Serviço local opcional e API
integracao/fontes/pastas.cjs   Adaptador de pastas locais ou de rede
docs/integracoes.md            Contratos e alternativas
tests/                        Testes com documentos fictícios
sw.js                         Cache estático do PWA
```

## Status e créditos

Versão **0.2.0**: base funcional com testes automatizados, preparada para homologação com XMLs e impressoras de cada empresa. Não representa certificação fiscal ou homologação universal dos ERPs. Veja o [roadmap](ROADMAP.md).

Desenvolvido por [Gabriel Godoy](https://github.com/Gabs0078), a partir da rotina de expedição. Colaboração no front-end: [Renan Ropelato](https://github.com/rRopelato).

Licença MIT — [LICENSE](LICENSE).
