---
name: page-creation
description: Create Next.js App Router pages with correct patterns
---

# Skill: Page Creation

## When this skill activates
Creating or editing `app/**/page.tsx` or `app/**/layout.tsx` files.

## Required Steps

### 1. Determine page type
- **Server Component** (default): data fetching, no interactivity
- **Client Component**: requires `"use client"`, interactivity, hooks
- **Mixed**: Server wrapper + Client island

### 2. Server Component pattern
```typescript
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
```

### 3. Client Component pattern
```typescript
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
```

### 4. Loading and error states
Always create companion files:
- `loading.tsx` — skeleton or spinner
- `error.tsx` — error boundary (must be client component)
- `not-found.tsx` — 404 state

### 5. Data fetching
- Use `fetch()` with proper cache options in Server Components
- Use React Query / SWR for client-side data fetching
- Never fetch in useEffect for initial data

## Anti-patterns to avoid
- Mixing server and client concerns in one file
- Using `useEffect` for data that could be server-fetched
- Missing loading states
- Not handling error boundaries
