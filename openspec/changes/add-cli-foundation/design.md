## Context
The CLI is the primary user interface for lctx. It uses:
- @lctx/core for ConfigManager, SourcesManager, SubagentRunner
- @lctx/mcp-server (later, for `lctx mcp` command - not in this change)
- Bun's native `util.parseArgs()` for argument parsing (no Commander.js)

## Goals / Non-Goals
**Goals:**
- Implement all Phase 3: CLI tasks from lctx-research-tasks.md
- Align project structure with docs_agent/ts-project-structure.md
- Clean CLI API matching the research doc

**Non-Goals:**
- MCP command (Task 13 - separate change)
- Binary distribution/publishing (Task 14)
- Documentation (Task 15)

## Decisions

### Argument Parsing Pattern (Per-Command parseArgs)
Use Bun-native `util.parseArgs` with per-command option definitions:

```typescript
// index.ts - minimal routing, no parseArgs here
const args = Bun.argv.slice(2);
const command = args[0];

switch (command) {
  case 'add': return addCommand(args.slice(1));
  case 'ask': return askCommand(args.slice(1));
  // ...
}

// commands/add.ts - each command defines its own options
import { parseArgs } from "util";

export async function addCommand(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      branch: { type: "string", short: "b" },
      type: { type: "string", short: "t", default: "git" },
    },
    allowPositionals: true,
  });
  const [name, urlOrPath] = positionals;
  // ...
}
```

Benefits:
- Each command is self-contained with its own options
- No complex upfront option merging
- Clean separation of concerns
- Bun-native (no external dependencies)

### Entry Point Structure
`apps/cli/src/index.ts` is the main entry, run via `bun run apps/cli/src/index.ts` or via bin symlink.

### Dependencies
CLI depends on @lctx/core only for now. @lctx/mcp-server added when implementing `lctx mcp`.

## Risks / Trade-offs
- Moving packages/cli to apps/cli may require git history adjustment (use git mv)
- Root bin entry won't work until build step exists (use direct bun run for now)

## Open Questions
None - design aligns with research doc.
