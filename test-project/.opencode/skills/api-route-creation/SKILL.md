---
name: api-route-creation
description: Create Next.js App Router API routes with correct patterns
---

# Skill: API Route Creation

## When this skill activates
Creating or editing `app/api/**/*.ts` route files.

## Required Steps

### 1. Route handler structure
```typescript
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
```

### 2. Dynamic routes
```typescript
// app/api/resource/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ...
}
```

### 3. Authentication
Check auth before any business logic:
```typescript
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...
}
```

### 4. Validation
Always validate with Zod:
```typescript
const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})
```

## Anti-patterns
- No try/catch around async operations
- Exposing internal error messages to clients
- Missing input validation
- Returning 200 for errors
