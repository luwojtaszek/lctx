## 1. Project Restructuring
- [x] 1.1 Create apps/ directory
- [x] 1.2 Move packages/cli to apps/cli
- [x] 1.3 Update root package.json workspaces to ["apps/*", "packages/*"]
- [x] 1.4 Update apps/cli/package.json to depend on @lctx/core and @lctx/mcp-server
- [x] 1.5 Add bin entry to root package.json pointing to apps/cli

## 2. CLI Foundation
- [x] 2.1 Create apps/cli/src/index.ts entry point with parseArgs
- [x] 2.2 Implement command routing structure
- [x] 2.3 Add help output and version display
- [x] 2.4 Add error handling with descriptive messages

## 3. Source Commands
- [x] 3.1 Create apps/cli/src/commands/add.ts (lctx add <name> <url> [-b branch] [-t type])
- [x] 3.2 Create apps/cli/src/commands/remove.ts (lctx remove <name>)
- [x] 3.3 Create apps/cli/src/commands/update.ts (lctx update [name])
- [x] 3.4 Create apps/cli/src/commands/list.ts (lctx list)
- [x] 3.5 Create apps/cli/src/commands/index.ts barrel export

## 4. Agent Commands
- [x] 4.1 Create apps/cli/src/commands/ask.ts (lctx ask -s <sources...> -q <question>)
- [x] 4.2 Create apps/cli/src/commands/chat.ts (lctx chat -s <sources...>)

## 5. Validation
- [x] 5.1 Run typecheck
- [x] 5.2 Run bun link and test commands manually
