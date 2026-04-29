import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/registry.js";

const PKG_NAME = "youtube-mcp";
const PKG_VERSION = "0.1.0";

export function createServer(): McpServer {
  const server = new McpServer({
    name: PKG_NAME,
    version: PKG_VERSION,
  });

  registerAllTools(server);

  return server;
}
