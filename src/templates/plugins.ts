import { writeFileSync } from "fs"
import path from "path"

export function writePlugins(projectDir: string): void {
  const pluginsDir = path.join(projectDir, ".opencode", "plugins")

  writeFileSync(path.join(pluginsDir, "j.env-protection.ts"), ENV_PROTECTION)
  writeFileSync(path.join(pluginsDir, "j.auto-format.ts"), AUTO_FORMAT)
  writeFileSync(path.join(pluginsDir, "j.plan-autoload.ts"), PLAN_AUTOLOAD)
  writeFileSync(path.join(pluginsDir, "j.carl-inject.ts"), CARL_INJECT)
  writeFileSync(path.join(pluginsDir, "j.skill-inject.ts"), SKILL_INJECT)
  writeFileSync(path.join(pluginsDir, "j.intent-gate.ts"), INTENT_GATE)
  writeFileSync(path.join(pluginsDir, "j.todo-enforcer.ts"), TODO_ENFORCER)
  writeFileSync(path.join(pluginsDir, "j.comment-checker.ts"), COMMENT_CHECKER)
  writeFileSync(path.join(pluginsDir, "j.hashline-read.ts"), HASHLINE_READ)
  writeFileSync(path.join(pluginsDir, "j.hashline-edit.ts"), HASHLINE_EDIT)
  writeFileSync(path.join(pluginsDir, "j.directory-agents-injector.ts"), DIR_AGENTS_INJECTOR)
}

// ─── Env Protection ──────────────────────────────────────────────────────────

const ENV_PROTECTION = `import type { Plugin } from "@opencode-ai/plugin"

// Blocks reads/writes of sensitive files before any tool executes.
// Real API: tool.execute.before(input, output) — throw Error to abort.

const SENSITIVE = [
  /\\.env($|\\.)/i,
  /secret/i,
  /credential/i,
  /\\.pem$/i,
  /id_rsa/i,
  /\\.key$/i,
]

export default (async ({ directory: _directory }: { directory: string }) => ({
  "tool.execute.before": async (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any }
  ) => {
    const filePath: string =
      output.args?.path ?? output.args?.file_path ?? output.args?.filename ?? ""
    if (!filePath) return

    if (SENSITIVE.some((p) => p.test(filePath))) {
      throw new Error(
        \`[env-protection] Blocked access to sensitive file: \${filePath}\\n\` +
        \`If intentional, temporarily disable the env-protection plugin.\`
      )
    }
  },
})) satisfies Plugin
`

// ─── Auto Format ─────────────────────────────────────────────────────────────

const AUTO_FORMAT = `import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "child_process"
import path from "path"

// Auto-formats files after Write/Edit tool calls.
// Real API: tool.execute.after(input, output) — input.args has the file path.

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

export default (async ({ directory: _directory }: { directory: string }) => ({
  "tool.execute.after": async (
    input: { tool: string; sessionID: string; callID: string; args: any },
    _output: { title: string; output: string; metadata: any }
  ) => {
    if (!["Write", "Edit", "MultiEdit"].includes(input.tool)) return

    const filePath: string = input.args?.path ?? input.args?.file_path ?? ""
    if (!filePath) return

    const formatter = FORMATTERS[path.extname(filePath)]
    if (!formatter) return

    try {
      execSync(\`\${formatter} "\${filePath}"\`, { stdio: "ignore" })
    } catch {
      // Formatter not available — skip silently
    }
  },
})) satisfies Plugin
`

// ─── Plan Autoload ────────────────────────────────────────────────────────────

const PLAN_AUTOLOAD = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, unlinkSync } from "fs"
import path from "path"

// Injects active plan into system context when a .plan-ready IPC flag exists.
// Uses experimental.chat.system.transform — fires before every AI message.
// The flag is deleted after injection so it only fires once.

