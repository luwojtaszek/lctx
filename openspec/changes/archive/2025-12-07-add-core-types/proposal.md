# Change: Add Core Types

## Why
The core package needs TypeScript type definitions to enable type-safe development of the Source Manager, Config Manager, and Subagent Runner modules.

## What Changes
- Add `Source` discriminated union type with variants: `GitRepositorySource`, `DocsSource`, `FileSource`, `DirectorySource`
- Add `LctxConfig` interface for application configuration
- Add `AgentConfig` interface for agent command templates
- Create type exports from `packages/core/src/types/`

## Impact
- Affected specs: core-types (new capability)
- Affected code: `packages/core/src/types/`
