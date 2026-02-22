# /plan — Strategic Planning

Invoke the `@planner` agent to create an actionable plan from a goal.

## Usage

```
/plan <goal or task description>
```

## Examples

```
/plan add user authentication with email and Google OAuth
/plan fix the N+1 query bug in the appointments list
/plan refactor the service layer to use the repository pattern
```

## What happens

1. `@planner` classifies your intent
2. Explores the codebase for context
3. Interviews you (proportional to complexity)
4. Writes `plan.md` and `CONTEXT.md`
5. Spawns `@plan-reviewer` for quality check
6. Marks plan as ready for `/implement`

## After planning

Run `/implement` to execute the plan, or `/spec` first for complex features.
