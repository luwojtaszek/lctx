import { type ConfigManager, FileConfigManager } from "./config-manager";
import { DefaultPathResolver } from "./shared";
import {
  DirectorySourceManager,
  DocsSourceManager,
  FileSourceManager,
  GitSourceManager,
  SourcesManager,
} from "./source-manager";
import { SubagentRunner } from "./subagent-runner";

export interface CoreModule {
  configManager: ConfigManager;
  sourcesManager: SourcesManager;
  subagentRunner: SubagentRunner;
}

export async function createCoreModule(): Promise<CoreModule> {
  const pathResolver = new DefaultPathResolver();
  const configManager = new FileConfigManager(pathResolver);
  const config = await configManager.load();

  const sourcesManager = new SourcesManager(configManager, [
    new GitSourceManager(config.sourcesDirectory),
    new FileSourceManager(config.sourcesDirectory),
    new DirectorySourceManager(config.sourcesDirectory),
    new DocsSourceManager(config.sourcesDirectory),
  ]);

  const subagentRunner = new SubagentRunner(configManager, sourcesManager);

  return { configManager, sourcesManager, subagentRunner };
}
