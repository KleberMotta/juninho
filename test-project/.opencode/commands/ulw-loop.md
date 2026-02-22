# /ulw-loop — Ultra Work Loop

Activate maximum parallelism mode — work until all tasks in execution-state.md are complete.

## Usage

```
/ulw-loop
/ulw-loop <task or goal>
```

## What happens

1. Reads `execution-state.md` for task list
2. Identifies tasks that can run in parallel (no dependencies)
3. Spins up multiple `@implementer` agents in parallel via worktrees:
   - Each worktree works on independent files
   - No merge conflicts by design
4. `@validator` runs after each wave
5. Loop continues until all tasks are marked complete
6. `@unify` merges worktrees and creates PR

## When to use

- Many independent tasks in the backlog
- Large feature that can be parallelized
- When you want maximum throughput

## Parallel execution model

```
Wave 1 (parallel):
  worktree-a: implement service layer
  worktree-b: implement API routes
  worktree-c: implement UI components

Wave 2 (sequential):
  main: wire everything together

Wave 3 (parallel):
  test: unit tests
  test: integration tests
```

## Safety

- Each worktree is isolated — no cross-contamination
- Merge happens only after all waves pass validation
- If any wave fails, the loop pauses and reports blockers
