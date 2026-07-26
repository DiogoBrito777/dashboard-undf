# UniProjetos Dashboard
Projeto Aplicado - Design - Problema 3

O UniProjetos Dashboard é uma aplicação web (Single Page Application) desenvolvida para gerenciar vagas, inscrições e ocupação de projetos universitários. O painel fornece uma visão analítica rápida (KPIs e Gráficos) e permite detalhamento granular (Drill-down) em uma interface limpa e responsiva.

## 🛠 Tecnologias Utilizadas
* **HTML5:** Estruturação semântica e acessível.
* **CSS3:** Design System baseado em variáveis (`:root`), responsividade via Flexbox/Grid e animações nativas. Compatível com Modo Claro e Escuro.
* **JavaScript (Vanilla JS):** Zero frameworks. Manipulação direta do DOM, consumo de dados assíncrono e lógica de filtragem complexa.
* **Chart.js:** Biblioteca externa injetada via CDN para renderização do gráfico de rosca (ocupação) e pizza (vagas por área).

## ⚙️ Funcionalidades Principais
* **Consumo de Dados Dinâmico:** Leitura assíncrona do arquivo `mock.json` usando a Fetch API.
* **Motor de Busca Avançado:** Pesquisa cruzada (Nome do Projeto, Área Temática, Status e Semestre) com ignorância de acentos e capitalização, otimizada por Debounce para não travar a interface durante a digitação.
* **Interface Resiliente:** Telas vetorizadas e informativas para Empty States (quando um filtro não retorna resultados) e Error States (quando o arquivo JSON não é encontrado).
* **Barra Lateral (Drawer):** Ao clicar em um projeto na tabela, os dados dos alunos inscritos são carregados em um painel lateral deslizante, que suporta ordenação independente de colunas.
* **Acessibilidade (WCAG):** Navegação por teclado estruturada, gerenciamento de foco para modais, suporte a Leitores de Tela via atributos WAI-ARIA dinâmicos e paleta de cores ajustada para contraste seguro, inclusive no Modo Escuro.

## 🚀 Como Executar o Projeto

Como a aplicação utiliza a função `fetch()` nativa do JavaScript para realizar requisições HTTP, ela **não funcionará corretamente** se o arquivo `index.html` for aberto diretamente pelo navegador (protocolo `file:///`) devido ao bloqueio de segurança de CORS.

**Opção 1: Acessar o Deploy Público (GitHub Pages)**
O Método oficial de testar a aplicação é acessando o nosso link de produção em servidor web real:
🔗 **https://diogobrito777.github.io/dashboard-undf/**

**Opção 2: Rodar a aplicação localmente (VS Code)**
1. Abra a pasta raiz do projeto no Visual Studio Code.
2. Certifique-se de ter a extensão **Live Server** instalada.
3. Clique com o botão direito sobre o arquivo `index.html` e selecione "Open with Live Server".
4. O painel será aberto automaticamente no navegador operando através de um servidor local (ex: `http://127.0.0.1:5500/`).

## ⚠️ Como Simular a Falha de Conexão (Error State)

O sistema possui tratamento robusto de erros (Try/Catch). Para testar a interface de falha com o botão de recuperação, você pode utilizar um dos dois métodos abaixo:

**Método 1: Via DevTools**
1. Com o painel aberto no navegador, pressione `F12` para abrir o DevTools e acesse a aba **Network (Rede)**.
2. Pressione `F5` para listar os arquivos carregados.
3. Clique com o botão direito sobre o arquivo `mock.json` na lista e selecione **"Block request URL" (Bloquear URL de solicitação)**.
4. Atualize a página (`F5`). O layout estrutural carregará, mas a requisição de dados falhará, disparando a interface visual vermelha de erro e o botão de "Tentar Novamente".
5. Para restaurar, desmarque a caixa de bloqueio na aba do DevTools e clique no botão "Tentar Novamente" na própria interface do painel.

**Método 2: Renomeando o Arquivo JSON (Via Código)**
1. Na pasta do projeto local (ou no repositório do GitHub), renomeie temporariamente o arquivo `mock.json` (exemplo: para `mock_off.json`).
2. Atualize a página no navegador. A aplicação tentará buscar os dados, não encontrará o arquivo correspondente e exibirá a tela de erro `ERR_FILE_NOT_FOUND` / `ERR_NETWORK`.
3. Para se recuperar, volte o nome original do arquivo para `mock.json` e clique no botão "Tentar Novamente".
