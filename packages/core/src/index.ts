import pkg from "../package.json";

export const version: string = pkg.version;

export * from "./shared/index.ts";
export * from "./config-manager/index.ts";
export * from "./source-manager/index.ts";
export * from "./subagent-runner/index.ts";
export * from "./module.ts";
