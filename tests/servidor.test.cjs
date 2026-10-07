const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { criarServidor } = require('../integracao/servidor.cjs');
const { criarFontePastas } = require('../integracao/fontes/pastas.cjs');
const { xmlNota } = require('./ajudantes.cjs');
test('busca em subpastas, protege dados e obtém o XML atualizado', async t => {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-teste-'));
  t.after(() => fs.rm(pasta, { recursive: true, force: true }));
  await fs.mkdir(path.join(pasta, 'mes'));
  const arquivo = path.join(pasta, 'mes', 'nota.xml');
  await fs.writeFile(arquivo, xmlNota());
  await fs.writeFile(path.join(pasta, 'evento.xml'), '<procEventoNFe/>');
  const { servidor, token } = criarServidor({ fontes: [{ id: 'teste', tipo: 'pastas', pastas: [pasta] }] });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal((await fetch(`${base}/api/fontes`)).status, 401);
  assert.equal((await fetch(`${base}/api/fontes`, { headers: { ...headers, Origin: 'https://malicioso.example' } })).status, 403);
  const hostInvalido = await new Promise((resolve, reject) => {
    http.get(`${base}/api/fontes`, { headers: { ...headers, Host: `evil.example:${servidor.address().port}` } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  });
  assert.equal(hostInvalido, 403);
  assert.equal((await fetch(`${base}/integracao/config.local.json`)).status, 404);
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
  const resultado = await (await fetch(`${base}/api/notas?fonte=teste&busca=123`, { headers })).json();
  assert.equal(resultado.notas.length, 1); assert.equal(resultado.erros.length, 1);
  assert.doesNotMatch(JSON.stringify(resultado), /caminho|raiz|etiquetas-teste-/);
  const id = resultado.notas[0].id;
  const nota = await (await fetch(`${base}/api/notas/${id}?fonte=teste`, { headers })).json();
  assert.equal(nota.nota.volumes, 5);
  assert.equal((await (await fetch(`${base}/api/notas?fonte=teste&inicio=2026-11-01`, { headers })).json()).notas.length, 0);
  assert.equal((await fetch(`${base}/api/notas?fonte=teste&inicio=2026-12-01&fim=2026-01-01`, { headers })).status, 400);
  await fs.writeFile(arquivo, xmlNota({ status: '101' }));
  assert.equal((await fetch(`${base}/api/notas/${id}?fonte=teste`, { headers })).status, 404);
});
test('filtra emitente e informa pasta indisponível', async t => {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-teste-'));
  t.after(() => fs.rm(pasta, { recursive: true, force: true }));
  await fs.writeFile(path.join(pasta, 'nota.xml'), xmlNota());
  const fonte = criarFontePastas({ id: 'teste', pastas: [pasta, path.join(pasta, 'ausente')], cnpjEmitente: '99999999999999' });
  const resultado = await fonte.listar();
  assert.equal(resultado.notas.length, 0); assert.equal(resultado.erros.length, 1);
});
test('configuração inválida falha antes de iniciar', () => {
  assert.throws(() => criarServidor({ fontes: [{ id: '../x', tipo: 'pastas', pastas: [] }] }));
  assert.throws(() => criarFontePastas({ id: 'x', pastas: ['relativa'] }));
});
test('uma pasta grande nao impede a leitura das pastas seguintes', async t => {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-teste-'));
  t.after(() => fs.rm(pasta, { recursive: true, force: true }));
  const grande = path.join(pasta, 'grande');
  const seguinte = path.join(pasta, 'seguinte');
  await fs.mkdir(grande);
  await fs.mkdir(seguinte);
  await fs.writeFile(path.join(seguinte, 'nota.xml'), xmlNota());
  const readdir = fs.readdir.bind(fs);
  const grandeReal = await fs.realpath(grande);
  t.mock.method(fs, 'readdir', async (diretorio, opcoes) => diretorio === grandeReal
    ? Array.from({ length: 10001 }, (_, i) => ({ name: `${i}.txt`, isSymbolicLink: () => false, isDirectory: () => false, isFile: () => true }))
    : readdir(diretorio, opcoes));
  const resultado = await criarFontePastas({ id: 'teste', pastas: [grande, seguinte] }).listar();
  assert.equal(resultado.limitado, true);
  assert.equal(resultado.notas.length, 1);
  assert.equal(resultado.notas[0].serie, '1');
});
test('busca numerica corresponde a sequencia na NF, sem coincidencias no endereco ou chave', async t => {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-teste-'));
  t.after(() => fs.rm(pasta, { recursive: true, force: true }));
  for (const nf of ['533', '123533', '125333', '5353', '123']) {
    const xml = xmlNota().replaceAll('000000123', nf.padStart(9, '0')).replace('<nNF>123', `<nNF>${nf}`).replace('Rua Destino', 'Rua 533');
    await fs.writeFile(path.join(pasta, `${nf}.xml`), xml);
  }
  const { servidor, token } = criarServidor({ fontes: [{ id: 'teste', tipo: 'pastas', pastas: [pasta] }] });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const headers = { Authorization: `Bearer ${token}` };
  const resultado = await (await fetch(`${base}/api/notas?fonte=teste&busca=%20533%20`, { headers })).json();
  assert.equal(resultado.erros.length, 0);
  assert.deepEqual(resultado.notas.map(n => n.nf).sort(), ['123533', '125333', '533']);
  const chave = resultado.notas[0].chave;
  const exata = await (await fetch(`${base}/api/notas?fonte=teste&busca=${chave}`, { headers })).json();
  assert.equal(exata.notas.length, 1);
  const texto = await (await fetch(`${base}/api/notas?fonte=teste&busca=rua%20533`, { headers })).json();
  assert.equal(texto.notas.length, 5);
});
test('uma fonte busca XMLs em varias pastas e preserva o acesso individual', async t => {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'etiquetas-teste-'));
  t.after(() => fs.rm(pasta, { recursive: true, force: true }));
  const pastas = [path.join(pasta, 'empresa1'), path.join(pasta, 'empresa2')];
  for (const diretorio of pastas) {
    await fs.mkdir(diretorio);
    await fs.writeFile(path.join(diretorio, 'nota.xml'), xmlNota());
  }
  const fonte = criarFontePastas({ id: 'expedicao', pastas });
  const resultado = await fonte.listar();
  assert.equal(resultado.notas.length, 2);
  assert.equal(new Set(resultado.notas.map(n => n.id)).size, 2);
  const varredura = t.mock.method(fs, 'readdir', () => { throw new Error('Selecao nao deve varrer novamente.'); });
  for (const nota of resultado.notas) assert.equal((await fonte.obter(nota.id)).nf, '123');
  assert.equal(varredura.mock.callCount(), 0);
});
