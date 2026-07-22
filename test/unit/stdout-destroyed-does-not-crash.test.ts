import test from 'node:test'
import assert from 'node:assert/strict'
import { createStdoutWriter } from '../../src/stdout-writer.js'

test('stdout writer: resolves even if stdout is destroyed', async () => {
  const prevDestroyed = (process.stdout as any).destroyed
  const prevWritable = (process.stdout as any).writable

  try {
    ;(process.stdout as any).destroyed = true
    ;(process.stdout as any).writable = false

    const stream = createStdoutWriter()
    const writer = stream.getWriter()
    await writer.write(new Uint8Array([1, 2, 3]))
    writer.releaseLock()
    assert.ok(true)
  } finally {
    ;(process.stdout as any).destroyed = prevDestroyed
    ;(process.stdout as any).writable = prevWritable
  }
})
