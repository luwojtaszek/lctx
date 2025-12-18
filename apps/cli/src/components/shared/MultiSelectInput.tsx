import { Box, Text, useInput } from "ink";
import { useState } from "react";

export interface MultiSelectItem<T = string> {
  label: string;
  value: T;
}

interface MultiSelectInputProps<T = string> {
  items: MultiSelectItem<T>[];
  onSubmit?: (selectedItems: MultiSelectItem<T>[]) => void;
  initialSelected?: T[];
  focus?: boolean;
  minSelection?: number;
}

export function MultiSelectInput<T = string>({
  items,
  onSubmit,
  initialSelected = [],
  focus = true,
  minSelection = 1,
}: MultiSelectInputProps<T>) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<Set<T>>(
    new Set(initialSelected),
  );
  const [error, setError] = useState<string | null>(null);

  useInput(
    (input, key) => {
      if (!focus) return;

      if (key.upArrow) {
        setCursorIndex((i) => (i === 0 ? items.length - 1 : i - 1));
        setError(null);
      } else if (key.downArrow) {
        setCursorIndex((i) => (i === items.length - 1 ? 0 : i + 1));
        setError(null);
      } else if (input === " ") {
        // Toggle selection
        const item = items[cursorIndex];
        if (item) {
          setSelectedValues((prev) => {
            const next = new Set(prev);
            if (next.has(item.value)) {
              next.delete(item.value);
            } else {
              next.add(item.value);
            }
            return next;
          });
          setError(null);
        }
      } else if (key.return) {
        if (selectedValues.size < minSelection) {
          setError(
            minSelection === 1
              ? "Select at least one item"
              : `Select at least ${minSelection} items`,
          );
          return;
        }
        const selectedItems = items.filter((item) =>
          selectedValues.has(item.value),
        );
        onSubmit?.(selectedItems);
      }
    },
    { isActive: focus },
  );

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isCursor = index === cursorIndex;
        const isSelected = selectedValues.has(item.value);
        return (
          <Box key={String(item.value)}>
            <Text color={isCursor ? "cyan" : undefined}>
              {isCursor ? "❯ " : "  "}
              <Text color={isSelected ? "green" : "gray"}>
                {isSelected ? "◉" : "○"}
              </Text>{" "}
              {item.label}
            </Text>
          </Box>
        );
      })}
      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="gray">
          Space to toggle, Enter to confirm ({selectedValues.size} selected)
        </Text>
      </Box>
    </Box>
  );
}
