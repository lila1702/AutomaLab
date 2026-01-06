// =====================================================
// MAIN.JS - VERSÃO COMPLETA E ATUALIZADA
// =====================================================
// Este é o arquivo main.js completo com TODAS as integrações
// Substitua seu main.js atual por este arquivo
// =====================================================

// ===== ESTADO GLOBAL DA APLICAÇÃO =====
const APP = {
    canvas: null,
    toolbar: null,
    simulator: null,
    storage: null,
    contextModal: null,
    
    // NOVOS GERENCIADORES
    dragDrop: null,      // Drag-and-drop de estados
    undoRedo: null,      // Sistema de Undo/Redo
    zoomPan: null,       // Zoom e Pan
    
    currentMode: MODES.SELECT,
    automataType: 'dfa',
    automataName: 'Autômato 1',
};

/**
 * =====================================================
 * FUNÇÃO PRINCIPAL: Inicializa a aplicação
 * =====================================================
 */
function initializeApp() {
    try {
        console.log('🚀 Iniciando AutomaLab...');

        // ===== BLOQUEAR MENU CONTEXTUAL GLOBALMENTE (PRIMEIRA COISA!) =====
        window.addEventListener('contextmenu', (e) => {
            const canvas = document.getElementById('canvas');
            if (canvas && (e.target === canvas || canvas.contains(e.target))) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true); // Capture phase!
        
        console.log('🛡️ Menu contextual bloqueado globalmente');

        // ===== 1. CRIAR GERENCIADORES BÁSICOS =====
        console.log('📦 Criando gerenciadores básicos...');
        
        APP.canvas = new CanvasManager('canvas');
        APP.toolbar = new ToolbarManager(APP.canvas);
        APP.simulator = new Simulator(APP.canvas);
        APP.storage = new JSONManager(APP.canvas);

        // ===== 2. CRIAR GERENCIADORES DE FEATURES =====
        console.log('🎨 Criando features (Undo/Redo)...');
        
        // 2.1 Drag-and-Drop
        // ⚠️ DESABILITADO: Cytoscape já tem drag-and-drop nativo!
        // APP.dragDrop = new DragDropManager(APP.canvas);
        console.log('✅ Drag-and-Drop nativo do Cytoscape ativo');
        
        // 2.2 Undo/Redo
        APP.undoRedo = new UndoRedoManager(APP.canvas, 50);
        console.log('✅ Undo/Redo inicializado');

        // ===== 3. CONTEXT MODAL (aguardar DOM) =====
        console.log('⏳ Aguardando Context Modal...');
        wait(100).then(() => {
            APP.contextModal = new ContextModalManager(APP.canvas);
            console.log('✅ Context Modal inicializado');
        });

        // ===== 4. INICIALIZAR UI =====
        console.log('🎛️ Inicializando UI...');
        initializeUI();
        initializeCanvasEventListeners();
        initializeSimulatorUI();
        initializeNewFeatures(); // NOVA FUNÇÃO!

        // ===== 5. DEFINIR MODO INICIAL =====
        APP.toolbar.setMode(MODES.SELECT);

        console.log('✅ Aplicação inicializada com sucesso!');
        showNotification('Bem-vindo ao AutomaLab! 🎉', 'success', 2000);

    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        showNotification(`Erro: ${error.message}`, 'error', 5000);
    }
}

/**
 * =====================================================
 * NOVA FUNÇÃO: Inicializa as novas funcionalidades
 * =====================================================
 */
function initializeNewFeatures() {
    console.log('🔧 Conectando botões das novas features...');

    // ===== BOTÕES DE ZOOM (Usando Cytoscape API) =====
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnFitContent = document.getElementById('btn-fit-content');
    const zoomLabel = document.getElementById('zoom-level');

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.zoom(cy.zoom() * 1.2);
            cy.center();
            updateZoomLabel();
            showNotification('Zoom In', 'info', 1000);
        });
        console.log('✅ Botão Zoom In conectado');
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.zoom(cy.zoom() * 0.8);
            cy.center();
            updateZoomLabel();
            showNotification('Zoom Out', 'info', 1000);
        });
        console.log('✅ Botão Zoom Out conectado');
    }

    if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.zoom(1);
            cy.center();
            updateZoomLabel();
        });
        console.log('✅ Botão Zoom Reset conectado');
    }

    if (btnFitContent) {
        btnFitContent.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.fit(null, 50);
            updateZoomLabel();
        });
        console.log('✅ Botão Fit Content conectado');
    }
    
    // Atualizar label de zoom quando Cytoscape faz zoom
    APP.canvas.cy.on('zoom', () => {
        updateZoomLabel();
    });
    
    // Função para atualizar label de zoom
    function updateZoomLabel() {
        if (zoomLabel) {
            const zoom = Math.round(APP.canvas.cy.zoom() * 100);
            zoomLabel.textContent = `${zoom}%`;
        }
    }

    // ===== BOTÕES DE UNDO/REDO =====
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            APP.undoRedo.undo();
        });
        console.log('✅ Botão Undo conectado');
    }

    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            APP.undoRedo.redo();
        });
        console.log('✅ Botão Redo conectado');
    }

    // ===== CHECKBOX: SNAP TO GRID =====
    const snapToGridCheckbox = document.getElementById('snap-to-grid');
    if (snapToGridCheckbox) {
        snapToGridCheckbox.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            // TODO: Implementar snap to grid com Cytoscape
            showNotification(
                `Snap to Grid: ${enabled ? 'Ativado' : 'Desativado'} (em desenvolvimento)`,
                'info',
                1500
            );
        });
        console.log('✅ Snap to Grid conectado (placeholder)');
    }

    // ===== CHECKBOX: MOSTRAR GRADE =====
    const showGridCheckbox = document.getElementById('show-grid');
    if (showGridCheckbox) {
        showGridCheckbox.addEventListener('change', (e) => {
            const canvas = document.getElementById('canvas');
            if (e.target.checked) {
                canvas.classList.remove('hide-grid');
            } else {
                canvas.classList.add('hide-grid');
            }
        });
        console.log('✅ Show Grid conectado');
    }

    // ===== ATALHO: ESC PARA CANCELAR MODO TRANSIÇÃO =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && APP.toolbar && 
            (APP.toolbar.transitionStart !== null && APP.toolbar.transitionStart !== undefined)) {
            // Remover feedback visual
            APP.canvas.cy.$(`#state-${APP.toolbar.transitionStart}`).removeClass('transition-source');
            APP.toolbar.transitionStart = null;
            document.body.style.cursor = 'default';
            console.log('❌ Transição cancelada pelo usuário');
            showNotification('Transição cancelada', 'info', 1500);
        }
    });

    console.log('✅ Todas as features conectadas!');
}

