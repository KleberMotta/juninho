import { writeFileSync } from "fs"
import path from "path"

export function writeTools(projectDir: string): void {
  const toolsDir = path.join(projectDir, ".opencode", "tools")

  writeFileSync(path.join(toolsDir, "find-pattern.ts"), FIND_PATTERN)
  writeFileSync(path.join(toolsDir, "next-version.ts"), NEXT_VERSION)
  writeFileSync(path.join(toolsDir, "lsp.ts"), LSP)
  writeFileSync(path.join(toolsDir, "ast-grep.ts"), AST_GREP)
}

// ─── Find Pattern ─────────────────────────────────────────────────────────────

const FIND_PATTERN = `import { tool } from "@opencode-ai/plugin"
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
      const lines = manifest.split("\\n")
      const section = lines
        .slice(lines.findIndex((l) => l.toLowerCase().includes(patternType)))
        .slice(0, 20)
        .join("\\n")
      if (section.trim()) return { pattern: patternType, example: section }
    }

    // Fallback patterns
    const FALLBACK_PATTERNS: Record<string, string> = {
      "api-route": \`// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}\`,
      "server-action": \`// app/actions/example.ts
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
}\`,
      "zod-schema": \`import { z } from "zod"

export const ExampleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
})

export type Example = z.infer<typeof ExampleSchema>\`,
    }

    return {
      pattern: patternType,
      example: FALLBACK_PATTERNS[patternType] ?? "No canonical pattern found. Check docs/principles/manifest.",
    }
  },
})
`

// ─── Next Version ─────────────────────────────────────────────────────────────

const NEXT_VERSION = `import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { existsSync, readdirSync } from "fs"
import path from "path"

export const next_version = tool({
  name: "next_version",
  description: "Get the next version number for migrations or schema files",
  parameters: z.object({
    type: z.enum(["migration", "schema"]).describe("Type of versioned file"),
    cwd: z.string().optional().describe("Working directory"),
  }),
  execute: async ({ type, cwd: cwdInput }) => {
    const cwd = cwdInput ?? process.cwd()

    const dirs: Record<string, string[]> = {
      migration: [
        "prisma/migrations",
        "db/migrations",
        "migrations",
        "drizzle",
      ],
      schema: [
        "prisma",
        "db",
        "src/db",
      ],
    }

    for (const dir of dirs[type]) {
      const fullDir = path.join(cwd, dir)
      if (!existsSync(fullDir)) continue

      const entries = readdirSync(fullDir)
        .filter((e) => /^\\d/.test(e))
        .sort()

      if (entries.length === 0) {
        return { nextVersion: "0001", dir: fullDir, existing: [] }
      }

      const lastEntry = entries[entries.length - 1]
      const match = /^(\\d+)/.exec(lastEntry)
      if (!match) continue

      const lastNum = parseInt(match[1], 10)
      const nextNum = String(lastNum + 1).padStart(match[1].length, "0")

      return {
        nextVersion: nextNum,
        dir: fullDir,
        existing: entries.slice(-3),
        lastEntry,
      }
    }

    return {
      nextVersion: "0001",
      dir: "migrations/",
      existing: [],
      note: "No migration directory found. Create one first.",
    }
  },
})
`

// ─── LSP ──────────────────────────────────────────────────────────────────────

