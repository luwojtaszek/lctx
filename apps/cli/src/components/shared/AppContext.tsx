import { createContext } from "react";

export const AppContext = createContext<{
  suppressExit: boolean;
  setSuppressExit: (v: boolean) => void;
  showBackHint: boolean;
  setShowBackHint: (v: boolean) => void;
  showExitHint: boolean;
  setShowExitHint: (v: boolean) => void;
}>({
  suppressExit: false,
  setSuppressExit: () => {},
  showBackHint: false,
  setShowBackHint: () => {},
  showExitHint: false,
  setShowExitHint: () => {},
});
