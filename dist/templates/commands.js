"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCommands = writeCommands;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function writeCommands(projectDir) {
    const commandsDir = path_1.default.join(projectDir, ".opencode", "commands");
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "plan.md"), PLAN);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "spec.md"), SPEC);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "implement.md"), IMPLEMENT);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "init-deep.md"), INIT_DEEP);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "start-work.md"), START_WORK);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "handoff.md"), HANDOFF);
    (0, fs_1.writeFileSync)(path_1.default.join(commandsDir, "ulw-loop.md"), ULW_LOOP);
}
// ─── /plan ────────────────────────────────────────────────────────────────────
const PLAN = `# /plan — Strategic Planning

Invoke the \`@planner\` agent to create an actionable plan from a goal.

## Usage

\`\`\`
/plan <goal or task description>
\`\`\`

## Examples

\`\`\`
/plan add user authentication with email and Google OAuth
/plan fix the N+1 query bug in the appointments list
/plan refactor the service layer to use the repository pattern
\`\`\`

## What happens

1. \`@planner\` classifies your intent
2. Explores the codebase for context
3. Interviews you (proportional to complexity)
4. Writes \`plan.md\` and \`CONTEXT.md\`
5. Spawns \`@plan-reviewer\` for quality check
6. Marks plan as ready for \`/implement\`

## After planning

Run \`/implement\` to execute the plan, or \`/spec\` first for complex features.
`;
// ─── /spec ────────────────────────────────────────────────────────────────────
const SPEC = `# /spec — Feature Specification

Invoke the \`@spec-writer\` agent to create a detailed spec before implementation.

## Usage

\`\`\`
/spec <feature name or description>
\`\`\`

## Examples

\`\`\`
/spec user profile with avatar upload
/spec appointment booking flow
/spec payment integration with Stripe
\`\`\`

## What happens

1. \`@spec-writer\` runs a 5-phase interview:
   - Discovery: problem and users
   - Requirements: functional and non-functional
   - Contract: API and interface definitions
   - Data: schema and migration strategy
   - Review: verify completeness

2. Writes spec to \`docs/specs/{feature-name}.md\`

## After spec

Run \`/plan\` to create an execution plan, then \`/implement\` to build.
`;
// ─── /implement ───────────────────────────────────────────────────────────────
const IMPLEMENT = `# /implement — Execute Plan or Spec

Invoke the \`@implementer\` agent to build what was planned or specified.

## Usage

\`\`\`
/implement
/implement <specific task or file>
\`\`\`

## Examples

\`\`\`
/implement
/implement the authentication middleware
/implement docs/specs/user-profile.md
\`\`\`

## What happens

1. \`@implementer\` reads the active \`plan.md\` (auto-loaded by plan-autoload plugin)
2. Or reads the specified spec file
3. Executes in waves:
   - Wave 1: Foundation (schema, types, migrations)
   - Wave 2: Core logic (services, API routes)
   - Wave 3: Integration (wire-up, tests)
4. Validates after each wave
5. Spawns \`@validator\` for spec compliance

## After implementation

Run \`/implement\` again if waves are incomplete, or \`@unify\` to merge and create PR.
`;
// ─── /init-deep ───────────────────────────────────────────────────────────────
const INIT_DEEP = `# /init-deep — Deep Codebase Initialization

Perform a deep scan of the codebase and generate comprehensive domain documentation.

## Usage

\`\`\`
/init-deep
\`\`\`

## What happens

1. Scans all source files to map:
   - Domain entities and their relationships
   - API routes and their contracts
   - Service layer patterns
   - Data models and schema

2. Writes to \`docs/domain/INDEX.md\`:
   - Entity catalog with file locations
   - Pattern inventory (how things are done)
   - Dependency graph
   - Naming conventions observed

3. Updates \`docs/principles/manifest\` with:
   - Canonical code patterns found
   - Anti-patterns to avoid
   - Technology decisions

## When to use

- First time setting up the framework on an existing project
- After major refactors that change patterns
- When onboarding new agents to the codebase

## Result

The CARL plugin will use these docs to inject relevant context automatically.
`;
// ─── /start-work ─────────────────────────────────────────────────────────────
const START_WORK = `# /start-work — Begin a Work Session

Initialize context for a focused work session on a specific task.

## Usage

\`\`\`
/start-work <task description or issue number>
\`\`\`

## Examples

\`\`\`
/start-work issue #42 — fix login redirect loop
/start-work implement the dashboard analytics widget
/start-work #123
\`\`\`

## What happens

1. Loads \`docs/domain/INDEX.md\` for domain context
2. Checks \`execution-state.md\` for any in-progress work
3. If a \`plan.md\` exists: loads it and presents next steps
4. If no plan: asks whether to \`/plan\` first or jump straight to \`/implement\`
5. Sets up \`execution-state.md\` with the current task

## After starting work

The session is now focused. Use \`/implement\` to build, \`@validator\` to check, \`/handoff\` when done.
`;
// ─── /handoff ─────────────────────────────────────────────────────────────────
const HANDOFF = `# /handoff — End-of-Session Handoff

Prepare a handoff document for the next session or team member.

## Usage

\`\`\`
/handoff
\`\`\`

## What happens

1. Reads current \`execution-state.md\`
2. Summarizes:
   - What was completed this session
   - What is in progress (with file names and last known state)
   - What is blocked and why
   - Exact next step to continue

3. Updates \`execution-state.md\` with handoff notes

4. Optionally commits the state files:
   \`git add .opencode/state/ && git commit -m "chore: session handoff"\`

## Output format

\`\`\`markdown
# Session Handoff — {date}

## Completed
- [x] Task description

## In Progress
- [ ] Task description
  - Last state: {what was done}
  - Next step: {exactly what to do next}
  - Files: {relevant files}

## Blocked
- [ ] Task description
  - Blocker: {what's blocking}
  - Resolution needed: {what needs to happen}

## Next Session: Start with
{single, clear action to take first}
\`\`\`
`;
// ─── /ulw-loop ────────────────────────────────────────────────────────────────
const ULW_LOOP = `# /ulw-loop — Ultra Work Loop

Activate maximum parallelism mode — work until all tasks in execution-state.md are complete.

## Usage

\`\`\`
/ulw-loop
/ulw-loop <task or goal>
\`\`\`

## What happens

1. Reads \`execution-state.md\` for task list
2. Identifies tasks that can run in parallel (no dependencies)
3. Spins up multiple \`@implementer\` agents in parallel via worktrees:
   - Each worktree works on independent files
   - No merge conflicts by design
4. \`@validator\` runs after each wave
5. Loop continues until all tasks are marked complete
6. \`@unify\` merges worktrees and creates PR

## When to use

- Many independent tasks in the backlog
- Large feature that can be parallelized
- When you want maximum throughput

## Parallel execution model

\`\`\`
Wave 1 (parallel):
  worktree-a: implement service layer
  worktree-b: implement API routes
  worktree-c: implement UI components

Wave 2 (sequential):
  main: wire everything together

Wave 3 (parallel):
  test: unit tests
  test: integration tests
\`\`\`

## Safety

- Each worktree is isolated — no cross-contamination
- Merge happens only after all waves pass validation
- If any wave fails, the loop pauses and reports blockers
`;
//# sourceMappingURL=commands.js.map