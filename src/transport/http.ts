import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

export async function startHttpTransport(server: McpServer): Promise<void> {
  const port = config.httpPort;
  const host = config.httpHost;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", transport: "http" }));
      return;
    }

    if (req.url === "/mcp") {
      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not found. Use POST /mcp for MCP requests.");
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, host, () => resolve());
    httpServer.once("error", reject);
  });

  logger.info(`YouTube MCP HTTP server listening on http://${host}:${port}`);
  logger.info(`  MCP endpoint: POST http://${host}:${port}/mcp`);
  logger.info(`  Health check: GET  http://${host}:${port}/health`);
}
