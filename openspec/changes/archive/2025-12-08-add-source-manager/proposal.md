# Add Source Manager

## Summary
Add Source Manager module with a strategy pattern architecture:
- `SourceManager<T>` interface for type-specific source operations
- `GitSourceManager` implementation for git repositories
- `SourcesManager` orchestrator that delegates to type-specific managers

## Motivation
The Source Manager is a core component that enables lctx to:
- Clone Git repositories as context sources (shallow clones with --depth 1)
- Update sources via git pull
- Remove sources by deleting their directories
- List all configured sources
- Determine the resolved path for any source

This is foundational for both CLI commands (`add`, `remove`, `update`, `list`) and MCP tools.

## Architecture

```
SourcesManager (orchestrator)
    │
    ├── GitSourceManager (type: 'git')
    │   - stores in: ${sourcesDirectory}/git/${name}
    │   - add: git clone --depth 1
    │   - update: git pull
    │   - delete: rm -rf
    │
    └── [Future: LocalSourceManager, DocsSourceManager]
```

- Each `SourceManager` receives `sourcesDirectory` via constructor
- Managers handle path resolution internally (no path params in methods)
- `SourcesManager` receives managers via constructor, delegates by `source.type`
- `updateAll()` iterates `config.sources` and calls the appropriate manager per source

## Path Structure
Each manager owns a subdirectory under `sourcesDirectory`:
- `GitSourceManager`: `${sourcesDirectory}/git/${name}`
- `LocalSourceManager` (future): `${sourcesDirectory}/local/${name}`

## Scope
- `SourceManager<T>` interface
- `GitSourceManager` implementation (type: 'git')
- `SourcesManager` orchestrator
- File/directory sources (LocalSourceManager) deferred to Task 5
- DocsSource deferred to future work

## Dependencies
- `config-manager` spec - for loading/saving source configurations
- `core-types` spec - for Source type definitions
