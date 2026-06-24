const DEFAULT_LOGO = "assets/img/diogo-logo.jpg";
const STORAGE_KEY = 'expedicao_empresas_v2';
const ACTIVE_KEY = 'expedicao_empresa_ativa_v2';

const state = {
  notas: [],
  empresas: [],
  empresaAtivaId: null,
  empresaEditandoId: null,
  logoEditando: '',
};

const icons = {
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
    'listaNotas', 'countNotas', 'summary', 'preview', 'modoImpressao', 'modeloAtual', 'listaEmpresas',
    'btnNovaEmpresa', 'btnSalvarEmpresa', 'btnExcluirEmpresa', 'logoEmpresa', 'uploadBox', 'logoPreview',
    'logoPreviewIcon', 'logoPreviewText', 'nomeEmpresa', 'cnpjEmpresa', 'enderecoEmpresa', 'bairroEmpresa',
    'cidadeEmpresa', 'ufEmpresa', 'cepEmpresa'
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
    nome: 'A Diogo Comercio de Ferragens LTDA',
    cnpj: '01.475.960/0001-70',
    endereco: 'Rua Pedro Zagonel, 1396',
    bairro: 'Novo Mundo',
    cidade: 'Curitiba',
    uf: 'PR',
    cep: '81050-110',
    logo: DEFAULT_LOGO
  };
}

function carregarEmpresas() {
  try {
    state.empresas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    state.empresas = [];
  }

  if (!state.empresas.length) {
    state.empresas = [defaultCompany()];
    salvarEmpresas();
  }

  state.empresaAtivaId = localStorage.getItem(ACTIVE_KEY) || state.empresas[0].id;
  if (!state.empresas.some(e => e.id === state.empresaAtivaId)) {
    state.empresaAtivaId = state.empresas[0].id;
  }
  state.empresaEditandoId = state.empresaAtivaId;
}

function salvarEmpresas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.empresas));
  if (state.empresaAtivaId) localStorage.setItem(ACTIVE_KEY, state.empresaAtivaId);
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

