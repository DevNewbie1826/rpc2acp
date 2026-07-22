import test from 'node:test'
import assert from 'node:assert/strict'
import { PiAcpAgent } from '../../src/acp/agent.js'
import { FakeAgentSideConnection, FakePiRpcProcess, asAgentConn } from '../helpers/fakes.js'

class FakeSessions {
  constructor(private readonly session: any) {}
  maybeGet(_id: string) {
    return this.session
  }
  get(_id: string) {
    return this.session
  }
  touch(_id: string) {}
}

test('PiAcpAgent: setSessionMode maps to pi setThinkingLevel + emits current_mode_update', async () => {
  const conn = new FakeAgentSideConnection()
  const proc = new FakePiRpcProcess()
  const thinkingLevels: string[] = []
  ;(proc as any).setThinkingLevel = async (level: string) => {
    thinkingLevels.push(level)
  }
  ;(proc as any).getState = async () => ({ thinkingLevel: 'medium' })
  ;(proc as any).getAvailableModels = async () => ({ models: [{ provider: 'test', id: 'm', name: 'm' }] })

  const agent = new PiAcpAgent(asAgentConn(conn))
  ;(agent as any).sessions = new FakeSessions({ sessionId: 's1', proc }) as any

  await agent.setSessionMode({ sessionId: 's1', modeId: 'high', _meta: null } as any)

  assert.deepEqual(thinkingLevels, ['high'])

  const modeUpdates = conn.updates.filter(
    (u: any) => u.update?.sessionUpdate === 'current_mode_update'
  )
  assert.ok(modeUpdates.length > 0, 'should emit current_mode_update')
  assert.equal((modeUpdates[0] as any).update.currentModeId, 'high')
})

test('PiAcpAgent: setSessionMode rejects unknown modeId', async () => {
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  await assert.rejects(
    () => agent.setSessionMode({ sessionId: 's1', modeId: 'invalid' } as any),
    /invalid params|Unknown modeId/i
  )
})
