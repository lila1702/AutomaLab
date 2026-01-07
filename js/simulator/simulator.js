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
        let activeStates = new Set([this.canvas.initialState]);
        const steps = [];

        // Cadeia vazia
        if (chain === '') {
            let isAccepted = false;
            for (const stateId of activeStates) {
                if (this.canvas.states.get(stateId).isAccept) {
                    isAccepted = true;
                    break;
                }
            }
            steps.push({
                step: 0,
                states: Array.from(activeStates),
                symbol: 'ε',
                accepted: isAccepted,
            });
            this.stepHistory = steps;
            return this._createResult(isAccepted, MESSAGES.SIMULATOR.EMPTY_CHAIN, steps);
        }

        // Processar cada símbolo
        for (let i = 0; i < chain.length; i++) {
            const symbol = chain[i];
            const nextStates = new Set();

            // Encontrar todas as transições possíveis
            for (const currentStateId of activeStates) {
                const transitions = this.canvas.transitions.filter(
                    t => t.fromId === currentStateId && t.symbols.includes(symbol)
                );

                transitions.forEach(t => nextStates.add(t.toId));
            }

            if (nextStates.size === 0) {
                steps.push({
                    step: i + 1,
                    states: Array.from(activeStates),
                    symbol: symbol,
                    nextStates: [],
                    accepted: false,
                    error: MESSAGES.SIMULATOR.NO_TRANSITION,
                });
                this.stepHistory = steps;
                return this._createResult(false, MESSAGES.SIMULATOR.CHAIN_REJECTED, steps);
            }

            activeStates = nextStates;
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
                symbol: symbol,
                accepted: stepAccepted,
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