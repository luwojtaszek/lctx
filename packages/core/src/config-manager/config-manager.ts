import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { LctxConfigSchema } from "../shared";
import type { LctxConfig } from "../shared";
import type { PathResolver } from "../shared";
import defaultConfig from "./default-config.json";

const DEFAULT_CONFIG_PATH = "~/.config/lctx/config.json";

export interface ConfigManager {
  readonly configPath: string;
  expandPath(path: string): string;
  load(configPath?: string): Promise<LctxConfig>;
  save(config: LctxConfig, configPath?: string): Promise<void>;
}

export class FileConfigManager implements ConfigManager {
  constructor(
    private readonly pathResolver: PathResolver,
    private readonly defaultConfigPath: string = DEFAULT_CONFIG_PATH,
  ) {}

  get configPath(): string {
    return this.defaultConfigPath;
  }

  expandPath(path: string): string {
    return this.pathResolver.expandPath(path);
  }

  async load(configPath: string = this.defaultConfigPath): Promise<LctxConfig> {
    const expandedPath = this.pathResolver.expandPath(configPath);
    const file = Bun.file(expandedPath);

    if (!(await file.exists())) {
      const config = defaultConfig as LctxConfig;
      await this.save(config, configPath);
      return this.expandConfigPaths(config);
    }

    const content = await file.text();
    const parsed = JSON.parse(content);
    const validated = LctxConfigSchema.parse(parsed);
    return this.expandConfigPaths(validated);
  }

  async save(
    config: LctxConfig,
    configPath: string = this.defaultConfigPath,
  ): Promise<void> {
    const expandedPath = this.pathResolver.expandPath(configPath);
    const dir = dirname(expandedPath);

    await mkdir(dir, { recursive: true });
    await Bun.write(expandedPath, JSON.stringify(config, null, 2));
  }

  private expandConfigPaths(config: LctxConfig): LctxConfig {
    return {
      ...config,
      sourcesDirectory: this.pathResolver.expandPath(config.sourcesDirectory),
      sources: config.sources.map((source) => {
        if (source.type === "file" || source.type === "directory") {
          return {
            ...source,
            path: this.pathResolver.expandPath(source.path),
          };
        }
        return source;
      }),
    };
  }
}
