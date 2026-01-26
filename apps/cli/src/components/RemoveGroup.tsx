import { Box, Text, useInput } from "ink";

interface RemoveGroupProps {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveGroup({
  groupName,
  onConfirm,
  onCancel,
}: RemoveGroupProps) {
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
          Delete Group
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Are you sure you want to delete group{" "}
          <Text color="cyan" bold>
            {groupName}
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
