import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuthRetry } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import {
  uploadVideo, getVideo, listVideos, updateVideo,
  deleteVideo, rateVideo, setThumbnail,
} from "../youtube/videos.js";
import {
  getCached, setCached, invalidateRelated,
} from "../quota/cache.js";
import { trackQuota, getQuotaSummary } from "../quota/tracker.js";
import { QUOTA_COSTS } from "../quota/constants.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import {
  UploadVideoSchema, GetVideoSchema, ListVideosSchema,
  UpdateVideoSchema, DeleteVideoSchema, RateVideoSchema, SetThumbnailSchema,
} from "../schemas/videos.js";

function toolResult(data: unknown): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerVideoTools(server: McpServer): void {
  server.registerTool(
    "youtube_video_upload",
    { description: "Upload a video file to YouTube with metadata and privacy settings.", inputSchema: UploadVideoSchema },
    async (params) => {
      try {
        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return uploadVideo(yt, params);
        }, params.channel);
        trackQuota("videos.insert", QUOTA_COSTS["videos.insert"]);
        invalidateRelated("videos.insert");
        return toolResult({ success: true, data: video, quota: getQuotaSummary(QUOTA_COSTS["videos.insert"] ?? 1600) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_get",
    { description: "Get full metadata for a YouTube video by ID.", inputSchema: GetVideoSchema },
    async (params) => {
      try {
        const cacheKey = { videoId: params.videoId, parts: params.parts };
        const cached = getCached("videos.get", cacheKey);
        if (cached) {
          return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });
        }

        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return getVideo(yt, params.videoId, params.parts as string[] | undefined);
        }, params.channel);

        if (!video) {
          throw new YouTubeMcpError(YouTubeMcpErrorCode.VIDEO_NOT_FOUND, `Video '${params.videoId}' not found.`, {
            suggestedFix: "Verify the video ID and ensure the video belongs to the authenticated account.",
          });
        }

        trackQuota("videos.list", QUOTA_COSTS["videos.list"]);
        setCached("videos.get", cacheKey, video);
        return toolResult({ success: true, data: video, quota: getQuotaSummary(QUOTA_COSTS["videos.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_list",
    { description: "List videos on a channel or search across YouTube with filters.", inputSchema: ListVideosSchema },
    async (params) => {
      try {
        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return listVideos(yt, params);
        }, params.channel);
        trackQuota("videos.list", QUOTA_COSTS["videos.list"]);
        setCached("videos.list", params as Record<string, unknown>, result);
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["videos.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_update",
    { description: "Update the metadata of an existing video (title, description, tags, category).", inputSchema: UpdateVideoSchema },
    async (params) => {
      try {
        const video = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return updateVideo(yt, params);
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
    "youtube_video_delete",
    { description: "Permanently delete a video. Requires confirm: true to prevent accidents.", inputSchema: DeleteVideoSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await deleteVideo(yt, params.videoId);
        }, params.channel);
        trackQuota("videos.delete", QUOTA_COSTS["videos.delete"]);
        invalidateRelated("videos.delete");
        return toolResult({ success: true, data: { deleted: params.videoId }, quota: getQuotaSummary(QUOTA_COSTS["videos.delete"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_rate",
    { description: "Like, dislike, or remove a rating from a video.", inputSchema: RateVideoSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await rateVideo(yt, params.videoId, params.rating);
        }, params.channel);
        trackQuota("videos.rate", QUOTA_COSTS["videos.rate"]);
        return toolResult({ success: true, data: { videoId: params.videoId, rating: params.rating }, quota: getQuotaSummary(QUOTA_COSTS["videos.rate"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_video_set_thumbnail",
    { description: "Upload and set a custom thumbnail for a video.", inputSchema: SetThumbnailSchema },
    async (params) => {
      try {
        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return setThumbnail(yt, params.videoId, params.thumbnailPath);
        }, params.channel);
        trackQuota("thumbnails.set", QUOTA_COSTS["thumbnails.set"]);
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["thumbnails.set"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
