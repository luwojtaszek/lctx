import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SubagentRunner } from "../../../src";
import type { ConfigManager, LctxConfig, SourcesManager } from "../../../src";
import defaultConfig from "../../../src/config-manager/default-config.json";

describe("SubagentRunner", () => {
  let testDir: string;
  let mockConfigManager: ConfigManager;
  let mockSourcesManager: SourcesManager;
  let runner: SubagentRunner;
  let originalBunSpawn: typeof Bun.spawn;

  function createMockSpawnResult(
    exitCode: number,
    stdout: string,
    stderr = "",
  ) {
    return {
      exited: Promise.resolve(exitCode),
      stdout: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(stdout));
          controller.close();
        },
      }),
      stderr: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(stderr));
          controller.close();
        },
      }),
    };
  }

  function createMockChatSpawnResult(exitCode = 0) {
    return {
      exited: Promise.resolve(exitCode),
    };
  }

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    mockConfigManager = {
      configPath: join(testDir, "config.json"),
      expandPath: (path: string) => path.replace("~", testDir),
      load: mock(() => Promise.resolve({ ...defaultConfig })),
      save: mock(() => Promise.resolve()),
    };

    mockSourcesManager = {
      getSourcePath: mock((name: string) => {
        if (name === "langchain") {
          return Promise.resolve({
            name,
            path: join(testDir, "sources", "langchain"),
          });
        }
        if (name === "langgraph") {
          return Promise.resolve({
            name,
            path: join(testDir, "sources", "langgraph"),
          });
        }
        return Promise.resolve(undefined);
      }),
    } as unknown as SourcesManager;

    // Create mock source directories
    await mkdir(join(testDir, "sources", "langchain"), { recursive: true });
    await mkdir(join(testDir, "sources", "langgraph"), { recursive: true });
    await writeFile(
      join(testDir, "sources", "langchain", "README.md"),
      "# LangChain",
    );
    await writeFile(
      join(testDir, "sources", "langgraph", "README.md"),
      "# LangGraph",
    );

    runner = new SubagentRunner(mockConfigManager, mockSourcesManager);

    originalBunSpawn = Bun.spawn;
  });

  afterEach(async () => {
    Bun.spawn = originalBunSpawn;
    await rm(testDir, { recursive: true, force: true });
    // Clean up any leftover temp directories
    const { stdout } = Bun.spawn(
      ["sh", "-c", "ls -d /tmp/lctx-* 2>/dev/null || true"],
      {
        stdout: "pipe",
      },
    );
    const dirs = (await new Response(stdout).text())
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const dir of dirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  });

  describe("ask", () => {
    test("creates temp directory with UUID pattern", async () => {
      let capturedCwd: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        return createMockSpawnResult(0, "test answer");
      });

      await runner.ask({
        sources: ["langchain"],
        question: "How do I use it?",
      });

      expect(capturedCwd).toBeDefined();
      expect(capturedCwd).toMatch(/^\/tmp\/lctx-[0-9a-f-]{36}$/);
    });

    test("writes MCP config from agent configuration", async () => {
      let mcpContent: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        if (options.cwd) {
          Bun.file(join(options.cwd, ".mcp.json"))
            .text()
            .then((content) => {
              mcpContent = content;
            });
        }
        return createMockSpawnResult(0, "answer");
      });

      await runner.ask({ sources: ["langchain"], question: "Test?" });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mcpContent).toBe('{"mcpServers":{}}');
    });

    test("creates symlinks for requested sources", async () => {
      let capturedCwd: string | undefined;
      const linkTargets: Record<string, string> = {};

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        if (options.cwd) {
          Promise.all([
            readlink(join(options.cwd, "langchain")),
            readlink(join(options.cwd, "langgraph")),
          ]).then(([langchain, langgraph]) => {
            linkTargets.langchain = langchain;
            linkTargets.langgraph = langgraph;
          });
        }
        return createMockSpawnResult(0, "answer");
      });

      await runner.ask({
        sources: ["langchain", "langgraph"],
        question: "Test?",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(linkTargets.langchain).toBe(join(testDir, "sources", "langchain"));
      expect(linkTargets.langgraph).toBe(join(testDir, "sources", "langgraph"));
    });

    test("throws error for unknown source", async () => {
      await expect(
        runner.ask({ sources: ["unknown"], question: "Test?" }),
      ).rejects.toThrow("Source not found: unknown");
    });

    test("writes prompt file with correct format", async () => {
      let promptContent: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        if (options.cwd) {
          Bun.file(join(options.cwd, "prompt.md"))
            .text()
            .then((content) => {
              promptContent = content;
            });
        }
        return createMockSpawnResult(0, "answer");
      });

      await runner.ask({
        sources: ["langchain", "langgraph"],
        question: "How do I create a tool?",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(promptContent).toContain("# Question");
      expect(promptContent).toContain("How do I create a tool?");
      expect(promptContent).toContain("# Available Sources");
      expect(promptContent).toContain("- ./langchain/");
      expect(promptContent).toContain("- ./langgraph/");
      expect(promptContent).toContain(
        "You MUST explore and read files from these directories",
      );
    });

    test("interpolates command template placeholders", async () => {
      let capturedArgs: string[] | undefined;
      let capturedCwd: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedArgs = args;
        capturedCwd = options.cwd;
        return createMockSpawnResult(0, "answer");
      });

      await runner.ask({ sources: ["langchain"], question: "Test?" });

      expect(capturedArgs).toBeDefined();
      expect(capturedCwd).toBeDefined();
      // Base command args
      expect(capturedArgs?.[0]).toBe("claude");
      expect(capturedArgs?.[1]).toBe("--strict-mcp-config");
      expect(capturedArgs?.[2]).toBe("--mcp-config");
      expect(capturedArgs?.[3]).toBe(join(capturedCwd ?? "", ".mcp.json"));
      expect(capturedArgs?.[4]).toBe("-p");
      expect(capturedArgs?.[5]).toBe(join(capturedCwd ?? "", "prompt.md"));
      // Dynamic --add-dir args: resolved source paths (not symlinks)
      expect(capturedArgs?.[6]).toBe("--add-dir");
      expect(capturedArgs?.[7]).toBe(join(testDir, "sources", "langchain"));
    });

    test("captures stdout as answer", async () => {
      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock(() => createMockSpawnResult(0, "This is the answer"));

      const result = await runner.ask({
        sources: ["langchain"],
        question: "Test?",
      });

      expect(result.answer).toBe("This is the answer");
    });

    test("throws error when agent exits with non-zero code", async () => {
      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock(() =>
        createMockSpawnResult(1, "", "Error: something went wrong"),
      );

      await expect(
        runner.ask({ sources: ["langchain"], question: "Test?" }),
      ).rejects.toThrow(
        "Agent exited with code 1: Error: something went wrong",
      );
    });

    test("cleans up temp directory after success", async () => {
      let capturedCwd: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        return createMockSpawnResult(0, "answer");
      });

      await runner.ask({ sources: ["langchain"], question: "Test?" });

      expect(capturedCwd).toBeDefined();
      const exists = await Bun.file(
        join(capturedCwd ?? "", ".mcp.json"),
      ).exists();
      expect(exists).toBe(false);
    });

    test("cleans up temp directory after failure", async () => {
      let capturedCwd: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        return createMockSpawnResult(1, "", "error");
      });

      await runner
        .ask({ sources: ["langchain"], question: "Test?" })
        .catch(() => {});

      expect(capturedCwd).toBeDefined();
      const exists = await Bun.file(
        join(capturedCwd ?? "", ".mcp.json"),
      ).exists();
      expect(exists).toBe(false);
    });

    test("throws error when agent not found in config", async () => {
      mockConfigManager.load = mock(() =>
        Promise.resolve({
          ...defaultConfig,
          defaultAgent: "nonexistent",
        }),
      );

      await expect(
        runner.ask({ sources: ["langchain"], question: "Test?" }),
      ).rejects.toThrow("Agent not found: nonexistent");
    });
  });

  describe("chat", () => {
    test("spawns with stdio inherit", async () => {
      let capturedOptions: Record<string, unknown> | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: Record<string, unknown>) => {
        capturedOptions = options;
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      expect(capturedOptions).toBeDefined();
      expect(capturedOptions?.stdin).toBe("inherit");
      expect(capturedOptions?.stdout).toBe("inherit");
      expect(capturedOptions?.stderr).toBe("inherit");
    });

    test("uses chat command template", async () => {
      let capturedArgs: string[] | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[]) => {
        capturedArgs = args;
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      expect(capturedArgs).toBeDefined();
      expect(capturedArgs?.[0]).toBe("claude");
    });

    test("does not create prompt file", async () => {
      let capturedCwd: string | undefined;
      let promptExists: boolean | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        if (options.cwd) {
          Bun.file(join(options.cwd, "prompt.md"))
            .exists()
            .then((exists) => {
              promptExists = exists;
            });
        }
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(promptExists).toBe(false);
    });

    test("cleans up temp directory after exit", async () => {
      let capturedCwd: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        capturedCwd = options.cwd;
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      expect(capturedCwd).toBeDefined();
      const exists = await Bun.file(
        join(capturedCwd ?? "", ".mcp.json"),
      ).exists();
      expect(exists).toBe(false);
    });

    test("creates symlinks for sources", async () => {
      let linkTarget: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        if (options.cwd) {
          readlink(join(options.cwd, "langchain")).then((target) => {
            linkTarget = target;
          });
        }
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(linkTarget).toBe(join(testDir, "sources", "langchain"));
    });

    test("writes MCP config from agent configuration", async () => {
      let mcpConfig: string | undefined;

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        if (options.cwd) {
          Bun.file(join(options.cwd, ".mcp.json"))
            .text()
            .then((content) => {
              mcpConfig = content;
            });
        }
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mcpConfig).toBe('{"mcpServers":{}}');
    });

    test("creates MCP config in nested directory when path contains subdirectory", async () => {
      let mcpConfig: string | undefined;

      // Override config to use cursor-style nested path
      mockConfigManager.load = mock(() =>
        Promise.resolve({
          ...defaultConfig,
          agents: {
            "claude-code": {
              commands: {
                chat: "claude",
                ask: "claude -p {prompt_file}",
              },
              mcp: {
                path: ".cursor/mcp.json",
                config: { mcpServers: { test: {} } },
              },
            },
          },
        }),
      );

      // @ts-expect-error - mocking Bun.spawn
      Bun.spawn = mock((args: string[], options: { cwd?: string }) => {
        if (options.cwd) {
          Bun.file(join(options.cwd, ".cursor", "mcp.json"))
            .text()
            .then((content) => {
              mcpConfig = content;
            });
        }
        return createMockChatSpawnResult(0);
      });

      await runner.chat({ sources: ["langchain"] });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mcpConfig).toBe('{"mcpServers":{"test":{}}}');
    });
  });
});
