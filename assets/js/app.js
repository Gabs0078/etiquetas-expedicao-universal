const DISPOSICOES_KEY = 'expedicao_disposicoes_papel_v1';
let disposicoesPapel = {};
try { const saved = JSON.parse(localStorage.getItem(DISPOSICOES_KEY) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) disposicoesPapel = saved; } catch {}
const ORGANIZACAO_KEY = 'expedicao_organizacao_folha_v1';
let organizacaoFolha = 'grade';
try { if (localStorage.getItem(ORGANIZACAO_KEY) === 'lista') organizacaoFolha = 'lista'; } catch {}
function chaveDisposicao() { return modoImpressaoAtual() + (organizacaoFolha === 'lista' ? ':lista' : ''); }
function layoutPapel() {
  const f = formatoAtual();
  const lista = organizacaoFolha === 'lista';
  const valor = disposicoesPapel[chaveDisposicao()] ?? disposicoesPapel[modoImpressaoAtual()];
  const limiteLista = Math.floor((f.altura - 6) / 47);
  let selecionada = ['10','4','3','2','1'].includes(valor) ? Number(valor) : 0;
  if (lista && selecionada > limiteLista) selecionada = 0;
  const paginaLargura = selecionada === 1 ? f.altura : f.largura;
  const paginaAltura = selecionada === 1 ? f.largura : f.altura;
  const padrao = lista ? Math.floor((f.altura - 6) / 52) : Math.floor((f.largura - 8) / 100) * Math.floor((f.altura - 8) / 50);
  const colunas = lista ? 1 : selecionada ? (selecionada === 10 || selecionada === 4 ? 2 : 1) : Math.floor((f.largura - 8) / 100);
  const linhas = lista ? selecionada || padrao : selecionada ? selecionada / colunas : Math.floor((f.altura - 8) / 50);
  const gap = lista ? 2 : selecionada ? 3 : 0;
  const largura = selecionada || lista ? Math.floor((paginaLargura - 8 - gap * (colunas - 1)) / colunas * 100) / 100 : 100;
  const altura = selecionada || lista ? Math.floor((paginaAltura - 8 - gap * (linhas - 1)) / linhas * 100) / 100 : 50;
  const escala = lista && linhas > 1 ? Math.max(1, Math.min(3.6, largura / 100, altura / 50)) : selecionada ? Math.max(1, Math.min(3.6, Math.sqrt(largura * altura / 5000))) : 1;
  return { lista, limiteLista, padrao, paginaLargura, paginaAltura, quantidade: colunas * linhas, colunas, linhas, gap, largura, altura, escala, selecionada };
}
function escalaPapel() { return formatoAtual().tipo === 'papel' ? layoutPapel().escala : 1; }
const FORMATOS_IMPRESSAO = {"a4":{"tipo":"papel","nome":"A4","largura":210,"altura":297},"a3":{"tipo":"papel","nome":"A3","largura":297,"altura":420},"a2":{"tipo":"papel","nome":"A2","largura":420,"altura":594},"a5":{"tipo":"papel","nome":"A5","largura":148,"altura":210},"carta":{"tipo":"papel","nome":"Carta","largura":215.9,"altura":279.4},"oficio":{"tipo":"papel","nome":"Ofício (Legal)","largura":215.9,"altura":355.6},"bobina80":{"tipo":"bobina","nome":"80 × 35 mm","largura":80,"altura":35},"bobina85":{"tipo":"bobina","nome":"85 × 35 mm","largura":85,"altura":35},"bobina":{"tipo":"bobina","nome":"100 × 50 mm","largura":100,"altura":50},"bobina100x75":{"tipo":"bobina","nome":"100 × 75 mm","largura":100,"altura":75},"bobina100x100":{"tipo":"bobina","nome":"100 × 100 mm","largura":100,"altura":100},"bobina100x150":{"tipo":"bobina","nome":"100 × 150 mm","largura":100,"altura":150}};
function formatoAtual() { return FORMATOS_IMPRESSAO[modoImpressaoAtual()] || FORMATOS_IMPRESSAO.a4; }
(() => {
  const key = 'expedicao_aparencia_v1';
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  if (!['light', 'dark'].includes(preference)) preference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  function apply() {
    document.documentElement.dataset.theme = preference;
    document.documentElement.style.colorScheme = preference;
    const button = document.getElementById('temaAparencia');
    if (button) { button.setAttribute('aria-checked', String(preference === 'dark')); button.title = preference === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'; }
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('temaAparencia');
    apply();
    try { localStorage.setItem(key, preference); } catch {}
    button.addEventListener('click', () => {
      preference = preference === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
  });
})();
const DEFAULT_LOGO = '';
const STORAGE_KEY = 'expedicao_empresas_v2';
const ACTIVE_KEY = 'expedicao_empresa_ativa_v2';
const NOTAS_KEY = 'expedicao_notas_v1';
const OPCOES_IMPRESSAO_KEY = 'expedicao_opcoes_impressao_v1';

const state = {
  notas: [],
  empresas: [],
  empresaAtivaId: null,
  empresaEditandoId: null,
  logoEditando: '',
  notaImportada: null,
  opcoesImpressao: { exibirData: false, exibirDescricao: true, exibirEnderecoRemetente: true },
};

const icons = {
  tag: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4l10 10a2 2 0 0 0 2.8 0l3.2-3.2a2 2 0 0 0 0-2.8Z"/><path d="M13 3h2l7 7a2 2 0 0 1 0 2.8l-1.5 1.5"/><circle cx="7" cy="7" r=".7"/></svg>',
  sun: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>',
  moon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.9 13a9 9 0 1 1-9.9-9.9A7 7 0 0 0 20.9 13Z"/></svg>',
  chevronDown: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',

  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  printer: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 8V3h10v5"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/><path d="M17 12h.01"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></svg>',
  building: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/><path d="M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/></svg>',
  save: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3"/><path d="M8 21v-7h8v7"/></svg>'
};

const els = {};

function $(id) { return document.getElementById(id); }

/* Toast Notifications */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function initElements() {
  [
    'data', 'nf', 'destinatario', 'volumes', 'descricao', 'btnAdicionar', 'btnImprimir', 'btnLimpar',
    'listaNotas', 'countNotas', 'summary', 'preview', 'modoImpressao', 'listaEmpresas',
    'btnNovaEmpresa', 'btnSalvarEmpresa', 'btnExcluirEmpresa', 'logoEmpresa', 'uploadBox', 'logoPreview',
    'logoPreviewIcon', 'logoPreviewText', 'tamanhoLogo', 'valorTamanhoLogo', 'btnRestaurarLogo', 'nomeEmpresa', 'cnpjEmpresa', 'enderecoEmpresa', 'bairroEmpresa',
    'cidadeEmpresa', 'ufEmpresa', 'cepEmpresa', 'exibirData', 'exibirDescricao', 'exibirEnderecoRemetente'
  ].forEach(id => els[id] = $(id));
}

function renderIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    el.innerHTML = icons[name] || '';
  });
}

