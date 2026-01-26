import type { ConfigManager } from "../config-manager";
import type { SourceGroup } from "../shared";

export interface GroupManager {
  create(
    name: string,
    sources: string[],
    description?: string,
  ): Promise<SourceGroup>;
  update(
    name: string,
    sources: string[],
    description?: string,
  ): Promise<SourceGroup>;
  delete(name: string): Promise<void>;
  get(name: string): Promise<SourceGroup | undefined>;
  list(): Promise<SourceGroup[]>;
  resolveSources(groupName: string): Promise<string[]>;
}

export class FileGroupManager implements GroupManager {
  constructor(private readonly configManager: ConfigManager) {}

  async create(
    name: string,
    sources: string[],
    description?: string,
  ): Promise<SourceGroup> {
    const config = await this.configManager.load();

    if (config.groups[name]) {
      throw new Error(`Group '${name}' already exists`);
    }

    const group: SourceGroup = { name, sources, description };
    config.groups[name] = group;

    await this.configManager.save(config);
    return group;
  }

  async update(
    name: string,
    sources: string[],
    description?: string,
  ): Promise<SourceGroup> {
    const config = await this.configManager.load();

    if (!config.groups[name]) {
      throw new Error(`Group '${name}' not found`);
    }

    const group: SourceGroup = { name, sources, description };
    config.groups[name] = group;

    await this.configManager.save(config);
    return group;
  }

  async delete(name: string): Promise<void> {
    const config = await this.configManager.load();

    if (!config.groups[name]) {
      throw new Error(`Group '${name}' not found`);
    }

    delete config.groups[name];
    await this.configManager.save(config);
  }

  async get(name: string): Promise<SourceGroup | undefined> {
    const config = await this.configManager.load();
    return config.groups[name];
  }

  async list(): Promise<SourceGroup[]> {
    const config = await this.configManager.load();
    return Object.values(config.groups);
  }

  async resolveSources(groupName: string): Promise<string[]> {
    const group = await this.get(groupName);
    if (!group) {
      throw new Error(`Group '${groupName}' not found`);
    }
    return group.sources;
  }
}
