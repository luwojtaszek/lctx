# Change: Setup Monorepo Structure

## Why
lctx requires a modular architecture with separate packages for core functionality, CLI interface, and MCP server. A well-structured monorepo with Turborepo enables parallel builds, shared tooling, and clear separation of concerns.

## What Changes
- Create Turborepo monorepo with `packages/core`, `packages/cli`, `packages/mcp-server`
- Add build tooling: Turborepo, Biome (linting/formatting), Lefthook (git hooks)
- Configure TypeScript with strict settings and path aliases
- Add runtime dependencies: zod, @t3-oss/env-core to core package

## Impact
- Affected specs: project-structure (new)
- Affected code: All root configuration files, new packages directory
- Foundation for all subsequent implementation tasks
