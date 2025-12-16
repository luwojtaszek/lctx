## Context

The lctx CLI currently uses a traditional command-line interface with `util.parseArgs()`. This change introduces an interactive mode using Ink, a React-based terminal UI framework. The interactive mode will provide visual menus and improved UX for source management tasks.

Stakeholders:
- CLI users who prefer interactive menus over remembering commands
- Script authors who need stable, non-interactive commands
- MCP integrations that invoke lctx programmatically

## Goals / Non-Goals

**Goals:**
- Provide an intuitive interactive experience when running `lctx` without arguments
- Maintain backwards compatibility for scripting with key commands
- Use Ink's React patterns for maintainable UI code
- Keep the interactive UI minimal and fast

**Non-Goals:**
- Replacing all CLI commands with interactive versions
- Adding complex animations or visual effects
- Supporting mouse input (keyboard-only)

## Decisions

### Decision 1: Ink as the UI framework
- **Choice:** Use [Ink](https://github.com/vadimdemedes/ink) v5.x for terminal UI
- **Rationale:** React patterns are familiar, Ink is battle-tested (used by GitHub Copilot CLI, Cloudflare Wrangler, Prisma), and it integrates well with TypeScript
- **Alternatives considered:**
  - `enquirer`/`prompts` - Simpler but less flexible, not component-based
  - `blessed`/`neo-blessed` - More powerful but complex API, less React-like
  - Custom ANSI - Too low-level, maintenance burden

### Decision 2: Command classification
- **Choice:** Split commands into two categories:
  - **Persistent (direct + interactive):** `help`, `ask`, `chat`, `mcp`, `sync`
  - **Interactive-only:** Sources screen (add, remove, update metadata, list)
- **Rationale:**
  - `ask`, `chat`, `mcp`, `sync` are used in scripts and MCP configurations
  - `help` must always be accessible
  - Source management features benefit most from visual UI with table view
- **Note:** The `update` CLI command is renamed to `sync` (fetches latest content). The term "update" in interactive mode means editing source metadata (name, description).

### Decision 3: Component architecture
- **Choice:** Organize Ink components in `apps/cli/src/components/`:
  ```
  components/
  ├── App.tsx           # Root component, view router
  ├── MainMenu.tsx      # Main menu: Sources, Ask, Chat, Help
  ├── SourcesScreen.tsx # Table of sources + action bar
  ├── AskScreen.tsx     # Source selection + question input (stays in Ink)
  ├── HelpScreen.tsx    # Help/usage information screen
  ├── AddSource.tsx     # Multi-step add wizard with validation
  ├── EditSource.tsx    # Edit source name/description
  ├── RemoveSource.tsx  # Confirmation dialog
  ├── SyncProgress.tsx  # Sync progress display
  └── shared/
      ├── Table.tsx        # Reusable table component
      ├── SelectInput.tsx  # Reusable selection component
      ├── TextInput.tsx    # Text input with validation
      └── Spinner.tsx      # Loading indicator
  ```
- **Rationale:** Follows React best practices, keeps components focused and testable
- **Note:** Chat from main menu exits Ink and runs `chat` command directly (already interactive)

### Decision 4: Entry point flow
- **Choice:** Modify `apps/cli/src/index.ts` to:
  1. Check for direct command (`lctx ask`, `lctx chat`, etc.)
  2. If direct command found → execute traditional handler
  3. If no command → launch Ink interactive app
- **Rationale:** Maintains backwards compatibility, single entry point

### Decision 5: State management
- **Choice:** Use React hooks (`useState`, `useReducer`) for local state
- **Rationale:** Ink supports standard React hooks; no need for external state libraries for this scope
- **Alternatives considered:**
  - Zustand/Jotai - Overkill for CLI scope
  - Redux - Too verbose for simple state

## Risks / Trade-offs

| Risk                                                  | Impact                                | Mitigation                                    |
|-------------------------------------------------------|---------------------------------------|-----------------------------------------------|
| Bundle size increase from React/Ink                   | Minor - adds ~200KB                   | Acceptable for CLI tool, Bun handles it well  |
| Learning curve for React in CLI                       | Low - team likely familiar with React | Ink docs are excellent, patterns are standard |
| Breaking existing scripts using `add`, `remove`, etc. | **High**                              | Document clearly, consider deprecation period |
| Renaming `update` to `sync`                           | Medium - scripts may use `update`     | Breaking change, document in release notes    |
| Ink v5 compatibility with Bun                         | Low - widely tested                   | Already confirmed working with Bun            |

## Migration Plan

1. **Phase 1 (this change):**
   - Add interactive mode with Sources screen, Ask, Chat, Help
   - Rename `update` command to `sync` (breaking change, no alias)
   - Mark direct `add`/`remove`/`list` as deprecated with warning
2. **Phase 2 (future):** Remove deprecated direct commands after 2 minor versions

### Rollback
- Remove Ink components and dependencies
- Revert entry point to original routing

## Open Questions

1. ~~Should we support `--no-interactive` flag for all commands?~~ Resolved: No, the persistent commands cover scripting needs
2. Should interactive mode support command history/autocomplete? Deferred to future enhancement
