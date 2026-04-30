import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuthRetry } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import {
  createPlaylist, updatePlaylist, deletePlaylist, getPlaylist, listPlaylists,
  addVideoToPlaylist, removeVideoFromPlaylist, reorderPlaylistItem, listPlaylistItems,
} from "../youtube/playlists.js";
import { getCached, setCached, invalidateRelated } from "../quota/cache.js";
import { trackQuota, getQuotaSummary } from "../quota/tracker.js";
import { QUOTA_COSTS } from "../quota/constants.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import {
  CreatePlaylistSchema, UpdatePlaylistSchema, DeletePlaylistSchema, GetPlaylistSchema,
  ListPlaylistsSchema, AddVideoToPlaylistSchema, RemoveVideoFromPlaylistSchema,
  ReorderPlaylistItemSchema, ListPlaylistItemsSchema,
} from "../schemas/playlists.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerPlaylistTools(server: McpServer): void {
  server.registerTool(
    "youtube_playlist_create",
    { description: "Create a new YouTube playlist with title, description, and privacy settings.", inputSchema: CreatePlaylistSchema },
    async (params) => {
      try {
        const playlist = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return createPlaylist(yt, params);
        }, params.channel);
        trackQuota("playlists.insert", QUOTA_COSTS["playlists.insert"]);
        invalidateRelated("playlists.insert");
        return toolResult({ success: true, data: playlist, quota: getQuotaSummary(QUOTA_COSTS["playlists.insert"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_update",
    { description: "Update a playlist's title, description, or privacy status.", inputSchema: UpdatePlaylistSchema },
    async (params) => {
      try {
        const playlist = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return updatePlaylist(yt, params.playlistId, params);
        }, params.channel);
        trackQuota("playlists.update", QUOTA_COSTS["playlists.update"]);
        invalidateRelated("playlists.update");
        return toolResult({ success: true, data: playlist, quota: getQuotaSummary(QUOTA_COSTS["playlists.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_delete",
    { description: "Permanently delete a playlist. Requires confirm: true.", inputSchema: DeletePlaylistSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await deletePlaylist(yt, params.playlistId);
        }, params.channel);
        trackQuota("playlists.delete", QUOTA_COSTS["playlists.delete"]);
        invalidateRelated("playlists.delete");
        return toolResult({ success: true, data: { deleted: params.playlistId }, quota: getQuotaSummary(QUOTA_COSTS["playlists.delete"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_get",
    { description: "Get a playlist's full metadata by ID.", inputSchema: GetPlaylistSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("playlists.get", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const playlist = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return getPlaylist(yt, params.playlistId, params.parts as string[] | undefined);
        }, params.channel);
        if (!playlist) {
          throw new YouTubeMcpError(YouTubeMcpErrorCode.PLAYLIST_NOT_FOUND, `Playlist '${params.playlistId}' not found.`);
        }
        trackQuota("playlists.list", QUOTA_COSTS["playlists.list"]);
        setCached("playlists.get", cacheKey, playlist);
        return toolResult({ success: true, data: playlist, quota: getQuotaSummary(QUOTA_COSTS["playlists.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_list",
    { description: "List playlists for a channel (or the authenticated user's channel).", inputSchema: ListPlaylistsSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("playlists.list", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return listPlaylists(yt, params);
        }, params.channel);
        trackQuota("playlists.list", QUOTA_COSTS["playlists.list"]);
        setCached("playlists.list", cacheKey, result);
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["playlists.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_item_add",
    { description: "Add a video to a playlist at an optional position.", inputSchema: AddVideoToPlaylistSchema },
    async (params) => {
      try {
        const item = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return addVideoToPlaylist(yt, params.playlistId, params.videoId, params.position);
        }, params.channel);
        trackQuota("playlistItems.insert", QUOTA_COSTS["playlistItems.insert"]);
        invalidateRelated("playlistItems.insert");
        return toolResult({ success: true, data: item, quota: getQuotaSummary(QUOTA_COSTS["playlistItems.insert"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_item_remove",
    { description: "Remove a video from a playlist using the playlistItem ID (not the video ID).", inputSchema: RemoveVideoFromPlaylistSchema },
    async (params) => {
      try {
        await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          await removeVideoFromPlaylist(yt, params.playlistItemId);
        }, params.channel);
        trackQuota("playlistItems.delete", QUOTA_COSTS["playlistItems.delete"]);
        invalidateRelated("playlistItems.delete");
        return toolResult({ success: true, data: { deleted: params.playlistItemId }, quota: getQuotaSummary(QUOTA_COSTS["playlistItems.delete"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_item_reorder",
    { description: "Move a playlist item to a new position within the playlist.", inputSchema: ReorderPlaylistItemSchema },
    async (params) => {
      try {
        const item = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return reorderPlaylistItem(yt, params.playlistItemId, params.playlistId, params.newPosition);
        }, params.channel);
        trackQuota("playlistItems.update", QUOTA_COSTS["playlistItems.update"]);
        invalidateRelated("playlistItems.update");
        return toolResult({ success: true, data: item, quota: getQuotaSummary(QUOTA_COSTS["playlistItems.update"] ?? 50) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_playlist_items_list",
    { description: "List all videos in a playlist with their positions and metadata.", inputSchema: ListPlaylistItemsSchema },
    async (params) => {
      try {
        const cacheKey = params as Record<string, unknown>;
        const cached = getCached("playlistItems.list", cacheKey);
        if (cached) return toolResult({ success: true, data: cached, quota: getQuotaSummary(0), cached: true });

        const result = await withAuthRetry(async (auth) => {
          const yt = buildYouTubeClient(auth);
          return listPlaylistItems(yt, params.playlistId, params);
        }, params.channel);
        trackQuota("playlistItems.list", QUOTA_COSTS["playlistItems.list"]);
        setCached("playlistItems.list", cacheKey, result);
        return toolResult({ success: true, data: result, quota: getQuotaSummary(QUOTA_COSTS["playlistItems.list"] ?? 1) });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
