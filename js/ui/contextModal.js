class ContextModalManager {
    /**
     * Cria um novo gerenciador de context modal
     * @param {CanvasManager} canvasManager - Gerenciador do canvas
     */
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.currentStateId = null;
        this.modal = document.getElementById('context-modal');
        this.overlay = document.getElementById('context-overlay');
        this.isOpen = false;
        this.elements = {};

        if (!this.modal || !this.overlay) {
            console.warn('Context modal ou overlay não encontrados no DOM');
            return;
        }

        this._cacheElements();
        this._initEventListeners();
    }

    /**
     * Cache dos elementos do DOM
     * @private
     */
    _cacheElements() {
        this.elements = {
            // Header
            close: document.getElementById('context-modal-close'),
            
            // Inputs
            stateName: document.getElementById('context-state-input-name'),
            stateInitial: document.getElementById('context-state-initial'),
            stateAccept: document.getElementById('context-state-accept'),
            
            // Hints
            initialHint: document.getElementById('context-initial-hint'),
            acceptHint: document.getElementById('context-accept-hint'),
            
            // Info
            selectedInfo: document.getElementById('context-selected-info'),
            selectedInfoName: document.getElementById('context-state-name'),
            selectedInfoStatus: document.getElementById('context-state-status'),
            
            // Buttons
            save: document.getElementById('context-modal-save'),
            cancel: document.getElementById('context-modal-cancel'),
            delete: document.getElementById('context-delete-state'),
            clearTransitions: document.getElementById('context-clear-transitions'),
        };

        // Validar se todos os elementos foram encontrados
        const missingElements = Object.entries(this.elements)
            .filter(([key, el]) => !el)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.warn('Elementos do context modal não encontrados:', missingElements);
        }
    }

    /**
     * Inicializa event listeners
     * @private
     */
    _initEventListeners() {
        // Validar se elementos foram cacheados
        if (!this.elements || Object.keys(this.elements).length === 0) {
            console.warn('Elementos do context modal não foram cacheados corretamente');
            return;
        }

        // Fechar ao clicar na overlay
        this.overlay.addEventListener('click', () => this.close());

        // Fechar ao clicar no botão X
        if (this.elements.close) {
            this.elements.close.addEventListener('click', () => this.close());
        }

        // Fechar ao clicar em Cancelar
        if (this.elements.cancel) {
            this.elements.cancel.addEventListener('click', () => this.close());
        }

        // Salvar
        if (this.elements.save) {
            this.elements.save.addEventListener('click', () => this._handleSave());
        }

        // Deletar
        if (this.elements.delete) {
            this.elements.delete.addEventListener('click', () => this._handleDelete());
        }

        // Limpar transições
        if (this.elements.clearTransitions) {
            this.elements.clearTransitions.addEventListener('click', () => this._handleClearTransitions());
        }

        // Mostrar/ocultar hints
        if (this.elements.stateInitial) {
            this.elements.stateInitial.addEventListener('change', () => this._updateHints());
        }

        if (this.elements.stateAccept) {
            this.elements.stateAccept.addEventListener('change', () => this._updateHints());
        }

        // Fechar com Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Abre o modal com dados do estado
     * @param {number} stateId - ID do estado
     * @param {number} x - Posição X para abrir
     * @param {number} y - Posição Y para abrir
     */
    open(stateId, x, y) {
        // Validar se canvas está disponível
        if (!this.canvas || !this.canvas.states) {
            console.error('Canvas não está inicializado');
            return;
        }

        const state = this.canvas.states.get(stateId);
        if (!state) {
            console.error('Estado não encontrado:', stateId);
            return;
        }

        // Validar se elementos estão disponíveis
        if (!this.elements.stateName || !this.elements.stateInitial || !this.elements.stateAccept) {
            console.error('Elementos do modal não foram cacheados corretamente');
            return;
        }

        this.currentStateId = stateId;

        // Preencher inputs
        this.elements.stateName.value = state.label;
        this.elements.stateInitial.checked = state.isInitial;
        this.elements.stateAccept.checked = state.isAccept;

        // Atualizar info
        this._updateInfo(state);

        // Atualizar hints
        this._updateHints();

        // Posicionar modal
        this._positionModal(x, y);

        // Mostrar
        this.overlay.classList.add('active');
        this.modal.classList.add('active');
        this.isOpen = true;

        // Dar foco no input
        if (this.elements.stateName) {
            this.elements.stateName.focus();
            this.elements.stateName.select();
        }

        this._dispatchEvent(EVENTS.MODAL_OPENED, { stateId });
    }

    /**
     * Fecha o modal
     */
    close() {
        this.overlay.classList.remove('active');
        this.modal.classList.remove('active');
        this.isOpen = false;
        this.currentStateId = null;

        this._dispatchEvent(EVENTS.MODAL_CLOSED);
    }

    /**
     * Atualiza informações do estado no modal
     * @private
     */
    _updateInfo(state) {
        // Validar se elementos existem
        if (!this.elements.selectedInfoName || !this.elements.selectedInfoStatus) {
            console.warn('Elementos de info não encontrados');
            return;
        }

        this.elements.selectedInfoName.textContent = `Estado: ${state.label}`;

        let status = [];
        if (state.isInitial) status.push('Inicial');
        if (state.isAccept) status.push('Aceitação');

        this.elements.selectedInfoStatus.textContent = status.length > 0
            ? status.join(' • ')
            : 'Estado normal';

        // Mostrar info
        if (this.elements.selectedInfo) {
            this.elements.selectedInfo.classList.add('show');
        }
    }

    /**
     * Atualiza visibilidade dos hints
     * @private
     */
    _updateHints() {
        // Validar se elementos existem
        if (!this.elements.initialHint || !this.elements.acceptHint) {
            console.warn('Elementos de hints não encontrados');
            return;
        }

        const showInitialHint = this.elements.stateInitial?.checked || false;
        const showAcceptHint = this.elements.stateAccept?.checked || false;

        this.elements.initialHint.style.display = showInitialHint ? 'flex' : 'none';
        this.elements.acceptHint.style.display = showAcceptHint ? 'flex' : 'none';
    }

    /**
     * Posiciona o modal na tela
     * @private
     */
    _positionModal(x, y) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = 280;
        const modalHeight = this.modal.offsetHeight || 400;

        let left = x;
        let top = y;

        // Se sair da direita
        if (left + modalWidth > viewportWidth) {
            left = viewportWidth - modalWidth - 10;
        }

        // Se sair de baixo
        if (top + modalHeight > viewportHeight) {
            top = viewportHeight - modalHeight - 10;
        }

        // Padding mínimo das bordas
        left = Math.max(10, left);
        top = Math.max(10, top);

        this.modal.style.left = left + 'px';
        this.modal.style.top = top + 'px';
    }

    /**
     * Handler de salvamento
     * @private
     */
    _handleSave() {
        // Validar estado
        if (!this.currentStateId && this.currentStateId !== 0) {
            showNotification('Nenhum estado selecionado', 'error');
            return;
        }

        // Validar elemento
        if (!this.elements.stateName) {
            console.error('Elemento stateName não encontrado');
            return;
        }

        const newName = this.elements.stateName.value.trim();
        const newInitial = this.elements.stateInitial?.checked || false;
        const newAccept = this.elements.stateAccept?.checked || false;

        // Validação
        if (!newName) {
            this._shakeModal();
            showNotification('Nome do estado não pode ser vazio', 'warning');
            return;
        }

        if (!isValidStateName(newName)) {
            this._shakeModal();
            showNotification('Nome de estado inválido. Use apenas letras, números e underscore', 'warning');
            return;
        }

        try {
            // Atualizar estado
            this.canvas.updateState(this.currentStateId, {
                label: newName,
                isInitial: newInitial,
                isAccept: newAccept,
            });

            showNotification(MESSAGES.SUCCESS.STATE_UPDATED, 'success');
            this._dispatchEvent('contextmodal:stateSaved', {
                stateId: this.currentStateId,
                state: {
                    label: newName,
                    isInitial: newInitial,
                    isAccept: newAccept,
                },
            });

            this.close();
        } catch (error) {
            this._shakeModal();
            showNotification(error.message, 'error');
        }
    }

    /**
     * Handler de deleção
     * @private
     */
    async _handleDelete() {
        const state = this.canvas.states.get(this.currentStateId);
        if (!state) return;

        const confirmed = await showConfirmation(
            `${MESSAGES.CONFIRM.DELETE_STATE}\n\nEstado: ${state.label}`
        );

        if (confirmed) {
            try {
                this.canvas.removeState(this.currentStateId);
                showNotification(MESSAGES.SUCCESS.STATE_DELETED, 'success');
                this._dispatchEvent('contextmodal:stateDeleted', {
                    stateId: this.currentStateId,
                });
                this.close();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    }

    /**
     * Handler de limpeza de transições
     * @private
     */
    async _handleClearTransitions() {
        const state = this.canvas.states.get(this.currentStateId);
        if (!state) return;

        const confirmed = await showConfirmation(
            `${MESSAGES.CONFIRM.CLEAR_TRANSITIONS}\n\nEstado: ${state.label}`
        );

        if (confirmed) {
            try {
                // Remover transições relacionadas
                this.canvas.transitions = this.canvas.transitions.filter(
                    t => t.fromId !== this.currentStateId && t.toId !== this.currentStateId
                );

                this.canvas.redraw();
                showNotification('Transições limpas com sucesso', 'success');
                this._dispatchEvent('contextmodal:transitionsCleared', {
                    stateId: this.currentStateId,
                });
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    }

    /**
     * Faz o modal tremular
     * @private
     */
    _shakeModal() {
        this.modal.classList.add('shake');
        setTimeout(() => {
            this.modal.classList.remove('shake');
        }, 300);
    }

    /**
     * Valida se modal está aberto
     * @returns {boolean} True se aberto
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Obtém estado atual do modal
     * @returns {Object} Estado atual
     */
    getCurrentState() {
        if (!this.currentStateId && this.currentStateId !== 0) return null;

        return {
            stateId: this.currentStateId,
            name: this.elements.stateName?.value || '',
            isInitial: this.elements.stateInitial?.checked || false,
            isAccept: this.elements.stateAccept?.checked || false,
        };
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