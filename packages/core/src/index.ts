import pkg from "../package.json";

export const version: string = pkg.version;

export * from "./shared";
export * from "./config-manager";
export * from "./source-manager";
export * from "./subagent-runner";
export * from "./module.ts";
