'use strict';
const fs = require('node:fs/promises');
const { criarFontePastas } = require('../integracao/fontes/pastas.cjs');
async function diagnosticar(pastas) {
  const resultados = [];
  for (const pasta of pastas) {
    try {
      const stat = await fs.stat(pasta);
      if (!stat.isDirectory()) { resultados.push({ pasta, estado: 'inexistente', mensagem: 'Escolha uma pasta, não um arquivo.' }); continue; }
      await fs.readdir(pasta);
      const fonte = criarFontePastas({ id: 'diagnostico', nome: 'Diagnóstico', pastas: [pasta], recursivo: true, limiteEntradas: 100 });
      const dados = await fonte.listar();
      const parcial = dados.erros.some(e => /pasta|acesso/i.test(e.motivo)) || (!dados.notas.length && dados.limitado);
      resultados.push({ pasta, estado: parcial ? 'parcial' : dados.notas.length ? 'pronta' : dados.erros.length ? 'xml-invalido' : 'vazia', notas: dados.notas.length, avisos: dados.erros.length, limitado: dados.limitado, mensagem: parcial ? 'Teste parcial: há subpastas indisponíveis ou a amostra não encontrou notas válidas.' : dados.notas.length ? 'Notas válidas encontradas na amostra.' : dados.erros.length ? 'Arquivos encontrados, mas nenhum XML válido de NF-e.' : 'Pasta acessível. Aguardando XMLs de NF-e.' });
    } catch(e) {
      const estado = ['EACCES','EPERM'].includes(e.code) ? 'sem-acesso' : ['ENOENT','ENOTDIR'].includes(e.code) ? 'inexistente' : 'indisponivel';
      resultados.push({ pasta, estado, mensagem: estado === 'sem-acesso' ? 'Sua conta do Windows não tem acesso à pasta.' : estado === 'inexistente' ? 'Pasta não encontrada. Confira o endereço e a conexão ao servidor.' : 'Não foi possível acessar a pasta. Confira rede e permissões.' });
    }
  }
  return resultados;
}
async function entrada() {
  if (process.argv[2] !== '--stdin') return fs.readFile(process.argv[2], 'utf8');
  let texto = '';
  for await (const parte of process.stdin) { texto += parte; if (texto.length > 65536) throw new Error('Entrada muito grande.'); }
  return texto;
}
if (require.main === module) entrada().then(JSON.parse).then(c => diagnosticar(c.pastas)).then(r => console.log(JSON.stringify(r))).catch(() => { console.error('Não foi possível executar o diagnóstico.'); process.exitCode = 1; });
module.exports = { diagnosticar };
