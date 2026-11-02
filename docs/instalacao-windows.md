# Instalar e usar o TagEX no Windows

O pacote Windows inclui o aplicativo, o runtime Node.js e o leitor de XML. Você não precisa instalar dependências, abrir um terminal ou editar um arquivo de configuração.

## Primeiro uso

1. Baixe [TagEX-Windows-0.6.0-beta.1.zip](https://github.com/Gabs0078/etiquetas-expedicao-universal/releases/download/v0.6.0-beta.1/TagEX-Windows-0.6.0-beta.1.zip). Em Releases, use o ZIP do Windows, e não “Source code”.
2. Clique com o botão direito no ZIP → **Extrair tudo**. Abra a pasta extraída.
3. Abra **Instalar TagEX.exe** → **Instalar**. A instalação é por usuário, em %LOCALAPPDATA%\Programs\TagEX; não solicita administrador. O menu Iniciar recebe um atalho e a área de trabalho é opcional.
4. Clique em **Abrir TagEX**. Escolha **Importar XMLs ou preencher manualmente** para começar imediatamente, ou **Configurar busca nas pastas da empresa** para abrir o assistente.
5. Depois, abra pelo atalho **TagEX**. A interface aparece no navegador em http://127.0.0.1:8788. O endereço pertence ao próprio computador.

Requisitos: Windows 10/11 de 64 bits, Windows PowerShell 5.1, navegador moderno instalado e uma impressora disponível para imprimir. A instalação do pacote já baixado não faz downloads. A versão ainda não é assinada digitalmente; se a política da empresa impedir a execução, procure o responsável de TI. Não desative proteções.

Para usar sem instalar, mantenha a pasta extraída inteira e abra **Abrir TagEX.exe**. **LEIA-ME.html** contém o guia offline. Não copie apenas o EXE.

## Configurar pastas (opcional)

1. No aplicativo local, escolha **Buscar nas pastas** → **Configurar integração**. Também pode usar o ícone ao lado do relógio → **Configurar pastas dos XMLs**.
2. No assistente, selecione uma pasta ou cole seu endereço completo e clique em **Adicionar**. Subpastas são consultadas.
3. Clique em **Testar pastas**. O teste lê uma amostra; não move nem altera os XMLs.
4. Confira o resultado. Pastas acessíveis continuam utilizáveis com avisos em alguns arquivos. Pastas vazias também podem ser salvas. **Guardar também as pastas sem acesso** é opcional e só aparece quando necessário.
5. Salve. Marque **Iniciar automaticamente quando eu entrar no Windows** apenas se desejar. A opção pode ser alterada depois.
6. Pesquise por número da nota ou cliente. A primeira preparação cria um índice em disco. Revise os dados e volumes antes de adicionar ao lote e imprimir.

A conta do Windows precisa ter permissão na pasta. Um compartilhamento exige acesso à rede/VPN da empresa; internet, por si só, não garante esse acesso.

## Sem internet: o que esperar

| Recurso | Disponibilidade |
| --- | --- |
| Manual, edição do lote, prévia e impressão | Offline, com navegador e impressora disponíveis |
| Importar XML salvo no disco | Offline |
| Buscar em pasta local | Offline, com serviço do TagEX aberto |
| Buscar em pasta compartilhada | Exige acesso ao servidor pela rede/VPN |
| Conferir resultado antigo do índice | Exige reler o XML; o índice não é cópia offline dos arquivos |
| Site / PWA | Interface em cache após primeiro acesso online; o navegador pode removê-lo |
| Atualização | Baixe o ZIP com internet ou receba-o por outro meio; execute offline |

Não há consulta de CEP nem validação online da situação fiscal. Confira a situação da nota no sistema da empresa quando necessário.

## Onde os dados ficam

- Programa instalado: %LOCALAPPDATA%\Programs\TagEX.
- Configuração de pastas, índice e último erro: %LOCALAPPDATA%\EtiquetasExpedicao.
- Empresa, logo, preferências e lote: armazenamento do navegador, no endereço usado.
- XMLs: permanecem nas pastas originais.

**Site e aplicativo local têm dados separados.** Não há migração automática entre endereços ou navegadores. Use sempre o mesmo navegador e endereço local; não limpe seus dados sem antes tratar os cadastros/lote conforme a política da empresa.

## Atualizar, reparar e remover

Encerre pelo ícone ao lado do relógio → **Encerrar**. Extraia o novo ZIP em outra pasta e execute **Instalar TagEX.exe**. O instalador verifica os arquivos e testa o runtime antes de substituir o programa. Não sobrescreve pastas empresariais nem o diretório de dados.

Se a instalação anterior estiver aberta, o instalador pede que seja encerrada. Um pacote incompleto/alterado interrompe a instalação. O manifesto SHA-256 detecta danos; não substitui uma assinatura digital de autoria.

Para remover, use Configurações do Windows → Aplicativos → **TagEX** → **Desinstalar**. Atalhos, início automático desta instalação e programa são removidos; configurações, índice, dados do navegador e XMLs são mantidos.

## Solução rápida

| Sintoma | Ação |
| --- | --- |
| Nada abre depois de mover só o EXE | Extraia todo o ZIP e mantenha os arquivos juntos |
| Serviço desconectado | Abra o atalho TagEX |
| Porta 8788 ocupada | Feche a outra instância pelo próprio ícone; não encerre programas desconhecidos |
| Pasta sem acesso | Confira endereço, conexão com servidor/VPN e permissões |
| Primeira busca demora | Aguarde a preparação; próximas consultas usam o índice persistente |
| Impressora não aparece | Configure-a no Windows; o TagEX não instala drivers |
| Bloqueio de execução | Consulte a política de TI; pacote ainda sem assinatura digital |

Suporte: [gabriel.gnt@outlook.com](mailto:gabriel.gnt@outlook.com). Confira o conteúdo de ultimo-erro.txt antes de compartilhá-lo.
