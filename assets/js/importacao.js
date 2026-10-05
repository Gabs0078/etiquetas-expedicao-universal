'use strict';
const importacao = { fila: [], servico: null, buscando: false, carregando: false, intervalo: null };
function mensagemImportacao(texto, erros = []) {
  $('statusImportacao').textContent = texto;
  $('errosImportacao').replaceChildren();
  erros.forEach(e => {
    const p = document.createElement('p');
    p.textContent = `${e.arquivo}: ${e.motivo}`;
    $('errosImportacao').appendChild(p);
  });
}
function enfileirarImportadas(notas) {
  let novas = 0, repetidas = 0;
  for (const nota of notas) {
    if (state.notas.some(n => n.chave === nota.chave) || importacao.fila.some(n => n.chave === nota.chave)) { repetidas++; continue; }
    if (importacao.fila.length >= 100) break;
    importacao.fila.push(nota); novas++;
  }
  renderFilaImportacao();
  return `${novas} nota(s) aguardando revisão; ${repetidas} duplicada(s) ignorada(s).${novas + repetidas < notas.length ? ' Fila cheia (100); revise ou descarte antes de importar mais.' : ''}`;
}
function renderFilaImportacao() {
  $('filaImportacao').innerHTML = importacao.fila.map((n, i) => `<div class="import-card">
    <strong>NF ${escaparHTML(n.nf)} · série ${escaparHTML(n.serie)}</strong>
    <p>${escaparHTML(n.emitente.nome)}<br>${escaparHTML(n.destinatario.split('\n')[0])}</p>
    <p>${n.volumes === null ? 'Volumes precisam ser informados' : `${n.volumes} volumes`} · ${n.avisos.length} aviso(s)</p>
    <div class="import-actions"><button class="btn-primary btn-small" type="button" data-revisar="${i}">Revisar</button>
    <button class="btn-gray btn-small" type="button" data-descartar="${i}">Descartar</button></div></div>`).join('');
  $('filaImportacao').querySelectorAll('[data-revisar]').forEach(b => b.addEventListener('click', () => revisarImportada(importacao.fila[Number(b.dataset.revisar)])));
  $('filaImportacao').querySelectorAll('[data-descartar]').forEach(b => b.addEventListener('click', () => {
    const removida = importacao.fila.splice(Number(b.dataset.descartar), 1)[0];
    if (state.notaImportada?.chave === removida.chave) limparCamposNota(true);
    renderFilaImportacao();
    $('statusImportacao').textContent = `${importacao.fila.length} nota(s) aguardando revisão.`;
  }));
}
function revisarImportada(nota) {
  if ((els.nf.value || els.destinatario.value) && !confirm('Substituir os campos atuais pelos dados desta nota para revisão?')) return;
  state.notaImportada = nota;
  els.data.value = nota.data;
  els.nf.value = nota.nf;
  els.destinatario.value = nota.destinatario;
  els.volumes.value = nota.volumes ?? '';
  els.descricao.value = nota.descricao;
  const modelo = state.empresas.find(e => NFe.digitos(e.cnpj) === nota.emitente.cnpj);
  state.notaImportada = { ...nota, emitente: { ...nota.emitente, logo: modelo?.logo || '' } };
  $('revisaoXML').hidden = false;
  $('confirmarRevisao').checked = false;
  $('origemRevisao').textContent = `NF ${nota.nf}, série ${nota.serie} · Remetente: ${nota.emitente.nome} (${nota.emitente.cnpj}) · Data de emissão preenchida; ajuste para a expedição se necessário.`;
  $('avisosRevisao').replaceChildren();
  [...nota.avisos, 'Confirme no ERP que a nota continua válida, o endereço e os volumes físicos.'].forEach(aviso => {
    const li = document.createElement('li'); li.textContent = aviso; $('avisosRevisao').appendChild(li);
  });
  els.btnAdicionar.textContent = 'Adicionar nota revisada';
  $('revisaoXML').scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.volumes.focus();
}
function finalizarRevisao(chave) {
  if (chave) importacao.fila = importacao.fila.filter(n => n.chave !== chave);
  state.notaImportada = null;
  $('revisaoXML').hidden = true;
  $('confirmarRevisao').checked = false;
  els.btnAdicionar.innerHTML = '<span data-icon="plus"></span>Adicionar Nota';
  renderFilaImportacao();
  if (chave) $('statusImportacao').textContent = `Nota adicionada ao lote. ${importacao.fila.length} nota(s) aguardando revisão.`;
  renderIcons();
}
function filtrosIntegracao() {
  return { fonte: $('fonteIntegracao').value, busca: $('buscaIntegracao').value.trim(), inicio: $('inicioIntegracao').value, fim: $('fimIntegracao').value };
}
function pararBuscaAutomatica() {
  clearInterval(importacao.intervalo); importacao.intervalo = null;
  $('buscaAutomatica').checked = false;
}
async function buscarIntegracao() {
  if (!importacao.servico || importacao.buscando || importacao.carregando) return;
  importacao.buscando = true;
  $('btnBuscarIntegracao').disabled = true;
  const filtros = filtrosIntegracao();
  const servico = importacao.servico;
  try {
    const dados = await servico.buscar(filtros);
    if (servico !== importacao.servico) return;
    $('resultadosIntegracao').innerHTML = dados.notas.map(n => `<div class="import-card"><strong>NF ${escaparHTML(n.nf)} · série ${escaparHTML(n.serie)}</strong>
      <p>${escaparHTML(n.data)} · ${escaparHTML(n.emitente)}<br>${escaparHTML(n.destinatario.split('\n')[0])}</p>
      <button class="btn-primary btn-small" type="button" data-importar-id="${escaparHTML(n.id)}">Trazer para revisão</button></div>`).join('');
    $('resultadosIntegracao').querySelectorAll('[data-importar-id]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { mensagemImportacao(enfileirarImportadas([await servico.obter(b.dataset.importarId, filtros.fonte)])); }
      catch (e) { mensagemImportacao(e.message); }
      finally { b.disabled = false; }
    }));
    $('statusIntegracao').textContent = `${dados.total} resultado(s). Atualizado às ${new Date().toLocaleTimeString('pt-BR')}.${dados.limitado ? ' Limite de leitura atingido; reduza as pastas ou refine a busca (até 100 resultados).' : ''}`;
    mensagemImportacao(`${dados.erros.length} arquivo(s)/pasta(s) com avisos na busca.`, dados.erros);
  } catch (e) {
    $('statusIntegracao').textContent = e.message;
    pararBuscaAutomatica();
  } finally { importacao.buscando = false; $('btnBuscarIntegracao').disabled = !importacao.servico; }
}
document.addEventListener('DOMContentLoaded', () => {
  $('xmlArquivos').addEventListener('change', async event => {
    if (importacao.carregando) return;
    importacao.carregando = true;
    $('btnUploadXML').disabled = true;
    mensagemImportacao('Lendo XMLs…');
    try {
      const dados = await Fontes.arquivos(event.target.files);
      mensagemImportacao(enfileirarImportadas(dados.notas), dados.erros);
    } catch (e) { mensagemImportacao(e.message); }
    finally { event.target.value = ''; importacao.carregando = false; $('btnUploadXML').disabled = false; }
  });
  $('btnUploadXML').addEventListener('click', () => $('xmlArquivos').click());
  $('btnManual').addEventListener('click', () => limparCamposNota(true));
  $('btnIntegracao').addEventListener('click', () => { $('painelIntegracao').open = !$('painelIntegracao').open; });
  $('btnCancelarRevisao').addEventListener('click', () => limparCamposNota(true));
  $('btnConectar').addEventListener('click', async () => {
    pararBuscaAutomatica();
    importacao.servico = null;
    $('btnBuscarIntegracao').disabled = true;
    $('resultadosIntegracao').replaceChildren();
    $('btnConectar').disabled = true;
    try {
      const servico = Fontes.servico($('tokenIntegracao').value.trim());
      const dados = await servico.conectar();
      $('fonteIntegracao').replaceChildren(...dados.fontes.map(f => new Option(f.nome, f.id)));
      importacao.servico = dados.fontes.length ? servico : null;
      $('tokenIntegracao').value = '';
      $('btnBuscarIntegracao').disabled = !importacao.servico;
      $('statusIntegracao').textContent = dados.fontes.length ? 'Conectado. Selecione uma fonte e busque as notas.' : 'Serviço disponível. Configure as pastas no arquivo local e reinicie o serviço.';
    } catch (e) { $('statusIntegracao').textContent = e.message; }
    finally { $('btnConectar').disabled = false; }
  });
  $('btnBuscarIntegracao').addEventListener('click', buscarIntegracao);
  $('fonteIntegracao').addEventListener('change', () => { pararBuscaAutomatica(); $('resultadosIntegracao').replaceChildren(); });
  $('buscaAutomatica').addEventListener('change', () => {
    clearInterval(importacao.intervalo);
    if ($('buscaAutomatica').checked && importacao.servico) { buscarIntegracao(); importacao.intervalo = setInterval(buscarIntegracao, 30000); }
    else pararBuscaAutomatica();
  });
});
