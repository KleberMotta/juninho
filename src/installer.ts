import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from "fs"
import path from "path"
import { writeAgents } from "./templates/agents.js"
import { writeSkills } from "./templates/skills.js"
import { writePlugins } from "./templates/plugins.js"
import { writeTools } from "./templates/tools.js"
import { writeCommands } from "./templates/commands.js"
import { writeState } from "./templates/state.js"
import { writeDocs, patchOpencodeJson } from "./templates/docs.js"

export interface SetupOptions {
  force?: boolean
}

export async function runSetup(projectDir: string, options: SetupOptions = {}): Promise<void> {
  const marker = path.join(projectDir, ".opencode", ".juninho-installed")

  if (existsSync(marker) && !options.force) {
    console.log("[juninho] Framework already installed. Use --force to reinstall.")
    return
  }

  console.log("[juninho] Installing Agentic Coding Framework...")
  console.log(`[juninho] Target: ${projectDir}`)

  // Step 1: Create directory structure
  createDirectories(projectDir)
  console.log("[juninho] ✓ Directories created")

  // Step 2: Write agents
  writeAgents(projectDir)
  console.log("[juninho] ✓ Agents created (9)")

  // Step 3: Write skills
  writeSkills(projectDir)
  console.log("[juninho] ✓ Skills created (5)")

  // Step 4: Write plugins
  writePlugins(projectDir)
  console.log("[juninho] ✓ Plugins created (11)")

  // Step 5: Write tools
  writeTools(projectDir)
  console.log("[juninho] ✓ Tools created (4)")

  // Step 6: Write commands
  writeCommands(projectDir)
  console.log("[juninho] ✓ Commands created (13)")

  // Step 7: Write state files
  writeState(projectDir)
  console.log("[juninho] ✓ State files created")

  // Step 8: Write docs
  writeDocs(projectDir)
  console.log("[juninho] ✓ Docs scaffold created")

  // Step 9: Patch opencode.json
  patchOpencodeJson(projectDir)
  console.log("[juninho] ✓ opencode.json patched")

  // Step 10: Install pre-commit hook (outer validation loop)
  writePreCommitHook(projectDir)

  // Step 11: Write marker
  writeFileSync(marker, new Date().toISOString())

  console.log("")
  console.log("[juninho] ✓ Framework installed successfully!")
  console.log("[juninho] Open OpenCode — /plan, /spec and /implement are ready.")
  console.log("[juninho] Agents: @planner, @spec-writer, @implementer, @validator, @reviewer, @unify, @explore, @librarian")
}

function writePreCommitHook(projectDir: string): void {
  const gitHooksDir = path.join(projectDir, ".git", "hooks")

  if (!existsSync(gitHooksDir)) {
    // Not a git repo or hooks dir doesn't exist — skip silently
    return
  }

  const hookPath = path.join(gitHooksDir, "pre-commit")

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, "utf-8")
    if (!existing.includes("installed by juninho")) {
      // Preserve existing hook — do not overwrite
      console.log("[juninho] ⚠ pre-commit hook already exists — skipping (not installed by juninho)")
      return
    }
  }

  const hookContent = `#!/bin/sh
# Deterministic outer validation loop — installed by juninho
# Runs typecheck + lint + tests before every commit.
# Do not bypass with --no-verify.
set -e

echo "[pre-commit] Running typecheck..."
npx tsc --noEmit 2>&1 || { echo "[pre-commit] FAIL: TypeScript errors"; exit 1; }

echo "[pre-commit] Running lint..."
npx eslint . --max-warnings=0 2>&1 || { echo "[pre-commit] FAIL: Lint errors"; exit 1; }

echo "[pre-commit] Running tests..."
npx jest --passWithNoTests 2>&1 || { echo "[pre-commit] FAIL: Tests failed"; exit 1; }

echo "[pre-commit] All checks passed"
`

  writeFileSync(hookPath, hookContent)

  try {
    chmodSync(hookPath, 0o755)
    console.log("[juninho] ✓ pre-commit hook installed")
  } catch {
    console.log("[juninho] ✓ pre-commit hook written (chmod not supported on this platform — make it executable manually)")
  }
}

function createDirectories(projectDir: string): void {
  const dirs = [
    ".opencode",
    ".opencode/agents",
    ".opencode/skills",
    ".opencode/skills/test-writing",
    ".opencode/skills/page-creation",
    ".opencode/skills/api-route-creation",
    ".opencode/skills/server-action-creation",
    ".opencode/skills/schema-migration",
    ".opencode/plugins",
    ".opencode/tools",
    ".opencode/commands",
    ".opencode/state",
    "docs",
    "docs/principles",
    "docs/domain",
    "docs/specs",
    "worktrees",
  ]

  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
    }
  }
}
