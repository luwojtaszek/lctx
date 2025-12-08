# cli Specification

## Purpose
TBD - created by archiving change add-cli-foundation. Update Purpose after archive.
## Requirements
### Requirement: CLI Entry Point
The CLI SHALL provide a main entry point that parses arguments and routes to command handlers using Bun's native `util.parseArgs()`.

#### Scenario: Display help
- **WHEN** running `lctx` or `lctx --help`
- **THEN** displays usage information listing all available commands

#### Scenario: Display version
- **WHEN** running `lctx --version`
- **THEN** displays the current version number

#### Scenario: Unknown command
- **WHEN** running `lctx foo` where foo is not a valid command
- **THEN** displays an error message and shows help

### Requirement: Source Add Command
The CLI SHALL provide an `add` command to add new sources to the configuration.

#### Scenario: Add git source
- **WHEN** running `lctx add langchain https://github.com/langchain-ai/langchain`
- **THEN** clones the repository and adds it to config as type 'git'

#### Scenario: Add git source with branch
- **WHEN** running `lctx add langchain https://github.com/langchain-ai/langchain -b develop`
- **THEN** clones the specified branch

#### Scenario: Add file source
- **WHEN** running `lctx add readme /path/to/README.md -t file`
- **THEN** adds the file reference to config

#### Scenario: Add directory source
- **WHEN** running `lctx add src /path/to/src -t directory`
- **THEN** adds the directory reference to config

#### Scenario: Add docs source
- **WHEN** running `lctx add bun-docs https://bun.sh/llms.txt -t docs`
- **THEN** fetches the URL content and stores it

### Requirement: Source Remove Command
The CLI SHALL provide a `remove` command to remove sources from the configuration.

#### Scenario: Remove existing source
- **WHEN** running `lctx remove langchain`
- **THEN** removes the source from config and deletes associated files/directories

#### Scenario: Remove non-existent source
- **WHEN** running `lctx remove unknown`
- **THEN** displays an error that the source was not found

### Requirement: Source Update Command
The CLI SHALL provide an `update` command to refresh source content.

#### Scenario: Update single source
- **WHEN** running `lctx update langchain`
- **THEN** pulls latest changes for the git source

#### Scenario: Update all sources
- **WHEN** running `lctx update` (no name)
- **THEN** updates all configured sources

### Requirement: Source List Command
The CLI SHALL provide a `list` command to display configured sources.

#### Scenario: List sources
- **WHEN** running `lctx list`
- **THEN** displays all sources with name, type, and path/URL

#### Scenario: List empty sources
- **WHEN** running `lctx list` with no configured sources
- **THEN** displays a message indicating no sources configured

### Requirement: Ask Command
The CLI SHALL provide an `ask` command to query sources using a subagent.

#### Scenario: Ask with sources and question
- **WHEN** running `lctx ask -s langchain langgraph -q "How do I create a tool?"`
- **THEN** spawns a subagent with access to the specified sources and returns the answer

#### Scenario: Ask with missing sources
- **WHEN** running `lctx ask -s unknown -q "question"`
- **THEN** displays an error that the source was not found

### Requirement: Chat Command
The CLI SHALL provide a `chat` command to start an interactive session with sources.

#### Scenario: Chat with sources
- **WHEN** running `lctx chat -s langchain`
- **THEN** starts an interactive subagent session with access to the sources

#### Scenario: Chat inherits stdio
- **WHEN** chat session is started
- **THEN** the user can interact with the agent directly via terminal

