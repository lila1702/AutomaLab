/**
 * Utilitários de exportação avançados
 */

class ExportUtils {
    constructor(canvasManager, simulator) {
        this.canvas = canvasManager;
        this.simulator = simulator;
    }

    /**
     * Exporta o canvas como imagem PNG
     * @param {string} filename - Nome do arquivo
     */
    exportAsPNG(filename = 'automato') {
        const png = this.canvas.exportAsPNG();
        const url = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Imagem exportada com sucesso', 'success', 2000);
    }

    /**
     * Exporta descrição textual passo-a-passo da última simulação
     * @returns {string} Texto formatado
     */
    exportStepByStepText() {
        const steps = this.simulator.getStepHistory();
        
        if (!steps || steps.length === 0) {
            showNotification('Nenhuma simulação foi executada', 'warning', 2000);
            return null;
        }

        let text = '=== SIMULAÇÃO PASSO-A-PASSO ===\n\n';
        text += `Autômato: ${APP.automataName || 'Sem nome'}\n`;
        text += `Tipo: ${APP.automataType.toUpperCase()}\n`;
        text += `Total de passos: ${steps.length}\n\n`;

        steps.forEach((step, index) => {
            text += `--- PASSO ${index} ---\n`;
            
            if (step.states) {
                // AFN (múltiplos estados ativos)
                const fromLabels = step.states.map(id => {
                    const state = this.canvas.states.get(id);
                    return state?.label || `q${id}`;
                });
                text += `Estados ativos: {${fromLabels.join(', ')}}\n`;
                text += `Símbolo lido: ${step.symbol || 'início'}\n`;
                
                // Mostrar quais estados são de aceitação
                const acceptStates = step.states.filter(id => 
                    this.canvas.states.get(id)?.isAccept
                ).map(id => this.canvas.states.get(id)?.label || `q${id}`);
                
                if (acceptStates.length > 0) {
                    text += `Estados de aceitação ativos: {${acceptStates.join(', ')}}\n`;
                }
                
                // Mostrar transições tomadas
                if (step.transitions && step.transitions.length > 0) {
                    text += `Transições tomadas:\n`;
                    step.transitions.forEach(t => {
                        const from = this.canvas.states.get(t.from);
                        const to = this.canvas.states.get(t.to);
                        text += `  ${from?.label || `q${t.from}`} --${t.symbol}--> ${to?.label || `q${t.to}`}\n`;
                    });
                }
            } else if (step.state !== undefined) {
                // AFD (estado único)
                const currentState = this.canvas.states.get(step.state);
                const stateLabel = currentState?.label || `q${step.state}`;
                
                text += `Estado atual: ${stateLabel}\n`;
                text += `Símbolo lido: ${step.symbol}\n`;
                
                if (currentState?.isAccept) {
                    text += `Estado de aceitação: Sim\n`;
                }
                
                // Mostrar próximo estado (se não for o último passo)
                if (index < steps.length - 1 && steps[index + 1].state) {
                    const nextState = this.canvas.states.get(steps[index + 1].state);
                    text += `Próximo estado: ${nextState?.label || `q${steps[index + 1].state}`}\n`;
                }
            }
            
            if (step.error) {
                text += `❌ Erro: ${step.error}\n`;
            }
            
            text += `Aceito neste passo: ${step.accepted ? '✅ Sim' : '❌ Não'}\n\n`;
        });

        const lastStep = steps[steps.length - 1];
        text += '=== RESULTADO FINAL ===\n';
        text += lastStep.accepted ? '✅ CADEIA ACEITA\n' : '❌ CADEIA REJEITADA\n';

        return text;
    }

    /**
     * Salva simulação passo-a-passo como arquivo de texto
     * @param {string} filename - Nome do arquivo
     */
    downloadStepByStepText(filename = 'simulacao') {
        const text = this.exportStepByStepText();
        
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Simulação exportada com sucesso', 'success', 2000);
    }

    /**
     * Exporta autômato em formato LaTeX (TikZ)
     * @returns {string} Código LaTeX
     */
    exportAsLaTeX() {
        let latex = '% Autômato gerado pelo AutomaLab\n';
        latex += '\\begin{tikzpicture}[>=stealth\', auto, node distance=3cm]\n\n';

        // Estilos
        latex += '  % Estilos\n';
        latex += '  \\tikzstyle{state} = [circle, draw=blue!60, fill=blue!5, very thick, minimum size=1cm]\n';
        latex += '  \\tikzstyle{accept} = [circle, double, draw=green!60, fill=green!5, very thick, minimum size=1cm]\n\n';

        // Estados
        latex += '  % Estados\n';
        this.canvas.states.forEach((state, id) => {
            const style = state.isAccept ? 'accept' : 'state';
            const x = (state.x / 100).toFixed(2);
            const y = (state.y / 100).toFixed(2);
            latex += `  \\node[${style}] (${state.label}) at (${x}, ${y}) {$${state.label}$};\n`;
        });

        // Estado inicial
        if (this.canvas.initialState !== null) {
            const initial = this.canvas.states.get(this.canvas.initialState);
            latex += `  \\node[left of=${initial.label}] (initial) {};\n`;
        }

        latex += '\n  % Transições\n';
        
        // Agrupar transições
        const grouped = new Map();
        this.canvas.transitions.forEach(t => {
            const key = `${t.fromId}-${t.toId}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(...t.symbols);
        });

        grouped.forEach((symbols, key) => {
            const [fromId, toId] = key.split('-').map(Number);
            const fromState = this.canvas.states.get(fromId);
            const toState = this.canvas.states.get(toId);
            const label = symbols.join(',');

            if (fromId === toId) {
                latex += `  \\path[->] (${fromState.label}) edge [loop above] node {$${label}$} ();\n`;
            } else {
                latex += `  \\path[->] (${fromState.label}) edge node {$${label}$} (${toState.label});\n`;
            }
        });

        // Seta inicial
        if (this.canvas.initialState !== null) {
            const initial = this.canvas.states.get(this.canvas.initialState);
            latex += `  \\path[->] (initial) edge (${initial.label});\n`;
        }

        latex += '\n\\end{tikzpicture}\n';

        return latex;
    }

    /**
     * Salva código LaTeX como arquivo
     * @param {string} filename - Nome do arquivo
     */
    downloadLaTeX(filename = 'automato') {
        const latex = this.exportAsLaTeX();
        const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.tex`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('LaTeX exportado com sucesso', 'success', 2000);
    }
}
