import test from 'node:test'
import assert from 'node:assert/strict'
import { PiAcpAgent } from '../../src/acp/agent.js'
import { FakeAgentSideConnection, FakePiRpcProcess, asAgentConn } from '../helpers/fakes.js'

class FakeSessions {
  readonly closed: string[] = []
  readonly cancelled: string[] = []
  private readonly sessions = new Map<string, any>()

  add(id: string, session: any) {
    this.sessions.set(id, session)
  }

  maybeGet(id: string) {
    return this.sessions.get(id)
  }

  close(id: string) {
    if (!this.sessions.has(id)) return
    this.closed.push(id)
    this.sessions.delete(id)
  }

  touch(_id: string) {}
}

test('PiAcpAgent: closeSession cancels in-flight work and releases the session', async () => {
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  const proc = new FakePiRpcProcess() as any
  const fake = new FakeSessions()
  fake.add('s1', {
    sessionId: 's1',
    proc,
    cancel: async () => {
      fake.cancelled.push('s1')
    }
  })
  ;(agent as any).sessions = fake

  const result = await agent.closeSession({ sessionId: 's1', _meta: null } as any)

  assert.deepEqual(result, {})
  assert.ok(fake.cancelled.includes('s1'), 'should cancel in-flight work')
  assert.ok(fake.closed.includes('s1'), 'should close the session')
})

test('PiAcpAgent: closeSession on unknown session is a no-op', async () => {
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  const fake = new FakeSessions()
  ;(agent as any).sessions = fake

  const result = await agent.closeSession({ sessionId: 'nonexistent', _meta: null } as any)
  assert.deepEqual(result, {})
  assert.equal(fake.closed.length, 0)
})

test('PiAcpAgent: initialize advertises session close capability', async () => {
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  const res = await agent.initialize({
    protocolVersion: 1,
    clientCapabilities: {}
  } as any)

  assert.ok(res.agentCapabilities?.sessionCapabilities?.close, 'should advertise close capability')
  assert.ok(res.agentCapabilities?.sessionCapabilities?.list, 'should still advertise list capability')
})
