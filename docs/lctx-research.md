# lctx — Local Context for AI Agents (Research Document)

> **Note:** This is a research and design document exploring the architecture and implementation approach for lctx. It is not a finalized specification.

> **lctx** — Local context aggregator for AI coding agents. Your repos, your docs, your machine.

---

## 1. Requirements vs Architecture

| Requirement                                                 | Solution                                                              |
|-------------------------------------------------------------|-----------------------------------------------------------------------|
| Query local repositories                                    | Git clone + symlink to agent workspace                                |
| Multiple agents (Claude Code, Cursor, Gemini CLI, OpenCode) | **Command templates** - simple JSON config for any CLI agent          |
| Easy repository management (CLI)                            | Commands: `add`, `remove`, `update`, `list`                           |
| Query multiple repositories at once                         | Symlinked sources - agent handles context natively                    |
| MCP vs other options                                        | MCP as **primary distribution** + CLI as standalone                   |

---

## 2. Architecture

### Module Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         lctx — Local Context for AI Agents             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐ │
│  │   CLI (Bun)  │────▶│                 Core Engine                  │ │
│  │              │     │                                              │ │
│  │  • add       │     │  ┌─────────────────┐  ┌───────────────────┐  │ │
│  │  • remove    │     │  │  Source Manager │  │  Subagent Runner  │  │ │
│  │  • update    │     │  │                 │  │                   │  │ │
│  │  • list      │     │  │  • clone        │  │  • create temp    │  │ │
│  │  • ask       │     │  │  • pull         │  │  • write configs  │  │ │
│  │  • chat      │     │  │  • sparse       │  │  • symlink sources│  │ │
│  └──────────────┘     │  │  • symlink      │  │  • write prompt   │  │ │
│                       │  └─────────────────┘  │  • spawn agent    │  │ │
│  ┌──────────────┐     │                       └───────────────────┘  │ │
│  │  MCP Server  │────▶│                                              │ │
│  │   (stdio)    │     │  ┌─────────────────┐                         │ │
│  │              │     │  │  Config Manager │                         │ │
│  │  Tools:      │     │  │                 │                         │ │
│  │  • list_     │     │  │  • load/save    │                         │ │
│  │    sources   │     │  │  • sources      │                         │ │
│  │  • ask_      │     │  │  • agents       │                         │ │
│  │    sources   │     │  └─────────────────┘                         │ │
│  └──────────────┘     │                                              │ │
│                       └──────────────────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Agent Command Templates                       │ │
│  │  claude-code: { chat: "claude", ask: "claude -p {prompt_file}" }  │ │
│  │  gemini:      { chat: "gemini", ask: "gemini -p {prompt_file}" }  │ │
│  │  opencode:    { chat: "opencode", ask: "opencode -p {prompt_file}"│ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (ask_sources)

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Agent (Claude Desktop / Cursor / etc.)                    │
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
│                              │ ├── .mcp.json = {}  │ ◄── NO MCP!│
│                              │ ├── langchain/  ────┼──► symlink │
│                              │ └── langgraph/  ────┼──► symlink │
│                              └─────────────────────┘            │
│                                           │                     │
│                                           ▼                     │
│                              Subagent (headless CLI)            │
│                              Reads files directly               │
│                              Returns answer to MCP              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Principle:** Subagents run in isolated temp directories with **empty MCP configs** to prevent circular MCP loops. Sources are available via symlinks - subagents read files directly.

---

## 3. Detailed Module Design

### 3.1 Project Structure

```
lctx/
├── packages/
│   ├── core/                    # Main logic
│   │   ├── src/
│   │   │   ├── source-manager/  # Source management (repo, docs, files)
│   │   │   ├── subagent-runner/ # Isolated agent execution
│   │   │   ├── config/          # Configuration management
│   │   │   └── types/           # TypeScript types
│   │   └── package.json
│   │
│   ├── cli/                     # CLI interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── add.ts
│   │   │   │   ├── remove.ts
│   │   │   │   ├── update.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── ask.ts
│   │   │   │   └── chat.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── mcp-server/              # MCP Server (stdio)
│       ├── src/
│       │   ├── tools/
│       │   │   ├── ask.ts
│       │   │   └── list-sources.ts
│       │   └── index.ts
│       └── package.json
│
├── turbo.json                   # Turborepo config
├── package.json
└── tsconfig.json
```

### 3.2 Core Engine - Source Manager

```typescript
// packages/core/src/source-manager/types.ts

// Base interface with common fields
interface BaseSource {
  name: string;
  lastUpdated?: string;
}

// Git repository source
export interface GitRepositorySource extends BaseSource {
  type: 'git';
  url: string;           // Git URL
  branch?: string;       // defaults to 'main'
}

// Documentation URL source (for llms.txt / web scraping)
export interface DocsSource extends BaseSource {
  type: 'docs';
  url: string;           // Documentation URL
}

// Single file source
export interface FileSource extends BaseSource {
  type: 'file';
  path: string;          // Absolute path to file
}

// Directory source
export interface DirectorySource extends BaseSource {
  type: 'directory';
  path: string;          // Absolute path to directory
}

// Discriminated union of all source types
export type Source = GitRepositorySource | DocsSource | FileSource | DirectorySource;

export interface SourceManagerConfig {
  sourcesDirectory: string;  // ~/.config/lctx/sources
  maxConcurrentClones: number;
}
```

```typescript
// packages/core/src/source-manager/source-manager.ts
import { join } from 'path';

export class SourceManager {
  private config: SourceManagerConfig;

  constructor(config: SourceManagerConfig) {
    this.config = config;
  }

  private async git(args: string[], cwd?: string): Promise<void> {
    const proc = Bun.spawn(['git', ...args], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await proc.exited;

    if (proc.exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`Git command failed: ${stderr}`);
    }
  }

  async addSource(source: Source): Promise<void> {
    const sourcePath = join(this.config.sourcesDirectory, source.name);

    switch (source.type) {
      case 'git':
        await this.git([
          'clone', '--depth', '1', '--branch', source.branch ?? 'main',
          source.url, sourcePath
        ]);
        break;
      case 'docs':
        // Future: fetch llms.txt or scrape documentation
        throw new Error('Docs source type not yet implemented');
      case 'file':
      case 'directory':
        // Symlink local paths directly
        await Bun.spawn(['ln', '-s', source.path, sourcePath]).exited;
        break;
    }
  }

  async updateSource(name: string): Promise<void> {
    const sourcePath = join(this.config.sourcesDirectory, name);
    await this.git(['pull'], sourcePath);
  }

  async updateAll(): Promise<void> {
    const sources = await this.listSources();
    await Promise.all(
      sources.map(source => this.updateSource(source.name))
    );
  }
}
```

### 3.3 Agent Configuration

Agents are configured via command templates. No TypeScript adapter classes needed.

```json
{
  "agents": {
    "claude-code": {
      "commands": {
        "chat": "claude",
        "ask": "claude -p {prompt_file}"
      }
    },
    "gemini": {
      "commands": {
        "chat": "gemini",
        "ask": "gemini -p {prompt_file}"
      }
    },
    "opencode": {
      "commands": {
        "chat": "opencode",
        "ask": "opencode -p {prompt_file}"
      }
    }
  },
  "defaultAgent": "claude-code"
}
```

**Command modes:**
- `ask` - Headless mode: runs agent with prompt file, captures output
- `chat` - Interactive mode: opens agent in isolated temp dir, user controls session

**Placeholder:** `{prompt_file}` is replaced with the path to the generated prompt file (e.g., `/tmp/lctx-abc123/prompt.md`)

### 3.4 MCP Server

Two MCP tools available:

| Tool           | Description                                          |
|----------------|------------------------------------------------------|
| `list_sources` | Returns configured sources (names, descriptions)     |
| `ask_sources`  | Spawns subagent in isolated temp dir, returns answer |

```typescript
// packages/mcp-server/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ConfigManager, SubagentRunner } from '@lctx/core';

const config = await ConfigManager.load();
const runner = new SubagentRunner(config);

const server = new McpServer({
  name: 'lctx',
  version: '1.0.0'
});

// Tool: List available sources
server.tool(
  'list_sources',
  {},
  async () => {
    const sources = config.sources;

    return {
      content: [{
        type: 'text',
        text: sources.map(s =>
          `[${s.name}] ${s.description || ''}`
        ).join('\n')
      }]
    };
  }
);

// Tool: Ask a question with context from sources
server.tool(
  'ask_sources',
  {
    sources: z.array(z.string()).describe('Source names to include'),
    question: z.string().describe('Question about the sources')
  },
  async ({ sources, question }) => {
    // Creates isolated temp dir, spawns subagent, returns answer
    const response = await runner.ask({
      sources,
      question,
      agent: config.defaultAgent
    });

    return {
      content: [{
        type: 'text',
        text: response.answer
      }]
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3.5 Subagent Isolation

Subagents run in isolated temp directories with **empty MCP configs** to prevent circular MCP loops:

```
/tmp/lctx-{uuid}/
├── prompt.md                    # Question + source listing
├── .mcp.json                    # Empty - blocks Claude Code global
├── .gemini/settings.json        # Empty - blocks Gemini global
├── .cursor/mcp.json             # Empty - blocks Cursor global
├── opencode.json                # Empty - blocks OpenCode global
├── langchain -> ~/.config/lctx/sources/langchain   (symlink)
└── langgraph -> ~/.config/lctx/sources/langgraph   (symlink)
```

**prompt.md format:**
```markdown
# Question

How do I create a custom tool in LangGraph?

# Available Sources

The following source directories are available in the current directory:
- langchain/
- langgraph/

Read the files directly to answer the question.
```

**`ask_sources` flow:**
1. Create `/tmp/lctx-{uuid}/`
2. Write all empty MCP configs
3. Create symlinks to requested source directories
4. Write `prompt.md` with question and source listing
5. Spawn agent using configured `ask` command in temp dir
6. Agent reads files directly, produces answer
7. Return answer to main agent
8. Cleanup temp directory

### 3.6 CLI

```typescript
// packages/cli/src/index.ts
import { parseArgs } from 'util';
import { SourceManager, ConfigManager, SubagentRunner } from '@lctx/core';

const commands = {
  add: {
    description: 'Add a git repository source',
    usage: 'lctx add <name> <url> [-b branch]',
  },
  remove: {
    description: 'Remove a source',
    usage: 'lctx remove <name>',
  },
  update: {
    description: 'Update source(s)',
    usage: 'lctx update [name]',
  },
  list: {
    description: 'List all sources',
    usage: 'lctx list',
  },
  ask: {
    description: 'Ask a question about sources (headless)',
    usage: 'lctx ask -s <sources...> -q <question> [-a agent]',
  },
  chat: {
    description: 'Start interactive session with sources',
    usage: 'lctx chat -s <sources...> [-a agent]',
  },
  mcp: {
    description: 'Start MCP server (stdio transport)',
    usage: 'lctx mcp',
  },
};

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    branch: { type: 'string', short: 'b', default: 'main' },
    sources: { type: 'string', short: 's', multiple: true },
    question: { type: 'string', short: 'q' },
    agent: { type: 'string', short: 'a' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

const [command, ...args] = positionals;

async function main() {
  const config = await ConfigManager.load();

  switch (command) {
    case 'add': {
      const [name, url] = args;
      const manager = new SourceManager(config);
      console.log(`Adding source ${name}...`);
      await manager.addSource({
        name,
        type: 'git',
        url,
        branch: values.branch,
      });
      console.log(`Source ${name} added successfully`);
      break;
    }

    case 'remove': {
      const [name] = args;
      const manager = new SourceManager(config);
      await manager.removeSource(name);
      console.log(`Source ${name} removed`);
      break;
    }

    case 'update': {
      const [name] = args;
      const manager = new SourceManager(config);
      if (name) {
        console.log(`Updating ${name}...`);
        await manager.updateSource(name);
      } else {
        console.log('Updating all sources...');
        await manager.updateAll();
      }
      console.log('Update complete');
      break;
    }

    case 'list': {
      console.log('Configured sources:\n');
      for (const source of config.sources) {
        console.log(`  ${source.name} (${source.type})`);
        console.log(`    ${source.url || source.path}`);
      }
      break;
    }

    case 'ask': {
      const runner = new SubagentRunner(config);
      const response = await runner.ask({
        sources: values.sources!,
        question: values.question!,
        agent: values.agent || config.defaultAgent,
      });
      console.log(response.answer);
      break;
    }

    case 'chat': {
      const runner = new SubagentRunner(config);
      await runner.chat({
        sources: values.sources!,
        agent: values.agent || config.defaultAgent,
      });
      break;
    }

    case 'mcp': {
      const { startMcpServer } = await import('./commands/mcp.js');
      await startMcpServer(config);
      break;
    }

    default:
      console.log('lctx - Local context aggregator for AI coding agents\n');
      console.log('Commands:');
      for (const [name, cmd] of Object.entries(commands)) {
        console.log(`  ${name.padEnd(10)} ${cmd.description}`);
      }
  }
}

main().catch(console.error);
```

**Commands:**
| Command | Description |
|---------|-------------|
| `lctx add <name> <url>` | Add a git repository source |
| `lctx remove <name>` | Remove a source |
| `lctx update [name]` | Update source(s) |
| `lctx list` | List all sources |
| `lctx ask -s <sources> -q <question>` | Ask question (headless, spawns agent) |
| `lctx chat -s <sources>` | Interactive session in isolated dir |
| `lctx mcp` | Start MCP server (stdio transport, for AI tool integration) |

Both `ask` and `chat` create the same isolated temp directory with empty MCP configs and symlinks. The difference:
- `ask` - runs agent with prompt file, returns answer
- `chat` - opens agent in interactive mode, user controls session

### 3.7 CLI vs MCP Mode

lctx uses a **subcommand approach** to distinguish between CLI and MCP modes:

| Mode    | Command                       | How it works                                         |
|---------|-------------------------------|------------------------------------------------------|
| **CLI** | `lctx add`, `lctx list`, etc. | User runs commands directly in terminal              |
| **MCP** | `lctx mcp`                    | AI tool spawns as subprocess, communicates via stdio |

**MCP stdio transport:**
- No network port used
- Client spawns `lctx mcp` as subprocess
- JSON-RPC messages via stdin/stdout pipes
- One message per line, newline-delimited

```
┌─────────────────┐      stdin (pipe)       ┌─────────────────┐
│  Claude Desktop │  ──────────────────────▶│    lctx mcp     │
│  (MCP Client)   │  ◀──────────────────────│   (subprocess)  │
└─────────────────┘      stdout (pipe)      └─────────────────┘
```

This approach keeps one binary (`lctx`) with explicit subcommand routing.

---

## 4. MCP vs Other Options - Recommendation

### Why MCP as Primary?

| Feature                     | MCP              | HTTP API | CLI only |
|-----------------------------|------------------|----------|----------|
| Claude Desktop integration  | ✅ Native         | ❌        | ❌        |
| Cursor integration          | ✅ Native         | ❌        | ❌        |
| VS Code Copilot integration | ✅ Native         | ❌        | ❌        |
| Standalone usage            | ⚠️ Requires host | ✅        | ✅        |
| Agent-to-agent              | ✅ Standard       | ✅        | ⚠️       |
| Complexity                  | Medium           | Low      | Low      |

**Recommendation**:
1. **MCP Server** as primary distribution method - works with Claude Desktop, Cursor, VS Code
2. **CLI** as standalone tool for scripts and automation

### MCP Configuration for Different Clients

```json
// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "lctx": {
      "command": "npx",
      "args": ["-y", "lctx", "mcp"],
      "env": {
        "LCTX_CONFIG": "~/.config/lctx/config.json"
      }
    }
  }
}
```

```json
// Cursor: .cursor/mcp.json
{
  "mcpServers": {
    "lctx": {
      "command": "bunx",
      "args": ["lctx", "mcp"]
    }
  }
}
```

---

## 5. Technology Stack

| Component         | Technology                    | Rationale                                        |
|-------------------|-------------------------------|--------------------------------------------------|
| Runtime           | **Bun**                       | Fast, native TS, spawn, arg parsing, all-in-one  |
| Monorepo          | **Turborepo**                 | Caching, parallel builds                         |
| MCP SDK           | **@modelcontextprotocol/sdk** | Official SDK                                     |
| Schema validation | **Zod**                       | Required by MCP SDK                              |

**Bun provides natively:**
- `Bun.spawn()` - subprocess execution (replaces execa, simple-git)
- `util.parseArgs()` - CLI argument parsing (replaces Commander.js)
- `Bun.file()` / `Bun.write()` - file operations
- Built-in TypeScript support

---

## 6. Configuration

```typescript
// packages/core/src/config/types.ts
export interface LctxConfig {
  // Paths
  sourcesDirectory: string;    // ~/.config/lctx/sources
  cacheDirectory: string;      // ~/.config/lctx/cache

