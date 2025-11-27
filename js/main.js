// ===== ESTADO GLOBAL DA APLICAÇÃO =====
const APP = {
    canvas: null,
    toolbar: null,
    simulator: null,
    storage: null,
    contextModal: null,
    currentMode: MODES.SELECT,
    automataType: 'dfa',
    automataName: 'Autômato 1',
};

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    try {
        // Criar gerenciadores
        APP.canvas = new CanvasManager('canvas');
        APP.toolbar = new ToolbarManager(APP.canvas);
        APP.simulator = new Simulator(APP.canvas);
        APP.storage = new JSONManager(APP.canvas);
        
        // Context Modal deve ser criado APÓS os elementos estarem no DOM
        wait(100).then(() => {
            APP.contextModal = new ContextModalManager(APP.canvas);
            log('Context Modal inicializado', 'log');
        });

        // Inicializar UI
        initializeUI();

        // Inicializar event listeners do canvas
        initializeCanvasEventListeners();

        // Inicializar simulador UI
        initializeSimulatorUI();

        // Definir modo inicial
        APP.toolbar.setMode(MODES.SELECT);

        log('Aplicação inicializada com sucesso', 'log');
        showNotification('Bem-vindo ao AutomaLab!', 'success', 2000);

    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Inicializa elementos da UI
 */
function initializeUI() {
    // Input: Nome do autômato
    const automataNameInput = document.getElementById('automata-name');
    if (automataNameInput) {
        automataNameInput.addEventListener('change', (e) => {
            APP.automataName = e.target.value;
        });
    }

    // Select: Tipo do autômato
    const automataTypeSelect = document.getElementById('automata-type');
    if (automataTypeSelect) {
        automataTypeSelect.addEventListener('change', (e) => {
            APP.automataType = e.target.value;
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
 * Inicializa event listeners do canvas
 */
function initializeCanvasEventListeners() {
    const canvas = document.getElementById('canvas');

    // Clique no canvas
    canvas.addEventListener('click', (e) => {
        if (e.target !== canvas) return;

        const { x, y } = getCanvasCoords(e);
        const mode = APP.toolbar.currentMode;

        if (mode === MODES.ADD_STATE) {
            try {
                APP.canvas.addState(x, y);
                showNotification(MESSAGES.SUCCESS.STATE_CREATED, 'success', 1500);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });

    // Clique em estado
    canvas.addEventListener('click', (e) => {
        const stateNode = e.target.closest('.state-node');
        if (!stateNode) return;

        const stateId = parseInt(stateNode.getAttribute('data-id'));
        const mode = APP.toolbar.currentMode;

        if (mode === MODES.SELECT) {
            APP.canvas.selectState(stateId);
            updateSidebar(stateId);
        } else if (mode === MODES.ADD_TRANSITION) {
            if (APP.toolbar.transitionStart === null) {
                APP.toolbar.startTransition(stateId);
            } else {
                APP.toolbar.endTransition(stateId);
            }
        }
    });

    // Clique direito em estado
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        console.log('Context menu triggered', e.target);
        
        const stateNode = e.target.closest('.state-node');
        console.log('State node found:', stateNode);
        
        if (!stateNode) return;

        const stateId = parseInt(stateNode.getAttribute('data-id'));
        console.log('State ID:', stateId);
        
        const state = APP.canvas.states.get(stateId);
        console.log('State:', state);
        
        if (state && APP.contextModal) {
            console.log('Opening context modal');
            APP.contextModal.open(stateId, e.clientX, e.clientY);
        } else {
            console.warn('Context modal não está inicializado ou estado não encontrado');
        }
    });

    // Clique em transição
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
}

/**
 * Inicializa UI do simulador
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
 * Executa simulação
 */
function runSimulation(chain) {
    if (APP.canvas.states.size === 0) {
        showNotification(MESSAGES.ERROR.NO_STATES, 'warning');
        return;
    }

    if (APP.canvas.initialState === null) {
        showNotification(MESSAGES.ERROR.NO_INITIAL_STATE, 'warning');
        return;
    }

    const result = APP.simulator.simulate(chain, APP.automataType);
    
    const simOutput = document.getElementById('simOutput');
    if (simOutput) {
        simOutput.textContent = APP.simulator.getResultDescription(result);
        simOutput.classList.add('show');
        simOutput.classList.toggle('success', result.accepted);
        simOutput.classList.toggle('error', !result.accepted);
    }

    log(`Simulação: cadeia "${chain}" - ${result.accepted ? 'ACEITA' : 'REJEITADA'}`, 'log');
}

/**
 * Atualiza sidebar com estado selecionado
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
            <strong>${state.label}</strong>${statusStr}
            <div style="margin-top: 8px; font-size: 11px; color: #999;">
                Clique direito para editar
            </div>
        `;
    }
}

/**
 * Listener para quando estado é salvo no context modal
 */
window.addEventListener('contextmodal:stateSaved', (e) => {
    updateSidebar(e.detail.stateId);
});

/**
 * Listener para quando estado é deletado no context modal
 */
window.addEventListener('contextmodal:stateDeleted', (e) => {
    const selectedStateEl = document.getElementById('selected-state');
    if (selectedStateEl) {
        selectedStateEl.textContent = 'Selecione um estado';
    }
});

/**
 * Listener para quando transições são limpas
 */
window.addEventListener('contextmodal:transitionsCleared', (e) => {
    // Atualizar sidebar se necessário
    if (APP.canvas.selectedState?.id === e.detail.stateId) {
        updateSidebar(e.detail.stateId);
    }
});

/**
 * Edita transição
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

        transition.setSymbols(symbolArray);
        APP.canvas.redraw();
        showNotification(MESSAGES.SUCCESS.TRANSITION_UPDATED, 'success');
    }
}

/**
 * Inicializa context modal
 */
function initializeContextModal() {
    const overlay = document.getElementById('context-overlay');
    const closeBtn = document.getElementById('context-modal-close');

    if (overlay) {
        overlay.addEventListener('click', closeContextModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeContextModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContextModal();
        }
    });
}

// ===== INICIAR APLICAÇÃO AO CARREGAR =====
window.addEventListener('load', initializeApp);