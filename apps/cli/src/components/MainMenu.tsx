import { Box } from "ink";
import { Logo, SelectInput, type SelectItem } from "./shared";

export type Screen =
  | "menu"
  | "sources"
  | "groups"
  | "health"
  | "marketplace"
  | "ask"
  | "help";

interface MainMenuProps {
  version: string;
  onNavigate: (screen: Screen) => void;
}

const menuItems: SelectItem<Screen>[] = [
  { label: "Sources", value: "sources", shortcut: "s" },
  { label: "Groups", value: "groups", shortcut: "g" },
  { label: "Health", value: "health", shortcut: "h" },
  { label: "Marketplace", value: "marketplace", shortcut: "m" },
  { label: "Ask", value: "ask", shortcut: "a" },
  { label: "Help", value: "help", shortcut: "?" },
];

export function MainMenu({ version, onNavigate }: MainMenuProps) {
  const handleSelect = (item: SelectItem<Screen>) => {
    onNavigate(item.value);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Logo version={version} cwd={process.cwd()} />
      <SelectInput items={menuItems} onSelect={handleSelect} />
    </Box>
  );
}
