## O que essa PR faz?

<!-- Descreva claramente o que foi implementado, corrigido ou alterado -->

## Tipo de mudança

- [ ] Bug fix (mudança não-breaking que corrige um problema)
- [ ] Nova feature (mudança não-breaking que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade existente)
- [ ] Refactor (melhoria interna sem mudança de comportamento)
- [ ] Docs (apenas documentação)
- [ ] Infra / CI (workflows, configs, tooling)

## Como testar

```bash
# 1. Build
npm run build

# 2. Smoke test
mkdir -p /tmp/pr-test && node dist/cli.js setup /tmp/pr-test

# 3. Passos específicos desta PR:
#    ...
```

## Checklist

- [ ] `npm run build` passa sem erros TypeScript
- [ ] Smoke test (`juninho setup`) funciona em diretório vazio
- [ ] Idempotência confirmada (segunda execução mostra "already installed")
- [ ] Se adicionou novo agente/plugin/skill/command: conteúdo está completo (não é placeholder)
- [ ] Se mudou o installer: `createDirectories()` inclui os novos diretórios necessários
- [ ] Se mudou `patchOpencodeJson`: merge continua preservando config existente do usuário
- [ ] Versão em `package.json` atualizada (se aplicável)

## Arquivos gerados no projeto alvo

<!-- Se esta PR adiciona novos arquivos ao projeto alvo (test-project), liste aqui -->

## Breaking changes

<!-- Se aplica: o que quebra, qual a migration path -->

## Screenshots / output

<!-- Cole aqui o output do `juninho setup` após sua mudança, se relevante -->
