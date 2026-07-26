/* ========================================= */
/* CONFIGURAÇÕES GERAIS DE LATÊNCIA          */
/* ========================================= */
const API_DELAY_MS = 1200;       
const FILTER_DELAY_MS = 400;     
const DRAWER_LOADING_MS = 400;   

document.addEventListener('DOMContentLoaded', () => {
    /* ========================================= */
    /* ESTADO GLOBAL DA APLICAÇÃO                */
    /* ========================================= */
    let projetosOriginais = [];
    let projetosFiltrados = [];
    let sortConfig = { coluna: null, asc: true };
    let pieChart = null;
    let occChart = null;
    let filterTimeout; 
    let dataLoadedSuccessfully = false; 

    let currentOpenProjectId = null;
    let studentSortConfig = { coluna: null, asc: true };
    let lastFocusedElement = null;

    /* ========================================= */
    /* REFERÊNCIAS DO DOM                        */
    /* ========================================= */
    const themeToggle = document.getElementById('themeToggle');
    const searchBar = document.querySelector('.search-bar');
    const areaSelect = document.querySelectorAll('.filter-select')[0];
    const statusSelect = document.querySelectorAll('.filter-select')[1];
    const semestreSelect = document.getElementById('semestreSelect');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    const tableContainer = document.getElementById('tableContainer');
    const vagasDisponiveisEl = document.getElementById('vagasDisponiveis');
    const qtdVagasTotaisEl = document.getElementById('qtdVagasTotais');
    const totalInscricoesEl = document.getElementById('totalInscricoes');
    const taxaPercentEl = document.getElementById('taxaPercent');
    const ocupacaoDetalhesEl = document.getElementById('ocupacaoDetalhes');
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    const occCtx = document.getElementById('occupancyChart').getContext('2d');

    const projectModal = document.getElementById('projectModal');
    const closeModalBtn = document.querySelector('.close-modal');

    /* ========================================= */
    /* GERENCIAMENTO DE TEMA (CLARO/ESCURO)       */
    /* ========================================= */
    const initTheme = localStorage.getItem('theme') || 'light';
    setTheme(initTheme);

    themeToggle.addEventListener('click', () => {
        const novoTema = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(novoTema);
    });

    function setTheme(modo) {
        document.body.dataset.theme = modo;
        localStorage.setItem('theme', modo);
        themeToggle.textContent = modo === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
        
        if(pieChart) {
            pieChart.options.plugins.legend.labels.color = modo === 'dark' ? '#c9d1d9' : '#333333';
            pieChart.update();
        }
        if(occChart) {
            occChart.data.datasets[0].backgroundColor = modo === 'dark' ? ['#8f7a66', '#2d333b'] : ['#8f7a66', '#e1e4e8'];
            occChart.update();
        }
    }

    const slugify = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

    clearFiltersBtn.addEventListener('click', () => {
        searchBar.value = '';
        areaSelect.value = 'todas';
        statusSelect.value = 'todos';
        semestreSelect.value = 'todos';
        sortConfig = { coluna: null, asc: true };
        aplicarFiltrosComLoading();
    });

    /* ========================================= */
    /* ATUALIZAÇÃO DOS KPIS (CARDS SUPERIORES)   */
    /* ========================================= */
    function atualizarCards() {
        const vagasTotais = projetosFiltrados.reduce((s, p) => s + p.vagas, 0);
        const vagasOcupadas = projetosFiltrados.reduce((s, p) => s + p.inscritos, 0);
        
        const vagasLivres = projetosFiltrados.reduce((s, p) => {
            if (p.status.toLowerCase().includes('encerrado')) return s + 0; 
            return s + Math.max(0, p.vagas - p.inscritos);
        }, 0);

        if (vagasDisponiveisEl) vagasDisponiveisEl.textContent = vagasLivres;
        if (qtdVagasTotaisEl) qtdVagasTotaisEl.textContent = vagasTotais;
        if (totalInscricoesEl) totalInscricoesEl.textContent = vagasOcupadas;

        const taxa = vagasTotais === 0 ? 0 : (vagasOcupadas / vagasTotais) * 100;
        if (taxaPercentEl) taxaPercentEl.textContent = `${taxa.toFixed(1)}%`;
        if (ocupacaoDetalhesEl) ocupacaoDetalhesEl.textContent = `${vagasOcupadas} ocup. · ${vagasLivres} livres`;

        const occData = [vagasOcupadas, vagasLivres];
        const occBgColors = document.body.dataset.theme === 'dark' ? ['#8f7a66', '#2d333b'] : ['#8f7a66', '#e1e4e8'];
        
        if (occChart) {
            occChart.data.datasets[0].data = occData;
            occChart.data.datasets[0].backgroundColor = occBgColors;
            occChart.update();
        } else {
            occChart = new Chart(occCtx, {
                type: 'doughnut',
                data: { labels: ['Ocupadas', 'Livres'], datasets: [{ data: occData, backgroundColor: occBgColors, borderWidth: 0 }] },
                options: { plugins: { legend: { display: false } }, cutout: '70%', maintainAspectRatio: false }
            });
        }
    }

    /* ========================================= */
    /* ESTADO VAZIO (EMPTY STATE)                */
    /* ========================================= */
    function renderEmptyState() {
        const hasArea = areaSelect.value !== 'todas';
        const hasStatus = statusSelect.value !== 'todos';
        const hasSemestre = semestreSelect.value !== 'todos';
        
        let tagsHtml = '';
        if(hasArea || hasStatus || hasSemestre) {
            tagsHtml = `<div class="filters-pills">Filtros ativos: 
                ${hasArea ? `<span class="pill pill-area"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Área aplicada</span>` : ''}
                ${hasStatus ? `<span class="pill pill-status"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Status aplicado</span>` : ''}
                ${hasSemestre ? `<span class="pill pill-semestre"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Semestre ${semestreSelect.options[semestreSelect.selectedIndex].text}</span>` : ''}
            </div>`;
        }

        tableContainer.innerHTML = `
            <div class="empty-state-container">
                <div class="empty-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="60" height="60" aria-hidden="true" focusable="false">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                ${tagsHtml}
                <h3 class="state-title">Nenhum projeto encontrado</h3>
                <p class="state-desc">Não localizamos projetos correspondentes aos filtros de pesquisa atuais. Tente ampliar ou limpar os critérios de busca.</p>
                <button onclick="document.getElementById('clearFiltersBtn').click()" class="clear-filters-btn" style="display:flex;align-items:center;gap:8px;" aria-label="Limpar todos os filtros">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Limpar filtros
                </button>
            </div>
        `;
    }

    /* ========================================= */
    /* RENDERIZAÇÃO DA TABELA PRINCIPAL          */
    /* ========================================= */
    function atualizarTabela() {
        if (!document.querySelector('.data-table')) {
            tableContainer.innerHTML = `
                <table id="projectsTable" class="data-table">
                    <thead>
                        <tr>
                            <th data-field="nome"><div class="th-content">NOME DO PROJETO <span class="sort-icon">↕</span></div></th>
                            <th data-field="area"><div class="th-content">ÁREA TEMÁTICA <span class="sort-icon">↕</span></div></th>
                            <th data-field="status"><div class="th-content">STATUS <span class="sort-icon">↕</span></div></th>
                            <th data-field="vagas"><div class="th-content">VAGAS <span class="sort-icon">↕</span></div></th>
                            <th data-field="inscritos"><div class="th-content">INSCRITOS <span class="sort-icon">↕</span></div></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            document.querySelectorAll('.data-table thead th').forEach((th, idx) => {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => {
                    const props = ['nome', 'areaTematica', 'status', 'vagas', 'inscritos'];
                    const prop = props[idx];
                    if (sortConfig.coluna === prop) { sortConfig.asc = !sortConfig.asc; } 
                    else { sortConfig.coluna = prop; sortConfig.asc = true; }
                    aplicarFiltrosComLoading();
                });
            });
        }
        
        const tbody = document.querySelector('.data-table tbody');
        if (projetosFiltrados.length === 0) {
            renderEmptyState();
            return;
        }
        
        const rows = projetosFiltrados.map(p => {
            let badgeClass = 'badge-yellow';
            const statusL = p.status.toLowerCase();
            if (statusL.includes('vagas')) badgeClass = 'badge-green';
            if (statusL.includes('encerrado')) badgeClass = 'badge-red';

            return `
                <tr class="clickable-row" data-id="${p.id}" title="Clique para detalhes das inscrições" tabindex="0" role="button">
                    <td>${p.nome}</td>
                    <td>${p.areaTematica}</td>
                    <td><span class="badge ${badgeClass}">${p.status}</span></td>
                    <td>${p.vagas}</td>
                    <td>${p.inscritos}</td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = rows;

        document.querySelectorAll('.clickable-row').forEach(row => {
            row.addEventListener('click', () => {
                abrirModal(parseInt(row.getAttribute('data-id'), 10));
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrirModal(parseInt(row.getAttribute('data-id'), 10));
                }
            });
        });
    }

    /* ========================================= */
    /* GRÁFICO DE PIZZA (ÁREAS TEMÁTICAS)        */
    /* ========================================= */
    function atualizarPieChart() {
        const porArea = {};
        projetosFiltrados.forEach(p => {
            porArea[p.areaTematica] = (porArea[p.areaTematica] || 0) + p.vagas;
        });
        
        const sortedAreas = Object.entries(porArea).sort((a, b) => b[1] - a[1]);
        const labels = sortedAreas.map(item => item[0]);
        const data = sortedAreas.map(item => item[1]);

        const wcagPalette = ['#4a7c59', '#5b8a92', '#b58f3f', '#a85c45', '#5c4a72', '#6c7a89', '#8f7a66', '#4a6b5d'];
        const dynamicColors = wcagPalette.slice(0, Math.max(data.length, wcagPalette.length));

        if (pieChart) {
            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = data;
            pieChart.data.datasets[0].backgroundColor = dynamicColors;
            pieChart.update();
        } else {
            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: { labels, datasets: [{ data, backgroundColor: dynamicColors, borderWidth: 0 }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, 
                    layout: { padding: { left: 10, right: 10, top: 20, bottom: 20 } },
                    plugins: { 
                        legend: { 
                            position: 'bottom', align: 'start', 
                            labels: {
                                padding: 15, boxWidth: 12,
                                color: document.body.dataset.theme === 'dark' ? '#c9d1d9' : '#333333'
                            }
                        } 
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const clickedArea = pieChart.data.labels[index];
                            const areaSlug = slugify(clickedArea);
                            const optionExists = Array.from(areaSelect.options).some(opt => opt.value === areaSlug);
                            if (optionExists) {
                                areaSelect.value = areaSlug;
                                aplicarFiltrosComLoading();
                            }
                        }
                    }
                }
            });
        }
    }

    function atualizarInterface() {
        atualizarCards();
        atualizarTabela();
        atualizarPieChart();
    }

    /* ========================================= */
    /* LÓGICA DE FILTRAGEM E BUSCA CRUZADA       */
    /* ========================================= */
    function processarFiltros() {
        const termoNormalizado = searchBar.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();
        const areaSlug = areaSelect.value;
        const statusSlug = statusSelect.value;
        const semestre = semestreSelect.value;

        searchBar.classList.toggle('filter-active', searchBar.value.trim() !== '');
        areaSelect.classList.toggle('filter-active', areaSelect.value !== 'todas');
        statusSelect.classList.toggle('filter-active', statusSelect.value !== 'todos');
        semestreSelect.classList.toggle('filter-active', semestreSelect.value !== 'todos');

        projetosFiltrados = projetosOriginais.filter(p => {
            const nomeNormalizado = p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            const areaNormalizada = p.areaTematica.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

            const matchPesquisa = nomeNormalizado.includes(termoNormalizado) || areaNormalizada.includes(termoNormalizado);
            const matchArea = areaSlug === 'todas' || slugify(p.areaTematica) === areaSlug;
            const matchStatus = statusSlug === 'todos' || slugify(p.status) === statusSlug;
            const matchSemestre = semestre === 'todos' || p.semestre === semestre;
            
            return matchPesquisa && matchArea && matchStatus && matchSemestre;
        });

        if (sortConfig.coluna) {
            const prop = sortConfig.coluna;
            projetosFiltrados.sort((a, b) => {
                let valA = a[prop]; let valB = b[prop];
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                if (valA < valB) return sortConfig.asc ? -1 : 1;
                if (valA > valB) return sortConfig.asc ? 1 : -1;
                return 0;
            });
        }

        atualizarInterface();
    }

    function aplicarFiltrosComLoading() {
        if (!dataLoadedSuccessfully) {
            carregarDados();
            return;
        }

        clearTimeout(filterTimeout);
        if(document.querySelector('.data-table tbody')) {
            document.querySelector('.data-table tbody').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 60px 0;">
                        <div class="spinner" style="margin: 0 auto;"></div>
                        <h3 style="margin-top: 15px; color: var(--text-title); font-size: 1.5rem;">Processando dados...</h3>
                    </td>
                </tr>
            `;
        }
        filterTimeout = setTimeout(processarFiltros, FILTER_DELAY_MS); 
    }

    searchBar.addEventListener('input', aplicarFiltrosComLoading);
    areaSelect.addEventListener('change', aplicarFiltrosComLoading);
    statusSelect.addEventListener('change', aplicarFiltrosComLoading);
    semestreSelect.addEventListener('change', aplicarFiltrosComLoading);

    searchBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') aplicarFiltrosComLoading();
    });
    areaSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') aplicarFiltrosComLoading();
    });
    statusSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') aplicarFiltrosComLoading();
    });
    semestreSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') aplicarFiltrosComLoading();
    });

    const getInitials = (name) => {
        const parts = name.split(' ');
        if(parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ['#5b8a92', '#4a7c59', '#b58f3f', '#a85c45', '#5c4a72'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    /* ========================================= */
    /* BARRA LATERAL (MODAL DE DETALHES)         */
    /* ========================================= */
    function renderStudentsTable() {
        const studentsContainer = document.getElementById('modalStudentsTable');
        if (!studentsContainer) return;

        const projeto = projetosOriginais.find(p => p.id === currentOpenProjectId);
        if (!projeto) return;

        let alunos = [...(projeto.alunos || [])];

        if (studentSortConfig.coluna) {
            const prop = studentSortConfig.coluna;
            alunos.sort((a, b) => {
                let valA = a[prop] || ''; 
                let valB = b[prop] || '';
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                if (valA < valB) return studentSortConfig.asc ? -1 : 1;
                if (valA > valB) return studentSortConfig.asc ? 1 : -1;
                return 0;
            });
        }

        if (alunos.length === 0) {
            studentsContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary); background: var(--bg-body); border-radius: 8px;">Nenhum aluno inscrito neste projeto até o momento.</div>`;
            return;
        }

        const rows = alunos.map(aluno => {
            const turnoSlug = slugify(aluno.turno || 'Integral');
            return `
                <tr>
                    <td>
                        <div class="student-name-col">
                            <div class="student-avatar" style="background-color: ${getAvatarColor(aluno.nome)}">${getInitials(aluno.nome)}</div>
                            <div class="student-info-text">
                                <span class="student-name">${aluno.nome}</span>
                                <span class="student-email">${aluno.email || '-'}</span>
                            </div>
                        </div>
                    </td>
                    <td style="color: var(--text-secondary);">${aluno.telefone || '-'}</td>
                    <td style="font-weight: 500;">${aluno.curso || '-'}</td>
                    <td><span class="tag-${turnoSlug}">${aluno.turno || '-'}</span></td>
                    <td style="color: var(--text-secondary);">${aluno.dataCadastro || '-'}</td>
                </tr>
            `;
        }).join('');

        studentsContainer.innerHTML = `
            <div class="students-table-wrapper">
                <table class="students-table">
                    <thead>
                        <tr>
                            <th data-field="nome"><div class="th-content">ALUNO / E-MAIL <span class="sort-icon">↕</span></div></th>
                            <th data-field="telefone"><div class="th-content">TELEFONE <span class="sort-icon">↕</span></div></th>
                            <th data-field="curso"><div class="th-content">CURSO <span class="sort-icon">↕</span></div></th>
                            <th data-field="turno"><div class="th-content">TURNO <span class="sort-icon">↕</span></div></th>
                            <th data-field="dataCadastro"><div class="th-content">DATA CADASTRO <span class="sort-icon">↕</span></div></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        studentsContainer.querySelectorAll('thead th').forEach((th, idx) => {
            th.addEventListener('click', () => {
                const props = ['nome', 'telefone', 'curso', 'turno', 'dataCadastro'];
                const prop = props[idx];
                if (studentSortConfig.coluna === prop) { studentSortConfig.asc = !studentSortConfig.asc; } 
                else { studentSortConfig.coluna = prop; studentSortConfig.asc = true; }
                renderStudentsTable();
            });
        });
    }

    function abrirModal(id) {
        const projeto = projetosOriginais.find(p => p.id === id);
        if (!projeto) return;

        lastFocusedElement = document.activeElement;

        currentOpenProjectId = id;
        studentSortConfig = { coluna: null, asc: true }; 

        projectModal.style.display = 'flex';
        projectModal.setAttribute('aria-hidden', 'false');
        
        const dynamicContent = document.querySelector('.drawer-dynamic-content');
        
        dynamicContent.innerHTML = `
            <div class="loading-container" style="height: 100vh;">
                <div class="spinner"></div>
                <h3>Processando detalhes...</h3>
            </div>
        `;

        setTimeout(() => {
            let badgeClass = 'badge-yellow';
            const statusL = projeto.status.toLowerCase();
            if (statusL.includes('vagas')) badgeClass = 'badge-green';
            if (statusL.includes('encerrado')) badgeClass = 'badge-red';

            const isEncerrado = statusL.includes('encerrado');
            const disp = isEncerrado ? 0 : Math.max(0, projeto.vagas - projeto.inscritos);
            const alunos = projeto.alunos || [];
            
            dynamicContent.innerHTML = `
                <div class="modal-header">
                    <div class="drawer-top-badges">
                        <span class="badge ${badgeClass}">${projeto.status}</span>
                        <span class="modal-area">⚗️ ${projeto.areaTematica}</span>
                    </div>
                    <h2 class="modal-title">${projeto.nome}</h2>
                    <div class="drawer-stats-row">
                        <div class="d-stat"><span class="d-val text-cyan">${projeto.vagas}</span><span class="d-lbl">Vagas totais</span></div>
                        <div class="d-stat"><span class="d-val text-purple">${projeto.inscritos}</span><span class="d-lbl">Inscritos</span></div>
                        <div class="d-stat"><span class="d-val text-green">${disp}</span><span class="d-lbl">Disponíveis</span></div>
                    </div>
                </div>
                <div class="drawer-body">
                    <div class="students-section-header">
                        <h3>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align: middle;" aria-hidden="true" focusable="false"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Alunos Inscritos
                        </h3>
                        <span class="students-count-badge">${alunos.length} aluno${alunos.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="students-table-container" id="modalStudentsTable">
                    </div>
                </div>
            `;
            
            renderStudentsTable();

            if (closeModalBtn) closeModalBtn.focus();
        }, DRAWER_LOADING_MS);
    }

    function fecharModal() {
        projectModal.style.display = 'none';
        projectModal.setAttribute('aria-hidden', 'true');
        
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    closeModalBtn.addEventListener('click', fecharModal);
    
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) fecharModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.style.display === 'flex') {
            fecharModal();
        }
    });

    /* ========================================= */
    /* REQUISIÇÃO DE DADOS (FETCH API)           */
    /* ========================================= */
    async function carregarDados() {
        tableContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <h3>Carregando Dados</h3>
                <p>Recuperando dados da nuvem UnDF...</p>
            </div>
        `;

        try {
            const response = await fetch('mock.json');
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, API_DELAY_MS)); 

            const data = await response.json();
            if (!data || !data.projetos) throw new Error('Formato incompatível');

            dataLoadedSuccessfully = true; 
            projetosOriginais = data.projetos;
            projetosFiltrados = [...projetosOriginais];

            const areasUnicas = [...new Set(projetosOriginais.map(p => p.areaTematica))];
            areaSelect.innerHTML = '<option value="todas">Todas as Áreas</option>' + 
                areasUnicas.map(a => `<option value="${slugify(a)}">${a}</option>`).join('');

            atualizarTabela();
            aplicarFiltrosComLoading();

        } catch (error) {
            console.error(error);
            dataLoadedSuccessfully = false; 
            
            tableContainer.innerHTML = `
                <div class="error-state-container">
                    <div class="error-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="55" height="55" aria-hidden="true" focusable="false">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="state-title">Falha na conexão</h3>
                    <p class="state-desc">Não foi possível carregar os dados do arquivo mock. Verifique a disponibilidade da rede ou a integridade do JSON.</p>
                    <div class="error-code">ERR_FILE_NOT_FOUND • FETCH_FAILED</div>
                    <button class="retry-btn" onclick="location.reload()" aria-label="Tentar carregar dados novamente">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    carregarDados();
});
