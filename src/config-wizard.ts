/**
 * Interactive configuration wizard.
 *
 * Runs `opencode models` to discover available models, groups them by tier,
 * and lets the user pick a model for each tier via numeric menu.
 *
 * Uses Node.js built-in readline — zero external dependencies.
 */

import { createInterface } from "readline"
import { discoverAvailableModels } from "./discovery.js"
import {
  type ModelTier,
  groupModelsByTier,
  selectBestModels,
  DEFAULT_MODELS,
} from "./models.js"
import { type JuninhoConfig, loadConfig, saveConfig } from "./config"
import { rewriteAgentModels } from "./rewriter"

const TIER_LABELS: Record<ModelTier, string> = {
  strong: "Forte (Strong)",
  medium: "Médio (Medium)",
  weak: "Fraco (Weak)",
}

const TIER_AGENTS: Record<ModelTier, string[]> = {
  strong: ["j.planner", "j.spec-writer"],
  medium: ["j.plan-reviewer", "j.implementer", "j.validator", "j.reviewer", "j.unify"],
  weak: ["j.explore", "j.librarian"],
}

const TIER_KNOWN_DEFAULTS: Record<ModelTier, string> = {
  strong: "Claude Opus 4.6",
  medium: "Claude Sonnet 4.6",
  weak: "Claude Haiku 4.5",
}

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

export async function runConfigWizard(projectDir: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    console.log("")
    console.log("╔══════════════════════════════════════════════════╗")
    console.log("║     juninho — Configuração de Modelos           ║")
    console.log("╚══════════════════════════════════════════════════╝")
    console.log("")

    // Load existing config
    const existing = loadConfig(projectDir)
    if (existing) {
      console.log("Configuração atual:")
      console.log(`  Forte:  ${existing.strong}`)
      console.log(`  Médio:  ${existing.medium}`)
      console.log(`  Fraco:  ${existing.weak}`)
      console.log("")
    }

    // Discover models
    console.log("[juninho] Detectando modelos disponíveis via 'opencode models'...")
    const available = discoverAvailableModels()

    if (available.length === 0) {
      console.log("")
      console.log("[juninho] ⚠ Nenhum modelo detectado via 'opencode models'.")
      console.log("[juninho]   Possíveis causas:")
      console.log("[juninho]   - O comando 'opencode' não está instalado ou não está no PATH")
      console.log("[juninho]   - Nenhum provider está configurado no OpenCode")
      console.log("")
      console.log("[juninho]   Você pode configurar manualmente os model IDs abaixo.")
      console.log("")

      // Manual entry — obrigatório
      const config = await manualEntry(rl, existing)
      saveConfig(projectDir, config)
      await applyConfig(projectDir, config)
      return
    }

    // Show discovered models
    console.log(`[juninho] ✓ ${available.length} modelo(s) detectado(s):`)
    console.log("")
    const grouped = groupModelsByTier(available)
    const best = selectBestModels(available)

    if (grouped.strong.length > 0) {
      console.log("  Fortes: " + grouped.strong.join(", "))
    }
    if (grouped.medium.length > 0) {
      console.log("  Médios: " + grouped.medium.join(", "))
    }
    if (grouped.weak.length > 0) {
      console.log("  Fracos: " + grouped.weak.join(", "))
    }
    if (grouped.unknown.length > 0) {
      console.log("  Outros: " + grouped.unknown.join(", "))
    }
    console.log("")

    // For each tier, let user pick
    const config: JuninhoConfig = {
      strong: DEFAULT_MODELS.strong,
      medium: DEFAULT_MODELS.medium,
      weak: DEFAULT_MODELS.weak,
    }

    for (const tier of ["strong", "medium", "weak"] as ModelTier[]) {
      const tierModels = grouped[tier]
      const defaultBest = best[tier]
      const currentValue = existing?.[tier]

      console.log(`─── ${TIER_LABELS[tier]} ───`)
      console.log(`  Usado por: ${TIER_AGENTS[tier].join(", ")}`)
      console.log(`  Ideal: ${TIER_KNOWN_DEFAULTS[tier]}`)

      if (tierModels.length === 0) {
        // No tier-specific models available — offer "other" models or manual entry
        console.log("  ⚠ Nenhum modelo deste tier detectado.")

        // Check if there are models from adjacent tiers that could work
        const fallbackOptions = [...grouped.strong, ...grouped.medium, ...grouped.weak, ...grouped.unknown]
          .filter((m) => m !== config.strong && m !== config.medium && m !== config.weak)

        if (fallbackOptions.length > 0 || defaultBest) {
          const allOptions = defaultBest ? [defaultBest, ...fallbackOptions.filter(m => m !== defaultBest)] : fallbackOptions
          console.log("  Modelos disponíveis de outros tiers:")
          allOptions.forEach((m, i) => {
            const marker = (currentValue === m || (!currentValue && m === defaultBest)) ? " ← recomendado" : ""
            console.log(`    ${i + 1}) ${m}${marker}`)
          })

          const response = await ask(rl, `  Escolha (1-${allOptions.length}) ou Enter para '${defaultBest ?? DEFAULT_MODELS[tier]}': `)
          const idx = parseInt(response, 10)
          if (idx >= 1 && idx <= allOptions.length) {
            config[tier] = allOptions[idx - 1]
          } else {
            config[tier] = defaultBest ?? DEFAULT_MODELS[tier]
          }
        } else {
          const manual = await ask(rl, `  Digite o model ID ou Enter para padrão (${DEFAULT_MODELS[tier]}): `)
          config[tier] = manual || DEFAULT_MODELS[tier]
        }
      } else if (tierModels.length === 1) {
        // Single option — suggest it
        const model = tierModels[0]
        const response = await ask(rl, `  Modelo detectado: ${model}. Usar? (S/n): `)
        config[tier] = (response.toLowerCase() === "n") ? (await ask(rl, `  Digite o model ID: `)) || model : model
      } else {
        // Multiple options — numbered menu
        tierModels.forEach((m, i) => {
          const marker = (m === defaultBest) ? " ← recomendado" : ""
          console.log(`    ${i + 1}) ${m}${marker}`)
        })

        const defaultIdx = defaultBest ? tierModels.indexOf(defaultBest) + 1 : 1
        const response = await ask(rl, `  Escolha (1-${tierModels.length}) ou Enter para ${defaultIdx}: `)
        const idx = parseInt(response, 10)
        if (idx >= 1 && idx <= tierModels.length) {
          config[tier] = tierModels[idx - 1]
        } else {
          config[tier] = tierModels[defaultIdx - 1] ?? tierModels[0]
        }
      }

      console.log(`  ✓ ${TIER_LABELS[tier]}: ${config[tier]}`)
      console.log("")
    }

    // Confirm and save
    console.log("─── Resumo ───")
    console.log(`  Forte:  ${config.strong}  → ${TIER_AGENTS.strong.join(", ")}`)
    console.log(`  Médio:  ${config.medium}  → ${TIER_AGENTS.medium.join(", ")}`)
    console.log(`  Fraco:  ${config.weak}    → ${TIER_AGENTS.weak.join(", ")}`)
    console.log("")

    const confirm = await ask(rl, "Confirmar? (S/n): ")
    if (confirm.toLowerCase() === "n") {
      console.log("[juninho] Configuração cancelada.")
      return
    }

    saveConfig(projectDir, config)
    await applyConfig(projectDir, config)

  } finally {
    rl.close()
  }
}

