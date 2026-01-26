import { homedir } from "node:os";
import { parseArgs } from "node:util";
import type { Source } from "@lctx/core";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx source - Manage sources

Usage: lctx source <subcommand> [options]

Subcommands:
  add <name> <url>       Add a new source
  remove <name>          Remove a source
  list                   List all sources
  show <name>            Show source details
  sync [name]            Sync source(s)

Options:
  -t, --type <type>      Source type (git, docs, file, directory)
  -b, --branch <branch>  Branch to clone (git only)
  -d, --description      Description for the source
  -h, --help             Show this help message

Examples:
  lctx source add langchain https://github.com/langchain-ai/langchain
  lctx source add bun-docs https://bun.sh/llms.txt -t docs
  lctx source list
  lctx source show langchain
  lctx source sync langchain
  lctx source remove langchain`;

const BOX_WIDTH = 65;
const LABEL_WIDTH = 10;
const CONTENT_WIDTH = BOX_WIDTH - 4;

function shortenHome(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

function truncateStart(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `...${text.slice(-(maxLen - 3))}`;
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line.length + word.length + 1 <= maxLen) {
      line = line ? `${line} ${word}` : word;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  return lines;
}

function getRemoteLocation(source: Source): string | undefined {
  if (source.type === "git" || source.type === "docs") {
    return source.url;
  }
  return undefined;
}

function getSourcePath(source: Source): string | undefined {
  if (source.type === "file" || source.type === "directory") {
    return source.path;
  }
  return undefined;
}

interface FormattedSource {
  source: Source;
  localPath: string;
}

function formatSourceBox({ source, localPath }: FormattedSource): string {
  const lines: string[] = [];

  const namePart = `─ ${source.name} `;
  const topBorder = `┌${namePart}${"─".repeat(BOX_WIDTH - 1 - namePart.length)}┐`;
  lines.push(topBorder);

  if (source.description) {
    const descLines = wrapText(source.description, CONTENT_WIDTH);
    for (const descLine of descLines) {
      lines.push(`│  ${descLine.padEnd(CONTENT_WIDTH)} │`);
    }
    lines.push(`│${" ".repeat(BOX_WIDTH - 1)}│`);
  }

  const addField = (label: string, value: string) => {
    const labelPadded = `${label}:`.padEnd(LABEL_WIDTH);
    const availableWidth = CONTENT_WIDTH - LABEL_WIDTH;
    const truncatedValue = truncateStart(value, availableWidth);
    lines.push(`│  ${labelPadded}${truncatedValue.padEnd(availableWidth)} │`);
  };

  addField("Type", source.type);

  const remoteUrl = getRemoteLocation(source);
  if (remoteUrl) {
    addField("Remote", remoteUrl);
  }

  const sourcePath = getSourcePath(source);
  if (sourcePath) {
    addField("Path", shortenHome(sourcePath));
  } else {
    addField("Local", shortenHome(localPath));
  }

  if (source.lastUpdated) {
    addField("Updated", source.lastUpdated);
  }

  lines.push(`└${"─".repeat(BOX_WIDTH - 1)}┘`);

  return lines.join("\n");
}

export async function sourceCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
      type: { type: "string", short: "t", default: "git" },
      branch: { type: "string", short: "b" },
      description: { type: "string", short: "d" },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  const [subcommand, ...rest] = positionals;
  const { sourcesManager } = await createCoreModule();

  switch (subcommand) {
    case "add": {
      const [name, urlOrPath] = rest;
      if (!name || !urlOrPath) {
        console.error("Error: Both <name> and <url-or-path> are required");
        console.log("\nUsage: lctx source add <name> <url-or-path>");
        process.exit(1);
      }

      const sourceType = values.type as "git" | "file" | "directory" | "docs";

      let source: Source;
      switch (sourceType) {
        case "git":
          source = {
            type: "git",
            name,
            description: values.description,
            url: urlOrPath,
            branch: values.branch,
          };
          break;
        case "file":
          source = {
            type: "file",
            name,
            description: values.description,
            path: urlOrPath,
          };
          break;
        case "directory":
          source = {
            type: "directory",
            name,
            description: values.description,
            path: urlOrPath,
          };
          break;
        case "docs":
          source = {
            type: "docs",
            name,
            description: values.description,
            url: urlOrPath,
          };
          break;
        default:
          console.error(`Error: Unknown source type: ${sourceType}`);
          console.log("Valid types: git, file, directory, docs");
          process.exit(1);
      }

      await sourcesManager.add(source);
      console.log(`Added source: ${name} (${sourceType})`);
      break;
    }

    case "remove": {
      const [name] = rest;
      if (!name) {
        console.error("Error: Source name is required");
        console.log("\nUsage: lctx source remove <name>");
        process.exit(1);
      }

      const source = await sourcesManager.getSource(name);
      if (!source) {
        console.error(`Error: Source not found: ${name}`);
        process.exit(1);
      }

      await sourcesManager.delete(name);
      console.log(`Removed source: ${name}`);
      break;
    }

    case "list": {
      const sources = await sourcesManager.listSources();

      if (sources.length === 0) {
        console.log("No sources configured.");
        console.log("\nRun 'lctx source add <name> <url>' to add a source.");
        return;
      }

      console.log("Configured sources:\n");

      for (const source of sources) {
        const sourcePath = await sourcesManager.getSourcePath(source.name);
        const localPath = sourcePath?.path ?? "";

        console.log(formatSourceBox({ source, localPath }));
        console.log();
      }
      break;
    }

    case "show": {
      const [name] = rest;
      if (!name) {
        console.error("Error: Source name is required");
        console.log("\nUsage: lctx source show <name>");
        process.exit(1);
      }

      const source = await sourcesManager.getSource(name);
      if (!source) {
        console.error(`Error: Source '${name}' not found`);
        process.exit(1);
      }

      const sourcePath = await sourcesManager.getSourcePath(name);
      const localPath = sourcePath?.path ?? "";

      console.log(formatSourceBox({ source, localPath }));
      break;
    }

    case "sync": {
      const [name] = rest;

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
      break;
    }

    default:
      console.error(`Unknown subcommand: ${subcommand}\n`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}
