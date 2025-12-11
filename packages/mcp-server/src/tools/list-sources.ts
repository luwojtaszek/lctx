import type { SourcesManager } from "@lctx/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

export function registerListSourcesTool(
  server: McpServer,
  sourcesManager: SourcesManager,
): void {
  server.registerTool(
    "list_sources",
    {
      title: "List Sources",
      description: "Returns all configured local context sources",
      inputSchema: {},
      outputSchema: {
        sources: z.array(
          z.object({
            name: z.string().describe("Source name"),
            type: z.string().describe("Source type"),
            description: z.string().optional().describe("Source description"),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const sources = await sourcesManager.listSources();
      const output = {
        sources: sources.map((s) => ({
          name: s.name,
          type: s.type,
          description: s.description,
        })),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
