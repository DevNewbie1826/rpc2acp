import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveVariant, getAgentDir, getAdapterDir, getUserPromptsDir, getProjectPromptsDir, getProjectSkillsDir, getGlobalSettingsPath, getProjectSettingsPath } from '../../src/acp/agent-variant.js'
import { join, resolve } from 'node:path'

test('resolveVariant: defaults to pi', () => {
  const v = resolveVariant()
  assert.equal(v.name, 'pi')
  assert.equal(v.configDir, '.pi')
  assert.equal(v.command, 'pi')
  assert.equal(v.npmPackage, '@earendil-works/pi-coding-agent')
})

test('resolveVariant: PI_ACP_VARIANT selects preset', () => {
  const prev = process.env.PI_ACP_VARIANT
  try {
    process.env.PI_ACP_VARIANT = 'omp'
    const v = resolveVariant()
    assert.equal(v.name, 'omp')
    assert.equal(v.configDir, '.omp')
    assert.equal(v.command, 'omp')
    assert.equal(v.npmPackage, '@oh-my-pi/pi-coding-agent')
  } finally {
    if (prev === undefined) delete process.env.PI_ACP_VARIANT
    else process.env.PI_ACP_VARIANT = prev
  }
})

test('resolveVariant: PI_ACP_VARIANT=senpi selects senpi', () => {
  const prev = process.env.PI_ACP_VARIANT
  try {
    process.env.PI_ACP_VARIANT = 'senpi'
    const v = resolveVariant()
    assert.equal(v.name, 'senpi')
    assert.equal(v.configDir, '.senpi')
    assert.equal(v.command, 'senpi')
    assert.equal(v.npmPackage, '@code-yeongyu/senpi')
  } finally {
    if (prev === undefined) delete process.env.PI_ACP_VARIANT
    else process.env.PI_ACP_VARIANT = prev
  }
})

test('resolveVariant: individual env overrides beat preset', () => {
  const prevVariant = process.env.PI_ACP_VARIANT
  const prevCmd = process.env.PI_ACP_AGENT_COMMAND
  try {
    process.env.PI_ACP_VARIANT = 'pi'
    process.env.PI_ACP_AGENT_COMMAND = 'my-custom-pi'
    const v = resolveVariant()
    assert.equal(v.command, 'my-custom-pi')
    // Other fields stay at preset values
    assert.equal(v.configDir, '.pi')
  } finally {
    if (prevVariant === undefined) delete process.env.PI_ACP_VARIANT
    else process.env.PI_ACP_VARIANT = prevVariant
    if (prevCmd === undefined) delete process.env.PI_ACP_AGENT_COMMAND
    else process.env.PI_ACP_AGENT_COMMAND = prevCmd
  }
})

test('resolveVariant: legacy PI_ACP_PI_COMMAND still works', () => {
  const prevCmd = process.env.PI_ACP_PI_COMMAND
  try {
    process.env.PI_ACP_PI_COMMAND = '/usr/local/bin/pi-beta'
    const v = resolveVariant()
    assert.equal(v.command, '/usr/local/bin/pi-beta')
  } finally {
    if (prevCmd === undefined) delete process.env.PI_ACP_PI_COMMAND
    else process.env.PI_ACP_PI_COMMAND = prevCmd
  }
})

test('resolveVariant: PI_ACP_AGENT_CONFIG_DIR overrides configDir', () => {
  const prev = process.env.PI_ACP_AGENT_CONFIG_DIR
  try {
    process.env.PI_ACP_AGENT_CONFIG_DIR = '.custom'
    const v = resolveVariant()
    assert.equal(v.configDir, '.custom')
  } finally {
    if (prev === undefined) delete process.env.PI_ACP_AGENT_CONFIG_DIR
    else process.env.PI_ACP_AGENT_CONFIG_DIR = prev
  }
})

test('getAgentDir: returns variant-based path', () => {
  const pi = resolveVariant()
  const dir = getAgentDir(pi)
  assert.ok(dir.endsWith(join('.pi', 'agent')), `expected .pi/agent suffix, got ${dir}`)
})

test('getAgentDir: respects PI_CODING_AGENT_DIR for pi', () => {
  const prev = process.env.PI_CODING_AGENT_DIR
  try {
    process.env.PI_CODING_AGENT_DIR = '/tmp/custom-agent'
    const pi = resolveVariant()
    assert.equal(getAgentDir(pi), '/tmp/custom-agent')
  } finally {
    if (prev === undefined) delete process.env.PI_CODING_AGENT_DIR
    else process.env.PI_CODING_AGENT_DIR = prev
  }
})

test('getAdapterDir: returns variant-based adapter path', () => {
  const pi = resolveVariant()
  const dir = getAdapterDir(pi)
  assert.ok(dir.endsWith(join('.pi', 'rpc2acp')), `expected .pi/rpc2acp suffix, got ${dir}`)
})

test('path helpers: project paths use variant configDir', () => {
  const pi = resolveVariant()
  const cwd = '/tmp/myproject'

  assert.equal(getProjectPromptsDir(pi, cwd), resolve(cwd, '.pi', 'prompts'))
  assert.equal(getProjectSkillsDir(pi, cwd), resolve(cwd, '.pi', 'skills'))
  assert.equal(getProjectSettingsPath(pi, cwd), resolve(cwd, '.pi', 'settings.json'))
})

test('path helpers: global paths use agentDir', () => {
  const pi = resolveVariant()
  const agentDir = getAgentDir(pi)

  assert.equal(getUserPromptsDir(pi), join(agentDir, 'prompts'))
  assert.equal(getGlobalSettingsPath(pi), join(agentDir, 'settings.json'))
})
