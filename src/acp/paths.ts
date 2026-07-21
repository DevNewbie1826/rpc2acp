import { resolveVariant, getAdapterDir, getAdapterSessionMapPath } from './agent-variant.js'

const variant = resolveVariant()

/**
 * Storage owned by the ACP adapter.
 *
 * We intentionally keep this separate from the agent's own variant-based config directory.
 */
export function getPiAcpDir(): string {
  return getAdapterDir(variant)
}

export function getPiAcpSessionMapPath(): string {
  return getAdapterSessionMapPath(variant)
}
