# Changelog

Todas as mudanças notáveis neste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Planejado para 1.0.0-beta.1
- [ ] Suporte a `juninho update` para atualizar arquivos gerados mantendo customizações
- [ ] Comando `juninho status` para mostrar o que está instalado e versões
- [ ] Agente `@memory-manager` para gerenciar `persistent-context.md` ativamente
- [ ] Template de agente para projetos Python/FastAPI
- [ ] Testes automatizados com Jest

---

## [1.0.0-alpha.1] — 2026-02-22

### Adicionado

**CLI**
- `juninho setup [dir] [--force]` — instala o framework completo em um projeto
- `juninho --help` — exibe uso e opções
- Idempotência via marker `.opencode/.juninho-installed`
- Flag `--force` para reinstalação

**Agentes instalados (7)**
- `@planner` — protocolo Metis→Prometheus→Momus para planejamento goal-backward
- `@plan-reviewer` — porta de qualidade com viés de aprovação
- `@spec-writer` — entrevista de 5 fases (Discovery→Requirements→Contract→Data→Review)
- `@implementer` — loop READ→ACT→COMMIT→VALIDATE com execução em waves
- `@validator` — validação contra spec com tiers APPROVED/NOTE/FIX/BLOCK
- `@reviewer` — revisor advisory read-only
- `@unify` — reconciliação, atualização de docs, merge de worktrees, criação de PR

**Plugins instalados (10)**
- `env-protection` — bloqueia acesso a arquivos sensíveis
- `auto-format` — formata arquivos após Write/Edit (prettier, black, gofmt, rustfmt)
- `plan-autoload` — injeta plano ativo quando sessão fica idle
- `carl-inject` — injeta contexto de domínio baseado em keywords do prompt
- `skill-inject` — injeta skill instructions por padrão de path de arquivo
- `intent-gate` — classifica intent do prompt para melhor roteamento de agente
- `todo-enforcer` — re-injeta tasks incompletas quando sessão fica idle
- `comment-checker` — detecta e sinaliza comentários óbvios/redundantes
- `hashline-read` — adiciona prefixo `NNN#XX:` ao output do Read
- `hashline-edit` — valida referências hashline antes de executar edits

**Skills instaladas (5)**
- `test-writing` — padrões AAA, cobertura, mocking, naming conventions
- `page-creation` — Next.js App Router, Server vs Client Components, loading/error states
- `api-route-creation` — route handlers, auth check, validação Zod, error handling
- `server-action-creation` — `"use server"`, ActionResult type, revalidação
- `schema-migration` — Prisma schema seguro, additive changes, migration naming

**Ferramentas instaladas (4)**
- `find_pattern` — busca padrões canônicos no codebase ou no manifest
- `next_version` — incrementa versão de migrations automaticamente
- `lsp_*` — 6 ferramentas LSP (diagnostics, goto-definition, references, symbols, rename)
- `ast_grep_search` / `ast_grep_replace` — busca e substituição estrutural por AST

**Slash commands (7)**
- `/plan` — invoca @planner
- `/spec` — invoca @spec-writer
- `/implement` — invoca @implementer
- `/init-deep` — exploração profunda do codebase para popular docs de domínio
- `/start-work` — inicializa contexto de sessão focada
- `/handoff` — prepara documentação de handoff fim de sessão
- `/ulw-loop` — modo ultra work, máximo paralelismo

**Docs scaffold**
- `AGENTS.md` — referência rápida na raiz do projeto
- `docs/domain/INDEX.md` — template de índice de domínio para CARL
- `docs/principles/manifest` — lookup table de keywords para CARL
- `docs/specs/` — diretório para specs geradas por @spec-writer
- `worktrees/` — diretório para paralelização com git worktrees

**opencode.json patching**
- Merge inteligente: configuração existente do usuário tem prioridade
- Registra os 7 agentes com modelo, modo e permissões
- Adiciona MCP Context7 (`@upstash/context7-mcp@latest`)

**GitHub infra (no repositório do juninho)**
- CI workflow: build + typecheck + smoke test em Node 18/20/22
- Publish workflow: publicação automática no npm ao criar tag `v*`
- PR template em português
- CODEOWNERS
- CONTRIBUTING.md completo
- Wiki em `docs/wiki/` (Home, Getting Started, Workflow, Agents, Plugins, Commands)

---

[Unreleased]: https://github.com/seu-usuario/juninho/compare/v1.0.0-alpha.1...HEAD
[1.0.0-alpha.1]: https://github.com/seu-usuario/juninho/releases/tag/v1.0.0-alpha.1
