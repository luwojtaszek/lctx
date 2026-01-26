import type { MarketplaceCategory, MarketplaceItem, Source } from "../shared";
import type { SourcesManager } from "../source-manager";
import catalog from "./marketplace-catalog.json";

export interface MarketplaceManager {
  list(): MarketplaceItem[];
  search(query: string): MarketplaceItem[];
  get(id: string): MarketplaceItem | undefined;
  getByCategory(category: MarketplaceCategory): MarketplaceItem[];
  install(id: string): Promise<void>;
}

export class FileMarketplaceManager implements MarketplaceManager {
  private readonly items: MarketplaceItem[];

  constructor(private readonly sourcesManager: SourcesManager) {
    this.items = catalog.items as MarketplaceItem[];
  }

  list(): MarketplaceItem[] {
    return this.items;
  }

  search(query: string): MarketplaceItem[] {
    const lowerQuery = query.toLowerCase();
    return this.items.filter((item) => {
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  get(id: string): MarketplaceItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  getByCategory(category: MarketplaceCategory): MarketplaceItem[] {
    return this.items.filter((item) => item.category === category);
  }

  async install(id: string): Promise<void> {
    const item = this.get(id);
    if (!item) {
      throw new Error(`Item '${id}' not found`);
    }

    for (const itemSource of item.sources) {
      // Check if source already exists
      const existing = await this.sourcesManager.getSource(itemSource.name);
      if (existing) {
        continue; // Skip existing sources
      }

      // Convert item source to full source
      let source: Source;
      if (itemSource.type === "git") {
        source = {
          type: "git",
          name: itemSource.name,
          url: itemSource.url ?? "",
          branch: itemSource.branch,
          description: itemSource.description,
        };
      } else if (itemSource.type === "docs") {
        source = {
          type: "docs",
          name: itemSource.name,
          url: itemSource.url ?? "",
          description: itemSource.description,
        };
      } else if (itemSource.type === "file") {
        source = {
          type: "file",
          name: itemSource.name,
          path: itemSource.path ?? "",
          description: itemSource.description,
        };
      } else {
        source = {
          type: "directory",
          name: itemSource.name,
          path: itemSource.path ?? "",
          description: itemSource.description,
        };
      }

      await this.sourcesManager.add(source);
    }
  }
}
