import { z } from "zod";
import { SourceSchema } from "./source.schema.ts";

export const AgentConfigSchema = z.object({
  commands: z.object({
    chat: z.string(),
    ask: z.string(),
  }),
  addDirFlag: z.string().optional(),
  mcp: z
    .object({
      path: z.string(),
      config: z.record(z.string(), z.unknown()),
    })
    .optional(),
});

export const LctxConfigSchema = z.object({
  sourcesDirectory: z.string(),
  sources: z.array(SourceSchema),
  agents: z.record(z.string(), AgentConfigSchema),
  defaultAgent: z.string(),
});
