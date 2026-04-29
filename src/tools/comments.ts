import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuthRetry } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import {
  listCommentThreads, getCommentThread, replyToComment,
  deleteComment, moderateComment,
} from "../youtube/comments.js";
import { getCached, setCached, invalidateRelated } from "../quota/cache.js";
import { trackQuota, getQuotaSummary } from "../quota/tracker.js";
import { QUOTA_COSTS } from "../quota/constants.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import {
  ListCommentsSchema, ReplyCommentSchema, DeleteCommentSchema,
  ModerateCommentSchema, GetCommentThreadSchema,
} from "../schemas/comments.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerCommentTools(server: McpServer): void {
  server.registerTool(
    "youtube_comment_list",
    { description: "List top-level comment threads on a video, with optional search and ordering.", inputSchema: ListCommentsSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("commentThreads.list", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return listCommentThreads(yt, params.videoId, params);
        });
        trackQuota("commentThreads.list", QUOTA_COSTS["commentThreads.list"]);
        setCached("commentThreads.list", cacheKey, result);
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["commentThreads.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_comment_thread_get",
    { description: "Get a single comment thread with its replies.", inputSchema: GetCommentThreadSchema },
    async (params) => {
      try {
        const thread = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return getCommentThread(yt, params.commentThreadId, params.maxReplies);
        });
        if (!thread) {
          throw new YouTubeMcpError(YouTubeMcpErrorCode.COMMENT_NOT_FOUND, `Comment thread '${params.commentThreadId}' not found.`);
        }
        trackQuota("commentThreads.list", QUOTA_COSTS["commentThreads.list"]);
        return toolResult({ success: true, data: thread, quota: getQuotaSummary(QUOTA_COSTS["commentThreads.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_comment_reply",
    { description: "Post a reply to an existing top-level comment on a video.", inputSchema: ReplyCommentSchema },
    async (params) => {
      try {
        const comment = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return replyToComment(yt, params.parentCommentId, params.text);
        });
        trackQuota("comments.insert", QUOTA_COSTS["comments.insert"]);
        invalidateRelated("comments.insert");
        return toolResult({ success: true, data: comment, quota: getQuotaSummary(QUOTA_COSTS["comments.insert"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_comment_delete",
    { description: "Delete a comment by ID. Only works on comments owned by the authenticated account.", inputSchema: DeleteCommentSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await deleteComment(yt, params.commentId);
        });
        trackQuota("comments.delete", QUOTA_COSTS["comments.delete"]);
        invalidateRelated("comments.delete");
        return toolResult({ success: true, data: { deleted: params.commentId }, quota: getQuotaSummary(QUOTA_COSTS["comments.delete"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_comment_moderate",
    { description: "Change moderation status of a comment: publish, hold for review, or reject. Optionally ban the author.", inputSchema: ModerateCommentSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await moderateComment(yt, params.commentId, params.moderationStatus, params.banAuthor);
        });
        trackQuota("comments.setModerationStatus", QUOTA_COSTS["comments.setModerationStatus"]);
        invalidateRelated("comments.setModerationStatus");
        return toolResult({ success: true, data: { commentId: params.commentId, moderationStatus: params.moderationStatus }, quota: getQuotaSummary(QUOTA_COSTS["comments.setModerationStatus"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
