import { type CoreModule, createCoreModule } from "@lctx/core";
import type { Source } from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { AddSource } from "./AddSource.js";
import { EditSource } from "./EditSource.js";
import { RemoveSource } from "./RemoveSource.js";
import { SyncProgress } from "./SyncProgress.js";
import { type Column, Spinner, Table } from "./shared";
import { AppContext } from "./shared/AppContext.js";

type View = "list" | "add" | "edit" | "remove" | "sync";

interface SourceRow {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface SourcesScreenProps {
  onBack: () => void;
}

const columns: Column<SourceRow>[] = [
  { key: "name", label: "Name", width: 20 },
  { key: "type", label: "Type", width: 10 },
  { key: "description", label: "Description", width: 40 },
];

export function SourcesScreen({ onBack }: SourcesScreenProps) {
  const [view, setView] = useState<View>("list");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coreModule, setCoreModule] = useState<CoreModule | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
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

  const sourceRows: SourceRow[] = sources.map((s) => ({
    id: s.name,
    name: s.name,
    type: s.type,
    description: s.description || "",
  }));

  const selectedSource = sources[selectedIndex];

  useInput(
    (input, key) => {
      if (view !== "list") return;

      if (key.escape) {
        onBack();
      }
      if (input === "a") {
        setView("add");
      }
      if (input === "d" && selectedSource) {
        setView("remove");
      }
      if (input === "u" && selectedSource) {
        setView("edit");
      }
      if (input === "s" && selectedSource) {
        setView("sync");
        handleSync(selectedSource.name);
      }
      if (input === "S") {
        setSyncingAll(true);
        setView("sync");
        handleSyncAll();
      }
    },
    { isActive: view === "list" },
  );

  const handleSync = async (name: string) => {
    if (!coreModule) return;
    try {
      await coreModule.sourcesManager.update(name);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setView("list");
    }
  };

  const handleSyncAll = async () => {
    if (!coreModule) return;
    try {
      await coreModule.sourcesManager.updateAll();
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync all failed");
    } finally {
      setSyncingAll(false);
      setView("list");
    }
  };

  const handleAdd = async (source: {
    type: "git" | "docs" | "file" | "directory";
    url?: string;
    path?: string;
    name: string;
    description: string;
    branch?: string;
  }) => {
    if (!coreModule) return;
    try {
      let newSource: Source;
      if (source.type === "git") {
        newSource = {
          type: "git",
          name: source.name,
          url: source.url ?? "",
          branch: source.branch || undefined,
          description: source.description,
        };
      } else if (source.type === "docs") {
        newSource = {
          type: "docs",
          name: source.name,
          url: source.url ?? "",
          description: source.description,
        };
      } else if (source.type === "file") {
        newSource = {
          type: "file",
          name: source.name,
          path: source.path ?? "",
          description: source.description,
        };
      } else {
        newSource = {
          type: "directory",
          name: source.name,
          path: source.path ?? "",
          description: source.description,
        };
      }
      await coreModule.sourcesManager.add(newSource);
      await loadSources();
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source");
      setView("list");
    }
  };

  const handleEdit = async (description: string) => {
    if (!coreModule || !selectedSource) return;
    try {
      // Update source with new description
      const updated = { ...selectedSource, description };
      await coreModule.sourcesManager.delete(selectedSource.name);
      await coreModule.sourcesManager.add(updated);
      await loadSources();
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update source");
      setView("list");
    }
  };

  const handleRemove = async () => {
    if (!coreModule || !selectedSource) return;
    try {
      await coreModule.sourcesManager.delete(selectedSource.name);
      await loadSources();
      if (selectedIndex >= sources.length - 1) {
        setSelectedIndex(Math.max(0, sources.length - 2));
      }
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove source");
      setView("list");
    }
  };

  if (view === "add") {
    return <AddSource onAdd={handleAdd} onCancel={() => setView("list")} />;
  }

  if (view === "edit" && selectedSource) {
    return (
      <EditSource
        sourceName={selectedSource.name}
        currentDescription={selectedSource.description || ""}
        onSave={handleEdit}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "remove" && selectedSource) {
    return (
      <RemoveSource
        sourceName={selectedSource.name}
        onConfirm={handleRemove}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "sync") {
    return (
      <SyncProgress
        sourceName={selectedSource?.name || ""}
        isAll={syncingAll}
      />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Sources
        </Text>
      </Box>

      {loading && <Spinner label="Loading sources..." />}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {!loading && !error && (
        <Table
          data={sourceRows}
          columns={columns}
          selectedIndex={selectedIndex}
          onSelectionChange={setSelectedIndex}
        />
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          <Text color="cyan">[a]</Text> Add{"  "}
          <Text color="cyan">[d]</Text> Delete{"  "}
          <Text color="cyan">[u]</Text> Update{"  "}
          <Text color="cyan">[s]</Text> Sync{"  "}
          <Text color="cyan">[S]</Text> Sync All
        </Text>
      </Box>
    </Box>
  );
}
