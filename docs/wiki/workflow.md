# Workflow Recomendado

Este guia mostra como usar o juninho framework no dia a dia — do objetivo ao PR.

---

## Fluxo padrão

```
Objetivo → /plan → (opcional: /spec) → /implement → @j.validator → @j.unify → PR
```

---

## Caso 1 — Bug simples

```
Situação: "a rota /api/clientes retorna 500 quando o ID não existe"
```

```
# Direto para o implementer — sem planejamento necessário
@j.implementer fix the 500 error on /api/clientes when ID doesn't exist

# Ou com contexto mínimo via plan
/plan fix 500 error on GET /api/clientes/:id when record not found
```

O `@j.planner` vai classificar como `BUG`, fazer 1–2 perguntas, escrever um `plan.md` pequeno,
e o `@j.implementer` vai corrigir diretamente.

---

## Caso 2 — Feature nova (sem spec)

```
Situação: "adicionar filtro por data nos agendamentos"
```

```
/plan adicionar filtro por data na listagem de agendamentos
```

O `@j.planner` vai:
1. Explorar como a listagem atual funciona
2. Perguntar: formato de data, granularidade (dia/semana/mês), se afeta a query ou só o frontend
3. Escrever `plan.md` com 3–5 tasks

Depois:
```
/implement
```

---

## Caso 3 — Feature complexa (com spec)

```
Situação: "sistema completo de pagamentos com Stripe"
```

```
# Passo 1: spec detalhada primeiro
/spec sistema de pagamentos com Stripe

# @j.spec-writer vai conduzir entrevista de 5 fases:
# Discovery → Requirements → Contract → Data → Review
# Escreve docs/specs/sistema-pagamentos.md

# Passo 2: plano baseado na spec
/plan

# @j.planner lê a spec, planeja em waves

# Passo 3: implementar
/implement

# @j.implementer executa wave por wave, @j.validator verifica contra a spec
```

---

## Caso 4 — Sessão longa com handoff

```
# Início de sessão
/start-work issue #42 — sistema de notificações

# Trabalho...
/implement

# Fim de sessão — documentar estado antes de fechar
/handoff
```

O `@handoff` escreve em `execution-state.md`:
- O que foi feito
- O que está em andamento (com próximo passo exato)
- O que está bloqueado

Na próxima sessão:
```
/start-work
# O plugin plan-autoload injeta o estado automaticamente
```

---

## Caso 5 — Muitas tasks independentes (modo paralelo)

```
Situação: 10 features pequenas do backlog, independentes entre si
```

```
# Popula execution-state.md com todas as tasks
/plan implementar todas as features do backlog sprint 3

# Ativa modo de máximo paralelismo
/ulw-loop
```

O `@ulw-loop` vai:
1. Identificar tasks que não têm dependências entre si
2. Criar um worktree por task em `worktrees/`
3. Rodar `@j.implementer` em paralelo em cada worktree
4. Validar cada wave
5. `@j.unify` mergea tudo e cria o PR

---

## Inicializando um projeto existente

Se o projeto já tem código e você quer que o CARL e os agentes entendam o domínio:

```
/init-deep
```

Isso escaneia o codebase e preenche:
- `docs/domain/INDEX.md` — mapa de entidades, serviços, rotas
- `docs/principles/manifest` — padrões canônicos encontrados

Deve ser feito uma vez após o `juninho setup`, e repetido após refactors grandes.

---

## Dicas de produtividade

### Use `persistent-context.md` para decisões arquiteturais

Quando você tomar uma decisão importante ("vamos usar Zustand em vez de Redux porque..."), registre em `.opencode/state/persistent-context.md`. Os agentes vão ler esse arquivo em sessões futuras.

### Skills são automáticas

Não precisa mencionar skills explicitamente. O plugin `skill-inject` detecta o tipo de arquivo e injeta as instruções certas. Escrever um teste? As regras de `test-writing` aparecem automaticamente.

### Deixe o `todo-enforcer` trabalhar

Não precisa lembrar o agente de continuar. Se `execution-state.md` tem tasks incompletas, o plugin re-injeta a lista quando a sessão fica idle. O agente vai voltar ao trabalho.

### Quando usar `@j.reviewer` vs `@j.validator`

- `@j.validator` — pergunta "a implementação atende a spec?" (blocking, objetivo)
- `@j.reviewer` — pergunta "a implementação tem boa qualidade?" (advisory, subjetivo)

Use os dois: primeiro `@j.validator` para corretude, depois `@j.reviewer` para qualidade.

---

## Troubleshooting

### "O agente não está lendo o plano"

Verifique se `.opencode/state/.plan-ready` existe:
```bash
cat .opencode/state/.plan-ready
# deve conter o path para plan.md
```

Se não existir, o `@planner` não concluiu ou o arquivo foi deletado. Rode `/plan` novamente.

### "O plugin skill-inject não está ativando"

Verifique se o path do arquivo segue o padrão. Ex: para `api-route-creation` ativar, o arquivo deve ser `app/api/alguma-coisa/route.ts` — o padrão `app/api/**/*.ts`.

Para ver os padrões: `cat .opencode/plugins/skill-inject.ts`

### "O hashline-edit rejeitou meu edit"

O agente tentou editar uma linha que mudou desde a última leitura. Solução:
1. O agente deve reler o arquivo com `Read`
2. Usar os novos hashlines nas referências
3. Tentar o edit novamente

Isso é um feature, não um bug — previne edits destrutivos em código stale.