function escaparHTML(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textoComQuebras(texto) {
  return escaparHTML(texto).replace(/\n/g, '<br>');
}

function dataHojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatarDataInput(dateStr) {
  if (!dateStr) return '';
  const partes = dateStr.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dateStr;
}

function defaultCompany() {
  return {
    id: `empresa-${Date.now()}`,
    nome: 'Sua Empresa LTDA',
    cnpj: '00.000.000/0001-00',
    endereco: 'Rua Exemplo, 100',
    bairro: 'Centro',
    cidade: 'Sua Cidade',
    uf: 'PR',
    cep: '00000-000',
    logo: DEFAULT_LOGO
  };
}

function carregarEmpresas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state.empresas = Array.isArray(salvas) ? salvas.filter(e => e && typeof e.id === 'string' && typeof e.nome === 'string').slice(0, 100).map(e => ({
      ...Object.fromEntries(['id', 'nome', 'cnpj', 'endereco', 'bairro', 'cidade', 'uf', 'cep'].map(campo => [campo, String(e[campo] || '')])),
      logoTamanho: normalizarTamanhoLogo(e.logoTamanho),
      logo: typeof e.logo === 'string' && /^data:image\/(png|jpe?g);base64,/.test(e.logo) ? e.logo : ''
    })) : [];
  } catch {
    state.empresas = [];
  }

  if (!state.empresas.length) {
    state.empresas = [defaultCompany()];
    salvarEmpresas();
  }

  try { state.empresaAtivaId = localStorage.getItem(ACTIVE_KEY) || state.empresas[0].id; }
  catch { state.empresaAtivaId = state.empresas[0].id; }
  if (!state.empresas.some(e => e.id === state.empresaAtivaId)) {
    state.empresaAtivaId = state.empresas[0].id;
  }
  state.empresaEditandoId = state.empresaAtivaId;
}

function salvarEmpresas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.empresas));
    if (state.empresaAtivaId) localStorage.setItem(ACTIVE_KEY, state.empresaAtivaId);
    return true;
  } catch (erro) {
    // QuotaExceededError: logos em base64 estouram o limite (~5MB) do localStorage.
    console.error('Falha ao salvar empresas:', erro);
    showToast('Não foi possível salvar: armazenamento do navegador cheio. Use uma logo menor ou exclua uma empresa.', 'error', 6000);
    return false;
  }
}

function salvarNotas() {
  try {
    localStorage.setItem(NOTAS_KEY, JSON.stringify(state.notas));
  } catch (erro) {
    console.error('Falha ao salvar notas:', erro);
    showToast('As notas estão apenas nesta sessão: não foi possível salvar no navegador.', 'error', 6000);
  }
}

function carregarNotas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(NOTAS_KEY));
    state.notas = Array.isArray(salvas) ? salvas.filter(n => n && typeof n.nf === 'string' && n.nf.trim() && typeof n.destinatario === 'string' && n.destinatario.trim() && typeof n.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.data) && Number.isInteger(n.volumes) && n.volumes >= 1 && n.volumes <= 999 && (n.empresa == null || (typeof n.empresa === 'object' && !Array.isArray(n.empresa) && typeof n.empresa.nome === 'string' && n.empresa.nome.trim()))).slice(0, 100).map(n => ({
      data: n.data, nf: n.nf, destinatario: n.destinatario, volumes: n.volumes,
      descricao: typeof n.descricao === 'string' ? n.descricao : '',
      empresa: n.empresa == null ? { ...empresaAtiva() } : {
        ...Object.fromEntries(['nome', 'cnpj', 'endereco', 'bairro', 'cidade', 'uf', 'cep'].map(campo => [campo, typeof n.empresa[campo] === 'string' ? n.empresa[campo] : ''])),
        logoTamanho: normalizarTamanhoLogo(n.empresa.logoTamanho),
        logo: typeof n.empresa.logo === 'string' && /^data:image\/(png|jpe?g);base64,/.test(n.empresa.logo) ? n.empresa.logo : ''
      },
      origem: ['manual', 'upload', 'integracao'].includes(n.origem) ? n.origem : 'manual',
      ...(typeof n.chave === 'string' && /^\d{44}$/.test(n.chave) ? { chave: n.chave } : {}),
      ...(typeof n.serie === 'string' ? { serie: n.serie } : {}),
      ...(typeof n.dataEmissao === 'string' ? { dataEmissao: n.dataEmissao } : {})
    })) : [];
    let total = 0;
    state.notas = state.notas.filter(n => (total += n.volumes) <= 3000);
  } catch {
    state.notas = [];
  }
  state.notas.forEach(n => { if (!n.empresa) n.empresa = { ...empresaAtiva() }; });
}

