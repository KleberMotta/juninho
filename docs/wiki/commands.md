# Referência de Comandos

Comandos slash em `.opencode/commands/` aparecem no autocomplete do OpenCode.

---

## /plan

**Invoca:** `@planner`

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

**Invoca:** `@spec-writer`

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

**Invoca:** `@implementer`

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
3. Spawna `@validator` se há spec correspondente
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
  @validator → verifica todas as tasks
  @unify → merge + PR
```

**Quando usar:** backlog de tasks independentes (sem dependências cruzadas de arquivos).

---

## Tabela rápida

| Comando | Agente | Quando usar |
|---------|--------|-------------|
| `/plan` | @planner | Qualquer task não trivial |
| `/spec` | @spec-writer | Features complexas com requisitos ambíguos |
| `/implement` | @implementer | Após ter um plano |
| `/init-deep` | (exploração) | Setup inicial ou pós-refactor |
| `/start-work` | — | Início de sessão focada |
| `/handoff` | — | Fim de sessão longa |
| `/ulw-loop` | @implementer × N | Múltiplas tasks independentes |
