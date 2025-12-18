import { Box, Text, useInput } from "ink";
import { useState } from "react";

export interface Column<T> {
  key: keyof T;
  label: string;
  width: number;
  render?: (value: T[keyof T], row: T) => string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSelect?: (row: T, index: number) => void;
  selectedIndex?: number;
  onSelectionChange?: (index: number) => void;
  focus?: boolean;
}

export function Table<T extends { id?: string | number }>({
  data,
  columns,
  onSelect,
  selectedIndex: controlledIndex,
  onSelectionChange,
  focus = true,
}: TableProps<T>) {
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;
  const setSelectedIndex = onSelectionChange ?? setInternalIndex;

  useInput(
    (input, key) => {
      if (!focus || data.length === 0) return;

      if (key.upArrow) {
        const newIndex =
          selectedIndex === 0 ? data.length - 1 : selectedIndex - 1;
        setSelectedIndex(newIndex);
      } else if (key.downArrow) {
        const newIndex =
          selectedIndex === data.length - 1 ? 0 : selectedIndex + 1;
        setSelectedIndex(newIndex);
      } else if (key.return) {
        const row = data[selectedIndex];
        if (row) {
          onSelect?.(row, selectedIndex);
        }
      }
    },
    { isActive: focus },
  );

  const truncate = (str: string, width: number): string => {
    if (str.length <= width) return str.padEnd(width);
    return `${str.slice(0, width - 1)}…`;
  };

  const getCellValue = (row: T, column: Column<T>): string => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return String(value ?? "");
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text color="gray">{"  "}</Text>
        {columns.map((col) => (
          <Text key={String(col.key)} color="gray" bold>
            {truncate(col.label, col.width)}{" "}
          </Text>
        ))}
      </Box>

      {/* Separator */}
      <Box>
        <Text color="gray">
          {"  "}
          {columns.map((col) => "─".repeat(col.width)).join(" ")}
        </Text>
      </Box>

      {/* Rows */}
      {data.length === 0 ? (
        <Box>
          <Text color="gray" dimColor>
            {"  "}No items
          </Text>
        </Box>
      ) : (
        data.map((row, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={row.id ?? index}>
              <Text color={isSelected ? "cyan" : undefined}>
                {isSelected ? "❯ " : "  "}
              </Text>
              {columns.map((col) => (
                <Text
                  key={String(col.key)}
                  color={isSelected ? "cyan" : undefined}
                >
                  {truncate(getCellValue(row, col), col.width)}{" "}
                </Text>
              ))}
            </Box>
          );
        })
      )}
    </Box>
  );
}
