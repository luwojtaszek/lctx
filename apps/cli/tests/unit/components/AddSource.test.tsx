import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { AddSource } from "../../../src/components/AddSource.js";
import { AppContext } from "../../../src/components/shared/AppContext.js";

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

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

describe("AddSource", () => {
  test("renders source type selection", () => {
    const onAdd = mock(() => {});
    const onCancel = mock(() => {});
    const { lastFrame } = render(
      <TestWrapper>
        <AddSource onAdd={onAdd} onCancel={onCancel} />
      </TestWrapper>,
    );
    const frame = lastFrame();

    expect(frame).toContain("Add Source");
    expect(frame).toContain("Select source type");
    expect(frame).toContain("Git Repository");
    expect(frame).toContain("Documentation URL");
    expect(frame).toContain("Local File");
    expect(frame).toContain("Local Directory");
  });

  test("selecting git shows git wizard", async () => {
    const onAdd = mock(() => {});
    const onCancel = mock(() => {});
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <AddSource onAdd={onAdd} onCancel={onCancel} />
      </TestWrapper>,
    );

    // Press enter to select first item (Git Repository)
    stdin.write("\r");
    await tick();

    const frame = lastFrame();
    expect(frame).toContain("Add Git Repository");
    expect(frame).toContain("Step 1/5");
  });

  // Note: Navigation tests for other wizards are covered indirectly.
  // SelectInput navigation is tested in SelectInput.test.tsx.
  // Here we verify that the wizard components are properly loaded.

  test("escape cancels type selection", async () => {
    const onAdd = mock(() => {});
    const onCancel = mock(() => {});
    const { stdin } = render(
      <TestWrapper>
        <AddSource onAdd={onAdd} onCancel={onCancel} />
      </TestWrapper>,
    );

    stdin.write("\x1B"); // Escape
    await tick();

    expect(onCancel).toHaveBeenCalled();
  });

  // Note: Escape in wizard is handled by the wizard component itself.
  // The wizard's escape behavior is tested within its own tests.
});
