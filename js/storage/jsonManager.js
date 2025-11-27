class JSONManager {
    /**
     * Cria um novo gerenciador de JSON
     * @param {CanvasManager} canvasManager - Gerenciador do canvas
     */
    constructor(canvasManager) {
        this.canvas = canvasManager;
    }

    /**
     * Exporta autômato para JSON
     * @param {string} name - Nome do autômato
     * @param {string} type - Tipo do autômato ('dfa' ou 'nfa')
     * @returns {string} String JSON
     */
    exportToJSON(name = 'Autômato', type = 'dfa') {
        const data = {
            name: name,
            type: type,
            createdAt: new Date().toISOString(),
            states: Array.from(this.canvas.states.values()).map(s => s.toJSON()),
            transitions: this.canvas.transitions.map(t => t.toJSON()),
            initialState: this.canvas.initialState,
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Importa autômato do JSON
     * @param {string} jsonString - String JSON
     * @returns {Object} Dados importados
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this._validateJSON(data);
            this.canvas.import(data);
            return data;
        } catch (error) {
            throw new Error(`${MESSAGES.ERROR.INVALID_JSON}: ${error.message}`);
        }
    }

    /**
     * Valida estrutura do JSON
     * @private
     */
    _validateJSON(data) {
        if (!data.states || !Array.isArray(data.states)) {
            throw new Error('Campo "states" não encontrado ou inválido');
        }
        if (!data.transitions || !Array.isArray(data.transitions)) {
            throw new Error('Campo "transitions" não encontrado ou inválido');
        }
        if (data.initialState === undefined) {
            throw new Error('Campo "initialState" não encontrado');
        }
    }

    /**
     * Salva autômato no localStorage
     * @param {string} name - Nome do autômato
     * @param {string} automataName - Nome do autômato para salvamento
     * @param {string} type - Tipo do autômato
     */
    saveToLocalStorage(name, automataName, type) {
        const json = this.exportToJSON(automataName, type);
        const savedAutomata = this._getSavedList();

        // Criar entrada
        const entry = {
            id: generateUUID(),
            name: name,
            automataName: automataName,
            type: type,
            data: json,
            savedAt: new Date().toISOString(),
        };

        // Limitar número de salvamentos
        if (savedAutomata.length >= CONFIG.STORAGE.MAX_SAVED_AUTOMATONS) {
            savedAutomata.shift();
        }

        savedAutomata.push(entry);
        localStorage.setItem(CONFIG.STORAGE.LOCAL_STORAGE_KEY, JSON.stringify(savedAutomata));

        return entry.id;
    }

    /**
     * Carrega autômato do localStorage
     * @param {string} id - ID do autômato
     * @returns {Object} Dados do autômato
     */
    loadFromLocalStorage(id) {
        const savedAutomata = this._getSavedList();
        const entry = savedAutomata.find(a => a.id === id);

        if (!entry) {
            throw new Error('Autômato não encontrado');
        }

        this.importFromJSON(entry.data);
        return entry;
    }

    /**
     * Obtém lista de autômatos salvos
     * @returns {Array} Lista de autômatos
     */
    getSavedAutomata() {
        return this._getSavedList();
    }

    /**
     * Deleta autômato do localStorage
     * @param {string} id - ID do autômato
     */
    deleteFromLocalStorage(id) {
        const savedAutomata = this._getSavedList();
        const filtered = savedAutomata.filter(a => a.id !== id);
        localStorage.setItem(CONFIG.STORAGE.LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }

    /**
     * Obtém lista do localStorage
     * @private
     */
    _getSavedList() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE.LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar lista do localStorage:', error);
            return [];
        }
    }

    /**
     * Exporta como arquivo
     * @param {string} filename - Nome do arquivo
     * @param {string} automataName - Nome do autômato
     * @param {string} type - Tipo do autômato
     */
    downloadAsFile(filename, automataName, type) {
        const json = this.exportToJSON(automataName, type);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Importa de arquivo
     * @param {File} file - Arquivo JSON
     * @returns {Promise<Object>} Dados importados
     */
    uploadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const json = event.target.result;
                    const data = this.importFromJSON(json);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Cria um formato CSV com informações do autômato
     * @returns {string} String CSV
     */
    exportAsCSV() {
        let csv = 'Estados\n';
        csv += 'ID,Label,Inicial,Aceitação\n';

        this.canvas.states.forEach(state => {
            csv += `${state.id},${state.label},${state.isInitial},${state.isAccept}\n`;
        });

        csv += '\nTransições\n';
        csv += 'De,Para,Símbolos\n';

        this.canvas.transitions.forEach(t => {
            const from = this.canvas.states.get(t.fromId);
            const to = this.canvas.states.get(t.toId);
            csv += `${from.label},${to.label},"${t.symbols.join(',')}"\n`;
        });

        return csv;
    }

    /**
     * Cria representação em texto
     * @returns {string} Representação textual
     */
    exportAsText() {
        let text = '=== AUTÔMATO ===\n\n';

        text += 'ESTADOS:\n';
        this.canvas.states.forEach(state => {
            let markers = [];
            if (state.isInitial) markers.push('Inicial');
            if (state.isAccept) markers.push('Aceitação');
            const markerStr = markers.length > 0 ? ` [${markers.join(', ')}]` : '';
            text += `  ${state.label}${markerStr}\n`;
        });

        text += '\nTRANSIÇÕES:\n';
        this.canvas.transitions.forEach(t => {
            const from = this.canvas.states.get(t.fromId);
            const to = this.canvas.states.get(t.toId);
            text += `  ${from.label} --${t.symbols.join('/')}--> ${to.label}\n`;
        });

        text += '\n';
        text += `Estado Inicial: ${this.canvas.initialState !== null ? this.canvas.states.get(this.canvas.initialState).label : 'Nenhum'}\n`;

        return text;
    }
}