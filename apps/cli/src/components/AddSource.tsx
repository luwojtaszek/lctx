import { SOURCE_TYPES, type SourceType } from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { SelectInput, type SelectItem } from "./shared";
import { AppContext } from "./shared/AppContext.js";
import {
  AddDirectorySourceWizard,
  AddDocsSourceWizard,
  AddFileSourceWizard,
  AddGitSourceWizard,
  type SourceData,
} from "./wizards";

interface AddSourceProps {
  onAdd: (source: SourceData) => void;
  onCancel: () => void;
}

const sourceTypeItems: SelectItem<SourceType>[] = SOURCE_TYPES.map((s) => ({
  label: s.label,
  value: s.type,
}));

export function AddSource({ onAdd, onCancel }: AddSourceProps) {
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    if (!sourceType) {
      setShowBackHint(true);
      return () => setShowBackHint(false);
    }
  }, [sourceType, setShowBackHint]);

  useInput((_, key) => {
    if (key.escape && !sourceType) {
      onCancel();
    }
  });

  const handleTypeSelect = (item: SelectItem<SourceType>) => {
    setSourceType(item.value);
  };

  const handleWizardCancel = () => {
    setSourceType(null);
  };

  if (!sourceType) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Add Source
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Select source type:</Text>
        </Box>
        <SelectInput items={sourceTypeItems} onSelect={handleTypeSelect} />
      </Box>
    );
  }

  const wizardProps = {
    onComplete: onAdd,
    onCancel: handleWizardCancel,
  };

  return (
    <Box flexDirection="column" padding={1}>
      {sourceType === "git" && <AddGitSourceWizard {...wizardProps} />}
      {sourceType === "docs" && <AddDocsSourceWizard {...wizardProps} />}
      {sourceType === "file" && <AddFileSourceWizard {...wizardProps} />}
      {sourceType === "directory" && (
        <AddDirectorySourceWizard {...wizardProps} />
      )}
    </Box>
  );
}
