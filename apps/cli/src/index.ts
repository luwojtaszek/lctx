#!/usr/bin/env bun
import { DefaultPathResolver, FileConfigManager } from "@lctx/core";
import { render } from "ink";
import { createElement } from "react";
import pkg from "../package.json";
import {
  addCommand,
  askCommand,
  chatCommand,
  listCommand,
  mcpCommand,
  removeCommand,
  syncCommand,
} from "./commands";
import { App } from "./components";

export const version: string = pkg.version;

const HELP_TEXT = `lctx - Local Context Manager

Usage: lctx <command> [options]

Run without arguments to start interactive mode.

Commands:
  sync [name]          Sync source(s)
  ask                  Ask a question using sources
  chat                 Start an interactive chat session
  mcp                  Start the MCP server
  help                 Show this help message

Legacy Commands (use interactive mode instead):
  add <name> <url>     Add a new source
  remove <name>        Remove a source
  list                 List all sources

Options:
  --help, -h           Show this help message
  --version, -v        Show version number

Run 'lctx <command> --help' for more information on a command.`;

// Commands that remain available in direct CLI mode
const persistentCommands = ["help", "ask", "chat", "mcp", "sync"];

// Legacy commands that show deprecation warning
const legacyCommands = ["add", "remove", "list"];

async function main(): Promise<void> {
  const args = Bun.argv.slice(2);
  const command = args[0];

  // No command - launch interactive mode
  if (!command) {
    render(createElement(App), { exitOnCtrlC: false });
    return;
  }

  // Show help
  if (command === "--help" || command === "-h" || command === "help") {
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

  // Legacy commands - show deprecation warning but still execute
  if (legacyCommands.includes(command)) {
    console.warn(
      `Warning: The '${command}' command is deprecated. Use interactive mode (run 'lctx' without arguments) instead.\n`,
    );
  }

  switch (command) {
    case "add":
      await addCommand(commandArgs);
      break;
    case "remove":
      await removeCommand(commandArgs);
      break;
    case "sync":
      await syncCommand(commandArgs);
      break;
    case "update":
      // Keep for backwards compatibility, redirect to sync
      console.warn(
        "Warning: 'update' has been renamed to 'sync'. Please use 'lctx sync' instead.\n",
      );
      await syncCommand(commandArgs);
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
    case "mcp":
      await mcpCommand();
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
