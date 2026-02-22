import { Plugin } from "@opencode-ai/plugin"
import crypto from "crypto"

// Adds NN#XX: prefix to each line in Read tool output
// NN = line number, XX = 2-char hash for stable reference

function hashLine(line: string): string {
  return crypto.createHash("md5").update(line).digest("hex").slice(0, 2)
}

function addHashlines(content: string): string {
  return content
    .split("\n")
    .map((line, i) => {
      const lineNum = String(i + 1).padStart(3, "0")
      const hash = hashLine(line)
      return `${lineNum}#${hash}: ${line}`
    })
    .join("\n")
}

export default {
  name: "hashline-read",
  description: "Add NN#XX hashline prefixes to Read tool output for stable references",

  hooks: {
    "tool.execute.after": async ({ tool, output, transformOutput }) => {
      if (tool !== "Read") return
      if (typeof output !== "string") return

      transformOutput(addHashlines(output))
    },
  },
} satisfies Plugin
