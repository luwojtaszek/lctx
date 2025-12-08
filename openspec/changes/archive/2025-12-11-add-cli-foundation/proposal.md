# Change: Add CLI Foundation with Project Restructuring

## Why
The CLI package exists but is a placeholder. Phase 3 of lctx-research-tasks.md requires:
- Full CLI implementation with source and agent commands
- Project structure alignment with apps/ + packages/ pattern

## What Changes
- **BREAKING**: Move `packages/cli` to `apps/cli`
- Add CLI entry point with command routing
- Implement source management commands (add, remove, update, list)
- Implement agent commands (ask, chat)
- Add root bin entry for `lctx` command
- Update workspaces configuration

## Impact
- Affected specs: project-structure, cli (new)
- Affected code: packages/cli → apps/cli, root package.json, turbo.json
