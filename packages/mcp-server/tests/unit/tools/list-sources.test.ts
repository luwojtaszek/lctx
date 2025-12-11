import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { SourcesManager } from "@lctx/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListSourcesTool } from "../../../src/tools";

describe("list_sources tool", () => {
  let server: McpServer;
  let client: Client;
  let mockSourcesManager: SourcesManager;

  beforeEach(async () => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });

    client = new Client({
      name: "test-client",
      version: "1.0.0",
    });
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  async function setupAndConnect() {
    registerListSourcesTool(server, mockSourcesManager);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  }

  test("returns empty array when no sources configured", async () => {
    mockSourcesManager = {
      listSources: () => Promise.resolve([]),
    } as unknown as SourcesManager;

    await setupAndConnect();

    const result = await client.callTool({
      name: "list_sources",
      arguments: {},
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: JSON.stringify({ sources: [] }, null, 2),
      },
    ]);
    expect(result.structuredContent).toEqual({ sources: [] });
  });

  test("returns all sources with name, type, and description", async () => {
    const testSources = [
      {
        name: "langchain",
        type: "git" as const,
        url: "https://github.com/langchain-ai/langchain",
        description: "LangChain docs",
      },
      {
        name: "bun",
        type: "docs" as const,
        url: "https://bun.sh/llms.txt",
        description: "Bun runtime",
      },
    ];

    mockSourcesManager = {
      listSources: () => Promise.resolve(testSources),
    } as unknown as SourcesManager;

    await setupAndConnect();

    const result = await client.callTool({
      name: "list_sources",
      arguments: {},
    });

    const expected = {
      sources: [
        { name: "langchain", type: "git", description: "LangChain docs" },
        { name: "bun", type: "docs", description: "Bun runtime" },
      ],
    };

    expect(result.structuredContent).toEqual(expected);
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(expected, null, 2) },
    ]);
  });

  test("handles sources with missing optional description", async () => {
    const testSources = [
      {
        name: "myrepo",
        type: "git" as const,
        url: "https://github.com/user/repo",
        // no description
      },
    ];

    mockSourcesManager = {
      listSources: () => Promise.resolve(testSources),
    } as unknown as SourcesManager;

    await setupAndConnect();

    const result = await client.callTool({
      name: "list_sources",
      arguments: {},
    });

    expect(result.structuredContent).toEqual({
      sources: [{ name: "myrepo", type: "git", description: undefined }],
    });
  });

  test("returns sources of all types", async () => {
    const testSources = [
      { name: "git-source", type: "git" as const, url: "https://example.com" },
      { name: "docs-source", type: "docs" as const, url: "https://docs.com" },
      { name: "file-source", type: "file" as const, path: "/path/to/file" },
      { name: "dir-source", type: "directory" as const, path: "/path/to/dir" },
    ];

    mockSourcesManager = {
      listSources: () => Promise.resolve(testSources),
    } as unknown as SourcesManager;

    await setupAndConnect();

    const result = await client.callTool({
      name: "list_sources",
      arguments: {},
    });

    const structured = result.structuredContent as {
      sources: Array<{ type: string }>;
    };
    const types = structured.sources.map((s) => s.type);

    expect(types).toEqual(["git", "docs", "file", "directory"]);
  });
});
