function atualizarIndicadorIntegracao(cor, descricao) {
  const indicador = $('indicadorIntegracao');
  indicador.dataset.estado = cor;
  $('descricaoEstadoIntegracao').textContent = descricao;
  $('ajudaEstadoIntegracao').setAttribute('aria-label', 'Estado da integração: ' + descricao);
}
function indicarEstadoIndice(p) {
  if (!p || p.habilitado === false) return;
  if (['aguardando', 'levantando', 'verificando'].includes(p.fase))
    atualizarIndicadorIntegracao('amarelo', p.pronto ? 'Atualizando o índice das pastas em segundo plano. Isso não refaz a pesquisa nem altera os resultados. A busca no índice salvo continua disponível.' : 'Serviço conectado. Preparando as pastas para a primeira busca.');
  else if (p.desatualizado || ['erro', 'indisponivel'].includes(p.fase))
    atualizarIndicadorIntegracao(p.pronto ? 'amarelo' : 'vermelho', p.pronto ? 'Não foi possível atualizar todas as pastas. A busca usa o índice salvo; confira o acesso ao servidor.' : 'Não foi possível preparar as pastas. Confira o acesso ao servidor; o aplicativo tentará novamente.');
  else if (p.pronto)
    atualizarIndicadorIntegracao(p.limitado ? 'amarelo' : 'verde', 'Serviço conectado e pastas verificadas. A busca está pronta.' + (p.limitado ? ' A varredura atingiu o limite de arquivos.' : ''));
}
function mostrarProgressoBusca() {
  const p = importacao.indice;
  const atualizando = p && ['levantando', 'verificando', 'aguardando'].includes(p.fase);
  const visivel = importacao.buscando || (atualizando && (!p.pronto || importacao.buscaPendente));
  $('progressoBusca').hidden = !visivel;
  if (!visivel) return;
  const barra = $('barraBusca');
  if (atualizando) {
    const titulo = p.pronto ? 'Atualizando busca' : 'Preparando busca';
    if (p.total !== null && p.total > 0) {
      barra.max = p.total; barra.value = p.processados;
      $('textoProgressoBusca').textContent = titulo + ': ' + p.processados.toLocaleString('pt-BR') + ' de ' + p.total.toLocaleString('pt-BR') + ' arquivos verificados.';
    } else {
      barra.removeAttribute('value');
      $('textoProgressoBusca').textContent = titulo + ': levantando os arquivos das pastas.';
    }
  } else {
    barra.removeAttribute('value');
    $('textoProgressoBusca').textContent = 'Pesquisando notas...';
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
      if (p.fase === 'erro' && !p.pronto) { importacao.buscaPendente = false; $('statusIntegracao').textContent = 'Não foi possível preparar a busca. O aplicativo tentará novamente; importação de XML e preenchimento manual continuam disponíveis.'; }
      if (p.atualizadoEm) {
        $('ultimaBuscaIntegracao').hidden = false;
        $('ultimaBuscaIntegracao').textContent = 'Última verificação das pastas: ' + new Date(p.atualizadoEm).toLocaleString('pt-BR') + (p.desatualizado ? '. Índice salvo disponível; uma ou mais pastas não puderam ser atualizadas.' : '');
      }
      if (p.pronto && importacao.buscaPendente && !importacao.buscando) { importacao.buscaPendente = false; buscarIntegracao(); }
      if (p.habilitado === false) return;
    } catch {
      if (servico === importacao.servico && fonte === $('fonteIntegracao').value) atualizarIndicadorIntegracao('vermelho', 'Serviço local sem resposta. Abra o atalho Etiquetas para reconectar. Importar XML e preencher manualmente continuam disponíveis.');
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
  if (els.destinatario.value !== r.ultimo && els.destinatario.value !== novo && !confirm('Substituir o endereço que você editou pelo endereço selecionado?')) { caixa.checked = !caixa.checked; return; }
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
  $('statusImportacao').textContent = texto;
  $('avisosArquivos').hidden = erros.length === 0;
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
  configurarOpcaoEndereco(nota);
  $('revisaoXML').hidden = false;
  $('confirmarRevisao').checked = false;
  $('origemRevisao').textContent = 'XML · NF ' + nota.nf + ' · Série ' + nota.serie;
  $('confirmacaoXML').hidden = false;
  atualizarAvisosCampos();
  els.btnAdicionar.textContent = 'Adicionar nota ao lote';
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
  els.btnAdicionar.innerHTML = '<span data-icon="plus"></span>Adicionar nota ao lote';
  renderFilaImportacao();
  if (chave) $('statusImportacao').textContent = `Nota adicionada ao lote. ${importacao.fila.length} nota(s) aguardando revisão.`;
  renderIcons();
}

/* Avisos junto ao dado correspondente. O XML continua sendo a fonte original. */
function definirAvisoCampo(id, texto, erro = false) {
  const grupo = $('avisoCampo-' + id), botao = $('botaoAviso-' + id), campo = $(id);
  grupo.hidden = !texto;
  $('textoAviso-' + id).textContent = texto || '';
  botao.setAttribute('aria-label', 'Atenção: ' + document.querySelector('label[for="' + id + '"]').textContent.replace(':', ''));
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

  definirAvisoCampo('data', conferir && !els.data.value ? 'Informe a data da expedição.' : '', conferir && !els.data.value);
  const numeroErrado = Boolean(nota && els.nf.value.trim() !== nota.nf);
  let avisoNF = '';
  if (conferir && !els.nf.value.trim()) avisoNF = 'Informe o número da nota.';
  else if (numeroErrado) avisoNF = 'Número diferente do XML. Use NF ' + nota.nf + ' ou volte ao manual.';
  else if (nota && !nota.autorizada) avisoNF = 'Não foi possível confirmar a autorização desta nota pelo XML. Confira no sistema da empresa.';
  definirAvisoCampo('nf', avisoNF, conferir && (!els.nf.value.trim() || numeroErrado));
  let endereco = '';
  if (nota && importacao.enderecos?.origem !== 'editado') {
    const avisos = nota.avisos;
    if (avisos.some(a => /não foi identificado com segurança/i.test(a))) endereco = 'Não foi possível identificar o endereço de entrega. Corrija o campo ou use o endereço do destinatário, se for o mesmo.';
    else if (avisos.some(a => /Também há uma indicação de ENTREGA/i.test(a))) endereco = 'A nota informa entrega em dois lugares. Confira qual endereço deve ser usado.';
    else if (avisos.some(a => /Endereço incompleto/i.test(a))) endereco = 'O endereço pode estar incompleto. Confira a rua, a cidade e o estado.';
    else if (avisos.some(a => /Endereço longo/i.test(a))) endereco = 'O endereço é muito longo. Resuma e confira se cabe na prévia.';
  }
  if (conferir && !els.destinatario.value.trim()) endereco = 'Informe o endereço de entrega.';
  definirAvisoCampo('destinatario', endereco, conferir && !els.destinatario.value.trim());
  const valor = Number(els.volumes.value);
  const volumesValidos = Boolean(els.volumes.value && Number.isInteger(valor) && valor >= 1 && valor <= 999);
  definirAvisoCampo('volumes', conferir && !volumesValidos ? (!els.volumes.value && nota?.volumes === null ? 'Quantidade não encontrada no XML. Informe o total de volumes da entrega.' : 'Informe um número inteiro de 1 a 999 volumes.') : '', conferir && !volumesValidos);
  definirAvisoCampo('descricao', nota && els.descricao.value === nota.descricao && nota.avisos.some(a => /Descrição resumida/i.test(a)) ? 'A descrição foi encurtada. Confira se os itens necessários estão no texto.' : '');

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
  atualizarIndicadorIntegracao('amarelo', 'Conectando ao serviço local...');
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
      $('btnIntegracao').textContent = 'Buscar nas pastas';
      selecionarEntrada('pasta');
      $('painelIntegracao').open = true;
    }
    atualizarIndicadorIntegracao('amarelo', dados.fontes.length ? 'Serviço conectado. Verificando o acesso às pastas.' : 'Nenhuma pasta configurada. Use Configurar integração para escolher as pastas de XML.');
    if (importacao.servico) iniciarMonitorIndice();
    $('statusIntegracao').textContent = '';
  } catch (e) {
    atualizarIndicadorIntegracao('vermelho', 'Serviço local desconectado. Abra o atalho Etiquetas para conectar. Importar XML e preencher manualmente continuam disponíveis.');
    $('statusIntegracao').textContent = '';
  }
}
async function buscarIntegracao() {
  if (!importacao.servico || importacao.buscando || importacao.carregando) return;
  importacao.buscando = true;
  $('btnBuscarIntegracao').disabled = true;
  $('statusIntegracao').textContent = 'Pesquisando notas...';
  mostrarProgressoBusca();
  const filtros = filtrosIntegracao();
  const servico = importacao.servico;
  const versaoBusca = importacao.versaoBusca;
  try {
    const dados = await servico.buscar(filtros);
    if (servico !== importacao.servico || versaoBusca !== importacao.versaoBusca) return;
    if (dados.preparando) { importacao.buscaPendente = true; importacao.indice = dados.indice; indicarEstadoIndice(dados.indice); mostrarProgressoBusca(); $('statusIntegracao').textContent = 'A busca será feita quando a preparação terminar.'; return; }
    importacao.buscaPendente = false;
    if (dados.indice) importacao.indice = dados.indice;
    $('resultadosIntegracao').innerHTML = dados.notas.map(n => `<div class="import-card"><strong>NF ${escaparHTML(n.nf)} · série ${escaparHTML(n.serie)}</strong>
      <p>${escaparHTML(n.data)} · ${escaparHTML(n.emitente)}<br>${escaparHTML(n.destinatario.split('\n')[0])}</p>
      <button class="btn-primary btn-small" type="button" data-importar-id="${escaparHTML(n.id)}">Conferir dados</button></div>`).join('');
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
    $('statusIntegracao').textContent = `${dados.total} resultado(s). Atualizado às ${new Date().toLocaleTimeString('pt-BR')}.${dados.limitado ? ' Limite de leitura atingido; reduza as pastas ou refine a busca (até 100 resultados).' : ''}`;
    const falhasAcesso = dados.erros.some(e => /pasta indisponível|acesso no servidor|sem acesso/i.test(e.motivo));
    const estadoIndice = dados.indice;
    if (estadoIndice) indicarEstadoIndice(estadoIndice);
    else atualizarIndicadorIntegracao(falhasAcesso ? 'amarelo' : 'verde', falhasAcesso ? 'Serviço conectado, mas uma ou mais pastas estão sem acesso. Confira a conexão ao servidor.' : 'Serviço conectado e busca concluída nas pastas.');
    $('ultimaBuscaIntegracao').hidden = false;
    $('ultimaBuscaIntegracao').textContent = 'Última busca concluída: ' + new Date().toLocaleString('pt-BR');
    mensagemImportacao(dados.erros.length + ' arquivo(s)/pasta(s) com avisos na busca.', dados.erros);
  } catch (e) {
    if (servico !== importacao.servico || versaoBusca !== importacao.versaoBusca) return;
    atualizarIndicadorIntegracao('vermelho', 'A busca falhou. Confira o serviço local e o acesso às pastas.');
    $('statusIntegracao').textContent = 'Busca não concluída. ' + e.message;
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
    mensagemImportacao('Lendo XMLs…');
    try {
      const dados = await Fontes.arquivos(event.target.files);
      mensagemImportacao(enfileirarImportadas(dados.notas), dados.erros);
    } catch (e) { mensagemImportacao(e.message); }
    finally { event.target.value = ''; importacao.carregando = false; $('btnUploadXML').disabled = false; }
  });
  selecionarEntrada('manual');
  $('btnUploadXML').addEventListener('click', () => { selecionarEntrada('xml'); $('xmlArquivos').click(); });
  $('btnManual').addEventListener('click', () => { selecionarEntrada('manual'); limparCamposNota(true); });
  $('btnAssistenteIntegracao').addEventListener('click', async () => {
    try {
      const resposta = await fetch('/api/assistente', { method: 'POST', credentials: 'same-origin', headers: importacao.token ? { Authorization: 'Bearer ' + importacao.token } : {}, signal: AbortSignal.timeout(5000) });
      if (!resposta.ok) throw new Error('Abra novamente pelo ícone do aplicativo para configurar.');
      $('statusIntegracao').textContent = 'Solicitação enviada. O assistente será aberto pelo aplicativo ao lado do relógio.';
    } catch { $('statusIntegracao').textContent = 'Não foi possível abrir o assistente. Use o ícone Etiquetas ao lado do relógio ou abra o atalho do aplicativo.'; }
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
    } catch (e) { $('statusIntegracao').textContent = e.message; }
    finally { $('btnConectar').disabled = false; }
  });
  $('btnBuscarIntegracao').addEventListener('click', buscarIntegracao);
  $('buscaIntegracao').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); buscarIntegracao(); } });
  function invalidarBusca() {
    importacao.versaoBusca++;
    pararBuscaAutomatica();
    $('resultadosIntegracao').replaceChildren();
    $('statusIntegracao').textContent = 'Seleção ou filtros alterados. Use a lupa ou Enter para pesquisar.';
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
