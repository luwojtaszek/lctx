import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { type Column, Table } from "../../../src/components/shared/Table.js";

interface TestRow {
  id: string;
  name: string;
  type: string;
}

const testData: TestRow[] = [
  { id: "1", name: "Source A", type: "git" },
  { id: "2", name: "Source B", type: "docs" },
  { id: "3", name: "Source C", type: "file" },
];

const columns: Column<TestRow>[] = [
  { key: "name", label: "Name", width: 15 },
  { key: "type", label: "Type", width: 10 },
];

// Key escape sequences for terminal
const KEYS = {
  DOWN: "\x1B[B",
  UP: "\x1B[A",
  ENTER: "\r",
};

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Table", () => {
  test("renders column headers", () => {
    const { lastFrame } = render(<Table data={testData} columns={columns} />);
    const frame = lastFrame();

    expect(frame).toContain("Name");
    expect(frame).toContain("Type");
  });

  test("renders data rows", () => {
    const { lastFrame } = render(<Table data={testData} columns={columns} />);
    const frame = lastFrame();

    expect(frame).toContain("Source A");
    expect(frame).toContain("Source B");
    expect(frame).toContain("Source C");
    expect(frame).toContain("git");
    expect(frame).toContain("docs");
    expect(frame).toContain("file");
  });

  test("shows No items when empty", () => {
    const { lastFrame } = render(<Table data={[]} columns={columns} />);
    const frame = lastFrame();

    expect(frame).toContain("No items");
  });

  test("shows selection indicator on first row by default", () => {
    const { lastFrame } = render(<Table data={testData} columns={columns} />);
    const frame = lastFrame();

    // Should show the selection indicator
    expect(frame).toContain("❯");
  });

  test("respects selectedIndex prop", () => {
    const { lastFrame } = render(
      <Table data={testData} columns={columns} selectedIndex={1} />,
    );
    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");

    // Find the line with Source B (should be selected)
    const sourceBLine = lines.find((l) => l.includes("Source B"));
    expect(sourceBLine).toContain("❯");
  });

  test("arrow down moves selection", async () => {
    const onSelectionChange = mock((index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={0}
        onSelectionChange={onSelectionChange}
      />,
    );

    stdin.write(KEYS.DOWN);
    await tick();

    expect(onSelectionChange).toHaveBeenCalledWith(1);
  });

  test("arrow up moves selection", async () => {
    const onSelectionChange = mock((index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={1}
        onSelectionChange={onSelectionChange}
      />,
    );

    stdin.write(KEYS.UP);
    await tick();

    expect(onSelectionChange).toHaveBeenCalledWith(0);
  });

  test("arrow down wraps to first row", async () => {
    const onSelectionChange = mock((index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={2}
        onSelectionChange={onSelectionChange}
      />,
    );

    stdin.write(KEYS.DOWN);
    await tick();

    expect(onSelectionChange).toHaveBeenCalledWith(0);
  });

  test("arrow up wraps to last row", async () => {
    const onSelectionChange = mock((index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={0}
        onSelectionChange={onSelectionChange}
      />,
    );

    stdin.write(KEYS.UP);
    await tick();

    expect(onSelectionChange).toHaveBeenCalledWith(2);
  });

  test("enter triggers onSelect with current row", async () => {
    const onSelect = mock((row: TestRow, index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    stdin.write(KEYS.ENTER);
    await tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(testData[0], 0);
  });

  test("custom render function is used", () => {
    const columnsWithRender: Column<TestRow>[] = [
      { key: "name", label: "Name", width: 15 },
      {
        key: "type",
        label: "Type",
        width: 10,
        render: (value) => `[${value}]`,
      },
    ];
    const { lastFrame } = render(
      <Table data={testData} columns={columnsWithRender} />,
    );
    const frame = lastFrame();

    expect(frame).toContain("[git]");
    expect(frame).toContain("[docs]");
  });

  test("truncates long values", () => {
    const longData: TestRow[] = [
      { id: "1", name: "This is a very long source name", type: "git" },
    ];
    const { lastFrame } = render(<Table data={longData} columns={columns} />);
    const frame = lastFrame();

    // Name column is 15 chars wide, so should be truncated with ellipsis
    expect(frame).toContain("…");
  });

  test("does not respond to input when focus is false", async () => {
    const onSelectionChange = mock((index: number) => {});
    const { stdin } = render(
      <Table
        data={testData}
        columns={columns}
        selectedIndex={0}
        onSelectionChange={onSelectionChange}
        focus={false}
      />,
    );

    stdin.write(KEYS.DOWN);
    await tick();

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test("does not respond when data is empty", async () => {
    const onSelect = mock((row: TestRow, index: number) => {});
    const { stdin } = render(
      <Table data={[]} columns={columns} onSelect={onSelect} />,
    );

    stdin.write(KEYS.ENTER);
    await tick();

    expect(onSelect).not.toHaveBeenCalled();
  });
});
