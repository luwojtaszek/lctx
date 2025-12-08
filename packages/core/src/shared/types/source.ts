/**
 * Base interface for all source types
 */
export interface BaseSource {
  name: string;
  description?: string;
  lastUpdated?: string;
}

/**
 * Git repository source
 */
export interface GitRepositorySource extends BaseSource {
  type: "git";
  url: string;
  branch?: string;
}

/**
 * Documentation URL source (llms.txt or web scraping)
 */
export interface DocsSource extends BaseSource {
  type: "docs";
  url: string;
}

/**
 * Single file source by absolute path
 */
export interface FileSource extends BaseSource {
  type: "file";
  path: string;
}

/**
 * Directory source by absolute path
 */
export interface DirectorySource extends BaseSource {
  type: "directory";
  path: string;
}

/**
 * Discriminated union of all source types
 */
export type Source =
  | GitRepositorySource
  | DocsSource
  | FileSource
  | DirectorySource;

/**
 * Union of all source type discriminators
 */
export type SourceType = Source["type"];

/**
 * Resolved source with name and filesystem path
 */
export interface SourcePath {
  name: string;
  path: string;
}
