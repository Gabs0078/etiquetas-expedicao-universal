# Expedição - Etiquetas

Aplicação web simples para gerar etiquetas de expedição no tamanho **10x5cm**, com impressão em **A4 com 10 etiquetas** ou **bobina térmica adesiva 10x5cm**.

## Como usar

Abra o arquivo `index.html` no navegador.

Não precisa instalar nada. Os modelos de empresa ficam salvos localmente no navegador usando `localStorage`.

## Recursos

- Cadastro de múltiplas empresas.
- Upload de logo por empresa.
- Seleção de empresa ativa.
- Exclusão de modelos cadastrados.
- Impressão em A4 ou bobina térmica.
- Geração automática de etiquetas conforme a quantidade de volumes.
- Aproveitamento de espaço no A4, juntando notas diferentes na mesma folha.

## Estrutura

```txt
etiquetas-expedicao-universal/
├── index.html
├── manifest.webmanifest
├── README.md
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   └── app.js
    ├── icons/
    │   ├── app-icon.svg
    │   ├── app-icon-192.png
    │   └── app-icon-512.png
    └── img/
        └── diogo-logo.jpg
```


## Observações de impressão

Para A4, use papel em modo retrato e escala 100%. Para bobina térmica, configure a impressora com página personalizada de **100mm x 50mm** antes de imprimir.
