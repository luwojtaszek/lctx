import type { SourcesManager, SubagentRunner } from "@lctx/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

export function registerAskSourcesTool(
  server: McpServer,
  subagentRunner: SubagentRunner,
  sourcesManager: SourcesManager,
): void {
  server.registerTool(
    "ask_sources",
    {
      title: "Ask Sources",
      description:
        "Spawns an AI subagent to query the specified sources and answer a question",
      inputSchema: {
        sources: z.array(z.string()).describe("Names of sources to query"),
        question: z.string().describe("Question to ask about the sources"),
      },
      outputSchema: {
        answer: z.string().describe("Answer from the subagent"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ sources, question }) => {
      // Validate sources exist
      for (const name of sources) {
        const source = await sourcesManager.getSource(name);
        if (!source) {
          throw new Error(`Source not found: ${name}`);
        }
      }

      const result = await subagentRunner.ask({ sources, question });
      const output = { answer: result.answer };

      return {
        content: [{ type: "text", text: result.answer }],
        structuredContent: output,
      };
    },
  );
}
