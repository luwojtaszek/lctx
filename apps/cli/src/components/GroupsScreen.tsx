import {
  type CoreModule,
  type SourceGroup,
  createCoreModule,
} from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { AddGroup } from "./AddGroup.js";
import { RemoveGroup } from "./RemoveGroup.js";
import { type Column, Spinner, Table } from "./shared";
import { AppContext } from "./shared/AppContext.js";

type View = "list" | "add" | "remove";

interface GroupRow {
  id: string;
  name: string;
  sources: string;
  description: string;
}

interface GroupsScreenProps {
  onBack: () => void;
}

const columns: Column<GroupRow>[] = [
  { key: "name", label: "Name", width: 20 },
  { key: "sources", label: "Sources", width: 10 },
  { key: "description", label: "Description", width: 40 },
];

export function GroupsScreen({ onBack }: GroupsScreenProps) {
  const [view, setView] = useState<View>("list");
  const [groups, setGroups] = useState<SourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coreModule, setCoreModule] = useState<CoreModule | null>(null);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const core = await createCoreModule();
      setCoreModule(core);
      const groupsList = await core.groupManager.list();
      setGroups(groupsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const groupRows: GroupRow[] = groups.map((g) => ({
    id: g.name,
    name: g.name,
    sources: String(g.sources.length),
    description: g.description || "",
  }));

  const selectedGroup = groups[selectedIndex];

  useInput(
    (input, key) => {
      if (view !== "list") return;

      if (key.escape) {
        onBack();
      }
      if (input === "a") {
        setView("add");
      }
      if (input === "d" && selectedGroup) {
        setView("remove");
      }
      if (key.return && selectedGroup) {
        // Show group details
        console.log(`Group: ${selectedGroup.name}`);
        console.log(`Sources: ${selectedGroup.sources.join(", ")}`);
      }
    },
    { isActive: view === "list" },
  );

  const handleAdd = async (data: {
    name: string;
    sources: string[];
    description?: string;
  }) => {
    if (!coreModule) return;
    try {
      await coreModule.groupManager.create(
        data.name,
        data.sources,
        data.description,
      );
      await loadGroups();
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add group");
      setView("list");
    }
  };

  const handleRemove = async () => {
    if (!coreModule || !selectedGroup) return;
    try {
      await coreModule.groupManager.delete(selectedGroup.name);
      await loadGroups();
      if (selectedIndex >= groups.length - 1) {
        setSelectedIndex(Math.max(0, groups.length - 2));
      }
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove group");
      setView("list");
    }
  };

  if (view === "add") {
    return <AddGroup onAdd={handleAdd} onCancel={() => setView("list")} />;
  }

  if (view === "remove" && selectedGroup) {
    return (
      <RemoveGroup
        groupName={selectedGroup.name}
        onConfirm={handleRemove}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Groups
        </Text>
      </Box>

      {loading && <Spinner label="Loading groups..." />}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {!loading && !error && groups.length === 0 && (
        <Box marginBottom={1}>
          <Text color="gray">No groups configured. Press [a] to add one.</Text>
        </Box>
      )}

      {!loading && !error && groups.length > 0 && (
        <Table
          data={groupRows}
          columns={columns}
          selectedIndex={selectedIndex}
          onSelectionChange={setSelectedIndex}
        />
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          [<Text color="cyan">a</Text>] Add{"  "}[<Text color="cyan">d</Text>]
          Delete{"  "}[<Text color="cyan">Enter</Text>] Show Details
        </Text>
      </Box>
    </Box>
  );
}
