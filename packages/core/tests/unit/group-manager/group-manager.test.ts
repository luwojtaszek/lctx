import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type ConfigManager,
  FileConfigManager,
  FileGroupManager,
  type GroupManager,
} from "../../../src";
import type { PathResolver } from "../../../src";
import { FakePathResolver } from "../../shared";

describe("GroupManager", () => {
  let testDir: string;
  let configManager: ConfigManager;
  let groupManager: GroupManager;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    const fakePathResolver: PathResolver = new FakePathResolver(testDir);
    configManager = new FileConfigManager(fakePathResolver);
    groupManager = new FileGroupManager(configManager);

    // Initialize config
    await configManager.load();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("create", () => {
    test("creates a new group", async () => {
      const group = await groupManager.create("test-group", [
        "source1",
        "source2",
      ]);

      expect(group.name).toBe("test-group");
      expect(group.sources).toEqual(["source1", "source2"]);
      expect(group.description).toBeUndefined();
    });

    test("creates a group with description", async () => {
      const group = await groupManager.create(
        "test-group",
        ["source1"],
        "Test description",
      );

      expect(group.name).toBe("test-group");
      expect(group.description).toBe("Test description");
    });

    test("throws when group already exists", async () => {
      await groupManager.create("test-group", ["source1"]);

      await expect(
        groupManager.create("test-group", ["source2"]),
      ).rejects.toThrow("Group 'test-group' already exists");
    });
  });

  describe("get", () => {
    test("returns group when it exists", async () => {
      await groupManager.create("test-group", ["source1", "source2"]);

      const group = await groupManager.get("test-group");

      expect(group).toBeDefined();
      expect(group?.name).toBe("test-group");
      expect(group?.sources).toEqual(["source1", "source2"]);
    });

    test("returns undefined when group does not exist", async () => {
      const group = await groupManager.get("nonexistent");

      expect(group).toBeUndefined();
    });
  });

  describe("list", () => {
    test("returns empty array when no groups exist", async () => {
      const groups = await groupManager.list();

      expect(groups).toEqual([]);
    });

    test("returns all groups", async () => {
      await groupManager.create("group1", ["source1"]);
      await groupManager.create("group2", ["source2", "source3"]);

      const groups = await groupManager.list();

      expect(groups).toHaveLength(2);
      expect(groups.map((g) => g.name)).toContain("group1");
      expect(groups.map((g) => g.name)).toContain("group2");
    });
  });

  describe("update", () => {
    test("updates an existing group", async () => {
      await groupManager.create("test-group", ["source1"]);

      const updated = await groupManager.update(
        "test-group",
        ["source2", "source3"],
        "New description",
      );

      expect(updated.sources).toEqual(["source2", "source3"]);
      expect(updated.description).toBe("New description");

      const retrieved = await groupManager.get("test-group");
      expect(retrieved?.sources).toEqual(["source2", "source3"]);
    });

    test("throws when group does not exist", async () => {
      await expect(
        groupManager.update("nonexistent", ["source1"]),
      ).rejects.toThrow("Group 'nonexistent' not found");
    });
  });

  describe("delete", () => {
    test("deletes an existing group", async () => {
      await groupManager.create("test-group", ["source1"]);

      await groupManager.delete("test-group");

      const group = await groupManager.get("test-group");
      expect(group).toBeUndefined();
    });

    test("throws when group does not exist", async () => {
      await expect(groupManager.delete("nonexistent")).rejects.toThrow(
        "Group 'nonexistent' not found",
      );
    });
  });

  describe("resolveSources", () => {
    test("returns sources for a group", async () => {
      await groupManager.create("test-group", ["source1", "source2"]);

      const sources = await groupManager.resolveSources("test-group");

      expect(sources).toEqual(["source1", "source2"]);
    });

    test("throws when group does not exist", async () => {
      await expect(groupManager.resolveSources("nonexistent")).rejects.toThrow(
        "Group 'nonexistent' not found",
      );
    });
  });
});
