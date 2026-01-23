import { Box, Text, useInput } from "ink";
import type { VersionInfo } from "../../shared";

interface UpdateBannerProps {
  versionInfo: VersionInfo;
  onDismiss: () => void;
}

export function UpdateBanner({ versionInfo, onDismiss }: UpdateBannerProps) {
  useInput((input) => {
    if (input === "d" || input === "D") {
      onDismiss();
    }
  });

  return (
    <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
      <Text>
        <Text color="yellow">Update available:</Text>{" "}
        <Text>{versionInfo.current}</Text>
        <Text color="gray"> → </Text>
        <Text color="green">{versionInfo.latest}</Text>
        <Text color="gray"> Run </Text>
        <Text color="cyan">lctx upgrade</Text>
        <Text color="gray"> [</Text>
        <Text color="white">d</Text>
        <Text color="gray">]ismiss</Text>
      </Text>
    </Box>
  );
}
