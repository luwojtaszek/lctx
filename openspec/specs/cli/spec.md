# cli Specification

## Purpose
TBD - created by archiving change add-cli-foundation. Update Purpose after archive.
## Requirements
### Requirement: CLI Entry Point
The CLI SHALL provide a main entry point that either launches interactive mode (no arguments) or routes to direct command handlers for persistent commands using Bun's native `util.parseArgs()`.

#### Scenario: No arguments launches interactive mode
- **WHEN** running `lctx` without any arguments
- **THEN** launches the interactive terminal UI

#### Scenario: Display version
- **WHEN** running `lctx --version`
- **THEN** displays the current version number

#### Scenario: Unknown command
- **WHEN** running `lctx foo` where foo is not a valid persistent command
- **THEN** displays an error message suggesting to use interactive mode

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

### Requirement: MCP Command
The CLI SHALL provide an `mcp` command to start the MCP server with stdio transport.

#### Scenario: Start MCP server
- **WHEN** running `lctx mcp`
- **THEN** starts the MCP server and listens for JSON-RPC messages via stdio

#### Scenario: MCP server help
- **WHEN** running `lctx mcp --help`
- **THEN** displays help information for the mcp command

### Requirement: Interactive Mode
The CLI SHALL launch an interactive terminal UI when invoked without any command arguments.

#### Scenario: Launch interactive mode
- **WHEN** running `lctx` without any arguments
- **THEN** displays an interactive menu with available commands

#### Scenario: Exit interactive mode with q
- **WHEN** user presses 'q' in the main menu
- **THEN** exits the interactive mode cleanly

#### Scenario: Exit interactive mode with Ctrl+C
- **WHEN** user presses Ctrl+C anywhere in interactive mode
- **THEN** exits the interactive mode cleanly

### Requirement: Interactive Main Menu
The interactive mode SHALL provide a main menu for navigating between features.

#### Scenario: Display main menu options
- **WHEN** interactive mode is launched
- **THEN** displays menu with options: Sources, Ask, Chat, Help

#### Scenario: Navigate menu with arrow keys
- **WHEN** user presses up/down arrow keys
- **THEN** highlights the next/previous menu option

#### Scenario: Select menu option with Enter
- **WHEN** user presses Enter on a highlighted option
- **THEN** navigates to the corresponding feature view

#### Scenario: Select Sources
- **WHEN** user selects "Sources" from main menu
- **THEN** opens the Sources management screen

#### Scenario: Select Ask
- **WHEN** user selects "Ask" from main menu
- **THEN** opens the Ask screen with source selection and question input

#### Scenario: Select Chat
- **WHEN** user selects "Chat" from main menu
- **THEN** displays source selection, then exits Ink and runs chat command

#### Scenario: Select Help
- **WHEN** user selects "Help" from main menu
- **THEN** opens Help screen displaying usage information

#### Scenario: Return from Help screen
- **WHEN** user presses Escape in Help screen
- **THEN** returns to main menu

### Requirement: Interactive Ask Screen
The interactive mode SHALL provide an Ask screen for querying sources.

#### Scenario: Ask screen source selection
- **WHEN** user opens Ask screen from main menu
- **THEN** displays list of sources to select from

#### Scenario: Ask screen question input
- **WHEN** user selects source(s) in Ask screen
- **THEN** displays text input for entering question

#### Scenario: Ask screen execution
- **WHEN** user submits question
- **THEN** executes ask command and displays response in Ink UI

#### Scenario: Return from Ask screen
- **WHEN** user presses Escape in Ask screen
- **THEN** returns to main menu

### Requirement: Interactive Add Source
The interactive mode SHALL provide a wizard-style interface for adding sources with validation.

#### Scenario: Add source wizard step 1 - type selection
- **WHEN** user initiates Add from Sources screen
- **THEN** displays type selection with options: git, docs, file, directory

#### Scenario: Add source wizard step 2 - URL/path input
- **WHEN** user selects a source type
- **THEN** prompts for URL (git, docs) or path (file, directory) with validation

#### Scenario: Add source wizard step 3 - name input
- **WHEN** user enters valid URL/path
- **THEN** prompts for source name (required)

#### Scenario: Add source wizard step 4 - description input
- **WHEN** user enters source name
- **THEN** prompts for description (required)

#### Scenario: Add source wizard step 5 - confirmation
- **WHEN** user enters description
- **THEN** displays summary and confirmation prompt

