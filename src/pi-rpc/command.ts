import { platform } from 'node:os'
import { resolveVariant } from '../acp/agent-variant.js'

const variant = resolveVariant()

export function defaultPiCommand(): string {
  if (platform() !== 'win32') return variant.command

  // Don't double-append .cmd if the command already has an extension.
  const cmd = variant.command
  if (/\.[^./\\]+$/.test(cmd)) return cmd
  return `${cmd}.cmd`
}

export function getPiCommand(override?: string): string {
  return override ?? defaultPiCommand()
}

export function shouldUseShellForPiCommand(cmd: string): boolean {
  if (platform() !== 'win32') return false

  const normalized = cmd.trim().toLowerCase()
  return normalized.endsWith('.cmd') || normalized.endsWith('.bat')
}
