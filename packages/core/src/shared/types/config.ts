import type { Source } from "./source.ts";

/**
 * Agent configuration with command templates
 */
export interface AgentConfig {
  commands: {
    /** Command template for interactive mode */
    chat: string;
    /** Command template for headless mode with {prompt_file} placeholder */
    ask: string;
  };
  /** Flag template for adding directories (e.g., "--add-dir {path}") */
  addDirFlag?: string;
  /** MCP configuration for this agent */
  mcp?: {
    /** Path relative to working directory (e.g., ".mcp.json", ".cursor/mcp.json") */
    path: string;
    /** MCP config content to write */
    config: Record<string, unknown>;
  };
}

/**
 * Main application configuration
 */
export interface LctxConfig {
  /** Path to store cloned sources */
  sourcesDirectory: string;
  /** Array of configured sources */
  sources: Source[];
  /** Agent configurations keyed by name */
  agents: Record<string, AgentConfig>;
  /** Name of the default agent to use */
  defaultAgent: string;
}
