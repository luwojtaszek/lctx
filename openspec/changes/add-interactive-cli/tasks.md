## 1. Setup

- [x] 1.1 Add dependencies to `apps/cli/package.json`: `ink`, `react`, `@types/react`
- [x] 1.2 Create `apps/cli/src/components/` directory structure
- [x] 1.3 Configure TypeScript JSX settings in `apps/cli/tsconfig.json`

## 2. Shared Components

- [x] 2.1 Create `components/shared/Table.tsx` - reusable table component with row selection
- [x] 2.2 Create `components/shared/SelectInput.tsx` - reusable menu selection component using `useInput`
- [x] 2.3 Create `components/shared/TextInput.tsx` - text input with validation support
- [x] 2.4 Create `components/shared/Spinner.tsx` - loading indicator

## 3. Core Components

- [x] 3.1 Create `components/MainMenu.tsx` - main menu: Sources, Ask, Chat, Help
- [x] 3.2 Create `components/App.tsx` - root component with view routing
- [x] 3.3 Create `components/HelpScreen.tsx` - help/usage information screen (Esc to return)

## 4. Sources Management

- [x] 4.1 Create `components/SourcesScreen.tsx` - table of sources with action bar
- [x] 4.2 Create `components/AddSource.tsx` - multi-step wizard with validation:
  - Step 1: Type selection (git, docs, file, directory)
  - Step 2: URL/path input with validation
  - Step 3: Name input (required)
  - Step 4: Description input (required)
  - Step 5: Confirmation
- [x] 4.3 Create `components/EditSource.tsx` - edit source name/description
- [x] 4.4 Create `components/RemoveSource.tsx` - confirmation dialog
- [x] 4.5 Create `components/SyncProgress.tsx` - sync progress display with spinner

## 5. Validation

- [x] 5.1 Create validation utilities for git URLs (HTTPS and SSH formats, any host)
- [x] 5.2 Create validation utilities for docs URLs (valid HTTP/HTTPS)
- [x] 5.3 Create validation utilities for file paths (must exist and be a file)
- [x] 5.4 Create validation utilities for directory paths (must exist and be a directory)

## 6. Ask Feature

- [x] 6.1 Create `components/AskScreen.tsx` - source selection + question input + response display

## 7. Entry Point Integration

- [x] 7.1 Modify `apps/cli/src/index.ts` to detect interactive vs direct mode
- [x] 7.2 Add Ink render call for interactive mode
- [x] 7.3 Keep direct handlers for persistent commands (help, ask, chat, mcp, sync)
- [x] 7.4 Rename `update` command to `sync` in CLI (breaking change, no alias)
- [x] 7.5 Add deprecation warning for direct usage of add/remove/list

## 8. Testing

- [x] 8.1 Add unit tests for shared components (Table, SelectInput, TextInput, Spinner)
- [x] 8.2 Add unit tests for validation utilities
- [x] 8.3 Add integration tests for main menu navigation
- [x] 8.4 Add integration tests for Sources screen actions
- [x] 8.5 Add integration tests for Add Source wizard validation
- [x] 8.6 Test interactive mode launch with `bun apps/cli/src/index.ts`
- [x] 8.7 Verify persistent commands still work: `lctx help`, `lctx ask`, `lctx chat`, `lctx mcp`, `lctx sync`

## 9. Documentation

- [x] 9.1 Update CLI help text to mention interactive mode and sync command

## 10. Verification

- [x] 10.1 Run `./scripts/agent_checks.sh`
- [x] 10.2 Manual testing of all interactive flows
