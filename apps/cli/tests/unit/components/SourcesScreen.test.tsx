import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { SourcesScreen } from "../../../src/components/SourcesScreen.js";
import { AppContext } from "../../../src/components/shared/AppContext.js";

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock sources data
const mockSources = [
  {
    name: "bun",
    type: "docs" as const,
    url: "https://bun.sh/llms.txt",
    description: "Bun docs",
  },
  {
    name: "react",
    type: "git" as const,
    url: "https://github.com/facebook/react",
    description: "React repo",
  },
];

// Store the mock module
let mockSourcesManager: {
  listSources: ReturnType<typeof mock>;
  add: ReturnType<typeof mock>;
  delete: ReturnType<typeof mock>;
  update: ReturnType<typeof mock>;
  updateAll: ReturnType<typeof mock>;
};

// Mock the core module
mock.module("@lctx/core", () => {
  mockSourcesManager = {
    listSources: mock(() => Promise.resolve(mockSources)),
    add: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve()),
    update: mock(() => Promise.resolve()),
    updateAll: mock(() => Promise.resolve()),
  };

  return {
    createCoreModule: mock(() =>
      Promise.resolve({
        sourcesManager: mockSourcesManager,
      }),
    ),
  };
});

// Wrapper component with mocked context
function TestWrapper({ children }: { children: React.ReactNode }) {
  const contextValue = {
    suppressExit: false,
    setSuppressExit: () => {},
    showBackHint: false,
    setShowBackHint: () => {},
    showExitHint: false,
    setShowExitHint: () => {},
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

describe("SourcesScreen", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSourcesManager.listSources.mockImplementation(() =>
      Promise.resolve(mockSources),
    );
  });

  test("shows loading spinner initially", () => {
    const onBack = mock(() => {});
    const { lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );
    const frame = lastFrame();

    expect(frame).toContain("Loading");
  });

  test("displays sources table after load", async () => {
    const onBack = mock(() => {});
    const { lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    // Wait for sources to load
    await wait(50);

    const frame = lastFrame();
    expect(frame).toContain("Sources");
    expect(frame).toContain("bun");
    expect(frame).toContain("react");
    expect(frame).toContain("docs");
    expect(frame).toContain("git");
  });

  test("displays empty state when no sources", async () => {
    mockSourcesManager.listSources.mockImplementation(() =>
      Promise.resolve([]),
    );

    const onBack = mock(() => {});
    const { lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    const frame = lastFrame();
    expect(frame).toContain("No items");
  });

  test("shows action bar with keyboard shortcuts", async () => {
    const onBack = mock(() => {});
    const { lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    const frame = lastFrame();
    expect(frame).toContain("[a]");
    expect(frame).toContain("Add");
    expect(frame).toContain("[d]");
    expect(frame).toContain("Delete");
    expect(frame).toContain("[u]");
    expect(frame).toContain("Update");
    expect(frame).toContain("[s]");
    expect(frame).toContain("Sync");
  });

  test("a key shows AddSource view", async () => {
    const onBack = mock(() => {});
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    stdin.write("a");
    await tick();

    const frame = lastFrame();
    expect(frame).toContain("Add Source");
    expect(frame).toContain("Select source type");
  });

  test("d key with selection shows RemoveSource view", async () => {
    const onBack = mock(() => {});
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    stdin.write("d");
    await tick();

    const frame = lastFrame();
    expect(frame).toContain("Delete Source");
    expect(frame).toContain("bun"); // The first selected source
  });

  test("u key with selection shows EditSource view", async () => {
    const onBack = mock(() => {});
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    stdin.write("u");
    await tick();

    const frame = lastFrame();
    expect(frame).toContain("Edit");
    expect(frame).toContain("bun"); // The first selected source
  });

  test("escape calls onBack", async () => {
    const onBack = mock(() => {});
    const { stdin } = render(
      <TestWrapper>
        <SourcesScreen onBack={onBack} />
      </TestWrapper>,
    );

    await wait(50);

    stdin.write("\x1B"); // Escape
    await tick();

    expect(onBack).toHaveBeenCalled();
  });
});
