import type { ConfigManager } from "../config-manager";
import type { LctxConfig, Source, SourceType } from "../shared";
import type { SourceManager } from "./source-manager";

/**
 * Orchestrates source operations by delegating to type-specific managers
 * and persisting changes via ConfigManager.
 */
export class SourcesManager {
  private readonly managersByType: Map<SourceType, SourceManager<Source>>;

  constructor(
    private readonly configManager: ConfigManager,
    managers: SourceManager<Source>[],
  ) {
    this.managersByType = new Map(managers.map((m) => [m.sourceType, m]));
  }

  private async getConfig(): Promise<LctxConfig> {
    return await this.configManager.load();
  }

  async add(source: Source): Promise<void> {
    const config = await this.getConfig();
    const manager = this.getManager(source.type);
    await manager.add(source);
    config.sources.push(source);
    await this.configManager.save(config);
  }

  async update(name: string): Promise<void> {
    const config = await this.getConfig();
    const source = this.findSource(config, name);
    if (!source) {
      throw new Error(`Source not found: ${name}`);
    }

    const manager = this.getManager(source.type);
    await manager.update(source);

    source.lastUpdated = new Date().toISOString();
    await this.configManager.save(config);
  }

  async delete(name: string): Promise<void> {
    const config = await this.getConfig();
    const source = this.findSource(config, name);
    if (!source) {
      throw new Error(`Source not found: ${name}`);
    }

    const manager = this.getManager(source.type);
    await manager.delete(source);

    config.sources = config.sources.filter((s) => s.name !== name);
    await this.configManager.save(config);
  }

  async updateAll(): Promise<void> {
    const config = await this.getConfig();
    for (const source of config.sources) {
      await this.update(source.name);
    }
  }

  async getSourcePath(name: string): Promise<string | undefined> {
    const config = await this.getConfig();
    const source = this.findSource(config, name);
    if (!source) {
      return undefined;
    }

    const manager = this.getManager(source.type);
    return manager.getSourcePath(source);
  }

  async listSources(): Promise<Source[]> {
    const config = await this.getConfig();
    return config.sources;
  }

  async getSource(name: string): Promise<Source | undefined> {
    const config = await this.getConfig();
    return this.findSource(config, name);
  }

  private findSource(config: LctxConfig, name: string): Source | undefined {
    return config.sources.find((s) => s.name === name);
  }

  private getManager(type: SourceType): SourceManager<Source> {
    const manager = this.managersByType.get(type);
    if (!manager) {
      throw new Error(`Unsupported source type: ${type}`);
    }
    return manager;
  }
}
