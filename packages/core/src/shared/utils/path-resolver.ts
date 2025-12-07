import { homedir as osHomedir } from "node:os";

export interface PathResolver {
  homedir(): string;
  expandPath(path: string): string;
}

export class DefaultPathResolver implements PathResolver {
  private readonly home: string;

  constructor(homeDirectory?: string) {
    this.home = homeDirectory ?? osHomedir();
  }

  homedir(): string {
    return this.home;
  }

  expandPath(path: string): string {
    if (path.startsWith("~/")) {
      return path.replace("~", this.home);
    }
    if (path === "~") {
      return this.home;
    }
    return path;
  }
}
