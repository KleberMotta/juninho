# /init-deep — Deep Codebase Initialization

Perform a deep scan of the codebase and generate comprehensive domain documentation.

## Usage

```
/init-deep
```

## What happens

1. Scans all source files to map:
   - Domain entities and their relationships
   - API routes and their contracts
   - Service layer patterns
   - Data models and schema

2. Writes to `docs/domain/INDEX.md`:
   - Entity catalog with file locations
   - Pattern inventory (how things are done)
   - Dependency graph
   - Naming conventions observed

3. Updates `docs/principles/manifest` with:
   - Canonical code patterns found
   - Anti-patterns to avoid
   - Technology decisions

## When to use

- First time setting up the framework on an existing project
- After major refactors that change patterns
- When onboarding new agents to the codebase

## Result

The CARL plugin will use these docs to inject relevant context automatically.
