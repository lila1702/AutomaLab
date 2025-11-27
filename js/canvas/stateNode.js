class StateNode {
    /**
     * Cria um novo estado
     * @param {number} id - ID único do estado
     * @param {number} x - Posição X no canvas
     * @param {number} y - Posição Y no canvas
     */
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = `q${id}`;
        this.isInitial = false;
        this.isAccept = false;
        this.element = null;
        this.isSelected = false;
    }

    /**
     * Define o label do estado
     * @param {string} label - Novo label
     */
    setLabel(label) {
        if (!isValidStateName(label)) {
            throw new Error(MESSAGES.ERROR.INVALID_STATE_NAME);
        }
        this.label = label;
        this.updateElement();
    }

    /**
     * Define se é estado inicial
     * @param {boolean} isInitial - True se inicial
     */
    setInitial(isInitial) {
        this.isInitial = isInitial;
        this.updateElement();
    }

    /**
     * Define se é estado de aceitação
     * @param {boolean} isAccept - True se aceitação
     */
    setAccept(isAccept) {
        this.isAccept = isAccept;
        this.updateElement();
    }

    /**
     * Define posição do estado
     * @param {number} x - Nova posição X
     * @param {number} y - Nova posição Y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateElement();
    }

    /**
     * Define se está selecionado
     * @param {boolean} selected - True se selecionado
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
     * Desenha o estado no SVG
     * @param {SVGElement} svg - Elemento SVG
     * @returns {SVGElement} Elemento grupo com o estado
     */
    draw(svg) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'state-node');
        g.setAttribute('data-id', this.id);

        // Círculo duplo se for aceitação
        if (this.isAccept) {
            const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            outerCircle.setAttribute('cx', this.x);
            outerCircle.setAttribute('cy', this.y);
            outerCircle.setAttribute('r', CONFIG.CANVAS.STATE_RADIUS + 6);
            outerCircle.setAttribute('class', 'state-circle accept');
            g.appendChild(outerCircle);
        }

        // Círculo principal
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', this.x);
        circle.setAttribute('cy', this.y);
        circle.setAttribute('r', CONFIG.CANVAS.STATE_RADIUS);
        circle.setAttribute('class', 'state-circle');
        g.appendChild(circle);

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.x);
        text.setAttribute('y', this.y);
        text.setAttribute('class', 'state-label');
        text.textContent = this.label;
        g.appendChild(text);

        // Seta de entrada se for inicial
        if (this.isInitial) {
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            arrow.setAttribute('x1', this.x - CONFIG.CANVAS.STATE_RADIUS - 20);
            arrow.setAttribute('y1', this.y);
            arrow.setAttribute('x2', this.x - CONFIG.CANVAS.STATE_RADIUS - 2);
            arrow.setAttribute('y2', this.y);
            arrow.setAttribute('class', 'initial-arrow');
            arrow.setAttribute('stroke', CONFIG.COLORS.success);
            arrow.setAttribute('stroke-width', '2');
            arrow.setAttribute('marker-end', 'url(#arrowhead)');
            g.appendChild(arrow);
        }

        this.element = g;
        return g;
    }

    /**
     * Atualiza o elemento no SVG
     */
    updateElement() {
        if (!this.element) return;
        
        // Remover elemento antigo
        this.element.remove();
        
        // Desenhar novamente
        const svg = this.element.parentElement;
        if (svg) {
            const newElement = this.draw(svg);
            svg.appendChild(newElement);
        }
    }

    /**
     * Converte estado para objeto serializável
     * @returns {Object} Objeto com dados do estado
     */
    toJSON() {
        return {
            id: this.id,
            label: this.label,
            x: this.x,
            y: this.y,
            isInitial: this.isInitial,
            isAccept: this.isAccept,
        };
    }

    /**
     * Cria estado a partir de objeto
     * @param {Object} data - Dados do estado
     * @returns {StateNode} Novo estado
     */
    static fromJSON(data) {
        const state = new StateNode(data.id, data.x, data.y);
        state.label = data.label;
        state.isInitial = data.isInitial;
        state.isAccept = data.isAccept;
        return state;
    }

    /**
     * Calcula distância até um ponto
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {number} Distância
     */
    distanceTo(x, y) {
        return distance(this, { x, y });
    }

    /**
     * Verifica se ponto está dentro do estado
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {boolean} True se dentro
     */
    contains(x, y) {
        return this.distanceTo(x, y) <= CONFIG.CANVAS.STATE_RADIUS;
    }

    /**
     * Clona o estado
     * @returns {StateNode} Cópia do estado
     */
    clone() {
        const cloned = new StateNode(this.id, this.x, this.y);
        cloned.label = this.label;
        cloned.isInitial = this.isInitial;
        cloned.isAccept = this.isAccept;
        return cloned;
    }
}