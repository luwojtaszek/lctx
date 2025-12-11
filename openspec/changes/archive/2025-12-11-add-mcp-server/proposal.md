# Change: Add MCP Server Package

## Why
lctx needs an MCP server to enable integration with AI tools like Claude Desktop, Cursor, and VS Code. This is the primary distribution method per the research document, allowing AI agents to query local sources through the standardized Model Context Protocol.

## What Changes
- Implement MCP server in `packages/mcp-server` using `@modelcontextprotocol/sdk`
- Add `list_sources` tool - returns configured sources
- Add `ask_sources` tool - spawns subagent to query sources
- Add `lctx mcp` CLI command to start the MCP server

## Impact
- Affected specs: `mcp-server` (new), `cli` (modified)
- Affected code:
  - `packages/mcp-server/src/index.ts`
  - `packages/mcp-server/src/tools/list-sources.ts`
  - `packages/mcp-server/src/tools/ask.ts`
  - `packages/mcp-server/package.json`
  - `apps/cli/src/index.ts`
  - `apps/cli/src/commands/mcp.ts`
