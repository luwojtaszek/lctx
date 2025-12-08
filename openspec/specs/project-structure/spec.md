# project-structure Specification

## Purpose
TBD - created by archiving change setup-monorepo. Update Purpose after archive.
## Requirements
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

### Requirement: Build System Configuration
The project SHALL use Turborepo with the following tasks defined:
- `build` - Compile TypeScript (with dependency ordering)
- `dev` - Development mode (no caching, persistent)
- `lint` - Run Biome linter
- `lint:fix` - Run Biome linter with auto-fix
- `typecheck` - Run TypeScript type checking
- `test` - Run Bun test runner

#### Scenario: Parallel builds
- **WHEN** running `bun run build`
- **THEN** Turborepo builds packages in dependency order with caching

#### Scenario: Development workflow
- **WHEN** running `bun run dev`
- **THEN** all packages start in watch mode

### Requirement: Code Quality Tooling
The project SHALL enforce code quality through:
- Biome for linting and formatting with strict rules
- Lefthook for pre-commit hooks running lint and typecheck
- TypeScript strict mode with additional safety flags

#### Scenario: Pre-commit validation
- **WHEN** a developer commits code
- **THEN** Lefthook runs Biome check and typecheck on staged files

#### Scenario: Lint errors block commits
- **WHEN** staged files have linting errors
- **THEN** the commit is blocked until errors are fixed

