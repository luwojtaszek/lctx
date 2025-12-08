import type { FileSource } from "../shared";
import type { SourceManager } from "./source-manager";

/**
 * Manages file sources as config-only references.
 * No file operations - linking is handled by agent runner.
 */
export class FileSourceManager implements SourceManager<FileSource> {
  readonly sourceType = "file" as const;

  constructor(private readonly _sourcesDirectory: string) {}

  async add(_source: FileSource): Promise<void> {
    // No-op: config-only reference
  }

  async update(_source: FileSource): Promise<void> {
    // No-op: file updates are outside our control
  }

  async delete(_source: FileSource): Promise<void> {
    // No-op: don't delete user's files
  }

  getSourcePath(source: FileSource): string {
    return source.path;
  }
}
