import { mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import type { GitRepositorySource, SourceHealth } from "../shared";
import type { SourceManager } from "./source-manager";

/**
 * Manages git repository sources.
 * Stores cloned repos in `${sourcesDirectory}/git/${name}`
 */
export class GitSourceManager implements SourceManager<GitRepositorySource> {
  readonly sourceType = "git" as const;

  constructor(private readonly sourcesDirectory: string) {}

  async add(source: GitRepositorySource): Promise<void> {
    const targetPath = this.getSourcePath(source);

    await mkdir(join(this.sourcesDirectory, "git"), { recursive: true });

    const cloneArgs = ["clone", "--depth", "1"];
    if (source.branch) {
      cloneArgs.push("--branch", source.branch);
    }
    cloneArgs.push(source.url, targetPath);

    await this.git(cloneArgs);
  }

  async update(source: GitRepositorySource): Promise<void> {
    const targetPath = this.getSourcePath(source);
    await this.git(["pull"], targetPath);
  }

  async delete(source: GitRepositorySource): Promise<void> {
    const targetPath = this.getSourcePath(source);
    await rm(targetPath, { recursive: true, force: true });
  }

  getSourcePath(source: GitRepositorySource): string {
    return join(this.sourcesDirectory, "git", source.name);
  }

  async checkHealth(source: GitRepositorySource): Promise<SourceHealth> {
    const targetPath = this.getSourcePath(source);

    try {
      // Check if directory exists
      await stat(targetPath);
    } catch {
      return {
        name: source.name,
        type: "git",
        status: "error",
        errorMessage: "Repository not found locally",
      };
    }

    try {
      // Get current branch
      const currentBranch = await this.gitOutput(
        ["rev-parse", "--abbrev-ref", "HEAD"],
        targetPath,
      );

      // Fetch updates from remote
      await this.git(["fetch"], targetPath);

      // Count commits behind
      const behindOutput = await this.gitOutput(
        ["rev-list", "--count", "HEAD..@{u}"],
        targetPath,
      );
      const behindCommits = Number.parseInt(behindOutput.trim(), 10) || 0;

      // Calculate staleness based on lastUpdated
      let staleDays: number | undefined;
      if (source.lastUpdated) {
        const lastUpdatedDate = new Date(source.lastUpdated);
        const now = new Date();
        staleDays = Math.floor(
          (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Determine status
      let status: SourceHealth["status"] = "healthy";
      if (behindCommits > 0) {
        status = "stale";
      } else if (staleDays !== undefined && staleDays > 7) {
        status = "stale";
      }

      return {
        name: source.name,
        type: "git",
        status,
        lastSynced: source.lastUpdated,
        staleDays,
        details: {
          behindCommits,
          currentBranch: currentBranch.trim(),
        },
      };
    } catch (error) {
      return {
        name: source.name,
        type: "git",
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async git(args: string[], cwd?: string): Promise<void> {
    const proc = Bun.spawn(["git", ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`git ${args[0]} failed: ${stderr.trim()}`);
    }
  }

  private async gitOutput(args: string[], cwd?: string): Promise<string> {
    const proc = Bun.spawn(["git", ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`git ${args[0]} failed: ${stderr.trim()}`);
    }

    return await new Response(proc.stdout).text();
  }
}
