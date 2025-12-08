# Design: Subagent Runner

## Context
The Subagent Runner spawns AI coding agents (Claude Code, Gemini CLI, OpenCode) in isolated temp directories to answer questions about configured sources. It must prevent circular MCP loops by ensuring subagents cannot call back into lctx.

## Goals
- Execute agents in isolated environments
- Prevent MCP loops via empty config files
- Provide source access via symlinks (not copies)
- Support both headless (`ask`) and interactive (`chat`) modes
- Clean up temp directories after execution

## Non-Goals
- Agent-specific adapters or plugins
- Complex error recovery or retry logic
- Caching of subagent responses
- Concurrent subagent execution limits

## Decisions

### Temp Directory Location
**Decision**: Use `/tmp/lctx-{uuid}/` with `crypto.randomUUID()`

**Rationale**: Standard temp location, UUID prevents collisions, easy cleanup

### MCP Config Isolation
**Decision**: Write empty JSON objects to all known MCP config paths

**Files written**:
- `.mcp.json` - Claude Code
- `.gemini/settings.json` - Gemini CLI
- `.cursor/mcp.json` - Cursor
- `opencode.json` - OpenCode

**Rationale**: Empty configs override user's global configs, preventing the subagent from calling any MCP servers including lctx itself

### Source Access via Symlinks
**Decision**: Create symlinks from temp directory to actual source paths

**Rationale**: Avoids copying large repositories, sources stay up-to-date, fast setup

### Command Template Interpolation
**Decision**: Replace placeholders in agent's command templates:
- `{prompt_file}` → path to generated prompt.md
- `{mcp_config}` → path to empty .mcp.json

**Example**: `claude -p {prompt_file} --mcp-config {mcp_config}` becomes `claude -p /tmp/lctx-abc123/prompt.md --mcp-config /tmp/lctx-abc123/.mcp.json`

### Process Spawning
**Decision**: Use `Bun.spawn()` with:
- `ask()`: `stdout: 'pipe'`, `stderr: 'pipe'` for output capture
- `chat()`: `stdio: 'inherit'` for interactive mode

### Cleanup Strategy
**Decision**: Use try/finally to ensure cleanup runs even on errors

**Implementation**: Recursive directory deletion via `rm -rf` or Bun file APIs

## Interface Design

```typescript
interface AskOptions {
  sources: string[];      // Source names to include
  question: string;       // Question to ask
}

interface AskResult {
  answer: string;         // Agent's response (stdout)
  stderr?: string;        // Any stderr output
}

interface ChatOptions {
  sources: string[];      // Source names to include
}

interface SubagentRunner {
  ask(options: AskOptions): Promise<AskResult>;
  chat(options: ChatOptions): Promise<void>;
}
```

Note: Agent selection always uses `config.defaultAgent`. No per-call override is supported.

## Risks / Trade-offs

### Risk: Agent CLI Differences
Different agents may have different CLI interfaces or output formats.

**Mitigation**: Command templates in config allow customization per agent. Start with Claude Code which is well-documented.

### Risk: Cleanup Failures
Process crashes or interrupts may leave temp directories behind.

**Mitigation**: Use UUID-based naming to avoid collisions. Consider periodic cleanup of old `/tmp/lctx-*` directories.

### Risk: Symlink Permission Issues
Source paths may not be accessible or symlinkable.

**Mitigation**: Validate source paths exist before creating symlinks. Surface clear error messages.

### Risk: Large Output
Agent output could be very large, causing memory issues.

**Mitigation**: For MVP, accept this limitation. Future: streaming output or size limits.

## Open Questions
None - design is straightforward based on research document section 3.5.
