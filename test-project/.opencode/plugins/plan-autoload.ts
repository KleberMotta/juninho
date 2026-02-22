import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

export default {
  name: "plan-autoload",
  description: "Auto-inject active plan into context when session becomes idle",

  hooks: {
    "session.idle": async ({ cwd, inject }) => {
      const readyFile = path.join(cwd, ".opencode", "state", ".plan-ready")
      if (!existsSync(readyFile)) return

      const planPath = readFileSync(readyFile, "utf-8").trim()
      const fullPath = path.isAbsolute(planPath) ? planPath : path.join(cwd, planPath)

      if (!existsSync(fullPath)) return

      const planContent = readFileSync(fullPath, "utf-8")
      inject(
        `[plan-autoload] Active plan detected at ${planPath}:\n\n${planContent}\n\n` +
        `Use /implement to execute this plan, or /plan to revise it.`
      )
    },
  },
} satisfies Plugin
