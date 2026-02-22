#!/usr/bin/env node
import { runSetup } from "./installer.js"
import path from "path"

const args = process.argv.slice(2)
const command = args[0] ?? "setup"
const forceFlag = args.includes("--force")
const targetDir = args.find(a => !a.startsWith("--") && a !== command) ?? process.cwd()

if (command === "setup") {
  runSetup(path.resolve(targetDir), { force: forceFlag })
    .then(() => process.exit(0))
    .catch((e: Error) => {
      console.error("[juninho] Error:", e.message)
      process.exit(1)
    })
} else if (command === "--help" || command === "-h") {
  console.log(`
juninho — Agentic Coding Framework bootstrapper for OpenCode

Usage:
  juninho [setup] [project-dir] [--force]

Commands:
  setup     Install the framework into a project (default)

Options:
  --force   Reinstall even if already configured
  --help    Show this help message

Examples:
  juninho setup
  juninho setup ./my-project
  juninho setup --force
`)
} else {
  console.error(`[juninho] Unknown command: ${command}`)
  console.error("Run 'juninho --help' for usage.")
  process.exit(1)
}
