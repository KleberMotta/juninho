import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// CARL = Context-Aware Retrieval Layer
// Extracts keywords from prompts and injects relevant domain docs

export default {
  name: "carl-inject",
  description: "Inject relevant domain context based on prompt keywords",

  hooks: {
    "tool.execute.before": async ({ tool, input, inject, cwd }) => {
      if (tool !== "UserPromptSubmit") return

      const prompt: string = input?.prompt ?? ""
      if (!prompt || prompt.length < 20) return

      const manifestPath = path.join(cwd, "docs", "principles", "manifest")
      const indexPath = path.join(cwd, "docs", "domain", "INDEX.md")

      if (!existsSync(manifestPath) || !existsSync(indexPath)) return

      const manifest = readFileSync(manifestPath, "utf-8")
      const index = readFileSync(indexPath, "utf-8")

      // Extract keywords from prompt (simple heuristic)
      const words = prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
      const uniqueWords = [...new Set(words)]

      // Find relevant entries in manifest
      const manifestLines = manifest.split("\n")
      const relevantEntries = manifestLines.filter((line) =>
        uniqueWords.some((word) => line.toLowerCase().includes(word))
      )

      if (relevantEntries.length === 0) return

      const contextBlock = [
        "[carl-inject] Relevant domain context:",
        ...relevantEntries.slice(0, 5),
        "",
        "Full index: docs/domain/INDEX.md",
      ].join("\n")

      inject(contextBlock)
    },
  },
} satisfies Plugin
