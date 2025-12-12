import { homedir } from "node:os";
import { parseArgs } from "node:util";
import type { Source } from "@lctx/core";
import { createCoreModule } from "@lctx/core";

const HELP_TEXT = `lctx list - List all configured sources

Usage: lctx list

Options:
  -h, --help    Show this help message`;

const BOX_WIDTH = 65;
const LABEL_WIDTH = 10;
const CONTENT_WIDTH = BOX_WIDTH - 4; // Account for "│  " prefix and " " suffix

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

  // Top border with name
  const namePart = `─ ${source.name} `;
  const topBorder = `┌${namePart}${"─".repeat(BOX_WIDTH - 1 - namePart.length)}┐`;
  lines.push(topBorder);

  // Description (wrapped)
  if (source.description) {
    const descLines = wrapText(source.description, CONTENT_WIDTH);
    for (const descLine of descLines) {
      lines.push(`│  ${descLine.padEnd(CONTENT_WIDTH)} │`);
    }
    lines.push(`│${" ".repeat(BOX_WIDTH - 1)}│`);
  }

  // Field helper
  const addField = (label: string, value: string) => {
    const labelPadded = `${label}:`.padEnd(LABEL_WIDTH);
    const availableWidth = CONTENT_WIDTH - LABEL_WIDTH;
    const truncatedValue = truncateStart(value, availableWidth);
    lines.push(`│  ${labelPadded}${truncatedValue.padEnd(availableWidth)} │`);
  };

  // Type
  addField("Type", source.type);

  // Remote URL (for git/docs)
  const remoteUrl = getRemoteLocation(source);
  if (remoteUrl) {
    addField("Remote", remoteUrl);
  }

  // Local path
  const sourcePath = getSourcePath(source);
  if (sourcePath) {
    // file/directory sources - just show Path
    addField("Path", shortenHome(sourcePath));
  } else {
    // git/docs sources - show Local
    addField("Local", shortenHome(localPath));
  }

  // Last updated
  if (source.lastUpdated) {
    addField("Updated", source.lastUpdated);
  }

  // Bottom border
  lines.push(`└${"─".repeat(BOX_WIDTH - 1)}┘`);

  return lines.join("\n");
}

export async function listCommand(args: string[]): Promise<void> {
  const { values } = parseArgs({
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

  const { sourcesManager } = await createCoreModule();
  const sources = await sourcesManager.listSources();

  if (sources.length === 0) {
    console.log("No sources configured.");
    console.log("\nRun 'lctx add <name> <url>' to add a source.");
    return;
  }

  console.log("Configured sources:\n");

  for (const source of sources) {
    const sourcePath = await sourcesManager.getSourcePath(source.name);
    const localPath = sourcePath?.path ?? "";

    console.log(formatSourceBox({ source, localPath }));
    console.log();
  }
}