const LSP = `import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { execSync } from "child_process"

// LSP tools via typescript-language-server CLI
// Falls back to tsc for type checking if LSP not available

function runTsc(cwd: string, args: string): string {
  try {
    return execSync(\`npx tsc \${args}\`, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] })
  } catch (e: any) {
    return e.stdout ?? e.message ?? "tsc failed"
  }
}

export const lsp_diagnostics = tool({
  name: "lsp_diagnostics",
  description: "Get TypeScript diagnostics (errors and warnings) for a file or directory",
  parameters: z.object({
    path: z.string().describe("File or directory to check"),
    severity: z.enum(["error", "warning", "info"]).optional().default("error"),
  }),
  execute: async ({ path: targetPath, severity }) => {
    const output = runTsc(process.cwd(), \`--noEmit --pretty false 2>&1 | grep "\${targetPath}"\`)
    const lines = output.split("\\n").filter((l) => {
      if (severity === "error") return l.includes("error TS")
      if (severity === "warning") return l.includes("warning TS")
      return l.trim().length > 0
    })
    return { diagnostics: lines, count: lines.length }
  },
})

export const lsp_goto_definition = tool({
  name: "lsp_goto_definition",
  description: "Find where a symbol is defined",
  parameters: z.object({
    file: z.string().describe("Source file path"),
    line: z.number().describe("Line number (1-indexed)"),
    character: z.number().describe("Character position (0-indexed)"),
  }),
  execute: async ({ file, line, character }) => {
    // Use grep as fallback for definition finding
    try {
      const content = require("fs").readFileSync(file, "utf-8")
      const lines = content.split("\\n")
      const targetLine = lines[line - 1] ?? ""
      // Extract symbol at position
      const before = targetLine.slice(0, character)
      const after = targetLine.slice(character)
      const symbolMatch = /[\\w$]+$/.exec(before)
      const symbolEnd = /^[\\w$]*/.exec(after)
      const symbol = (symbolMatch?.[0] ?? "") + (symbolEnd?.[0] ?? "")
      return { symbol, hint: \`Search for 'export.*\${symbol}|function \${symbol}|class \${symbol}|const \${symbol}'\` }
    } catch {
      return { error: "Could not read file" }
    }
  },
})

export const lsp_find_references = tool({
  name: "lsp_find_references",
  description: "Find all references to a symbol across the codebase",
  parameters: z.object({
    file: z.string(),
    line: z.number(),
    character: z.number(),
    includeDeclaration: z.boolean().optional().default(true),
  }),
  execute: async ({ file, line, character }) => {
    try {
      const content = require("fs").readFileSync(file, "utf-8")
      const lineContent = content.split("\\n")[line - 1] ?? ""
      const before = lineContent.slice(0, character)
      const after = lineContent.slice(character)
      const symbol = (/[\\w$]+$/.exec(before)?.[0] ?? "") + (/^[\\w$]*/.exec(after)?.[0] ?? "")
      if (!symbol) return { error: "No symbol at position" }
      const result = execSync(\`grep -rn --include="*.ts" --include="*.tsx" "\${symbol}" .\`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
      const refs = result.split("\\n").filter(Boolean)
      return { symbol, references: refs.slice(0, 20), total: refs.length }
    } catch (e: any) {
      return { references: [], note: e.stdout ?? "No references found" }
    }
  },
})

export const lsp_document_symbols = tool({
  name: "lsp_document_symbols",
  description: "Get all symbols (functions, classes, variables) in a file",
  parameters: z.object({ file: z.string() }),
  execute: async ({ file }) => {
    try {
      const content = require("fs").readFileSync(file, "utf-8")
      const lines = content.split("\\n")
      const symbols: Array<{ line: number; kind: string; name: string }> = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const patterns: Array<[RegExp, string]> = [
          [/^export\\s+(async\\s+)?function\\s+(\\w+)/, "function"],
          [/^export\\s+(const|let|var)\\s+(\\w+)/, "variable"],
          [/^export\\s+(default\\s+)?class\\s+(\\w+)/, "class"],
          [/^export\\s+(type|interface)\\s+(\\w+)/, "type"],
          [/^\\s+(async\\s+)?(\\w+)\\s*\\(/, "method"],
        ]
        for (const [pattern, kind] of patterns) {
          const match = pattern.exec(line)
          if (match) {
            symbols.push({ line: i + 1, kind, name: match[match.length - 1] })
            break
          }
        }
      }
      return { file, symbols }
    } catch {
      return { error: "Could not read file" }
    }
  },
})

export const lsp_workspace_symbols = tool({
  name: "lsp_workspace_symbols",
  description: "Search for symbols by name across the entire workspace",
  parameters: z.object({
    query: z.string().describe("Symbol name or pattern to search"),
    file: z.string().optional().describe("Any file in workspace (for language server context)"),
  }),
  execute: async ({ query }) => {
    try {
      const result = execSync(
        \`grep -rn --include="*.ts" --include="*.tsx" -E "export.*(function|class|const|interface|type).*\${query}" .\`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      )
      return { query, matches: result.split("\\n").filter(Boolean).slice(0, 15) }
    } catch (e: any) {
      return { query, matches: [], note: "No matches found" }
    }
  },
})

export const lsp_prepare_rename = tool({
  name: "lsp_prepare_rename",
  description: "Check if the symbol at the given position can be safely renamed. Returns the symbol name and its range.",
  parameters: z.object({
    file: z.string().describe("Source file path"),
    line: z.number().describe("Line number (1-indexed)"),
    character: z.number().describe("Character position (0-indexed)"),
  }),
  execute: async ({ file, line, character }) => {
    try {
      const content = require("fs").readFileSync(file, "utf-8")
      const lines = content.split("\\n")
      const lineContent = lines[line - 1] ?? ""
      const before = lineContent.slice(0, character)
      const after = lineContent.slice(character)
      const symBefore = /[\\w$]+$/.exec(before)?.[0] ?? ""
      const symAfter = /^[\\w$]*/.exec(after)?.[0] ?? ""
      const symbol = symBefore + symAfter

      if (!symbol) {
        return { canRename: false, reason: "No symbol at the given position" }
      }

      // Symbols that cannot be renamed: language keywords
      const KEYWORDS = new Set(["const", "let", "var", "function", "class", "import", "export", "return", "if", "else", "for", "while"])
      if (KEYWORDS.has(symbol)) {
        return { canRename: false, reason: \`'\${symbol}' is a language keyword\` }
      }

      return {
        canRename: true,
        symbol,
        range: {
          start: { line, character: character - symBefore.length },
          end: { line, character: character + symAfter.length },
        },
        hint: "Call lsp_rename with newName to apply the rename across the workspace.",
      }
    } catch {
      return { canRename: false, reason: "Could not read file" }
    }
  },
})

export const lsp_rename = tool({
  name: "lsp_rename",
  description: "Preview rename of a symbol across all files (dry-run only — apply with sed/Edit)",
  parameters: z.object({
    file: z.string(),
    line: z.number(),
    character: z.number(),
    newName: z.string(),
  }),
  execute: async ({ file, line, character, newName }) => {
    try {
      const content = require("fs").readFileSync(file, "utf-8")
      const lineContent = content.split("\\n")[line - 1] ?? ""
      const before = lineContent.slice(0, character)
      const after = lineContent.slice(character)
      const oldName = (/[\\w$]+$/.exec(before)?.[0] ?? "") + (/^[\\w$]*/.exec(after)?.[0] ?? "")
      if (!oldName) return { error: "No symbol at position" }

      const result = execSync(\`grep -rln --include="*.ts" --include="*.tsx" "\\\\b\${oldName}\\\\b" .\`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
      const files = result.split("\\n").filter(Boolean)
      return {
        oldName,
        newName,
        affectedFiles: files,
        command: \`grep -rl "\\\\b\${oldName}\\\\b" . | xargs sed -i 's/\\\\b\${oldName}\\\\b/\${newName}/g'\`,
        note: "This is a preview. Run the command above to apply the rename.",
      }
    } catch (e: any) {
      return { error: e.message }
    }
  },
})
`

