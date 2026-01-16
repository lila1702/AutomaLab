/**
 * Validador de autômatos - detecta problemas estruturais
 */

class AutomataValidator {
    constructor(canvasManager) {
        this.canvas = canvasManager;
    }

    /**
     * Executa todas as validações e retorna relatório
     * @returns {Object} Relatório de validação
     */
    validate() {
        return {
            unreachableStates: this.detectUnreachableStates(),
            deadlocks: this.checkForDeadlocks(),
            alphabet: this.validateAlphabet(),
            hasInitialState: this.canvas.initialState !== null,
            hasAcceptStates: this._hasAcceptStates(),
            isDeterministic: this.canvas._detectAutomataType() === 'dfa',
        };
    }

    /**
     * Detecta estados inalcançáveis a partir do estado inicial
     * @returns {Array<number>} IDs dos estados inalcançáveis
     */
    detectUnreachableStates() {
        if (this.canvas.initialState === null) {
            // Sem estado inicial, todos são inalcançáveis
            return Array.from(this.canvas.states.keys());
        }

        const reachable = new Set();
        const stack = [this.canvas.initialState];

        // BFS a partir do estado inicial
        while (stack.length > 0) {
            const stateId = stack.pop();
            
            if (reachable.has(stateId)) continue;
            reachable.add(stateId);

            // Adicionar estados destino de todas as transições
            const outgoingTransitions = this.canvas.transitions.filter(t => t.fromId === stateId);
            outgoingTransitions.forEach(t => {
                if (!reachable.has(t.toId)) {
                    stack.push(t.toId);
                }
            });
        }

        // Encontrar estados não alcançáveis
        const unreachable = [];
        this.canvas.states.forEach((state, id) => {
            if (!reachable.has(id)) {
                unreachable.push(id);
            }
        });

        return unreachable;
    }

    /**
     * Verifica se há estados sem transições de saída (deadlocks)
     * @returns {Array<number>} IDs dos estados deadlock (que não são de aceitação)
     */
    checkForDeadlocks() {
        const deadlocks = [];

        this.canvas.states.forEach((state, id) => {
            const hasOutgoing = this.canvas.transitions.some(t => t.fromId === id);
            
            // Deadlock: sem saída E não é estado de aceitação
            if (!hasOutgoing && !state.isAccept) {
                deadlocks.push(id);
            }
        });

        return deadlocks;
    }

    /**
     * Extrai e valida o alfabeto do autômato
     * @returns {Object} Informações sobre o alfabeto
     */
    validateAlphabet() {
        const symbols = new Set();
        let hasEpsilon = false;

        this.canvas.transitions.forEach(t => {
            t.symbols.forEach(s => {
                if (s === 'ε' || s === 'ϵ') {
                    hasEpsilon = true;
                } else {
                    symbols.add(s);
                }
            });
        });

        return {
            symbols: Array.from(symbols).sort(),
            size: symbols.size,
            hasEpsilon: hasEpsilon,
            isEmpty: symbols.size === 0 && !hasEpsilon,
        };
    }

    /**
     * Verifica se há pelo menos um estado de aceitação
     * @private
     */
    _hasAcceptStates() {
        for (const [id, state] of this.canvas.states) {
            if (state.isAccept) return true;
        }
        return false;
    }

    /**
     * Gera relatório textual de validação
     * @returns {string} Relatório formatado
     */
    generateReport() {
        const validation = this.validate();
        let report = '=== ANÁLISE DO AUTÔMATO ===\n\n';

        report += `📊 Estatísticas:\n`;
        report += `  - Estados: ${this.canvas.states.size}\n`;
        report += `  - Transições: ${this.canvas.transitions.length}\n`;
        report += `  - Tipo: ${validation.isDeterministic ? 'AFD (Determinístico)' : 'AFN (Não-determinístico)'}\n\n`;

        report += `🔤 Alfabeto:\n`;
        if (validation.alphabet.isEmpty) {
            report += `  ⚠️ Alfabeto vazio!\n`;
        } else {
            report += `  Σ = {${validation.alphabet.symbols.join(', ')}}`;
            if (validation.alphabet.hasEpsilon) {
                report += ` ∪ {ε}`;
            }
            report += `\n`;
        }
        report += `\n`;

        report += `✅ Validações:\n`;
        report += `  ${validation.hasInitialState ? '✓' : '✗'} Estado inicial definido\n`;
        report += `  ${validation.hasAcceptStates ? '✓' : '✗'} Estados de aceitação existem\n\n`;

        report += `⚠️ Problemas Detectados:\n`;
        if (validation.unreachableStates.length > 0) {
            const labels = validation.unreachableStates.map(id => {
                const state = this.canvas.states.get(id);
                return state?.label || `q${id}`;
            });
            report += `  ⚠️ Estados inalcançáveis: ${labels.join(', ')}\n`;
        }

        if (validation.deadlocks.length > 0) {
            const labels = validation.deadlocks.map(id => {
                const state = this.canvas.states.get(id);
                return state?.label || `q${id}`;
            });
            report += `  ⚠️ Estados deadlock (sem saída): ${labels.join(', ')}\n`;
        }

        if (validation.unreachableStates.length === 0 && validation.deadlocks.length === 0) {
            report += `  ✓ Nenhum problema estrutural detectado\n`;
        }

        return report;
    }

    /**
     * Exibe relatório de validação em notificação
     */
    showReport() {
        const validation = this.validate();
        let messages = [];

        if (!validation.hasInitialState) {
            messages.push('⚠️ Sem estado inicial');
        }
        if (!validation.hasAcceptStates) {
            messages.push('⚠️ Sem estados de aceitação');
        }
        if (validation.unreachableStates.length > 0) {
            messages.push(`⚠️ ${validation.unreachableStates.length} estado(s) inalcançável(eis)`);
        }
        if (validation.deadlocks.length > 0) {
            messages.push(`⚠️ ${validation.deadlocks.length} deadlock(s)`);
        }

        if (messages.length === 0) {
            showNotification('✅ Autômato válido! Nenhum problema detectado.', 'success', 3000);
        } else {
            showNotification(messages.join('\n'), 'warning', 5000);
        }
    }
}
