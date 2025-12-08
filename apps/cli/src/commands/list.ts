import { parseArgs } from "node:util";
import type { Source } from "@lctx/core";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx list - List all configured sources

Usage: lctx list

Options:
  -h, --help    Show this help message`;

function getSourceLocation(source: Source): string {
  switch (source.type) {
    case "git":
      return source.url;
    case "docs":
      return source.url;
    case "file":
      return source.path;
    case "directory":
      return source.path;
  }
}

export async function listCommand(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  const { sourcesManager } = await createCoreModule();
  const sources = await sourcesManager.listSources();

  if (sources.length === 0) {
    console.log("No sources configured.");
    console.log("\nRun 'lctx add <name> <url>' to add a source.");
    return;
  }

  console.log("Configured sources:\n");
  for (const source of sources) {
    const location = getSourceLocation(source);
    console.log(`  ${source.name}`);
    if (source.description) {
      console.log(`    ${source.description}`);
    }
    console.log(`    Type: ${source.type}`);
    console.log(`    Location: ${location}`);
    if (source.lastUpdated) {
      console.log(`    Last updated: ${source.lastUpdated}`);
    }
    console.log();
  }
}
