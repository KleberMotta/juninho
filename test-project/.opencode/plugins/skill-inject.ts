import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// Maps file path patterns to skill names
const SKILL_MAP: Array<{ pattern: RegExp; skill: string }> = [
  { pattern: /\.test\.(ts|tsx|js|jsx)$/, skill: "test-writing" },
  { pattern: /app\/.*\/page\.(tsx|jsx)$/, skill: "page-creation" },
  { pattern: /app\/api\/.*\.(ts|js)$/, skill: "api-route-creation" },
  { pattern: /actions\.(ts|js)$/, skill: "server-action-creation" },
  { pattern: /schema\.prisma$/, skill: "schema-migration" },
]

export default {
  name: "skill-inject",
  description: "Inject relevant skill instructions based on file being edited",

  hooks: {
    "tool.execute.before": async ({ tool, input, inject, cwd }) => {
      if (!["Write", "Edit", "MultiEdit"].includes(tool)) return

      const filePath: string = input?.path ?? input?.file_path ?? ""
      if (!filePath) return

      const match = SKILL_MAP.find(({ pattern }) => pattern.test(filePath))
      if (!match) return

      const skillPath = path.join(cwd, ".opencode", "skills", match.skill, "SKILL.md")
      if (!existsSync(skillPath)) return

      const skillContent = readFileSync(skillPath, "utf-8")
      inject(`[skill-inject] Applying skill: ${match.skill}\n\n${skillContent}`)
    },
  },
} satisfies Plugin
