## MODIFIED Requirements

### Requirement: Monorepo Package Structure
The project SHALL use a Turborepo monorepo with packages under `packages/` and apps under `apps/`:
- `apps/cli` - Command-line interface (@lctx/cli)
- `packages/core` - Core engine (source manager, subagent runner, config manager) (@lctx/core)
- `packages/mcp-server` - MCP server for AI tool integration (@lctx/mcp-server)

#### Scenario: Package discovery
- **WHEN** running `bun install` in the repository root
- **THEN** all packages and apps are linked as workspaces

#### Scenario: Cross-package imports
- **WHEN** apps/cli imports from @lctx/core
- **THEN** the import resolves correctly without publishing

#### Scenario: Binary entry point
- **WHEN** running `bun link` in the repository root
- **THEN** the `lctx` command is available globally pointing to apps/cli
