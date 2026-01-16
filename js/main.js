// Bloqueio do menu contextual nativo
window.addEventListener('contextmenu', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}, true);

// Estado global da aplicação
const APP = {
    canvas: null,
    toolbar: null,
    simulator: null,
    storage: null,
    contextModal: null,
    dragDrop: null,
    undoRedo: null,
    zoomPan: null,
    tapeManager: null,
    transitionModal: null,
    validator: null,
    exportUtils: null,
    converter: null,
    currentMode: MODES.SELECT,
    automataType: 'dfa',
    automataName: 'Autômato 1',
};

function initializeApp() {
    try {
        console.log('Iniciando AutomaLab...');

        // Bloquear menu contextual no canvas
        window.addEventListener('contextmenu', (e) => {
            const canvas = document.getElementById('canvas');
            if (canvas && (e.target === canvas || canvas.contains(e.target))) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);

        APP.canvas = new CanvasManager('canvas');
        APP.toolbar = new ToolbarManager(APP.canvas);
        APP.simulator = new Simulator(APP.canvas);
        APP.storage = new JSONManager(APP.canvas);

        // Undo/Redo
        APP.undoRedo = new UndoRedoManager(APP.canvas, 50);
        
        // TapeManager (após criar simulator)
        APP.tapeManager = new TapeManager(APP.simulator);
        
        // Validator, ExportUtils e Converter
        APP.validator = new AutomataValidator(APP.canvas);
        APP.exportUtils = new ExportUtils(APP.canvas, APP.simulator);
        APP.converter = new AutomataConverter(APP.canvas, APP.simulator);

        wait(100).then(() => {
            APP.contextModal = new ContextModalManager(APP.canvas);
            APP.transitionModal = new TransitionModalManager(APP.canvas);
        });

        initializeUI();
        initializeCanvasEventListeners();
        initializeSimulatorUI();
        initializeNewFeatures();

        APP.toolbar.setMode(MODES.SELECT);
        showNotification('Bem-vindo ao AutomaLab!', 'success', 2000);

    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification(`Erro: ${error.message}`, 'error', 5000);
    }
}

function initializeNewFeatures() {
    // Botões de Zoom
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
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.zoom(cy.zoom() * 0.8);
            cy.center();
            updateZoomLabel();
        });
    }

    if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.zoom(1);
            cy.center();
            updateZoomLabel();
        });
    }

    if (btnFitContent) {
        btnFitContent.addEventListener('click', () => {
            const cy = APP.canvas.cy;
            cy.fit(null, 50);
            updateZoomLabel();
        });
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

    // Botões Undo/Redo
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            APP.undoRedo.undo();
        });
    }

    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            APP.undoRedo.redo();
        });
    }

    // Snap to Grid
    const snapToGridCheckbox = document.getElementById('snap-to-grid');
    if (snapToGridCheckbox) {
        snapToGridCheckbox.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            APP.canvas.snapToGrid = enabled;
            showNotification(
                `Snap to Grid: ${enabled ? 'Ativado' : 'Desativado'}`,
                'success',
                1500
            );
        });
    }

    // Mostrar/ocultar grade
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
    }

    // ESC para cancelar transição
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && APP.toolbar && 
            (APP.toolbar.transitionStart !== null && APP.toolbar.transitionStart !== undefined)) {
            APP.canvas.cy.$(`#state-${APP.toolbar.transitionStart}`).removeClass('transition-source');
            APP.toolbar.transitionStart = null;
            document.body.style.cursor = 'default';
            showNotification('Transição cancelada', 'info', 1500);
        }
    });
    
    // ===== ATALHOS DE TECLADO ADICIONAIS =====
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+E: Exportar PNG
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            APP.exportUtils.exportAsPNG(APP.automataName || 'automato');
            showNotification('📸 PNG exportado!', 'success', 2000);
        }
        
        // Ctrl+Shift+V: Validar
        else if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            APP.validator.showReport();
        }
        
        // Ctrl+G: Toggle Grid
        else if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            const canvas = document.getElementById('canvas');
            const showGridCheckbox = document.getElementById('show-grid');
            if (canvas && showGridCheckbox) {
                showGridCheckbox.checked = !showGridCheckbox.checked;
                canvas.classList.toggle('hide-grid');
                showNotification(
                    `Grade: ${showGridCheckbox.checked ? 'Visível' : 'Oculta'}`,
                    'info',
                    1500
                );
            }
        }
        
        // Ctrl+Shift+S: Snap to Grid Toggle
        else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            const snapCheckbox = document.getElementById('snap-to-grid');
            if (snapCheckbox) {
                snapCheckbox.checked = !snapCheckbox.checked;
                APP.canvas.snapToGrid = snapCheckbox.checked;
                showNotification(
                    `Snap to Grid: ${snapCheckbox.checked ? 'Ativado' : 'Desativado'}`,
                    'success',
                    1500
                );
            }
        }
        
        // Alt+S, Alt+A, Alt+T: Mudar modos (já existentes em outros lugares, mas reforçando)
        else if (e.altKey && e.key === 's') {
            e.preventDefault();
            APP.toolbar.setMode(MODES.SELECT);
        }
        else if (e.altKey && e.key === 'a') {
            e.preventDefault();
            APP.toolbar.setMode(MODES.ADD_STATE);
        }
        else if (e.altKey && e.key === 't') {
            e.preventDefault();
            APP.toolbar.setMode(MODES.ADD_TRANSITION);
        }
        
        // F: Fit View (ajustar visualização)
        else if (e.key === 'f' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            const activeElement = document.activeElement;
            // Só executar se não estiver em input/textarea
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                APP.canvas.fitView();
                showNotification('🔍 Visualização ajustada', 'info', 1500);
            }
        }
    });
}

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

    // Novos botões de exportação
    const btnExportPNG = document.getElementById('btn-export-png');
    if (btnExportPNG) {
        btnExportPNG.addEventListener('click', () => {
            APP.exportUtils.exportAsPNG(APP.automataName || 'automato');
        });
    }

    const btnExportSimulation = document.getElementById('btn-export-simulation');
    if (btnExportSimulation) {
        btnExportSimulation.addEventListener('click', () => {
            APP.exportUtils.downloadStepByStepText(APP.automataName || 'simulacao');
        });
    }

    // Validação
    const btnValidate = document.getElementById('btn-validate');
    if (btnValidate) {
        btnValidate.addEventListener('click', () => {
            const report = APP.validator.generateReport();
            console.log(report);
            APP.validator.showReport();
        });
    }

    // Conversão AFN→AFD
    const btnConvertDfa = document.getElementById('btn-convert-dfa');
    if (btnConvertDfa) {
        btnConvertDfa.addEventListener('click', () => {
            if (confirm('Converter AFN em AFD? O autômato atual será substituído.')) {
                APP.converter.applyConversion();
            }
        });
    }
}

