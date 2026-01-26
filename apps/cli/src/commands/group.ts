import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx group - Manage source groups

Usage: lctx group <subcommand> [options]

Subcommands:
  add <name> <sources...>    Create a new group
  remove <name>              Delete a group
  list                       List all groups
  show <name>                Show group details

Options:
  -d, --description <text>   Description for the group (add only)
  -h, --help                 Show this help message

Examples:
  lctx group add ai-docs bun claude-code-docs mcp-typescript-sdk
  lctx group add tools mcp-typescript-sdk claude-plugins-official -d "Development tools"
  lctx group list
  lctx group show ai-docs
  lctx group remove ai-docs`;

export async function groupCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
      description: { type: "string", short: "d" },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  const [subcommand, ...rest] = positionals;
  const { groupManager, sourcesManager } = await createCoreModule();

  switch (subcommand) {
    case "add": {
      const [name, ...sources] = rest;
      if (!name || sources.length === 0) {
        console.error("Error: Group name and at least one source are required");
        console.log("\nUsage: lctx group add <name> <sources...>");
        process.exit(1);
      }

      // Validate that sources exist
      const existingSources = await sourcesManager.listSources();
      const existingNames = existingSources.map(
        (s: { name: string }) => s.name,
      );
      const invalidSources = sources.filter((s) => !existingNames.includes(s));

      if (invalidSources.length > 0) {
        console.error(`Error: Unknown sources: ${invalidSources.join(", ")}`);
        console.log(`Available sources: ${existingNames.join(", ")}`);
        process.exit(1);
      }

      await groupManager.create(name, sources, values.description);
      console.log(
        `Group '${name}' created with ${sources.length} source${sources.length > 1 ? "s" : ""}`,
      );
      break;
    }

    case "remove": {
      const [name] = rest;
      if (!name) {
        console.error("Error: Group name is required");
        console.log("\nUsage: lctx group remove <name>");
        process.exit(1);
      }

      await groupManager.delete(name);
      console.log(`Group '${name}' removed`);
      break;
    }

    case "list": {
      const groups = await groupManager.list();

      if (groups.length === 0) {
        console.log("No groups configured");
        console.log("\nCreate one with: lctx group add <name> <sources...>");
        return;
      }

      console.log("Groups:\n");
      console.log(`${"Name".padEnd(20)}${"Sources".padEnd(10)}Description`);
      console.log("-".repeat(60));

      for (const group of groups) {
        const row =
          group.name.padEnd(20) +
          String(group.sources.length).padEnd(10) +
          (group.description ?? "");
        console.log(row);
      }
      break;
    }

    case "show": {
      const [name] = rest;
      if (!name) {
        console.error("Error: Group name is required");
        console.log("\nUsage: lctx group show <name>");
        process.exit(1);
      }

      const group = await groupManager.get(name);
      if (!group) {
        console.error(`Error: Group '${name}' not found`);
        process.exit(1);
      }

      console.log(`Group: ${group.name}`);
      if (group.description) {
        console.log(`Description: ${group.description}`);
      }
      console.log(`\nSources (${group.sources.length}):`);
      for (const source of group.sources) {
        console.log(`  - ${source}`);
      }
      break;
    }

    default:
      console.error(`Unknown subcommand: ${subcommand}\n`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}