/**
 * =====================================================
 * Inicializa elementos da UI (ATUALIZADO)
 * =====================================================
 */
function initializeUI() {
    // Input: Nome do autômato
    const automataNameInput = document.getElementById('automata-name');
    if (automataNameInput) {
        automataNameInput.addEventListener('change', (e) => {
            APP.automataName = e.target.value;
            log(`Nome do autômato alterado: ${APP.automataName}`, 'log');
        });
    }

    // Select: Tipo do autômato
    const automataTypeSelect = document.getElementById('automata-type');
    if (automataTypeSelect) {
        automataTypeSelect.addEventListener('change', (e) => {
            APP.automataType = e.target.value;
            log(`Tipo do autômato alterado: ${APP.automataType}`, 'log');
        });
    }

    // Botões da sidebar
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => APP.toolbar.handleExport());
    }

    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
        btnImport.addEventListener('click', () => APP.toolbar.handleImport());
    }

    const btnDeleteAll = document.getElementById('btn-delete-all');
    if (btnDeleteAll) {
        btnDeleteAll.addEventListener('click', () => APP.toolbar.handleClear());
    }
}

/**
 * =====================================================
 * Inicializa event listeners do canvas (ATUALIZADO COM UNDO/REDO)
 * =====================================================
 */
function initializeCanvasEventListeners() {
    const canvas = document.getElementById('canvas');

    // Clique no canvas (agora via evento customizado do Cytoscape)
window.addEventListener('canvas:clicked', (e) => {
    const { x, y } = e.detail;
    const mode = APP.toolbar.currentMode;

    if (mode === MODES.ADD_STATE) {
        try {
            const cmd = new AddStateCommand(APP.canvas, x, y);
            APP.undoRedo.execute(cmd);
            showNotification(MESSAGES.SUCCESS.STATE_CREATED, 'success', 1500);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
});

// Click em estado - CONSOLIDADO: modo SELECT e modo ADD_TRANSITION
APP.canvas.cy.on('tap', 'node', (evt) => {
    const mode = APP.toolbar ? APP.toolbar.currentMode : APP.currentMode;
    const node = evt.target;
    const stateId = node.data('stateId');
    
    console.log('🔍 [Main] Estado clicado:', node.data('label'), '| ID:', stateId, '| Modo:', mode);
    
    // ===== MODO SELECT: Atualizar sidebar =====
    if (mode === MODES.SELECT) {
        APP.canvas.selectState(stateId);
        if (typeof updateSidebar === 'function') {
            updateSidebar(stateId);
        }
        console.log('✅ Sidebar atualizada para estado', stateId);
        return; // Não continuar para lógica de transição
    }
    
    // ===== MODO ADD_TRANSITION: Lógica de transições =====
    if (mode === MODES.ADD_TRANSITION) {
        console.log('🔗 Transição - Estado clicado:', stateId, '| Estado origem:', APP.toolbar.transitionStart);
        
        // IMPORTANTE: Usar === null ao invés de !transitionStart
        // porque ID 0 é falsy em JavaScript!
        if (APP.toolbar.transitionStart === null || APP.toolbar.transitionStart === undefined) {
            // Primeiro estado selecionado
            APP.toolbar.transitionStart = stateId;
            node.addClass('transition-source');
            
            // Feedback visual forte
            document.body.style.cursor = 'crosshair';
            showNotification('✓ Estado origem selecionado! Clique no estado de destino', 'success', 3000);
            console.log('✅ Estado', stateId, 'marcado como origem');
        } else {
            // Segundo estado selecionado - criar transição
            const fromId = APP.toolbar.transitionStart;
            const toId = stateId;
            
            // Remover classe visual
            APP.canvas.cy.$(`#state-${fromId}`).removeClass('transition-source');
            document.body.style.cursor = 'default';
            
            // Prompt para símbolos
            const symbols = prompt('Digite os símbolos (separados por vírgula):', 'a');
            
            if (symbols !== null && symbols.trim() !== '') {
                const symbolArray = symbols.split(',').map(s => s.trim()).filter(s => s.length > 0);
                
                try {
                    const cmd = new AddTransitionCommand(APP.canvas, fromId, toId, symbolArray);
                    APP.undoRedo.execute(cmd);
                    showNotification(MESSAGES.SUCCESS.TRANSITION_CREATED, 'success', 2000);
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            } else {
                showNotification('Transição cancelada', 'warning', 1500);
            }
            
            // Reset
            APP.toolbar.transitionStart = null;
        }
    }
});

    // ===== CLIQUE DIREITO EM ESTADO (CONTEXT MENU) =====
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const stateNode = e.target.closest('.state-node');
        if (!stateNode) return;

        const stateId = parseInt(stateNode.getAttribute('data-id'));
        const state = APP.canvas.states.get(stateId);
        
        if (state && APP.contextModal) {
            APP.contextModal.open(stateId, e.clientX, e.clientY);
        } else {
            console.warn('Context modal não disponível ou estado não encontrado');
        }
    });

    // ===== CLIQUE EM TRANSIÇÃO (LABEL) =====
    canvas.addEventListener('click', (e) => {
        const transLabel = e.target.closest('.transition-label');
        if (!transLabel) return;

        const edge = transLabel.closest('.transition-edge');
        if (!edge) return;

        const fromId = parseInt(edge.getAttribute('data-from'));
        const toId = parseInt(edge.getAttribute('data-to'));
        const transition = APP.canvas.transitions.find(
            t => t.fromId === fromId && t.toId === toId
        );

        if (transition) {
            editTransition(transition);
        }
    });

    log('✅ Event listeners do canvas configurados', 'log');
}

/**
 * =====================================================
 * Inicializa UI do simulador
 * =====================================================
 */
function initializeSimulatorUI() {
    const simInput = document.getElementById('simInput');
    const simButton = document.getElementById('btnSimulate');
    const simOutput = document.getElementById('simOutput');

    if (simButton) {
        simButton.addEventListener('click', () => {
            const chain = simInput.value;
            runSimulation(chain);
        });
    }

    if (simInput) {
        simInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runSimulation(simInput.value);
            }
        });
    }
}

