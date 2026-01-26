import {
  type CoreModule,
  type SourceHealth,
  createCoreModule,
} from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { type Column, Spinner, Table } from "./shared";
import { AppContext } from "./shared/AppContext.js";

interface HealthRow {
  id: string;
  name: string;
  type: string;
  status: string;
  details: string;
}

interface HealthDashboardProps {
  onBack: () => void;
}

const columns: Column<HealthRow>[] = [
  { key: "name", label: "Name", width: 25 },
  { key: "type", label: "Type", width: 12 },
  { key: "status", label: "Status", width: 10 },
  { key: "details", label: "Details", width: 30 },
];

function formatDetails(health: SourceHealth): string {
  const parts: string[] = [];

  if (health.errorMessage) {
    return health.errorMessage;
  }

  if (health.staleDays !== undefined) {
    parts.push(`${health.staleDays}d old`);
  }

  if (
    health.details?.behindCommits !== undefined &&
    health.details.behindCommits > 0
  ) {
    parts.push(`${health.details.behindCommits} behind`);
  }

  if (health.details?.currentBranch) {
    parts.push(health.details.currentBranch);
  }

  if (health.details?.localSize !== undefined) {
    const sizeKb = Math.round(health.details.localSize / 1024);
    parts.push(`${sizeKb} KB`);
  }

  return parts.join(", ");
}

export function HealthDashboard({ onBack }: HealthDashboardProps) {
  const [healthResults, setHealthResults] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coreModule, setCoreModule] = useState<CoreModule | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { setShowBackHint } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const core = await createCoreModule();
      setCoreModule(core);
      const results = await core.sourcesManager.checkHealthAll();
      setHealthResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check health");
    } finally {
      setLoading(false);
    }
  };

  const healthRows: HealthRow[] = healthResults.map((h) => ({
    id: h.name,
    name: h.name,
    type: h.type,
    status: h.status,
    details: formatDetails(h),
  }));

  const selectedHealth = healthResults[selectedIndex];

  useInput((input, key) => {
    if (syncing) return;

    if (key.escape) {
      onBack();
    }
    if (input === "r") {
      loadHealth();
    }
    if (input === "s" && selectedHealth && selectedHealth.status !== "error") {
      handleSync(selectedHealth.name);
    }
    if (input === "S") {
      handleSyncStale();
    }
  });

  const handleSync = async (name: string) => {
    if (!coreModule) return;
    setSyncing(true);
    try {
      await coreModule.sourcesManager.update(name);
      await loadHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncStale = async () => {
    if (!coreModule) return;
    setSyncing(true);
    try {
      const stale = healthResults.filter((h) => h.status === "stale");
      for (const h of stale) {
        await coreModule.sourcesManager.update(h.name);
      }
      await loadHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (syncing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Syncing..." />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Source Health
        </Text>
      </Box>

      {loading && <Spinner label="Checking health..." />}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {!loading && !error && healthResults.length === 0 && (
        <Box marginBottom={1}>
          <Text color="gray">No sources configured.</Text>
        </Box>
      )}

      {!loading && !error && healthResults.length > 0 && (
        <Table
          data={healthRows}
          columns={columns}
          selectedIndex={selectedIndex}
          onSelectionChange={setSelectedIndex}
        />
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          [<Text color="cyan">r</Text>] Refresh{"  "}[
          <Text color="cyan">s</Text>] Sync Selected{"  "}[
          <Text color="cyan">S</Text>] Sync All Stale
        </Text>
      </Box>
    </Box>
  );
}
