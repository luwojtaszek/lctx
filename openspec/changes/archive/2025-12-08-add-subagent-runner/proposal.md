# Change: Add Subagent Runner

## Why
AI agents need to query local context sources (git repositories, documentation, files) in isolation without triggering circular MCP loops. The Subagent Runner creates isolated execution environments where agents can read source files directly.

## What Changes
- New `SubagentRunner` class in `packages/core/src/subagent-runner/`
- `ask()` method for headless execution with output capture
- `chat()` method for interactive sessions with stdio inheritance
- Temp directory isolation with empty MCP configs
- Source access via symlinks
- Prompt file generation with question and source listing

## Impact
- Affected specs: None (new capability)
- Affected code: `packages/core/src/subagent-runner/`, `packages/core/src/index.ts`
- Dependencies: ConfigManager (for agent configs), SourcesManager (for source path resolution)
