import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx ask - Ask a question using sources

Usage: lctx ask -s <sources...> -q <question>

Options:
  -s, --sources <names...>  Source names to use (required, can specify multiple)
  -q, --question <text>     Question to ask (required)
  -h, --help                Show this help message

Examples:
  lctx ask -s langchain -q "How do I create a tool?"
  lctx ask -s langchain langgraph -q "What is the difference between these?"`;

export async function askCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      sources: { type: "string", short: "s", multiple: true },
      question: { type: "string", short: "q" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  // Collect sources from -s flags and remaining positionals before -q
  const sources: string[] = [...(values.sources || [])];

  // Add positional args as sources (for: lctx ask -s langchain langgraph -q "...")
  for (const arg of positionals) {
    if (!arg.startsWith("-")) {
      sources.push(arg);
    }
  }

  const question = values.question;

  if (sources.length === 0) {
    console.error("Error: At least one source is required (-s)\n");
    console.log(HELP_TEXT);
    process.exit(1);
  }

  if (!question) {
    console.error("Error: Question is required (-q)\n");
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

  const result = await subagentRunner.ask({ sources, question });
  console.log(result.answer);
}
