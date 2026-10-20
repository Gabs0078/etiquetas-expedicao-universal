# Construir e publicar o pacote Windows

Estas instruções são para manutenção. Para usuários, consulte [Instalação e uso offline](instalacao-windows.md).

## Construção reproduzível

Em Windows, com Node.js 24, pnpm 11.25.0 e Windows PowerShell 5.1:

1. Instale as dependências com pnpm install --frozen-lockfile.
2. Execute powershell.exe -NoProfile -ExecutionPolicy Bypass -File desktop/preparar-runtime.ps1. O script baixa Node.js 24.22.0 win-x64 do domínio oficial nodejs.org, confere o SHA-256 publicado e inclui a licença. A internet é usada na construção, não na instalação do usuário.
3. Execute powershell.exe -NoProfile -ExecutionPolicy Bypass -File desktop/empacotar.ps1 -Destino CAMINHO-NOVO.zip.
4. O resultado contém o ZIP, seu arquivo .sha256 e uma pasta temporária preservada para inspeção. O destino existente não é sobrescrito.

O bootstrap C# é compilado como aplicação Windows e apenas inicia o PowerShell incluído no Windows, sem console. O EXE não é um pacote autônomo: distribua o ZIP completo. Assinatura Authenticode ainda não está implementada.

scripts/pacote-windows.cjs usa lista explícita de arquivos e inclui apenas o parser XML de produção. Não inclui config.local.json, XMLs, banco do índice, dependências de teste ou outras pastas pessoais. pacote.json registra a versão e SHA-256 de cada arquivo. O instalador verifica a lista antes e depois da cópia e inicia o runtime para verificar os módulos.

## Validação automatizada

Execute os testes gerais e de navegador. Para validar o ZIP no Windows, defina TAGEX_PACOTE_TESTE com o caminho absoluto e execute pnpm test. O comando também mantém os testes legados em português; testes específicos conferem os quatro idiomas separadamente.

O teste usa uma pasta temporária, sem Node global no PATH. Instala duas vezes, verifica dados externos preservados, rejeita pacote danificado e destino alheio, abre serviço/sessão com runtime incluído e remove a instalação. Não cria atalhos nem registros na conta real do desenvolvedor.

O teste do guia bloqueia conexões externas e verifica digitação/importação/recarregamento, temas e telas de 320 a 1440 px. O teste de Pages valida o guia também no cache offline.

## Instalação e atualização

O destino padrão é %LOCALAPPDATA%\Programs\TagEX. Configuração e índice permanecem em %LOCALAPPDATA%\EtiquetasExpedicao. O lote/cadastro são do navegador e não são migrados entre origens.

O instalador exige que o iniciador da mesma conta esteja fechado. Faz cópia em pasta temporária adjacente, valida, move a instalação anterior e ativa a nova. Se a ativação falhar, recupera a pasta anterior. Recusa substituir uma pasta sem o marcador de instalação TagEX. Uma atualização mantém a opção de início automático já existente quando reconhece o comando do próprio TagEX.

Atalhos e registro de desinstalação usam somente a conta atual. A remoção preserva configurações e XMLs. Não modifica driver, compartilhamento, firewall, políticas do PowerShell ou outras instalações do Node.

## CI e publicação

O workflow verifica leitor/API/navegador, constrói e testa o ZIP no Windows e guarda o pacote como artefato. Na branch main, publica uma Release para a versão do package.json se ela ainda não existir; Releases existentes não são sobrescritas. A publicação do Pages depende dessas etapas.

Para outra versão: atualize package.json, a versão e o link no guia/site/README, o teste de versão do pacote e as notas de versão. Não reutilize um número já publicado para um pacote diferente. Nunca publique dados empresariais.

## Homologação que ainda depende do ambiente

Os testes automatizados não certificam SmartScreen, políticas corporativas, antivírus, impressoras ou acesso a servidores reais. Confira instalação por conta padrão, ações dos botões das janelas, atalhos, login com/sem rede, permissão em compartilhamentos e impressão física. Não prometa assinatura digital ou atualização automática enquanto não existirem.
