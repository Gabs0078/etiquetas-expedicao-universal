const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('@xmldom/xmldom');
const { lerXML } = require('../assets/js/nfe.js');
const { xmlNota } = require('./ajudantes.cjs');
const ler = xml => lerXML(xml, DOMParser);
test('normaliza dados e soma todos os qVol', () => {
  const nota = ler(xmlNota());
  assert.equal(nota.nf, '123'); assert.equal(nota.volumes, 5); assert.equal(nota.data, '2026-10-05');
  assert.equal(nota.emitente.nome, 'Empresa Fictícia'); assert.match(nota.destinatario, /Rua Destino, 20/); assert.equal(nota.descricao, 'Item & Exemplo'); assert.equal(nota.autorizada, true);
});
test('aceita namespace com prefixo e status 150', () => {
  const xml = xmlNota({ status: '150' }).replace(/xmlns=/g, 'xmlns:n=').replace(/<(\/?)([A-Za-z][A-Za-z0-9]*)/g, '<$1n:$2');
  assert.equal(ler(xml).volumes, 5);
});
test('endereço de entrega prevalece sobre o fiscal', () => {
  const nota = ler(xmlNota({ entrega: '<entrega><xLgr>Rua Entrega</xLgr><nro>9</nro><xMun>Outro Destino</xMun><UF>PR</UF></entrega>' }));
  assert.match(nota.destinatario, /Rua Entrega/); assert.doesNotMatch(nota.destinatario, /Rua Destino/); assert.ok(nota.avisos.length);
});
test('volumes ausentes, fracionários, zero e acima do limite exigem preenchimento', () => {
  for (const volumes of ['', '<vol/>', '<vol><qVol>1.5</qVol></vol>', '<vol><qVol>0</qVol></vol>', '<vol><qVol>1000</qVol></vol>']) assert.equal(ler(xmlNota({ volumes })).volumes, null);
});
test('sem protocolo exige revisão, sem alegar autorização', () => {
  const nota = ler(xmlNota({ semProtocolo: true })); assert.equal(nota.autorizada, false); assert.match(nota.avisos.join(' '), /Sem protocolo/);
});
test('bloqueia rejeitada, cancelada, homologação, entrada e outros modelos', () => {
  for (const status of ['101', '110', '301', '999']) assert.throws(() => ler(xmlNota({ status })), /autorização/);
  for (const [de, para] of [['<tpAmb>1', '<tpAmb>2'], ['<tpNF>1', '<tpNF>0'], ['<mod>55', '<mod>65']]) assert.throws(() => ler(xmlNota().replace(de, para)));
});
test('bloqueia divergências, data impossível e XML malformado', () => {
  assert.throws(() => ler(xmlNota().replace('<nNF>123', '<nNF>999')), /diverge/);
  assert.throws(() => ler(xmlNota().replace('<chNFe>35', '<chNFe>99')), /Protocolo/);
  assert.throws(() => ler(xmlNota().replaceAll('http://www.portalfiscal.inf.br/nfe', 'https://outro')), /namespace/);
  assert.throws(() => ler(xmlNota().replace('2026-10-05', '2026-02-30')), /Data/);
  assert.throws(() => ler(xmlNota().replace('</dest>', '</errado>')), /malformado/);
});
test('bloqueia DTD, eventos, resumos e XML maior que 2 MB', () => {
  assert.throws(() => ler('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]>' + xmlNota()), /DTD/);
  assert.throws(() => ler('<resNFe/>'), /completa/);
  assert.throws(() => ler('<procEventoNFe/>'), /completa/);
  assert.throws(() => ler('x'.repeat(2 * 1024 * 1024 + 1)), /limite/);
});

