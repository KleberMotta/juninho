import { writeFileSync, readFileSync, existsSync } from "fs"
import path from "path"

export function writeDocs(projectDir: string): void {
  writeFileSync(path.join(projectDir, "AGENTS.md"), AGENTS_MD)
  writeFileSync(path.join(projectDir, "docs", "domain", "INDEX.md"), DOMAIN_INDEX)
  writeFileSync(path.join(projectDir, "docs", "principles", "manifest"), MANIFEST)
}

export function patchOpencodeJson(projectDir: string): void {
  const jsonPath = path.join(projectDir, "opencode.json")

  let existing: Record<string, unknown> = {}
  if (existsSync(jsonPath)) {
    try {
      existing = JSON.parse(readFileSync(jsonPath, "utf-8"))
    } catch {
      // Malformed JSON — start fresh but warn
      console.warn("[juninho] Warning: existing opencode.json could not be parsed — overwriting.")
    }
  }

  const frameworkConfig = {
    mcp: {
      // Context7 is global — available to all agents for live library documentation.
      // Low context cost, high utility across implementer, planner, and validator.
      context7: {
        type: "local",
        command: ["npx", "-y", "@upstash/context7-mcp@latest"],
      },
    },
  }

  // Deep merge: framework config fills in missing keys, never overwrites existing user config
  const merged = deepMerge(frameworkConfig, existing)

  writeFileSync(jsonPath, JSON.stringify(merged, null, 2) + "\n")
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }

  for (const key of Object.keys(override)) {
    const baseVal = base[key]
    const overrideVal = override[key]

    if (
      overrideVal !== null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      )
    } else {
      // Override value takes precedence (user config wins)
      result[key] = overrideVal
    }
  }

  return result
}

// ─── AGENTS.md ────────────────────────────────────────────────────────────────

