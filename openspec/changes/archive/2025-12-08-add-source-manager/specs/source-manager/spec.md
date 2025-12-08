# source-manager Specification

## Purpose
Manage local context sources using a strategy pattern with type-specific managers.

## ADDED Requirements

### Requirement: SourceManager Interface
The core package SHALL define a `SourceManager<T>` interface for type-specific source operations with internal path handling. All methods take the source object for consistency.

#### Scenario: Interface contract
- **GIVEN** a class implementing `SourceManager<GitRepositorySource>`
- **THEN** it provides:
  - `readonly sourceType: 'git'`
  - `add(source: GitRepositorySource): Promise<void>`
  - `update(source: GitRepositorySource): Promise<void>`
  - `delete(source: GitRepositorySource): Promise<void>`
  - `getSourcePath(source: GitRepositorySource): string`

#### Scenario: Constructor with sourcesDirectory
- **GIVEN** `sourcesDirectory: '/home/user/.config/lctx/sources'`
- **WHEN** a `SourceManager` is constructed
- **THEN** it stores the path for internal use in path resolution

### Requirement: GitSourceManager Implementation
The `GitSourceManager` SHALL implement `SourceManager<GitRepositorySource>` using git CLI commands, storing sources in `${sourcesDirectory}/git/`.

#### Scenario: Clone with default branch
- **GIVEN** a GitRepositorySource with `name: 'langchain'`, `url: 'https://github.com/langchain-ai/langchain'`
- **WHEN** `add(source)` is called
- **THEN** executes `git clone --depth 1 --branch main <url> ${sourcesDirectory}/git/langchain`

#### Scenario: Clone with custom branch
- **GIVEN** a GitRepositorySource with `name: 'langchain'`, `branch: 'develop'`
- **WHEN** `add(source)` is called
- **THEN** executes `git clone --depth 1 --branch develop <url> ${sourcesDirectory}/git/langchain`

#### Scenario: Clone failure handling
- **GIVEN** an invalid Git URL or network failure
- **WHEN** `add(source)` is called
- **THEN** throws an error with the git stderr message

#### Scenario: Update via git pull
- **GIVEN** a GitRepositorySource with `name: 'langchain'`
- **WHEN** `update(source)` is called
- **THEN** executes `git pull` in `${sourcesDirectory}/git/langchain`

#### Scenario: Delete repository
- **GIVEN** a GitRepositorySource with `name: 'langchain'`
- **WHEN** `delete(source)` is called
- **THEN** the directory `${sourcesDirectory}/git/langchain` is deleted recursively

#### Scenario: Get source path
- **GIVEN** a GitRepositorySource with `name: 'langchain'` and `sourcesDirectory: '/home/user/.config/lctx/sources'`
- **WHEN** `getSourcePath(source)` is called
- **THEN** returns `/home/user/.config/lctx/sources/git/langchain`

### Requirement: SourcesManager Orchestrator
The `SourcesManager` SHALL orchestrate source operations by delegating to type-specific managers and persisting changes via `ConfigManager.save()`.

#### Scenario: Constructor injection
- **GIVEN** a ConfigManager and an array of `SourceManager` implementations
- **WHEN** `SourcesManager` is constructed
- **THEN** it stores managers indexed by their `sourceType` and keeps reference to ConfigManager

#### Scenario: Add source delegation and persistence
- **GIVEN** a source with `type: 'git'`
- **WHEN** `add(source)` is called on SourcesManager
- **THEN** it delegates to `GitSourceManager.add(source)`, adds source to `config.sources`, and calls `ConfigManager.save(config)`

#### Scenario: Update source delegation and timestamp
- **GIVEN** a configured source named 'langchain' with `type: 'git'`
- **WHEN** `update('langchain')` is called
- **THEN** it finds the source, delegates to `GitSourceManager.update(source)`, sets `source.lastUpdated` to current ISO timestamp, and calls `ConfigManager.save(config)`

#### Scenario: Delete source delegation and removal
- **GIVEN** a configured source named 'langchain' with `type: 'git'`
- **WHEN** `delete('langchain')` is called
- **THEN** it finds the source, delegates to `GitSourceManager.delete(source)`, removes source from `config.sources`, and calls `ConfigManager.save(config)`

#### Scenario: Update all sources
- **GIVEN** config has sources `[{name: 'a', type: 'git'}, {name: 'b', type: 'git'}]`
- **WHEN** `updateAll()` is called
- **THEN** it iterates each source and calls `update(name)` for each (which updates `lastUpdated` timestamps and saves config)

#### Scenario: Unsupported source type
- **GIVEN** a source with `type: 'docs'` and no DocsSourceManager registered
- **WHEN** `add(source)` is called
- **THEN** throws an error indicating unsupported source type

### Requirement: Source Path Resolution
The `SourcesManager` SHALL resolve the filesystem path for sources by delegating to the appropriate manager.

#### Scenario: Get path for configured git source
- **GIVEN** a source named 'langchain' with `type: 'git'`
- **WHEN** `getSourcePath('langchain')` is called
- **THEN** finds the source config, returns the path from `GitSourceManager.getSourcePath(source)`

#### Scenario: Get path for non-existent source
- **GIVEN** no source named 'unknown' is configured
- **WHEN** `getSourcePath('unknown')` is called
- **THEN** returns `undefined`

### Requirement: Source Listing
The `SourcesManager` SHALL provide access to configured sources.

#### Scenario: List all sources
- **GIVEN** config has sources array
- **WHEN** `listSources()` is called
- **THEN** returns the array of all configured sources

#### Scenario: Get single source by name
- **GIVEN** a source named 'langchain' is configured
- **WHEN** `getSource('langchain')` is called
- **THEN** returns the source configuration object
