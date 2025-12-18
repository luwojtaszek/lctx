import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { SelectInput, type SelectItem } from "../../../src/components/shared";

const testItems: SelectItem<string>[] = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C", value: "c" },
];

const itemsWithShortcuts: SelectItem<string>[] = [
  { label: "Sources", value: "sources", shortcut: "s" },
  { label: "Ask", value: "ask", shortcut: "a" },
  { label: "Help", value: "help", shortcut: "h" },
];

// Key escape sequences for terminal
const KEYS = {
  DOWN: "\x1B[B",
  UP: "\x1B[A",
  ENTER: "\r",
};

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SelectInput", () => {
  test("renders all items", () => {
    const { lastFrame } = render(<SelectInput items={testItems} />);
    const frame = lastFrame();

    expect(frame).toContain("Option A");
    expect(frame).toContain("Option B");
    expect(frame).toContain("Option C");
  });

  test("shows selection indicator on first item by default", () => {
    const { lastFrame } = render(<SelectInput items={testItems} />);
    const frame = lastFrame();

    // First item should have the selection indicator
    expect(frame).toContain("❯");
  });

  test("respects initialIndex prop", () => {
    const { lastFrame } = render(
      <SelectInput items={testItems} initialIndex={1} />,
    );
    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // Second item should be selected (index 1)
    expect(lines[1]).toContain("❯");
  });

  test("arrow down moves selection", async () => {
    const { stdin, lastFrame } = render(<SelectInput items={testItems} />);

    // Press down arrow
    stdin.write(KEYS.DOWN);
    await tick();

    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // Second item should now be selected
    expect(lines[1]).toContain("❯");
  });

  test("arrow up moves selection", async () => {
    const { stdin, lastFrame } = render(
      <SelectInput items={testItems} initialIndex={1} />,
    );

    // Press up arrow
    stdin.write(KEYS.UP);
    await tick();

    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // First item should now be selected
    expect(lines[0]).toContain("❯");
  });

  test("arrow down wraps to first item", async () => {
    const { stdin, lastFrame } = render(
      <SelectInput items={testItems} initialIndex={2} />,
    );

    // Press down arrow from last item
    stdin.write(KEYS.DOWN);
    await tick();

    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // First item should be selected after wrap
    expect(lines[0]).toContain("❯");
  });

  test("arrow up wraps to last item", async () => {
    const { stdin, lastFrame } = render(
      <SelectInput items={testItems} initialIndex={0} />,
    );

    // Press up arrow from first item
    stdin.write(KEYS.UP);
    await tick();

    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // Last item should be selected after wrap
    expect(lines[2]).toContain("❯");
  });

  test("enter triggers onSelect with current item", async () => {
    const onSelect = mock(() => {});
    const { stdin } = render(
      <SelectInput items={testItems} onSelect={onSelect} />,
    );

    // Press enter
    stdin.write(KEYS.ENTER);
    await tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(testItems[0]);
  });

  test("enter after navigation selects correct item", async () => {
    const onSelect = mock(() => {});
    const { stdin } = render(
      <SelectInput items={testItems} onSelect={onSelect} />,
    );

    // Navigate down then press enter
    stdin.write(KEYS.DOWN);
    await tick();
    stdin.write(KEYS.ENTER);
    await tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(testItems[1]);
  });

  test("renders shortcut keys when provided", () => {
    const { lastFrame } = render(<SelectInput items={itemsWithShortcuts} />);
    const frame = lastFrame();

    expect(frame).toContain("[s]");
    expect(frame).toContain("[a]");
    expect(frame).toContain("[h]");
  });

  test("shortcut key triggers onSelect", async () => {
    const onSelect = mock(() => {});
    const { stdin } = render(
      <SelectInput items={itemsWithShortcuts} onSelect={onSelect} />,
    );

    // Press 'a' shortcut
    stdin.write("a");
    await tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(itemsWithShortcuts[1]); // "Ask" has shortcut 'a'
  });

  test("shortcut key is case insensitive", async () => {
    const onSelect = mock(() => {});
    const { stdin } = render(
      <SelectInput items={itemsWithShortcuts} onSelect={onSelect} />,
    );

    // Press 'S' uppercase
    stdin.write("S");
    await tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(itemsWithShortcuts[0]); // "Sources" has shortcut 's'
  });

  test("does not respond to input when focus is false", async () => {
    const onSelect = mock(() => {});
    const { stdin } = render(
      <SelectInput items={testItems} onSelect={onSelect} focus={false} />,
    );

    stdin.write(KEYS.ENTER);
    await tick();

    expect(onSelect).not.toHaveBeenCalled();
  });
});
