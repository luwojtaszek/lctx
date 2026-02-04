<p align="center">
  <img src="docs/assets/logo.svg" alt="lctx logo" width="70" />
</p>

<p align="center">
  <strong>Local context aggregator for AI coding agents.</strong><br>
  Your repos, your docs, your machine.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://bun.sh"><img alt="Built with Bun" src="https://img.shields.io/badge/Built%20with-Bun-f9f1e1?style=flat-square&logo=bun" /></a>
</p>

<p align="center">
  <a href="docs/assets/lctx_list_usage.png"><img src="docs/assets/lctx_list_usage.png" width="49%" /></a>
  <a href="docs/assets/claude_code_mcp_usage.png"><img src="docs/assets/claude_code_mcp_usage.png" width="49%" /></a>
</p>

---

## What is lctx?

**lctx** manages local context sources (git repositories, documentation, files) and spawns isolated subagents to query them. It works as a CLI tool or as an MCP server for AI coding assistants like Claude Code, Cursor, and Gemini CLI.

Instead of relying on remote context providers with opaque sources and unpredictable indexing, lctx gives you full control over what your AI agent can access.

## Why lctx?

Tools like Context7 and Exa are excellent for quickly retrieving documentation. However, certain use cases need more control than remote providers offer.

### Gaps in Remote Context Providers

| Issue                  | Problem                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| **Opaque sources**     | You don't know which exact document or version a response came from                      |
| **No version pinning** | Remote providers serve their latest indexed content—no way to request a specific version |
| **No private access**  | Internal libraries, private packages, and proprietary docs are unreachable               |

### The lctx Approach

- **Local sources** — Clone repositories, docs, and notes to your machine. You control exactly what your agent can access.
- **Version pinning** — Specify any tag, branch, or commit.
- **Private repos** — Works with your existing Git credentials.

### Comparison

| Capability           | Context7 / Exa | lctx                  |
|----------------------|----------------|-----------------------|
| Source transparency  | Opaque         | Explicit local paths  |
| Version pinning      | Latest only    | Any tag/branch/commit |
| Private repositories | No access      | Full access           |
| Context refinement   | Raw chunks     | Sub-agent filtering   |

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Agent (Claude Code / Cursor / etc.)                       │
│                          │                                      │
│                          ▼                                      │
│                    lctx MCP Server                              │
│                          │                                      │
│         ┌────────────────┴────────────────┐                     │
│         ▼                                 ▼                     │
│   list_sources                      ask_sources                 │
│   (returns list)                    (spawns subagent)           │
│                                           │                     │
│                                           ▼                     │
│                              ┌─────────────────────┐            │
│                              │ Isolated Temp Dir   │            │
│                              │ /tmp/lctx-{uuid}/   │            │
│                              │ ├── prompt.md       │            │
│                              │ ├── .mcp.json = {}  │ ◄── No MCP │
│                              │ ├── langchain/ ─────┼──► symlink │
│                              │ └── bun-docs/  ─────┼──► symlink │
│                              └─────────────────────┘            │
│                                           │                     │
│                                           ▼                     │
│                              Subagent reads files directly      │
│                              Returns answer to main agent       │
└─────────────────────────────────────────────────────────────────┘
```

**Key design**: Subagents run in isolated temp directories with empty MCP configs to prevent circular loops. Sources are available via symlinks—subagents read files directly.

For internal module structure and component details, see [Architecture](docs/architecture.md).

## Getting Started

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/luwojtaszek/lctx/main/scripts/install.sh | bash
```

This downloads the latest binary to `~/.local/bin`. Make sure this directory is in your PATH.

### Manual Download

Download the latest binary for your platform from [GitHub Releases](https://github.com/luwojtaszek/lctx/releases).

### Install from Source

Prerequisites: [Bun](https://bun.sh) 1.0 or higher

```bash
git clone https://github.com/luwojtaszek/lctx.git
cd lctx
bun install && bun link
```

### Updating

```bash
lctx upgrade
```

Or check for updates without installing:

```bash
lctx upgrade --check
```

### Add to Claude Code (MCP)

```bash
claude mcp add --transport stdio lctx -- bunx lctx mcp
```

This registers lctx as an MCP server. Claude Code will have access to `list_sources` and `ask_sources` tools.

## Usage

```bash
# Launch interactive mode (recommended)
lctx

# Direct commands for scripting
lctx ask -s bun -q "How to resolve version from package.json?"
lctx chat -s langchain bun
lctx sync [name]
lctx mcp
```

From Claude Code, just ask naturally: `How to write an agent in LangGraph? ask lctx`

## Interactive Mode

Running `lctx` without arguments launches an interactive terminal UI with visual menus for managing sources.

### Main Menu

- **Sources** — View, add, edit, and sync sources in a table view
- **Ask** — Select sources and ask questions with responses displayed inline
- **Help** — View usage information

## Command Reference

| Command                               | Mode        | Description                                           |
|---------------------------------------|-------------|-------------------------------------------------------|
| `lctx`                                | Interactive | Launch interactive mode with Sources, Ask, Help       |
| `lctx ask -s <sources> -q <question>` | Direct      | Query sources in headless mode                        |
| `lctx chat -s <sources>`              | Direct      | Start interactive chat session with sources           |
| `lctx sync [name]`                    | Direct      | Sync one source or all sources                        |
| `lctx mcp`                            | Direct      | Start MCP server (stdio transport)                    |
| `lctx help`                           | Direct      | Display help information                              |

> **Note:** Source management (add, remove, list) is now available in interactive mode only. Use `lctx` to access the Sources screen.

## Source Types

| Type        | Description                                      | Example                        |
|-------------|--------------------------------------------------|--------------------------------|
| `git`       | Git repository (cloned locally)                  | `https://github.com/org/repo`  |
| `docs`      | Documentation URL (llms.txt, etc.)               | `https://bun.sh/llms-full.txt` |
| `file`      | Single local file (/path/private-notes.md, etc.) | `/path/to/file.md`             |
| `directory` | Local directory (/path/private project, etc.)    | `/path/to/docs/`               |

## Configuration

lctx stores configuration at `~/.config/lctx/config.json`. See [Configuration Guide](docs/configuration.md) for details on agent templates, command placeholders, and MCP config.

## Supported CLI Agents

lctx requires a CLI agent to be installed on your system. The agent is spawned as a subagent to query your sources.

| Agent           | Status                                         |
|-----------------|------------------------------------------------|
| **Claude Code** | Tested and supported in default configuration  |
| Cursor CLI      | Not tested — configure in `config.json`        |
| OpenAI Codex    | Not tested — configure in `config.json`        |
| Gemini CLI      | Not tested — configure in `config.json`        |
| Droid           | Not tested — configure in `config.json`        |
| OpenCode        | Not tested — configure in `config.json`        |

To use a different agent, add its configuration to the `agents` object in `~/.config/lctx/config.json` and set `defaultAgent` to its name.

## When to Use lctx

- You need documentation for a **specific library version**, not just "latest"
- Your project depends on **private or internal packages**
- You require **deterministic, auditable** context retrieval
- You want to **combine multiple sources** (repos + docs + notes) in a single query
- Data privacy or compliance requirements **prevent using remote context providers**

## License

MIT
