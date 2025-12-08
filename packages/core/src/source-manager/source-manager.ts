import type { Source } from "../shared";

/**
 * Interface for type-specific source operations with internal path handling.
 * Each implementation handles a specific source type (git, file, directory, etc.)
 */
export interface SourceManager<T extends Source> {
  readonly sourceType: T["type"];

  add(source: T): Promise<void>;
  update(source: T): Promise<void>;
  delete(source: T): Promise<void>;
  getSourcePath(source: T): string;
}
