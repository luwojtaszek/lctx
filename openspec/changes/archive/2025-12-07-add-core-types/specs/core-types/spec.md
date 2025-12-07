# core-types Specification

## Purpose
Defines the core TypeScript types for the lctx system, including source definitions and configuration structures.

## ADDED Requirements

### Requirement: Source Type Definitions
The core package SHALL define a discriminated union `Source` type with the following variants:
- `GitRepositorySource` (type: 'git') - Git repository with url and optional branch
- `DocsSource` (type: 'docs') - Documentation URL for llms.txt or web scraping
- `FileSource` (type: 'file') - Single file reference by absolute path
- `DirectorySource` (type: 'directory') - Directory reference by absolute path

Each source variant SHALL extend a `BaseSource` interface with `name: string` and optional `lastUpdated?: string`.

#### Scenario: Git source type discrimination
- **WHEN** a Source object has `type: 'git'`
- **THEN** TypeScript narrows it to `GitRepositorySource` with `url` and optional `branch` properties

#### Scenario: Local source type discrimination
- **WHEN** a Source object has `type: 'file'` or `type: 'directory'`
- **THEN** TypeScript narrows it to the respective type with `path` property

#### Scenario: All sources have common fields
- **WHEN** iterating over an array of Source objects
- **THEN** all items have accessible `name` and `type` properties

### Requirement: Configuration Type Definitions
The core package SHALL define an `LctxConfig` interface containing:
- `sourcesDirectory: string` - Path to store cloned sources
- `sources: Source[]` - Array of configured sources
- `agents: Record<string, AgentConfig>` - Agent configurations keyed by name
- `defaultAgent: string` - Name of the default agent to use

#### Scenario: Config structure validation
- **WHEN** loading a configuration object
- **THEN** TypeScript enforces all required fields are present

### Requirement: Agent Configuration Type
The core package SHALL define an `AgentConfig` interface containing:
- `commands.chat: string` - Command template for interactive mode
- `commands.ask: string` - Command template for headless mode with `{prompt_file}` placeholder
- `mcpConfigFile?: string` - Optional custom MCP config filename

#### Scenario: Agent command templates
- **WHEN** accessing an agent's ask command
- **THEN** the command string contains the `{prompt_file}` placeholder for substitution