// ─── AST Grep ─────────────────────────────────────────────────────────────────

const AST_GREP = `import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { execSync } from "child_process"

function runAstGrep(args: string): { output: string; error?: string } {
  try {
    const output = execSync(\`ast-grep \${args}\`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    return { output }
  } catch (e: any) {
    // ast-grep may not be installed
    if (e.code === "ENOENT" || e.message?.includes("not found")) {
      return { output: "", error: "ast-grep not installed. Run: npm install -g @ast-grep/cli" }
    }
    return { output: e.stdout ?? "", error: e.stderr ?? e.message }
  }
}

export const ast_grep_search = tool({
  name: "ast_grep_search",
  description: "Search for code patterns using AST matching. More precise than text search. Use meta-variables: $NAME (single node), $$$ARGS (multiple nodes).",
  parameters: z.object({
    pattern: z.string().describe("AST pattern with meta-variables. E.g.: 'console.log($MSG)', 'function $NAME($$$ARGS)'"),
    language: z.enum(["typescript", "javascript", "tsx", "python", "rust", "go"]).default("typescript"),
    path: z.string().optional().describe("Directory or file to search (defaults to current directory)"),
    maxResults: z.number().optional().default(20),
  }),
  execute: async ({ pattern, language, path: searchPath, maxResults }) => {
    const pathArg = searchPath ? \`--dir "\${searchPath}"\` : ""
    const { output, error } = runAstGrep(\`scan --pattern '\${pattern}' --lang \${language} \${pathArg} --json\`)

    if (error) return { error, pattern }

    try {
      const results = JSON.parse(output || "[]")
      return {
        pattern,
        language,
        matches: results.slice(0, maxResults),
        total: results.length,
      }
    } catch {
      return { pattern, output: output.slice(0, 2000) }
    }
  },
})

export const ast_grep_replace = tool({
  name: "ast_grep_replace",
  description: "Replace code patterns using AST matching. Use meta-variables in both pattern and replacement.",
  parameters: z.object({
    pattern: z.string().describe("Pattern to match (use meta-variables like $NAME, $$$ARGS)"),
    replacement: z.string().describe("Replacement pattern (use same meta-variables)"),
    language: z.enum(["typescript", "javascript", "tsx", "python", "rust", "go"]).default("typescript"),
    path: z.string().optional().describe("Directory or file to transform"),
    dryRun: z.boolean().optional().default(true).describe("Preview changes without applying (default: true)"),
  }),
  execute: async ({ pattern, replacement, language, path: targetPath, dryRun }) => {
    const pathArg = targetPath ? \`--dir "\${targetPath}"\` : ""
    const dryRunArg = dryRun ? "--dry-run" : ""

    const { output, error } = runAstGrep(
      \`scan --pattern '\${pattern}' --rewrite '\${replacement}' --lang \${language} \${pathArg} \${dryRunArg}\`
    )

    if (error) return { error, pattern, replacement }

    return {
      pattern,
      replacement,
      dryRun,
      output: output.slice(0, 3000),
      note: dryRun ? "Dry run — no files modified. Set dryRun: false to apply changes." : "Changes applied.",
    }
  },
})
`
