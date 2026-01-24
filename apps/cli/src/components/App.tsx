import { useApp, useInput } from "ink";
import { useEffect, useState } from "react";
import { version } from "..";
import { type VersionInfo, checkForUpdates } from "../shared";
import { AskScreen } from "./AskScreen.js";
import { HelpScreen } from "./HelpScreen.js";
import { MainMenu, type Screen } from "./MainMenu.js";
import { SourcesScreen } from "./SourcesScreen.js";
import { HintBar, UpdateBanner } from "./shared";
import { AppContext } from "./shared/AppContext.js";

export function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [suppressExit, setSuppressExit] = useState(false);
  const [showBackHint, setShowBackHint] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === "c" && key.ctrl && !suppressExit) {
      exit();
    }
  });

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates()
      .then((info) => {
        if (info.hasUpdate) {
          setUpdateInfo(info);
        }
      })
      .catch(() => {
        // Silently ignore update check failures
      });
  }, []);

  // Auto-hide exit hint after 1.5s
  useEffect(() => {
    if (!showExitHint) return;
    const timer = setTimeout(() => {
      setShowExitHint(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [showExitHint]);

  const handleBack = () => {
    setScreen("menu");
  };

  return (
    <AppContext.Provider
      value={{
        suppressExit,
        setSuppressExit,
        showBackHint,
        setShowBackHint,
        showExitHint,
        setShowExitHint,
      }}
    >
      {updateInfo && (
        <UpdateBanner
          versionInfo={updateInfo}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
      {screen === "menu" && (
        <MainMenu version={version} onNavigate={setScreen} />
      )}
      {screen === "sources" && <SourcesScreen onBack={handleBack} />}
      {screen === "ask" && <AskScreen onBack={handleBack} />}
      {screen === "help" && <HelpScreen onBack={handleBack} />}
      <HintBar />
    </AppContext.Provider>
  );
}
