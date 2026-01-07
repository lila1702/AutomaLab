class ToolbarManager {
    /**
     * Cria um novo gerenciador de toolbar
     * @param {CanvasManager} canvasManager - Gerenciador do canvas
     */
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.currentMode = MODES.SELECT;
        this.transitionStart = null;

        this._initEventListeners();
    }

    /**
     * Inicializa event listeners dos botões
     * @private
     */
    _initEventListeners() {
        // Botão: Selecionar
        const selectBtn = document.getElementById('select-state-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.setMode(MODES.SELECT));
        }

        // Botão: Adicionar Estado
        const addStateBtn = document.getElementById('add-state-btn');
        if (addStateBtn) {
            addStateBtn.addEventListener('click', () => this.setMode(MODES.ADD_STATE));
        }

        // Botão: Adicionar Transição
        const addTransitionBtn = document.getElementById('add-transition-btn');
        if (addTransitionBtn) {
            addTransitionBtn.addEventListener('click', () => {
                console.log('🔗 Botão de transição clicado!');
                this.setMode(MODES.ADD_TRANSITION);
            });
        }

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => this._handleKeyboardShortcuts(e));
    }

    /**
     * Define o modo de operação
     * @param {string} mode - Novo modo
     */
    setMode(mode) {
        // Remover classe active de todos os botões
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Adicionar classe active ao botão correto
        let buttonId;
        switch (mode) {
            case MODES.SELECT:
                buttonId = 'select-state-btn';
                break;
            case MODES.ADD_STATE:
                buttonId = 'add-state-btn';
                break;
            case MODES.ADD_TRANSITION:
                buttonId = 'add-transition-btn';
                break;
            default:
                return;
        }

        const btn = document.getElementById(buttonId);
        if (btn) btn.classList.add('active');

        // Limpar estado de transição se estava em progresso
        if ((this.transitionStart !== null && this.transitionStart !== undefined) && 
            this.canvas && this.canvas.cy) {
            this.canvas.cy.$(`#state-${this.transitionStart}`).removeClass('transition-source');
        }

        this.currentMode = mode;
        this.transitionStart = null;
        
        // Sincronizar com APP.currentMode
        if (typeof APP !== 'undefined') {
            APP.currentMode = mode;
        }

        // Mudar cursor do canvas
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.cursor = mode === MODES.ADD_STATE ? 'crosshair' : 
                                  mode === MODES.ADD_TRANSITION ? 'cell' :
                                  'default';
        }
        
        // Resetar cursor do body também
        document.body.style.cursor = 'default';

        console.log('🔧 Modo alterado para:', mode);

        // Disparar evento
        this._dispatchEvent(EVENTS.MODE_CHANGED, { mode });
    }

    /**
     * Inicia transição (clique em estado origem)
     * @param {number} stateId - ID do estado origem
     */
    startTransition(stateId) {
        if (this.currentMode !== MODES.ADD_TRANSITION) return;
        this.transitionStart = stateId;
        showNotification('Selecione o estado de destino', 'info', 2000);
    }

    /**
     * Completa transição (clique em estado destino)
     * @param {number} stateId - ID do estado destino
     */
    endTransition(stateId) {
        if (!this.transitionStart || this.currentMode !== MODES.ADD_TRANSITION) return;

        const symbols = prompt('Digite os símbolos da transição (separados por vírgula):');
        if (symbols !== null) {
            const symbolArray = symbols.split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            if (symbolArray.length === 0) {
                showNotification('Nenhum símbolo foi inserido', 'warning');
                return;
            }

            try {
                this.canvas.addTransition(this.transitionStart, stateId, symbolArray);
                showNotification(MESSAGES.SUCCESS.TRANSITION_CREATED, 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }

        this.transitionStart = null;
    }

    /**
     * Handler de exportação
     */
    handleExport() {
        if (this.canvas.states.size === 0) {
            showNotification('Nenhum autômato para exportar', 'warning');
            return;
        }

        const automataName = document.getElementById('automata-name')?.value || 'Autômato';
        const automataType = document.getElementById('automata-type')?.value || 'dfa';

        try {
            const jsonManager = new JSONManager(this.canvas);
            jsonManager.downloadAsFile(automataName, automataName, automataType);
            showNotification(MESSAGES.SUCCESS.AUTOMATA_EXPORTED, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    /**
     * Handler de importação
     */
    handleImport() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonManager = new JSONManager(this.canvas);
                    jsonManager.importFromJSON(event.target.result);
                    showNotification(MESSAGES.SUCCESS.AUTOMATA_IMPORTED, 'success');
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            };
            reader.readAsText(file);
        };

        fileInput.click();
    }

    /**
     * Handler de limpeza
     */
    async handleClear() {
        const confirmed = await showConfirmation(MESSAGES.CONFIRM.DELETE_ALL);
        if (confirmed) {
            this.canvas.clear();
            this.setMode(MODES.SELECT);
            showNotification(MESSAGES.SUCCESS.AUTOMATA_CLEARED, 'success');
        }
    }

    /**
     * Handler de atalhos de teclado
     * @private
     */
    _handleKeyboardShortcuts(e) {
        // Alt + S: Modo Selecionar
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            this.setMode(MODES.SELECT);
        }
        // Alt + A: Modo Adicionar Estado
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            this.setMode(MODES.ADD_STATE);
        }
        // Alt + T: Modo Adicionar Transição
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            this.setMode(MODES.ADD_TRANSITION);
        }
        // Ctrl + E: Exportar
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.handleExport();
        }
        // Ctrl + I: Importar
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            this.handleImport();
        }
    }

    /**
     * Dispara evento customizado
     * @private
     */
    _dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
}