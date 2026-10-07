const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarServidor } = require('../integracao/servidor.cjs');
const { execFile, spawn } = require('node:child_process');
const { once } = require('node:events');
const { promisify } = require('node:util');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');

test('sessao desktop exige ingresso unico e protege rotas locais', async t => {
  const { servidor, token } = criarServidor({}, { desktop: true });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal((await fetch(`${base}/api/sessao`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}/api/sessao`, { method: 'POST', headers: { ...headers, Origin: 'https://outro.example' } })).status, 403);
  const { caminho } = await (await fetch(`${base}/api/sessao`, { method: 'POST', headers })).json();
  const abertura = await fetch(base + caminho, { redirect: 'manual' });
  assert.equal(abertura.status, 303);
  const cookie = abertura.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal((await fetch(base + caminho, { redirect: 'manual' })).status, 401);
  assert.equal((await fetch(`${base}/api/fontes`)).status, 401);
  const fontes = await (await fetch(`${base}/api/fontes`, { headers: { Cookie: cookie.split(';')[0] } })).json();
  assert.equal(fontes.desktop, true);
  assert.equal((await fetch(`${base}/api/fontes`, { headers: { Cookie: cookie.split(';')[0], Origin: 'https://outro.example' } })).status, 403);
  assert.equal((await fetch(`${base}/api/sessao`, { method: 'POST', headers: { Cookie: cookie.split(';')[0] } })).status, 401);
});

test('iniciador Windows falha sem encerrar o dono de uma porta ocupada', { skip: process.platform !== 'win32' }, async t => {
  const { servidor } = criarServidor();
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const porta = servidor.address().port;
  await assert.rejects(promisify(execFile)('powershell.exe', [
    '-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File',
    path.resolve(__dirname, '../desktop/iniciar.ps1'), '-Verificar', '-Porta', String(porta),
    '-DiretorioDados', path.join(os.tmpdir(), `etiquetas-ausente-${randomUUID()}`)
  ], { timeout: 30000 }), erro => erro.code === 1 && /porta pode estar ocupada/.test(erro.stderr));
  assert.equal((await fetch(`http://127.0.0.1:${porta}`)).status, 200);
});
test('servico desktop encerra quando o iniciador desaparece', { timeout: 15000 }, async t => {
  const { servidor: reserva } = criarServidor();
  await new Promise(resolve => reserva.listen(0, '127.0.0.1', resolve));
  const porta = reserva.address().port;
  await new Promise(resolve => reserva.close(resolve));
  const pai = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
  const filho = spawn(process.execPath, [path.resolve(__dirname, '../integracao/servidor.cjs')], {
    env: { ...process.env, PORT: String(porta), ETIQUETAS_DESKTOP: '1', ETIQUETAS_PARENT_PID: String(pai.pid), ETIQUETAS_CONFIG: path.join(os.tmpdir(), `etiquetas-ausente-${randomUUID()}.json`) }
  });
  t.after(() => { if (pai.exitCode === null) pai.kill(); if (filho.exitCode === null) filho.kill(); });
  await once(filho.stdout, 'data');
  const saida = once(filho, 'exit');
  pai.kill();
  assert.equal((await saida)[0], 0);
});