/**
 * =====================================================
 * Executa simulação de cadeia
 * =====================================================
 */
function runSimulation(chain) {
    // Validações
    if (APP.canvas.states.size === 0) {
        showNotification(MESSAGES.ERROR.NO_STATES, 'warning', 3000);
        return;
    }

    if (APP.canvas.initialState === null) {
        showNotification(MESSAGES.ERROR.NO_INITIAL_STATE, 'warning', 3000);
        return;
    }

    // Simular
    const result = APP.simulator.simulate(chain, APP.automataType);
    
    // Exibir resultado
    const simOutput = document.getElementById('simOutput');
    if (simOutput) {
        simOutput.textContent = APP.simulator.getResultDescription(result);
        simOutput.classList.add('show');
        simOutput.classList.remove('success', 'error');
        simOutput.classList.add(result.accepted ? 'success' : 'error');
    }

    // Log
    log(`Simulação: "${chain}" - ${result.accepted ? 'ACEITA ✓' : 'REJEITADA ✗'}`, 'log');
    
    // Notificação
    showNotification(
        result.message,
        result.accepted ? 'success' : 'error',
        3000
    );
}

/**
 * =====================================================
 * Atualiza sidebar com estado selecionado
 * =====================================================
 */
function updateSidebar(stateId) {
    const state = APP.canvas.states.get(stateId);
    if (!state) return;

    const selectedStateEl = document.getElementById('selected-state');
    if (selectedStateEl) {
        let statusText = [];
        if (state.isInitial) statusText.push('Inicial');
        if (state.isAccept) statusText.push('Aceitação');

        const statusStr = statusText.length > 0 ? ` • ${statusText.join(' • ')}` : '';
        selectedStateEl.innerHTML = `
            <strong style="color:#2196f3; font-size:14px;">${state.label}</strong>${statusStr}
            <div style="margin-top:8px; font-size:11px; color:#999;">
                💡 Clique direito para editar
            </div>
        `;
    }
}

