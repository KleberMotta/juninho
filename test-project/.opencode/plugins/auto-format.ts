import { Plugin } from "@opencode-ai/plugin"
import { execSync } from "child_process"
import path from "path"

const FORMATTERS: Record<string, string> = {
  ".ts": "prettier --write",
  ".tsx": "prettier --write",
  ".js": "prettier --write",
  ".jsx": "prettier --write",
  ".json": "prettier --write",
  ".css": "prettier --write",
  ".scss": "prettier --write",
  ".md": "prettier --write",
  ".py": "black",
  ".go": "gofmt -w",
  ".rs": "rustfmt",
}

export default {
  name: "auto-format",
  description: "Auto-format files after Write/Edit tool calls",

  hooks: {
    "tool.execute.after": async ({ tool, input, output }) => {
      if (!["Write", "Edit", "MultiEdit"].includes(tool)) return

      const filePath: string = input?.path ?? input?.file_path ?? ""
      if (!filePath) return

      const ext = path.extname(filePath)
      const formatter = FORMATTERS[ext]
      if (!formatter) return

      try {
        execSync(`${formatter} "${filePath}"`, { stdio: "ignore" })
      } catch {
        // Formatter not available — skip silently
      }
    },
  },
} satisfies Plugin
