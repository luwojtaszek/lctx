## ADDED Requirements

### Requirement: DocsSourceManager Implementation
The `DocsSourceManager` SHALL implement `SourceManager<DocsSource>` to fetch and store URL content in `${sourcesDirectory}/docs/`.

#### Scenario: Fetch and store docs
- **GIVEN** a DocsSource with `name: 'bun-docs'`, `url: 'https://bun.sh/llms.txt'`
- **WHEN** `add(source)` is called
- **THEN** fetches URL content and saves to `${sourcesDirectory}/docs/bun-docs/content.txt`

#### Scenario: Update docs
- **GIVEN** a DocsSource with `name: 'bun-docs'`
- **WHEN** `update(source)` is called
- **THEN** re-fetches URL content and overwrites stored file

#### Scenario: Delete docs
- **GIVEN** a DocsSource with `name: 'bun-docs'`
- **WHEN** `delete(source)` is called
- **THEN** the directory `${sourcesDirectory}/docs/bun-docs` is deleted recursively

#### Scenario: Get docs path
- **GIVEN** a DocsSource with `name: 'bun-docs'` and `sourcesDirectory: '/home/user/.config/lctx/sources'`
- **WHEN** `getSourcePath(source)` is called
- **THEN** returns `/home/user/.config/lctx/sources/docs/bun-docs`

#### Scenario: Fetch failure handling
- **GIVEN** an invalid URL or network failure
- **WHEN** `add(source)` is called
- **THEN** throws an error with the failure message

### Requirement: FileSourceManager Implementation
The `FileSourceManager` SHALL implement `SourceManager<FileSource>` as a config-only reference, with no file operations (linking handled by agent runner).

#### Scenario: Add file source (no-op)
- **GIVEN** a FileSource with `name: 'readme'`, `path: '/path/to/README.md'`
- **WHEN** `add(source)` is called
- **THEN** completes successfully without file operations

#### Scenario: Update file source (no-op)
- **GIVEN** a FileSource with `name: 'readme'`
- **WHEN** `update(source)` is called
- **THEN** completes successfully without file operations

#### Scenario: Delete file source (no-op)
- **GIVEN** a FileSource with `name: 'readme'`
- **WHEN** `delete(source)` is called
- **THEN** completes successfully without deleting the user's file

#### Scenario: Get file path
- **GIVEN** a FileSource with `name: 'readme'`, `path: '/path/to/README.md'`
- **WHEN** `getSourcePath(source)` is called
- **THEN** returns `/path/to/README.md` (the configured path directly)

### Requirement: DirectorySourceManager Implementation
The `DirectorySourceManager` SHALL implement `SourceManager<DirectorySource>` as a config-only reference, with no file operations (linking handled by agent runner).

#### Scenario: Add directory source (no-op)
- **GIVEN** a DirectorySource with `name: 'src'`, `path: '/path/to/src'`
- **WHEN** `add(source)` is called
- **THEN** completes successfully without file operations

#### Scenario: Update directory source (no-op)
- **GIVEN** a DirectorySource with `name: 'src'`
- **WHEN** `update(source)` is called
- **THEN** completes successfully without file operations

#### Scenario: Delete directory source (no-op)
- **GIVEN** a DirectorySource with `name: 'src'`
- **WHEN** `delete(source)` is called
- **THEN** completes successfully without deleting the user's directory

#### Scenario: Get directory path
- **GIVEN** a DirectorySource with `name: 'src'`, `path: '/path/to/src'`
- **WHEN** `getSourcePath(source)` is called
- **THEN** returns `/path/to/src` (the configured path directly)