  // Sources (repos, docs, files)
  sources: Source[];

  // Agent configurations
  agents: Record<string, AgentConfig>;
  defaultAgent: string;
}

export interface AgentConfig {
  commands: {
    chat: string;  // Interactive mode command
    ask: string;   // Headless mode command with {prompt_file} placeholder
  };
  mcpConfigFile?: string;  // Optional: custom MCP config filename for unsupported agents
}

// Source types are defined in source-manager/types.ts
// Re-exported here for convenience:
// type Source = GitRepositorySource | DocsSource | FileSource | DirectorySource;
```

```json
// ~/.config/lctx/config.json - example
{
  "sourcesDirectory": "~/.config/lctx/sources",
  "cacheDirectory": "~/.config/lctx/cache",
  "sources": [
    {
      "name": "langchain",
      "type": "git",
      "url": "https://github.com/langchain-ai/langchain",
      "branch": "main"
    },
    {
      "name": "langgraph",
      "type": "git",
      "url": "https://github.com/langchain-ai/langgraph",
      "branch": "main"
    },
    {
      "name": "langgraph-docs",
      "type": "docs",
      "url": "https://langchain-ai.github.io/langgraph/"
    },
    {
      "name": "my-notes",
      "type": "directory",
      "path": "~/projects/ai-notes"
    }
  ],
  "agents": {
    "claude-code": {
      "commands": {
        "chat": "claude",
        "ask": "claude -p {prompt_file}"
      }
    },
    "gemini": {
      "commands": {
        "chat": "gemini",
        "ask": "gemini -p {prompt_file}"
      }
    },
    "opencode": {
      "commands": {
        "chat": "opencode",
        "ask": "opencode -p {prompt_file}"
      }
    }
  },
  "defaultAgent": "claude-code"
}
```

---

## 7. Usage - Examples

### CLI

```bash
# Add git repositories
lctx add langchain https://github.com/langchain-ai/langchain
lctx add langgraph https://github.com/langchain-ai/langgraph

