import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { DocsSource } from "../shared";
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
}
