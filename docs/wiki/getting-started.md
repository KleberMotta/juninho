# Getting Started

## Pré-requisitos

- [OpenCode](https://opencode.ai) instalado
- Node.js 18+
- npm 9+

## Instalação

```bash
npm install -g juninho
```

> **Alpha notice:** Esta é uma versão alpha (`1.0.0-alpha.x`). A API pode mudar entre versões.
> Fixe a versão se precisar de estabilidade: `npm install -g juninho@1.0.0-alpha.1`

## Setup em um projeto

```bash
cd meu-projeto-opencode
juninho setup
```

Output esperado:
```
[juninho] Installing Agentic Coding Framework...
[juninho] Target: /caminho/para/meu-projeto
[juninho] ✓ Directories created
[juninho] ✓ Agents created (9)
[juninho] ✓ Skills created (5)
[juninho] ✓ Plugins created (11)
[juninho] ✓ Tools created (4)
[juninho] ✓ Commands created (13)
[juninho] ✓ State files created
[juninho] ✓ Docs scaffold created
[juninho] ✓ opencode.json patched

[juninho] ✓ Framework installed successfully!
[juninho] Open OpenCode — /j.plan, /j.spec and /j.implement are ready.
```

## Primeiro uso no OpenCode

Abra o OpenCode no projeto e experimente:

```
/j.plan adicionar autenticação com email e OAuth Google
```

O agente `@j.planner` vai:
1. Classificar a intent como FEATURE
2. Explorar o codebase atual
3. Fazer perguntas proporcionais à complexidade
4. Escrever um `plan.md` aprovado

Depois:
```
/j.implement
```

O `@j.implementer` executa o plano wave por wave, validando a cada etapa.

## Testando localmente (sem publicar no npm)

Se você clonou o repositório do juninho:

```bash
cd juninho
npm install
npm run build
npm link          # cria symlink global

# Em qualquer projeto
cd meu-projeto
juninho setup

# Para remover o link
npm unlink -g juninho
```

## Estrutura gerada

Após o setup, seu projeto terá:

```
.opencode/
├── agents/          ← @j.planner, @j.implementer, @j.validator, etc.
├── skills/          ← instruções por tipo de arquivo
├── plugins/         ← hooks automáticos (auto-descobertos pelo OpenCode)
├── tools/           ← lsp, ast-grep, find-pattern, next-version
├── commands/        ← /j.plan, /j.spec, /j.implement, /j.handoff, etc.
└── state/           ← contexto persistente entre sessões

AGENTS.md            ← referência rápida de todos os agentes e comandos
opencode.json        ← patchado com definições dos agentes + MCP Context7
docs/
├── domain/INDEX.md  ← índice de domínio (populado por /j.init-deep)
├── principles/manifest ← lookup table do CARL
└── specs/           ← specs geradas por /j.spec
worktrees/           ← para paralelização com git worktrees
```

## Próximos passos

- [Workflow recomendado](./workflow.md)
- [Referência de agentes](./agents.md)
- [Referência de plugins](./plugins.md)
- [Referência de comandos](./commands.md)
