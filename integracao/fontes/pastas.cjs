'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { DOMParser } = require('@xmldom/xmldom');
const { lerXML, LIMITE_XML } = require('../../assets/js/nfe.js');

/* Contrato da fonte: listar() -> {notas, erros, limitado}; obter(id) -> nota.
   Caminhos nunca são recebidos pela API; links simbólicos não são seguidos. */
function criarFontePastas(config) {
  if (!Array.isArray(config.pastas) || !config.pastas.length || config.pastas.some(p => typeof p !== 'string' || !path.isAbsolute(p))) throw new Error(`Fonte ${config.id}: configure pastas absolutas.`);
  const cnpj = String(config.cnpjEmitente || '').replace(/\D/g, '');
  if (cnpj && !/^\d{14}$/.test(cnpj)) throw new Error(`Fonte ${config.id}: CNPJ inválido.`);
  let registros = new Map();
  let ultima = 0;
  let resultado;
  let pendente;
  const dentro = (raiz, alvo) => {
    const relativo = path.relative(raiz, alvo);
    return relativo === '' || (!relativo.startsWith(`..${path.sep}`) && relativo !== '..' && !path.isAbsolute(relativo));
  };
  async function lerArquivo(raiz, arquivo) {
    const real = await fs.realpath(arquivo);
    if (!dentro(raiz, real) || (await fs.lstat(arquivo)).isSymbolicLink()) throw new Error('Arquivo fora da pasta permitida.');
    const antes = await fs.stat(real);
    if (!antes.isFile() || antes.size > LIMITE_XML) throw new Error('Arquivo excede 2 MB ou não é regular.');
    const buffer = await fs.readFile(real);
    const depois = await fs.stat(real);
    if (buffer.length > LIMITE_XML || antes.size !== depois.size || antes.mtimeMs !== depois.mtimeMs) throw new Error('Arquivo em gravação; tente novamente.');
    const nota = lerXML(new TextDecoder('utf-8', { fatal: true }).decode(buffer), DOMParser);
    if (cnpj && nota.emitente.cnpj !== cnpj) return null;
    return nota;
  }
  async function varrer() {
    const novos = new Map();
    const erros = [];
    let limitado = false;
    function erro(arquivo, motivo) {
      if (erros.length < 50) erros.push({ arquivo, motivo });
    }
    for (const pasta of config.pastas) {
      let visitados = 0;
      let raiz;
      try { raiz = await fs.realpath(pasta); } catch { erro('Pasta configurada', 'Pasta indisponível. Verifique acesso no servidor.'); continue; }
      async function visitar(diretorio, profundidade = 0) {
        if (profundidade > 20 || visitados >= 10000) { limitado = true; return; }
        let entradas;
        try { entradas = await fs.readdir(diretorio, { withFileTypes: true }); } catch { erro(path.basename(diretorio), 'Sem acesso à pasta.'); return; }
        for (const entrada of entradas) {
          if (++visitados > 10000) { limitado = true; break; }
          const arquivo = path.join(diretorio, entrada.name);
          if (entrada.isSymbolicLink()) continue;
          if (entrada.isDirectory() && config.recursivo !== false) {
            try { if (dentro(raiz, await fs.realpath(arquivo))) await visitar(arquivo, profundidade + 1); } catch { erro(entrada.name, 'Pasta indisponível.'); }
          } else if (entrada.isFile() && /\.xml$/i.test(entrada.name)) {
            try {
              const nota = await lerArquivo(raiz, arquivo);
              if (!nota) continue;
              const id = createHash('sha256').update(`${config.id}\0${arquivo}`).digest('hex');
              novos.set(id, { ...nota, id, arquivo: entrada.name, fonte: config.id, raiz, caminho: arquivo });
            } catch (e) { erro(entrada.name, e.message.startsWith('XML') || e.message.startsWith('NF-e') || e.message.startsWith('Apenas') || e.message.startsWith('Nota') || e.message.startsWith('Esta') || e.message.startsWith('Envie') || e.message.startsWith('Chave') || e.message.startsWith('Protocolo') || e.message.startsWith('Número') || e.message.startsWith('Data') || e.message.startsWith('Arquivo') || e.message.startsWith('Estrutura') ? e.message : 'Não foi possível ler o XML.'); }
          }
        }
      }
      await visitar(raiz);
      if (visitados > 10000) erro(path.basename(pasta), 'Limite de 10.000 entradas nesta pasta. Separe o histórico em pastas menores.');
    }
    registros = novos;
    ultima = Date.now();
    resultado = { notas: Array.from(registros.values()).map(({ raiz, caminho, ...nota }) => nota), erros, limitado };
    return resultado;
  }
  return {
    id: config.id, nome: config.nome || config.id, tipo: 'pastas',
    async listar(forcar = false) {
      if (!forcar && resultado && Date.now() - ultima < 10000) return resultado;
      if (!pendente) pendente = varrer().finally(() => { pendente = null; });
      return pendente;
    },
    async obter(id) {
      if (!registros.has(id)) await this.listar();
      const registro = registros.get(id);
      if (!registro) return null;
      try {
        const nota = await lerArquivo(registro.raiz, registro.caminho);
        return nota ? { ...nota, id, fonte: config.id, arquivo: registro.arquivo } : null;
      } catch { return null; }
    }
  };
}
module.exports = { criarFontePastas };