function carregarOpcoesImpressao() {
  try {
    const salvas = JSON.parse(localStorage.getItem(OPCOES_IMPRESSAO_KEY));
    if (typeof salvas?.exibirEnderecoRemetente !== 'boolean' && typeof salvas?.layoutSimplificado === 'boolean') state.opcoesImpressao.exibirEnderecoRemetente = !salvas.layoutSimplificado;
    for (const campo of ['exibirData', 'exibirDescricao', 'exibirEnderecoRemetente']) {
      if (typeof salvas?.[campo] === 'boolean') state.opcoesImpressao[campo] = salvas[campo];
    }
  } catch { /* Preferências inválidas usam os padrões da interface. */ }
  for (const campo of ['exibirData', 'exibirDescricao', 'exibirEnderecoRemetente']) els[campo].checked = state.opcoesImpressao[campo];
}

function salvarOpcoesImpressao() {
  for (const campo of ['exibirData', 'exibirDescricao', 'exibirEnderecoRemetente']) state.opcoesImpressao[campo] = els[campo].checked;
  try { localStorage.setItem(OPCOES_IMPRESSAO_KEY, JSON.stringify(state.opcoesImpressao)); }
  catch { showToast('As opções de impressão valem apenas nesta sessão: não foi possível salvar no navegador.', 'error'); }
  renderNotas();
}

function empresaAtiva() {
  return state.empresas.find(e => e.id === state.empresaAtivaId) || state.empresas[0];
}

function linhaEnderecoEmpresa(empresa) {
  const partes = [];
  if (empresa.bairro) partes.push(empresa.bairro);
  const cidadeUf = [empresa.cidade, empresa.uf].filter(Boolean).join(' / ');
  if (cidadeUf) partes.push(cidadeUf);
  return partes.join(' - ');
}

function normalizarTamanhoLogo(valor) { return Math.max(25, Math.min(300, Number(valor) || 100)); }
function logoHTML(empresa, classe = 'label') {
  if (empresa?.logo) {
    return `<img class="${classe === 'label' ? 'label-logo' : ''}" src="${escaparHTML(empresa.logo)}" alt="Logo da empresa" data-logo-tamanho="${normalizarTamanhoLogo(empresa.logoTamanho)}">`;
  }

  return `
    <div class="logo-placeholder">
      ${icons.building.replace('class="icon"', '')}
      <span>SUA LOGO<br>AQUI</span>
    </div>
  `;
}

function adicionarNota() {
  const data = els.data.value;
  const nf = els.nf.value.trim();
  const destinatario = els.destinatario.value.trim();
  const volumes = Number(els.volumes.value);
  const descricao = els.descricao.value.trim();

  atualizarAvisosCampos(true);
  if (!data || !nf || !destinatario || !Number.isInteger(volumes) || volumes < 1 || volumes > 999) {
    const primeiro = ['data', 'nf', 'destinatario', 'volumes'].find(id => $(id).getAttribute('aria-invalid') === 'true');
    if (primeiro) $(primeiro).focus();
    showToast('Confira o campo indicado antes de adicionar.', 'error');
    return;
  }

  if (state.notas.length >= 100 || state.notas.reduce((total, n) => total + n.volumes, 0) + volumes > 3000) {
    showToast('Limite do lote: 100 notas ou 3.000 etiquetas. Imprima e inicie outro lote.', 'error'); return;
  }
  const importada = state.notaImportada;
  if (importada && !$('confirmarRevisao').checked) { $('confirmarRevisao').focus(); showToast('Marque “Conferi os dados do XML” para adicionar.', 'error'); return; }
  if (importada && nf !== importada.nf) { showToast('O número deve corresponder ao XML. Volte ao manual para digitar outra nota.', 'error'); return; }
  if (importada && state.notas.some(n => n.chave === importada.chave)) { showToast('Esta chave de NF-e já está no lote.', 'error'); return; }
  const empresa = { ...(importada?.emitente || empresaAtiva()) };
  state.notas.push({ data, nf, destinatario, volumes, descricao, empresa,
    ...(importada ? { chave: importada.chave, serie: importada.serie, origem: importada.origem, dataEmissao: importada.data } : { origem: 'manual' }) });
  limparCamposNota(false);
  renderizar();
}

function limparCamposNota(limparData) {
  finalizarRevisao(state.notaImportada?.chave && !limparData ? state.notaImportada.chave : null);
  if (limparData) els.data.value = dataHojeInput();
  els.nf.value = '';
  els.destinatario.value = '';
  els.volumes.value = '1';
  els.descricao.value = '';
  atualizarAvisosCampos();
  els.nf.focus();
}

function removerNota(index) {
  state.notas.splice(index, 1);
  renderizar();
}

