# Roadmap

## v0.2.0 — Importação modular e base de estabilidade

- [x] Preservar digitação manual e abertura direta de `index.html`.
- [x] Upload de XML de NF-e, inclusive vários arquivos.
- [x] Normalizador compartilhado e revisão obrigatória.
- [x] Duplicidade por chave no lote e na fila.
- [x] Remetente mantido por nota, independente da empresa selecionada.
- [x] Serviço local opcional com várias fontes de pastas e filtro de emitente.
- [x] Busca por dados da nota e período, com atualização opcional.
- [x] API autenticada e cache offline somente dos estáticos.
- [x] Testes do leitor, serviço, navegador e regras de impressão.
- [x] Remover orientações de IA da árvore pública proposta.

## Próximas etapas — conforme necessidades das empresas

- [ ] Homologar com XMLs representativos dos ERPs e impressoras reais.
- [ ] Conciliar eventos de cancelamento e definir regras para notas sem protocolo.
- [ ] Acrescentar conector de API de ERP quando houver contrato e acesso documentados.
- [ ] Índice persistente e atualização incremental para históricos extensos de XMLs.
- [ ] Importação de pasta escolhida no navegador, com fallback por upload.
- [ ] Exportação e restauração de lotes e configurações do navegador.
- [ ] Centralizar serviço em intranet com HTTPS, usuários e isolamento por empresa.
- [ ] Leitores específicos para outros documentos quando houver demanda.
- [ ] Substituir confirmações nativas e acrescentar máscaras de cadastro.

## Critérios para uma versão 1.0

Fluxos de expedição e regras de importação homologados nas empresas atendidas; impressão física verificada; instalação e atualização documentadas; falhas de rede, armazenamento e ERP verificadas; critérios definidos para autorização, cancelamento, duplicidades e reimpressão. A estrutura atual permite evoluir por adaptadores sem reescrever a interface.
