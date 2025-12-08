import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Creates a bare git repository with an initial commit.
 * Use `file://${path}` as the clone URL.
 */
export async function createBareRepo(path: string): Promise<void> {
  await mkdir(path, { recursive: true });

  // Initialize bare repo
  await runGit(["init", "--bare"], path);

  // Create temp working directory to add initial commit
  const tempWorkDir = `${path}-temp`;
  await mkdir(tempWorkDir, { recursive: true });

  try {
    // Clone the bare repo
    await runGit(["clone", path, "."], tempWorkDir);

    // Configure git user for commit
    await runGit(["config", "user.email", "test@test.com"], tempWorkDir);
    await runGit(["config", "user.name", "Test"], tempWorkDir);

    // Create initial file and commit
    await writeFile(join(tempWorkDir, "README.md"), "# Test Repository\n");
    await runGit(["add", "."], tempWorkDir);
    await runGit(["commit", "-m", "Initial commit"], tempWorkDir);

    // Push to bare repo
    await runGit(["push", "origin", "main"], tempWorkDir);
  } finally {
    // Clean up temp directory
    await rm(tempWorkDir, { recursive: true, force: true });
  }
}

/**
 * Adds a new commit to an existing repository.
 * This can be used to test git pull.
 */
export async function addCommitToRepo(
  bareRepoPath: string,
  filename: string,
  content: string,
): Promise<void> {
  const tempWorkDir = `${bareRepoPath}-temp`;
  await mkdir(tempWorkDir, { recursive: true });

  try {
    await runGit(["clone", bareRepoPath, "."], tempWorkDir);
    await runGit(["config", "user.email", "test@test.com"], tempWorkDir);
    await runGit(["config", "user.name", "Test"], tempWorkDir);

    await writeFile(join(tempWorkDir, filename), content);
    await runGit(["add", "."], tempWorkDir);
    await runGit(["commit", "-m", `Add ${filename}`], tempWorkDir);
    await runGit(["push", "origin", "main"], tempWorkDir);
  } finally {
    await rm(tempWorkDir, { recursive: true, force: true });
  }
}

async function runGit(args: string[], cwd: string): Promise<void> {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
  }
}
