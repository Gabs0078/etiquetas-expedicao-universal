# Expedição - Etiquetas

Uma aplicação web PWA simples e offline-first para geração e impressão de etiquetas de expedição (10x5cm), com suporte a layouts em folha A4 ou bobina térmica.

## 🚀 Como Usar

### 1. Inicialização
Basta abrir o arquivo `index.html` em qualquer navegador moderno. Por ser um PWA, você também pode instalá-lo no desktop ou mobile.

### 2. Configurar Empresa
1. No painel direito, vá em **Configurar Empresa**.
2. Suba a logo (PNG/JPG até 2MB) e preencha os dados.
3. Clique em **Salvar Modelo** (os dados ficam salvos no seu navegador).

### 3. Gerar e Imprimir
1. Preencha os dados da nota (NF, endereço, quantidade de volumes).
2. Clique em **Adicionar Nota** para ver a pré-visualização.
3. Escolha o formato na barra de ferramentas:
   - **A4**: 10 etiquetas por folha (Modo retrato, escala 100%, sem margens).
   - **Bobina térmica**: 1 etiqueta por página (Configurar página para 100mm x 50mm).

---

## 🛠️ Tecnologias e Funcionalidades

* **Stack:** HTML5, CSS3 (com variáveis nativas e animações) e JavaScript.
* **Armazenamento:** `localStorage` para persistência dos dados das empresas e da empresa ativa.
* **PWA:** Suporte a funcionamento offline-first e instalação nativa via `manifest.webmanifest`.
* **UX/UI:** Tema escuro nativo, design responsivo e sistema de notificações via toasts customizados (sem `alert` síncrono).
* **Privacidade:** 100% client-side. Nenhum dado é enviado para servidores externos.

---

## 📂 Estrutura do Projeto

```txt
etiquetas-expedicao-universal/
├── index.html                  # Interface principal
├── manifest.webmanifest        # Configuração PWA
├── roadmap.md                  # Roadmap a ser seguido no projeto
└── assets/
    ├── css/styles.css          # Estilização global e componentes
    ├── js/app.js               # Lógica de estado e renderização
    ├── icons/                  # Ícones do PWA
    └── img/                    # Assets estáticos