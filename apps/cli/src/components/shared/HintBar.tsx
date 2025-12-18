import { Box, Text } from "ink";
import { useContext } from "react";
import { AppContext } from "./AppContext.js";

export function HintBar() {
  const { showBackHint, showExitHint } = useContext(AppContext);

  if (!showBackHint && !showExitHint) {
    return null;
  }

  return (
    <Box paddingLeft={1}>
      <Text color="white">
        {showBackHint && "[Esc] Back"}
        {showBackHint && showExitHint && " · "}
        {showExitHint && <Text color="yellow">Press Ctrl-C again to exit</Text>}
      </Text>
    </Box>
  );
}
