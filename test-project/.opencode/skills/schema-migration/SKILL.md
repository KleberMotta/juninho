---
name: schema-migration
description: Modify Prisma schema and create migrations safely
---

# Skill: Schema Migration

## When this skill activates
Editing `prisma/schema.prisma` or creating migration files.

## Required Steps

### 1. Before modifying schema
- Read the FULL current schema first
- Understand all relations that will be affected
- Check if there's existing data that constraints will affect
- Plan the migration: additive vs breaking change

### 2. Safe schema changes (additive — preferred)
```prisma
// Adding a new optional field — always safe
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?  // Add as optional first
  createdAt DateTime @default(now())
}
```

### 3. Breaking changes — require care
When adding required fields to existing models with data:
```prisma
// Step 1: Add as optional
newField String?

// Step 2: Backfill in a migration
// Step 3: Make required in a separate migration
newField String
```

### 4. Create migration
```bash
npx prisma migrate dev --name descriptive_migration_name
```

Migration name conventions:
- `add_user_profile`
- `add_index_to_email`
- `make_phone_optional`
- `add_payment_table`

### 5. Regenerate client
```bash
npx prisma generate
```

### 6. Update related types
After schema changes, update:
- TypeScript types that mirror the schema
- Zod validation schemas
- API response types
- Test fixtures

### 7. Verify
```bash
npx prisma studio  # visual inspection
npx tsc --noEmit   # type check
npm test           # run tests
```

## Anti-patterns
- Renaming columns without a migration step (data loss)
- Adding required columns without defaults to non-empty tables
- Forgetting to run `prisma generate` after schema changes
- Not updating TypeScript types after schema changes
