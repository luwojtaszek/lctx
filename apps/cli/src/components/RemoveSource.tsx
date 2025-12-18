import { Box, Text, useInput } from "ink";

interface RemoveSourceProps {
  sourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveSource({
  sourceName,
  onConfirm,
  onCancel,
}: RemoveSourceProps) {
  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N" || key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="red">
          Delete Source
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Are you sure you want to delete{" "}
          <Text color="cyan" bold>
            {sourceName}
          </Text>
          ?
        </Text>
      </Box>

      <Box>
        <Text>
          Press <Text color="green">y</Text> to confirm,{" "}
          <Text color="red">n</Text> to cancel
        </Text>
      </Box>
    </Box>
  );
}
