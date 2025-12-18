import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { AppContext } from "../../../src/components/shared/AppContext.js";
import { TextInput } from "../../../src/components/shared/TextInput.js";

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// Wrapper component with mocked context
function TestWrapper({
  children,
  mockContext,
}: {
  children: React.ReactNode;
  mockContext?: {
    setSuppressExit?: (v: boolean) => void;
    setShowExitHint?: (v: boolean) => void;
  };
}) {
  const contextValue = {
    suppressExit: false,
    setSuppressExit: mockContext?.setSuppressExit ?? (() => {}),
    showBackHint: false,
    setShowBackHint: () => {},
    showExitHint: false,
    setShowExitHint: mockContext?.setShowExitHint ?? (() => {}),
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

describe("TextInput", () => {
  test("shows placeholder when empty", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <TextInput placeholder="Enter text..." />
      </TestWrapper>,
    );
    const frame = lastFrame();

    expect(frame).toContain("Enter text...");
  });

  test("shows typed value", async () => {
    const onChange = mock((value: string) => {});
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <TextInput value="" onChange={onChange} />
      </TestWrapper>,
    );

    stdin.write("hello");
    await tick();

    // onChange should be called for each character
    expect(onChange).toHaveBeenCalled();
  });

  test("shows controlled value", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <TextInput value="test value" />
      </TestWrapper>,
    );
    const frame = lastFrame();

    expect(frame).toContain("test value");
  });

  test("backspace removes last character", async () => {
    const onChange = mock((value: string) => {});
    const { stdin } = render(
      <TestWrapper>
        <TextInput value="hello" onChange={onChange} />
      </TestWrapper>,
    );

    // Press backspace
    stdin.write("\x7F");
    await tick();

    expect(onChange).toHaveBeenCalledWith("hell");
  });

  test("enter triggers onSubmit", async () => {
    const onSubmit = mock((value: string) => {});
    const { stdin } = render(
      <TestWrapper>
        <TextInput value="test" onSubmit={onSubmit} />
      </TestWrapper>,
    );

    stdin.write("\r");
    await tick();

    expect(onSubmit).toHaveBeenCalledWith("test");
  });

  test("validation error blocks submit", async () => {
    const onSubmit = mock((value: string) => {});
    const validate = (value: string) => (value.length < 3 ? "Too short" : null);
    const { stdin, lastFrame } = render(
      <TestWrapper>
        <TextInput value="ab" onSubmit={onSubmit} validate={validate} />
      </TestWrapper>,
    );

    stdin.write("\r");
    await tick();

    // onSubmit should not be called due to validation error
    expect(onSubmit).not.toHaveBeenCalled();

    // Error message should be displayed
    const frame = lastFrame();
    expect(frame).toContain("Too short");
  });

  test("validation passes with valid input", async () => {
    const onSubmit = mock((value: string) => {});
    const validate = (value: string) => (value.length < 3 ? "Too short" : null);
    const { stdin } = render(
      <TestWrapper>
        <TextInput value="hello" onSubmit={onSubmit} validate={validate} />
      </TestWrapper>,
    );

    stdin.write("\r");
    await tick();

    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  test("shows cursor when focused", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <TextInput value="" focus={true} />
      </TestWrapper>,
    );
    const frame = lastFrame();

    // Cursor block character should be visible when focused
    expect(frame).toContain("█");
  });

  test("does not show cursor when not focused", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <TextInput value="" focus={false} />
      </TestWrapper>,
    );
    const frame = lastFrame();

    // No cursor should be visible
    expect(frame).not.toContain("█");
  });

  test("does not respond to input when focus is false", async () => {
    const onChange = mock((value: string) => {});
    const { stdin } = render(
      <TestWrapper>
        <TextInput value="" onChange={onChange} focus={false} />
      </TestWrapper>,
    );

    stdin.write("test");
    await tick();

    expect(onChange).not.toHaveBeenCalled();
  });

  test("Ctrl+C clears input when there is content", async () => {
    const onChange = mock((value: string) => {});
    const setShowExitHint = mock((v: boolean) => {});
    const { stdin } = render(
      <TestWrapper mockContext={{ setShowExitHint }}>
        <TextInput value="some text" onChange={onChange} />
      </TestWrapper>,
    );

    // Send Ctrl+C
    stdin.write("\x03");
    await tick();

    expect(onChange).toHaveBeenCalledWith("");
    expect(setShowExitHint).toHaveBeenCalledWith(true);
  });

  test("suppresses exit when focused with content", async () => {
    const setSuppressExit = mock((v: boolean) => {});
    render(
      <TestWrapper mockContext={{ setSuppressExit }}>
        <TextInput value="content" focus={true} />
      </TestWrapper>,
    );
    await tick();

    // Should suppress exit when focused with content
    expect(setSuppressExit).toHaveBeenCalledWith(true);
  });
});
