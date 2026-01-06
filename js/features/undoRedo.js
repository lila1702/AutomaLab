/**
 * ===== UNDO/REDO SYSTEM =====
 * 
 * Arquivo: js/features/undoRedo.js
 * 
 * PROPÓSITO:
 * Implementa sistema de desfazer/refazer ações no canvas.
 * Permite reverter e repetir operações como criar/deletar estados,
 * adicionar/remover transições, mover estados, etc.
 * 
 * PADRÃO DE DESIGN:
 * Command Pattern - cada ação é um comando que pode ser executado/revertido
 * 
 * FUNCIONALIDADES:
 * - Undo (Ctrl+Z): Desfazer última ação
 * - Redo (Ctrl+Y): Refazer ação desfeita
 * - Histórico com limite configurável
 * - Comandos: AddState, DeleteState, AddTransition, MoveState, etc.
 * 
 * COMO USAR:
 * 1. Incluir este arquivo no HTML
 * 2. Inicializar: const undoRedo = new UndoRedoManager(canvasManager);
 * 3. Registrar ações: undoRedo.execute(new AddStateCommand(...))
 * 4. Desfazer: undoRedo.undo()
 * 5. Refazer: undoRedo.redo()
 */

// ===== CLASSE BASE DE COMANDO =====
class Command {
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * Executa o comando
     * @abstract
     */
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

// ===== COMANDO: ADICIONAR ESTADO =====
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

// ===== COMANDO: ADICIONAR TRANSIÇÃO =====
class AddTransitionCommand extends Command {
    constructor(canvas, fromId, toId, symbols) {
        super(canvas);
        this.fromId = fromId;
        this.toId = toId;
        this.symbols = symbols;
        this.transition = null;
    }

    execute() {
        this.transition = this.canvas.addTransition(this.fromId, this.toId, this.symbols);
        return this.transition;
    }

    undo() {
        if (this.transition) {
            this.canvas.removeTransition(this.transition);
        }
    }

    toString() {
        const from = this.canvas.states.get(this.fromId);
        const to = this.canvas.states.get(this.toId);
        return `Adicionar Transição ${from?.label || this.fromId} → ${to?.label || this.toId}`;
    }
}

// ===== COMANDO: DELETAR TRANSIÇÃO =====
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

// ===== COMANDO: MOVER ESTADO =====
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

// ===== COMANDO: ATUALIZAR ESTADO =====
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

// ===== COMANDO: LIMPAR TUDO =====
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

// ===== GERENCIADOR DE UNDO/REDO =====
class UndoRedoManager {
    /**
     * Cria um novo gerenciador de undo/redo
     * @param {CanvasManager} canvasManager - Gerenciador do canvas
     * @param {number} maxHistory - Tamanho máximo do histórico
     */
    constructor(canvasManager, maxHistory = 50) {
        this.canvas = canvasManager;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
        this.isExecuting = false;

        this._initKeyboardShortcuts();
        this._updateUI();
    }

    /**
     * Inicializa atalhos de teclado
     * @private
     */
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

    /**
     * Executa um comando e adiciona ao histórico
     * @param {Command} command - Comando a executar
     */
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

    /**
     * Desfaz última ação
     */
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

    /**
     * Refaz última ação desfeita
     */
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

    /**
     * Limpa todo o histórico
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this._updateUI();
        log('Histórico limpo', 'log');
    }

    /**
     * Verifica se pode desfazer
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Verifica se pode refazer
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Obtém histórico de undo
     * @returns {Array<Command>}
     */
    getUndoHistory() {
        return this.undoStack.map(cmd => cmd.toString());
    }

    /**
     * Obtém histórico de redo
     * @returns {Array<Command>}
     */
    getRedoHistory() {
        return this.redoStack.map(cmd => cmd.toString());
    }

    /**
     * Atualiza UI (botões, etc.)
     * @private
     */
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

    /**
     * Verifica se está executando comando
     * @returns {boolean}
     */
    isExecutingCommand() {
        return this.isExecuting;
    }
}

/**
 * EXEMPLO DE USO:
 * 
 * // No main.js, após criar CanvasManager:
 * APP.undoRedo = new UndoRedoManager(APP.canvas);
 * 
 * // Ao adicionar estado:
 * const cmd = new AddStateCommand(APP.canvas, x, y);
 * APP.undoRedo.execute(cmd);
 * 
 * // Ao deletar estado:
 * const cmd = new DeleteStateCommand(APP.canvas, stateId);
 * APP.undoRedo.execute(cmd);
 * 
 * // Ao mover estado:
 * const cmd = new MoveStateCommand(APP.canvas, stateId, oldX, oldY, newX, newY);
 * APP.undoRedo.execute(cmd);
 * 
 * // Desfazer/Refazer:
 * APP.undoRedo.undo();
 * APP.undoRedo.redo();
 * 
 * // Verificar status:
 * console.log('Pode desfazer?', APP.undoRedo.canUndo());
 * console.log('Histórico:', APP.undoRedo.getUndoHistory());
 */

/**
 * BOTÕES NA TOOLBAR (adicionar ao HTML):
 * 
 * <button class="toolbar-btn" id="btn-undo" disabled>
 *   ↩️ Desfazer
 * </button>
 * <button class="toolbar-btn" id="btn-redo" disabled>
 *   ↪️ Refazer
 * </button>
 */