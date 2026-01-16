# Casos de Teste - AutomaLab

Este documento contém casos de teste para validação do AutomaLab.

## 🧪 Testes Básicos de Criação

### Teste 1: Criar Autômato Finito Determinístico (AFD)
**Objetivo:** Verificar criação básica de AFD

**Passos:**
1. Clique em "➕ Estado" e crie 3 estados no canvas
2. Clique direito no primeiro estado → Marcar como "Inicial"
3. Clique direito no terceiro estado → Marcar como "Aceitação"
4. Clique em "🔗 Transição" 
5. Crie transições:
   - q0 --a--> q1
   - q1 --b--> q2
6. No simulador, teste a cadeia `ab`

**Resultado Esperado:** 
- ✅ Cadeia "ab" deve ser **ACEITA**
- ❌ Cadeia "a" deve ser **REJEITADA**
- ❌ Cadeia "ba" deve ser **REJEITADA**

---

### Teste 2: Criar Autômato Finito Não-Determinístico (AFN)
**Objetivo:** Verificar não-determinismo e múltiplas transições

**Passos:**
1. Crie 3 estados (q0 inicial, q2 aceitação)
2. Crie transições:
   - q0 --a--> q1 (primeira rota)
   - q0 --a--> q2 (segunda rota - não-determinismo!)
   - q1 --b--> q2
3. Mude o dropdown para "AFN (Não-Determinístico)"
4. Simule a cadeia `a`

**Resultado Esperado:**
- ✅ Cadeia "a" deve ser **ACEITA** (rota q0→q2)
- ✅ Cadeia "ab" deve ser **ACEITA** (rota q0→q1→q2)

---

## 🔬 Testes de Épsilon-Transições

### Teste 3: AFN com Transição Vazia (ε)
**Objetivo:** Validar fechamento épsilon

**Passos:**
1. Crie 4 estados (q0 inicial, q3 aceitação)
2. Crie transições:
   - q0 --ε--> q1 (transição vazia)
   - q1 --a--> q2
   - q2 --b--> q3
3. No campo de símbolos, digite "epsilon" para criar transição ε
4. Simule a cadeia `ab`

**Resultado Esperado:**
- ✅ Cadeia "ab" deve ser **ACEITA** (caminho: q0→q1→q2→q3 via ε)
- ❌ Cadeia "a" deve ser **REJEITADA**

---

### Teste 4: Múltiplas Transições Épsilon Encadeadas
**Objetivo:** Testar fechamento épsilon profundo

**Passos:**
1. Crie 5 estados (q0 inicial, q4 aceitação)
2. Crie transições:
   - q0 --ε--> q1
   - q1 --ε--> q2
   - q2 --a--> q3
   - q3 --ε--> q4
3. Simule `a`

**Resultado Esperado:**
- ✅ Cadeia "a" deve ser **ACEITA** (q0→q1→q2→q3→q4)

---

## 🔄 Testes de Conversão AFN→AFD

### Teste 5: Converter AFN Simples para AFD
**Objetivo:** Validar algoritmo de construção por subconjuntos

**Passos:**
1. Crie AFN:
   - q0 (inicial) --a--> q1
   - q0 --a--> q2 (não-determinismo)
   - q1 --b--> q3 (aceitação)
   - q2 --c--> q3
2. Clique em "🔄 Converter → AFD"
3. Observe os novos estados criados (q0, q1, q2...)
4. Simule `ab` e `ac` no AFD convertido

**Resultado Esperado:**
- ✅ Ambas cadeias devem ser **ACEITAS**
- Estados compostos foram convertidos em q0, q1, q2 (labels simples)

---

## ⏪ Testes de Undo/Redo

### Teste 6: Desfazer e Refazer Ações
**Objetivo:** Validar sistema de histórico

**Passos:**
1. Crie um estado q0
2. Pressione **Ctrl+Z** (desfazer)
3. Pressione **Ctrl+Y** ou **Ctrl+Shift+Z** (refazer)
4. Crie uma transição q0→q1 com símbolo "a"
5. Clique na transição, abra modal, clique "Deletar"
6. Pressione **Ctrl+Z** (desfazer deleção)

**Resultado Esperado:**
- Estado desaparece ao desfazer, reaparece ao refazer
- Transição deletada retorna ao canvas após Ctrl+Z

