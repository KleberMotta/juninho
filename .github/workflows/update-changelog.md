---
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Versão a documentar (ex: 1.0.0-alpha.3). Deixe vazio para detectar automaticamente."
        required: false
        default: ""

  push:
    tags:
      - "v*"

permissions:
  contents: write
  pull-requests: write

tools:
  edit:
  bash:
    - git
    - node
    - cat
    - grep
    - date
    - echo
  github:
    toolsets: [repos, pull_requests]
    mode: remote
---

# Atualizar CHANGELOG.md

Você é um agente responsável por atualizar o arquivo `CHANGELOG.md` do projeto `juninho` após cada release.

## Contexto

O projeto usa o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) em português.

Seções aceitas: `Adicionado`, `Modificado`, `Corrigido`, `Removido`, `Segurança`, `Descontinuado`.

## Passos

### 1. Determinar a versão

Se `${{ inputs.version }}` não estiver vazio, use esse valor.

Caso contrário, execute:
```
git describe --tags --abbrev=0
```
para obter a tag mais recente. A versão é o valor sem o prefixo `v`.

### 2. Coletar commits desde a release anterior

Execute:
```
git log <tag-anterior>...<tag-atual> --oneline --no-merges
```

Se for a primeira release, use:
```
git log --oneline --no-merges
```

### 3. Classificar commits por categoria

Mapeie prefixos de Conventional Commits para seções do changelog:

| Prefixo do commit | Seção no changelog |
|-------------------|--------------------|
| `feat:`, `feature:` | Adicionado |
| `fix:`, `bugfix:` | Corrigido |
| `refactor:` | Modificado |
| `docs:` | Modificado |
| `chore:`, `ci:`, `build:` | omitir (infraestrutura interna) |
| `security:` | Segurança |
| `deprecate:` | Descontinuado |
| `remove:`, `break:` | Removido |

Ignore commits com `[skip ci]` ou `chore: release`.

### 4. Obter a data atual

Execute `date +%Y-%m-%d` para obter a data no formato correto.

### 5. Construir a nova seção

Formato:
```markdown
## [X.Y.Z-tag.N] — YYYY-MM-DD

### Adicionado
- Descrição clara do que foi adicionado

### Corrigido
- Descrição do que foi corrigido
```

- Cada bullet deve descrever **o que** mudou em linguagem orientada ao usuário, não o commit técnico
- Se um commit for vago (ex: `fix: stuff`), infira o contexto lendo o diff com `git show <hash> --stat`
- Omita seções que não têm entradas

### 6. Atualizar o CHANGELOG.md

Leia o arquivo atual. Insira a nova seção **após a linha `## [Unreleased]`** e antes da primeira release existente.

Atualize também os links no rodapé do arquivo:
- Mova `[Unreleased]` para comparar da nova versão até HEAD
- Adicione link para a nova versão

### 7. Criar Pull Request

Crie um PR com:
- **Título:** `docs: update CHANGELOG for v<version>`
- **Branch:** `changelog/v<version>`
- **Body:**
  ```
  Atualização automática do CHANGELOG para a versão v<version>.

  Gerado pelo agente update-changelog com base nos commits desde a release anterior.

  Por favor revise se as descrições estão claras e orientadas ao usuário.
  ```

Não faça merge direto — crie o PR para revisão humana.
