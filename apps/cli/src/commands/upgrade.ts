import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  checkForUpdates,
  getChecksumsUrl,
  getDownloadUrl,
  getPlatformInfo,
} from "../shared";

const HELP_TEXT = `lctx upgrade - Check for and install updates

Usage: lctx upgrade [options]

Options:
  -c, --check    Check for updates without installing
  -h, --help     Show this help message

Examples:
  lctx upgrade         # Upgrade to latest version
  lctx upgrade --check # Check if updates are available`;

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`,
    );
  }
  const buffer = await response.arrayBuffer();
  await Bun.write(dest, buffer);
}

async function verifyChecksum(
  filePath: string,
  version: string,
  expectedName: string,
): Promise<boolean> {
  try {
    const checksumsUrl = getChecksumsUrl(version);
    const response = await fetch(checksumsUrl);
    if (!response.ok) {
      console.warn(
        "Warning: Could not download checksums, skipping verification",
      );
      return true;
    }

    const checksums = await response.text();
    const lines = checksums.split("\n");
    const expectedLine = lines.find((line) => line.includes(expectedName));

    if (!expectedLine) {
      console.warn(
        "Warning: Could not find checksum for artifact, skipping verification",
      );
      return true;
    }

    const expectedHash = expectedLine.split(/\s+/)[0];

    const file = Bun.file(filePath);
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHash !== actualHash) {
      console.error("Checksum verification failed!");
      console.error(`Expected: ${expectedHash}`);
      console.error(`Actual: ${actualHash}`);
      return false;
    }

    console.log("Checksum verified");
    return true;
  } catch (error) {
    console.warn(`Warning: Checksum verification failed: ${error}`);
    return true;
  }
}

async function extractTarball(
  tarballPath: string,
  destDir: string,
): Promise<void> {
  const proc = Bun.spawn(["tar", "-xzf", tarballPath, "-C", destDir], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Failed to extract tarball: ${stderr}`);
  }
}

async function replaceCurrentBinary(newBinaryPath: string): Promise<void> {
  // Get the path to the current executable
  const currentExe = process.execPath;

  // For compiled binaries, we need to replace the actual binary
  // For bun run, process.execPath is bun itself, so we should warn
  if (currentExe.includes("bun")) {
    console.log("");
    console.log(
      "Note: You appear to be running lctx via bun (development mode).",
    );
    console.log("The upgrade command works with compiled binaries.");
    console.log("");
    console.log("To upgrade manually, download the binary from:");
    const info = await checkForUpdates({ skipCache: true });
    console.log(info.releaseUrl);
    return;
  }

  // Create backup
  const backupPath = `${currentExe}.backup`;
  const fs = await import("node:fs/promises");

  try {
    await fs.rename(currentExe, backupPath);
  } catch (error) {
    throw new Error(`Failed to create backup: ${error}`);
  }

  try {
    await fs.rename(newBinaryPath, currentExe);
    await fs.chmod(currentExe, 0o755);
    // Remove backup on success
    await fs.unlink(backupPath).catch(() => {});
  } catch (error) {
    // Try to restore backup
    await fs.rename(backupPath, currentExe).catch(() => {});
    throw new Error(`Failed to replace binary: ${error}`);
  }
}

export async function upgradeCommand(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h" },
      check: { type: "boolean", short: "c" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  console.log("Checking for updates...");

  try {
    const info = await checkForUpdates({ skipCache: true });

    if (!info.hasUpdate) {
      console.log(`You are running the latest version (${info.current})`);
      return;
    }

    console.log(`Update available: ${info.current} → ${info.latest}`);
    console.log(`Release: ${info.releaseUrl}`);

    if (values.check) {
      console.log("");
      console.log("Run 'lctx upgrade' to install the update");
      return;
    }

    console.log("");
    console.log("Downloading update...");

    const { os, arch } = getPlatformInfo();
    const artifactName = `lctx-${os}-${arch}`;
    const tarballName = `${artifactName}.tar.gz`;
    const downloadUrl = getDownloadUrl(info.latest);

    const tmpDir = join(tmpdir(), `lctx-upgrade-${Date.now()}`);
    const fs = await import("node:fs/promises");
    await fs.mkdir(tmpDir, { recursive: true });

    const tarballPath = join(tmpDir, tarballName);
    await downloadFile(downloadUrl, tarballPath);

    console.log("Verifying checksum...");
    const isValid = await verifyChecksum(tarballPath, info.latest, tarballName);
    if (!isValid) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      process.exit(1);
    }

    console.log("Extracting...");
    await extractTarball(tarballPath, tmpDir);

    console.log("Installing...");
    const newBinaryPath = join(tmpDir, artifactName);
    await replaceCurrentBinary(newBinaryPath);

    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });

    console.log("");
    console.log(`Successfully upgraded to lctx ${info.latest}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}
