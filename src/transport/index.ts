import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config.js";
import { startStdioTransport } from "./stdio.js";
import { startHttpTransport } from "./http.js";

export async function startTransport(server: McpServer): Promise<void> {
  if (config.transport === "http") {
    return startHttpTransport(server);
  }
  return startStdioTransport(server);
}
