## 1. Project Restructuring
- [ ] 1.1 Create apps/ directory
- [ ] 1.2 Move packages/cli to apps/cli
- [ ] 1.3 Update root package.json workspaces to ["apps/*", "packages/*"]
- [ ] 1.4 Update apps/cli/package.json to depend on @lctx/core and @lctx/mcp-server
- [ ] 1.5 Add bin entry to root package.json pointing to apps/cli

## 2. CLI Foundation
- [ ] 2.1 Create apps/cli/src/index.ts entry point with parseArgs
- [ ] 2.2 Implement command routing structure
- [ ] 2.3 Add help output and version display
- [ ] 2.4 Add error handling with descriptive messages

## 3. Source Commands
- [ ] 3.1 Create apps/cli/src/commands/add.ts (lctx add <name> <url> [-b branch] [-t type])
- [ ] 3.2 Create apps/cli/src/commands/remove.ts (lctx remove <name>)
- [ ] 3.3 Create apps/cli/src/commands/update.ts (lctx update [name])
- [ ] 3.4 Create apps/cli/src/commands/list.ts (lctx list)
- [ ] 3.5 Create apps/cli/src/commands/index.ts barrel export

## 4. Agent Commands
- [ ] 4.1 Create apps/cli/src/commands/ask.ts (lctx ask -s <sources...> -q <question>)
- [ ] 4.2 Create apps/cli/src/commands/chat.ts (lctx chat -s <sources...>)

## 5. Validation
- [ ] 5.1 Run typecheck
- [ ] 5.2 Run bun link and test commands manually
