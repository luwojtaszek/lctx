# Change: Add DocsSourceManager, FileSourceManager, DirectorySourceManager

## Why
The source-manager spec defines four source types (git, docs, file, directory), but only GitSourceManager is implemented. Users need to manage documentation URLs and local file/directory references.

## What Changes
- Add `DocsSourceManager` to fetch and store URL content in `${sourcesDirectory}/docs/{name}/`
- Add `FileSourceManager` as config-only reference (linking done by agent runner)
- Add `DirectorySourceManager` as config-only reference (linking done by agent runner)
- Register all three managers in SourcesManager

## Impact
- Affected specs: source-manager
- Affected code: packages/core/src/source-manager/
