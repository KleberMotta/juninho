# AGENTS.md

This project uses the **Agentic Coding Framework** — a structured approach to AI-assisted development
with specialized agents, skills, and plugins auto-configured by [juninho](https://github.com/juninho).

## Quick Start

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan <goal>` | `@planner` | Create an actionable plan from a goal |
| `/spec <feature>` | `@spec-writer` | Write a detailed spec before building |
| `/implement` | `@implementer` | Execute the active plan wave by wave |
| `/start-work <task>` | — | Initialize a focused work session |
| `/handoff` | — | Prepare end-of-session handoff doc |
| `/ulw-loop` | — | Maximum parallelism mode |

## Agent Roster

### @planner
Strategic planning agent. Uses Metis→Prometheus→Momus protocol:
- Classifies intent (FEATURE/BUG/REFACTOR/RESEARCH/MIGRATION)
- Interviews proportional to complexity
- Writes `plan.md` + `CONTEXT.md`
- Loops with `@plan-reviewer` until approved

### @spec-writer
Specification agent. 5-phase interview:
Discovery → Requirements → Contract → Data → Review
Writes to `docs/specs/{feature-name}.md`

### @implementer
Execution agent. READ→ACT→COMMIT→VALIDATE loop.
Wave-based: Foundation → Core → Integration
Hashline-aware for stable file references.

### @validator
Compliance agent. Reads spec BEFORE code.
Tiers: APPROVED / NOTE / FIX / BLOCK
Can make direct fixes for FIX-tier issues.

### @reviewer
Advisory agent. Read-only, never blocks.
Provides quality/security/performance feedback.

### @plan-reviewer
Plan quality gate. Approval bias — rejects only blocking issues.
Max 3 actionable issues per rejection.

### @unify
Completion agent. Reconciles plan vs delivery, updates domain docs,
merges worktrees, creates PR with spec body.

## Active Plugins

Plugins in `.opencode/plugins/` are auto-discovered by OpenCode:

| Plugin | Trigger | Purpose |
|--------|---------|---------|
| `env-protection` | Any file access | Block sensitive file reads/writes |
| `auto-format` | Write/Edit | Auto-format after file changes |
| `plan-autoload` | Session idle | Inject active plan into context |
| `carl-inject` | User prompt | Inject relevant domain docs |
| `skill-inject` | Write/Edit | Inject skill instructions by file pattern |
| `intent-gate` | User prompt | Classify intent for agent routing |
| `todo-enforcer` | Session idle | Re-inject incomplete tasks |
| `comment-checker` | Write/Edit | Flag obvious/redundant comments |
| `hashline-read` | Read | Add stable line references |
| `hashline-edit` | Edit | Validate stale hashline references |

## Custom Tools

Tools in `.opencode/tools/` extend agent capabilities:

- **find_pattern** — Find canonical code patterns for consistent implementation
- **next_version** — Get next migration/schema version number
- **lsp_diagnostics, lsp_goto_definition, lsp_find_references, lsp_document_symbols, lsp_workspace_symbols, lsp_rename** — LSP-like code intelligence
- **ast_grep_search, ast_grep_replace** — AST-based structural search and replace

## Skills

Skills in `.opencode/skills/` inject step-by-step instructions when editing specific file types:

| Skill | Activates on |
|-------|-------------|
| `test-writing` | `*.test.ts`, `*.spec.ts` |
| `page-creation` | `app/**/page.tsx` |
| `api-route-creation` | `app/api/**/*.ts` |
| `server-action-creation` | `**/actions.ts` |
| `schema-migration` | `schema.prisma` |

## State Files

| File | Purpose |
|------|---------|
| `.opencode/state/persistent-context.md` | Long-term project knowledge |
| `.opencode/state/execution-state.md` | Current session task list |
| `.opencode/state/.plan-ready` | Marker: active plan path (auto-managed) |

## Workflow

```
Goal → /plan → plan.md approved → /implement → @validator → @unify → PR
         ↓
      /spec (for complex features)
         ↓
      docs/specs/{feature}.md → /plan → /implement
```

## Conventions

- Plans are in `plan.md` (root or task dir)
- Specs are in `docs/specs/`
- Domain docs in `docs/domain/INDEX.md`
- Architectural decisions in `.opencode/state/persistent-context.md`
- Worktrees for parallel work in `worktrees/`
