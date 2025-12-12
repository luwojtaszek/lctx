# Architecture

This document describes the internal structure of lctx. For usage instructions, see the [README](../README.md).

---

## Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              lctx                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐        ┌──────────────────────────────────────────────┐  │
│  │  CLI          │───────▶│                 Core                         │  │
│  │  apps/cli     │        │                 packages/core                │  │
│  │               │        │                                              │  │
│  │  Commands:    │        │  ┌──────────────┐  ┌─────────────────────┐   │  │
│  │  • add        │        │  │   Config     │  │   Source Manager    │   │  │
│  │  • remove     │        │  │   Manager    │  │                     │   │  │
│  │  • update     │        │  │              │  │  ┌───────────────┐  │   │  │
│  │  • list       │        │  │  • load      │  │  │ Git           │  │   │  │
│  │  • ask        │        │  │  • save      │  │  │ Docs          │  │   │  │
│  │  • chat       │        │  │  • validate  │  │  │ File          │  │   │  │
│  │  • mcp ───────┼──┐     │  │              │  │  │ Directory     │  │   │  │
│  └───────────────┘  │     │  └──────────────┘  │  └───────────────┘  │   │  │
│                     │     │                    └─────────────────────┘   │  │
│  ┌───────────────┐  │     │                                              │  │
│  │  MCP Server   │◀─┘     │  ┌────────────────────────────────────────┐  │  │
│  │  packages/    │───────▶│  │           Subagent Runner              │  │  │
│  │  mcp-server   │        │  │                                        │  │  │
│  │               │        │  │  • Create isolated temp directory      │  │  │
│  │  Tools:       │        │  │  • Write empty MCP config              │  │  │
│  │  • list_      │        │  │  • Symlink requested sources           │  │  │
│  │    sources    │        │  │  • Generate prompt file                │  │  │
│  │  • ask_       │        │  │  • Spawn CLI agent subprocess          │  │  │
│  │    sources    │        │  │  • Return answer, cleanup              │  │  │
│  └───────────────┘        │  └────────────────────────────────────────┘  │  │
│                           │                                              │  │
│                           └──────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Agent Command Templates                           │  │
│  │  claude-code: { chat: "claude", ask: "claude -p {prompt_file} ..." }  │  │
│  │  gemini:      { chat: "gemini", ask: "gemini -p {prompt_file}" }      │  │
│  │  cursor:      { chat: "cursor", ask: "cursor -p {prompt_file}" }      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component           | Location                             | Responsibility                                                                                                            |
|---------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **CLI**             | `apps/cli/`                          | Command-line interface. Parses arguments, routes to appropriate handlers.                                                 |
| **Core**            | `packages/core/`                     | Business logic shared by CLI and MCP server.                                                                              |
| **Config Manager**  | `packages/core/src/config-manager/`  | Load/save configuration from `~/.config/lctx/config.json`.                                                                |
| **Source Manager**  | `packages/core/src/source-manager/`  | CRUD operations for sources. Delegates to type-specific managers (git, docs, file, directory).                            |
| **Subagent Runner** | `packages/core/src/subagent-runner/` | Executes AI agents in isolated temp directories. Handles prompt generation, source symlinking, and subprocess management. |
| **MCP Server**      | `packages/mcp-server/`               | MCP protocol implementation. Exposes `list_sources` and `ask_sources` tools via stdio transport.                          |

---

## Dependency Flow

```
┌─────────────┐  starts  ┌─────────────┐
│    CLI      │─────────▶│ MCP Server  │
│  apps/cli   │          │ packages/   │
│             │          │ mcp-server  │
└──────┬──────┘          └──────┬──────┘
       │                        │
       │     ┌─────────────┐    │
       └────▶│    Core     │◀───┘
             │ packages/   │
             │ core        │
             └─────────────┘
```

- **Build-time**: Both CLI and MCP Server depend on Core
- **Runtime**: CLI's `mcp` command starts the MCP Server
- Core has no dependencies on CLI or MCP Server

---

## Directory Structure

```
lctx/
├── apps/
│   └── cli/
│       └── src/
│           ├── commands/           # One file per CLI command
│           │   ├── add.ts
│           │   ├── remove.ts
│           │   ├── update.ts
│           │   ├── list.ts
│           │   ├── ask.ts
│           │   ├── chat.ts
│           │   └── mcp.ts
│           └── index.ts            # Entry point
│
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── config-manager/     # Configuration persistence
│   │       ├── source-manager/     # Source CRUD + type-specific managers
│   │       ├── subagent-runner/    # Isolated agent execution
│   │       ├── shared/
│   │       │   ├── types/          # TypeScript types
│   │       │   ├── schemas/        # Zod validation schemas
│   │       │   └── utils/          # Utilities (path resolver, etc.)
│   │       └── index.ts            # Package exports
│   │
│   └── mcp-server/
│       └── src/
│           ├── tools/              # MCP tool implementations
│           │   ├── list-sources.ts
│           │   └── ask.ts
│           ├── server.ts           # MCP server setup
│           └── index.ts            # Package exports
│
├── package.json                    # Root workspaces + bin
└── turbo.json                      # Build orchestration
```