function logoHTML(empresa, classe = 'label') {
  if (empresa?.logo) {
    return `<img class="${classe === 'label' ? 'label-logo' : ''}" src="${empresa.logo}" alt="Logo da empresa">`;
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
  const volumes = Number.parseInt(els.volumes.value, 10);
  const descricao = els.descricao.value.trim();

  if (!data || !nf || !destinatario || !Number.isInteger(volumes) || volumes < 1) {
    showToast('Preencha Data, NF, Endereço Destinatário e Qtd. de Volumes.', 'error');
    return;
  }

  state.notas.push({ data, nf, destinatario, volumes, descricao });
  limparCamposNota(false);
  renderizar();
}

function limparCamposNota(limparData) {
  if (limparData) els.data.value = dataHojeInput();
  els.nf.value = '';
  els.destinatario.value = '';
  els.volumes.value = '1';
  els.descricao.value = '';
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
  state.notas.forEach(nota => {
    for (let i = 1; i <= nota.volumes; i++) {
      etiquetas.push({ ...nota, etiquetaAtual: i });
    }
  });
  return etiquetas;
}

function quebrarEmFolhas(etiquetas) {
  const folhas = [];
  for (let i = 0; i < etiquetas.length; i += 10) folhas.push(etiquetas.slice(i, i + 10));
  return folhas;
}

function criarEtiqueta(etiqueta) {
  const empresa = empresaAtiva();
  return `
    <div class="label">
      <div class="label-header">
        <div class="logo-box">${logoHTML(empresa)}</div>
        <div class="company">
          <strong title="${escaparHTML(empresa.nome)}">${escaparHTML(empresa.nome)}</strong>
          <span class="company-line">CNPJ: ${escaparHTML(empresa.cnpj)}</span>
          <span class="company-line">${escaparHTML(empresa.endereco)}</span>
          <span class="company-line">${escaparHTML(linhaEnderecoEmpresa(empresa))}</span>
          <span class="company-line">CEP: ${escaparHTML(empresa.cep)}</span>
        </div>
      </div>

      <div class="date-line">Data:<span>${formatarDataInput(etiqueta.data)}</span></div>

      <div class="content-grid">
        <div class="content-main">
          <div class="block-title">Endereço Destinatário:</div>
          <div class="shipping-text">${textoComQuebras(etiqueta.destinatario)}</div>
          ${etiqueta.descricao ? `<div class="desc"><span class="block-title">Descrição dos Itens:</span><br>${textoComQuebras(etiqueta.descricao)}</div>` : ''}
        </div>

        <div class="right-box">
          <div class="nf-label">NF:</div>
          <div class="nf-number" title="${escaparHTML(etiqueta.nf)}">${escaparHTML(etiqueta.nf)}</div>
          <div class="right-sep"></div>
          <div class="vol-label">Qtd. Volumes:</div>
          <div class="volume-number">${etiqueta.volumes}</div>
          <div class="volume-count">Etiqueta ${etiqueta.etiquetaAtual}/${etiqueta.volumes}</div>
        </div>
      </div>
    </div>
  `;
}

function renderNotas() {
  const etiquetas = gerarEtiquetas();
  const folhas = quebrarEmFolhas(etiquetas);
  const modo = els.modoImpressao.value;

  els.countNotas.textContent = state.notas.length;
  els.modeloAtual.textContent = modo === 'a4' ? '10 etiquetas por folha' : '1 etiqueta por página';
  els.summary.innerHTML = modo === 'a4'
    ? `Total de etiquetas: ${etiquetas.length}<br>Folhas necessárias (A4): ${folhas.length}`
    : `Total de etiquetas: ${etiquetas.length}<br>Páginas na bobina: ${etiquetas.length}`;

  els.listaNotas.innerHTML = state.notas.map((nota, i) => `
    <div class="note-card">
      <div>
        <strong>NF: ${escaparHTML(nota.nf)}</strong><span class="badge">${nota.volumes} etiquetas</span>
        <p><b>Data:</b> ${formatarDataInput(nota.data)} &nbsp;|&nbsp; <b>Volumes:</b> ${nota.volumes}</p>
        <p><b>Dest.:</b> ${escaparHTML(nota.destinatario.split('\n')[0] || '')}</p>
        ${nota.descricao ? `<p><b>Itens:</b> ${escaparHTML(nota.descricao)}</p>` : ''}
      </div>
      <button class="btn-danger btn-icon" type="button" data-remover-nota="${i}" title="Remover nota">${icons.trash}</button>
    </div>
  `).join('');

  if (!etiquetas.length) {
    els.preview.innerHTML = '<div class="empty">Adicione uma nota para visualizar as etiquetas.</div>';
  } else if (modo === 'a4') {
    els.preview.innerHTML = folhas.map(folha => `<section class="sheet">${folha.map(criarEtiqueta).join('')}</section>`).join('');
  } else {
    els.preview.innerHTML = `<section class="roll-preview">${etiquetas.map(e => `<div class="bobina-page">${criarEtiqueta(e)}</div>`).join('')}</section>`;
  }

  document.querySelectorAll('[data-remover-nota]').forEach(btn => {
    btn.addEventListener('click', () => removerNota(Number(btn.dataset.removerNota)));
  });
}

function renderEmpresas() {
  els.listaEmpresas.innerHTML = state.empresas.map(empresa => {
    const ativa = empresa.id === state.empresaAtivaId;
    return `
      <div class="company-card ${ativa ? 'active' : ''}" data-selecionar-empresa="${empresa.id}">
        <div class="thumb">${empresa.logo ? `<img src="${empresa.logo}" alt="Logo">` : icons.building}</div>
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
    logo: state.logoEditando
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
  salvarEmpresas();
  renderizar();
  showToast('Modelo de empresa salvo com sucesso!', 'success');
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

function atualizarPreviewLogo() {
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

function renderizar() {
  renderNotas();
  renderEmpresas();
  renderIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  renderIcons();
  carregarEmpresas();
  els.data.value = dataHojeInput();
  preencherFormularioEmpresa(empresaAtiva());
  configurarUploadLogo();

  els.btnAdicionar.addEventListener('click', adicionarNota);
  els.btnImprimir.addEventListener('click', () => window.print());
  els.btnLimpar.addEventListener('click', limparTudo);
  els.modoImpressao.addEventListener('change', renderizar);
  els.btnNovaEmpresa.addEventListener('click', novaEmpresa);
  els.btnSalvarEmpresa.addEventListener('click', salvarEmpresaAtual);
  els.btnExcluirEmpresa.addEventListener('click', excluirEmpresaAtual);

  renderizar();
});
