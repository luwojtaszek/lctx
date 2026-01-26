import type { Source } from "@lctx/core";
import { createCoreModule } from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import {
  MultiSelectInput,
  type MultiSelectItem,
  Spinner,
  TextInput,
} from "./shared";
import { AppContext } from "./shared/AppContext.js";

type Step = "name" | "sources" | "description" | "confirm";

interface AddGroupProps {
  onAdd: (data: {
    name: string;
    sources: string[];
    description?: string;
  }) => void;
  onCancel: () => void;
}

export function AddGroup({ onAdd, onCancel }: AddGroupProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const core = await createCoreModule();
      const sourcesList = await core.sourcesManager.listSources();
      setSources(sourcesList);
    } finally {
      setLoading(false);
    }
  };

  useInput((_, key) => {
    if (key.escape) {
      const steps: Step[] = ["name", "sources", "description", "confirm"];
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

  const validateName = (value: string): string | null => {
    if (!value.trim()) return "Name is required";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Name can only contain letters, numbers, hyphens, and underscores";
    }
    return null;
  };

  const handleNameSubmit = (value: string) => {
    setName(value);
    setStep("sources");
  };

  const handleSourcesSubmit = (items: MultiSelectItem<string>[]) => {
    setSelectedSources(items.map((i) => i.value));
    setStep("description");
  };

  const handleDescriptionSubmit = (value: string) => {
    setDescription(value);
    setStep("confirm");
  };

  const handleConfirm = () => {
    onAdd({
      name,
      sources: selectedSources,
      description: description || undefined,
    });
  };

  const sourceItems: MultiSelectItem<string>[] = sources.map((s) => ({
    label: `${s.name} (${s.type})`,
    value: s.name,
  }));

  const currentStepNumber =
    ["name", "sources", "description", "confirm"].indexOf(step) + 1;

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Loading sources..." />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Add Group
        </Text>
        <Text color="gray"> - Step {currentStepNumber}/4</Text>
      </Box>

      {step === "name" && (
        <>
          <Box marginBottom={1}>
            <Text>Group name (alphanumeric, hyphens, underscores):</Text>
          </Box>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            validate={validateName}
            placeholder="my-group"
          />
        </>
      )}

      {step === "sources" && (
        <>
          <Box marginBottom={1}>
            <Text>Select sources to include:</Text>
          </Box>
          {sources.length === 0 ? (
            <Text color="yellow">No sources available. Add sources first.</Text>
          ) : (
            <MultiSelectInput
              items={sourceItems}
              onSubmit={handleSourcesSubmit}
              initialSelected={selectedSources}
              minSelection={1}
            />
          )}
        </>
      )}

      {step === "description" && (
        <>
          <Box marginBottom={1}>
            <Text>Description (optional):</Text>
          </Box>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            placeholder="Brief description of this group"
          />
        </>
      )}

      {step === "confirm" && (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold>Review:</Text>
            <Text>
              Name: <Text color="cyan">{name}</Text>
            </Text>
            <Text>
              Sources: <Text color="cyan">{selectedSources.join(", ")}</Text>
            </Text>
            {description && (
              <Text>
                Description: <Text color="cyan">{description}</Text>
              </Text>
            )}
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
        Add this group? <Text color="green">y</Text>/<Text color="red">n</Text>
      </Text>
    </Box>
  );
}
