## 1. Directory Structure
- [x] 1.1 Create packages/core/src directory
- [x] 1.2 Create packages/cli/src directory
- [x] 1.3 Create packages/mcp-server/src directory

## 2. Package Configuration
- [x] 2.1 Create packages/core/package.json with @lctx/core name and dependencies
- [x] 2.2 Create packages/cli/package.json with @lctx/cli name
- [x] 2.3 Create packages/mcp-server/package.json with @lctx/mcp-server name
- [x] 2.4 Update root package.json with workspaces and scripts

## 3. TypeScript Configuration
- [x] 3.1 Update root tsconfig.json with strict settings and bun-types
- [x] 3.2 Create packages/core/tsconfig.json extending root
- [x] 3.3 Create packages/cli/tsconfig.json extending root
- [x] 3.4 Create packages/mcp-server/tsconfig.json extending root

## 4. Build Tools
- [x] 4.1 Create turbo.json with task definitions
- [x] 4.2 Create biome.json with linting and formatting rules
- [x] 4.3 Create lefthook.yml with pre-commit hooks

## 5. Placeholder Source Files
- [x] 5.1 Create packages/core/src/index.ts
- [x] 5.2 Create packages/cli/src/index.ts
- [x] 5.3 Create packages/mcp-server/src/index.ts
- [x] 5.4 Delete root index.ts placeholder

## 6. Verification
- [x] 6.1 Run bun install
- [x] 6.2 Run bunx lefthook install
- [x] 6.3 Verify bun run typecheck passes
- [x] 6.4 Verify bun run lint passes
