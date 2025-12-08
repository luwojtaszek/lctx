import { mkdir, rm, symlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ConfigManager } from "../config-manager";
import type { AskOptions, AskResult, ChatOptions, SourcePath } from "../shared";
import type { SourcesManager } from "../source-manager";

/**
 * Executes AI agents in isolated temp directories with access to configured sources.
 * Writes agent-specific MCP config to prevent circular loops.
 */
export class SubagentRunner {
  constructor(
    private readonly configManager: ConfigManager,
    private readonly sourcesManager: SourcesManager,
  ) {}

  /**
   * Execute agent in headless mode and capture output
   */
  async ask(options: AskOptions): Promise<AskResult> {
    const tempDir = await this.createTempDirectory();

    try {
      const config = await this.configManager.load();
      const agentConfig = config.agents[config.defaultAgent];
      if (!agentConfig) {
        throw new Error(`Agent not found: ${config.defaultAgent}`);
      }

      const sourcePaths = await this.resolveSourcePaths(options.sources);
      const mcpConfigFile = await this.writeMcpConfig(tempDir, agentConfig.mcp);
      await this.createSourceSymlinks(tempDir, sourcePaths);
      await this.writePromptFile(tempDir, options.question, options.sources);

      const command = this.interpolateCommand(
        agentConfig.commands.ask,
        tempDir,
        mcpConfigFile,
      );
      const baseArgs = this.parseCommand(command);
      const addDirArgs = this.buildAddDirArgs(
        agentConfig.addDirFlag,
        sourcePaths,
      );

      const args = [...baseArgs, ...addDirArgs];

      const proc = Bun.spawn(args, {
        cwd: tempDir,
        stdout: "pipe",
        stderr: "pipe",
      });

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      if (exitCode !== 0) {
        throw new Error(`Agent exited with code ${exitCode}: ${stderr}`);
      }

      return { answer: stdout, stderr: stderr || undefined };
    } finally {
      await this.cleanup(tempDir);
    }
  }

  /**
   * Execute agent in interactive mode with stdio inheritance
   */
  async chat(options: ChatOptions): Promise<void> {
    const tempDir = await this.createTempDirectory();

    try {
      const config = await this.configManager.load();
      const agentConfig = config.agents[config.defaultAgent];
      if (!agentConfig) {
        throw new Error(`Agent not found: ${config.defaultAgent}`);
      }

      const sourcePaths = await this.resolveSourcePaths(options.sources);
      await this.writeMcpConfig(tempDir, agentConfig.mcp);
      await this.createSourceSymlinks(tempDir, sourcePaths);

      const baseArgs = this.parseCommand(agentConfig.commands.chat);
      const addDirArgs = this.buildAddDirArgs(
        agentConfig.addDirFlag,
        sourcePaths,
      );
      const args = [...baseArgs, ...addDirArgs];

      const proc = Bun.spawn(args, {
        cwd: tempDir,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      });

      await proc.exited;
    } finally {
      await this.cleanup(tempDir);
    }
  }

  /**
   * Create isolated temp directory with UUID
   */
  private async createTempDirectory(): Promise<string> {
    const uuid = crypto.randomUUID();
    const tempDir = `/tmp/lctx-${uuid}`;
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Write MCP config file from agent configuration
   */
  private async writeMcpConfig(
    tempDir: string,
    mcp: { path: string; config: Record<string, unknown> } | undefined,
  ): Promise<string | null> {
    if (!mcp) return null;

    const fullPath = join(tempDir, mcp.path);
    const dir = dirname(fullPath);
    if (dir !== tempDir) {
      await mkdir(dir, { recursive: true });
    }
    await Bun.write(fullPath, JSON.stringify(mcp.config));
    return fullPath;
  }

  /**
   * Resolve source names to their filesystem paths
   */
  private async resolveSourcePaths(sources: string[]): Promise<SourcePath[]> {
    const result: SourcePath[] = [];
    for (const sourceName of sources) {
      const sourcePath = await this.sourcesManager.getSourcePath(sourceName);
      if (!sourcePath) {
        throw new Error(`Source not found: ${sourceName}`);
      }
      result.push(sourcePath);
    }
    return result;
  }

  /**
   * Build --add-dir arguments from flag template using resolved source paths
   */
  private buildAddDirArgs(
    addDirFlag: string | undefined,
    sourcePaths: SourcePath[],
  ): string[] {
    if (!addDirFlag) return [];
    return sourcePaths.flatMap((s) =>
      addDirFlag.replace("{path}", s.path).split(" "),
    );
  }

  /**
   * Create symlinks to requested sources in temp directory
   */
  private async createSourceSymlinks(
    tempDir: string,
    sourcePaths: SourcePath[],
  ): Promise<void> {
    for (const { name, path } of sourcePaths) {
      const linkPath = join(tempDir, name);
      await symlink(path, linkPath);
    }
  }

  /**
   * Write prompt.md file with question and source listing
   */
  private async writePromptFile(
    tempDir: string,
    question: string,
    sources: string[],
  ): Promise<void> {
    const sourcesList = sources.map((s) => `- ./${s}/`).join("\n");

    const content = `# Question

${question}

# Available Sources

The following source directories are available in your current working directory:
${sourcesList}

## Instructions

1. Use the Glob tool to discover files in these directories (e.g., pattern: "${sources[0]}/**/*.md")
2. Use the Grep tool to search for relevant content
3. Use the Read tool to read specific files

You MUST explore and read files from these directories to answer the question. The directories contain documentation and code that will help you provide an accurate answer.

Start by listing files in the source directories to understand their structure.
`;

    await Bun.write(join(tempDir, "prompt.md"), content);
  }

  /**
   * Interpolate placeholders in command template
   */
  private interpolateCommand(
    template: string,
    tempDir: string,
    mcpConfigFile: string | null,
  ): string {
    let result = template
      .replace("{prompt_file}", join(tempDir, "prompt.md"))
      .replace("{working_dir}", tempDir);

    if (mcpConfigFile) {
      result = result.replace("{mcp_config_file}", mcpConfigFile);
    }
    return result;
  }

  /**
   * Parse command string into arguments array
   */
  private parseCommand(command: string): string[] {
    return command.split(" ").filter((arg) => arg.length > 0);
  }

  /**
   * Clean up temp directory
   */
  private async cleanup(tempDir: string): Promise<void> {
    await rm(tempDir, { recursive: true, force: true });
  }
}
