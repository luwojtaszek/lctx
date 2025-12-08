# subagent-runner Specification

## Purpose
Enables isolated execution of AI coding agents with access to configured sources, supporting both headless queries and interactive sessions.

## ADDED Requirements

### Requirement: SubagentRunner Interface
The core package SHALL provide a `SubagentRunner` class that executes AI agents in isolated temp directories with access to configured sources.

#### Scenario: Constructor injection
- **GIVEN** a ConfigManager and SourcesManager instance
- **WHEN** SubagentRunner is constructed
- **THEN** it stores references to both for config lookup and source path resolution

#### Scenario: ask() method signature
- **GIVEN** a SubagentRunner instance
- **THEN** it provides `ask(options: { sources: string[], question: string }): Promise<{ answer: string }>`

#### Scenario: chat() method signature
- **GIVEN** a SubagentRunner instance
- **THEN** it provides `chat(options: { sources: string[] }): Promise<void>`

### Requirement: Temp Directory Isolation
The SubagentRunner SHALL create isolated temp directories with empty MCP configs to prevent circular MCP loops.

#### Scenario: Create temp directory
- **WHEN** ask() or chat() is called
- **THEN** creates directory `/tmp/lctx-{uuid}/` where uuid is a random UUID

#### Scenario: Write empty MCP configs
- **WHEN** temp directory is created
- **THEN** writes empty JSON objects (`{}`) to:
  - `.mcp.json` (Claude Code)
  - `.gemini/settings.json` (Gemini CLI)
  - `.cursor/mcp.json` (Cursor)
  - `opencode.json` (OpenCode)

#### Scenario: Create parent directories for nested configs
- **WHEN** writing `.gemini/settings.json` or `.cursor/mcp.json`
- **THEN** creates parent directories if they don't exist

### Requirement: Source Symlink Creation
The SubagentRunner SHALL create symlinks to requested sources in the temp directory.

#### Scenario: Symlink git source
- **GIVEN** sources includes 'langchain' which is a git source at `~/.config/lctx/sources/git/langchain`
- **WHEN** temp directory is prepared
- **THEN** creates symlink `/tmp/lctx-{uuid}/langchain` pointing to the source path

#### Scenario: Symlink file source
- **GIVEN** sources includes 'readme' which is a file source at `/path/to/README.md`
- **WHEN** temp directory is prepared
- **THEN** creates symlink `/tmp/lctx-{uuid}/readme` pointing to `/path/to/README.md`

#### Scenario: Symlink directory source
- **GIVEN** sources includes 'src' which is a directory source at `/path/to/src`
- **WHEN** temp directory is prepared
- **THEN** creates symlink `/tmp/lctx-{uuid}/src` pointing to `/path/to/src`

#### Scenario: Unknown source error
- **GIVEN** sources includes 'unknown' which is not configured
- **WHEN** temp directory is prepared
- **THEN** throws an error indicating the source was not found

### Requirement: Prompt File Generation
The SubagentRunner SHALL write a prompt.md file with the question and available sources listing.

#### Scenario: Generate prompt file for ask
- **GIVEN** question is "How do I create a tool?" and sources are ['langchain', 'langgraph']
- **WHEN** ask() prepares the temp directory
- **THEN** writes `/tmp/lctx-{uuid}/prompt.md` containing:
  ```
  # Question

  How do I create a tool?

  # Available Sources

  The following source directories are available in the current directory:
  - langchain/
  - langgraph/

  Read the files directly to answer the question.
  ```

### Requirement: ask() Execution
The SubagentRunner SHALL spawn the agent in headless mode and capture its output.

#### Scenario: Spawn agent with command template
- **GIVEN** agent 'claude-code' has ask command `claude -p {prompt_file} --mcp-config {mcp_config}`
- **WHEN** ask() is called
- **THEN** spawns `claude -p /tmp/lctx-{uuid}/prompt.md --mcp-config /tmp/lctx-{uuid}/.mcp.json` with cwd set to temp directory

#### Scenario: Interpolate mcp_config placeholder
- **GIVEN** agent has ask command containing `{mcp_config}` placeholder
- **WHEN** ask() is called
- **THEN** replaces `{mcp_config}` with the path to the empty `.mcp.json` in the temp directory

#### Scenario: Capture stdout as answer
- **WHEN** the agent process completes successfully
- **THEN** returns `{ answer: stdout_content }`

#### Scenario: Handle agent failure
- **WHEN** the agent process exits with non-zero code
- **THEN** throws an error containing the stderr output

#### Scenario: Agent resolution
- **WHEN** ask() or chat() is called
- **THEN** always uses `config.defaultAgent` to look up the command template

### Requirement: chat() Execution
The SubagentRunner SHALL spawn the agent in interactive mode with stdio inheritance.

#### Scenario: Spawn interactive agent
- **GIVEN** agent 'claude-code' has chat command `claude`
- **WHEN** chat() is called with sources ['langchain']
- **THEN** spawns `claude` with cwd set to temp directory and stdio inherited

#### Scenario: Wait for interactive session
- **WHEN** chat() spawns the agent
- **THEN** waits for the process to exit before returning

#### Scenario: No prompt file for chat
- **WHEN** chat() is called
- **THEN** does NOT write a prompt.md file (user interacts directly)

### Requirement: Cleanup Behavior
The SubagentRunner SHALL clean up temp directories after execution completes or fails.

#### Scenario: Cleanup after successful ask
- **WHEN** ask() completes successfully
- **THEN** the temp directory `/tmp/lctx-{uuid}/` is deleted recursively

#### Scenario: Cleanup after failed ask
- **WHEN** ask() throws an error
- **THEN** the temp directory is still deleted recursively before re-throwing

#### Scenario: Cleanup after chat exit
- **WHEN** chat() process exits (success or failure)
- **THEN** the temp directory is deleted recursively
