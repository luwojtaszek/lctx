import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx chat - Start an interactive chat session with sources

Usage: lctx chat -s <sources...>

Options:
  -s, --sources <names...>  Source names to use (required, can specify multiple)
  -h, --help                Show this help message

Examples:
  lctx chat -s langchain
  lctx chat -s langchain langgraph`;

export async function chatCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      sources: { type: "string", short: "s", multiple: true },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  // Collect sources from -s flags and remaining positionals
  const sources: string[] = [...(values.sources || [])];

  for (const arg of positionals) {
    if (!arg.startsWith("-")) {
      sources.push(arg);
    }
  }

  if (sources.length === 0) {
    console.error("Error: At least one source is required (-s)\n");
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const { sourcesManager, subagentRunner } = await createCoreModule();

  // Validate all sources exist
  for (const name of sources) {
    const source = await sourcesManager.getSource(name);
    if (!source) {
      console.error(`Error: Source not found: ${name}`);
      process.exit(1);
    }
  }

  await subagentRunner.chat({ sources });
}
