import { writeFileSync } from "fs"
import path from "path"

export function writeState(projectDir: string): void {
  const stateDir = path.join(projectDir, ".opencode", "state")

  writeFileSync(path.join(stateDir, "persistent-context.md"), PERSISTENT_CONTEXT)
  writeFileSync(path.join(stateDir, "execution-state.md"), EXECUTION_STATE)
  writeFileSync(path.join(stateDir, "validator-work.md"), VALIDATOR_WORK)
  writeFileSync(path.join(stateDir, "implementer-work.md"), IMPLEMENTER_WORK)
}

// ─── Persistent Context ───────────────────────────────────────────────────────

const PERSISTENT_CONTEXT = `# Persistent Context

This file persists important context across sessions. Update it when you learn something
that should be remembered long-term about this project.

## Project Identity

- **Name**: (fill in)
- **Purpose**: (fill in)
- **Tech stack**: (fill in)
- **Team size**: (fill in)

## Architectural Decisions

<!-- Record significant architectural decisions here -->
<!-- Format: ## Decision: <title> / Date: YYYY-MM-DD / Status: ACCEPTED|DEPRECATED -->

## Known Constraints

<!-- Hard constraints that affect all decisions -->
<!-- Examples: "Must support IE11", "Max 200ms response time", "No new dependencies without approval" -->

## Recurring Patterns

<!-- Patterns that appear repeatedly in this codebase -->
<!-- Update after /init-deep or when you discover a strong pattern -->

## Anti-Patterns Found

<!-- Things that have been tried and caused problems -->
<!-- Format: - <pattern>: <why it's bad in this codebase> -->

## External Systems

<!-- APIs, services, databases this project depends on -->
<!-- Format: - **Name**: purpose, auth method, rate limits -->

## Glossary

<!-- Domain-specific terms and their meanings -->
<!-- Format: - **Term**: definition -->
`

// ─── Execution State ──────────────────────────────────────────────────────────

const EXECUTION_STATE = `# Execution State

Tracks current work in progress. Updated by agents during execution.
The todo-enforcer plugin reads this file to prevent drift.

## Current Session

- **Started**: (auto-filled by /start-work)
- **Goal**: (auto-filled)
- **Plan**: (path to plan.md if active)

## Task List

<!-- Tasks are added by /plan and checked off by @implementer -->
<!-- Format: - [ ] task description (agent: @agentname) -->

## In Progress

<!-- Currently active work items -->

## Completed This Session

<!-- Finished items — move here from Task List when done -->

## Blocked

<!-- Items that can't proceed — include blocker description -->
<!-- Format: - [ ] task (BLOCKED: reason) -->

## Session Log

<!-- Brief log of what happened — helps with /handoff -->
<!-- Format: HH:MM - action taken -->

---

*Last updated: (auto-filled)*
*Next action: (fill in at end of session for /handoff)*
`

// ─── Validator Work ───────────────────────────────────────────────────────────

const VALIDATOR_WORK = `# Validator Work Log

Per-agent scratch space and audit trail for the \`@validator\` agent.
Written by @validator during each validation pass. Read by UNIFY to understand what was deferred.

## Current Validation Pass

- Spec: (path to spec being validated)
- Feature: (feature slug)
- Date: (auto-filled by validator)

## Results

| Criterion | Tier | Notes |
|-----------|------|-------|
| (none yet) | — | — |

## Technical Debt (NOTE tier)

Accepted concerns that don't block approval — review in next iteration:

- (none)

## Fixes Applied Directly (FIX tier)

Changes made by @validator to resolve FIX-tier issues:

- (none)

## Blockers (BLOCK tier)

Must be resolved before approval can be granted:

- (none)

## Verdict

(APPROVED | APPROVED_WITH_NOTES | BLOCKED)

---

*Reset by UNIFY at end of each feature cycle.*
`

// ─── Implementer Work ─────────────────────────────────────────────────────────

const IMPLEMENTER_WORK = `# Implementer Work Log

Per-agent scratch space for the \`@implementer\` agent.
Tracks in-progress decisions, blockers, and deviations from the plan.

## Current Task

- Task ID: (from plan.md)
- Wave: (wave number)
- Worktree: (path, e.g., worktrees/feature-task-1)
- Branch: (feature branch name)

## Decisions Made

Choices made during implementation that deviate from or extend the plan:

- (none)

## Blockers

Issues that need resolution before task can proceed:

- (none)

## Files Modified

Track which files were changed in this session:

- (none)

---

*Updated by @implementer. Reset by UNIFY at end of each feature cycle.*
`