export default (async ({ directory }: { directory: string }) => ({
  "experimental.chat.system.transform": async (
    _input: { sessionID?: string; model: any },
    output: { system: string[] }
  ) => {
    const readyFile = path.join(directory, ".opencode", "state", ".plan-ready")
    if (!existsSync(readyFile)) return

    const planPath = readFileSync(readyFile, "utf-8").trim()
    const fullPath = path.isAbsolute(planPath) ? planPath : path.join(directory, planPath)
    if (!existsSync(fullPath)) return

    const planContent = readFileSync(fullPath, "utf-8")

    try { unlinkSync(readyFile) } catch { /* ok */ }

    output.system.push(
      \`[plan-autoload] Active plan detected at \${planPath}:\\n\\n\${planContent}\\n\\n\` +
      \`Use /j.implement to execute this plan, or /j.plan to revise it.\`
    )
  },
})) satisfies Plugin
`

// ─── CARL Inject ──────────────────────────────────────────────────────────────

const CARL_INJECT = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// CARL = Context-Aware Retrieval Layer
// Reads docs/principles/manifest (KEY=VALUE format) and docs/domain/INDEX.md.
// Injects relevant files into the user message based on keyword matching.
// Uses chat.message hook — fires when a user message is being assembled.

interface PrincipleEntry {
  key: string
  recall: string[]
  file: string
}

interface DomainEntry {
  domain: string
  keywords: string[]
  files: Array<{ path: string; description: string }>
}

function parsePrinciplesManifest(content: string): PrincipleEntry[] {
  const entries: PrincipleEntry[] = []
  const lines = content.split("\\n").filter((l) => !l.startsWith("#") && l.trim())

  const byKey: Record<string, Record<string, string>> = {}
  for (const line of lines) {
    const match = /^([A-Z_]+)_(STATE|RECALL|FILE)=(.*)$/.exec(line)
    if (!match) continue
    const [, prefix, field, value] = match
    if (!byKey[prefix]) byKey[prefix] = {}
    byKey[prefix][field] = value.trim()
  }

  for (const [key, fields] of Object.entries(byKey)) {
    if (fields["STATE"] !== "active") continue
    if (!fields["RECALL"] || !fields["FILE"]) continue
    entries.push({
      key,
      recall: fields["RECALL"].split(",").map((k) => k.trim().toLowerCase()),
      file: fields["FILE"],
    })
  }

  return entries
}

function parseDomainIndex(content: string): DomainEntry[] {
  const entries: DomainEntry[] = []
  const sections = content.split(/^## /m).slice(1)

  for (const section of sections) {
    const lines = section.split("\\n")
    const domain = lines[0].trim()
    const keywordsLine = lines.find((l) => l.startsWith("Keywords:"))
    const filesStart = lines.findIndex((l) => l.startsWith("Files:"))

    if (!keywordsLine || filesStart === -1) continue

    const keywords = keywordsLine
      .replace("Keywords:", "")
      .split(",")
      .map((k) => k.trim().toLowerCase())

    const files: Array<{ path: string; description: string }> = []
    for (let i = filesStart + 1; i < lines.length; i++) {
      const fileMatch = /^\\s+-\\s+([^—]+)(?:—\\s+(.*))?$/.exec(lines[i])
      if (!fileMatch) break
      files.push({ path: fileMatch[1].trim(), description: fileMatch[2]?.trim() ?? "" })
    }

    entries.push({ domain, keywords, files })
  }

  return entries
}

export default (async ({ directory }: { directory: string }) => ({
  "chat.message": async (
    _input: { sessionID: string; agent?: string; messageID?: string },
    output: { message: any; parts: any[] }
  ) => {
    // Extract text from the user message parts
    const msgParts: any[] = (output.message as any)?.parts ?? []
    const prompt = msgParts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text as string)
      .join(" ")

    if (!prompt || prompt.length < 20) return

    const manifestPath = path.join(directory, "docs", "principles", "manifest")
    const indexPath = path.join(directory, "docs", "domain", "INDEX.md")

    const promptWords = new Set(
      prompt.toLowerCase().split(/\\W+/).filter((w) => w.length > 3)
    )

    const injected: string[] = []

    // ── Principles manifest ──
    if (existsSync(manifestPath)) {
      const manifest = readFileSync(manifestPath, "utf-8")
      const principles = parsePrinciplesManifest(manifest)

      for (const entry of principles) {
        const matched = entry.recall.some((kw) => promptWords.has(kw))
        if (!matched) continue

        const filePath = path.join(directory, entry.file)
        if (!existsSync(filePath)) continue

        const content = readFileSync(filePath, "utf-8")
        injected.push(\`[carl-inject] Principle (\${entry.key}):\\n\${content}\`)
      }
    }

    // ── Domain index ──
    if (existsSync(indexPath)) {
      const index = readFileSync(indexPath, "utf-8")
      const domains = parseDomainIndex(index)

      for (const entry of domains) {
        const matched = entry.keywords.some((kw) => promptWords.has(kw))
        if (!matched) continue

        for (const file of entry.files.slice(0, 3)) {
          const filePath = path.join(directory, "docs", "domain", file.path)
          if (!existsSync(filePath)) continue

          const content = readFileSync(filePath, "utf-8")
          injected.push(\`[carl-inject] Domain (\${entry.domain} / \${file.path}):\\n\${content}\`)
        }
      }
    }

    if (injected.length > 0) {
      output.parts.push({
        type: "text",
        text: injected.join("\\n\\n---\\n\\n"),
      })
    }
  },
})) satisfies Plugin
`

// ─── Skill Inject ────────────────────────────────────────────────────────────

const SKILL_INJECT = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// Injects skill instructions BEFORE Write/Edit tool calls matching a file pattern.
// Uses tool.execute.before on Write/Edit — ensures the agent has step-by-step
// instructions for the artifact it is about to create, even for new files.
// This is Tier 3 of the context architecture.

const SKILL_MAP: Array<{ pattern: RegExp; skill: string }> = [
  { pattern: /\\.test\\.(ts|tsx|js|jsx)$/, skill: "j.test-writing" },
  { pattern: /app\\/.*\\/page\\.(tsx|jsx)$/, skill: "j.page-creation" },
  { pattern: /app\\/api\\/.*\\.(ts|js)$/, skill: "j.api-route-creation" },
  { pattern: /actions\\.(ts|js)$/, skill: "j.server-action-creation" },
  { pattern: /schema\\.prisma$/, skill: "j.schema-migration" },
]

const injectedSkills = new Set<string>()

export default (async ({ directory }: { directory: string }) => ({
  "tool.execute.before": async (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any }
  ) => {
    if (!["Write", "Edit", "MultiEdit"].includes(input.tool)) return

    const filePath: string = output.args?.path ?? output.args?.file_path ?? ""
    if (!filePath) return

    const match = SKILL_MAP.find(({ pattern }) => pattern.test(filePath))
    if (!match) return

    // Inject each skill only once per session to avoid context bloat
    const key = \`\${input.sessionID}:\${match.skill}\`
    if (injectedSkills.has(key)) return
    injectedSkills.add(key)

    const skillPath = path.join(directory, ".opencode", "skills", match.skill, "SKILL.md")
    if (!existsSync(skillPath)) return

    const skillContent = readFileSync(skillPath, "utf-8")

    // Inject skill into args metadata so the agent has instructions before writing
    output.args._skillInjection =
      \`[skill-inject] Skill activated for \${match.skill}:\\n\\n\${skillContent}\`
  },
})) satisfies Plugin
`

// ─── Intent Gate ─────────────────────────────────────────────────────────────

const INTENT_GATE = `import type { Plugin } from "@opencode-ai/plugin"

// Classifies prompt intent and annotates the message before the agent processes it.
// Uses chat.message hook — fires when a user message is being assembled.

const INTENT_TYPES: Record<string, string[]> = {
  RESOLVE_PROBLEM: ["fix", "bug", "error", "broken", "crash", "fail", "issue", "problem"],
  REFACTOR: ["refactor", "cleanup", "restructure", "reorganize", "improve", "simplify"],
  ADD_FEATURE: ["add", "implement", "create", "build", "feature", "support"],
  RESEARCH: ["understand", "explain", "how does", "what is", "why does", "analyze"],
  MIGRATION: ["migrate", "upgrade", "move", "port", "convert"],
  REVIEW: ["review", "check", "audit", "inspect"],
}

function classifyIntent(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [type, keywords] of Object.entries(INTENT_TYPES)) {
    if (keywords.some((kw) => lower.includes(kw))) return type
  }
  return "GENERAL"
}

export default (async ({ directory: _directory }: { directory: string }) => ({
  "chat.message": async (
    _input: { sessionID: string; agent?: string; messageID?: string },
    output: { message: any; parts: any[] }
  ) => {
    const msgParts: any[] = (output.message as any)?.parts ?? []
    const prompt = msgParts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text as string)
      .join(" ")

    if (!prompt || prompt.length < 15) return

    const intent = classifyIntent(prompt)
    if (intent === "GENERAL") return

    output.parts.push({
      type: "text",
      text:
        \`[intent-gate] Detected intent: \${intent}\\n\` +
        \`Routing guide: RESOLVE_PROBLEM → @j.implementer, REFACTOR → @j.implementer, \` +
        \`ADD_FEATURE → @j.planner then @j.implementer, RESEARCH → inline, \` +
        \`MIGRATION → @j.planner then @j.implementer, REVIEW → @j.reviewer\`,
    })
  },
})) satisfies Plugin
`

// ─── Todo Enforcer ────────────────────────────────────────────────────────────

const TODO_ENFORCER = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// Re-injects incomplete tasks into system context before every AI message.
// Uses experimental.chat.system.transform — fires before each AI request.
// This makes loop completion deterministic: agent always sees pending todos.

export default (async ({ directory }: { directory: string }) => ({
  "experimental.chat.system.transform": async (
    _input: { sessionID?: string; model: any },
    output: { system: string[] }
  ) => {
    const statePath = path.join(directory, ".opencode", "state", "execution-state.md")
    if (!existsSync(statePath)) return

    const state = readFileSync(statePath, "utf-8")

    // Extract incomplete tasks (lines with [ ] — unchecked checkboxes)
    const incomplete = state
      .split("\\n")
      .filter((line) => /^\\s*-\\s*\\[\\s*\\]/.test(line))
      .map((line) => line.trim())

    if (incomplete.length === 0) return

    output.system.push(
      \`[todo-enforcer] \${incomplete.length} incomplete task(s) remaining:\\n\\n\` +
      incomplete.join("\\n") +
      \`\\n\\nDo not stop until all tasks are complete. Continue working.\`
    )
  },
})) satisfies Plugin
`

// ─── Comment Checker ──────────────────────────────────────────────────────────

const COMMENT_CHECKER = `import type { Plugin } from "@opencode-ai/plugin"

// Detects obvious/redundant comments after Write/Edit and appends a reminder.
// Uses tool.execute.after — appends to output.output so agent sees the warning.

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

const IGNORE_PATTERNS = [
  /\\/\\/\\s*@ts-/,
  /\\/\\/\\s*eslint/,
  /\\/\\/\\s*TODO/i,
  /\\/\\/\\s*FIXME/i,
  /\\/\\/\\s*HACK/i,
  /\\/\\/\\s*NOTE:/i,
  /\\/\\/\\s*BUG:/i,
  /\\/\\*\\*/,
  /\\s*\\*\\s/,
  /given|when|then/i,
  /describe|it\\(/,
]

function hasObviousComments(content: string): string[] {
  const lines = content.split("\\n")
  const found: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (IGNORE_PATTERNS.some((p) => p.test(line))) continue
    if (OBVIOUS_PATTERNS.some((p) => p.test(line))) {
      found.push(\`Line \${i + 1}: \${line.trim()}\`)
    }
  }

  return found
}

export default (async ({ directory: _directory }: { directory: string }) => ({
  "tool.execute.after": async (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: { title: string; output: string; metadata: any }
  ) => {
    if (!["Write", "Edit"].includes(input.tool)) return

    const content: string = input.args?.content ?? input.args?.new_string ?? ""
    if (!content) return

    const obvious = hasObviousComments(content)
    if (obvious.length === 0) return

    output.output +=
      \`\\n\\n[comment-checker] \${obvious.length} potentially obvious comment(s) detected:\\n\` +
      obvious.slice(0, 3).join("\\n") +
      \`\\nConsider removing redundant comments — code should be self-documenting.\`
  },
})) satisfies Plugin
`

// ─── Hashline Read ────────────────────────────────────────────────────────────

const HASHLINE_READ = `import type { Plugin } from "@opencode-ai/plugin"
import crypto from "crypto"

// Tags each line in Read output with NN#XX: prefix for stable hash references.
// Agent uses these tags when editing — hashline-edit.ts validates them.
// Uses tool.execute.after — sets output.output to the tagged version.

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

export default (async ({ directory: _directory }: { directory: string }) => ({
  "tool.execute.after": async (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: { title: string; output: string; metadata: any }
  ) => {
    if (input.tool !== "Read") return
    if (typeof output.output !== "string") return

    output.output = addHashlines(output.output)
  },
})) satisfies Plugin
`

// ─── Hashline Edit ────────────────────────────────────────────────────────────

const HASHLINE_EDIT = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import crypto from "crypto"

// Validates hashline references before Edit tool calls.
// Throws an Error (aborts the edit) if referenced hashes are stale.
// Uses tool.execute.before — output.args has the edit arguments.

function hashLine(line: string): string {
  return crypto.createHash("md5").update(line).digest("hex").slice(0, 2)
}

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

export default (async ({ directory: _directory }: { directory: string }) => ({
  "tool.execute.before": async (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any }
  ) => {
    if (input.tool !== "Edit") return

    const filePath: string = output.args?.path ?? output.args?.file_path ?? ""
    const oldString: string = output.args?.old_string ?? ""

    if (!filePath || !oldString || !existsSync(filePath)) return

    const refs = extractHashlineRefs(oldString)
    if (refs.length === 0) return

    const currentLines = readFileSync(filePath, "utf-8").split("\\n")

    for (const ref of refs) {
      const lineIndex = ref.lineNum - 1
      if (lineIndex >= currentLines.length) {
        throw new Error(
          \`[hashline-edit] Stale reference: line \${ref.lineNum} no longer exists in \${filePath}.\\n\` +
          \`Re-read the file to get current hashlines.\`
        )
      }

      const currentHash = hashLine(currentLines[lineIndex])
      if (currentHash !== ref.hash) {
        throw new Error(
          \`[hashline-edit] Stale reference at line \${ref.lineNum}: expected hash \${ref.hash}, got \${currentHash}.\\n\` +
          \`Re-read the file to get current hashlines.\`
        )
      }
    }
  },
})) satisfies Plugin
`

// ─── Directory Agents Injector ────────────────────────────────────────────────

const DIR_AGENTS_INJECTOR = `import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import path from "path"

// Tier 1 context mechanism — hierarchical AGENTS.md injection.
// When an agent reads a file, walks the directory tree from the file's location
// to the project root and appends every AGENTS.md found to the Read output.
// Injects from root → most specific (additive, layered context).
// Uses tool.execute.after on Read — appends to output.output.

function findAgentsMdFiles(filePath: string, projectRoot: string): string[] {
  const result: string[] = []
  let current = path.dirname(filePath)

  // Walk up to project root (exclusive — root AGENTS.md is auto-loaded by OpenCode)
  while (current !== projectRoot && current !== path.dirname(current)) {
    const agentsMd = path.join(current, "AGENTS.md")
    if (existsSync(agentsMd)) {
      result.unshift(agentsMd) // prepend for root → specific order
    }
    current = path.dirname(current)
  }

  return result
}

export default (async ({ directory }: { directory: string }) => {
  const injectedPaths = new Set<string>()

  return {
    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string; args: any },
      output: { title: string; output: string; metadata: any }
    ) => {
      if (input.tool !== "Read") return

      const filePath: string = input.args?.path ?? input.args?.file_path ?? ""
      if (!filePath || !filePath.startsWith(directory)) return

      const agentsMdFiles = findAgentsMdFiles(filePath, directory)
      const toInject: string[] = []

      for (const agentsPath of agentsMdFiles) {
        if (injectedPaths.has(agentsPath)) continue
        injectedPaths.add(agentsPath)

        const content = readFileSync(agentsPath, "utf-8")
        const relPath = path.relative(directory, agentsPath)
        toInject.push(\`[directory-agents-injector] Context from \${relPath}:\\n\\n\${content}\`)
      }

      if (toInject.length > 0) {
        output.output += "\\n\\n" + toInject.join("\\n\\n---\\n\\n")
      }
    },
  }
}) satisfies Plugin
`
