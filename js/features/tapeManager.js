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
        console.log('📋 Passos recebidos:', steps.length);
        steps.forEach((s, i) => {
            console.log(`  Passo ${i}:`, s);
        });
        
        this.chain = chain || '';
        this.steps = steps || [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.isPaused = false;
        
        this._clearCells();
        this._createCells();
        this._updateHead(0);
        
        // Iniciar no primeiro passo (pode ser passo inicial = 0)
        if (this.steps.length > 0) {
            this._updateInfo(this.steps[0]);
            this._highlightState(this.steps[0]);
        }
        
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
        
        // AFN: múltiplos estados ativos (step.states)
        // AFD: um único estado (step.state)
        if (this.infoState) {
            let stateLabel = '';
            let isNFA = false;
            
            if (Array.isArray(step.states)) {
                // AFN: mostrar conjunto de estados {q0, q1, q2}
                isNFA = true;
                const labels = step.states.map(s => {
                    const state = APP.canvas.states.get(s);
                    return state ? state.label : `q${s}`;
                });
                
                // Adicionar indicador visual de múltiplos estados
                if (step.states.length > 1) {
                    stateLabel = `{${labels.join(', ')}}`;
                } else if (step.states.length === 1) {
                    stateLabel = `{${labels[0]}}`;
                } else {
                    stateLabel = '∅'; // Conjunto vazio
                }
            } else if (typeof step.state === 'number') {
                // AFD: mostrar estado único
                const state = APP.canvas.states.get(step.state);
                stateLabel = state ? state.label : `q${step.state}`;
            } else {
                stateLabel = step.state || '?';
            }
            
            this.infoState.textContent = stateLabel;
            
            // Adicionar classe visual para AFN
            if (isNFA && step.states && step.states.length > 1) {
                this.infoState.style.color = '#f57c00'; // Laranja para múltiplos estados
                this.infoState.style.fontWeight = 'bold';
            } else {
                this.infoState.style.color = '';
                this.infoState.style.fontWeight = 'bold';
            }
        }
        
        if (this.infoSymbol) {
            this.infoSymbol.textContent = step.symbol || 'ε';
        }
        
        if (this.infoStep) {
            // Mostrar passo atual / total (o step.step já vem correto do simulador)
            const totalSteps = this.steps.length > 0 ? this.steps[this.steps.length - 1].step : 0;
            this.infoStep.textContent = `${step.step}/${totalSteps}`;
        }
        
        // Mostrar informações sobre não-determinismo (NOVO!)
        const tapeInfo = document.getElementById('tape-info');
        if (tapeInfo && step.nonDeterminism !== undefined && step.nonDeterminism > 1) {
            // Adicionar badge de não-determinismo
            let badge = tapeInfo.querySelector('.nfa-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nfa-badge';
                badge.style.cssText = 'background: #ff6f00; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-left: 8px;';
                tapeInfo.appendChild(badge);
            }
            badge.textContent = `${step.nonDeterminism} rotas`;
            badge.title = `${step.nonDeterminism} transições possíveis foram exploradas neste passo`;
        } else if (tapeInfo) {
            // Remover badge se não houver não-determinismo
            const badge = tapeInfo.querySelector('.nfa-badge');
            if (badge) badge.remove();
        }
        
        // Mostrar painel de rotas se houver múltiplas transições
        const routesPanel = document.getElementById('tape-routes');
        const routesList = document.getElementById('tape-routes-list');
        
        if (step.transitions && step.transitions.length > 0) {
            if (routesPanel) routesPanel.style.display = 'block';
            
            if (routesList) {
                routesList.innerHTML = '';
                
                // Agrupar transições por símbolo
                const normalTransitions = step.transitions.filter(t => t.symbol !== 'ε');
                const epsilonTransitions = step.transitions.filter(t => t.symbol === 'ε');
                
                // Mostrar transições normais
                if (normalTransitions.length > 0) {
                    normalTransitions.forEach(t => {
                        const fromState = APP.canvas.states.get(t.from);
                        const toState = APP.canvas.states.get(t.to);
                        const fromLabel = fromState ? fromState.label : `q${t.from}`;
                        const toLabel = toState ? toState.label : `q${t.to}`;
                        
                        const route = document.createElement('div');
                        route.style.cssText = 'padding: 2px 4px; margin: 2px 0; background: white; border-radius: 3px; border-left: 3px solid #ff6f00;';
                        route.innerHTML = `${fromLabel} <span style="color:#ff6f00; font-weight:bold;">--${t.symbol}--></span> ${toLabel}`;
                        routesList.appendChild(route);
                    });
                }
                
                // Mostrar transições épsilon (se houver)
                if (epsilonTransitions.length > 0) {
                    const divider = document.createElement('div');
                    divider.style.cssText = 'font-size: 9px; color: #999; margin: 4px 0 2px 0;';
                    divider.textContent = '+ Fechamento épsilon:';
                    routesList.appendChild(divider);
                    
                    epsilonTransitions.forEach(t => {
                        const fromState = APP.canvas.states.get(t.from);
                        const toState = APP.canvas.states.get(t.to);
                        const fromLabel = fromState ? fromState.label : `q${t.from}`;
                        const toLabel = toState ? toState.label : `q${t.to}`;
                        
                        const route = document.createElement('div');
                        route.style.cssText = 'padding: 2px 4px; margin: 2px 0; background: #f5f5f5; border-radius: 3px; border-left: 3px solid #9e9e9e; font-size: 10px;';
                        route.innerHTML = `${fromLabel} <span style="color:#9e9e9e; font-weight:bold;">--ε--></span> ${toLabel}`;
                        routesList.appendChild(route);
                    });
                }
            }
        } else if (routesPanel) {
            routesPanel.style.display = 'none';
        }
        
        // Mostrar transições tomadas no console para debug
        if (step.transitions && step.transitions.length > 0) {
            console.log(`📋 Transições tomadas no passo ${step.step}:`, 
                step.transitions.map(t => `${t.from} --${t.symbol}--> ${t.to}`).join(', ')
            );
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
        console.log(`🎬 Step ${this.currentStep}:`, step);
        
        // 🔄 GARANTIR LIMPEZA: Remover todos os highlights antes de aplicar novos
        APP.canvas.cy.nodes().removeClass('highlighted-state highlighted-direct-state highlighted-epsilon-state');
        APP.canvas.cy.edges().removeClass('highlighted-transition');
        
        // Para AFN/AFD: step.step indica qual símbolo foi lido (0 = início, 1 = primeiro símbolo, etc)
        const symbolIndex = step.step;
        
        // Marcar célula como lida (apenas se não for o passo inicial)
        if (symbolIndex > 0) {
            const cellIndex = symbolIndex + 1; // +2 (células vazias) - 1 (índice 0-based)
            if (this.cells[cellIndex]) {
                this.cells[cellIndex].classList.add('read');
            }
        }
        
        // Se houver erro, marcar célula como rejeitada
        if (step.error) {
            const cellIndex = symbolIndex + 1;
            if (this.cells[cellIndex]) {
                this.cells[cellIndex].classList.add('rejected');
            }
        }
        
        // Atualizar cabeçote para a posição correta
        const headPosition = Math.max(0, symbolIndex);
        this._updateHead(headPosition);
        
        // Atualizar info
        this._updateInfo(step);
        
        // Destacar estado no canvas
        this._highlightState(step);
        
        this.currentStep++;
        
        // Se for o último passo ou houver erro, pausar
        if (this.currentStep >= this.steps.length || step.error) {
            if (this.isPlaying) {
                this.pause();
                this._showFinalResult();
            }
        }
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
        APP.canvas.cy.nodes().removeClass('highlighted-state highlighted-direct-state highlighted-epsilon-state');
        APP.canvas.cy.edges().removeClass('highlighted-transition');
        
        // Adicionar highlight ao estado atual
        if (typeof step.state === 'number') {
            // AFD: um único estado
            const node = APP.canvas.cy.$(`#state-${step.state}`);
            if (node.length > 0) {
                node.addClass('highlighted-state');
            }
        } else if (Array.isArray(step.states)) {
            // AFN: múltiplos estados - todos com mesma cor
            step.states.forEach(stateId => {
                const node = APP.canvas.cy.$(`#state-${stateId}`);
                if (node.length > 0) {
                    node.addClass('highlighted-state');
                }
            });
        }
        
        // Destacar apenas transições EPSILON
        if (step.transitions && step.transitions.length > 0) {
            console.log(`🔗 Destacando transições epsilon:`);
            
            step.transitions.forEach(trans => {
                // Destacar apenas transições epsilon
                if (trans.symbol === 'ε' || trans.symbol === 'ϵ') {
                    const edges = APP.canvas.cy.edges().filter(edge => {
                        return edge.data('fromId') === trans.from && 
                               edge.data('toId') === trans.to &&
                               edge.data('symbols').includes(trans.symbol);
                    });
                    
                    if (edges.length > 0) {
                        edges.addClass('highlighted-transition');
                        console.log(`  ✅ Transição epsilon destacada: ${trans.from} --${trans.symbol}--> ${trans.to}`);
                    }
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
