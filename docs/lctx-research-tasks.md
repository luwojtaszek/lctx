# lctx Implementation Task Breakdown

Based on analysis of `/docs/lctx-research.md` and current codebase state.

## Current State
- Design document is complete and mature
- Only `index.ts` with "Hello via Bun!" exists
- No packages/, no dependencies, no monorepo setup

## Implementation Tasks (Ordered by Dependencies)

### Phase 1: Project Foundation

#### Task 1: Monorepo Structure Setup
**Dependencies:** None
**Files to create:**
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/cli/package.json`
- `packages/cli/tsconfig.json`
- `packages/mcp-server/package.json`
- `packages/mcp-server/tsconfig.json`
- `turbo.json`
- Update root `package.json` with workspaces

**Deliverable:** Empty monorepo structure with build scripts

---

#### Task 2: Core Types
**Dependencies:** Task 1
**Files to create:**
- `packages/core/src/types/source.ts` - Source types (GitRepositorySource, DocsSource, FileSource, DirectorySource)
- `packages/core/src/types/config.ts` - LctxConfig, AgentConfig types
- `packages/core/src/types/index.ts` - Re-exports

**Deliverable:** All TypeScript interfaces from research doc §3.2 and §6

---

### Phase 2: Core Engine

#### Task 3: Config Manager
**Dependencies:** Task 2
**Files to create:**
- `packages/core/src/config/config-manager.ts`
- `packages/core/src/config/index.ts`

**Functionality:**
- `ConfigManager.load()` - Load config from `~/.config/lctx/config.json`
- `ConfigManager.save()` - Save config to disk
- Default config creation if missing

**Deliverable:** Working config load/save with defaults

---

#### Task 4: Source Manager - Git Operations
**Dependencies:** Task 2, Task 3
**Files to create:**
- `packages/core/src/source-manager/source-manager.ts`
- `packages/core/src/source-manager/index.ts`

**Functionality:**
- `addSource()` - Clone git repo (shallow, --depth 1)
- `removeSource()` - Delete source directory
- `updateSource()` - Git pull
- `updateAll()` - Update all sources
- `listSources()` - List configured sources

**Deliverable:** Git repository management (type: 'git' only)

---

#### Task 5: Source Manager - Local Sources
**Dependencies:** Task 4
**Files to create:**
- Extend `packages/core/src/source-manager/source-manager.ts`

**Functionality:**
- Support for `type: 'file'` - symlink single file
- Support for `type: 'directory'` - symlink directory

**Deliverable:** Local file/directory source support

---

#### Task 6: Subagent Runner
**Dependencies:** Task 2, Task 3
**Files to create:**
- `packages/core/src/subagent-runner/subagent-runner.ts`
- `packages/core/src/subagent-runner/index.ts`

**Functionality:**
- Create isolated temp directory `/tmp/lctx-{uuid}/`
- Write empty MCP configs (`.mcp.json`, `.gemini/settings.json`, etc.)
- Create symlinks to requested sources
- Write `prompt.md` with question and source listing
- `ask()` - Spawn agent with `ask` command template, capture output
- `chat()` - Spawn agent with `chat` command template (interactive)
- Cleanup temp directory after completion

**Deliverable:** Isolated subagent execution environment

---

#### Task 7: Core Package Exports
**Dependencies:** Tasks 3-6
**Files to create:**
- `packages/core/src/index.ts` - Public API exports

**Deliverable:** Clean public API: `{ ConfigManager, SourceManager, SubagentRunner, types }`

---

### Phase 3: CLI

#### Task 8: CLI Foundation
**Dependencies:** Task 7
**Files to create:**
- `packages/cli/src/index.ts` - Entry point with parseArgs
- `packages/cli/src/commands/index.ts`

**Functionality:**
- Command routing
- Help output
- Error handling

**Deliverable:** CLI skeleton that routes to command handlers

---

#### Task 9: CLI - Source Commands
**Dependencies:** Task 8
**Files to create:**
- `packages/cli/src/commands/add.ts`
- `packages/cli/src/commands/remove.ts`
- `packages/cli/src/commands/update.ts`
- `packages/cli/src/commands/list.ts`

**Functionality:**
- `lctx add <name> <url> [-b branch]`
- `lctx remove <name>`
- `lctx update [name]`
- `lctx list`

**Deliverable:** Working source management CLI

---

#### Task 10: CLI - Agent Commands
**Dependencies:** Task 8, Task 6
**Files to create:**
- `packages/cli/src/commands/ask.ts`
- `packages/cli/src/commands/chat.ts`

**Functionality:**
- `lctx ask -s <sources...> -q <question> [-a agent]`
- `lctx chat -s <sources...> [-a agent]`

**Deliverable:** Working ask/chat commands that spawn subagents

---

### Phase 4: MCP Server

#### Task 11: MCP Server Foundation
**Dependencies:** Task 7
**Files to create:**
- `packages/mcp-server/src/index.ts`

**Add dependencies:**
- `@modelcontextprotocol/sdk`
- `zod`

**Functionality:**
- McpServer setup with stdio transport
- Server metadata (name, version)

**Deliverable:** MCP server that starts and connects via stdio

---

#### Task 12: MCP Tools
**Dependencies:** Task 11
**Files to create:**
- `packages/mcp-server/src/tools/list-sources.ts`
- `packages/mcp-server/src/tools/ask.ts`

**Functionality:**
- `list_sources` tool - Returns configured sources
- `ask_sources` tool - Spawns subagent, returns answer

**Deliverable:** Working MCP tools for AI integration

---

#### Task 13: CLI - MCP Command
**Dependencies:** Task 12
**Files to create:**
- `packages/cli/src/commands/mcp.ts`

**Functionality:**
- `lctx mcp` - Start MCP server (stdio transport)

**Deliverable:** CLI can start MCP server

---

### Phase 5: Polish

#### Task 14: Binary Entry Point
**Dependencies:** Tasks 8-13
**Files to modify:**
- Root `package.json` - Add `bin` field
- Build configuration for executable

**Deliverable:** `lctx` command available after `bun link`

---

#### Task 15: Documentation
**Dependencies:** Task 14
**Files to create:**
- `README.md` - Usage documentation
- Example config files

**Deliverable:** User-facing documentation

---

## Future Tasks (Not MVP)

These are documented in research but deferred:

- **Task F1:** DocsSource type (`type: 'docs'`) - llms.txt / web scraping
- **Task F2:** Caching layer
- **Task F3:** Sparse checkout for large repos
- **Task F4:** Custom source type plugins

---

## Dependency Graph

```
Task 1 (Monorepo)
    │
    ▼
Task 2 (Types)
    │
    ├─────────────────────────┐
    ▼                         ▼
Task 3 (Config)           Task 6 (Subagent Runner)
    │                         │
    ▼                         │
Task 4 (Source Mgr - Git)     │
    │                         │
    ▼                         │
Task 5 (Source Mgr - Local)   │
    │                         │
    └─────────┬───────────────┘
              ▼
        Task 7 (Core Exports)
              │
              ├─────────────────────┐
              ▼                     ▼
        Task 8 (CLI Foundation)   Task 11 (MCP Foundation)
              │                     │
    ┌─────────┴─────────┐           ▼
    ▼                   ▼     Task 12 (MCP Tools)
Task 9 (Source Cmds)  Task 10 (Agent Cmds)
    │                   │           │
    └─────────┬─────────┴───────────┘
              ▼
        Task 13 (CLI MCP Cmd)
              │
              ▼
        Task 14 (Binary)
              │
              ▼
        Task 15 (Docs)
```

## Notes

1. Each task is independently testable
2. Tasks 4 and 6 can be developed in parallel after Task 2
3. CLI and MCP tracks can proceed in parallel after Task 7
4. All tasks use Bun native APIs per project guidelines