function initializeCanvasEventListeners() {
    const canvas = document.getElementById('canvas');

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

APP.canvas.cy.on('tap', 'node', (evt) => {
    const mode = APP.toolbar ? APP.toolbar.currentMode : APP.currentMode;
    const node = evt.target;
    const stateId = node.data('stateId');
    
    // Modo SELECT: atualizar sidebar
    if (mode === MODES.SELECT) {
        APP.canvas.selectState(stateId);
        if (typeof updateSidebar === 'function') {
            updateSidebar(stateId);
        }
        return;
    }
    
    if (mode === MODES.ADD_TRANSITION) {
        if (APP.toolbar.transitionStart === null || APP.toolbar.transitionStart === undefined) {
            APP.toolbar.transitionStart = stateId;
            node.addClass('transition-source');
            document.body.style.cursor = 'crosshair';
            showNotification('Estado origem selecionado! Clique no estado de destino', 'success', 3000);
        } else {
            const fromId = APP.toolbar.transitionStart;
            const toId = stateId;
            
            // Remover classe visual
            APP.canvas.cy.$(`#state-${fromId}`).removeClass('transition-source');
            document.body.style.cursor = 'default';
            
            // Reset transitionStart
            APP.toolbar.transitionStart = null;
            
            // Abrir modal para editar símbolos
            if (APP.transitionModal) {
                APP.transitionModal.open(fromId, toId);
            } else {
                // Fallback: prompt nativo
                const symbols = prompt('Digite os símbolos (separados por vírgula).\nPara épsilon, digite: epsilon, eps ou e', 'a');
                
                if (symbols !== null && symbols.trim() !== '') {
                    const symbolArray = parseSymbols(symbols);
                    
                    if (symbolArray.length === 0) {
                        showNotification('Nenhum símbolo válido foi inserido', 'warning', 1500);
                    } else {
                        try {
                            const cmd = new AddTransitionCommand(APP.canvas, fromId, toId, symbolArray);
                            APP.undoRedo.execute(cmd);
                            showNotification(MESSAGES.SUCCESS.TRANSITION_CREATED, 'success', 2000);
                        } catch (error) {
                            showNotification(error.message, 'error');
                        }
                    }
                } else {
                    showNotification('Transição cancelada', 'warning', 1500);
                }
            }
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

function initializeSimulatorUI() {
    const simInput = document.getElementById('simInput');
    const simButton = document.getElementById('btnSimulate');
    const simOutput = document.getElementById('simOutput');

    if (simButton) {
        simButton.addEventListener('click', () => {
            const chain = simInput.value;
            runSimulation(chain, true); // Simulação com animação
        });
    }

    if (simInput) {
        simInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runSimulation(simInput.value, true); // Simulação com animação
            }
        });
    }
}

function runSimulation(chain, animated = false) {
    console.log('🎯 runSimulation chamado:', { chain, animated });
    
    // Validações
    if (APP.canvas.states.size === 0) {
        showNotification(MESSAGES.ERROR.NO_STATES, 'warning', 3000);
        return;
    }

    if (APP.canvas.initialState === null) {
        showNotification(MESSAGES.ERROR.NO_INITIAL_STATE, 'warning', 3000);
        return;
    }

    // Simular - detectar tipo automaticamente
    const detectedType = APP.canvas._detectAutomataType();
    const result = APP.simulator.simulate(chain, detectedType);
    console.log('📊 Resultado da simulação:', result);
    
    // Modo animado
    if (animated && result.steps && result.steps.length > 0) {
        console.log('🎬 Iniciando modo animado...');
        APP.tapeManager.initialize(chain, result.steps);
        showNotification('🎬 Simulação iniciada! Use os controles da fita.', 'info', 3000);
        return;
    }
    
    // Modo instantâneo (existente)
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

function editTransition(transition) {
    const newSymbols = prompt(
        'Digite os símbolos (separados por vírgula).\nPara épsilon, digite: epsilon, eps ou e',
        transition.symbols.join(',')
    );

    if (newSymbols !== null) {
        const symbolArray = parseSymbols(newSymbols);

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

window.addEventListener('load', () => {
    initializeApp();
});