#### Scenario: Git URL validation
- **WHEN** user enters URL for git type
- **THEN** validates as HTTPS (https://host/path) or SSH (git@host:path) format
- **AND** supports any git host (GitHub, GitLab, Azure, Bitbucket, self-hosted)

#### Scenario: Docs URL validation
- **WHEN** user enters URL for docs type
- **THEN** validates as valid HTTP/HTTPS URL

#### Scenario: File path validation
- **WHEN** user enters path for file type
- **THEN** validates that path exists and is a file

#### Scenario: Directory path validation
- **WHEN** user enters path for directory type
- **THEN** validates that path exists and is a directory

#### Scenario: Validation error display
- **WHEN** validation fails for any input
- **THEN** displays error message and allows re-entry

#### Scenario: Cancel add source
- **WHEN** user presses Escape during add wizard
- **THEN** returns to Sources screen without adding source

### Requirement: Interactive Remove Source
The interactive mode SHALL provide a confirmation interface for removing sources.

#### Scenario: Remove source confirmation
- **WHEN** user initiates Remove from Sources screen with a source selected
- **THEN** displays confirmation prompt before deletion

#### Scenario: Confirm removal
- **WHEN** user confirms removal
- **THEN** deletes the source and returns to Sources screen with updated table

#### Scenario: Cancel removal
- **WHEN** user declines confirmation or presses Escape
- **THEN** returns to Sources screen without removing source

### Requirement: Interactive Edit Source
The interactive mode SHALL provide an interface for editing source metadata.

#### Scenario: Edit source from Sources screen
- **WHEN** user presses 'u' or selects Update action with a source selected
- **THEN** opens edit form with current name and description

#### Scenario: Edit source fields
- **WHEN** user is in edit form
- **THEN** can modify source name and description

#### Scenario: Save edited source
- **WHEN** user confirms edit
- **THEN** saves changes and returns to Sources screen with updated data

#### Scenario: Cancel edit
- **WHEN** user presses Escape during edit
- **THEN** returns to Sources screen without saving changes

### Requirement: Interactive Sync Sources
The interactive mode SHALL provide an interface for syncing (fetching latest) sources.

#### Scenario: Sync selected source
- **WHEN** user presses 's' with a source selected in Sources screen
- **THEN** syncs the selected source and displays progress

#### Scenario: Sync all sources
- **WHEN** user presses 'a' (Sync All) in Sources screen
- **THEN** syncs all sources and displays progress for each

#### Scenario: Sync progress display
- **WHEN** sync is in progress
- **THEN** displays spinner and progress information

#### Scenario: Sync completion
- **WHEN** sync completes
- **THEN** displays success/failure status for each synced source

### Requirement: Sources Management Screen
The interactive mode SHALL provide a Sources screen with table view and action bar.

#### Scenario: Sources table display
- **WHEN** user opens Sources screen from main menu
- **THEN** displays all sources in a table with columns: Name, Type, URL/Path, Last Synced

#### Scenario: Empty sources table
- **WHEN** no sources are configured
- **THEN** displays message indicating no sources and prompts to add one

#### Scenario: Navigate table rows
- **WHEN** user presses up/down arrow keys in Sources screen
- **THEN** highlights the next/previous source row

#### Scenario: Action bar display
- **WHEN** Sources screen is displayed
- **THEN** shows action bar at bottom: [A]dd, [R]emove, [U]pdate, [S]ync, Sync [A]ll, [B]ack

#### Scenario: Keyboard shortcuts
- **WHEN** user presses 'a' in Sources screen
- **THEN** opens Add Source wizard
- **WHEN** user presses 'r' with a source selected
- **THEN** opens Remove confirmation
- **WHEN** user presses 'u' with a source selected
- **THEN** opens Edit Source form
- **WHEN** user presses 's' with a source selected
- **THEN** syncs the selected source
- **WHEN** user presses 'A' (shift+a) in Sources screen
- **THEN** syncs all sources
- **WHEN** user presses 'b' or Escape in Sources screen
- **THEN** returns to main menu

### Requirement: Persistent Direct Commands
The CLI SHALL maintain direct (non-interactive) execution for specific commands: help, ask, chat, mcp, sync.

#### Scenario: Direct help command
- **WHEN** running `lctx help` or `lctx --help`
- **THEN** displays help information without launching interactive mode

#### Scenario: Direct ask command
- **WHEN** running `lctx ask -s <source> -q <question>`
- **THEN** executes ask command directly without launching interactive mode

#### Scenario: Direct chat command
- **WHEN** running `lctx chat -s <source>`
- **THEN** executes chat command directly without launching interactive mode

#### Scenario: Direct mcp command
- **WHEN** running `lctx mcp`
- **THEN** starts MCP server directly without launching interactive mode

#### Scenario: Direct sync command
- **WHEN** running `lctx sync [name]`
- **THEN** syncs the specified source (or all sources if no name) without launching interactive mode

