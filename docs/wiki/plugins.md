# Referência de Plugins

Plugins em `.opencode/plugins/` são **auto-descobertos pelo OpenCode** — sem configuração extra.
Cada plugin exporta um objeto `Plugin` com hooks que rodam em eventos específicos.

## Como plugins funcionam

```
Evento do OpenCode → Plugin intercepta → inject contexto / abort / transformOutput
```

Hooks disponíveis: `tool.execute.before`, `tool.execute.after`, `session.idle`, `session.start`

---

## env-protection

**Hook:** `tool.execute.before`

Bloqueia acesso acidental a arquivos sensíveis em qualquer tool call que envolva paths.

**Padrões bloqueados:**
- `.env`, `.env.local`, `.env.production`, etc.
- Arquivos com `secret` ou `credential` no nome
- `.pem`, `id_rsa`, `.key`

**Output quando bloqueado:**
```
[env-protection] Blocked access to sensitive file: .env.local
If this is intentional, temporarily disable the env-protection plugin.
```

**Para desabilitar temporariamente:** remova ou renomeie o arquivo `env-protection.ts` em `.opencode/plugins/`.

---

## auto-format

**Hook:** `tool.execute.after` em Write/Edit/MultiEdit

Detecta a extensão do arquivo modificado e roda o formatter adequado:

| Extensão | Formatter |
|----------|-----------|
| `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.md` | `prettier --write` |
| `.py` | `black` |
| `.go` | `gofmt -w` |
| `.rs` | `rustfmt` |

**Graceful degradation:** se o formatter não estiver instalado, falha silenciosamente — nunca quebra o fluxo.

---

## plan-autoload

**Hook:** `session.idle`

Detecta se há um plano ativo (`.opencode/state/.plan-ready`) e injeta o conteúdo no contexto.

**Fluxo:**
1. `@planner` termina e escreve o path do `plan.md` em `.plan-ready`
2. Na próxima pausa da sessão, o plugin lê o arquivo
3. Injeta o plano no contexto com instrução para usar `/implement`

**Resultado:** o agente nunca "esquece" o plano ativo entre turns.

---

## carl-inject

**Hook:** `tool.execute.before` em `UserPromptSubmit`

CARL = **C**ontext-**A**ware **R**etrieval **L**ayer

Extrai keywords do prompt do usuário e injeta entradas relevantes do `docs/principles/manifest`.

**Algoritmo:**
1. Extrai palavras únicas com > 4 chars do prompt
2. Busca matches em `docs/principles/manifest`
3. Injeta até 5 entradas relevantes

**Pré-requisito:** `docs/principles/manifest` precisa ter conteúdo. Rode `/init-deep` para populá-lo.

---

## skill-inject

**Hook:** `tool.execute.before` em Write/Edit/MultiEdit

Mapeia o path do arquivo sendo editado para uma skill e injeta as instruções:

| Padrão de path | Skill injetada |
|----------------|----------------|
| `*.test.ts`, `*.spec.ts` | `test-writing/SKILL.md` |
| `app/**/page.tsx` | `page-creation/SKILL.md` |
| `app/api/**/*.ts` | `api-route-creation/SKILL.md` |
| `**/actions.ts` | `server-action-creation/SKILL.md` |
| `**/schema.prisma` | `schema-migration/SKILL.md` |

**Resultado:** o agente recebe instruções específicas antes de escrever um arquivo — consistência automática.

---

## intent-gate

**Hook:** `tool.execute.before` em `UserPromptSubmit`

Classifica a intenção real do prompt e anota no contexto para melhor roteamento de agente.

**Tipos de intent:**

| Intent | Keywords | Agente sugerido |
|--------|----------|-----------------|
| `RESOLVE_PROBLEM` | fix, bug, error, broken | @implementer |
| `REFACTOR` | refactor, cleanup, restructure | @implementer |
| `ADD_FEATURE` | add, implement, create, build | @planner + @implementer |
| `RESEARCH` | understand, explain, how does | inline |
| `MIGRATION` | migrate, upgrade, port | @planner + @implementer |
| `REVIEW` | review, check, audit | @reviewer |

