import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { TextInput } from "./shared";
import { AppContext } from "./shared/AppContext.js";
import { validateRequired } from "./validation.js";

interface EditSourceProps {
  sourceName: string;
  currentDescription: string;
  onSave: (description: string) => void;
  onCancel: () => void;
}

export function EditSource({
  sourceName,
  currentDescription,
  onSave,
  onCancel,
}: EditSourceProps) {
  const [description, setDescription] = useState(currentDescription);
  const [submitted, setSubmitted] = useState(false);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = (value: string) => {
    setSubmitted(true);
    onSave(value);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Edit Source: {sourceName}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Description:</Text>
      </Box>

      <Box marginBottom={1}>
        <TextInput
          value={description}
          onChange={setDescription}
          onSubmit={handleSubmit}
          validate={validateRequired}
          placeholder="Enter description..."
          focus={!submitted}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press Enter to save</Text>
      </Box>
    </Box>
  );
}
