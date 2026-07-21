import test from 'node:test'
import assert from 'node:assert/strict'
import { SessionManager } from '../../src/acp/session.js'
import { FakeAgentSideConnection, FakePiRpcProcess, asAgentConn } from '../helpers/fakes.js'

test('SessionManager: holds multiple sessions concurrently', () => {
  const mgr = new SessionManager()

  // Register via getOrCreate (mimics restoreSession path).
  const conn = new FakeAgentSideConnection()
  const proc1 = new FakePiRpcProcess()
  const proc2 = new FakePiRpcProcess()

  const r1 = mgr.getOrCreate('s1', {
    cwd: process.cwd(),
    mcpServers: [],
    conn: asAgentConn(conn),
    proc: proc1 as any
  })
  const r2 = mgr.getOrCreate('s2', {
    cwd: process.cwd(),
    mcpServers: [],
    conn: asAgentConn(conn),
    proc: proc2 as any
  })

  assert.equal(mgr.size, 2)
  assert.equal(mgr.maybeGet('s1'), r1)
  assert.equal(mgr.maybeGet('s2'), r2)
})

test('SessionManager: close removes only the targeted session', () => {
  const mgr = new SessionManager()
  const conn = new FakeAgentSideConnection()
  const proc1 = new FakePiRpcProcess()
  const proc2 = new FakePiRpcProcess()

  mgr.getOrCreate('s1', { cwd: process.cwd(), mcpServers: [], conn: asAgentConn(conn), proc: proc1 as any })
  mgr.getOrCreate('s2', { cwd: process.cwd(), mcpServers: [], conn: asAgentConn(conn), proc: proc2 as any })

  mgr.close('s1')

  assert.equal(mgr.size, 1)
  assert.equal(mgr.maybeGet('s1'), undefined)
  assert.ok(mgr.maybeGet('s2'))
})

test('SessionManager: idle TTL closes stale sessions', async () => {
  // 50ms TTL, sweep every 10ms.
  const mgr = new SessionManager(50)
  mgr.startIdleSweeper(10)

  const conn = new FakeAgentSideConnection()
  const proc = new FakePiRpcProcess()
  mgr.getOrCreate('s1', { cwd: process.cwd(), mcpServers: [], conn: asAgentConn(conn), proc: proc as any })

  assert.equal(mgr.size, 1)

  // Wait past TTL + sweep interval.
  await new Promise(r => setTimeout(r, 120))

  assert.equal(mgr.size, 0, 'idle session should have been swept')
  mgr.disposeAll()
})

test('SessionManager: touch resets idle timer', async () => {
  const mgr = new SessionManager(80)
  mgr.startIdleSweeper(10)

  const conn = new FakeAgentSideConnection()
  const proc = new FakePiRpcProcess()
  mgr.getOrCreate('s1', { cwd: process.cwd(), mcpServers: [], conn: asAgentConn(conn), proc: proc as any })

  // Keep touching every 30ms for ~150ms; session should survive despite 80ms TTL.
  const start = Date.now()
  while (Date.now() - start < 150) {
    mgr.touch('s1')
    await new Promise(r => setTimeout(r, 30))
  }

  assert.equal(mgr.size, 1, 'active session should not be swept')
  mgr.disposeAll()
})
