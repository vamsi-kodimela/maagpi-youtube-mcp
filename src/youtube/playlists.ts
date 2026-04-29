import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeClient } from "./client.js";
import type { youtube_v3 } from "@googleapis/youtube";

export async function createPlaylist(
  yt: YouTubeClient,
  params: {
    title: string;
    description?: string;
    privacyStatus: "public" | "private" | "unlisted";
    defaultLanguage?: string;
    tags?: string[];
  }
): Promise<youtube_v3.Schema$Playlist> {
  return wrapApiCall("playlists.insert", () =>
    withBackoff(async () => {
      const response = await yt.playlists.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: params.title,
            description: params.description ?? "",
            defaultLanguage: params.defaultLanguage ?? "en",
            tags: params.tags ?? [],
          },
          status: { privacyStatus: params.privacyStatus },
        },
      });
      return response.data;
    }, "playlists.insert")
  );
}

export async function updatePlaylist(
  yt: YouTubeClient,
  playlistId: string,
  params: { title?: string; description?: string; privacyStatus?: string }
): Promise<youtube_v3.Schema$Playlist> {
  const current = await getPlaylist(yt, playlistId);
  return wrapApiCall("playlists.update", () =>
    withBackoff(async () => {
      const response = await yt.playlists.update({
        part: ["snippet", "status"],
        requestBody: {
          id: playlistId,
          snippet: {
            title: params.title ?? current?.snippet?.title,
            description: params.description ?? current?.snippet?.description,
          },
          status: {
            privacyStatus: params.privacyStatus ?? current?.status?.privacyStatus,
          },
        },
      });
      return response.data;
    }, "playlists.update")
  );
}

export async function deletePlaylist(
  yt: YouTubeClient,
  playlistId: string
): Promise<void> {
  return wrapApiCall("playlists.delete", () =>
    withBackoff(async () => {
      await yt.playlists.delete({ id: playlistId });
    }, "playlists.delete")
  );
}

export async function getPlaylist(
  yt: YouTubeClient,
  playlistId: string,
  parts: string[] = ["snippet", "status", "contentDetails"]
): Promise<youtube_v3.Schema$Playlist | null> {
  return wrapApiCall("playlists.list", () =>
    withBackoff(async () => {
      const response = await yt.playlists.list({ id: [playlistId], part: parts });
      return response.data.items?.[0] ?? null;
    }, "playlists.list")
  );
}

export async function listPlaylists(
  yt: YouTubeClient,
  params: { channelId?: string; maxResults?: number; pageToken?: string }
): Promise<{ items: youtube_v3.Schema$Playlist[]; nextPageToken?: string }> {
  return wrapApiCall("playlists.list", () =>
    withBackoff(async () => {
      const response = await yt.playlists.list({
        part: ["snippet", "status", "contentDetails"],
        channelId: params.channelId,
        mine: params.channelId ? undefined : true,
        maxResults: params.maxResults ?? 25,
        pageToken: params.pageToken,
      });
      return {
        items: response.data.items ?? [],
        nextPageToken: response.data.nextPageToken ?? undefined,
      };
    }, "playlists.list")
  );
}

export async function addVideoToPlaylist(
  yt: YouTubeClient,
  playlistId: string,
  videoId: string,
  position?: number
): Promise<youtube_v3.Schema$PlaylistItem> {
  return wrapApiCall("playlistItems.insert", () =>
    withBackoff(async () => {
      const response = await yt.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId },
            position,
          },
        },
      });
      return response.data;
    }, "playlistItems.insert")
  );
}

export async function removeVideoFromPlaylist(
  yt: YouTubeClient,
  playlistItemId: string
): Promise<void> {
  return wrapApiCall("playlistItems.delete", () =>
    withBackoff(async () => {
      await yt.playlistItems.delete({ id: playlistItemId });
    }, "playlistItems.delete")
  );
}

export async function reorderPlaylistItem(
  yt: YouTubeClient,
  playlistItemId: string,
  playlistId: string,
  newPosition: number
): Promise<youtube_v3.Schema$PlaylistItem> {
  const current = await wrapApiCall("playlistItems.list", () =>
    withBackoff(async () => {
      const response = await yt.playlistItems.list({
        part: ["snippet"],
        id: [playlistItemId],
      });
      return response.data.items?.[0] ?? null;
    }, "playlistItems.list")
  );

  return wrapApiCall("playlistItems.update", () =>
    withBackoff(async () => {
      const response = await yt.playlistItems.update({
        part: ["snippet"],
        requestBody: {
          id: playlistItemId,
          snippet: {
            ...current?.snippet,
            playlistId,
            position: newPosition,
          },
        },
      });
      return response.data;
    }, "playlistItems.update")
  );
}

export async function listPlaylistItems(
  yt: YouTubeClient,
  playlistId: string,
  params: { maxResults?: number; pageToken?: string }
): Promise<{ items: youtube_v3.Schema$PlaylistItem[]; nextPageToken?: string }> {
  return wrapApiCall("playlistItems.list", () =>
    withBackoff(async () => {
      const response = await yt.playlistItems.list({
        part: ["snippet", "contentDetails", "status"],
        playlistId,
        maxResults: params.maxResults ?? 50,
        pageToken: params.pageToken,
      });
      return {
        items: response.data.items ?? [],
        nextPageToken: response.data.nextPageToken ?? undefined,
      };
    }, "playlistItems.list")
  );
}
