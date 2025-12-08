import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileSourceManager } from "../../../src";
import type { FileSource } from "../../../src";

describe("FileSourceManager", () => {
  let testDir: string;
  let sourcesDir: string;
  let fileManager: FileSourceManager;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    sourcesDir = join(testDir, "sources");
    fileManager = new FileSourceManager(sourcesDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("add", () => {
    test("completes successfully (no-op)", async () => {
      const source: FileSource = {
        type: "file",
        name: "readme",
        path: "/path/to/README.md",
      };

      await fileManager.add(source);
    });
  });

  describe("update", () => {
    test("completes successfully (no-op)", async () => {
      const source: FileSource = {
        type: "file",
        name: "readme",
        path: "/path/to/README.md",
      };

      await fileManager.update(source);
    });
  });

  describe("delete", () => {
    test("completes successfully without deleting user file (no-op)", async () => {
      const testFile = join(testDir, "test-file.txt");
      await Bun.write(testFile, "test content");

      const source: FileSource = {
        type: "file",
        name: "test-file",
        path: testFile,
      };

      await fileManager.delete(source);

      const exists = await Bun.file(testFile).exists();
      expect(exists).toBe(true);
    });
  });

  describe("getSourcePath", () => {
    test("returns configured path directly", () => {
      const source: FileSource = {
        type: "file",
        name: "readme",
        path: "/path/to/README.md",
      };

      const path = fileManager.getSourcePath(source);
      expect(path).toBe("/path/to/README.md");
    });
  });
});
