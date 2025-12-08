import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FileConfigManager,
  GitSourceManager,
  SourcesManager,
} from "../../../src";
import type {
  ConfigManager,
  GitRepositorySource,
  LctxConfig,
  PathResolver,
} from "../../../src";
import { FakePathResolver, createBareRepo } from "../../shared";

describe("SourcesManager", () => {
  let testDir: string;
  let configManager: ConfigManager;
  let fakePathResolver: PathResolver;
  let gitManager: GitSourceManager;
  let sourcesManager: SourcesManager;
  let bareRepoPath: string;
  let config: LctxConfig;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    fakePathResolver = new FakePathResolver(testDir);
    configManager = new FileConfigManager(fakePathResolver);

    // Load default config to get initial structure (for sourcesDirectory)
    config = await configManager.load();

    const sourcesDir = config.sourcesDirectory;
    gitManager = new GitSourceManager(sourcesDir);

    sourcesManager = new SourcesManager(configManager, [gitManager]);

    bareRepoPath = join(testDir, "repos", "test-repo.git");
    await createBareRepo(bareRepoPath);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("add", () => {
    test("delegates to manager and persists config", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await sourcesManager.add(source);

      // Verify source was added to config
      const sources = await sourcesManager.listSources();
      expect(sources).toHaveLength(1);
      expect(sources[0]?.name).toBe("test-repo");

      // Verify config was persisted
      const reloadedConfig = await configManager.load();
      expect(reloadedConfig.sources).toHaveLength(1);
      expect(reloadedConfig.sources[0]?.name).toBe("test-repo");
    });

    test("throws for unsupported source type", async () => {
      const source = {
        type: "docs",
        name: "unsupported",
        url: "https://example.com",
      } as const;

      await expect(sourcesManager.add(source)).rejects.toThrow(
        "Unsupported source type: docs",
      );
    });
  });

  describe("update", () => {
    test("delegates to manager and sets lastUpdated", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await sourcesManager.add(source);

      // Update the source
      const beforeUpdate = new Date();
      await sourcesManager.update("test-repo");

      // Verify lastUpdated was set
      const updatedSource = await sourcesManager.getSource("test-repo");
      expect(updatedSource?.lastUpdated).toBeDefined();

      if (!updatedSource?.lastUpdated) {
        throw new Error("Expected lastUpdated to be defined");
      }
      const lastUpdated = new Date(updatedSource.lastUpdated);
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );

      // Verify config was persisted
      const reloadedConfig = await configManager.load();
      expect(reloadedConfig.sources[0]?.lastUpdated).toBeDefined();
    });

    test("throws for non-existent source", async () => {
      await expect(sourcesManager.update("nonexistent")).rejects.toThrow(
        "Source not found: nonexistent",
      );
    });
  });

  describe("delete", () => {
    test("delegates to manager and removes from config", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await sourcesManager.add(source);
      expect(await sourcesManager.listSources()).toHaveLength(1);

      await sourcesManager.delete("test-repo");

      // Verify source was removed from config
      expect(await sourcesManager.listSources()).toHaveLength(0);

      // Verify config was persisted
      const reloadedConfig = await configManager.load();
      expect(reloadedConfig.sources).toHaveLength(0);
    });

    test("throws for non-existent source", async () => {
      await expect(sourcesManager.delete("nonexistent")).rejects.toThrow(
        "Source not found: nonexistent",
      );
    });
  });

  describe("updateAll", () => {
    test("updates all sources", async () => {
      const source1: GitRepositorySource = {
        type: "git",
        name: "repo1",
        url: bareRepoPath,
      };

      // Create second bare repo
      const bareRepoPath2 = join(testDir, "repos", "test-repo2.git");
      await createBareRepo(bareRepoPath2);

      const source2: GitRepositorySource = {
        type: "git",
        name: "repo2",
        url: bareRepoPath2,
      };

      await sourcesManager.add(source1);
      await sourcesManager.add(source2);

      const beforeUpdate = new Date();
      await sourcesManager.updateAll();

      // Both sources should have lastUpdated set
      const sources = await sourcesManager.listSources();
      for (const s of sources) {
        expect(s.lastUpdated).toBeDefined();
        if (!s.lastUpdated) {
          throw new Error("Expected lastUpdated to be defined");
        }
        const lastUpdated = new Date(s.lastUpdated);
        expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      }
    });
  });

  describe("getSourcePath", () => {
    test("returns path for configured source", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await sourcesManager.add(source);

      const path = await sourcesManager.getSourcePath("test-repo");
      expect(path).toBe(join(config.sourcesDirectory, "git", "test-repo"));
    });

    test("returns undefined for non-existent source", async () => {
      const path = await sourcesManager.getSourcePath("nonexistent");
      expect(path).toBeUndefined();
    });
  });

  describe("listSources", () => {
    test("returns all configured sources", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      expect(await sourcesManager.listSources()).toHaveLength(0);

      await sourcesManager.add(source);

      const sources = await sourcesManager.listSources();
      expect(sources).toHaveLength(1);
      expect(sources[0]?.name).toBe("test-repo");
    });
  });

  describe("getSource", () => {
    test("returns source by name", async () => {
      const source: GitRepositorySource = {
        type: "git",
        name: "test-repo",
        url: bareRepoPath,
      };

      await sourcesManager.add(source);

      const found = await sourcesManager.getSource("test-repo");
      expect(found).toBeDefined();
      expect(found?.name).toBe("test-repo");
      expect(found?.type).toBe("git");
    });

    test("returns undefined for non-existent source", async () => {
      const found = await sourcesManager.getSource("nonexistent");
      expect(found).toBeUndefined();
    });
  });
});