const AGENTS_MD = `# AGENTS.md

This project uses the **Agentic Coding Framework** v2.1 — installed by [juninho](https://github.com/KleberMotta/juninho).

## Workflows

**Path A — Spec-driven (formal features):**
\`\`\`
/spec → docs/specs/{slug}/spec.md (approved)
  → /plan → docs/specs/{slug}/plan.md (approved)
  → /implement → @j.validator gates each commit → /unify → PR
\`\`\`

**Path B — Plan-driven (lightweight tasks):**
\`\`\`
/plan → plan.md (approved) → plan-autoload injects on next session
  → /implement → @j.validator gates each commit → /unify → PR
\`\`\`

## Commands

| Command | Purpose |
|---------|---------|
| \`/spec <feature>\` | 5-phase interview → \`docs/specs/{slug}/spec.md\` |
| \`/plan <goal>\` | 3-phase pipeline (Metis→Prometheus→Momus) → \`plan.md\` approved |
| \`/implement\` | Execute active plan wave by wave with validation |
| \`/check\` | Run typecheck + lint + tests (same as pre-commit hook) |
| \`/lint\` | Run linter only |
| \`/test\` | Run test suite only |
| \`/pr-review\` | Advisory review of current branch diff |
| \`/status\` | Show \`execution-state.md\` summary |
| \`/unify\` | Reconcile, update docs, merge worktrees, create PR |
| \`/start-work <task>\` | Initialize a focused work session |
| \`/handoff\` | Prepare end-of-session handoff doc |
| \`/init-deep\` | Generate hierarchical AGENTS.md + populate domain docs |
| \`/ulw-loop\` | Maximum parallelism mode |

## Agent Roster

### @j.planner
Three-phase pipeline orchestrated internally:
- **Phase 1 (Metis)**: Spawns \`@j.explore\` + \`@j.librarian\` in parallel, classifies intent
- **Phase 2 (Prometheus)**: Interviews developer (proportional to complexity), writes \`CONTEXT.md\` + \`plan.md\`
- **Phase 3 (Momus)**: Loops with \`@j.plan-reviewer\` until OKAY

### @j.plan-reviewer
Internal to planner. Executability gate — approval bias, max 3 issues.

### @j.spec-writer
5-phase interview: Discovery → Requirements → Contract → Data → Review.
Writes to \`docs/specs/{feature-slug}/spec.md\`.

### @j.implementer
READ→ACT→COMMIT→VALIDATE loop. Wave-based with git worktrees for parallel tasks.
Pre-commit hook gates every commit. Hashline-aware editing.

### @j.validator
Reads spec BEFORE code. BLOCK / FIX / NOTE / APPROVED.
Can fix FIX-tier issues directly. Writes audit trail to \`validator-work.md\`.

### @j.reviewer
Post-PR advisory review. Read-only, never blocks. Use via \`/pr-review\`.

### @j.unify
Closes the loop: reconcile, update domain docs, merge worktrees, \`gh pr create\`.

### @j.explore
Fast read-only codebase research. Spawned by planner Phase 1.
Maps files, patterns, and constraints before the developer interview.

### @j.librarian
External docs and OSS research. Spawned by planner Phase 1.
Fetches official API docs via Context7 MCP.

## Context Tiers

| Tier | Mechanism | When |
|------|-----------|------|
| 1 | Hierarchical \`AGENTS.md\` + \`directory-agents-injector\` | Always — per directory when files are read |
| 2 | \`carl-inject\` — keywords → principles + domain docs | Every \`UserPromptSubmit\` |
| 3 | \`skill-inject\` — file pattern → SKILL.md | \`PreToolUse\` on Write/Edit |
| 4 | \`<skills>\` declaration in \`plan.md\` task | Explicit per-task requirement |
| 5 | State files in \`.opencode/state/\` | Runtime, inter-session |

## Plugins (auto-discovered by OpenCode)

| Plugin | Hook | Purpose |
|--------|------|---------|
| \`directory-agents-injector\` | Read | Inject directory-scoped AGENTS.md files (Tier 1) |
| \`env-protection\` | Any tool | Block sensitive file reads/writes |
| \`auto-format\` | Write/Edit | Auto-format after file changes |
| \`plan-autoload\` | session.idle | Inject active plan into context |
| \`carl-inject\` | UserPromptSubmit | Inject principles + domain docs by keyword |
| \`skill-inject\` | Write/Edit | Inject skill by file pattern |
| \`intent-gate\` | UserPromptSubmit | Classify intent before action |
| \`todo-enforcer\` | session.idle | Re-inject incomplete tasks |
| \`comment-checker\` | Write/Edit | Flag obvious/redundant comments |
| \`hashline-read\` | Read | Tag lines with content hashes |
| \`hashline-edit\` | Edit | Validate hash references before editing |

## Custom Tools

| Tool | Purpose |
|------|---------|
| \`find_pattern\` | Curated canonical examples for a given pattern type |
| \`next_version\` | Next migration/schema version filename |
| \`lsp_diagnostics\` | Workspace errors and warnings |
| \`lsp_goto_definition\` | Jump to symbol definition |
| \`lsp_find_references\` | All usages of a symbol across the codebase |
| \`lsp_prepare_rename\` | Validate rename safety |
| \`lsp_rename\` | Rename symbol atomically across workspace |
| \`lsp_symbols\` | File outline or workspace symbol search |
| \`ast_grep_search\` | Structural code pattern search |
| \`ast_grep_replace\` | Structural pattern replacement (with dryRun) |

## Skills (injected automatically by file pattern)

| Skill | Activates on | Notes |
|-------|-------------|-------|
| \`test-writing\` | \`*.test.ts\`, \`*.spec.ts\` | Optional: uncomment Playwright MCP in frontmatter for E2E |
| \`page-creation\` | \`app/**/page.tsx\` | |
| \`api-route-creation\` | \`app/api/**/*.ts\` | |
| \`server-action-creation\` | \`**/actions.ts\` | |
| \`schema-migration\` | \`schema.prisma\` | |

## State Files

| File | Purpose |
|------|---------|
| \`.opencode/state/persistent-context.md\` | Long-term project knowledge — updated by UNIFY |
| \`.opencode/state/execution-state.md\` | Per-feature task table — updated by implementer and UNIFY |
| \`.opencode/state/validator-work.md\` | Validator audit trail — BLOCK/FIX/NOTE per pass |
| \`.opencode/state/implementer-work.md\` | Implementer decisions and blockers log |
| \`.opencode/state/.plan-ready\` | Transient IPC flag — plan path, consumed by plan-autoload |

## Conventions

- Specs: \`docs/specs/{feature-slug}/spec.md\` + \`CONTEXT.md\` + \`plan.md\`
- Domain docs: \`docs/domain/{domain}/*.md\` — indexed in \`docs/domain/INDEX.md\`
- Principles: \`docs/principles/{topic}.md\` — registered in \`docs/principles/manifest\`
- Worktrees: \`worktrees/{feature}-{task}/\` — created by implementer, removed by UNIFY
- Hierarchical \`AGENTS.md\`: root + \`src/\` + \`src/{module}/\` — generated by \`/init-deep\`
`

