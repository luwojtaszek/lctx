import type { PathResolver } from "../../../src";

export class FakePathResolver implements PathResolver {
  constructor(private readonly fakeHome: string) {}

  homedir(): string {
    return this.fakeHome;
  }

  expandPath(path: string): string {
    if (path.startsWith("~/")) {
      return path.replace("~", this.fakeHome);
    }
    if (path === "~") {
      return this.fakeHome;
    }
    return path;
  }
}
