class TransitionModalManager {
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.modal = null;
        this.overlay = null;
        this.fromId = null;
        this.toId = null;
        this.currentSymbols = [];

        this._initModal();
        this._initEventListeners();
    }

    _initModal() {
        // Criar overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'transition-modal-overlay';
        this.overlay.id = 'transition-modal-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // Criar modal
        this.modal = document.createElement('div');
        this.modal.className = 'transition-modal';
        this.modal.id = 'transition-modal';
        this.modal.innerHTML = `
            <div class="transition-modal-header">
                <h3 class="transition-modal-title">Editar Transição</h3>
                <button class="transition-modal-close" id="transition-modal-close" title="Fechar (ESC)">&times;</button>
            </div>
            
            <div class="transition-modal-body">
                <div class="transition-info">
                    <strong id="transition-from-state">q0</strong>
                    <span style="margin: 0 8px; color: #999;">→</span>
                    <strong id="transition-to-state">q1</strong>
                </div>

                <div class="transition-section">
                    <div class="transition-section-title">Símbolos</div>
                    
                    <div class="symbol-chips" id="symbol-chips">
                        <!-- Chips dinâmicos -->
                    </div>
                    
                    <div class="symbol-input-group">
                        <input type="text" 
                               id="symbol-input" 
                               placeholder="Digite um símbolo (ou ε)" 
                               maxlength="5"
                               autocomplete="off">
                        <button class="btn primary" id="add-symbol-btn">➕ Adicionar</button>
                    </div>
                    
                    <div class="transition-hint">
                        💡 Para épsilon, digite: <code>epsilon</code>, <code>eps</code> ou <code>e</code>
                    </div>
                </div>
            </div>
            
            <div class="transition-modal-footer">
                <button class="btn danger" id="transition-modal-delete" style="margin-right: auto;">🗑️ Deletar Transição</button>
                <button class="btn secondary" id="transition-modal-cancel">Cancelar</button>
                <button class="btn primary" id="transition-modal-save">Salvar</button>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    _initEventListeners() {
        // Fechar modal
        const closeBtn = document.getElementById('transition-modal-close');
        const cancelBtn = document.getElementById('transition-modal-cancel');
        
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        // Salvar
        const saveBtn = document.getElementById('transition-modal-save');
        saveBtn.addEventListener('click', () => this._save());
        
        // Deletar
        const deleteBtn = document.getElementById('transition-modal-delete');
        deleteBtn.addEventListener('click', () => this._delete());

        // Adicionar símbolo
        const addBtn = document.getElementById('add-symbol-btn');
        const input = document.getElementById('symbol-input');
        
        addBtn.addEventListener('click', () => this._addSymbol());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addSymbol();
            }
        });

        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.close();
            }
        });
    }

    /**
     * Abre o modal para editar transições entre dois estados
     * @param {number} fromId - ID do estado de origem
     * @param {number} toId - ID do estado de destino
     */
    open(fromId, toId) {
        this.fromId = fromId;
        this.toId = toId;

        // Obter símbolos atuais
        this.currentSymbols = this.canvas.transitions
            .filter(t => t.fromId === fromId && t.toId === toId)
            .flatMap(t => t.symbols);

        // Atualizar UI
        const fromState = this.canvas.states.get(fromId);
        const toState = this.canvas.states.get(toId);
        
        document.getElementById('transition-from-state').textContent = fromState?.label || `q${fromId}`;
        document.getElementById('transition-to-state').textContent = toState?.label || `q${toId}`;

        this._renderSymbols();

        // Mostrar modal
        this.overlay.style.display = 'block';
        this.modal.style.display = 'block';
        
        // Focar input
        setTimeout(() => {
            document.getElementById('symbol-input').focus();
        }, 100);
    }

    /**
     * Fecha o modal
     */
    close() {
        this.overlay.style.display = 'none';
        this.modal.style.display = 'none';
        this.fromId = null;
        this.toId = null;
        this.currentSymbols = [];
        document.getElementById('symbol-input').value = '';
    }

    /**
     * Adiciona um símbolo à lista
     * @private
     */
    _addSymbol() {
        const input = document.getElementById('symbol-input');
        let symbol = input.value.trim();

        if (!symbol) {
            showNotification('Digite um símbolo válido', 'warning', 1500);
            return;
        }

        // Converter para épsilon se necessário
        symbol = convertToEpsilon(symbol);

        // Validar
        if (!isValidSymbol(symbol) && symbol !== 'ε' && symbol !== 'ϵ') {
            showNotification('Símbolo inválido', 'error', 2000);
            return;
        }

        // Verificar duplicata
        if (this.currentSymbols.includes(symbol)) {
            showNotification('Símbolo já existe', 'warning', 1500);
            return;
        }

        // Adicionar
        this.currentSymbols.push(symbol);
        this._renderSymbols();
        input.value = '';
        input.focus();
    }

    /**
     * Remove um símbolo da lista
     * @param {string} symbol - Símbolo a remover
     * @private
     */
    _removeSymbol(symbol) {
        this.currentSymbols = this.currentSymbols.filter(s => s !== symbol);
        this._renderSymbols();
    }

    /**
     * Renderiza os chips de símbolos
     * @private
     */
    _renderSymbols() {
        const container = document.getElementById('symbol-chips');
        
        if (this.currentSymbols.length === 0) {
            container.innerHTML = '<div class="no-symbols">Nenhum símbolo adicionado</div>';
            return;
        }

        container.innerHTML = this.currentSymbols.map(symbol => `
            <div class="symbol-chip ${symbol === 'ε' || symbol === 'ϵ' ? 'epsilon' : ''}">
                <span class="symbol-chip-text">${symbol}</span>
                <button class="symbol-chip-remove" data-symbol="${symbol}" title="Remover">×</button>
            </div>
        `).join('');

        // Adicionar event listeners aos botões de remover
        container.querySelectorAll('.symbol-chip-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = e.target.getAttribute('data-symbol');
                this._removeSymbol(symbol);
            });
        });
    }

    /**
     * Salva as alterações
     * @private
     */
    _save() {
        if (this.currentSymbols.length === 0) {
            showNotification('Adicione pelo menos um símbolo', 'warning', 2000);
            return;
        }

        // Usar Command Pattern para undo/redo
        if (typeof APP !== 'undefined' && APP.undoRedo) {
            // Remover todas as transições antigas entre estes estados
            const oldTransitions = this.canvas.transitions.filter(
                t => t.fromId === this.fromId && t.toId === this.toId
            );
            
            // Remover velhas
            oldTransitions.forEach(t => {
                const cmd = new DeleteTransitionCommand(this.canvas, t);
                APP.undoRedo.execute(cmd);
            });
            
            // Adicionar novas (uma por símbolo)
            this.currentSymbols.forEach(symbol => {
                const cmd = new AddTransitionCommand(this.canvas, this.fromId, this.toId, [symbol]);
                APP.undoRedo.execute(cmd);
            });
        } else {
            // Fallback sem undo/redo
            const oldTransitions = this.canvas.transitions.filter(
                t => t.fromId === this.fromId && t.toId === this.toId
            );
            oldTransitions.forEach(t => {
                const index = this.canvas.transitions.indexOf(t);
                if (index > -1) this.canvas.transitions.splice(index, 1);
            });

            this.currentSymbols.forEach(symbol => {
                const transition = new TransitionEdge(this.fromId, this.toId, [symbol]);
                this.canvas.transitions.push(transition);
            });

            this.canvas._updateAggregatedEdge(this.fromId, this.toId);
            this.canvas._updateStats();
            this.canvas._updateAutomataTypeUI();
        }

        showNotification('Transição atualizada com sucesso', 'success', 2000);
        this.close();
    }
    
    /**
     * Deleta todas as transições entre os estados
     * @private
     */
    _delete() {
        const fromState = this.canvas.states.get(this.fromId);
        const toState = this.canvas.states.get(this.toId);
        const fromLabel = fromState?.label || `q${this.fromId}`;
        const toLabel = toState?.label || `q${this.toId}`;
        
        if (!confirm(`Deletar transição ${fromLabel} → ${toLabel}?`)) {
            return;
        }
        
        // Deletar todas as transições entre estes estados
        const transitionsToDelete = this.canvas.transitions.filter(
            t => t.fromId === this.fromId && t.toId === this.toId
        );
        
        if (typeof APP !== 'undefined' && APP.undoRedo) {
            transitionsToDelete.forEach(t => {
                const cmd = new DeleteTransitionCommand(this.canvas, t);
                APP.undoRedo.execute(cmd);
            });
        } else {
            // Fallback sem undo/redo
            transitionsToDelete.forEach(t => {
                const index = this.canvas.transitions.indexOf(t);
                if (index > -1) this.canvas.transitions.splice(index, 1);
            });
            this.canvas._updateAggregatedEdge(this.fromId, this.toId);
            this.canvas._updateStats();
        }
        
        showNotification('Transição deletada com sucesso', 'success', 2000);
        this.close();
    }
}
