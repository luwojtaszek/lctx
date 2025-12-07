/**
 * Base interface for all source types
 */
export interface BaseSource {
  name: string;
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
