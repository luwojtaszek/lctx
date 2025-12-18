import { Box } from "ink";
import { Logo, SelectInput, type SelectItem } from "./shared";

export type Screen = "menu" | "sources" | "ask" | "help";

interface MainMenuProps {
  version: string;
  onNavigate: (screen: Screen) => void;
}

const menuItems: SelectItem<Screen>[] = [
  { label: "Sources", value: "sources", shortcut: "s" },
  { label: "Ask", value: "ask", shortcut: "a" },
  { label: "Help", value: "help", shortcut: "h" },
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
