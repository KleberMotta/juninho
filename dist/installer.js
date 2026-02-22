"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetup = runSetup;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const agents_js_1 = require("./templates/agents.js");
const skills_js_1 = require("./templates/skills.js");
const plugins_js_1 = require("./templates/plugins.js");
const tools_js_1 = require("./templates/tools.js");
const commands_js_1 = require("./templates/commands.js");
const state_js_1 = require("./templates/state.js");
const docs_js_1 = require("./templates/docs.js");
async function runSetup(projectDir, options = {}) {
    const marker = path_1.default.join(projectDir, ".opencode", ".juninho-installed");
    if ((0, fs_1.existsSync)(marker) && !options.force) {
        console.log("[juninho] Framework already installed. Use --force to reinstall.");
        return;
    }
    console.log("[juninho] Installing Agentic Coding Framework...");
    console.log(`[juninho] Target: ${projectDir}`);
    // Step 1: Create directory structure
    createDirectories(projectDir);
    console.log("[juninho] ✓ Directories created");
    // Step 2: Write agents
    (0, agents_js_1.writeAgents)(projectDir);
    console.log("[juninho] ✓ Agents created (7)");
    // Step 3: Write skills
    (0, skills_js_1.writeSkills)(projectDir);
    console.log("[juninho] ✓ Skills created (5)");
    // Step 4: Write plugins
    (0, plugins_js_1.writePlugins)(projectDir);
    console.log("[juninho] ✓ Plugins created (10)");
    // Step 5: Write tools
    (0, tools_js_1.writeTools)(projectDir);
    console.log("[juninho] ✓ Tools created (4)");
    // Step 6: Write commands
    (0, commands_js_1.writeCommands)(projectDir);
    console.log("[juninho] ✓ Commands created (7)");
    // Step 7: Write state files
    (0, state_js_1.writeState)(projectDir);
    console.log("[juninho] ✓ State files created");
    // Step 8: Write docs
    (0, docs_js_1.writeDocs)(projectDir);
    console.log("[juninho] ✓ Docs scaffold created");
    // Step 9: Patch opencode.json
    (0, docs_js_1.patchOpencodeJson)(projectDir);
    console.log("[juninho] ✓ opencode.json patched");
    // Step 10: Write marker
    (0, fs_1.writeFileSync)(marker, new Date().toISOString());
    console.log("");
    console.log("[juninho] ✓ Framework installed successfully!");
    console.log("[juninho] Open OpenCode — /plan, /spec and /implement are ready.");
    console.log("[juninho] Agents available: @planner, @spec-writer, @implementer, @validator, @reviewer, @unify");
}
function createDirectories(projectDir) {
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
    ];
    for (const dir of dirs) {
        const fullPath = path_1.default.join(projectDir, dir);
        if (!(0, fs_1.existsSync)(fullPath)) {
            (0, fs_1.mkdirSync)(fullPath, { recursive: true });
        }
    }
}
//# sourceMappingURL=installer.js.map