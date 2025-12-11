## Context
Phase 4 of lctx implementation adds the MCP server, enabling AI tools (Claude Desktop, Cursor, VS Code) to query local sources through the Model Context Protocol. The core engine already provides all necessary primitives via `createCoreModule()`.

## Goals / Non-Goals
- Goals:
  - Implement stdio-based MCP server using official SDK
  - Expose `list_sources` and `ask_sources` tools
  - Add `lctx mcp` CLI command
  - Follow existing codebase patterns (Bun-first, TypeScript, Zod validation)

- Non-Goals:
  - HTTP/WebSocket transports (stdio only for MVP)
  - MCP resources or prompts (tools only)
  - Session management (stateless stdio)

## Decisions

### Decision: Use McpServer high-level API
The `@modelcontextprotocol/sdk` provides both low-level `Server` and high-level `McpServer` APIs. Using `McpServer` with `registerTool()` simplifies tool registration with Zod schema validation.

**Alternatives considered:**
- Low-level `Server` with manual `setRequestHandler()` - more boilerplate, no Zod integration
- **Chosen:** High-level `McpServer.registerTool()` - cleaner API, automatic schema validation

### Decision: Flat tool structure
Tools will be in `packages/mcp-server/src/tools/` with one file per tool and a barrel export.

**Alternatives considered:**
- Single tools.ts file - harder to maintain as tools grow
- **Chosen:** Separate files - matches CLI command pattern in existing codebase

### Decision: Reuse createCoreModule
The MCP server will use `createCoreModule()` from `@lctx/core` to get access to `sourcesManager` and `subagentRunner`, avoiding code duplication.

### Decision: Return structured content
Tools will return both `content` (text for display) and `structuredContent` (typed data) following MCP best practices.

## Architecture

```
packages/mcp-server/
├── src/
│   ├── index.ts         # Public exports + startServer()
│   ├── server.ts        # McpServer setup with stdio transport
│   └── tools/
│       ├── index.ts     # Tool registration barrel
│       ├── list-sources.ts
│       └── ask.ts
└── package.json
```

**Data flow:**
```
MCP Client (Claude Desktop)
    → spawns `lctx mcp`
    → stdio transport
    → McpServer
    → calls list_sources/ask_sources
    → uses SourcesManager/SubagentRunner from @lctx/core
    → returns result via stdio
```

## Risks / Trade-offs

- **Risk:** Subagent execution can be slow
  - Mitigation: Document that `ask_sources` spawns a separate AI agent; users should expect latency

- **Risk:** Error handling across process boundaries
  - Mitigation: Catch errors in tool handlers, return structured error messages

## Open Questions
- None - the design follows the existing research document closely
