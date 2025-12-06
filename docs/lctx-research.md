# lctx — Local Context for AI Agents (Research Document)

> **Note:** This is a research and design document exploring the architecture and implementation approach for lctx. It is not a finalized specification.

> **lctx** — Local context aggregator for AI coding agents. Your repos, your docs, your machine.

---

## 1. Requirements vs Architecture

| Requirement                                                 | Solution                                                              |
|-------------------------------------------------------------|-----------------------------------------------------------------------|
| Query local repositories                                    | Git clone + indexing + RAG or pass to agent                           |
| Multiple agents (Claude Code, Cursor, Gemini CLI, OpenCode) | **Agent Adapter Layer** - common interface, different implementations |
| Easy repository management (CLI)                            | Commands: `add`, `remove`, `update`, `list`                           |
| Query multiple repositories at once                         | Context aggregation + smart truncation                                |
| MCP vs other options                                        | MCP as **primary distribution** + CLI as standalone                   |

---

## 2. Architecture

### Module Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         lctx — Local Context for AI Agents              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐ │
│  │   CLI (Bun)  │────▶│                 Core Engine                   │ │
│  │              │     │                                               │ │
│  │  • add       │     │  ┌─────────────────┐  ┌───────────────────┐  │ │
│  │  • remove    │     │  │  Source Manager │  │  Subagent Runner  │  │ │
│  │  • update    │     │  │                 │  │                   │  │ │
│  │  • list      │     │  │  • clone        │  │  • create temp    │  │ │
│  │  • ask       │     │  │  • pull         │  │  • write configs  │  │ │
│  │  • chat      │     │  │  • sparse       │  │  • symlink sources│  │ │
│  └──────────────┘     │  │  • symlink      │  │  • write prompt   │  │ │
│                       │  └─────────────────┘  │  • spawn agent    │  │ │
│  ┌──────────────┐     │                       └───────────────────┘  │ │
│  │  MCP Server  │────▶│                                               │ │
│  │   (stdio)    │     │  ┌─────────────────┐  ┌───────────────────┐  │ │
│  │              │     │  │  Config Manager │  │  Context Builder  │  │ │
│  │  Tools:      │     │  │                 │  │                   │  │ │
│  │  • list_     │     │  │  • load/save    │  │  • file filtering │  │ │
│  │    sources   │     │  │  • sources      │  │  • token counting │  │ │
│  │  • ask_      │     │  │  • agents       │  │  • truncation     │  │ │
│  │    codebase  │     │  └─────────────────┘  └───────────────────┘  │ │
│  └──────────────┘     │                                               │ │
│                       └──────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Agent Command Templates                        │ │
│  │  claude-code: { chat: "claude", ask: "claude -p {prompt_file}" }  │ │
│  │  gemini:      { chat: "gemini", ask: "gemini -p {prompt_file}" }  │ │
│  │  opencode:    { chat: "opencode", ask: "opencode -p {prompt_file}"│ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (ask_codebase)

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Agent (Claude Desktop / Cursor / etc.)                    │
│                          │                                       │
│                          ▼                                       │
│                    lctx MCP Server                               │
│                          │                                       │
│         ┌────────────────┴────────────────┐                     │
│         ▼                                 ▼                     │
│   list_sources                      ask_codebase                │
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
│   │   │   ├── context-builder/ # Context building
│   │   │   ├── agent-adapters/  # Adapters for different agents
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
│   ├── mcp-server/              # MCP Server (stdio)
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   │   ├── search.ts
│   │   │   │   ├── ask.ts
│   │   │   │   └── list-sources.ts
│   │   │   ├── resources/
│   │   │   │   └── source-content.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── http-server/             # HTTP API (optional)
│       ├── src/
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
export interface SourceConfig {
  name: string;          // "langchain"
  url: string;           // "https://github.com/langchain-ai/langchain"
  branch?: string;       // "main"
  paths?: string[];      // ["libs/langchain", "docs"] - only these paths
  exclude?: string[];    // ["tests", "*.test.ts"]
  lastUpdated?: string;
}

export interface SourceManagerConfig {
  sourcesDirectory: string;  // ~/.config/lctx/sources
  maxConcurrentClones: number;
}
```

```typescript
// packages/core/src/source-manager/source-manager.ts
import { simpleGit, SimpleGit } from 'simple-git';
import { join } from 'path';

export class SourceManager {
  private git: SimpleGit;
  private config: SourceManagerConfig;

  constructor(config: SourceManagerConfig) {
    this.git = simpleGit();
    this.config = config;
  }

  async addSource(source: SourceConfig): Promise<void> {
    const sourcePath = join(this.config.sourcesDirectory, source.name);

    // Sparse checkout if paths are defined
    if (source.paths?.length) {
      await this.sparseClone(source, sourcePath);
    } else {
      await this.git.clone(source.url, sourcePath, [
        '--depth', '1',
        '--branch', source.branch || 'main'
      ]);
    }
  }

  async updateSource(name: string): Promise<void> {
    const sourcePath = join(this.config.sourcesDirectory, name);
    const sourceGit = simpleGit(sourcePath);
    await sourceGit.pull();
  }

  async updateAll(): Promise<void> {
    // Parallel update of all sources
    const sources = await this.listSources();
    await Promise.all(
      sources.map(source => this.updateSource(source.name))
    );
  }

  private async sparseClone(source: SourceConfig, path: string): Promise<void> {
    await this.git.clone(source.url, path, [
      '--filter=blob:none',
      '--sparse',
      '--depth', '1',
      '--branch', source.branch || 'main'
    ]);

    const sourceGit = simpleGit(path);
    await sourceGit.raw(['sparse-checkout', 'set', ...source.paths!]);
  }
}
```

### 3.3 Context Builder

Key module - builds context from multiple repositories, truncates to token limits.

```typescript
// packages/core/src/context-builder/context-builder.ts
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { encode } from 'gpt-tokenizer';  // or tiktoken

export interface ContextRequest {
  repos: string[];           // ["langchain", "langgraph"]
  query?: string;            // Optional question for filtering
  maxTokens?: number;        // Token limit (default: 100k)
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface ContextResult {
  content: string;
  tokenCount: number;
  includedFiles: string[];
  truncated: boolean;
}

export class ContextBuilder {
  private reposDir: string;

  constructor(reposDir: string) {
    this.reposDir = reposDir;
  }

  async buildContext(request: ContextRequest): Promise<ContextResult> {
    const allFiles: FileContent[] = [];

    // 1. Collect files from all repositories
    for (const repoName of request.repos) {
      const files = await this.collectFiles(repoName, request);
      allFiles.push(...files);
    }

    // 2. Sort by relevance (if query exists)
    if (request.query) {
      await this.rankByRelevance(allFiles, request.query);
    }

    // 3. Build context respecting token limit
    return this.assembleContext(allFiles, request.maxTokens || 100_000);
  }

  private async collectFiles(
    repoName: string,
    request: ContextRequest
  ): Promise<FileContent[]> {
    const repoPath = join(this.reposDir, repoName);

    const defaultPatterns = [
      '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
      '**/*.py', '**/*.md', '**/*.json'
    ];

    const defaultExcludes = [
      '**/node_modules/**', '**/.git/**', '**/dist/**',
      '**/build/**', '**/__pycache__/**', '**/coverage/**',
      '**/*.test.*', '**/*.spec.*', '**/tests/**'
    ];

    const patterns = request.includePatterns || defaultPatterns;
    const excludes = request.excludePatterns || defaultExcludes;

    const files = await glob(patterns, {
      cwd: repoPath,
      ignore: excludes,
      nodir: true
    });

    return Promise.all(
      files.map(async (file) => ({
        repo: repoName,
        path: file,
        content: await readFile(join(repoPath, file), 'utf-8'),
        tokens: 0  // Will be calculated later
      }))
    );
  }

  private async rankByRelevance(
    files: FileContent[],
    query: string
  ): Promise<void> {
    // Simple heuristic - can be extended with embeddings
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/);

    for (const file of files) {
      let score = 0;
      const contentLower = file.content.toLowerCase();
      const pathLower = file.path.toLowerCase();

      // Scoring
      for (const keyword of keywords) {
        if (pathLower.includes(keyword)) score += 10;
        const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
        score += Math.min(matches, 20);  // Cap at 20 per keyword
      }

      file.relevanceScore = score;
    }

    files.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private assembleContext(
    files: FileContent[],
    maxTokens: number
  ): ContextResult {
    let totalTokens = 0;
    const includedFiles: string[] = [];
    const parts: string[] = [];
    let truncated = false;

    for (const file of files) {
      const header = `\n## ${file.repo}/${file.path}\n\`\`\`\n`;
      const footer = '\n```\n';
      const fileContent = header + file.content + footer;
      const fileTokens = encode(fileContent).length;

      if (totalTokens + fileTokens > maxTokens) {
        truncated = true;

        // Try to add truncated version
        const remainingTokens = maxTokens - totalTokens - 100;
        if (remainingTokens > 500) {
          const truncatedContent = this.truncateContent(file.content, remainingTokens);
          parts.push(header + truncatedContent + '\n[...truncated...]\n```\n');
          includedFiles.push(`${file.repo}/${file.path} (truncated)`);
        }
        break;
      }

      parts.push(fileContent);
      includedFiles.push(`${file.repo}/${file.path}`);
      totalTokens += fileTokens;
    }

    return {
      content: parts.join(''),
      tokenCount: totalTokens,
      includedFiles,
      truncated
    };
  }
}

interface FileContent {
  repo: string;
  path: string;
  content: string;
  tokens: number;
  relevanceScore?: number;
}
```

### 3.4 Agent Configuration

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

### 3.5 MCP Server

Two MCP tools available:

| Tool | Description |
|------|-------------|
| `list_sources` | Returns configured sources (names, descriptions) |
| `ask_codebase` | Spawns subagent in isolated temp dir, returns answer |

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
          `• ${s.name} (${s.type}) - ${s.url || s.path}`
        ).join('\n')
      }]
    };
  }
);

// Tool: Ask a question with context from sources
server.tool(
  'ask_codebase',
  {
    sources: z.array(z.string()).describe('Source names to include'),
    question: z.string().describe('Question about the codebase'),
    agent: z.string().optional().describe('Agent to use (default from config)')
  },
  async ({ sources, question, agent }) => {
    // Creates isolated temp dir, spawns subagent, returns answer
    const response = await runner.ask({
      sources,
      question,
      agent: agent || config.defaultAgent
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

### 3.6 Subagent Isolation

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

**`ask_codebase` flow:**
1. Create `/tmp/lctx-{uuid}/`
2. Write all empty MCP configs
3. Create symlinks to requested source directories
4. Write `prompt.md` with question and source listing
5. Spawn agent using configured `ask` command in temp dir
6. Agent reads files directly, produces answer
7. Return answer to main agent
8. Cleanup temp directory

### 3.7 CLI

```typescript
// packages/cli/src/index.ts
import { Command } from 'commander';
import { SourceManager, ConfigManager, SubagentRunner } from '@lctx/core';

const program = new Command()
  .name('lctx')
  .description('Local context aggregator for AI coding agents')
  .version('1.0.0');

// lctx add <name> <url> [options]
program
  .command('add <name> <url>')
  .description('Add a source (repository)')
  .option('-b, --branch <branch>', 'Branch to clone', 'main')
  .option('-p, --paths <paths...>', 'Specific paths to include (sparse checkout)')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude')
  .action(async (name, url, options) => {
    const config = await ConfigManager.load();
    const manager = new SourceManager(config);

    console.log(`Adding source ${name}...`);
    await manager.addSource({
      name,
      type: 'repo',
      url,
      branch: options.branch,
      include: options.paths,
      exclude: options.exclude
    });

    console.log(`✓ Source ${name} added successfully`);
  });

// lctx remove <name>
program
  .command('remove <name>')
  .description('Remove a source')
  .action(async (name) => {
    const config = await ConfigManager.load();
    const manager = new SourceManager(config);
    await manager.removeSource(name);
    console.log(`✓ Source ${name} removed`);
  });

// lctx update [name]
program
  .command('update [name]')
  .description('Update source(s)')
  .action(async (name) => {
    const config = await ConfigManager.load();
    const manager = new SourceManager(config);

    if (name) {
      console.log(`Updating ${name}...`);
      await manager.updateSource(name);
    } else {
      console.log('Updating all sources...');
      await manager.updateAll();
    }
    console.log('✓ Update complete');
  });

// lctx list
program
  .command('list')
  .description('List all sources')
  .action(async () => {
    const config = await ConfigManager.load();

    console.log('Configured sources:\n');
    for (const source of config.sources) {
      console.log(`  ${source.name} (${source.type})`);
      console.log(`    ${source.url || source.path}`);
      if (source.branch) console.log(`    Branch: ${source.branch}`);
      if (source.include) console.log(`    Include: ${source.include.join(', ')}`);
      console.log();
    }
  });

// lctx ask -s <sources...> -q <question> [options]
program
  .command('ask')
  .description('Ask a question about sources (headless)')
  .requiredOption('-s, --sources <sources...>', 'Source names')
  .requiredOption('-q, --question <question>', 'Question to ask')
  .option('-a, --agent <agent>', 'Agent to use')
  .action(async (options) => {
    const config = await ConfigManager.load();
    const runner = new SubagentRunner(config);

    // Creates isolated temp dir, spawns agent with prompt file
    const response = await runner.ask({
      sources: options.sources,
      question: options.question,
      agent: options.agent || config.defaultAgent
    });

    console.log(response.answer);
  });

// lctx chat -s <sources...> [options]
program
  .command('chat')
  .description('Start interactive session with sources')
  .requiredOption('-s, --sources <sources...>', 'Source names')
  .option('-a, --agent <agent>', 'Agent to use')
  .action(async (options) => {
    const config = await ConfigManager.load();
    const runner = new SubagentRunner(config);

    // Creates isolated temp dir, opens agent in interactive mode
    await runner.chat({
      sources: options.sources,
      agent: options.agent || config.defaultAgent
    });
  });

program.parse();
```

**Commands:**
| Command | Description |
|---------|-------------|
| `lctx add <name> <url>` | Add a source (repository) |
| `lctx remove <name>` | Remove a source |
| `lctx update [name]` | Update source(s) |
| `lctx list` | List all sources |
| `lctx ask -s <sources> -q <question>` | Ask question (headless, spawns agent) |
| `lctx chat -s <sources>` | Interactive session in isolated dir |

Both `ask` and `chat` create the same isolated temp directory with empty MCP configs and symlinks. The difference:
- `ask` - runs agent with prompt file, returns answer
- `chat` - opens agent in interactive mode, user controls session

---

## 4. MCP vs Other Options - Recommendation

### Why MCP as Primary?

| Feature | MCP | HTTP API | CLI only |
|---------|-----|----------|----------|
| Claude Desktop integration | ✅ Native | ❌ | ❌ |
| Cursor integration | ✅ Native | ❌ | ❌ |
| VS Code Copilot integration | ✅ Native | ❌ | ❌ |
| Standalone usage | ⚠️ Requires host | ✅ | ✅ |
| Agent-to-agent | ✅ Standard | ✅ | ⚠️ |
| Complexity | Medium | Low | Low |

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
      "args": ["-y", "lctx"],
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
      "args": ["lctx"]
    }
  }
}
```

---

## 5. Technology Stack

| Component          | Technology                       | Rationale                           |
|--------------------|----------------------------------|-------------------------------------|
| Runtime            | **Bun**                          | Fast, native TS, good for CLI       |
| Monorepo           | **Turborepo**                    | Caching, parallel builds            |
| CLI framework      | **Commander.js**                 | Mature, simple                      |
| MCP SDK            | **@modelcontextprotocol/sdk**    | Official SDK                        |
| Git operations     | **simple-git**                   | Simple git wrapper                  |
| File matching      | **glob**                         | Standard                            |
| Token counting     | **tiktoken** / **gpt-tokenizer** | Accurate counting                   |
| Schema validation  | **Zod**                          | Required by MCP SDK                 |
| Process management | **execa**                        | Async subprocess                    |

---

## 6. Configuration

```typescript
// packages/core/src/config/types.ts
export interface LctxConfig {
  // Paths
  sourcesDirectory: string;    // ~/.config/lctx/sources
  cacheDirectory: string;      // ~/.config/lctx/cache

  // Sources (repos, docs, files)
  sources: SourceConfig[];

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

export type SourceType = 'repo' | 'docs' | 'file' | 'directory';

export interface SourceConfig {
  name: string;
  type: SourceType;
  url?: string;          // for repo/docs
  path?: string;         // for file/directory
  branch?: string;       // for repo
  include?: string[];    // paths/patterns to include
  exclude?: string[];    // patterns to exclude
  lastUpdated?: string;
}
```

```json
// ~/.config/lctx/config.json - example
{
  "sourcesDirectory": "~/.config/lctx/sources",
  "cacheDirectory": "~/.config/lctx/cache",
  "sources": [
    {
      "name": "langchain",
      "type": "repo",
      "url": "https://github.com/langchain-ai/langchain",
      "branch": "main",
      "include": ["libs/langchain-core", "libs/langchain", "docs"]
    },
    {
      "name": "langgraph",
      "type": "repo",
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
# Add repositories
lctx add langchain https://github.com/langchain-ai/langchain --include libs/langchain-core docs
lctx add langgraph https://github.com/langchain-ai/langgraph

# Add documentation (future feature)
lctx add-docs langgraph-docs https://langchain-ai.github.io/langgraph/

# Add local notes (future feature)
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
• langchain (repo) - https://github.com/langchain-ai/langchain
• langgraph (repo) - https://github.com/langchain-ai/langgraph

User: How do I create a custom tool in LangGraph?

Claude: [calls ask_codebase tool with sources=["langchain", "langgraph"], question="How to create a custom tool in LangGraph?"]

Here's how to create a custom tool in LangGraph...
```

---

## 8. Implementation Roadmap

### Phase 1: Core (MVP)
- [ ] Source Manager (clone, update, sparse checkout for repo)
- [ ] Config Manager
- [ ] CLI: add, remove, update, list
- [ ] Subagent Runner (temp dir, empty MCP configs, symlinks, prompt.md)
- [ ] CLI: ask, chat

### Phase 2: MCP Server
- [ ] MCP Server (stdio)
- [ ] `list_sources` tool
- [ ] `ask_codebase` tool (uses Subagent Runner)

### Phase 3: Polish
- [ ] Relevance ranking (embeddings?)
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
6. **Smart context building** - relevance ranking, token limits, truncation

Stack: **TypeScript + Bun + Turborepo + MCP SDK**
