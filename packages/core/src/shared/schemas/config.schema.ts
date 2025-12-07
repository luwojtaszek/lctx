import { z } from "zod";
import { SourceSchema } from "./source.schema.ts";

export const AgentConfigSchema = z.object({
  commands: z.object({
    chat: z.string(),
    ask: z.string(),
  }),
  mcpConfigFile: z.string().optional(),
});

export const LctxConfigSchema = z.object({
  sourcesDirectory: z.string(),
  sources: z.array(SourceSchema),
  agents: z.record(z.string(), AgentConfigSchema),
  defaultAgent: z.string(),
});
