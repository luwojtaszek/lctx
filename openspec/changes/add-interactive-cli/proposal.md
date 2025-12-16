# Change: Add Interactive CLI Mode with Ink

## Why

Currently `lctx` requires users to memorize and type full commands with arguments. An interactive mode would provide a more user-friendly experience with visual menus, command history, and real-time feedback. This is especially valuable for source management tasks (add, remove, update, list) where users may want to browse and select options rather than recall exact syntax.

## What Changes

- **NEW:** Interactive CLI mode when running `lctx` without arguments
- **NEW:** Ink-based React terminal UI for interactive experience
- **NEW:** Main menu with options: Sources, Ask, Chat, Help
- **NEW:** Sources management screen with table view displaying all sources
- **NEW:** Source actions: Add (with validation), Remove, Update (edit metadata), Sync (fetch content), Sync All
- **NEW:** Input validation for Add Source wizard (URL validation for git/docs, path validation for file/directory)
- **NEW:** Description field is required when adding sources
- **MODIFIED:** Rename `update` command to `sync` (fetches latest source content)
- **NEW:** `update` action in Sources screen for editing source metadata (name, description)
- **MODIFIED:** Command structure - some commands available in both modes, others interactive-only:
  - **Both modes (direct CLI + interactive):** `help`, `ask`, `chat`, `mcp`, `sync`
  - **Interactive-only:** Sources screen (add, remove, update metadata, list)
- **NEW:** Graceful exit with keyboard shortcuts (q, Ctrl+C)

## Impact

- Affected specs: `cli`
- Affected code:
  - `apps/cli/src/index.ts` - Entry point changes
  - `apps/cli/src/components/` - New Ink components directory
  - `apps/cli/package.json` - New dependencies (ink, react)
- Dependencies added: `ink`, `react`, `@types/react`

## Rationale

Splitting commands into two categories:
- **Direct CLI commands** (`help`, `ask`, `chat`, `mcp`, `sync`): These are commonly used in scripts, MCP configurations, and automated workflows. They need stable, non-interactive interfaces.
- **Interactive-only features** (Sources screen with add, remove, update, list): These are typically one-off management tasks where visual feedback and browsing capabilities improve UX.

The Sources management screen consolidates all source-related actions under a single table view, providing a more intuitive experience than separate menu items. Users can see all their sources at a glance and perform actions on selected rows.
