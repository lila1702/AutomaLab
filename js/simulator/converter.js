/**
 * Conversor de autômatos - AFN para AFD
 */

class AutomataConverter {
    constructor(canvasManager, simulator) {
        this.canvas = canvasManager;
        this.simulator = simulator;
    }

    /**
     * Converte AFN em AFD usando construção por subconjuntos
     * @returns {Object} Dados do AFD resultante
     */
    nfaToDfa() {
        if (this.canvas.states.size === 0) {
            throw new Error('Autômato vazio');
        }

        if (this.canvas.initialState === null) {
            throw new Error('Nenhum estado inicial definido');
        }

        // Calcular fechamento épsilon do estado inicial
        const initialClosure = this._epsilonClosure(new Set([this.canvas.initialState]));
        
        // Mapa: Set de estados AFN -> ID do estado AFD
        const dfaStatesMap = new Map();
        const dfaStates = [];
        const dfaTransitions = [];
        let nextDfaId = 0;

        // Estado inicial do AFD
        const initialKey = this._setToKey(initialClosure);
        dfaStatesMap.set(initialKey, nextDfaId);
        
        const initialLabel = this._generateLabel(initialClosure, nextDfaId);
        const hasAccept = this._hasAcceptState(initialClosure);
        
        dfaStates.push({
            id: nextDfaId,
            label: initialLabel,
            nfaStates: Array.from(initialClosure),
            isInitial: true,
            isAccept: hasAccept,
            x: 100,
            y: 100
        });
        
        nextDfaId++;

        // Fila de estados não processados
        const queue = [initialClosure];
        const processed = new Set([initialKey]);

        // Extrair alfabeto (sem épsilon)
        const alphabet = this._getAlphabet();

        // Processar estados
        while (queue.length > 0) {
            const currentSet = queue.shift();
            const currentKey = this._setToKey(currentSet);
            const currentDfaId = dfaStatesMap.get(currentKey);

            // Para cada símbolo do alfabeto
            alphabet.forEach(symbol => {
                // Calcular conjunto destino
                const targetSet = this._move(currentSet, symbol);
                
                if (targetSet.size === 0) {
                    // Sem transição para este símbolo
                    return;
                }

                const targetKey = this._setToKey(targetSet);

                // Adicionar novo estado se necessário
                if (!dfaStatesMap.has(targetKey)) {
                    const targetId = nextDfaId++;
                    dfaStatesMap.set(targetKey, targetId);
                    
                    const label = this._generateLabel(targetSet, targetId);
                    const hasAccept = this._hasAcceptState(targetSet);
                    
                    dfaStates.push({
                        id: targetId,
                        label: label,
                        nfaStates: Array.from(targetSet),
                        isInitial: false,
                        isAccept: hasAccept,
                        x: 200 + (targetId % 5) * 150,
                        y: 100 + Math.floor(targetId / 5) * 150
                    });

                    // Adicionar à fila se não processado
                    if (!processed.has(targetKey)) {
                        queue.push(targetSet);
                        processed.add(targetKey);
                    }
                }

                // Adicionar transição
                const targetDfaId = dfaStatesMap.get(targetKey);
                dfaTransitions.push({
                    fromId: currentDfaId,
                    toId: targetDfaId,
                    symbols: [symbol]
                });
            });
        }

        return {
            states: dfaStates,
            transitions: dfaTransitions,
            initialState: 0,
            metadata: {
                convertedFrom: 'nfa',
                originalStates: this.canvas.states.size,
                dfaStates: dfaStates.length,
                reductionRatio: ((1 - dfaStates.length / Math.pow(2, this.canvas.states.size)) * 100).toFixed(1)
            }
        };
    }

    /**
     * Calcula fechamento épsilon de um conjunto de estados
     * @private
     */
    _epsilonClosure(states) {
        const closure = new Set(states);
        const stack = [...states];
        
        while (stack.length > 0) {
            const state = stack.pop();
            
            // Buscar transições épsilon
            const epsilonTransitions = this.canvas.transitions.filter(
                t => t.fromId === state && (t.symbols.includes('ε') || t.symbols.includes('ϵ'))
            );
            
            epsilonTransitions.forEach(t => {
                if (!closure.has(t.toId)) {
                    closure.add(t.toId);
                    stack.push(t.toId);
                }
            });
        }
        
        return closure;
    }

    /**
     * Calcula move(estados, símbolo) com fechamento épsilon
     * @private
     */
    _move(states, symbol) {
        const result = new Set();
        
        // Para cada estado no conjunto
        states.forEach(stateId => {
            // Encontrar transições com o símbolo
            const transitions = this.canvas.transitions.filter(
                t => t.fromId === stateId && t.symbols.includes(symbol)
            );
            
            // Adicionar destinos
            transitions.forEach(t => {
                result.add(t.toId);
            });
        });
        
        // Aplicar fechamento épsilon aos destinos
        return this._epsilonClosure(result);
    }

    /**
     * Extrai alfabeto (símbolos exceto épsilon)
     * @private
     */
    _getAlphabet() {
        const symbols = new Set();
        
        this.canvas.transitions.forEach(t => {
            t.symbols.forEach(s => {
                if (s !== 'ε' && s !== 'ϵ') {
                    symbols.add(s);
                }
            });
        });
        
        return Array.from(symbols).sort();
    }

    /**
     * Gera label para estado AFD baseado nos estados AFN
     * Simplificado: Usa ID sequencial do mapeamento (q0, q1, q2...)
     * @private
     */
    _generateLabel(nfaStates, dfaId) {
        // ✅ CORREÇÃO: Usar ID sequencial do AFD em vez de mostrar composição
        // Exemplo: Estado composto {0,1,2} → q5 (se for o 5º estado criado)
        return `q${dfaId}`;
    }

    /**
     * Verifica se conjunto contém estado de aceitação
     * @private
     */
    _hasAcceptState(nfaStates) {
        for (const stateId of nfaStates) {
            const state = this.canvas.states.get(stateId);
            if (state?.isAccept) return true;
        }
        return false;
    }

    /**
     * Converte Set em string chave única
     * @private
     */
    _setToKey(stateSet) {
        return Array.from(stateSet).sort((a, b) => a - b).join(',');
    }

    /**
     * Aplica conversão AFN→AFD no canvas atual
     */
    applyConversion() {
        try {
            // Validar que é AFN
            const type = this.canvas._detectAutomataType();
            if (type === 'dfa') {
                showNotification('Autômato já é determinístico (AFD)', 'info', 3000);
                return;
            }

            // Converter
            const dfaData = this.nfaToDfa();
            
            // Limpar canvas
            this.canvas.clear();
            
            // Importar AFD
            this.canvas.import(dfaData);
            
            // Notificação
            const msg = `Conversão concluída!\n${dfaData.metadata.originalStates} estados AFN → ${dfaData.metadata.dfaStates} estados AFD`;
            showNotification(msg, 'success', 4000);
            
            console.log('Conversão AFN→AFD:', dfaData.metadata);
        } catch (error) {
            showNotification(`Erro na conversão: ${error.message}`, 'error', 3000);
        }
    }
}
