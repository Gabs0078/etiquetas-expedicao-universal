function atualizarIndicadorIntegracao(cor, descricao) {
  const indicador = $('indicadorIntegracao');
  indicador.dataset.estado = cor;
  I18n.text($('descricaoEstadoIntegracao'), () => descricao);
  $('ajudaEstadoIntegracao').setAttribute('aria-label', tr("Estado da integração: ") + descricao);
}
function indicarEstadoIndice(p) {
  if (!p || p.habilitado === false) return;
  if (['aguardando', 'levantando', 'verificando'].includes(p.fase))
    atualizarIndicadorIntegracao('amarelo', p.pronto ? tr("Atualizando o índice das pastas em segundo plano. Isso não refaz a pesquisa nem altera os resultados. A busca no índice salvo continua disponível.") : tr("Serviço conectado. Preparando as pastas para a primeira busca."));
  else if (p.desatualizado || ['erro', 'indisponivel'].includes(p.fase))
    atualizarIndicadorIntegracao(p.pronto ? 'amarelo' : 'vermelho', p.pronto ? tr("Não foi possível atualizar todas as pastas. A busca usa o índice salvo; confira o acesso ao servidor.") : tr("Não foi possível preparar as pastas. Confira o acesso ao servidor; o aplicativo tentará novamente."));
  else if (p.pronto)
    atualizarIndicadorIntegracao(p.limitado ? 'amarelo' : 'verde', tr("Serviço conectado e pastas verificadas. A busca está pronta.") + (p.limitado ? tr(" A varredura atingiu o limite de arquivos.") : ''));
}
function mostrarProgressoBusca() {
  const p = importacao.indice;
  const atualizando = p && ['levantando', 'verificando', 'aguardando'].includes(p.fase);
  const visivel = importacao.buscando || (atualizando && (!p.pronto || importacao.buscaPendente));
  $('progressoBusca').hidden = !visivel;
  if (!visivel) return;
  const barra = $('barraBusca');
  if (atualizando) {
    const titulo = p.pronto ? tr("Atualizando busca") : tr("Preparando busca");
    if (p.total !== null && p.total > 0) {
      barra.max = p.total; barra.value = p.processados;
      I18n.text($('textoProgressoBusca'), () => tr('{0}: {1} de {2} arquivos verificados.',[titulo,p.processados.toLocaleString(I18n.language),p.total.toLocaleString(I18n.language)]));
    } else {
      barra.removeAttribute('value');
      I18n.text($('textoProgressoBusca'), () => tr('{0}: levantando os arquivos das pastas.',[titulo]));
    }
  } else {
    barra.removeAttribute('value');
    I18n.text($('textoProgressoBusca'), () => tr("Pesquisando notas..."));
  }
}
function iniciarMonitorIndice() {
  clearTimeout(importacao.monitorIndice);
  importacao.indice = null;
  const servico = importacao.servico;
  const fonte = $('fonteIntegracao').value;
  async function consultar() {
    if (!servico || servico !== importacao.servico || fonte !== $('fonteIntegracao').value) return;
    try {
      const p = await servico.progresso(fonte);
      if (servico !== importacao.servico || fonte !== $('fonteIntegracao').value) return;
      importacao.indice = p;
      indicarEstadoIndice(p);
      mostrarProgressoBusca();
      if (p.fase === 'erro' && !p.pronto) { importacao.buscaPendente = false; I18n.text($('statusIntegracao'), () => tr("Não foi possível preparar a busca. O aplicativo tentará novamente; importação de XML e preenchimento manual continuam disponíveis.")); }
      if (p.atualizadoEm) {
        $('ultimaBuscaIntegracao').hidden = false;
        I18n.text($('ultimaBuscaIntegracao'), () => tr("Última verificação das pastas: ") + new Date(p.atualizadoEm).toLocaleString(I18n.language) + (p.desatualizado ? tr(". Índice salvo disponível; uma ou mais pastas não puderam ser atualizadas.") : ''));
      }
      if (p.pronto && importacao.buscaPendente && !importacao.buscando) { importacao.buscaPendente = false; buscarIntegracao(); }
      if (p.habilitado === false) return;
    } catch {
      if (servico === importacao.servico && fonte === $('fonteIntegracao').value) atualizarIndicadorIntegracao('vermelho', tr("Serviço local sem resposta. Abra o atalho Etiquetas para reconectar. Importar XML e preencher manualmente continuam disponíveis."));
    }
    importacao.monitorIndice = setTimeout(consultar, document.hidden ? 15000 : importacao.indice?.fase === 'verificando' ? 1000 : 5000);
  }
  consultar();
}
function configurarOpcaoEndereco(nota = null) {
  const cadastro = nota?.enderecoFiscal?.trim() ? nota.destinatarioCadastrado || [nota.destinatario.split('\n')[0], nota.enderecoFiscal].join('\n') : '';
  importacao.enderecos = nota ? { entrega: nota.destinatario, cadastro, origem: nota.origemEndereco, origemOriginal: nota.origemEndereco, ultimo: nota.destinatario } : null;
  $('usarEnderecoDestinatario').disabled = !cadastro;
  $('usarEnderecoDestinatario').checked = Boolean(cadastro && nota.origemEndereco === 'destinatario');
  $('ajudaEnderecoDestinatario').hidden = Boolean(cadastro);
}
function trocarEndereco() {
  const r = importacao.enderecos; if (!r) return;
  const caixa = $('usarEnderecoDestinatario');
  const novo = caixa.checked ? r.cadastro : r.entrega;
  if (els.destinatario.value !== r.ultimo && els.destinatario.value !== novo && !confirm(tr("Substituir o endereço que você editou pelo endereço selecionado?"))) { caixa.checked = !caixa.checked; return; }
  els.destinatario.value = novo; r.ultimo = novo;
  r.origem = caixa.checked ? "destinatario" : r.origemOriginal;
  $('confirmarRevisao').checked = false;
  atualizarAvisosCampos();
}
'use strict';
  function selecionarEntrada(modo) {
    document.body.dataset.entrada = modo;
    for (const [id, valor] of [['btnIntegracao','pasta'],['btnUploadXML','xml'],['btnManual','manual']]) $(id).setAttribute('aria-pressed', String(modo === valor));
  }

