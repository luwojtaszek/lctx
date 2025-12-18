import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { TextInput } from "../shared";
import { AppContext } from "../shared/AppContext.js";
import {
  validateGitUrl,
  validateRequired,
  validateSourceName,
} from "../validation.js";
import type { WizardProps } from "./types.js";

type Step = "url" | "branch" | "name" | "description" | "confirm";

export function AddGitSourceWizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useInput((_, key) => {
    if (key.escape) {
      const steps: Step[] = ["url", "branch", "name", "description", "confirm"];
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

  const handleUrlSubmit = (value: string) => {
    setUrl(value);
    setStep("branch");
  };

  const handleBranchSubmit = (value: string) => {
    setBranch(value);
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
      type: "git",
      url,
      branch: branch || undefined,
      name,
      description,
    });
  };

  const currentStepNumber =
    ["url", "branch", "name", "description", "confirm"].indexOf(step) + 1;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Add Git Repository
        </Text>
        <Text color="gray"> - Step {currentStepNumber}/5</Text>
      </Box>

      {step === "url" && (
        <>
          <Box marginBottom={1}>
            <Text>Repository URL:</Text>
          </Box>
          <TextInput
            value={url}
            onChange={setUrl}
            onSubmit={handleUrlSubmit}
            validate={validateGitUrl}
            placeholder="https://github.com/user/repo or git@github.com:user/repo"
          />
        </>
      )}

      {step === "branch" && (
        <>
          <Box marginBottom={1}>
            <Text>Branch (optional, leave empty for remote default):</Text>
          </Box>
          <TextInput
            value={branch}
            onChange={setBranch}
            onSubmit={handleBranchSubmit}
            placeholder="main, master, develop..."
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
              Type: <Text color="cyan">git</Text>
            </Text>
            <Text>
              URL: <Text color="cyan">{url}</Text>
            </Text>
            <Text>
              Branch: <Text color="cyan">{branch || "(remote default)"}</Text>
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
