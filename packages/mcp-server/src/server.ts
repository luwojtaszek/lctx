import { createCoreModule } from "@lctx/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { version } from "./index.ts";
import { registerAskSourcesTool, registerListSourcesTool } from "./tools";

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: "lctx",
    version,
  });

  const core = await createCoreModule();

  registerListSourcesTool(server, core.sourcesManager);
  registerAskSourcesTool(server, core.subagentRunner, core.sourcesManager);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
