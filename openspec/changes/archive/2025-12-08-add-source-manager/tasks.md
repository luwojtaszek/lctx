# Tasks: Add Source Manager

## Implementation Checklist

### 1. SourceManager Interface
- [x] Create `packages/core/src/source-manager/source-manager.ts`
- [x] Define `SourceManager<T>` interface with:
  - `readonly sourceType: T['type']`
  - `add(source: T): Promise<void>`
  - `update(source: T): Promise<void>`
  - `delete(source: T): Promise<void>`
  - `getSourcePath(source: T): string`

### 2. GitSourceManager Implementation
- [x] Create `packages/core/src/source-manager/git-source-manager.ts`
- [x] Constructor accepts `sourcesDirectory: string`
- [x] Implement `GitSourceManager` class:
  - `sourceType: 'git'`
  - `add(source)`: `git clone --depth 1 --branch <branch> <url> ${sourcesDirectory}/git/${source.name}`
  - `update(source)`: `git pull` in `${sourcesDirectory}/git/${source.name}`
  - `delete(source)`: recursive removal of `${sourcesDirectory}/git/${source.name}`
  - `getSourcePath(source)`: returns `${sourcesDirectory}/git/${source.name}`
- [x] Add private `git()` helper using `Bun.spawn()`
- [x] Handle errors with descriptive messages from git stderr
- [x] Create `${sourcesDirectory}/git/` directory if it doesn't exist

### 3. SourcesManager Orchestrator
- [x] Create `packages/core/src/source-manager/sources-manager.ts`
- [x] Implement `SourcesManager` class with:
  - Constructor accepting `configManager: ConfigManager` and `managers: SourceManager[]`
  - `add(source: Source)`: delegate to manager, then add source to config, save via ConfigManager
  - `update(name: string)`: find source, delegate to manager, update `lastUpdated` timestamp, save via ConfigManager
  - `delete(name: string)`: find source, delegate to manager, remove source from config, save via ConfigManager
  - `updateAll()`: iterate config.sources, call `update(name)` for each source
  - `getSourcePath(name: string)`: find source, delegate to `manager.getSourcePath(source)`, or return undefined
  - `listSources()`: return config.sources
  - `getSource(name: string)`: find source by name
- [x] Throw error for unsupported source types

### 4. Module Exports
- [x] Create `packages/core/src/source-manager/index.ts` with re-exports
- [x] Export from `packages/core/src/index.ts`

### 5. Testing
- [x] Write unit tests for `GitSourceManager`
- [x] Write unit tests for `SourcesManager`
- [x] Test config persistence (add saves, update updates lastUpdated, delete removes)
- [x] Test error handling for invalid git URLs
- [x] Test unsupported source type error

## File Structure
```
packages/core/src/source-manager/
├── source-manager.ts       # SourceManager<T> interface
├── git-source-manager.ts   # GitSourceManager implementation
├── sources-manager.ts      # SourcesManager orchestrator
└── index.ts                # Re-exports
```

## Path Structure
```
${sourcesDirectory}/
└── git/
    ├── langchain/          # cloned repo
    └── langgraph/          # cloned repo
```

## Dependencies
- `ConfigManager` from config-manager
- `LctxConfig` from shared/types
- `Source`, `GitRepositorySource` from shared/types
- `Bun.spawn()` for git commands

## Notes
- Shallow clones (`--depth 1`) to save disk space
- Default branch is 'main' when not specified
- Delete is idempotent (no error if path doesn't exist)
- Each manager creates its subdirectory if it doesn't exist
- All SourceManager methods take source object for consistency
- SourcesManager persists all changes via `ConfigManager.save(config)`:
  - `add()`: adds source to `config.sources`, then calls `ConfigManager.save(config)`
  - `update()`: sets `source.lastUpdated` to current ISO timestamp, then calls `ConfigManager.save(config)`
  - `delete()`: removes source from `config.sources`, then calls `ConfigManager.save(config)`
