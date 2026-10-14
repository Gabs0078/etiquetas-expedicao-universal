/* Adaptadores de entrada entregam o mesmo objeto NFe para a revisão. */
window.Fontes = {
  async arquivos(arquivos) {
    const notas = [], erros = [];
    for (const arquivo of Array.from(arquivos).slice(0, 100)) {
      try {
        if (!/\.xml$/i.test(arquivo.name)) throw new Error('Selecione arquivos .xml.');
        if (arquivo.size > NFe.LIMITE_XML) throw new Error('XML excede 2 MB.');
        const xml = new TextDecoder('utf-8', { fatal: true }).decode(await arquivo.arrayBuffer());
        notas.push({ ...NFe.lerXML(xml), arquivo: arquivo.name, origem: 'upload' });
      } catch (e) { erros.push({ arquivo: arquivo.name, motivo: e.message }); }
    }
    if (arquivos.length > 100) erros.push({ arquivo: 'Lote', motivo: 'Limite de 100 arquivos por seleção; envie o restante em outro lote.' });
    return { notas, erros };
  },
  servico(token) {
    async function requisitar(caminho, params = {}) {
      if (!['http:', 'https:'].includes(location.protocol)) throw new Error('Abra o app pelo serviço local para usar a integração.');
      const url = new URL(caminho, location.origin);
      Object.entries(params).forEach(([chave, valor]) => { if (valor) url.searchParams.set(chave, valor); });
      const resposta = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(120000) });
      if (!resposta.headers.get('Content-Type')?.includes('application/json')) throw new Error('Integração indisponível neste endereço. Abra o app pelo serviço local.');
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Falha na integração.');
      return dados;
    }
    return {
      conectar: () => requisitar('/api/fontes'),
      buscar: filtros => requisitar('/api/notas', filtros),
      progresso: fonte => requisitar('/api/indice', {fonte}),
      obter: async (id, fonte) => ({ ...(await requisitar(`/api/notas/${encodeURIComponent(id)}`, { fonte })).nota, origem: 'integracao' })
    };
  }
};
