import { Plugin } from "@opencode-ai/plugin"

// Patterns that indicate obvious/redundant comments
const OBVIOUS_PATTERNS = [
  /\/\/ increment .*/i,
  /\/\/ set .* to/i,
  /\/\/ return .*/i,
  /\/\/ call .*/i,
  /\/\/ create .* variable/i,
  /\/\/ check if/i,
  /\/\/ loop (through|over|for)/i,
  /\/\/ define function/i,
  /\/\/ initialize/i,
  /\/\/ assign/i,
]

// Patterns to IGNORE (legitimate comments)
const IGNORE_PATTERNS = [
  /\/\/\s*@ts-/,        // TypeScript directives
  /\/\/\s*eslint/,       // ESLint directives
  /\/\/\s*TODO/i,        // TODOs
  /\/\/\s*FIXME/i,       // FIXMEs
  /\/\/\s*HACK/i,        // HACKs
  /\/\/\s*NOTE:/i,       // Notes
  /\/\/\s*BUG:/i,        // Bug markers
  /\/\*\*/,              // JSDoc
  /\s*\*\s/,             // JSDoc continuation
  /given|when|then/i,      // BDD
  /describe|it\(/,        // Test descriptions
]

function hasObviousComments(content: string): string[] {
  const lines = content.split("\n")
  const found: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isIgnored = IGNORE_PATTERNS.some((p) => p.test(line))
    if (isIgnored) continue

    const isObvious = OBVIOUS_PATTERNS.some((p) => p.test(line))
    if (isObvious) {
      found.push(`Line ${i + 1}: ${line.trim()}`)
    }
  }

  return found
}

export default {
  name: "comment-checker",
  description: "Detect and flag obvious/redundant code comments",

  hooks: {
    "tool.execute.after": async ({ tool, input, inject }) => {
      if (!["Write", "Edit"].includes(tool)) return

      const content: string = input?.content ?? input?.new_string ?? ""
      if (!content) return

      const obvious = hasObviousComments(content)
      if (obvious.length === 0) return

      inject(
        `[comment-checker] ${obvious.length} potentially obvious comment(s) detected:\n` +
        obvious.slice(0, 3).join("\n") +
        `\nConsider removing redundant comments — code should be self-documenting.`
      )
    },
  },
} satisfies Plugin
