# rpc2acp

Fork of [pi-acp](https://github.com/svkozak/pi-acp) — an [ACP (Agent Client Protocol)](https://agentclientprotocol.com/overview/introduction) adapter for the [`pi`](https://github.com/earendil-works/pi) coding agent.

## What this fork changes

Upstream pi-acp keeps only **one live pi subprocess per ACP connection**: creating or loading a session kills every other session's subprocess (`closeAllExcept`). This fork removes that restriction.

### Multi-session support

- **Concurrent sessions** — `session/new` and `session/load` no longer kill other sessions. Each ACP session owns a dedicated `pi --mode rpc` subprocess; all of them stay alive and process prompts in parallel.
- **`session/close`** — new ACP method (advertised via `sessionCapabilities.close`). Cancels in-flight work, then terminates the session's pi subprocess.
- **Idle TTL** — sessions with no activity past a TTL (default 30 min, `PI_ACP_IDLE_TTL_MS` env) are automatically closed. Persisted session files are untouched; the next `prompt` or `load` transparently re-spawns the subprocess.

Everything else is identical to upstream: ACP JSON-RPC over stdio on the front, `pi --mode rpc` NDJSON on the back.

## Prerequisites

- Node.js 22+
- `pi` installed and on your `PATH` (`npm install -g @earendil-works/pi-coding-agent`)

## Install

```bash
npm install
npm run build
```

Point your ACP client (e.g. Zed) at the built binary:

```json
  "agent_servers": {
    "pi": {
      "type": "custom",
      "command": "node",
      "args": ["/path/to/rpc2acp/dist/index.js"],
      "env": {}
    }
  }
```

## Environment variables

- `PI_ACP_ENABLE_EMBEDDED_CONTEXT=true` — advertise ACP `embeddedContext` prompt capability
- `PI_ACP_IDLE_TTL_MS` — idle-session TTL in milliseconds (default: `1800000`, 30 min)

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