---

## 📊 Testes de Validação

### Teste 7: Detectar Problemas no Autômato
**Objetivo:** Validar relatório de análise

**Passos:**
1. Crie autômato:
   - q0 (inicial) --a--> q1
   - q1 --b--> q2
   - q3 (isolado, sem conexões)
2. Clique em "✓ Validar Autômato"

**Resultado Esperado:**
- ⚠️ Relatório mostra:
  - Estado q3 inalcançável
  - Estado q2 sem transições de saída (deadlock)
  - Sem estado de aceitação definido

---

## 💾 Testes de Exportação/Importação

### Teste 8: Export e Import JSON
**Objetivo:** Garantir persistência de dados

**Passos:**
1. Crie um autômato completo (estados, transições, inicial, aceitação)
2. Clique em "💾 Exportar JSON"
3. Limpe todo o canvas ("🗑️ Limpar Tudo")
4. Clique em "📂 Importar JSON" e selecione o arquivo exportado

**Resultado Esperado:**
- ✅ Autômato restaurado exatamente como antes
- Todas as transições multi-símbolo preservadas
- Estado inicial e de aceitação corretos

---

### Teste 9: Exportar Simulação Detalhada
**Objetivo:** Verificar export de passos de simulação

**Passos:**
1. Crie AFN com épsilon-transições
2. Simule uma cadeia complexa: `aabba`
3. Durante a animação, clique em "📄 Exportar Simulação"
4. Abra o arquivo `.txt` gerado

**Resultado Esperado:**
- Arquivo contém:
  - Estado inicial
  - Cada passo (símbolo lido, transições tomadas, estados ativos)
  - Épsilon-transições destacadas
  - Resultado final (aceita/rejeita)

---

### Teste 10: Exportar Como PNG
**Objetivo:** Validar captura visual

**Passos:**
1. Organize visualmente um autômato no canvas
2. Clique em "📸 Exportar PNG"
3. Verifique o arquivo gerado

**Resultado Esperado:**
- PNG com alta qualidade (2x scale)
- Fundo branco
- Seta inicial verde visível
- Estados e transições nítidas

---

## 🎨 Testes de Interface

### Teste 11: Editar Transição via Modal
**Objetivo:** Validar interface de edição de símbolos

**Passos:**
1. Crie transição q0 --a,b--> q1
2. Clique na transição para abrir modal
3. Clique no chip "a" (deve virar vermelho)
4. Adicione novo símbolo "c" e pressione Enter
5. Clique "Salvar"

**Resultado Esperado:**
- Transição agora mostra "b,c" (removeu "a", adicionou "c")
- Visual atualizado automaticamente

---

### Teste 12: Deletar Transição pelo Modal
**Objetivo:** Validar botão de deletar no modal

**Passos:**
1. Crie transição q0 --a,b,c--> q1
2. Clique na transição
3. Clique em "🗑️ Deletar Transição" (botão vermelho à esquerda)
4. Confirme no prompt

**Resultado Esperado:**
- Transição removida do canvas
- Pressionar Ctrl+Z restaura a transição

---

## 🎬 Testes de Animação (Fita de Simulação)

### Teste 13: Visualização Step-by-Step
**Objetivo:** Validar controles da fita animada

**Passos:**
1. Crie AFN com caminho longo: q0→q1→q2→q3→q4 (aceitação)
2. Simule cadeia "aaaa"
3. Use botões:
   - ⏮️ Primeiro passo
   - ⏪ Anterior
   - ⏯️ Play/Pause
   - ⏩ Próximo
   - ⏭️ Último passo

**Resultado Esperado:**
- Fita mostra cada símbolo sendo lido
- Estados ativos destacados em amarelo
- Transições tomadas mostradas em lista
- Botões funcionam corretamente

---

### Teste 14: Ajuste de Velocidade
**Objetivo:** Validar controle de velocidade

**Passos:**
1. Simule cadeia longa (ex: "aabbccddee")
2. Ajuste o slider de velocidade:
   - Máximo (2x)
   - Mínimo (0.25x)
3. Pressione Play

**Resultado Esperado:**
- Animação acelera/desacelera conforme slider
- Velocidade persiste entre pausas

---

## 🔍 Testes de Edge Cases

### Teste 15: Cadeia Vazia
**Objetivo:** Validar processamento de cadeia vazia

