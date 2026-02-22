import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import crypto from "crypto"

function hashLine(line: string): string {
  return crypto.createHash("md5").update(line).digest("hex").slice(0, 2)
}

// Parse hashline references like "042#3f: const x = 1"
const HASHLINE_REF = /^(\d{3})#([a-f0-9]{2}):/

function extractHashlineRefs(text: string): Array<{ lineNum: number; hash: string }> {
  return text
    .split("\n")
    .map((line) => {
      const match = HASHLINE_REF.exec(line)
      if (!match) return null
      return { lineNum: parseInt(match[1], 10), hash: match[2] }
    })
    .filter((r): r is { lineNum: number; hash: string } => r !== null)
}

export default {
  name: "hashline-edit",
  description: "Validate hashline references before Edit tool calls — reject stale edits",

  hooks: {
    "tool.execute.before": async ({ tool, input, abort }) => {
      if (tool !== "Edit") return

      const filePath: string = input?.path ?? input?.file_path ?? ""
      const oldString: string = input?.old_string ?? ""

      if (!filePath || !oldString || !existsSync(filePath)) return

      // Check if the edit references hashlines
      const refs = extractHashlineRefs(oldString)
      if (refs.length === 0) return

      // Read current file and validate hashes
      const currentContent = readFileSync(filePath, "utf-8")
      const currentLines = currentContent.split("\n")

      for (const ref of refs) {
        const lineIndex = ref.lineNum - 1
        if (lineIndex >= currentLines.length) {
          abort(
            `[hashline-edit] Stale reference: line ${ref.lineNum} no longer exists in ${filePath}.\n` +
            `Re-read the file to get current hashlines.`
          )
          return
        }

        const currentHash = hashLine(currentLines[lineIndex])
        if (currentHash !== ref.hash) {
          abort(
            `[hashline-edit] Stale reference at line ${ref.lineNum}: expected hash ${ref.hash}, got ${currentHash}.\n` +
            `Re-read the file to get current hashlines.`
          )
          return
        }
      }
    },
  },
} satisfies Plugin