Não redireciona automaticamente — anota o intent para que o agente possa escolher conscientemente.

---

## todo-enforcer

**Hook:** `session.idle`

Lê `execution-state.md` e re-injeta tasks incompletas quando a sessão fica idle.

**Lê:** linhas com `- [ ]` (checkboxes desmarcadas) em `execution-state.md`

**Injeta:**
```
[todo-enforcer] You have 3 incomplete task(s):
- [ ] implementar rota de pagamento
- [ ] adicionar testes de integração
- [ ] atualizar AGENTS.md

Do not stop until all tasks are complete. Continue working.
```

**Resultado:** previne drift — o agente não "esquece" o que estava fazendo.

---

## comment-checker

**Hook:** `tool.execute.after` em Write/Edit

Detecta comentários óbvios/redundantes no código escrito e injeta um lembrete.

**Padrões detectados:**
- `// increment x`
- `// return something`
- `// check if condition`
- `// loop through array`
- etc.

**Ignorados (comentários legítimos):**
- `@ts-ignore`, diretivas ESLint
- `TODO`, `FIXME`, `HACK`, `NOTE:`
- JSDoc (`/** */`)
- Comentários BDD (given/when/then)

Injeta aviso mas **não bloqueia** — é apenas um lembrete.

---

## hashline-read

**Hook:** `tool.execute.after` em Read

Transforma o output de Read adicionando prefixo `NNN#XX:` em cada linha:

```
001#a3: import { writeFileSync } from "fs"
002#7f: import path from "path"
003#00:
004#b2: export function writeAgents(projectDir: string): void {
```

- `NNN` = número da linha com padding
- `XX` = 2 chars do hash MD5 da linha (estável enquanto a linha não mudar)

**Uso:** o `@implementer` usa essas referências em edits para apontar linhas específicas. O `hashline-edit` valida que as referências ainda são válidas.

---

## hashline-edit

**Hook:** `tool.execute.before` em Edit

Valida referências hashline antes de executar um edit. Se o hash não bate com o conteúdo atual, rejeita o edit com mensagem clara.

**Protege contra:** edits "stale" — quando o agente tenta editar uma linha que já foi modificada por outro agente ou wave anterior.

**Output quando inválido:**
```
[hashline-edit] Stale reference at line 42: expected hash a3, got 7f.
Re-read the file to get current hashlines.
```

---

## directory-agents-injector

**Hook:** `session.start` / `tool.execute.before`

Mecanismo **Tier 1 de contexto**: lê arquivos `AGENTS.md` em cada nível do diretório e injeta suas instruções hierarquicamente no contexto.

**Como funciona:**

```
projeto/
├── AGENTS.md              ← instruções globais (sempre injetadas)
├── src/
│   ├── AGENTS.md          ← instruções do módulo src/
│   └── components/
│       └── AGENTS.md      ← instruções específicas de components/
```

Quando o agente trabalha em `src/components/Button.tsx`, o plugin injeta:
1. `AGENTS.md` da raiz (contexto global)
2. `src/AGENTS.md` (contexto do módulo)
3. `src/components/AGENTS.md` (contexto do sub-módulo)

**Benefício:** diferentes partes do projeto podem ter convenções diferentes (ex: regras de estilo para componentes, padrões de rota para API) sem poluir o contexto global da sessão.

**Integração com `/init-deep`:** o comando `/init-deep` gera `AGENTS.md` hierárquicos automaticamente ao escanear o codebase.

---

## Customizando plugins

Para modificar o comportamento de um plugin, edite diretamente o arquivo `.ts` em `.opencode/plugins/`. O OpenCode recarrega plugins automaticamente.

Para desabilitar um plugin: renomeie com prefixo `_`:
```bash
mv .opencode/plugins/comment-checker.ts .opencode/plugins/_comment-checker.ts
```

Para adicionar um plugin novo: crie um arquivo `.ts` em `.opencode/plugins/` seguindo o padrão dos existentes.
