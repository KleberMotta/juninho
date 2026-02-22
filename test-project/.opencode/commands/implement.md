# /implement — Execute Plan or Spec

Invoke the `@implementer` agent to build what was planned or specified.

## Usage

```
/implement
/implement <specific task or file>
```

## Examples

```
/implement
/implement the authentication middleware
/implement docs/specs/user-profile.md
```

## What happens

1. `@implementer` reads the active `plan.md` (auto-loaded by plan-autoload plugin)
2. Or reads the specified spec file
3. Executes in waves:
   - Wave 1: Foundation (schema, types, migrations)
   - Wave 2: Core logic (services, API routes)
   - Wave 3: Integration (wire-up, tests)
4. Validates after each wave
5. Spawns `@validator` for spec compliance

## After implementation

Run `/implement` again if waves are incomplete, or `@unify` to merge and create PR.