// ─── Domain INDEX.md ──────────────────────────────────────────────────────────

const DOMAIN_INDEX = `# Domain Index

Global index of business domain documentation.

Serves two purposes:
1. **CARL lookup table** — \`carl-inject.ts\` reads \`Keywords:\` lines to match prompt words and inject the listed \`Files:\`
2. **Planner orientation** — \`@j.planner\` reads this before interviewing to know what domain knowledge exists

Run \`/init-deep\` to auto-populate from the codebase.
Update manually as you document business domains.

---

## Format

Each entry:
\`\`\`
## {domain}
Keywords: keyword1, keyword2, keyword3
Files:
  - {domain}/rules.md — Core business rules
  - {domain}/limits.md — Limits, thresholds, quotas
  - {domain}/edge-cases.md — Known edge cases and expected behavior
\`\`\`

---

## (no domains yet)

Run \`/init-deep\` to scan the codebase and generate initial domain entries.

Add entries manually as you document business rules:

\`\`\`
## payments
Keywords: payment, stripe, checkout, invoice, subscription, billing, charge
Files:
  - payments/rules.md — Core payment processing rules
  - payments/edge-cases.md — Failed payments, retries, refunds
\`\`\`

---

*Planner reads this index before interviewing to know what domain knowledge exists.*
*carl-inject reads \`Keywords:\` lines to match prompt words and inject \`Files:\` entries.*
*UNIFY updates this file after each feature that touches a documented domain.*
`

// ─── Manifest ─────────────────────────────────────────────────────────────────

const MANIFEST = `# Principles Manifest
# CARL lookup table — maps keywords to architectural principle files.
# Read by carl-inject.ts plugin on every UserPromptSubmit.
#
# Format:
#   {KEY}_STATE=active|inactive
#   {KEY}_RECALL=comma, separated, keywords
#   {KEY}_FILE=docs/principles/{file}.md
#
# When a prompt word matches any keyword in _RECALL, the corresponding _FILE
# is injected into the agent's context before it processes the prompt.
# Add entries as /init-deep discovers patterns, or manually as you codify decisions.

AUTH_STATE=active
AUTH_RECALL=auth, authentication, login, logout, session, token, jwt, oauth, clerk, middleware
AUTH_FILE=docs/principles/auth-patterns.md

ERROR_STATE=active
ERROR_RECALL=error, exception, try, catch, throw, failure, handle, boundary
ERROR_FILE=docs/principles/error-handling.md

API_STATE=active
API_RECALL=api, route, endpoint, handler, request, response, next, http, rest
API_FILE=docs/principles/api-patterns.md

DATA_STATE=active
DATA_RECALL=database, prisma, query, schema, migration, model, repository, orm
DATA_FILE=docs/principles/data-patterns.md

TEST_STATE=active
TEST_RECALL=test, spec, jest, mock, fixture, coverage, unit, integration, e2e
TEST_FILE=docs/principles/test-patterns.md

# ── Add project-specific entries below ──────────────────────────────────────
# Example:
# PAYMENT_STATE=active
# PAYMENT_RECALL=payment, stripe, checkout, invoice, subscription, billing
# PAYMENT_FILE=docs/principles/payment-patterns.md
`
