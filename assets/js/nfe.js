/* Mesmo normalizador no navegador e no serviço opcional. Sem dependência no front-end. */
(function (raiz, criar) {
  const api = criar();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.NFe = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITE_XML = 2 * 1024 * 1024;
  const filhos = (no, nome) => Array.from(no?.childNodes || []).filter(n => n.nodeType === 1 && n.localName === nome);
  const filho = (no, nome) => filhos(no, nome)[0];
  const texto = (no, nome) => (filho(no, nome)?.textContent || '').trim();
  const descendentes = (no, nome) => Array.from(no.getElementsByTagNameNS('*', nome));
  const digitos = valor => String(valor || '').replace(/\D/g, '');
  function endereco(no) {
    return [
      [texto(no, 'xLgr'), texto(no, 'nro')].filter(Boolean).join(', '),
      texto(no, 'xCpl'),
      [texto(no, 'xBairro'), [texto(no, 'xMun'), texto(no, 'UF')].filter(Boolean).join(' / ')].filter(Boolean).join(' - '),
      texto(no, 'CEP') ? `CEP: ${texto(no, 'CEP').replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : ''
    ].filter(Boolean).join('\n');
  }
  function entregaComplementar(informacoes) {
    const marcadores = [...informacoes.matchAll(/(?:^|[;\r\n])\s*(?:ENDERE[ÇC]O\s+DE\s+ENTREGA|LOCAL\s+DE\s+ENTREGA|ENTREGA)\b\s*[:=-]?\s*/gi)];
    if (!marcadores.length) return { encontrado: false };
    if (marcadores.length !== 1) return { encontrado: true };
    const inicio = marcadores[0].index + marcadores[0][0].length;
    const blocos = informacoes.slice(inicio).split(/[;\r\n]+/).map(v => v.trim()).filter(Boolean);
    const partes = [];
    for (const [indice, bloco] of blocos.slice(0, 4).entries()) {
      if (/^(?:VENDEDOR|PEDIDO|NOTA\s+FISCAL|OBSERVA[ÇC][ÕO]ES|CONTATO|TELEFONE|FONE)\s*[:=-]/i.test(bloco)) break;
      partes.push(bloco);
      if (/\b[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s.'-]*\s*\/\s*(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)(?:\s*[-,]?\s*CEP\s*:?\s*\d{5}-?\d{3})?\s*$/i.test(bloco)) {
        // CEP opcional: apenas o explicitamente escrito neste trecho de entrega.
        const proximo = blocos[indice + 1] || '';
        if (/^CEP\s*:?\s*\d{5}-?\d{3}\s*$/i.test(proximo)) partes.push(proximo);
        const valor = partes.join('\n').replace(/CEP\s*:?\s*(\d{5})-?(\d{3})/gi, 'CEP: $1-$2');
        if (/^(?:R(?:UA|ODOVIA)?\.?|AV(?:ENIDA)?\.?|TRAVESSA|TV\.?|ESTRADA|ALAMEDA|AL\.?|ROD\.?|PRA[ÇC]A)\s+/i.test(partes[0]) && valor.length <= 400) return { encontrado: true, endereco: valor };
        break;
      }
    }
    // Preservar endereço explícito sem UF, sem completar pelo cadastro fiscal.
    const primeiro = blocos[0] || '';
    if (/^(?:R(?:UA|ODOVIA)?\.?|AV(?:ENIDA)?\.?|TRAVESSA|TV\.?|ESTRADA|ALAMEDA|AL\.?|ROD\.?|PRA[ÇC]A)\s+/i.test(primeiro) &&
        /,\s*(?:\d+\w*|S\s*\/?\s*N)\b/i.test(primeiro) && /[-–]\s*[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s.'-]*$/i.test(primeiro) && primeiro.length <= 400) {
      const cep = /^CEP\s*:?\s*\d{5}-?\d{3}\s*$/i.test(blocos[1] || '') ? '\n' + blocos[1] : '';
      return { encontrado: true, endereco: (primeiro + cep).replace(/CEP\s*:?\s*(\d{5})-?(\d{3})/gi, 'CEP: $1-$2') };
    }
    return { encontrado: true };
  }
  function lerXML(xml, Parser = globalThis.DOMParser) {
    if (typeof xml !== 'string' || new TextEncoder().encode(xml).length > LIMITE_XML) throw new Error('XML excede o limite de 2 MB.');
    if (/<!\s*(DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error('XML com DTD ou entidades externas não é permitido.');
    const erros = [];
    const parser = new Parser({ onError: (nivel, mensagem) => erros.push(mensagem) });
    let doc;
    try { doc = parser.parseFromString(xml, 'application/xml'); } catch { throw new Error('XML malformado.'); }
    if (!doc?.documentElement || erros.length || descendentes(doc, 'parsererror').length) throw new Error('XML malformado.');
    const raiz = doc.documentElement;
    if (!['NFe', 'nfeProc'].includes(raiz.localName)) throw new Error('Envie uma NF-e completa (NFe ou nfeProc), não um evento ou resumo.');
    const nfe = raiz.localName === 'NFe' ? raiz : filho(raiz, 'NFe');
    const inf = filho(nfe, 'infNFe');
    if (!inf || inf.namespaceURI !== 'http://www.portalfiscal.inf.br/nfe' || descendentes(doc, 'infNFe').length !== 1) throw new Error('Estrutura ou namespace da NF-e inválido.');
    const ide = filho(inf, 'ide');
    if (texto(ide, 'mod') !== '55') throw new Error('Esta versão importa NF-e modelo 55. NFC-e, NFS-e e CT-e exigem outros leitores.');
    if (texto(ide, 'tpNF') !== '1') throw new Error('Apenas notas de saída podem ser importadas para expedição.');
    if (texto(ide, 'tpAmb') !== '1') throw new Error('Nota de homologação não pode gerar etiquetas de expedição.');
    const chave = (inf.getAttribute('Id') || '').replace(/^NFe/, '');
    if (!/^\d{44}$/.test(chave)) throw new Error('Chave de acesso ausente ou inválida.');
    const protocolo = filho(filho(raiz, 'protNFe'), 'infProt');
    const status = texto(protocolo, 'cStat');
    if (protocolo && !['100', '150'].includes(status)) throw new Error(`NF-e sem autorização para uso (status ${status || 'ausente'}).`);
    if (protocolo && (texto(protocolo, 'chNFe') !== chave || texto(protocolo, 'tpAmb') !== '1')) throw new Error('Protocolo não corresponde à NF-e.');
    const avisos = [];
    if (!protocolo) avisos.push('Sem protocolo de autorização: confirme a situação da nota no ERP antes de imprimir.');
    const emit = filho(inf, 'emit');
    const endEmit = filho(emit, 'enderEmit');
    const emitente = {
      nome: texto(emit, 'xNome'), cnpj: texto(emit, 'CNPJ'),
      endereco: [texto(endEmit, 'xLgr'), texto(endEmit, 'nro'), texto(endEmit, 'xCpl')].filter(Boolean).join(', '),
      bairro: texto(endEmit, 'xBairro'), cidade: texto(endEmit, 'xMun'), uf: texto(endEmit, 'UF'), cep: texto(endEmit, 'CEP'), logo: ''
    };
    const nf = texto(ide, 'nNF');
    const serie = texto(ide, 'serie');
    if (!/^\d{1,9}$/.test(nf) || !/^\d{1,3}$/.test(serie) || !/^\d{14}$/.test(emitente.cnpj) || !emitente.nome) throw new Error('Número, série ou emitente incompleto.');
    if (chave.slice(6, 20) !== emitente.cnpj || chave.slice(20, 22) !== '55' || Number(chave.slice(22, 25)) !== Number(serie) || Number(chave.slice(25, 34)) !== Number(nf)) throw new Error('Chave de acesso diverge dos dados da nota.');
    const dest = filho(inf, 'dest');
    const entrega = filho(inf, 'entrega');
    const end = entrega || filho(dest, 'enderDest');
    const informacoesComplementares = texto(filho(inf, 'infAdic'), 'infCpl');
    const complementar = entregaComplementar(informacoesComplementares);
    const enderecoFiscal = endereco(filho(dest, 'enderDest'));
    let origemEndereco = entrega ? 'entrega' : 'destinatario';
    let enderecoEscolhido = endereco(end);
    if (entrega) {
      avisos.push('Usado o local de entrega informado no campo próprio da NF-e. Confira o endereço.');
      if (complementar.encontrado) avisos.push('Também há uma indicação de ENTREGA nas informações complementares. Confira se corresponde ao campo próprio: ' + informacoesComplementares.slice(0, 700));
    } else if (complementar.endereco) {
      enderecoEscolhido = complementar.endereco;
      origemEndereco = 'informacoes-complementares';
      avisos.push('Endereço de ENTREGA identificado nas informações complementares e usado na etiqueta. Confira antes de imprimir: ' + complementar.endereco);
      avisos.push('Endereço cadastrado do destinatário, para comparação: ' + enderecoFiscal);
    } else if (complementar.encontrado) {
      avisos.push('Há uma indicação de ENTREGA nas informações complementares, mas o endereço não foi identificado com segurança. Corrija o endereço abaixo antes de confirmar: ' + informacoesComplementares.slice(0, 700));
    }
    const destinatario = [texto(entrega, 'xNome') || texto(dest, 'xNome'), enderecoEscolhido].filter(Boolean).join('\n');
    if (origemEndereco !== 'informacoes-complementares' && (!texto(end, 'xLgr') || !texto(end, 'xMun') || !texto(end, 'UF'))) avisos.push('Endereço incompleto: preencha antes de adicionar.');
    if (destinatario.length > 240) avisos.push('Endereço longo: confira o espaço disponível na etiqueta.');
    const grupos = filhos(filho(inf, 'transp'), 'vol');
    const quantidades = grupos.map(vol => Number(texto(vol, 'qVol') || NaN));
    let volumes = grupos.length && quantidades.every(v => Number.isInteger(v) && v > 0) ? quantidades.reduce((a, b) => a + b, 0) : null;
    if (!volumes || volumes > 999) {
      volumes = null;
      avisos.push('Quantidade de volumes ausente ou fora de 1–999: informe o total físico da expedição.');
    }
    const itens = filhos(inf, 'det').map(det => texto(filho(det, 'prod'), 'xProd')).filter(Boolean);
    const descricaoCompleta = itens.join('; ');
    if (descricaoCompleta.length > 180) avisos.push('Descrição resumida a 180 caracteres. Revise os itens.');
    const data = (texto(ide, 'dhEmi') || texto(ide, 'dEmi')).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`)) || new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) !== data) throw new Error('Data de emissão inválida.');
    return { chave, nf, serie, data, destinatario, destinatarioCadastrado: [texto(dest, 'xNome'), enderecoFiscal].filter(Boolean).join('\n'), origemEndereco, enderecoFiscal, volumes, descricao: descricaoCompleta.slice(0, 180), emitente, avisos, autorizada: Boolean(protocolo) };
  }
  return { lerXML, LIMITE_XML, digitos };
});
