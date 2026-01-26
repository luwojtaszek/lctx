import {
  type CoreModule,
  type MarketplaceItem,
  createCoreModule,
} from "@lctx/core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useState } from "react";
import { Spinner, TextInput } from "./shared";
import { AppContext } from "./shared/AppContext.js";

type View = "list" | "details";

interface MarketplaceScreenProps {
  onBack: () => void;
}

export function MarketplaceScreen({ onBack }: MarketplaceScreenProps) {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coreModule, setCoreModule] = useState<CoreModule | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);
  const [detailSelectedIndex, setDetailSelectedIndex] = useState(0);
  const { setShowBackHint, setSuppressExit } = useContext(AppContext);

  useEffect(() => {
    setShowBackHint(true);
    return () => setShowBackHint(false);
  }, [setShowBackHint]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = coreModule?.marketplaceManager.search(searchQuery) ?? [];
      setFilteredItems(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items, coreModule]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const core = await createCoreModule();
      setCoreModule(core);
      const itemList = core.marketplaceManager.list();
      setItems(itemList);
      setFilteredItems(itemList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = filteredItems[selectedIndex];

  const handleOpenDetails = () => {
    if (selectedItem) {
      setDetailSelectedIndex(0);
      setView("details");
    }
  };

  const handleInstall = async () => {
    if (!coreModule || !selectedItem) return;
    setInstalling(true);
    setError(null);
    try {
      await coreModule.marketplaceManager.install(selectedItem.id);
      setInstallSuccess(selectedItem.name);
      setTimeout(() => {
        setInstallSuccess(null);
        setView("list");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Installation failed");
    } finally {
      setInstalling(false);
    }
  };

  useInput(
    (input, key) => {
      if (view === "list") {
        if (key.escape) {
          if (searchQuery) {
            setSearchQuery("");
          } else {
            onBack();
          }
          return;
        }

        if (key.upArrow) {
          setSelectedIndex((i) => (i === 0 ? filteredItems.length - 1 : i - 1));
          return;
        }

        if (key.downArrow) {
          setSelectedIndex((i) => (i === filteredItems.length - 1 ? 0 : i + 1));
          return;
        }

        if (key.return) {
          handleOpenDetails();
          return;
        }
      }

      if (view === "details") {
        if (key.escape) {
          setView("list");
          return;
        }

        if (key.upArrow) {
          setDetailSelectedIndex((i) => (i === 0 ? 1 : 0));
          return;
        }

        if (key.downArrow) {
          setDetailSelectedIndex((i) => (i === 1 ? 0 : 1));
          return;
        }

        if (key.return) {
          if (detailSelectedIndex === 0) {
            handleInstall();
          } else {
            setView("list");
          }
          return;
        }
      }
    },
    { isActive: view === "details" || (view === "list" && !searchQuery) },
  );

  // Suppress exit when typing in search
  useEffect(() => {
    setSuppressExit(!!searchQuery);
  }, [searchQuery, setSuppressExit]);

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Loading marketplace..." />
      </Box>
    );
  }

  if (installing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label={`Installing ${selectedItem?.name}...`} />
      </Box>
    );
  }

  if (installSuccess) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green">'{installSuccess}' installed!</Text>
      </Box>
    );
  }

  if (view === "details" && selectedItem) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Marketplace details
          </Text>
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">Error: {error}</Text>
          </Box>
        )}

        <Box marginBottom={1} flexDirection="column">
          <Text bold>{selectedItem.name}</Text>
          <Text color="gray">Category: {selectedItem.category}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>{selectedItem.description}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="gray">Tags: {selectedItem.tags.join(", ")}</Text>
        </Box>

        <Box marginBottom={1} flexDirection="column">
          <Text bold>Sources ({selectedItem.sources.length}):</Text>
          {selectedItem.sources.map((source) => (
            <Box key={source.name} flexDirection="column" marginLeft={2}>
              <Text>
                - {source.name} ({source.type})
              </Text>
              <Text color="gray"> {source.description}</Text>
            </Box>
          ))}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text color={detailSelectedIndex === 0 ? "cyan" : undefined}>
            {detailSelectedIndex === 0 ? "> " : "  "}Install
          </Text>
          <Text color={detailSelectedIndex === 1 ? "cyan" : undefined}>
            {detailSelectedIndex === 1 ? "> " : "  "}Back to list
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Enter to select · Esc to back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">
          Marketplace
        </Text>
        <Text color="gray">({filteredItems.length} available)</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text color="gray">{"○ "}</Text>
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleOpenDetails}
          focus={view === "list"}
        />
      </Box>

      {filteredItems.length === 0 && (
        <Box marginBottom={1}>
          <Text color="gray">
            {searchQuery
              ? "No items match your search."
              : "No items available."}
          </Text>
        </Box>
      )}

      {filteredItems.length > 0 && (
        <Box flexDirection="column">
          {filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={item.id}>
                <Text color={isSelected ? "cyan" : undefined}>
                  {isSelected ? "> " : "  "}
                  <Text bold={isSelected}>{item.id}</Text>
                  <Text color="gray">
                    {" · "}
                    {item.category}
                    {" · "}
                    {item.sources.length} source
                    {item.sources.length !== 1 ? "s" : ""}
                  </Text>
                </Text>
              </Box>
            );
          })}
          {filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            if (!isSelected) return null;
            return (
              <Box key={`${item.id}-desc`} marginTop={1}>
                <Text color="gray">{item.description}</Text>
              </Box>
            );
          })}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">
          type to search · ↑/↓ to navigate · Enter for details · Esc to back
        </Text>
      </Box>
    </Box>
  );
}
