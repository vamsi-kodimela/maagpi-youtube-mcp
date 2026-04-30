import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerVideoTools } from "./videos.js";
import { registerPublishingTools } from "./publishing.js";
import { registerAnalyticsTools } from "./analytics.js";
import { registerCommentTools } from "./comments.js";
import { registerPlaylistTools } from "./playlists.js";
import { registerChannelTools } from "./channels.js";
import { registerAccountTools } from "./account.js";

export function registerAllTools(server: McpServer): void {
  registerVideoTools(server);
  registerPublishingTools(server);
  registerAnalyticsTools(server);
  registerCommentTools(server);
  registerPlaylistTools(server);
  registerChannelTools(server);
  registerAccountTools(server);
}
