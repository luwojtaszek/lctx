import { existsSync, statSync } from "node:fs";

/**
 * Validates a git repository URL (HTTPS or SSH format)
 * Supports any git host (GitHub, GitLab, Bitbucket, self-hosted, etc.)
 */
export function validateGitUrl(url: string): string | null {
  if (!url.trim()) {
    return "URL is required";
  }

  // HTTPS format: https://host/path
  const httpsPattern = /^https:\/\/[^/]+\/.+$/;
  // SSH format: git@host:path or ssh://git@host/path
  const sshPattern = /^(git@[^:]+:.+|ssh:\/\/git@[^/]+\/.+)$/;

  if (httpsPattern.test(url) || sshPattern.test(url)) {
    return null;
  }

  return "Invalid git URL. Use HTTPS (https://host/repo) or SSH (git@host:repo)";
}

/**
 * Validates a documentation URL (HTTP or HTTPS)
 */
export function validateDocsUrl(url: string): string | null {
  if (!url.trim()) {
    return "URL is required";
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return null;
    }
    return "URL must use HTTP or HTTPS";
  } catch {
    return "Invalid URL format";
  }
}

/**
 * Validates a file path (must exist and be a file)
 */
export function validateFilePath(path: string): string | null {
  if (!path.trim()) {
    return "Path is required";
  }

  const expandedPath = path.startsWith("~")
    ? path.replace("~", process.env.HOME || "")
    : path;

  if (!existsSync(expandedPath)) {
    return "File does not exist";
  }

  try {
    const stats = statSync(expandedPath);
    if (!stats.isFile()) {
      return "Path is not a file";
    }
  } catch {
    return "Cannot access file";
  }

  return null;
}

/**
 * Validates a directory path (must exist and be a directory)
 */
export function validateDirectoryPath(path: string): string | null {
  if (!path.trim()) {
    return "Path is required";
  }

  const expandedPath = path.startsWith("~")
    ? path.replace("~", process.env.HOME || "")
    : path;

  if (!existsSync(expandedPath)) {
    return "Directory does not exist";
  }

  try {
    const stats = statSync(expandedPath);
    if (!stats.isDirectory()) {
      return "Path is not a directory";
    }
  } catch {
    return "Cannot access directory";
  }

  return null;
}

/**
 * Validates a required string field
 */
export function validateRequired(value: string): string | null {
  if (!value.trim()) {
    return "This field is required";
  }
  return null;
}

/**
 * Validates source name (required, no spaces or special chars)
 */
export function validateSourceName(name: string): string | null {
  if (!name.trim()) {
    return "Name is required";
  }

  // Allow alphanumeric, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(name)) {
    return "Name can only contain letters, numbers, hyphens, and underscores";
  }

  return null;
}
