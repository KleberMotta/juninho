#!/usr/bin/env node
import { runSetup } from "./installer.js"
import { runConfigWizard } from "./config-wizard.js"
import path from "path"

const args = process.argv.slice(2)
const command = args[0] ?? ""
const forceFlag = args.includes("--force")
const targetDir = args.find(a => !a.startsWith("--") && a !== command) ?? process.cwd()

const VERSION = "1.0.0-alpha.5"

function showHelp(): void {
  console.log(`
juninho v${VERSION} — Agentic Coding Framework bootstrapper for OpenCode

Usage:
  juninho <command> [project-dir] [options]

Commands:
  setup [dir] [--force]   Install the framework into a project
  config [dir]            Configure model preferences interactively

Options:
  --force                 Reinstall even if already configured
  --help, -h              Show this help message

Model Tiers:
  Strong  → Planning & spec writing    (default: claude-opus-4.6)
  Medium  → Implementation & review    (default: claude-sonnet-4.6)
  Weak    → Research & exploration     (default: claude-haiku-4.5)

  The 'config' command detects available models via 'opencode models'
  and lets you choose the best model for each tier.

Examples:
  juninho setup                    Install with auto-detected models
  juninho setup ./my-project       Install into a specific directory
  juninho setup --force            Reinstall (overwrite existing)
  juninho config                   Configure models interactively
  juninho config ./my-project      Configure for a specific project
`)
}

if (command === "" || command === "--help" || command === "-h") {
  showHelp()
} else if (command === "setup") {
  runSetup(path.resolve(targetDir), { force: forceFlag })
    .then(() => process.exit(0))
    .catch((e: Error) => {
      console.error("[juninho] Error:", e.message)
      process.exit(1)
    })
} else if (command === "config") {
  runConfigWizard(path.resolve(targetDir))
    .then(() => process.exit(0))
    .catch((e: Error) => {
      console.error("[juninho] Error:", e.message)
      process.exit(1)
    })
} else {
  console.error(`[juninho] Unknown command: ${command}`)
  console.error("Run 'juninho --help' for usage.")
  process.exit(1)
}
