import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";
import type { MarketplaceCategory, MarketplaceItem } from "@lctx/core";

const HELP_TEXT = `lctx marketplace - Browse and install pre-configured source collections

Usage: lctx marketplace <subcommand> [options]

Subcommands:
  list                     List all available items
  search <query>           Search by name or tag
  info <id>                Show item details
  add <id>                 Install sources from item

Options:
  --category <cat>         Filter by category (ai, framework, runtime, tool)
  -h, --help               Show this help message

Examples:
  lctx marketplace list
  lctx marketplace list --category ai
  lctx marketplace search mcp
  lctx marketplace info anthropic
  lctx marketplace add anthropic`;

const CATEGORIES: MarketplaceCategory[] = [
  "ai",
  "framework",
  "runtime",
  "tool",
];

function formatItemTable(items: MarketplaceItem[]): void {
  if (items.length === 0) {
    console.log("No items found");
    return;
  }

  console.log(
    `${"Name".padEnd(20)}${"Category".padEnd(12)}${"Sources".padEnd(10)}Description`,
  );
  console.log("-".repeat(70));

  for (const item of items) {
    console.log(
      `${item.name.padEnd(20)}${item.category.padEnd(12)}${String(item.sources.length).padEnd(10)}${item.description}`,
    );
  }
}

export async function marketplaceCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
      category: { type: "string" },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  const [subcommand, ...rest] = positionals;
  const { marketplaceManager } = await createCoreModule();

  switch (subcommand) {
    case "list": {
      let items: MarketplaceItem[];

      if (values.category) {
        if (!CATEGORIES.includes(values.category as MarketplaceCategory)) {
          console.error(
            `Error: Invalid category. Valid categories: ${CATEGORIES.join(", ")}`,
          );
          process.exit(1);
        }
        items = marketplaceManager.getByCategory(
          values.category as MarketplaceCategory,
        );
      } else {
        items = marketplaceManager.list();
      }

      console.log("Available items:\n");
      formatItemTable(items);
      break;
    }

    case "search": {
      const [query] = rest;
      if (!query) {
        console.error("Error: Search query is required");
        console.log("\nUsage: lctx marketplace search <query>");
        process.exit(1);
      }

      const items = marketplaceManager.search(query);
      console.log(`Search results for "${query}":\n`);
      formatItemTable(items);
      break;
    }

    case "info": {
      const [id] = rest;
      if (!id) {
        console.error("Error: Item ID is required");
        console.log("\nUsage: lctx marketplace info <id>");
        process.exit(1);
      }

      const item = marketplaceManager.get(id);
      if (!item) {
        console.error(`Error: Item '${id}' not found`);
        process.exit(1);
      }

      console.log(`Name: ${item.name}`);
      console.log(`ID: ${item.id}`);
      console.log(`Category: ${item.category}`);
      console.log(`Description: ${item.description}`);
      console.log(`Tags: ${item.tags.join(", ")}`);
      console.log(`\nSources (${item.sources.length}):`);
      for (const source of item.sources) {
        console.log(`  - ${source.name} (${source.type})`);
        console.log(`    ${source.description}`);
        if (source.url) {
          console.log(`    URL: ${source.url}`);
        }
      }
      break;
    }

    case "add": {
      const [id] = rest;
      if (!id) {
        console.error("Error: Item ID is required");
        console.log("\nUsage: lctx marketplace add <id>");
        process.exit(1);
      }

      const item = marketplaceManager.get(id);
      if (!item) {
        console.error(`Error: Item '${id}' not found`);
        process.exit(1);
      }

      console.log(`Installing '${item.name}'...`);

      try {
        await marketplaceManager.install(id);
        console.log(`\n'${item.name}' installed successfully!`);
        console.log("\nAdded sources:");
        for (const source of item.sources) {
          console.log(`  - ${source.name} (${source.type})`);
        }
      } catch (error) {
        console.error(
          `Error: ${error instanceof Error ? error.message : "Installation failed"}`,
        );
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown subcommand: ${subcommand}\n`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}
