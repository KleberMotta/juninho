# juninho

Bootstrap the **Agentic Coding Framework** (framework.md) into any [OpenCode](https://opencode.ai) project in a single command.

## Install

```bash
npm install -g @kleber.mottajr/juninho
```

## Usage

```bash
# Navigate to your project
cd my-opencode-project

# Run setup — one command, everything configured
juninho setup

# Output:
# [juninho] Installing Agentic Coding Framework...
# [juninho] ✓ Framework installed successfully!
# [juninho] Open OpenCode — /plan, /spec and /implement are ready.
```

## What it does

`juninho setup` automatically creates:

- **7 agents** in `.opencode/agents/` (planner, spec-writer, implementer, validator, reviewer, plan-reviewer, unify)
- **5 skills** in `.opencode/skills/` (test-writing, page-creation, api-route-creation, server-action-creation, schema-migration)
- **10 plugins** in `.opencode/plugins/` (auto-discovered by OpenCode)
- **4 tools** in `.opencode/tools/` (find-pattern, next-version, lsp, ast-grep)
- **7 slash commands** in `.opencode/commands/` (/plan, /spec, /implement, /init-deep, /start-work, /handoff, /ulw-loop)
- **State files** for persistent context and execution tracking
- **Docs scaffold** with AGENTS.md, domain index, and manifest

Then patches `opencode.json` with agent definitions and Context7 MCP.

## Idempotency

Running `juninho setup` twice is safe — it detects `.opencode/.juninho-installed` and skips if already configured. Use `--force` to reinstall.

## Re-install

```bash
juninho setup --force
```

## License

MIT
