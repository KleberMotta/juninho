# Referência de Comandos

Comandos slash em `.opencode/commands/` aparecem no autocomplete do OpenCode.

---

## /plan

**Invoca:** `@j.planner`

Transforma um objetivo em um `plan.md` executável.

```
/plan <objetivo>
```

**Exemplos:**
```
/plan adicionar autenticação com Clerk
/plan corrigir bug de N+1 queries na listagem de pets
/plan migrar de REST para tRPC
/plan refatorar o service layer para repository pattern
```

**Output:**
- `plan.md` com tasks em XML, dependências, acceptance criteria
- `CONTEXT.md` com objetivo, constraints e anti-patterns
- `.opencode/state/.plan-ready` marcando o plano como ativo

---

## /spec

**Invoca:** `@j.spec-writer`

Conduz uma entrevista estruturada de 5 fases e produz uma spec detalhada.

```
/spec <nome ou descrição da feature>
```

**Exemplos:**
```
/spec sistema de agendamentos com recorrência
/spec dashboard de métricas em tempo real
/spec integração com WhatsApp Business API
```

**Quando usar:** features complexas onde ambiguidade de requisitos é um risco real.
**Quando não usar:** bugs, refactors, features triviais — vá direto para `/plan`.

**Output:** `docs/specs/{feature-name}.md`

---

## /implement

**Invoca:** `@j.implementer`

Executa o plano ativo (ou spec especificada) wave por wave.

```
/implement
/implement <task específica>
/implement docs/specs/feature.md
```

**Exemplos:**
```
/implement
/implement a camada de serviço
/implement docs/specs/pagamentos.md
```

**O agente:**
1. Lê o `plan.md` ativo (injetado pelo plugin `plan-autoload`)
2. Executa wave por wave com validação em cada etapa
3. Spawna `@j.validator` se há spec correspondente
4. Atualiza `execution-state.md` com progresso

---

## /init-deep

**Invoca:** exploração profunda do codebase

Escaneia todo o codebase e gera documentação de domínio.

```
/init-deep
```

**Popula:**
- `docs/domain/INDEX.md` — mapa de entidades, serviços, rotas, componentes
- `docs/principles/manifest` — padrões canônicos encontrados

**Quando usar:**
- Logo após `juninho setup` em um projeto existente
- Após refactors grandes que mudaram a estrutura
- Quando os agentes parecem não conhecer o domínio

**Resultado:** o CARL plugin passa a injetar contexto relevante automaticamente.

---

## /start-work

Inicializa o contexto para uma sessão de trabalho focada.

```
/start-work <descrição da task ou número do issue>
```

**Exemplos:**
```
/start-work issue #42 — corrigir cálculo de comissão
/start-work implementar sistema de notificações push
/start-work #123
```

**O que faz:**
1. Carrega `docs/domain/INDEX.md` para contexto de domínio
2. Verifica `execution-state.md` por work em andamento
3. Se há `plan.md` ativo: apresenta próximos passos
4. Se não há plano: sugere `/plan` primeiro ou `/implement` direto
5. Inicializa `execution-state.md` com a task atual

---

## /handoff

Prepara documentação de handoff no final de uma sessão.

```
/handoff
```

**Gera em `execution-state.md`:**
```markdown
# Session Handoff — 2024-01-15

## Completed
- [x] Implementou rota POST /api/pagamentos
- [x] Adicionou validação Zod no schema

## In Progress
- [ ] Testes de integração do fluxo de pagamento
  - Last state: criou o setup do test, falta os casos
  - Next step: escrever test para webhook do Stripe
  - Files: src/tests/integration/pagamentos.test.ts

## Blocked
(nenhum)

## Next Session: Start with
Continuar os testes de integração em pagamentos.test.ts —
próximo caso: webhook de pagamento confirmado
```

**Uso:** sempre rode `/handoff` antes de fechar o OpenCode em sessões longas.

---

## /ulw-loop

**Ultra Work Loop** — máximo paralelismo até completar todas as tasks.

```
/ulw-loop
/ulw-loop <objetivo ou task list>
```

