import { mkdir, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import type { ConfigManager } from "../config-manager";
import type { AskOptions, AskResult, ChatOptions } from "../shared/types";
import type { SourcesManager } from "../source-manager";

/**
 * Executes AI agents in isolated temp directories with access to configured sources.
 * Prevents circular MCP loops by writing empty MCP configs.
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
      await this.writeEmptyMcpConfigs(tempDir);
      await this.createSourceSymlinks(tempDir, options.sources);
      await this.writePromptFile(tempDir, options.question, options.sources);

      const config = await this.configManager.load();
      const agentConfig = config.agents[config.defaultAgent];
      if (!agentConfig) {
        throw new Error(`Agent not found: ${config.defaultAgent}`);
      }

      const command = this.interpolateCommand(
        agentConfig.commands.ask,
        tempDir,
      );
      const args = this.parseCommand(command);

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
      await this.writeEmptyMcpConfigs(tempDir);
      await this.createSourceSymlinks(tempDir, options.sources);

      const config = await this.configManager.load();
      const agentConfig = config.agents[config.defaultAgent];
      if (!agentConfig) {
        throw new Error(`Agent not found: ${config.defaultAgent}`);
      }

      const command = agentConfig.commands.chat;
      const args = this.parseCommand(command);

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
   * Write empty MCP configs to prevent circular loops
   */
  private async writeEmptyMcpConfigs(tempDir: string): Promise<void> {
    const emptyConfig = "{}";

    // Claude Code
    await Bun.write(join(tempDir, ".mcp.json"), emptyConfig);

    // Gemini CLI
    const geminiDir = join(tempDir, ".gemini");
    await mkdir(geminiDir, { recursive: true });
    await Bun.write(join(geminiDir, "settings.json"), emptyConfig);

    // Cursor
    const cursorDir = join(tempDir, ".cursor");
    await mkdir(cursorDir, { recursive: true });
    await Bun.write(join(cursorDir, "mcp.json"), emptyConfig);

    // OpenCode
    await Bun.write(join(tempDir, "opencode.json"), emptyConfig);
  }

  /**
   * Create symlinks to requested sources in temp directory
   */
  private async createSourceSymlinks(
    tempDir: string,
    sources: string[],
  ): Promise<void> {
    for (const sourceName of sources) {
      const sourcePath = await this.sourcesManager.getSourcePath(sourceName);
      if (!sourcePath) {
        throw new Error(`Source not found: ${sourceName}`);
      }

      const linkPath = join(tempDir, sourceName);
      await symlink(sourcePath, linkPath);
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
    const sourcesList = sources.map((s) => `- ${s}/`).join("\n");

    const content = `# Question

${question}

# Available Sources

The following source directories are available in the current directory:
${sourcesList}

Read the files directly to answer the question.
`;

    await Bun.write(join(tempDir, "prompt.md"), content);
  }

  /**
   * Interpolate placeholders in command template
   */
  private interpolateCommand(template: string, tempDir: string): string {
    return template
      .replace("{prompt_file}", join(tempDir, "prompt.md"))
      .replace("{mcp_config}", join(tempDir, ".mcp.json"));
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
