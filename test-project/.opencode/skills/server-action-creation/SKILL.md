---
name: server-action-creation
description: Create Next.js Server Actions with correct patterns
---

# Skill: Server Action Creation

## When this skill activates
Creating or editing files with `"use server"` directive, typically `actions.ts` or `**/actions/*.ts`.

## Required Steps

### 1. Server Action structure
```typescript
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
```

### 2. Using with useActionState (React 19)
```typescript
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
```

## Anti-patterns
- Missing auth checks
- No validation before DB operations
- Catching errors silently without logging
- Forgetting to revalidate affected paths
