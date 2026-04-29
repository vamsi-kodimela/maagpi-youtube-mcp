import fs from "node:fs";
import { logger } from "../logger.js";
import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeClient } from "./client.js";
import type { youtube_v3 } from "@googleapis/youtube";

export interface UploadVideoParams {
  filePath: string;
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus: "public" | "private" | "unlisted";
  language?: string;
  thumbnailPath?: string;
  notifySubscribers?: boolean;
}

export interface UpdateVideoParams {
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
}

export async function uploadVideo(
  yt: YouTubeClient,
  params: UploadVideoParams
): Promise<youtube_v3.Schema$Video> {
  const stat = fs.statSync(params.filePath);
  const media = fs.createReadStream(params.filePath);

  return wrapApiCall("videos.insert", () =>
    withBackoff(async () => {
      const response = await yt.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: params.title,
              description: params.description ?? "",
              tags: params.tags ?? [],
              categoryId: params.categoryId ?? "22",
              defaultLanguage: params.language ?? "en",
            },
            status: {
              privacyStatus: params.privacyStatus,
              selfDeclaredMadeForKids: false,
            },
          },
          media: {
            mimeType: "video/*",
            body: media,
          },
        },
        {
          onUploadProgress(evt: { bytesRead: number }) {
            const pct = Math.round((evt.bytesRead / stat.size) * 100);
            if (pct % 10 === 0) {
              logger.info(`Upload progress: ${pct}%`, {
                file: params.filePath,
                bytes: evt.bytesRead,
              });
            }
          },
        }
      );
      return response.data;
    }, "videos.insert")
  );
}

export async function getVideo(
  yt: YouTubeClient,
  videoId: string,
  parts: string[] = ["snippet", "status", "statistics", "contentDetails"]
): Promise<youtube_v3.Schema$Video | null> {
  return wrapApiCall("videos.list", () =>
    withBackoff(async () => {
      const response = await yt.videos.list({ id: [videoId], part: parts });
      return response.data.items?.[0] ?? null;
    }, "videos.list")
  );
}

export async function listVideos(
  yt: YouTubeClient,
  params: {
    channelId?: string;
    playlistId?: string;
    query?: string;
    maxResults?: number;
    pageToken?: string;
    order?: "date" | "rating" | "relevance" | "title" | "viewCount";
    publishedAfter?: string;
    publishedBefore?: string;
  }
): Promise<{ items: youtube_v3.Schema$Video[]; nextPageToken?: string; totalResults: number }> {
  return wrapApiCall("videos.list", () =>
    withBackoff(async () => {
      const forMine = !params.channelId && !params.query;
      const response = await yt.search.list({
        part: ["snippet"],
        channelId: params.channelId,
        q: params.query,
        forMine: forMine || undefined,
        maxResults: params.maxResults ?? 25,
        pageToken: params.pageToken,
        order: params.order ?? "date",
        publishedAfter: params.publishedAfter,
        publishedBefore: params.publishedBefore,
        type: ["video"],
      });

      const videoIds = (response.data.items ?? [])
        .map((i) => i.id?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        return { items: [], totalResults: 0 };
      }

      const detailsResponse = await yt.videos.list({
        part: ["snippet", "status", "statistics"],
        id: videoIds,
      });

      return {
        items: detailsResponse.data.items ?? [],
        nextPageToken: response.data.nextPageToken ?? undefined,
        totalResults: response.data.pageInfo?.totalResults ?? 0,
      };
    }, "videos.list")
  );
}

export async function updateVideo(
  yt: YouTubeClient,
  params: UpdateVideoParams
): Promise<youtube_v3.Schema$Video> {
  const current = await getVideo(yt, params.videoId, ["snippet"]);
  const currentSnippet = current?.snippet ?? {};

  return wrapApiCall("videos.update", () =>
    withBackoff(async () => {
      const response = await yt.videos.update({
        part: ["snippet"],
        requestBody: {
          id: params.videoId,
          snippet: {
            ...currentSnippet,
            title: params.title ?? currentSnippet.title,
            description: params.description ?? currentSnippet.description,
            tags: params.tags ?? currentSnippet.tags,
            categoryId: params.categoryId ?? currentSnippet.categoryId,
            defaultLanguage: params.defaultLanguage ?? currentSnippet.defaultLanguage,
          },
        },
      });
      return response.data;
    }, "videos.update")
  );
}

export async function deleteVideo(
  yt: YouTubeClient,
  videoId: string
): Promise<void> {
  return wrapApiCall("videos.delete", () =>
    withBackoff(async () => {
      await yt.videos.delete({ id: videoId });
    }, "videos.delete")
  );
}

export async function rateVideo(
  yt: YouTubeClient,
  videoId: string,
  rating: "like" | "dislike" | "none"
): Promise<void> {
  return wrapApiCall("videos.rate", () =>
    withBackoff(async () => {
      await yt.videos.rate({ id: videoId, rating });
    }, "videos.rate")
  );
}

export async function setThumbnail(
  yt: YouTubeClient,
  videoId: string,
  thumbnailPath: string
): Promise<youtube_v3.Schema$ThumbnailSetResponse> {
  const media = fs.createReadStream(thumbnailPath);

  return wrapApiCall("thumbnails.set", () =>
    withBackoff(async () => {
      const response = await yt.thumbnails.set({
        videoId,
        media: { mimeType: "image/jpeg", body: media },
      });
      return response.data;
    }, "thumbnails.set")
  );
}
