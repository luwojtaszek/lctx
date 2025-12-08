import { parseArgs } from "node:util";
import type { Source } from "@lctx/core";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx add - Add a new source

Usage: lctx add <name> <url-or-path> [options]

Arguments:
  name          Unique name for the source
  url-or-path   URL (git/docs) or file path (file/directory)

Options:
  -b, --branch <branch>       Branch to clone (git only, default: main)
  -t, --type <type>           Source type: git, file, directory, docs (default: git)
  -d, --description <text>    Description of the source
  -h, --help                  Show this help message

Examples:
  lctx add langchain https://github.com/langchain-ai/langchain
  lctx add langchain https://github.com/langchain-ai/langchain -b develop
  lctx add readme /path/to/README.md -t file
  lctx add src /path/to/src -t directory
  lctx add bun-docs https://bun.sh/llms.txt -t docs`;

export async function addCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      branch: { type: "string", short: "b" },
      type: { type: "string", short: "t", default: "git" },
      description: { type: "string", short: "d" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  const [name, urlOrPath] = positionals;

  if (!name || !urlOrPath) {
    console.error("Error: Both <name> and <url-or-path> are required\n");
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const sourceType = values.type as "git" | "file" | "directory" | "docs";

  let source: Source;
  switch (sourceType) {
    case "git":
      source = {
        type: "git",
        name,
        description: values.description,
        url: urlOrPath,
        branch: values.branch,
      };
      break;
    case "file":
      source = {
        type: "file",
        name,
        description: values.description,
        path: urlOrPath,
      };
      break;
    case "directory":
      source = {
        type: "directory",
        name,
        description: values.description,
        path: urlOrPath,
      };
      break;
    case "docs":
      source = {
        type: "docs",
        name,
        description: values.description,
        url: urlOrPath,
      };
      break;
    default:
      console.error(`Error: Unknown source type: ${sourceType}`);
      console.log("Valid types: git, file, directory, docs");
      process.exit(1);
  }

  const { sourcesManager } = await createCoreModule();
  await sourcesManager.add(source);
  console.log(`Added source: ${name} (${sourceType})`);
}
