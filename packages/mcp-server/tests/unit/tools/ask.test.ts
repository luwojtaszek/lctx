import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { SourcesManager, SubagentRunner } from "@lctx/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAskSourcesTool } from "../../../src/tools";

describe("ask_sources tool", () => {
  let server: McpServer;
  let client: Client;
  let mockSourcesManager: SourcesManager;
  let mockSubagentRunner: SubagentRunner;

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
    registerAskSourcesTool(server, mockSubagentRunner, mockSourcesManager);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  }

  test("returns answer from subagentRunner", async () => {
    mockSourcesManager = {
      getSource: mock((name: string) =>
        Promise.resolve({ name, type: "git", url: "https://example.com" }),
      ),
    } as unknown as SourcesManager;

    mockSubagentRunner = {
      ask: mock(() =>
        Promise.resolve({
          answer: "The answer to your question is 42.",
        }),
      ),
    } as unknown as SubagentRunner;

    await setupAndConnect();

    const result = await client.callTool({
      name: "ask_sources",
      arguments: {
        sources: ["langchain"],
        question: "What is the meaning of life?",
      },
    });

    expect(result.content).toEqual([
      { type: "text", text: "The answer to your question is 42." },
    ]);
    expect(result.structuredContent).toEqual({
      answer: "The answer to your question is 42.",
    });
  });

  test("validates sources exist before calling subagentRunner", async () => {
    const getSourceMock = mock((name: string) => {
      if (name === "valid-source") {
        return Promise.resolve({
          name,
          type: "git",
          url: "https://example.com",
        });
      }
      return Promise.resolve(undefined);
    });

    mockSourcesManager = {
      getSource: getSourceMock,
    } as unknown as SourcesManager;

    const askMock = mock(() => Promise.resolve({ answer: "test" }));
    mockSubagentRunner = {
      ask: askMock,
    } as unknown as SubagentRunner;

    await setupAndConnect();

    const result = await client.callTool({
      name: "ask_sources",
      arguments: {
        sources: ["invalid-source"],
        question: "Test question?",
      },
    });

    // Should return error, not call ask
    expect(result.isError).toBe(true);
    expect(askMock).not.toHaveBeenCalled();
  });

  test("throws error when source not found", async () => {
    mockSourcesManager = {
      getSource: mock(() => Promise.resolve(undefined)),
    } as unknown as SourcesManager;

    mockSubagentRunner = {
      ask: mock(() => Promise.resolve({ answer: "test" })),
    } as unknown as SubagentRunner;

    await setupAndConnect();

    const result = await client.callTool({
      name: "ask_sources",
      arguments: {
        sources: ["nonexistent"],
        question: "Test?",
      },
    });

    expect(result.isError).toBe(true);
    const errorContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(errorContent[0]?.text).toContain("Source not found: nonexistent");
  });

  test("validates all sources before proceeding", async () => {
    const getSourceMock = mock((name: string) => {
      if (name === "source1") {
        return Promise.resolve({
          name,
          type: "git",
          url: "https://example.com",
        });
      }
      // source2 doesn't exist
      return Promise.resolve(undefined);
    });

    mockSourcesManager = {
      getSource: getSourceMock,
    } as unknown as SourcesManager;

    const askMock = mock(() => Promise.resolve({ answer: "test" }));
    mockSubagentRunner = {
      ask: askMock,
    } as unknown as SubagentRunner;

    await setupAndConnect();

    const result = await client.callTool({
      name: "ask_sources",
      arguments: {
        sources: ["source1", "source2"],
        question: "Test?",
      },
    });

    expect(result.isError).toBe(true);
    const errorContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(errorContent[0]?.text).toContain("Source not found: source2");
    expect(askMock).not.toHaveBeenCalled();
  });

  test("passes sources and question to subagentRunner", async () => {
    mockSourcesManager = {
      getSource: mock((name: string) =>
        Promise.resolve({ name, type: "git", url: "https://example.com" }),
      ),
    } as unknown as SourcesManager;

    const askMock = mock(() =>
      Promise.resolve({ answer: "Response from agent" }),
    );
    mockSubagentRunner = {
      ask: askMock,
    } as unknown as SubagentRunner;

    await setupAndConnect();

    await client.callTool({
      name: "ask_sources",
      arguments: {
        sources: ["langchain", "langgraph"],
        question: "How do I create a tool?",
      },
    });

    expect(askMock).toHaveBeenCalledWith({
      sources: ["langchain", "langgraph"],
      question: "How do I create a tool?",
    });
  });

  test("handles multiple valid sources", async () => {
    const sources = ["source1", "source2", "source3"];

    mockSourcesManager = {
      getSource: mock((name: string) =>
        Promise.resolve({ name, type: "git", url: `https://${name}.com` }),
      ),
    } as unknown as SourcesManager;

    mockSubagentRunner = {
      ask: mock(() =>
        Promise.resolve({ answer: "Combined answer from all sources" }),
      ),
    } as unknown as SubagentRunner;

    await setupAndConnect();

    const result = await client.callTool({
      name: "ask_sources",
      arguments: {
        sources,
        question: "Question about multiple sources?",
      },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      answer: "Combined answer from all sources",
    });
  });
});
