import type { ToolCallContent } from '@agentclientprotocol/sdk'

type BashCommandRecord = {
  command?: unknown
  cmd?: unknown
  args?: BashCommandRecord
  input?: BashCommandRecord
  rawInput?: BashCommandRecord
  toolInput?: BashCommandRecord
  details?: BashCommandRecord
}

type BashResultRecord = {
  content?: unknown
  details?: unknown
  stdout?: unknown
  stderr?: unknown
  output?: unknown
  exitCode?: unknown
  code?: unknown
}

export function isBashTool(toolName: string): boolean {
  return toolName.toLowerCase() === 'bash'
}

export function bashCommand(value: unknown): string | undefined {
  const record = value as BashCommandRecord | null | undefined
  const command =
    record?.command ??
    record?.cmd ??
    record?.args?.command ??
    record?.args?.cmd ??
    record?.input?.command ??
    record?.input?.cmd ??
    record?.rawInput?.command ??
    record?.rawInput?.cmd ??
    record?.toolInput?.command ??
    record?.toolInput?.cmd ??
    record?.details?.command ??
    record?.details?.cmd

  return typeof command === 'string' && command.trim() ? command : undefined
}

export function bashResultText(result: unknown): string {
  const record = result as BashResultRecord | null | undefined
  const content = record?.content
  if (Array.isArray(content)) {
    const texts = content
      .filter((c): c is { type?: unknown; text?: unknown } => c != null && typeof c === 'object')
      .map(block => {
        return block.type === 'text' && typeof block.text === 'string' ? block.text : ''
      })
      .filter(Boolean)
    if (texts.length) return texts.join('')
  }

  const details = record?.details as BashResultRecord | null | undefined
  const stdout =
    (typeof details?.stdout === 'string' ? details.stdout : undefined) ??
    (typeof record?.stdout === 'string' ? record.stdout : undefined) ??
    (typeof details?.output === 'string' ? details.output : undefined) ??
    (typeof record?.output === 'string' ? record.output : undefined)
  const stderr =
    (typeof details?.stderr === 'string' ? details.stderr : undefined) ??
    (typeof record?.stderr === 'string' ? record.stderr : undefined)

  return [stdout, stderr].filter((part): part is string => typeof part === 'string' && part.length > 0).join('\n')
}

export function bashExitCode(result: unknown, isError: boolean): number {
  const record = result as BashResultRecord | null | undefined
  const details = record?.details as BashResultRecord | null | undefined
  const exitCode = details?.exitCode ?? record?.exitCode ?? details?.code ?? record?.code
  if (typeof exitCode === 'number') return exitCode

  // Pi wraps nonzero exits as text content: "Command exited with code N".
  // Parse only from the trailing line to avoid false matches in command output.
  if (isError) {
    const text = bashResultText(result)
    const lastLine = text.trimEnd().split('\n').pop() ?? ''
    const match = /exited with code (\d+)$/.exec(lastLine)
    if (match) return Number(match[1])
  }

  return isError ? 1 : 0
}

export function bashOutputDelta(previous: string, next: string): string {
  // If next extends previous, return only the new part.
  if (next.startsWith(previous)) return next.slice(previous.length)

  // Otherwise emit the full snapshot. Pi tail-truncates output, so a shorter
  // next is not a prefix of previous; with repeated content (e.g. 2000 identical
  // lines) next may coincidentally prefix-match previous but is still new output.
  return next
}

export function bashTerminalContent(toolCallId: string): ToolCallContent[] {
  return [{ type: 'terminal', terminalId: toolCallId }] satisfies ToolCallContent[]
}

export function bashTerminalInfoMeta(toolCallId: string, cwd: string) {
  // Zed renders ACP `execute` tools as display-only terminals when paired with
  // terminal content plus terminal metadata. See ACP execute tool schema:
  // https://agentclientprotocol.com/protocol/schema#param-execute
  return { terminal_info: { terminal_id: toolCallId, cwd } }
}

export function bashTerminalOutputMeta(toolCallId: string, data: string) {
  return { terminal_output: { terminal_id: toolCallId, data } }
}

export function bashTerminalExitMeta(toolCallId: string, exitCode: number) {
  return { terminal_exit: { terminal_id: toolCallId, exit_code: exitCode, signal: null } }
}
