import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuthRetry } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import { setPrivacy, schedulePublish, setPremiere } from "../youtube/publishing.js";
import { trackQuota, getQuotaSummary } from "../quota/tracker.js";
import { invalidateRelated } from "../quota/cache.js";
import { QUOTA_COSTS } from "../quota/constants.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import { SetPrivacySchema, SchedulePublishSchema, SetPremiereSchema } from "../schemas/publishing.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerPublishingTools(server: McpServer): void {
  server.registerTool(
    "youtube_video_set_privacy",
    { description: "Change the privacy status of a video to public, private, or unlisted.", inputSchema: SetPrivacySchema },
    async (params) => {
      try {
        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return setPrivacy(yt, params.videoId, params.privacyStatus);
        }, params.channel);
        trackQuota("videos.update", QUOTA_COSTS["videos.update"]);
        invalidateRelated("videos.update");
        return toolResult({ success: true, data: video, quota: getQuotaSummary(QUOTA_COSTS["videos.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_schedule_publish",
    { description: "Schedule a video to automatically publish at a specific future datetime (ISO8601).", inputSchema: SchedulePublishSchema },
    async (params) => {
      try {
        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return schedulePublish(yt, params.videoId, params.publishAt, params.privacyStatus);
        }, params.channel);
        trackQuota("videos.update", QUOTA_COSTS["videos.update"]);
        invalidateRelated("videos.update");
        return toolResult({ success: true, data: video, quota: getQuotaSummary(QUOTA_COSTS["videos.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_set_premiere",
    { description: "Configure a video as a YouTube Premiere with a scheduled live premiere date.", inputSchema: SetPremiereSchema },
    async (params) => {
      try {
        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return setPremiere(yt, params.videoId, params.premiereAt);
        }, params.channel);
        trackQuota("videos.update", QUOTA_COSTS["videos.update"]);
        invalidateRelated("videos.update");
        return toolResult({ success: true, data: video, quota: getQuotaSummary(QUOTA_COSTS["videos.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
