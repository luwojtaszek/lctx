import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx update - Update source(s)

Usage: lctx update [name]

Arguments:
  name    Name of the source to update (optional, updates all if omitted)

Options:
  -h, --help    Show this help message

Examples:
  lctx update langchain    # Update single source
  lctx update              # Update all sources`;

export async function updateCommand(args: string[]): Promise<void> {
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
  const { sourcesManager } = await createCoreModule();

  if (name) {
    const source = await sourcesManager.getSource(name);
    if (!source) {
      console.error(`Error: Source not found: ${name}`);
      process.exit(1);
    }

    await sourcesManager.update(name);
    console.log(`Updated source: ${name}`);
  } else {
    await sourcesManager.updateAll();
    console.log("Updated all sources");
  }
}
