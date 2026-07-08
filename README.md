# dashboard-undf
Projeto Aplicado - Design - Problema 3 
Decisões de Estrutura de Dados e Design:
I. Modelagem e Normalização de Dados (mock.json)
A arquitetura de dados foi desenhada sob o paradigma relacional, separando as entidades projetos e inscrições. O vínculo ocorre por meio de chave estrangeira (projeto_id). Esta decisão elimina a redundância de dados estruturais do projeto a cada nova inscrição, otimizando o peso do arquivo JSON e facilitando a extração dinâmica de métricas (como a contagem de vagas disponíveis) via JavaScript. 
II. Semântica e Acessibilidade Base (index.html)
A interface foi estruturada com HTML5 estritamente semântico (<header>, <main>, <section>), garantindo a fundação primária para a injeção posterior das tags WAI-ARIA pela Função 5. A marcação já prevê contêineres dedicados aos estados de Loading (Skeleton Screens) e Error State, essenciais para o feedback visual contínuo exigido pelo laboratório.
III. Sistema de Design e Responsividade (style.css)
A estilização adotou uma abordagem Mobile-First complementada pelo CSS Grid Layout, permitindo a exibição em duas colunas (Listagem e Detalhes) no desktop, o que atende ao requisito de visualização instantânea do ecossistema em menos de 10 segundos. A implementação de um Design System via CSS Custom Properties (:root) centralizou a paleta institucional da UnDF, viabilizando uma transição fluida, performática e nativa para o Tema Dark, sem a necessidade de duplicar regras de estilo. 
