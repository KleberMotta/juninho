# /start-work — Begin a Work Session

Initialize context for a focused work session on a specific task.

## Usage

```
/start-work <task description or issue number>
```

## Examples

```
/start-work issue #42 — fix login redirect loop
/start-work implement the dashboard analytics widget
/start-work #123
```

## What happens

1. Loads `docs/domain/INDEX.md` for domain context
2. Checks `execution-state.md` for any in-progress work
3. If a `plan.md` exists: loads it and presents next steps
4. If no plan: asks whether to `/plan` first or jump straight to `/implement`
5. Sets up `execution-state.md` with the current task

## After starting work

The session is now focused. Use `/implement` to build, `@validator` to check, `/handoff` when done.
