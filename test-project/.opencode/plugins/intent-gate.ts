import { Plugin } from "@opencode-ai/plugin"

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
        `[intent-gate] Detected intent: ${intent}\n` +
        `Route to appropriate agent: RESOLVE_PROBLEM→@implementer, REFACTOR→@implementer, ` +
        `ADD_FEATURE→@planner+@implementer, RESEARCH→inline, MIGRATION→@planner+@implementer, REVIEW→@reviewer`
      )
    },
  },
} satisfies Plugin
