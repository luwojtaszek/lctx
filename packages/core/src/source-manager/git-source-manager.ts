import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { GitRepositorySource } from "../shared";
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
    const branch = source.branch ?? "main";

    await mkdir(join(this.sourcesDirectory, "git"), { recursive: true });

    await this.git([
      "clone",
      "--depth",
      "1",
      "--branch",
      branch,
      source.url,
      targetPath,
    ]);
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
}
