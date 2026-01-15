// Sistema Undo/Redo usando Command Pattern

// Classe base de comando
class Command {
    constructor(canvas) {
        this.canvas = canvas;
    }

    execute() {
        throw new Error('Método execute() deve ser implementado');
    }

    /**
     * Desfaz o comando
     * @abstract
     */
    undo() {
        throw new Error('Método undo() deve ser implementado');
    }

    /**
     * Descrição do comando
     * @returns {string}
     */
    toString() {
        return 'Command';
    }
}

class AddStateCommand extends Command {
    constructor(canvas, x, y, label = null) {
        super(canvas);
        this.x = x;
        this.y = y;
        this.label = label;
        this.stateId = null;
    }

    execute() {
        const state = this.canvas.addState(this.x, this.y, this.label);
        this.stateId = state.id;
        this.label = state.label; // Salvar label gerado
        return state;
    }

    undo() {
        if (this.stateId !== null) {
            this.canvas.removeState(this.stateId);
        }
    }

    toString() {
        return `Adicionar Estado ${this.label || 'q?'}`;
    }
}

// ===== COMANDO: DELETAR ESTADO =====
class DeleteStateCommand extends Command {
    constructor(canvas, stateId) {
        super(canvas);
        this.stateId = stateId;
        this.stateData = null;
        this.relatedTransitions = [];
    }

    execute() {
        const state = this.canvas.states.get(this.stateId);
        if (!state) return;

        // Salvar dados do estado
        this.stateData = state.toJSON();

        // Salvar transições relacionadas
        this.relatedTransitions = this.canvas.transitions
            .filter(t => t.fromId === this.stateId || t.toId === this.stateId)
            .map(t => t.toJSON());

        // Deletar estado
        this.canvas.removeState(this.stateId);
    }

    undo() {
        if (!this.stateData) return;

        // Recriar estado
        const state = StateNode.fromJSON(this.stateData);
        this.canvas.states.set(state.id, state);

        // Recriar transições
        this.relatedTransitions.forEach(transData => {
            const trans = TransitionEdge.fromJSON(transData);
            this.canvas.transitions.push(trans);
        });

        this.canvas.redraw();
    }

    toString() {
        return `Deletar Estado ${this.stateData?.label || this.stateId}`;
    }
}

class AddTransitionCommand extends Command {
    constructor(canvas, fromId, toId, symbols) {
        super(canvas);
        this.fromId = fromId;
        this.toId = toId;
        this.symbols = symbols;
        this.transitions = [];
    }

    execute() {
        // Criar uma transição SEPARADA para cada símbolo
        this.transitions = [];
        this.symbols.forEach(symbol => {
            const transition = this.canvas.addTransition(this.fromId, this.toId, [symbol]);
            this.transitions.push(transition);
        });
        return this.transitions;
    }

    undo() {
        // Remover todas as transições criadas
        this.transitions.forEach(transition => {
            if (transition) {
                this.canvas.removeTransition(transition);
            }
        });
    }

    toString() {
        const from = this.canvas.states.get(this.fromId);
        const to = this.canvas.states.get(this.toId);
        const symbolStr = this.symbols.join(',');
        return `Adicionar Transição ${from?.label || this.fromId} → ${to?.label || this.toId} [${symbolStr}]`;
    }
}

class DeleteTransitionCommand extends Command {
    constructor(canvas, transition) {
        super(canvas);
        this.transitionData = transition.toJSON();
    }

    execute() {
        const trans = this.canvas.transitions.find(
            t => t.fromId === this.transitionData.fromId && 
                 t.toId === this.transitionData.toId
        );
        if (trans) {
            this.canvas.removeTransition(trans);
        }
    }

    undo() {
        const trans = TransitionEdge.fromJSON(this.transitionData);
        this.canvas.transitions.push(trans);
        this.canvas.redraw();
    }

    toString() {
        return `Deletar Transição`;
    }
}

class MoveStateCommand extends Command {
    constructor(canvas, stateId, oldX, oldY, newX, newY) {
        super(canvas);
        this.stateId = stateId;
        this.oldX = oldX;
        this.oldY = oldY;
        this.newX = newX;
        this.newY = newY;
    }

    execute() {
        this.canvas.updateState(this.stateId, {
            x: this.newX,
            y: this.newY
        });
    }

    undo() {
        this.canvas.updateState(this.stateId, {
            x: this.oldX,
            y: this.oldY
        });
    }

    toString() {
        const state = this.canvas.states.get(this.stateId);
        return `Mover Estado ${state?.label || this.stateId}`;
    }
}

class UpdateStateCommand extends Command {
    constructor(canvas, stateId, oldData, newData) {
        super(canvas);
        this.stateId = stateId;
        this.oldData = oldData;
        this.newData = newData;
    }

    execute() {
        this.canvas.updateState(this.stateId, this.newData);
    }

    undo() {
        this.canvas.updateState(this.stateId, this.oldData);
    }

    toString() {
        return `Atualizar Estado ${this.newData.label || this.stateId}`;
    }
}

class ClearAllCommand extends Command {
    constructor(canvas) {
        super(canvas);
        this.savedData = null;
    }

    execute() {
        // Salvar estado atual
        this.savedData = this.canvas.export();
        this.canvas.clear();
    }

    undo() {
        if (this.savedData) {
            this.canvas.import(this.savedData);
        }
    }

    toString() {
        return 'Limpar Tudo';
    }
}

class UndoRedoManager {
    constructor(canvasManager, maxHistory = 50) {
        this.canvas = canvasManager;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
        this.isExecuting = false;

        this._initKeyboardShortcuts();
        this._updateUI();
    }

    _initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z: Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Shift+Z ou Ctrl+Y: Redo
            else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || 
                     (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
        });
    }

    execute(command) {
        if (this.isExecuting) return;

        this.isExecuting = true;
        command.execute();
        this.isExecuting = false;

        // Adicionar ao histórico de undo
        this.undoStack.push(command);

        // Limitar tamanho do histórico
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        // Limpar redo stack
        this.redoStack = [];

        this._updateUI();
        log(`Executado: ${command.toString()}`, 'log');
    }

    undo() {
        if (this.undoStack.length === 0) {
            showNotification('Nada para desfazer', 'info', 1500);
            return;
        }

        this.isExecuting = true;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        this.isExecuting = false;

        this._updateUI();
        showNotification(`Desfeito: ${command.toString()}`, 'success', 2000);
        log(`Desfeito: ${command.toString()}`, 'log');
    }

    redo() {
        if (this.redoStack.length === 0) {
            showNotification('Nada para refazer', 'info', 1500);
            return;
        }

        this.isExecuting = true;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        this.isExecuting = false;

        this._updateUI();
        showNotification(`Refeito: ${command.toString()}`, 'success', 2000);
        log(`Refeito: ${command.toString()}`, 'log');
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this._updateUI();
        log('Histórico limpo', 'log');
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    getUndoHistory() {
        return this.undoStack.map(cmd => cmd.toString());
    }

    getRedoHistory() {
        return this.redoStack.map(cmd => cmd.toString());
    }

    _updateUI() {
        // Atualizar botões se existirem
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() 
                ? `Desfazer: ${this.undoStack[this.undoStack.length - 1].toString()}` 
                : 'Nada para desfazer';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() 
                ? `Refazer: ${this.redoStack[this.redoStack.length - 1].toString()}` 
                : 'Nada para refazer';
        }
    }

    isExecutingCommand() {
        return this.isExecuting;
    }
}

