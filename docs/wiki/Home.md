# juninho Wiki

Documentação completa do **Agentic Coding Framework** para OpenCode.

> **Alpha notice:** versão `1.0.0-alpha.x` — API pode mudar entre versões.

---

## Navegação

| Página | Conteúdo |
|--------|----------|
| [Getting Started](./getting-started.md) | Instalação, primeiro uso, teste local |
| [Workflow](./workflow.md) | Casos de uso dia a dia — do bug ao PR |
| [Agentes](./agents.md) | Referência completa dos 7 agentes |
| [Plugins](./plugins.md) | Referência dos 10 plugins e seus hooks |
| [Comandos](./commands.md) | Referência dos 7 slash commands |

---

## O que é o juninho?

`juninho` é um CLI que instala o **Agentic Coding Framework** em projetos OpenCode com um único comando:

```bash
npm install -g juninho
cd meu-projeto
juninho setup
```

Depois disso, o OpenCode no seu projeto terá:
- **7 agentes especializados** com protocolos definidos (planner, spec-writer, implementer, validator, reviewer, plan-reviewer, unify)
- **10 plugins** que rodam automaticamente como hooks (env-protection, auto-format, carl-inject, skill-inject, hashline-read/edit, ...)
- **5 skills** que injetam instruções por tipo de arquivo (tests, pages, API routes, actions, migrations)
- **4 ferramentas** (lsp, ast-grep, find-pattern, next-version)
- **7 slash commands** (/plan, /spec, /implement, /init-deep, /start-work, /handoff, /ulw-loop)

---

## Fluxo resumido

```
/plan objetivo    →  plan.md aprovado
/implement        →  wave 1 → wave 2 → wave 3 → @validator → @unify → PR
```

Para features complexas:
```
/spec feature     →  docs/specs/feature.md
/plan             →  plan.md baseado na spec
/implement        →  execução com validação automática contra a spec
```

---

## Conceitos-chave

**CARL (Context-Aware Retrieval Layer)**
O plugin `carl-inject` extrai keywords dos prompts e injeta automaticamente entradas relevantes do `docs/principles/manifest`. Rode `/init-deep` uma vez para popular o manifesto com o seu codebase.

**Hashlines**
Sistema de referência estável a linhas de código: `NNN#XX:` onde `XX` é um hash da linha. Permite edits precisos sem ambiguidade, mesmo em arquivos grandes. O plugin `hashline-read` adiciona os prefixos; `hashline-edit` valida que referências não estão stale.

**Wave-based execution**
O `@implementer` divide trabalho em waves: Foundation (sequencial) → Core (paralela via worktrees) → Integration (sequencial). Permite paralelismo seguro sem conflitos de merge.

**Idempotência**
`juninho setup` pode ser rodado múltiplas vezes com segurança. O marker `.opencode/.juninho-installed` previne re-instalação acidental. Use `--force` para reinstalar.

---

## Links

- [GitHub](https://github.com/seu-usuario/juninho)
- [npm](https://npmjs.com/package/juninho)
- [Issues](https://github.com/seu-usuario/juninho/issues)
- [Contributing](../../CONTRIBUTING.md)
