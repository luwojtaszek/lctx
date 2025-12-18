import { type CoreModule, createCoreModule } from "@lctx/core";
import type { Source } from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import {
  MultiSelectInput,
  type MultiSelectItem,
  Spinner,
  TextInput,
} from "./shared";
import { AppContext } from "./shared/AppContext.js";
import { validateRequired } from "./validation.js";

type Step = "source" | "question" | "loading" | "response";

interface AskScreenProps {
  onBack: () => void;
}

export function AskScreen({ onBack }: AskScreenProps) {
  const [step, setStep] = useState<Step>("source");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Source[]>([]);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [coreModule, setCoreModule] = useState<CoreModule | null>(null);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const core = await createCoreModule();
      setCoreModule(core);
      const sourcesList = await core.sourcesManager.listSources();
      setSources(sourcesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (step === "source") {
          onBack();
        } else if (step === "question") {
          setStep("source");
          setSelectedSources([]);
        } else if (step === "response") {
          setStep("question");
          setResponse("");
        }
      }
    },
    { isActive: step !== "loading" },
  );

  const sourceItems: MultiSelectItem<string>[] = sources.map((s) => ({
    label: `${s.name} (${s.type})`,
    value: s.name,
  }));

  const handleSourcesSubmit = (items: MultiSelectItem<string>[]) => {
    const selected = items
      .map((item) => sources.find((s) => s.name === item.value))
      .filter((s): s is Source => s !== undefined);
    if (selected.length > 0) {
      setSelectedSources(selected);
      setStep("question");
    }
  };

  const handleQuestionSubmit = async (q: string) => {
    if (!coreModule || selectedSources.length === 0) return;

    setQuestion(q);
    setStep("loading");

    try {
      const result = await coreModule.subagentRunner.ask({
        sources: selectedSources.map((s) => s.name),
        question: q,
      });
      setResponse(result.answer);
      setStep("response");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
      setStep("question");
    }
  };

  const selectedSourcesDisplay = selectedSources.map((s) => s.name).join(", ");

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Ask
          </Text>
        </Box>
        <Spinner label="Loading sources..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Ask
          </Text>
        </Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (sources.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Ask
          </Text>
        </Box>
        <Text color="yellow">
          No sources available. Add some sources first.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Ask
        </Text>
      </Box>

      {step === "source" && (
        <>
          <Box marginBottom={1}>
            <Text>Select sources to ask about:</Text>
          </Box>
          <MultiSelectInput
            items={sourceItems}
            onSubmit={handleSourcesSubmit}
          />
        </>
      )}

      {step === "question" && (
        <>
          <Box marginBottom={1}>
            <Text>
              Sources: <Text color="cyan">{selectedSourcesDisplay}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>Enter your question:</Text>
          </Box>
          <TextInput
            value={question}
            onChange={setQuestion}
            onSubmit={handleQuestionSubmit}
            validate={validateRequired}
            placeholder="What would you like to know?"
          />
        </>
      )}

      {step === "loading" && (
        <>
          <Box marginBottom={1}>
            <Text>
              Sources: <Text color="cyan">{selectedSourcesDisplay}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Q: <Text color="yellow">{question}</Text>
            </Text>
          </Box>
          <Spinner label="Thinking..." />
        </>
      )}

      {step === "response" && (
        <>
          <Box marginBottom={1}>
            <Text>
              Sources: <Text color="cyan">{selectedSourcesDisplay}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Q: <Text color="yellow">{question}</Text>
            </Text>
          </Box>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold>Answer:</Text>
            <Text>{response}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
