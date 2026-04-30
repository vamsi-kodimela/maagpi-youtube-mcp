import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuthRetry } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import {
  getChannel, updateChannel, updateBranding, setWatermark, unsetWatermark,
  listChannelSections, createChannelSection, deleteChannelSection,
} from "../youtube/channels.js";
import { getCached, setCached, invalidateRelated } from "../quota/cache.js";
import { trackQuota, getQuotaSummary } from "../quota/tracker.js";
import { QUOTA_COSTS } from "../quota/constants.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import {
  GetChannelSchema, UpdateChannelSchema, UpdateBrandingSchema,
  SetWatermarkSchema, UnsetWatermarkSchema,
  ListChannelSectionsSchema, CreateChannelSectionSchema, DeleteChannelSectionSchema,
} from "../schemas/channels.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerChannelTools(server: McpServer): void {
  server.registerTool(
    "youtube_channel_get",
    { description: "Get the authenticated channel's metadata, branding settings, and statistics.", inputSchema: GetChannelSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("channels.list", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const channel = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return getChannel(yt, params.parts as string[] | undefined);
        }, params.channel);
        if (!channel) {
          throw new YouTubeMcpError(YouTubeMcpErrorCode.CHANNEL_NOT_FOUND, "No channel found for the authenticated account.");
        }
        trackQuota("channels.list", QUOTA_COSTS["channels.list"]);
        setCached("channels.list", cacheKey, channel);
        return toolResult({ success: true, data: channel, quota: getQuotaSummary(QUOTA_COSTS["channels.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_update",
    { description: "Update the channel's title, description, keywords, country, or default language.", inputSchema: UpdateChannelSchema },
    async (params) => {
      try {
        const channel = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return updateChannel(yt, params);
        }, params.channel);
        trackQuota("channels.update", QUOTA_COSTS["channels.update"]);
        invalidateRelated("channels.update");
        return toolResult({ success: true, data: channel, quota: getQuotaSummary(QUOTA_COSTS["channels.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_branding_update",
    { description: "Update channel branding settings including banner, background color, and related channels.", inputSchema: UpdateBrandingSchema },
    async (params) => {
      try {
        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          const channel = await getChannel(yt, ["id"]);
          if (!channel?.id) {
            throw new YouTubeMcpError(YouTubeMcpErrorCode.CHANNEL_NOT_FOUND, "No channel found.");
          }
          return updateBranding(yt, channel.id, params);
        }, params.channel);
        trackQuota("channels.update", QUOTA_COSTS["channels.update"]);
        invalidateRelated("channels.update");
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["channels.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_watermark_set",
    { description: "Set a branding watermark image on all channel videos with position and timing configuration.", inputSchema: SetWatermarkSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await setWatermark(yt, params.channelId, params.imagePath, params.position, params.timing);
        }, params.channel);
        trackQuota("watermarks.set", QUOTA_COSTS["watermarks.set"]);
        return toolResult({ success: true, data: { channelId: params.channelId, watermarkSet: true }, quota: getQuotaSummary(QUOTA_COSTS["watermarks.set"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_watermark_unset",
    { description: "Remove the branding watermark from all channel videos.", inputSchema: UnsetWatermarkSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await unsetWatermark(yt, params.channelId);
        }, params.channel);
        trackQuota("watermarks.unset", QUOTA_COSTS["watermarks.unset"]);
        return toolResult({ success: true, data: { channelId: params.channelId, watermarkRemoved: true }, quota: getQuotaSummary(QUOTA_COSTS["watermarks.unset"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_section_list",
    { description: "List all sections on the channel homepage.", inputSchema: ListChannelSectionsSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("channelSections.list", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const sections = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return listChannelSections(yt, params.channelId);
        }, params.channel);
        trackQuota("channelSections.list", QUOTA_COSTS["channelSections.list"]);
        setCached("channelSections.list", cacheKey, sections);
        return toolResult({ success: true, data: sections, quota: getQuotaSummary(QUOTA_COSTS["channelSections.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_section_create",
    { description: "Create a new channel homepage section featuring playlists or channels.", inputSchema: CreateChannelSectionSchema },
    async (params) => {
      try {
        const section = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return createChannelSection(yt, params);
        }, params.channel);
        trackQuota("channelSections.insert", QUOTA_COSTS["channelSections.insert"]);
        invalidateRelated("channelSections.insert");
        return toolResult({ success: true, data: section, quota: getQuotaSummary(QUOTA_COSTS["channelSections.insert"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_channel_section_delete",
    { description: "Delete a channel homepage section by ID.", inputSchema: DeleteChannelSectionSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await deleteChannelSection(yt, params.sectionId);
        }, params.channel);
        trackQuota("channelSections.delete", QUOTA_COSTS["channelSections.delete"]);
        invalidateRelated("channelSections.delete");
        return toolResult({ success: true, data: { deleted: params.sectionId }, quota: getQuotaSummary(QUOTA_COSTS["channelSections.delete"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
