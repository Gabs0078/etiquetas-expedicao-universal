# Prototipo Windows

Abra `Abrir Etiquetas.vbs` para iniciar. Na primeira abertura, escolha a pasta
dos XMLs. Cancelar permite continuar com digitacao e upload; configure a pasta
depois pelo icone ao lado do relogio.

O icone oferece abrir etiquetas, escolher outra pasta e encerrar. Abrir o
iniciador novamente sinaliza a instancia existente, sem iniciar outro servico.
Fechar a aba do navegador nao encerra o servico.

## Requisitos desta etapa

- Windows com Windows PowerShell 5.1 e Windows Script Host habilitados.
- Node.js 22 ou superior e dependencias do projeto instaladas.
- Navegador local para busca e impressao.

O prototipo usa a porta fixa 8788 para coexistir com o servico de desenvolvimento
na 8787. Os dados do navegador pertencem a cada endereco/porta: lotes e empresas
da 8787 nao aparecem automaticamente na 8788. Nao altere a porta sem considerar
esse efeito. Se a porta estiver ocupada, o iniciador informa a falha e nao encerra
processos de terceiros.

Configuracao: `%LOCALAPPDATA%\EtiquetasExpedicao\config.json`. Digite ou cole
cada caminho e clique em Adicionar. A lista permite remover pastas e recupera
as pastas ja salvas. Salvar pastas grava todos os caminhos em uma fonte unica;
a busca consulta todas elas, incluindo subpastas. Cada nova pasta tem seu acesso
verificado antes de entrar na lista. A conta do Windows deve ter acesso ao
compartilhamento. Cancelar preserva a configuracao anterior.

## Sessao local

O iniciador recebe o segredo do seu processo filho pela saida redirecionada,
sem gravar esse segredo. Pede um ingresso de 60 segundos e uso unico, abre o
navegador e o servidor troca o ingresso por cookie HttpOnly/SameSite=Strict.
A pagina e redirecionada para a raiz, sem codigo na URL. A sessao dura ate o
reinicio do servico; o cookie e de sessao do navegador. Use o icone para abrir
novamente apos fechar o navegador ou trocar a pasta.

Host e origem continuam restritos. A API de criacao de ingressos exige o segredo
do iniciador, nao aceita apenas o cookie. A sessao e os ingressos nao entram no
cache offline. O acesso manual por codigo continua disponivel no servico normal.

## Verificacao

`pnpm test` e `pnpm test:browser` incluem autenticacao e conexao automatica.
Para verificar o iniciador sem abrir janelas:

```powershell
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File desktop/iniciar.ps1 -Verificar -Porta 18788
```

Conferencia manual pendente: selecionar pasta local e UNC, cancelar a primeira
configuracao, trocar pasta, abrir o atalho duas vezes, usar o menu do icone e
encerrar. Confira tambem acesso ao compartilhamento e impressao fisica.

## Proxima etapa

Este e um prototipo, ainda nao um instalador. O iniciador procura primeiro
`desktop/runtime/node.exe`, preparado para uma futura distribuicao com runtime
incluido, e depois o Node.js instalado. Empacotamento, assinatura, instalacao
por usuario, atualizacao e desinstalacao dependem da homologacao deste fluxo.