function limparTudo() {
  if (state.notas.length > 0 && !confirm('Deseja limpar todas as notas?')) return;
  state.notas = [];
  limparCamposNota(true);
  renderizar();
}

function gerarEtiquetas() {
  const etiquetas = [];
  state.notas.forEach((nota, notaIndex) => {
    for (let i = 1; i <= nota.volumes; i++) {
      etiquetas.push({ ...nota, etiquetaAtual: i, notaIndex });
    }
  });
  return etiquetas;
}

function quebrarEmFolhas(etiquetas) {
  const folhas = [];
  const f = formatoAtual();
  const quantidade = layoutPapel().quantidade;
  for (let i = 0; i < etiquetas.length; i += quantidade) folhas.push(etiquetas.slice(i, i + quantidade));
  return folhas;
}

function criarEtiqueta(etiqueta) {
  const remetente = etiqueta.empresa || empresaAtiva();
  const cnpj = NFe.digitos(remetente.cnpj);
  const modelo = /^\d{14}$/.test(cnpj) ? state.empresas.find(e => NFe.digitos(e.cnpj) === cnpj && e.logo) : null;
  const empresa = { ...remetente, logo: modelo?.logo || remetente.logo || '', logoTamanho: modelo?.logoTamanho || remetente.logoTamanho || 100 };
  return `
    <div class="label" data-nota="${etiqueta.notaIndex}">
      <div class="label-header">
        <div class="logo-box">${logoHTML(empresa)}</div>
        <div class="company">
          <strong title="${escaparHTML(empresa.nome)}">${escaparHTML(empresa.nome)}</strong>
          <span class="company-line">CNPJ: ${escaparHTML(empresa.cnpj)}</span>
          ${state.opcoesImpressao.exibirEnderecoRemetente ? `
          <span class="company-line">${escaparHTML(empresa.endereco)}</span>
          <span class="company-line">${escaparHTML(linhaEnderecoEmpresa(empresa))}</span>
          <span class="company-line">CEP: ${escaparHTML(empresa.cep)}</span>
          ` : ''}
        </div>
      </div>

      <div class="content-grid">
        <div class="content-main">
          ${state.opcoesImpressao.exibirData ? `<div class="date-line">Data:<span>${escaparHTML(formatarDataInput(etiqueta.data))}</span></div>` : ''}
          <div class="block-title">Endereço de entrega:</div>
          <div class="shipping-text">${textoComQuebras(etiqueta.destinatario)}</div>
        </div>

        <div class="right-box">
          <div class="nf-label">NF:</div>
          <div class="nf-number" style="font-size:${Math.max(modoImpressaoAtual() === 'bobina80legivel' ? 8 : 0, Math.min(['bobina80', 'bobina80legivel', 'bobina85'].includes(modoImpressaoAtual()) ? 11 : 15, 100 / Math.max(1, etiqueta.nf.length))) * escalaPapel()}pt" title="${escaparHTML(etiqueta.nf)}">${escaparHTML(etiqueta.nf)}</div>
          <div class="right-sep"></div>
          <div class="vol-label">Volume:</div>
          <div class="volume-number">${etiqueta.etiquetaAtual}/${etiqueta.volumes}</div>
        </div>
        ${state.opcoesImpressao.exibirDescricao && etiqueta.descricao ? `<div class="desc"><span class="block-title">Descrição dos Itens:</span><br><span class="desc-text">${textoComQuebras(etiqueta.descricao)}</span></div>` : ''}
      </div>
    </div>
  `;
}

function modoImpressaoAtual() {
  return els.modoImpressao.value;
}
function renderNotas() {

  const etiquetas = gerarEtiquetas();
  els.btnImprimir.disabled = etiquetas.length === 0;
  const folhas = formatoAtual().tipo === 'papel' ? quebrarEmFolhas(etiquetas) : [];
  const modo = modoImpressaoAtual();
  els.preview.classList.toggle('bobina-compacta', ['bobina80', 'bobina80legivel', 'bobina85'].includes(modo));
  els.preview.classList.toggle('bobina80', modo === 'bobina80');
  els.preview.classList.toggle('bobina80legivel', modo === 'bobina80legivel');

  els.countNotas.textContent = state.notas.length;
  els.summary.innerHTML = formatoAtual().tipo === 'papel'
    ? `Total de etiquetas: ${etiquetas.length}<br>Folhas necessárias (${formatoAtual().nome}): ${folhas.length}`
    : `Total de etiquetas: ${etiquetas.length}<br>Páginas na bobina: ${etiquetas.length}`;

  els.listaNotas.innerHTML = state.notas.map((nota, i) => `
    <div class="note-card">
      <div>
        <strong>NF: ${escaparHTML(nota.nf)}</strong><span class="badge">${nota.volumes} etiquetas</span>
        <p><b>Data:</b> ${escaparHTML(formatarDataInput(nota.data))} &nbsp;|&nbsp; <b>Volumes:</b> ${nota.volumes}</p>
        <p class="note-company"><b>Empresa:</b> ${escaparHTML(nota.empresa?.nome || empresaAtiva().nome)}</p>
      </div>
      <button class="btn-danger btn-icon" type="button" data-remover-nota="${i}" title="Remover nota">${icons.trash}</button>
    </div>
  `).join('');

  if (!etiquetas.length) {
    els.preview.innerHTML = '<div class="empty">Adicione uma nota para visualizar as etiquetas.</div>';
  } else if (formatoAtual().tipo === 'papel') {
    els.preview.innerHTML = folhas.map(folha => `<div class="paper-sheet-preview"><section class="sheet">${folha.map(criarEtiqueta).join('')}</section></div>`).join('');
  } else {
    els.preview.innerHTML = `<section class="roll-preview">${etiquetas.map(e => `<div class="bobina-page">${criarEtiqueta(e)}</div>`).join('')}</section>`;
  }

  document.querySelectorAll('[data-remover-nota]').forEach(btn => {
    btn.addEventListener('click', () => removerNota(Number(btn.dataset.removerNota)));
  });
  ajustarTextosEtiquetas();
  ajustarTamanhosLogos();
}

