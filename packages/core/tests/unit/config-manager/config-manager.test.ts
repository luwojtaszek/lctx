import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ConfigManager, FileConfigManager } from "../../../src";
import type { PathResolver } from "../../../src";
import { FakePathResolver } from "../../shared";

describe("ConfigManager", () => {
  let testDir: string;
  let configManager: ConfigManager;
  let fakePathResolver: PathResolver;

  beforeEach(async () => {
    // Use a unique temp directory for each test
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    fakePathResolver = new FakePathResolver(testDir);
    configManager = new FileConfigManager(fakePathResolver);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("expandPath", () => {
    test("expands ~ to fake home directory", () => {
      expect(configManager.expandPath("~/projects")).toBe(
        `${testDir}/projects`,
      );
      expect(configManager.expandPath("~")).toBe(testDir);
    });

    test("returns non-tilde paths unchanged", () => {
      expect(configManager.expandPath("/absolute/path")).toBe("/absolute/path");
      expect(configManager.expandPath("relative/path")).toBe("relative/path");
    });
  });

  describe("configPath", () => {
    test("returns default config path", () => {
      expect(configManager.configPath).toBe("~/.config/lctx/config.json");
    });
  });

  describe("save", () => {
    test("creates parent directories if missing", async () => {
      const config = {
        sourcesDirectory: "~/.config/lctx/sources",
        sources: [],
        agents: {
          "claude-code": {
            commands: {
              chat: "claude",
              ask: "claude -p {prompt_file}",
            },
          },
        },
        defaultAgent: "claude-code",
        groups: {},
      };
      const testPath = join(testDir, ".config/lctx/nested/deep/config.json");

      await configManager.save(config, testPath);

      const file = Bun.file(testPath);
      expect(await file.exists()).toBe(true);

      const content = await file.json();
      expect(content.sourcesDirectory).toBe("~/.config/lctx/sources");
    });

    test("writes formatted JSON", async () => {
      const config = {
        sourcesDirectory: "~/.config/lctx/sources",
        sources: [],
        agents: {
          "claude-code": {
            commands: {
              chat: "claude",
              ask: "claude -p {prompt_file}",
            },
          },
        },
        defaultAgent: "claude-code",
        groups: {},
      };
      const testPath = join(testDir, ".config/lctx/config.json");

      await configManager.save(config, testPath);

      const content = await Bun.file(testPath).text();
      expect(content).toContain("\n");
      expect(content).toContain("  ");
    });
  });

  describe("load", () => {
    test("creates default config when file is missing", async () => {
      const testPath = "~/.config/lctx/config.json";
      const config = await configManager.load(testPath);

      // Should have created the file
      const expandedPath = join(testDir, ".config/lctx/config.json");
      expect(await Bun.file(expandedPath).exists()).toBe(true);

      // Should return expanded paths using fake home
      expect(config.sourcesDirectory).toBe(`${testDir}/.config/lctx/sources`);
      expect(config.defaultAgent).toBe("claude-code");
    });

    test("loads existing valid config", async () => {
      const configDir = join(testDir, ".config/lctx");
      await mkdir(configDir, { recursive: true });

      const testConfig = {
        sourcesDirectory: "~/custom/sources",
        sources: [
          {
            type: "git" as const,
            name: "test-repo",
            url: "https://github.com/test/repo",
          },
        ],
        agents: {
          custom: {
            commands: {
              chat: "custom-chat",
              ask: "custom-ask",
            },
          },
        },
        defaultAgent: "custom",
      };

      const configPath = join(configDir, "config.json");
      await Bun.write(configPath, JSON.stringify(testConfig));

      const config = await configManager.load(configPath);

      // Paths should be expanded using fake home
      expect(config.sourcesDirectory).toBe(`${testDir}/custom/sources`);
      expect(config.sources).toHaveLength(1);
      expect(config.sources[0]?.name).toBe("test-repo");
      expect(config.defaultAgent).toBe("custom");
    });

    test("expands paths in file and directory sources", async () => {
      const configDir = join(testDir, ".config/lctx");
      await mkdir(configDir, { recursive: true });

      const testConfig = {
        sourcesDirectory: "~/.config/lctx/sources",
        sources: [
          { type: "file" as const, name: "my-file", path: "~/docs/file.md" },
          { type: "directory" as const, name: "my-dir", path: "~/projects" },
        ],
        agents: {
          "claude-code": {
            commands: { chat: "claude", ask: "claude -p {prompt_file}" },
          },
        },
        defaultAgent: "claude-code",
      };

      const configPath = join(configDir, "config.json");
      await Bun.write(configPath, JSON.stringify(testConfig));

      const config = await configManager.load(configPath);

      const fileSource = config.sources[0];
      const dirSource = config.sources[1];

      expect(fileSource).toBeDefined();
      expect(dirSource).toBeDefined();

      if (fileSource?.type === "file") {
        expect(fileSource.path).toBe(`${testDir}/docs/file.md`);
      }
      if (dirSource?.type === "directory") {
        expect(dirSource.path).toBe(`${testDir}/projects`);
      }
    });

    test("throws on invalid config", async () => {
      const configDir = join(testDir, ".config/lctx");
      await mkdir(configDir, { recursive: true });

      const invalidConfig = {
        sourcesDirectory: 123,
        sources: "not-an-array",
      };

      const configPath = join(configDir, "config.json");
      await Bun.write(configPath, JSON.stringify(invalidConfig));

      await expect(configManager.load(configPath)).rejects.toThrow();
    });
  });
});
