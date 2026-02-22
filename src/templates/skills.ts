import { writeFileSync } from "fs"
import path from "path"

export function writeSkills(projectDir: string): void {
  const skillsDir = path.join(projectDir, ".opencode", "skills")

  writeFileSync(path.join(skillsDir, "test-writing", "SKILL.md"), TEST_WRITING)
  writeFileSync(path.join(skillsDir, "page-creation", "SKILL.md"), PAGE_CREATION)
  writeFileSync(path.join(skillsDir, "api-route-creation", "SKILL.md"), API_ROUTE_CREATION)
  writeFileSync(path.join(skillsDir, "server-action-creation", "SKILL.md"), SERVER_ACTION_CREATION)
  writeFileSync(path.join(skillsDir, "schema-migration", "SKILL.md"), SCHEMA_MIGRATION)
}

// ─── Test Writing ────────────────────────────────────────────────────────────

const TEST_WRITING = `---
name: test-writing
description: Write unit and integration tests following project conventions
# Optional: uncomment to enable Playwright MCP for E2E tests
# mcp:
#   playwright:
#     command: npx
#     args: ["-y", "@playwright/mcp@latest"]
---

# Skill: Test Writing

## When this skill activates
Writing or editing \`*.test.ts\`, \`*.test.tsx\`, \`*.spec.ts\`, or \`*.spec.tsx\` files.

## Required Steps

### 1. Read the implementation first
Before writing any test, read the file being tested. Understand:
- What it does (not what you think it does)
- Its dependencies and side effects
- Error cases and edge conditions

### 2. Test structure
Follow the AAA pattern strictly:
\`\`\`typescript
describe("ComponentName / functionName", () => {
  describe("when <condition>", () => {
    it("should <expected behavior>", () => {
      // Arrange
      const input = ...

      // Act
      const result = ...

      // Assert
      expect(result).toBe(...)
    })
  })
})
\`\`\`

### 3. Coverage requirements
- Happy path: at least 1 test
- Error cases: test each distinct error path
- Edge cases: empty inputs, boundary values, null/undefined
- Do NOT test implementation details — test behavior

### 4. Mock strategy
- Mock external dependencies (APIs, DB, file system)
- Do NOT mock the module under test
- Use \`vi.mock()\` or \`jest.mock()\` for module mocking
- Use \`vi.spyOn()\` for method spying

### 5. Async tests
Always use \`async/await\`:
\`\`\`typescript
it("should handle async operation", async () => {
  const result = await myAsyncFunction()
  expect(result).toEqual(expected)
})
\`\`\`

### 6. Naming conventions
- Describe block: noun (component/function name)
- Nested describe: "when <condition>"
- It block: "should <verb> <outcome>"
- Test file: \`{module}.test.ts\` co-located with source

## Anti-patterns to avoid
- \`expect(true).toBe(true)\` — meaningless assertion
- Snapshot tests for logic — use specific assertions
- Testing private methods directly
- \`expect.assertions(0)\` — always assert something
- Tests that depend on order of execution
`

// ─── Page Creation ────────────────────────────────────────────────────────────

const PAGE_CREATION = `---
name: page-creation
description: Create Next.js App Router pages with correct patterns
---

# Skill: Page Creation

## When this skill activates
Creating or editing \`app/**/page.tsx\` or \`app/**/layout.tsx\` files.

## Required Steps

### 1. Determine page type
- **Server Component** (default): data fetching, no interactivity
- **Client Component**: requires \`"use client"\`, interactivity, hooks
- **Mixed**: Server wrapper + Client island

### 2. Server Component pattern
\`\`\`typescript
// app/example/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
}

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ExamplePage({ params, searchParams }: PageProps) {
  // Fetch data at the server level
  const data = await fetchData(params.id)

  return (
    <main>
      {/* render data */}
    </main>
  )
}
\`\`\`

### 3. Client Component pattern
\`\`\`typescript
"use client"
// app/example/client-component.tsx
import { useState, useEffect } from "react"

interface Props {
  initialData: SomeType
}

export function ExampleClient({ initialData }: Props) {
  const [state, setState] = useState(initialData)
  // ...
}
\`\`\`

### 4. Loading and error states
Always create companion files:
- \`loading.tsx\` — skeleton or spinner
- \`error.tsx\` — error boundary (must be client component)
- \`not-found.tsx\` — 404 state

### 5. Data fetching
- Use \`fetch()\` with proper cache options in Server Components
- Use React Query / SWR for client-side data fetching
- Never fetch in useEffect for initial data

## Anti-patterns to avoid
- Mixing server and client concerns in one file
- Using \`useEffect\` for data that could be server-fetched
- Missing loading states
- Not handling error boundaries
`

