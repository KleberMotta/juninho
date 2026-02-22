# /handoff — End-of-Session Handoff

Prepare a handoff document for the next session or team member.

## Usage

```
/handoff
```

## What happens

1. Reads current `execution-state.md`
2. Summarizes:
   - What was completed this session
   - What is in progress (with file names and last known state)
   - What is blocked and why
   - Exact next step to continue

3. Updates `execution-state.md` with handoff notes

4. Optionally commits the state files:
   `git add .opencode/state/ && git commit -m "chore: session handoff"`

## Output format

```markdown
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
```
