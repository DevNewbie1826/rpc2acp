import { existsSync, readFileSync } from 'node:fs'
import { resolveVariant, getAgentDir as getVariantAgentDir, getGlobalSettingsPath, getProjectSettingsPath } from './agent-variant.js'

const variant = resolveVariant()

function isObject(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x)
}

function deepMerge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const av = out[k]
    if (isObject(av) && isObject(v)) out[k] = deepMerge(av, v)
    else out[k] = v
  }
  return out
}

function readJsonFile(path: string): Record<string, unknown> {
  try {
    if (!existsSync(path)) return {}
    const raw = readFileSync(path, 'utf-8')
    const data = JSON.parse(raw)
    return isObject(data) ? data : {}
  } catch {
    return {}
  }
}

function normalizeLegacyKeys(settings: Record<string, unknown>): Record<string, unknown> {
  const out = { ...settings }

  // quietStart → quietStartup
  if (!('quietStartup' in out) && typeof out.quietStart === 'boolean') {
    out.quietStartup = out.quietStart
  }
  delete out.quietStart

  // skills.enableSkillCommands → enableSkillCommands
  if (!('enableSkillCommands' in out) && isObject(out.skills)) {
    const nested = out.skills.enableSkillCommands
    if (typeof nested === 'boolean') {
      out.enableSkillCommands = nested
    }
  }

  return out
}

function getMergedSettings(cwd: string): Record<string, unknown> {
  const globalSettingsPath = getGlobalSettingsPath(variant)
  const projectSettingsPath = getProjectSettingsPath(variant, cwd)

  const global = normalizeLegacyKeys(readJsonFile(globalSettingsPath))
  const project = normalizeLegacyKeys(readJsonFile(projectSettingsPath))
  return deepMerge(global, project)
}

export function getAgentDir(): string {
  return getVariantAgentDir(variant)
}

/**
 * Mirror pi settings semantics (global + project merge, project overrides global).
 * Only returns the bits we currently need.
 */
export function getEnableSkillCommands(cwd: string): boolean {
  const merged = getMergedSettings(cwd)
  const direct = merged.enableSkillCommands
  return typeof direct === 'boolean' ? direct : true
}

/**
 * Mirror pi's quietStartup setting: if true, pi suppresses the verbose startup prelude.
 * We use it to decide whether to synthesize + emit our own "startup info" message.
 */
export function getQuietStartup(cwd: string): boolean {
  const merged = getMergedSettings(cwd)
  const direct = merged.quietStartup
  return typeof direct === 'boolean' ? direct : false
}
