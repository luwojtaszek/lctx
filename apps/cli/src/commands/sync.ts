import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx sync - Sync source(s)

Usage: lctx sync [name]

Arguments:
  name    Name of the source to sync (optional, syncs all if omitted)

Options:
  -h, --help    Show this help message

Examples:
  lctx sync langchain    # Sync single source
  lctx sync              # Sync all sources`;

export async function syncCommand(args: string[]): Promise<void> {
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
    console.log(`Synced source: ${name}`);
  } else {
    await sourcesManager.updateAll();
    console.log("Synced all sources");
  }
}
