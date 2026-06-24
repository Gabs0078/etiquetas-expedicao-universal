# Expedição - Etiquetas

Aplicação web simples e moderna para gerar etiquetas de expedição no tamanho **10x5cm**, com impressão em **A4 com 10 etiquetas** ou **bobina térmica adesiva 10x5cm**.

## ✨ Características

### 🎨 Design Moderno
- Interface limpa e responsiva
- **Tema escuro fixo** com foco em legibilidade e contraste
- Paleta de cores vibrante e profissional
- Animações suaves e fluidas
- Totalmente responsivo (desktop, tablet, mobile)

### 🔔 Notificações Inteligentes
- Toasts em lugar de alerts
- Feedback visual imediato sem bloquear a interface
- Animações suaves de entrada/saída

### 💾 Armazenamento Local
- Não precisa instalar nada
- Os modelos de empresa são salvos localmente no navegador usando `localStorage`
- Dados persistem entre sessões

## Como Usar

### Primeiros Passos
1. Abra o arquivo `index.html` no navegador (qualquer navegador moderno)
2. A aplicação carrega automaticamente detectando seu tema preferido do sistema

### Cadastrar Empresa
1. Vá até a seção "CONFIGURAR EMPRESA" no painel direito
2. Faça upload da logo (PNG, JPG até 2MB)
3. Preencha os dados da empresa
4. Clique em "Salvar Modelo"
5. Receberá notificação de sucesso

### Gerar Etiquetas
1. Preencha "Data" - a data de hoje é preenchida automaticamente
2. Preencha "Nº da NF" - número da nota fiscal
3. Preencha "Endereço Destinatário" - endereço completo do cliente
4. Defina "Qtd. de Volumes" - quantas unidades para essa nota
5. (Opcional) Preencha "Descrição dos Itens"
6. Clique em "Adicionar Nota"
7. Veja a pré-visualização no centro da tela

### Imprimir Etiquetas
1. Escolha o formato na barra de ferramentas:
   - **A4**: 10 etiquetas por folha (recomendado para impressoras comuns)
   - **Bobina térmica**: 1 etiqueta por página (para impressoras térmicas)
2. Clique em "Imprimir Etiquetas"
3. Configure a impressão:
   - **A4**: Modo retrato, escala 100%, sem margens
   - **Bobina**: Página personalizada 100mm x 50mm

## Recursos

- ✅ Cadastro de múltiplas empresas
- ✅ Upload de logo por empresa
- ✅ Seleção de empresa ativa
- ✅ Exclusão de modelos cadastrados
- ✅ Impressão em A4 ou bobina térmica
- ✅ Geração automática de etiquetas conforme a quantidade de volumes
- ✅ Aproveitamento inteligente de espaço no A4
- ✅ Tema escuro fixo
- ✅ Sistema de notificações toast
- ✅ Interface totalmente responsiva

## Estrutura do Projeto

```txt
etiquetas-expedicao-universal/
├── index.html                  # Interface principal
├── manifest.webmanifest        # Configuração PWA
├── README.md                   # Este arquivo
├── MELHORIAS.md               # Lista de melhorias implementadas
└── assets/
    ├── css/
    │   └── styles.css         # Estilos (tema claro/escuro, componentes, responsividade)
    ├── js/
    │   └── app.js            # Lógica da aplicação (estado, renderização, temas)
    ├── icons/
    │   ├── app-icon.svg
    │   ├── app-icon-192.png
    │   └── app-icon-512.png
    └── img/
        └── diogo-logo.jpg
```

## Observações Técnicas

### Armazenamento de Dados
- **Empresas**: Salvas em `localStorage` chave `expedicao_empresas_v2`
- **Empresa Ativa**: Salva em `localStorage` chave `expedicao_empresa_ativa_v2`
- Limite típico: 5-10MB por domínio (mais que suficiente para este caso de uso)

### Impressão
Para **A4**, use papel em modo retrato e escala 100% sem margens.
Para **bobina térmica**, configure a impressora com página personalizada de **100mm x 50mm** antes de imprimir.

### Navegadores Suportados
- Chrome/Edge (versão 90+)
- Firefox (versão 88+)
- Safari (versão 14+)
- Opera (versão 76+)

### PWA (Progressive Web App)
Esta aplicação pode ser instalada como um app nativo em:
- Smartphones Android
- iPhone/iPad
- Desktop (Windows, Mac, Linux)

Clique no ícone de "Instalar" no navegador para adicionar à tela inicial.

## Performance

- Carregamento instantâneo (sem servidor necessário)
- Offline-first: funciona mesmo sem internet
- Animações suaves com GPU acceleration
- Otimizado para dispositivos móveis

## Privacidade

- 100% privado - nenhum dado é enviado para servidores
- Tudo é salvo localmente no seu navegador
- Você tem total controle dos seus dados

## Melhorias Recentes

Veja [MELHORIAS.md](MELHORIAS.md) para a lista completa de features implementadas.

## Licença

MIT - Livre para usar e modificar

---

Desenvolvido com ❤️ para facilitar a gestão de expedições
