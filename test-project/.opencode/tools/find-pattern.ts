import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { existsSync, readFileSync } from "fs"
import path from "path"

export const find_pattern = tool({
  name: "find_pattern",
  description: "Find canonical code patterns in the codebase for consistent implementation",
  parameters: z.object({
    patternType: z.enum([
      "api-route",
      "server-action",
      "react-component",
      "prisma-query",
      "error-handler",
      "test-unit",
      "test-integration",
      "zod-schema",
      "middleware",
    ]).describe("The type of pattern to find"),
    cwd: z.string().optional().describe("Working directory (defaults to process.cwd())"),
  }),
  execute: async ({ patternType, cwd: cwdInput }) => {
    const cwd = cwdInput ?? process.cwd()
    const manifestPath = path.join(cwd, "docs", "principles", "manifest")

    if (existsSync(manifestPath)) {
      const manifest = readFileSync(manifestPath, "utf-8")
      const lines = manifest.split("\n")
      const section = lines
        .slice(lines.findIndex((l) => l.toLowerCase().includes(patternType)))
        .slice(0, 20)
        .join("\n")
      if (section.trim()) return { pattern: patternType, example: section }
    }

    // Fallback patterns
    const FALLBACK_PATTERNS: Record<string, string> = {
      "api-route": `// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}`,
      "server-action": `// app/actions/example.ts
"use server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({ name: z.string().min(1) })

export async function createExample(formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData))
  if (!result.success) return { error: result.error.flatten() }
  // ... implementation
  revalidatePath("/")
  return { success: true }
}`,
      "zod-schema": `import { z } from "zod"

export const ExampleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
})

export type Example = z.infer<typeof ExampleSchema>`,
    }

    return {
      pattern: patternType,
      example: FALLBACK_PATTERNS[patternType] ?? "No canonical pattern found. Check docs/principles/manifest.",
    }
  },
})
