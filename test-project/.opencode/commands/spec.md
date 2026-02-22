# /spec — Feature Specification

Invoke the `@spec-writer` agent to create a detailed spec before implementation.

## Usage

```
/spec <feature name or description>
```

## Examples

```
/spec user profile with avatar upload
/spec appointment booking flow
/spec payment integration with Stripe
```

## What happens

1. `@spec-writer` runs a 5-phase interview:
   - Discovery: problem and users
   - Requirements: functional and non-functional
   - Contract: API and interface definitions
   - Data: schema and migration strategy
   - Review: verify completeness

2. Writes spec to `docs/specs/{feature-name}.md`

## After spec

Run `/plan` to create an execution plan, then `/implement` to build.
