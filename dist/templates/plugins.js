"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePlugins = writePlugins;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function writePlugins(projectDir) {
    const pluginsDir = path_1.default.join(projectDir, ".opencode", "plugins");
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "env-protection.ts"), ENV_PROTECTION);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "auto-format.ts"), AUTO_FORMAT);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "plan-autoload.ts"), PLAN_AUTOLOAD);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "carl-inject.ts"), CARL_INJECT);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "skill-inject.ts"), SKILL_INJECT);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "intent-gate.ts"), INTENT_GATE);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "todo-enforcer.ts"), TODO_ENFORCER);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "comment-checker.ts"), COMMENT_CHECKER);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "hashline-read.ts"), HASHLINE_READ);
    (0, fs_1.writeFileSync)(path_1.default.join(pluginsDir, "hashline-edit.ts"), HASHLINE_EDIT);
}
// ─── Env Protection ──────────────────────────────────────────────────────────
const ENV_PROTECTION = `import { Plugin } from "@opencode-ai/plugin"

export default {
  name: "env-protection",
  description: "Block accidental reads/writes of sensitive files",

  hooks: {
    "tool.execute.before": async ({ tool, input, abort }) => {
      const sensitivePatterns = [
        /\\.env($|\\.)/i,
        /secret/i,
        /credential/i,
        /\\.pem$/i,
        /id_rsa/i,
        /\\.key$/i,
      ]

      const filePath: string = input?.path ?? input?.file_path ?? input?.filename ?? ""
      if (!filePath) return

      const isSensitive = sensitivePatterns.some((p) => p.test(filePath))
      if (isSensitive) {
        abort(
          \`[env-protection] Blocked access to sensitive file: \${filePath}\\n\` +
          \`If this is intentional, temporarily disable the env-protection plugin.\`
        )
      }
    },
  },
} satisfies Plugin
`;
// ─── Auto Format ─────────────────────────────────────────────────────────────
const AUTO_FORMAT = `import { Plugin } from "@opencode-ai/plugin"
import { execSync } from "child_process"
import path from "path"

const FORMATTERS: Record<string, string> = {
  ".ts": "prettier --write",
  ".tsx": "prettier --write",
  ".js": "prettier --write",
  ".jsx": "prettier --write",
  ".json": "prettier --write",
  ".css": "prettier --write",
  ".scss": "prettier --write",
  ".md": "prettier --write",
  ".py": "black",
  ".go": "gofmt -w",
  ".rs": "rustfmt",
}

export default {
  name: "auto-format",
  description: "Auto-format files after Write/Edit tool calls",

  hooks: {
    "tool.execute.after": async ({ tool, input, output }) => {
      if (!["Write", "Edit", "MultiEdit"].includes(tool)) return

      const filePath: string = input?.path ?? input?.file_path ?? ""
      if (!filePath) return

      const ext = path.extname(filePath)
      const formatter = FORMATTERS[ext]
      if (!formatter) return

      try {
        execSync(\`\${formatter} "\${filePath}"\`, { stdio: "ignore" })
      } catch {
        // Formatter not available — skip silently
      }
    },
  },
} satisfies Plugin
`;
// ─── Plan Autoload ────────────────────────────────────────────────────────────
const PLAN_AUTOLOAD = `import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

export default {
  name: "plan-autoload",
  description: "Auto-inject active plan into context when session becomes idle",

  hooks: {
    "session.idle": async ({ cwd, inject }) => {
      const readyFile = path.join(cwd, ".opencode", "state", ".plan-ready")
      if (!existsSync(readyFile)) return

      const planPath = readFileSync(readyFile, "utf-8").trim()
      const fullPath = path.isAbsolute(planPath) ? planPath : path.join(cwd, planPath)

      if (!existsSync(fullPath)) return

      const planContent = readFileSync(fullPath, "utf-8")
      inject(
        \`[plan-autoload] Active plan detected at \${planPath}:\\n\\n\${planContent}\\n\\n\` +
        \`Use /implement to execute this plan, or /plan to revise it.\`
      )
    },
  },
} satisfies Plugin
`;
// ─── CARL Inject ──────────────────────────────────────────────────────────────
const CARL_INJECT = `import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// CARL = Context-Aware Retrieval Layer
// Extracts keywords from prompts and injects relevant domain docs

export default {
  name: "carl-inject",
  description: "Inject relevant domain context based on prompt keywords",

  hooks: {
    "tool.execute.before": async ({ tool, input, inject, cwd }) => {
      if (tool !== "UserPromptSubmit") return

      const prompt: string = input?.prompt ?? ""
      if (!prompt || prompt.length < 20) return

      const manifestPath = path.join(cwd, "docs", "principles", "manifest")
      const indexPath = path.join(cwd, "docs", "domain", "INDEX.md")

      if (!existsSync(manifestPath) || !existsSync(indexPath)) return

      const manifest = readFileSync(manifestPath, "utf-8")
      const index = readFileSync(indexPath, "utf-8")

      // Extract keywords from prompt (simple heuristic)
      const words = prompt.toLowerCase().split(/\\W+/).filter((w) => w.length > 4)
      const uniqueWords = [...new Set(words)]

      // Find relevant entries in manifest
      const manifestLines = manifest.split("\\n")
      const relevantEntries = manifestLines.filter((line) =>
        uniqueWords.some((word) => line.toLowerCase().includes(word))
      )

      if (relevantEntries.length === 0) return

      const contextBlock = [
        "[carl-inject] Relevant domain context:",
        ...relevantEntries.slice(0, 5),
        "",
        "Full index: docs/domain/INDEX.md",
      ].join("\\n")

      inject(contextBlock)
    },
  },
} satisfies Plugin
`;
// ─── Skill Inject ────────────────────────────────────────────────────────────
const SKILL_INJECT = `import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// Maps file path patterns to skill names
const SKILL_MAP: Array<{ pattern: RegExp; skill: string }> = [
  { pattern: /\\.test\\.(ts|tsx|js|jsx)$/, skill: "test-writing" },
  { pattern: /app\\/.*\\/page\\.(tsx|jsx)$/, skill: "page-creation" },
  { pattern: /app\\/api\\/.*\\.(ts|js)$/, skill: "api-route-creation" },
  { pattern: /actions\\.(ts|js)$/, skill: "server-action-creation" },
  { pattern: /schema\\.prisma$/, skill: "schema-migration" },
]

export default {
  name: "skill-inject",
  description: "Inject relevant skill instructions based on file being edited",

  hooks: {
    "tool.execute.before": async ({ tool, input, inject, cwd }) => {
      if (!["Write", "Edit", "MultiEdit"].includes(tool)) return

      const filePath: string = input?.path ?? input?.file_path ?? ""
      if (!filePath) return

      const match = SKILL_MAP.find(({ pattern }) => pattern.test(filePath))
      if (!match) return

      const skillPath = path.join(cwd, ".opencode", "skills", match.skill, "SKILL.md")
      if (!existsSync(skillPath)) return

      const skillContent = readFileSync(skillPath, "utf-8")
      inject(\`[skill-inject] Applying skill: \${match.skill}\\n\\n\${skillContent}\`)
    },
  },
} satisfies Plugin
`;
// ─── Intent Gate ─────────────────────────────────────────────────────────────
const INTENT_GATE = `import { Plugin } from "@opencode-ai/plugin"

// Intent classification — annotates the session context before agent routing
const INTENT_TYPES = {
  RESOLVE_PROBLEM: ["fix", "bug", "error", "broken", "crash", "fail", "issue", "problem"],
  REFACTOR: ["refactor", "cleanup", "restructure", "reorganize", "improve", "simplify"],
  ADD_FEATURE: ["add", "implement", "create", "build", "new feature", "support"],
  RESEARCH: ["understand", "explain", "how does", "what is", "why does", "analyze"],
  MIGRATION: ["migrate", "upgrade", "move", "port", "convert", "update dependency"],
  REVIEW: ["review", "check", "audit", "inspect", "look at"],
}

function classifyIntent(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [type, keywords] of Object.entries(INTENT_TYPES)) {
    if (keywords.some((kw) => lower.includes(kw))) return type
  }
  return "GENERAL"
}

export default {
  name: "intent-gate",
  description: "Classify prompt intent and annotate context for better agent routing",

  hooks: {
    "session.start": async ({ inject }) => {
      // Placeholder — intent is classified per-prompt
    },

    "tool.execute.before": async ({ tool, input, inject }) => {
      if (tool !== "UserPromptSubmit") return

      const prompt: string = input?.prompt ?? ""
      if (!prompt || prompt.length < 15) return

      const intent = classifyIntent(prompt)
      if (intent === "GENERAL") return

      inject(
        \`[intent-gate] Detected intent: \${intent}\\n\` +
        \`Route to appropriate agent: RESOLVE_PROBLEM→@implementer, REFACTOR→@implementer, \` +
        \`ADD_FEATURE→@planner+@implementer, RESEARCH→inline, MIGRATION→@planner+@implementer, REVIEW→@reviewer\`
      )
    },
  },
} satisfies Plugin
`;
// ─── Todo Enforcer ────────────────────────────────────────────────────────────
const TODO_ENFORCER = `import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

export default {
  name: "todo-enforcer",
  description: "Re-inject incomplete tasks when session goes idle to prevent drift",

  hooks: {
    "session.idle": async ({ cwd, inject }) => {
      const statePath = path.join(cwd, ".opencode", "state", "execution-state.md")
      if (!existsSync(statePath)) return

      const state = readFileSync(statePath, "utf-8")

      // Extract incomplete tasks (lines with [ ] — unchecked checkboxes)
      const incomplete = state
        .split("\\n")
        .filter((line) => /^\\s*-\\s*\\[\\s*\\]/.test(line))
        .map((line) => line.trim())

      if (incomplete.length === 0) return

      inject(
        \`[todo-enforcer] You have \${incomplete.length} incomplete task(s):\\n\\n\` +
        incomplete.join("\\n") +
        \`\\n\\nDo not stop until all tasks are complete. Continue working.\`
      )
    },
  },
} satisfies Plugin
`;
// ─── Comment Checker ──────────────────────────────────────────────────────────
const COMMENT_CHECKER = `import { Plugin } from "@opencode-ai/plugin"

// Patterns that indicate obvious/redundant comments
const OBVIOUS_PATTERNS = [
  /\\/\\/ increment .*/i,
  /\\/\\/ set .* to/i,
  /\\/\\/ return .*/i,
  /\\/\\/ call .*/i,
  /\\/\\/ create .* variable/i,
  /\\/\\/ check if/i,
  /\\/\\/ loop (through|over|for)/i,
  /\\/\\/ define function/i,
  /\\/\\/ initialize/i,
  /\\/\\/ assign/i,
]

// Patterns to IGNORE (legitimate comments)
const IGNORE_PATTERNS = [
  /\\/\\/\\s*@ts-/,        // TypeScript directives
  /\\/\\/\\s*eslint/,       // ESLint directives
  /\\/\\/\\s*TODO/i,        // TODOs
  /\\/\\/\\s*FIXME/i,       // FIXMEs
  /\\/\\/\\s*HACK/i,        // HACKs
  /\\/\\/\\s*NOTE:/i,       // Notes
  /\\/\\/\\s*BUG:/i,        // Bug markers
  /\\/\\*\\*/,              // JSDoc
  /\\s*\\*\\s/,             // JSDoc continuation
  /given|when|then/i,      // BDD
  /describe|it\\(/,        // Test descriptions
]

function hasObviousComments(content: string): string[] {
  const lines = content.split("\\n")
  const found: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isIgnored = IGNORE_PATTERNS.some((p) => p.test(line))
    if (isIgnored) continue

    const isObvious = OBVIOUS_PATTERNS.some((p) => p.test(line))
    if (isObvious) {
      found.push(\`Line \${i + 1}: \${line.trim()}\`)
    }
  }

  return found
}

export default {
  name: "comment-checker",
  description: "Detect and flag obvious/redundant code comments",

  hooks: {
    "tool.execute.after": async ({ tool, input, inject }) => {
      if (!["Write", "Edit"].includes(tool)) return

      const content: string = input?.content ?? input?.new_string ?? ""
      if (!content) return

      const obvious = hasObviousComments(content)
      if (obvious.length === 0) return

      inject(
        \`[comment-checker] \${obvious.length} potentially obvious comment(s) detected:\\n\` +
        obvious.slice(0, 3).join("\\n") +
        \`\\nConsider removing redundant comments — code should be self-documenting.\`
      )
    },
  },
} satisfies Plugin
`;
// ─── Hashline Read ────────────────────────────────────────────────────────────
const HASHLINE_READ = `import { Plugin } from "@opencode-ai/plugin"
import crypto from "crypto"

// Adds NN#XX: prefix to each line in Read tool output
// NN = line number, XX = 2-char hash for stable reference

function hashLine(line: string): string {
  return crypto.createHash("md5").update(line).digest("hex").slice(0, 2)
}

function addHashlines(content: string): string {
  return content
    .split("\\n")
    .map((line, i) => {
      const lineNum = String(i + 1).padStart(3, "0")
      const hash = hashLine(line)
      return \`\${lineNum}#\${hash}: \${line}\`
    })
    .join("\\n")
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
`;
// ─── Hashline Edit ────────────────────────────────────────────────────────────
const HASHLINE_EDIT = `import { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import crypto from "crypto"

function hashLine(line: string): string {
  return crypto.createHash("md5").update(line).digest("hex").slice(0, 2)
}

// Parse hashline references like "042#3f: const x = 1"
const HASHLINE_REF = /^(\\d{3})#([a-f0-9]{2}):/

function extractHashlineRefs(text: string): Array<{ lineNum: number; hash: string }> {
  return text
    .split("\\n")
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
      const currentLines = currentContent.split("\\n")

      for (const ref of refs) {
        const lineIndex = ref.lineNum - 1
        if (lineIndex >= currentLines.length) {
          abort(
            \`[hashline-edit] Stale reference: line \${ref.lineNum} no longer exists in \${filePath}.\\n\` +
            \`Re-read the file to get current hashlines.\`
          )
          return
        }

        const currentHash = hashLine(currentLines[lineIndex])
        if (currentHash !== ref.hash) {
          abort(
            \`[hashline-edit] Stale reference at line \${ref.lineNum}: expected hash \${ref.hash}, got \${currentHash}.\\n\` +
            \`Re-read the file to get current hashlines.\`
          )
          return
        }
      }
    },
  },
} satisfies Plugin
`;
//# sourceMappingURL=plugins.js.map