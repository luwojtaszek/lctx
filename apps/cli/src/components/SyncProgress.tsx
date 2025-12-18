import { Box, Text } from "ink";
import { Spinner } from "./shared";

interface SyncProgressProps {
  sourceName: string;
  isAll?: boolean;
}

export function SyncProgress({ sourceName, isAll }: SyncProgressProps) {
  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Spinner
          label={isAll ? "Syncing all sources..." : `Syncing ${sourceName}...`}
        />
      </Box>
    </Box>
  );
}