**Exemplos:**
```
/ulw-loop
/ulw-loop implementar todas as features do sprint 3
```

**Modelo de execução:**
```
Wave 1 (paralela via worktrees):
  worktree-a → task 1 (arquivos independentes)
  worktree-b → task 2 (arquivos independentes)
  worktree-c → task 3 (arquivos independentes)

Wave 2 (sequencial):
  main → integração + wire-up

Wave 3:
  @j.validator → verifica todas as tasks
  @j.unify → merge + PR
```

**Quando usar:** backlog de tasks independentes (sem dependências cruzadas de arquivos).

---

## /check

Roda todos os quality gates em sequência: TypeScript, linter e testes.

```
/check
```

**Equivalente a:**
```bash
tsc --noEmit && eslint . --max-warnings=0 && jest --passWithNoTests
```

**Quando usar:** antes de criar um PR ou após uma sessão de implementação longa — garante que tudo está limpo.

---

## /lint

Roda apenas o linter.

```
/lint
```

**Equivalente a:**
```bash
eslint . --max-warnings=0
```

**Quando usar:** após ajustes de estilo ou quando você sabe que TypeScript e testes estão OK.

---

## /test

Roda apenas a suite de testes.

```
/test
```

**Equivalente a:**
```bash
jest --passWithNoTests
```

**Quando usar:** para verificar rapidamente se as mudanças quebraram algum teste existente.

---

## /pr-review

**Invoca:** `@j.reviewer`

Revisão advisory do diff atual — analisa o que mudou desde a última branch base.

```
/pr-review
```

**O que faz:**
- Executa `git diff` contra a branch base
- Passa o diff para `@j.reviewer` com contexto do projeto
- Retorna findings em três níveis: Critical / Important / Minor

**Resultado:** feedback de qualidade sem bloquear — você decide o que agir antes de abrir o PR.

---

## /status

Exibe um resumo do `execution-state.md` atual.

```
/status
```

**Output:**
```markdown
## Status atual

### ✅ Concluídas (3)
- [x] Implementou rota POST /api/pagamentos
- [x] Adicionou validação Zod
- [x] Criou testes unitários

### 🔄 Em progresso (1)
- [ ] Testes de integração do webhook

### 🚫 Bloqueadas (0)
(nenhuma)
```

**Quando usar:** para retomar uma sessão de trabalho ou checar o estado antes de criar um PR.

---

## /unify

**Invoca:** `@j.unify`

Fecha o loop após implementação: reconcilia worktrees, documenta e cria o PR.

```
/unify
```

**Protocolo:**
1. Verifica completude de cada task em `plan.md`
2. Atualiza `docs/domain/INDEX.md` com novas entidades/padrões
3. Merge de worktrees paralelas (se usadas no `/ulw-loop`)
4. Cria PR via `gh pr create` com body gerado da spec
5. Limpa estado: remove `.plan-ready`, arquiva `plan.md`, reseta `execution-state.md`

**Diferença em relação ao `/handoff`:** `/handoff` documenta o estado para a próxima sessão; `/unify` finaliza a feature e cria o PR.

---

## Tabela rápida

| Comando | Agente | Quando usar |
|---------|--------|-------------|
| `/plan` | @j.planner | Qualquer task não trivial |
| `/spec` | @j.spec-writer | Features complexas com requisitos ambíguos |
| `/implement` | @j.implementer | Após ter um plano |
| `/init-deep` | (exploração) | Setup inicial ou pós-refactor |
| `/start-work` | — | Início de sessão focada |
| `/handoff` | — | Fim de sessão longa |
| `/ulw-loop` | @j.implementer × N | Múltiplas tasks independentes |
| `/check` | — | Quality gates completos (tsc + eslint + jest) |
| `/lint` | — | Apenas o linter |
| `/test` | — | Apenas a suite de testes |
| `/pr-review` | @j.reviewer | Revisão advisory do diff atual |
| `/status` | — | Resumo do execution-state.md |
| `/unify` | @j.unify | Fechar o loop: merge + PR |
