class TransitionEdge {
    /**
     * Cria uma nova transição
     * @param {number} fromId - ID do estado de origem
     * @param {number} toId - ID do estado de destino
     * @param {Array<string>} symbols - Array de símbolos
     */
    constructor(fromId, toId, symbols = []) {
        this.fromId = fromId;
        this.toId = toId;
        this.symbols = symbols || [];
        this.element = null;
        this.isSelected = false;
    }

    /**
     * Adiciona símbolo à transição
     * @param {string} symbol - Símbolo a adicionar
     */
    addSymbol(symbol) {
        if (!isValidSymbol(symbol) && symbol !== '') {
            throw new Error(MESSAGES.ERROR.INVALID_SYMBOLS);
        }
        if (!this.symbols.includes(symbol)) {
            this.symbols.push(symbol);
        }
    }

    /**
     * Remove símbolo da transição
     * @param {string} symbol - Símbolo a remover
     */
    removeSymbol(symbol) {
        this.symbols = this.symbols.filter(s => s !== symbol);
    }

    /**
     * Define símbolos da transição
     * @param {Array<string>} symbols - Array de símbolos
     */
    setSymbols(symbols) {
        this.symbols = symbols.filter(s => isValidSymbol(s) || s === '');
    }

    /**
     * Define se está selecionada
     * @param {boolean} selected - True se selecionada
     */
    setSelected(selected) {
        this.isSelected = selected;
        if (this.element) {
            if (selected) {
                this.element.classList.add('selected');
            } else {
                this.element.classList.remove('selected');
            }
        }
    }

    /**
     * Desenha a transição no SVG
     * @param {SVGElement} svg - Elemento SVG
     * @param {Object} states - Map de estados
     * @returns {SVGElement} Elemento grupo com a transição
     */
    draw(svg, states) {
        const from = states.get(this.fromId);
        const to = states.get(this.toId);

        if (!from || !to) return null;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'transition-edge');
        g.setAttribute('data-from', this.fromId);
        g.setAttribute('data-to', this.toId);

        // Auto-transição (loop)
        if (this.fromId === this.toId) {
            this._drawSelfLoop(g, from);
        } else {
            // Transição normal
            this._drawNormalTransition(g, from, to);
        }

        this.element = g;
        return g;
    }

    /**
     * Desenha transição em loop (mesmo estado)
     * @private
     */
    _drawSelfLoop(g, state) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const radius = 35;
        const d = `M ${state.x - CONFIG.CANVAS.STATE_RADIUS} ${state.y - CONFIG.CANVAS.STATE_RADIUS} 
                   A ${radius} ${radius} 0 1 0 ${state.x + CONFIG.CANVAS.STATE_RADIUS} ${state.y - CONFIG.CANVAS.STATE_RADIUS}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'transition-path self-loop');
        g.appendChild(path);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', state.x);
        label.setAttribute('y', state.y - CONFIG.CANVAS.STATE_RADIUS - 30);
        label.setAttribute('class', 'transition-label');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = this.symbols.join(',');
        g.appendChild(label);
    }

    /**
     * Desenha transição normal
     * @private
     */
    _drawNormalTransition(g, from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = distance(from, to);
        const offsetX = (dx / dist) * CONFIG.CANVAS.STATE_RADIUS;
        const offsetY = (dy / dist) * CONFIG.CANVAS.STATE_RADIUS;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x + offsetX);
        line.setAttribute('y1', from.y + offsetY);
        line.setAttribute('x2', to.x - offsetX);
        line.setAttribute('y2', to.y - offsetY);
        line.setAttribute('class', 'transition-path');
        g.appendChild(line);

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY - 12);
        label.setAttribute('class', 'transition-label');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = this.symbols.join(',');
        g.appendChild(label);
    }

    /**
     * Converte transição para objeto serializável
     * @returns {Object} Objeto com dados da transição
     */
    toJSON() {
        return {
            fromId: this.fromId,
            toId: this.toId,
            symbols: this.symbols,
        };
    }

    /**
     * Cria transição a partir de objeto
     * @param {Object} data - Dados da transição
     * @returns {TransitionEdge} Nova transição
     */
    static fromJSON(data) {
        return new TransitionEdge(data.fromId, data.toId, data.symbols);
    }

    /**
     * Clona a transição
     * @returns {TransitionEdge} Cópia da transição
     */
    clone() {
        return new TransitionEdge(this.fromId, this.toId, [...this.symbols]);
    }

    /**
     * Verifica se transição é válida
     * @returns {boolean} True se válida
     */
    isValid() {
        return (
            this.fromId !== undefined &&
            this.toId !== undefined &&
            this.symbols && 
            this.symbols.length > 0
        );
    }
}