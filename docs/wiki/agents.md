# Referência de Agentes

O juninho instala 7 agentes especializados em `.opencode/agents/`. Cada agente é um subagente do OpenCode com prompt, modelo e permissões específicas.

## Como usar agentes

No OpenCode, mencione com `@`:
```
@planner adicione sistema de pagamentos
@validator
@reviewer
```

Ou via slash commands (que invocam os agentes internamente):
```
/plan
/spec
/implement
```

---

## @planner

**Modelo:** claude-opus-4-5 | **Modo:** subagent

O agente estratégico central. Transforma objetivos vagos em planos executáveis.

### Protocolo de 3 fases

**Fase 1 — Metis (Classificar & Explorar)**
- Classifica o tipo de intent: `FEATURE | BUG | REFACTOR | RESEARCH | MIGRATION`
- Spawna exploração paralela do codebase
- Carrega contexto de `docs/domain/INDEX.md` e `docs/principles/manifest`
- Produz diretivas anti-slop específicas para o projeto

**Fase 2 — Prometheus (Entrevistar & Planejar)**
- Entrevista proporcional à complexidade:
  - Tarefas simples (< 2h): 2–3 perguntas
  - Médias (2–8h): entrevista estruturada de 5 perguntas
  - Complexas (> 8h): decomposição em sub-problemas
- Planeja de trás pra frente (goal-backward)
- Escreve `plan.md` + `CONTEXT.md`

**Fase 3 — Momus (Loop de revisão)**
- Spawna `@plan-reviewer`
- Itera até aprovação (OKAY)
- Marca `.opencode/state/.plan-ready` para o plugin `plan-autoload`

### Output
- `plan.md` — tarefas em XML com dependências e critérios de aceitação
- `CONTEXT.md` — objetivo, constraints, anti-patterns, arquivos-chave

---

## @plan-reviewer

**Modelo:** claude-sonnet-4-5 | **Modo:** subagent | **Permissões:** task: deny, bash: deny

Porta de qualidade para planos. **Viés de aprovação** — rejeita apenas problemas que causariam falhas reais na execução.

### Critérios de avaliação
1. Completude — o plano aborda o objetivo?
2. Viabilidade — as tarefas são executáveis?
3. Dependências — a ordem está correta?
4. Critérios de aceitação — são mensuráveis?
5. Cobertura de riscos — riscos de alta probabilidade têm mitigação?

### Output
- `OKAY` — plano aprovado (com notas menores opcionais)
- `REJECT` — máximo 3 issues acionáveis, cada um com fix específico

---

## @spec-writer

**Modelo:** claude-opus-4-5 | **Modo:** subagent | **Write access:** `docs/specs/**`

Produz especificações detalhadas e implementáveis via entrevista estruturada.

### Entrevista de 5 fases

| Fase | Foco |
|------|------|
| 1. Discovery | Problema, usuários, definição de sucesso |
| 2. Requirements | Funcionais, não-funcionais, fora de escopo |
| 3. Contract | API, props de componente, estados de erro |
| 4. Data | Schema, migrations, validação, índices |
| 5. Review | Verificar completude, ambiguidades |

### Output
Spec em `docs/specs/{feature-name}.md` com:
- Problem statement
- Checklist de requirements
- Interface contract
- Data model
- Acceptance criteria testáveis

---

## @implementer

**Modelo:** claude-sonnet-4-5 | **Modo:** subagent

Executa planos e specs com o loop **READ→ACT→COMMIT→VALIDATE**.

### Loop de execução

```
READ   → lê spec + plan + TODOS os arquivos que vai modificar
ACT    → implementa seguindo padrões existentes do codebase
COMMIT → commit claro descrevendo o que mudou e por quê
VALIDATE → TypeScript + testes + spawn @validator se spec existe
```

### Execução em waves

Para tarefas complexas, paralela via worktrees:

| Wave | Conteúdo | Execução |
|------|----------|----------|
| 1 — Foundation | Schema, migrations, tipos compartilhados | Sequencial (bloqueia) |
| 2 — Core | Business logic, API routes, services | Paralela (worktrees) |
| 3 — Integration | Wire-up, testes de integração | Sequencial |

### Hashline awareness
Usa referências `NN#XX:` para edições estáveis. Se o plugin `hashline-edit` rejeitar um edit como stale, relê o arquivo antes de tentar novamente.

---

## @validator

**Modelo:** claude-sonnet-4-5 | **Modo:** subagent

Garante que implementações atendam suas especificações. **Lê a spec antes do código.**

### Tiers de validação

| Tier | Significado | Ação |
|------|-------------|------|
| APPROVED | Critério demonstravelmente atendido | Continua |
| NOTE | Atendido com preocupação menor | Documenta, continua |
| FIX | Critério NÃO atendido | Corrige diretamente |
| BLOCK | Issue crítico | Para tudo, retorna ao implementer |

### Veredictos finais
- `APPROVED` — tudo OK
- `APPROVED_WITH_NOTES` — funciona com ressalvas documentadas
- `BLOCKED` — não pode mergear sem resolver blockers

---

## @reviewer

**Modelo:** claude-sonnet-4-5 | **Modo:** subagent | **Permissões:** bash: deny, edit: deny, write: deny

Revisor advisory — feedback de qualidade sem bloquear o pipeline.

### Escopo de revisão
- Lógica e corretude (bugs, edge cases)
- Clareza (naming, estrutura, legibilidade)
- Segurança (injection, auth, data exposure)
- Performance (N+1 queries, re-renders desnecessários)
- Manutenibilidade (acoplamento, duplicação)

### Output
Report com findings em três níveis:
- **Critical** — corrigir antes de shipar
- **Important** — corrigir em breve
- **Minor** — considerar na próxima iteração

Sempre inclui notas positivas. Veredicto: `LGTM | LGTM_WITH_NOTES | NEEDS_WORK`.

---

## @unify

**Modelo:** claude-sonnet-4-5 | **Modo:** subagent

Fecha o loop após implementação: reconcilia, documenta e faz o ship.

### Protocolo

1. **Verifica completude** — checa cada task do `plan.md` (DONE/PARTIAL/SKIPPED)
2. **Atualiza docs de domínio** — `docs/domain/INDEX.md` com novas entidades/padrões
3. **Merge de worktrees** — se execução paralela foi usada
4. **Cria PR** — `gh pr create` com body gerado da spec
5. **Limpa estado** — remove `.plan-ready`, arquiva `plan.md`, reseta `execution-state.md`

---

## Modelo mental: quando usar cada agente

```
Objetivo vago → /plan (@planner)
                    ↓
Feature complexa → /spec (@spec-writer) → /plan → /implement
                                                       ↓
                                               @implementer executa
                                                       ↓
                                               @validator verifica
                                                       ↓
                                               @reviewer (advisory)
                                                       ↓
                                               @unify → PR
```
