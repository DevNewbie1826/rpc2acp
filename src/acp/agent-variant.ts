import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Agent variant descriptor.
 * Each pi-mono fork uses the same ~/.<configDir>/agent/ layout with a different dot-dir name.
 */
export type AgentVariant = {
  /** Short lowercase name (e.g. "pi", "omp", "senpi") */
  name: string
  /** Dot-dir under home (e.g. ".pi", ".omp", ".senpi") */
  configDir: string
  /** Executable command (e.g. "pi", "omp", "senpi") */
  command: string
  /** npm package name for version checks */
  npmPackage: string
}

const PRESETS: Readonly<Record<string, AgentVariant>> = {
  pi: {
    name: 'pi',
    configDir: '.pi',
    command: 'pi',
    npmPackage: '@earendil-works/pi-coding-agent'
  },
  omp: {
    name: 'omp',
    configDir: '.omp',
    command: 'omp',
    npmPackage: '@oh-my-pi/pi-coding-agent'
  },
  senpi: {
    name: 'senpi',
    configDir: '.senpi',
    command: 'senpi',
    npmPackage: '@code-yeongyu/senpi'
  }
}

function envOrUndefined(key: string): string | undefined {
  const v = process.env[key]
  return v && v.trim() ? v.trim() : undefined
}

/**
 * Resolve the active agent variant.
 *
 * Priority (highest wins):
 * 1. Individual env overrides: PI_ACP_AGENT_COMMAND, PI_ACP_AGENT_CONFIG_DIR, PI_ACP_AGENT_NPM_PACKAGE
 * 2. Preset from PI_ACP_VARIANT (pi|omp|senpi)
 * 3. Legacy: PI_ACP_PI_COMMAND (command only)
 * 4. Default: pi
 */
export function resolveVariant(): AgentVariant {
  const presetName = envOrUndefined('PI_ACP_VARIANT')?.toLowerCase() ?? 'pi'
  const preset = PRESETS[presetName] ?? PRESETS.pi

  return {
    name: preset.name,
    configDir: envOrUndefined('PI_ACP_AGENT_CONFIG_DIR') ?? preset.configDir,
    command: envOrUndefined('PI_ACP_AGENT_COMMAND') ?? envOrUndefined('PI_ACP_PI_COMMAND') ?? preset.command,
    npmPackage: envOrUndefined('PI_ACP_AGENT_NPM_PACKAGE') ?? preset.npmPackage
  }
}

/**
 * Agent config dir: ~/.<configDir>/agent/
 * Overridable via <NAME>_CODING_AGENT_DIR (e.g. PI_CODING_AGENT_DIR, OMP_CODING_AGENT_DIR).
 */
export function getAgentDir(variant: AgentVariant): string {
  const envKey = `${variant.name.toUpperCase()}_CODING_AGENT_DIR`
  const envDir = process.env[envKey]
  if (envDir && envDir.trim()) return resolve(envDir.trim())

  // Legacy: pi also accepts PI_CODING_AGENT_DIR (already covered above).
  return join(homedir(), variant.configDir, 'agent')
}

/** Sessions dir: reads sessionDir from settings.json if set, else <agentDir>/sessions */
export function getSessionsDir(variant: AgentVariant): string {
  const agentDir = getAgentDir(variant)
  return join(agentDir, 'sessions')
}

/** Adapter-owned storage: ~/.<configDir>/rpc2acp/ */
export function getAdapterDir(variant: AgentVariant): string {
  return join(homedir(), variant.configDir, 'rpc2acp')
}

/** Adapter session map file */
export function getAdapterSessionMapPath(variant: AgentVariant): string {
  return join(getAdapterDir(variant), 'session-map.json')
}

/** User-level prompts dir: ~/.<configDir>/agent/prompts/ */
export function getUserPromptsDir(variant: AgentVariant): string {
  return join(getAgentDir(variant), 'prompts')
}

/** Project-level prompts dir: <cwd>/.<configDir>/prompts/ */
export function getProjectPromptsDir(variant: AgentVariant, cwd: string): string {
  return resolve(cwd, variant.configDir, 'prompts')
}

/** Global settings: ~/.<configDir>/agent/settings.json */
export function getGlobalSettingsPath(variant: AgentVariant): string {
  return join(getAgentDir(variant), 'settings.json')
}

/** Project settings: <cwd>/.<configDir>/settings.json */
export function getProjectSettingsPath(variant: AgentVariant, cwd: string): string {
  return resolve(cwd, variant.configDir, 'settings.json')
}

/** Extensions dir: ~/.<configDir>/agent/extensions/ */
export function getExtensionsDir(variant: AgentVariant): string {
  return join(getAgentDir(variant), 'extensions')
}

/** Project skills dir: <cwd>/.<configDir>/skills/ */
export function getProjectSkillsDir(variant: AgentVariant, cwd: string): string {
  return resolve(cwd, variant.configDir, 'skills')
}
