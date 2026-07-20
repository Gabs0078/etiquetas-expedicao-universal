# Expedição - Etiquetas

Gerador de etiquetas de expedição (10x5cm) que **numera os volumes automaticamente** e imprime em folha A4 ou bobina térmica. Roda no navegador, sem servidor e sem internet.

## O problema

Em muitos almoxarifados a etiqueta de expedição ainda é escrita à mão. Quando a carga é fracionada — uma nota com 10 volumes, por exemplo — alguém precisa escrever `1/10`, `2/10`, `3/10` até `10/10` em dez etiquetas diferentes, no meio da correria do carregamento.

Duas coisas dão errado com frequência:

- **Erro de numeração.** Pula um número, repete outro, ou escreve `8/10` num embarque de 12. O resultado é divergência na conferência do cliente, ligação para checar volume faltante e retrabalho.
- **Identificação improvisada.** Caneta permanente em cima do papelão não identifica remetente, CNPJ ou nota fiscal de forma legível.

## A solução

Você informa a nota e a quantidade de volumes. O sistema gera as etiquetas já numeradas em sequência, com os dados da sua empresa e a logo, prontas para imprimir.

- **Numeração automática de volumes** — a partir da quantidade informada, gera `1/10` a `10/10` sem intervenção manual
- **Múltiplas notas na mesma folha** — notas diferentes são encaixadas na mesma A4 até completar 10 etiquetas, sem desperdício de papel
- **Dois formatos de impressão** — A4 com 10 etiquetas por folha para recorte, ou bobina térmica adesiva 10x5cm
- **Cadastro de empresas** — várias empresas salvas, com logo e dados fiscais, alternáveis a qualquer momento
- **Funciona offline** — nenhum dado sai do navegador, nenhum servidor envolvido

## Como usar

**1. Abrir.** Basta abrir `index.html` em qualquer navegador moderno. Servido por http/https, o app pode ser instalado como aplicativo (PWA) e passa a funcionar offline.

**2. Configurar a empresa.** No painel direito, em *Configurar Empresa*, envie a logo (PNG/JPG até 2MB), preencha os dados fiscais e clique em *Salvar Modelo*. Os dados ficam salvos neste navegador.

**3. Gerar e imprimir.** Preencha data, número da NF, endereço do destinatário e quantidade de volumes, e clique em *Adicionar Nota*. Repita para quantas notas precisar. Escolha o formato na barra de ferramentas e clique em *Imprimir Etiquetas*.

> Na impressão, use escala 100% e desative margens e cabeçalho/rodapé do navegador.

## Stack

| | |
|---|---|
| Front-end | HTML5, CSS3 (variáveis nativas, tema escuro), JavaScript sem frameworks |
| Persistência | `localStorage` — empresas cadastradas e notas em andamento |
| Offline | Service worker com cache dos arquivos estáticos + `manifest.webmanifest` |
| Impressão | CSS `@media print` com páginas nomeadas (`@page`) para A4 e bobina |

Sem dependências, sem build, sem backend. Todo o processamento é client-side — nenhum dado é enviado para servidores externos.

## Estrutura

```txt
etiquetas-expedicao-universal/
├── index.html               # Interface principal
├── sw.js                    # Service worker (cache offline)
├── manifest.webmanifest     # Configuração do PWA
├── ROADMAP.md               # Próximas versões
└── assets/
    ├── css/styles.css       # Estilos globais, componentes e regras de impressão
    ├── js/app.js            # Estado, renderização e lógica de etiquetas
    └── icons/               # Ícones do PWA
```

## Status

Versão 0.1 — funcional e em uso real. Ver [ROADMAP.md](ROADMAP.md) para o que vem a seguir.

## Créditos

Desenvolvido por [Gabriel Godoy](https://github.com/Gabs0078), a partir de um gargalo observado na própria rotina de expedição.
Colaboração no front-end: [Renan Ropelato](https://github.com/rRopelato).

## Licença

MIT — ver [LICENSE](LICENSE).
