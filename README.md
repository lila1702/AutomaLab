# AutomaLab

**Editor web interativo de Autômatos Finitos para fins didáticos**

## Sobre o Projeto

AutomaLab é uma ferramenta web para criar, visualizar, editar, simular e analisar **Autômatos Finitos** (no momento, AFD e AFND). Está planejado para ele também conseguir manusear Autômatos com Pilha (PDA) e Máquinas de Turing. Inspirado pelo JFLAP, o AutomaLab foca em simplicidade e usabilidade para estudantes da disciplina de **Linguagens Formais e Autômatos (LFA)**, especialmente na Universidade Federal do Ceará (UFC).

### Principais Características

- Interface Visual Intuitiva: Drag-and-drop de estados
- Simulação em Tempo Real: Teste cadeias instantaneamente
- Export/Import JSON: Salve e compartilhe seus autômatos
- Undo/Redo Completo: Desfaça e refaça qualquer ação
- Zoom e Pan: Navegue em autômatos grandes
- Atalhos de Teclado: Para facilitar o manuseio

---

## Como Usar

### Opção 1: Abrir Direto no Navegador

1. Acesse a página: "https://automa-lab.vercel.app/""

### Opção 2: Clonar repositório e rodar localmente

1. Baixe ou clone este repositório
2. Abra o arquivo `index.html` no seu navegador
3. Pronto! Nenhuma instalação ou servidor necessário

```bash
git clone https://github.com/lila1702/AutomaLab.git
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

### Arquivo
| Atalho | Ação |
|--------|------|
| `Ctrl+E` | Exportar JSON |
| `Ctrl+I` | Importar JSON |

### Visualização
| Atalho | Ação |
|--------|------|
| `Scroll` | Zoom In/Out |
| `Ctrl++` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |
| `Shift+Click` ou `Botão do Meio` | Pan (arrastar canvas) |

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

## Funcionalidades Implementadas

### Completo (90%)

- [x] Criar, editar e deletar estados
- [x] Criar, editar e deletar transições
- [x] Marcar estado inicial e de aceitação
- [x] Simulação de AFD (Determinístico)
- [x] Simulação de AFN (Não-determinístico)
- [x] Feedback visual de aceitação/rejeição
- [x] Export/Import JSON
- [x] Drag-and-drop de estados
- [x] Undo/Redo completo
- [x] Zoom in/out com scroll
- [x] Pan (arrastar canvas)
- [x] Context menu (clique direito)
- [x] Validação de entrada
- [x] Atalhos de teclado
- [x] Interface responsiva
- [x] Snap to grid (opcional)

### Pendente (10%)

- [ ] Conversão AFN → AFD
- [ ] Minimização de autômatos
- [ ] Detecção de equivalência
- [ ] Animação passo-a-passo visual
- [ ] Múltiplas transições paralelas
- [ ] Gramáticas formais
- [ ] Autômatos com pilha (PDA)
- [ ] Máquinas de Turing
- [ ] Testes automatizados

---

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/seu-usuario/automalab/issues) com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots (se aplicável)

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

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 AutomaLab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👨‍💻 Autor

**Lila Maria**
- GitHub: [@lila1702](https://github.com/lila1702)
- Email: lila.msfrazao@gmail.com

---

## 🌟 Agradecimentos

- Inspirado no [JFLAP](http://www.jflap.org/)
- Baseado nos requisitos de disciplinas de LFA
- Ao professor Cenez Araújo de Andrade

---

## 🚀 Próximos Passos

1. **v0.1.1** - Animação visual passo-a-passo
2. **v0.2** - Adição de épsilum, conversão AFND→AFD e minimização
3. **v0.3** - Gramáticas formais
4. **v0.4** - Autômatos com pilha (PDA)
5. **v0.5** - Máquinas de Turing