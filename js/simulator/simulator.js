class Simulator {
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.currentState = null;
        this.activeStates = new Set();
        this.stepHistory = [];
    }

    simulate(chain, automataType = 'dfa') {
        // Validações
        if (this.canvas.states.size === 0) {
            return this._createResult(false, MESSAGES.ERROR.NO_STATES);
        }

        if (this.canvas.initialState === null) {
            return this._createResult(false, MESSAGES.ERROR.NO_INITIAL_STATE);
        }

        if (!isValidChain(chain)) {
            return this._createResult(false, 'Cadeia contém caracteres inválidos');
        }

        // Reset
        this.stepHistory = [];

        // Simular
        if (automataType === 'dfa') {
            return this._simulateDFA(chain);
        } else {
            return this._simulateNFA(chain);
        }
    }

    _simulateDFA(chain) {
        let currentStateId = this.canvas.initialState;
        const steps = [];

        // Cadeia vazia
        if (chain === '') {
            const state = this.canvas.states.get(currentStateId);
            const isAccepted = state.isAccept;
            steps.push({
                step: 0,
                state: currentStateId,
                symbol: 'ε',
                accepted: isAccepted,
            });
            this.stepHistory = steps;
            return this._createResult(isAccepted, MESSAGES.SIMULATOR.EMPTY_CHAIN, steps);
        }

        // Processar cada símbolo
        for (let i = 0; i < chain.length; i++) {
            const symbol = chain[i];

            // Encontrar transição
            const transition = this.canvas.transitions.find(
                t => t.fromId === currentStateId && t.symbols.includes(symbol)
            );

            if (!transition) {
                steps.push({
                    step: i + 1,
                    state: currentStateId,
                    symbol: symbol,
                    accepted: false,
                    error: MESSAGES.SIMULATOR.NO_TRANSITION,
                });
                this.stepHistory = steps;
                return this._createResult(false, MESSAGES.SIMULATOR.CHAIN_REJECTED, steps);
            }

            currentStateId = transition.toId;
            const state = this.canvas.states.get(currentStateId);
            steps.push({
                step: i + 1,
                state: currentStateId,
                symbol: symbol,
                accepted: state.isAccept,
            });
        }

        // Verificar se está em estado de aceitação
        const finalState = this.canvas.states.get(currentStateId);
        const isAccepted = finalState.isAccept;

        this.stepHistory = steps;
        const message = isAccepted ? MESSAGES.SIMULATOR.CHAIN_ACCEPTED : MESSAGES.SIMULATOR.CHAIN_REJECTED;
        return this._createResult(isAccepted, message, steps);
    }

    _simulateNFA(chain) {
        // Aplicar fechamento épsilon ao estado inicial
        let activeStates = this._epsilonClosure(new Set([this.canvas.initialState]));
        const steps = [];

        // Passo inicial: mostrar estados após fechamento épsilon
        steps.push({
            step: 0,
            states: Array.from(activeStates),
            symbol: 'início',
            accepted: false,
            transitions: [], // Sem transições no passo inicial
        });

        // Cadeia vazia
        if (chain === '' || chain === 'ε' || chain === 'ϵ') {
            let isAccepted = false;
            for (const stateId of activeStates) {
                if (this.canvas.states.get(stateId).isAccept) {
                    isAccepted = true;
                    break;
                }
            }
            // Atualizar passo inicial com resultado
            steps[0].accepted = isAccepted;
            this.stepHistory = steps;
            return this._createResult(isAccepted, MESSAGES.SIMULATOR.EMPTY_CHAIN, steps);
        }

        // Processar cada símbolo
        for (let i = 0; i < chain.length; i++) {
            const symbol = chain[i];
            
            // Ignorar símbolo épsilon na entrada (já processado no fechamento)
            if (symbol === 'ε' || symbol === 'ϵ') {
                continue;
            }
            
            const nextStates = new Set();
            const transitionsTaken = []; // Rastrear todas as transições tomadas

            // Encontrar todas as transições possíveis (exceto épsilon)
            for (const currentStateId of activeStates) {
                const transitions = this.canvas.transitions.filter(
                    t => t.fromId === currentStateId && t.symbols.includes(symbol)
                );

                transitions.forEach(t => {
                    nextStates.add(t.toId);
                    // Registrar esta transição
                    transitionsTaken.push({
                        from: currentStateId,
                        to: t.toId,
                        symbol: symbol
                    });
                });
            }

            if (nextStates.size === 0) {
                steps.push({
                    step: i + 1,
                    states: Array.from(activeStates),
                    symbol: symbol,
                    nextStates: [],
                    accepted: false,
                    error: MESSAGES.SIMULATOR.NO_TRANSITION,
                    transitions: [],
                });
                this.stepHistory = steps;
                return this._createResult(false, MESSAGES.SIMULATOR.CHAIN_REJECTED, steps);
            }

            // Aplicar fechamento épsilon aos próximos estados
            const beforeEpsilon = new Set(nextStates);
            activeStates = this._epsilonClosure(nextStates);
            
            // Registrar transições épsilon aplicadas
            const epsilonTransitions = [];
            for (const stateId of beforeEpsilon) {
                const epsilonEdges = this.canvas.transitions.filter(
                    t => t.fromId === stateId && (t.symbols.includes('ε') || t.symbols.includes('ϵ'))
                );
                epsilonEdges.forEach(t => {
                    if (activeStates.has(t.toId)) {
                        epsilonTransitions.push({
                            from: stateId,
                            to: t.toId,
                            symbol: 'ε'
                        });
                    }
                });
            }
            
            let stepAccepted = false;
            for (const stateId of activeStates) {
                if (this.canvas.states.get(stateId).isAccept) {
                    stepAccepted = true;
                    break;
                }
            }

            steps.push({
                step: i + 1,
                states: Array.from(activeStates),
                directStates: Array.from(beforeEpsilon), // 🆕 Estados alcançados diretamente (antes do epsilon)
                symbol: symbol,
                accepted: stepAccepted,
                transitions: [...transitionsTaken, ...epsilonTransitions], // Todas as transições tomadas
                nonDeterminism: transitionsTaken.length // Quantas rotas foram exploradas
            });
        }

        // Verificar se há algum estado de aceitação ativo
        let isAccepted = false;
        for (const stateId of activeStates) {
            if (this.canvas.states.get(stateId).isAccept) {
                isAccepted = true;
                break;
            }
        }

        this.stepHistory = steps;
        const message = isAccepted ? MESSAGES.SIMULATOR.CHAIN_ACCEPTED : MESSAGES.SIMULATOR.CHAIN_REJECTED;
        return this._createResult(isAccepted, message, steps);
    }

    /**
     * Calcula o fechamento épsilon de um conjunto de estados
     * Retorna todos os estados alcançáveis via transições ε
     * @param {Set<number>} states - Conjunto de estados iniciais
     * @returns {Set<number>} Fechamento épsilon dos estados
     */
    _epsilonClosure(states) {
        const closure = new Set(states);
        const stack = [...states];
        
        // Detectar loop infinito
        let iterations = 0;
        const maxIterations = this.canvas.states.size * 100;
        
        while (stack.length > 0) {
            iterations++;
            if (iterations > maxIterations) {
                console.warn('Loop infinito detectado no fechamento épsilon');
                break;
            }
            
            const state = stack.pop();
            
            // Buscar todas as transições épsilon deste estado
            const epsilonTransitions = this.canvas.transitions.filter(
                t => t.fromId === state && (t.symbols.includes('ε') || t.symbols.includes('ϵ'))
            );
            
            // Adicionar estados destino ao fechamento
            epsilonTransitions.forEach(t => {
                if (!closure.has(t.toId)) {
                    closure.add(t.toId);
                    stack.push(t.toId);
                }
            });
        }
        
        return closure;
    }

    _createResult(accepted, message, steps = []) {
        return {
            accepted,
            message,
            steps,
            timestamp: new Date(),
        };
    }

    getStepHistory() {
        return this.stepHistory;
    }

    getResultDescription(result) {
        const stepCount = result.steps.length;
        const baseMsg = result.message;
        return `${baseMsg} (${stepCount} passo${stepCount !== 1 ? 's' : ''})`;
    }
}