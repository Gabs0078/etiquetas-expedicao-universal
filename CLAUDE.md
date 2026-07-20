# Contexto para o Claude Code

## O que é este projeto

Gerador de etiquetas de expedição para almoxarifado. Resolve um problema real:
etiquetas de volume fracionado (`1/10`, `2/10`...) escritas à mão geram erro de
numeração e divergência na conferência do cliente.

O projeto nasceu da rotina de trabalho do autor em almoxarifado, e também serve
como peça de portfólio. Legibilidade importa tanto quanto funcionamento.

## Decisões que devem ser respeitadas

- **Sem frameworks e sem build.** HTML, CSS e JavaScript puros. O app precisa
  funcionar abrindo `index.html` direto no navegador. Não introduza React,
  bundler, npm ou TypeScript sem que isso seja pedido explicitamente.
- **100% client-side.** Nenhum dado de nota fiscal ou de empresa pode ser
  enviado para fora do navegador. Persistência é `localStorage`.
- **Nada de dados reais de empresas no repositório.** `defaultCompany()` usa
  dados fictícios de propósito. Não commite logo, CNPJ ou endereço de cliente.
- **Português no código.** Funções, variáveis e mensagens em português, como já
  está no restante do projeto.

## Arquitetura

- `assets/js/app.js` — arquivo único. Objeto `state` central (`notas`,
  `empresas`, `empresaAtivaId`), funções de renderização (`renderNotas`,
  `renderEmpresas`) chamadas por `renderizar()`. Sem framework de estado.
- `assets/css/styles.css` — estilos globais e o bloco `@media print`, que
  controla A4 (`.sheet`, 10 etiquetas) e bobina (`.bobina-page`, 1 por página).
- `sw.js` — cache dos estáticos. **Ao alterar qualquer arquivo listado em
  `ARQUIVOS`, incremente `CACHE_VERSION`**, senão os usuários ficam na versão
  antiga.

## Armadilhas conhecidas

- **Escape de HTML é obrigatório.** Todo dado vindo do usuário passa por
  `escaparHTML()` antes de entrar em template string. Manter isso em qualquer
  novo campo.
- **Limite do `localStorage`.** Logos são base64; várias empresas estouram o
  limite (~5MB). `salvarEmpresas()` tem `try/catch` — não remova.
- **Impressão só se valida imprimindo.** Alterações no CSS de impressão precisam
  ser testadas na pré-visualização real do navegador, em A4 e em bobina 100x50mm.
  A escala precisa ficar em 100% e as margens desativadas.
- `confirm()` nativo ainda é usado em `limparTudo()` e `excluirEmpresaAtual()`.
  Substituição por modal próprio está no ROADMAP (v0.2).

## Como testar

Não há suíte de testes. Verificação manual:

```bash
python3 -m http.server 8000
```

Servir por http é necessário para o service worker registrar (em `file://` ele
é ignorado de propósito). Testar: adicionar nota com 10 volumes e conferir a
numeração; alternar A4/bobina; cadastrar e trocar empresa; recarregar a página e
confirmar que as notas persistiram; imprimir em ambos os formatos.
