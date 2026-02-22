#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const installer_js_1 = require("./installer.js");
const path_1 = __importDefault(require("path"));
const args = process.argv.slice(2);
const command = args[0] ?? "setup";
const forceFlag = args.includes("--force");
const targetDir = args.find(a => !a.startsWith("--") && a !== command) ?? process.cwd();
if (command === "setup") {
    (0, installer_js_1.runSetup)(path_1.default.resolve(targetDir), { force: forceFlag })
        .then(() => process.exit(0))
        .catch((e) => {
        console.error("[juninho] Error:", e.message);
        process.exit(1);
    });
}
else if (command === "--help" || command === "-h") {
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
`);
}
else {
    console.error(`[juninho] Unknown command: ${command}`);
    console.error("Run 'juninho --help' for usage.");
    process.exit(1);
}
//# sourceMappingURL=cli.js.map