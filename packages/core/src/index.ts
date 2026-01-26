import pkg from "../package.json";

export const version: string = pkg.version;

export * from "./shared";
export * from "./config-manager";
export * from "./source-manager";
export * from "./group-manager";
export * from "./marketplace";
export * from "./subagent-runner";
export * from "./module.ts";