// ─── API Route Creation ───────────────────────────────────────────────────────

const API_ROUTE_CREATION = `---
name: api-route-creation
description: Create Next.js App Router API routes with correct patterns
---

# Skill: API Route Creation

## When this skill activates
Creating or editing \`app/api/**/*.ts\` route files.

## Required Steps

### 1. Route handler structure
\`\`\`typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GET — list or single resource
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    const data = await getData(id)
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.error("[API GET /resource]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create resource
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = CreateSchema.parse(body)

    const result = await createResource(validated)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("[API POST /resource]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
\`\`\`

### 2. Dynamic routes
\`\`\`typescript
// app/api/resource/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ...
}
\`\`\`

### 3. Authentication
Check auth before any business logic:
\`\`\`typescript
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...
}
\`\`\`

### 4. Validation
Always validate with Zod:
\`\`\`typescript
const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})
\`\`\`

## Anti-patterns
- No try/catch around async operations
- Exposing internal error messages to clients
- Missing input validation
- Returning 200 for errors
`

// ─── Server Action Creation ───────────────────────────────────────────────────

const SERVER_ACTION_CREATION = `---
name: server-action-creation
description: Create Next.js Server Actions with correct patterns
---

# Skill: Server Action Creation

## When this skill activates
Creating or editing files with \`"use server"\` directive, typically \`actions.ts\` or \`**/actions/*.ts\`.

## Required Steps

### 1. Server Action structure
\`\`\`typescript
"use server"
// app/actions/example.ts
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createExample(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  // 1. Auth check
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  // 2. Validate
  const raw = Object.fromEntries(formData)
  const result = CreateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  // 3. Execute
  try {
    const created = await db.example.create({ data: result.data })

    // 4. Revalidate
    revalidatePath("/examples")

    return { success: true, data: { id: created.id } }
  } catch (error) {
    console.error("[createExample]", error)
    return { success: false, error: "Failed to create. Please try again." }
  }
}
\`\`\`

### 2. Using with useActionState (React 19)
\`\`\`typescript
"use client"
import { useActionState } from "react"
import { createExample } from "../actions/example"

export function ExampleForm() {
  const [state, action, isPending] = useActionState(createExample, null)
  return (
    <form action={action}>
      {state?.error && <p>{state.error}</p>}
      <button disabled={isPending}>Submit</button>
    </form>
  )
}
\`\`\`

## Anti-patterns
- Missing auth checks
- No validation before DB operations
- Catching errors silently without logging
- Forgetting to revalidate affected paths
`

// ─── Schema Migration ─────────────────────────────────────────────────────────

const SCHEMA_MIGRATION = `---
name: schema-migration
description: Modify Prisma schema and create migrations safely
---

# Skill: Schema Migration

## When this skill activates
Editing \`prisma/schema.prisma\` or creating migration files.

## Required Steps

### 1. Before modifying schema
- Read the FULL current schema first
- Understand all relations that will be affected
- Check if there's existing data that constraints will affect
- Plan the migration: additive vs breaking change

### 2. Safe schema changes (additive — preferred)
\`\`\`prisma
// Adding a new optional field — always safe
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?  // Add as optional first
  createdAt DateTime @default(now())
}
\`\`\`

### 3. Breaking changes — require care
When adding required fields to existing models with data:
\`\`\`prisma
// Step 1: Add as optional
newField String?

// Step 2: Backfill in a migration
// Step 3: Make required in a separate migration
newField String
\`\`\`

### 4. Create migration
\`\`\`bash
npx prisma migrate dev --name descriptive_migration_name
\`\`\`

Migration name conventions:
- \`add_user_profile\`
- \`add_index_to_email\`
- \`make_phone_optional\`
- \`add_payment_table\`

### 5. Regenerate client
\`\`\`bash
npx prisma generate
\`\`\`

### 6. Update related types
After schema changes, update:
- TypeScript types that mirror the schema
- Zod validation schemas
- API response types
- Test fixtures

### 7. Verify
\`\`\`bash
npx prisma studio  # visual inspection
npx tsc --noEmit   # type check
npm test           # run tests
\`\`\`

## Anti-patterns
- Renaming columns without a migration step (data loss)
- Adding required columns without defaults to non-empty tables
- Forgetting to run \`prisma generate\` after schema changes
- Not updating TypeScript types after schema changes
`
