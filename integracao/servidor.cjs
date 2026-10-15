'use strict';
const http = require('node:http');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes, timingSafeEqual } = require('node:crypto');
const { criarFontePastas } = require('./fontes/pastas.cjs');
const FABRICAS = { pastas: criarFontePastas };
const RAIZ_APP = path.resolve(__dirname, '..');
const ESTATICOS = ['assets/brand/tagex-compartilhamento-v1.png', 'index.html', 'sw.js', 'manifest.webmanifest', 'assets/css/styles.css', 'assets/js/app.js', 'assets/js/nfe.js', 'assets/js/importacao.js', 'assets/js/fontes.js', 'assets/icons/github-invertocat-black.svg', 'assets/icons/github-invertocat-white.svg', 'assets/icons/app-icon.svg', 'assets/icons/app-icon-192.png', 'assets/icons/app-icon-512.png'];
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
function correspondeBusca(nota, busca) {
  if (!busca) return true;
  if (/^\d+$/.test(busca)) return busca.length === 44 ? nota.chave === busca : nota.nf.includes(busca);
  return [nota.destinatario, nota.emitente.nome].some(texto => texto.toLocaleLowerCase('pt-BR').includes(busca));
}
function criarServidor(config = {}, opcoes = {}) {
  const token = process.env.ETIQUETAS_TOKEN || randomBytes(32).toString('hex');
  if (token.length < 32) throw new Error('ETIQUETAS_TOKEN precisa ter pelo menos 32 caracteres.');
  const fontes = new Map();
  for (const fonte of config.fontes || []) {
    if (!/^[a-z0-9-]{1,40}$/.test(fonte.id || '') || fontes.has(fonte.id) || !FABRICAS[fonte.tipo]) throw new Error('Fonte inválida, duplicada ou sem adaptador.');
    fontes.set(fonte.id, opcoes.diretorioIndice ? require('./fontes/indice.cjs').criarIndice(fonte, opcoes.diretorioIndice) : FABRICAS[fonte.tipo](fonte));
  }
  const sessao = randomBytes(32).toString('hex');
  const ingressos = new Map();
  let abrirAssistente = false;
  const emitirIngresso = () => {
    for (const [codigo, validade] of ingressos) { if (validade < Date.now()) ingressos.delete(codigo); }
    const ingresso = randomBytes(32).toString('hex');
    ingressos.set(ingresso, Date.now() + 60000);
    return ingresso;
  };
  const autenticar = req => {
    if (opcoes.desktop && (req.headers.cookie || '').split(';').some(c => c.trim() === `etiquetas_sessao=${sessao}`)) return true;
    const recebido = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
    const esperado = Buffer.from(token);
    return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
  };
  const servidor = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const responder = (codigo, dados) => { res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(dados)); };
    try {
      const host = req.headers.host || '';
      const porta = servidor.address()?.port;
      if (![`127.0.0.1:${porta}`, `localhost:${porta}`].includes(host)) return responder(403, { erro: 'Host não permitido.' });
      if ((req.headers.origin && req.headers.origin !== `http://${host}`) || req.headers['sec-fetch-site'] === 'cross-site') return responder(403, { erro: 'Abra o aplicativo pelo endereço do serviço.' });
      const url = new URL(req.url, `http://${host}`);
      if (opcoes.desktop && url.pathname === '/iniciar' && req.method === 'GET') {
        const ingresso = url.searchParams.get('codigo');
        const validade = ingressos.get(ingresso);
        ingressos.delete(ingresso);
        if (!validade || validade < Date.now()) return responder(401, { erro: 'Abra novamente pelo ícone do aplicativo.' });
        // Entregar a interface na própria navegação evita uma segunda carga via redirecionamento/cache.
        const html = await fs.readFile(path.join(RAIZ_APP, 'index.html'), 'utf8');
        res.setHeader('Cache-Control', 'no-cache');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'etiquetas_sessao=' + sessao + '; HttpOnly; SameSite=Strict; Path=/' });
        return res.end(html.replace('<head>', "<head><script>history.replaceState(null, '', '/');</script>"));
      }
      if (opcoes.desktop && url.pathname === '/api/sessao' && req.method === 'POST') {
        const recebido = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
        const esperado = Buffer.from(token);
        if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return responder(401, { erro: 'Acesso negado.' });
        return responder(200, { caminho: `/iniciar?codigo=${emitirIngresso()}` });
      }
      if (opcoes.desktop && url.pathname === '/api/assistente' && req.method === 'POST') {
        if (!autenticar(req)) return responder(401, { erro: 'Abra novamente pelo ícone do aplicativo.' });
        abrirAssistente = true;
        return responder(202, { solicitado: true });
      }
      if (opcoes.desktop && url.pathname === '/api/controle' && req.method === 'GET') {
        const recebido = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
        const esperado = Buffer.from(token);
        if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return responder(401, { erro: 'Acesso negado.' });
        const solicitado = abrirAssistente; abrirAssistente = false;
        return responder(200, { abrirAssistente: solicitado });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return responder(405, { erro: 'Método não permitido.' });
      if (url.pathname.startsWith('/api/')) {
        if (!autenticar(req)) return responder(401, { erro: 'Informe o código de acesso mostrado no serviço.' });
        if (opcoes.desktop && url.pathname === '/api/diagnostico') {
          const pastas = [...new Set((config.fontes || []).filter(f => f.tipo === 'pastas').flatMap(f => f.pastas))];
          const filho = execFile(process.execPath, [path.join(RAIZ_APP, 'desktop/diagnostico.cjs'), '--stdin'], { timeout: 30000, maxBuffer: 1024 * 1024, windowsHide: true }, (erro, stdout) => {
            if (erro) return responder(504, { erro: 'O teste demorou ou falhou. Confira a rede e tente novamente.' });
            try { responder(200, { pastas: JSON.parse(stdout) }); } catch { responder(500, { erro: 'Resultado do diagnóstico indisponível.' }); }
          });
          filho.stdin.on('error', () => {});
          filho.stdin.end(JSON.stringify({ pastas }));
          return;
        }
        if (url.pathname === '/api/fontes') return responder(200, { desktop: Boolean(opcoes.desktop), fontes: Array.from(fontes.values()).map(({ id, nome, tipo }) => ({ id, nome, tipo })) });
        const fonte = fontes.get(url.searchParams.get('fonte'));
        if (!fonte) return responder(400, { erro: 'Selecione uma fonte configurada.' });
        if (url.pathname === '/api/indice') return responder(200, fonte.progresso ? fonte.progresso() : {habilitado:false,pronto:true});
        if (url.pathname === '/api/notas') {
          const inicio = url.searchParams.get('inicio') || '';
          const fim = url.searchParams.get('fim') || '';
          if ([inicio, fim].some(v => v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) || (inicio && fim && inicio > fim)) return responder(400, { erro: 'Período inválido.' });
          const busca = (url.searchParams.get('busca') || '').trim().slice(0, 100).toLocaleLowerCase('pt-BR');
          if (fonte.pesquisar) { const r = await fonte.pesquisar({busca,inicio,fim}); return responder(r.preparando ? 202 : 200, r); }
          const resultado = await fonte.listar();
          const filtradas = resultado.notas.filter(n => (!inicio || n.data >= inicio) && (!fim || n.data <= fim) && correspondeBusca(n, busca)).sort((a, b) => b.data.localeCompare(a.data));
          const notas = filtradas.slice(0, 100).map(({ id, nf, serie, data, destinatario, emitente, chave, volumes }) => ({ id, nf, serie, data, destinatario, emitente: emitente.nome, chave, volumes }));
          return responder(200, { notas, erros: resultado.erros, limitado: resultado.limitado || filtradas.length > 100, total: filtradas.length, atualizadoEm: new Date().toISOString() });
        }
        if (/^\/api\/notas\/[a-f0-9]{64}$/.test(url.pathname)) {
          const nota = await fonte.obter(url.pathname.split('/').pop());
          return responder(nota ? 200 : 404, nota ? { nota } : { erro: 'XML não está mais disponível.' });
        }
        return responder(404, { erro: 'Rota não encontrada.' });
      }
      const arquivo = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (!ESTATICOS.includes(arquivo)) return responder(404, { erro: 'Arquivo não encontrado.' });
      const conteudo = await fs.readFile(path.join(RAIZ_APP, arquivo));
      res.writeHead(200, { 'Content-Type': `${TIPOS[path.extname(arquivo)] || 'application/octet-stream'}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : conteudo);
    } catch { responder(500, { erro: 'Falha na leitura. Verifique as pastas e permissões do serviço.' }); }
  });
  servidor.on('listening', () => { for (const fonte of fontes.values()) fonte.iniciarIndice?.(); });
  servidor.on('close', () => { for (const fonte of fontes.values()) void fonte.fechar?.(); });
  return { servidor, token };
}
async function iniciar() {
  const arquivo = process.env.ETIQUETAS_CONFIG || path.join(__dirname, 'config.local.json');
  let config = {};
  try { config = JSON.parse(await fs.readFile(arquivo, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw new Error('Configuração inválida. Revise o JSON.'); }
  const desktop = process.env.ETIQUETAS_DESKTOP === '1';
  if (desktop && Number(process.versions.node.split('.')[0]) < 24) throw new Error('O aplicativo desktop precisa do runtime Node.js 24 incluído no pacote.');
  const pai = Number(process.env.ETIQUETAS_PARENT_PID);
  if (desktop && Number.isInteger(pai) && pai > 0) {
    const vigiarPai = setInterval(() => {
      try { process.kill(pai, 0); }
      catch (erro) { if (erro.code === 'ESRCH') process.exit(0); }
    }, 1000);
    vigiarPai.unref();
  }
  const { servidor, token } = criarServidor(config, { desktop, diretorioIndice: desktop ? path.join(path.dirname(arquivo), 'indice') : undefined });
  const porta = Number(process.env.PORT || 8787);
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) throw new Error('Porta inválida.');
  servidor.listen(porta, '127.0.0.1', () => {
    if (desktop) console.log(JSON.stringify({ porta, token }));
    else console.log(`Etiquetas: http://127.0.0.1:${porta}\nCódigo de acesso: ${token}\nLeitura local; configurações e XMLs não são publicados.`);
  });
  servidor.on('error', () => { console.error('Não foi possível iniciar o serviço. Verifique se a porta está em uso.'); process.exitCode = 1; });
}
if (require.main === module) iniciar().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { criarServidor };
