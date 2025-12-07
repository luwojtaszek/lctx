import { z } from "zod";

const BaseSourceSchema = z.object({
  name: z.string(),
  lastUpdated: z.string().optional(),
});

const GitRepositorySourceSchema = BaseSourceSchema.extend({
  type: z.literal("git"),
  url: z.string(),
  branch: z.string().optional(),
});

const DocsSourceSchema = BaseSourceSchema.extend({
  type: z.literal("docs"),
  url: z.string(),
});

const FileSourceSchema = BaseSourceSchema.extend({
  type: z.literal("file"),
  path: z.string(),
});

const DirectorySourceSchema = BaseSourceSchema.extend({
  type: z.literal("directory"),
  path: z.string(),
});

export const SourceSchema = z.discriminatedUnion("type", [
  GitRepositorySourceSchema,
  DocsSourceSchema,
  FileSourceSchema,
  DirectorySourceSchema,
]);
