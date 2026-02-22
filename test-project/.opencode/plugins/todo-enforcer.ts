import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

export default {
  name: "todo-enforcer",
  description: "Re-inject incomplete tasks when session goes idle to prevent drift",

  hooks: {
    "session.idle": async ({ cwd, inject }) => {
      const statePath = path.join(cwd, ".opencode", "state", "execution-state.md")
      if (!existsSync(statePath)) return

      const state = readFileSync(statePath, "utf-8")

      // Extract incomplete tasks (lines with [ ] — unchecked checkboxes)
      const incomplete = state
        .split("\n")
        .filter((line) => /^\s*-\s*\[\s*\]/.test(line))
        .map((line) => line.trim())

      if (incomplete.length === 0) return

      inject(
        `[todo-enforcer] You have ${incomplete.length} incomplete task(s):\n\n` +
        incomplete.join("\n") +
        `\n\nDo not stop until all tasks are complete. Continue working.`
      )
    },
  },
} satisfies Plugin
