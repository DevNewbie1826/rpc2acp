import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCommands } from '../../src/acp/agent.js'

test('mergeCommands: preserves order and de-dupes (first wins)', () => {
  const res = mergeCommands(
    [{ name: 'a', description: 'cmd a' }, { name: 'b', description: 'cmd b' }],
    [{ name: 'b', description: 'cmd b2' }, { name: 'c', description: 'cmd c' }]
  )
  assert.deepEqual(res.map(c => c.name), ['a', 'b', 'c'])
})