function ajustarTextosEtiquetas() {
  const grupos = new Map();
  els.preview.querySelectorAll('.label').forEach(etiqueta => {
    const id = etiqueta.dataset.nota;
    if (!grupos.has(id)) grupos.set(id, []);
    grupos.get(id).push(etiqueta);
  });
  const excedidas = [];
  for (const etiquetas of grupos.values()) {
    const amostra = etiquetas[0];
    const principal = amostra.querySelector('.content-main');
    const descricao = amostra.querySelector('.desc');
    const corpo = amostra.querySelector('.content-grid');
    const lateral = amostra.querySelector('.right-box');
    const papel = formatoAtual().tipo === 'papel';
    const grande = papel && (layoutPapel().selecionada || layoutPapel().lista);
    if (papel) {
      // Ajustar identificadores pela largura real evita reticências na NF e no volume.
      for (const seletor of ['.nf-number', '.volume-number']) {
        const numero = amostra.querySelector(seletor);
        let fonte = parseFloat(getComputedStyle(numero).fontSize);
        const conteudoOriginal = numero.textContent;
        if (seletor === '.volume-number') numero.textContent = etiquetas[etiquetas.length - 1].querySelector(seletor).textContent;
        const texto = document.createRange(); texto.selectNodeContents(numero);
        while ((numero.scrollWidth > numero.clientWidth || texto.getBoundingClientRect().width / (numero.getBoundingClientRect().width / parseFloat(getComputedStyle(numero).width) || 1) > numero.clientWidth - 2) && fonte > 8) { fonte -= .25; numero.style.fontSize = fonte + 'px'; }
        numero.textContent = conteudoOriginal;
        etiquetas.slice(1).forEach(e => { e.querySelector(seletor).style.fontSize = fonte + 'px'; });
      }
    }
    const compacto80 = modoImpressaoAtual() === 'bobina80legivel';
    const camposExtras = compacto80 || grande ? [...amostra.querySelectorAll('.company strong,.company-line,.nf-number,.volume-number')] : papel ? [...amostra.querySelectorAll('.nf-number,.volume-number')] : [];
    const cabe = () => [principal, corpo, lateral, descricao, ...camposExtras].filter(Boolean).every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1);
    const tamanhoMinimo = compacto80 ? 8 * 96 / 72 : 8;
    let tamanho = compacto80 ? tamanhoMinimo : modoImpressaoAtual() === 'bobina80' ? 10.5 : (papel ? 10 : 9) * escalaPapel();
    const aplicar = etiqueta => {
      etiqueta.querySelector('.content-main').style.fontSize = `${tamanho}px`;
      const desc = etiqueta.querySelector('.desc');
      if (desc) desc.style.fontSize = (papel ? Math.max(8, tamanho * .9) : tamanho) + 'px';
    };
    aplicar(amostra);
    const textoCabe = () => papel ? [principal, descricao].filter(Boolean).every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) : cabe();
    while (!textoCabe() && tamanho > tamanhoMinimo) { tamanho -= .25; aplicar(amostra); }
    if (papel) {
      const numeros = [...amostra.querySelectorAll('.nf-number,.volume-number')];
      const lateralCabe = () => [lateral, ...numeros].every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1);
      let tentativas = 0;
      while (!lateralCabe() && tentativas++ < 200) {
        numeros.forEach(el => { el.style.fontSize = Math.max(8, parseFloat(getComputedStyle(el).fontSize) - .25) + 'px'; });
      }
      etiquetas.slice(1).forEach(e => numeros.forEach(numero => { e.querySelector('.' + numero.className).style.fontSize = numero.style.fontSize; }));
    }
    etiquetas.slice(1).forEach(aplicar);
    if (!cabe()) excedidas.push(amostra.querySelector('.nf-number').textContent);
  }
  const aviso = $('avisoLayout');
  aviso.hidden = excedidas.length === 0;
  aviso.textContent = excedidas.length ? `Texto não cabe na etiqueta da(s) NF(s) ${excedidas.join(', ')}. Resuma a descrição ou revise as quebras do endereço antes de imprimir.` : '';
  return excedidas.length === 0;
}