**Passos:**
1. Crie AFD: q0 (inicial + aceitação)
2. Deixe campo de simulação vazio
3. Clique "Simular"

**Resultado Esperado:**
- ✅ Deve **ACEITAR** (estado inicial é de aceitação)

---

### Teste 16: Self-Loop (Transição para Si Mesmo)
**Objetivo:** Testar transições recursivas

**Passos:**
1. Crie estado q0
2. Adicione transição q0 --a--> q0 (self-loop)
3. Simule "aaa"

**Resultado Esperado:**
- Visual mostra curva/loop sobre o estado
- Cadeia processada corretamente

---

### Teste 17: Múltiplos Caminhos Paralelos (AFN)
**Objetivo:** Validar exploração exaustiva

**Passos:**
1. Crie AFN com bifurcação:
   ```
   q0 --a--> q1 --b--> q3 (morto)
   q0 --a--> q2 --b--> q4 (aceitação)
   ```
2. Simule "ab"

**Resultado Esperado:**
- ✅ Deve **ACEITAR** (explora ambos os caminhos, encontra q4)

---

## 📏 Testes de Limites

### Teste 18: Autômato Grande
**Objetivo:** Testar performance com muitos estados

**Passos:**
1. Crie 20+ estados conectados
2. Adicione 50+ transições
3. Simule cadeia longa (100+ símbolos)

**Resultado Esperado:**
- Interface permanece responsiva
- Simulação completa sem travamento
- Zoom e pan funcionam suavemente

---

### Teste 19: Símbolos Especiais
**Objetivo:** Validar entrada de caracteres não-alfanuméricos

**Passos:**
1. Tente criar transições com símbolos especiais:
   - Números: "0,1,2"
   - Underscores: "a_b"
   - Épsilon: "ε" (copie/cole o símbolo)

**Resultado Esperado:**
- Todos os símbolos suportados
- Épsilon exibido com estilo diferenciado (linha tracejada roxa)

---

## ✅ Checklist de Validação Final

Execute todos os testes acima e marque:

- [ ] Teste 1 - AFD Básico
- [ ] Teste 2 - AFN Não-Determinístico
- [ ] Teste 3 - Épsilon Simples
- [ ] Teste 4 - Épsilon Encadeado
- [ ] Teste 5 - Conversão AFN→AFD
- [ ] Teste 6 - Undo/Redo
- [ ] Teste 7 - Validação
- [ ] Teste 8 - Export/Import JSON
- [ ] Teste 9 - Export Simulação
- [ ] Teste 10 - Export PNG
- [ ] Teste 11 - Editar Transição
- [ ] Teste 12 - Deletar Transição
- [ ] Teste 13 - Animação Step-by-Step
- [ ] Teste 14 - Ajuste de Velocidade
- [ ] Teste 15 - Cadeia Vazia
- [ ] Teste 16 - Self-Loop
- [ ] Teste 17 - Caminhos Paralelos
- [ ] Teste 18 - Autômato Grande
- [ ] Teste 19 - Símbolos Especiais

---

## 🐛 Bugs Conhecidos (Corrigidos na Versão Atual)

### ✅ Resolvido: Importação de Transições Multi-Símbolo
**Problema:** Ao importar JSON, apenas o primeiro símbolo de cada transição era carregado.  
**Solução:** Modificado método `import()` para iterar sobre todos os símbolos.

### ✅ Resolvido: Simulação AFN Rejeitando Incorretamente
**Problema:** AFN rejeitava cadeias que deveriam ser aceitas via épsilon-transições.  
**Solução:** Aplicado fechamento épsilon **antes** de processar cada símbolo na cadeia.

### ✅ Resolvido: Undo não Restaurava Transições Deletadas
**Problema:** Ctrl+Z não trazia transições deletadas de volta.  
**Solução:** Corrigido método `undo()` do `DeleteTransitionCommand` para atualizar Cytoscape corretamente.

### ✅ Resolvido: Labels Confusos na Conversão AFN→AFD
**Problema:** Estados compostos exibiam labels como "q{1,2,3,4}".  
**Solução:** Mudado para labels sequenciais simples (q0, q1, q2...).

---

**Última Atualização:** 16 de Janeiro de 2026  
**Versão do AutomaLab:** 1.0
