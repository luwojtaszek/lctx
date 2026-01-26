import { stat } from "node:fs/promises";
import type { DirectorySource, SourceHealth } from "../shared";
import type { SourceManager } from "./source-manager";

/**
 * Manages directory sources as config-only references.
 * No file operations - linking is handled by agent runner.
 */
export class DirectorySourceManager implements SourceManager<DirectorySource> {
  readonly sourceType = "directory" as const;

  constructor(private readonly _sourcesDirectory: string) {}

  async add(_source: DirectorySource): Promise<void> {
    // No-op: config-only reference
  }

  async update(_source: DirectorySource): Promise<void> {
    // No-op: directory updates are outside our control
  }

  async delete(_source: DirectorySource): Promise<void> {
    // No-op: don't delete user's directories
  }

  getSourcePath(source: DirectorySource): string {
    return source.path;
  }

  async checkHealth(source: DirectorySource): Promise<SourceHealth> {
    try {
      const stats = await stat(source.path);
      if (!stats.isDirectory()) {
        return {
          name: source.name,
          type: "directory",
          status: "error",
          errorMessage: "Path is not a directory",
        };
      }
      return {
        name: source.name,
        type: "directory",
        status: "healthy",
        lastSynced: source.lastUpdated,
      };
    } catch {
      return {
        name: source.name,
        type: "directory",
        status: "error",
        errorMessage: "Directory not found",
      };
    }
  }
}