# Add documentation (future feature)
lctx add-docs langgraph-docs https://langchain-ai.github.io/langgraph/

# Add local directory (future feature)
lctx add-dir my-notes ~/projects/ai-notes

# Update
lctx update           # all sources
lctx update langchain # only one

# List sources
lctx list

# Ask a question (uses context from selected sources)
lctx ask -s langchain langgraph -q "How to create a custom tool in LangGraph?"

# Interactive chat
lctx chat -s langchain langgraph
```

### MCP (via Claude Desktop)

```
User: What sources are available?

Claude: [calls list_sources tool]

You have the following sources configured:
• langchain (git) - https://github.com/langchain-ai/langchain
• langgraph (git) - https://github.com/langchain-ai/langgraph

User: How do I create a custom tool in LangGraph?

Claude: [calls ask_sources tool with sources=["langchain", "langgraph"], question="How to create a custom tool in LangGraph?"]

Here's how to create a custom tool in LangGraph...
```

---

## 8. Implementation Roadmap

### Phase 1: Core (MVP)
- [ ] Source Manager (clone, update for git repositories)
- [ ] Config Manager
- [ ] CLI: add, remove, update, list
- [ ] Subagent Runner (temp dir, empty MCP configs, symlinks, prompt.md)
- [ ] CLI: ask, chat

### Phase 2: MCP Server
- [ ] MCP Server (stdio)
- [ ] `list_sources` tool
- [ ] `ask_sources` tool (uses Subagent Runner)

### Phase 3: Polish
- [ ] Caching
- [ ] Better error handling

### Phase 4: Extensions
- [ ] llms.txt support
- [ ] Web scraping docs (add-docs)
- [ ] Local files/directories (add-dir)
- [ ] Custom source types

---

## 9. Publishing

```json
// package.json
{
  "name": "lctx",
  "bin": {
    "lctx": "./packages/cli/dist/index.js"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

```bash
# Global installation
bun add -g lctx

# Or via npx/bunx
npx lctx add langchain https://github.com/langchain-ai/langchain
bunx lctx ask -s langchain -q "How to create tools?"

# MCP server starts automatically via claude_desktop_config.json configuration
```

---

## 10. Summary

**lctx** is your local context aggregator for AI coding agents:

1. **Multi-source support** - repositories, documentation, local files
2. **Agent-agnostic** - configurable command templates for any CLI agent
3. **MCP as primary** - native integration with Claude Desktop, Cursor, VS Code
4. **Subagent isolation** - prevents circular MCP loops via empty configs + symlinks
5. **Fully local** - your data, your machine, full control
6. **Simple architecture** - agents handle context natively via symlinked sources

Stack: **TypeScript + Bun + Turborepo + MCP SDK**
