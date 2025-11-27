// ===== CONFIGURAÇÕES DO CANVAS =====
const CONFIG = {
    CANVAS: {
        STATE_RADIUS: 25,
        ARROW_SIZE: 10,
        GRID_SIZE: 40,
        MIN_DISTANCE: 80,
    },

    // Cores do aplicativo
    COLORS: {
        primary: '#2196f3',
        secondary: '#f5f5f5',
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        light: '#e3f2fd',
        dark: '#2c3e50',
        border: '#e0e0e0',
    },

    // Animações
    ANIMATION: {
        DURATION: 300,
        PULSE_DURATION: 600,
        TRANSITION_SPEED: 0.2,
    },

    // Automato
    AUTOMATA: {
        MAX_STATES: 100,
        MAX_SYMBOLS_PER_TRANSITION: 10,
        MAX_CHAIN_LENGTH: 500,
    },

    // Storage
    STORAGE: {
        LOCAL_STORAGE_KEY: 'automata_app_state',
        MAX_SAVED_AUTOMATONS: 10,
    },
};

// ===== MENSAGENS DO APLICATIVO =====
const MESSAGES = {
    // Sucesso
    SUCCESS: {
        STATE_CREATED: 'Estado criado com sucesso',
        STATE_UPDATED: 'Estado atualizado com sucesso',
        STATE_DELETED: 'Estado deletado com sucesso',
        TRANSITION_CREATED: 'Transição criada com sucesso',
        TRANSITION_UPDATED: 'Transição atualizada com sucesso',
        TRANSITION_DELETED: 'Transição deletada com sucesso',
        AUTOMATA_EXPORTED: 'Autômato exportado com sucesso',
        AUTOMATA_IMPORTED: 'Autômato importado com sucesso',
        AUTOMATA_CLEARED: 'Autômato limpo com sucesso',
    },

    // Erros
    ERROR: {
        NO_STATES: 'Nenhum estado foi criado',
        NO_INITIAL_STATE: 'Nenhum estado inicial foi definido',
        NO_CANVAS: 'Canvas não encontrado',
        INVALID_STATE_NAME: 'Nome de estado inválido',
        INVALID_SYMBOLS: 'Símbolos inválidos',
        INVALID_JSON: 'JSON inválido',
        MAX_STATES_REACHED: 'Número máximo de estados atingido',
        DUPLICATE_STATE_NAME: 'Já existe um estado com este nome',
    },

    // Simulação
    SIMULATOR: {
        CHAIN_ACCEPTED: '✓ Cadeia ACEITA',
        CHAIN_REJECTED: '✗ Cadeia REJEITADA',
        EMPTY_CHAIN: 'Cadeia vazia',
        NO_TRANSITION: 'Sem transição disponível',
    },

    // Confirmações
    CONFIRM: {
        DELETE_STATE: 'Tem certeza que deseja deletar este estado?',
        DELETE_TRANSITION: 'Tem certeza que deseja deletar esta transição?',
        DELETE_ALL: 'Tem certeza que deseja deletar TUDO? Esta ação não pode ser desfeita!',
        CLEAR_TRANSITIONS: 'Deletar todas as transições deste estado?',
    },

    // Informações
    INFO: {
        SELECT_MODE: 'Modo: Seleção',
        ADD_STATE_MODE: 'Modo: Adicionar Estado',
        ADD_TRANSITION_MODE: 'Modo: Adicionar Transição',
        SELECT_STATE_FOR_TRANSITION: 'Selecione o estado de destino para a transição',
    },
};

// ===== MODOS DE OPERAÇÃO =====
const MODES = {
    SELECT: 'select',
    ADD_STATE: 'add-state',
    ADD_TRANSITION: 'add-transition',
    DRAG: 'drag',
};

// ===== TIPOS DE AUTÔMATO =====
const AUTOMATA_TYPES = {
    DFA: 'dfa',
    NFA: 'nfa',
};

// ===== TIPOS DE EVENTOS =====
const EVENTS = {
    // Canvas
    CANVAS_STATE_CREATED: 'canvas:stateCreated',
    CANVAS_STATE_DELETED: 'canvas:stateDeleted',
    CANVAS_STATE_UPDATED: 'canvas:stateUpdated',
    CANVAS_TRANSITION_CREATED: 'canvas:transitionCreated',
    CANVAS_TRANSITION_DELETED: 'canvas:transitionDeleted',
    CANVAS_CLEARED: 'canvas:cleared',

    // UI
    MODE_CHANGED: 'ui:modeChanged',
    STATE_SELECTED: 'ui:stateSelected',
    STATE_DESELECTED: 'ui:stateDeselected',
    MODAL_OPENED: 'ui:modalOpened',
    MODAL_CLOSED: 'ui:modalClosed',

    // Simulador
    SIMULATION_STARTED: 'simulator:started',
    SIMULATION_COMPLETED: 'simulator:completed',
    SIMULATION_ERROR: 'simulator:error',

    // Storage
    DATA_SAVED: 'storage:dataSaved',
    DATA_LOADED: 'storage:dataLoaded',
};

// ===== CHAVES DO LOCAL STORAGE =====
const STORAGE_KEYS = {
    AUTOMATA: 'automata',
    AUTOMATA_LIST: 'automata_list',
    USER_PREFERENCES: 'user_preferences',
};

// ===== CARACTERES ESPECIAIS =====
const SPECIAL_CHARS = {
    EPSILON: 'ε',
    EMPTY: '',
    SEPARATOR: ',',
    ARROW: '→',
    DOUBLE_CIRCLE: '◯◯',
};

// ===== VALIDAÇÃO =====
const VALIDATION = {
    STATE_NAME_REGEX: /^[a-zA-Z0-9_]+$/,
    SYMBOL_REGEX: /^[a-zA-Z0-9_εϵ]$/,
    CHAIN_REGEX: /^[a-zA-Z0-9_εϵ,]*$/,
};

// ===== EXPORTAR PARA USO GLOBAL =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        MESSAGES,
        MODES,
        AUTOMATA_TYPES,
        EVENTS,
        STORAGE_KEYS,
        SPECIAL_CHARS,
        VALIDATION,
    };
}