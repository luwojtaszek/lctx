import pkg from "../package.json";

export const version: string = pkg.version;
export { startServer } from "./server.ts";
