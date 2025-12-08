#!/usr/bin/env bun
import { DefaultPathResolver, FileConfigManager, version } from "@lctx/core";
import {
  addCommand,
  askCommand,
  chatCommand,
  listCommand,
  removeCommand,
  updateCommand,
} from "./commands";

const HELP_TEXT = `lctx - Local Context Manager

Usage: lctx <command> [options]

Commands:
  add <name> <url>     Add a new source
  remove <name>        Remove a source
  update [name]        Update source(s)
  list                 List all sources
  ask                  Ask a question using sources
  chat                 Start an interactive chat session

Options:
  --help, -h           Show this help message
  --version, -v        Show version number

Run 'lctx <command> --help' for more information on a command.`;

async function main(): Promise<void> {
  const args = Bun.argv.slice(2);
  const command = args[0];

  // Show help if no command or if --help/-h is first arg (not subcommand help)
  if (!command || command === "--help" || command === "-h") {
    const pathResolver = new DefaultPathResolver();
    const configManager = new FileConfigManager(pathResolver);
    console.log(HELP_TEXT);
    console.log(
      `\nConfig: ${configManager.expandPath(configManager.configPath)}`,
    );
    return;
  }

  // Show version if --version/-v is first arg
  if (command === "--version" || command === "-v") {
    console.log(version);
    return;
  }
  const commandArgs = args.slice(1);

  switch (command) {
    case "add":
      await addCommand(commandArgs);
      break;
    case "remove":
      await removeCommand(commandArgs);
      break;
    case "update":
      await updateCommand(commandArgs);
      break;
    case "list":
      await listCommand(commandArgs);
      break;
    case "ask":
      await askCommand(commandArgs);
      break;
    case "chat":
      await chatCommand(commandArgs);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
