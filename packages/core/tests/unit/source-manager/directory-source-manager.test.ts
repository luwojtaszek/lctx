import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DirectorySourceManager } from "../../../src";
import type { DirectorySource } from "../../../src";

describe("DirectorySourceManager", () => {
  let testDir: string;
  let sourcesDir: string;
  let directoryManager: DirectorySourceManager;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    sourcesDir = join(testDir, "sources");
    directoryManager = new DirectorySourceManager(sourcesDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("add", () => {
    test("completes successfully (no-op)", async () => {
      const source: DirectorySource = {
        type: "directory",
        name: "src",
        path: "/path/to/src",
      };

      await directoryManager.add(source);
    });
  });

  describe("update", () => {
    test("completes successfully (no-op)", async () => {
      const source: DirectorySource = {
        type: "directory",
        name: "src",
        path: "/path/to/src",
      };

      await directoryManager.update(source);
    });
  });

  describe("delete", () => {
    test("completes successfully without deleting user directory (no-op)", async () => {
      const testSubDir = join(testDir, "test-dir");
      await mkdir(testSubDir, { recursive: true });
      await Bun.write(join(testSubDir, "file.txt"), "test content");

      const source: DirectorySource = {
        type: "directory",
        name: "test-dir",
        path: testSubDir,
      };

      await directoryManager.delete(source);

      const exists = await Bun.file(join(testSubDir, "file.txt")).exists();
      expect(exists).toBe(true);
    });
  });

  describe("getSourcePath", () => {
    test("returns configured path directly", () => {
      const source: DirectorySource = {
        type: "directory",
        name: "src",
        path: "/path/to/src",
      };

      const path = directoryManager.getSourcePath(source);
      expect(path).toBe("/path/to/src");
    });
  });
});