function renderEmpresas() {
  els.listaEmpresas.innerHTML = state.empresas.map(empresa => {
    const ativa = empresa.id === state.empresaAtivaId;
    return `
      <div class="company-card ${ativa ? 'active' : ''}" data-selecionar-empresa="${escaparHTML(empresa.id)}">
        <div class="thumb">${empresa.logo ? `<img src="${escaparHTML(empresa.logo)}" alt="Logo">` : icons.building}</div>
        <div>
          <strong>${escaparHTML(empresa.nome || 'Empresa sem nome')}</strong>
          <p>${escaparHTML(empresa.cnpj || 'Sem CNPJ')}<br>${escaparHTML(linhaEnderecoEmpresa(empresa) || 'Sem endereço')}</p>
        </div>
        <span style="color:${ativa ? 'var(--primary)' : 'var(--muted)'}; font-weight:800;">${ativa ? 'Ativa' : 'Usar'}</span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-selecionar-empresa]').forEach(card => {
    card.addEventListener('click', () => selecionarEmpresa(card.dataset.selecionarEmpresa));
  });
}

function preencherFormularioEmpresa(empresa) {
  state.empresaEditandoId = empresa?.id || null;
  state.logoEditando = empresa?.logo || '';
  els.tamanhoLogo.value = normalizarTamanhoLogo(empresa?.logoTamanho);
  els.nomeEmpresa.value = empresa?.nome || '';
  els.cnpjEmpresa.value = empresa?.cnpj || '';
  els.enderecoEmpresa.value = empresa?.endereco || '';
  els.bairroEmpresa.value = empresa?.bairro || '';
  els.cidadeEmpresa.value = empresa?.cidade || '';
  els.ufEmpresa.value = empresa?.uf || '';
  els.cepEmpresa.value = empresa?.cep || '';
  atualizarPreviewLogo();
}

function selecionarEmpresa(id) {
  const empresa = state.empresas.find(e => e.id === id);
  if (!empresa) return;
  state.empresaAtivaId = id;
  preencherFormularioEmpresa(empresa);
  salvarEmpresas();
  renderizar();
}

function novaEmpresa() {
  preencherFormularioEmpresa(null);
  els.nomeEmpresa.focus();
}

function salvarEmpresaAtual() {
  const empresa = {
    id: state.empresaEditandoId || `empresa-${Date.now()}`,
    nome: els.nomeEmpresa.value.trim(),
    cnpj: els.cnpjEmpresa.value.trim(),
    endereco: els.enderecoEmpresa.value.trim(),
    bairro: els.bairroEmpresa.value.trim(),
    cidade: els.cidadeEmpresa.value.trim(),
    uf: els.ufEmpresa.value.trim().toUpperCase(),
    cep: els.cepEmpresa.value.trim(),
    logo: state.logoEditando,
    logoTamanho: normalizarTamanhoLogo(els.tamanhoLogo.value)
  };

  if (!empresa.nome || !empresa.cnpj) {
    showToast('Preencha pelo menos Nome da Empresa e CNPJ.', 'error');
    return;
  }

  const index = state.empresas.findIndex(e => e.id === empresa.id);
  if (index >= 0) state.empresas[index] = empresa;
  else state.empresas.push(empresa);

  state.empresaAtivaId = empresa.id;
  state.empresaEditandoId = empresa.id;
  const salvo = salvarEmpresas();
  renderizar();
  if (salvo) showToast('Modelo de empresa salvo com sucesso!', 'success');
}

function excluirEmpresaAtual() {
  if (!state.empresaEditandoId) {
    showToast('Selecione uma empresa cadastrada para excluir.', 'error');
    return;
  }
  if (state.empresas.length <= 1) {
    showToast('É necessário manter pelo menos uma empresa cadastrada.', 'error');
    return;
  }
  if (!confirm('Deseja excluir este modelo de empresa?')) return;

  state.empresas = state.empresas.filter(e => e.id !== state.empresaEditandoId);
  if (state.empresaAtivaId === state.empresaEditandoId) state.empresaAtivaId = state.empresas[0].id;
  const empresa = empresaAtiva();
  preencherFormularioEmpresa(empresa);
  salvarEmpresas();
  renderizar();
}

function dimensionarLogo(img, tamanho) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  img.style.width = ''; img.style.height = ''; img.style.maxWidth = ''; img.style.maxHeight = '';
  const estilo = getComputedStyle(img);
  const caixa = img.parentElement;
  const limiteW = Math.min(caixa.clientWidth, (estilo.maxWidth.endsWith('%') ? parseFloat(estilo.maxWidth) / 100 * caixa.clientWidth : parseFloat(estilo.maxWidth)) || caixa.clientWidth);
  const limiteH = Math.min(caixa.clientHeight, (estilo.maxHeight.endsWith('%') ? parseFloat(estilo.maxHeight) / 100 * caixa.clientHeight : parseFloat(estilo.maxHeight)) || caixa.clientHeight);
  const naturalScale = img.id === 'logoPreview' ? caixa.clientWidth / (Number(caixa.dataset.larguraMm) * 96 / 25.4) : escalaPapel();
  const base = Math.min(naturalScale, limiteW / img.naturalWidth, limiteH / img.naturalHeight);
  const escala = Math.min(base * normalizarTamanhoLogo(tamanho) / 100, caixa.clientWidth / img.naturalWidth, caixa.clientHeight / img.naturalHeight);
  img.style.maxWidth = '100%'; img.style.maxHeight = '100%';
  img.style.width = (img.naturalWidth * escala) + 'px';
  img.style.height = (img.naturalHeight * escala) + 'px';
}
function ajustarTamanhosLogos() {
  els.preview.querySelectorAll('img.label-logo').forEach(img => {
    const ajustar = () => dimensionarLogo(img, img.dataset.logoTamanho);
    img.onload = ajustar;
    if (img.complete) ajustar();
  });
}
function atualizarPreviewLogo() {
  const formato = modoImpressaoAtual();
  const compacta = ['bobina80','bobina85','bobina80legivel'].includes(formato);
  const simples = formato === 'bobina80legivel';
  const grande = formatoAtual().tipo === 'papel' && (layoutPapel().selecionada || layoutPapel().lista);
  const w = grande ? layoutPapel().largura * .34 : simples ? 20 : compacta ? 26 : 43;
  const h = grande ? 12 * escalaPapel() : simples ? 6 : compacta ? 9 : 12;
  const area = els.uploadBox;
  area.dataset.larguraMm = w;
  area.style.aspectRatio = w + ' / ' + h;
  area.style.setProperty('--preview-logo-max-w', (simples ? 100 : compacta ? 25/26*100 : 42/43*100) + '%');
  area.style.setProperty('--preview-logo-max-h', (simples ? 5.5/6*100 : compacta ? 8/9*100 : 11/12*100) + '%');
  $('areaLogoInfo').textContent = 'Área da logo: ' + w + ' × ' + h + ' mm · ' + els.modoImpressao.options[els.modoImpressao.selectedIndex].text;

  const tamanho = normalizarTamanhoLogo(els.tamanhoLogo.value);
  els.valorTamanhoLogo.textContent = tamanho + '%';
  els.logoPreview.onload = () => dimensionarLogo(els.logoPreview, els.tamanhoLogo.value);
  if (els.logoPreview.complete) dimensionarLogo(els.logoPreview, tamanho);
  els.tamanhoLogo.disabled = !state.logoEditando;
  els.btnRestaurarLogo.disabled = !state.logoEditando;
  if (state.logoEditando) {
    els.logoPreview.src = state.logoEditando;
    els.logoPreview.style.display = 'block';
    els.logoPreviewIcon.style.display = 'none';
    els.logoPreviewText.style.display = 'none';
  } else {
    els.logoPreview.removeAttribute('src');
    els.logoPreview.style.display = 'none';
    els.logoPreviewIcon.style.display = 'inline-block';
    els.logoPreviewText.style.display = 'block';
    renderIcons();
  }
}

function lerLogo(file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    showToast('Use uma imagem PNG, JPG ou JPEG.', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('A logo precisa ter no máximo 2MB para salvar no navegador.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.logoEditando = reader.result;
    atualizarPreviewLogo();
  };
  reader.readAsDataURL(file);
}

function configurarUploadLogo() {
  els.logoEmpresa.addEventListener('change', event => lerLogo(event.target.files[0]));

  ['dragenter', 'dragover'].forEach(eventName => {
    els.uploadBox.addEventListener(eventName, event => {
      event.preventDefault();
      els.uploadBox.classList.add('drag');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    els.uploadBox.addEventListener(eventName, event => {
      event.preventDefault();
      els.uploadBox.classList.remove('drag');
    });
  });

  els.uploadBox.addEventListener('drop', event => lerLogo(event.dataTransfer.files[0]));
}

function atualizarRegraPagina() {
  const modo = modoImpressaoAtual();
  let style = document.getElementById('print-page-rule');
  if (!style) {
    style = document.createElement('style');
    style.id = 'print-page-rule';
    document.head.appendChild(style);
  }
  const f = formatoAtual();
  const papel = f.tipo === 'papel';
  const layout = papel ? layoutPapel() : null;
  const larguraPagina = papel ? layout.paginaLargura : f.largura;
  const alturaPagina = papel ? layout.paginaAltura : f.altura;
  style.textContent = '@page { size: ' + larguraPagina + 'mm ' + alturaPagina + 'mm; margin: 0; }';
  els.preview.style.setProperty('--sheet-w', larguraPagina + 'mm');
  els.preview.style.setProperty('--sheet-h', alturaPagina + 'mm');
  els.preview.style.setProperty('--sheet-columns', papel ? layout.colunas : 1);
  els.preview.style.setProperty('--sheet-gap', (papel ? layout.gap : 0) + 'mm');
  els.preview.style.setProperty('--label-w', (papel ? layout.largura : f.largura) + 'mm');
  els.preview.style.setProperty('--label-h', (papel ? layout.altura : f.altura) + 'mm');
  els.preview.style.setProperty('--paper-scale', papel ? layout.escala : 1);
  els.preview.classList.toggle('paper-sheet-mode', papel);
  els.preview.classList.toggle('paper-large', Boolean(papel && (layout.selecionada || layout.lista)));
  els.preview.classList.toggle('paper-list-mode', Boolean(papel && layout.lista));
  $('organizacaoFolha').hidden = !papel;
  document.querySelectorAll('[data-organizacao]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.organizacao === organizacaoFolha)));
  const seletor = $('disposicaoPapel');
  $('controleDisposicao').hidden = !papel;
  if (papel) {
    const padrao = layout.padrao;
    seletor.options[0].textContent = layout.lista ? padrao + ' por folha · Lista' : padrao + ' por folha · 100 × 50 mm (atual)';
    const dez = seletor.querySelector('[value="10"]');
    dez.hidden = !layout.lista && padrao === 10;
    dez.disabled = Boolean(layout.lista && layout.limiteLista < 10);
    dez.textContent = layout.lista ? '10 por folha · 10 linhas' + (dez.disabled ? ' (não cabe neste papel)' : '') : '10 por folha · 2 × 5';
    seletor.querySelector('[value="4"]').textContent = layout.lista ? '4 por folha · 4 linhas' : '4 por folha · 2 × 2';
    seletor.value = layout.selecionada ? String(layout.selecionada) : 'atual';
    $('descricaoDisposicao').hidden = !layout.selecionada && !layout.lista;
    $('descricaoDisposicao').textContent = layout.largura.toLocaleString('pt-BR') + ' × ' + layout.altura.toLocaleString('pt-BR') + ' mm por etiqueta';
  }
  document.querySelectorAll('[data-formato]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.formato === modo)));
  document.querySelectorAll('.format-group').forEach(group => {
    const escolhido = group.querySelector('[data-formato="' + modo + '"]');
    group.querySelector('.format-current').textContent = escolhido ? '· ' + f.nome : '';
  });
}

function atualizarEscalaPrevia() {
  const folha = els.preview.querySelector('.sheet');
  if (!folha) { els.preview.style.removeProperty('--paper-preview-scale'); return; }
  const estilo = getComputedStyle(folha);
  const larguraReal = parseFloat(estilo.width);
  const alturaReal = parseFloat(estilo.height);
  const disponivel = Math.max(1, els.preview.clientWidth - 32);
  const escala = Math.min(1, disponivel / larguraReal);
  els.preview.style.setProperty('--paper-preview-scale', String(escala));
  els.preview.style.setProperty('--paper-preview-w', larguraReal * escala + 'px');
  els.preview.style.setProperty('--paper-preview-h', alturaReal * escala + 'px');
}
function renderizar() {
  salvarNotas();
  atualizarRegraPagina();
  renderNotas();
  renderEmpresas();
  renderIcons();
  atualizarEscalaPrevia();
}

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  els.tamanhoLogo.addEventListener('input', atualizarPreviewLogo);
  els.btnRestaurarLogo.addEventListener('click', () => { els.tamanhoLogo.value = 100; atualizarPreviewLogo(); });
  const settings = $('configuracoesEmpresa');
  $('btnConfiguracoes').addEventListener('click', () => { settings.showModal(); atualizarPreviewLogo(); });
  $('btnFecharConfiguracoes').addEventListener('click', () => settings.close());
  renderIcons();
  carregarEmpresas();
  carregarNotas();
  carregarOpcoesImpressao();
  els.data.value = dataHojeInput();
  preencherFormularioEmpresa(empresaAtiva());
  configurarUploadLogo();

  els.btnAdicionar.addEventListener('click', adicionarNota);
  els.btnImprimir.addEventListener('click', () => {
    if (!ajustarTextosEtiquetas()) { showToast('Revise os textos indicados antes de imprimir: eles excedem o tamanho selecionado.', 'error', 6000); return; }
    atualizarRegraPagina();
    window.print();
  });
  window.addEventListener('beforeprint', ajustarTextosEtiquetas);
  const observadorPrevia = new ResizeObserver(atualizarEscalaPrevia);
  observadorPrevia.observe(els.preview);
  els.btnLimpar.addEventListener('click', limparTudo);
  els.exibirEnderecoRemetente.addEventListener('change', salvarOpcoesImpressao);
  els.modoImpressao.addEventListener('change', renderizar);
  document.querySelectorAll('[data-organizacao]').forEach(button => button.addEventListener('click', () => {
    organizacaoFolha = button.dataset.organizacao;
    try { localStorage.setItem(ORGANIZACAO_KEY, organizacaoFolha); } catch {}
    renderizar();
  }));
  $('disposicaoPapel').addEventListener('change', () => {
    disposicoesPapel[chaveDisposicao()] = $('disposicaoPapel').value;
    try { localStorage.setItem(DISPOSICOES_KEY, JSON.stringify(disposicoesPapel)); } catch {}
    renderizar();
  });
  document.querySelectorAll('[data-formato]').forEach(button => button.addEventListener('click', () => { els.modoImpressao.value = button.dataset.formato; renderizar(); }));
  els.exibirData.addEventListener('change', salvarOpcoesImpressao);
  els.exibirDescricao.addEventListener('change', salvarOpcoesImpressao);
  els.btnNovaEmpresa.addEventListener('click', novaEmpresa);
  els.btnSalvarEmpresa.addEventListener('click', salvarEmpresaAtual);
  els.btnExcluirEmpresa.addEventListener('click', excluirEmpresaAtual);

  renderizar();
  registrarServiceWorker();
});

/* PWA: registra o service worker que faz o cache offline.
   Só funciona via http/https — abrindo o index.html direto do disco (file://)
   o navegador bloqueia o registro, e o app segue funcionando normalmente. */
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  navigator.serviceWorker.register('./sw.js')
    .catch(erro => console.warn('Service worker não registrado:', erro));
}

// O crédito continua legível mesmo quando o avatar remoto está indisponível.
document.addEventListener('DOMContentLoaded', () => {
 const avatar = document.getElementById('avatarCriador');
 if (!avatar) return;
 avatar.addEventListener('error', () => { avatar.hidden = true; });
 if (avatar.complete && !avatar.naturalWidth) avatar.hidden = true;
});

document.addEventListener('DOMContentLoaded', () => {
 document.querySelectorAll('.context-help-button').forEach(button => {
  button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); button.parentElement.classList.toggle('ajuda-aberta', open); });
  button.addEventListener('keydown', event => { if (event.key === 'Escape') { button.setAttribute('aria-expanded', 'false'); button.parentElement.classList.remove('ajuda-aberta'); button.blur(); } });
 });
});

document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('.workflow-nav a')];
  const marcar = hash => links.forEach(link => { if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
  marcar(links.some(link => link.getAttribute('href') === location.hash) ? location.hash : '#etapaNota');
  links.forEach(link => link.addEventListener('click', () => marcar(link.getAttribute('href'))));
  window.addEventListener('hashchange', () => marcar(location.hash || '#etapaNota'));
});