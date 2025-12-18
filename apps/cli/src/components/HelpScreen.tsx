import { Box, Text, useInput } from "ink";
import { useContext, useEffect } from "react";
import { AppContext } from "./shared/AppContext.js";

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          lctx - Local Context Aggregator
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Interactive Mode</Text>
        <Text color="gray">
          Run `lctx` without arguments to start interactive mode.
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Navigation</Text>
        <Text>
          <Text color="cyan">↑/↓</Text> Navigate items
        </Text>
        <Text>
          <Text color="cyan">Enter</Text> Select item
        </Text>
        <Text>
          <Text color="cyan">Esc</Text> Go back
        </Text>
        <Text>
          <Text color="cyan">Ctrl+C</Text> Quit
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Direct Commands</Text>
        <Text>
          <Text color="cyan">lctx help</Text> Show this help
        </Text>
        <Text>
          <Text color="cyan">lctx ask &lt;sources&gt; &lt;question&gt;</Text>{" "}
          Ask a question
        </Text>
        <Text>
          <Text color="cyan">lctx chat &lt;sources&gt;</Text> Start chat session
        </Text>
        <Text>
          <Text color="cyan">lctx sync [name]</Text> Sync source(s)
        </Text>
        <Text>
          <Text color="cyan">lctx mcp</Text> Start MCP server
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Sources Screen</Text>
        <Text>
          <Text color="cyan">a</Text> Add source
        </Text>
        <Text>
          <Text color="cyan">d</Text> Delete selected source
        </Text>
        <Text>
          <Text color="cyan">u</Text> Update source metadata
        </Text>
        <Text>
          <Text color="cyan">s</Text> Sync selected source
        </Text>
        <Text>
          <Text color="cyan">S</Text> Sync all sources
        </Text>
      </Box>
    </Box>
  );
}