/**
 * =====================================================
 * Edita transição (símbolos)
 * =====================================================
 */
function editTransition(transition) {
    const newSymbols = prompt(
        'Digite os símbolos (separados por vírgula):',
        transition.symbols.join(',')
    );

    if (newSymbols !== null) {
        const symbolArray = newSymbols.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (symbolArray.length === 0) {
            showNotification('Nenhum símbolo foi inserido', 'warning');
            return;
        }

        try {
            transition.setSymbols(symbolArray);
            APP.canvas.redraw();
            showNotification(MESSAGES.SUCCESS.TRANSITION_UPDATED, 'success', 2000);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
}

/**
 * =====================================================
 * LISTENERS DE EVENTOS CUSTOMIZADOS
 * =====================================================
 */

// Quando estado é salvo no context modal
window.addEventListener('contextmodal:stateSaved', (e) => {
    updateSidebar(e.detail.stateId);
    log(`Estado ${e.detail.stateId} salvo`, 'log');
});

// Quando estado é deletado no context modal
window.addEventListener('contextmodal:stateDeleted', (e) => {
    const selectedStateEl = document.getElementById('selected-state');
    if (selectedStateEl) {
        selectedStateEl.innerHTML = `
            Nenhum estado selecionado
            <div style="margin-top:8px; font-size:11px; color:#999;">
                💡 Clique direito em um estado para editar
            </div>
        `;
    }
    log(`Estado ${e.detail.stateId} deletado`, 'log');
});

// Quando transições são limpas
window.addEventListener('contextmodal:transitionsCleared', (e) => {
    if (APP.canvas.selectedState?.id === e.detail.stateId) {
        updateSidebar(e.detail.stateId);
    }
    log(`Transições do estado ${e.detail.stateId} limpas`, 'log');
});

// Quando zoom muda
window.addEventListener('zoom:changed', (e) => {
    // Atualizar label de zoom (já é feito automaticamente pelo ZoomPanManager)
    log(`Zoom: ${(e.detail.scale * 100).toFixed(0)}%`, 'log');
});

/**
 * =====================================================
 * INICIALIZAR APLICAÇÃO AO CARREGAR PÁGINA
 * =====================================================
 */
window.addEventListener('load', () => {
    console.log('🌐 Página carregada, iniciando aplicação...');
    initializeApp();
});

/**
 * =====================================================
 * DEBUG: Log de todas as funcionalidades disponíveis
 * =====================================================
 */
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('\n📊 AutomaLab - Funcionalidades Disponíveis:');
        console.log('✅ APP.canvas - Gerenciador do canvas');
        console.log('✅ APP.toolbar - Gerenciador da toolbar');
        console.log('✅ APP.simulator - Motor de simulação');
        console.log('✅ APP.storage - Gerenciador de storage');
        console.log('✅ APP.contextModal - Modal de contexto');
        console.log('✅ APP.dragDrop - Drag-and-drop');
        console.log('✅ APP.undoRedo - Sistema Undo/Redo');
        console.log('✅ APP.zoomPan - Zoom e Pan');
        console.log('\n⌨️  Atalhos de Teclado:');
        console.log('  Alt+S - Modo Selecionar');
        console.log('  Alt+A - Modo Adicionar Estado');
        console.log('  Alt+T - Modo Adicionar Transição');
        console.log('  Ctrl+Z - Desfazer');
        console.log('  Ctrl+Y - Refazer');
        console.log('  Ctrl++ - Zoom In');
        console.log('  Ctrl+- - Zoom Out');
        console.log('  Ctrl+0 - Reset Zoom');
        console.log('  Ctrl+E - Exportar');
        console.log('  Ctrl+I - Importar');
        console.log('  ESC - Cancelar / Fechar');
        console.log('\n🎨 Use APP.undoRedo.getUndoHistory() para ver histórico');
        console.log('');
    }, 200);
});