function comComplemento(texto, entrega = '') {
  return xmlNota({entrega}).replace('</infNFe>', '<infAdic><infCpl>'+texto+'</infCpl></infAdic></infNFe>');
}
test('entrega no rodapé substitui endereço fiscal sem carregar vendedor, pedido ou CEP fiscal', () => {
  const n=ler(comComplemento('DOCUMENTO SIMPLES; OFM 123; ENTREGA R. DA ENTREGA DE TESTE, S/N - GALPAO DE TESTE; CIDADE EXEMPLO / PR; Vendedor: Exemplo; NOTA FISCAL REF. AO PEDIDO: 123'));
  assert.equal(n.destinatario,'Cliente Fictício\nR. DA ENTREGA DE TESTE, S/N - GALPAO DE TESTE\nCIDADE EXEMPLO / PR');
  assert.equal(n.origemEndereco,'informacoes-complementares');
  assert.match(n.avisos.join(' '),/informações complementares/);
  assert.doesNotMatch(n.destinatario,/CEP|Vendedor|PEDIDO|Rua Destino/);
});
test('campo próprio de entrega tem prioridade sobre o rodapé', () => {
  const n=ler(comComplemento('ENTREGA Rua Outra, 2; Curitiba / PR','<entrega><xLgr>Rua Oficial</xLgr><nro>9</nro><xMun>Curitiba</xMun><UF>PR</UF></entrega>'));
  assert.equal(n.origemEndereco,'entrega');
  assert.match(n.destinatario,/Rua Oficial/);
  assert.doesNotMatch(n.destinatario,/Rua Outra/);
  assert.match(n.avisos.join(' '),/Também há/);
});
test('texto ambíguo ou incompleto exige conferência sem inventar endereço de entrega', () => {
  for(const c of ['ENTREGA Rua Nova, 1; Vendedor: Exemplo','ENTREGA Rua A, 1; Curitiba / PR; ENTREGA Rua B, 2; Araucaria / PR','ENTREGA EM 30 DIAS; Curitiba / PR']){
    const n=ler(comComplemento(c));
    assert.equal(n.origemEndereco,'destinatario');
    assert.match(n.avisos.join(' '),/não foi identificado com segurança/);
  }
  const n=ler(comComplemento('PRAZO DE ENTREGA: 30 DIAS; Vendedor: Exemplo'));
  assert.equal(n.origemEndereco,'destinatario');
  assert.doesNotMatch(n.avisos.join(' '),/indicação de ENTREGA/);
});
test('marcador com dois pontos e quebras de linha mantém endereço completo', () => {
  const n=ler(comComplemento('Endereço de entrega: Avenida Exemplo, 12\nCentro\nAraucária / PR\nVendedor: Outro'));
  assert.equal(n.destinatario,'Cliente Fictício\nAvenida Exemplo, 12\nCentro\nAraucária / PR');
});
test('CEP de entrega é opcional e vem apenas do mesmo trecho das informações complementares', () => {
  for(const final of ['Curitiba / PR; CEP: 81234567; Vendedor: Exemplo','Curitiba / PR CEP 81234-567; Vendedor: Exemplo']){
    const n=ler(comComplemento('ENTREGA Rua Exemplo, 5; '+final));
    assert.match(n.destinatario,/CEP: 81234-567/);
    assert.doesNotMatch(n.destinatario,/00000-000|Vendedor/);
  }
  for(const final of ['Curitiba / PR; Vendedor: Exemplo; CEP: 81234567','Curitiba / PR; CEP: 1234','Curitiba / PR']){
    const n=ler(comComplemento('ENTREGA Rua Exemplo, 5; '+final));
    assert.doesNotMatch(n.destinatario,/CEP/);
    assert.equal(n.origemEndereco,'informacoes-complementares');
  }
});
test('entrega explícita com número e cidade sem UF não volta ao endereço fiscal', () => {
  for(const c of ['ENTREGA R. EXEMPLO DE ENTREGA, 1234 - CURITIBA; Vendedor: Exemplo; NOTA FISCAL REF. AO PEDIDO: 123','ENTREGA R. EXEMPLO DE ENTREGA, 1234 - CURITIBA; CEP: 81234567; Vendedor: Exemplo']){
    const n=ler(comComplemento(c));
    assert.equal(n.origemEndereco,'informacoes-complementares');
    assert.match(n.destinatario,/R\. EXEMPLO DE ENTREGA, 1234 - CURITIBA/);
    assert.doesNotMatch(n.destinatario,/Rua Destino|Cidade Destino|00000-000|Vendedor|PEDIDO/);
    assert.doesNotMatch(n.destinatario,/CURITIBA \/ SP/);
  }
});