async function manualEntry(
  rl: ReturnType<typeof createInterface>,
  existing: JuninhoConfig | null
): Promise<JuninhoConfig> {
  console.log("")
  console.log("Digite o model ID completo (ex: github-copilot/claude-opus-4.6)")
  console.log("Pressione Enter para aceitar o default sugerido entre colchetes.")
  console.log("")

  const strongDefault = existing?.strong ?? DEFAULT_MODELS.strong
  const mediumDefault = existing?.medium ?? DEFAULT_MODELS.medium
  const weakDefault = existing?.weak ?? DEFAULT_MODELS.weak

  const strong = await ask(rl, `  Modelo Forte [${strongDefault}]: `)
  const medium = await ask(rl, `  Modelo Médio [${mediumDefault}]: `)
  const weak = await ask(rl, `  Modelo Fraco [${weakDefault}]: `)

  return {
    strong: strong || strongDefault,
    medium: medium || mediumDefault,
    weak: weak || weakDefault,
  }
}

async function applyConfig(projectDir: string, config: JuninhoConfig): Promise<void> {
  console.log("")
  console.log("[juninho] Salvando configuração...")

  // Rewrite agents if framework is installed
  const applied = rewriteAgentModels(projectDir, config)
  if (applied) {
    console.log("[juninho] ✓ Agentes e opencode.json atualizados com os modelos escolhidos.")
  } else {
    console.log("[juninho] ✓ Configuração salva. Execute 'juninho setup' para instalar o framework.")
  }

  console.log("[juninho] ✓ Configuração salva em .opencode/juninho-config.json")
  console.log("")
}