const importacao = { fila: [], servico: null, buscando: false, carregando: false, intervalo: null, versaoBusca: 0 };
function mensagemImportacao(texto, erros = []) {
  I18n.text($('statusImportacao'), () => texto);
  $('avisosArquivos').hidden = erros.length === 0;
  $('errosImportacao').replaceChildren();
  erros.forEach(e => {
    const p = document.createElement('p');
    I18n.text(p, () => `${e.arquivo}: ${tr(e.motivo)}`);
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
  return tr("{0} nota(s) aguardando revisão; {1} duplicada(s) ignorada(s).{2}",[novas,repetidas,novas + repetidas < notas.length ? tr(" Fila cheia (100); revise ou descarte antes de importar mais.") : '']);
}
function renderFilaImportacao() {
  $('filaImportacao').innerHTML = importacao.fila.map((n, i) => `<div class="import-card">
    <strong>NF ${escaparHTML(n.nf)}${escaparHTML(tr(" · Série "))}${escaparHTML(n.serie)}</strong>
    <p>${escaparHTML(n.emitente.nome)}<br>${escaparHTML(n.destinatario.split('\n')[0])}</p>
    <p>${n.volumes === null ? tr("Volumes precisam ser informados") : tr('{0} volumes',[n.volumes])} · ${escaparHTML(tr('{0} aviso(s)',[n.avisos.length]))}</p>
    <div class="import-actions"><button class="btn-primary btn-small" type="button" data-revisar="${i}">${escaparHTML(tr("Revisar"))}</button>
    <button class="btn-gray btn-small" type="button" data-descartar="${i}">${escaparHTML(tr("Descartar"))}</button></div></div>`).join('');
  I18n.apply($('etapaConferencia'));
  $('filaImportacao').querySelectorAll('[data-revisar]').forEach(b => b.addEventListener('click', () => revisarImportada(importacao.fila[Number(b.dataset.revisar)])));
  $('filaImportacao').querySelectorAll('[data-descartar]').forEach(b => b.addEventListener('click', () => {
    const removida = importacao.fila.splice(Number(b.dataset.descartar), 1)[0];
    if (state.notaImportada?.chave === removida.chave) limparCamposNota(true);
    renderFilaImportacao();
    I18n.text($('statusImportacao'), () => tr("{0} nota(s) aguardando revisão.",[importacao.fila.length]));
  }));
}
function revisarImportada(nota) {
  if ((els.nf.value || els.destinatario.value) && !confirm(tr("Substituir os campos atuais pelos dados desta nota para revisão?"))) return;
  const estavaEditando = Boolean(state.notaEditando);
  encerrarEdicao();
  state.notaImportada = nota;
  els.data.value = nota.data;
  els.nf.value = nota.nf;
  els.destinatario.value = nota.destinatario;
  els.volumes.value = nota.volumes ?? '';
  els.descricao.value = nota.descricao;
  els.valorNota.value = nota.valorNota ?? '';
  els.pesoBruto.value = nota.pesoBruto ?? '';
  for (const campo of ['medidaComprimento', 'medidaLargura', 'medidaAltura']) els[campo].value = '';
  els.medidasVariaveis.checked = false;
  state.medidasVolumeDraft = [];
  state.medidaVolumeSelecionado = 1;
  atualizarSeletorMedidasVolume({ preservar: false });
  const modelo = state.empresas.find(e => NFe.digitos(e.cnpj) === nota.emitente.cnpj);
  state.notaImportada = { ...nota, emitente: { ...nota.emitente, logo: modelo?.logo || '' } };
  configurarOpcaoEndereco(nota);
  $('revisaoXML').hidden = false;
  $('confirmarRevisao').checked = false;
  I18n.text($('origemRevisao'), () => 'XML · NF ' + nota.nf + tr(" · Série ") + nota.serie);
  $('confirmacaoXML').hidden = false;
  atualizarAvisosCampos();
  I18n.text(els.btnAdicionar, () => tr("Adicionar nota ao lote"));
  if (estavaEditando) { renderNotas(); atualizarEscalaPrevia(); }
  $('revisaoXML').scrollIntoView({ behavior: 'smooth', block: 'center' });
  const primeiro = ['data', 'nf', 'destinatario', 'volumes'].find(id => $(id).getAttribute('aria-invalid') === 'true');
  $(primeiro || 'destinatario').focus();
}
function finalizarRevisao(chave) {
  if (chave) importacao.fila = importacao.fila.filter(n => n.chave !== chave);
  state.notaImportada = null;
  configurarOpcaoEndereco();
  $('revisaoXML').hidden = true;
  $('confirmacaoXML').hidden = true;
  importacao.validarCampos = false;
  $('confirmarRevisao').checked = false;
  els.btnAdicionar.innerHTML = '<span data-icon="plus"></span><span data-i18n="Adicionar nota ao lote">Add invoice to batch</span>';
  renderFilaImportacao();
  if (chave) I18n.text($('statusImportacao'), () => tr("Nota adicionada ao lote. {0} nota(s) aguardando revisão.",[importacao.fila.length]));
  renderIcons();
}

/* Avisos junto ao dado correspondente. O XML continua sendo a fonte original. */
function definirAvisoCampo(id, texto, erro = false) {
  const grupo = $('avisoCampo-' + id), botao = $('botaoAviso-' + id), campo = $(id);
  grupo.hidden = !texto;
  I18n.text($('textoAviso-' + id), () => texto || '');
  botao.setAttribute('aria-label', tr("Atenção: ") + document.querySelector('label[for="' + id + '"]').textContent.replace(':', ''));
  campo.toggleAttribute('data-atencao', Boolean(texto));
  campo.setAttribute('aria-invalid', String(erro));
  if (texto) campo.setAttribute('aria-describedby', 'dicaCampo-' + id);
  else { campo.removeAttribute('aria-describedby'); fecharAvisoCampo(id); }
}
function fecharAvisoCampo(id) {
  $('dicaCampo-' + id).hidden = true;
  $('botaoAviso-' + id).setAttribute('aria-expanded', 'false');
  $('avisoCampo-' + id).dataset.fixado = 'false';
}
function atualizarAvisosCampos(validar = false) {
  if (validar) importacao.validarCampos = true;
  const nota = state.notaImportada;
  const conferir = Boolean(nota || importacao.validarCampos);

  definirAvisoCampo('data', conferir && !els.data.value ? tr("Informe a data da expedição.") : '', conferir && !els.data.value);
  const numeroErrado = Boolean(nota && els.nf.value.trim() !== nota.nf);
  let avisoNF = '';
  if (conferir && !els.nf.value.trim()) avisoNF = tr("Informe o número da nota.");
  else if (numeroErrado) avisoNF = tr('Número diferente do XML. Use NF {0} ou volte ao manual.',[nota.nf]);
  else if (nota && !nota.autorizada) avisoNF = tr("Não foi possível confirmar a autorização desta nota pelo XML. Confira no sistema da empresa.");
  definirAvisoCampo('nf', avisoNF, conferir && (!els.nf.value.trim() || numeroErrado));
  let endereco = '';
  if (nota && importacao.enderecos?.origem !== 'editado') {
    const avisos = nota.avisos;
    if (avisos.some(a => /não foi identificado com segurança/i.test(a))) endereco = tr("Não foi possível identificar o endereço de entrega. Corrija o campo ou use o endereço do destinatário, se for o mesmo.");
    else if (avisos.some(a => /Também há uma indicação de ENTREGA/i.test(a))) endereco = tr("A nota informa entrega em dois lugares. Confira qual endereço deve ser usado.");
    else if (avisos.some(a => /Endereço incompleto/i.test(a))) endereco = tr("O endereço pode estar incompleto. Confira a rua, a cidade e o estado.");
    else if (avisos.some(a => /Endereço longo/i.test(a))) endereco = tr("O endereço é muito longo. Resuma e confira se cabe na prévia.");
  }
  if (conferir && !els.destinatario.value.trim()) endereco = tr("Informe o endereço de entrega.");
  definirAvisoCampo('destinatario', endereco, conferir && !els.destinatario.value.trim());
  const valor = Number(els.volumes.value);
  const volumesValidos = Boolean(els.volumes.value && Number.isInteger(valor) && valor >= 1 && valor <= 999);
  definirAvisoCampo('volumes', conferir && !volumesValidos ? (!els.volumes.value && nota?.volumes === null ? tr("Quantidade não encontrada no XML. Informe o total de volumes da entrega.") : tr("Informe um número inteiro de 1 a 999 volumes.")) : '', conferir && !volumesValidos);
  definirAvisoCampo('descricao', nota && els.descricao.value === nota.descricao && nota.avisos.some(a => /Descrição resumida/i.test(a)) ? tr("A descrição foi encurtada. Confira se os itens necessários estão no texto.") : '');

}
function iniciarAvisosCampos() {
  for (const id of ['data', 'nf', 'destinatario', 'volumes', 'descricao']) {
    const grupo = $('avisoCampo-' + id), botao = $('botaoAviso-' + id), dica = $('dicaCampo-' + id);
    let fechamento;
    const abrir = () => { clearTimeout(fechamento); dica.hidden = false; botao.setAttribute('aria-expanded', 'true'); };
    grupo.addEventListener('pointerenter', abrir);
    grupo.addEventListener('pointerleave', () => { fechamento = setTimeout(() => { if (grupo.dataset.fixado !== 'true' && document.activeElement !== botao) fecharAvisoCampo(id); }, 160); });
    botao.addEventListener('focus', abrir);
    botao.addEventListener('blur', () => { if (grupo.dataset.fixado !== 'true') fecharAvisoCampo(id); });
    botao.addEventListener('click', () => {
      const aberto = grupo.dataset.fixado !== 'true';
      grupo.dataset.fixado = String(aberto); botao.setAttribute('aria-expanded', String(aberto)); dica.hidden = !aberto;
    });
    $(id).addEventListener('input', () => {
      if (state.notaImportada) $('confirmarRevisao').checked = false;
      atualizarAvisosCampos();
    });
  }
  document.addEventListener('pointerdown', e => {
    for (const id of ['data', 'nf', 'destinatario', 'volumes', 'descricao']) if (!$('avisoCampo-' + id).contains(e.target)) fecharAvisoCampo(id);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') for (const id of ['data', 'nf', 'destinatario', 'volumes', 'descricao']) fecharAvisoCampo(id);
  });
}

function filtrosIntegracao() {
  return { fonte: $('fonteIntegracao').value, busca: $('buscaIntegracao').value.trim(), inicio: $('inicioIntegracao').value, fim: $('fimIntegracao').value };
}
function pararBuscaAutomatica() {
  clearInterval(importacao.intervalo); importacao.intervalo = null;
  $('buscaAutomatica').checked = false;
}
async function conectarIntegracao(token, silencioso = false) {
  atualizarIndicadorIntegracao('amarelo', tr("Conectando ao serviço local..."));
  const servico = Fontes.servico(token);
  try {
    const dados = await servico.conectar();
    $('fonteIntegracao').replaceChildren(...dados.fontes.map(f => new Option(f.nome, f.id)));
    importacao.servico = dados.fontes.length ? servico : null;
    $('selecaoFonte').hidden = dados.fontes.length === 1;
    $('btnBuscarIntegracao').disabled = !importacao.servico;
    $('btnAssistenteIntegracao').hidden = !dados.desktop;
    if (dados.desktop) {
      $('acessoIntegracao').hidden = true;
      I18n.text($('btnIntegracao'), () => tr("Buscar nas pastas"));
      if (dados.fontes.length) { selecionarEntrada('pasta'); $('painelIntegracao').open = true; }
    }
    atualizarIndicadorIntegracao('amarelo', dados.fontes.length ? tr("Serviço conectado. Verificando o acesso às pastas.") : tr("Nenhuma pasta configurada. Use Configurar integração para escolher as pastas de XML."));
    if (importacao.servico) iniciarMonitorIndice();
    I18n.text($('statusIntegracao'), () => '');
  } catch (e) {
    atualizarIndicadorIntegracao('vermelho', tr("Serviço local desconectado. Abra o atalho TagEX para conectar. Importar XML e preencher manualmente continuam disponíveis."));
    I18n.text($('statusIntegracao'), () => '');
  }
}
async function buscarIntegracao() {
  if (!importacao.servico || importacao.buscando || importacao.carregando) return;
  importacao.buscando = true;
  $('btnBuscarIntegracao').disabled = true;
  I18n.text($('statusIntegracao'), () => tr("Pesquisando notas..."));
  mostrarProgressoBusca();
  const filtros = filtrosIntegracao();
  const servico = importacao.servico;
  const versaoBusca = importacao.versaoBusca;
  try {
    const dados = await servico.buscar(filtros);
    if (servico !== importacao.servico || versaoBusca !== importacao.versaoBusca) return;
    if (dados.preparando) { importacao.buscaPendente = true; importacao.indice = dados.indice; indicarEstadoIndice(dados.indice); mostrarProgressoBusca(); I18n.text($('statusIntegracao'), () => tr("A busca será feita quando a preparação terminar.")); return; }
    importacao.buscaPendente = false;
    if (dados.indice) importacao.indice = dados.indice;
    $('resultadosIntegracao').innerHTML = dados.notas.map(n => `<div class="import-card"><strong>NF ${escaparHTML(n.nf)}${escaparHTML(tr(" · Série "))}${escaparHTML(n.serie)}</strong>
      <p>${escaparHTML(n.data)} · ${escaparHTML(n.emitente)}<br>${escaparHTML(n.destinatario.split('\n')[0])}</p>
      <button class="btn-primary btn-small" type="button" data-importar-id="${escaparHTML(n.id)}">${escaparHTML(tr("Conferir"))}</button></div>`).join('');
    $('resultadosIntegracao').querySelectorAll('[data-importar-id]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        const nota = await servico.obter(b.dataset.importarId, filtros.fonte);
        mensagemImportacao(enfileirarImportadas([nota]));
        const selecionada = importacao.fila.find(n => n.chave === nota.chave);
        if (selecionada) revisarImportada(selecionada);
      }
      catch (e) { mensagemImportacao(e.message); }
      finally { b.disabled = false; }
    }));
    I18n.text($('statusIntegracao'), () => tr("{0} resultado(s). Atualizado às {1}.{2}",[dados.total,new Date().toLocaleTimeString(I18n.language),dados.limitado ? ' Limite de leitura atingido; reduza as pastas ou refine a busca (até 100 resultados).' : '']));
    const falhasAcesso = dados.erros.some(e => /pasta indisponível|acesso no servidor|sem acesso/i.test(e.motivo));
    const estadoIndice = dados.indice;
    if (estadoIndice) indicarEstadoIndice(estadoIndice);
    else atualizarIndicadorIntegracao(falhasAcesso ? 'amarelo' : 'verde', falhasAcesso ? tr("Serviço conectado, mas uma ou mais pastas estão sem acesso. Confira a conexão ao servidor.") : tr("Serviço conectado e busca concluída nas pastas."));
    $('ultimaBuscaIntegracao').hidden = false;
    I18n.text($('ultimaBuscaIntegracao'), () => tr("Última busca concluída: ") + new Date().toLocaleString(I18n.language));
    mensagemImportacao(dados.erros.length + ' arquivo(s)/pasta(s) com avisos na busca.', dados.erros);
  } catch (e) {
    if (servico !== importacao.servico || versaoBusca !== importacao.versaoBusca) return;
    atualizarIndicadorIntegracao('vermelho', tr("A busca falhou. Confira o serviço local e o acesso às pastas."));
    I18n.text($('statusIntegracao'), () => tr("Busca não concluída. ") + e.message);
    pararBuscaAutomatica();
  } finally { importacao.buscando = false; $('btnBuscarIntegracao').disabled = !importacao.servico; mostrarProgressoBusca(); }
}
document.addEventListener('DOMContentLoaded', () => {
  $('usarEnderecoDestinatario').addEventListener('change', trocarEndereco);
  iniciarAvisosCampos();
  els.destinatario.addEventListener('input', () => {
    if (!importacao.enderecos) return;
    $('usarEnderecoDestinatario').checked = false;
    $('confirmarRevisao').checked = false;
    importacao.enderecos.origem = 'editado';
    atualizarAvisosCampos();
  });
  $('xmlArquivos').addEventListener('change', async event => {
    if (importacao.carregando) return;
    importacao.carregando = true;
    $('btnUploadXML').disabled = true;
    mensagemImportacao(tr("Lendo XMLs…"));
    try {
      const dados = await Fontes.arquivos(event.target.files);
      mensagemImportacao(enfileirarImportadas(dados.notas), dados.erros);
    } catch (e) { mensagemImportacao(e.message); }
    finally { event.target.value = ''; importacao.carregando = false; $('btnUploadXML').disabled = false; }
  });
  selecionarEntrada('manual');
  $('btnUploadXML').addEventListener('click', () => { selecionarEntrada('xml'); $('xmlArquivos').click(); });
  $('btnManual').addEventListener('click', () => {
    if (camposEdicaoAlterados() && !confirm(tr("Descartar as alterações desta nota e preencher outra?"))) return;
    const estavaEditando = Boolean(state.notaEditando);
    selecionarEntrada('manual'); limparCamposNota(true);
    if (estavaEditando) renderizar();
  });
  $('btnAssistenteIntegracao').addEventListener('click', async () => {
    try {
      const resposta = await fetch('/api/assistente', { method: 'POST', credentials: 'same-origin', headers: importacao.token ? { Authorization: 'Bearer ' + importacao.token } : {}, signal: AbortSignal.timeout(5000) });
      if (!resposta.ok) throw new Error(tr("Abra novamente pelo ícone do aplicativo para configurar."));
      I18n.text($('statusIntegracao'), () => tr("Solicitação enviada. O assistente será aberto pelo aplicativo ao lado do relógio."));
    } catch { I18n.text($('statusIntegracao'), () => tr("Não foi possível abrir o assistente. Use o ícone Etiquetas ao lado do relógio ou abra o atalho do aplicativo.")); }
  });
  $('btnIntegracao').addEventListener('click', () => { selecionarEntrada('pasta'); $('painelIntegracao').open = true; });
  $('btnCancelarRevisao').addEventListener('click', () => limparCamposNota(true));
  $('btnConectar').addEventListener('click', async () => {
    importacao.versaoBusca++;
    importacao.buscaPendente = false;
    pararBuscaAutomatica();
    importacao.servico = null;
    $('btnBuscarIntegracao').disabled = true;
    $('resultadosIntegracao').replaceChildren();
    $('btnConectar').disabled = true;
    try {
      await conectarIntegracao($('tokenIntegracao').value.trim());
      $('tokenIntegracao').value = '';
    } catch (e) { I18n.text($('statusIntegracao'), () => e.message); }
    finally { $('btnConectar').disabled = false; }
  });
  $('btnBuscarIntegracao').addEventListener('click', buscarIntegracao);
  $('buscaIntegracao').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); buscarIntegracao(); } });
  function invalidarBusca() {
    importacao.versaoBusca++;
    pararBuscaAutomatica();
    $('resultadosIntegracao').replaceChildren();
    I18n.text($('statusIntegracao'), () => tr("Seleção ou filtros alterados. Use a lupa ou Enter para pesquisar."));
  }
  $('fonteIntegracao').addEventListener('change', () => { invalidarBusca(); importacao.indice = null; iniciarMonitorIndice(); });
  ['buscaIntegracao', 'inicioIntegracao', 'fimIntegracao'].forEach(id => $(id).addEventListener('input', invalidarBusca));
  $('buscaAutomatica').addEventListener('change', () => {
    clearInterval(importacao.intervalo);
    if ($('buscaAutomatica').checked && importacao.servico) { buscarIntegracao(); importacao.intervalo = setInterval(() => { if ($('buscaAutomatica').checked) buscarIntegracao(); }, 30000); }
    else pararBuscaAutomatica();
  });
  const ajudaEstado = $('ajudaEstadoIntegracao');
  ajudaEstado.addEventListener('click', () => {
    const aberto = ajudaEstado.getAttribute('aria-expanded') !== 'true';
    ajudaEstado.setAttribute('aria-expanded', String(aberto));
    $('indicadorIntegracao').classList.toggle('ajuda-aberta', aberto);
  });
  ajudaEstado.addEventListener('keydown', e => {
    if (e.key === 'Escape') { ajudaEstado.setAttribute('aria-expanded', 'false'); $('indicadorIntegracao').classList.remove('ajuda-aberta'); ajudaEstado.blur(); }
  });
  const acessoLocal = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  $('orientacaoIntegracaoLocal').hidden = acessoLocal;
  $('controlesIntegracao').hidden = !acessoLocal;
  if (acessoLocal && ['http:', 'https:'].includes(location.protocol)) conectarIntegracao('', true);
});
