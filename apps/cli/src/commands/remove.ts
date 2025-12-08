import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx remove - Remove a source

Usage: lctx remove <name>

Arguments:
  name    Name of the source to remove

Options:
  -h, --help    Show this help message

Examples:
  lctx remove langchain`;

export async function removeCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
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

  const [name] = positionals;

  if (!name) {
    console.error("Error: <name> is required\n");
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const { sourcesManager } = await createCoreModule();
  const source = await sourcesManager.getSource(name);

  if (!source) {
    console.error(`Error: Source not found: ${name}`);
    process.exit(1);
  }

  await sourcesManager.delete(name);
  console.log(`Removed source: ${name}`);
}
