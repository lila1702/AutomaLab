# AutomaLab

![Status](https://img.shields.io/badge/Status-Completo-brightgreen)
![Versão](https://img.shields.io/badge/Versão-1.0-blue)
![Licença](https://img.shields.io/badge/Licença-MIT-green)

**Editor web interativo de Autômatos Finitos para fins didáticos**

## Sobre o Projeto

AutomaLab é uma ferramenta web para criar, visualizar, editar, simular e analisar **Autômatos Finitos** (AFD e AFN). Desenvolvido para a disciplina de **Linguagens Formais e Autômatos (LFA)** da Universidade Federal do Ceará (UFC), o AutomaLab oferece uma interface visual moderna e intuitiva para o estudo de teoria da computação.

### Principais Características

- ✨ **Interface Visual Intuitiva**: Drag-and-drop de estados com Cytoscape.js
- 🎯 **Simulação Completa**: AFD e AFN com fechamento épsilon
- 🎬 **Animação Step-by-Step**: Visualize passo a passo como a cadeia é processada
- 📊 **Análise Avançada**: Detecta estados inalcançáveis, deadlocks, valida determinismo
- 🔄 **Conversão AFN→AFD**: Construção por subconjuntos automática
- 💾 **Export Múltiplo**: JSON, PNG, Texto (simulação detalhada)
- ⚡ **Undo/Redo Completo**: Command Pattern com 50 níveis de histórico
- ⌨️ **Atalhos de Teclado**: Workflow otimizado para produtividade
- 🎨 **UI Moderna**: Modais com chips, notificações toast, animações suaves

---

## Como Usar

### Opção 1: Abrir Direto no Navegador

1. Acesse a página: "https://automa-lab.vercel.app/""

### Opção 2: Clonar repositório e rodar localmente

1. Baixe ou clone este repositório
2. Abra o arquivo `index.html` no seu navegador
3. Pronto! Nenhuma instalação ou servidor necessário

```bash
# Clone o repositório
git clone https://github.com/lila1702/AutomaLab.git

# Entre na pasta
cd AutomaLab

# Abra o index.html no navegador
# Nenhuma instalação ou servidor necessário!
```

---

## Tutorial Rápido

### Criar um Autômato Simples

1. **Adicionar Estados**
   - Clique em "➕ Estado" na toolbar
   - Clique no canvas onde deseja criar
   - Estados são criados automaticamente (q0, q1, q2...)

2. **Editar Estado**
   - Clique direito no estado
   - Marque como "Inicial" e/ou "Aceitação"
   - Renomeie se desejar
   - Clique "Salvar"

3. **Adicionar Transições**
   - Clique em "🔗 Transição"
   - Clique no estado **origem**
   - Clique no estado **destino**
   - Digite os símbolos separados por vírgula: `a,b`
   - Pressione OK

4. **Simular Cadeia**
   - No painel "Simulador", digite uma cadeia: `aabb`
   - Clique "▶ Simular"
   - Veja se foi aceita ou rejeitada

## Atalhos de Teclado

### Modos de Operação
| Atalho | Ação |
|--------|------|
| `Alt+S` | Modo Selecionar |
| `Alt+A` | Modo Adicionar Estado |
| `Alt+T` | Modo Adicionar Transição |

### Histórico
| Atalho | Ação |
|--------|------|
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` ou `Ctrl+Shift+Z` | Refazer |

### Arquivo e Exportação
| Atalho | Ação |
|--------|------|
| `Ctrl+E` | Exportar JSON |
| `Ctrl+I` | Importar JSON |
| `Ctrl+Shift+E` | Exportar PNG |

### Visualização
| Atalho | Ação |
|--------|------|
| `Scroll` | Zoom In/Out |
| `F` | Fit View (ajustar visualização) |
| `Ctrl+G` | Mostrar/Ocultar Grade |
| `Ctrl+Shift+S` | Ativar/Desativar Snap to Grid |

### Análise e Validação
| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+V` | Validar Autômato |

### Outros
| Atalho | Ação |
|--------|------|
| `ESC` | Cancelar ação / Fechar modal |
| `Enter` | Simular cadeia (no input) |

---

## Arquitetura

### Padrão MVC Adaptado

```
┌─────────────────────────────────────┐
│          main.js (Controller)        │
│     Orquestra todos os módulos       │
└──────────────┬──────────────────────┘
               │
     ┌─────────┼─────────┬──────────┐
     │         │         │          │
┌────▼───┐ ┌──▼───┐ ┌──▼──────┐ ┌─▼────┐
│Canvas  │ │ UI   │ │Simulator│ │Storage│
│Manager │ │      │ │         │ │       │
└────┬───┘ └──────┘ └─────────┘ └───────┘
     │
     ├─────────┬─────────────┐
     │         │             │
┌────▼────┐ ┌─▼──────┐ ┌───▼─────────┐
│StateNode│ │Transition│ │ContextModal│
└─────────┘ └─────────┘ └─────────────┘
```

---

## 📊 Funcionalidades Implementadas

### ✅ Core Funcional (100%)

- Criar, editar e deletar estados
- Criar, editar e deletar transições (via modal com chips)
- Marcar estado inicial e de aceitação
- Drag-and-drop de estados (Cytoscape nativo)
- Context menu (clique direito) para edição rápida
- Export/Import JSON completo
- Responsividade total
- Snap to Grid (alinhamento opcional)

### ✅ Simulação (100%)

- Simulação de AFD (Determinístico)
- Simulação de AFN (Não-determinístico) com exploração exaustiva
- Feedback visual de aceitação/rejeição
- Transições epsilon (ε) com fechamento épsilon correto
- Detecção automática de tipo (AFD/AFN)
- **Animação step-by-step com TapeManager** (velocidade ajustável)
- Exportação de simulação em texto detalhado

### ✅ Conversão (100%)

- AFN → AFD (construção por subconjuntos)
- Suporte completo a épsilon-closure
- Labels simplificados (q0, q1... em vez de q{1,2,3})

### ✅ Validações (100%)

- Validação de AFD vs AFN (automática)
- Detecção de estados inalcançáveis
- Detecção de deadlocks
- Análise de alfabeto
- Relatório completo de problemas

### ✅ Histórico (100%)

- Undo/Redo completo (Command Pattern)
- Até 50 ações no histórico
- Restauração perfeita de transições deletadas
- Sincronização com interface

### ✅ Exportação (100%)

- Export JSON (preserva multi-símbolos)
- Export PNG (2x resolution, fundo branco)
- Export Texto (simulação passo-a-passo detalhada)

### ✅ UI/UX (100%)

- Modal de edição de transições com chips (azul=ativo, vermelho=deletar)
- Context menu visual moderno
- Atalhos de teclado completos
- Notificações toast informativas
- Controles de zoom e navegação
- Fita de simulação animada com controles (play, pause, next, previous)

---

## 🔧 Correções e Melhorias (Última Atualização: 16/01/2026)

### Bugs Corrigidos

1. **Importação de Transições Multi-Símbolo** ✅
   - **Problema:** JSON exportava `["a", "b", "ε"]` mas importação criava só 1 transição
   - **Solução:** Método `import()` agora itera sobre cada símbolo e cria transições separadas

2. **Simulação AFN Rejeitando Incorretamente** ✅
   - **Problema:** AFN rejeitava cadeias aceitas pelo AFD convertido
   - **Solução:** Fechamento épsilon aplicado **antes** de processar cada símbolo

3. **Detecção de Tipo Automática** ✅
   - **Problema:** Usuário precisava selecionar AFD/AFN manualmente
   - **Solução:** Sistema detecta automaticamente baseado em épsilon e não-determinismo

4. **Undo não Restaurava Transições** ✅
   - **Problema:** Ctrl+Z após deletar transição não restaurava visual
   - **Solução:** `DeleteTransitionCommand.undo()` chama `_updateAggregatedEdge()`

5. **Labels Confusos na Conversão** ✅
   - **Problema:** Estados convertidos mostravam `q{1,2,3,4}` (confuso)
   - **Solução:** Labels simplificados para `q0, q1, q2...` sequenciais

6. **Modal da Fita Cortado** ✅
   - **Problema:** Conteúdo inferior da fita não era visível
   - **Solução:** Altura aumentada de 240px → 320px

---

## 🧪 Testes

Veja o arquivo [CASOS_DE_TESTE.md](CASOS_DE_TESTE.md) para uma suíte completa de 19 casos de teste cobrindo:
- Criação de AFD e AFN
- Épsilon-transições
- Conversão AFN→AFD
- Undo/Redo
- Validação
- Export/Import
- Animação step-by-step
- Edge cases

---

## 📚 Recursos Educacionais

### Conceitos Implementados

#### Autômato Finito Determinístico (AFD)
- Um único estado inicial
- Para cada estado e símbolo, **no máximo uma transição**
- Aceita se termina em estado de aceitação

#### Autômato Finito Não-Determinístico (AFN)
- Um único estado inicial
- Para cada estado e símbolo, **múltiplas transições possíveis**
- Aceita se **algum caminho** leva a estado de aceitação

### Algoritmos

#### Simulação AFD
```
1. Iniciar no estado inicial
2. Para cada símbolo da cadeia:
   a. Buscar transição com o símbolo
   b. Se não existe → REJEITAR
   c. Mover para próximo estado
3. Se estado final é de aceitação → ACEITAR
4. Senão → REJEITAR
```

#### Simulação AFND
```
1. Conjunto de estados ativos = {estado inicial}
2. Para cada símbolo:
   a. Para cada estado ativo:
      - Encontrar todas transições possíveis
      - Adicionar destinos ao próximo conjunto
   b. Se conjunto vazio → REJEITAR
   c. Estados ativos = próximo conjunto
3. Se algum estado ativo é de aceitação → ACEITAR
4. Senão → REJEITAR
```

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo LICENSE para mais detalhes.

---

## 👨‍💻 Autor

**Lila Maria**
- GitHub: [@lila1702](https://github.com/lila1702)
- Email: lila.msfrazao@gmail.com

---

## 🌟 Agradecimentos

- **Orientação:** Prof. Cenez Araújo de Andrade (UFC)
- **Tecnologias:** Cytoscape.js, Vanilla JavaScript
- **Disciplina:** LFA - Linguagens Formais e Autômatos (UFC)

---

**Desenvolvido em Janeiro de 2026 para a disciplina de Linguagens Formais e Autômatos**
