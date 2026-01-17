class CanvasManager {
    constructor(canvasId = 'canvas') {
        // Verificar se Cytoscape está disponível
        if (typeof cytoscape === 'undefined') {
            throw new Error('Cytoscape.js não está carregado! Adicione o script no HTML.');
        }

        // Inicializar Cytoscape
        this.cy = cytoscape({
            container: document.getElementById(canvasId),
            
            style: [
                // Estados (nodes)
                {
                    selector: 'node',
                    style: {
                        'background-color': '#e3f2fd',
                        'border-width': 2,
                        'border-color': '#2196f3',
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'width': 50,
                        'height': 50,
                        'font-size': 14,
                        'font-weight': 600,
                        'color': '#2c3e50',
                        'text-outline-width': 2,
                        'text-outline-color': 'white'
                    }
                },
                // Estado de aceitação (círculo duplo), verde claro com borda escura
                {
                    selector: 'node.accept',
                    style: {
                        'background-color': '#65ff78',
                        'border-color': '#177738',
                        'border-width': 6
                    }
                },
                // Estado inicial
                {
                    selector: 'node.initial',
                    style: {
                        'background-color': '#f0bb8b',
                        'border-color': '#733f0f',
                        'border-width': 3
                    }
                },
                // Estado destacado durante simulação (amarelo)
                {
                    selector: 'node.highlighted-state',
                    style: {
                        'background-color': '#fff59d',
                        'transition-property': 'background-color',
                        'transition-duration': '0.3s'
                    }
                },
                // Estado alcançado DIRETAMENTE (sem epsilon) - amarelo intenso
                {
                    selector: 'node.highlighted-direct-state',
                    style: {
                        'background-color': '#ffeb3b',
                        'border-color': '#f57f17',
                        'border-width': 4,
                        'transition-property': 'background-color, border-color, border-width',
                        'transition-duration': '0.3s'
                    }
                },
                // Estado alcançado por EPSILON-CLOSURE - azul escuro
                {
                    selector: 'node.highlighted-epsilon-state',
                    style: {
                        'background-color': '#64b5f6',
                        'border-color': '#1976d2',
                        'border-width': 3,
                        'transition-property': 'background-color, border-color, border-width',
                        'transition-duration': '0.3s'
                    }
                },
                // Estado selecionado
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 4,
                        'border-color': '#1976d2',
                        'background-color': '#bbdefb'
                    }
                },
                // Hover em estado
                {
                    selector: 'node:active',
                    style: {
                        'overlay-opacity': 0.2,
                        'overlay-color': '#2196f3'
                    }
                },
                // Transições (edges)
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#2196f3',
                        'target-arrow-color': '#2196f3',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier', // Curvas automáticas
                        'label': 'data(label)',
                        'text-rotation': 'autorotate',
                        'font-size': 12,
                        'text-background-color': 'white',
                        'text-background-opacity': 1,
                        'text-background-padding': 3,
                        'text-background-shape': 'roundrectangle'
                    }
                },
                // Transição selecionada
                {
                    selector: 'edge:selected',
                    style: {
                        'width': 3,
                        'line-color': '#1976d2',
                        'target-arrow-color': '#1976d2'
                    }
                },
                // Épsilon-transição (cor roxa/magenta)
                {
                    selector: 'edge.epsilon',
                    style: {
                        'line-color': '#9c27b0',
                        'target-arrow-color': '#9c27b0',
                        'line-style': 'dashed'
                    }
                },
                // Transição destacada durante simulação (NOVO!)
                {
                    selector: 'edge.highlighted-transition',
                    style: {
                        'width': 4,
                        'line-color': '#ff6f00',
                        'target-arrow-color': '#ff6f00',
                        'transition-property': 'line-color, target-arrow-color, width',
                        'transition-duration': '0.3s',
                        'z-index': 999
                    }
                },
                // Self-loop (transição para si mesmo)
                {
                    selector: 'edge.loop',
                    style: {
                        'curve-style': 'bezier',
                        'control-point-step-size': 40
                    }
                }
            ],
            
            // ===== CONFIGURAÇÕES =====
            layout: { name: 'preset' }, // Posições manuais
            userZoomingEnabled: true,   // Zoom com scroll
            userPanningEnabled: true,   // Pan com drag
            boxSelectionEnabled: true,  // Seleção múltipla com Shift
            minZoom: 0.3,
            maxZoom: 3
        });

        // Propriedades compatíveis com código antigo
        this.states = new Map(); // Mapa auxiliar (compatibilidade)
        this.transitions = [];   // Array auxiliar (compatibilidade)
        this.selectedState = null;
        this.selectedTransition = null;
        this.initialState = null;
        this.nextStateId = 0;
        this.tempTransitionStart = null;
        this.tempTransitionPath = null;
        this.snapToGrid = false; // Snap to Grid (default desligado)
        this.gridSize = 40;      // Tamanho da grade em pixels

        // Eventos
        this._initEventListeners();
        
        const container = this.cy.container();
        
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }, true);
        
        container.oncontextmenu = (e) => {
            e.preventDefault();
            return false;
        };
        
        // Desabilitar seleção
        container.style.userSelect = 'none';
        container.style.webkitUserSelect = 'none';
        container.style.mozUserSelect = 'none';
        
        console.log('CanvasManager inicializado');
    }

    _initEventListeners() {
        this.cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            console.log(`Transição clicada: ${edge.data('label')}`);
        });

        // Click no canvas vazio
        this.cy.on('tap', (evt) => {
            if (evt.target === this.cy) {
                const pos = evt.position;
                
                // Disparar evento
                window.dispatchEvent(new CustomEvent('canvas:clicked', {
                    detail: { x: pos.x, y: pos.y }
                }));
            }
        });

        // Drag (durante o arrasto) - atualizar seta em tempo real
        this.cy.on('drag', 'node', (evt) => {
            const node = evt.target;
            const stateId = node.data('stateId');
            // Atualizar posição da seta inicial em tempo real
            this.updateInitialArrowPosition(stateId);
        });

        // Drag end (quando solta um estado)
        this.cy.on('free', 'node', (evt) => {
            const node = evt.target;
            const stateId = node.data('stateId');
            
            // Snap to Grid se habilitado
            if (this.snapToGrid) {
                const pos = node.position();
                const snappedX = Math.round(pos.x / this.gridSize) * this.gridSize;
                const snappedY = Math.round(pos.y / this.gridSize) * this.gridSize;
                node.position({ x: snappedX, y: snappedY });
            }
            
            this._updateStateInMap(node);
            // Atualizar posição da seta inicial se for o estado inicial
            this.updateInitialArrowPosition(stateId);
            console.log(`Estado ${node.data('label')} movido`);
        });

        // Context menu (clique direito) - MÚLTIPLAS CAMADAS DE BLOQUEIO
        this.cy.on('cxttap', 'node', (evt) => {
            const node = evt.target;
            const stateId = node.data('stateId');
            
            // ✅ CAMADA 1: BLOQUEAR MENU NATIVO - IMEDIATAMENTE!
            if (evt.originalEvent) {
                evt.originalEvent.preventDefault();
                evt.originalEvent.stopPropagation();
                evt.originalEvent.stopImmediatePropagation();
            }
            
            // ✅ CAMADA 2: Prevenir evento do Cytoscape também
            evt.preventDefault();
            evt.stopPropagation();
            
            const originalEvent = evt.originalEvent;
            const clientX = originalEvent ? originalEvent.clientX : window.innerWidth / 2;
            const clientY = originalEvent ? originalEvent.clientY : window.innerHeight / 2;
            
            // ✅ CAMADA 3: Abrir context modal
            if (typeof APP !== 'undefined' && APP.contextModal) {
                APP.contextModal.open(stateId, clientX, clientY);
            }
            
            // ✅ RETORNAR FALSE EXPLICITAMENTE
            return false;
        });
        
        // Click em transição para editar
        this.cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            // Ignorar seta inicial
            if (edge.id() === 'initial-arrow') return;
            
            const fromId = edge.source().data('stateId');
            const toId = edge.target().data('stateId');
            
            // Abrir modal de edição
            if (typeof APP !== 'undefined' && APP.transitionModal) {
                APP.transitionModal.open(fromId, toId);
            }
        });
    }

    addState(x, y, label = null) {
        const stateId = this.nextStateId;
        const stateLabel = label || `q${stateId}`;
        
        // Snap to Grid se habilitado
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }
        
        // Adicionar no Cytoscape
        this.cy.add({
            group: 'nodes',
            data: {
                id: `state-${stateId}`,
                label: stateLabel,
                stateId: stateId,
                isInitial: false,
                isAccept: false
            },
            position: { x, y }
        });

        // Criar StateNode compatível
        const state = new StateNode(stateId, x, y);
        state.label = stateLabel;
        
        // Adicionar ao mapa (compatibilidade)
        this.states.set(stateId, state);
        this.nextStateId++;

        this._updateStats();
        this._dispatchEvent(EVENTS.CANVAS_STATE_CREATED, { state });
        
        return state;
    }

    removeState(stateId) {
        const node = this.cy.$(`#state-${stateId}`);
        if (node.length === 0) return;

        // Remover transições relacionadas do array auxiliar
        this.transitions = this.transitions.filter(
            t => t.fromId !== stateId && t.toId !== stateId
        );

        // Limpar estado inicial se necessário
        if (this.initialState === stateId) {
            this.removeInitialArrow();
            this.initialState = null;
        }

        // Remover do mapa
        this.states.delete(stateId);
        
        // Remover do Cytoscape (remove transições automaticamente!)
        node.remove();
        
        if (this.selectedState?.id === stateId) {
            this.selectedState = null;
        }

        this._updateStats();
        this._dispatchEvent(EVENTS.CANVAS_STATE_DELETED, { stateId });
    }

    updateState(stateId, updates) {
        const node = this.cy.$(`#state-${stateId}`);
        if (node.length === 0) return;

        // Atualizar label
        if (updates.label) {
            node.data('label', updates.label);
            const state = this.states.get(stateId);
            if (state) state.label = updates.label;
        }

        // Atualizar estado inicial
        if (updates.hasOwnProperty('isInitial')) {
            if (updates.isInitial) {
                // Remover seta inicial anterior
                this.removeInitialArrow();
                // Remover initial de outros estados
                this.cy.nodes('.initial').removeClass('initial').data('isInitial', false);
                node.addClass('initial').data('isInitial', true);
                this.initialState = stateId;
                // Adicionar seta inicial
                this.addInitialArrow(stateId);
            } else {
                node.removeClass('initial').data('isInitial', false);
                if (this.initialState === stateId) {
                    this.removeInitialArrow();
                    this.initialState = null;
                }
            }
            
            const state = this.states.get(stateId);
            if (state) state.isInitial = updates.isInitial;
        }

        // Atualizar estado de aceitação
        if (updates.hasOwnProperty('isAccept')) {
            if (updates.isAccept) {
                node.addClass('accept').data('isAccept', true);
            } else {
                node.removeClass('accept').data('isAccept', false);
            }
            
            const state = this.states.get(stateId);
            if (state) state.isAccept = updates.isAccept;
        }

        // Atualizar posição
        if (updates.hasOwnProperty('x') && updates.hasOwnProperty('y')) {
            node.position({ x: updates.x, y: updates.y });
            const state = this.states.get(stateId);
            if (state) {
                state.x = updates.x;
                state.y = updates.y;
            }
        }

        this._dispatchEvent(EVENTS.CANVAS_STATE_UPDATED, { 
            state: this.states.get(stateId) 
        });
    }

    /**
     * Cria uma nova transição
     * @param {number} fromId - ID do estado de origem
     * @param {number} toId - ID do estado de destino
     * @param {Array<string>} symbols - Símbolos da transição (pode ter múltiplos símbolos)
     * @returns {TransitionEdge} Nova transição
     */
    addTransition(fromId, toId, symbols = []) {
        if (!this.states.has(fromId) || !this.states.has(toId)) {
            throw new Error('Estados inválidos para transição');
        }

        // Cada símbolo cria um TransitionEdge separado (para export preciso)
        // MAS agrupa visualmente em uma única edge no Cytoscape
        const symbol = symbols[0]; // Apenas 1 símbolo por transição
        
        // Criar TransitionEdge individual (mantém transições separadas internamente)
        const transition = new TransitionEdge(fromId, toId, [symbol]);
        this.transitions.push(transition);

        // Verificar/atualizar edge visual agregada
        this._updateAggregatedEdge(fromId, toId);

        this._updateStats();
        this._updateAutomataTypeUI();
        this._dispatchEvent(EVENTS.CANVAS_TRANSITION_CREATED, { transition });
        
        return transition;
    }

    /**
     * Remove uma transição
     * @param {TransitionEdge} transition - Transição a remover
     */
    removeTransition(transition) {
        // Remover do array interno
        const index = this.transitions.indexOf(transition);
        if (index > -1) {
            this.transitions.splice(index, 1);
        }

        // Atualizar edge visual (pode ter outros símbolos)
        this._updateAggregatedEdge(transition.fromId, transition.toId);

        this._updateStats();
        this._updateAutomataTypeUI();
        this._dispatchEvent(EVENTS.CANVAS_TRANSITION_DELETED, { transition });
    }

    /**
     * Atualiza/cria edge visual agregada entre dois estados
     * Agrupa todas as transições entre fromId→toId em uma única edge
     * @param {number} fromId - ID do estado de origem
     * @param {number} toId - ID do estado de destino
     * @private
     */
    _updateAggregatedEdge(fromId, toId) {
        const edgeId = `edge-${fromId}-${toId}`;
        const existingEdge = this.cy.$(`#${edgeId}`);
        
        // Coletar todos os símbolos de transições entre estes estados
        const allSymbols = this.transitions
            .filter(t => t.fromId === fromId && t.toId === toId)
            .flatMap(t => t.symbols);
        
        if (allSymbols.length === 0) {
            // Nenhuma transição: remover edge se existir
            if (existingEdge.length > 0) {
                existingEdge.remove();
            }
            return;
        }
        
        // Remover duplicatas e ordenar
        const uniqueSymbols = [...new Set(allSymbols)].sort();
        const label = uniqueSymbols.join(',');
        
        // Detectar se contém épsilon
        const hasEpsilon = uniqueSymbols.some(s => s === 'ε' || s === 'ϵ');
        const classes = [];
        if (fromId === toId) classes.push('loop');
        if (hasEpsilon) classes.push('epsilon');
        
        if (existingEdge.length > 0) {
            // Atualizar edge existente
            existingEdge.data('label', label);
            existingEdge.data('symbols', uniqueSymbols);
            existingEdge.removeClass('epsilon loop');
            if (classes.length > 0) {
                existingEdge.addClass(classes.join(' '));
            }
        } else {
            // Criar nova edge
            this.cy.add({
                group: 'edges',
                data: {
                    id: edgeId,
                    source: `state-${fromId}`,
                    target: `state-${toId}`,
                    label: label,
                    symbols: uniqueSymbols,
                    fromId: fromId,
                    toId: toId
                },
                classes: classes.join(' ')
            });
        }
    }

    /**
     * Limpa todo o canvas
     */
    clear() {
        this.cy.elements().remove();
        this.states.clear();
        this.transitions = [];
        this.selectedState = null;
        this.selectedTransition = null;
        this.removeInitialArrow();
        this.initialState = null;
        this.nextStateId = 0;
        this.tempTransitionStart = null;

        this._updateStats();
        this._dispatchEvent(EVENTS.CANVAS_CLEARED);
    }

    /**
     * Redesenha todo o canvas
     * Com Cytoscape, não é necessário redesenhar manualmente,
     * mas mantemos por compatibilidade
     */
    redraw() {
        // Cytoscape atualiza automaticamente!
        // Mas sincronizamos o mapa auxiliar
        this._syncMapsFromCytoscape();
        this._updateStats();
    }

    /**
     * Obtém estado por coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {StateNode|null} Estado encontrado
     */
    getStateAt(x, y) {
        // Buscar nó na posição
        const nodes = this.cy.nodes();
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const pos = node.position();
            const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            
            if (dist <= 25) { // raio do estado
                return this.states.get(node.data('stateId'));
            }
        }
        return null;
    }

    /**
     * Obtém transição por coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {TransitionEdge|null} Transição encontrada
     */
    getTransitionAt(x, y) {
        // Com Cytoscape, usamos eventos de click
        // Este método mantido por compatibilidade
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
            
            // Selecionar no Cytoscape
            const node = this.cy.$(`#state-${stateId}`);
            if (node.length > 0) {
                this.cy.nodes().unselect();
                node.select();
            }
            
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
            this.cy.nodes().unselect();
            this._dispatchEvent(EVENTS.UI_STATE_DESELECTED);
        }
    }

    /**
     * Exporta dados do canvas
     * @returns {Object} Dados do canvas
     */
    export() {
        const states = [];
        const transitions = [];

        // Extrair estados do Cytoscape (excluindo nó auxiliar da seta inicial)
        this.cy.nodes().forEach(node => {
            const stateId = node.data('stateId');
            // Ignorar nó auxiliar da seta inicial
            if (stateId === undefined || node.id() === 'initial-arrow-start') return;
            
            const pos = node.position();
            states.push({
                id: stateId,
                label: node.data('label'),
                x: pos.x,
                y: pos.y,
                isInitial: node.data('isInitial') || false,
                isAccept: node.data('isAccept') || false
            });
        });

        // Extrair transições do Cytoscape (excluindo edge da seta inicial)
        this.cy.edges().forEach(edge => {
            // Ignorar edge da seta inicial
            if (edge.id() === 'initial-arrow') return;
            
            const sourceId = edge.source().data('stateId');
            const targetId = edge.target().data('stateId');
            transitions.push({
                fromId: sourceId,
                toId: targetId,
                symbols: edge.data('symbols') || []
            });
        });

        return {
            states,
            transitions,
            initialState: this.initialState,
        };
    }

    /**
     * Detecta automaticamente o tipo do autômato (AFD ou AFN)
     * @returns {string} 'dfa' ou 'nfa'
     */
    _detectAutomataType() {
        // Verificar épsilon-transições
        const hasEpsilon = this.transitions.some(t => 
            t.symbols.some(s => s === 'ε' || s === 'ϵ')
        );
        
        if (hasEpsilon) {
            return 'nfa'; // AFN com épsilon
        }
        
        // Verificar não-determinismo: múltiplas transições com mesmo (estado, símbolo)
        const transitionMap = new Map();
        
        for (const trans of this.transitions) {
            const fromId = trans.fromId;
            for (const symbol of trans.symbols) {
                const key = `${fromId}-${symbol}`;
                
                if (transitionMap.has(key)) {
                    return 'nfa'; // Múltiplas transições com mesmo símbolo = AFN
                }
                transitionMap.set(key, true);
            }
        }
        
        return 'dfa'; // Determinístico
    }

    /**
     * Atualiza o tipo detectado do autômato na UI
     */
    _updateAutomataTypeUI() {
        const detectedType = this._detectAutomataType();
        const dropdown = document.getElementById('automata-type');
        const statusIndicator = document.getElementById('automata-status');
        
        // Atualizar dropdown automaticamente para o tipo detectado
        if (dropdown && APP) {
            dropdown.value = detectedType;
            APP.automataType = detectedType;
        }
        
        // Atualizar indicador de status
        if (statusIndicator) {
            statusIndicator.style.color = '#4caf50';
            statusIndicator.title = detectedType === 'dfa' 
                ? '✓ Autômato Finito Determinístico' 
                : '✓ Autômato Finito Não-Determinístico';
            statusIndicator.textContent = '●';
        }
    }

    /**
     * Importa dados para o canvas
     * @param {Object} data - Dados a importar
     */
    import(data) {
        this.clear();

        // Importar estados
        data.states.forEach(stateData => {
            const stateId = stateData.id;
            this.nextStateId = Math.max(this.nextStateId, stateId + 1);
            
            // Adicionar no Cytoscape
            this.cy.add({
                group: 'nodes',
                data: {
                    id: `state-${stateId}`,
                    label: stateData.label,
                    stateId: stateId,
                    isInitial: stateData.isInitial,
                    isAccept: stateData.isAccept
                },
                position: { x: stateData.x, y: stateData.y },
                classes: [
                    stateData.isInitial ? 'initial' : '',
                    stateData.isAccept ? 'accept' : ''
                ].filter(Boolean).join(' ')
            });

            // Adicionar ao mapa auxiliar
            const state = StateNode.fromJSON(stateData);
            this.states.set(state.id, state);
        });

        // Importar transições
        data.transitions.forEach(transData => {
            // ✅ CORREÇÃO: Criar 1 TransitionEdge para cada símbolo
            // Cada TransitionEdge tem apenas 1 símbolo (arquitetura interna)
            // O Cytoscape agrupa visualmente em 1 edge
            transData.symbols.forEach(symbol => {
                this.addTransition(transData.fromId, transData.toId, [symbol]);
            });
        });

        // Importar estado inicial
        this.initialState = data.initialState;
        if (this.initialState !== null) {
            this.addInitialArrow(this.initialState);
        }

        this._updateStats();
    }

    // ===== MÉTODOS EXTRAS (NOVOS!) =====

    /**
     * Adiciona seta indicadora do estado inicial
     * @param {number} stateId - ID do estado inicial
     */
    addInitialArrow(stateId) {
        // Remover seta anterior se existir
        this.removeInitialArrow();
        
        const node = this.cy.$(`#state-${stateId}`);
        if (node.length === 0) return;
        
        const pos = node.position();
        
        // Criar nó invisível à esquerda
        const startNode = this.cy.add({
            group: 'nodes',
            data: { id: 'initial-arrow-start', label: '' },
            position: { x: pos.x - 80, y: pos.y },
            grabbable: false,
            selectable: false
        });
        
        // Aplicar estilo após adicionar - nó muito pequeno e transparente
        startNode.style({
            'width': 1,
            'height': 1,
            'background-opacity': 0,
            'border-width': 0
        });
        
        // Criar edge (seta) do nó invisível para o inicial
        const arrow = this.cy.add({
            group: 'edges',
            data: {
                id: 'initial-arrow',
                source: 'initial-arrow-start',
                target: `state-${stateId}`,
                label: ''
            },
            selectable: false
        });
        
        // Aplicar estilo após adicionar
        arrow.style({
            'width': 3,
            'line-color': '#4caf50',
            'target-arrow-color': '#4caf50',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        });
    }

    /**
     * Remove a seta indicadora do estado inicial
     */
    removeInitialArrow() {
        // Remover edge
        const arrow = this.cy.$('#initial-arrow');
        if (arrow.length > 0) {
            arrow.remove();
        }
        
        // Remover nó invisível
        const startNode = this.cy.$('#initial-arrow-start');
        if (startNode.length > 0) {
            startNode.remove();
        }
    }

    /**
     * Atualiza a posição da seta inicial quando o estado é movido
     * @param {number} stateId - ID do estado
     */
    updateInitialArrowPosition(stateId) {
        if (this.initialState !== stateId) return;
        
        const node = this.cy.$(`#state-${stateId}`);
        const startNode = this.cy.$('#initial-arrow-start');
        
        if (node.length > 0 && startNode.length > 0) {
            const pos = node.position();
            startNode.position({ x: pos.x - 80, y: pos.y });
        }
    }

    /**
     * Auto-layout - organiza estados automaticamente
     * @param {string} algorithm - 'breadthfirst', 'circle', 'grid', 'cose'
     */
    autoLayout(algorithm = 'breadthfirst') {
        this.cy.layout({
            name: algorithm,
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50
        }).run();
        
        // Atualizar posições no mapa auxiliar
        this._syncMapsFromCytoscape();
    }

    /**
     * Ajusta visualização para mostrar tudo
     */
    fitView() {
        this.cy.fit(null, 50);
    }

    /**
     * Exporta como PNG
     * @returns {Blob} Imagem PNG
     */
    exportAsPNG() {
        return this.cy.png({
            output: 'blob',
            bg: 'white',
            full: true,
            scale: 2
        });
    }

    /**
     * Centraliza em estado específico
     * @param {number} stateId - ID do estado
     */
    centerOnState(stateId) {
        const node = this.cy.$(`#state-${stateId}`);
        if (node.length > 0) {
            this.cy.animate({
                center: { eles: node },
                zoom: 1.5
            }, {
                duration: 500
            });
        }
    }

    _updateStats() {
        const stateCountEl = document.getElementById('state-count');
        const transCountEl = document.getElementById('transition-count');

        if (stateCountEl) {
            // Contar apenas estados reais (excluindo nó auxiliar)
            const realStatesCount = this.cy.nodes().filter(node => {
                return node.id() !== 'initial-arrow-start';
            }).length;
            stateCountEl.textContent = `Estados: ${realStatesCount}`;
        }
        if (transCountEl) {
            // Contar apenas transições reais (excluindo seta inicial)
            const realTransCount = this.cy.edges().filter(edge => {
                return edge.id() !== 'initial-arrow';
            }).length;
            transCountEl.textContent = `Transições: ${realTransCount}`;
        }
    }

    _nodeToState(node) {
        const pos = node.position();
        const stateId = node.data('stateId');
        
        let state = this.states.get(stateId);
        if (!state) {
            state = new StateNode(stateId, pos.x, pos.y);
            state.label = node.data('label');
            state.isInitial = node.data('isInitial') || false;
            state.isAccept = node.data('isAccept') || false;
            this.states.set(stateId, state);
        }
        
        return state;
    }

    _updateStateInMap(node) {
        const stateId = node.data('stateId');
        const state = this.states.get(stateId);
        if (state) {
            const pos = node.position();
            state.x = pos.x;
            state.y = pos.y;
        }
    }

    _syncMapsFromCytoscape() {
        // Atualizar posições dos estados
        this.cy.nodes().forEach(node => {
            this._updateStateInMap(node);
        });
    }

    _dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Handler de clique no canvas (mantido por compatibilidade)
     * @private
     */
    _handleCanvasClick(e) {
        // Tratado pelos eventos do Cytoscape
    }

    /**
     * Handler de context menu (mantido por compatibilidade)
     * @private
     */
    _handleContextMenu(e) {
        // Tratado pelos eventos do Cytoscape
    }

    /**
     * Handler de mouse move (mantido por compatibilidade)
     * @private
     */
    _handleMouseMove(e) {
        // Não necessário com Cytoscape
    }
}