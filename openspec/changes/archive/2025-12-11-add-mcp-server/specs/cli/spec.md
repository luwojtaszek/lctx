## ADDED Requirements

### Requirement: MCP Command
The CLI SHALL provide an `mcp` command to start the MCP server with stdio transport.

#### Scenario: Start MCP server
- **WHEN** running `lctx mcp`
- **THEN** starts the MCP server and listens for JSON-RPC messages via stdio

#### Scenario: MCP server help
- **WHEN** running `lctx mcp --help`
- **THEN** displays help information for the mcp command
