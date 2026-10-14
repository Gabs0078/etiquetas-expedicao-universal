# Validação da versão 0.3.0

## Verificações de desenvolvimento
- 30 testes automatizados de parser, fontes, índice em disco, diagnóstico, autenticação e iniciador Windows.
- Suíte de navegador para preenchimento manual, importação, revisão, duplicidades, persistência, cache offline, integração, cabeçalho, temas e avisos contextuais.
- Prévia e impressão em seis formatos de papel, disposições 10/4/3/2/1 quando aplicáveis, Grade/Lista e bobinas.
- Testes usam dados fictícios. XMLs reais, caminhos de rede, configurações locais e métricas privadas do piloto ficam fora do repositório.
- O usuário informou aprovação dos testes físicos em 13/10/2026; isso se refere ao equipamento utilizado no piloto, sem homologação universal de impressoras.

## Limites e verificações manuais restantes
A seleção de pastas, cancelamento, recuperação de falhas e início após login precisam ser conferidos na janela nativa do Windows e em conta padrão, com/sem rede. O pacote distribuível inclui runtime e parser; não há instalador assinado nem atualização automática.

O iniciador não altera driver, compartilhamento de impressão ou firewall. A importação não valida assinatura digital nem consulta a situação atual na SEFAZ; o usuário deve conferir a nota no sistema da empresa.
