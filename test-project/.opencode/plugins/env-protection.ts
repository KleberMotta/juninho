import { Plugin } from "@opencode-ai/plugin"

export default {
  name: "env-protection",
  description: "Block accidental reads/writes of sensitive files",

  hooks: {
    "tool.execute.before": async ({ tool, input, abort }) => {
      const sensitivePatterns = [
        /\.env($|\.)/i,
        /secret/i,
        /credential/i,
        /\.pem$/i,
        /id_rsa/i,
        /\.key$/i,
      ]

      const filePath: string = input?.path ?? input?.file_path ?? input?.filename ?? ""
      if (!filePath) return

      const isSensitive = sensitivePatterns.some((p) => p.test(filePath))
      if (isSensitive) {
        abort(
          `[env-protection] Blocked access to sensitive file: ${filePath}\n` +
          `If this is intentional, temporarily disable the env-protection plugin.`
        )
      }
    },
  },
} satisfies Plugin
