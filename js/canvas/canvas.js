class CanvasManager {
    constructor(canvasId = 'canvas') {
        this.canvas = document.getElementById(canvasId);
        this.states = new Map();
        this.transitions = [];
        this.selectedState = null;
        this.selectedTransition = null;
        this.initialState = null;
        this.nextStateId = 0;
        this.tempTransitionStart = null;
        this.tempTransitionPath = null;

        if (!this.canvas) {
            throw new Error(MESSAGES.ERROR.NO_CANVAS);
        }

        this._initEventListeners();
    }

    /**
     * Inicializa event listeners do canvas
     * @private
     */
    _initEventListeners() {
        // Clique para adicionar estado
        this.canvas.addEventListener('click', (e) => this._handleCanvasClick(e));

        // Clique direito para context menu
        this.canvas.addEventListener('contextmenu', (e) => this._handleContextMenu(e));

        // Mousemove para visualizar transição temporária
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    }

    /**
     * Cria um novo estado
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {string} label - Label do estado (opcional)
     * @returns {StateNode} Novo estado
     */
    addState(x, y, label = null) {
        const state = new StateNode(this.nextStateId, x, y);
        
        if (label) {
            state.label = label;
        } else {
            state.label = `q${this.nextStateId}`;
        }

        this.states.set(this.nextStateId, state);
        this.nextStateId++;

        this.redraw();
        this._dispatchEvent(EVENTS.CANVAS_STATE_CREATED, { state });
        
        return state;
    }

    /**
     * Remove um estado
     * @param {number} stateId - ID do estado
     */
    removeState(stateId) {
        if (!this.states.has(stateId)) return;

        // Remover transições relacionadas
        this.transitions = this.transitions.filter(
            t => t.fromId !== stateId && t.toId !== stateId
        );

        // Limpar estado inicial se necessário
        if (this.initialState === stateId) {
            this.initialState = null;
        }

        // Remover estado
        this.states.delete(stateId);
        
        if (this.selectedState?.id === stateId) {
            this.selectedState = null;
        }

        this.redraw();
        this._dispatchEvent(EVENTS.CANVAS_STATE_DELETED, { stateId });
    }

    /**
     * Atualiza um estado
     * @param {number} stateId - ID do estado
     * @param {Object} updates - Propriedades a atualizar
     */
    updateState(stateId, updates) {
        const state = this.states.get(stateId);
        if (!state) return;

        if (updates.label) state.setLabel(updates.label);
        if (updates.hasOwnProperty('isInitial')) {
            state.setInitial(updates.isInitial);
            if (updates.isInitial) {
                this.initialState = stateId;
            } else if (this.initialState === stateId) {
                this.initialState = null;
            }
        }
        if (updates.hasOwnProperty('isAccept')) state.setAccept(updates.isAccept);
        if (updates.hasOwnProperty('x') && updates.hasOwnProperty('y')) {
            state.setPosition(updates.x, updates.y);
        }

        this.redraw();
        this._dispatchEvent(EVENTS.CANVAS_STATE_UPDATED, { state });
    }

    /**
     * Cria uma nova transição
     * @param {number} fromId - ID do estado de origem
     * @param {number} toId - ID do estado de destino
     * @param {Array<string>} symbols - Símbolos da transição
     * @returns {TransitionEdge} Nova transição
     */
    addTransition(fromId, toId, symbols = []) {
        if (!this.states.has(fromId) || !this.states.has(toId)) {
            throw new Error('Estados inválidos para transição');
        }

        const transition = new TransitionEdge(fromId, toId, symbols);
        this.transitions.push(transition);

        this.redraw();
        this._dispatchEvent(EVENTS.CANVAS_TRANSITION_CREATED, { transition });

        return transition;
    }

    /**
     * Remove uma transição
     * @param {TransitionEdge} transition - Transição a remover
     */
    removeTransition(transition) {
        const index = this.transitions.indexOf(transition);
        if (index > -1) {
            this.transitions.splice(index, 1);
            this.redraw();
            this._dispatchEvent(EVENTS.CANVAS_TRANSITION_DELETED, { transition });
        }
    }

    /**
     * Limpa todo o canvas
     */
    clear() {
        this.states.clear();
        this.transitions = [];
        this.selectedState = null;
        this.selectedTransition = null;
        this.initialState = null;
        this.nextStateId = 0;
        this.tempTransitionStart = null;

        this.redraw();
        this._dispatchEvent(EVENTS.CANVAS_CLEARED);
    }

    /**
     * Redesenha todo o canvas
     */
    redraw() {
        // Limpar SVG
        const statesGroup = this.canvas.querySelector('g.states-group');
        const transitionsGroup = this.canvas.querySelector('g.transitions-group');

        if (statesGroup) statesGroup.remove();
        if (transitionsGroup) transitionsGroup.remove();

        // Criar novos grupos
        const newTransitionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newTransitionsGroup.setAttribute('class', 'transitions-group');
        this.canvas.appendChild(newTransitionsGroup);

        const newStatesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newStatesGroup.setAttribute('class', 'states-group');
        this.canvas.appendChild(newStatesGroup);

        // Desenhar transições
        this.transitions.forEach(t => {
            const el = t.draw(this.canvas, this.states);
            if (el) newTransitionsGroup.appendChild(el);
        });

        // Desenhar estados
        this.states.forEach(state => {
            const el = state.draw(this.canvas);
            if (el) newStatesGroup.appendChild(el);
        });

        this._updateStats();
    }

    /**
     * Obtém estado por coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {StateNode|null} Estado encontrado
     */
    getStateAt(x, y) {
        for (const state of this.states.values()) {
            if (state.contains(x, y)) {
                return state;
            }
        }
        return null;
    }

    /**
     * Obtém transição por coordenadas (aproximado)
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {TransitionEdge|null} Transição encontrada
     */
    getTransitionAt(x, y) {
        const elements = this.canvas.elementsFromPoint(x, y);
        for (const el of elements) {
            if (el.classList.contains('transition-label')) {
                const parent = el.closest('.transition-edge');
                if (parent) {
                    const fromId = parseInt(parent.getAttribute('data-from'));
                    const toId = parseInt(parent.getAttribute('data-to'));
                    return this.transitions.find(
                        t => t.fromId === fromId && t.toId === toId
                    );
                }
            }
        }
        return null;
    }

    /**
     * Seleciona um estado
     * @param {number} stateId - ID do estado
     */
    selectState(stateId) {
        if (this.selectedState) {
            this.selectedState.setSelected(false);
        }

        const state = this.states.get(stateId);
        if (state) {
            state.setSelected(true);
            this.selectedState = state;
            this._dispatchEvent(EVENTS.UI_STATE_SELECTED, { state });
        }
    }

    /**
     * Deseleciona estado selecionado
     */
    deselectState() {
        if (this.selectedState) {
            this.selectedState.setSelected(false);
            this.selectedState = null;
            this._dispatchEvent(EVENTS.UI_STATE_DESELECTED);
        }
    }

    /**
     * Exporta dados do canvas
     * @returns {Object} Dados do canvas
     */
    export() {
        return {
            states: Array.from(this.states.values()).map(s => s.toJSON()),
            transitions: this.transitions.map(t => t.toJSON()),
            initialState: this.initialState,
        };
    }

    /**
     * Importa dados para o canvas
     * @param {Object} data - Dados a importar
     */
    import(data) {
        this.clear();

        // Importar estados
        data.states.forEach(stateData => {
            const state = StateNode.fromJSON(stateData);
            this.states.set(state.id, state);
            this.nextStateId = Math.max(this.nextStateId, state.id + 1);
        });

        // Importar transições
        data.transitions.forEach(transData => {
            const transition = TransitionEdge.fromJSON(transData);
            this.transitions.push(transition);
        });

        // Importar estado inicial
        this.initialState = data.initialState;

        this.redraw();
    }

    /**
     * Atualiza estatísticas no header
     * @private
     */
    _updateStats() {
        const stateCountEl = document.getElementById('state-count');
        const transCountEl = document.getElementById('transition-count');

        if (stateCountEl) {
            stateCountEl.textContent = `Estados: ${this.states.size}`;
        }
        if (transCountEl) {
            transCountEl.textContent = `Transições: ${this.transitions.length}`;
        }
    }

    /**
     * Handler de clique no canvas
     * @private
     */
    _handleCanvasClick(e) {
        if (e.target !== this.canvas) return;

        const { x, y } = getCanvasCoords(e);
        const currentMode = APP?.currentMode || MODES.SELECT;

        if (currentMode === MODES.ADD_STATE) {
            this.addState(x, y);
        } else {
            this.deselectState();
        }
    }

    /**
     * Handler de context menu
     * @private
     */
    _handleContextMenu(e) {
        e.preventDefault();
        const state = this.getStateAt(...Object.values(getCanvasCoords(e)));
        if (state) {
            this._dispatchEvent('contextmenu:state', { state, event: e });
        }
    }

    /**
     * Handler de mouse move
     * @private
     */
    _handleMouseMove(e) {
        // Lógica para visualizar transição temporária
        // Será implementada conforme necessário
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