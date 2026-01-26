import { parseArgs } from "node:util";
import { createCoreModule } from "@lctx/core";
import type { SourceHealth } from "@lctx/core";

const HELP_TEXT = `lctx health - Check health of sources

Usage: lctx health [name]

Arguments:
  name    Name of the source to check (optional, checks all if omitted)

Options:
  --json          Output as JSON
  -h, --help      Show this help message

Examples:
  lctx health                # Check all sources
  lctx health bun            # Check specific source
  lctx health --json         # Output as JSON`;

function formatStatus(status: SourceHealth["status"]): string {
  switch (status) {
    case "healthy":
      return "\x1b[32mhealthy\x1b[0m";
    case "stale":
      return "\x1b[33mstale\x1b[0m";
    case "error":
      return "\x1b[31merror\x1b[0m";
    default:
      return "\x1b[90munknown\x1b[0m";
  }
}

function formatDetails(health: SourceHealth): string {
  const parts: string[] = [];

  if (health.errorMessage) {
    return health.errorMessage;
  }

  if (health.staleDays !== undefined) {
    parts.push(`${health.staleDays}d old`);
  }

  if (
    health.details?.behindCommits !== undefined &&
    health.details.behindCommits > 0
  ) {
    parts.push(`${health.details.behindCommits} commits behind`);
  }

  if (health.details?.currentBranch) {
    parts.push(`branch: ${health.details.currentBranch}`);
  }

  if (health.details?.localSize !== undefined) {
    const sizeKb = Math.round(health.details.localSize / 1024);
    parts.push(`${sizeKb} KB`);
  }

  return parts.join(", ");
}

export async function healthCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
      json: { type: "boolean" },
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
    // Check specific source
    const health = await sourcesManager.checkHealth(name);
    if (!health) {
      console.error(`Error: Source not found: ${name}`);
      process.exit(1);
    }

    if (values.json) {
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.log(`Source: ${health.name}`);
      console.log(`Type: ${health.type}`);
      console.log(`Status: ${formatStatus(health.status)}`);
      if (health.lastSynced) {
        console.log(`Last Synced: ${health.lastSynced}`);
      }
      const details = formatDetails(health);
      if (details) {
        console.log(`Details: ${details}`);
      }
    }
  } else {
    // Check all sources
    const healthResults = await sourcesManager.checkHealthAll();

    if (healthResults.length === 0) {
      console.log("No sources configured");
      return;
    }

    if (values.json) {
      console.log(JSON.stringify(healthResults, null, 2));
    } else {
      console.log("Source Health:\n");
      console.log(
        `${"Name".padEnd(25)}${"Type".padEnd(12)}${"Status".padEnd(10)}Details`,
      );
      console.log("-".repeat(70));

      for (const health of healthResults) {
        const statusText =
          health.status === "healthy"
            ? "\x1b[32mhealthy\x1b[0m"
            : health.status === "stale"
              ? "\x1b[33mstale\x1b[0m  "
              : health.status === "error"
                ? "\x1b[31merror\x1b[0m  "
                : "\x1b[90munknown\x1b[0m";

        const details = formatDetails(health);
        console.log(
          `${health.name.padEnd(25)}${health.type.padEnd(12)}${statusText}  ${details}`,
        );
      }
    }
  }
}
