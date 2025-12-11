import { startServer } from "@lctx/mcp-server";

export async function mcpCommand(): Promise<void> {
  await startServer();
}
