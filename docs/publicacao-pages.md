# Publicação no GitHub Pages

URL: https://gabs0078.github.io/etiquetas-expedicao-universal/

A origem de publicação deve ser **GitHub Actions** em Settings → Pages. O workflow verificar.yml executa os testes com Node.js 24 e Chromium; somente a branch main aprovada publica no ambiente github-pages. Uma falha mantém a versão anterior no ar.

scripts/preparar-pages.cjs copia uma lista explícita de HTML, CSS, JavaScript, manifesto e ícones para _site. O serviço Node, scripts Windows, dependências, documentos fiscais e configurações privadas não são incluídos no site. O código e a documentação da integração permanecem no repositório para desenvolvimento.

## Conferir uma publicação
1. Veja se os jobs testes e pages concluíram com sucesso em Actions.
2. Abra a URL pública e confira o título TagEX e os temas.
3. Preencha uma nota de exemplo ou importe um XML fictício; confira a prévia e o diálogo de impressão.
4. Recarregue e confira funcionamento offline após o primeiro carregamento.
5. Ao alterar assets, incremente o cache do sw.js e a versão das URLs em index.html/manifest.webmanifest juntos.

O Pages funciona em uma subpasta; links de assets e registro do service worker são relativos. A pesquisa em pastas exige abrir o aplicativo pelo serviço local, não pela URL pública. Os cadastros e lotes ficam no navegador e no endereço em que foram criados; não são transferidos automaticamente entre localhost e o Pages.

## Versão Windows
desktop/empacotar.ps1 gera o pacote com runtime Node.js 24 e dependência XML. O runtime e os dados privados são ignorados pelo Git. O ZIP deve ser distribuído separado do site; o clone do repositório não inclui o runtime.

## Prévia ao compartilhar o link
O HTML entrega título, descrição e imagem Open Graph mesmo sem JavaScript. A imagem PNG de 1200 × 630 fica em assets/brand/tagex-compartilhamento-v1.png e faz parte da publicação estática. Não contém dados fiscais ou de empresas usuárias.

Para regerar a arte a partir da identidade visual existente, execute node scripts/gerar-compartilhamento.cjs com Playwright instalado (BROWSER_CHANNEL=msedge no Windows). Ao trocar a imagem, use outro nome/versionamento e atualize os metadados e a lista de publicação. O resultado visual final também depende do aplicativo em que o link é compartilhado; prévias antigas podem continuar armazenadas por ele.
