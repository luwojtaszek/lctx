import { homedir } from "node:os";
import { join } from "node:path";
import { version as currentVersion } from "../../package.json";

const GITHUB_REPO = "luwojtaszek/lctx";
const CACHE_DIR = join(homedir(), ".cache", "lctx");
const CACHE_FILE = join(CACHE_DIR, "version-check.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface VersionInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

interface CacheData {
  latest: string;
  releaseUrl: string;
  timestamp: number;
}

async function readCache(): Promise<CacheData | null> {
  try {
    const file = Bun.file(CACHE_FILE);
    if (!(await file.exists())) {
      return null;
    }
    const data = await file.json();
    if (Date.now() - data.timestamp < CACHE_TTL_MS) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(data: CacheData): Promise<void> {
  try {
    await Bun.write(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Silently fail - cache is optional
  }
}

async function ensureCacheDir(): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // Silently fail
  }
}

async function fetchLatestRelease(): Promise<{ version: string; url: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "lctx-cli",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    tag_name: string;
    html_url: string;
  };
  const tagName = data.tag_name;
  const version = tagName.startsWith("v") ? tagName.slice(1) : tagName;

  return {
    version,
    url: data.html_url,
  };
}

function compareVersions(current: string, latest: string): boolean {
  const parseCurrent = current.split(".").map(Number);
  const parseLatest = latest.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const c = parseCurrent[i] || 0;
    const l = parseLatest[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export async function checkForUpdates(options?: {
  skipCache?: boolean;
}): Promise<VersionInfo> {
  const skipCache = options?.skipCache ?? false;

  // Try cache first
  if (!skipCache) {
    const cached = await readCache();
    if (cached) {
      return {
        current: currentVersion,
        latest: cached.latest,
        hasUpdate: compareVersions(currentVersion, cached.latest),
        releaseUrl: cached.releaseUrl,
      };
    }
  }

  // Fetch from GitHub
  const { version: latest, url: releaseUrl } = await fetchLatestRelease();

  // Cache the result
  await ensureCacheDir();
  await writeCache({
    latest,
    releaseUrl,
    timestamp: Date.now(),
  });

  return {
    current: currentVersion,
    latest,
    hasUpdate: compareVersions(currentVersion, latest),
    releaseUrl,
  };
}

export function getCurrentVersion(): string {
  return currentVersion;
}

export function getPlatformInfo(): { os: string; arch: string } {
  const os = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return { os, arch };
}

export function getDownloadUrl(version: string): string {
  const { os, arch } = getPlatformInfo();
  const artifact = `lctx-${os}-${arch}.tar.gz`;
  const tag = version.startsWith("v") ? version : `v${version}`;
  return `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${artifact}`;
}

export function getChecksumsUrl(version: string): string {
  const tag = version.startsWith("v") ? version : `v${version}`;
  return `https://github.com/${GITHUB_REPO}/releases/download/${tag}/checksums.txt`;
}
