# UniProjetos Dashboard

O UniProjetos Dashboard é uma aplicação web (Single Page Application) desenvolvida para gerenciar vagas, inscrições e ocupação de projetos universitários. O painel fornece uma visão analítica rápida (KPIs e Gráficos) e permite detalhamento granular (Drill-down) em uma interface limpa e responsiva.

## 🚀 Tecnologias Utilizadas
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

## 🛠️ Como Executar o Projeto e Simular Falhas

Como a aplicação utiliza a função `fetch()` do JavaScript para realizar requisições HTTP locais ao arquivo `mock.json`, ela **não funcionará corretamente** se o `index.html` for aberto diretamente pelo navegador (protocolo `file:///`). O bloqueio de CORS barrará a leitura dos dados.

**Para rodar a aplicação:**
1. Abra a pasta raiz do projeto no Visual Studio Code.
2. Certifique-se de ter a extensão Live Server instalada.
3. Clique com o botão direito sobre o arquivo `index.html` e selecione "Open with Live Server".
4. O painel será aberto automaticamente operando através de um servidor local (ex: `http://127.0.0.1:5500/`).

**Para simular falha de banco de dados:** 
O sistema possui tratamento robusto de erros (Try/Catch). Para testar a interface de falha:
1. Com o sistema rodando, vá na pasta do projeto e renomeie temporariamente o arquivo `mock.json` (ex: `mock_off.json`).
2. Atualize a página no navegador. A tela de erro vermelha interceptará a falha de rede.
3. Volte o nome do arquivo para `mock.json` e clique no botão Tentar Novamente na interface para ver o sistema se recuperar.
