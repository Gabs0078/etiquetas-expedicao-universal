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
