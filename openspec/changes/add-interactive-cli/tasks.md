## 1. Setup

- [ ] 1.1 Add dependencies to `apps/cli/package.json`: `ink`, `react`, `@types/react`
- [ ] 1.2 Create `apps/cli/src/components/` directory structure
- [ ] 1.3 Configure TypeScript JSX settings in `apps/cli/tsconfig.json`

## 2. Shared Components

- [ ] 2.1 Create `components/shared/Table.tsx` - reusable table component with row selection
- [ ] 2.2 Create `components/shared/SelectInput.tsx` - reusable menu selection component using `useInput`
- [ ] 2.3 Create `components/shared/TextInput.tsx` - text input with validation support
- [ ] 2.4 Create `components/shared/Spinner.tsx` - loading indicator

## 3. Core Components

- [ ] 3.1 Create `components/MainMenu.tsx` - main menu: Sources, Ask, Chat, Help
- [ ] 3.2 Create `components/App.tsx` - root component with view routing
- [ ] 3.3 Create `components/HelpScreen.tsx` - help/usage information screen (Esc to return)

## 4. Sources Management

- [ ] 4.1 Create `components/SourcesScreen.tsx` - table of sources with action bar
- [ ] 4.2 Create `components/AddSource.tsx` - multi-step wizard with validation:
  - Step 1: Type selection (git, docs, file, directory)
  - Step 2: URL/path input with validation
  - Step 3: Name input (required)
  - Step 4: Description input (required)
  - Step 5: Confirmation
- [ ] 4.3 Create `components/EditSource.tsx` - edit source name/description
- [ ] 4.4 Create `components/RemoveSource.tsx` - confirmation dialog
- [ ] 4.5 Create `components/SyncProgress.tsx` - sync progress display with spinner

## 5. Validation

- [ ] 5.1 Create validation utilities for git URLs (HTTPS and SSH formats, any host)
- [ ] 5.2 Create validation utilities for docs URLs (valid HTTP/HTTPS)
- [ ] 5.3 Create validation utilities for file paths (must exist and be a file)
- [ ] 5.4 Create validation utilities for directory paths (must exist and be a directory)

## 6. Ask Feature

- [ ] 6.1 Create `components/AskScreen.tsx` - source selection + question input + response display

## 7. Entry Point Integration

- [ ] 7.1 Modify `apps/cli/src/index.ts` to detect interactive vs direct mode
- [ ] 7.2 Add Ink render call for interactive mode
- [ ] 7.3 Keep direct handlers for persistent commands (help, ask, chat, mcp, sync)
- [ ] 7.4 Rename `update` command to `sync` in CLI (breaking change, no alias)
- [ ] 7.5 Add deprecation warning for direct usage of add/remove/list

## 8. Testing

- [ ] 8.1 Add unit tests for shared components (Table, SelectInput, TextInput, Spinner)
- [ ] 8.2 Add unit tests for validation utilities
- [ ] 8.3 Add integration tests for main menu navigation
- [ ] 8.4 Add integration tests for Sources screen actions
- [ ] 8.5 Add integration tests for Add Source wizard validation
- [ ] 8.6 Test interactive mode launch with `bun apps/cli/src/index.ts`
- [ ] 8.7 Verify persistent commands still work: `lctx help`, `lctx ask`, `lctx chat`, `lctx mcp`, `lctx sync`

## 9. Documentation

- [ ] 9.1 Update CLI help text to mention interactive mode and sync command
- [ ] 9.2 Add inline help within interactive mode (? key)

## 10. Verification

- [ ] 10.1 Run `./scripts/agent_checks.sh`
- [ ] 10.2 Manual testing of all interactive flows
