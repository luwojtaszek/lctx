import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { TextInput } from "../shared";
import { AppContext } from "../shared/AppContext.js";
import {
  validateDirectoryPath,
  validateRequired,
  validateSourceName,
} from "../validation.js";
import type { WizardProps } from "./types.js";

type Step = "path" | "name" | "description" | "confirm";

export function AddDirectorySourceWizard({
  onComplete,
  onCancel,
}: WizardProps) {
  const [step, setStep] = useState<Step>("path");
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useInput((_, key) => {
    if (key.escape) {
      const steps: Step[] = ["path", "name", "description", "confirm"];
      const currentIndex = steps.indexOf(step);
      if (currentIndex === 0) {
        onCancel();
      } else {
        const prevStep = steps[currentIndex - 1];
        if (prevStep) {
          setStep(prevStep);
        }
      }
    }
  });

  const handlePathSubmit = (value: string) => {
    setPath(value);
    setStep("name");
  };

  const handleNameSubmit = (value: string) => {
    setName(value);
    setStep("description");
  };

  const handleDescriptionSubmit = (value: string) => {
    setDescription(value);
    setStep("confirm");
  };

  const handleConfirm = () => {
    onComplete({
      type: "directory",
      path,
      name,
      description,
    });
  };

  const currentStepNumber =
    ["path", "name", "description", "confirm"].indexOf(step) + 1;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Add Local Directory
        </Text>
        <Text color="gray"> - Step {currentStepNumber}/4</Text>
      </Box>

      {step === "path" && (
        <>
          <Box marginBottom={1}>
            <Text>Directory Path:</Text>
          </Box>
          <TextInput
            value={path}
            onChange={setPath}
            onSubmit={handlePathSubmit}
            validate={validateDirectoryPath}
            placeholder="/path/to/directory"
          />
        </>
      )}

      {step === "name" && (
        <>
          <Box marginBottom={1}>
            <Text>Source name (alphanumeric, hyphens, underscores):</Text>
          </Box>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            validate={validateSourceName}
            placeholder="my-source"
          />
        </>
      )}

      {step === "description" && (
        <>
          <Box marginBottom={1}>
            <Text>Description:</Text>
          </Box>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            validate={validateRequired}
            placeholder="Brief description of this source"
          />
        </>
      )}

      {step === "confirm" && (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold>Review:</Text>
            <Text>
              Type: <Text color="cyan">directory</Text>
            </Text>
            <Text>
              Path: <Text color="cyan">{path}</Text>
            </Text>
            <Text>
              Name: <Text color="cyan">{name}</Text>
            </Text>
            <Text>
              Description: <Text color="cyan">{description}</Text>
            </Text>
          </Box>
          <ConfirmPrompt onConfirm={handleConfirm} onCancel={onCancel} />
        </>
      )}
    </Box>
  );
}

function ConfirmPrompt({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useInput((input) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N") {
      onCancel();
    }
  });

  return (
    <Box>
      <Text>
        Add this source? <Text color="green">y</Text>/<Text color="red">n</Text>
      </Text>
    </Box>
  );
}
