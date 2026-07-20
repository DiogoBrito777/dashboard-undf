document.addEventListener('DOMContentLoaded', () => {
    /* Referências DOM */
    /* Tema*/
    const themeToggle = document.getElementById('themeToggle');

    /* Aplica o tema salvo ou padrão light */
    const initTheme = localStorage.getItem('theme') || 'light';
    setTheme(initTheme);

    /* Troca de tema ao clicar no botão */
    themeToggle.addEventListener('click', () => {
        const novoTema = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(novoTema);
    });

    /* Função única que ajusta atributo, texto do botão e grava no storage */
    function setTheme(modo) {
        document.body.dataset.theme = modo;
        localStorage.setItem('theme', modo); // persiste preferência
        themeToggle.textContent = modo === 'dark'
            ? '☀️ Modo Claro'
            : '🌙 Modo Escuro';
    }

    const searchBar        = document.querySelector('.search-bar');
    const areaSelect       = document.querySelectorAll('.filter-select')[0];
    const statusSelect     = document.querySelectorAll('.filter-select')[1];

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    /* Estado de ordenação */
    let sortConfig = { coluna: null, asc: true };

    clearFiltersBtn.addEventListener('click', () => {
        searchBar.value = '';
        areaSelect.value   = 'todas';   // valor que agora existe no HTML
        statusSelect.value = 'todos';   // idem
        sortConfig = { coluna: null, asc: true };
        aplicarFiltros();
    });
        const tableBody        = document.querySelector('.data-table tbody');
        const vagasCard        = document.querySelector('[data-card="vagas"] .stat-value');
        const inscritosCard    = document.querySelector('[data-card="inscritos"] .stat-value');
        const ocupacaoLivresEl = document.querySelector('[data-card="ocupacao"] .occupation-numbers .secondary');
        const ocupacaoOcupadasEl = document.querySelector('[data-card="ocupacao"] .occupation-numbers .big-number');
        const pieCtx           = document.getElementById('pieChart').getContext('2d');
        const occCtx           = document.getElementById('occupancyChart').getContext('2d');

        let projetosOriginais = [];
        let projetosFiltrados = [];

    // Ordenação
    if (sortConfig.coluna) {
        projetosFiltrados.sort((a, b) => {
            const prop = sortConfig.coluna;
            let valA = a[prop];
            let valB = b[prop];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return sortConfig.asc ? -1 : 1;
            if (valA > valB) return sortConfig.asc ? 1 : -1;
            return 0;
        });
    }


    let pieChart = null;
    let occChart = null;

    const slugify = (str) => str.toLowerCase()
                                .normalize('NFD')
                                .replace(/[^\w\s-]/g, '')
                                .trim()
                                .replace(/\s+/g, '-');

    /* Cálculos e interface */
    function atualizarCards() {
        /* --- soma geral --- */
        const vagasLivres   = projetosFiltrados.reduce((s, p) => s + (p.vagas - p.inscritos), 0);
        const vagasOcupadas = projetosFiltrados.reduce((s, p) => s + p.inscritos, 0);
        const vagasTotal    = vagasLivres + vagasOcupadas;

        /* --- valores absolutos (cards 1 e 2) --- */
        vagasCard.textContent     = vagasLivres;
        inscritosCard.textContent = vagasOcupadas;

        /* --- porcentagem para o card 3 --- */
        const taxa = vagasTotal === 0 ? 0 : (vagasOcupadas / vagasTotal) * 100;
        const taxaLabel = document.getElementById('taxaPercent');
        if (taxaLabel) taxaLabel.textContent = `${taxa.toFixed(1)} %`;

        /* --- atualiza o doughnut --- */
        const occData = [vagasOcupadas, vagasLivres];
        if (occChart) {
            occChart.data.datasets[0].data = occData;
            occChart.update();
        } else {
            occChart = new Chart(occCtx, {
                type: 'doughnut',
                data: { labels: ['Ocupadas', 'Livres'],
                        datasets: [{ data: occData }] },
                options: {
                    plugins: { legend: { display: false } },
                    cutout: '70%'
                }
            });
        }
    }

    function atualizarTabela() {
        tableBody.innerHTML = '';
        if (projetosFiltrados.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhum projeto encontrado.</td></tr>';
            return;
        }
        const rows = projetosFiltrados.map(p => {
            const badgeClass = p.status.toLowerCase().includes('vagas') ? 'badge-green' : 'badge-yellow';
            return `
                <tr>
                    <td>${p.nome}</td>
                    <td>${p.areaTematica}</td>
                    <td><span class="badge ${badgeClass}">${p.status}</span></td>
                    <td>${p.vagas}</td>
                    <td>${p.inscritos}</td>
                </tr>
            `;
        }).join('');
        tableBody.innerHTML = rows;
    }

    function atualizarPieChart() {
        const porArea = {};
        projetosFiltrados.forEach(p => {
            porArea[p.areaTematica] = (porArea[p.areaTematica] || 0) + p.vagas;
        });
        const labels = Object.keys(porArea);
        const data = Object.values(porArea);

        if (pieChart) {
            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = data;
            pieChart.update();
        } else {
            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{ data }]
                },
                options: {
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    }

    function atualizarInterface() {
        atualizarCards();
        atualizarTabela();
        atualizarPieChart();
    }

    /* Filtros */
    function aplicarFiltros() {
        const termo      = searchBar.value.toLowerCase();
        const areaSlug   = areaSelect.value;
        const statusSlug = statusSelect.value;

        projetosFiltrados = projetosOriginais.filter(p => {
            const matchNome   = p.nome.toLowerCase().includes(termo);
            const matchArea   = areaSlug   === 'todas' || slugify(p.areaTematica) === areaSlug;
            const matchStatus = statusSlug === 'todos' || slugify(p.status)       === statusSlug;
            return matchNome && matchArea && matchStatus;
        });

        /* Ordenação se houver coluna selecionada */
        if (sortConfig.coluna) {
            const prop = sortConfig.coluna;
            projetosFiltrados.sort((a, b) => {
                let valA = a[prop];
                let valB = b[prop];
                if (typeof valA === 'string') { // alfabeticamente
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }
                if (valA < valB) return sortConfig.asc ? -1 :  1;
                if (valA > valB) return sortConfig.asc ?  1 : -1;
                return 0;
            });
        }

        atualizarInterface();   // recarrega cards, tabela e gráficos
    }

    /* Eventos */
    searchBar.addEventListener('input', aplicarFiltros);
    areaSelect.addEventListener('change', aplicarFiltros);
    statusSelect.addEventListener('change', aplicarFiltros);

    /*Carregar dados */
    function carregarDados() {
        try {
            const data = window.mockData;
            if (!data || !data.projetos) throw new Error('mockData não encontrado');
            projetosOriginais = data.projetos;
            projetosFiltrados = [...projetosOriginais];

            // Preencher select de áreas com base nos dados
            const areasUnicas = [...new Set(projetosOriginais.map(p => p.areaTematica))];
            // Manter "Todas as Áreas" como primeira opção
            areaSelect.innerHTML = '<option value="todas">Todas as Áreas</option>' + 
                areasUnicas.map(a => `<option value="${slugify(a)}">${a}</option>`).join('');

            aplicarFiltros();
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados</td></tr>';
        }
    }

    
// Listeners de ordenação
document.querySelectorAll('.data-table thead th').forEach((th, idx) => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
        const props = ['nome','areaTematica','status','vagas','inscritos'];
        const prop = props[idx];
        if (sortConfig.coluna === prop) {
            sortConfig.asc = !sortConfig.asc;
        } else {
            sortConfig.coluna = prop;
            sortConfig.asc = true;
        }
        aplicarFiltros();
    });
});

    carregarDados();
});
