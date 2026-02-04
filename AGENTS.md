# lctx

Local context aggregator for AI coding agents. Manages sources (git repos, docs, local files) and spawns isolated subagents to query them via CLI or MCP.

## Quick Reference

- Verify changes: `./scripts/agent_checks.sh` (run after every implementation)

## Technology Guidelines

Read these as needed:

- **docs_agent/bun.md** — Read when running commands, writing tests, or using runtime APIs (file I/O, HTTP, WebSocket, database). Covers Bun-specific APIs and replacements for Node.js patterns.
- **docs_agent/ts-project-structure.md** — Read when creating files, adding modules, or modifying package structure. Covers monorepo layout (apps/, packages/), dependency flow, and barrel exports.
