"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDocs = writeDocs;
exports.patchOpencodeJson = patchOpencodeJson;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function writeDocs(projectDir) {
    (0, fs_1.writeFileSync)(path_1.default.join(projectDir, "AGENTS.md"), AGENTS_MD);
    (0, fs_1.writeFileSync)(path_1.default.join(projectDir, "docs", "domain", "INDEX.md"), DOMAIN_INDEX);
    (0, fs_1.writeFileSync)(path_1.default.join(projectDir, "docs", "principles", "manifest"), MANIFEST);
}
function patchOpencodeJson(projectDir) {
    const jsonPath = path_1.default.join(projectDir, "opencode.json");
    let existing = {};
    if ((0, fs_1.existsSync)(jsonPath)) {
        try {
            existing = JSON.parse((0, fs_1.readFileSync)(jsonPath, "utf-8"));
        }
        catch {
            // Malformed JSON — start fresh but warn
            console.warn("[juninho] Warning: existing opencode.json could not be parsed — overwriting.");
        }
    }
    const frameworkConfig = {
        agent: {
            planner: {
                description: "Strategic planner — turn a vague goal into an actionable plan.md",
                mode: "subagent",
                model: "anthropic/claude-opus-4-5",
            },
            "plan-reviewer": {
                description: "Reviews plans for quality — approve or reject with actionable feedback",
                mode: "subagent",
                model: "anthropic/claude-sonnet-4-5",
                permission: { task: "deny", bash: "deny" },
            },
            "spec-writer": {
                description: "Writes detailed feature specs via 5-phase interview",
                mode: "subagent",
                model: "anthropic/claude-opus-4-5",
            },
            implementer: {
                description: "Executes implementation plans wave by wave",
                mode: "subagent",
                model: "anthropic/claude-sonnet-4-5",
            },
            validator: {
                description: "Validates implementation against spec — blocks on failures",
                mode: "subagent",
                model: "anthropic/claude-sonnet-4-5",
            },
            reviewer: {
                description: "Advisory code reviewer — read-only, never blocks",
                mode: "subagent",
                model: "anthropic/claude-sonnet-4-5",
                permission: { bash: "deny", edit: "deny", write: "deny" },
            },
            unify: {
                description: "Reconciles plan vs delivery, updates docs, merges worktrees, creates PR",
                mode: "subagent",
                model: "anthropic/claude-sonnet-4-5",
            },
        },
        mcp: {
            context7: {
                type: "stdio",
                command: "npx",
                args: ["-y", "@upstash/context7-mcp@latest"],
            },
        },
    };
    // Deep merge: framework config fills in missing keys, never overwrites existing user config
    const merged = deepMerge(frameworkConfig, existing);
    (0, fs_1.writeFileSync)(jsonPath, JSON.stringify(merged, null, 2) + "\n");
}
function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const baseVal = base[key];
        const overrideVal = override[key];
        if (overrideVal !== null &&
            typeof overrideVal === "object" &&
            !Array.isArray(overrideVal) &&
            baseVal !== null &&
            typeof baseVal === "object" &&
            !Array.isArray(baseVal)) {
            result[key] = deepMerge(baseVal, overrideVal);
        }
        else {
            // Override value takes precedence (user config wins)
            result[key] = overrideVal;
        }
    }
    return result;
}
// ─── AGENTS.md ────────────────────────────────────────────────────────────────
const AGENTS_MD = `# AGENTS.md

This project uses the **Agentic Coding Framework** — a structured approach to AI-assisted development
with specialized agents, skills, and plugins auto-configured by [juninho](https://github.com/juninho).

## Quick Start

| Command | Agent | Purpose |
|---------|-------|---------|
| \`/plan <goal>\` | \`@planner\` | Create an actionable plan from a goal |
| \`/spec <feature>\` | \`@spec-writer\` | Write a detailed spec before building |
| \`/implement\` | \`@implementer\` | Execute the active plan wave by wave |
| \`/start-work <task>\` | — | Initialize a focused work session |
| \`/handoff\` | — | Prepare end-of-session handoff doc |
| \`/ulw-loop\` | — | Maximum parallelism mode |

## Agent Roster

### @planner
Strategic planning agent. Uses Metis→Prometheus→Momus protocol:
- Classifies intent (FEATURE/BUG/REFACTOR/RESEARCH/MIGRATION)
- Interviews proportional to complexity
- Writes \`plan.md\` + \`CONTEXT.md\`
- Loops with \`@plan-reviewer\` until approved

### @spec-writer
Specification agent. 5-phase interview:
Discovery → Requirements → Contract → Data → Review
Writes to \`docs/specs/{feature-name}.md\`

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

Plugins in \`.opencode/plugins/\` are auto-discovered by OpenCode:

| Plugin | Trigger | Purpose |
|--------|---------|---------|
| \`env-protection\` | Any file access | Block sensitive file reads/writes |
| \`auto-format\` | Write/Edit | Auto-format after file changes |
| \`plan-autoload\` | Session idle | Inject active plan into context |
| \`carl-inject\` | User prompt | Inject relevant domain docs |
| \`skill-inject\` | Write/Edit | Inject skill instructions by file pattern |
| \`intent-gate\` | User prompt | Classify intent for agent routing |
| \`todo-enforcer\` | Session idle | Re-inject incomplete tasks |
| \`comment-checker\` | Write/Edit | Flag obvious/redundant comments |
| \`hashline-read\` | Read | Add stable line references |
| \`hashline-edit\` | Edit | Validate stale hashline references |

## Custom Tools

Tools in \`.opencode/tools/\` extend agent capabilities:

- **find_pattern** — Find canonical code patterns for consistent implementation
- **next_version** — Get next migration/schema version number
- **lsp_diagnostics, lsp_goto_definition, lsp_find_references, lsp_document_symbols, lsp_workspace_symbols, lsp_rename** — LSP-like code intelligence
- **ast_grep_search, ast_grep_replace** — AST-based structural search and replace

## Skills

Skills in \`.opencode/skills/\` inject step-by-step instructions when editing specific file types:

| Skill | Activates on |
|-------|-------------|
| \`test-writing\` | \`*.test.ts\`, \`*.spec.ts\` |
| \`page-creation\` | \`app/**/page.tsx\` |
| \`api-route-creation\` | \`app/api/**/*.ts\` |
| \`server-action-creation\` | \`**/actions.ts\` |
| \`schema-migration\` | \`schema.prisma\` |

## State Files

| File | Purpose |
|------|---------|
| \`.opencode/state/persistent-context.md\` | Long-term project knowledge |
| \`.opencode/state/execution-state.md\` | Current session task list |
| \`.opencode/state/.plan-ready\` | Marker: active plan path (auto-managed) |

## Workflow

\`\`\`
Goal → /plan → plan.md approved → /implement → @validator → @unify → PR
         ↓
      /spec (for complex features)
         ↓
      docs/specs/{feature}.md → /plan → /implement
\`\`\`

## Conventions

- Plans are in \`plan.md\` (root or task dir)
- Specs are in \`docs/specs/\`
- Domain docs in \`docs/domain/INDEX.md\`
- Architectural decisions in \`.opencode/state/persistent-context.md\`
- Worktrees for parallel work in \`worktrees/\`
`;
// ─── Domain INDEX.md ──────────────────────────────────────────────────────────
const DOMAIN_INDEX = `# Domain Index

Auto-populated by \`/init-deep\`. Update after major refactors.

## How to use

The CARL plugin reads this file to inject relevant context when you reference domain concepts.
Run \`/init-deep\` to auto-populate from the codebase.

## Entities

<!-- Format: ### EntityName / File: path/to/file.ts / Relations: ... -->
<!-- Added by /init-deep -->

## Services / Repositories

<!-- Format: ### ServiceName / File: path/to/service.ts / Methods: ... -->
<!-- Added by /init-deep -->

## API Routes

<!-- Format: ### METHOD /api/path / File: app/api/.../route.ts / Auth: yes/no -->
<!-- Added by /init-deep -->

## UI Components

<!-- Format: ### ComponentName / File: path/to/component.tsx / Props: ... -->
<!-- Added by /init-deep -->

## Patterns

<!-- Recurring implementation patterns found in this codebase -->
<!-- Added by /init-deep -->

## Data Flow

<!-- How data moves through the system -->
<!-- Added by /init-deep or manually -->

---

*Run \`/init-deep\` to auto-populate this index from your codebase.*
`;
// ─── Manifest ─────────────────────────────────────────────────────────────────
const MANIFEST = `# Principles Manifest

CARL lookup table — maps domain keywords to relevant files and patterns.
Updated by /init-deep and manually over time.

## Format

Each entry: KEYWORD → file:path | pattern:name | agent:name

---

## Keywords

<!-- api → file:app/api -->
<!-- auth → file:middleware.ts | agent:@validator -->
<!-- database → file:prisma/schema.prisma | file:lib/db.ts -->
<!-- test → skill:test-writing | agent:@validator -->
<!-- plan → file:plan.md | agent:@planner -->
<!-- spec → file:docs/specs/ | agent:@spec-writer -->
<!-- implement → agent:@implementer | file:plan.md -->
<!-- validate → agent:@validator | file:docs/specs/ -->
<!-- review → agent:@reviewer -->
<!-- migration → skill:schema-migration | tool:next_version -->
<!-- component → skill:page-creation -->
<!-- action → skill:server-action-creation -->
<!-- route → skill:api-route-creation -->
<!-- pattern → tool:find_pattern -->

## Architectural Directives

<!-- Non-negotiable rules from the project architect -->
<!-- Format: DIRECTIVE: description -->
<!-- Example: DIRECTIVE: Always validate inputs with Zod at API boundaries -->
<!-- Example: DIRECTIVE: Never expose Prisma types to the API layer — use DTOs -->

## Technology Decisions

<!-- Format: DECISION: <what> — REASON: <why> — DATE: YYYY-MM-DD -->

---

*Populate this file as you discover patterns. CARL uses it to inject context automatically.*
`;
//# sourceMappingURL=docs.js.map