/**
 * Model discovery — runs `opencode models` to detect available models.
 *
 * Parsing is resilient: tries JSON first, then falls back to
 * line-by-line extraction of model identifiers.
 */

import { execSync } from "child_process"

/**
 * Execute `opencode models` and return the list of available model IDs.
 *
 * Returns an empty array if the command fails or produces no parseable output.
 * Never throws — callers should fall back to defaults on empty result.
 */
export function discoverAvailableModels(): string[] {
  try {
    const raw = execSync("opencode models", {
      encoding: "utf-8",
      timeout: 15_000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()

    if (!raw) return []

    // Strategy 1: Try JSON parse (array of strings or array of objects with id/name)
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>
            return String(obj.id ?? obj.name ?? obj.model ?? "")
          }
          return ""
        }).filter(Boolean)
      }
      // If it's an object with a models/data key
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>
        const arr = obj.models ?? obj.data ?? obj.items
        if (Array.isArray(arr)) {
          return arr.map((item: unknown) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object") {
              const o = item as Record<string, unknown>
              return String(o.id ?? o.name ?? o.model ?? "")
            }
            return ""
          }).filter(Boolean)
        }
      }
    } catch {
      // Not JSON — fall through to line parsing
    }

    // Strategy 2: Line-by-line extraction
    // Look for lines containing model ID patterns like "provider/model-name"
    // or just model names
    const models: string[] = []
    const lines = raw.split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("─")) continue

      // Match "provider/model-name" pattern
      const providerMatch = trimmed.match(/\b([\w.-]+\/[\w.-]+)\b/)
      if (providerMatch) {
        models.push(providerMatch[1])
        continue
      }

      // Match standalone model IDs (e.g., "claude-opus-4.6", "gpt-5.3-codex")
      const modelMatch = trimmed.match(/\b(claude-[\w.-]+|gpt-[\w.-]+|gemini-[\w.-]+|grok-[\w.-]+|haiku-[\w.-]+|sonnet-[\w.-]+|opus-[\w.-]+)\b/i)
      if (modelMatch) {
        models.push(modelMatch[1])
        continue
      }

      // If the line looks like a simple identifier (no spaces, reasonable length)
      if (/^[\w./-]+$/.test(trimmed) && trimmed.length > 3 && trimmed.length < 80) {
        models.push(trimmed)
      }
    }

    return [...new Set(models)] // deduplicate
  } catch {
    // Command not found, timed out, or failed — return empty
    return []
  }
}
