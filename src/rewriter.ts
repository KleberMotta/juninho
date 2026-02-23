/**
 * Agent model rewriter.
 *
 * Rewrites the `model:` field in agent .md frontmatter and
 * the `model` field in opencode.json for all framework agents.
 *
 * Called after:
 *   - `juninho config` (interactive wizard)
 *   - `juninho setup` (with resolved/discovered models)
 */

import { existsSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { AGENT_TIER_MAP } from "./models.js"
import type { JuninhoConfig } from "./config.js"

/**
 * Rewrite model references in all agent .md files and opencode.json.
 *
 * Returns true if any files were modified, false if the framework
 * is not installed (no .opencode/agents/ directory).
 */
export function rewriteAgentModels(projectDir: string, config: JuninhoConfig): boolean {
  const agentsDir = path.join(projectDir, ".opencode", "agents")
  if (!existsSync(agentsDir)) return false

  const tierToModel: Record<string, string> = {
    strong: config.strong,
    medium: config.medium,
    weak: config.weak,
  }

  let modified = false

  // 1. Rewrite agent .md frontmatter
  for (const [agentName, tier] of Object.entries(AGENT_TIER_MAP)) {
    const mdPath = path.join(agentsDir, `${agentName}.md`)
    if (!existsSync(mdPath)) continue

    const content = readFileSync(mdPath, "utf-8")
    const newModel = tierToModel[tier]

    // Replace model: line in YAML frontmatter (between --- delimiters)
    const updated = content.replace(
      /^(---[\s\S]*?^model:\s*).+$/m,
      `$1${newModel}`
    )

    if (updated !== content) {
      writeFileSync(mdPath, updated)
      modified = true
    }
  }

  // 2. Rewrite opencode.json
  const jsonPath = path.join(projectDir, "opencode.json")
  if (existsSync(jsonPath)) {
    try {
      const raw = readFileSync(jsonPath, "utf-8")
      const config_json = JSON.parse(raw)

      if (config_json.agent && typeof config_json.agent === "object") {
        for (const [agentName, tier] of Object.entries(AGENT_TIER_MAP)) {
          if (config_json.agent[agentName] && typeof config_json.agent[agentName] === "object") {
            const agentConfig = config_json.agent[agentName] as Record<string, unknown>
            agentConfig.model = tierToModel[tier]
          }
        }

        writeFileSync(jsonPath, JSON.stringify(config_json, null, 2) + "\n")
        modified = true
      }
    } catch {
      // JSON parse error — skip
    }
  }

  return modified
}
