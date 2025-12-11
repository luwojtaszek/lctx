## 1. MCP Server Package Setup
- [x] 1.1 Add `@modelcontextprotocol/sdk` and `zod` dependencies to `packages/mcp-server/package.json`
- [x] 1.2 Run `bun install` to install dependencies

## 2. MCP Server Implementation
- [x] 2.1 Create `packages/mcp-server/src/server.ts` with McpServer initialization and stdio transport
- [x] 2.2 Create `packages/mcp-server/src/tools/list-sources.ts` implementing the list_sources tool
- [x] 2.3 Create `packages/mcp-server/src/tools/ask.ts` implementing the ask_sources tool
- [x] 2.4 Create `packages/mcp-server/src/tools/index.ts` to export tool registration functions
- [x] 2.5 Update `packages/mcp-server/src/index.ts` to export public API and startServer function

## 3. CLI Integration
- [x] 3.1 Create `apps/cli/src/commands/mcp.ts` implementing the mcp command
- [x] 3.2 Update `apps/cli/src/index.ts` to add mcp command routing

## 4. Testing
- [x] 4.1 Create unit tests for list_sources tool
- [x] 4.2 Create unit tests for ask_sources tool

## 5. Validation
- [x] 5.1 Verify `lctx mcp` starts successfully
