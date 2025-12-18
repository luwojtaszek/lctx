import { Box, Text, useInput } from "ink";
import { useState } from "react";

export interface SelectItem<T = string> {
  label: string;
  value: T;
  shortcut?: string;
}

interface SelectInputProps<T = string> {
  items: SelectItem<T>[];
  onSelect?: (item: SelectItem<T>) => void;
  initialIndex?: number;
  focus?: boolean;
}

export function SelectInput<T = string>({
  items,
  onSelect,
  initialIndex = 0,
  focus = true,
}: SelectInputProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput(
    (input, key) => {
      if (!focus) return;

      if (key.upArrow) {
        setSelectedIndex((i) => (i === 0 ? items.length - 1 : i - 1));
      } else if (key.downArrow) {
        setSelectedIndex((i) => (i === items.length - 1 ? 0 : i + 1));
      } else if (key.return) {
        const item = items[selectedIndex];
        if (item) {
          onSelect?.(item);
        }
      } else {
        // Check for shortcut key press
        const matchedItem = items.find(
          (item) => item.shortcut?.toLowerCase() === input.toLowerCase(),
        );
        if (matchedItem) {
          onSelect?.(matchedItem);
        }
      }
    },
    { isActive: focus },
  );

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={String(item.value)}>
            <Text color={isSelected ? "cyan" : undefined}>
              {item.shortcut ? (
                <>
                  {"  "}[<Text color="cyan">{item.shortcut}</Text>] {item.label}
                </>
              ) : (
                <>
                  {isSelected ? "❯ " : "  "}
                  {item.label}
                </>
              )}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
