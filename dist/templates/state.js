"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeState = writeState;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function writeState(projectDir) {
    const stateDir = path_1.default.join(projectDir, ".opencode", "state");
    (0, fs_1.writeFileSync)(path_1.default.join(stateDir, "persistent-context.md"), PERSISTENT_CONTEXT);
    (0, fs_1.writeFileSync)(path_1.default.join(stateDir, "execution-state.md"), EXECUTION_STATE);
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
`;
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
`;
//# sourceMappingURL=state.js.map