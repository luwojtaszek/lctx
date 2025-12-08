import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DocsSourceManager } from "../../../src";
import type { DocsSource } from "../../../src";

describe("DocsSourceManager", () => {
  let testDir: string;
  let sourcesDir: string;
  let docsManager: DocsSourceManager;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });

    sourcesDir = join(testDir, "sources");
    docsManager = new DocsSourceManager(sourcesDir);

    originalFetch = globalThis.fetch;
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await rm(testDir, { recursive: true, force: true });
  });

  describe("add", () => {
    test("fetches and stores content", async () => {
      const mockContent = "# Documentation\n\nThis is test content.";
      // @ts-expect-error - Bun mock type doesn't include fetch's preconnect property
      globalThis.fetch = mock(() => Promise.resolve(new Response(mockContent)));

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/docs.txt",
      };

      await docsManager.add(source);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://example.com/docs.txt",
      );

      const contentPath = join(sourcesDir, "docs", "test-docs", "content.txt");
      const content = await Bun.file(contentPath).text();
      expect(content).toBe(mockContent);
    });

    test("creates docs subdirectory if missing", async () => {
      // @ts-expect-error - Bun mock type doesn't include fetch's preconnect property
      globalThis.fetch = mock(() => Promise.resolve(new Response("content")));

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/docs.txt",
      };

      await docsManager.add(source);

      const docsDir = join(sourcesDir, "docs");
      const exists = await Bun.file(
        join(docsDir, "test-docs", "content.txt"),
      ).exists();
      expect(exists).toBe(true);
    });

    test("throws error for fetch failure", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(null, { status: 404 })),
      ) as unknown as typeof fetch;

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/notfound.txt",
      };

      await expect(docsManager.add(source)).rejects.toThrow(
        "Failed to fetch https://example.com/notfound.txt: 404",
      );
    });

    test("throws error for network failure", async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error("Network error")),
      ) as unknown as typeof fetch;

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/docs.txt",
      };

      await expect(docsManager.add(source)).rejects.toThrow("Network error");
    });
  });

  describe("update", () => {
    test("re-fetches and overwrites content", async () => {
      const initialContent = "Initial content";
      const updatedContent = "Updated content";

      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(initialContent)),
      ) as unknown as typeof fetch;

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/docs.txt",
      };

      await docsManager.add(source);

      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(updatedContent)),
      ) as unknown as typeof fetch;

      await docsManager.update(source);

      const contentPath = join(sourcesDir, "docs", "test-docs", "content.txt");
      const content = await Bun.file(contentPath).text();
      expect(content).toBe(updatedContent);
    });
  });

  describe("delete", () => {
    test("removes docs directory", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response("content")),
      ) as unknown as typeof fetch;

      const source: DocsSource = {
        type: "docs",
        name: "test-docs",
        url: "https://example.com/docs.txt",
      };

      await docsManager.add(source);

      const contentPath = join(sourcesDir, "docs", "test-docs", "content.txt");
      let exists = await Bun.file(contentPath).exists();
      expect(exists).toBe(true);

      await docsManager.delete(source);

      exists = await Bun.file(contentPath).exists();
      expect(exists).toBe(false);
    });

    test("is idempotent (no error if path does not exist)", async () => {
      const source: DocsSource = {
        type: "docs",
        name: "nonexistent",
        url: "https://example.com/docs.txt",
      };

      await docsManager.delete(source);
    });
  });

  describe("getSourcePath", () => {
    test("returns correct path", () => {
      const source: DocsSource = {
        type: "docs",
        name: "my-docs",
        url: "https://example.com/docs",
      };

      const path = docsManager.getSourcePath(source);
      expect(path).toBe(join(sourcesDir, "docs", "my-docs"));
    });
  });
});
