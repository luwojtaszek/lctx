# Project Context

## Purpose
lctx (Local Context) is a local context aggregator for AI coding agents. It enables AI agents to query local repositories, documentation, and files without sending data to external services.

Key goals:
- Query local repositories and documentation sources
- Support multiple AI agents (Claude Code, Cursor, Gemini CLI, OpenCode)
- Easy source management via CLI
- MCP as primary distribution method + standalone CLI

## Tech Stack
- **Runtime**: Bun (fast, native TS, spawn, arg parsing, all-in-one)
- **Monorepo**: Turborepo (caching, parallel builds)
- **MCP SDK**: @modelcontextprotocol/sdk (official SDK)
- **Schema validation**: Zod (required by MCP SDK)
- **Language**: TypeScript

## Project Conventions

### Code Style
- Use Bun native APIs exclusively:
  - `Bun.spawn()` for subprocess execution (not execa, simple-git)
  - `util.parseArgs()` for CLI argument parsing (not Commander.js)
  - `Bun.file()` / `Bun.write()` for file operations
- Built-in TypeScript support, no separate compilation step
- Discriminated union types for source variants (GitRepositorySource | DocsSource | FileSource | DirectorySource)

### Architecture Patterns
- **Monorepo structure**: packages/core, packages/cli, packages/mcp-server
- **Core Engine modules**:
  - Source Manager: clone, pull, sparse checkout, symlink operations
  - Subagent Runner: isolated temp directory creation, config writing, agent spawning
  - Config Manager: load/save sources and agent configurations
- **Subagent isolation**: Empty MCP configs in temp directories prevent circular MCP loops
- **Command templates**: JSON config for agent commands with {prompt_file} placeholder

### Testing Strategy
- Use Bun's built-in test runner (`bun test`)
- Tests colocated with source files or in `__tests__` directories

### Git Workflow
- Feature branches merged to main via pull request
- Branch naming: `feature/`, `fix/`, `refactor/` prefixes
- Conventional Commits format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## Domain Context
- **Sources**: Git repositories, documentation URLs (llms.txt), local files/directories
- **Agents**: AI coding assistants with CLI interfaces (claude, gemini, opencode)
- **MCP**: Model Context Protocol for tool integration with Claude Desktop, Cursor, VS Code
- **Subagents**: Headless AI agent instances spawned in isolated temp directories

## Important Constraints
- Subagents MUST run with empty MCP configs to prevent circular loops
- Sources are accessed via symlinks in temp directories, not copies
- Shallow clones (--depth 1) for git repositories to save space
- Config stored at ~/.config/lctx/config.json

## External Dependencies
- Git CLI (for clone/pull operations)
- AI agent CLIs (claude, gemini, opencode) for subagent execution
- MCP-compatible hosts (Claude Desktop, Cursor, VS Code) for MCP server mode
