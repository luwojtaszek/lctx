import { mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import type { DocsSource, SourceHealth } from "../shared";
import type { SourceManager } from "./source-manager";

/**
 * Manages documentation sources fetched from URLs.
 * Stores fetched content in `${sourcesDirectory}/docs/${name}/`
 */
export class DocsSourceManager implements SourceManager<DocsSource> {
  readonly sourceType = "docs" as const;

  constructor(private readonly sourcesDirectory: string) {}

  async add(source: DocsSource): Promise<void> {
    const targetDir = this.getSourcePath(source);
    await mkdir(join(this.sourcesDirectory, "docs"), { recursive: true });

    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
    }

    const content = await response.text();
    await mkdir(targetDir, { recursive: true });
    await Bun.write(join(targetDir, "content.txt"), content);
  }

  async update(source: DocsSource): Promise<void> {
    await this.add(source);
  }

  async delete(source: DocsSource): Promise<void> {
    const targetPath = this.getSourcePath(source);
    await rm(targetPath, { recursive: true, force: true });
  }

  getSourcePath(source: DocsSource): string {
    return join(this.sourcesDirectory, "docs", source.name);
  }

  async checkHealth(source: DocsSource): Promise<SourceHealth> {
    const targetPath = this.getSourcePath(source);
    const contentPath = join(targetPath, "content.txt");

    try {
      // Check if local file exists
      const fileStat = await stat(contentPath);
      const localSize = fileStat.size;

      // Calculate staleness based on lastUpdated
      let staleDays: number | undefined;
      if (source.lastUpdated) {
        const lastUpdatedDate = new Date(source.lastUpdated);
        const now = new Date();
        staleDays = Math.floor(
          (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Check remote availability with HEAD request
      let remoteModified: string | undefined;
      try {
        const response = await fetch(source.url, { method: "HEAD" });
        if (response.ok) {
          remoteModified = response.headers.get("last-modified") ?? undefined;
        }
      } catch {
        // Ignore remote check errors
      }

      // Determine status
      let status: SourceHealth["status"] = "healthy";
      if (staleDays !== undefined && staleDays > 7) {
        status = "stale";
      }

      return {
        name: source.name,
        type: "docs",
        status,
        lastSynced: source.lastUpdated,
        staleDays,
        details: {
          remoteModified,
          localSize,
        },
      };
    } catch {
      return {
        name: source.name,
        type: "docs",
        status: "error",
        errorMessage: "Documentation file not found locally",
      };
    }
  }
}
