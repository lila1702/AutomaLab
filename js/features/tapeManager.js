/**
 * TapeManager - Gerencia a fita visual de simulação
 * Exibe a cadeia de entrada em células e anima o cabeçote de leitura
 */
class TapeManager {
    constructor(simulator) {
        this.simulator = simulator;
        this.container = document.getElementById('tape-container');
        this.cellsContainer = document.getElementById('tape-cells');
        this.head = document.getElementById('tape-head');
        this.infoState = document.getElementById('tape-current-state');
        this.infoSymbol = document.getElementById('tape-current-symbol');
        this.infoStep = document.getElementById('tape-current-step');
        
        this.chain = '';
        this.cells = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.animationSpeed = 800; // ms
        this.playInterval = null;
        
        this._initEventListeners();
    }

    _initEventListeners() {
        // Controles da fita
        const btnStep = document.getElementById('tape-step');
        const btnPlay = document.getElementById('tape-play');
        const btnPause = document.getElementById('tape-pause');
        const btnReset = document.getElementById('tape-reset');
        const btnClose = document.getElementById('tape-close');
        const speedSlider = document.getElementById('tape-speed');
        
        if (btnStep) {
            btnStep.addEventListener('click', () => this.stepForward());
        }
        
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.play());
        }
        
        if (btnPause) {
            btnPause.addEventListener('click', () => this.pause());
        }
        
        if (btnReset) {
            btnReset.addEventListener('click', () => this.reset());
        }
        
        if (btnClose) {
            btnClose.addEventListener('click', () => this.hide());
        }
        
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.animationSpeed = parseInt(e.target.value);
            });
        }
        
        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    /**
     * Inicializa a fita com uma cadeia
     * @param {string} chain - Cadeia de entrada
     * @param {Array} steps - Passos da simulação
     */
    initialize(chain, steps) {
        console.log('🎬 TapeManager.initialize() chamado:', { chain, steps });
        
        this.chain = chain || '';
        this.steps = steps || [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.isPaused = false;
        
        this._clearCells();
        this._createCells();
        this._updateHead(0);
        this._updateInfo(steps[0]);
        this._show();
        
        console.log('✅ Fita inicializada e exibida');
    }

    /**
     * Cria as células da fita
     * @private
     */
    _createCells() {
        this.cells = [];
        
        // Criar células vazias no início
        for (let i = 0; i < 2; i++) {
            const cell = this._createCell('_', true);
            this.cellsContainer.appendChild(cell);
            this.cells.push(cell);
        }
        
        // Criar células com símbolos
        if (this.chain === '') {
            const cell = this._createCell('ε');
            this.cellsContainer.appendChild(cell);
            this.cells.push(cell);
        } else {
            for (let i = 0; i < this.chain.length; i++) {
                const cell = this._createCell(this.chain[i]);
                this.cellsContainer.appendChild(cell);
                this.cells.push(cell);
            }
        }
        
        // Criar células vazias no final
        for (let i = 0; i < 2; i++) {
            const cell = this._createCell('_', true);
            this.cellsContainer.appendChild(cell);
            this.cells.push(cell);
        }
    }

    /**
     * Cria uma célula
     * @private
     */
    _createCell(symbol, isEmpty = false) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        if (isEmpty) cell.classList.add('empty');
        cell.textContent = symbol;
        return cell;
    }

    /**
     * Limpa todas as células
     * @private
     */
    _clearCells() {
        this.cellsContainer.innerHTML = '';
        this.cells = [];
    }

    /**
     * Atualiza posição do cabeçote
     * @private
     */
    _updateHead(position) {
        const cellIndex = position + 2; // +2 por causa das células vazias no início
        const cellWidth = 54; // 50px + 4px margin
        const headPosition = 50 + (cellIndex * cellWidth);
        this.head.style.left = `${headPosition}px`;
        
        // Scroll automático para manter o cabeçote visível
        const track = this.cellsContainer.parentElement;
        const scrollPosition = headPosition - (track.offsetWidth / 2);
        track.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        
        // Atualizar célula atual
        this.cells.forEach((cell, idx) => {
            cell.classList.remove('current');
            if (idx === cellIndex) {
                cell.classList.add('current');
            }
        });
    }

    /**
     * Atualiza informações da fita
     * @private
     */
    _updateInfo(step) {
        if (!step) return;
        
        if (this.infoState) {
            const stateLabel = typeof step.state === 'number' 
                ? (APP.canvas.states.get(step.state)?.label || `q${step.state}`)
                : (Array.isArray(step.states) 
                    ? step.states.map(s => APP.canvas.states.get(s)?.label || `q${s}`).join(',')
                    : step.state);
            this.infoState.textContent = stateLabel;
        }
        
        if (this.infoSymbol) {
            this.infoSymbol.textContent = step.symbol || 'ε';
        }
        
        if (this.infoStep) {
            this.infoStep.textContent = `${step.step}/${this.steps.length}`;
        }
    }

    /**
     * Avança um passo na simulação
     */
    stepForward() {
        if (this.currentStep >= this.steps.length) {
            this._showFinalResult();
            return;
        }
        
        const step = this.steps[this.currentStep];
        
        // Marcar célula como lida
        const cellIndex = this.currentStep + 2;
        if (this.cells[cellIndex]) {
            this.cells[cellIndex].classList.add('read');
        }
        
        // Atualizar cabeçote
        this._updateHead(this.currentStep);
        
        // Atualizar info
        this._updateInfo(step);
        
        // Destacar estado no canvas
        this._highlightState(step);
        
        this.currentStep++;
    }

    /**
     * Inicia reprodução automática
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.isPaused = false;
        
        // Atualizar botões
        document.getElementById('tape-play').style.display = 'none';
        document.getElementById('tape-pause').style.display = 'inline-block';
        
        this.playInterval = setInterval(() => {
            if (this.currentStep >= this.steps.length) {
                this.pause();
                this._showFinalResult();
                return;
            }
            this.stepForward();
        }, this.animationSpeed);
    }

    /**
     * Pausa a reprodução
     */
    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        
        // Atualizar botões
        document.getElementById('tape-play').style.display = 'inline-block';
        document.getElementById('tape-pause').style.display = 'none';
    }

    /**
     * Reseta a fita
     */
    reset() {
        this.pause();
        this.currentStep = 0;
        
        // Remover classes das células
        this.cells.forEach(cell => {
            cell.classList.remove('current', 'read', 'accepted', 'rejected');
        });
        
        // Resetar cabeçote
        this._updateHead(0);
        
        // Resetar info
        if (this.steps.length > 0) {
            this._updateInfo(this.steps[0]);
        }
        
        // Remover destacamento do canvas
        APP.canvas.cy.nodes().removeClass('highlighted-state');
    }

    /**
     * Mostra resultado final
     * @private
     */
    _showFinalResult() {
        const lastStep = this.steps[this.steps.length - 1];
        const isAccepted = lastStep ? lastStep.accepted : false;
        
        // Marcar todas as células
        const startIndex = 2;
        const endIndex = this.chain === '' ? 3 : startIndex + this.chain.length;
        
        for (let i = startIndex; i < endIndex; i++) {
            if (this.cells[i]) {
                this.cells[i].classList.remove('current', 'read');
                this.cells[i].classList.add(isAccepted ? 'accepted' : 'rejected');
            }
        }
        
        // Remover highlight dos estados
        APP.canvas.cy.nodes().removeClass('highlighted-state');
        
        // Animar container (sem piscar)
        this.container.classList.add(isAccepted ? 'accepting' : 'rejecting');
        setTimeout(() => {
            this.container.classList.remove('accepting', 'rejecting');
        }, 1500);
    }

    /**
     * Destaca estado no canvas
     * @private
     */
    _highlightState(step) {
        // Remover highlight anterior
        APP.canvas.cy.nodes().removeClass('highlighted-state');
        
        // Adicionar highlight ao estado atual
        if (typeof step.state === 'number') {
            const node = APP.canvas.cy.$(`#state-${step.state}`);
            if (node.length > 0) {
                node.addClass('highlighted-state');
            }
        } else if (Array.isArray(step.states)) {
            // AFN: destacar múltiplos estados
            step.states.forEach(stateId => {
                const node = APP.canvas.cy.$(`#state-${stateId}`);
                if (node.length > 0) {
                    node.addClass('highlighted-state');
                }
            });
        }
    }

    /**
     * Mostra a fita
     * @private
     */
    _show() {
        console.log('📼 Mostrando fita...', this.container);
        if (this.container) {
            this.container.style.display = 'block';
            console.log('✅ Fita display:', this.container.style.display);
        } else {
            console.error('❌ Container da fita não encontrado!');
        }
    }

    /**
     * Esconde a fita
     */
    hide() {
        this.container.style.display = 'none';
        this.pause();
    }

    /**
     * Verifica se a fita está visível
     */
    isVisible() {
        return this.container.style.display !== 'none';
    }
}
