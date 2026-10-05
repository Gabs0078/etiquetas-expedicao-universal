# Integrações: arquitetura e opções

## Separação de responsabilidades

1. **Fonte** encontra documentos: seleção de arquivos, pastas, ou futuro ERP.
2. **Leitor** normaliza o documento fiscal em dados da nota.
3. **Revisão** mostra os dados, os avisos e exige conferir volumes, endereço e situação fiscal.
4. **Lote** mantém o remetente da nota, evita repetir a chave e gera as etiquetas.

O modo manual entra diretamente no lote após validação. Uma nova fonte não altera o layout de impressão. Um novo tipo de documento precisa de seu próprio leitor.

## Escolher a abordagem por empresa

| Situação | Abordagem | Observações |
| --- | --- | --- |
| Poucas notas e sem acesso técnico | Manual ou upload | Implementados, sem instalação |
| XMLs em pastas locais ou compartilhadas | Serviço local com fonte `pastas` | Implementado; conta do serviço deve ler as pastas |
| ERP exporta XMLs mas não tem API | Exportação para uma pasta de integração | A fonte de pastas já lê essa pasta |
| Operador pode selecionar uma pasta | Adaptador pelo seletor de pasta do navegador | Futuro; exige gesto do usuário, contexto seguro e navegador compatível |
| ERP tem API | Novo adaptador no serviço | Preferível para consulta estruturada e situação atual; credenciais permanecem no serviço |
| Arquivos disponíveis por SFTP | Sincronização administrada para uma pasta, ou adaptador SFTP | Não colocar credenciais no navegador |
| ERP só oferece banco de dados | Exportação oficial, view autorizada ou adaptador de consulta | Depende do fornecedor e das regras de acesso; evitar acoplar a UI ao schema do ERP |
| Muitos postos e grande histórico | Serviço central, índice e autorização por empresa | Próxima etapa; exige implantação e testes próprios |

Para começar, recomendamos uma pasta de integração com XMLs emitidos recentes, separada por empresa. Isso reduz a varredura e permite usar a mesma configuração com ERPs diferentes. Quando disponível, a API oficial do ERP pode melhorar busca e atualização do estado fiscal.

## Contrato de uma fonte no serviço

Cada fonte registrada em `FABRICAS` no servidor implementa:

```js
{
  id, nome, tipo,
  async listar(forcar = false) {
    return { notas: [], erros: [], limitado: false };
  },
  async obter(id) {
    // Relê/verifica o documento e devolve a nota normalizada, ou null.
  }
}
```

Uma nota normalizada contém `chave`, `nf`, `serie`, `data`, `destinatario`, `volumes`, `descricao`, `emitente`, `avisos` e `autorizada`. As fontes acrescentam `id`, `fonte` e `arquivo` quando aplicável. `volumes: null` significa que o usuário precisa preencher o total físico. `autorizada` indica apenas que o XML contém o protocolo aceito; não representa consulta atual nem validação criptográfica.

`listar()` fornece notas para os filtros centrais; `obter()` verifica novamente o arquivo no momento da seleção. As rotas expõem campos normalizados, não caminhos do servidor. O identificador do arquivo é opaco. Para bases grandes, essa interface deve evoluir para paginação e filtros na própria fonte, evitando carregar todo o histórico.

Novo adaptador: crie um módulo em `integracao/fontes`, registre sua fábrica e valide sua configuração na inicialização. Teste indisponibilidade, autenticação, paginação, formatos inválidos, atualização da situação fiscal e isolamento por empresa. Defina tempo limite para chamadas remotas e não aceite URLs ou caminhos livres enviados pelo navegador.

## API local atual

Todas as rotas exigem `Authorization: Bearer <código>` e o mesmo host/origem do aplicativo:

- `GET /api/fontes`: fontes disponíveis, sem caminhos ou credenciais.
- `GET /api/notas?fonte=ID&busca=TEXTO&inicio=AAAA-MM-DD&fim=AAAA-MM-DD`: busca e avisos.
- `GET /api/notas/ID?fonte=ID`: obtém novamente os dados para revisão.

O serviço só serve arquivos estáticos explicitamente permitidos. Configurações e XMLs não são publicados. Não há rota que leia um caminho arbitrário, grave arquivos fiscais ou altere os documentos originais.

## Limites operacionais e evolução

A fonte de pastas usa varredura limitada, sem banco de dados ou serviço de observação permanente. Em compartilhamentos lentos ou históricos grandes, organize pastas menores antes de configurar. Falhas parciais aparecem na tela; um resultado vazio não comprova ausência de notas quando há erros ou limite atingido.

Notas entram na fila apenas após seleção do operador. A busca periódica não imprime automaticamente e não continua com o navegador fechado. Para um fluxo totalmente automático, será necessário definir eventos, armazenamento de processamento, tentativas, auditoria e critérios de reimpressão.

Um passo útil antes de produção é obter amostras anonimizadas de cada ERP, incluindo nota com local de entrega, vários grupos `vol`, ausência de `qVol`, endereço longo, nota sem protocolo e eventos de cancelamento. Homologue com a pessoa responsável pela expedição; dados fiscais reais ficam fora do Git.

## Apresentação pública e instruções de IA

O README apresenta o produto, sua instalação e limitações. `CLAUDE.md`, `AGENTS.md` e diretórios de orientação de IA são ignorados nesta proposta. Mantenha instruções pessoais localmente; documentação útil a todos os colaboradores pertence a `docs/`.

Ignorar um arquivo não retira versões antigas do histórico do Git. A remoção proposta limpa a árvore da branch ao ser incorporada; não reescreve commits antigos. Caso exista um README específico do perfil, sua apresentação é uma configuração separada deste repositório.

## Referências técnicas

- [Esquemas oficiais de NF-e](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w%3D)
- [File API — arquivos selecionados pelo usuário](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [Seletor de diretório — restrições e compatibilidade](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
