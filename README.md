# rpc2acp

Fork of [pi-acp](https://github.com/svkozak/pi-acp) — an [ACP (Agent Client Protocol)](https://agentclientprotocol.com/overview/introduction) adapter for pi-mono coding agents.

Supports [pi](https://github.com/earendil-works/pi), [omp](https://github.com/can1357/oh-my-pi), [senpi](https://github.com/code-yeongyu/senpi), and other pi-mono forks.

## What this fork changes

Upstream pi-acp keeps only **one live pi subprocess per ACP connection**: creating or loading a session kills every other session's subprocess (`closeAllExcept`). This fork removes that restriction.

### Multi-session support

- **Concurrent sessions** — `session/new` and `session/load` no longer kill other sessions. Each ACP session owns a dedicated `pi --mode rpc` subprocess; all of them stay alive and process prompts in parallel.
- **`session/close`** — new ACP method (advertised via `sessionCapabilities.close`). Cancels in-flight work, then terminates the session's pi subprocess.
- **Idle TTL** — sessions with no activity past a TTL (default 30 min, `PI_ACP_IDLE_TTL_MS` env) are automatically closed. Persisted session files are untouched; the next `prompt` or `load` transparently re-spawns the subprocess.

### Agent variant system

Works with any pi-mono fork, not just pi. Each fork uses the same `~/.<configDir>/agent/` layout with a different dot-dir name. Presets for pi, omp, senpi; custom forks via individual overrides.

## Prerequisites

- Node.js 22+
- A pi-mono agent installed and on your `PATH` (see variant table below)

## Install

```bash
npm install -g rpc2acp
```

Or use `npx -y rpc2acp` for zero-install.

## Usage

### pi (default)

```bash
npx -y rpc2acp
```

Requires: `npm install -g @earendil-works/pi-coding-agent`

### senpi

```bash
npx -y rpc2acp --variant senpi
```

Requires: `npm install -g @code-yeongyu/senpi`

### omp

```bash
npx -y rpc2acp --variant omp
```

Requires: `npm install -g @oh-my-pi/pi-coding-agent` (or `brew install can1357/tap/omp`)

### Custom fork

```bash
npx -y rpc2acp \
  --agent-command my-agent \
  --agent-config-dir .my-agent \
  --agent-npm-package @my-org/my-agent
```

### Zed settings

Register multiple agents, each with its own variant:

```json
"agent_servers": {
  "pi": {
    "type": "custom",
    "command": "npx",
    "args": ["-y", "rpc2acp"]
  },
  "senpi": {
    "type": "custom",
    "command": "npx",
    "args": ["-y", "rpc2acp", "--variant", "senpi"]
  },
  "omp": {
    "type": "custom",
    "command": "npx",
    "args": ["-y", "rpc2acp", "--variant", "omp"]
  }
}
```

Each spawns a separate rpc2acp process. pi reads `~/.pi/agent/`, senpi reads `~/.senpi/agent/`, omp reads `~/.omp/agent/`.

## CLI arguments

| Flag | Description | Example |
|---|---|---|
| `--variant <name>` | Select preset (pi, omp, senpi) | `--variant omp` |
| `--agent-command <cmd>` | Override executable | `--agent-command /usr/local/bin/pi-beta` |
| `--agent-config-dir <dir>` | Override dot-dir name | `--agent-config-dir .my-agent` |
| `--agent-npm-package <pkg>` | Override npm package for version checks | `--agent-npm-package @my-org/agent` |
| `--terminal-login` | Launch agent in terminal for auth setup | (used by ACP clients) |

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PI_ACP_VARIANT` | Preset name (pi, omp, senpi) | `pi` |
| `PI_ACP_AGENT_COMMAND` | Override executable | preset default |
| `PI_ACP_AGENT_CONFIG_DIR` | Override dot-dir name | preset default |
| `PI_ACP_AGENT_NPM_PACKAGE` | Override npm package | preset default |
| `PI_ACP_PI_COMMAND` | Legacy: override executable (backward compat) | — |
| `PI_ACP_ENABLE_EMBEDDED_CONTEXT` | Advertise ACP embeddedContext | `false` |
| `PI_ACP_IDLE_TTL_MS` | Idle-session TTL in milliseconds | `1800000` (30 min) |

### Priority

CLI args > `PI_ACP_AGENT_*` env > `PI_ACP_VARIANT` env > `PI_ACP_PI_COMMAND` (legacy) > default (pi)

## Development

```bash
npm install
npm run dev        # run from src via tsx
npm run build
npm run lint
npm test
```

## License

MIT (see [LICENSE](LICENSE)). Original work by [Sergii Kozak](https://github.com/svkozak).
