#!/usr/bin/env bun
import { DefaultPathResolver, FileConfigManager } from "@lctx/core";
import { render } from "ink";
import { createElement } from "react";
import pkg from "../package.json";
import {
  askCommand,
  chatCommand,
  groupCommand,
  healthCommand,
  marketplaceCommand,
  mcpCommand,
  sourceCommand,
  syncCommand,
  upgradeCommand,
} from "./commands";
import { App } from "./components";

export const version: string = pkg.version;

const HELP_TEXT = `lctx - Local Context Manager

Usage: lctx <command> [options]

Run without arguments to start interactive mode.

Commands:
  source               Manage sources (add, remove, list, sync)
  group                Manage source groups
  health [name]        Check health of sources
  marketplace          Browse and install source collections
  ask                  Ask a question using sources
  chat                 Start an interactive chat session
  mcp                  Start the MCP server
  upgrade              Check for and install updates
  help                 Show this help message

Options:
  --help, -h           Show this help message
  --version, -v        Show version number

Run 'lctx <command> --help' for more information on a command.`;

// Commands available in direct CLI mode
const availableCommands = [
  "help",
  "source",
  "group",
  "health",
  "marketplace",
  "ask",
  "chat",
  "mcp",
  "sync",
  "upgrade",
];

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

  switch (command) {
    case "source":
      await sourceCommand(commandArgs);
      break;
    case "group":
      await groupCommand(commandArgs);
      break;
    case "health":
      await healthCommand(commandArgs);
      break;
    case "marketplace":
      await marketplaceCommand(commandArgs);
      break;
    case "ask":
      await askCommand(commandArgs);
      break;
    case "chat":
      await chatCommand(commandArgs);
      break;
    case "sync":
      await syncCommand(commandArgs);
      break;
    case "mcp":
      await mcpCommand();
      break;
    case "upgrade":
      await upgradeCommand(commandArgs);
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
