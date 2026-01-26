import type { SourceType } from "./source.ts";

/**
 * Category of marketplace item
 */
export type MarketplaceCategory = "ai" | "framework" | "runtime" | "tool";

/**
 * Source definition within a marketplace item
 */
export interface MarketplaceItemSource {
  type: SourceType;
  name: string;
  url?: string;
  path?: string;
  branch?: string;
  description: string;
}

/**
 * Marketplace item for quickly adding common sources
 */
export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: MarketplaceCategory;
  sources: MarketplaceItemSource[];
  tags: string[];
}
