# DirX — Unified Gateway & CLI for Agents

[![npm version](https://img.shields.io/npm/v/@dirxai/cli.svg)](https://www.npmjs.com/package/@dirxai/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

DirX gives AI agents a unified, file-system-like interface to discover and interact with internet APIs — with built-in governance, access control, and auditing.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@dirxai/cli`](./packages/cli) | CLI for agents and developers | [![npm](https://img.shields.io/npm/v/@dirxai/cli.svg)](https://www.npmjs.com/package/@dirxai/cli) |
| [`@dirxai/core`](./packages/core) | Server-side SDK — Guard, JWKS, AgentContext | [![npm](https://img.shields.io/npm/v/@dirxai/core.svg)](https://www.npmjs.com/package/@dirxai/core) |

## Install

```bash
# CLI (global)
npm install -g @dirxai/cli

# Server-side SDK
npm install @dirxai/core
```

## Quick Start

```bash
# Authenticate with the gateway
dirx auth

# Browse the API directory
dirx ls /
dirx ls /net/

# Read service descriptions
dirx cat /net/api.github.com/DIR.md

# Search across services
dirx grep "weather" /net/

# Write data
dirx write /net/api.example.com/data -d '{"key": "value"}'

# Manage API keys (BYOK)
dirx keys set api.github.com --token ghp_xxxx --sync
```

## Server-side SDK

```typescript
import { createGuard } from "@dirxai/core";

const guard = createGuard({
    jwksUrl: "https://api.dirx.ai/.well-known/jwks.json",
});

// Express middleware
app.use(guard.express());

// Or manual verification
const ctx = await guard.authenticate(bearerToken);
console.log(ctx.sub, ctx.roles, ctx.orgId);
```

### Testing helpers

```typescript
import { createMockAgent } from "@dirxai/core/testing";

const agent = createMockAgent({ roles: ["agent"], orgId: "org-1" });
expect(agent.isAgent()).toBe(true);
```

## CLI Commands

### Agent Commands

| Command | Description |
|---------|-------------|
| `dirx ls <path>` | List directory contents |
| `dirx cat <path>` | Read file contents |
| `dirx write <path>` | Write data |
| `dirx edit <path>` | Partial update |
| `dirx rm <path>` | Remove a resource |
| `dirx grep <pattern> <path>` | Search across services |
| `dirx bash <pipeline>` | Execute multi-step pipeline |

### Developer Tools

| Command | Description |
|---------|-------------|
| `dirx init [dir]` | Initialize DirX in a project |
| `dirx generate [dir]` | Scan and detect route definitions |
| `dirx generate --register` | Scan and auto-register with the gateway |
| `dirx claim <domain>` | Claim domain via DNS verification |
| `dirx register` | Register DIR.md with the gateway |

### Configuration

| Command | Description |
|---------|-------------|
| `dirx auth` | Authenticate with the gateway |
| `dirx keys set <domain>` | Set an API key |
| `dirx keys list` | List stored keys |
| `dirx keys remove <domain>` | Remove a key |
| `dirx status` | Show CLI config and auth status |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DIRX_GATEWAY_URL` | Gateway URL | `https://api.dirx.ai` |
| `DIRX_TOKEN` | Agent token | — |
| `DIRX_HOME` | Config directory | `~/.dirx` |

## Development

```bash
git clone https://github.com/dirxai/dirx.git
cd dirx
pnpm install
pnpm -r build
pnpm test
```

## License

MIT
