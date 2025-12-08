import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitSourceManager } from "../../../src";
import type { GitRepositorySource } from "../../../src";
import { addCommitToRepo, createBareRepo } from "../../shared";

describe("GitSourceManager", () => {
  let testDir: string;
  let sourcesDir: string;
  let bareRepoPath: string;
  let gitManager: GitSourceManager;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    sourcesDir = join(testDir, "sources");
    bareRepoPath = join(testDir, "repos", "test-repo.git");

    await createBareRepo(bareRepoPath);
    gitManager = new GitSourceManager(sourcesDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("add", () => {
    test("clones repository with default branch", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await gitManager.add(source);

      const clonedPath = join(sourcesDir, "git", "test-repo");
      const files = await readdir(clonedPath);
      expect(files).toContain("README.md");
    });

    test("clones repository with custom branch", async () => {
      // Create a branch in the bare repo
      const tempWorkDir = join(testDir, "temp-branch");
      await mkdir(tempWorkDir, { recursive: true });

      const proc1 = Bun.spawn(["git", "clone", bareRepoPath, "."], {
        cwd: tempWorkDir,
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc1.exited;

      // Configure git user
      await Bun.spawn(["git", "config", "user.email", "test@test.com"], {
        cwd: tempWorkDir,
      }).exited;
      await Bun.spawn(["git", "config", "user.name", "Test"], {
        cwd: tempWorkDir,
      }).exited;

      // Create and push develop branch
      await Bun.spawn(["git", "checkout", "-b", "develop"], {
        cwd: tempWorkDir,
      }).exited;
      await Bun.spawn(["git", "push", "origin", "develop"], {
        cwd: tempWorkDir,
      }).exited;
      await rm(tempWorkDir, { recursive: true, force: true });

      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
        branch: "develop",
      };

      await gitManager.add(source);

      const clonedPath = join(sourcesDir, "git", "test-repo");
      const files = await readdir(clonedPath);
      expect(files).toContain("README.md");
    });

    test("throws error for invalid URL", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "invalid",
        url: "/nonexistent/repo",
      };

      await expect(gitManager.add(source)).rejects.toThrow("git clone failed:");
    });

    test("creates git subdirectory if missing", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await gitManager.add(source);

      const gitDir = join(sourcesDir, "git");
      const files = await readdir(gitDir);
      expect(files).toContain("test-repo");
    });
  });

  describe("update", () => {
    test("pulls changes from remote", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await gitManager.add(source);

      // Add a new commit to the bare repo
      await addCommitToRepo(bareRepoPath, "new-file.txt", "new content");

      // Update should pull the new commit
      await gitManager.update(source);

      const clonedPath = join(sourcesDir, "git", "test-repo");
      const files = await readdir(clonedPath);
      expect(files).toContain("new-file.txt");
    });
  });

  describe("delete", () => {
    test("removes repository directory", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await gitManager.add(source);

      const clonedPath = join(sourcesDir, "git", "test-repo");
      let exists = await Bun.file(join(clonedPath, "README.md")).exists();
      expect(exists).toBe(true);

      await gitManager.delete(source);

      exists = await Bun.file(join(clonedPath, "README.md")).exists();
      expect(exists).toBe(false);
    });

    test("is idempotent (no error if path does not exist)", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "nonexistent",
        url: bareRepoPath,
      };

      // Should not throw
      await gitManager.delete(source);
    });
  });

  describe("getSourcePath", () => {
    test("returns correct path", () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "my-repo",
        url: "https://example.com/repo",
      };

      const path = gitManager.getSourcePath(source);
      expect(path).toBe(join(sourcesDir, "git", "my-repo"));
    });
  });
});
