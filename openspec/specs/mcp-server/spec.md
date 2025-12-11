# mcp-server Specification

## Purpose
TBD - created by archiving change add-mcp-server. Update Purpose after archive.
## Requirements
### Requirement: MCP Server Foundation
The MCP server SHALL initialize using `@modelcontextprotocol/sdk` with stdio transport and connect to the core module for accessing sources and subagent execution.

#### Scenario: Server starts successfully
- **WHEN** running `lctx mcp`
- **THEN** the MCP server starts and communicates via stdio transport

#### Scenario: Server exposes metadata
- **WHEN** an MCP client connects
- **THEN** the server identifies itself with name "lctx" and current version

### Requirement: list_sources Tool
The MCP server SHALL expose a `list_sources` tool that returns all configured sources from the configuration.

#### Scenario: List sources with configured sources
- **WHEN** calling `list_sources` tool with sources configured
- **THEN** returns a list of sources with name, type, and description/path/url

#### Scenario: List sources with no sources
- **WHEN** calling `list_sources` tool with no sources configured
- **THEN** returns an empty list or message indicating no sources

### Requirement: ask_sources Tool
The MCP server SHALL expose an `ask_sources` tool that spawns a subagent to answer questions using specified sources.

#### Scenario: Ask with valid sources
- **WHEN** calling `ask_sources` with `sources: ["langchain"]` and `question: "How do I create a tool?"`
- **THEN** spawns a subagent with access to the specified sources and returns the answer

#### Scenario: Ask with invalid source
- **WHEN** calling `ask_sources` with a source name that doesn't exist
- **THEN** returns an error indicating the source was not found

#### Scenario: Ask with multiple sources
- **WHEN** calling `ask_sources` with multiple sources
- **THEN** spawns a subagent with access to all specified sources

### Requirement: Stdio Transport
The MCP server SHALL use stdio transport for communication, allowing MCP clients to spawn it as a subprocess.

#### Scenario: Client spawns server
- **WHEN** an MCP client spawns `lctx mcp` as a subprocess
- **THEN** the server communicates via stdin/stdout using JSON-RPC messages

#### Scenario: Server handles graceful shutdown
- **WHEN** the client closes the connection
- **THEN** the server shuts down cleanly

